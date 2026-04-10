"""
Razorpay Payment Integration for The Doggy Company
Handles membership subscriptions: Free, Essential (₹2,499/yr), Premium (₹9,999/yr)
"""

import os
import razorpay
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from email_templates import get_email_template, detail_box, detail_row
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Razorpay Configuration
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")

# Initialize Razorpay client
razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    logger.info("[RAZORPAY] Client initialized successfully")
else:
    logger.warning("[RAZORPAY] API keys not configured")

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "pet-os-live-test_database")
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# Membership Plans Configuration
MEMBERSHIP_PLANS = {
    "free": {
        "name": "Free",
        "amount": 0,
        "currency": "INR",
        "period": "lifetime",
        "features": ["Soul Profile", "Mira basic", "Browse", "Book services", "Unlimited pets"]
    },
    "essential_monthly": {
        "name": "Essential Monthly",
        "amount": 25000,  # ₹250 in paise
        "currency": "INR",
        "period": "monthly",
        "features": ["Mira full", "Mira OS", "Concierge chat", "Paw Points", "Health Vault"]
    },
    "essential_yearly": {
        "name": "Essential Yearly",
        "amount": 299900,  # ₹2,999 in paise
        "currency": "INR",
        "period": "yearly",
        "features": ["Mira full", "Mira OS", "Concierge chat", "Paw Points", "Health Vault"]
    },
    "premium_monthly": {
        "name": "Premium Monthly",
        "amount": 99900,  # ₹999 in paise
        "currency": "INR",
        "period": "monthly",
        "features": ["Priority concierge", "Dedicated manager", "White-glove", "VIP support"]
    },
    "premium_yearly": {
        "name": "Premium Yearly",
        "amount": 999900,  # ₹9,999 in paise
        "currency": "INR",
        "period": "yearly",
        "features": ["Priority concierge", "Dedicated manager", "White-glove", "VIP support"]
    }
}


class CreateOrderRequest(BaseModel):
    plan_id: str  # essential_monthly, essential_yearly, premium_monthly, premium_yearly
    user_id: str
    user_email: str
    user_name: Optional[str] = None
    user_phone: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    user_id: str


@router.get("/config")
async def get_payment_config():
    """Get Razorpay public key and plan details for frontend"""
    return {
        "razorpay_key_id": RAZORPAY_KEY_ID,
        "plans": {
            plan_id: {
                "name": plan["name"],
                "amount": plan["amount"],
                "amount_display": f"₹{plan['amount'] // 100}",
                "currency": plan["currency"],
                "period": plan["period"],
                "features": plan["features"]
            }
            for plan_id, plan in MEMBERSHIP_PLANS.items()
            if plan["amount"] > 0  # Exclude free plan
        }
    }


@router.post("/create-order")
async def create_order(request: CreateOrderRequest):
    """Create a Razorpay order for membership payment"""
    
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment gateway not configured")
    
    plan = MEMBERSHIP_PLANS.get(request.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {request.plan_id}")
    
    if plan["amount"] == 0:
        raise HTTPException(status_code=400, detail="Free plan doesn't require payment")
    
    try:
        # Calculate GST (18%)
        base_amount = plan["amount"]
        gst_amount = int(base_amount * 0.18)
        total_amount = base_amount + gst_amount
        
        # Create Razorpay order
        order_data = {
            "amount": total_amount,  # Amount in paise
            "currency": plan["currency"],
            "receipt": f"order_{request.user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "notes": {
                "user_id": request.user_id,
                "plan_id": request.plan_id,
                "user_email": request.user_email
            }
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Store order in database
        order_record = {
            "order_id": razorpay_order["id"],
            "user_id": request.user_id,
            "user_email": request.user_email,
            "user_name": request.user_name,
            "user_phone": request.user_phone,
            "plan_id": request.plan_id,
            "plan_name": plan["name"],
            "base_amount": base_amount,
            "gst_amount": gst_amount,
            "total_amount": total_amount,
            "currency": plan["currency"],
            "status": "created",
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.payment_orders.insert_one(order_record)
        
        logger.info(f"[RAZORPAY] Order created: {razorpay_order['id']} for user {request.user_id}")
        
        return {
            "order_id": razorpay_order["id"],
            "amount": total_amount,
            "amount_display": f"₹{total_amount // 100}",
            "base_amount": base_amount,
            "gst_amount": gst_amount,
            "currency": plan["currency"],
            "plan_name": plan["name"],
            "key_id": RAZORPAY_KEY_ID,
            "prefill": {
                "name": request.user_name or "",
                "email": request.user_email,
                "contact": request.user_phone or ""
            }
        }
        
    except Exception as e:
        logger.error(f"[RAZORPAY] Order creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.post("/verify")
async def verify_payment(request: VerifyPaymentRequest):
    """Verify Razorpay payment signature and activate membership"""
    
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment gateway not configured")
    
    try:
        # Verify signature
        params_dict = {
            "razorpay_order_id": request.razorpay_order_id,
            "razorpay_payment_id": request.razorpay_payment_id,
            "razorpay_signature": request.razorpay_signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Get order details
        order = await db.payment_orders.find_one({"order_id": request.razorpay_order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update order status
        await db.payment_orders.update_one(
            {"order_id": request.razorpay_order_id},
            {
                "$set": {
                    "status": "paid",
                    "payment_id": request.razorpay_payment_id,
                    "paid_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # Determine membership tier
        plan_id = order["plan_id"]
        if "premium" in plan_id:
            membership_tier = "premium"
        elif "essential" in plan_id:
            membership_tier = "essential"
        else:
            membership_tier = "free"
        
        # Calculate expiry
        if "yearly" in plan_id:
            from datetime import timedelta
            expiry_date = datetime.now(timezone.utc) + timedelta(days=365)
        else:
            from datetime import timedelta
            expiry_date = datetime.now(timezone.utc) + timedelta(days=30)
        
        # Update user membership
        await db.users.update_one(
            {"_id": order["user_id"]} if len(order["user_id"]) == 24 else {"id": order["user_id"]},
            {
                "$set": {
                    "membership_tier": membership_tier,
                    "membership_plan": plan_id,
                    "membership_status": "active",
                    "membership_expiry": expiry_date,
                    "last_payment_id": request.razorpay_payment_id,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        logger.info(f"[RAZORPAY] Payment verified: {request.razorpay_payment_id} for user {request.user_id}")
        
        return {
            "success": True,
            "message": "Payment verified successfully",
            "membership_tier": membership_tier,
            "expiry_date": expiry_date.isoformat()
        }
        
    except razorpay.errors.SignatureVerificationError:
        logger.error(f"[RAZORPAY] Signature verification failed for order {request.razorpay_order_id}")
        raise HTTPException(status_code=400, detail="Payment signature verification failed")
    except Exception as e:
        logger.error(f"[RAZORPAY] Payment verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")


@router.post("/webhook")
async def handle_webhook(request: Request):
    """Handle Razorpay webhook events"""
    
    try:
        payload = await request.json()
        event = payload.get("event")
        
        logger.info(f"[RAZORPAY] Webhook received: {event}")
        
        if event == "payment.captured":
            payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment.get("order_id")
            payment_id = payment.get("id")
            amount_paise = payment.get("amount", 0)
            amount_rupees = amount_paise / 100

            # Update order status
            await db.payment_orders.update_one(
                {"order_id": order_id},
                {
                    "$set": {
                        "status": "captured",
                        "payment_id": payment_id,
                        "captured_at": datetime.now(timezone.utc)
                    }
                }
            )

            # ── Notify admin + create ticket on successful payment ────────
            try:
                order = await db.payment_orders.find_one({"order_id": order_id})
                if order:
                    parent_id  = order.get("user_id") or order.get("parent_id") or order.get("email")
                    pet_name   = order.get("pet_name", "")
                    amount     = payment.get("amount", 0) / 100
                    currency   = payment.get("currency", "INR")
                    notes      = payment.get("notes", {})
                    pet_id     = order.get("pet_id") or notes.get("pet_id")
                    order_type = order.get("order_type", "product")
                    item_name  = order.get("item_name") or order.get("plan_name") or "Order"

                    subject = f"Payment confirmed: {item_name}"
                    if pet_name: subject += f" for {pet_name}"

                    msg = (f"Payment of ₹{amount:,.0f} confirmed via Razorpay.\n"
                           f"Order ID: {order_id}\nPayment ID: {payment_id}\nItem: {item_name}\n")
                    if pet_name: msg += f"Pet: {pet_name}\n"

                    now = datetime.now(timezone.utc).isoformat()
                    ticket_id = f"TDC-PAY-{int(datetime.now(timezone.utc).timestamp())}"

                    ticket = {
                        "ticket_id":     ticket_id,
                        "parent_id":     parent_id,
                        "pet_id":        pet_id,
                        "pet_name":      pet_name,
                        "pillar":        "membership" if order_type == "membership" else "shop",
                        "intent_primary":"payment_confirmed",
                        "channel":       "razorpay_webhook",
                        "subject":       subject,
                        "status":        "resolved",  # payment done = auto resolved
                        "urgency":       "normal",
                        "thread": [{"sender":"system","text":msg,"timestamp":now,"message_type":"payment_confirmation"}],
                        "metadata": {"order_id":order_id,"payment_id":payment_id,"amount":amount,"currency":currency,"order_type":order_type},
                        "created_at": now, "updated_at": now,
                    }
                    await db.service_desk_tickets.insert_one(ticket)

                    # Admin bell
                    await db.admin_notifications.insert_one({
                        "type":"payment_confirmed","ticket_id":ticket_id,"subject":subject,
                        "amount":amount,"parent_id":parent_id,"pet_name":pet_name,
                        "order_type":order_type,"read":False,"created_at":now,
                    })

                    # Member notification (in-app)
                    if parent_id:
                        await db.member_notifications.insert_one({
                            "type":"payment_confirmed","parent_id":parent_id,"subject":subject,
                            "message":f"Your payment of ₹{amount:,.0f} was confirmed. {item_name} is on its way!",
                            "read":False,"created_at":now,
                        })

                    # Member email — branded payment confirmation
                    member_email = order.get("email") or (parent_id if "@" in str(parent_id) else None)
                    if member_email:
                        try:
                            import resend
                            resend_key = os.environ.get("RESEND_API_KEY")
                            if resend_key:
                                resend.api_key = resend_key
                                pet_line = f" for <strong>{pet_name}</strong>" if pet_name else ""
                                resend.Emails.send({
                                    "from": os.environ.get("SENDER_EMAIL", "mira@thedoggycompany.com"),
                                    "to": member_email,
                                    "subject": subject,
                                    "html": get_email_template(
                                        title="Payment Confirmed",
                                        tagline="✦ Your order is on its way",
                                        body_html=(
                                            f"<p>Hi there!</p>"
                                            f"<p>Your payment of <strong>₹{amount:,.0f}</strong>{pet_line} was received successfully.</p>"
                                            + detail_box("Payment Details",
                                                detail_row("Item", item_name) +
                                                detail_row("Amount Paid", f"₹{amount:,.0f} {currency}") +
                                                detail_row("Order ID", order_id) +
                                                detail_row("Payment ID", payment_id) +
                                                (detail_row("Pet", pet_name) if pet_name else "")
                                            ) +
                                            "<p style='font-size:13px;color:#666;'>For any questions about your order, reply to this email or call +91 9663185747.</p>"
                                        ),
                                        cta_text="View my orders →",
                                        cta_url="https://thedoggycompany.com/my-requests",
                                    )
                                })
                                logger.info(f"[RAZORPAY] Payment confirmation email sent to {member_email}")
                        except Exception as mail_err:
                            logger.error(f"[RAZORPAY] Email send failed: {mail_err}")

                    logger.info(f"[RAZORPAY] Payment ticket created: {ticket_id} — ₹{amount}")
            except Exception as ticket_err:
                logger.error(f"[RAZORPAY] Ticket creation failed: {ticket_err}")
            
        elif event == "payment.failed":
            payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment.get("order_id")
            error = payment.get("error_description", "Unknown error")
            
            await db.payment_orders.update_one(
                {"order_id": order_id},
                {"$set": {"status": "failed", "error": error, "failed_at": datetime.now(timezone.utc)}}
            )

            # Admin notification for failed payment
            try:
                order = await db.payment_orders.find_one({"order_id": order_id})
                parent_id = (order or {}).get("user_id") or (order or {}).get("parent_id")
                await db.admin_notifications.insert_one({
                    "type": "payment_failed",
                    "subject": f"Payment failed: {error}",
                    "order_id": order_id,
                    "parent_id": parent_id,
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
            except Exception as e:
                logger.error(f"[RAZORPAY] Failed notification error: {e}")
            
        return {"status": "processed"}
        
    except Exception as e:
        logger.error(f"[RAZORPAY] Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


@router.get("/history/{user_id}")
async def get_payment_history(user_id: str):
    """Get payment history for a user"""
    
    orders = await db.payment_orders.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {
        "payments": orders,
        "count": len(orders)
    }


@router.post("/upgrade")
async def upgrade_membership(user_id: str, new_plan_id: str):
    """Initiate membership upgrade"""
    
    # Get current membership
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_tier = user.get("membership_tier", "free")
    
    # Validate upgrade path
    tier_order = {"free": 0, "essential": 1, "premium": 2}
    new_tier = "premium" if "premium" in new_plan_id else "essential" if "essential" in new_plan_id else "free"
    
    if tier_order.get(new_tier, 0) <= tier_order.get(current_tier, 0):
        raise HTTPException(status_code=400, detail="Cannot downgrade through this endpoint")
    
    return {
        "can_upgrade": True,
        "current_tier": current_tier,
        "new_tier": new_tier,
        "message": "Proceed to create order"
    }
