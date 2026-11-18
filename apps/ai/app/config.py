from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Lee AI_INTERNAL_TOKEN desde env o desde /run/secrets (Docker secrets)."""

    model_config = SettingsConfigDict(
        secrets_dir="/run/secrets" if Path("/run/secrets").is_dir() else None
    )

    # Mínimo 32 caracteres: un token vacío dejaría pasar peticiones sin header.
    ai_internal_token: str = Field(min_length=32)


settings = Settings()
