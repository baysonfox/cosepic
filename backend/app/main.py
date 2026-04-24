"""Cosepic v2 — FastAPI application factory."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    assets,
    characters,
    cosers,
    embeddings,
    imports,
    outfits,
    packs,
    system,
    tags,
    tasks,
    works,
)


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Startup / shutdown lifecycle.

    Schema is owned by Alembic — run ``uv run alembic upgrade head`` before
    starting the app. We intentionally do NOT call ``create_db_and_tables``
    here to avoid masking Alembic drift under multi-worker deployments.
    """
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.thumbnail_dir.mkdir(parents=True, exist_ok=True)
    yield


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    application = FastAPI(
        title="Cosepic",
        version="2.0.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(system.router)
    application.include_router(packs.router)
    application.include_router(cosers.router)
    application.include_router(works.router)
    application.include_router(characters.router)
    application.include_router(outfits.router)
    application.include_router(tags.router)
    application.include_router(imports.router)
    application.include_router(assets.router)
    application.include_router(tasks.router)
    application.include_router(embeddings.router)

    return application


app = create_app()
