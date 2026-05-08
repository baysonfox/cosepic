"""Import schemas for scan/commit workflow."""

from pydantic import BaseModel


class ImportScanRequest(BaseModel):
    """Request to scan a root directory."""

    root_path: str


class ScanCandidateOut(BaseModel):
    """A candidate directory found during scan."""

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


class ScanResultOut(BaseModel):
    """Response for a directory scan."""

    root_path: str
    total_candidates: int
    candidates: list[ScanCandidateOut]


class ImportCandidateInput(BaseModel):
    """A candidate submitted at commit time."""

    folder_path: str
    folder_name: str
    detected_title: str | None
    detected_coser_names: str | None
    detected_work_name: str | None
    detected_character_names: str | None
    photo_count: int
    video_count: int
    total_size_bytes: int


class ImportCommitRequest(BaseModel):
    """Request body for committing selected candidates."""

    candidates: list[ImportCandidateInput]
    skip_duplicate_check: bool = False


class ImportCommitResult(BaseModel):
    """Result of committing an import batch."""

    imported_count: int
    pack_ids: list[int]
    duplicate_checks: list[dict] = []


class CancelImportResult(BaseModel):
    """Result of cancelling a just-imported pack."""

    pack_id: int
