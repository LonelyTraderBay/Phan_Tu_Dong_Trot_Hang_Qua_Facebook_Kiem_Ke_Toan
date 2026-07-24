from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    service_m2m_key: str = "dev-m2m-key-change-me"
    core_base_url: str = "http://127.0.0.1:3001"
    ai_model_allowlist: str = "gemini-2.0-flash"
    ai_relevance_min_similarity: float = Field(default=0.75, ge=0.0, le=1.0)
    gemini_api_key: str | None = None
    gemini_embed_model: str = "text-embedding-004"
    sentry_dsn: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
