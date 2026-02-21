"""
AI-Assisted Product Tagging Script
Phase 1: Calibration - 20 products
"""

import asyncio
import json
import os
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage

# Taxonomy definitions
TAXONOMY = {
    "interaction_type": ["consumable", "play", "wearable", "care", "document"],
    "benefits": [
        "digestion", "dental_health", "skin_coat", "joint_support", "immunity",
        "weight_management", "urinary_health", "cognitive_support",
        "calming", "training_support", "boredom_relief", "anxiety_relief", "mental_stimulation"
    ],
    "usage_frequency": ["one_time", "occasional", "daily"],
    "mess_level": ["low", "medium", "high"],
    "format": ["dry", "soft", "liquid", "chew", "baked", "frozen", "powder"],
    "diet_type": ["grain_free", "gluten_free", "vegetarian", "single_protein", "limited_ingredient"],
    "protein_source": ["chicken", "lamb", "beef", "fish", "egg", "peanut", "dairy", "none"],
    "life_stage": ["puppy", "adult", "senior", "all_stages"],
    "breed_size": ["toy", "small", "medium", "large", "giant"],
    "price_tier": ["budget", "mid", "premium"],
    "purchase_pattern": ["impulse", "replenishment", "celebration"],
    "category_primary": ["food", "treats", "cakes", "toys", "grooming", "accessories", "supplements", "services"],
    "category_secondary": [
        "biscuit", "soft_chew", "hard_chew", "training_treat", "birthday_cake",
        "topper", "puzzle_toy", "grooming_tool", "travel_accessory"
    ]
}

SYSTEM_PROMPT = """You are a Product Intelligence Tagger for a pet (dog) e-commerce company.

Your job is to analyze product information and generate ONLY factual base tags according to a strict taxonomy.

GOLDEN RULES:
1. Tag ONLY what the product IS, not when/why it's used
2. Never infer benefits - only tag if explicitly stated
3. Never tag pillars or occasions
4. Provide confidence scores (0.0-1.0) for each tag
5. Flag anything with confidence < 0.7

VALID TAXONOMY VALUES:
- interaction_type (SINGLE): consumable, play, wearable, care, document
- benefits (MULTI): digestion, dental_health, skin_coat, joint_support, immunity, weight_management, urinary_health, cognitive_support, calming, training_support, boredom_relief, anxiety_relief, mental_stimulation
- usage_frequency (SINGLE): one_time, occasional, daily
- mess_level (SINGLE): low, medium, high
- format (MULTI): dry, soft, liquid, chew, baked, frozen, powder
- diet_type (MULTI): grain_free, gluten_free, vegetarian, single_protein, limited_ingredient
- protein_source (MULTI): chicken, lamb, beef, fish, egg, peanut, dairy, none
- life_stage (MULTI): puppy, adult, senior, all_stages
- breed_size (MULTI): toy, small, medium, large, giant
- price_tier (SINGLE): budget, mid, premium
- purchase_pattern (SINGLE): impulse, replenishment, celebration
- category_primary (SINGLE): food, treats, cakes, toys, grooming, accessories, supplements, services
- category_secondary (SINGLE): biscuit, soft_chew, hard_chew, training_treat, birthday_cake, topper, puzzle_toy, grooming_tool, travel_accessory

RESPONSE FORMAT (JSON only, no markdown):
{
  "product_id": "...",
  "base_tags": {
    "interaction_type": "...",
    "benefits": [...],
    "usage_frequency": "...",
    "mess_level": "...",
    "format": [...],
    "diet_type": [...],
    "protein_source": [...],
    "life_stage": [...],
    "breed_size": [...],
    "price_tier": "...",
    "purchase_pattern": "...",
    "category_primary": "...",
    "category_secondary": "..."
  },
  "confidence_scores": {
    "interaction_type": 0.95,
    "benefits.training_support": 0.85,
    ...
  },
  "flags": ["reason for low confidence if any"],
  "notes": ["any observations"]
}"""

async def tag_product(product: dict) -> dict:
    """Tag a single product using AI"""
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"tagging-{product['id']}",
        system_message=SYSTEM_PROMPT
    ).with_model("openai", "gpt-4o")
    
    # Build product info string
    product_info = f"""
PRODUCT TO TAG:
- ID: {product['id']}
- Name: {product['name']}
- Description: {product.get('description') or 'N/A'}
- Current Category: {product.get('category') or 'N/A'}
- Price: ₹{product.get('price') or 'N/A'}
- Ingredients: {product.get('ingredients') or 'N/A'}

Generate base tags with confidence scores. Return ONLY valid JSON."""

    user_message = UserMessage(text=product_info)
    
    try:
        response = await chat.send_message(user_message)
        # Parse JSON response
        # Clean up response if it has markdown
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
    # Load sample products
    with open('/tmp/sample_products.json', 'r') as f:
        products = json.load(f)
    
    print(f"Tagging {len(products)} products...\n")
    
    results = []
    for i, product in enumerate(products, 1):
        print(f"[{i}/{len(products)}] Tagging: {product['name'][:40]}...")
        result = await tag_product(product)
        results.append(result)
        
        # Brief delay to avoid rate limits
        await asyncio.sleep(0.5)
    
    # Save results
    with open('/tmp/tagged_products.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✅ Done! Results saved to /tmp/tagged_products.json")
    
    # Summary
    errors = [r for r in results if 'error' in r]
    flagged = [r for r in results if r.get('flags')]
    
    print(f"\nSummary:")
    print(f"  - Total: {len(results)}")
    print(f"  - Errors: {len(errors)}")
    print(f"  - Flagged for review: {len(flagged)}")

if __name__ == "__main__":
    asyncio.run(main())
