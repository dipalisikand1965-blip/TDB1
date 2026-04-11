"""
allergen_tag_dryrun.py
======================
DRY RUN — Fetches 10 consumable products from production API,
sends each to GPT-4o, derives allergen_contains from protein_source.

Reports back: product name, AI-derived allergen_contains, confidence.
DOES NOT write to DB. Safe to run anytime.

Usage:
  python3 /app/backend/scripts/allergen_tag_dryrun.py
"""

import asyncio
import json
import os
import sys
import re
import requests
sys.path.insert(0, '/app/backend')
from dotenv import load_dotenv
load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage

API_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://pet-soul-ranking.preview.emergentagent.com")
LLM_KEY = "sk-emergent-cEb0eF956Fa6741A31"

# Protein/allergen sources the tagger recognises
PROTEIN_TO_ALLERGEN = {
    "chicken": "chicken",
    "lamb": "lamb",
    "beef": "beef",
    "fish": "fish",
    "egg": "egg",
    "peanut": "peanut",
    "dairy": "dairy",
}

SYSTEM_PROMPT = """You are a pet food allergen safety tagger.

For each product, output ONLY valid JSON (no markdown):
{
  "protein_source": [],       // MULTI: chicken, lamb, beef, fish, egg, peanut, dairy, none
  "allergen_contains": [],    // DERIVED from protein_source — list only actual allergens present
  "allergen_free_from": [],   // allergens this product is explicitly free from
  "confidence": 0.0           // 0.0-1.0 overall confidence
}

RULES:
- protein_source lists what protein(s) the product contains
- allergen_contains = protein_source minus any "free from" claims
- If product name says "chicken-free" or "no chicken" → allergen_free_from: ["chicken"]
- Non-food products (toys, accessories, beds) → protein_source: ["none"], allergen_contains: []
- "Salmon" = fish. "Tuna" = fish. "Sardine" = fish.
- Confidence < 0.7 if product name alone is ambiguous (e.g. "Protein Plus")
"""

async def tag_product(product: dict) -> dict:
    name = product.get("name", "Unknown")
    category = product.get("category", "")
    sub_cat = product.get("sub_category", "")
    desc = (product.get("description") or product.get("desc") or "")[:200]
    ingredients = product.get("ingredients", [])
    price = product.get("original_price") or product.get("price") or 0

    prompt = f"""Product to tag:
Name: {name}
Category: {category} / {sub_cat}
Price: ₹{price}
Description: {desc[:150]}
Ingredients (if available): {', '.join(ingredients[:10]) if ingredients else 'not listed'}
"""

    chat = LlmChat(
        api_key=LLM_KEY,
        session_id=f"dryrun-{product.get('id', 'x')[:15]}",
        system_message=SYSTEM_PROMPT
    ).with_model("openai", "gpt-4o-mini")

    try:
        resp = await chat.send_message(UserMessage(text=prompt))
        text = resp.strip()
        # Strip markdown if present
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        result = json.loads(text)
        return {"name": name, "id": product.get("id"), "result": result, "error": None}
    except Exception as e:
        return {"name": name, "id": product.get("id"), "result": None, "error": str(e)}


async def main():
    print("=" * 70)
    print("ALLERGEN TAGGER — DRY RUN (10 products, no DB writes)")
    print("=" * 70)

    # Fetch products from production API — prioritise dine/care (most allergen-relevant)
    admin_creds = ("aditya", "lola4304")
    sample_products = []

    for pillar in ["dine", "care", "celebrate"]:
        try:
            r = requests.get(
                f"{API_URL}/api/admin/pillar-products?pillar={pillar}&limit=30",
                auth=admin_creds, timeout=10
            )
            prods = r.json().get("products", [])
            # Pick diverse: first 3 from each pillar
            sample_products.extend(prods[:4])
            if len(sample_products) >= 10:
                break
        except Exception as e:
            print(f"  Warning: Could not fetch {pillar} products: {e}")

    sample_products = sample_products[:10]
    print(f"\nFetched {len(sample_products)} products for tagging\n")

    results = await asyncio.gather(*[tag_product(p) for p in sample_products])

    print(f"{'Product Name':<40} {'allergen_contains':<25} {'free_from':<20} {'conf'}")
    print("-" * 95)

    issues = []
    for r in results:
        if r["error"]:
            print(f"  ERROR tagging {r['name']}: {r['error']}")
            continue
        res = r["result"]
        allergens = ", ".join(res.get("allergen_contains", [])) or "none"
        free_from = ", ".join(res.get("allergen_free_from", [])) or "-"
        conf = res.get("confidence", 0)
        flag = " ⚠️ LOW CONF" if conf < 0.7 else ""
        print(f"  {r['name'][:38]:<40} {allergens:<25} {free_from:<20} {conf:.2f}{flag}")

        if conf < 0.7:
            issues.append(r["name"])

    print("\n" + "=" * 70)
    print(f"DRY RUN COMPLETE: {len(results)} products tagged")
    if issues:
        print(f"⚠️  Low confidence on {len(issues)} products — review manually before full run:")
        for p in issues:
            print(f"   - {p}")
    else:
        print("✅ All products tagged with confidence ≥ 0.7 — safe to run full batch")
    print()
    print("NEXT STEP: If results look correct, run the full batch tagger.")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
