"""
Favorites API Routes
====================

Endpoints for managing pet favorites.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/favorites", tags=["Favorites"])


class AddFavoriteRequest(BaseModel):
    pet_id: str
    item: Dict[str, Any]  # The pick/product/service to add
    user_id: Optional[str] = None


class RemoveFavoriteRequest(BaseModel):
    pet_id: str
    item_id: str


@router.post("/add")
async def add_favorite(request: AddFavoriteRequest):
    """Add an item to pet's favorites."""
    try:
        from server import db
        from services.favorites_service import add_to_favorites, update_mira_knows_with_favorites
        
        result = await add_to_favorites(
            db=db,
            pet_id=request.pet_id,
            item=request.item,
            user_id=request.user_id
        )
        
        if result.get("success"):
            # Update Mira knows in background
            await update_mira_knows_with_favorites(db, request.pet_id)
        
        return result
        
    except Exception as e:
        logger.error(f"[FAVORITES API] Error adding favorite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove")
async def remove_favorite(request: RemoveFavoriteRequest):
    """Remove an item from pet's favorites."""
    try:
        from server import db
        from services.favorites_service import remove_from_favorites, update_mira_knows_with_favorites
        
        result = await remove_from_favorites(
            db=db,
            pet_id=request.pet_id,
            item_id=request.item_id
        )
        
        if result.get("success"):
            # Update Mira knows in background
            await update_mira_knows_with_favorites(db, request.pet_id)
        
        return result
        
    except Exception as e:
        logger.error(f"[FAVORITES API] Error removing favorite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{pet_id}")
async def get_pet_favorites(pet_id: str, pillar: Optional[str] = None, limit: int = 20):
    """Get pet's favorites, optionally filtered by pillar."""
    try:
        from server import db
        from services.favorites_service import get_favorites
        
        favorites = await get_favorites(
            db=db,
            pet_id=pet_id,
            pillar=pillar,
            limit=limit
        )
        
        return {
            "success": True,
            "pet_id": pet_id,
            "count": len(favorites),
            "favorites": favorites
        }
        
    except Exception as e:
        logger.error(f"[FAVORITES API] Error getting favorites: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{pet_id}/summary")
async def get_favorites_summary(pet_id: str):
    """Get favorites summary for Mira context (What Mira Knows)."""
    try:
        from server import db
        from services.favorites_service import get_favorites_for_mira_context
        
        summary = await get_favorites_for_mira_context(db, pet_id)
        
        return {
            "success": True,
            "pet_id": pet_id,
            **summary
        }
        
    except Exception as e:
        logger.error(f"[FAVORITES API] Error getting favorites summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
