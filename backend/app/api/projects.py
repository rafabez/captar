import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.deps import require_user
from ..models.user import User
from ..models.project import Project, ProjectSection, Diagnostic, Conversation, Message
from fastapi import Response

from ..models.job import Job
from ..schemas import (
    ProjectCreate, ProjectUpdate, ProjectOut, PinsUpdate,
    SectionOut, SectionUpdate, SectionGenerateRequest,
    DiagnoseResponse, ExportRequest, JobOut,
    ConversationOut, MessageOut, MessageCreate,
)
from ..services import export_service
from ..workers.queue import get_pool

router = APIRouter(prefix="/projects", tags=["projects"])


async def _enqueue_brief(user_id, project_id) -> None:
    """Fire-and-forget refresh of the project's auto-derived memory brief."""
    pool = await get_pool()
    await pool.enqueue_job("run_brief_job", str(user_id), str(project_id))


# --- Projects ---

@router.get("", response_model=list[ProjectOut])
async def list_projects(
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .where(Project.user_id == current_user.id, Project.status != "archived")
        .order_by(Project.updated_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ProjectOut, status_code=201)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    project = Project(user_id=current_user.id, **data.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    await _enqueue_brief(current_user.id, project.id)
    return project


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return project


@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(project, key, val)
    await db.commit()
    await db.refresh(project)
    await _enqueue_brief(current_user.id, project.id)
    return project


@router.post("/{project_id}/brief", status_code=202)
async def refresh_brief(
    project_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually (re)generate the project's memory brief — useful for older projects."""
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    await _enqueue_brief(current_user.id, project_id)
    return {"status": "queued"}


@router.put("/{project_id}/pins", response_model=ProjectOut)
async def update_pins(
    project_id: uuid.UUID,
    data: PinsUpdate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    project.pins = [p.strip() for p in data.pins if p.strip()][:12]  # keep memory small
    await db.commit()
    await db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
async def archive_project(
    project_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    project.status = "archived"
    await db.commit()


# --- Sections ---

@router.get("/{project_id}/sections", response_model=list[SectionOut])
async def list_sections(
    project_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProjectSection)
        .join(Project)
        .where(ProjectSection.project_id == project_id, Project.user_id == current_user.id)
        .order_by(ProjectSection.section_type)
    )
    return result.scalars().all()


@router.get("/{project_id}/sections/{section_type}", response_model=SectionOut)
async def get_section(
    project_id: uuid.UUID,
    section_type: str,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProjectSection)
        .join(Project)
        .where(
            ProjectSection.project_id == project_id,
            ProjectSection.section_type == section_type,
            Project.user_id == current_user.id,
        )
        .order_by(ProjectSection.version.desc())
        .limit(1)
    )
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Seção não encontrada")
    return section


@router.put("/{project_id}/sections/{section_type}", response_model=SectionOut)
async def save_section(
    project_id: uuid.UUID,
    section_type: str,
    data: SectionUpdate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify project ownership
    proj = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    if not proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    section = ProjectSection(
        project_id=project_id,
        section_type=section_type,
        content=data.content,
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


@router.post("/{project_id}/sections/{section_type}/generate", response_model=JobOut, status_code=202)
async def generate_section(
    project_id: uuid.UUID,
    section_type: str,
    data: SectionGenerateRequest | None = None,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    proj = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    if proj.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    job = Job(user_id=current_user.id, kind="section")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    pool = await get_pool()
    await pool.enqueue_job(
        "run_section_job", str(job.id), str(current_user.id), str(project_id),
        section_type, data.context if data else None,
    )
    return job


# --- Diagnostics ---

@router.post("/{project_id}/diagnose", response_model=JobOut, status_code=202)
async def run_diagnostic(
    project_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    proj = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    if proj.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    job = Job(user_id=current_user.id, kind="diagnostic")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    pool = await get_pool()
    await pool.enqueue_job("run_diagnostic_job", str(job.id), str(current_user.id), str(project_id))
    return job


@router.get("/{project_id}/diagnostics", response_model=list[DiagnoseResponse])
async def list_diagnostics(
    project_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Diagnostic)
        .join(Project)
        .where(Diagnostic.project_id == project_id, Project.user_id == current_user.id)
        .order_by(Diagnostic.created_at.desc())
    )
    return [
        DiagnoseResponse(
            id=d.id,
            summary=d.summary,
            dimensions=d.scores_json,
            strengths=d.strengths,
            weaknesses=d.weaknesses,
            risks=d.risks,
            edital_matches=d.edital_matches,
            next_steps=d.next_steps,
            created_at=d.created_at,
        )
        for d in result.scalars().all()
    ]


# --- Export ---

@router.post("/{project_id}/export")
async def export_project(
    project_id: uuid.UUID,
    data: ExportRequest,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    proj = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = proj.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    # Latest content per section_type (sections are append-only versioned).
    secs = await db.execute(
        select(ProjectSection)
        .where(ProjectSection.project_id == project_id)
        .order_by(ProjectSection.version)
    )
    content_by_type: dict[str, str] = {}
    for s in secs.scalars().all():
        if s.content:
            content_by_type[s.section_type] = s.content

    fmt = (data.format or "docx").lower()
    if fmt not in ("docx", "pdf"):
        raise HTTPException(status_code=400, detail="Formato deve ser docx ou pdf")

    try:
        content, filename, media = export_service.build(
            project, content_by_type, fmt, data.sections
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:  # WeasyPrint native-lib failure, etc.
        raise HTTPException(status_code=500, detail=f"Falha ao gerar {fmt}: {e}")

    return Response(
        content=content,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# --- Conversations ---

@router.get("/{project_id}/conversations", response_model=list[ConversationOut])
async def list_conversations(
    project_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .join(Project)
        .where(Conversation.project_id == project_id, Project.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()


@router.post("/{project_id}/conversations", response_model=ConversationOut, status_code=201)
async def create_conversation(
    project_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    conv = Conversation(project_id=project_id, title="Nova conversa")
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.get("/{project_id}/conversations/{conv_id}/messages", response_model=list[MessageOut])
async def list_messages(
    project_id: uuid.UUID,
    conv_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message)
        .join(Conversation)
        .join(Project)
        .where(
            Message.conversation_id == conv_id,
            Conversation.project_id == project_id,
            Project.user_id == current_user.id,
        )
        .order_by(Message.created_at)
    )
    return result.scalars().all()


@router.post("/{project_id}/conversations/{conv_id}/messages", response_model=MessageOut, status_code=201)
async def send_message(
    project_id: uuid.UUID,
    conv_id: uuid.UUID,
    data: MessageCreate,
    current_user: User = Depends(require_user),
):
    # TODO: Implement AI chat with context
    return {"status": "not_implemented", "message": "Chat será implementado na Fase 1"}
