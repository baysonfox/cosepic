"""Asset service — file serving and derived data generation."""

import os
from pathlib import Path

from sqlmodel import Session, select

from app.config import settings
from app.models.asset import Asset
from app.models.pack import Pack
from app.services import task_service, thumbnail_service


def generate_pack_thumbnails(db: Session, pack_id: int) -> dict:
    """Generate thumbnails and compute BlurHash for all images in a pack.

    Returns counts of generated thumbnails and computed hashes.
    """
    pack = db.get(Pack, pack_id)
    if pack is None:
        return {"thumbnails_generated": 0, "hashes_computed": 0}

    assets = db.exec(
        select(Asset).where(Asset.pack_id == pack_id, Asset.asset_type == "image"),
    ).all()

    task = task_service.create_task(
        db, task_type="generate_thumbnails", target_type="pack", target_id=pack_id,
    )
    task_service.mark_running(db, task.id)

    thumbnails_generated = 0
    hashes_computed = 0

    try:
        for asset in assets:
            source = os.path.join(pack.dir_path, asset.relative_path)

            # Generate thumbnail
            result = thumbnail_service.generate_thumbnail(source, asset.id)
            if result is not None:
                asset.thumbnail_status = "generated"
                thumbnails_generated += 1
            else:
                asset.thumbnail_status = "failed"

            # Compute BlurHash
            if asset.blurhash is None:
                bh = thumbnail_service.compute_blurhash(source)
                if bh:
                    asset.blurhash = bh
                    hashes_computed += 1

            db.add(asset)

        db.commit()
        task_service.mark_done(db, task.id)
    except Exception as e:
        task_service.mark_failed(db, task.id, str(e))

    return {"thumbnails_generated": thumbnails_generated, "hashes_computed": hashes_computed}


def get_asset_file_path(db: Session, asset_id: int) -> Path | None:
    """Return the absolute file path for an asset's original file."""
    asset = db.get(Asset, asset_id)
    if asset is None:
        return None
    pack = db.get(Pack, asset.pack_id)
    if pack is None:
        return None
    path = Path(pack.dir_path) / asset.relative_path
    return path if path.is_file() else None


def get_asset_thumbnail_path(asset_id: int) -> Path | None:
    """Return the thumbnail path for an asset, if it exists."""
    path = settings.thumbnail_dir / f"{asset_id}.avif"
    return path if path.is_file() else None
