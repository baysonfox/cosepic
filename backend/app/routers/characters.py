"""Character API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.config import settings
from app.dependencies import get_db
from app.schemas.common import DeleteOrphansResponse, PaginatedResponse
from app.schemas.entities import CharacterCreate, CharacterOut, CharacterUpdate
from app.services import entity_service

router = APIRouter(prefix="/api/v1/characters", tags=["characters"])


@router.get("", response_model=PaginatedResponse[CharacterOut])
def list_characters(
    q: str | None = None, work_id: int | None = None,
    page: int = 1, page_size: int | None = None,
    db: Session = Depends(get_db),
):
    ps = min(page_size or settings.default_page_size, settings.max_page_size)
    items, total = entity_service.list_characters(db, q=q, work_id=work_id, page=page, page_size=ps)
    return PaginatedResponse(items=items, total=total, page=page, page_size=ps)


@router.post("/delete-orphans", response_model=DeleteOrphansResponse)
def delete_orphan_characters(db: Session = Depends(get_db)):
    """Delete every Character with no Pack association.

    Skips Characters that still own a Pack-linked Outfit.
    """
    deleted = entity_service.delete_orphan_characters(db)
    return DeleteOrphansResponse(deleted=deleted)


@router.get("/{char_id}", response_model=CharacterOut)
def get_character(char_id: int, db: Session = Depends(get_db)):
    result = entity_service.get_character(db, char_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Character not found")
    return result


@router.post("", response_model=CharacterOut, status_code=201)
def create_character(body: CharacterCreate, db: Session = Depends(get_db)):
    char = entity_service.create_character(db, name=body.name, work_id=body.work_id)
    return entity_service.get_character(db, char.id)


@router.patch("/{char_id}", response_model=CharacterOut)
def update_character(char_id: int, body: CharacterUpdate, db: Session = Depends(get_db)):
    char = entity_service.update_character(
        db,
        char_id,
        name=body.name,
        work_id=body.work_id,
        work_id_provided="work_id" in body.model_fields_set,
    )
    if char is None:
        raise HTTPException(status_code=404, detail="Character not found")
    return entity_service.get_character(db, char.id)


@router.delete("/{char_id}", status_code=204)
def delete_character(char_id: int, db: Session = Depends(get_db)):
    result = entity_service.delete_character(db, char_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Character not found")
