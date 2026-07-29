from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AIQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    session_id: Optional[str] = None
    stream: bool = True


class AIContextSource(BaseModel):
    source: str
    section: Optional[str] = None
    relevance: float
    excerpt: str


class AIQueryResponse(BaseModel):
    query_id: str
    response: str
    context: List[AIContextSource]
    confidence: float
    processing_time_ms: int


class AIFeedbackRequest(BaseModel):
    query_id: str
    rating: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = None


class AIFeedbackResponse(BaseModel):
    message: str
    feedback_id: str


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: dict
    version: str


class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[dict] = None
