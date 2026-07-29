from typing import List, Dict, Any, AsyncIterator
from config import settings
import groq


class LangChainService:
    def __init__(self):
        self.model = settings.GROQ_MODEL
        self.api_key = settings.GROQ_API_KEY
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                self._client = groq.AsyncGroq(api_key=self.api_key)
            except Exception as e:
                print(f"Groq client initialization failed: {e}")
                return None
        return self._client

    def _build_prompt(self, query: str, context: List[Dict[str, Any]]) -> str:
        context_parts = []
        for i, doc in enumerate(context, 1):
            source = doc.get("source", "Unknown")
            section = doc.get("section", "")
            text = doc.get("text", "")
            score = doc.get("score", 0)

            context_parts.append(
                f"Source {i}: {source}\n"
                f"Section: {section}\n"
                f"Content: {text}\n"
                f"Relevance: {score:.2f}\n"
            )

        context_str = "\n---\n".join(context_parts)

        prompt = f"""You are an AI assistant for a university campus.
Answer the student's question based ONLY on the provided context.
If the answer cannot be found in the context, say "I don't have enough information to answer that question. Please contact the campus information desk for assistance."

Context from campus guidelines:
{context_str}

Student Question: {query}

Provide a helpful, accurate, and concise response with references to specific guidelines when possible.
"""
        return prompt

    async def generate_response(
        self,
        query: str,
        context: List[Dict[str, Any]]
    ) -> str:
        client = self._get_client()

        if client is None:
            return self._generate_fallback_response(query, context)

        try:
            prompt = self._build_prompt(query, context)
            response = await client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1024
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq generation failed: {e}")
            return self._generate_fallback_response(query, context)

    async def generate_stream(
        self,
        query: str,
        context: List[Dict[str, Any]]
    ) -> AsyncIterator[str]:
        client = self._get_client()

        if client is None:
            response = self._generate_fallback_response(query, context)
            yield response
            return

        try:
            prompt = self._build_prompt(query, context)
            stream = await client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1024,
                stream=True
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            print(f"Groq streaming failed: {e}")
            response = self._generate_fallback_response(query, context)
            yield response

    def _generate_fallback_response(
        self,
        query: str,
        context: List[Dict[str, Any]]
    ) -> str:
        if context:
            context_text = "\n".join([
                f"- {doc.get('source', 'Unknown')}: {doc.get('text', '')[:200]}"
                for doc in context[:3]
            ])
            return (
                f"Based on the available campus guidelines, here is what I found:\n\n"
                f"{context_text}\n\n"
                f"For more specific information, please visit the campus information desk "
                f"or check the student handbook."
            )
        else:
            return (
                "I don't have enough information to answer that question. "
                "Please try rephrasing your query or contact the campus information desk "
                "for assistance."
            )


langchain_service = LangChainService()
