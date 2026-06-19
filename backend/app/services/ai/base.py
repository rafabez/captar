"""Provider-neutral chat interface.

Every BYOK provider (OpenAI, Anthropic, OpenRouter, Gemini, Ollama) is wrapped in
a thin adapter exposing the same `complete()` contract, so callers (diagnostic,
edital analysis, section generation, chat) never branch on provider.
"""
import json
from dataclasses import dataclass


@dataclass
class ChatMessage:
    role: str  # "system" | "user" | "assistant"
    content: str


@dataclass
class ChatResult:
    content: str
    provider: str
    model: str
    tokens_in: int | None = None
    tokens_out: int | None = None


class ProviderError(Exception):
    """Raised when a provider is misconfigured or the upstream call fails."""


def parse_json(text: str) -> dict:
    """Tolerant JSON extraction — strips code fences and surrounding prose."""
    s = text.strip()
    if s.startswith("```"):
        s = s.split("```", 2)[1]
        if s.startswith("json"):
            s = s[4:]
    start, end = s.find("{"), s.rfind("}")
    if start == -1 or end == -1:
        raise ProviderError("Resposta da IA não contém JSON")
    try:
        return json.loads(s[start : end + 1])
    except json.JSONDecodeError as e:
        raise ProviderError(f"JSON inválido da IA: {e}")


class BaseProvider:
    name: str = ""
    default_model: str = ""

    def __init__(self, api_key: str | None = None, endpoint_url: str | None = None):
        self.api_key = api_key
        self.endpoint_url = endpoint_url

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        model: str | None = None,
        max_tokens: int = 4096,
        json_mode: bool = False,
    ) -> ChatResult:
        raise NotImplementedError

    # --- helpers shared by adapters ---

    def _split_system(self, messages: list[ChatMessage]) -> tuple[str | None, list[ChatMessage]]:
        """Pull leading/standalone system messages into a single system string."""
        system_parts = [m.content for m in messages if m.role == "system"]
        rest = [m for m in messages if m.role != "system"]
        system = "\n\n".join(system_parts) if system_parts else None
        return system, rest
