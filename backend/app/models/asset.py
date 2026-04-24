"""Asset model — a single media file within a Pack."""

from datetime import datetime, timezone

from pgvector.sqlalchemy import HALFVEC
from sqlmodel import Field, Relationship, SQLModel


class Asset(SQLModel, table=True):
    """A single media file belonging to a Pack."""

    __tablename__ = "assets"

    id: int | None = Field(default=None, primary_key=True)
    pack_id: int = Field(foreign_key="packs.id", nullable=False)
    asset_type: str = Field(max_length=10, nullable=False)  # "image" | "video"
    file_name: str = Field(max_length=512, nullable=False)
    relative_path: str = Field(max_length=1024, nullable=False)
    size_bytes: int = Field(default=0)
    width: int | None = Field(default=None)
    height: int | None = Field(default=None)
    duration_ms: int | None = Field(default=None)
    checksum_sha256: str | None = Field(default=None, max_length=64)
    blurhash: str | None = Field(default=None, max_length=64)
    thumbnail_status: str = Field(default="pending", max_length=20)
    sort_index: int = Field(default=0)
    embedding: list[float] | None = Field(
        default=None,
        sa_type=HALFVEC(2560),
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    pack: "Pack" = Relationship(
        back_populates="assets",
        sa_relationship_kwargs={"foreign_keys": "[Asset.pack_id]"},
    )


from app.models.pack import Pack  # noqa: E402, F401
