"""
Favorites Service - Save picks/products/services to pet's favorites
====================================================================

Manages the favorites field in pet documents.
Updates "What Mira Knows" about the pet.
"""

import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


async def add_to_favorites(
    db: AsyncIOMotorDatabase,
    pet_id: str,
    item: Dict,
    user_id: str = None
) -> Dict:
    """
    Add an item to pet's favorites.
    
    Args:
        db: Database connection
        pet_id: Pet ID
        item: Item to add (pick, product, or service)
        user_id: Optional user ID for audit
    
    Returns:
        {"success": bool, "message": str, "favorites_count": int}
    """
    try:
        # Prepare favorite item
        favorite_item = {
            "item_id": item.get("id") or item.get("pick_id") or item.get("product_id"),
            "title": item.get("title") or item.get("name"),
            "type": item.get("type") or item.get("pick_type", "product"),
            "category": item.get("category"),
            "service_type": item.get("service_type"),
            "pillar": item.get("pillar"),
            "icon": item.get("icon"),
            "added_at": datetime.now(timezone.utc).isoformat(),
            "added_by": user_id
        }
        
        # Add to pet's favorites array (avoid duplicates)
        result = await db.pets.update_one(
            {"id": pet_id},
            {
                "$addToSet": {"favorites": favorite_item},
                "$set": {"favorites_updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        if result.modified_count > 0:
            # Get updated count
            pet = await db.pets.find_one({"id": pet_id}, {"favorites": 1, "_id": 0})
            favorites_count = len(pet.get("favorites", [])) if pet else 0
            
            logger.info(f"[FAVORITES] Added '{favorite_item['title']}' to pet {pet_id} favorites")
            return {
                "success": True,
                "message": f"Added to favorites!",
                "favorites_count": favorites_count,
                "item_added": favorite_item
            }
        else:
            return {
                "success": True,
                "message": "Already in favorites",
                "favorites_count": 0
            }
            
    except Exception as e:
        logger.error(f"[FAVORITES] Error adding to favorites: {e}")
        return {"success": False, "message": str(e)}


async def remove_from_favorites(
    db: AsyncIOMotorDatabase,
    pet_id: str,
    item_id: str
) -> Dict:
    """
    Remove an item from pet's favorites.
    
    Args:
        db: Database connection
        pet_id: Pet ID
        item_id: ID of item to remove
    
    Returns:
        {"success": bool, "message": str}
    """
    try:
        result = await db.pets.update_one(
            {"id": pet_id},
            {
                "$pull": {"favorites": {"item_id": item_id}},
                "$set": {"favorites_updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"[FAVORITES] Removed item {item_id} from pet {pet_id} favorites")
            return {"success": True, "message": "Removed from favorites"}
        else:
            return {"success": True, "message": "Item not in favorites"}
            
    except Exception as e:
        logger.error(f"[FAVORITES] Error removing from favorites: {e}")
        return {"success": False, "message": str(e)}


async def get_favorites(
    db: AsyncIOMotorDatabase,
    pet_id: str,
    pillar: str = None,
    limit: int = 20
) -> List[Dict]:
    """
    Get pet's favorites, optionally filtered by pillar.
    
    Args:
        db: Database connection
        pet_id: Pet ID
        pillar: Optional pillar filter
        limit: Max items to return
    
    Returns:
        List of favorite items
    """
    try:
        pet = await db.pets.find_one({"id": pet_id}, {"favorites": 1, "_id": 0})
        
        if not pet or not pet.get("favorites"):
            return []
        
        favorites = pet.get("favorites", [])
        
        # Filter by pillar if specified
        if pillar:
            favorites = [f for f in favorites if f.get("pillar") == pillar]
        
        # Sort by most recently added
        favorites = sorted(favorites, key=lambda x: x.get("added_at", ""), reverse=True)
        
        return favorites[:limit]
        
    except Exception as e:
        logger.error(f"[FAVORITES] Error getting favorites: {e}")
        return []


async def get_favorites_for_mira_context(
    db: AsyncIOMotorDatabase,
    pet_id: str
) -> Dict:
    """
    Get favorites summary for Mira's context (What Mira Knows).
    
    Returns a summary suitable for display in the soul/knowledge section.
    
    Args:
        db: Database connection
        pet_id: Pet ID
    
    Returns:
        {
            "has_favorites": bool,
            "total_count": int,
            "by_pillar": {"dine": 3, "celebrate": 2, ...},
            "recent_favorites": [...],
            "favorite_categories": ["treats", "grooming", ...]
        }
    """
    try:
        pet = await db.pets.find_one({"id": pet_id}, {"favorites": 1, "name": 1, "_id": 0})
        
        if not pet or not pet.get("favorites"):
            return {
                "has_favorites": False,
                "total_count": 0,
                "by_pillar": {},
                "recent_favorites": [],
                "favorite_categories": []
            }
        
        favorites = pet.get("favorites", [])
        pet_name = pet.get("name", "Your pet")
        
        # Count by pillar
        by_pillar = {}
        categories = set()
        
        for fav in favorites:
            pillar = fav.get("pillar", "other")
            by_pillar[pillar] = by_pillar.get(pillar, 0) + 1
            if fav.get("category"):
                categories.add(fav.get("category"))
        
        # Get recent favorites (last 5)
        recent = sorted(favorites, key=lambda x: x.get("added_at", ""), reverse=True)[:5]
        
        return {
            "has_favorites": True,
            "total_count": len(favorites),
            "by_pillar": by_pillar,
            "recent_favorites": recent,
            "favorite_categories": list(categories),
            "summary_text": f"{pet_name} has {len(favorites)} saved favorites"
        }
        
    except Exception as e:
        logger.error(f"[FAVORITES] Error getting favorites context: {e}")
        return {"has_favorites": False, "total_count": 0}


async def update_mira_knows_with_favorites(
    db: AsyncIOMotorDatabase,
    pet_id: str
) -> bool:
    """
    Update the pet's soul/knowledge fields with favorites summary.
    
    This updates the "What Mira Knows" section.
    
    Args:
        db: Database connection
        pet_id: Pet ID
    
    Returns:
        Success boolean
    """
    try:
        favorites_context = await get_favorites_for_mira_context(db, pet_id)
        
        if not favorites_context.get("has_favorites"):
            return True  # Nothing to update
        
        # Build knowledge update
        knowledge_update = {
            "soul_knowledge.favorites_count": favorites_context["total_count"],
            "soul_knowledge.favorite_pillars": favorites_context["by_pillar"],
            "soul_knowledge.favorite_categories": favorites_context["favorite_categories"],
            "soul_knowledge.favorites_updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Update pet document
        await db.pets.update_one(
            {"id": pet_id},
            {"$set": knowledge_update}
        )
        
        logger.info(f"[FAVORITES] Updated Mira knows for pet {pet_id} with {favorites_context['total_count']} favorites")
        return True
        
    except Exception as e:
        logger.error(f"[FAVORITES] Error updating Mira knows: {e}")
        return False


def format_favorites_for_display(favorites: List[Dict], pet_name: str = "your pet") -> str:
    """
    Format favorites list for chat display.
    
    Args:
        favorites: List of favorite items
        pet_name: Pet's name
    
    Returns:
        Formatted string for chat
    """
    if not favorites:
        return f"No favorites saved yet for {pet_name}."
    
    # Group by pillar
    by_pillar = {}
    for fav in favorites:
        pillar = fav.get("pillar", "Other")
        if pillar not in by_pillar:
            by_pillar[pillar] = []
        by_pillar[pillar].append(fav)
    
    # Format output
    lines = [f"**{pet_name}'s Saved Favorites:**\n"]
    
    pillar_emojis = {
        "dine": "🍖",
        "celebrate": "🎉",
        "care": "❤️",
        "stay": "🏠",
        "travel": "✈️",
        "enjoy": "🎾",
        "fit": "💪"
    }
    
    for pillar, items in by_pillar.items():
        emoji = pillar_emojis.get(pillar, "⭐")
        lines.append(f"\n{emoji} **{pillar.title()}:**")
        for item in items[:3]:  # Show max 3 per pillar
            lines.append(f"  • {item.get('icon', '')} {item.get('title', 'Unnamed')}")
    
    return "\n".join(lines)
