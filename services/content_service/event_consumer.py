import json
import asyncio
import logging
from datetime import datetime
from typing import Callable, Optional

logger = logging.getLogger(__name__)


class EventConsumer:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.handlers = {}
        self._running = False
        self._task = None

    def subscribe(self, channel: str, handler: Callable):
        if channel not in self.handlers:
            self.handlers[channel] = []
        self.handlers[channel].append(handler)
        logger.info(f"Subscribed to channel: {channel}")

    async def start(self):
        if self._running:
            return

        self._running = True
        self._task = asyncio.create_task(self._consume_loop())
        logger.info("Event consumer started")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Event consumer stopped")

    async def _consume_loop(self):
        try:
            pubsub = self.redis.pubsub()
            await pubsub.subscribe(*self.handlers.keys())

            while self._running:
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=1.0
                )

                if message and message["type"] == "message":
                    channel = message["channel"]
                    try:
                        event = json.loads(message["data"])
                        await self._handle_event(channel, event)
                    except json.JSONDecodeError:
                        logger.error(f"Invalid JSON in event: {message['data']}")
                    except Exception as e:
                        logger.error(f"Error handling event: {e}")

                await asyncio.sleep(0.1)

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Event consumer error: {e}")

    async def _handle_event(self, channel: str, event: dict):
        handlers = self.handlers.get(channel, [])

        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    handler(event)
            except Exception as e:
                logger.error(f"Handler error for {channel}: {e}")


event_consumer = None


def init_event_consumer(redis_client):
    global event_consumer
    event_consumer = EventConsumer(redis_client)
    return event_consumer
