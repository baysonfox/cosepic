from tortoise import fields, models
from enum import Enum

class TagCategory(str, Enum):
    SERIES = "series"
    CHARACTER = "character"
    COSER = "coser"
    OTHER = "other"

class Tag(models.Model):
    """
    Represents a tag (Coser, Series, Character, etc.)
    """
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=255, unique=True, index=True)
    category = fields.CharEnumField(TagCategory, default=TagCategory.OTHER)

    albums: fields.ManyToManyRelation["Album"]

    class Meta:
        table = "tags"

    def __str__(self):
        return self.name

class TagAlias(models.Model):
    """
    Maps alternative names to a canonical Tag.
    e.g. "Arknights" -> "明日方舟"
    """
    id = fields.IntField(pk=True)
    alias = fields.CharField(max_length=255, unique=True, index=True)
    tag: fields.ForeignKeyRelation[Tag] = fields.ForeignKeyField(
        "models.Tag", related_name="aliases", on_delete=fields.CASCADE
    )

    class Meta:
        table = "tag_aliases"
    
    def __str__(self):
        return f"{self.alias} -> {self.tag.name}"

class Album(models.Model):
    """
    Represents a folder containing images.
    """
    id = fields.IntField(pk=True)
    path = fields.CharField(max_length=1024, unique=True)  # Relative path from ROOT_DIR
    title = fields.CharField(max_length=255)
    blurhash = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    tags: fields.ManyToManyRelation[Tag] = fields.ManyToManyField(
        "models.Tag", related_name="albums", through="album_tags"
    )
    
    images: fields.ReverseRelation["Image"]

    class Meta:
        table = "albums"

    def __str__(self):
        return self.title

    def __str__(self):
        return self.filename

class MediaType(str, Enum):
    PICTURE = "P"
    VIDEO = "V"
    SELFIE = "S"
    GIF = "G"

    def __str__(self):
        return self.value

class Image(models.Model):
    """
    Represents an individual image file.
    """
    id = fields.IntField(pk=True)
    album: fields.ForeignKeyRelation[Album] = fields.ForeignKeyField(
        "models.Album", related_name="images", on_delete=fields.CASCADE
    )
    filename = fields.CharField(max_length=255)
    file_hash = fields.CharField(max_length=64, index=True) # MD5 or SHA256
    width = fields.IntField()
    height = fields.IntField()
    blurhash = fields.CharField(max_length=255, null=True)
    media_type = fields.CharEnumField(MediaType, default=MediaType.PICTURE)
    
    class Meta:
        table = "images"
        unique_together = (("album", "filename"),)

    def __str__(self):
        return f"[{self.media_type}] {self.filename}"
