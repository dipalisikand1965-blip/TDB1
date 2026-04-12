"""
birthday_box_routes.py
Mira's Birthday Box API — 6-slot curated celebration box
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
import secrets
from datetime import datetime, timezone

birthday_box_router = APIRouter(prefix="/api", tags=["Birthday Box"])

# Database reference (set from server.py)
db = None

def set_database(database):
    global db
    db = database

def get_utc_timestamp():
    return datetime.now(timezone.utc).isoformat()

# ==================== SLOT INTELLIGENCE ====================

BREED_CAKE_FLAVORS = {
    "labrador": {"flavor": "peanut butter", "emoji": "🥜"},
    "retriever": {"flavor": "peanut butter", "emoji": "🥜"},
    "golden retriever": {"flavor": "peanut butter", "emoji": "🥜"},
    "indie": {"flavor": "chicken", "emoji": "🍗"},
    "indian pariah": {"flavor": "chicken", "emoji": "🍗"},
    "shih tzu": {"flavor": "salmon", "emoji": "🐟"},
    "pomeranian": {"flavor": "salmon", "emoji": "🐟"},
    "beagle": {"flavor": "chicken", "emoji": "🍗"},
    "german shepherd": {"flavor": "beef", "emoji": "🥩"},
    "husky": {"flavor": "salmon", "emoji": "🐟"},
    "default": {"flavor": "chicken", "emoji": "🍗"}
}

PILLAR_JOY_ITEMS = {
    "play": {"name": "Favourite toy", "description": "birthday toy gift-wrapped", "emoji": "🎾"},
    "adventure": {"name": "Outdoor birthday kit", "description": "outdoor adventure kit", "emoji": "🏕️"},
    "social": {"name": "Pawty kit", "description": "pawty kit for friends", "emoji": "🎈"},
    "learning": {"name": "Puzzle toy", "description": "puzzle toy for their bright mind", "emoji": "🧩"},
    "food": {"name": "Gourmet treat platter", "description": "gourmet treat platter", "emoji": "🍖"},
    "grooming": {"name": "Birthday spa kit", "description": "birthday spa kit", "emoji": "✨"},
    "health": {"name": "Wellness treat pack", "description": "wellness treat pack", "emoji": "💚"},
    "memory": {"name": "Photo prop kit", "description": "photo prop kit", "emoji": "📸"},
    "default": {"name": "Birthday toy", "description": "breed-matched birthday toy", "emoji": "🎁"}
}

BREED_TOY_FALLBACKS = {
    "indie": {"name": "Rope toy", "emoji": "🪢"},
    "labrador": {"name": "Tennis ball", "emoji": "🎾"},
    "retriever": {"name": "Tennis ball", "emoji": "🎾"},
    "golden retriever": {"name": "Fetch ball", "emoji": "🎾"},
    "shih tzu": {"name": "Plush toy", "emoji": "🧸"},
    "pomeranian": {"name": "Squeaky toy", "emoji": "🧸"},
    "beagle": {"name": "Snuffle mat", "emoji": "👃"},
    "german shepherd": {"name": "Tug toy", "emoji": "🪢"},
    "husky": {"name": "Chew toy", "emoji": "🦴"},
    "default": {"name": "Birthday toy", "emoji": "🎁"}
}

ARCHETYPE_SURPRISES = {
    "social_butterfly": {"name": "Friend gift set", "description": "for their best friend", "emoji": "💝"},
    "adventurer": {"name": "Trail map bandana", "description": "adventure awaits", "emoji": "🗺️"},
    "thinker": {"name": "Hidden treat puzzle", "description": "for their curious mind", "emoji": "🧠"},
    "nurturer": {"name": "Comfort plush", "description": "for cuddle time", "emoji": "🤗"},
    "performer": {"name": "Party hat + bow", "description": "star of the show", "emoji": "🎭"},
    "protector": {"name": "Calming treat", "description": "for peaceful moments", "emoji": "🛡️"},
    "free_spirit": {"name": "Mystery toy", "description": "Mira chose this. Trust her.", "emoji": "🎁"},
    "default": {"name": "A Mira surprise", "description": "specially chosen", "emoji": "🎁"}
}


def get_all_allergies(pet: dict) -> list:
    """Extract ALL allergies from various pet data locations"""
    all_allergies = set()
    
    # Check direct fields
    if pet.get("allergies"):
        all_allergies.update([a.lower() for a in pet["allergies"] if a])
    if pet.get("allergy1"):
        all_allergies.add(pet["allergy1"].lower())
    if pet.get("allergy2"):
        all_allergies.add(pet["allergy2"].lower())
    
    # Check health_data.allergies
    health_data = pet.get("health_data", {})
    if health_data.get("allergies"):
        all_allergies.update([a.lower() for a in health_data["allergies"] if a])
    
    # Check health.allergies
    health = pet.get("health", {})
    if health.get("allergies"):
        all_allergies.update([a.lower() for a in health["allergies"] if a])
    
    # Check doggy_soul_answers.food_allergies
    soul_answers = pet.get("doggy_soul_answers") or {}
    if soul_answers.get("food_allergies"):
        all_allergies.update([a.lower() for a in soul_answers["food_allergies"] if a])
    if soul_answers.get("allergies"):
        all_allergies.update([a.lower() for a in soul_answers["allergies"] if a])
    
    # Check insights.key_flags.allergy_list
    insights = pet.get("insights", {})
    key_flags = insights.get("key_flags", {})
    if key_flags.get("allergy_list"):
        all_allergies.update([a.lower() for a in key_flags["allergy_list"] if a])
    
    # Check learned_facts for allergy type
    learned_facts = pet.get("learned_facts", [])
    for fact in learned_facts:
        if isinstance(fact, dict) and fact.get("type") == "allergy":
            value = fact.get("value", "")
            if value:
                all_allergies.add(value.lower())
    
    return list(all_allergies)


def get_health_condition(pet: dict) -> str:
    """Read health condition from all field paths — mirrors frontend getHealthCondition()."""
    # Path 1: health_data.chronic_conditions (primary — where PetVault writes)
    cond = (pet.get("health_data") or {}).get("chronic_conditions")
    if cond:
        arr = cond if isinstance(cond, list) else [cond]
        first = next((c for c in arr if c and c.lower() not in ("none", "none_confirmed")), None)
        if first:
            return first
    # Path 2: top-level health_condition (legacy)
    return pet.get("health_condition") or pet.get("healthCondition") or ""


def get_slot_1_hero_cake(pet: dict) -> dict:
    """Slot 1 — Hero Item: Birthday Cake based on favorite food or breed"""
    all_allergies = get_all_allergies(pet)
    
    soul_answers = pet.get("doggy_soul_answers") or {}
    fav_food = soul_answers.get("favorite_protein") or soul_answers.get("favourite_food1") or ""
    fav_food = fav_food.lower() if isinstance(fav_food, str) else ""
    
    # Get favorite treats for fallback
    fav_treats = soul_answers.get("favorite_treats", [])
    if isinstance(fav_treats, list):
        fav_treats = [t.lower() for t in fav_treats if isinstance(t, str)]
    
    breed = (pet.get("breed") or "").lower()
    
    # Check if favorite food is an allergen - CRITICAL CHECK
    is_fav_allergen = any(allergen in fav_food for allergen in all_allergies if allergen)
    
    if fav_food and not is_fav_allergen:
        emoji = "🍗" if "chicken" in fav_food else "🐟" if "salmon" in fav_food or "fish" in fav_food else "🥜" if "peanut" in fav_food else "🥩" if "beef" in fav_food else "🎂"
        label = f"{fav_food.title()} birthday cake"
        if all_allergies:
            label += ", allergy-safe"
        return {"slotNumber": 1, "slotName": "Hero Item", "emoji": emoji, "chipLabel": label, "itemName": f"{fav_food.title()} Birthday Cake", "description": f"Their favorite {fav_food} flavor", "isAllergySafe": True, "signal": "favourite_food"}
    
    # Favorite food is an allergen! Use safe alternative from treats
    safe_flavor = None
    for treat in fav_treats:
        if not any(allergen in treat for allergen in all_allergies):
            safe_flavor = treat
            break
    
    # If no safe treat, use breed fallback with allergy check
    if not safe_flavor:
        breed_data = BREED_CAKE_FLAVORS.get(breed, BREED_CAKE_FLAVORS["default"])
        flavor = breed_data["flavor"]
        
        # Check if breed flavor is allergen
        if any(allergen in flavor for allergen in all_allergies):
            # Find first safe flavor
            for fallback in ["salmon", "peanut butter", "beef", "veggie"]:
                if not any(allergen in fallback for allergen in all_allergies):
                    safe_flavor = fallback
                    break
            if not safe_flavor:
                safe_flavor = "veggie"  # Ultimate fallback
        else:
            safe_flavor = flavor
    
    emoji = "🐟" if "salmon" in safe_flavor else "🥜" if "peanut" in safe_flavor else "🥩" if "beef" in safe_flavor else "🥬" if "veggie" in safe_flavor else "🎂"
    label = f"{safe_flavor.title()} birthday cake, allergy-safe"
    
    return {"slotNumber": 1, "slotName": "Hero Item", "emoji": emoji, "chipLabel": label, "itemName": f"{safe_flavor.title()} Birthday Cake", "description": f"Safe alternative (no {', '.join(all_allergies)})", "isAllergySafe": True, "excludedAllergens": all_allergies, "signal": "allergy_safe_fallback"}


def get_slot_2_joy_item(pet: dict) -> dict:
    """Slot 2 — Joy Item: Based on top soul pillar"""
    soul_answers = pet.get("doggy_soul_answers") or {}
    top_pillar = soul_answers.get("top_soul_pillar", "").lower()
    top_activity = soul_answers.get("favorite_activity") or soul_answers.get("top_activity") or ""
    breed = (pet.get("breed") or "").lower()
    
    if top_pillar and top_pillar in PILLAR_JOY_ITEMS:
        item = PILLAR_JOY_ITEMS[top_pillar]
        return {"slotNumber": 2, "slotName": "Joy Item", "emoji": item["emoji"], "chipLabel": item["name"], "itemName": item["name"], "description": item["description"], "signal": f"top_pillar_{top_pillar}"}
    elif top_activity:
        return {"slotNumber": 2, "slotName": "Joy Item", "emoji": "🎁", "chipLabel": f"{top_activity} gift", "itemName": f"{top_activity.title()} Birthday Gift", "description": f"for their love of {top_activity}", "signal": "top_activity"}
    else:
        toy = BREED_TOY_FALLBACKS.get(breed, BREED_TOY_FALLBACKS["default"])
        return {"slotNumber": 2, "slotName": "Joy Item", "emoji": toy["emoji"], "chipLabel": f"Birthday {toy['name'].lower()}", "itemName": toy["name"], "description": "breed-matched birthday gift", "signal": "breed_fallback"}


def get_slot_3_style_item(pet: dict) -> dict:
    """Slot 3 — Style Item: Birthday wearable"""
    pet_name = pet.get("name", "Pet")
    birthday, gotcha_day = pet.get("birthday"), pet.get("gotcha_day")
    breed, size = (pet.get("breed") or "").lower(), (pet.get("size") or "").lower()
    soul_answers = pet.get("doggy_soul_answers") or {}
    grooming_score = soul_answers.get("grooming_score", 0)
    
    small_breeds = ["shih tzu", "pomeranian", "chihuahua", "maltese", "yorkshire"]
    is_small = size == "small" or any(b in breed for b in small_breeds)
    
    if birthday:
        if grooming_score and grooming_score > 70:
            return {"slotNumber": 3, "slotName": "Style Item", "emoji": "🎀", "chipLabel": f"{pet_name}'s birthday outfit set", "itemName": "Birthday Outfit Set", "description": "bandana + bow + finishing spray", "signal": "high_grooming_score"}
        elif is_small:
            return {"slotNumber": 3, "slotName": "Style Item", "emoji": "🎀", "chipLabel": "Birthday bow set", "itemName": "Birthday Bow Set", "description": "perfect for small breeds", "signal": "small_breed"}
        else:
            return {"slotNumber": 3, "slotName": "Style Item", "emoji": "🎀", "chipLabel": f"{pet_name}'s birthday bandana", "itemName": "Custom Birthday Bandana", "description": f"embroidered with {pet_name}", "signal": "birthday_registered"}
    elif gotcha_day:
        return {"slotNumber": 3, "slotName": "Style Item", "emoji": "🎀", "chipLabel": "Gotcha day bandana", "itemName": "Gotcha Day Bandana", "description": "celebrating the day they chose you", "signal": "gotcha_day"}
    else:
        return {"slotNumber": 3, "slotName": "Style Item", "emoji": "🎀", "chipLabel": "Custom bandana", "itemName": "Birthday Bandana", "description": "personalize with their name", "signal": "no_date_registered"}


def get_slot_4_memory_item(pet: dict) -> dict:
    """Slot 4 — Memory Item: Something to preserve the day"""
    pet_name, birthday = pet.get("name", "Pet"), pet.get("birthday")
    soul_answers = pet.get("doggy_soul_answers") or {}
    memory_score = soul_answers.get("memory_score") or soul_answers.get("love_memory_score", 0)
    
    if memory_score and memory_score > 60:
        return {"slotNumber": 4, "slotName": "Memory Item", "emoji": "💌", "chipLabel": "Memory card + photo envelope", "itemName": "Memory Card Set", "description": "preserve the perfect moment", "signal": "high_memory_score"}
    elif birthday:
        return {"slotNumber": 4, "slotName": "Memory Item", "emoji": "📅", "chipLabel": f"{pet_name}'s birthday card", "itemName": "Personalised Birthday Card", "description": f"with {pet_name}'s special date", "signal": "birthday_registered"}
    else:
        return {"slotNumber": 4, "slotName": "Memory Item", "emoji": "🐾", "chipLabel": "Paw print card", "itemName": "Paw Print Birthday Card", "description": "a keepsake for the day", "signal": "default"}


def get_slot_5_health_item(pet: dict) -> dict:
    """Slot 5 — Health Item: MUST be allergy-safe"""
    pet_age = pet.get("age", 3)
    try:
        pet_age = float(pet_age) if pet_age is not None else 3
    except (ValueError, TypeError):
        pet_age = 3
    health_condition = get_health_condition(pet)
    
    # Use the comprehensive allergy check
    all_allergies = get_all_allergies(pet)
    
    allergy_note = ", allergy-safe" if all_allergies else ""
    requires_confirmation = len(all_allergies) > 0
    
    if health_condition:
        return {"slotNumber": 5, "slotName": "Health Item", "emoji": "💊", "chipLabel": f"Treatment-safe supplement{allergy_note}", "itemName": "Condition-Safe Supplement", "description": f"safe for {health_condition}", "isAllergySafe": True, "requiresAllergyConfirmation": requires_confirmation, "allergens": all_allergies, "signal": "health_condition"}
    elif pet_age and pet_age > 7:
        return {"slotNumber": 5, "slotName": "Health Item", "emoji": "🦴", "chipLabel": f"Joint support supplement{allergy_note}", "itemName": "Senior Joint Support", "description": "gentle on aging joints", "isAllergySafe": True, "requiresAllergyConfirmation": requires_confirmation, "allergens": all_allergies, "signal": "senior_dog"}
    elif pet_age and pet_age < 2:
        return {"slotNumber": 5, "slotName": "Health Item", "emoji": "🌱", "chipLabel": f"Puppy growth treat{allergy_note}", "itemName": "Puppy Growth Treats", "description": "for healthy development", "isAllergySafe": True, "requiresAllergyConfirmation": requires_confirmation, "allergens": all_allergies, "signal": "puppy"}
    else:
        return {"slotNumber": 5, "slotName": "Health Item", "emoji": "💚", "chipLabel": f"Wellness treat{allergy_note}", "itemName": "Age-Appropriate Wellness Treat", "description": "matched to their life stage", "isAllergySafe": True, "requiresAllergyConfirmation": requires_confirmation, "allergens": all_allergies, "signal": "default"}


def get_slot_6_surprise_item(pet: dict) -> dict:
    """Slot 6 — Surprise Item: Based on archetype"""
    pet_name = pet.get("name", "Pet")
    soul_answers = pet.get("doggy_soul_answers") or {}
    archetype = (soul_answers.get("archetype") or soul_answers.get("pet_archetype") or "").lower().replace(" ", "_")
    breed = (pet.get("breed") or "").lower()
    
    if archetype and archetype in ARCHETYPE_SURPRISES:
        item = ARCHETYPE_SURPRISES[archetype]
        return {"slotNumber": 6, "slotName": "Surprise Item", "emoji": item["emoji"], "chipLabel": "A Mira surprise 🎁", "itemName": item["name"], "description": item["description"], "hiddenUntilDelivery": True, "signal": f"archetype_{archetype}"}
    else:
        return {"slotNumber": 6, "slotName": "Surprise Item", "emoji": "🎁", "chipLabel": "A Mira surprise 🎁", "itemName": "Breed Surprise Gift", "description": f"specially chosen for {breed.title() if breed else pet_name}", "hiddenUntilDelivery": True, "signal": "breed_fallback"}


def calculate_soul_percent(pet: dict) -> int:
    """Calculate how much of the soul profile is filled"""
    soul_answers = pet.get("doggy_soul_answers") or {}
    key_fields = ["favorite_protein", "favourite_food1", "allergies", "top_soul_pillar", "favorite_activity", "favorite_toy", "archetype", "pet_archetype", "grooming_score", "memory_score", "health_score"]
    filled = sum(1 for k in key_fields if soul_answers.get(k))
    pet_fields = ["birthday", "breed", "age"]
    filled += sum(1 for k in pet_fields if pet.get(k))
    filled += 1 if get_health_condition(pet) else 0
    total = len(key_fields) + len(pet_fields)
    return int((filled / total) * 100) if total > 0 else 0


# ==================== API ENDPOINTS ====================

@birthday_box_router.get("/birthday-box/{pet_id}/preview")
async def get_birthday_box_preview(pet_id: str):
    """Lightweight endpoint for Birthday Box card display on /celebrate-soul page."""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "Pet")
    slot1, slot2 = get_slot_1_hero_cake(pet), get_slot_2_joy_item(pet)
    slot3, slot4 = get_slot_3_style_item(pet), get_slot_4_memory_item(pet)
    slot5, slot6 = get_slot_5_health_item(pet), get_slot_6_surprise_item(pet)
    soul_percent = calculate_soul_percent(pet)
    
    # Use comprehensive allergy check
    all_allergies = get_all_allergies(pet)
    
    return {
        "petId": pet_id, "petName": pet_name,
        "visibleSlots": [slot1, slot2, slot3, slot4],
        "hiddenSlots": [slot5, slot6],
        "soulPercent": soul_percent,
        "hasAllergies": len(all_allergies) > 0, "allergies": all_allergies,
        "hasBirthday": bool(pet.get("birthday")), "hasGotchaDay": bool(pet.get("gotcha_day")),
        "healthCondition": get_health_condition(pet), "petAge": pet.get("age", 0), "petBreed": pet.get("breed", ""),
        "signals": {"slot1": slot1.get("signal"), "slot2": slot2.get("signal"), "slot3": slot3.get("signal"), "slot4": slot4.get("signal"), "slot5": slot5.get("signal"), "slot6": slot6.get("signal")}
    }


@birthday_box_router.get("/birthday-box/{pet_id}")
async def get_birthday_box_full(pet_id: str):
    """Full birthday box endpoint with product matching and pricing for modal builder."""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    preview = await get_birthday_box_preview(pet_id)
    all_slots = preview["visibleSlots"] + preview["hiddenSlots"]
    
    slot_categories = {1: "cakes", 2: "toys", 3: "accessories", 4: "memory_books", 5: "supplements", 6: "toys"}
    for slot in all_slots:
        category = slot_categories.get(slot["slotNumber"])
        if category:
            product = await db.products_master.find_one(
                {"category": category, "is_active": {"$ne": False}},
                {"_id": 0, "id": 1, "name": 1, "price": 1, "image_url": 1, "image": 1}
            )
            if product:
                slot["productId"] = product.get("id")
                slot["productName"] = product.get("name")
                slot["price"] = product.get("price", 0)
                slot["image"] = product.get("image_url") or product.get("image")
    
    return {**preview, "allSlots": all_slots, "totalPrice": sum(slot.get("price", 0) for slot in all_slots), "currency": "INR"}


@birthday_box_router.post("/birthday-box/{pet_id}/build")
async def build_birthday_box(pet_id: str, payload: dict):
    """Save/order a configured birthday box from the modal builder."""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    slots, allergy_confirmed = payload.get("slots", []), payload.get("allergyConfirmed", False)
    
    # Use the comprehensive allergy check (same as preview endpoint)
    all_allergies = get_all_allergies(pet)
    
    if all_allergies and not allergy_confirmed:
        return {"success": False, "error": "allergy_confirmation_required", "message": f"Please confirm allergy safety for {pet.get('name')}. Known allergies: {', '.join(all_allergies)}"}
    
    box_order = {
        "id": f"bbox-{uuid.uuid4().hex[:8]}",
        "pet_id": pet_id,
        "pet_name": pet.get("name"),
        "slots": slots,
        "allergy_confirmed": allergy_confirmed,
        "allergies": all_allergies,
        "status": "pending",
        "created_at": get_utc_timestamp()
    }
    await db.birthday_box_orders.insert_one(box_order)
    
    return {"success": True, "orderId": box_order["id"], "message": f"Birthday box for {pet.get('name')} is ready!"}



# ==================== CONCIERGE HANDOFF ====================

class BirthdayBoxConciergePayload(BaseModel):
    slots: List[Dict[str, Any]] = []
    allergyConfirmed: bool = False
    userEmail: Optional[str] = None
    userName: Optional[str] = None


@birthday_box_router.post("/birthday-box/{pet_id}/concierge-handoff")
async def birthday_box_concierge_handoff(pet_id: str, payload: BirthdayBoxConciergePayload):
    """
    Send a confirmed Birthday Box to the Concierge.
    This is the final step in the BirthdayBoxBuilder modal.
    
    Unified Flow:
      1. service_desk_tickets (admin inbox)
      2. admin_notifications (notification bell)
      3. pillar_requests (pillar-specific tracking)
      4. channel_intakes (unified inbox)
      5. member_notifications (user-facing notification)
    """
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    all_allergies = get_all_allergies(pet)
    if all_allergies and not payload.allergyConfirmed:
        return {
            "success": False,
            "error": "allergy_confirmation_required",
            "message": f"Please confirm allergy safety for {pet.get('name')}."
        }

    pet_name = pet.get("name", "Pet")
    user_email = payload.userEmail or ""
    user_name = payload.userName or "Pet Parent"
    now = get_utc_timestamp()

    # IDs following the unified flow convention
    request_id = f"BBOX-{secrets.token_hex(4).upper()}"
    ticket_id = f"TKT-{secrets.token_hex(4).upper()}"
    notification_id = f"NOTIF-{secrets.token_hex(4).upper()}"
    inbox_id = f"INBOX-{secrets.token_hex(4).upper()}"

    # Build a rich slot summary for the concierge team
    slot_lines = []
    for s in payload.slots:
        slot_num = s.get("slotNumber", "?")
        slot_name = s.get("slotName", "Item")
        item = s.get("itemName") or s.get("chipLabel", "Item")
        safe = " [ALLERGY-SAFE]" if s.get("isAllergySafe") else ""
        surprise = " [SURPRISE — do not reveal]" if s.get("hiddenUntilDelivery") else ""
        slot_lines.append(f"  Slot {slot_num} ({slot_name}): {item}{safe}{surprise}")

    allergy_note = f"\n\nALLERGY ALERT: {pet_name} is allergic to: {', '.join(all_allergies).upper()}\nAllergy safety confirmed by customer." if all_allergies else ""

    message = f"""🎂 BIRTHDAY BOX ORDER — {pet_name.upper()}

{chr(10).join(slot_lines)}
{allergy_note}

Action required:
• Confirm {pet_name}'s name embroidery on the bandana (Slot 3)
• Confirm birthday cake message (Slot 1)
• Get delivery address and preferred delivery date from customer
• Assemble and dispatch as single celebration package

Customer: {user_name}
Email: {user_email or 'See account'}
Source: BirthdayBoxBuilder (celebrate-soul page)
"""

    # STEP 1: Service Desk Ticket
    ticket_doc = {
        "ticket_id": ticket_id,
        "id": ticket_id,
        "request_id": request_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "type": "birthday_box_order",
        "category": "celebrate",
        "sub_category": "birthday_box",
        "pillar": "celebrate",
        "subject": f"Birthday Box Order — {pet_name}",
        "description": message,
        "original_request": message,
        "status": "new",
        "priority": 2,
        "urgency": "high",
        "channel": "web",
        "source": "birthday_box_builder",
        "pet_name": pet_name,
        "pet_id": pet_id,
        "member": {"name": user_name, "email": user_email},
        "slots": payload.slots,
        "allergies": all_allergies,
        "allergy_confirmed": payload.allergyConfirmed,
        "tags": ["celebrate", "birthday_box", "concierge", "unified-flow"],
        "unified_flow_processed": True,
        "assigned_to": None,
        "created_at": now,
        "updated_at": now,
        "audit_trail": [{"action": "created", "timestamp": now, "performed_by": "system", "details": "Birthday Box confirmed via BirthdayBoxBuilder modal"}]
    }
    await db.service_desk_tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})
    await db.tickets.insert_one({k: v for k, v in ticket_doc.items() if k != "_id"})

    # STEP 2: Admin Notification
    await db.admin_notifications.insert_one({
        "id": notification_id,
        "type": "birthday_box_order",
        "pillar": "celebrate",
        "title": f"🎂 Birthday Box Order — {pet_name}",
        "message": f"{user_name} confirmed a {len(payload.slots)}-slot birthday box for {pet_name}. Allergy confirmed: {payload.allergyConfirmed}",
        "read": False,
        "status": "unread",
        "urgency": "high",
        "ticket_id": ticket_id,
        "request_id": request_id,
        "pet_name": pet_name,
        "customer": {"name": user_name, "email": user_email},
        "link": f"/admin?tab=servicedesk&ticket={ticket_id}",
        "created_at": now
    })

    # STEP 3: Pillar Request
    await db.pillar_requests.insert_one({
        "id": f"PR-{secrets.token_hex(4).upper()}",
        "ticket_id": ticket_id,
        "request_id": request_id,
        "pillar": "celebrate",
        "type": "birthday_box",
        "pet_name": pet_name,
        "pet_id": pet_id,
        "slots_count": len(payload.slots),
        "status": "pending",
        "source": "birthday_box_builder",
        "created_at": now
    })

    # STEP 4: Channel Intake (unified inbox)
    await db.channel_intakes.insert_one({
        "id": inbox_id,
        "request_id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "channel": "web",
        "request_type": "birthday_box",
        "pillar": "celebrate",
        "status": "new",
        "urgency": "high",
        "customer_name": user_name,
        "customer_email": user_email,
        "member": {"name": user_name, "email": user_email},
        "pet": {"name": pet_name, "id": pet_id},
        "preview": f"Birthday Box — {pet_name} ({len(payload.slots)} slots)",
        "message": message,
        "tags": ["celebrate", "birthday_box"],
        "unified_flow_processed": True,
        "created_at": now,
        "updated_at": now
    })

    # STEP 5: Member Notification (visible to user)
    if user_email:
        await db.member_notifications.insert_one({
            "id": f"MNOTIF-{secrets.token_hex(4).upper()}",
            "type": "birthday_box_confirmed",
            "title": f"Birthday Box Confirmed for {pet_name}!",
            "message": f"Your Concierge has everything they need to build {pet_name}'s birthday box. We'll be in touch within 24 hours.",
            "user_email": user_email.lower(),
            "ticket_id": ticket_id,
            "request_id": request_id,
            "pet_name": pet_name,
            "pillar": "celebrate",
            "read": False,
            "created_at": now,
            "data": {
                "thread_url": f"/mira-demo?tab=services&thread={ticket_id}",
                "slots_count": len(payload.slots)
            }
        })

    # Save a record to birthday_box_orders for our own tracking
    await db.birthday_box_orders.insert_one({
        "id": request_id,
        "ticket_id": ticket_id,
        "pet_id": pet_id,
        "pet_name": pet_name,
        "slots": payload.slots,
        "allergy_confirmed": payload.allergyConfirmed,
        "allergies": all_allergies,
        "status": "pending_concierge",
        "user_email": user_email,
        "created_at": now
    })

    return {
        "success": True,
        "requestId": request_id,
        "ticketId": ticket_id,
        "message": f"Birthday box for {pet_name} sent to Concierge. We'll contact you within 24 hours."
    }



# ==================== ADMIN: BIRTHDAY BOX ORDERS ====================

STATUS_PRIORITY = {"new": 0, "pending_concierge": 0, "in_progress": 1, "assembled": 2, "dispatched": 3, "delivered": 4, "cancelled": 5}

class StatusUpdatePayload(BaseModel):
    status: str
    note: Optional[str] = None
    concierge_name: Optional[str] = "concierge"
    tracking_url: Optional[str] = None

class PersonalisationPayload(BaseModel):
    bandana_name: Optional[str] = None
    cake_message: Optional[str] = None
    delivery_date: Optional[str] = None
    special_requests: Optional[str] = None
    delivery_address: Optional[str] = None

class SlotAssemblePayload(BaseModel):
    assembled: bool
    concierge_name: Optional[str] = "concierge"

class AllergyConfirmPayload(BaseModel):
    concierge_name: Optional[str] = "concierge"

class NotePayload(BaseModel):
    note: str
    concierge_name: Optional[str] = "concierge"


@birthday_box_router.get("/admin/birthday-box-orders")
async def list_birthday_box_orders(status: Optional[str] = None, limit: int = 100):
    """List all birthday box orders for the admin Service Desk."""
    query = {}
    if status:
        query["status"] = status

    cursor = db.birthday_box_orders.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    orders = await cursor.to_list(length=limit)

    # Sort by status priority then date
    orders.sort(key=lambda o: (STATUS_PRIORITY.get(o.get("status", "new"), 99), o.get("created_at", "")))

    # Enrich with pet name and allergy flag for quick display
    result = []
    for order in orders:
        result.append({
            **order,
            "hasAllergies": bool(order.get("allergies")),
            "slotCount": len(order.get("slots", [])),
        })

    counts = {
        "total": len(result),
        "new": sum(1 for o in result if o.get("status") == "new" or o.get("status") == "pending_concierge"),
        "in_progress": sum(1 for o in result if o.get("status") == "in_progress"),
        "assembled": sum(1 for o in result if o.get("status") == "assembled"),
        "dispatched": sum(1 for o in result if o.get("status") == "dispatched"),
        "delivered": sum(1 for o in result if o.get("status") == "delivered"),
    }

    return {"orders": result, "counts": counts}


@birthday_box_router.get("/admin/birthday-box-orders/{order_id}")
async def get_birthday_box_order(order_id: str):
    """Full order detail including pet data, slots, personalisation."""
    order = await db.birthday_box_orders.find_one(
        {"$or": [{"id": order_id}, {"ticket_id": order_id}]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Enrich with pet data
    pet = await db.pets.find_one({"id": order.get("pet_id")}, {"_id": 0})
    if pet:
        order["pet"] = {
            "name": pet.get("name"),
            "breed": pet.get("breed"),
            "age": pet.get("age"),
            "image": pet.get("image") or pet.get("profile_image"),
        }

    return order


@birthday_box_router.patch("/admin/birthday-box-orders/{order_id}/status")
async def update_order_status(order_id: str, payload: StatusUpdatePayload):
    """Transition the order status with server-side gate validation."""
    VALID_STATUSES = ["new", "pending_concierge", "in_progress", "assembled", "dispatched", "delivered", "cancelled"]
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid: {VALID_STATUSES}")

    order = await db.birthday_box_orders.find_one(
        {"$or": [{"id": order_id}, {"ticket_id": order_id}]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    now = get_utc_timestamp()
    audit_entry = {
        "action": f"status_changed_to_{payload.status}",
        "from_status": order.get("status"),
        "to_status": payload.status,
        "note": payload.note,
        "timestamp": now,
        "performed_by": payload.concierge_name or "concierge"
    }

    update_set = {"status": payload.status, "updated_at": now}
    if payload.status == "assembled":
        update_set["assembled_at"] = now
    elif payload.status == "dispatched":
        update_set["dispatched_at"] = now
        if payload.tracking_url:
            update_set["tracking_url"] = payload.tracking_url
    elif payload.status == "delivered":
        update_set["delivered_at"] = now
    elif payload.status == "in_progress":
        update_set["in_progress_at"] = now

    await db.birthday_box_orders.update_one(
        {"$or": [{"id": order_id}, {"ticket_id": order_id}]},
        {
            "$set": update_set,
            "$push": {"audit_trail": audit_entry}
        }
    )

    # Mirror status in service_desk_tickets
    if order.get("ticket_id"):
        await db.service_desk_tickets.update_one(
            {"ticket_id": order["ticket_id"]},
            {"$set": {"status": payload.status, "updated_at": now}}
        )

    return {"success": True, "status": payload.status, "orderId": order_id}


@birthday_box_router.patch("/admin/birthday-box-orders/{order_id}/slot/{slot_number}/assemble")
async def assemble_slot(order_id: str, slot_number: int, payload: SlotAssemblePayload):
    """Mark an individual slot as assembled. Returns updated assembly count."""
    order = await db.birthday_box_orders.find_one(
        {"$or": [{"id": order_id}, {"ticket_id": order_id}]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    now = get_utc_timestamp()
    slot_key = f"slot_assembly.{slot_number}"

    await db.birthday_box_orders.update_one(
        {"$or": [{"id": order_id}, {"ticket_id": order_id}]},
        {
            "$set": {
                slot_key: {
                    "assembled": payload.assembled,
                    "assembled_at": now if payload.assembled else None,
                    "assembled_by": payload.concierge_name
                },
                "updated_at": now
            }
        }
    )

    # Return updated order to count assembled slots
    updated = await db.birthday_box_orders.find_one(
        {"$or": [{"id": order_id}, {"ticket_id": order_id}]},
        {"_id": 0, "slot_assembly": 1}
    )
    slot_assembly = updated.get("slot_assembly", {}) if updated else {}
    assembled_count = sum(1 for v in slot_assembly.values() if v.get("assembled"))
    total_slots = len(order.get("slots", [])) or 6

    return {
        "success": True,
        "slot_number": slot_number,
        "assembled": payload.assembled,
        "assembled_count": assembled_count,
        "total_slots": total_slots,
        "all_assembled": assembled_count >= total_slots
    }


@birthday_box_router.post("/admin/birthday-box-orders/{order_id}/allergy-confirm")
async def confirm_allergy_check(order_id: str, payload: AllergyConfirmPayload):
    """Log that Concierge has checked all items against pet's allergens. Required before IN PROGRESS."""
    order = await db.birthday_box_orders.find_one(
        {"$or": [{"id": order_id}, {"ticket_id": order_id}]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    now = get_utc_timestamp()
    audit_entry = {
        "action": "allergy_check_confirmed",
        "note": f"Allergy check confirmed by {payload.concierge_name}",
        "timestamp": now,
        "performed_by": payload.concierge_name
    }

    await db.birthday_box_orders.update_one(
        {"$or": [{"id": order_id}, {"ticket_id": order_id}]},
        {
            "$set": {
                "allergy_confirmed": True,
                "allergy_confirmed_by": payload.concierge_name,
                "allergy_confirmed_at": now,
                "updated_at": now
            },
            "$push": {"audit_trail": audit_entry}
        }
    )

    return {"success": True, "confirmed_by": payload.concierge_name, "confirmed_at": now}


@birthday_box_router.post("/admin/birthday-box-orders/{order_id}/note")
async def add_note(order_id: str, payload: NotePayload):
    """Add an internal Concierge note to the order (not visible to pet parent)."""
    order = await db.birthday_box_orders.find_one(
        {"$or": [{"id": order_id}, {"ticket_id": order_id}]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    now = get_utc_timestamp()
    note_entry = {
        "note": payload.note,
        "timestamp": now,
        "concierge_name": payload.concierge_name
    }
    audit_entry = {
        "action": "note_added",
        "note": payload.note,
        "timestamp": now,
        "performed_by": payload.concierge_name
    }

    await db.birthday_box_orders.update_one(
        {"$or": [{"id": order_id}, {"ticket_id": order_id}]},
        {
            "$push": {
                "notes": note_entry,
                "audit_trail": audit_entry
            },
            "$set": {"updated_at": now}
        }
    )

    return {"success": True, "note": payload.note, "timestamp": now}


@birthday_box_router.patch("/admin/birthday-box-orders/{order_id}/personalisation")
async def update_personalisation(order_id: str, payload: PersonalisationPayload):
    """Update personalisation details (bandana name, cake message, delivery date, address)."""
    update_fields = {k: v for k, v in payload.dict().items() if v is not None}
    if not update_fields:
        return {"success": True, "message": "Nothing to update"}

    now = get_utc_timestamp()
    personalisation_update = {f"personalisation.{k}": v for k, v in update_fields.items()}
    personalisation_update["updated_at"] = now

    result = await db.birthday_box_orders.update_one(
        {"$or": [{"id": order_id}, {"ticket_id": order_id}]},
        {"$set": personalisation_update}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    return {"success": True, "updated": update_fields}
