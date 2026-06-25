import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    """
    Application Settings class using Pydantic Settings.
    It automatically reads configuration variables from environment variables
    and falls back to values defined in the .env file.
    """
    APP_NAME: str = Field("Industrial Safety Intelligence Platform API", validation_alias="APP_NAME")
    DEBUG: bool = Field(True, validation_alias="DEBUG")
    API_V1_STR: str = Field("/api/v1", validation_alias="API_V1_STR")

    # SQLite Database configuration
    DATABASE_URL: str = Field("sqlite:///./data/safety_platform.db", validation_alias="DATABASE_URL")

    # AI Model Settings
    OPENAI_API_KEY: str = Field("placeholder_key", validation_alias="OPENAI_API_KEY")
    GEMINI_API_KEY: str = Field("placeholder_key", validation_alias="GEMINI_API_KEY")

    # RAG Vector Store Settings
    FAISS_INDEX_PATH: str = Field("./data/faiss_index", validation_alias="FAISS_INDEX_PATH")
    VECTOR_DB_DIMENSION: int = Field(1536, validation_alias="VECTOR_DB_DIMENSION")

    model_config = SettingsConfigDict(
        env_file=(
            ".env",
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        ),
        env_file_encoding="utf-8",
        extra="ignore" # Ignore extra env variables
    )

# Instantiate the settings singleton to be used across the application
settings = Settings()

# Trigger Uvicorn Hot-Reload (Force pick up root .env key)


