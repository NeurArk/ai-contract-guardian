"""Pytest configuration and fixtures."""

import os
import asyncio
import random
from collections.abc import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

# Ensure tests use a local SQLite database before importing the app
# (we override any container-provided DATABASE_URL to keep tests deterministic)
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"

# Disable rate limiting in tests to avoid cross-test coupling
os.environ["AUTH_RATE_LIMIT_ENABLED"] = "false"

from app.config import settings
from app.db.session import get_db, get_redis_client
from app.main import app
from app.core.rate_limit import reset_in_memory_rate_limits


async def reset_redis_rate_limits() -> None:
    """Clear rate limit keys in Redis for tests."""
    try:
        redis = await get_redis_client()
        # Delete all auth rate limit keys
        keys = await redis.keys("rl:auth:*")
        if keys:
            await redis.delete(*keys)
    except Exception:
        pass  # Redis might not be available

# Use a local SQLite database for testing
TEST_DATABASE_URL = settings.DATABASE_URL

# Create async engine for tests
engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True,
)

# Session factory for tests
TestingSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# NOTE: Do not override pytest-asyncio's built-in event_loop fixture.
# Overriding it can cause loop/source inspection issues in recent pytest-asyncio.


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database() -> AsyncGenerator[None, None]:
    """Set up the test database."""
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    yield
    
    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session
        # Rollback any changes
        await session.rollback()


@pytest.fixture
def client(db_session: AsyncSession) -> Generator[TestClient, None, None]:
    """Create a test client with overridden dependencies."""

    def override_get_db() -> Generator[AsyncSession, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    reset_in_memory_rate_limits()
    asyncio.get_event_loop().run_until_complete(reset_redis_rate_limits())

    # Use a unique IP per test to avoid Redis-backed rate-limit cross-test coupling.
    ip = f"127.0.0.{random.randint(1, 254)}"

    with TestClient(app, headers={"X-Forwarded-For": ip}) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client."""

    def override_get_db() -> Generator[AsyncSession, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    reset_in_memory_rate_limits()

    # Use a unique IP per test to avoid Redis-backed rate-limit cross-test coupling.
    ip = f"127.0.0.{random.randint(1, 254)}"

    async with AsyncClient(app=app, base_url="http://test", headers={"X-Forwarded-For": ip}) as ac:
        yield ac
    
    app.dependency_overrides.clear()
