"""
Soul Archetype API Routes
=========================
Endpoints for Soul Archetype derivation and management.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/soul-archetype", tags=["Soul Archetype"])

# Database reference
_db = None

def set_archetype_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


@router.get("/archetypes")
async def get_all_archetypes():
    """Get all archetype definitions."""
    from soul_archetype_engine import get_all_archetypes, ARCHETYPES
    
    return {
        "archetypes": [
            {
                "key": key,
                "name": data["name"],
                "emoji": data["emoji"],
                "description": data["description"],
                "traits": data["traits"][:5],  # First 5 traits
                "copy_tone": data["copy_tone"],
                "color_palette": data["color_palette"],
                "celebration_style": data["celebration_style"]
            }
            for key, data in ARCHETYPES.items()
        ]
    }


@router.get("/pet/{pet_id}")
async def get_pet_archetype(pet_id: str):
    """Get the archetype for a specific pet."""
    db = get_db()
    
    # Get pet
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Check if archetype already computed
    if pet.get("soul_archetype"):
        return {
            "pet_id": pet_id,
            "pet_name": pet.get("name"),
            "archetype": pet["soul_archetype"],
            "source": "cached"
        }
    
    # Derive archetype from soul data
    from soul_archetype_engine import derive_archetype, derive_all_archetypes_ranked
    
    soul_data = pet.get("doggy_soul_answers") or {}
    archetype_key, archetype_details = derive_archetype(soul_data)
    rankings = derive_all_archetypes_ranked(soul_data)
    
    archetype_data = {
        "primary_archetype": archetype_key,
        "archetype_name": archetype_details["name"],
        "archetype_emoji": archetype_details["emoji"],
        "archetype_description": archetype_details["description"],
        "copy_tone": archetype_details["copy_tone"],
        "color_palette": archetype_details["color_palette"],
        "celebration_style": archetype_details["celebration_style"],
        "product_affinity": archetype_details["product_affinity"]
    }
    
    return {
        "pet_id": pet_id,
        "pet_name": pet.get("name"),
        "archetype": archetype_data,
        "all_scores": {r[0]: r[1] for r in rankings},
        "source": "derived"
    }


@router.post("/pet/{pet_id}/compute")
async def compute_and_save_archetype(pet_id: str):
    """Compute and save archetype for a pet."""
    db = get_db()
    
    from soul_archetype_engine import compute_and_save_archetype as compute_archetype
    
    result = await compute_archetype(pet_id, db)
    
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


@router.post("/compute-all")
async def compute_all_archetypes():
    """Compute archetypes for all pets that have soul data."""
    db = get_db()
    
    from soul_archetype_engine import compute_and_save_archetype as compute_archetype
    
    # Get all pets with soul data
    pets = await db.pets.find(
        {"doggy_soul_answers": {"$exists": True, "$ne": {}}},
        {"_id": 0, "id": 1, "name": 1}
    ).to_list(1000)
    
    results = []
    for pet in pets:
        try:
            result = await compute_archetype(pet["id"], db)
            results.append({
                "pet_id": pet["id"],
                "pet_name": pet.get("name"),
                "archetype": result.get("archetype", {}).get("archetype_name"),
                "status": "success"
            })
        except Exception as e:
            results.append({
                "pet_id": pet["id"],
                "pet_name": pet.get("name"),
                "status": "error",
                "error": str(e)
            })
    
    return {
        "total_processed": len(results),
        "successful": len([r for r in results if r["status"] == "success"]),
        "results": results
    }


@router.get("/recommendations/{archetype_key}")
async def get_archetype_recommendations(archetype_key: str):
    """Get product recommendations for an archetype."""
    from soul_archetype_engine import (
        get_archetype_details,
        get_product_affinity,
        get_copy_tone,
        get_color_palette,
        get_celebration_style
    )
    
    details = get_archetype_details(archetype_key)
    if not details:
        raise HTTPException(status_code=404, detail="Archetype not found")
    
    return {
        "archetype": archetype_key,
        "name": details["name"],
        "product_affinity": get_product_affinity(archetype_key),
        "copy_tone": get_copy_tone(archetype_key),
        "color_palette": get_color_palette(archetype_key),
        "celebration_style": get_celebration_style(archetype_key),
        "description": details["description"]
    }


@router.get("/test-derivation")
async def test_archetype_derivation(
    describe_3_words: Optional[str] = None,
    general_nature: Optional[str] = None,
    energy_level: Optional[str] = None,
    separation_anxiety: Optional[str] = None,
    stranger_reaction: Optional[str] = None,
    food_motivation: Optional[str] = None
):
    """
    Test archetype derivation with sample data.
    Useful for debugging and understanding how archetypes are computed.
    """
    from soul_archetype_engine import derive_archetype, derive_all_archetypes_ranked
    
    # Build test soul data
    soul_data = {}
    if describe_3_words:
        soul_data["describe_3_words"] = describe_3_words
    if general_nature:
        soul_data["general_nature"] = general_nature
    if energy_level:
        soul_data["energy_level"] = energy_level
    if separation_anxiety:
        soul_data["separation_anxiety"] = separation_anxiety
    if stranger_reaction:
        soul_data["stranger_reaction"] = stranger_reaction
    if food_motivation:
        soul_data["food_motivation"] = food_motivation
    
    if not soul_data:
        return {
            "message": "Provide at least one parameter to test",
            "example": "/api/soul-archetype/test-derivation?describe_3_words=calm,gentle,loving&general_nature=Calm&energy_level=Low"
        }
    
    archetype_key, archetype_details = derive_archetype(soul_data)
    rankings = derive_all_archetypes_ranked(soul_data)
    
    return {
        "input": soul_data,
        "derived_archetype": {
            "key": archetype_key,
            "name": archetype_details["name"],
            "emoji": archetype_details["emoji"],
            "description": archetype_details["description"]
        },
        "all_scores": [
            {"archetype": r[0], "score": r[1], "name": r[2]["name"]}
            for r in rankings
        ]
    }
