"""Diagnostic prompt — qualitative bands + narrative (no fake numeric score)."""

ROLE = """Você está fazendo um diagnóstico de maturidade de um projeto cultural para \
submissão a editais e leis de incentivo. Avalie honestamente, com base na memória do \
projeto fornecida abaixo. Aponte forças e fragilidades reais e o caminho recomendado."""

CONTRACT = """Produza o diagnóstico e responda SOMENTE com um objeto JSON válido, sem \
texto antes ou depois, neste formato:
{
  "overall_band": "solido | atencao | fragil",
  "summary": "<2 a 4 parágrafos em PROSA corrida: leitura geral honesta do projeto — o \
que está forte, o que precisa amadurecer e o caminho recomendado. Cite elementos \
concretos do projeto. NÃO use bullets aqui.>",
  "dimensions": {
    "conceito": "solido | atencao | fragil",
    "narrativa": "solido | atencao | fragil",
    "orcamento": "solido | atencao | fragil",
    "equipe": "solido | atencao | fragil",
    "contrapartidas": "solido | atencao | fragil",
    "acessibilidade": "solido | atencao | fragil",
    "documentacao": "solido | atencao | fragil"
  },
  "strengths": ["<ponto forte concreto>", ...],
  "weaknesses": ["<fragilidade concreta>", ...],
  "risks": ["<risco>", ...],
  "edital_matches": [{"name": "<edital ou lei compatível>", "note": "<por que combina>"}, ...],
  "next_steps": ["<próximo passo recomendado>", ...]
}

Bandas: "solido" = bem resolvido; "atencao" = precisa melhorar; "fragil" = gargalo sério.
NÃO use notas numéricas nem percentuais — apenas as bandas e a prosa. O "summary" deve ter \
texto real e específico. 3 a 5 itens por lista. Português do Brasil."""


def build_sections(sections) -> str:
    if not sections:
        return ""
    out = ["## Seções já escritas pelo usuário"]
    for s in sections:
        if s.content:
            out.append(f"### {s.section_type}\n{s.content}")
    return "\n".join(out)
