"""
Service Catalog Routes
Manages service definitions, pricing, and booking flow
"""

from fastapi import APIRouter, HTTPException, Depends, Header, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/service-catalog", tags=["service-catalog"])

# Database reference
_db = None
_admin_verify = None

def set_service_catalog_db(db):
    global _db
    _db = db

def set_service_catalog_admin(verify_fn):
    global _admin_verify
    _admin_verify = verify_fn

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


# ==================== MODELS ====================

class ServiceDefinition(BaseModel):
    """Service definition with pricing"""
    id: Optional[str] = None
    name: str
    pillar: str  # care, travel, fit, etc.
    category: str  # grooming, training, vet, etc.
    description: str
    base_price: float
    duration_minutes: int
    
    # Pricing modifiers
    city_pricing: Dict[str, float] = {}  # {"mumbai": 1.15, "delhi": 1.10, "bangalore": 1.0}
    pet_count_pricing: Dict[str, float] = {}  # {"1": 1.0, "2": 1.8, "3": 2.5}
    pet_size_pricing: Dict[str, float] = {}  # {"small": 0.8, "medium": 1.0, "large": 1.3, "giant": 1.5}
    
    # Payment configuration
    payment_timing: str = "configurable"  # "upfront", "at_service", "deposit", "configurable"
    deposit_percentage: float = 0  # If payment_timing is "deposit"
    
    # Availability
    is_active: bool = True
    available_cities: List[str] = []
    available_days: List[str] = []  # ["monday", "tuesday", ...]
    available_time_slots: List[str] = []  # ["09:00", "10:00", ...]
    
    # Metadata
    image: Optional[str] = None
    includes: List[str] = []  # What's included in the service
    add_ons: List[Dict[str, Any]] = []  # Optional add-ons with prices


class ServicePriceRequest(BaseModel):
    """Request to calculate service price"""
    service_id: str
    city: str
    pet_count: int = 1
    pet_size: str = "medium"  # small, medium, large, giant
    add_on_ids: List[str] = []


class ServiceCartItem(BaseModel):
    """Item in service cart"""
    service_id: str
    service_name: str
    quantity: int = 1
    city: str
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    pet_size: str = "medium"
    scheduled_date: str
    scheduled_time: str
    unit_price: float
    total_price: float
    add_ons: List[Dict[str, Any]] = []
    notes: Optional[str] = None


class ServiceCart(BaseModel):
    """Service cart for checkout"""
    items: List[ServiceCartItem]
    subtotal: float
    taxes: float = 0
    total: float
    payment_timing: str  # "upfront", "at_service", "deposit"
    deposit_amount: float = 0


# ==================== ADMIN ENDPOINTS ====================

@router.post("/services")
async def create_service(
    service: ServiceDefinition,
    authorization: str = Header(...)
):
    """Create a new service definition (Admin only)"""
    db = get_db()
    
    # Verify admin
    if _admin_verify:
        await _admin_verify(authorization)
    
    service_dict = service.dict()
    service_dict["id"] = f"SVC-{uuid.uuid4().hex[:8].upper()}"
    service_dict["created_at"] = datetime.now(timezone.utc)
    service_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.service_catalog.insert_one(service_dict)
    
    return {"success": True, "service_id": service_dict["id"], "service": service_dict}


@router.put("/services/{service_id}")
async def update_service(
    service_id: str,
    service: ServiceDefinition,
    authorization: str = Header(...)
):
    """Update service definition (Admin only)"""
    db = get_db()
    
    if _admin_verify:
        await _admin_verify(authorization)
    
    service_dict = service.dict()
    service_dict["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.service_catalog.update_one(
        {"id": service_id},
        {"$set": service_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"success": True, "service_id": service_id}


@router.delete("/services/{service_id}")
async def delete_service(
    service_id: str,
    authorization: str = Header(...)
):
    """Delete service definition (Admin only)"""
    db = get_db()
    
    if _admin_verify:
        await _admin_verify(authorization)
    
    result = await db.service_catalog.delete_one({"id": service_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"success": True}


# ==================== PUBLIC ENDPOINTS ====================

@router.get("/services")
async def list_services(
    pillar: Optional[str] = None,
    category: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    """List available services"""
    db = get_db()
    
    query = {"is_active": True}
    if pillar:
        query["pillar"] = pillar
    if category:
        query["category"] = category
    if city:
        query["$or"] = [
            {"available_cities": {"$size": 0}},  # No restriction
            {"available_cities": city}
        ]
    
    services = await db.service_catalog.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    return {"services": services, "count": len(services)}


@router.get("/services/{service_id}")
async def get_service(service_id: str):
    """Get service details"""
    db = get_db()
    
    service = await db.service_catalog.find_one({"id": service_id}, {"_id": 0})
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return service


@router.post("/calculate-price")
async def calculate_service_price(request: ServicePriceRequest):
    """Calculate service price with all modifiers"""
    db = get_db()
    
    service = await db.service_catalog.find_one({"id": request.service_id}, {"_id": 0})
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    base_price = service.get("base_price", 0)
    
    # Apply city modifier
    city_pricing = service.get("city_pricing", {})
    city_modifier = city_pricing.get(request.city.lower(), 1.0)
    
    # Apply pet count modifier
    pet_count_pricing = service.get("pet_count_pricing", {})
    pet_count_modifier = pet_count_pricing.get(str(request.pet_count), request.pet_count * 0.9 if request.pet_count > 1 else 1.0)
    
    # Apply pet size modifier
    pet_size_pricing = service.get("pet_size_pricing", {})
    size_modifier = pet_size_pricing.get(request.pet_size.lower(), 1.0)
    
    # Calculate final price
    final_price = base_price * city_modifier * pet_count_modifier * size_modifier
    
    # Add add-ons
    add_ons_total = 0
    add_on_details = []
    if request.add_on_ids and service.get("add_ons"):
        for add_on in service["add_ons"]:
            if add_on.get("id") in request.add_on_ids:
                add_ons_total += add_on.get("price", 0)
                add_on_details.append(add_on)
    
    total_price = final_price + add_ons_total
    
    # Calculate deposit if applicable
    payment_timing = service.get("payment_timing", "configurable")
    deposit_amount = 0
    if payment_timing == "deposit":
        deposit_percentage = service.get("deposit_percentage", 20)
        deposit_amount = total_price * (deposit_percentage / 100)
    
    return {
        "service_id": request.service_id,
        "service_name": service.get("name"),
        "base_price": base_price,
        "modifiers": {
            "city": {"value": request.city, "multiplier": city_modifier},
            "pet_count": {"value": request.pet_count, "multiplier": pet_count_modifier},
            "pet_size": {"value": request.pet_size, "multiplier": size_modifier}
        },
        "subtotal": round(final_price, 2),
        "add_ons": add_on_details,
        "add_ons_total": add_ons_total,
        "total": round(total_price, 2),
        "payment_timing": payment_timing,
        "deposit_amount": round(deposit_amount, 2) if deposit_amount else None,
        "currency": "INR"
    }


# ==================== SERVICE CART ====================

@router.post("/cart/add")
async def add_to_service_cart(
    item: ServiceCartItem,
    authorization: Optional[str] = Header(None)
):
    """Add service to cart"""
    db = get_db()
    
    # Get user ID from token
    user_id = "guest"
    if authorization and authorization.startswith("Bearer "):
        try:
            import jwt
            from server import SECRET_KEY, ALGORITHM
            token = authorization.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub") or payload.get("user_id") or "guest"
        except:
            pass
    
    cart_id = f"CART-{user_id}"
    
    # Get or create cart
    cart = await db.service_carts.find_one({"cart_id": cart_id})
    
    if not cart:
        cart = {
            "cart_id": cart_id,
            "user_id": user_id,
            "items": [],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    
    # Add item
    item_dict = item.dict()
    item_dict["item_id"] = f"ITEM-{uuid.uuid4().hex[:8].upper()}"
    cart["items"].append(item_dict)
    cart["updated_at"] = datetime.now(timezone.utc)
    
    # Save cart
    await db.service_carts.update_one(
        {"cart_id": cart_id},
        {"$set": cart},
        upsert=True
    )
    
    return {"success": True, "item_id": item_dict["item_id"], "cart_id": cart_id}


@router.get("/cart")
async def get_service_cart(authorization: Optional[str] = Header(None)):
    """Get service cart"""
    db = get_db()
    
    user_id = "guest"
    if authorization and authorization.startswith("Bearer "):
        try:
            import jwt
            from server import SECRET_KEY, ALGORITHM
            token = authorization.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub") or payload.get("user_id") or "guest"
        except:
            pass
    
    cart_id = f"CART-{user_id}"
    cart = await db.service_carts.find_one({"cart_id": cart_id}, {"_id": 0})
    
    if not cart:
        return {"items": [], "subtotal": 0, "total": 0}
    
    # Calculate totals
    subtotal = sum(item.get("total_price", 0) for item in cart.get("items", []))
    
    return {
        "cart_id": cart_id,
        "items": cart.get("items", []),
        "subtotal": subtotal,
        "taxes": 0,  # Add GST calculation if needed
        "total": subtotal
    }


@router.delete("/cart/{item_id}")
async def remove_from_service_cart(
    item_id: str,
    authorization: Optional[str] = Header(None)
):
    """Remove item from service cart"""
    db = get_db()
    
    user_id = "guest"
    if authorization and authorization.startswith("Bearer "):
        try:
            import jwt
            from server import SECRET_KEY, ALGORITHM
            token = authorization.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub") or payload.get("user_id") or "guest"
        except:
            pass
    
    cart_id = f"CART-{user_id}"
    
    result = await db.service_carts.update_one(
        {"cart_id": cart_id},
        {"$pull": {"items": {"item_id": item_id}}}
    )
    
    return {"success": True}


# ==================== SERVICE CHECKOUT ====================

@router.post("/checkout")
async def service_checkout(
    payment_method: str = "razorpay",
    authorization: Optional[str] = Header(None)
):
    """Checkout service cart and create bookings"""
    db = get_db()
    
    user_id = "guest"
    user = None
    if authorization and authorization.startswith("Bearer "):
        try:
            import jwt
            from server import SECRET_KEY, ALGORITHM
            token = authorization.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_email = payload.get("sub") or payload.get("user_id")
            if user_email:
                user = await db.users.find_one({"email": user_email}, {"_id": 0, "password": 0})
                user_id = user.get("id") if user else user_email
        except:
            pass
    
    cart_id = f"CART-{user_id}"
    cart = await db.service_carts.find_one({"cart_id": cart_id}, {"_id": 0})
    
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Create order
    order_id = f"SVCORD-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc)
    
    total_amount = sum(item.get("total_price", 0) for item in cart.get("items", []))
    
    order = {
        "id": order_id,
        "user_id": user_id,
        "user_name": user.get("name") if user else "Guest",
        "user_email": user.get("email") if user else None,
        "items": cart.get("items", []),
        "subtotal": total_amount,
        "taxes": 0,
        "total": total_amount,
        "payment_method": payment_method,
        "payment_status": "pending",
        "status": "pending",
        "created_at": now,
        "updated_at": now
    }
    
    await db.service_orders.insert_one(order)
    
    # Create tickets for each service booking
    for item in cart.get("items", []):
        ticket_id = f"SVC-{uuid.uuid4().hex[:8].upper()}"
        ticket = {
            "ticket_id": ticket_id,
            "id": ticket_id,
            "order_id": order_id,
            "type": "service_booking",
            "category": item.get("service_name", "service").lower(),
            "pillar": "care",  # TODO: Get from service definition
            "status": "new",
            "urgency": "medium",
            "subject": f"Service Booking: {item.get('service_name')} - {item.get('scheduled_date')}",
            "description": item.get("notes") or f"Service booking for {item.get('pet_name', 'pet')}",
            "member": {
                "name": user.get("name") if user else "Guest",
                "email": user.get("email") if user else None,
                "phone": user.get("phone") if user else None,
                "id": user_id
            },
            "pet_info": {
                "name": item.get("pet_name"),
                "id": item.get("pet_id")
            },
            "booking_details": {
                "service_id": item.get("service_id"),
                "service_name": item.get("service_name"),
                "date": item.get("scheduled_date"),
                "time": item.get("scheduled_time"),
                "city": item.get("city"),
                "price": item.get("total_price")
            },
            "source": "service_cart_checkout",
            "created_at": now,
            "updated_at": now,
            "messages": []
        }
        
        await db.service_desk_tickets.insert_one(ticket)
        await db.tickets.insert_one({k: v for k, v in ticket.items() if k != "_id"})
    
    # Clear cart
    await db.service_carts.delete_one({"cart_id": cart_id})
    
    return {
        "success": True,
        "order_id": order_id,
        "total": total_amount,
        "payment_status": "pending",
        "message": f"Order created with {len(cart.get('items', []))} service bookings"
    }


# ==================== SEED CARE SERVICES ====================

@router.post("/seed-care-services")
async def seed_care_services(authorization: str = Header(...)):
    """Seed initial Care pillar services (Admin only)"""
    db = get_db()
    
    # Simple token verification - check if it's a valid admin token
    try:
        import jwt
        import os
        SECRET_KEY = os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof")
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        # For admin tokens, check username or role
        if not payload.get("username") and not payload.get("role") == "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
    except jwt.exceptions.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    care_services = [
        {
            "id": "SVC-GROOM-BASIC",
            "name": "Basic Grooming",
            "pillar": "care",
            "category": "grooming",
            "description": "Bath, brush, nail trim, ear cleaning",
            "base_price": 800,
            "duration_minutes": 60,
            "city_pricing": {
                "mumbai": 1.15,
                "delhi": 1.10,
                "bangalore": 1.0,
                "chennai": 0.95,
                "hyderabad": 0.95,
                "pune": 1.05
            },
            "pet_count_pricing": {
                "1": 1.0,
                "2": 1.8,
                "3": 2.5
            },
            "pet_size_pricing": {
                "toy": 0.7,
                "small": 0.85,
                "medium": 1.0,
                "large": 1.3,
                "giant": 1.6
            },
            "payment_timing": "configurable",
            "deposit_percentage": 20,
            "is_active": True,
            "available_cities": ["mumbai", "bangalore", "delhi", "pune", "hyderabad", "chennai"],
            "available_days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
            "available_time_slots": ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"],
            "includes": ["Bath with premium shampoo", "Blow dry", "Brushing", "Nail trim", "Ear cleaning", "Paw pad moisturizing"],
            "add_ons": [
                {"id": "ADDON-HAIRCUT", "name": "Haircut/Trim", "price": 300},
                {"id": "ADDON-TEETH", "name": "Teeth Brushing", "price": 150},
                {"id": "ADDON-PERFUME", "name": "Pet Cologne", "price": 100},
                {"id": "ADDON-DMAT", "name": "De-matting", "price": 400}
            ]
        },
        {
            "id": "SVC-GROOM-FULL",
            "name": "Full Spa Grooming",
            "pillar": "care",
            "category": "grooming",
            "description": "Complete spa experience with massage, premium products",
            "base_price": 1500,
            "duration_minutes": 120,
            "city_pricing": {
                "mumbai": 1.15,
                "delhi": 1.10,
                "bangalore": 1.0
            },
            "pet_size_pricing": {
                "small": 0.85,
                "medium": 1.0,
                "large": 1.4,
                "giant": 1.8
            },
            "payment_timing": "deposit",
            "deposit_percentage": 30,
            "is_active": True,
            "includes": ["Everything in Basic Grooming", "Full haircut/styling", "Spa massage", "Pawdicure", "Aromatherapy", "Bandana"],
            "add_ons": [
                {"id": "ADDON-FACIAL", "name": "Facial Treatment", "price": 300},
                {"id": "ADDON-MASK", "name": "Coat Mask Treatment", "price": 250}
            ]
        },
        {
            "id": "SVC-VET-CONSULT",
            "name": "Vet Consultation",
            "pillar": "care",
            "category": "vet",
            "description": "General health checkup and consultation",
            "base_price": 600,
            "duration_minutes": 30,
            "city_pricing": {
                "mumbai": 1.20,
                "delhi": 1.15,
                "bangalore": 1.0
            },
            "payment_timing": "upfront",
            "is_active": True,
            "includes": ["Physical examination", "Health assessment", "Diet recommendations", "Prescription if needed"],
            "add_ons": [
                {"id": "ADDON-BLOOD", "name": "Blood Work", "price": 1200},
                {"id": "ADDON-XRAY", "name": "X-Ray", "price": 800},
                {"id": "ADDON-VAX", "name": "Vaccination", "price": 500}
            ]
        }
    ]
    
    now = datetime.now(timezone.utc)
    
    for service in care_services:
        service["created_at"] = now
        service["updated_at"] = now
        
        await db.service_catalog.update_one(
            {"id": service["id"]},
            {"$set": service},
            upsert=True
        )
    
    return {"success": True, "message": f"Seeded {len(care_services)} care services"}
