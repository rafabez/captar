"""edital sharing (community mural)

Revision ID: 0009
Revises: 0008
Create Date: 2026-07-08
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("editais", sa.Column("shared", sa.Boolean, nullable=False, server_default=sa.false()))
    op.add_column("editais", sa.Column("shared_at", sa.DateTime(timezone=True)))
    op.create_index("ix_editais_shared", "editais", ["shared"])


def downgrade() -> None:
    op.drop_index("ix_editais_shared", "editais")
    op.drop_column("editais", "shared_at")
    op.drop_column("editais", "shared")
