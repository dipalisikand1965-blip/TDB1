"""
Bundle Deconstruction Script for The Doggy Company

This script:
1. Finds all existing bundles in celebrate_bundles and dine_bundles collections
2. Extracts individual items from each bundle's 'includes' field
3. Creates standalone purchasable products for each item
4. Keeps original bundles intact

All new products will be:
- Added to products and unified_products collections
- Assigned to the appropriate pillar (celebrate/dine)
- Tagged for Mira AI search
- Fully editable via admin Product Box
"""

import os
import sys
from datetime import datetime, timezone
from pymongo import MongoClient
import uuid
import re

# Get MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'doggy_company')

client = MongoClient(mongo_url)
db = client[db_name]

def generate_id(prefix="bundle-item"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"

def clean_item_name(item_name):
    """Clean and standardize item name"""
    # Remove quantity indicators like (500g), (20 pack), etc
    cleaned = re.sub(r'\s*\([^)]*\)\s*$', '', item_name)
    # Remove leading numbers
    cleaned = re.sub(r'^\d+\s*x?\s*', '', cleaned)
    return cleaned.strip()

def estimate_price(item_name, bundle_price=0, total_items=1):
    """Estimate a reasonable price for individual items"""
    item_lower = item_name.lower()
    
    # Price mapping based on item type
    price_map = {
        # Cakes
        'cake': 599,
        '2-tier cake': 1299,
        'mini cake': 449,
        'celebration cake': 699,
        'birthday cake': 599,
        'anniversary cake': 699,
        
        # Photo & Sessions
        'photo': 999,
        'photo shoot': 1499,
        'photo session': 1499,
        'edited photo': 199,
        'digital album': 499,
        
        # Clothing & Accessories
        'outfit': 499,
        'bandana': 299,
        'party hat': 199,
        'hat set': 349,
        'bow tie': 199,
        
        # Treats
        'treat': 249,
        'treats': 299,
        'gourmet treat': 399,
        'jerky': 299,
        'biscuit': 199,
        'freeze-dried': 349,
        'dental chew': 249,
        
        # Decorations
        'decoration': 399,
        'napkins': 99,
        'banner': 199,
        'balloon': 199,
        
        # Party Favors
        'party favor': 299,
        'props': 399,
        'accessories': 349,
        
        # Food Items
        'meal': 399,
        'gourmet meal': 549,
        
        # Misc
        'frame': 349,
        'toy': 299,
        'plush': 349,
        'bowl': 299,
        'pouch': 199,
        'wipes': 149,
        'bottle': 249,
        'box': 499
    }
    
    # Find matching price
    for keyword, price in price_map.items():
        if keyword in item_lower:
            return price
    
    # Default: distribute bundle price across items
    if bundle_price and total_items:
        return max(199, int(bundle_price / total_items * 0.8))
    
    return 299  # Default price

def get_item_category(item_name):
    """Determine category based on item name"""
    item_lower = item_name.lower()
    
    category_map = {
        'cake': ('cakes', 'cakes'),
        'photo': ('services', 'photo_services'),
        'session': ('services', 'photo_services'),
        'outfit': ('accessories', 'clothing'),
        'bandana': ('accessories', 'bandanas'),
        'hat': ('party_accessories', 'party_hats'),
        'treat': ('treats', 'gourmet_treats'),
        'jerky': ('treats', 'meat_treats'),
        'biscuit': ('treats', 'biscuits'),
        'decoration': ('party_supplies', 'decorations'),
        'napkin': ('party_supplies', 'tableware'),
        'favor': ('party_supplies', 'favors'),
        'prop': ('party_supplies', 'props'),
        'meal': ('food', 'meals'),
        'frame': ('accessories', 'keepsakes'),
        'toy': ('toys', 'plush'),
        'bowl': ('accessories', 'feeding'),
        'pouch': ('accessories', 'bags'),
        'wipe': ('care', 'hygiene'),
        'bottle': ('accessories', 'travel')
    }
    
    for keyword, (parent, cat) in category_map.items():
        if keyword in item_lower:
            return parent, cat
    
    return 'accessories', 'general'

def get_item_tags(item_name, pillar):
    """Generate relevant tags for the item"""
    item_lower = item_name.lower()
    
    base_tags = [pillar, "pan-india", "all_sizes"]
    
    # Add relevant tags based on keywords
    tag_keywords = {
        'cake': ['birthday', 'celebration', 'treat', 'cake'],
        'photo': ['photography', 'memories', 'keepsake'],
        'treat': ['snack', 'reward', 'training'],
        'jerky': ['protein', 'meat', 'healthy'],
        'party': ['celebration', 'birthday', 'party'],
        'bandana': ['accessory', 'fashion', 'wearable'],
        'hat': ['costume', 'party', 'photo_prop'],
        'decoration': ['party', 'decor', 'celebration'],
        'meal': ['food', 'nutrition', 'dining'],
        'toy': ['play', 'fun', 'enrichment']
    }
    
    for keyword, tags in tag_keywords.items():
        if keyword in item_lower:
            base_tags.extend(tags)
    
    return list(set(base_tags))

def deconstruct_bundles():
    """Extract individual items from all bundles"""
    
    all_items = []
    
    # Process celebrate_bundles
    celebrate_bundles = list(db.celebrate_bundles.find())
    print(f"\n📦 Found {len(celebrate_bundles)} celebrate bundles")
    
    for bundle in celebrate_bundles:
        bundle_name = bundle.get('name', 'Unknown Bundle')
        includes = bundle.get('includes', [])
        price = bundle.get('price', 0)
        
        if not includes:
            print(f"  ⚠️  {bundle_name} has no includes, skipping")
            continue
            
        print(f"\n  🎁 {bundle_name} ({len(includes)} items):")
        
        for item in includes:
            item_name = clean_item_name(item)
            parent_cat, category = get_item_category(item)
            estimated_price = estimate_price(item, price, len(includes))
            
            product = {
                "id": generate_id("celebrate-item"),
                "name": f"TDC {item_name}",
                "description": f"Individual item from {bundle_name}. Premium quality celebration essential from The Doggy Company.",
                "price": estimated_price,
                "mrp": int(estimated_price * 1.3),
                "category": category,
                "parent_category": parent_cat,
                "pillar": "celebrate",
                "tags": get_item_tags(item, "celebrate"),
                "images": [get_item_image(item_name)],
                "thumbnail": get_item_image(item_name),
                "in_stock": True,
                "is_active": True,
                "is_pan_india_shippable": True,
                "source": "bundle_deconstruction",
                "source_bundle": bundle_name,
                "size_tags": ["all_sizes"],
                "breed_tags": ["all_breeds"],
                "occasion_tags": ["birthday", "celebration"],
                "intelligent_tags": get_item_tags(item, "celebrate"),
                "mira_visible": True,
                "search_keywords": get_item_tags(item, "celebrate") + ["dog", "pet", "celebrate", item_name.lower()]
            }
            
            all_items.append(product)
            print(f"      ✓ {item_name} → ₹{estimated_price}")
    
    # Process dine_bundles
    dine_bundles = list(db.dine_bundles.find())
    print(f"\n📦 Found {len(dine_bundles)} dine bundles")
    
    for bundle in dine_bundles:
        bundle_name = bundle.get('name', 'Unknown Bundle')
        includes = bundle.get('includes', bundle.get('items', []))
        price = bundle.get('price', 0)
        
        if not includes:
            print(f"  ⚠️  {bundle_name} has no includes, skipping")
            continue
            
        print(f"\n  🍽️  {bundle_name} ({len(includes)} items):")
        
        for item in includes:
            item_name = clean_item_name(item)
            parent_cat, category = get_item_category(item)
            estimated_price = estimate_price(item, price, len(includes))
            
            product = {
                "id": generate_id("dine-item"),
                "name": f"TDC {item_name}",
                "description": f"Individual item from {bundle_name}. Premium quality dining essential from The Doggy Company.",
                "price": estimated_price,
                "mrp": int(estimated_price * 1.3),
                "category": category,
                "parent_category": parent_cat,
                "pillar": "dine",
                "tags": get_item_tags(item, "dine"),
                "images": [get_item_image(item_name)],
                "thumbnail": get_item_image(item_name),
                "in_stock": True,
                "is_active": True,
                "is_pan_india_shippable": True,
                "source": "bundle_deconstruction",
                "source_bundle": bundle_name,
                "size_tags": ["all_sizes"],
                "breed_tags": ["all_breeds"],
                "occasion_tags": ["dining", "special_occasion"],
                "intelligent_tags": get_item_tags(item, "dine"),
                "mira_visible": True,
                "search_keywords": get_item_tags(item, "dine") + ["dog", "pet", "dine", item_name.lower()]
            }
            
            all_items.append(product)
            print(f"      ✓ {item_name} → ₹{estimated_price}")
    
    return all_items

def get_item_image(item_name):
    """Get appropriate stock image based on item type"""
    item_lower = item_name.lower()
    
    image_map = {
        'cake': 'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400',
        'photo': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
        'session': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
        'outfit': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
        'bandana': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
        'hat': 'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400',
        'treat': 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400',
        'jerky': 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400',
        'biscuit': 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400',
        'decoration': 'https://images.unsplash.com/photo-1530041539828-114de669390e?w=400',
        'napkin': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
        'favor': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
        'prop': 'https://images.unsplash.com/photo-1530041539828-114de669390e?w=400',
        'meal': 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
        'frame': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
        'toy': 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=400',
        'bowl': 'https://images.unsplash.com/photo-1601758176885-f4a9b12eff8c?w=400',
        'pouch': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
        'wipe': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
        'bottle': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
        'box': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400'
    }
    
    for keyword, image_url in image_map.items():
        if keyword in item_lower:
            return image_url
    
    return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'

def run_deconstruction():
    """Main function to run bundle deconstruction"""
    
    print("=" * 60)
    print("📦 BUNDLE DECONSTRUCTION")
    print("=" * 60)
    print("\nExtracting individual items from bundles...")
    print("(Original bundles will be preserved)")
    
    items = deconstruct_bundles()
    
    if not items:
        print("\n⚠️  No items extracted from bundles")
        return 0
    
    # Add common fields and insert
    now = datetime.now(timezone.utc)
    products_inserted = 0
    unified_inserted = 0
    skipped = 0
    
    print("\n" + "=" * 60)
    print("💾 INSERTING PRODUCTS")
    print("=" * 60)
    
    for product in items:
        try:
            # Check if similar product already exists
            existing = db.products.find_one({
                "$or": [
                    {"name": product["name"]},
                    {"name": product["name"].replace("TDC ", "")}
                ]
            })
            
            if existing:
                print(f"  ⚠️  Skipping (exists): {product['name']}")
                skipped += 1
                continue
            
            # Add timestamps
            product["created_at"] = now
            product["updated_at"] = now
            product["stock_quantity"] = 50
            
            # Insert into products
            db.products.insert_one(product.copy())
            products_inserted += 1
            
            # Insert into unified_products
            unified_product = product.copy()
            unified_product["type"] = "product"
            db.unified_products.insert_one(unified_product)
            unified_inserted += 1
            
            print(f"  ✅ Added: {product['name']} (₹{product['price']})")
            
        except Exception as e:
            print(f"  ❌ Error adding {product.get('name', 'unknown')}: {e}")
    
    print()
    print("=" * 60)
    print(f"✅ DECONSTRUCTION COMPLETE")
    print(f"   Items extracted: {len(items)}")
    print(f"   Products added: {products_inserted}")
    print(f"   Unified products added: {unified_inserted}")
    print(f"   Skipped (duplicates): {skipped}")
    print("=" * 60)
    
    client.close()
    return products_inserted


if __name__ == "__main__":
    run_deconstruction()
