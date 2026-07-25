from fastapi.testclient import TestClient

from app.config import settings
from app.infra.llm.provider import LlmCompletion
from app.main import app

ORG_ID = "11111111-1111-1111-1111-111111111111"

client = TestClient(app)


def test_advise_returns_advise_only_stub_suggestions(monkeypatch):
    monkeypatch.setattr(settings, "gemini_api_key", None)

    response = client.post(
        "/internal/v1/ai/advise",
        headers={"x-service-key": settings.service_m2m_key},
        json={
            "orgId": ORG_ID,
            "goal": "Đẩy áo thun cuối tuần",
            "catalogAggregates": {"note": "top stock stub"},
            "salesAggregates": {"note": "last 7d sales stub"},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["model"] == "advisor-stub"
    assert body["promptVersion"] == "advisor.v1"
    assert "không auto-post" in body["disclaimer"]
    assert "Người bán phải duyệt" in body["disclaimer"]
    assert "không tự đăng Meta" in body["suggestionsText"]
    assert body["toolsUsed"][0]["kind"] == "advisor"
    assert body["toolsUsed"][0]["mode"] == "stub"


def test_advise_uses_gemini_when_api_key_set(monkeypatch):
    class FakeGeminiProvider:
        def complete(self, *, model, messages):
            assert model == "gemini-2.0-flash"
            assert messages[0]["role"] == "user"
            assert "KHÔNG tự đăng bài Meta" in messages[0]["content"]
            return LlmCompletion(
                text="- Gợi ý từ Gemini\n- Người bán phải duyệt trước khi thực hiện.",
                model="gemini-2.0-flash",
                prompt_tokens=42,
                completion_tokens=18,
                total_tokens=60,
            )

    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(
        "app.api.v1.advise.GeminiLlmProvider",
        lambda *args, **kwargs: FakeGeminiProvider(),
    )

    response = client.post(
        "/internal/v1/ai/advise",
        headers={"x-service-key": settings.service_m2m_key},
        json={
            "orgId": ORG_ID,
            "goal": "Đẩy áo thun cuối tuần",
            "catalogAggregates": {"note": "top stock"},
            "salesAggregates": {"note": "last 7d sales"},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["model"] == "gemini-2.0-flash"
    assert body["tokens"] == {"input": 42, "output": 18, "total": 60}
    assert body["toolsUsed"][0]["mode"] == "gemini"
    assert "Gợi ý từ Gemini" in body["suggestionsText"]
    assert "Người bán phải duyệt" in body["disclaimer"]


def test_advise_falls_back_to_stub_when_gemini_fails(monkeypatch):
    class FailingGeminiProvider:
        def complete(self, *, model, messages):
            raise RuntimeError("gemini down")

    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(
        "app.api.v1.advise.GeminiLlmProvider",
        lambda *args, **kwargs: FailingGeminiProvider(),
    )

    response = client.post(
        "/internal/v1/ai/advise",
        headers={"x-service-key": settings.service_m2m_key},
        json={"orgId": ORG_ID},
    )

    assert response.status_code == 200
    assert response.json()["model"] == "advisor-stub"


def test_advise_requires_service_key():
    response = client.post(
        "/internal/v1/ai/advise",
        headers={"x-service-key": "wrong"},
        json={"orgId": ORG_ID},
    )

    assert response.status_code == 401
