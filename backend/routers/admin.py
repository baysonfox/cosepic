from pathlib import Path
import re
import shutil

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Coser, Cosplay, ImageHash, Parody
from ..services.cosplay_dir import parse_cosplay_dir_name
from ..schemas import (
    BatchCreateCosplaysRequest,
    BatchCreateCosplaysResponse,
    CoserCreate,
    CoserOut,
    CosplayCreate,
    CosplayOut,
    CosplayUpdate,
    ParodyCreate,
    ParodyOut,
    ScrapePreviewRequest,
    ScrapePreviewResponse,
    ScrapedCosplayCandidate,
)

router = APIRouter()

IMAGE_EXTENSIONS = {".avif", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
VIDEO_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".webm"}


def _scan_dir_stats(dir_path: str) -> tuple[int, int, int, str | None]:
    p = Path(dir_path)
    if not p.is_dir():
        return 0, 0, 0, None

    photo_count = 0
    video_count = 0
    total_size = 0
    first_image: str | None = None

    for f in sorted(p.iterdir(), key=lambda x: x.name):
        if not f.is_file():
            continue
        suffix = f.suffix.lower()
        if suffix in IMAGE_EXTENSIONS:
            photo_count += 1
            total_size += f.stat().st_size
            if first_image is None:
                first_image = f.name
        elif suffix in VIDEO_EXTENSIONS:
            video_count += 1
            total_size += f.stat().st_size

    return photo_count, video_count, total_size, first_image


def _parse_cosplay_dir_name(dir_path: str) -> tuple[str, str | None, str]:
    try:
        return parse_cosplay_dir_name(dir_path)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=("目录名格式不正确，应为：Coser - 作品 - 角色 [变体] XXp [XXv]"),
        )


def _get_or_create_coser(db: Session, name: str) -> Coser:
    coser = db.query(Coser).filter(Coser.name == name).first()
    if coser is not None:
        return coser

    coser = Coser(name=name)
    db.add(coser)
    db.flush()
    return coser


def _get_or_create_parody(db: Session, name: str | None) -> Parody | None:
    if name is None:
        return None

    parody = db.query(Parody).filter(Parody.name == name).first()
    if parody is not None:
        return parody

    parody = Parody(name=name)
    db.add(parody)
    db.flush()
    return parody


def _build_scraped_candidate(dir_path: str, db: Session) -> ScrapedCosplayCandidate:
    coser_name, parody_name, title = _parse_cosplay_dir_name(dir_path)
    photo_count, video_count, total_size, first_image = _scan_dir_stats(dir_path)
    coser = db.query(Coser).filter(Coser.name == coser_name).first()
    parody = None
    if parody_name is not None:
        parody = db.query(Parody).filter(Parody.name == parody_name).first()

    return ScrapedCosplayCandidate(
        dir_path=dir_path,
        folder_name=Path(dir_path).name,
        title=title,
        coser_name=coser_name,
        parody_name=parody_name,
        coser_id=coser.id if coser is not None else None,
        parody_id=parody.id if parody is not None else None,
        photo_count=photo_count,
        video_count=video_count,
        total_size=total_size,
        cover_path=first_image,
    )


@router.post("/cosers", response_model=CoserOut)
def create_coser(data: CoserCreate, db: Session = Depends(get_db)):
    existing = db.query(Coser).filter(Coser.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Coser already exists")
    coser = Coser(name=data.name, avatar_path=data.avatar_path)
    db.add(coser)
    db.commit()
    db.refresh(coser)
    data_dict = CoserOut.model_validate(coser).model_dump()
    data_dict["cosplay_count"] = 0
    return CoserOut(**data_dict)


@router.put("/cosers/{coser_id}", response_model=CoserOut)
def update_coser(coser_id: int, data: CoserCreate, db: Session = Depends(get_db)):
    coser = db.query(Coser).filter(Coser.id == coser_id).first()
    if not coser:
        raise HTTPException(status_code=404, detail="Coser not found")
    coser.name = data.name
    coser.avatar_path = data.avatar_path
    db.commit()
    db.refresh(coser)
    return CoserOut.model_validate(coser)


@router.delete("/cosers/{coser_id}")
def delete_coser(coser_id: int, db: Session = Depends(get_db)):
    coser = db.query(Coser).filter(Coser.id == coser_id).first()
    if not coser:
        raise HTTPException(status_code=404, detail="Coser not found")
    cosplay_count = db.query(Cosplay).filter(Cosplay.coser_id == coser_id).count()
    if cosplay_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Coser still has {cosplay_count} cosplay(s), delete them first",
        )
    db.delete(coser)
    db.commit()
    return {"ok": True}


@router.post("/parodies", response_model=ParodyOut)
def create_parody(data: ParodyCreate, db: Session = Depends(get_db)):
    existing = db.query(Parody).filter(Parody.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Parody already exists")
    parody = Parody(name=data.name)
    db.add(parody)
    db.commit()
    db.refresh(parody)
    data_dict = ParodyOut.model_validate(parody).model_dump()
    data_dict["cosplay_count"] = 0
    return ParodyOut(**data_dict)


@router.put("/parodies/{parody_id}", response_model=ParodyOut)
def update_parody(parody_id: int, data: ParodyCreate, db: Session = Depends(get_db)):
    parody = db.query(Parody).filter(Parody.id == parody_id).first()
    if not parody:
        raise HTTPException(status_code=404, detail="Parody not found")
    parody.name = data.name
    db.commit()
    db.refresh(parody)
    return ParodyOut.model_validate(parody)


@router.delete("/parodies/{parody_id}")
def delete_parody(parody_id: int, db: Session = Depends(get_db)):
    parody = db.query(Parody).filter(Parody.id == parody_id).first()
    if not parody:
        raise HTTPException(status_code=404, detail="Parody not found")
    db.query(Cosplay).filter(Cosplay.parody_id == parody_id).update({"parody_id": None})
    db.delete(parody)
    db.commit()
    return {"ok": True}


@router.post("/cosplays", response_model=CosplayOut)
def create_cosplay(data: CosplayCreate, db: Session = Depends(get_db)):
    parsed_coser_name, parsed_parody_name, parsed_title = _parse_cosplay_dir_name(
        data.dir_path
    )

    if data.coser_id is not None:
        coser = db.query(Coser).filter(Coser.id == data.coser_id).first()
        if not coser:
            raise HTTPException(status_code=404, detail="Coser not found")
    else:
        coser = _get_or_create_coser(db, parsed_coser_name)

    if data.parody_id is not None:
        parody = db.query(Parody).filter(Parody.id == data.parody_id).first()
        if not parody:
            raise HTTPException(status_code=404, detail="Parody not found")
    else:
        parody = _get_or_create_parody(db, parsed_parody_name)

    title = (data.title or parsed_title).strip()
    if not title:
        raise HTTPException(status_code=400, detail="标题不能为空")

    photo_count, video_count, total_size, first_image = _scan_dir_stats(data.dir_path)

    cosplay = Cosplay(
        title=title,
        coser_id=coser.id,
        parody_id=parody.id if parody is not None else None,
        dir_path=data.dir_path,
        photo_count=photo_count,
        video_count=video_count,
        total_size=total_size,
        cover_path=first_image,
    )
    db.add(cosplay)
    db.commit()
    db.refresh(cosplay)

    from ..services.thumbnail import (
        generate_thumbnails_for_cosplay,
        compute_blurhashes_for_cosplay,
    )

    generate_thumbnails_for_cosplay(cosplay)
    compute_blurhashes_for_cosplay(cosplay, db)

    return CosplayOut.model_validate(cosplay)


@router.post("/cosplays/scrape-preview", response_model=ScrapePreviewResponse)
def scrape_cosplay_preview(data: ScrapePreviewRequest, db: Session = Depends(get_db)):
    root_dir = Path(data.root_dir)
    if not root_dir.is_dir():
        raise HTTPException(status_code=400, detail="根目录不存在")

    items: list[ScrapedCosplayCandidate] = []
    for path in sorted(root_dir.iterdir(), key=lambda item: item.name.lower()):
        if not path.is_dir():
            continue

        try:
            candidate = _build_scraped_candidate(str(path), db)
        except HTTPException:
            continue

        if candidate.photo_count == 0 and candidate.video_count == 0:
            continue

        items.append(candidate)

    return ScrapePreviewResponse(root_dir=str(root_dir), items=items)


@router.post("/cosplays/batch-create", response_model=BatchCreateCosplaysResponse)
def batch_create_cosplays(
    data: BatchCreateCosplaysRequest, db: Session = Depends(get_db)
):
    created_items: list[CosplayOut] = []
    for item in data.items:
        created_items.append(create_cosplay(item, db))

    return BatchCreateCosplaysResponse(created=created_items)


@router.put("/cosplays/{cosplay_id}", response_model=CosplayOut)
def update_cosplay(cosplay_id: int, data: CosplayUpdate, db: Session = Depends(get_db)):
    cosplay = db.query(Cosplay).filter(Cosplay.id == cosplay_id).first()
    if not cosplay:
        raise HTTPException(status_code=404, detail="Cosplay not found")

    dir_path_changed = False

    if data.title is not None:
        cosplay.title = data.title
    if data.coser_id is not None:
        coser = db.query(Coser).filter(Coser.id == data.coser_id).first()
        if not coser:
            raise HTTPException(status_code=404, detail="Coser not found")
        cosplay.coser_id = data.coser_id
    if data.parody_id is not None:
        parody = db.query(Parody).filter(Parody.id == data.parody_id).first()
        if not parody:
            raise HTTPException(status_code=404, detail="Parody not found")
        cosplay.parody_id = data.parody_id

    if data.dir_path is not None and data.dir_path != cosplay.dir_path:
        cosplay.dir_path = data.dir_path
        dir_path_changed = True

    if dir_path_changed:
        photo_count, video_count, total_size, first_image = _scan_dir_stats(
            cosplay.dir_path
        )
        cosplay.photo_count = photo_count
        cosplay.video_count = video_count
        cosplay.total_size = total_size
        cosplay.cover_path = first_image

    db.commit()
    db.refresh(cosplay)

    if dir_path_changed:
        from ..services.thumbnail import (
            compute_blurhashes_for_cosplay,
            generate_thumbnails_for_cosplay,
        )

        generate_thumbnails_for_cosplay(cosplay)
        compute_blurhashes_for_cosplay(cosplay, db)

    return CosplayOut.model_validate(cosplay)


@router.post("/cosplays/{cosplay_id}/rescan")
def rescan_cosplay(cosplay_id: int, db: Session = Depends(get_db)):
    cosplay = db.query(Cosplay).filter(Cosplay.id == cosplay_id).first()
    if not cosplay:
        raise HTTPException(status_code=404, detail="Cosplay not found")

    photo_count, video_count, total_size, first_image = _scan_dir_stats(
        cosplay.dir_path
    )
    cosplay.photo_count = photo_count
    cosplay.video_count = video_count
    cosplay.total_size = total_size
    if first_image:
        cosplay.cover_path = first_image

    from ..services.thumbnail import generate_thumbnails_for_cosplay

    generate_thumbnails_for_cosplay(cosplay)
    db.commit()
    return {"ok": True, "photo_count": photo_count, "video_count": video_count}


@router.post("/cosplays/{cosplay_id}/generate-thumbnails")
def generate_thumbnails(cosplay_id: int, db: Session = Depends(get_db)):
    cosplay = db.query(Cosplay).filter(Cosplay.id == cosplay_id).first()
    if not cosplay:
        raise HTTPException(status_code=404, detail="Cosplay not found")

    from ..services.thumbnail import (
        compute_blurhashes_for_cosplay,
        generate_thumbnails_for_cosplay,
    )

    thumb_count = generate_thumbnails_for_cosplay(cosplay)
    hash_count = compute_blurhashes_for_cosplay(cosplay, db)
    return {
        "ok": True,
        "thumbnails_generated": thumb_count,
        "hashes_computed": hash_count,
    }


@router.delete("/cosplays/{cosplay_id}")
def delete_cosplay(cosplay_id: int, db: Session = Depends(get_db)):
    cosplay = db.query(Cosplay).filter(Cosplay.id == cosplay_id).first()
    if not cosplay:
        raise HTTPException(status_code=404, detail="Cosplay not found")

    thumbnail_dir = (
        Path(__file__).resolve().parent.parent.parent / "data" / "thumbnails"
    )
    cosplay_thumbnail_dir = thumbnail_dir / str(cosplay_id)

    db.query(ImageHash).filter(ImageHash.cosplay_id == cosplay_id).delete()
    db.delete(cosplay)
    db.commit()
    shutil.rmtree(cosplay_thumbnail_dir, ignore_errors=True)
    return {"ok": True}
