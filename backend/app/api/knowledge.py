import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.chat import KnowledgeDoc
from app.models.user import User
from app.schemas.knowledge import (
    KnowledgeDocResponse,
    KnowledgeListResponse,
    ReindexResponse,
)
from app.services.document import document_service
from app.services.embedding import embedding_service
from app.services.vector_store import vector_store

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("", response_model=KnowledgeListResponse)
async def list_documents(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get all indexed documents."""
    result = await db.execute(
        select(KnowledgeDoc).order_by(KnowledgeDoc.indexed_at.desc())
    )
    docs = result.scalars().all()
    total = await db.scalar(select(func.count(KnowledgeDoc.id)))

    return KnowledgeListResponse(
        total=total or 0,
        docs=[KnowledgeDocResponse.model_validate(doc) for doc in docs],
    )


@router.post("/upload")
async def upload_document(
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Upload and index a document."""
    # Validate file size
    if file.size and file.size > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Ukuran file melebihi batas {settings.max_upload_size_mb}MB",
        )

    # Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in (".pdf", ".docx", ".txt"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format file {ext} tidak didukung. Gunakan PDF, DOCX, atau TXT",
        )

    # Save file
    os.makedirs(settings.upload_dir, exist_ok=True)
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{file.filename}"
    file_path = os.path.join(settings.upload_dir, safe_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Parse and chunk
    try:
        full_text, chunks = document_service.parse_and_chunk(file_path)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal memproses dokumen: {str(e)}",
        )

    if not chunks:
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dokumen kosong atau tidak dapat diproses",
        )

    # Generate embeddings and store in vector DB
    try:
        embeddings = embedding_service.embed(chunks)
        vector_store.add_documents(doc_id, chunks, embeddings)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal mengindeks dokumen: {str(e)}",
        )

    # Save record
    now = datetime.now(timezone.utc)
    knowledge_doc = KnowledgeDoc(
        id=doc_id,
        filename=file.filename or "unknown",
        file_path=file_path,
        size_bytes=file.size or 0,
        chunks=len(chunks),
        indexed_at=now,
    )
    db.add(knowledge_doc)
    await db.commit()
    await db.refresh(knowledge_doc)

    return {
        "message": "Dokumen berhasil diupload dan diindeks",
        "doc": KnowledgeDocResponse.model_validate(knowledge_doc),
    }


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Delete a document from the knowledge base."""
    # Find the document record
    result = await db.execute(
        select(KnowledgeDoc).where(KnowledgeDoc.id == doc_id)
    )
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dokumen tidak ditemukan",
        )

    # Remove from vector store
    try:
        vector_store.delete_document(doc_id)
    except Exception:
        pass  # best-effort; don't block DB cleanup

    # Remove file from disk
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass  # best-effort

    # Remove DB record
    await db.delete(doc)
    await db.commit()

    return {"message": f"Dokumen '{doc.filename}' berhasil dihapus"}


@router.post("/reindex", response_model=ReindexResponse)
async def reindex_all(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Re-index all documents in the knowledge base."""
    result = await db.execute(select(KnowledgeDoc))
    docs = result.scalars().all()

    total_chunks = 0
    for doc in docs:
        if not os.path.exists(doc.file_path):
            continue

        try:
            # Remove old vectors
            vector_store.delete_document(str(doc.id))

            # Re-parse and chunk
            _, chunks = document_service.parse_and_chunk(doc.file_path)
            if chunks:
                embeddings = embedding_service.embed(chunks)
                vector_store.add_documents(str(doc.id), chunks, embeddings)
                doc.chunks = len(chunks)
                doc.indexed_at = datetime.now(timezone.utc)
                total_chunks += len(chunks)
        except Exception:
            continue

    await db.commit()

    return ReindexResponse(
        message=f"Berhasil re-index {len(docs)} dokumen",
        total_docs=len(docs),
        total_chunks=total_chunks,
    )
