"""
Pet Wrapped - Welcome/First Soul Wrapped
Generated immediately after completing Soul Profile for the first time.
The instant shareable that creates viral acquisition.
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from bson import ObjectId
import os
import sys

# Add the parent directory to the path to import from main backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from pet_score_logic import calculate_pet_soul_score

router = APIRouter(prefix="/api/wrapped", tags=["Pet Wrapped"])

# MongoDB connection
from pymongo import MongoClient
client = MongoClient(os.environ.get("MONGO_URL"))
db = client[os.environ.get("DB_NAME", "doggy_company")]


@router.get("/welcome/{pet_id}")
async def generate_welcome_wrapped(pet_id: str):
    """
    Generate a Welcome Wrapped for a pet who just completed their Soul Profile.
    This is the INSTANT shareable - given right after Soul Profile completion.
    
    Contains:
    - Pet name & breed
    - Their first Soul Score
    - One insight from their Soul Profile
    - Shareable card for WhatsApp/Instagram
    """
    try:
        pet = db.pets.find_one({"_id": ObjectId(pet_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid pet ID")
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "Your Pet")
    breed = pet.get("breed", "Beloved Companion")
    
    # Calculate score using the same weighted scoring as dashboard
    stored_score = pet.get("overall_score", 0) or pet.get("soul_score", 0) or 0
    answers = pet.get("doggy_soul_answers") or {} or pet.get("soul_answers", {})
    
    if answers:
        score_data = calculate_pet_soul_score(answers)
        calculated_score = score_data["total_score"]
        soul_score = max(stored_score, calculated_score)
    else:
        soul_score = stored_score
    
    soul_data = pet.get("soul_data", {})
    
    # Get a highlight from their Soul Profile answers
    insight = get_soul_insight(soul_data, pet_name)
    
    # Get owner name
    owner_id = pet.get("owner_id") or pet.get("user_id")
    parent_name = "Pet Parent"
    if owner_id:
        try:
            user = db.users.find_one({"_id": ObjectId(owner_id)})
            if user:
                parent_name = user.get("name", user.get("first_name", "Pet Parent"))
        except:
            owner_email = pet.get("owner_email")
            if owner_email:
                user = db.users.find_one({"email": owner_email})
                if user:
                    parent_name = user.get("name", "Pet Parent")
    
    welcome_data = {
        "pet_id": pet_id,
        "pet_name": pet_name,
        "breed": breed,
        "soul_score": soul_score,
        "parent_name": parent_name,
        "insight": insight,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "type": "welcome",
        "message": get_welcome_message(soul_score, pet_name),
        "share_text": f"I just discovered {pet_name}'s Soul Score is {soul_score}%! 🐾 Create yours at thedoggycompany.com",
        "share_url": f"https://thedoggycompany.com/wrapped-welcome?ref={pet_id}"
    }
    
    # Store for reference
    db.pet_wrapped_welcome.update_one(
        {"pet_id": pet_id},
        {"$set": welcome_data},
        upsert=True
    )
    
    return welcome_data


def get_soul_insight(soul_data: dict, pet_name: str) -> str:
    """Extract the most shareable insight from Soul Profile answers."""
    
    # Priority order for best shareable insights
    insight_fields = [
        ("forgiveness", f"What {pet_name} has forgiven their parent for"),
        ("joy", f"What makes {pet_name}'s eyes light up"),
        ("bond", f"What {pet_name} has seen their parent through"),
        ("personality", f"{pet_name}'s true personality"),
        ("quirks", f"The quirk that makes {pet_name} unique"),
    ]
    
    for field, label in insight_fields:
        value = soul_data.get(field)
        if value and len(str(value)) > 10:
            return f'"{value[:150]}..."' if len(str(value)) > 150 else f'"{value}"'
    
    return f'"{pet_name} is now truly known. Their soul has been seen."'


def get_welcome_message(score: int, pet_name: str) -> str:
    """Generate a personalized welcome message based on Soul Score."""
    
    if score >= 80:
        return f"You know {pet_name} deeply. That's rare and beautiful."
    elif score >= 60:
        return f"You're building something special with {pet_name}. Keep going."
    elif score >= 40:
        return f"The journey of knowing {pet_name} has begun. There's so much more to discover."
    else:
        return f"Every great relationship starts somewhere. {pet_name}'s story is just beginning."


@router.get("/welcome-card/{pet_id}")
async def get_welcome_card_html(pet_id: str):
    """
    Generate the shareable Welcome card HTML.
    A single beautiful card optimized for Instagram/WhatsApp sharing.
    """
    from fastapi.responses import HTMLResponse
    
    try:
        pet = db.pets.find_one({"_id": ObjectId(pet_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid pet ID")
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "A Beloved Pet")
    breed = pet.get("breed", "Beloved Companion")
    
    # Calculate score using the same weighted scoring as dashboard
    stored_score = pet.get("overall_score", 0) or pet.get("soul_score", 0) or 0
    answers = pet.get("doggy_soul_answers") or {} or pet.get("soul_answers", {})
    
    if answers:
        score_data = calculate_pet_soul_score(answers)
        calculated_score = score_data["total_score"]
        soul_score = max(stored_score, calculated_score)
    else:
        soul_score = stored_score
    
    soul_data = pet.get("soul_data", {})
    
    insight = get_soul_insight(soul_data, pet_name)
    message = get_welcome_message(soul_score, pet_name)
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="og:title" content="{pet_name}'s Soul Profile">
    <meta property="og:description" content="Soul Score: {soul_score}% - {message}">
    <title>{pet_name}'s Soul Profile</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'DM Sans', sans-serif;
            background: #0a0618;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }}
        .card {{
            width: 390px;
            height: 680px;
            background: linear-gradient(160deg, #1a0a2e 0%, #120826 50%, #0d0520 100%);
            border-radius: 32px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 40px 80px rgba(0,0,0,0.6);
        }}
        .orb {{
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
        }}
        .orb1 {{ width: 300px; height: 300px; background: #4B2680; top: -80px; right: -80px; opacity: 0.4; }}
        .orb2 {{ width: 250px; height: 250px; background: #C9973A; bottom: -50px; left: -50px; opacity: 0.3; }}
        .content {{
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
            padding: 40px 32px;
        }}
        .badge {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 10px;
            letter-spacing: 3px;
            color: #C9973A;
            text-transform: uppercase;
            background: rgba(201,151,58,0.1);
            border: 1px solid rgba(201,151,58,0.2);
            padding: 8px 16px;
            border-radius: 100px;
            width: fit-content;
        }}
        .main {{
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
        }}
        .paw {{ font-size: 40px; margin-bottom: 16px; }}
        .pet-name {{
            font-family: 'Cormorant Garamond', serif;
            font-size: 48px;
            font-weight: 400;
            color: white;
            margin-bottom: 4px;
        }}
        .pet-name em {{ font-style: italic; color: #F0C060; }}
        .breed {{
            font-size: 12px;
            color: #E8A0B0;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 32px;
        }}
        .score-block {{
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(201,151,58,0.2);
            border-radius: 24px;
            padding: 24px;
            margin-bottom: 24px;
        }}
        .score-label {{
            font-size: 10px;
            letter-spacing: 3px;
            color: #7B4DB5;
            text-transform: uppercase;
            margin-bottom: 8px;
        }}
        .score-num {{
            font-family: 'Cormorant Garamond', serif;
            font-size: 64px;
            font-weight: 300;
            color: #F0C060;
            line-height: 1;
        }}
        .score-percent {{ font-size: 24px; color: #C9973A; }}
        .message {{
            font-family: 'Cormorant Garamond', serif;
            font-size: 18px;
            font-style: italic;
            color: rgba(255,255,255,0.7);
            line-height: 1.5;
            margin-top: 16px;
        }}
        .cta {{
            margin-top: auto;
            text-align: center;
        }}
        .cta-text {{
            font-size: 12px;
            color: rgba(255,255,255,0.5);
            margin-bottom: 12px;
        }}
        .cta-btn {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #C9973A;
            color: #120826;
            font-size: 13px;
            font-weight: 500;
            padding: 14px 28px;
            border-radius: 100px;
            text-decoration: none;
        }}
        .brand {{
            margin-top: 20px;
            font-size: 9px;
            letter-spacing: 3px;
            color: rgba(255,255,255,0.3);
            text-transform: uppercase;
        }}
    </style>
</head>
<body>
    <div class="card">
        <div class="orb orb1"></div>
        <div class="orb orb2"></div>
        <div class="content">
            <div class="badge">✨ Soul Profile Complete</div>
            
            <div class="main">
                <div class="paw">🐾</div>
                <div class="pet-name"><em>{pet_name}</em></div>
                <div class="breed">{breed}</div>
                
                <div class="score-block">
                    <div class="score-label">Soul Score</div>
                    <div class="score-num">{soul_score}<span class="score-percent">%</span></div>
                </div>
                
                <div class="message">{message}</div>
            </div>
            
            <div class="cta">
                <div class="cta-text">Does your dog have a Soul Profile yet?</div>
                <a href="https://thedoggycompany.com/wrapped-welcome" class="cta-btn">
                    🐾 Create theirs
                </a>
                <div class="brand">thedoggycompany.com</div>
            </div>
        </div>
    </div>
</body>
</html>
    """
    
    return HTMLResponse(content=html)
