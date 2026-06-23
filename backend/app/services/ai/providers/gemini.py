"""Google Gemini (Generative Language API) adapter — BYOK."""
import httpx

from ..base import BaseProvider, ChatMessage, ChatResult, ProviderError


class GeminiProvider(BaseProvider):
    name = "gemini"
    default_model = "gemini-2.5-flash"
    base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        model: str | None = None,
        max_tokens: int = 4096,
        json_mode: bool = False,
    ) -> ChatResult:
        if not self.api_key:
            raise ProviderError("Chave de API não configurada para gemini")

        model = model or self.default_model
        system, rest = self._split_system(messages)

        contents = [
            {
                "role": "model" if m.role == "assistant" else "user",
                "parts": [{"text": m.content}],
            }
            for m in rest
        ]
        payload: dict = {
            "contents": contents,
            "generationConfig": {"maxOutputTokens": max_tokens},
        }
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        url = f"{self.base_url}/models/{model}:generateContent?key={self.api_key}"

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=payload)
        if resp.status_code >= 400:
            raise ProviderError(f"gemini {resp.status_code}: {resp.text[:300]}")

        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise ProviderError("gemini: resposta sem candidatos")
        text = "".join(
            part.get("text", "")
            for part in candidates[0].get("content", {}).get("parts", [])
        )
        usage = data.get("usageMetadata", {})
        return ChatResult(
            content=text,
            provider=self.name,
            model=model,
            tokens_in=usage.get("promptTokenCount"),
            tokens_out=usage.get("candidatesTokenCount"),
        )
