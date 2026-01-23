"""
Discount Codes Routes for The Doggy Company
Handles promo codes, coupons, and discount management
"""

import os
import uuid
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Create routers
discount_router = APIRouter(prefix="/api", tags=["Discounts"])
discount_admin_router = APIRouter(prefix="/api/admin", tags=["Discounts Admin"])

# Database reference
db: AsyncIOMotorDatabase = None

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()


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


# ==================== ADMIN DISCOUNT ROUTES ====================

@discount_admin_router.get("/discount-codes")
async def get_all_discount_codes(username: str = Depends(verify_admin)):
    """Get all discount codes"""
    codes = await db.discount_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    active_count = sum(1 for c in codes if c.get("is_active", True))
    total_uses = sum(c.get("times_used", 0) for c in codes)
    
    return {
        "codes": codes,
        "total": len(codes),
        "active": active_count,
        "total_uses": total_uses
    }


@discount_admin_router.post("/discount-codes")
async def create_discount_code(code_data: dict, username: str = Depends(verify_admin)):
    """Create a new discount code"""
    code = code_data.get("code", "").upper().strip()
    
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")
    
    # Check if code already exists
    existing = await db.discount_codes.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail="Code already exists")
    
    discount_code = {
        "id": f"disc-{uuid.uuid4().hex[:8]}",
        "code": code,
        "type": code_data.get("type", "percentage"),  # percentage or fixed
        "value": float(code_data.get("value", 10)),  # 10% or ₹10
        "min_order": float(code_data.get("min_order", 0)),
        "max_discount": float(code_data.get("max_discount", 0)) if code_data.get("max_discount") else None,
        "usage_limit": int(code_data.get("usage_limit", 0)) if code_data.get("usage_limit") else None,
        "times_used": 0,
        "is_active": code_data.get("is_active", True),
        "valid_from": code_data.get("valid_from") or datetime.now(timezone.utc).isoformat(),
        "valid_until": code_data.get("valid_until"),
        "description": code_data.get("description", ""),
        "created_by": username,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.discount_codes.insert_one(discount_code)
    return {"message": "Discount code created", "code": {k: v for k, v in discount_code.items() if k != "_id"}}


@discount_admin_router.put("/discount-codes/{code_id}")
async def update_discount_code(code_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a discount code"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates["updated_by"] = username
    
    result = await db.discount_codes.update_one(
        {"$or": [{"id": code_id}, {"code": code_id.upper()}]},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Discount code not found")
    
    return {"message": "Discount code updated"}


@discount_admin_router.delete("/discount-codes/{code_id}")
async def delete_discount_code(code_id: str, username: str = Depends(verify_admin)):
    """Delete a discount code"""
    result = await db.discount_codes.delete_one(
        {"$or": [{"id": code_id}, {"code": code_id.upper()}]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Discount code not found")
    
    return {"message": "Discount code deleted"}


# ==================== PUBLIC DISCOUNT ROUTES ====================

@discount_router.post("/discount-codes/validate")
async def validate_discount_code(code: str, order_total: float):
    """Validate and calculate discount for a code"""
    code = code.upper().strip()
    
    discount_code = await db.discount_codes.find_one({"code": code}, {"_id": 0})
    
    if not discount_code:
        raise HTTPException(status_code=404, detail="Invalid discount code")
    
    if not discount_code.get("is_active", True):
        raise HTTPException(status_code=400, detail="This code is no longer active")
    
    # Check validity dates
    now = datetime.now(timezone.utc).isoformat()
    if discount_code.get("valid_from") and now < discount_code["valid_from"]:
        raise HTTPException(status_code=400, detail="This code is not yet valid")
    if discount_code.get("valid_until") and now > discount_code["valid_until"]:
        raise HTTPException(status_code=400, detail="This code has expired")
    
    # Check usage limit
    if discount_code.get("usage_limit") and discount_code.get("times_used", 0) >= discount_code["usage_limit"]:
        raise HTTPException(status_code=400, detail="This code has reached its usage limit")
    
    # Check minimum order
    if order_total < discount_code.get("min_order", 0):
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum order of ₹{discount_code['min_order']} required for this code"
        )
    
    # Calculate discount
    if discount_code["type"] == "percentage":
        discount = order_total * (discount_code["value"] / 100)
        if discount_code.get("max_discount") and discount > discount_code["max_discount"]:
            discount = discount_code["max_discount"]
    else:  # fixed
        discount = discount_code["value"]
    
    # Don't exceed order total
    if discount > order_total:
        discount = order_total
    
    return {
        "valid": True,
        "code": code,
        "type": discount_code["type"],
        "value": discount_code["value"],
        "discount_amount": round(discount, 2),
        "final_total": round(order_total - discount, 2),
        "description": discount_code.get("description", "")
    }


@discount_router.post("/discount-codes/apply")
async def apply_discount_code(code: str, order_id: str):
    """Record that a discount code was used"""
    code = code.upper().strip()
    
    result = await db.discount_codes.update_one(
        {"code": code},
        {"$inc": {"times_used": 1}}
    )
    
    # Log usage
    await db.discount_code_usage.insert_one({
        "code": code,
        "order_id": order_id,
        "used_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Discount code applied"}
