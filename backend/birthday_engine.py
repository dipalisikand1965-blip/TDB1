"""
Pet Birthday & Celebration Engine for The Doggy Company
Detects upcoming pet birthdays/celebrations and suggests products
Works across all pillars
"""

import os
import logging
import random
import string
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
import resend

logger = logging.getLogger(__name__)

# Initialize Resend
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.in")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Security
security = HTTPBasic()
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != ADMIN_USERNAME or credentials.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return credentials.username

# Create router
birthday_router = APIRouter(prefix="/api/birthday-engine", tags=["Birthday Engine"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== MODELS ====================

class BirthdayPromotion(BaseModel):
    """Birthday promotion to send to a customer"""
    pet_id: str
    discount_percent: int = 15
    valid_days: int = 7
    include_products: bool = True
    custom_message: str = ""


# ==================== CELEBRATION TYPES ====================

CELEBRATION_TYPES = {
    "birthday": {
        "label": "Birthday",
        "emoji": "🎂",
        "message": "It's {pet_name}'s birthday on {date}!",
        "discount_message": "Here's {discount}% off to celebrate!"
    },
    "gotcha_day": {
        "label": "Gotcha Day",
        "emoji": "🏠",
        "message": "It's {pet_name}'s Gotcha Day anniversary on {date}!",
        "discount_message": "Celebrate {years} years of love with {discount}% off!"
    },
    "adoption_day": {
        "label": "Adoption Day",
        "emoji": "❤️",
        "message": "{pet_name}'s adoption anniversary is coming up on {date}!",
        "discount_message": "Here's {discount}% off to celebrate your special bond!"
    },
    "custom": {
        "label": "Special Day",
        "emoji": "🎉",
        "message": "{pet_name}'s special celebration is on {date}!",
        "discount_message": "Here's {discount}% off for the occasion!"
    }
}


# ==================== PRODUCT SUGGESTIONS ====================

# Product tags to suggest based on celebration type and pet type
CELEBRATION_PRODUCT_TAGS = {
    "birthday": {
        "dog": ["birthday-cake", "celebration", "treats", "party"],
        "cat": ["cat-birthday", "cat-treats", "celebration"],
        "default": ["birthday-cake", "celebration", "treats"]
    },
    "gotcha_day": {
        "dog": ["celebration", "special-treats", "gift-box"],
        "cat": ["cat-treats", "celebration"],
        "default": ["celebration", "treats", "gift-box"]
    },
    "default": {
        "dog": ["treats", "celebration"],
        "cat": ["cat-treats"],
        "default": ["treats", "celebration"]
    }
}


async def get_suggested_products(pet_type: str, celebration_type: str, limit: int = 6) -> List[Dict]:
    """Get product suggestions based on pet type and celebration"""
    pet_type_lower = (pet_type or "dog").lower()
    
    # Get relevant tags
    tags_map = CELEBRATION_PRODUCT_TAGS.get(celebration_type, CELEBRATION_PRODUCT_TAGS["default"])
    tags = tags_map.get(pet_type_lower, tags_map.get("default", ["treats"]))
    
    # Search products with these tags
    products = await db.products.find({
        "$or": [
            {"tags": {"$in": tags}},
            {"title": {"$regex": "birthday|cake|celebration", "$options": "i"}}
        ],
        "status": "active"
    }, {"_id": 0, "id": 1, "title": 1, "images": 1, "variants": 1, "tags": 1}).limit(limit).to_list(limit)
    
    # If no products found, get any active products
    if not products:
        products = await db.products.find(
            {"status": "active"},
            {"_id": 0, "id": 1, "title": 1, "images": 1, "variants": 1, "tags": 1}
        ).limit(limit).to_list(limit)
    
    return products


def generate_discount_code(prefix: str = "BDAY") -> str:
    """Generate a unique discount code"""
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{random_part}"


# ==================== CORE FUNCTIONS ====================

async def get_upcoming_celebrations(
    days_ahead: int = 30,
    city: Optional[str] = None,
    celebration_type: Optional[str] = None
) -> List[Dict]:
    """Get all upcoming pet celebrations within the specified days"""
    today = datetime.now(timezone.utc).date()
    end_date = today + timedelta(days=days_ahead)
    
    celebrations = []
    
    # Query pets with celebration dates
    query = {
        "$or": [
            {"birth_date": {"$exists": True, "$ne": None}},
            {"gotcha_date": {"$exists": True, "$ne": None}},
            {"celebrations": {"$exists": True, "$ne": []}}
        ]
    }
    
    if city:
        query["city"] = city
    
    pets = await db.pets.find(query).to_list(1000)
    
    for pet in pets:
        pet_id = str(pet.get("_id"))
        pet_name = pet.get("name", "Unknown")
        pet_type = pet.get("type", "dog")
        owner_name = pet.get("owner_name", "Pet Parent")
        owner_email = pet.get("owner_email")
        owner_phone = pet.get("owner_phone")
        pet_city = pet.get("city", "")
        
        # Get user info if available
        user_id = pet.get("user_id")
        if user_id and not owner_email:
            user = await db.users.find_one({"_id": user_id})
            if user:
                owner_email = user.get("email")
                owner_name = user.get("name", owner_name)
                owner_phone = owner_phone or user.get("phone")
        
        # Check birthday
        if pet.get("birth_date") and (not celebration_type or celebration_type == "birthday"):
            try:
                birth_date = datetime.strptime(pet["birth_date"], "%Y-%m-%d").date()
                this_year_bday = birth_date.replace(year=today.year)
                if this_year_bday < today:
                    this_year_bday = birth_date.replace(year=today.year + 1)
                
                days_until = (this_year_bday - today).days
                if 0 <= days_until <= days_ahead:
                    age = today.year - birth_date.year
                    if this_year_bday.year > today.year:
                        age = today.year - birth_date.year
                    
                    celebrations.append({
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "pet_type": pet_type,
                        "owner_name": owner_name,
                        "owner_email": owner_email,
                        "owner_phone": owner_phone,
                        "city": pet_city,
                        "celebration_type": "birthday",
                        "celebration_label": "Birthday",
                        "emoji": "🎂",
                        "date": this_year_bday.strftime("%Y-%m-%d"),
                        "display_date": this_year_bday.strftime("%B %d"),
                        "days_until": days_until,
                        "age": age,
                        "promotion_sent": False,  # Will be updated if we check
                        "birth_year": birth_date.year
                    })
            except Exception as e:
                logger.error(f"Error parsing birthday for {pet_name}: {e}")
        
        # Check gotcha day
        if pet.get("gotcha_date") and (not celebration_type or celebration_type == "gotcha_day"):
            try:
                gotcha_date = datetime.strptime(pet["gotcha_date"], "%Y-%m-%d").date()
                this_year_gotcha = gotcha_date.replace(year=today.year)
                if this_year_gotcha < today:
                    this_year_gotcha = gotcha_date.replace(year=today.year + 1)
                
                days_until = (this_year_gotcha - today).days
                if 0 <= days_until <= days_ahead:
                    years_together = today.year - gotcha_date.year
                    
                    celebrations.append({
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "pet_type": pet_type,
                        "owner_name": owner_name,
                        "owner_email": owner_email,
                        "owner_phone": owner_phone,
                        "city": pet_city,
                        "celebration_type": "gotcha_day",
                        "celebration_label": "Gotcha Day",
                        "emoji": "🏠",
                        "date": this_year_gotcha.strftime("%Y-%m-%d"),
                        "display_date": this_year_gotcha.strftime("%B %d"),
                        "days_until": days_until,
                        "years_together": years_together,
                        "promotion_sent": False
                    })
            except Exception as e:
                logger.error(f"Error parsing gotcha_date for {pet_name}: {e}")
        
        # Check custom celebrations
        for celebration in pet.get("celebrations", []):
            if celebration_type and celebration_type not in ["custom", celebration.get("occasion")]:
                continue
            try:
                date_str = celebration.get("date", "")
                occasion = celebration.get("occasion", "custom")
                custom_name = celebration.get("custom_name") or occasion.replace("_", " ").title()
                
                # Parse date
                if len(date_str) == 10:  # YYYY-MM-DD
                    cel_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                elif len(date_str) == 5:  # MM-DD
                    cel_date = datetime.strptime(f"{today.year}-{date_str}", "%Y-%m-%d").date()
                else:
                    continue
                
                # For recurring, adjust year
                if celebration.get("is_recurring", True):
                    this_year_cel = cel_date.replace(year=today.year)
                    if this_year_cel < today:
                        this_year_cel = cel_date.replace(year=today.year + 1)
                    cel_date = this_year_cel
                
                days_until = (cel_date - today).days
                if 0 <= days_until <= days_ahead:
                    celebrations.append({
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "pet_type": pet_type,
                        "owner_name": owner_name,
                        "owner_email": owner_email,
                        "owner_phone": owner_phone,
                        "city": pet_city,
                        "celebration_type": occasion,
                        "celebration_label": custom_name,
                        "emoji": "🎉",
                        "date": cel_date.strftime("%Y-%m-%d"),
                        "display_date": cel_date.strftime("%B %d"),
                        "days_until": days_until,
                        "promotion_sent": False
                    })
            except Exception as e:
                logger.error(f"Error parsing custom celebration for {pet_name}: {e}")
    
    # Sort by days_until
    celebrations.sort(key=lambda x: x["days_until"])
    
    # Check which have promotions sent
    for cel in celebrations:
        existing = await db.birthday_promotions.find_one({
            "pet_id": cel["pet_id"],
            "celebration_type": cel["celebration_type"],
            "celebration_date": cel["date"],
            "year": today.year
        })
        cel["promotion_sent"] = existing is not None
        if existing:
            cel["discount_code"] = existing.get("discount_code")
    
    return celebrations


async def send_birthday_promotion(
    pet_id: str,
    discount_percent: int = 15,
    valid_days: int = 7,
    custom_message: str = "",
    include_products: bool = True
) -> Dict[str, Any]:
    """Send a birthday promotion to a pet owner"""
    from bson import ObjectId
    
    # Get pet info
    pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
    if not pet:
        return {"success": False, "error": "Pet not found"}
    
    pet_name = pet.get("name", "Your Pet")
    pet_type = pet.get("type", "dog")
    owner_name = pet.get("owner_name", "Pet Parent")
    owner_email = pet.get("owner_email")
    owner_phone = pet.get("owner_phone")
    
    # Get user info if needed
    user_id = pet.get("user_id")
    if user_id and not owner_email:
        user = await db.users.find_one({"_id": user_id})
        if user:
            owner_email = user.get("email")
            owner_name = user.get("name", owner_name)
            owner_phone = owner_phone or user.get("phone")
    
    if not owner_email and not owner_phone:
        return {"success": False, "error": "No contact info available"}
    
    # Get upcoming celebration
    today = datetime.now(timezone.utc).date()
    celebrations = await get_upcoming_celebrations(days_ahead=30)
    pet_celebration = next((c for c in celebrations if c["pet_id"] == pet_id), None)
    
    celebration_type = pet_celebration.get("celebration_type", "birthday") if pet_celebration else "birthday"
    celebration_date = pet_celebration.get("display_date", "soon") if pet_celebration else "soon"
    age = pet_celebration.get("age", "") if pet_celebration else ""
    
    # Generate discount code
    prefix = "BDAY" if celebration_type == "birthday" else "GOTCHA" if celebration_type == "gotcha_day" else "CELE"
    discount_code = generate_discount_code(prefix)
    
    # Calculate expiry
    expiry_date = today + timedelta(days=valid_days)
    
    # Create discount in database
    discount_data = {
        "code": discount_code,
        "type": "percentage",
        "value": discount_percent,
        "description": f"Birthday discount for {pet_name}",
        "min_order_value": 0,
        "max_uses": 1,
        "used_count": 0,
        "valid_from": today.isoformat(),
        "valid_until": expiry_date.isoformat(),
        "active": True,
        "auto_generated": True,
        "pet_id": pet_id,
        "celebration_type": celebration_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.discounts.insert_one(discount_data)
    
    # Get suggested products
    suggested_products = []
    if include_products:
        suggested_products = await get_suggested_products(pet_type, celebration_type)
    
    result = {"success": True, "discount_code": discount_code, "whatsapp_link": None, "email_sent": False}
    
    # Prepare message
    celebration_info = CELEBRATION_TYPES.get(celebration_type, CELEBRATION_TYPES["custom"])
    
    # Build occasion box link
    occasion_type_param = "birthday" if celebration_type == "birthday" else "gotcha_day" if celebration_type == "gotcha_day" else "festival"
    box_builder_link = f"https://thedoggycompany.in/celebrate?build_box={occasion_type_param}"
    
    base_message = custom_message if custom_message else f"""
🎉 {celebration_info['emoji']} Special Celebration Alert!

Hi {owner_name}!

{pet_name}'s {celebration_info['label']} is coming up on {celebration_date}!{f" They're turning {age}!" if age else ""}

We want to make it extra special! Here's an exclusive {discount_percent}% off to celebrate:

🎁 Use code: {discount_code}
📅 Valid until: {expiry_date.strftime('%B %d, %Y')}

✨ Build a personalized {celebration_info['label']} Box for {pet_name}:
{box_builder_link}

Shop now and make {pet_name}'s day unforgettable! 🐾

With love,
The Doggy Company Team 🐕
"""
    
    # Send WhatsApp
    if owner_phone:
        phone = owner_phone.replace("+", "").replace(" ", "").replace("-", "")
        if not phone.startswith("91"):
            phone = f"91{phone}"
        encoded_message = __import__('urllib.parse', fromlist=['quote']).quote(base_message)
        result["whatsapp_link"] = f"https://wa.me/{phone}?text={encoded_message}"
    
    # Send email
    if owner_email and RESEND_API_KEY:
        try:
            products_html = ""
            if suggested_products:
                products_html = "<h3 style='margin-top: 20px;'>🛍️ Celebration Picks for " + pet_name + "</h3><div style='display: flex; gap: 10px; flex-wrap: wrap;'>"
                for product in suggested_products[:3]:
                    img = product.get("images", [{}])[0].get("src", "") if product.get("images") else ""
                    price = product.get("variants", [{}])[0].get("price", "") if product.get("variants") else ""
                    products_html += f"""
                    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; width: 150px; text-align: center;">
                        <img src="{img}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;" />
                        <p style="font-size: 12px; margin: 5px 0; font-weight: bold;">{product.get('title', '')[:30]}</p>
                        <p style="font-size: 14px; color: #9333ea; font-weight: bold;">₹{price}</p>
                    </div>
                    """
                products_html += "</div>"
            
            email_html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 32px;">{celebration_info['emoji']} Happy {celebration_info['label']}!</h1>
                    <p style="color: white; font-size: 18px; margin-top: 10px;">{pet_name}'s special day is coming up!</p>
                </div>
                <div style="padding: 30px; background: #fdf4ff;">
                    <p style="font-size: 16px;">Hi {owner_name}!</p>
                    <p style="font-size: 16px;">{pet_name}'s {celebration_info['label']} is on <strong>{celebration_date}</strong>!{f" They're turning <strong>{age}</strong>!" if age else ""}</p>
                    
                    <div style="background: white; border: 2px dashed #9333ea; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #666;">Your exclusive discount code:</p>
                        <p style="font-size: 28px; font-weight: bold; color: #9333ea; margin: 10px 0; letter-spacing: 2px;">{discount_code}</p>
                        <p style="margin: 0; font-size: 18px; color: #333;"><strong>{discount_percent}% OFF</strong></p>
                        <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Valid until {expiry_date.strftime('%B %d, %Y')}</p>
                    </div>
                    
                    <!-- Build Celebration Box CTA -->
                    <div style="background: linear-gradient(135deg, #fdf2f8, #fae8ff); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                        <p style="font-size: 16px; margin: 0 0 15px 0;">✨ Build a personalized {celebration_info['label']} Box!</p>
                        <a href="{box_builder_link}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #9333ea); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                            🎁 Build {pet_name}'s Box
                        </a>
                    </div>
                    
                    {products_html}
                    
                    <div style="text-align: center; margin-top: 25px;">
                        <a href="https://thedoggycompany.in" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                            Shop Now 🛍️
                        </a>
                    </div>
                </div>
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; background: #fdf4ff; border-radius: 0 0 12px 12px;">
                    <p>The Doggy Company - Pet Life Operating System</p>
                </div>
            </div>
            """
            
            resend.Emails.send({
                "from": f"The Doggy Company <{SENDER_EMAIL}>",
                "to": owner_email,
                "subject": f"🎉 {celebration_info['emoji']} {pet_name}'s {celebration_info['label']} - {discount_percent}% Off Inside!",
                "html": email_html
            })
            result["email_sent"] = True
            logger.info(f"Birthday promo email sent to {owner_email} for {pet_name}")
        except Exception as e:
            logger.error(f"Failed to send birthday email: {e}")
    
    # Record the promotion
    await db.birthday_promotions.insert_one({
        "pet_id": pet_id,
        "pet_name": pet_name,
        "owner_email": owner_email,
        "owner_phone": owner_phone,
        "celebration_type": celebration_type,
        "celebration_date": pet_celebration.get("date") if pet_celebration else today.isoformat(),
        "year": today.year,
        "discount_code": discount_code,
        "discount_percent": discount_percent,
        "expiry_date": expiry_date.isoformat(),
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "email_sent": result["email_sent"],
        "whatsapp_link": result["whatsapp_link"]
    })
    
    return result


# ==================== API ENDPOINTS ====================

@birthday_router.get("/upcoming")
async def get_upcoming(
    days: int = Query(30, description="Days ahead to check"),
    city: Optional[str] = Query(None, description="Filter by city"),
    type: Optional[str] = Query(None, description="Filter by celebration type"),
    username: str = Depends(verify_admin)
):
    """Get upcoming pet birthdays and celebrations"""
    celebrations = await get_upcoming_celebrations(
        days_ahead=days,
        city=city,
        celebration_type=type
    )
    
    # Group by timeframe
    today_celebrations = [c for c in celebrations if c["days_until"] == 0]
    week_celebrations = [c for c in celebrations if 1 <= c["days_until"] <= 7]
    two_week_celebrations = [c for c in celebrations if 8 <= c["days_until"] <= 14]
    month_celebrations = [c for c in celebrations if 15 <= c["days_until"] <= 30]
    
    return {
        "total": len(celebrations),
        "today": today_celebrations,
        "this_week": week_celebrations,
        "next_week": two_week_celebrations,
        "this_month": month_celebrations,
        "all": celebrations
    }


@birthday_router.get("/stats")
async def get_birthday_stats(username: str = Depends(verify_admin)):
    """Get birthday engine statistics"""
    today = datetime.now(timezone.utc).date()
    
    # Count pets with birthdays
    pets_with_birthdays = await db.pets.count_documents({"birth_date": {"$exists": True, "$ne": None}})
    pets_with_gotcha = await db.pets.count_documents({"gotcha_date": {"$exists": True, "$ne": None}})
    
    # Promotions sent this month
    start_of_month = today.replace(day=1)
    promos_this_month = await db.birthday_promotions.count_documents({
        "sent_at": {"$gte": start_of_month.isoformat()}
    })
    
    # Upcoming celebrations
    celebrations = await get_upcoming_celebrations(days_ahead=30)
    
    return {
        "pets_with_birthdays": pets_with_birthdays,
        "pets_with_gotcha_day": pets_with_gotcha,
        "promotions_sent_this_month": promos_this_month,
        "upcoming_7_days": len([c for c in celebrations if c["days_until"] <= 7]),
        "upcoming_14_days": len([c for c in celebrations if c["days_until"] <= 14]),
        "upcoming_30_days": len(celebrations),
        "promotions_pending": len([c for c in celebrations if not c["promotion_sent"]])
    }


@birthday_router.post("/send-promotion/{pet_id}")
async def send_promotion(
    pet_id: str,
    discount_percent: int = Query(15, ge=5, le=50),
    valid_days: int = Query(7, ge=1, le=30),
    include_products: bool = Query(True),
    custom_message: str = Query(""),
    username: str = Depends(verify_admin)
):
    """Send birthday promotion to a pet owner"""
    result = await send_birthday_promotion(
        pet_id=pet_id,
        discount_percent=discount_percent,
        valid_days=valid_days,
        custom_message=custom_message,
        include_products=include_products
    )
    return result


@birthday_router.post("/send-bulk")
async def send_bulk_promotions(
    days_until: int = Query(7, description="Send to pets with celebration within X days"),
    discount_percent: int = Query(15, ge=5, le=50),
    valid_days: int = Query(7, ge=1, le=30),
    celebration_type: Optional[str] = Query(None),
    username: str = Depends(verify_admin)
):
    """Send promotions to all pets with upcoming celebrations"""
    celebrations = await get_upcoming_celebrations(
        days_ahead=days_until,
        celebration_type=celebration_type
    )
    
    # Filter to those without promotions
    pending = [c for c in celebrations if not c["promotion_sent"]]
    
    results = []
    for cel in pending:
        result = await send_birthday_promotion(
            pet_id=cel["pet_id"],
            discount_percent=discount_percent,
            valid_days=valid_days
        )
        results.append({
            "pet_name": cel["pet_name"],
            "celebration": cel["celebration_label"],
            "date": cel["display_date"],
            **result
        })
    
    return {
        "message": f"Sent {len(results)} promotions",
        "total_upcoming": len(celebrations),
        "promotions_sent": len([r for r in results if r.get("success")]),
        "results": results
    }


@birthday_router.get("/promotions")
async def get_sent_promotions(
    limit: int = Query(50),
    username: str = Depends(verify_admin)
):
    """Get history of sent birthday promotions"""
    promotions = await db.birthday_promotions.find(
        {},
        {"_id": 0}
    ).sort("sent_at", -1).limit(limit).to_list(limit)
    
    return {"promotions": promotions, "count": len(promotions)}


@birthday_router.get("/products/{pet_type}/{celebration_type}")
async def get_product_suggestions(
    pet_type: str,
    celebration_type: str,
    limit: int = Query(6),
    username: str = Depends(verify_admin)
):
    """Get product suggestions for a celebration"""
    products = await get_suggested_products(pet_type, celebration_type, limit)
    return {"products": products, "count": len(products)}
