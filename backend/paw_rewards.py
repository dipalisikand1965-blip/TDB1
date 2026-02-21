"""
Universal Paw Rewards System for The Doggy Company
Standardized rewards across all pillars with configurable benefits

Pillars:
- CELEBRATE: Free treat with cake order
- DINE: Free birthday cake when celebrating at restaurant
- STAY: Free treat (up to ₹600) with every booking
- TRAVEL: Pet travel kit included
- CARE: First visit discount
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Create router
rewards_router = APIRouter(prefix="/api/rewards", tags=["Paw Rewards"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== MODELS ====================

class PawRewardConfig(BaseModel):
    """Universal Paw Reward Configuration"""
    pillar: str  # celebrate, dine, stay, travel, care
    enabled: bool = True
    reward_type: str  # free_product, discount, freebie, bundle
    reward_name: str
    reward_description: str
    reward_icon: str = "🎁"
    
    # Product-based rewards
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    product_category: Optional[str] = None  # e.g., "treats", "cakes"
    product_collection: Optional[str] = None  # e.g., "bow-treats"
    
    # Value limits
    max_value: float = 600
    min_order_value: Optional[float] = None  # Minimum order to qualify
    
    # Conditions
    trigger_condition: str = "booking"  # booking, order, birthday, first_visit
    eligibility_rules: Dict[str, Any] = {}
    
    # Display
    badge_text: str = "🎁 Paw Reward"
    badge_color: str = "amber"
    card_display: bool = True
    
    # Tracking
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None


class PawRewardInstance(BaseModel):
    """Individual reward earned by a customer"""
    reward_id: str
    pillar: str
    customer_email: str
    customer_name: Optional[str] = None
    pet_name: Optional[str] = None
    
    # Reference to what triggered the reward
    trigger_type: str  # order, booking, reservation, visit
    trigger_id: str  # Order ID, Booking ID, etc.
    
    # Reward details
    reward_type: str
    reward_name: str
    reward_value: float
    product_id: Optional[str] = None
    
    # Status
    status: str = "earned"  # earned, claimed, expired
    earned_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    claimed_at: Optional[str] = None
    expires_at: Optional[str] = None


# ==================== DEFAULT CONFIGURATIONS ====================

DEFAULT_PILLAR_REWARDS = {
    "celebrate": {
        "pillar": "celebrate",
        "enabled": True,
        "reward_type": "free_product",
        "reward_name": "Free Birthday Treat",
        "reward_description": "Complimentary treat with your celebration order",
        "reward_icon": "🎂",
        "product_category": "treats",
        "max_value": 300,
        "trigger_condition": "order",
        "badge_text": "🎂 Celebration Bonus",
        "badge_color": "pink"
    },
    "dine": {
        "pillar": "dine",
        "enabled": True,
        "reward_type": "free_product",
        "reward_name": "Birthday Cake Reward",
        "reward_description": "Free TDB birthday cake when celebrating your dog's birthday here",
        "reward_icon": "🎁",
        "product_category": "cakes",
        "product_collection": "bow-treats",  # Small bow cake from collection
        "max_value": 500,
        "trigger_condition": "birthday",
        "badge_text": "🎁 Birthday Perk",
        "badge_color": "amber",
        "eligibility_rules": {
            "requires_birthday_celebration": True,
            "requires_reservation": True
        }
    },
    "stay": {
        "pillar": "stay",
        "enabled": True,
        "reward_type": "free_product",
        "reward_name": "Paw Reward",
        "reward_description": "Every stay earns your dog a complimentary treat (up to ₹600)",
        "reward_icon": "🎁",
        "product_category": "treats",
        "max_value": 600,
        "trigger_condition": "booking",
        "badge_text": "🎁 Paw Reward",
        "badge_color": "amber"
    },
    "travel": {
        "pillar": "travel",
        "enabled": True,
        "reward_type": "freebie",
        "reward_name": "Pet Travel Kit",
        "reward_description": "Essential travel kit for your pet included",
        "reward_icon": "🎒",
        "max_value": 400,
        "trigger_condition": "booking",
        "badge_text": "🎒 Travel Kit",
        "badge_color": "blue"
    },
    "care": {
        "pillar": "care",
        "enabled": True,
        "reward_type": "discount",
        "reward_name": "First Visit Discount",
        "reward_description": "Special 15% discount on your first visit",
        "reward_icon": "🎉",
        "max_value": 500,
        "trigger_condition": "first_visit",
        "badge_text": "🎉 First Visit Offer",
        "badge_color": "purple"
    }
}


# ==================== API ROUTES ====================

@rewards_router.get("/config")
async def get_all_reward_configs():
    """Get reward configurations for all pillars"""
    if db is None:
        # Return defaults
        return {"configs": DEFAULT_PILLAR_REWARDS}
    
    configs = await db.paw_reward_configs.find({}, {"_id": 0}).to_list(100)
    
    if not configs:
        # Initialize with defaults
        for pillar, config in DEFAULT_PILLAR_REWARDS.items():
            config_copy = {**config}  # Create copy to avoid modification
            await db.paw_reward_configs.insert_one(config_copy)
        # Re-fetch without _id
        configs = await db.paw_reward_configs.find({}, {"_id": 0}).to_list(100)
    
    return {"configs": {c["pillar"]: c for c in configs}}


@rewards_router.get("/config/{pillar}")
async def get_pillar_reward_config(pillar: str):
    """Get reward configuration for a specific pillar"""
    if db is None:
        return DEFAULT_PILLAR_REWARDS.get(pillar, {})
    
    config = await db.paw_reward_configs.find_one({"pillar": pillar}, {"_id": 0})
    
    if not config:
        default = DEFAULT_PILLAR_REWARDS.get(pillar)
        if default:
            await db.paw_reward_configs.insert_one(default)
            return default
        raise HTTPException(status_code=404, detail=f"No reward config for pillar: {pillar}")
    
    return config


@rewards_router.put("/config/{pillar}")
async def update_pillar_reward_config(pillar: str, config: PawRewardConfig):
    """Update reward configuration for a pillar (admin)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    config_dict = config.model_dump()
    config_dict["pillar"] = pillar
    config_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.paw_reward_configs.update_one(
        {"pillar": pillar},
        {"$set": config_dict},
        upsert=True
    )
    
    return {"message": "Reward config updated", "config": config_dict}


@rewards_router.get("/eligible-products/{pillar}")
async def get_eligible_reward_products(pillar: str, max_value: float = 600):
    """Get products eligible as rewards for a pillar"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Get pillar config
    config = await db.paw_reward_configs.find_one({"pillar": pillar}, {"_id": 0})
    if not config:
        config = DEFAULT_PILLAR_REWARDS.get(pillar, {})
    
    # Build query based on config
    query = {
        "price": {"$lte": config.get("max_value", max_value)},
        "in_stock": {"$ne": False}
    }
    
    if config.get("product_category"):
        query["category"] = config["product_category"]
    
    if config.get("product_collection"):
        query["collections"] = config["product_collection"]
    
    products = await db.products_master.find(query, {"_id": 0}).limit(20).to_list(20)
    
    return {
        "pillar": pillar,
        "config": config,
        "products": products,
        "count": len(products)
    }


@rewards_router.post("/earn")
async def earn_reward(
    pillar: str,
    customer_email: str,
    customer_name: str = None,
    pet_name: str = None,
    trigger_type: str = "booking",
    trigger_id: str = None
):
    """Record a reward earned by a customer"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Get pillar config
    config = await db.paw_reward_configs.find_one({"pillar": pillar}, {"_id": 0})
    if not config:
        config = DEFAULT_PILLAR_REWARDS.get(pillar, {})
    
    if not config.get("enabled"):
        return {"message": "Rewards not enabled for this pillar", "earned": False}
    
    # Create reward instance
    import secrets
    reward = {
        "reward_id": f"REW-{pillar.upper()[:3]}-{secrets.token_hex(4).upper()}",
        "pillar": pillar,
        "customer_email": customer_email,
        "customer_name": customer_name,
        "pet_name": pet_name,
        "trigger_type": trigger_type,
        "trigger_id": trigger_id,
        "reward_type": config.get("reward_type"),
        "reward_name": config.get("reward_name"),
        "reward_value": config.get("max_value", 600),
        "status": "earned",
        "earned_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.paw_rewards_earned.insert_one(reward)
    
    return {"message": "Reward earned!", "reward": reward, "earned": True}


@rewards_router.get("/customer/{email}")
async def get_customer_rewards(email: str):
    """Get all rewards for a customer"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    rewards = await db.paw_rewards_earned.find(
        {"customer_email": email},
        {"_id": 0}
    ).sort("earned_at", -1).to_list(100)
    
    return {
        "email": email,
        "rewards": rewards,
        "total": len(rewards),
        "unclaimed": len([r for r in rewards if r.get("status") == "earned"])
    }


@rewards_router.post("/claim/{reward_id}")
async def claim_reward(reward_id: str):
    """Mark a reward as claimed"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = await db.paw_rewards_earned.update_one(
        {"reward_id": reward_id, "status": "earned"},
        {"$set": {
            "status": "claimed",
            "claimed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reward not found or already claimed")
    
    return {"message": "Reward claimed!", "reward_id": reward_id}


@rewards_router.get("/stats")
async def get_rewards_stats():
    """Get overall rewards statistics"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # By pillar
    pillar_pipeline = [
        {"$group": {
            "_id": "$pillar",
            "total": {"$sum": 1},
            "total_value": {"$sum": "$reward_value"},
            "claimed": {"$sum": {"$cond": [{"$eq": ["$status", "claimed"]}, 1, 0]}}
        }}
    ]
    
    pillar_stats = await db.paw_rewards_earned.aggregate(pillar_pipeline).to_list(100)
    
    # Total stats
    total = await db.paw_rewards_earned.count_documents({})
    claimed = await db.paw_rewards_earned.count_documents({"status": "claimed"})
    
    return {
        "total_rewards_earned": total,
        "total_claimed": claimed,
        "by_pillar": {s["_id"]: s for s in pillar_stats}
    }
