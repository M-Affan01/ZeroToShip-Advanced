import redis
import json
import uuid
import logging
from datetime import datetime
from typing import Optional, List
from config import settings
from circuit_breaker import circuit_registry

logger = logging.getLogger(__name__)


class RedisClient:
    def __init__(self):
        self.client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True
        )
        self.circuit_breaker = circuit_registry.get_or_create("redis", failure_threshold=3, timeout=15)
        self.dead_letter_queue = []
        self.max_dlq_size = 1000

    def ping(self) -> bool:
        if not self.circuit_breaker.can_execute():
            return False
        try:
            result = self.client.ping()
            self.circuit_breaker.record_success()
            return result
        except Exception as e:
            self.circuit_breaker.record_failure()
            return False

    def publish(self, channel: str, data: dict) -> bool:
        if not self.circuit_breaker.can_execute():
            self._add_to_dlq(channel, data)
            return False

        try:
            event = {
                "event_id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat(),
                "source": settings.SERVICE_NAME,
                "version": "1.0",
                "correlation_id": data.get("correlation_id", str(uuid.uuid4())),
                "data": data
            }
            self.client.publish(channel, json.dumps(event, default=str))
            self.circuit_breaker.record_success()
            return True
        except Exception as e:
            self.circuit_breaker.record_failure()
            self._add_to_dlq(channel, data)
            logger.error(f"Redis publish failed: {e}")
            return False

    async def async_publish(self, channel: str, data: dict) -> bool:
        return self.publish(channel, data)

    def get(self, key: str) -> Optional[str]:
        if not self.circuit_breaker.can_execute():
            return None
        try:
            result = self.client.get(key)
            self.circuit_breaker.record_success()
            return result
        except Exception as e:
            self.circuit_breaker.record_failure()
            return None

    async def async_get(self, key: str) -> Optional[str]:
        return self.get(key)

    def setex(self, key: str, ttl: int, value: str):
        if not self.circuit_breaker.can_execute():
            return
        try:
            self.client.setex(key, ttl, value)
            self.circuit_breaker.record_success()
        except Exception as e:
            self.circuit_breaker.record_failure()
            logger.error(f"Redis setex failed: {e}")

    async def async_setex(self, key: str, ttl: int, value: str):
        self.setex(key, ttl, value)

    def delete(self, key: str):
        if not self.circuit_breaker.can_execute():
            return
        try:
            self.client.delete(key)
            self.circuit_breaker.record_success()
        except Exception as e:
            self.circuit_breaker.record_failure()

    async def async_delete(self, key: str):
        self.delete(key)

    def pubsub(self):
        return self.client.pubsub()

    def keys(self, pattern: str) -> List[str]:
        if not self.circuit_breaker.can_execute():
            return []
        try:
            result = self.client.keys(pattern)
            self.circuit_breaker.record_success()
            return result
        except Exception as e:
            self.circuit_breaker.record_failure()
            return []

    def _add_to_dlq(self, channel: str, data: dict):
        if len(self.dead_letter_queue) >= self.max_dlq_size:
            self.dead_letter_queue.pop(0)

        self.dead_letter_queue.append({
            "channel": channel,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "reason": "circuit_breaker_open"
        })

    def get_dlq(self) -> List[dict]:
        return self.dead_letter_queue.copy()

    def retry_dlq(self) -> int:
        retried = 0
        while self.dead_letter_queue:
            item = self.dead_letter_queue.pop(0)
            if self.publish(item["channel"], item["data"]):
                retried += 1
        return retried

    def get_connection_status(self) -> str:
        if self.ping():
            return "connected"
        return "disconnected"

    def get_health(self) -> dict:
        return {
            "status": self.get_connection_status(),
            "circuit_breaker": self.circuit_breaker.get_state(),
            "dead_letter_queue_size": len(self.dead_letter_queue)
        }


redis_client = RedisClient()
