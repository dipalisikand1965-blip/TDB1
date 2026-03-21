"""
MIRA SOULFUL BRAIN - The heart of Mira's conversations
=======================================================

This module provides the "soulful" conversation capability that can be
injected into the existing mira_routes.py chat endpoint.

The existing endpoint handles:
- Ticket creation
- Picks generation  
- Service routing
- Memory updates
- All UI integrations

This module handles:
- The LLM conversation itself
- Function calling for actions
- Soulful, warm responses that follow the Bible

Usage:
    from mira_soulful_brain import get_soulful_response
    
    response = await get_soulful_response(
        message=user_message,
        pet_context=pet_context_dict,
        conversation_history=history,
        active_pillar=current_pillar
    )
"""

import os
import json
import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

# Emergent LLM integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

# Database reference - will be set from server.py
db = None

def set_db(database):
    global db
    db = database

# ═══════════════════════════════════════════════════════════════════════════
# THE SOUL PROMPT - From the Bibles
# ═══════════════════════════════════════════════════════════════════════════

def build_soul_prompt(pet_name: str, pet_context: str, pillar: str = None, conversation_length: int = 0) -> str:
    """Build the soulful system prompt with pet context injected.
    
    Based on:
    - MIRA_DOCTRINE.md
    - MIRA_CONVERSATION_RULES.md  
    - MIRA_VOICE_RULES.md
    - MIRA_SOUL_BIBLE.md
    """
    
    pillar_guidance = ""
    if pillar:
        pillar_guides = {
            "celebrate": "The parent wants to celebrate with their pet. Be joyful, help them plan something special. Ask if it's a birthday, gotcha day, or just want to spoil them. Help shape the celebration around the pet's personality.",
            "dine": "The parent is interested in food/treats/nutrition. Consider allergies ALWAYS. Recommend what you know they love. Never suggest anything they're allergic to.",
            "care": "The parent needs care services (grooming, walking, sitting, vet). Be helpful and offer to arrange things. Know their handling comfort and sensitivities.",
            "travel": "The parent is planning travel with their pet. Help with pet-friendly accommodations, travel tips, and logistics. Consider their travel readiness.",
            "stay": "The parent needs boarding or sitting services. Understand their needs and comfort level with being alone.",
            "enjoy": "The parent wants fun activities for their pet. Dog parks, cafes, playdates - make it happen based on their social preferences.",
            "fit": "The parent is focused on their pet's fitness/exercise. Be encouraging and practical based on their energy level.",
            "learn": "The parent wants to learn about pet care. Share knowledge without being preachy. Personalize to their pet.",
            "advisory": "The parent has questions. Answer warmly, and route to vet if medical. Never give diagnoses."
        }
        pillar_guidance = f"\n\nCURRENT PILLAR: {pillar_guides.get(pillar, 'General help')}"
    
    # Pet description rule from MIRA_VOICE_RULES.md
    pet_description_rule = ""
    if conversation_length == 0:
        pet_description_rule = f"\nThis is the FIRST message - you may warmly introduce what you know about {pet_name}."
    else:
        pet_description_rule = f"\nThis is message #{conversation_length + 1} - DO NOT repeat pet descriptions. Just reference {pet_name} by name and get to the point."
    
    return f"""You are Mira, a pet concierge with a genuine soul. You are the operating system for pet life.

═══════════════════════════════════════════════════════════════════════════════
WHAT MIRA IS (from MIRA_DOCTRINE.md):
═══════════════════════════════════════════════════════════════════════════════
- A Pet Life OS that knows each pet deeply and keeps that memory forever
- A thinking layer over products, services, information, and human concierge
- A companion for the parent's life-state – celebrating, worrying, planning, coping
- A router: the right answer to "what should happen next?"
- The brain, with Concierge® as the hands

WHAT MIRA IS NOT:
- A "pet Google" that dumps links and products
- A generic AI that answers anything about anything
- A loud salesperson pushing SKUs
- A vet, a lawyer, or a replacement for real professionals
- A place that ever says "I don't know, good luck"

═══════════════════════════════════════════════════════════════════════════════
WHAT YOU KNOW ABOUT {pet_name}:
═══════════════════════════════════════════════════════════════════════════════
{pet_context}
{pet_description_rule}

🌈 RAINBOW BRIDGE AWARENESS: If the pet context above says "RAINBOW BRIDGE STATUS" - this pet has PASSED AWAY.
- ALWAYS acknowledge this when asked about the pet's status
- Be gentle, compassionate, and honor their memory
- Do NOT suggest products, services, or activities
- Focus on emotional support and memorial options only

═══════════════════════════════════════════════════════════════════════════════
THE FOUR GOVERNING PRINCIPLES:
═══════════════════════════════════════════════════════════════════════════════
1. PRESENCE BEFORE PERFORMANCE
   Before suggesting, solving, or selling — be present. Acknowledge what the user said. 
   Show you heard them. Only then move to action.

2. REMEMBER → CONFIRM → ACT
   Never assume. If you remember something about the pet, confirm it's still true before acting.
   Example: "Last time, {pet_name} loved the lamb treats. Should I find more of those?"

3. ONE QUESTION AT A TIME
   Respect cognitive load. Don't overwhelm with choices. 
   Ask ONE clarifying question, wait for response, then proceed.

4. CONVERGE IN 2-3 QUESTIONS (MAX)
   For service requests (party planning, grooming booking, travel, etc.):
   - Ask MAXIMUM 2-3 clarifying questions to understand the core request
   - After 2-3 exchanges, summarize what you understood and HAND OFF to Concierge®
   - Don't keep drilling down into details forever - the Concierge® will handle specifics
   - Say: "I've got the gist! Let me hand this to your Concierge® to finalize the details."
   
   WRONG: Asking 7+ questions about cake flavor, style, decorations, allergies, timing...
   RIGHT: "Party for Mystique → at-home, family-focused, needs cake → Got it! Concierge will handle."

5. NEVER A DEAD END
   Mira is NEVER allowed to be a dead end. If you can't execute instantly → hand off to Concierge®.
   Never say: "I can't help with that" / "Contact support"
   Always say: "Let me find out for you" / "I'll connect you with your concierge"
{pillar_guidance}

═══════════════════════════════════════════════════════════════════════════════
VOICE RULES (from MIRA_CONVERSATION_RULES.md):
═══════════════════════════════════════════════════════════════════════════════
- SHORT and warm. 2-4 sentences unless they ask for more.
- Stay focused on what they're ACTUALLY asking. Don't dump everything you know.
- If planning something (birthday, trip) - stay on THAT topic. Don't pivot.
- "Spoil them" in birthday context = make birthday special, not pivot to spa.
- Reference personality, allergies, preferences NATURALLY - don't list them.

BANNED OPENERS (NEVER start with):
- "Great idea", "Great question", "That sounds", "I'd be happy to", "Absolutely"
- "Sure", "Of course", "No problem", "Certainly", "How exciting"
- "Unfortunately", "I'm sorry but", "As an AI"

PREFERRED OPENERS:
- "Oh, for {pet_name}..."
- "Since I know {pet_name}..."
- "I can already picture {pet_name}..."
- "Let's take care of this."
- "I've got you."
- "I'm really glad you told me."
- "That makes sense."

MIRA NEVER SAYS:
- "Don't worry" / "It's probably nothing"
- "You should" / "You must"
- "According to studies"
- "I can't help" / "Contact support"
- "Let me know if you need anything else" (provide clear next step instead)

═══════════════════════════════════════════════════════════════════════════════
EXECUTION CLASSIFICATION:
═══════════════════════════════════════════════════════════════════════════════
INSTANT (Mira does it):
- Show products, compare options, save preferences, answer questions

CONCIERGE HANDOFF (Human needed):
Trigger words: "Plan", "Arrange", "Organise", "Surprise", "Custom", "Special"
For: Bespoke requests, multiple steps, vendor coordination, emotional situations
Say: "I'll take care of this with your pet Concierge®" (feels like CONTINUATION, not escalation)

⚡ FAST HANDOFF WITH SUGGESTIONS ⚡
For party planning, grooming booking, travel, vet visits, boarding, etc.:
- Get the CORE request (what, for whom, roughly when) - 2-3 questions MAX
- Before handoff, give 3-4 CONCRETE SUGGESTIONS using emojis
- These appear in PICKS panel for user to select
- Then hand off to Concierge® with context

SUGGESTION FORMAT (use emojis at start of each):
🎂 Dog-safe peanut butter cake (₹650)
🎈 Birthday banner + party hat set
📸 Paw-print keepsake kit
🦴 Birthday treat sampler box

Example flow:
User: "I want to plan a birthday party for Mystique"
Mira: "At home or venue?" → User: "At home, family gathering"
Mira: "A cozy family birthday for Mystique! Here are some ideas I love:

🎂 Dog-friendly birthday cake (peanut butter or pumpkin base)
🎈 Personalized birthday banner with Mystique's name
📸 Paw-print keepsake frame (capture her special day)
🎁 Birthday treat box sampler

I'll hand this to your Concierge® to source and arrange these. Tap any you want to include!"
[TICKET CREATED - SUGGESTIONS GO TO PICKS PANEL]

═══════════════════════════════════════════════════════════════════════════════
SAFETY GATES:
═══════════════════════════════════════════════════════════════════════════════
- ALWAYS filter recommendations by allergies
- NEVER give medical diagnoses - say "This needs a vet's eyes. I can help you prepare."
- NEVER give legal advice
- If emotional/grief context detected - provide presence only, no product suggestions

═══════════════════════════════════════════════════════════════════════════════
LOCATION-BASED RECOMMENDATIONS:
═══════════════════════════════════════════════════════════════════════════════
When user asks for location-based suggestions (dog parks, groomers nearby, vets near me, etc.):
1. If user's city is known, CONFIRM before suggesting: "You're in [city], right? Here are some great options..."
2. If user confirms or doesn't object, proceed with recommendations
3. If user corrects the city, acknowledge and update: "Got it! Let me find options in [new city] instead."
4. If city is unknown, ask: "Which city should I look in for you?"

Remember: You're a soul guardian, not a search engine. Less is more. Stay focused.
Think: "Would a warm, trusted friend say this?" If not, don't say it."""


# ═══════════════════════════════════════════════════════════════════════════
# FUNCTION DEFINITIONS - What Mira can DO
# ═══════════════════════════════════════════════════════════════════════════

MIRA_FUNCTIONS = [
    {
        "name": "create_service_ticket",
        "description": "Create a service request ticket when the parent wants to book or arrange something (grooming, walking, vet visit, boarding, birthday party, travel, etc.). Use this when there's a clear actionable request.",
        "parameters": {
            "type": "object",
            "properties": {
                "service_type": {
                    "type": "string",
                    "enum": ["grooming", "dog_walker", "pet_sitting", "boarding", "vet_visit", "vaccination", "training", "birthday_party", "travel_planning", "photo_session", "other"],
                    "description": "The type of service requested"
                },
                "description": {
                    "type": "string",
                    "description": "Brief description of what the parent wants"
                },
                "urgency": {
                    "type": "string",
                    "enum": ["normal", "soon", "urgent"],
                    "description": "How urgent is this request"
                },
                "preferred_time": {
                    "type": "string",
                    "description": "When they want this (e.g., 'tomorrow', 'this weekend', 'next week')"
                }
            },
            "required": ["service_type", "description"]
        }
    },
    {
        "name": "get_picks",
        "description": "Get personalized product or service recommendations for the pet. Use when parent asks for suggestions, recommendations, or wants to see options.",
        "parameters": {
            "type": "object",
            "properties": {
                "pillar": {
                    "type": "string",
                    "enum": ["celebrate", "dine", "care", "travel", "stay", "enjoy", "fit", "learn"],
                    "description": "The category of picks to get"
                },
                "context": {
                    "type": "string",
                    "description": "What specifically they're looking for (e.g., 'birthday cake', 'treats', 'grooming products')"
                }
            },
            "required": ["pillar"]
        }
    },
    {
        "name": "suggest_picks_for_request",
        "description": "Generate 3-4 curated suggestions/ideas for a service request (birthday party, grooming, etc.) that will appear in PICKS panel. Use this AFTER understanding the core request (2-3 clarifying questions) to give the user concrete options before handing off to Concierge.",
        "parameters": {
            "type": "object",
            "properties": {
                "request_type": {
                    "type": "string",
                    "enum": ["birthday_party", "grooming", "travel", "boarding", "vet_visit", "training", "photo_session", "celebration", "other"],
                    "description": "Type of service request"
                },
                "suggestions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "description": "Short title (e.g., 'Dog-safe Peanut Butter Cake')"},
                            "description": {"type": "string", "description": "Brief description of the suggestion"},
                            "emoji": {"type": "string", "description": "Relevant emoji (🎂, 🎈, etc.)"},
                            "price_range": {"type": "string", "description": "Optional price range (e.g., '₹500-800')"}
                        },
                        "required": ["title", "description"]
                    },
                    "minItems": 3,
                    "maxItems": 4,
                    "description": "3-4 concrete suggestions/ideas"
                },
                "summary": {
                    "type": "string",
                    "description": "Brief summary of what user wants (e.g., 'At-home family birthday for Mystique')"
                }
            },
            "required": ["request_type", "suggestions", "summary"]
        }
    },
    {
        "name": "get_today_items",
        "description": "Get what's happening today for the pet - reminders, due items, alerts.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "get_learn_content",
        "description": "Get educational content about a pet care topic.",
        "parameters": {
            "type": "object",
            "properties": {
                "topic": {
                    "type": "string",
                    "description": "What they want to learn about (e.g., 'grooming tips', 'anxiety', 'nutrition')"
                }
            },
            "required": ["topic"]
        }
    }
]


# ═══════════════════════════════════════════════════════════════════════════
# FUNCTION EXECUTORS
# ═══════════════════════════════════════════════════════════════════════════

async def execute_create_service_ticket(args: dict, pet_id: str, pet_name: str, user_email: str) -> dict:
    """Create a service ticket in the database using the Unified Service Flow."""
    import uuid
    
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc)
    
    # Basic ticket data for service_requests (backward compatibility)
    ticket = {
        "ticket_id": ticket_id,
        "type": args.get("service_type", "other"),
        "service_type": args.get("service_type", "other"),
        "description": args.get("description", ""),
        "urgency": args.get("urgency", "normal"),
        "preferred_time": args.get("preferred_time"),
        "pet_id": pet_id,
        "pet_name": pet_name,
        "user_email": user_email,
        "status": "pending",
        "created_at": now,
        "source": "mira_soulful"
    }
    
    if db is not None:
        try:
            logger.info(f"[SOULFUL] DB is set, attempting inserts for ticket {ticket_id}")
            # 1. Write to service_requests (original collection - backward compat)
            result1 = await db.service_requests.insert_one(ticket)
            logger.info(f"[SOULFUL] Created ticket in service_requests: {ticket_id} for {pet_name}, insert_id: {result1.inserted_id}")
            
            # 2. ALSO write to mira_tickets for CONCIERGE integration (Unified Service Flow)
            # This ensures tickets appear in the CONCIERGE panel
            unified_ticket = {
                "id": ticket_id,
                "ticket_id": ticket_id,
                "user_id": user_email,
                "pet_id": pet_id,
                "pet_name": pet_name,
                "title": f"{args.get('service_type', 'Service').replace('_', ' ').title()} for {pet_name}",
                "service_type": args.get("service_type", "other"),
                "pillar": map_service_to_pillar(args.get("service_type", "other")),
                "description": args.get("description", ""),
                "status": "placed",  # Standard unified flow status
                "priority": args.get("urgency", "normal"),
                "source": "mira_soulful_chat",
                "source_context": {
                    "created_via": "mira_chat",
                    "preferred_time": args.get("preferred_time")
                },
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
                "timeline": [
                    {
                        "timestamp": now.isoformat(),
                        "action": "Ticket created",
                        "status": "placed",
                        "note": f"Created via Mira chat for {pet_name}"
                    }
                ]
            }
            result2 = await db.mira_tickets.insert_one(unified_ticket)
            logger.info(f"[SOULFUL] Created unified ticket in mira_tickets: {ticket_id}, insert_id: {result2.inserted_id}")
            
            # 3. Create admin notification for Service Desk
            admin_notification = {
                "id": str(uuid.uuid4()),
                "type": "new_service_request",
                "ticket_id": ticket_id,
                "user_id": user_email,
                "pet_id": pet_id,
                "pet_name": pet_name,
                "title": f"New Request: {args.get('service_type', 'Service').replace('_', ' ').title()}",
                "content": args.get("description", "")[:200],
                "priority": args.get("urgency", "normal"),
                "created_at": now.isoformat(),
                "read": False
            }
            result3 = await db.admin_notifications.insert_one(admin_notification)
            logger.info(f"[SOULFUL] Created admin notification for: {ticket_id}, insert_id: {result3.inserted_id}")
            
        except Exception as e:
            logger.error(f"[SOULFUL] Failed to create ticket: {e}", exc_info=True)
    else:
        logger.warning(f"[SOULFUL] DB is None! Cannot create ticket {ticket_id}")
    
    return {
        "success": True,
        "ticket_id": ticket_id,
        "service_type": args.get("service_type"),
        "message": f"Request created. Ticket: {ticket_id}. Concierge will confirm details shortly.",
        "status": "pending"
    }


async def execute_suggest_picks_for_request(args: dict, pet_id: str, pet_name: str, user_email: str) -> dict:
    """
    Generate concierge pick cards from Mira's suggestions.
    These will appear in the PICKS panel with 'Send to Concierge' option.
    """
    import uuid
    
    request_type = args.get("request_type", "other")
    suggestions = args.get("suggestions", [])
    summary = args.get("summary", "Custom request")
    
    # Map request type to pillar
    pillar = map_service_to_pillar(request_type)
    
    # Generate concierge cards from suggestions
    concierge_cards = []
    for i, suggestion in enumerate(suggestions[:4]):  # Max 4 suggestions
        card = {
            "id": f"suggestion-{uuid.uuid4().hex[:8]}",
            "type": "concierge_suggestion",
            "label": "Mira's Suggestion",
            "title": f"{suggestion.get('emoji', '✨')} {suggestion.get('title', 'Custom option')}",
            "subtitle": suggestion.get("price_range", "Price on request"),
            "description": suggestion.get("description", ""),
            "spec_chip": f"For {pet_name}",
            "no_price": not bool(suggestion.get("price_range")),
            "action": "create_ticket",
            "pillar": pillar,
            "category": "mira_suggestions",
            "intent": summary,
            "original_request": summary,
            "pet_id": pet_id,
            "pet_name": pet_name,
            "request_type": request_type,
            "why_it_fits": f"Suggested for {pet_name}'s {request_type.replace('_', ' ')}"
        }
        concierge_cards.append(card)
    
    logger.info(f"[SOULFUL] Generated {len(concierge_cards)} suggestion cards for {pet_name}")
    
    return {
        "success": True,
        "suggestions_generated": len(concierge_cards),
        "concierge_cards": concierge_cards,
        "summary": summary,
        "pillar": pillar,
        "message": f"Here are {len(concierge_cards)} ideas for {pet_name}. Tap any to add to your request!"
    }


def map_service_to_pillar(service_type: str) -> str:
    """Map service type to pillar for the unified flow."""
    pillar_map = {
        "grooming": "care",
        "grooming_appointment": "care",
        "vet_visit": "care",
        "vet_appointment": "care",
        "vaccination": "care",
        "health_checkup": "care",
        "boarding": "stay",
        "pet_sitting": "stay",
        "travel": "travel",
        "pet_travel": "travel",
        "training": "learn",
        "walking": "care",
        "dog_walking": "care",
        "party": "celebrate",
        "birthday_party": "celebrate",
        "photography": "celebrate",
        "adoption": "adopt",
        "food": "dine",
        "meal_plan": "dine",
    }
    return pillar_map.get(service_type.lower() if service_type else "", "care")


async def execute_get_picks(args: dict, pet_name: str, allergies: list = None) -> dict:
    """Get personalized picks for the pet."""
    pillar = args.get("pillar", "care")
    context = args.get("context", "")
    
    # Define picks per pillar (personalized based on allergies)
    is_chicken_free = allergies and any("chicken" in str(a).lower() for a in allergies)
    
    picks_db = {
        "celebrate": [
            {"name": "Custom Birthday Cake", "description": "Chicken-free, dog-safe" if is_chicken_free else "Dog-safe celebration cake", "price": "₹650", "type": "product"},
            {"name": "Birthday Party Setup", "description": "Complete pawty package", "price": "From ₹2,500", "type": "service"},
            {"name": "Photo Session", "description": f"Professional photos of {pet_name}", "price": "₹1,500", "type": "service"},
            {"name": "Custom Bandana", "description": f"Embroidered with {pet_name}'s name", "price": "₹450", "type": "product"},
        ],
        "dine": [
            {"name": "Premium Treats", "description": "Chicken-free recipe" if is_chicken_free else "High protein formula", "price": "₹380", "type": "product"},
            {"name": "Fresh Meal Plan", "description": f"Customized for {pet_name}", "price": "From ₹200/meal", "type": "service"},
            {"name": "Dental Chews", "description": "Keeps teeth clean naturally", "price": "₹320", "type": "product"},
        ],
        "care": [
            {"name": "Grooming Session", "description": "Full spa treatment", "price": "From ₹800", "type": "service"},
            {"name": "Dog Walking", "description": "Professional daily walks", "price": "₹300/walk", "type": "service"},
            {"name": "Vet Home Visit", "description": "Veterinarian comes to you", "price": "₹1,500", "type": "service"},
            {"name": "Pet Sitting", "description": "In-home care", "price": "₹500/day", "type": "service"},
        ],
        "travel": [
            {"name": "Pet-Friendly Hotels", "description": "Curated accommodations", "price": "Varies", "type": "service"},
            {"name": "Travel Kit", "description": "Everything for the journey", "price": "₹2,200", "type": "product"},
            {"name": "Pet Taxi", "description": "Safe transport", "price": "From ₹500", "type": "service"},
        ],
        "stay": [
            {"name": "Premium Boarding", "description": "Luxury pet hotel", "price": "₹1,200/night", "type": "service"},
            {"name": "Home Pet Sitter", "description": "Sitter at your home", "price": "₹800/day", "type": "service"},
            {"name": "Daycare", "description": "Supervised play", "price": "₹600/day", "type": "service"},
        ],
        "enjoy": [
            {"name": "Dog Park Guide", "description": "Best parks nearby", "price": "Free", "type": "info"},
            {"name": "Pet Cafe Booking", "description": "Reserve at pet-friendly spots", "price": "Varies", "type": "service"},
            {"name": "Playdate Matching", "description": f"Find friends for {pet_name}", "price": "Free", "type": "service"},
        ],
        "fit": [
            {"name": "Fitness Assessment", "description": f"Check {pet_name}'s fitness level", "price": "₹500", "type": "service"},
            {"name": "Swimming Session", "description": "Low-impact exercise", "price": "₹800", "type": "service"},
        ],
        "learn": [
            {"name": "Basic Training", "description": "Obedience fundamentals", "price": "₹2,000/session", "type": "service"},
            {"name": "Behavior Consultation", "description": "Address specific issues", "price": "₹1,500", "type": "service"},
        ]
    }
    
    picks = picks_db.get(pillar, picks_db["care"])
    
    return {
        "success": True,
        "pillar": pillar,
        "picks": picks,
        "message": f"Here are personalized {pillar} picks for {pet_name}"
    }


async def execute_get_today_items(pet_id: str, pet_name: str) -> dict:
    """Get today's items for the pet."""
    # Would normally query calendar, reminders, etc.
    return {
        "success": True,
        "actions": [
            {"icon": "💊", "title": "Medication reminder", "description": "Heartworm prevention due this week", "priority": "medium"},
            {"icon": "✂️", "title": "Grooming due", "description": "Last grooming was 6 weeks ago", "priority": "low"},
        ],
        "message": f"Here's what's on {pet_name}'s radar today"
    }


async def execute_get_learn_content(args: dict, pet_name: str) -> dict:
    """Get educational content."""
    topic = args.get("topic", "general care")
    
    content = [
        {"title": f"Guide: {topic.title()}", "description": f"Everything you need to know about {topic} for {pet_name}", "type": "guide", "read_time": "2 min"},
        {"title": f"Video: {topic.title()} Tips", "description": "Watch and learn", "type": "video", "read_time": "5 min"},
    ]
    
    return {
        "success": True,
        "topic": topic,
        "content": content,
        "message": f"Here's helpful content about {topic}"
    }


# ═══════════════════════════════════════════════════════════════════════════
# MAIN FUNCTION - Get Soulful Response
# ═══════════════════════════════════════════════════════════════════════════

async def get_soulful_response(
    message: str,
    pet_id: str = None,
    pet_name: str = None,
    pet_context: dict = None,
    user_email: str = None,
    conversation_history: List[Dict[str, str]] = None,
    active_pillar: str = None,
    user_city: str = None
) -> dict:
    """
    Get a soulful response from Mira.
    
    This function can be called from the legacy mira_routes.py endpoint
    to get the conversation response while keeping all other data flows intact.
    
    Returns:
        dict with keys:
        - response: The text response
        - actions: List of actions taken (service tickets, picks, etc.)
        - quick_replies: Suggested follow-ups
    """
    
    conversation_history = conversation_history or []
    pet_context = pet_context or {}
    pet_name = pet_name or pet_context.get("name", "your pet")
    
    # Build pet context string from the dict
    context_parts = []
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 🌈 RAINBOW BRIDGE CHECK - CRITICAL for compassionate responses
    # If the pet has crossed, Mira must know this FIRST
    # ═══════════════════════════════════════════════════════════════════════════
    is_rainbow_bridge = pet_context.get("rainbow_bridge", False)
    logger.info(f"[SOULFUL] Rainbow bridge check for {pet_name}: {is_rainbow_bridge} (raw value: {pet_context.get('rainbow_bridge')})")
    
    if is_rainbow_bridge:
        crossing_date = pet_context.get("crossing_date") or pet_context.get("rainbow_bridge_date")
        tribute = pet_context.get("tribute_message") or pet_context.get("memorial_message")
        
        context_parts.append("🌈 RAINBOW BRIDGE STATUS: This beloved pet has crossed the rainbow bridge.")
        if crossing_date:
            context_parts.append(f"Crossing date: {crossing_date}")
        if tribute:
            context_parts.append(f"Parent's tribute: {tribute}")
        context_parts.append("CRITICAL: Be extra gentle and compassionate. Focus on honoring their memory, not suggesting services or products. The parent may be grieving.")
        context_parts.append("")  # Empty line for visual separation
        logger.info(f"[SOULFUL] Added rainbow bridge context for {pet_name}")
    
    # Add user's city if available
    if user_city:
        context_parts.append(f"User's Location: {user_city}")
    
    if pet_context.get("name"):
        context_parts.append(f"Name: {pet_context['name']}")
    if pet_context.get("breed"):
        context_parts.append(f"Breed: {pet_context['breed']}")
    if pet_context.get("age"):
        context_parts.append(f"Age: {pet_context['age']}")
    if pet_context.get("weight"):
        context_parts.append(f"Weight: {pet_context['weight']}")
    if pet_context.get("gender"):
        context_parts.append(f"Gender: {pet_context['gender']}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # FULL DOGGY SOUL ANSWERS - The heart of pet memory
    # This is what makes Mira truly know the pet
    # ═══════════════════════════════════════════════════════════════════════════
    doggy_soul = pet_context.get("doggy_soul_answers") or {}
    
    # Personality & Behavior
    temperament = doggy_soul.get("temperament") or pet_context.get("temperament")
    if temperament:
        context_parts.append(f"Temperament: {temperament}")
    
    energy_level = doggy_soul.get("energy_level") or pet_context.get("activity_level")
    if energy_level:
        context_parts.append(f"Energy level: {energy_level}")
    
    # Social behavior
    behavior_with_dogs = doggy_soul.get("behavior_with_dogs")
    if behavior_with_dogs:
        context_parts.append(f"With other dogs: {behavior_with_dogs}")
    
    behavior_with_people = doggy_soul.get("social_with_people")
    if behavior_with_people:
        context_parts.append(f"With people: {behavior_with_people}")
    
    stranger_reaction = doggy_soul.get("stranger_reaction")
    if stranger_reaction:
        context_parts.append(f"With strangers: {stranger_reaction}")
    
    # Handling & Grooming
    handling_comfort = doggy_soul.get("handling_comfort")
    if handling_comfort:
        context_parts.append(f"Handling comfort: {handling_comfort} - IMPORTANT for grooming/vet visits")
    
    coat_type = doggy_soul.get("coat_type") or pet_context.get("coat_type")
    if coat_type:
        context_parts.append(f"Coat type: {coat_type}")
    
    # Anxiety & Triggers
    anxiety_triggers = doggy_soul.get("anxiety_triggers") or pet_context.get("anxiety_triggers")
    if anxiety_triggers:
        if isinstance(anxiety_triggers, list):
            context_parts.append(f"Anxiety triggers: {', '.join(anxiety_triggers)} - BE CAREFUL with these")
        else:
            context_parts.append(f"Anxiety triggers: {anxiety_triggers} - BE CAREFUL with these")
    
    loud_sounds = doggy_soul.get("loud_sounds")
    if loud_sounds:
        context_parts.append(f"Reaction to loud sounds: {loud_sounds}")
    
    separation_anxiety = doggy_soul.get("separation_anxiety")
    if separation_anxiety:
        context_parts.append(f"Separation anxiety: {separation_anxiety}")
    
    # Food & Motivation
    food_motivation = doggy_soul.get("food_motivation")
    if food_motivation:
        context_parts.append(f"Food motivation: {food_motivation}")
    
    favorite_treats = doggy_soul.get("favorite_treats") or pet_context.get("favorite_treats")
    if favorite_treats:
        if isinstance(favorite_treats, list):
            context_parts.append(f"Favorite treats: {', '.join(favorite_treats)}")
        else:
            context_parts.append(f"Favorite treats: {favorite_treats}")
    
    # Health
    health_conditions = doggy_soul.get("health_conditions") or pet_context.get("medical_conditions")
    if health_conditions:
        if isinstance(health_conditions, list):
            context_parts.append(f"Health conditions: {', '.join(health_conditions)} - Consider in recommendations")
        else:
            context_parts.append(f"Health conditions: {health_conditions} - Consider in recommendations")
    
    life_stage = doggy_soul.get("life_stage")
    if life_stage:
        context_parts.append(f"Life stage: {life_stage}")
    
    # Training & Behavior concerns
    training_level = doggy_soul.get("training_level")
    if training_level:
        context_parts.append(f"Training level: {training_level}")
    
    behavior_concerns = doggy_soul.get("behavior_concerns")
    if behavior_concerns:
        if isinstance(behavior_concerns, list):
            context_parts.append(f"Behavior concerns: {', '.join(behavior_concerns)}")
        else:
            context_parts.append(f"Behavior concerns: {behavior_concerns}")
    
    # Personality (also check legacy fields)
    personality = pet_context.get("personality") or pet_context.get("soul_data", {}).get("personality", [])
    if personality:
        if isinstance(personality, list):
            context_parts.append(f"Personality traits: {', '.join(personality)}")
        else:
            context_parts.append(f"Personality traits: {personality}")
    
    # Health data - Allergies (CRITICAL)
    allergies = pet_context.get("allergies") or pet_context.get("health_data", {}).get("allergies", [])
    food_allergies = doggy_soul.get("food_allergies") or pet_context.get("dietary_restrictions")
    all_allergies = []
    if allergies:
        all_allergies.extend(allergies if isinstance(allergies, list) else [allergies])
    if food_allergies:
        all_allergies.extend(food_allergies if isinstance(food_allergies, list) else [food_allergies])
    if all_allergies:
        context_parts.append(f"⚠️ ALLERGIES: {', '.join(all_allergies)} - NEVER recommend these")
    
    chronic = pet_context.get("chronic_conditions") or pet_context.get("health_data", {}).get("chronic_conditions")
    if chronic:
        context_parts.append(f"Chronic condition: {chronic} - be gentle and considerate")
    
    # Preferences
    preferences = pet_context.get("preferences") or pet_context.get("soul_data", {}).get("preferences") or {}
    if preferences:
        if preferences.get("favorite_activities"):
            context_parts.append(f"Loves: {', '.join(preferences['favorite_activities'])}")
        if preferences.get("dislikes"):
            context_parts.append(f"Dislikes: {', '.join(preferences['dislikes'])}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # RELATIONSHIPS & FAMILY - Who the pet knows and loves
    # ═══════════════════════════════════════════════════════════════════════════
    relationships = pet_context.get("relationships", {})
    if relationships:
        if isinstance(relationships, dict):
            # New format: {"dog_friends": [...], "human_favorites": [...], "pet_sitter": "..."}
            dog_friends = relationships.get("dog_friends", [])
            if dog_friends:
                context_parts.append(f"Dog friends: {', '.join(dog_friends)}")
            
            human_favorites = relationships.get("human_favorites", [])
            if human_favorites:
                context_parts.append(f"Favorite humans: {', '.join(human_favorites)}")
            
            pet_sitter = relationships.get("pet_sitter")
            if pet_sitter:
                context_parts.append(f"Pet sitter: {pet_sitter}")
        elif isinstance(relationships, list):
            # Old format: [{"name": "...", "type": "friend"}]
            friends = [r.get("name") for r in relationships if isinstance(r, dict) and r.get("type") == "friend"]
            if friends:
                context_parts.append(f"Dog friends: {', '.join(friends)}")
    
    # Pet siblings (other pets in the same family)
    siblings = pet_context.get("siblings") or pet_context.get("pet_siblings")
    if siblings:
        if isinstance(siblings, list):
            context_parts.append(f"Pet siblings: {', '.join(siblings)}")
        else:
            context_parts.append(f"Pet siblings: {siblings}")
    
    # Pet parent info
    owner_email = pet_context.get("owner_email")
    owner_name = pet_context.get("owner_name") or pet_context.get("parent_name")
    if owner_name:
        context_parts.append(f"Pet parent: {owner_name}")
    elif owner_email:
        # Extract name from email if not explicitly set
        parent_name = owner_email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
        context_parts.append(f"Pet parent: {parent_name}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ORDER/PURCHASE HISTORY - What they've bought before
    # ═══════════════════════════════════════════════════════════════════════════
    order_history = pet_context.get("order_history") or pet_context.get("purchase_history") or []
    if order_history:
        recent_orders = order_history[:5] if isinstance(order_history, list) else []
        if recent_orders:
            order_items = []
            for order in recent_orders:
                if isinstance(order, dict):
                    items = order.get("items", order.get("products", []))
                    for item in items[:2]:  # Max 2 items per order
                        item_name = item.get("name", item.get("title", ""))
                        if item_name:
                            order_items.append(item_name)
            if order_items:
                context_parts.append(f"Recent purchases: {', '.join(order_items[:5])}")
    
    # User intents/requests from service desk
    recent_intents = pet_context.get("recent_intents") or pet_context.get("service_requests") or []
    if recent_intents:
        intent_summaries = []
        for intent in recent_intents[:3]:
            if isinstance(intent, dict):
                intent_type = intent.get("type", intent.get("intent_type", ""))
                if intent_type:
                    intent_summaries.append(intent_type)
        if intent_summaries:
            context_parts.append(f"Recent requests: {', '.join(intent_summaries)}")
    
    context_string = "\n".join(context_parts) if context_parts else "No specific details available yet."
    
    # Log the context for debugging
    if is_rainbow_bridge:
        logger.info(f"[SOULFUL] Context string for {pet_name} (first 500 chars): {context_string[:500]}")
    
    # Build system prompt with conversation length for pet description rule
    conversation_length = len(conversation_history) if conversation_history else 0
    system_prompt = build_soul_prompt(pet_name, context_string, active_pillar, conversation_length)
    
    try:
        # Initialize chat with proper initialization
        emergent_key = os.environ.get("EMERGENT_LLM_KEY")
        if not emergent_key:
            raise ValueError("EMERGENT_LLM_KEY not set")
        
        import uuid
        session_id = f"soulful-{uuid.uuid4().hex[:8]}"
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id=session_id,
            system_message=system_prompt
        ).with_model("openai", "gpt-5.1")
        
        # Build conversation context into the message
        context_intro = ""
        if conversation_history and len(conversation_history) > 0:
            # Include recent history in context
            history_summary = []
            for msg in conversation_history[-4:]:  # Last 4 messages for context
                role = "Parent" if msg.get("role") == "user" else "Mira"
                history_summary.append(f"{role}: {msg.get('content', '')[:100]}")
            if history_summary:
                context_intro = f"[Recent conversation context:\n{chr(10).join(history_summary)}\n]\n\nParent's latest message: "
        
        # Get response using send_message with context
        full_message = f"{context_intro}{message}"
        response = await chat.send_message(UserMessage(text=full_message))
        
        # The response is now a string directly
        response_text = response if isinstance(response, str) else str(response)
        
        # Detect if we should trigger actions based on conversation context
        actions = []
        lower_msg = message.lower()
        
        # Auto-create service ticket for booking/arrangement requests
        # These are the "Concierge Handoff" trigger words from MIRA_DOCTRINE.md
        booking_keywords = ["book", "schedule", "arrange", "set up", "need a", "want to book", 
                           "get me", "plan", "organise", "organize", "help me find", "can you find"]
        
        # Service types that trigger ticket creation
        service_keywords = {
            # Care pillar
            "grooming": "grooming", "groom": "grooming", "spa": "grooming",
            "walker": "dog_walker", "walking": "dog_walker", "walk": "dog_walker",
            "vet": "vet_visit", "veterinarian": "vet_visit", "checkup": "vet_visit",
            "boarding": "boarding", "kennel": "boarding",
            "sitting": "pet_sitting", "sitter": "pet_sitting", "pet sit": "pet_sitting",
            "daycare": "daycare",
            # Training
            "training": "training", "trainer": "training",
            # Celebrate
            "birthday": "birthday_party", "party": "birthday_party", "celebration": "birthday_party",
            "photo": "photo_session", "photoshoot": "photo_session",
            # Travel
            "hotel": "travel_planning", "hotels": "travel_planning", "stay": "travel_planning",
            "trip": "travel_planning", "travel": "travel_planning", "vacation": "travel_planning",
            "accommodation": "travel_planning", "resort": "travel_planning",
            # Other
            "taxi": "pet_taxi", "transport": "pet_taxi",
        }
        
        has_booking_intent = any(kw in lower_msg for kw in booking_keywords)
        detected_service = None
        detected_service_type = None
        
        for keyword, svc_type in service_keywords.items():
            if keyword in lower_msg:
                detected_service = keyword
                detected_service_type = svc_type
                break
        
        if has_booking_intent and detected_service:
            # Auto-create a service ticket per UNIFIED_SERVICE_FLOW.md
            result = await execute_create_service_ticket(
                {"service_type": detected_service_type, "description": message},
                pet_id, pet_name, user_email
            )
            actions.append({"type": "service_created", "data": result})
            
            # Append ticket info to response (continuation, not escalation)
            response_text = f"{response_text}\n\nI've created a service request ({result['ticket_id']}) for this. Our concierge team will confirm details with you shortly."
        
        # Generate quick replies based on context
        quick_replies = generate_quick_replies(message, response_text, active_pillar, pet_name)
        
        # Determine which tab should glow/activate based on conversation
        highlight_tab = None
        suggested_pillar = None
        
        # If service was created, highlight SERVICES tab
        if any(a["type"] == "service_created" for a in actions):
            highlight_tab = "services"
        
        # Detect pillar context from conversation
        lower_msg = message.lower()
        detected_topic = None  # For intent saving
        
        # Order matters! Check more specific food/meal keywords FIRST
        # "health meal plan" should match DINE, not CARE
        if any(kw in lower_msg for kw in ["food", "treat", "diet", "nutrition", "meal", "feeding", "recipe", "kibble"]):
            suggested_pillar = "dine"
            detected_topic = "nutrition"
        elif any(kw in lower_msg for kw in ["birthday", "party", "celebrate", "gift", "photo", "anniversary", "gotcha"]):
            suggested_pillar = "celebrate"
            detected_topic = "celebration"
        elif any(kw in lower_msg for kw in ["groom", "bath", "haircut", "spa", "nail", "walker", "walk", "vet", "health", "sitting", "sitter"]):
            suggested_pillar = "care"
            if any(kw in lower_msg for kw in ["groom", "bath", "haircut", "spa", "nail"]):
                detected_topic = "grooming"
            elif any(kw in lower_msg for kw in ["vet", "health", "checkup", "vaccination"]):
                detected_topic = "health"
            elif any(kw in lower_msg for kw in ["walker", "walk"]):
                detected_topic = "walks"
        elif any(kw in lower_msg for kw in ["travel", "trip", "hotel", "vacation", "flight"]):
            suggested_pillar = "travel"
            detected_topic = "travel"
        elif any(kw in lower_msg for kw in ["boarding", "kennel", "daycare"]):
            suggested_pillar = "stay"
            detected_topic = "boarding"
        elif any(kw in lower_msg for kw in ["train", "behavior", "obedience"]):
            suggested_pillar = "learn"
            detected_topic = "training"
        
        # ═══════════════════════════════════════════════════════════════════════════
        # SAVE INTENT FOR SOUL INTEGRATION
        # This powers the "MOJO MIGHT NEED THIS" shelf in Services panel
        # ═══════════════════════════════════════════════════════════════════════════
        if detected_topic and db is not None and user_email:
            try:
                from datetime import datetime, timezone
                import uuid as uuid_module
                
                # Get user_id from user_email
                user_id = user_email
                if user_email and "@" in user_email:
                    user_doc = await db.users.find_one({"email": user_email}, {"id": 1})
                    if user_doc and user_doc.get("id"):
                        user_id = user_doc["id"]
                
                if user_id:
                    intent_doc = {
                        "id": f"intent-{uuid_module.uuid4().hex[:8]}",
                        "user_id": user_id,
                        "pet_id": pet_id,
                        "topic": detected_topic,
                        "message": message[:200],
                        "pillar": suggested_pillar,
                        "confidence": 0.85,
                        "source": "soulful_brain",
                        "created_at": datetime.now(timezone.utc)
                    }
                    await db.user_learn_intents.insert_one(intent_doc)
                    logger.info(f"[SOULFUL] Saved intent '{detected_topic}' for {pet_name}")
            except Exception as intent_err:
                logger.warning(f"[SOULFUL] Failed to save intent: {intent_err}")
        
        # ═══════════════════════════════════════════════════════════════════════════
        # MIRA LEARNS - Extract facts from user messages and save to pet profile
        # This powers the "What Mira Learned" section in MOJO profile
        # Pattern: Look for allergies, preferences, traits mentioned in conversation
        # ═══════════════════════════════════════════════════════════════════════════
        logger.info(f"[MIRA LEARNS] Starting extraction: db={db is not None}, pet_id={pet_id}")
        if db is not None and pet_id:
            try:
                from datetime import datetime as dt_class, timezone as tz
                learned_facts = []
                now = dt_class.now(tz.utc)
                
                # Pattern matching for learnable information
                lower_msg = message.lower()
                logger.info(f"[MIRA LEARNS] Checking message: {lower_msg[:100]}...")
                
                # Allergies (CRITICAL)
                allergy_patterns = [
                    (r'allergic to (\w+(?:\s+\w+)?)', 'allergy'),
                    (r'can\'t eat (\w+)', 'allergy'),
                    (r'sensitive to (\w+)', 'sensitivity'),
                    (r'reacts badly to (\w+)', 'allergy'),
                ]
                for pattern, fact_type in allergy_patterns:
                    matches = re.findall(pattern, lower_msg)
                    for match in matches:
                        learned_facts.append({
                            "type": fact_type,
                            "content": f"{fact_type.title()}: {match}",
                            "value": match,
                            "category": "health",
                            "source": "conversation",
                            "timestamp": now.isoformat()
                        })
                
                # Preferences (loves, hates, prefers)
                pref_patterns = [
                    (r'loves? (\w+(?:\s+\w+)?(?:\s+treats?)?)', 'loves'),
                    (r'hates? (\w+)', 'dislikes'),
                    (r'prefers? (\w+(?:\s+\w+)?)', 'prefers'),
                    (r'favorite (?:treat|food|toy|activity) (?:is |are )?(\w+(?:\s+\w+)?)', 'favorite'),
                    (r'doesn\'t like (\w+)', 'dislikes'),
                ]
                for pattern, fact_type in pref_patterns:
                    matches = re.findall(pattern, lower_msg)
                    for match in matches:
                        # Filter out non-nouns and common words
                        if match not in ['to', 'the', 'it', 'a', 'an', 'is', 'are', 'was', 'be']:
                            learned_facts.append({
                                "type": fact_type,
                                "content": f"{fact_type.title()}: {match}",
                                "value": match,
                                "category": "preferences",
                                "source": "conversation",
                                "timestamp": now.isoformat()
                            })
                
                # Behavioral traits
                behavior_patterns = [
                    (r'(?:is |gets )?nervous (?:around|about|when) (\w+(?:\s+\w+)?)', 'nervousness_trigger'),
                    (r'afraid of (\w+)', 'fear'),
                    (r'anxious (?:around|about|when) (\w+)', 'anxiety_trigger'),
                    (r'calm (?:around|with) (\w+)', 'comfort'),
                ]
                for pattern, fact_type in behavior_patterns:
                    matches = re.findall(pattern, lower_msg)
                    for match in matches:
                        learned_facts.append({
                            "type": fact_type,
                            "content": f"Behavior: {fact_type.replace('_', ' ')} - {match}",
                            "value": match,
                            "category": "behavior",
                            "source": "conversation",
                            "timestamp": now.isoformat()
                        })
                
                # Health information
                health_patterns = [
                    (r'has (\w+ skin)', 'condition'),
                    (r'needs (\w+ grooming)', 'grooming_need'),
                    (r'on medication for (\w+)', 'medication'),
                ]
                for pattern, fact_type in health_patterns:
                    matches = re.findall(pattern, lower_msg)
                    for match in matches:
                        learned_facts.append({
                            "type": fact_type,
                            "content": f"Health: {match}",
                            "value": match,
                            "category": "health",
                            "source": "conversation",
                            "timestamp": now.isoformat()
                        })
                
                # Save learned facts to pet profile if any were found
                if learned_facts:
                    # Add to pet's learned_facts array
                    update_result = await db.pets.update_one(
                        {"id": pet_id},
                        {
                            "$push": {
                                "learned_facts": {"$each": learned_facts}
                            },
                            "$set": {
                                "last_learned_at": now.isoformat()
                            }
                        }
                    )
                    
                    if update_result.modified_count > 0:
                        logger.info(f"[MIRA LEARNS] ✅ Saved {len(learned_facts)} facts for {pet_name}: {[f['content'] for f in learned_facts]}")
                    else:
                        # Try updating by name if id doesn't match
                        update_by_name = await db.pets.update_one(
                            {"name": pet_name, "owner_email": user_email},
                            {
                                "$push": {
                                    "learned_facts": {"$each": learned_facts}
                                },
                                "$set": {
                                    "last_learned_at": now.isoformat()
                                }
                            }
                        )
                        if update_by_name.modified_count > 0:
                            logger.info(f"[MIRA LEARNS] ✅ Saved {len(learned_facts)} facts for {pet_name} (by name)")
                        else:
                            logger.warning(f"[MIRA LEARNS] Could not update pet profile for {pet_name}")
                    
                    # Also save to conversation_memories for context
                    memory_doc = {
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "user_email": user_email,
                        "message": message[:500],
                        "facts_learned": learned_facts,
                        "timestamp": now.isoformat()
                    }
                    await db.conversation_memories.insert_one(memory_doc)
                    
            except Exception as learn_err:
                logger.warning(f"[MIRA LEARNS] Error extracting facts: {learn_err}")
        
        # ═══════════════════════════════════════════════════════════════════════════
        # EXTRACT SUGGESTIONS FROM RESPONSE → POPULATE PICKS
        # When Mira gives concrete suggestions (cake, decorations, etc.), convert to PICKS
        # Mira's response format: numbered lists like "1. **Title**" or "- Item"
        # ═══════════════════════════════════════════════════════════════════════════
        concierge_cards = []
        picks_contract = None
        
        import uuid as uuid_module
        
        suggestion_items = []
        
        # Method 1: Extract numbered bold headers like "1. **Paw-ty at Home**" or "2. **Activity Fun**"
        # These are Mira's main suggestion categories
        numbered_pattern = r'^\s*(\d+)\.\s*\*?\*?([^*\n]+)\*?\*?'
        for line in response_text.split('\n'):
            match = re.match(numbered_pattern, line.strip())
            if match:
                num = match.group(1)
                title = match.group(2).strip().strip('*').strip()
                # Filter out questions and too-short titles
                if len(title) > 10 and not title.endswith('?') and not title.startswith('To narrow'):
                    suggestion_items.append({
                        "emoji": "🎉" if "party" in title.lower() or "paw" in title.lower() else "✨",
                        "text": title,
                        "number": num
                    })
        
        # Method 2: If no numbered items, try bullet points with bold "**Title**" or emoji starters
        if len(suggestion_items) < 2:
            # Look for lines starting with - or • followed by bold text or emoji
            bullet_pattern = r'^\s*[-•]\s*\*?\*?([🎂🎈📸🦴🎉🍰🎁✨]?\s*[^*\n:]+)'
            for line in response_text.split('\n'):
                match = re.match(bullet_pattern, line.strip())
                if match:
                    text = match.group(1).strip().strip('*').strip(':').strip()
                    # Must be substantial (not just "Dog-safe cake" sub-bullets)
                    if len(text) > 15 and not text.endswith('?'):
                        # Extract emoji if present at start
                        emoji_match = re.match(r'^([🎂🎈📸🦴🎉🍰🎁✨])\s*(.+)', text)
                        if emoji_match:
                            suggestion_items.append({"emoji": emoji_match.group(1), "text": emoji_match.group(2)})
                        else:
                            suggestion_items.append({"emoji": "✨", "text": text})
        
        # Method 3: Last resort - emoji at START of line (not middle of text)
        if len(suggestion_items) < 2:
            emoji_patterns = ["🎂", "🎈", "📸", "🦴", "🎉", "🍰", "🎁"]
            for emoji in emoji_patterns:
                # Only match emoji at start of line
                pattern = rf'^{emoji}\s+(.+?)(?:\n|$)'
                matches = re.findall(pattern, response_text, re.MULTILINE)
                for match in matches:
                    clean = match.strip()
                    if len(clean) > 10 and not clean.endswith('?'):
                        suggestion_items.append({"emoji": emoji, "text": clean[:100]})
        
        # Convert to concierge_cards (max 4, deduplicated)
        seen_titles = set()
        for item in suggestion_items[:6]:  # Check more, keep 4
            text = item.get("text", "")
            emoji = item.get("emoji", "✨")
            
            # Clean and validate title
            title = text.strip()
            title = re.sub(r'\s*\([₹$][\d,\-–\s]+\)', '', title)  # Remove prices in parens
            title = re.sub(r'\s*[₹$][\d,]+.*$', '', title)  # Remove trailing prices
            title = title.strip()
            
            # Skip duplicates and invalid entries
            title_lower = title.lower()
            if title_lower in seen_titles or len(title) < 8:
                continue
            seen_titles.add(title_lower)
            
            # Try to extract price if present
            price_match = re.search(r'[₹$][\d,]+(?:\s*[-–]\s*[₹$]?[\d,]+)?', text)
            price = price_match.group(0) if price_match else None
            
            card = {
                "id": f"mira-suggestion-{uuid_module.uuid4().hex[:8]}",
                "type": "mira_suggestion",
                "label": "Mira's Pick",
                "title": f"{emoji} {title[:60]}",
                "subtitle": price if price else "Tap to request",
                "description": f"Suggested for {pet_name}",
                "spec_chip": f"For {pet_name}",
                "no_price": not bool(price),
                "action": "add_to_request",
                "pillar": suggested_pillar or "celebrate",
                "category": "mira_suggestions",
                "intent": title,
                "original_request": message[:200],
                "pet_id": pet_id,
                "pet_name": pet_name,
                "why_it_fits": f"Suggested by Mira for {pet_name}"
            }
            concierge_cards.append(card)
            
            if len(concierge_cards) >= 4:
                break
            
            # If we generated suggestions, create picks_contract
            if concierge_cards:
                picks_contract = {
                    "fallback_mode": "concierge",
                    "fallback_reason": "mira_suggestions",
                    "match_count": len(concierge_cards),
                    "concierge_cards": concierge_cards,
                    "blocked_by_safety": False
                }
                logger.info(f"[SOULFUL] Generated {len(concierge_cards)} suggestion cards for PICKS")
        
        # Map detected topic to service launcher ID
        highlight_service = None
        if detected_topic:
            service_topic_map = {
                "grooming": "grooming",
                "health": "vet_visit",
                "walks": "walking",
                "celebration": "party_setup",
                "nutrition": "nutrition",  # May not exist as launcher
                "travel": "travel",
                "boarding": "boarding",
                "training": "training"
            }
            highlight_service = service_topic_map.get(detected_topic)
        
        return {
            "response": response_text,
            "actions": actions,
            "quick_replies": quick_replies,
            "pet_name": pet_name,
            "highlight_tab": highlight_tab,  # Which OS tab should glow
            "suggested_pillar": suggested_pillar,  # Which PICKS pillar is relevant
            "highlight_service": highlight_service,  # Which service launcher to highlight
            "detected_topic": detected_topic,  # Raw detected topic
            "concierge_arranges": concierge_cards,  # Suggestions for PICKS panel
            "picks_contract": picks_contract,  # Contract for PICKS processing
            "concierge_fallback": len(concierge_cards) > 0,
            "concierge_fallback_reason": "mira_suggestions" if concierge_cards else None
        }
        
    except Exception as e:
        logger.error(f"[SOULFUL] Error: {e}", exc_info=True)
        return {
            "response": f"I'm here for you and {pet_name}. Let me know what you need help with.",
            "actions": [],
            "quick_replies": [
                {"label": "Book a service", "payload": "I need to book a service"},
                {"label": "Get recommendations", "payload": "What do you recommend?"},
            ],
            "pet_name": pet_name,
            "error": str(e)
        }


def generate_quick_replies(user_message: str, mira_response: str, pillar: str, pet_name: str) -> List[dict]:
    """Generate contextual quick reply suggestions."""
    
    lower_msg = user_message.lower()
    lower_resp = mira_response.lower()
    
    # After service creation
    if "ticket" in lower_resp or "request" in lower_resp:
        return [
            {"label": "View in Services", "payload": "show_services", "action": "open_tab"},
            {"label": "Add more details", "payload": "I want to add more details"},
            {"label": "Start something new", "payload": "I have another request"},
        ]
    
    # Birthday/celebration context
    if "birthday" in lower_msg or "party" in lower_msg or "celebrate" in lower_msg:
        return [
            {"label": f"Cozy celebration", "payload": f"Let's keep it cozy for {pet_name}"},
            {"label": "Invite dog friends", "payload": f"I want to invite {pet_name}'s dog friends"},
            {"label": "Show me party supplies", "payload": "Show me birthday party supplies"},
        ]
    
    # Grooming context
    if "groom" in lower_msg or "bath" in lower_msg or "haircut" in lower_msg:
        return [
            {"label": "Book grooming", "payload": f"Book a grooming session for {pet_name}"},
            {"label": "Home grooming", "payload": "I prefer home grooming"},
            {"label": "Show groomers nearby", "payload": "Show me groomers nearby"},
        ]
    
    # Health context
    if "vet" in lower_msg or "sick" in lower_msg or "health" in lower_msg:
        return [
            {"label": "Book vet visit", "payload": f"Book a vet visit for {pet_name}"},
            {"label": "Find vets nearby", "payload": "Find vets near me"},
            {"label": "It's not urgent", "payload": "It's not urgent, just a checkup"},
        ]
    
    # Default based on pillar
    pillar_replies = {
        "celebrate": [
            {"label": f"Birthday for {pet_name}", "payload": f"I want to plan a birthday for {pet_name}"},
            {"label": "Photo session", "payload": "I want a photo session"},
        ],
        "care": [
            {"label": "Book grooming", "payload": "I need grooming"},
            {"label": "Find a walker", "payload": "I need a dog walker"},
            {"label": "Vet visit", "payload": "I need a vet visit"},
        ],
        "dine": [
            {"label": "Treat recommendations", "payload": f"What treats do you recommend for {pet_name}?"},
            {"label": "Meal planning", "payload": "Help me with meal planning"},
        ],
        "travel": [
            {"label": "Plan a trip", "payload": f"I want to plan a trip with {pet_name}"},
            {"label": "Pet-friendly hotels", "payload": "Show me pet-friendly hotels"},
        ],
    }
    
    return pillar_replies.get(pillar, [
        {"label": f"What do you suggest for {pet_name}?", "payload": "What do you suggest?"},
        {"label": "I need help with something", "payload": "I need help"},
    ])
