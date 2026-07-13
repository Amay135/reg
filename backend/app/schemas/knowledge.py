from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class KnowledgeDocResponse(BaseModel):
    id: UUID
    filename: str
    size_bytes: int
    chunks: int
    indexed_at: datetime | None

    class Config:
        from_attributes = True


class KnowledgeListResponse(BaseModel):
    total: int
    docs: list[KnowledgeDocResponse]


class ReindexResponse(BaseModel):
    message: str
    total_docs: int
    total_chunks: int
