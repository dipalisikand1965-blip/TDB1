"""
MIRA PROACTIVE SYSTEM
=====================
"Mira doesn't just respond - she anticipates."

Features:
1. E020 Vaccination Alerts - Due date reminders
2. Birthday Reminders - 7 days and 1 day before
3. Grooming Due Alerts - Based on breed and last appointment
4. Re-order Suggestions - Running low on essentials
5. Health Check-ins - Periodic wellness prompts
6. Seasonal Tips - Monsoon, summer, winter care

This module generates proactive notifications that make Mira feel alive.
"""

from fastapi import APIRouter, Depends, Header
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import logging
import os

logger = logging.getLogger("mira_proactive")

router = APIRouter(prefix="/api/mira/proactive", tags=["mira-proactive"])

# Database reference
_db = None

def set_proactive_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


# ═══════════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class ProactiveAlert(BaseModel):
    """A proactive alert/reminder"""
    id: str
    type: str  # vaccination, birthday, grooming, reorder, health, seasonal
    pillar: str
    title: str
    message: str
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    urgency: str  # critical, high, medium, low
    due_date: Optional[str] = None
    days_until: Optional[int] = None
    cta: str  # Call to action button text
    cta_action: str  # Action to take (e.g., "book_vet", "order_vaccine", "plan_party")
    created_at: str
    dismissed: bool = False


# ═══════════════════════════════════════════════════════════════════════════════
# E020: VACCINATION ALERTS
# ═══════════════════════════════════════════════════════════════════════════════

async def check_vaccination_alerts(pet_id: str, pet_name: str, db) -> List[Dict]:
    """
    Check for upcoming or overdue vaccinations.
    
    Alert levels:
    - CRITICAL: Overdue
    - HIGH: Due within 7 days
    - MEDIUM: Due within 30 days
    - LOW: Due within 60 days
    """
    alerts = []
    now = datetime.now(timezone.utc)
    
    # Get pet's vaccination records
    pet = await db.pets.find_one(
        {"id": pet_id}, 
        {"_id": 0, "vaccinations": 1, "health_records": 1, "birth_date": 1}
    )
    
    if not pet:
        return alerts
    
    # Standard vaccination schedule (for dogs)
    VACCINE_SCHEDULE = {
        "rabies": {"interval_months": 12, "name": "Rabies"},
        "dhpp": {"interval_months": 12, "name": "DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)"},
        "bordetella": {"interval_months": 6, "name": "Bordetella (Kennel Cough)"},
        "leptospirosis": {"interval_months": 12, "name": "Leptospirosis"},
        "canine_influenza": {"interval_months": 12, "name": "Canine Influenza"},
        "lyme": {"interval_months": 12, "name": "Lyme Disease"}
    }
    
    vaccinations = pet.get("vaccinations", []) or pet.get("health_records", {}).get("vaccinations", [])
    
    for vaccine_key, vaccine_info in VACCINE_SCHEDULE.items():
        # Find last vaccination of this type
        last_vax = None
        for v in vaccinations:
            v_type = (v.get("type") or v.get("name") or "").lower()
            if vaccine_key in v_type or vaccine_info["name"].lower() in v_type:
                vax_date = v.get("date") or v.get("administered_date")
                if vax_date:
                    try:
                        if isinstance(vax_date, str):
                            last_vax = datetime.fromisoformat(vax_date.replace("Z", "+00:00"))
                        else:
                            last_vax = vax_date
                    except:
                        pass
        
        if last_vax:
            # Calculate next due date
            next_due = last_vax + timedelta(days=vaccine_info["interval_months"] * 30)
            days_until = (next_due - now).days
            
            if days_until < 0:
                # OVERDUE
                alerts.append({
                    "id": f"vax-{vaccine_key}-{pet_id}",
                    "type": "vaccination",
                    "pillar": "care",
                    "title": f"⚠️ {vaccine_info['name']} OVERDUE",
                    "message": f"{pet_name}'s {vaccine_info['name']} vaccination is {abs(days_until)} days overdue! Please schedule a vet visit.",
                    "pet_id": pet_id,
                    "pet_name": pet_name,
                    "urgency": "critical",
                    "due_date": next_due.isoformat(),
                    "days_until": days_until,
                    "cta": "Book Vet Now",
                    "cta_action": "book_vet_vaccination",
                    "created_at": now.isoformat()
                })
            elif days_until <= 7:
                # DUE WITHIN 7 DAYS
                alerts.append({
                    "id": f"vax-{vaccine_key}-{pet_id}",
                    "type": "vaccination",
                    "pillar": "care",
                    "title": f"💉 {vaccine_info['name']} Due Soon",
                    "message": f"{pet_name}'s {vaccine_info['name']} is due in {days_until} days. Time to schedule!",
                    "pet_id": pet_id,
                    "pet_name": pet_name,
                    "urgency": "high",
                    "due_date": next_due.isoformat(),
                    "days_until": days_until,
                    "cta": "Schedule Vaccination",
                    "cta_action": "book_vet_vaccination",
                    "created_at": now.isoformat()
                })
            elif days_until <= 30:
                # DUE WITHIN 30 DAYS
                alerts.append({
                    "id": f"vax-{vaccine_key}-{pet_id}",
                    "type": "vaccination",
                    "pillar": "care",
                    "title": f"📅 {vaccine_info['name']} Coming Up",
                    "message": f"{pet_name}'s {vaccine_info['name']} is due in {days_until} days.",
                    "pet_id": pet_id,
                    "pet_name": pet_name,
                    "urgency": "medium",
                    "due_date": next_due.isoformat(),
                    "days_until": days_until,
                    "cta": "Set Reminder",
                    "cta_action": "set_vaccination_reminder",
                    "created_at": now.isoformat()
                })
    
    return alerts


# ═══════════════════════════════════════════════════════════════════════════════
# BIRTHDAY REMINDERS
# ═══════════════════════════════════════════════════════════════════════════════

async def check_birthday_alerts(pet_id: str, pet_name: str, db) -> List[Dict]:
    """
    Check for upcoming birthdays and gotcha days.
    
    Alert levels:
    - HIGH: 1 day before
    - MEDIUM: 7 days before
    - LOW: 30 days before
    """
    alerts = []
    now = datetime.now(timezone.utc)
    
    pet = await db.pets.find_one(
        {"id": pet_id},
        {"_id": 0, "birth_date": 1, "gotcha_date": 1, "adoption_date": 1}
    )
    
    if not pet:
        return alerts
    
    # Check birthday
    birth_date_str = pet.get("birth_date")
    if birth_date_str:
        try:
            if isinstance(birth_date_str, str):
                birth_date = datetime.fromisoformat(birth_date_str.replace("Z", "+00:00"))
            else:
                birth_date = birth_date_str
            
            # Calculate next birthday
            next_birthday = birth_date.replace(year=now.year, tzinfo=timezone.utc)
            if next_birthday < now:
                next_birthday = next_birthday.replace(year=now.year + 1)
            
            days_until = (next_birthday - now).days
            age = now.year - birth_date.year
            if next_birthday.replace(year=now.year) > now:
                age -= 1
            
            if days_until == 0:
                # TODAY!
                alerts.append({
                    "id": f"birthday-{pet_id}",
                    "type": "birthday",
                    "pillar": "celebrate",
                    "title": f"🎂 Happy Birthday {pet_name}!",
                    "message": f"Today is {pet_name}'s birthday! They're turning {age + 1}! 🎉",
                    "pet_id": pet_id,
                    "pet_name": pet_name,
                    "urgency": "critical",
                    "due_date": next_birthday.isoformat(),
                    "days_until": 0,
                    "cta": "Celebrate Now!",
                    "cta_action": "celebrate_birthday",
                    "created_at": now.isoformat()
                })
            elif days_until == 1:
                alerts.append({
                    "id": f"birthday-{pet_id}",
                    "type": "birthday",
                    "pillar": "celebrate",
                    "title": f"🎂 {pet_name}'s Birthday Tomorrow!",
                    "message": f"Tomorrow is {pet_name}'s birthday! They're turning {age + 1}! Have you planned something special?",
                    "pet_id": pet_id,
                    "pet_name": pet_name,
                    "urgency": "high",
                    "due_date": next_birthday.isoformat(),
                    "days_until": 1,
                    "cta": "Order Cake",
                    "cta_action": "order_birthday_cake",
                    "created_at": now.isoformat()
                })
            elif days_until <= 7:
                alerts.append({
                    "id": f"birthday-{pet_id}",
                    "type": "birthday",
                    "pillar": "celebrate",
                    "title": f"🎂 {pet_name}'s Birthday in {days_until} Days!",
                    "message": f"{pet_name} is turning {age + 1} in {days_until} days! Shall I help plan the celebration?",
                    "pet_id": pet_id,
                    "pet_name": pet_name,
                    "urgency": "medium",
                    "due_date": next_birthday.isoformat(),
                    "days_until": days_until,
                    "cta": "Plan Party",
                    "cta_action": "plan_birthday_party",
                    "created_at": now.isoformat()
                })
            elif days_until <= 30:
                alerts.append({
                    "id": f"birthday-{pet_id}",
                    "type": "birthday",
                    "pillar": "celebrate",
                    "title": f"📅 {pet_name}'s Birthday Coming Up",
                    "message": f"{pet_name}'s birthday is in {days_until} days ({next_birthday.strftime('%B %d')}). Start planning early!",
                    "pet_id": pet_id,
                    "pet_name": pet_name,
                    "urgency": "low",
                    "due_date": next_birthday.isoformat(),
                    "days_until": days_until,
                    "cta": "Set Reminder",
                    "cta_action": "set_birthday_reminder",
                    "created_at": now.isoformat()
                })
        except Exception as e:
            logger.warning(f"[BIRTHDAY] Error parsing birth_date for {pet_id}: {e}")
    
    return alerts


# ═══════════════════════════════════════════════════════════════════════════════
# GROOMING DUE ALERTS
# ═══════════════════════════════════════════════════════════════════════════════

async def check_grooming_alerts(pet_id: str, pet_name: str, db) -> List[Dict]:
    """
    Check for grooming due based on breed and last appointment.
    """
    alerts = []
    now = datetime.now(timezone.utc)
    
    # Get pet breed and last grooming
    pet = await db.pets.find_one(
        {"id": pet_id},
        {"_id": 0, "breed": 1, "coat_type": 1, "grooming_history": 1}
    )
    
    if not pet:
        return alerts
    
    # Grooming frequency by coat type (in days)
    GROOMING_INTERVALS = {
        "long": 30,      # Long coat - monthly
        "medium": 45,    # Medium coat - every 6 weeks
        "short": 60,     # Short coat - every 2 months
        "double": 45,    # Double coat - every 6 weeks
        "wire": 60,      # Wire coat - every 2 months
        "curly": 30,     # Curly (poodle, etc.) - monthly
        "default": 45
    }
    
    coat_type = (pet.get("coat_type") or "default").lower()
    interval = GROOMING_INTERVALS.get(coat_type, GROOMING_INTERVALS["default"])
    
    # Check last grooming
    grooming_history = pet.get("grooming_history", [])
    last_groom = None
    
    if grooming_history:
        last_entry = grooming_history[-1] if isinstance(grooming_history, list) else None
        if last_entry:
            last_date = last_entry.get("date")
            if last_date:
                try:
                    last_groom = datetime.fromisoformat(last_date.replace("Z", "+00:00"))
                except:
                    pass
    
    # Also check service bookings
    last_booking = await db.service_desk_tickets.find_one(
        {"pet_id": pet_id, "pillar": "care", "service_type": {"$regex": "groom", "$options": "i"}},
        sort=[("created_at", -1)]
    )
    
    if last_booking:
        booking_date = last_booking.get("created_at")
        if booking_date:
            try:
                booking_datetime = datetime.fromisoformat(booking_date.replace("Z", "+00:00"))
                if not last_groom or booking_datetime > last_groom:
                    last_groom = booking_datetime
            except:
                pass
    
    if last_groom:
        next_due = last_groom + timedelta(days=interval)
        days_until = (next_due - now).days
        
        if days_until < 0:
            alerts.append({
                "id": f"grooming-{pet_id}",
                "type": "grooming",
                "pillar": "care",
                "title": f"✂️ {pet_name} Needs Grooming",
                "message": f"{pet_name}'s grooming is {abs(days_until)} days overdue. Time for a spa day!",
                "pet_id": pet_id,
                "pet_name": pet_name,
                "urgency": "high" if days_until < -14 else "medium",
                "due_date": next_due.isoformat(),
                "days_until": days_until,
                "cta": "Book Grooming",
                "cta_action": "book_grooming",
                "created_at": now.isoformat()
            })
        elif days_until <= 7:
            alerts.append({
                "id": f"grooming-{pet_id}",
                "type": "grooming",
                "pillar": "care",
                "title": f"✂️ {pet_name}'s Grooming Due Soon",
                "message": f"{pet_name}'s next grooming is due in {days_until} days.",
                "pet_id": pet_id,
                "pet_name": pet_name,
                "urgency": "medium",
                "due_date": next_due.isoformat(),
                "days_until": days_until,
                "cta": "Book Now",
                "cta_action": "book_grooming",
                "created_at": now.isoformat()
            })
    
    return alerts


# ═══════════════════════════════════════════════════════════════════════════════
# RE-ORDER SUGGESTIONS
# Based on purchase history - suggest re-ordering consumables
# ═══════════════════════════════════════════════════════════════════════════════

# Consumable product categories and their typical reorder intervals (in days)
CONSUMABLE_INTERVALS = {
    "food": 30,           # Dog food - monthly
    "kibble": 30,
    "treats": 21,         # Treats - 3 weeks
    "snacks": 21,
    "supplement": 30,     # Supplements - monthly
    "vitamin": 30,
    "medicine": 30,       # Medicines - monthly
    "shampoo": 60,        # Shampoo - 2 months
    "conditioner": 60,
    "dental": 45,         # Dental treats - 6 weeks
    "flea": 30,           # Flea/tick - monthly
    "tick": 30,
    "wipes": 30,          # Wipes - monthly
    "poop bags": 30,
    "pads": 21,           # Training pads - 3 weeks
}

async def check_reorder_suggestions(pet_id: str, pet_name: str, user_email: str, db) -> List[Dict]:
    """
    Analyze purchase history and suggest re-orders for consumables.
    
    Logic:
    1. Find past orders for this user
    2. Identify consumable products
    3. Calculate expected reorder date
    4. Suggest if due or overdue
    """
    alerts = []
    now = datetime.now(timezone.utc)
    
    if not user_email:
        return alerts
    
    # Get user's order history
    orders = await db.orders.find(
        {"$or": [
            {"email": user_email},
            {"user_email": user_email},
            {"customer_email": user_email}
        ]},
        {"_id": 0, "items": 1, "created_at": 1, "order_date": 1}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    if not orders:
        return alerts
    
    # Track last purchase of each consumable type
    consumable_purchases = {}
    
    for order in orders:
        order_date_str = order.get("created_at") or order.get("order_date")
        if not order_date_str:
            continue
        
        try:
            if isinstance(order_date_str, str):
                order_date = datetime.fromisoformat(order_date_str.replace("Z", "+00:00"))
            else:
                order_date = order_date_str
        except:
            continue
        
        items = order.get("items", [])
        for item in items:
            product_name = (item.get("name") or item.get("product_name") or "").lower()
            product_id = item.get("product_id") or item.get("id")
            
            # Check if this is a consumable
            for consumable_type, interval in CONSUMABLE_INTERVALS.items():
                if consumable_type in product_name:
                    key = f"{consumable_type}:{product_id or product_name[:20]}"
                    if key not in consumable_purchases:
                        consumable_purchases[key] = {
                            "type": consumable_type,
                            "product_name": item.get("name") or item.get("product_name"),
                            "product_id": product_id,
                            "last_purchase": order_date,
                            "interval": interval,
                            "price": item.get("price") or item.get("amount"),
                            "quantity": item.get("quantity", 1)
                        }
                    break
    
    # Generate reorder alerts
    for key, purchase in consumable_purchases.items():
        last_date = purchase["last_purchase"]
        interval = purchase["interval"]
        next_reorder = last_date + timedelta(days=interval)
        days_until = (next_reorder - now).days
        
        product_name = purchase["product_name"] or purchase["type"].title()
        
        if days_until < -7:
            # Very overdue - might have run out
            alerts.append({
                "id": f"reorder-{key.replace(':', '-')}",
                "type": "reorder",
                "pillar": "shop",
                "title": f"🛒 Time to Reorder {product_name}?",
                "message": f"You last ordered {product_name} {abs(days_until)} days ago. {pet_name} might be running low!",
                "pet_id": pet_id,
                "pet_name": pet_name,
                "urgency": "high",
                "due_date": next_reorder.isoformat(),
                "days_until": days_until,
                "cta": "Reorder Now",
                "cta_action": "reorder_product",
                "product_id": purchase.get("product_id"),
                "product_name": product_name,
                "last_price": purchase.get("price"),
                "created_at": now.isoformat()
            })
        elif days_until <= 5:
            # Coming up soon
            alerts.append({
                "id": f"reorder-{key.replace(':', '-')}",
                "type": "reorder",
                "pillar": "shop",
                "title": f"📦 {product_name} Running Low?",
                "message": f"Based on your purchase history, it might be time to restock {product_name} for {pet_name}.",
                "pet_id": pet_id,
                "pet_name": pet_name,
                "urgency": "medium",
                "due_date": next_reorder.isoformat(),
                "days_until": days_until,
                "cta": "Quick Reorder",
                "cta_action": "reorder_product",
                "product_id": purchase.get("product_id"),
                "product_name": product_name,
                "last_price": purchase.get("price"),
                "created_at": now.isoformat()
            })
    
    # Sort by urgency
    alerts.sort(key=lambda x: x.get("days_until", 0))
    
    return alerts[:5]  # Return top 5 reorder suggestions


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK-IN PROMPTS
# Periodic wellness prompts to engage pet parents
# ═══════════════════════════════════════════════════════════════════════════════

async def check_health_checkin_prompts(pet_id: str, pet_name: str, db) -> List[Dict]:
    """
    Generate periodic health check-in prompts.
    
    Types:
    - Weekly wellness check
    - Post-vaccination check (3 days after)
    - Senior pet monthly check (for dogs 7+)
    - Post-illness follow-up
    """
    alerts = []
    now = datetime.now(timezone.utc)
    
    # Get pet info
    pet = await db.pets.find_one(
        {"id": pet_id},
        {"_id": 0, "birth_date": 1, "health_records": 1, "last_wellness_checkin": 1}
    )
    
    if not pet:
        return alerts
    
    # Calculate age
    age_years = 0
    birth_date_str = pet.get("birth_date")
    if birth_date_str:
        try:
            if isinstance(birth_date_str, str):
                birth_date = datetime.fromisoformat(birth_date_str.replace("Z", "+00:00"))
            else:
                birth_date = birth_date_str
            age_years = (now - birth_date).days // 365
        except:
            pass
    
    # Check last wellness check-in
    last_checkin = pet.get("last_wellness_checkin")
    days_since_checkin = 999
    if last_checkin:
        try:
            if isinstance(last_checkin, str):
                last_checkin_date = datetime.fromisoformat(last_checkin.replace("Z", "+00:00"))
            else:
                last_checkin_date = last_checkin
            days_since_checkin = (now - last_checkin_date).days
        except:
            pass
    
    # Weekly wellness check (if no check-in for 7+ days)
    if days_since_checkin >= 7:
        alerts.append({
            "id": f"wellness-weekly-{pet_id}",
            "type": "health_checkin",
            "pillar": "care",
            "title": f"💚 How is {pet_name} doing?",
            "message": f"It's been a week! Quick check - is {pet_name} eating well, playing normally, and feeling happy?",
            "pet_id": pet_id,
            "pet_name": pet_name,
            "urgency": "low",
            "cta": "All Good!",
            "cta_action": "wellness_checkin_ok",
            "secondary_cta": "Something's Off",
            "secondary_action": "wellness_checkin_concern",
            "created_at": now.isoformat()
        })
    
    # Senior pet monthly check (for dogs 7+)
    if age_years >= 7 and days_since_checkin >= 14:
        alerts.append({
            "id": f"wellness-senior-{pet_id}",
            "type": "health_checkin",
            "pillar": "care",
            "title": f"👴 Senior Check: {pet_name}",
            "message": f"At {age_years} years young, {pet_name} deserves extra attention. Any changes in appetite, mobility, or energy levels?",
            "pet_id": pet_id,
            "pet_name": pet_name,
            "urgency": "medium",
            "cta": "Doing Great",
            "cta_action": "senior_checkin_ok",
            "secondary_cta": "Schedule Checkup",
            "secondary_action": "book_senior_checkup",
            "created_at": now.isoformat()
        })
    
    # Post-vaccination check (3 days after any vaccination)
    vaccinations = pet.get("health_records", {}).get("vaccinations", []) or pet.get("vaccinations", [])
    for vax in vaccinations:
        vax_date_str = vax.get("date") or vax.get("administered_date")
        if vax_date_str:
            try:
                if isinstance(vax_date_str, str):
                    vax_date = datetime.fromisoformat(vax_date_str.replace("Z", "+00:00"))
                else:
                    vax_date = vax_date_str
                days_since_vax = (now - vax_date).days
                
                if 2 <= days_since_vax <= 4:  # 2-4 days after vaccination
                    vax_name = vax.get("name") or vax.get("type") or "vaccination"
                    alerts.append({
                        "id": f"postvax-{pet_id}-{vax_date_str[:10]}",
                        "type": "health_checkin",
                        "pillar": "care",
                        "title": f"💉 Post-Vaccination Check",
                        "message": f"It's been {days_since_vax} days since {pet_name}'s {vax_name}. Any soreness, lethargy, or unusual behavior?",
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "urgency": "medium",
                        "cta": "All Normal",
                        "cta_action": "postvax_ok",
                        "secondary_cta": "Report Side Effect",
                        "secondary_action": "postvax_concern",
                        "created_at": now.isoformat()
                    })
                    break  # Only one post-vax alert
            except:
                pass
    
    return alerts


# ═══════════════════════════════════════════════════════════════════════════════
# SEASONAL TIPS
# Weather and season-aware care tips
# ═══════════════════════════════════════════════════════════════════════════════

def get_current_season_india() -> Dict[str, Any]:
    """
    Determine current season in India and provide context.
    
    India seasons:
    - Winter: Dec-Feb (cold, dry)
    - Summer: Mar-May (hot, dry)
    - Monsoon: Jun-Sep (hot, humid, rainy)
    - Post-Monsoon: Oct-Nov (moderate)
    """
    now = datetime.now(timezone.utc)
    month = now.month
    
    if month in [12, 1, 2]:
        return {
            "season": "winter",
            "name": "Winter",
            "months": "December - February",
            "weather": "cold, dry",
            "risks": ["hypothermia for small dogs", "dry skin", "joint stiffness"],
            "emoji": "❄️"
        }
    elif month in [3, 4, 5]:
        return {
            "season": "summer",
            "name": "Summer",
            "months": "March - May",
            "weather": "hot, dry",
            "risks": ["heat stroke", "dehydration", "paw burns", "tick season"],
            "emoji": "☀️"
        }
    elif month in [6, 7, 8, 9]:
        return {
            "season": "monsoon",
            "name": "Monsoon",
            "months": "June - September",
            "weather": "hot, humid, rainy",
            "risks": ["fungal infections", "waterborne diseases", "leptospirosis", "muddy paws"],
            "emoji": "🌧️"
        }
    else:  # 10, 11
        return {
            "season": "post_monsoon",
            "name": "Post-Monsoon",
            "months": "October - November",
            "weather": "moderate, pleasant",
            "risks": ["allergies", "tick resurgence"],
            "emoji": "🍂"
        }


SEASONAL_TIPS = {
    "winter": [
        {
            "title": "❄️ Keep {pet_name} Warm",
            "message": "Winter nights can be cold! Consider a cozy sweater for {pet_name}, especially for short-haired breeds. Keep their bed away from drafts.",
            "cta": "Shop Sweaters",
            "cta_action": "shop_winter_wear"
        },
        {
            "title": "❄️ Moisturize Those Paws",
            "message": "Cold weather can dry out {pet_name}'s paw pads. A paw balm can help prevent cracking and discomfort.",
            "cta": "Shop Paw Care",
            "cta_action": "shop_paw_balm"
        },
        {
            "title": "❄️ Senior Joint Care",
            "message": "Cold weather can make joints stiff. If {pet_name} is older, consider joint supplements and a warm bed.",
            "cta": "Shop Supplements",
            "cta_action": "shop_joint_supplements"
        }
    ],
    "summer": [
        {
            "title": "☀️ Beat the Heat",
            "message": "It's getting hot! Never leave {pet_name} in a parked car. Walk during early morning or late evening only.",
            "cta": "Shop Cooling Mats",
            "cta_action": "shop_cooling_products"
        },
        {
            "title": "☀️ Hydration Alert",
            "message": "Make sure {pet_name} always has fresh, cool water. Consider adding ice cubes or a pet water fountain.",
            "cta": "Shop Water Bowls",
            "cta_action": "shop_water_bowls"
        },
        {
            "title": "☀️ Paw-tect from Hot Surfaces",
            "message": "Pavements can burn paws in summer! Test with your hand - if it's too hot for you, it's too hot for {pet_name}.",
            "cta": "Shop Paw Protection",
            "cta_action": "shop_paw_protection"
        },
        {
            "title": "☀️ Tick & Flea Season",
            "message": "Summer means more ticks and fleas! Make sure {pet_name}'s prevention is up to date.",
            "cta": "Shop Tick Prevention",
            "cta_action": "shop_tick_prevention"
        }
    ],
    "monsoon": [
        {
            "title": "🌧️ Monsoon Paw Care",
            "message": "Wet paws = infection risk! Always dry {pet_name}'s paws after walks and check between toes for fungus.",
            "cta": "Shop Paw Wipes",
            "cta_action": "shop_paw_wipes"
        },
        {
            "title": "🌧️ Lepto Alert",
            "message": "Monsoon increases leptospirosis risk from puddles. Make sure {pet_name}'s vaccination is current!",
            "cta": "Check Vaccinations",
            "cta_action": "check_vaccinations"
        },
        {
            "title": "🌧️ Indoor Boredom Busters",
            "message": "Stuck indoors due to rain? Keep {pet_name} mentally stimulated with puzzle toys and training games.",
            "cta": "Shop Puzzle Toys",
            "cta_action": "shop_puzzle_toys"
        },
        {
            "title": "🌧️ Raincoat Ready",
            "message": "A good raincoat keeps {pet_name} dry and happy during monsoon walks!",
            "cta": "Shop Raincoats",
            "cta_action": "shop_raincoats"
        }
    ],
    "post_monsoon": [
        {
            "title": "🍂 Allergy Season",
            "message": "Post-monsoon can trigger allergies. Watch for excessive scratching or sneezing in {pet_name}.",
            "cta": "Shop Allergy Relief",
            "cta_action": "shop_allergy_products"
        },
        {
            "title": "🍂 Perfect Walking Weather",
            "message": "The weather is beautiful! Great time for longer walks with {pet_name}. Enjoy the outdoors!",
            "cta": "Shop Walking Gear",
            "cta_action": "shop_walking_gear"
        }
    ]
}

async def check_seasonal_tips(pet_id: str, pet_name: str, db) -> List[Dict]:
    """
    Generate seasonal tips based on current weather/season.
    
    Logic:
    - Show 1-2 seasonal tips per week
    - Rotate through tips to avoid repetition
    - Consider pet-specific factors (age, breed, coat)
    """
    alerts = []
    now = datetime.now(timezone.utc)
    
    # Get current season
    season_info = get_current_season_india()
    season = season_info["season"]
    
    # Get tips for current season
    tips = SEASONAL_TIPS.get(season, [])
    
    if not tips:
        return alerts
    
    # Select 1 tip (rotate based on day of week)
    tip_index = now.timetuple().tm_yday % len(tips)
    selected_tip = tips[tip_index]
    
    # Format tip with pet name
    alerts.append({
        "id": f"seasonal-{season}-{tip_index}-{pet_id}",
        "type": "seasonal_tip",
        "pillar": "advisory",
        "title": selected_tip["title"].format(pet_name=pet_name),
        "message": selected_tip["message"].format(pet_name=pet_name),
        "pet_id": pet_id,
        "pet_name": pet_name,
        "urgency": "low",
        "season": season_info["name"],
        "cta": selected_tip["cta"],
        "cta_action": selected_tip["cta_action"],
        "created_at": now.isoformat()
    })
    
    return alerts



# ═══════════════════════════════════════════════════════════════════════════════
# META PROACTIVE - "Mira as Pet Historian"
# From User's Question Bank: "Can you keep track... and bring it back next year?"
# ═══════════════════════════════════════════════════════════════════════════════

async def check_meta_proactive_alerts(pet_id: str, pet_name: str, db) -> List[Dict]:
    """
    META PROACTIVE ALERTS - Makes Mira feel like a living historian.
    
    Features from user's question bank:
    1. "Remind me a week before any important date"
    2. "Can you show me what we've actually done, so I feel less guilty?"
    3. "When I'm not in a good place, suggest no-pressure ways"
    4. "Store ideas I like for future - so they don't vanish"
    5. "Keep track of what worked and what we decided not to repeat"
    6. "Act as a quiet historian - remembering patterns"
    7. "If I do nothing elaborate, help me design one tiny ritual"
    """
    alerts = []
    now = datetime.now(timezone.utc)
    
    try:
        # ═══════════════════════════════════════════════════════════════════════════
        # 1. SERVICE PROVIDER DUE - "It's been X days since last grooming with Priya"
        # ═══════════════════════════════════════════════════════════════════════════
        last_grooming = await db.service_desk_tickets.find_one(
            {"$or": [
                {"pet_id": pet_id},
                {"pet.id": pet_id},
                {"ai_context.pet_name": pet_name}
            ], "pillar": "care", "service_type": {"$regex": "groom", "$options": "i"}},
            sort=[("created_at", -1)]
        )
        
        if last_grooming:
            last_date = last_grooming.get("created_at")
            provider = last_grooming.get("provider") or last_grooming.get("ai_context", {}).get("provider")
            if last_date and provider:
                try:
                    if isinstance(last_date, str):
                        last_dt = datetime.fromisoformat(last_date.replace("Z", "+00:00"))
                    else:
                        last_dt = last_date
                    
                    # Ensure timezone awareness
                    if last_dt.tzinfo is None:
                        last_dt = last_dt.replace(tzinfo=timezone.utc)
                    
                    days_since = (now - last_dt).days
                    
                    if days_since >= 30 and days_since < 45:
                        alerts.append({
                            "id": f"meta-grooming-due-{pet_id}",
                            "type": "service_reminder",
                            "pillar": "care",
                            "title": f"✂️ It's been {days_since} days since {pet_name}'s last grooming",
                            "message": f"{pet_name} was last groomed with {provider} on {last_dt.strftime('%B %d')}. Shall I book the same groomer again?",
                            "pet_id": pet_id,
                            "pet_name": pet_name,
                            "urgency": "medium",
                            "days_since": days_since,
                            "provider": provider,
                            "cta": f"Book {provider} Again",
                            "cta_action": "rebook_grooming",
                            "created_at": now.isoformat()
                        })
                except Exception as e:
                    logger.warning(f"[META] Error parsing grooming date: {e}")
        
        # ═══════════════════════════════════════════════════════════════════════════
        # 2. CELEBRATION HISTORY REMINDER - "Remember last year's party?"
        # ═══════════════════════════════════════════════════════════════════════════
        last_celebration = await db.service_desk_tickets.find_one(
            {"$and": [
                {"$or": [{"pet_id": pet_id}, {"pet.id": pet_id}]},
                {"$or": [{"pillar": "celebrate"}, {"service_type": {"$in": ["birthday", "party"]}}]}
            ]},
            sort=[("created_at", -1)]
        )
        
        if last_celebration:
            cel_date = last_celebration.get("created_at")
            ai_ctx = last_celebration.get("ai_context", {})
            cel_type = ai_ctx.get("celebrate_type", "celebration")
            guests = ai_ctx.get("guest_list", [])
            
            if cel_date:
                try:
                    if isinstance(cel_date, str):
                        cel_dt = datetime.fromisoformat(cel_date.replace("Z", "+00:00"))
                    else:
                        cel_dt = cel_date
                    
                    # Ensure timezone awareness
                    if cel_dt.tzinfo is None:
                        cel_dt = cel_dt.replace(tzinfo=timezone.utc)
                    
                    days_since = (now - cel_dt).days
                    
                    # If it's been about a year (330-400 days), remind about anniversary
                    if 330 <= days_since <= 400:
                        guests_text = f" with {', '.join(guests[:3])}" if guests else ""
                        alerts.append({
                            "id": f"meta-celebration-anniversary-{pet_id}",
                            "type": "celebration_reminder",
                            "pillar": "celebrate",
                            "title": f"🎉 A year ago: {pet_name}'s {cel_type}",
                            "message": f"Remember last year's {cel_type}{guests_text}? Want to plan something similar this year?",
                            "pet_id": pet_id,
                            "pet_name": pet_name,
                            "urgency": "low",
                            "days_since": days_since,
                            "last_event": cel_type,
                            "past_guests": guests,
                            "cta": "Plan This Year's Celebration",
                            "cta_action": "plan_celebration",
                            "created_at": now.isoformat()
                        })
                except Exception as e:
                    logger.warning(f"[META] Error parsing celebration date: {e}")
        
        # ═══════════════════════════════════════════════════════════════════════════
        # 3. ORDER RESTOCK INTELLIGENCE - "You usually order every X weeks"
        # ═══════════════════════════════════════════════════════════════════════════
        recent_orders = await db.orders.find(
            {"$or": [{"pet_id": pet_id}, {"pet_name": pet_name}]},
            {"_id": 0, "created_at": 1, "items": 1}
        ).sort("created_at", -1).limit(5).to_list(5)
        
        if len(recent_orders) >= 2:
            # Calculate average order frequency
            order_dates = []
            for o in recent_orders:
                o_date = o.get("created_at")
                if o_date:
                    try:
                        if isinstance(o_date, str):
                            dt = datetime.fromisoformat(o_date.replace("Z", "+00:00"))
                        else:
                            dt = o_date
                        # Ensure timezone awareness
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        order_dates.append(dt)
                    except:
                        pass
            
            if len(order_dates) >= 2:
                # Calculate average interval
                intervals = []
                for i in range(len(order_dates) - 1):
                    interval = (order_dates[i] - order_dates[i+1]).days
                    if interval > 0:
                        intervals.append(interval)
                
                if intervals:
                    avg_interval = sum(intervals) // len(intervals)
                    days_since_last = (now - order_dates[0]).days
                    
                    # If we're past the average interval
                    if days_since_last >= avg_interval and days_since_last < avg_interval + 14:
                        last_items = []
                        for item in (recent_orders[0].get("items") or [])[:3]:
                            last_items.append(item.get("name") or item.get("product_name", "Item"))
                        
                        alerts.append({
                            "id": f"meta-reorder-pattern-{pet_id}",
                            "type": "reorder_pattern",
                            "pillar": "shop",
                            "title": f"🛒 Time to restock for {pet_name}?",
                            "message": f"You usually order every ~{avg_interval} days. Last order was {days_since_last} days ago: {', '.join(last_items)}. Need to restock?",
                            "pet_id": pet_id,
                            "pet_name": pet_name,
                            "urgency": "low",
                            "avg_interval": avg_interval,
                            "days_since_last": days_since_last,
                            "last_items": last_items,
                            "cta": "Reorder Same Items",
                            "cta_action": "quick_reorder",
                            "created_at": now.isoformat()
                        })
        
        # ═══════════════════════════════════════════════════════════════════════════
        # 4. DOG FRIENDS ALERT - "Haven't had a playdate with Bruno in a while"
        # ═══════════════════════════════════════════════════════════════════════════
        dog_friends_memory = await db.mira_memories.find_one(
            {"pet_id": pet_id, "memory_type": "social"},
            {"_id": 0, "content": 1, "created_at": 1}
        )
        
        if dog_friends_memory:
            import re
            content = dog_friends_memory.get("content", "")
            friend_matches = re.findall(r'(?:friend|played with|knows)\s+(\w+)', content, re.I)
            friends = [f.capitalize() for f in friend_matches if f.lower() not in ["the", "a", "an", "other"]]
            
            if friends:
                # Check last playdate/celebration with these friends
                recent_social = await db.service_desk_tickets.find_one(
                    {"$and": [
                        {"$or": [{"pet_id": pet_id}, {"pet.id": pet_id}]},
                        {"ai_context.guest_list": {"$in": friends}}
                    ]},
                    sort=[("created_at", -1)]
                )
                
                last_social_days = 999
                if recent_social:
                    social_date = recent_social.get("created_at")
                    if social_date:
                        try:
                            if isinstance(social_date, str):
                                social_dt = datetime.fromisoformat(social_date.replace("Z", "+00:00"))
                            else:
                                social_dt = social_date
                            # Ensure timezone awareness
                            if social_dt.tzinfo is None:
                                social_dt = social_dt.replace(tzinfo=timezone.utc)
                            last_social_days = (now - social_dt).days
                        except:
                            pass
                
                # If it's been a while since seeing friends
                if last_social_days >= 60:
                    friend_mention = friends[0] if friends else "friends"
                    alerts.append({
                        "id": f"meta-playdate-reminder-{pet_id}",
                        "type": "social_reminder",
                        "pillar": "celebrate",
                        "title": f"🐕 Time for {pet_name} to see {friend_mention}?",
                        "message": f"{pet_name}'s friend list: {', '.join(friends[:3])}. It's been a while since their last playdate. Maybe plan something fun?",
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "urgency": "low",
                        "friends": friends[:5],
                        "days_since_playdate": last_social_days if last_social_days < 999 else None,
                        "cta": "Plan Playdate",
                        "cta_action": "plan_playdate",
                        "created_at": now.isoformat()
                    })
        
        # ═══════════════════════════════════════════════════════════════════════════
        # 5. MICRO-CELEBRATION SUGGESTION - "Small daily rituals that say you matter"
        # ═══════════════════════════════════════════════════════════════════════════
        # Show this occasionally (every 14 days roughly)
        day_of_year = now.timetuple().tm_yday
        if day_of_year % 14 == 0:
            micro_celebrations = [
                {
                    "title": f"💜 Micro-celebration idea for {pet_name}",
                    "message": "A 5-minute 'love ritual' can be as simple as a slow brush, quiet cuddles, or their favorite game. No prep needed, just presence.",
                    "cta": "Show Me Ideas"
                },
                {
                    "title": f"✨ Small gesture, big impact for {pet_name}",
                    "message": "Today's idea: Tell them how good they are while doing something mundane (like filling their water bowl). They notice your tone.",
                    "cta": "More Ideas"
                },
                {
                    "title": f"🌟 Celebrating {pet_name} daily",
                    "message": "Small consistent gestures over time matter more than one big event. What's one tiny thing you can do today?",
                    "cta": "Inspire Me"
                }
            ]
            
            selected = micro_celebrations[day_of_year % len(micro_celebrations)]
            alerts.append({
                "id": f"meta-micro-celebration-{pet_id}-{day_of_year}",
                "type": "micro_celebration",
                "pillar": "celebrate",
                "title": selected["title"],
                "message": selected["message"],
                "pet_id": pet_id,
                "pet_name": pet_name,
                "urgency": "low",
                "cta": selected["cta"],
                "cta_action": "show_micro_celebrations",
                "created_at": now.isoformat()
            })
        
    except Exception as e:
        logger.error(f"[META PROACTIVE] Error generating alerts: {e}")
    
    return alerts


@router.get("/alerts/{pet_id}")
async def get_proactive_alerts(pet_id: str, user_email: str = None):
    """
    Get all proactive alerts for a pet.
    Returns vaccination, birthday, grooming, reorder, health check-in, and seasonal alerts.
    """
    db = get_db()
    
    # Get pet info
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "name": 1, "owner_email": 1, "member_email": 1})
    if not pet:
        return {"alerts": [], "message": "Pet not found"}
    
    pet_name = pet.get("name", "Your pet")
    owner_email = user_email or pet.get("owner_email") or pet.get("member_email")
    all_alerts = []
    
    # Gather all alerts
    vaccination_alerts = await check_vaccination_alerts(pet_id, pet_name, db)
    birthday_alerts = await check_birthday_alerts(pet_id, pet_name, db)
    grooming_alerts = await check_grooming_alerts(pet_id, pet_name, db)
    
    # Health check-ins (NEW)
    health_checkin_alerts = await check_health_checkin_prompts(pet_id, pet_name, db)
    
    # Seasonal tips (NEW)
    seasonal_alerts = await check_seasonal_tips(pet_id, pet_name, db)
    
    # Reorder suggestions based on purchase history
    reorder_alerts = []
    if owner_email:
        reorder_alerts = await check_reorder_suggestions(pet_id, pet_name, owner_email, db)
    
    # ═══════════════════════════════════════════════════════════════════════════════
    # META PROACTIVE - "Mira as Pet Historian" (From User's Question Bank)
    # ═══════════════════════════════════════════════════════════════════════════════
    meta_alerts = await check_meta_proactive_alerts(pet_id, pet_name, db)
    
    all_alerts.extend(vaccination_alerts)
    all_alerts.extend(birthday_alerts)
    all_alerts.extend(grooming_alerts)
    all_alerts.extend(health_checkin_alerts)
    all_alerts.extend(seasonal_alerts)
    all_alerts.extend(reorder_alerts)
    all_alerts.extend(meta_alerts)
    
    # Sort by urgency
    urgency_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    all_alerts.sort(key=lambda x: urgency_order.get(x.get("urgency", "low"), 4))
    
    return {
        "pet_id": pet_id,
        "pet_name": pet_name,
        "alerts": all_alerts,
        "total": len(all_alerts),
        "critical_count": len([a for a in all_alerts if a.get("urgency") == "critical"]),
        "high_count": len([a for a in all_alerts if a.get("urgency") == "high"]),
        "types": {
            "vaccination": len(vaccination_alerts),
            "birthday": len(birthday_alerts),
            "grooming": len(grooming_alerts),
            "health_checkin": len(health_checkin_alerts),
            "seasonal": len(seasonal_alerts),
            "reorder": len(reorder_alerts),
            "meta_proactive": len(meta_alerts)
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/alerts/user/{user_email}")
async def get_user_proactive_alerts(user_email: str):
    """
    Get all proactive alerts for all pets of a user.
    """
    db = get_db()
    
    # Get all user's pets
    pets = await db.pets.find(
        {"$or": [{"owner_email": user_email}, {"member_email": user_email}]},
        {"_id": 0, "id": 1, "name": 1}
    ).to_list(20)
    
    if not pets:
        return {"alerts": [], "message": "No pets found"}
    
    all_alerts = []
    
    for pet in pets:
        pet_id = pet.get("id")
        pet_name = pet.get("name", "Pet")
        
        vaccination_alerts = await check_vaccination_alerts(pet_id, pet_name, db)
        birthday_alerts = await check_birthday_alerts(pet_id, pet_name, db)
        grooming_alerts = await check_grooming_alerts(pet_id, pet_name, db)
        
        all_alerts.extend(vaccination_alerts)
        all_alerts.extend(birthday_alerts)
        all_alerts.extend(grooming_alerts)
    
    # Sort by urgency
    urgency_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    all_alerts.sort(key=lambda x: urgency_order.get(x.get("urgency", "low"), 4))
    
    return {
        "user_email": user_email,
        "pets_checked": len(pets),
        "alerts": all_alerts,
        "total": len(all_alerts),
        "critical_count": len([a for a in all_alerts if a.get("urgency") == "critical"]),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.post("/dismiss/{alert_id}")
async def dismiss_alert(alert_id: str, user_email: str = None):
    """Dismiss an alert (mark as seen)"""
    db = get_db()
    
    await db.dismissed_alerts.update_one(
        {"alert_id": alert_id},
        {
            "$set": {
                "alert_id": alert_id,
                "dismissed_at": datetime.now(timezone.utc).isoformat(),
                "user_email": user_email
            }
        },
        upsert=True
    )
    
    return {"success": True, "alert_id": alert_id}
