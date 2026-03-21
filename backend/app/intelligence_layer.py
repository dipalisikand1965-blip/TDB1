"""
Intelligence Layer - Curated Set Generator
==========================================

The brain behind "Picks for {Pet}" feature.
Generates personalized product + service recommendations based on:
- Soul traits (personality)
- Breed characteristics
- Size considerations
- Known allergies (SAFETY FIRST - filtered before any other logic)
- Event proximity (birthday, gotcha day)
- User's current intent/context

Architecture:
- Curated sets are generated dynamically but cached for consistency
- Cache key: {pet_id}:{pillar}:{intent_hash}
- Cache TTL: 30 minutes
- All UI surfaces (pillar page, FAB modal) see the same picks within the window

Content Buckets for Celebrate Pillar:
- Products (4-6 items): Cakes/Treats (2), Decor/Photo props (2), Keepsakes/Add-ons (1-2)
- Services (2-3 items): Selected from service_cards.py based on pet fit
- Question Card (0-1): Only if pet profile is "thin" (missing key data)
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
import hashlib
import logging
import os
import sys

# Add backend directory to path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

CACHE_TTL_MINUTES = 30
DEFAULT_PRODUCTS_COUNT = 5
DEFAULT_SERVICES_COUNT = 3

# Celebrate pillar product buckets
CELEBRATE_PRODUCT_BUCKETS = {
    "cakes_treats": {
        "tags": ["cake", "birthday_cake", "treat", "pupcake", "celebration_treat"],
        "min": 2,
        "max": 3,
        "priority": 1
    },
    "decor_photo": {
        "tags": ["decoration", "photo_prop", "party_decor", "banner", "hat", "costume"],
        "min": 1,
        "max": 2,
        "priority": 2
    },
    "keepsakes_addons": {
        "tags": ["keepsake", "gift", "hamper", "accessory", "toy"],
        "min": 1,
        "max": 2,
        "priority": 3
    }
}

# Known allergens mapping (ingredient -> common names)
ALLERGEN_MAPPINGS = {
    "chicken": ["chicken", "poultry", "fowl"],
    "beef": ["beef", "cow", "cattle", "meat"],
    "grain": ["grain", "wheat", "corn", "rice", "barley", "oats"],
    "dairy": ["dairy", "milk", "cheese", "lactose", "cream"],
    "egg": ["egg", "eggs"],
    "soy": ["soy", "soybean", "soya"],
    "fish": ["fish", "salmon", "tuna", "cod"],
    "pork": ["pork", "ham", "bacon", "pig"],
    "lamb": ["lamb", "mutton", "sheep"],
    "gluten": ["gluten", "wheat", "barley", "rye"],
}

# Soul trait to product preference mappings
SOUL_PRODUCT_AFFINITY = {
    "elegant": ["premium", "luxury", "designer", "minimalist"],
    "playful": ["fun", "colorful", "interactive", "toy"],
    "foodie": ["treat", "snack", "gourmet", "cake"],
    "photo_ready": ["costume", "accessory", "prop", "backdrop"],
    "pampered": ["premium", "spa", "luxury", "gift"],
    "energetic": ["interactive", "ball", "frisbee", "activity"],
    "calm": ["comfort", "soothing", "gentle", "soft"],
    "social": ["party", "group", "shareable"],
}

# Profile completeness thresholds
THIN_PROFILE_THRESHOLDS = {
    "missing_traits": 3,  # If < 3 traits known, profile is thin
    "required_fields": ["breed", "size"],  # Must have these
}

# Questions to ask for thin profiles (celebrate pillar)
CELEBRATE_THIN_PROFILE_QUESTIONS = [
    {
        "id": "party_style",
        "question": "What style celebration would {pet_name} love?",
        "options": ["Playful & colorful", "Elegant & minimal", "Outdoor adventure"],
        "maps_to_trait": "party_preference",
        "icon": "🎉"
    },
    {
        "id": "treat_preference",
        "question": "How does {pet_name} feel about treats?",
        "options": ["Lives for them!", "Picky eater", "Health-conscious only"],
        "maps_to_trait": "treat_motivation",
        "icon": "🍰"
    }
]



# ═══════════════════════════════════════════════════════════════════════════════
# TRAIT DERIVATION - Extract traits from multiple pet data sources
# ═══════════════════════════════════════════════════════════════════════════════

def derive_traits_from_pet_data(pet_data: Dict) -> List[str]:
    """
    Derive soul traits from multiple sources in the pet data.
    Priority: soul_traits > doggy_soul_answers > personality > temperament
    
    Returns:
        List of traits (e.g., ["playful", "anxious", "foodie"])
    """
    traits = []
    
    # 1. Direct soul_traits (highest priority)
    if pet_data.get("soul_traits"):
        traits.extend(pet_data["soul_traits"])
    
    # 2. Doggy Soul Answers - extract personality markers
    doggy_soul = pet_data.get("doggy_soul_answers") or {}
    if doggy_soul:
        # Map common answers to traits
        for key, value in doggy_soul.items():
            if not value:
                continue
            value_lower = str(value).lower()
            
            # Eating behavior
            if "food" in key.lower() or "eat" in key.lower():
                if "love" in value_lower or "excite" in value_lower:
                    traits.append("foodie")
                elif "picky" in value_lower or "selective" in value_lower:
                    traits.append("picky")
            
            # Social behavior
            if "dog" in key.lower() or "social" in key.lower():
                if "friend" in value_lower or "love" in value_lower or "playful" in value_lower:
                    traits.append("social")
                elif "nervous" in value_lower or "anxious" in value_lower:
                    traits.append("anxious")
            
            # Energy/play
            if "play" in key.lower() or "energy" in key.lower() or "exercise" in key.lower():
                if "high" in value_lower or "love" in value_lower or "active" in value_lower:
                    traits.append("playful")
                    traits.append("energetic")
    
    # 3. Personality object (common in older pet records)
    personality = pet_data.get("personality", {})
    if isinstance(personality, dict):
        # Check temperament
        temperament = personality.get("temperament", "").lower()
        if "friendly" in temperament or "playful" in temperament:
            traits.append("playful")
            traits.append("social")
        elif "calm" in temperament or "gentle" in temperament:
            traits.append("elegant")
        
        # Check anxiety indicators
        anxiety = personality.get("separation_anxiety", "").lower()
        noise = personality.get("noise_sensitivity", "").lower()
        if "high" in anxiety or "severe" in anxiety or "nervous" in noise:
            traits.append("anxious")
        
        # Check behavior with dogs
        dog_behavior = personality.get("behavior_with_dogs", "").lower()
        if "playful" in dog_behavior or "friendly" in dog_behavior:
            traits.append("social")
            traits.append("playful")
    
    # 4. Direct temperament field
    temperament_direct = pet_data.get("temperament", "").lower()
    if temperament_direct:
        if "playful" in temperament_direct or "energetic" in temperament_direct:
            traits.append("playful")
        if "calm" in temperament_direct or "gentle" in temperament_direct:
            traits.append("elegant")
        if "anxious" in temperament_direct or "nervous" in temperament_direct:
            traits.append("anxious")
    
    # 5. Check health conditions for senior/special needs
    health_conditions = pet_data.get("health_conditions", []) or []
    for condition in health_conditions:
        condition_lower = condition.lower() if condition else ""
        if "senior" in condition_lower or "elderly" in condition_lower:
            traits.append("senior")
        if "sensitive" in condition_lower or "digestion" in condition_lower:
            traits.append("sensitive_tummy")
    
    # 6. Check age for senior classification
    age = pet_data.get("age")
    if age and isinstance(age, (int, float)) and age >= 8:
        traits.append("senior")
    
    # Deduplicate while preserving order
    seen = set()
    unique_traits = []
    for trait in traits:
        if trait not in seen:
            seen.add(trait)
            unique_traits.append(trait)
    
    return unique_traits[:6]  # Return top 6 traits



# ═══════════════════════════════════════════════════════════════════════════════
# SAFETY LAYER - Allergy Filtering (MUST run first)
# ═══════════════════════════════════════════════════════════════════════════════

def filter_by_allergies(products: List[Dict], pet_allergies: List[str]) -> Tuple[List[Dict], List[str]]:
    """
    SAFETY FIRST: Filter out products containing pet's known allergens.
    
    Args:
        products: List of product dicts with 'ingredients', 'tags', 'name', 'description'
        pet_allergies: List of allergen strings from pet profile
    
    Returns:
        Tuple of (safe_products, filtered_out_ids)
    """
    if not pet_allergies:
        return products, []
    
    # Normalize allergies to lowercase
    allergens = set(a.lower().strip() for a in pet_allergies if a)
    
    # Expand allergens using mappings
    expanded_allergens = set()
    for allergen in allergens:
        expanded_allergens.add(allergen)
        for key, synonyms in ALLERGEN_MAPPINGS.items():
            if allergen in synonyms or allergen == key:
                expanded_allergens.update(synonyms)
    
    safe_products = []
    filtered_out = []
    
    for product in products:
        # Check ingredients
        ingredients = product.get("ingredients", "") or ""
        if isinstance(ingredients, list):
            ingredients = " ".join(ingredients)
        ingredients_lower = ingredients.lower()
        
        # Check name and description
        name = (product.get("name", "") or "").lower()
        description = (product.get("description", "") or "").lower()
        tags = [t.lower() for t in product.get("tags", []) or []]
        
        # Combined text to search
        searchable_text = f"{ingredients_lower} {name} {description} {' '.join(tags)}"
        
        # Check for allergen presence
        is_safe = True
        for allergen in expanded_allergens:
            if allergen in searchable_text:
                is_safe = False
                filtered_out.append(product.get("id") or product.get("_id"))
                logger.info(f"[ALLERGY_FILTER] Filtered product '{name}' for allergen '{allergen}'")
                break
        
        if is_safe:
            safe_products.append(product)
    
    return safe_products, filtered_out


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCT SCORING & SELECTION
# ═══════════════════════════════════════════════════════════════════════════════

def score_product_for_pet(
    product: Dict,
    soul_traits: List[str],
    breed: str,
    size: str,
    event_context: Optional[Dict] = None
) -> float:
    """
    Score a product based on how well it fits the pet's profile.
    
    Returns score from 0-100.
    """
    score = 50.0  # Base score
    
    product_tags = [t.lower() for t in product.get("tags", []) or []]
    product_name = (product.get("name", "") or "").lower()
    product_desc = (product.get("description", "") or "").lower()
    searchable = f"{product_name} {product_desc} {' '.join(product_tags)}"
    
    # 1. Soul trait matching (+20 max)
    for trait in soul_traits:
        trait_lower = trait.lower()
        affinities = SOUL_PRODUCT_AFFINITY.get(trait_lower, [])
        for affinity in affinities:
            if affinity in searchable:
                score += 5
                break
    score = min(score, 70)  # Cap trait boost at +20
    
    # 2. Size appropriateness (+10)
    size_lower = size.lower() if size else ""
    if size_lower in searchable:
        score += 10
    elif "all sizes" in searchable or "any size" in searchable:
        score += 5
    
    # 3. Breed-specific (+10)
    breed_lower = breed.lower() if breed else ""
    if breed_lower and breed_lower in searchable:
        score += 10
    
    # 4. Event context boost (+15)
    if event_context:
        event_type = event_context.get("event_type", "").lower()
        if event_type == "birthday" and ("birthday" in searchable or "cake" in searchable):
            score += 15
        elif event_type == "gotcha_day" and ("gotcha" in searchable or "adoption" in searchable):
            score += 15
    
    # 5. Premium/Popular boost (+5)
    if "bestseller" in product_tags or "popular" in product_tags:
        score += 5
    
    return min(score, 100)


def select_products_for_bucket(
    safe_products: List[Dict],
    bucket_config: Dict,
    soul_traits: List[str],
    breed: str,
    size: str,
    event_context: Optional[Dict] = None
) -> List[Dict]:
    """
    Select products for a specific bucket (e.g., cakes_treats, decor_photo).
    """
    bucket_tags = bucket_config["tags"]
    max_count = bucket_config["max"]
    
    # Filter to products matching bucket tags
    matching_products = []
    for product in safe_products:
        product_tags = [t.lower() for t in product.get("tags", []) or []]
        product_category = (product.get("category", "") or "").lower()
        
        # Check if product matches any bucket tag
        if any(tag in product_tags or tag in product_category for tag in bucket_tags):
            matching_products.append(product)
    
    # Score matching products
    scored = []
    for product in matching_products:
        score = score_product_for_pet(product, soul_traits, breed, size, event_context)
        scored.append({**product, "_score": score})
    
    # Sort by score and return top N
    scored.sort(key=lambda x: x["_score"], reverse=True)
    
    return scored[:max_count]


def curate_products(
    all_products: List[Dict],
    pet_data: Dict,
    pillar: str,
    event_context: Optional[Dict] = None
) -> List[Dict]:
    """
    Main product curation function.
    
    1. Safety filter (allergies)
    2. Score by pet profile
    3. Select from buckets
    4. Return 5-6 top products
    """
    allergies = pet_data.get("allergies", []) or []
    # Use derived traits from multiple sources for better personalization
    soul_traits = derive_traits_from_pet_data(pet_data)
    breed = pet_data.get("breed", "") or ""
    size = pet_data.get("size", "") or ""
    
    logger.info(f"[CURATE] Pet: {pet_data.get('name')}, Derived traits: {soul_traits}")
    
    # SAFETY FIRST
    safe_products, filtered_out = filter_by_allergies(all_products, allergies)
    
    if filtered_out:
        logger.info(f"[CURATE] Filtered {len(filtered_out)} products due to allergies: {allergies}")
    
    selected_products = []
    
    if pillar == "celebrate":
        # Select from each bucket
        for bucket_name, bucket_config in CELEBRATE_PRODUCT_BUCKETS.items():
            bucket_picks = select_products_for_bucket(
                safe_products,
                bucket_config,
                soul_traits,
                breed,
                size,
                event_context
            )
            selected_products.extend(bucket_picks)
            
            # Remove selected from pool to avoid duplicates
            selected_ids = {p.get("id") or p.get("_id") for p in bucket_picks}
            safe_products = [p for p in safe_products if (p.get("id") or p.get("_id")) not in selected_ids]
    else:
        # Generic selection for other pillars
        scored = []
        for product in safe_products:
            score = score_product_for_pet(product, soul_traits, breed, size, event_context)
            scored.append({**product, "_score": score})
        scored.sort(key=lambda x: x["_score"], reverse=True)
        selected_products = scored[:DEFAULT_PRODUCTS_COUNT]
    
    # Remove internal score from output
    for product in selected_products:
        product.pop("_score", None)
    
    # Add "why for pet" explanation
    pet_name = pet_data.get("name", "your pet")
    for product in selected_products:
        product["why_for_pet"] = generate_why_for_pet(product, soul_traits, breed, pet_name)
    
    return selected_products[:DEFAULT_PRODUCTS_COUNT + 1]


def generate_why_for_pet(product: Dict, soul_traits: List[str], breed: str, pet_name: str) -> str:
    """
    Generate a personalized "why this is for {pet}" explanation.
    Uses card-specific why_phrases if available, otherwise falls back to generic.
    """
    # First check for card-specific why_phrases
    why_phrases = product.get("why_phrases", {})
    
    if why_phrases:
        # Try to find a matching trait
        for trait in soul_traits[:3]:
            trait_lower = trait.lower().replace(" ", "_")
            if trait_lower in why_phrases:
                return why_phrases[trait_lower]
        
        # Return default phrase for this card
        return why_phrases.get("default", f"Handpicked for {pet_name}")
    
    # Legacy fallback - use generic trait explanations
    trait_explanations = {
        "foodie": f"fits {pet_name}'s foodie personality",
        "picky": f"designed for {pet_name}'s selective taste",
        "sensitive_tummy": f"gentle on {pet_name}'s tummy",
        "anxious": f"calming approach for {pet_name}",
        "playful": f"matches {pet_name}'s playful energy",
        "energetic": f"fuels {pet_name}'s active lifestyle",
        "elegant": f"suits {pet_name}'s refined taste",
        "pampered": f"the pampering {pet_name} deserves",
        "social": f"perfect for {pet_name}'s social nature",
        "senior": f"specially formulated for senior pets like {pet_name}",
        "health_conscious": f"supports {pet_name}'s health goals",
        "weight_management": f"helps manage {pet_name}'s weight",
    }
    
    # Find matching trait
    for trait in soul_traits[:3]:
        trait_lower = trait.lower().replace(" ", "_")
        if trait_lower in trait_explanations:
            return trait_explanations[trait_lower].capitalize()
    
    return f"Curated for {pet_name}"


# ═══════════════════════════════════════════════════════════════════════════════
# THIN PROFILE DETECTION & QUESTION CARD
# ═══════════════════════════════════════════════════════════════════════════════

def is_profile_thin(pet_data: Dict) -> bool:
    """
    Check if pet profile is "thin" (missing key information).
    """
    # Use derived traits which checks multiple sources
    derived_traits = derive_traits_from_pet_data(pet_data)
    
    # Check required fields
    missing_required = []
    for field in THIN_PROFILE_THRESHOLDS["required_fields"]:
        if not pet_data.get(field):
            missing_required.append(field)
    
    # Check trait count - now using derived traits
    has_few_traits = len(derived_traits) < THIN_PROFILE_THRESHOLDS["missing_traits"]
    
    return bool(missing_required) or has_few_traits


def get_question_card(pet_data: Dict, pillar: str) -> Optional[Dict]:
    """
    Generate a micro-question card if profile is thin.
    """
    if not is_profile_thin(pet_data):
        return None
    
    pet_name = pet_data.get("name", "your pet")
    
    if pillar == "celebrate":
        # Pick first unanswered question
        answered_fields = set(pet_data.get("answered_questions", []))
        
        for question in CELEBRATE_THIN_PROFILE_QUESTIONS:
            if question["id"] not in answered_fields:
                return {
                    "type": "question_card",
                    "id": question["id"],
                    "icon": question["icon"],
                    "question": question["question"].format(pet_name=pet_name),
                    "options": question["options"],
                    "maps_to_trait": question["maps_to_trait"],
                    "cta_text": "Help Mira know better"
                }
    
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# CURATED SET GENERATION (Main Entry Point)
# ═══════════════════════════════════════════════════════════════════════════════

async def generate_curated_set(
    pet_data: Dict,
    pillar: str,
    intent_context: Optional[Dict],
    db,
    use_cache: bool = True
) -> Dict:
    """
    Generate a complete curated set for a pet/pillar combination.
    
    This is the main entry point for the Intelligence Layer.
    CONCIERGE LAYER ONLY - no catalogue/ecommerce items.
    
    Args:
        pet_data: Pet profile including soul traits, allergies, breed, size
        pillar: Life pillar (e.g., "celebrate")
        intent_context: Optional context (event_type, subcategory, etc.)
        db: MongoDB database instance
        use_cache: Whether to use cached results (default True)
    
    Returns:
        {
            "concierge_products": [...],  # 2-3 bespoke deliverables → Ticket
            "concierge_services": [...],  # 1-2 arrangements → Ticket
            "question_card": {...} or None,  # 0-1 if profile thin
            "meta": {
                "generated_at": timestamp,
                "cache_expires_at": timestamp,
                "pet_id": str,
                "pillar": str,
                "personalization_summary": str
            }
        }
    
    Note: Catalogue layer (Shopify SKUs) is handled separately.
    """
    pet_id = pet_data.get("id") or pet_data.get("_id", "unknown")
    
    # Generate cache key
    cache_key = generate_cache_key(pet_id, pillar, intent_context)
    
    # Check cache if enabled
    if use_cache and db is not None:
        cached = await get_cached_set(db, cache_key)
        if cached:
            logger.info(f"[INTELLIGENCE] Cache hit for {cache_key}")
            return cached
    
    logger.info(f"[INTELLIGENCE] Generating fresh curated set for pet={pet_id}, pillar={pillar}")
    
    # Get concierge cards from the card library (NOT catalogue products)
    concierge_products = []
    concierge_services = []
    question_card = None
    
    if pillar == "celebrate":
        from app.data.celebrate_concierge_cards import get_celebrate_curated_set
        
        curated = get_celebrate_curated_set(pet_data, intent_context)
        concierge_products = curated.get("concierge_products", [])
        concierge_services = curated.get("concierge_services", [])
        question_card = curated.get("question_card")
    
    elif pillar == "dine":
        from app.data.dine_concierge_cards import get_dine_curated_set
        
        curated = get_dine_curated_set(pet_data, intent_context)
        concierge_products = curated.get("concierge_products", [])
        concierge_services = curated.get("concierge_services", [])
        question_card = curated.get("question_card")
    
    elif pillar == "fresh_meals" or (pillar == "dine" and intent_context and intent_context.get("sub_pillar") == "fresh_meals"):
        # Fresh Meals specific cards
        from app.data.fresh_meals_concierge_cards import select_fresh_meals_cards
        
        result = select_fresh_meals_cards(pet_data, max_cards=4)
        # Split into products and services
        concierge_products = [c for c in result["cards"] if c.get("type") == "concierge_product"]
        concierge_services = [c for c in result["cards"] if c.get("type") == "concierge_service"]
        question_card = None
    
    elif pillar == "care":
        # Care pillar cards
        from app.data.care_concierge_cards import select_care_cards
        
        result = select_care_cards(pet_data, max_cards=4)
        concierge_products = [c for c in result["cards"] if c.get("type") == "concierge_product"]
        concierge_services = [c for c in result["cards"] if c.get("type") == "concierge_service"]
        question_card = None
    
    elif pillar in ["stay", "travel", "learn", "enjoy", "fit", "paperwork", "advisory", "services", "shop"]:
        # Universal pillar cards
        from app.data.universal_pillar_cards import select_pillar_cards
        
        result = select_pillar_cards(pillar, pet_data, max_cards=4)
        concierge_products = [c for c in result["cards"] if c.get("type") == "concierge_product"]
        concierge_services = [c for c in result["cards"] if c.get("type") == "concierge_service"]
        question_card = None
    
    else:
        # For other pillars, use fallback (to be expanded later)
        logger.warning(f"[INTELLIGENCE] Pillar '{pillar}' not yet implemented - returning empty")
    
    # Build response
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=CACHE_TTL_MINUTES)
    
    curated_set = {
        "concierge_products": concierge_products,
        "concierge_services": concierge_services,
        "question_card": question_card,
        "meta": {
            "generated_at": now.isoformat(),
            "cache_expires_at": expires_at.isoformat(),
            "pet_id": str(pet_id),
            "pillar": pillar,
            "personalization_summary": build_personalization_summary(pet_data),
            "cache_key": cache_key,
            "total_cards": len(concierge_products) + len(concierge_services)
        }
    }
    
    # Cache the result
    if db is not None:
        await cache_curated_set(db, cache_key, curated_set, expires_at)
    
    return curated_set


# ═══════════════════════════════════════════════════════════════════════════════
# CACHE HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def generate_cache_key(pet_id: str, pillar: str, intent_context: Optional[Dict]) -> str:
    """
    Generate a unique cache key for a curated set.
    """
    intent_hash = ""
    if intent_context:
        intent_str = str(sorted(intent_context.items()))
        intent_hash = hashlib.md5(intent_str.encode()).hexdigest()[:8]
    
    return f"curated:{pet_id}:{pillar}:{intent_hash}"


async def get_cached_set(db, cache_key: str) -> Optional[Dict]:
    """
    Retrieve cached curated set if valid.
    """
    try:
        cache_collection = db["curated_picks_cache"]
        cached = await cache_collection.find_one({"cache_key": cache_key})
        
        if cached:
            expires_at = cached.get("expires_at")
            if expires_at:
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if expires_at > datetime.now(timezone.utc):
                    # Remove MongoDB _id before returning
                    cached.pop("_id", None)
                    cached.pop("cache_key", None)
                    cached.pop("expires_at", None)
                    return cached
        
        return None
    except Exception as e:
        logger.error(f"[CACHE] Error reading cache: {e}")
        return None


async def cache_curated_set(db, cache_key: str, curated_set: Dict, expires_at: datetime):
    """
    Store curated set in cache.
    """
    try:
        cache_collection = db["curated_picks_cache"]
        
        cache_doc = {
            "cache_key": cache_key,
            "expires_at": expires_at,
            **curated_set
        }
        
        # Upsert the cache entry
        await cache_collection.update_one(
            {"cache_key": cache_key},
            {"$set": cache_doc},
            upsert=True
        )
        
        logger.info(f"[CACHE] Cached curated set: {cache_key}")
    except Exception as e:
        logger.error(f"[CACHE] Error writing cache: {e}")


async def fetch_pillar_products(db, pillar: str) -> List[Dict]:
    """
    Fetch products for a pillar from unified_products collection.
    """
    try:
        products_collection = db["unified_products"]
        
        # Build query based on pillar
        query = {
            "$or": [
                {"pillar": pillar},
                {"pillars": pillar},
                {"category": {"$regex": pillar, "$options": "i"}}
            ],
            "active": {"$ne": False}  # Include products without active field or active=True
        }
        
        # Project only needed fields
        projection = {
            "_id": 0,
            "id": 1,
            "name": 1,
            "description": 1,
            "price": 1,
            "image": 1,
            "images": 1,
            "tags": 1,
            "category": 1,
            "ingredients": 1,
            "pillar": 1,
            "pillars": 1,
            "shopify_product_id": 1,
            "variant_id": 1
        }
        
        cursor = products_collection.find(query, projection)
        products = await cursor.to_list(length=100)
        
        logger.info(f"[PRODUCTS] Fetched {len(products)} products for pillar: {pillar}")
        return products
    except Exception as e:
        logger.error(f"[PRODUCTS] Error fetching products: {e}")
        return []


def build_personalization_summary(pet_data: Dict) -> str:
    """
    Build a human-readable summary of personalization factors used.
    """
    factors = []
    
    if pet_data.get("soul_traits"):
        traits = pet_data["soul_traits"][:3]
        factors.append(f"soul traits: {', '.join(traits)}")
    
    if pet_data.get("breed"):
        factors.append(f"breed: {pet_data['breed']}")
    
    if pet_data.get("size"):
        factors.append(f"size: {pet_data['size']}")
    
    if pet_data.get("allergies"):
        factors.append(f"allergies filtered: {', '.join(pet_data['allergies'])}")
    
    if factors:
        return "Personalized by " + "; ".join(factors)
    
    return "Personalized recommendations"


# ═══════════════════════════════════════════════════════════════════════════════
# QUESTION CARD PERSISTENCE
# ═══════════════════════════════════════════════════════════════════════════════

async def save_question_answer(
    db,
    pet_id: str,
    question_id: str,
    answer: str,
    maps_to_trait: str
) -> bool:
    """
    Save user's answer to a thin-profile question and update pet profile.
    """
    try:
        pets_collection = db["pets"]
        
        # Map answer to trait value
        trait_value = answer  # Store the raw answer for now
        
        # Update pet profile
        update = {
            "$push": {"answered_questions": question_id},
            "$set": {f"preferences.{maps_to_trait}": trait_value}
        }
        
        result = await pets_collection.update_one(
            {"id": pet_id},
            update
        )
        
        if result.modified_count > 0:
            # Invalidate cached curated sets for this pet
            cache_collection = db["curated_picks_cache"]
            await cache_collection.delete_many({"meta.pet_id": pet_id})
            
            logger.info(f"[QUESTION] Saved answer for pet {pet_id}: {question_id}={answer}")
            return True
        
        return False
    except Exception as e:
        logger.error(f"[QUESTION] Error saving answer: {e}")
        return False
