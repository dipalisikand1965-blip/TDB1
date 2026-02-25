"""
Complete Breed Seeder
=====================
Seeds ALL breeds from breed_knowledge.py into the database
with proper breed catalogue entries.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import breed knowledge
from breed_knowledge import BREED_KNOWLEDGE

async def seed_all_breeds():
    """Seed ALL breeds from breed_knowledge into database"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client['test_database']
    
    # Clear existing breed catalogue
    await db.breed_catalogue.delete_many({})
    logger.info("Cleared existing breed catalogue")
    
    breeds_to_seed = []
    
    for breed_name, breed_data in BREED_KNOWLEDGE.items():
        breed_entry = {
            "name": breed_name.title(),
            "slug": breed_name.lower().replace(" ", "-").replace("/", "-"),
            "size": breed_data.get("size", "medium"),
            "weight_range": breed_data.get("weight_range", "Unknown"),
            "life_expectancy": breed_data.get("life_expectancy", "10-15 years"),
            "energy_level": breed_data.get("energy_level", "moderate"),
            "exercise_needs": breed_data.get("exercise_needs", "30-60 minutes daily"),
            "temperament": breed_data.get("temperament", []),
            "good_with": breed_data.get("good_with", []),
            "not_ideal_for": breed_data.get("not_ideal_for", []),
            "health_concerns": breed_data.get("health_concerns", []),
            "dietary_needs": breed_data.get("dietary_needs", {}),
            "grooming": breed_data.get("grooming", {}),
            "climate_suitability": breed_data.get("climate_suitability", {}),
            "training": breed_data.get("training", {}),
            "special_considerations": breed_data.get("special_considerations", {}),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        breeds_to_seed.append(breed_entry)
    
    if breeds_to_seed:
        result = await db.breed_catalogue.insert_many(breeds_to_seed)
        logger.info(f"Seeded {len(result.inserted_ids)} breeds to breed_catalogue")
    
    # Count and report
    total_breeds = await db.breed_catalogue.count_documents({})
    logger.info(f"Total breeds in database: {total_breeds}")
    
    # List all breeds
    breeds = await db.breed_catalogue.find({}, {"name": 1}).to_list(None)
    breed_names = [b["name"] for b in breeds]
    
    logger.info("=" * 50)
    logger.info("BREEDS SEEDED:")
    for i, name in enumerate(sorted(breed_names), 1):
        logger.info(f"  {i}. {name}")
    logger.info("=" * 50)
    
    return total_breeds

if __name__ == "__main__":
    count = asyncio.run(seed_all_breeds())
    print(f"\n✅ Successfully seeded {count} breeds!")
