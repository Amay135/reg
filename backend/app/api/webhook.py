from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.chat import ChatLog
from app.schemas.rag import RAGQueryRequest, RAGQueryResponse
from app.services.rag_pipeline import query_rag

router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.post("/whatsapp", response_model=RAGQueryResponse)
async def whatsapp_webhook(
    body: RAGQueryRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Receive a message from the WA Gateway, process through RAG, and return the answer.
    The WA Gateway calls this endpoint when a user sends a message.
    """
    if not body.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pertanyaan tidak boleh kosong",
        )

    # Run RAG pipeline
    result = query_rag(body.question)

    # Log to database
    log = ChatLog(
        sender=body.sender,
        question=body.question,
        answer=result["answer"],
        retrieved_docs=result["retrieved_docs"],
        response_time_ms=result["response_time_ms"],
        status=result["status"],
    )
    db.add(log)
    await db.commit()

    return RAGQueryResponse(
        answer=result["answer"],
        retrieved_docs=result["retrieved_docs"],
        similarity_score=result["similarity_score"],
        response_time_ms=float(result["response_time_ms"]),
        status=result["status"],
    )


@router.post("/feedback/{log_id}")
async def submit_feedback(
    log_id: str,
    feedback: str,  # "like" or "dislike"
    db: AsyncSession = Depends(get_db),
):
    """Submit feedback for a chat response. Called by WA Gateway when user rates."""
    from uuid import UUID

    from sqlalchemy import select

    result = await db.execute(
        select(ChatLog).where(ChatLog.id == UUID(log_id))
    )
    log = result.scalar_one_or_none()

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat log tidak ditemukan",
        )

    if feedback not in ("like", "dislike"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feedback harus 'like' atau 'dislike'",
        )

    log.feedback = feedback
    await db.commit()

    return {"message": "Feedback berhasil disimpan", "log_id": str(log.id), "feedback": feedback}
