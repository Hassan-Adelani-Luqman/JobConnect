"""Add saved jobs table

Revision ID: add_saved_jobs_001
Revises: 
Create Date: 2025-11-24 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_saved_jobs_001'
down_revision = '0001_add_cover_letter_to_applications'
branch_labels = None
depends_on = None

def upgrade():
    # Create saved_jobs table
    op.create_table('saved_jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('saved_at', sa.DateTime(), nullable=True),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('job_id', 'user_id', name='unique_saved_job')
    )

def downgrade():
    # Drop saved_jobs table
    op.drop_table('saved_jobs')