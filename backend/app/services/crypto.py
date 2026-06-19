"""Symmetric encryption for secrets at rest (BYOK provider keys).

Uses Fernet (AES-128-CBC + HMAC) keyed by settings.encryption_key. The plaintext
provider key never leaves the backend in cleartext and is never returned to clients.
"""
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from ..core.config import settings


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    key = settings.encryption_key
    if not key:
        raise RuntimeError("ENCRYPTION_KEY not configured")
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt(token: str) -> str | None:
    """Return the decrypted secret, or None if the token is invalid/corrupt."""
    try:
        return _fernet().decrypt(token.encode()).decode()
    except (InvalidToken, ValueError):
        return None
