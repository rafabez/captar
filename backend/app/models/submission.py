import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class Submission(Base):
    """A project adapted to a specific edital — the unit of work to apply.

    Project is the source of truth; the submission holds the edital-tailored copy:
    adherence analysis, a requirements checklist, and adapted sections.
    """
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    edital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("editais.id", ondelete="CASCADE"), index=True)
    title: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default="draft")
    adherence: Mapped[dict | None] = mapped_column(JSONB)   # {summary, strengths, gaps, adjustments}
    checklist: Mapped[list | None] = mapped_column(JSONB)   # [{item, done}]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sections: Mapped[list["SubmissionSection"]] = relationship(
        back_populates="submission", cascade="all, delete-orphan"
    )


class SubmissionSection(Base):
    __tablename__ = "submission_sections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("submissions.id", ondelete="CASCADE"), index=True)
    section_type: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    submission: Mapped["Submission"] = relationship(back_populates="sections")
