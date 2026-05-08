"""Import API routes."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlmodel import Session

from app.dependencies import get_db
from app.schemas.import_schema import (
    CancelImportResult,
    ImportCommitRequest,
    ImportCommitResult,
    ImportScanRequest,
    ScanResultOut,
)
from app.services import import_service

router = APIRouter(prefix="/api/v1/imports", tags=["imports"])


@router.post("/scan", response_model=ScanResultOut)
def scan_directory(body: ImportScanRequest, db: Session = Depends(get_db)):
    """Scan a root directory and return import candidates."""
    return import_service.scan_import_directory(db, body.root_path)


@router.post("/commit", response_model=ImportCommitResult)
async def commit_import(
    body: ImportCommitRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Commit selected candidates — create Packs and relations."""
    return await import_service.commit_import(
        db, body.candidates, background_tasks, body.skip_duplicate_check,
    )


@router.delete("/packs/{pack_id}/cancel", response_model=CancelImportResult)
def cancel_import(pack_id: int, db: Session = Depends(get_db)):
    """Cancel a just-imported pack — delete it."""
    result = import_service.cancel_import_pack(db, pack_id)
    if "error" in result:
        if result["error"] == "not_found":
            raise HTTPException(status_code=404, detail="Pack not found")
        raise HTTPException(
            status_code=500, detail="Failed to cancel import",
        )
    return result
