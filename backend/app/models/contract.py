"""Contract model.

Ce module définit le modèle de données pour les contrats.
"""

from datetime import datetime
from enum import Enum
from uuid import UUID

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Enum as SAEnum
from sqlmodel import Field, Relationship

from app.models.base import BaseTableModel


class ContractStatus(str, Enum):
    """Statuts possibles d'un contrat."""
    
    PENDING = "pending"           # En attente d'analyse
    PROCESSING = "processing"     # En cours d'analyse
    COMPLETED = "completed"       # Analyse terminée
    FAILED = "failed"             # Échec de l'analyse


class Contract(BaseTableModel, table=True):
    """Modèle d'un contrat.
    
    Attributes:
        id: UUID unique du contrat
        user_id: ID de l'utilisateur propriétaire
        filename: Nom original du fichier
        file_path: Chemin de stockage du fichier
        file_size: Taille du fichier en octets
        file_type: Type MIME du fichier
        status: Statut actuel du contrat
        created_at: Date de création
        updated_at: Date de dernière mise à jour
    """
    
    __tablename__ = "contracts"
    
    user_id: UUID = Field(
        sa_column=Column(
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    filename: str = Field(
        sa_column=Column(String(255), nullable=False)
    )
    file_path: str = Field(
        sa_column=Column(String(500), nullable=False)
    )
    file_size: int = Field(
        sa_column=Column(Integer, nullable=False)
    )
    file_type: str = Field(
        sa_column=Column(String(100), nullable=False)
    )
    status: ContractStatus = Field(
        default=ContractStatus.PENDING,
        sa_column=Column(
            SAEnum(ContractStatus),
            default=ContractStatus.PENDING,
            nullable=False,
        )
    )
    
    # Relations
    analyses: list["Analysis"] = Relationship(back_populates="contract")


class ContractResponse(SQLModel):
    """Schéma pour la réponse contrat."""
    
    id: UUID
    user_id: UUID
    filename: str
    file_size: int
    file_type: str
    status: ContractStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ContractListResponse(SQLModel):
    """Schéma pour la liste des contrats."""
    
    id: UUID
    filename: str
    status: ContractStatus
    created_at: datetime
    
    class Config:
        from_attributes = True
