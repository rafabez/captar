import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .security import verify_clerk_token
from . import clerk_api
from ..models.user import User

bearer_scheme = HTTPBearer(auto_error=False)

PLACEHOLDER_SUFFIX = "@users.captar"


async def _real_profile(clerk_id: str, payload: dict) -> tuple[str | None, str | None]:
    """Best real (email, full_name) available: token claims, else Clerk Backend API."""
    email = payload.get("email")
    full_name = (
        f"{payload.get('first_name', '')} {payload.get('last_name', '')}".strip() or None
    )
    if not email or not full_name:
        profile = await clerk_api.fetch_user(clerk_id)
        if profile:
            email = email or profile.get("email")
            full_name = full_name or profile.get("full_name")
    return email, full_name


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None

    payload = await verify_clerk_token(credentials.credentials)
    if payload is None:
        return None

    # Clerk puts the user ID in the 'sub' claim
    clerk_id = payload.get("sub")
    if not clerk_id:
        return None

    # Find or create the local user record
    result = await db.execute(select(User).where(User.clerk_id == clerk_id))
    user = result.scalar_one_or_none()

    if user is None:
        # Auto-create on first request. The default session token has no email
        # claim, so fetch the real profile from the Clerk Backend API (works for
        # Google sign-ins too); fall back to a unique placeholder — users.email
        # is UNIQUE and "" would collide on the 2nd user.
        email, full_name = await _real_profile(clerk_id, payload)
        user = User(
            clerk_id=clerk_id,
            email=email or f"{clerk_id}{PLACEHOLDER_SUFFIX}",
            full_name=full_name,
        )
        db.add(user)
        try:
            await db.commit()
            await db.refresh(user)
        except IntegrityError:
            # Parallel first requests raced to create the same user — reload it.
            await db.rollback()
            result = await db.execute(select(User).where(User.clerk_id == clerk_id))
            user = result.scalar_one_or_none()
    elif user.email.endswith(PLACEHOLDER_SUFFIX):
        # Heal users created before the Clerk API lookup existed.
        email, full_name = await _real_profile(clerk_id, payload)
        if email:
            user.email = email
            if full_name and not user.full_name:
                user.full_name = full_name
            try:
                await db.commit()
                await db.refresh(user)
            except IntegrityError:
                await db.rollback()  # email already taken by another row — keep placeholder

    return user


async def require_user(
    current_user: User | None = Depends(get_current_user),
) -> User:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação necessária",
        )
    return current_user
