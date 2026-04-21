"""Playwright seed data script.

Seeds the configured ``DATABASE_URL`` with deterministic data for the
Playwright E2E suite. Requires:

    1. The pgvector container from ``docker-compose.yml`` to be running.
    2. ``uv run alembic upgrade head`` to have been applied so the schema
       exists.

CLI usage (writes to the configured DB, first resetting all tables):

    uv run python scripts/seed_playwright_data.py

When called from tests, pass an existing :class:`~sqlmodel.Session` via
``main(session=...)`` to avoid mutating the shared test database outside
whatever transactional envelope the test fixture holds.
"""

from pathlib import Path
import os
import shutil

import pillow_avif  # noqa: F401 — register AVIF codec on import
import PIL.Image
from sqlalchemy import text
from sqlmodel import Session

from app.database import create_db_and_tables, engine as default_engine
from app.models import Asset, Character, Coser, Pack, PackCharacter, PackCoser, Work

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = Path(os.environ.get("DATA_DIR", "./playwright_data"))
if not DATA_DIR.is_absolute():
    DATA_DIR = ROOT / DATA_DIR
THUMB_DIR = Path(
    os.environ.get("THUMBNAIL_DIR", str(DATA_DIR / "cache" / "thumbnails")),
)
if not THUMB_DIR.is_absolute():
    THUMB_DIR = ROOT / THUMB_DIR
IMAGE_PATH = ROOT.parent / "frontend" / "public" / "test-seed.png"

# Tables reset by the CLI path. Order is irrelevant because the command
# uses TRUNCATE ... CASCADE with RESTART IDENTITY.
TABLES = (
    "assets",
    "cosers",
    "coser_aliases",
    "works",
    "characters",
    "outfits",
    "tags",
    "packs",
    "pack_coser",
    "pack_character",
    "pack_outfit",
    "pack_tag",
    "import_batches",
    "import_candidates",
    "metadata_suggestions",
    "tasks",
)


def reset_fs() -> None:
    if DATA_DIR.exists():
        shutil.rmtree(DATA_DIR)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    pack_dir = DATA_DIR / "packs" / "amiya_winter"
    pack_dir.mkdir(parents=True, exist_ok=True)
    target = pack_dir / "cover.png"
    target.write_bytes(IMAGE_PATH.read_bytes())

    import_root = DATA_DIR / "imports"
    import_root.mkdir(parents=True, exist_ok=True)

    amiya_dir = import_root / "鳗鱼霏儿 - 明日方舟 - 阿米娅 2p"
    amiya_dir.mkdir(parents=True, exist_ok=True)
    (amiya_dir / "01.png").write_bytes(IMAGE_PATH.read_bytes())
    (amiya_dir / "02.png").write_bytes(IMAGE_PATH.read_bytes())

    keqing_dir = import_root / "铃木美咲 - 原神 - 刻晴 花嫁 2p 1v"
    keqing_dir.mkdir(parents=True, exist_ok=True)
    (keqing_dir / "01.png").write_bytes(IMAGE_PATH.read_bytes())
    (keqing_dir / "02.png").write_bytes(IMAGE_PATH.read_bytes())
    (keqing_dir / "clip.mp4").write_bytes(b"\x00" * 128)

    thumb = THUMB_DIR / "1.avif"
    with PIL.Image.open(IMAGE_PATH) as img:
        img.convert("RGB").save(thumb, format="AVIF", quality=60)


def _insert_seed_data(session: Session) -> None:
    coser = Coser(name="Moe", avatar_asset_id=None)
    work = Work(name="Arknights")
    session.add(coser)
    session.add(work)
    session.commit()
    session.refresh(coser)
    session.refresh(work)

    character = Character(name="Amiya", work_id=work.id)
    session.add(character)
    session.commit()
    session.refresh(character)

    pack = Pack(
        title="Amiya Winter Pack",
        dir_path=str(DATA_DIR / "packs" / "amiya_winter"),
        original_folder_name="amiya_winter",
        description="Seed pack for browser tests",
        photo_count=1,
        video_count=0,
        total_size_bytes=IMAGE_PATH.stat().st_size,
    )
    session.add(pack)
    session.commit()
    session.refresh(pack)

    asset = Asset(
        id=1,
        pack_id=pack.id,
        asset_type="image",
        file_name="cover.png",
        relative_path="cover.png",
        size_bytes=IMAGE_PATH.stat().st_size,
        width=16,
        height=16,
        blurhash=None,
        thumbnail_status="generated",
        sort_index=0,
    )
    session.add(asset)
    session.add(PackCoser(pack_id=pack.id, coser_id=coser.id, is_primary=True))
    session.add(
        PackCharacter(
            pack_id=pack.id,
            character_id=character.id,
            is_primary=True,
        )
    )
    session.commit()

    pack.cover_asset_id = asset.id
    session.add(pack)
    session.commit()


def _reset_db(engine) -> None:
    """Hard-reset every application table in the configured database.

    Used by the CLI path so the seed is idempotent across re-runs. Tests
    never hit this path — they pass their own :class:`Session` whose outer
    transaction will be rolled back by the fixture.
    """
    create_db_and_tables()
    table_list = ", ".join(TABLES)
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE TABLE {table_list} RESTART IDENTITY CASCADE"))


def main(session: Session | None = None) -> None:
    """Seed data for Playwright.

    Args:
        session: Optional SQLModel session. When provided, data is written
            through it and the caller controls the transaction (used by
            tests). When omitted, the script opens its own session against
            ``app.database.engine`` after truncating all tables.
    """
    reset_fs()
    if session is not None:
        _insert_seed_data(session)
        return

    _reset_db(default_engine)
    with Session(default_engine) as s:
        _insert_seed_data(s)


if __name__ == "__main__":
    main()
