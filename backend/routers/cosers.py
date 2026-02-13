import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cosplay, Coser
from ..schemas import CoserOut, PaginatedResponse

router = APIRouter()


def _coser_out_with_count(coser: Coser, count: int) -> CoserOut:
    data = CoserOut.model_validate(coser).model_dump()
    data["cosplay_count"] = count
    return CoserOut(**data)


@router.get("/", response_model=PaginatedResponse)
def list_cosers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Coser)
    if search:
        query = query.filter(Coser.name.ilike(f"%{search}%"))

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = (
        query.order_by(Coser.name).offset((page - 1) * page_size).limit(page_size).all()
    )

    cosplay_counts: dict[int, int] = {}
    for row in (
        db.query(Coser.id, func.count(Cosplay.id))
        .outerjoin(Cosplay)
        .group_by(Coser.id)
        .all()
    ):
        cosplay_counts[row[0]] = row[1]

    result_items = [
        _coser_out_with_count(item, cosplay_counts.get(item.id, 0)) for item in items
    ]

    return PaginatedResponse(
        items=result_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{coser_id}", response_model=CoserOut)
def get_coser(coser_id: int, db: Session = Depends(get_db)):
    coser = db.query(Coser).filter(Coser.id == coser_id).first()
    if not coser:
        raise HTTPException(status_code=404, detail="Coser not found")

    cosplay_count = db.query(Cosplay).filter(Cosplay.coser_id == coser_id).count()
    return _coser_out_with_count(coser, cosplay_count)
