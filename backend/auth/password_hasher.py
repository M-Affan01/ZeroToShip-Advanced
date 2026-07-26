import re
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
    bcrypt__ident="2b"
)

COMMON_PASSWORDS = {
    "123456", "password", "123456789", "12345678", "12345",
    "qwerty", "abc123", "password1", "1234567", "admin",
    "welcome", "123123", "qwerty123", "letmein", "monkey",
    "dragon", "master", "sunshine", "princess", "iloveyou"
}


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError):
        return False


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    errors = []

    if len(password) < 8:
        errors.append("Password must be at least 8 characters")

    if len(password) > 128:
        errors.append("Password must be less than 128 characters")

    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter")

    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter")

    if not re.search(r"\d", password):
        errors.append("Password must contain at least one digit")

    if not re.search(r"[@$!%*?&]", password):
        errors.append("Password must contain at least one special character (@$!%*?&)")

    if password.lower() in COMMON_PASSWORDS:
        errors.append("Password is too common")

    return len(errors) == 0, errors
