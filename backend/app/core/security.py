import logging
from typing import Optional

import httpx
from jose import jwt, JWTError

from .config import settings

logger = logging.getLogger(__name__)

ALGORITHM = "RS256"
CLERK_ISSUER_PREFIX = "https://clerk."

_jwks_cache: Optional[dict] = None
_jwks_client: Optional[httpx.AsyncClient] = None


async def _get_jwks() -> dict:
    """Fetch Clerk JWKS, with in-memory caching."""
    global _jwks_cache, _jwks_client
    if _jwks_cache is not None:
        return _jwks_cache

    if _jwks_client is None:
        _jwks_client = httpx.AsyncClient(timeout=10.0)

    jwks_url = settings.clerk_jwks_url
    if not jwks_url:
        raise ValueError("CLERK_JWKS_URL not configured")

    response = await _jwks_client.get(jwks_url)
    response.raise_for_status()
    _jwks_cache = response.json()
    return _jwks_cache


async def verify_clerk_token(token: str) -> dict | None:
    """Verify a Clerk-issued JWT session token.

    Returns the decoded payload if valid, None otherwise.
    """
    try:
        unverified = jwt.get_unverified_header(token)
        kid = unverified.get("kid")
        if not kid:
            return None

        jwks = await _get_jwks()
        key_data = None
        for k in jwks.get("keys", []):
            if k.get("kid") == kid:
                key_data = k
                break

        if not key_data:
            global _jwks_cache
            _jwks_cache = None
            jwks = await _get_jwks()
            for k in jwks.get("keys", []):
                if k.get("kid") == kid:
                    key_data = k
                    break

        if not key_data:
            return None

        payload = jwt.decode(
            token,
            key_data,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},
        )

        iss = payload.get("iss", "")
        if not iss.startswith(CLERK_ISSUER_PREFIX):
            return None

        return payload

    except JWTError:
        return None
    except Exception as e:
        logger.warning(f"Clerk token verification error: {e}")
        return None
