import re
import uuid
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from models import Equipment, EquipmentStateHistory
from schemas import EquipmentCreate, EquipmentUpdate
from redis_client import redis_client
from cache_manager import cache_manager
from state_machine import equipment_sm, EquipmentState

logger = logging.getLogger(__name__)


def sanitize_text(text: str) -> str:
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'on\w+\s*=\s*["\'][^"\']*["\']', '', text, flags=re.IGNORECASE)
    return text.strip()


def validate_equipment_data(data: dict) -> tuple[bool, str]:
    name = data.get("name", "").strip()
    if len(name) < 2:
        return False, "Name must be at least 2 characters"
    if len(name) > 100:
        return False, "Name must not exceed 100 characters"

    location = data.get("location")
    if location and len(location) > 200:
        return False, "Location must not exceed 200 characters"

    maintenance_schedule = data.get("maintenance_schedule")
    if maintenance_schedule:
        if isinstance(maintenance_schedule, str):
            try:
                maintenance_schedule = datetime.fromisoformat(maintenance_schedule.replace('Z', '+00:00'))
            except ValueError:
                return False, "Invalid date format"

    return True, ""


def create_equipment(db: Session, equipment_data: EquipmentCreate, user_id: Optional[str] = None) -> dict:
    is_valid, error_msg = validate_equipment_data(equipment_data.model_dump())
    if not is_valid:
        raise ValueError(error_msg)

    equipment = Equipment(
        id=uuid.uuid4(),
        name=sanitize_text(equipment_data.name.strip()),
        type=equipment_data.type.value,
        location=sanitize_text(equipment_data.location) if equipment_data.location else None,
        status=equipment_data.status.value,
        maintenance_schedule=equipment_data.maintenance_schedule,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        created_by=uuid.UUID(user_id) if user_id else None,
        updated_by=uuid.UUID(user_id) if user_id else None,
        version=1,
        status_changed_at=datetime.utcnow()
    )

    db.add(equipment)
    db.commit()
    db.refresh(equipment)

    state_history = EquipmentStateHistory(
        equipment_id=equipment.id,
        from_state="none",
        to_state=equipment.status,
        trigger_name="create",
        user_id=uuid.UUID(user_id) if user_id else None,
        created_at=datetime.utcnow()
    )
    db.add(state_history)
    db.commit()

    redis_client.publish("equipment.events", {
        "event_type": "equipment.created",
        "entity_type": "equipment",
        "entity_id": str(equipment.id),
        "data": {
            "name": equipment.name,
            "type": equipment.type,
            "status": equipment.status,
            "location": equipment.location
        },
        "timestamp": datetime.utcnow().isoformat()
    })

    if cache_manager:
        cache_manager.invalidate_pattern("cache:equipment:*")

    return {
        "id": str(equipment.id),
        "name": equipment.name,
        "type": equipment.type,
        "location": equipment.location,
        "status": equipment.status,
        "maintenance_schedule": equipment.maintenance_schedule.isoformat() if equipment.maintenance_schedule else None,
        "created_at": equipment.created_at.isoformat(),
        "updated_at": equipment.updated_at.isoformat(),
        "version": equipment.version
    }


def get_equipment(db: Session, equipment_id: str) -> Optional[dict]:
    if cache_manager:
        cache_state, cached = cache_manager.get(f"cache:equipment:{equipment_id}")
        if cache_state == "hit":
            return cached

    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.status != "retired"
    ).first()
    if not equipment:
        return None

    result = {
        "id": str(equipment.id),
        "name": equipment.name,
        "type": equipment.type,
        "location": equipment.location,
        "status": equipment.status,
        "maintenance_schedule": equipment.maintenance_schedule.isoformat() if equipment.maintenance_schedule else None,
        "created_at": equipment.created_at.isoformat(),
        "updated_at": equipment.updated_at.isoformat(),
        "version": equipment.version
    }

    if cache_manager:
        cache_manager.set(f"cache:equipment:{equipment_id}", result, ttl=300)

    return result


def get_equipment_list(db: Session, page: int = 1, page_size: int = 20, status: Optional[str] = None) -> dict:
    cache_key = f"cache:equipment:list:{page}:{page_size}:{status or 'all'}"

    if cache_manager:
        cache_state, cached = cache_manager.get(cache_key)
        if cache_state == "hit":
            return cached

    query = db.query(Equipment).filter(Equipment.status != "retired")

    if status:
        query = query.filter(Equipment.status == status)

    total = query.count()
    items = query.order_by(Equipment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    result = {
        "equipment": [
            {
                "id": str(e.id),
                "name": e.name,
                "type": e.type,
                "location": e.location,
                "status": e.status,
                "maintenance_schedule": e.maintenance_schedule.isoformat() if e.maintenance_schedule else None,
                "image_url": e.image_url if hasattr(e, 'image_url') else None,
                "created_at": e.created_at.isoformat(),
                "updated_at": e.updated_at.isoformat(),
                "version": e.version
            }
            for e in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }

    if cache_manager:
        cache_manager.set(cache_key, result, ttl=60)

    return result


def update_equipment(db: Session, equipment_id: str, update_data: EquipmentUpdate, user_id: Optional[str] = None) -> dict:
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise ValueError("Equipment not found")

    update_dict = update_data.model_dump(exclude_unset=True)

    if "status" in update_dict:
        new_status = update_dict["status"]
        if hasattr(new_status, 'value'):
            new_status = new_status.value
        if not equipment_sm.can_transition(equipment.status, new_status):
            valid = equipment_sm.get_valid_transitions(equipment.status)
            raise ValueError(f"Cannot transition from '{equipment.status}' to '{new_status}'. Valid transitions: {valid}")

    changes = {}
    for field, value in update_dict.items():
        old_value = getattr(equipment, field)
        if hasattr(value, 'value'):
            value = value.value
        if field in ["name", "location"] and value:
            value = sanitize_text(value)
        if old_value != value:
            changes[field] = {"from": str(old_value), "to": str(value)}
            setattr(equipment, field, value)

    if changes:
        equipment.updated_at = datetime.utcnow()
        equipment.version += 1
        equipment.updated_by = uuid.UUID(user_id) if user_id else None

        if "status" in changes:
            equipment.status_changed_at = datetime.utcnow()

        state_history = EquipmentStateHistory(
            equipment_id=equipment.id,
            from_state=changes.get("status", {}).get("from", equipment.status),
            to_state=equipment.status,
            trigger_name="update",
            user_id=uuid.UUID(user_id) if user_id else None,
            extra_data={"changes": changes},
            created_at=datetime.utcnow()
        )
        db.add(state_history)
        db.commit()

        redis_client.publish("equipment.events", {
            "event_type": "equipment.status_changed",
            "entity_type": "equipment",
            "entity_id": str(equipment.id),
            "changes": changes,
            "timestamp": datetime.utcnow().isoformat()
        })

        if cache_manager:
            cache_manager.invalidate(f"cache:equipment:{equipment_id}")
            cache_manager.invalidate_pattern("cache:equipment:list:*")

    return {
        "id": str(equipment.id),
        "updated_fields": list(changes.keys()),
        "updated_at": equipment.updated_at.isoformat(),
        "version": equipment.version
    }


def delete_equipment(db: Session, equipment_id: str, user_id: Optional[str] = None) -> dict:
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise ValueError("Equipment not found")

    old_status = equipment.status
    equipment.status = "retired"
    equipment.deleted_at = datetime.utcnow()
    equipment.updated_at = datetime.utcnow()
    equipment.updated_by = uuid.UUID(user_id) if user_id else None

    state_history = EquipmentStateHistory(
        equipment_id=equipment.id,
        from_state=old_status,
        to_state="retired",
        trigger_name="delete",
        user_id=uuid.UUID(user_id) if user_id else None,
        created_at=datetime.utcnow()
    )
    db.add(state_history)
    db.commit()

    redis_client.publish("equipment.events", {
        "event_type": "equipment.deleted",
        "entity_type": "equipment",
        "entity_id": str(equipment.id),
        "timestamp": datetime.utcnow().isoformat()
    })

    if cache_manager:
        cache_manager.invalidate(f"cache:equipment:{equipment_id}")
        cache_manager.invalidate_pattern("cache:equipment:list:*")

    return {
        "message": "Equipment marked as retired",
        "id": str(equipment.id),
        "deleted_at": equipment.deleted_at.isoformat()
    }
