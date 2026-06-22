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


TASK = "Escreva agora a seção solicitada, coerente com a memória do projeto e com as seções já escritas."


def build_context(sections) -> str:
    """Other already-written sections, for coherence (project facts come from memory)."""
    if not sections:
        return ""
    out = ["## Seções já escritas (mantenha coerência)"]
    for s in sections:
        if s.content:
            out.append(f"### {s.section_type}\n{s.content}")
    return "\n".join(out)
