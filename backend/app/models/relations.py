"""Many-to-many relationship link tables."""

from sqlmodel import Field, Relationship, SQLModel


class PackCoser(SQLModel, table=True):
    """Link between Pack and Coser."""

    __tablename__ = "pack_coser"

    pack_id: int = Field(foreign_key="packs.id", primary_key=True)
    coser_id: int = Field(foreign_key="cosers.id", primary_key=True)
    is_primary: bool = Field(default=False)

    # Relationships
    pack: "Pack" = Relationship(back_populates="coser_links")
    coser: "Coser" = Relationship(back_populates="pack_links")


class PackCharacter(SQLModel, table=True):
    """Link between Pack and Character."""

    __tablename__ = "pack_character"

    pack_id: int = Field(foreign_key="packs.id", primary_key=True)
    character_id: int = Field(foreign_key="characters.id", primary_key=True)
    is_primary: bool = Field(default=False)

    # Relationships
    pack: "Pack" = Relationship(back_populates="character_links")
    character: "Character" = Relationship(back_populates="pack_links")


class PackOutfit(SQLModel, table=True):
    """Link between Pack and Outfit."""

    __tablename__ = "pack_outfit"

    pack_id: int = Field(foreign_key="packs.id", primary_key=True)
    outfit_id: int = Field(foreign_key="outfits.id", primary_key=True)

    # Relationships
    pack: "Pack" = Relationship(back_populates="outfit_links")
    outfit: "Outfit" = Relationship(back_populates="pack_links")


class PackTag(SQLModel, table=True):
    """Link between Pack and Tag."""

    __tablename__ = "pack_tag"

    pack_id: int = Field(foreign_key="packs.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)

    # Relationships
    pack: "Pack" = Relationship(back_populates="tag_links")
    tag: "Tag" = Relationship(back_populates="pack_links")


# Forward references resolved at import time.
from app.models.character import Character  # noqa: E402, F401
from app.models.coser import Coser  # noqa: E402, F401
from app.models.outfit import Outfit  # noqa: E402, F401
from app.models.pack import Pack  # noqa: E402, F401
from app.models.tag import Tag  # noqa: E402, F401
