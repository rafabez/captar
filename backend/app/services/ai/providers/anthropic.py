"""Anthropic Messages API adapter (BYOK — user's own api.anthropic.com key).

Wire shape per the Claude API docs: POST /v1/messages, `x-api-key` +
`anthropic-version` headers, system prompt as a top-level field (not a message),
text in `content[].text`, usage as `input_tokens` / `output_tokens`.
"""
import httpx

from ..base import BaseProvider, ChatMessage, ChatResult, ProviderError


class AnthropicProvider(BaseProvider):
    name = "anthropic"
    default_model = "claude-opus-4-8"
    base_url = "https://api.anthropic.com/v1"
    version = "2023-06-01"

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        model: str | None = None,
        max_tokens: int = 4096,
        json_mode: bool = False,
    ) -> ChatResult:
        if not self.api_key:
            raise ProviderError("Chave de API não configurada para anthropic")

        model = model or self.default_model
        system, rest = self._split_system(messages)
        if json_mode:
            json_hint = "Responda APENAS com JSON válido, sem texto antes ou depois."
            system = f"{system}\n\n{json_hint}" if system else json_hint

        payload: dict = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": [{"role": m.role, "content": m.content} for m in rest],
        }
        if system:
            payload["system"] = system

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": self.version,
            "content-type": "application/json",
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/messages", json=payload, headers=headers
            )
        if resp.status_code >= 400:
            raise ProviderError(f"anthropic {resp.status_code}: {resp.text[:300]}")

        data = resp.json()
        text = "".join(
            block.get("text", "")
            for block in data.get("content", [])
            if block.get("type") == "text"
        )
        usage = data.get("usage", {})
        return ChatResult(
            content=text,
            provider=self.name,
            model=model,
            tokens_in=usage.get("input_tokens"),
            tokens_out=usage.get("output_tokens"),
        )
