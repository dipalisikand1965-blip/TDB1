"""
One-shot script: copy partner_demos collection from preview MongoDB to production.
Safe to re-run — uses upsert by slug, no duplicates.
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

PREVIEW_URL = os.environ["MONGO_URL"]
PROD_URL = os.environ["PRODUCTION_MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]


async def main():
    preview = AsyncIOMotorClient(PREVIEW_URL)[DB_NAME]
    prod = AsyncIOMotorClient(
        PROD_URL,
        tls=True,
        tlsAllowInvalidCertificates=False,
        serverSelectionTimeoutMS=20000,
    )[DB_NAME]

    # Sanity check: production reachable
    await prod.command("ping")
    print(f"✓ Connected to production MongoDB ({DB_NAME})")

    docs = await preview.partner_demos.find({}, {"_id": 0}).to_list(length=200)
    print(f"Found {len(docs)} demos in preview")

    pushed = 0
    for d in docs:
        await prod.partner_demos.update_one(
            {"slug": d["slug"]},
            {"$set": d},
            upsert=True,
        )
        pushed += 1
        print(f"  ↑ {d['slug']:<35} ({d['partner_name']}) — pet: {d['generated']['demo_pet']['name']}")

    # Verify
    final_count = await prod.partner_demos.count_documents({})
    print(f"\n✓ {pushed} demos pushed to production")
    print(f"✓ Production now has {final_count} total partner_demos")


asyncio.run(main())
