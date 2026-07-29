from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class NoticeCategory(str, Enum):
    academic = "academic"
    administrative = "administrative"
    event = "event"
    emergency = "emergency"
    general = "general"


class NoticePriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class NoticeStatus(str, Enum):
    draft = "draft"
    published = "published"
    archived = "archived"
    deleted = "deleted"


class EquipmentType(str, Enum):
    computer = "computer"
    projector = "projector"
    furniture = "furniture"
    lab_equipment = "lab_equipment"
    audio_visual = "audio_visual"


class EquipmentStatus(str, Enum):
    available = "available"
    in_use = "in_use"
    maintenance = "maintenance"
    retired = "retired"


class NoticeCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10, max_length=5000)
    category: NoticeCategory = NoticeCategory.general
    priority: NoticePriority = NoticePriority.medium
    expires_at: Optional[datetime] = None


class NoticeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    content: Optional[str] = Field(None, min_length=10, max_length=5000)
    category: Optional[NoticeCategory] = None
    priority: Optional[NoticePriority] = None
    status: Optional[NoticeStatus] = None
    expires_at: Optional[datetime] = None


class NoticeResponse(BaseModel):
    id: str
    title: str
    content: str
    category: str
    priority: str
    status: str
    expires_at: Optional[str] = None
    created_at: str
    updated_at: str
    version: int


class NoticeListResponse(BaseModel):
    notices: List[NoticeResponse]
    total: int
    page: int
    page_size: int


class EquipmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: EquipmentType
    location: Optional[str] = Field(None, max_length=200)
    status: EquipmentStatus = EquipmentStatus.available
    maintenance_schedule: Optional[datetime] = None


class EquipmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    type: Optional[EquipmentType] = None
    location: Optional[str] = Field(None, max_length=200)
    status: Optional[EquipmentStatus] = None
    maintenance_schedule: Optional[datetime] = None


class EquipmentResponse(BaseModel):
    id: str
    name: str
    type: str
    location: Optional[str] = None
    status: str
    maintenance_schedule: Optional[str] = None
    created_at: str
    updated_at: str
    version: int


class EquipmentListResponse(BaseModel):
    equipment: List[EquipmentResponse]
    total: int
    page: int
    page_size: int


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: dict
    version: str


class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[dict] = None
