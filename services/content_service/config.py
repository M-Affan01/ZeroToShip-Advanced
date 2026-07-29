from dotenv import load_dotenv
load_dotenv()

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    SECRET_KEY: str = "sentinel-sync-secret-key-change-in-production-32+"
    JWT_ALGORITHM: str = "HS256"

    DATABASE_URL: str = "postgresql://sentinel_admin:S3nt1n3l%232026@localhost:5432/sentinel_sync"

    REDIS_HOST: str = "redis-event-bus"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = ""

    CORS_ORIGINS: str = "*"
    SERVICE_NAME: str = "content-service"
    SERVICE_PORT: int = 8001
    RATE_LIMIT_PER_MINUTE: int = 60

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
