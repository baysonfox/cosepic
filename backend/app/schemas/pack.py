"""Pack request/response schemas."""

from datetime import datetime

from pydantic import BaseModel


class PackCreate(BaseModel):
    """Request body for creating a Pack."""

    title: str
    dir_path: str
    original_folder_name: str | None = None
    description: str | None = None


class PackUpdate(BaseModel):
    """Request body for updating a Pack."""

    title: str | None = None
    description: str | None = None
    dir_path: str | None = None
    status: str | None = None
    cover_asset_id: int | None = None


class CoserBrief(BaseModel):
    id: int
    name: str
    is_primary: bool = False


class CharacterBrief(BaseModel):
    id: int
    name: str
    work_name: str | None = None
    is_primary: bool = False


class OutfitBrief(BaseModel):
    id: int
    name: str
    character_name: str | None = None


class TagBrief(BaseModel):
    id: int
    name: str
    tag_type: str


class PackOut(BaseModel):
    """Response body for a Pack."""

    id: int
    title: str
    description: str | None
    dir_path: str
    original_folder_name: str
    status: str
    cover_asset_id: int | None
    photo_count: int
    video_count: int
    total_size_bytes: int
    created_at: datetime
    updated_at: datetime
    last_scanned_at: datetime | None
    cosers: list[CoserBrief] = []
    characters: list[CharacterBrief] = []
    outfits: list[OutfitBrief] = []
    tags: list[TagBrief] = []


class PackListItem(BaseModel):
    """Lighter response for pack listing."""

    id: int
    title: str
    status: str
    cover_asset_id: int | None
    photo_count: int
    video_count: int
    total_size_bytes: int
    created_at: datetime
    cosers: list[CoserBrief] = []
    characters: list[CharacterBrief] = []
