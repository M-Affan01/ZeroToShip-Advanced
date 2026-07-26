import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from database import Base


class AuthUser(Base):
    __tablename__ = "auth_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    roles = Column(ARRAY(String), default=["user"])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_auth_users_created_at", "created_at"),
    )
