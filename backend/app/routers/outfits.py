"""Outfit API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.config import settings
from app.dependencies import get_db
from app.schemas.common import DeleteOrphansResponse, PaginatedResponse
from app.schemas.entities import OutfitCreate, OutfitOut, OutfitUpdate
from app.services import entity_service

router = APIRouter(prefix="/api/v1/outfits", tags=["outfits"])


@router.get("", response_model=PaginatedResponse[OutfitOut])
def list_outfits(
    q: str | None = None, character_id: int | None = None,
    page: int = 1, page_size: int | None = None,
    db: Session = Depends(get_db),
):
    ps = min(page_size or settings.default_page_size, settings.max_page_size)
    items, total = entity_service.list_outfits(db, q=q, character_id=character_id, page=page, page_size=ps)
    return PaginatedResponse(items=items, total=total, page=page, page_size=ps)


@router.post("/delete-orphans", response_model=DeleteOrphansResponse)
def delete_orphan_outfits(db: Session = Depends(get_db)):
    """Delete every Outfit with no Pack association."""
    deleted = entity_service.delete_orphan_outfits(db)
    return DeleteOrphansResponse(deleted=deleted)


@router.get("/{outfit_id}", response_model=OutfitOut)
def get_outfit(outfit_id: int, db: Session = Depends(get_db)):
    result = entity_service.get_outfit(db, outfit_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Outfit not found")
    return result


@router.post("", response_model=OutfitOut, status_code=201)
def create_outfit(body: OutfitCreate, db: Session = Depends(get_db)):
    outfit = entity_service.create_outfit(db, name=body.name, character_id=body.character_id)
    return entity_service.get_outfit(db, outfit.id)


@router.patch("/{outfit_id}", response_model=OutfitOut)
def update_outfit(outfit_id: int, body: OutfitUpdate, db: Session = Depends(get_db)):
    outfit = entity_service.update_outfit(
        db,
        outfit_id,
        name=body.name,
        character_id=body.character_id,
    )
    if outfit is None:
        raise HTTPException(status_code=404, detail="Outfit not found")
    return entity_service.get_outfit(db, outfit.id)


@router.delete("/{outfit_id}", status_code=204)
def delete_outfit(outfit_id: int, db: Session = Depends(get_db)):
    result = entity_service.delete_outfit(db, outfit_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Outfit not found")
