"""Contracts API endpoints.

Ce module définit les endpoints pour la gestion des contrats.
"""

import os
import shutil
from pathlib import Path
from typing import cast
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlmodel import col
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings
from app.core.security import get_current_user_id
from app.db.session import get_db
from app.models import (
    Contract,
    ContractListResponse,
    ContractResponse,
    Analysis,
    AnalysisStatus,
    ContractStatus,
    AnalysisStatusResponse,
    AnalysisResponse,
)
from app.services.text_extractor import extract_text

router = APIRouter(prefix="/contracts", tags=["contracts"])


def validate_file(file: UploadFile) -> None:
    """Valide un fichier uploadé.

    Args:
        file: Fichier à valider

    Raises:
        HTTPException: Si le fichier est invalide
    """
    # Vérifie l'extension
    filename = file.filename or ""
    ext = Path(filename).suffix.lower()

    if ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extension non autorisée. Extensions acceptées: {settings.ALLOWED_EXTENSIONS}",
        )

    # Vérifie le type MIME
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type de fichier non supporté: {file.content_type}",
        )


@router.post("/upload", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def upload_contract(
    file: UploadFile = File(...),
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Contract:
    """Uploader un contrat pour analyse.

    Args:
        file: Fichier à uploader
        current_user_id: ID de l'utilisateur connecté
        db: Session de base de données

    Returns:
        Le contrat créé
    """
    # Valide le fichier
    validate_file(file)

    # Vérifie la taille du fichier
    content = await file.read()
    file_size = len(content)

    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Fichier trop volumineux. Taille maximale: {settings.MAX_FILE_SIZE / (1024 * 1024):.0f}MB",
        )

    # Crée le dossier utilisateur
    user_upload_dir = settings.upload_path / str(current_user_id)
    user_upload_dir.mkdir(parents=True, exist_ok=True)

    # Génère un nom de fichier unique
    contract_id = UUID(os.urandom(16).hex()[:32], version=4)
    ext = Path(file.filename or "").suffix.lower()
    file_name = f"{contract_id}{ext}"
    file_path = user_upload_dir / file_name

    # Sauvegarde le fichier
    with open(file_path, "wb") as f:
        f.write(content)

    # Crée le contrat en base de données
    contract = Contract(
        id=contract_id,
        user_id=current_user_id,
        filename=file.filename or "unknown",
        file_path=str(file_path),
        file_size=file_size,
        file_type=file.content_type or "application/octet-stream",
        status=ContractStatus.PENDING,
    )

    db.add(contract)
    await db.commit()
    await db.refresh(contract)

    # Crée l'analyse associée
    analysis = Analysis(
        contract_id=contract.id,
        status=AnalysisStatus.PENDING,
    )
    db.add(analysis)
    await db.commit()

    # Déclenche l'analyse asynchrone via Celery si disponible
    try:
        from app.celery_app import celery_app

        if celery_app:
            from app.tasks.analysis import analyze_contract

            analyze_contract.delay(str(contract.id))
    except ImportError:
        pass  # Celery non configuré, l'analyse sera faite manuellement

    return contract


@router.get("", response_model=list[ContractListResponse])
async def list_contracts(
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> list[Contract]:
    """Lister les contrats de l'utilisateur.

    Args:
        current_user_id: ID de l'utilisateur connecté
        db: Session de base de données

    Returns:
        Liste des contrats
    """
    result = await db.execute(
        select(Contract)
        .where(col(Contract.user_id) == current_user_id)
        .order_by(col(Contract.created_at).desc())
    )
    contracts = result.scalars().all()
    return list(contracts)


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Contract:
    """Récupérer un contrat par son ID.

    Args:
        contract_id: ID du contrat
        current_user_id: ID de l'utilisateur connecté
        db: Session de base de données

    Returns:
        Le contrat

    Raises:
        HTTPException: Si le contrat n'est pas trouvé ou n'appartient pas à l'utilisateur
    """
    result = await db.execute(
        select(Contract).where(
            col(Contract.id) == contract_id,
            col(Contract.user_id) == current_user_id,
        )
    )
    contract = result.scalar_one_or_none()

    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrat non trouvé",
        )

    return cast(Contract, contract)


@router.get("/{contract_id}/status", response_model=AnalysisStatusResponse)
async def get_contract_status(
    contract_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> AnalysisStatusResponse:
    """Récupérer le statut de l'analyse d'un contrat.

    Args:
        contract_id: ID du contrat
        current_user_id: ID de l'utilisateur connecté
        db: Session de base de données

    Returns:
        Le statut de l'analyse
    """
    # Vérifie que le contrat existe et appartient à l'utilisateur
    result = await db.execute(
        select(Contract).where(
            col(Contract.id) == contract_id,
            col(Contract.user_id) == current_user_id,
        )
    )
    contract = result.scalar_one_or_none()

    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrat non trouvé",
        )

    # Récupère l'analyse
    result = await db.execute(select(Analysis).where(col(Analysis.contract_id) == contract_id))
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analyse non trouvée",
        )

    return AnalysisStatusResponse(
        contract_id=contract_id,
        analysis_id=analysis.id,
        status=analysis.status,
        score_equity=analysis.score_equity,
        score_clarity=analysis.score_clarity,
        error_message=analysis.error_message,
        created_at=analysis.created_at,
        updated_at=analysis.updated_at,
    )


@router.get("/{contract_id}/analysis", response_model=AnalysisResponse)
async def get_contract_analysis(
    contract_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Analysis:
    """Récupérer les résultats de l'analyse d'un contrat.

    Args:
        contract_id: ID du contrat
        current_user_id: ID de l'utilisateur connecté
        db: Session de base de données

    Returns:
        Les résultats de l'analyse
    """
    # Vérifie que le contrat existe et appartient à l'utilisateur
    result = await db.execute(
        select(Contract).where(
            col(Contract.id) == contract_id,
            col(Contract.user_id) == current_user_id,
        )
    )
    contract = result.scalar_one_or_none()

    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrat non trouvé",
        )

    # Récupère l'analyse
    result = await db.execute(select(Analysis).where(col(Analysis.contract_id) == contract_id))
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analyse non trouvée",
        )

    if analysis.status != AnalysisStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Analyse non terminée. Statut actuel: {analysis.status}",
        )

    return cast(Analysis, analysis)
