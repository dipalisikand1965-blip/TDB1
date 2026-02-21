"""
Breed-Aware Product & Service Catalogue System
===============================================
Structured catalogues for Mira's personalization engine.

Naming Convention: [Who it's for] · [What it is] · [Why it fits]
Examples:
  - Large Breed · Celebration Bandana · Birthday Edition
  - Power Chewer · Rope Toy · Extra Durable
  - Short Coat · Grooming Brush · Gentle Finish
"""

from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import uuid
import logging

# Initialize router
router = APIRouter(prefix="/api/breed-catalogue", tags=["Breed Catalogue"])

# Database connection (will be set from main server)
db = None

def set_database(database):
    global db
    db = database


# ============================================
# PYDANTIC MODELS
# ============================================

class BreedTag(BaseModel):
    """Tag structure for breed-based filtering"""
    breeds: List[str] = Field(default_factory=list, description="Applicable breeds (empty = all breeds)")
    sizes: List[str] = Field(default_factory=list, description="S, M, L, XL or specific weights")
    age_groups: List[str] = Field(default_factory=list, description="puppy, adult, senior")
    coat_types: List[str] = Field(default_factory=list, description="short, medium, long, double, wire, curly")
    chew_strength: Optional[str] = Field(None, description="soft, medium, power_chewer")
    energy_level: Optional[str] = Field(None, description="calm, moderate, active, high_energy")
    temperament: List[str] = Field(default_factory=list, description="anxious, friendly, protective, playful")
    sensitivities: List[str] = Field(default_factory=list, description="allergy_safe, grain_free, hypoallergenic")


class BreedProduct(BaseModel):
    """Breed-aware product for cross-pillar use"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Naming: [Who] · [What] · [Why]
    name: str = Field(..., description="Full structured name")
    who_for: str = Field(..., description="Target audience (e.g., 'Large Breed', 'Power Chewer')")
    what_is: str = Field(..., description="Product type (e.g., 'Rope Toy', 'Bandana')")
    why_fits: str = Field(..., description="Qualifier (e.g., 'Extra Durable', 'Birthday Edition')")
    
    short_description: str = Field(...)
    long_description: Optional[str] = None
    
    # Images
    images: List[str] = Field(default_factory=list, description="Min 2 images recommended")
    primary_image: Optional[str] = None
    
    # Categorization
    category: str = Field(..., description="toys, accessories, bandanas, cups_merch, clothes, celebration_addons, cross_pillar")
    sub_category: Optional[str] = None
    pillars: List[str] = Field(default_factory=list, description="Applicable pillars: celebrate, dine, stay, travel, care, enjoy, fit")
    
    # Breed-aware tags
    breed_tags: BreedTag = Field(default_factory=BreedTag)
    
    # Pricing
    price: float = Field(..., ge=0)
    compare_price: Optional[float] = None
    pricing_model: str = Field("fixed", description="fixed, from, size_based, custom")
    
    # Inventory
    sku: str = Field(default_factory=lambda: f"BP-{uuid.uuid4().hex[:8].upper()}")
    vendor: Optional[str] = None
    in_stock: bool = True
    stock_quantity: Optional[int] = None
    
    # AI-generated
    mira_hint: Optional[str] = Field(None, description="AI-generated recommendation hint")
    ai_tags: List[str] = Field(default_factory=list, description="AI-generated searchable tags")
    
    # Metadata
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BreedService(BaseModel):
    """Breed-aware service for Mira recommendations"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Naming: [Who] · [What] · [Why]
    name: str = Field(..., description="Full structured name")
    who_for: str = Field(..., description="Target audience")
    what_is: str = Field(..., description="Service type")
    why_fits: str = Field(..., description="Qualifier")
    
    short_description: str = Field(...)
    long_description: Optional[str] = None
    
    # Images
    images: List[str] = Field(default_factory=list)
    icon: Optional[str] = None
    
    # Categorization
    category: str = Field(..., description="grooming, training, walking_sitting, travel_handling, celebration_support, care_support")
    sub_category: Optional[str] = None
    pillars: List[str] = Field(default_factory=list)
    
    # Breed-aware tags
    breed_tags: BreedTag = Field(default_factory=BreedTag)
    
    # Service specifics
    handled_by_mira: bool = Field(True, description="Default: Mira handles coordination")
    duration_minutes: Optional[int] = None
    
    # Pricing
    pricing_model: str = Field("depends", description="fixed, from, size_based, city_based, depends")
    base_price: Optional[float] = None
    price_from: Optional[float] = None
    price_note: Optional[str] = Field(None, description="e.g., 'Depends on coat type'")
    
    # Availability
    cities: List[str] = Field(default_factory=list, description="Available cities")
    coverage_note: Optional[str] = None
    
    # AI-generated
    mira_hint: Optional[str] = None
    ai_tags: List[str] = Field(default_factory=list)
    
    # Metadata
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BreedRecommendationRequest(BaseModel):
    """Request for breed-based recommendations"""
    breed: str
    size: Optional[str] = None
    age: Optional[str] = None
    coat_type: Optional[str] = None
    energy_level: Optional[str] = None
    sensitivities: List[str] = Field(default_factory=list)
    pillar: Optional[str] = None
    category: Optional[str] = None
    limit: int = Field(10, ge=1, le=50)


# ============================================
# BREED INTELLIGENCE
# ============================================

# Comprehensive breed database for matching
BREED_PROFILES = {
    "Indie": {
        "aliases": ["Indian Pariah", "Desi Dog", "Street Dog", "Native Indian"],
        "size": "M",
        "weight_range": "15-25 kg",
        "coat_type": "short",
        "energy_level": "active",
        "temperament": ["intelligent", "alert", "independent", "loyal"],
        "common_needs": ["heat_resistant", "outdoor_friendly", "low_maintenance"],
        "chew_tendency": "medium",
        "grooming_level": "low"
    },
    "Golden Retriever": {
        "aliases": ["Golden", "Goldie"],
        "size": "L",
        "weight_range": "25-35 kg",
        "coat_type": "long",
        "energy_level": "active",
        "temperament": ["friendly", "playful", "gentle", "eager_to_please"],
        "common_needs": ["regular_grooming", "exercise", "swimming"],
        "chew_tendency": "medium",
        "grooming_level": "high"
    },
    "Labrador": {
        "aliases": ["Lab", "Labrador Retriever"],
        "size": "L",
        "weight_range": "25-35 kg",
        "coat_type": "short",
        "energy_level": "high_energy",
        "temperament": ["friendly", "outgoing", "playful", "food_motivated"],
        "common_needs": ["exercise", "mental_stimulation", "weight_management"],
        "chew_tendency": "power_chewer",
        "grooming_level": "medium"
    },
    "Beagle": {
        "aliases": [],
        "size": "M",
        "weight_range": "10-15 kg",
        "coat_type": "short",
        "energy_level": "active",
        "temperament": ["curious", "friendly", "merry", "scent_driven"],
        "common_needs": ["secure_outdoor", "mental_stimulation", "scent_games"],
        "chew_tendency": "medium",
        "grooming_level": "low"
    },
    "Maltese": {
        "aliases": [],
        "size": "S",
        "weight_range": "3-4 kg",
        "coat_type": "long",
        "energy_level": "moderate",
        "temperament": ["gentle", "playful", "affectionate", "alert"],
        "common_needs": ["regular_grooming", "dental_care", "gentle_handling"],
        "chew_tendency": "soft",
        "grooming_level": "high"
    },
    "Maltipoo": {
        "aliases": ["Maltese Poodle Mix"],
        "size": "S",
        "weight_range": "3-6 kg",
        "coat_type": "curly",
        "energy_level": "moderate",
        "temperament": ["affectionate", "intelligent", "playful"],
        "common_needs": ["regular_grooming", "mental_stimulation", "hypoallergenic_friendly"],
        "chew_tendency": "soft",
        "grooming_level": "high"
    },
    "Shih Tzu": {
        "aliases": ["Shihtzu", "Shih-Tzu"],
        "size": "S",
        "weight_range": "4-7 kg",
        "coat_type": "long",
        "energy_level": "calm",
        "temperament": ["affectionate", "outgoing", "alert", "loyal"],
        "common_needs": ["regular_grooming", "cool_environment", "gentle_exercise"],
        "chew_tendency": "soft",
        "grooming_level": "high"
    }
}

def normalize_breed(breed_name: str) -> str:
    """Normalize breed name to standard form"""
    if not breed_name:
        return "Unknown"
    
    breed_lower = breed_name.strip().lower()
    
    # Direct matches
    for standard_name, profile in BREED_PROFILES.items():
        if breed_lower == standard_name.lower():
            return standard_name
        for alias in profile.get("aliases", []):
            if breed_lower == alias.lower():
                return standard_name
    
    # Partial matches
    for standard_name, profile in BREED_PROFILES.items():
        if standard_name.lower() in breed_lower or breed_lower in standard_name.lower():
            return standard_name
    
    return breed_name.strip()


def get_breed_profile(breed_name: str) -> dict:
    """Get breed profile with defaults for unknown breeds"""
    normalized = normalize_breed(breed_name)
    
    if normalized in BREED_PROFILES:
        return BREED_PROFILES[normalized]
    
    # Default profile for unknown breeds
    return {
        "size": "M",
        "coat_type": "medium",
        "energy_level": "moderate",
        "temperament": [],
        "common_needs": [],
        "chew_tendency": "medium",
        "grooming_level": "medium"
    }


# ============================================
# API ENDPOINTS - PRODUCTS
# ============================================

@router.get("/products")
async def get_breed_products(
    category: Optional[str] = None,
    pillar: Optional[str] = None,
    breed: Optional[str] = None,
    size: Optional[str] = None,
    age_group: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get breed-aware products with filtering"""
    query = {"is_active": True}
    
    if category:
        query["category"] = category
    if pillar:
        query["pillars"] = pillar
    if breed:
        normalized_breed = normalize_breed(breed)
        query["$or"] = [
            {"breed_tags.breeds": {"$size": 0}},  # Universal products
            {"breed_tags.breeds": normalized_breed}
        ]
    if size:
        query["$or"] = [
            {"breed_tags.sizes": {"$size": 0}},
            {"breed_tags.sizes": size}
        ]
    if age_group:
        query["$or"] = [
            {"breed_tags.age_groups": {"$size": 0}},
            {"breed_tags.age_groups": age_group}
        ]
    
    total = await db.breed_products.count_documents(query)
    products = await db.breed_products.find(query).skip(offset).limit(limit).to_list(limit)
    
    # Convert ObjectId to string
    for p in products:
        p["_id"] = str(p["_id"])
    
    return {
        "products": products,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/products/{product_id}")
async def get_breed_product(product_id: str):
    """Get single breed product by ID"""
    product = await db.breed_products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product["_id"] = str(product["_id"])
    return product


@router.post("/products")
async def create_breed_product(product: BreedProduct):
    """Create a new breed-aware product"""
    product_dict = product.model_dump()
    product_dict["created_at"] = datetime.now(timezone.utc)
    product_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.breed_products.insert_one(product_dict)
    return {"success": True, "product": product_dict}


@router.put("/products/{product_id}")
async def update_breed_product(product_id: str, updates: dict = Body(...)):
    """Update a breed product"""
    updates["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.breed_products.update_one(
        {"id": product_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "message": "Product updated"}


@router.delete("/products/{product_id}")
async def delete_breed_product(product_id: str):
    """Delete a breed product (soft delete)"""
    result = await db.breed_products.update_one(
        {"id": product_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "message": "Product deleted"}


# ============================================
# API ENDPOINTS - SERVICES
# ============================================

@router.get("/services")
async def get_breed_services(
    category: Optional[str] = None,
    pillar: Optional[str] = None,
    breed: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get breed-aware services with filtering"""
    query = {"is_active": True}
    
    if category:
        query["category"] = category
    if pillar:
        query["pillars"] = pillar
    if breed:
        normalized_breed = normalize_breed(breed)
        query["$or"] = [
            {"breed_tags.breeds": {"$size": 0}},
            {"breed_tags.breeds": normalized_breed}
        ]
    if city:
        query["$or"] = [
            {"cities": {"$size": 0}},  # Available everywhere
            {"cities": {"$regex": city, "$options": "i"}}
        ]
    
    total = await db.breed_services.count_documents(query)
    services = await db.breed_services.find(query).skip(offset).limit(limit).to_list(limit)
    
    for s in services:
        s["_id"] = str(s["_id"])
    
    return {
        "services": services,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/services/{service_id}")
async def get_breed_service(service_id: str):
    """Get single breed service by ID"""
    service = await db.breed_services.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    service["_id"] = str(service["_id"])
    return service


@router.post("/services")
async def create_breed_service(service: BreedService):
    """Create a new breed-aware service"""
    service_dict = service.model_dump()
    service_dict["created_at"] = datetime.now(timezone.utc)
    service_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.breed_services.insert_one(service_dict)
    return {"success": True, "service": service_dict}


@router.put("/services/{service_id}")
async def update_breed_service(service_id: str, updates: dict = Body(...)):
    """Update a breed service"""
    updates["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.breed_services.update_one(
        {"id": service_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"success": True, "message": "Service updated"}


@router.delete("/services/{service_id}")
async def delete_breed_service(service_id: str):
    """Delete a breed service (soft delete)"""
    result = await db.breed_services.update_one(
        {"id": service_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"success": True, "message": "Service deleted"}


# ============================================
# MIRA RECOMMENDATIONS ENGINE
# ============================================

@router.post("/recommend/for-pet")
async def get_recommendations_for_pet(request: BreedRecommendationRequest):
    """
    Get personalized product & service recommendations based on pet profile.
    This is Mira's brain for breed-aware suggestions.
    """
    breed_profile = get_breed_profile(request.breed)
    normalized_breed = normalize_breed(request.breed)
    
    # Build match criteria
    size = request.size or breed_profile.get("size", "M")
    coat_type = request.coat_type or breed_profile.get("coat_type", "medium")
    energy = request.energy_level or breed_profile.get("energy_level", "moderate")
    chew = breed_profile.get("chew_tendency", "medium")
    
    # Product query
    product_query = {
        "is_active": True,
        "$or": [
            {"breed_tags.breeds": {"$size": 0}},  # Universal
            {"breed_tags.breeds": normalized_breed}
        ]
    }
    
    if request.pillar:
        product_query["pillars"] = request.pillar
    if request.category:
        product_query["category"] = request.category
    
    # Fetch products
    products = await db.breed_products.find(product_query).limit(request.limit).to_list(request.limit)
    
    # Score products based on match quality
    scored_products = []
    for p in products:
        p["_id"] = str(p["_id"])
        score = 100  # Base score
        
        tags = p.get("breed_tags", {})
        
        # Breed match bonus
        if normalized_breed in tags.get("breeds", []):
            score += 30
        
        # Size match
        if size in tags.get("sizes", []) or not tags.get("sizes"):
            score += 15
        else:
            score -= 20
        
        # Age match
        if request.age and request.age in tags.get("age_groups", []):
            score += 15
        
        # Chew strength match (for toys)
        if p.get("category") == "toys":
            if tags.get("chew_strength") == chew:
                score += 20
            elif tags.get("chew_strength") == "power_chewer" and chew in ["medium", "soft"]:
                score += 10  # Durable is always good
        
        # Sensitivity match
        for sens in request.sensitivities:
            if sens in tags.get("sensitivities", []):
                score += 25
        
        scored_products.append({"product": p, "score": score})
    
    # Sort by score
    scored_products.sort(key=lambda x: x["score"], reverse=True)
    
    # Service query
    service_query = {
        "is_active": True,
        "$or": [
            {"breed_tags.breeds": {"$size": 0}},
            {"breed_tags.breeds": normalized_breed}
        ]
    }
    
    if request.pillar:
        service_query["pillars"] = request.pillar
    
    services = await db.breed_services.find(service_query).limit(request.limit).to_list(request.limit)
    
    # Score services
    scored_services = []
    for s in services:
        s["_id"] = str(s["_id"])
        score = 100
        
        tags = s.get("breed_tags", {})
        
        if normalized_breed in tags.get("breeds", []):
            score += 30
        
        # Coat type match for grooming
        if s.get("category") == "grooming":
            if coat_type in tags.get("coat_types", []):
                score += 25
        
        # Energy match for training/walking
        if s.get("category") in ["training", "walking_sitting"]:
            if energy in tags.get("energy_level", ""):
                score += 20
        
        scored_services.append({"service": s, "score": score})
    
    scored_services.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "breed": normalized_breed,
        "breed_profile": breed_profile,
        "products": [sp["product"] for sp in scored_products[:request.limit]],
        "services": [ss["service"] for ss in scored_services[:request.limit]],
        "recommendation_context": {
            "size": size,
            "coat_type": coat_type,
            "energy_level": energy,
            "chew_tendency": chew,
            "sensitivities": request.sensitivities
        }
    }


@router.get("/breed-profiles")
async def get_all_breed_profiles():
    """Get all known breed profiles"""
    return {
        "profiles": BREED_PROFILES,
        "count": len(BREED_PROFILES)
    }


@router.get("/breed-profile/{breed}")
async def get_single_breed_profile(breed: str):
    """Get profile for a specific breed"""
    normalized = normalize_breed(breed)
    profile = get_breed_profile(breed)
    
    return {
        "breed": normalized,
        "profile": profile,
        "normalized_from": breed
    }


# ============================================
# STATISTICS
# ============================================

@router.get("/stats")
async def get_catalogue_stats():
    """Get catalogue statistics"""
    product_count = await db.breed_products.count_documents({"is_active": True})
    service_count = await db.breed_services.count_documents({"is_active": True})
    
    # Get category breakdown
    product_categories = await db.breed_products.aggregate([
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]).to_list(50)
    
    service_categories = await db.breed_services.aggregate([
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]).to_list(50)
    
    return {
        "products": {
            "total": product_count,
            "by_category": {c["_id"]: c["count"] for c in product_categories}
        },
        "services": {
            "total": service_count,
            "by_category": {c["_id"]: c["count"] for c in service_categories}
        },
        "supported_breeds": list(BREED_PROFILES.keys())
    }


# ============================================
# AI-POWERED TAGGING & HINTS
# ============================================

async def generate_ai_product_hint(product: dict) -> str:
    """Generate AI-powered Mira hint for breed product"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    name = product.get("name", "")
    who = product.get("who_for", "")
    what = product.get("what_is", "")
    why = product.get("why_fits", "")
    desc = product.get("short_description", "")
    category = product.get("category", "")
    
    prompt = f"""You are Mira, a soulful pet concierge. Generate a SHORT, exciting product hint (max 10 words) for:

Product: {name}
Who it's for: {who}
What it is: {what}
Why it fits: {why}
Description: {desc}
Category: {category}

Rules:
- Start with ✨
- Max 10 words
- Be specific to THIS product
- Focus on the joy it brings
- Never generic ("great product", "perfect for")

Just the hint, nothing else."""

    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            return f"✨ {who}'s perfect {what}"
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"breed-hint-{product.get('id', 'unknown')}",
            system_message="You are Mira, a soulful pet concierge."
        )
        chat.with_model("openai", "gpt-4o-mini")
        chat.with_params(temperature=0.9, max_tokens=30)
        
        user_msg = UserMessage(text=prompt)
        response = await chat.send_message(user_msg)
        
        hint = response.strip()
        if not hint.startswith("✨"):
            hint = "✨ " + hint.lstrip("✨").strip()
        
        return hint[:60]
        
    except Exception as e:
        logging.error(f"[Breed AI Hint] Error: {e}")
        return f"✨ {who}'s perfect {what}"


async def generate_ai_tags(product: dict) -> List[str]:
    """Generate AI-powered searchable tags"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    name = product.get("name", "")
    desc = product.get("short_description", "")
    category = product.get("category", "")
    breed_tags = product.get("breed_tags", {})
    
    prompt = f"""Generate 5-8 searchable tags for this pet product:

Name: {name}
Description: {desc}
Category: {category}
Breeds: {breed_tags.get('breeds', [])}
Sizes: {breed_tags.get('sizes', [])}

Return ONLY a comma-separated list of lowercase tags. Focus on:
- Product type
- Use case
- Target pet traits
- Key benefits

Example: durable, large dog, tug, interactive, bonding, exercise"""

    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            return [category, product.get("who_for", "").lower()]
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"breed-tags-{product.get('id', 'unknown')}",
            system_message="You are a product tagging assistant."
        )
        chat.with_model("openai", "gpt-4o-mini")
        chat.with_params(temperature=0.3, max_tokens=50)
        
        user_msg = UserMessage(text=prompt)
        response = await chat.send_message(user_msg)
        
        tags = [t.strip().lower() for t in response.split(",") if t.strip()]
        return tags[:8]
        
    except Exception as e:
        logging.error(f"[Breed AI Tags] Error: {e}")
        return [category]


@router.post("/admin/auto-tag-products")
async def auto_tag_all_products():
    """Auto-generate AI hints and tags for all breed products"""
    import asyncio
    
    products = await db.breed_products.find({"is_active": True}).to_list(200)
    
    updated = 0
    for product in products:
        try:
            hint = await generate_ai_product_hint(product)
            tags = await generate_ai_tags(product)
            
            await db.breed_products.update_one(
                {"id": product["id"]},
                {"$set": {
                    "mira_hint": hint,
                    "ai_tags": tags,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            updated += 1
            
            # Rate limit
            await asyncio.sleep(0.3)
            
        except Exception as e:
            logging.error(f"[Auto-tag] Error on {product.get('name')}: {e}")
    
    return {
        "success": True,
        "message": f"Generated AI hints and tags for {updated} products",
        "updated": updated
    }


@router.post("/admin/auto-tag-services")
async def auto_tag_all_services():
    """Auto-generate AI hints for all breed services"""
    import asyncio
    
    services = await db.breed_services.find({"is_active": True}).to_list(100)
    
    updated = 0
    for service in services:
        try:
            # Similar hint generation for services
            who = service.get("who_for", "")
            what = service.get("what_is", "")
            hint = f"✨ {who}'s expert {what.lower()}"
            
            await db.breed_services.update_one(
                {"id": service["id"]},
                {"$set": {
                    "mira_hint": hint,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            updated += 1
            
        except Exception as e:
            logging.error(f"[Auto-tag Service] Error: {e}")
    
    return {
        "success": True,
        "message": f"Generated hints for {updated} services",
        "updated": updated
    }

