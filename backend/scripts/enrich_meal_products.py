"""
Meal & Treat Product Enrichment Script
Enhances meal-related products with proper tags, titles, and descriptions
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "doggy_company")

# Enhanced descriptions for meal products
MEAL_DESCRIPTIONS = {
    "chicken": "🍗 Premium chicken meal packed with protein for strong muscles. Made with human-grade chicken, fresh vegetables, and essential nutrients. No preservatives, no fillers - just wholesome goodness your pup will love!",
    "mutton": "🥩 Delicious mutton meal rich in iron and B-vitamins. Slow-cooked with garden vegetables for maximum nutrition. Perfect for active dogs who need extra energy!",
    "paneer": "🧀 Vegetarian delight! Fresh paneer meal with colorful veggies. High in protein and calcium for strong bones. Ideal for dogs with meat sensitivities!",
    "fish": "🐟 Omega-rich fish meal for a shiny coat and healthy skin. Wild-caught fish with antioxidant-packed vegetables. Brain food for your smartest pup!",
    "lamb": "🐑 Tender lamb meal - gentle on sensitive tummies. Lean protein with digestive-friendly ingredients. Great for dogs with food allergies!",
    "veggies": "🥕 Garden-fresh vegetable medley! Packed with vitamins, minerals, and fiber. A colorful, crunchy addition to any meal plan!"
}

# Tags for meal categorization
MEAL_TAGS = {
    "protein_type": {
        "chicken": ["Chicken", "Poultry", "High-Protein"],
        "mutton": ["Mutton", "Red-Meat", "Iron-Rich"],
        "paneer": ["Paneer", "Vegetarian", "Dairy"],
        "fish": ["Fish", "Omega-3", "Seafood"],
        "lamb": ["Lamb", "Hypoallergenic", "Lean-Protein"],
        "beef": ["Beef", "Red-Meat", "High-Protein"],
        "turkey": ["Turkey", "Lean-Poultry", "Low-Fat"]
    },
    "life_stage": {
        "puppy": ["Puppy-Food", "Growth-Formula", "High-Calorie"],
        "adult": ["Adult-Food", "Maintenance", "Balanced"],
        "senior": ["Senior-Food", "Joint-Support", "Easy-Digest"]
    },
    "dietary": {
        "grain-free": ["Grain-Free", "No-Wheat", "Paleo"],
        "low-fat": ["Low-Fat", "Weight-Management", "Light"],
        "high-protein": ["High-Protein", "Muscle-Building", "Active"],
        "sensitive": ["Sensitive-Stomach", "Gentle", "Limited-Ingredient"]
    }
}

# Fresh meal titles (more exciting)
TITLE_UPGRADES = {
    "Mutton & Veggies Meal": "🥩 Power-Packed Mutton & Garden Veggies",
    "Chicken & Veggies Meal": "🍗 Classic Chicken & Fresh Veggies Bowl",
    "Paneer & Veggies Meal": "🧀 Veggie Delight: Paneer & Rainbow Vegetables",
    "Fish & Veggies Meal": "🐟 Ocean Fresh: Fish & Seasonal Greens",
    "Lamb & Veggies Meal": "🐑 Tender Lamb & Wholesome Vegetables"
}

def determine_protein(title, description):
    """Determine protein type from product content"""
    content = f"{title} {description}".lower()
    proteins = ["chicken", "mutton", "paneer", "fish", "lamb", "beef", "turkey"]
    for p in proteins:
        if p in content:
            return p
    return "chicken"  # default

def generate_meal_description(title, existing_desc, protein):
    """Generate or enhance meal description"""
    if existing_desc and len(existing_desc) > 100:
        return existing_desc  # Keep good existing descriptions
    
    base_desc = MEAL_DESCRIPTIONS.get(protein, MEAL_DESCRIPTIONS["chicken"])
    
    # Add personalization note
    personalized = f"{base_desc}\n\n✨ This meal is automatically selected based on your pet's profile, age, and dietary needs!"
    
    return personalized

def enrich_meal_tags(existing_tags, title, protein):
    """Add relevant tags for meal products"""
    tags = list(set(existing_tags))
    
    # Add protein tags
    protein_tags = MEAL_TAGS["protein_type"].get(protein, [])
    for t in protein_tags:
        if t not in tags:
            tags.append(t)
    
    # Add meal category tags
    meal_tags = ["Fresh-Meals", "Homemade", "No-Preservatives", "Human-Grade"]
    for t in meal_tags:
        if t not in tags:
            tags.append(t)
    
    # Determine life stage from title
    title_lower = title.lower()
    if "puppy" in title_lower:
        for t in MEAL_TAGS["life_stage"]["puppy"]:
            if t not in tags:
                tags.append(t)
    elif "senior" in title_lower:
        for t in MEAL_TAGS["life_stage"]["senior"]:
            if t not in tags:
                tags.append(t)
    else:
        tags.append("All-Ages")
    
    return tags

async def enrich_meal_products():
    """Main function to enrich meal products"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Find all meal-related products
    meal_products = await db.products.find({
        "$or": [
            {"category": {"$in": ["fresh-meals", "meals", "food"]}},
            {"product_type": {"$regex": "meal|food", "$options": "i"}},
            {"title": {"$regex": "meal|food|fresh|kibble", "$options": "i"}},
            {"tags": {"$in": ["Meals", "Fresh", "Food"]}}
        ]
    }).to_list(length=500)
    
    print(f"Found {len(meal_products)} meal products to enrich")
    
    stats = {
        "titles_upgraded": 0,
        "descriptions_enhanced": 0,
        "tags_enriched": 0,
        "life_stage_added": 0,
        "total_updated": 0
    }
    
    for product in meal_products:
        updates = {}
        title = product.get('title', '')
        description = product.get('description', '') or ''
        existing_tags = product.get('tags', [])
        
        # 1. Determine protein type
        protein = determine_protein(title, description)
        
        # 2. Upgrade title if in our list
        if title in TITLE_UPGRADES:
            updates['title'] = TITLE_UPGRADES[title]
            stats['titles_upgraded'] += 1
        
        # 3. Enhance description
        new_desc = generate_meal_description(title, description, protein)
        if new_desc != description:
            updates['description'] = new_desc
            stats['descriptions_enhanced'] += 1
        
        # 4. Enrich tags
        new_tags = enrich_meal_tags(existing_tags, title, protein)
        if set(new_tags) != set(existing_tags):
            updates['tags'] = new_tags
            stats['tags_enriched'] += 1
        
        # 5. Add life_stage if missing
        if not product.get('life_stage'):
            title_lower = title.lower()
            if 'puppy' in title_lower:
                updates['life_stage'] = 'puppy'
            elif 'senior' in title_lower:
                updates['life_stage'] = 'senior'
            else:
                updates['life_stage'] = 'all-ages'
            stats['life_stage_added'] += 1
        
        # 6. Add dietary info
        if not product.get('dietary'):
            if 'grain' in title.lower() and 'free' in title.lower():
                updates['dietary'] = 'grain-free'
            elif 'paneer' in title.lower() or 'veg' in title.lower():
                updates['dietary'] = 'vegetarian'
            else:
                updates['dietary'] = 'regular'
        
        # 7. Ensure autoship enabled for meals
        if not product.get('autoship_enabled'):
            updates['autoship_enabled'] = True
        
        # 8. Add fresh_delivery_cities for meals
        if not product.get('fresh_delivery_cities'):
            updates['fresh_delivery_cities'] = ['Bangalore', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai']
        
        # Apply updates
        if updates:
            product_id = product.get('shopify_id') or product.get('id') or str(product.get('_id'))
            await db.products.update_one(
                {"$or": [{"shopify_id": product_id}, {"id": product_id}, {"_id": product.get('_id')}]},
                {"$set": updates}
            )
            stats['total_updated'] += 1
            print(f"✅ {title[:50]}...")
    
    # Also enrich treats for the meal plan
    print("\n--- Enriching Treats ---")
    treat_products = await db.products.find({
        "$or": [
            {"category": {"$in": ["treats", "desi-treats", "cat-treats"]}},
            {"title": {"$regex": "treat|biscuit|cookie|snack", "$options": "i"}}
        ]
    }).to_list(length=500)
    
    print(f"Found {len(treat_products)} treat products")
    
    for product in treat_products:
        updates = {}
        existing_tags = product.get('tags', [])
        
        # Add treat-specific tags
        treat_tags = ["Treats", "Snacks", "Reward", "Training-Treats"]
        new_tags = list(set(existing_tags + treat_tags))
        
        if set(new_tags) != set(existing_tags):
            updates['tags'] = new_tags
        
        if not product.get('life_stage'):
            updates['life_stage'] = 'all-ages'
        
        if updates:
            await db.products.update_one(
                {"_id": product.get('_id')},
                {"$set": updates}
            )
            stats['total_updated'] += 1
    
    print("\n" + "="*50)
    print("MEAL ENRICHMENT COMPLETE!")
    print("="*50)
    print(f"Titles upgraded: {stats['titles_upgraded']}")
    print(f"Descriptions enhanced: {stats['descriptions_enhanced']}")
    print(f"Tags enriched: {stats['tags_enriched']}")
    print(f"Life stage added: {stats['life_stage_added']}")
    print(f"Total products updated: {stats['total_updated']}")
    
    client.close()
    return stats

if __name__ == "__main__":
    asyncio.run(enrich_meal_products())
