#!/usr/bin/env python3
"""
Script to update Dine products with generated images
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Generated image URLs
GENERATED_IMAGES = {
    # Fresh Meals
    "fresh_chicken_rice_bowl": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/3146111d57a2be957970b2269af83f52a77f95aec2b43e7d50bb0f654abccede.png",
    "veggie_bowl": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/90381993cb50b338010257f2e6e7b717da8431b2dcdbae14bc67ed210929c60f.png",
    "fish_quinoa_bowl": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/d32a3f72f293628ccb617bfae5d4014c46a3dd2a0384a1fb5034aab228909f72.png",
    
    # Bowls & Feeding
    "slow_feeder_puzzle_bowl": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/76ec043c1f62e0c9bed61e291e61cb9add6cdae6c576fc866c5eda584aec523f.png",
    "collapsible_travel_bowl": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/f3ea3c7b0c2dcf256b49c43c5c83eaf87abe9b4abbf9225f0279452996bacdfa.png",
    "pet_water_bottle_bowl": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/f3167bc3672788d73eec74e620735a6e98a991b756bac42d3a314cb0b5063555.png",
    "elevated_bamboo_bowl": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/fcad98a104cb6fc6fd36c46328728b23f2cf434b0bc0d6a24547d9ad57c8e0df.png",
    "personalized_ceramic_bowl": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/17dcf53b58167dcd86b44ab1a916f1600c51f65cd64f04de268a10a873016e6b.png",
    
    # Services
    "pet_friendly_restaurant": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/728b02e0a03338506fbf304d09d5798d7f494bfdd469db7826f53ef519729394.png",
    "private_chef_dining": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/036c6bebadc00d245ce82840e9721da53b6a87b329b2ffa9946a61906d3b03af.png",
    "pet_party_catering": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/6a8ce9ad223308f72bad1b5f6dc678e8672ff06b19659a67bf821fae03d4daf5.png",
    "reservation_service": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/d338b1ffebf8bc68c2c1ef7c8991e4848ad53e78a2d246b98b8a34896b0e8311.png",
}

# Product name to image mapping
PRODUCT_IMAGE_MAPPING = {
    # Fresh Meals
    "Fresh Chicken & Rice Bowl": "fresh_chicken_rice_bowl",
    "Chicken & Brown Rice Bowl": "fresh_chicken_rice_bowl",
    "Pumpkin & Oats Comfort Bowl (Veg)": "veggie_bowl",
    "Veggie Delight Bowl (Veg)": "veggie_bowl",
    "Senior Vitality Bowl": "veggie_bowl",
    "Fish & Quinoa Power Bowl": "fish_quinoa_bowl",
    "Weight Management Bowl": "fresh_chicken_rice_bowl",
    
    # Slow Feeders
    "Slow Feeder Puzzle Bowl": "slow_feeder_puzzle_bowl",
    "Slow Feeder Puzzle Bowl - Teal": "slow_feeder_puzzle_bowl",
    "Slow Feeder Bowl": "slow_feeder_puzzle_bowl",
    "Fast Eater  Slow Feeder Bowl  Healthy Pace": "slow_feeder_puzzle_bowl",
    
    # Travel Bowls
    "Collapsible Travel Bowl Set": "collapsible_travel_bowl",
    "Collapsible Travel Bowl Set (2-pack)": "collapsible_travel_bowl",
    "Collapsible Silicone Bowl Set": "collapsible_travel_bowl",
    "Premium Collapsible Travel Bowl Set": "collapsible_travel_bowl",
    "HUFT Collapsible Travel Bowl Set": "collapsible_travel_bowl",
    "Portable Travel Bowl Set": "collapsible_travel_bowl",
    "Portable Collapsible Water Bowl": "collapsible_travel_bowl",
    "Portable Silicone Travel Bowl Set": "collapsible_travel_bowl",
    "TDC Collapsible Travel Bowl": "collapsible_travel_bowl",
    "Collapsible Travel Bowl": "collapsible_travel_bowl",
    
    # Water Bottles
    "Pet Water Bottle with Bowl": "pet_water_bottle_bowl",
    "Portable Pet Water Bottle with Bowl": "pet_water_bottle_bowl",
    "Travel Water Bottle & Bowl": "pet_water_bottle_bowl",
    "2-in-1 Water Bottle & Bowl": "pet_water_bottle_bowl",
    
    # Elevated Bowls
    "Elevated Double Bowl Stand - Bamboo": "elevated_bamboo_bowl",
    "Large Breed  Elevated Bowl Set  Joint Friendly": "elevated_bamboo_bowl",
    
    # Ceramic/Personalized Bowls
    "Ceramic Artisan Bowl Set - Bone Motif": "personalized_ceramic_bowl",
    "Small Breed  Ceramic Bowl Set  Easy Eating": "personalized_ceramic_bowl",
    "Smart Feeding Bowl": "personalized_ceramic_bowl",
    "TDC Dine-veggie-bowl": "veggie_bowl",
    "Portable Adventure Bowl": "collapsible_travel_bowl",
    
    # Services
    "Pet-Friendly Restaurant Discovery": "pet_friendly_restaurant",
    "Reservation Assistance": "reservation_service",
    "Private Home Dining": "private_chef_dining",
    "Dining Etiquette Guidance": "pet_friendly_restaurant",
    "Venue Suitability Advisory": "pet_friendly_restaurant",
    "Backup Dining Alternatives": "pet_friendly_restaurant",
    "Pet Party Catering": "pet_party_catering",
}

# All breed bowls get personalized ceramic bowl image
BREED_NAMES = [
    "Golden Retriever", "German Shepherd", "Husky", "Dachshund", "Cocker Spaniel",
    "French Bulldog", "Chihuahua", "Pug", "Rottweiler", "Doberman", "Maltese",
    "Lhasa Apso", "Indie", "Great Dane", "Yorkshire Terrier", "Labrador", "Beagle",
    "Shih Tzu", "Pomeranian", "Boxer", "Saint Bernard", "Bulldog",
    "Cavalier King Charles", "Spitz", "Shiba Inu", "Akita", "Poodle",
    "Bernese Mountain Dog", "Samoyed", "Jack Russell", "Weimaraner", "Border Collie",
    "Dalmatian", "Australian Shepherd", "Corgi"
]

async def update_dine_images():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'pet_concierge')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    updated_count = 0
    
    # Get all dine products (pillars is an array)
    cursor = db.products_master.find({"pillars": {"$in": ["dine", "feed"]}})
    products = await cursor.to_list(length=1000)
    
    print(f"Found {len(products)} Dine products")
    
    for product in products:
        name = product.get('name', '')
        current_images = product.get('images', [])
        
        # Skip if already has images
        if current_images and len(current_images) > 0:
            continue
        
        image_key = None
        
        # Check direct mapping
        if name in PRODUCT_IMAGE_MAPPING:
            image_key = PRODUCT_IMAGE_MAPPING[name]
        else:
            # Check if it's a breed personalized bowl
            for breed in BREED_NAMES:
                if breed in name and "Personalized Food Bowl" in name:
                    image_key = "personalized_ceramic_bowl"
                    break
        
        if image_key and image_key in GENERATED_IMAGES:
            image_url = GENERATED_IMAGES[image_key]
            result = await db.products_master.update_one(
                {"_id": product["_id"]},
                {"$set": {"images": [image_url], "image": image_url}}
            )
            if result.modified_count > 0:
                updated_count += 1
                print(f"  ✅ Updated: {name}")
        else:
            print(f"  ⚠️  No mapping for: {name}")
    
    # Also update services
    cursor = db.services.find({"pillar": "dine"})
    services = await cursor.to_list(length=100)
    
    print(f"\nFound {len(services)} Dine services")
    
    for service in services:
        name = service.get('name', '')
        current_image = service.get('image', '')
        
        if current_image:
            continue
            
        image_key = PRODUCT_IMAGE_MAPPING.get(name)
        
        if image_key and image_key in GENERATED_IMAGES:
            image_url = GENERATED_IMAGES[image_key]
            result = await db.services.update_one(
                {"_id": service["_id"]},
                {"$set": {"image": image_url}}
            )
            if result.modified_count > 0:
                updated_count += 1
                print(f"  ✅ Updated service: {name}")
        else:
            print(f"  ⚠️  No mapping for service: {name}")
    
    print(f"\n✅ Total updated: {updated_count}")
    client.close()

if __name__ == "__main__":
    asyncio.run(update_dine_images())
