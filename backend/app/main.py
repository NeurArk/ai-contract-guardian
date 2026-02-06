from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.contracts import router as contracts_router
from app.api.analysis_v2 import router as analysis_v2_router
from app.api.users import router as users_router
from app.config import settings
from app.core.security_middleware import setup_security_middleware
from app.db.session import get_redis_client


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan handler."""
    # Startup
    from app.db.session import init_db

    # Ensure DB tables exist (MVP/dev). In production we should use Alembic migrations.
    await init_db()

    redis_client = await get_redis_client()
    app.state.redis = redis_client

    yield

    # Shutdown
    if redis_client:
        await redis_client.close()


app = FastAPI(
    title="AI Contract Guardian",
    description="API d'analyse contractuelle par IA pour TPE/PME",
    version=settings.VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Setup security middleware (Redis sera récupéré depuis app.state si dispo)
setup_security_middleware(
    app,
    cors_origins=settings.cors_origins_list,
    redis_client=None,
    enable_gzip=True,
    allow_iframes=False,
)

# Inclusion des routers
app.include_router(health_router, tags=["health"])
app.include_router(auth_router, prefix="/api/v1")
app.include_router(contracts_router, prefix="/api/v1")
app.include_router(analysis_v2_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")


@app.get("/")
async def root() -> dict[str, str]:
    """Redirect vers la documentation."""
    return {
        "message": "Bienvenue sur AI Contract Guardian API",
        "docs": "/docs",
        "version": settings.VERSION,
    }


@app.on_event("startup")
async def startup_event() -> None:
    """Initialisation au démarrage de l'application."""
    # Crée les tables si elles n'existent pas (dev seulement)
    # En production, utiliser Alembic
    from app.db.session import init_db

    await init_db()
