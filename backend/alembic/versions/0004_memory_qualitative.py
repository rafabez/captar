"""project memory (brief/pins) + qualitative diagnostic

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-22
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Project memory
    op.add_column("projects", sa.Column("brief", sa.Text))
    op.add_column("projects", sa.Column("pins", postgresql.JSONB))
    # Qualitative diagnostic
    op.add_column("diagnostics", sa.Column("summary", sa.Text))
    op.add_column("diagnostics", sa.Column("overall_band", sa.String(20)))


def downgrade() -> None:
    op.drop_column("diagnostics", "overall_band")
    op.drop_column("diagnostics", "summary")
    op.drop_column("projects", "pins")
    op.drop_column("projects", "brief")
