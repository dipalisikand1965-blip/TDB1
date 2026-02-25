"""
Breed Catalogue Seeder
======================
Seeds the breed-aware product and service catalogues with initial data
for all breeds currently in the database.

Naming Convention: [Who it's for] · [What it is] · [Why it fits]
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================
# SEED DATA - PRODUCTS
# ============================================

def generate_products():
    """Generate comprehensive breed-aware products"""
    products = []
    
    # Helper to create product
    def p(who, what, why, desc, category, pillars, breed_tags, price, images=None):
        return {
            "id": str(uuid.uuid4()),
            "name": f"{who} · {what} · {why}",
            "who_for": who,
            "what_is": what,
            "why_fits": why,
            "short_description": desc,
            "images": images or [],
            "category": category,
            "pillars": pillars,
            "breed_tags": breed_tags,
            "price": price,
            "pricing_model": "fixed",
            "sku": f"BP-{uuid.uuid4().hex[:8].upper()}",
            "in_stock": True,
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    
    # ===================
    # TOYS
    # ===================
    
    # Power Chewer toys (for Labs, large breeds)
    products.append(p(
        "Power Chewer", "Rope Toy", "Extra Durable",
        "Triple-braided cotton rope designed to withstand aggressive chewers. Safe for teeth and gums.",
        "toys", ["enjoy", "care"],
        {"breeds": ["Labrador", "Golden Retriever"], "sizes": ["L", "XL"], "chew_strength": "power_chewer", "age_groups": ["adult", "senior"]},
        599
    ))
    
    products.append(p(
        "Power Chewer", "Rubber Ball", "Indestructible",
        "Natural rubber ball that bounces unpredictably. Perfect for fetch-obsessed Labs.",
        "toys", ["enjoy", "fit"],
        {"breeds": ["Labrador", "Golden Retriever"], "sizes": ["L"], "chew_strength": "power_chewer", "energy_level": "high_energy"},
        449
    ))
    
    products.append(p(
        "Power Chewer", "Tug Toy", "Heavy Duty",
        "Reinforced tug toy for interactive play. Great for bonding and energy release.",
        "toys", ["enjoy", "fit"],
        {"breeds": ["Labrador", "Golden Retriever", "Indie"], "sizes": ["M", "L"], "chew_strength": "power_chewer"},
        549
    ))
    
    # Medium chewer toys (for Indies, Beagles)
    products.append(p(
        "Active Breed", "Puzzle Toy", "Mental Stimulation",
        "Interactive puzzle feeder that challenges curious minds. Perfect for scent-driven dogs.",
        "toys", ["enjoy", "dine"],
        {"breeds": ["Beagle", "Indie"], "sizes": ["M"], "chew_strength": "medium", "temperament": ["curious", "intelligent"]},
        799
    ))
    
    products.append(p(
        "Active Breed", "Squeaky Ball", "Chase & Catch",
        "Durable squeaky ball that encourages natural chase instincts.",
        "toys", ["enjoy"],
        {"breeds": ["Indie", "Beagle"], "sizes": ["M"], "chew_strength": "medium", "energy_level": "active"},
        299
    ))
    
    products.append(p(
        "Indie Dog", "Snuffle Mat", "Scent Games",
        "Hide treats in fabric folds for natural foraging. Perfect for street-smart Indies.",
        "toys", ["enjoy", "dine"],
        {"breeds": ["Indie", "Beagle"], "sizes": ["M", "L"], "temperament": ["intelligent", "curious"]},
        899
    ))
    
    # Soft chewer toys (for Maltese, Shih Tzu, Maltipoo)
    products.append(p(
        "Small Breed", "Plush Toy", "Gentle Play",
        "Ultra-soft plush companion with hidden squeaker. Perfect for gentle chewers.",
        "toys", ["enjoy"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S"], "chew_strength": "soft", "temperament": ["gentle", "affectionate"]},
        349
    ))
    
    products.append(p(
        "Small Breed", "Mini Ball Set", "Indoor Fun",
        "Set of 3 soft foam balls perfect for apartment play. Gentle on teeth and furniture.",
        "toys", ["enjoy"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S", "XS"], "chew_strength": "soft"},
        249
    ))
    
    products.append(p(
        "Lap Dog", "Crinkle Toy", "Sensory Delight",
        "Soft toy with crinkle paper inside. Stimulates curiosity without aggressive chewing.",
        "toys", ["enjoy"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S"], "chew_strength": "soft", "energy_level": "calm"},
        299
    ))
    
    # ===================
    # ACCESSORIES - Leashes & Collars
    # ===================
    
    products.append(p(
        "Large Breed", "Heavy Duty Leash", "No-Pull Control",
        "6ft padded leash with traffic handle. Extra strength for strong pullers.",
        "accessories", ["travel", "enjoy", "fit"],
        {"breeds": ["Labrador", "Golden Retriever"], "sizes": ["L", "XL"]},
        899
    ))
    
    products.append(p(
        "Active Breed", "Reflective Collar", "Night Safety",
        "Adjustable collar with reflective stitching. Perfect for evening walks.",
        "accessories", ["travel", "care", "enjoy"],
        {"breeds": ["Indie", "Beagle", "Labrador"], "sizes": ["M", "L"]},
        549
    ))
    
    products.append(p(
        "Indie Dog", "Martingale Collar", "Escape-Proof",
        "Anti-slip collar designed for narrow-headed Indies. Secure without choking.",
        "accessories", ["travel", "care"],
        {"breeds": ["Indie"], "sizes": ["M"]},
        699
    ))
    
    products.append(p(
        "Small Breed", "Padded Harness", "Gentle Control",
        "Soft mesh harness that distributes pressure evenly. No strain on delicate necks.",
        "accessories", ["travel", "enjoy"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S", "XS"]},
        799
    ))
    
    products.append(p(
        "Small Breed", "Retractable Leash", "Freedom Walk",
        "16ft retractable leash with comfortable grip. Perfect for exploration at their pace.",
        "accessories", ["travel", "enjoy"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu", "Beagle"], "sizes": ["S", "M"]},
        649
    ))
    
    # ===================
    # ACCESSORIES - Bowls
    # ===================
    
    products.append(p(
        "Large Breed", "Elevated Bowl Set", "Joint Friendly",
        "Raised stainless steel bowls to reduce neck strain. Ideal for tall dogs.",
        "accessories", ["dine", "care"],
        {"breeds": ["Labrador", "Golden Retriever"], "sizes": ["L", "XL"], "age_groups": ["adult", "senior"]},
        1299
    ))
    
    products.append(p(
        "Fast Eater", "Slow Feeder Bowl", "Healthy Pace",
        "Maze pattern bowl that slows eating by 10x. Prevents bloat and improves digestion.",
        "accessories", ["dine", "care"],
        {"breeds": ["Labrador", "Beagle", "Golden Retriever"], "temperament": ["food_motivated"]},
        599
    ))
    
    products.append(p(
        "Small Breed", "Ceramic Bowl Set", "Easy Eating",
        "Low-profile ceramic bowls perfect for flat-faced breeds. Anti-slip base.",
        "accessories", ["dine"],
        {"breeds": ["Maltese", "Shih Tzu", "Maltipoo"], "sizes": ["S"]},
        449
    ))
    
    # ===================
    # BANDANAS
    # ===================
    
    products.append(p(
        "Large Breed", "Celebration Bandana", "Birthday Edition",
        "Premium cotton bandana with 'Birthday Pup' design. Adjustable snap closure.",
        "bandanas", ["celebrate"],
        {"breeds": ["Labrador", "Golden Retriever", "Indie"], "sizes": ["L", "XL"]},
        399
    ))
    
    products.append(p(
        "Small Breed", "Party Bandana", "Birthday Pawty",
        "Soft silk-blend bandana with cute birthday print. Gentle on fluffy coats.",
        "bandanas", ["celebrate"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S", "XS"]},
        349
    ))
    
    products.append(p(
        "All Breeds", "Gotcha Day Bandana", "Anniversary Special",
        "Commemorative bandana celebrating adoption anniversaries. Available in all sizes.",
        "bandanas", ["celebrate"],
        {"breeds": [], "sizes": ["S", "M", "L", "XL"]},
        349
    ))
    
    products.append(p(
        "Indie Dog", "Desi Pride Bandana", "Heritage Style",
        "Handcrafted bandana with traditional Indian patterns. Celebrating our native breeds.",
        "bandanas", ["celebrate", "enjoy"],
        {"breeds": ["Indie"], "sizes": ["M", "L"]},
        449
    ))
    
    products.append(p(
        "Golden Family", "Photoshoot Bandana", "Camera Ready",
        "Elegant neutral-tone bandana perfect for professional photos.",
        "bandanas", ["celebrate"],
        {"breeds": ["Golden Retriever", "Labrador"], "sizes": ["L"]},
        449
    ))
    
    # ===================
    # CLOTHES
    # ===================
    
    products.append(p(
        "Small Breed", "Winter Sweater", "Cozy Warmth",
        "Soft knit sweater for cold days. Easy on/off with velcro closure.",
        "clothes", ["care", "travel"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S", "XS"], "sensitivities": ["cold_sensitive"]},
        799
    ))
    
    products.append(p(
        "Small Breed", "Raincoat", "Dry Walks",
        "Water-resistant coat with hood. Keeps tiny paws dry on rainy days.",
        "clothes", ["travel", "care"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S", "XS"]},
        699
    ))
    
    products.append(p(
        "Large Breed", "Cooling Vest", "Beat The Heat",
        "Evaporative cooling vest for hot Indian summers. Just wet and wear.",
        "clothes", ["care", "travel", "fit"],
        {"breeds": ["Labrador", "Golden Retriever"], "sizes": ["L", "XL"]},
        1199
    ))
    
    products.append(p(
        "Indie Dog", "Light Jacket", "Monsoon Ready",
        "Breathable rain jacket designed for Indian weather. Quick-dry material.",
        "clothes", ["travel", "care"],
        {"breeds": ["Indie", "Beagle"], "sizes": ["M"]},
        849
    ))
    
    # ===================
    # CELEBRATION ADD-ONS
    # ===================
    
    products.append(p(
        "All Breeds", "Birthday Party Kit", "Complete Celebration",
        "Includes: party hat, banner, 6 balloons, candle, and photo props.",
        "celebration_addons", ["celebrate"],
        {"breeds": [], "sizes": []},
        999
    ))
    
    products.append(p(
        "Small Breed", "Mini Party Hat", "Tiny Crown",
        "Lightweight party hat with elastic chin strap. Won't topple off small heads.",
        "celebration_addons", ["celebrate"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S", "XS"]},
        199
    ))
    
    products.append(p(
        "Large Breed", "Party Hat XL", "Statement Piece",
        "Sturdy celebration hat for big party pups. Glitter finish with ribbon.",
        "celebration_addons", ["celebrate"],
        {"breeds": ["Labrador", "Golden Retriever"], "sizes": ["L", "XL"]},
        249
    ))
    
    products.append(p(
        "All Breeds", "Paw Print Balloons", "6-Pack Decor",
        "Latex balloons with paw print design. Pet-safe if popped.",
        "celebration_addons", ["celebrate"],
        {"breeds": [], "sizes": []},
        299
    ))
    
    products.append(p(
        "All Breeds", "Birthday Banner", "Photo Backdrop",
        "Reusable fabric banner spelling 'Happy Barkday'. 6ft wide.",
        "celebration_addons", ["celebrate"],
        {"breeds": [], "sizes": []},
        449
    ))
    
    products.append(p(
        "All Breeds", "Celebration Candle Set", "Paw Shaped",
        "Set of 5 non-toxic paw-shaped candles. Safe for cake photography.",
        "celebration_addons", ["celebrate"],
        {"breeds": [], "sizes": []},
        199
    ))
    
    # ===================
    # CUPS & MERCH
    # ===================
    
    products.append(p(
        "Indie Parent", "Desi Dog Mug", "Proud Owner",
        "Ceramic mug celebrating Indie dogs. 'My Indie is my best friend' design.",
        "cups_merch", ["celebrate", "enjoy"],
        {"breeds": ["Indie"]},
        449
    ))
    
    products.append(p(
        "Golden Parent", "Golden Retriever Mug", "Love My Golden",
        "Premium ceramic mug with watercolor Golden design.",
        "cups_merch", ["celebrate", "enjoy"],
        {"breeds": ["Golden Retriever"]},
        449
    ))
    
    products.append(p(
        "Lab Parent", "Labrador Travel Mug", "On The Go",
        "Insulated steel mug with Lab silhouette. Keeps drinks hot/cold 12hrs.",
        "cups_merch", ["travel", "enjoy"],
        {"breeds": ["Labrador"]},
        699
    ))
    
    products.append(p(
        "Maltese Parent", "Maltese Tote Bag", "Daily Essential",
        "Canvas tote with cute Maltese illustration. Perfect for vet visits.",
        "cups_merch", ["travel", "care"],
        {"breeds": ["Maltese", "Maltipoo"]},
        549
    ))
    
    # ===================
    # CROSS-PILLAR ITEMS
    # ===================
    
    products.append(p(
        "All Breeds", "Pet First Aid Kit", "Emergency Ready",
        "25-piece first aid kit with bandages, antiseptic, and emergency guide.",
        "cross_pillar", ["travel", "care"],
        {"breeds": [], "sizes": []},
        1299
    ))
    
    products.append(p(
        "Travel Ready", "Portable Water Bottle", "Hydration Station",
        "Leak-proof bottle with built-in bowl. Perfect for hikes and travel.",
        "cross_pillar", ["travel", "fit", "enjoy"],
        {"breeds": [], "sizes": ["M", "L"]},
        599
    ))
    
    products.append(p(
        "Long Coat", "Detangling Spray", "Mat Prevention",
        "Leave-in conditioner spray for easy brushing. Prevents matting.",
        "cross_pillar", ["care", "travel"],
        {"breeds": ["Golden Retriever", "Maltese", "Shih Tzu"], "coat_types": ["long", "curly"]},
        449
    ))
    
    products.append(p(
        "Short Coat", "Deshedding Mitt", "Fur Management",
        "Silicone grooming glove that removes loose fur. Great for Indies and Labs.",
        "cross_pillar", ["care"],
        {"breeds": ["Indie", "Labrador", "Beagle"], "coat_types": ["short"]},
        349
    ))
    
    products.append(p(
        "Senior Dog", "Orthopedic Mat", "Joint Support",
        "Memory foam mat for senior dogs. Provides relief during rest.",
        "cross_pillar", ["care", "stay"],
        {"breeds": [], "sizes": ["M", "L", "XL"], "age_groups": ["senior"]},
        2499
    ))
    
    return products


# ============================================
# SEED DATA - SERVICES
# ============================================

def generate_services():
    """Generate comprehensive breed-aware services"""
    services = []
    
    def s(who, what, why, desc, category, pillars, breed_tags, pricing_model, base_price=None, price_note=None, cities=None):
        return {
            "id": str(uuid.uuid4()),
            "name": f"{who} · {what} · {why}",
            "who_for": who,
            "what_is": what,
            "why_fits": why,
            "short_description": desc,
            "category": category,
            "pillars": pillars,
            "breed_tags": breed_tags,
            "handled_by_mira": True,
            "pricing_model": pricing_model,
            "base_price": base_price,
            "price_from": base_price,
            "price_note": price_note,
            "cities": cities or ["Mumbai", "Bangalore", "Delhi", "Pune", "Hyderabad"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    
    # ===================
    # GROOMING SERVICES
    # ===================
    
    services.append(s(
        "Long Coat", "Full Grooming", "Complete Spa Day",
        "Bath, blow dry, brush out, nail trim, ear clean. 2-3 hours for fluffy coats.",
        "grooming", ["care"],
        {"breeds": ["Golden Retriever", "Maltese", "Shih Tzu"], "coat_types": ["long", "double"]},
        "size_based", 1500, "From ₹1500 (varies by size)"
    ))
    
    services.append(s(
        "Short Coat", "Express Grooming", "Quick Refresh",
        "Bath, brush, nail trim. Quick 45-min session for easy coats.",
        "grooming", ["care"],
        {"breeds": ["Indie", "Labrador", "Beagle"], "coat_types": ["short"]},
        "fixed", 800
    ))
    
    services.append(s(
        "Double Coat", "Deshedding Treatment", "Fur Control",
        "Specialized deshedding bath + blow out. Removes loose undercoat.",
        "grooming", ["care"],
        {"breeds": ["Golden Retriever", "Labrador"], "coat_types": ["double"]},
        "size_based", 1200, "From ₹1200"
    ))
    
    services.append(s(
        "Curly Coat", "Poodle Mix Grooming", "Doodle Specialist",
        "Expert handling for curly coats. Includes dematting and styling.",
        "grooming", ["care"],
        {"breeds": ["Maltipoo"], "coat_types": ["curly"]},
        "fixed", 1800
    ))
    
    services.append(s(
        "Small Breed", "Puppy's First Groom", "Gentle Introduction",
        "Gentle first grooming experience. Positive association building.",
        "grooming", ["care"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S"], "age_groups": ["puppy"]},
        "fixed", 600
    ))
    
    services.append(s(
        "Large Breed", "Big Dog Bath", "Home Service",
        "At-home bath service for dogs that don't fit in salon tubs.",
        "grooming", ["care"],
        {"breeds": ["Labrador", "Golden Retriever"], "sizes": ["L", "XL"]},
        "fixed", 1200
    ))
    
    # ===================
    # TRAINING SERVICES
    # ===================
    
    services.append(s(
        "High Energy", "Obedience Training", "Focus Building",
        "6-session program focusing on impulse control and basic commands.",
        "training", ["care", "fit"],
        {"breeds": ["Labrador", "Beagle"], "energy_level": "high_energy"},
        "fixed", 8000, "6 sessions"
    ))
    
    services.append(s(
        "Indie Dog", "Street Dog Rehab", "Urban Adjustment",
        "Specialized training for adopted Indies. Addresses street behaviors.",
        "training", ["care"],
        {"breeds": ["Indie"], "temperament": ["independent", "alert"]},
        "fixed", 10000, "8 sessions"
    ))
    
    services.append(s(
        "Small Breed", "Puppy Socialization", "Early Learning",
        "Group puppy classes for small breeds. Safe, supervised play.",
        "training", ["care"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S"], "age_groups": ["puppy"]},
        "fixed", 4000, "4 sessions"
    ))
    
    services.append(s(
        "Anxious Dog", "Behavior Modification", "Calm Building",
        "One-on-one sessions addressing anxiety, fear, or reactivity.",
        "training", ["care"],
        {"breeds": [], "temperament": ["anxious"]},
        "custom", 15000, "Package varies by needs"
    ))
    
    services.append(s(
        "Scent Dog", "Nose Work Training", "Mental Exercise",
        "Channel natural scenting instincts into fun games.",
        "training", ["care", "enjoy"],
        {"breeds": ["Beagle", "Labrador"], "temperament": ["curious", "scent_driven"]},
        "fixed", 5000, "4 sessions"
    ))
    
    # ===================
    # WALKING & SITTING
    # ===================
    
    services.append(s(
        "High Energy", "Power Walk", "Energy Drain",
        "60-min brisk walk designed to tire out active breeds.",
        "walking_sitting", ["fit", "care"],
        {"breeds": ["Labrador", "Beagle", "Indie"], "energy_level": "active"},
        "fixed", 400, "Per walk"
    ))
    
    services.append(s(
        "Small Breed", "Gentle Walk", "Leisurely Pace",
        "30-min slow-paced walk for small or senior dogs.",
        "walking_sitting", ["care", "fit"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S"], "energy_level": "calm"},
        "fixed", 300, "Per walk"
    ))
    
    services.append(s(
        "Large Breed", "Adventure Walk", "Trail Exploration",
        "90-min nature walk in dog-friendly trails. Sniffing encouraged.",
        "walking_sitting", ["fit", "enjoy"],
        {"breeds": ["Labrador", "Golden Retriever", "Indie"], "sizes": ["M", "L"]},
        "fixed", 800, "Per session"
    ))
    
    services.append(s(
        "All Breeds", "Pet Sitting", "Home Care",
        "In-home pet sitting while you're away. Feeding, play, and cuddles.",
        "walking_sitting", ["stay", "care"],
        {"breeds": []},
        "city_based", 800, "Per day, varies by city"
    ))
    
    services.append(s(
        "Small Breed", "Lap Dog Sitter", "Companion Care",
        "Sitter specializing in small, affectionate breeds. Extra cuddle time.",
        "walking_sitting", ["stay"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S"]},
        "fixed", 1000, "Per day"
    ))
    
    # ===================
    # TRAVEL HANDLING
    # ===================
    
    services.append(s(
        "Large Breed", "Flight Crate Training", "Travel Prep",
        "Prepare your dog for crate travel. Includes IATA crate consultation.",
        "travel_handling", ["travel"],
        {"breeds": ["Labrador", "Golden Retriever"], "sizes": ["L", "XL"]},
        "fixed", 5000, "Full preparation package"
    ))
    
    services.append(s(
        "Small Breed", "Cabin Travel Prep", "Fly With Me",
        "Training for in-cabin flight travel. Carrier acclimation included.",
        "travel_handling", ["travel"],
        {"breeds": ["Maltese", "Maltipoo", "Shih Tzu"], "sizes": ["S"]},
        "fixed", 3000
    ))
    
    services.append(s(
        "All Breeds", "Road Trip Setup", "Car Travel Ready",
        "Car harness fitting, motion sickness management, and travel kit.",
        "travel_handling", ["travel"],
        {"breeds": []},
        "size_based", 2000, "Varies by size"
    ))
    
    services.append(s(
        "Anxious Traveler", "Travel Anxiety Support", "Calm Journey",
        "Desensitization program for travel-anxious dogs. Includes calming aids.",
        "travel_handling", ["travel", "care"],
        {"breeds": [], "temperament": ["anxious"]},
        "custom", 4000
    ))
    
    # ===================
    # CELEBRATION SUPPORT
    # ===================
    
    services.append(s(
        "All Breeds", "Birthday Party Setup", "Complete Celebration",
        "Mira handles everything: venue, cake, decorations, and coordination.",
        "celebration_support", ["celebrate"],
        {"breeds": []},
        "custom", 5000, "From ₹5000, depends on package"
    ))
    
    services.append(s(
        "All Breeds", "Gotcha Day Surprise", "Adoption Anniversary",
        "Special surprise package delivery on adoption anniversary.",
        "celebration_support", ["celebrate"],
        {"breeds": []},
        "fixed", 2000
    ))
    
    services.append(s(
        "All Breeds", "Photoshoot Coordination", "Memory Capture",
        "Professional pet photoshoot booking and coordination.",
        "celebration_support", ["celebrate"],
        {"breeds": []},
        "city_based", 3000, "Varies by photographer"
    ))
    
    services.append(s(
        "Large Breed", "Party Venue Booking", "Space For Play",
        "Find and book dog-friendly party venues for big breed gatherings.",
        "celebration_support", ["celebrate"],
        {"breeds": ["Labrador", "Golden Retriever"], "sizes": ["L", "XL"]},
        "custom", None, "Depends on venue"
    ))
    
    # ===================
    # CARE SUPPORT
    # ===================
    
    services.append(s(
        "All Breeds", "Nutrition Consultation", "Diet Planning",
        "One-on-one session with pet nutritionist. Custom meal plan included.",
        "care_support", ["care", "dine"],
        {"breeds": []},
        "fixed", 1500
    ))
    
    services.append(s(
        "Senior Dog", "Geriatric Care Plan", "Golden Years",
        "Comprehensive care planning for senior dogs. Vet coordination included.",
        "care_support", ["care"],
        {"breeds": [], "age_groups": ["senior"]},
        "fixed", 2500
    ))
    
    services.append(s(
        "Large Breed", "Joint Health Support", "Mobility Care",
        "Program for breeds prone to hip/joint issues. Supplements + exercise plan.",
        "care_support", ["care", "fit"],
        {"breeds": ["Labrador", "Golden Retriever"], "sizes": ["L", "XL"], "age_groups": ["adult", "senior"]},
        "fixed", 3000
    ))
    
    services.append(s(
        "Sensitive Skin", "Allergy Management", "Comfort Plan",
        "Identify triggers, food trials, and ongoing management support.",
        "care_support", ["care", "dine"],
        {"breeds": [], "sensitivities": ["allergy_safe", "skin_sensitive"]},
        "custom", 4000, "Depends on testing needed"
    ))
    
    services.append(s(
        "Post-Surgery", "Recovery Support", "Healing Help",
        "Post-op care coordination: meds, vet visits, mobility aids.",
        "care_support", ["care"],
        {"breeds": []},
        "custom", None, "Depends on recovery needs"
    ))
    
    return services


# ============================================
# SEEDING FUNCTION
# ============================================

async def seed_catalogue():
    """Seed the breed catalogue with products and services"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    logger.info("Starting breed catalogue seeding...")
    
    # Clear existing data (optional - comment out to append)
    await db.breed_products.delete_many({})
    await db.breed_services.delete_many({})
    logger.info("Cleared existing catalogue data")
    
    # Generate and insert products
    products = generate_products()
    if products:
        await db.breed_products.insert_many(products)
        logger.info(f"Inserted {len(products)} products")
    
    # Generate and insert services
    services = generate_services()
    if services:
        await db.breed_services.insert_many(services)
        logger.info(f"Inserted {len(services)} services")
    
    # Create indexes
    await db.breed_products.create_index([("category", 1)])
    await db.breed_products.create_index([("pillars", 1)])
    await db.breed_products.create_index([("breed_tags.breeds", 1)])
    await db.breed_products.create_index([("is_active", 1)])
    
    await db.breed_services.create_index([("category", 1)])
    await db.breed_services.create_index([("pillars", 1)])
    await db.breed_services.create_index([("breed_tags.breeds", 1)])
    await db.breed_services.create_index([("is_active", 1)])
    await db.breed_services.create_index([("cities", 1)])
    
    logger.info("Created indexes")
    
    # Summary
    product_count = await db.breed_products.count_documents({})
    service_count = await db.breed_services.count_documents({})
    
    logger.info(f"""
    ============================================
    BREED CATALOGUE SEEDING COMPLETE
    ============================================
    Products: {product_count}
    Services: {service_count}
    
    Categories:
    - Products: toys, accessories, bandanas, cups_merch, clothes, celebration_addons, cross_pillar
    - Services: grooming, training, walking_sitting, travel_handling, celebration_support, care_support
    
    Breeds Covered: Indie, Golden Retriever, Labrador, Beagle, Maltese, Maltipoo, Shih Tzu
    ============================================
    """)
    
    return {"products": product_count, "services": service_count}


if __name__ == "__main__":
    asyncio.run(seed_catalogue())
