import os

os.environ.setdefault("AI_INTERNAL_TOKEN", "t" * 64)

from fastapi.testclient import TestClient  # noqa: E402

from app.config import settings  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)
BODY = {"equipo_id": "c1", "temperaturas": [1.0], "objetivo": 1.0}


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_anomalias_sin_token_es_401():
    assert client.post("/v1/anomalias", json=BODY).status_code == 401


def test_anomalias_token_incorrecto_es_401():
    headers = {"X-Internal-Token": settings.ai_internal_token + "x"}
    assert client.post("/v1/anomalias", json=BODY, headers=headers).status_code == 401


def test_anomalias_con_token_valido():
    headers = {"X-Internal-Token": settings.ai_internal_token}
    assert client.post("/v1/anomalias", json=BODY, headers=headers).status_code == 200
