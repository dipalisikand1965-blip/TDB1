"""
Product Schema Enhancement Script
=================================
Enhances existing products_master documents with the full comprehensive schema.
Intelligently infers values from existing data.
"""

import asyncio
import os
import logging
import re
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Any, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Breed mapping for intelligent breed detection
BREED_KEYWORDS = {
    'labrador': ['labrador', 'lab', 'retriever'],
    'golden_retriever': ['golden', 'golden retriever'],
    'indie': ['indie', 'indian', 'desi', 'street', 'pariah'],
    'beagle': ['beagle'],
    'german_shepherd': ['german shepherd', 'gsd', 'alsatian'],
    'pug': ['pug'],
    'shih_tzu': ['shih tzu', 'shihtzu'],
    'pomeranian': ['pomeranian', 'pom'],
    'husky': ['husky', 'siberian'],
    'rottweiler': ['rottweiler', 'rottie'],
    'doberman': ['doberman', 'dobie'],
    'boxer': ['boxer'],
    'cocker_spaniel': ['cocker', 'spaniel'],
    'dachshund': ['dachshund', 'sausage dog', 'wiener'],
    'chihuahua': ['chihuahua'],
    'bulldog': ['bulldog', 'english bulldog'],
    'french_bulldog': ['french bulldog', 'frenchie'],
    'great_dane': ['great dane', 'dane'],
    'border_collie': ['border collie', 'collie'],
}

# Category to pillar mapping
CATEGORY_PILLAR_MAP = {
    'cakes': 'celebrate',
    'treats': 'shop',
    'dognuts': 'celebrate',
    'party': 'celebrate',
    'hampers': 'celebrate',
    'toys': 'shop',
    'accessories': 'shop',
    'grooming': 'care',
    'training': 'learn',
    'boarding': 'stay',
    'daycare': 'care',
    'travel': 'travel',
    'emergency': 'emergency',
    'memorial': 'farewell',
    'adoption': 'adopt',
    'insurance': 'advisory',
    'consultation': 'advisory',
    'dine': 'dine',
    'fitness': 'fit',
    'wellness': 'fit',
}

# Size inference from product names
SIZE_KEYWORDS = {
    'XS': ['xs', 'extra small', 'tiny', 'teacup'],
    'S': ['small', ' s ', 'mini', 'petit'],
    'M': ['medium', ' m '],
    'L': ['large', ' l ', 'big'],
    'XL': ['xl', 'extra large', 'giant', 'xxl'],
}

# Life stage inference
LIFE_STAGE_KEYWORDS = {
    'puppy': ['puppy', 'pup', 'junior', 'baby', 'young'],
    'adult': ['adult'],
    'senior': ['senior', 'elderly', 'mature', 'older', 'geriatric'],
}

# Play type inference
PLAY_TYPE_KEYWORDS = {
    'fetch': ['fetch', 'ball', 'frisbee', 'throw'],
    'tug': ['tug', 'rope', 'pull'],
    'chew': ['chew', 'dental', 'bone', 'antler'],
    'puzzle': ['puzzle', 'interactive', 'treat dispenser', 'kong'],
    'comfort': ['comfort', 'plush', 'cuddle', 'snuggle'],
    'training': ['training', 'clicker', 'treat pouch'],
}

# Occasion inference
OCCASION_KEYWORDS = {
    'birthday': ['birthday', 'bday', 'b-day'],
    'gotcha_day': ['gotcha', 'adoption anniversary', 'gotcha day'],
    'new_puppy': ['new puppy', 'puppy kit', 'welcome kit', 'starter'],
    'travel': ['travel', 'road trip', 'vacation', 'flight'],
    'monsoon': ['monsoon', 'rain', 'waterproof'],
    'winter': ['winter', 'cold', 'warm', 'sweater', 'jacket'],
    'summer': ['summer', 'cool', 'cooling', 'ice'],
    'first_groom': ['first groom', 'grooming kit'],
    'party': ['party', 'celebration', 'pawty'],
}


def infer_breeds_from_text(text: str) -> List[str]:
    """Infer applicable breeds from product text"""
    if not text:
        return []
    text_lower = text.lower()
    found_breeds = []
    for breed, keywords in BREED_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                found_breeds.append(breed)
                break
    return found_breeds


def infer_life_stages(text: str, tags: List[str]) -> List[str]:
    """Infer life stages from product data"""
    if not text:
        text = ""
    combined = (text + " " + " ".join(tags or [])).lower()
    
    found_stages = []
    for stage, keywords in LIFE_STAGE_KEYWORDS.items():
        for kw in keywords:
            if kw in combined:
                found_stages.append(stage)
                break
    
    return found_stages if found_stages else ["all"]


def infer_sizes(text: str, tags: List[str]) -> List[str]:
    """Infer size suitability"""
    if not text:
        text = ""
    combined = (text + " " + " ".join(tags or [])).lower()
    
    found_sizes = []
    for size, keywords in SIZE_KEYWORDS.items():
        for kw in keywords:
            if kw in combined:
                found_sizes.append(size)
                break
    
    return found_sizes if found_sizes else ["all"]


def infer_play_types(text: str, category: str) -> List[str]:
    """Infer play types for toys"""
    if not text:
        return []
    text_lower = text.lower()
    
    found_types = []
    for ptype, keywords in PLAY_TYPE_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                found_types.append(ptype)
                break
    return found_types


def infer_occasions(text: str, tags: List[str]) -> List[str]:
    """Infer occasions from product data"""
    if not text:
        text = ""
    combined = (text + " " + " ".join(tags or [])).lower()
    
    found_occasions = []
    for occasion, keywords in OCCASION_KEYWORDS.items():
        for kw in keywords:
            if kw in combined:
                found_occasions.append(occasion)
                break
    return found_occasions


def infer_chew_strength(text: str, tags: List[str]) -> Optional[str]:
    """Infer chew strength for toys"""
    if not text:
        text = ""
    combined = (text + " " + " ".join(tags or [])).lower()
    
    if any(w in combined for w in ['indestructible', 'power chewer', 'aggressive', 'heavy duty']):
        return 'power_chewer'
    elif any(w in combined for w in ['gentle', 'soft', 'plush', 'puppy safe']):
        return 'gentle'
    elif any(w in combined for w in ['moderate', 'medium']):
        return 'moderate'
    return None


def calculate_margin(selling_price: float, cost_price: float) -> Dict[str, Any]:
    """Calculate margin percent and band"""
    if not cost_price or cost_price <= 0:
        return {"margin_percent": None, "margin_band": "unknown"}
    
    margin_percent = ((selling_price - cost_price) / cost_price) * 100
    
    if margin_percent < 20:
        band = "low"
    elif margin_percent < 40:
        band = "medium"
    elif margin_percent < 60:
        band = "high"
    else:
        band = "premium"
    
    return {"margin_percent": round(margin_percent, 2), "margin_band": band}


def enhance_product(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Enhance a product document with comprehensive schema fields"""
    
    # Get existing data
    name = doc.get('name', '') or ''
    description = doc.get('description', '') or doc.get('short_description', '') or ''
    tags = doc.get('tags', []) or []
    category = doc.get('category', '') or ''
    
    combined_text = f"{name} {description}"
    
    # ==================== BASICS ====================
    basics = {
        "id": doc.get('id'),
        "sku": doc.get('sku'),
        "barcode": doc.get('barcode'),
        "name": name,
        "display_name": doc.get('display_name') or name[:50] if name else None,
        "short_description": doc.get('short_description') or (description[:140] if description else None),
        "long_description": doc.get('long_description') or description,
        "brand": doc.get('brand'),
        "vendor": doc.get('vendor'),
        "manufacturer": doc.get('manufacturer'),
        "country_of_origin": doc.get('country_of_origin'),
        "shopify_id": doc.get('shopify_id'),
        "shopify_handle": doc.get('shopify_handle'),
        "external_source": doc.get('external_source') or doc.get('_consolidation_source'),
        "product_type": doc.get('product_type', 'physical'),
        "is_service": doc.get('product_type') == 'service',
        "is_bundle": doc.get('product_type') == 'bundle' or bool(doc.get('bundle_includes')),
        "is_bakery_product": doc.get('is_bakery_product', False),
    }
    
    # ==================== SUITABILITY ====================
    existing_breed_meta = doc.get('breed_metadata', {}) or {}
    inferred_breeds = infer_breeds_from_text(combined_text)
    
    suitability = {
        "pet_filters": {
            "species": ["dog"],
            "life_stages": existing_breed_meta.get('life_stages') or infer_life_stages(combined_text, tags),
            "size_options": existing_breed_meta.get('sizes') or infer_sizes(combined_text, tags),
            "weight_range_min_kg": None,
            "weight_range_max_kg": None,
            "breed_applicability": "selected" if (existing_breed_meta.get('breeds') or inferred_breeds) else "all",
            "applicable_breeds": existing_breed_meta.get('breeds') or inferred_breeds,
            "excluded_breeds": [],
        },
        "behavior": {
            "energy_level_match": existing_breed_meta.get('energy_levels', ["all"]),
            "chew_strength": existing_breed_meta.get('chew_strength') or infer_chew_strength(combined_text, tags),
            "play_types": infer_play_types(combined_text, category) if category in ['toys', 'accessories'] else [],
            "indoor_suitable": True,
            "outdoor_suitable": True,
            "water_safe": 'water' in combined_text.lower(),
        },
        "physical_traits": {
            "coat_type_match": [],
            "brachycephalic_friendly": True,
            "senior_friendly": 'senior' in combined_text.lower() or 'gentle' in combined_text.lower(),
            "puppy_safe": 'puppy' in combined_text.lower() or 'safe' in combined_text.lower(),
            "easy_grip": False,
            "low_impact": False,
            "soft_texture": 'soft' in combined_text.lower() or 'plush' in combined_text.lower(),
        },
        "safety": {
            "allergy_aware": any(t in tags for t in ['allergy', 'hypoallergenic', 'grain_free']),
            "common_avoids": doc.get('common_avoids', []),
            "material_safety_flags": [],
            "is_grain_free": 'grain_free' in tags or 'grain free' in combined_text.lower(),
            "is_single_protein": 'single_protein' in tags,
            "is_vegetarian": 'vegetarian' in tags or 'veg' in combined_text.lower(),
            "is_human_grade": 'human_grade' in tags or 'human grade' in combined_text.lower(),
            "ingredients": doc.get('ingredients', []),
            "main_protein": doc.get('main_protein'),
            "supervision_required": False,
            "safety_notes": doc.get('safety_notes'),
        }
    }
    
    # ==================== PILLARS & OCCASIONS ====================
    primary_pillar = doc.get('primary_pillar') or doc.get('pillar')
    if not primary_pillar and category:
        primary_pillar = CATEGORY_PILLAR_MAP.get(category.lower(), 'shop')
    
    pillars_occasions = {
        "pillar": {
            "primary_pillar": primary_pillar,
            "secondary_pillars": [p for p in doc.get('pillars', []) if p != primary_pillar],
            "is_cross_pillar": len(doc.get('pillars', [])) > 1,
        },
        "occasion": {
            "occasions": doc.get('occasion_tags') or infer_occasions(combined_text, tags),
            "seasonality": doc.get('seasonality', []),
            "is_birthday_relevant": 'birthday' in combined_text.lower(),
            "is_gotcha_day_relevant": 'gotcha' in combined_text.lower(),
            "is_holiday_special": any(h in combined_text.lower() for h in ['christmas', 'diwali', 'holi', 'valentine']),
        },
        "use_case": {
            "use_case_tags": doc.get('use_case_tags', []),
            "is_giftable": 'gift' in combined_text.lower() or 'hamper' in combined_text.lower(),
            "gift_wrap_available": False,
            "subscription_friendly": doc.get('autoship_enabled', False),
            "autoship_eligible": doc.get('autoship_enabled', False),
            "travel_friendly": 'travel' in combined_text.lower() or category == 'travel',
            "tsa_approved": 'tsa' in combined_text.lower(),
        }
    }
    
    # ==================== COMMERCE & OPS ====================
    price = doc.get('price', 0) or 0
    mrp = doc.get('mrp') or doc.get('originalPrice') or doc.get('compare_at_price') or price
    cost = doc.get('cost_price') or doc.get('cost')
    
    margin_info = calculate_margin(price, cost) if cost else {"margin_percent": None, "margin_band": "unknown"}
    
    # Image count
    images = doc.get('images', []) or []
    primary_img = doc.get('image') or doc.get('image_url') or doc.get('thumbnail')
    image_count = len(images) + (1 if primary_img and primary_img not in images else 0)
    
    commerce_ops = {
        "category": category,
        "subcategory": doc.get('subcategory'),
        "taxonomy_path": f"{primary_pillar} > {category}" if primary_pillar and category else None,
        "quality_tier": doc.get('quality_tier', 'standard'),
        "approval_status": "live" if doc.get('in_stock', True) else "paused",
        "pricing": {
            "mrp": mrp,
            "selling_price": price,
            "cost_price": cost,
            "margin_percent": margin_info.get("margin_percent"),
            "margin_band": margin_info.get("margin_band"),
            "compare_at_price": doc.get('compare_at_price') or doc.get('originalPrice'),
            "discount_percent": round(((mrp - price) / mrp) * 100, 1) if mrp > price else None,
            "gst_applicable": True,
            "gst_rate": doc.get('gst_rate', 18.0),
            "hsn_code": doc.get('hsn_code'),
            "price_includes_gst": doc.get('price_includes_gst', False),
            "currency": "INR",
        },
        "inventory": {
            "inventory_status": "in_stock" if doc.get('in_stock', True) else "out_of_stock",
            "track_inventory": doc.get('track_inventory', False),
            "stock_quantity": doc.get('stock_quantity'),
            "low_stock_threshold": 5,
            "allow_backorder": doc.get('allow_backorder', False),
            "is_perishable": doc.get('is_fresh_only', False) or category in ['cakes', 'fresh-meals'],
            "shelf_life_days": doc.get('shelf_life_days'),
        },
        "fulfillment": {
            "delivery_type": "ship" if doc.get('is_pan_india_shippable', False) else "local_partner",
            "requires_shipping": True,
            "is_pan_india": doc.get('is_pan_india_shippable', False),
            "available_cities": doc.get('available_cities') or doc.get('fresh_delivery_cities', []),
            "cold_chain_required": doc.get('cold_chain_required', False) or category in ['fresh-meals', 'frozen-treats'],
            "fragile": category in ['cakes'],
            "temperature_sensitive": category in ['cakes', 'fresh-meals', 'frozen-treats'],
            "returnable": category not in ['cakes', 'fresh-meals', 'treats'],
            "return_window_days": 7 if category not in ['cakes', 'fresh-meals'] else 0,
        },
        "tags": tags,
        "internal_tags": doc.get('internal_tags', []),
    }
    
    # ==================== MEDIA ====================
    media = {
        "primary_image": primary_img,
        "primary_image_alt": doc.get('image_alt') or name,
        "images": images,
        "thumbnail": doc.get('thumbnail') or primary_img,
        "video_url": doc.get('video_url'),
        "image_count": image_count,
        "image_completeness": "complete" if image_count >= 2 else ("partial" if image_count == 1 else "incomplete"),
        "has_lifestyle_image": False,  # Would need AI to detect
        "has_size_reference": False,
    }
    
    # ==================== MIRA & AI ====================
    mira_ai = {
        "mira": {
            "mira_recommendable": doc.get('mira_visibility', {}).get('can_reference', True) if isinstance(doc.get('mira_visibility'), dict) else True,
            "can_reference": True,
            "can_suggest_proactively": False,
            "handled_by_mira": doc.get('product_type') == 'service',
            "requires_concierge": category in ['consultation', 'advisory', 'custom'],
            "suggestion_contexts": [],
            "exclusion_reasons": [],
            "knowledge_confidence": "high",
            "upsell_items": [],
            "cross_sell_items": [],
        },
        "ai_enrichment": {
            "mira_hint": doc.get('mira_hint'),
            "mira_hint_generated_at": doc.get('mira_hint_generated_at'),
            "breed_metadata": existing_breed_meta,
            "intelligent_tags": doc.get('intelligent_tags', []),
            "ai_processed_at": doc.get('ai_processed_at'),
            "search_keywords": doc.get('search_keywords', []),
            "enhanced_description": doc.get('enhanced_description'),
        }
    }
    
    # ==================== BUILD ENHANCED DOC ====================
    enhanced = {
        # New structured format
        "basics": basics,
        "suitability": suitability,
        "pillars_occasions": pillars_occasions,
        "commerce_ops": commerce_ops,
        "media": media,
        "mira_ai": mira_ai,
        
        # Variants
        "has_variants": doc.get('has_variants', False),
        "options": doc.get('options', []),
        "variants": doc.get('variants', []),
        
        # Paw Rewards
        "paw_rewards": {
            "points_per_rupee": 1.0,
            "bonus_points": 0,
            "is_redeemable": False,
        },
        
        # Reviews
        "reviews": {
            "average_rating": doc.get('paw_score', 0),
            "total_reviews": doc.get('paw_ratings_count', 0),
            "paw_score": doc.get('paw_score'),
        },
        
        # Audit
        "audit": {
            "created_at": doc.get('created_at') or doc.get('_consolidated_at'),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "version": (doc.get('version', 0) or 0) + 1,
        },
        
        # LEGACY FLAT FIELDS (backward compatibility)
        "id": doc.get('id'),
        "name": name,
        "description": description,
        "price": price,
        "mrp": mrp,
        "category": category,
        "subcategory": doc.get('subcategory'),
        "primary_pillar": primary_pillar,
        "pillars": doc.get('pillars', []),
        "tags": tags,
        "image": primary_img,
        "images": images,
        "in_stock": doc.get('in_stock', True),
        "mira_hint": doc.get('mira_hint'),
        "breed_metadata": existing_breed_meta,
        "is_bakery_product": doc.get('is_bakery_product', False),
        "shopify_id": doc.get('shopify_id'),
        
        # Enhancement tracking
        "_schema_version": "2.0",
        "_enhanced_at": datetime.now(timezone.utc).isoformat(),
    }
    
    return enhanced


async def enhance_all_products():
    """Enhance all products in products_master"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    logger.info("=" * 60)
    logger.info("PRODUCT SCHEMA ENHANCEMENT")
    logger.info("=" * 60)
    
    total = await db.products_master.count_documents({})
    logger.info(f"Total products to enhance: {total}")
    
    enhanced_count = 0
    batch_size = 100
    
    cursor = db.products_master.find({})
    
    async for doc in cursor:
        try:
            product_id = doc.get('id')
            enhanced = enhance_product(doc)
            
            await db.products_master.update_one(
                {"_id": doc["_id"]},
                {"$set": enhanced}
            )
            
            enhanced_count += 1
            
            if enhanced_count % batch_size == 0:
                logger.info(f"  Enhanced {enhanced_count}/{total} products...")
                
        except Exception as e:
            logger.error(f"Error enhancing product {doc.get('id')}: {e}")
    
    logger.info(f"\n✅ ENHANCEMENT COMPLETE: {enhanced_count} products enhanced")
    
    # Create new indexes
    logger.info("\nCreating enhanced indexes...")
    await db.products_master.create_index("basics.id", sparse=True)
    await db.products_master.create_index("commerce_ops.category")
    await db.products_master.create_index("pillars_occasions.pillar.primary_pillar")
    await db.products_master.create_index("suitability.pet_filters.life_stages")
    await db.products_master.create_index("suitability.pet_filters.size_options")
    await db.products_master.create_index("suitability.pet_filters.applicable_breeds")
    await db.products_master.create_index("mira_ai.mira.mira_recommendable")
    await db.products_master.create_index("commerce_ops.inventory.inventory_status")
    await db.products_master.create_index("_schema_version")
    logger.info("  Indexes created")
    
    return {"enhanced_count": enhanced_count}


if __name__ == "__main__":
    asyncio.run(enhance_all_products())
