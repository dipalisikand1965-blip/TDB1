"""
Pet Wrapped - Main Generation API
The gift: 6 beautiful cards with real data
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional
import os

router = APIRouter(prefix="/api/wrapped", tags=["Pet Wrapped"])

# MongoDB connection
from pymongo import MongoClient
client = MongoClient(os.environ.get("MONGO_URL"))
db = client[os.environ.get("DB_NAME", "doggy_company")]


# ============================================
# PET WRAPPED GENERATION
# ============================================

@router.get("/generate/{pet_id}")
async def generate_pet_wrapped(pet_id: str, year: Optional[int] = None):
    """
    Generate Pet Wrapped data for a pet.
    Returns all data needed to render the 6 cards.
    """
    if year is None:
        year = datetime.now().year
    
    # Get pet data
    try:
        pet = db.pets.find_one({"_id": ObjectId(pet_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid pet ID")
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "Your Pet")
    
    # Get owner/parent data
    owner_id = pet.get("owner_id") or pet.get("user_id")
    parent_name = "Pet Parent"
    if owner_id:
        # Try to find user - handle both ObjectId and UUID formats
        user = None
        try:
            # Try as ObjectId first
            user = db.users.find_one({"_id": ObjectId(owner_id)})
        except:
            # Try as string ID
            user = db.users.find_one({"_id": owner_id})
        if not user:
            # Try by email if owner_email exists
            owner_email = pet.get("owner_email")
            if owner_email:
                user = db.users.find_one({"email": owner_email})
        if user:
            parent_name = user.get("name", user.get("first_name", "Pet Parent"))
    
    # ============================================
    # CARD 1: COVER DATA
    # ============================================
    cover_data = {
        "pet_name": pet_name,
        "breed": pet.get("breed", "Beloved Companion"),
        "birthday": pet.get("birthday"),
        "gotcha_day": pet.get("gotcha_day"),
        "year": year,
        "rainbow_bridge": pet.get("rainbow_bridge", False),
        "tagline": generate_cover_tagline(pet)
    }
    
    # ============================================
    # CARD 2: SOUL SCORE JOURNEY
    # ============================================
    soul_history = list(db.soul_score_history.find(
        {"pet_id": pet_id}
    ).sort("recorded_at", 1))
    
    current_score = pet.get("soul_score", 0)
    
    if len(soul_history) >= 3:
        journey = [
            {"score": soul_history[0]["score"], "label": "Start"},
            {"score": soul_history[len(soul_history)//2]["score"], "label": "Mid"},
            {"score": current_score, "label": "Now"}
        ]
    elif len(soul_history) >= 1:
        journey = [
            {"score": soul_history[0]["score"], "label": "Start"},
            {"score": current_score, "label": "Now"}
        ]
    else:
        journey = [{"score": current_score, "label": "Now"}]
    
    # Get a meaningful soul question answer for the quote
    soul_data = pet.get("soul_data", {})
    soul_quote = get_soul_quote(soul_data, pet_name)
    
    soul_score_data = {
        "current_score": current_score,
        "journey": journey,
        "soul_quote": soul_quote
    }
    
    # ============================================
    # CARD 3: MIRA MOMENTS
    # ============================================
    # Count Mira conversations
    convo_count = db.mira_conversations.count_documents({"pet_id": pet_id})
    
    # Count Soul Profile questions answered
    questions_answered = count_soul_questions(soul_data)
    
    # Get pillars explored from conversations and tickets
    pillars_explored = get_pillars_explored(pet_id)
    
    mira_moments_data = {
        "conversation_count": convo_count,
        "questions_answered": questions_answered,
        "pillars_explored": pillars_explored,
        "pillars_list": list(pillars_explored.keys())[:8],
        "ai_memory": None  # Will be generated separately
    }
    
    # ============================================
    # CARD 4: LEGACY / RELATIONSHIPS
    # ============================================
    relationships = pet.get("relationships", {})
    
    # Find related pets (babies, siblings, partners)
    babies = []
    partners = []
    siblings = []
    
    if relationships:
        baby_ids = relationships.get("babies", [])
        partner_ids = relationships.get("partners", [])
        sibling_ids = relationships.get("siblings", [])
        
        for baby_id in baby_ids[:10]:
            try:
                baby = db.pets.find_one({"_id": ObjectId(baby_id)})
                if baby:
                    babies.append({"name": baby.get("name"), "id": str(baby["_id"])})
            except:
                pass
        
        for partner_id in partner_ids[:2]:
            try:
                partner = db.pets.find_one({"_id": ObjectId(partner_id)})
                if partner:
                    partners.append({"name": partner.get("name"), "id": str(partner["_id"])})
            except:
                pass
    
    legacy_data = {
        "has_legacy": len(babies) > 0 or len(partners) > 0,
        "babies": babies,
        "partners": partners,
        "siblings": siblings,
        "family_humans": relationships.get("family", []),
        "pet_friends": relationships.get("pet_friends", [])
    }
    
    # ============================================
    # CARD 5: PILLARS & TREATS
    # ============================================
    # Get service tickets by pillar
    pillar_usage = get_pillar_usage(pet_id, year)
    
    # Get Doggy Bakery orders (if available)
    treat_count = get_treat_count(owner_id, year) if owner_id else 0
    
    pillars_data = {
        "top_pillars": pillar_usage[:5],
        "treat_count": treat_count,
        "total_services": sum(p["count"] for p in pillar_usage)
    }
    
    # ============================================
    # CARD 6: CLOSING
    # ============================================
    closing_data = {
        "pet_name": pet_name,
        "parent_name": parent_name,
        "rainbow_bridge": pet.get("rainbow_bridge", False),
        "philosophy_quote": get_philosophy_quote(pet)
    }
    
    # ============================================
    # ASSEMBLE FULL WRAPPED DATA
    # ============================================
    wrapped_data = {
        "pet_id": pet_id,
        "pet_name": pet_name,
        "year": year,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "cards": {
            "cover": cover_data,
            "soul_score": soul_score_data,
            "mira_moments": mira_moments_data,
            "legacy": legacy_data,
            "pillars": pillars_data,
            "closing": closing_data
        },
        "share_data": {
            "single_card_text": f"{pet_name}'s Soul Score: {current_score}%",
            "cta": "Does your dog have a Soul Profile yet?",
            "url": f"https://thedoggycompany.com/wrapped/{pet_id}"
        }
    }
    
    # Store the generated wrapped for caching
    db.pet_wrapped.update_one(
        {"pet_id": pet_id, "year": year},
        {"$set": wrapped_data},
        upsert=True
    )
    
    return wrapped_data


# ============================================
# HELPER FUNCTIONS
# ============================================

def generate_cover_tagline(pet: dict) -> str:
    """Generate an emotional tagline for the cover card."""
    if pet.get("rainbow_bridge"):
        return "Their eyes held a universe of love.\nAnd they left it behind."
    
    personality = pet.get("personality", {})
    if personality.get("temperament") == "calm":
        return "A gentle soul who found peace in being loved."
    elif personality.get("energy_level") == "high":
        return "A year of adventures, tail wags, and endless joy."
    else:
        return "A year of being truly known.\nA year of being truly loved."


def get_soul_quote(soul_data: dict, pet_name: str) -> str:
    """Get a meaningful quote from Soul Profile answers."""
    # Priority: forgiveness > bond > joy
    if soul_data.get("forgiveness"):
        return f'"What has {pet_name} forgiven you for? The times you were distracted. The times you forgot."'
    elif soul_data.get("bond") or soul_data.get("relationship"):
        return f'"What has {pet_name} seen you through? The hard years. The quiet ones."'
    elif soul_data.get("joy") or soul_data.get("delight"):
        return f'"What makes {pet_name}\'s eyes light up? Not just food or walks — genuine delight."'
    else:
        return f'"Every dog deserves to be truly known. {pet_name} is."'


def count_soul_questions(soul_data: dict) -> int:
    """Count how many Soul Profile questions have been answered."""
    if not soul_data:
        return 0
    count = 0
    for key, value in soul_data.items():
        if value and str(value).strip():
            count += 1
    return min(count, 51)  # Max 51 questions


def get_pillars_explored(pet_id: str) -> dict:
    """Get pillars explored from Mira conversations and service tickets."""
    pillars = {}
    
    # From conversations
    convos = db.mira_conversations.find({"pet_id": pet_id})
    for convo in convos:
        pillar = convo.get("pillar_context") or convo.get("pillar")
        if pillar:
            pillars[pillar] = pillars.get(pillar, 0) + 1
    
    # From service tickets
    tickets = db.service_desk_tickets.find({"pet_id": pet_id})
    for ticket in tickets:
        pillar = ticket.get("pillar")
        if pillar:
            pillars[pillar] = pillars.get(pillar, 0) + 1
    
    return pillars


def get_pillar_usage(pet_id: str, year: int) -> list:
    """Get pillar usage statistics for the year."""
    pillar_counts = {}
    
    # Query service tickets
    start_date = datetime(year, 1, 1, tzinfo=timezone.utc)
    end_date = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
    
    tickets = db.service_desk_tickets.find({
        "pet_id": pet_id,
        "created_at": {"$gte": start_date, "$lte": end_date}
    })
    
    pillar_icons = {
        "celebrate": "🎉", "dine": "🍽️", "stay": "🏠", "travel": "✈️",
        "care": "💊", "enjoy": "🎮", "fit": "🏃", "learn": "📚",
        "paperwork": "📋", "advisory": "👨‍⚕️", "emergency": "🚨",
        "farewell": "🌈", "adopt": "🐾", "shop": "🛒"
    }
    
    for ticket in tickets:
        pillar = ticket.get("pillar", "").lower()
        if pillar:
            pillar_counts[pillar] = pillar_counts.get(pillar, 0) + 1
    
    # Sort by count and format
    sorted_pillars = sorted(pillar_counts.items(), key=lambda x: x[1], reverse=True)
    
    result = []
    for pillar, count in sorted_pillars:
        total = sum(pillar_counts.values()) or 1
        percentage = int((count / total) * 100)
        result.append({
            "name": pillar.capitalize(),
            "icon": pillar_icons.get(pillar, "📌"),
            "count": count,
            "percentage": percentage
        })
    
    return result


def get_treat_count(user_id: str, year: int) -> int:
    """Get count of Doggy Bakery treats ordered."""
    try:
        start_date = datetime(year, 1, 1, tzinfo=timezone.utc)
        end_date = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        
        orders = db.orders.find({
            "user_id": user_id,
            "created_at": {"$gte": start_date, "$lte": end_date}
        })
        
        count = 0
        for order in orders:
            items = order.get("items", [])
            count += len(items)
        
        return count
    except:
        return 0


def get_philosophy_quote(pet: dict) -> str:
    """Get the closing philosophy quote."""
    if pet.get("rainbow_bridge"):
        return "A dog is not in your life.\nYou are in theirs.\n\nThey knew that.\nThey lived it completely."
    else:
        return "A dog is not in your life.\nYou are in theirs.\n\nAnd this year, they were truly known."
