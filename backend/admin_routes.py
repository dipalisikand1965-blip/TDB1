"""
Admin Routes for The Doggy Company
- Draft Orders
- Fulfilment Management
- Reports & Analytics
- Secure admin authentication with rate limiting
"""

import os
import json
import base64
import asyncio
import urllib.parse
import urllib.request
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from collections import defaultdict
import threading
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClient
from bson import ObjectId
from bson.json_util import dumps as bson_dumps, loads as bson_loads
import resend

logger = logging.getLogger(__name__)

# Initialize Resend
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Security
security = HTTPBasic()
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")

# Rate limiting for admin login (brute force protection)
from collections import defaultdict
from datetime import datetime, timedelta
import threading

class AdminRateLimiter:
    def __init__(self, max_attempts=5, lockout_minutes=15):
        self.max_attempts = max_attempts
        self.lockout_minutes = lockout_minutes
        self.failed_attempts = defaultdict(list)  # IP -> list of timestamps
        self.locked_ips = {}  # IP -> lockout end time
        self._lock = threading.Lock()
    
    def is_locked(self, ip: str) -> bool:
        with self._lock:
            if ip in self.locked_ips:
                if datetime.now() < self.locked_ips[ip]:
                    return True
                else:
                    del self.locked_ips[ip]
            return False
    
    def record_failure(self, ip: str):
        with self._lock:
            now = datetime.now()
            # Clean old attempts (older than lockout period)
            self.failed_attempts[ip] = [
                t for t in self.failed_attempts[ip] 
                if now - t < timedelta(minutes=self.lockout_minutes)
            ]
            self.failed_attempts[ip].append(now)
            
            # Lock if too many attempts
            if len(self.failed_attempts[ip]) >= self.max_attempts:
                self.locked_ips[ip] = now + timedelta(minutes=self.lockout_minutes)
                self.failed_attempts[ip] = []
                return True
            return False
    
    def record_success(self, ip: str):
        with self._lock:
            self.failed_attempts[ip] = []
            if ip in self.locked_ips:
                del self.locked_ips[ip]
    
    def get_remaining_attempts(self, ip: str) -> int:
        with self._lock:
            return self.max_attempts - len(self.failed_attempts.get(ip, []))

admin_rate_limiter = AdminRateLimiter(max_attempts=5, lockout_minutes=15)

def verify_admin(credentials: HTTPBasicCredentials = Depends(security), request: Request = None):
    # Get client IP
    client_ip = "unknown"
    if request:
        client_ip = request.client.host if request.client else "unknown"
        # Check for forwarded IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
    
    # Check if IP is locked
    if admin_rate_limiter.is_locked(client_ip):
        raise HTTPException(
            status_code=429, 
            detail="Too many failed attempts. Please try again in 15 minutes."
        )
    
    # Verify credentials
    if credentials.username != ADMIN_USERNAME or credentials.password != ADMIN_PASSWORD:
        # Record failed attempt
        is_now_locked = admin_rate_limiter.record_failure(client_ip)
        remaining = admin_rate_limiter.get_remaining_attempts(client_ip)
        
        if is_now_locked:
            raise HTTPException(
                status_code=429, 
                detail="Account locked due to too many failed attempts. Try again in 15 minutes."
            )
        raise HTTPException(
            status_code=401, 
            detail=f"Invalid credentials. {remaining} attempts remaining."
        )
    
    # Success - clear any failed attempts
    admin_rate_limiter.record_success(client_ip)
    return credentials.username

# Create router
fulfilment_router = APIRouter(prefix="/api/admin", tags=["Admin Fulfilment"])

# Database reference (will be set from server.py)
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== MODELS ====================

class DraftOrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int = 1
    variant: Optional[str] = None
    image: Optional[str] = None
    is_autoship: bool = False
    autoship_frequency: Optional[str] = None

class DraftOrderCustomer(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    city: str
    address: Optional[str] = None
    pincode: Optional[str] = None

class DraftOrderPet(BaseModel):
    name: str
    breed: Optional[str] = None
    age: Optional[str] = None

class CreateDraftOrder(BaseModel):
    customer: DraftOrderCustomer
    pet: Optional[DraftOrderPet] = None
    items: List[DraftOrderItem]
    delivery_date: Optional[str] = None
    delivery_slot: Optional[str] = None
    delivery_type: str = "delivery"  # delivery or pickup
    special_instructions: Optional[str] = None
    concierge_notes: Optional[str] = None
    source: str = "phone"  # phone, whatsapp, custom, corporate

class UpdateOrderStatus(BaseModel):
    status: str
    notes: Optional[str] = None
    send_notification: bool = True


class FullDbSyncRequest(BaseModel):
    confirmation: str = Field(..., min_length=1)
    source_url: Optional[str] = None


CRITICAL_SYNC_COLLECTIONS = [
    'products_master',
    'services_master',
    'care_bundles',
    'breed_products',
    'mira_product_scores',
    'pets',
    'users',
    'service_desk_tickets',
    'live_conversation_threads',
    'unified_inbox',
    'mira_memories',
    'admin_notifications',
    'membership_orders',
    'orders',
]


async def _get_production_db():
    prod_url = os.environ.get('PRODUCTION_MONGO_URL')
    if not prod_url:
        raise HTTPException(status_code=400, detail='PRODUCTION_MONGO_URL not configured')
    client = AsyncIOMotorClient(
        prod_url,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=60000,
        retryWrites=True,
    )
    prod_db = client[os.environ.get('DB_NAME')]
    return client, prod_db


def _admin_basic_auth_header():
    raw = f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()
    return {"Authorization": f"Basic {base64.b64encode(raw).decode()}"}


async def _fetch_preview_sync_json(source_url: str, path: str):
    url = f"{source_url.rstrip('/')}{path}"

    def _do_request():
        req = urllib.request.Request(url, headers=_admin_basic_auth_header())
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw = resp.read().decode()
            # Use bson_loads to reconstruct ObjectId, datetime, etc. from Extended JSON
            return bson_loads(raw)

    return await asyncio.to_thread(_do_request)


def _make_json_safe(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, dict):
        return {k: _make_json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_make_json_safe(v) for v in value]
    return value


@fulfilment_router.get('/full-db-sync-export-meta')
async def full_db_sync_export_meta(username: str = Depends(verify_admin)):
    if db is None:
        raise HTTPException(status_code=500, detail='Database not configured')
    cols = [c for c in await db.list_collection_names() if not c.startswith('system.')]
    counts = []
    for col in sorted(cols):
        counts.append({
            'collection': col,
            'count': await db[col].count_documents({})
        })
    return {'ok': True, 'db': os.environ.get('DB_NAME'), 'collections': counts}


@fulfilment_router.get('/full-db-sync-export')
async def full_db_sync_export(collection: str, username: str = Depends(verify_admin)):
    if db is None:
        raise HTTPException(status_code=500, detail='Database not configured')
    if collection.startswith('system.'):
        raise HTTPException(status_code=400, detail='System collections not allowed')
    raw_docs = await db[collection].find({}).to_list(None)
    # Use bson_dumps to preserve ObjectId, datetime, etc. as MongoDB Extended JSON
    from fastapi.responses import Response
    payload = bson_dumps({'ok': True, 'collection': collection, 'count': len(raw_docs), 'docs': raw_docs})
    return Response(content=payload, media_type='application/json')


@fulfilment_router.get('/full-db-sync-diff')
async def full_db_sync_diff(source_url: Optional[str] = None, username: str = Depends(verify_admin)):
    if db is None:
        raise HTTPException(status_code=500, detail='Database not configured')

    # If called from live site, compare current production DB against preview export over HTTPS.
    if source_url:
        meta = await _fetch_preview_sync_json(source_url, '/api/admin/full-db-sync-export-meta')
        preview_counts = {row['collection']: row['count'] for row in meta.get('collections', [])}
        prod_cols = [c for c in await db.list_collection_names() if not c.startswith('system.')]
        all_cols = sorted(set(prod_cols) | set(preview_counts.keys()))
        comparisons = []
        for col in all_cols:
            prod_count = await db[col].count_documents({}) if col in prod_cols else 0
            preview_count = preview_counts.get(col, 0)
            comparisons.append({
                'collection': col,
                'preview': preview_count,
                'production': prod_count,
                'diff': preview_count - prod_count,
            })
        critical = [c for c in comparisons if c['collection'] in CRITICAL_SYNC_COLLECTIONS]
        return {
            'ok': True,
            'critical': critical,
            'all_collections': comparisons,
            'preview_db': meta.get('db', 'preview-source'),
            'production_db': os.environ.get('DB_NAME'),
            'total_collections': len(comparisons),
            'source_url': source_url,
        }

    prod_client, prod_db = await _get_production_db()
    try:
        local_cols = [c for c in await db.list_collection_names() if not c.startswith('system.')]
        prod_cols = [c for c in await prod_db.list_collection_names() if not c.startswith('system.')]
        all_cols = sorted(set(local_cols) | set(prod_cols))
        comparisons = []

        for col in all_cols:
            local_count = await db[col].count_documents({}) if col in local_cols else 0
            prod_count = await prod_db[col].count_documents({}) if col in prod_cols else 0
            comparisons.append({
                'collection': col,
                'preview': local_count,
                'production': prod_count,
                'diff': local_count - prod_count,
            })

        critical = [c for c in comparisons if c['collection'] in CRITICAL_SYNC_COLLECTIONS]
        return {
            'ok': True,
            'critical': critical,
            'all_collections': comparisons,
            'preview_db': os.environ.get('DB_NAME'),
            'production_db': os.environ.get('DB_NAME'),
            'total_collections': len(comparisons),
        }
    finally:
        prod_client.close()


@fulfilment_router.post('/full-db-sync-to-production')
async def full_db_sync_to_production(payload: FullDbSyncRequest, username: str = Depends(verify_admin)):
    if payload.confirmation != 'MIGRATE':
        raise HTTPException(status_code=400, detail='Type MIGRATE to proceed')
    if db is None:
        raise HTTPException(status_code=500, detail='Database not configured')

    # If source_url provided, sync preview export into current production DB.
    if payload.source_url:
        meta = await _fetch_preview_sync_json(payload.source_url, '/api/admin/full-db-sync-export-meta')
        source_cols = [row['collection'] for row in meta.get('collections', []) if not row['collection'].startswith('system.')]
        results = []
        errors = []
        for col in source_cols:
            try:
                logger.info(f"[FULL-SYNC] Fetching collection: {col}")
                export = await _fetch_preview_sync_json(payload.source_url, f"/api/admin/full-db-sync-export?collection={urllib.parse.quote(col)}")
                docs = export.get('docs', [])
                local_count = len(docs)
                try:
                    await db[col].drop()
                except Exception:
                    pass
                if docs:
                    batch = []
                    for doc in docs:
                        batch.append(doc)
                        if len(batch) >= 1000:
                            await db[col].insert_many(batch)
                            batch = []
                    if batch:
                        await db[col].insert_many(batch)
                prod_count = await db[col].count_documents({})
                logger.info(f"[FULL-SYNC] {col}: preview={local_count}, prod={prod_count}, matched={local_count == prod_count}")
                results.append({
                    'collection': col,
                    'preview': local_count,
                    'production_after': prod_count,
                    'matched': local_count == prod_count,
                })
            except Exception as e:
                logger.error(f"[FULL-SYNC] Error syncing {col}: {e}")
                errors.append({'collection': col, 'error': str(e)})
        critical = [r for r in results if r['collection'] in CRITICAL_SYNC_COLLECTIONS]
        return {
            'ok': True,
            'synced': results,
            'critical': critical,
            'errors': errors,
            'message': f'Full database sync complete. {len(results)} collections synced, {len(errors)} errors.',
            'source_url': payload.source_url,
        }

    prod_client, prod_db = await _get_production_db()
    try:
        collections = [c for c in await db.list_collection_names() if not c.startswith('system.')]
        results = []
        for col in collections:
            local_count = await db[col].count_documents({})
            try:
                await prod_db[col].drop()
            except Exception:
                pass

            inserted = 0
            if local_count > 0:
                batch = []
                async for doc in db[col].find({}):
                    batch.append(doc)
                    if len(batch) >= 1000:
                        await prod_db[col].insert_many(batch)
                        inserted += len(batch)
                        batch = []
                if batch:
                    await prod_db[col].insert_many(batch)
                    inserted += len(batch)

            prod_count = await prod_db[col].count_documents({})
            results.append({
                'collection': col,
                'preview': local_count,
                'production_after': prod_count,
                'matched': local_count == prod_count,
            })

        critical = [r for r in results if r['collection'] in CRITICAL_SYNC_COLLECTIONS]
        return {
            'ok': True,
            'synced': critical,
            'all_results': results,
            'message': 'Full database sync complete',
        }
    finally:
        prod_client.close()


# Fulfilment status flow
FULFILMENT_STATUSES = [
    {"value": "pending", "label": "Pending", "color": "gray", "emoji": "⏳"},
    {"value": "confirmed", "label": "Confirmed", "color": "blue", "emoji": "✅"},
    {"value": "baking", "label": "Baking", "color": "orange", "emoji": "🍰"},
    {"value": "personalised", "label": "Personalised", "color": "pink", "emoji": "✨"},
    {"value": "packed", "label": "Packed with Love", "color": "purple", "emoji": "💜"},
    {"value": "out_for_delivery", "label": "Out for Delivery", "color": "indigo", "emoji": "🚗"},
    {"value": "delivered", "label": "Delivered & Celebrated", "color": "green", "emoji": "🎉"},
    {"value": "cancelled", "label": "Cancelled", "color": "red", "emoji": "❌"},
]


# ==================== DRAFT ORDERS ====================

@fulfilment_router.post("/draft-orders")
async def create_draft_order(order: CreateDraftOrder, username: str = Depends(verify_admin)):
    """Create a draft order for concierge-assisted orders"""
    
    # Calculate totals
    subtotal = sum(item.price * item.quantity for item in order.items)
    autoship_items = [i for i in order.items if i.is_autoship]
    autoship_discount = min(subtotal * 0.25, 300) if autoship_items else 0
    shipping = 0 if (subtotal - autoship_discount) >= 3000 else 150
    total = subtotal - autoship_discount + shipping
    
    draft_order = {
        "id": f"DRAFT-{uuid.uuid4().hex[:8].upper()}",
        "order_id": None,  # Will be set when confirmed
        "status": "draft",
        "source": order.source,
        "customer": order.customer.model_dump(),
        "pet": order.pet.model_dump() if order.pet else None,
        "items": [i.model_dump() for i in order.items],
        "delivery": {
            "type": order.delivery_type,
            "date": order.delivery_date,
            "slot": order.delivery_slot,
            "city": order.customer.city,
            "address": order.customer.address,
            "pincode": order.customer.pincode,
        },
        "special_instructions": order.special_instructions,
        "concierge_notes": order.concierge_notes,
        "pricing": {
            "subtotal": subtotal,
            "autoship_discount": autoship_discount,
            "shipping": shipping,
            "total": total,
        },
        "checkout_link": None,
        "created_by": username,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    }
    
    # Generate checkout link
    checkout_token = uuid.uuid4().hex
    draft_order["checkout_token"] = checkout_token
    draft_order["checkout_link"] = f"https://thedoggycompany.com/checkout/draft/{draft_order['id']}?token={checkout_token}"
    
    await db.draft_orders.insert_one(draft_order)
    
    return {
        "message": "Draft order created",
        "draft_order": {k: v for k, v in draft_order.items() if k != "_id"},
        "checkout_link": draft_order["checkout_link"]
    }


@fulfilment_router.get("/draft-orders")
async def get_draft_orders(
    status: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50,
    username: str = Depends(verify_admin)
):
    """Get all draft orders"""
    query = {}
    if status:
        query["status"] = status
    if source:
        query["source"] = source
    
    orders = await db.draft_orders.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"draft_orders": orders, "count": len(orders)}


@fulfilment_router.post("/draft-orders/{draft_id}/send-link")
async def send_draft_checkout_link(
    draft_id: str,
    method: str = Query("whatsapp", description="whatsapp or email"),
    username: str = Depends(verify_admin)
):
    """Send checkout link to customer via WhatsApp or Email"""
    draft = await db.draft_orders.find_one({"id": draft_id}, {"_id": 0})
    if not draft:
        raise HTTPException(status_code=404, detail="Draft order not found")
    
    customer = draft.get("customer", {})
    checkout_link = draft.get("checkout_link")
    items_summary = ", ".join([f"{i['name']} x{i['quantity']}" for i in draft.get("items", [])])
    
    if method == "whatsapp":
        # Generate WhatsApp click-to-chat link
        message = f"""🐾 *Your Order from The Doggy Company*

Hi {customer.get('name')}! 

Your personalized order is ready for checkout:

📦 Items: {items_summary}
💰 Total: ₹{draft['pricing']['total']}

Complete your order here:
{checkout_link}

Questions? Reply to this message!

With love,
The Doggy Company Team 🐕"""
        
        phone = customer.get("phone", "").replace("+", "").replace(" ", "")
        if not phone.startswith("91"):
            phone = f"91{phone}"
        
        whatsapp_link = f"https://wa.me/{phone}?text={__import__('urllib.parse', fromlist=['quote']).quote(message)}"
        
        await db.draft_orders.update_one(
            {"id": draft_id},
            {"$set": {"link_sent_at": datetime.now(timezone.utc).isoformat(), "link_sent_via": "whatsapp"}}
        )
        
        return {"message": "WhatsApp link generated", "whatsapp_link": whatsapp_link}
    
    elif method == "email" and RESEND_API_KEY and customer.get("email"):
        # Send email
        try:
            email_html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0;">🐾 Your Order is Ready!</h1>
                </div>
                <div style="padding: 30px; background: #fdf4ff;">
                    <p>Hi {customer.get('name')}!</p>
                    <p>Your personalized order from The Doggy Company is ready for checkout.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">📦 Order Summary</h3>
                        <p><strong>Items:</strong> {items_summary}</p>
                        <p><strong>Total:</strong> ₹{draft['pricing']['total']}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{checkout_link}" style="background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; display: inline-block;">
                            Complete Your Order
                        </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px;">This link expires in 7 days.</p>
                </div>
            </div>
            """
            
            resend.Emails.send({
                "from": f"THEDOGGYCOMPANY <{SENDER_EMAIL}>",
                "to": customer.get("email"),
                "subject": "🐾 Your Order is Ready - Complete Checkout",
                "html": email_html
            })
            
            await db.draft_orders.update_one(
                {"id": draft_id},
                {"$set": {"link_sent_at": datetime.now(timezone.utc).isoformat(), "link_sent_via": "email"}}
            )
            
            return {"message": "Email sent successfully"}
        except Exception as e:
            logger.error(f"Failed to send draft order email: {e}")
            raise HTTPException(status_code=500, detail="Failed to send email")
    
    else:
        raise HTTPException(status_code=400, detail="Invalid method or missing email")


@fulfilment_router.post("/draft-orders/{draft_id}/convert")
async def convert_draft_to_order(draft_id: str, username: str = Depends(verify_admin)):
    """Convert a draft order to a confirmed order"""
    draft = await db.draft_orders.find_one({"id": draft_id}, {"_id": 0})
    if not draft:
        raise HTTPException(status_code=404, detail="Draft order not found")
    
    if draft.get("status") == "converted":
        raise HTTPException(status_code=400, detail="Draft already converted")
    
    # Create real order
    order_id = f"TDB-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    order = {
        "id": str(uuid.uuid4()),
        "orderId": order_id,
        "status": "confirmed",
        "source": draft.get("source", "concierge"),
        "customer": draft.get("customer"),
        "pet": draft.get("pet"),
        "items": draft.get("items"),
        "delivery": draft.get("delivery"),
        "specialInstructions": draft.get("special_instructions"),
        "concierge_notes": draft.get("concierge_notes"),
        "subtotal": draft["pricing"]["subtotal"],
        "discount": draft["pricing"]["autoship_discount"],
        "shipping": draft["pricing"]["shipping"],
        "total": draft["pricing"]["total"],
        "payment_status": "pending",
        "draft_id": draft_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.orders.insert_one(order)
    
    # Update draft
    await db.draft_orders.update_one(
        {"id": draft_id},
        {"$set": {
            "status": "converted",
            "order_id": order_id,
            "converted_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Draft converted to order", "order_id": order_id}


# ==================== FULFILMENT MANAGEMENT ====================

@fulfilment_router.get("/fulfilment")
async def get_fulfilment_orders(
    date_range: str = Query("today", description="today, tomorrow, this_week, this_month"),
    city: Optional[str] = None,
    order_type: Optional[str] = None,
    status: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Get orders for fulfilment view"""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Date range filter
    date_filter = {}
    if date_range == "today":
        date_filter = {
            "delivery.date": today.strftime("%Y-%m-%d")
        }
    elif date_range == "tomorrow":
        tomorrow = today + timedelta(days=1)
        date_filter = {
            "delivery.date": tomorrow.strftime("%Y-%m-%d")
        }
    elif date_range == "this_week":
        week_end = today + timedelta(days=7)
        date_filter = {
            "delivery.date": {"$gte": today.strftime("%Y-%m-%d"), "$lte": week_end.strftime("%Y-%m-%d")}
        }
    elif date_range == "this_month":
        month_end = today + timedelta(days=30)
        date_filter = {
            "delivery.date": {"$gte": today.strftime("%Y-%m-%d"), "$lte": month_end.strftime("%Y-%m-%d")}
        }
    
    # Build query
    query = {"status": {"$nin": ["cancelled", "draft"]}}
    if date_filter:
        query.update(date_filter)
    if city:
        query["delivery.city"] = {"$regex": city, "$options": "i"}
    if status:
        query["status"] = status
    if order_type == "autoship":
        query["items.is_autoship"] = True
    elif order_type == "onetime":
        query["items.is_autoship"] = {"$ne": True}
    elif order_type == "custom":
        query["source"] = "custom"
    
    orders = await db.orders.find(query, {"_id": 0}).sort([
        ("delivery.date", 1),
        ("delivery.slot", 1),
        ("delivery.city", 1)
    ]).to_list(500)
    
    # Count by status
    status_counts = {}
    for s in FULFILMENT_STATUSES:
        count = await db.orders.count_documents({**query, "status": s["value"]})
        status_counts[s["value"]] = count
    
    return {
        "orders": orders,
        "count": len(orders),
        "status_counts": status_counts,
        "statuses": FULFILMENT_STATUSES
    }


@fulfilment_router.put("/fulfilment/{order_id}/status")
async def update_order_status(
    order_id: str,
    update: UpdateOrderStatus,
    username: str = Depends(verify_admin)
):
    """Update order status with auto-notification"""
    order = await db.orders.find_one(
        {"$or": [{"id": order_id}, {"orderId": order_id}]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.get("status")
    new_status = update.status
    
    # Update order
    update_data = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        f"status_{new_status}_at": datetime.now(timezone.utc).isoformat(),
    }
    if update.notes:
        update_data["status_notes"] = update.notes
    
    await db.orders.update_one(
        {"$or": [{"id": order_id}, {"orderId": order_id}]},
        {"$set": update_data}
    )
    
    # Log status change
    await db.order_status_logs.insert_one({
        "order_id": order_id,
        "old_status": old_status,
        "new_status": new_status,
        "changed_by": username,
        "notes": update.notes,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Send notification if enabled
    notification_result = None
    if update.send_notification:
        notification_result = await send_status_notification(order, new_status)
    
    return {
        "message": f"Status updated to {new_status}",
        "notification_sent": notification_result is not None,
        "notification": notification_result
    }


async def send_status_notification(order: dict, status: str) -> Optional[dict]:
    """Send WhatsApp/Email notification for status change"""
    customer = order.get("customer", {})
    pet = order.get("pet", {})
    pet_name = pet.get("name", "your pet") if pet else "your pet"
    
    # Status messages
    status_messages = {
        "confirmed": f"✅ Great news! Your order #{order.get('orderId')} is confirmed. We're getting ready to create something special for {pet_name}!",
        "baking": f"🍰 Your order is now baking! The kitchen is filled with the aroma of fresh treats for {pet_name}. 🐾",
        "personalised": f"✨ We're adding the personal touches to {pet_name}'s order! Making it extra special just for them.",
        "packed": f"💜 Packed with love! {pet_name}'s goodies are all boxed up and ready to make their journey to you.",
        "out_for_delivery": f"🚗 On the way! Your order is out for delivery. {pet_name} will be celebrating soon!",
        "delivered": f"🎉 Delivered & Celebrated! We hope {pet_name} loves their treats! Share their joy with us on Instagram @thedoggycompany 📸"
    }
    
    message = status_messages.get(status)
    if not message:
        return None
    
    # Generate WhatsApp link
    phone = customer.get("phone", "").replace("+", "").replace(" ", "")
    if not phone.startswith("91"):
        phone = f"91{phone}"
    
    full_message = f"""🐾 *The Doggy Company - Order Update*

{message}

Order: #{order.get('orderId')}

Thank you for choosing The Doggy Company! 🐕
"""
    
    whatsapp_link = f"https://wa.me/{phone}?text={__import__('urllib.parse', fromlist=['quote']).quote(full_message)}"
    
    # Also send email if available
    email_sent = False
    if RESEND_API_KEY and customer.get("email"):
        try:
            status_info = next((s for s in FULFILMENT_STATUSES if s["value"] == status), None)
            emoji = status_info.get("emoji", "📦") if status_info else "📦"
            label = status_info.get("label", status) if status_info else status
            
            resend.Emails.send({
                "from": f"THEDOGGYCOMPANY <{SENDER_EMAIL}>",
                "to": customer.get("email"),
                "subject": f"{emoji} Order Update: {label}",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
                        <h1 style="color: white; margin: 0;">{emoji} {label}</h1>
                    </div>
                    <div style="padding: 30px; background: #fdf4ff;">
                        <p>Hi {customer.get('name')}!</p>
                        <p style="font-size: 18px;">{message}</p>
                        <p style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>Order ID:</strong> {order.get('orderId')}
                        </p>
                        <p style="color: #6b7280;">Thank you for choosing The Doggy Company!</p>
                    </div>
                </div>
                """
            })
            email_sent = True
        except Exception as e:
            logger.error(f"Failed to send status email: {e}")
    
    return {
        "whatsapp_link": whatsapp_link,
        "email_sent": email_sent
    }


@fulfilment_router.get("/fulfilment/batch-view")
async def get_batch_fulfilment_view(
    date: str = Query("today", description="today, tomorrow, or YYYY-MM-DD"),
    city: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Get batch fulfilment view for kitchen/delivery teams"""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    if date == "today":
        target_date = today.strftime("%Y-%m-%d")
    elif date == "tomorrow":
        target_date = (today + timedelta(days=1)).strftime("%Y-%m-%d")
    else:
        target_date = date
    
    query = {
        "delivery.date": target_date,
        "status": {"$nin": ["cancelled", "delivered"]}
    }
    if city:
        query["delivery.city"] = {"$regex": city, "$options": "i"}
    
    orders = await db.orders.find(query, {"_id": 0}).sort([
        ("delivery.slot", 1),
        ("delivery.city", 1)
    ]).to_list(500)
    
    # Calculate batch summary
    product_counts = {}
    autoship_count = 0
    custom_count = 0
    cities = set()
    
    for order in orders:
        cities.add(order.get("delivery", {}).get("city", "Unknown"))
        for item in order.get("items", []):
            name = item.get("name", "Unknown")
            product_counts[name] = product_counts.get(name, 0) + item.get("quantity", 1)
            if item.get("is_autoship"):
                autoship_count += 1
        if order.get("source") == "custom":
            custom_count += 1
    
    # Top 5 products to prepare
    top_products = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "date": target_date,
        "orders": orders,
        "summary": {
            "total_orders": len(orders),
            "autoship_orders": autoship_count,
            "custom_orders": custom_count,
            "total_items": sum(product_counts.values()),
            "cities": list(cities),
            "top_products": [{"name": p[0], "quantity": p[1]} for p in top_products],
        },
        "by_time_slot": _group_by_slot(orders),
        "by_city": _group_by_city(orders),
    }


def _group_by_slot(orders: List[dict]) -> dict:
    """Group orders by delivery time slot"""
    slots = {}
    for order in orders:
        slot = order.get("delivery", {}).get("slot", "Unscheduled")
        if slot not in slots:
            slots[slot] = []
        slots[slot].append(order)
    return slots


def _group_by_city(orders: List[dict]) -> dict:
    """Group orders by city"""
    cities = {}
    for order in orders:
        city = order.get("delivery", {}).get("city", "Unknown")
        if city not in cities:
            cities[city] = []
        cities[city].append(order)
    return cities


# ==================== REPORTS & ANALYTICS ====================

@fulfilment_router.get("/reports/executive-summary")
async def get_executive_summary(
    period: str = Query("today", description="today, this_week, this_month, this_quarter, ytd"),
    username: str = Depends(verify_admin)
):
    """Get executive summary metrics"""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Calculate date ranges
    if period == "today":
        start_date = today.isoformat()
    elif period == "this_week":
        start_date = (today - timedelta(days=today.weekday())).isoformat()
    elif period == "this_month":
        start_date = today.replace(day=1).isoformat()
    elif period == "this_quarter":
        quarter_month = ((today.month - 1) // 3) * 3 + 1
        start_date = today.replace(month=quarter_month, day=1).isoformat()
    else:  # ytd
        start_date = today.replace(month=1, day=1).isoformat()
    
    # Revenue
    revenue_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}, "status": {"$nin": ["cancelled"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}, "count": {"$sum": 1}}}
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    total_orders = revenue_result[0]["count"] if revenue_result else 0
    
    # Active autoship subscribers
    autoship_count = await db.autoships.count_documents({"status": "active"})
    
    # Repeat purchase rate (customers with 2+ orders)
    repeat_pipeline = [
        {"$group": {"_id": "$customer.email", "order_count": {"$sum": 1}}},
        {"$match": {"order_count": {"$gte": 2}}},
        {"$count": "repeat_customers"}
    ]
    repeat_result = await db.orders.aggregate(repeat_pipeline).to_list(1)
    repeat_customers = repeat_result[0]["repeat_customers"] if repeat_result else 0
    
    total_customers_pipeline = [
        {"$group": {"_id": "$customer.email"}},
        {"$count": "total"}
    ]
    total_customers_result = await db.orders.aggregate(total_customers_pipeline).to_list(1)
    total_customers = total_customers_result[0]["total"] if total_customers_result else 1
    
    repeat_rate = round((repeat_customers / total_customers) * 100, 1) if total_customers > 0 else 0
    
    return {
        "period": period,
        "start_date": start_date,
        "metrics": {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "active_autoship_subscribers": autoship_count,
            "repeat_purchase_rate": repeat_rate,
            "average_order_value": round(total_revenue / total_orders, 2) if total_orders > 0 else 0
        }
    }


@fulfilment_router.get("/reports/revenue-by-city")
async def get_revenue_by_city(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Get revenue breakdown by city"""
    now = datetime.now(timezone.utc)
    
    if not start_date:
        start_date = (now - timedelta(days=30)).isoformat()
    if not end_date:
        end_date = now.isoformat()
    
    pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date, "$lte": end_date},
            "status": {"$nin": ["cancelled"]}
        }},
        {"$group": {
            "_id": "$delivery.city",
            "revenue": {"$sum": "$total"},
            "orders": {"$sum": 1},
            "avg_order_value": {"$avg": "$total"}
        }},
        {"$sort": {"revenue": -1}}
    ]
    
    results = await db.orders.aggregate(pipeline).to_list(100)
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "by_city": [
            {
                "city": r["_id"] or "Unknown",
                "revenue": round(r["revenue"], 2),
                "orders": r["orders"],
                "avg_order_value": round(r["avg_order_value"], 2)
            }
            for r in results
        ],
        "total_revenue": sum(r["revenue"] for r in results),
        "total_orders": sum(r["orders"] for r in results)
    }


@fulfilment_router.get("/reports/daily-sales")
async def get_daily_sales(
    days: int = Query(30, description="Number of days"),
    city: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Get daily sales report"""
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=days)).isoformat()
    
    match_query = {
        "created_at": {"$gte": start_date},
        "status": {"$nin": ["cancelled"]}
    }
    if city:
        match_query["delivery.city"] = {"$regex": city, "$options": "i"}
    
    pipeline = [
        {"$match": match_query},
        {"$addFields": {
            "date": {"$substr": ["$created_at", 0, 10]}
        }},
        {"$group": {
            "_id": "$date",
            "revenue": {"$sum": "$total"},
            "orders": {"$sum": 1},
            "autoship_orders": {
                "$sum": {"$cond": [{"$eq": ["$source", "autoship"]}, 1, 0]}
            }
        }},
        {"$sort": {"_id": -1}}
    ]
    
    results = await db.orders.aggregate(pipeline).to_list(days)
    
    return {
        "period": f"Last {days} days",
        "city_filter": city,
        "daily_sales": [
            {
                "date": r["_id"],
                "revenue": round(r["revenue"], 2),
                "orders": r["orders"],
                "autoship_orders": r["autoship_orders"]
            }
            for r in results
        ]
    }


@fulfilment_router.get("/reports/product-performance")
async def get_product_performance(
    days: int = Query(30, description="Number of days"),
    city: Optional[str] = None,
    limit: int = 20,
    username: str = Depends(verify_admin)
):
    """Get product performance report"""
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=days)).isoformat()
    
    match_query = {
        "created_at": {"$gte": start_date},
        "status": {"$nin": ["cancelled"]}
    }
    if city:
        match_query["delivery.city"] = {"$regex": city, "$options": "i"}
    
    pipeline = [
        {"$match": match_query},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.name",
            "quantity_sold": {"$sum": "$items.quantity"},
            "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
            "orders": {"$sum": 1},
            "autoship_count": {
                "$sum": {"$cond": [{"$eq": ["$items.is_autoship", True]}, 1, 0]}
            }
        }},
        {"$sort": {"revenue": -1}},
        {"$limit": limit}
    ]
    
    results = await db.orders.aggregate(pipeline).to_list(limit)
    
    return {
        "period": f"Last {days} days",
        "city_filter": city,
        "top_products": [
            {
                "product": r["_id"],
                "quantity_sold": r["quantity_sold"],
                "revenue": round(r["revenue"], 2),
                "orders": r["orders"],
                "autoship_count": r["autoship_count"]
            }
            for r in results
        ]
    }


@fulfilment_router.get("/reports/autoship-performance")
async def get_autoship_performance(username: str = Depends(verify_admin)):
    """Get autoship subscription performance"""
    
    # Active/Paused/Cancelled counts
    active = await db.autoships.count_documents({"status": "active"})
    paused = await db.autoships.count_documents({"status": "paused"})
    cancelled = await db.autoships.count_documents({"status": "cancelled"})
    
    # Revenue from autoship
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=30)).isoformat()
    
    autoship_revenue_pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date},
            "items.is_autoship": True,
            "status": {"$nin": ["cancelled"]}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(autoship_revenue_pipeline).to_list(1)
    autoship_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # By frequency
    frequency_pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {
            "_id": "$frequency",
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    frequency_results = await db.autoships.aggregate(frequency_pipeline).to_list(10)
    
    return {
        "subscribers": {
            "active": active,
            "paused": paused,
            "cancelled": cancelled,
            "total": active + paused + cancelled
        },
        "revenue_30d": round(autoship_revenue, 2),
        "by_frequency": [
            {"frequency": f"{r['_id']} weeks", "subscribers": r["count"]}
            for r in frequency_results
        ],
        "churn_rate": round((cancelled / (active + paused + cancelled)) * 100, 1) if (active + paused + cancelled) > 0 else 0,
        "retention_rate": round((active / (active + paused + cancelled)) * 100, 1) if (active + paused + cancelled) > 0 else 0
    }


@fulfilment_router.get("/reports/customer-intelligence")
async def get_customer_intelligence(
    days: int = Query(90, description="Analysis period in days"),
    username: str = Depends(verify_admin)
):
    """Get customer intelligence report"""
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=days)).isoformat()
    inactive_threshold = (now - timedelta(days=60)).isoformat()
    
    # New vs returning
    new_customers_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": "$customer.email",
            "first_order": {"$min": "$created_at"},
            "order_count": {"$sum": 1},
            "total_spent": {"$sum": "$total"}
        }},
        {"$match": {"first_order": {"$gte": start_date}}}
    ]
    new_customers = await db.orders.aggregate(new_customers_pipeline).to_list(10000)
    
    returning_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": "$customer.email",
            "first_order": {"$min": "$created_at"},
            "order_count": {"$sum": 1},
            "total_spent": {"$sum": "$total"}
        }},
        {"$match": {"first_order": {"$lt": start_date}}}
    ]
    returning_customers = await db.orders.aggregate(returning_pipeline).to_list(10000)
    
    # High value customers (top 10 by spend)
    high_value_pipeline = [
        {"$group": {
            "_id": "$customer.email",
            "name": {"$first": "$customer.parentName"},
            "total_spent": {"$sum": "$total"},
            "order_count": {"$sum": 1}
        }},
        {"$sort": {"total_spent": -1}},
        {"$limit": 10}
    ]
    high_value = await db.orders.aggregate(high_value_pipeline).to_list(10)
    
    # Inactive customers
    inactive_pipeline = [
        {"$group": {
            "_id": "$customer.email",
            "last_order": {"$max": "$created_at"}
        }},
        {"$match": {"last_order": {"$lt": inactive_threshold}}},
        {"$count": "inactive"}
    ]
    inactive_result = await db.orders.aggregate(inactive_pipeline).to_list(1)
    inactive_count = inactive_result[0]["inactive"] if inactive_result else 0
    
    # Average order value
    aov_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}, "status": {"$nin": ["cancelled"]}}},
        {"$group": {"_id": None, "avg": {"$avg": "$total"}}}
    ]
    aov_result = await db.orders.aggregate(aov_pipeline).to_list(1)
    avg_order_value = aov_result[0]["avg"] if aov_result else 0
    
    return {
        "period": f"Last {days} days",
        "new_customers": len(new_customers),
        "returning_customers": len(returning_customers),
        "inactive_customers_60d": inactive_count,
        "average_order_value": round(avg_order_value, 2),
        "high_value_customers": [
            {
                "email": c["_id"],
                "name": c.get("name", "Unknown"),
                "total_spent": round(c["total_spent"], 2),
                "orders": c["order_count"]
            }
            for c in high_value
        ]
    }


@fulfilment_router.get("/reports/pet-intelligence")
async def get_pet_intelligence(username: str = Depends(verify_admin)):
    """Get pet intelligence report"""
    
    # Most popular breeds
    breed_pipeline = [
        {"$match": {"breed": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": "$breed", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    breeds = await db.pets.aggregate(breed_pipeline).to_list(10)
    
    # Upcoming birthdays
    now = datetime.now(timezone.utc)
    upcoming_7d = []
    upcoming_14d = []
    upcoming_30d = []
    
    pets_with_celebrations = await db.pets.find(
        {"celebrations": {"$exists": True, "$ne": []}},
        {"_id": 0, "name": 1, "celebrations": 1, "owner_email": 1}
    ).to_list(1000)
    
    for pet in pets_with_celebrations:
        for celebration in pet.get("celebrations", []):
            if celebration.get("name") == "Birthday":
                try:
                    bday = datetime.strptime(celebration.get("date", ""), "%Y-%m-%d")
                    # Check this year's birthday
                    this_year_bday = bday.replace(year=now.year)
                    if this_year_bday < now:
                        this_year_bday = bday.replace(year=now.year + 1)
                    
                    days_until = (this_year_bday - now).days
                    pet_info = {"name": pet.get("name"), "email": pet.get("owner_email"), "date": celebration.get("date"), "days_until": days_until}
                    
                    if 0 <= days_until <= 7:
                        upcoming_7d.append(pet_info)
                    elif 8 <= days_until <= 14:
                        upcoming_14d.append(pet_info)
                    elif 15 <= days_until <= 30:
                        upcoming_30d.append(pet_info)
                except:
                    pass
    
    return {
        "popular_breeds": [{"breed": b["_id"], "count": b["count"]} for b in breeds],
        "total_pets": await db.pets.count_documents({}),
        "upcoming_birthdays": {
            "next_7_days": len(upcoming_7d),
            "next_14_days": len(upcoming_14d),
            "next_30_days": len(upcoming_30d),
            "details_7d": sorted(upcoming_7d, key=lambda x: x["days_until"])[:20]
        }
    }


@fulfilment_router.get("/reports/operations")
async def get_operations_report(username: str = Depends(verify_admin)):
    """Get operations and fulfilment report"""
    
    # Orders by status
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    status_results = await db.orders.aggregate(status_pipeline).to_list(20)
    
    # Upcoming autoship shipments (next 7 days)
    now = datetime.now(timezone.utc)
    next_week = (now + timedelta(days=7)).isoformat()
    
    upcoming_autoships = await db.autoships.count_documents({
        "status": "active",
        "next_delivery_date": {"$lte": next_week}
    })
    
    return {
        "orders_by_status": [{"status": s["_id"], "count": s["count"]} for s in status_results],
        "upcoming_autoship_shipments_7d": upcoming_autoships,
        "fulfilment_statuses": FULFILMENT_STATUSES
    }


@fulfilment_router.get("/reports/search-analytics")
async def get_search_analytics(
    days: int = Query(30, description="Days to analyze"),
    username: str = Depends(verify_admin)
):
    """Get search and discovery analytics"""
    # Note: This requires logging search queries in the search_service
    # For now, return placeholder data structure
    
    return {
        "period": f"Last {days} days",
        "top_search_terms": [],
        "zero_result_searches": [],
        "search_to_cart_conversion": 0,
        "note": "Search analytics requires query logging to be implemented"
    }


@fulfilment_router.get("/reports/reviews")
async def get_reviews_report(username: str = Depends(verify_admin)):
    """Get reviews and feedback report"""
    
    total = await db.reviews.count_documents({})
    pending = await db.reviews.count_documents({"status": "pending"})
    approved = await db.reviews.count_documents({"status": "approved"})
    
    # Average rating
    avg_pipeline = [
        {"$match": {"status": "approved"}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}}}
    ]
    avg_result = await db.reviews.aggregate(avg_pipeline).to_list(1)
    avg_rating = avg_result[0]["avg"] if avg_result else 0
    
    # Products with lowest ratings
    low_rated_pipeline = [
        {"$match": {"status": "approved"}},
        {"$group": {
            "_id": "$product_id",
            "product_name": {"$first": "$product_name"},
            "avg_rating": {"$avg": "$rating"},
            "review_count": {"$sum": 1}
        }},
        {"$match": {"review_count": {"$gte": 2}}},
        {"$sort": {"avg_rating": 1}},
        {"$limit": 10}
    ]
    low_rated = await db.reviews.aggregate(low_rated_pipeline).to_list(10)
    
    return {
        "total_reviews": total,
        "pending_approval": pending,
        "approved": approved,
        "average_rating": round(avg_rating, 2),
        "low_rated_products": [
            {
                "product": r.get("product_name", r["_id"]),
                "avg_rating": round(r["avg_rating"], 2),
                "reviews": r["review_count"]
            }
            for r in low_rated
        ]
    }


@fulfilment_router.get("/reports/financial")
async def get_financial_report(
    days: int = Query(30, description="Days to analyze"),
    username: str = Depends(verify_admin)
):
    """Get financial health report"""
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=days)).isoformat()
    
    # Total discounts
    discount_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}, "status": {"$nin": ["cancelled"]}}},
        {"$group": {
            "_id": None,
            "total_discounts": {"$sum": "$discount"},
            "total_shipping": {"$sum": "$shipping"},
            "total_revenue": {"$sum": "$total"}
        }}
    ]
    discount_result = await db.orders.aggregate(discount_pipeline).to_list(1)
    
    totals = discount_result[0] if discount_result else {"total_discounts": 0, "total_shipping": 0, "total_revenue": 0}
    
    # Refunds and cancellations
    cancelled = await db.orders.count_documents({
        "created_at": {"$gte": start_date},
        "status": "cancelled"
    })
    
    return {
        "period": f"Last {days} days",
        "total_discounts_given": round(totals.get("total_discounts", 0), 2),
        "total_shipping_revenue": round(totals.get("total_shipping", 0), 2),
        "total_revenue": round(totals.get("total_revenue", 0), 2),
        "cancelled_orders": cancelled,
        "discount_impact_percent": round((totals.get("total_discounts", 0) / totals.get("total_revenue", 1)) * 100, 2) if totals.get("total_revenue", 0) > 0 else 0
    }



# ============================================
# DATABASE EXPORT / BACKUP ENDPOINT
# ============================================

@fulfilment_router.get("/export-database")
async def export_database(request: Request):
    """
    Export all database collections as JSON for backup purposes.
    This is a safety feature for disaster recovery.
    """
    global db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    try:
        export_data = {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "database_name": db.name,
            "collections": {}
        }
        
        # List of collections to export
        collections_to_export = [
            "users", "pets", "tickets", "orders", "products_master", 
            "services_master", "mira_sessions", "mira_memories", 
            "conversation_memories", "learn_videos", "learn_guides",
            "unified_inbox", "admin_notifications", "paw_points_ledger", 
            "faqs", "admin_config", "unified_products", "service_catalog",
            "ticket_counters", "user_streaks", "dismissed_alerts"
        ]
        
        for collection_name in collections_to_export:
            try:
                collection = db[collection_name]
                # Fetch all documents, exclude MongoDB's _id for cleaner export
                docs = await collection.find({}, {"_id": 0}).to_list(length=10000)
                export_data["collections"][collection_name] = {
                    "count": len(docs),
                    "documents": docs
                }
                logger.info(f"[DB Export] Exported {len(docs)} docs from {collection_name}")
            except Exception as coll_err:
                logger.warning(f"[DB Export] Skipped {collection_name}: {coll_err}")
                export_data["collections"][collection_name] = {
                    "count": 0,
                    "documents": [],
                    "error": str(coll_err)
                }
        
        export_data["total_collections"] = len(export_data["collections"])
        export_data["total_documents"] = sum(
            c["count"] for c in export_data["collections"].values()
        )
        
        logger.info(f"[DB Export] Complete: {export_data['total_collections']} collections, {export_data['total_documents']} documents")
        
        return export_data
        
    except Exception as e:
        logger.error(f"[DB Export] Failed: {e}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")




@fulfilment_router.post("/send-digest")
async def send_daily_digest(username: str = Depends(verify_admin)):
    """Manually trigger the daily morning digest email."""
    try:
        from daily_digest import run_digest
        stats = run_digest(dry_run=False)
        return {"status": "sent", "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Digest failed: {str(e)}")


@fulfilment_router.post("/send-digest/preview")
async def preview_daily_digest(username: str = Depends(verify_admin)):
    """Generate digest HTML preview."""
    try:
        from daily_digest import run_digest
        stats = run_digest(dry_run=True)
        return {"status": "preview_generated", "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")
