"""Prompt for generating the compact project brief (the always-injected memory)."""

ROLE = """Você resume projetos culturais em um briefing curto e objetivo, que servirá \
de memória do projeto para análises futuras. Português do Brasil, técnico e factual. \
Não invente informação que não esteja nos dados."""

TASK = """Escreva um briefing de NO MÁXIMO 150 palavras, em prosa corrida, cobrindo: \
do que se trata, área cultural, objetivo, público-alvo, fase e o diferencial do projeto. \
Responda apenas com o texto do briefing, sem títulos, sem markdown, sem aspas."""


def build_user(project, sections) -> str:
    lines = ["# Dados do projeto", ""]

    def field(label, value):
        if value not in (None, ""):
            lines.append(f"- {label}: {value}")

    field("Nome", project.name)
    field("Área", project.area)
    field("Cidade/UF", f"{project.city or ''}/{project.state or ''}".strip("/"))
    field("Público-alvo", project.target_aud)
    field("Fase", project.phase)
    field("Orçamento aproximado (R$)", project.budget_approx)
    field("Objetivo", project.objective)
    field("Descrição", project.description)

    if sections:
        lines.append("\n## Seções escritas")
        for s in sections:
            if s.content:
                lines.append(f"### {s.section_type}\n{s.content[:800]}")

    return f"{chr(10).join(lines)}\n\n{TASK}"
