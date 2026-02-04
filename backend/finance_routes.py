"""
Finance & Reconciliation Routes
Tracks all payments, refunds, discounts, paw points for accounting reconciliation
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/finance", tags=["Finance"])

# Import db and verify_admin from main server
# These will be injected when the router is included

def get_utc_timestamp():
    return datetime.now(timezone.utc).isoformat()

def generate_payment_id():
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    unique = uuid.uuid4().hex[:6].upper()
    return f"PAY-{date_str}-{unique}"

class OfflinePaymentRequest(BaseModel):
    member_email: str
    type: str  # membership, product, service, quote
    reference_id: Optional[str] = None
    amount: float
    payment_method: str = "offline"
    notes: Optional[str] = None
    discount_code: Optional[str] = None
    discount_amount: float = 0
    paw_points_used: int = 0

class ReconcileRequest(BaseModel):
    notes: Optional[str] = None

class RefundRequest(BaseModel):
    amount: float
    reason: str

def create_finance_routes(db, verify_admin):
    """Create finance routes with database dependency"""
    
    @router.get("/payments")
    async def get_all_payments(
        status: Optional[str] = None,
        type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        username: str = Depends(verify_admin)
    ):
        """Get all payments with filters and stats"""
        try:
            query = {}
            
            if status:
                query["status"] = status
            if type:
                query["type"] = type
            if start_date:
                query["created_at"] = {"$gte": start_date}
            if end_date:
                if "created_at" in query:
                    query["created_at"]["$lte"] = end_date
                else:
                    query["created_at"] = {"$lte": end_date}
            
            # Fetch payments
            payments = await db.payments.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
            
            # Calculate stats
            total_collected = sum(p.get("total", p.get("amount", 0)) for p in payments if p.get("status") == "completed")
            pending_amount = sum(p.get("total", p.get("amount", 0)) for p in payments if p.get("status") == "pending")
            refunds_issued = sum(p.get("refund_amount", 0) for p in payments if p.get("status") in ["refunded", "partial_refund"])
            paw_points_redeemed = sum(p.get("paw_points_value", 0) for p in payments)
            discounts_given = sum(p.get("discount_amount", 0) for p in payments)
            
            # Today's revenue
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            today_payments = [p for p in payments if p.get("created_at", "").startswith(today) and p.get("status") == "completed"]
            today_revenue = sum(p.get("total", p.get("amount", 0)) for p in today_payments)
            
            # Pending reconciliation
            pending_reconciliation = len([p for p in payments if p.get("status") == "completed" and not p.get("reconciled")])
            
            return {
                "payments": payments,
                "stats": {
                    "total_collected": total_collected,
                    "pending_amount": pending_amount,
                    "refunds_issued": refunds_issued,
                    "paw_points_redeemed": paw_points_redeemed,
                    "discounts_given": discounts_given,
                    "today_revenue": today_revenue,
                    "pending_reconciliation": pending_reconciliation
                }
            }
        except Exception as e:
            logger.error(f"Failed to fetch payments: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.post("/payments/offline")
    async def record_offline_payment(
        payment: OfflinePaymentRequest,
        username: str = Depends(verify_admin)
    ):
        """Record an offline payment (from concierge quotes, bank transfers, cash)"""
        try:
            # Get member info
            member = await db.users.find_one({"email": payment.member_email}, {"_id": 0})
            if not member:
                # Try members collection
                member = await db.members.find_one({"email": payment.member_email}, {"_id": 0})
            
            member_name = member.get("name", "Unknown") if member else "Unknown"
            member_id = member.get("id") if member else None
            
            # Calculate paw points value (1 point = ₹0.10)
            paw_points_value = payment.paw_points_used * 0.10
            
            # Calculate total
            subtotal = payment.amount
            total = subtotal - payment.discount_amount - paw_points_value
            
            payment_doc = {
                "id": generate_payment_id(),
                "type": payment.type,
                "status": "completed",  # Offline payments are already completed
                "amount": payment.amount,
                "subtotal": subtotal,
                "discount_code": payment.discount_code,
                "discount_amount": payment.discount_amount,
                "paw_points_used": payment.paw_points_used,
                "paw_points_value": paw_points_value,
                "gst_amount": 0,  # GST handled separately for offline
                "total": total,
                "payment_method": payment.payment_method,
                "reference_type": payment.type,
                "reference_id": payment.reference_id,
                "member_id": member_id,
                "member_email": payment.member_email,
                "member_name": member_name,
                "notes": payment.notes,
                "reconciled": False,
                "recorded_by": username,
                "created_at": get_utc_timestamp(),
                "updated_at": get_utc_timestamp()
            }
            
            await db.payments.insert_one(payment_doc)
            
            # Deduct paw points if used
            if payment.paw_points_used > 0 and member_id:
                await db.users.update_one(
                    {"id": member_id},
                    {"$inc": {"paw_points": -payment.paw_points_used}}
                )
            
            # Create admin notification
            await db.admin_notifications.insert_one({
                "id": f"NOTIF-{uuid.uuid4().hex[:8]}",
                "type": "payment_received",
                "title": "💰 Offline Payment Recorded",
                "message": f"₹{total:,.0f} received from {member_name} for {payment.type}",
                "category": "finance",
                "priority": "normal",
                "read": False,
                "created_at": get_utc_timestamp()
            })
            
            logger.info(f"Offline payment recorded: {payment_doc['id']} - ₹{total}")
            
            return {"success": True, "payment_id": payment_doc["id"], "message": "Payment recorded successfully"}
            
        except Exception as e:
            logger.error(f"Failed to record offline payment: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.post("/payments/{payment_id}/reconcile")
    async def reconcile_payment(
        payment_id: str,
        request: ReconcileRequest,
        username: str = Depends(verify_admin)
    ):
        """Mark a payment as reconciled by accounts team"""
        try:
            result = await db.payments.update_one(
                {"id": payment_id},
                {
                    "$set": {
                        "reconciled": True,
                        "reconciled_by": username,
                        "reconciled_at": get_utc_timestamp(),
                        "reconcile_notes": request.notes,
                        "updated_at": get_utc_timestamp()
                    }
                }
            )
            
            if result.modified_count == 0:
                raise HTTPException(status_code=404, detail="Payment not found")
            
            logger.info(f"Payment {payment_id} reconciled by {username}")
            
            return {"success": True, "message": "Payment reconciled successfully"}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to reconcile payment: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.post("/payments/{payment_id}/refund")
    async def process_refund(
        payment_id: str,
        request: RefundRequest,
        username: str = Depends(verify_admin)
    ):
        """Process a refund for a payment"""
        try:
            # Get original payment
            payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
            if not payment:
                raise HTTPException(status_code=404, detail="Payment not found")
            
            original_amount = payment.get("total", payment.get("amount", 0))
            
            if request.amount > original_amount:
                raise HTTPException(status_code=400, detail="Refund amount exceeds original payment")
            
            # Determine refund status
            refund_status = "refunded" if request.amount >= original_amount else "partial_refund"
            
            # Update payment
            await db.payments.update_one(
                {"id": payment_id},
                {
                    "$set": {
                        "status": refund_status,
                        "refund_amount": request.amount,
                        "refund_reason": request.reason,
                        "refunded_by": username,
                        "refunded_at": get_utc_timestamp(),
                        "updated_at": get_utc_timestamp()
                    }
                }
            )
            
            # Create refund record
            refund_doc = {
                "id": generate_payment_id().replace("PAY", "REF"),
                "type": "refund",
                "status": "completed",
                "amount": -request.amount,  # Negative for refunds
                "total": -request.amount,
                "payment_method": payment.get("payment_method", "razorpay"),
                "reference_type": "refund",
                "reference_id": payment_id,
                "member_id": payment.get("member_id"),
                "member_email": payment.get("member_email"),
                "member_name": payment.get("member_name"),
                "notes": f"Refund for {payment_id}: {request.reason}",
                "reconciled": False,
                "processed_by": username,
                "created_at": get_utc_timestamp()
            }
            
            await db.payments.insert_one(refund_doc)
            
            # Notify
            await db.admin_notifications.insert_one({
                "id": f"NOTIF-{uuid.uuid4().hex[:8]}",
                "type": "refund_processed",
                "title": "🔄 Refund Processed",
                "message": f"₹{request.amount:,.0f} refunded to {payment.get('member_name')} - {request.reason}",
                "category": "finance",
                "priority": "high",
                "read": False,
                "created_at": get_utc_timestamp()
            })
            
            logger.info(f"Refund processed for {payment_id}: ₹{request.amount}")
            
            return {"success": True, "message": "Refund processed successfully", "refund_id": refund_doc["id"]}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to process refund: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.get("/payments/{payment_id}")
    async def get_payment_details(
        payment_id: str,
        username: str = Depends(verify_admin)
    ):
        """Get detailed payment information"""
        try:
            payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
            if not payment:
                raise HTTPException(status_code=404, detail="Payment not found")
            
            # Get related records if any
            related = []
            if payment.get("reference_id"):
                # Check orders
                order = await db.orders.find_one({"id": payment["reference_id"]}, {"_id": 0})
                if order:
                    related.append({"type": "order", "data": order})
                
                # Check service requests
                request = await db.concierge_requests.find_one({"id": payment["reference_id"]}, {"_id": 0})
                if request:
                    related.append({"type": "service_request", "data": request})
            
            return {"payment": payment, "related": related}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch payment details: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    return router
