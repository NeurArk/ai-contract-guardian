"""Resend email service.

Ce module envoie des emails via l'API Resend.
L'envoi est optionnel et contrôlé par les variables d'environnement:
- RESEND_API_KEY
- RESEND_FROM
"""

from __future__ import annotations

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails"
WELCOME_SUBJECT = "Bienvenue sur AI Contract Guardian"
WELCOME_TEXT = (
    "Bonjour,\n\n"
    "Bienvenue sur AI Contract Guardian !\n"
    "Votre compte est prêt, vous pouvez désormais analyser vos contrats.\n\n"
    "À bientôt,\n"
    "L'équipe AI Contract Guardian"
)


def resend_enabled() -> bool:
    """Vérifie si l'envoi Resend est activé via env vars."""
    return bool(settings.RESEND_API_KEY and settings.RESEND_FROM)


async def send_welcome_email(
    recipient: str,
    client: httpx.AsyncClient | None = None,
) -> bool:
    """Envoie un email de bienvenue via Resend (best-effort).

    Args:
        recipient: Email du destinataire.
        client: Client httpx optionnel (pour tests).

    Returns:
        True si l'appel Resend réussit, False sinon.
    """
    if not resend_enabled():
        return False

    payload = {
        "from": settings.RESEND_FROM,
        "to": [recipient],
        "subject": WELCOME_SUBJECT,
        "text": WELCOME_TEXT,
    }
    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        if client is None:
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                response = await http_client.post(
                    RESEND_EMAIL_ENDPOINT, headers=headers, json=payload
                )
        else:
            response = await client.post(
                RESEND_EMAIL_ENDPOINT, headers=headers, json=payload
            )

        response.raise_for_status()
        return True
    except Exception as exc:
        logger.warning(
            "Echec envoi email Resend pour %s",
            recipient,
            exc_info=exc,
        )
        return False
