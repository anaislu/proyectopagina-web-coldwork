from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Lee AI_INTERNAL_TOKEN desde env o desde /run/secrets (Docker secrets)."""

    model_config = SettingsConfigDict(
        secrets_dir="/run/secrets" if Path("/run/secrets").is_dir() else None
    )

    ai_internal_token: str


settings = Settings()
