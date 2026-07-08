"""Minimal Clerk Backend API client — fetch a user's real profile.

The default Clerk session token carries no email claim, so we ask the Backend
API (works for Google OAuth accounts too — Clerk stores the Google email).
"""
import logging

import httpx

from .config import settings

logger = logging.getLogger(__name__)

BASE = "https://api.clerk.com/v1"


async def fetch_user(clerk_id: str) -> dict | None:
    """Return {email, full_name} for a Clerk user, or None on any failure."""
    if not settings.clerk_secret_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{BASE}/users/{clerk_id}",
                headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
            )
        if resp.status_code >= 400:
            logger.warning("Clerk API %s for %s", resp.status_code, clerk_id)
            return None
        data = resp.json()

        email = None
        primary_id = data.get("primary_email_address_id")
        for entry in data.get("email_addresses") or []:
            if entry.get("id") == primary_id or email is None:
                email = entry.get("email_address") or email
            if entry.get("id") == primary_id:
                break

        full_name = (
            f"{data.get('first_name') or ''} {data.get('last_name') or ''}".strip() or None
        )
        return {"email": email, "full_name": full_name}
    except Exception as e:  # noqa: BLE001 — never break auth on profile fetch
        logger.warning("Clerk API fetch failed for %s: %s", clerk_id, e)
        return None
