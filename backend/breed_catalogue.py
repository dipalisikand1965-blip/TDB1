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
        # Check breed_tags, breed_tags_full, who_for, AND direct breed field
        query["$or"] = [
            {"breed_tags": {"$size": 0}},                         # Universal products
            {"breed_tags": normalized_breed},                      # Simple list match
            {"breed_tags_full.breeds": normalized_breed},          # Full structure match
            {"who_for": {"$regex": breed, "$options": "i"}},       # who_for field
            {"breed": normalized_breed},                           # Direct breed field (flat art + new products)
        ]
    if size:
        query["$or"] = [
            {"breed_tags_full.sizes": {"$size": 0}},
            {"breed_tags_full.sizes": size}
        ]
    if age_group:
        query["$or"] = [
            {"breed_tags_full.age_groups": {"$size": 0}},
            {"breed_tags_full.age_groups": age_group}
        ]
    
    total = await db.breed_products.count_documents(query)
    products = await db.breed_products.find(query, {"_id": 0}).skip(offset).limit(limit).to_list(limit)
    
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



# ============================================
# SEED BREED-SPECIFIC PRODUCTS
# ============================================

# Top 20 dog breeds for personalized products
TOP_BREEDS = [
    # Most popular Indian breeds (36 total — updated Mar 2026)
    "Golden Retriever", "Labrador", "German Shepherd", "Beagle", "Shih Tzu",
    "Pug", "Rottweiler", "Doberman", "Husky", "Cocker Spaniel",
    "Boxer", "Poodle", "Dachshund", "French Bulldog", "Indie",
    "Great Dane", "Dalmatian", "Chihuahua", "Pomeranian", "Border Collie",
    "Bulldog", "Maltese", "Yorkshire Terrier", "Akita", "Saint Bernard",
    "Lhasa Apso", "Bichon Frise", "Corgi", "Samoyed", "Vizsla",
    "Weimaraner", "Basenji", "Alaskan Malamute",
    # Newly added (Mar 2026)
    "Maltipoo", "Indian Spitz", "Labradoodle",
]

# Product templates for each breed
BREED_PRODUCT_TEMPLATES = [
    {
        "what_is": "Birthday Cake",
        "why_fits": "Custom Design",
        "category": "breed-cakes",
        "pillars": ["celebrate"],
        "price": 1899,
        "description_template": "Celebrate your {breed}'s special day with this beautifully crafted birthday cake! Made with dog-safe ingredients and decorated with iconic {breed} features.",
        "mira_hint_template": "🎂 Perfect for {breed} birthdays! Customized with breed-specific design"
    },
    {
        "what_is": "Ceramic Mug",
        "why_fits": "Pet Parent Gift",
        "category": "cups_merch",
        "pillars": ["celebrate", "shop"],
        "price": 599,
        "description_template": "Show off your love for your {breed} with this stunning ceramic mug featuring beautiful breed artwork. Perfect for pet parents!",
        "mira_hint_template": "☕ Pet parent must-have! Beautiful {breed} artwork on premium ceramic"
    },
    {
        "what_is": "Designer Bandana",
        "why_fits": "Birthday Edition",
        "category": "bandanas",
        "pillars": ["celebrate", "shop"],
        "price": 399,
        "description_template": "Make your {breed} the star of the party with this stylish birthday bandana! Soft, comfortable, and adorably designed.",
        "mira_hint_template": "🎀 Party-ready! Stylish {breed} birthday bandana"
    },
    {
        "what_is": "Photo Frame",
        "why_fits": "Memorial Edition",
        "category": "accessories",
        "pillars": ["celebrate", "farewell"],
        "price": 799,
        "description_template": "Cherish every moment with your {breed} in this beautifully crafted photo frame. Features breed silhouette and custom engravings.",
        "mira_hint_template": "📷 Treasure memories! Custom {breed} photo frame"
    },
    {
        "what_is": "Treat Box",
        "why_fits": "Celebration Pack",
        "category": "celebration_addons",
        "pillars": ["celebrate"],
        "price": 699,
        "description_template": "Complete celebration pack for your {breed}! Includes breed-appropriate treats, mini cake, and party accessories.",
        "mira_hint_template": "🎁 Complete party pack! Everything for {breed}'s celebration"
    },
    {
        "what_is": "Canvas Print",
        "why_fits": "Art Collection",
        "category": "cups_merch",
        "pillars": ["celebrate", "shop"],
        "price": 1299,
        "description_template": "Beautiful canvas artwork featuring a majestic {breed} portrait. Museum-quality print that makes a stunning home decoration.",
        "mira_hint_template": "🎨 Wall art! Stunning {breed} portrait on premium canvas"
    },
    {
        "what_is": "Breed Keychain",
        "why_fits": "Accessory",
        "category": "accessories",
        "pillars": ["shop", "celebrate"],
        "price": 199,
        "description_template": "Cute {breed} shaped keychain - carry your love for your pet wherever you go! Premium metal with detailed breed features.",
        "mira_hint_template": "🔑 Pocket-sized love! Adorable {breed} keychain"
    },
    {
        "what_is": "Party Hat",
        "why_fits": "Birthday Special",
        "category": "celebration_addons",
        "pillars": ["celebrate"],
        "price": 249,
        "description_template": "The cutest party hat for your {breed}! Adjustable elastic strap ensures comfortable fit for birthday celebrations.",
        "mira_hint_template": "🎩 Party essential! Adorable {breed}-sized birthday hat"
    },
    # ── DINE ────────────────────────────────────────────────────────────────
    {
        "what_is": "Breed Food Mat",
        "why_fits": "Mealtime Essential",
        "category": "dine_accessories",
        "pillars": ["dine"],
        "price": 599,
        "soul_tier": "soul_made",
        "description_template": "A beautiful feeding mat designed for {breed}s — non-slip, easy-clean, and decorated with your dog's breed silhouette. Makes every mealtime special.",
        "mira_hint_template": "🍽 Mealtime joy! {breed}-illustrated feeding mat — non-slip & easy-clean"
    },
    {
        "what_is": "Breed Recipe Card",
        "why_fits": "Nutrition Guide",
        "category": "dine_accessories",
        "pillars": ["dine"],
        "price": 299,
        "soul_tier": "soul_selected",
        "description_template": "A personalised {breed} recipe card with Mira-curated meal ideas, feeding guidelines, and breed-specific nutritional notes.",
        "mira_hint_template": "📋 Nutrition sorted! {breed}-specific recipe guide curated by Mira"
    },
    {
        "what_is": "Breed Ceramic Bowl",
        "why_fits": "Personalised Feed",
        "category": "dine_accessories",
        "pillars": ["dine", "shop"],
        "price": 899,
        "soul_tier": "soul_made",
        "description_template": "Hand-painted {breed} ceramic bowl — the perfect feeding vessel for your dog. Dishwasher-safe with non-slip base.",
        "mira_hint_template": "🥣 Eat in style! Personalised {breed} ceramic bowl"
    },
    # ── CARE ────────────────────────────────────────────────────────────────
    {
        "what_is": "Breed Grooming Guide",
        "why_fits": "Care Essential",
        "category": "care_accessories",
        "pillars": ["care"],
        "price": 399,
        "soul_tier": "soul_selected",
        "description_template": "A complete {breed} grooming guide — coat type, tools, frequency, and Mira's breed-specific care tips. Printed and illustrated.",
        "mira_hint_template": "✂️ Grooming sorted! {breed}-specific care guide with Mira's tips"
    },
    {
        "what_is": "Breed Portrait Frame",
        "why_fits": "Vet Visit Companion",
        "category": "care_accessories",
        "pillars": ["care", "celebrate"],
        "price": 799,
        "soul_tier": "soul_made",
        "description_template": "A beautiful portrait frame designed for {breed}s — perfect for displaying at the vet or at home. Includes breed fact card.",
        "mira_hint_template": "🖼 Cherish your {breed}! Beautifully framed breed portrait"
    },
    {
        "what_is": "Breed Wellness Kit",
        "why_fits": "Health Essentials",
        "category": "care_accessories",
        "pillars": ["care"],
        "price": 1299,
        "soul_tier": "soul_selected",
        "description_template": "A curated wellness kit for {breed}s — includes breed-specific supplements, grooming tool, dental chew, and care schedule from Mira.",
        "mira_hint_template": "💊 Health first! {breed} wellness kit curated by Mira"
    },
    # ── GO (TRAVEL) ──────────────────────────────────────────────────────────
    {
        "what_is": "Breed Adventure Bandana",
        "why_fits": "Travel Identity",
        "category": "go_accessories",
        "pillars": ["go"],
        "price": 399,
        "soul_tier": "soul_made",
        "description_template": "Hit the trails in style — this adventure bandana is designed for {breed}s who love to explore. Soft, durable, and totally unique.",
        "mira_hint_template": "🌍 Adventure ready! {breed} explorer bandana for every journey"
    },
    {
        "what_is": "Breed Travel Tag",
        "why_fits": "Safety Essential",
        "category": "go_accessories",
        "pillars": ["go"],
        "price": 299,
        "soul_tier": "soul_made",
        "description_template": "A custom {breed} travel ID tag with your dog's name, breed, and emergency contact. Durable stainless steel with breed silhouette.",
        "mira_hint_template": "🏷 Travel safe! Custom {breed} ID tag for every adventure"
    },
    {
        "what_is": "Breed Trail Guide",
        "why_fits": "Adventure Companion",
        "category": "go_accessories",
        "pillars": ["go"],
        "price": 499,
        "soul_tier": "soul_selected",
        "description_template": "A personalised trail and travel guide for {breed}s — best parks, pet-friendly destinations, and Mira's adventure tips for your breed.",
        "mira_hint_template": "🗺 Explore more! {breed} adventure trail guide by Mira"
    },
    # ── PLAY ────────────────────────────────────────────────────────────────
    {
        "what_is": "Breed Play Bandana",
        "why_fits": "Play Identity",
        "category": "play_accessories",
        "pillars": ["play"],
        "price": 399,
        "soul_tier": "soul_made",
        "description_template": "Express your dog's play personality with this custom {breed} play bandana. Made for the dog park, the playdate, and every adventure in between.",
        "mira_hint_template": "🌳 Play in style! Custom {breed} play bandana"
    },
    {
        "what_is": "Breed Playdate Card",
        "why_fits": "Social Identity",
        "category": "play_accessories",
        "pillars": ["play"],
        "price": 299,
        "soul_tier": "soul_made",
        "description_template": "Make friends at the dog park — custom {breed} calling cards with your dog's name, photo slot, and playdate details. Set of 20.",
        "mira_hint_template": "🐾 Make friends! {breed} playdate cards — the coolest dog park accessory"
    },
    {
        "what_is": "Breed Activity Print",
        "why_fits": "Soul Expression",
        "category": "play_accessories",
        "pillars": ["play", "celebrate"],
        "price": 899,
        "soul_tier": "soul_made",
        "description_template": "A stunning illustrated {breed} activity print — showing your dog's top play activities, energy level, and soul personality. Ready to frame.",
        "mira_hint_template": "🎨 Soul art! {breed} personality print — frame-worthy and 100% personalised"
    },

    # ── NEW PRODUCT TYPES (added Mar 2026) ─────────────────────────────────────

    {
        "what_is": "Custom Portrait",
        "why_fits": "AI Breed Portrait",
        "category": "breed-custom_portraits",
        "pillars": ["celebrate", "farewell", "shop"],
        "price": 2499,
        "soul_tier": "soul_made",
        "description_template": "A breathtaking AI-generated watercolour portrait of your {breed} — capturing their soul, personality and energy in stunning fine-art style. Ships as a museum-quality print.",
        "mira_hint_template": "🖼 Highest value! Stunning watercolour portrait — every {breed} parent wants one"
    },
    {
        "what_is": "Phone Case",
        "why_fits": "Breed Design",
        "category": "breed-phone_cases",
        "pillars": ["shop", "celebrate"],
        "price": 799,
        "soul_tier": "soul_made",
        "description_template": "Premium slim phone case featuring beautiful {breed} artwork — soft-touch finish, drop protection, and a design that shows the world you're a {breed} parent.",
        "mira_hint_template": "📱 Everyone wants one! {breed} phone case — most impulse-purchased product"
    },
    {
        "what_is": "Framed Wall Art",
        "why_fits": "Home Décor",
        "category": "breed-wall_art",
        "pillars": ["shop", "celebrate"],
        "price": 1899,
        "soul_tier": "soul_made",
        "description_template": "Museum-quality framed print of your {breed} — AI-generated watercolour illustration ready to hang. Makes the perfect gift for any {breed} lover.",
        "mira_hint_template": "🏠 Statement piece! {breed} wall art — gifting bestseller, ships framed"
    },
    {
        "what_is": "Memory Box",
        "why_fits": "Tribute Collection",
        "category": "breed-memory_boxes",
        "pillars": ["farewell", "celebrate"],
        "price": 3499,
        "soul_tier": "soul_made",
        "description_template": "A beautifully crafted {breed} memory box — hand-engraved with breed silhouette, lined with velvet, and made to hold paw prints, tags, fur, and your most precious memories.",
        "mira_hint_template": "💜 Deeply meaningful. {breed} memory box — farewell's most treasured keepsake"
    },
    {
        "what_is": "Birthday Cake Topper",
        "why_fits": "Celebration Edition",
        "category": "breed-birthday_cake_toppers",
        "pillars": ["celebrate"],
        "price": 499,
        "soul_tier": "soul_made",
        "description_template": "Custom {breed} birthday cake topper — laser-cut wood with breed silhouette and personalised name. Works on any cake and makes for the most adorable birthday photos.",
        "mira_hint_template": "🎂 Easy add-on! {breed} cake topper — makes every birthday photo perfect"
    },
]

# Placeholder images by category (beautiful icons)
CATEGORY_IMAGES = {
    "breed-cakes": [
        "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400",  # Dog cake
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400"  # Birthday cake
    ],
    "cups_merch": [
        "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400",  # Mug
        "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=400"  # Canvas
    ],
    "bandanas": [
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",  # Dog with bandana
        "https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=400"
    ],
    "accessories": [
        "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400",  # Pet accessories
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400"
    ],
    "celebration_addons": [
        "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400",  # Party dog
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"
    ],
    "dine_accessories": [
        "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400",  # Dog bowl
        "https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=400"   # Feeding
    ],
    "care_accessories": [
        "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",  # Grooming
        "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400"   # Care
    ],
    "go_accessories": [
        "https://images.unsplash.com/photo-1534361960057-19f4434d58c5?w=400",  # Dog travel
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400"      # Walking
    ],
    "play_accessories": [
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",  # Dog play
        "https://images.unsplash.com/photo-1485290334039-a3c69043e517?w=400"   # Dog park
    ]
}


# Default flavors for cakes
CAKE_FLAVORS = [
    {"name": "Chicken", "price": 0},
    {"name": "Chicken Liver", "price": 0},
    {"name": "Mutton", "price": 50},
    {"name": "Banana", "price": 0},
    {"name": "Cheeku", "price": 0},
    {"name": "Coconut", "price": 0},
    {"name": "Mango", "price": 0},
    {"name": "Veggies", "price": 0}
]

# Default base options for cakes
CAKE_BASES = ["Oats", "Ragi"]

# Default cake sizes
CAKE_SIZES = [
    {"name": "Mini (200g)", "price": 999},
    {"name": "Regular (500g)", "price": 1499},
    {"name": "Large (1kg)", "price": 1899}
]

@router.post("/admin/seed-breed-products")
async def seed_breed_products():
    """
    🎯 SEED BREED-SPECIFIC PRODUCTS
    Creates personalized products for top 20 breeds × 8 product types = 160 products
    These appear in PICKS for each pet based on their breed!
    """
    created = 0
    skipped = 0
    
    for breed in TOP_BREEDS:
        for template in BREED_PRODUCT_TEMPLATES:
            # Create unique product for this breed
            product_name = f"{breed} · {template['what_is']} · {template['why_fits']}"
            
            # Check if already exists
            existing = await db.breed_products.find_one({"name": product_name})
            if existing:
                skipped += 1
                continue
            
            # Build product with appropriate options based on category
            is_cake = template["category"] in ["breed-cakes", "cakes"]
            
            product = {
                "id": f"bp-{breed.lower().replace(' ', '-')}-{template['what_is'].lower().replace(' ', '-')}-{uuid.uuid4().hex[:6]}",
                "name": product_name,
                "title": product_name,  # For modal compatibility
                "who_for": breed,
                "what_is": template["what_is"],
                "why_fits": template["why_fits"],
                "short_description": template["description_template"].format(breed=breed),
                "long_description": f"Specially designed for {breed} lovers! {template['description_template'].format(breed=breed)}",
                "description": template["description_template"].format(breed=breed),  # For modal compatibility
                "category": template["category"],
                "sub_category": f"{breed.lower().replace(' ', '-')}-special",
                "pillars": template["pillars"],
                "pillar": template["pillars"][0] if template["pillars"] else "celebrate",  # For modal
                "breed_tags": [breed],  # Simple list for modal "Perfect for" badge
                "breed_tags_full": {
                    "breeds": [breed],
                    "sizes": [],
                    "age_groups": [],
                    "coat_types": [],
                    "sensitivities": []
                },
                "price": template["price"],
                "compare_price": template["price"] * 1.25,  # 25% "discount"
                "pricing_model": "fixed",
                "sku": f"BP-{breed[:3].upper()}-{template['what_is'][:3].upper()}-{uuid.uuid4().hex[:4].upper()}",
                "vendor": "The Doggy Company",
                "in_stock": True,
                "stock_quantity": 100,
                "images": CATEGORY_IMAGES.get(template["category"], CATEGORY_IMAGES["accessories"]),
                "image": CATEGORY_IMAGES.get(template["category"], CATEGORY_IMAGES["accessories"])[0],  # For modal
                "primary_image": CATEGORY_IMAGES.get(template["category"], CATEGORY_IMAGES["accessories"])[0],
                "mira_hint": template["mira_hint_template"].format(breed=breed),
                "ai_tags": [breed.lower(), template["what_is"].lower(), "personalized", "breed-specific", "picks", "mira-picks"],
                "soul_tier": template.get("soul_tier", "soul_selected"),
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                # Add cake-specific options for cakes
                "flavors": CAKE_FLAVORS if is_cake else [],
                "sizes": CAKE_SIZES if is_cake else [],
                "options": [
                    {"name": "Base", "values": CAKE_BASES},
                    {"name": "Flavour", "values": [f["name"] for f in CAKE_FLAVORS]}
                ] if is_cake else [],
                "variants": [
                    {
                        "id": f"var-{uuid.uuid4().hex[:8]}",
                        "option1": base,
                        "option2": flavor["name"],
                        "price": template["price"],
                        "available": True
                    }
                    for base in CAKE_BASES
                    for flavor in CAKE_FLAVORS
                ] if is_cake else []
            }
            
            await db.breed_products.insert_one(product)
            created += 1
    
    # Also update the products collection with breed associations
    # So they show up in regular product searches too
    await sync_breed_products_to_main()
    
    return {
        "success": True,
        "message": f"Seeded {created} breed-specific products for PICKS! ({skipped} already existed)",
        "created": created,
        "skipped": skipped,
        "total_breeds": len(TOP_BREEDS),
        "products_per_breed": len(BREED_PRODUCT_TEMPLATES),
        "expected_total": len(TOP_BREEDS) * len(BREED_PRODUCT_TEMPLATES)
    }


@router.delete("/admin/clear-breed-products")
async def clear_breed_products():
    """Clear all breed products to allow re-seeding with updated structure"""
    # Delete from breed_products collection
    result1 = await db.breed_products.delete_many({})
    
    # Delete synced breed products from main products collection
    result2 = await db.products.delete_many({"id": {"$regex": "^bp-"}})
    result3 = await db.products_master.delete_many({"id": {"$regex": "^bp-"}})
    
    return {
        "success": True,
        "deleted_breed_products": result1.deleted_count,
        "deleted_from_products": result2.deleted_count,
        "deleted_from_products_master": result3.deleted_count
    }


async def sync_breed_products_to_main():
    """Sync breed_products to main products collection AND unified_products for admin visibility"""
    breed_products = await db.breed_products.find({"is_active": True}).to_list(500)
    
    synced_products = 0
    synced_unified = 0
    
    for bp in breed_products:
        # 1. Sync to products collection
        existing = await db.products.find_one({"id": bp["id"]})
        if not existing:
            main_product = {
                "id": bp["id"],
                "name": bp["name"],
                "title": bp["name"],
                "description": bp.get("short_description", ""),
                "short_description": bp.get("short_description", ""),
                "category": bp.get("category", ""),
                "pillar": bp.get("pillars", ["celebrate"])[0] if bp.get("pillars") else "celebrate",
                "pillars": bp.get("pillars", []),
                "price": bp.get("price", 0),
                "compare_at_price": bp.get("compare_price"),
                "images": bp.get("images", []),
                "image": bp.get("primary_image", ""),
                "tags": bp.get("ai_tags", []),
                "breed_tags": bp.get("breed_tags", {}),
                "mira_hint": bp.get("mira_hint", ""),
                "vendor": bp.get("vendor", "The Doggy Company"),
                "in_stock": bp.get("in_stock", True),
                "is_breed_product": True,
                "source": "breed_catalogue",
                "created_at": bp.get("created_at"),
                "updated_at": datetime.now(timezone.utc)
            }
            await db.products.insert_one(main_product)
            synced_products += 1
        
        # 2. Sync to unified_products (Admin Product Box)
        existing_unified = await db.unified_products.find_one({"id": bp["id"]})
        if not existing_unified:
            unified_product = {
                "id": bp["id"],
                "name": bp["name"],
                "title": bp["name"],
                "description": bp.get("short_description", ""),
                "long_description": bp.get("long_description", ""),
                "category": bp.get("category", ""),
                "sub_category": bp.get("sub_category", ""),
                "pillar": bp.get("pillars", ["celebrate"])[0] if bp.get("pillars") else "celebrate",
                "pillars": bp.get("pillars", []),
                "price": bp.get("price", 0),
                "compare_at_price": bp.get("compare_price"),
                "images": bp.get("images", []),
                "image": bp.get("primary_image", bp.get("image", "")),  # For frontend compatibility
                "primary_image": bp.get("primary_image", ""),
                "tags": bp.get("ai_tags", []),
                "breed_tags": bp.get("breed_tags", []),
                "mira_hint": bp.get("mira_hint", ""),
                "vendor": bp.get("vendor", "The Doggy Company"),
                "sku": bp.get("sku", ""),
                "in_stock": bp.get("in_stock", True),
                "stock_quantity": bp.get("stock_quantity", 100),
                "flavors": bp.get("flavors", []),
                "sizes": bp.get("sizes", []),
                "options": bp.get("options", []),
                "variants": bp.get("variants", []),
                "is_active": bp.get("is_active", True),
                "is_breed_product": True,
                "source": "breed_catalogue",
                "product_type": "breed_pick",
                "created_at": bp.get("created_at"),
                "updated_at": datetime.now(timezone.utc)
            }
            await db.unified_products.insert_one(unified_product)
            synced_unified += 1
    
    logging.info(f"[Breed Sync] Synced {synced_products} to products, {synced_unified} to unified_products")
    return {"synced_products": synced_products, "synced_unified": synced_unified}


@router.post("/admin/sync-breed-to-admin")
async def sync_breed_products_to_admin():
    """
    🔄 SYNC BREED PRODUCTS TO ADMIN
    Makes breed products visible in the Admin Unified Product Box
    """
    result = await sync_breed_products_to_main()
    return {
        "success": True,
        "message": f"Synced {result['synced_unified']} breed products to Admin Product Box",
        **result
    }


@router.get("/admin/breed-products-stats")
async def get_breed_products_stats():
    """Get statistics about breed-specific products"""
    total = await db.breed_products.count_documents({"is_active": True})
    
    # Group by breed
    by_breed = await db.breed_products.aggregate([
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$who_for", "count": {"$sum": 1}}}
    ]).to_list(100)
    
    # Group by category
    by_category = await db.breed_products.aggregate([
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]).to_list(50)
    
    return {
        "total_breed_products": total,
        "by_breed": {item["_id"]: item["count"] for item in by_breed},
        "by_category": {item["_id"]: item["count"] for item in by_category},
        "breeds_covered": len(by_breed),
        "categories_covered": len(by_category)
    }
