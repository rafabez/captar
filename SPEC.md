# CAPTAR — Especificação Completa do MVP

> **CAPTAR — do rascunho ao recurso.**
> Plataforma de IA para artistas e produtores culturais criarem, diagnosticarem, adaptarem e exportarem projetos para editais, leis de incentivo e patrocínio.

**Domínio:** captar.ia.br
**Status:** Especificação MVP v1.0
**Data:** Junho 2026

---

## 1. Visão Geral

### 1.1 O que é CAPTAR

CAPTAR é uma plataforma vertical SaaS para o ecossistema cultural brasileiro. Diferente de um chatbot genérico, é uma **ferramenta de trabalho** onde o usuário constrói um projeto cultural completo — da ideia inicial até o documento pronto para submissão em edital ou apresentação para patrocinador.

### 1.2 O problema que resolve

| DOR | SOLUÇÃO CAPTAR |
|-----|----------------|
| Artista não sabe "falar editalês" | IA gera narrativa, justificativa, objetivos em linguagem técnica |
| Não sabe qual edital serve para seu projeto | Diagnóstico + match automático com editais |
| Não sabe montar orçamento | Orçamento inteligente com rubricas, auditoria e alertas |
| Perde horas lendo editais enormes | Upload de PDF → resumo, checklist e análise em segundos |
| Reescreve projeto para cada edital | Adaptador automático: mesmo projeto, versão para cada edital |
| Depende de consultor caro | IA resolve 80%, consultoria humana opcional para os 20% |
| Medo de errar na submissão | Checklist dinâmico de documentos e requisitos |
| Não sabe abordar patrocinador | Gerador de pitch, deck, email e CRM de captação |

### 1.3 Diferenciais centrais

1. **Não é chat — é plataforma.** Projeto salvo, versionado, editável.
2. **BYOK** — usuário conecta sua própria chave OpenAI/Claude/modelo local. CAPTAR não paga tokens.
3. **Especialistas IA internos** — múltiplos agentes por função (curador, orçamentista, captador, etc).
4. **Projeto Score** — diagnóstico visual de maturidade do projeto.
5. **Radar de editais** — notificações de oportunidades compatíveis.

---

## 2. Público-Alvo & Personas

### 2.1 Persona 1: Artista Independente (Free / Individual)
- Tem ideia mas zero experiência com editais
- Precisa de wizard guiado, linguagem simples
- Valor: diagnóstico + geração de primeira versão

### 2.2 Persona 2: Produtor Cultural (Profissional)
- Já submete projetos, quer escalar
- Precisa de workspace, versionamento, orçamento, exportação
- Valor: adaptação para múltiplos editais, economia de tempo

### 2.3 Persona 3: Estúdio/Produtora (Studio)
- Múltiplos projetos e clientes simultâneos
- Precisa de multiusuário, CRM de patrocinadores, dashboard
- Valor: padronização, pipeline, escala

### 2.4 Persona 4: Instituição/Coletivo (Studio)
- ONGs, museus, pontos de cultura
- Prestação de contas, impacto social, indicadores
- Valor: relatórios, compliance, ciclo completo

---

## 3. Módulos do Produto

### MVP V1 (3 meses)
```
M1 — Auth & Onboarding
M2 — Dashboard
M3 — Projeto (criar, salvar, editar)
M4 — Diagnóstico IA
M5 — Chat contextual por projeto
M6 — Upload + Análise de Edital (PDF)
M7 — Geração de seções (justificativa, objetivos, público, contrapartidas)
M8 — Exportação DOCX/PDF
M9 — Sistema de créditos/planos
```

### MVP V2 (+3 meses)
```
M10 — Orçamento Inteligente
M11 — Cronograma físico-financeiro
M12 — Match Projeto × Edital
M13 — Biblioteca de Editais
M14 — Versionamento de projetos
M15 — Histórico completo
```

### V3 (+6 meses)
```
M16 — Captação & Patrocinadores (CRM, pitch, email)
M17 — Colaboração multiusuário
M18 — Marketplace de consultoria humana
M19 — White-label para estúdios
```

### V4 (+12 meses)
```
M20 — Pós-aprovação & Prestação de contas
M21 — Relatórios de impacto
M22 — Integrações (formulários gov, APIs)
M23 — Automações, lembretes, alertas de prazo
```

---

## 4. Telas (MVP V1)

### 4.1 Landing Page (`/`)
- Hero: headline + CTA + 3 cards de features
- Seção "Como funciona" (3 passos)
- Diferenciais (BYOK, Projeto Score, Adaptação, Brasil)
- Pricing (Free / Individual / Profissional / Studio)
- FAQ
- Footer

### 4.2 Login / Cadastro (`/auth`)
- Email + senha
- Ou continuar com Google
- Link "Esqueci minha senha"

### 4.3 Dashboard (`/dashboard`)
- Lista de projetos em cards (nome, área, score, última edição)
- Botão "+ Novo Projeto"
- Seção "Oportunidades" (editais compatíveis)
- Header com navegação: Projetos | Editais | Config

### 4.4 Criar Projeto — Wizard (`/project/new`)
- Passo 1: info básica (nome, área, cidade, fase, orçamento, prazo)
- Passo 2: descrição do projeto (textarea + upload opcional)
- Passo 3: editais-alvo (checkboxes: Lei Rouanet, ProAC, municipal...)

### 4.5 Workspace do Projeto (`/project/:id`)
- **Sidebar:** Resumo, Diagnóstico, Seções (sub-itens), Chat, Docs, Exportar
- **Área principal:** conteúdo da aba ativa
- **Header:** nome do projeto, voltar, ações

### 4.6 Tela de Diagnóstico (`/project/:id` > aba Diagnóstico)
- Score circular (0-100%)
- Barras por dimensão (conceito, narrativa, orçamento, equipe, contrapartidas, acessibilidade, docs)
- Pontos fortes (✅) e fragilidades (🔴)
- Editais compatíveis com % de aderência
- Próximos passos recomendados

### 4.7 Chat Contextual (`/project/:id` > aba Chat)
- Lista de conversas salvas (sidebar esquerdo)
- Área de mensagens com ações rápidas ("Gerar justificativa", "Revisar orçamento")
- Campo de input com sugestões contextuais
- Opção de salvar resposta como seção do projeto

### 4.8 Upload de Edital (`/edital/upload`)
- Área de drag-and-drop para PDF
- Ou colar URL do edital
- Lista de análises recentes

### 4.9 Resultado da Análise (`/edital/:id`)
- Resumo do edital
- Quem pode participar (✅/❌)
- Prazos e valores
- Documentos exigidos (checklist)
- Critérios de avaliação
- Match com projetos do usuário

### 4.10 Configurações (`/settings`)
- Conexão com IA (OpenAI, Anthropic, OpenRouter, Gemini, Ollama)
- Campo de API key para cada provider
- Status: conectado / não configurado
- Link para planos

### 4.11 Planos (`/plans`)
- Cards de 4 planos: Free, Individual (R$29,90), Profissional (R$79,90), Studio (R$199,90)
- Destaque: "Você traz sua chave de IA. CAPTAR não cobra tokens."
- CTA de upgrade

---

## 5. Fluxos Principais

### 5.1 Primeiro Diagnóstico (Onboarding)
```
Anônimo → Landing → "Diagnóstico grátis" → Questionário (8 perguntas)
→ Cadastro (email/Google) → Processamento IA (10-30s)
→ Tela de resultado (Score + recomendações) → CTA: "Criar projeto"
```

### 5.2 Criar Projeto Completo
```
Dashboard → "+ Novo Projeto" → Wizard 3 passos
→ Projeto criado → Workspace → Sugestão: diagnóstico
→ Navega entre abas (Resumo, Seções, Chat, etc)
```

### 5.3 Upload e Análise de Edital
```
Upload PDF → Extração de texto → IA processa (15-45s)
→ Resultado: resumo, requisitos, checklist
→ Match automático com projetos do usuário → Score de compatibilidade
```

### 5.4 Gerar Seção do Projeto
```
Workspace > Seções > Justificativa → "Gerar com IA"
→ Escolher contexto (Lei Rouanet / ProAC / Edital / Genérico)
→ IA gera texto → [Aceitar] [Editar] [Regenerar] → Salvar
```

### 5.5 Exportação
```
Workspace > Exportar → Escolher formato (DOCX/PDF)
→ Selecionar seções → Template → Gerar → Download
```

---

## 6. Banco de Dados (PostgreSQL)

### 6.1 Tabelas Principais

**users**
- id (UUID), email, password_hash, full_name, google_id, avatar_url, plan, credits, timestamps

**sessions**
- id (UUID), user_id (FK), token, expires_at, created_at

**user_providers**
- id, user_id (FK), provider (openai|anthropic|openrouter|gemini|ollama), encrypted_key, endpoint_url, is_active, timestamps

**projects**
- id (UUID), user_id (FK), name, area, city, state, target_aud, phase, budget_approx, deadline, objective, description, status, version, parent_id (self-ref FK), timestamps

**project_sections**
- id, project_id (FK), section_type (summary|justification|objectives|target_audience|accessibility|counterparts|schedule|team|communication|budget), content, generated_by, version, timestamps

**diagnostics**
- id, project_id (FK), overall_score (0-100), scores_json, strengths (JSONB), weaknesses (JSONB), risks (JSONB), edital_matches (JSONB), next_steps (JSONB), raw_response, provider, created_at

**conversations**
- id, project_id (FK), title, timestamps

**messages**
- id, conversation_id (FK), role (user|assistant|system), content, provider, model, tokens_in, tokens_out, created_at

**editais**
- id, user_id (FK), title, source_url, source_filename, raw_text, summary, eligibility (JSONB), deadline, max_value, requirements (JSONB), criteria (JSONB), status, created_at

**edital_matches**
- id, edital_id (FK), project_id (FK), score, strengths (JSONB), gaps (JSONB), created_at, UNIQUE(edital_id, project_id)

**budgets** e **budget_items** (MVP V2)
**payments** — provider, external_id, amount, status, plan
**audit_logs** — user_id, action, resource, resource_id, details, ip_address

### 6.2 Índices
- users(email) UNIQUE
- projects(user_id)
- project_sections(project_id)
- messages(conversation_id)
- editais(user_id)
- edital_matches(edital_id), edital_matches(project_id)
- payments(user_id)
- audit_logs(user_id)

---

## 7. Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   INTERNET                       │
│                   Cloudflare                     │
│                      │                          │
│               Traefik (HTTPS)                    │
│               /            \                    │
│     Frontend (React)    Backend API (FastAPI)    │
│     :3000               :8000                   │
│                           │                     │
│          ┌────────────────┼────────────────┐    │
│          │                │                │    │
│     PostgreSQL        Redis         Storage │    │
│     :5432            :6379         /data   │    │
│                                             │    │
│   Serviços Externos (BYOK):                │    │
│   OpenAI API | Anthropic | Gemini | Ollama  │    │
│   Mercado Pago                              │    │
└─────────────────────────────────────────────────┘
```

### Frontend
- React 19 + Vite + TypeScript
- Tailwind CSS + Radix UI / shadcn/ui
- React Query (server state) + Zustand (client state)
- TipTap (rich text editor para seções)
- Recharts (gráficos de diagnóstico)

### Backend
- FastAPI (Python 3.12) + SQLAlchemy 2.0 + Alembic
- JWT auth (python-jose + bcrypt)
- ARQ (async task queue com Redis)
- IA layer: Provider Router (OpenAI, Anthropic, Gemini, OpenRouter, Ollama)
- PDF parsing: PyMuPDF + marker-pdf
- Export: python-docx + WeasyPrint

### Deploy
- Docker Compose
- Traefik 3 como reverse proxy (HTTPS via Let's Encrypt)
- PostgreSQL 16 + Redis 7
- Volumes persistentes para dados e uploads

---

## 8. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | React 19 + Vite + TypeScript | SPA rápida, ecossistema maduro |
| CSS | Tailwind CSS 4 | Rápido, customizável, tema editorial |
| UI Components | Radix UI + shadcn/ui | Acessível, headless, customizável |
| Editor | TipTap | Rich text moderno, extensível |
| Backend | FastAPI (Python 3.12) | IA/RAG nativo, async, docs automáticos |
| ORM | SQLAlchemy 2.0 + Alembic | Migrations, async support |
| Banco | PostgreSQL 16 | JSONB, full-text search, robusto |
| Cache/Fila | Redis 7 + ARQ | Session, rate limit, background tasks |
| Storage | Local / MinIO | Arquivos de edital, exportações |
| Proxy | Traefik 3 | HTTPS, Let's Encrypt, routing |
| Container | Docker Compose | Deploy simples, serviços isolados |
| Auth | JWT + Google OAuth | Sem dependência externa obrigatória |
| Payment | Mercado Pago | Checkout Transparente |
| PDF Parse | PyMuPDF + marker-pdf | Extração de texto de editais |
| Export | python-docx + WeasyPrint | Templates de projeto |
| Monitoring | Sentry + Plausible | Erros e analytics privacy-first |

---

## 9. Estrutura de Diretórios do Projeto

```
captar/
├── frontend/
│   ├── src/
│   │   ├── components/    # ui/, layout/, project/, diagnostic/, edital/, chat/
│   │   ├── pages/         # Landing, Auth, Dashboard, ProjectNew, Workspace, etc
│   │   ├── hooks/         # React Query hooks, auth
│   │   ├── lib/           # API client, utils
│   │   ├── stores/        # Zustand
│   │   └── types/         # TypeScript
│   ├── public/
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/           # Rotas (auth, projects, sections, diagnostics, editais, export)
│   │   ├── core/          # Config, security, database, deps
│   │   ├── models/        # SQLAlchemy
│   │   ├── schemas/       # Pydantic
│   │   ├── services/      # Business logic
│   │   │   ├── ai/        # router, providers/, agents/, prompts/
│   │   │   ├── diagnostic.py
│   │   │   ├── edital_parser.py
│   │   │   └── export_service.py
│   │   ├── workers/       # ARQ tasks
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── traefik/
│
├── docs/
│   ├── SPEC.md
│   ├── API.md
│   └── DEPLOY.md
│
└── Makefile
```

---

## 10. API Endpoints (MVP V1)

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/register | email + senha |
| POST | /api/auth/login | email + senha → JWT |
| POST | /api/auth/google | Google OAuth |
| GET | /api/auth/me | usuário logado |

### Projects
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/projects | lista projetos |
| POST | /api/projects | cria projeto |
| GET | /api/projects/:id | detalhes |
| PATCH | /api/projects/:id | atualiza |
| DELETE | /api/projects/:id | arquiva |

### Sections
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/projects/:id/sections | lista seções |
| GET | /api/projects/:id/sections/:type | conteúdo |
| PUT | /api/projects/:id/sections/:type | salva |
| POST | /api/projects/:id/sections/:type/generate | gera com IA |

### Diagnostics
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/projects/:id/diagnose | executa |
| GET | /api/projects/:id/diagnostics | histórico |
| GET | /api/diagnostics/:id | resultado |

### Conversations
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/projects/:id/conversations | lista |
| POST | /api/projects/:id/conversations | cria |
| GET | /api/conversations/:id/messages | mensagens |
| POST | /api/conversations/:id/messages | envia (SSE stream) |

### Editais
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/editais/upload | upload PDF |
| GET | /api/editais/:id | análise |
| GET | /api/editais | histórico |
| POST | /api/editais/:id/match | compara com projetos |

### Export
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/projects/:id/export | gera DOCX/PDF |
| GET | /api/exports/:id/download | download |

### User & Providers
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/user/profile | perfil |
| PATCH | /api/user/profile | atualiza |
| GET | /api/user/providers | providers configurados |
| POST | /api/user/providers | adiciona API key |
| DELETE | /api/user/providers/:provider | remove |

### Payments
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/plans | planos |
| POST | /api/payments/create | cria checkout MP |
| POST | /api/payments/webhook | webhook MP |
| GET | /api/payments/history | histórico |

---

## 11. Copy da Landing Page

### Hero
```
headline: Tire seu projeto cultural do rascunho.

subheadline: O CAPTAR é a plataforma de IA para artistas e produtores
culturais criarem, diagnosticarem e exportarem projetos para Lei
Rouanet, ProAC, editais e patrocínios — do rascunho ao recurso.

cta_primary: Criar meu primeiro projeto
cta_secondary: Fazer diagnóstico grátis
```

### Features (3 colunas)
```
📋 Diagnóstico de IA em minutos
Responda 8 perguntas e receba uma análise completa do seu projeto:
score de maturidade, pontos fortes, fragilidades, riscos e
recomendações de editais compatíveis.

📄 Seu edital explicado em segundos
Suba o PDF de qualquer edital e receba resumo, requisitos,
checklist de documentos e match automático com seus projetos
salvos — sem ler 40 páginas.

📑 Projeto completo para exportar
Gere justificativa, objetivos, público-alvo, contrapartidas,
cronograma e orçamento com IA. Exporte em DOCX ou PDF e
adapte o mesmo projeto para diferentes editais em um clique.
```

### How it works (3 passos)
```
1. Conte sobre seu projeto
   Responda perguntas simples sobre sua ideia cultural.

2. Receba seu diagnóstico
   Em menos de 1 minuto: score, pontos fortes, gargalos,
   editais compatíveis.

3. Construa e exporte
   Use a IA para gerar cada seção. Edite, refine e exporte
   o documento pronto para submissão.
```

### Diferenciais
```
🔑 Você controla sua IA
Conecte sua chave da OpenAI, Claude ou Gemini. O CAPTAR
não cobra tokens — você paga direto ao seu provedor.
Também funciona com modelos locais via Ollama.

📊 Projeto Score
Cada projeto recebe uma nota de maturidade por dimensão:
conceito, narrativa, orçamento, equipe, contrapartidas,
acessibilidade e documentação.

🔄 Adapte para qualquer edital
Um projeto, múltiplas versões. Adapte para Lei Rouanet,
ProAC, edital municipal ou patrocinador privado.

🇧🇷 Feito para o ecossistema cultural brasileiro
Leis, rubricas, formulários, editais estaduais e municipais.
Da inscrição à prestação de contas.
```

### Pricing
```
FREE — Grátis
1 projeto, 1 diagnóstico, export com marca d'água

INDIVIDUAL — R$ 29,90/mês
5 projetos, diagnósticos ilimitados, export limpa,
10 uploads de edital/mês

PROFISSIONAL — R$ 79,90/mês
Tudo do Individual + orçamento inteligente, cronograma,
match com editais, versionamento, 20 projetos

STUDIO — R$ 199,90/mês
Projetos ilimitados, multiusuário, CRM de patrocinadores,
radar de oportunidades, white-label
```

### FAQ
```
Preciso ter uma chave de IA?
Sim. Você conecta sua chave da OpenAI (a partir de US$ 5/mês),
Claude, Gemini ou um modelo local gratuito via Ollama.
Cada diagnóstico consome ~R$ 0,05 a R$ 0,30 em tokens.

Meus projetos ficam salvos?
Sim. Cada projeto fica salvo com versionamento. No plano
Free o projeto fica disponível por 30 dias.

Funciona para qualquer edital?
Sim. O diagnóstico e geração de seções funcionam para qualquer
edital cultural. A análise de PDF funciona com qualquer edital
em português.
```

---

## 12. Roadmap

### Fase 0 — Fundação (Semanas 1-2)
- Setup repositório, Docker Compose dev, scaffold frontend + backend
- PostgreSQL + Redis, JWT auth, CI/CD, deploy inicial

### Fase 1 — MVP Core (Semanas 3-6)
- Dashboard, criar projeto (wizard), workspace (abas/sidebar)
- Diagnóstico IA, chat contextual, upload/análise de edital
- Geração de seções com IA, provider system (OpenAI/Anthropic/OpenRouter)
- User settings (API keys)

### Fase 2 — Polimento MVP (Semanas 7-10)
- Exportação DOCX/PDF, sistema de planos, Mercado Pago
- Onboarding, design refinado, landing page completa, SEO
- Testes, deploy produção com HTTPS

### Fase 3 — MVP V2 (Semanas 11-18)
- Orçamento inteligente, cronograma, match projeto × edital
- Biblioteca de editais, versionamento, histórico completo
- Plano Studio (multiusuário básico)

### Fase 4 — Crescimento (Mês 4-9)
- CRM de patrocinadores, pitch deck, radar de editais
- Colaboração multiusuário avançada, white-label, API pública
- Marketplace de consultoria humana

### Fase 5 — Maturidade (Mês 10-18)
- Pós-aprovação, prestação de contas, relatórios de impacto
- Integrações com formulários gov, alertas de prazo

---

## 13. Plano de Deploy

### 13.1 Pré-requisitos do Servidor
- Docker e Docker Compose no master server (root@72.62.147.249)
- Traefik como reverse proxy com Let's Encrypt
- Domínio captar.ia.br apontando para o IP
- Portas 80 e 443 liberadas

### 13.2 Estrutura no Servidor
```
/opt/captar/
├── docker-compose.prod.yml
├── .env
├── traefik/dynamic.yml
├── backend/Dockerfile
├── frontend/Dockerfile + nginx.conf
└── data/{postgres,redis,uploads}/
```

### 13.3 Serviços Docker
- **traefik**: proxy reverso, HTTPS
- **backend**: FastAPI na porta interna 8000
- **frontend**: Nginx servindo build estático na :3000
- **postgres**: PostgreSQL 16
- **redis**: Redis 7

### 13.4 Sequência de Deploy
1. Apontar DNS captar.ia.br → IP do servidor
2. Clonar repositório em `/opt/captar`
3. Criar `.env` com secrets (DB_PASSWORD, SECRET_KEY, ENCRYPTION_KEY)
4. `docker compose -f docker-compose.prod.yml up -d`
5. `docker compose exec backend alembic upgrade head`
6. Verificar: `curl https://captar.ia.br/api/health`

---

## 14. Identidade Visual

### Paleta
- Fundo: off-white / papel (#FAF8F5)
- Texto: grafite (#1A1A1A)
- Accent: terracota (#C4553F)
- Secundário: azul petróleo (#1B4D5C)
- Terciário: dourado queimado (#C4943A)
- Bordas: areia (#E5E0D8)

### Tipografia
- Headings: Playfair Display (serif editorial)
- Body: Inter (sans funcional)
- Mono: JetBrains Mono

### Sensação
Editorial, institucional, cultural. Brasileiro sem clichê.
Confiável como documento oficial, acolhedor como ateliê.

---

## 15. Métricas de Sucesso (MVP 3 meses)

| Métrica | Alvo |
|---------|------|
| Usuários cadastrados | 100 |
| Projetos criados | 150 |
| Diagnósticos executados | 200 |
| Editais analisados | 80 |
| Conversão Free → Pago | 8% |
| Churn mensal | < 10% |
| Tempo até 1º diagnóstico | < 3 min |

---

## 16. Riscos & Mitigações

| Risco | Mitigação |
|-------|-----------|
| Custo de IA no free tier | BYOK obrigatório desde dia 1 |
| Qualidade do parse de PDF | Testar com editais reais; fallback manual |
| Usuário não quer configurar chave | Onboarding guiado com instruções visuais |
| Concorrência | Foco em plataforma, não chat; profundidade editorial |
| Mudanças em leis/editais | Atualização contínua; curadoria |

---

> **Próximo passo:** Validar spec com Rafa, ajustar, iniciar Fase 0 (scaffold).
