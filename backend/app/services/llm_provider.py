"""LLM Provider abstraction supporting hosted models (OpenAI/Gemini) and deterministic fallback."""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import os
import json
import httpx

from app.config import settings


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """Generate a response text given system instructions and user message."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True if credentials and endpoints are valid."""
        pass

    @abstractmethod
    def provider_name(self) -> str:
        """Name of the active provider."""
        pass


class DeterministicFallbackProvider(BaseLLMProvider):
    """Deterministic fallback provider when external LLM credentials are not provided."""
    
    def is_configured(self) -> bool:
        return True

    def provider_name(self) -> str:
        return "deterministic_fallback"

    async def generate_response(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        return {
            "text": "Deterministic fallback mode active. Please refer to verified knowledge base sources.",
            "provider": "deterministic_fallback",
            "is_fallback": True,
        }


class HostedLLMProvider(BaseLLMProvider):
    """Hosted LLM provider using OpenAI-compatible chat completions."""
    
    def __init__(self, api_key: str, model: str, base_url: str = "https://api.openai.com/v1"):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def provider_name(self) -> str:
        return f"hosted_{self.model}"

    async def generate_response(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "text": "External LLM provider is not configured.",
                "provider": "unconfigured",
                "is_fallback": True,
            }

        messages = [{"role": "system", "content": system_prompt}]
        if conversation_history:
            for turn in conversation_history[-6:]:  # Keep recent history
                messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
        messages.append({"role": "user", "content": user_message})

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": 500,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"].strip()
                    return {
                        "text": content,
                        "provider": self.provider_name(),
                        "is_fallback": False,
                    }
                else:
                    return {
                        "text": f"Error from LLM provider (HTTP {resp.status_code})",
                        "provider": self.provider_name(),
                        "is_fallback": True,
                        "error": resp.text,
                    }
        except Exception as exc:
            return {
                "text": f"LLM connection error: {str(exc)}",
                "provider": self.provider_name(),
                "is_fallback": True,
                "error": str(exc),
            }


def get_llm_provider() -> BaseLLMProvider:
    provider_type = settings.LLM_PROVIDER.lower().strip()
    if provider_type in ("openai", "hosted") and settings.LLM_API_KEY:
        return HostedLLMProvider(api_key=settings.LLM_API_KEY, model=settings.LLM_MODEL)
    return DeterministicFallbackProvider()
