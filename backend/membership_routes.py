"""
Membership Routes for The Doggy Company
Handles membership purchase, management, and benefits
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import os
import razorpay
import hmac
import hashlib
import logging

# Initialize router
router = APIRouter(prefix="/api/membership", tags=["Membership"])

# Get database and logger from main app
def get_db():
    from server import db
    return db

def get_logger():
    return logging.getLogger("server")

# Razorpay client
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# Membership Plans Configuration
MEMBERSHIP_PLANS = {
    "founding_yearly": {
        "id": "founding_yearly",
        "name": "Founding Member (Yearly)",
        "price": 499,
        "original_price": 999,
        "duration_months": 12,
        "is_founding": True,
        "max_pets": 5,
        "benefits": {
            "paw_points_multiplier": 2,
            "free_shipping_threshold": 500,
            "member_discount_percent": 15,
            "priority_support": True,
            "exclusive_access": True,
            "birthday_perks": True
        }
    },
    "yearly": {
        "id": "yearly",
        "name": "Family Member (Yearly)",
        "price": 999,
        "original_price": 999,
        "duration_months": 12,
        "is_founding": False,
        "max_pets": 5,
        "benefits": {
            "paw_points_multiplier": 2,
            "free_shipping_threshold": 500,
            "member_discount_percent": 10,
            "priority_support": True,
            "exclusive_access": True,
            "birthday_perks": True
        }
    },
    "monthly": {
        "id": "monthly",
        "name": "Family Member (Monthly)",
        "price": 99,
        "original_price": 99,
        "duration_months": 1,
        "is_founding": False,
        "max_pets": 5,
        "benefits": {
            "paw_points_multiplier": 2,
            "free_shipping_threshold": 500,
            "member_discount_percent": 10,
            "priority_support": True,
            "exclusive_access": True,
            "birthday_perks": True
        }
    }
}

WELCOME_BONUS_POINTS = 100


# Pydantic Models
class MembershipPurchaseRequest(BaseModel):
    plan_id: str
    user_email: EmailStr
    user_name: str
    user_phone: str
    discount_code: Optional[str] = None


class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    membership_id: str


class DiscountCodeCreate(BaseModel):
    code: str
    type: str = "promo"  # promo, bulk, wholesale, referral
    discount_percent: Optional[float] = None
    discount_amount: Optional[float] = None
    max_uses: Optional[int] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    min_quantity: int = 1
    applies_to: List[str] = ["membership"]
    partner_name: Optional[str] = None
    notes: Optional[str] = None


# API Endpoints

@router.get("/plans")
async def get_membership_plans():
    """Get all available membership plans"""
    return {
        "plans": list(MEMBERSHIP_PLANS.values()),
        "founding_available": True,  # Can be toggled when founding period ends
        "welcome_bonus": WELCOME_BONUS_POINTS
    }



@router.get("/order/{order_id}")
async def get_order_details(order_id: str):
    """Get order details by order_id for payment page"""
    db = get_db()
    
    # Find the order - check both field names for compatibility
    order = await db.membership_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        order = await db.membership_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        order = await db.memberships.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get plan details
    plan_type = order.get("plan_type", "annual")
    is_founder = plan_type in ["annual", "founder", "foundation"]
    
    # Calculate pricing
    amount = order.get("amount", {})
    base_price = amount.get("base", 4999 if is_founder else 499)
    gst = amount.get("gst", int(base_price * 0.18))
    total = amount.get("total", base_price + gst)
    
    return {
        "order_id": order.get("order_id", order.get("id")),
        "user_id": order.get("user_id"),
        "plan_type": "founder" if is_founder else "trial",
        "plan_name": "Pet Pass Founder" if is_founder else "Pet Pass Trial",
        "duration": "372 days" if is_founder else "37 days",
        "base_price": base_price,
        "gst": gst,
        "total": total,
        "bonus_days": 7,
        "parent_name": order.get("user_name", order.get("parent_name", "")),
        "parent_email": order.get("user_email", order.get("parent_email", "")),
        "pet_name": order.get("pet_name", ""),
        "pet_breed": order.get("pet_breed", ""),
        "status": order.get("status", "pending")
    }



@router.post("/create-order")
async def create_membership_order(request: MembershipPurchaseRequest):
    """Create Razorpay order for membership purchase"""
    db = get_db()
    logger = get_logger()
    
    # Validate plan
    plan = MEMBERSHIP_PLANS.get(request.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid membership plan")
    
    # Check if user already has active membership
    existing_user = await db.users.find_one({"email": request.user_email})
    if existing_user and existing_user.get("membership", {}).get("status") == "active":
        raise HTTPException(status_code=400, detail="User already has an active membership")
    
    # Calculate price with discount code
    final_price = plan["price"]
    discount_applied = 0
    discount_code_data = None
    
    if request.discount_code:
        code = await db.discount_codes.find_one({
            "code": request.discount_code.upper(),
            "is_active": True
        })
        
        if code:
            now = datetime.now(timezone.utc)
            valid_from = code.get("valid_from")
            valid_until = code.get("valid_until")
            
            # Check validity
            is_valid = True
            if valid_from and datetime.fromisoformat(valid_from) > now:
                is_valid = False
            if valid_until and datetime.fromisoformat(valid_until) < now:
                is_valid = False
            if code.get("max_uses") and code.get("used_count", 0) >= code["max_uses"]:
                is_valid = False
            
            if is_valid:
                discount_code_data = code
                if code.get("discount_percent"):
                    discount_applied = final_price * (code["discount_percent"] / 100)
                elif code.get("discount_amount"):
                    discount_applied = code["discount_amount"]
                
                final_price = max(0, final_price - discount_applied)
    
    # Create membership record (pending)
    membership_id = f"MEM-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    membership_doc = {
        "id": membership_id,
        "user_email": request.user_email,
        "user_name": request.user_name,
        "user_phone": request.user_phone,
        "plan_id": request.plan_id,
        "plan_name": plan["name"],
        "price_original": plan["price"],
        "discount_code": request.discount_code.upper() if request.discount_code else None,
        "discount_amount": discount_applied,
        "price_paid": final_price,
        "currency": "INR",
        "status": "pending",
        "payment": {},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Create Razorpay order
    if razorpay_client and final_price > 0:
        try:
            razorpay_order = razorpay_client.order.create({
                "amount": int(final_price * 100),  # Convert to paise
                "currency": "INR",
                "receipt": membership_id,
                "notes": {
                    "membership_id": membership_id,
                    "plan": request.plan_id,
                    "user_email": request.user_email
                }
            })
            membership_doc["payment"]["razorpay_order_id"] = razorpay_order["id"]
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
            # For test mode, create mock order
            razorpay_order = {
                "id": f"order_test_{uuid.uuid4().hex[:12]}",
                "amount": int(final_price * 100),
                "currency": "INR"
            }
            membership_doc["payment"]["razorpay_order_id"] = razorpay_order["id"]
            membership_doc["payment"]["test_mode"] = True
    else:
        # Free membership (100% discount)
        razorpay_order = {"id": "free_order", "amount": 0}
        membership_doc["payment"]["free_order"] = True
    
    await db.memberships.insert_one(membership_doc)
    logger.info(f"Membership order created: {membership_id}")
    
    return {
        "success": True,
        "membership_id": membership_id,
        "order": {
            "id": razorpay_order["id"],
            "amount": razorpay_order.get("amount", 0),
            "currency": "INR"
        },
        "plan": plan,
        "discount_applied": discount_applied,
        "final_price": final_price,
        "razorpay_key": RAZORPAY_KEY_ID
    }


class PaymentCreateRequest(BaseModel):
    order_id: str
    user_id: str
    amount: float
    plan_type: str


@router.post("/payment/create")
async def create_payment(request: PaymentCreateRequest):
    """Create Razorpay payment order from existing membership order"""
    db = get_db()
    logger = get_logger()
    
    # Find the existing membership order - check both collections and field names for compatibility
    membership = await db.membership_orders.find_one({"order_id": request.order_id})
    if not membership:
        membership = await db.membership_orders.find_one({"id": request.order_id})
    if not membership:
        # Fallback to memberships collection for backward compatibility
        membership = await db.memberships.find_one({"id": request.order_id})
    if not membership:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Calculate amount in paise
    amount_paise = int(request.amount * 100)
    
    # Create Razorpay order
    if razorpay_client and amount_paise > 0:
        try:
            razorpay_order = razorpay_client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": request.order_id,
                "notes": {
                    "order_id": request.order_id,
                    "user_id": request.user_id,
                    "plan_type": request.plan_type
                }
            })
            
            # Update membership order with razorpay order id
            await db.membership_orders.update_one(
                {"order_id": request.order_id},
                {"$set": {
                    "payment.razorpay_order_id": razorpay_order["id"],
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            logger.info(f"Razorpay order created: {razorpay_order['id']} for membership {request.order_id}")
            
            return {
                "success": True,
                "razorpay_order_id": razorpay_order["id"],
                "amount": amount_paise,
                "currency": "INR",
                "razorpay_key": RAZORPAY_KEY_ID
            }
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
            # Return test mode order
            test_order_id = f"order_test_{uuid.uuid4().hex[:12]}"
            return {
                "success": True,
                "razorpay_order_id": test_order_id,
                "amount": amount_paise,
                "currency": "INR",
                "razorpay_key": RAZORPAY_KEY_ID,
                "test_mode": True
            }
    else:
        # Free order or no Razorpay client
        return {
            "success": True,
            "razorpay_order_id": f"free_order_{uuid.uuid4().hex[:8]}",
            "amount": 0,
            "currency": "INR",
            "free_order": True
        }


class PaymentVerifyRequestAlt(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str
    user_id: Optional[str] = None


@router.post("/payment/verify")
async def verify_payment_alt(request: PaymentVerifyRequestAlt):
    """Verify Razorpay payment and activate membership - captures ALL payment details"""
    db = get_db()
    logger = get_logger()
    
    # Get membership record by order_id - check both collections and field names
    membership = await db.membership_orders.find_one({"order_id": request.order_id})
    if not membership:
        membership = await db.membership_orders.find_one({"id": request.order_id})
    if not membership:
        # Fallback to memberships collection for backward compatibility
        membership = await db.memberships.find_one({"id": request.order_id})
    if not membership:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if membership.get("status") == "active":
        return {"success": True, "message": "Membership already active", "order_id": request.order_id}
    
    # Verify signature (skip in test mode or with test keys)
    is_test_mode = membership.get("payment", {}).get("test_mode", False) or request.razorpay_order_id.startswith("order_test_")
    
    razorpay_payment_details = None
    if not is_test_mode and razorpay_client:
        try:
            razorpay_client.utility.verify_payment_signature({
                "razorpay_order_id": request.razorpay_order_id,
                "razorpay_payment_id": request.razorpay_payment_id,
                "razorpay_signature": request.razorpay_signature
            })
            # Fetch full payment details from Razorpay
            try:
                razorpay_payment_details = razorpay_client.payment.fetch(request.razorpay_payment_id)
            except Exception as fetch_err:
                logger.warning(f"Could not fetch Razorpay payment details: {fetch_err}")
        except Exception as e:
            logger.error(f"Payment verification failed: {e}")
            # In test mode keys, allow through
            if "rzp_test" not in RAZORPAY_KEY_ID:
                raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Calculate expiry based on plan
    plan_id = membership.get("plan_id", membership.get("plan_type", "yearly"))
    plan = MEMBERSHIP_PLANS.get(plan_id)
    duration_months = plan["duration_months"] if plan else 12
    bonus_days = 7  # 7 bonus days
    started_at = datetime.now(timezone.utc)
    expires_at = started_at + timedelta(days=(duration_months * 30) + bonus_days)
    
    # Calculate GST breakdown (CGST 9% + SGST 9%)
    amount_info = membership.get("amount", {})
    total_amount = amount_info.get("total", 0)
    gst_amount = amount_info.get("gst", 0)
    cgst = gst_amount // 2
    sgst = gst_amount - cgst
    
    # Comprehensive payment record - like Emergent does
    payment_record = {
        "razorpay_order_id": request.razorpay_order_id,
        "razorpay_payment_id": request.razorpay_payment_id,
        "razorpay_signature": request.razorpay_signature,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "payment_method": razorpay_payment_details.get("method") if razorpay_payment_details else "test_mode",
        "bank": razorpay_payment_details.get("bank") if razorpay_payment_details else None,
        "wallet": razorpay_payment_details.get("wallet") if razorpay_payment_details else None,
        "vpa": razorpay_payment_details.get("vpa") if razorpay_payment_details else None,  # UPI ID
        "card_last4": razorpay_payment_details.get("card", {}).get("last4") if razorpay_payment_details else None,
        "card_network": razorpay_payment_details.get("card", {}).get("network") if razorpay_payment_details else None,
        "amount_captured": razorpay_payment_details.get("amount") / 100 if razorpay_payment_details else total_amount,
        "currency": "INR",
        "status": "captured",
        "test_mode": is_test_mode
    }
    
    # Update membership order status with ALL payment details
    await db.membership_orders.update_one(
        {"order_id": request.order_id},
        {"$set": {
            "status": "active",
            "started_at": started_at.isoformat(),
            "expires_at": expires_at.isoformat(),
            "payment": payment_record,
            "amount.cgst": cgst,
            "amount.sgst": sgst,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Also update the USER account with membership details
    user_id = membership.get("user_id")
    user_email = membership.get("user_email")
    
    membership_data = {
        "status": "active",
        "plan": plan_id,
        "plan_name": plan["name"] if plan else "Pet Pass",
        "order_id": request.order_id,
        "started_at": started_at.isoformat(),
        "expires_at": expires_at.isoformat(),
        "amount_paid": total_amount,
        "payment_id": request.razorpay_payment_id,
        "benefits": plan["benefits"] if plan else {}
    }
    
    # Update user by either user_id or email
    user_query = {"id": user_id} if user_id else {"email": user_email}
    await db.users.update_one(
        user_query,
        {"$set": {
            "membership": membership_data,
            "membership_tier": "premium" if "yearly" in plan_id or "founder" in plan_id else "standard",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update pet records with membership info
    pet_ids = membership.get("pet_ids", [])
    if pet_ids:
        await db.pets.update_many(
            {"id": {"$in": pet_ids}},
            {"$set": {
                "membership_status": "active",
                "membership_order_id": request.order_id,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    logger.info(f"Payment verified for order: {request.order_id}, user: {user_email}, amount: ₹{total_amount}")
    
    return {
        "success": True,
        "message": "Payment verified and membership activated!",
        "order_id": request.order_id,
        "user_id": user_id,
        "expires_at": expires_at.isoformat(),
        "amount_paid": total_amount,
        "payment_method": payment_record.get("payment_method")
    }



@router.post("/verify-payment")
async def verify_payment(request: PaymentVerifyRequest):
    """Verify Razorpay payment and activate membership"""
    db = get_db()
    logger = get_logger()
    
    # Get membership record
    membership = await db.memberships.find_one({"id": request.membership_id})
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    if membership["status"] == "active":
        return {"success": True, "message": "Membership already active", "membership_id": request.membership_id}
    
    # Verify signature (skip in test mode)
    is_test_mode = membership.get("payment", {}).get("test_mode", False)
    
    if not is_test_mode and razorpay_client:
        try:
            razorpay_client.utility.verify_payment_signature({
                "razorpay_order_id": request.razorpay_order_id,
                "razorpay_payment_id": request.razorpay_payment_id,
                "razorpay_signature": request.razorpay_signature
            })
        except Exception as e:
            logger.error(f"Payment verification failed: {e}")
            # In test mode, allow through
            if "rzp_test" not in RAZORPAY_KEY_ID:
                raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Calculate expiry
    plan = MEMBERSHIP_PLANS.get(membership["plan_id"])
    duration_months = plan["duration_months"] if plan else 12
    started_at = datetime.now(timezone.utc)
    expires_at = started_at + timedelta(days=duration_months * 30)
    
    # Update membership status
    await db.memberships.update_one(
        {"id": request.membership_id},
        {"$set": {
            "status": "active",
            "started_at": started_at.isoformat(),
            "expires_at": expires_at.isoformat(),
            "payment.razorpay_payment_id": request.razorpay_payment_id,
            "payment.razorpay_signature": request.razorpay_signature,
            "payment.verified_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update or create user with membership
    user = await db.users.find_one({"email": membership["user_email"]})
    
    membership_data = {
        "status": "active",
        "plan": membership["plan_id"],
        "membership_id": request.membership_id,
        "started_at": started_at.isoformat(),
        "expires_at": expires_at.isoformat(),
        "benefits": plan["benefits"] if plan else {}
    }
    
    if user:
        # Update existing user
        await db.users.update_one(
            {"email": membership["user_email"]},
            {"$set": {
                "membership": membership_data,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        user_id = user.get("id")
    else:
        # Create new user
        user_id = f"user-{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "id": user_id,
            "name": membership["user_name"],
            "email": membership["user_email"],
            "phone": membership["user_phone"],
            "role": "customer",
            "membership": membership_data,
            "paw_points": {
                "balance": 0,
                "lifetime_earned": 0,
                "lifetime_redeemed": 0
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Award welcome bonus points
    await db.users.update_one(
        {"email": membership["user_email"]},
        {"$inc": {
            "paw_points.balance": WELCOME_BONUS_POINTS,
            "paw_points.lifetime_earned": WELCOME_BONUS_POINTS
        }}
    )
    
    # Log points transaction
    await db.paw_transactions.insert_one({
        "id": f"paw-{uuid.uuid4().hex[:8]}",
        "user_email": membership["user_email"],
        "type": "earn",
        "points": WELCOME_BONUS_POINTS,
        "source": {
            "type": "membership_welcome",
            "reference_id": request.membership_id,
            "description": "Welcome bonus for new member"
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update discount code usage if applicable
    if membership.get("discount_code"):
        await db.discount_codes.update_one(
            {"code": membership["discount_code"]},
            {"$inc": {"used_count": 1}}
        )
    
    # Create service desk ticket for onboarding
    ticket_id = f"TKT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    await db.tickets.insert_one({
        "ticket_id": ticket_id,
        "source": "membership",
        "pillar": "membership",
        "category": "new_member_onboarding",
        "subject": f"New Member: {membership['user_name']} - {plan['name'] if plan else 'Membership'}",
        "customer": {
            "user_id": user_id,
            "name": membership["user_name"],
            "email": membership["user_email"],
            "phone": membership["user_phone"],
            "is_member": True
        },
        "priority": "medium",
        "status": "open",
        "reference": {
            "type": "membership",
            "id": request.membership_id
        },
        "timeline": [
            {"status": "created", "at": datetime.now(timezone.utc).isoformat(), "note": "New membership activated"}
        ],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    
    logger.info(f"Membership activated: {request.membership_id} for {membership['user_email']}")
    
    # Auto-create ticket for Command Center
    try:
        from ticket_auto_creation import on_membership_event
        await on_membership_event("purchased", user, {
            "id": request.membership_id,
            "plan_name": membership.get("plan", {}).get("name"),
            "amount": membership.get("amount"),
            "expires_at": expires_at.isoformat()
        })
    except Exception as e:
        logger.error(f"Auto-ticket for membership failed: {e}")
    
    return {
        "success": True,
        "message": "Membership activated successfully!",
        "membership_id": request.membership_id,
        "welcome_bonus": WELCOME_BONUS_POINTS,
        "expires_at": expires_at.isoformat(),
        "next_step": "pet_soul_creation"
    }


@router.get("/status")
async def get_membership_status(email: str):
    """Get user's membership status"""
    db = get_db()
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return {"has_membership": False, "status": "none"}
    
    membership = user.get("membership", {})
    
    # Check if expired
    if membership.get("status") == "active" and membership.get("expires_at"):
        expires_at = datetime.fromisoformat(membership["expires_at"].replace('Z', '+00:00'))
        if expires_at < datetime.now(timezone.utc):
            # Update status to expired
            await db.users.update_one(
                {"email": email},
                {"$set": {"membership.status": "expired"}}
            )
            membership["status"] = "expired"
    
    return {
        "has_membership": membership.get("status") == "active",
        "status": membership.get("status", "none"),
        "plan": membership.get("plan"),
        "started_at": membership.get("started_at"),
        "expires_at": membership.get("expires_at"),
        "benefits": membership.get("benefits", {}),
        "paw_points": user.get("paw_points", {})
    }


@router.post("/validate-code")
async def validate_discount_code(code: str):
    """Validate a discount code for membership purchase"""
    db = get_db()
    
    discount = await db.discount_codes.find_one({
        "code": code.upper(),
        "is_active": True
    }, {"_id": 0})
    
    if not discount:
        return {"valid": False, "message": "Invalid discount code"}
    
    now = datetime.now(timezone.utc)
    
    # Check validity period
    if discount.get("valid_from"):
        valid_from = datetime.fromisoformat(discount["valid_from"])
        if valid_from > now:
            return {"valid": False, "message": "Code not yet active"}
    
    if discount.get("valid_until"):
        valid_until = datetime.fromisoformat(discount["valid_until"])
        if valid_until < now:
            return {"valid": False, "message": "Code has expired"}
    
    # Check usage limit
    if discount.get("max_uses") and discount.get("used_count", 0) >= discount["max_uses"]:
        return {"valid": False, "message": "Code usage limit reached"}
    
    return {
        "valid": True,
        "code": discount["code"],
        "discount_percent": discount.get("discount_percent"),
        "discount_amount": discount.get("discount_amount"),
        "message": f"Code applied! {'Save ' + str(discount.get('discount_percent', '')) + '%' if discount.get('discount_percent') else 'Save ₹' + str(discount.get('discount_amount', ''))}"
    }


# Admin endpoints

@router.get("/admin/members")
async def get_all_members(
    status: Optional[str] = None,
    plan: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get all members (admin)"""
    db = get_db()
    
    query = {"membership.status": {"$exists": True, "$ne": "none"}}
    if status:
        query["membership.status"] = status
    if plan:
        query["membership.plan"] = plan
    
    members = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.users.count_documents(query)
    
    # Get stats
    active_count = await db.users.count_documents({"membership.status": "active"})
    expired_count = await db.users.count_documents({"membership.status": "expired"})
    
    return {
        "members": members,
        "total": total,
        "stats": {
            "active": active_count,
            "expired": expired_count
        }
    }


@router.get("/admin/discount-codes")
async def get_discount_codes():
    """Get all discount codes (admin)"""
    db = get_db()
    
    codes = await db.discount_codes.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"codes": codes, "total": len(codes)}


@router.post("/admin/discount-codes")
async def create_discount_code(code_data: DiscountCodeCreate):
    """Create a new discount code (admin)"""
    db = get_db()
    logger = get_logger()
    
    # Check if code already exists
    existing = await db.discount_codes.find_one({"code": code_data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Code already exists")
    
    code_doc = {
        "id": f"code-{uuid.uuid4().hex[:8]}",
        "code": code_data.code.upper(),
        "type": code_data.type,
        "discount_percent": code_data.discount_percent,
        "discount_amount": code_data.discount_amount,
        "max_uses": code_data.max_uses,
        "used_count": 0,
        "valid_from": code_data.valid_from,
        "valid_until": code_data.valid_until,
        "min_quantity": code_data.min_quantity,
        "applies_to": code_data.applies_to,
        "partner_name": code_data.partner_name,
        "notes": code_data.notes,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.discount_codes.insert_one(code_doc)
    logger.info(f"Discount code created: {code_data.code}")
    
    return {"success": True, "code": {k: v for k, v in code_doc.items() if k != "_id"}}


@router.put("/admin/discount-codes/{code_id}")
async def update_discount_code(code_id: str, updates: Dict[str, Any]):
    """Update a discount code (admin)"""
    db = get_db()
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.discount_codes.update_one(
        {"id": code_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Code not found")
    
    return {"success": True, "message": "Code updated"}


@router.delete("/admin/discount-codes/{code_id}")
async def delete_discount_code(code_id: str):
    """Delete a discount code (admin)"""
    db = get_db()
    
    result = await db.discount_codes.delete_one({"id": code_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Code not found")
    
    return {"success": True, "message": "Code deleted"}


@router.get("/admin/stats")
async def get_membership_stats():
    """Get membership statistics (admin)"""
    db = get_db()
    
    # Active members
    active_members = await db.users.count_documents({"membership.status": "active"})
    
    # By plan
    plan_stats = {}
    for plan_id in MEMBERSHIP_PLANS.keys():
        count = await db.users.count_documents({"membership.plan": plan_id, "membership.status": "active"})
        plan_stats[plan_id] = count
    
    # Revenue (from memberships collection)
    pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": None, "total": {"$sum": "$price_paid"}}}
    ]
    revenue_result = await db.memberships.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # This month's new members
    start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_this_month = await db.memberships.count_documents({
        "status": "active",
        "started_at": {"$gte": start_of_month.isoformat()}
    })
    
    # Expiring soon (next 30 days)
    expiry_threshold = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    expiring_soon = await db.users.count_documents({
        "membership.status": "active",
        "membership.expires_at": {"$lte": expiry_threshold}
    })
    
    return {
        "active_members": active_members,
        "by_plan": plan_stats,
        "total_revenue": total_revenue,
        "new_this_month": new_this_month,
        "expiring_soon": expiring_soon
    }
