"""OpenAI Chat Completions adapter (also the base for OpenAI-compatible APIs)."""
import httpx

from ..base import BaseProvider, ChatMessage, ChatResult, ProviderError


class OpenAIProvider(BaseProvider):
    name = "openai"
    default_model = "gpt-4o-mini"
    base_url = "https://api.openai.com/v1"
    extra_headers: dict[str, str] = {}

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        model: str | None = None,
        max_tokens: int = 4096,
        json_mode: bool = False,
    ) -> ChatResult:
        if not self.api_key:
            raise ProviderError(f"Chave de API não configurada para {self.name}")

        model = model or self.default_model
        payload: dict = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        headers = {"Authorization": f"Bearer {self.api_key}", **self.extra_headers}

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions", json=payload, headers=headers
            )
        if resp.status_code >= 400:
            raise ProviderError(f"{self.name} {resp.status_code}: {resp.text[:300]}")

        data = resp.json()
        usage = data.get("usage", {})
        return ChatResult(
            content=data["choices"][0]["message"]["content"],
            provider=self.name,
            model=model,
            tokens_in=usage.get("prompt_tokens"),
            tokens_out=usage.get("completion_tokens"),
        )
