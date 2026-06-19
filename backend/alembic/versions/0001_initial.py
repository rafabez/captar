"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-06-19

Creates the full MVP V1 schema: users, providers, projects, sections,
diagnostics, conversations, messages, editais, edital matches.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

UUID = postgresql.UUID(as_uuid=True)
JSONB = postgresql.JSONB
NOW = sa.text("now()")


def _ts(col: str) -> sa.Column:
    return sa.Column(col, sa.DateTime(timezone=True), server_default=NOW, nullable=False)


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("clerk_id", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255)),
        sa.Column("avatar_url", sa.String(500)),
        sa.Column("plan", sa.String(20), nullable=False, server_default="free"),
        sa.Column("credits", sa.Integer, nullable=False, server_default="0"),
        _ts("created_at"),
        _ts("updated_at"),
    )
    op.create_index("ix_users_clerk_id", "users", ["clerk_id"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "user_providers",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("encrypted_key", sa.String(500)),
        sa.Column("endpoint_url", sa.String(500)),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        _ts("created_at"),
        _ts("updated_at"),
    )

    op.create_table(
        "projects",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("area", sa.String(100)),
        sa.Column("city", sa.String(200)),
        sa.Column("state", sa.String(2)),
        sa.Column("target_aud", sa.String(500)),
        sa.Column("phase", sa.String(50)),
        sa.Column("budget_approx", sa.Float),
        sa.Column("deadline", sa.Date),
        sa.Column("objective", sa.Text),
        sa.Column("description", sa.Text),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("parent_id", UUID, sa.ForeignKey("projects.id")),
        _ts("created_at"),
        _ts("updated_at"),
    )
    op.create_index("ix_projects_user_id", "projects", ["user_id"])

    op.create_table(
        "project_sections",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("project_id", UUID, sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("section_type", sa.String(50), nullable=False),
        sa.Column("content", sa.Text),
        sa.Column("generated_by", sa.String(50)),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        _ts("created_at"),
        _ts("updated_at"),
    )
    op.create_index("ix_project_sections_project_id", "project_sections", ["project_id"])

    op.create_table(
        "diagnostics",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("project_id", UUID, sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("overall_score", sa.Integer),
        sa.Column("scores_json", JSONB),
        sa.Column("strengths", JSONB),
        sa.Column("weaknesses", JSONB),
        sa.Column("risks", JSONB),
        sa.Column("edital_matches", JSONB),
        sa.Column("next_steps", JSONB),
        sa.Column("raw_response", sa.Text),
        sa.Column("provider", sa.String(50)),
        _ts("created_at"),
    )
    op.create_index("ix_diagnostics_project_id", "diagnostics", ["project_id"])

    op.create_table(
        "conversations",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("project_id", UUID, sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500)),
        _ts("created_at"),
        _ts("updated_at"),
    )
    op.create_index("ix_conversations_project_id", "conversations", ["project_id"])

    op.create_table(
        "messages",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("conversation_id", UUID, sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("provider", sa.String(50)),
        sa.Column("model", sa.String(100)),
        sa.Column("tokens_in", sa.Integer),
        sa.Column("tokens_out", sa.Integer),
        _ts("created_at"),
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])

    op.create_table(
        "editais",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500)),
        sa.Column("source_url", sa.Text),
        sa.Column("source_filename", sa.String(500)),
        sa.Column("raw_text", sa.Text),
        sa.Column("summary", sa.Text),
        sa.Column("eligibility", JSONB),
        sa.Column("deadline", sa.Date),
        sa.Column("max_value", sa.Float),
        sa.Column("requirements", JSONB),
        sa.Column("criteria", JSONB),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        _ts("created_at"),
    )
    op.create_index("ix_editais_user_id", "editais", ["user_id"])

    op.create_table(
        "edital_matches",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("edital_id", UUID, sa.ForeignKey("editais.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_id", UUID, sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("score", sa.Integer),
        sa.Column("strengths", JSONB),
        sa.Column("gaps", JSONB),
        _ts("created_at"),
    )
    op.create_index("ix_edital_matches_edital_id", "edital_matches", ["edital_id"])
    op.create_index("ix_edital_matches_project_id", "edital_matches", ["project_id"])


def downgrade() -> None:
    op.drop_table("edital_matches")
    op.drop_table("editais")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("diagnostics")
    op.drop_table("project_sections")
    op.drop_table("projects")
    op.drop_table("user_providers")
    op.drop_table("users")
