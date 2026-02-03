"""
Quote Builder Service for The Doggy Company
============================================
Enables concierge team to create custom quotes from party requests,
add products/services, and send payment links to members.

Flow:
1. Party request comes in → Service Desk Ticket created
2. Concierge opens Quote Builder
3. Adds products/services to quote
4. Sends quote to member
5. Member reviews and pays via Razorpay link
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timezone
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/quotes", tags=["quotes"])

db = None
_verify_admin_func = None
RAZORPAY_KEY_ID = None

def set_quote_db(database):
    global db
    db = database

def set_quote_deps(admin_verify_func, razorpay_key=None):
    global _verify_admin_func, RAZORPAY_KEY_ID
    _verify_admin_func = admin_verify_func
    RAZORPAY_KEY_ID = razorpay_key

def get_utc_timestamp():
    return datetime.now(timezone.utc).isoformat()

def get_admin_username():
    """Dependency to get admin username from the verify_admin function"""
    if _verify_admin_func is None:
        raise HTTPException(status_code=500, detail="Admin verification not configured")
    return _verify_admin_func


# ==================== MODELS ====================

class QuoteItemModel(BaseModel):
    item_id: str
    item_type: str  # 'product' or 'service'
    name: str
    description: Optional[str] = None
    quantity: int = 1
    unit_price: float
    image: Optional[str] = None

class CreateQuoteModel(BaseModel):
    party_request_id: str
    ticket_id: str
    member_email: str
    member_name: Optional[str] = None
    items: List[QuoteItemModel]
    notes: Optional[str] = None
    discount_percent: float = 0
    validity_days: int = 7

class UpdateQuoteModel(BaseModel):
    items: Optional[List[QuoteItemModel]] = None
    notes: Optional[str] = None
    discount_percent: Optional[float] = None
    status: Optional[str] = None

class SendQuoteModel(BaseModel):
    quote_id: str
    message: Optional[str] = None


# ==================== ENDPOINTS ====================

@router.post("/create")
async def create_quote(request: CreateQuoteModel, username: str = Depends(get_admin_username)):
    """Create a new quote for a party request"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    quote_id = f"QT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"
    timestamp = get_utc_timestamp()
    
    # Calculate totals
    subtotal = sum(item.unit_price * item.quantity for item in request.items)
    discount_amount = subtotal * (request.discount_percent / 100)
    total = subtotal - discount_amount
    
    # Create quote document
    quote = {
        "id": quote_id,
        "party_request_id": request.party_request_id,
        "ticket_id": request.ticket_id,
        "member": {
            "email": request.member_email,
            "name": request.member_name
        },
        "items": [item.dict() for item in request.items],
        "pricing": {
            "subtotal": round(subtotal, 2),
            "discount_percent": request.discount_percent,
            "discount_amount": round(discount_amount, 2),
            "total": round(total, 2),
            "currency": "INR"
        },
        "notes": request.notes,
        "validity_days": request.validity_days,
        "expires_at": None,  # Set when sent
        "status": "draft",  # draft → sent → viewed → accepted → paid → completed
        "payment": {
            "status": "pending",
            "payment_link": None,
            "razorpay_order_id": None,
            "paid_at": None
        },
        "created_by": username,
        "created_at": timestamp,
        "updated_at": timestamp,
        "sent_at": None
    }
    
    await db.quotes.insert_one(quote)
    
    # Update party request status
    await db.party_requests.update_one(
        {"id": request.party_request_id},
        {"$set": {"status": "quote_created", "quote_id": quote_id, "updated_at": timestamp}}
    )
    
    # Update ticket
    await db.service_desk_tickets.update_one(
        {"ticket_id": request.ticket_id},
        {"$set": {"quote_id": quote_id, "status": "in_progress", "updated_at": timestamp}}
    )
    
    logger.info(f"✨ Quote {quote_id} created for party request {request.party_request_id}")
    
    return {
        "success": True,
        "quote_id": quote_id,
        "total": round(total, 2),
        "message": f"Quote created! Total: ₹{total:,.2f}"
    }


@router.get("/{quote_id}")
async def get_quote(quote_id: str):
    """Get quote details - accessible by member via link"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Mark as viewed if first time
    if quote.get("status") == "sent":
        await db.quotes.update_one(
            {"id": quote_id},
            {"$set": {"status": "viewed", "viewed_at": get_utc_timestamp()}}
        )
        quote["status"] = "viewed"
    
    return quote


@router.put("/{quote_id}")
async def update_quote(quote_id: str, request: UpdateQuoteModel, username: str = Depends(lambda: verify_admin)):
    """Update a quote (admin only)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    quote = await db.quotes.find_one({"id": quote_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    update_data = {"updated_at": get_utc_timestamp()}
    
    if request.items is not None:
        items = [item.dict() for item in request.items]
        subtotal = sum(item["unit_price"] * item["quantity"] for item in items)
        discount_percent = request.discount_percent if request.discount_percent is not None else quote["pricing"]["discount_percent"]
        discount_amount = subtotal * (discount_percent / 100)
        total = subtotal - discount_amount
        
        update_data["items"] = items
        update_data["pricing"] = {
            "subtotal": round(subtotal, 2),
            "discount_percent": discount_percent,
            "discount_amount": round(discount_amount, 2),
            "total": round(total, 2),
            "currency": "INR"
        }
    
    if request.notes is not None:
        update_data["notes"] = request.notes
    
    if request.status is not None:
        update_data["status"] = request.status
    
    await db.quotes.update_one({"id": quote_id}, {"$set": update_data})
    
    return {"success": True, "message": "Quote updated"}


@router.post("/{quote_id}/send")
async def send_quote(quote_id: str, request: SendQuoteModel = None, username: str = Depends(lambda: verify_admin)):
    """Send quote to member with payment link"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    quote = await db.quotes.find_one({"id": quote_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    timestamp = get_utc_timestamp()
    
    # Calculate expiry
    validity_days = quote.get("validity_days", 7)
    expires_at = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59)
    from datetime import timedelta
    expires_at = (expires_at + timedelta(days=validity_days)).isoformat()
    
    # Generate payment link (simple link for now, Razorpay integration can be added)
    payment_token = secrets.token_urlsafe(32)
    payment_link = f"/pay/quote/{quote_id}?token={payment_token}"
    
    # Update quote
    await db.quotes.update_one(
        {"id": quote_id},
        {"$set": {
            "status": "sent",
            "sent_at": timestamp,
            "expires_at": expires_at,
            "payment.payment_link": payment_link,
            "payment.token": payment_token,
            "updated_at": timestamp
        }}
    )
    
    # Create member notification
    member_email = quote["member"]["email"]
    member_name = quote["member"].get("name", "Pet Parent")
    total = quote["pricing"]["total"]
    
    notification = {
        "id": f"MNOTIF-{secrets.token_hex(4).upper()}",
        "user_email": member_email,
        "type": "quote_received",
        "title": f"🎉 Your Party Quote is Ready!",
        "message": f"We've prepared a custom party plan for you! Total: ₹{total:,.2f}. Click to review and pay.",
        "quote_id": quote_id,
        "payment_link": payment_link,
        "read": False,
        "created_at": timestamp
    }
    await db.member_notifications.insert_one(notification)
    
    # Update party request
    await db.party_requests.update_one(
        {"id": quote["party_request_id"]},
        {"$set": {"status": "quote_sent", "updated_at": timestamp}}
    )
    
    logger.info(f"📨 Quote {quote_id} sent to {member_email}")
    
    return {
        "success": True,
        "message": f"Quote sent to {member_email}!",
        "payment_link": payment_link
    }


@router.post("/{quote_id}/accept")
async def accept_quote(quote_id: str, token: str):
    """Member accepts quote - initiates payment"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    quote = await db.quotes.find_one({"id": quote_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Verify token
    if quote.get("payment", {}).get("token") != token:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Check expiry
    expires_at = quote.get("expires_at")
    if expires_at and datetime.fromisoformat(expires_at.replace('Z', '+00:00')) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Quote has expired")
    
    timestamp = get_utc_timestamp()
    
    await db.quotes.update_one(
        {"id": quote_id},
        {"$set": {"status": "accepted", "accepted_at": timestamp, "updated_at": timestamp}}
    )
    
    # Update party request
    await db.party_requests.update_one(
        {"id": quote["party_request_id"]},
        {"$set": {"status": "quote_accepted", "updated_at": timestamp}}
    )
    
    return {
        "success": True,
        "message": "Quote accepted! Proceed to payment.",
        "total": quote["pricing"]["total"],
        "razorpay_key": RAZORPAY_KEY_ID
    }


@router.post("/{quote_id}/mark-paid")
async def mark_quote_paid(
    quote_id: str,
    payment_id: Optional[str] = None,
    username: str = Depends(lambda: verify_admin)
):
    """Admin marks quote as paid (after verifying payment)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    quote = await db.quotes.find_one({"id": quote_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    timestamp = get_utc_timestamp()
    
    await db.quotes.update_one(
        {"id": quote_id},
        {"$set": {
            "status": "paid",
            "payment.status": "completed",
            "payment.paid_at": timestamp,
            "payment.payment_id": payment_id,
            "updated_at": timestamp
        }}
    )
    
    # Update party request
    await db.party_requests.update_one(
        {"id": quote["party_request_id"]},
        {"$set": {"status": "paid", "updated_at": timestamp}}
    )
    
    # Update ticket
    await db.service_desk_tickets.update_one(
        {"ticket_id": quote["ticket_id"]},
        {"$set": {"status": "resolved", "updated_at": timestamp}}
    )
    
    # Notify member
    notification = {
        "id": f"MNOTIF-{secrets.token_hex(4).upper()}",
        "user_email": quote["member"]["email"],
        "type": "payment_confirmed",
        "title": f"✅ Payment Confirmed!",
        "message": f"Thank you! Your party order has been confirmed. We'll start preparing everything!",
        "quote_id": quote_id,
        "read": False,
        "created_at": timestamp
    }
    await db.member_notifications.insert_one(notification)
    
    logger.info(f"💰 Quote {quote_id} marked as paid")
    
    return {"success": True, "message": "Payment confirmed!"}


@router.get("/party-request/{party_request_id}")
async def get_quotes_for_party_request(party_request_id: str):
    """Get all quotes for a party request"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    quotes = await db.quotes.find(
        {"party_request_id": party_request_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    
    return {"quotes": quotes}


@router.get("/admin/all")
async def get_all_quotes(
    status: Optional[str] = None,
    limit: int = 50,
    username: str = Depends(lambda: verify_admin)
):
    """Get all quotes (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {}
    if status:
        query["status"] = status
    
    quotes = await db.quotes.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Get stats
    stats = {
        "total": await db.quotes.count_documents({}),
        "draft": await db.quotes.count_documents({"status": "draft"}),
        "sent": await db.quotes.count_documents({"status": "sent"}),
        "accepted": await db.quotes.count_documents({"status": "accepted"}),
        "paid": await db.quotes.count_documents({"status": "paid"})
    }
    
    return {"quotes": quotes, "stats": stats}
