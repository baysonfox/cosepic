import os
import hashlib
import asyncio
import re
import logging
from pathlib import Path
from typing import List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor

from PIL import Image as PILImage
import pillow_avif # Enable AVIF support
import blurhash
from tortoise.transactions import in_transaction

from app import settings
from app.models import Album, Image, Tag, TagAlias, TagCategory, MediaType

logger = logging.getLogger(__name__)

# Supported image extensions
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'}
VIDEO_EXTENSIONS = {'.mp4', '.mkv', '.webm', '.mov', '.avi'}
SUPPORTED_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS

# Special subfolders that are part of the parent album
SPECIAL_SUBFOLDERS = {
    "selfie": MediaType.SELFIE,
    "video": MediaType.VIDEO,
    "gif": MediaType.GIF
}

class ScannerService:
    def __init__(self):
        self.root = settings.ROOT_DIR
        self.executor = ThreadPoolExecutor(max_workers=os.cpu_count() or 2)

    async def scan(self):
        """
        Main entry point for scanning.
        """
        logger.info(f"Starting scan of {self.root}")
        if not self.root.exists():
            logger.error(f"Root directory {self.root} does not exist.")
            return {"status": "error", "message": "Root directory not found"}

        count = 0
        
        # Incremental scan: Walk the directory
        for root, dirs, files in os.walk(self.root):
            for file in files:
                file_path = Path(root) / file
                if file_path.suffix.lower() in SUPPORTED_EXTENSIONS:
                    try:
                        await self._process_image(file_path)
                        count += 1
                    except Exception as e:
                        logger.error(f"Failed to process {file_path}: {e}")
        
        logger.info(f"Scan complete. Processed {count} images.")
        return {"status": "success", "processed_count": count}

    async def _process_image(self, file_path: Path):
        """
        Process a single image file.
        """
        # 1. Calculate Hash (Deduplication Check)
        file_hash = await self._run_blocking(self._calculate_hash, file_path)
        
        # Check if exists
        existing = await Image.filter(file_hash=file_hash).first()
        if existing:
            # Already indexed. Maybe check if path changed? 
            # For now, skip if hash exists as per spec "If hash exists in DB, skip".
            return

        # 2. Determine Album and Media Type from Path
        rel_path = file_path.relative_to(self.root)
        parent_name = rel_path.parent.name.lower()
        
        media_type = MediaType.PICTURE
        
        # Check if file is in a special subfolder (video, selfie, gif)
        if parent_name in SPECIAL_SUBFOLDERS:
            # It's a special type, and the album is the grandparent
            media_type = SPECIAL_SUBFOLDERS[parent_name]
            album_path = rel_path.parent.parent
        else:
            # Normal file, album is the parent
            album_path = rel_path.parent
            # Auto-detect type if not in special folder but has specific extension?
            # User said "Others... will be separately stored". 
            # But let's be safe: if it's a video file in root, mark as Video.
            if file_path.suffix.lower() in VIDEO_EXTENSIONS:
                media_type = MediaType.VIDEO
            elif file_path.suffix.lower() == '.gif':
                 media_type = MediaType.GIF

        # Get or Create Album
        album = await Album.get_or_create(
            path=str(album_path),
            defaults={"title": album_path.name or "Root"}
        )
        album = album[0] # get_or_create returns (obj, created)

        # 3. Auto-tagging
        await self._apply_path_tags(album, rel_path)

        # 4. Image Processing
        thumb_filename = f"{file_hash}.jpg"
        thumb_path = settings.THUMB_DIR / thumb_filename
        blur_string = None
        
        # Skip visual processing for Videos
        if media_type != MediaType.VIDEO:
            # If thumbnail doesn't exist, generate it
            if not thumb_path.exists():
                 try:
                    await self._run_blocking(self._generate_thumbnail, file_path, thumb_path)
                 except Exception as e:
                    logger.warning(f"Thumbnail generation failed for {file_path}: {e}")

            # Generate BlurHash
            if thumb_path.exists():
                blur_string = await self._run_blocking(self._generate_blurhash, thumb_path)

        # 5. Save Image Record
        img = await Image.create(
            album=album,
            filename=file_path.name,
            file_hash=file_hash,
            width=0, 
            height=0,
            blurhash=blur_string,
            media_type=media_type
        )
        
        # Update dimensions
        if media_type != MediaType.VIDEO:
            try:
                width, height = await self._run_blocking(self._get_image_dims, file_path)
                img.width = width
                img.height = height
                await img.save()
            except Exception:
                pass
        
        # Update Album Blurhash if empty
        if not album.blurhash:
            album.blurhash = blur_string
            await album.save()

    async def _apply_path_tags(self, album: Album, rel_path: Path):
        """
        Parse path: ROOT/{Coser}/{Coser} - {Series} - {Character}/
        """
        parts = rel_path.parts
        # Expected structure: 
        # parts[0] = Coser Name (Folder)
        # parts[1] = Album Name (Coser - Series - Character)
        
        tags_to_add = []

        # 1. First Level folder -> Coser
        if len(parts) > 1:
            coser_name = parts[0]
            tags_to_add.append(await self._get_or_create_tag(coser_name, TagCategory.COSER))

        # 2. Second Level folder -> Parse "Coser - Series - Character"
        if len(parts) > 2:
            folder_name = parts[1]
            # Try to split by " - "
            segments = folder_name.split(' - ')
            
            # Simple heuristic mapping based on position if strictly followed
            # Assuming: Coser - Series - Character
            if len(segments) >= 2:
                # We already have Coser from parts[0], but maybe segments[0] matches?
                # Add Series (index 1)
                series_name = segments[1].strip()
                tags_to_add.append(await self._get_or_create_tag(series_name, TagCategory.SERIES))
                
                # Add Character (index 2+)
                if len(segments) >= 3:
                     char_name = segments[2].strip()
                     tags_to_add.append(await self._get_or_create_tag(char_name, TagCategory.CHARACTER))
        
        # Add tags to album
        if tags_to_add:
            await album.tags.add(*tags_to_add)

    async def _get_or_create_tag(self, name: str, category: TagCategory) -> Tag:
        """
        Resolve tag using TagAlias or create new.
        """
        name = name.strip()
        if not name:
            return None
            
        # Check Alias
        alias = await TagAlias.filter(alias=name).select_related("tag").first()
        if alias:
            return alias.tag
        
        # Check if Tag exists
        tag = await Tag.filter(name=name).first()
        if tag:
            return tag
            
        # Create new Tag
        return await Tag.create(name=name, category=category)

    def _calculate_hash(self, path: Path) -> str:
        sha256 = hashlib.sha256()
        with open(path, 'rb') as f:
            while True:
                data = f.read(65536)
                if not data:
                    break
                sha256.update(data)
        return sha256.hexdigest()

    def _generate_thumbnail(self, src: Path, dest: Path):
        try:
            with PILImage.open(src) as img:
                # Convert to RGB if needed (e.g. RGBA pngs)
                if img.mode in ('RGBA', 'LA'):
                    background = PILImage.new(img.mode[:-1], img.size, (255, 255, 255))
                    background.paste(img, img.split()[-1])
                    img = background
                
                # Resize: Height 400px
                aspect_ratio = img.width / img.height
                new_height = 400
                new_width = int(new_height * aspect_ratio)
                
                img = img.resize((new_width, new_height), PILImage.Resampling.LANCZOS)
                
                # Save as JPEG
                img.convert('RGB').save(dest, 'JPEG', quality=85)
        except Exception as e:
            logger.error(f"Error generating thumbnail for {src}: {e}")
            # Create a placeholder or copy? Raise for now
            raise

    def _generate_blurhash(self, path: Path) -> str:
        try:
            # Open small image (thumbnail) for speed
            with PILImage.open(path) as img:
                img = img.convert("RGB")
                # Resize even smaller for blurhash speed (100x100 is plenty)
                img.thumbnail((100, 100)) 
                return blurhash.encode(img, x_components=4, y_components=3)
        except Exception:
            return None

    def _get_image_dims(self, path: Path) -> Tuple[int, int]:
        try:
            with PILImage.open(path) as img:
                return img.size
        except Exception:
            return (0, 0)

    async def _run_blocking(self, func, *args):
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(self.executor, func, *args)
