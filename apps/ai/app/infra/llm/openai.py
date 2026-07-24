import json
from urllib import error, request

from app.config import settings
from app.infra.llm.provider import LlmCompletion


class OpenAiLlmProvider:
    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        opener=request.urlopen,
    ):
        self.api_key = api_key if api_key is not None else settings.openai_api_key
        self.model = model if model is not None else settings.openai_model
        self.opener = opener

    def complete(
        self,
        *,
        model: str,
        messages: list[dict[str, str]],
    ) -> LlmCompletion:
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is required for LLM fallback")
        if not messages:
            raise ValueError("messages must not be empty")

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": _map_role(message["role"]),
                    "content": message["content"],
                }
                for message in messages
            ],
        }
        req = request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with self.opener(req, timeout=60) as response:
                body = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"OpenAI completion failed: {exc.code} {detail}") from exc

        text = _extract_text(body)
        usage = body.get("usage") or {}
        return LlmCompletion(
            text=text,
            model=str(body.get("model") or self.model),
            prompt_tokens=int(usage.get("prompt_tokens") or 0),
            completion_tokens=int(usage.get("completion_tokens") or 0),
            total_tokens=int(usage.get("total_tokens") or 0),
        )


def _map_role(role: str) -> str:
    if role == "model":
        return "assistant"
    if role in ("system", "user", "assistant"):
        return role
    raise ValueError(f"Unsupported message role: {role!r}")


def _extract_text(body: dict) -> str:
    choices = body.get("choices")
    if not isinstance(choices, list) or not choices:
        raise RuntimeError("OpenAI completion response had no choices")

    message = choices[0].get("message") or {}
    text = message.get("content")
    if not isinstance(text, str) or not text.strip():
        raise RuntimeError("OpenAI completion response had empty text")
    return text
