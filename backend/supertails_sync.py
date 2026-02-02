"""
Supertails Product Sync Tool
Syncs products from supertails.com into The Doggy Company database
"""

import asyncio
import httpx
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
import uuid

# Sample products extracted from Supertails (we can expand this)
SUPERTAILS_PRODUCTS = [
    {
        "name": "Henlo Chicken & Vegetable Baked Dry Food for Adult Dogs",
        "source_url": "https://supertails.com/products/henlo-baked-dry-food-for-adult-dogs-100-human-grade-ingredients",
        "price": 2179,
        "category": "dry-food",
        "brand": "Henlo",
        "description": "100% Human Grade Ingredients baked dry food for adult dogs",
        "pillar": "dine",
        "tags": ["adult", "dry-food", "chicken", "baked"]
    },
    {
        "name": "Pedigree Chicken and Vegetables Adult Dog Dry Food",
        "source_url": "https://supertails.com/products/pedigree-chicken-vegetables-adult-dry-dog-food",
        "price": 3315,
        "category": "dry-food",
        "brand": "Pedigree",
        "description": "Complete nutrition dry food for adult dogs with chicken and vegetables",
        "pillar": "dine",
        "tags": ["adult", "dry-food", "chicken", "vegetables"]
    },
    {
        "name": "Mankind Petstar Starter Mother & Baby Dog Dry Food",
        "source_url": "https://supertails.com/products/mankind-petstar-starter-mother-baby-dog-dry-food-1",
        "price": 565,
        "category": "dry-food",
        "brand": "Mankind Petstar",
        "description": "Starter dry food for mother and baby dogs",
        "pillar": "dine",
        "tags": ["puppy", "starter", "dry-food", "mother-baby"]
    },
    {
        "name": "Drools Optimum Performance Adult Dog Dry Food",
        "source_url": "https://supertails.com/products/drools-optimum-performance-adult-dog-food",
        "price": 2852,
        "category": "dry-food",
        "brand": "Drools",
        "description": "High performance dry food for active adult dogs",
        "pillar": "dine",
        "tags": ["adult", "dry-food", "performance", "active"]
    },
    {
        "name": "Royal Canin Maxi Puppy Dog Dry Food (1kg)",
        "source_url": "https://supertails.com/products/royal-canin-maxi-puppy-dry-food",
        "price": 1000,
        "category": "dry-food",
        "brand": "Royal Canin",
        "description": "Premium dry food for large breed puppies",
        "pillar": "dine",
        "tags": ["puppy", "dry-food", "large-breed", "premium"]
    },
    {
        "name": "Henlo Chicken and Egg Baked Dry Food for Adult Dogs & Puppies",
        "source_url": "https://supertails.com/products/henlo-chicken-and-egg-baked-dry-food-for-adult-dogs-puppies-100-human-grade-ingredients-1",
        "price": 750,
        "category": "dry-food",
        "brand": "Henlo",
        "description": "Human grade baked dry food with chicken and egg",
        "pillar": "dine",
        "tags": ["adult", "puppy", "dry-food", "chicken", "egg", "baked"]
    },
    {
        "name": "Pro Plan Chicken Large Breed Adult Dog Dry Food",
        "source_url": "https://supertails.com/products/proplan-chicken-adult-large-dry-dog-food",
        "price": 2032,
        "category": "dry-food",
        "brand": "Pro Plan",
        "description": "New improved formula for large breed adult dogs",
        "pillar": "dine",
        "tags": ["adult", "dry-food", "large-breed", "chicken"]
    },
    {
        "name": "Kennel Kitchen Supreme Cuts in Gravy Variety Pack Dog Wet Food",
        "source_url": "https://supertails.com/products/kennel-kitchen-supreme-cuts-in-gravy-dog-wet-food-pack-of-12",
        "price": 1596,
        "category": "wet-food",
        "brand": "Kennel Kitchen",
        "description": "Supreme cuts in gravy variety pack for all life stages",
        "pillar": "dine",
        "tags": ["wet-food", "gravy", "variety-pack", "all-ages"]
    },
    {
        "name": "Farmina N&D Chicken & Pomegranate Ancestral Grain Adult Dog Dry Food",
        "source_url": "https://supertails.com/products/farmina-n-d-chicken-pomegranate-ancestral-grain-selection-adult-medium-maxi-dry-dog-food",
        "price": 7993,
        "category": "dry-food",
        "brand": "Farmina",
        "description": "Premium ancestral grain formula for medium to large adult dogs",
        "pillar": "dine",
        "tags": ["adult", "dry-food", "premium", "grain-inclusive", "medium-large"]
    },
    {
        "name": "Carniwel Fresh Chicken Kibble Large Breed Adult Dog Dry Food",
        "source_url": "https://supertails.com/products/carniwel-fresh-chicken-kibble-large-breed-adult-dog-dry-food",
        "price": 435,
        "category": "dry-food",
        "brand": "Carniwel",
        "description": "Fresh chicken kibble for large breed adult dogs",
        "pillar": "dine",
        "tags": ["adult", "dry-food", "large-breed", "chicken", "budget"]
    },
    {
        "name": "Mankind Petstar Chunky Chicken Gravy Adult Dog Wet Food",
        "source_url": "https://supertails.com/products/mankind-petstar-chunky-chicken-gravy-for-adult",
        "price": 787,
        "category": "wet-food",
        "brand": "Mankind Petstar",
        "description": "Chunky chicken in gravy wet food for adult dogs",
        "pillar": "dine",
        "tags": ["adult", "wet-food", "chicken", "gravy"]
    },
    {
        "name": "Bark Out Loud Salmon & Turkey Adult Dog Dry Food",
        "source_url": "https://supertails.com/products/bark-out-loud-salmon-turkey-adult-dog-dry-food",
        "price": 1472,
        "category": "dry-food",
        "brand": "Bark Out Loud",
        "description": "Premium salmon and turkey dry food for adult dogs",
        "pillar": "dine",
        "tags": ["adult", "dry-food", "salmon", "turkey", "fish"]
    },
    # Add more treats
    {
        "name": "Pedigree Dentastix Large Breed Oral Care Dog Treat",
        "source_url": "https://supertails.com/products/pedigree-dentastix-large-breed",
        "price": 399,
        "category": "treats",
        "brand": "Pedigree",
        "description": "Dental care treats for large breed dogs",
        "pillar": "dine",
        "tags": ["treats", "dental", "large-breed", "oral-care"]
    },
    {
        "name": "Drools Chicken & Liver Gravy Dog Treat",
        "source_url": "https://supertails.com/products/drools-chicken-liver-gravy",
        "price": 199,
        "category": "treats",
        "brand": "Drools",
        "description": "Tasty chicken and liver gravy treats",
        "pillar": "dine",
        "tags": ["treats", "chicken", "liver", "gravy"]
    },
    {
        "name": "Himalaya Healthy Treats Puppy Biscuits",
        "source_url": "https://supertails.com/products/himalaya-healthy-treats-puppy",
        "price": 175,
        "category": "treats",
        "brand": "Himalaya",
        "description": "Healthy biscuit treats for puppies",
        "pillar": "dine",
        "tags": ["treats", "puppy", "biscuits", "healthy"]
    },
    # Add grooming products
    {
        "name": "Wahl Puppy Shampoo Gentle Formula",
        "source_url": "https://supertails.com/products/wahl-puppy-shampoo",
        "price": 549,
        "category": "grooming",
        "brand": "Wahl",
        "description": "Gentle formula shampoo specially designed for puppies",
        "pillar": "care",
        "tags": ["grooming", "shampoo", "puppy", "gentle"]
    },
    {
        "name": "Furminator Deshedding Tool for Dogs",
        "source_url": "https://supertails.com/products/furminator-deshedding-tool",
        "price": 2499,
        "category": "grooming",
        "brand": "Furminator",
        "description": "Professional deshedding tool to reduce shedding up to 90%",
        "pillar": "care",
        "tags": ["grooming", "deshedding", "brush", "professional"]
    },
    {
        "name": "Beaphar Tick & Flea Collar for Dogs",
        "source_url": "https://supertails.com/products/beaphar-tick-flea-collar",
        "price": 399,
        "category": "health",
        "brand": "Beaphar",
        "description": "Effective tick and flea protection collar",
        "pillar": "care",
        "tags": ["health", "tick", "flea", "collar", "protection"]
    },
    # Add toys
    {
        "name": "Kong Classic Dog Toy Medium",
        "source_url": "https://supertails.com/products/kong-classic-medium",
        "price": 799,
        "category": "toys",
        "brand": "Kong",
        "description": "Durable rubber toy for interactive play and treat dispensing",
        "pillar": "enjoy",
        "tags": ["toys", "interactive", "durable", "treat-dispensing"]
    },
    {
        "name": "Trixie Rope Ball Dog Toy",
        "source_url": "https://supertails.com/products/trixie-rope-ball",
        "price": 299,
        "category": "toys",
        "brand": "Trixie",
        "description": "Colorful rope ball for tug and fetch games",
        "pillar": "enjoy",
        "tags": ["toys", "rope", "ball", "fetch", "tug"]
    }
]


def generate_product_id():
    """Generate a unique product ID"""
    return f"st-{uuid.uuid4().hex[:8]}"


def transform_to_tdc_format(product):
    """Transform Supertails product to The Doggy Company format"""
    return {
        "id": generate_product_id(),
        "shopify_id": None,  # No Shopify ID for synced products
        "name": product["name"],
        "title": product["name"],
        "description": product["description"],
        "price": float(product["price"]),
        "original_price": float(product["price"]) * 1.15,  # 15% markup for original price
        "currency": "INR",
        "category": product["category"],
        "pillar": product["pillar"],
        "brand": product.get("brand", ""),
        "image": f"https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",  # Placeholder
        "images": [],
        "tags": product.get("tags", []),
        "intelligent_tags": product.get("tags", []),
        "breed_tags": ["all_breeds"],
        "size_tags": ["all_sizes"],
        "age_tags": ["adult"] if "adult" in product.get("tags", []) else ["all_ages"],
        "occasion_tags": [],
        "is_active": True,
        "in_stock": True,
        "stock_quantity": 100,
        "source": "supertails_sync",
        "source_url": product.get("source_url", ""),
        "synced_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }


async def sync_products_to_db(db, products_to_sync=None, limit=20):
    """Sync products from Supertails to MongoDB"""
    
    if products_to_sync is None:
        products_to_sync = SUPERTAILS_PRODUCTS[:limit]
    
    results = {
        "synced": 0,
        "skipped": 0,
        "errors": 0,
        "products": []
    }
    
    for product in products_to_sync:
        try:
            # Check if product already exists by name
            existing = await db.products.find_one({"name": product["name"]})
            if existing:
                results["skipped"] += 1
                continue
            
            # Transform to TDC format
            tdc_product = transform_to_tdc_format(product)
            
            # Insert into products collection
            await db.products.insert_one(tdc_product)
            
            # Also insert into unified_products for search
            unified_product = tdc_product.copy()
            unified_product["product_type"] = "external_sync"
            await db.unified_products.insert_one(unified_product)
            
            results["synced"] += 1
            results["products"].append({
                "id": tdc_product["id"],
                "name": tdc_product["name"],
                "price": tdc_product["price"],
                "pillar": tdc_product["pillar"]
            })
            
        except Exception as e:
            results["errors"] += 1
            print(f"Error syncing product {product['name']}: {e}")
    
    return results


# Standalone test
if __name__ == "__main__":
    print(f"Supertails Product Sync Tool")
    print(f"Available products: {len(SUPERTAILS_PRODUCTS)}")
    for p in SUPERTAILS_PRODUCTS[:5]:
        print(f"  - {p['name']}: ₹{p['price']}")
