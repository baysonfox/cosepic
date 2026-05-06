"""Tag API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.config import settings
from app.dependencies import get_db
from app.schemas.common import DeleteOrphansResponse, PaginatedResponse
from app.schemas.entities import TagCreate, TagOut, TagUpdate
from app.services import entity_service

router = APIRouter(prefix="/api/v1/tags", tags=["tags"])


@router.get("", response_model=PaginatedResponse[TagOut])
def list_tags(q: str | None = None, page: int = 1, page_size: int | None = None, db: Session = Depends(get_db)):
    ps = min(page_size or settings.default_page_size, settings.max_page_size)
    items, total = entity_service.list_tags(db, q=q, page=page, page_size=ps)
    return PaginatedResponse(items=items, total=total, page=page, page_size=ps)


@router.post("/delete-orphans", response_model=DeleteOrphansResponse)
def delete_orphan_tags(db: Session = Depends(get_db)):
    """Delete every Tag with no Pack association."""
    deleted = entity_service.delete_orphan_tags(db)
    return DeleteOrphansResponse(deleted=deleted)


@router.get("/{tag_id}", response_model=TagOut)
def get_tag(tag_id: int, db: Session = Depends(get_db)):
    result = entity_service.get_tag(db, tag_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return result


@router.post("", response_model=TagOut, status_code=201)
def create_tag(body: TagCreate, db: Session = Depends(get_db)):
    tag = entity_service.create_tag(db, name=body.name, tag_type=body.tag_type)
    return entity_service.get_tag(db, tag.id)


@router.patch("/{tag_id}", response_model=TagOut)
def update_tag(tag_id: int, body: TagUpdate, db: Session = Depends(get_db)):
    tag = entity_service.update_tag(db, tag_id, name=body.name, tag_type=body.tag_type)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return entity_service.get_tag(db, tag.id)


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    result = entity_service.delete_tag(db, tag_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Tag not found")
