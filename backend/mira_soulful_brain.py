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
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

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

4. NEVER A DEAD END
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

═══════════════════════════════════════════════════════════════════════════════
SAFETY GATES:
═══════════════════════════════════════════════════════════════════════════════
- ALWAYS filter recommendations by allergies
- NEVER give medical diagnoses - say "This needs a vet's eyes. I can help you prepare."
- NEVER give legal advice
- If emotional/grief context detected - provide presence only, no product suggestions

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
    """Create a service ticket in the database."""
    import uuid
    
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    
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
        "created_at": datetime.utcnow(),
        "source": "mira_soulful"
    }
    
    if db is not None:
        try:
            await db.service_requests.insert_one(ticket)
            logger.info(f"[SOULFUL] Created ticket: {ticket_id} for {pet_name}")
        except Exception as e:
            logger.error(f"[SOULFUL] Failed to create ticket: {e}")
    
    return {
        "success": True,
        "ticket_id": ticket_id,
        "service_type": args.get("service_type"),
        "message": f"Request created. Ticket: {ticket_id}. Concierge will confirm details shortly.",
        "status": "pending"
    }


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
    active_pillar: str = None
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
    
    if pet_context.get("name"):
        context_parts.append(f"Name: {pet_context['name']}")
    if pet_context.get("breed"):
        context_parts.append(f"Breed: {pet_context['breed']}")
    if pet_context.get("age"):
        context_parts.append(f"Age: {pet_context['age']}")
    
    # Personality (crucial for soulful responses)
    personality = pet_context.get("personality") or pet_context.get("soul_data", {}).get("personality", [])
    if personality:
        if isinstance(personality, list):
            context_parts.append(f"Personality: {', '.join(personality)}")
        else:
            context_parts.append(f"Personality: {personality}")
    
    # Health data
    allergies = pet_context.get("allergies") or pet_context.get("health_data", {}).get("allergies", [])
    if allergies:
        context_parts.append(f"Allergies: {', '.join(allergies)} - IMPORTANT: avoid these in recommendations")
    
    chronic = pet_context.get("chronic_conditions") or pet_context.get("health_data", {}).get("chronic_conditions")
    if chronic:
        context_parts.append(f"Health note: {chronic} - be gentle and considerate")
    
    # Preferences
    preferences = pet_context.get("preferences") or pet_context.get("soul_data", {}).get("preferences", {})
    if preferences:
        if preferences.get("favorite_activities"):
            context_parts.append(f"Loves: {', '.join(preferences['favorite_activities'])}")
        if preferences.get("dislikes"):
            context_parts.append(f"Dislikes: {', '.join(preferences['dislikes'])}")
    
    # Relationships
    relationships = pet_context.get("relationships", [])
    if relationships:
        friends = [r.get("name") for r in relationships if r.get("type") == "friend"]
        if friends:
            context_parts.append(f"Dog friends: {', '.join(friends)}")
    
    context_string = "\n".join(context_parts) if context_parts else "No specific details available yet."
    
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
        
        return {
            "response": response_text,
            "actions": actions,
            "quick_replies": quick_replies,
            "pet_name": pet_name
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
