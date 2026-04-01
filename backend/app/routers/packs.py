"""Pack API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.config import settings
from app.dependencies import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.pack import PackCreate, PackListItem, PackOut, PackUpdate
from app.services import pack_service

router = APIRouter(prefix="/api/v1/packs", tags=["packs"])


@router.get("", response_model=PaginatedResponse[PackListItem])
def list_packs(
    q: str | None = None,
    coser_ids: list[int] = Query(default=[]),
    work_ids: list[int] = Query(default=[]),
    character_ids: list[int] = Query(default=[]),
    outfit_ids: list[int] = Query(default=[]),
    tag_ids: list[int] = Query(default=[]),
    has_video: bool | None = None,
    status: str | None = None,
    sort: str = "created_at",
    order: str = "desc",
    page: int = 1,
    page_size: int | None = None,
    db: Session = Depends(get_db),
):
    """List packs with multi-dimensional filtering."""
    ps = min(page_size or settings.default_page_size, settings.max_page_size)
    items, total = pack_service.list_packs(
        db,
        q=q,
        coser_ids=coser_ids or None,
        work_ids=work_ids or None,
        character_ids=character_ids or None,
        outfit_ids=outfit_ids or None,
        tag_ids=tag_ids or None,
        has_video=has_video,
        status=status,
        sort=sort,
        order=order,
        page=page,
        page_size=ps,
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=ps)


@router.get("/{pack_id}", response_model=PackOut)
def get_pack(pack_id: int, db: Session = Depends(get_db)):
    """Get full pack detail with all related entities."""
    result = pack_service.get_pack(db, pack_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Pack not found")
    return result


@router.post("", response_model=PackOut, status_code=201)
def create_pack(body: PackCreate, db: Session = Depends(get_db)):
    """Create a new pack."""
    pack = pack_service.create_pack(
        db,
        title=body.title,
        dir_path=body.dir_path,
        original_folder_name=body.original_folder_name,
        description=body.description,
    )
    return pack_service.get_pack(db, pack.id)


@router.patch("/{pack_id}", response_model=PackOut)
def update_pack(pack_id: int, body: PackUpdate, db: Session = Depends(get_db)):
    """Update pack metadata."""
    pack = pack_service.update_pack(
        db, pack_id,
        title=body.title,
        description=body.description,
        dir_path=body.dir_path,
        status=body.status,
        cover_asset_id=body.cover_asset_id,
    )
    if pack is None:
        raise HTTPException(status_code=404, detail="Pack not found")
    return pack_service.get_pack(db, pack.id)


@router.delete("/{pack_id}", status_code=204)
def delete_pack(pack_id: int, db: Session = Depends(get_db)):
    """Delete a pack and cascade-delete its assets and relations."""
    result = pack_service.delete_pack(db, pack_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Pack not found")
