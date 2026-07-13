from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://raguser:ragpass@localhost:5432/ragchatbot"

    # JWT
    secret_key: str = "change-me-to-a-random-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # LLM
    llm_provider: str = "openai"  # "openai", "deepseek", or "ollama"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek-chat"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"

    # Embedding
    embedding_provider: str = "local"  # "openai" or "local"
    embedding_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

    # ChromaDB
    chroma_persist_dir: str = "./chroma_data"

    # Admin seed
    admin_email: str = "admin@example.com"
    admin_password: str = "admin123"

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Upload
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
