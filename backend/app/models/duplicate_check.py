"""PackDuplicateCheck model — 记录 Pack 导入时的去重检测结果."""

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class PackDuplicateCheck(SQLModel, table=True):
    """记录 Pack 导入时的去重检测结果."""

    __tablename__ = "pack_duplicate_checks"

    id: int | None = Field(default=None, primary_key=True)
    pack_id: int = Field(foreign_key="packs.id", nullable=False)
    duplicate_pack_id: int = Field(foreign_key="packs.id", nullable=False)
    max_similarity: float = Field(nullable=False)
    matched_asset_id: int = Field(foreign_key="assets.id", nullable=False)
    duplicate_asset_id: int = Field(foreign_key="assets.id", nullable=False)
    checked_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
