import pytest
from datetime import datetime
from uuid import uuid4, UUID

from app.models.user import User
from app.models.contract import Contract, ContractStatus
from app.models.analysis import Analysis, AnalysisStatus


def test_user_model():
    """Test la création d'un utilisateur."""
    user = User(
        id=uuid4(),
        email="test@example.com",
        hashed_password="hashed_password",
        full_name="Test User",
        is_active=True,
        is_verified=False,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    assert user.email == "test@example.com"
    assert user.is_active is True


def test_contract_model():
    """Test la création d'un contrat."""
    contract = Contract(
        id=uuid4(),
        user_id=uuid4(),
        filename="test_contract.pdf",
        file_path="/uploads/test_contract.pdf",
        file_size=1024,
        file_type="application/pdf",
        status=ContractStatus.PENDING,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    assert contract.filename == "test_contract.pdf"
    assert contract.status == ContractStatus.PENDING


def test_analysis_model():
    """Test la création d'une analyse."""
    analysis = Analysis(
        id=uuid4(),
        contract_id=uuid4(),
        status=AnalysisStatus.PENDING,
        results=None,
        score_equity=None,
        score_clarity=None,
        error_message=None,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    assert analysis.status == AnalysisStatus.PENDING
    assert analysis.results is None
