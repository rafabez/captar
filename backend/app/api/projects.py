import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.deps import require_user
from ..models.user import User
from ..models.project import Project, ProjectSection, Diagnostic, Conversation, Message
from ..schemas import (
    ProjectCreate, ProjectUpdate, ProjectOut,
    SectionOut, SectionUpdate, SectionGenerateRequest, SectionDraft,
    DiagnoseResponse,
    ConversationOut, MessageOut, MessageCreate,
)
from ..services.ai import ProviderError
from ..services.ai.agents import diagnostic as diagnostic_agent
from ..services.ai.agents import section as section_agent

router = APIRouter(prefix="/projects", tags=["projects"])


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


@router.post("/{project_id}/sections/{section_type}/generate", response_model=SectionDraft)
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
    project = proj.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    secs = await db.execute(
        select(ProjectSection).where(ProjectSection.project_id == project_id)
    )
    sections = list(secs.scalars().all())

    try:
        result = await section_agent.run(
            current_user, db, project, sections, section_type,
            data.context if data else None,
        )
    except ProviderError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return SectionDraft(
        section_type=section_type, content=result.content, generated_by=result.provider
    )


# --- Diagnostics ---

@router.post("/{project_id}/diagnose", response_model=DiagnoseResponse)
async def run_diagnostic(
    project_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    proj = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = proj.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    secs = await db.execute(
        select(ProjectSection).where(ProjectSection.project_id == project_id)
    )
    sections = list(secs.scalars().all())

    try:
        diag = await diagnostic_agent.run(current_user, db, project, sections)
    except ProviderError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return DiagnoseResponse(
        id=diag.id,
        overall_score=diag.overall_score,
        scores=diag.scores_json,
        strengths=diag.strengths,
        weaknesses=diag.weaknesses,
        risks=diag.risks,
        edital_matches=diag.edital_matches,
        next_steps=diag.next_steps,
        created_at=diag.created_at,
    )


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
            overall_score=d.overall_score,
            scores=d.scores_json,
            strengths=d.strengths,
            weaknesses=d.weaknesses,
            risks=d.risks,
            edital_matches=d.edital_matches,
            next_steps=d.next_steps,
            created_at=d.created_at,
        )
        for d in result.scalars().all()
    ]


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
