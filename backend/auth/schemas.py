from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=100)


class RegisterResponse(BaseModel):
    message: str
    user_id: str
    email: str
    timestamp: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str
    user: dict


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: dict
    version: str


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
