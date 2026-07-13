from app.config import settings


class LLMService:
    """LLM provider abstraction: OpenAI, DeepSeek, or Ollama (local)."""

    def __init__(self):
        self.provider = settings.llm_provider

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Generate a response from the LLM."""
        if self.provider == "openai":
            return self._generate_openai(system_prompt, user_prompt)
        elif self.provider == "deepseek":
            return self._generate_deepseek(system_prompt, user_prompt)
        elif self.provider == "ollama":
            return self._generate_ollama(system_prompt, user_prompt)
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")

    def _generate_openai(self, system_prompt: str, user_prompt: str) -> str:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=1024,
        )
        return response.choices[0].message.content or ""

    def _generate_deepseek(self, system_prompt: str, user_prompt: str) -> str:
        from openai import OpenAI

        client = OpenAI(
            api_key=settings.deepseek_api_key,
            base_url="https://api.deepseek.com",
        )
        response = client.chat.completions.create(
            model=settings.deepseek_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=1024,
        )
        return response.choices[0].message.content or ""

    def _generate_ollama(self, system_prompt: str, user_prompt: str) -> str:
        import json

        import httpx

        url = f"{settings.ollama_base_url}/api/chat"
        payload = {
            "model": settings.ollama_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
            "options": {"temperature": 0.3},
        }
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "")


# Singleton
llm_service = LLMService()
