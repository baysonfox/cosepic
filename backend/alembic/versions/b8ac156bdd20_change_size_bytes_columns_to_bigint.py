"""change size_bytes columns to bigint

Revision ID: b8ac156bdd20
Revises: 0002_add_embedding_support
Create Date: 2026-05-08 18:39:59.812141

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b8ac156bdd20'
down_revision: Union[str, Sequence[str], None] = '0002_add_embedding_support'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('assets', 'size_bytes',
               existing_type=sa.INTEGER(),
               type_=sa.BigInteger(),
               existing_nullable=False)
    op.alter_column('import_candidates', 'total_size_bytes',
               existing_type=sa.INTEGER(),
               type_=sa.BigInteger(),
               existing_nullable=False)
    op.alter_column('packs', 'total_size_bytes',
               existing_type=sa.INTEGER(),
               type_=sa.BigInteger(),
               existing_nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('packs', 'total_size_bytes',
               existing_type=sa.BigInteger(),
               type_=sa.INTEGER(),
               existing_nullable=False)
    op.alter_column('import_candidates', 'total_size_bytes',
               existing_type=sa.BigInteger(),
               type_=sa.INTEGER(),
               existing_nullable=False)
    op.alter_column('assets', 'size_bytes',
               existing_type=sa.BigInteger(),
               type_=sa.INTEGER(),
               existing_nullable=False)
