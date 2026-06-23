"""Adherence agent — analyzes project × edital fit, stores it on the submission."""
from sqlalchemy.ext.asyncio import AsyncSession

from ....models.user import User
from ....models.project import Project, Edital
from ....models.submission import Submission
from ..base import parse_json
from ..context import build_messages
from ..router import complete
from ..prompts import adherence as prompt
from ..prompts.editalctx import edital_block


async def run(
    user: User, db: AsyncSession, submission: Submission, project: Project, edital: Edital
) -> dict:
    messages = build_messages(prompt.ROLE, project, prompt.CONTRACT, edital_block(edital))
    result = await complete(user, db, messages, json_mode=True, max_tokens=2000)
    data = parse_json(result.content)
    submission.adherence = {
        "summary": data.get("summary"),
        "strengths": data.get("strengths"),
        "gaps": data.get("gaps"),
        "adjustments": data.get("adjustments"),
    }
    await db.commit()
    return submission.adherence
