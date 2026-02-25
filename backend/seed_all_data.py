"""
Comprehensive Data Seeder for The Doggy Company
Seeds all critical data: products, bundles, restaurants, stay properties, etc.
"""

import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

# Import seeder functions
from stay_seeder import INDIA_PET_FRIENDLY_HOTELS

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


# ============= PRODUCTS DATA =============
SAMPLE_PRODUCTS = [
    # Birthday Cakes
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Classic Peanut Butter Cake",
        "description": "A delicious peanut butter cake for your furry friend's special day",
        "price": 899,
        "category": "cakes",
        "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["birthday", "peanut-butter", "cake"]
    },
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Banana Bliss Cake",
        "description": "Healthy banana cake made with dog-safe ingredients",
        "price": 799,
        "category": "cakes",
        "image": "https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["birthday", "banana", "healthy"]
    },
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Carrot Delight Cake",
        "description": "Carrot cake with cream cheese frosting - dog safe!",
        "price": 949,
        "category": "cakes",
        "image": "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["birthday", "carrot", "cake"]
    },
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Pupcake Box (6 pcs)",
        "description": "Assorted mini cupcakes perfect for parties",
        "price": 599,
        "category": "cakes",
        "image": "https://images.unsplash.com/photo-1607478900766-efe13248b125?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["cupcakes", "party", "assorted"]
    },
    
    # Treats
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Chicken Jerky Strips",
        "description": "Premium dehydrated chicken jerky - 100g pack",
        "price": 349,
        "category": "treats",
        "image": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["jerky", "chicken", "protein"]
    },
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Peanut Butter Biscuits",
        "description": "Crunchy peanut butter dog biscuits - 200g pack",
        "price": 249,
        "category": "treats",
        "image": "https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["biscuits", "peanut-butter", "crunchy"]
    },
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Freeze-Dried Liver Treats",
        "description": "Single ingredient liver treats - 100g",
        "price": 399,
        "category": "treats",
        "image": "https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["liver", "freeze-dried", "training"]
    },
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Dental Chew Sticks",
        "description": "Helps clean teeth and freshen breath - 10 pack",
        "price": 299,
        "category": "treats",
        "image": "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["dental", "chew", "oral-health"]
    },
    
    # Fresh Meals
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Chicken & Rice Bowl",
        "description": "Freshly prepared chicken with brown rice and veggies",
        "price": 199,
        "category": "fresh-meals",
        "image": "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["fresh", "chicken", "rice"]
    },
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Lamb & Sweet Potato",
        "description": "Tender lamb with sweet potato mash",
        "price": 249,
        "category": "fresh-meals",
        "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["fresh", "lamb", "sweet-potato"]
    },
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Fish & Veggie Medley",
        "description": "Omega-rich fish with seasonal vegetables",
        "price": 229,
        "category": "fresh-meals",
        "image": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["fresh", "fish", "omega"]
    },
    
    # Accessories
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Birthday Bandana",
        "description": "Festive birthday bandana - one size fits most",
        "price": 199,
        "category": "accessories",
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["birthday", "bandana", "party"]
    },
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Party Hat Set",
        "description": "Cute party hats for your pet's celebration",
        "price": 149,
        "category": "accessories",
        "image": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["party", "hat", "celebration"]
    },
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Collapsible Travel Bowl",
        "description": "Portable silicone bowl for on-the-go feeding",
        "price": 299,
        "category": "accessories",
        "image": "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["travel", "bowl", "portable"]
    },
    
    # Frozen Treats
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Pupsicles - Peanut Butter",
        "description": "Frozen peanut butter treat sticks - 4 pack",
        "price": 199,
        "category": "frozen-treats",
        "image": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["frozen", "peanut-butter", "summer"]
    },
    {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        "name": "Frozen Yogurt Bites",
        "description": "Probiotic-rich frozen yogurt treats",
        "price": 249,
        "category": "frozen-treats",
        "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["frozen", "yogurt", "probiotic"]
    },
]


# ============= DINE BUNDLES DATA =============
DINE_BUNDLES = [
    {
        "id": "dine-bundle-birthday",
        "name": "Pawty Birthday Package",
        "description": "Complete birthday celebration kit for your furry friend! Includes doggy cake, treats, party hats, and decoration.",
        "image": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=800",
        "bundle_price": 2499,
        "original_price": 3200,
        "category": "party_package",
        "items": ["Birthday Cake (500g)", "Gourmet Treats Pack", "Party Hat Set", "Paw Print Napkins", "Birthday Bandana"],
        "for_occasion": "birthday",
        "discount_percent": 22,
        "featured": True,
        "active": True,
        "tags": ["birthday", "celebration", "party"]
    },
    {
        "id": "dine-bundle-dining-kit",
        "name": "Fine Dining Kit",
        "description": "Everything you need for dining out with your pet. Portable bowl, treat pouch, and wipes.",
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
        "bundle_price": 899,
        "original_price": 1200,
        "category": "dining_kit",
        "items": ["Collapsible Travel Bowl", "Treat Pouch", "Pet Wipes (20 pack)", "Portable Water Bottle"],
        "for_occasion": "casual",
        "discount_percent": 25,
        "featured": True,
        "active": True,
        "tags": ["dining", "travel", "essentials"]
    },
    {
        "id": "dine-bundle-treats",
        "name": "Gourmet Treats Box",
        "description": "A curated selection of vet-approved gourmet treats for your furry foodie.",
        "image": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=800",
        "bundle_price": 699,
        "original_price": 900,
        "category": "pet_treats",
        "items": ["Chicken Jerky (100g)", "Peanut Butter Biscuits", "Freeze-dried Liver", "Dental Chews"],
        "for_occasion": "any",
        "discount_percent": 22,
        "featured": False,
        "active": True,
        "tags": ["treats", "gourmet", "healthy"]
    },
    {
        "id": "dine-bundle-anniversary",
        "name": "Adoption Anniversary Special",
        "description": "Celebrate your furry family member's gotcha day with this special bundle.",
        "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
        "bundle_price": 1999,
        "original_price": 2500,
        "category": "party_package",
        "items": ["Anniversary Cake", "Photo Frame", "Bandana", "Premium Treats Box"],
        "for_occasion": "anniversary",
        "discount_percent": 20,
        "featured": True,
        "active": True,
        "tags": ["anniversary", "adoption", "celebration"]
    },
    {
        "id": "dine-bundle-date-night",
        "name": "Puppy Date Night",
        "description": "Perfect kit for a romantic evening with your furry one.",
        "image": "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800",
        "bundle_price": 1299,
        "original_price": 1600,
        "category": "experience",
        "items": ["Mini Cake", "Gourmet Meal", "Special Treats", "Plush Toy"],
        "for_occasion": "date",
        "discount_percent": 19,
        "featured": False,
        "active": True,
        "tags": ["date", "romantic", "special"]
    }
]


# ============= DINE RESTAURANTS DATA =============
DINE_RESTAURANTS = [
    {
        "id": f"rest-{uuid.uuid4().hex[:8]}",
        "name": "Bark & Brew Cafe",
        "description": "Mumbai's first dedicated dog cafe with an extensive pet menu",
        "address": "123 Linking Road, Bandra West",
        "city": "Mumbai",
        "state": "Maharashtra",
        "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
        "pet_menu_available": True,
        "human_menu_available": True,
        "outdoor_seating": True,
        "water_bowls": True,
        "pet_friendly_rating": 5,
        "cuisines": ["Continental", "Italian", "Pet-special"],
        "price_range": "₹₹",
        "timings": {"open": "10:00", "close": "22:00"},
        "phone": "+91 98765 43210",
        "featured": True,
        "status": "verified",
        "tags": ["cafe", "pet-menu", "outdoor"]
    },
    {
        "id": f"rest-{uuid.uuid4().hex[:8]}",
        "name": "Paws & Plates",
        "description": "Fine dining experience that welcomes your furry friends",
        "address": "45 MG Road, Indiranagar",
        "city": "Bangalore",
        "state": "Karnataka",
        "image": "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
        "pet_menu_available": True,
        "human_menu_available": True,
        "outdoor_seating": True,
        "water_bowls": True,
        "pet_friendly_rating": 5,
        "cuisines": ["Indian", "Asian", "Pet-special"],
        "price_range": "₹₹₹",
        "timings": {"open": "12:00", "close": "23:00"},
        "phone": "+91 98765 43211",
        "featured": True,
        "status": "verified",
        "tags": ["fine-dining", "pet-friendly", "outdoor"]
    },
    {
        "id": f"rest-{uuid.uuid4().hex[:8]}",
        "name": "The Wagging Tail",
        "description": "Cozy neighborhood spot perfect for brunch with your pet",
        "address": "78 Khan Market",
        "city": "Delhi",
        "state": "Delhi",
        "image": "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800",
        "pet_menu_available": True,
        "human_menu_available": True,
        "outdoor_seating": True,
        "water_bowls": True,
        "pet_friendly_rating": 4,
        "cuisines": ["European", "Breakfast", "Healthy"],
        "price_range": "₹₹",
        "timings": {"open": "08:00", "close": "20:00"},
        "phone": "+91 98765 43212",
        "featured": False,
        "status": "verified",
        "tags": ["brunch", "casual", "pet-friendly"]
    },
    {
        "id": f"rest-{uuid.uuid4().hex[:8]}",
        "name": "Furry Friends Kitchen",
        "description": "A restaurant dedicated to both pet and human foodies",
        "address": "22 Marine Drive",
        "city": "Mumbai",
        "state": "Maharashtra",
        "image": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
        "pet_menu_available": True,
        "human_menu_available": True,
        "outdoor_seating": True,
        "water_bowls": True,
        "pet_friendly_rating": 5,
        "cuisines": ["Multi-cuisine", "Pet-special"],
        "price_range": "₹₹",
        "timings": {"open": "11:00", "close": "22:00"},
        "phone": "+91 98765 43213",
        "featured": True,
        "status": "verified",
        "tags": ["multi-cuisine", "sea-view", "pet-menu"]
    },
    {
        "id": f"rest-{uuid.uuid4().hex[:8]}",
        "name": "Tail Waggers Bistro",
        "description": "European bistro with special pet-friendly seating areas",
        "address": "99 Commercial Street",
        "city": "Bangalore",
        "state": "Karnataka",
        "image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
        "pet_menu_available": False,
        "human_menu_available": True,
        "outdoor_seating": True,
        "water_bowls": True,
        "pet_friendly_rating": 4,
        "cuisines": ["French", "Italian"],
        "price_range": "₹₹₹",
        "timings": {"open": "12:00", "close": "23:00"},
        "phone": "+91 98765 43214",
        "featured": False,
        "status": "verified",
        "tags": ["bistro", "european", "pet-allowed"]
    }
]


# ============= CELEBRATE BUNDLES DATA =============
CELEBRATE_BUNDLES = [
    {
        "id": "celeb-bundle-ultimate",
        "name": "Ultimate Birthday Bash",
        "description": "The most comprehensive birthday package for your fur baby's special day",
        "image": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=800",
        "bundle_price": 4999,
        "original_price": 6500,
        "category": "premium",
        "items": [
            "Custom 2-tier cake", 
            "Photo shoot session", 
            "Party decorations", 
            "Gourmet treat box", 
            "Birthday outfit", 
            "Party favors (10 guests)"
        ],
        "for_occasion": "birthday",
        "discount_percent": 23,
        "featured": True,
        "active": True,
        "tags": ["premium", "birthday", "complete-package"]
    },
    {
        "id": "celeb-bundle-basic",
        "name": "Pawsome Party Starter",
        "description": "Everything you need to get the party started",
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
        "bundle_price": 1499,
        "original_price": 1900,
        "category": "basic",
        "items": [
            "Mini celebration cake",
            "Party hat",
            "Bandana",
            "Treats pack"
        ],
        "for_occasion": "birthday",
        "discount_percent": 21,
        "featured": True,
        "active": True,
        "tags": ["basic", "birthday", "starter"]
    },
    {
        "id": "celeb-bundle-photo",
        "name": "Paw-parazzi Package",
        "description": "Professional photo session package for memorable captures",
        "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
        "bundle_price": 2999,
        "original_price": 3800,
        "category": "photo",
        "items": [
            "1-hour photo session",
            "10 edited photos",
            "Digital album",
            "Props and accessories",
            "Small treat box"
        ],
        "for_occasion": "any",
        "discount_percent": 21,
        "featured": False,
        "active": True,
        "tags": ["photo", "memories", "professional"]
    }
]


# ============= BLOG POSTS DATA =============
BLOG_POSTS = [
    {
        "id": f"blog-{uuid.uuid4().hex[:8]}",
        "title": "10 Best Pet-Friendly Hotels in India for 2025",
        "slug": "best-pet-friendly-hotels-india-2025",
        "excerpt": "Discover the top pet-friendly accommodations across India that welcome your furry family members.",
        "content": """
Planning a vacation with your four-legged companion? India's hospitality industry has evolved tremendously, with many luxury hotels now offering exceptional pet-friendly experiences.

## Top Picks

### 1. The Leela Goa
Set amidst 75 acres of lush gardens, The Leela Goa offers pet-friendly suites with dedicated pet concierge services.

### 2. Evolve Back Coorg
This luxury plantation resort welcomes pets in their private villas, complete with coffee estate walks.

### 3. JIM'S Jungle Retreat, Corbett
Perfect for adventure-loving pets with riverside access and forest trails.

## Tips for Traveling with Pets
- Always call ahead to confirm pet policies
- Bring your pet's vaccination records
- Pack familiar items from home
- Plan for frequent breaks during travel
        """,
        "image": "https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=800",
        "category": "travel",
        "tags": ["travel", "hotels", "pet-friendly"],
        "author": "The Doggy Company Team",
        "published": True,
        "read_time": 5
    },
    {
        "id": f"blog-{uuid.uuid4().hex[:8]}",
        "title": "Homemade Birthday Cake Recipes for Dogs",
        "slug": "homemade-birthday-cake-recipes-dogs",
        "excerpt": "Safe and delicious birthday cake recipes you can make at home for your furry friend.",
        "content": """
Celebrate your pup's special day with a homemade cake they'll love!

## Peanut Butter Banana Cake

### Ingredients
- 1 cup whole wheat flour
- 1 tsp baking soda
- 1/4 cup peanut butter
- 1 ripe banana, mashed
- 1 egg
- 1/3 cup honey

### Instructions
1. Preheat oven to 350°F
2. Mix dry ingredients
3. Add wet ingredients
4. Bake for 25-30 minutes
5. Cool completely before frosting

## Carrot Apple Pupcakes
Perfect for portion control and sharing with doggy friends!
        """,
        "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800",
        "category": "recipes",
        "tags": ["recipes", "birthday", "homemade"],
        "author": "Chef Pawlette",
        "published": True,
        "read_time": 7
    },
    {
        "id": f"blog-{uuid.uuid4().hex[:8]}",
        "title": "Understanding Your Dog's Nutritional Needs",
        "slug": "understanding-dog-nutritional-needs",
        "excerpt": "A comprehensive guide to ensuring your dog gets the right nutrition at every life stage.",
        "content": """
Proper nutrition is the foundation of your dog's health and happiness.

## Life Stage Nutrition

### Puppies (0-1 year)
- High protein for growth
- DHA for brain development
- Calcium for strong bones

### Adults (1-7 years)
- Balanced protein and fat
- Fiber for digestive health
- Antioxidants for immunity

### Seniors (7+ years)
- Lower calories
- Joint support supplements
- Easily digestible proteins

## Common Nutritional Mistakes
1. Overfeeding treats
2. Ignoring portion sizes
3. Not adjusting for activity level
        """,
        "image": "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=800",
        "category": "health",
        "tags": ["nutrition", "health", "guide"],
        "author": "Dr. Woofington",
        "published": True,
        "read_time": 8
    },
    {
        "id": f"blog-{uuid.uuid4().hex[:8]}",
        "title": "5 Signs Your Dog Needs a Vacation Too",
        "slug": "signs-dog-needs-vacation",
        "excerpt": "Is your furry friend showing signs of stress? They might benefit from a getaway as much as you do!",
        "content": """
Dogs can experience burnout too! Here's how to tell if your pup needs a change of scenery.

## Warning Signs

### 1. Decreased Energy
If your usually playful pup seems lethargic, a stimulating new environment might help.

### 2. Excessive Sleeping
While dogs sleep a lot, unusual lethargy could signal boredom.

### 3. Loss of Interest in Toys
New experiences can reignite their playful spirit.

### 4. Attention-Seeking Behavior
Sometimes they just need quality time with you in a new setting.

### 5. Restlessness
Pacing or inability to settle might mean they need adventure.

## Planning the Perfect Pet Vacation
Choose a destination with:
- Pet-friendly accommodation
- Outdoor spaces to explore
- Pet-safe beaches or trails
        """,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
        "category": "lifestyle",
        "tags": ["travel", "wellness", "tips"],
        "author": "The Doggy Company Team",
        "published": True,
        "read_time": 4
    },
    {
        "id": f"blog-{uuid.uuid4().hex[:8]}",
        "title": "The Rise of Pet Cafes in India",
        "slug": "rise-pet-cafes-india",
        "excerpt": "Explore India's growing pet cafe culture and the best spots to dine with your furry friend.",
        "content": """
Pet cafes are revolutionizing the dining experience for pet parents across India.

## Mumbai's Pet Cafe Scene
The financial capital leads the way with dedicated dog cafes featuring:
- Specialized pet menus
- Play areas
- Pet-parent networking events

## Bangalore's Innovations
Tech city's cafes offer:
- App-based ordering for pets
- Indoor play zones
- Birthday party hosting

## What to Look For
When choosing a pet cafe:
1. Hygiene standards
2. Pet menu quality
3. Staff training
4. Safe play areas
5. Ventilation

## Our Top Recommendations
Visit our Dine section to discover verified pet-friendly restaurants near you!
        """,
        "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
        "category": "lifestyle",
        "tags": ["cafes", "dining", "india"],
        "author": "Food & Paws Editor",
        "published": True,
        "read_time": 5
    }
]


# ============= CATEGORIES DATA =============
CATEGORIES = [
    {"id": "cakes", "name": "Birthday Cakes", "slug": "birthday-cakes", "icon": "🎂"},
    {"id": "treats", "name": "Treats", "slug": "treats", "icon": "🦴"},
    {"id": "fresh-meals", "name": "Fresh Meals", "slug": "fresh-meals", "icon": "🍖"},
    {"id": "frozen-treats", "name": "Frozen Treats", "slug": "frozen-treats", "icon": "🧊"},
    {"id": "accessories", "name": "Accessories", "slug": "accessories", "icon": "🎀"},
    {"id": "gift_cards", "name": "Gift Cards", "slug": "gift-cards", "icon": "🎁"},
]


async def seed_all():
    """Seed all data into MongoDB"""
    print("=" * 60)
    print("SEEDING ALL DATA FOR THE DOGGY COMPANY")
    print("=" * 60)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    now = datetime.now(timezone.utc).isoformat()
    
    try:
        # 1. Seed Products
        print("\n📦 Seeding Products...")
        await db.products_master.delete_many({})
        for p in SAMPLE_PRODUCTS:
            p["created_at"] = now
            p["updated_at"] = now
        result = await db.products_master.insert_many(SAMPLE_PRODUCTS)
        print(f"   ✅ Seeded {len(result.inserted_ids)} products")
        
        # 2. Seed Categories
        print("\n📂 Seeding Categories...")
        await db.categories.delete_many({})
        for c in CATEGORIES:
            c["created_at"] = now
        result = await db.categories.insert_many(CATEGORIES)
        print(f"   ✅ Seeded {len(result.inserted_ids)} categories")
        
        # 3. Seed Dine Bundles
        print("\n🍽️ Seeding Dine Bundles...")
        await db.dine_bundles.delete_many({})
        for b in DINE_BUNDLES:
            b["created_at"] = now
            b["updated_at"] = now
        result = await db.dine_bundles.insert_many(DINE_BUNDLES)
        print(f"   ✅ Seeded {len(result.inserted_ids)} dine bundles")
        
        # 4. Seed Restaurants (Dine Properties)
        print("\n🏪 Seeding Restaurants...")
        await db.dine_properties.delete_many({})
        for r in DINE_RESTAURANTS:
            r["created_at"] = now
            r["updated_at"] = now
        result = await db.dine_properties.insert_many(DINE_RESTAURANTS)
        print(f"   ✅ Seeded {len(result.inserted_ids)} restaurants")
        
        # 5. Seed Stay Properties
        print("\n🏨 Seeding Stay Properties...")
        await db.stay_properties.delete_many({})
        seeded_stays = 0
        for hotel_data in INDIA_PET_FRIENDLY_HOTELS:
            paw = hotel_data.get("paw_rating", {})
            scores = [paw.get("comfort", 0), paw.get("safety", 0), paw.get("freedom", 0),
                      paw.get("care", 0), paw.get("joy", 0)]
            valid_scores = [s for s in scores if s > 0]
            overall = round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else 0
            
            property_doc = {
                "id": f"stay-{uuid.uuid4().hex[:12]}",
                "name": hotel_data.get("name"),
                "property_type": hotel_data.get("property_type", "resort"),
                "city": hotel_data.get("city"),
                "area": hotel_data.get("area"),
                "state": hotel_data.get("state"),
                "country": "India",
                "description": hotel_data.get("description", ""),
                "highlights": hotel_data.get("highlights", []),
                "vibe_tags": hotel_data.get("vibe_tags", []),
                "photos": hotel_data.get("photos", []),
                "website": hotel_data.get("website"),
                "pet_policy": hotel_data.get("pet_policy", {}),
                "pet_policy_snapshot": hotel_data.get("pet_policy_snapshot", ""),
                "paw_rating": {**paw, "overall": overall},
                "badges": hotel_data.get("badges", []),
                "room_categories": hotel_data.get("room_categories", []),
                "human_amenities": hotel_data.get("human_amenities", []),
                "status": "live",
                "featured": hotel_data.get("featured", False),
                "verified": True,
                "created_at": now,
                "updated_at": now
            }
            await db.stay_properties.insert_one(property_doc)
            seeded_stays += 1
        print(f"   ✅ Seeded {seeded_stays} stay properties")
        
        # 6. Seed Celebrate Bundles
        print("\n🎉 Seeding Celebrate Bundles...")
        await db.celebrate_bundles.delete_many({})
        for b in CELEBRATE_BUNDLES:
            b["created_at"] = now
            b["updated_at"] = now
        result = await db.celebrate_bundles.insert_many(CELEBRATE_BUNDLES)
        print(f"   ✅ Seeded {len(result.inserted_ids)} celebrate bundles")
        
        # 7. Seed Blog Posts
        print("\n📝 Seeding Blog Posts...")
        await db.blog_posts.delete_many({})
        for b in BLOG_POSTS:
            b["created_at"] = now
            b["updated_at"] = now
        result = await db.blog_posts.insert_many(BLOG_POSTS)
        print(f"   ✅ Seeded {len(result.inserted_ids)} blog posts")
        
        # Print final summary
        print("\n" + "=" * 60)
        print("SEEDING COMPLETE - COLLECTION COUNTS:")
        print("=" * 60)
        collections = ['products', 'categories', 'dine_bundles', 'dine_properties', 
                       'stay_properties', 'celebrate_bundles', 'blog_posts']
        for coll in collections:
            count = await db[coll].count_documents({})
            print(f"   {coll}: {count}")
        
        print("\n✅ All data seeded successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_all())
