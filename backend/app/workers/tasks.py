"""ARQ task functions — run AI agents off the request, write results to Job rows."""
import uuid

from sqlalchemy import select

from ..core.database import async_session
from ..models.job import Job
from ..models.user import User
from ..models.project import Project, ProjectSection
from ..services.ai import ProviderError
from ..services.ai.agents import diagnostic as diagnostic_agent
from ..services.ai.agents import edital as edital_agent
from ..services.ai.agents import section as section_agent


async def _set(job_id: str, **fields) -> None:
    async with async_session() as db:
        job = await db.get(Job, uuid.UUID(job_id))
        if job is None:
            return
        for k, v in fields.items():
            setattr(job, k, v)
        await db.commit()


def _iso(d):
    return d.isoformat() if d else None


async def run_diagnostic_job(ctx, job_id: str, user_id: str, project_id: str) -> None:
    await _set(job_id, status="running")
    try:
        async with async_session() as db:
            user = await db.get(User, uuid.UUID(user_id))
            project = await db.get(Project, uuid.UUID(project_id))
            secs = (await db.execute(
                select(ProjectSection).where(ProjectSection.project_id == uuid.UUID(project_id))
            )).scalars().all()
            diag = await diagnostic_agent.run(user, db, project, list(secs))
            result = {
                "id": str(diag.id),
                "overall_score": diag.overall_score,
                "scores": diag.scores_json,
                "strengths": diag.strengths,
                "weaknesses": diag.weaknesses,
                "risks": diag.risks,
                "edital_matches": diag.edital_matches,
                "next_steps": diag.next_steps,
            }
        await _set(job_id, status="done", result=result)
    except ProviderError as e:
        await _set(job_id, status="error", error=str(e))
    except Exception as e:  # noqa: BLE001
        await _set(job_id, status="error", error=str(e))


async def run_edital_job(ctx, job_id: str, user_id: str, raw_text: str,
                         filename: str | None, source_url: str | None) -> None:
    await _set(job_id, status="running")
    try:
        async with async_session() as db:
            user = await db.get(User, uuid.UUID(user_id))
            ed = await edital_agent.run(user, db, raw_text, filename=filename, source_url=source_url)
            result = {
                "id": str(ed.id),
                "title": ed.title,
                "summary": ed.summary,
                "eligibility": ed.eligibility,
                "deadline": _iso(ed.deadline),
                "max_value": ed.max_value,
                "requirements": ed.requirements,
                "criteria": ed.criteria,
                "status": ed.status,
                "created_at": _iso(ed.created_at),
            }
        await _set(job_id, status="done", result=result)
    except ProviderError as e:
        await _set(job_id, status="error", error=str(e))
    except Exception as e:  # noqa: BLE001
        await _set(job_id, status="error", error=str(e))


async def run_section_job(ctx, job_id: str, user_id: str, project_id: str,
                          section_type: str, context: str | None) -> None:
    await _set(job_id, status="running")
    try:
        async with async_session() as db:
            user = await db.get(User, uuid.UUID(user_id))
            project = await db.get(Project, uuid.UUID(project_id))
            secs = (await db.execute(
                select(ProjectSection).where(ProjectSection.project_id == uuid.UUID(project_id))
            )).scalars().all()
            res = await section_agent.run(user, db, project, list(secs), section_type, context)
            result = {"section_type": section_type, "content": res.content, "generated_by": res.provider}
        await _set(job_id, status="done", result=result)
    except ProviderError as e:
        await _set(job_id, status="error", error=str(e))
    except Exception as e:  # noqa: BLE001
        await _set(job_id, status="error", error=str(e))
