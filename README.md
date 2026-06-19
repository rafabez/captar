# CAPTAR

> **Do rascunho ao recurso.**
> Plataforma de IA para artistas e produtores culturais criarem, diagnosticarem, adaptarem e exportarem projetos para editais, leis de incentivo e patrocínio.

**Domínio:** captar.ia.br

---

## O que é CAPTAR

CAPTAR é uma plataforma vertical SaaS para o ecossistema cultural brasileiro. Não é um chatbot — é uma ferramenta de trabalho onde o usuário constrói um projeto cultural completo, da ideia inicial até o documento pronto para submissão.

### Diferenciais

- **Não é chat — é plataforma.** Projeto salvo, versionado, editável.
- **BYOK** — usuário conecta sua própria chave de IA. CAPTAR não paga tokens.
- **Especialistas IA internos** — múltiplos agentes por função (curador, orçamentista, captador).
- **Projeto Score** — diagnóstico visual de maturidade.
- **Radar de editais** — alertas de oportunidades compatíveis.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | FastAPI (Python 3.12) + SQLAlchemy 2.0 |
| Banco | PostgreSQL 16 |
| Cache/Fila | Redis 7 + ARQ |
| Proxy | Traefik 3 + Let's Encrypt |
| Deploy | Docker Compose |
| IA | OpenAI / Anthropic / Gemini / Ollama (BYOK) |
| PDF | PyMuPDF + marker-pdf |
| Export | python-docx + WeasyPrint |

---

## Roadmap

- **Fase 0** (Semanas 1-2): Setup, scaffold, CI/CD, deploy inicial
- **Fase 1** (Semanas 3-6): MVP Core — dashboard, projeto, diagnóstico, chat, edital, export
- **Fase 2** (Semanas 7-10): Polimento, planos, Mercado Pago, landing, SEO
- **Fase 3** (Semanas 11-18): MVP V2 — orçamento, cronograma, match editais, versionamento
- **Fase 4** (Mês 4-9): Captação, CRM patrocinadores, white-label, API pública
- **Fase 5** (Mês 10-18): Prestação de contas, impacto, integrações gov

---

## Especificação completa

Ver [SPEC.md](SPEC.md) — telas, fluxos, banco de dados, arquitetura, API endpoints, copy da landing, identidade visual, plano de deploy.
