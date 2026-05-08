"""All SQLModel models — import this package to register tables."""

from app.models.asset import Asset
from app.models.character import Character
from app.models.coser import Coser, CoserAlias
from app.models.outfit import Outfit
from app.models.pack import Pack
from app.models.relations import PackCharacter, PackCoser, PackOutfit, PackTag
from app.models.suggestion import MetadataSuggestion
from app.models.tag import Tag
from app.models.task import Task
from app.models.work import Work

__all__ = [
    "Asset",
    "Character",
    "Coser",
    "CoserAlias",
    "MetadataSuggestion",
    "Outfit",
    "Pack",
    "PackCharacter",
    "PackCoser",
    "PackOutfit",
    "PackTag",
    "Tag",
    "Task",
    "Work",
]
