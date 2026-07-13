from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ServiceHealth(BaseModel):
    name: str
    status: str  # "online" | "degraded" | "offline"
    latency_ms: float
    last_checked: datetime


class LatencyBreakdown(BaseModel):
    retrieval_ms: float
    generation_ms: float
    total_ms: float


class ErrorLogResponse(BaseModel):
    id: UUID
    service: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True
