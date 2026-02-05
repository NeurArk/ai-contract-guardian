"""Base models pour SQLModel.

Ce module définit les modèles de base pour l'ORM SQLModel.
Les modèles spécifiques seront définis dans des fichiers séparés.
"""

from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, event
from sqlalchemy.orm import declared_attr
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    """Retourne la datetime UTC actuelle."""
    return datetime.now(timezone.utc)


class BaseModel(SQLModel):
    """Modèle de base avec champs communs.

    Tous les modèles de l'application doivent hériter de cette classe.
    """

    class Config:
        """Configuration Pydantic."""

        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }


class TimestampMixin(SQLModel):
    """Mixin pour les timestamps created_at et updated_at."""

    created_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
    )


class UUIDMixin(SQLModel):
    """Mixin pour l'ID UUID."""

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )


class BaseTableModel(BaseModel, UUIDMixin, TimestampMixin):
    """Modèle de base pour les tables de la base de données.

    Combine les mixins UUID et Timestamp pour créer
    un modèle de table complet.
    """

    __abstract__ = True

    @declared_attr.directive
    def __tablename__(cls) -> str:
        """Génère automatiquement le nom de la table."""
        return cls.__name__.lower()


def update_timestamp(mapper: Any, connection: Any, target: Any) -> None:
    """Callback pour mettre à jour updated_at avant chaque update."""
    target.updated_at = utc_now()
