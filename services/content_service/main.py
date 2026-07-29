import logging
import sys
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Query, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from database import get_db, engine, Base, SessionLocal
from schemas import (
    NoticeCreate, NoticeUpdate, NoticeResponse, NoticeListResponse,
    EquipmentCreate, EquipmentUpdate, EquipmentResponse, EquipmentListResponse,
    HealthResponse, ErrorResponse
)
from notice_service import create_notice, get_notice, get_notices, update_notice, delete_notice
from equipment_service import create_equipment, get_equipment, get_equipment_list, update_equipment, delete_equipment
from redis_client import redis_client
from cache_manager import init_cache_manager
from event_consumer import init_event_consumer
from scheduler import init_scheduler
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
    title="Sentinel-Sync Content Service",
    description="Phase 3: CRUD Operations for Notices and Equipment",
    version="1.0.0",
    openapi_tags=[
        {"name": "Notices", "description": "Notice CRUD operations"},
        {"name": "Equipment", "description": "Equipment CRUD operations"},
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


async def handle_content_event(event: dict):
    event_type = event.get("data", {}).get("event_type", "")
    logger.info(f"Received event: {event_type}")


@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    init_cache_manager(redis_client)
    consumer = init_event_consumer(redis_client)
    consumer.subscribe("content.events", handle_content_event)
    consumer.subscribe("equipment.events", handle_content_event)
    await consumer.start()
    scheduler = init_scheduler(SessionLocal)
    await scheduler.start()
    logger.info("Content service started")


@app.on_event("shutdown")
async def shutdown():
    from event_consumer import event_consumer
    from scheduler import scheduler
    if event_consumer:
        await event_consumer.stop()
    if scheduler:
        await scheduler.stop()
    redis_client.client.close()
    engine.dispose()
    logger.info("Content service stopped")


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

    all_connected = db_status == "connected" and redis_health["status"] == "connected"
    status = "healthy" if all_connected else "degraded"

    return HealthResponse(
        status=status,
        timestamp=datetime.utcnow().isoformat(),
        services={
            "redis": redis_health["status"],
            "database": db_status,
            "circuit_breakers": circuit_registry.get_all_states()
        },
        version="1.0.0"
    )


@app.post("/api/notices", response_model=NoticeResponse, status_code=201, tags=["Notices"])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_notice_endpoint(
    request: Request,
    notice: NoticeCreate,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    user_id = require_auth(authorization)
    try:
        result = create_notice(db, notice, user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Create notice error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/notices/{notice_id}", response_model=NoticeResponse, tags=["Notices"])
@limiter.limit("100/minute")
async def get_notice_endpoint(
    request: Request,
    notice_id: str,
    db: Session = Depends(get_db)
):
    result = get_notice(db, notice_id)
    if not result:
        raise HTTPException(status_code=404, detail="Notice not found")
    return result


@app.get("/api/notices", response_model=NoticeListResponse, tags=["Notices"])
@limiter.limit("100/minute")
async def list_notices_endpoint(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    result = get_notices(db, page, page_size, status)
    return result


@app.patch("/api/notices/{notice_id}", response_model=NoticeResponse, tags=["Notices"])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def update_notice_endpoint(
    request: Request,
    notice_id: str,
    notice: NoticeUpdate,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    user_id = require_auth(authorization)
    try:
        result = update_notice(db, notice_id, notice, user_id)
        return result
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        elif "cannot" in error_msg.lower() or "archived" in error_msg.lower():
            raise HTTPException(status_code=409, detail=error_msg)
        else:
            raise HTTPException(status_code=400, detail=error_msg)


@app.delete("/api/notices/{notice_id}", tags=["Notices"])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def delete_notice_endpoint(
    request: Request,
    notice_id: str,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    user_id = require_auth(authorization)
    try:
        result = delete_notice(db, notice_id, user_id)
        return result
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        else:
            raise HTTPException(status_code=400, detail=error_msg)


@app.post("/api/equipment", response_model=EquipmentResponse, status_code=201, tags=["Equipment"])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_equipment_endpoint(
    request: Request,
    equipment: EquipmentCreate,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    user_id = require_auth(authorization)
    try:
        result = create_equipment(db, equipment, user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Create equipment error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/equipment/{equipment_id}", response_model=EquipmentResponse, tags=["Equipment"])
@limiter.limit("100/minute")
async def get_equipment_endpoint(
    request: Request,
    equipment_id: str,
    db: Session = Depends(get_db)
):
    result = get_equipment(db, equipment_id)
    if not result:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return result


@app.get("/api/equipment", response_model=EquipmentListResponse, tags=["Equipment"])
@limiter.limit("100/minute")
async def list_equipment_endpoint(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    result = get_equipment_list(db, page, page_size, status)
    return result


@app.patch("/api/equipment/{equipment_id}", response_model=EquipmentResponse, tags=["Equipment"])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def update_equipment_endpoint(
    request: Request,
    equipment_id: str,
    equipment: EquipmentUpdate,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    user_id = require_auth(authorization)
    try:
        result = update_equipment(db, equipment_id, equipment, user_id)
        return result
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        elif "cannot" in error_msg.lower():
            raise HTTPException(status_code=409, detail=error_msg)
        else:
            raise HTTPException(status_code=400, detail=error_msg)


@app.delete("/api/equipment/{equipment_id}", tags=["Equipment"])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def delete_equipment_endpoint(
    request: Request,
    equipment_id: str,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    user_id = require_auth(authorization)
    try:
        result = delete_equipment(db, equipment_id, user_id)
        return result
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        else:
            raise HTTPException(status_code=400, detail=error_msg)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.SERVICE_PORT)
