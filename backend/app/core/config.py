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

    # Fernet key (urlsafe base64, 32 bytes) used to encrypt BYOK provider keys at rest.
    encryption_key: str = ""

    @property
    def clerk_frontend_api(self) -> str:
        """Decode the Clerk Frontend API host from the publishable key.

        Keys are `pk_[live|test]_<base64(frontend-api-host)>$` — e.g.
        `healthy-sparrow-27.clerk.accounts.dev`. This host is the basis for both
        the JWKS URL and the token issuer.
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
            return base64.b64decode(encoded).decode("utf-8").rstrip("$")
        except Exception:
            return ""

    @property
    def clerk_jwks_url(self) -> str:
        host = self.clerk_frontend_api
        return f"https://{host}/.well-known/jwks.json" if host else ""

    @property
    def clerk_issuer(self) -> str:
        """Expected `iss` claim — the Frontend API origin (e.g. accounts.dev)."""
        host = self.clerk_frontend_api
        return f"https://{host}" if host else ""

    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
