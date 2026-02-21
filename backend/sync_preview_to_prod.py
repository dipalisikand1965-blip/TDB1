"""
Sync Preview Pet Data to Production
This script syncs pet soul data from preview to production for a specific user.
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# MongoDB connection strings
PREVIEW_MONGO_URL = os.environ.get('MONGO_URL')  # Local preview database
PRODUCTION_MONGO_URL = os.environ.get('PRODUCTION_MONGO_URL', PREVIEW_MONGO_URL)  # Will be set

async def sync_pets_preview_to_production(user_email: str):
    """Sync all pets from preview to production for a specific user"""
    
    # Connect to preview (local) database
    preview_client = AsyncIOMotorClient(PREVIEW_MONGO_URL)
    preview_db = preview_client[os.environ.get('DB_NAME', 'pet_os')]
    
    print(f"Syncing pets for user: {user_email}")
    
    # Get user from preview
    user = await preview_db.users.find_one({"email": user_email})
    if not user:
        print(f"User {user_email} not found in preview")
        return
    
    user_id = str(user.get('_id'))
    print(f"Found user ID: {user_id}")
    
    # Get all pets from preview
    preview_pets = await preview_db.pets.find({"user_id": user_id}).to_list(100)
    print(f"Found {len(preview_pets)} pets in preview")
    
    for pet in preview_pets:
        pet_id = pet.get('id')
        pet_name = pet.get('name')
        overall_score = pet.get('overall_score', 0)
        
        print(f"  - {pet_name}: {overall_score}% (ID: {pet_id})")
        
        # Get soul data for this pet
        soul = await preview_db.pet_souls.find_one({"pet_id": pet_id})
        if soul:
            print(f"    Soul data found with {len(soul.keys())} fields")
    
    print("\n=== PREVIEW DATA SUMMARY ===")
    print(f"Pets to sync: {len(preview_pets)}")
    
    return preview_pets

if __name__ == "__main__":
    asyncio.run(sync_pets_preview_to_production("dipali@clubconcierge.in"))
