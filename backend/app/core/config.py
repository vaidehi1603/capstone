from typing import List, Union
# pyrefly: ignore[missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator

import os

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    SECRET_KEY: str = "supersecretkey_change_in_production"
    DATABASE_URL: str = "sqlite:///./test.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GEMINI_API_KEY: str = ""
    
    @validator("DATABASE_URL", pre=True)
    def normalize_database_url(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] | List[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=(env_path, ".env"), env_file_encoding="utf-8", extra="ignore")

settings = Settings()
