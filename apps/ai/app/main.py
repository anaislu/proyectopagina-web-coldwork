import hmac

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel

from .config import settings

# Sin /docs ni /openapi.json en producción: el servicio es interno.
app = FastAPI(title="coldwork-ai", docs_url=None, redoc_url=None, openapi_url=None)


def require_internal_token(x_internal_token: str = Header(default="")) -> None:
    """Defensa en profundidad: aunque la red 'backend' es interna, solo el API
    (que conoce el token compartido) puede invocar este servicio."""
    if not hmac.compare_digest(x_internal_token, settings.ai_internal_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


class LecturaTemperatura(BaseModel):
    equipo_id: str
    temperaturas: list[float]
    objetivo: float


@app.post("/v1/anomalias", dependencies=[Depends(require_internal_token)])
def detectar_anomalias(payload: LecturaTemperatura) -> dict[str, object]:
    # Placeholder: reemplazar por el modelo real.
    desvios = [t for t in payload.temperaturas if abs(t - payload.objetivo) > 2.0]
    return {"equipo_id": payload.equipo_id, "anomalias": len(desvios)}
