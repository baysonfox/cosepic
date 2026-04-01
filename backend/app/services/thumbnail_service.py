"""Thumbnail generation and BlurHash computation service."""

import re
from pathlib import Path

import blurhash as bh
import numpy as np
import pillow_avif  # noqa: F401 — register AVIF codec
from PIL import Image

from app.config import settings


def _natural_sort_key(s: str) -> list:
    """Key function for human-friendly file name sorting."""
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r"(\d+)", s)]


def generate_thumbnail(
    source_path: str | Path,
    asset_id: int,
) -> Path | None:
    """Generate a 400px-wide AVIF thumbnail for an asset.

    Returns the thumbnail path on success, None on failure.
    """
    source = Path(source_path)
    if not source.is_file():
        return None

    thumb_dir = settings.thumbnail_dir
    thumb_dir.mkdir(parents=True, exist_ok=True)
    thumb_path = thumb_dir / f"{asset_id}.avif"

    # Skip if thumbnail is newer than source
    if thumb_path.exists() and thumb_path.stat().st_mtime >= source.stat().st_mtime:
        return thumb_path

    try:
        with Image.open(source) as img:
            img = img.convert("RGB")
            ratio = settings.thumbnail_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize(
                (settings.thumbnail_width, new_height),
                Image.LANCZOS,
            )
            img.save(thumb_path, format="AVIF", quality=settings.thumbnail_quality)
        return thumb_path
    except Exception:
        return None


def compute_blurhash(source_path: str | Path) -> str | None:
    """Compute a BlurHash string for an image file."""
    source = Path(source_path)
    if not source.is_file():
        return None

    try:
        with Image.open(source) as img:
            img = img.convert("RGB")
            img = img.resize((100, 100), Image.LANCZOS)
            return bh.encode(np.array(img), settings.blurhash_x, settings.blurhash_y)
    except Exception:
        return None
