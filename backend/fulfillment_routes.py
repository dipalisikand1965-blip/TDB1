"""
Fulfillment & Shipping Configuration Routes
Handles store pickup, delivery options, and regional settings
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid

# Database and auth will be injected
db = None
verify_admin = None

fulfillment_router = APIRouter(prefix="/api/fulfillment", tags=["Fulfillment"])
fulfillment_admin_router = APIRouter(prefix="/api/admin/fulfillment", tags=["Fulfillment Admin"])


def set_database(database):
    global db
    db = database


def set_admin_verifier(verifier):
    global verify_admin
    verify_admin = verifier


# ==================== MODELS ====================

class StoreLocation(BaseModel):
    """Store pickup location"""
    id: Optional[str] = None
    city: str
    name: str
    address: str
    phone: Optional[str] = None
    hours: Optional[str] = None  # "10 AM - 8 PM"
    active: bool = True
    lat: Optional[float] = None
    lng: Optional[float] = None


class FulfillmentSettings(BaseModel):
    """Global fulfillment settings"""
    pickup_enabled: bool = True
    pickup_cities: List[str] = ["Mumbai", "Gurugram", "Bangalore"]
    shipping_enabled: bool = True
    pan_india_shipping: bool = True
    free_shipping_threshold: float = 3000
    standard_shipping_fee: float = 150
    express_shipping_fee: float = 300
    international_shipping: bool = False


class RegionSettings(BaseModel):
    """Region/Location for global expansion"""
    id: Optional[str] = None
    name: str  # "India", "USA", "UK"
    code: str  # "IN", "US", "UK"
    parent_region: Optional[str] = None  # For hierarchy: Asia > India > Delhi
    currency: str = "INR"
    currency_symbol: str = "₹"
    active: bool = True
    shipping_zones: List[str] = []


# ==================== PUBLIC ENDPOINTS ====================

@fulfillment_router.get("/settings")
async def get_fulfillment_settings():
    """Get public fulfillment settings"""
    settings = await db.app_settings.find_one({"type": "fulfillment"})
    
    if not settings:
        # Return defaults
        return {
            "pickup_enabled": True,
            "pickup_cities": ["Mumbai", "Gurugram", "Bangalore"],
            "shipping_enabled": True,
            "pan_india_shipping": True,
            "free_shipping_threshold": 3000,
            "standard_shipping_fee": 150,
            "international_shipping": False
        }
    
    # Remove internal fields
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings


@fulfillment_router.get("/pickup-locations")
async def get_pickup_locations(city: Optional[str] = None):
    """Get available pickup locations"""
    query = {"active": True}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    locations = await db.store_locations.find(query, {"_id": 0}).to_list(50)
    
    # If no locations in DB, return defaults
    if not locations:
        locations = [
            {"id": "mumbai", "city": "Mumbai", "name": "Versova Store", "address": "Shop 9, off Yari Road, Jeet Nagar, Versova, Andheri West, Mumbai 400061", "hours": "10 AM - 8 PM", "active": True},
            {"id": "gurugram", "city": "Gurugram", "name": "Sector 52 Store", "address": "Ground Floor, Wazirabad Rd, Wazirabad, Sector 52, Gurugram 122003", "hours": "10 AM - 8 PM", "active": True},
            {"id": "bangalore", "city": "Bangalore", "name": "Koramangala Store", "address": "147, 8th Main Rd, 3rd Block, Koramangala, Bengaluru 560034", "hours": "10 AM - 8 PM", "active": True}
        ]
    
    return {"locations": locations, "total": len(locations)}


@fulfillment_router.get("/regions")
async def get_regions(parent: Optional[str] = None, active_only: bool = True):
    """Get available regions for products/shipping"""
    query = {}
    if parent:
        query["parent_region"] = parent
    if active_only:
        query["active"] = True
    
    regions = await db.regions.find(query, {"_id": 0}).to_list(100)
    
    # If no regions in DB, return defaults
    if not regions:
        regions = [
            {"id": "global", "name": "Global", "code": "GLOBAL", "parent_region": None, "currency": "USD", "currency_symbol": "$", "active": True},
            {"id": "india", "name": "India", "code": "IN", "parent_region": None, "currency": "INR", "currency_symbol": "₹", "active": True},
            {"id": "delhi", "name": "Delhi NCR", "code": "DEL", "parent_region": "india", "currency": "INR", "currency_symbol": "₹", "active": True},
            {"id": "mumbai", "name": "Mumbai", "code": "MUM", "parent_region": "india", "currency": "INR", "currency_symbol": "₹", "active": True},
            {"id": "bangalore", "name": "Bangalore", "code": "BLR", "parent_region": "india", "currency": "INR", "currency_symbol": "₹", "active": True},
            {"id": "gurugram", "name": "Gurugram", "code": "GGN", "parent_region": "india", "currency": "INR", "currency_symbol": "₹", "active": True},
        ]
    
    return {"regions": regions, "total": len(regions)}


@fulfillment_router.get("/cities")
async def get_indian_cities(search: Optional[str] = None, limit: int = 20):
    """Get list of Indian cities for Pan India shipping"""
    # Major Indian cities for autocomplete
    all_cities = [
        "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
        "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam",
        "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut",
        "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Allahabad",
        "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur",
        "Madurai", "Raipur", "Kota", "Chandigarh", "Guwahati", "Solapur", "Hubli", "Mysore",
        "Tiruchirappalli", "Bareilly", "Aligarh", "Tiruppur", "Moradabad", "Jalandhar",
        "Bhubaneswar", "Salem", "Warangal", "Guntur", "Bhiwandi", "Saharanpur", "Gorakhpur",
        "Bikaner", "Amravati", "Noida", "Jamshedpur", "Bhilai", "Cuttack", "Firozabad",
        "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela",
        "Nanded", "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain", "Loni",
        "Siliguri", "Jhansi", "Ulhasnagar", "Jammu", "Sangli", "Mangalore", "Erode",
        "Belgaum", "Ambattur", "Tirunelveli", "Malegaon", "Gaya", "Jalgaon", "Udaipur",
        "Maheshtala", "Davanagere", "Kozhikode", "Kurnool", "Gurugram", "Gurgaon",
        "Noida", "Greater Noida", "Faridabad", "Ghaziabad"
    ]
    
    # Remove duplicates and sort
    all_cities = sorted(list(set(all_cities)))
    
    if search:
        cities = [c for c in all_cities if search.lower() in c.lower()]
    else:
        cities = all_cities
    
    return {"cities": cities[:limit], "total": len(cities)}


@fulfillment_router.post("/check-eligibility")
async def check_fulfillment_eligibility(cart_items: List[dict], city: str):
    """
    Check fulfillment eligibility based on cart contents and city
    Returns available options: store_pickup, home_delivery, or both
    """
    settings = await db.app_settings.find_one({"type": "fulfillment"})
    pickup_cities = settings.get("pickup_cities", ["Mumbai", "Gurugram", "Bangalore"]) if settings else ["Mumbai", "Gurugram", "Bangalore"]
    
    # Check if city allows pickup
    city_allows_pickup = any(pc.lower() in city.lower() for pc in pickup_cities)
    
    # Analyze cart items
    has_bakery = False
    has_non_bakery = False
    bakery_items = []
    non_bakery_items = []
    
    for item in cart_items:
        # Check if item is bakery/celebration
        is_bakery = (
            item.get("category", "").lower() in ["cake", "cakes", "bakery", "celebration", "celebrate"] or
            item.get("pillar", "").lower() == "celebrate" or
            "cake" in item.get("name", "").lower() or
            item.get("fulfillment_type") == "store_pickup" or
            item.get("fulfillment_type") == "both"
        )
        
        if is_bakery:
            has_bakery = True
            bakery_items.append(item)
        else:
            has_non_bakery = True
            non_bakery_items.append(item)
    
    # Determine fulfillment options
    result = {
        "city": city,
        "pickup_available": False,
        "delivery_available": True,
        "split_fulfillment": False,
        "options": [],
        "bakery_items": len(bakery_items),
        "non_bakery_items": len(non_bakery_items),
        "message": ""
    }
    
    # Case A: Only bakery items
    if has_bakery and not has_non_bakery:
        result["delivery_available"] = True
        result["options"].append({
            "type": "home_delivery",
            "label": "Home Delivery",
            "description": "Pan India Delivery",
            "available": True
        })
        
        if city_allows_pickup:
            result["pickup_available"] = True
            result["options"].append({
                "type": "store_pickup",
                "label": "Store Pickup",
                "description": f"Available in {', '.join(pickup_cities)}",
                "available": True
            })
        else:
            result["message"] = f"Store Pickup available only in {', '.join(pickup_cities)}"
    
    # Case B: Only non-bakery items
    elif has_non_bakery and not has_bakery:
        result["delivery_available"] = True
        result["pickup_available"] = False
        result["options"].append({
            "type": "home_delivery",
            "label": "Home Delivery",
            "description": "Pan India Delivery",
            "available": True
        })
        result["message"] = "Store Pickup not available for these items"
    
    # Case C: Mixed cart
    else:
        result["delivery_available"] = True
        result["split_fulfillment"] = True
        result["options"].append({
            "type": "home_delivery",
            "label": "Home Delivery (All Items)",
            "description": "Pan India Delivery for all items",
            "available": True
        })
        
        if city_allows_pickup:
            result["pickup_available"] = True
            result["options"].append({
                "type": "split",
                "label": "Split Fulfillment",
                "description": f"Bakery items: Pickup in {city} | Other items: Home Delivery",
                "available": True,
                "bakery_pickup": True,
                "other_delivery": True
            })
        
        result["message"] = f"Your cart has {len(bakery_items)} bakery item(s) and {len(non_bakery_items)} other item(s)"
    
    return result


# ==================== ADMIN ENDPOINTS ====================

@fulfillment_admin_router.get("/settings")
async def admin_get_settings(username: str = Depends(verify_admin)):
    """Get all fulfillment settings (admin)"""
    settings = await db.app_settings.find_one({"type": "fulfillment"})
    if settings:
        settings.pop("_id", None)
    return settings or FulfillmentSettings().model_dump()


@fulfillment_admin_router.put("/settings")
async def admin_update_settings(settings: FulfillmentSettings, username: str = Depends(verify_admin)):
    """Update fulfillment settings"""
    now = datetime.now(timezone.utc).isoformat()
    
    await db.app_settings.update_one(
        {"type": "fulfillment"},
        {"$set": {
            **settings.model_dump(),
            "type": "fulfillment",
            "updated_at": now,
            "updated_by": username
        }},
        upsert=True
    )
    
    return {"message": "Settings updated", "settings": settings.model_dump()}


@fulfillment_admin_router.get("/pickup-locations")
async def admin_get_locations(username: str = Depends(verify_admin)):
    """Get all pickup locations (admin)"""
    locations = await db.store_locations.find({}, {"_id": 0}).to_list(100)
    return {"locations": locations, "total": len(locations)}


@fulfillment_admin_router.post("/pickup-locations")
async def admin_create_location(location: StoreLocation, username: str = Depends(verify_admin)):
    """Create new pickup location"""
    now = datetime.now(timezone.utc).isoformat()
    
    loc_doc = {
        "id": location.id or f"loc-{uuid.uuid4().hex[:8]}",
        **location.model_dump(exclude={"id"}),
        "created_at": now,
        "created_by": username
    }
    
    await db.store_locations.insert_one(loc_doc)
    del loc_doc["_id"]
    
    return {"message": "Location created", "location": loc_doc}


@fulfillment_admin_router.put("/pickup-locations/{location_id}")
async def admin_update_location(location_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update pickup location"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates["updated_by"] = username
    
    result = await db.store_locations.update_one(
        {"id": location_id},
        {"$set": updates}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return {"message": "Location updated"}


@fulfillment_admin_router.delete("/pickup-locations/{location_id}")
async def admin_delete_location(location_id: str, username: str = Depends(verify_admin)):
    """Delete pickup location"""
    result = await db.store_locations.delete_one({"id": location_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return {"message": "Location deleted"}


# ==================== REGIONS ADMIN ====================

@fulfillment_admin_router.get("/regions")
async def admin_get_regions(username: str = Depends(verify_admin)):
    """Get all regions (admin)"""
    regions = await db.regions.find({}, {"_id": 0}).to_list(100)
    return {"regions": regions, "total": len(regions)}


@fulfillment_admin_router.post("/regions")
async def admin_create_region(region: RegionSettings, username: str = Depends(verify_admin)):
    """Create new region"""
    now = datetime.now(timezone.utc).isoformat()
    
    region_doc = {
        "id": region.id or f"region-{uuid.uuid4().hex[:8]}",
        **region.model_dump(exclude={"id"}),
        "created_at": now,
        "created_by": username
    }
    
    await db.regions.insert_one(region_doc)
    del region_doc["_id"]
    
    return {"message": "Region created", "region": region_doc}


@fulfillment_admin_router.put("/regions/{region_id}")
async def admin_update_region(region_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update region"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates["updated_by"] = username
    
    result = await db.regions.update_one(
        {"id": region_id},
        {"$set": updates}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    
    return {"message": "Region updated"}


@fulfillment_admin_router.post("/regions/seed")
async def admin_seed_regions(username: str = Depends(verify_admin)):
    """Seed default regions"""
    default_regions = [
        {"id": "global", "name": "Global", "code": "GLOBAL", "parent_region": None, "currency": "USD", "currency_symbol": "$", "active": True},
        {"id": "india", "name": "India", "code": "IN", "parent_region": None, "currency": "INR", "currency_symbol": "₹", "active": True},
        {"id": "delhi", "name": "Delhi NCR", "code": "DEL", "parent_region": "india", "currency": "INR", "currency_symbol": "₹", "active": True},
        {"id": "mumbai", "name": "Mumbai", "code": "MUM", "parent_region": "india", "currency": "INR", "currency_symbol": "₹", "active": True},
        {"id": "bangalore", "name": "Bangalore", "code": "BLR", "parent_region": "india", "currency": "INR", "currency_symbol": "₹", "active": True},
        {"id": "gurugram", "name": "Gurugram", "code": "GGN", "parent_region": "india", "currency": "INR", "currency_symbol": "₹", "active": True},
        {"id": "hyderabad", "name": "Hyderabad", "code": "HYD", "parent_region": "india", "currency": "INR", "currency_symbol": "₹", "active": True},
        {"id": "chennai", "name": "Chennai", "code": "CHE", "parent_region": "india", "currency": "INR", "currency_symbol": "₹", "active": True},
        {"id": "kolkata", "name": "Kolkata", "code": "KOL", "parent_region": "india", "currency": "INR", "currency_symbol": "₹", "active": True},
        {"id": "pune", "name": "Pune", "code": "PUN", "parent_region": "india", "currency": "INR", "currency_symbol": "₹", "active": True},
    ]
    
    now = datetime.now(timezone.utc).isoformat()
    seeded = 0
    
    for region in default_regions:
        existing = await db.regions.find_one({"id": region["id"]})
        if not existing:
            region["created_at"] = now
            region["created_by"] = username
            await db.regions.insert_one(region)
            seeded += 1
    
    return {"message": f"Seeded {seeded} regions", "total": len(default_regions)}


@fulfillment_admin_router.post("/pickup-locations/seed")
async def admin_seed_locations(username: str = Depends(verify_admin)):
    """Seed default pickup locations"""
    default_locations = [
        {
            "id": "mumbai-versova",
            "city": "Mumbai",
            "name": "Versova Store",
            "address": "Shop 9, off Yari Road, Jeet Nagar, Versova, Andheri West, Mumbai 400061",
            "phone": "+91 9663185747",
            "hours": "10 AM - 8 PM",
            "active": True
        },
        {
            "id": "gurugram-sector52",
            "city": "Gurugram",
            "name": "Sector 52 Store",
            "address": "Ground Floor, Wazirabad Rd, Wazirabad, Sector 52, Gurugram 122003",
            "phone": "+91 9663185747",
            "hours": "10 AM - 8 PM",
            "active": True
        },
        {
            "id": "bangalore-koramangala",
            "city": "Bangalore",
            "name": "Koramangala Store",
            "address": "147, 8th Main Rd, 3rd Block, Koramangala, Bengaluru 560034",
            "phone": "+91 9663185747",
            "hours": "10 AM - 8 PM",
            "active": True
        }
    ]
    
    now = datetime.now(timezone.utc).isoformat()
    seeded = 0
    
    for loc in default_locations:
        existing = await db.store_locations.find_one({"id": loc["id"]})
        if not existing:
            loc["created_at"] = now
            loc["created_by"] = username
            await db.store_locations.insert_one(loc)
            seeded += 1
    
    return {"message": f"Seeded {seeded} locations", "total": len(default_locations)}
