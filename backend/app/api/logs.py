from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.chat import ChatLog
from app.models.user import User
from app.schemas.chat import ChatLogListResponse, ChatLogResponse

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("", response_model=ChatLogListResponse)
async def list_logs(
    search: str = Query("", description="Search in question, answer, sender"),
    status: str = Query("", description="Filter by status"),
    date_from: str = Query("", description="Start date (YYYY-MM-DD)"),
    date_to: str = Query("", description="End date (YYYY-MM-DD)"),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get paginated chat logs with filters."""
    query = select(ChatLog)
    count_query = select(func.count(ChatLog.id))

    # Apply filters
    if search:
        search_filter = ChatLog.question.ilike(f"%{search}%") | \
            ChatLog.answer.ilike(f"%{search}%") | \
            ChatLog.sender.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if status:
        query = query.where(ChatLog.status == status)
        count_query = count_query.where(ChatLog.status == status)

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            query = query.where(ChatLog.created_at >= dt_from)
            count_query = count_query.where(ChatLog.created_at >= dt_from)
        except ValueError:
            pass

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to).replace(hour=23, minute=59, second=59)
            query = query.where(ChatLog.created_at <= dt_to)
            count_query = count_query.where(ChatLog.created_at <= dt_to)
        except ValueError:
            pass

    # Get total count
    total = await db.scalar(count_query)

    # Get paginated results
    query = query.order_by(ChatLog.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()

    return ChatLogListResponse(
        total=total or 0,
        page=page,
        limit=limit,
        logs=[ChatLogResponse.model_validate(log) for log in logs],
    )


@router.get("/{log_id}", response_model=ChatLogResponse)
async def get_log(
    log_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get a single chat log by ID."""
    result = await db.execute(select(ChatLog).where(ChatLog.id == log_id))
    log = result.scalar_one_or_none()

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat log tidak ditemukan",
        )

    return ChatLogResponse.model_validate(log)
