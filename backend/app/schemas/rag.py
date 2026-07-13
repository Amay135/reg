from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SimilarityBucket(BaseModel):
    range: str  # "0.0-0.2"
    count: int


class RAGQualityStats(BaseModel):
    avg_similarity_score: float
    avg_docs_per_query: float
    similarity_distribution: list[SimilarityBucket]
    positive_feedback_ratio: float
    total_feedback: int


class LowScoreQuestion(BaseModel):
    id: UUID
    question: str
    similarity_score: float
    created_at: datetime


class RAGQueryRequest(BaseModel):
    question: str
    sender: str


class RAGQueryResponse(BaseModel):
    answer: str
    retrieved_docs: list[dict]
    similarity_score: float
    response_time_ms: float
    status: str
