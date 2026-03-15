#!/usr/bin/env python3
"""
Update Dine products with generated images via API
"""
import requests
import json

API_URL = "https://celebrate-products.preview.emergentagent.com"
AUTH = ("aditya", "lola4304")

# Generated images
IMAGES = {
    "fresh_chicken": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/3146111d57a2be957970b2269af83f52a77f95aec2b43e7d50bb0f654abccede.png",
    "veggie": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/90381993cb50b338010257f2e6e7b717da8431b2dcdbae14bc67ed210929c60f.png",
    "fish": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/d32a3f72f293628ccb617bfae5d4014c46a3dd2a0384a1fb5034aab228909f72.png",
    "slow_feeder": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/76ec043c1f62e0c9bed61e291e61cb9add6cdae6c576fc866c5eda584aec523f.png",
    "travel_bowl": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/f3ea3c7b0c2dcf256b49c43c5c83eaf87abe9b4abbf9225f0279452996bacdfa.png",
    "water_bottle": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/f3167bc3672788d73eec74e620735a6e98a991b756bac42d3a314cb0b5063555.png",
    "elevated": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/fcad98a104cb6fc6fd36c46328728b23f2cf434b0bc0d6a24547d9ad57c8e0df.png",
    "ceramic": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/17dcf53b58167dcd86b44ab1a916f1600c51f65cd64f04de268a10a873016e6b.png",
    "restaurant": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/728b02e0a03338506fbf304d09d5798d7f494bfdd469db7826f53ef519729394.png",
    "party": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/6a8ce9ad223308f72bad1b5f6dc678e8672ff06b19659a67bf821fae03d4daf5.png",
}

# Product ID to image key mapping
PRODUCT_IMAGE_MAP = {
    # Travel/Portable bowls
    "dine-prod-bowl": "travel_bowl",
    "dine-travel-bowl": "travel_bowl",
    "dine-portable-mat": "travel_bowl",
    
    # Water bottles
    "dine-water-bottle": "water_bottle",
    "dine-pup-cup": "water_bottle",
    
    # Fresh meals - Chicken based
    "seed-dine-609a7d1a": "fresh_chicken",  # Fresh Chicken & Rice Bowl
    "meal-62794bb9": "fresh_chicken",  # Chicken & Brown Rice Bowl
    "seed-dine-6c6daa53": "fresh_chicken",  # Grain-Free Turkey Feast
    "meal-1227eb46": "fresh_chicken",  # Lean & Fit Formula
    
    # Fresh meals - Veggie/Pumpkin
    "meal-8ed484eb": "veggie",  # Pumpkin & Oats Comfort Bowl (Veg)
    "meal-b1089130": "veggie",  # Veggie Delight Bowl (Veg)
    "seed-dine-f8f89eb5": "veggie",  # Senior Wellness Meal
    "meal-2d589f46": "veggie",  # Senior Vitality Bowl
    "seed-dine-803906ac": "veggie",  # Weight Management Bowl
    
    # Fresh meals - Fish
    "seed-dine-b47356d2": "fish",  # Fish & Veggie Delight
    "meal-4550eb3b": "fish",  # Fish & Quinoa Power Bowl
    
    # Fresh meals - Lamb
    "seed-dine-77cbe5bc": "fresh_chicken",  # Lamb & Sweet Potato Meal
    "meal-2636ed9e": "fresh_chicken",  # Lamb & Sweet Potato Feast
    
    # Puppy meals
    "meal-1303dee9": "fresh_chicken",  # Puppy Growth Formula
    "seed-dine-850d0aab": "fresh_chicken",  # Puppy Growth Formula
    
    # Subscription plans
    "seed-dine-674b4de3": "fresh_chicken",  # Monthly Meal Plan
    "seed-dine-2dd6cdae": "fresh_chicken",  # Weekly Meal Subscription
    "feed-fresh-1": "fresh_chicken",  # Fresh Meal Plan - Weekly
    
    # Cafe/Restaurant accessories
    "dine-bandana": "restaurant",
    "dine-fresh-breath": "restaurant",
    "dine-placemat": "restaurant",
    "dine-calming-spray": "restaurant",
    "dine-etiquette-guide": "restaurant",
    "dine-cooling-vest": "restaurant",
    "dine-treat-pouch": "restaurant",
    "dine-photo-props": "party",
}

def update_product(product_id, image_url):
    """Update product with image via admin API"""
    url = f"{API_URL}/api/admin/dine/products/{product_id}"
    data = {
        "image": image_url,
        "images": [image_url]
    }
    try:
        resp = requests.put(url, json=data, auth=AUTH)
        return resp.status_code == 200
    except Exception as e:
        print(f"  Error updating {product_id}: {e}")
        return False

def main():
    print("Updating Dine products with generated images...")
    
    updated = 0
    for product_id, image_key in PRODUCT_IMAGE_MAP.items():
        if image_key in IMAGES:
            image_url = IMAGES[image_key]
            if update_product(product_id, image_url):
                updated += 1
                print(f"  ✅ {product_id}")
            else:
                print(f"  ❌ {product_id} - Update failed")
    
    print(f"\n✅ Updated {updated} products")

if __name__ == "__main__":
    main()
