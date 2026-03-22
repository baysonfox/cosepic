"""数据库连接与会话管理。"""

from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{DATA_DIR / 'db.sqlite'}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SCHEMA_VERSION = 1


class Base(DeclarativeBase):
    """SQLAlchemy 声明式基类。"""


def run_migrations() -> None:
    with engine.begin() as connection:
        current_version = connection.execute(text("PRAGMA user_version")).scalar() or 0

        if current_version >= SCHEMA_VERSION:
            return

        if current_version < 1:
            _drop_image_hash_phash_column(connection)
            connection.execute(text(f"PRAGMA user_version = {SCHEMA_VERSION}"))


def _drop_image_hash_phash_column(connection) -> None:
    columns = connection.execute(text("PRAGMA table_info(image_hashes)")).fetchall()
    if not columns:
        return

    column_names = {row[1] for row in columns}
    if "phash" not in column_names:
        return

    connection.execute(text("DROP TABLE IF EXISTS image_hashes_new"))
    connection.execute(
        text(
            """
            CREATE TABLE image_hashes_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cosplay_id INTEGER NOT NULL,
                filename VARCHAR(512) NOT NULL,
                blurhash VARCHAR(64),
                FOREIGN KEY(cosplay_id) REFERENCES cosplays(id) ON DELETE CASCADE
            )
            """
        )
    )
    connection.execute(
        text(
            """
            INSERT INTO image_hashes_new (id, cosplay_id, filename, blurhash)
            SELECT id, cosplay_id, filename, blurhash
            FROM image_hashes
            """
        )
    )
    connection.execute(text("DROP TABLE image_hashes"))
    connection.execute(text("ALTER TABLE image_hashes_new RENAME TO image_hashes"))
    connection.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_image_hashes_cosplay_id "
            "ON image_hashes (cosplay_id)"
        )
    )


def get_db():
    """FastAPI 依赖注入：获取数据库会话。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
