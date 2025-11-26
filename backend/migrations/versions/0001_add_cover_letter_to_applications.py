"""add cover_letter to applications

Revision ID: 0001_cover_letter
Revises: 
Create Date: 2025-11-23 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '0001_cover_letter'
down_revision = '0000_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add `cover_letter` column to `applications` only if it doesn't exist.
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if applications table exists
    tables = inspector.get_table_names()
    if 'applications' not in tables:
        # Table doesn't exist yet, it will be created by db.create_all()
        return
    
    # Get existing columns
    cols = [col['name'] for col in inspector.get_columns('applications')]
    
    if 'cover_letter' not in cols:
        op.add_column('applications', sa.Column('cover_letter', sa.Text(), nullable=True))


def downgrade() -> None:
    # Drop the column on downgrade if it exists
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if applications table exists
    tables = inspector.get_table_names()
    if 'applications' not in tables:
        return
    
    # Get existing columns
    cols = [col['name'] for col in inspector.get_columns('applications')]
    
    if 'cover_letter' in cols:
        op.drop_column('applications', 'cover_letter')
