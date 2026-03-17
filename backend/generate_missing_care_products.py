"""
Generate missing Care products:
- 8 Grooming Kits (for breeds that only have Soul Care products)
- 27 Soul Care Trios (Bath Towel + Drying Robe + Grooming Apron for 9 breeds)
Then trigger AI image generation for all new products.
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME   = os.environ.get('DB_NAME', 'thedoggycompany')

# ─── Missing Grooming Kits (breed_slug, display_name) ─────────────────────────
MISSING_KITS = [
    ('american_bully',    'American Bully'),
    ('chow_chow',         'Chow Chow'),
    ('english_bulldog',   'English Bulldog'),
    ('irish_setter',      'Irish Setter'),
    ('italian_greyhound', 'Italian Greyhound'),
    ('schnoodle',         'Schnoodle'),
    ('scottish_terrier',  'Scottish Terrier'),
    ('st_bernard',        'St Bernard'),
]

# ─── Missing Soul Care Trios (breed_slug, display_name) ────────────────────────
MISSING_SOUL = [
    ('akita',                 'Akita'),
    ('australian_shepherd',   'Australian Shepherd'),
    ('bernese_mountain_dog',  'Bernese Mountain Dog'),
    ('corgi',                 'Corgi'),
    ('saint_bernard',         'Saint Bernard'),
    ('samoyed',               'Samoyed'),
    ('shiba_inu',             'Shiba Inu'),
    ('spitz',                 'Spitz'),
    ('weimaraner',            'Weimaraner'),
]

now = datetime.now(timezone.utc)

def make_grooming_kit(slug, title):
    return {
        "id":               f"breed-{slug}-grooming_kit-{uuid.uuid4().hex[:8]}",
        "name":             f"{title} Grooming Essentials Kit",
        "title":            f"{title} Grooming Essentials Kit",
        "description":      f"Complete grooming kit for {title}s — breed-specific shampoo, brush, ear cleaner, and nail care.",
        "short_description": f"Breed-specific grooming essentials for {title}s.",
        "category":         "grooming",
        "pillar":           "care",
        "pillars":          ["care", "shop"],
        "dimension":        "Grooming",
        "sub_category":     "Grooming Tools",
        "breed":            slug,
        "breed_tags":       [slug],
        "size_tags":        ["all_sizes"],
        "in_stock":         True,
        "is_active":        True,
        "active":           True,
        "mira_can_reference": True,
        "mira_can_suggest": True,
        "source":           "breed_products",
        "gst_rate":         18.0,
        "price":            1299,
        "compare_at_price": 1558.8,
        "vendor":           "Soul Made",
        "vendor_type":      "soul_made",
        "semantic_intents": ["skin_coat", "puppy_essentials"],
        "tags":             [slug, "grooming", "essentials"],
        "mira_tag":         f"Breed-matched for {title}s",
        "mira_hint":        f"Curated for {title}'s specific coat and skin needs",
        "ai_image_generated": False,
        "created_at":       now,
        "updated_at":       now,
    }

def make_soul_trio(slug, title):
    return [
        {
            "id":            f"soul-breed-{slug}-pet_towel",
            "name":          f"{title} Bath Towel",
            "title":         f"{title} Bath Towel",
            "description":   f"Ultra-absorbent microfibre bath towel sized for {title}s — quick drying, soft weave.",
            "category":      "breed-pet_towels",
            "pillar":        "care",
            "pillars":       ["care"],
            "dimension":     "Soul Care Products",
            "sub_category":  "Breed Collection",
            "breed":         slug,
            "breed_tags":    [slug],
            "size_tags":     ["all_sizes"],
            "in_stock":      True,
            "is_active":     True,
            "active":        True,
            "source":        "breed_products",
            "price":         699,
            "compare_at_price": 838.8,
            "vendor":        "Soul Made",
            "vendor_type":   "soul_made",
            "semantic_intents": ["skin_coat"],
            "tags":          [slug, "towel", "bath"],
            "ai_image_generated": False,
            "created_at":    now,
            "updated_at":    now,
        },
        {
            "id":            f"soul-breed-{slug}-pet_robe",
            "name":          f"{title} Drying Robe",
            "title":         f"{title} Drying Robe",
            "description":   f"Cosy post-bath drying robe for {title}s — keeps them warm while absorbing moisture.",
            "category":      "breed-pet_robes",
            "pillar":        "care",
            "pillars":       ["care"],
            "dimension":     "Soul Care Products",
            "sub_category":  "Breed Collection",
            "breed":         slug,
            "breed_tags":    [slug],
            "size_tags":     ["all_sizes"],
            "in_stock":      True,
            "is_active":     True,
            "active":        True,
            "source":        "breed_products",
            "price":         899,
            "compare_at_price": 1078.8,
            "vendor":        "Soul Made",
            "vendor_type":   "soul_made",
            "semantic_intents": ["skin_coat"],
            "tags":          [slug, "robe", "drying"],
            "ai_image_generated": False,
            "created_at":    now,
            "updated_at":    now,
        },
        {
            "id":            f"soul-breed-{slug}-grooming_apron",
            "name":          f"{title} Grooming Apron",
            "title":         f"{title} Grooming Apron",
            "description":   f"Waterproof grooming apron featuring {title} artwork — keep sessions mess-free and stylish.",
            "category":      "breed-grooming_aprons",
            "pillar":        "care",
            "pillars":       ["care"],
            "dimension":     "Soul Care Products",
            "sub_category":  "Breed Collection",
            "breed":         slug,
            "breed_tags":    [slug],
            "size_tags":     ["all_sizes"],
            "in_stock":      True,
            "is_active":     True,
            "active":        True,
            "source":        "breed_products",
            "price":         1099,
            "compare_at_price": 1318.8,
            "vendor":        "Soul Made",
            "vendor_type":   "soul_made",
            "semantic_intents": ["skin_coat"],
            "tags":          [slug, "apron", "grooming"],
            "ai_image_generated": False,
            "created_at":    now,
            "updated_at":    now,
        },
    ]

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    col = db["products_master"]

    products_to_insert = []

    # Build grooming kits
    for slug, title in MISSING_KITS:
        # Check if already exists
        existing = await col.find_one({"name": f"{title} Grooming Essentials Kit"})
        if existing:
            print(f"  SKIP (exists): {title} Grooming Essentials Kit")
        else:
            products_to_insert.append(make_grooming_kit(slug, title))
            print(f"  QUEUE: {title} Grooming Essentials Kit")

    # Build soul care trios
    for slug, title in MISSING_SOUL:
        for product in make_soul_trio(slug, title):
            existing = await col.find_one({"name": product["name"]})
            if existing:
                print(f"  SKIP (exists): {product['name']}")
            else:
                products_to_insert.append(product)
                print(f"  QUEUE: {product['name']}")

    if not products_to_insert:
        print("\nAll products already exist — nothing to insert.")
        client.close()
        return

    print(f"\nInserting {len(products_to_insert)} products...")
    result = await col.insert_many(products_to_insert)
    print(f"Inserted {len(result.inserted_ids)} products successfully.")

    # Print IDs for image generation
    print("\n=== Product IDs for image generation ===")
    for p in products_to_insert:
        print(p["id"])

    client.close()

if __name__ == "__main__":
    asyncio.run(main())
