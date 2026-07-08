"""mural_posts — decoupled community edital snapshots

Revision ID: 0010
Revises: 0009
Create Date: 2026-07-08
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

UUID = postgresql.UUID(as_uuid=True)


def upgrade() -> None:
    op.create_table(
        "mural_posts",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_edital_id", UUID, sa.ForeignKey("editais.id", ondelete="SET NULL")),
        sa.Column("title", sa.String(500)),
        sa.Column("source_url", sa.Text),
        sa.Column("source_filename", sa.String(500)),
        sa.Column("raw_text", sa.Text),
        sa.Column("summary", sa.Text),
        sa.Column("eligibility", postgresql.JSONB),
        sa.Column("deadline", sa.Date),
        sa.Column("max_value", sa.Float),
        sa.Column("requirements", postgresql.JSONB),
        sa.Column("criteria", postgresql.JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_mural_posts_user_id", "mural_posts", ["user_id"])
    op.create_index("ix_mural_posts_source_edital_id", "mural_posts", ["source_edital_id"])


def downgrade() -> None:
    op.drop_table("mural_posts")
