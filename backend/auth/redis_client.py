import redis
import json
import uuid
from datetime import datetime
from typing import Optional
from config import settings


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

    def ping(self) -> bool:
        try:
            return self.client.ping()
        except (redis.ConnectionError, redis.TimeoutError):
            return False

    def publish(self, channel: str, data: dict) -> bool:
        try:
            event = {
                "event_id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "auth-api",
                "data": data
            }
            self.client.publish(channel, json.dumps(event, default=str))
            return True
        except (redis.ConnectionError, redis.TimeoutError):
            return False

    def get_connection_status(self) -> str:
        if self.ping():
            return "connected"
        return "disconnected"


redis_client = RedisClient()
