"""
Mira Intelligence Engine - The Learning Layer
==============================================
This module provides:
1. Passive Learning - Silent observation of browsing behavior
2. Predictive Recommendations - Pattern-based suggestions
3. Cross-Pillar Intelligence - Connecting insights
4. Learning from Outcomes - Track what works

Every signal is stored with confidence levels:
- "inferred" (low confidence) - From browsing behavior
- "stated" (high confidence) - Explicitly mentioned by user
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import logging
import os
import jwt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira/intelligence", tags=["mira-intelligence"])

# Database reference
_db = None

def set_intelligence_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db

# JWT Config
SECRET_KEY = os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof")
ALGORITHM = "HS256"

# ============== MODELS ==============

class BrowsingSignal(BaseModel):
    """A browsing behavior signal"""
    page: str  # travel, stay, care, etc.
    action: str  # view, filter, click, add_to_cart, etc.
    target: Optional[str] = None  # product_id, category, filter_value
    metadata: Optional[Dict[str, Any]] = None

class UserPreferenceUpdate(BaseModel):
    """User preference update"""
    pet_id: str
    field: str
    value: Any
    source: str = "user-stated"  # user-stated, inferred
    confidence: str = "high"  # high, medium, low

class FeedbackSignal(BaseModel):
    """Feedback on a recommendation/suggestion"""
    recommendation_id: str
    action: str  # accepted, rejected, ignored
    context: Optional[Dict[str, Any]] = None

# ============== HELPER FUNCTIONS ==============

async def get_user_from_token(authorization: Optional[str] = None):
    """Extract user info from JWT token"""
    if not authorization:
        return None
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email = payload.get("sub") or payload.get("email")
        
        if not user_email:
            return None
        
        db = get_db()
        user = await db.users.find_one({"email": user_email}, {"_id": 0, "password_hash": 0})
        return user
    except Exception as e:
        logger.warning(f"Token decode error: {e}")
        return None

# ============== PASSIVE LEARNING ==============

# Signal type configurations with inference rules
SIGNAL_INFERENCE_RULES = {
    # Browsing signals
    "view_product": {
        "min_count": 2,
        "confidence": "low",
        "inferences": {
            "treats": {"field": "preferences.interested_in", "value": "treats"},
            "chicken": {"field": "preferences.likely_flavor", "value": "chicken"},
            "grain-free": {"field": "preferences.likely_diet", "value": "grain-free"},
            "senior": {"field": "life_stage.likely", "value": "senior"},
        }
    },
    "add_to_cart": {
        "min_count": 1,
        "confidence": "medium",
        "inferences": {
            "treats": {"field": "preferences.interested_in", "value": "treats", "upgrade": True},
        }
    },
    "filter_used": {
        "min_count": 2,
        "confidence": "low",
        "inferences": {
            "large_dog": {"field": "size.likely", "value": "large"},
            "small_dog": {"field": "size.likely", "value": "small"},
        }
    },
    "pillar_visit": {
        "min_count": 3,
        "confidence": "low",
        "inferences": {
            "travel": {"field": "interests.pillars", "value": "travel"},
            "stay": {"field": "interests.pillars", "value": "stay"},
            "care": {"field": "interests.pillars", "value": "care"},
        }
    }
}

@router.post("/signal")
async def record_browsing_signal(
    signal: BrowsingSignal,
    authorization: Optional[str] = Header(None)
):
    """
    Record a browsing signal for passive learning.
    Called from frontend on user actions.
    """
    db = get_db()
    user = await get_user_from_token(authorization)
    
    if not user:
        # Still record anonymous signals with session tracking
        return {"status": "recorded", "user_type": "anonymous"}
    
    now = datetime.now(timezone.utc).isoformat()
    user_id = user.get("id") or user.get("email")
    
    # Record the signal
    signal_doc = {
        "user_id": user_id,
        "user_email": user.get("email"),
        "page": signal.page,
        "action": signal.action,
        "target": signal.target,
        "metadata": signal.metadata or {},
        "timestamp": now,
        "processed": False
    }
    
    await db.mira_signals.insert_one(signal_doc)
    
    # Check if we should create/update inferences
    await process_signals_for_user(user_id)
    
    return {"status": "recorded", "user_type": "member"}

async def process_signals_for_user(user_id: str):
    """Process signals and create inferences for a user"""
    db = get_db()
    
    # Get recent unprocessed signals (last 24 hours)
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    
    signals = await db.mira_signals.find({
        "user_id": user_id,
        "timestamp": {"$gt": cutoff}
    }).to_list(100)
    
    if not signals:
        return
    
    # Count signals by type
    signal_counts = {}
    for sig in signals:
        key = f"{sig['action']}:{sig.get('target', 'unknown')}"
        signal_counts[key] = signal_counts.get(key, 0) + 1
    
    # Check inference rules
    inferences = []
    for sig_key, count in signal_counts.items():
        action, target = sig_key.split(":", 1)
        
        if action in SIGNAL_INFERENCE_RULES:
            rule = SIGNAL_INFERENCE_RULES[action]
            if count >= rule["min_count"]:
                # Check if target matches any inference
                for pattern, inference in rule.get("inferences", {}).items():
                    if pattern.lower() in target.lower():
                        inferences.append({
                            "field": inference["field"],
                            "value": inference["value"],
                            "confidence": rule["confidence"],
                            "source": "inferred",
                            "signal_count": count
                        })
    
    # Store inferences
    if inferences:
        await db.mira_inferences.update_one(
            {"user_id": user_id},
            {
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
                "$addToSet": {"inferences": {"$each": inferences}}
            },
            upsert=True
        )
    
    # Mark signals as processed
    await db.mira_signals.update_many(
        {"user_id": user_id, "processed": False},
        {"$set": {"processed": True}}
    )

# ============== PREDICTIVE RECOMMENDATIONS ==============

@router.get("/recommendations/{pet_id}")
async def get_pet_recommendations(
    pet_id: str,
    pillar: Optional[str] = None,
    limit: int = 5,
    authorization: Optional[str] = Header(None)
):
    """
    Get personalized recommendations for a pet based on:
    - Pet Soul data
    - Inferred preferences
    - Cross-pillar patterns
    - What worked before
    """
    db = get_db()
    user = await get_user_from_token(authorization)
    
    # Load pet data
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        pet = await db.pets.find_one({"name": pet_id}, {"_id": 0})
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "your pet")
    
    # Build recommendation context
    context = {
        "pet_id": pet_id,
        "pet_name": pet_name,
        "breed": pet.get("breed") or pet.get("identity", {}).get("breed"),
        "size": pet.get("identity", {}).get("size"),
        "age": pet.get("age") or pet.get("identity", {}).get("age"),
        "preferences": pet.get("preferences", {}),
        "health": pet.get("health", {}),
        "personality": pet.get("personality", {}),
        "soul_answers": pet.get("doggy_soul_answers", {})
    }
    
    # Get inferred preferences for user
    inferences = None
    if user:
        user_id = user.get("id") or user.get("email")
        inference_doc = await db.mira_inferences.find_one({"user_id": user_id})
        if inference_doc:
            inferences = inference_doc.get("inferences", [])
    
    recommendations = []
    
    # Generate pillar-specific recommendations
    if pillar == "travel" or not pillar:
        travel_recs = await generate_travel_recommendations(context, inferences, db)
        recommendations.extend(travel_recs)
    
    if pillar == "care" or not pillar:
        care_recs = await generate_care_recommendations(context, inferences, db)
        recommendations.extend(care_recs)
    
    if pillar == "celebrate" or not pillar:
        celebrate_recs = await generate_celebration_recommendations(context, db)
        recommendations.extend(celebrate_recs)
    
    if pillar == "shop" or not pillar:
        shop_recs = await generate_shop_recommendations(context, inferences, db)
        recommendations.extend(shop_recs)
    
    # Sort by relevance score and limit
    recommendations.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    
    return {
        "pet_id": pet_id,
        "pet_name": pet_name,
        "recommendations": recommendations[:limit],
        "context_used": list(context.keys())
    }

async def generate_travel_recommendations(context: Dict, inferences: List, db) -> List[Dict]:
    """Generate travel-related recommendations"""
    recs = []
    pet_name = context.get("pet_name", "your pet")
    
    # Check travel preferences from Pet Soul
    travel_style = context.get("soul_answers", {}).get("usual_travel")
    car_rides = context.get("soul_answers", {}).get("car_rides")
    crate_trained = context.get("soul_answers", {}).get("crate_trained")
    
    if travel_style == "Car" or car_rides == "Loves them":
        recs.append({
            "id": f"rec-travel-car-{context['pet_id']}",
            "type": "service",
            "pillar": "travel",
            "title": f"Pet-Friendly Cab for {pet_name}",
            "description": f"Based on {pet_name}'s love for car rides, I can arrange a comfortable cab anytime.",
            "reason": f"{pet_name} loves car rides",
            "relevance_score": 0.9,
            "cta": "Book a Cab"
        })
    
    if crate_trained == "Yes":
        recs.append({
            "id": f"rec-travel-flight-{context['pet_id']}",
            "type": "service",
            "pillar": "travel",
            "title": "Flight-Ready Travel",
            "description": f"Since {pet_name} is crate trained, air travel is an option. I can help with bookings.",
            "reason": "Crate trained for air travel",
            "relevance_score": 0.7,
            "cta": "Plan Flight"
        })
    
    return recs

async def generate_care_recommendations(context: Dict, inferences: List, db) -> List[Dict]:
    """Generate care-related recommendations"""
    recs = []
    pet_name = context.get("pet_name", "your pet")
    
    # Check handling comfort
    handling = context.get("soul_answers", {}).get("handling_comfort")
    
    if handling in ["Very comfortable", "Tolerates it"]:
        recs.append({
            "id": f"rec-care-grooming-{context['pet_id']}",
            "type": "service",
            "pillar": "care",
            "title": f"Grooming Session for {pet_name}",
            "description": f"Regular grooming keeps {pet_name} healthy and happy.",
            "reason": f"{pet_name} is comfortable with handling",
            "relevance_score": 0.8,
            "cta": "Book Grooming"
        })
    elif handling == "Gets anxious":
        recs.append({
            "id": f"rec-care-home-{context['pet_id']}",
            "type": "service",
            "pillar": "care",
            "title": f"Home Grooming for {pet_name}",
            "description": f"I'd recommend home grooming since {pet_name} gets anxious. Less stressful!",
            "reason": f"{pet_name} prefers familiar environments",
            "relevance_score": 0.9,
            "cta": "Book Home Visit"
        })
    
    # Check health info
    allergies = context.get("health", {}).get("allergies", []) or context.get("preferences", {}).get("allergies", [])
    if allergies:
        recs.append({
            "id": f"rec-care-allergy-{context['pet_id']}",
            "type": "reminder",
            "pillar": "care",
            "title": "Allergy-Safe Products",
            "description": f"Remember: {pet_name} has allergies to {', '.join(allergies[:2])}. I'll filter recommendations accordingly.",
            "reason": "Known allergies",
            "relevance_score": 0.95,
            "cta": "Shop Safe Products"
        })
    
    return recs

async def generate_celebration_recommendations(context: Dict, db) -> List[Dict]:
    """Generate celebration recommendations based on upcoming dates"""
    recs = []
    pet_name = context.get("pet_name", "your pet")
    pet_id = context.get("pet_id")
    
    # Check for upcoming birthday
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "birth_date": 1, "celebrations": 1})
    if pet and pet.get("birth_date"):
        try:
            birth_date = datetime.fromisoformat(pet["birth_date"].replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            
            # Calculate next birthday
            next_birthday = birth_date.replace(year=now.year)
            if next_birthday < now:
                next_birthday = next_birthday.replace(year=now.year + 1)
            
            days_until = (next_birthday - now).days
            
            if days_until <= 30:
                recs.append({
                    "id": f"rec-celebrate-birthday-{pet_id}",
                    "type": "reminder",
                    "pillar": "celebrate",
                    "title": f"🎂 {pet_name}'s Birthday Coming Up!",
                    "description": f"{pet_name}'s birthday is in {days_until} days! Shall I start planning the celebration?",
                    "reason": f"Birthday in {days_until} days",
                    "relevance_score": 1.0 if days_until <= 7 else 0.85,
                    "cta": "Plan Celebration"
                })
        except:
            pass
    
    return recs

async def generate_shop_recommendations(context: Dict, inferences: List, db) -> List[Dict]:
    """Generate shopping recommendations"""
    recs = []
    pet_name = context.get("pet_name", "your pet")
    
    # Check treat preferences
    favorite_treats = context.get("preferences", {}).get("favorite_treats", [])
    
    if favorite_treats:
        for treat in favorite_treats[:2]:
            recs.append({
                "id": f"rec-shop-treat-{treat.lower().replace(' ', '-')}",
                "type": "product",
                "pillar": "shop",
                "title": f"{treat} for {pet_name}",
                "description": f"Since {pet_name} loves {treat}, here are some options.",
                "reason": f"Favorite: {treat}",
                "relevance_score": 0.8,
                "cta": "Shop Now"
            })
    
    # Use inferred preferences
    if inferences:
        for inference in inferences:
            if inference.get("field") == "preferences.likely_flavor":
                recs.append({
                    "id": f"rec-shop-inferred-{inference['value']}",
                    "type": "product",
                    "pillar": "shop",
                    "title": f"{inference['value'].title()} Treats",
                    "description": f"Based on your browsing, {pet_name} might enjoy {inference['value']} flavors.",
                    "reason": f"Inferred preference (confidence: {inference.get('confidence', 'low')})",
                    "relevance_score": 0.6,
                    "cta": "Explore"
                })
    
    return recs

# ============== CROSS-PILLAR INTELLIGENCE ==============

@router.get("/cross-pillar/{user_id}")
async def get_cross_pillar_insights(
    user_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Get cross-pillar insights for a user.
    Connects patterns across different service areas.
    """
    db = get_db()
    
    # Get user's recent activity across pillars
    recent_tickets = await db.mira_tickets.find({
        "$or": [
            {"member.id": user_id},
            {"member.email": user_id}
        ]
    }).sort("created_at", -1).limit(20).to_list(20)
    
    # Analyze patterns
    pillar_counts = {}
    for ticket in recent_tickets:
        pillar = ticket.get("pillar", "other")
        pillar_counts[pillar] = pillar_counts.get(pillar, 0) + 1
    
    insights = []
    
    # Travel + Care connection
    if pillar_counts.get("travel", 0) > 0 and pillar_counts.get("care", 0) > 0:
        insights.append({
            "type": "cross_pillar",
            "pillars": ["travel", "care"],
            "insight": "You often book care services around travel. Want me to bundle them?",
            "suggestion": "Bundle grooming before your next trip"
        })
    
    # Stay + Celebrate connection
    if pillar_counts.get("stay", 0) > 0:
        insights.append({
            "type": "cross_pillar",
            "pillars": ["stay", "celebrate"],
            "insight": "Planning a pawcation? I can arrange a special celebration at your stay.",
            "suggestion": "Add birthday cake to your stay booking"
        })
    
    return {
        "user_id": user_id,
        "pillar_activity": pillar_counts,
        "insights": insights
    }

# ============== LEARNING FROM OUTCOMES ==============

@router.post("/feedback")
async def record_feedback(
    feedback: FeedbackSignal,
    authorization: Optional[str] = Header(None)
):
    """
    Record feedback on a recommendation.
    Used to improve future suggestions.
    """
    db = get_db()
    user = await get_user_from_token(authorization)
    
    now = datetime.now(timezone.utc).isoformat()
    
    feedback_doc = {
        "recommendation_id": feedback.recommendation_id,
        "action": feedback.action,
        "context": feedback.context or {},
        "user_id": user.get("id") if user else None,
        "user_email": user.get("email") if user else None,
        "timestamp": now
    }
    
    await db.mira_feedback.insert_one(feedback_doc)
    
    # Update recommendation effectiveness score
    if feedback.action == "accepted":
        await db.mira_recommendations.update_one(
            {"id": feedback.recommendation_id},
            {
                "$inc": {"accepted_count": 1, "shown_count": 1},
                "$set": {"last_accepted": now}
            }
        )
    elif feedback.action == "rejected":
        await db.mira_recommendations.update_one(
            {"id": feedback.recommendation_id},
            {
                "$inc": {"rejected_count": 1, "shown_count": 1},
                "$set": {"last_rejected": now}
            }
        )
    else:
        await db.mira_recommendations.update_one(
            {"id": feedback.recommendation_id},
            {"$inc": {"shown_count": 1}}
        )
    
    return {"status": "recorded", "action": feedback.action}

@router.get("/effectiveness")
async def get_recommendation_effectiveness(
    pillar: Optional[str] = None,
    limit: int = 10
):
    """Get effectiveness metrics for recommendations"""
    db = get_db()
    
    query = {}
    if pillar:
        query["pillar"] = pillar
    
    recommendations = await db.mira_recommendations.find(query).sort("accepted_count", -1).limit(limit).to_list(limit)
    
    metrics = []
    for rec in recommendations:
        shown = rec.get("shown_count", 0)
        accepted = rec.get("accepted_count", 0)
        rejected = rec.get("rejected_count", 0)
        
        effectiveness = (accepted / shown * 100) if shown > 0 else 0
        
        metrics.append({
            "id": rec.get("id"),
            "type": rec.get("type"),
            "pillar": rec.get("pillar"),
            "shown_count": shown,
            "accepted_count": accepted,
            "rejected_count": rejected,
            "effectiveness_percent": round(effectiveness, 1)
        })
    
    return {"metrics": metrics}

# ============== PROACTIVE TRIGGERS ==============

@router.get("/triggers/{user_id}")
async def get_proactive_triggers(
    user_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Get proactive notification triggers for a user.
    These can be used for WhatsApp/Email outreach.
    """
    db = get_db()
    
    triggers = []
    now = datetime.now(timezone.utc)
    
    # Get user's pets
    pets = await db.pets.find({
        "$or": [
            {"owner_email": user_id},
            {"user_id": user_id}
        ]
    }, {"_id": 0}).to_list(10)
    
    for pet in pets:
        pet_name = pet.get("name", "your pet")
        pet_id = pet.get("id")
        
        # Check vaccine reminders
        vaccinations = pet.get("health", {}).get("vaccinations", [])
        for vax in vaccinations:
            if vax.get("next_due"):
                try:
                    due_date = datetime.fromisoformat(vax["next_due"].replace("Z", "+00:00"))
                    days_until = (due_date - now).days
                    
                    if 0 < days_until <= 15:
                        triggers.append({
                            "type": "vaccine_reminder",
                            "pet_id": pet_id,
                            "pet_name": pet_name,
                            "message": f"{pet_name}'s {vax.get('name', 'vaccine')} is due in {days_until} days",
                            "urgency": "high" if days_until <= 7 else "medium",
                            "cta": "Book Vet Visit"
                        })
                except:
                    pass
        
        # Check birthday
        if pet.get("birth_date"):
            try:
                birth_date = datetime.fromisoformat(pet["birth_date"].replace("Z", "+00:00"))
                next_birthday = birth_date.replace(year=now.year)
                if next_birthday < now:
                    next_birthday = next_birthday.replace(year=now.year + 1)
                
                days_until = (next_birthday - now).days
                
                if 0 < days_until <= 14:
                    triggers.append({
                        "type": "birthday_reminder",
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "message": f"{pet_name}'s birthday is in {days_until} days! Time to celebrate?",
                        "urgency": "low",
                        "cta": "Plan Celebration"
                    })
            except:
                pass
    
    # Check reorder triggers (last order was 3+ weeks ago)
    last_order = await db.orders.find_one(
        {"user_email": user_id},
        sort=[("created_at", -1)]
    )
    
    if last_order:
        try:
            order_date = datetime.fromisoformat(last_order["created_at"].replace("Z", "+00:00"))
            days_since = (now - order_date).days
            
            if days_since >= 21:
                triggers.append({
                    "type": "reorder_reminder",
                    "message": f"It's been {days_since} days since your last order. Running low on supplies?",
                    "urgency": "low",
                    "cta": "Reorder Favorites"
                })
        except:
            pass
    
    return {
        "user_id": user_id,
        "triggers": triggers,
        "generated_at": now.isoformat()
    }
