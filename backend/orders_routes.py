"""
Orders API Routes for The Doggy Company
Handles order creation, retrieval, and management
"""

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
import jwt

logger = logging.getLogger(__name__)

# Create router
orders_router = APIRouter(prefix="/api", tags=["Orders"])

# Database reference
db: AsyncIOMotorDatabase = None

# Dependencies will be injected
_get_current_user_func = None
create_admin_notification = None
notify_order_status_change = None
on_order_placed = None

# JWT Settings (will be set from server.py)
SECRET_KEY = os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof")
ALGORITHM = "HS256"


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def set_dependencies(
    current_user_func,
    admin_notification_func,
    order_status_notification_func,
    order_placed_func
):
    """Inject dependencies from server.py"""
    global _get_current_user_func, create_admin_notification, notify_order_status_change, on_order_placed
    _get_current_user_func = current_user_func
    create_admin_notification = admin_notification_func
    notify_order_status_change = order_status_notification_func
    on_order_placed = order_placed_func


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


# ==================== ORDERS API ====================

@orders_router.get("/orders")
async def get_orders(
    limit: int = 50,
    status: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """
    Get orders - public endpoint for Services integration.
    Returns orders for the authenticated user, or recent orders if admin.
    """
    if db is None:
        return {"orders": [], "count": 0}
    
    query = {}
    
    # If authenticated, filter by user
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            role = payload.get("role", "user")
            
            if email and role != "admin":
                query["customer.email"] = email
        except:
            pass
    
    if status:
        query["status"] = status
    
    try:
        orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
        return {"orders": orders, "count": len(orders)}
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        return {"orders": [], "count": 0, "error": str(e)}


@orders_router.get("/orders/my-orders")
async def get_my_orders(current_user: dict = Depends(get_current_user_from_token)):
    """Get orders for the logged-in user"""
    query = {"customer.email": current_user["email"]}
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"orders": orders}


@orders_router.post("/orders")
async def create_order(order: dict):
    """Create a new order with reference images and auto-create service desk ticket"""
    order_id = str(uuid.uuid4())
    order["id"] = order_id
    order["orderId"] = order.get("orderId") or order_id  # Support both fields
    order["created_at"] = datetime.now(timezone.utc).isoformat()
    order["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Extract reference images from items (for cakes)
    reference_images = []
    has_cake_items = False
    for item in order.get("items", []):
        category = (item.get("category") or "").lower()
        name = (item.get("name") or "").lower()
        
        # Check if it's a cake/bakery item
        if "cake" in name or "cake" in category or category in ["celebration", "cakes", "custom"]:
            has_cake_items = True
        
        # Extract reference images
        custom_details = item.get("customDetails") or {}
        if custom_details.get("referenceImage"):
            reference_images.append({
                "url": custom_details["referenceImage"],
                "item_name": item.get("name", "Cake"),
                "pet_name": custom_details.get("petName"),
                "uploaded_at": order["created_at"]
            })
        if item.get("reference_image"):
            reference_images.append({
                "url": item["reference_image"],
                "item_name": item.get("name", "Cake"),
                "uploaded_at": order["created_at"]
            })
    
    # Store reference images in order
    if reference_images:
        order["reference_images"] = reference_images
    
    # Save order to database
    try:
        await db.orders.insert_one(order)
        logger.info(f"[ORDERS] Order {order_id} saved to database successfully")
    except Exception as db_err:
        logger.error(f"[ORDERS] Failed to save order {order_id}: {db_err}")
        raise HTTPException(status_code=500, detail=f"Failed to save order: {db_err}")
    
    # Determine pillar from items
    items = order.get("items", [])
    pillar = "shop"  # Default
    for item in items:
        item_pillar = (item.get("pillar") or "").lower()
        item_category = (item.get("category") or "").lower()
        item_name = (item.get("name") or "").lower()
        
        # Determine pillar from item
        if item_pillar:
            pillar = item_pillar
            break
        elif "cake" in item_name or "cake" in item_category or item_category in ["celebration", "cakes"]:
            pillar = "celebrate"
            break
        elif item_category in ["fit", "fitness", "exercise"]:
            pillar = "fit"
            break
        elif item_category in ["care", "health", "grooming"]:
            pillar = "care"
            break
        elif item_category in ["travel"]:
            pillar = "travel"
            break
    
    # Create channel intake entry for Unified Inbox
    try:
        customer = order.get("customer") or {}
        delivery = order.get("delivery") or {}
        pet = order.get("pet") or {}
        
        channel_intake_record = {
            "request_id": f"order-{order.get('orderId')}",
            "channel": "web",
            "request_type": "order",
            "pillar": pillar,  # Dynamic pillar
            "status": "pending",
            "customer_name": customer.get("parentName"),
            "customer_email": customer.get("email"),
            "customer_phone": customer.get("phone") or customer.get("whatsappNumber"),
            "pet_info": {
                "name": pet.get("name"),
                "breed": pet.get("breed")
            },
            "message": f"Order #{order.get('orderId')}: {', '.join([item.get('name', 'Item') for item in order.get('items', [])])}",
            "metadata": {
                "order_id": order.get("orderId"),
                "order_internal_id": order.get("id"),
                "items_count": len(order.get("items", [])),
                "total": order.get("total"),
                "delivery_method": delivery.get("method"),
                "delivery_date": delivery.get("date"),
                "city": delivery.get("city"),
                "has_reference_images": len(reference_images) > 0
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.channel_intakes.insert_one(channel_intake_record)
        logger.info(f"Created channel intake for order {order.get('orderId')} in pillar: {pillar}")
        
        # Route to pillar-specific collection
        pillar_collection_map = {
            "fit": "fit_requests",
            "care": "care_requests",
            "celebrate": "celebrate_requests",
            "dine": "dine_requests",
            "stay": "stay_requests",
            "travel": "travel_requests",
            "learn": "learn_requests",
            "enjoy": "enjoy_requests",
            "shop": "shop_requests"
        }
        
        pillar_collection = pillar_collection_map.get(pillar)
        if pillar_collection:
            pillar_request = {
                **channel_intake_record,
                "source_collection": "orders",
                "order_id": order.get("orderId"),
                "routed_at": datetime.now(timezone.utc).isoformat()
            }
            await db[pillar_collection].insert_one(pillar_request)
            logger.info(f"[PILLAR ROUTING] Order {order.get('orderId')} routed to {pillar_collection}")
            
    except Exception as e:
        logger.error(f"Failed to create channel intake for order: {e}")
    
    # Create service desk ticket for cake orders (Ticket ID = Order ID)
    if has_cake_items:
        try:
            from ticket_auto_create import create_ticket_from_event
            customer = order.get("customer") or {}
            delivery = order.get("delivery") or {}
            
            result = await create_ticket_from_event(
                db=db,
                event_type="cake_order",
                event_data={
                    "order_id": order.get("orderId"),
                    "customer_name": customer.get("parentName"),
                    "customer_email": customer.get("email"),
                    "customer_phone": customer.get("phone") or customer.get("whatsappNumber"),
                    "city": delivery.get("city"),
                    "items": order.get("items", []),
                    "total": order.get("total"),
                    "delivery_method": delivery.get("method", "delivery"),
                    "delivery_address": delivery.get("address"),
                    "pickup_location": delivery.get("pickupLocation"),
                    "delivery_date": delivery.get("date"),
                    "special_instructions": order.get("specialInstructions"),
                    "reference_images": reference_images
                }
            )
            logger.info(f"Service desk ticket result: {result} for order {order.get('orderId')}")
        except Exception as e:
            logger.error(f"Failed to create service desk ticket: {e}", exc_info=True)
    
    # Send notification
    try:
        customer = order.get("customer") or {}
        pet = order.get("pet") or {}
        delivery = order.get("delivery") or {}
        
        items_summary = ", ".join([f"{item['name']} x{item['quantity']}" for item in order.get("items", [])])
        
        logger.info(f"New order: {order.get('orderId')}")
        
        # Create admin notification
        if create_admin_notification:
            await create_admin_notification(
                notification_type="order",
                title=f"🛒 New Order #{order.get('orderId', '')[:8]}" + (" 📷" if reference_images else ""),
                message=f"{customer.get('parentName', 'Customer')} ordered {len(order.get('items', []))} item(s) - ₹{order.get('total', 0)}" + (f" ({len(reference_images)} ref images)" if reference_images else ""),
                category="celebrate",
                related_id=order["id"],
                link_to="/admin?tab=orders",
                priority="high" if order.get('total', 0) > 2000 else "normal",
                metadata={
                    "order_id": order.get('orderId'),
                    "customer_name": customer.get('parentName'),
                    "total": order.get('total'),
                    "items_count": len(order.get('items', [])),
                    "has_reference_images": len(reference_images) > 0
                }
            )
    except Exception as e:
        logger.error(f"Order notification failed: {e}")
    
    # Send unified notification to customer (Email)
    try:
        if notify_order_status_change:
            notification_result = await notify_order_status_change(
                order=order,
                new_status="pending",
                triggered_by="system"
            )
            logger.info(f"Customer notification sent for order {order.get('orderId')}: {notification_result}")
    except Exception as e:
        logger.error(f"Failed to send customer notification: {e}")
    
    # Auto-learn Pet Soul preferences from order
    try:
        from pet_soul_routes import learn_from_order
        learn_result = await learn_from_order(db, order)
        if learn_result.get("learned"):
            logger.info(f"Pet Soul auto-learned from order {order.get('orderId')}: {learn_result.get('learned_items')}")
    except Exception as e:
        logger.error(f"Pet Soul auto-learn failed: {e}")
    
    # Auto-award Paw Points (1 point per ₹10 spent)
    points_earned = 0
    try:
        customer_email = order.get("customer", {}).get("email")
        order_total = order.get("total", 0)
        if customer_email and order_total > 0:
            # Calculate points: 1 point per ₹10 spent
            points_to_award = int(order_total / 10)
            if points_to_award > 0:
                # Check if first order for bonus
                order_count = await db.orders.count_documents({"customer.email": customer_email})
                is_first_order = order_count <= 1
                if is_first_order:
                    points_to_award += 100  # First order bonus
                
                # Update user points
                user = await db.users.find_one({"email": customer_email})
                if user:
                    current_balance = user.get("loyalty_points", 0)
                    lifetime_earned = user.get("lifetime_points_earned", current_balance)
                    new_balance = current_balance + points_to_award
                    new_lifetime = lifetime_earned + points_to_award
                    
                    await db.users.update_one(
                        {"email": customer_email},
                        {"$set": {
                            "loyalty_points": new_balance,
                            "lifetime_points_earned": new_lifetime
                        }}
                    )
                    
                    # Log transaction
                    await db.paw_points_ledger.insert_one({
                        "user_email": customer_email,
                        "amount": points_to_award,
                        "balance_after": new_balance,
                        "reason": f"Order #{order.get('orderId', '')[:8]}" + (" (First Order Bonus!)" if is_first_order else ""),
                        "source": "order",
                        "reference_id": order.get("orderId"),
                        "created_at": datetime.now(timezone.utc)
                    })
                    
                    points_earned = points_to_award
                    logger.info(f"Awarded {points_to_award} Paw Points to {customer_email} for order {order.get('orderId')}")
    except Exception as e:
        logger.error(f"Paw Points auto-award failed: {e}")
    
    # Auto-create ticket for Command Center
    ticket_id = None
    try:
        if on_order_placed:
            ticket_result = await on_order_placed(order)
            if ticket_result.get("success"):
                ticket_id = ticket_result.get('ticket_id')
                logger.info(f"Auto-created ticket {ticket_id} for order {order.get('orderId')}")
    except Exception as e:
        logger.error(f"Auto-ticket creation failed for order: {e}")
    
    # Regenerate wrapped for all pets in the order
    try:
        pet_ids = set()
        for item in order.get("items", []):
            if item.get("pet_id"):
                pet_ids.add(item["pet_id"])
        for pid in pet_ids:
            from routes.wrapped.generate import generate_pet_wrapped
            import asyncio
            asyncio.create_task(generate_pet_wrapped(pid))
    except Exception as e:
        logger.warning(f"Wrapped regen on order failed: {e}")
    
    return {
        "message": "Order created",
        "orderId": order.get("orderId"),
        "id": order["id"],
        "ticket_id": ticket_id
    }


@orders_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order by ID"""
    order = await db.orders.find_one(
        {"$or": [{"id": order_id}, {"orderId": order_id}]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
