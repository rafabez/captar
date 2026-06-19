"""Prompt templates for generating project sections. pt-BR."""

# section_type -> human label + what the section should contain
SECTION_GUIDE: dict[str, str] = {
    "summary": "Resumo do projeto — apresentação geral em um parágrafo",
    "justification": "Justificativa — relevância cultural, social e artística; por que merece apoio",
    "objectives": "Objetivos — objetivo geral seguido de objetivos específicos",
    "target_audience": "Público-alvo — quem será atingido, perfil e estimativa de alcance",
    "accessibility": "Acessibilidade — medidas física, comunicacional e atitudinal",
    "counterparts": "Contrapartidas — ações sociais/culturais oferecidas em troca do apoio",
    "schedule": "Cronograma — etapas de execução e prazos",
    "team": "Equipe — funções e qualificações dos envolvidos",
    "communication": "Comunicação — plano de divulgação e estratégia de mídia",
    "budget": "Orçamento — principais rubricas e justificativa dos custos",
}

SYSTEM = """Você é redator especialista em projetos culturais brasileiros e domina a \
linguagem técnica de editais (Lei Rouanet, ProAC, editais municipais e estaduais).

Escreva a seção **{label}** do projeto cultural fornecido, em português do Brasil, \
com linguagem técnica de edital, pronta para submissão.{context_hint}

Responda APENAS com o texto da seção — sem títulos em markdown, sem comentários, \
sem aspas em volta."""


def system(section_type: str, context: str | None) -> str:
    label = SECTION_GUIDE.get(section_type, section_type)
    hint = f" Adapte ao contexto de: {context}." if context else ""
    return SYSTEM.format(label=label, context_hint=hint)


def build_user(project, sections) -> str:
    lines = ["# Dados do projeto", ""]

    def field(lbl: str, value) -> None:
        if value not in (None, ""):
            lines.append(f"- {lbl}: {value}")

    field("Nome", project.name)
    field("Área", project.area)
    field("Cidade/UF", f"{project.city or ''}/{project.state or ''}".strip("/"))
    field("Público-alvo", project.target_aud)
    field("Orçamento aproximado (R$)", project.budget_approx)
    field("Objetivo", project.objective)
    field("Descrição", project.description)

    if sections:
        lines += ["", "## Seções já escritas (para manter coerência)"]
        for s in sections:
            if s.content:
                lines.append(f"### {s.section_type}\n{s.content}")

    return "\n".join(lines)
