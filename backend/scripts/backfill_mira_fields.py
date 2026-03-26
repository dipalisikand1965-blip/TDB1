#!/usr/bin/env python3
"""
backfill_mira_fields.py — AI-powered backfill for size_tags, life_stages, mira_can_suggest

Uses Claude claude-4-sonnet-20250514 to auto-detect size and life stage from each product's
name + description + category. Runs on ALL products in products_master.

Usage:
    cd /app/backend && python3 scripts/backfill_mira_fields.py [--dry-run] [--limit N]
"""

import asyncio
import os
import sys
import json
import re
import argparse
from motor.motor_asyncio import AsyncIOMotorClient

# ── Config ─────────────────────────────────────────────────────────────────
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME   = os.environ.get("DB_NAME", "doggy_db")
LLM_KEY   = os.environ.get("EMERGENT_LLM_KEY")
BATCH_SIZE = 20   # Products per Claude call (batch mode for efficiency)

# ── Classification helpers ──────────────────────────────────────────────────
SIZE_KEYWORDS = {
    'xs':     ['toy', 'teacup', 'mini', 'miniature', 'tiny', 'pocket', 'extra small', 'xs '],
    'small':  ['small breed', 'small dog', 'small size', 'for small', 'little', 'compact', 'puppy size'],
    'medium': ['medium breed', 'medium dog', 'medium size', 'for medium'],
    'large':  ['large breed', 'large dog', 'large size', 'for large', 'big dog', 'giant', 'oversized'],
}
STAGE_KEYWORDS = {
    'puppy':  ['puppy', 'pup', 'junior', 'kitten', 'baby', 'young', 'starter', '8 week', 'new born', 'weaning'],
    'senior': ['senior', 'old', 'elderly', 'mature', 'golden age', 'aging', 'geriatric', '7+', '8+', '10+'],
    'adult':  ['adult', 'grown', 'all ages', 'all life', 'all stage'],
}

def rule_based_classify(name: str, description: str, category: str):
    """Fast keyword-based fallback before using AI."""
    combined = f"{name} {description} {category}".lower()
    size_tags  = []
    life_stages = []

    for size, keywords in SIZE_KEYWORDS.items():
        if any(kw in combined for kw in keywords):
            size_tags.append(size)
    for stage, keywords in STAGE_KEYWORDS.items():
        if any(kw in combined for kw in keywords):
            life_stages.append(stage)

    return size_tags, life_stages


async def ai_classify_batch(products: list, llm_key: str) -> dict:
    """Use Claude to classify a batch of products. Returns {product_id: {size_tags, life_stages}}"""
    if not llm_key:
        return {}

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import uuid

        product_list = []
        for p in products:
            product_list.append({
                "id": str(p.get("_id", p.get("id", ""))),
                "name": p.get("name", ""),
                "description": (p.get("description", "") or "")[:200],
                "category": p.get("category", ""),
                "sub_category": p.get("sub_category", ""),
            })

        prompt = f"""Classify each product for a pet e-commerce store.
For each product, return:
- size_tags: array of applicable sizes from ["xs", "small", "medium", "large"]. Empty array if universal/no specific size.
- life_stages: array of applicable stages from ["puppy", "adult", "senior"]. Empty array if universal/all ages.

Products:
{json.dumps(product_list, indent=2)}

Return ONLY a JSON object where keys are product IDs and values have size_tags and life_stages.
Example: {{"abc123": {{"size_tags": ["small"], "life_stages": ["puppy"]}}, "def456": {{"size_tags": [], "life_stages": ["senior"]}}}}
If a product is universal (works for all sizes/ages), return empty arrays for that field."""

        chat = LlmChat(
            api_key=llm_key,
            session_id=f"backfill_{uuid.uuid4().hex[:8]}",
            system_message="You are a product classification assistant for a pet store. Return ONLY valid JSON, no markdown.",
        ).with_model("anthropic", "claude-4-sonnet-20250514")

        response = await chat.send_message(UserMessage(text=prompt))

        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        print(f"  [AI] Batch classification error: {e}")
    return {}


async def run_backfill(dry_run: bool = False, limit: int = None):
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    col = db["products_master"]

    # Fetch products that need backfilling (no size_tags OR no life_stages OR no mira_can_suggest)
    query = {
        "$or": [
            {"size_tags": {"$exists": False}},
            {"size_tags": {"$size": 0}, "life_stages": {"$exists": False}},
            {"mira_can_suggest": {"$exists": False}},
        ]
    }
    total = await col.count_documents(query)
    print(f"Products needing backfill: {total}")

    cursor = col.find(query, {"_id": 1, "name": 1, "description": 1, "category": 1, "sub_category": 1, "is_active": 1})
    if limit:
        cursor = cursor.limit(limit)

    products = await cursor.to_list(length=limit or 10000)
    print(f"Processing {len(products)} products...")

    updated = 0
    skipped = 0
    errors  = 0

    # Process in batches of BATCH_SIZE
    for i in range(0, len(products), BATCH_SIZE):
        batch = products[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(products) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"\nBatch {batch_num}/{total_batches} ({len(batch)} products)...")

        # Step 1: Rule-based classification
        rule_results = {}
        for p in batch:
            pid = str(p["_id"])
            size_tags, life_stages = rule_based_classify(
                p.get("name", ""),
                p.get("description", "") or "",
                p.get("category", ""),
            )
            rule_results[pid] = {"size_tags": size_tags, "life_stages": life_stages}

        # Step 2: AI classification for products where rule-based found nothing
        needs_ai = [p for p in batch if not rule_results[str(p["_id"])]["size_tags"]
                    and not rule_results[str(p["_id"])]["life_stages"]]

        ai_results = {}
        if needs_ai and LLM_KEY:
            print(f"  AI classifying {len(needs_ai)} products without rule matches...")
            ai_results = await ai_classify_batch(needs_ai, LLM_KEY)

        # Step 3: Merge and update
        for p in batch:
            pid = str(p["_id"])
            rule = rule_results[pid]
            ai   = ai_results.get(pid, {})

            final_size   = list(set(rule["size_tags"]  + ai.get("size_tags", [])))
            final_stages = list(set(rule["life_stages"] + ai.get("life_stages", [])))

            update = {
                "size_tags":       final_size,
                "life_stages":     final_stages,
                "mira_can_suggest": True,  # default True for all active products
            }

            if dry_run:
                name = p.get("name", "?")[:50]
                print(f"  [DRY] {name} → size: {final_size or 'universal'}, stage: {final_stages or 'all ages'}")
                skipped += 1
            else:
                try:
                    result = await col.update_one({"_id": p["_id"]}, {"$set": update})
                    if result.modified_count > 0:
                        updated += 1
                    else:
                        skipped += 1
                except Exception as e:
                    print(f"  ERROR updating {p.get('name', '?')}: {e}")
                    errors += 1

        # Small delay to avoid rate limits
        await asyncio.sleep(0.5)

    print(f"\n{'[DRY RUN] Would update' if dry_run else 'Updated'}: {updated if not dry_run else len(products)} products")
    if not dry_run:
        print(f"Skipped (no change): {skipped}")
        print(f"Errors: {errors}")
    client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backfill Mira product fields")
    parser.add_argument("--dry-run", action="store_true", help="Preview without updating")
    parser.add_argument("--limit", type=int, default=None, help="Max products to process")
    args = parser.parse_args()

    if not MONGO_URL:
        print("ERROR: MONGO_URL not set")
        sys.exit(1)

    asyncio.run(run_backfill(dry_run=args.dry_run, limit=args.limit))
