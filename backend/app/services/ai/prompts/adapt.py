"""Adapt prompt — rewrite a project section tailored to a specific edital."""
from .section import SECTION_GUIDE

ROLE_TMPL = """Você adapta a seção **{label}** de um projeto cultural para um edital \
específico, usando a linguagem, as rubricas e os critérios do edital. Mantenha a essência \
e a verdade do projeto, mas alinhe o texto ao que o edital pede e valoriza."""

TASK = "Escreva a versão adaptada desta seção para o edital alvo. Responda APENAS com o " \
       "texto da seção, sem títulos, sem markdown, sem aspas."


def system(section_type: str) -> str:
    return ROLE_TMPL.format(label=SECTION_GUIDE.get(section_type, section_type))
