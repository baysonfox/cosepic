from datetime import datetime

from pydantic import BaseModel


class CoserBase(BaseModel):
    name: str
    avatar_path: str | None = None


class CoserCreate(CoserBase):
    pass


class CoserOut(CoserBase):
    id: int
    created_at: datetime
    cosplay_count: int = 0

    model_config = {"from_attributes": True}


class ParodyBase(BaseModel):
    name: str


class ParodyCreate(ParodyBase):
    pass


class ParodyOut(ParodyBase):
    id: int
    created_at: datetime
    cosplay_count: int = 0

    model_config = {"from_attributes": True}


class CosplayBase(BaseModel):
    title: str
    coser_id: int
    parody_id: int | None = None
    dir_path: str


class CosplayCreate(BaseModel):
    dir_path: str
    title: str | None = None
    coser_id: int | None = None
    parody_id: int | None = None


class ScrapedCosplayCandidate(BaseModel):
    dir_path: str
    folder_name: str
    title: str
    coser_name: str
    parody_name: str | None = None
    coser_id: int | None = None
    parody_id: int | None = None
    photo_count: int = 0
    video_count: int = 0
    total_size: int = 0
    cover_path: str | None = None


class ScrapePreviewRequest(BaseModel):
    root_dir: str


class ScrapePreviewResponse(BaseModel):
    root_dir: str
    items: list[ScrapedCosplayCandidate]


class BatchCreateCosplaysRequest(BaseModel):
    items: list[CosplayCreate]


class CosplayUpdate(BaseModel):
    title: str | None = None
    coser_id: int | None = None
    parody_id: int | None = None
    dir_path: str | None = None


class CosplayOut(CosplayBase):
    id: int
    cover_path: str | None = None
    photo_count: int = 0
    video_count: int = 0
    total_size: int = 0
    created_at: datetime
    coser: CoserOut | None = None
    parody: ParodyOut | None = None

    model_config = {"from_attributes": True}


class BatchCreateCosplaysResponse(BaseModel):
    created: list[CosplayOut]


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
