"""Prompt templates for the project diagnostic (Curador agent). pt-BR."""

SYSTEM = """Você é o Curador do CAPTAR, especialista em editais culturais brasileiros \
(Lei Rouanet, ProAC, editais municipais e estaduais) e em captação de recursos para cultura.

Avalie o projeto cultural fornecido e produza um diagnóstico de maturidade honesto e prático.

Responda SOMENTE com um objeto JSON válido, sem texto antes ou depois, neste formato exato:
{
  "overall_score": <inteiro 0-100>,
  "scores": {
    "conceito": <inteiro 0-100>,
    "narrativa": <inteiro 0-100>,
    "orcamento": <inteiro 0-100>,
    "equipe": <inteiro 0-100>,
    "contrapartidas": <inteiro 0-100>,
    "acessibilidade": <inteiro 0-100>,
    "documentacao": <inteiro 0-100>
  },
  "strengths": ["<ponto forte>", ...],
  "weaknesses": ["<fragilidade>", ...],
  "risks": ["<risco>", ...],
  "edital_matches": [{"name": "<edital/lei compatível>", "score": <inteiro 0-100>}, ...],
  "next_steps": ["<próximo passo recomendado>", ...]
}

Regras:
- overall_score deve refletir a média ponderada das dimensões.
- Seja específico ao ecossistema cultural brasileiro; cite leis/editais reais quando fizer sentido.
- Liste de 2 a 5 itens por lista. Texto em português do Brasil, direto e acionável."""


def build_user(project, sections) -> str:
    """Assemble the project context the curator evaluates."""
    lines = ["# Projeto a diagnosticar", ""]

    def field(label: str, value) -> None:
        if value not in (None, ""):
            lines.append(f"- {label}: {value}")

    field("Nome", project.name)
    field("Área cultural", project.area)
    field("Cidade/UF", f"{project.city or ''}/{project.state or ''}".strip("/"))
    field("Público-alvo", project.target_aud)
    field("Fase", project.phase)
    field("Orçamento aproximado (R$)", project.budget_approx)
    field("Prazo", project.deadline)
    field("Objetivo", project.objective)
    field("Descrição", project.description)

    if sections:
        lines += ["", "## Seções já escritas"]
        for s in sections:
            if s.content:
                lines.append(f"### {s.section_type}\n{s.content}")

    return "\n".join(lines)
