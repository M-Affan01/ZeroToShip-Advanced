from jose import jwt
import uuid
from datetime import datetime, timedelta
from config import settings


def generate_access_token(user_id: str, email: str, roles: list[str] = None) -> tuple[str, int]:
    token_id = str(uuid.uuid4())
    now = datetime.utcnow()
    exp_time = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "email": email,
        "roles": roles or ["user"],
        "iat": int(now.timestamp()),
        "exp": int(exp_time.timestamp()),
        "jti": token_id,
        "iss": "auth-api",
        "aud": "microservices",
        "type": "access"
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    return token, expires_in


def generate_refresh_token(user_id: str, email: str = "", roles: list[str] = None) -> tuple[str, int]:
    token_id = str(uuid.uuid4())
    now = datetime.utcnow()
    exp_time = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": user_id,
        "email": email,
        "roles": roles or ["user"],
        "jti": token_id,
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(exp_time.timestamp()),
        "iss": "auth-api",
        "aud": "microservices"
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    expires_in = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    return token, expires_in


def verify_token(token: str, token_type: str = "access") -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )

        if payload.get("type") != token_type:
            raise ValueError(f"Invalid token type. Expected: {token_type}")

        return payload

    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")

    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")
