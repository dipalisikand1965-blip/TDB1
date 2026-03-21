#!/usr/bin/env python3
"""
Sync pet data from production (thedoggycompany.com) to preview environment.
This script fetches complete pet profiles including soul answers and syncs them.
"""

import os
import sys
import requests
from pymongo import MongoClient
from datetime import datetime

# Production API
PROD_URL = "https://thedoggycompany.com"
PROD_EMAIL = "dipali@clubconcierge.in"
PROD_PASSWORD = "test123"

# Local MongoDB
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "pet_os")

def get_prod_token():
    """Login to production and get access token"""
    response = requests.post(
        f"{PROD_URL}/api/auth/login",
        json={"email": PROD_EMAIL, "password": PROD_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    print(f"Failed to login to production: {response.text}")
    return None

def get_prod_pets(token):
    """Fetch all pets from production"""
    response = requests.get(
        f"{PROD_URL}/api/pets",
        headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code == 200:
        return response.json().get("pets", [])
    print(f"Failed to fetch pets: {response.text}")
    return []

def sync_pets_to_preview(pets):
    """Sync pets to local MongoDB"""
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    pets_collection = db.pets
    
    synced_count = 0
    
    for pet in pets:
        pet_name = pet.get("name")
        owner_email = pet.get("owner_email", PROD_EMAIL)
        
        # Remove base64 photo to reduce data size
        if "photo_base64" in pet:
            del pet["photo_base64"]
        
        # Update or insert pet
        update_data = {
            "$set": {
                "name": pet_name,
                "breed": pet.get("breed"),
                "age": pet.get("age"),
                "gender": pet.get("gender"),
                "weight": pet.get("weight"),
                "image": pet.get("image"),
                "owner_email": owner_email,
                "soul_score": pet.get("soul_score", 0),
                "overall_score": pet.get("overall_score", 0),
                "doggy_soul_answers": pet.get("doggy_soul_answers") or {},
                "soul_persona": pet.get("soul_persona", {}),
                "identity": pet.get("identity", {}),
                "personality": pet.get("personality", {}),
                "health": pet.get("health", {}),
                "preferences": pet.get("preferences", {}),
                "care": pet.get("care", {}),
                "travel": pet.get("travel", {}),
                "soul": pet.get("soul", {}),
                "celebrations": pet.get("celebrations", []),
                "conversation_memories": pet.get("conversation_memories", []),
                "soul_growth_log": pet.get("soul_growth_log", []),
                "learned_facts": pet.get("learned_facts", []),
                "allergies": pet.get("allergies", []),
                "sensitivities": pet.get("sensitivities", []),
                "favorite_treats": pet.get("favorite_treats", []),
                "favorite_toys": pet.get("favorite_toys", []),
                "food_preferences": pet.get("food_preferences", {}),
                "nicknames": pet.get("nicknames", ""),
                "species": pet.get("species", "dog"),
                "color": pet.get("color", ""),
                "birthday": pet.get("birthday"),
                "birth_date": pet.get("birth_date"),
                "gotcha_date": pet.get("gotcha_date", ""),
                "synced_from_prod": True,
                "synced_at": datetime.utcnow().isoformat()
            }
        }
        
        result = pets_collection.update_one(
            {"name": pet_name, "owner_email": owner_email},
            update_data,
            upsert=True
        )
        
        if result.modified_count > 0 or result.upserted_id:
            synced_count += 1
            print(f"✓ Synced: {pet_name} (Soul: {pet.get('soul_score', 0)}%)")
    
    client.close()
    return synced_count

def main():
    print("=" * 50)
    print("Pet Data Sync: Production -> Preview")
    print("=" * 50)
    
    # Get production token
    print("\n1. Logging into production...")
    token = get_prod_token()
    if not token:
        sys.exit(1)
    print("   ✓ Login successful")
    
    # Fetch pets
    print("\n2. Fetching pets from production...")
    pets = get_prod_pets(token)
    print(f"   ✓ Found {len(pets)} pets")
    
    # Sync to preview
    print("\n3. Syncing to preview database...")
    synced = sync_pets_to_preview(pets)
    
    print("\n" + "=" * 50)
    print(f"Sync complete! {synced} pets synced.")
    print("=" * 50)

if __name__ == "__main__":
    main()
