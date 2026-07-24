import json

import pytest

from app.infra.llm.gemini import GeminiLlmProvider
from app.infra.llm.provider import FailoverLlmProvider, LlmCompletion


class FakeResponse:
    def __init__(self, body: dict):
        self._body = json.dumps(body).encode("utf-8")

    def read(self):
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


def test_rejects_model_not_in_allowlist():
    provider = GeminiLlmProvider(api_key="test-key", allowlist="gemini-2.0-flash")

    with pytest.raises(ValueError, match="not in AI_MODEL_ALLOWLIST"):
        provider.complete(
            model="gpt-4o",
            messages=[{"role": "user", "content": "hi"}],
        )


def test_complete_success_with_mocked_http():
    captured: dict = {}

    def fake_opener(req, timeout=60):
        captured["url"] = req.full_url
        captured["body"] = json.loads(req.data.decode("utf-8"))
        return FakeResponse(
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "Xin chao!"}],
                            "role": "model",
                        }
                    }
                ],
                "usageMetadata": {
                    "promptTokenCount": 5,
                    "candidatesTokenCount": 7,
                    "totalTokenCount": 12,
                },
            }
        )

    provider = GeminiLlmProvider(
        api_key="test-key",
        allowlist="gemini-2.0-flash",
        opener=fake_opener,
    )
    result = provider.complete(
        model="gemini-2.0-flash",
        messages=[{"role": "user", "content": "hello"}],
    )

    assert result.text == "Xin chao!"
    assert result.model == "gemini-2.0-flash"
    assert result.prompt_tokens == 5
    assert result.completion_tokens == 7
    assert result.total_tokens == 12
    assert "gemini-2.0-flash:generateContent" in captured["url"]
    assert captured["body"]["contents"][0]["parts"][0]["text"] == "hello"


def test_failover_provider_uses_secondary_when_primary_fails():
    class FailingPrimary:
        def complete(self, **kwargs):
            raise RuntimeError("primary failed")

    class Secondary:
        def __init__(self):
            self.calls: list[dict] = []

        def complete(self, **kwargs):
            self.calls.append(kwargs)
            return LlmCompletion(
                text="ok",
                model="gpt-4o-mini",
                prompt_tokens=1,
                completion_tokens=1,
                total_tokens=2,
            )

    secondary = Secondary()
    provider = FailoverLlmProvider(FailingPrimary(), secondary)

    result = provider.complete(
        model="gemini-2.0-flash",
        messages=[{"role": "user", "content": "hello"}],
    )

    assert result.model == "gpt-4o-mini"
    assert secondary.calls == [
        {
            "model": "gemini-2.0-flash",
            "messages": [{"role": "user", "content": "hello"}],
        }
    ]
