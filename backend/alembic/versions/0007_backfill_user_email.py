"""backfill empty user emails with per-user placeholders

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-08

Clerk's default session token has no email claim, so users were created with
email="" — which collides on the UNIQUE index as soon as a 2nd user signs in.
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE users SET email = clerk_id || '@users.captar' WHERE email = ''"
    )


def downgrade() -> None:
    pass  # data backfill; not reversible
