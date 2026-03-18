#!/usr/bin/env python3
"""
Continuous image generation for all pillars.
Run: nohup python3 continuous_image_gen.py > /tmp/continuous_img_gen.log 2>&1 &
"""
import asyncio, aiohttp, time, os, logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/continuous_img_gen.log'),
        logging.StreamHandler()
    ]
)
log = logging.getLogger('img_gen')

API_URL = "https://soul-page-sync.preview.emergentagent.com"
PILLARS = ["celebrate", "care", "dine", "enjoy", "fit", "learn", "emergency", "farewell", "adopt", "paperwork", "advisory", "shop", "stay", "travel", "go"]

async def run():
    log.info(f"Starting continuous image generation for all pillars")
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as sess:
        while True:
            # Check status
            try:
                async with sess.get(f"{API_URL}/api/ai-images/status") as r:
                    status = await r.json() if r.status == 200 else {}
                if status.get("running"):
                    prog = status.get("completed", 0)
                    total = status.get("total", 0)
                    pillar = status.get("pillar", "?")
                    log.info(f"Running: {pillar} — {prog}/{total} ({status.get('current_item','')})")
                    await asyncio.sleep(20)
                    continue
            except Exception as e:
                log.warning(f"Status check failed: {e}")
                await asyncio.sleep(15)
                continue

            # Start next pillar
            for pillar in PILLARS:
                try:
                    async with sess.post(f"{API_URL}/api/ai-images/generate-product-images?pillar={pillar}") as r:
                        result = await r.json() if r.status == 200 else {}
                        if "started" in result.get("message", "").lower() or result.get("status") == "running":
                            log.info(f"Started image generation for pillar: {pillar}")
                            await asyncio.sleep(120)  # Wait 2 mins before checking again
                            break
                        else:
                            log.info(f"Skipped {pillar}: {result}")
                except Exception as e:
                    log.error(f"Error starting {pillar}: {e}")
            
            await asyncio.sleep(30)

if __name__ == "__main__":
    asyncio.run(run())
