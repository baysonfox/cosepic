"""Asset service — file serving and derived data generation."""

import os
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from PIL import Image
from sqlmodel import Session, select

from app.config import settings
from app.models.asset import Asset
from app.models.pack import Pack
from app.services import task_service, thumbnail_service


def _process_single_image(
    args: tuple[str, int],
) -> tuple[int, str | None, str | None]:
    """处理单张图片：生成缩略图 + 计算 BlurHash（供子进程调用）.

    只打开解码一次源图，缩略图和 BlurHash 共用已加载的图像.

    Args:
        args: (source_path, asset_id)

    Returns:
        (asset_id, thumbnail_status, blurhash)
    """
    source_path, asset_id = args
    source = Path(source_path)
    thumb_status = None
    blurhash = None

    if not source.is_file():
        return (asset_id, None, None)

    thumb_dir = settings.thumbnail_dir
    thumb_dir.mkdir(parents=True, exist_ok=True)
    thumb_path = thumb_dir / f"{asset_id}.avif"

    if thumbnail_service._is_valid_thumbnail(thumb_path, source):
        # 缩略图已存在，只需补 BlurHash
        try:
            with Image.open(thumb_path) as thumb:
                blurhash = thumbnail_service.compute_blurhash_from_image(
                    thumb.convert("RGB"),
                )
        except Exception:
            pass
        return (asset_id, "generated", blurhash)

    try:
        with Image.open(source) as img:
            img = img.convert("RGB")

            # 缩放到缩略图尺寸
            ratio = settings.thumbnail_width / img.width
            new_height = int(img.height * ratio)
            thumb = img.resize(
                (settings.thumbnail_width, new_height),
                Image.BILINEAR,
            )

            # 保存缩略图
            thumb.save(thumb_path, format="AVIF", quality=settings.thumbnail_quality)
            thumb_status = "generated"

            # 用已缩放的缩略图计算 BlurHash（无需再次打开源文件）
            blurhash = thumbnail_service.compute_blurhash_from_image(thumb)

    except Exception:
        thumb_status = "failed"
        # 即使缩略图失败，仍尝试通过源文件计算 BlurHash
        blurhash = thumbnail_service.compute_blurhash(source_path)

    return (asset_id, thumb_status, blurhash)


def generate_pack_thumbnails(db: Session, pack_id: int) -> dict:
    """Generate thumbnails and compute BlurHash for all images in a pack.

    使用 ProcessPoolExecutor 并行处理，worker 数为 nproc - 1.

    Returns counts of generated thumbnails and computed hashes.
    """
    pack = db.get(Pack, pack_id)
    if pack is None:
        return {"thumbnails_generated": 0, "hashes_computed": 0}

    assets = db.exec(
        select(Asset).where(Asset.pack_id == pack_id, Asset.asset_type == "image"),
    ).all()

    if not assets:
        return {"thumbnails_generated": 0, "hashes_computed": 0}

    task = task_service.create_task(
        db, task_type="generate_thumbnails", target_type="pack", target_id=pack_id,
    )
    task_service.mark_running(db, task.id)

    # 构建参数列表
    work_items = [
        (os.path.join(pack.dir_path, asset.relative_path), asset.id)
        for asset in assets
    ]

    num_workers = max(os.cpu_count() - 1 if os.cpu_count() else 1, 1)

    thumbnails_generated = 0
    hashes_computed = 0

    try:
        with ProcessPoolExecutor(max_workers=num_workers) as executor:
            results = list(executor.map(_process_single_image, work_items))

        # 在主进程中更新数据库
        for asset_id, thumb_status, blurhash in results:
            asset = db.get(Asset, asset_id)
            if asset is None:
                continue

            asset.thumbnail_status = thumb_status
            if thumb_status == "generated":
                thumbnails_generated += 1

            if blurhash:
                asset.blurhash = blurhash
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
