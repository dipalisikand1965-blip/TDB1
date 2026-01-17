"""
Restaurant Discovery and Auto-Populate Module
Scrapes and processes dog-friendly restaurant data
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import re
import httpx
import json

# Database reference
db = None
verify_admin = None

def set_restaurant_scraper_db(database):
    global db
    db = database

def set_restaurant_scraper_admin(verify_func):
    global verify_admin
    verify_admin = verify_func

router = APIRouter(prefix="/api/admin/restaurants/discover", tags=["Restaurant Discovery"])

# ==================== MODELS ====================

class RestaurantSuggestion(BaseModel):
    name: str
    location: str
    address: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    cuisine: Optional[str] = None
    price_range: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    google_maps_url: Optional[str] = None
    features: Optional[List[str]] = []
    source: str = "manual"

class BulkImportRequest(BaseModel):
    restaurants: List[RestaurantSuggestion]

# ==================== SAMPLE DATA ====================
# Pre-populated list of known dog-friendly restaurants in Bangalore
# This serves as seed data for MVP launch

BANGALORE_DOG_CAFES = [
    {
        "name": "Third Wave Coffee Roasters",
        "location": "Koramangala, Bangalore",
        "address": "77, 80 Feet Rd, KHB Colony, 5th Block, Koramangala",
        "cuisine": "Cafe, Coffee",
        "rating": 4.5,
        "price_range": "mid",
        "features": ["Outdoor seating", "Pet-friendly", "Water bowls"],
        "pet_policy": "Dogs allowed in outdoor area"
    },
    {
        "name": "Cafe Azzure",
        "location": "Indiranagar, Bangalore",
        "address": "2965, 12th Main, HAL 2nd Stage, Indiranagar",
        "cuisine": "Continental, European",
        "rating": 4.3,
        "price_range": "mid",
        "features": ["Pet-friendly patio", "Water bowls", "Pet menu"],
        "pet_policy": "Small to medium dogs welcome"
    },
    {
        "name": "The Permit Room",
        "location": "Koramangala, Bangalore",
        "address": "26/1, 6th Cross, KHB Colony, 5th Block, Koramangala",
        "cuisine": "South Indian, Bar",
        "rating": 4.4,
        "price_range": "mid",
        "features": ["Outdoor seating", "Pet-friendly"],
        "pet_policy": "Pets allowed on terrace"
    },
    {
        "name": "Brahmin's Coffee Bar",
        "location": "Basavanagudi, Bangalore",
        "address": "Ranga Rao Road, Shankarapuram, Basavanagudi",
        "cuisine": "South Indian, Vegetarian",
        "rating": 4.6,
        "price_range": "budget",
        "features": ["Street-side seating", "Pet-friendly"],
        "pet_policy": "Open area, dogs welcome"
    },
    {
        "name": "Glen's Bakehouse",
        "location": "Indiranagar, Bangalore",
        "address": "855, 6th Cross Rd, HAL 2nd Stage, Indiranagar",
        "cuisine": "Bakery, Cafe",
        "rating": 4.4,
        "price_range": "mid",
        "features": ["Outdoor seating", "Pet-friendly", "Water bowls"],
        "pet_policy": "Dogs allowed outside"
    },
    {
        "name": "Hole in the Wall Cafe",
        "location": "Koramangala, Bangalore",
        "address": "4, 100 Feet Rd, 4th Block, Koramangala",
        "cuisine": "Continental, Cafe",
        "rating": 4.3,
        "price_range": "mid",
        "features": ["Outdoor seating", "Pet-friendly ambiance"],
        "pet_policy": "Pet-friendly outdoor area"
    },
    {
        "name": "Cafe Papaya",
        "location": "Jayanagar, Bangalore",
        "address": "35th Cross, 4th Block, Jayanagar",
        "cuisine": "Multi-cuisine",
        "rating": 4.2,
        "price_range": "mid",
        "features": ["Garden seating", "Pet-friendly"],
        "pet_policy": "Dogs welcome in garden"
    },
    {
        "name": "Arbor Brewing Company",
        "location": "Whitefield, Bangalore",
        "address": "EPIP Zone, Whitefield",
        "cuisine": "Brewery, American",
        "rating": 4.5,
        "price_range": "premium",
        "features": ["Large outdoor area", "Pet-friendly"],
        "pet_policy": "Dogs allowed in outdoor brewing area"
    },
    {
        "name": "Windmills Craftworks",
        "location": "Whitefield, Bangalore",
        "address": "EPIP Zone Phase 2, Whitefield",
        "cuisine": "Brewery, Continental",
        "rating": 4.4,
        "price_range": "premium",
        "features": ["Spacious outdoors", "Pet-friendly", "Live music"],
        "pet_policy": "Pet-friendly in outdoor sections"
    },
    {
        "name": "Toit Brewpub",
        "location": "Indiranagar, Bangalore",
        "address": "298, 100 Feet Road, Indiranagar",
        "cuisine": "Brewery, Multi-cuisine",
        "rating": 4.5,
        "price_range": "premium",
        "features": ["Rooftop", "Pet-friendly events"],
        "pet_policy": "Dogs allowed during certain hours"
    },
    {
        "name": "Coffee on Canvas",
        "location": "JP Nagar, Bangalore",
        "address": "2nd Phase, JP Nagar",
        "cuisine": "Cafe, Art Gallery",
        "rating": 4.3,
        "price_range": "mid",
        "features": ["Art cafe", "Pet-friendly", "Garden"],
        "pet_policy": "Pet-friendly outdoor area"
    },
    {
        "name": "Cubbon Pavilion",
        "location": "MG Road, Bangalore",
        "address": "ITC Gardenia, 1 Residency Road",
        "cuisine": "Multi-cuisine, Fine Dining",
        "rating": 4.6,
        "price_range": "premium",
        "features": ["5-star hotel", "Garden seating"],
        "pet_policy": "Small pets in garden area only"
    },
    {
        "name": "Byg Brewski",
        "location": "Hennur, Bangalore",
        "address": "Hennur Main Road, Kalyan Nagar",
        "cuisine": "Brewery, Continental",
        "rating": 4.4,
        "price_range": "premium",
        "features": ["Massive outdoor space", "Pet-friendly", "Live sports"],
        "pet_policy": "Dogs welcome in outdoor area"
    },
    {
        "name": "Pebble",
        "location": "Ulsoor, Bangalore",
        "address": "131, St Marks Rd, Ashok Nagar",
        "cuisine": "Japanese, Asian",
        "rating": 4.3,
        "price_range": "premium",
        "features": ["Terrace", "Pet-friendly"],
        "pet_policy": "Pets allowed on terrace"
    },
    {
        "name": "Smoke House Deli",
        "location": "Indiranagar, Bangalore",
        "address": "1st Floor, 2829, 80 Feet Rd, HAL 3rd Stage",
        "cuisine": "European, Deli",
        "rating": 4.4,
        "price_range": "mid",
        "features": ["Brunch spot", "Pet-friendly outdoor"],
        "pet_policy": "Dogs in outdoor seating"
    },
    {
        "name": "Cafe Max",
        "location": "HSR Layout, Bangalore",
        "address": "27th Main Road, HSR Layout Sector 1",
        "cuisine": "Cafe, Continental",
        "rating": 4.2,
        "price_range": "budget",
        "features": ["Cozy cafe", "Pet-friendly"],
        "pet_policy": "Small pets welcome"
    },
    {
        "name": "Vino 66",
        "location": "Koramangala, Bangalore",
        "address": "66, 5th Cross, 5th Block, Koramangala",
        "cuisine": "Wine Bar, Continental",
        "rating": 4.3,
        "price_range": "premium",
        "features": ["Wine bar", "Pet-friendly terrace"],
        "pet_policy": "Dogs on terrace"
    },
    {
        "name": "Sanchez",
        "location": "Church Street, Bangalore",
        "address": "62, Church Street",
        "cuisine": "Mexican",
        "rating": 4.4,
        "price_range": "mid",
        "features": ["Outdoor seating", "Pet-friendly"],
        "pet_policy": "Pet-friendly outdoor"
    },
    {
        "name": "Koshys",
        "location": "St Marks Road, Bangalore",
        "address": "39, St Marks Road",
        "cuisine": "Indian, Continental",
        "rating": 4.5,
        "price_range": "mid",
        "features": ["Heritage restaurant", "Open layout"],
        "pet_policy": "Dogs in certain sections"
    },
    {
        "name": "Cafe Terra",
        "location": "Sadashivanagar, Bangalore",
        "address": "Palace Road, Sadashivanagar",
        "cuisine": "Mediterranean, Continental",
        "rating": 4.4,
        "price_range": "premium",
        "features": ["Garden restaurant", "Pet-friendly"],
        "pet_policy": "Dogs welcome in garden"
    }
]

# ==================== ROUTES ====================

@router.get("/suggestions")
async def get_restaurant_suggestions(
    city: str = "Bangalore",
    limit: int = 20,
    username: str = Depends(lambda: verify_admin)
):
    """Get pre-curated list of dog-friendly restaurants for a city"""
    
    if city.lower() in ["bangalore", "bengaluru"]:
        return {
            "city": city,
            "restaurants": BANGALORE_DOG_CAFES[:limit],
            "total": len(BANGALORE_DOG_CAFES),
            "source": "curated"
        }
    
    return {
        "city": city,
        "restaurants": [],
        "total": 0,
        "message": f"No pre-curated data for {city}. Please add manually or import from CSV."
    }

@router.post("/import")
async def import_restaurants(
    data: BulkImportRequest,
    username: str = Depends(lambda: verify_admin)
):
    """Import multiple restaurants at once"""
    
    imported = 0
    skipped = 0
    now = datetime.now(timezone.utc).isoformat()
    
    for restaurant in data.restaurants:
        # Check if already exists
        existing = await db.restaurants.find_one({
            "name": {"$regex": f"^{re.escape(restaurant.name)}$", "$options": "i"},
            "location": {"$regex": restaurant.location, "$options": "i"}
        })
        
        if existing:
            skipped += 1
            continue
        
        restaurant_doc = {
            "id": f"rest-{uuid.uuid4().hex[:8]}",
            "name": restaurant.name,
            "location": restaurant.location,
            "address": restaurant.address or "",
            "cuisine": restaurant.cuisine or "Pet-Friendly",
            "rating": restaurant.rating or 0,
            "reviews": restaurant.review_count or 0,
            "price_range": restaurant.price_range or "mid",
            "pet_friendly": True,
            "features": restaurant.features or [],
            "image": None,
            "images": [],
            "description": f"Pet-friendly restaurant in {restaurant.location}",
            "contact": {
                "phone": restaurant.phone,
                "website": restaurant.website
            },
            "google_maps_url": restaurant.google_maps_url,
            "source": restaurant.source,
            "status": "active",
            "verified": False,
            "created_at": now,
            "updated_at": now
        }
        
        await db.restaurants.insert_one(restaurant_doc)
        imported += 1
    
    return {
        "imported": imported,
        "skipped": skipped,
        "message": f"Imported {imported} restaurants, skipped {skipped} duplicates"
    }

@router.post("/seed-bangalore")
async def seed_bangalore_restaurants(username: str = Depends(lambda: verify_admin)):
    """Seed the database with curated Bangalore dog-friendly restaurants"""
    
    imported = 0
    skipped = 0
    now = datetime.now(timezone.utc).isoformat()
    
    for restaurant in BANGALORE_DOG_CAFES:
        # Check if already exists
        existing = await db.restaurants.find_one({
            "name": {"$regex": f"^{re.escape(restaurant['name'])}$", "$options": "i"}
        })
        
        if existing:
            skipped += 1
            continue
        
        restaurant_doc = {
            "id": f"rest-{uuid.uuid4().hex[:8]}",
            "name": restaurant["name"],
            "location": restaurant["location"],
            "address": restaurant.get("address", ""),
            "cuisine": restaurant.get("cuisine", "Pet-Friendly"),
            "rating": restaurant.get("rating", 0),
            "reviews": 0,
            "price_range": restaurant.get("price_range", "mid"),
            "pet_friendly": True,
            "features": restaurant.get("features", []),
            "pet_policy": restaurant.get("pet_policy", ""),
            "image": None,
            "images": [],
            "description": f"{restaurant['name']} - {restaurant.get('pet_policy', 'Pet-friendly establishment')}",
            "contact": {},
            "source": "curated_seed",
            "status": "active",
            "verified": True,
            "created_at": now,
            "updated_at": now
        }
        
        await db.restaurants.insert_one(restaurant_doc)
        imported += 1
    
    return {
        "imported": imported,
        "skipped": skipped,
        "total_available": len(BANGALORE_DOG_CAFES),
        "message": f"Seeded {imported} Bangalore restaurants"
    }

@router.get("/stats")
async def get_restaurant_stats(username: str = Depends(lambda: verify_admin)):
    """Get restaurant statistics by city"""
    
    pipeline = [
        {"$group": {
            "_id": "$location",
            "count": {"$sum": 1},
            "verified": {"$sum": {"$cond": ["$verified", 1, 0]}},
            "avg_rating": {"$avg": "$rating"}
        }},
        {"$sort": {"count": -1}}
    ]
    
    stats = await db.restaurants.aggregate(pipeline).to_list(50)
    total = await db.restaurants.count_documents({})
    
    return {
        "total_restaurants": total,
        "by_location": stats
    }
