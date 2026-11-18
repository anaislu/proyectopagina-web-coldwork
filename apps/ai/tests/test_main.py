import os

os.environ.setdefault("AI_INTERNAL_TOKEN", "test-token")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_anomalias_requiere_token():
    body = {"equipo_id": "c1", "temperaturas": [1.0], "objetivo": 1.0}
    assert client.post("/v1/anomalias", json=body).status_code == 401
    ok = client.post("/v1/anomalias", json=body, headers={"X-Internal-Token": "test-token"})
    assert ok.status_code == 200
