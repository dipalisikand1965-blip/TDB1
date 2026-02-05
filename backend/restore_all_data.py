"""
COMPREHENSIVE DATA RESTORATION SCRIPT
For The Doggy Company - Restores products, restaurants, and other data
"""

import asyncio
import os
import uuid
import csv
import httpx
import re
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')
SHOPIFY_URL = "https://thedoggybakery.com/products.json"


async def fetch_shopify_products():
    """Fetch all products from Shopify"""
    print("\n📦 Fetching products from Shopify...")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(SHOPIFY_URL)
            data = response.json()
            products = data.get('products', [])
            print(f"   Found {len(products)} products from Shopify")
            return products
    except Exception as e:
        print(f"   ❌ Error fetching Shopify: {e}")
        return []


def parse_mockdata_products():
    """Parse products from mockData.js"""
    print("\n📦 Parsing products from mockData.js...")
    
    try:
        with open('/app/frontend/src/mockData.js', 'r') as f:
            content = f.read()
    except:
        print("   ❌ Could not read mockData.js")
        return []
    
    products = []
    
    # Extract product arrays using regex
    product_arrays = [
        'birthdayCakes', 'breedCakes', 'treats', 'dognuts', 'pizzasBurgers',
        'freshMeals', 'frozenTreats', 'accessories', 'catTreats', 'giftCards',
        'merchandise', 'miniCakes', 'desiTreats', 'nutButters', 'cakeMix', 'panIndiaCakes'
    ]
    
    # Simple approach: find each object block
    for arr_name in product_arrays:
        pattern = rf"export const {arr_name} = \[([\s\S]*?)\];"
        match = re.search(pattern, content)
        if match:
            arr_content = match.group(1)
            
            # Find individual product objects
            obj_matches = re.findall(r'\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}', arr_content)
            
            for obj_match in obj_matches:
                try:
                    # Extract key fields
                    id_match = re.search(r"id:\s*['\"]([^'\"]+)['\"]", obj_match)
                    name_match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", obj_match)
                    price_match = re.search(r"price:\s*(\d+)", obj_match)
                    image_match = re.search(r"image:\s*['\"]([^'\"]+)['\"]", obj_match)
                    desc_match = re.search(r"description:\s*['\"]([^'\"]+)['\"]", obj_match)
                    category_match = re.search(r"category:\s*['\"]([^'\"]+)['\"]", obj_match)
                    
                    if name_match and price_match:
                        product = {
                            'id': id_match.group(1) if id_match else f"mock-{uuid.uuid4().hex[:8]}",
                            'name': name_match.group(1),
                            'title': name_match.group(1),
                            'price': int(price_match.group(1)),
                            'image': image_match.group(1) if image_match else None,
                            'description': desc_match.group(1) if desc_match else '',
                            'category': category_match.group(1) if category_match else arr_name,
                            'source': 'mockdata',
                            'in_stock': True
                        }
                        products.append(product)
                except Exception as e:
                    continue
    
    print(f"   Found {len(products)} products from mockData.js")
    return products


def parse_restaurants_csv():
    """Parse restaurants from CSV files"""
    print("\n🏪 Parsing restaurants from CSV...")
    
    restaurants = []
    csv_files = ['/app/restaurants_complete.csv', '/app/restaurants_export.csv']
    
    for csv_file in csv_files:
        try:
            with open(csv_file, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    restaurant = {
                        'id': row.get('id', f"rest-{uuid.uuid4().hex[:8]}"),
                        'name': row.get('name', ''),
                        'area': row.get('area', ''),
                        'city': row.get('city', ''),
                        'pet_menu_available': row.get('petMenuAvailable', 'no') == 'yes',
                        'pet_policy': row.get('petPolicy', ''),
                        'cuisines': row.get('cuisine', '').split('|') if row.get('cuisine') else [],
                        'tags': row.get('tags', '').split('|') if row.get('tags') else [],
                        'rating': float(row.get('rating', 0) or 0),
                        'review_count': int(row.get('reviewCount', 0) or 0),
                        'price_range': row.get('priceRange', '₹₹'),
                        'image': row.get('image', ''),
                        'pet_menu_items': row.get('petMenuItems', '').split('|') if row.get('petMenuItems') else [],
                        'timings': row.get('timings', ''),
                        'phone': row.get('phone', ''),
                        'instagram': row.get('instagram', ''),
                        'website': row.get('website', ''),
                        'featured': row.get('featured', 'False') == 'True',
                        'verified': row.get('verified', 'False') == 'True',
                        'status': 'verified' if row.get('verified', 'False') == 'True' else 'pending'
                    }
                    if restaurant['name']:
                        restaurants.append(restaurant)
            print(f"   Found {len(restaurants)} restaurants from {csv_file}")
            break  # Use first successful file
        except Exception as e:
            print(f"   Could not read {csv_file}: {e}")
            continue
    
    return restaurants


async def restore_all():
    """Main restoration function"""
    print("=" * 60)
    print("🔄 COMPREHENSIVE DATA RESTORATION")
    print("=" * 60)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    now = datetime.now(timezone.utc).isoformat()
    
    try:
        # 1. Restore Products from Shopify
        shopify_products = await fetch_shopify_products()
        if shopify_products:
            existing_count = await db.products_master.count_documents({})
            print(f"   Current products in DB: {existing_count}")
            
            imported = 0
            for sp in shopify_products:
                # Check if product already exists by title
                existing = await db.products_master.find_one({
                    "$or": [
                        {"shopify_id": sp.get('id')},
                        {"title": sp.get('title')},
                        {"name": sp.get('title')}
                    ]
                })
                
                if not existing:
                    product_doc = {
                        'id': f"shopify-{sp.get('id')}",
                        'shopify_id': sp.get('id'),
                        'name': sp.get('title'),
                        'title': sp.get('title'),
                        'description': sp.get('body_html', ''),
                        'price': int(float(sp.get('variants', [{}])[0].get('price', 0))),
                        'image': sp.get('images', [{}])[0].get('src') if sp.get('images') else None,
                        'images': [img.get('src') for img in sp.get('images', [])],
                        'category': sp.get('product_type', 'general'),
                        'tags': sp.get('tags', []) if isinstance(sp.get('tags'), list) else (sp.get('tags', '').split(', ') if sp.get('tags') else []),
                        'vendor': sp.get('vendor'),
                        'in_stock': sp.get('variants', [{}])[0].get('available', True),
                        'variants': sp.get('variants', []),
                        'source': 'shopify',
                        'created_at': now,
                        'updated_at': now
                    }
                    await db.products_master.insert_one(product_doc)
                    imported += 1
            
            print(f"   ✅ Imported {imported} new Shopify products")
        
        # 2. Restore Products from mockData
        mock_products = parse_mockdata_products()
        if mock_products:
            imported = 0
            for mp in mock_products:
                existing = await db.products_master.find_one({
                    "$or": [
                        {"id": mp.get('id')},
                        {"name": mp.get('name')}
                    ]
                })
                
                if not existing:
                    mp['created_at'] = now
                    mp['updated_at'] = now
                    await db.products_master.insert_one(mp)
                    imported += 1
            
            print(f"   ✅ Imported {imported} new mockData products")
        
        # 3. Restore Restaurants from CSV
        csv_restaurants = parse_restaurants_csv()
        if csv_restaurants:
            # Add to dine_properties collection
            existing_count = await db.dine_properties.count_documents({})
            print(f"   Current restaurants in DB: {existing_count}")
            
            imported = 0
            for rest in csv_restaurants:
                existing = await db.dine_properties.find_one({
                    "$or": [
                        {"id": rest.get('id')},
                        {"name": rest.get('name'), "city": rest.get('city')}
                    ]
                })
                
                if not existing:
                    rest['created_at'] = now
                    rest['updated_at'] = now
                    await db.dine_properties.insert_one(rest)
                    imported += 1
            
            print(f"   ✅ Imported {imported} new restaurants")
        
        # Final Summary
        print("\n" + "=" * 60)
        print("📊 RESTORATION COMPLETE - COLLECTION COUNTS:")
        print("=" * 60)
        
        collections_to_check = [
            'products', 'dine_properties', 'stay_properties', 
            'dine_bundles', 'celebrate_bundles', 'blog_posts'
        ]
        
        for coll in collections_to_check:
            count = await db[coll].count_documents({})
            print(f"   {coll}: {count}")
        
        print("\n✅ Data restoration complete!")
        
    except Exception as e:
        print(f"\n❌ Error during restoration: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(restore_all())
