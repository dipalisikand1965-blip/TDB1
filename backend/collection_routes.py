"""
Enhanced Collections Routes
Handles campaign/curated collection pages with multi-pillar items and sections
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
import uuid
import re

# Will be set from server.py
db = None
_verify_admin_func = None

def set_collection_db(database):
    global db
    db = database

def set_collection_admin_verify(verify_func):
    global _verify_admin_func
    _verify_admin_func = verify_func

# Create a proper dependency that uses the injected verify function
from fastapi import Depends as FastAPIDepends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets

security = HTTPBasic()

async def get_admin_user(credentials: HTTPBasicCredentials = FastAPIDepends(security)):
    """Verify admin credentials using the injected verify function or basic auth"""
    if _verify_admin_func:
        # Use the injected verify function
        return _verify_admin_func(credentials)
    raise HTTPException(status_code=500, detail="Admin verification not configured")

router = APIRouter(prefix="/api/admin/enhanced-collections", tags=["Enhanced Collections"])

# ==================== MODELS ====================

class CollectionItem(BaseModel):
    """An item within a collection section"""
    item_type: str  # product, restaurant, stay, service, custom
    item_id: str  # Reference to the actual item
    display_name: Optional[str] = None  # Override name
    display_image: Optional[str] = None  # Override image
    button_text: Optional[str] = "View"  # CTA text
    button_link: Optional[str] = None  # Override link
    display_order: Optional[int] = 0

class CollectionSection(BaseModel):
    """A section within a collection"""
    id: Optional[str] = None
    title: str
    subtitle: Optional[str] = None
    layout: str = "grid"  # grid, carousel, list, featured
    columns: Optional[int] = 4  # For grid layout
    background: Optional[str] = None  # Background color/image
    items: List[CollectionItem] = []

class CollectionDisplayLocation(BaseModel):
    """Where the collection should appear"""
    show_in_navbar: bool = False
    navbar_position: Optional[int] = None  # Order in navbar
    pillar_ids: List[str] = []  # Pillars to show in
    show_on_homepage: bool = False
    homepage_section: Optional[str] = None  # featured, banner, etc.

class CollectionVisibility(BaseModel):
    """Visibility settings"""
    is_published: bool = False
    start_date: Optional[str] = None  # ISO date
    end_date: Optional[str] = None  # ISO date
    password_protected: bool = False
    password: Optional[str] = None

class EnhancedCollectionCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    banner_image: Optional[str] = None
    theme_color: Optional[str] = "#8B5CF6"
    display_locations: Optional[CollectionDisplayLocation] = None
    sections: List[CollectionSection] = []
    visibility: Optional[CollectionVisibility] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None

class EnhancedCollectionUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    banner_image: Optional[str] = None
    theme_color: Optional[str] = None
    display_locations: Optional[CollectionDisplayLocation] = None
    sections: Optional[List[CollectionSection]] = None
    visibility: Optional[CollectionVisibility] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    slug = name.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug

async def enrich_collection_items(sections: List[dict]) -> List[dict]:
    """Enrich collection items with actual data from referenced entities"""
    enriched_sections = []
    
    for section in sections:
        enriched_items = []
        for item in section.get("items", []):
            enriched_item = {**item}
            
            # Fetch actual item data based on type
            if item["item_type"] == "product":
                product = await db.products_master.find_one({"id": item["item_id"]}, {"_id": 0})
                if product:
                    enriched_item["actual_data"] = {
                        "name": product.get("name"),
                        "image": product.get("image"),
                        "price": product.get("price"),
                        "link": f"/product/{product.get('shopify_handle', product['id'])}"
                    }
            
            elif item["item_type"] == "restaurant":
                restaurant = await db.restaurants.find_one({"id": item["item_id"]}, {"_id": 0})
                if restaurant:
                    enriched_item["actual_data"] = {
                        "name": restaurant.get("name"),
                        "image": restaurant.get("image"),
                        "location": restaurant.get("location"),
                        "link": f"/dine/restaurant/{restaurant.get('slug', restaurant['id'])}"
                    }
            
            elif item["item_type"] == "stay":
                stay = await db.stays.find_one({"id": item["item_id"]}, {"_id": 0})
                if stay:
                    enriched_item["actual_data"] = {
                        "name": stay.get("name"),
                        "image": stay.get("image"),
                        "price": stay.get("price"),
                        "link": f"/stay/{stay.get('slug', stay['id'])}"
                    }
            
            elif item["item_type"] == "service":
                service = await db.services.find_one({"id": item["item_id"]}, {"_id": 0})
                if service:
                    enriched_item["actual_data"] = {
                        "name": service.get("name"),
                        "image": service.get("image"),
                        "price": service.get("price"),
                        "link": f"/care/{service.get('slug', service['id'])}"
                    }
            
            elif item["item_type"] == "custom":
                # Custom items have all data inline
                enriched_item["actual_data"] = {
                    "name": item.get("display_name", "Custom Item"),
                    "image": item.get("display_image"),
                    "link": item.get("button_link", "#")
                }
            
            enriched_items.append(enriched_item)
        
        enriched_sections.append({
            **section,
            "items": enriched_items
        })
    
    return enriched_sections

# ==================== ADMIN ROUTES ====================

@router.get("")
async def get_enhanced_collections(username: str = Depends(get_admin_user)):
    """Get all enhanced collections"""
    collections = await db.enhanced_collections.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Add item counts
    for col in collections:
        total_items = sum(len(s.get("items", [])) for s in col.get("sections", []))
        col["item_count"] = total_items
        col["section_count"] = len(col.get("sections", []))
    
    return {"collections": collections}

@router.get("/{collection_id}")
async def get_enhanced_collection(collection_id: str, username: str = Depends(get_admin_user)):
    """Get a single enhanced collection with full details"""
    collection = await db.enhanced_collections.find_one(
        {"id": collection_id}, {"_id": 0}
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Enrich items with actual data
    if collection.get("sections"):
        collection["sections"] = await enrich_collection_items(collection["sections"])
    
    return {"collection": collection}

@router.post("")
async def create_enhanced_collection(
    data: EnhancedCollectionCreate, 
    username: str = Depends(get_admin_user)
):
    """Create a new enhanced collection"""
    slug = data.slug or generate_slug(data.name)
    
    # Check slug uniqueness
    existing = await db.enhanced_collections.find_one({"slug": slug})
    if existing:
        raise HTTPException(status_code=400, detail="Collection with this slug already exists")
    
    # Process sections to add IDs
    sections = []
    for section in data.sections:
        section_dict = section.model_dump() if hasattr(section, 'model_dump') else section
        if not section_dict.get("id"):
            section_dict["id"] = f"sec-{uuid.uuid4().hex[:8]}"
        sections.append(section_dict)
    
    new_collection = {
        "id": f"ecol-{uuid.uuid4().hex[:12]}",
        "name": data.name,
        "slug": slug,
        "description": data.description,
        "cover_image": data.cover_image,
        "banner_image": data.banner_image,
        "theme_color": data.theme_color,
        "display_locations": data.display_locations.model_dump() if data.display_locations else {
            "show_in_navbar": False,
            "pillar_ids": [],
            "show_on_homepage": False
        },
        "sections": sections,
        "visibility": data.visibility.model_dump() if data.visibility else {
            "is_published": False,
            "start_date": None,
            "end_date": None
        },
        "seo_title": data.seo_title or data.name,
        "seo_description": data.seo_description or data.description,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.enhanced_collections.insert_one(new_collection)
    
    return {"collection": {k: v for k, v in new_collection.items() if k != "_id"}}

@router.put("/{collection_id}")
async def update_enhanced_collection(
    collection_id: str,
    data: EnhancedCollectionUpdate,
    username: str = Depends(get_admin_user)
):
    """Update an enhanced collection"""
    existing = await db.enhanced_collections.find_one({"id": collection_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    update_data = {}
    
    for key, value in data.model_dump().items():
        if value is not None:
            if key == "sections":
                # Process sections to add IDs
                sections = []
                for section in value:
                    if not section.get("id"):
                        section["id"] = f"sec-{uuid.uuid4().hex[:8]}"
                    sections.append(section)
                update_data["sections"] = sections
            elif key in ["display_locations", "visibility"]:
                update_data[key] = value
            else:
                update_data[key] = value
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Check slug uniqueness if changed
    if "slug" in update_data and update_data["slug"] != existing.get("slug"):
        slug_exists = await db.enhanced_collections.find_one({
            "slug": update_data["slug"],
            "id": {"$ne": collection_id}
        })
        if slug_exists:
            raise HTTPException(status_code=400, detail="Collection with this slug already exists")
    
    await db.enhanced_collections.update_one(
        {"id": collection_id},
        {"$set": update_data}
    )
    
    updated = await db.enhanced_collections.find_one({"id": collection_id}, {"_id": 0})
    return {"collection": updated}

@router.delete("/{collection_id}")
async def delete_enhanced_collection(collection_id: str, username: str = Depends(get_admin_user)):
    """Delete an enhanced collection"""
    existing = await db.enhanced_collections.find_one({"id": collection_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    await db.enhanced_collections.delete_one({"id": collection_id})
    return {"message": "Collection deleted"}

@router.post("/{collection_id}/duplicate")
async def duplicate_enhanced_collection(collection_id: str, username: str = Depends(get_admin_user)):
    """Duplicate an existing collection"""
    original = await db.enhanced_collections.find_one({"id": collection_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Create new collection based on original
    new_collection = {
        **original,
        "id": f"ecol-{uuid.uuid4().hex[:12]}",
        "name": f"{original['name']} (Copy)",
        "slug": f"{original['slug']}-copy-{uuid.uuid4().hex[:4]}",
        "visibility": {
            "is_published": False,
            "start_date": None,
            "end_date": None
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.enhanced_collections.insert_one(new_collection)
    
    return {"collection": {k: v for k, v in new_collection.items() if k != "_id"}}

# ==================== SECTION MANAGEMENT ====================

@router.post("/{collection_id}/sections")
async def add_section(
    collection_id: str,
    section: CollectionSection,
    username: str = Depends(get_admin_user)
):
    """Add a section to a collection"""
    collection = await db.enhanced_collections.find_one({"id": collection_id})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    section_dict = section.model_dump()
    section_dict["id"] = f"sec-{uuid.uuid4().hex[:8]}"
    
    await db.enhanced_collections.update_one(
        {"id": collection_id},
        {
            "$push": {"sections": section_dict},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"section": section_dict}

@router.put("/{collection_id}/sections/{section_id}")
async def update_section(
    collection_id: str,
    section_id: str,
    section: CollectionSection,
    username: str = Depends(get_admin_user)
):
    """Update a section within a collection"""
    collection = await db.enhanced_collections.find_one({"id": collection_id})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    sections = collection.get("sections", [])
    section_index = next((i for i, s in enumerate(sections) if s.get("id") == section_id), None)
    
    if section_index is None:
        raise HTTPException(status_code=404, detail="Section not found")
    
    section_dict = section.model_dump()
    section_dict["id"] = section_id
    sections[section_index] = section_dict
    
    await db.enhanced_collections.update_one(
        {"id": collection_id},
        {
            "$set": {
                "sections": sections,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"section": section_dict}

@router.delete("/{collection_id}/sections/{section_id}")
async def delete_section(
    collection_id: str,
    section_id: str,
    username: str = Depends(get_admin_user)
):
    """Delete a section from a collection"""
    collection = await db.enhanced_collections.find_one({"id": collection_id})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    await db.enhanced_collections.update_one(
        {"id": collection_id},
        {
            "$pull": {"sections": {"id": section_id}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "Section deleted"}

@router.put("/{collection_id}/sections/reorder")
async def reorder_sections(
    collection_id: str,
    section_ids: List[str],
    username: str = Depends(get_admin_user)
):
    """Reorder sections within a collection"""
    collection = await db.enhanced_collections.find_one({"id": collection_id})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    sections = collection.get("sections", [])
    section_map = {s["id"]: s for s in sections}
    
    reordered = []
    for sid in section_ids:
        if sid in section_map:
            reordered.append(section_map[sid])
    
    await db.enhanced_collections.update_one(
        {"id": collection_id},
        {
            "$set": {
                "sections": reordered,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Sections reordered"}

# ==================== ITEM SEARCH FOR ADDING TO COLLECTIONS ====================

@router.get("/search/items")
async def search_items_for_collection(
    q: str = "",
    item_type: str = "all",
    limit: int = 20,
    username: str = Depends(get_admin_user)
):
    """Search for items to add to a collection"""
    results = []
    query_regex = {"$regex": q, "$options": "i"} if q else {}
    
    # Search products
    if item_type in ["all", "product"]:
        products = await db.products_master.find(
            {"name": query_regex} if q else {},
            {"_id": 0, "id": 1, "name": 1, "image": 1, "price": 1, "category": 1}
        ).limit(limit).to_list(limit)
        
        for p in products:
            results.append({
                "item_type": "product",
                "item_id": p["id"],
                "name": p["name"],
                "image": p.get("image"),
                "price": p.get("price"),
                "category": p.get("category"),
                "link": f"/product/{p['id']}"
            })
    
    # Search restaurants
    if item_type in ["all", "restaurant"]:
        restaurants = await db.restaurants.find(
            {"name": query_regex} if q else {},
            {"_id": 0, "id": 1, "name": 1, "image": 1, "location": 1}
        ).limit(limit).to_list(limit)
        
        for r in restaurants:
            results.append({
                "item_type": "restaurant",
                "item_id": r["id"],
                "name": r["name"],
                "image": r.get("image"),
                "location": r.get("location"),
                "link": f"/dine/restaurant/{r['id']}"
            })
    
    # Search stays
    if item_type in ["all", "stay"]:
        stays = await db.stays.find(
            {"name": query_regex} if q else {},
            {"_id": 0, "id": 1, "name": 1, "image": 1, "price": 1}
        ).limit(limit).to_list(limit)
        
        for s in stays:
            results.append({
                "item_type": "stay",
                "item_id": s["id"],
                "name": s["name"],
                "image": s.get("image"),
                "price": s.get("price"),
                "link": f"/stay/{s['id']}"
            })
    
    # Search services
    if item_type in ["all", "service"]:
        services = await db.services.find(
            {"name": query_regex} if q else {},
            {"_id": 0, "id": 1, "name": 1, "image": 1, "price": 1}
        ).limit(limit).to_list(limit)
        
        for s in services:
            results.append({
                "item_type": "service",
                "item_id": s["id"],
                "name": s["name"],
                "image": s.get("image"),
                "price": s.get("price"),
                "link": f"/care/{s['id']}"
            })
    
    return {"items": results, "total": len(results)}

# ==================== PUBLIC ROUTES ====================

public_router = APIRouter(prefix="/api/campaign", tags=["Public Collections"])

@public_router.get("/collections")
async def public_get_collections():
    """Get all published collections for public display"""
    now = datetime.now(timezone.utc).isoformat()
    
    collections = await db.enhanced_collections.find(
        {
            "visibility.is_published": True,
            "$and": [
                {"$or": [
                    {"visibility.start_date": None},
                    {"visibility.start_date": {"$lte": now}}
                ]},
                {"$or": [
                    {"visibility.end_date": None},
                    {"visibility.end_date": {"$gte": now}}
                ]}
            ]
        },
        {"_id": 0, "id": 1, "name": 1, "slug": 1, "description": 1, "cover_image": 1, "theme_color": 1}
    ).to_list(100)
    
    return {"collections": collections}

@public_router.get("/collections/navbar")
async def public_get_navbar_collections():
    """Get collections that should appear in navbar"""
    now = datetime.now(timezone.utc).isoformat()
    
    collections = await db.enhanced_collections.find(
        {
            "visibility.is_published": True,
            "display_locations.show_in_navbar": True
        },
        {"_id": 0, "id": 1, "name": 1, "slug": 1, "theme_color": 1}
    ).sort("display_locations.navbar_position", 1).to_list(10)
    
    return {"collections": collections}

@public_router.get("/collections/{slug}")
async def public_get_collection_by_slug(slug: str):
    """Get a single published collection by slug"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    now = datetime.now(timezone.utc).isoformat()
    
    collection = await db.enhanced_collections.find_one(
        {
            "slug": slug,
            "visibility.is_published": True
        },
        {"_id": 0}
    )
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Check date constraints
    visibility = collection.get("visibility", {})
    start_date = visibility.get("start_date")
    end_date = visibility.get("end_date")
    
    if start_date and start_date > now:
        raise HTTPException(status_code=404, detail="Collection not yet available")
    if end_date and end_date < now:
        raise HTTPException(status_code=404, detail="Collection has expired")
    
    # Enrich items
    if collection.get("sections"):
        collection["sections"] = await enrich_collection_items(collection["sections"])
    
    return {"collection": collection}


@public_router.post("/seed-valentines")
async def seed_valentines_collection():
    """
    One-time seed endpoint to create Valentine's collection if it doesn't exist.
    This helps sync collections between preview and production environments.
    """
    # Check if already exists
    existing = await db.enhanced_collections.find_one({"slug": "valentines-2025"})
    if existing:
        return {"message": "Valentine's collection already exists", "id": existing.get("id")}
    
    # Create the Valentine's collection
    valentine_collection = {
        "id": f"ecol-{uuid.uuid4().hex[:12]}",
        "name": "Valentine's Day 2026 💕",
        "slug": "valentines-2025",
        "description": "Celebrate love with your furry best friend! Special cakes, treats, and gifts curated for the most paw-some Valentine's Day ever.",
        "cover_image": "https://images.unsplash.com/photo-1518882605630-8f0e9a0a5188?w=800",
        "banner_image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200",
        "theme_color": "#EC4899",
        "display_locations": {
            "show_in_navbar": True,
            "navbar_position": 0,
            "pillar_ids": [],
            "show_on_homepage": True,
            "homepage_section": "featured"
        },
        "sections": [
            {
                "id": f"sec-{uuid.uuid4().hex[:8]}",
                "title": "💕 Valentine's Specials",
                "subtitle": "Handpicked favorites to celebrate love with your furry valentine",
                "layout": "featured",
                "columns": 4,
                "background": "",
                "items": []
            },
            {
                "id": f"sec-{uuid.uuid4().hex[:8]}",
                "title": "🎂 Celebration Cakes",
                "subtitle": "Show your pup how much you love them",
                "layout": "grid",
                "columns": 4,
                "background": "",
                "items": []
            },
            {
                "id": f"sec-{uuid.uuid4().hex[:8]}",
                "title": "🎁 Love Gift Boxes",
                "subtitle": "Complete celebration hampers",
                "layout": "grid",
                "columns": 4,
                "background": "",
                "items": []
            }
        ],
        "visibility": {
            "is_published": True,
            "start_date": None,
            "end_date": "2026-02-15T23:59:59"
        },
        "seo_title": "Valentine's Day 2026 - Special Pet Treats & Cakes | The Doggy Company",
        "seo_description": "Make Valentine's Day special for your furry friend with our curated collection of heart-shaped cakes, romantic treats, and love-themed gifts.",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.enhanced_collections.insert_one(valentine_collection)
    valentine_collection.pop("_id", None)
    
    return {
        "message": "Valentine's collection created successfully!",
        "id": valentine_collection["id"],
        "slug": valentine_collection["slug"],
        "note": "The collection has empty sections. Please add products via the admin panel."
    }
