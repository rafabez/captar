import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.deps import require_user
from ..models.user import User
from ..models.project import Project, Edital
from ..models.submission import Submission, SubmissionSection
from ..models.job import Job
from ..schemas import (
    SubmissionCreate, SubmissionOut, ChecklistUpdate,
    SubmissionSectionOut, SectionUpdate, JobOut,
)
from ..workers.queue import get_pool

router = APIRouter(prefix="/submissions", tags=["submissions"])


def _out(sub: Submission, edital: Edital | None = None) -> SubmissionOut:
    return SubmissionOut(
        id=sub.id,
        project_id=sub.project_id,
        edital_id=sub.edital_id,
        title=sub.title,
        status=sub.status,
        adherence=sub.adherence,
        checklist=sub.checklist,
        edital_title=edital.title if edital else None,
        deadline=edital.deadline if edital else None,
        created_at=sub.created_at,
    )


async def _owned(submission_id: uuid.UUID, user: User, db: AsyncSession) -> Submission:
    sub = await db.get(Submission, submission_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(status_code=404, detail="Submissão não encontrada")
    return sub


@router.post("", response_model=SubmissionOut, status_code=201)
async def create_submission(
    data: SubmissionCreate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, data.project_id)
    edital = await db.get(Edital, data.edital_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    if not edital or edital.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Edital não encontrado")

    checklist = [{"item": r, "done": False} for r in (edital.requirements or []) if r]
    sub = Submission(
        user_id=current_user.id,
        project_id=project.id,
        edital_id=edital.id,
        title=f"{project.name} × {edital.title or 'edital'}",
        checklist=checklist,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return _out(sub, edital)


@router.get("", response_model=list[SubmissionOut])
async def list_submissions(
    project_id: uuid.UUID | None = None,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Submission, Edital).join(Edital, Submission.edital_id == Edital.id).where(
        Submission.user_id == current_user.id
    )
    if project_id:
        query = query.where(Submission.project_id == project_id)
    query = query.order_by(Submission.created_at.desc())
    rows = (await db.execute(query)).all()
    return [_out(sub, edital) for sub, edital in rows]


@router.get("/{submission_id}", response_model=SubmissionOut)
async def get_submission(
    submission_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    sub = await _owned(submission_id, current_user, db)
    edital = await db.get(Edital, sub.edital_id)
    return _out(sub, edital)


@router.delete("/{submission_id}", status_code=204)
async def delete_submission(
    submission_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    sub = await _owned(submission_id, current_user, db)
    await db.delete(sub)
    await db.commit()


@router.post("/{submission_id}/analyze", response_model=JobOut, status_code=202)
async def analyze_adherence(
    submission_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    await _owned(submission_id, current_user, db)
    job = Job(user_id=current_user.id, kind="adherence")
    db.add(job)
    await db.commit()
    await db.refresh(job)
    pool = await get_pool()
    await pool.enqueue_job("run_adherence_job", str(job.id), str(current_user.id), str(submission_id))
    return job


@router.put("/{submission_id}/checklist", response_model=SubmissionOut)
async def update_checklist(
    submission_id: uuid.UUID,
    data: ChecklistUpdate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    sub = await _owned(submission_id, current_user, db)
    sub.checklist = data.checklist
    await db.commit()
    await db.refresh(sub)
    edital = await db.get(Edital, sub.edital_id)
    return _out(sub, edital)


@router.get("/{submission_id}/sections", response_model=list[SubmissionSectionOut])
async def list_sub_sections(
    submission_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    await _owned(submission_id, current_user, db)
    result = await db.execute(
        select(SubmissionSection)
        .where(SubmissionSection.submission_id == submission_id)
        .order_by(SubmissionSection.section_type)
    )
    return result.scalars().all()


@router.get("/{submission_id}/sections/{section_type}", response_model=SubmissionSectionOut)
async def get_sub_section(
    submission_id: uuid.UUID,
    section_type: str,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    await _owned(submission_id, current_user, db)
    result = await db.execute(
        select(SubmissionSection).where(
            SubmissionSection.submission_id == submission_id,
            SubmissionSection.section_type == section_type,
        )
    )
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Seção não encontrada")
    return section


@router.put("/{submission_id}/sections/{section_type}", response_model=SubmissionSectionOut)
async def save_sub_section(
    submission_id: uuid.UUID,
    section_type: str,
    data: SectionUpdate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    await _owned(submission_id, current_user, db)
    result = await db.execute(
        select(SubmissionSection).where(
            SubmissionSection.submission_id == submission_id,
            SubmissionSection.section_type == section_type,
        )
    )
    section = result.scalar_one_or_none()
    if section:
        section.content = data.content
    else:
        section = SubmissionSection(
            submission_id=submission_id, section_type=section_type, content=data.content
        )
        db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


@router.post("/{submission_id}/sections/{section_type}/adapt", response_model=JobOut, status_code=202)
async def adapt_sub_section(
    submission_id: uuid.UUID,
    section_type: str,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    await _owned(submission_id, current_user, db)
    job = Job(user_id=current_user.id, kind="adapt")
    db.add(job)
    await db.commit()
    await db.refresh(job)
    pool = await get_pool()
    await pool.enqueue_job(
        "run_adapt_job", str(job.id), str(current_user.id), str(submission_id), section_type
    )
    return job
