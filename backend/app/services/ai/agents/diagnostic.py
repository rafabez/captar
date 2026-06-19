"""Diagnostic agent — runs the Curador, persists a Diagnostic row."""
from sqlalchemy.ext.asyncio import AsyncSession

from ....models.user import User
from ....models.project import Project, ProjectSection, Diagnostic
from ..base import ChatMessage, parse_json
from ..router import complete
from ..prompts import diagnostic as prompt


async def run(
    user: User,
    db: AsyncSession,
    project: Project,
    sections: list[ProjectSection],
) -> Diagnostic:
    messages = [
        ChatMessage("system", prompt.SYSTEM),
        ChatMessage("user", prompt.build_user(project, sections)),
    ]
    result = await complete(user, db, messages, json_mode=True, max_tokens=2000)
    data = parse_json(result.content)

    diag = Diagnostic(
        project_id=project.id,
        overall_score=data.get("overall_score"),
        scores_json=data.get("scores"),
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
