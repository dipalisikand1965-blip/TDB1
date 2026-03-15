#!/usr/bin/env python3
"""
Auto Mockup Generator
Continuously monitors and restarts mockup generation batches.
Run in background: nohup python3 auto_mockup_generator.py &
"""

import asyncio
import aiohttp
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/auto_mockup_generator.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

API_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dine-category-pills.preview.emergentagent.com')
BATCH_SIZE = 50
CHECK_INTERVAL = 60  # seconds

async def check_status():
    """Check mockup generation status"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{API_URL}/api/mockups/status", timeout=30) as resp:
                if resp.status == 200:
                    return await resp.json()
    except Exception as e:
        logger.error(f"Error checking status: {e}")
    return None

async def get_stats():
    """Get overall mockup stats"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{API_URL}/api/mockups/stats", timeout=30) as resp:
                if resp.status == 200:
                    return await resp.json()
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
    return None

async def start_batch():
    """Start a new mockup generation batch"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_URL}/api/mockups/generate-batch",
                json={"limit": BATCH_SIZE},
                timeout=30
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
    except Exception as e:
        logger.error(f"Error starting batch: {e}")
    return None

async def main():
    """Main loop - monitor and restart batches"""
    logger.info("=" * 60)
    logger.info("AUTO MOCKUP GENERATOR STARTED")
    logger.info(f"API URL: {API_URL}")
    logger.info(f"Batch Size: {BATCH_SIZE}")
    logger.info(f"Check Interval: {CHECK_INTERVAL}s")
    logger.info("=" * 60)
    
    while True:
        try:
            # Get current status
            status = await check_status()
            stats = await get_stats()
            
            if stats:
                total = stats.get('total_products', 0)
                complete = stats.get('products_with_mockups', 0)
                pct = stats.get('completion_percentage', 0)
                remaining = stats.get('products_without_mockups', 0)
                
                logger.info(f"Progress: {complete}/{total} ({pct:.1f}%) | Remaining: {remaining}")
                
                # Check if we're done
                if remaining == 0:
                    logger.info("🎉 ALL MOCKUPS COMPLETE!")
                    break
            
            if status:
                is_running = status.get('running', False)
                progress = status.get('progress', 0)
                batch_total = status.get('total', 0)
                current = status.get('current_product', 'N/A')
                
                if is_running:
                    logger.info(f"Batch running: {progress}/{batch_total} | Current: {current}")
                else:
                    # Not running - start a new batch
                    logger.info("Batch not running. Starting new batch...")
                    result = await start_batch()
                    if result:
                        pending = result.get('pending', 0)
                        logger.info(f"✅ New batch started! Pending: {pending}")
                    else:
                        logger.warning("Failed to start batch")
            else:
                logger.warning("Could not get status - API might be down")
            
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
        
        # Wait before next check
        await asyncio.sleep(CHECK_INTERVAL)
    
    logger.info("Auto generator finished")

if __name__ == "__main__":
    asyncio.run(main())
