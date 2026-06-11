import os
from dataclasses import dataclass


APP_NAME = "BoardArena API"
APP_VERSION = "0.1.0"
DEFAULT_ALLOWED_ORIGINS = (
    "http://127.0.0.1:5173",
    "http://localhost:5173",
)


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip().rstrip("/") for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = APP_NAME
    app_version: str = APP_VERSION
    environment: str = "development"
    allowed_origins: tuple[str, ...] = DEFAULT_ALLOWED_ORIGINS


def get_settings() -> Settings:
    return Settings(
        environment=os.getenv("APP_ENV", "development"),
        allowed_origins=tuple(_split_csv(os.getenv("ALLOWED_ORIGINS"))) or DEFAULT_ALLOWED_ORIGINS,
    )
