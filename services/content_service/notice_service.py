import re
import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from models import Notice, NoticeStateHistory
from schemas import NoticeCreate, NoticeUpdate
from redis_client import redis_client
from cache_manager import cache_manager
from state_machine import notice_sm, NoticeState

logger = logging.getLogger(__name__)


def sanitize_html(content: str) -> str:
    content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<iframe[^>]*>.*?</iframe>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'on\w+\s*=\s*["\'][^"\']*["\']', '', content, flags=re.IGNORECASE)
    content = re.sub(r'javascript\s*:', '', content, flags=re.IGNORECASE)
    content = re.sub(r'<[^>]+>', '', content)
    return content.strip()


def validate_notice_data(data: dict) -> tuple[bool, str]:
    title = data.get("title", "").strip()
    if len(title) < 3:
        return False, "Title must be at least 3 characters"
    if len(title) > 200:
        return False, "Title must not exceed 200 characters"

    content = data.get("content", "").strip()
    if len(content) < 10:
        return False, "Content must be at least 10 characters"
    if len(content) > 5000:
        return False, "Content must not exceed 5000 characters"

    expires_at = data.get("expires_at")
    if expires_at:
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            except ValueError:
                return False, "Invalid date format"
        if expires_at <= datetime.utcnow():
            return False, "Expiration date must be in the future"

    return True, ""


def check_duplicate_notice(db: Session, title: str, content: str) -> Optional[dict]:
    cutoff = datetime.utcnow() - timedelta(hours=24)
    existing = db.query(Notice).filter(
        Notice.title.ilike(f"%{title}%"),
        Notice.status != "deleted",
        Notice.created_at > cutoff
    ).first()
    return {"id": str(existing.id), "created_at": existing.created_at.isoformat()} if existing else None


def create_notice(db: Session, notice_data: NoticeCreate, user_id: Optional[str] = None) -> dict:
    is_valid, error_msg = validate_notice_data(notice_data.model_dump())
    if not is_valid:
        raise ValueError(error_msg)

    duplicate = check_duplicate_notice(db, notice_data.title, notice_data.content)
    if duplicate:
        raise ValueError("Similar notice was created within the last 24 hours")

    status = NoticeState.DRAFT.value
    if notice_data.priority in ["high", "urgent"] or notice_data.category == "emergency":
        status = NoticeState.PUBLISHED.value

    notice = Notice(
        id=uuid.uuid4(),
        title=notice_data.title.strip(),
        content=sanitize_html(notice_data.content.strip()),
        category=notice_data.category.value,
        priority=notice_data.priority.value,
        status=status,
        expires_at=notice_data.expires_at,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        created_by=uuid.UUID(user_id) if user_id else None,
        updated_by=uuid.UUID(user_id) if user_id else None,
        version=1
    )

    db.add(notice)
    db.commit()
    db.refresh(notice)

    state_history = NoticeStateHistory(
        notice_id=notice.id,
        from_state="none",
        to_state=status,
        trigger_name="create",
        user_id=uuid.UUID(user_id) if user_id else None,
        created_at=datetime.utcnow()
    )
    db.add(state_history)
    db.commit()

    redis_client.publish("content.events", {
        "event_type": "content.created",
        "entity_type": "notice",
        "entity_id": str(notice.id),
        "data": {
            "title": notice.title,
            "category": notice.category,
            "priority": notice.priority,
            "status": notice.status
        },
        "timestamp": datetime.utcnow().isoformat()
    })

    if cache_manager:
        cache_manager.invalidate_pattern("cache:notices:*")

    return {
        "id": str(notice.id),
        "title": notice.title,
        "content": notice.content,
        "category": notice.category,
        "priority": notice.priority,
        "status": notice.status,
        "expires_at": notice.expires_at.isoformat() if notice.expires_at else None,
        "created_at": notice.created_at.isoformat(),
        "updated_at": notice.updated_at.isoformat(),
        "version": notice.version
    }


def get_notice(db: Session, notice_id: str) -> Optional[dict]:
    if cache_manager:
        cache_state, cached = cache_manager.get(f"cache:notices:{notice_id}")
        if cache_state == "hit":
            return cached

    notice = db.query(Notice).filter(Notice.id == notice_id, Notice.status != "deleted").first()
    if not notice:
        return None

    result = {
        "id": str(notice.id),
        "title": notice.title,
        "content": notice.content,
        "category": notice.category,
        "priority": notice.priority,
        "status": notice.status,
        "expires_at": notice.expires_at.isoformat() if notice.expires_at else None,
        "created_at": notice.created_at.isoformat(),
        "updated_at": notice.updated_at.isoformat(),
        "version": notice.version
    }

    if cache_manager:
        cache_manager.set(f"cache:notices:{notice_id}", result, ttl=300)

    return result


def get_notices(db: Session, page: int = 1, page_size: int = 20, status: Optional[str] = None) -> dict:
    cache_key = f"cache:notices:list:{page}:{page_size}:{status or 'all'}"

    if cache_manager:
        cache_state, cached = cache_manager.get(cache_key)
        if cache_state == "hit":
            return cached

    query = db.query(Notice).filter(Notice.status != "deleted")

    if status:
        query = query.filter(Notice.status == status)

    total = query.count()
    notices = query.order_by(Notice.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    result = {
        "notices": [
            {
                "id": str(n.id),
                "title": n.title,
                "content": n.content,
                "category": n.category,
                "priority": n.priority,
                "status": n.status,
                "expires_at": n.expires_at.isoformat() if n.expires_at else None,
                "created_at": n.created_at.isoformat(),
                "updated_at": n.updated_at.isoformat(),
                "version": n.version
            }
            for n in notices
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }

    if cache_manager:
        cache_manager.set(cache_key, result, ttl=60)

    return result


def update_notice(db: Session, notice_id: str, update_data: NoticeUpdate, user_id: Optional[str] = None) -> dict:
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise ValueError("Notice not found")

    if notice.status == "archived":
        raise ValueError("Archived notices cannot be modified")

    if notice.status == "deleted":
        raise ValueError("Deleted notices cannot be modified")

    update_dict = update_data.model_dump(exclude_unset=True)

    if "status" in update_dict:
        new_status = update_dict["status"]
        if not notice_sm.can_transition(notice.status, new_status):
            valid = notice_sm.get_valid_transitions(notice.status)
            raise ValueError(f"Cannot transition from '{notice.status}' to '{new_status}'. Valid transitions: {valid}")

    changes = {}
    for field, value in update_dict.items():
        old_value = getattr(notice, field)
        if hasattr(value, 'value'):
            value = value.value
        if field == "content":
            value = sanitize_html(value)
        if old_value != value:
            changes[field] = {"from": str(old_value), "to": str(value)}
            setattr(notice, field, value)

    if changes:
        notice.updated_at = datetime.utcnow()
        notice.version += 1
        notice.updated_by = uuid.UUID(user_id) if user_id else None

        state_change = NoticeStateHistory(
            notice_id=notice.id,
            from_state=notice.status if "status" not in changes else changes["status"]["from"],
            to_state=notice.status,
            trigger_name="update",
            user_id=uuid.UUID(user_id) if user_id else None,
            extra_data={"changes": changes},
            created_at=datetime.utcnow()
        )
        db.add(state_change)
        db.commit()

        redis_client.publish("content.events", {
            "event_type": "content.updated",
            "entity_type": "notice",
            "entity_id": str(notice.id),
            "changes": changes,
            "timestamp": datetime.utcnow().isoformat()
        })

        if cache_manager:
            cache_manager.invalidate(f"cache:notices:{notice_id}")
            cache_manager.invalidate_pattern("cache:notices:list:*")

    return {
        "id": str(notice.id),
        "updated_fields": list(changes.keys()),
        "updated_at": notice.updated_at.isoformat(),
        "version": notice.version
    }


def delete_notice(db: Session, notice_id: str, user_id: Optional[str] = None) -> dict:
    notice = db.query(Notice).filter(Notice.id == notice_id, Notice.status != "deleted").first()
    if not notice:
        raise ValueError("Notice not found")

    old_status = notice.status
    notice.status = "deleted"
    notice.deleted_at = datetime.utcnow()
    notice.updated_at = datetime.utcnow()
    notice.updated_by = uuid.UUID(user_id) if user_id else None

    state_history = NoticeStateHistory(
        notice_id=notice.id,
        from_state=old_status,
        to_state="deleted",
        trigger_name="delete",
        user_id=uuid.UUID(user_id) if user_id else None,
        created_at=datetime.utcnow()
    )
    db.add(state_history)
    db.commit()

    redis_client.publish("content.events", {
        "event_type": "content.deleted",
        "entity_type": "notice",
        "entity_id": str(notice.id),
        "timestamp": datetime.utcnow().isoformat()
    })

    if cache_manager:
        cache_manager.invalidate(f"cache:notices:{notice_id}")
        cache_manager.invalidate_pattern("cache:notices:list:*")

    return {
        "message": "Notice marked for deletion",
        "id": str(notice.id),
        "deleted_at": notice.deleted_at.isoformat()
    }
