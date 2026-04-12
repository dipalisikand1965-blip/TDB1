"""
Product Routes for The Doggy Company
Handles public product listing, details, search, collections, and reviews
"""

import os
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
import secrets

logger = logging.getLogger(__name__)

# Create router
product_router = APIRouter(prefix="/api", tags=["Products"])

# Database and services references
db: AsyncIOMotorDatabase = None
search_service = None

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def set_search_service(service):
    global search_service
    search_service = service


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials"""
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


# ==================== MODELS ====================

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str
    reviewer_name: Optional[str] = None
    reviewer_email: Optional[str] = None
    title: Optional[str] = None
    image_url: Optional[str] = None


# ==================== PUBLIC PRODUCT ROUTES ====================
# NOTE: Main product routes are in server.py (api_router)
# The routes below are kept for reference but commented out to avoid conflicts
# In a future refactor, move server.py product routes here

# These routes are DISABLED - server.py has the comprehensive versions:
# - GET /products (server.py has pillar-aware, better search)
# - GET /products/{product_id}/related (server.py has pillar-aware recommendations)

# ==================== SEARCH ROUTES ====================

async def mongodb_fallback_search(
    q: str,
    limit: int = 20,
    offset: int = 0,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = None
):
    """Fallback search using MongoDB when Meilisearch is unavailable"""
    # Split query into words for better matching
    query_words = [w.strip() for w in q.lower().split() if w.strip()]
    
    # Build comprehensive OR conditions
    or_conditions = []
    
    # Full query match
    full_regex = {"$regex": q, "$options": "i"}
    or_conditions.extend([
        {"name": full_regex},
        {"description": full_regex},
        {"short_description": full_regex},
        {"long_description": full_regex},
    ])
    
    # Individual word matching across all searchable fields
    searchable_fields = [
        "name", "description", "short_description", "long_description",
        "category", "subcategory", "tags", "collections",
        "intelligent_tags.breed_tags", "intelligent_tags.health_tags",
        "intelligent_tags.occasion_tags", "intelligent_tags.diet_tags",
        "intelligent_tags.lifestage_tags", "intelligent_tags.size_tags",
        "breed_tags", "health_tags", "occasion_tags", "diet_tags",
        "lifestage_tags", "size_tags", "search_keywords"
    ]
    
    for word in query_words:
        word_regex = {"$regex": word, "$options": "i"}
        for field in searchable_fields:
            or_conditions.append({field: word_regex})
    
    query = {"$or": or_conditions}
    
    # Add filters
    if category:
        query["category"] = category
    if min_price is not None:
        query["$or"] = query.get("$or", [])
        query["pricing.base_price"] = {"$gte": min_price}
    if max_price is not None:
        if "pricing.base_price" in query:
            query["pricing.base_price"]["$lte"] = max_price
        else:
            query["pricing.base_price"] = {"$lte": max_price}
    
    # Search in BOTH products and unified_products collections
    products_from_unified = []
    products_from_legacy = []
    
    # Search unified_products (primary source)
    try:
        unified_total = await db.products_master.count_documents(query)
        unified_products = await db.products_master.find(
            query, {"_id": 0}
        ).sort("name", 1).skip(offset).limit(limit).to_list(limit)
        products_from_unified = unified_products
    except Exception as e:
        logger.warning(f"Error searching unified_products: {e}")
        unified_total = 0
    
    # Also search legacy products collection
    try:
        legacy_query = {"$or": or_conditions}
        if category:
            legacy_query["category"] = category
        legacy_products = await db.products_master.find(
            legacy_query, {"_id": 0}
        ).sort("name", 1).limit(limit - len(products_from_unified)).to_list(limit)
        products_from_legacy = legacy_products
    except Exception as e:
        logger.warning(f"Error searching products: {e}")
    
    # Combine and dedupe by name
    all_products = []
    seen_names = set()
    for p in products_from_unified + products_from_legacy:
        name = p.get("name", "").lower()
        if name not in seen_names:
            seen_names.add(name)
            all_products.append(p)
    
    # Sort by relevance (name match gets priority)
    def relevance_score(product):
        name = product.get("name", "").lower()
        score = 0
        if q.lower() in name:
            score += 100
        for word in query_words:
            if word in name:
                score += 50
        return score
    
    all_products.sort(key=relevance_score, reverse=True)
    
    return {
        "products": all_products[:limit],
        "hits": all_products[:limit],
        "query": q,
        "total": len(all_products),
        "estimatedTotalHits": unified_total + len(products_from_legacy),
        "limit": limit,
        "offset": offset,
        "fallback": True
    }


@product_router.get("/search")
async def search_products(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = None,
    collection_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    tags: Optional[str] = None,
    pan_india: Optional[bool] = None,
    autoship: Optional[bool] = None,
    sort: Optional[str] = Query(None, description="Sort by: price_asc, price_desc, name_asc, name_desc"),
):
    """Smart search endpoint with typo tolerance, filters, and faceted results"""
    # Use MongoDB fallback if Meilisearch is not available
    if not search_service or not search_service._initialized:
        return await mongodb_fallback_search(q, limit, offset, category, min_price, max_price, sort)

    filters = {}
    if category:
        filters["category"] = category
    if collection_id:
        filters["collection_id"] = collection_id
    if min_price is not None:
        filters["min_price"] = min_price
    if max_price is not None:
        filters["max_price"] = max_price
    if tags:
        filters["tags"] = tags.split(",")
    if pan_india:
        filters["is_pan_india"] = True
    if autoship:
        filters["autoship_enabled"] = True

    sort_options = None
    if sort:
        sort_map = {
            "price_asc": ["price:asc"],
            "price_desc": ["price:desc"],
            "name_asc": ["name:asc"],
            "name_desc": ["name:desc"],
        }
        sort_options = sort_map.get(sort)

    results = await search_service.search(
        query=q,
        limit=limit,
        offset=offset,
        filters=filters if filters else None,
        sort=sort_options,
    )

    return results


@product_router.get("/search/typeahead")
async def search_typeahead(
    q: str = Query(..., min_length=2, description="Search query for typeahead"),
    limit: int = Query(8, ge=1, le=20),
):
    """Fast typeahead search for autocomplete"""
    # Use MongoDB fallback if Meilisearch is not available
    if not search_service or not search_service._initialized:
        search_regex = {"$regex": q, "$options": "i"}
        
        # Search unified_products (primary) with more fields
        products = await db.products_master.find(
            {"$or": [
                {"name": search_regex}, 
                {"tags": search_regex}, 
                {"category": search_regex},
                {"intelligent_tags.breed_tags": search_regex},
                {"intelligent_tags.occasion_tags": search_regex},
                {"short_description": search_regex}
            ]},
            {"_id": 0, "id": 1, "name": 1, "image_url": 1, "images": 1, "pricing": 1, "category": 1, "has_variants": 1, "variants": 1, "options": 1}
        ).limit(limit).to_list(limit)
        
        # Also search legacy products collection for completeness
        if len(products) < limit:
            legacy_products = await db.products_master.find(
                {"$or": [{"name": search_regex}, {"tags": search_regex}, {"category": search_regex}]},
                {"_id": 0, "id": 1, "name": 1, "image": 1, "price": 1, "category": 1}
            ).limit(limit - len(products)).to_list(limit - len(products))
            
            # Dedupe by name
            existing_names = {p.get("name", "").lower() for p in products}
            for lp in legacy_products:
                if lp.get("name", "").lower() not in existing_names:
                    products.append(lp)
        
        # Normalize price field for frontend
        for p in products:
            if "pricing" in p and "base_price" in p.get("pricing", {}):
                p["price"] = p["pricing"]["base_price"]
            if "image_url" in p:
                p["image"] = p["image_url"]
            elif "images" in p and p["images"]:
                p["image"] = p["images"][0]
        
        collections = await db.collections.find(
            {"$or": [{"name": search_regex}, {"description": search_regex}]},
            {"_id": 0, "id": 1, "name": 1, "slug": 1, "image": 1}
        ).limit(4).to_list(4)
        
        return {"products": products, "collections": collections, "query": q, "fallback": True}

    results = await search_service.typeahead(query=q, limit=limit)
    return results


@product_router.get("/search/universal")
async def universal_search(
    q: str = Query(..., min_length=2, description="Universal search query"),
    limit: int = Query(10, ge=1, le=30),
):
    """
    Universal search - The Google of The Doggy Company.
    Searches across: Products, Pages, Pillars, Events, Restaurants, Services, FAQs, About content.
    """
    search_regex = {"$regex": q, "$options": "i"}
    q_lower = q.lower().strip()
    
    results = {
        "products": [],
        "pages": [],
        "pillars": [],
        "events": [],
        "restaurants": [],
        "services": [],
        "faqs": [],
        "query": q
    }
    
    # ==================== STATIC PAGE MATCHING ====================
    # Match common queries to pages
    page_mappings = {
        # About pages
        "about": {"name": "About Us", "url": "/about", "description": "Learn about The Doggy Company story", "type": "page", "icon": "info"},
        "about us": {"name": "About Us", "url": "/about", "description": "Our mission to make pet parenting joyful", "type": "page", "icon": "info"},
        "who is": {"name": "About Us", "url": "/about", "description": "Meet the team behind The Doggy Company", "type": "page", "icon": "info"},
        "what is td": {"name": "About Us", "url": "/about", "description": "The Doggy Company - Your Pet Life Operating System", "type": "page", "icon": "info"},
        "what is tdc": {"name": "About Us", "url": "/about", "description": "The Doggy Company - Complete pet parenting platform", "type": "page", "icon": "info"},
        "story": {"name": "Our Story", "url": "/about", "description": "How The Doggy Company began", "type": "page", "icon": "book"},
        "team": {"name": "Our Team", "url": "/about", "description": "Meet the pet lovers behind TDC", "type": "page", "icon": "users"},
        "contact": {"name": "Contact Us", "url": "/contact", "description": "Get in touch with our team", "type": "page", "icon": "phone"},
        "help": {"name": "Help Center", "url": "/help", "description": "FAQs and support resources", "type": "page", "icon": "help"},
        "faq": {"name": "FAQs", "url": "/help", "description": "Frequently asked questions", "type": "page", "icon": "help"},
        
        # Pillar pages
        "travel": {"name": "Travel Services", "url": "/travel", "description": "Pet relocation and travel assistance", "type": "pillar", "icon": "plane"},
        "dine": {"name": "Pet-Friendly Dining", "url": "/dine", "description": "Restaurants that welcome your furry friends", "type": "pillar", "icon": "utensils"},
        "restaurant": {"name": "Pet-Friendly Restaurants", "url": "/dine", "description": "Find places to dine with your pet", "type": "pillar", "icon": "utensils"},
        "stay": {"name": "Pet-Friendly Stays", "url": "/stay", "description": "Hotels and resorts for you and your pet", "type": "pillar", "icon": "home"},
        "hotel": {"name": "Pet-Friendly Hotels", "url": "/stay", "description": "Book pet-friendly accommodations", "type": "pillar", "icon": "home"},
        "adopt": {"name": "Adopt a Pet", "url": "/adopt", "description": "Find your perfect furry companion", "type": "pillar", "icon": "heart"},
        "adoption": {"name": "Pet Adoption", "url": "/adopt", "description": "Give a shelter pet a loving home", "type": "pillar", "icon": "heart"},
        "care": {"name": "Pet Care Services", "url": "/care", "description": "Veterinary and wellness services", "type": "pillar", "icon": "heart"},
        "vet": {"name": "Veterinary Care", "url": "/care", "description": "Find trusted vets near you", "type": "pillar", "icon": "stethoscope"},
        "groom": {"name": "Grooming Services", "url": "/groom", "description": "Professional pet grooming", "type": "pillar", "icon": "scissors"},
        "grooming": {"name": "Pet Grooming", "url": "/groom", "description": "Spa and grooming for your pet", "type": "pillar", "icon": "scissors"},
        "train": {"name": "Pet Training", "url": "/train", "description": "Professional training services", "type": "pillar", "icon": "award"},
        "training": {"name": "Dog Training", "url": "/train", "description": "Obedience and behavior training", "type": "pillar", "icon": "award"},
        "play": {"name": "Play & Activities", "url": "/play", "description": "Toys, games, and activities", "type": "pillar", "icon": "gamepad"},
        "toy": {"name": "Pet Toys", "url": "/play", "description": "Fun toys for your pet", "type": "pillar", "icon": "gamepad"},
        "event": {"name": "Pet Events", "url": "/enjoy", "description": "Meetups, parties, and experiences", "type": "pillar", "icon": "calendar"},
        "events": {"name": "Pet Events", "url": "/enjoy", "description": "Community events and meetups", "type": "pillar", "icon": "calendar"},
        "enjoy": {"name": "Pet Experiences", "url": "/enjoy", "description": "Events, meetups, and fun activities", "type": "pillar", "icon": "star"},
        "experience": {"name": "Pet Experiences", "url": "/enjoy", "description": "Unique experiences for pets and parents", "type": "pillar", "icon": "star"},
        "celebrate": {"name": "Celebrations", "url": "/celebrate", "description": "Cakes, treats, and party supplies", "type": "pillar", "icon": "cake"},
        "birthday": {"name": "Birthday Celebrations", "url": "/celebrate", "description": "Birthday cakes and party ideas", "type": "pillar", "icon": "cake"},
        "cake": {"name": "Pet Cakes", "url": "/celebrate", "description": "Delicious cakes for your furry friend", "type": "pillar", "icon": "cake"},
        "feed": {"name": "Pet Food", "url": "/feed", "description": "Premium food and nutrition", "type": "pillar", "icon": "bowl"},
        "food": {"name": "Pet Food", "url": "/feed", "description": "Healthy meals for your pet", "type": "pillar", "icon": "bowl"},
        "shop": {"name": "Pet Shop", "url": "/shop", "description": "Browse all pet products", "type": "pillar", "icon": "shopping"},
        "insure": {"name": "Pet Insurance", "url": "/insure", "description": "Protect your pet's health", "type": "pillar", "icon": "shield"},
        "insurance": {"name": "Pet Insurance", "url": "/insure", "description": "Insurance plans for pets", "type": "pillar", "icon": "shield"},
        "farewell": {"name": "Pet Memorial", "url": "/farewell", "description": "Compassionate end-of-life services", "type": "pillar", "icon": "heart"},
        "memorial": {"name": "Pet Memorial", "url": "/farewell", "description": "Honor your beloved companion", "type": "pillar", "icon": "heart"},
        "learn": {"name": "Pet Education", "url": "/learn", "description": "Guides, articles, and tips", "type": "pillar", "icon": "book"},
        "blog": {"name": "Pet Blog", "url": "/blog", "description": "Articles and pet parenting tips", "type": "pillar", "icon": "book"},
        "advisory": {"name": "Pet Advisory", "url": "/advisory", "description": "Expert pet advice and consultations", "type": "pillar", "icon": "lightbulb"},
        "advice": {"name": "Pet Advice", "url": "/advisory", "description": "Get expert guidance", "type": "pillar", "icon": "lightbulb"},
        "emergency": {"name": "Pet Emergency", "url": "/emergency", "description": "24/7 emergency pet services", "type": "pillar", "icon": "alert"},
        "paperwork": {"name": "Pet Paperwork", "url": "/paperwork", "description": "Documents and certificates", "type": "pillar", "icon": "file"},
        "documents": {"name": "Pet Documents", "url": "/paperwork", "description": "Manage pet records and papers", "type": "pillar", "icon": "file"},
        "fit": {"name": "Pet Fitness", "url": "/fit", "description": "Health and fitness for pets", "type": "pillar", "icon": "activity"},
        "fitness": {"name": "Pet Fitness", "url": "/fit", "description": "Exercise and wellness", "type": "pillar", "icon": "activity"},
        
        # Account pages  
        "account": {"name": "My Account", "url": "/dashboard", "description": "Manage your account and pets", "type": "page", "icon": "user"},
        "dashboard": {"name": "My Dashboard", "url": "/dashboard", "description": "Your personalized pet hub", "type": "page", "icon": "home"},
        "my pets": {"name": "My Pets", "url": "/my-pets", "description": "Manage your pet profiles", "type": "page", "icon": "paw"},
        "orders": {"name": "My Orders", "url": "/dashboard", "description": "Track your orders", "type": "page", "icon": "package"},
        "cart": {"name": "Shopping Cart", "url": "/cart", "description": "View your cart", "type": "page", "icon": "cart"},
        "checkout": {"name": "Checkout", "url": "/checkout", "description": "Complete your purchase", "type": "page", "icon": "credit-card"},
        
        # Autoship & Subscription
        "autoship": {"name": "Autoship & Save", "url": "/autoship", "description": "Subscribe for automatic deliveries & save up to 50%", "type": "page", "icon": "refresh"},
        "subscription": {"name": "Autoship Subscriptions", "url": "/autoship", "description": "Never run out of your pet's favorites", "type": "page", "icon": "refresh"},
        "subscribe": {"name": "Subscribe & Save", "url": "/autoship", "description": "Get automatic deliveries with discounts", "type": "page", "icon": "refresh"},
        "auto ship": {"name": "Autoship Program", "url": "/autoship", "description": "Set it once, spoil them always", "type": "page", "icon": "refresh"},
        "recurring": {"name": "Recurring Orders", "url": "/autoship", "description": "Automatic repeat deliveries", "type": "page", "icon": "refresh"},
    }
    
    # Check for page matches
    for key, page in page_mappings.items():
        if key in q_lower or q_lower in key:
            results["pages"].append(page)
    
    # Dedupe pages by URL
    seen_urls = set()
    unique_pages = []
    for page in results["pages"]:
        if page["url"] not in seen_urls:
            seen_urls.add(page["url"])
            unique_pages.append(page)
    results["pages"] = unique_pages[:5]
    
    # ==================== PRODUCT SEARCH ====================
    products = await db.products_master.find(
        {"$or": [
            {"name": search_regex},
            {"tags": search_regex},
            {"category": search_regex},
            {"intelligent_tags.breed_tags": search_regex},
            {"intelligent_tags.occasion_tags": search_regex},
            {"intelligent_tags.health_tags": search_regex},
            {"short_description": search_regex},
            {"search_keywords": search_regex}
        ]},
        {"_id": 0, "id": 1, "name": 1, "image_url": 1, "images": 1, "pricing": 1, "category": 1, 
         "has_variants": 1, "shopify_handle": 1, "primary_pillar": 1}
    ).limit(limit).to_list(limit)
    
    for p in products:
        p["type"] = "product"
        p["url"] = f"/product/{p.get('shopify_handle') or p.get('id')}"
        p["price"] = p.get("pricing", {}).get("base_price") or p.get("price")
        # Safely get image - handle empty images array
        images = p.get("images", [])
        p["image"] = p.get("image_url") or (images[0] if images else None)
    results["products"] = products
    
    # ==================== EVENT SEARCH ====================
    if any(word in q_lower for word in ["event", "meetup", "experience", "enjoy", "party", "gathering"]):
        events = await db.enjoy_experiences.find(
            {"$or": [{"name": search_regex}, {"description": search_regex}, {"experience_type": search_regex}]},
            {"_id": 0, "id": 1, "name": 1, "event_date": 1, "venue_name": 1, "price": 1, "image_url": 1}
        ).limit(5).to_list(5)
        
        for e in events:
            e["type"] = "event"
            e["url"] = f"/enjoy/{e.get('id')}"
            e["image"] = e.get("image_url")
        results["events"] = events
    
    # ==================== RESTAURANT SEARCH ====================
    if any(word in q_lower for word in ["restaurant", "dine", "dining", "eat", "food", "cafe", "pet friendly"]):
        restaurants = await db.restaurants.find(
            {"$or": [{"name": search_regex}, {"cuisine": search_regex}, {"location": search_regex}]},
            {"_id": 0, "id": 1, "name": 1, "cuisine": 1, "location": 1, "rating": 1, "image_url": 1, "pet_friendly_level": 1}
        ).limit(5).to_list(5)
        
        for r in restaurants:
            r["type"] = "restaurant"
            r["url"] = f"/dine/restaurant/{r.get('id')}"
            r["image"] = r.get("image_url")
        results["restaurants"] = restaurants
    
    # ==================== SERVICE SEARCH ====================
    if any(word in q_lower for word in ["vet", "groom", "train", "care", "service", "boarding", "walking", "sitting"]):
        services = await db.services_master.find(
            {"$or": [{"name": search_regex}, {"category": search_regex}, {"description": search_regex}]},
            {"_id": 0, "id": 1, "name": 1, "category": 1, "price_range": 1, "image_url": 1}
        ).limit(5).to_list(5)
        
        for s in services:
            s["type"] = "service"
            s["url"] = f"/{s.get('category', 'care')}"
            s["image"] = s.get("image_url")
        results["services"] = services
    
    # ==================== FAQ SEARCH ====================
    faqs = await db.faqs.find(
        {"$or": [{"question": search_regex}, {"answer": search_regex}]},
        {"_id": 0, "question": 1, "answer": 1, "category": 1}
    ).limit(3).to_list(3)
    
    for f in faqs:
        f["type"] = "faq"
        f["name"] = f.get("question", "")[:80]
        f["description"] = f.get("answer", "")[:150]
        f["url"] = "/help"
    results["faqs"] = faqs
    
    # ==================== ADOPT PETS SEARCH ====================
    if any(word in q_lower for word in ["adopt", "shelter", "rescue", "pet", "puppy", "kitten"]):
        adopt_pets = await db.adoptable_pets.find(
            {"$or": [{"name": search_regex}, {"breed": search_regex}, {"species": search_regex}]},
            {"_id": 0, "pet_id": 1, "name": 1, "breed": 1, "age": 1, "image_url": 1, "shelter_name": 1}
        ).limit(5).to_list(5)
        
        for pet in adopt_pets:
            pet["type"] = "adopt_pet"
            pet["url"] = f"/adopt/pet/{pet.get('pet_id')}"
            pet["image"] = pet.get("image_url")
            pet["description"] = f"{pet.get('breed', '')} • {pet.get('age', '')} • {pet.get('shelter_name', '')}"
        results["adopt_pets"] = adopt_pets
    
    return results


@product_router.get("/search/stats")
async def get_search_stats():
    """Get search index statistics"""
    if not search_service:
        return {"error": "Search service not available"}
    return await search_service.get_stats()


@product_router.post("/search/reindex")
async def reindex_search(credentials: HTTPBasicCredentials = Depends(security)):
    """Reindex all products in the search engine (admin only)"""
    verify_admin(credentials)

    products = await db.products_master.find({}, {"_id": 0}).to_list(7500)  # Reindex cap: prevents OOM

    if products:
        await search_service.index_products_batch(products)

    collections = await db.collections.find({}, {"_id": 0}).to_list(1000)
    if collections:
        await search_service.index_collections_batch(collections)

    return {
        "success": True,
        "products_indexed": len(products),
        "collections_indexed": len(collections)
    }


# ==================== COLLECTION ROUTES ====================

@product_router.get("/collections")
async def get_public_collections():
    """Get all collections (public)"""
    collections = await db.collections.find({}, {"_id": 0}).to_list(100)
    # Calculate product_count from product_ids
    for col in collections:
        col["product_count"] = len(col.get("product_ids", []))
    return {"collections": collections}


@product_router.get("/collections/{collection_id}")
async def get_collection(collection_id: str):
    """Get a specific collection with its products"""
    collection = await db.collections.find_one(
        {"$or": [{"id": collection_id}, {"handle": collection_id}]},
        {"_id": 0}
    )

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Get products in this collection
    product_ids = collection.get("product_ids", [])
    products = await db.products_master.find(
        {"id": {"$in": product_ids}},
        {"_id": 0}
    ).to_list(100)

    return {
        "collection": collection,
        "products": products
    }


# ==================== REVIEW ROUTES (PUBLIC) ====================

@product_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    """Get approved reviews for a product"""
    reviews = await db.reviews.find(
        {"product_id": product_id, "status": "approved"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    # Calculate stats
    if reviews:
        total = len(reviews)
        avg_rating = sum(r.get("rating", 0) for r in reviews) / total
        rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for r in reviews:
            rating = r.get("rating", 5)
            if rating in rating_dist:
                rating_dist[rating] += 1
    else:
        total = 0
        avg_rating = 0
        rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

    return {
        "reviews": reviews,
        "stats": {
            "total": total,
            "average_rating": round(avg_rating, 1),
            "rating_distribution": rating_dist
        }
    }


# NOTE: POST /api/reviews endpoint moved to review_routes.py (Phase 3 refactoring)
# The review_routes.py version includes admin notifications and user association


# ===== ADMIN IMAGE MANAGEMENT ENDPOINTS =====

class ProductImageUpdate(BaseModel):
    product_id: str
    image_url: str

class BulkImageUpdate(BaseModel):
    updates: List[ProductImageUpdate]

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials"""
    if not (secrets.compare_digest(credentials.username, ADMIN_USERNAME) and 
            secrets.compare_digest(credentials.password, ADMIN_PASSWORD)):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return credentials.username


@product_router.get("/admin/products/missing-images")
async def get_products_missing_images(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    admin: str = Depends(verify_admin)
):
    """Get products with missing or placeholder images"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Find products where image is missing, empty, or placeholder
    query = {
        "$or": [
            {"image_url": {"$exists": False}},
            {"image_url": None},
            {"image_url": ""},
            {"image": {"$exists": False}},
            {"image": None},
            {"image": ""},
            {"images": {"$size": 0}},
            {"images": {"$exists": False}}
        ]
    }
    
    total = await db.products.count_documents(query)
    products = await db.products.find(
        query, 
        {"_id": 0, "id": 1, "name": 1, "category": 1, "pillar": 1, "price": 1}
    ).skip(skip).limit(limit).to_list(length=limit)
    
    return {
        "total_missing": total,
        "products": products,
        "skip": skip,
        "limit": limit
    }


@product_router.put("/admin/products/update-image")
async def update_product_image(
    data: ProductImageUpdate,
    admin: str = Depends(verify_admin)
):
    """Update a single product's image"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    result = await db.products.update_one(
        {"id": data.product_id},
        {
            "$set": {
                "image_url": data.image_url,
                "image": data.image_url,
                "images": [data.image_url],
                "ai_generated_image": True,
                "image_updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "product_id": data.product_id, "image_url": data.image_url}


@product_router.put("/admin/products/bulk-update-images")
async def bulk_update_product_images(
    data: BulkImageUpdate,
    admin: str = Depends(verify_admin)
):
    """Bulk update multiple products' images"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    results = {"updated": 0, "failed": [], "success": []}
    
    for update in data.updates:
        try:
            result = await db.products.update_one(
                {"id": update.product_id},
                {
                    "$set": {
                        "image_url": update.image_url,
                        "image": update.image_url,
                        "images": [update.image_url],
                        "ai_generated_image": True,
                        "image_updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            if result.modified_count > 0:
                results["updated"] += 1
                results["success"].append(update.product_id)
            else:
                results["failed"].append({"id": update.product_id, "reason": "Not found"})
        except Exception as e:
            results["failed"].append({"id": update.product_id, "reason": str(e)})
    
    return results


@product_router.get("/admin/products/image-stats")
async def get_product_image_stats(admin: str = Depends(verify_admin)):
    """Get statistics about product images"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    total_products = await db.products.count_documents({})
    
    # Products with valid images
    with_images = await db.products.count_documents({
        "$and": [
            {"$or": [
                {"image_url": {"$exists": True, "$ne": None, "$ne": ""}},
                {"image": {"$exists": True, "$ne": None, "$ne": ""}},
                {"images.0": {"$exists": True}}
            ]}
        ]
    })
    
    # AI generated images
    ai_generated = await db.products.count_documents({"ai_generated_image": True})
    
    missing_images = total_products - with_images
    
    return {
        "total_products": total_products,
        "with_images": with_images,
        "missing_images": missing_images,
        "ai_generated_images": ai_generated,
        "coverage_percentage": round((with_images / total_products * 100) if total_products > 0 else 0, 1)
    }
