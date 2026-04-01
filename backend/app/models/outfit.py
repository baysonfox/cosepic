"""Outfit model — a costume variant of a Character."""

from datetime import datetime, timezone

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


class Outfit(SQLModel, table=True):
    """A specific costume or skin variant of a character."""

    __tablename__ = "outfits"
    __table_args__ = (
        UniqueConstraint("name", "character_id", name="uq_outfit_name_character"),
    )

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=256, nullable=False)
    character_id: int = Field(foreign_key="characters.id", nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    character: "Character" = Relationship(back_populates="outfits")
    pack_links: list["PackOutfit"] = Relationship(back_populates="outfit")


from app.models.character import Character  # noqa: E402, F401
from app.models.relations import PackOutfit  # noqa: E402, F401
