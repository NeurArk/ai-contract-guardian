from functools import lru_cache

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
    VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    # CORS - string séparée par des virgules
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8080"
    
    # Base de données
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/contract_guardian"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Sécurité
    SECRET_KEY: str = "change-me-in-production"
    
    # API externes
    ANTHROPIC_API_KEY: str | None = None
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Retourne la liste des origines CORS."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Retourne les settings en cache."""
    return Settings()


settings = get_settings()
