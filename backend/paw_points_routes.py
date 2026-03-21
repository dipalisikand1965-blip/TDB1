"""
Paw Points & Rewards System for The Doggy Company
Handles points earning, redemption, and reward catalog
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

logger = logging.getLogger(__name__)

# Create router
paw_points_router = APIRouter(prefix="/api/paw-points", tags=["Paw Points"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_db(database: AsyncIOMotorDatabase):
    global db
    db = database

def get_db():
    global db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return db


# ==================== REWARD CATALOG ====================

REWARD_CATALOG = [
    # Discount Rewards
    {
        "id": "discount_50",
        "name": "₹50 Off Your Order",
        "description": "Get ₹50 off on your next order of ₹500 or more",
        "category": "discount",
        "points_required": 100,
        "icon": "🏷️",
        "discount_type": "fixed",
        "discount_value": 50,
        "min_order_value": 500,
        "tier": "bronze"
    },
    {
        "id": "discount_100",
        "name": "₹100 Off Your Order",
        "description": "Get ₹100 off on your next order of ₹1000 or more",
        "category": "discount",
        "points_required": 200,
        "icon": "🎁",
        "discount_type": "fixed",
        "discount_value": 100,
        "min_order_value": 1000,
        "tier": "silver"
    },
    {
        "id": "discount_250",
        "name": "₹250 Off Your Order",
        "description": "Get ₹250 off on your next order of ₹2000 or more",
        "category": "discount",
        "points_required": 500,
        "icon": "💎",
        "discount_type": "fixed",
        "discount_value": 250,
        "min_order_value": 2000,
        "tier": "gold"
    },
    {
        "id": "discount_10_percent",
        "name": "10% Off Your Order",
        "description": "Get 10% off on your entire order (max ₹500)",
        "category": "discount",
        "points_required": 400,
        "icon": "✨",
        "discount_type": "percentage",
        "discount_value": 10,
        "max_discount": 500,
        "tier": "gold"
    },
    
    # Free Items
    {
        "id": "free_treat_box",
        "name": "Free Treat Box",
        "description": "Redeem a complimentary box of premium treats",
        "category": "free_item",
        "points_required": 150,
        "icon": "🦴",
        "item_value": 299,
        "tier": "bronze"
    },
    {
        "id": "free_grooming",
        "name": "Free Basic Grooming",
        "description": "One free basic grooming session for your pet",
        "category": "free_item",
        "points_required": 500,
        "icon": "✂️",
        "item_value": 799,
        "tier": "gold"
    },
    {
        "id": "free_birthday_cake",
        "name": "Free Birthday Cake",
        "description": "A complimentary pet-friendly birthday cake",
        "category": "free_item",
        "points_required": 350,
        "icon": "🎂",
        "item_value": 599,
        "tier": "silver"
    },
    
    # Experience Rewards
    {
        "id": "priority_support",
        "name": "Priority Mira Support",
        "description": "Get priority responses from Mira AI for 30 days",
        "category": "experience",
        "points_required": 200,
        "icon": "⚡",
        "duration_days": 30,
        "tier": "silver"
    },
    {
        "id": "vip_restaurant_booking",
        "name": "VIP Restaurant Booking",
        "description": "Priority booking at partner pet-friendly restaurants",
        "category": "experience",
        "points_required": 300,
        "icon": "🍽️",
        "tier": "silver"
    },
    {
        "id": "personal_concierge",
        "name": "Personal Concierge Session",
        "description": "30-minute 1-on-1 consultation with our pet concierge",
        "category": "experience",
        "points_required": 750,
        "icon": "👑",
        "tier": "platinum"
    },
    
    # Exclusive Rewards
    {
        "id": "early_access",
        "name": "Early Access Pass",
        "description": "Get early access to new products and sales for 60 days",
        "category": "exclusive",
        "points_required": 400,
        "icon": "🎟️",
        "duration_days": 60,
        "tier": "gold"
    },
    {
        "id": "double_points",
        "name": "Double Points Week",
        "description": "Earn 2x points on all purchases for 7 days",
        "category": "exclusive",
        "points_required": 600,
        "icon": "🔥",
        "duration_days": 7,
        "tier": "gold"
    },
]

TIER_THRESHOLDS = {
    "bronze": 0,
    "silver": 500,
    "gold": 1500,
    "platinum": 5000
}


# ==================== MODELS ====================

class RedeemRewardRequest(BaseModel):
    reward_id: str
    pet_id: Optional[str] = None  # For pet-specific rewards

class EarnPointsRequest(BaseModel):
    amount: int
    reason: str
    source: str  # order, achievement, referral, activity, bonus
    reference_id: Optional[str] = None


# ==================== HELPER FUNCTIONS ====================

async def get_user_from_token(authorization: str = Header(None)):
    """Extract user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    
    token = authorization.split(" ")[1]
    
    import jwt
    try:
        payload = jwt.decode(token, os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof"), algorithms=["HS256"])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"email": email}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_user_tier(total_points_earned: int) -> str:
    """Determine user tier based on lifetime points earned"""
    tier = "bronze"
    for t, threshold in TIER_THRESHOLDS.items():
        if total_points_earned >= threshold:
            tier = t
    return tier


# ==================== ENDPOINTS ====================

@paw_points_router.get("/balance")
async def get_points_balance(authorization: str = Header(None)):
    """Get user's current Paw Points balance and tier"""
    user = await get_user_from_token(authorization)
    
    current_balance = user.get("loyalty_points", 0)
    lifetime_earned = user.get("lifetime_points_earned", current_balance)
    tier = get_user_tier(lifetime_earned)
    
    # Calculate next tier progress
    next_tier = None
    progress_to_next = 100
    for t, threshold in TIER_THRESHOLDS.items():
        if threshold > lifetime_earned:
            next_tier = t
            prev_threshold = TIER_THRESHOLDS.get(tier, 0)
            progress_to_next = ((lifetime_earned - prev_threshold) / (threshold - prev_threshold)) * 100
            break
    
    return {
        "balance": current_balance,
        "lifetime_earned": lifetime_earned,
        "tier": tier,
        "next_tier": next_tier,
        "progress_to_next_tier": round(progress_to_next, 1),
        "tier_thresholds": TIER_THRESHOLDS
    }


@paw_points_router.get("/catalog")
async def get_reward_catalog(authorization: str = Header(None)):
    """Get available rewards catalog based on user tier"""
    user = await get_user_from_token(authorization)
    
    current_balance = user.get("loyalty_points", 0)
    lifetime_earned = user.get("lifetime_points_earned", current_balance)
    tier = get_user_tier(lifetime_earned)
    
    # Filter rewards by tier
    tier_order = ["bronze", "silver", "gold", "platinum"]
    user_tier_index = tier_order.index(tier)
    
    available_rewards = []
    for reward in REWARD_CATALOG:
        reward_tier_index = tier_order.index(reward.get("tier", "bronze"))
        
        available_rewards.append({
            **reward,
            "can_redeem": current_balance >= reward["points_required"] and reward_tier_index <= user_tier_index,
            "tier_locked": reward_tier_index > user_tier_index,
            "points_needed": max(0, reward["points_required"] - current_balance)
        })
    
    # Sort by points required
    available_rewards.sort(key=lambda x: x["points_required"])
    
    return {
        "rewards": available_rewards,
        "user_balance": current_balance,
        "user_tier": tier,
        "categories": ["discount", "free_item", "experience", "exclusive"]
    }


@paw_points_router.post("/redeem")
async def redeem_reward(request: RedeemRewardRequest, authorization: str = Header(None)):
    """Redeem a reward using Paw Points"""
    user = await get_user_from_token(authorization)
    database = get_db()
    
    current_balance = user.get("loyalty_points", 0)
    
    # Find the reward
    reward = next((r for r in REWARD_CATALOG if r["id"] == request.reward_id), None)
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    # Check if user has enough points
    if current_balance < reward["points_required"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient points. You need {reward['points_required']} points but have {current_balance}"
        )
    
    # Check tier eligibility
    lifetime_earned = user.get("lifetime_points_earned", current_balance)
    user_tier = get_user_tier(lifetime_earned)
    tier_order = ["bronze", "silver", "gold", "platinum"]
    if tier_order.index(reward.get("tier", "bronze")) > tier_order.index(user_tier):
        raise HTTPException(status_code=400, detail=f"This reward requires {reward['tier']} tier")
    
    # Generate redemption code
    redemption_code = f"PAW-{uuid.uuid4().hex[:8].upper()}"
    
    # Create redemption record
    redemption = {
        "id": str(uuid.uuid4()),
        "user_email": user["email"],
        "reward_id": reward["id"],
        "reward_name": reward["name"],
        "points_spent": reward["points_required"],
        "redemption_code": redemption_code,
        "status": "active",
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=90),  # 90 day validity
        "pet_id": request.pet_id,
        "reward_details": reward
    }
    
    await database.paw_redemptions.insert_one(redemption)
    
    # Deduct points
    new_balance = current_balance - reward["points_required"]
    await database.users.update_one(
        {"email": user["email"]},
        {"$set": {"loyalty_points": new_balance}}
    )
    
    # Log the transaction
    await database.paw_points_ledger.insert_one({
        "user_email": user["email"],
        "amount": -reward["points_required"],
        "balance_after": new_balance,
        "reason": f"Redeemed: {reward['name']}",
        "source": "redemption",
        "reference_id": redemption["id"],
        "created_at": datetime.now(timezone.utc)
    })
    
    return {
        "success": True,
        "redemption_code": redemption_code,
        "reward": reward["name"],
        "points_spent": reward["points_required"],
        "new_balance": new_balance,
        "expires_at": redemption["expires_at"].isoformat(),
        "message": f"🎉 You've redeemed {reward['name']}! Your code is {redemption_code}"
    }


@paw_points_router.get("/history")
async def get_points_history(limit: int = 50, authorization: str = Header(None)):
    """Get user's points transaction history"""
    user = await get_user_from_token(authorization)
    database = get_db()
    
    # Get ledger entries
    ledger = await database.paw_points_ledger.find(
        {"user_email": user["email"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "transactions": ledger,
        "current_balance": user.get("loyalty_points", 0)
    }


@paw_points_router.get("/redemptions")
async def get_my_redemptions(authorization: str = Header(None)):
    """Get user's active and past redemptions"""
    user = await get_user_from_token(authorization)
    database = get_db()
    
    redemptions = await database.paw_redemptions.find(
        {"user_email": user["email"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Categorize
    active = [r for r in redemptions if r.get("status") == "active" and r.get("expires_at", datetime.now(timezone.utc)) > datetime.now(timezone.utc)]
    used = [r for r in redemptions if r.get("status") == "used"]
    expired = [r for r in redemptions if r.get("status") == "active" and r.get("expires_at", datetime.now(timezone.utc)) <= datetime.now(timezone.utc)]
    
    return {
        "active": active,
        "used": used,
        "expired": expired,
        "total": len(redemptions)
    }


@paw_points_router.post("/earn")
async def earn_points(request: EarnPointsRequest, authorization: str = Header(None)):
    """Award points to user (internal use / admin)"""
    user = await get_user_from_token(authorization)
    database = get_db()
    
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    current_balance = user.get("loyalty_points", 0)
    lifetime_earned = user.get("lifetime_points_earned", current_balance)
    
    new_balance = current_balance + request.amount
    new_lifetime = lifetime_earned + request.amount
    
    # Update user
    await database.users.update_one(
        {"email": user["email"]},
        {
            "$set": {
                "loyalty_points": new_balance,
                "lifetime_points_earned": new_lifetime
            }
        }
    )
    
    # Log transaction
    await database.paw_points_ledger.insert_one({
        "user_email": user["email"],
        "amount": request.amount,
        "balance_after": new_balance,
        "reason": request.reason,
        "source": request.source,
        "reference_id": request.reference_id,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Check for tier upgrade
    old_tier = get_user_tier(lifetime_earned)
    new_tier = get_user_tier(new_lifetime)
    tier_upgraded = old_tier != new_tier
    
    return {
        "success": True,
        "points_earned": request.amount,
        "new_balance": new_balance,
        "tier": new_tier,
        "tier_upgraded": tier_upgraded,
        "old_tier": old_tier if tier_upgraded else None
    }


@paw_points_router.get("/ways-to-earn")
async def get_ways_to_earn():
    """Get all ways to earn Paw Points"""
    ways = [
        {
            "id": "order",
            "name": "Place Orders",
            "description": "Earn 1 point for every ₹10 spent",
            "icon": "🛒",
            "points_example": "₹1000 order = 100 points"
        },
        {
            "id": "soul_journey",
            "name": "Complete Soul Journey",
            "description": "Answer questions about your pet's personality",
            "icon": "✨",
            "points_example": "Up to 1000 points for 100% completion"
        },
        {
            "id": "first_order",
            "name": "First Purchase",
            "description": "Welcome bonus on your first order",
            "icon": "🎁",
            "points_example": "100 bonus points"
        },
        {
            "id": "referral",
            "name": "Refer Friends",
            "description": "Earn points when friends join with your code",
            "icon": "👥",
            "points_example": "200 points per referral"
        },
        {
            "id": "review",
            "name": "Write Reviews",
            "description": "Share your experience with products",
            "icon": "⭐",
            "points_example": "25 points per review"
        },
        {
            "id": "birthday",
            "name": "Pet Birthday",
            "description": "Special birthday bonus for your pet",
            "icon": "🎂",
            "points_example": "50 bonus points"
        },
        {
            "id": "activity",
            "name": "Log Activities",
            "description": "Track walks, vet visits, and more",
            "icon": "🏃",
            "points_example": "5-20 points per activity"
        },
        {
            "id": "social",
            "name": "Social Sharing",
            "description": "Share your pet's profile on social media",
            "icon": "📱",
            "points_example": "10 points per share"
        }
    ]
    
    return {"ways_to_earn": ways}


# Import canonical member logic config
from member_logic_config import (
    BADGE_DEFINITIONS,
    BADGE_QUESTION_THRESHOLDS,
    PAW_POINTS_RULES,
    UI_QUESTION_IDS,
    count_ui_questions_answered,
    get_eligible_badges,
    calculate_order_points,
    get_service_booking_points
)

# Achievement definitions - now using BADGE_DEFINITIONS from config
# Badges are triggered by QUESTION COUNT, not percentage
ACHIEVEMENT_POINTS = {
    badge_id: {
        "name": badge["name"],
        "points": badge["points_reward"],
        "type": badge["type"],
        "threshold": badge["threshold"]
    }
    for badge_id, badge in BADGE_DEFINITIONS.items()
}


@paw_points_router.post("/sync-achievements")
async def sync_achievement_points(authorization: str = Header(None)):
    """
    Sync achievement points - check which achievements user has unlocked
    and credit points for any not yet credited.
    This should be called when user visits dashboard or completes actions.
    """
    user = await get_user_from_token(authorization)
    database = get_db()
    
    email = user["email"]
    current_balance = user.get("loyalty_points", 0)
    lifetime_earned = user.get("lifetime_points_earned", current_balance)
    
    # Get user's credited achievements
    credited = user.get("credited_achievements", [])
    
    # Get user's pets
    pets = await database.pets.find({"owner_email": email}, {"_id": 0}).to_list(100)
    
    # Get user's orders
    orders_count = await database.orders.count_documents({"customer_email": email})
    
    # Get user's celebrations
    celebrations_count = await database.celebration_orders.count_documents({"user_email": email})
    
    # Get user's Mira sessions
    mira_count = await database.mira_conversations.count_documents({"user_email": email})
    
    # Calculate questions answered using canonical count (UI question IDs only)
    # Check ALL pets and take the maximum questions answered
    questions_answered = 0
    has_photo = False
    
    for pet in pets:
        answers = pet.get("doggy_soul_answers") or {} or {}
        # Use canonical count function - counts only UI question IDs + aliases
        pet_questions = count_ui_questions_answered(answers)
        questions_answered = max(questions_answered, pet_questions)
        if pet.get("photo_url"):
            has_photo = True
    
    # Check and credit new achievements
    new_credits = []
    total_new_points = 0
    
    for ach_id, ach_data in ACHIEVEMENT_POINTS.items():
        if ach_id in credited:
            continue  # Already credited (idempotent)
        
        # Check if achievement is unlocked
        unlocked = False
        
        # BADGES: Question-count based triggers (not percentage)
        if ach_data["type"] == "questions" and questions_answered >= ach_data["threshold"]:
            unlocked = True
        elif ach_data["type"] == "orders" and orders_count >= ach_data["threshold"]:
            unlocked = True
        elif ach_data["type"] == "pets" and len(pets) >= ach_data["threshold"]:
            unlocked = True
        elif ach_data["type"] == "photo" and has_photo:
            unlocked = True
        elif ach_data["type"] == "celebration" and celebrations_count >= ach_data["threshold"]:
            unlocked = True
        
        if unlocked:
            new_credits.append(ach_id)
            total_new_points += ach_data["points"]
            
            # Log the transaction
            await database.paw_points_ledger.insert_one({
                "user_email": email,
                "amount": ach_data["points"],
                "balance_after": current_balance + total_new_points,
                "reason": f"Achievement: {ach_data['name']}",
                "source": "achievement",
                "reference_id": ach_id,
                "created_at": datetime.now(timezone.utc)
            })
            
            logger.info(f"Credited {ach_data['points']} points to {email} for achievement: {ach_data['name']}")
    
    # Update user with new balance and credited achievements
    if total_new_points > 0:
        new_balance = current_balance + total_new_points
        new_lifetime = lifetime_earned + total_new_points
        
        await database.users.update_one(
            {"email": email},
            {
                "$set": {
                    "loyalty_points": new_balance,
                    "lifetime_points_earned": new_lifetime
                },
                "$addToSet": {
                    "credited_achievements": {"$each": new_credits}
                }
            }
        )
        
        return {
            "success": True,
            "new_achievements": new_credits,
            "points_earned": total_new_points,
            "new_balance": new_balance,
            "questions_answered": questions_answered,
            "message": f"Earned {total_new_points} Paw Points from {len(new_credits)} achievement(s)!"
        }
    
    return {
        "success": True,
        "new_achievements": [],
        "points_earned": 0,
        "current_balance": current_balance,
        "questions_answered": questions_answered,
        "message": "No new achievements to credit"
    }

