import json
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from app.config import settings
from app.infra.embeddings.gemini import EMBEDDING_DIMENSIONS, EmbeddingProvider
from app.infra.llm.provider import LlmProvider, assert_model_allowed

PROMPT_PATH = Path(__file__).parent / "prompts" / "v1_grounded_process_message.md"
SAFE_ESCALATE_REPLY = (
    "Minh chua co du thong tin trong du lieu hien co de tra loi chinh xac. "
    "Minh se chuyen cho doi ngu ho tro kiem tra them."
)
FACTUAL_PRODUCT_TERMS = (
    "bao nhieu",
    "gia",
    "mau",
    "size",
    "kich co",
    "ton",
    "con hang",
    "san pham",
    "doi tra",
    "bao hanh",
    "ship",
    "giao hang",
    "price",
    "stock",
    "available",
    "product",
)


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


@dataclass(frozen=True)
class LlmDecision:
    reply_text: str
    cited_indices: list[int]
    escalate: bool


class ProcessMessageOrchestrator:
    def __init__(
        self,
        *,
        embedding_provider: EmbeddingProvider,
        retriever: KnowledgeRetriever,
        llm_provider: LlmProvider,
        prompt: PromptTemplate | None = None,
        min_relevance_similarity: float | None = None,
    ):
        self.embedding_provider = embedding_provider
        self.retriever = retriever
        self.llm_provider = llm_provider
        self.prompt = prompt or load_prompt()
        self.min_relevance_similarity = (
            settings.ai_relevance_min_similarity
            if min_relevance_similarity is None
            else min_relevance_similarity
        )

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
        relevant_chunks = self._filter_relevant_chunks(chunks)

        if not relevant_chunks:
            return self._escalation_response(
                model=selected_model,
                tokens={"prompt": 0, "completion": 0, "total": 0},
            )

        messages = [
            {
                "role": "user",
                "content": self._build_grounded_prompt(message, relevant_chunks),
            }
        ]
        completion = self.llm_provider.complete(model=selected_model, messages=messages)
        tokens = {
            "prompt": completion.prompt_tokens,
            "completion": completion.completion_tokens,
            "total": completion.total_tokens,
        }
        decision = _parse_llm_decision(completion.text)
        if decision is None:
            return self._escalation_response(model=completion.model, tokens=tokens)

        cited_indices = _valid_cited_indices(
            decision.cited_indices,
            chunk_count=len(relevant_chunks),
        )
        escalate_without_citations = (
            _is_factual_product_question(message) and not cited_indices
        )
        escalate = decision.escalate or escalate_without_citations or not decision.reply_text

        return {
            "replyText": SAFE_ESCALATE_REPLY
            if escalate_without_citations or not decision.reply_text
            else decision.reply_text,
            "citations": [
                _citation_for(index, relevant_chunks[index - 1])
                for index in cited_indices
            ]
            if not escalate
            else [],
            "toolsUsed": [],
            "promptVersion": self.prompt.version,
            "model": completion.model,
            "tokens": tokens,
            "escalate": escalate,
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

    def _filter_relevant_chunks(self, chunks: list[dict]) -> list[dict]:
        return [
            chunk
            for chunk in chunks
            if _chunk_similarity(chunk) >= self.min_relevance_similarity
        ]

    def _escalation_response(self, *, model: str, tokens: dict[str, int]) -> dict:
        return {
            "replyText": SAFE_ESCALATE_REPLY,
            "citations": [],
            "toolsUsed": [],
            "promptVersion": self.prompt.version,
            "model": model,
            "tokens": tokens,
            "escalate": True,
        }


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


def _parse_llm_decision(text: str) -> LlmDecision | None:
    try:
        body = json.loads(_strip_json_fence(text))
    except json.JSONDecodeError:
        return None

    if not isinstance(body, dict):
        return None
    reply_text = body.get("replyText")
    cited_indices = body.get("citedIndices")
    escalate = body.get("escalate")
    if not isinstance(reply_text, str):
        return None
    if not isinstance(cited_indices, list):
        return None
    if not isinstance(escalate, bool):
        return None

    return LlmDecision(
        reply_text=reply_text.strip(),
        cited_indices=[
            item
            for item in cited_indices
            if isinstance(item, int) and not isinstance(item, bool)
        ],
        escalate=escalate,
    )


def _strip_json_fence(text: str) -> str:
    stripped = text.strip()
    if not stripped.startswith("```"):
        return stripped

    lines = stripped.splitlines()
    if len(lines) >= 3 and lines[0].startswith("```") and lines[-1].strip() == "```":
        return "\n".join(lines[1:-1]).strip()
    return stripped


def _valid_cited_indices(indices: list[int], *, chunk_count: int) -> list[int]:
    valid: list[int] = []
    seen: set[int] = set()
    for index in indices:
        if 1 <= index <= chunk_count and index not in seen:
            valid.append(index)
            seen.add(index)
    return valid


def _is_factual_product_question(message: str) -> bool:
    normalized = message.casefold()
    return "?" in normalized or any(term in normalized for term in FACTUAL_PRODUCT_TERMS)


def _chunk_similarity(chunk: dict) -> float:
    similarity = _as_float(_first_present(chunk, "score", "similarity"))
    if similarity is not None:
        return similarity

    distance = _as_float(
        _first_present_many(chunk, "distance", "cosineDistance", "cosine_distance")
    )
    if distance is not None:
        return 1.0 - distance

    return -1.0


def _citation_for(index: int, chunk: dict) -> dict:
    return {
        "index": index,
        "sourceType": _first_present(chunk, "sourceType", "source_type"),
        "sourceId": str(_first_present(chunk, "sourceId", "source_id")),
        "chunkIndex": _first_present(chunk, "chunkIndex", "chunk_index"),
        "score": _chunk_similarity(chunk),
    }


def _first_present(chunk: dict, first_key: str, second_key: str):
    if first_key in chunk:
        return chunk[first_key]
    return chunk.get(second_key)


def _first_present_many(chunk: dict, *keys: str):
    for key in keys:
        if key in chunk:
            return chunk[key]
    return None


def _as_float(value) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return None
