import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)


class Scheduler:
    def __init__(self, db_session_factory):
        self.db_factory = db_session_factory
        self._running = False
        self._tasks = []

    async def start(self):
        if self._running:
            return

        self._running = True
        self._tasks.append(asyncio.create_task(self._expire_notices_loop()))
        self._tasks.append(asyncio.create_task(self._maintenance_check_loop()))
        self._tasks.append(asyncio.create_task(self._cleanup_loop()))
        logger.info("Scheduler started")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        logger.info("Scheduler stopped")

    async def _expire_notices_loop(self):
        while self._running:
            try:
                await self._expire_notices()
            except Exception as e:
                logger.error(f"Notice expiry error: {e}")
            await asyncio.sleep(3600)

    async def _expire_notices(self):
        db = self.db_factory()
        try:
            from sqlalchemy import text
            result = db.execute(text("""
                UPDATE notices
                SET status = 'archived', updated_at = NOW()
                WHERE status = 'published'
                AND expires_at IS NOT NULL
                AND expires_at < NOW()
                RETURNING id
            """))
            expired = result.fetchall()
            db.commit()
            if expired:
                logger.info(f"Expired {len(expired)} notices")
            return len(expired) if expired else 0
        finally:
            db.close()

    async def _maintenance_check_loop(self):
        while self._running:
            try:
                await self._check_maintenance()
            except Exception as e:
                logger.error(f"Maintenance check error: {e}")
            await asyncio.sleep(1800)

    async def _check_maintenance(self):
        db = self.db_factory()
        try:
            from sqlalchemy import text
            result = db.execute(text("""
                SELECT id, name, maintenance_schedule
                FROM equipment
                WHERE status = 'available'
                AND maintenance_schedule IS NOT NULL
                AND maintenance_schedule <= NOW() + INTERVAL '7 days'
            """))
            upcoming = result.fetchall()
            for item in upcoming:
                logger.info(f"Maintenance scheduled for {item[1]}")
            return len(upcoming) if upcoming else 0
        finally:
            db.close()

    async def _cleanup_loop(self):
        while self._running:
            try:
                await self._cleanup_old_records()
            except Exception as e:
                logger.error(f"Cleanup error: {e}")
            await asyncio.sleep(86400)

    async def _cleanup_old_records(self):
        db = self.db_factory()
        try:
            from sqlalchemy import text
            db.execute(text("SELECT cleanup_old_records()"))
            db.commit()
            logger.info("Old records cleanup completed")
        finally:
            db.close()


scheduler = None


def init_scheduler(db_session_factory):
    global scheduler
    scheduler = Scheduler(db_session_factory)
    return scheduler
