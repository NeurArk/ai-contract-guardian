"""Tests for contracts endpoints."""

import io
import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.models import Contract, ContractStatus


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    """Create a user and return auth headers."""
    user_data = {
        "email": "contracttest@example.com",
        "password": "TestPassword123!",
        "is_professional": True,
    }
    
    # Register
    client.post("/api/v1/auth/register", json=user_data)
    
    # Login
    login_response = client.post("/api/v1/auth/login", json=user_data)
    token = login_response.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_pdf() -> bytes:
    """Create a sample PDF content."""
    # Minimal PDF content
    return b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Contract) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000214 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n298\n%%EOF"


class TestContractEndpoints:
    """Test contracts endpoints."""
    
    def test_upload_contract_success(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        sample_pdf: bytes,
    ) -> None:
        """Test successful contract upload."""
        response = client.post(
            "/api/v1/contracts/upload",
            files={"file": ("test_contract.pdf", io.BytesIO(sample_pdf), "application/pdf")},
            headers=auth_headers,
        )
        
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["filename"] == "test_contract.pdf"
        assert data["status"] == ContractStatus.PENDING.value
        assert "file_size" in data
        assert "file_type" in data
    
    def test_upload_contract_unauthorized(
        self,
        client: TestClient,
        sample_pdf: bytes,
    ) -> None:
        """Test upload without authentication."""
        response = client.post(
            "/api/v1/contracts/upload",
            files={"file": ("test_contract.pdf", io.BytesIO(sample_pdf), "application/pdf")},
        )
        
        assert response.status_code in [401, 403]
    
    def test_upload_invalid_extension(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test upload with invalid file extension."""
        response = client.post(
            "/api/v1/contracts/upload",
            files={"file": ("test_contract.txt", io.BytesIO(b"invalid content"), "text/plain")},
            headers=auth_headers,
        )
        
        assert response.status_code == 400
    
    def test_list_contracts(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        sample_pdf: bytes,
    ) -> None:
        """Test listing contracts."""
        # Upload a contract first
        client.post(
            "/api/v1/contracts/upload",
            files={"file": ("contract1.pdf", io.BytesIO(sample_pdf), "application/pdf")},
            headers=auth_headers,
        )
        
        # List contracts
        response = client.get("/api/v1/contracts", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert "id" in data[0]
        assert "filename" in data[0]
        assert "status" in data[0]
    
    def test_get_contract(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        sample_pdf: bytes,
    ) -> None:
        """Test getting a specific contract."""
        # Upload a contract
        upload_response = client.post(
            "/api/v1/contracts/upload",
            files={"file": ("contract_detail.pdf", io.BytesIO(sample_pdf), "application/pdf")},
            headers=auth_headers,
        )
        contract_id = upload_response.json()["id"]
        
        # Get contract
        response = client.get(f"/api/v1/contracts/{contract_id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == contract_id
        assert data["filename"] == "contract_detail.pdf"
    
    def test_get_contract_not_found(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test getting a non-existent contract."""
        fake_id = str(uuid4())
        response = client.get(f"/api/v1/contracts/{fake_id}", headers=auth_headers)
        
        assert response.status_code == 404
    
    def test_get_contract_status(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        sample_pdf: bytes,
    ) -> None:
        """Test getting contract analysis status."""
        # Upload a contract
        upload_response = client.post(
            "/api/v1/contracts/upload",
            files={"file": ("contract_status.pdf", io.BytesIO(sample_pdf), "application/pdf")},
            headers=auth_headers,
        )
        contract_id = upload_response.json()["id"]
        
        # Get status
        response = client.get(f"/api/v1/contracts/{contract_id}/status", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["contract_id"] == contract_id
        assert "analysis_id" in data
        assert "status" in data
    
    def test_get_contract_analysis_not_ready(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        sample_pdf: bytes,
    ) -> None:
        """Test getting analysis results before completion."""
        # Upload a contract
        upload_response = client.post(
            "/api/v1/contracts/upload",
            files={"file": ("contract_analysis.pdf", io.BytesIO(sample_pdf), "application/pdf")},
            headers=auth_headers,
        )
        contract_id = upload_response.json()["id"]
        
        # Get analysis (should fail as it's not completed)
        response = client.get(f"/api/v1/contracts/{contract_id}/analysis", headers=auth_headers)
        
        # Should return 400 as analysis is not completed
        assert response.status_code == 400
