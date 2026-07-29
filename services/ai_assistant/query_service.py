import re
import uuid
import time
import json
import hashlib
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any, AsyncIterator
from sqlalchemy.orm import Session
from models import AIQuery, AIFeedback
from schemas import AIQueryRequest, AIFeedbackRequest
from vector_store import vector_retriever
from langchain_service import langchain_service
from redis_client import redis_client
from cache_manager import cache_manager

logger = logging.getLogger(__name__)


def validate_query(query: str) -> tuple[bool, str]:
    query = query.strip()

    if len(query) < 1:
        return False, "Query cannot be empty"
    if len(query) > 500:
        return False, "Query must not exceed 500 characters"

    query = re.sub(r'[\x00-\x1f\x7f]', '', query)

    malicious_patterns = [
        r'<script', r'javascript:', r'DROP TABLE', r'DELETE FROM',
        r'SELECT.*FROM', r'INSERT INTO', r'UNION SELECT'
    ]

    for pattern in malicious_patterns:
        if re.search(pattern, query, re.IGNORECASE):
            return False, "Query contains prohibited content"

    return True, query


def sanitize_query(query: str) -> str:
    query = re.sub(r'<[^>]+>', '', query)
    query = re.sub(r'[^\w\s\.\,\?\-\!\:\'\"]', ' ', query)
    query = ' '.join(query.split())
    return query


def validate_session_id(session_id: Optional[str]) -> Optional[str]:
    if not session_id:
        return None
    try:
        uuid.UUID(session_id)
        return session_id
    except ValueError:
        logger.warning(f"Invalid session_id format: {session_id}")
        return None


async def process_query(
    db: Session,
    request: AIQueryRequest,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    start_time = time.time()

    is_valid, result = validate_query(request.query)
    if not is_valid:
        raise ValueError(result)

    query_text = sanitize_query(request.query)

    if not query_text:
        raise ValueError("Query cannot be empty after sanitization")

    query_id = uuid.uuid4()
    session_id = validate_session_id(request.session_id)

    cache_key = f"ai_query:{hashlib.md5(query_text.encode()).hexdigest()}"
    if cache_manager:
        cache_state, cached = await cache_manager.get(cache_key)
        if cache_state == "hit":
            logger.info(f"Cache hit for query: {query_text[:50]}...")
            return cached

    db_query = AIQuery(
        id=query_id,
        query_text=query_text,
        session_id=uuid.UUID(session_id) if session_id else None,
        user_id=uuid.UUID(user_id) if user_id else uuid.uuid4(),
        created_at=datetime.utcnow()
    )
    db.add(db_query)
    db.commit()

    search_results = await vector_retriever.search(query_text)

    if not search_results:
        response_text = (
            "I don't have enough information to answer that question. "
            "Please try rephrasing your query or contact the campus information desk."
        )
        context_sources = []
        confidence = 0.0
    else:
        response_text = await langchain_service.generate_response(query_text, search_results)
        context_sources = [
            {
                "source": doc.get("source", "Unknown"),
                "section": doc.get("section", ""),
                "relevance": doc.get("score", 0),
                "excerpt": doc.get("text", "")[:200]
            }
            for doc in search_results
        ]
        confidence = sum(doc.get("score", 0) for doc in search_results) / len(search_results)

    processing_time_ms = int((time.time() - start_time) * 1000)

    db_query.response_text = response_text
    db_query.context_sources = context_sources
    db_query.confidence = confidence
    db_query.processing_time_ms = processing_time_ms
    db.commit()

    response = {
        "query_id": str(query_id),
        "response": response_text,
        "context": context_sources,
        "confidence": confidence,
        "processing_time_ms": processing_time_ms
    }

    if cache_manager:
        await cache_manager.set(cache_key, response, ttl=3600)

    redis_client.publish("ai.events", {
        "event_type": "ai.response.generated",
        "query_id": str(query_id),
        "confidence": confidence,
        "processing_time_ms": processing_time_ms,
        "timestamp": datetime.utcnow().isoformat()
    })

    return response


async def process_query_stream(
    db: Session,
    request: AIQueryRequest,
    user_id: Optional[str] = None
) -> AsyncIterator[str]:
    start_time = time.time()

    is_valid, result = validate_query(request.query)
    if not is_valid:
        yield f"data: {json.dumps({'type': 'error', 'data': {'message': result}})}\n\n"
        return

    query_text = sanitize_query(request.query)

    if not query_text:
        yield f"data: {json.dumps({'type': 'error', 'data': {'message': 'Query cannot be empty'}})}\n\n"
        return

    query_id = uuid.uuid4()
    session_id = validate_session_id(request.session_id)

    db_query = AIQuery(
        id=query_id,
        query_text=query_text,
        session_id=uuid.UUID(session_id) if session_id else None,
        user_id=uuid.UUID(user_id) if user_id else uuid.uuid4(),
        created_at=datetime.utcnow()
    )
    db.add(db_query)
    db.commit()

    search_results = await vector_retriever.search(query_text)

    if not search_results:
        response_text = (
            "I don't have enough information to answer that question. "
            "Please try rephrasing your query or contact the campus information desk."
        )
        yield f"data: {json.dumps({'type': 'chunk', 'data': {'content': response_text, 'query_id': str(query_id)}})}\n\n"

        processing_time_ms = int((time.time() - start_time) * 1000)
        db_query.response_text = response_text
        db_query.context_sources = []
        db_query.confidence = 0.0
        db_query.processing_time_ms = processing_time_ms
        db.commit()

        redis_client.publish("ai.events", {
            "event_type": "ai.response.generated",
            "query_id": str(query_id),
            "confidence": 0.0,
            "processing_time_ms": processing_time_ms,
            "timestamp": datetime.utcnow().isoformat()
        })

        yield f"data: {json.dumps({'type': 'complete', 'data': {'query_id': str(query_id), 'response': response_text, 'context': [], 'confidence': 0.0, 'processing_time_ms': processing_time_ms}})}\n\n"
        return

    full_response = ""
    async for chunk in langchain_service.generate_stream(query_text, search_results):
        full_response += chunk
        yield f"data: {json.dumps({'type': 'chunk', 'data': {'content': chunk, 'query_id': str(query_id)}})}\n\n"

    processing_time_ms = int((time.time() - start_time) * 1000)

    context_sources = [
        {
            "source": doc.get("source", "Unknown"),
            "section": doc.get("section", ""),
            "relevance": doc.get("score", 0),
            "excerpt": doc.get("text", "")[:200]
        }
        for doc in search_results
    ]
    confidence = sum(doc.get("score", 0) for doc in search_results) / len(search_results)

    db_query.response_text = full_response
    db_query.context_sources = context_sources
    db_query.confidence = confidence
    db_query.processing_time_ms = processing_time_ms
    db.commit()

    redis_client.publish("ai.events", {
        "event_type": "ai.response.generated",
        "query_id": str(query_id),
        "confidence": confidence,
        "processing_time_ms": processing_time_ms,
        "timestamp": datetime.utcnow().isoformat()
    })

    yield f"data: {json.dumps({'type': 'complete', 'data': {'query_id': str(query_id), 'response': full_response, 'context': context_sources, 'confidence': confidence, 'processing_time_ms': processing_time_ms}})}\n\n"


def submit_feedback(
    db: Session,
    request: AIFeedbackRequest
) -> dict:
    query = db.query(AIQuery).filter(AIQuery.id == request.query_id).first()
    if not query:
        raise ValueError("Query not found")

    feedback = AIFeedback(
        id=uuid.uuid4(),
        query_id=uuid.UUID(request.query_id),
        rating=request.rating,
        feedback=request.feedback,
        created_at=datetime.utcnow()
    )

    db.add(feedback)
    db.commit()

    return {
        "message": "Feedback recorded successfully",
        "feedback_id": str(feedback.id)
    }
