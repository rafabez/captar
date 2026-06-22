"""Brief agent — derives the compact project memory and stores it on the project."""
from sqlalchemy.ext.asyncio import AsyncSession

from ....models.user import User
from ....models.project import Project, ProjectSection
from ..base import ChatMessage
from ..router import complete
from ..prompts import brief as prompt

MAX_BRIEF_CHARS = 1500  # hard cap so memory stays small


async def run(
    user: User, db: AsyncSession, project: Project, sections: list[ProjectSection]
) -> str:
    messages = [
        ChatMessage("system", prompt.ROLE),
        ChatMessage("user", prompt.build_user(project, sections)),
    ]
    result = await complete(user, db, messages, max_tokens=400)
    project.brief = result.content.strip()[:MAX_BRIEF_CHARS]
    await db.commit()
    return project.brief
