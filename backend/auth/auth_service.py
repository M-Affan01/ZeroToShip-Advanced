import re
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy.orm import Session
from models import AuthUser
from password_hasher import hash_password, verify_password, validate_password_strength
from jwt_manager import generate_access_token, generate_refresh_token
from redis_client import redis_client
from config import settings


def validate_email(email: str) -> tuple[bool, str]:
    email = email.strip().lower()
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email):
        return False, email
    if len(email) > 255:
        return False, email
    return True, email


def register_user(db: Session, email: str, password: str, full_name: str) -> dict:
    is_valid, validated_email = validate_email(email)
    if not is_valid:
        raise ValueError("Invalid email format")

    is_strong, errors = validate_password_strength(password)
    if not is_strong:
        raise ValueError(f"Weak password: {', '.join(errors)}")

    existing = db.query(AuthUser).filter(AuthUser.email == validated_email).first()
    if existing:
        raise ValueError("Email already registered")

    sanitized_name = " ".join(word.capitalize() for word in full_name.strip().split())
    hashed_password = hash_password(password)

    user = AuthUser(
        id=uuid4(),
        email=validated_email,
        password_hash=hashed_password,
        full_name=sanitized_name,
        roles=["user"],
        is_active=True,
        is_verified=False,
        failed_login_attempts=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    redis_client.publish("event.user.created", {
        "user_id": str(user.id),
        "email": user.email,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {
        "message": "User created successfully",
        "user_id": str(user.id),
        "email": user.email,
        "timestamp": datetime.utcnow().isoformat()
    }


def login_user(db: Session, email: str, password: str, ip_address: str = "") -> dict:
    user = db.query(AuthUser).filter(AuthUser.email == email.lower().strip()).first()

    if not user:
        raise ValueError("Invalid email or password")

    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining = int((user.locked_until - datetime.utcnow()).total_seconds())
        raise ValueError(f"Account locked. Try again in {remaining} seconds")

    if not verify_password(password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.MAX_FAILED_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            user.failed_login_attempts = 0
            db.commit()
            redis_client.publish("auth.login.locked", {
                "user_id": str(user.id),
                "timestamp": datetime.utcnow().isoformat()
            })
            raise ValueError("Account locked due to multiple failed attempts")
        db.commit()
        raise ValueError("Invalid email or password")

    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    db.commit()

    user_roles = user.roles or ["user"]

    access_token, expires_in = generate_access_token(
        user_id=str(user.id),
        email=user.email,
        roles=user_roles
    )

    refresh_token, _ = generate_refresh_token(
        user_id=str(user.id),
        email=user.email,
        roles=user_roles
    )

    redis_client.publish("event.auth.login", {
        "user_id": str(user.id),
        "timestamp": datetime.utcnow().isoformat(),
        "ip": ip_address
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "refresh_token": refresh_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "roles": user_roles
        }
    }
