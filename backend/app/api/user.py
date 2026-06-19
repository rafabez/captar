from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.deps import require_user
from ..models.user import User
from ..models.provider import UserProvider
from ..schemas import UserOut, UserProfileUpdate, ProviderCreate, ProviderOut
from ..services.crypto import encrypt

router = APIRouter(prefix="/user", tags=["user"])


def _provider_out(p: UserProvider) -> ProviderOut:
    return ProviderOut(
        id=p.id,
        provider=p.provider,
        is_active=p.is_active,
        endpoint_url=p.endpoint_url,
        has_key=bool(p.encrypted_key),
        created_at=p.created_at,
    )


@router.get("/profile", response_model=UserOut)
async def get_profile(current_user: User = Depends(require_user)):
    return current_user


@router.patch("/profile", response_model=UserOut)
async def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/providers", response_model=list[ProviderOut])
async def list_providers(
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserProvider).where(UserProvider.user_id == current_user.id)
    )
    return [_provider_out(p) for p in result.scalars().all()]


@router.post("/providers", response_model=ProviderOut, status_code=201)
async def add_provider(
    data: ProviderCreate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    # Upsert: update if exists
    result = await db.execute(
        select(UserProvider).where(
            UserProvider.user_id == current_user.id,
            UserProvider.provider == data.provider,
        )
    )
    provider = result.scalar_one_or_none()

    enc_key = encrypt(data.api_key) if data.api_key else None

    if provider:
        if enc_key is not None:
            provider.encrypted_key = enc_key
        if data.endpoint_url is not None:
            provider.endpoint_url = data.endpoint_url
        provider.is_active = True
    else:
        provider = UserProvider(
            user_id=current_user.id,
            provider=data.provider,
            encrypted_key=enc_key,
            endpoint_url=data.endpoint_url,
        )
        db.add(provider)

    await db.commit()
    await db.refresh(provider)
    return _provider_out(provider)


@router.delete("/providers/{provider_name}", status_code=204)
async def remove_provider(
    provider_name: str,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserProvider).where(
            UserProvider.user_id == current_user.id,
            UserProvider.provider == provider_name,
        )
    )
    provider = result.scalar_one_or_none()
    if provider:
        provider.is_active = False
        await db.commit()
