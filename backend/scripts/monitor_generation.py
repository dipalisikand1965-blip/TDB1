#!/usr/bin/env python3
"""
Auto-monitor and trigger soul product generation in sequence.
Runs until all batches are complete.

Queue:
  1. adopt      (34 pending)
  2. farewell   (63 pending)
  3. corgi      (57 pending)
  4. basenji    (57 pending)
  5. bichon_frise (57 pending)
  6. saint_bernard (57 pending)
"""

import asyncio
import aiohttp
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

API = "https://pet-soul-ranking.preview.emergentagent.com"
DB_URL = "mongodb://localhost:27017"
DB_NAME = "pet-os-live-test_database"

QUEUE = [
    {"pillar": "adopt",    "breed_filter": None,          "label": "ADOPT"},
    {"pillar": "farewell", "breed_filter": None,          "label": "FAREWELL"},
    {"pillar": None,       "breed_filter": "corgi",       "label": "CORGI"},
    {"pillar": None,       "breed_filter": "basenji",     "label": "BASENJI"},
    {"pillar": None,       "breed_filter": "bichon_frise","label": "BICHON FRISE"},
    {"pillar": None,       "breed_filter": "saint_bernard","label": "SAINT BERNARD"},
]

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

async def count_pending(db, pillar=None, breed=None):
    # API sets mockup_url when done — check that field, not cloudinary_url
    query = {
        "is_active": True,
        "mockup_prompt": {"$exists": True, "$ne": ""},
        "$or": [
            {"mockup_url": {"$in": [None, ""]}},
            {"mockup_url": {"$exists": False}},
        ]
    }
    if pillar:
        query["$or"] = [{"pillar": pillar}, {"pillars": {"$in": [pillar]}}]
        query["is_active"] = True
        query["mockup_prompt"] = {"$exists": True, "$ne": ""}
        query2 = {"$and": [
            {"is_active": True},
            {"mockup_prompt": {"$exists": True, "$ne": ""}},
            {"$or": [{"mockup_url": {"$in": [None,""]}}, {"mockup_url": {"$exists": False}}]},
            {"$or": [{"pillar": pillar}, {"pillars": {"$in": [pillar]}}]}
        ]}
        return await db.breed_products.count_documents(query2)
    if breed:
        query["breed"] = breed
    return await db.breed_products.count_documents(query)

async def count_done(db, pillar=None, breed=None):
    query = {
        "is_active": True,
        "mockup_url": {"$nin": [None, ""]},
    }
    if pillar:
        query["$or"] = [{"pillar": pillar}, {"pillars": {"$in": [pillar]}}]
    if breed:
        query["breed"] = breed
    return await db.breed_products.count_documents(query)

async def trigger_batch(session, pillar=None, breed=None):
    payload = {"limit": 100}
    if pillar:
        payload["pillar"] = pillar
    if breed:
        payload["breed_filter"] = breed
    try:
        async with session.post(
            f"{API}/api/mockups/generate-batch",
            json=payload,
            timeout=aiohttp.ClientTimeout(total=30)
        ) as resp:
            data = await resp.json()
            return data
    except Exception as e:
        return {"error": str(e)}

async def is_batch_running(session):
    try:
        async with session.get(
            f"{API}/api/mockups/status",
            timeout=aiohttp.ClientTimeout(total=10)
        ) as resp:
            data = await resp.json()
            return data.get("running", False)
    except Exception:
        # Timeout usually means it IS running (busy processing)
        return True

async def main():
    db = AsyncIOMotorClient(DB_URL)[DB_NAME]
    
    log("=== Soul Product Generation Monitor Started ===")
    log(f"Queue: {[q['label'] for q in QUEUE]}")
    log("")

    connector = aiohttp.TCPConnector(limit=5)
    async with aiohttp.ClientSession(connector=connector) as session:
        
        for step in QUEUE:
            label    = step["label"]
            pillar   = step.get("pillar")
            breed    = step.get("breed_filter")

            # Check how many are pending for this step
            pending = await count_pending(db, pillar=pillar, breed=breed)
            log(f"--- {label}: {pending} pending ---")

            if pending == 0:
                log(f"  {label}: Nothing to generate — skipping.")
                continue

            # Wait until previous batch is fully done
            log(f"  Waiting for any running batch to finish...")
            while True:
                running = await is_batch_running(session)
                if not running:
                    break
                still_pending = await count_pending(db, pillar=None, breed=None)
                log(f"  Still running... {still_pending} total pending across all. Waiting 30s.")
                await asyncio.sleep(30)

            # Trigger this batch
            log(f"  Triggering {label} batch...")
            result = trigger_result = await trigger_batch(session, pillar=pillar, breed=breed)
            if "error" in result:
                log(f"  ERROR triggering {label}: {result['error']}")
                continue
            log(f"  {label} started: {result.get('pending',0)} queued")

            # Monitor until this batch is done
            last_pending = pending
            while True:
                await asyncio.sleep(30)
                
                current_pending = await count_pending(db, pillar=pillar, breed=breed)
                current_done    = await count_done(db,    pillar=pillar, breed=breed)
                
                log(f"  {label}: {current_pending} pending | {current_done} done")
                
                if current_pending == 0:
                    log(f"  ✅ {label} COMPLETE!")
                    break
                
                # If stuck for too long, re-trigger (batch may have crashed)
                if current_pending == last_pending:
                    running = await is_batch_running(session)
                    if not running:
                        log(f"  Batch stopped but {current_pending} still pending. Re-triggering...")
                        await trigger_batch(session, pillar=pillar, breed=breed)
                
                last_pending = current_pending

            log("")

    log("=== ALL BATCHES COMPLETE ===")
    
    # Final summary
    db2 = AsyncIOMotorClient(DB_URL)[DB_NAME]
    log("\nFinal member-facing counts:")
    for breed in ["corgi","basenji","bichon_frise","saint_bernard","indie","labrador"]:
        count = await db2.products_master.count_documents({
            "soul_made": True, "breed_tags": breed, "visibility.status": "active"
        })
        log(f"  {breed}: {count} products")

asyncio.run(main())
