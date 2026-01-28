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
    "legal_name": "The Doggy Bakery Pvt Ltd",
    "gstin": "29AABCT1332L1ZC",  # Placeholder - update with real GSTIN
    "pan": "AABCT1332L",
    "address": "147, 8th Main Rd, 3rd Block, Koramangala, Bengaluru 560034",
    "email": "billing@thedoggybakery.in",
    "phone": "+91 9663185747",
    "state": "Karnataka",
    "state_code": "29"
}

# Resend Email Configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.in")

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
        
        # Build items HTML
        items_html = ""
        for item in items:
            item_total = item.get("price", 0) * item.get("quantity", 1)
            items_html += f'''
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <strong>{item.get("name", "Item")}</strong>
                    <br><span style="color: #6b7280; font-size: 12px;">{item.get("size", "")} {item.get("flavor", "")}</span>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">{item.get("quantity", 1)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹{item_total:.2f}</td>
            </tr>
            '''
        
        # GST details
        gst_details = pricing.get("gst_details", {})
        gst_html = ""
        if gst_details.get("is_same_state"):
            gst_html = f'''
            <tr><td colspan="2" style="padding: 8px; color: #6b7280;">CGST (9%)</td><td style="text-align: right; padding: 8px;">₹{gst_details.get("cgst_amount", 0):.2f}</td></tr>
            <tr><td colspan="2" style="padding: 8px; color: #6b7280;">SGST (9%)</td><td style="text-align: right; padding: 8px;">₹{gst_details.get("sgst_amount", 0):.2f}</td></tr>
            '''
        else:
            gst_html = f'''
            <tr><td colspan="2" style="padding: 8px; color: #6b7280;">IGST (18%)</td><td style="text-align: right; padding: 8px;">₹{gst_details.get("igst_amount", 0):.2f}</td></tr>
            '''
        
        html_content = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }}
                .order-box {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .total-row {{ font-size: 18px; font-weight: bold; color: #7c3aed; }}
                .footer {{ background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; color: #6b7280; }}
                .btn {{ display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🐕 The Doggy Company</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Order Confirmation</p>
                </div>
                <div class="content">
                    <h2 style="color: #22c55e; text-align: center;">✓ Payment Successful!</h2>
                    
                    <p>Hi {customer_name},</p>
                    <p>Thank you for your order! We're preparing your treats with love 🐾</p>
                    
                    <div class="order-box">
                        <p style="margin: 0 0 10px 0;"><strong>Order ID:</strong> {order_id}</p>
                        <p style="margin: 0;"><strong>Payment Status:</strong> <span style="color: #22c55e;">Paid ✓</span></p>
                    </div>
                    
                    <h3>Order Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f3f4f6;">
                                <th style="padding: 12px; text-align: left;">Item</th>
                                <th style="padding: 12px; text-align: center;">Qty</th>
                                <th style="padding: 12px; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                    
                    <table style="width: 100%; margin-top: 20px;">
                        <tr><td colspan="2" style="padding: 8px;">Subtotal</td><td style="text-align: right; padding: 8px;">₹{pricing.get("subtotal", 0):.2f}</td></tr>
                        {gst_html}
                        <tr><td colspan="2" style="padding: 8px;">Shipping</td><td style="text-align: right; padding: 8px;">{("FREE" if pricing.get("shipping_fee", 0) == 0 else f"₹{pricing.get('shipping_fee', 0):.2f}")}</td></tr>
                        <tr class="total-row"><td colspan="2" style="padding: 12px; border-top: 2px solid #7c3aed;">Total Paid</td><td style="text-align: right; padding: 12px; border-top: 2px solid #7c3aed;">₹{pricing.get("grand_total", 0):.2f}</td></tr>
                    </table>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://thedoggycompany.in/api/checkout/order/{order_id}/invoice/pdf" class="btn">
                            📄 Download Invoice (PDF)
                        </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        You'll receive shipping updates on WhatsApp. For any questions, reply to this email or call us at +91 9663185747.
                    </p>
                </div>
                <div class="footer">
                    <p>The Doggy Company | India's #1 Pet Life Operating System</p>
                    <p>📞 +91 9663185747 | 📧 woof@thedoggycompany.in</p>
                </div>
            </div>
        </body>
        </html>
        '''
        
        params = {
            "from": f"The Doggy Company <{SENDER_EMAIL}>",
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
        
        # Send order confirmation email
        if order:
            await send_order_confirmation_email(order)
        
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
        except:
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
    
    totals_data.append(['', 'Taxable Amount:', f"₹{taxable:.2f}"])
    
    # GST breakdown
    if gst_details.get('is_same_state'):
        totals_data.append(['', f"CGST @ {gst_details.get('cgst_rate', 9)}%:", f"₹{gst_details.get('cgst_amount', 0):.2f}"])
        totals_data.append(['', f"SGST @ {gst_details.get('sgst_rate', 9)}%:", f"₹{gst_details.get('sgst_amount', 0):.2f}"])
    else:
        totals_data.append(['', f"IGST @ {gst_details.get('igst_rate', 18)}%:", f"₹{gst_details.get('igst_amount', 0):.2f}"])
    
    totals_data.append(['', 'Shipping:', 'FREE' if shipping == 0 else f"₹{shipping:.2f}"])
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
