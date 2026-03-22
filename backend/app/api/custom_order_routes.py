"""
Custom Order Routes — The WOW Feature
- Customer uploads pet photo → stored on Cloudinary (quality:100, no transformation)
- Adds personalisation notes + auto-captured pet profile
- Creates a Service Desk ticket with full context (photos, notes, product ref)
- Admin sees everything needed to send to printer/baker
- Customer gets in-app "My Requests" + email confirmation
"""
import os
import logging
import cloudinary
import cloudinary.uploader
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/custom-orders", tags=["Custom Orders"])

# ── DB ────────────────────────────────────────────────────────────────────────
_db = None

def get_db():
    global _db
    if _db is None:
        client = AsyncIOMotorClient(os.environ.get("MONGO_URL"))
        _db = client[os.environ.get("DB_NAME")]
    return _db

# ── Cloudinary Config ─────────────────────────────────────────────────────────
def _ensure_cloudinary():
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    api_key = os.environ.get("CLOUDINARY_API_KEY")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET")
    if cloud_name and api_key and api_secret:
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
        return True
    return False

# ── Max file size: 10MB ──────────────────────────────────────────────────────
MAX_FILE_SIZE = 10 * 1024 * 1024


# ═══════════════════════════════════════════════════════════════════════════════
# UPLOAD PET PHOTO
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/upload-photo")
async def upload_pet_photo(
    file: UploadFile = File(...),
    pet_id: str = Form(default=""),
    pet_name: str = Form(default=""),
):
    """Upload pet photo to Cloudinary with quality:100, no transformation.
    Returns the permanent URL for use in custom order."""
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum 10MB allowed.")

    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted (JPG, PNG, HEIC)")

    if not _ensure_cloudinary():
        raise HTTPException(status_code=500, detail="Cloudinary not configured")

    try:
        import io
        slug = f"custom-order-{pet_name or pet_id}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        result = cloudinary.uploader.upload(
            io.BytesIO(contents),
            folder="tdc/custom-orders",
            public_id=slug,
            quality=100,
            resource_type="image",
            format="jpg",
        )
        url = result.get("secure_url", result.get("url", ""))
        return {
            "success": True,
            "photo_url": url,
            "public_id": result.get("public_id", ""),
            "width": result.get("width"),
            "height": result.get("height"),
            "bytes": result.get("bytes"),
            "format": result.get("format"),
        }
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════════
# CREATE CUSTOM ORDER (+ Service Desk Ticket)
# ═══════════════════════════════════════════════════════════════════════════════

class CustomOrderRequest(BaseModel):
    product_id: str = ""
    product_name: str = ""
    product_type: str = ""
    product_image: str = ""
    pillar: str = ""
    pet_id: str = ""
    pet_name: str = ""
    pet_breed: str = ""
    pet_birthday: str = ""
    pet_archetype: str = ""
    customer_email: str = ""
    customer_name: str = ""
    customer_phone: str = ""
    photo_urls: List[str] = []
    personalisation_notes: str = ""
    special_text: str = ""
    delivery_address: str = ""
    source: str = "soul_picks_modal"


@router.post("")
async def create_custom_order(req: CustomOrderRequest, background_tasks: BackgroundTasks):
    """Create a custom order → Service Desk ticket with full context."""
    db = get_db()

    now = datetime.now(timezone.utc).isoformat()
    order_id = f"CO-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{req.pet_name[:3].upper() if req.pet_name else 'PET'}"

    # Build the custom order document
    order = {
        "order_id": order_id,
        "status": "pending_review",
        "product": {
            "id": req.product_id,
            "name": req.product_name,
            "type": req.product_type,
            "image": req.product_image,
            "pillar": req.pillar,
        },
        "pet": {
            "id": req.pet_id,
            "name": req.pet_name,
            "breed": req.pet_breed,
            "birthday": req.pet_birthday,
            "archetype": req.pet_archetype,
        },
        "customer": {
            "email": req.customer_email,
            "name": req.customer_name,
            "phone": req.customer_phone,
        },
        "photo_urls": req.photo_urls,
        "personalisation_notes": req.personalisation_notes,
        "special_text": req.special_text,
        "delivery_address": req.delivery_address,
        "source": req.source,
        "created_at": now,
        "updated_at": now,
    }

    # Save to custom_orders collection
    await db.custom_orders.insert_one({**order})

    # ── Create Service Desk Ticket ────────────────────────────────────────
    photos_text = "\n".join([f"  - {url}" for url in req.photo_urls]) if req.photo_urls else "  (no photos uploaded)"
    ticket_description = f"""CUSTOM ORDER REQUEST — {order_id}

Product: {req.product_name} ({req.product_type})
Pillar: {req.pillar}

Pet: {req.pet_name} ({req.pet_breed})
Birthday: {req.pet_birthday or 'Not specified'}
Archetype: {req.pet_archetype or 'Not determined'}

Customer: {req.customer_name} ({req.customer_email})
Phone: {req.customer_phone or 'Not provided'}

Personalisation Notes:
  {req.personalisation_notes or 'None'}

Special Text for Product:
  {req.special_text or 'None'}

Delivery Address:
  {req.delivery_address or 'To be confirmed'}

Pet Photos (Production Quality):
{photos_text}

Product Reference Image: {req.product_image or 'N/A'}

Source: {req.source}
"""

    ticket = {
        "ticket_id": f"TKT-{order_id}",
        "type": "custom_order",
        "status": "open",
        "priority": "high",
        "subject": f"Custom Order: {req.product_name} for {req.pet_name}",
        "description": ticket_description,
        "customer_email": req.customer_email,
        "customer_name": req.customer_name,
        "pet_name": req.pet_name,
        "pet_id": req.pet_id,
        "order_id": order_id,
        "photo_urls": req.photo_urls,
        "product_ref": req.product_image,
        "pillar": req.pillar,
        "channel": "app",
        "created_at": now,
        "updated_at": now,
        "tags": ["custom_order", req.pillar, req.product_type],
        "metadata": {
            "product_id": req.product_id,
            "product_type": req.product_type,
            "personalisation_notes": req.personalisation_notes,
            "special_text": req.special_text,
        }
    }
    await db.service_desk_tickets.insert_one({**ticket})

    # ── Send confirmation email (background) ──────────────────────────────
    background_tasks.add_task(_send_order_confirmation_email, db, order, ticket["ticket_id"])

    return {
        "success": True,
        "order_id": order_id,
        "ticket_id": ticket["ticket_id"],
        "message": f"Your custom order for {req.product_name} has been placed! Our concierge team will review it shortly.",
        "status": "pending_review",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# GET USER'S CUSTOM ORDERS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("")
async def get_custom_orders(
    email: str = "",
    pet_id: str = "",
    status: str = "",
    limit: int = 20,
    skip: int = 0
):
    """Get custom orders, optionally filtered by email, pet, or status."""
    db = get_db()
    query = {}
    if email:
        query["customer.email"] = email
    if pet_id:
        query["pet.id"] = pet_id
    if status:
        query["status"] = status

    orders = await db.custom_orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.custom_orders.count_documents(query)
    return {"orders": orders, "total": total}


@router.get("/{order_id}")
async def get_custom_order(order_id: str):
    """Get a single custom order by order_id."""
    db = get_db()
    order = await db.custom_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN: UPDATE ORDER STATUS
# ═══════════════════════════════════════════════════════════════════════════════

@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, body: dict):
    """Admin: update custom order status + sync with service desk ticket."""
    db = get_db()
    new_status = body.get("status", "")
    admin_notes = body.get("admin_notes", "")
    price_estimate = body.get("price_estimate", "")
    delivery_estimate = body.get("delivery_estimate", "")

    if not new_status:
        raise HTTPException(status_code=400, detail="Status required")

    now = datetime.now(timezone.utc).isoformat()
    update = {"status": new_status, "updated_at": now}
    if admin_notes:
        update["admin_notes"] = admin_notes
    if price_estimate:
        update["price_estimate"] = price_estimate
    if delivery_estimate:
        update["delivery_estimate"] = delivery_estimate

    result = await db.custom_orders.update_one(
        {"order_id": order_id},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    # Sync ticket status
    ticket_status_map = {
        "pending_review": "open",
        "in_production": "in_progress",
        "ready_for_delivery": "resolved",
        "delivered": "closed",
        "cancelled": "closed",
    }
    ticket_status = ticket_status_map.get(new_status, "open")
    await db.service_desk_tickets.update_one(
        {"order_id": order_id},
        {"$set": {"status": ticket_status, "updated_at": now}}
    )

    return {"success": True, "order_id": order_id, "status": new_status}


# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL CONFIRMATION (background task)
# ═══════════════════════════════════════════════════════════════════════════════

async def _send_order_confirmation_email(db, order: dict, ticket_id: str):
    """Send order confirmation email via Resend (if configured)."""
    resend_key = os.environ.get("RESEND_API_KEY")
    if not resend_key:
        logger.info("[CUSTOM-ORDER] Resend not configured, skipping email")
        return

    try:
        import resend
        resend.api_key = resend_key

        pet = order.get("pet", {})
        product = order.get("product", {})
        customer = order.get("customer", {})

        html = f"""
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1A0030, #2D1B69); padding: 32px; border-radius: 16px 16px 0 0;">
                <h1 style="color: #F0C060; margin: 0; font-size: 24px;">Your Custom Order is Confirmed!</h1>
                <p style="color: #E8D5F5; margin: 8px 0 0; font-size: 14px;">Order {order['order_id']} — Ticket {ticket_id}</p>
            </div>
            <div style="padding: 24px; background: #FDFBF7; border: 1px solid #F0E8E0; border-top: none; border-radius: 0 0 16px 16px;">
                <h2 style="color: #1A0030; font-size: 18px; margin: 0 0 16px;">
                    {product.get('name', 'Custom Product')} for {pet.get('name', 'your pet')}
                </h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 8px 0; color: #888;">Pet</td><td style="padding: 8px 0;">{pet.get('name')} ({pet.get('breed')})</td></tr>
                    <tr><td style="padding: 8px 0; color: #888;">Product</td><td style="padding: 8px 0;">{product.get('name')}</td></tr>
                    <tr><td style="padding: 8px 0; color: #888;">Notes</td><td style="padding: 8px 0;">{order.get('personalisation_notes', '-')}</td></tr>
                    <tr><td style="padding: 8px 0; color: #888;">Photos</td><td style="padding: 8px 0;">{len(order.get('photo_urls', []))} uploaded</td></tr>
                </table>
                <div style="margin-top: 24px; padding: 16px; background: #F0E8FF; border-radius: 12px;">
                    <p style="margin: 0; color: #6B21A8; font-size: 14px; font-weight: 600;">What happens next?</p>
                    <p style="margin: 8px 0 0; color: #7C3AED; font-size: 13px;">Our concierge team will review your order and reach out within 24 hours with pricing and delivery details.</p>
                </div>
            </div>
        </div>
        """

        resend.Emails.send({
            "from": os.environ.get("RESEND_FROM_EMAIL", "TDC <hello@thedoggycompany.in>"),
            "to": [customer.get("email")],
            "subject": f"Custom Order Confirmed — {product.get('name')} for {pet.get('name')}",
            "html": html,
        })
        logger.info(f"[CUSTOM-ORDER] Confirmation email sent to {customer.get('email')}")
    except Exception as e:
        logger.error(f"[CUSTOM-ORDER] Email failed: {e}")
