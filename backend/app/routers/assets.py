"""Asset API routes — file serving, thumbnails, pack assets listing."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from app.dependencies import get_db
from app.models.asset import Asset
from app.services import asset_service

router = APIRouter(tags=["assets"])


class AssetOut(BaseModel):
    id: int
    asset_type: str
    file_name: str
    relative_path: str
    size_bytes: int
    width: int | None
    height: int | None
    blurhash: str | None
    thumbnail_status: str
    sort_index: int


@router.get("/api/v1/packs/{pack_id}/assets", response_model=list[AssetOut])
def list_pack_assets(pack_id: int, db: Session = Depends(get_db)):
    """List all assets in a pack, ordered by sort_index."""
    assets = db.exec(
        select(Asset).where(Asset.pack_id == pack_id).order_by(Asset.sort_index),
    ).all()
    return assets


@router.get("/api/v1/assets/{asset_id}/file")
def get_asset_file(asset_id: int, db: Session = Depends(get_db)):
    """Serve the original media file."""
    path = asset_service.get_asset_file_path(db, asset_id)
    if path is None:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)


@router.get("/api/v1/assets/{asset_id}/thumbnail")
def get_asset_thumbnail(asset_id: int, db: Session = Depends(get_db)):
    """Serve the WebP thumbnail."""
    path = asset_service.get_asset_thumbnail_path(asset_id)
    if path is None:
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(path, media_type="image/webp")


class CoverRequest(BaseModel):
    asset_id: int


@router.patch("/api/v1/packs/{pack_id}/cover")
def set_pack_cover(pack_id: int, body: CoverRequest, db: Session = Depends(get_db)):
    """Set the cover asset for a pack."""
    from app.models.pack import Pack

    pack = db.get(Pack, pack_id)
    if pack is None:
        raise HTTPException(status_code=404, detail="Pack not found")
    pack.cover_asset_id = body.asset_id
    db.add(pack)
    db.commit()
    return {"ok": True}


@router.post("/api/v1/packs/{pack_id}/regenerate")
def regenerate_pack(pack_id: int, db: Session = Depends(get_db)):
    """Regenerate thumbnails and BlurHash for a pack."""
    result = asset_service.generate_pack_thumbnails(db, pack_id)
    return result
