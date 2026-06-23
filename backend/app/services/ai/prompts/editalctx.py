"""Compact edital context block, reused by adherence + adapt prompts."""


def edital_block(edital) -> str:
    lines = ["# Edital alvo", ""]

    def field(label, value):
        if value not in (None, ""):
            lines.append(f"- {label}: {value}")

    field("Título", edital.title)
    field("Prazo", edital.deadline)
    field("Valor máximo (R$)", edital.max_value)
    field("Resumo", edital.summary)

    if edital.requirements:
        lines.append("\n## Requisitos/documentos exigidos")
        lines += [f"- {r}" for r in edital.requirements if r]
    if edital.criteria:
        lines.append("\n## Critérios de avaliação")
        lines += [f"- {c}" for c in edital.criteria if c]

    return "\n".join(lines)
