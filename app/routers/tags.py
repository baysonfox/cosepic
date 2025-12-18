from fastapi import APIRouter
from typing import Dict, List
from app.models import Tag, TagCategory
from app.schemas import TagOut

router = APIRouter(prefix="/api/tags", tags=["Tags"])

@router.get("", response_model=Dict[str, List[TagOut]])
async def get_tags():
    """
    List all tags grouped by category.
    """
    tags = await Tag.all()
    
    result = {
        TagCategory.SERIES.value: [],
        TagCategory.CHARACTER.value: [],
        TagCategory.COSER.value: [],
        TagCategory.OTHER.value: []
    }
    
    for tag in tags:
        # Pydantic will validate the tag object against TagOut, 
        # but we need to convert it or let FastAPI do it. 
        # Since we are returning a Dict of Lists, we can just append the objects 
        # and FastApi's recursive validation will handle it if response_model is set correct.
        if tag.category in result:
             result[tag.category].append(tag)
        else:
             result[TagCategory.OTHER.value].append(tag)
             
    return result
