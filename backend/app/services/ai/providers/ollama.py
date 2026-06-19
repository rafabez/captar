"""Ollama adapter — local/self-hosted models, no API key.

Uses `endpoint_url` (the user's Ollama host) instead of a key, so artists can run
fully free/offline via a local model. First-class in CAPTAR's BYOK lineup.
"""
import httpx

from ..base import BaseProvider, ChatMessage, ChatResult, ProviderError


class OllamaProvider(BaseProvider):
    name = "ollama"
    default_model = "llama3.1"
    default_endpoint = "http://localhost:11434"

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        model: str | None = None,
        max_tokens: int = 4096,
        json_mode: bool = False,
    ) -> ChatResult:
        model = model or self.default_model
        base = (self.endpoint_url or self.default_endpoint).rstrip("/")

        payload: dict = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": False,
            "options": {"num_predict": max_tokens},
        }
        if json_mode:
            payload["format"] = "json"

        async with httpx.AsyncClient(timeout=300.0) as client:
            resp = await client.post(f"{base}/api/chat", json=payload)
        if resp.status_code >= 400:
            raise ProviderError(f"ollama {resp.status_code}: {resp.text[:300]}")

        data = resp.json()
        return ChatResult(
            content=data.get("message", {}).get("content", ""),
            provider=self.name,
            model=model,
            tokens_in=data.get("prompt_eval_count"),
            tokens_out=data.get("eval_count"),
        )
