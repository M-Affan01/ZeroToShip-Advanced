from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db, engine, Base
from schemas import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, HealthResponse, ErrorResponse
from auth_service import register_user, login_user
from redis_client import redis_client
from config import settings

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Sentinel-Sync Auth API",
    description="Phase 2: Headless Authentication & Event Bus Infrastructure",
    version="1.0.0"
)

app.state.limiter = limiter

app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={"detail": "Rate limit exceeded. Try again later."}
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


@app.post("/register", response_model=RegisterResponse, status_code=201)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        result = register_user(db, request.email, request.password, request.full_name)
        return result
    except ValueError as e:
        error_msg = str(e)
        if "already registered" in error_msg:
            raise HTTPException(status_code=409, detail=error_msg)
        elif "Weak password" in error_msg or "Invalid email" in error_msg:
            raise HTTPException(status_code=400, detail=error_msg)
        else:
            raise HTTPException(status_code=400, detail=error_msg)


@app.post("/login", response_model=LoginResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def login(request: Request, login_req: LoginRequest, db: Session = Depends(get_db)):
    try:
        ip_address = request.client.host if request.client else "unknown"
        result = login_user(db, login_req.email, login_req.password, ip_address)
        return result
    except ValueError as e:
        error_msg = str(e)
        if "locked" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        else:
            raise HTTPException(status_code=401, detail=error_msg)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    db_status = "connected"
    try:
        from database import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        db_status = "disconnected"

    redis_status = redis_client.get_connection_status()

    all_connected = db_status == "connected" and redis_status == "connected"
    status = "healthy" if all_connected else "degraded"

    return HealthResponse(
        status=status,
        timestamp=datetime.utcnow().isoformat(),
        services={
            "redis": redis_status,
            "database": db_status
        },
        version="1.0.0"
    )
