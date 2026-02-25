"""
Autoship System Routes for The Doggy Company
Handles subscription-based recurring orders
"""

import os
import uuid
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
import jwt

logger = logging.getLogger(__name__)

# Create routers
autoship_router = APIRouter(prefix="/api", tags=["Autoship"])
autoship_admin_router = APIRouter(prefix="/api/admin", tags=["Autoship Admin"])

# Database reference
db: AsyncIOMotorDatabase = None

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()

# JWT Settings
SECRET_KEY = os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof")
ALGORITHM = "HS256"

# Dependencies will be injected
_get_current_user_func = None


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def set_dependencies(current_user_func):
    """Inject dependencies from server.py"""
    global _get_current_user_func
    _get_current_user_func = current_user_func


async def get_current_user_from_token(authorization: str = Header(None)):
    """Extract and validate user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


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

class AutoshipCreate(BaseModel):
    product_id: str
    variant: Optional[str] = None
    frequency: int = 4  # weeks
    delivery_address: Optional[str] = None


# ==================== AUTOSHIP FUNCTIONS ====================

def calculate_autoship_discount(order_count: int, original_price: float, product_override: dict = None) -> dict:
    """
    Calculate discount based on autoship order count
    NEW TIERS:
    - Order 1: 10% off
    - Orders 2-4: 15% off
    - Orders 5+: 30% off
    
    Can be overridden at product level with custom discount
    """
    # Default tier discounts
    if order_count == 1:
        base_discount_percent = 10
    elif order_count >= 2 and order_count <= 4:
        base_discount_percent = 15
    elif order_count >= 5:
        base_discount_percent = 30
    else:
        base_discount_percent = 0
    
    # Check for product-level override
    is_special = False
    discount_percent = base_discount_percent
    
    if product_override:
        custom_discount = product_override.get("autoship_discount_percent")
        special_until = product_override.get("autoship_special_until")
        
        # Check if special offer is still valid
        if custom_discount and custom_discount > 0:
            if special_until:
                try:
                    expiry = datetime.fromisoformat(special_until.replace('Z', '+00:00'))
                    if datetime.now(timezone.utc) <= expiry:
                        discount_percent = custom_discount
                        is_special = custom_discount > base_discount_percent
                except:
                    discount_percent = custom_discount
                    is_special = custom_discount > base_discount_percent
            else:
                # No expiry - always use custom discount
                discount_percent = custom_discount
                is_special = custom_discount > base_discount_percent
    
    discount = original_price * (discount_percent / 100)
    
    return {
        "discount_percent": discount_percent,
        "base_discount_percent": base_discount_percent,
        "discount_amount": round(discount, 2),
        "final_price": round(original_price - discount, 2),
        "order_count": order_count,
        "is_special_offer": is_special,
        "has_product_override": product_override is not None and product_override.get("autoship_discount_percent") is not None
    }


# ==================== USER AUTOSHIP ROUTES ====================

@autoship_router.get("/autoship/my-subscriptions")
async def get_my_autoship_subscriptions(current_user: dict = Depends(get_current_user_from_token)):
    """Get all autoship subscriptions for the current user"""
    subscriptions = []
    async for sub in db.autoship_subscriptions.find(
        {"user_email": current_user["email"], "status": {"$ne": "cancelled"}},
        {"_id": 0}
    ):
        # Fetch product details
        product = await db.products_master.find_one({"id": sub.get("product_id")}, {"_id": 0, "name": 1, "image": 1})
        if product:
            sub["product"] = product
        subscriptions.append(sub)
    
    return {"subscriptions": subscriptions}


@autoship_router.post("/autoship/create")
async def create_autoship_subscription(
    data: AutoshipCreate,
    current_user: dict = Depends(get_current_user_from_token)
):
    """Create a new autoship subscription"""
    # Get product details
    product = await db.products_master.find_one({"id": data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.get("autoship_enabled"):
        raise HTTPException(status_code=400, detail="This product is not eligible for Autoship")
    
    # Check if subscription already exists for this product
    existing = await db.autoship_subscriptions.find_one({
        "user_email": current_user["email"],
        "product_id": data.product_id,
        "status": {"$in": ["active", "paused"]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active subscription for this product")
    
    # Calculate first shipment date (based on frequency)
    next_date = datetime.now(timezone.utc) + timedelta(weeks=data.frequency)
    
    subscription = {
        "id": f"auto-{uuid.uuid4().hex[:8]}",
        "user_email": current_user["email"],
        "user_id": current_user.get("id"),
        "product_id": data.product_id,
        "product_name": product["name"],
        "product_image": product.get("image"),
        "variant": data.variant,
        "price": product.get("price", 0),
        "frequency": data.frequency,
        "status": "active",
        "order_count": 0,
        "next_shipment_date": next_date.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "delivery_address": data.delivery_address
    }
    
    await db.autoship_subscriptions.insert_one(subscription)
    subscription.pop("_id", None)
    
    return {"message": "Autoship subscription created", "subscription": subscription}


@autoship_router.put("/autoship/{subscription_id}/pause")
async def pause_autoship(subscription_id: str, current_user: dict = Depends(get_current_user_from_token)):
    """Pause an autoship subscription"""
    result = await db.autoship_subscriptions.update_one(
        {"id": subscription_id, "user_email": current_user["email"], "status": "active"},
        {"$set": {"status": "paused", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found or already paused")
    return {"message": "Subscription paused"}


@autoship_router.put("/autoship/{subscription_id}/resume")
async def resume_autoship(subscription_id: str, current_user: dict = Depends(get_current_user_from_token)):
    """Resume a paused autoship subscription"""
    sub = await db.autoship_subscriptions.find_one(
        {"id": subscription_id, "user_email": current_user["email"], "status": "paused"}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found or not paused")
    
    # Calculate next shipment date from today
    next_date = datetime.now(timezone.utc) + timedelta(weeks=sub.get("frequency", 4))
    
    await db.autoship_subscriptions.update_one(
        {"id": subscription_id},
        {"$set": {
            "status": "active",
            "next_shipment_date": next_date.isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Subscription resumed", "next_shipment_date": next_date.isoformat()}


@autoship_router.put("/autoship/{subscription_id}/cancel")
async def cancel_autoship(subscription_id: str, current_user: dict = Depends(get_current_user_from_token)):
    """Cancel an autoship subscription"""
    result = await db.autoship_subscriptions.update_one(
        {"id": subscription_id, "user_email": current_user["email"]},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Subscription cancelled"}


@autoship_router.put("/autoship/{subscription_id}/update")
async def update_autoship(
    subscription_id: str,
    frequency: Optional[int] = None,
    next_shipment_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user_from_token)
):
    """Update autoship frequency or next shipment date"""
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if frequency:
        update_data["frequency"] = frequency
    if next_shipment_date:
        update_data["next_shipment_date"] = next_shipment_date
    
    result = await db.autoship_subscriptions.update_one(
        {"id": subscription_id, "user_email": current_user["email"]},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Subscription updated"}


@autoship_router.put("/autoship/{subscription_id}/skip")
async def skip_next_autoship(subscription_id: str, current_user: dict = Depends(get_current_user_from_token)):
    """Skip the next autoship delivery"""
    sub = await db.autoship_subscriptions.find_one(
        {"id": subscription_id, "user_email": current_user["email"], "status": "active"}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found or not active")
    
    # Move next shipment date by one frequency period
    current_next = datetime.fromisoformat(sub.get("next_shipment_date", datetime.now(timezone.utc).isoformat()))
    new_next = current_next + timedelta(weeks=sub.get("frequency", 4))
    
    await db.autoship_subscriptions.update_one(
        {"id": subscription_id},
        {"$set": {"next_shipment_date": new_next.isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Next delivery skipped", "new_next_shipment_date": new_next.isoformat()}


# ==================== ADMIN AUTOSHIP ROUTES ====================

@autoship_admin_router.get("/autoship")
async def get_all_autoship_subscriptions(
    status: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Get all autoship subscriptions for admin dashboard"""
    query = {}
    if status:
        query["status"] = status
    
    subscriptions = []
    async for sub in db.autoship_subscriptions.find(query, {"_id": 0}).sort("created_at", -1):
        # Get user info
        user = await db.users.find_one({"email": sub.get("user_email")}, {"_id": 0, "name": 1, "phone": 1})
        if user:
            sub["customer_name"] = user.get("name", "Unknown")
            sub["customer_phone"] = user.get("phone", "")
        subscriptions.append(sub)
    
    # Get stats
    active_count = await db.autoship_subscriptions.count_documents({"status": "active"})
    paused_count = await db.autoship_subscriptions.count_documents({"status": "paused"})
    
    return {
        "subscriptions": subscriptions,
        "stats": {
            "active": active_count,
            "paused": paused_count,
            "total": len(subscriptions)
        }
    }


@autoship_admin_router.put("/autoship/{subscription_id}/status")
async def admin_update_autoship_status(
    subscription_id: str,
    new_status: str,
    username: str = Depends(verify_admin)
):
    """Admin update subscription status"""
    if new_status not in ["active", "paused", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": username
    }
    
    # If resuming, calculate new next shipment date
    if new_status == "active":
        sub = await db.autoship_subscriptions.find_one({"id": subscription_id})
        if sub:
            next_date = datetime.now(timezone.utc) + timedelta(weeks=sub.get("frequency", 4))
            update_data["next_shipment_date"] = next_date.isoformat()
    
    result = await db.autoship_subscriptions.update_one(
        {"id": subscription_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Log the change
    await db.autoship_logs.insert_one({
        "subscription_id": subscription_id,
        "action": f"status_changed_to_{new_status}",
        "changed_by": username,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"Subscription status updated to {new_status}"}


@autoship_admin_router.get("/autoship/stats")
async def get_autoship_stats(username: str = Depends(verify_admin)):
    """Get autoship statistics"""
    active = await db.autoship_subscriptions.count_documents({"status": "active"})
    paused = await db.autoship_subscriptions.count_documents({"status": "paused"})
    cancelled = await db.autoship_subscriptions.count_documents({"status": "cancelled"})
    total = active + paused + cancelled
    
    # Get upcoming shipments (next 7 days)
    next_week = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    upcoming = await db.autoship_subscriptions.count_documents({
        "status": "active",
        "next_shipment_date": {"$lte": next_week}
    })
    
    return {
        "active": active,
        "paused": paused,
        "cancelled": cancelled,
        "total": total,
        "upcoming_shipments_7d": upcoming
    }
