"""
Occasion Box Routes
Handles occasion-specific box templates and member box building

The Doggy Company
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

# Will be set from server.py
db = None
_verify_admin_func = None

def set_occasion_box_db(database):
    global db
    db = database

def set_occasion_box_admin_verify(verify_func):
    global _verify_admin_func
    _verify_admin_func = verify_func

from fastapi.security import HTTPBasic, HTTPBasicCredentials
security = HTTPBasic()

async def get_admin_user(credentials: HTTPBasicCredentials = Depends(security)):
    if _verify_admin_func:
        return _verify_admin_func(credentials)
    raise HTTPException(status_code=500, detail="Admin verification not configured")

# ==================== MODELS ====================

class BoxCategory(BaseModel):
    """A category within an occasion box (e.g., Cakes, Accessories)"""
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None  # Emoji or icon name
    min_items: int = 0
    max_items: int = 10
    required: bool = False
    product_filters: Dict[str, Any] = {}  # MongoDB query filters for this category
    featured_product_ids: List[str] = []  # Manually featured products

class OccasionBoxTemplate(BaseModel):
    """Template for an occasion box"""
    name: str
    slug: str
    occasion_type: str  # birthday, gotcha_day, festival, etc.
    description: Optional[str] = None
    icon: str = "🎁"
    cover_image: Optional[str] = None
    theme_color: str = "#8B5CF6"
    categories: List[BoxCategory] = []
    bundle_discount_percent: float = 0  # e.g., 10 for 10% off
    min_total_items: int = 1
    is_active: bool = True
    display_order: int = 0

class OccasionBoxTemplateCreate(BaseModel):
    name: str
    slug: str
    occasion_type: str
    description: Optional[str] = None
    icon: str = "🎁"
    cover_image: Optional[str] = None
    theme_color: str = "#8B5CF6"
    categories: List[Dict] = []
    bundle_discount_percent: float = 0
    min_total_items: int = 1
    is_active: bool = True
    display_order: int = 0

# ==================== ADMIN ROUTES ====================

admin_router = APIRouter(prefix="/api/admin/occasion-boxes", tags=["Admin Occasion Boxes"])

@admin_router.get("")
async def get_all_templates(username: str = Depends(get_admin_user)):
    """Get all occasion box templates"""
    templates = await db.occasion_box_templates.find({}, {"_id": 0}).to_list(100)
    return {"templates": templates}

@admin_router.post("")
async def create_template(template: OccasionBoxTemplateCreate, username: str = Depends(get_admin_user)):
    """Create a new occasion box template"""
    template_id = f"obox-{uuid.uuid4().hex[:8]}"
    
    template_data = {
        "id": template_id,
        **template.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": username
    }
    
    await db.occasion_box_templates.insert_one(template_data)
    return {"message": "Template created", "template": {k: v for k, v in template_data.items() if k != "_id"}}

@admin_router.put("/{template_id}")
async def update_template(template_id: str, template: OccasionBoxTemplateCreate, username: str = Depends(get_admin_user)):
    """Update an occasion box template"""
    existing = await db.occasion_box_templates.find_one({"id": template_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = {
        **template.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": username
    }
    
    await db.occasion_box_templates.update_one({"id": template_id}, {"$set": update_data})
    return {"message": "Template updated"}

@admin_router.delete("/{template_id}")
async def delete_template(template_id: str, username: str = Depends(get_admin_user)):
    """Delete an occasion box template"""
    result = await db.occasion_box_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}

@admin_router.post("/seed-defaults")
async def seed_default_templates(username: str = Depends(get_admin_user)):
    """Seed default occasion box templates"""
    
    default_templates = [
        {
            "id": "obox-birthday",
            "name": "Birthday Box",
            "slug": "birthday-box",
            "occasion_type": "birthday",
            "description": "Everything you need for the perfect birthday celebration!",
            "icon": "🎂",
            "theme_color": "#EC4899",
            "categories": [
                {
                    "id": "cake",
                    "name": "Birthday Cake",
                    "description": "Choose the perfect cake for your furry friend",
                    "icon": "🎂",
                    "min_items": 1,
                    "max_items": 1,
                    "required": True,
                    "product_filters": {"$or": [
                        {"category": {"$regex": "cake", "$options": "i"}},
                        {"tags": {"$in": ["cake", "birthday-cake"]}}
                    ]},
                    "featured_product_ids": []
                },
                {
                    "id": "accessories",
                    "name": "Party Accessories",
                    "description": "Bandanas, hats, bow ties and more",
                    "icon": "🎀",
                    "min_items": 0,
                    "max_items": 3,
                    "required": False,
                    "product_filters": {"$or": [
                        {"category": {"$regex": "accessor|bandana|hat|bow", "$options": "i"}},
                        {"tags": {"$in": ["accessory", "bandana", "party-hat", "bow-tie", "birthday"]}}
                    ]},
                    "featured_product_ids": []
                },
                {
                    "id": "treats",
                    "name": "Treats & Pupcakes",
                    "description": "Delicious treats for the birthday pup",
                    "icon": "🍖",
                    "min_items": 0,
                    "max_items": 5,
                    "required": False,
                    "product_filters": {"$or": [
                        {"category": {"$regex": "treat|pupcake|biscuit", "$options": "i"}},
                        {"tags": {"$in": ["treats", "pupcakes", "biscuits", "snacks"]}}
                    ]},
                    "featured_product_ids": []
                },
                {
                    "id": "toys",
                    "name": "Birthday Toys",
                    "description": "A special toy for their special day",
                    "icon": "🧸",
                    "min_items": 0,
                    "max_items": 2,
                    "required": False,
                    "product_filters": {"$or": [
                        {"category": {"$regex": "toy", "$options": "i"}},
                        {"tags": {"$in": ["toys", "plush", "squeaky"]}}
                    ]},
                    "featured_product_ids": []
                }
            ],
            "bundle_discount_percent": 10,
            "min_total_items": 1,
            "is_active": True,
            "display_order": 1
        },
        {
            "id": "obox-gotcha",
            "name": "Gotcha Day Box",
            "slug": "gotcha-day-box",
            "occasion_type": "gotcha_day",
            "description": "Celebrate the day they joined your family!",
            "icon": "💝",
            "theme_color": "#8B5CF6",
            "categories": [
                {
                    "id": "treats",
                    "name": "Celebration Treats",
                    "description": "Special treats for your special bond",
                    "icon": "🍖",
                    "min_items": 1,
                    "max_items": 5,
                    "required": True,
                    "product_filters": {"$or": [
                        {"category": {"$regex": "treat", "$options": "i"}},
                        {"tags": {"$in": ["treats", "premium-treats"]}}
                    ]},
                    "featured_product_ids": []
                },
                {
                    "id": "toys",
                    "name": "New Toy",
                    "description": "A new toy to mark another year together",
                    "icon": "🧸",
                    "min_items": 0,
                    "max_items": 2,
                    "required": False,
                    "product_filters": {"$or": [
                        {"category": {"$regex": "toy", "$options": "i"}},
                        {"tags": {"$in": ["toys"]}}
                    ]},
                    "featured_product_ids": []
                },
                {
                    "id": "photo",
                    "name": "Photo Session",
                    "description": "Capture the memories with a professional photoshoot",
                    "icon": "📸",
                    "min_items": 0,
                    "max_items": 1,
                    "required": False,
                    "product_filters": {},
                    "featured_product_ids": []
                }
            ],
            "bundle_discount_percent": 5,
            "min_total_items": 1,
            "is_active": True,
            "display_order": 2
        },
        {
            "id": "obox-festival",
            "name": "Festival Box",
            "slug": "festival-box",
            "occasion_type": "festival",
            "description": "Celebrate festivals with your furry family member!",
            "icon": "🎉",
            "theme_color": "#F59E0B",
            "categories": [
                {
                    "id": "themed-treats",
                    "name": "Festival Treats",
                    "description": "Festive themed treats",
                    "icon": "🍪",
                    "min_items": 1,
                    "max_items": 5,
                    "required": True,
                    "product_filters": {"$or": [
                        {"tags": {"$in": ["diwali", "christmas", "holi", "festival", "seasonal"]}}
                    ]},
                    "featured_product_ids": []
                },
                {
                    "id": "themed-accessories",
                    "name": "Festival Accessories",
                    "description": "Festive bandanas, outfits and more",
                    "icon": "👔",
                    "min_items": 0,
                    "max_items": 3,
                    "required": False,
                    "product_filters": {"$or": [
                        {"category": {"$regex": "accessor|clothing|outfit", "$options": "i"}},
                        {"tags": {"$in": ["festive", "costume", "outfit"]}}
                    ]},
                    "featured_product_ids": []
                }
            ],
            "bundle_discount_percent": 10,
            "min_total_items": 1,
            "is_active": True,
            "display_order": 3
        }
    ]
    
    inserted = 0
    for template in default_templates:
        existing = await db.occasion_box_templates.find_one({"id": template["id"]})
        if not existing:
            template["created_at"] = datetime.now(timezone.utc).isoformat()
            template["updated_at"] = datetime.now(timezone.utc).isoformat()
            template["created_by"] = username
            await db.occasion_box_templates.insert_one(template)
            inserted += 1
    
    return {"message": f"Seeded {inserted} templates", "total": len(default_templates)}


# ==================== PUBLIC ROUTES ====================

public_router = APIRouter(prefix="/api/occasion-boxes", tags=["Occasion Boxes"])

@public_router.get("")
async def get_active_templates():
    """Get all active occasion box templates (public)"""
    templates = await db.occasion_box_templates.find(
        {"is_active": True}, 
        {"_id": 0}
    ).sort("display_order", 1).to_list(50)
    return {"templates": templates}

@public_router.get("/{slug}")
async def get_template_by_slug(slug: str):
    """Get a specific occasion box template by slug"""
    template = await db.occasion_box_templates.find_one(
        {"slug": slug, "is_active": True},
        {"_id": 0}
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@public_router.get("/{slug}/products")
async def get_template_products(slug: str):
    """Get products for each category in a template"""
    template = await db.occasion_box_templates.find_one(
        {"slug": slug, "is_active": True},
        {"_id": 0}
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    category_products = {}
    
    for category in template.get("categories", []):
        cat_id = category.get("id")
        filters = category.get("product_filters", {})
        featured_ids = category.get("featured_product_ids", [])
        
        products = []
        
        # First get featured products
        if featured_ids:
            featured = await db.products_master.find(
                {"id": {"$in": featured_ids}},
                {"_id": 0}
            ).to_list(len(featured_ids))
            for p in featured:
                p["is_featured"] = True
            products.extend(featured)
        
        # Then get filtered products
        if filters:
            # Add is_active filter
            query = {"$and": [filters, {"is_active": {"$ne": False}}]}
            filtered = await db.products_master.find(query, {"_id": 0}).limit(20).to_list(20)
            
            # Don't duplicate featured products
            featured_set = set(featured_ids)
            for p in filtered:
                if p.get("id") not in featured_set:
                    products.append(p)
        
        category_products[cat_id] = products[:20]  # Limit to 20 per category
    
    return {
        "template": template,
        "products": category_products
    }

@public_router.get("/by-occasion/{occasion_type}")
async def get_template_by_occasion(occasion_type: str):
    """Get template for a specific occasion type"""
    template = await db.occasion_box_templates.find_one(
        {"occasion_type": occasion_type, "is_active": True},
        {"_id": 0}
    )
    if not template:
        raise HTTPException(status_code=404, detail=f"No template found for occasion: {occasion_type}")
    return template
