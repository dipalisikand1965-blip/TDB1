"""
MIRA RETENTION SCHEDULER
========================
Background scheduler that runs retention jobs.
Integrates with the FastAPI server.

Usage: Import and start in server.py
"""

import asyncio
import logging
from datetime import datetime, timezone, time
from typing import Optional

logger = logging.getLogger(__name__)

# Global scheduler state
_scheduler_task: Optional[asyncio.Task] = None
_scheduler_running = False


async def run_retention_job(db):
    """Run the retention cleanup job."""
    from mira_retention import archive_old_sessions
    
    logger.info(f"[SCHEDULER] Starting retention job at {datetime.now(timezone.utc)}")
    
    try:
        stats = await archive_old_sessions(db)
        logger.info(f"[SCHEDULER] Retention job completed: {stats}")
        return stats
    except Exception as e:
        logger.error(f"[SCHEDULER] Retention job failed: {e}")
        return None


async def scheduler_loop(db, run_hour: int = 3):
    """
    Main scheduler loop. Runs retention at specified hour (default 3 AM UTC).
    """
    global _scheduler_running
    _scheduler_running = True
    
    logger.info(f"[SCHEDULER] Started. Will run retention daily at {run_hour}:00 UTC")
    
    while _scheduler_running:
        try:
            now = datetime.now(timezone.utc)
            
            # Calculate next run time
            if now.hour >= run_hour:
                # Run tomorrow
                next_run = datetime(now.year, now.month, now.day, run_hour, 0, 0, tzinfo=timezone.utc)
                next_run = next_run.replace(day=now.day + 1)
            else:
                # Run today
                next_run = datetime(now.year, now.month, now.day, run_hour, 0, 0, tzinfo=timezone.utc)
            
            # Wait until next run
            wait_seconds = (next_run - now).total_seconds()
            logger.info(f"[SCHEDULER] Next retention run in {wait_seconds/3600:.1f} hours at {next_run}")
            
            # Wait (check every hour to handle date changes)
            while wait_seconds > 0 and _scheduler_running:
                sleep_time = min(wait_seconds, 3600)  # Check every hour
                await asyncio.sleep(sleep_time)
                wait_seconds -= sleep_time
            
            if _scheduler_running:
                # Run the job
                await run_retention_job(db)
                
                # Wait a bit before calculating next run
                await asyncio.sleep(60)
                
        except asyncio.CancelledError:
            logger.info("[SCHEDULER] Scheduler cancelled")
            break
        except Exception as e:
            logger.error(f"[SCHEDULER] Error in scheduler loop: {e}")
            await asyncio.sleep(300)  # Wait 5 minutes on error
    
    logger.info("[SCHEDULER] Scheduler stopped")


def start_scheduler(db):
    """Start the background scheduler."""
    global _scheduler_task
    
    if _scheduler_task is not None and not _scheduler_task.done():
        logger.warning("[SCHEDULER] Scheduler already running")
        return
    
    _scheduler_task = asyncio.create_task(scheduler_loop(db))
    logger.info("[SCHEDULER] Background scheduler started")


def stop_scheduler():
    """Stop the background scheduler."""
    global _scheduler_running, _scheduler_task
    
    _scheduler_running = False
    if _scheduler_task:
        _scheduler_task.cancel()
        logger.info("[SCHEDULER] Scheduler stop requested")


async def run_now(db):
    """Run retention job immediately (for testing/manual trigger)."""
    return await run_retention_job(db)
