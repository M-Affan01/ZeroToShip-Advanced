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
    SERVICE_NAME: str = "ai-assistant"
    SERVICE_PORT: int = 8002

    GROQ_API_KEY: Optional[str] = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    MILVUS_HOST: str = "milvus"
    MILVUS_PORT: int = 19530
    MILVUS_COLLECTION: str = "campus_guidelines"

    RATE_LIMIT_PER_MINUTE: int = 30
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    VECTOR_TOP_K: int = 5
    SIMILARITY_THRESHOLD: float = 0.65

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
