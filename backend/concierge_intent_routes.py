"""
concierge_intent_routes.py — AI Intent Detection for Mira OS Concierge Tab

Uses Claude claude-4-sonnet-20250514 to detect pillar/service intent from
freeform Concierge text input. Returns instant suggestions before user sends.
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid

concierge_intent_router = APIRouter()

# ── Pillar metadata ─────────────────────────────────────────────────────────
PILLAR_MAP = {
    "dine": {
        "label": "Dine",
        "emoji": "🍽️",
        "description": "Food, nutrition, treats, meal plans",
        "example_services": ["Meal Consultation", "Diet Plan", "Allergy-Safe Treats"],
    },
    "care": {
        "label": "Care",
        "emoji": "🛁",
        "description": "Grooming, vet care, health, wellness",
        "example_services": ["Grooming Session", "Vet Visit", "Vaccination", "Spa Treatment"],
    },
    "go": {
        "label": "Go",
        "emoji": "🐾",
        "description": "Walks, travel, adventures, outdoor activities",
        "example_services": ["Dog Walk", "Adventure Pack", "Travel Planning", "Dog Run"],
    },
    "play": {
        "label": "Play",
        "emoji": "🎾",
        "description": "Toys, games, activities, exercise, stimulation",
        "example_services": ["Playdate", "Toy Subscription", "Agility Class"],
    },
    "learn": {
        "label": "Learn",
        "emoji": "📚",
        "description": "Training, obedience, behaviour, skills",
        "example_services": ["Training Session", "Behaviour Consultation", "Puppy Class"],
    },
    "celebrate": {
        "label": "Celebrate",
        "emoji": "🎂",
        "description": "Birthdays, events, photo shoots, gifts, parties",
        "example_services": ["Birthday Cake", "Photo Shoot", "Party Planning", "Gift Box"],
    },
    "shop": {
        "label": "Shop",
        "emoji": "🛍️",
        "description": "Products, accessories, gear, apparel",
        "example_services": ["Breed Products", "Accessories", "Personalised Gifts"],
    },
    "paperwork": {
        "label": "Paperwork",
        "emoji": "📋",
        "description": "Microchipping, registration, insurance, documents, certificates",
        "example_services": ["Microchip Registration", "Pet Insurance", "Health Certificate"],
    },
    "emergency": {
        "label": "Emergency",
        "emoji": "🚨",
        "description": "Urgent vet care, emergency services, critical situations",
        "example_services": ["Emergency Vet", "24/7 Helpline", "Critical Care"],
    },
    "farewell": {
        "label": "Farewell",
        "emoji": "🕊️",
        "description": "End of life care, cremation, memorial, grief support",
        "example_services": ["Memorial Service", "Cremation", "Grief Support"],
    },
    "adopt": {
        "label": "Adopt",
        "emoji": "🏠",
        "description": "Adoption, rescue, fostering, rehoming",
        "example_services": ["Adoption Counseling", "Rescue Support", "Foster Care"],
    },
    "services": {
        "label": "Concierge Services",
        "emoji": "✨",
        "description": "General concierge requests, premium services",
        "example_services": ["Custom Request", "Premium Package", "VIP Service"],
    },
}

SYSTEM_PROMPT = """You are Mira, The Doggy Company's AI concierge intelligence system.

Your task: Detect the most relevant pillar(s) and service category from a pet owner's request.
A single request may span multiple pillars (e.g. "grooming + vet checkup" → Care twice, or "birthday walk + cake" → Go + Celebrate).

Available pillars and their purposes:
- dine: Food, nutrition, treats, supplements, meal plans, diet
- care: Grooming, vet care, health, wellness, spa, vaccination, checkup  
- go: Walks, travel, outdoor adventures, hiking, dog runs
- play: Toys, games, playdates, activities, exercise, mental stimulation
- learn: Training, obedience, behaviour, puppy classes, skills
- celebrate: Birthdays, parties, photo shoots, gifts, cakes, events
- shop: Products, accessories, gear, apparel, personalised items
- paperwork: Microchipping, registration, insurance, certificates, documents
- emergency: Urgent vet, critical situations, accidents, poison
- farewell: End of life, cremation, memorial, grief support
- adopt: Adoption, rescue, fostering, rehoming

Respond ONLY with a JSON object (no markdown, no explanation):
{
  "pillars": [
    { "pillar": "<pillar_id>", "service": "<short service name, max 4 words>", "confidence": <0-100> },
    { "pillar": "<pillar_id_2>", "service": "<service>", "confidence": <0-100> }
  ],
  "display_text": "<friendly suggestion e.g. '🛁 Grooming → Care + 🏥 Vet Checkup → Care'>",
  "primary_pillar": "<most confident pillar_id>"
}

Return up to 3 pillars sorted by confidence descending.
If no clear intent (all pillars < 40% confidence), return: {"pillars": [], "display_text": null, "primary_pillar": null}
"""


class IntentRequest(BaseModel):
    message: str
    pet_name: Optional[str] = None
    pet_breed: Optional[str] = None


@concierge_intent_router.post("/mira/detect-intent")
async def detect_concierge_intent(body: IntentRequest):
    """
    Detect pillar + service intent from freeform Concierge text.
    Uses Claude claude-4-sonnet-20250514 for fast intent classification.
    """
    if not body.message or len(body.message.strip()) < 5:
        return {"pillar": None, "service": None, "confidence": 0, "display_text": None}

    llm_key = os.environ.get("EMERGENT_LLM_KEY")
    if not llm_key:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        context = f"Pet: {body.pet_name or 'unknown'}"
        if body.pet_breed:
            context += f" ({body.pet_breed})"

        chat = LlmChat(
            api_key=llm_key,
            session_id=f"intent_{uuid.uuid4().hex[:8]}",
            system_message=SYSTEM_PROMPT,
        ).with_model("anthropic", "claude-4-sonnet-20250514")

        user_message = UserMessage(
            text=f"{context}\n\nRequest: {body.message.strip()}"
        )

        raw_response = await chat.send_message(user_message)

        # Parse JSON response
        import json
        import re

        json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        if not json_match:
            return {"pillars": [], "display_text": None, "primary_pillar": None}

        result = json.loads(json_match.group())

        # Validate and clean pillars list
        pillars_raw = result.get("pillars", [])
        # Handle old single-pillar response format for backwards compat
        if not pillars_raw and result.get("pillar"):
            pillars_raw = [{"pillar": result["pillar"], "service": result.get("service", ""), "confidence": result.get("confidence", 0)}]

        valid_pillars = []
        for entry in pillars_raw:
            pillar = entry.get("pillar")
            confidence = int(entry.get("confidence", 0))
            service = entry.get("service", "")
            if pillar and pillar in PILLAR_MAP and confidence >= 40:
                emoji = PILLAR_MAP[pillar].get("emoji", "")
                valid_pillars.append({
                    "pillar": pillar,
                    "service": service,
                    "confidence": confidence,
                    "pillar_label": PILLAR_MAP[pillar]["label"],
                    "emoji": emoji,
                })

        # Sort by confidence descending, cap at 3
        valid_pillars.sort(key=lambda x: x["confidence"], reverse=True)
        valid_pillars = valid_pillars[:3]

        primary = valid_pillars[0]["pillar"] if valid_pillars else None
        display_text = result.get("display_text")

        # Build a smart display_text if not provided
        if not display_text and valid_pillars:
            parts = [f"{p['emoji']} {p['service']} → {p['pillar_label']}" for p in valid_pillars]
            display_text = " + ".join(parts)

        return {
            "pillars": valid_pillars,
            "primary_pillar": primary,
            # Legacy single-pillar fields for backwards compat
            "pillar": primary,
            "service": valid_pillars[0]["service"] if valid_pillars else None,
            "confidence": valid_pillars[0]["confidence"] if valid_pillars else 0,
            "display_text": display_text,
            "pillar_label": valid_pillars[0]["pillar_label"] if valid_pillars else None,
        }

    except Exception as e:
        # Silent failure — don't block the user from sending
        return {"pillar": None, "service": None, "confidence": 0, "display_text": None, "error": str(e)}
