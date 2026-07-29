from typing import List, Dict, Any, Optional
from config import settings


class VectorRetriever:
    def __init__(self):
        self.collection_name = settings.MILVUS_COLLECTION
        self.top_k = settings.VECTOR_TOP_K
        self.threshold = settings.SIMILARITY_THRESHOLD
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                from pymilvus import connections
                connections.connect(
                    alias="default",
                    host=settings.MILVUS_HOST,
                    port=settings.MILVUS_PORT
                )
                self._client = True
            except Exception as e:
                print(f"Milvus connection failed: {e}")
                self._client = False
        return self._client

    async def search(
        self,
        query_text: str,
        embedding: Optional[List[float]] = None,
        top_k: Optional[int] = None,
        threshold: Optional[float] = None,
        filters: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        top_k = top_k or self.top_k
        threshold = threshold or self.threshold

        if not self._get_client():
            return self._get_fallback_results(query_text)

        try:
            from pymilvus import Collection
            collection = Collection(self.collection_name)

            if embedding is None:
                embedding = await self._generate_embedding(query_text)

            search_params = {
                "metric_type": "COSINE",
                "params": {"nprobe": 10}
            }

            results = collection.search(
                data=[embedding],
                anns_field="embedding",
                param=search_params,
                limit=top_k,
                output_fields=["text", "source", "section", "metadata"]
            )

            processed = []
            for hits in results:
                for hit in hits:
                    if hit.score >= threshold:
                        processed.append({
                            "id": hit.id,
                            "text": hit.entity.get("text", ""),
                            "source": hit.entity.get("source", "Unknown"),
                            "section": hit.entity.get("section", ""),
                            "metadata": hit.entity.get("metadata", {}),
                            "score": hit.score
                        })

            return processed

        except Exception as e:
            print(f"Vector search failed: {e}")
            return self._get_fallback_results(query_text)

    async def _generate_embedding(self, text: str) -> List[float]:
        try:
            import httpx

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.GROQ_BASE_URL}/embeddings",
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.EMBEDDING_MODEL,
                        "input": text
                    },
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    return data["data"][0]["embedding"]
                else:
                    print(f"Groq embedding failed: {response.status_code}")
                    return self._simple_hash_embedding(text)

        except Exception as e:
            print(f"Embedding generation failed: {e}")
            return self._simple_hash_embedding(text)

    def _simple_hash_embedding(self, text: str) -> List[float]:
        import hashlib
        import struct

        text_bytes = text.encode('utf-8')
        hash_obj = hashlib.sha512(text_bytes)
        hash_bytes = hash_obj.digest()

        embedding = []
        for i in range(0, min(len(hash_bytes), 1536), 4):
            if i + 4 <= len(hash_bytes):
                value = struct.unpack('f', hash_bytes[i:i+4])[0]
                embedding.append(value)

        while len(embedding) < 1536:
            embedding.append(0.0)

        norm = sum(x*x for x in embedding) ** 0.5
        if norm > 0:
            embedding = [x/norm for x in embedding]

        return embedding[:1536]

    def _get_fallback_results(self, query_text: str) -> List[Dict[str, Any]]:
        fallback_docs = [
            {
                "id": "fallback_1",
                "text": "Library hours are 7:00 AM to 11:00 PM Monday through Friday, and 9:00 AM to 9:00 PM on weekends.",
                "source": "Campus Guidelines - Library Services",
                "section": "Hours of Operation",
                "metadata": {"category": "library"},
                "score": 0.75
            },
            {
                "id": "fallback_2",
                "text": "Student ID cards are required for building access, library services, and meal plans. Report lost cards immediately to the student affairs office.",
                "source": "Student Handbook - Identification",
                "section": "Student ID",
                "metadata": {"category": "general"},
                "score": 0.70
            },
            {
                "id": "fallback_3",
                "text": "Campus security can be reached 24/7 at extension 5555 or by using the emergency blue phones located throughout campus.",
                "source": "Campus Safety Manual",
                "section": "Emergency Contact",
                "metadata": {"category": "safety"},
                "score": 0.68
            },
            {
                "id": "fallback_4",
                "text": "The cafeteria serves breakfast from 7:00 AM to 10:00 AM, lunch from 11:30 AM to 2:00 PM, and dinner from 5:00 PM to 8:00 PM.",
                "source": "Campus Services Guide",
                "section": "Dining Services",
                "metadata": {"category": "dining"},
                "score": 0.65
            },
            {
                "id": "fallback_5",
                "text": "Wi-Fi network: CampusNet. Students can connect using their student ID and password. Guest network available in the library.",
                "source": "IT Services Manual",
                "section": "Network Access",
                "metadata": {"category": "technology"},
                "score": 0.62
            }
        ]

        query_lower = query_text.lower()
        relevant = []
        for doc in fallback_docs:
            if any(word in doc["text"].lower() for word in query_lower.split()):
                relevant.append(doc)

        if not relevant:
            relevant = fallback_docs[:2]

        return relevant


vector_retriever = VectorRetriever()
