"""SQLAlchemy ORM 模型定义。"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Coser(Base):
    __tablename__ = "cosers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    avatar_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    cosplays: Mapped[list["Cosplay"]] = relationship(back_populates="coser")


class Parody(Base):
    __tablename__ = "parodies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    cosplays: Mapped[list["Cosplay"]] = relationship(back_populates="parody")


class Cosplay(Base):
    __tablename__ = "cosplays"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    coser_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cosers.id"), nullable=False
    )
    parody_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("parodies.id"), nullable=True
    )
    cover_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    photo_count: Mapped[int] = mapped_column(Integer, default=0)
    video_count: Mapped[int] = mapped_column(Integer, default=0)
    total_size: Mapped[int] = mapped_column(Integer, default=0)
    dir_path: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    coser: Mapped["Coser"] = relationship(back_populates="cosplays")
    parody: Mapped["Parody | None"] = relationship(back_populates="cosplays")
    image_hashes: Mapped[list["ImageHash"]] = relationship(
        back_populates="cosplay", cascade="all, delete-orphan"
    )


class ImageHash(Base):
    __tablename__ = "image_hashes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cosplay_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cosplays.id", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    phash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    cosplay: Mapped["Cosplay"] = relationship(back_populates="image_hashes")
