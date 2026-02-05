"""Analysis model.

Ce module définit le modèle de données pour les analyses de contrats.
"""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, Text, Enum as SAEnum, Float
from sqlmodel import Field, Relationship, SQLModel

from app.models.base import BaseTableModel

# Import pour les relations type hints
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.contract import Contract


class AnalysisStatus(str, Enum):
    """Statuts possibles d'une analyse."""

    PENDING = "pending"  # En attente
    PROCESSING = "processing"  # En cours
    COMPLETED = "completed"  # Terminée
    FAILED = "failed"  # Échec


class Analysis(BaseTableModel, table=True):
    """Modèle d'une analyse de contrat.

    Attributes:
        id: UUID unique de l'analyse
        contract_id: ID du contrat analysé
        status: Statut de l'analyse
        results: Résultats JSON de l'analyse
        score_equity: Score d'équité (0-100)
        score_clarity: Score de clarté (0-100)
        error_message: Message d'erreur en cas d'échec
        created_at: Date de création
        updated_at: Date de dernière mise à jour
    """

    __tablename__ = "analyses"

    contract_id: UUID = Field(
        sa_column=Column(
            ForeignKey("contracts.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    status: AnalysisStatus = Field(
        default=AnalysisStatus.PENDING,
        sa_column=Column(
            SAEnum(AnalysisStatus),
            default=AnalysisStatus.PENDING,
            nullable=False,
        ),
    )
    results: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON, nullable=True))
    score_equity: int | None = Field(default=None, sa_column=Column(Integer, nullable=True))
    score_clarity: int | None = Field(default=None, sa_column=Column(Integer, nullable=True))
    error_message: str | None = Field(default=None, sa_column=Column(Text, nullable=True))

    # Relations
    contract: "Contract" = Relationship(back_populates="analyses")


class AnalysisResponse(SQLModel):
    """Schéma pour la réponse analyse."""

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


class AnalysisStatusResponse(SQLModel):
    """Schéma pour le statut de l'analyse."""

    contract_id: UUID
    analysis_id: UUID
    status: AnalysisStatus
    score_equity: int | None
    score_clarity: int | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
