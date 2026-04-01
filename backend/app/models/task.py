"""Task model — background job tracking."""

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Task(SQLModel, table=True):
    """A background task record."""

    __tablename__ = "tasks"

    id: int | None = Field(default=None, primary_key=True)
    task_type: str = Field(max_length=50, nullable=False)
    target_type: str = Field(max_length=20, nullable=False)
    target_id: int = Field(nullable=False)
    status: str = Field(default="pending", max_length=20)
    error_message: str | None = Field(default=None, max_length=2000)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    started_at: datetime | None = Field(default=None)
    finished_at: datetime | None = Field(default=None)
