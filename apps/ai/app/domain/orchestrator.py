from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from app.config import settings
from app.infra.embeddings.gemini import EMBEDDING_DIMENSIONS, EmbeddingProvider
from app.infra.llm.provider import LlmProvider, assert_model_allowed

PROMPT_PATH = Path(__file__).parent / "prompts" / "v1_grounded_process_message.md"


class KnowledgeRetriever(Protocol):
    def retrieve_chunks(
        self,
        *,
        org_id: str,
        embedding: list[float],
        top_k: int,
    ) -> list[dict]:
        ...


@dataclass(frozen=True)
class PromptTemplate:
    version: str
    text: str


class ProcessMessageOrchestrator:
    def __init__(
        self,
        *,
        embedding_provider: EmbeddingProvider,
        retriever: KnowledgeRetriever,
        llm_provider: LlmProvider,
        prompt: PromptTemplate | None = None,
    ):
        self.embedding_provider = embedding_provider
        self.retriever = retriever
        self.llm_provider = llm_provider
        self.prompt = prompt or load_prompt()

    def process_message(
        self,
        *,
        org_id: str,
        message: str,
        top_k: int = 5,
        model: str | None = None,
    ) -> dict:
        selected_model = model or default_model()
        assert_model_allowed(selected_model, settings.ai_model_allowlist)
        query_embedding = self._embed_query(message)
        chunks = self.retriever.retrieve_chunks(
            org_id=org_id,
            embedding=query_embedding,
            top_k=top_k,
        )

        if not chunks:
            return {
                "replyText": (
                    "Minh chua co du thong tin trong du lieu hien co de tra loi "
                    "chinh xac. Minh se chuyen cho doi ngu ho tro kiem tra them."
                ),
                "citations": [],
                "toolsUsed": [],
                "promptVersion": self.prompt.version,
                "model": selected_model,
                "tokens": {"prompt": 0, "completion": 0, "total": 0},
                "escalate": True,
            }

        messages = [
            {"role": "user", "content": self._build_grounded_prompt(message, chunks)}
        ]
        completion = self.llm_provider.complete(model=selected_model, messages=messages)

        return {
            "replyText": completion.text,
            "citations": [
                _citation_for(index, chunk)
                for index, chunk in enumerate(chunks, 1)
            ],
            "toolsUsed": [],
            "promptVersion": self.prompt.version,
            "model": completion.model,
            "tokens": {
                "prompt": completion.prompt_tokens,
                "completion": completion.completion_tokens,
                "total": completion.total_tokens,
            },
            "escalate": False,
        }

    def _embed_query(self, message: str) -> list[float]:
        embeddings = self.embedding_provider.embed_texts([message])
        if len(embeddings) != 1:
            raise RuntimeError("Embedding provider returned unexpected count")
        embedding = embeddings[0]
        if len(embedding) != EMBEDDING_DIMENSIONS:
            raise RuntimeError("Embedding provider returned unexpected dimensions")
        return embedding

    def _build_grounded_prompt(self, message: str, chunks: list[dict]) -> str:
        context = "\n\n".join(
            f"[{index}] {chunk.get('content', '')}"
            for index, chunk in enumerate(chunks, 1)
        )
        return (
            f"{self.prompt.text}\n\n"
            "Knowledge chunks:\n"
            f"{context}\n\n"
            "Customer message:\n"
            f"{message}"
        )


def load_prompt(path: Path = PROMPT_PATH) -> PromptTemplate:
    text = path.read_text(encoding="utf-8").strip()
    first_line, _, rest = text.partition("\n")
    prefix = "prompt_version:"
    if not first_line.startswith(prefix):
        raise RuntimeError("Prompt file must start with prompt_version")
    version = first_line.removeprefix(prefix).strip()
    if not version:
        raise RuntimeError("Prompt version is empty")
    return PromptTemplate(version=version, text=rest.strip())


def default_model(allowlist: str | None = None) -> str:
    raw_allowlist = allowlist if allowlist is not None else settings.ai_model_allowlist
    models = [
        item.strip()
        for item in raw_allowlist.split(",")
        if item.strip()
    ]
    if not models:
        raise RuntimeError("AI_MODEL_ALLOWLIST must include at least one model")
    return models[0]


def _citation_for(index: int, chunk: dict) -> dict:
    return {
        "index": index,
        "sourceType": _first_present(chunk, "sourceType", "source_type"),
        "sourceId": str(_first_present(chunk, "sourceId", "source_id")),
        "chunkIndex": _first_present(chunk, "chunkIndex", "chunk_index"),
        "score": _first_present(chunk, "score", "similarity"),
    }


def _first_present(chunk: dict, first_key: str, second_key: str):
    if first_key in chunk:
        return chunk[first_key]
    return chunk.get(second_key)
