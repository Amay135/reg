from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.knowledge import router as knowledge_router
from app.api.logs import router as logs_router
from app.api.rag import router as rag_router
from app.api.stats import router as stats_router
from app.api.webhook import router as webhook_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(stats_router)
api_router.include_router(logs_router)
api_router.include_router(rag_router)
api_router.include_router(health_router)
api_router.include_router(knowledge_router)
api_router.include_router(webhook_router)
