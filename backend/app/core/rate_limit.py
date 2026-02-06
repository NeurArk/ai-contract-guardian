"""Rate limiting utilities for authentication endpoints.

Uses Redis when available, with a safe in-memory fallback when Redis is
unreachable (e.g., in local dev or tests). The in-memory fallback is
process-local and should not be relied upon in production.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import logging
import time
from typing import Iterable

from fastapi import HTTPException, Request, status

from app.config import settings
from app.core.metrics import increment_daily
from app.db.session import get_redis_client

logger = logging.getLogger(__name__)


@dataclass
class _Bucket:
    count: int
    reset_at: float


_IN_MEMORY_BUCKETS: dict[str, _Bucket] = {}


def reset_in_memory_rate_limits() -> None:
    """Reset in-memory buckets (useful for tests)."""
    _IN_MEMORY_BUCKETS.clear()


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _email_hash(email: str | None) -> str | None:
    if not email:
        return None
    normalized = email.lower().strip().encode("utf-8")
    return hashlib.sha256(normalized).hexdigest()[:12]


def _in_memory_check_and_inc(key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    now = time.time()
    bucket = _IN_MEMORY_BUCKETS.get(key)
    if not bucket or now >= bucket.reset_at:
        bucket = _Bucket(count=0, reset_at=now + window_seconds)

    bucket.count += 1
    _IN_MEMORY_BUCKETS[key] = bucket

    retry_after = max(1, int(bucket.reset_at - now))
    return bucket.count <= limit, retry_after


async def _redis_check_and_inc(
    redis,
    key: str,
    limit: int,
    window_seconds: int,
) -> tuple[bool, int]:
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, window_seconds)

    if count > limit:
        ttl = await redis.ttl(key)
        retry_after = ttl if ttl and ttl > 0 else window_seconds
        return False, retry_after

    ttl = await redis.ttl(key)
    return True, ttl if ttl and ttl > 0 else window_seconds


async def _check_limits_for_key(
    key_base: str,
    limits: Iterable[tuple[int, int]],
) -> tuple[bool, int]:
    """Check (and increment) limits for a key.

    Args:
        key_base: base key (without window suffix)
        limits: iterable of (limit, window_seconds)

    Returns:
        (allowed, retry_after_seconds)
    """

    try:
        redis = await get_redis_client()
        use_redis = True
    except Exception:
        redis = None
        use_redis = False

    allowed = True
    retry_after = 1

    for limit, window in limits:
        key = f"{key_base}:{window}s"
        try:
            if use_redis and redis is not None:
                ok, retry = await _redis_check_and_inc(redis, key, limit, window)
            else:
                ok, retry = _in_memory_check_and_inc(key, limit, window)
        except Exception:
            # Redis down/unreachable -> fallback in-memory
            ok, retry = _in_memory_check_and_inc(key, limit, window)

        if not ok:
            allowed = False
            retry_after = max(retry_after, retry)

    return allowed, retry_after


async def enforce_auth_rate_limit(
    request: Request,
    email: str | None,
    action: str,
) -> None:
    """Enforce rate limits on auth endpoints.

    Limits are applied per IP and per email (if provided).
    Raises HTTPException(429) when exceeded.
    """

    if not getattr(settings, "AUTH_RATE_LIMIT_ENABLED", True):
        return

    # Separate limits for email vs IP.
    # Email limits are stricter (protect single account brute force).
    # IP limits are higher (avoid blocking many users behind NAT; still blocks broad abuse).
    email_limits = (
        (getattr(settings, "AUTH_RATE_LIMIT_PER_MINUTE", 5), 60),
        (getattr(settings, "AUTH_RATE_LIMIT_PER_HOUR", 20), 3600),
    )
    ip_limits = (
        (getattr(settings, "AUTH_RATE_LIMIT_IP_PER_MINUTE", 60), 60),
        (getattr(settings, "AUTH_RATE_LIMIT_IP_PER_HOUR", 300), 3600),
    )

    client_ip = _get_client_ip(request)

    checks: list[tuple[str, Iterable[tuple[int, int]]]] = [(f"auth:{action}:ip:{client_ip}", ip_limits)]
    if email:
        checks.append((f"auth:{action}:email:{email.lower().strip()}", email_limits))

    retry_after = 1
    for key_base, limits in checks:
        allowed, retry = await _check_limits_for_key(key_base, limits)
        retry_after = max(retry_after, retry)
        if not allowed:
            email_fingerprint = _email_hash(email)
            logger.warning(
                "Auth rate limit exceeded",
                extra={
                    "action": action,
                    "email_hash": email_fingerprint,
                    "ip": client_ip,
                },
            )
            if action == "login":
                await increment_daily("auth.login_rate_limited")
            elif action == "register":
                await increment_daily("auth.register_rate_limited")

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Trop de tentatives. Réessayez dans {retry_after} secondes.",
                headers={"Retry-After": str(retry_after)},
            )
