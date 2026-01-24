"""
Admin Member Routes for The Doggy Company
Handles member management, points adjustment, membership gifting, and stats
"""

import os
import uuid
import secrets
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Create router - uses admin prefix
admin_member_router = APIRouter(prefix="/api/admin", tags=["Admin Members"])

# Database reference
db: AsyncIOMotorDatabase = None

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def set_dependencies(verify_admin_func):
    """Accept dependencies from server.py - kept for API compatibility"""
    # We now use our own verify_admin implementation
    pass


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


@admin_member_router.get("/members")
async def get_all_customers(username: str = Depends(verify_admin)):
    """Get all customers (Registered Members + Guest Buyers)"""
    # 1. Get registered users
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    user_emails = {u["email"] for u in users if "email" in u}
    
    # 2. Get distinct guest emails from orders
    pipeline = [
        {"$group": {"_id": "$customer.email", "doc": {"$first": "$$ROOT"}}}
    ]
    guest_orders = await db.orders.aggregate(pipeline).to_list(1000)
    
    guests = []
    for g in guest_orders:
        email = g.get("_id")
        if email and email not in user_emails:
            # Create a guest customer object derived from order
            order_doc = g.get("doc", {})
            customer_info = order_doc.get("customer", {})
            
            guests.append({
                "id": f"guest-{email}",
                "email": email,
                "name": customer_info.get("parentName") or customer_info.get("name") or "Guest",
                "phone": customer_info.get("phone"),
                "membership_tier": "guest",
                "created_at": order_doc.get("created_at"),
                "is_guest": True
            })
            user_emails.add(email)  # Prevent dupes if multiples
            
    # Combine and sort
    all_customers = users + guests
    all_customers.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Stats - Support both new and legacy tier names
    total = len(all_customers)
    
    # New tier counts
    curious_pup_count = sum(1 for u in all_customers if u.get("membership_tier") in ["curious_pup", "free"])
    loyal_companion_count = sum(1 for u in all_customers if u.get("membership_tier") in ["loyal_companion", "pawsome"])
    trusted_guardian_count = sum(1 for u in all_customers if u.get("membership_tier") in ["trusted_guardian", "premium"])
    pack_leader_count = sum(1 for u in all_customers if u.get("membership_tier") in ["pack_leader", "vip"])
    guest_count = len(guests)
    
    return {
        "members": all_customers,
        "total": total,
        "stats": {
            # New tier names
            "curious_pup": curious_pup_count,
            "loyal_companion": loyal_companion_count,
            "trusted_guardian": trusted_guardian_count,
            "pack_leader": pack_leader_count,
            # Legacy names for backward compatibility
            "free": curious_pup_count,
            "pawsome": loyal_companion_count,
            "premium": trusted_guardian_count,
            "vip": pack_leader_count,
            "guest": guest_count,
            "total": total
        }
    }


@admin_member_router.put("/members/{user_id}")
async def update_member(user_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update member details/tier"""
    allowed = ["membership_tier", "membership_expires", "name", "phone", "email", "admin_notes"]
    filtered = {k: v for k, v in updates.items() if k in allowed}
    
    result = await db.users.update_one(
        {"$or": [{"id": user_id}, {"email": user_id}]},
        {"$set": filtered}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member updated"}


@admin_member_router.post("/members/{user_id}/points")
async def admin_adjust_points(user_id: str, adjustment: dict, username: str = Depends(verify_admin)):
    """Admin adjust member's paw points"""
    points = adjustment.get("points", 0)
    reason = adjustment.get("reason", "Admin adjustment")
    
    user = await db.users.find_one({"$or": [{"id": user_id}, {"email": user_id}]})
    if not user:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Update points
    new_balance = max(0, (user.get("loyalty_points", 0) + points))
    await db.users.update_one(
        {"$or": [{"id": user_id}, {"email": user_id}]},
        {"$set": {"loyalty_points": new_balance}}
    )
    
    # Log transaction
    await db.loyalty_transactions.insert_one({
        "id": f"txn-{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "admin_adjustment",
        "points": points,
        "reason": reason,
        "admin": username,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"Points adjusted by {points}", "new_balance": new_balance}


@admin_member_router.post("/members/{user_id}/gift")
async def admin_gift_membership(user_id: str, gift: dict, username: str = Depends(verify_admin)):
    """Admin gift free membership to a member"""
    duration_months = gift.get("duration_months", 1)
    tier = gift.get("tier", "pawsome")
    
    user = await db.users.find_one({"$or": [{"id": user_id}, {"email": user_id}]})
    if not user:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Calculate new expiration
    current_expires = user.get("membership_expires")
    if current_expires:
        try:
            base_date = datetime.fromisoformat(current_expires.replace('Z', '+00:00'))
            if base_date > datetime.now(timezone.utc):
                # Extend from current expiration
                new_expires = base_date + timedelta(days=duration_months * 30)
            else:
                # Start from now
                new_expires = datetime.now(timezone.utc) + timedelta(days=duration_months * 30)
        except Exception:
            new_expires = datetime.now(timezone.utc) + timedelta(days=duration_months * 30)
    else:
        new_expires = datetime.now(timezone.utc) + timedelta(days=duration_months * 30)
    
    await db.users.update_one(
        {"$or": [{"id": user_id}, {"email": user_id}]},
        {"$set": {
            "membership_tier": tier,
            "membership_expires": new_expires.isoformat()
        }}
    )
    
    # Log the gift
    await db.membership_gifts.insert_one({
        "id": f"gift-{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "tier": tier,
        "duration_months": duration_months,
        "gifted_by": username,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "message": f"Gifted {duration_months} month(s) of {tier} membership",
        "expires": new_expires.isoformat()
    }


@admin_member_router.get("/membership/stats")
async def get_membership_stats(username: str = Depends(verify_admin)):
    """Get comprehensive membership statistics"""
    all_users = await db.users.find({}, {"_id": 0}).to_list(None)
    
    now = datetime.now(timezone.utc)
    
    stats = {
        "total": len(all_users),
        "by_tier": {
            "curious_pup": sum(1 for u in all_users if u.get("membership_tier", "free") in ["free", "guest", None]),
            "loyal_companion": sum(1 for u in all_users if u.get("membership_tier") == "pawsome"),
            "trusted_guardian": sum(1 for u in all_users if u.get("membership_tier") == "premium"),
            "pack_leader": sum(1 for u in all_users if u.get("membership_tier") == "vip")
        },
        "active_subscriptions": 0,
        "expiring_soon": 0,
        "recently_expired": 0,
        "total_paw_points": sum(u.get("loyalty_points", 0) for u in all_users)
    }
    
    for user in all_users:
        expires = user.get("membership_expires")
        if expires:
            try:
                exp_date = datetime.fromisoformat(expires.replace('Z', '+00:00'))
                days_diff = (exp_date - now).days
                
                if days_diff > 0:
                    stats["active_subscriptions"] += 1
                    if days_diff <= 30:
                        stats["expiring_soon"] += 1
                elif days_diff >= -30:
                    stats["recently_expired"] += 1
            except Exception:
                pass
    
    return stats
