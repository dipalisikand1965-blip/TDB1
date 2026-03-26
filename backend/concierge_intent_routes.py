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

Your task: Detect the most relevant pillar and service category from a pet owner's request.

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
  "pillar": "<pillar_id>",
  "service": "<short service name, max 4 words>",
  "confidence": <number 0-100>,
  "display_text": "<friendly suggestion e.g. 'This sounds like Grooming → Care'>"
}

If confidence < 40, return: {"pillar": null, "service": null, "confidence": 0, "display_text": null}
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

        # Extract JSON from response
        json_match = re.search(r'\{[^{}]+\}', raw_response, re.DOTALL)
        if not json_match:
            return {"pillar": None, "service": None, "confidence": 0, "display_text": None}

        result = json.loads(json_match.group())

        pillar = result.get("pillar")
        service = result.get("service")
        confidence = int(result.get("confidence", 0))
        display_text = result.get("display_text")

        # Validate pillar
        if pillar and pillar not in PILLAR_MAP:
            pillar = None
            confidence = 0

        # Add pillar emoji to display text if we have a valid pillar
        if pillar and display_text:
            emoji = PILLAR_MAP.get(pillar, {}).get("emoji", "")
            if emoji and emoji not in display_text:
                display_text = f"{emoji} {display_text}"

        return {
            "pillar": pillar,
            "service": service,
            "confidence": confidence,
            "display_text": display_text,
            "pillar_label": PILLAR_MAP.get(pillar, {}).get("label") if pillar else None,
        }

    except Exception as e:
        # Silent failure — don't block the user from sending
        return {"pillar": None, "service": None, "confidence": 0, "display_text": None, "error": str(e)}
