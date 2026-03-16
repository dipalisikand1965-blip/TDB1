"""
batch_score_all_pets.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Triggers Mira Score Engine (Claude Sonnet 4.6) for
EVERY pet × EVERY pillar in the DB.

Run:
  cd /app/backend && python3 batch_score_all_pets.py

Or trigger via API:
  POST /api/mira/batch-score-all-pets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from mira_score_engine import _run_full_scoring, set_database

load_dotenv()

PILLARS = ['dine', 'celebrate', 'care', 'fit', 'adopt']

async def run_batch():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    set_database(db)

    pets = await db.pets.find({}, {'_id': 0, 'id': 1, 'name': 1}).to_list(200)
    print(f"[BatchScore] Found {len(pets)} pets to score")

    for pet in pets:
        pet_id = pet.get('id')
        pet_name = pet.get('name', '?')
        if not pet_id:
            continue
        print(f"\n[BatchScore] Scoring {pet_name} ({pet_id})")
        for pillar in PILLARS:
            try:
                await _run_full_scoring(pet_id, pillar, None)
                print(f"  ✓ {pillar}")
            except Exception as e:
                print(f"  ✗ {pillar}: {e}")

    print(f"\n[BatchScore] Done — scored {len(pets)} pets × {len(PILLARS)} pillars")
    await client.close()

if __name__ == '__main__':
    asyncio.run(run_batch())
