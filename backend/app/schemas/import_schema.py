"""Import schemas for scan/commit workflow."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ImportScanRequest(BaseModel):
    """Request to scan a root directory."""

    root_path: str


class ImportCandidateOut(BaseModel):
    """A candidate directory found during scan."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    batch_id: int
    folder_path: str
    folder_name: str
    detected_title: str | None
    detected_coser_names: str | None
    detected_work_name: str | None
    detected_character_names: str | None
    photo_count: int
    video_count: int
    total_size_bytes: int
    existing_pack_id: int | None
    status: str
    created_at: datetime


class ImportCandidateUpdate(BaseModel):
    """User edits to a candidate before committing."""

    detected_title: str | None = None
    detected_coser_names: str | None = None
    detected_work_name: str | None = None
    detected_character_names: str | None = None
    status: str | None = None


class ImportBatchOut(BaseModel):
    """Response for an import batch."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    root_path: str
    status: str
    total_candidates: int
    imported_count: int
    created_at: datetime
    finished_at: datetime | None
    candidates: list[ImportCandidateOut] = []


class ImportCommitResult(BaseModel):
    """Result of committing an import batch."""

    imported_count: int
    pack_ids: list[int]
