import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cosplay, Parody
from ..schemas import PaginatedResponse, ParodyOut

router = APIRouter()


def _parody_out_with_count(parody: Parody, count: int) -> ParodyOut:
    data = ParodyOut.model_validate(parody).model_dump()
    data["cosplay_count"] = count
    return ParodyOut(**data)


@router.get("/", response_model=PaginatedResponse)
def list_parodies(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Parody)
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = (
        query.order_by(Parody.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    cosplay_counts: dict[int, int] = {}
    for row in (
        db.query(Parody.id, func.count(Cosplay.id))
        .outerjoin(Cosplay)
        .group_by(Parody.id)
        .all()
    ):
        cosplay_counts[row[0]] = row[1]

    result_items = [
        _parody_out_with_count(item, cosplay_counts.get(item.id, 0)) for item in items
    ]

    return PaginatedResponse(
        items=result_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{parody_id}", response_model=ParodyOut)
def get_parody(parody_id: int, db: Session = Depends(get_db)):
    parody = db.query(Parody).filter(Parody.id == parody_id).first()
    if not parody:
        raise HTTPException(status_code=404, detail="Parody not found")

    cosplay_count = db.query(Cosplay).filter(Cosplay.parody_id == parody_id).count()
    return _parody_out_with_count(parody, cosplay_count)
