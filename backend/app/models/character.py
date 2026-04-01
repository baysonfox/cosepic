"""Character model — a fictional character belonging to a Work."""

from datetime import datetime, timezone

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


class Character(SQLModel, table=True):
    """A character from a creative work."""

    __tablename__ = "characters"
    __table_args__ = (
        UniqueConstraint("name", "work_id", name="uq_character_name_work"),
    )

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=256, nullable=False)
    work_id: int | None = Field(default=None, foreign_key="works.id")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    work: "Work | None" = Relationship(back_populates="characters")
    outfits: list["Outfit"] = Relationship(back_populates="character")
    pack_links: list["PackCharacter"] = Relationship(back_populates="character")


from app.models.outfit import Outfit  # noqa: E402, F401
from app.models.relations import PackCharacter  # noqa: E402, F401
from app.models.work import Work  # noqa: E402, F401
