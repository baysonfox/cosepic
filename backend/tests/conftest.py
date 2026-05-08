"""Shared test fixtures: per-session PostgreSQL test database, transactional
sessions with savepoint rollback, FastAPI TestClient, and entity factories.

Requires the dev pgvector container from ``docker-compose.yml`` to be running.
A throwaway database ``cosepic_test_<pid>_<hex>`` is created at session start
and dropped at teardown; each test runs inside a nested SAVEPOINT that is
rolled back after the test, giving full isolation without per-test DDL.
"""

import os
import secrets

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine as sa_create_engine, text
from sqlmodel import Session, SQLModel, create_engine

from app.config import settings
from app.dependencies import get_db
from app.main import create_app
from app.models import (  # noqa: F401 — trigger table registration
    Asset,
    Character,
    Coser,
    CoserAlias,
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

ADMIN_URL = settings.database_url
TEST_DB_NAME = f"cosepic_test_{os.getpid()}_{secrets.token_hex(4)}"
TEST_URL = ADMIN_URL.rsplit("/", 1)[0] + f"/{TEST_DB_NAME}"


def _create_temp_db() -> None:
    admin = sa_create_engine(ADMIN_URL, isolation_level="AUTOCOMMIT", pool_pre_ping=True)
    try:
        with admin.connect() as conn:
            conn.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}"'))
    finally:
        admin.dispose()


def _drop_temp_db() -> None:
    admin = sa_create_engine(ADMIN_URL, isolation_level="AUTOCOMMIT", pool_pre_ping=True)
    try:
        with admin.connect() as conn:
            conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}" WITH (FORCE)'))
    finally:
        admin.dispose()


@pytest.fixture(name="engine", scope="session")
def fixture_engine():
    """Create a throwaway PostgreSQL database for the entire test session."""
    _create_temp_db()
    eng = create_engine(TEST_URL, pool_pre_ping=True)
    with eng.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    SQLModel.metadata.create_all(eng)
    try:
        yield eng
    finally:
        eng.dispose()
        _drop_temp_db()


@pytest.fixture(name="db")
def fixture_db(engine):
    """Provide a Session bound to a connection inside an outer transaction.

    Tests (and the factory helpers below) call ``session.commit()`` freely;
    under ``join_transaction_mode="create_savepoint"`` each commit becomes a
    savepoint release. Rolling back the outer transaction at teardown wipes
    all per-test mutations without touching DDL.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(name="client")
def fixture_client(engine, db):
    """Provide a TestClient that shares the same connection as ``db``.

    The dependency override yields the already-active test session so that
    request handlers and test assertions see the same savepoint state.
    """
    app = create_app()

    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.clear()


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
