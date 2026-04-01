"""Coser and CoserAlias models."""

from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel


class Coser(SQLModel, table=True):
    """A cosplayer."""

    __tablename__ = "cosers"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=256, nullable=False, unique=True)
    avatar_asset_id: int | None = Field(default=None, foreign_key="assets.id")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    aliases: list["CoserAlias"] = Relationship(back_populates="coser")
    pack_links: list["PackCoser"] = Relationship(back_populates="coser")


class CoserAlias(SQLModel, table=True):
    """An alternative name for a Coser."""

    __tablename__ = "coser_aliases"

    id: int | None = Field(default=None, primary_key=True)
    coser_id: int = Field(foreign_key="cosers.id", nullable=False)
    alias: str = Field(max_length=256, nullable=False, unique=True)

    # Relationships
    coser: Coser = Relationship(back_populates="aliases")


from app.models.relations import PackCoser  # noqa: E402, F401
