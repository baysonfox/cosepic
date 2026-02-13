from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import admin, cosers, cosplays, files, parodies

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cosepic", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cosplays.router, prefix="/api/cosplays", tags=["cosplays"])
app.include_router(cosers.router, prefix="/api/cosers", tags=["cosers"])
app.include_router(parodies.router, prefix="/api/parodies", tags=["parodies"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(files.router, prefix="/api/files", tags=["files"])


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
