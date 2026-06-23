"""submissions + submission_sections

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-23
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

UUID = postgresql.UUID(as_uuid=True)
NOW = sa.text("now()")


def upgrade() -> None:
    op.create_table(
        "submissions",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_id", UUID, sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("edital_id", UUID, sa.ForeignKey("editais.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500)),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("adherence", postgresql.JSONB),
        sa.Column("checklist", postgresql.JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=NOW, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=NOW, nullable=False),
    )
    op.create_index("ix_submissions_user_id", "submissions", ["user_id"])
    op.create_index("ix_submissions_project_id", "submissions", ["project_id"])
    op.create_index("ix_submissions_edital_id", "submissions", ["edital_id"])

    op.create_table(
        "submission_sections",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("submission_id", UUID, sa.ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("section_type", sa.String(50), nullable=False),
        sa.Column("content", sa.Text),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=NOW, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=NOW, nullable=False),
    )
    op.create_index("ix_submission_sections_submission_id", "submission_sections", ["submission_id"])


def downgrade() -> None:
    op.drop_table("submission_sections")
    op.drop_table("submissions")
