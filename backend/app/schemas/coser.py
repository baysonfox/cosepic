"""Coser request/response schemas."""

from datetime import datetime

from pydantic import BaseModel


class CoserCreate(BaseModel):
    """Request body for creating a Coser."""

    name: str


class CoserUpdate(BaseModel):
    """Request body for updating a Coser."""

    name: str | None = None


class CoserOut(BaseModel):
    """Response body for a Coser."""

    id: int
    name: str
    avatar_asset_id: int | None
    created_at: datetime
    updated_at: datetime
    pack_count: int = 0
    aliases: list[str] = []


class CoserAliasCreate(BaseModel):
    """Request body for adding a Coser alias."""

    alias: str


class CoserAliasOut(BaseModel):
    """Response body for a Coser alias."""

    id: int
    coser_id: int
    alias: str
