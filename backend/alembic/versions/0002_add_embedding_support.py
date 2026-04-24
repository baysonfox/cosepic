"""add embedding support

Revision ID: 0002_add_embedding_support
Revises: 067a98d3ecaf
Create Date: 2026-04-24

Adds embedding support for image similarity search and duplicate detection.
- Adds embedding column to assets table (halfvec(2560))
- Creates HNSW index for efficient similarity search
- Creates pack_duplicate_checks table for tracking duplicate detection results
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import HALFVEC

revision: str = "0002_add_embedding_support"
down_revision: Union[str, Sequence[str], None] = "067a98d3ecaf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add embedding support."""
    # 添加 embedding 字段到 assets 表
    op.add_column("assets", sa.Column("embedding", HALFVEC(2560), nullable=True))

    # 创建 HNSW 索引用于高效相似度搜索
    # m=16, ef_construction=64 适合 8-10w 数据量
    op.execute("""
        CREATE INDEX idx_assets_embedding_hnsw
        ON assets
        USING hnsw (embedding halfvec_l2_ops)
        WITH (m = 16, ef_construction = 64)
    """)

    # 创建 pack_duplicate_checks 表
    op.create_table(
        "pack_duplicate_checks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pack_id", sa.Integer(), nullable=False),
        sa.Column("duplicate_pack_id", sa.Integer(), nullable=False),
        sa.Column("max_similarity", sa.Float(), nullable=False),
        sa.Column("matched_asset_id", sa.Integer(), nullable=False),
        sa.Column("duplicate_asset_id", sa.Integer(), nullable=False),
        sa.Column("checked_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["pack_id"], ["packs.id"]),
        sa.ForeignKeyConstraint(["duplicate_pack_id"], ["packs.id"]),
        sa.ForeignKeyConstraint(["matched_asset_id"], ["assets.id"]),
        sa.ForeignKeyConstraint(["duplicate_asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # 为 pack_duplicate_checks 创建索引
    op.create_index(
        "idx_duplicate_checks_pack_id",
        "pack_duplicate_checks",
        ["pack_id"],
    )


def downgrade() -> None:
    """Remove embedding support."""
    op.drop_index("idx_duplicate_checks_pack_id", table_name="pack_duplicate_checks")
    op.drop_table("pack_duplicate_checks")
    op.execute("DROP INDEX IF EXISTS idx_assets_embedding_hnsw")
    op.drop_column("assets", "embedding")
