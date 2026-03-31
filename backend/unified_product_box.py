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
import csv
import io
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
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

# Item/Product Types
PRODUCT_TYPES = ["physical", "service", "experience", "bundle", "reward", "property", "content"]

PRODUCT_STATUS = ["draft", "pending_approval", "active", "paused", "archived"]

# All 15 pillars - THE CANONICAL LIST (including Shop)
ALL_PILLARS = [
    "celebrate", "dine", "stay", "travel", "care",
    "enjoy", "fit", "learn", "paperwork", "advisory",
    "emergency", "farewell", "adopt", "shop"
]

# Source types
SOURCE_TYPES = ["manual", "shopify", "partner", "import"]

LIFE_STAGES = ["puppy", "adult", "senior", "all"]

SIZE_SUITABILITY = ["small", "medium", "large", "giant", "all"]

SPECIES_OPTIONS = ["dog", "cat", "both", "other"]

DIETARY_FLAGS = [
    "grain_free", "single_protein", "vegetarian", "vegan", "limited_ingredient",
    "hypoallergenic", "high_protein", "low_fat", "raw_friendly", "human_grade",
    "organic", "preservative_free"
]

ALLERGENS = [
    "wheat", "corn", "soy", "dairy", "chicken", "beef", "pork", "fish",
    "eggs", "artificial_colors", "artificial_flavors"
]

MEMBERSHIP_ELIGIBILITY = ["trial", "annual", "vip", "all", "reward_only"]

REWARD_TRIGGERS = [
    "birthday", "gotcha_day", "booking", "order", "first_visit", 
    "membership_milestone", "referral", "manual_grant", "celebration",
    "review_submitted", "profile_complete"
]

# Shipping classes
SHIPPING_CLASSES = ["standard", "express", "same_day", "frozen", "fragile", "oversized"]

# Risk levels for pet safety
RISK_LEVELS = ["safe", "guidance_needed", "supervision_required", "concierge_review"]

# Price models for services
PRICE_MODELS = ["fixed", "variable", "quote_based", "subscription"]

# GST rates in India
GST_RATES = [0, 5, 12, 18, 28]


# ==================== PYDANTIC MODELS ====================

# --- Section A: Identity & Source ---
class IdentityInfo(BaseModel):
    """Identity and source tracking"""
    barcode: Optional[str] = None  # UPC/EAN
    shopify_id: Optional[str] = None
    shopify_handle: Optional[str] = None
    external_source: Optional[str] = None  # manual, shopify, partner, import
    source_url: Optional[str] = None
    vendor_id: Optional[str] = None
    partner_id: Optional[str] = None
    original_product_id: Optional[str] = None  # For migrations


# --- Section B: Basic Info ---
class BasicInfo(BaseModel):
    """Core product information"""
    name: str
    short_description: Optional[str] = None  # 100-140 chars for cards
    long_description: Optional[str] = None  # Full HTML/markdown
    usage_context: Optional[str] = None  # When to use / avoid
    key_benefits: List[str] = []  # 3-5 bullet points
    brand: Optional[str] = None
    manufacturer: Optional[str] = None
    country_of_origin: Optional[str] = None


# --- Section C: Categorization ---
class CategorizationInfo(BaseModel):
    """Discovery and categorization"""
    category: Optional[str] = None
    subcategory: Optional[str] = None
    taxonomy_path: Optional[str] = None  # e.g., "Shop > Treats > Birthday"
    tags: List[str] = []
    intelligent_tags: List[str] = []  # AI-generated
    breed_tags: List[str] = []
    health_tags: List[str] = []
    collections: List[str] = []
    occasion_tags: List[str] = []  # birthday, christmas, etc.
    seasonality: List[str] = []  # summer, winter, all-year


# --- Section D: Media ---
class MediaInfo(BaseModel):
    """Media assets"""
    primary_image: Optional[str] = None
    primary_image_alt: Optional[str] = None  # Required for accessibility
    images: List[str] = []
    thumbnail: Optional[str] = None  # Auto-generated if not provided
    video_url: Optional[str] = None
    document_urls: List[str] = []  # PDFs, guides, menus


# --- Section E: Pricing & Tax ---
class PricingInfo(BaseModel):
    """Pricing and tax configuration"""
    base_price: float = 0
    compare_at_price: Optional[float] = None  # MRP / original
    cost_price: Optional[float] = None  # For margin calculation
    
    # Tax
    gst_applicable: bool = True
    gst_rate: float = 18.0  # 0, 5, 12, 18, 28
    hsn_code: Optional[str] = None
    price_includes_gst: bool = False
    
    # Service pricing
    price_model: str = "fixed"  # fixed, variable, quote_based, subscription
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    
    # Currency
    currency: str = "INR"


# --- Section F: Variants ---
class VariantOption(BaseModel):
    """Product option definition"""
    name: str  # e.g., "Size", "Flavor"
    position: int = 1
    values: List[str] = []  # e.g., ["500g", "1kg"]


class ProductVariant(BaseModel):
    """Individual variant"""
    id: Optional[str] = None
    title: str  # e.g., "500g / Peanut Butter"
    sku: Optional[str] = None
    price: float = 0
    compare_at_price: Optional[float] = None
    option1: Optional[str] = None
    option2: Optional[str] = None
    option3: Optional[str] = None
    available: bool = True
    inventory_quantity: int = 0
    weight: Optional[float] = None


# --- Section G: Inventory ---
class InventoryInfo(BaseModel):
    """Inventory tracking"""
    in_stock: bool = True
    track_inventory: bool = False
    stock_quantity: Optional[int] = None
    low_stock_threshold: int = 5
    allow_backorder: bool = False
    warehouse_location: Optional[str] = None
    reserved_quantity: int = 0  # For pending orders
    
    # Perishables
    batch_tracking: bool = False
    expiry_date: Optional[str] = None
    shelf_life_days: Optional[int] = None


# --- Section H: Shipping & Fulfillment ---
class ShippingInfo(BaseModel):
    """Shipping and fulfillment config"""
    requires_shipping: bool = True
    shipping_class: str = "standard"  # standard, express, frozen, fragile
    cold_chain_required: bool = False
    
    # Dimensions
    weight_grams: Optional[int] = None
    length_cm: Optional[float] = None
    width_cm: Optional[float] = None
    height_cm: Optional[float] = None
    
    # Availability
    is_pan_india: bool = False
    delivery_zones: List[str] = []  # ["mumbai", "delhi", "bangalore"]
    excluded_pincodes: List[str] = []
    
    # Timing
    preparation_time: Optional[str] = None  # "2-3 days", "Same day"
    dispatch_sla_hours: int = 48
    delivery_sla_days: int = 5
    
    # Packaging
    packaging_type: Optional[str] = None
    handling_instructions: Optional[str] = None
    
    # Policies
    cancellation_policy_id: Optional[str] = None
    refund_policy_id: Optional[str] = None
    
    # For services
    service_duration_mins: Optional[int] = None
    at_home_available: bool = False
    cancellation_window_hours: int = 24


# --- Section I: Pet Safety & Suitability ---
class PetSafetyInfo(BaseModel):
    """Pet safety and suitability - HIGH PRIORITY"""
    species: str = "dog"  # dog, cat, both, other
    life_stages: List[str] = ["all"]
    size_suitability: List[str] = ["all"]
    breed_restrictions: List[str] = []  # Breeds to exclude
    
    # Dietary
    dietary_flags: List[str] = []
    allergens: List[str] = []
    
    # For food items
    ingredients: List[str] = []
    nutrition_info: Optional[Dict[str, Any]] = None
    feeding_guidelines: Optional[str] = None
    calorie_content: Optional[str] = None
    
    # Safety
    known_exclusions: List[str] = []  # Health conditions to avoid
    contraindications: List[str] = []
    supervision_required: bool = False
    risk_level: str = "safe"  # safe, guidance_needed, supervision_required, concierge_review
    safety_notes: Optional[str] = None
    
    # Validation
    is_validated: bool = False
    validated_by: Optional[str] = None
    validated_at: Optional[str] = None


# --- Section J: Rewards & Loyalty ---
class PawRewardConfig(BaseModel):
    """Paw Rewards integration"""
    # Earning
    points_per_rupee: float = 1.0  # Points earned per ₹ spent
    bonus_points: int = 0  # Extra points for this item
    
    # Redemption
    is_redeemable: bool = False  # Can use points to buy?
    points_required: Optional[int] = None
    is_reward_only: bool = False  # Cannot purchase, reward only
    reward_value: float = 0
    
    # Limits
    max_redemptions_per_pet: Optional[int] = None
    max_redemptions_per_year: Optional[int] = None
    expiry_days: Optional[int] = None
    
    # Triggers
    trigger_conditions: List[str] = []  # birthday, referral, etc.
    tier_eligibility: List[str] = ["all"]  # trial, annual, vip
    
    # Stacking
    stackable_with_coupons: bool = True
    funding_source: str = "tdc"  # tdc, partner, shared


# --- Section K: Mira AI Config ---
class MiraVisibility(BaseModel):
    """Mira AI visibility and behavior rules"""
    can_reference: bool = True
    can_suggest_proactively: bool = False
    suggestion_contexts: List[str] = []  # ["birthday_planning", "health_concern"]
    
    # Confidence
    knowledge_confidence: str = "high"  # high, medium, low
    requires_verification: bool = False  # For medical/travel claims
    
    # Rules
    safe_recommendation_rules: Optional[str] = None  # if→then logic
    escalation_triggers: List[str] = []  # When to handoff to human
    
    # Cross-sell
    upsell_items: List[str] = []  # Product IDs
    cross_sell_items: List[str] = []
    
    exclusion_reasons: List[str] = []


# --- Section L: Bundle Config ---
class BundleItem(BaseModel):
    """Item in a bundle"""
    product_id: str
    quantity: int = 1
    discount_percent: float = 0
    is_optional: bool = False
    substitution_allowed: bool = False


class BundleConfig(BaseModel):
    """Bundle configuration"""
    is_bundle: bool = False
    bundle_items: List[BundleItem] = []
    bundle_price: Optional[float] = None
    original_price: Optional[float] = None
    savings_display: Optional[str] = None  # "Save ₹500!"
    min_items_required: int = 0


# --- Section M: Pillar-Specific Config ---
class CelebrateConfig(BaseModel):
    """Celebrate pillar specifics"""
    lead_time_days: int = 2
    customization_options: List[str] = []
    message_rules: Optional[str] = None
    occasion_types: List[str] = []  # birthday, gotcha_day, etc.


class DineConfig(BaseModel):
    """Dine pillar specifics"""
    restaurant_id: Optional[str] = None
    seating_type: Optional[str] = None  # indoor, outdoor, private
    pet_policy_summary: Optional[str] = None
    reservation_required: bool = False
    max_party_size: Optional[int] = None


class StayConfig(BaseModel):
    """Stay pillar specifics"""
    property_id: Optional[str] = None
    pet_fee: float = 0
    max_pets_per_room: int = 2
    check_in_rules: Optional[str] = None
    cctv_available: bool = False
    pet_amenities: List[str] = []
    yard_access: bool = False


class TravelConfig(BaseModel):
    """Travel pillar specifics"""
    documentation_required: List[str] = []
    carrier_rules: Optional[str] = None
    crate_requirements: Optional[str] = None
    travel_mode: Optional[str] = None  # flight, train, car


class CareConfig(BaseModel):
    """Care pillar specifics"""
    service_duration_mins: Optional[int] = None
    at_home_available: bool = False
    clinic_visit_required: bool = False
    cancellation_window_hours: int = 24
    followup_required: bool = False


class EnjoyConfig(BaseModel):
    """Enjoy pillar specifics"""
    activity_type: Optional[str] = None
    energy_requirement: str = "moderate"  # low, moderate, high
    weather_dependent: bool = False
    group_activity: bool = False
    equipment_provided: bool = True


class FitConfig(BaseModel):
    """Fit pillar specifics"""
    fitness_goal: Optional[str] = None  # weight_loss, muscle, mobility
    session_type: Optional[str] = None  # assessment, training, rehab
    intensity_level: str = "moderate"
    suitability_notes: Optional[str] = None


class LearnConfig(BaseModel):
    """Learn pillar specifics"""
    content_type: Optional[str] = None  # video, article, course
    duration_mins: Optional[int] = None
    difficulty_level: str = "beginner"
    credits_attribution: Optional[str] = None
    downloadable: bool = False


class PaperworkConfig(BaseModel):
    """Paperwork pillar specifics"""
    documents_required: List[str] = []
    turnaround_time: Optional[str] = None
    template_links: List[str] = []
    government_fee_included: bool = False


class AdvisoryConfig(BaseModel):
    """Advisory pillar specifics"""
    advisory_type: Optional[str] = None  # legal, financial, behavioral
    consult_duration_mins: Optional[int] = None
    quote_based: bool = False
    intake_questions: List[str] = []


class EmergencyConfig(BaseModel):
    """Emergency pillar specifics"""
    response_time_mins: Optional[int] = None
    is_24x7: bool = False
    escalation_contacts: List[str] = []
    geo_coverage: List[str] = []  # Cities/regions covered


class FarewellConfig(BaseModel):
    """Farewell pillar specifics"""
    privacy_level: str = "private"  # private, family, memorial
    sensitive_messaging: bool = True
    service_scope: List[str] = []  # cremation, burial, memorial


class AdoptConfig(BaseModel):
    """Adopt pillar specifics"""
    eligibility_criteria: List[str] = []
    verification_steps: List[str] = []
    partner_org_id: Optional[str] = None
    adoption_fee: float = 0


class ShopConfig(BaseModel):
    """Shop pillar specifics"""
    merchandising_flags: List[str] = []
    addon_products: List[str] = []
    related_products: List[str] = []
    collection_ids: List[str] = []


class PillarConfig(BaseModel):
    """Container for all pillar-specific configs"""
    celebrate: Optional[CelebrateConfig] = None
    dine: Optional[DineConfig] = None
    stay: Optional[StayConfig] = None
    travel: Optional[TravelConfig] = None
    care: Optional[CareConfig] = None
    enjoy: Optional[EnjoyConfig] = None
    fit: Optional[FitConfig] = None
    learn: Optional[LearnConfig] = None
    paperwork: Optional[PaperworkConfig] = None
    advisory: Optional[AdvisoryConfig] = None
    emergency: Optional[EmergencyConfig] = None
    farewell: Optional[FarewellConfig] = None
    adopt: Optional[AdoptConfig] = None
    shop: Optional[ShopConfig] = None


# --- Section N: Visibility & Publishing ---
class VisibilitySettings(BaseModel):
    """Visibility and publishing controls"""
    status: str = "draft"  # draft, pending_approval, active, paused, archived
    visible_on_site: bool = True
    member_only: bool = False
    concierge_only: bool = False
    internal_only: bool = False
    
    featured: bool = False
    searchable: bool = True
    
    # Geographic
    city_visibility: List[str] = []  # Empty = all cities
    region_visibility: List[str] = []
    
    # Scheduling
    publish_date: Optional[str] = None
    unpublish_date: Optional[str] = None
    
    # Testing
    ab_test_group: Optional[str] = None


# --- Section O: Reviews (read-only aggregate) ---
class ReviewsAggregate(BaseModel):
    """Review statistics - populated by system"""
    average_rating: float = 0
    total_reviews: int = 0
    rating_distribution: Dict[str, int] = {}  # {"5": 10, "4": 5, ...}
    featured_review_id: Optional[str] = None
    nps_score: Optional[float] = None


# --- Section P: Audit ---
class AuditInfo(BaseModel):
    """Audit trail"""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: Optional[str] = None
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None
    version: int = 1
    change_log: List[Dict[str, Any]] = []


# ==================== MAIN PRODUCT MODEL ====================

class UnifiedProduct(BaseModel):
    """
    The Canonical Product Record
    ============================
    Single source of truth for all items across The Doggy Company.
    Supports: Products, Services, Experiences, Bundles, Rewards, Properties, Content
    """
    # Identity
    id: Optional[str] = None
    sku: Optional[str] = None
    product_type: str = "physical"  # physical, service, experience, bundle, reward, property, content
    primary_pillar: Optional[str] = None
    pillars: List[str] = []
    
    # Source tracking
    identity: IdentityInfo = Field(default_factory=IdentityInfo)
    
    # Core info
    name: str
    short_description: Optional[str] = None
    long_description: Optional[str] = None
    usage_context: Optional[str] = None
    key_benefits: List[str] = []
    brand: Optional[str] = None
    
    # Categorization
    category: Optional[str] = None
    subcategory: Optional[str] = None
    categories: List[str] = []     # Multi-category support (SSOT)
    tags: List[str] = []
    intelligent_tags: List[str] = []
    collections: List[str] = []
    
    # Media
    image_url: Optional[str] = None
    image_alt: Optional[str] = None
    images: List[str] = []
    thumbnail: Optional[str] = None
    video_url: Optional[str] = None
    
    # Nested configurations
    pricing: PricingInfo = Field(default_factory=PricingInfo)
    inventory: InventoryInfo = Field(default_factory=InventoryInfo)
    shipping: ShippingInfo = Field(default_factory=ShippingInfo)
    pet_safety: PetSafetyInfo = Field(default_factory=PetSafetyInfo)
    paw_rewards: PawRewardConfig = Field(default_factory=PawRewardConfig)
    mira_visibility: MiraVisibility = Field(default_factory=MiraVisibility)
    bundle: BundleConfig = Field(default_factory=BundleConfig)
    visibility: VisibilitySettings = Field(default_factory=VisibilitySettings)
    reviews: ReviewsAggregate = Field(default_factory=ReviewsAggregate)
    
    # Variants
    has_variants: bool = False
    options: List[VariantOption] = []
    variants: List[ProductVariant] = []
    
    # Pillar-specific config
    pillar_config: PillarConfig = Field(default_factory=PillarConfig)
    
    # Audit
    audit: AuditInfo = Field(default_factory=AuditInfo)
    
    # Legacy compatibility
    in_stock: bool = True
    stock_quantity: Optional[int] = None
    shopify_id: Optional[str] = None
    external_source: Optional[str] = None


class ProductFilter(BaseModel):
    """Filter options for product search"""
    product_type: Optional[str] = None
    pillar: Optional[str] = None
    status: Optional[str] = None
    reward_eligible: Optional[bool] = None
    mira_visible: Optional[bool] = None
    in_stock: Optional[bool] = None
    search: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None


# ==================== API ROUTES ====================

@product_box_router.get("/products")
async def get_all_products(
    skip: int = 0,
    limit: int = 50,
    product_type: Optional[str] = None,
    pillar: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    reward_eligible: Optional[bool] = None,
    search: Optional[str] = None,
    shipping: Optional[str] = None,
    breed: Optional[str] = None,
    size: Optional[str] = None,
    has_mira_hint: Optional[str] = None,
    source: Optional[str] = None,  # NEW: Filter by source (shopify, soul_made, manual)
    include_soul_made: bool = True  # NEW: Include Soul Made products from breed_products
):
    """Get all products with filtering - includes Soul Made products"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Build query
    query = {}
    and_conditions = []  # Use $and to combine all filter conditions safely
    
    if product_type:
        and_conditions.append({"product_type": product_type})
    if category:
        # Check both 'category' (singular) and 'categories' (array) fields
        and_conditions.append({"$or": [
            {"category": category},
            {"categories": category}
        ]})
    if pillar:
        # Check both 'pillar' (singular) and 'pillars' (array) fields
        and_conditions.append({"$or": [
            {"pillar": pillar},
            {"pillars": pillar},
            {"primary_pillar": pillar}
        ]})
    if status:
        and_conditions.append({"visibility.status": status})
    else:
        # Default: exclude archived products from admin list
        and_conditions.append({"visibility.status": {"$ne": "archived"}})
    if reward_eligible is not None:
        and_conditions.append({"paw_rewards.is_reward_eligible": reward_eligible})
    if shipping:
        if shipping == "pan-india":
            and_conditions.append({"is_pan_india_shippable": True})
        elif shipping == "local":
            and_conditions.append({"is_pan_india_shippable": {"$ne": True}})
    
    # Source filter (shopify, soul_made, manual)
    if source:
        if source == "soul_made":
            and_conditions.append({"soul_tier": "soul_made"})
        elif source == "shopify":
            and_conditions.append({"shopify_id": {"$exists": True}})
        elif source == "manual":
            and_conditions.append({"shopify_id": {"$exists": False}})
            and_conditions.append({"soul_tier": {"$ne": "soul_made"}})
    
    # Breed Intelligence Filters
    if breed:
        and_conditions.append({"$or": [
            {"breed_metadata.breeds": breed},
            {"breed_metadata.breeds": {"$size": 0}},  # Universal products
            {"breed_tags": {"$regex": breed, "$options": "i"}},
            {"breed": {"$regex": breed, "$options": "i"}}  # For soul_made products
        ]})
    if size:
        and_conditions.append({"$or": [
            {"breed_metadata.sizes": size},
            {"breed_metadata.sizes": {"$size": 0}}  # Universal products
        ]})
    if has_mira_hint:
        if has_mira_hint == "true":
            and_conditions.append({"mira_hint": {"$exists": True, "$ne": ""}})
        elif has_mira_hint == "false":
            and_conditions.append({"$or": [
                {"mira_hint": {"$exists": False}},
                {"mira_hint": ""},
                {"mira_hint": None}
            ]})
    
    if search:
        and_conditions.append({"$or": [
            {"name": {"$regex": search, "$options": "i"}},
            {"title": {"$regex": search, "$options": "i"}},
            {"id": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
            {"sub_category": {"$regex": search, "$options": "i"}},
            {"pillar": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"breed": {"$regex": search, "$options": "i"}},
            {"breed_name": {"$regex": search, "$options": "i"}}
        ]})
    
    if and_conditions:
        query = {"$and": and_conditions} if len(and_conditions) > 1 else and_conditions[0]
    
    all_products = []
    total = 0
    
    # If source is specifically soul_made, only query breed_products
    if source == "soul_made":
        breed_query = dict(query)
        breed_query.pop("soul_tier", None)  # Remove this as breed_products are all soul_made
        
        soul_products = await db.breed_products.find(
            breed_query, {"_id": 0}
        ).skip(skip).limit(limit).to_list(limit)
        
        # Normalize soul_made products to match unified schema
        for p in soul_products:
            p["source"] = "soul_made"
            p["soul_tier"] = "soul_made"
            p["image"] = p.get("mockup_url") or p.get("image", "")
        
        all_products = soul_products
        total = await db.breed_products.count_documents(breed_query)
    else:
        # Query products_master (main collection) - sorted to show newer products first
        # Products with created_at are sorted desc, others come after
        products = await db.products_master.find(
            query, {"_id": 0}
        ).sort([("created_at", -1), ("_id", -1)]).skip(skip).limit(limit).to_list(limit)
        
        products_master_total = await db.products_master.count_documents(query)
        
        # When searching, sort name-matches first for better relevance
        if search:
            search_lower = search.lower()
            products.sort(key=lambda p: (
                0 if search_lower in (p.get('name') or '').lower() else
                1 if search_lower in (p.get('id') or '').lower() else
                2
            ))
        
        # Mark source
        for p in products:
            if p.get("shopify_id"):
                p["source"] = "shopify"
            elif p.get("soul_tier") == "soul_made":
                p["source"] = "soul_made"
            else:
                p["source"] = "manual"
        
        all_products = products
        total = products_master_total
        
        # Optionally include Soul Made products from breed_products if not filtered out
        if include_soul_made and not source and len(all_products) < limit:
            remaining = limit - len(all_products)
            breed_query = {}
            if search:
                breed_query["$or"] = [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"breed": {"$regex": search, "$options": "i"}},
                    {"breed_name": {"$regex": search, "$options": "i"}}
                ]
            
            # Get soul_made products that are NOT in products_master
            soul_products = await db.breed_products.find(
                breed_query, {"_id": 0}
            ).limit(remaining).to_list(remaining)
            
            for p in soul_products:
                p["source"] = "soul_made"
                p["soul_tier"] = "soul_made"
                p["image"] = p.get("mockup_url") or p.get("image", "")
                # Only add if not already in products_master
                if not any(mp.get("id") == p.get("id") for mp in all_products):
                    all_products.append(p)
            
            breed_total = await db.breed_products.count_documents(breed_query)
            total += breed_total
    
    return {
        "products": all_products,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@product_box_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get a single product by ID"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    product = await db.products_master.find_one(
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
    existing = await db.products_master.find_one({"id": product.id})
    if existing:
        raise HTTPException(status_code=400, detail="Product ID already exists")
    
    # Set audit fields
    product_dict = product.model_dump()
    product_dict["created_by"] = admin_user
    product_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products_master.insert_one(product_dict)
    
    # Remove _id from response
    product_dict.pop("_id", None)
    
    logger.info(f"Created product: {product.id} - {product.name}")
    return {"message": "Product created", "product": product_dict}


class BulkCategoryAssign(BaseModel):
    product_ids: List[str]
    category: str
    sub_category: Optional[str] = None

# ── Bulk Category Assign — MUST be defined BEFORE /{product_id} routes ──────
@product_box_router.put("/products/bulk-assign-category")
async def bulk_assign_category(data: BulkCategoryAssign):
    """Bulk assign category (and optionally sub_category) to multiple products"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    if not data.product_ids:
        raise HTTPException(status_code=400, detail="No product IDs provided")
    if not data.category:
        raise HTTPException(status_code=400, detail="Category is required")

    update_fields = {
        "category": data.category,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if data.sub_category is not None:
        update_fields["sub_category"] = data.sub_category

    # Update in products_master (by both 'id' and 'shopify_id' fields)
    result = await db.products_master.update_many(
        {"$or": [{"id": {"$in": data.product_ids}}, {"shopify_id": {"$in": data.product_ids}}]},
        {"$set": update_fields, "$addToSet": {"categories": data.category}}
    )

    return {
        "updated": result.modified_count,
        "matched": result.matched_count,
        "category": data.category,
        "product_ids_count": len(data.product_ids)
    }


@product_box_router.put("/products/{product_id}")
async def update_product(product_id: str, updates: Dict[str, Any], admin_user: str = "system"):
    """Update a product - supports both regular and Soul Made products"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Check if it's a Soul Made product (stored in breed_products)
        if product_id.startswith("breed-"):
            existing = await db.breed_products.find_one({"id": product_id})
            if existing:
                # Don't allow changing ID
                updates.pop("id", None)
                updates.pop("_id", None)
                
                # Set audit fields
                updates["updated_at"] = datetime.now(timezone.utc).isoformat()
                updates["updated_by"] = admin_user
                
                await db.breed_products.update_one(
                    {"id": product_id},
                    {"$set": updates}
                )
                
                # Get updated product
                updated = await db.breed_products.find_one({"id": product_id}, {"_id": 0})
                updated["source"] = "soul_made"
                updated["image"] = updated.get("watercolor_image") or updated.get("cloudinary_url") or updated.get("mockup_url") or updated.get("image", "")
                
                logger.info(f"Updated Soul Made product: {product_id}")
                return {"message": "Soul Made product updated", "product": updated}
            # Not found in breed_products — fall through to products_master check below
        
        # Regular product update (try products_master first, then products collection)
        existing = await db.products_master.find_one({"id": product_id})
        collection_name = "products_master"
        if not existing:
            # Fallback: check the Shopify `products` collection (birthday cakes, etc.)
            existing = await db.products.find_one({"id": product_id})
            collection_name = "products"
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
        updates["locally_edited"] = True  # Mark as locally edited to prevent sync overwrites

        # If admin edits price, lock it against future Shopify overwrites
        manual_price = None
        if isinstance(updates.get("price"), (int, float)):
            manual_price = float(updates["price"])
        elif isinstance(updates.get("pricing"), dict):
            pricing = updates.get("pricing") or {}
            if isinstance(pricing.get("selling_price"), (int, float)):
                manual_price = float(pricing["selling_price"])
            elif isinstance(pricing.get("base_price"), (int, float)):
                manual_price = float(pricing["base_price"])

        if manual_price is not None:
            updates["price_locked"] = True
            updates["manual_price"] = manual_price
            updates["price_updated_by"] = admin_user
            updates["price_updated_at"] = datetime.now(timezone.utc).isoformat()
            updates.setdefault("pricing", {})
            updates["pricing"]["base_price"] = manual_price
            updates["pricing"]["selling_price"] = manual_price
            updates["price"] = manual_price
        
        await db[collection_name].update_one(
            {"id": product_id},
            {"$set": updates}
        )
        
        # Get updated product
        updated = await db[collection_name].find_one({"id": product_id}, {"_id": 0})
        
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
    
    # Check if it's a Soul Made product (breed_products)
    if product_id.startswith("breed-"):
        result = await db.breed_products.update_one(
            {"id": product_id},
            {"$set": {
                "archived": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Soul Made product not found")
        return {"message": "Soul Made product archived", "product_id": product_id}
    
    result = await db.products_master.update_one(
        {"id": product_id},
        {"$set": {
            "visibility.status": "archived",
            "is_active": False,
            "active": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product archived", "product_id": product_id}


@product_box_router.put("/soul-made/{product_id}")
async def update_soul_made_product(product_id: str, updates: Dict[str, Any], admin_user: str = "system"):
    """Update a Soul Made (breed) product - supports price, name, description editing"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Check if product exists in breed_products
        existing = await db.breed_products.find_one({"id": product_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Soul Made product not found")
        
        # Don't allow changing ID
        updates.pop("id", None)
        updates.pop("_id", None)
        
        # Allowed fields for Soul Made products
        allowed_fields = [
            "name", "price", "description", "tags", "category", "product_type",
            "in_stock", "pillar", "mockup_url", "image", "breed_name"
        ]
        
        # Filter to only allowed fields
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        
        # Set audit fields
        filtered_updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        filtered_updates["updated_by"] = admin_user
        
        await db.breed_products.update_one(
            {"id": product_id},
            {"$set": filtered_updates}
        )
        
        # Get updated product
        updated = await db.breed_products.find_one({"id": product_id}, {"_id": 0})
        
        logger.info(f"Updated Soul Made product: {product_id} with fields: {list(filtered_updates.keys())}")
        return {"message": "Soul Made product updated", "product": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating Soul Made product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update: {str(e)}")


# ==================== SOUL MADE - DUPLICATE TO PRODUCTION ====================

@product_box_router.post("/soul-made/{product_id}/duplicate-to-production")
async def duplicate_soul_made_to_production(product_id: str, admin_user: str = "system"):
    """
    Duplicate a Soul Made product from breed_products to products_master.
    This makes the product available for checkout via the main product catalog.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Get the Soul Made product
        soul_product = await db.breed_products.find_one({"id": product_id}, {"_id": 0})
        if not soul_product:
            raise HTTPException(status_code=404, detail="Soul Made product not found")
        
        # Check if already in production
        existing = await db.products_master.find_one({"soul_made_source_id": product_id})
        if existing:
            return {
                "message": "Product already exists in production",
                "product_id": existing.get("id"),
                "already_exists": True
            }
        
        # Create production product from Soul Made
        new_id = f"PROD-SM-{secrets.token_hex(6).upper()}"
        production_product = {
            "id": new_id,
            "sku": f"SKU-SM-{soul_product.get('breed', 'UNK')[:3].upper()}-{secrets.token_hex(4).upper()}",
            "name": soul_product.get("name"),
            "description": soul_product.get("description"),
            "price": soul_product.get("price", 0),
            "compare_at_price": soul_product.get("compare_at_price"),
            "product_type": "physical",
            "soul_tier": "soul_made",
            "soul_made_source_id": product_id,  # Link back to breed_products
            "breed": soul_product.get("breed"),
            "breed_name": soul_product.get("breed_name"),
            "category": soul_product.get("category"),
            "image": soul_product.get("mockup_url") or soul_product.get("image"),
            "images": [soul_product.get("mockup_url")] if soul_product.get("mockup_url") else [],
            "pillar": soul_product.get("pillar") or "shop",
            "pillars": soul_product.get("pillars") or ["shop"],
            "visibility": {
                "status": "active",
                "is_featured": False
            },
            "inventory": {
                "track_inventory": True,
                "quantity": soul_product.get("stock_quantity", 100),
                "allow_backorder": True
            },
            "variants": soul_product.get("variants") or [
                {"size": "S", "price": soul_product.get("price", 0), "stock": 50},
                {"size": "M", "price": soul_product.get("price", 0), "stock": 50},
                {"size": "L", "price": soul_product.get("price", 0) + 100, "stock": 50}
            ],
            "tags": soul_product.get("tags") or [soul_product.get("breed_name"), "soul_made", "personalized"],
            "in_stock": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": admin_user,
            "source": "soul_made"
        }
        
        await db.products_master.insert_one(production_product)
        
        # Update breed_products to mark as duplicated
        await db.breed_products.update_one(
            {"id": product_id},
            {"$set": {
                "duplicated_to_production": True,
                "production_product_id": new_id,
                "duplicated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Duplicated Soul Made {product_id} to production as {new_id}")
        production_product.pop("_id", None)
        
        return {
            "message": "Soul Made product duplicated to production",
            "production_product_id": new_id,
            "product": production_product
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error duplicating Soul Made to production: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PILLAR ASSIGNMENT ====================

@product_box_router.put("/soul-made/{product_id}/pillars")
async def assign_pillars_to_soul_made(product_id: str, pillars: List[str], admin_user: str = "system"):
    """Assign pillars to a Soul Made product"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Validate pillars
    valid_pillars = ["celebrate", "dine", "care", "stay", "travel", "fit", "learn", "enjoy", "shop", 
                    "paperwork", "advisory", "emergency", "farewell", "adopt"]
    invalid = [p for p in pillars if p.lower() not in valid_pillars]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid pillars: {invalid}")
    
    try:
        result = await db.breed_products.update_one(
            {"id": product_id},
            {"$set": {
                "pillars": [p.lower() for p in pillars],
                "pillar": pillars[0].lower() if pillars else "shop",
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": admin_user
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Soul Made product not found")
        
        return {"message": f"Assigned pillars: {pillars}", "product_id": product_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BulkCategoryAssign(BaseModel):
    product_ids: List[str]
    category: str
    sub_category: Optional[str] = None


# ==================== SIZE/VARIANT PRICING ====================

@product_box_router.put("/soul-made/{product_id}/variants")
async def update_soul_made_variants(product_id: str, variants: List[Dict], admin_user: str = "system"):
    """
    Update size/variant pricing for a Soul Made product.
    
    Example variants:
    [
        {"size": "S", "price": 299, "stock": 50},
        {"size": "M", "price": 349, "stock": 100},
        {"size": "L", "price": 399, "stock": 50}
    ]
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Validate variants
        for v in variants:
            if "size" not in v:
                raise HTTPException(status_code=400, detail="Each variant must have a 'size' field")
            if "price" not in v:
                raise HTTPException(status_code=400, detail="Each variant must have a 'price' field")
        
        result = await db.breed_products.update_one(
            {"id": product_id},
            {"$set": {
                "variants": variants,
                "has_variants": True,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": admin_user
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Soul Made product not found")
        
        return {"message": f"Updated {len(variants)} variants", "variants": variants}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DISCOUNT/SALE PRICE ====================

@product_box_router.put("/soul-made/{product_id}/sale")
async def set_soul_made_sale_price(
    product_id: str, 
    sale_price: float = None,
    compare_at_price: float = None,
    sale_ends_at: str = None,
    admin_user: str = "system"
):
    """
    Set sale/discount price for a Soul Made product.
    - sale_price: The discounted selling price
    - compare_at_price: The original "was" price (for showing strikethrough)
    - sale_ends_at: ISO timestamp when sale ends (optional)
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        existing = await db.breed_products.find_one({"id": product_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Soul Made product not found")
        
        update_data = {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": admin_user
        }
        
        if sale_price is not None:
            update_data["price"] = sale_price
            update_data["on_sale"] = True
        
        if compare_at_price is not None:
            update_data["compare_at_price"] = compare_at_price
        else:
            # If not provided, use current price as compare_at
            update_data["compare_at_price"] = existing.get("price")
        
        if sale_ends_at:
            update_data["sale_ends_at"] = sale_ends_at
        
        await db.breed_products.update_one({"id": product_id}, {"$set": update_data})
        
        discount_pct = 0
        if compare_at_price and sale_price:
            discount_pct = round((1 - sale_price / compare_at_price) * 100)
        
        return {
            "message": "Sale price set",
            "sale_price": sale_price,
            "compare_at_price": update_data.get("compare_at_price"),
            "discount_percentage": discount_pct,
            "sale_ends_at": sale_ends_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== STOCK MANAGEMENT ====================

@product_box_router.put("/soul-made/{product_id}/stock")
async def update_soul_made_stock(
    product_id: str,
    stock_quantity: int = None,
    in_stock: bool = None,
    low_stock_threshold: int = 10,
    admin_user: str = "system"
):
    """
    Update stock for a Soul Made product.
    - stock_quantity: Total available units
    - in_stock: Manual override (True/False)
    - low_stock_threshold: Alert when stock falls below this
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        update_data = {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": admin_user
        }
        
        if stock_quantity is not None:
            update_data["stock_quantity"] = stock_quantity
            update_data["in_stock"] = stock_quantity > 0
            update_data["low_stock"] = stock_quantity <= low_stock_threshold
        
        if in_stock is not None:
            update_data["in_stock"] = in_stock
        
        update_data["low_stock_threshold"] = low_stock_threshold
        
        result = await db.breed_products.update_one({"id": product_id}, {"$set": update_data})
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Soul Made product not found")
        
        return {
            "message": "Stock updated",
            "stock_quantity": stock_quantity,
            "in_stock": update_data.get("in_stock"),
            "low_stock": update_data.get("low_stock", False)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@product_box_router.get("/soul-made/low-stock")
async def get_low_stock_soul_made_products(threshold: int = 10):
    """Get Soul Made products with low stock"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        low_stock = await db.breed_products.find(
            {
                "$or": [
                    {"stock_quantity": {"$lte": threshold}},
                    {"low_stock": True}
                ]
            },
            {"_id": 0, "id": 1, "name": 1, "breed_name": 1, "stock_quantity": 1, "price": 1}
        ).to_list(100)
        
        return {
            "threshold": threshold,
            "count": len(low_stock),
            "products": low_stock
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@product_box_router.post("/products/{product_id}/clone")
async def clone_product(product_id: str, new_name: Optional[str] = None):
    """Clone a product for creating variants"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    original = await db.products_master.find_one({"id": product_id}, {"_id": 0})
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
    
    await db.products_master.insert_one(clone)
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
    
    result = await db.products_master.update_many(
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
    
    result = await db.products_master.update_many(
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
    
    products = await db.products_master.find(query, {"_id": 0}).to_list(200)
    
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
    
    products = await db.products_master.find(query, {"_id": 0}).to_list(100)
    
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
    
    products = await db.products_master.find(query, {"_id": 0}).to_list(100)
    
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
    
    products = await db.products_master.find(query, {"_id": 0}).to_list(100)
    
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
    """Get product statistics — fast approximate counts to avoid timeout under load"""
    import asyncio
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")

    # Use estimated_document_count for total (reads metadata, instant)
    # Use count_documents only for filtered stats, with a 5s max wait
    async def safe_count(collection, query, timeout_ms=5000):
        try:
            return await asyncio.wait_for(
                collection.count_documents(query),
                timeout=timeout_ms / 1000
            )
        except (asyncio.TimeoutError, Exception):
            return -1

    total = await db.products_master.estimated_document_count()

    active, draft, archived, reward_eligible, reward_only, mira_visible = await asyncio.gather(
        safe_count(db.products_master, {"$or": [{"is_active": True}, {"active": True}, {"visibility.status": "active"}]}),
        safe_count(db.products_master, {"$or": [{"is_active": False}, {"visibility.status": "draft"}]}),
        safe_count(db.products_master, {"visibility.status": "archived"}),
        safe_count(db.products_master, {"paw_rewards.is_reward_eligible": True}),
        safe_count(db.products_master, {"paw_rewards.is_reward_only": True}),
        safe_count(db.products_master, {"mira_visibility.can_reference": True}),
    )

    return {
        "total": total,
        "by_status": {
            "active": active,
            "draft": draft,
            "archived": archived
        },
        "by_type": {},
        "by_pillar": {},
        "rewards": {
            "eligible": reward_eligible,
            "reward_only": reward_only
        },
        "mira": {
            "visible": mira_visible,
            "suggestable": await safe_count(db.products_master, {"mira_visibility.can_suggest_proactively": True, "visibility.status": {"$ne": "archived"}})
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
    existing = await db.products_master.find({}, {"_id": 0}).to_list(5000)
    
    migrated = 0
    updated = 0
    skipped = 0
    
    for product in existing:
        product_name = product.get("title") or product.get("name")
        shopify_id = product.get("shopify_id")
        product_id = product.get("id")
        
        if not product_name:
            skipped += 1
            continue
        
        # Check if already exists in unified_products by name
        existing_unified = await db.products_master.find_one({"name": product_name})
        
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
            "pillars": [product.get("pillar", "shop")],
            "primary_pillar": product.get("pillar", "shop"),
            "image_url": product.get("image") or (product.get("images", [None])[0] if product.get("images") else None),
            "images": product.get("images", []),
            "thumbnail": product.get("image") or (product.get("images", [None])[0] if product.get("images") else None),
            
            # Pricing
            "pricing": {
                "base_price": product.get("price", 0),
                "compare_at_price": product.get("compare_at_price"),
                "cost_price": product.get("cost", 0),
                "gst_applicable": True,
                "gst_rate": product.get("gst_percent", 18),
                "hsn_code": product.get("hsn_code"),
                "price_model": "fixed",
                "currency": "INR"
            },
            
            # Inventory
            "inventory": {
                "in_stock": product.get("in_stock", True),
                "track_inventory": False,
                "stock_quantity": product.get("stock_quantity"),
                "low_stock_threshold": 5,
                "allow_backorder": False
            },
            
            # Pet Safety
            "pet_safety": {
                "species": "dog",
                "life_stages": product.get("lifestage_tags", ["all"]),
                "size_suitability": product.get("size_tags", ["all"]),
                "dietary_flags": product.get("diet_tags", []),
                "allergens": [],
                "known_exclusions": [],
                "risk_level": "safe",
                "safety_notes": None,
                "is_validated": False
            },
            
            # Paw Rewards
            "paw_rewards": {
                "points_per_rupee": 1,
                "is_redeemable": False,
                "is_reward_only": False,
                "reward_value": 0,
                "trigger_conditions": [],
                "tier_eligibility": ["all"]
            },
            
            # Mira visibility
            "mira_visibility": {
                "can_reference": True,
                "can_suggest_proactively": bool(product.get("intelligent_tags")),
                "suggestion_contexts": [],
                "knowledge_confidence": "high"
            },
            
            # Visibility
            "visibility": {
                "status": "active" if product.get("available", True) or product.get("in_stock", True) else "archived",
                "visible_on_site": True,
                "member_only": False,
                "featured": product.get("featured", False),
                "searchable": True
            },
            
            "audit": {
                "created_at": product.get("created_at") or datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "version": 1
            }
        }
        
        if existing_unified:
            # Update existing
            await db.products_master.update_one(
                {"name": product_name},
                {"$set": unified}
            )
            updated += 1
        else:
            # Insert new
            await db.products_master.insert_one(unified)
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
            await db.products_master.update_one({"id": product_id}, {"$set": product}, upsert=True)
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
            await db.products_master.update_one({"id": product_id}, {"$set": product}, upsert=True)
            stay_synced += 1
            
        # ========== SEED DEFAULT PILLAR PRODUCTS IF NONE EXIST ==========
        pillar_counts = {}
        for pillar in ['travel', 'care', 'fit', 'enjoy', 'learn']:
            count = await db.products_master.count_documents({"pillar": pillar})
            pillar_counts[pillar] = count
            
            if count == 0:
                # Seed default products for this pillar
                defaults = get_default_pillar_products(pillar)
                for p in defaults:
                    p["created_at"] = datetime.now(timezone.utc).isoformat()
                    await db.products_master.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
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
        "celebrate": [
            {"id": "celebrate-party-1", "name": "Birthday Party Planning", "description": "Complete party planning for your pet's special day", "price": 4999, "category": "party", "pillar": "celebrate", "tags": ["Celebrate", "Party", "Birthday"], "in_stock": True, "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800", "product_type": "service"},
            {"id": "celebrate-photoshoot-1", "name": "Professional Pet Photoshoot", "description": "Studio or outdoor photoshoot with professional photographer", "price": 3499, "category": "photography", "pillar": "celebrate", "tags": ["Celebrate", "Photography"], "in_stock": True, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800", "product_type": "service"},
            {"id": "celebrate-cake-consult-1", "name": "Custom Cake Consultation", "description": "One-on-one consultation to design your perfect cake", "price": 499, "category": "consultation", "pillar": "celebrate", "tags": ["Celebrate", "Cake", "Consultation"], "in_stock": True, "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800", "product_type": "service"},
            {"id": "celebrate-pawty-1", "name": "Pawty Package (Full Celebration)", "description": "Ultimate celebration - cake, treats, photoshoot & party coordination!", "price": 9999, "category": "premium", "pillar": "celebrate", "tags": ["Celebrate", "Premium", "Package"], "in_stock": True, "image": "https://images.unsplash.com/photo-1530041539828-114de669390e?w=800", "product_type": "service"},
            {"id": "celebrate-gotcha-1", "name": "Gotcha Day Celebration", "description": "Celebrate your pet's adoption anniversary", "price": 2499, "category": "gotcha", "pillar": "celebrate", "tags": ["Celebrate", "Gotcha Day", "Adoption"], "in_stock": True, "image": "https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=800", "product_type": "service"},
            {"id": "celebrate-surprise-1", "name": "Surprise Delivery Service", "description": "Send surprise treats and gifts to any pet parent!", "price": 1499, "category": "surprise", "pillar": "celebrate", "tags": ["Celebrate", "Gift", "Surprise"], "in_stock": True, "image": "https://images.unsplash.com/photo-1518882605630-8eb723e8e0b4?w=800", "product_type": "service"},
            {"id": "celebrate-milestone-1", "name": "Milestone Celebration Kit", "description": "Celebrate your pet's milestones - first walk, 1 year, achievements!", "price": 1999, "category": "milestone", "pillar": "celebrate", "tags": ["Celebrate", "Milestone"], "in_stock": True, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800", "product_type": "service"},
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


@product_box_router.get("/config/all")
async def get_all_config():
    """Get all configuration options for the product form"""
    return {
        "pillars": [
            {"id": p, "name": p.capitalize(), "icon": {
                "celebrate": "🎂", "dine": "🍽️", "stay": "🏨", "travel": "✈️",
                "care": "💊", "enjoy": "🎾", "fit": "🏃", "learn": "🎓",
                "paperwork": "📄", "advisory": "📋", "emergency": "🚨",
                "farewell": "🌈", "adopt": "🐾", "shop": "🛒"
            }.get(p, "📦")} for p in ALL_PILLARS
        ],
        "product_types": [
            {"id": "physical", "name": "Physical Product", "icon": "📦"},
            {"id": "service", "name": "Service", "icon": "🛠️"},
            {"id": "experience", "name": "Experience", "icon": "✨"},
            {"id": "bundle", "name": "Bundle", "icon": "🎁"},
            {"id": "reward", "name": "Reward", "icon": "🏆"},
            {"id": "property", "name": "Property", "icon": "🏨"},
            {"id": "content", "name": "Content", "icon": "📚"}
        ],
        "source_types": SOURCE_TYPES,
        "status_options": PRODUCT_STATUS,
        "life_stages": LIFE_STAGES,
        "size_options": SIZE_SUITABILITY,
        "species_options": SPECIES_OPTIONS,
        "dietary_flags": DIETARY_FLAGS,
        "allergens": ALLERGENS,
        "shipping_classes": SHIPPING_CLASSES,
        "risk_levels": RISK_LEVELS,
        "price_models": PRICE_MODELS,
        "gst_rates": GST_RATES,
        "membership_tiers": MEMBERSHIP_ELIGIBILITY,
        "reward_triggers": REWARD_TRIGGERS,
        "pillar_fields": {
            "celebrate": ["lead_time_days", "customization_options", "message_rules", "occasion_types"],
            "dine": ["restaurant_id", "seating_type", "pet_policy_summary", "reservation_required", "max_party_size"],
            "stay": ["property_id", "pet_fee", "max_pets_per_room", "check_in_rules", "cctv_available", "pet_amenities"],
            "travel": ["documentation_required", "carrier_rules", "crate_requirements", "travel_mode"],
            "care": ["service_duration_mins", "at_home_available", "clinic_visit_required", "cancellation_window_hours"],
            "enjoy": ["activity_type", "energy_requirement", "weather_dependent", "group_activity"],
            "fit": ["fitness_goal", "session_type", "intensity_level", "suitability_notes"],
            "learn": ["content_type", "duration_mins", "difficulty_level", "credits_attribution"],
            "paperwork": ["documents_required", "turnaround_time", "template_links"],
            "advisory": ["advisory_type", "consult_duration_mins", "quote_based", "intake_questions"],
            "emergency": ["response_time_mins", "is_24x7", "escalation_contacts", "geo_coverage"],
            "farewell": ["privacy_level", "sensitive_messaging", "service_scope"],
            "adopt": ["eligibility_criteria", "verification_steps", "partner_org_id", "adoption_fee"],
            "shop": ["merchandising_flags", "addon_products", "related_products", "collection_ids"]
        }
    }


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
    
    collection = db.products_master
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
    
    collection = db.products_master
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


# ==================== CSV EXPORT ====================

@product_box_router.get("/export/csv")
async def export_products_csv(
    pillar: Optional[str] = None,
    category: Optional[str] = None,
    include_all_fields: bool = Query(default=False, description="Include all schema fields")
):
    """
    Export products to CSV with comprehensive schema fields.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {}
    if pillar:
        query["$or"] = [
            {"primary_pillar": pillar},
            {"pillars": pillar},
            {"pillars_occasions.pillar.primary_pillar": pillar}
        ]
    if category:
        query["$or"] = query.get("$or", []) + [
            {"category": category},
            {"commerce_ops.category": category}
        ]
    
    products = await db.products_master.find(query, {"_id": 0}).to_list(length=10000)
    
    # Define CSV columns
    basic_columns = [
        'id', 'sku', 'name', 'brand', 'product_type', 
        'primary_pillar', 'pillars', 'category', 'subcategory',
        'mrp', 'selling_price', 'cost_price', 'margin_band',
        'inventory_status', 'in_stock', 'is_bakery_product',
        'mira_recommendable', 'mira_hint',
        'life_stages', 'size_options', 'applicable_breeds',
        'occasions', 'use_case_tags',
        'image', 'tags'
    ]
    
    all_columns = basic_columns + [
        'short_description', 'long_description',
        'gst_rate', 'hsn_code', 'delivery_type',
        'returnable', 'cold_chain_required', 'fragile',
        'available_cities', 'quality_tier', 'approval_status',
        'allergy_aware', 'common_avoids', 'material_safety_flags',
        'energy_level_match', 'chew_strength', 'play_types',
        'coat_type_match', 'brachycephalic_friendly', 'senior_friendly',
        'is_giftable', 'subscription_friendly', 'travel_friendly',
        'breed_metadata', 'intelligent_tags'
    ]
    
    columns = all_columns if include_all_fields else basic_columns
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=columns, extrasaction='ignore')
    writer.writeheader()
    
    for product in products:
        row = {}
        for col in columns:
            # Handle nested fields
            if col == 'mrp':
                row[col] = product.get('mrp') or product.get('commerce_ops', {}).get('pricing', {}).get('mrp', 0)
            elif col == 'selling_price':
                row[col] = product.get('price') or product.get('commerce_ops', {}).get('pricing', {}).get('selling_price', 0)
            elif col == 'cost_price':
                row[col] = product.get('commerce_ops', {}).get('pricing', {}).get('cost_price', '')
            elif col == 'margin_band':
                row[col] = product.get('commerce_ops', {}).get('pricing', {}).get('margin_band', '')
            elif col == 'inventory_status':
                row[col] = product.get('commerce_ops', {}).get('inventory', {}).get('inventory_status', 'in_stock')
            elif col == 'mira_recommendable':
                row[col] = product.get('mira_ai', {}).get('mira', {}).get('mira_recommendable', True)
            elif col == 'mira_hint':
                row[col] = product.get('mira_hint') or product.get('mira_ai', {}).get('ai_enrichment', {}).get('mira_hint', '')
            elif col == 'life_stages':
                stages = product.get('suitability', {}).get('pet_filters', {}).get('life_stages', [])
                row[col] = ','.join(stages) if isinstance(stages, list) else stages
            elif col == 'size_options':
                sizes = product.get('suitability', {}).get('pet_filters', {}).get('size_options', [])
                row[col] = ','.join(sizes) if isinstance(sizes, list) else sizes
            elif col == 'applicable_breeds':
                breeds = product.get('suitability', {}).get('pet_filters', {}).get('applicable_breeds', [])
                row[col] = ','.join(breeds) if isinstance(breeds, list) else breeds
            elif col == 'occasions':
                occasions = product.get('pillars_occasions', {}).get('occasion', {}).get('occasions', [])
                row[col] = ','.join(occasions) if isinstance(occasions, list) else occasions
            elif col == 'use_case_tags':
                tags = product.get('pillars_occasions', {}).get('use_case', {}).get('use_case_tags', [])
                row[col] = ','.join(tags) if isinstance(tags, list) else tags
            elif col == 'pillars':
                pillars = product.get('pillars', [])
                row[col] = ','.join(pillars) if isinstance(pillars, list) else pillars
            elif col == 'tags':
                tags = product.get('tags', [])
                row[col] = ','.join(tags) if isinstance(tags, list) else tags
            elif col == 'image':
                row[col] = product.get('image') or product.get('media', {}).get('primary_image', '')
            elif col == 'breed_metadata':
                bm = product.get('breed_metadata') or product.get('mira_ai', {}).get('ai_enrichment', {}).get('breed_metadata')
                row[col] = str(bm) if bm else ''
            elif col == 'intelligent_tags':
                it = product.get('intelligent_tags', []) or product.get('mira_ai', {}).get('ai_enrichment', {}).get('intelligent_tags', [])
                row[col] = ','.join(it) if isinstance(it, list) else it
            elif col == 'available_cities':
                cities = product.get('commerce_ops', {}).get('fulfillment', {}).get('available_cities', [])
                row[col] = ','.join(cities) if isinstance(cities, list) else cities
            elif col == 'common_avoids':
                avoids = product.get('suitability', {}).get('safety', {}).get('common_avoids', [])
                row[col] = ','.join(avoids) if isinstance(avoids, list) else avoids
            elif col == 'material_safety_flags':
                flags = product.get('suitability', {}).get('safety', {}).get('material_safety_flags', [])
                row[col] = ','.join(flags) if isinstance(flags, list) else flags
            elif col == 'energy_level_match':
                energy = product.get('suitability', {}).get('behavior', {}).get('energy_level_match', [])
                row[col] = ','.join(energy) if isinstance(energy, list) else energy
            elif col == 'chew_strength':
                row[col] = product.get('suitability', {}).get('behavior', {}).get('chew_strength', '')
            elif col == 'play_types':
                play = product.get('suitability', {}).get('behavior', {}).get('play_types', [])
                row[col] = ','.join(play) if isinstance(play, list) else play
            elif col == 'coat_type_match':
                coat = product.get('suitability', {}).get('physical_traits', {}).get('coat_type_match', [])
                row[col] = ','.join(coat) if isinstance(coat, list) else coat
            elif col == 'brachycephalic_friendly':
                row[col] = product.get('suitability', {}).get('physical_traits', {}).get('brachycephalic_friendly', True)
            elif col == 'senior_friendly':
                row[col] = product.get('suitability', {}).get('physical_traits', {}).get('senior_friendly', True)
            elif col == 'allergy_aware':
                row[col] = product.get('suitability', {}).get('safety', {}).get('allergy_aware', False)
            elif col == 'is_giftable':
                row[col] = product.get('pillars_occasions', {}).get('use_case', {}).get('is_giftable', False)
            elif col == 'subscription_friendly':
                row[col] = product.get('pillars_occasions', {}).get('use_case', {}).get('subscription_friendly', False)
            elif col == 'travel_friendly':
                row[col] = product.get('pillars_occasions', {}).get('use_case', {}).get('travel_friendly', False)
            elif col == 'gst_rate':
                row[col] = product.get('commerce_ops', {}).get('pricing', {}).get('gst_rate', 18)
            elif col == 'hsn_code':
                row[col] = product.get('commerce_ops', {}).get('pricing', {}).get('hsn_code', '')
            elif col == 'delivery_type':
                row[col] = product.get('commerce_ops', {}).get('fulfillment', {}).get('delivery_type', 'ship')
            elif col == 'returnable':
                row[col] = product.get('commerce_ops', {}).get('fulfillment', {}).get('returnable', True)
            elif col == 'cold_chain_required':
                row[col] = product.get('commerce_ops', {}).get('fulfillment', {}).get('cold_chain_required', False)
            elif col == 'fragile':
                row[col] = product.get('commerce_ops', {}).get('fulfillment', {}).get('fragile', False)
            elif col == 'quality_tier':
                row[col] = product.get('commerce_ops', {}).get('quality_tier', 'standard')
            elif col == 'approval_status':
                row[col] = product.get('commerce_ops', {}).get('approval_status', 'live')
            elif col == 'short_description':
                row[col] = product.get('basics', {}).get('short_description', '') or product.get('short_description', '')
            elif col == 'long_description':
                row[col] = product.get('basics', {}).get('long_description', '') or product.get('description', '')
            else:
                row[col] = product.get(col, '')
        
        writer.writerow(row)
    
    output.seek(0)
    
    filename = f"products_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@product_box_router.get("/stats/comprehensive")
async def get_comprehensive_stats():
    """Get comprehensive statistics about the product catalog."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    total = await db.products_master.count_documents({})
    
    # By pillar
    pillar_pipeline = [
        {"$group": {"_id": "$primary_pillar", "count": {"$sum": 1}}}
    ]
    pillar_stats = {doc["_id"]: doc["count"] for doc in await db.products_master.aggregate(pillar_pipeline).to_list(None) if doc["_id"]}
    
    # By category
    category_pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    category_stats = {doc["_id"]: doc["count"] for doc in await db.products_master.aggregate(category_pipeline).to_list(None) if doc["_id"]}
    
    # Intelligence stats
    with_mira_hint = await db.products_master.count_documents({"mira_hint": {"$exists": True, "$ne": ""}})
    with_breed_metadata = await db.products_master.count_documents({"breed_metadata": {"$exists": True}})
    bakery_products = await db.products_master.count_documents({"is_bakery_product": True})
    
    # Schema v2 stats
    enhanced_v2 = await db.products_master.count_documents({"_schema_version": "2.0"})
    
    return {
        "total_products": total,
        "by_pillar": pillar_stats,
        "by_category": dict(sorted(category_stats.items(), key=lambda x: x[1], reverse=True)[:15]),
        "intelligence": {
            "with_mira_hint": with_mira_hint,
            "with_breed_metadata": with_breed_metadata,
            "bakery_products": bakery_products,
            "enhanced_v2_schema": enhanced_v2
        },
        "data_quality": {
            "mira_hint_coverage": f"{(with_mira_hint/total*100):.1f}%" if total > 0 else "0%",
            "breed_data_coverage": f"{(with_breed_metadata/total*100):.1f}%" if total > 0 else "0%",
            "v2_schema_coverage": f"{(enhanced_v2/total*100):.1f}%" if total > 0 else "0%"
        }
    }

