"""Users API endpoints.

Ce module définit les endpoints RGPD pour l'export et la suppression des données utilisateur.
"""

from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlmodel import SQLModel, col
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings
from app.core.security import get_current_user_id
from app.db.session import get_db
from app.models import Analysis, AnalysisStatus, Contract, ContractStatus, User, UserResponse
from app.models.base import utc_now

router = APIRouter(prefix="/users", tags=["users"])


class ContractExport(SQLModel):
    """Schéma d'export d'un contrat."""

    id: UUID
    user_id: UUID
    filename: str
    file_path: str
    file_size: int
    file_type: str
    status: ContractStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AnalysisExport(SQLModel):
    """Schéma d'export d'une analyse."""

    id: UUID
    contract_id: UUID
    status: AnalysisStatus
    results: dict[str, Any] | None
    score_equity: int | None
    score_clarity: int | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExportMetadata(SQLModel):
    """Métadonnées de l'export."""

    exported_at: datetime
    contracts_count: int
    analyses_count: int
    version: str


class UserDataExport(SQLModel):
    """Export complet des données utilisateur."""

    user: UserResponse
    contracts: list[ContractExport]
    analyses: list[AnalysisExport]
    export_metadata: ExportMetadata


class DeleteUserResponse(SQLModel):
    """Réponse de suppression d'un utilisateur."""

    message: str
    deleted_contracts: int
    deleted_analyses: int
    deleted_files: int
    failed_files: int


@router.get("/me/export", response_model=UserDataExport)
async def export_user_data(
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserDataExport:
    """Exporter toutes les données utilisateur (RGPD).

    Returns:
        Export JSON avec user, contrats, analyses et métadonnées.
    """
    result = await db.execute(select(User).where(col(User.id) == current_user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé",
        )

    contracts_result = await db.execute(
        select(Contract)
        .where(col(Contract.user_id) == current_user_id)
        .order_by(col(Contract.created_at).desc())
    )
    contracts = list(contracts_result.scalars().all())
    contract_exports = [ContractExport.model_validate(contract) for contract in contracts]

    analyses: list[Analysis] = []
    if contracts:
        contract_ids = [contract.id for contract in contracts]
        analyses_result = await db.execute(
            select(Analysis)
            .where(col(Analysis.contract_id).in_(contract_ids))
            .order_by(col(Analysis.created_at).desc())
        )
        analyses = list(analyses_result.scalars().all())

    analysis_exports = [AnalysisExport.model_validate(analysis) for analysis in analyses]

    metadata = ExportMetadata(
        exported_at=utc_now(),
        contracts_count=len(contracts),
        analyses_count=len(analyses),
        version=settings.VERSION,
    )

    return UserDataExport(
        user=UserResponse.model_validate(user),
        contracts=contract_exports,
        analyses=analysis_exports,
        export_metadata=metadata,
    )


@router.delete("/me", response_model=DeleteUserResponse)
async def delete_user_data(
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> DeleteUserResponse:
    """Supprimer l'utilisateur et toutes ses données (RGPD)."""
    result = await db.execute(select(User).where(col(User.id) == current_user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé",
        )

    contracts_result = await db.execute(select(Contract).where(col(Contract.user_id) == current_user_id))
    contracts = list(contracts_result.scalars().all())
    contract_ids = [contract.id for contract in contracts]

    analyses_count = 0
    if contract_ids:
        analyses_result = await db.execute(
            select(Analysis.id).where(col(Analysis.contract_id).in_(contract_ids))
        )
        analyses_count = len(analyses_result.scalars().all())

    deleted_files = 0
    failed_files = 0

    for contract in contracts:
        if not contract.file_path:
            continue
        try:
            file_path = Path(contract.file_path)
            if file_path.exists():
                file_path.unlink()
                deleted_files += 1
        except Exception:
            failed_files += 1

    try:
        user_upload_dir = Path(settings.UPLOAD_DIR) / str(current_user_id)
        if user_upload_dir.exists():
            for child in user_upload_dir.iterdir():
                try:
                    if child.is_file():
                        child.unlink()
                except Exception:
                    failed_files += 1
            try:
                user_upload_dir.rmdir()
            except Exception:
                pass
    except Exception:
        pass

    if contract_ids:
        await db.execute(delete(Analysis).where(col(Analysis.contract_id).in_(contract_ids)))
        await db.execute(delete(Contract).where(col(Contract.user_id) == current_user_id))

    await db.execute(delete(User).where(col(User.id) == current_user_id))
    await db.commit()

    return DeleteUserResponse(
        message="Compte supprimé",
        deleted_contracts=len(contracts),
        deleted_analyses=analyses_count,
        deleted_files=deleted_files,
        failed_files=failed_files,
    )
