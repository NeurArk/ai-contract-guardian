"""Tests for metrics helpers."""

from __future__ import annotations

from datetime import date

import pytest

from app.core import metrics


class FakeRedis:
    def __init__(self) -> None:
        self.store: dict[str, int] = {}
        self.ttls: dict[str, int] = {}

    async def incr(self, key: str) -> int:
        self.store[key] = self.store.get(key, 0) + 1
        return self.store[key]

    async def ttl(self, key: str) -> int:
        return self.ttls.get(key, -1)

    async def expire(self, key: str, seconds: int) -> bool:
        self.ttls[key] = seconds
        return True


@pytest.mark.asyncio
async def test_increment_daily_sets_ttl(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeRedis()

    async def _fake_get_redis_client():
        return fake

    monkeypatch.setattr(metrics, "get_redis_client", _fake_get_redis_client)

    day = date(2026, 2, 6)
    await metrics.increment_daily("auth.login_failed", ttl_days=30, day=day)

    key = f"metrics:daily:{day.isoformat()}:auth.login_failed"
    assert fake.store[key] == 1
    assert fake.ttls[key] == 30 * 24 * 60 * 60


@pytest.mark.asyncio
async def test_increment_daily_no_redis(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _raise():
        raise RuntimeError("redis down")

    monkeypatch.setattr(metrics, "get_redis_client", _raise)

    # Should not raise
    await metrics.increment_daily("auth.login_failed")
