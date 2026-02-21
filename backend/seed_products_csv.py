"""
Product Seeder from CSV
=======================
Seeds all 2,000+ products from the CSV file
"""

import asyncio
import csv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_products_from_csv():
    """Seed all products from CSV to database"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client['test_database']
    
    csv_path = '/app/frontend/public/products_latest.csv'
    
    # Read CSV
    products_to_seed = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Extract pillar tags
            pillars = []
            for key, val in row.items():
                if key.startswith('pillar_') and val == 'Y':
                    pillars.append(key.replace('pillar_', ''))
            
            # Extract breed tags
            breeds = []
            for key, val in row.items():
                if key.startswith('breed_') and val == 'Y':
                    breed_name = key.replace('breed_', '').replace('_', ' ')
                    breeds.append(breed_name)
            
            product = {
                "id": row.get('id', ''),
                "shopify_id": row.get('id', ''),
                "name": row.get('name', ''),
                "price": float(row.get('price', 0) or 0),
                "category": row.get('category', ''),
                "subcategory": row.get('subcategory', ''),
                "description": row.get('description', ''),
                "image": row.get('image', ''),
                "pillars": pillars,
                "breeds": breeds,
                "in_stock": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            products_to_seed.append(product)
    
    logger.info(f"Read {len(products_to_seed)} products from CSV")
    
    # Clear existing and insert
    await db.products.delete_many({})
    logger.info("Cleared existing products")
    
    if products_to_seed:
        # Insert in batches of 500
        batch_size = 500
        for i in range(0, len(products_to_seed), batch_size):
            batch = products_to_seed[i:i+batch_size]
            await db.products.insert_many(batch)
            logger.info(f"Inserted batch {i//batch_size + 1} ({len(batch)} products)")
    
    # Count and report
    total = await db.products.count_documents({})
    logger.info(f"Total products in database: {total}")
    
    # Sample categories
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    categories = await db.products.aggregate(pipeline).to_list(None)
    
    logger.info("=" * 50)
    logger.info("TOP CATEGORIES:")
    for cat in categories:
        logger.info(f"  {cat['_id']}: {cat['count']} products")
    logger.info("=" * 50)
    
    return total

if __name__ == "__main__":
    count = asyncio.run(seed_products_from_csv())
    print(f"\n✅ Successfully seeded {count} products!")
