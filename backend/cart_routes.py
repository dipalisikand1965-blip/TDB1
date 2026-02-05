"""
Abandoned Cart Routes for The Doggy Company
Handles cart snapshots, email capture, and recovery emails for abandoned carts
"""

import os
import uuid
import logging
import secrets
import asyncio
import resend
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import CartSnapshot

logger = logging.getLogger(__name__)

# Create routers
cart_router = APIRouter(prefix="/api", tags=["Cart"])
cart_admin_router = APIRouter(prefix="/api/admin", tags=["Cart Admin"])

# Database reference
db: AsyncIOMotorDatabase = None

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()

# Email configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.in")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


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


# ==================== PUBLIC CART ROUTES ====================

@cart_router.get("/cart")
async def get_user_cart(session_id: Optional[str] = None, user_id: Optional[str] = None):
    """Get the current cart for a user/session"""
    try:
        if not session_id and not user_id:
            return {"cart": {"items": [], "subtotal": 0}, "message": "No cart identifier provided"}
        
        # Build query
        query = {}
        if user_id:
            query["$or"] = [{"user_id": user_id}, {"session_id": session_id}] if session_id else [{"user_id": user_id}]
        elif session_id:
            query["session_id"] = session_id
        
        # Find the cart
        cart = await db.abandoned_carts.find_one(query, {"_id": 0})
        
        if cart:
            return {
                "cart": {
                    "id": cart.get("id"),
                    "items": cart.get("items", []),
                    "subtotal": cart.get("subtotal", 0),
                    "status": cart.get("status", "active"),
                    "email": cart.get("email"),
                    "name": cart.get("name"),
                    "updated_at": cart.get("updated_at")
                }
            }
        else:
            return {"cart": {"items": [], "subtotal": 0}, "message": "No active cart found"}
    except Exception as e:
        logger.error(f"Error getting cart: {e}")
        return {"cart": {"items": [], "subtotal": 0}, "error": str(e)}


@cart_router.post("/cart/add")
async def add_to_cart(
    session_id: str,
    item: dict,
    user_id: Optional[str] = None
):
    """Add item to cart"""
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Find existing cart
        filter_query = {"session_id": session_id}
        if user_id:
            filter_query = {"$or": [{"session_id": session_id}, {"user_id": user_id}]}
        
        existing = await db.abandoned_carts.find_one(filter_query)
        
        if existing:
            # Check if item already exists
            items = existing.get("items", [])
            item_exists = False
            for i, existing_item in enumerate(items):
                if existing_item.get("id") == item.get("id") and existing_item.get("variant") == item.get("variant"):
                    # Update quantity
                    items[i]["quantity"] = items[i].get("quantity", 1) + item.get("quantity", 1)
                    item_exists = True
                    break
            
            if not item_exists:
                items.append(item)
            
            # Calculate new subtotal
            subtotal = sum(i.get("price", 0) * i.get("quantity", 1) for i in items)
            
            await db.abandoned_carts.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "items": items,
                    "subtotal": subtotal,
                    "updated_at": now,
                    "status": "active"
                }}
            )
            return {"message": "Item added to cart", "items_count": len(items), "subtotal": subtotal}
        else:
            # Create new cart
            cart_id = f"cart-{uuid.uuid4().hex[:12]}"
            cart_doc = {
                "id": cart_id,
                "session_id": session_id,
                "user_id": user_id,
                "items": [item],
                "subtotal": item.get("price", 0) * item.get("quantity", 1),
                "status": "active",
                "created_at": now,
                "updated_at": now,
                "reminders_sent": 0
            }
            await db.abandoned_carts.insert_one(cart_doc)
            return {"message": "Cart created", "id": cart_id, "items_count": 1, "subtotal": cart_doc["subtotal"]}
    except Exception as e:
        logger.error(f"Error adding to cart: {e}")
        raise HTTPException(status_code=500, detail="Failed to add item to cart")


@cart_router.delete("/cart/item")
async def remove_from_cart(
    session_id: str,
    item_id: str,
    variant: Optional[str] = None,
    user_id: Optional[str] = None
):
    """Remove item from cart"""
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Find existing cart
        filter_query = {"session_id": session_id}
        if user_id:
            filter_query = {"$or": [{"session_id": session_id}, {"user_id": user_id}]}
        
        existing = await db.abandoned_carts.find_one(filter_query)
        
        if not existing:
            raise HTTPException(status_code=404, detail="Cart not found")
        
        # Remove item
        items = existing.get("items", [])
        items = [i for i in items if not (i.get("id") == item_id and (not variant or i.get("variant") == variant))]
        
        # Calculate new subtotal
        subtotal = sum(i.get("price", 0) * i.get("quantity", 1) for i in items)
        
        await db.abandoned_carts.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "items": items,
                "subtotal": subtotal,
                "updated_at": now
            }}
        )
        
        return {"message": "Item removed from cart", "items_count": len(items), "subtotal": subtotal}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing from cart: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove item from cart")


@cart_router.delete("/cart")
async def clear_cart(
    session_id: str,
    user_id: Optional[str] = None
):
    """Clear all items from cart"""
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        filter_query = {"session_id": session_id}
        if user_id:
            filter_query = {"$or": [{"session_id": session_id}, {"user_id": user_id}]}
        
        result = await db.abandoned_carts.update_one(
            filter_query,
            {"$set": {
                "items": [],
                "subtotal": 0,
                "updated_at": now,
                "status": "cleared"
            }}
        )
        
        if result.modified_count == 0:
            return {"message": "No cart found to clear"}
        
        return {"message": "Cart cleared", "items_count": 0, "subtotal": 0}
    except Exception as e:
        logger.error(f"Error clearing cart: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear cart")


@cart_router.post("/cart/snapshot")
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
            # Update existing cart
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
            # Create new cart
            cart_data["created_at"] = cart_data["updated_at"]
            cart_data["id"] = f"cart-{uuid.uuid4().hex[:12]}"
            await db.abandoned_carts.insert_one(cart_data)
            return {"message": "Cart saved", "id": cart_data["id"]}
    except Exception as e:
        logger.error(f"Error saving cart snapshot: {e}")
        raise HTTPException(status_code=500, detail="Failed to save cart")


@cart_router.post("/cart/capture-email")
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
            # Create new entry for email capture
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


@cart_router.post("/cart/convert/{session_id}")
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


# ==================== ABANDONED CART EMAIL SYSTEM ====================

async def send_abandoned_cart_email(to_email: str, name: str, items: list, 
                                     subtotal: float, reminder_config: dict, cart_id: str) -> bool:
    """Send abandoned cart recovery email using admin-configured settings. Returns True if successful."""
    try:
        # CRITICAL: Validate email is a non-empty string
        if not to_email or not isinstance(to_email, str) or "@" not in to_email:
            logger.warning(f"Abandoned cart email skipped: invalid email address '{to_email}'")
            return False
        
        # Clean the email address
        to_email = to_email.strip()
        
        # Check if Resend is configured
        if not RESEND_API_KEY:
            logger.warning("Email service not configured (RESEND_API_KEY missing)")
            return False
        
        # Get config values
        subject = reminder_config.get("subject", "🛒 You left something behind!")
        include_discount = reminder_config.get("include_discount", False)
        discount_code = reminder_config.get("discount_code", "COMEBACK10")
        discount_percent = reminder_config.get("discount_percent", 10)
        
        # Build items HTML
        items_html = ""
        for item in items[:5]:  # Show max 5 items
            items_html += f'''
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        {f'<img src="{item.get("image")}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">' if item.get("image") else ''}
                        <div>
                            <strong>{item.get("name", "Product")}</strong>
                            {f'<br><small style="color: #6b7280;">{item.get("variant")}</small>' if item.get("variant") else ''}
                        </div>
                    </div>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                    {item.get("quantity", 1)}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ₹{item.get("price", 0):,.0f}
                </td>
            </tr>
            '''
        
        # Discount section if enabled
        discount_section = ""
        if include_discount:
            discount_section = f'''
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400e;">🎉 Special Offer Just For You!</p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #78350f;">Use code: <span style="background: #fff; padding: 5px 15px; border-radius: 8px; border: 2px dashed #f59e0b;">{discount_code}</span></p>
                <p style="margin: 10px 0 0 0; color: #92400e;">Get {discount_percent}% off your order - expires in 24 hours!</p>
            </div>
            '''
        
        # Urgency message
        urgency_message = "Your carefully selected treats are waiting! Don't let them slip away."
        if include_discount:
            urgency_message = "This is your last chance to grab these treats with a special discount!"
        
        html_content = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .header {{ background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ background: #fff; padding: 30px; }}
                .cta-button {{ display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; }}
                .footer {{ background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🐾 The Doggy Bakery</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Don't forget your treats!</p>
                </div>
                <div class="content">
                    <h2 style="color: #9333ea;">Hi {name}! 👋</h2>
                    
                    <p>{urgency_message}</p>
                    
                    {discount_section}
                    
                    <h3 style="color: #9333ea;">Your Cart:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f9fafb;">
                                <th style="padding: 10px; text-align: left;">Product</th>
                                <th style="padding: 10px; text-align: center;">Qty</th>
                                <th style="padding: 10px; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                        <tfoot>
                            <tr style="font-weight: bold;">
                                <td colspan="2" style="padding: 15px; text-align: right;">Subtotal:</td>
                                <td style="padding: 15px; text-align: right; color: #9333ea; font-size: 18px;">₹{subtotal:,.0f}</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://thedoggycompany.in/checkout" class="cta-button">
                            Complete Your Order 🛒
                        </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        Questions? Chat with Mira, our Concierge®, or contact us at woof@thedoggycompany.in
                    </p>
                </div>
                <div class="footer">
                    <p>The Doggy Bakery | Baking happiness for your furry friends</p>
                    <p>📞 +91 96631 85747 | 📧 woof@thedoggycompany.in</p>
                    <p style="font-size: 11px; color: #9ca3af;">
                        <a href="https://thedoggycompany.in/unsubscribe?cart={cart_id}" style="color: #9333ea;">Unsubscribe from cart reminders</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        '''
        
        params = {
            "from": f"The Doggy Bakery <{SENDER_EMAIL}>",
            "to": to_email,  # Resend expects a string, not a list
            "subject": subject,
            "html": html_content
        }
        
        resend.Emails.send(params)
        logger.info(f"Abandoned cart email (reminder #{reminder_config.get('reminder_num', '?')}) sent to {to_email}")
        return True
        
    except Exception as e:
        error_msg = str(e)
        # Handle common Resend errors gracefully (don't spam logs in production)
        if "verify a domain" in error_msg.lower() or "testing emails" in error_msg.lower():
            logger.warning(f"Abandoned cart email skipped (domain not verified): {to_email}")
            return False
        elif "rate limit" in error_msg.lower() or "too many requests" in error_msg.lower():
            logger.warning(f"Abandoned cart email rate limited: {to_email}")
            return False
        else:
            logger.error(f"Failed to send abandoned cart email: {e}")
            return False


async def check_abandoned_carts():
    """Check for abandoned carts and send recovery emails based on admin-configured timing"""
    try:
        logger.info("Checking abandoned carts...")
        now = datetime.now(timezone.utc)
        
        # Get admin settings for reminder timing
        settings = await db.app_settings.find_one({"id": "global_settings"})
        
        # Check if abandoned cart reminders are enabled
        if settings and not settings.get("abandoned_cart_enabled", True):
            logger.info("Abandoned cart reminders are disabled in settings")
            return 0
        
        # Reduced batch size and timeout protection
        MAX_EMAILS_PER_RUN = 10  # Limit emails per scheduler run to prevent timeout
        
        # Get reminder configuration (with defaults)
        reminder_config = settings.get("abandoned_cart_reminders") if settings else None
        if not reminder_config:
            reminder_config = [
                {"reminder_num": 1, "delay_hours": 1, "subject": "🛒 You left something behind!", "include_discount": False},
                {"reminder_num": 2, "delay_hours": 24, "subject": "🐾 Your pup is still waiting!", "include_discount": False},
                {"reminder_num": 3, "delay_hours": 72, "subject": "🎁 Final reminder + 10% OFF!", "include_discount": True, "discount_code": "COMEBACK10", "discount_percent": 10}
            ]
        
        # Build time thresholds from config
        time_thresholds = {}
        for reminder in reminder_config:
            delay_hours = reminder.get("delay_hours", 1)
            time_thresholds[reminder["reminder_num"]] = {
                "cutoff": (now - timedelta(hours=delay_hours)).isoformat(),
                "config": reminder
            }
        
        # Get abandoned carts eligible for reminders (at least 1 hour old)
        min_cutoff = (now - timedelta(hours=1)).isoformat()
        abandoned_carts = await db.abandoned_carts.find({
            "status": "active",
            "$and": [
                {"email": {"$exists": True}},
                {"email": {"$ne": None}},
                {"email": {"$ne": ""}},
                {"email": {"$type": "string"}},
                {"email": {"$regex": "@"}}
            ],
            "items": {"$exists": True, "$ne": []},
            "updated_at": {"$lt": min_cutoff}
        }).to_list(100)
        
        reminders_sent = 0
        
        for cart in abandoned_carts:
            cart_id = str(cart.get("_id"))
            email = cart.get("email")
            name = cart.get("name", "there")
            items = cart.get("items", [])
            subtotal = cart.get("subtotal", 0)
            reminders_already_sent = cart.get("reminders_sent", 0)
            updated_at = cart.get("updated_at", "")
            
            # CRITICAL: Skip carts without valid email addresses
            if not email or not isinstance(email, str) or "@" not in email:
                logger.debug(f"Skipping cart {cart_id}: invalid or missing email")
                continue
            
            # Find which reminder to send next
            next_reminder_num = reminders_already_sent + 1
            
            if next_reminder_num not in time_thresholds:
                continue  # All reminders sent
            
            threshold = time_thresholds[next_reminder_num]
            
            # Check if enough time has passed
            if updated_at >= threshold["cutoff"]:
                continue  # Not old enough for this reminder
            
            reminder_config_item = threshold["config"]
            
            if RESEND_API_KEY:
                # Check if we've hit the max emails per run limit
                if reminders_sent >= MAX_EMAILS_PER_RUN:
                    logger.info(f"Hit max emails per run limit ({MAX_EMAILS_PER_RUN}), stopping")
                    break
                
                # Rate limit: wait 1 second between emails
                if reminders_sent > 0:
                    await asyncio.sleep(1.0)
                
                success = await send_abandoned_cart_email(
                    to_email=email,
                    name=name,
                    items=items,
                    subtotal=subtotal,
                    reminder_config=reminder_config_item,
                    cart_id=cart.get("id", cart_id)
                )
                
                if success:
                    reminders_sent += 1
                    await db.abandoned_carts.update_one(
                        {"_id": cart["_id"]},
                        {
                            "$inc": {"reminders_sent": 1},
                            "$set": {f"reminder_{next_reminder_num}_sent_at": now.isoformat()}
                        }
                    )
                    
                    # Log the reminder
                    await db.abandoned_cart_reminders.insert_one({
                        "cart_id": cart.get("id", cart_id),
                        "email": email,
                        "reminder_num": next_reminder_num,
                        "delay_hours": reminder_config_item.get("delay_hours"),
                        "items_count": len(items),
                        "subtotal": subtotal,
                        "sent_at": now.isoformat()
                    })
        
        logger.info(f"Abandoned cart check complete. Sent {reminders_sent} reminders.")
        return reminders_sent
        
    except Exception as e:
        logger.error(f"Error checking abandoned carts: {e}", exc_info=True)
        return 0


# ==================== ADMIN CART ROUTES ====================

@cart_admin_router.post("/abandoned-carts/send-reminders")
async def trigger_abandoned_cart_reminders(username: str = Depends(verify_admin)):
    """Manually trigger abandoned cart reminder emails"""
    try:
        reminders_sent = await check_abandoned_carts()
        return {
            "success": True,
            "reminders_sent": reminders_sent,
            "message": f"Sent {reminders_sent} abandoned cart reminder(s)"
        }
    except Exception as e:
        logger.error(f"Manual abandoned cart trigger failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to send reminders"
        }


@cart_admin_router.get("/abandoned-carts")
async def get_abandoned_carts(
    username: str = Depends(verify_admin),
    status: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get all abandoned carts with stats"""
    query = {}
    if status:
        query["status"] = status
    
    carts = await db.abandoned_carts.find(
        query, {"_id": 0}
    ).sort("updated_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.abandoned_carts.count_documents(query)
    active = await db.abandoned_carts.count_documents({"status": "active"})
    converted = await db.abandoned_carts.count_documents({"status": "converted"})
    
    # Calculate total potential revenue
    total_value = 0
    for cart in carts:
        if cart.get("status") == "active":
            total_value += cart.get("subtotal", 0)
    
    return {
        "carts": carts,
        "total": total,
        "stats": {
            "active": active,
            "converted": converted,
            "potential_revenue": total_value
        }
    }


@cart_admin_router.get("/abandoned-carts/reminders")
async def get_cart_reminders_log(
    username: str = Depends(verify_admin),
    limit: int = 50,
    skip: int = 0
):
    """Get log of sent abandoned cart reminders"""
    reminders = await db.abandoned_cart_reminders.find(
        {}, {"_id": 0}
    ).sort("sent_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.abandoned_cart_reminders.count_documents({})
    
    return {
        "reminders": reminders,
        "total": total
    }


@cart_admin_router.post("/abandoned-carts/trigger-check")
async def admin_trigger_cart_check(username: str = Depends(verify_admin)):
    """Manually trigger abandoned cart check"""
    try:
        reminders_sent = await check_abandoned_carts()
        return {
            "message": "Abandoned cart check completed",
            "reminders_sent": reminders_sent,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Check failed: {str(e)}")


@cart_admin_router.delete("/abandoned-carts/{cart_id}")
async def delete_abandoned_cart(cart_id: str, username: str = Depends(verify_admin)):
    """Delete an abandoned cart record"""
    result = await db.abandoned_carts.delete_one(
        {"$or": [{"id": cart_id}, {"session_id": cart_id}]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart not found")
    return {"message": "Cart deleted"}


@cart_admin_router.post("/abandoned-carts/{cart_id}/send-reminder")
async def send_individual_cart_reminder(cart_id: str, username: str = Depends(verify_admin)):
    """Send reminder to a specific abandoned cart"""
    cart = await db.abandoned_carts.find_one(
        {"$or": [{"id": cart_id}, {"session_id": cart_id}]},
        {"_id": 0}
    )
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    if not cart.get("email"):
        raise HTTPException(status_code=400, detail="No email address for this cart")
    
    if cart.get("status") == "converted":
        raise HTTPException(status_code=400, detail="Cart already converted to order")
    
    try:
        # Determine reminder type based on how many reminders already sent
        reminders_sent = cart.get("reminders_sent", 0)
        reminder_config = {
            "reminder_num": reminders_sent + 1,
            "subject": "🛒 Your treats are waiting!",
            "include_discount": reminders_sent >= 2,
            "discount_code": "COMEBACK10",
            "discount_percent": 10
        }
        
        success = await send_abandoned_cart_email(
            to_email=cart["email"],
            name=cart.get("name", "Pet Parent"),
            items=cart.get("items", []),
            subtotal=cart.get("subtotal", 0),
            reminder_config=reminder_config,
            cart_id=cart_id
        )
        
        if success:
            # Update cart with reminder info
            await db.abandoned_carts.update_one(
                {"$or": [{"id": cart_id}, {"session_id": cart_id}]},
                {
                    "$set": {"last_reminder_sent": datetime.now(timezone.utc).isoformat()},
                    "$inc": {"reminders_sent": 1}
                }
            )
            
            # Log the reminder
            await db.abandoned_cart_reminders.insert_one({
                "cart_id": cart_id,
                "email": cart["email"],
                "sent_at": datetime.now(timezone.utc).isoformat(),
                "sent_by": username,
                "manual": True
            })
            
            return {"message": f"Reminder sent to {cart['email']}", "success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending reminder: {str(e)}")


@cart_admin_router.post("/abandoned-carts/bulk-send")
async def send_bulk_cart_reminders(cart_ids: dict, username: str = Depends(verify_admin)):
    """Send reminders to multiple abandoned carts"""
    ids = cart_ids.get("cart_ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No cart IDs provided")
    
    reminders_sent = 0
    errors = []
    
    for cart_id in ids:
        cart = await db.abandoned_carts.find_one(
            {"$or": [{"id": cart_id}, {"session_id": cart_id}]},
            {"_id": 0}
        )
        
        if not cart:
            errors.append(f"Cart {cart_id} not found")
            continue
        
        if not cart.get("email"):
            errors.append(f"Cart {cart_id} has no email")
            continue
        
        if cart.get("status") == "converted":
            continue
        
        try:
            # Determine reminder config based on how many reminders already sent
            reminders_sent_count = cart.get("reminders_sent", 0)
            reminder_config = {
                "reminder_num": reminders_sent_count + 1,
                "subject": "🛒 Your treats are waiting!",
                "include_discount": reminders_sent_count >= 2,
                "discount_code": "COMEBACK10",
                "discount_percent": 10
            }
            
            success = await send_abandoned_cart_email(
                to_email=cart["email"],
                name=cart.get("name", "Pet Parent"),
                items=cart.get("items", []),
                subtotal=cart.get("subtotal", 0),
                reminder_config=reminder_config,
                cart_id=cart_id
            )
            
            if success:
                await db.abandoned_carts.update_one(
                    {"$or": [{"id": cart_id}, {"session_id": cart_id}]},
                    {
                        "$set": {"last_reminder_sent": datetime.now(timezone.utc).isoformat()},
                        "$inc": {"reminders_sent": 1}
                    }
                )
                
                await db.abandoned_cart_reminders.insert_one({
                    "cart_id": cart_id,
                    "email": cart["email"],
                    "sent_at": datetime.now(timezone.utc).isoformat(),
                    "sent_by": username,
                    "manual": True,
                    "bulk": True
                })
                
                reminders_sent += 1
        except Exception as e:
            errors.append(f"Failed to send to {cart.get('email')}: {str(e)}")
    
    return {
        "reminders_sent": reminders_sent,
        "errors": errors if errors else None
    }
