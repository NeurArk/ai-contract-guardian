"""Tests for Resend email service."""

import json

import httpx
import pytest

from app.config import settings
from app.services.resend_service import RESEND_EMAIL_ENDPOINT, send_welcome_email


@pytest.mark.asyncio
async def test_send_welcome_email_calls_resend(monkeypatch: pytest.MonkeyPatch) -> None:
    """L'appel Resend est déclenché quand les env vars sont présentes."""
    monkeypatch.setattr(settings, "RESEND_API_KEY", "test-api-key")
    monkeypatch.setattr(settings, "RESEND_FROM", "noreply@example.com")

    captured: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content.decode())
        captured["url"] = str(request.url)
        captured["payload"] = payload
        captured["auth"] = request.headers.get("authorization")
        return httpx.Response(200, json={"id": "email_123"})

    transport = httpx.MockTransport(handler)

    async with httpx.AsyncClient(transport=transport) as client:
        result = await send_welcome_email("user@example.com", client=client)

    assert result is True
    assert captured["url"] == RESEND_EMAIL_ENDPOINT
    assert captured["payload"]["to"] == ["user@example.com"]
    assert captured["payload"]["from"] == "noreply@example.com"
    assert captured["auth"] == "Bearer test-api-key"
