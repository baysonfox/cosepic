"""Pack business logic — CRUD with multi-dimensional filtering."""

from datetime import datetime, timezone

from sqlmodel import Session, col, func, select

from app.models.character import Character
from app.models.coser import Coser
from app.models.outfit import Outfit
from app.models.pack import Pack
from app.models.relations import PackCharacter, PackCoser, PackOutfit, PackTag
from app.models.tag import Tag
from app.models.work import Work


def list_packs(
    db: Session,
    *,
    q: str | None = None,
    coser_ids: list[int] | None = None,
    work_ids: list[int] | None = None,
    character_ids: list[int] | None = None,
    outfit_ids: list[int] | None = None,
    tag_ids: list[int] | None = None,
    has_video: bool | None = None,
    status: str | None = None,
    sort: str = "created_at",
    order: str = "desc",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[dict], int]:
    """Return a paginated, filtered list of Packs."""
    base = select(Pack)
    count_q = select(func.count(func.distinct(Pack.id)))

    # Text search on title
    if q:
        pattern = f"%{q}%"
        base = base.where(col(Pack.title).ilike(pattern))
        count_q = count_q.where(col(Pack.title).ilike(pattern))

    # Filter by coser
    if coser_ids:
        sub = select(PackCoser.pack_id).where(col(PackCoser.coser_id).in_(coser_ids))
        base = base.where(col(Pack.id).in_(sub))
        count_q = count_q.where(col(Pack.id).in_(sub))

    # Filter by work (via characters)
    if work_ids:
        char_sub = select(Character.id).where(col(Character.work_id).in_(work_ids))
        pack_sub = select(PackCharacter.pack_id).where(col(PackCharacter.character_id).in_(char_sub))
        base = base.where(col(Pack.id).in_(pack_sub))
        count_q = count_q.where(col(Pack.id).in_(pack_sub))

    # Filter by character
    if character_ids:
        sub = select(PackCharacter.pack_id).where(col(PackCharacter.character_id).in_(character_ids))
        base = base.where(col(Pack.id).in_(sub))
        count_q = count_q.where(col(Pack.id).in_(sub))

    # Filter by outfit
    if outfit_ids:
        sub = select(PackOutfit.pack_id).where(col(PackOutfit.outfit_id).in_(outfit_ids))
        base = base.where(col(Pack.id).in_(sub))
        count_q = count_q.where(col(Pack.id).in_(sub))

    # Filter by tag
    if tag_ids:
        sub = select(PackTag.pack_id).where(col(PackTag.tag_id).in_(tag_ids))
        base = base.where(col(Pack.id).in_(sub))
        count_q = count_q.where(col(Pack.id).in_(sub))

    # Filter by has_video
    if has_video is True:
        base = base.where(Pack.video_count > 0)
        count_q = count_q.where(Pack.video_count > 0)
    elif has_video is False:
        base = base.where(Pack.video_count == 0)
        count_q = count_q.where(Pack.video_count == 0)

    # Filter by status
    if status:
        base = base.where(Pack.status == status)
        count_q = count_q.where(Pack.status == status)

    total = db.exec(count_q).one()

    # Sorting
    sort_col = _sort_column(sort)
    if order == "asc":
        base = base.order_by(sort_col.asc())
    else:
        base = base.order_by(sort_col.desc())

    packs = db.exec(base.offset((page - 1) * page_size).limit(page_size)).all()
    pack_ids = [p.id for p in packs]

    coser_map = _pack_cosers(db, pack_ids)
    char_map = _pack_characters(db, pack_ids)

    items = []
    for p in packs:
        items.append({
            "id": p.id,
            "title": p.title,
            "status": p.status,
            "cover_asset_id": p.cover_asset_id,
            "photo_count": p.photo_count,
            "video_count": p.video_count,
            "total_size_bytes": p.total_size_bytes,
            "created_at": p.created_at,
            "cosers": coser_map.get(p.id, []),
            "characters": char_map.get(p.id, []),
        })

    return items, total


def get_pack(db: Session, pack_id: int) -> dict | None:
    """Return full pack detail with all relations."""
    pack = db.get(Pack, pack_id)
    if pack is None:
        return None

    coser_map = _pack_cosers(db, [pack.id])
    char_map = _pack_characters(db, [pack.id])
    outfit_map = _pack_outfits(db, [pack.id])
    tag_map = _pack_tags(db, [pack.id])

    return {
        "id": pack.id,
        "title": pack.title,
        "description": pack.description,
        "dir_path": pack.dir_path,
        "original_folder_name": pack.original_folder_name,
        "status": pack.status,
        "cover_asset_id": pack.cover_asset_id,
        "photo_count": pack.photo_count,
        "video_count": pack.video_count,
        "total_size_bytes": pack.total_size_bytes,
        "created_at": pack.created_at,
        "updated_at": pack.updated_at,
        "last_scanned_at": pack.last_scanned_at,
        "cosers": coser_map.get(pack.id, []),
        "characters": char_map.get(pack.id, []),
        "outfits": outfit_map.get(pack.id, []),
        "tags": tag_map.get(pack.id, []),
    }


def create_pack(
    db: Session,
    *,
    title: str,
    dir_path: str,
    original_folder_name: str | None = None,
    description: str | None = None,
) -> Pack:
    """Create a new Pack."""
    if original_folder_name is None:
        original_folder_name = dir_path.rstrip("/").rsplit("/", 1)[-1]
    pack = Pack(
        title=title,
        dir_path=dir_path,
        original_folder_name=original_folder_name,
        description=description,
    )
    db.add(pack)
    db.commit()
    db.refresh(pack)
    return pack


def update_pack(
    db: Session,
    pack_id: int,
    *,
    title: str | None = None,
    description: str | None = None,
    dir_path: str | None = None,
    status: str | None = None,
    cover_asset_id: int | None = None,
    coser_ids: list[int] | None = None,
    character_ids: list[int] | None = None,
    outfit_ids: list[int] | None = None,
    tag_ids: list[int] | None = None,
    relation_fields_set: set[str] | None = None,
) -> Pack | None:
    """Update an existing Pack.

    Scalar fields are updated when not None.  Relation arrays are only
    touched when the corresponding key appears in *relation_fields_set*
    (which comes from ``body.model_fields_set`` in the router).  This
    lets callers distinguish "not provided" from "provided as []".
    """
    pack = db.get(Pack, pack_id)
    if pack is None:
        return None
    if title is not None:
        pack.title = title
    if description is not None:
        pack.description = description
    if dir_path is not None:
        pack.dir_path = dir_path
    if status is not None:
        pack.status = status
    if cover_asset_id is not None:
        pack.cover_asset_id = cover_asset_id
    pack.updated_at = datetime.now(timezone.utc)
    db.add(pack)
    db.commit()
    db.refresh(pack)

    if relation_fields_set is None:
        relation_fields_set = set()

    if "coser_ids" in relation_fields_set:
        _replace_relations(db, pack_id, PackCoser, "coser_id", coser_ids or [])
    if "character_ids" in relation_fields_set:
        _replace_relations(db, pack_id, PackCharacter, "character_id", character_ids or [])
    if "outfit_ids" in relation_fields_set:
        _replace_relations(db, pack_id, PackOutfit, "outfit_id", outfit_ids or [])
    if "tag_ids" in relation_fields_set:
        _replace_relations(db, pack_id, PackTag, "tag_id", tag_ids or [])

    return pack


def delete_pack(db: Session, pack_id: int) -> bool | str:
    """Delete a Pack and cascade-delete Assets, relations, suggestions.

    Also cleans up orphaned entities (Coser, Character, Outfit, Work) that
    have no remaining pack links after the relations are removed.
    """
    from app.models.asset import Asset
    from app.models.coser import CoserAlias
    from app.models.duplicate_check import PackDuplicateCheck
    from app.models.import_batch import ImportCandidate
    from app.models.suggestion import MetadataSuggestion
    from app.models.task import Task

    pack = db.get(Pack, pack_id)
    if pack is None:
        return "not_found"

    # Collect affected entity IDs before deleting relations
    coser_ids = [
        r.coser_id for r in db.exec(
            select(PackCoser).where(PackCoser.pack_id == pack_id)
        ).all()
    ]
    character_ids = [
        r.character_id for r in db.exec(
            select(PackCharacter).where(PackCharacter.pack_id == pack_id)
        ).all()
    ]
    outfit_ids = [
        r.outfit_id for r in db.exec(
            select(PackOutfit).where(PackOutfit.pack_id == pack_id)
        ).all()
    ]

    # Delete relations
    for model in (PackCoser, PackCharacter, PackOutfit, PackTag):
        for link in db.exec(select(model).where(model.pack_id == pack_id)).all():
            db.delete(link)
    db.flush()

    # Delete suggestions
    for s in db.exec(
        select(MetadataSuggestion).where(MetadataSuggestion.pack_id == pack_id)
    ).all():
        db.delete(s)

    # Delete duplicate checks (both directions)
    for dc in db.exec(
        select(PackDuplicateCheck).where(
            (PackDuplicateCheck.pack_id == pack_id)
            | (PackDuplicateCheck.duplicate_pack_id == pack_id)
        )
    ).all():
        db.delete(dc)

    # Null stale references in import candidates
    for ic in db.exec(
        select(ImportCandidate).where(ImportCandidate.existing_pack_id == pack_id)
    ).all():
        ic.existing_pack_id = None
        db.add(ic)

    # Delete tasks referencing this pack
    for t in db.exec(
        select(Task).where(Task.target_type == "pack", Task.target_id == pack_id)
    ).all():
        db.delete(t)

    # Collect asset IDs and clear external asset references
    asset_ids = list(
        db.exec(select(Asset.id).where(Asset.pack_id == pack_id)).all()
    )
    if asset_ids:
        for coser in db.exec(
            select(Coser).where(Coser.avatar_asset_id.in_(asset_ids))
        ).all():
            coser.avatar_asset_id = None
            db.add(coser)

    # Clear cover reference before deleting assets
    pack.cover_asset_id = None
    db.add(pack)
    db.flush()

    # Delete assets
    for asset in db.exec(select(Asset).where(Asset.pack_id == pack_id)).all():
        db.delete(asset)

    db.delete(pack)
    db.flush()

    # Clean up orphaned outfits
    for oid in outfit_ids:
        remaining = db.exec(
            select(PackOutfit).where(PackOutfit.outfit_id == oid).limit(1)
        ).first()
        if remaining is None:
            outfit = db.get(Outfit, oid)
            if outfit:
                db.delete(outfit)

    # Clean up orphaned characters, then works
    for cid in character_ids:
        remaining = db.exec(
            select(PackCharacter).where(PackCharacter.character_id == cid).limit(1)
        ).first()
        if remaining is None:
            character = db.get(Character, cid)
            if character:
                work_id = character.work_id
                # Delete any remaining outfits of this character
                for o in db.exec(
                    select(Outfit).where(Outfit.character_id == cid)
                ).all():
                    o_remaining = db.exec(
                        select(PackOutfit).where(PackOutfit.outfit_id == o.id).limit(1)
                    ).first()
                    if o_remaining is None:
                        db.delete(o)
                db.delete(character)
                db.flush()
                # Check if work is orphaned
                if work_id:
                    work_remaining = db.exec(
                        select(Character).where(Character.work_id == work_id).limit(1)
                    ).first()
                    if work_remaining is None:
                        work = db.get(Work, work_id)
                        if work:
                            db.delete(work)

    # Clean up orphaned cosers
    for cid in coser_ids:
        remaining = db.exec(
            select(PackCoser).where(PackCoser.coser_id == cid).limit(1)
        ).first()
        if remaining is None:
            coser = db.get(Coser, cid)
            if coser:
                for alias in db.exec(
                    select(CoserAlias).where(CoserAlias.coser_id == cid)
                ).all():
                    db.delete(alias)
                db.delete(coser)

    db.commit()
    return True


# ---------------------------------------------------------------------------
# Bulk operations
# ---------------------------------------------------------------------------


def bulk_delete_packs(db: Session, ids: list[int]) -> dict:
    """Delete multiple packs in sequence, returning aggregate counts.

    Each pack is deleted via :func:`delete_pack`, which already handles
    cascade cleanup, orphan pruning, and per-call commits.  IDs that do
    not resolve to a pack are accumulated in ``not_found``; the rest are
    counted in ``deleted``.

    Args:
        db: Active database session.
        ids: Pack ids to delete (deduplicated internally).

    Returns:
        ``{"deleted": int, "not_found": list[int]}`` matching
        :class:`app.schemas.pack.PackBulkDeleteResult`.
    """
    deleted = 0
    not_found: list[int] = []
    for pid in dict.fromkeys(ids):  # preserve order, dedupe
        result = delete_pack(db, pid)
        if result == "not_found":
            not_found.append(pid)
        else:
            deleted += 1
    return {"deleted": deleted, "not_found": not_found}


def bulk_regenerate_thumbnails(db: Session, ids: list[int]) -> dict:
    """Regenerate thumbnails + BlurHash for multiple packs in sequence.

    Calls :func:`app.services.asset_service.generate_pack_thumbnails` for
    each id.  Counts and per-pack failures are aggregated.  Imported
    locally to avoid a circular dependency between pack and asset
    services at module-import time.

    Args:
        db: Active database session.
        ids: Pack ids to regenerate (deduplicated internally).

    Returns:
        Dict matching :class:`app.schemas.pack.PackBulkRegenerateResult`.
    """
    from app.services import asset_service

    succeeded = 0
    failed: list[int] = []
    thumbnails_generated = 0
    hashes_computed = 0
    for pid in dict.fromkeys(ids):
        if db.get(Pack, pid) is None:
            failed.append(pid)
            continue
        try:
            result = asset_service.generate_pack_thumbnails(db, pid)
        except Exception:
            failed.append(pid)
            continue
        succeeded += 1
        thumbnails_generated += result.get("thumbnails_generated", 0)
        hashes_computed += result.get("hashes_computed", 0)
    return {
        "succeeded": succeeded,
        "failed": failed,
        "thumbnails_generated": thumbnails_generated,
        "hashes_computed": hashes_computed,
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _sort_column(sort: str):
    mapping = {
        "created_at": Pack.created_at,
        "title": Pack.title,
        "total_size_bytes": Pack.total_size_bytes,
        "photo_count": Pack.photo_count,
    }
    return mapping.get(sort, Pack.created_at)


def _pack_cosers(db: Session, pack_ids: list[int]) -> dict[int, list[dict]]:
    if not pack_ids:
        return {}
    rows = db.exec(
        select(PackCoser, Coser)
        .join(Coser, Coser.id == PackCoser.coser_id)
        .where(col(PackCoser.pack_id).in_(pack_ids)),
    ).all()
    result: dict[int, list[dict]] = {}
    for link, coser in rows:
        result.setdefault(link.pack_id, []).append({
            "id": coser.id, "name": coser.name, "is_primary": link.is_primary,
        })
    return result


def _pack_characters(db: Session, pack_ids: list[int]) -> dict[int, list[dict]]:
    if not pack_ids:
        return {}
    rows = db.exec(
        select(PackCharacter, Character)
        .join(Character, Character.id == PackCharacter.character_id)
        .where(col(PackCharacter.pack_id).in_(pack_ids)),
    ).all()

    # Batch-fetch work names
    work_ids = {c.work_id for _, c in rows if c.work_id}
    work_map: dict[int, str] = {}
    if work_ids:
        for w in db.exec(select(Work).where(col(Work.id).in_(work_ids))).all():
            work_map[w.id] = w.name

    result: dict[int, list[dict]] = {}
    for link, char in rows:
        result.setdefault(link.pack_id, []).append({
            "id": char.id, "name": char.name,
            "work_name": work_map.get(char.work_id),
            "is_primary": link.is_primary,
        })
    return result


def _pack_outfits(db: Session, pack_ids: list[int]) -> dict[int, list[dict]]:
    if not pack_ids:
        return {}
    rows = db.exec(
        select(PackOutfit, Outfit)
        .join(Outfit, Outfit.id == PackOutfit.outfit_id)
        .where(col(PackOutfit.pack_id).in_(pack_ids)),
    ).all()

    char_ids = {o.character_id for _, o in rows}
    char_map: dict[int, str] = {}
    if char_ids:
        for c in db.exec(select(Character).where(col(Character.id).in_(char_ids))).all():
            char_map[c.id] = c.name

    result: dict[int, list[dict]] = {}
    for link, outfit in rows:
        result.setdefault(link.pack_id, []).append({
            "id": outfit.id, "name": outfit.name,
            "character_name": char_map.get(outfit.character_id),
        })
    return result


def _pack_tags(db: Session, pack_ids: list[int]) -> dict[int, list[dict]]:
    if not pack_ids:
        return {}
    rows = db.exec(
        select(PackTag, Tag)
        .join(Tag, Tag.id == PackTag.tag_id)
        .where(col(PackTag.pack_id).in_(pack_ids)),
    ).all()
    result: dict[int, list[dict]] = {}
    for link, tag in rows:
        result.setdefault(link.pack_id, []).append({
            "id": tag.id, "name": tag.name, "tag_type": tag.tag_type,
        })
    return result


def _replace_relations(
    db: Session,
    pack_id: int,
    link_model: type,
    fk_field: str,
    new_ids: list[int],
) -> None:
    """Replace all relations of a given type for a pack.

    Deletes existing links and inserts new ones.  The first id in the
    list is marked ``is_primary=True`` when the model supports it.
    """
    existing = db.exec(
        select(link_model).where(link_model.pack_id == pack_id),
    ).all()
    for link in existing:
        db.delete(link)
    db.flush()

    has_primary = hasattr(link_model, "is_primary")
    for i, entity_id in enumerate(new_ids):
        kwargs: dict = {"pack_id": pack_id, fk_field: entity_id}
        if has_primary:
            kwargs["is_primary"] = i == 0
        db.add(link_model(**kwargs))
    db.commit()
