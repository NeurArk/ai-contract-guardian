"""Health check endpoint."""

from fastapi import APIRouter, status
from pydantic import BaseModel

from app.config import settings

router = APIRouter()


class HealthResponse(BaseModel):
    """Réponse du health check."""

    status: str
    version: str


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Vérifie que l'API est opérationnelle.",
)
async def health_check() -> HealthResponse:
    """Endpoint de health check.

    Returns:
        Status de l'API et version
    """
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
    )
