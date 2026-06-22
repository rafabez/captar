import uuid
from datetime import datetime, date
from pydantic import BaseModel, EmailStr


# --- User ---

class UserOut(BaseModel):
    id: uuid.UUID
    clerk_id: str
    email: str
    full_name: str | None
    plan: str
    active_provider: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

class UserProfileUpdate(BaseModel):
    full_name: str | None = None

# --- Project ---

class ProjectCreate(BaseModel):
    name: str
    area: str | None = None
    city: str | None = None
    state: str | None = None
    target_aud: str | None = None
    phase: str | None = None
    budget_approx: float | None = None
    deadline: date | None = None
    objective: str | None = None
    description: str | None = None

class ProjectUpdate(BaseModel):
    name: str | None = None
    area: str | None = None
    city: str | None = None
    state: str | None = None
    target_aud: str | None = None
    phase: str | None = None
    budget_approx: float | None = None
    deadline: date | None = None
    objective: str | None = None
    description: str | None = None
    status: str | None = None

class ProjectOut(BaseModel):
    id: uuid.UUID
    name: str
    area: str | None
    city: str | None
    state: str | None
    phase: str | None
    status: str
    brief: str | None = None        # auto-derived project memory
    pins: list | None = None        # user-pinned facts
    updated_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}

class PinsUpdate(BaseModel):
    pins: list[str]

# --- Sections ---

class SectionOut(BaseModel):
    id: uuid.UUID
    section_type: str
    content: str | None
    version: int
    updated_at: datetime

    model_config = {"from_attributes": True}

class SectionUpdate(BaseModel):
    content: str

class SectionGenerateRequest(BaseModel):
    context: str | None = None   # target edital/lei, e.g. "Lei Rouanet", "ProAC"

class SectionDraft(BaseModel):
    section_type: str
    content: str
    generated_by: str            # provider that produced it (not yet saved)

# --- Diagnostics ---

class DiagnoseResponse(BaseModel):
    id: uuid.UUID
    overall_band: str | None        # solido | atencao | fragil
    summary: str | None             # narrative prose
    dimensions: dict | None         # {dimension: band}
    strengths: list | None
    weaknesses: list | None
    risks: list | None
    edital_matches: list | None     # [{name, note}]
    next_steps: list | None
    created_at: datetime

# --- Conversations ---

class ConversationOut(BaseModel):
    id: uuid.UUID
    title: str | None
    updated_at: datetime

    model_config = {"from_attributes": True}

class MessageOut(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}

class MessageCreate(BaseModel):
    content: str

# --- Editais ---

class EditalFromUrl(BaseModel):
    url: str

class EditalOut(BaseModel):
    id: uuid.UUID
    title: str | None
    summary: str | None
    eligibility: dict | None
    deadline: date | None
    max_value: float | None
    requirements: list | None
    criteria: list | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

# --- Providers ---

class ProviderCreate(BaseModel):
    provider: str          # openai | anthropic | openrouter | gemini | ollama
    api_key: str | None = None      # raw key; encrypted server-side, never returned
    endpoint_url: str | None = None  # for self-hosted (Ollama) base URL

class ProviderOut(BaseModel):
    id: uuid.UUID
    provider: str
    is_active: bool
    endpoint_url: str | None
    has_key: bool          # whether a key is stored (the key itself is never exposed)
    created_at: datetime

class OpenRouterExchange(BaseModel):
    code: str              # auth code from the OpenRouter PKCE redirect
    code_verifier: str     # the PKCE verifier the frontend generated

class ProviderSelect(BaseModel):
    provider: str          # which connected provider to use for AI calls

# --- Jobs (async) ---

class JobOut(BaseModel):
    id: uuid.UUID
    kind: str
    status: str            # queued | running | done | error
    result: dict | None
    error: str | None

    model_config = {"from_attributes": True}

# --- Export ---

class ExportRequest(BaseModel):
    format: str = "docx"
    sections: list[str] | None = None
    template: str = "default"
