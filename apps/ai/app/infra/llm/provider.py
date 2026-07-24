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


class FailoverLlmProvider:
    def __init__(self, primary: LlmProvider, secondary: LlmProvider | None = None):
        self.primary = primary
        self.secondary = secondary

    def complete(
        self,
        *,
        model: str,
        messages: list[dict[str, str]],
    ) -> LlmCompletion:
        try:
            return self.primary.complete(model=model, messages=messages)
        except Exception:
            if self.secondary is None:
                raise
            return self.secondary.complete(model=model, messages=messages)


def parse_allowlist(allowlist: str) -> set[str]:
    return {item.strip() for item in allowlist.split(",") if item.strip()}


def assert_model_allowed(model: str, allowlist: str) -> None:
    if model not in parse_allowlist(allowlist):
        raise ValueError(f"Model {model!r} is not in AI_MODEL_ALLOWLIST")
