"""Schemas for Work, Character, Outfit, and Tag entities."""

from datetime import datetime

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Work
# ---------------------------------------------------------------------------

class WorkCreate(BaseModel):
    name: str


class WorkUpdate(BaseModel):
    name: str | None = None


class WorkOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    character_count: int = 0
    pack_count: int = 0


# ---------------------------------------------------------------------------
# Character
# ---------------------------------------------------------------------------

class CharacterCreate(BaseModel):
    name: str
    work_id: int | None = None


class CharacterUpdate(BaseModel):
    name: str | None = None
    work_id: int | None = None


class CharacterOut(BaseModel):
    id: int
    name: str
    work_id: int | None
    work_name: str | None = None
    created_at: datetime
    updated_at: datetime
    pack_count: int = 0


# ---------------------------------------------------------------------------
# Outfit
# ---------------------------------------------------------------------------

class OutfitCreate(BaseModel):
    name: str
    character_id: int


class OutfitUpdate(BaseModel):
    name: str | None = None


class OutfitOut(BaseModel):
    id: int
    name: str
    character_id: int
    character_name: str | None = None
    created_at: datetime
    updated_at: datetime
    pack_count: int = 0


# ---------------------------------------------------------------------------
# Tag
# ---------------------------------------------------------------------------

class TagCreate(BaseModel):
    name: str
    tag_type: str = "other"


class TagUpdate(BaseModel):
    name: str | None = None
    tag_type: str | None = None


class TagOut(BaseModel):
    id: int
    name: str
    tag_type: str
    created_at: datetime
    pack_count: int = 0
