import logging
import sys
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from database import get_db, engine, Base, SessionLocal
from schemas import (
    AIQueryRequest, AIQueryResponse, AIFeedbackRequest, AIFeedbackResponse,
    HealthResponse, ErrorResponse
)
from query_service import process_query, process_query_stream, submit_feedback
from redis_client import redis_client
from cache_manager import init_cache_manager, cache_manager
from circuit_breaker import circuit_registry
from config import settings
from typing import Optional
from jose import jwt, JWTError

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","service":"%(name)s","message":"%(message)s"}',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Sentinel-Sync AI Assistant",
    description="Phase 3: LangChain + Milvus Vector Search for Campus Guidelines",
    version="1.0.0",
    openapi_tags=[
        {"name": "AI Query", "description": "AI query processing with streaming"},
        {"name": "Feedback", "description": "User feedback submission"},
        {"name": "Health", "description": "Service health checks"}
    ]
)

app.state.limiter = limiter

app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={"error": "RATE_LIMIT_EXCEEDED", "message": "Rate limit exceeded. Try again later."}
))

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    init_cache_manager(redis_client)
    logger.info("AI Assistant service started")


@app.on_event("shutdown")
async def shutdown():
    redis_client.client.close()
    engine.dispose()
    logger.info("AI Assistant service stopped")


def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_aud": False}
        )
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {str(e)}")


def get_current_user(authorization: str = None) -> Optional[str]:
    if not authorization:
        return None
    try:
        token = authorization.replace("Bearer ", "")
        payload = verify_jwt_token(token)
        return payload.get("sub")
    except Exception:
        return None


def require_auth(authorization: str = None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        token = authorization.replace("Bearer ", "")
        payload = verify_jwt_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    db_status = "connected"
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
    except Exception:
        db_status = "disconnected"

    redis_health = redis_client.get_health()

    milvus_status = "disconnected"
    try:
        from pymilvus import connections
        connections.connect(alias="default", host=settings.MILVUS_HOST, port=settings.MILVUS_PORT)
        milvus_status = "connected"
    except Exception:
        milvus_status = "disconnected"

    all_connected = db_status == "connected" and redis_health["status"] == "connected"
    status = "healthy" if all_connected else "degraded"

    return HealthResponse(
        status=status,
        timestamp=datetime.utcnow().isoformat(),
        services={
            "redis": redis_health["status"],
            "database": db_status,
            "milvus": milvus_status,
            "circuit_breakers": circuit_registry.get_all_states(),
            "cache": cache_manager.get_stats() if cache_manager else {}
        },
        version="1.0.0"
    )


@app.post("/api/ai/query", tags=["AI Query"])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def query_ai_endpoint(
    request: Request,
    query: AIQueryRequest,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    user_id = require_auth(authorization)

    if query.stream:
        return StreamingResponse(
            process_query_stream(db, query, user_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    else:
        try:
            result = await process_query(db, query, user_id)
            return result
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"AI query error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/ai/feedback", response_model=AIFeedbackResponse, status_code=201, tags=["Feedback"])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def submit_feedback_endpoint(
    request: Request,
    feedback: AIFeedbackRequest,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    user_id = require_auth(authorization)
    try:
        result = submit_feedback(db, feedback)
        return result
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        else:
            raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Feedback error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.SERVICE_PORT)
