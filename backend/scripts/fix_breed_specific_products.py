#!/usr/bin/env python3
"""
Fix breed-specific products - Set is_breed_specific=True and populate breed_metadata.breeds
for all products that have breed names in their product name.
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

# All 35 recognized breeds
BREEDS = [
    'Labrador', 'Golden Retriever', 'Indie', 'German Shepherd', 'Beagle', 'Pug',
    'Shih Tzu', 'Pomeranian', 'Husky', 'Rottweiler', 'Dachshund', 'Cocker Spaniel',
    'French Bulldog', 'Boxer', 'Great Dane', 'Doberman', 'Maltese', 'Yorkshire Terrier',
    'Lhasa Apso', 'Chihuahua', 'Spitz', 'Saint Bernard', 'Shiba Inu', 'Border Collie',
    'Akita', 'Dalmatian', 'Bulldog', 'Poodle', 'Australian Shepherd', 
    'Cavalier King Charles', 'Bernese Mountain Dog', 'Samoyed', 'Corgi', 
    'Jack Russell', 'Weimaraner'
]

async def fix_breed_products():
    """Update all products with breed names to have proper breed metadata"""
    
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'doggy_company')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("=" * 60)
    print("FIXING BREED-SPECIFIC PRODUCTS")
    print("=" * 60)
    
    total_updated = 0
    breed_counts = {}
    
    for breed in BREEDS:
        # Find products with this breed name (case-insensitive)
        query = {
            "name": {"$regex": breed, "$options": "i"},
            "$or": [
                {"is_breed_specific": {"$ne": True}},
                {"breed_metadata.breeds": {"$size": 0}},
                {"breed_metadata.breeds": {"$exists": False}},
                {"breed_metadata.breed_name": {"$exists": False}}
            ]
        }
        
        products = await db.products_master.find(query).to_list(1000)
        
        if products:
            print(f"\n{breed}: Found {len(products)} products to update")
            
            for product in products:
                # Get existing breed_metadata or create new
                breed_metadata = product.get('breed_metadata', {}) or {}
                existing_breeds = breed_metadata.get('breeds', []) or []
                
                # Add this breed if not already present
                if breed not in existing_breeds:
                    existing_breeds.append(breed)
                
                # Update the product
                update_data = {
                    "$set": {
                        "is_breed_specific": True,
                        "breed_metadata.breeds": existing_breeds,
                        "breed_metadata.breed_name": breed,  # Primary breed
                        "breed_metadata.is_breed_specific": True
                    }
                }
                
                result = await db.products_master.update_one(
                    {"id": product.get("id")},
                    update_data
                )
                
                if result.modified_count > 0:
                    total_updated += 1
                    breed_counts[breed] = breed_counts.get(breed, 0) + 1
                    
            print(f"  Updated {breed_counts.get(breed, 0)} products")
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total products updated: {total_updated}")
    print("\nBy breed:")
    for breed, count in sorted(breed_counts.items(), key=lambda x: -x[1]):
        print(f"  {breed}: {count}")
    
    # Verify
    print("\n" + "=" * 60)
    print("VERIFICATION")
    print("=" * 60)
    breed_specific_count = await db.products_master.count_documents({"is_breed_specific": True})
    print(f"Total breed-specific products in DB: {breed_specific_count}")
    
    client.close()
    return total_updated

if __name__ == "__main__":
    result = asyncio.run(fix_breed_products())
    print(f"\nDone! Updated {result} products.")
