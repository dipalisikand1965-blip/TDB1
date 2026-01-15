"""
Order Routes for The Doggy Company
Handles orders, autoship subscriptions, and cart management
"""

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Create router
order_router = APIRouter(prefix="/api", tags=["Orders"])

# Database reference
db: AsyncIOMotorDatabase = None

# For user authentication - will be injected
get_current_user = None


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def set_auth_dependencies(get_user_func):
    global get_current_user
    get_current_user = get_user_func


# ==================== MODELS ====================

class CartItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    variant: Optional[str] = None
    image: Optional[str] = None


class CartSnapshot(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    items: List[CartItem]
    subtotal: float


class AutoshipCreate(BaseModel):
    product_id: str
    variant: Optional[dict] = None
    frequency: int = 4  # weeks
    delivery_address: Optional[dict] = None


# ==================== ORDER ROUTES ====================

@order_router.get("/orders/my-orders")
async def get_my_orders(authorization: Optional[str] = None):
    """Get orders for the logged-in user"""
    if not get_current_user:
        raise HTTPException(status_code=500, detail="Auth not configured")
    
    from fastapi import Header
    # This will be properly handled when integrated
    # For now, this is a placeholder that will work with the main server
    return {"orders": [], "message": "Use main server endpoint"}


@order_router.post("/orders")
async def create_order(order: dict):
    """Create a new order"""
    order["id"] = str(uuid.uuid4())
    order["created_at"] = datetime.now(timezone.utc).isoformat()
    order["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.orders.insert_one(order)

    # Log the order
    try:
        items_summary = ", ".join([f"{item['name']} x{item['quantity']}" for item in order.get("items", [])])
        logger.info(f"New order: {order.get('orderId')} - Items: {items_summary}")
    except Exception as e:
        logger.error(f"Order logging failed: {e}")

    return {"message": "Order created", "orderId": order.get("orderId"), "id": order["id"]}


@order_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order by ID"""
    order = await db.orders.find_one(
        {"$or": [{"id": order_id}, {"orderId": order_id}]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ==================== CART ROUTES ====================

@order_router.post("/cart/snapshot")
async def save_cart_snapshot(cart: CartSnapshot):
    """Save a cart snapshot for abandoned cart tracking"""
    try:
        cart_data = cart.model_dump()
        cart_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        cart_data["status"] = "active"
        cart_data["reminders_sent"] = 0

        # Upsert based on session_id or user_id
        filter_query = {"session_id": cart.session_id}
        if cart.user_id:
            filter_query = {"$or": [{"session_id": cart.session_id}, {"user_id": cart.user_id}]}

        existing = await db.abandoned_carts.find_one(filter_query)

        if existing:
            await db.abandoned_carts.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "items": cart_data["items"],
                    "subtotal": cart_data["subtotal"],
                    "updated_at": cart_data["updated_at"],
                    "email": cart_data.get("email") or existing.get("email"),
                    "phone": cart_data.get("phone") or existing.get("phone"),
                    "name": cart_data.get("name") or existing.get("name"),
                    "status": "active"
                }}
            )
            return {"message": "Cart updated", "id": str(existing["_id"])}
        else:
            cart_data["created_at"] = cart_data["updated_at"]
            cart_data["id"] = f"cart-{uuid.uuid4().hex[:12]}"
            await db.abandoned_carts.insert_one(cart_data)
            return {"message": "Cart saved", "id": cart_data["id"]}
    except Exception as e:
        logger.error(f"Error saving cart snapshot: {e}")
        raise HTTPException(status_code=500, detail="Failed to save cart")


@order_router.post("/cart/capture-email")
async def capture_cart_email(session_id: str, email: str, name: Optional[str] = None):
    """Capture email for abandoned cart recovery"""
    try:
        result = await db.abandoned_carts.update_one(
            {"session_id": session_id},
            {"$set": {
                "email": email,
                "name": name,
                "email_captured_at": datetime.now(timezone.utc).isoformat()
            }}
        )

        if result.modified_count == 0:
            await db.abandoned_carts.insert_one({
                "id": f"cart-{uuid.uuid4().hex[:12]}",
                "session_id": session_id,
                "email": email,
                "name": name,
                "items": [],
                "subtotal": 0,
                "status": "email_captured",
                "email_captured_at": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "reminders_sent": 0
            })

        return {"message": "Email captured", "email": email}
    except Exception as e:
        logger.error(f"Error capturing email: {e}")
        raise HTTPException(status_code=500, detail="Failed to capture email")


@order_router.post("/cart/convert/{session_id}")
async def mark_cart_converted(session_id: str, order_id: str):
    """Mark a cart as converted (order placed)"""
    await db.abandoned_carts.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": "converted",
            "order_id": order_id,
            "converted_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Cart marked as converted"}


# ==================== AUTOSHIP HELPER ====================

def calculate_autoship_discount(order_count: int, original_price: float) -> dict:
    """
    Calculate discount based on autoship order count
    Order 1: 25% off (max ₹300)
    Orders 4-5: 40% off
    Orders 6-7+: 50% off
    """
    if order_count == 1:
        discount_percent = 25
        max_discount = 300
        discount = min(original_price * 0.25, max_discount)
    elif order_count in [4, 5]:
        discount_percent = 40
        discount = original_price * 0.40
    elif order_count >= 6:
        discount_percent = 50
        discount = original_price * 0.50
    else:
        discount_percent = 0
        discount = 0

    return {
        "discount_percent": discount_percent,
        "discount_amount": round(discount, 2),
        "final_price": round(original_price - discount, 2),
        "order_count": order_count
    }
