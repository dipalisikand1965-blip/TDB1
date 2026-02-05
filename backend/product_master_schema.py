"""
Product Master Schema - The Doggy Company
==========================================
Single Source of Truth for ALL products across the Pet OS.

Organized into logical tabs:
1. BASICS - Identity, naming, descriptions
2. SUITABILITY - Pet filters, behavior, physical traits
3. PILLARS & OCCASIONS - Life moments, use cases
4. COMMERCE & OPS - Pricing, inventory, fulfillment
5. MEDIA - Images, videos
6. MIRA & AI - Recommendations, intelligence

Author: TDC Engineering
Version: 2.0
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum

# ==================== ENUMS & CONSTANTS ====================

# --- Life Stage ---
LIFE_STAGES = ["puppy", "adult", "senior", "all"]

# --- Size Categories ---
SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "all"]

# --- Species ---
SPECIES_OPTIONS = ["dog", "cat", "both"]

# --- Pillars (14 total) ---
ALL_PILLARS = [
    "celebrate", "dine", "stay", "travel", "care",
    "enjoy", "fit", "learn", "paperwork", "advisory",
    "emergency", "farewell", "adopt", "shop"
]

# --- Occasions ---
OCCASIONS = [
    "birthday", "gotcha_day", "new_puppy", "travel", "recovery",
    "monsoon", "winter", "summer", "first_groom", "training_start",
    "senior_comfort", "adoption_day", "anniversary", "graduation",
    "vaccination_day", "spa_day", "party", "holiday"
]

# --- Use Case Tags ---
USE_CASE_TAGS = [
    "giftable", "subscription_friendly", "travel_friendly",
    "indoor", "outdoor", "quick_fix", "routine_essential",
    "impulse_buy", "premium_gift", "everyday_essential"
]

# --- Energy Levels ---
ENERGY_LEVELS = ["low", "medium", "high", "all"]

# --- Chew Strength (for toys) ---
CHEW_STRENGTHS = ["gentle", "moderate", "power_chewer", "indestructible"]

# --- Play Types ---
PLAY_TYPES = ["fetch", "tug", "chew", "puzzle", "comfort", "training", "water", "interactive"]

# --- Coat Types ---
COAT_TYPES = ["short", "medium", "long", "double_coat", "hairless", "curly", "wire"]

# --- Common Allergens/Avoids ---
COMMON_AVOIDS = [
    "chicken", "beef", "dairy", "gluten", "latex", "artificial_dyes",
    "pork", "fish", "eggs", "soy", "corn", "wheat", "preservatives"
]

# --- Material Safety ---
MATERIAL_SAFETY_FLAGS = [
    "non_toxic", "bpa_free", "food_grade", "organic", "eco_friendly",
    "hypoallergenic", "latex_free", "phthalate_free"
]

# --- Quality Tiers ---
QUALITY_TIERS = ["standard", "premium", "veterinary", "handcrafted", "artisan", "luxury"]

# --- Inventory Status ---
INVENTORY_STATUS = ["in_stock", "low_stock", "out_of_stock", "preorder", "discontinued"]

# --- Delivery Types ---
DELIVERY_TYPES = ["ship", "same_day", "local_partner", "pickup_only", "digital"]

# --- Approval Status ---
APPROVAL_STATUS = ["draft", "pending_review", "approved", "live", "paused", "archived"]

# --- Categories (Main) ---
MAIN_CATEGORIES = [
    "toys", "treats", "accessories", "apparel", "party", "bowls",
    "grooming_tools", "beds", "carriers", "leashes", "collars",
    "food", "supplements", "healthcare", "training", "travel_gear"
]


# ==================== TAB 1: BASICS ====================

class BasicsInfo(BaseModel):
    """Tab 1: Basic product identity"""
    
    # Identity
    id: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None  # UPC/EAN
    
    # Naming
    name: str
    display_name: Optional[str] = None  # For card display
    short_description: Optional[str] = None  # 100-140 chars
    long_description: Optional[str] = None  # Full description
    
    # Brand & Source
    brand: Optional[str] = None
    vendor: Optional[str] = None
    manufacturer: Optional[str] = None
    country_of_origin: Optional[str] = None
    
    # External References
    shopify_id: Optional[str] = None
    shopify_handle: Optional[str] = None
    external_source: Optional[str] = None  # manual, shopify, partner, import
    source_url: Optional[str] = None
    
    # Product Type
    product_type: str = "physical"  # physical, service, experience, bundle, reward, digital
    is_service: bool = False
    is_bundle: bool = False
    is_bakery_product: bool = False  # TDB Bakery Division


# ==================== TAB 2: SUITABILITY ====================

class PetFilters(BaseModel):
    """Who the product is for"""
    
    # Species & Life Stage
    species: List[str] = ["dog"]
    life_stages: List[str] = ["all"]
    
    # Size
    size_options: List[str] = ["all"]  # XS, S, M, L, XL
    weight_range_min_kg: Optional[float] = None
    weight_range_max_kg: Optional[float] = None
    
    # Breed
    breed_applicability: str = "all"  # "all" or "selected"
    applicable_breeds: List[str] = []
    excluded_breeds: List[str] = []


class BehaviorSuitability(BaseModel):
    """Behavior and play style match"""
    
    # Energy & Activity
    energy_level_match: List[str] = ["all"]  # low, medium, high
    
    # Toys specific
    chew_strength: Optional[str] = None  # gentle, moderate, power_chewer
    play_types: List[str] = []  # fetch, tug, chew, puzzle, comfort
    
    # Activity
    indoor_suitable: bool = True
    outdoor_suitable: bool = True
    water_safe: bool = False


class PhysicalTraitsSuitability(BaseModel):
    """Body type and physical traits"""
    
    # Coat
    coat_type_match: List[str] = []  # short, medium, long, double_coat
    
    # Special needs
    brachycephalic_friendly: bool = True  # Safe for flat-face breeds
    senior_friendly: bool = True
    puppy_safe: bool = True
    
    # Accessibility
    easy_grip: bool = False
    low_impact: bool = False
    soft_texture: bool = False


class SafetyInfo(BaseModel):
    """Safety and allergen information"""
    
    # Allergy awareness
    allergy_aware: bool = False
    common_avoids: List[str] = []  # chicken, beef, dairy, gluten, etc.
    
    # Material safety
    material_safety_flags: List[str] = []  # non_toxic, bpa_free, food_grade
    
    # Dietary (for treats/food)
    is_grain_free: bool = False
    is_single_protein: bool = False
    is_vegetarian: bool = False
    is_human_grade: bool = False
    
    # Ingredients
    ingredients: List[str] = []
    main_protein: Optional[str] = None
    
    # Supervision
    supervision_required: bool = False
    safety_notes: Optional[str] = None


class SuitabilityInfo(BaseModel):
    """Tab 2: Complete suitability configuration"""
    
    pet_filters: PetFilters = Field(default_factory=PetFilters)
    behavior: BehaviorSuitability = Field(default_factory=BehaviorSuitability)
    physical_traits: PhysicalTraitsSuitability = Field(default_factory=PhysicalTraitsSuitability)
    safety: SafetyInfo = Field(default_factory=SafetyInfo)


# ==================== TAB 3: PILLARS & OCCASIONS ====================

class PillarConfig(BaseModel):
    """Pillar mapping for Pet OS"""
    
    # Primary pillar (single select)
    primary_pillar: Optional[str] = None
    
    # Secondary pillars (multi-select)
    secondary_pillars: List[str] = []
    
    # Cross-pillar flag
    is_cross_pillar: bool = False


class OccasionConfig(BaseModel):
    """Life moments and occasions"""
    
    # Occasions (multi-select)
    occasions: List[str] = []
    
    # Seasonal
    seasonality: List[str] = []  # summer, winter, monsoon, all_year
    
    # Special days
    is_birthday_relevant: bool = False
    is_gotcha_day_relevant: bool = False
    is_holiday_special: bool = False


class UseCaseConfig(BaseModel):
    """Use case and purpose tags"""
    
    # Use cases
    use_case_tags: List[str] = []
    
    # Gifting
    is_giftable: bool = False
    gift_wrap_available: bool = False
    
    # Subscription
    subscription_friendly: bool = False
    autoship_eligible: bool = False
    
    # Travel
    travel_friendly: bool = False
    tsa_approved: bool = False  # For carriers


class PillarsOccasionsInfo(BaseModel):
    """Tab 3: Complete pillars and occasions"""
    
    pillar: PillarConfig = Field(default_factory=PillarConfig)
    occasion: OccasionConfig = Field(default_factory=OccasionConfig)
    use_case: UseCaseConfig = Field(default_factory=UseCaseConfig)


# ==================== TAB 4: COMMERCE & OPS ====================

class PricingInfo(BaseModel):
    """Pricing configuration"""
    
    # Core prices
    mrp: float = 0  # Maximum Retail Price
    selling_price: float = 0  # Actual selling price
    cost_price: Optional[float] = None  # For margin calculation
    
    # Calculated (auto)
    margin_percent: Optional[float] = None  # Auto-calculated
    margin_band: Optional[str] = None  # low, medium, high, premium
    
    # Compare at
    compare_at_price: Optional[float] = None
    discount_percent: Optional[float] = None
    
    # Tax
    gst_applicable: bool = True
    gst_rate: float = 18.0  # 0, 5, 12, 18, 28
    hsn_code: Optional[str] = None
    price_includes_gst: bool = False
    
    # Currency
    currency: str = "INR"


class InventoryInfo(BaseModel):
    """Inventory management"""
    
    # Status
    inventory_status: str = "in_stock"  # in_stock, low_stock, out_of_stock, preorder
    
    # Tracking
    track_inventory: bool = False
    stock_quantity: Optional[int] = None
    low_stock_threshold: int = 5
    allow_backorder: bool = False
    
    # Location
    warehouse_location: Optional[str] = None
    reserved_quantity: int = 0
    
    # Perishables
    is_perishable: bool = False
    batch_tracking: bool = False
    expiry_date: Optional[str] = None
    shelf_life_days: Optional[int] = None


class FulfillmentInfo(BaseModel):
    """Shipping and fulfillment"""
    
    # Delivery type
    delivery_type: str = "ship"  # ship, same_day, local_partner, pickup_only
    requires_shipping: bool = True
    
    # Availability
    is_pan_india: bool = False
    available_cities: List[str] = []  # ["bangalore", "delhi", "mumbai"]
    excluded_pincodes: List[str] = []
    
    # Dimensions
    weight_grams: Optional[int] = None
    length_cm: Optional[float] = None
    width_cm: Optional[float] = None
    height_cm: Optional[float] = None
    
    # Special handling
    cold_chain_required: bool = False
    fragile: bool = False
    temperature_sensitive: bool = False
    
    # Timing
    preparation_time_days: int = 1
    dispatch_sla_hours: int = 48
    delivery_sla_days: int = 5
    
    # Policies
    returnable: bool = True
    return_window_days: int = 7
    exchange_only: bool = False


class CommerceOpsInfo(BaseModel):
    """Tab 4: Complete commerce and operations"""
    
    # Categorization
    category: Optional[str] = None
    subcategory: Optional[str] = None
    taxonomy_path: Optional[str] = None  # "Shop > Treats > Birthday"
    
    # Quality
    quality_tier: str = "standard"  # standard, premium, veterinary, handcrafted
    
    # Approval
    approval_status: str = "draft"  # draft, pending_review, approved, live, paused
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    
    # Nested configs
    pricing: PricingInfo = Field(default_factory=PricingInfo)
    inventory: InventoryInfo = Field(default_factory=InventoryInfo)
    fulfillment: FulfillmentInfo = Field(default_factory=FulfillmentInfo)
    
    # Tags
    tags: List[str] = []
    internal_tags: List[str] = []  # Not shown to users


# ==================== TAB 5: MEDIA ====================

class MediaInfo(BaseModel):
    """Tab 5: Media assets"""
    
    # Primary image
    primary_image: Optional[str] = None
    primary_image_alt: Optional[str] = None
    
    # Gallery
    images: List[str] = []
    thumbnail: Optional[str] = None  # Auto-generated if not provided
    
    # Video
    video_url: Optional[str] = None
    video_thumbnail: Optional[str] = None
    
    # Documents
    document_urls: List[str] = []
    size_guide_url: Optional[str] = None
    
    # Quality flags (auto-calculated)
    image_count: int = 0
    image_completeness: str = "incomplete"  # incomplete (0), partial (1), complete (2+)
    has_lifestyle_image: bool = False
    has_size_reference: bool = False


# ==================== TAB 6: MIRA & AI ====================

class MiraConfig(BaseModel):
    """Mira AI configuration"""
    
    # Visibility
    mira_recommendable: bool = True  # Kill-switch
    can_reference: bool = True
    can_suggest_proactively: bool = False
    
    # Service handling
    handled_by_mira: bool = False  # For service-like products/bundles
    requires_concierge: bool = False
    
    # Context
    suggestion_contexts: List[str] = []  # ["birthday_planning", "health_concern"]
    exclusion_reasons: List[str] = []
    
    # Confidence
    knowledge_confidence: str = "high"  # high, medium, low
    requires_verification: bool = False
    
    # Cross-sell
    upsell_items: List[str] = []
    cross_sell_items: List[str] = []
    
    # Escalation
    escalation_triggers: List[str] = []


class AIEnrichment(BaseModel):
    """AI-generated content"""
    
    # Mira hint
    mira_hint: Optional[str] = None
    mira_hint_generated_at: Optional[str] = None
    
    # Breed metadata (AI-seeded)
    breed_metadata: Optional[Dict[str, Any]] = None
    
    # AI tags
    intelligent_tags: List[str] = []
    ai_processed_at: Optional[str] = None
    
    # Search
    search_keywords: List[str] = []
    enhanced_description: Optional[str] = None


class MiraAIInfo(BaseModel):
    """Tab 6: Complete Mira and AI configuration"""
    
    mira: MiraConfig = Field(default_factory=MiraConfig)
    ai_enrichment: AIEnrichment = Field(default_factory=AIEnrichment)


# ==================== VARIANTS ====================

class VariantOption(BaseModel):
    """Product option definition"""
    name: str  # e.g., "Size", "Flavor"
    position: int = 1
    values: List[str] = []


class ProductVariant(BaseModel):
    """Individual variant"""
    id: Optional[str] = None
    title: str
    sku: Optional[str] = None
    price: float = 0
    compare_at_price: Optional[float] = None
    option1: Optional[str] = None
    option2: Optional[str] = None
    option3: Optional[str] = None
    available: bool = True
    inventory_quantity: int = 0
    weight: Optional[float] = None


# ==================== PAW REWARDS ====================

class PawRewardsConfig(BaseModel):
    """Paw Rewards integration"""
    
    # Earning
    points_per_rupee: float = 1.0
    bonus_points: int = 0
    
    # Redemption
    is_redeemable: bool = False
    points_required: Optional[int] = None
    is_reward_only: bool = False
    
    # Limits
    max_redemptions_per_pet: Optional[int] = None
    expiry_days: Optional[int] = None
    
    # Triggers
    trigger_conditions: List[str] = []


# ==================== REVIEWS ====================

class ReviewsAggregate(BaseModel):
    """Review statistics"""
    average_rating: float = 0
    total_reviews: int = 0
    rating_distribution: Dict[str, int] = {}
    featured_review_id: Optional[str] = None
    paw_score: Optional[float] = None


# ==================== AUDIT ====================

class AuditInfo(BaseModel):
    """Audit trail"""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: Optional[str] = None
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None
    version: int = 1


# ==================== MAIN PRODUCT MODEL ====================

class ProductMaster(BaseModel):
    """
    THE CANONICAL PRODUCT RECORD
    ============================
    Single source of truth for ALL items across The Doggy Company.
    
    Organized into 6 tabs:
    1. basics - Identity, naming, descriptions
    2. suitability - Pet filters, behavior, physical traits, safety
    3. pillars_occasions - Pillar mapping, occasions, use cases
    4. commerce_ops - Pricing, inventory, fulfillment, categories
    5. media - Images, videos, documents
    6. mira_ai - Mira config, AI enrichment
    """
    
    # Tab 1: Basics
    basics: BasicsInfo = Field(default_factory=BasicsInfo)
    
    # Tab 2: Suitability
    suitability: SuitabilityInfo = Field(default_factory=SuitabilityInfo)
    
    # Tab 3: Pillars & Occasions
    pillars_occasions: PillarsOccasionsInfo = Field(default_factory=PillarsOccasionsInfo)
    
    # Tab 4: Commerce & Ops
    commerce_ops: CommerceOpsInfo = Field(default_factory=CommerceOpsInfo)
    
    # Tab 5: Media
    media: MediaInfo = Field(default_factory=MediaInfo)
    
    # Tab 6: Mira & AI
    mira_ai: MiraAIInfo = Field(default_factory=MiraAIInfo)
    
    # Variants (separate section)
    has_variants: bool = False
    options: List[VariantOption] = []
    variants: List[ProductVariant] = []
    
    # Paw Rewards
    paw_rewards: PawRewardsConfig = Field(default_factory=PawRewardsConfig)
    
    # Reviews (read-only)
    reviews: ReviewsAggregate = Field(default_factory=ReviewsAggregate)
    
    # Audit
    audit: AuditInfo = Field(default_factory=AuditInfo)
    
    # Legacy compatibility (flat fields for backward compat)
    id: Optional[str] = None
    name: Optional[str] = None
    price: Optional[float] = None
    in_stock: bool = True


# ==================== FILTER PRESETS ====================

# The 12 "Must-Have" Filters
MUST_HAVE_FILTERS = [
    "life_stage",
    "size_weight_range",
    "breed_applicability",
    "chew_strength",
    "coat_type_match",
    "allergy_aware_avoids",
    "material_safety_flags",
    "primary_secondary_pillars",
    "occasion_tags",
    "city_availability_shippable",
    "inventory_status",
    "mira_recommendable_approval_status"
]


def calculate_margin_band(selling_price: float, cost_price: float) -> str:
    """Auto-calculate margin band"""
    if cost_price <= 0:
        return "unknown"
    margin_percent = ((selling_price - cost_price) / cost_price) * 100
    if margin_percent < 20:
        return "low"
    elif margin_percent < 40:
        return "medium"
    elif margin_percent < 60:
        return "high"
    else:
        return "premium"


def calculate_image_completeness(image_count: int) -> str:
    """Auto-calculate image completeness"""
    if image_count == 0:
        return "incomplete"
    elif image_count == 1:
        return "partial"
    else:
        return "complete"
