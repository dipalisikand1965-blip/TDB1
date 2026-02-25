"""
Cross-Pollination Engine
Service → Product Recommendations
When a user books a service, suggest related products
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cross-sell", tags=["cross-sell"])

# Database reference
_db = None

def set_cross_sell_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


# Service to Product Category Mapping
SERVICE_TO_PRODUCT_MAPPING = {
    # Care Services
    "grooming": {
        "categories": ["grooming", "hygiene", "care"],
        "keywords": ["brush", "shampoo", "conditioner", "nail", "ear", "detangler", "comb"],
        "discount_percent": 15,
        "message": "Complete your grooming routine at home"
    },
    "vet": {
        "categories": ["health", "supplements", "first-aid"],
        "keywords": ["supplement", "vitamin", "first aid", "medicine", "health", "recovery"],
        "discount_percent": 10,
        "message": "Support your pet's health between vet visits"
    },
    "dental": {
        "categories": ["dental", "oral", "hygiene"],
        "keywords": ["dental", "teeth", "toothbrush", "toothpaste", "oral", "chew"],
        "discount_percent": 15,
        "message": "Maintain those pearly whites at home"
    },
    
    # Fit Services
    "walking": {
        "categories": ["walking", "outdoor", "travel"],
        "keywords": ["leash", "harness", "collar", "poop bag", "water bottle", "treat pouch"],
        "discount_percent": 10,
        "message": "Gear up for your daily walks"
    },
    "training": {
        "categories": ["training", "treats", "toys"],
        "keywords": ["training", "treat", "clicker", "whistle", "reward", "puzzle"],
        "discount_percent": 15,
        "message": "Continue training at home with these essentials"
    },
    "fitness": {
        "categories": ["fitness", "exercise", "toys"],
        "keywords": ["exercise", "agility", "ball", "fetch", "tug", "active"],
        "discount_percent": 10,
        "message": "Keep the fitness going at home"
    },
    "swimming": {
        "categories": ["swimming", "outdoor", "safety"],
        "keywords": ["swim", "life jacket", "towel", "drying", "water"],
        "discount_percent": 15,
        "message": "Swimming essentials for water babies"
    },
    
    # Travel Services
    "travel": {
        "categories": ["travel", "carriers", "outdoor"],
        "keywords": ["carrier", "travel", "crate", "portable", "foldable", "car seat"],
        "discount_percent": 15,
        "message": "Travel essentials for your journey"
    },
    "boarding": {
        "categories": ["comfort", "bedding", "toys"],
        "keywords": ["bed", "blanket", "comfort", "anxiety", "calming", "familiar"],
        "discount_percent": 10,
        "message": "Send comfort items for their stay"
    },
    
    # Celebrate Services
    "birthday": {
        "categories": ["celebrate", "treats", "accessories"],
        "keywords": ["birthday", "party", "hat", "bandana", "treat", "cake", "gift"],
        "discount_percent": 20,
        "message": "Party supplies for the big day"
    },
    
    # Dine Services
    "nutrition": {
        "categories": ["food", "nutrition", "supplements"],
        "keywords": ["food", "meal", "nutrition", "bowl", "feeder", "supplement"],
        "discount_percent": 10,
        "message": "Nutrition essentials for healthy eating"
    },
    
    # Learn Services
    "puppy": {
        "categories": ["puppy", "training", "essentials"],
        "keywords": ["puppy", "training", "pad", "crate", "chew", "toy"],
        "discount_percent": 15,
        "message": "Puppy essentials for your learning journey"
    },
    "behavior": {
        "categories": ["calming", "anxiety", "training"],
        "keywords": ["calming", "anxiety", "thunder", "behavior", "spray", "diffuser"],
        "discount_percent": 15,
        "message": "Support behavioral training at home"
    }
}


# ==================== API ENDPOINTS ====================

class CrossSellRequest(BaseModel):
    service_id: str
    service_name: Optional[str] = None
    pillar: Optional[str] = None
    pet_id: Optional[str] = None
    limit: int = 6


class CrossSellResponse(BaseModel):
    products: List[Dict[str, Any]]
    discount_percent: int
    message: str
    service_matched: str
    total_found: int


@router.post("/recommendations")
async def get_cross_sell_recommendations(request: CrossSellRequest):
    """
    Get product recommendations based on a service booking
    """
    db = get_db()
    
    # Determine service type from ID or name
    service_type = None
    service_lower = (request.service_id + " " + (request.service_name or "")).lower()
    
    # Match service type
    for svc_type, mapping in SERVICE_TO_PRODUCT_MAPPING.items():
        if svc_type in service_lower:
            service_type = svc_type
            break
    
    # Fallback: check pillar
    if not service_type and request.pillar:
        pillar_to_service = {
            "care": "grooming",
            "fit": "fitness",
            "travel": "travel",
            "learn": "training",
            "celebrate": "birthday",
            "dine": "nutrition"
        }
        service_type = pillar_to_service.get(request.pillar)
    
    if not service_type:
        # Default to generic recommendations
        service_type = "grooming"
    
    mapping = SERVICE_TO_PRODUCT_MAPPING.get(service_type, SERVICE_TO_PRODUCT_MAPPING["grooming"])
    
    # Build product query
    query = {
        "is_active": {"$ne": False},
        "$or": [
            {"category": {"$in": mapping["categories"]}},
            {"tags": {"$in": mapping["categories"]}},
            {"base_tags": {"$in": mapping["categories"]}},
            {"name": {"$regex": "|".join(mapping["keywords"][:5]), "$options": "i"}},
            {"description": {"$regex": "|".join(mapping["keywords"][:3]), "$options": "i"}}
        ]
    }
    
    # Get products
    products = await db.products_master.find(query, {"_id": 0}).limit(request.limit * 2).to_list(request.limit * 2)
    
    # If not enough, fallback to broader search
    if len(products) < request.limit:
        fallback_query = {
            "is_active": {"$ne": False},
            "pillar": request.pillar or "care"
        }
        fallback_products = await db.products_master.find(fallback_query, {"_id": 0}).limit(request.limit).to_list(request.limit)
        
        existing_ids = {p.get("id") or p.get("product_id") for p in products}
        for p in fallback_products:
            pid = p.get("id") or p.get("product_id")
            if pid and pid not in existing_ids:
                products.append(p)
                if len(products) >= request.limit:
                    break
    
    # Limit results
    products = products[:request.limit]
    
    # Add cross-sell metadata to each product
    for product in products:
        product["cross_sell_discount"] = mapping["discount_percent"]
        product["original_price"] = product.get("price") or product.get("base_price") or 0
        if product["original_price"]:
            product["discounted_price"] = round(product["original_price"] * (1 - mapping["discount_percent"] / 100), 2)
    
    logger.info(f"[CROSS-SELL] Service '{service_type}' → {len(products)} products recommended")
    
    return {
        "products": products,
        "discount_percent": mapping["discount_percent"],
        "message": mapping["message"],
        "service_matched": service_type,
        "total_found": len(products)
    }


@router.get("/mapping")
async def get_service_product_mapping():
    """Get the service to product category mapping"""
    return {
        "mappings": SERVICE_TO_PRODUCT_MAPPING,
        "total_service_types": len(SERVICE_TO_PRODUCT_MAPPING)
    }


@router.post("/record-conversion")
async def record_cross_sell_conversion(
    service_id: str,
    product_id: str,
    user_id: Optional[str] = None
):
    """Record when a user adds a cross-sell product to cart"""
    db = get_db()
    
    conversion = {
        "service_id": service_id,
        "product_id": product_id,
        "user_id": user_id,
        "converted_at": datetime.now(timezone.utc),
        "type": "cross_sell"
    }
    
    await db.cross_sell_conversions.insert_one(conversion)
    
    logger.info(f"[CROSS-SELL] Conversion recorded: {service_id} → {product_id}")
    
    return {"success": True, "message": "Conversion recorded"}
