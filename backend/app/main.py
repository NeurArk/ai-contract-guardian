from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.config import settings

app = FastAPI(
    title="AI Contract Guardian",
    description="API d'analyse contractuelle par IA pour TPE/PME",
    version=settings.VERSION,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routers
app.include_router(health_router, tags=["health"])


@app.get("/")
async def root():
    """Redirect vers la documentation."""
    return {
        "message": "Bienvenue sur AI Contract Guardian API",
        "docs": "/docs",
        "version": settings.VERSION,
    }
