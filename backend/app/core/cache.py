"""Caching utilities using Redis.

This module provides caching functionality for frequently accessed data.
"""

import json
import pickle
from functools import wraps
from typing import Any, Callable, Coroutine, ParamSpec, TypeVar, cast

from redis.asyncio import Redis

from app.config import settings

P = ParamSpec("P")
T = TypeVar("T")


class Cache:
    """Redis cache wrapper with async support."""

    def __init__(self, redis_client: Redis | None = None) -> None:
        self.redis = redis_client
        self.default_ttl = 300  # 5 minutes

    async def get(self, key: str) -> Any | None:
        """Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        if not self.redis:
            return None

        try:
            data = await self.redis.get(key)
            if data:
                return pickle.loads(data)
            return None
        except Exception:
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int | None = None,
    ) -> bool:
        """Set value in cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds

        Returns:
            True if successful, False otherwise
        """
        if not self.redis:
            return False

        try:
            ttl = ttl or self.default_ttl
            serialized = pickle.dumps(value)
            await self.redis.setex(key, ttl, serialized)
            return True
        except Exception:
            return False

    async def delete(self, key: str) -> bool:
        """Delete value from cache.

        Args:
            key: Cache key

        Returns:
            True if successful, False otherwise
        """
        if not self.redis:
            return False

        try:
            await self.redis.delete(key)
            return True
        except Exception:
            return False

    async def clear_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern.

        Args:
            pattern: Redis key pattern (e.g., "user:*")

        Returns:
            Number of keys deleted
        """
        if not self.redis:
            return 0

        try:
            keys = await self.redis.keys(pattern)
            if keys:
                deleted = await self.redis.delete(*keys)
                return int(deleted)
            return 0
        except Exception:
            return 0

    def cached(
        self,
        ttl: int | None = None,
        key_prefix: str = "",
    ) -> Callable[[Callable[P, Any]], Callable[P, Any]]:
        """Decorator to cache function results.

        Args:
            ttl: Time to live in seconds
            key_prefix: Prefix for cache key

        Returns:
            Decorator function
        """

        def decorator(func: Callable[P, Any]) -> Callable[P, Any]:
            if self._is_async(func):

                @wraps(func)
                async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
                    if not self.redis:
                        return await cast(
                            Callable[P, Coroutine[Any, Any, Any]], func
                        )(
                            *args, **kwargs
                        )

                    # Generate cache key
                    cache_key = (
                        f"{key_prefix}:{func.__name__}:{self._make_key(args, kwargs)}"
                    )

                    # Try to get from cache
                    cached_value = await self.get(cache_key)
                    if cached_value is not None:
                        return cached_value

                    # Call function and cache result
                    result = await cast(
                        Callable[P, Coroutine[Any, Any, Any]], func
                    )(
                        *args, **kwargs
                    )
                    await self.set(cache_key, result, ttl)
                    return result

                return async_wrapper

            @wraps(func)
            def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
                if not self.redis:
                    return func(*args, **kwargs)

                # Generate cache key (unused - sync caching not implemented)
                _ = f"{key_prefix}:{func.__name__}:{self._make_key(args, kwargs)}"

                # For sync functions, we can't use async cache
                # Return result without caching
                return func(*args, **kwargs)

            return sync_wrapper

        return decorator

    def _make_key(self, args: tuple[Any, ...], kwargs: dict[str, Any]) -> str:
        """Generate a cache key from arguments."""
        key_data = {
            "args": args,
            "kwargs": kwargs,
        }
        return json.dumps(key_data, sort_keys=True, default=str)

    def _is_async(self, func: Callable[..., Any]) -> bool:
        """Check if a function is async."""
        import inspect

        return inspect.iscoroutinefunction(func)


# Global cache instance
_cache_instance: Cache | None = None


def get_cache(redis_client: Redis | None = None) -> Cache:
    """Get or create cache instance.

    Args:
        redis_client: Optional Redis client

    Returns:
        Cache instance
    """
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = Cache(redis_client)
    return _cache_instance
