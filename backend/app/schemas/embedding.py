"""Embedding schemas for API requests and responses."""

from pydantic import BaseModel, Field


class DuplicateCheckRequest(BaseModel):
    """去重检测请求."""

    pack_id: int = Field(..., description="要检测的 Pack ID")


class DuplicateItem(BaseModel):
    """单个重复项."""

    duplicate_pack_id: int
    duplicate_pack_title: str
    max_similarity: float = Field(..., ge=0.0, le=1.0)
    matched_asset_id: int
    duplicate_asset_id: int


class DuplicateCheckResponse(BaseModel):
    """去重检测响应."""

    pack_id: int
    has_duplicates: bool
    duplicates: list[DuplicateItem] = []


class EmbeddingStatsItem(BaseModel):
    """单个 Pack 的 embedding 状态."""

    pack_id: int
    pack_title: str
    total_images: int
    processed_images: int | None = None
    progress: float | None = None


class EmbeddingStatsResponse(BaseModel):
    """Embedding 覆盖统计."""

    total_packs: int
    total_assets: int
    embeddings_count: int
    completed_packs: int
    incomplete_packs: list[EmbeddingStatsItem] = []
    no_embedding_packs: list[EmbeddingStatsItem] = []
