"""Import API routes."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlmodel import Session

from app.dependencies import get_db
from app.schemas.import_schema import (
    ImportBatchOut,
    ImportCandidateOut,
    ImportCandidateUpdate,
    ImportCommitResult,
    ImportScanRequest,
)
from app.services import import_service

router = APIRouter(prefix="/api/v1/imports", tags=["imports"])


@router.post("/scan", response_model=ImportBatchOut, status_code=201)
def scan_directory(body: ImportScanRequest, db: Session = Depends(get_db)):
    """Scan a root directory and create an import batch."""
    batch = import_service.scan_root_directory(db, body.root_path)
    return _batch_to_out(batch, db)


@router.get("/{batch_id}", response_model=ImportBatchOut)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    """Get an import batch with all its candidates."""
    batch = import_service.get_batch(db, batch_id)
    if batch is None:
        raise HTTPException(status_code=404, detail="Batch not found")
    return _batch_to_out(batch, db)


@router.patch("/{batch_id}/candidates/{candidate_id}", response_model=ImportCandidateOut)
def update_candidate(
    batch_id: int, candidate_id: int, body: ImportCandidateUpdate, db: Session = Depends(get_db),
):
    """Edit a single import candidate."""
    candidate = import_service.update_candidate(
        db, candidate_id,
        detected_title=body.detected_title,
        detected_coser_names=body.detected_coser_names,
        detected_work_name=body.detected_work_name,
        detected_character_names=body.detected_character_names,
        status=body.status,
    )
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.post("/{batch_id}/commit", response_model=ImportCommitResult)
async def commit_batch(
    batch_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Commit selected candidates — create Packs and relations."""
    result = await import_service.commit_batch(db, batch_id, background_tasks)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Batch not found")
    return result


def _batch_to_out(batch, db: Session) -> dict:
    """Convert an ImportBatch to the response shape with candidates loaded."""
    from sqlmodel import select
    from app.models.import_batch import ImportCandidate

    candidates = db.exec(
        select(ImportCandidate).where(ImportCandidate.batch_id == batch.id),
    ).all()

    return {
        "id": batch.id,
        "root_path": batch.root_path,
        "status": batch.status,
        "total_candidates": batch.total_candidates,
        "imported_count": batch.imported_count,
        "created_at": batch.created_at,
        "finished_at": batch.finished_at,
        "candidates": candidates,
    }
