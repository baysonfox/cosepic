"""MetadataSuggestion model — auto-detected metadata candidates."""

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class MetadataSuggestion(SQLModel, table=True):
    """An auto-detected metadata suggestion for a Pack."""

    __tablename__ = "metadata_suggestions"

    id: int | None = Field(default=None, primary_key=True)
    pack_id: int = Field(foreign_key="packs.id", nullable=False)
    field_name: str = Field(max_length=50, nullable=False)
    candidate_value: str = Field(max_length=512, nullable=False)
    candidate_entity_id: int | None = Field(default=None)
    source: str = Field(max_length=50, nullable=False)
    confidence: float = Field(default=1.0)
    status: str = Field(default="pending", max_length=20)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
