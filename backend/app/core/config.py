from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CAPTAR API"
    debug: bool = False
    secret_key: str = "change-me-in-production"
    encryption_key: str = "change-me-in-production"

    database_url: str = "postgresql+asyncpg://captar:captar@localhost:5432/captar"
    redis_url: str = "redis://localhost:6379"

    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
