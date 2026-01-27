"""
Unified Product Box - The Single Source of Truth
=================================================
Every product, reward, and experience must be born here, governed here,
and resolved to a Pet Pass ID.

This module powers:
- Products on the website
- Products in My Account
- Products referenced by Mira
- Products attached to Paw Rewards
- Products linked to Service Desk tickets
- Products used across Pillars
- Products offered by Concierge
"""

import os
import uuid
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Create router
product_box_router = APIRouter(prefix="/api/product-box", tags=["Unified Product Box"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_product_box_db(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== ENUMS & CONSTANTS ====================

PRODUCT_TYPES = ["physical", "service", "experience", "reward"]

PRODUCT_STATUS = ["draft", "active", "archived"]

# All 14 pillars - THE CANONICAL LIST
ALL_PILLARS = [
    "celebrate", "dine", "stay", "travel", "care",
    "enjoy", "fit", "learn", "paperwork", "advisory",
    "emergency", "farewell", "adopt", "shop"
]

LIFE_STAGES = ["puppy", "adult", "senior", "all"]

SIZE_SUITABILITY = ["small", "medium", "large", "all"]

DIETARY_FLAGS = [
    "grain_free", "single_protein", "vegetarian", "limited_ingredient",
    "hypoallergenic", "high_protein", "low_fat", "raw_friendly"
]

MEMBERSHIP_ELIGIBILITY = ["trial", "annual", "both", "reward_only", "all"]

REWARD_TRIGGERS = [
    "birthday", "booking", "order", "first_visit", "membership_milestone",
    "referral", "manual_grant", "celebration", "gotcha_day"
]


# ==================== PYDANTIC MODELS ====================

class PetSafetyInfo(BaseModel):
    """Pet safety and suitability layer"""
    life_stages: List[str] = ["all"]  # puppy, adult, senior, all
    size_suitability: List[str] = ["all"]  # small, medium, large, all
    dietary_flags: List[str] = []
    known_exclusions: List[str] = []  # allergies, health restrictions
    safety_notes: Optional[str] = None
    is_validated: bool = False  # Admin must validate safety info


class PawRewardConfig(BaseModel):
    """Paw Rewards integration settings"""
    is_reward_eligible: bool = False
    is_reward_only: bool = False  # Cannot be purchased, reward only
    reward_value: float = 0  # Points value for redemption
    max_redemptions_per_pet: Optional[int] = None
    expiry_days: Optional[int] = None
    trigger_conditions: List[str] = []  # birthday, booking, etc.
    pillar_specific: Optional[str] = None  # If tied to specific pillar


class MiraVisibility(BaseModel):
    """Mira AI visibility rules"""
    can_reference: bool = True
    can_suggest_proactively: bool = False  # Non-pushy by default
    mention_only_if_asked: bool = True
    suggestion_context: Optional[str] = None  # When to suggest
    exclusion_reasons: List[str] = []  # Why Mira shouldn't suggest


class PricingInfo(BaseModel):
    """Pricing and tax configuration"""
    base_price: float = 0
    compare_at_price: Optional[float] = None
    cost_price: Optional[float] = None
    gst_applicable: bool = True
    gst_rate: float = 18.0
    variable_pricing: bool = False
    zero_price_allowed: bool = False  # For rewards
    currency: str = "INR"
    
    # Shipping
    requires_shipping: bool = True
    shipping_weight: Optional[float] = None  # in kg
    shipping_class: Optional[str] = None  # standard, express, etc.
    free_shipping_eligible: bool = False


class VisibilitySettings(BaseModel):
    """Visibility and status settings"""
    status: str = "draft"  # draft, active, archived
    visible_on_site: bool = True
    visible_to_members: bool = True
    admin_only: bool = False
    membership_eligibility: str = "all"  # trial, annual, both, reward_only, all
    featured: bool = False
    searchable: bool = True


class UnifiedProduct(BaseModel):
    """The canonical product record"""
    # Identity (immutable)
    id: Optional[str] = None
    sku: Optional[str] = None
    
    # Basic Info
    name: str
    product_type: str  # physical, service, experience, reward
    short_description: Optional[str] = None
    long_description: Optional[str] = None
    usage_context: Optional[str] = None  # When appropriate/not appropriate
    
    # Categorization
    category: Optional[str] = None
    subcategory: Optional[str] = None
    tags: List[str] = []
    collections: List[str] = []
    
    # Pillar Mapping (Critical)
    pillars: List[str] = []  # Which pillars this product appears in
    primary_pillar: Optional[str] = None
    
    # Media
    images: List[str] = []
    thumbnail: Optional[str] = None
    
    # Nested Configs
    pet_safety: PetSafetyInfo = Field(default_factory=PetSafetyInfo)
    paw_rewards: PawRewardConfig = Field(default_factory=PawRewardConfig)
    mira_visibility: MiraVisibility = Field(default_factory=MiraVisibility)
    pricing: PricingInfo = Field(default_factory=PricingInfo)
    visibility: VisibilitySettings = Field(default_factory=VisibilitySettings)
    
    # Inventory
    in_stock: bool = True
    stock_quantity: Optional[int] = None
    track_inventory: bool = False
    allow_backorder: bool = False
    
    # Variants (for physical products)
    has_variants: bool = False
    variants: List[Dict[str, Any]] = []
    
    # Bundle Info
    is_bundle: bool = False
    bundle_items: List[Dict[str, Any]] = []  # List of {product_id, quantity}
    
    # Fulfilment
    fulfilment_notes: Optional[str] = None  # Internal only
    preparation_time: Optional[str] = None
    
    # External References
    shopify_id: Optional[str] = None
    external_source: Optional[str] = None
    
    # Audit
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    version: int = 1


class ProductFilter(BaseModel):
    """Filter options for product search"""
    product_type: Optional[str] = None
    pillar: Optional[str] = None
    status: Optional[str] = None
    reward_eligible: Optional[bool] = None
    mira_visible: Optional[bool] = None
    in_stock: Optional[bool] = None
    search: Optional[str] = None


# ==================== API ROUTES ====================

@product_box_router.get("/products")
async def get_all_products(
    skip: int = 0,
    limit: int = 50,
    product_type: Optional[str] = None,
    pillar: Optional[str] = None,
    status: Optional[str] = None,
    reward_eligible: Optional[bool] = None,
    search: Optional[str] = None,
    shipping: Optional[str] = None
):
    """Get all products with filtering"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Build query
    query = {}
    
    if product_type:
        query["product_type"] = product_type
    if pillar:
        # Check both 'pillar' (singular) and 'pillars' (array) fields
        query["$or"] = [
            {"pillar": pillar},
            {"pillars": pillar},
            {"primary_pillar": pillar}
        ]
    if status:
        query["visibility.status"] = status
    if reward_eligible is not None:
        query["paw_rewards.is_reward_eligible"] = reward_eligible
    if shipping:
        if shipping == "pan-india":
            query["is_pan_india_shippable"] = True
        elif shipping == "local":
            query["is_pan_india_shippable"] = {"$ne": True}
    if search:
        search_query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"sku": {"$regex": search, "$options": "i"}},
                {"tags": {"$regex": search, "$options": "i"}},
                {"category": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        }
        # Merge search query with existing query
        if "$or" in query:
            query = {"$and": [query, search_query]}
        else:
            query.update(search_query)
    
    # Execute query - check both products and unified_products collections
    products = await db.unified_products.find(
        query, {"_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    # If no results from unified_products, try products collection
    if not products:
        products_query = query.copy()
        products = await db.products.find(
            products_query, {"_id": 0}
        ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.unified_products.count_documents(query)
    if total == 0:
        total = await db.products.count_documents(query)
    
    return {
        "products": products,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@product_box_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get a single product by ID"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    product = await db.unified_products.find_one(
        {"$or": [{"id": product_id}, {"sku": product_id}]},
        {"_id": 0}
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@product_box_router.post("/products")
async def create_product(product: UnifiedProduct, admin_user: str = "system"):
    """Create a new product"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Generate ID if not provided
    if not product.id:
        product.id = f"PROD-{secrets.token_hex(6).upper()}"
    
    # Generate SKU if not provided
    if not product.sku:
        product.sku = f"SKU-{product.product_type[:3].upper()}-{secrets.token_hex(4).upper()}"
    
    # Check for duplicate
    existing = await db.unified_products.find_one({"id": product.id})
    if existing:
        raise HTTPException(status_code=400, detail="Product ID already exists")
    
    # Set audit fields
    product_dict = product.model_dump()
    product_dict["created_by"] = admin_user
    product_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.unified_products.insert_one(product_dict)
    
    # Remove _id from response
    product_dict.pop("_id", None)
    
    logger.info(f"Created product: {product.id} - {product.name}")
    return {"message": "Product created", "product": product_dict}


@product_box_router.put("/products/{product_id}")
async def update_product(product_id: str, updates: Dict[str, Any], admin_user: str = "system"):
    """Update a product"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Check exists
        existing = await db.unified_products.find_one({"id": product_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Don't allow changing ID
        updates.pop("id", None)
        updates.pop("_id", None)
        
        # Remove any ObjectId references that might have crept in
        def sanitize_value(v):
            if hasattr(v, '__str__') and 'ObjectId' in str(type(v)):
                return str(v)
            if isinstance(v, dict):
                return {k: sanitize_value(val) for k, val in v.items()}
            if isinstance(v, list):
                return [sanitize_value(item) for item in v]
            return v
        
        updates = sanitize_value(updates)
        
        # Set audit fields
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        updates["updated_by"] = admin_user
        updates["version"] = existing.get("version", 1) + 1
        
        await db.unified_products.update_one(
            {"id": product_id},
            {"$set": updates}
        )
        
        # Get updated product
        updated = await db.unified_products.find_one({"id": product_id}, {"_id": 0})
        
        logger.info(f"Updated product: {product_id}")
        return {"message": "Product updated", "product": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update product: {str(e)}")


@product_box_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Delete a product (soft delete - archive)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = await db.unified_products.update_one(
        {"id": product_id},
        {"$set": {
            "visibility.status": "archived",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product archived", "product_id": product_id}


@product_box_router.post("/products/{product_id}/clone")
async def clone_product(product_id: str, new_name: Optional[str] = None):
    """Clone a product for creating variants"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    original = await db.unified_products.find_one({"id": product_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create clone
    clone = dict(original)
    clone["id"] = f"PROD-{secrets.token_hex(6).upper()}"
    clone["sku"] = f"SKU-{clone['product_type'][:3].upper()}-{secrets.token_hex(4).upper()}"
    clone["name"] = new_name or f"{original['name']} (Copy)"
    clone["visibility"]["status"] = "draft"
    clone["created_at"] = datetime.now(timezone.utc).isoformat()
    clone["updated_at"] = None
    clone["version"] = 1
    clone["shopify_id"] = None  # Don't copy external references
    
    await db.unified_products.insert_one(clone)
    clone.pop("_id", None)
    
    return {"message": "Product cloned", "product": clone}


# ==================== BULK OPERATIONS ====================

@product_box_router.post("/products/bulk-update")
async def bulk_update_products(
    product_ids: List[str],
    updates: Dict[str, Any],
    admin_user: str = "system"
):
    """Bulk update multiple products"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates["updated_by"] = admin_user
    
    result = await db.unified_products.update_many(
        {"id": {"$in": product_ids}},
        {"$set": updates}
    )
    
    return {
        "message": f"Updated {result.modified_count} products",
        "modified_count": result.modified_count
    }


@product_box_router.post("/products/bulk-assign-pillar")
async def bulk_assign_pillar(product_ids: List[str], pillar: str):
    """Assign multiple products to a pillar"""
    if pillar not in ALL_PILLARS:
        raise HTTPException(status_code=400, detail=f"Invalid pillar. Must be one of: {ALL_PILLARS}")
    
    result = await db.unified_products.update_many(
        {"id": {"$in": product_ids}},
        {
            "$addToSet": {"pillars": pillar},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": f"Assigned {result.modified_count} products to {pillar}"}


# ==================== PILLAR & REWARD QUERIES ====================

@product_box_router.get("/by-pillar/{pillar}")
async def get_products_by_pillar(pillar: str, include_rewards: bool = True):
    """Get all products for a specific pillar"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {
        "pillars": pillar,
        "visibility.status": "active"
    }
    
    if not include_rewards:
        query["paw_rewards.is_reward_only"] = {"$ne": True}
    
    products = await db.unified_products.find(query, {"_id": 0}).to_list(200)
    
    return {
        "pillar": pillar,
        "products": products,
        "count": len(products)
    }


@product_box_router.get("/rewards")
async def get_reward_products(pillar: Optional[str] = None):
    """Get all reward-eligible products"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {
        "paw_rewards.is_reward_eligible": True,
        "visibility.status": "active"
    }
    
    if pillar:
        query["pillars"] = pillar
    
    products = await db.unified_products.find(query, {"_id": 0}).to_list(100)
    
    return {
        "rewards": products,
        "count": len(products)
    }


@product_box_router.get("/mira-visible")
async def get_mira_visible_products(
    can_suggest: bool = False,
    pillar: Optional[str] = None
):
    """Get products that Mira can reference"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {
        "mira_visibility.can_reference": True,
        "visibility.status": "active"
    }
    
    if can_suggest:
        query["mira_visibility.can_suggest_proactively"] = True
    
    if pillar:
        query["pillars"] = pillar
    
    products = await db.unified_products.find(query, {"_id": 0}).to_list(100)
    
    return {
        "products": products,
        "count": len(products)
    }


# ==================== PET SAFETY QUERIES ====================

@product_box_router.get("/safe-for-pet")
async def get_safe_products_for_pet(
    life_stage: str = "adult",
    size: str = "medium",
    allergies: List[str] = Query(default=[]),
    pillar: Optional[str] = None
):
    """Get products safe for a specific pet profile"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {
        "visibility.status": "active",
        "pet_safety.is_validated": True,
        "$or": [
            {"pet_safety.life_stages": "all"},
            {"pet_safety.life_stages": life_stage}
        ]
    }
    
    # Size filter
    query["$and"] = [
        {"$or": [
            {"pet_safety.size_suitability": "all"},
            {"pet_safety.size_suitability": size}
        ]}
    ]
    
    # Exclude products with pet's allergies
    if allergies:
        query["pet_safety.known_exclusions"] = {"$nin": allergies}
    
    if pillar:
        query["pillars"] = pillar
    
    products = await db.unified_products.find(query, {"_id": 0}).to_list(100)
    
    return {
        "safe_products": products,
        "count": len(products),
        "filters": {
            "life_stage": life_stage,
            "size": size,
            "excluded_allergies": allergies
        }
    }


# ==================== STATISTICS ====================

@product_box_router.get("/stats")
async def get_product_stats():
    """Get product statistics"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Total counts
    total = await db.unified_products.count_documents({})
    active = await db.unified_products.count_documents({"visibility.status": "active"})
    draft = await db.unified_products.count_documents({"visibility.status": "draft"})
    archived = await db.unified_products.count_documents({"visibility.status": "archived"})
    
    # By type
    type_pipeline = [
        {"$group": {"_id": "$product_type", "count": {"$sum": 1}}}
    ]
    by_type = await db.unified_products.aggregate(type_pipeline).to_list(10)
    
    # By pillar
    pillar_pipeline = [
        {"$unwind": "$pillars"},
        {"$group": {"_id": "$pillars", "count": {"$sum": 1}}}
    ]
    by_pillar = await db.unified_products.aggregate(pillar_pipeline).to_list(20)
    
    # Reward stats
    reward_eligible = await db.unified_products.count_documents({"paw_rewards.is_reward_eligible": True})
    reward_only = await db.unified_products.count_documents({"paw_rewards.is_reward_only": True})
    
    # Mira stats
    mira_visible = await db.unified_products.count_documents({"mira_visibility.can_reference": True})
    mira_suggestable = await db.unified_products.count_documents({"mira_visibility.can_suggest_proactively": True})
    
    return {
        "total": total,
        "by_status": {
            "active": active,
            "draft": draft,
            "archived": archived
        },
        "by_type": {item["_id"]: item["count"] for item in by_type},
        "by_pillar": {item["_id"]: item["count"] for item in by_pillar},
        "rewards": {
            "eligible": reward_eligible,
            "reward_only": reward_only
        },
        "mira": {
            "visible": mira_visible,
            "suggestable": mira_suggestable
        }
    }


# ==================== MIGRATION / SEEDING ====================

@product_box_router.post("/migrate-from-products")
async def migrate_existing_products(force: bool = False):
    """Migrate existing products to unified product box
    
    Args:
        force: If True, will update existing products with latest data from products collection
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Get existing products from main products collection
    existing = await db.products.find({}, {"_id": 0}).to_list(5000)
    
    migrated = 0
    updated = 0
    skipped = 0
    
    for product in existing:
        product_name = product.get("title") or product.get("name")
        shopify_id = product.get("shopify_id")
        product_id = product.get("id")
        
        # Check if already exists in unified_products
        existing_unified = await db.unified_products.find_one({
            "$or": [
                {"shopify_id": shopify_id} if shopify_id else {"id": "__no_match__"},
                {"name": product_name} if product_name else {"name": "__no_match__"},
                {"original_product_id": product_id} if product_id else {"id": "__no_match__"}
            ]
        })
        
        if existing_unified and not force:
            skipped += 1
            continue
        
        # Transform to unified format
        unified = {
            "id": existing_unified.get("id") if existing_unified else f"PROD-{secrets.token_hex(6).upper()}",
            "original_product_id": product_id,
            "shopify_id": shopify_id,
            "sku": product.get("sku") or f"SKU-PHY-{secrets.token_hex(4).upper()}",
            "name": product_name or "Untitled Product",
            "product_type": "physical",
            "short_description": product.get("description", "")[:200] if product.get("description") else None,
            "long_description": product.get("description"),
            "category": product.get("category"),
            "subcategory": product.get("subcategory"),
            "tags": product.get("tags", []),
            "intelligent_tags": product.get("intelligent_tags", []),
            "breed_tags": product.get("breed_tags", []),
            "health_tags": product.get("health_tags", []),
            "collections": product.get("collections", []),
            "pillars": ["shop"],
            "primary_pillar": "shop",
            "images": product.get("images", []),
            "thumbnail": product.get("image") or (product.get("images", [None])[0] if product.get("images") else None),
            
            # Pricing
            "pricing": {
                "cost": product.get("cost", 0),
                "price": product.get("price", 0),
                "compare_at_price": product.get("compare_at_price"),
                "gst_percent": product.get("gst_percent", 5),
                "shipping_weight": product.get("shipping_weight"),
                "packaging_type": product.get("packaging_type")
            },
            
            # Pet Safety
            "pet_safety": {
                "life_stages": product.get("lifestage_tags", ["all"]),
                "size_suitability": product.get("size_tags", ["all"]),
                "dietary_flags": product.get("diet_tags", []),
                "known_exclusions": [],
                "safety_notes": None,
                "is_validated": False
            },
            
            # Paw Rewards
            "paw_rewards": {
                "is_reward_eligible": False,
                "is_reward_only": False,
                "reward_value": 0,
                "max_redemptions_per_pet": None,
                "expiry_days": None,
                "trigger_conditions": [],
                "pillar_specific": None
            },
            
            # Mira visibility
            "mira_visibility": {
                "can_reference": True,
                "can_suggest_proactively": bool(product.get("intelligent_tags")),
                "mention_only_if_asked": False,
                "suggestion_context": None,
                "exclusion_reasons": []
            },
            
            # Visibility
            "visibility": {
                "status": "active" if product.get("available", True) else "archived",
                "visible_on_website": True,
                "visible_to_mira": True,
                "visible_in_search": True
            },
            
            "created_at": product.get("created_at") or datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if existing_unified and force:
            # Update existing
            await db.unified_products.update_one(
                {"id": existing_unified["id"]},
                {"$set": unified}
            )
            updated += 1
        else:
            # Insert new
            await db.unified_products.insert_one(unified)
            migrated += 1
    
    # ========== ALSO SYNC STAY PROPERTIES TO PRODUCTS ==========
    stay_synced = 0
    try:
        # Default pricing for stay properties
        DEFAULT_STAY_PRICES = {"budget": 2500, "mid": 5000, "premium": 12000, "luxury": 25000}
        
        # Sync stay_properties
        properties = await db.stay_properties.find({}).to_list(length=500)
        for prop in properties:
            prop_type = (prop.get('property_type', '') or '').lower()
            if 'luxury' in prop_type or 'palace' in prop.get('name', '').lower():
                price = DEFAULT_STAY_PRICES['luxury']
            elif 'premium' in prop_type or 'resort' in prop_type:
                price = DEFAULT_STAY_PRICES['premium']
            elif 'budget' in prop_type or 'hostel' in prop_type:
                price = DEFAULT_STAY_PRICES['budget']
            else:
                price = DEFAULT_STAY_PRICES['mid']
            
            product_id = f"stay-{str(prop.get('_id'))}"
            product = {
                "id": product_id,
                "name": prop.get('name', 'Pet-Friendly Stay'),
                "title": prop.get('name', 'Pet-Friendly Stay'),
                "description": prop.get('description', f"Pet-friendly accommodation in {prop.get('city', 'India')}"),
                "price": prop.get('price_per_night') or price,
                "category": "stay",
                "pillar": "stay",
                "image": prop.get('images', [None])[0] if prop.get('images') else prop.get('image') or "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                "tags": ["Stay", "Pet-Friendly", prop.get('city', ''), prop.get('property_type', '')],
                "city": prop.get('city'),
                "property_type": prop.get('property_type'),
                "in_stock": True,
                "source": "stay_properties",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.products.update_one({"id": product_id}, {"$set": product}, upsert=True)
            stay_synced += 1
        
        # Sync boarding facilities
        boarding = await db.stay_boarding_facilities.find({}).to_list(length=100)
        for facility in boarding:
            product_id = f"boarding-{str(facility.get('_id', facility.get('name', '').replace(' ', '-').lower()))}"
            product = {
                "id": product_id,
                "name": facility.get('name'),
                "title": facility.get('name'),
                "description": facility.get('description'),
                "price": facility.get('price_per_night', 1000),
                "category": "boarding",
                "pillar": "stay",
                "tags": ["Boarding", "Pet Care", facility.get('city', '')],
                "city": facility.get('city'),
                "in_stock": True,
                "source": "stay_boarding_facilities",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.products.update_one({"id": product_id}, {"$set": product}, upsert=True)
            stay_synced += 1
            
        # ========== SEED DEFAULT PILLAR PRODUCTS IF NONE EXIST ==========
        pillar_counts = {}
        for pillar in ['travel', 'care', 'fit', 'enjoy', 'learn']:
            count = await db.products.count_documents({"pillar": pillar})
            pillar_counts[pillar] = count
            
            if count == 0:
                # Seed default products for this pillar
                defaults = get_default_pillar_products(pillar)
                for p in defaults:
                    p["created_at"] = datetime.now(timezone.utc).isoformat()
                    await db.products.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
                pillar_counts[pillar] = len(defaults)
                
    except Exception as e:
        logger.error(f"Stay sync error (non-blocking): {e}")
    
    return {
        "message": "Migration complete",
        "migrated": migrated,
        "updated": updated,
        "skipped": skipped,
        "total_in_products": len(existing),
        "stay_synced": stay_synced
    }


def get_default_pillar_products(pillar: str) -> list:
    """Get default products for a pillar"""
    defaults = {
        "travel": [
            {"id": "travel-cab-1", "name": "Pet-Friendly Cab Service", "description": "AC cab rides for you and your pet", "price": 1500, "category": "cab", "pillar": "travel", "tags": ["Travel", "Cab"], "in_stock": True, "image": "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800"},
            {"id": "travel-train-1", "name": "Train Travel Assistance", "description": "Complete train travel support", "price": 3000, "category": "train", "pillar": "travel", "tags": ["Travel", "Train"], "in_stock": True, "image": "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800"},
            {"id": "travel-flight-1", "name": "Domestic Flight Coordination", "description": "Full support for flying with your pet", "price": 15000, "category": "flight", "pillar": "travel", "tags": ["Travel", "Flight"], "in_stock": True, "image": "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800"},
        ],
        "care": [
            {"id": "care-grooming-1", "name": "Full Grooming Package", "description": "Complete grooming service", "price": 1500, "category": "grooming", "pillar": "care", "tags": ["Care", "Grooming"], "in_stock": True, "image": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800"},
            {"id": "care-walk-1", "name": "Daily Dog Walking", "description": "30-minute daily walks", "price": 500, "category": "walks", "pillar": "care", "tags": ["Care", "Walks"], "in_stock": True, "image": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800"},
            {"id": "care-sitting-1", "name": "Pet Sitting (8 hours)", "description": "Professional pet sitting", "price": 1200, "category": "sitting", "pillar": "care", "tags": ["Care", "Sitting"], "in_stock": True, "image": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800"},
        ],
        "fit": [
            {"id": "fit-assessment-1", "name": "Fitness Assessment", "description": "Comprehensive fitness evaluation", "price": 1500, "category": "assessment", "pillar": "fit", "tags": ["Fit", "Assessment"], "in_stock": True, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800"},
            {"id": "fit-weight-1", "name": "Weight Management Program", "description": "8-week weight management", "price": 5000, "category": "weight", "pillar": "fit", "tags": ["Fit", "Weight"], "in_stock": True, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800"},
        ],
        "enjoy": [
            {"id": "enjoy-park-1", "name": "Dog Park Day Pass", "description": "Full day access to dog park", "price": 500, "category": "park", "pillar": "enjoy", "tags": ["Enjoy", "Park"], "in_stock": True, "image": "https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=800"},
            {"id": "enjoy-cafe-1", "name": "Pet Cafe Voucher", "description": "Pet-friendly cafe visit", "price": 800, "category": "cafe", "pillar": "enjoy", "tags": ["Enjoy", "Cafe"], "in_stock": True, "image": "https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=800"},
        ],
        "learn": [
            {"id": "learn-puppy-1", "name": "Puppy Training Course", "description": "8-week puppy foundation training", "price": 8000, "category": "puppy", "pillar": "learn", "tags": ["Learn", "Puppy"], "in_stock": True, "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800"},
            {"id": "learn-behavior-1", "name": "Behavior Modification", "description": "Address behavioral issues", "price": 6000, "category": "behavior", "pillar": "learn", "tags": ["Learn", "Behavior"], "in_stock": True, "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800"},
        ],
    }
    return defaults.get(pillar, [])


@product_box_router.get("/config/pillars")
async def get_all_pillars():
    """Get all available pillars"""
    return {"pillars": ALL_PILLARS}


@product_box_router.get("/config/product-types")
async def get_product_types():
    """Get all product types"""
    return {"types": PRODUCT_TYPES}


@product_box_router.get("/config/dietary-flags")
async def get_dietary_flags():
    """Get all dietary flags"""
    return {"flags": DIETARY_FLAGS}


@product_box_router.get("/config/reward-triggers")
async def get_reward_triggers():
    """Get all reward trigger conditions"""
    return {"triggers": REWARD_TRIGGERS}


# ==================== AUTO-SEEDING & SMART MAPPING ====================

# Category to pillar mapping
CATEGORY_TO_PILLARS = {
    # Food & Treats
    "treats": ["shop"],
    "food": ["shop"],
    "snacks": ["shop"],
    "nutrition": ["shop"],
    
    # Celebration
    "cakes": ["celebrate", "shop"],
    "birthday": ["celebrate", "shop"],
    "party": ["celebrate", "shop"],
    "gifts": ["celebrate", "shop"],
    "gifting": ["celebrate", "shop"],
    
    # Grooming & Care
    "grooming": ["care", "shop"],
    "hygiene": ["care", "shop"],
    "shampoo": ["care", "shop"],
    "spa": ["care"],
    
    # Toys & Enjoy
    "toys": ["enjoy", "shop"],
    "accessories": ["enjoy", "shop"],
    "games": ["enjoy", "shop"],
    
    # Training & Learn
    "training": ["learn", "fit", "shop"],
    "courses": ["learn"],
    "classes": ["learn"],
    
    # Health & Care
    "health": ["care", "shop"],
    "wellness": ["care", "shop"],
    "supplements": ["care", "shop"],
    "medication": ["care"],
    
    # Fitness
    "fitness": ["fit", "shop"],
    "exercise": ["fit", "shop"],
    
    # Travel
    "travel": ["travel", "shop"],
    "carriers": ["travel", "shop"],
    "luggage": ["travel", "shop"],
    
    # Apparel
    "apparel": ["shop"],
    "clothing": ["shop"],
    "fashion": ["shop"],
    
    # Dining
    "bowls": ["dine", "shop"],
    "feeders": ["dine", "shop"],
    
    # Stay
    "boarding": ["stay"],
    "daycare": ["stay", "care"],
    
    # Paperwork
    "documents": ["paperwork"],
    "records": ["paperwork"],
    "certificates": ["paperwork"],
    
    # Emergency
    "emergency": ["emergency"],
    "first-aid": ["emergency", "care", "shop"],
    
    # Farewell
    "memorial": ["farewell", "shop"],
    "urn": ["farewell", "shop"],
    
    # Adoption
    "adoption": ["adopt"],
    "rescue": ["adopt"],
}

# Tag to pillar mapping - THE 14 PILLARS
TAG_TO_PILLARS = {
    "birthday": ["celebrate"],
    "party": ["celebrate"],
    "gift": ["celebrate", "shop"],
    "treat": ["shop"],
    "snack": ["shop"],
    "food": ["shop"],
    "toy": ["enjoy"],
    "training": ["learn", "fit"],
    "groom": ["care"],
    "spa": ["care"],
    "travel": ["travel"],
    "health": ["care"],
    "wellness": ["care"],
    "valentine": ["celebrate"],
    "christmas": ["celebrate"],
    "diwali": ["celebrate"],
    "holi": ["celebrate"],
}


@product_box_router.post("/auto-seed-pillars")
async def auto_seed_pillars():
    """
    Auto-assign products to appropriate pillars based on category and tags.
    Also enables Mira visibility for appropriate products.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    collection = db.unified_products
    products = await collection.find({}).to_list(length=10000)
    
    # Debug info
    product_count = len(products)
    if product_count == 0:
        return {
            "success": False,
            "message": "No products found in unified_products collection",
            "debug": {
                "db_name": db.name if db is not None else "None",
                "collection_name": "unified_products"
            }
        }
    
    updated_count = 0
    pillar_counts = {p: 0 for p in ALL_PILLARS}
    
    for product in products:
        product_pillars = set(product.get("pillars", ["shop"]))
        category = (product.get("category") or "").lower()
        tags = [t.lower() for t in (product.get("tags") or [])]
        name = (product.get("name") or product.get("product_name") or "").lower()
        
        # Map based on category
        if category in CATEGORY_TO_PILLARS:
            product_pillars.update(CATEGORY_TO_PILLARS[category])
        
        # Map based on tags
        for tag in tags:
            for key, pillars in TAG_TO_PILLARS.items():
                if key in tag:
                    product_pillars.update(pillars)
        
        # Map based on product name keywords
        name_mappings = {
            "cake": ["celebrate"],
            "treat": ["feed"],
            "biscuit": ["feed"],
            "toy": ["play"],
            "shampoo": ["groom"],
            "collar": ["shop"],
            "leash": ["travel", "shop"],
            "bowl": ["dine", "feed"],
            "bed": ["shop"],
        }
        
        for keyword, pillars in name_mappings.items():
            if keyword in name:
                product_pillars.update(pillars)
        
        # Ensure shop is always included for physical products
        if product.get("product_type") == "physical":
            product_pillars.add("shop")
        
        # Determine primary pillar (first non-shop pillar, or shop)
        primary = "shop"
        for p in ["celebrate", "feed", "groom", "play", "train", "care", "travel", "dine", "stay"]:
            if p in product_pillars:
                primary = p
                break
        
        # Update the product
        pillars_list = list(product_pillars)
        
        # Enable Mira for products with good data
        mira_can_suggest = bool(
            product.get("name") and 
            product.get("pricing", {}).get("base_price", 0) > 0 and
            len(product_pillars) > 1  # Products mapped to multiple pillars are more useful
        )
        
        await collection.update_one(
            {"_id": product["_id"]},
            {
                "$set": {
                    "pillars": pillars_list,
                    "primary_pillar": primary,
                    "mira_visibility.can_suggest_proactively": mira_can_suggest,
                    "mira_visibility.can_reference": True,
                    "updated_at": datetime.now(timezone.utc),
                    "updated_by": "auto-seed"
                }
            }
        )
        
        updated_count += 1
        for p in pillars_list:
            pillar_counts[p] = pillar_counts.get(p, 0) + 1
    
    return {
        "success": True,
        "message": f"Auto-seeded {updated_count} products with pillar mappings",
        "updated_count": updated_count,
        "pillar_distribution": {k: v for k, v in pillar_counts.items() if v > 0}
    }


@product_box_router.post("/auto-enable-rewards")
async def auto_enable_rewards(
    percentage: int = Query(default=30, description="Percentage of products to make reward-eligible")
):
    """
    Auto-enable Paw Rewards for a percentage of products.
    Products with higher prices get higher reward values.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    collection = db.unified_products
    products = await collection.find({"visibility.status": "active"}).to_list(length=10000)
    
    import random
    random.shuffle(products)
    
    # Select percentage of products
    count_to_enable = int(len(products) * (percentage / 100))
    products_to_update = products[:count_to_enable]
    
    updated_count = 0
    for product in products_to_update:
        price = product.get("pricing", {}).get("base_price", 0) or 0
        
        # Calculate reward value (1 paw point per ₹100, min 5, max 50)
        reward_value = min(50, max(5, int(price / 100)))
        
        await collection.update_one(
            {"_id": product["_id"]},
            {
                "$set": {
                    "paw_rewards.is_reward_eligible": True,
                    "paw_rewards.reward_value": reward_value,
                    "paw_rewards.trigger_conditions": ["purchase"],
                    "updated_at": datetime.now(timezone.utc),
                    "updated_by": "auto-seed-rewards"
                }
            }
        )
        updated_count += 1
    
    return {
        "success": True,
        "message": f"Enabled rewards for {updated_count} products ({percentage}%)",
        "updated_count": updated_count
    }
