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
# SEED DEFAULT KITS - ALL 14 LIFE PILLARS
# ============================================

@router.post("/seed-defaults")
async def seed_default_kits():
    """Seed default kit templates for all 14 Life Pillars with sample products"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Get products by category for kit assembly
    async def get_products_by_keywords(keywords, limit=10):
        return await db.products.find({
            "$or": [
                {"tags": {"$in": keywords}},
                {"category": {"$regex": "|".join(keywords), "$options": "i"}},
                {"title": {"$regex": "|".join(keywords), "$options": "i"}}
            ]
        }).limit(limit).to_list(limit)
    
    # Fetch products for different categories
    travel_products = await get_products_by_keywords(["travel", "carrier", "leash", "harness", "bowl", "bottle", "portable"])
    treat_products = await get_products_by_keywords(["treat", "snack", "biscuit", "cookie", "chew"])
    toy_products = await get_products_by_keywords(["toy", "ball", "plush", "rope", "interactive"])
    grooming_products = await get_products_by_keywords(["grooming", "shampoo", "brush", "comb", "nail", "bath"])
    cake_products = await get_products_by_keywords(["cake", "birthday", "celebration"])
    health_products = await get_products_by_keywords(["health", "supplement", "vitamin", "dental", "wellness"])
    food_products = await get_products_by_keywords(["food", "kibble", "meal", "nutrition"])
    bed_products = await get_products_by_keywords(["bed", "blanket", "mat", "cushion", "comfort"])
    training_products = await get_products_by_keywords(["training", "clicker", "whistle", "agility"])
    safety_products = await get_products_by_keywords(["safety", "first aid", "emergency", "medical"])
    collar_products = await get_products_by_keywords(["collar", "tag", "id", "microchip"])
    outdoor_products = await get_products_by_keywords(["outdoor", "rain", "jacket", "boot", "paw"])
    
    # All products as fallback
    all_products = await db.products.find({}).limit(50).to_list(50)
    
    def make_items(products, narration_template):
        return [
            {"product_id": p.get("id"), "position": i+1, "custom_narration": narration_template.format(name=p.get('title', p.get('name', 'this item')))}
            for i, p in enumerate(products[:5]) if p.get("id")
        ]
    
    # =============================================
    # 14 LIFE PILLARS KITS
    # =============================================
    default_kits = [
        # 1. CELEBRATE 🎉
        {
            "name": "Birthday Celebration Kit",
            "slug": "celebrate-birthday",
            "description": "Make your pet's birthday unforgettable! Cakes, treats, party accessories and gifts.",
            "category": "celebrate",
            "pillar": "celebrate",
            "intro_narration": "Happy Birthday to your fur baby! I'm Mira, and I've put together the perfect Birthday Celebration Kit to make this day extra special!",
            "outro_narration": "That's your pawty kit ready! Time to celebrate your best friend's special day. May it be filled with treats, belly rubs, and lots of love!",
            "is_active": True,
            "priority": 100,
            "target_pet_type": "dog",
            "items": make_items(cake_products + treat_products, "For the celebration - {name}! A must-have for the big day!")
        },
        {
            "name": "Gotcha Day Kit",
            "slug": "celebrate-gotcha",
            "description": "Celebrate the anniversary of when your pet joined your family!",
            "category": "celebrate",
            "pillar": "celebrate",
            "intro_narration": "It's your Gotcha Day anniversary! Let me help you celebrate the day your fur baby became family with this special kit!",
            "outro_narration": "Happy Gotcha Day! Here's to many more years of unconditional love and wagging tails!",
            "is_active": True,
            "priority": 95,
            "target_pet_type": "dog",
            "items": make_items(treat_products + toy_products, "A special treat for this special day - {name}!")
        },
        
        # 2. DINE 🍽️
        {
            "name": "Gourmet Dining Kit",
            "slug": "dine-gourmet",
            "description": "Premium dining essentials for the discerning pet palate. Elevated bowls, gourmet treats, and dining accessories.",
            "category": "dine",
            "pillar": "dine",
            "intro_narration": "Time to elevate your pet's dining experience! I've curated the Gourmet Dining Kit with premium items for your furry foodie!",
            "outro_narration": "Your pet's dining setup is now restaurant-worthy! Bon appétit, little one!",
            "is_active": True,
            "priority": 88,
            "target_pet_type": "dog",
            "items": make_items(food_products + treat_products, "For fine dining - {name}! Your pet deserves the best!")
        },
        
        # 3. STAY 🏨
        {
            "name": "Staycation Comfort Kit",
            "slug": "stay-comfort",
            "description": "Everything for a cozy staycation or hotel stay. Portable bed, comfort items, and calming essentials.",
            "category": "stay",
            "pillar": "stay",
            "intro_narration": "Planning a staycation or hotel stay with your pet? The Comfort Kit has everything to make any place feel like home!",
            "outro_narration": "Your pet's home-away-from-home kit is ready! Sweet dreams wherever you stay!",
            "is_active": True,
            "priority": 85,
            "target_pet_type": "dog",
            "items": make_items(bed_products + toy_products, "For comfort away from home - {name}!")
        },
        
        # 4. TRAVEL ✈️
        {
            "name": "Travel Essentials Kit",
            "slug": "travel-essentials",
            "description": "Everything for safe and comfortable pet travel. Carriers, portable bowls, and journey essentials.",
            "category": "travel",
            "pillar": "travel",
            "intro_narration": "Adventure awaits! I'm Mira, and I've prepared the Travel Essentials Kit to keep your pet safe and happy on any journey!",
            "outro_narration": "Your travel kit is packed and ready! Safe travels to you and your furry co-pilot!",
            "is_active": True,
            "priority": 92,
            "target_pet_type": "dog",
            "items": make_items(travel_products, "Essential for travel - {name}! A must-have for the journey!")
        },
        
        # 5. CARE 💊
        {
            "name": "Wellness Care Kit",
            "slug": "care-wellness",
            "description": "Daily health and wellness essentials. Supplements, dental care, and preventive health products.",
            "category": "care",
            "pillar": "care",
            "intro_narration": "Your pet's health is precious! The Wellness Care Kit has everything for daily health maintenance and preventive care.",
            "outro_narration": "Prevention is the best medicine! Your pet's wellness routine is now complete!",
            "is_active": True,
            "priority": 90,
            "target_pet_type": "dog",
            "items": make_items(health_products, "For daily wellness - {name}! Keeping your pet healthy and happy!")
        },
        {
            "name": "Grooming Spa Kit",
            "slug": "care-grooming",
            "description": "Professional-grade grooming essentials. Bath products, brushes, and pampering supplies.",
            "category": "care",
            "pillar": "care",
            "intro_narration": "Spa day for your fur baby! The Grooming Spa Kit has professional-grade products to keep your pet looking and smelling amazing!",
            "outro_narration": "Your pet is going to look absolutely gorgeous! Enjoy the pamper session!",
            "is_active": True,
            "priority": 87,
            "target_pet_type": "dog",
            "items": make_items(grooming_products, "For a fresh look - {name}! Grooming made easy!")
        },
        
        # 6. ENJOY 🎬
        {
            "name": "Cinema Night Kit",
            "slug": "enjoy-cinema",
            "description": "Cozy movie night essentials. Snacks, comfort items, and entertainment for you and your pet.",
            "category": "enjoy",
            "pillar": "enjoy",
            "intro_narration": "Movie night with your best friend? I love it! The Cinema Night Kit has everything for the pawfect cozy evening together!",
            "outro_narration": "Grab the popcorn, dim the lights, and enjoy quality time with your furry movie buddy!",
            "is_active": True,
            "priority": 82,
            "target_pet_type": "dog",
            "items": make_items(treat_products + toy_products + bed_products, "For cozy movie nights - {name}!")
        },
        {
            "name": "Playtime Fun Kit",
            "slug": "enjoy-playtime",
            "description": "Hours of entertainment! Interactive toys, balls, and enrichment activities.",
            "category": "enjoy",
            "pillar": "enjoy",
            "intro_narration": "Let's have some fun! The Playtime Kit is packed with toys and activities to keep your pet entertained and mentally stimulated!",
            "outro_narration": "Playtime is the best time! Get ready for wagging tails and happy zoomies!",
            "is_active": True,
            "priority": 80,
            "target_pet_type": "dog",
            "items": make_items(toy_products, "For endless fun - {name}! Let the games begin!")
        },
        
        # 7. FIT 💪
        {
            "name": "Fitness & Exercise Kit",
            "slug": "fit-exercise",
            "description": "Stay active together! Agility toys, fetch gear, and exercise essentials for healthy pets.",
            "category": "fit",
            "pillar": "fit",
            "intro_narration": "Let's get moving! The Fitness Kit has everything to keep your pet active, healthy, and full of energy!",
            "outro_narration": "A fit pet is a happy pet! Time to burn some energy and have a blast!",
            "is_active": True,
            "priority": 78,
            "target_pet_type": "dog",
            "items": make_items(toy_products + training_products + outdoor_products, "For an active lifestyle - {name}!")
        },
        
        # 8. LEARN 📚
        {
            "name": "Training Starter Kit",
            "slug": "learn-training",
            "description": "Essential training tools and treats. Perfect for teaching new tricks and reinforcing good behavior.",
            "category": "learn",
            "pillar": "learn",
            "intro_narration": "Ready to teach some new tricks? The Training Starter Kit has all the tools for effective, positive reinforcement training!",
            "outro_narration": "With patience and these tools, your pet will be a star student! Happy training!",
            "is_active": True,
            "priority": 75,
            "target_pet_type": "dog",
            "items": make_items(training_products + treat_products, "For successful training - {name}! Positive reinforcement for the win!")
        },
        
        # 9. PAPERWORK 📋
        {
            "name": "Pet Documentation Kit",
            "slug": "paperwork-docs",
            "description": "Organization essentials for pet parents. Document holders, ID tags, and record keeping supplies.",
            "category": "paperwork",
            "pillar": "paperwork",
            "intro_narration": "Stay organized with the Documentation Kit! Everything you need to keep your pet's important records safe and accessible.",
            "outro_narration": "Organization is key! Your pet's paperwork is now sorted and ready for any situation!",
            "is_active": True,
            "priority": 65,
            "target_pet_type": "dog",
            "items": make_items(collar_products + safety_products, "For organization - {name}! Keep everything in order!")
        },
        
        # 10. ADVISORY 🎓
        {
            "name": "New Pet Parent Kit",
            "slug": "advisory-newparent",
            "description": "Everything a first-time pet parent needs. Starter essentials plus guidance for new beginnings.",
            "category": "advisory",
            "pillar": "advisory",
            "intro_narration": "Welcome to pet parenthood! This New Pet Parent Kit has all the essentials plus tips for your exciting journey ahead!",
            "outro_narration": "You're going to be an amazing pet parent! This kit has you covered for the adventure ahead!",
            "is_active": True,
            "priority": 85,
            "target_pet_type": "dog",
            "target_size": "small",
            "items": make_items(food_products + toy_products + grooming_products + collar_products, "A starter essential - {name}! Perfect for new pet parents!")
        },
        
        # 11. EMERGENCY 🚨
        {
            "name": "Pet First Aid Kit",
            "slug": "emergency-firstaid",
            "description": "Be prepared for emergencies. First aid supplies, emergency contacts holder, and safety essentials.",
            "category": "emergency",
            "pillar": "emergency",
            "intro_narration": "Safety first! The Pet First Aid Kit prepares you for any emergency. Because being prepared means peace of mind.",
            "outro_narration": "You're now prepared for the unexpected. Stay safe, and hopefully you'll never need to use this kit!",
            "is_active": True,
            "priority": 88,
            "target_pet_type": "dog",
            "items": make_items(safety_products + health_products, "For emergencies - {name}! Safety is our priority!")
        },
        
        # 12. FAREWELL 🌈
        {
            "name": "Memorial & Comfort Kit",
            "slug": "farewell-memorial",
            "description": "Thoughtful items for honoring a beloved pet's memory. Memorial keepsakes and comfort items.",
            "category": "farewell",
            "pillar": "farewell",
            "intro_narration": "Losing a pet is never easy. This Memorial Kit helps honor your beloved friend's memory with thoughtful keepsakes.",
            "outro_narration": "They may be gone, but they're never forgotten. May these items bring you comfort and beautiful memories.",
            "is_active": True,
            "priority": 60,
            "target_pet_type": "dog",
            "items": make_items(all_products[:3], "To cherish memories - {name}. A thoughtful keepsake.")
        },
        
        # 13. ADOPT 🏠
        {
            "name": "Adoption Welcome Kit",
            "slug": "adopt-welcome",
            "description": "Welcome your newly adopted pet home! All the essentials for a smooth transition.",
            "category": "adopt",
            "pillar": "adopt",
            "intro_narration": "Congratulations on your new family member! The Adoption Welcome Kit has everything for a smooth, loving transition to their forever home!",
            "outro_narration": "Welcome home, little one! You've just changed their life forever, and they'll change yours too!",
            "is_active": True,
            "priority": 90,
            "target_pet_type": "dog",
            "items": make_items(bed_products + food_products + toy_products + collar_products, "Welcome home essential - {name}! For your new family member!")
        },
        
        # 14. INSURE 🛡️
        {
            "name": "Pet Safety & ID Kit",
            "slug": "insure-safety",
            "description": "Protect your pet with proper identification and safety gear. GPS tags, ID collars, and registration essentials.",
            "category": "insure",
            "pillar": "insure",
            "intro_narration": "Protection and peace of mind! The Safety & ID Kit ensures your pet can always find their way back to you.",
            "outro_narration": "Your pet is now protected and identifiable! Safety first, always!",
            "is_active": True,
            "priority": 82,
            "target_pet_type": "dog",
            "items": make_items(collar_products + safety_products, "For protection - {name}! Keep your pet safe and identifiable!")
        },
        
        # BONUS: Seasonal Kits
        {
            "name": "Summer Cool Kit",
            "slug": "seasonal-summer",
            "description": "Beat the heat! Cooling mats, portable water bottles, and summer essentials.",
            "category": "seasonal",
            "pillar": "enjoy",
            "intro_narration": "Summer is here! The Cool Kit has everything to keep your pet comfortable and safe during the hot months!",
            "outro_narration": "Stay cool, stay hydrated! Your pet is ready for summer fun!",
            "is_active": True,
            "priority": 70,
            "target_pet_type": "dog",
            "items": make_items(travel_products + outdoor_products, "For summer comfort - {name}! Beat the heat!")
        },
        {
            "name": "Monsoon Ready Kit",
            "slug": "seasonal-monsoon",
            "description": "Rainy day essentials! Raincoats, paw protectors, and indoor entertainment.",
            "category": "seasonal",
            "pillar": "enjoy",
            "intro_narration": "Monsoon season is here! The Monsoon Kit keeps your pet dry, clean, and entertained during rainy days!",
            "outro_narration": "Rain or shine, your pet is covered! Enjoy the monsoon without the mess!",
            "is_active": True,
            "priority": 68,
            "target_pet_type": "dog",
            "items": make_items(outdoor_products + grooming_products + toy_products, "For rainy days - {name}! Stay dry and have fun!")
        },
        {
            "name": "Diwali Safety Kit",
            "slug": "seasonal-diwali",
            "description": "Keep your pet calm and safe during festivals. Calming treats, comfort items, and safety essentials.",
            "category": "seasonal",
            "pillar": "celebrate",
            "intro_narration": "Festival time! The Diwali Safety Kit helps keep your pet calm and secure during the celebrations.",
            "outro_narration": "Happy Diwali! May your pet feel safe and loved during the festivities!",
            "is_active": True,
            "priority": 85,
            "target_pet_type": "dog",
            "items": make_items(health_products + bed_products + treat_products, "For festival safety - {name}! Keep calm and celebrate!")
        },
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
        "message": "All 14 Life Pillars kits seeded successfully",
        "created": created,
        "updated": updated,
        "total_kits": len(default_kits),
        "pillars_covered": ["celebrate", "dine", "stay", "travel", "care", "enjoy", "fit", "learn", "paperwork", "advisory", "emergency", "farewell", "adopt", "insure"]
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
