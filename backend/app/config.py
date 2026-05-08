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

    # Embedding API 配置
    embedding_vllm_url: str = "http://localhost:8001/v1/embeddings"
    embedding_api_url: str = "https://api.siliconflow.cn/v1/embeddings"
    embedding_api_key: str = ""
    embedding_model: str = "Qwen/Qwen3-VL-Embedding-8B"
    embedding_dimension: int = 2560
    embedding_image_max_size: int = 768
    embedding_vllm_concurrency: int = 32

    # 去重检测配置
    duplicate_similarity_threshold: float = 0.85
    duplicate_sample_count: int = 5

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
