"""Shared test fixtures: in-memory database, test client, factories."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.dependencies import get_db
from app.main import create_app
from app.models import (  # noqa: F401 — trigger table registration
    Asset,
    Character,
    Coser,
    CoserAlias,
    ImportBatch,
    ImportCandidate,
    MetadataSuggestion,
    Outfit,
    Pack,
    PackCharacter,
    PackCoser,
    PackOutfit,
    PackTag,
    Tag,
    Task,
    Work,
)


@pytest.fixture(name="engine")
def fixture_engine():
    """Create an in-memory SQLite engine for testing."""
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(eng)
    return eng


@pytest.fixture(name="db")
def fixture_db(engine):
    """Provide a transactional session that rolls back after each test."""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def fixture_client(engine):
    """Provide a TestClient with the DB dependency overridden."""
    app = create_app()

    def _override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Factory helpers
# ---------------------------------------------------------------------------

def make_coser(db: Session, name: str = "TestCoser", **kwargs) -> Coser:
    """Create and persist a Coser."""
    coser = Coser(name=name, **kwargs)
    db.add(coser)
    db.commit()
    db.refresh(coser)
    return coser


def make_work(db: Session, name: str = "TestWork", **kwargs) -> Work:
    """Create and persist a Work."""
    work = Work(name=name, **kwargs)
    db.add(work)
    db.commit()
    db.refresh(work)
    return work


def make_character(
    db: Session,
    name: str = "TestCharacter",
    work_id: int | None = None,
    **kwargs,
) -> Character:
    """Create and persist a Character."""
    character = Character(name=name, work_id=work_id, **kwargs)
    db.add(character)
    db.commit()
    db.refresh(character)
    return character


def make_outfit(
    db: Session,
    name: str = "TestOutfit",
    character_id: int = 1,
    **kwargs,
) -> Outfit:
    """Create and persist an Outfit."""
    outfit = Outfit(name=name, character_id=character_id, **kwargs)
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    return outfit


def make_tag(db: Session, name: str = "TestTag", **kwargs) -> Tag:
    """Create and persist a Tag."""
    tag = Tag(name=name, **kwargs)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def make_pack(
    db: Session,
    title: str = "TestPack",
    dir_path: str = "/tmp/test_pack",
    original_folder_name: str = "test_pack",
    **kwargs,
) -> Pack:
    """Create and persist a Pack."""
    pack = Pack(
        title=title,
        dir_path=dir_path,
        original_folder_name=original_folder_name,
        **kwargs,
    )
    db.add(pack)
    db.commit()
    db.refresh(pack)
    return pack


def make_asset(
    db: Session,
    pack_id: int,
    file_name: str = "test.jpg",
    relative_path: str = "test.jpg",
    asset_type: str = "image",
    **kwargs,
) -> Asset:
    """Create and persist an Asset."""
    asset = Asset(
        pack_id=pack_id,
        file_name=file_name,
        relative_path=relative_path,
        asset_type=asset_type,
        **kwargs,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset
