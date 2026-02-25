"""
Cake Product Enrichment Script
Standardizes options and adds personalization tags to all cake products
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "doggy_company")

# Tag categories for personalization
LIFE_STAGE_KEYWORDS = {
    "puppy": ["puppy", "pup", "junior", "baby", "small"],
    "adult": ["adult", "regular"],
    "senior": ["senior", "elder", "old"],
    "all-ages": []  # default
}

OCCASION_KEYWORDS = {
    "birthday": ["birthday", "barkday", "celebration", "party"],
    "gotcha-day": ["gotcha", "adoption", "anniversary"],
    "festival": ["diwali", "christmas", "halloween", "valentine", "holi", "spooky"],
    "special-treat": ["special", "treat", "reward"],
    "everyday": ["everyday", "daily"]
}

DIETARY_KEYWORDS = {
    "grain-free": ["grain-free", "grain free", "no grain"],
    "vegan": ["vegan", "vegetarian", "veggie"],
    "low-fat": ["low-fat", "low fat", "lite", "light"],
    "hypoallergenic": ["hypoallergenic", "allergy", "sensitive"]
}

# Bestseller products (by title keywords)
BESTSELLER_KEYWORDS = ["kawaii", "tailored", "rainbow", "paw print", "breed", "labrador", "golden retriever", "husky"]
NEW_ARRIVAL_KEYWORDS = ["new", "2024", "2025", "launch"]

def determine_life_stage(title, description, tags):
    """Determine life stage based on product content"""
    content = f"{title} {description} {' '.join(tags)}".lower()
    
    for stage, keywords in LIFE_STAGE_KEYWORDS.items():
        if any(kw in content for kw in keywords):
            return stage
    return "all-ages"

def determine_occasion(title, description, tags):
    """Determine occasion based on product content"""
    content = f"{title} {description} {' '.join(tags)}".lower()
    
    for occasion, keywords in OCCASION_KEYWORDS.items():
        if any(kw in content for kw in keywords):
            return occasion
    return "birthday"  # default for cakes

def determine_dietary(title, description, tags):
    """Determine dietary type based on product content"""
    content = f"{title} {description} {' '.join(tags)}".lower()
    
    for dietary, keywords in DIETARY_KEYWORDS.items():
        if any(kw in content for kw in keywords):
            return dietary
    return "regular"

def is_bestseller(title, tags):
    """Check if product should be marked as bestseller"""
    content = f"{title} {' '.join(tags)}".lower()
    return any(kw in content for kw in BESTSELLER_KEYWORDS)

def is_new_arrival(title, tags):
    """Check if product should be marked as new arrival"""
    content = f"{title} {' '.join(tags)}".lower()
    return any(kw in content for kw in NEW_ARRIVAL_KEYWORDS)

def standardize_base_options(options):
    """Standardize Oat→Oats, Rag→Ragi"""
    updated = False
    for opt in options:
        if opt.get('name') == 'Base':
            values = opt.get('values', [])
            new_values = []
            for v in values:
                if v == 'Oat':
                    new_values.append('Oats')
                    updated = True
                elif v == 'Rag':
                    new_values.append('Ragi')
                    updated = True
                else:
                    new_values.append(v)
            opt['values'] = new_values
    return options, updated

def standardize_variant_titles(variants):
    """Standardize variant titles"""
    updated = False
    for v in variants:
        title = v.get('title', '')
        new_title = title.replace('Oat /', 'Oats /').replace('Rag /', 'Ragi /')
        new_title = new_title.replace('/ Oat', '/ Oats').replace('/ Rag', '/ Ragi')
        if new_title != title:
            v['title'] = new_title
            updated = True
        
        # Also fix option values
        if v.get('option1') == 'Oat':
            v['option1'] = 'Oats'
            updated = True
        if v.get('option1') == 'Rag':
            v['option1'] = 'Ragi'
            updated = True
    return variants, updated

def enrich_tags(existing_tags, title, description, is_cake=True):
    """Add enriched tags for personalization"""
    tags = list(set(existing_tags))  # Remove duplicates
    
    # Add category tag
    if is_cake and 'Cakes' not in tags:
        tags.append('Cakes')
    
    # Add occasion tags
    title_lower = title.lower()
    if 'birthday' in title_lower or 'barkday' in title_lower:
        if 'Birthdays' not in tags:
            tags.append('Birthdays')
    if 'valentine' in title_lower or 'love' in title_lower or 'heart' in title_lower:
        if 'Valentine' not in tags:
            tags.append('Valentine')
    if 'halloween' in title_lower or 'spooky' in title_lower:
        if 'Halloween' not in tags:
            tags.append('Halloween')
    if 'christmas' in title_lower or 'xmas' in title_lower:
        if 'Christmas' not in tags:
            tags.append('Christmas')
    
    # Add shape tags
    if 'heart' in title_lower:
        if 'Heart' not in tags:
            tags.append('Heart')
    if 'round' in title_lower or 'circle' in title_lower:
        if 'Circle' not in tags:
            tags.append('Circle')
    if 'square' in title_lower:
        if 'Square' not in tags:
            tags.append('Square')
    if 'bone' in title_lower:
        if 'Bone' not in tags:
            tags.append('Bone')
    
    # Add breed tags if breed-specific
    breeds = ['labrador', 'golden retriever', 'husky', 'beagle', 'pug', 'bulldog', 'german shepherd', 'shih tzu', 'pomeranian', 'rottweiler', 'doberman', 'boxer', 'dalmatian', 'corgi', 'pitbull', 'indie', 'dachshund', 'chihuahua', 'maltese', 'cocker spaniel']
    for breed in breeds:
        if breed in title_lower:
            breed_tag = breed.title().replace(' ', '')
            if breed_tag not in tags:
                tags.append('Breed-Special')
                tags.append(breed_tag)
    
    # Add flavor tags
    if 'chicken' in title_lower:
        if 'Chicken' not in tags:
            tags.append('Chicken')
    if 'banana' in title_lower:
        if 'Banana' not in tags:
            tags.append('Banana')
    if 'peanut butter' in title_lower:
        if 'PeanutButter' not in tags:
            tags.append('PeanutButter')
    if 'blueberry' in title_lower or 'berry' in title_lower:
        if 'Berry' not in tags:
            tags.append('Berry')
    if 'strawberry' in title_lower:
        if 'Strawberry' not in tags:
            tags.append('Strawberry')
    
    return tags

async def enrich_all_cakes():
    """Main function to enrich all cake products"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get all cakes from products collection
    cakes = await db.products.find({
        "$or": [
            {"category": "cakes"},
            {"product_type": {"$regex": "cake", "$options": "i"}},
            {"tags": {"$in": ["Cakes", "cakes", "Birthday Cakes"]}}
        ]
    }).to_list(length=500)
    
    print(f"Found {len(cakes)} cake products to process")
    
    stats = {
        "options_fixed": 0,
        "variants_fixed": 0,
        "tags_enriched": 0,
        "life_stage_added": 0,
        "occasion_added": 0,
        "dietary_added": 0,
        "bestseller_added": 0,
        "new_arrival_added": 0,
        "total_updated": 0
    }
    
    for cake in cakes:
        updates = {}
        title = cake.get('title', '')
        description = cake.get('description', '') or ''
        existing_tags = cake.get('tags', [])
        
        # 1. Standardize options
        options = cake.get('options', [])
        if options:
            new_options, options_updated = standardize_base_options(options)
            if options_updated:
                updates['options'] = new_options
                stats['options_fixed'] += 1
        
        # 2. Standardize variants
        variants = cake.get('variants', [])
        if variants:
            new_variants, variants_updated = standardize_variant_titles(variants)
            if variants_updated:
                updates['variants'] = new_variants
                stats['variants_fixed'] += 1
        
        # 3. Enrich tags
        new_tags = enrich_tags(existing_tags, title, description, is_cake=True)
        if set(new_tags) != set(existing_tags):
            updates['tags'] = new_tags
            stats['tags_enriched'] += 1
        
        # 4. Add life_stage
        if not cake.get('life_stage'):
            life_stage = determine_life_stage(title, description, existing_tags)
            updates['life_stage'] = life_stage
            stats['life_stage_added'] += 1
        
        # 5. Add occasion
        if not cake.get('occasion'):
            occasion = determine_occasion(title, description, existing_tags)
            updates['occasion'] = occasion
            stats['occasion_added'] += 1
        
        # 6. Add dietary
        if not cake.get('dietary'):
            dietary = determine_dietary(title, description, existing_tags)
            updates['dietary'] = dietary
            stats['dietary_added'] += 1
        
        # 7. Mark bestsellers
        if not cake.get('is_bestseller') and is_bestseller(title, existing_tags):
            updates['is_bestseller'] = True
            stats['bestseller_added'] += 1
        
        # 8. Mark new arrivals
        if not cake.get('is_new') and is_new_arrival(title, existing_tags):
            updates['is_new'] = True
            stats['new_arrival_added'] += 1
        
        # 9. Add fresh_delivery_cities for cakes (default to major cities)
        if not cake.get('fresh_delivery_cities'):
            updates['fresh_delivery_cities'] = ['Bangalore', 'Mumbai', 'Delhi NCR']
        
        # Apply updates
        if updates:
            cake_id = cake.get('shopify_id') or cake.get('id') or str(cake.get('_id'))
            await db.products.update_one(
                {"$or": [{"shopify_id": cake_id}, {"id": cake_id}, {"_id": cake.get('_id')}]},
                {"$set": updates}
            )
            stats['total_updated'] += 1
            print(f"✅ Updated: {title[:50]}...")
    
    print("\n" + "="*50)
    print("ENRICHMENT COMPLETE!")
    print("="*50)
    print(f"Total cakes processed: {len(cakes)}")
    print(f"Options standardized (Oat→Oats, Rag→Ragi): {stats['options_fixed']}")
    print(f"Variants standardized: {stats['variants_fixed']}")
    print(f"Tags enriched: {stats['tags_enriched']}")
    print(f"Life stage added: {stats['life_stage_added']}")
    print(f"Occasion added: {stats['occasion_added']}")
    print(f"Dietary added: {stats['dietary_added']}")
    print(f"Bestsellers marked: {stats['bestseller_added']}")
    print(f"New arrivals marked: {stats['new_arrival_added']}")
    print(f"Total products updated: {stats['total_updated']}")
    
    client.close()
    return stats

if __name__ == "__main__":
    asyncio.run(enrich_all_cakes())
