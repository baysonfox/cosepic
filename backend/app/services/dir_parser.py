"""Directory name parser for cosplay image packs.

Format:
    {Coser}[,{Coser}] - {Work} - {Character}[ {Outfit}][,{Character}[ {Outfit}]] {N}p [{N}v]

Rules:
    1. Strip trailing ``{N}p`` and optional ``{N}v`` (case-insensitive).
    2. Split by `` - `` into exactly 3 parts: cosers, work, characters.
    3. Split cosers by ``,`` (trim spaces) -> multiple coser names.
    4. Split characters by ``,`` (trim spaces) -> multiple segments.
    5. For each character segment: first token = character name,
       everything after first space = outfit name.
       Character names contain NO spaces.
"""

import re
from dataclasses import dataclass, field


ORIGINAL_WORK_NAME = "原创"
ORIGINAL_CHARACTER_NAME = "OriginalCharacter"


@dataclass
class CharacterParsed:
    """A parsed character name with optional outfit."""

    name: str
    outfit: str | None = None


@dataclass
class DirParseResult:
    """Result of parsing a cosplay directory name."""

    coser_names: list[str] = field(default_factory=list)
    work_name: str = ""
    characters: list[CharacterParsed] = field(default_factory=list)
    photo_count: int = 0
    video_count: int = 0
    title: str = ""


_STATS_RE = re.compile(r"\s+(\d+)\s*[pP](?:\s+(\d+)\s*[vV])?\s*$")


def parse_dir_name(raw: str) -> DirParseResult | None:
    """Parse a cosplay pack directory name.

    Returns None if the name cannot be parsed (fewer than 3 dash-separated
    segments after stripping stats).
    """
    name = raw.strip()
    if not name:
        return None

    # 1. Extract trailing photo/video counts
    photo_count = 0
    video_count = 0
    m = _STATS_RE.search(name)
    if m:
        photo_count = int(m.group(1))
        video_count = int(m.group(2)) if m.group(2) else 0
        name = name[: m.start()].strip()

    # 2. Split by " - " into exactly 3 parts
    parts = name.split(" - ")
    if len(parts) < 3:
        return None

    cosers_part = parts[0].strip()
    work_part = parts[1].strip()
    characters_part = " - ".join(parts[2:]).strip()

    # 3. Parse cosers (comma-separated)
    coser_names = [c.strip() for c in cosers_part.split(",") if c.strip()]

    # 4. Parse characters (comma-separated)
    characters: list[CharacterParsed] = []
    if work_part == ORIGINAL_WORK_NAME:
        if characters_part:
            characters.append(CharacterParsed(name=ORIGINAL_CHARACTER_NAME))
    else:
        for segment in characters_part.split(","):
            segment = segment.strip()
            if not segment:
                continue
            # First space separates character name from outfit
            space_idx = segment.find(" ")
            if space_idx == -1:
                characters.append(CharacterParsed(name=segment))
            else:
                char_name = segment[:space_idx]
                outfit_name = segment[space_idx + 1:].strip()
                characters.append(CharacterParsed(
                    name=char_name,
                    outfit=outfit_name if outfit_name else None,
                ))

    # 5. Build title from all parts
    title = f"{cosers_part} - {work_part} - {characters_part}"

    return DirParseResult(
        coser_names=coser_names,
        work_name=work_part,
        characters=characters,
        photo_count=photo_count,
        video_count=video_count,
        title=title,
    )
