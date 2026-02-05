"""Security middleware and utilities.

This module provides security enhancements including:
- Security headers middleware (Helmet-like functionality)
- Rate limiting
- CORS configuration
- CSRF protection helpers
"""

from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from redis.asyncio import Redis
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses."""

    def __init__(
        self,
        app: ASGIApp,
        csp_policy: str | None = None,
        allow_iframes: bool = False,
    ):
        super().__init__(app)
        self.allow_iframes = allow_iframes
        # Default Content Security Policy
        self.csp_policy = csp_policy or (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' http://localhost:8000 https://api.anthropic.com; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        response = await call_next(request)

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        if not self.allow_iframes:
            response.headers["X-Frame-Options"] = "DENY"

        # XSS Protection
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Content Security Policy
        response.headers["Content-Security-Policy"] = self.csp_policy

        # Strict Transport Security (HSTS) - only in production
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions Policy
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
            "magnetometer=(), microphone=(), payment=(), usb=()"
        )

        # Cache control for sensitive pages
        if request.url.path.startswith(("/api/v1/auth", "/api/v1/users")):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware using Redis."""

    def __init__(
        self,
        app: ASGIApp,
        redis_client: Redis | None = None,
        requests_per_minute: int = 60,
        burst_size: int = 10,
    ) -> None:
        super().__init__(app)
        self.redis = redis_client
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        # Skip rate limiting if no Redis client
        if not self.redis:
            return await call_next(request)

        # Get client IP
        client_ip = self._get_client_ip(request)
        key = f"rate_limit:{client_ip}:{request.url.path}"

        # Check rate limit
        current_count = await self.redis.get(key)
        if current_count and int(current_count) >= self.requests_per_minute:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers={"Retry-After": "60"},
            )

        # Increment counter
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, 60)  # 1 minute expiry
        await pipe.execute()

        return await call_next(request)

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


def setup_security_middleware(
    app: FastAPI,
    cors_origins: list[str],
    redis_client: Redis | None = None,
    enable_gzip: bool = True,
    allow_iframes: bool = False,
) -> None:
    """Configure all security middleware for the FastAPI app.

    Args:
        app: FastAPI application instance
        cors_origins: List of allowed CORS origins
        redis_client: Optional Redis client for rate limiting
        enable_gzip: Whether to enable GZip compression
        allow_iframes: Whether to allow the app to be embedded in iframes
    """

    # Security Headers (Helmet-like)
    app.add_middleware(
        SecurityHeadersMiddleware,
        allow_iframes=allow_iframes,
    )

    # Rate Limiting
    if redis_client:
        app.add_middleware(
            RateLimitMiddleware,
            redis_client=redis_client,
            requests_per_minute=60,
            burst_size=10,
        )

    # GZip Compression
    if enable_gzip:
        app.add_middleware(GZipMiddleware, minimum_size=1000)

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
        max_age=600,  # 10 minutes
    )


# CSRF Protection helpers
def generate_csrf_token() -> str:
    """Generate a random CSRF token."""
    import secrets

    return secrets.token_urlsafe(32)


def validate_csrf_token(token: str, cookie_token: str) -> bool:
    """Validate a CSRF token against the cookie token."""
    import hmac

    return hmac.compare_digest(token, cookie_token)
