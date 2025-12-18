from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
import math

from app.models import Album, Image
from app.schemas import AlbumOut, AlbumDetail, ImageOut

router = APIRouter(prefix="/api/albums", tags=["Gallery"])

@router.get("", response_model=Dict[str, Any]) # Custom response structure for pagination
async def get_albums(
    tag_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    offset = (page - 1) * limit
    
    filters = {}
    if tag_id:
        filters["tags__id"] = tag_id
        
    query = Album.filter(**filters)
    total = await query.count()
    
    albums = await query.order_by("-created_at").offset(offset).limit(limit).prefetch_related("tags")
    
    # Needs to add image_count manually? 
    # Tortoise doesn't support easy annotation for count on M2M/Reverse relation in same query nicely without raw SQL or loops.
    # We will do a loop for now or use simple prefetch.
    
    # Ideally we annotate, but for simplicity:
    # We can fetch image count separately or just not include it in list view if performance matters.
    # The schema has image_count=0 default. Let's populate it.
    
    results = []
    for album in albums:
        count = await album.images.all().count()
        # Convert to schema compatible dict to inject computed fields if needed
        # But here straightforward
        album_dto = AlbumOut.model_validate(album)
        album_dto.image_count = count
        results.append(album_dto)

    return {
        "data": results,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": math.ceil(total / limit)
        }
    }

@router.get("/{album_id}", response_model=AlbumDetail)
async def get_album(album_id: int):
    album = await Album.get_or_none(id=album_id).prefetch_related("tags", "images")
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
        
    # Process images to add URLs
    images_out = []
    for img in album.images:
        # Construct URLs
        # url: /static/files/path/to/album/filename
        # thumb: /static/cache/hash.jpg
        
        # Note: album.path is relative to ROOT.
        # Ensure we treat it safely.
        
        img_dto = ImageOut(
            id=img.id,
            filename=img.filename,
            width=img.width,
            height=img.height,
            blurhash=img.blurhash,
            url=f"/static/files/{album.path}/{img.filename}",
            thumbnail_url=f"/static/cache/{img.file_hash}.jpg"
        )
        images_out.append(img_dto)
        
    # Convert album
    album_dto = AlbumDetail.model_validate(album)
    album_dto.images = images_out
    # Tag validation handles itself via from_attributes
    
    return album_dto
