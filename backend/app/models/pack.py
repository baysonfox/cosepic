"""Pack model — the core browsing and management unit."""

from datetime import datetime, timezone

from sqlalchemy import BigInteger
from sqlmodel import Field, Relationship, SQLModel


class Pack(SQLModel, table=True):
    """A cosplay image pack."""

    __tablename__ = "packs"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=512, nullable=False)
    description: str | None = Field(default=None, max_length=2000)
    dir_path: str = Field(max_length=1024, nullable=False)
    original_folder_name: str = Field(max_length=512, nullable=False)
    status: str = Field(default="active", max_length=20)
    cover_asset_id: int | None = Field(default=None, foreign_key="assets.id")
    photo_count: int = Field(default=0)
    video_count: int = Field(default=0)
    total_size_bytes: int = Field(default=0, sa_type=BigInteger)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    last_scanned_at: datetime | None = Field(default=None)

    # Relationships
    assets: list["Asset"] = Relationship(
        back_populates="pack",
        sa_relationship_kwargs={"foreign_keys": "Asset.pack_id"},
    )
    coser_links: list["PackCoser"] = Relationship(back_populates="pack")
    character_links: list["PackCharacter"] = Relationship(back_populates="pack")
    outfit_links: list["PackOutfit"] = Relationship(back_populates="pack")
    tag_links: list["PackTag"] = Relationship(back_populates="pack")


# Avoid circular import at type-checking time.
from app.models.asset import Asset  # noqa: E402, F401
from app.models.relations import (  # noqa: E402, F401
    PackCharacter,
    PackCoser,
    PackOutfit,
    PackTag,
)
