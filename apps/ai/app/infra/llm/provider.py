from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class LlmCompletion:
    text: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class LlmProvider(Protocol):
    def complete(
        self,
        *,
        model: str,
        messages: list[dict[str, str]],
    ) -> LlmCompletion:
        ...


def parse_allowlist(allowlist: str) -> set[str]:
    return {item.strip() for item in allowlist.split(",") if item.strip()}


def assert_model_allowed(model: str, allowlist: str) -> None:
    if model not in parse_allowlist(allowlist):
        raise ValueError(f"Model {model!r} is not in AI_MODEL_ALLOWLIST")
