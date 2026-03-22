import re
from pathlib import Path

import blurhash
import numpy as np
import pillow_avif  # noqa: F401 — 注册 AVIF codec
from PIL import Image
from sqlalchemy.orm import Session

from ..models import Cosplay, ImageHash

THUMBNAIL_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "thumbnails"
THUMBNAIL_WIDTH = 400
IMAGE_EXTENSIONS = {".avif", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}


def _natural_sort_key(s: str) -> list:
    return [
        int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", s)
    ]


def thumbnail_path_for(cosplay_id: int, filename: str) -> Path:
    return THUMBNAIL_DIR / str(cosplay_id) / f"{Path(filename).stem}.avif"


def _render_thumbnail(source_path: Path, thumbnail_path: Path) -> bool:
    thumbnail_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with Image.open(source_path) as img:
            ratio = THUMBNAIL_WIDTH / img.width
            new_height = int(img.height * ratio)
            resized = img.resize(
                (THUMBNAIL_WIDTH, new_height), Image.Resampling.LANCZOS
            )
            resized.save(thumbnail_path, format="AVIF", quality=60)
    except Exception:
        return False

    return True


def ensure_thumbnail_for_file(cosplay: Cosplay, filename: str) -> Path | None:
    source_path = Path(cosplay.dir_path) / filename
    if not source_path.is_file() or source_path.suffix.lower() not in IMAGE_EXTENSIONS:
        return None

    thumbnail_path = thumbnail_path_for(cosplay.id, filename)
    source_mtime = source_path.stat().st_mtime_ns

    if thumbnail_path.is_file():
        thumbnail_mtime = thumbnail_path.stat().st_mtime_ns
        if thumbnail_mtime >= source_mtime:
            return thumbnail_path

    if not _render_thumbnail(source_path, thumbnail_path):
        return None

    return thumbnail_path


def generate_thumbnails_for_cosplay(cosplay: Cosplay) -> int:
    dir_path = Path(cosplay.dir_path)
    if not dir_path.is_dir():
        return 0

    thumb_dir = THUMBNAIL_DIR / str(cosplay.id)
    thumb_dir.mkdir(parents=True, exist_ok=True)
    valid_thumbnail_names = set()

    count = 0
    for f in sorted(dir_path.iterdir(), key=lambda x: _natural_sort_key(x.name)):
        if not f.is_file() or f.suffix.lower() not in IMAGE_EXTENSIONS:
            continue

        valid_thumbnail_names.add(f"{f.stem}.avif")
        if ensure_thumbnail_for_file(cosplay, f.name) is not None:
            count += 1

    for thumbnail_path in thumb_dir.glob("*.avif"):
        if thumbnail_path.name not in valid_thumbnail_names:
            thumbnail_path.unlink(missing_ok=True)

    return count


def compute_blurhashes_for_cosplay(cosplay: Cosplay, db: Session) -> int:
    dir_path = Path(cosplay.dir_path)
    if not dir_path.is_dir():
        return 0

    existing = {
        row.filename: row.blurhash
        for row in db.query(ImageHash.filename, ImageHash.blurhash)
        .filter(ImageHash.cosplay_id == cosplay.id)
        .all()
    }

    count = 0
    for f in sorted(dir_path.iterdir(), key=lambda x: _natural_sort_key(x.name)):
        if not f.is_file() or f.suffix.lower() not in IMAGE_EXTENSIONS:
            continue

        if f.name in existing and existing[f.name] is not None:
            count += 1
            continue

        try:
            with Image.open(f) as img:
                img_rgb = img.convert("RGB")
                img_rgb.thumbnail((100, 100))
                arr = np.array(img_rgb)
                blurhash_str = blurhash.encode(arr, components_x=4, components_y=3)

                if f.name in existing:
                    db.query(ImageHash).filter(
                        ImageHash.cosplay_id == cosplay.id,
                        ImageHash.filename == f.name,
                    ).update({"blurhash": blurhash_str})
                else:
                    db.add(
                        ImageHash(
                            cosplay_id=cosplay.id,
                            filename=f.name,
                            blurhash=blurhash_str,
                        )
                    )
                count += 1
        except Exception:
            continue

    db.commit()
    return count
