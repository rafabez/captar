"""dedupe project_sections — keep only the newest row per (project, type)

Revision ID: 0008
Revises: 0007
Create Date: 2026-07-08

Before the save endpoint became an upsert, every save appended a new row with
version=1, leaving stale duplicates behind. Keep the most recent row.
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DELETE FROM project_sections a
        USING project_sections b
        WHERE a.project_id = b.project_id
          AND a.section_type = b.section_type
          AND (a.updated_at < b.updated_at
               OR (a.updated_at = b.updated_at AND a.ctid < b.ctid))
        """
    )


def downgrade() -> None:
    pass  # data cleanup; not reversible
