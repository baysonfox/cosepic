"""Tag model — free-form labels for Packs."""

from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel


class Tag(SQLModel, table=True):
    """A free-form tag attached to packs."""

    __tablename__ = "tags"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=128, nullable=False, unique=True)
    tag_type: str = Field(default="other", max_length=20)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    pack_links: list["PackTag"] = Relationship(back_populates="tag")


from app.models.relations import PackTag  # noqa: E402, F401
