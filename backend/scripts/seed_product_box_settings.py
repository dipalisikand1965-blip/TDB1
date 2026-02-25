"""
Seed Product Box, Shipping & Pricing Settings
Ensures all required admin data is populated
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "doggy_company")

async def seed_unified_products(db):
    """Copy products to unified_products for product box"""
    print("\n=== SYNCING TO UNIFIED_PRODUCTS ===")
    
    # Get all products
    products = await db.products.find({}).to_list(length=2000)
    print(f"Found {len(products)} products to sync")
    
    synced = 0
    for product in products:
        # Convert to unified product format
        unified = {
            "id": product.get('id') or product.get('shopify_id') or str(product.get('_id')),
            "name": product.get('title') or product.get('name', 'Unnamed Product'),
            "description": product.get('description', ''),
            "sku": product.get('sku') or product.get('handle', ''),
            "category": product.get('category', 'general'),
            "product_type": product.get('product_type', product.get('category', 'physical')),
            
            # Pillar assignment
            "pillar": product.get('pillar', product.get('category')),
            "pillars": [product.get('pillar')] if product.get('pillar') else [product.get('category', 'shop')],
            "primary_pillar": product.get('pillar', product.get('category', 'shop')),
            
            # Pricing
            "base_price": product.get('price', 0),
            "selling_price": product.get('price', 0),
            "compare_at_price": product.get('compare_price') or product.get('compare_at_price'),
            "gst_percent": 5,
            
            # Inventory
            "stock": product.get('inventory_quantity', 100),
            "in_stock": product.get('in_stock', True),
            
            # Shipping
            "is_pan_india_shippable": product.get('pan_india', True),
            "requires_shipping": product.get('category') not in ['services', 'bookings', 'subscriptions'],
            "weight_kg": product.get('weight', 0.5),
            "fresh_delivery_cities": product.get('fresh_delivery_cities', []),
            
            # Visibility
            "visibility": {
                "status": "active",
                "show_in_shop": True,
                "show_in_mira": True,
                "featured": product.get('is_bestseller', False)
            },
            
            # Rewards
            "paw_rewards": {
                "is_reward_eligible": product.get('paw_reward_points', 0) > 0,
                "points_earned": product.get('paw_reward_points', 0),
                "points_required": 0
            },
            
            # Media
            "image": product.get('image') or (product.get('images', [None])[0] if product.get('images') else None),
            "images": product.get('images', []),
            
            # Tags
            "tags": product.get('tags', []),
            
            # Metadata
            "variants": product.get('variants', []),
            "options": product.get('options', []),
            "source": product.get('source', 'shopify'),
            "shopify_id": product.get('shopify_id'),
            
            # Timestamps
            "created_at": product.get('created_at', datetime.now(timezone.utc).isoformat()),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Upsert to unified_products
        await db.unified_products.update_one(
            {"id": unified["id"]},
            {"$set": unified},
            upsert=True
        )
        synced += 1
    
    print(f"Synced {synced} products to unified_products collection")
    return synced

async def seed_shipping_settings(db):
    """Seed shipping rules and settings"""
    print("\n=== SEEDING SHIPPING SETTINGS ===")
    
    shipping_rules = [
        {
            "id": "ship-local-fresh",
            "name": "Local Fresh Delivery",
            "rule_type": "location",
            "base_amount": 99,
            "zones": {
                "Bangalore": 99,
                "Mumbai": 99,
                "Delhi NCR": 99,
                "Hyderabad": 149,
                "Chennai": 149
            },
            "free_above_amount": 1500,
            "gst_percent": 18,
            "pillar_ids": ["celebrate", "dine"],
            "applies_to": ["cakes", "fresh-meals", "treats"],
            "delivery_time": "Same day / Next day",
            "active": True
        },
        {
            "id": "ship-pan-india",
            "name": "Pan-India Shipping",
            "rule_type": "flat",
            "base_amount": 149,
            "free_above_amount": 3000,
            "gst_percent": 18,
            "pillar_ids": ["shop", "enjoy", "celebrate"],
            "applies_to": ["accessories", "toys", "hampers", "treats"],
            "delivery_time": "3-5 business days",
            "active": True
        },
        {
            "id": "ship-weight-based",
            "name": "Weight-Based Shipping",
            "rule_type": "weight",
            "base_amount": 50,
            "per_kg_rate": 50,
            "gst_percent": 18,
            "pillar_ids": ["shop"],
            "delivery_time": "3-7 business days",
            "active": True
        },
        {
            "id": "ship-express",
            "name": "Express Delivery",
            "rule_type": "flat",
            "base_amount": 249,
            "gst_percent": 18,
            "pillar_ids": ["celebrate", "care"],
            "delivery_time": "Same day (order before 2pm)",
            "active": True
        },
        {
            "id": "ship-free-services",
            "name": "No Shipping (Services)",
            "rule_type": "free",
            "base_amount": 0,
            "gst_percent": 0,
            "pillar_ids": ["care", "fit", "travel", "stay", "learn"],
            "applies_to": ["services", "bookings", "consultations"],
            "active": True
        }
    ]
    
    for rule in shipping_rules:
        rule["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.shipping_rules.update_one(
            {"id": rule["id"]},
            {"$set": rule},
            upsert=True
        )
        print(f"  ✓ {rule['name']}")
    
    # Seed shipping zones
    shipping_zones = [
        {"id": "zone-local", "name": "Local", "cities": ["Bangalore", "Mumbai", "Delhi NCR"], "base_fee": 99},
        {"id": "zone-metro", "name": "Metro Cities", "cities": ["Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad"], "base_fee": 149},
        {"id": "zone-tier2", "name": "Tier 2 Cities", "cities": ["Jaipur", "Lucknow", "Chandigarh", "Kochi", "Indore"], "base_fee": 199},
        {"id": "zone-national", "name": "Rest of India", "cities": [], "base_fee": 249}
    ]
    
    for zone in shipping_zones:
        zone["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.shipping_zones.update_one(
            {"id": zone["id"]},
            {"$set": zone},
            upsert=True
        )
    
    print(f"Seeded {len(shipping_rules)} shipping rules and {len(shipping_zones)} zones")
    return len(shipping_rules)

async def seed_pricing_settings(db):
    """Seed pricing tiers and commission settings"""
    print("\n=== SEEDING PRICING SETTINGS ===")
    
    pricing_tiers = [
        {
            "id": "tier-regular",
            "name": "Regular Member",
            "discount_percent": 0,
            "paw_points_multiplier": 1.0,
            "free_shipping_threshold": 3000
        },
        {
            "id": "tier-gold",
            "name": "Gold Member",
            "discount_percent": 5,
            "paw_points_multiplier": 1.5,
            "free_shipping_threshold": 2000
        },
        {
            "id": "tier-platinum",
            "name": "Platinum Member",
            "discount_percent": 10,
            "paw_points_multiplier": 2.0,
            "free_shipping_threshold": 1000
        },
        {
            "id": "tier-diamond",
            "name": "Diamond Member",
            "discount_percent": 15,
            "paw_points_multiplier": 3.0,
            "free_shipping_threshold": 0  # Always free
        }
    ]
    
    for tier in pricing_tiers:
        tier["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.pricing_tiers.update_one(
            {"id": tier["id"]},
            {"$set": tier},
            upsert=True
        )
        print(f"  ✓ {tier['name']}")
    
    # Pillar commissions
    pillar_commissions = [
        {"pillar": "celebrate", "commission_percent": 30, "gst_percent": 5},
        {"pillar": "dine", "commission_percent": 15, "gst_percent": 5},
        {"pillar": "stay", "commission_percent": 12, "gst_percent": 18},
        {"pillar": "travel", "commission_percent": 10, "gst_percent": 18},
        {"pillar": "care", "commission_percent": 20, "gst_percent": 18},
        {"pillar": "fit", "commission_percent": 20, "gst_percent": 18},
        {"pillar": "enjoy", "commission_percent": 25, "gst_percent": 12},
        {"pillar": "learn", "commission_percent": 15, "gst_percent": 18},
        {"pillar": "shop", "commission_percent": 35, "gst_percent": 12}
    ]
    
    for comm in pillar_commissions:
        comm["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.pillar_commissions.update_one(
            {"pillar": comm["pillar"]},
            {"$set": comm},
            upsert=True
        )
    
    # Global pricing config
    global_config = {
        "id": "global-pricing-config",
        "default_gst_percent": 5,
        "default_margin_percent": 100,
        "paw_points_value": 0.25,  # 1 point = ₹0.25
        "min_order_value": 299,
        "free_shipping_threshold": 3000,
        "default_shipping_fee": 149,
        "cod_extra_charge": 50,
        "currency": "INR",
        "currency_symbol": "₹",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pricing_config.update_one(
        {"id": "global-pricing-config"},
        {"$set": global_config},
        upsert=True
    )
    
    print(f"Seeded {len(pricing_tiers)} pricing tiers and {len(pillar_commissions)} pillar commissions")
    return len(pricing_tiers)

async def verify_counts(db):
    """Verify all collections have data"""
    print("\n" + "="*50)
    print("VERIFICATION")
    print("="*50)
    
    collections = [
        ("unified_products", "Unified Products"),
        ("products", "Products"),
        ("shipping_rules", "Shipping Rules"),
        ("shipping_zones", "Shipping Zones"),
        ("pricing_tiers", "Pricing Tiers"),
        ("pillar_commissions", "Pillar Commissions"),
        ("pricing_config", "Pricing Config")
    ]
    
    for coll_name, display_name in collections:
        count = await db[coll_name].count_documents({})
        status = "✓" if count > 0 else "✗"
        print(f"  {status} {display_name}: {count}")
    
    return True

async def main():
    """Run all seeding"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("="*50)
    print("SEEDING PRODUCT BOX, SHIPPING & PRICING")
    print("="*50)
    
    unified_count = await seed_unified_products(db)
    shipping_count = await seed_shipping_settings(db)
    pricing_count = await seed_pricing_settings(db)
    
    await verify_counts(db)
    
    print("\n" + "="*50)
    print("SEEDING COMPLETE!")
    print("="*50)
    print(f"Unified products: {unified_count}")
    print(f"Shipping rules: {shipping_count}")
    print(f"Pricing tiers: {pricing_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
