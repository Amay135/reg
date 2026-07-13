from app.config import settings


class EmbeddingService:
    """Embedding service supporting both local sentence-transformers and OpenAI."""

    def __init__(self):
        self._model = None
        self._provider = settings.embedding_provider

    @property
    def model(self):
        if self._model is None:
            if self._provider == "local":
                from sentence_transformers import SentenceTransformer

                self._model = SentenceTransformer(settings.embedding_model)
            else:
                self._model = OpenAIEmbeddingWrapper()
        return self._model

    def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts."""
        if self._provider == "local":
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        else:
            return self.model.embed(texts)

    def embed_query(self, text: str) -> list[float]:
        """Generate embedding for a single query."""
        return self.embed([text])[0]


class OpenAIEmbeddingWrapper:
    """Thin wrapper around OpenAI embeddings API."""

    def embed(self, texts: list[str]) -> list[list[float]]:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        response = client.embeddings.create(
            model="text-embedding-3-small", input=texts
        )
        return [d.embedding for d in response.data]


# Singleton
embedding_service = EmbeddingService()
