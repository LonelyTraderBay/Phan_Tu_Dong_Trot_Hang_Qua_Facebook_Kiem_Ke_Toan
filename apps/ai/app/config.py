from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    service_m2m_key: str = "dev-m2m-key-change-me"
    core_base_url: str = "http://127.0.0.1:4701"
    ai_model_allowlist: str = "gemini-2.0-flash,advisor-stub"
    ai_relevance_min_similarity: float = Field(default=0.75, ge=0.0, le=1.0)
    # APP_ENV=local (default) allows stub embeddings when GEMINI_API_KEY empty.
    # Production must set APP_ENV=production (or NODE_ENV=production) — stub refused.
    app_env: str = "local"
    node_env: str | None = None
    # Explicit opt-in for stub when APP_ENV is not localish; ignored in production.
    embeddings_allow_stub: bool = False
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    gemini_embed_model: str = "text-embedding-004"
    llm_daily_spend_cap_usd: float = Field(default=0.0, ge=0.0)
    llm_monthly_spend_cap_usd: float = Field(default=0.0, ge=0.0)
    gemini_usd_per_1k_input_tokens: float = Field(default=0.0001, ge=0.0)
    gemini_usd_per_1k_output_tokens: float = Field(default=0.0004, ge=0.0)
    llm_spend_counter_path: str = ".llm-spend.json"
    sentry_dsn: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
