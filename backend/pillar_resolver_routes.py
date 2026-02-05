"""
Pillar Resolver API Routes
Public API endpoints for fetching products/services by pillar using rule-based resolver
"""

from fastapi import APIRouter, Query
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pillar-resolver", tags=["pillar-resolver"])

# Database reference (set from server.py)
_db = None

def set_resolver_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


@router.get("/products/{pillar_name}")
async def get_pillar_products(
    pillar_name: str,
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0),
    category: Optional[str] = None
):
    """
    Get products for a pillar using the rule-based resolver.
    
    This endpoint replaces direct queries using the 'pillar' field.
    It uses base_tags and pillar_rules_v1.yaml for filtering.
    
    Args:
        pillar_name: One of the 14 pillars (travel, care, celebrate, etc.)
        limit: Max products to return (default 20, max 100)
        skip: Pagination offset
        category: Optional additional category filter
        
    Returns:
        List of products matching the pillar rules
    """
    from pillar_resolver import get_resolver
    
    db = get_db()
    resolver = get_resolver()
    
    # Validate pillar
    if not resolver.validate_pillar(pillar_name):
        # Fallback to direct pillar field query for unknown pillars
        logger.warning(f"Unknown pillar '{pillar_name}', using legacy query")
        query = {"pillar": pillar_name, "is_active": {"$ne": False}}
        if category:
            query["category"] = category
        
        products = await db.products_master.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
        return {
            "pillar": pillar_name,
            "products": products,
            "count": len(products),
            "resolver_used": False,
            "message": f"Using legacy pillar field for unknown pillar '{pillar_name}'"
        }
    
    # Build additional filters
    additional_filters = {}
    if category:
        additional_filters["category"] = category
    
    # Get products via resolver
    products = await resolver.get_products(
        pillar=pillar_name,
        db=db,
        limit=limit,
        skip=skip,
        additional_filters=additional_filters if additional_filters else None
    )
    
    # Get total count for pagination
    query = resolver.get_product_query(pillar_name)
    query["is_active"] = {"$ne": False}
    if additional_filters:
        query.update(additional_filters)
    total = await db.products_master.count_documents(query)
    
    logger.info(f"[PILLAR API] {pillar_name} returned {len(products)} products (total: {total})")
    
    return {
        "pillar": pillar_name,
        "products": products,
        "count": len(products),
        "total": total,
        "skip": skip,
        "limit": limit,
        "resolver_used": True
    }


@router.get("/services/{pillar_name}")
async def get_pillar_services(
    pillar_name: str,
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0)
):
    """
    Get services for a pillar using the rule-based resolver.
    
    Args:
        pillar_name: One of the 14 pillars
        limit: Max services to return
        skip: Pagination offset
        
    Returns:
        List of services matching the pillar rules
    """
    from pillar_resolver import get_resolver
    
    db = get_db()
    resolver = get_resolver()
    
    if not resolver.validate_pillar(pillar_name):
        return {
            "pillar": pillar_name,
            "services": [],
            "count": 0,
            "resolver_used": False,
            "message": f"Unknown pillar '{pillar_name}'"
        }
    
    services = await resolver.get_services(
        pillar=pillar_name,
        db=db,
        limit=limit,
        skip=skip
    )
    
    return {
        "pillar": pillar_name,
        "services": services,
        "count": len(services),
        "resolver_used": True
    }


@router.get("/all/{pillar_name}")
async def get_pillar_all(
    pillar_name: str,
    product_limit: int = Query(default=20, le=100),
    service_limit: int = Query(default=10, le=50)
):
    """
    Get both products and services for a pillar.
    
    Args:
        pillar_name: One of the 14 pillars
        product_limit: Max products
        service_limit: Max services
        
    Returns:
        Combined products and services for the pillar
    """
    from pillar_resolver import get_resolver
    
    db = get_db()
    resolver = get_resolver()
    
    if not resolver.validate_pillar(pillar_name):
        return {
            "pillar": pillar_name,
            "products": [],
            "services": [],
            "resolver_used": False
        }
    
    result = await resolver.get_all(
        pillar=pillar_name,
        db=db,
        product_limit=product_limit,
        service_limit=service_limit
    )
    
    result["resolver_used"] = True
    return result


@router.get("/rules/{pillar_name}")
async def get_pillar_rules(pillar_name: str):
    """
    Get the rules for a specific pillar (for debugging/admin).
    
    Returns the must/boost/exclude rules from pillar_rules_v1.yaml
    """
    from pillar_resolver import get_resolver
    
    resolver = get_resolver()
    
    if not resolver.validate_pillar(pillar_name):
        return {"error": f"Unknown pillar: {pillar_name}"}
    
    rules = resolver.rules.get(pillar_name, {})
    
    return {
        "pillar": pillar_name,
        "rules": rules,
        "valid_pillars": resolver.valid_pillars
    }


@router.get("/list")
async def list_pillars():
    """
    List all valid pillars and their rules summary.
    """
    from pillar_resolver import get_resolver
    
    resolver = get_resolver()
    
    pillars = []
    for pillar_name in resolver.valid_pillars:
        rules = resolver.rules.get(pillar_name, {})
        product_rules = rules.get("products", {})
        service_rules = rules.get("services", {})
        
        pillars.append({
            "name": pillar_name,
            "has_product_rules": bool(product_rules.get("must") or product_rules.get("exclude")),
            "has_service_rules": bool(service_rules.get("must") or service_rules.get("exclude")),
            "product_must": list(product_rules.get("must", {}).keys()),
            "product_exclude": list(product_rules.get("exclude", {}).keys()),
            "service_must": list(service_rules.get("must", {}).keys())
        })
    
    return {
        "pillars": pillars,
        "total": len(pillars)
    }
