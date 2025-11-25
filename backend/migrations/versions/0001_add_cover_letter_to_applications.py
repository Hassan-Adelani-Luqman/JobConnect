"""add cover_letter to applications

Revision ID: 0001_add_cover_letter_to_applications
Revises: 
Create Date: 2025-11-23 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_add_cover_letter_to_applications'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add `cover_letter` column to `applications` only if it doesn't exist.
    bind = op.get_bind()
    # For SQLite inspect table columns using PRAGMA
    try:
        res = bind.execute(sa.text("PRAGMA table_info('applications')"))
        cols = []
        for row in res:
            # PRAGMA may return row as mapping-like or tuple; try both
            name = None
            if hasattr(row, 'keys'):
                try:
                    name = row['name']
                except Exception:
                    pass
            if name is None:
                try:
                    name = row[1]
                except Exception:
                    name = None
            if name:
                cols.append(name)
    except Exception:
        cols = []

    if 'cover_letter' not in cols:
        op.add_column('applications', sa.Column('cover_letter', sa.Text(), nullable=True))


def downgrade() -> None:
    # Drop the column on downgrade if it exists
    bind = op.get_bind()
    try:
        res = bind.execute(sa.text("PRAGMA table_info('applications')"))
        cols = []
        for row in res:
            name = None
            if hasattr(row, 'keys'):
                try:
                    name = row['name']
                except Exception:
                    pass
            if name is None:
                try:
                    name = row[1]
                except Exception:
                    name = None
            if name:
                cols.append(name)
    except Exception:
        cols = []

    if 'cover_letter' in cols:
        op.drop_column('applications', 'cover_letter')
