"""ARQ Redis connection — shared by the API (enqueue) and the worker (consume)."""
from arq import create_pool
from arq.connections import ArqRedis, RedisSettings

from ..core.config import settings

_pool: ArqRedis | None = None


def redis_settings() -> RedisSettings:
    return RedisSettings.from_dsn(settings.redis_url or "redis://localhost:6379")


async def get_pool() -> ArqRedis:
    global _pool
    if _pool is None:
        _pool = await create_pool(redis_settings())
    return _pool
