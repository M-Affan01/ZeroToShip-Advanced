from dotenv import load_dotenv
load_dotenv()

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    SECRET_KEY: str = "sentinel-sync-secret-key-change-in-production-32+"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = "postgresql://sentinel_admin:S3nt1n3l%232026@localhost:5432/sentinel_sync"

    REDIS_HOST: str = "redis-event-bus"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = ""

    MAX_FAILED_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15

    CORS_ORIGINS: str = "*"
    RATE_LIMIT_PER_MINUTE: int = 5

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
