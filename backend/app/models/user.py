"""User model.

Ce module définit le modèle de données pour les utilisateurs.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, DateTime, String, Boolean
from sqlmodel import Field, SQLModel

from app.models.base import BaseTableModel, utc_now


class User(BaseTableModel, table=True):
    """Modèle de l'utilisateur.

    Attributes:
        id: UUID unique de l'utilisateur
        email: Adresse email unique
        password_hash: Hash du mot de passe
        is_active: Indique si le compte est actif
        created_at: Date de création
        updated_at: Date de dernière mise à jour
    """

    __tablename__ = "users"

    email: str = Field(sa_column=Column(String(255), unique=True, index=True, nullable=False))
    password_hash: str = Field(sa_column=Column(String(255), nullable=False))
    is_active: bool = Field(default=True, sa_column=Column(Boolean, default=True, nullable=False))


class UserCreate(SQLModel):
    """Schéma pour la création d'un utilisateur."""

    email: str
    password: str


class UserResponse(SQLModel):
    """Schéma pour la réponse utilisateur."""

    id: UUID
    email: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(SQLModel):
    """Schéma pour la connexion."""

    email: str
    password: str


class TokenRefresh(SQLModel):
    """Schéma pour le rafraîchissement du token."""

    refresh_token: str
