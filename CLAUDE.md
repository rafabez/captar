# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What CAPTAR is

Vertical SaaS for the Brazilian cultural ecosystem: AI platform where artists/producers build, diagnose, adapt, and export cultural project proposals for grants/editais (Lei Rouanet, ProAC, etc.). UI copy and domain language are **Portuguese (pt-BR)** — match it (e.g. error `detail` strings like `"Projeto não encontrado"`). `SPEC.md` is the full product spec; `README.md` summarizes it.

**BYOK model:** users supply their own AI provider keys (OpenAI/Anthropic/Gemini/OpenRouter/Ollama). The platform stores keys per-user in `user_providers` and never pays for tokens.

## Repository layout

Note: the git repo root is the **inner** `captar/` directory (this file lives there), nested one level under the working directory. Run all commands from that inner `captar/`.

- `backend/` — FastAPI + SQLAlchemy 2.0 async, Python 3.12
- `frontend/` — React 19 + Vite + TypeScript + Tailwind v4 + Clerk
- `docker/` — compose files (dev + prod), Traefik, nginx
- `Makefile` — primary command entrypoint

## Commands

Everything runs through Docker Compose via the Makefile (run from inner `captar/`):

```bash
make dev          # build + up dev stack (backend:8000, frontend:3000, postgres, redis)
make dev-up       # same, detached
make dev-down     # stop
make dev-logs     # tail logs
make migrate      # alembic upgrade head (inside backend container)
make migrate-create name="msg"   # autogenerate a migration
make clean        # down -v + wipe dist/pycache
```

Frontend-only (host, hits backend through Vite's `/api` proxy → `localhost:8000`):

```bash
make frontend-dev      # vite dev server on :3000
make frontend-build    # tsc -b && vite build
cd frontend && npm run lint   # eslint
```

There is **no backend test suite or linter configured yet**, and no single-test command. Backend API docs: `http://localhost:8000/api/docs`.

## Architecture

### Auth is Clerk, not the JWT/password flow SPEC.md describes

SPEC.md is aspirational on this point — the implemented auth is **Clerk end-to-end**:

- Frontend wraps routes in `<ClerkProvider>` (`src/App.tsx`); protected routes gate on `<SignedIn>/<SignedOut>`. Needs `VITE_CLERK_PUBLISHABLE_KEY` or the app renders a config-error screen.
- `src/lib/api.ts` pulls the session token off `window.Clerk.session.getToken()` and sends it as `Bearer`. All API calls go through the `api` helper.
- Backend verifies the Clerk JWT against Clerk's JWKS: `core/security.py` (`verify_clerk_token`) fetches/caches JWKS, validates RS256, checks the `iss` prefix. The JWKS URL is **derived by base64-decoding the publishable key** in `core/config.py` (`clerk_jwks_url`) — there's no separate JWKS env var.
- `core/deps.py` `get_current_user` maps the Clerk `sub` claim to a local `users` row, **auto-creating it on first authenticated request** (lazy provisioning — there is no register endpoint and no webhook sync). `require_user` is the dependency that enforces 401.

`requirements.txt` still lists `passlib`/`python-jose` from the old design; only `jose` (for Clerk verification) is actually used. There are no `auth/register` or `auth/login` endpoints — only `GET /api/auth/me`.

### Backend structure

`app/main.py` mounts four routers under `/api`: `auth`, `projects`, `editais`, `user` (see `api/__init__.py`). Layering: `api/` (routes) → `schemas/` (Pydantic in a single `schemas/__init__.py`) → `models/` (SQLAlchemy) → `core/` (config, database, deps, security).

- All models use UUID PKs and `JSONB` for flexible fields (diagnostics scores, edital requirements). `models/__init__.py` must import every model so `Base.metadata` sees them.
- Ownership pattern: every project/edital query filters by `current_user.id`; sub-resources (sections, conversations, messages) `.join(Project)` and re-check `Project.user_id`. Preserve this when adding endpoints — it's the only authz layer.
- Sections are **append-only versioned**: `save_section` inserts a new `ProjectSection` row (incrementing nothing automatically); reads take the highest `version`. Delete is **soft** (status → `"archived"`).
- Provider keys upsert by `(user_id, provider)`; delete just flips `is_active = False`.

### AI features are stubs

The core product surface — section generation, diagnostics, chat, edital PDF upload/analysis — are TODO stubs returning `{"status": "not_implemented"}`:
`projects.py` (`generate_section`, `run_diagnostic`, `send_message`) and `editais.py` (`upload_edital`). SPEC.md describes a `services/ai/` provider-router layer (router + providers/ + agents/ + prompts/) and ARQ workers — **none of that exists yet**. `arq`, `pymupdf`, `weasyprint`, `python-docx` are in requirements but unused. When implementing, that's the layer to build.

### Database gotcha

There is **no `alembic/` directory yet** despite `make migrate` referencing it, and `main.py` does not call `create_metadata`/`create_all`. So tables are not created on a fresh stack — initializing schema (scaffolding Alembic or adding a create-all on startup) is a prerequisite before the API works against a real DB.

### Frontend

- React Query (`@tanstack/react-query`) for server state, Zustand for client state, React Router v7. Pages in `src/pages/` map 1:1 to routes in `App.tsx`; shared chrome in `components/layout/Layout.tsx`.
- Tailwind v4 via `@tailwindcss/vite` (no `tailwind.config.ts`); `@` aliases `src/`.
- Brand tokens (from SPEC §14) appear as classes like `bg-paper`, `text-ink` — paper `#FAF8F5`, ink `#1A1A1A`, terracota accent `#C4553F`.

## Environment

Backend reads `.env` (pydantic-settings). Key vars: `DATABASE_URL` (async — `postgresql+asyncpg://`), `REDIS_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CORS_ORIGINS`. Frontend needs `VITE_CLERK_PUBLISHABLE_KEY`. See the various `.env.example` files. Prod deploys via `docker/docker-compose.prod.yml` behind Traefik (HTTPS/Let's Encrypt) at `captar.ia.br`.
