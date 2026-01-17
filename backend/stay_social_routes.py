"""
Stay Products & Engagement Module
- Stay product bundles and travel essentials
- Stay Buddies (connect members at same property)
- Pawcation Socials (group events at properties)
"""

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
import secrets

logger = logging.getLogger(__name__)

# Create routers
stay_products_router = APIRouter(prefix="/api/stay/products", tags=["Stay Products"])
stay_social_router = APIRouter(prefix="/api/stay/social", tags=["Stay Social"])
stay_social_admin_router = APIRouter(prefix="/api/admin/stay/social", tags=["Stay Social Admin"])

# Database reference
db: AsyncIOMotorDatabase = None
_verify_admin = None
security = HTTPBasic()


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def set_admin_verify(verify_func):
    global _verify_admin
    _verify_admin = verify_func


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if _verify_admin:
        return _verify_admin(credentials)
    raise HTTPException(status_code=401, detail="Admin verification not configured")


# ==================== MODELS ====================

class StayProductBundle(BaseModel):
    """Stay Product Bundle"""
    name: str
    description: str
    category: str  # travel_kit, treats, gear, comfort, car_safety, hygiene, anxiety
    items: List[Dict]  # List of products in bundle
    bundle_price: float
    original_price: float
    discount_percent: float = 0
    image: Optional[str] = None
    tags: List[str] = []
    for_trip_type: List[str] = []  # beach, mountain, road_trip, weekend, luxury
    featured: bool = False
    active: bool = True


class StayBuddyRequest(BaseModel):
    """Request to connect with Stay Buddies"""
    property_id: str
    check_in_date: str
    check_out_date: str
    member_email: str
    member_name: str
    pet_name: str
    pet_breed: Optional[str] = None
    message: Optional[str] = None
    looking_for: List[str] = []  # walks, playdates, dining, activities


class PawcationSocial(BaseModel):
    """Pawcation Social Event"""
    property_id: str
    title: str
    description: str
    event_type: str  # meetup, trail_pack, sunset_social, photo_walk, group_stay
    event_date: str
    event_time: str
    max_participants: int = 10
    current_participants: int = 0
    host_name: str
    host_email: str
    activities: List[str] = []
    what_to_bring: List[str] = []
    pet_requirements: Optional[str] = None
    price_per_pet: float = 0  # 0 = free
    image: Optional[str] = None


class SocialRegistration(BaseModel):
    """Registration for a Pawcation Social"""
    social_id: str
    member_email: str
    member_name: str
    member_phone: str
    pet_name: str
    pet_breed: Optional[str] = None
    num_pets: int = 1
    special_requirements: Optional[str] = None


# ==================== STAY PRODUCTS ====================

# Dummy Stay Products Data
STAY_PRODUCT_BUNDLES = [
    {
        "name": "Weekend Getaway Kit",
        "description": "Everything your pup needs for a perfect 2-3 day trip. Includes travel treats, collapsible bowls, and comfort essentials.",
        "category": "travel_kit",
        "items": [
            {"name": "Calming Travel Treats (100g)", "quantity": 2, "price": 299},
            {"name": "Collapsible Silicone Bowl Set", "quantity": 1, "price": 449},
            {"name": "Travel Poop Bag Dispenser", "quantity": 1, "price": 199},
            {"name": "Portable Water Bottle (500ml)", "quantity": 1, "price": 549},
        ],
        "bundle_price": 1199,
        "original_price": 1496,
        "discount_percent": 20,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "tags": ["bestseller", "travel", "essentials"],
        "for_trip_type": ["weekend", "road_trip"],
        "featured": True
    },
    {
        "name": "Beach Pawcation Pack",
        "description": "Sun, sand, and fun! Specially curated for beach trips with paw-safe sunscreen, sand-proof mat, and hydration essentials.",
        "category": "travel_kit",
        "items": [
            {"name": "Pet-Safe Sunscreen Balm", "quantity": 1, "price": 399},
            {"name": "Sand-Free Beach Mat", "quantity": 1, "price": 799},
            {"name": "Cooling Bandana", "quantity": 2, "price": 249},
            {"name": "Ocean Breeze Treats", "quantity": 1, "price": 349},
            {"name": "Paw Rinse Bottle", "quantity": 1, "price": 299},
        ],
        "bundle_price": 1799,
        "original_price": 2345,
        "discount_percent": 23,
        "image": "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=600",
        "tags": ["beach", "summer", "outdoor"],
        "for_trip_type": ["beach"],
        "featured": True
    },
    {
        "name": "Mountain Adventure Bundle",
        "description": "For the adventurous duo! Trail-ready gear including energy treats, paw protection, and warm comfort items.",
        "category": "travel_kit",
        "items": [
            {"name": "High-Energy Trail Mix Treats", "quantity": 2, "price": 349},
            {"name": "Paw Wax Protection Balm", "quantity": 1, "price": 449},
            {"name": "Fleece Travel Blanket", "quantity": 1, "price": 699},
            {"name": "Reflective Safety Collar", "quantity": 1, "price": 399},
            {"name": "Portable First Aid Kit", "quantity": 1, "price": 599},
        ],
        "bundle_price": 2099,
        "original_price": 2844,
        "discount_percent": 26,
        "image": "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600",
        "tags": ["mountain", "adventure", "outdoor", "trekking"],
        "for_trip_type": ["mountain", "forest"],
        "featured": True
    },
    {
        "name": "Calm Traveler Kit",
        "description": "For anxious travelers. Calming supplements, familiar scent items, and comfort essentials to ease travel stress.",
        "category": "anxiety",
        "items": [
            {"name": "Calming Chews (30 count)", "quantity": 1, "price": 599},
            {"name": "Lavender Calming Spray", "quantity": 1, "price": 349},
            {"name": "Snuggle Comfort Toy", "quantity": 1, "price": 449},
            {"name": "Familiar Scent Blanket", "quantity": 1, "price": 399},
            {"name": "Anxiety Relief Bandana", "quantity": 1, "price": 299},
        ],
        "bundle_price": 1699,
        "original_price": 2095,
        "discount_percent": 19,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "tags": ["calming", "anxiety", "comfort"],
        "for_trip_type": ["weekend", "road_trip", "luxury"],
        "featured": False
    },
    {
        "name": "Road Trip Essentials",
        "description": "Long drive? No problem! Car-safe harness, mess-free feeding, and entertainment for the journey.",
        "category": "car_safety",
        "items": [
            {"name": "Car Safety Harness (Adjustable)", "quantity": 1, "price": 899},
            {"name": "Seat Cover Protector", "quantity": 1, "price": 1299},
            {"name": "Spill-Proof Travel Bowl", "quantity": 1, "price": 399},
            {"name": "Long-Lasting Chew Toy", "quantity": 2, "price": 249},
            {"name": "Motion Sickness Treats", "quantity": 1, "price": 449},
        ],
        "bundle_price": 2999,
        "original_price": 3544,
        "discount_percent": 15,
        "image": "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=600",
        "tags": ["car", "road_trip", "safety"],
        "for_trip_type": ["road_trip"],
        "featured": True
    },
    {
        "name": "Luxury Stay Collection",
        "description": "For the discerning pet parent. Premium treats, grooming essentials, and elegant accessories for upscale stays.",
        "category": "travel_kit",
        "items": [
            {"name": "Gourmet Treat Selection Box", "quantity": 1, "price": 799},
            {"name": "Premium Grooming Kit", "quantity": 1, "price": 1199},
            {"name": "Designer Travel Collar", "quantity": 1, "price": 899},
            {"name": "Organic Paw Butter", "quantity": 1, "price": 449},
            {"name": "Silk-Lined Travel Bed", "quantity": 1, "price": 1499},
        ],
        "bundle_price": 3999,
        "original_price": 4845,
        "discount_percent": 17,
        "image": "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=600",
        "tags": ["luxury", "premium", "gift"],
        "for_trip_type": ["luxury"],
        "featured": False
    },
    {
        "name": "First Stay Starter Pack",
        "description": "Perfect for first-time pet travelers! All the basics to make your pup's first hotel experience comfortable.",
        "category": "travel_kit",
        "items": [
            {"name": "Travel Crate Pad", "quantity": 1, "price": 599},
            {"name": "Portable Food Container", "quantity": 1, "price": 349},
            {"name": "Calming Treats Sample Pack", "quantity": 1, "price": 199},
            {"name": "Travel Wipes (50 count)", "quantity": 1, "price": 249},
            {"name": "Room Freshener Spray", "quantity": 1, "price": 299},
        ],
        "bundle_price": 1299,
        "original_price": 1695,
        "discount_percent": 23,
        "image": "https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=600",
        "tags": ["starter", "first_time", "basics"],
        "for_trip_type": ["weekend", "road_trip"],
        "featured": True
    },
    {
        "name": "Hygiene Hero Kit",
        "description": "Stay fresh on the go! Cleanup essentials, grooming wipes, and odor control for a pleasant stay.",
        "category": "hygiene",
        "items": [
            {"name": "Biodegradable Poop Bags (120 count)", "quantity": 1, "price": 299},
            {"name": "Waterless Shampoo Foam", "quantity": 1, "price": 449},
            {"name": "Pet Deodorizing Spray", "quantity": 1, "price": 349},
            {"name": "Grooming Wipes (80 count)", "quantity": 1, "price": 299},
            {"name": "Paw & Nose Balm", "quantity": 1, "price": 349},
        ],
        "bundle_price": 1399,
        "original_price": 1745,
        "discount_percent": 20,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "tags": ["hygiene", "grooming", "cleanup"],
        "for_trip_type": ["weekend", "road_trip", "beach", "mountain"],
        "featured": False
    }
]


@stay_products_router.get("/bundles")
async def get_stay_bundles(
    category: Optional[str] = None,
    trip_type: Optional[str] = None,
    featured: Optional[bool] = None
):
    """Get all stay product bundles"""
    query = {"active": True}
    
    if category:
        query["category"] = category
    if trip_type:
        query["for_trip_type"] = trip_type
    if featured is not None:
        query["featured"] = featured
    
    bundles = await db.stay_bundles.find(query, {"_id": 0}).sort("featured", -1).to_list(100)
    
    categories = await db.stay_bundles.distinct("category", {"active": True})
    trip_types = await db.stay_bundles.distinct("for_trip_type", {"active": True})
    
    return {
        "bundles": bundles,
        "categories": categories,
        "trip_types": trip_types,
        "total": len(bundles)
    }


@stay_products_router.get("/bundles/{bundle_id}")
async def get_stay_bundle(bundle_id: str):
    """Get a specific bundle"""
    bundle = await db.stay_bundles.find_one({"id": bundle_id}, {"_id": 0})
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return bundle


@stay_products_router.post("/bundles/{bundle_id}/add-to-cart")
async def add_bundle_to_cart(bundle_id: str, user_email: str):
    """Add a bundle to cart"""
    bundle = await db.stay_bundles.find_one({"id": bundle_id})
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Add to cart as a single item
    cart_item = {
        "id": f"cart-{uuid.uuid4().hex[:8]}",
        "user_email": user_email,
        "item_type": "stay_bundle",
        "bundle_id": bundle_id,
        "name": bundle["name"],
        "price": bundle["bundle_price"],
        "original_price": bundle["original_price"],
        "quantity": 1,
        "image": bundle.get("image"),
        "items": bundle.get("items", []),
        "created_at": now
    }
    
    # Check if already in cart
    existing = await db.cart.find_one({
        "user_email": user_email,
        "bundle_id": bundle_id
    })
    
    if existing:
        await db.cart.update_one(
            {"id": existing["id"]},
            {"$inc": {"quantity": 1}}
        )
        return {"message": "Quantity updated in cart"}
    
    await db.cart.insert_one(cart_item)
    return {"message": "Bundle added to cart", "cart_item_id": cart_item["id"]}


class StayBundleOrder(BaseModel):
    """Stay Bundle Order"""
    bundle_id: str
    quantity: int = 1
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: Optional[str] = None
    notes: Optional[str] = None


@stay_products_router.post("/bundles/{bundle_id}/order")
async def create_bundle_order(bundle_id: str, order: StayBundleOrder):
    """Create an order for a Stay bundle - integrates with main orders system"""
    bundle = await db.stay_bundles.find_one({"id": bundle_id})
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y%m%d")
    
    # Generate order ID (same pattern as main orders)
    order_count = await db.orders.count_documents({"order_id": {"$regex": f"^ORD-{today}"}})
    order_id = f"ORD-{today}-{str(order_count + 1).zfill(4)}"
    
    total_amount = bundle["bundle_price"] * order.quantity
    
    # Create order document (matches main order schema)
    order_doc = {
        "order_id": order_id,
        "source": "stay_bundle",
        "pillar": "stay",
        "status": "pending",
        "customer": {
            "name": order.customer_name,
            "email": order.customer_email,
            "phone": order.customer_phone
        },
        "items": [{
            "type": "stay_bundle",
            "bundle_id": bundle_id,
            "name": bundle["name"],
            "price": bundle["bundle_price"],
            "original_price": bundle["original_price"],
            "quantity": order.quantity,
            "image": bundle.get("image"),
            "included_items": bundle.get("items", [])
        }],
        "subtotal": total_amount,
        "discount": (bundle["original_price"] - bundle["bundle_price"]) * order.quantity,
        "shipping": 0,  # Free shipping for bundles
        "total": total_amount,
        "shipping_address": order.shipping_address,
        "notes": order.notes,
        "payment_status": "pending",
        "fulfillment_status": "unfulfilled",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    # Create notification for admin
    await db.notifications.insert_one({
        "id": f"notif-{uuid.uuid4().hex[:8]}",
        "type": "new_order",
        "title": f"🎁 New Stay Bundle Order - {order_id}",
        "message": f"{order.customer_name} ordered {bundle['name']} (₹{total_amount})",
        "category": "stay",
        "related_id": order_id,
        "link_to": f"/admin?tab=orders&order={order_id}",
        "priority": "high",
        "read": False,
        "created_at": now.isoformat()
    })
    
    # Remove from cart if exists
    await db.cart.delete_many({
        "user_email": order.customer_email,
        "bundle_id": bundle_id
    })
    
    return {
        "success": True,
        "order_id": order_id,
        "total": total_amount,
        "message": f"Order {order_id} created successfully!"
    }


@stay_products_router.get("/orders")
async def get_stay_orders(email: Optional[str] = None, limit: int = 50):
    """Get Stay bundle orders"""
    query = {"pillar": "stay"}
    if email:
        query["customer.email"] = email
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"orders": orders, "total": len(orders)}


# ==================== STAY BUDDIES ====================

@stay_social_router.get("/buddies")
async def get_stay_buddies(
    property_id: str,
    check_in: str,
    check_out: str
):
    """Find other members staying at the same property during overlapping dates"""
    # Find bookings with overlapping dates
    buddies = await db.stay_bookings.find({
        "property_id": property_id,
        "status": {"$in": ["confirmed", "completed"]},
        "opt_in_buddy": True,
        "$or": [
            {"check_in_date": {"$lte": check_out, "$gte": check_in}},
            {"check_out_date": {"$lte": check_out, "$gte": check_in}},
            {"$and": [
                {"check_in_date": {"$lte": check_in}},
                {"check_out_date": {"$gte": check_out}}
            ]}
        ]
    }, {
        "_id": 0,
        "guest_email": 0,
        "guest_phone": 0,
        "concierge_notes": 0
    }).to_list(50)
    
    return {
        "buddies": buddies,
        "count": len(buddies),
        "property_id": property_id
    }


@stay_social_router.post("/buddies/opt-in")
async def opt_in_buddy(booking_id: str, opt_in: bool = True):
    """Opt in/out of Stay Buddies feature"""
    result = await db.stay_bookings.update_one(
        {"id": booking_id},
        {"$set": {"opt_in_buddy": opt_in}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": f"Stay Buddies {'enabled' if opt_in else 'disabled'}"}


@stay_social_router.post("/buddies/connect")
async def connect_with_buddy(request: StayBuddyRequest):
    """Send connection request to a Stay Buddy"""
    now = datetime.now(timezone.utc).isoformat()
    
    connection = {
        "id": f"buddy-{uuid.uuid4().hex[:8]}",
        **request.model_dump(),
        "status": "pending",  # pending, accepted, declined
        "created_at": now
    }
    
    await db.stay_buddy_connections.insert_one(connection)
    
    # Create notification
    await db.notifications.insert_one({
        "id": f"notif-{uuid.uuid4().hex[:8]}",
        "type": "stay_buddy_request",
        "title": f"🐾 Stay Buddy Request from {request.member_name}",
        "message": f"{request.pet_name} wants to connect at your upcoming stay!",
        "category": "stay",
        "related_id": connection["id"],
        "read": False,
        "created_at": now
    })
    
    return {"success": True, "connection_id": connection["id"]}


# ==================== PAWCATION SOCIALS ====================

@stay_social_router.get("/events")
async def get_pawcation_socials(
    property_id: Optional[str] = None,
    event_type: Optional[str] = None,
    upcoming: bool = True
):
    """Get Pawcation Social events"""
    query = {"status": "active"}
    
    if property_id:
        query["property_id"] = property_id
    if event_type:
        query["event_type"] = event_type
    if upcoming:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query["event_date"] = {"$gte": today}
    
    events = await db.pawcation_socials.find(query, {"_id": 0}).sort("event_date", 1).to_list(100)
    
    # Enrich with property info
    for event in events:
        property = await db.stay_properties.find_one(
            {"id": event.get("property_id")},
            {"_id": 0, "name": 1, "city": 1, "photos": 1}
        )
        if property:
            event["property_name"] = property.get("name")
            event["property_city"] = property.get("city")
            event["property_image"] = property.get("photos", [None])[0]
    
    return {
        "events": events,
        "total": len(events)
    }


@stay_social_router.get("/events/{event_id}")
async def get_pawcation_social(event_id: str):
    """Get a specific Pawcation Social event"""
    event = await db.pawcation_socials.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get property info
    property = await db.stay_properties.find_one(
        {"id": event.get("property_id")},
        {"_id": 0, "name": 1, "city": 1, "photos": 1, "paw_rating": 1}
    )
    if property:
        event["property"] = property
    
    # Get participants
    participants = await db.social_registrations.find(
        {"social_id": event_id, "status": "confirmed"},
        {"_id": 0, "member_email": 0, "member_phone": 0}
    ).to_list(50)
    event["participants"] = participants
    
    return event


@stay_social_router.post("/events/{event_id}/register")
async def register_for_social(event_id: str, registration: SocialRegistration):
    """Register for a Pawcation Social"""
    event = await db.pawcation_socials.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event.get("current_participants", 0) >= event.get("max_participants", 10):
        raise HTTPException(status_code=400, detail="Event is full")
    
    # Check if already registered
    existing = await db.social_registrations.find_one({
        "social_id": event_id,
        "member_email": registration.member_email
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already registered")
    
    now = datetime.now(timezone.utc).isoformat()
    
    reg_doc = {
        "id": f"reg-{uuid.uuid4().hex[:8]}",
        **registration.model_dump(),
        "status": "confirmed",
        "created_at": now
    }
    
    await db.social_registrations.insert_one(reg_doc)
    
    # Update participant count
    await db.pawcation_socials.update_one(
        {"id": event_id},
        {"$inc": {"current_participants": 1}}
    )
    
    # Create notification for host
    await db.notifications.insert_one({
        "id": f"notif-{uuid.uuid4().hex[:8]}",
        "type": "social_registration",
        "title": f"🎉 New Registration - {event.get('title')}",
        "message": f"{registration.member_name} with {registration.pet_name} registered!",
        "category": "stay",
        "related_id": event_id,
        "link_to": "/admin?tab=stay&subtab=socials",
        "read": False,
        "created_at": now
    })
    
    return {"success": True, "registration_id": reg_doc["id"]}


# ==================== ADMIN ROUTES ====================

@stay_social_admin_router.get("/bundles")
async def admin_get_bundles(username: str = Depends(verify_admin)):
    """Get all bundles (admin)"""
    bundles = await db.stay_bundles.find({}, {"_id": 0}).to_list(100)
    
    stats = {
        "total": len(bundles),
        "active": len([b for b in bundles if b.get("active")]),
        "featured": len([b for b in bundles if b.get("featured")])
    }
    
    return {"bundles": bundles, "stats": stats}


@stay_social_admin_router.post("/bundles")
async def admin_create_bundle(bundle: StayProductBundle, username: str = Depends(verify_admin)):
    """Create a new bundle"""
    now = datetime.now(timezone.utc).isoformat()
    
    bundle_doc = {
        "id": f"bundle-{uuid.uuid4().hex[:8]}",
        **bundle.model_dump(),
        "created_at": now,
        "created_by": username
    }
    
    await db.stay_bundles.insert_one(bundle_doc)
    bundle_doc.pop("_id", None)
    
    return {"message": "Bundle created", "bundle": bundle_doc}


@stay_social_admin_router.put("/bundles/{bundle_id}")
async def admin_update_bundle(bundle_id: str, bundle: StayProductBundle, username: str = Depends(verify_admin)):
    """Update a bundle"""
    result = await db.stay_bundles.update_one(
        {"id": bundle_id},
        {"$set": {
            **bundle.model_dump(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": username
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle updated"}


@stay_social_admin_router.delete("/bundles/{bundle_id}")
async def admin_delete_bundle(bundle_id: str, username: str = Depends(verify_admin)):
    """Delete a bundle"""
    result = await db.stay_bundles.delete_one({"id": bundle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return {"message": "Bundle deleted"}


@stay_social_admin_router.get("/events")
async def admin_get_socials(username: str = Depends(verify_admin)):
    """Get all Pawcation Socials (admin)"""
    events = await db.pawcation_socials.find({}, {"_id": 0}).sort("event_date", -1).to_list(100)
    
    # Enrich with property names
    for event in events:
        property = await db.stay_properties.find_one(
            {"id": event.get("property_id")},
            {"_id": 0, "name": 1, "city": 1}
        )
        if property:
            event["property_name"] = property.get("name")
            event["property_city"] = property.get("city")
    
    stats = {
        "total": len(events),
        "upcoming": len([e for e in events if e.get("event_date", "") >= datetime.now(timezone.utc).strftime("%Y-%m-%d")]),
        "total_registrations": sum(e.get("current_participants", 0) for e in events)
    }
    
    return {"events": events, "stats": stats}


@stay_social_admin_router.post("/events")
async def admin_create_social(social: PawcationSocial, username: str = Depends(verify_admin)):
    """Create a Pawcation Social event"""
    # Verify property exists
    property = await db.stay_properties.find_one({"id": social.property_id})
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    social_doc = {
        "id": f"social-{uuid.uuid4().hex[:8]}",
        **social.model_dump(),
        "property_name": property.get("name"),
        "property_city": property.get("city"),
        "status": "active",
        "created_at": now,
        "created_by": username
    }
    
    await db.pawcation_socials.insert_one(social_doc)
    social_doc.pop("_id", None)
    
    # Create notification
    await db.notifications.insert_one({
        "id": f"notif-{uuid.uuid4().hex[:8]}",
        "type": "new_social_event",
        "title": f"🎉 New Pawcation Social Created",
        "message": f"{social.title} at {property.get('name')}",
        "category": "stay",
        "related_id": social_doc["id"],
        "read": False,
        "created_at": now
    })
    
    return {"message": "Social event created", "social": social_doc}


@stay_social_admin_router.put("/events/{event_id}")
async def admin_update_social(event_id: str, social: PawcationSocial, username: str = Depends(verify_admin)):
    """Update a Pawcation Social"""
    result = await db.pawcation_socials.update_one(
        {"id": event_id},
        {"$set": {
            **social.model_dump(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": username
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": "Social event updated"}


@stay_social_admin_router.delete("/events/{event_id}")
async def admin_delete_social(event_id: str, username: str = Depends(verify_admin)):
    """Delete/cancel a Pawcation Social"""
    result = await db.pawcation_socials.update_one(
        {"id": event_id},
        {"$set": {"status": "cancelled"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Social event cancelled"}


@stay_social_admin_router.get("/events/{event_id}/registrations")
async def admin_get_registrations(event_id: str, username: str = Depends(verify_admin)):
    """Get registrations for a social event"""
    registrations = await db.social_registrations.find(
        {"social_id": event_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"registrations": registrations, "total": len(registrations)}


@stay_social_admin_router.get("/buddy-connections")
async def admin_get_buddy_connections(username: str = Depends(verify_admin)):
    """Get all Stay Buddy connections"""
    connections = await db.stay_buddy_connections.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    stats = {
        "total": len(connections),
        "pending": len([c for c in connections if c.get("status") == "pending"]),
        "accepted": len([c for c in connections if c.get("status") == "accepted"])
    }
    
    return {"connections": connections, "stats": stats}


# ==================== SEEDING ====================

async def seed_stay_bundles(db_instance):
    """Seed stay product bundles"""
    collection = db_instance.stay_bundles
    
    existing = await collection.count_documents({})
    if existing > 0:
        return {"status": "skipped", "message": f"Already has {existing} bundles"}
    
    now = datetime.now(timezone.utc).isoformat()
    seeded = 0
    
    for bundle_data in STAY_PRODUCT_BUNDLES:
        bundle_doc = {
            "id": f"bundle-{uuid.uuid4().hex[:8]}",
            **bundle_data,
            "active": True,
            "created_at": now,
            "seeded": True
        }
        await collection.insert_one(bundle_doc)
        seeded += 1
    
    logger.info(f"Seeded {seeded} stay bundles")
    return {"status": "success", "seeded": seeded}


async def seed_sample_socials(db_instance):
    """Seed sample Pawcation Social events"""
    collection = db_instance.pawcation_socials
    
    existing = await collection.count_documents({})
    if existing > 0:
        return {"status": "skipped", "message": f"Already has {existing} events"}
    
    # Get some properties for events
    properties = await db_instance.stay_properties.find({"status": "live"}).limit(5).to_list(5)
    if not properties:
        return {"status": "skipped", "message": "No properties to create events for"}
    
    now = datetime.now(timezone.utc)
    seeded = 0
    
    sample_events = [
        {
            "title": "Sunset Beach Pawty",
            "description": "Join us for a magical sunset gathering on the beach! Dogs can play in the sand while owners enjoy refreshments.",
            "event_type": "sunset_social",
            "activities": ["Beach play", "Sunset watching", "Group photo", "Treats tasting"],
            "what_to_bring": ["Leash", "Water bowl", "Towel", "Camera"],
            "price_per_pet": 0
        },
        {
            "title": "Mountain Trail Pack Walk",
            "description": "Explore scenic trails with fellow pet parents. A guided 3km walk with rest stops and photo opportunities.",
            "event_type": "trail_pack",
            "activities": ["Guided walk", "Nature spotting", "Photo stops", "Treat breaks"],
            "what_to_bring": ["Sturdy leash", "Water", "Poop bags", "Treats"],
            "price_per_pet": 299
        },
        {
            "title": "Pawcation Photo Walk",
            "description": "Professional pet photographer captures your furry friend in beautiful resort settings. Limited spots!",
            "event_type": "photo_walk",
            "activities": ["Professional photos", "Props provided", "Digital copies", "Print options"],
            "what_to_bring": ["Favorite toy", "Treats for attention", "Grooming brush"],
            "price_per_pet": 999
        }
    ]
    
    for i, event_data in enumerate(sample_events):
        if i >= len(properties):
            break
        
        prop = properties[i]
        event_date = (now + timedelta(days=14 + i*7)).strftime("%Y-%m-%d")
        
        event_doc = {
            "id": f"social-{uuid.uuid4().hex[:8]}",
            "property_id": prop["id"],
            "property_name": prop.get("name"),
            "property_city": prop.get("city"),
            **event_data,
            "event_date": event_date,
            "event_time": "16:00",
            "max_participants": 10,
            "current_participants": 0,
            "host_name": "The Doggy Company",
            "host_email": "woof@thedoggybakery.in",
            "status": "active",
            "image": prop.get("photos", [None])[0],
            "created_at": now.isoformat(),
            "seeded": True
        }
        
        await collection.insert_one(event_doc)
        seeded += 1
    
    logger.info(f"Seeded {seeded} pawcation socials")
    return {"status": "success", "seeded": seeded}
