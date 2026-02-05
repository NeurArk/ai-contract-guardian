"""Database session configuration.

Ce module gère la configuration des sessions de base de données
asynchrones avec SQLModel et asyncpg.
"""

from collections.abc import AsyncGenerator

import redis.asyncio as redis
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings

# Création du moteur asynchrone
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

# Session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dépendance FastAPI pour obtenir une session DB.

    Usage:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...

    Yields:
        Une session de base de données asynchrone
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialise la base de données (crée les tables).

    À utiliser au démarrage de l'application.
    """
    from sqlmodel import SQLModel

    # Import tous les modèles pour créer les tables
    from app.models import User, Contract, Analysis

    async with engine.begin() as conn:
        # Crée toutes les tables
        # Note: En production, utiliser Alembic pour les migrations
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_redis_client() -> redis.Redis:
    """Crée et retourne un client Redis asynchrone.

    Returns:
        Client Redis asynchrone
    """
    return redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
