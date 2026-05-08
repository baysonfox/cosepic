"""drop import_batches and import_candidates tables

Revision ID: 7634906b3782
Revises: b8ac156bdd20
Create Date: 2026-05-09 02:28:23.482341

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7634906b3782'
down_revision: Union[str, Sequence[str], None] = 'b8ac156bdd20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_table('import_candidates')
    op.drop_table('import_batches')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table('import_batches',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('root_path', sa.VARCHAR(length=1024), nullable=False),
        sa.Column('status', sa.VARCHAR(length=20), nullable=False),
        sa.Column('total_candidates', sa.INTEGER(), nullable=False),
        sa.Column('imported_count', sa.INTEGER(), nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(), nullable=False),
        sa.Column('finished_at', postgresql.TIMESTAMP(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table('import_candidates',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('batch_id', sa.INTEGER(), nullable=False),
        sa.Column('folder_path', sa.VARCHAR(length=1024), nullable=False),
        sa.Column('folder_name', sa.VARCHAR(length=512), nullable=False),
        sa.Column('detected_title', sa.VARCHAR(length=512), nullable=True),
        sa.Column('detected_coser_names', sa.VARCHAR(length=512), nullable=True),
        sa.Column('detected_work_name', sa.VARCHAR(length=256), nullable=True),
        sa.Column('detected_character_names', sa.VARCHAR(length=512), nullable=True),
        sa.Column('photo_count', sa.INTEGER(), nullable=False),
        sa.Column('video_count', sa.INTEGER(), nullable=False),
        sa.Column('total_size_bytes', sa.BIGINT(), nullable=False),
        sa.Column('existing_pack_id', sa.INTEGER(), nullable=True),
        sa.Column('status', sa.VARCHAR(length=20), nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['import_batches.id']),
        sa.PrimaryKeyConstraint('id'),
    )
