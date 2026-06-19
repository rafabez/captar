import base64
import re

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CAPTAR API"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://captar:captar@localhost:5432/captar"
    redis_url: str = ""

    clerk_publishable_key: str = ""
    clerk_secret_key: str = ""

    @property
    def clerk_jwks_url(self) -> str:
        """Derive JWKS URL from Clerk publishable key.

        Clerk keys format: pk_[live|test]_<base64(frontend-api-url)>$
        The trailing $ is a delimiter, not part of the encoded data.
        """
        pk = self.clerk_publishable_key
        if not pk:
            return ""

        parts = pk.split("_")
        if len(parts) < 3:
            return ""

        encoded = parts[2]

        if encoded.endswith("$"):
            encoded = encoded[:-1]

        encoded = re.sub(r"[^A-Za-z0-9+/=]", "", encoded)

        padding = 4 - len(encoded) % 4
        if padding != 4:
            encoded += "=" * padding

        try:
            decoded = base64.b64decode(encoded).decode("utf-8")
            decoded = decoded.rstrip("$")
            return f"https://{decoded}/.well-known/jwks.json"
        except Exception:
            return ""

    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
