"""Coser business logic."""

from sqlmodel import Session, col, func, select

from app.models.coser import Coser, CoserAlias
from app.models.relations import PackCoser


def list_cosers(
    db: Session,
    *,
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[dict], int]:
    """Return paginated Coser list with pack counts.

    Returns:
        A tuple of (items, total).
    """
    base = select(Coser)
    count_q = select(func.count(Coser.id))

    if q:
        pattern = f"%{q}%"
        alias_sub = select(CoserAlias.coser_id).where(
            col(CoserAlias.alias).ilike(pattern),
        )
        base = base.where(
            col(Coser.name).ilike(pattern) | col(Coser.id).in_(alias_sub),
        )
        count_q = count_q.where(
            col(Coser.name).ilike(pattern) | col(Coser.id).in_(alias_sub),
        )

    total = db.exec(count_q).one()
    cosers = db.exec(
        base.order_by(Coser.id).offset((page - 1) * page_size).limit(page_size),
    ).all()

    pack_counts = _pack_counts(db, [c.id for c in cosers])
    alias_map = _alias_map(db, [c.id for c in cosers])

    items = []
    for c in cosers:
        items.append({
            "id": c.id,
            "name": c.name,
            "avatar_asset_id": c.avatar_asset_id,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "pack_count": pack_counts.get(c.id, 0),
            "aliases": alias_map.get(c.id, []),
        })

    return items, total


def get_coser(db: Session, coser_id: int) -> dict | None:
    """Return a single Coser with pack count and aliases."""
    coser = db.get(Coser, coser_id)
    if coser is None:
        return None

    pack_counts = _pack_counts(db, [coser.id])
    alias_map = _alias_map(db, [coser.id])

    return {
        "id": coser.id,
        "name": coser.name,
        "avatar_asset_id": coser.avatar_asset_id,
        "created_at": coser.created_at,
        "updated_at": coser.updated_at,
        "pack_count": pack_counts.get(coser.id, 0),
        "aliases": alias_map.get(coser.id, []),
    }


def create_coser(db: Session, *, name: str) -> Coser:
    """Create a new Coser."""
    coser = Coser(name=name)
    db.add(coser)
    db.commit()
    db.refresh(coser)
    return coser


def update_coser(db: Session, coser_id: int, *, name: str | None = None) -> Coser | None:
    """Update an existing Coser. Returns None if not found."""
    coser = db.get(Coser, coser_id)
    if coser is None:
        return None
    if name is not None:
        coser.name = name
    db.add(coser)
    db.commit()
    db.refresh(coser)
    return coser


def delete_coser(db: Session, coser_id: int) -> bool | str:
    """Delete a Coser. Returns True on success, error string if blocked."""
    coser = db.get(Coser, coser_id)
    if coser is None:
        return "not_found"

    pack_count = db.exec(
        select(func.count(PackCoser.pack_id)).where(PackCoser.coser_id == coser_id),
    ).one()
    if pack_count > 0:
        return "has_packs"

    # Delete aliases first
    aliases = db.exec(select(CoserAlias).where(CoserAlias.coser_id == coser_id)).all()
    for alias in aliases:
        db.delete(alias)
    db.delete(coser)
    db.commit()
    return True


def add_alias(db: Session, coser_id: int, alias: str) -> CoserAlias | None:
    """Add an alias to a Coser. Returns None if Coser not found."""
    coser = db.get(Coser, coser_id)
    if coser is None:
        return None
    ca = CoserAlias(coser_id=coser_id, alias=alias)
    db.add(ca)
    db.commit()
    db.refresh(ca)
    return ca


def delete_alias(db: Session, alias_id: int) -> bool:
    """Delete a CoserAlias. Returns False if not found."""
    alias = db.get(CoserAlias, alias_id)
    if alias is None:
        return False
    db.delete(alias)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _pack_counts(db: Session, coser_ids: list[int]) -> dict[int, int]:
    """Batch-fetch pack counts for a list of Coser IDs."""
    if not coser_ids:
        return {}
    rows = db.exec(
        select(PackCoser.coser_id, func.count(PackCoser.pack_id))
        .where(col(PackCoser.coser_id).in_(coser_ids))
        .group_by(PackCoser.coser_id),
    ).all()
    return {r[0]: r[1] for r in rows}


def _alias_map(db: Session, coser_ids: list[int]) -> dict[int, list[str]]:
    """Batch-fetch aliases for a list of Coser IDs."""
    if not coser_ids:
        return {}
    rows = db.exec(
        select(CoserAlias).where(col(CoserAlias.coser_id).in_(coser_ids)),
    ).all()
    result: dict[int, list[str]] = {}
    for row in rows:
        result.setdefault(row.coser_id, []).append(row.alias)
    return result
