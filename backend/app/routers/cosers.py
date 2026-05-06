"""Coser API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.config import settings
from app.dependencies import get_db
from app.schemas.common import DeleteOrphansResponse, PaginatedResponse
from app.schemas.coser import (
    CoserAliasCreate,
    CoserAliasOut,
    CoserCreate,
    CoserOut,
    CoserUpdate,
)
from app.services import coser_service

router = APIRouter(prefix="/api/v1/cosers", tags=["cosers"])


@router.get("", response_model=PaginatedResponse[CoserOut])
def list_cosers(
    q: str | None = None,
    page: int = 1,
    page_size: int | None = None,
    db: Session = Depends(get_db),
):
    """List cosers with optional search and pagination."""
    ps = min(page_size or settings.default_page_size, settings.max_page_size)
    items, total = coser_service.list_cosers(db, q=q, page=page, page_size=ps)
    return PaginatedResponse(items=items, total=total, page=page, page_size=ps)


@router.post("/delete-orphans", response_model=DeleteOrphansResponse)
def delete_orphan_cosers(db: Session = Depends(get_db)):
    """Delete every Coser with no associated Pack."""
    deleted = coser_service.delete_orphan_cosers(db)
    return DeleteOrphansResponse(deleted=deleted)


@router.get("/{coser_id}", response_model=CoserOut)
def get_coser(coser_id: int, db: Session = Depends(get_db)):
    """Get a single Coser by ID."""
    result = coser_service.get_coser(db, coser_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Coser not found")
    return result


@router.post("", response_model=CoserOut, status_code=201)
def create_coser(body: CoserCreate, db: Session = Depends(get_db)):
    """Create a new Coser."""
    coser = coser_service.create_coser(db, name=body.name)
    return coser_service.get_coser(db, coser.id)


@router.patch("/{coser_id}", response_model=CoserOut)
def update_coser(coser_id: int, body: CoserUpdate, db: Session = Depends(get_db)):
    """Update an existing Coser."""
    coser = coser_service.update_coser(db, coser_id, name=body.name)
    if coser is None:
        raise HTTPException(status_code=404, detail="Coser not found")
    return coser_service.get_coser(db, coser.id)


@router.delete("/{coser_id}", status_code=204)
def delete_coser(coser_id: int, db: Session = Depends(get_db)):
    """Delete a Coser. Fails if it has associated packs."""
    result = coser_service.delete_coser(db, coser_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Coser not found")
    if result == "has_packs":
        raise HTTPException(status_code=409, detail="Coser has associated packs")


@router.post("/{coser_id}/aliases", response_model=CoserAliasOut, status_code=201)
def add_alias(coser_id: int, body: CoserAliasCreate, db: Session = Depends(get_db)):
    """Add an alias to a Coser."""
    alias = coser_service.add_alias(db, coser_id, body.alias)
    if alias is None:
        raise HTTPException(status_code=404, detail="Coser not found")
    return alias


@router.delete("/{coser_id}/aliases/{alias_id}", status_code=204)
def delete_alias(coser_id: int, alias_id: int, db: Session = Depends(get_db)):
    """Remove an alias from a Coser."""
    if not coser_service.delete_alias(db, alias_id):
        raise HTTPException(status_code=404, detail="Alias not found")
