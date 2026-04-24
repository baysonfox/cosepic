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


class SemanticSearchRequest(BaseModel):
    """语义搜索请求."""

    query_text: str = Field(..., min_length=1, max_length=500)
    top_k: int | None = Field(default=None, ge=1, le=50)


class SearchResultItem(BaseModel):
    """单个搜索结果."""

    asset_id: int
    pack_id: int
    pack_title: str
    file_name: str
    similarity: float = Field(..., ge=0.0, le=1.0)


class SemanticSearchResponse(BaseModel):
    """语义搜索响应."""

    query_text: str
    results: list[SearchResultItem]
