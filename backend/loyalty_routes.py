"""
Loyalty Points Routes for The Doggy Company
Handles Paw Rewards loyalty program - earning, redeeming, and admin management
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
loyalty_router = APIRouter(prefix="/api", tags=["Loyalty"])
loyalty_admin_router = APIRouter(prefix="/api/admin", tags=["Loyalty Admin"])

# Database reference
db: AsyncIOMotorDatabase = None

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()

# Points configuration
POINTS_PER_RUPEE = 1  # 1 point per ₹10 spent = 0.1 points per rupee
POINTS_REDEMPTION_VALUE = 0.5  # 1 point = ₹0.50 discount
MEMBERSHIP_POINT_MULTIPLIERS = {
    "free": 1.0,
    "pawsome": 1.5,
    "premium": 2.0,
    "vip": 3.0
}


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


# ==================== PUBLIC LOYALTY ROUTES ====================

@loyalty_router.get("/loyalty/balance")
async def get_loyalty_balance(user_id: str):
    """Get user's loyalty points balance"""
    user = await db.users.find_one(
        {"$or": [{"id": user_id}, {"email": user_id}]},
        {"_id": 0, "loyalty_points": 1, "total_points_earned": 1, "total_points_redeemed": 1, "membership_tier": 1}
    )
    
    if not user:
        return {"points": 0, "total_earned": 0, "total_redeemed": 0, "tier": "free", "multiplier": 1.0}
    
    tier = user.get("membership_tier", "free")
    return {
        "points": user.get("loyalty_points", 0),
        "total_earned": user.get("total_points_earned", 0),
        "total_redeemed": user.get("total_points_redeemed", 0),
        "tier": tier,
        "multiplier": MEMBERSHIP_POINT_MULTIPLIERS.get(tier, 1.0),
        "redemption_value": POINTS_REDEMPTION_VALUE
    }


@loyalty_router.post("/loyalty/earn")
async def earn_loyalty_points(user_id: str, order_total: float, order_id: str):
    """Award loyalty points for a purchase"""
    user = await db.users.find_one({"$or": [{"id": user_id}, {"email": user_id}]})
    
    if not user:
        return {"points_earned": 0, "message": "User not found"}
    
    tier = user.get("membership_tier", "free")
    multiplier = MEMBERSHIP_POINT_MULTIPLIERS.get(tier, 1.0)
    
    # Calculate points: (order_total / 10) * multiplier
    base_points = int(order_total / 10)
    points_earned = int(base_points * multiplier)
    
    # Update user's points
    await db.users.update_one(
        {"$or": [{"id": user_id}, {"email": user_id}]},
        {
            "$inc": {
                "loyalty_points": points_earned,
                "total_points_earned": points_earned
            }
        }
    )
    
    # Log the transaction
    await db.loyalty_transactions.insert_one({
        "id": f"lpt-{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "order_id": order_id,
        "type": "earn",
        "points": points_earned,
        "order_total": order_total,
        "multiplier": multiplier,
        "tier": tier,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "points_earned": points_earned,
        "base_points": base_points,
        "multiplier": multiplier,
        "new_balance": user.get("loyalty_points", 0) + points_earned
    }


@loyalty_router.post("/loyalty/redeem")
async def redeem_loyalty_points(user_id: str, points_to_redeem: int):
    """Redeem loyalty points for discount"""
    user = await db.users.find_one({"$or": [{"id": user_id}, {"email": user_id}]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_points = user.get("loyalty_points", 0)
    
    if points_to_redeem > current_points:
        raise HTTPException(status_code=400, detail=f"Insufficient points. You have {current_points} points.")
    
    if points_to_redeem < 100:
        raise HTTPException(status_code=400, detail="Minimum 100 points required for redemption")
    
    # Calculate discount value
    discount_value = points_to_redeem * POINTS_REDEMPTION_VALUE
    
    # Deduct points
    await db.users.update_one(
        {"$or": [{"id": user_id}, {"email": user_id}]},
        {
            "$inc": {
                "loyalty_points": -points_to_redeem,
                "total_points_redeemed": points_to_redeem
            }
        }
    )
    
    # Log the transaction
    await db.loyalty_transactions.insert_one({
        "id": f"lpt-{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "redeem",
        "points": -points_to_redeem,
        "discount_value": discount_value,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "points_redeemed": points_to_redeem,
        "discount_value": discount_value,
        "new_balance": current_points - points_to_redeem
    }


@loyalty_router.get("/loyalty/history")
async def get_loyalty_history(user_id: str, limit: int = 50):
    """Get user's loyalty points transaction history"""
    transactions = await db.loyalty_transactions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"transactions": transactions}


# ==================== ADMIN LOYALTY ROUTES ====================

@loyalty_admin_router.get("/loyalty/stats")
async def get_loyalty_stats(username: str = Depends(verify_admin)):
    """Get loyalty program statistics"""
    # Get all users with points
    users_with_points = await db.users.find(
        {"loyalty_points": {"$gt": 0}},
        {"_id": 0, "name": 1, "email": 1, "loyalty_points": 1, "total_points_earned": 1, "membership_tier": 1}
    ).sort("loyalty_points", -1).to_list(100)
    
    # Calculate totals
    total_points_in_circulation = sum(u.get("loyalty_points", 0) for u in users_with_points)
    total_points_ever_earned = await db.users.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$total_points_earned"}}}
    ]).to_list(1)
    total_earned = total_points_ever_earned[0]["total"] if total_points_ever_earned else 0
    
    # Recent transactions
    recent_transactions = await db.loyalty_transactions.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {
        "total_points_in_circulation": total_points_in_circulation,
        "total_points_ever_earned": total_earned,
        "potential_liability": total_points_in_circulation * POINTS_REDEMPTION_VALUE,
        "users_with_points": len(users_with_points),
        "top_users": users_with_points[:20],
        "recent_transactions": recent_transactions,
        "config": {
            "points_per_10_rupees": 1,
            "redemption_value": POINTS_REDEMPTION_VALUE,
            "multipliers": MEMBERSHIP_POINT_MULTIPLIERS
        }
    }


@loyalty_admin_router.post("/loyalty/adjust")
async def adjust_user_points(user_id: str, points: int, reason: str, username: str = Depends(verify_admin)):
    """Manually adjust a user's loyalty points (admin only)"""
    user = await db.users.find_one({"$or": [{"id": user_id}, {"email": user_id}]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"$or": [{"id": user_id}, {"email": user_id}]},
        {"$inc": {"loyalty_points": points}}
    )
    
    await db.loyalty_transactions.insert_one({
        "id": f"lpt-{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "adjustment",
        "points": points,
        "reason": reason,
        "adjusted_by": username,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"Adjusted {points} points for user", "new_balance": user.get("loyalty_points", 0) + points}
