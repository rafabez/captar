"""DeepSeek adapter — OpenAI-compatible API, BYOK."""
from .openai import OpenAIProvider


class DeepSeekProvider(OpenAIProvider):
    name = "deepseek"
    default_model = "deepseek-chat"
    base_url = "https://api.deepseek.com"
