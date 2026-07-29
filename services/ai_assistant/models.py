import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from database import Base


class AIQuery(Base):
    __tablename__ = "ai_queries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query_text = Column(Text, nullable=False)
    session_id = Column(UUID(as_uuid=True), nullable=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    response_text = Column(Text, nullable=True)
    context_sources = Column(JSONB, nullable=True)
    confidence = Column(Float, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("idx_ai_queries_user", "user_id"),
        Index("idx_ai_queries_created", "created_at"),
    )


class AIFeedback(Base):
    __tablename__ = "ai_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query_id = Column(UUID(as_uuid=True), ForeignKey("ai_queries.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("idx_ai_feedback_query", "query_id"),
    )
