"""
Pet Wrapped - Share Card Generation
The single beautiful card that goes viral.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from datetime import datetime, timezone
from bson import ObjectId
import os

router = APIRouter(prefix="/api/wrapped", tags=["Pet Wrapped"])

# MongoDB connection
from pymongo import MongoClient
client = MongoClient(os.environ.get("MONGO_URL"))
db = client[os.environ.get("DB_NAME", "doggy_company")]


@router.get("/share/{pet_id}", response_class=HTMLResponse)
async def get_share_card(pet_id: str):
    """
    Generate the SINGLE shareable card for Instagram/WhatsApp.
    This is the acquisition engine.
    
    Contains:
    - Pet name
    - Soul Score
    - One line from Mira's memory
    - CTA: "Does your dog have a Soul Profile yet?"
    """
    # Get pet data
    try:
        pet = db.pets.find_one({"_id": ObjectId(pet_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid pet ID")
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "A Beloved Pet")
    breed = pet.get("breed", "Beloved Companion")
    soul_score = pet.get("soul_score", 0)
    rainbow_bridge = pet.get("rainbow_bridge", False)
    
    # Get Mira's memory
    memory_doc = db.pet_wrapped_memories.find_one({"pet_id": pet_id})
    memory_line = ""
    if memory_doc:
        full_memory = memory_doc.get("memory", "")
        # Take first sentence for the share card
        memory_line = full_memory.split(".")[0] + "." if full_memory else ""
    
    if not memory_line:
        memory_line = f"Every moment with {pet_name} was a memory worth keeping."
    
    # Truncate memory for card
    if len(memory_line) > 100:
        memory_line = memory_line[:97] + "..."
    
    year = datetime.now().year
    
    # Generate the share card HTML (vertical story format: 1080x1920 for Instagram)
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="og:title" content="{pet_name}'s Pet Wrapped {year}">
    <meta property="og:description" content="{memory_line}">
    <meta property="og:image" content="https://thedoggycompany.com/api/wrapped/share-image/{pet_id}">
    <title>{pet_name}'s Pet Wrapped</title>
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
        
        .share-card {{
            width: 390px;
            height: 844px;
            background: #120826;
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
        .orb1 {{ width: 360px; height: 360px; background: #4B2680; top: -80px; left: -80px; opacity: 0.5; }}
        .orb2 {{ width: 300px; height: 300px; background: #C4607A; bottom: 100px; right: -60px; opacity: 0.35; }}
        .orb3 {{ width: 200px; height: 200px; background: #C9973A; top: 300px; left: 80px; opacity: 0.25; }}
        
        .content {{
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
            padding: 48px 36px 40px;
        }}
        
        .tag {{
            font-size: 10px;
            letter-spacing: 4px;
            color: #C9973A;
            text-transform: uppercase;
            font-weight: 500;
        }}
        
        .year {{
            font-family: 'Cormorant Garamond', serif;
            font-size: 100px;
            font-weight: 300;
            line-height: 1;
            color: rgba(255,255,255,0.04);
            margin-top: -8px;
            letter-spacing: -4px;
        }}
        
        .main-content {{
            margin-top: auto;
            margin-bottom: auto;
        }}
        
        .paw {{
            font-size: 32px;
            margin-bottom: 16px;
        }}
        
        .pet-name {{
            font-family: 'Cormorant Garamond', serif;
            font-size: 56px;
            font-weight: 400;
            line-height: 1;
            color: white;
        }}
        .pet-name em {{
            font-style: italic;
            color: #F0C060;
        }}
        
        .breed {{
            font-size: 12px;
            color: #E8A0B0;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 8px;
        }}
        
        .score-block {{
            margin-top: 32px;
            display: flex;
            align-items: baseline;
            gap: 12px;
        }}
        
        .score-num {{
            font-family: 'Cormorant Garamond', serif;
            font-size: 72px;
            font-weight: 300;
            color: #F0C060;
            line-height: 1;
        }}
        
        .score-label {{
            font-size: 14px;
            color: #8892A4;
            letter-spacing: 1px;
        }}
        
        .memory {{
            margin-top: 32px;
            font-family: 'Cormorant Garamond', serif;
            font-size: 18px;
            font-style: italic;
            font-weight: 300;
            color: rgba(255,255,255,0.7);
            line-height: 1.5;
            border-left: 2px solid #C9973A;
            padding-left: 16px;
        }}
        
        .cta-block {{
            margin-top: auto;
            text-align: center;
        }}
        
        .cta-text {{
            font-size: 14px;
            color: rgba(255,255,255,0.5);
            margin-bottom: 12px;
        }}
        
        .cta-button {{
            display: inline-block;
            background: #C9973A;
            color: #120826;
            font-size: 13px;
            font-weight: 500;
            padding: 14px 28px;
            border-radius: 100px;
            text-decoration: none;
            letter-spacing: 0.5px;
        }}
        
        .brand {{
            margin-top: 24px;
            font-size: 9px;
            letter-spacing: 3px;
            color: rgba(255,255,255,0.3);
            text-transform: uppercase;
            text-align: center;
        }}
        
        .rainbow {{ color: #E8A0B0; font-style: italic; }}
    </style>
</head>
<body>
    <div class="share-card">
        <div class="orb orb1"></div>
        <div class="orb orb2"></div>
        <div class="orb orb3"></div>
        
        <div class="content">
            <div class="tag">Pet Wrapped · {year}</div>
            <div class="year">{year}</div>
            
            <div class="main-content">
                <div class="paw">🐾</div>
                <div class="pet-name"><em>{pet_name}</em></div>
                <div class="breed">{breed}{' · In Loving Memory' if rainbow_bridge else ''}</div>
                
                <div class="score-block">
                    <div class="score-num">{soul_score}</div>
                    <div class="score-label">Soul Score</div>
                </div>
                
                <div class="memory">"{memory_line}"</div>
            </div>
            
            <div class="cta-block">
                <div class="cta-text">Does your dog have a Soul Profile yet?</div>
                <a href="https://thedoggycompany.com/wrapped-welcome" class="cta-button">
                    🐾 Create theirs
                </a>
            </div>
            
            <div class="brand">thedoggycompany.com</div>
        </div>
    </div>
</body>
</html>
    """
    
    return HTMLResponse(content=html)


@router.get("/share-data/{pet_id}")
async def get_share_data(pet_id: str):
    """
    Get the data needed to generate a share card.
    Used by frontend to render the share preview.
    """
    try:
        pet = db.pets.find_one({"_id": ObjectId(pet_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid pet ID")
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "A Beloved Pet")
    soul_score = pet.get("soul_score", 0)
    
    # Get Mira's memory
    memory_doc = db.pet_wrapped_memories.find_one({"pet_id": pet_id})
    memory_line = ""
    if memory_doc:
        full_memory = memory_doc.get("memory", "")
        memory_line = full_memory.split(".")[0] + "." if full_memory else ""
    
    return {
        "pet_id": pet_id,
        "pet_name": pet_name,
        "breed": pet.get("breed", "Beloved Companion"),
        "soul_score": soul_score,
        "memory_line": memory_line or f"Every moment with {pet_name} was worth remembering.",
        "rainbow_bridge": pet.get("rainbow_bridge", False),
        "year": datetime.now().year,
        "share_url": f"https://thedoggycompany.com/wrapped/{pet_id}",
        "cta": "Does your dog have a Soul Profile yet?",
        "landing_url": "https://thedoggycompany.com/wrapped-welcome"
    }
