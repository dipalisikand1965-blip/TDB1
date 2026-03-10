#!/usr/bin/env python3
"""
Seed Advisory Care Products
Creates comprehensive product catalog for 8 advisory categories
with AI-generated images specific to each product
"""

import os
import sys
sys.path.append('/app/backend')

from pymongo import MongoClient
from datetime import datetime, timezone
import uuid
import time

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'doggy_company')

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Advisory Care Products by Category
ADVISORY_PRODUCTS = {
    "food_feeding": {
        "name": "Food & Feeding",
        "icon": "UtensilsCrossed",
        "color": "bg-amber-50 text-amber-600",
        "products": [
            {"name": "Slow Feeder Bowl", "price": 599, "desc": "Promotes healthy eating pace, reduces bloating and indigestion"},
            {"name": "Raised Feeder Stand", "price": 1299, "desc": "Ergonomic elevated feeding for better posture and digestion"},
            {"name": "Collapsible Travel Bowl", "price": 349, "desc": "Portable silicone bowl for food and water on-the-go"},
            {"name": "Enrichment Lick Mat", "price": 449, "desc": "Textured mat for slow feeding, anxiety relief, and mental stimulation"},
            {"name": "Airtight Treat Jar", "price": 599, "desc": "Keep treats fresh with secure seal and easy-access lid"},
            {"name": "Silicone Feeding Mat", "price": 499, "desc": "Non-slip waterproof mat protects floors during meals"},
            {"name": "Precision Portion Scoop", "price": 199, "desc": "Measure exact portions for weight management"},
            {"name": "Large Food Storage Container", "price": 899, "desc": "Airtight 15kg capacity with wheels and scoop holder"},
        ]
    },
    "grooming_coat": {
        "name": "Grooming & Coat Care",
        "icon": "Scissors",
        "color": "bg-purple-50 text-purple-600",
        "products": [
            {"name": "Double-Coat Slicker Brush", "price": 549, "desc": "Gentle bristles remove loose fur and prevent matting"},
            {"name": "Professional De-shedding Tool", "price": 899, "desc": "Reduces shedding up to 90%, reaches undercoat safely"},
            {"name": "Wide-Tooth Detangling Comb", "price": 399, "desc": "Glides through long coats without pulling or breaking"},
            {"name": "Leave-In Detangling Spray", "price": 449, "desc": "Conditions and smooths for easier brushing"},
            {"name": "Microfiber Grooming Towel Set", "price": 599, "desc": "Super absorbent quick-dry towels, 3-pack"},
            {"name": "Oatmeal Sensitive Skin Shampoo", "price": 549, "desc": "Soothes irritation, hypoallergenic formula"},
            {"name": "Gentle Ear Cleaning Wipes", "price": 349, "desc": "Removes wax and debris, prevents infections, 50-count"},
            {"name": "Tear Stain Eye Wipes", "price": 349, "desc": "Safely removes eye discharge and stains, 50-count"},
            {"name": "Wrinkle Care Wipes for Flat Faces", "price": 399, "desc": "Keeps facial folds clean and dry, prevents yeast"},
        ]
    },
    "home_comfort": {
        "name": "Home & Comfort",
        "icon": "Home",
        "color": "bg-blue-50 text-blue-600",
        "products": [
            {"name": "Premium Bolster Dog Bed", "price": 2499, "desc": "Plush comfort with supportive raised edges"},
            {"name": "Orthopedic Memory Foam Bed", "price": 3999, "desc": "Joint support for seniors and large breeds"},
            {"name": "Anti-Anxiety Calming Donut Bed", "price": 1999, "desc": "Deep pocket design provides security and warmth"},
            {"name": "Self-Cooling Gel Mat", "price": 1299, "desc": "No electricity needed, activates with pressure"},
            {"name": "Cozy Fleece Blanket", "price": 799, "desc": "Soft double-sided throw for beds and sofas"},
            {"name": "Padded Crate Mat", "price": 1199, "desc": "Machine washable cushion fits standard crates"},
            {"name": "Furniture Protector Cover", "price": 1499, "desc": "Waterproof sofa cover with non-slip backing"},
            {"name": "Waterproof Bed Liner", "price": 899, "desc": "Protects mattresses from accidents and spills"},
        ]
    },
    "behaviour_training": {
        "name": "Behaviour & Training",
        "icon": "Brain",
        "color": "bg-green-50 text-green-600",
        "products": [
            {"name": "Durable Chew Toy Set", "price": 799, "desc": "Safe rubber toys for aggressive chewers, 5-piece"},
            {"name": "Interactive Puzzle Feeder", "price": 999, "desc": "Mental stimulation toy with adjustable difficulty"},
            {"name": "Snuffle Mat Foraging Toy", "price": 799, "desc": "Encourages natural foraging instincts"},
            {"name": "Squeaky Enrichment Ball", "price": 449, "desc": "Treat-dispensing ball with squeaker"},
            {"name": "Training Treat Pouch", "price": 549, "desc": "Waist-clip bag with poop bag dispenser"},
            {"name": "Professional Training Clicker", "price": 199, "desc": "Consistent click sound for positive reinforcement"},
            {"name": "15m Long Training Lead", "price": 899, "desc": "Lightweight line for recall training"},
            {"name": "Bite-Resistant Tug Rope", "price": 399, "desc": "Strong braided rope for interactive play"},
        ]
    },
    "travel_outings": {
        "name": "Travel & Outings",
        "icon": "Plane",
        "color": "bg-cyan-50 text-cyan-600",
        "products": [
            {"name": "No-Pull Front-Clip Harness", "price": 1299, "desc": "Comfortable fit with reflective stitching"},
            {"name": "Airline-Approved Travel Carrier", "price": 2999, "desc": "Ventilated soft carrier with padded strap"},
            {"name": "Quilted Car Seat Protector", "price": 1799, "desc": "Waterproof back seat cover with hammock mode"},
            {"name": "Adjustable Dog Seat Belt", "price": 599, "desc": "Crash-tested restraint clips to harness"},
            {"name": "Travel Organizer Pouch", "price": 699, "desc": "Holds treats, poop bags, documents, and more"},
            {"name": "Portable Water Bottle with Bowl", "price": 549, "desc": "Leak-proof bottle with flip-out drinking tray"},
            {"name": "Collapsible Silicone Bowl Set", "price": 449, "desc": "Compact food and water bowls, 2-pack"},
            {"name": "Travel Calming Blanket", "price": 899, "desc": "Familiar scent provides comfort during trips"},
        ]
    },
    "puppy_adoption": {
        "name": "Puppy & New Adoption",
        "icon": "Baby",
        "color": "bg-pink-50 text-pink-600",
        "products": [
            {"name": "Complete Puppy Starter Kit", "price": 2499, "desc": "Bowl, collar, leash, toys, and training treats"},
            {"name": "Non-Tip Puppy Bowl Set", "price": 599, "desc": "Weighted stainless steel bowls for messy eaters"},
            {"name": "Washable Puppy Bed", "price": 1299, "desc": "Cozy nest bed for small breeds and puppies"},
            {"name": "Teething Toy Collection", "price": 699, "desc": "Cooling toys soothe sore gums, 6-piece set"},
            {"name": "Absorbent Training Pee Pads", "price": 799, "desc": "Leak-proof pads with attractant, 50-count"},
            {"name": "Adjustable Puppy Collar & Leash", "price": 599, "desc": "Grows with your puppy, soft nylon material"},
            {"name": "Puppy Grooming Starter Kit", "price": 899, "desc": "Gentle brush, nail clipper, and shampoo"},
            {"name": "Pet Document Organizer", "price": 499, "desc": "Folder for vaccination records and certificates"},
        ]
    },
    "senior_care": {
        "name": "Senior Dog Care",
        "icon": "Heart",
        "color": "bg-orange-50 text-orange-600",
        "products": [
            {"name": "Therapeutic Orthopedic Bed", "price": 4499, "desc": "Medical-grade foam relieves joint pressure"},
            {"name": "Joint Support Memory Mat", "price": 2499, "desc": "Heated option available for arthritis relief"},
            {"name": "Mobility Support Harness", "price": 1999, "desc": "Lift harness helps with stairs and car entry"},
            {"name": "Elevated Senior Feeder", "price": 1499, "desc": "Adjustable height reduces neck strain"},
            {"name": "Easy-Access Pet Blanket", "price": 999, "desc": "Low-pile blanket for easy on/off movement"},
            {"name": "Non-Slip Floor Mat Set", "price": 1299, "desc": "Textured mats prevent slipping, 4-pack"},
            {"name": "Waterproof Incontinence Pad", "price": 899, "desc": "Reusable quilted pad for beds and furniture"},
            {"name": "Senior Supplement Treat Jar", "price": 599, "desc": "Airtight jar designed for daily supplements"},
        ]
    },
    "seasonal_climate": {
        "name": "Seasonal & Climate Care",
        "icon": "Sun",
        "color": "bg-yellow-50 text-yellow-600",
        "products": [
            {"name": "Pressure-Activated Cooling Mat", "price": 1499, "desc": "No water or electricity needed, instant cool"},
            {"name": "Cooling Bandana with Gel Insert", "price": 499, "desc": "Soak and wear for hours of cooling relief"},
            {"name": "Protective Paw Balm", "price": 399, "desc": "Moisturizes and protects from hot/cold surfaces"},
            {"name": "Waterproof Dog Raincoat", "price": 1299, "desc": "Adjustable fit with reflective trim"},
            {"name": "Quick-Dry Microfiber Robe", "price": 899, "desc": "Wrap-around towel for after bath or rain"},
            {"name": "Insulated Winter Jacket", "price": 1799, "desc": "Fleece-lined with waterproof outer shell"},
            {"name": "Natural Flea & Tick Spray", "price": 549, "desc": "Plant-based repellent, safe for daily use"},
            {"name": "Summer Paw Protection Booties", "price": 799, "desc": "Breathable mesh protects from hot pavement"},
        ]
    }
}


def generate_image_prompt(product_name, category_name):
    """Generate a specific prompt for AI image generation"""
    base = f"Professional product photo of a {product_name} for dogs, "
    
    # Add category-specific context
    category_context = {
        "food_feeding": "clean white background, studio lighting, pet food accessories",
        "grooming_coat": "clean white background, grooming salon setting, professional pet care tools",
        "home_comfort": "cozy home interior, warm lighting, premium pet bedding",
        "behaviour_training": "bright playful setting, dog training equipment, colorful pet toys",
        "travel_outings": "travel context, outdoor adventure, pet travel gear",
        "puppy_adoption": "cute puppy setting, soft pastel colors, new pet essentials",
        "senior_care": "gentle comfortable setting, medical-quality pet products",
        "seasonal_climate": "weather context, seasonal pet protection, outdoor pet gear"
    }
    
    context = category_context.get(category_name.lower().replace(" & ", "_").replace(" ", "_"), "clean white background, professional product photo")
    
    return f"{base}{context}, high quality, no text, no watermarks, centered product"


def seed_products():
    """Seed all advisory care products"""
    print("=" * 60)
    print("SEEDING ADVISORY CARE PRODUCTS")
    print("=" * 60)
    
    total_products = 0
    now = datetime.now(timezone.utc).isoformat()
    
    for category_key, category_data in ADVISORY_PRODUCTS.items():
        print(f"\n📦 Category: {category_data['name']}")
        print("-" * 40)
        
        for product in category_data['products']:
            product_id = f"adv-{category_key}-{product['name'].lower().replace(' ', '-').replace('&', 'and')[:30]}-{uuid.uuid4().hex[:4]}"
            
            # Generate placeholder image URL (will be replaced by AI)
            # Using unsplash for now, AI generation will happen in background
            placeholder_images = {
                "food_feeding": "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=400",
                "grooming_coat": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",
                "home_comfort": "https://images.unsplash.com/photo-1587559070757-f72a388edbba?w=400",
                "behaviour_training": "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=400",
                "travel_outings": "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=400",
                "puppy_adoption": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
                "senior_care": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
                "seasonal_climate": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400"
            }
            
            product_doc = {
                "id": product_id,
                "name": product['name'],
                "title": product['name'],
                "description": product['desc'],
                "price": product['price'],
                "original_price": int(product['price'] * 1.25),
                "pillar": "advisory",
                "category": category_key,
                "category_name": category_data['name'],
                "sub_category": category_data['name'],
                "tags": ["advisory", category_key, product['name'].lower().split()[0]],
                "in_stock": True,
                "image_url": placeholder_images.get(category_key, placeholder_images["food_feeding"]),
                "needs_ai_image": True,  # Flag for background AI generation
                "ai_image_prompt": generate_image_prompt(product['name'], category_data['name']),
                "icon": category_data['icon'],
                "color": category_data['color'],
                "created_at": now,
                "updated_at": now
            }
            
            # Insert into unified_products
            db.unified_products.update_one(
                {"id": product_id},
                {"$set": product_doc},
                upsert=True
            )
            
            # Also sync to products_master for admin
            db.products_master.update_one(
                {"id": product_id},
                {"$set": product_doc},
                upsert=True
            )
            
            print(f"  ✓ {product['name']} - ₹{product['price']}")
            total_products += 1
    
    print("\n" + "=" * 60)
    print(f"✅ SEEDED {total_products} ADVISORY PRODUCTS")
    print("=" * 60)
    
    # Verify counts
    advisory_count = db.unified_products.count_documents({"pillar": "advisory"})
    print(f"Total advisory products in unified_products: {advisory_count}")
    
    return total_products


if __name__ == "__main__":
    seed_products()
