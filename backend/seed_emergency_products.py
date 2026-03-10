"""
Seed Emergency Products
Adds comprehensive emergency products to the unified_products collection
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "doggy_company")

# GENERAL PRODUCTS (no personalization needed)
GENERAL_PRODUCTS = [
    {
        "id": "emrg-firstaid-kit",
        "name": "Pet First Aid Kit",
        "description": "Complete first aid kit for pet emergencies. Includes bandages, antiseptic, scissors, tweezers, and emergency guide.",
        "price": 1299,
        "original_price": 1599,
        "category": "first-aid",
        "pillar": "emergency",
        "tags": ["first-aid", "essentials", "all-pets"],
        "personalized": False,
        "in_stock": True,
        "priority": 1
    },
    {
        "id": "emrg-gauze-wrap",
        "name": "Gauze & Bandage Wrap Set",
        "description": "Sterile gauze pads and self-adhesive bandage wrap for wound care.",
        "price": 349,
        "original_price": 449,
        "category": "first-aid",
        "pillar": "emergency",
        "tags": ["first-aid", "wound-care", "all-pets"],
        "personalized": False,
        "in_stock": True,
        "priority": 2
    },
    {
        "id": "emrg-digital-thermometer",
        "name": "Digital Pet Thermometer",
        "description": "Fast-reading digital thermometer designed for pets. Flexible tip for comfort.",
        "price": 499,
        "original_price": 699,
        "category": "first-aid",
        "pillar": "emergency",
        "tags": ["first-aid", "diagnostics", "all-pets"],
        "personalized": False,
        "in_stock": True,
        "priority": 3
    },
    {
        "id": "emrg-tick-remover",
        "name": "Professional Tick Remover Tool",
        "description": "Safe and easy tick removal tool. Includes magnifying lens and storage case.",
        "price": 299,
        "original_price": 399,
        "category": "first-aid",
        "pillar": "emergency",
        "tags": ["first-aid", "tick-removal", "all-pets"],
        "personalized": False,
        "in_stock": True,
        "priority": 4
    },
    {
        "id": "emrg-pee-pads",
        "name": "Absorbent Pee Pads (Pack of 20)",
        "description": "Super absorbent pee pads for recovery and emergencies. Leak-proof backing.",
        "price": 449,
        "original_price": 549,
        "category": "recovery",
        "pillar": "emergency",
        "tags": ["recovery", "hygiene", "all-pets"],
        "personalized": False,
        "in_stock": True,
        "priority": 5
    },
    {
        "id": "emrg-water-bottle",
        "name": "Portable Pet Water Bottle",
        "description": "Leak-proof portable water bottle with attached bowl. Perfect for emergencies and travel.",
        "price": 599,
        "original_price": 799,
        "category": "essentials",
        "pillar": "emergency",
        "tags": ["hydration", "portable", "all-pets"],
        "personalized": False,
        "in_stock": True,
        "priority": 6
    },
    {
        "id": "emrg-collapsible-bowl",
        "name": "Collapsible Food & Water Bowl",
        "description": "Silicone collapsible bowl. Easy to carry, easy to clean. Includes carabiner.",
        "price": 249,
        "original_price": 349,
        "category": "essentials",
        "pillar": "emergency",
        "tags": ["hydration", "portable", "all-pets"],
        "personalized": False,
        "in_stock": True,
        "priority": 7
    },
    {
        "id": "emrg-medical-folder",
        "name": "Pet Medical Records Folder",
        "description": "Organized folder for vaccination records, prescriptions, and vet info. Water-resistant.",
        "price": 399,
        "original_price": 499,
        "category": "documentation",
        "pillar": "emergency",
        "tags": ["documentation", "records", "all-pets"],
        "personalized": False,
        "in_stock": True,
        "priority": 8
    },
    {
        "id": "emrg-emergency-card",
        "name": "Pet Emergency Info Card",
        "description": "Wallet-sized emergency card with pet info, allergies, vet contact. Laminated.",
        "price": 149,
        "original_price": 199,
        "category": "documentation",
        "pillar": "emergency",
        "tags": ["documentation", "id", "all-pets"],
        "personalized": False,
        "in_stock": True,
        "priority": 9
    },
    {
        "id": "emrg-pet-wipes",
        "name": "Antibacterial Pet Wipes (Pack of 50)",
        "description": "Gentle antibacterial wipes for cleaning wounds, paws, and skin. Fragrance-free.",
        "price": 299,
        "original_price": 399,
        "category": "first-aid",
        "pillar": "emergency",
        "tags": ["first-aid", "hygiene", "all-pets"],
        "personalized": False,
        "in_stock": True,
        "priority": 10
    },
    {
        "id": "emrg-disposable-gloves",
        "name": "Disposable Latex Gloves (Box of 50)",
        "description": "Powder-free latex gloves for first aid and wound care.",
        "price": 199,
        "original_price": 299,
        "category": "first-aid",
        "pillar": "emergency",
        "tags": ["first-aid", "hygiene", "all-pets"],
        "personalized": False,
        "in_stock": True,
        "priority": 11
    },
]

# PERSONALIZED PRODUCTS (by size/breed)
PERSONALIZED_PRODUCTS = [
    {
        "id": "emrg-soft-muzzle",
        "name": "Soft Safety Muzzle",
        "description": "Breathable soft muzzle for emergency situations. Prevents biting while allowing panting.",
        "price": 599,
        "original_price": 799,
        "category": "restraint",
        "pillar": "emergency",
        "tags": ["restraint", "safety"],
        "personalized": True,
        "personalize_by": ["breed", "muzzle_shape", "size"],
        "sizes": ["XS", "S", "M", "L", "XL"],
        "in_stock": True,
        "priority": 12
    },
    {
        "id": "emrg-emergency-leash",
        "name": "Emergency Slip Leash",
        "description": "Strong slip leash for emergency situations. Quick to put on, secure hold.",
        "price": 399,
        "original_price": 499,
        "category": "restraint",
        "pillar": "emergency",
        "tags": ["restraint", "leash"],
        "personalized": True,
        "personalize_by": ["size", "strength"],
        "sizes": ["Small", "Medium", "Large"],
        "in_stock": True,
        "priority": 13
    },
    {
        "id": "emrg-carrier-sling",
        "name": "Pet Transport Carrier/Sling",
        "description": "Sturdy carrier with soft padding for safe transport to vet. Includes shoulder strap.",
        "price": 1499,
        "original_price": 1999,
        "category": "transport",
        "pillar": "emergency",
        "tags": ["transport", "carrier"],
        "personalized": True,
        "personalize_by": ["weight", "size"],
        "sizes": ["Up to 5kg", "5-10kg", "10-20kg", "20-35kg"],
        "in_stock": True,
        "priority": 14
    },
    {
        "id": "emrg-e-collar",
        "name": "Protective E-Collar / Cone",
        "description": "Adjustable recovery cone to prevent licking wounds. Clear plastic for visibility.",
        "price": 449,
        "original_price": 599,
        "category": "recovery",
        "pillar": "emergency",
        "tags": ["recovery", "protection"],
        "personalized": True,
        "personalize_by": ["neck_size", "breed", "face_shape"],
        "sizes": ["XS (Neck 15-20cm)", "S (20-25cm)", "M (25-35cm)", "L (35-45cm)", "XL (45-55cm)"],
        "in_stock": True,
        "priority": 15
    },
    {
        "id": "emrg-recovery-suit",
        "name": "Post-Surgery Recovery Suit",
        "description": "Alternative to cone. Covers wounds while allowing movement. Machine washable.",
        "price": 899,
        "original_price": 1199,
        "category": "recovery",
        "pillar": "emergency",
        "tags": ["recovery", "surgery"],
        "personalized": True,
        "personalize_by": ["body_length", "size"],
        "sizes": ["XXS", "XS", "S", "M", "L", "XL", "XXL"],
        "in_stock": True,
        "priority": 16
    },
    {
        "id": "emrg-cooling-mat",
        "name": "Cooling Mat for Heatstroke Prevention",
        "description": "Pressure-activated cooling mat. No refrigeration needed. Foldable for transport.",
        "price": 999,
        "original_price": 1399,
        "category": "temperature",
        "pillar": "emergency",
        "tags": ["cooling", "heatstroke"],
        "personalized": True,
        "personalize_by": ["coat_type", "size", "heat_sensitivity"],
        "sizes": ["Small (40x50cm)", "Medium (50x65cm)", "Large (70x90cm)"],
        "in_stock": True,
        "priority": 17
    },
    {
        "id": "emrg-gps-tag",
        "name": "GPS Pet Tracker Tag",
        "description": "Real-time GPS tracking tag. Waterproof. Works with smartphone app.",
        "price": 2499,
        "original_price": 3499,
        "category": "tracking",
        "pillar": "emergency",
        "tags": ["tracking", "gps", "lost-pet"],
        "personalized": True,
        "personalize_by": ["pet_name", "emergency_contact"],
        "in_stock": True,
        "priority": 18
    },
    {
        "id": "emrg-qr-id-tag",
        "name": "QR Code Pet ID Tag",
        "description": "Scannable QR tag links to pet profile with medical info and owner contact.",
        "price": 499,
        "original_price": 699,
        "category": "identification",
        "pillar": "emergency",
        "tags": ["id", "qr-code"],
        "personalized": True,
        "personalize_by": ["pet_name", "emergency_contact", "parent_details"],
        "in_stock": True,
        "priority": 19
    },
    {
        "id": "emrg-recovery-bed",
        "name": "Orthopedic Recovery Bed",
        "description": "Memory foam bed for post-surgery recovery. Removable, washable cover.",
        "price": 1999,
        "original_price": 2799,
        "category": "recovery",
        "pillar": "emergency",
        "tags": ["recovery", "bed", "orthopedic"],
        "personalized": True,
        "personalize_by": ["age", "size", "joint_needs"],
        "sizes": ["Small", "Medium", "Large", "XL"],
        "in_stock": True,
        "priority": 20
    },
]


async def seed_emergency_products():
    """Seed emergency products to the database"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    all_products = GENERAL_PRODUCTS + PERSONALIZED_PRODUCTS
    
    inserted = 0
    updated = 0
    
    for product in all_products:
        product["created_at"] = datetime.now(timezone.utc).isoformat()
        product["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Check if exists
        existing = await db.unified_products.find_one({"id": product["id"]})
        
        if existing:
            await db.unified_products.update_one(
                {"id": product["id"]},
                {"$set": product}
            )
            updated += 1
        else:
            await db.unified_products.insert_one(product)
            inserted += 1
    
    print(f"✅ Seeded {inserted} new products, updated {updated} existing")
    
    # Also add to products_master for consistency
    for product in all_products:
        existing = await db.products_master.find_one({"id": product["id"]})
        if not existing:
            await db.products_master.insert_one({k: v for k, v in product.items() if k != "_id"})
    
    print(f"✅ Products also synced to products_master")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_emergency_products())
