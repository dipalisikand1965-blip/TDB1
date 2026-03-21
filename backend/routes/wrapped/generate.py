"""
Pet Wrapped - Main Generation API
The gift: 6 beautiful cards with real data
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional
import os
import sys

# Add the parent directory to the path to import from main backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from pet_score_logic import calculate_pet_soul_score

router = APIRouter(prefix="/api/wrapped", tags=["Pet Wrapped"])

# MongoDB connection
from pymongo import MongoClient
client = MongoClient(os.environ.get("MONGO_URL"))
db_name = os.environ.get("DB_NAME") or "test_database"
db = client[db_name]


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
    
    # Get pet data - try multiple ID formats
    pet = None
    
    # First try by 'id' field (for pets with pet-XXXX format)
    if pet_id.startswith("pet-"):
        pet = db.pets.find_one({"id": pet_id})
    
    # If not found, try by _id as ObjectId
    if not pet:
        try:
            pet = db.pets.find_one({"_id": ObjectId(pet_id)})
        except:
            pass
    
    # If still not found, try by _id as string
    if not pet:
        pet = db.pets.find_one({"_id": pet_id})
    
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
    # Get soul archetype for this pet
    soul_archetype = pet.get("soul_archetype", {}) or {}
    archetype_name = (soul_archetype.get("archetype_name") or soul_archetype.get("primary_archetype") or "").replace("_", " ").title() if isinstance(soul_archetype, dict) else str(soul_archetype).replace("_", " ").title()
    archetype_emoji = soul_archetype.get("archetype_emoji", "✦") if isinstance(soul_archetype, dict) else "✦"
    
    cover_data = {
        "pet_name": pet_name,
        "breed": pet.get("breed", "Beloved Companion"),
        "birthday": pet.get("birthday"),
        "gotcha_day": pet.get("gotcha_day"),
        "year": year,
        "rainbow_bridge": pet.get("rainbow_bridge", False),
        "tagline": generate_cover_tagline(pet),
        "archetype_name": archetype_name,
        "archetype_emoji": archetype_emoji,
    }
    
    # ============================================
    # CARD 2: SOUL SCORE JOURNEY
    # ============================================
    soul_history = list(db.soul_score_history.find(
        {"pet_id": pet_id}
    ).sort("recorded_at", 1))
    
    # Calculate score using the same weighted scoring as /api/pets/my-pets
    # This ensures consistency across all components
    stored_score = pet.get("overall_score", 0) or pet.get("soul_score", 0) or 0
    answers = pet.get("doggy_soul_answers", {}) or pet.get("soul_answers", {})
    
    if answers:
        score_data = calculate_pet_soul_score(answers)
        calculated_score = score_data["total_score"]
        # Use the HIGHER of stored vs calculated score
        current_score = max(stored_score, calculated_score)
    else:
        current_score = stored_score
    
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
    # Get owner email for broader queries
    owner_email = pet.get("owner_email")
    
    # Count Mira conversations from multiple sources
    # Priority: live_conversation_threads > mira_tickets > mira_conversations > memories
    convo_count = 0
    
    # 1. Count from live_conversation_threads (main conversation storage)
    try:
        thread_count = db.live_conversation_threads.count_documents({"pet_id": pet_id})
        convo_count = max(convo_count, thread_count)
    except:
        pass
    
    # 2. Count from mira_tickets
    try:
        ticket_count = db.mira_tickets.count_documents({"pet_id": pet_id})
        convo_count = max(convo_count, convo_count + ticket_count)  # Add tickets to conversations
    except:
        pass
    
    # 3. Count from mira_conversations (legacy)
    try:
        legacy_count = db.mira_conversations.count_documents({"pet_id": pet_id})
        convo_count = max(convo_count, legacy_count)
    except:
        pass
    
    # 4. Also count conversation memories stored on pet
    conversation_memories = pet.get("conversation_memories", [])
    convo_count = max(convo_count, len(conversation_memories))
    
    # 5. Count from mira_sessions by user_email if available
    if owner_email:
        try:
            # Try to find sessions by user in thread collection
            user_thread_count = db.live_conversation_threads.count_documents({"user_email": owner_email})
            convo_count = max(convo_count, user_thread_count)
        except:
            pass
    
    # Count Soul Profile questions answered from doggy_soul_answers
    doggy_soul_answers = pet.get("doggy_soul_answers", {})
    questions_answered = sum(1 for v in doggy_soul_answers.values() if v and str(v).strip())
    if questions_answered == 0:
        questions_answered = count_soul_questions(soul_data)
    
    # Get pillars explored from conversations and tickets
    pillars_explored = get_pillars_explored(pet_id, owner_email)
    
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
    pet_friends = []
    
    # Check relationships stored on the pet
    if relationships:
        baby_ids = relationships.get("babies", [])
        partner_ids = relationships.get("partners", [])
        sibling_ids = relationships.get("siblings", [])
        dog_friends = relationships.get("dog_friends", [])
        
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
        
        # Add dog_friends to pet_friends
        for friend_name in dog_friends[:5]:
            if isinstance(friend_name, str):
                pet_friends.append(friend_name)
    
    # If no babies/partners found, look for pets with same owner that might be family
    if not babies and not partners and owner_email:
        # Handle both pet-XXXX format and ObjectId format
        exclude_filter = {"id": {"$ne": pet_id}} if pet_id.startswith("pet-") else {}
        try:
            if not pet_id.startswith("pet-"):
                exclude_filter = {"_id": {"$ne": ObjectId(pet_id)}}
        except:
            pass
        
        same_owner_pets = list(db.pets.find({
            "owner_email": owner_email,
            **exclude_filter
        }))
        
        # Check if pet names start with same letter (M-Squad pattern)
        pet_first_letter = pet_name[0].upper() if pet_name else ""
        matching_letter_pets = [p for p in same_owner_pets if p.get("name", "")[0].upper() == pet_first_letter]
        
        if len(matching_letter_pets) >= 3:
            # This looks like a family dynasty (M-Squad pattern)
            for family_pet in matching_letter_pets[:10]:
                babies.append({
                    "name": family_pet.get("name"),
                    "id": str(family_pet["_id"])
                })
    
    legacy_data = {
        "has_legacy": len(babies) > 0 or len(partners) > 0,
        "babies": babies,
        "partners": partners,
        "siblings": siblings,
        "family_humans": relationships.get("family", relationships.get("human_favorites", [])),
        "pet_friends": pet_friends
    }
    
    # ============================================
    # CARD 5: PILLARS & TREATS
    # ============================================
    # Get service tickets by pillar
    pillar_usage = get_pillar_usage(pet_id, year, owner_email)
    
    # Get Doggy Bakery orders (if available)
    treat_count = get_treat_count(owner_id, year, owner_email) if owner_id else 0
    
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
        "soul_score": current_score,
        "archetype_name": archetype_name,
        "archetype_emoji": archetype_emoji,
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


def get_pillars_explored(pet_id: str, owner_email: str = None) -> dict:
    """Get pillars explored from Mira conversations and service tickets."""
    pillars = {}
    
    # From conversations - check pet_id
    convos = db.mira_conversations.find({"pet_id": pet_id})
    for convo in convos:
        pillar = convo.get("pillar_context") or convo.get("pillar")
        if pillar:
            pillars[pillar] = pillars.get(pillar, 0) + 1
    
    # From service tickets - check by pet_id
    tickets = db.service_desk_tickets.find({"pet_id": pet_id})
    for ticket in tickets:
        pillar = ticket.get("pillar")
        if pillar:
            pillars[pillar] = pillars.get(pillar, 0) + 1
    
    # Also check by owner email (most tickets use member.email)
    if owner_email:
        email_tickets = db.service_desk_tickets.find({"member.email": owner_email})
        for ticket in email_tickets:
            pillar = ticket.get("pillar")
            if pillar:
                pillars[pillar] = pillars.get(pillar, 0) + 1
        
        # Check mira_tickets too
        mira_tickets = db.mira_tickets.find({"member.email": owner_email})
        for ticket in mira_tickets:
            pillar = ticket.get("pillar")
            if pillar:
                pillars[pillar] = pillars.get(pillar, 0) + 1
        
        # Check tickets collection
        all_tickets = db.tickets.find({"member.email": owner_email})
        for ticket in all_tickets:
            pillar = ticket.get("pillar")
            if pillar:
                pillars[pillar] = pillars.get(pillar, 0) + 1
    
    return pillars


def get_pillar_usage(pet_id: str, year: int, owner_email: str = None) -> list:
    """Get pillar usage statistics for the year."""
    pillar_counts = {}
    
    # Query service tickets — use both datetime and ISO string comparison
    start_date = datetime(year, 1, 1, tzinfo=timezone.utc)
    end_date = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
    start_iso = start_date.isoformat()
    end_iso   = end_date.isoformat()
    
    # Match tickets for this year — handles both datetime and ISO string created_at
    date_filter = {"$or": [
        {"created_at": {"$gte": start_date, "$lte": end_date}},
        {"created_at": {"$gte": start_iso, "$lte": end_iso}},
    ]}
    
    # Check by pet_id
    tickets = db.service_desk_tickets.find({"pet_id": pet_id, **date_filter})
    
    pillar_icons = {
        # Core Learn categories (matching app)
        "grooming": "✂️", "groom": "✂️", "health": "❤️", "food": "🍖",
        "behaviour": "🧠", "behavior": "🧠", "travel": "✈️", "boarding": "🏠", "board": "🏠",
        # The 14 Pillars
        "soul": "💜", "celebrate": "🎉", "dine": "🍽️", "stay": "🏨",
        "care": "💊", "enjoy": "🎾", "fit": "🏃", "learn": "📚",
        "paperwork": "📋", "advisory": "👨‍⚕️", "emergency": "🚨",
        "farewell": "🌈", "adopt": "🐾", "shop": "🛒",
        "play": "🎾", "community": "🤝", "engagement": "💬"
    }
    
    for ticket in tickets:
        pillar = ticket.get("pillar", "").lower()
        if pillar:
            pillar_counts[pillar] = pillar_counts.get(pillar, 0) + 1
    
    # Also check by owner email (match by parent_id = email)
    if owner_email:
        email_tickets = db.service_desk_tickets.find({
            "$or": [{"member.email": owner_email}, {"parent_id": owner_email}],
            "$or": [
                {"created_at": {"$gte": start_date, "$lte": end_date}},
                {"created_at": {"$gte": start_iso, "$lte": end_iso}},
            ]
        })
        for ticket in email_tickets:
            pillar = ticket.get("pillar", "").lower()
            if pillar:
                pillar_counts[pillar] = pillar_counts.get(pillar, 0) + 1
        
        # Check pillar_requests
        pillar_reqs = db.pillar_requests.find({
            "user_email": owner_email,
            "created_at": {"$gte": start_date, "$lte": end_date}
        })
        for req in pillar_reqs:
            pillar = req.get("pillar", "").lower()
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


def get_treat_count(user_id: str, year: int, owner_email: str = None) -> int:
    """Get count of Doggy Bakery treats ordered."""
    try:
        start_date = datetime(year, 1, 1, tzinfo=timezone.utc)
        end_date = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        
        count = 0
        
        # Check by user_id
        orders = db.orders.find({
            "user_id": user_id,
            "created_at": {"$gte": start_date, "$lte": end_date}
        })
        
        for order in orders:
            items = order.get("items", [])
            count += len(items)
        
        # Also check by email
        if owner_email:
            email_orders = db.orders.find({
                "customer_email": owner_email,
                "created_at": {"$gte": start_date, "$lte": end_date}
            })
            for order in email_orders:
                items = order.get("items", [])
                count += len(items)
            
            # Check membership_orders for treats
            membership_orders = db.membership_orders.find({
                "email": owner_email
            })
            count += membership_orders.count()
        
        return count
    except:
        return 0


def get_philosophy_quote(pet: dict) -> str:
    """Get the closing philosophy quote."""
    if pet.get("rainbow_bridge"):
        return "A dog is not in your life.\nYou are in theirs.\n\nThey knew that.\nThey lived it completely."
    else:
        return "A dog is not in your life.\nYou are in theirs.\n\nAnd this year, they were truly known."



# ============================================
# DOWNLOADABLE HTML GENERATION
# ============================================

from fastapi.responses import HTMLResponse

@router.get("/download/{pet_id}", response_class=HTMLResponse)
async def download_pet_wrapped(pet_id: str, year: Optional[int] = None):
    """
    Generate a downloadable HTML Pet Wrapped for any pet.
    Returns a beautiful, self-contained HTML file with all real data.
    """
    # Get the wrapped data first
    wrapped_data = await generate_pet_wrapped(pet_id, year)
    
    cards = wrapped_data.get("cards", {})
    cover = cards.get("cover", {})
    soul_score = cards.get("soul_score", {})
    mira_moments = cards.get("mira_moments", {})
    legacy = cards.get("legacy", {})
    pillars = cards.get("pillars", {})
    closing = cards.get("closing", {})
    
    pet_name = wrapped_data.get("pet_name", "Pet")
    year = wrapped_data.get("year", datetime.now().year)
    
    # Get AI memory if available
    try:
        memory_doc = db.pet_wrapped_memories.find_one({"pet_id": pet_id})
        ai_memory = memory_doc.get("memory", "") if memory_doc else ""
    except:
        ai_memory = ""
    
    if not ai_memory:
        ai_memory = f"Every moment with {pet_name} was a gift. The way they looked at you, the joy they brought to ordinary days."
    
    # Build pillar rows HTML
    pillar_rows = ""
    # Pillar icons matching the app's Learn section design
    # Categories: Grooming, Health, Food, Behaviour, Travel, Boarding + other pillars
    pillar_icons = {
        # Core Learn categories (matching your app)
        "grooming": ("✂️", "#A87ADB", "rgba(75,38,128,0.2)"),
        "groom": ("✂️", "#A87ADB", "rgba(75,38,128,0.2)"),
        "health": ("❤️", "#E8A0B0", "rgba(196,96,122,0.15)"),
        "food": ("🍖", "#6BCB8B", "rgba(45,122,74,0.15)"),
        "behaviour": ("🧠", "#87CEEB", "rgba(135,206,235,0.15)"),
        "behavior": ("🧠", "#87CEEB", "rgba(135,206,235,0.15)"),
        "travel": ("✈️", "#FFB6C1", "rgba(255,182,193,0.15)"),
        "boarding": ("🏠", "#F0C060", "rgba(201,151,58,0.15)"),
        "board": ("🏠", "#F0C060", "rgba(201,151,58,0.15)"),
        
        # The 14 Pillars
        "soul": ("💜", "#A87ADB", "rgba(75,38,128,0.2)"),
        "celebrate": ("🎉", "#F0C060", "rgba(201,151,58,0.15)"),
        "dine": ("🍽️", "#6BCB8B", "rgba(45,122,74,0.15)"),
        "care": ("💊", "#E8A0B0", "rgba(196,96,122,0.15)"),
        "stay": ("🏨", "#87CEEB", "rgba(135,206,235,0.15)"),
        "advisory": ("👨‍⚕️", "#A87ADB", "rgba(75,38,128,0.2)"),
        "learn": ("📚", "#FFB6C1", "rgba(255,182,193,0.15)"),
        "enjoy": ("🎾", "#6BCB8B", "rgba(45,122,74,0.15)"),
        "shop": ("🛒", "#F0C060", "rgba(201,151,58,0.15)"),
        "play": ("🎾", "#87CEEB", "rgba(135,206,235,0.15)"),
        "community": ("🤝", "#E8A0B0", "rgba(196,96,122,0.15)"),
        "farewell": ("🌈", "#C4607A", "rgba(196,96,122,0.2)"),
        "paperwork": ("📋", "#8892A4", "rgba(136,146,164,0.15)"),
        "fit": ("🏃", "#6BCB8B", "rgba(45,122,74,0.15)"),
        "emergency": ("🚨", "#FF6B6B", "rgba(255,107,107,0.15)"),
        "adopt": ("🐾", "#A87ADB", "rgba(75,38,128,0.15)"),
        
        # Additional tracking
        "engagement": ("💬", "#87CEEB", "rgba(135,206,235,0.15)"),
    }
    
    pillars_explored = mira_moments.get("pillars_explored", {})
    sorted_pillars = sorted(pillars_explored.items(), key=lambda x: x[1], reverse=True)[:5]
    max_count = sorted_pillars[0][1] if sorted_pillars else 1
    
    for pillar, count in sorted_pillars:
        icon, color, bg = pillar_icons.get(pillar.lower(), ("📌", "#C0C8D8", "rgba(136,146,164,0.15)"))
        width = int((count / max_count) * 100)
        pillar_rows += f'''
        <div class="pillar-row">
          <div class="pillar-icon" style="background:{bg};">{icon}</div>
          <div class="pillar-name">{pillar.capitalize()}</div>
          <div class="pillar-bar-wrap"><div class="pillar-bar" style="width:{width}%; background:linear-gradient(90deg,{color}80,{color});"></div></div>
          <div class="pillar-val" style="color:{color};">{count}</div>
        </div>'''
    
    # Build family HTML
    family_html = ""
    babies = legacy.get("babies", [])
    if babies:
        for baby in babies[:5]:
            family_html += f'<span class="m-name">{baby.get("name", "")}</span>'
    
    pet_friends = legacy.get("pet_friends", [])
    friends_html = ""
    if pet_friends:
        for i, friend in enumerate(pet_friends[:2]):
            role = "Best friend" if i == 0 else "Playmate"
            friends_html += f'''
            <div class="parent">
              <div class="parent-name">{friend}</div>
              <div class="parent-role">{role}</div>
            </div>'''
    
    # Rainbow bridge indicator
    rainbow_bridge = cover.get("rainbow_bridge", False)
    memorial_text = "In loving memory 🌈" if rainbow_bridge else f"Pet Wrapped {year}"
    breed_suffix = " · In Loving Memory" if rainbow_bridge else ""
    
    # Soul journey HTML
    journey = soul_score.get("journey", [])
    journey_html = ""
    for i, step in enumerate(journey):
        active = "active" if i == len(journey) - 1 else ""
        journey_html += f'''
        <div class="j-step">
          <div class="j-num {active}">{int(step.get("score", 0))}</div>
          <div class="j-label">{step.get("label", "")}</div>
        </div>'''
        if i < len(journey) - 1:
            journey_html += '<div class="j-arrow">→</div>'
    
    # All pillars list
    all_pillars = list(pillars_explored.keys())[:12]
    pillars_list_text = " · ".join([p.capitalize() for p in all_pillars])
    
    total_interactions = sum(pillars_explored.values())
    
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pet Wrapped · {pet_name} · {year}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  :root {{
    --deep: #120826; --purple: #4B2680; --violet: #7B4DB5;
    --gold: #C9973A; --goldL: #F0C060; --rose: #C4607A;
    --roseL: #E8A0B0; --cream: #FAF7F2; --mist: #8892A4; --white: #FFFFFF;
  }}
  body {{
    background: #0a0618; font-family: 'DM Sans', sans-serif;
    display: flex; flex-direction: column; align-items: center;
    padding: 40px 20px 80px; gap: 0;
  }}
  .site-header {{ text-align: center; margin-bottom: 60px; animation: fadeUp 1s ease both; }}
  .site-header .brand {{ font-family: 'Cormorant Garamond', serif; font-size: 13px; letter-spacing: 5px; color: var(--gold); text-transform: uppercase; margin-bottom: 12px; }}
  .site-header h1 {{ font-family: 'Cormorant Garamond', serif; font-size: clamp(32px, 6vw, 52px); font-weight: 300; color: var(--white); letter-spacing: 2px; }}
  .site-header h1 em {{ font-style: italic; color: var(--goldL); }}
  .site-header .sub {{ font-size: 13px; color: var(--mist); margin-top: 10px; letter-spacing: 1px; }}
  .cards-row {{ display: flex; flex-wrap: wrap; justify-content: center; gap: 32px; max-width: 1400px; width: 100%; }}
  .card {{ width: 390px; height: 844px; border-radius: 32px; position: relative; overflow: hidden; flex-shrink: 0; box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06); animation: fadeUp 0.8s ease both; }}
  .card:nth-child(2) {{ animation-delay: 0.15s; }} .card:nth-child(3) {{ animation-delay: 0.3s; }}
  .card:nth-child(4) {{ animation-delay: 0.45s; }} .card:nth-child(5) {{ animation-delay: 0.6s; }} .card:nth-child(6) {{ animation-delay: 0.75s; }}
  .card-cover {{ background: var(--deep); }}
  .card-cover .bg-orb {{ position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; }}
  .card-cover .orb1 {{ width: 360px; height: 360px; background: #4B2680; top: -80px; left: -80px; }}
  .card-cover .orb2 {{ width: 300px; height: 300px; background: #C4607A; bottom: 60px; right: -60px; opacity: 0.35; }}
  .card-cover .content {{ position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; padding: 48px 36px 40px; }}
  .card-cover .tag {{ font-size: 10px; letter-spacing: 4px; color: var(--gold); text-transform: uppercase; font-weight: 500; }}
  .card-cover .year {{ font-family: 'Cormorant Garamond', serif; font-size: 120px; font-weight: 300; line-height: 1; color: rgba(255,255,255,0.06); margin-top: -8px; letter-spacing: -4px; }}
  .card-cover .name-block {{ margin-top: auto; }}
  .card-cover .paw {{ font-size: 28px; margin-bottom: 12px; }}
  .card-cover .pet-name {{ font-family: 'Cormorant Garamond', serif; font-size: 64px; font-weight: 400; line-height: 1; color: var(--white); letter-spacing: 1px; }}
  .card-cover .pet-name em {{ font-style: italic; color: var(--goldL); }}
  .card-cover .pet-breed {{ font-size: 13px; color: var(--roseL); letter-spacing: 2px; text-transform: uppercase; margin-top: 8px; }}
  .card-cover .divider {{ width: 48px; height: 1px; background: var(--gold); margin: 24px 0; }}
  .card-cover .cover-line {{ font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; font-weight: 300; color: rgba(255,255,255,0.7); line-height: 1.5; }}
  .card-cover .bottom-brand {{ margin-top: 32px; font-size: 10px; letter-spacing: 3px; color: var(--mist); text-transform: uppercase; }}
  .card-soul {{ background: linear-gradient(160deg, #1a0a2e 0%, #2d1250 50%, #1a0a2e 100%); }}
  .card-soul .gold-bar {{ position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }}
  .card-soul .content {{ position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; padding: 48px 36px 40px; }}
  .card-soul .section-label {{ font-size: 10px; letter-spacing: 4px; color: var(--violet); text-transform: uppercase; font-weight: 500; }}
  .card-soul .section-title {{ font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 400; color: var(--white); line-height: 1.1; margin-top: 8px; }}
  .card-soul .section-title em {{ font-style: italic; color: var(--goldL); }}
  .card-soul .score-arc {{ margin: 36px auto 0; position: relative; width: 260px; height: 260px; }}
  .card-soul .score-center {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }}
  .card-soul .score-num {{ font-family: 'Cormorant Garamond', serif; font-size: 72px; font-weight: 300; color: var(--white); line-height: 1; }}
  .card-soul .score-label {{ font-size: 11px; letter-spacing: 2px; color: var(--gold); text-transform: uppercase; margin-top: 4px; }}
  .card-soul .journey {{ margin-top: 32px; display: flex; align-items: center; gap: 12px; justify-content: center; }}
  .card-soul .j-step {{ text-align: center; }}
  .card-soul .j-num {{ font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 400; color: var(--mist); }}
  .card-soul .j-num.active {{ color: var(--goldL); }}
  .card-soul .j-label {{ font-size: 10px; color: var(--mist); margin-top: 2px; }}
  .card-soul .j-arrow {{ color: var(--gold); font-size: 20px; }}
  .card-soul .soul-quote {{ margin-top: auto; font-family: 'Cormorant Garamond', serif; font-size: 17px; font-style: italic; font-weight: 300; color: rgba(255,255,255,0.65); line-height: 1.6; border-left: 2px solid var(--gold); padding-left: 16px; }}
  .card-soul .bottom-brand {{ margin-top: 20px; font-size: 10px; letter-spacing: 3px; color: var(--mist); text-transform: uppercase; }}
  .card-mira {{ background: #0d0520; }}
  .card-mira .rose-glow {{ position: absolute; bottom: -100px; left: 50%; transform: translateX(-50%); width: 400px; height: 400px; background: radial-gradient(circle, rgba(196,96,122,0.25) 0%, transparent 70%); border-radius: 50%; }}
  .card-mira .content {{ position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; padding: 48px 36px 40px; }}
  .card-mira .section-label {{ font-size: 10px; letter-spacing: 4px; color: var(--rose); text-transform: uppercase; font-weight: 500; }}
  .card-mira .section-title {{ font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 400; color: var(--white); line-height: 1.1; margin-top: 8px; }}
  .card-mira .mira-stats {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 36px; }}
  .card-mira .stat-box {{ background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px 16px; }}
  .card-mira .stat-box.full {{ grid-column: 1 / -1; }}
  .card-mira .stat-num {{ font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 300; color: var(--roseL); line-height: 1; }}
  .card-mira .stat-unit {{ font-size: 14px; color: var(--mist); margin-top: 2px; }}
  .card-mira .stat-detail {{ font-size: 11px; color: var(--mist); margin-top: 8px; line-height: 1.4; }}
  .card-mira .memory-card {{ margin-top: 24px; background: linear-gradient(135deg, rgba(196,96,122,0.15), rgba(75,38,128,0.15)); border: 1px solid rgba(196,96,122,0.25); border-radius: 20px; padding: 24px; }}
  .card-mira .memory-label {{ font-size: 9px; letter-spacing: 3px; color: var(--rose); text-transform: uppercase; margin-bottom: 10px; }}
  .card-mira .memory-text {{ font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; font-weight: 300; color: var(--white); line-height: 1.6; }}
  .card-mira .bottom-brand {{ margin-top: auto; padding-top: 24px; font-size: 10px; letter-spacing: 3px; color: var(--mist); text-transform: uppercase; }}
  .card-babies {{ background: linear-gradient(180deg, #0f1a0f 0%, #0a1208 100%); }}
  .card-babies .green-glow {{ position: absolute; top: -50px; right: -50px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(45,122,74,0.3) 0%, transparent 70%); }}
  .card-babies .content {{ position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; padding: 48px 36px 40px; }}
  .card-babies .section-label {{ font-size: 10px; letter-spacing: 4px; color: #6BCB8B; text-transform: uppercase; font-weight: 500; }}
  .card-babies .section-title {{ font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 400; color: var(--white); line-height: 1.1; margin-top: 8px; }}
  .card-babies .section-title em {{ font-style: italic; color: #A8E6BE; }}
  .card-babies .m-squad {{ margin-top: 32px; display: flex; flex-wrap: wrap; gap: 10px; }}
  .card-babies .m-name {{ font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; font-style: italic; color: var(--white); background: rgba(255,255,255,0.05); border: 1px solid rgba(107,203,139,0.2); border-radius: 100px; padding: 6px 18px; }}
  .card-babies .parents-block {{ margin-top: 32px; background: rgba(255,255,255,0.03); border: 1px solid rgba(107,203,139,0.15); border-radius: 20px; padding: 24px; }}
  .card-babies .parents-label {{ font-size: 9px; letter-spacing: 3px; color: #6BCB8B; text-transform: uppercase; margin-bottom: 16px; }}
  .card-babies .parents-row {{ display: flex; gap: 24px; }}
  .card-babies .parent {{ flex: 1; }}
  .card-babies .parent-name {{ font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 400; color: var(--white); }}
  .card-babies .parent-role {{ font-size: 11px; color: var(--mist); margin-top: 2px; }}
  .card-babies .legacy-line {{ margin-top: auto; font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; font-weight: 300; color: rgba(255,255,255,0.5); line-height: 1.6; border-left: 2px solid #6BCB8B; padding-left: 16px; }}
  .card-babies .bottom-brand {{ margin-top: 20px; font-size: 10px; letter-spacing: 3px; color: var(--mist); text-transform: uppercase; }}
  .card-pillars {{ background: #0c0818; }}
  .card-pillars .content {{ position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; padding: 48px 36px 40px; }}
  .card-pillars .section-label {{ font-size: 10px; letter-spacing: 4px; color: var(--gold); text-transform: uppercase; font-weight: 500; }}
  .card-pillars .section-title {{ font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 400; color: var(--white); line-height: 1.1; margin-top: 8px; }}
  .card-pillars .pillar-list {{ margin-top: 32px; display: flex; flex-direction: column; gap: 12px; }}
  .card-pillars .pillar-row {{ display: flex; align-items: center; gap: 14px; }}
  .card-pillars .pillar-icon {{ width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }}
  .card-pillars .pillar-name {{ flex: 1; font-size: 14px; color: var(--white); font-weight: 400; }}
  .card-pillars .pillar-bar-wrap {{ flex: 2; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }}
  .card-pillars .pillar-bar {{ height: 100%; border-radius: 3px; }}
  .card-pillars .pillar-val {{ font-size: 12px; color: var(--mist); width: 32px; text-align: right; }}
  .card-pillars .total-treats {{ margin-top: 28px; background: linear-gradient(135deg, rgba(201,151,58,0.12), rgba(75,38,128,0.1)); border: 1px solid rgba(201,151,58,0.2); border-radius: 20px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; }}
  .card-pillars .treat-num {{ font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 300; color: var(--goldL); line-height: 1; }}
  .card-pillars .treat-text {{ font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.5; }}
  .card-pillars .treat-text strong {{ color: var(--goldL); display: block; font-weight: 500; }}
  .card-pillars .bottom-brand {{ margin-top: auto; padding-top: 20px; font-size: 10px; letter-spacing: 3px; color: var(--mist); text-transform: uppercase; }}
  .card-closing {{ background: var(--deep); overflow: hidden; }}
  .card-closing .bg {{ position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 60%, rgba(196,96,122,0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(75,38,128,0.3) 0%, transparent 60%); }}
  .card-closing .large-text {{ position: absolute; font-family: 'Cormorant Garamond', serif; font-size: 200px; font-weight: 300; font-style: italic; color: rgba(255,255,255,0.025); line-height: 1; letter-spacing: -8px; bottom: -20px; left: -10px; white-space: nowrap; }}
  .card-closing .content {{ position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; padding: 48px 36px 40px; justify-content: space-between; }}
  .card-closing .top-tag {{ font-size: 10px; letter-spacing: 4px; color: var(--gold); text-transform: uppercase; font-weight: 500; }}
  .card-closing .main-quote {{ font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300; font-style: italic; color: var(--white); line-height: 1.35; }}
  .card-closing .main-quote em {{ color: var(--goldL); font-style: italic; }}
  .card-closing .attribution {{ font-size: 12px; color: var(--rose); letter-spacing: 1px; margin-top: 16px; }}
  .card-closing .share-block {{ background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; }}
  .card-closing .share-label {{ font-size: 10px; letter-spacing: 3px; color: var(--gold); text-transform: uppercase; margin-bottom: 12px; }}
  .card-closing .share-btn {{ display: inline-flex; align-items: center; gap: 8px; background: var(--gold); color: var(--deep); font-size: 13px; font-weight: 500; letter-spacing: 0.5px; padding: 12px 24px; border-radius: 100px; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; margin-right: 8px; margin-bottom: 8px; }}
  .card-closing .share-btn:hover {{ background: var(--goldL); }}
  .card-closing .cta-text {{ font-size: 12px; color: var(--mist); margin-top: 12px; line-height: 1.5; }}
  .card-closing .cta-text a {{ color: var(--roseL); text-decoration: none; border-bottom: 1px solid rgba(232,160,176,0.3); }}
  .card-closing .bottom-brand {{ font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,0.25); text-transform: uppercase; text-align: center; }}
  .site-footer {{ margin-top: 72px; text-align: center; animation: fadeUp 1s ease 0.8s both; }}
  .site-footer p {{ font-family: 'Cormorant Garamond', serif; font-size: 16px; font-style: italic; color: rgba(255,255,255,0.35); line-height: 1.6; }}
  .site-footer .footer-brand {{ font-size: 10px; letter-spacing: 3px; color: var(--mist); text-transform: uppercase; margin-top: 16px; }}
  @keyframes fadeUp {{ from {{ opacity: 0; transform: translateY(24px); }} to {{ opacity: 1; transform: translateY(0); }} }}
</style>
</head>
<body>

<header class="site-header">
  <div class="brand">The Doggy Company · Pet Wrapped</div>
  <h1><em>{pet_name}'s</em> Year</h1>
  <p class="sub">{memorial_text}</p>
</header>

<div class="cards-row">

  <!-- CARD 1: COVER -->
  <div class="card card-cover">
    <div class="bg-orb orb1"></div>
    <div class="bg-orb orb2"></div>
    <div class="content">
      <div class="tag">Pet Wrapped · {year}</div>
      <div class="year">{year}</div>
      <div class="name-block">
        <div class="paw">🐾</div>
        <div class="pet-name"><em>{pet_name}</em></div>
        <div class="pet-breed">{cover.get("breed", "Beloved Companion")}{breed_suffix}</div>
        <div class="divider"></div>
        <div class="cover-line">{cover.get("tagline", "A year of being truly known.")}</div>
      </div>
      <div class="bottom-brand">thedoggycompany.com</div>
    </div>
  </div>

  <!-- CARD 2: SOUL SCORE -->
  <div class="card card-soul">
    <div class="gold-bar"></div>
    <div class="content">
      <div class="section-label">Soul Journey</div>
      <div class="section-title">Their <em>Soul Score</em><br>this year</div>
      <div class="score-arc">
        <svg viewBox="0 0 260 260" fill="none">
          <circle cx="130" cy="130" r="100" stroke="rgba(255,255,255,0.06)" stroke-width="12" fill="none"/>
          <circle cx="130" cy="130" r="100" stroke="url(#goldGrad)" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="628" stroke-dashoffset="{int(628 * (1 - soul_score.get('current_score', 0) / 100))}" transform="rotate(-90 130 130)"/>
          <defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#C9973A"/><stop offset="100%" stop-color="#F0C060"/></linearGradient></defs>
        </svg>
        <div class="score-center">
          <div class="score-num">{int(soul_score.get("current_score", 0))}</div>
          <div class="score-label">Soul Score</div>
        </div>
      </div>
      <div class="journey">{journey_html}</div>
      <div class="soul-quote">{soul_score.get("soul_quote", "Every dog deserves to be truly known.")}</div>
      <div class="bottom-brand">thedoggycompany.com</div>
    </div>
  </div>

  <!-- CARD 3: MIRA MOMENTS -->
  <div class="card card-mira">
    <div class="rose-glow"></div>
    <div class="content">
      <div class="section-label">Mira Moments</div>
      <div class="section-title">What Mira<br><em>remembers</em></div>
      <div class="mira-stats">
        <div class="stat-box">
          <div class="stat-num">{mira_moments.get("conversation_count", 0)}</div>
          <div class="stat-unit">conversations</div>
          <div class="stat-detail">with Mira this year</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">{mira_moments.get("questions_answered", 0)}</div>
          <div class="stat-unit">questions</div>
          <div class="stat-detail">answered in Soul Profile</div>
        </div>
        <div class="stat-box full">
          <div class="stat-num">{len(pillars_explored)}</div>
          <div class="stat-unit">pillars explored</div>
          <div class="stat-detail">{pillars_list_text}</div>
        </div>
      </div>
      <div class="memory-card">
        <div class="memory-label">Mira's Favourite Memory</div>
        <div class="memory-text">"{ai_memory}"</div>
      </div>
      <div class="bottom-brand">thedoggycompany.com</div>
    </div>
  </div>

  <!-- CARD 4: FAMILY -->
  <div class="card card-babies">
    <div class="green-glow"></div>
    <div class="content">
      <div class="section-label">Their Family</div>
      <div class="section-title">The <em>Pack</em></div>
      <div class="m-squad">{family_html if family_html else '<span class="m-name">Family of One</span>'}</div>
      <div class="parents-block">
        <div class="parents-label">Best Friends</div>
        <div class="parents-row">{friends_html if friends_html else '<div class="parent"><div class="parent-name">Everyone!</div><div class="parent-role">Friend to all</div></div>'}</div>
      </div>
      <div class="legacy-line">Every dog they met became family. Every human they loved became theirs forever.</div>
      <div class="bottom-brand">thedoggycompany.com</div>
    </div>
  </div>

  <!-- CARD 5: PILLARS -->
  <div class="card card-pillars">
    <div class="content">
      <div class="section-label">Life Pillars</div>
      <div class="section-title">A life<br><em>fully lived</em></div>
      <div class="pillar-list">{pillar_rows}</div>
      <div class="total-treats">
        <div class="treat-num">{total_interactions}</div>
        <div class="treat-text"><strong>Total pillar interactions</strong>{pet_name} explored {len(pillars_explored)} pillars this year</div>
      </div>
      <div class="bottom-brand">thedoggycompany.com</div>
    </div>
  </div>

  <!-- CARD 6: CLOSING -->
  <div class="card card-closing">
    <div class="bg"></div>
    <div class="large-text">love</div>
    <div class="content">
      <div class="top-tag">Pet Wrapped · {year}</div>
      <div>
        <div class="main-quote">{closing.get("philosophy_quote", "A dog is not in your life. You are in theirs.")}</div>
        <div class="attribution">— {closing.get("parent_name", "Pet Parent")} · The Doggy Company</div>
      </div>
      <div class="share-block">
        <div class="share-label">Save & Share</div>
        <button class="share-btn" onclick="downloadWrapped()">📥 Download</button>
        <button class="share-btn" onclick="shareWrapped()" style="background:#C4607A;">📤 Share</button>
        <div class="cta-text">Every dog deserves to be truly known.<br><a href="https://thedoggycompany.com">thedoggycompany.com</a></div>
      </div>
      <div class="bottom-brand">The Doggy Company · Pet Wrapped · {year}</div>
    </div>
  </div>

</div>

<footer class="site-footer">
  <p>"Every dog deserves to be truly known.<br>{pet_name} was."</p>
  <div class="footer-brand">The Doggy Company · thedoggycompany.com</div>
</footer>

<script>
function downloadWrapped() {{
  const html = document.documentElement.outerHTML;
  const blob = new Blob([html], {{ type: 'text/html' }});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'PetWrapped_{pet_name}_{year}.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}}
function shareWrapped() {{
  const text = encodeURIComponent("💜 {pet_name}'s Pet Wrapped {year}\\n\\n{int(soul_score.get('current_score', 0))} Soul Score\\n\\nDoes your dog have a Soul Profile yet? 🐾\\n\\n");
  const url = encodeURIComponent(window.location.href);
  window.open('https://wa.me/?text=' + text + url, '_blank');
}}
</script>

</body>
</html>'''
    
    return HTMLResponse(content=html)
