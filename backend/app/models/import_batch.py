"""Import batch and candidate models."""

from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel


class ImportBatch(SQLModel, table=True):
    """A batch import operation."""

    __tablename__ = "import_batches"

    id: int | None = Field(default=None, primary_key=True)
    root_path: str = Field(max_length=1024, nullable=False)
    status: str = Field(default="scanning", max_length=20)
    total_candidates: int = Field(default=0)
    imported_count: int = Field(default=0)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    finished_at: datetime | None = Field(default=None)

    # Relationships
    candidates: list["ImportCandidate"] = Relationship(back_populates="batch")


class ImportCandidate(SQLModel, table=True):
    """A candidate directory discovered during an import scan."""

    __tablename__ = "import_candidates"

    id: int | None = Field(default=None, primary_key=True)
    batch_id: int = Field(foreign_key="import_batches.id", nullable=False)
    folder_path: str = Field(max_length=1024, nullable=False)
    folder_name: str = Field(max_length=512, nullable=False)
    detected_title: str | None = Field(default=None, max_length=512)
    detected_coser_names: str | None = Field(default=None, max_length=512)
    detected_work_name: str | None = Field(default=None, max_length=256)
    detected_character_names: str | None = Field(default=None, max_length=512)
    photo_count: int = Field(default=0)
    video_count: int = Field(default=0)
    total_size_bytes: int = Field(default=0)
    existing_pack_id: int | None = Field(default=None)
    status: str = Field(default="pending", max_length=20)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    batch: ImportBatch = Relationship(back_populates="candidates")
