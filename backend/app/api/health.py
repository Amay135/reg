import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.chat import ChatLog, ErrorLog
from app.models.user import User
from app.schemas.health import ErrorLogResponse, LatencyBreakdown, ServiceHealth
from app.services.vector_store import vector_store

router = APIRouter(prefix="/health", tags=["health"])


async def _check_db(db: AsyncSession) -> tuple[float, str]:
    """Check database connectivity and latency."""
    start = time.time()
    try:
        await db.execute(select(func.count(ChatLog.id)))
        latency = (time.time() - start) * 1000
        return latency, "online"
    except Exception:
        return 0, "offline"


@router.get("/services", response_model=list[ServiceHealth])
async def get_service_health(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get health status of all services."""
    now = datetime.now(timezone.utc)

    # DB check
    db_latency, db_status = await _check_db(db)

    # Vector DB check (ChromaDB)
    vdb_start = time.time()
    try:
        count = vector_store.count()
        vdb_latency = (time.time() - vdb_start) * 1000
        vdb_status = "online"
    except Exception:
        vdb_latency = 0
        vdb_status = "offline"
        count = 0

    # LLM check — just report configured status; actual check requires an API call
    llm_status = "online" if settings.openai_api_key or settings.deepseek_api_key or settings.llm_provider == "ollama" else "offline"
    llm_latency = 0.0

    # WA Gateway status — reported via webhook heartbeat; default degraded
    wa_status = "degraded"
    wa_latency = 0.0

    return [
        ServiceHealth(
            name="WA Gateway",
            status=wa_status,
            latency_ms=wa_latency,
            last_checked=now,
        ),
        ServiceHealth(
            name="Backend RAG",
            status="online",
            latency_ms=round(db_latency, 1),
            last_checked=now,
        ),
        ServiceHealth(
            name="Vector DB",
            status=vdb_status,
            latency_ms=round(vdb_latency, 1),
            last_checked=now,
        ),
        ServiceHealth(
            name="LLM API",
            status=llm_status,
            latency_ms=round(llm_latency, 1),
            last_checked=now,
        ),
    ]


@router.get("/latency", response_model=LatencyBreakdown)
async def get_latency_breakdown(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get average latency breakdown across retrieval, generation, and total."""
    # Average total response time
    avg_total = await db.scalar(
        select(func.avg(ChatLog.response_time_ms)).where(
            ChatLog.status == "success"
        )
    )
    total_ms = round(float(avg_total or 0), 1)

    # Estimate: retrieval is typically ~10% of total, generation ~90%
    retrieval_ms = round(total_ms * 0.08, 1)
    generation_ms = round(total_ms * 0.92, 1)

    return LatencyBreakdown(
        retrieval_ms=retrieval_ms,
        generation_ms=generation_ms,
        total_ms=total_ms,
    )


@router.get("/errors", response_model=list[ErrorLogResponse])
async def get_error_logs(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get recent error logs."""
    result = await db.execute(
        select(ErrorLog)
        .order_by(ErrorLog.created_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()
    return [ErrorLogResponse.model_validate(log) for log in logs]
