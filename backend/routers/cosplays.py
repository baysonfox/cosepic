import math
import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Cosplay, Coser, Parody
from ..schemas import CoserOut, CosplayOut, PaginatedResponse, ParodyOut

router = APIRouter()

IMAGE_EXTENSIONS = {".avif", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
VIDEO_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".webm"}


def _natural_sort_key(s: str) -> list:
    return [
        int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", s)
    ]


def _coser_out_with_count(coser: Coser, count: int) -> CoserOut:
    data = CoserOut.model_validate(coser).model_dump()
    data["cosplay_count"] = count
    return CoserOut(**data)


def _parody_out_with_count(parody: Parody, count: int) -> ParodyOut:
    data = ParodyOut.model_validate(parody).model_dump()
    data["cosplay_count"] = count
    return ParodyOut(**data)


@router.get("/", response_model=PaginatedResponse)
def list_cosplays(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    coser_id: int | None = None,
    parody_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Cosplay).options(
        joinedload(Cosplay.coser), joinedload(Cosplay.parody)
    )
    if coser_id is not None:
        query = query.filter(Cosplay.coser_id == coser_id)
    if parody_id is not None:
        query = query.filter(Cosplay.parody_id == parody_id)

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = (
        query.order_by(Cosplay.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    coser_counts: dict[int, int] = {}
    for row in (
        db.query(Coser.id, func.count(Cosplay.id))
        .outerjoin(Cosplay)
        .group_by(Coser.id)
        .all()
    ):
        coser_counts[row[0]] = row[1]

    parody_counts: dict[int, int] = {}
    for row in (
        db.query(Parody.id, func.count(Cosplay.id))
        .outerjoin(Cosplay)
        .group_by(Parody.id)
        .all()
    ):
        parody_counts[row[0]] = row[1]

    result_items = []
    for item in items:
        data = CosplayOut.model_validate(item).model_dump()
        if item.coser:
            data["coser"] = _coser_out_with_count(
                item.coser, coser_counts.get(item.coser_id, 0)
            )
        if item.parody and item.parody_id is not None:
            data["parody"] = _parody_out_with_count(
                item.parody, parody_counts.get(item.parody_id, 0)
            )
        result_items.append(CosplayOut(**data))

    return PaginatedResponse(
        items=result_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{cosplay_id}", response_model=CosplayOut)
def get_cosplay(cosplay_id: int, db: Session = Depends(get_db)):
    cosplay = (
        db.query(Cosplay)
        .options(joinedload(Cosplay.coser), joinedload(Cosplay.parody))
        .filter(Cosplay.id == cosplay_id)
        .first()
    )
    if not cosplay:
        raise HTTPException(status_code=404, detail="Cosplay not found")
    return CosplayOut.model_validate(cosplay)


@router.get("/{cosplay_id}/images", response_model=list[str])
def list_cosplay_images(cosplay_id: int, db: Session = Depends(get_db)):
    cosplay = db.query(Cosplay).filter(Cosplay.id == cosplay_id).first()
    if not cosplay:
        raise HTTPException(status_code=404, detail="Cosplay not found")

    dir_path = Path(cosplay.dir_path)
    if not dir_path.is_dir():
        return []

    files = []
    for f in dir_path.iterdir():
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS:
            files.append(f.name)

    files.sort(key=_natural_sort_key)
    return files
