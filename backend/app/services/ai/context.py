"""Single place that assembles AI prompts with project memory + domain knowledge.

Every agent builds its messages here so the model is always grounded in (1) the
domain base, and (2) THIS project's persistent memory — the CAPTAR moat. Memory is
kept small on purpose: the compact `brief` + a few user `pins`, never the raw dump.
"""
from .base import ChatMessage
from .prompts import domain


def memory_block(project) -> str:
    """Compact, always-injected project context: brief + pins, with a raw fallback."""
    lines: list[str] = ["# Projeto (memória)"]

    if project.brief:
        lines.append(project.brief.strip())
    else:
        # No auto-brief yet — fall back to the core structured fields (still small).
        for label, value in (
            ("Nome", project.name),
            ("Área", project.area),
            ("Cidade/UF", f"{project.city or ''}/{project.state or ''}".strip("/")),
            ("Objetivo", project.objective),
            ("Descrição", (project.description or "")[:600]),
        ):
            if value:
                lines.append(f"- {label}: {value}")

    pins = project.pins or []
    if pins:
        lines.append("\n## Fatos fixados pelo usuário")
        lines += [f"- {p}" for p in pins if p]

    return "\n".join(lines)


def build_messages(
    role: str,
    project,
    task: str,
    extra: str | None = None,
) -> list[ChatMessage]:
    """[domain base + role] as system; [project memory + task (+ extra)] as user."""
    system = f"{domain.BASE}\n\n{role}"
    user = f"{memory_block(project)}\n\n{task}"
    if extra:
        user += f"\n\n{extra}"
    return [ChatMessage("system", system), ChatMessage("user", user)]
