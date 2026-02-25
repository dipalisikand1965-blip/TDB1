"""
Party Products Import Script for The Doggy Company

This script creates a comprehensive collection of dog party supplies:
1. Custom TDC-branded party products
2. Products inspired by popular Indian pet e-commerce sites

All products will be:
- Added to products and unified_products collections
- Assigned to the 'celebrate' pillar
- Tagged for Mira AI search
- Fully editable via admin Product Box
"""

import os
import sys
from datetime import datetime, timezone
from pymongo import MongoClient
import uuid

# Get MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'doggy_company')

client = MongoClient(mongo_url)
db = client[db_name]

def generate_id():
    return f"party-{uuid.uuid4().hex[:8]}"

def create_party_products():
    """Create comprehensive party products collection"""
    
    products = [
        # ===== PARTY HATS & HEADWEAR =====
        {
            "id": generate_id(),
            "name": "Birthday Cone Hat - Gold Crown",
            "description": "Sparkly gold crown-shaped party hat with elastic strap. Perfect for birthday photos! Adjustable fit for most breeds. Made with pet-safe, non-toxic materials.",
            "price": 199,
            "mrp": 299,
            "category": "party_accessories",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "party_hat", "photo_prop", "celebrate", "all_sizes", "pan-india"],
            "images": ["https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "variants": [
                {"id": "small", "title": "Small (Toy breeds)", "price": 199, "available": True},
                {"id": "medium", "title": "Medium (Most breeds)", "price": 199, "available": True},
                {"id": "large", "title": "Large (Giant breeds)", "price": 249, "available": True}
            ],
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration", "gotcha_day"],
            "intelligent_tags": ["birthday", "party", "hat", "crown", "gold", "photo_prop", "celebration"],
            "mira_visible": True,
            "mira_search_boost": 10
        },
        {
            "id": generate_id(),
            "name": "Pawty Hat Set - Rainbow Pack (3 Hats)",
            "description": "Set of 3 colorful cone party hats in pink, blue, and purple. Glitter finish with pom-pom tops. Includes adjustable chin straps for secure fit.",
            "price": 349,
            "mrp": 499,
            "category": "party_accessories",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "party_hat", "multipack", "celebrate", "all_sizes", "pan-india", "colorful"],
            "images": ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "variants": [
                {"id": "small", "title": "Small/Medium", "price": 349, "available": True},
                {"id": "large", "title": "Large/XL", "price": 399, "available": True}
            ],
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration"],
            "intelligent_tags": ["birthday", "party", "hat", "multipack", "colorful", "rainbow"],
            "mira_visible": True,
            "mira_search_boost": 8
        },
        {
            "id": generate_id(),
            "name": "Happy Birthday Tiara - Princess Crown",
            "description": "Elegant tiara with 'Happy Birthday' text and sparkling rhinestones. Perfect for birthday queens! Clips securely with pet-safe elastic.",
            "price": 249,
            "mrp": 349,
            "category": "party_accessories",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "tiara", "crown", "princess", "celebrate", "all_sizes", "pan-india"],
            "images": ["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration"],
            "intelligent_tags": ["birthday", "tiara", "princess", "crown", "rhinestone", "elegant"],
            "mira_visible": True
        },

        # ===== BANDANAS & OUTFIT ACCESSORIES =====
        {
            "id": generate_id(),
            "name": "Birthday Boy Bandana - Blue & Gold",
            "description": "Premium cotton bandana with 'Birthday Boy' embroidery. Soft, breathable fabric with adjustable snap closure. Machine washable.",
            "price": 299,
            "mrp": 399,
            "category": "party_accessories",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "bandana", "boy", "celebrate", "all_sizes", "pan-india", "washable"],
            "images": ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "variants": [
                {"id": "small", "title": "Small (< 10kg)", "price": 299, "available": True},
                {"id": "medium", "title": "Medium (10-25kg)", "price": 299, "available": True},
                {"id": "large", "title": "Large (> 25kg)", "price": 349, "available": True}
            ],
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration"],
            "intelligent_tags": ["birthday", "bandana", "boy", "blue", "gold", "embroidered"],
            "mira_visible": True,
            "mira_search_boost": 9
        },
        {
            "id": generate_id(),
            "name": "Birthday Girl Bandana - Pink & Rose Gold",
            "description": "Adorable cotton bandana with 'Birthday Girl' embroidery and rose gold accents. Snap closure for easy on/off. Perfect for photos!",
            "price": 299,
            "mrp": 399,
            "category": "party_accessories",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "bandana", "girl", "celebrate", "all_sizes", "pan-india", "washable"],
            "images": ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "variants": [
                {"id": "small", "title": "Small (< 10kg)", "price": 299, "available": True},
                {"id": "medium", "title": "Medium (10-25kg)", "price": 299, "available": True},
                {"id": "large", "title": "Large (> 25kg)", "price": 349, "available": True}
            ],
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration"],
            "intelligent_tags": ["birthday", "bandana", "girl", "pink", "rose_gold", "embroidered"],
            "mira_visible": True,
            "mira_search_boost": 9
        },
        {
            "id": generate_id(),
            "name": "Party Bow Tie Set - Celebration Pack",
            "description": "Set of 3 clip-on bow ties in festive patterns: birthday cake print, balloons, and confetti. Easy clip attachment works on any collar.",
            "price": 399,
            "mrp": 549,
            "category": "party_accessories",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "bow_tie", "party", "celebrate", "all_sizes", "pan-india", "multipack"],
            "images": ["https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration", "party"],
            "intelligent_tags": ["birthday", "bow_tie", "party", "clip_on", "festive", "multipack"],
            "mira_visible": True
        },

        # ===== PARTY DECORATIONS =====
        {
            "id": generate_id(),
            "name": "WOOF Letter Balloon Set - Gold Foil",
            "description": "16-inch gold foil letter balloons spelling 'WOOF'. Self-sealing with straw included. Perfect backdrop for pawty photos!",
            "price": 299,
            "mrp": 449,
            "category": "party_decorations",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "balloons", "decoration", "celebrate", "pan-india", "photo_backdrop"],
            "images": ["https://images.unsplash.com/photo-1530041539828-114de669390e?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1530041539828-114de669390e?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration", "party"],
            "intelligent_tags": ["woof", "balloons", "gold", "foil", "decoration", "backdrop"],
            "mira_visible": True,
            "mira_search_boost": 7
        },
        {
            "id": generate_id(),
            "name": "Let's Pawty Banner - Rose Gold",
            "description": "Pre-strung 'Let's Pawty' banner in rose gold glitter cardstock. 6 feet long with ribbon ties. Reusable for multiple celebrations!",
            "price": 199,
            "mrp": 299,
            "category": "party_decorations",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "banner", "decoration", "celebrate", "pan-india", "rose_gold"],
            "images": ["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration", "party"],
            "intelligent_tags": ["pawty", "banner", "rose_gold", "decoration", "glitter"],
            "mira_visible": True
        },
        {
            "id": generate_id(),
            "name": "Paw Print Balloon Garland Kit (50 Pcs)",
            "description": "Complete balloon garland kit with paw print balloons, solid colors, and confetti balloons. Includes arch strip, glue dots, and ribbon.",
            "price": 549,
            "mrp": 799,
            "category": "party_decorations",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "balloons", "garland", "decoration", "celebrate", "pan-india"],
            "images": ["https://images.unsplash.com/photo-1530041539828-114de669390e?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1530041539828-114de669390e?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration", "party"],
            "intelligent_tags": ["balloons", "garland", "paw_print", "decoration", "kit", "50_pieces"],
            "mira_visible": True,
            "mira_search_boost": 8
        },
        {
            "id": generate_id(),
            "name": "Birthday Backdrop - Paw Print Design (5x3 ft)",
            "description": "Vibrant printed vinyl backdrop with paw prints and 'Happy Bark Day' text. Grommet holes for easy hanging. Waterproof and reusable.",
            "price": 699,
            "mrp": 999,
            "category": "party_decorations",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "backdrop", "decoration", "celebrate", "pan-india", "photo_prop"],
            "images": ["https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration", "party"],
            "intelligent_tags": ["backdrop", "paw_print", "bark_day", "vinyl", "photo_prop"],
            "mira_visible": True
        },

        # ===== PARTY TABLEWARE & SUPPLIES =====
        {
            "id": generate_id(),
            "name": "Paw Print Paper Plates (20 Pack)",
            "description": "Disposable paper plates with cute paw print design. 7-inch size, perfect for dog treats and party snacks. Food-safe ink.",
            "price": 149,
            "mrp": 199,
            "category": "party_tableware",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "plates", "tableware", "celebrate", "pan-india", "disposable"],
            "images": ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration", "party"],
            "intelligent_tags": ["plates", "paw_print", "paper", "disposable", "tableware"],
            "mira_visible": True
        },
        {
            "id": generate_id(),
            "name": "Dog Bone Napkins (30 Pack)",
            "description": "Cute napkins with bone and paw print patterns. 2-ply for durability. Perfect for messy cake time!",
            "price": 99,
            "mrp": 149,
            "category": "party_tableware",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "napkins", "tableware", "celebrate", "pan-india", "disposable"],
            "images": ["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration", "party"],
            "intelligent_tags": ["napkins", "bone", "paw_print", "paper", "tableware"],
            "mira_visible": True
        },

        # ===== CAKE TOPPERS & DECORATIONS =====
        {
            "id": generate_id(),
            "name": "Dog Birthday Cake Topper Set",
            "description": "Set includes: 'Happy Birthday' banner topper, bone-shaped picks, paw print picks, and number candles (0-9). Reusable acrylic and wood.",
            "price": 249,
            "mrp": 349,
            "category": "cake_decorations",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "cake_topper", "decoration", "celebrate", "pan-india"],
            "images": ["https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration"],
            "intelligent_tags": ["cake_topper", "candles", "birthday", "bone", "paw_print"],
            "mira_visible": True,
            "mira_search_boost": 8
        },
        {
            "id": generate_id(),
            "name": "Gold Paw Cake Topper - Acrylic",
            "description": "Elegant gold acrylic cake topper shaped like a paw print. 6 inches tall, food-safe. Makes any cake Instagram-worthy!",
            "price": 199,
            "mrp": 299,
            "category": "cake_decorations",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "cake_topper", "gold", "celebrate", "pan-india", "acrylic"],
            "images": ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration"],
            "intelligent_tags": ["cake_topper", "gold", "paw", "acrylic", "instagram"],
            "mira_visible": True
        },

        # ===== PARTY FAVOR PACKS =====
        {
            "id": generate_id(),
            "name": "Pawty Favor Bags (10 Pack)",
            "description": "Adorable kraft paper bags with paw print windows and ribbon ties. Perfect for treat bags! Includes 10 'Thank You for Coming' tags.",
            "price": 249,
            "mrp": 349,
            "category": "party_supplies",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "favor_bags", "party", "celebrate", "pan-india", "kraft"],
            "images": ["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration", "party"],
            "intelligent_tags": ["favor_bags", "kraft", "paw_print", "thank_you", "party"],
            "mira_visible": True
        },
        {
            "id": generate_id(),
            "name": "Dog Party Guest Kit (For 10 Dogs)",
            "description": "Complete party kit for dog guests! Includes: 10 mini party hats, 10 bow ties, 10 treat bags, and 10 bone-shaped name tags.",
            "price": 899,
            "mrp": 1299,
            "category": "party_supplies",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "party_kit", "guests", "celebrate", "pan-india", "multipack"],
            "images": ["https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration", "party"],
            "intelligent_tags": ["party_kit", "guests", "10_pack", "hats", "bow_ties", "treats"],
            "mira_visible": True,
            "mira_search_boost": 10
        },

        # ===== COMPLETE PARTY KITS =====
        {
            "id": generate_id(),
            "name": "Ultimate Pawty Box - Complete Birthday Kit",
            "description": "Everything you need for the perfect dog birthday! Includes: 1 birthday hat, 1 bandana, balloon garland (30 pcs), WOOF balloons, Let's Pawty banner, 20 plates, 30 napkins, cake topper set, 10 favor bags.",
            "price": 1499,
            "mrp": 2199,
            "category": "party_kits",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "party_kit", "complete", "celebrate", "pan-india", "value_pack"],
            "images": ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "includes": [
                "1 Birthday Crown Hat",
                "1 Birthday Bandana",
                "30-piece Balloon Garland",
                "WOOF Letter Balloons",
                "Let's Pawty Banner",
                "20 Paw Print Plates",
                "30 Dog Bone Napkins",
                "Cake Topper Set with Candles",
                "10 Pawty Favor Bags"
            ],
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration"],
            "intelligent_tags": ["ultimate", "complete_kit", "party_box", "birthday", "value"],
            "mira_visible": True,
            "mira_search_boost": 15
        },
        {
            "id": generate_id(),
            "name": "Budget Pawty Pack - Starter Kit",
            "description": "Affordable party starter! Includes: 1 party hat, Happy Birthday banner, 10 balloons, cake topper, and 5 favor bags.",
            "price": 599,
            "mrp": 849,
            "category": "party_kits",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "party_kit", "budget", "celebrate", "pan-india", "starter"],
            "images": ["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "includes": [
                "1 Party Hat",
                "Happy Birthday Banner",
                "10 Balloons",
                "Cake Topper",
                "5 Favor Bags"
            ],
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration"],
            "intelligent_tags": ["budget", "starter_kit", "affordable", "birthday", "basic"],
            "mira_visible": True,
            "mira_search_boost": 10
        },
        {
            "id": generate_id(),
            "name": "Photo Booth Kit - Pawparazzi Pack",
            "description": "Everything for amazing birthday photos! Includes: photo backdrop (5x3 ft), 20 photo props on sticks, 2 party hats, balloon frame, and 'It's My Birthday' sign.",
            "price": 999,
            "mrp": 1449,
            "category": "party_kits",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "photo_booth", "props", "celebrate", "pan-india", "instagram"],
            "images": ["https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "includes": [
                "Photo Backdrop (5x3 ft)",
                "20 Photo Props on Sticks",
                "2 Party Hats",
                "Balloon Photo Frame",
                "It's My Birthday Sign"
            ],
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration", "party"],
            "intelligent_tags": ["photo_booth", "props", "backdrop", "instagram", "pawparazzi"],
            "mira_visible": True,
            "mira_search_boost": 9
        },

        # ===== GOTCHA DAY / ADOPTION CELEBRATION =====
        {
            "id": generate_id(),
            "name": "Gotcha Day Celebration Kit",
            "description": "Celebrate your rescue anniversary! Includes: 'Happy Gotcha Day' banner, heart-shaped balloons, adoption anniversary bandana, and bone-shaped treat tin.",
            "price": 749,
            "mrp": 999,
            "category": "party_kits",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["gotcha_day", "adoption", "anniversary", "celebrate", "pan-india", "rescue"],
            "images": ["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "includes": [
                "Happy Gotcha Day Banner",
                "Heart-shaped Balloons (10 pcs)",
                "Adoption Anniversary Bandana",
                "Bone-shaped Treat Tin"
            ],
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["gotcha_day", "adoption_anniversary", "celebration"],
            "intelligent_tags": ["gotcha_day", "adoption", "rescue", "anniversary", "heart"],
            "mira_visible": True,
            "mira_search_boost": 8
        },

        # ===== PARTY TOYS & GAMES =====
        {
            "id": generate_id(),
            "name": "Birthday Squeaky Toy Set (3 Pack)",
            "description": "Fun birthday-themed squeaky toys! Includes: plush cake, birthday present, and party hat toy. Safe, durable materials for rough play.",
            "price": 449,
            "mrp": 599,
            "category": "party_toys",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "toys", "squeaky", "celebrate", "pan-india", "plush"],
            "images": ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "variants": [
                {"id": "small", "title": "Small (< 10kg)", "price": 449, "available": True},
                {"id": "large", "title": "Large (> 10kg)", "price": 549, "available": True}
            ],
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration"],
            "intelligent_tags": ["birthday", "toys", "squeaky", "plush", "cake", "present"],
            "mira_visible": True
        },
        {
            "id": generate_id(),
            "name": "Treat Puzzle Toy - Birthday Cake Shape",
            "description": "Fun treat-dispensing puzzle in birthday cake shape! Keeps dogs entertained at parties. Dishwasher safe, non-toxic rubber.",
            "price": 549,
            "mrp": 749,
            "category": "party_toys",
            "parent_category": "party_supplies",
            "pillar": "celebrate",
            "tags": ["birthday", "puzzle_toy", "treat_dispenser", "celebrate", "pan-india"],
            "images": ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"],
            "thumbnail": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
            "in_stock": True,
            "is_active": True,
            "is_pan_india_shippable": True,
            "source": "tdc_branded",
            "size_tags": ["all_sizes"],
            "breed_tags": ["all_breeds"],
            "occasion_tags": ["birthday", "celebration"],
            "intelligent_tags": ["puzzle", "treat_dispenser", "cake_shape", "interactive", "enrichment"],
            "mira_visible": True
        }
    ]
    
    # Add common fields to all products
    now = datetime.now(timezone.utc)
    for product in products:
        product.update({
            "created_at": now,
            "updated_at": now,
            "stock_quantity": 100,
            "base_tags": {
                "interaction_type": "accessory",
                "benefits": ["celebration", "photo_worthy"],
                "usage_frequency": "occasional",
                "mess_level": "low",
                "format": [],
                "diet_type": [],
                "protein_source": [],
                "life_stage": ["all_ages"],
                "breed_size": [],
                "price_tier": "mid",
                "purchase_pattern": "celebration",
                "category_primary": "party_supplies",
                "category_secondary": product.get("category", "accessories")
            },
            "search_keywords": product.get("intelligent_tags", []) + ["dog", "pet", "party", "birthday", "celebrate", "in_stock", "pan_india"]
        })
    
    return products


def run_import():
    """Import party products to database"""
    
    print("=" * 60)
    print("🎉 PARTY PRODUCTS IMPORT")
    print("=" * 60)
    
    products = create_party_products()
    
    # Insert into products collection
    products_inserted = 0
    unified_inserted = 0
    
    for product in products:
        try:
            # Check if product already exists
            existing = db.products.find_one({"name": product["name"]})
            if existing:
                print(f"  ⚠️  Skipping (exists): {product['name']}")
                continue
            
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
    print(f"✅ IMPORT COMPLETE")
    print(f"   Products added: {products_inserted}")
    print(f"   Unified products added: {unified_inserted}")
    print("=" * 60)
    
    client.close()
    return products_inserted


if __name__ == "__main__":
    run_import()
