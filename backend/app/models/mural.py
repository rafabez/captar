import uuid
from datetime import datetime, date

from sqlalchemy import String, Text, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base


class MuralPost(Base):
    """An edital shared to the community mural — an independent snapshot.

    Decoupled from the user's personal `editais` row on purpose: deleting the
    personal edital must not remove the mural post, and vice versa.
    """
    __tablename__ = "mural_posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # Reference to the edital it was shared from, nulled if that edital is deleted.
    source_edital_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("editais.id", ondelete="SET NULL"), index=True
    )
    title: Mapped[str | None] = mapped_column(String(500))
    source_url: Mapped[str | None] = mapped_column(Text)
    source_filename: Mapped[str | None] = mapped_column(String(500))
    raw_text: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    eligibility: Mapped[dict | None] = mapped_column(JSONB)
    deadline: Mapped[date | None] = mapped_column(Date)
    max_value: Mapped[float | None] = mapped_column(Float)
    requirements: Mapped[list | None] = mapped_column(JSONB)
    criteria: Mapped[list | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
