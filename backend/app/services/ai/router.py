"""Provider router — resolves a user's active BYOK provider and dispatches.

Single entrypoint for every AI feature. Picks the user's active UserProvider,
decrypts its key (Ollama needs none), instantiates the matching adapter, and
calls the uniform `complete()`.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...models.user import User
from ...models.provider import UserProvider
from ..crypto import decrypt
from .base import BaseProvider, ChatMessage, ChatResult, ProviderError
from .providers.openai import OpenAIProvider
from .providers.anthropic import AnthropicProvider
from .providers.openrouter import OpenRouterProvider
from .providers.gemini import GeminiProvider
from .providers.ollama import OllamaProvider

PROVIDERS: dict[str, type[BaseProvider]] = {
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "openrouter": OpenRouterProvider,
    "gemini": GeminiProvider,
    "ollama": OllamaProvider,
}


async def resolve_provider(
    user: User, db: AsyncSession, *, provider: str | None = None
) -> BaseProvider:
    query = select(UserProvider).where(
        UserProvider.user_id == user.id,
        UserProvider.is_active == True,  # noqa: E712 (SQLAlchemy needs ==)
    )
    if provider:
        query = query.where(UserProvider.provider == provider)
    query = query.order_by(UserProvider.updated_at.desc())

    row = (await db.execute(query)).scalars().first()
    if row is None:
        raise ProviderError("Nenhum provedor de IA configurado")

    cls = PROVIDERS.get(row.provider)
    if cls is None:
        raise ProviderError(f"Provedor não suportado: {row.provider}")

    key = decrypt(row.encrypted_key) if row.encrypted_key else None
    return cls(api_key=key, endpoint_url=row.endpoint_url)


async def complete(
    user: User,
    db: AsyncSession,
    messages: list[ChatMessage],
    *,
    provider: str | None = None,
    model: str | None = None,
    max_tokens: int = 4096,
    json_mode: bool = False,
) -> ChatResult:
    p = await resolve_provider(user, db, provider=provider)
    return await p.complete(
        messages, model=model, max_tokens=max_tokens, json_mode=json_mode
    )
