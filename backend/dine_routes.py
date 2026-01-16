"""
Dine Routes for The Doggy Company
Handles restaurants, reservations, and fresh meals
"""

import os
import logging
import uuid
import csv
import io
import shutil
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
import secrets

logger = logging.getLogger(__name__)

# Create router
dine_router = APIRouter(prefix="/api", tags=["Dine"])

# Database reference
db: AsyncIOMotorDatabase = None

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials"""
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


# ==================== MODELS ====================

class RestaurantCreate(BaseModel):
    name: str
    area: str
    city: str
    petMenuAvailable: str = "no"  # yes, partial, no
    petPolicy: str = "outdoor"  # all-pets, outdoor, small-pets
    cuisine: List[str] = []
    tags: List[str] = []
    rating: float = 4.0
    reviewCount: int = 0
    priceRange: str = "₹₹"
    image: Optional[str] = None
    petMenuItems: List[str] = []
    timings: Optional[str] = None
    phone: Optional[str] = None
    instagram: Optional[str] = None
    website: Optional[str] = None
    featured: bool = False
    verified: bool = False


class ReservationRequest(BaseModel):
    restaurant_id: str
    name: str
    phone: str
    email: str
    date: str
    time: str
    guests: int = 2
    pets: int = 1
    petMealPreorder: bool = False
    specialRequests: Optional[str] = None


# ==================== PUBLIC ROUTES ====================

@dine_router.get("/dine/restaurants")
async def get_restaurants(
    city: Optional[str] = None,
    petMenu: Optional[str] = None,
    featured: Optional[bool] = None
):
    """Get all pet-friendly restaurants (public)"""
    query = {}
    
    if city:
        query["city"] = city
    if petMenu:
        query["petMenuAvailable"] = petMenu
    if featured:
        query["featured"] = True
    
    restaurants = await db.restaurants.find(query, {"_id": 0}).to_list(100)
    return {"restaurants": restaurants}


@dine_router.get("/dine/restaurants/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    """Get a specific restaurant"""
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


@dine_router.post("/dine/reservations")
async def create_reservation(reservation: ReservationRequest):
    """Create a reservation request"""
    # Verify restaurant exists
    restaurant = await db.restaurants.find_one({"id": reservation.restaurant_id})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    reservation_doc = {
        "id": f"res-{uuid.uuid4().hex[:12]}",
        **reservation.model_dump(),
        "restaurant_name": restaurant.get("name"),
        "restaurant_city": restaurant.get("city"),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reservations.insert_one(reservation_doc)
    
    logger.info(f"New reservation: {reservation_doc['id']} at {restaurant.get('name')}")
    
    return {
        "message": "Reservation request submitted",
        "reservation_id": reservation_doc["id"],
        "status": "pending"
    }


# ==================== ADMIN ROUTES ====================

@dine_router.get("/admin/dine/restaurants")
async def admin_get_restaurants(username: str = Depends(verify_admin)):
    """Get all restaurants (admin)"""
    restaurants = await db.restaurants.find({}, {"_id": 0}).to_list(500)
    return {"restaurants": restaurants}


@dine_router.post("/admin/dine/restaurants")
async def admin_create_restaurant(
    restaurant: RestaurantCreate,
    username: str = Depends(verify_admin)
):
    """Create a new restaurant (admin)"""
    restaurant_doc = {
        "id": f"rest-{uuid.uuid4().hex[:12]}",
        **restaurant.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.restaurants.insert_one(restaurant_doc)
    restaurant_doc.pop("_id", None)
    
    logger.info(f"Created restaurant: {restaurant_doc['id']} - {restaurant.name}")
    
    return {"message": "Restaurant created", "restaurant": restaurant_doc}


@dine_router.put("/admin/dine/restaurants/{restaurant_id}")
async def admin_update_restaurant(
    restaurant_id: str,
    restaurant: RestaurantCreate,
    username: str = Depends(verify_admin)
):
    """Update a restaurant (admin)"""
    existing = await db.restaurants.find_one({"id": restaurant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    update_data = {
        **restaurant.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.restaurants.update_one(
        {"id": restaurant_id},
        {"$set": update_data}
    )
    
    updated = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    return {"message": "Restaurant updated", "restaurant": updated}


@dine_router.delete("/admin/dine/restaurants/{restaurant_id}")
async def admin_delete_restaurant(
    restaurant_id: str,
    username: str = Depends(verify_admin)
):
    """Delete a restaurant (admin)"""
    result = await db.restaurants.delete_one({"id": restaurant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return {"message": "Restaurant deleted"}


@dine_router.get("/admin/dine/reservations")
async def admin_get_reservations(
    status: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Get all reservations (admin)"""
    query = {}
    if status:
        query["status"] = status
    
    reservations = await db.reservations.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"reservations": reservations}


@dine_router.put("/admin/dine/reservations/{reservation_id}/status")
async def admin_update_reservation_status(
    reservation_id: str,
    status: str,
    username: str = Depends(verify_admin)
):
    """Update reservation status (admin)"""
    valid_statuses = ["pending", "confirmed", "cancelled", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.reservations.update_one(
        {"id": reservation_id},
        {
            "$set": {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    return {"message": f"Reservation status updated to {status}"}


@dine_router.get("/admin/dine/stats")
async def admin_dine_stats(username: str = Depends(verify_admin)):
    """Get Dine statistics (admin)"""
    total_restaurants = await db.restaurants.count_documents({})
    with_pet_menu = await db.restaurants.count_documents({"petMenuAvailable": "yes"})
    partial_menu = await db.restaurants.count_documents({"petMenuAvailable": "partial"})
    featured = await db.restaurants.count_documents({"featured": True})
    
    pending_reservations = await db.reservations.count_documents({"status": "pending"})
    confirmed_reservations = await db.reservations.count_documents({"status": "confirmed"})
    
    # City breakdown
    cities = await db.restaurants.aggregate([
        {"$group": {"_id": "$city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(20)
    
    return {
        "restaurants": {
            "total": total_restaurants,
            "with_pet_menu": with_pet_menu,
            "partial_menu": partial_menu,
            "featured": featured
        },
        "reservations": {
            "pending": pending_reservations,
            "confirmed": confirmed_reservations
        },
        "cities": cities
    }
