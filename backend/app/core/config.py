from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CAPTAR API"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://captar:captar@localhost:5432/captar"
    redis_url: str = "redis://localhost:6379"

    # Clerk
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    @property
    def clerk_jwks_url(self) -> str:
        """Derive JWKS URL from Clerk publishable key."""
        pk = self.clerk_publishable_key
        if not pk:
            return ""
        # The publishable key contains the instance ID: pk_test_<instance-id>
        # Extract it to build JWKS URL
        parts = pk.split("_")
        if len(parts) >= 3:
            instance_id = parts[2]
            return f"https://{instance_id}.clerk.accounts.dev/.well-known/jwks.json"
        return ""

    class Config:
        env_file = ".env"


settings = Settings()
