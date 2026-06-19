"""Edital analysis agent — parses PDF text into a structured Edital row."""
from datetime import date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from ....models.user import User
from ....models.project import Edital
from ..base import ChatMessage, parse_json
from ..router import complete
from ..prompts import edital as prompt


def _parse_date(value) -> date | None:
    if not value or not isinstance(value, str):
        return None
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def _parse_float(value) -> float | None:
    return float(value) if isinstance(value, (int, float)) else None


async def run(
    user: User,
    db: AsyncSession,
    raw_text: str,
    *,
    filename: str | None = None,
    source_url: str | None = None,
) -> Edital:
    messages = [
        ChatMessage("system", prompt.SYSTEM),
        ChatMessage("user", prompt.build_user(raw_text)),
    ]
    result = await complete(user, db, messages, json_mode=True, max_tokens=2000)
    data = parse_json(result.content)

    edital = Edital(
        user_id=user.id,
        title=data.get("title") or filename or source_url,
        source_filename=filename,
        source_url=source_url,
        raw_text=raw_text,
        summary=data.get("summary"),
        eligibility=data.get("eligibility"),
        deadline=_parse_date(data.get("deadline")),
        max_value=_parse_float(data.get("max_value")),
        requirements=data.get("requirements"),
        criteria=data.get("criteria"),
        status="open",
    )
    db.add(edital)
    await db.commit()
    await db.refresh(edital)
    return edital
