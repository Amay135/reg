from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.chat import ChatLog
from app.models.user import User
from app.schemas.rag import LowScoreQuestion, RAGQualityStats, SimilarityBucket

router = APIRouter(prefix="/rag", tags=["rag-quality"])


@router.get("/quality", response_model=RAGQualityStats)
async def get_rag_quality(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get RAG quality statistics.

    Similarity scores are extracted from the retrieved_docs JSONB field
    by iterating over logs in Python, since PostgreSQL can't aggregate across
    nested JSONB array elements natively.
    """
    result = await db.execute(
        select(ChatLog).where(
            ChatLog.retrieved_docs.isnot(None),
            func.jsonb_array_length(ChatLog.retrieved_docs) > 0,
        )
    )
    logs_with_docs = result.scalars().all()

    # Compute stats in Python from retrieved_docs
    all_scores = []
    doc_counts = []
    for log in logs_with_docs:
        docs = log.retrieved_docs or []
        doc_counts.append(len(docs))
        for doc in docs:
            if isinstance(doc, dict) and "similarity_score" in doc:
                all_scores.append(doc["similarity_score"])

    avg_score = sum(all_scores) / len(all_scores) if all_scores else 0.0
    avg_docs = sum(doc_counts) / len(doc_counts) if doc_counts else 0.0

    # Similarity distribution (buckets)
    buckets = {
        "0.0-0.2": 0,
        "0.2-0.4": 0,
        "0.4-0.6": 0,
        "0.6-0.8": 0,
        "0.8-1.0": 0,
    }
    for score in all_scores:
        if score < 0.2:
            buckets["0.0-0.2"] += 1
        elif score < 0.4:
            buckets["0.2-0.4"] += 1
        elif score < 0.6:
            buckets["0.4-0.6"] += 1
        elif score < 0.8:
            buckets["0.6-0.8"] += 1
        else:
            buckets["0.8-1.0"] += 1

    distribution = [
        SimilarityBucket(range=r, count=c) for r, c in buckets.items()
    ]

    # Feedback ratio
    total_feedback = await db.scalar(
        select(func.count(ChatLog.id)).where(ChatLog.feedback.isnot(None))
    )
    positive_feedback = await db.scalar(
        select(func.count(ChatLog.id)).where(ChatLog.feedback == "like")
    )
    feedback_ratio = (
        positive_feedback / total_feedback
        if total_feedback and total_feedback > 0
        else 0.0
    )

    return RAGQualityStats(
        avg_similarity_score=round(avg_score, 4),
        avg_docs_per_query=round(avg_docs, 1),
        similarity_distribution=distribution,
        positive_feedback_ratio=round(feedback_ratio, 4),
        total_feedback=total_feedback or 0,
    )


@router.get("/low-score", response_model=list[LowScoreQuestion])
async def get_low_score_questions(
    limit: int = Query(10, ge=1, le=50),
    threshold: float = Query(0.5, ge=0.0, le=1.0),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get questions with low retrieval similarity scores."""
    # Get logs with retrieved_docs and find ones where max similarity is below threshold
    result = await db.execute(
        select(ChatLog)
        .where(
            ChatLog.retrieved_docs.isnot(None),
            func.jsonb_array_length(ChatLog.retrieved_docs) > 0,
        )
        .order_by(ChatLog.created_at.desc())
        .limit(200)  # fetch a batch to filter in Python
    )
    logs = result.scalars().all()

    low_score = []
    for log in logs:
        docs = log.retrieved_docs or []
        max_score = 0.0
        for doc in docs:
            if isinstance(doc, dict) and "similarity_score" in doc:
                max_score = max(max_score, doc["similarity_score"])

        if max_score < threshold:
            low_score.append(
                LowScoreQuestion(
                    id=log.id,
                    question=log.question,
                    similarity_score=round(max_score, 4),
                    created_at=log.created_at,
                )
            )

    return low_score[:limit]
