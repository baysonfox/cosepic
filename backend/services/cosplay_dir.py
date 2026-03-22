import re
from pathlib import Path

from sqlalchemy.orm import Session

from ..models import Coser, Cosplay, Parody

DIRECTORY_SUFFIX_RE = re.compile(r"\s+\d+p(?:\s+\d+v)?$", re.IGNORECASE)


def parse_cosplay_dir_name(name: str) -> tuple[str, str | None, str]:
    folder_name = Path(name).name.strip()
    normalized_name = DIRECTORY_SUFFIX_RE.sub("", folder_name).strip()
    parts = [part.strip() for part in normalized_name.split(" - ") if part.strip()]

    if len(parts) < 3:
        raise ValueError("invalid cosplay folder name")

    coser_name = parts[0]
    parody_name = parts[1] or None
    title = " - ".join(parts[2:])
    if not title:
        raise ValueError("missing cosplay title")

    return coser_name, parody_name, title


def resolve_cosplay_dir_path(cosplay: Cosplay, db: Session) -> Path | None:
    dir_path = Path(cosplay.dir_path)
    if dir_path.is_dir():
        return dir_path

    parent_dir = dir_path.parent
    if not parent_dir.is_dir():
        return None

    coser = db.query(Coser).filter(Coser.id == cosplay.coser_id).first()
    parody = None
    if cosplay.parody_id is not None:
        parody = db.query(Parody).filter(Parody.id == cosplay.parody_id).first()

    target_coser_name = coser.name if coser is not None else None
    target_parody_name = parody.name if parody is not None else None

    for candidate in sorted(parent_dir.iterdir(), key=lambda item: item.name.lower()):
        if not candidate.is_dir():
            continue

        try:
            coser_name, parody_name, title = parse_cosplay_dir_name(candidate.name)
        except ValueError:
            continue

        if title != cosplay.title:
            continue
        if target_coser_name is not None and coser_name != target_coser_name:
            continue
        if target_parody_name != parody_name:
            continue

        cosplay.dir_path = str(
            candidate if not dir_path.is_absolute() else candidate.resolve()
        )
        db.commit()
        return candidate

    return None
