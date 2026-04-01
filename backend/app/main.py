"""Cosepic v2 — FastAPI application factory."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_db_and_tables
from app.routers import characters, cosers, imports, outfits, packs, system, tags, works


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Startup / shutdown lifecycle."""
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.thumbnail_dir.mkdir(parents=True, exist_ok=True)
    create_db_and_tables()
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

    return application


app = create_app()
