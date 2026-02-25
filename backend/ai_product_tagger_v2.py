"""
AI-Assisted Product Tagging Script v2.0
With locked taxonomy and corrected rules
"""

import asyncio
import json
import os
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage

SYSTEM_PROMPT = """You are a Product Intelligence Tagger for a pet (dog) e-commerce company.

GOLDEN RULES:
1. Tag ONLY what the product IS, not when/why it's used
2. Never infer benefits - only tag if explicitly stated
3. Never tag pillars or occasions
4. Provide confidence scores (0.0-1.0) for each tag
5. Flag anything with confidence < 0.7

LOCKED TAXONOMY v1.0:

interaction_type (SINGLE, REQUIRED):
- consumable: eaten, drunk, licked (food, treats, supplements, cakes)
- play: toy, activity, enrichment
- wearable: collars, harnesses, clothing (PET-WORN items only)
- care: grooming, hygiene, medical accessories
- document: paperwork, certificates, guides
- containment: crates, carriers, cages (spatial containment)

usage_frequency (SINGLE, REQUIRED):
- one_time: cakes, birthday items, festive treats, emergency kits
- occasional: cookies, celebratory treats, toys, chews, rewards
- daily: regular meals, daily chews, supplements

mess_level (SINGLE, REQUIRED for consumables):
- low: dry treats, collars, wipes
- medium: wet food, toys
- high: cakes, liquids, raw food, fresh meals

benefits (MULTI, only if EXPLICIT):
digestion, dental_health, skin_coat, joint_support, immunity, weight_management,
urinary_health, cognitive_support, calming, training_support, boredom_relief,
anxiety_relief, mental_stimulation

format (MULTI): dry, soft, liquid, chew, baked, frozen, powder

diet_type (MULTI): grain_free, gluten_free, vegetarian, single_protein, limited_ingredient

protein_source (MULTI): chicken, lamb, beef, fish, egg, peanut, dairy, none

life_stage (MULTI): puppy, adult, senior, all_stages
- DEFAULT to 'adult' unless explicitly stated safe for all stages

breed_size (MULTI): toy, small, medium, large, giant

price_tier (SINGLE):
- budget: <₹300
- mid: ₹300-₹1000
- premium: >₹1000

purchase_pattern (SINGLE):
- impulse: toys, accessories, one-time
- replenishment: food, supplements, daily items
- celebration: cakes, birthday, festive

category_primary (SINGLE, REQUIRED):
food, treats, cakes, toys, grooming, accessories, supplements, services

category_secondary (SINGLE):
- Treats: biscuit, soft_chew, hard_chew, training_treat, celebration_treat
- Cakes: birthday_cake, mini_cake
- Food: fresh_food, wet_food, dry_food, topper
- Toys: squeaky_toy, plush_toy, puzzle_toy, chew_toy
- Accessories: travel_accessory, grooming_tool, collar, leash, harness

SPECIAL RULES:
1. Travel crates/carriers → interaction_type: "containment" (NOT wearable)
2. Squeaky toys → category_secondary: "squeaky_toy" (NOT puzzle_toy)
3. Celebration treats without nutritional benefits → category_secondary: "celebration_treat"
4. Fresh meals → category_secondary: "fresh_food", mess_level: "high"
5. Cakes → usage_frequency: "one_time", mess_level: "high"

RESPONSE FORMAT (JSON only, no markdown):
{
  "product_id": "...",
  "base_tags": {
    "interaction_type": "...",
    "benefits": [],
    "usage_frequency": "...",
    "mess_level": "...",
    "format": [],
    "diet_type": [],
    "protein_source": [],
    "life_stage": [],
    "breed_size": [],
    "price_tier": "...",
    "purchase_pattern": "...",
    "category_primary": "...",
    "category_secondary": "..."
  },
  "confidence_scores": {
    "interaction_type": 0.95,
    ...
  },
  "flags": [],
  "notes": []
}"""

async def tag_product(product: dict) -> dict:
    """Tag a single product using AI"""
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"tagging-v2-{product['id']}",
        system_message=SYSTEM_PROMPT
    ).with_model("openai", "gpt-4o")
    
    product_info = f"""
PRODUCT TO TAG:
- ID: {product['id']}
- Name: {product['name']}
- Description: {product.get('description') or 'N/A'}
- Current Category: {product.get('category') or 'N/A'}
- Price: ₹{product.get('price') or 'N/A'}
- Ingredients: {product.get('ingredients') or 'N/A'}

Generate base tags following the LOCKED TAXONOMY v1.0. Return ONLY valid JSON."""

    user_message = UserMessage(text=product_info)
    
    try:
        response = await chat.send_message(user_message)
        clean_response = response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
        clean_response = clean_response.strip()
        
        result = json.loads(clean_response)
        result['product_name'] = product['name']
        return result
    except json.JSONDecodeError as e:
        return {
            "product_id": product['id'],
            "product_name": product['name'],
            "error": f"JSON parse error: {str(e)}",
            "raw_response": response[:500] if 'response' in dir() else "No response"
        }
    except Exception as e:
        return {
            "product_id": product['id'],
            "product_name": product['name'],
            "error": str(e)
        }

async def main():
    with open('/tmp/sample_products.json', 'r') as f:
        products = json.load(f)
    
    print(f"Tagging {len(products)} products with Taxonomy v1.0...\n")
    
    results = []
    for i, product in enumerate(products, 1):
        print(f"[{i}/{len(products)}] {product['name'][:40]}...")
        result = await tag_product(product)
        results.append(result)
        await asyncio.sleep(0.5)
    
    with open('/tmp/tagged_products_v2.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✅ Done! Results saved to /tmp/tagged_products_v2.json")
    
    # Validation summary
    errors = [r for r in results if 'error' in r]
    
    print(f"\n{'='*60}")
    print("VALIDATION SUMMARY")
    print(f"{'='*60}")
    
    for r in results:
        if 'error' in r:
            print(f"❌ {r['product_name']}: {r['error']}")
            continue
            
        tags = r.get('base_tags', {})
        issues = []
        
        # Required field checks
        if not tags.get('interaction_type'):
            issues.append("missing interaction_type")
        if not tags.get('category_primary'):
            issues.append("missing category_primary")
        if not tags.get('usage_frequency'):
            issues.append("missing usage_frequency")
        if tags.get('interaction_type') == 'consumable' and not tags.get('mess_level'):
            issues.append("consumable missing mess_level")
        if tags.get('category_primary') == 'food' and not tags.get('category_secondary'):
            issues.append("food missing category_secondary")
            
        # Rule violations
        if 'crate' in r['product_name'].lower() or 'carrier' in r['product_name'].lower():
            if tags.get('interaction_type') != 'containment':
                issues.append(f"crate should be containment, got {tags.get('interaction_type')}")
        
        if 'squeaky' in r['product_name'].lower() or 'squeakie' in (r.get('description') or '').lower():
            if tags.get('category_secondary') != 'squeaky_toy':
                issues.append(f"squeaky toy should be squeaky_toy, got {tags.get('category_secondary')}")
        
        if issues:
            print(f"⚠️  {r['product_name']}: {', '.join(issues)}")
        else:
            print(f"✅ {r['product_name']}")

if __name__ == "__main__":
    asyncio.run(main())
