"""Work model — an IP / series / franchise."""

from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel


class Work(SQLModel, table=True):
    """A creative work (anime, game, manga, etc.)."""

    __tablename__ = "works"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=256, nullable=False, unique=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    characters: list["Character"] = Relationship(back_populates="work")


from app.models.character import Character  # noqa: E402, F401
