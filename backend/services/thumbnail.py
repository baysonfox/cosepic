import re
from pathlib import Path

import imagehash
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


def generate_thumbnails_for_cosplay(cosplay: Cosplay) -> int:
    dir_path = Path(cosplay.dir_path)
    if not dir_path.is_dir():
        return 0

    thumb_dir = THUMBNAIL_DIR / str(cosplay.id)
    thumb_dir.mkdir(parents=True, exist_ok=True)

    count = 0
    for f in sorted(dir_path.iterdir(), key=lambda x: _natural_sort_key(x.name)):
        if not f.is_file() or f.suffix.lower() not in IMAGE_EXTENSIONS:
            continue

        thumb_path = thumb_dir / (f.stem + ".avif")
        if thumb_path.exists():
            count += 1
            continue

        try:
            with Image.open(f) as img:
                ratio = THUMBNAIL_WIDTH / img.width
                new_height = int(img.height * ratio)
                resized = img.resize(
                    (THUMBNAIL_WIDTH, new_height), Image.Resampling.LANCZOS
                )
                resized.save(thumb_path, format="AVIF", quality=60)
                count += 1
        except Exception:
            continue

    return count


def compute_phashes_for_cosplay(cosplay: Cosplay, db: Session) -> int:
    dir_path = Path(cosplay.dir_path)
    if not dir_path.is_dir():
        return 0

    existing = {
        row.filename
        for row in db.query(ImageHash.filename)
        .filter(ImageHash.cosplay_id == cosplay.id)
        .all()
    }

    count = 0
    for f in sorted(dir_path.iterdir(), key=lambda x: _natural_sort_key(x.name)):
        if not f.is_file() or f.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        if f.name in existing:
            count += 1
            continue

        try:
            with Image.open(f) as img:
                phash = str(imagehash.phash(img))
                db.add(ImageHash(cosplay_id=cosplay.id, filename=f.name, phash=phash))
                count += 1
        except Exception:
            continue

    db.commit()
    return count
