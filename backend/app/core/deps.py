import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .security import verify_clerk_token
from ..models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


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
        # Auto-create user from Clerk data on first request. Clerk's default
        # session token carries no email claim, so fall back to a per-user
        # placeholder — users.email is UNIQUE and "" would collide on the 2nd user.
        email = payload.get("email") or f"{clerk_id}@users.captar"
        full_name = (
            f"{payload.get('first_name', '')} {payload.get('last_name', '')}".strip()
            or None
        )
        user = User(
            clerk_id=clerk_id,
            email=email,
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
