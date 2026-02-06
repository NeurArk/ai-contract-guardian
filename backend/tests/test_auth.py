"""Tests for authentication endpoints."""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.models import User


@pytest.fixture
def user_data() -> dict[str, str]:
    """Sample user data."""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!",
    }


class TestAuthEndpoints:
    """Test authentication endpoints."""
    
    def test_register_success(
        self,
        client: TestClient,
        db_session: AsyncSession,
        user_data: dict[str, str],
    ) -> None:
        """Test successful user registration."""
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert "id" in data
        assert "password" not in data
        assert "password_hash" not in data
        assert data["is_active"] is True
    
    def test_register_duplicate_email(
        self,
        client: TestClient,
        db_session: AsyncSession,
        user_data: dict[str, str],
    ) -> None:
        """Test registration with duplicate email."""
        # First registration
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201
        
        # Second registration with same email
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 400
        assert "email" in response.json()["detail"].lower() or "déjà" in response.json()["detail"].lower()
    
    def test_login_success(
        self,
        client: TestClient,
        db_session: AsyncSession,
        user_data: dict[str, str],
    ) -> None:
        """Test successful login."""
        # Register first
        client.post("/api/v1/auth/register", json=user_data)
        
        # Login
        response = client.post("/api/v1/auth/login", json=user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == user_data["email"]
    
    def test_login_wrong_password(
        self,
        client: TestClient,
        db_session: AsyncSession,
        user_data: dict[str, str],
    ) -> None:
        """Test login with wrong password."""
        # Register first
        client.post("/api/v1/auth/register", json=user_data)
        
        # Login with wrong password
        wrong_credentials = {
            "email": user_data["email"],
            "password": "WrongPassword123!",
        }
        response = client.post("/api/v1/auth/login", json=wrong_credentials)
        
        assert response.status_code == 401
    
    def test_login_nonexistent_user(
        self,
        client: TestClient,
        db_session: AsyncSession,
    ) -> None:
        """Test login with non-existent user."""
        response = client.post("/api/v1/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "SomePassword123!",
        })
        
        assert response.status_code == 401
    
    def test_login_rate_limited(self, client: TestClient) -> None:
        """Test rate limiting on login."""
        payload = {
            "email": "limit@example.com",
            "password": "SomePassword123!",
        }

        for _ in range(5):
            response = client.post("/api/v1/auth/login", json=payload)
            assert response.status_code == 401

        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 429
        assert "trop de tentatives" in response.json()["detail"].lower()

    def test_get_me_unauthorized(self, client: TestClient) -> None:
        """Test get me without authentication."""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == 403  # or 401 depending on implementation
    
    def test_get_me_authorized(
        self,
        client: TestClient,
        db_session: AsyncSession,
        user_data: dict[str, str],
    ) -> None:
        """Test get me with authentication."""
        # Register and login
        client.post("/api/v1/auth/register", json=user_data)
        login_response = client.post("/api/v1/auth/login", json=user_data)
        token = login_response.json()["access_token"]
        
        # Get me
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user_data["email"]
        assert "id" in data


class TestPasswordHashing:
    """Test password hashing utilities."""
    
    def test_password_hash(self) -> None:
        """Test password hashing and verification."""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed) is True
        assert verify_password("WrongPassword", hashed) is False
