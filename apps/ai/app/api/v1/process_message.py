import hmac
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.config import settings
from app.domain.orchestrator import ProcessMessageOrchestrator
from app.infra.core import CoreKnowledgeClient
from app.infra.embeddings.gemini import GeminiEmbeddingProvider
from app.infra.llm.gemini import GeminiLlmProvider

router = APIRouter(prefix="/internal/v1")

orchestrator = ProcessMessageOrchestrator(
    embedding_provider=GeminiEmbeddingProvider(),
    retriever=CoreKnowledgeClient(),
    llm_provider=GeminiLlmProvider(),
    quota_client=CoreKnowledgeClient(),
)


class ProcessMessageRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    org_id: UUID = Field(alias="orgId")
    message: str = Field(min_length=1, max_length=10_000)
    top_k: int = Field(default=5, alias="topK", ge=1, le=20)
    model: str | None = Field(default=None, max_length=100)


@router.post("/ai/process-message")
def process_message(
    body: ProcessMessageRequest,
    x_service_key: str | None = Header(default=None),
):
    if not hmac.compare_digest(x_service_key or "", settings.service_m2m_key):
        raise HTTPException(status_code=401, detail="invalid service key")

    try:
        return orchestrator.process_message(
            org_id=str(body.org_id),
            message=body.message,
            top_k=body.top_k,
            model=body.model,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
