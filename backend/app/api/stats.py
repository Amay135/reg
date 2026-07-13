from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.chat import ChatLog
from app.models.user import User
from app.schemas.stats import HourlyVolume, OverviewStats, TopQuestion

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/overview", response_model=OverviewStats)
async def get_overview(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get overview statistics for the dashboard."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    yesterday_end = today_start

    # Today's conversations
    today_count = await db.scalar(
        select(func.count(ChatLog.id)).where(ChatLog.created_at >= today_start)
    )

    # Yesterday's conversations
    yesterday_count = await db.scalar(
        select(func.count(ChatLog.id)).where(
            ChatLog.created_at >= yesterday_start,
            ChatLog.created_at < yesterday_end,
        )
    )

    # Unique users today
    unique_users = await db.scalar(
        select(func.count(func.distinct(ChatLog.sender))).where(
            ChatLog.created_at >= today_start
        )
    )

    # Average response time today
    avg_response = await db.scalar(
        select(func.avg(ChatLog.response_time_ms)).where(
            ChatLog.created_at >= today_start,
            ChatLog.status == "success",
        )
    )

    return OverviewStats(
        total_conversations_today=today_count or 0,
        total_conversations_yesterday=yesterday_count or 0,
        unique_users_today=unique_users or 0,
        avg_response_time_ms=round(float(avg_response or 0), 1),
    )


@router.get("/hourly", response_model=list[HourlyVolume])
async def get_hourly_volume(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get chat volume grouped by hour for today."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    result = await db.execute(
        select(
            func.to_char(ChatLog.created_at, "HH24:00").label("hour"),
            func.count(ChatLog.id).label("count"),
        )
        .where(ChatLog.created_at >= today_start)
        .group_by(text("hour"))
        .order_by(text("hour"))
    )

    hourly_data = {f"{h:02d}:00": 0 for h in range(24)}
    for row in result:
        hourly_data[row.hour] = row.count

    return [
        HourlyVolume(hour=hour, count=count) for hour, count in hourly_data.items()
    ]


@router.get("/top-questions", response_model=list[TopQuestion])
async def get_top_questions(
    limit: int = 5,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get most frequently asked questions."""
    result = await db.execute(
        select(ChatLog.question, func.count(ChatLog.id).label("count"))
        .group_by(ChatLog.question)
        .order_by(text("count DESC"))
        .limit(limit)
    )

    return [TopQuestion(question=row.question, count=row.count) for row in result]
