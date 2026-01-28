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
import hmac
import hashlib
import uuid
import io
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
import razorpay

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
    "legal_name": "The Doggy Bakery Pvt Ltd",
    "gstin": "29AABCT1332L1ZC",  # Placeholder - update with real GSTIN
    "pan": "AABCT1332L",
    "address": "147, 8th Main Rd, 3rd Block, Koramangala, Bengaluru 560034",
    "email": "billing@thedoggybakery.in",
    "phone": "+91 9663185747",
    "state": "Karnataka",
    "state_code": "29"
}

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
    email: EmailStr
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
    """Calculate order total with GST breakdown"""
    
    # Base calculations
    subtotal = request.subtotal
    shipping = request.shipping_fee
    discount = request.discount_amount + request.loyalty_discount
    
    # Calculate GST on subtotal (after discount, before shipping)
    taxable_amount = max(0, subtotal - discount)
    gst_details = calculate_gst(taxable_amount, request.delivery.state or "Karnataka")
    
    # Final total
    total_before_tax = taxable_amount
    total_tax = gst_details["total_tax"]
    grand_total = total_before_tax + total_tax + shipping
    
    return {
        "subtotal": subtotal,
        "discount": discount,
        "taxable_amount": taxable_amount,
        "gst_details": gst_details,
        "shipping": shipping,
        "grand_total": round(grand_total, 2),
        "breakdown": {
            "items_total": subtotal,
            "discount_applied": discount,
            "after_discount": taxable_amount,
            "gst": total_tax,
            "shipping_fee": shipping,
            "you_pay": round(grand_total, 2)
        }
    }


@checkout_router.post("/create-order")
async def create_checkout_order(request: CreateOrderRequest):
    """Create order and initiate Razorpay payment"""
    
    if not razorpay_client:
        # Fallback to WhatsApp flow if Razorpay not configured
        return await create_whatsapp_order(request)
    
    try:
        # Calculate totals with GST
        subtotal = request.subtotal
        discount = request.discount_amount + request.loyalty_discount
        taxable_amount = max(0, subtotal - discount)
        gst_details = calculate_gst(taxable_amount, request.delivery.state or "Karnataka")
        shipping = request.shipping_fee
        grand_total = round(taxable_amount + gst_details["total_tax"] + shipping, 2)
        
        # Generate order ID
        order_id = f"TDC-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Create Razorpay order
        razorpay_amount = int(grand_total * 100)  # Convert to paise
        
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
    
    try:
        # Verify signature
        message = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
        expected_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if expected_signature != request.razorpay_signature:
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
        
        # TODO: Trigger email sending here
        # await send_order_confirmation_email(order)
        
        return {
            "success": True,
            "order_id": request.order_id,
            "payment_status": "paid",
            "payment_method": payment.get("method"),
            "message": "Payment verified successfully"
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
