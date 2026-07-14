import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings


class VectorStore:
    """ChromaDB vector store wrapper for document indexing and retrieval."""

    def __init__(self):
        self._client = None
        self._collection = None

    @property
    def client(self) -> chromadb.PersistentClient:
        if self._client is None:
            self._client = chromadb.PersistentClient(
                path=settings.chroma_persist_dir,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
        return self._client

    @property
    def collection(self):
        if self._collection is None:
            self._collection = self.client.get_or_create_collection(
                name="rag_documents",
                metadata={"hnsw:space": "cosine"},
            )
        return self._collection

    def add_documents(
        self,
        doc_id: str,
        chunks: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict] | None = None,
    ) -> None:
        """Add chunked documents to the vector store."""
        chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]

        if metadatas is None:
            metadatas = [{"doc_id": doc_id, "chunk_index": i} for i in range(len(chunks))]

        self.collection.add(
            ids=chunk_ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
        )

    def search(
        self, query_embedding: list[float], top_k: int = 5
    ) -> list[dict]:
        """Search for similar documents. Returns list of {doc_id, content, similarity_score}."""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        docs = []
        if results["ids"] and results["ids"][0]:
            for i in range(len(results["ids"][0])):
                distance = results["distances"][0][i] if results["distances"] else 0
                # ChromaDB cosine distance → convert to similarity (1 - distance)
                similarity = 1.0 - distance

                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                docs.append(
                    {
                        "doc_id": metadata.get("doc_id", "unknown"),
                        "content": results["documents"][0][i]
                        if results["documents"]
                        else "",
                        "similarity_score": round(similarity, 4),
                    }
                )
        return docs

    def delete_document(self, doc_id: str) -> None:
        """Delete all chunks for a document by doc_id metadata filter."""
        # ChromaDB doesn't support delete by metadata filter easily,
        # so we get all items and delete matching ones
        try:
            results = self.collection.get(
                where={"doc_id": doc_id},
                include=[],
            )
            if results["ids"]:
                self.collection.delete(ids=results["ids"])
        except Exception:
            pass  # Collection may not have that filter capability; ignore

    def count(self) -> int:
        """Return total number of chunks in the collection."""
        return self.collection.count()


# Singleton
vector_store = VectorStore()
