"""add index on assets.pack_id

Revision ID: 78f0a3fa5225
Revises: 7634906b3782
Create Date: 2026-05-09 03:06:22.240359

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '78f0a3fa5225'
down_revision: Union[str, Sequence[str], None] = '7634906b3782'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_assets_pack_id",
        "assets",
        ["pack_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_assets_pack_id", table_name="assets")
