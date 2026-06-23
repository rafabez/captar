"""Adapt agent — generates an edital-tailored version of a project section."""
from sqlalchemy.ext.asyncio import AsyncSession

from ....models.user import User
from ....models.project import Project, Edital
from ..base import ChatResult
from ..context import build_messages
from ..router import complete
from ..prompts import adapt as prompt
from ..prompts.editalctx import edital_block


async def run(
    user: User,
    db: AsyncSession,
    project: Project,
    edital: Edital,
    section_type: str,
    base_content: str | None,
) -> ChatResult:
    extra = edital_block(edital)
    if base_content:
        extra += f"\n\n## Versão atual da seção (base a adaptar)\n{base_content}"
    messages = build_messages(prompt.system(section_type), project, prompt.TASK, extra)
    return await complete(user, db, messages, max_tokens=1500)
