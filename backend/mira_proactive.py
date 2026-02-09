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

@router.get("/alerts/{pet_id}")
async def get_proactive_alerts(pet_id: str, user_email: str = None):
    """
    Get all proactive alerts for a pet.
    Returns vaccination, birthday, grooming, and reorder alerts.
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
    
    # NEW: Reorder suggestions based on purchase history
    reorder_alerts = []
    if owner_email:
        reorder_alerts = await check_reorder_suggestions(pet_id, pet_name, owner_email, db)
    
    all_alerts.extend(vaccination_alerts)
    all_alerts.extend(birthday_alerts)
    all_alerts.extend(grooming_alerts)
    all_alerts.extend(reorder_alerts)
    
    # Sort by urgency
    urgency_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    all_alerts.sort(key=lambda x: urgency_order.get(x.get("urgency", "low"), 4))
    
    return {
        "pet_id": pet_id,
        "pet_name": pet_name,
        "alerts": all_alerts,
        "total": len(all_alerts),
        "critical_count": len([a for a in all_alerts if a.get("urgency") == "critical"]),
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
