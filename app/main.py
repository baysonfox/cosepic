from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from tortoise.contrib.fastapi import register_tortoise
import os

from app.routers import gallery, system, tags
from app import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("Starting up...")
    yield
    # Shutdown logic
    print("Shutting down...")

app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.VERSION,
    lifespan=lifespan
)

# Serve generated thumbnails and cache
app.mount("/static/cache", StaticFiles(directory=settings.CACHE_DIR), name="cache")

# Serve original files (Read-Only)
if settings.ROOT_DIR.exists():
    app.mount("/static/files", StaticFiles(directory=settings.ROOT_DIR), name="files")

# Database Registration
register_tortoise(
    app,
    db_url=settings.DB_URL,
    modules={"models": ["app.models"]},
    generate_schemas=True,
    add_exception_handlers=True,
)

app.include_router(system.router)
app.include_router(gallery.router)
app.include_router(tags.router)

@app.get("/")
async def root():
    return {"message": "Welcome to NAS Cosplay Gallery API", "docs": "/docs"}
