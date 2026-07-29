import json
import hashlib
from typing import Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class CacheState:
    HIT = "hit"
    MISS = "miss"
    STALE = "stale"
    INVALID = "invalid"


class CacheManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.default_ttl = 300
        self.stats = {"hits": 0, "misses": 0, "stale_hits": 0}

    def _make_key(self, prefix: str, identifier: str) -> str:
        return f"cache:{prefix}:{identifier}"

    def _hash_query(self, query: str) -> str:
        return hashlib.md5(query.encode()).hexdigest()

    async def get(self, key: str) -> tuple:
        try:
            data = await self.redis.get(key)
            if data:
                cached = json.loads(data)
                expires_at = cached.get("expires_at")

                if expires_at and datetime.fromisoformat(expires_at) < datetime.utcnow():
                    self.stats["stale_hits"] += 1
                    return (CacheState.STALE, cached.get("value"))

                self.stats["hits"] += 1
                return (CacheState.HIT, cached.get("value"))

            self.stats["misses"] += 1
            return (CacheState.MISS, None)

        except Exception as e:
            logger.error(f"Cache get error: {e}")
            self.stats["misses"] += 1
            return (CacheState.MISS, None)

    async def set(self, key: str, value: Any, ttl: int = None):
        try:
            ttl = ttl or self.default_ttl
            expires_at = datetime.utcnow() + timedelta(seconds=ttl)

            data = {
                "value": value,
                "expires_at": expires_at.isoformat(),
                "cached_at": datetime.utcnow().isoformat()
            }

            await self.redis.setex(key, ttl, json.dumps(data, default=str))

        except Exception as e:
            logger.error(f"Cache set error: {e}")

    async def invalidate(self, key: str):
        try:
            await self.redis.delete(key)
        except Exception as e:
            logger.error(f"Cache invalidate error: {e}")

    async def invalidate_pattern(self, pattern: str):
        try:
            keys = await self.redis.keys(pattern)
            if keys:
                await self.redis.delete(*keys)
        except Exception as e:
            logger.error(f"Cache invalidate pattern error: {e}")

    def get_stats(self) -> dict:
        total = self.stats["hits"] + self.stats["misses"]
        return {
            **self.stats,
            "total_requests": total,
            "hit_rate": self.stats["hits"] / total if total > 0 else 0
        }


cache_manager = None


def init_cache_manager(redis_client):
    global cache_manager
    cache_manager = CacheManager(redis_client)
    return cache_manager
