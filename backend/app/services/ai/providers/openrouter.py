"""OpenRouter adapter — OpenAI-compatible, one key reaches many models.

This is CAPTAR's headline BYOK path: users connect via OpenRouter (OAuth PKCE,
added in a later step) and get access to OpenAI/Anthropic/Gemini through one key.
"""
from .openai import OpenAIProvider


class OpenRouterProvider(OpenAIProvider):
    name = "openrouter"
    default_model = "openai/gpt-4o-mini"
    base_url = "https://openrouter.ai/api/v1"
    extra_headers = {
        "HTTP-Referer": "https://captar.ia.br",
        "X-Title": "CAPTAR",
    }
