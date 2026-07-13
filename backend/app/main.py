from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="RAG WhatsApp Chatbot API",
    description="Backend API untuk chatbot RAG berbasis WhatsApp dengan dashboard monitoring",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routes
app.include_router(api_router)


@app.get("/")
async def root():
    return {
        "name": "RAG WhatsApp Chatbot API",
        "version": "1.0.0",
        "docs": "/docs",
    }
