"""Shared FastAPI dependencies."""

from collections.abc import Generator

from sqlmodel import Session

from app.database import engine


def get_db() -> Generator[Session, None, None]:
    """Provide a transactional database session per request."""
    with Session(engine) as session:
        yield session
