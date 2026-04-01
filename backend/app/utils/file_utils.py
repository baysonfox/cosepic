"""File system utilities for scanning media directories."""

import os
from pathlib import Path

IMAGE_EXTENSIONS = frozenset({".avif", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"})
VIDEO_EXTENSIONS = frozenset({".mp4", ".mkv", ".avi", ".mov", ".webm"})
MEDIA_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS


def scan_media_dir(dir_path: str) -> dict:
    """Scan a directory and return media statistics.

    Returns:
        A dict with keys: photo_count, video_count, total_size_bytes,
        files (list of dicts with file_name, relative_path, asset_type, size_bytes).
    """
    root = Path(dir_path)
    if not root.is_dir():
        return {
            "photo_count": 0,
            "video_count": 0,
            "total_size_bytes": 0,
            "files": [],
        }

    photo_count = 0
    video_count = 0
    total_size = 0
    files = []

    for dirpath, _, filenames in os.walk(root):
        for fname in sorted(filenames):
            ext = Path(fname).suffix.lower()
            if ext not in MEDIA_EXTENSIONS:
                continue

            full_path = Path(dirpath) / fname
            rel_path = str(full_path.relative_to(root))
            size = full_path.stat().st_size

            if ext in IMAGE_EXTENSIONS:
                asset_type = "image"
                photo_count += 1
            else:
                asset_type = "video"
                video_count += 1

            total_size += size
            files.append({
                "file_name": fname,
                "relative_path": rel_path,
                "asset_type": asset_type,
                "size_bytes": size,
            })

    return {
        "photo_count": photo_count,
        "video_count": video_count,
        "total_size_bytes": total_size,
        "files": files,
    }
