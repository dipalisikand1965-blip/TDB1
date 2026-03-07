"""
Pet Wrapped - Soul Score History Tracking
Creates snapshots of soul scores to show the journey: 42 → 68 → 94
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from bson import ObjectId
import os

router = APIRouter(prefix="/api/wrapped", tags=["Pet Wrapped"])

# MongoDB connection
from pymongo import MongoClient
client = MongoClient(os.environ.get("MONGO_URL"))
db = client[os.environ.get("DB_NAME", "doggy_company")]


# ============================================
# SOUL SCORE HISTORY - The Journey
# ============================================

async def record_soul_score_snapshot(pet_id: str, score: int, trigger: str = "manual"):
    """
    Record a soul score snapshot. Called:
    - When Soul Profile is updated
    - Monthly automated snapshot
    - Manual backfill
    """
    snapshot = {
        "pet_id": pet_id,
        "score": score,
        "recorded_at": datetime.now(timezone.utc),
        "trigger": trigger,  # "profile_update", "monthly", "backfill", "manual"
        "year": datetime.now().year,
        "month": datetime.now().month
    }
    
    result = db.soul_score_history.insert_one(snapshot)
    return str(result.inserted_id)


@router.post("/admin/backfill-soul-scores")
async def backfill_soul_scores():
    """
    Backfill today's score as starting point for ALL existing pets.
    Run once to initialize history tracking.
    """
    pets = list(db.pets.find({"soul_score": {"$exists": True}}))
    backfilled = 0
    
    for pet in pets:
        pet_id = str(pet["_id"])
        score = pet.get("soul_score", 0)
        
        # Check if already has history
        existing = db.soul_score_history.find_one({"pet_id": pet_id})
        if not existing:
            await record_soul_score_snapshot(pet_id, score, "backfill")
            backfilled += 1
    
    return {
        "success": True,
        "total_pets": len(pets),
        "backfilled": backfilled,
        "message": f"Backfilled {backfilled} pets with initial soul score snapshots"
    }


@router.get("/soul-history/{pet_id}")
async def get_soul_score_history(pet_id: str):
    """
    Get soul score history for a pet - returns the journey.
    Returns: start, mid, current scores for the arc visualization.
    """
    history = list(db.soul_score_history.find(
        {"pet_id": pet_id}
    ).sort("recorded_at", 1))
    
    if not history:
        # No history yet - get current score
        pet = db.pets.find_one({"_id": ObjectId(pet_id)})
        if pet:
            current_score = pet.get("soul_score", 0)
            return {
                "pet_id": pet_id,
                "journey": [
                    {"score": current_score, "label": "Now", "date": datetime.now().isoformat()}
                ],
                "has_history": False
            }
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Build the journey arc (start → mid → now)
    journey = []
    
    if len(history) >= 3:
        # Have enough for a full arc
        journey = [
            {"score": history[0]["score"], "label": "Start", "date": history[0]["recorded_at"].isoformat()},
            {"score": history[len(history)//2]["score"], "label": "Mid", "date": history[len(history)//2]["recorded_at"].isoformat()},
            {"score": history[-1]["score"], "label": "Now", "date": history[-1]["recorded_at"].isoformat()}
        ]
    elif len(history) == 2:
        journey = [
            {"score": history[0]["score"], "label": "Start", "date": history[0]["recorded_at"].isoformat()},
            {"score": history[-1]["score"], "label": "Now", "date": history[-1]["recorded_at"].isoformat()}
        ]
    else:
        journey = [
            {"score": history[0]["score"], "label": "Now", "date": history[0]["recorded_at"].isoformat()}
        ]
    
    return {
        "pet_id": pet_id,
        "journey": journey,
        "total_snapshots": len(history),
        "has_history": True
    }


# Hook into Soul Profile updates
async def on_soul_profile_updated(pet_id: str, new_score: int):
    """
    Called whenever a Soul Profile is saved/updated.
    Records a snapshot of the new score.
    """
    await record_soul_score_snapshot(pet_id, new_score, "profile_update")
