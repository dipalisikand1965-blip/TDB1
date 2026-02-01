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
    except Exception:
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
    except Exception:
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
    except Exception:
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
        except Exception:
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
    except Exception:
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

# ============================================
# SEED DEFAULT KITS
# ============================================

@router.post("/seed-defaults")
async def seed_default_kits():
    """Seed default kit templates with sample products"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Get some products to use in kits
    travel_products = await db.products.find({
        "$or": [
            {"tags": {"$in": ["travel", "carrier", "leash", "harness", "bowl", "bottle"]}},
            {"category": {"$regex": "travel|carrier|accessories", "$options": "i"}},
            {"title": {"$regex": "travel|carrier|leash|harness|bowl|bottle", "$options": "i"}}
        ]
    }).limit(10).to_list(10)
    
    treat_products = await db.products.find({
        "$or": [
            {"tags": {"$in": ["treat", "snack", "biscuit"]}},
            {"category": {"$regex": "treat|snack", "$options": "i"}},
            {"title": {"$regex": "treat|biscuit|cookie|snack", "$options": "i"}}
        ]
    }).limit(10).to_list(10)
    
    toy_products = await db.products.find({
        "$or": [
            {"tags": {"$in": ["toy", "ball", "chew"]}},
            {"category": {"$regex": "toy", "$options": "i"}},
            {"title": {"$regex": "toy|ball|chew|plush", "$options": "i"}}
        ]
    }).limit(10).to_list(10)
    
    grooming_products = await db.products.find({
        "$or": [
            {"tags": {"$in": ["grooming", "shampoo", "brush", "nail"]}},
            {"category": {"$regex": "grooming|bath", "$options": "i"}},
            {"title": {"$regex": "shampoo|brush|comb|nail", "$options": "i"}}
        ]
    }).limit(10).to_list(10)
    
    cake_products = await db.products.find({
        "$or": [
            {"tags": {"$in": ["cake", "birthday"]}},
            {"category": {"$regex": "cake|birthday", "$options": "i"}},
            {"title": {"$regex": "cake|birthday", "$options": "i"}}
        ]
    }).limit(5).to_list(5)
    
    # Default kit templates
    default_kits = [
        {
            "name": "Travel Essentials Kit",
            "slug": "travel-essentials",
            "description": "Everything your furry friend needs for a safe and comfortable journey. Perfect for road trips, flights, or any adventure!",
            "category": "travel",
            "intro_narration": "Hi! I'm Mira, your pet concierge. Planning a trip with your fur baby? Let me show you the Travel Essentials Kit I've curated! These items will keep your pet safe and comfortable on any adventure.",
            "outro_narration": "And that's your complete Travel Essentials Kit! Everything hand-picked to make your journey pawfect. Safe travels!",
            "is_active": True,
            "priority": 100,
            "target_pet_type": "dog",
            "items": [
                {"product_id": p.get("id"), "position": i+1, "custom_narration": f"First up, the {p.get('title', 'item')}! A must-have for travel comfort."}
                for i, p in enumerate(travel_products[:5])
            ]
        },
        {
            "name": "Cinema Night Kit",
            "slug": "cinema-night",
            "description": "Cozy movie night essentials for you and your pet. Snacks, comfort items, and entertainment!",
            "category": "cinema",
            "intro_narration": "Movie night with your best friend? I love it! Let me show you the Cinema Night Kit - everything you need for the pawfect cozy evening together.",
            "outro_narration": "That's your Cinema Night Kit complete! Now grab the popcorn, dim the lights, and enjoy quality time with your furry movie buddy!",
            "is_active": True,
            "priority": 90,
            "target_pet_type": "dog",
            "items": [
                {"product_id": p.get("id"), "position": i+1, "custom_narration": f"For movie snacking, the {p.get('title', 'treat')}! Healthy and delicious."}
                for i, p in enumerate(treat_products[:3])
            ] + [
                {"product_id": p.get("id"), "position": i+4, "custom_narration": f"And for entertainment during slow scenes, the {p.get('title', 'toy')}!"}
                for i, p in enumerate(toy_products[:2])
            ]
        },
        {
            "name": "Birthday Celebration Kit",
            "slug": "birthday-celebration",
            "description": "Make your pet's special day unforgettable! Cakes, treats, party accessories and gifts.",
            "category": "birthday",
            "intro_narration": "Happy Birthday to your fur baby! Let me show you our Birthday Celebration Kit - everything to make this day extra special!",
            "outro_narration": "That's your pawty kit ready! Time to celebrate your best friend's special day. May it be filled with treats, belly rubs, and lots of love!",
            "is_active": True,
            "priority": 95,
            "target_pet_type": "dog",
            "items": [
                {"product_id": p.get("id"), "position": i+1, "custom_narration": f"The star of the show - a delicious {p.get('title', 'cake')}! Made with pet-safe ingredients."}
                for i, p in enumerate(cake_products[:2])
            ] + [
                {"product_id": p.get("id"), "position": i+3, "custom_narration": f"Birthday treats! The {p.get('title', 'treat')} - because every birthday needs extra yummies!"}
                for i, p in enumerate(treat_products[:2])
            ]
        },
        {
            "name": "Grooming Spa Kit",
            "slug": "grooming-spa",
            "description": "Pamper your pet with professional-grade grooming essentials. Bath time made easy and enjoyable!",
            "category": "grooming",
            "intro_narration": "Spa day for your fur baby! Let me show you our Grooming Spa Kit - professional-grade products to keep your pet looking and smelling amazing!",
            "outro_narration": "Your Grooming Spa Kit is complete! Your pet is going to look absolutely gorgeous. Enjoy the pamper session!",
            "is_active": True,
            "priority": 80,
            "target_pet_type": "dog",
            "items": [
                {"product_id": p.get("id"), "position": i+1, "custom_narration": f"Essential for a fresh coat - the {p.get('title', 'grooming product')}!"}
                for i, p in enumerate(grooming_products[:5])
            ]
        },
        {
            "name": "Puppy Starter Kit",
            "slug": "puppy-starter",
            "description": "Welcome your new family member with all the essentials! Perfect for first-time pet parents.",
            "category": "puppy",
            "intro_narration": "Congratulations on your new puppy! Let me help you get started with the Puppy Starter Kit - everything a new fur parent needs!",
            "outro_narration": "That's everything for your new bundle of joy! Welcome to the amazing journey of pet parenthood. Your puppy is lucky to have you!",
            "is_active": True,
            "priority": 85,
            "target_pet_type": "dog",
            "target_size": "small",
            "items": [
                {"product_id": p.get("id"), "position": i+1, "custom_narration": f"A puppy essential - the {p.get('title', 'item')}! Perfect for your little one."}
                for i, p in enumerate((treat_products[:2] + toy_products[:2] + grooming_products[:1]))
            ]
        }
    ]
    
    # Insert or update kits
    created = 0
    updated = 0
    for kit in default_kits:
        # Only include items with valid product_ids
        kit["items"] = [item for item in kit["items"] if item.get("product_id")]
        
        existing = await db.kit_templates.find_one({"slug": kit["slug"]})
        if existing:
            kit["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.kit_templates.update_one(
                {"slug": kit["slug"]},
                {"$set": kit}
            )
            updated += 1
        else:
            kit["created_at"] = datetime.now(timezone.utc).isoformat()
            kit["updated_at"] = kit["created_at"]
            await db.kit_templates.insert_one(kit)
            created += 1
    
    return {
        "message": "Default kits seeded successfully",
        "created": created,
        "updated": updated,
        "total_kits": len(default_kits)
    }

# ============================================
# MIRA AI INTEGRATION - Get kits for Mira to recommend
# ============================================

@router.get("/mira/recommendations")
async def get_kits_for_mira(
    pet_type: Optional[str] = None,
    pet_size: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 5
):
    """
    Get active kit recommendations for Mira AI to suggest.
    This endpoint is used by Mira to know what kits are available to recommend.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    query = {"is_active": True}
    if pet_type:
        query["$or"] = [
            {"target_pet_type": pet_type},
            {"target_pet_type": "all"},
            {"target_pet_type": None}
        ]
    if pet_size:
        query["$or"] = query.get("$or", []) + [
            {"target_size": pet_size},
            {"target_size": None}
        ]
    if category:
        query["category"] = category
    
    kits = await db.kit_templates.find(query).sort("priority", -1).limit(limit).to_list(limit)
    
    recommendations = []
    for kit in kits:
        kit_data = {
            "id": str(kit.pop("_id")),
            "name": kit.get("name"),
            "slug": kit.get("slug"),
            "category": kit.get("category"),
            "description": kit.get("description"),
            "intro_narration": kit.get("intro_narration"),
            "items_count": len(kit.get("items", [])),
            "priority": kit.get("priority", 0)
        }
        recommendations.append(kit_data)
    
    return {"kits": recommendations, "total": len(recommendations)}

@router.get("/mira/picks")
async def get_active_mira_picks(limit: int = 10):
    """
    Get active Mira picks for the AI to recommend.
    These are the admin-curated products that Mira should highlight.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    picks = await db.mira_picks.find({"is_active": True}).sort("priority", -1).limit(limit).to_list(limit)
    
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
                pick["product"] = {
                    "id": product.get("id"),
                    "title": product.get("title") or product.get("name"),
                    "price": product.get("price"),
                    "image": product.get("images", [None])[0] if product.get("images") else product.get("image")
                }
    
    return {"picks": picks, "total": len(picks)}

# ============================================
# CSV EXPORT/IMPORT
# ============================================

@router.get("/export/csv")
async def export_kits_csv():
    """Export all kit templates as CSV"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    templates = await db.kit_templates.find({}).to_list(100)
    
    # Create CSV content
    headers = ["id", "name", "slug", "category", "description", "intro_narration", "outro_narration", "is_active", "priority", "target_pet_type", "target_size", "items_count", "created_at", "updated_at"]
    
    rows = [",".join(headers)]
    for t in templates:
        row = [
            str(t.get("_id", "")),
            f'"{t.get("name", "")}"',
            t.get("slug", ""),
            t.get("category", ""),
            f'"{t.get("description", "").replace(chr(34), chr(39))}"',
            f'"{t.get("intro_narration", "").replace(chr(34), chr(39))}"',
            f'"{t.get("outro_narration", "").replace(chr(34), chr(39))}"',
            str(t.get("is_active", True)),
            str(t.get("priority", 0)),
            t.get("target_pet_type", ""),
            t.get("target_size", ""),
            str(len(t.get("items", []))),
            t.get("created_at", ""),
            t.get("updated_at", "")
        ]
        rows.append(",".join(row))
    
    return {"csv": "\n".join(rows), "count": len(templates)}

@router.get("/mira-picks/export/csv")
async def export_mira_picks_csv():
    """Export all Mira picks as CSV"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    picks = await db.mira_picks.find({}).to_list(100)
    
    # Fetch product details
    product_ids = [p.get("product_id") for p in picks]
    products = await db.products.find({"id": {"$in": product_ids}}).to_list(100) if product_ids else []
    product_map = {p["id"]: p for p in products}
    
    headers = ["id", "product_id", "product_name", "display_tagline", "reason", "voice_script", "priority", "is_active", "created_at"]
    
    rows = [",".join(headers)]
    for p in picks:
        product = product_map.get(p.get("product_id"), {})
        row = [
            str(p.get("_id", "")),
            p.get("product_id", ""),
            f'"{product.get("title", product.get("name", ""))}"',
            f'"{p.get("display_tagline", "").replace(chr(34), chr(39))}"',
            f'"{p.get("reason", "").replace(chr(34), chr(39))}"',
            f'"{p.get("voice_script", "").replace(chr(34), chr(39))}"',
            str(p.get("priority", 0)),
            str(p.get("is_active", True)),
            p.get("created_at", "")
        ]
        rows.append(",".join(row))
    
    return {"csv": "\n".join(rows), "count": len(picks)}
