from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

ORG_ID = "11111111-1111-1111-1111-111111111111"

client = TestClient(app)


def test_advise_returns_advise_only_stub_suggestions():
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
    assert "không tự đăng Meta" in body["suggestionsText"]
    assert body["toolsUsed"][0]["kind"] == "advisor"


def test_advise_requires_service_key():
    response = client.post(
        "/internal/v1/ai/advise",
        headers={"x-service-key": "wrong"},
        json={"orgId": ORG_ID},
    )

    assert response.status_code == 401
