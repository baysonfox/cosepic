from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel
from app.models import TagCategory, MediaType

class TagOut(BaseModel):
    id: int
    name: str
    category: TagCategory
    
    class Config:
        from_attributes = True

class ImageOut(BaseModel):
    id: int
    filename: str
    media_type: MediaType
    # file_hash: str # maybe not needed for frontend immediately
    width: int
    height: int
    blurhash: Optional[str] = None
    url: str # Helper to construct URL
    thumbnail_url: str

    class Config:
        from_attributes = True

class AlbumBase(BaseModel):
    id: int
    path: str
    title: str
    blurhash: Optional[str] = None
    created_at: datetime
    image_count: int = 0
    media_counts: Dict[str, int] = {}
    
    class Config:
        from_attributes = True

class AlbumOut(AlbumBase):
    tags: Dict[str, List[str]] = {}

class AlbumDetail(AlbumBase):
    tags: List[TagOut] = []
    images: List[ImageOut] = []
