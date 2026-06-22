"""Diagnostic agent — qualitative Curador, grounded in project memory + domain."""
from sqlalchemy.ext.asyncio import AsyncSession

from ....models.user import User
from ....models.project import Project, ProjectSection, Diagnostic
from ..base import parse_json
from ..context import build_messages
from ..router import complete
from ..prompts import diagnostic as prompt


async def run(
    user: User,
    db: AsyncSession,
    project: Project,
    sections: list[ProjectSection],
) -> Diagnostic:
    messages = build_messages(
        prompt.ROLE, project, prompt.CONTRACT, prompt.build_sections(sections)
    )
    result = await complete(user, db, messages, json_mode=True, max_tokens=2500)
    data = parse_json(result.content)

    diag = Diagnostic(
        project_id=project.id,
        overall_band=data.get("overall_band"),
        summary=data.get("summary"),
        scores_json=data.get("dimensions"),
        strengths=data.get("strengths"),
        weaknesses=data.get("weaknesses"),
        risks=data.get("risks"),
        edital_matches=data.get("edital_matches"),
        next_steps=data.get("next_steps"),
        raw_response=result.content,
        provider=result.provider,
    )
    db.add(diag)
    await db.commit()
    await db.refresh(diag)
    return diag
