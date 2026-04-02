from pathlib import Path
import shutil

import pillow_avif  # noqa: F401
import PIL.Image
from sqlmodel import Session, SQLModel, create_engine

from app.models import Asset, Character, Coser, Pack, PackCharacter, PackCoser, Work

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "playwright.sqlite"
DATA_DIR = ROOT / "playwright_data"
THUMB_DIR = DATA_DIR / "cache" / "thumbnails"
IMAGE_PATH = ROOT.parent / "frontend" / "public" / "test-seed.png"


def reset_fs() -> None:
    if DB_PATH.exists():
        DB_PATH.unlink()
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


def main() -> None:
    reset_fs()
    engine = create_engine(
        f"sqlite:///{DB_PATH}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
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


if __name__ == "__main__":
    main()
