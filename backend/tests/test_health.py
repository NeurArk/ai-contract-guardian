"""Tests pour l'endpoint health."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest_asyncio.fixture
async def client():
    """Fixture pour le client HTTP async."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client):
    """Test que l'endpoint /health retourne 200 et les bonnes données."""
    response = await client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_root_endpoint(client):
    """Test que l'endpoint racine retourne les infos de l'API."""
    response = await client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    assert "AI Contract Guardian" in data["message"]
    assert data["docs"] == "/docs"
    assert "version" in data
