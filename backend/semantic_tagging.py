"""
AI Semantic Tagging Script
Tags products and services with semantic_intents using GPT-4o
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
from datetime import datetime
from openai import OpenAI

# Emergent LLM Key
EMERGENT_KEY = "sk-emergent-cEb0eF956Fa6741A31"

# Initialize OpenAI client with Emergent
client = OpenAI(
    api_key=EMERGENT_KEY,
    base_url="https://api.emergentmethods.ai/v1"
)

# The 24 semantic intents
SEMANTIC_INTENTS = [
    "birthday_celebration",  # Cakes, parties, celebrations
    "home_decor",           # Home accessories, decor items
    "training_behavior",    # Training, behavior modification
    "fashion_wearables",    # Clothing, accessories, collars
    "travel_adventure",     # Travel gear, carriers, outdoor
    "everyday_treats",      # Daily treats, snacks
    "fresh_food",           # Fresh meals, food
    "play_enrichment",      # Toys, games, enrichment
    "skin_coat",            # Grooming, skin/coat care
    "dining_cafe",          # Pet-friendly restaurants, cafes
    "weight_fitness",       # Fitness, weight management
    "swimming_spa",         # Swimming, spa services
    "puppy_essentials",     # Puppy-specific items
    "senior_care",          # Senior dog care
    "joint_mobility",       # Joint health, mobility
    "dental_oral",          # Dental care, oral health
    "boarding_stay",        # Boarding, daycare, stays
    "emergency_care",       # Emergency services, vet
    "digestion_gut",        # Digestive health
    "memorial_farewell",    # Memorial, farewell services
    "calm_anxiety",         # Anxiety relief, calming
    "documentation_legal",  # Pet documents, legal
    "consultation_advice",  # Advisory, consultation
    "safety_id",            # Safety, ID tags
]

INTENT_DESCRIPTIONS = """
- birthday_celebration: Birthday cakes, party supplies, celebration items, gotcha day
- home_decor: Home accessories, pet-themed decor, furniture
- training_behavior: Training treats, behavior aids, obedience
- fashion_wearables: Clothing, bandanas, collars, harnesses, accessories
- travel_adventure: Travel carriers, car seats, outdoor gear, adventure items
- everyday_treats: Daily treats, snacks, regular rewards
- fresh_food: Fresh meals, cooked food, raw diet
- play_enrichment: Toys, puzzles, enrichment activities
- skin_coat: Grooming products, shampoos, skin care, coat care
- dining_cafe: Pet-friendly restaurants, cafes, dining out
- weight_fitness: Fitness programs, weight management, exercise
- swimming_spa: Swimming, hydrotherapy, spa treatments
- puppy_essentials: Puppy food, training pads, teething toys
- senior_care: Senior dog food, supplements, comfort items
- joint_mobility: Joint supplements, mobility aids, orthopedic beds
- dental_oral: Dental chews, toothpaste, oral care
- boarding_stay: Boarding facilities, daycare, pet hotels
- emergency_care: Emergency vet, first aid, urgent care
- digestion_gut: Probiotics, digestive aids, gut health
- memorial_farewell: Memorial services, urns, farewell
- calm_anxiety: Calming treats, anxiety relief, thunder shirts
- documentation_legal: Pet insurance, documents, microchipping
- consultation_advice: Vet consultation, nutritionist, behaviorist
- safety_id: ID tags, GPS trackers, safety gear
"""

async def tag_with_ai(name: str, description: str, pillar: str, category: str = None) -> dict:
    """Use GPT-4o to assign semantic intents and generate mira_hint"""
    
    prompt = f"""Analyze this pet product/service and return a JSON object with:
1. "semantic_intents": Array of 1-4 most relevant intents from the list below
2. "mira_hint": A short (under 80 chars), engaging description starting with an emoji that highlights the pet benefit

Available intents:
{INTENT_DESCRIPTIONS}

Item to analyze:
- Name: {name}
- Description: {description[:300] if description else 'N/A'}
- Pillar: {pillar}
- Category: {category or 'N/A'}

Return ONLY valid JSON like:
{{"semantic_intents": ["intent1", "intent2"], "mira_hint": "🎂 Perfect for birthday celebrations!"}}
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a pet product tagger. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=200
        )
        
        result_text = response.choices[0].message.content.strip()
        # Clean up markdown if present
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        result_text = result_text.strip()
        
        result = json.loads(result_text)
        
        # Validate intents
        valid_intents = [i for i in result.get("semantic_intents", []) if i in SEMANTIC_INTENTS]
        
        return {
            "semantic_intents": valid_intents[:4],
            "semantic_tags": valid_intents[:4],  # Same as intents
            "mira_hint": result.get("mira_hint", "")[:100]
        }
    except Exception as e:
        print(f"    Error tagging '{name}': {e}")
        return None

async def run_tagging():
    mongo_url = os.environ.get('MONGO_URL')
    mongo_client = AsyncIOMotorClient(mongo_url)
    db = mongo_client.test_database
    
    stats = {
        "services_master_tagged": 0,
        "service_catalog_tagged": 0,
        "products_semantic_tagged": 0,
        "products_hint_generated": 0,
        "errors": 0
    }
    
    print("=" * 70)
    print("🏷️ AI SEMANTIC TAGGING SCRIPT")
    print("=" * 70)
    print(f"Started: {datetime.now().isoformat()}")
    
    # =========================================================================
    # 1. TAG SERVICES_MASTER (695 services)
    # =========================================================================
    print("\n📦 Phase 1: Tagging services_master...")
    print("-" * 70)
    
    services_master = await db.services_master.find(
        {"$or": [
            {"semantic_intents": {"$exists": False}},
            {"semantic_intents": []},
            {"semantic_intents": None}
        ]},
        {"_id": 1, "name": 1, "description": 1, "pillar": 1, "category": 1}
    ).to_list(700)
    
    print(f"Found {len(services_master)} services to tag")
    
    batch_size = 10
    for i in range(0, len(services_master), batch_size):
        batch = services_master[i:i+batch_size]
        print(f"  Processing batch {i//batch_size + 1}/{(len(services_master) + batch_size - 1)//batch_size}...")
        
        for svc in batch:
            result = await tag_with_ai(
                svc.get('name', ''),
                svc.get('description', ''),
                svc.get('pillar', ''),
                svc.get('category', '')
            )
            
            if result and result.get('semantic_intents'):
                await db.services_master.update_one(
                    {"_id": svc["_id"]},
                    {"$set": {
                        "semantic_intents": result["semantic_intents"],
                        "semantic_tags": result["semantic_tags"],
                        "ai_tagged_at": datetime.now().isoformat()
                    }}
                )
                stats["services_master_tagged"] += 1
            else:
                stats["errors"] += 1
        
        # Rate limiting
        await asyncio.sleep(0.5)
    
    print(f"  ✅ Tagged {stats['services_master_tagged']} services in services_master")
    
    # =========================================================================
    # 2. TAG SERVICE_CATALOG (89 services)
    # =========================================================================
    print("\n📦 Phase 2: Tagging service_catalog...")
    print("-" * 70)
    
    service_catalog = await db.service_catalog.find(
        {"$or": [
            {"semantic_intents": {"$exists": False}},
            {"semantic_intents": []},
            {"semantic_intents": None}
        ]},
        {"_id": 1, "name": 1, "description": 1, "pillar": 1}
    ).to_list(100)
    
    print(f"Found {len(service_catalog)} services to tag")
    
    for svc in service_catalog:
        result = await tag_with_ai(
            svc.get('name', ''),
            svc.get('description', ''),
            svc.get('pillar', ''),
            None
        )
        
        if result and result.get('semantic_intents'):
            await db.service_catalog.update_one(
                {"_id": svc["_id"]},
                {"$set": {
                    "semantic_intents": result["semantic_intents"],
                    "semantic_tags": result["semantic_tags"],
                    "ai_tagged_at": datetime.now().isoformat()
                }}
            )
            stats["service_catalog_tagged"] += 1
        else:
            stats["errors"] += 1
        
        await asyncio.sleep(0.3)
    
    print(f"  ✅ Tagged {stats['service_catalog_tagged']} services in service_catalog")
    
    # =========================================================================
    # 3. TAG PRODUCTS MISSING SEMANTIC_INTENTS (124 products)
    # =========================================================================
    print("\n📦 Phase 3: Tagging products missing semantic_intents...")
    print("-" * 70)
    
    products_no_semantic = await db.products_master.find(
        {"$or": [
            {"semantic_intents": {"$exists": False}},
            {"semantic_intents": []},
            {"semantic_intents": None}
        ]},
        {"_id": 1, "name": 1, "description": 1, "pillar": 1, "category": 1}
    ).to_list(150)
    
    print(f"Found {len(products_no_semantic)} products to tag")
    
    for prod in products_no_semantic:
        result = await tag_with_ai(
            prod.get('name', ''),
            prod.get('description', ''),
            prod.get('pillar', ''),
            prod.get('category', '')
        )
        
        if result and result.get('semantic_intents'):
            update_data = {
                "semantic_intents": result["semantic_intents"],
                "semantic_tags": result["semantic_tags"],
                "ai_tagged_at": datetime.now().isoformat()
            }
            # Also add mira_hint if generated
            if result.get('mira_hint'):
                update_data["mira_hint"] = result["mira_hint"]
            
            await db.products_master.update_one(
                {"_id": prod["_id"]},
                {"$set": update_data}
            )
            stats["products_semantic_tagged"] += 1
        else:
            stats["errors"] += 1
        
        await asyncio.sleep(0.3)
    
    print(f"  ✅ Tagged {stats['products_semantic_tagged']} products with semantic_intents")
    
    # =========================================================================
    # 4. GENERATE MIRA_HINT FOR PRODUCTS MISSING IT (333 products)
    # =========================================================================
    print("\n📦 Phase 4: Generating mira_hint for products...")
    print("-" * 70)
    
    products_no_hint = await db.products_master.find(
        {"$or": [
            {"mira_hint": {"$exists": False}},
            {"mira_hint": ""},
            {"mira_hint": None}
        ]},
        {"_id": 1, "name": 1, "description": 1, "pillar": 1, "category": 1}
    ).to_list(350)
    
    print(f"Found {len(products_no_hint)} products needing mira_hint")
    
    for prod in products_no_hint:
        result = await tag_with_ai(
            prod.get('name', ''),
            prod.get('description', ''),
            prod.get('pillar', ''),
            prod.get('category', '')
        )
        
        if result and result.get('mira_hint'):
            await db.products_master.update_one(
                {"_id": prod["_id"]},
                {"$set": {
                    "mira_hint": result["mira_hint"],
                    "mira_hint_generated_at": datetime.now().isoformat()
                }}
            )
            stats["products_hint_generated"] += 1
        else:
            stats["errors"] += 1
        
        await asyncio.sleep(0.3)
    
    print(f"  ✅ Generated mira_hint for {stats['products_hint_generated']} products")
    
    # =========================================================================
    # SUMMARY
    # =========================================================================
    print("\n" + "=" * 70)
    print("📊 TAGGING COMPLETE - SUMMARY")
    print("=" * 70)
    print(f"  services_master tagged:    {stats['services_master_tagged']}")
    print(f"  service_catalog tagged:    {stats['service_catalog_tagged']}")
    print(f"  products semantic tagged:  {stats['products_semantic_tagged']}")
    print(f"  products hints generated:  {stats['products_hint_generated']}")
    print(f"  errors:                    {stats['errors']}")
    print(f"\nCompleted: {datetime.now().isoformat()}")
    
    # Save stats
    with open('/app/memory/TAGGING_RESULTS.json', 'w') as f:
        json.dump(stats, f, indent=2)
    
    mongo_client.close()
    return stats

if __name__ == "__main__":
    asyncio.run(run_tagging())
