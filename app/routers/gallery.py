from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
import math

from app.models import Album, Image, MediaType, TagCategory
from app.models import Album, Image, MediaType, TagCategory
from app.schemas import AlbumBase, AlbumOut, AlbumDetail, ImageOut, TagOut
from tortoise.functions import Count

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
        
        # Get media type counts
        stats = await Image.filter(album=album).annotate(count=Count("id")).group_by("media_type").values("media_type", "count")
        # stats is list of dicts: [{'media_type': 'P', 'count': 10}, ...]
        
        counts = {s['media_type']: s['count'] for s in stats}
        
        base_dto = AlbumBase.model_validate(album)
        base_dto.image_count = count
        base_dto.media_counts = counts
        
        # Organize tags
        categorized_tags = {
            "coser": [],
            "series": [],
            "character": [],
            "other": []
        }
        for tag in album.tags:
            # tag.category is an Enum, use .value or str()
            cat = tag.category.value if hasattr(tag.category, 'value') else str(tag.category)
            if cat in categorized_tags:
                categorized_tags[cat].append(tag.name)
            else:
                 # Fallback
                 categorized_tags["other"].append(tag.name)
        
        album_dto = AlbumOut(
            **base_dto.model_dump(),
            tags=categorized_tags
        )
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
            media_type=img.media_type,
            url=f"/static/files/{album.path}/{img.filename}",
            thumbnail_url=f"/static/cache/thumbnails/{img.file_hash}.jpg"
        )
        images_out.append(img_dto)
        
    # Convert album
    # Must use AlbumBase to avoid validation error on "images" since ORM objects lack url/thumbnail_url
    base_dto = AlbumBase.model_validate(album)
    
    # Calculate media counts for consistency
    stats = await Image.filter(album=album).annotate(count=Count("id")).group_by("media_type").values("media_type", "count")
    base_dto.media_counts = {s['media_type']: s['count'] for s in stats}
    
    album_dto = AlbumDetail(
        **base_dto.model_dump(),
        tags=[TagOut.model_validate(t) for t in album.tags],
        images=images_out
    )
    # Tag validation handles itself via from_attributes
    
    return album_dto
