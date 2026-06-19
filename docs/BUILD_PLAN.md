# CAPTAR — Build Plan

> Execution plan layered on top of `SPEC.md`. SPEC is the product vision; this is the
> ordered, opinionated path to ship it. Updated as we go. Owner: Claude Code + Rafa.

## Guiding principles

1. **Ship the "uau" first.** Diagnóstico (M4) and edital analysis (M6) are the value.
   Everything else is plumbing or table stakes. Build the wow, then the wrapper.
2. **Anonymous → value → signup.** Don't gate the first diagnosis behind login.
   Let a visitor feel the magic, then ask for an account to *save* it.
3. **BYOK with zero friction.** OpenRouter OAuth (1-click) is the headline path.
   Manual keys and Ollama are fallbacks. Keys are always encrypted at rest.
4. **Platform, not chatbot.** Saved, versioned, editable projects. Chat is one tab, not the product.

## Architecture decisions

### AI provider layer (`backend/app/services/ai/`)
- **`router.py`** — single entrypoint `complete(user, messages, *, json_schema=None, stream=False)`.
  Resolves the user's active provider, decrypts the key, dispatches to the right adapter.
- **`providers/`** — thin adapters: `openai.py`, `anthropic.py`, `gemini.py`, `openrouter.py`,
  `ollama.py`. Normalize request/response + token usage. All speak the same internal interface.
- **`agents/`** — function-specialized prompt+flow units (curador/diagnostic, orçamentista,
  edital-analyst, section-writer). Each owns its system prompt and output contract.
- **`prompts/`** — versioned prompt templates (pt-BR), kept out of code so they're iterable.
- Long jobs (PDF parse, diagnosis) run on **ARQ workers**; API returns a job id, frontend polls
  or subscribes (SSE) for status + result.

### BYOK / provider auth
- **OpenRouter OAuth PKCE** = primary "Conectar IA" flow (browser, no key paste, multi-model).
- Manual API key entry for OpenAI/Anthropic/Gemini; endpoint URL for Ollama.
- `UserProvider.encrypted_key` encrypted with **Fernet** using `ENCRYPTION_KEY`.
  Add `services/crypto.py` (`encrypt`/`decrypt`). Never return the key to the client.
- OpenAI "Sign in with ChatGPT" (Codex-style) is **not viable** — first-party only, ToS-locked,
  ChatGPT subscription ≠ API billing. OpenRouter OAuth gives the same UX legitimately.

### Data / migrations
- **Alembic** is the source of truth for schema (autogenerate from models).
- Backend container runs `alembic upgrade head` on startup before uvicorn, so deploys
  self-heal the schema. No more empty DB.

### Frontend
- Design system from SPEC tokens (paper `#FAF8F5`, ink `#1A1A1A`, terracota `#C4553F`;
  Playfair Display headings, Inter body). Build a small `components/ui/` set, not a generic kit.
- React Query for all server state via the `api` helper; Zustand only for ephemeral UI state.
- Workspace shell: persistent sidebar + tab content, optimistic autosave, streaming AI panels.

## Phased execution

| # | Step | Status |
|---|------|--------|
| 1 | Alembic + initial migration; auto-migrate on deploy | **done** (live DB migrated, verified) |
| 2 | Crypto helper + BYOK key encryption on save/read | **done** |
| 3 | `services/ai/` provider-router + adapters (OpenAI/Anthropic/OpenRouter/Gemini/Ollama) | **done** |
| 4 | OpenRouter OAuth PKCE connect flow (backend exchange + frontend button) | **done** (inline; ARQ deferred) |
| 5 | **M4 Diagnóstico** — agent + endpoint (inline await; ARQ + results UI next) | **done (backend)** |
| 6 | **M6 Edital** — PDF upload, PyMuPDF parse, analysis agent, results UI | **done** (inline; ARQ next) |
| 7 | **M7 Seções** — generate per section_type with context, accept/edit/regen | **done** |
| 6b | Edital from URL (server-side fetch + SSRF guard) | **done** |
| 8 | **M8 Export** — DOCX (python-docx) + PDF (WeasyPrint) with templates | todo |
| 9 | Design system pass + Landing + workspace polish | todo |
| 10 | Planos + Mercado Pago + credit/plan gating | todo |
| 11 | Clerk prod instance, secrets via env_file, observability (Sentry/Plausible) | todo |

## Security backlog (do before public launch)
- Rotate SSH password; disable password auth, key-only.
- Move prod compose secrets to `env_file:`; rotate `ENCRYPTION_KEY`, DB pass, Clerk secret
  (they were exposed in the committed/inspected compose).
- Encrypt BYOK keys (step 2).
- Swap Clerk `pk_test_*` for production instance.
