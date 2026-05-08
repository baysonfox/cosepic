"""Import service — scan directories and commit imports."""

import os
from datetime import datetime, timezone

from fastapi import BackgroundTasks
from sqlmodel import Session, select

from app.models.asset import Asset
from app.models.character import Character
from app.models.coser import Coser, CoserAlias
from app.models.outfit import Outfit
from app.models.pack import Pack
from app.models.relations import PackCharacter, PackCoser, PackOutfit
from app.models.suggestion import MetadataSuggestion
from app.models.work import Work
from app.schemas.import_schema import (
    ImportCandidateInput,
    ScanCandidateOut,
    ScanResultOut,
)
from app.services import asset_service, embedding_service
from app.services.dir_parser import (
    ORIGINAL_CHARACTER_NAME,
    ORIGINAL_WORK_NAME,
    parse_dir_name,
)
from app.utils.file_utils import scan_media_dir


def scan_import_directory(db: Session, root_path: str) -> ScanResultOut:
    """Scan a root directory and return candidate data without persisting."""
    candidates = []
    if os.path.isdir(root_path):
        for entry in sorted(os.listdir(root_path)):
            if entry.startswith("."):
                continue
            full_path = os.path.join(root_path, entry)
            if not os.path.isdir(full_path):
                continue

            parsed = parse_dir_name(entry)
            stats = scan_media_dir(full_path)

            existing = db.exec(
                select(Pack).where(Pack.dir_path == full_path),
            ).first()

            candidates.append(ScanCandidateOut(
                folder_path=full_path,
                folder_name=entry,
                detected_title=parsed.title if parsed else entry,
                detected_coser_names=(
                    ",".join(parsed.coser_names) if parsed else None
                ),
                detected_work_name=parsed.work_name if parsed else None,
                detected_character_names=(
                    ",".join(
                        f"{c.name} {c.outfit}" if c.outfit else c.name
                        for c in parsed.characters
                    )
                    if parsed
                    else None
                ),
                photo_count=stats["photo_count"],
                video_count=stats["video_count"],
                total_size_bytes=stats["total_size_bytes"],
                existing_pack_id=existing.id if existing else None,
            ))

    return ScanResultOut(
        root_path=root_path,
        total_candidates=len(candidates),
        candidates=candidates,
    )


async def commit_import(
    db: Session,
    candidates: list[ImportCandidateInput],
    background_tasks: BackgroundTasks,
    skip_duplicate_check: bool = False,
) -> dict:
    """Commit selected candidates — create Packs and relations."""
    pack_ids = []
    duplicate_checks = []

    for candidate in candidates:
        pack_id = _import_single_candidate(db, candidate)
        if pack_id:
            pack_ids.append(pack_id)

            if skip_duplicate_check:
                background_tasks.add_task(
                    embedding_service.process_remaining_embeddings,
                    db,
                    pack_id,
                )
            else:
                duplicates = (
                    await embedding_service.check_pack_duplicates(db, pack_id)
                )
                if duplicates:
                    duplicate_checks.append({
                        "pack_id": pack_id,
                        "duplicates": duplicates,
                    })
                else:
                    background_tasks.add_task(
                        embedding_service.process_remaining_embeddings,
                        db,
                        pack_id,
                    )

    return {
        "imported_count": len(pack_ids),
        "pack_ids": pack_ids,
        "duplicate_checks": duplicate_checks,
    }


def cancel_import_pack(db: Session, pack_id: int) -> dict:
    """Cancel a just-imported pack — delete it."""
    from app.services import pack_service

    pack = db.get(Pack, pack_id)
    if pack is None:
        return {"error": "not_found"}

    result = pack_service.delete_pack(db, pack_id)
    if result is not True:
        return {"error": result}

    return {"pack_id": pack_id}


def _import_single_candidate(
    db: Session, candidate: ImportCandidateInput,
) -> int | None:
    """Create Pack + Assets + relations for one candidate."""
    coser_names = (
        [
            n.strip()
            for n in candidate.detected_coser_names.split(",")
            if n.strip()
        ]
        if candidate.detected_coser_names
        else []
    )
    work_name = candidate.detected_work_name
    character_raw = (
        [
            n.strip()
            for n in candidate.detected_character_names.split(",")
            if n.strip()
        ]
        if candidate.detected_character_names
        else []
    )
    if work_name == ORIGINAL_WORK_NAME:
        character_raw = [ORIGINAL_CHARACTER_NAME]

    work = None
    if work_name:
        work = db.exec(
            select(Work).where(Work.name == work_name),
        ).first()
        if work is None:
            work = Work(name=work_name)
            db.add(work)
            db.flush()

    pack = Pack(
        title=candidate.detected_title or candidate.folder_name,
        dir_path=candidate.folder_path,
        original_folder_name=candidate.folder_name,
        photo_count=candidate.photo_count,
        video_count=candidate.video_count,
        total_size_bytes=candidate.total_size_bytes,
    )
    db.add(pack)
    db.flush()

    stats = scan_media_dir(candidate.folder_path)
    for idx, f in enumerate(stats["files"]):
        asset = Asset(
            pack_id=pack.id,
            asset_type=f["asset_type"],
            file_name=f["file_name"],
            relative_path=f["relative_path"],
            size_bytes=f["size_bytes"],
            sort_index=idx,
        )
        db.add(asset)

    db.flush()
    first_image = db.exec(
        select(Asset)
        .where(Asset.pack_id == pack.id, Asset.asset_type == "image")
        .order_by(Asset.sort_index)
        .limit(1),
    ).first()
    if first_image:
        pack.cover_asset_id = first_image.id
        db.add(pack)

    for i, cname in enumerate(coser_names):
        coser = _get_or_create_coser(db, cname)
        link = PackCoser(
            pack_id=pack.id, coser_id=coser.id, is_primary=(i == 0),
        )
        db.add(link)
        _add_suggestion(db, pack.id, "coser", cname, coser.id)

    for i, raw_char in enumerate(character_raw):
        parts = raw_char.split(" ", 1)
        char_name = parts[0]
        outfit_name = parts[1].strip() if len(parts) > 1 else None

        character = _get_or_create_character(
            db, char_name, work.id if work else None,
        )
        link = PackCharacter(
            pack_id=pack.id,
            character_id=character.id,
            is_primary=(i == 0),
        )
        db.add(link)
        _add_suggestion(db, pack.id, "character", char_name, character.id)

        if outfit_name:
            outfit = _get_or_create_outfit(db, outfit_name, character.id)
            db.add(PackOutfit(pack_id=pack.id, outfit_id=outfit.id))
            _add_suggestion(db, pack.id, "outfit", outfit_name, outfit.id)

    if work:
        _add_suggestion(db, pack.id, "work", work.name, work.id)

    pack.last_scanned_at = datetime.now(timezone.utc)
    db.add(pack)
    db.commit()
    asset_service.generate_pack_thumbnails(db, pack.id)
    return pack.id


def _get_or_create_coser(db: Session, name: str) -> Coser:
    """Find a Coser by name or alias, or create a new one."""
    coser = db.exec(select(Coser).where(Coser.name == name)).first()
    if coser:
        return coser
    alias = db.exec(
        select(CoserAlias).where(CoserAlias.alias == name),
    ).first()
    if alias:
        return db.get(Coser, alias.coser_id)
    coser = Coser(name=name)
    db.add(coser)
    db.flush()
    return coser


def _get_or_create_character(
    db: Session, name: str, work_id: int | None,
) -> Character:
    """Find or create a Character."""
    stmt = select(Character).where(Character.name == name)
    if work_id is not None:
        stmt = stmt.where(Character.work_id == work_id)
    character = db.exec(stmt).first()
    if character:
        return character
    character = Character(name=name, work_id=work_id)
    db.add(character)
    db.flush()
    return character


def _get_or_create_outfit(
    db: Session, name: str, character_id: int,
) -> Outfit:
    """Find or create an Outfit."""
    outfit = db.exec(
        select(Outfit).where(
            Outfit.name == name, Outfit.character_id == character_id,
        ),
    ).first()
    if outfit:
        return outfit
    outfit = Outfit(name=name, character_id=character_id)
    db.add(outfit)
    db.flush()
    return outfit


def _add_suggestion(
    db: Session,
    pack_id: int,
    field_name: str,
    value: str,
    entity_id: int,
) -> None:
    """Write an accepted metadata suggestion for audit."""
    db.add(MetadataSuggestion(
        pack_id=pack_id,
        field_name=field_name,
        candidate_value=value,
        candidate_entity_id=entity_id,
        source="folder_parser",
        confidence=1.0,
        status="accepted",
    ))
