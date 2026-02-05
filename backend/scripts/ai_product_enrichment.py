"""
AI Product Enrichment - Auto-seed suitability fields
=====================================================
Uses AI to analyze product names/descriptions and populate:
- coat_type_match
- energy_level_match
- play_types
- chew_strength
- occasions
- use_case_tags
"""

import asyncio
import os
import logging
import json
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Any, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


async def get_ai_enrichment(product: Dict[str, Any]) -> Dict[str, Any]:
    """Use AI to analyze product and return suitability enrichment."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    name = product.get('name', '')
    description = product.get('description', '') or product.get('basics', {}).get('short_description', '')
    category = product.get('category', '')
    tags = product.get('tags', [])
    
    prompt = f"""Analyze this pet product and return JSON with suitability attributes.

Product: {name}
Category: {category}
Description: {description}
Tags: {', '.join(tags[:10]) if tags else 'none'}

Return ONLY valid JSON (no markdown, no explanation) with these fields:
{{
  "energy_level_match": ["low"|"medium"|"high"|"all"],  // List of applicable energy levels
  "coat_type_match": ["short"|"medium"|"long"|"double_coat"|"curly"],  // Empty if not coat-related
  "play_types": ["fetch"|"tug"|"chew"|"puzzle"|"comfort"|"training"],  // For toys/accessories
  "chew_strength": "gentle"|"moderate"|"power_chewer"|null,  // Only for toys
  "occasions": ["birthday"|"gotcha_day"|"new_puppy"|"travel"|"party"|"holiday"],  // When relevant
  "use_case_tags": ["giftable"|"subscription_friendly"|"travel_friendly"|"indoor"|"outdoor"|"routine_essential"],
  "is_giftable": true|false,
  "subscription_friendly": true|false,
  "travel_friendly": true|false
}}

Be conservative - only include attributes that clearly apply based on the product type and name.
For treats/food: focus on dietary aspects, not play/coat.
For toys: focus on play_types and chew_strength.
For grooming: focus on coat_type_match.
For accessories/apparel: consider all applicable."""

    try:
        llm = LlmChat(
            api_key=os.environ.get("EMERGENT_API_KEY"),
            model="anthropic/claude-sonnet-4-20250514"
        )
        
        response = await llm.send_message_async(
            message=UserMessage(text=prompt),
            max_tokens=500
        )
        
        # Parse JSON from response
        response_text = response.text.strip()
        # Handle markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        return json.loads(response_text)
        
    except Exception as e:
        logger.warning(f"AI enrichment failed for {name}: {e}")
        return {}


def apply_rule_based_enrichment(product: Dict[str, Any]) -> Dict[str, Any]:
    """Apply rule-based enrichment as fallback."""
    name = (product.get('name', '') or '').lower()
    category = (product.get('category', '') or '').lower()
    description = (product.get('description', '') or '').lower()
    combined = f"{name} {category} {description}"
    
    enrichment = {
        "energy_level_match": ["all"],
        "coat_type_match": [],
        "play_types": [],
        "chew_strength": None,
        "occasions": [],
        "use_case_tags": [],
        "is_giftable": False,
        "subscription_friendly": False,
        "travel_friendly": False
    }
    
    # Play types detection
    if any(w in combined for w in ['fetch', 'ball', 'frisbee']):
        enrichment["play_types"].append("fetch")
    if any(w in combined for w in ['tug', 'rope', 'pull']):
        enrichment["play_types"].append("tug")
    if any(w in combined for w in ['chew', 'dental', 'bone', 'antler']):
        enrichment["play_types"].append("chew")
    if any(w in combined for w in ['puzzle', 'interactive', 'kong', 'treat dispenser']):
        enrichment["play_types"].append("puzzle")
    if any(w in combined for w in ['plush', 'comfort', 'cuddle', 'snuggle']):
        enrichment["play_types"].append("comfort")
    if any(w in combined for w in ['training', 'clicker']):
        enrichment["play_types"].append("training")
    
    # Chew strength
    if any(w in combined for w in ['indestructible', 'power chewer', 'aggressive', 'heavy duty', 'super tough']):
        enrichment["chew_strength"] = "power_chewer"
    elif any(w in combined for w in ['gentle', 'soft', 'plush', 'puppy safe']):
        enrichment["chew_strength"] = "gentle"
    elif any(w in combined for w in ['moderate', 'medium']):
        enrichment["chew_strength"] = "moderate"
    
    # Energy levels
    if any(w in combined for w in ['active', 'energy', 'exercise', 'running', 'agility']):
        enrichment["energy_level_match"] = ["high"]
    elif any(w in combined for w in ['calm', 'senior', 'gentle', 'relaxing']):
        enrichment["energy_level_match"] = ["low", "medium"]
    
    # Coat types
    if any(w in combined for w in ['long coat', 'long hair', 'double coat', 'fur']):
        enrichment["coat_type_match"].extend(["long", "double_coat"])
    if any(w in combined for w in ['short coat', 'short hair']):
        enrichment["coat_type_match"].append("short")
    if any(w in combined for w in ['curly', 'poodle', 'doodle']):
        enrichment["coat_type_match"].append("curly")
    if 'grooming' in category or 'brush' in combined:
        enrichment["coat_type_match"] = ["short", "medium", "long", "double_coat", "curly"]
    
    # Occasions
    if any(w in combined for w in ['birthday', 'bday', 'b-day']):
        enrichment["occasions"].append("birthday")
    if any(w in combined for w in ['gotcha', 'adoption']):
        enrichment["occasions"].append("gotcha_day")
    if any(w in combined for w in ['party', 'celebration', 'pawty']):
        enrichment["occasions"].append("party")
    if any(w in combined for w in ['travel', 'road trip', 'vacation']):
        enrichment["occasions"].append("travel")
    if any(w in combined for w in ['christmas', 'diwali', 'holi', 'valentine', 'holiday']):
        enrichment["occasions"].append("holiday")
    if any(w in combined for w in ['new puppy', 'starter', 'welcome']):
        enrichment["occasions"].append("new_puppy")
    
    # Use case tags
    if any(w in combined for w in ['gift', 'hamper', 'box', 'present']):
        enrichment["is_giftable"] = True
        enrichment["use_case_tags"].append("giftable")
    if any(w in combined for w in ['subscribe', 'autoship', 'monthly']):
        enrichment["subscription_friendly"] = True
        enrichment["use_case_tags"].append("subscription_friendly")
    if any(w in combined for w in ['travel', 'portable', 'compact', 'collapsible']):
        enrichment["travel_friendly"] = True
        enrichment["use_case_tags"].append("travel_friendly")
    if any(w in combined for w in ['indoor', 'home', 'house']):
        enrichment["use_case_tags"].append("indoor")
    if any(w in combined for w in ['outdoor', 'park', 'garden', 'outside']):
        enrichment["use_case_tags"].append("outdoor")
    if any(w in combined for w in ['daily', 'everyday', 'essential', 'routine']):
        enrichment["use_case_tags"].append("routine_essential")
    
    # Remove duplicates
    enrichment["coat_type_match"] = list(set(enrichment["coat_type_match"]))
    enrichment["play_types"] = list(set(enrichment["play_types"]))
    enrichment["occasions"] = list(set(enrichment["occasions"]))
    enrichment["use_case_tags"] = list(set(enrichment["use_case_tags"]))
    
    return enrichment


async def enrich_products_with_ai(use_ai: bool = True, limit: int = None, batch_size: int = 50):
    """Enrich all products with suitability data."""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    logger.info("=" * 60)
    logger.info("PRODUCT AI ENRICHMENT")
    logger.info("=" * 60)
    
    # Find products that need enrichment (missing key suitability fields)
    query = {
        "$or": [
            {"suitability.behavior.energy_level_match": {"$exists": False}},
            {"suitability.behavior.energy_level_match": ["all"]},
            {"suitability.behavior.play_types": {"$size": 0}},
            {"suitability.physical_traits.coat_type_match": {"$size": 0}},
            {"pillars_occasions.occasion.occasions": {"$size": 0}},
            {"pillars_occasions.use_case.use_case_tags": {"$size": 0}}
        ]
    }
    
    total_to_process = await db.products_master.count_documents(query)
    if limit:
        total_to_process = min(total_to_process, limit)
    
    logger.info(f"Products needing enrichment: {total_to_process}")
    
    enriched_count = 0
    ai_used = 0
    rule_used = 0
    
    cursor = db.products_master.find(query).limit(limit or 10000)
    
    async for product in cursor:
        product_id = product.get('id')
        name = product.get('name', 'Unknown')
        
        # Get enrichment (AI or rule-based)
        if use_ai and enriched_count < 200:  # Limit AI calls
            enrichment = await get_ai_enrichment(product)
            if enrichment:
                ai_used += 1
            else:
                enrichment = apply_rule_based_enrichment(product)
                rule_used += 1
        else:
            enrichment = apply_rule_based_enrichment(product)
            rule_used += 1
        
        # Apply enrichment to product
        update = {
            "suitability.behavior.energy_level_match": enrichment.get("energy_level_match", ["all"]),
            "suitability.behavior.play_types": enrichment.get("play_types", []),
            "suitability.behavior.chew_strength": enrichment.get("chew_strength"),
            "suitability.physical_traits.coat_type_match": enrichment.get("coat_type_match", []),
            "pillars_occasions.occasion.occasions": enrichment.get("occasions", []),
            "pillars_occasions.use_case.use_case_tags": enrichment.get("use_case_tags", []),
            "pillars_occasions.use_case.is_giftable": enrichment.get("is_giftable", False),
            "pillars_occasions.use_case.subscription_friendly": enrichment.get("subscription_friendly", False),
            "pillars_occasions.use_case.travel_friendly": enrichment.get("travel_friendly", False),
            "_ai_enriched_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.products_master.update_one(
            {"_id": product["_id"]},
            {"$set": update}
        )
        
        enriched_count += 1
        
        if enriched_count % batch_size == 0:
            logger.info(f"  Enriched {enriched_count}/{total_to_process} products...")
    
    logger.info(f"\n✅ ENRICHMENT COMPLETE")
    logger.info(f"  Total enriched: {enriched_count}")
    logger.info(f"  AI-powered: {ai_used}")
    logger.info(f"  Rule-based: {rule_used}")
    
    return {
        "total_enriched": enriched_count,
        "ai_used": ai_used,
        "rule_used": rule_used
    }


async def main():
    """Run AI enrichment."""
    print("\n" + "=" * 70)
    print("   THE DOGGY COMPANY - AI PRODUCT ENRICHMENT")
    print("   Auto-populating suitability fields")
    print("=" * 70)
    
    # Start with rule-based (fast), then optionally add AI
    result = await enrich_products_with_ai(use_ai=True, limit=500, batch_size=50)
    
    print("\n" + "=" * 70)
    print("   ENRICHMENT SUMMARY")
    print("=" * 70)
    print(f"   Products enriched: {result['total_enriched']}")
    print(f"   AI-powered: {result['ai_used']}")
    print(f"   Rule-based: {result['rule_used']}")
    print("=" * 70 + "\n")
    
    return result


if __name__ == "__main__":
    asyncio.run(main())
