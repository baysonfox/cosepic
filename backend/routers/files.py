import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cosplay

router = APIRouter()

IMAGE_EXTENSIONS = {".avif", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
THUMBNAIL_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "thumbnails"


def _natural_sort_key(s: str) -> list:
    return [
        int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", s)
    ]


@router.get("/image/{cosplay_id}/{filename}")
def serve_image(cosplay_id: int, filename: str, db: Session = Depends(get_db)):
    cosplay = db.query(Cosplay).filter(Cosplay.id == cosplay_id).first()
    if not cosplay:
        raise HTTPException(status_code=404, detail="Cosplay not found")

    file_path = Path(cosplay.dir_path) / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, media_type=_media_type(file_path))


@router.get("/thumbnail/{cosplay_id}/{filename}")
def serve_thumbnail(cosplay_id: int, filename: str, db: Session = Depends(get_db)):
    cosplay = db.query(Cosplay).filter(Cosplay.id == cosplay_id).first()
    if not cosplay:
        raise HTTPException(status_code=404, detail="Cosplay not found")

    thumb_path = THUMBNAIL_DIR / str(cosplay_id) / filename
    if thumb_path.is_file():
        return FileResponse(thumb_path, media_type=_media_type(thumb_path))

    file_path = Path(cosplay.dir_path) / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type=_media_type(file_path))


@router.get("/cover/{cosplay_id}")
def serve_cover(cosplay_id: int, db: Session = Depends(get_db)):
    cosplay = db.query(Cosplay).filter(Cosplay.id == cosplay_id).first()
    if not cosplay:
        raise HTTPException(status_code=404, detail="Cosplay not found")

    if cosplay.cover_path:
        thumb_path = THUMBNAIL_DIR / str(cosplay_id) / cosplay.cover_path
        if thumb_path.is_file():
            return FileResponse(thumb_path, media_type=_media_type(thumb_path))

        file_path = Path(cosplay.dir_path) / cosplay.cover_path
        if file_path.is_file():
            return FileResponse(file_path, media_type=_media_type(file_path))

    dir_path = Path(cosplay.dir_path)
    if dir_path.is_dir():
        images = sorted(
            [
                f
                for f in dir_path.iterdir()
                if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
            ],
            key=lambda f: _natural_sort_key(f.name),
        )
        if images:
            return FileResponse(images[0], media_type=_media_type(images[0]))

    raise HTTPException(status_code=404, detail="No cover image found")


@router.get("/coser-avatar/{coser_id}")
def serve_coser_avatar(coser_id: int, db: Session = Depends(get_db)):
    from ..models import Coser

    coser = db.query(Coser).filter(Coser.id == coser_id).first()
    if not coser:
        raise HTTPException(status_code=404, detail="Coser not found")

    if coser.avatar_path:
        avatar = Path(coser.avatar_path)
        if avatar.is_file():
            return FileResponse(avatar, media_type=_media_type(avatar))

    raise HTTPException(status_code=404, detail="No avatar found")


def _media_type(path: Path) -> str:
    suffix = path.suffix.lower()
    types = {
        ".avif": "image/avif",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }
    return types.get(suffix, "application/octet-stream")
