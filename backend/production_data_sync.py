"""
Production Data Sync - Push data from preview to production
Run with: python production_data_sync.py

This script exports data from the local preview database and pushes it to the production API.
"""

import asyncio
import httpx
import json
from pymongo import MongoClient
import os

# Configuration
PRODUCTION_URL = "https://thedoggycompany.com"
ADMIN_PASSWORD = "lola4304"
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'pet-os-live-test_database')

# Batch size for uploads
BATCH_SIZE = 100

async def sync_products_to_production():
    """Sync products_master from preview to production"""
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get all products from preview
    all_products = list(db.products_master.find({}, {"_id": 0}))
    print(f"Found {len(all_products)} products in preview")
    
    async with httpx.AsyncClient(timeout=120.0) as http_client:
        # Push in batches
        for i in range(0, len(all_products), BATCH_SIZE):
            batch = all_products[i:i+BATCH_SIZE]
            
            try:
                response = await http_client.post(
                    f"{PRODUCTION_URL}/api/admin/bulk-import-products",
                    params={"password": ADMIN_PASSWORD},
                    json={"products": batch}
                )
                if response.status_code == 200:
                    print(f"✓ Synced batch {i//BATCH_SIZE + 1} ({len(batch)} products)")
                else:
                    print(f"✗ Failed batch {i//BATCH_SIZE + 1}: {response.status_code}")
            except Exception as e:
                print(f"✗ Error on batch {i//BATCH_SIZE + 1}: {e}")
    
    client.close()
    return len(all_products)

async def sync_services_to_production():
    """Sync services_master from preview to production"""
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get all services from preview
    all_services = list(db.services_master.find({}, {"_id": 0}))
    print(f"Found {len(all_services)} services in preview")
    
    async with httpx.AsyncClient(timeout=120.0) as http_client:
        try:
            response = await http_client.post(
                f"{PRODUCTION_URL}/api/admin/bulk-import-services",
                params={"password": ADMIN_PASSWORD},
                json={"services": all_services}
            )
            if response.status_code == 200:
                print(f"✓ Synced {len(all_services)} services")
            else:
                print(f"✗ Failed to sync services: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"✗ Error syncing services: {e}")
    
    client.close()
    return len(all_services)

async def sync_guided_paths_to_production():
    """Sync guided_paths from preview to production"""
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get all guided paths from preview
    all_paths = list(db.guided_paths.find({}, {"_id": 0}))
    print(f"Found {len(all_paths)} guided paths in preview")
    
    async with httpx.AsyncClient(timeout=60.0) as http_client:
        try:
            response = await http_client.post(
                f"{PRODUCTION_URL}/api/admin/bulk-import-guided-paths",
                params={"password": ADMIN_PASSWORD},
                json={"paths": all_paths}
            )
            if response.status_code == 200:
                print(f"✓ Synced {len(all_paths)} guided paths")
            else:
                print(f"✗ Failed to sync guided paths: {response.status_code}")
        except Exception as e:
            print(f"✗ Error syncing guided paths: {e}")
    
    client.close()
    return len(all_paths)

async def main():
    print("=" * 60)
    print("🚀 PRODUCTION DATA SYNC")
    print("=" * 60)
    print(f"Source: {MONGO_URL}/{DB_NAME}")
    print(f"Target: {PRODUCTION_URL}")
    print("=" * 60)
    
    # Sync products
    print("\n📦 Syncing Products...")
    products = await sync_products_to_production()
    
    # Sync services
    print("\n🛠️ Syncing Services...")
    services = await sync_services_to_production()
    
    # Sync guided paths
    print("\n📋 Syncing Guided Paths...")
    paths = await sync_guided_paths_to_production()
    
    print("\n" + "=" * 60)
    print("✅ SYNC COMPLETE")
    print(f"   Products: {products}")
    print(f"   Services: {services}")
    print(f"   Guided Paths: {paths}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
