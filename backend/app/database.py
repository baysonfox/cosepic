"""Database engine, session factory, and table management."""

from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
)


def create_db_and_tables() -> None:
    """Create all tables defined by SQLModel metadata.

    Dev/test-only helper (used by tests fixtures and the Playwright seed
    script as a first-run fallback). Production schema is owned by Alembic;
    run `uv run alembic upgrade head` before starting the app.
    """
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    """Yield a database session that auto-closes after use."""
    with Session(engine) as session:
        yield session
