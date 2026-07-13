from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class RetrievedDoc(BaseModel):
    doc_id: str
    content: str
    similarity_score: float


class ChatLogResponse(BaseModel):
    id: UUID
    sender: str
    question: str
    answer: str
    retrieved_docs: list[RetrievedDoc]
    response_time_ms: int
    status: str  # "success" | "failed" | "low_confidence"
    feedback: str | None = None  # "like" | "dislike"
    created_at: datetime

    class Config:
        from_attributes = True


class ChatLogListResponse(BaseModel):
    total: int
    page: int
    limit: int
    logs: list[ChatLogResponse]
