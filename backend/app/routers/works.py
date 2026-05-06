"""Work API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.config import settings
from app.dependencies import get_db
from app.schemas.common import DeleteOrphansResponse, PaginatedResponse
from app.schemas.entities import WorkCreate, WorkOut, WorkUpdate
from app.services import entity_service

router = APIRouter(prefix="/api/v1/works", tags=["works"])


@router.get("", response_model=PaginatedResponse[WorkOut])
def list_works(q: str | None = None, page: int = 1, page_size: int | None = None, db: Session = Depends(get_db)):
    ps = min(page_size or settings.default_page_size, settings.max_page_size)
    items, total = entity_service.list_works(db, q=q, page=page, page_size=ps)
    return PaginatedResponse(items=items, total=total, page=page, page_size=ps)


@router.post("/delete-orphans", response_model=DeleteOrphansResponse)
def delete_orphan_works(db: Session = Depends(get_db)):
    """Delete every Work whose characters have no Pack association."""
    deleted = entity_service.delete_orphan_works(db)
    return DeleteOrphansResponse(deleted=deleted)


@router.get("/{work_id}", response_model=WorkOut)
def get_work(work_id: int, db: Session = Depends(get_db)):
    result = entity_service.get_work(db, work_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Work not found")
    return result


@router.post("", response_model=WorkOut, status_code=201)
def create_work(body: WorkCreate, db: Session = Depends(get_db)):
    work = entity_service.create_work(db, name=body.name)
    return entity_service.get_work(db, work.id)


@router.patch("/{work_id}", response_model=WorkOut)
def update_work(work_id: int, body: WorkUpdate, db: Session = Depends(get_db)):
    work = entity_service.update_work(db, work_id, name=body.name)
    if work is None:
        raise HTTPException(status_code=404, detail="Work not found")
    return entity_service.get_work(db, work.id)


@router.delete("/{work_id}", status_code=204)
def delete_work(work_id: int, db: Session = Depends(get_db)):
    result = entity_service.delete_work(db, work_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Work not found")
