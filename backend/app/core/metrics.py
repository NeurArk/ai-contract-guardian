"""Lightweight metrics helpers.

Stores simple counters in Redis when available. Falls back to no-op if Redis
is unavailable to avoid breaking requests.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone

from app.db.session import get_redis_client

logger = logging.getLogger(__name__)

DEFAULT_TTL_DAYS = 30


def _daily_key(metric: str, day: date) -> str:
    return f"metrics:daily:{day.isoformat()}:{metric}"


async def increment_daily(
    metric: str,
    *,
    ttl_days: int = DEFAULT_TTL_DAYS,
    day: date | None = None,
) -> None:
    """Increment a daily counter stored in Redis.

    Args:
        metric: Metric name (e.g. "auth.login_failed")
        ttl_days: TTL in days
        day: override day for deterministic tests
    """

    try:
        redis = await get_redis_client()
    except Exception:
        return

    if not redis:
        return

    metric_day = day or datetime.now(timezone.utc).date()
    key = _daily_key(metric, metric_day)

    try:
        await redis.incr(key)
        ttl = await redis.ttl(key)
        if ttl is None or ttl < 0:
            await redis.expire(key, ttl_days * 24 * 60 * 60)
    except Exception:
        logger.debug("Metrics increment failed", exc_info=True)
        return
