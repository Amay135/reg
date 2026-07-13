import time

from app.services.embedding import embedding_service
from app.services.llm import llm_service
from app.services.vector_store import vector_store

SYSTEM_PROMPT = """Kamu adalah asisten chatbot yang membantu menjawab pertanyaan berdasarkan dokumen yang diberikan.
Gunakan HANYA informasi dari potongan dokumen yang disediakan untuk menjawab pertanyaan.
Jika informasi tidak tersedia dalam potongan dokumen, katakan dengan sopan bahwa kamu tidak dapat menemukan jawaban yang relevan.
Jawab dalam Bahasa Indonesia yang jelas dan ramah.
Jangan mengarang informasi yang tidak ada dalam dokumen."""


def build_prompt(question: str, contexts: list[dict]) -> str:
    """Build the user prompt with retrieved context."""
    context_text = ""
    for i, doc in enumerate(contexts, 1):
        context_text += f"\n[Potongan {i}]\n{doc['content']}\n"

    return f"""Berikut adalah potongan dokumen yang relevan:
{context_text}

Pertanyaan pengguna: {question}

Jawaban:"""


def query_rag(question: str) -> dict:
    """
    Full RAG pipeline: embed → retrieve → generate.
    Returns dict with answer, retrieved_docs, similarity_score, response_time_ms, status.
    """
    start_time = time.time()

    try:
        # 1. Embed the question
        query_embedding = embedding_service.embed_query(question)

        # 2. Retrieve similar documents
        retrieved_docs = vector_store.search(query_embedding, top_k=5)

        if not retrieved_docs:
            elapsed_ms = (time.time() - start_time) * 1000
            return {
                "answer": "Maaf, saya tidak dapat menemukan informasi yang relevan untuk menjawab pertanyaan Anda.",
                "retrieved_docs": [],
                "similarity_score": 0.0,
                "response_time_ms": round(elapsed_ms),
                "status": "low_confidence",
            }

        # 3. Build prompt and generate
        user_prompt = build_prompt(question, retrieved_docs)
        answer = llm_service.generate(SYSTEM_PROMPT, user_prompt)

        # 4. Calculate metrics
        avg_similarity = (
            sum(d["similarity_score"] for d in retrieved_docs) / len(retrieved_docs)
            if retrieved_docs
            else 0.0
        )
        elapsed_ms = (time.time() - start_time) * 1000

        # Determine status
        if avg_similarity >= 0.6:
            status = "success"
        elif avg_similarity >= 0.3:
            status = "low_confidence"
        else:
            status = "failed"

        return {
            "answer": answer,
            "retrieved_docs": retrieved_docs,
            "similarity_score": round(avg_similarity, 4),
            "response_time_ms": round(elapsed_ms),
            "status": status,
        }

    except Exception as e:
        elapsed_ms = (time.time() - start_time) * 1000
        return {
            "answer": f"Maaf, terjadi kesalahan dalam memproses pertanyaan Anda. Silakan coba lagi nanti.",
            "retrieved_docs": [],
            "similarity_score": 0.0,
            "response_time_ms": round(elapsed_ms),
            "status": "failed",
        }
