from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration de l'application via variables d'environnement."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    VERSION: str = "0.2.0"
    DEBUG: bool = False

    # CORS - string séparée par des virgules
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8080"

    # Base de données
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/contract_guardian"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Sécurité - JWT
    SECRET_KEY: str = "change-me-in-production-change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # API externes
    ANTHROPIC_API_KEY: str | None = None
    ANTHROPIC_MODEL: str = "claude-sonnet-4-5-20250929"

    # Stockage fichiers
    UPLOAD_DIR: str = "/tmp/uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: str = ".pdf,.docx"

    # Supabase (optionnel)
    SUPABASE_URL: str | None = None
    SUPABASE_KEY: str | None = None
    SUPABASE_BUCKET: str = "contracts"

    @property
    def cors_origins_list(self) -> list[str]:
        """Retourne la liste des origines CORS."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_extensions_list(self) -> list[str]:
        """Retourne la liste des extensions autorisées."""
        return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",") if ext.strip()]

    @property
    def upload_path(self) -> Path:
        """Retourne le chemin du dossier d'upload."""
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path


@lru_cache
def get_settings() -> Settings:
    """Retourne les settings en cache."""
    return Settings()


settings = get_settings()
