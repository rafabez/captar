"""Chat agent — free conversation about a project, grounded in its memory."""
from sqlalchemy.ext.asyncio import AsyncSession

from ....models.user import User
from ....models.project import Project, Message
from ..base import ChatMessage
from ..context import memory_block
from ..prompts import domain
from ..prompts.chat import ROLE
from ..router import complete


async def run(
    user: User, db: AsyncSession, project: Project, history: list[Message], content: str
) -> str:
    system = f"{domain.BASE}\n\n{ROLE}\n\n# Memória do projeto\n{memory_block(project)}"
    messages = [ChatMessage("system", system)]
    for m in history:
        messages.append(ChatMessage(m.role, m.content))
    messages.append(ChatMessage("user", content))
    result = await complete(user, db, messages, max_tokens=1200)
    return result.content
