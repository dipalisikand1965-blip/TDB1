"""
Product Checkout & Payment Routes
Handles:
- Razorpay payment for product orders
- GST calculation (18%)
- PDF invoice generation
- Order confirmation emails
"""

import os
import logging
import uuid
from email_templates import get_email_template, detail_box, detail_row
import io
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
import razorpay
import resend

# PDF generation
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

logger = logging.getLogger(__name__)

# Create router
checkout_router = APIRouter(prefix="/api/checkout", tags=["Checkout"])

# Database reference
db = None

def set_checkout_db(database):
    global db
    db = database

# Razorpay client
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    try:
        razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    except Exception as e:
        logger.warning(f"Razorpay client initialization failed: {e}")

# GST Configuration
GST_RATE = 0.18  # 18% GST for pet products in India
CGST_RATE = 0.09  # Central GST
SGST_RATE = 0.09  # State GST (same state)
IGST_RATE = 0.18  # Integrated GST (different state)

# Business details for invoices
BUSINESS_DETAILS = {
    "name": "The Doggy Company",
    "legal_name": "The Doggy Company Pvt Ltd",
    "gstin": "29AABCT1332L1ZC",  # Placeholder - update with real GSTIN
    "pan": "AABCT1332L",
    "address": "147, 8th Main Rd, 3rd Block, Koramangala, Bengaluru 560034",
    "email": "woof@thedoggycompany.com",
    "phone": "+91 89717 02582",
    "state": "Karnataka",
    "state_code": "29"
}

# Resend Email Configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.com")

# ==================== MODELS ====================

class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    size: Optional[str] = None
    flavor: Optional[str] = None
    category: Optional[str] = None
    hsn_code: Optional[str] = "2309"  # HSN code for pet food


class CustomerDetails(BaseModel):
    name: str
    email: str  # Changed from EmailStr to allow more flexibility
    phone: str
    whatsapp: Optional[str] = None


class DeliveryDetails(BaseModel):
    method: str  # 'delivery' or 'pickup'
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = "Karnataka"
    pincode: Optional[str] = None
    landmark: Optional[str] = None


class CreateOrderRequest(BaseModel):
    customer: CustomerDetails
    delivery: DeliveryDetails
    items: List[CartItem]
    pet_name: Optional[str] = None
    pet_breed: Optional[str] = None
    subtotal: float
    shipping_fee: float = 0
    discount_amount: float = 0
    discount_code: Optional[str] = None
    loyalty_points_used: int = 0
    loyalty_discount: float = 0
    special_instructions: Optional[str] = None
    is_gift: bool = False
    gift_message: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str


# ==================== EMAIL FUNCTIONS ====================

async def send_order_confirmation_email(order: dict) -> bool:
    """Send order confirmation email to customer"""
    if not RESEND_API_KEY:
        logger.warning("Resend API key not configured - skipping email")
        return False
    
    try:
        resend.api_key = RESEND_API_KEY
        
        customer = order.get("customer", {})
        customer_email = customer.get("email")
        customer_name = customer.get("name", "Customer")
        
        if not customer_email or "@" not in customer_email:
            logger.warning(f"Invalid customer email: {customer_email}")
            return False
        
        order_id = order.get("order_id", "N/A")
        pricing = order.get("pricing", {})
        items = order.get("items", [])
        
        # Build order rows for detail box
        items_rows = ""
        for item in items:
            item_total = item.get("price", 0) * item.get("quantity", 1)
            items_rows += detail_row(
                f"{item.get('name', 'Item')} × {item.get('quantity', 1)}",
                f"₹{item_total:.2f}"
            )

        pricing_rows = (
            detail_row("Subtotal", f"₹{pricing.get('subtotal', 0):.2f}") +
            detail_row("Shipping", "FREE" if pricing.get("shipping_fee", 0) == 0 else f"₹{pricing.get('shipping_fee', 0):.2f}") +
            detail_row("GST", f"₹{pricing.get('gst_details', {}).get('total_tax', pricing.get('gst_amount', pricing.get('total_gst', 0))):.2f}") +
            detail_row("Total Paid", f"₹{pricing.get('grand_total', 0):.2f}")
        )

        html_content = get_email_template(
            title="Order Confirmed",
            tagline="✦ We're preparing your order with love",
            body_html=(
                f"<p>Hi {customer_name},</p>"
                f"<p>Your payment was successful! We're preparing your treats right now.</p>"
                + detail_box("Order Summary",
                    detail_row("Order ID", order_id) +
                    items_rows + pricing_rows
                ) +
                f"<p style='font-size:13px;color:#666;'>"
                f"You'll receive shipping updates on WhatsApp. "
                f"For any questions, <a href='https://wa.me/918971702582' style='color:#DAA520;'>WhatsApp us</a> or reply to this email.</p>"
            ),
            cta_text="Download Invoice →",
            cta_url=f"https://thedoggycompany.com/api/checkout/order/{order_id}/invoice/pdf",
        )
        
        params = {
            "from": f"THEDOGGYCOMPANY <{SENDER_EMAIL}>",
            "to": customer_email,
            "subject": f"Order Confirmed! #{order_id} 🐕",
            "html": html_content
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Order confirmation email sent to {customer_email}: {response}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send order confirmation email: {e}")
        return False


# ==================== GST CALCULATION ====================

def calculate_gst(subtotal: float, customer_state: str = "Karnataka") -> Dict[str, Any]:
    """Calculate GST based on customer location"""
    # Determine if same state or different state
    is_same_state = customer_state.lower() == BUSINESS_DETAILS["state"].lower()
    
    # Calculate GST
    taxable_amount = subtotal
    
    if is_same_state:
        # CGST + SGST for same state
        cgst = round(taxable_amount * CGST_RATE, 2)
        sgst = round(taxable_amount * SGST_RATE, 2)
        total_tax = cgst + sgst
        
        return {
            "taxable_amount": taxable_amount,
            "cgst_rate": CGST_RATE * 100,
            "cgst_amount": cgst,
            "sgst_rate": SGST_RATE * 100,
            "sgst_amount": sgst,
            "igst_rate": 0,
            "igst_amount": 0,
            "total_tax": total_tax,
            "is_same_state": True,
            "gst_type": "CGST+SGST"
        }
    else:
        # IGST for different state
        igst = round(taxable_amount * IGST_RATE, 2)
        
        return {
            "taxable_amount": taxable_amount,
            "cgst_rate": 0,
            "cgst_amount": 0,
            "sgst_rate": 0,
            "sgst_amount": 0,
            "igst_rate": IGST_RATE * 100,
            "igst_amount": igst,
            "total_tax": igst,
            "is_same_state": False,
            "gst_type": "IGST"
        }


# ==================== ENDPOINTS ====================

@checkout_router.get("/config")
async def get_checkout_config():
    """Get checkout configuration including Razorpay key"""
    return {
        "razorpay_key_id": RAZORPAY_KEY_ID if RAZORPAY_KEY_ID != "rzp_test_placeholder" else None,
        "razorpay_enabled": razorpay_client is not None,
        "gst_rate": GST_RATE * 100,
        "free_shipping_threshold": 3000,
        "default_shipping_fee": 150,
        "business_name": BUSINESS_DETAILS["name"],
        "payment_methods": ["razorpay", "upi", "card", "netbanking"],
        "cod_enabled": False,  # No COD as per user requirement
        "store_pickup_enabled": True
    }


@checkout_router.post("/calculate-total")
async def calculate_order_total(request: CreateOrderRequest):
    """Calculate order total with GST breakdown
    GST is calculated on (subtotal - discount + shipping)
    """
    
    # Base calculations
    subtotal = request.subtotal
    shipping = request.shipping_fee
    discount = request.discount_amount + request.loyalty_discount
    
    # Calculate taxable amount (subtotal - discount + shipping)
    # GST applies to total including shipping
    taxable_amount = max(0, subtotal - discount + shipping)
    gst_details = calculate_gst(taxable_amount, request.delivery.state or "Karnataka")
    
    # Final total = taxable_amount + GST
    total_tax = gst_details["total_tax"]
    grand_total = taxable_amount + total_tax
    
    return {
        "subtotal": subtotal,
        "discount": discount,
        "shipping": shipping,
        "taxable_amount": taxable_amount,
        "gst_details": gst_details,
        "grand_total": round(grand_total, 2),
        "breakdown": {
            "items_total": subtotal,
            "discount_applied": discount,
            "after_discount": subtotal - discount,
            "shipping_fee": shipping,
            "taxable_total": taxable_amount,
            "gst": total_tax,
            "you_pay": round(grand_total, 2)
        }
    }


@checkout_router.post("/create-order")
async def create_checkout_order(request: CreateOrderRequest):
    """Create order and initiate Razorpay payment"""
    
    logger.info(f"[create-order] Starting order creation for customer: {request.customer.email}")
    
    if not razorpay_client:
        logger.info("[create-order] Razorpay not configured, falling back to WhatsApp")
        # Fallback to WhatsApp flow if Razorpay not configured
        return await create_whatsapp_order(request)
    
    try:
        # Calculate totals with GST (GST applies to subtotal - discount + shipping)
        subtotal = request.subtotal
        discount = request.discount_amount + request.loyalty_discount
        shipping = request.shipping_fee
        
        logger.info(f"[create-order] Subtotal: {subtotal}, Discount: {discount}, Shipping: {shipping}")
        
        # Taxable amount includes shipping (GST applies to shipping too)
        taxable_amount = max(0, subtotal - discount + shipping)
        gst_details = calculate_gst(taxable_amount, request.delivery.state or "Karnataka")
        
        # Grand total = taxable_amount + GST
        grand_total = round(taxable_amount + gst_details["total_tax"], 2)
        
        logger.info(f"[create-order] Taxable: {taxable_amount}, GST: {gst_details['total_tax']}, Grand Total: {grand_total}")
        
        # Generate order ID
        order_id = f"TDC-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Create Razorpay order
        razorpay_amount = int(grand_total * 100)  # Convert to paise
        
        logger.info(f"[create-order] Creating Razorpay order for amount: {razorpay_amount} paise")
        
        razorpay_order = razorpay_client.order.create({
            "amount": razorpay_amount,
            "currency": "INR",
            "receipt": order_id,
            "notes": {
                "order_id": order_id,
                "customer_email": request.customer.email,
                "customer_phone": request.customer.phone
            }
        })
        
        logger.info(f"[create-order] Razorpay order created: {razorpay_order['id']}")
        
        # Save order to database (pending payment)
        order_doc = {
            "order_id": order_id,
            "razorpay_order_id": razorpay_order["id"],
            "customer": {
                "name": request.customer.name,
                "email": request.customer.email,
                "phone": request.customer.phone,
                "whatsapp": request.customer.whatsapp or request.customer.phone
            },
            "pet": {
                "name": request.pet_name,
                "breed": request.pet_breed
            },
            "delivery": {
                "method": request.delivery.method,
                "address": request.delivery.address,
                "city": request.delivery.city,
                "state": request.delivery.state,
                "pincode": request.delivery.pincode,
                "landmark": request.delivery.landmark
            },
            "items": [item.dict() for item in request.items],
            "pricing": {
                "subtotal": subtotal,
                "discount_amount": request.discount_amount,
                "discount_code": request.discount_code,
                "loyalty_points_used": request.loyalty_points_used,
                "loyalty_discount": request.loyalty_discount,
                "taxable_amount": taxable_amount,
                "gst_details": gst_details,
                "shipping_fee": shipping,
                "grand_total": grand_total
            },
            "total_amount": grand_total,   # top-level for admin display
            "special_instructions": request.special_instructions,
            "is_gift": request.is_gift,
            "gift_message": request.gift_message,
            "status": "pending",
            "payment_status": "pending",
            "payment_method": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.orders.insert_one(order_doc)
        
        return {
            "success": True,
            "order_id": order_id,
            "razorpay_order_id": razorpay_order["id"],
            "razorpay_key_id": RAZORPAY_KEY_ID,
            "amount": razorpay_amount,
            "amount_display": grand_total,
            "currency": "INR",
            "prefill": {
                "name": request.customer.name,
                "email": request.customer.email,
                "contact": request.customer.phone
            },
            "gst_details": gst_details,
            "notes": {
                "order_id": order_id
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to create Razorpay order: {e}")
        raise HTTPException(status_code=500, detail=f"Payment initialization failed: {str(e)}")


async def create_whatsapp_order(request: CreateOrderRequest):
    """Fallback: Create order for WhatsApp flow (no Razorpay)"""
    order_id = f"TDC-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    # Calculate totals
    subtotal = request.subtotal
    discount = request.discount_amount + request.loyalty_discount
    taxable_amount = max(0, subtotal - discount)
    gst_details = calculate_gst(taxable_amount, request.delivery.state or "Karnataka")
    shipping = request.shipping_fee
    grand_total = round(taxable_amount + gst_details["total_tax"] + shipping, 2)
    
    # Save order
    order_doc = {
        "order_id": order_id,
        "customer": request.customer.dict(),
        "pet": {"name": request.pet_name, "breed": request.pet_breed},
        "delivery": request.delivery.dict(),
        "items": [item.dict() for item in request.items],
        "pricing": {
            "subtotal": subtotal,
            "discount_amount": request.discount_amount + request.loyalty_discount,
            "taxable_amount": taxable_amount,
            "gst_details": gst_details,
            "shipping_fee": shipping,
            "grand_total": grand_total
        },
        "status": "pending",
        "payment_status": "pending",
        "payment_method": "whatsapp_payment_link",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    return {
        "success": True,
        "order_id": order_id,
        "razorpay_enabled": False,
        "fallback_to_whatsapp": True,
        "amount_display": grand_total,
        "gst_details": gst_details,
        "message": "Razorpay not configured. Order saved for WhatsApp payment."
    }


@checkout_router.post("/verify-payment")
async def verify_payment(request: VerifyPaymentRequest):
    """Verify Razorpay payment signature and update order"""
    
    if not razorpay_client:
        raise HTTPException(status_code=400, detail="Razorpay not configured")
    
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay secret not configured")
    
    try:
        # Verify signature using razorpay SDK (preferred — uses the same HMAC-SHA256 internally)
        try:
            razorpay_client.utility.verify_payment_signature({
                'razorpay_order_id': request.razorpay_order_id,
                'razorpay_payment_id': request.razorpay_payment_id,
                'razorpay_signature': request.razorpay_signature
            })
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Get payment details from Razorpay
        payment = razorpay_client.payment.fetch(request.razorpay_payment_id)
        
        # Update order in database
        update_data = {
            "payment_status": "paid",
            "status": "confirmed",
            "razorpay_payment_id": request.razorpay_payment_id,
            "payment_method": payment.get("method", "unknown"),
            "payment_details": {
                "method": payment.get("method"),
                "card_type": payment.get("card", {}).get("type") if payment.get("card") else None,
                "bank": payment.get("bank"),
                "wallet": payment.get("wallet"),
                "vpa": payment.get("vpa"),  # UPI ID
                "paid_at": datetime.now(timezone.utc).isoformat()
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = await db.orders.update_one(
            {"order_id": request.order_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            logger.warning(f"Order {request.order_id} not found for payment update")
        
        # Get updated order
        order = await db.orders.find_one({"order_id": request.order_id}, {"_id": 0})
        
        # Send order confirmation email
        if order:
            await send_order_confirmation_email(order)

        # ── Create service desk ticket + admin bell notification ──────────────
        # This makes the order visible in: Admin Service Desk, My Requests page
        if order:
            try:
                _customer   = order.get("customer", {})
                _pricing    = order.get("pricing", {})
                _pet        = order.get("pet", {})
                _items      = order.get("items", [])
                _delivery   = order.get("delivery", {})
                _order_id   = order.get("order_id", request.order_id)
                _now_iso    = datetime.now(timezone.utc).isoformat()
                _sd_id      = f"ORD-{_order_id[-8:].upper()}" if _order_id else f"ORD-{uuid.uuid4().hex[:8].upper()}"
                _items_summary = ", ".join([f"{i.get('name','Item')} ×{i.get('quantity',1)}" for i in _items])
                _items_lines   = "\n".join([
                    f"  • {i.get('name','?')} ×{i.get('quantity',1)} — ₹{i.get('price',0)}"
                    for i in _items
                ])
                _gst_total = _pricing.get("gst_details", {}).get("total_tax", 0)
                _briefing = (
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"  🛒 SHOP ORDER — RAZORPAY PAID ✅\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                    f"🧾 Order ID: {_order_id}\n"
                    f"📦 Items:\n{_items_lines}\n\n"
                    f"💰 Subtotal: ₹{_pricing.get('subtotal', 0):.2f}  |  "
                    f"Shipping: ₹{_pricing.get('shipping_fee', 0):.2f}  |  "
                    f"GST: ₹{_gst_total:.2f}  |  "
                    f"Total: ₹{_pricing.get('grand_total', 0):.2f}\n"
                    f"💳 Payment: PAID via Razorpay\n"
                    f"👤 Customer: {_customer.get('name','?')} | {_customer.get('email','?')} | {_customer.get('phone','?')}\n"
                    f"🐾 Pet: {_pet.get('name','?')} ({_pet.get('breed','?')})\n"
                    f"📍 Delivery: {_delivery.get('address','?')}, {_delivery.get('city','?')} — {_delivery.get('method','delivery').upper()}\n"
                    f"📝 Instructions: {order.get('special_instructions') or 'None'}\n"
                )
                _sd_ticket = {
                    "id":               _sd_id,
                    "ticket_id":        _sd_id,
                    "channel":          "web",
                    "category":         "shop",
                    "request_type":     "product_order",
                    "status":           "open",
                    "priority":         "normal",
                    "subject":          f"Shop Order — {_items_summary[:60]}",
                    "order_id":         _order_id,
                    "customer_name":    _customer.get("name"),
                    "customer_email":   _customer.get("email"),
                    "customer_phone":   _customer.get("phone"),
                    "user_email":       _customer.get("email"),
                    "member": {
                        "name":  _customer.get("name"),
                        "email": _customer.get("email"),
                        "phone": _customer.get("phone"),
                    },
                    "pet_name":         _pet.get("name"),
                    "pet_breed":        _pet.get("breed"),
                    "pillar":           "shop",
                    "items":            _items,
                    "items_summary":    _items_summary,
                    "total":            _pricing.get("grand_total"),
                    "delivery":         _delivery,
                    "special_instructions": order.get("special_instructions"),
                    "description":      _briefing,
                    "conversation": [{
                        "sender":     "mira",
                        "source":     "order_briefing",
                        "is_briefing": True,
                        "text":       _briefing,
                        "timestamp":  _now_iso,
                    }],
                    "messages":      [],
                    "activity_log":  [{"event": "payment_confirmed", "at": _now_iso}],
                    "created_at":    _now_iso,
                    "updated_at":    _now_iso,
                }
                await db.service_desk_tickets.insert_one(_sd_ticket)
                _sd_ticket.pop("_id", None)
                # Admin bell notification
                await db.admin_notifications.insert_one({
                    "id":        f"notif-{uuid.uuid4().hex[:12]}",
                    "type":      "order",
                    "title":     f"🛒 Paid Order #{_order_id}",
                    "message":   f"{_customer.get('name','Customer')} • {len(_items)} item(s) • ₹{_pricing.get('grand_total', 0):.0f} • PAID ✅",
                    "category":  "shop",
                    "related_id": _sd_id,
                    "link_to":   f"/admin?tab=servicedesk&ticket={_sd_id}",
                    "priority":  "high",
                    "metadata": {
                        "order_id":      _order_id,
                        "customer_name": _customer.get("name"),
                        "customer_email": _customer.get("email"),
                        "total":         _pricing.get("grand_total"),
                        "items_count":   len(_items),
                    },
                    "read":       False,
                    "created_at": _now_iso,
                })
                logger.info(f"✅ Service desk ticket {_sd_id} + admin notification created for order {_order_id}")
            except Exception as _e:
                logger.error(f"[ORDER SD] Failed to create service desk ticket: {_e}", exc_info=True)

        # ═══════════════════════════════════════════════════════════════════════
        # TRAIT GRAPH UPDATE - Per MOJO Bible Part 7 §4
        # "When purchases complete: update traits (food preferences, etc.)"
        # ═══════════════════════════════════════════════════════════════════════
        mojo_updated = False
        if order and order.get("pet", {}).get("id"):
            try:
                from trait_graph_service import on_order_placed
                trait_result = await on_order_placed(db, order)
                mojo_updated = trait_result.get("success", False)
                if mojo_updated:
                    logger.info(f"[TRAIT-GRAPH] ✅ MOJO updated from purchase: {request.order_id}")
            except Exception as e:
                logger.warning(f"[TRAIT-GRAPH] Error updating MOJO from purchase: {e}")
        
        return {
            "success": True,
            "order_id": request.order_id,
            "payment_status": "paid",
            "payment_method": payment.get("method"),
            "message": "Payment verified successfully",
            "mojo_updated": mojo_updated
        }
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment signature verification failed")
    except Exception as e:
        logger.error(f"Payment verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@checkout_router.get("/order/{order_id}")
async def get_order_details(order_id: str):
    """Get order details including invoice data"""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Add business details for invoice
    order["business_details"] = BUSINESS_DETAILS
    
    return order


@checkout_router.get("/order/{order_id}/invoice")
async def get_invoice_data(order_id: str):
    """Get complete invoice data for PDF generation"""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Generate invoice number
    invoice_number = f"INV-{order_id}"
    invoice_date = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    
    return {
        "invoice_number": invoice_number,
        "invoice_date": invoice_date,
        "order_id": order_id,
        "order_date": order.get("created_at", ""),
        "business": BUSINESS_DETAILS,
        "customer": order.get("customer", {}),
        "delivery": order.get("delivery", {}),
        "items": order.get("items", []),
        "pricing": order.get("pricing", {}),
        "payment": {
            "status": order.get("payment_status", "pending"),
            "method": order.get("payment_method"),
            "details": order.get("payment_details", {})
        },
        "notes": order.get("special_instructions", ""),
        "terms": [
            "All products are freshly made and non-refundable once dispatched.",
            "For any issues, contact us within 24 hours of delivery.",
            "GST is charged as per applicable rates."
        ]
    }


@checkout_router.get("/discount/validate")
async def validate_discount_code(code: str, subtotal: float):
    """Validate discount code and calculate discount amount"""
    if not code:
        raise HTTPException(status_code=400, detail="Discount code required")
    
    # Check discount codes collection
    discount = await db.discount_codes.find_one({
        "code": code.upper(),
        "is_active": True,
        "valid_from": {"$lte": datetime.now(timezone.utc).isoformat()},
        "$or": [
            {"valid_until": {"$gte": datetime.now(timezone.utc).isoformat()}},
            {"valid_until": None}
        ]
    })
    
    if not discount:
        raise HTTPException(status_code=400, detail="Invalid or expired discount code")
    
    # Check minimum order value
    if discount.get("min_order_value", 0) > subtotal:
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum order value of ₹{discount['min_order_value']} required"
        )
    
    # Calculate discount
    if discount.get("discount_type") == "percentage":
        discount_amount = min(
            subtotal * (discount["discount_value"] / 100),
            discount.get("max_discount", float('inf'))
        )
    else:
        discount_amount = min(discount["discount_value"], subtotal)
    
    return {
        "valid": True,
        "code": code.upper(),
        "discount_type": discount.get("discount_type"),
        "discount_value": discount.get("discount_value"),
        "discount_amount": round(discount_amount, 2),
        "description": discount.get("description", ""),
        "min_order_value": discount.get("min_order_value", 0)
    }



# ==================== PDF INVOICE GENERATION ====================

def generate_invoice_pdf(order: dict) -> io.BytesIO:
    """Generate a professional PDF invoice for an order"""
    buffer = io.BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )
    
    # Styles
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='InvoiceTitle',
        fontSize=24,
        leading=28,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#7c3aed'),
        fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='CompanyName',
        fontSize=18,
        leading=22,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='SectionHeader',
        fontSize=12,
        leading=14,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#374151')
    ))
    styles.add(ParagraphStyle(
        name='SmallText',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#6b7280')
    ))
    
    elements = []
    
    # Header
    elements.append(Paragraph("🐕 THE DOGGY COMPANY", styles['CompanyName']))
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("TAX INVOICE", styles['InvoiceTitle']))
    elements.append(Spacer(1, 10*mm))
    
    # Invoice details
    invoice_number = f"INV-{order.get('order_id', 'N/A')}"
    order_date = order.get('created_at', '')
    if order_date:
        try:
            dt = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
            order_date = dt.strftime('%d %B %Y')
        except Exception:
            pass
    
    invoice_info = [
        ['Invoice Number:', invoice_number],
        ['Invoice Date:', datetime.now().strftime('%d %B %Y')],
        ['Order ID:', order.get('order_id', 'N/A')],
        ['Order Date:', order_date or 'N/A']
    ]
    
    invoice_table = Table(invoice_info, colWidths=[100, 200])
    invoice_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(invoice_table)
    elements.append(Spacer(1, 10*mm))
    
    # Seller & Buyer Info
    seller_info = [
        ['FROM (Seller)', 'TO (Buyer)'],
        [BUSINESS_DETAILS['legal_name'], order.get('customer', {}).get('name', 'N/A')],
        [BUSINESS_DETAILS['address'], order.get('delivery', {}).get('address', 'N/A')],
        [f"GSTIN: {BUSINESS_DETAILS['gstin']}", f"{order.get('delivery', {}).get('city', '')}, {order.get('delivery', {}).get('state', '')}"],
        [f"Email: {BUSINESS_DETAILS['email']}", f"Pin: {order.get('delivery', {}).get('pincode', '')}"],
        [f"Phone: {BUSINESS_DETAILS['phone']}", f"Phone: {order.get('customer', {}).get('phone', '')}"],
    ]
    
    seller_table = Table(seller_info, colWidths=[260, 260])
    seller_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#374151')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#9333ea')),
    ]))
    elements.append(seller_table)
    elements.append(Spacer(1, 10*mm))
    
    # Items table
    items = order.get('items', [])
    pricing = order.get('pricing', {})
    gst_details = pricing.get('gst_details', {})
    
    # Table header
    table_data = [['#', 'Description', 'HSN', 'Qty', 'Rate', 'Amount']]
    
    for idx, item in enumerate(items, 1):
        item_total = item.get('price', 0) * item.get('quantity', 1)
        table_data.append([
            str(idx),
            f"{item.get('name', 'Item')}\n{item.get('size', '')} {item.get('flavor', '')}".strip(),
            item.get('hsn_code', '2309'),
            str(item.get('quantity', 1)),
            f"₹{item.get('price', 0):.2f}",
            f"₹{item_total:.2f}"
        ])
    
    items_table = Table(table_data, colWidths=[25, 220, 50, 40, 70, 80])
    items_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c3aed')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#374151')),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('ALIGN', (4, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 5*mm))
    
    # Totals section
    subtotal = pricing.get('subtotal', 0)
    discount = pricing.get('discount_amount', 0) + pricing.get('loyalty_discount', 0)
    taxable = pricing.get('taxable_amount', subtotal - discount)
    shipping = pricing.get('shipping_fee', 0)
    grand_total = pricing.get('grand_total', taxable + shipping)
    
    totals_data = [
        ['', 'Subtotal:', f"₹{subtotal:.2f}"],
    ]
    
    if discount > 0:
        totals_data.append(['', 'Discount:', f"-₹{discount:.2f}"])
    
    # Show shipping BEFORE taxable so the arithmetic is clear:
    # Subtotal (±Discount) + Shipping = Taxable Amount → GST → Grand Total
    if shipping > 0:
        totals_data.append(['', 'Shipping & Handling:', f"₹{shipping:.2f}"])
    else:
        totals_data.append(['', 'Shipping & Handling:', 'FREE'])
    
    totals_data.append(['', 'Taxable Amount (incl. shipping):', f"₹{taxable:.2f}"])
    
    # GST breakdown
    if gst_details.get('is_same_state'):
        totals_data.append(['', f"CGST @ {gst_details.get('cgst_rate', 9)}%:", f"₹{gst_details.get('cgst_amount', 0):.2f}"])
        totals_data.append(['', f"SGST @ {gst_details.get('sgst_rate', 9)}%:", f"₹{gst_details.get('sgst_amount', 0):.2f}"])
    else:
        totals_data.append(['', f"IGST @ {gst_details.get('igst_rate', 18)}%:", f"₹{gst_details.get('igst_amount', 0):.2f}"])
    
    totals_data.append(['', 'Grand Total:', f"₹{grand_total:.2f}"])
    
    totals_table = Table(totals_data, colWidths=[280, 120, 100])
    totals_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -2), 9),
        ('FONTNAME', (1, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('TEXTCOLOR', (1, -1), (-1, -1), colors.HexColor('#7c3aed')),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, -1), (-1, -1), 8),
        ('LINEABOVE', (1, -1), (-1, -1), 1, colors.HexColor('#7c3aed')),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 15*mm))
    
    # Footer
    elements.append(Paragraph("Terms & Conditions:", styles['SectionHeader']))
    elements.append(Spacer(1, 2*mm))
    terms = [
        "1. All products are freshly made and non-refundable once dispatched.",
        "2. For any issues, please contact us within 24 hours of delivery.",
        "3. GST is charged as per applicable rates.",
        "4. This is a computer-generated invoice and does not require a signature."
    ]
    for term in terms:
        elements.append(Paragraph(term, styles['SmallText']))
        elements.append(Spacer(1, 1*mm))
    
    elements.append(Spacer(1, 10*mm))
    elements.append(Paragraph("Thank you for shopping with The Doggy Company! 🐾", 
                              ParagraphStyle('ThankYou', fontSize=11, alignment=TA_CENTER, textColor=colors.HexColor('#7c3aed'))))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer


@checkout_router.get("/order/{order_id}/invoice/pdf")
async def download_invoice_pdf(order_id: str):
    """Download invoice as PDF"""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Generate PDF
    pdf_buffer = generate_invoice_pdf(order)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Invoice-{order_id}.pdf"
        }
    )
