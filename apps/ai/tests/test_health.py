from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_health_echoes_traceparent():
    traceparent = "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01"
    r = client.get("/health", headers={"traceparent": traceparent})
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "traceparent": traceparent}
