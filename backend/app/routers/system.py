"""System endpoints: health check and statistics."""

from fastapi import APIRouter, Depends
from sqlmodel import Session, func, select

from app.dependencies import get_db
from app.models.asset import Asset
from app.models.coser import Coser
from app.models.pack import Pack
from app.models.work import Work

router = APIRouter(prefix="/api/v1/system", tags=["system"])


@router.get("/health")
def health_check():
    """Return service health status."""
    return {"status": "ok"}


@router.get("/stats")
def system_stats(db: Session = Depends(get_db)):
    """Return aggregate statistics about the system."""
    pack_count = db.exec(select(func.count(Pack.id))).one()
    asset_count = db.exec(select(func.count(Asset.id))).one()
    coser_count = db.exec(select(func.count(Coser.id))).one()
    work_count = db.exec(select(func.count(Work.id))).one()
    total_size = db.exec(select(func.coalesce(func.sum(Pack.total_size_bytes), 0))).one()

    return {
        "packs": pack_count,
        "assets": asset_count,
        "cosers": coser_count,
        "works": work_count,
        "total_size_bytes": total_size,
    }
