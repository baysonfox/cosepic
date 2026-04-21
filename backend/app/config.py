"""Application configuration loaded from environment variables."""

from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Cosepic backend settings.

    Values are loaded from environment variables or a .env file
    located in the backend directory.
    """

    database_url: str = "postgresql+psycopg://cosepic:cosepic@127.0.0.1:5432/cosepic"
    data_dir: Path = Path("./data")
    thumbnail_dir: Path = Path("./data/cache/thumbnails")
    thumbnail_width: int = 400
    thumbnail_quality: int = 60
    cors_origins: list[str] = ["http://localhost:3000"]
    default_page_size: int = 20
    max_page_size: int = 100
    blurhash_x: int = 4
    blurhash_y: int = 3

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
