"""
Pet Wrapped - Instagram Stories Share

Provides shareable links and assets for Instagram Stories.
Since Instagram doesn't allow direct posting via API for personal accounts,
we provide optimized assets that users can easily share.
"""

import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from pymongo import MongoClient
from bson import ObjectId

# MongoDB connection
client = MongoClient(os.environ.get("MONGO_URL"))
db_name = os.environ.get("DB_NAME") or "test_database"
db = client[db_name]

router = APIRouter(prefix="/wrapped", tags=["Instagram Stories"])


@router.get("/instagram-story/{pet_id}", response_class=HTMLResponse)
async def get_instagram_story_card(pet_id: str):
    """
    Generate an Instagram Stories-optimized card (1080x1920).
    Returns HTML that can be screenshot or saved as image.
    """
    # Find pet
    pet = None
    if pet_id.startswith("pet-"):
        pet = db.pets.find_one({"id": pet_id})
    if not pet:
        try:
            pet = db.pets.find_one({"_id": ObjectId(pet_id)})
        except:
            pass
    if not pet:
        pet = db.pets.find_one({"_id": pet_id})
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "My Pet")
    breed = pet.get("breed", "Good Boy/Girl")
    soul_score = int(pet.get("overall_score", 0))
    photo = pet.get("photo", "")
    
    # Get some stats
    owner_email = pet.get("owner_email", "")
    mira_chats = db.conversation_memories.count_documents({"pet_id": pet_id})
    
    year = datetime.now().year
    
    # Generate Instagram Story HTML (1080x1920 optimized)
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920">
    <title>{pet_name}'s Pet Wrapped - Instagram Story</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            width: 1080px;
            height: 1920px;
            background: linear-gradient(180deg, #1a0533 0%, #0d021a 50%, #1a0533 100%);
            font-family: 'Poppins', sans-serif;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 80px 60px;
            position: relative;
            overflow: hidden;
        }}
        
        /* Decorative orbs */
        .orb {{
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            pointer-events: none;
        }}
        .orb-1 {{ width: 400px; height: 400px; background: #7c3aed; top: -100px; left: -100px; opacity: 0.3; }}
        .orb-2 {{ width: 500px; height: 500px; background: #ec4899; bottom: 200px; right: -150px; opacity: 0.25; }}
        .orb-3 {{ width: 300px; height: 300px; background: #f59e0b; bottom: -50px; left: 100px; opacity: 0.2; }}
        
        .content {{ position: relative; z-index: 1; text-align: center; width: 100%; }}
        
        .header {{ margin-bottom: 40px; }}
        .year {{ font-size: 72px; font-weight: 800; color: #f59e0b; letter-spacing: 8px; }}
        .subtitle {{ font-size: 32px; color: rgba(255,255,255,0.6); margin-top: 10px; letter-spacing: 4px; }}
        
        .pet-avatar {{
            width: 320px;
            height: 320px;
            border-radius: 50%;
            border: 8px solid #f59e0b;
            margin: 40px auto;
            overflow: hidden;
            background: linear-gradient(135deg, #7c3aed, #ec4899);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 20px 60px rgba(245, 158, 11, 0.3);
        }}
        .pet-avatar img {{ width: 100%; height: 100%; object-fit: cover; }}
        .pet-avatar .initials {{ font-size: 120px; font-weight: 800; color: white; }}
        
        .pet-name {{
            font-size: 72px;
            font-weight: 800;
            margin: 30px 0 10px;
            background: linear-gradient(90deg, #f59e0b, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .pet-breed {{ font-size: 28px; color: rgba(255,255,255,0.5); }}
        
        .soul-score {{
            margin: 60px 0;
            padding: 50px;
            background: rgba(255,255,255,0.05);
            border-radius: 40px;
            border: 2px solid rgba(245, 158, 11, 0.2);
        }}
        .score-label {{ font-size: 28px; color: #f59e0b; letter-spacing: 4px; margin-bottom: 20px; }}
        .score-value {{ font-size: 140px; font-weight: 800; color: white; line-height: 1; }}
        .score-percent {{ font-size: 60px; color: #f59e0b; }}
        
        .stats {{
            display: flex;
            justify-content: center;
            gap: 60px;
            margin: 40px 0;
        }}
        .stat {{ text-align: center; }}
        .stat-value {{ font-size: 48px; font-weight: 800; color: #ec4899; }}
        .stat-label {{ font-size: 22px; color: rgba(255,255,255,0.5); margin-top: 8px; }}
        
        .cta {{
            margin-top: 60px;
            padding: 30px 60px;
            background: linear-gradient(90deg, #ec4899, #7c3aed);
            border-radius: 100px;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: 2px;
        }}
        
        .footer {{
            position: absolute;
            bottom: 80px;
            left: 0;
            right: 0;
            text-align: center;
        }}
        .brand {{ font-size: 24px; color: rgba(255,255,255,0.4); letter-spacing: 3px; }}
        .brand span {{ color: #f59e0b; }}
    </style>
</head>
<body>
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    
    <div class="content">
        <div class="header">
            <div class="year">{year}</div>
            <div class="subtitle">PET WRAPPED</div>
        </div>
        
        <div class="pet-avatar">
            {'<img src="' + photo + '" alt="' + pet_name + '">' if photo else '<span class="initials">' + pet_name[0].upper() + '</span>'}
        </div>
        
        <div class="pet-name">{pet_name}</div>
        <div class="pet-breed">{breed}</div>
        
        <div class="soul-score">
            <div class="score-label">SOUL SCORE</div>
            <div class="score-value">{soul_score}<span class="score-percent">%</span></div>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">{mira_chats}</div>
                <div class="stat-label">Mira Chats</div>
            </div>
            <div class="stat">
                <div class="stat-value">{year - 2020}</div>
                <div class="stat-label">Years Together</div>
            </div>
        </div>
        
        <div class="cta">CREATE YOURS FREE →</div>
    </div>
    
    <div class="footer">
        <div class="brand"><span>THE DOGGY</span> COMPANY</div>
    </div>
</body>
</html>
"""
    
    return HTMLResponse(content=html)


@router.get("/share-assets/{pet_id}")
async def get_share_assets(pet_id: str):
    """
    Get all shareable assets for a pet's wrapped.
    Returns URLs for different formats and platforms.
    """
    # Find pet
    pet = None
    if pet_id.startswith("pet-"):
        pet = db.pets.find_one({"id": pet_id})
    if not pet:
        try:
            pet = db.pets.find_one({"_id": ObjectId(pet_id)})
        except:
            pass
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "My Pet")
    base_url = "https://thedoggycompany.com"
    
    share_text = f"Check out {pet_name}'s Pet Wrapped! 🐾✨ Create yours free at thedoggycompany.com"
    encoded_text = share_text.replace(" ", "%20").replace("!", "%21")
    
    return {
        "pet_id": pet_id,
        "pet_name": pet_name,
        "share_text": share_text,
        "assets": {
            "instagram_story": f"{base_url}/api/wrapped/instagram-story/{pet_id}",
            "download_html": f"{base_url}/api/wrapped/download/{pet_id}",
            "web_card": f"{base_url}/wrapped/{pet_id}"
        },
        "share_links": {
            "whatsapp": f"https://wa.me/?text={encoded_text}%20{base_url}/wrapped/{pet_id}",
            "twitter": f"https://twitter.com/intent/tweet?text={encoded_text}&url={base_url}/wrapped/{pet_id}",
            "facebook": f"https://www.facebook.com/sharer/sharer.php?u={base_url}/wrapped/{pet_id}",
            "copy_link": f"{base_url}/wrapped/{pet_id}"
        },
        "instructions": {
            "instagram_story": [
                "1. Open the Instagram Story link on your phone",
                "2. Take a screenshot",
                "3. Open Instagram → Create Story → Select screenshot",
                "4. Add stickers, text, or music",
                "5. Share to your Story!"
            ],
            "whatsapp_status": [
                "1. Open the Instagram Story link on your phone",
                "2. Take a screenshot", 
                "3. Open WhatsApp → Status → Add to Status",
                "4. Select the screenshot and share!"
            ]
        }
    }


@router.post("/log-share/{pet_id}")
async def log_share_action(pet_id: str, platform: str = "unknown"):
    """
    Log when a user shares their wrapped.
    Helps track viral coefficient.
    """
    db.wrapped_shares.insert_one({
        "pet_id": pet_id,
        "platform": platform,
        "shared_at": datetime.now(timezone.utc)
    })
    
    # Update share count on delivery
    db.wrapped_deliveries.update_one(
        {"pet_id": pet_id},
        {"$inc": {"share_count": 1}},
        sort=[("triggered_at", -1)]
    )
    
    return {"success": True, "message": "Share logged"}
