"""Tests for RGPD user endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlmodel import col
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import get_password_hash
from app.models import Analysis, AnalysisStatus, Contract, ContractStatus, User


@pytest.mark.asyncio
async def test_export_user_data(
    async_client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test exporting user data."""
    user = User(email="export@example.com", password_hash=get_password_hash("TestPassword123!"))
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    contract = Contract(
        user_id=user.id,
        filename="contract.pdf",
        file_path="/tmp/uploads/contract.pdf",
        file_size=123,
        file_type="application/pdf",
        status=ContractStatus.COMPLETED,
    )
    db_session.add(contract)
    await db_session.commit()
    await db_session.refresh(contract)

    analysis = Analysis(
        contract_id=contract.id,
        status=AnalysisStatus.COMPLETED,
        results={"foo": "bar"},
    )
    db_session.add(analysis)
    await db_session.commit()

    login_response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "TestPassword123!"},
    )
    token = login_response.json()["access_token"]

    response = await async_client.get(
        "/api/v1/users/me/export",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == user.email
    assert len(data["contracts"]) == 1
    assert len(data["analyses"]) == 1
    assert data["export_metadata"]["contracts_count"] == 1
    assert data["export_metadata"]["analyses_count"] == 1


@pytest.mark.asyncio
async def test_delete_user_data(
    async_client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test deleting user data."""
    user = User(email="delete@example.com", password_hash=get_password_hash("TestPassword123!"))
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    contract = Contract(
        user_id=user.id,
        filename="contract.pdf",
        file_path="/tmp/uploads/contract.pdf",
        file_size=123,
        file_type="application/pdf",
        status=ContractStatus.COMPLETED,
    )
    db_session.add(contract)
    await db_session.commit()
    await db_session.refresh(contract)

    analysis = Analysis(
        contract_id=contract.id,
        status=AnalysisStatus.COMPLETED,
        results={"foo": "bar"},
    )
    db_session.add(analysis)
    await db_session.commit()

    login_response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "TestPassword123!"},
    )
    token = login_response.json()["access_token"]

    response = await async_client.delete(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["deleted_contracts"] == 1
    assert payload["deleted_analyses"] == 1

    user_result = await db_session.execute(select(User).where(col(User.id) == user.id))
    assert user_result.scalar_one_or_none() is None
