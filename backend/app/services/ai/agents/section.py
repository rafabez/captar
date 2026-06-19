"""Section-writer agent — generates a single project section (not persisted)."""
from sqlalchemy.ext.asyncio import AsyncSession

from ....models.user import User
from ....models.project import Project, ProjectSection
from ..base import ChatMessage, ChatResult
from ..router import complete
from ..prompts import section as prompt


async def run(
    user: User,
    db: AsyncSession,
    project: Project,
    sections: list[ProjectSection],
    section_type: str,
    context: str | None,
) -> ChatResult:
    messages = [
        ChatMessage("system", prompt.system(section_type, context)),
        ChatMessage("user", prompt.build_user(project, sections)),
    ]
    return await complete(user, db, messages, max_tokens=1500)
