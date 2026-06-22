"""Section-writer agent — generates one project section (not persisted), memory-grounded."""
from sqlalchemy.ext.asyncio import AsyncSession

from ....models.user import User
from ....models.project import Project, ProjectSection
from ..base import ChatResult
from ..context import build_messages
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
    messages = build_messages(
        prompt.system(section_type, context),
        project,
        prompt.TASK,
        prompt.build_context(sections),
    )
    return await complete(user, db, messages, max_tokens=1500)
