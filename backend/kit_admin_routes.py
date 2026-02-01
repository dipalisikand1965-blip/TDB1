"""
Kit Assembly & Mira Picks Admin Management
Allows admins to:
- Create, edit, delete kit templates
- Manage Mira's recommended picks
- Preview voice narration before publishing
- Control what Mira says vs what's displayed
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import uuid

router = APIRouter(prefix="/api/admin/kits", tags=["Kit Administration"])

# Database will be injected
db = None

def set_database(database):
    global db
    db = database

# Pydantic Models
class KitItem(BaseModel):
    product_id: str
    position: int = 0
    custom_narration: Optional[str] = None  # Override default narration
    highlight_reason: Optional[str] = None  # Why this item is included

class KitTemplate(BaseModel):
    name: str
    slug: str
    description: str
    category: str  # travel, cinema, birthday, wellness, etc.
    target_occasion: Optional[str] = None
    items: List[KitItem] = []
    intro_narration: str  # What Mira says at the start
    outro_narration: str  # What Mira says at the end
    is_active: bool = True
    priority: int = 0  # Higher = shown first
    display_image: Optional[str] = None
    target_pet_type: Optional[str] = None  # dog, cat, all
    target_breed: Optional[str] = None  # specific breed or null for all
    target_size: Optional[str] = None  # small, medium, large, or null for all

class MiraPick(BaseModel):
    product_id: str
    reason: str  # Why Mira recommends this
    voice_script: str  # What Mira says about this product
    display_tagline: str  # Short text shown in UI
    priority: int = 0
    is_active: bool = True
    target_categories: List[str] = []  # Which categories to show in
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None

# ============================================
# KIT TEMPLATE MANAGEMENT
# ============================================

@router.get("/templates")
async def get_kit_templates(
    category: Optional[str] = None,
    active_only: bool = True
):
    """Get all kit templates"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    query = {}
    if category:
        query["category"] = category
    if active_only:
        query["is_active"] = True
    
    templates = await db.kit_templates.find(query).sort("priority", -1).to_list(100)
    
    # Convert ObjectId to string
    for t in templates:
        t["id"] = str(t.pop("_id"))
    
    return {"templates": templates, "total": len(templates)}

@router.get("/templates/{template_id}")
async def get_kit_template(template_id: str):
    """Get a specific kit template by ID"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        template = await db.kit_templates.find_one({"_id": ObjectId(template_id)})
    except:
        template = await db.kit_templates.find_one({"slug": template_id})
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template["id"] = str(template.pop("_id"))
    
    # Fetch product details for each item
    product_ids = [item.get("product_id") for item in template.get("items", [])]
    if product_ids:
        products = await db.products.find({"id": {"$in": product_ids}}).to_list(100)
        product_map = {p["id"]: p for p in products}
        
        for item in template.get("items", []):
            product = product_map.get(item.get("product_id"))
            if product:
                product.pop("_id", None)
                item["product"] = product
    
    return template

@router.post("/templates")
async def create_kit_template(template: KitTemplate):
    """Create a new kit template"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    template_dict = template.dict()
    template_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    template_dict["updated_at"] = template_dict["created_at"]
    
    # Check for duplicate slug
    existing = await db.kit_templates.find_one({"slug": template.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Template with this slug already exists")
    
    result = await db.kit_templates.insert_one(template_dict)
    template_dict["id"] = str(result.inserted_id)
    template_dict.pop("_id", None)
    
    return {"message": "Kit template created", "template": template_dict}

@router.put("/templates/{template_id}")
async def update_kit_template(template_id: str, template: KitTemplate):
    """Update a kit template"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    template_dict = template.dict()
    template_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    try:
        result = await db.kit_templates.update_one(
            {"_id": ObjectId(template_id)},
            {"$set": template_dict}
        )
    except:
        result = await db.kit_templates.update_one(
            {"slug": template_id},
            {"$set": template_dict}
        )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Kit template updated"}

@router.delete("/templates/{template_id}")
async def delete_kit_template(template_id: str):
    """Delete a kit template"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        result = await db.kit_templates.delete_one({"_id": ObjectId(template_id)})
    except:
        result = await db.kit_templates.delete_one({"slug": template_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Kit template deleted"}

# ============================================
# MIRA PICKS MANAGEMENT
# ============================================

@router.get("/mira-picks")
async def get_mira_picks(
    active_only: bool = True,
    category: Optional[str] = None
):
    """Get all Mira picks"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    query = {}
    if active_only:
        query["is_active"] = True
    if category:
        query["target_categories"] = category
    
    picks = await db.mira_picks.find(query).sort("priority", -1).to_list(100)
    
    # Fetch product details
    product_ids = [p.get("product_id") for p in picks]
    if product_ids:
        products = await db.products.find({"id": {"$in": product_ids}}).to_list(100)
        product_map = {p["id"]: p for p in products}
        
        for pick in picks:
            pick["id"] = str(pick.pop("_id"))
            product = product_map.get(pick.get("product_id"))
            if product:
                product.pop("_id", None)
                pick["product"] = product
    
    return {"picks": picks, "total": len(picks)}

@router.post("/mira-picks")
async def create_mira_pick(pick: MiraPick):
    """Create a new Mira pick"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    pick_dict = pick.dict()
    pick_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    pick_dict["updated_at"] = pick_dict["created_at"]
    
    result = await db.mira_picks.insert_one(pick_dict)
    pick_dict["id"] = str(result.inserted_id)
    pick_dict.pop("_id", None)
    
    return {"message": "Mira pick created", "pick": pick_dict}

@router.put("/mira-picks/{pick_id}")
async def update_mira_pick(pick_id: str, pick: MiraPick):
    """Update a Mira pick"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    pick_dict = pick.dict()
    pick_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.mira_picks.update_one(
        {"_id": ObjectId(pick_id)},
        {"$set": pick_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Mira pick not found")
    
    return {"message": "Mira pick updated"}

@router.delete("/mira-picks/{pick_id}")
async def delete_mira_pick(pick_id: str):
    """Delete a Mira pick"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    result = await db.mira_picks.delete_one({"_id": ObjectId(pick_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mira pick not found")
    
    return {"message": "Mira pick deleted"}

# ============================================
# VOICE PREVIEW
# ============================================

@router.post("/preview-voice")
async def preview_voice_script(
    script: str = Body(..., embed=True),
    product_id: Optional[str] = Body(None, embed=True),
    kit_template_id: Optional[str] = Body(None, embed=True)
):
    """
    Generate preview data for voice narration.
    Returns the script that would be spoken by Mira's TTS.
    Frontend can use this to test the voice before publishing.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    result = {
        "script": script,
        "estimated_duration_seconds": len(script.split()) * 0.4,  # ~2.5 words per second
        "character_count": len(script)
    }
    
    # If product_id provided, get product context
    if product_id:
        product = await db.products.find_one({"id": product_id})
        if product:
            product.pop("_id", None)
            result["product"] = {
                "name": product.get("title") or product.get("name"),
                "price": product.get("price"),
                "image": product.get("images", [None])[0] if product.get("images") else product.get("image")
            }
    
    # If kit_template_id provided, get full kit context
    if kit_template_id:
        try:
            template = await db.kit_templates.find_one({"_id": ObjectId(kit_template_id)})
        except:
            template = await db.kit_templates.find_one({"slug": kit_template_id})
        
        if template:
            template.pop("_id", None)
            result["kit"] = {
                "name": template.get("name"),
                "items_count": len(template.get("items", []))
            }
    
    return result

@router.get("/voice-scripts/{template_id}")
async def get_all_voice_scripts(template_id: str):
    """
    Get all voice scripts for a kit template.
    Useful for reviewing the entire voice experience before publishing.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        template = await db.kit_templates.find_one({"_id": ObjectId(template_id)})
    except:
        template = await db.kit_templates.find_one({"slug": template_id})
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    scripts = []
    
    # Intro
    scripts.append({
        "type": "intro",
        "script": template.get("intro_narration", ""),
        "position": 0
    })
    
    # Product narrations
    product_ids = [item.get("product_id") for item in template.get("items", [])]
    if product_ids:
        products = await db.products.find({"id": {"$in": product_ids}}).to_list(100)
        product_map = {p["id"]: p for p in products}
        
        for i, item in enumerate(template.get("items", [])):
            product = product_map.get(item.get("product_id"))
            
            # Use custom narration if provided, otherwise generate default
            if item.get("custom_narration"):
                narration = item["custom_narration"]
            elif product:
                name = product.get("title") or product.get("name", "this item")
                price = product.get("price", "")
                price_text = f"at just {price} rupees" if price else ""
                narration = f"I've selected the {name} for your kit. A great choice {price_text}!"
            else:
                narration = "Here's another great item for your kit!"
            
            scripts.append({
                "type": "product",
                "script": narration,
                "position": i + 1,
                "product_id": item.get("product_id"),
                "product_name": product.get("title") or product.get("name") if product else None,
                "can_customize": True
            })
    
    # Outro
    scripts.append({
        "type": "outro",
        "script": template.get("outro_narration", ""),
        "position": len(template.get("items", [])) + 1
    })
    
    total_duration = sum(len(s["script"].split()) * 0.4 for s in scripts)
    
    return {
        "template_name": template.get("name"),
        "scripts": scripts,
        "total_scripts": len(scripts),
        "estimated_total_duration_seconds": round(total_duration, 1)
    }

# ============================================
# KIT CATEGORIES
# ============================================

@router.get("/categories")
async def get_kit_categories():
    """Get available kit categories"""
    return {
        "categories": [
            {"id": "travel", "name": "Travel Kits", "icon": "✈️", "description": "Everything for pet travel"},
            {"id": "cinema", "name": "Cinema Night", "icon": "🎬", "description": "Movie night with your pet"},
            {"id": "birthday", "name": "Birthday Kits", "icon": "🎂", "description": "Birthday celebration essentials"},
            {"id": "wellness", "name": "Wellness Kits", "icon": "💊", "description": "Health and wellness products"},
            {"id": "grooming", "name": "Grooming Kits", "icon": "✨", "description": "Grooming essentials"},
            {"id": "puppy", "name": "Puppy Starter", "icon": "🐕", "description": "New puppy essentials"},
            {"id": "senior", "name": "Senior Care", "icon": "🏆", "description": "Products for senior pets"},
            {"id": "seasonal", "name": "Seasonal Kits", "icon": "🌸", "description": "Season-specific products"},
            {"id": "adventure", "name": "Adventure Kits", "icon": "🏕️", "description": "Outdoor adventure gear"}
        ]
    }
