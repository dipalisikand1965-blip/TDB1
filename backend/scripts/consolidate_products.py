"""
Product Consolidation Script
============================
Consolidates 17+ product collections into a single 'products_master' collection.

Strategy:
1. Use unified_products schema as the base (it's the richest)
2. Merge intelligence data (mira_hint, breed_metadata) from products collection
3. Incorporate pillar-specific collections (celebrate_products, etc.)
4. Flag bakery division products appropriately
5. Create indexes for fast querying

Collections to consolidate:
- products (1026 docs) - HAS AI INTELLIGENCE DATA
- unified_products (2145 docs) - HAS RICH SCHEMA
- breed_products (41 docs)
- advisory_products (5 docs)
- adopt_products (5 docs)
- celebrate_products (4 docs) - BAKERY DIVISION
- community_products (5 docs)
- emergency_products (5 docs)
- farewell_products (11 docs)
- fit_products (10 docs)
- groom_products (5 docs)
- insure_products (5 docs)
- learn_products (13 docs)
- paperwork_products (5 docs)
- travel_products (8 docs)
"""

import asyncio
import os
import logging
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Any, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Collections to consolidate
PRODUCT_COLLECTIONS = [
    'products',
    'unified_products', 
    'breed_products',
    'advisory_products',
    'adopt_products',
    'celebrate_products',  # Bakery division
    'community_products',
    'emergency_products',
    'farewell_products',
    'fit_products',
    'groom_products',
    'insure_products',
    'learn_products',
    'paperwork_products',
    'travel_products'
]

# Bakery division categories
BAKERY_CATEGORIES = ['cakes', 'treats', 'pupcakes', 'birthday-cakes', 'breed-cakes', 'celebration-cakes']

# Pillar mapping for pillar-specific collections
PILLAR_COLLECTION_MAP = {
    'advisory_products': 'advisory',
    'adopt_products': 'adopt',
    'celebrate_products': 'celebrate',
    'community_products': 'shop',
    'emergency_products': 'emergency',
    'farewell_products': 'farewell',
    'fit_products': 'fit',
    'groom_products': 'care',
    'insure_products': 'advisory',
    'learn_products': 'learn',
    'paperwork_products': 'paperwork',
    'travel_products': 'travel',
    'breed_products': 'shop'
}


def normalize_product(doc: Dict[str, Any], source_collection: str) -> Dict[str, Any]:
    """
    Normalize a product document to the unified schema.
    Preserves all intelligence data.
    """
    # Remove MongoDB _id (will regenerate)
    doc.pop('_id', None)
    
    # Ensure we have an ID
    if not doc.get('id'):
        doc['id'] = f"PROD-{source_collection}-{doc.get('shopify_id', doc.get('name', 'unknown'))[:20]}"
    
    # Ensure pillars array exists
    if 'pillars' not in doc:
        doc['pillars'] = []
    
    # Add pillar from source collection if known
    source_pillar = PILLAR_COLLECTION_MAP.get(source_collection)
    if source_pillar and source_pillar not in doc['pillars']:
        doc['pillars'].append(source_pillar)
    
    # Ensure primary_pillar is set
    if not doc.get('primary_pillar'):
        if doc['pillars']:
            doc['primary_pillar'] = doc['pillars'][0]
        elif doc.get('pillar'):
            doc['primary_pillar'] = doc['pillar']
    
    # Mark bakery division products
    category = str(doc.get('category', '')).lower()
    subcategory = str(doc.get('subcategory', '')).lower()
    name_lower = str(doc.get('name', '')).lower()
    
    is_bakery = (
        category in BAKERY_CATEGORIES or
        subcategory in BAKERY_CATEGORIES or
        'cake' in name_lower or
        'pupcake' in name_lower or
        source_collection == 'celebrate_products'
    )
    
    if is_bakery:
        if 'tags' not in doc:
            doc['tags'] = []
        if 'bakery_division' not in doc['tags']:
            doc['tags'].append('bakery_division')
        if 'tdb_bakery' not in doc['tags']:
            doc['tags'].append('tdb_bakery')
        doc['is_bakery_product'] = True
    
    # Ensure required fields exist with defaults
    doc.setdefault('product_type', 'physical')
    doc.setdefault('tags', [])
    doc.setdefault('images', [])
    doc.setdefault('in_stock', True)
    doc.setdefault('visibility', {'status': 'active', 'visible_on_site': True})
    
    # Track source for auditing
    doc['_consolidation_source'] = source_collection
    doc['_consolidated_at'] = datetime.now(timezone.utc).isoformat()
    
    return doc


def merge_products(existing: Dict[str, Any], new_doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge two product documents, preserving all intelligence data.
    Priority: Keep intelligence fields from the source that has them.
    """
    merged = {**existing}
    
    # Fields to always keep if they exist and are non-empty
    intelligence_fields = [
        'mira_hint', 'breed_metadata', 'intelligent_tags', 
        'breed_tags', 'health_tags', 'pet_safety'
    ]
    
    for field in intelligence_fields:
        # Keep the non-empty value
        if new_doc.get(field) and not existing.get(field):
            merged[field] = new_doc[field]
        elif existing.get(field) and not new_doc.get(field):
            pass  # Keep existing
        elif new_doc.get(field) and existing.get(field):
            # Both have values - keep the richer one
            if isinstance(new_doc[field], dict) and isinstance(existing[field], dict):
                merged[field] = {**existing[field], **new_doc[field]}
            elif isinstance(new_doc[field], list) and isinstance(existing[field], list):
                merged[field] = list(set(existing[field] + new_doc[field]))
    
    # Merge tags arrays
    existing_tags = set(existing.get('tags', []))
    new_tags = set(new_doc.get('tags', []))
    merged['tags'] = list(existing_tags | new_tags)
    
    # Merge pillars arrays
    existing_pillars = set(existing.get('pillars', []))
    new_pillars = set(new_doc.get('pillars', []))
    merged['pillars'] = list(existing_pillars | new_pillars)
    
    # Keep pricing from the source with more detail
    if new_doc.get('pricing') and isinstance(new_doc['pricing'], dict):
        if not existing.get('pricing') or not isinstance(existing.get('pricing'), dict):
            merged['pricing'] = new_doc['pricing']
    
    # Keep variants from the source that has them
    if new_doc.get('variants') and not existing.get('variants'):
        merged['variants'] = new_doc['variants']
        merged['has_variants'] = True
    
    # Track merge sources
    sources = merged.get('_consolidation_sources', [])
    if existing.get('_consolidation_source'):
        sources.append(existing['_consolidation_source'])
    if new_doc.get('_consolidation_source'):
        sources.append(new_doc['_consolidation_source'])
    merged['_consolidation_sources'] = list(set(sources))
    
    return merged


async def consolidate_products():
    """Main consolidation function."""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    logger.info("=" * 60)
    logger.info("PRODUCT CONSOLIDATION STARTING")
    logger.info("=" * 60)
    
    # Dictionary to hold all products by ID
    products_by_id: Dict[str, Dict[str, Any]] = {}
    products_by_shopify_id: Dict[str, str] = {}  # shopify_id -> our_id mapping
    
    stats = {
        'total_source_docs': 0,
        'unique_products': 0,
        'merged_duplicates': 0,
        'bakery_products': 0,
        'with_mira_hint': 0,
        'with_breed_metadata': 0
    }
    
    # Process each collection
    for coll_name in PRODUCT_COLLECTIONS:
        logger.info(f"\nProcessing: {coll_name}")
        
        try:
            docs = await db[coll_name].find({}).to_list(None)
            logger.info(f"  Found {len(docs)} documents")
            stats['total_source_docs'] += len(docs)
            
            for doc in docs:
                # Normalize the document
                normalized = normalize_product(doc.copy(), coll_name)
                product_id = normalized['id']
                shopify_id = normalized.get('shopify_id')
                
                # Check for existing product
                existing_id = None
                if product_id in products_by_id:
                    existing_id = product_id
                elif shopify_id and str(shopify_id) in products_by_shopify_id:
                    existing_id = products_by_shopify_id[str(shopify_id)]
                
                if existing_id:
                    # Merge with existing
                    products_by_id[existing_id] = merge_products(
                        products_by_id[existing_id], 
                        normalized
                    )
                    stats['merged_duplicates'] += 1
                else:
                    # New product
                    products_by_id[product_id] = normalized
                    if shopify_id:
                        products_by_shopify_id[str(shopify_id)] = product_id
                    stats['unique_products'] += 1
                    
        except Exception as e:
            logger.warning(f"  Error processing {coll_name}: {e}")
    
    # Count intelligence data
    for prod in products_by_id.values():
        if prod.get('mira_hint'):
            stats['with_mira_hint'] += 1
        if prod.get('breed_metadata'):
            stats['with_breed_metadata'] += 1
        if prod.get('is_bakery_product'):
            stats['bakery_products'] += 1
    
    logger.info("\n" + "=" * 60)
    logger.info("CONSOLIDATION STATS:")
    logger.info(f"  Total source documents: {stats['total_source_docs']}")
    logger.info(f"  Unique products: {stats['unique_products']}")
    logger.info(f"  Merged duplicates: {stats['merged_duplicates']}")
    logger.info(f"  Bakery products: {stats['bakery_products']}")
    logger.info(f"  With Mira hints: {stats['with_mira_hint']}")
    logger.info(f"  With breed metadata: {stats['with_breed_metadata']}")
    logger.info("=" * 60)
    
    # Create the master collection
    logger.info("\nCreating products_master collection...")
    
    # Drop existing if it exists
    await db.drop_collection('products_master')
    
    # Insert all products
    products_list = list(products_by_id.values())
    if products_list:
        await db.products_master.insert_many(products_list)
        logger.info(f"  Inserted {len(products_list)} products into products_master")
    
    # Create indexes
    logger.info("\nCreating indexes...")
    await db.products_master.create_index("id", unique=True)
    await db.products_master.create_index("shopify_id", sparse=True)
    await db.products_master.create_index("sku", sparse=True)
    await db.products_master.create_index("name")
    await db.products_master.create_index("category")
    await db.products_master.create_index("primary_pillar")
    await db.products_master.create_index("pillars")
    await db.products_master.create_index("tags")
    await db.products_master.create_index("is_bakery_product", sparse=True)
    await db.products_master.create_index("visibility.status")
    await db.products_master.create_index([("name", "text"), ("description", "text")])
    logger.info("  Indexes created successfully")
    
    # Verify
    final_count = await db.products_master.count_documents({})
    logger.info(f"\n✅ CONSOLIDATION COMPLETE: {final_count} products in products_master")
    
    return {
        'success': True,
        'stats': stats,
        'final_count': final_count
    }


async def consolidate_services():
    """Consolidate service collections into services_master."""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    logger.info("\n" + "=" * 60)
    logger.info("SERVICE CONSOLIDATION STARTING")
    logger.info("=" * 60)
    
    SERVICE_COLLECTIONS = [
        'services',
        'service_catalog',
        'breed_services',
        'care_services',
        'grooming_services'
    ]
    
    services_by_id: Dict[str, Dict[str, Any]] = {}
    stats = {'total': 0, 'unique': 0, 'merged': 0}
    
    for coll_name in SERVICE_COLLECTIONS:
        try:
            docs = await db[coll_name].find({}).to_list(None)
            logger.info(f"\nProcessing {coll_name}: {len(docs)} documents")
            stats['total'] += len(docs)
            
            for doc in docs:
                doc.pop('_id', None)
                if not doc.get('id'):
                    doc['id'] = f"SVC-{coll_name}-{doc.get('name', 'unknown')[:15]}"
                
                doc['_consolidation_source'] = coll_name
                doc['_consolidated_at'] = datetime.now(timezone.utc).isoformat()
                
                service_id = doc['id']
                if service_id in services_by_id:
                    # Merge
                    existing = services_by_id[service_id]
                    for key, val in doc.items():
                        if val and not existing.get(key):
                            existing[key] = val
                    stats['merged'] += 1
                else:
                    services_by_id[service_id] = doc
                    stats['unique'] += 1
                    
        except Exception as e:
            logger.warning(f"Error processing {coll_name}: {e}")
    
    logger.info(f"\n  Total source: {stats['total']}")
    logger.info(f"  Unique services: {stats['unique']}")
    logger.info(f"  Merged: {stats['merged']}")
    
    # Create master collection
    await db.drop_collection('services_master')
    
    services_list = list(services_by_id.values())
    if services_list:
        await db.services_master.insert_many(services_list)
    
    # Create indexes
    await db.services_master.create_index("id", unique=True)
    await db.services_master.create_index("name")
    await db.services_master.create_index("pillar")
    await db.services_master.create_index("category")
    await db.services_master.create_index("is_active", sparse=True)
    
    final_count = await db.services_master.count_documents({})
    logger.info(f"\n✅ SERVICE CONSOLIDATION COMPLETE: {final_count} services in services_master")
    
    return {'success': True, 'stats': stats, 'final_count': final_count}


async def main():
    """Run full consolidation."""
    print("\n" + "=" * 70)
    print("   THE DOGGY COMPANY - DATABASE CONSOLIDATION")
    print("   Creating Single Source of Truth for Products & Services")
    print("=" * 70)
    
    product_result = await consolidate_products()
    service_result = await consolidate_services()
    
    print("\n" + "=" * 70)
    print("   CONSOLIDATION SUMMARY")
    print("=" * 70)
    print(f"   Products: {product_result['final_count']} in products_master")
    print(f"   Services: {service_result['final_count']} in services_master")
    print("=" * 70 + "\n")
    
    return {
        'products': product_result,
        'services': service_result
    }


if __name__ == "__main__":
    asyncio.run(main())
