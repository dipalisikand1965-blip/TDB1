"""
Admin Data Sync Routes
Sync pet data between environments (Preview ↔ Production)

IMPORTANT FOR ALL AGENTS:
- Preview and Production use DIFFERENT MongoDB databases
- This API allows syncing pet data between environments
- Use with caution - can overwrite real user data
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import httpx
import os

sync_router = APIRouter(prefix="/api/admin/env-sync", tags=["Admin Env Sync"])

# Database reference (set by server.py)
db = None

def set_database(database):
    global db
    db = database

class PetSyncData(BaseModel):
    """Pet data structure for syncing"""
    id: str
    name: str
    breed: Optional[str] = None
    species: Optional[str] = "dog"
    age: Optional[int] = None
    weight: Optional[float] = None
    gender: Optional[str] = None
    photo_url: Optional[str] = None
    overall_score: Optional[float] = 0
    soul_data: Optional[Dict[str, Any]] = None

class SyncRequest(BaseModel):
    """Request to sync pets from source environment"""
    source_url: str  # e.g., "https://mira-ticketing.preview.emergentagent.com"
    user_email: str
    user_password: str
    sync_soul_data: bool = True

class DirectSyncRequest(BaseModel):
    """Direct sync with pet data provided"""
    user_email: str
    pets: List[PetSyncData]
    overwrite_existing: bool = False

# Admin verification (simple token for now)
ADMIN_SYNC_TOKEN = os.environ.get("ADMIN_SYNC_TOKEN", "sync-preview-to-prod-2026")

async def verify_sync_token(token: str = None):
    """Verify admin sync token"""
    if token != ADMIN_SYNC_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid sync token")
    return True

@sync_router.post("/fetch-from-source")
async def fetch_pets_from_source(request: SyncRequest, token: str = None):
    """
    Fetch pet data from source environment (Preview or Production)
    Returns the data without applying it - for review before sync
    """
    await verify_sync_token(token)
    
    async with httpx.AsyncClient() as client:
        # Login to source
        login_response = await client.post(
            f"{request.source_url}/api/auth/login",
            json={"email": request.user_email, "password": request.user_password}
        )
        
        if login_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to login to source environment")
        
        source_token = login_response.json().get("access_token")
        
        # Fetch pets
        pets_response = await client.get(
            f"{request.source_url}/api/pets",
            headers={"Authorization": f"Bearer {source_token}"}
        )
        
        if pets_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch pets from source")
        
        pets_data = pets_response.json().get("pets", [])
        
        # Optionally fetch soul data for each pet
        if request.sync_soul_data:
            for pet in pets_data:
                try:
                    soul_response = await client.get(
                        f"{request.source_url}/api/pets/{pet['id']}/soul",
                        headers={"Authorization": f"Bearer {source_token}"}
                    )
                    if soul_response.status_code == 200:
                        pet["soul_data"] = soul_response.json()
                except:
                    pet["soul_data"] = None
        
        return {
            "source": request.source_url,
            "user_email": request.user_email,
            "pets_count": len(pets_data),
            "pets": pets_data,
            "fetched_at": datetime.utcnow().isoformat()
        }

@sync_router.post("/apply-to-target")
async def apply_pets_to_target(request: DirectSyncRequest, token: str = None):
    """
    Apply pet data to current environment's database
    This updates/creates pets and their soul data
    """
    await verify_sync_token(token)
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Find user
    user = await db.users.find_one({"email": request.user_email})
    if not user:
        raise HTTPException(status_code=404, detail=f"User {request.user_email} not found")
    
    user_id = str(user.get("_id"))
    results = []
    
    for pet_data in request.pets:
        pet_id = pet_data.id
        
        # Check if pet exists
        existing_pet = await db.pets.find_one({"id": pet_id})
        
        if existing_pet and not request.overwrite_existing:
            results.append({
                "pet_id": pet_id,
                "name": pet_data.name,
                "action": "skipped",
                "reason": "Pet exists and overwrite_existing=False"
            })
            continue
        
        # Prepare pet document
        pet_doc = {
            "id": pet_id,
            "name": pet_data.name,
            "breed": pet_data.breed,
            "species": pet_data.species,
            "age": pet_data.age,
            "weight": pet_data.weight,
            "gender": pet_data.gender,
            "photo_url": pet_data.photo_url,
            "overall_score": pet_data.overall_score,
            "user_id": user_id,
            "owner_email": request.user_email,
            "synced_at": datetime.utcnow(),
            "sync_source": "admin_sync_api"
        }
        
        if existing_pet:
            # Update existing
            await db.pets.update_one(
                {"id": pet_id},
                {"$set": pet_doc}
            )
            action = "updated"
        else:
            # Create new
            pet_doc["created_at"] = datetime.utcnow()
            await db.pets.insert_one(pet_doc)
            action = "created"
        
        # Sync soul data if provided
        if pet_data.soul_data:
            soul_doc = {
                "pet_id": pet_id,
                **pet_data.soul_data,
                "synced_at": datetime.utcnow()
            }
            await db.pet_souls.update_one(
                {"pet_id": pet_id},
                {"$set": soul_doc},
                upsert=True
            )
        
        results.append({
            "pet_id": pet_id,
            "name": pet_data.name,
            "action": action,
            "score": pet_data.overall_score
        })
    
    return {
        "user_email": request.user_email,
        "total_pets": len(request.pets),
        "results": results,
        "synced_at": datetime.utcnow().isoformat()
    }

@sync_router.post("/full-sync")
async def full_sync_from_source(request: SyncRequest, token: str = None, overwrite: bool = False):
    """
    Complete sync: Fetch from source and apply to current environment
    Combines fetch-from-source and apply-to-target in one call
    """
    await verify_sync_token(token)
    
    # Step 1: Fetch from source
    fetch_result = await fetch_pets_from_source(request, token)
    
    # Step 2: Convert to DirectSyncRequest
    pets_to_sync = [
        PetSyncData(
            id=p.get("id"),
            name=p.get("name"),
            breed=p.get("breed"),
            species=p.get("species", "dog"),
            age=p.get("age"),
            weight=p.get("weight"),
            gender=p.get("gender"),
            photo_url=p.get("photo_url"),
            overall_score=p.get("overall_score", 0),
            soul_data=p.get("soul_data")
        )
        for p in fetch_result.get("pets", [])
    ]
    
    direct_request = DirectSyncRequest(
        user_email=request.user_email,
        pets=pets_to_sync,
        overwrite_existing=overwrite
    )
    
    # Step 3: Apply to target
    apply_result = await apply_pets_to_target(direct_request, token)
    
    return {
        "source": request.source_url,
        "target": "current_environment",
        "fetch_result": {
            "pets_fetched": fetch_result.get("pets_count")
        },
        "apply_result": apply_result,
        "completed_at": datetime.utcnow().isoformat()
    }

@sync_router.get("/status")
async def sync_status():
    """Check sync API status and database connection"""
    return {
        "status": "active",
        "database_connected": db is not None,
        "sync_token_configured": bool(os.environ.get("ADMIN_SYNC_TOKEN")),
        "endpoints": [
            "POST /api/admin/sync/fetch-from-source",
            "POST /api/admin/sync/apply-to-target", 
            "POST /api/admin/sync/full-sync",
            "GET /api/admin/sync/status"
        ]
    }
