"""CRUD logic for Work, Character, Outfit, and Tag entities."""

from sqlmodel import Session, col, func, select

from app.models.character import Character
from app.models.outfit import Outfit
from app.models.relations import PackCharacter, PackOutfit, PackTag
from app.models.tag import Tag
from app.models.work import Work


# ===================================================================
# Work
# ===================================================================

def list_works(
    db: Session, *, q: str | None = None, page: int = 1, page_size: int = 20,
) -> tuple[list[dict], int]:
    base = select(Work)
    count_q = select(func.count(Work.id))
    if q:
        pattern = f"%{q}%"
        base = base.where(col(Work.name).ilike(pattern))
        count_q = count_q.where(col(Work.name).ilike(pattern))

    total = db.exec(count_q).one()
    works = db.exec(base.order_by(Work.id).offset((page - 1) * page_size).limit(page_size)).all()

    char_counts = _character_counts(db, [w.id for w in works])
    pack_counts = _work_pack_counts(db, [w.id for w in works])

    return [
        {
            "id": w.id, "name": w.name,
            "created_at": w.created_at, "updated_at": w.updated_at,
            "character_count": char_counts.get(w.id, 0),
            "pack_count": pack_counts.get(w.id, 0),
        }
        for w in works
    ], total


def get_work(db: Session, work_id: int) -> dict | None:
    w = db.get(Work, work_id)
    if w is None:
        return None
    char_counts = _character_counts(db, [w.id])
    pack_counts = _work_pack_counts(db, [w.id])
    return {
        "id": w.id, "name": w.name,
        "created_at": w.created_at, "updated_at": w.updated_at,
        "character_count": char_counts.get(w.id, 0),
        "pack_count": pack_counts.get(w.id, 0),
    }


def create_work(db: Session, *, name: str) -> Work:
    work = Work(name=name)
    db.add(work)
    db.commit()
    db.refresh(work)
    return work


def update_work(db: Session, work_id: int, *, name: str | None = None) -> Work | None:
    work = db.get(Work, work_id)
    if work is None:
        return None
    if name is not None:
        work.name = name
    db.add(work)
    db.commit()
    db.refresh(work)
    return work


def delete_work(db: Session, work_id: int) -> bool | str:
    work = db.get(Work, work_id)
    if work is None:
        return "not_found"
    # Unlink characters
    chars = db.exec(select(Character).where(Character.work_id == work_id)).all()
    for ch in chars:
        ch.work_id = None
        db.add(ch)
    db.delete(work)
    db.commit()
    return True


# ===================================================================
# Character
# ===================================================================

def list_characters(
    db: Session, *, q: str | None = None, work_id: int | None = None,
    page: int = 1, page_size: int = 20,
) -> tuple[list[dict], int]:
    base = select(Character)
    count_q = select(func.count(Character.id))
    if q:
        pattern = f"%{q}%"
        base = base.where(col(Character.name).ilike(pattern))
        count_q = count_q.where(col(Character.name).ilike(pattern))
    if work_id is not None:
        base = base.where(Character.work_id == work_id)
        count_q = count_q.where(Character.work_id == work_id)

    total = db.exec(count_q).one()
    chars = db.exec(base.order_by(Character.id).offset((page - 1) * page_size).limit(page_size)).all()

    pack_counts = _char_pack_counts(db, [c.id for c in chars])
    work_map = _work_names(db, [c.work_id for c in chars if c.work_id])

    return [
        {
            "id": c.id, "name": c.name, "work_id": c.work_id,
            "work_name": work_map.get(c.work_id),
            "created_at": c.created_at, "updated_at": c.updated_at,
            "pack_count": pack_counts.get(c.id, 0),
        }
        for c in chars
    ], total


def get_character(db: Session, char_id: int) -> dict | None:
    c = db.get(Character, char_id)
    if c is None:
        return None
    pack_counts = _char_pack_counts(db, [c.id])
    work_name = None
    if c.work_id:
        w = db.get(Work, c.work_id)
        work_name = w.name if w else None
    return {
        "id": c.id, "name": c.name, "work_id": c.work_id,
        "work_name": work_name,
        "created_at": c.created_at, "updated_at": c.updated_at,
        "pack_count": pack_counts.get(c.id, 0),
    }


def create_character(db: Session, *, name: str, work_id: int | None = None) -> Character:
    char = Character(name=name, work_id=work_id)
    db.add(char)
    db.commit()
    db.refresh(char)
    return char


def update_character(
    db: Session,
    char_id: int,
    *,
    name: str | None = None,
    work_id: int | None = None,
    work_id_provided: bool = False,
) -> Character | None:
    char = db.get(Character, char_id)
    if char is None:
        return None
    if name is not None:
        char.name = name
    if work_id_provided:
        char.work_id = work_id
    db.add(char)
    db.commit()
    db.refresh(char)
    return char


def delete_character(db: Session, char_id: int) -> bool | str:
    char = db.get(Character, char_id)
    if char is None:
        return "not_found"
    # Unlink packs
    db.exec(select(PackCharacter).where(PackCharacter.character_id == char_id))
    for link in db.exec(select(PackCharacter).where(PackCharacter.character_id == char_id)).all():
        db.delete(link)
    # Cascade delete outfits
    for outfit in db.exec(select(Outfit).where(Outfit.character_id == char_id)).all():
        for ol in db.exec(select(PackOutfit).where(PackOutfit.outfit_id == outfit.id)).all():
            db.delete(ol)
        db.delete(outfit)
    db.delete(char)
    db.commit()
    return True


# ===================================================================
# Outfit
# ===================================================================

def list_outfits(
    db: Session, *, q: str | None = None, character_id: int | None = None,
    page: int = 1, page_size: int = 20,
) -> tuple[list[dict], int]:
    base = select(Outfit)
    count_q = select(func.count(Outfit.id))
    if q:
        pattern = f"%{q}%"
        base = base.where(col(Outfit.name).ilike(pattern))
        count_q = count_q.where(col(Outfit.name).ilike(pattern))
    if character_id is not None:
        base = base.where(Outfit.character_id == character_id)
        count_q = count_q.where(Outfit.character_id == character_id)

    total = db.exec(count_q).one()
    outfits = db.exec(base.order_by(Outfit.id).offset((page - 1) * page_size).limit(page_size)).all()

    pack_counts = _outfit_pack_counts(db, [o.id for o in outfits])
    char_map = _char_names(db, [o.character_id for o in outfits])

    return [
        {
            "id": o.id, "name": o.name, "character_id": o.character_id,
            "character_name": char_map.get(o.character_id),
            "created_at": o.created_at, "updated_at": o.updated_at,
            "pack_count": pack_counts.get(o.id, 0),
        }
        for o in outfits
    ], total


def get_outfit(db: Session, outfit_id: int) -> dict | None:
    o = db.get(Outfit, outfit_id)
    if o is None:
        return None
    pack_counts = _outfit_pack_counts(db, [o.id])
    char = db.get(Character, o.character_id)
    return {
        "id": o.id, "name": o.name, "character_id": o.character_id,
        "character_name": char.name if char else None,
        "created_at": o.created_at, "updated_at": o.updated_at,
        "pack_count": pack_counts.get(o.id, 0),
    }


def create_outfit(db: Session, *, name: str, character_id: int) -> Outfit:
    outfit = Outfit(name=name, character_id=character_id)
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    return outfit


def update_outfit(
    db: Session,
    outfit_id: int,
    *,
    name: str | None = None,
    character_id: int | None = None,
) -> Outfit | None:
    outfit = db.get(Outfit, outfit_id)
    if outfit is None:
        return None
    if name is not None:
        outfit.name = name
    if character_id is not None:
        outfit.character_id = character_id
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    return outfit


def delete_outfit(db: Session, outfit_id: int) -> bool | str:
    outfit = db.get(Outfit, outfit_id)
    if outfit is None:
        return "not_found"
    for link in db.exec(select(PackOutfit).where(PackOutfit.outfit_id == outfit_id)).all():
        db.delete(link)
    db.delete(outfit)
    db.commit()
    return True


# ===================================================================
# Tag
# ===================================================================

def list_tags(
    db: Session, *, q: str | None = None, page: int = 1, page_size: int = 20,
) -> tuple[list[dict], int]:
    base = select(Tag)
    count_q = select(func.count(Tag.id))
    if q:
        pattern = f"%{q}%"
        base = base.where(col(Tag.name).ilike(pattern))
        count_q = count_q.where(col(Tag.name).ilike(pattern))

    total = db.exec(count_q).one()
    tags = db.exec(base.order_by(Tag.id).offset((page - 1) * page_size).limit(page_size)).all()

    pack_counts = _tag_pack_counts(db, [t.id for t in tags])

    return [
        {
            "id": t.id, "name": t.name, "tag_type": t.tag_type,
            "created_at": t.created_at,
            "pack_count": pack_counts.get(t.id, 0),
        }
        for t in tags
    ], total


def get_tag(db: Session, tag_id: int) -> dict | None:
    t = db.get(Tag, tag_id)
    if t is None:
        return None
    pack_counts = _tag_pack_counts(db, [t.id])
    return {
        "id": t.id, "name": t.name, "tag_type": t.tag_type,
        "created_at": t.created_at,
        "pack_count": pack_counts.get(t.id, 0),
    }


def create_tag(db: Session, *, name: str, tag_type: str = "other") -> Tag:
    tag = Tag(name=name, tag_type=tag_type)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def update_tag(
    db: Session, tag_id: int, *, name: str | None = None, tag_type: str | None = None,
) -> Tag | None:
    tag = db.get(Tag, tag_id)
    if tag is None:
        return None
    if name is not None:
        tag.name = name
    if tag_type is not None:
        tag.tag_type = tag_type
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def delete_tag(db: Session, tag_id: int) -> bool | str:
    tag = db.get(Tag, tag_id)
    if tag is None:
        return "not_found"
    for link in db.exec(select(PackTag).where(PackTag.tag_id == tag_id)).all():
        db.delete(link)
    db.delete(tag)
    db.commit()
    return True


# ===================================================================
# Internal helpers
# ===================================================================

def _character_counts(db: Session, work_ids: list[int]) -> dict[int, int]:
    if not work_ids:
        return {}
    rows = db.exec(
        select(Character.work_id, func.count(Character.id))
        .where(col(Character.work_id).in_(work_ids))
        .group_by(Character.work_id),
    ).all()
    return {r[0]: r[1] for r in rows}


def _work_pack_counts(db: Session, work_ids: list[int]) -> dict[int, int]:
    """Count packs per work via characters."""
    if not work_ids:
        return {}
    rows = db.exec(
        select(Character.work_id, func.count(func.distinct(PackCharacter.pack_id)))
        .join(PackCharacter, PackCharacter.character_id == Character.id)
        .where(col(Character.work_id).in_(work_ids))
        .group_by(Character.work_id),
    ).all()
    return {r[0]: r[1] for r in rows}


def _char_pack_counts(db: Session, char_ids: list[int]) -> dict[int, int]:
    if not char_ids:
        return {}
    rows = db.exec(
        select(PackCharacter.character_id, func.count(PackCharacter.pack_id))
        .where(col(PackCharacter.character_id).in_(char_ids))
        .group_by(PackCharacter.character_id),
    ).all()
    return {r[0]: r[1] for r in rows}


def _outfit_pack_counts(db: Session, outfit_ids: list[int]) -> dict[int, int]:
    if not outfit_ids:
        return {}
    rows = db.exec(
        select(PackOutfit.outfit_id, func.count(PackOutfit.pack_id))
        .where(col(PackOutfit.outfit_id).in_(outfit_ids))
        .group_by(PackOutfit.outfit_id),
    ).all()
    return {r[0]: r[1] for r in rows}


def _tag_pack_counts(db: Session, tag_ids: list[int]) -> dict[int, int]:
    if not tag_ids:
        return {}
    rows = db.exec(
        select(PackTag.tag_id, func.count(PackTag.pack_id))
        .where(col(PackTag.tag_id).in_(tag_ids))
        .group_by(PackTag.tag_id),
    ).all()
    return {r[0]: r[1] for r in rows}


def _work_names(db: Session, work_ids: list[int]) -> dict[int, str]:
    if not work_ids:
        return {}
    rows = db.exec(select(Work.id, Work.name).where(col(Work.id).in_(work_ids))).all()
    return {r[0]: r[1] for r in rows}


def _char_names(db: Session, char_ids: list[int]) -> dict[int, str]:
    if not char_ids:
        return {}
    rows = db.exec(select(Character.id, Character.name).where(col(Character.id).in_(char_ids))).all()
    return {r[0]: r[1] for r in rows}
