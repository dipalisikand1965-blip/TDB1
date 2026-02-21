"""
AI-Assisted Service Tagging Script v1.0
Tags services with base_tags using service_taxonomy_v1.yaml
"""

import asyncio
import json
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage

SYSTEM_PROMPT = """You are a Service Intelligence Tagger for a pet (dog) services company.

GOLDEN RULES:
1. Tag ONLY what the service IS, not when/why it's used
2. Never infer benefits - only tag if explicitly stated
3. Never tag pillars or occasions
4. Provide confidence scores (0.0-1.0) for each tag
5. Flag anything with confidence < 0.7

LOCKED SERVICE TAXONOMY v1.0:

service_type (SINGLE, REQUIRED):
- grooming: bathing, haircuts, nail trim, spa
- training: obedience, behavior, tricks
- fitness: exercise programs, agility, weight management
- wellness: yoga, massage, relaxation
- medical: vet consultation, health checks, vaccinations
- boarding: overnight stay, daycare
- walking: dog walking, park visits
- sitting: pet sitting at home
- photography: photoshoots, portraits
- party_planning: birthday parties, celebrations
- consultation: advisory, behavioral assessment
- transport: pet taxi, airport pickup

delivery_mode (SINGLE, REQUIRED):
- in_store: at facility/salon
- at_home: provider goes to customer's home
- virtual: video call consultation
- outdoor: parks, trails, outdoor venues
- pickup_drop: pet picked up and returned

session_type (SINGLE, REQUIRED):
- single: one-time session
- package: bundle of sessions (4, 8, 12)
- subscription: ongoing monthly
- program: structured multi-week program

duration (SINGLE, REQUIRED):
- 30min, 60min, 90min, 120min
- half_day: 4 hours
- full_day: 8 hours
- overnight, multi_day

provider_type (SINGLE):
- certified_trainer, groomer, vet, vet_nurse, photographer, handler, any_staff

life_stage (MULTI): puppy, adult, senior, all_stages
- DEFAULT to 'all_stages' unless restricted

breed_size (MULTI): toy, small, medium, large, giant

temperament (MULTI): calm, anxious, energetic, aggressive, social, shy

benefits (MULTI, only if EXPLICIT):
- coat_health, hygiene, weight_management, mobility, dental_health
- training_support, socialization, anxiety_relief, mental_stimulation, bonding

price_tier (SINGLE):
- budget: <₹500
- mid: ₹500-₹2000
- premium: >₹2000

booking_type (SINGLE):
- instant: book immediately
- request: requires confirmation
- consultation: needs assessment first

TAGGING RULES:
1. Every service MUST have: service_type, delivery_mode, session_type, duration
2. Default life_stage to 'all_stages' unless restricted
3. Medical services → provider_type: vet or vet_nurse
4. Training services → provider_type: certified_trainer
5. Grooming services → provider_type: groomer

RESPONSE FORMAT (JSON only, no markdown):
{
  "service_id": "...",
  "base_tags": {
    "service_type": "...",
    "delivery_mode": "...",
    "session_type": "...",
    "duration": "...",
    "provider_type": "...",
    "life_stage": [],
    "breed_size": [],
    "temperament": [],
    "benefits": [],
    "price_tier": "...",
    "booking_type": "..."
  },
  "confidence_scores": {
    "service_type": 0.95,
    ...
  },
  "flags": [],
  "notes": []
}"""


async def tag_service(service: dict) -> dict:
    """Tag a single service using AI"""
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"service-tagging-{service.get('id', service.get('name', 'unknown'))}",
        system_message=SYSTEM_PROMPT
    ).with_model("openai", "gpt-4o")
    
    # Build service info string
    service_info = f"""
SERVICE TO TAG:
- ID: {service.get('id', 'N/A')}
- Name: {service.get('name', 'N/A')}
- Description: {service.get('description', 'N/A')}
- Category: {service.get('category', 'N/A')}
- Current Pillar: {service.get('pillar', 'N/A')}
- Price: ₹{service.get('price') or service.get('base_price') or 'N/A'}
- Duration: {service.get('duration', 'N/A')}
- Includes: {service.get('includes', 'N/A')}

Generate base tags following the LOCKED SERVICE TAXONOMY v1.0. Return ONLY valid JSON."""

    user_message = UserMessage(text=service_info)
    
    try:
        response = await chat.send_message(user_message)
        clean_response = response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
        clean_response = clean_response.strip()
        
        result = json.loads(clean_response)
        result['service_name'] = service.get('name', 'Unknown')
        result['service_id'] = service.get('id', service.get('name'))
        return result
    except json.JSONDecodeError as e:
        return {
            "service_id": service.get('id', service.get('name')),
            "service_name": service.get('name', 'Unknown'),
            "error": f"JSON parse error: {str(e)}",
            "raw_response": response[:500] if 'response' in dir() else "No response"
        }
    except Exception as e:
        return {
            "service_id": service.get('id', service.get('name')),
            "service_name": service.get('name', 'Unknown'),
            "error": str(e)
        }


async def tag_all_services():
    """Tag all services in database with base_tags"""
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client[os.environ.get('DB_NAME', 'thedoggycompany')]
    
    # Collect services from all relevant collections
    all_services = []
    collections_to_tag = ['services', 'care_services', 'grooming_services']
    
    for coll_name in collections_to_tag:
        try:
            services = await db[coll_name].find({}, {'_id': 0}).to_list(200)
            for s in services:
                s['_collection'] = coll_name
            all_services.extend(services)
            print(f"Found {len(services)} services in {coll_name}")
        except Exception as e:
            print(f"Error reading {coll_name}: {e}")
    
    print(f"\n{'='*60}")
    print(f"TAGGING {len(all_services)} SERVICES")
    print(f"{'='*60}\n")
    
    results = []
    success_count = 0
    error_count = 0
    
    for i, service in enumerate(all_services, 1):
        name = service.get('name', 'Unknown')[:40]
        print(f"[{i}/{len(all_services)}] {name}...", end=" ")
        
        result = await tag_service(service)
        results.append(result)
        
        if 'error' in result:
            print(f"❌ {result['error'][:50]}")
            error_count += 1
        else:
            # Update the service in database
            base_tags = result.get('base_tags', {})
            coll_name = service.get('_collection', 'services')
            
            # Find by id or name
            query = {}
            if service.get('id'):
                query = {'id': service['id']}
            elif service.get('name'):
                query = {'name': service['name']}
            
            if query:
                await db[coll_name].update_one(
                    query,
                    {'$set': {
                        'base_tags': base_tags,
                        'base_tags_updated_at': datetime.now(timezone.utc).isoformat(),
                        'base_tags_version': '1.0'
                    }}
                )
                print(f"✅ {base_tags.get('service_type', 'unknown')}")
                success_count += 1
            else:
                print(f"⚠️ No ID/name to update")
        
        await asyncio.sleep(0.3)  # Rate limiting
    
    # Save results to file
    with open('/tmp/tagged_services.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'='*60}")
    print("TAGGING SUMMARY")
    print(f"{'='*60}")
    print(f"✅ Success: {success_count}/{len(all_services)}")
    print(f"❌ Errors: {error_count}/{len(all_services)}")
    print(f"\nResults saved to /tmp/tagged_services.json")
    
    # Verify tags were applied
    print(f"\n{'='*60}")
    print("VERIFICATION")
    print(f"{'='*60}")
    
    for coll_name in collections_to_tag:
        tagged = await db[coll_name].count_documents({'base_tags': {'$exists': True}})
        total = await db[coll_name].count_documents({})
        print(f"{coll_name}: {tagged}/{total} tagged")
    
    return results


if __name__ == "__main__":
    asyncio.run(tag_all_services())
