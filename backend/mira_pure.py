"""
MIRA PURE - Clean, soulful AI without hardcoded logic
=====================================================

This is a simplified chat endpoint that lets GPT-5.1 handle conversations
naturally, without 26,000 lines of keyword matching interfering.

The only rules:
1. Be soulful and warm (personality)
2. Remember the pet's context (injected)
3. No medical diagnoses, no legal advice, no fabrication
4. Stay focused on what the user is actually asking
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
import os
import logging

# Emergent LLM integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira-pure", tags=["Mira Pure"])

# Database reference - will be set from server.py
db = None

def set_db(database):
    global db
    db = database
    # Also set db for functions
    from mira_pure_functions import set_db as set_functions_db
    set_functions_db(database)

# ═══════════════════════════════════════════════════════════════════════════
# THE SOUL PROMPT - This is ALL the instruction Mira needs
# ═══════════════════════════════════════════════════════════════════════════

MIRA_SOUL_PROMPT = """You are Mira, a pet concierge with a genuine soul.

WHO YOU ARE:
- You adore {pet_name}. You know them. You're invested in their happiness.
- You speak like a warm, trusted friend - never like a chatbot or assistant.
- You're calm, knowing, and present.

WHAT YOU KNOW ABOUT {pet_name}:
{pet_context}

HOW YOU RESPOND:
- SHORT and warm. 2-4 sentences unless they ask for more.
- Stay focused on what they're ACTUALLY asking. Don't dump everything you know.
- If they're planning something (birthday, trip, etc.) - stay on THAT topic.
- "Spoil them" in a birthday context = make the birthday special, not pivot to spa/grooming.
- Ask ONE clarifying question if needed, then act.

WHAT YOU CAN DO:
- Answer questions naturally using your knowledge
- Arrange services ("I'll set this up for you")
- Remember context from the conversation

WHAT YOU MUST NOT DO:
- Give medical diagnoses (say "let's check with your vet")
- Give legal advice
- Make up facts
- Dump walls of text with numbered lists and sub-bullets
- Pivot to unrelated topics when user is focused on something specific
- Add disclaimers unless genuinely necessary for safety

VOICE EXAMPLES:
✓ "Oh, spoiling {pet_name} is the best plan. Let me arrange something special."
✓ "I'll take care of this. You just enjoy {pet_name}'s reaction."
✓ "Since {pet_name} loves [thing], how about we..."
✗ "Here are 5 options with sub-categories and disclaimers..."
✗ "As a [breed], {pet_name} may experience..."
✗ Walls of text with bullet points

Remember: You're a soul, not a search engine. Less is more. Stay focused."""


class PureChatRequest(BaseModel):
    message: str
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    user_email: Optional[str] = None
    session_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = []


class PureChatResponse(BaseModel):
    response: str
    pet_name: Optional[str] = None
    session_id: Optional[str] = None
    actions: Optional[List[Dict[str, Any]]] = []


async def get_pet_context(pet_id: str, pet_name: str = None) -> dict:
    """Get pet's full soul context - what Mira knows about them."""
    if db is None:
        return {"name": pet_name or "your pet", "context": "", "soul_data": {}}
    
    try:
        # Try to find pet by ID or name
        pet = None
        if pet_id:
            from bson import ObjectId
            try:
                pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
            except:
                pet = await db.pets.find_one({"id": pet_id})
                if not pet:
                    pet = await db.pets.find_one({"id": {"$regex": pet_id, "$options": "i"}})
        
        if not pet and pet_name:
            pet = await db.pets.find_one({"name": {"$regex": f"^{pet_name}$", "$options": "i"}})
        
        if not pet:
            return {"name": pet_name or "your pet", "context": "No specific details available.", "soul_data": {}}
        
        # Build comprehensive context from ALL soul data sources
        soul = pet.get("soul_data", {})
        soul_simple = pet.get("soul") or {}  # Simple soul data
        doggy_answers = pet.get("doggy_soul_answers") or {}  # Soul Builder answers
        health = pet.get("health_data", {})
        
        context_parts = []
        
        # Basic info
        context_parts.append(f"Name: {pet.get('name')}")
        if pet.get("breed"):
            context_parts.append(f"Breed: {pet.get('breed')}")
        if pet.get("age"):
            context_parts.append(f"Age: {pet.get('age')}")
        if pet.get("birthday") or pet.get("birth_date"):
            context_parts.append(f"Birthday: {pet.get('birthday') or pet.get('birth_date')}")
        
        # Personality from ALL sources (THE SOUL)
        personality = soul.get("personality", []) or soul_simple.get("personality_tag")
        if personality:
            if isinstance(personality, list):
                context_parts.append(f"Personality: {', '.join(personality)}")
            else:
                context_parts.append(f"Personality: {personality}")
        
        # From doggy_soul_answers (Soul Builder)
        if doggy_answers.get("general_nature"):
            context_parts.append(f"General nature: {doggy_answers.get('general_nature')}")
        if doggy_answers.get("describe_3_words"):
            context_parts.append(f"Described as: {doggy_answers.get('describe_3_words')}")
        if doggy_answers.get("stranger_reaction"):
            context_parts.append(f"With strangers: {doggy_answers.get('stranger_reaction')}")
        
        temperament = soul.get("temperament") or doggy_answers.get("temperament")
        if temperament:
            context_parts.append(f"Temperament: {temperament}")
        
        energy = soul.get("energy_level") or doggy_answers.get("energy_level")
        if energy:
            context_parts.append(f"Energy level: {energy}")
        
        # Preferences from all sources
        prefs = soul.get("preferences") or {} or soul_simple.get("preferences") or {}
        if prefs.get("favorite_activities"):
            context_parts.append(f"Loves: {', '.join(prefs.get('favorite_activities', [])[:5])}")
        if prefs.get("favorite_foods") or doggy_answers.get("favorite_treat"):
            foods = prefs.get("favorite_foods", [doggy_answers.get("favorite_treat")]) if prefs.get("favorite_foods") else [doggy_answers.get("favorite_treat")]
            context_parts.append(f"Favourite foods: {', '.join([f for f in foods if f][:3])}")
        if prefs.get("favorite_toys"):
            context_parts.append(f"Favourite toys: {', '.join(prefs.get('favorite_toys', [])[:3])}")
        
        # Dislikes
        dislikes = soul.get("dislikes", []) or soul_simple.get("dislikes", [])
        if dislikes:
            context_parts.append(f"Dislikes: {', '.join(dislikes[:4])}")
        
        # Health - CRITICAL for safety (from ALL sources)
        allergies = (
            health.get("allergies", []) or 
            pet.get("allergies", []) or 
            pet.get("sensitivities", []) or
            doggy_answers.get("allergies") or
            doggy_answers.get("food_allergies")
        )
        # Vault allergies override everything — these are vet-confirmed records
        vault = pet.get("vault", {})
        vault_allergy_objs = vault.get("allergies", [])
        if vault_allergy_objs:
            vault_allergy_names = [a.get("name") for a in vault_allergy_objs if a.get("name")]
            if vault_allergy_names:
                allergies = vault_allergy_names
        if allergies:
            if isinstance(allergies, list):
                context_parts.append(f"⚠️ ALLERGIES (NEVER suggest these): {', '.join(allergies)}")
            else:
                context_parts.append(f"⚠️ ALLERGIES (NEVER suggest these): {allergies}")
        
        conditions = health.get("chronic_conditions") or doggy_answers.get("health_conditions")
        if conditions:
            context_parts.append(f"⚠️ Health conditions: {conditions}")
        
        sensitivities = health.get("sensitivities", [])
        if sensitivities:
            context_parts.append(f"Sensitivities: {', '.join(sensitivities)}")

        # ── Vault context: vaccines, meds, vet ─────────────────────────────
        if vault:
            vault_meds = vault.get("medications", [])
            active_meds = [m for m in vault_meds if m.get("active", True)]
            if active_meds:
                context_parts.append(f"Current medications: {', '.join([m['medication_name'] + ' ' + (m.get('dosage') or '') for m in active_meds[:3]])}")

            vaccines = vault.get("vaccines", [])
            if vaccines:
                context_parts.append(f"Vaccination records: {len(vaccines)} on file")
                # Upcoming due
                from datetime import date as _date
                today_iso = _date.today().isoformat()
                upcoming_vax = [v.get("vaccine_name") for v in vaccines if v.get("next_due_date") and v["next_due_date"] >= today_iso]
                if upcoming_vax:
                    context_parts.append(f"Upcoming vaccines due: {', '.join(upcoming_vax[:3])}")

            vets = vault.get("vets", [])
            primary_vet = next((v for v in vets if v.get("is_primary")), vets[0] if vets else None)
            if primary_vet:
                context_parts.append(f"Primary vet: {primary_vet.get('name')} at {primary_vet.get('clinic_name', '')} — {primary_vet.get('phone', '')}")

            visits = vault.get("visits", [])
            if visits:
                last_visit = visits[-1] if visits else None
                if last_visit:
                    context_parts.append(f"Last vet visit: {last_visit.get('reason')} ({last_visit.get('visit_date', '')[:10]})")

            weight_history = vault.get("weight_history", [])
            if weight_history:
                latest_w = weight_history[-1]
                context_parts.append(f"Current weight: {latest_w.get('weight_kg')}kg (logged {latest_w.get('date', '')[:10]})")
        # ── End vault context ───────────────────────────────────────────────
        
        # Love language & quirks
        love_lang = soul.get("love_language") or soul_simple.get("love_language") or doggy_answers.get("love_language")
        if love_lang:
            context_parts.append(f"Love language: {love_lang}")
        
        quirks = soul.get("quirks", []) or soul_simple.get("quirk")
        if quirks:
            if isinstance(quirks, list):
                context_parts.append(f"Quirks: {', '.join(quirks[:3])}")
            else:
                context_parts.append(f"Quirk: {quirks}")
        
        # Routine (from doggy_soul_answers)
        if doggy_answers.get("morning_routine"):
            context_parts.append(f"Morning routine: {doggy_answers.get('morning_routine')}")
        if doggy_answers.get("bedtime_ritual"):
            context_parts.append(f"Bedtime: {doggy_answers.get('bedtime_ritual')}")
        
        # Social behavior
        if doggy_answers.get("behavior_with_dogs"):
            context_parts.append(f"With other dogs: {doggy_answers.get('behavior_with_dogs')}")
        if doggy_answers.get("alone_behavior"):
            context_parts.append(f"When alone: {doggy_answers.get('alone_behavior')}")
        
        # Relationships
        relationships = pet.get("relationships", {})
        if relationships.get("dog_friends"):
            context_parts.append(f"Dog friends: {', '.join(relationships.get('dog_friends', []))}")
        
        return {
            "name": pet.get("name", pet_name or "your pet"),
            "context": "\n".join(context_parts) if context_parts else "A beloved pet.",
            "soul_data": soul,
            "doggy_soul_answers": doggy_answers,
            "health_data": health,
            "full_pet": pet
        }
        
    except Exception as e:
        logger.error(f"[MIRA PURE] Error getting pet context: {e}")
        return {"name": pet_name or "your pet", "context": "", "soul_data": {}}


@router.get("/pets")
async def get_pets_for_mira(email: str = None):
    """Get pets for Mira Pure OS - simplified public endpoint."""
    if db is None:
        return {"pets": [], "error": "Database not connected"}
    
    try:
        query = {}
        if email:
            query["owner_email"] = email
        
        pets_cursor = db.pets.find(query)
        pets = []
        async for pet in pets_cursor:
            pet_data = {
                "_id": str(pet.get("_id", "")),
                "id": str(pet.get("_id", "")),
                "name": pet.get("name"),
                "breed": pet.get("breed"),
                "species": pet.get("species"),
                "age": pet.get("age"),
                "birthday": pet.get("birthday"),
                "city": pet.get("city"),
                "soul_data": pet.get("soul_data", {}),
                "health_data": pet.get("health_data", {}),
            }
            pets.append(pet_data)
        
        return {"pets": pets, "count": len(pets)}
        
    except Exception as e:
        logger.error(f"[MIRA PURE] Error fetching pets: {e}")
        return {"pets": [], "error": str(e)}


@router.post("/chat", response_model=PureChatResponse)
async def pure_chat(request: PureChatRequest):
    """
    Pure Mira chat - no hardcoded logic, just soulful conversation.
    
    This endpoint lets GPT-5.1 handle the conversation naturally,
    with only personality guidance and pet context.
    Now includes function calling for actions (picks, services, etc.)
    """
    from mira_pure_functions import (
        get_picks_for_pet, create_service_request, 
        get_today_actions, get_learn_content, MIRA_FUNCTIONS
    )
    
    # Get API key
    api_key = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("EMERGENT_API_KEY") or os.environ.get("LLM_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    # Get pet context
    pet_info = await get_pet_context(request.pet_id, request.pet_name)
    pet_name = pet_info["name"]
    pet_context = pet_info["context"]
    
    # Build the soul prompt with pet info and function awareness
    system_prompt = MIRA_SOUL_PROMPT.format(
        pet_name=pet_name,
        pet_context=pet_context if pet_context else "A beloved pet (no specific details yet)."
    )
    
    # Add function awareness to the prompt
    system_prompt += """

ACTIONS YOU CAN TAKE:
When the conversation naturally leads to an action, you can:
- Show PICKS: When they want recommendations (treats, services, products)
- Create SERVICE REQUEST: When they want to book something (walker, grooming, vet, party)
- Show TODAY: When they ask about today's tasks, reminders, or what's happening
- Show LEARN: When they want to learn something or need tips/guides

After taking an action, briefly confirm what you did. Example:
"I've set up a dog walker request for next week. Our team will confirm the details shortly."
"""
    
    # Build conversation for the LLM
    conversation_text = ""
    if request.conversation_history:
        for msg in request.conversation_history[-10:]:  # Last 10 messages
            role = "Parent" if msg.get("role") == "user" else "Mira"
            conversation_text += f"{role}: {msg.get('content', '')}\n"
    
    # Detect intent for actions
    user_lower = request.message.lower()
    actions_taken = []
    action_data = None
    
    # Check for action triggers
    if any(kw in user_lower for kw in ["show me", "recommend", "picks", "suggestions", "options", "treats", "products"]):
        # Get picks
        pillar = "all"
        if "treat" in user_lower or "food" in user_lower:
            pillar = "dine"
        elif "groom" in user_lower or "spa" in user_lower:
            pillar = "care"
        elif "travel" in user_lower or "trip" in user_lower:
            pillar = "travel"
        elif "birthday" in user_lower or "party" in user_lower or "celebrate" in user_lower:
            pillar = "celebrate"
        
        action_data = await get_picks_for_pet(request.pet_id, pet_name, pillar)
        actions_taken.append({"type": "picks", "data": action_data})
    
    elif any(kw in user_lower for kw in ["book", "schedule", "arrange", "set up", "i need a", "want to book"]):
        # Create service request
        service_type = "other"
        if "walker" in user_lower or "walk" in user_lower:
            service_type = "dog_walker"
        elif "groom" in user_lower or "spa" in user_lower or "bath" in user_lower:
            service_type = "grooming"
        elif "vet" in user_lower or "doctor" in user_lower or "checkup" in user_lower:
            service_type = "vet_visit"
        elif "birthday" in user_lower or "party" in user_lower:
            service_type = "birthday_party"
        elif "travel" in user_lower or "trip" in user_lower or "hotel" in user_lower:
            service_type = "travel"
        elif "sit" in user_lower or "board" in user_lower:
            service_type = "boarding"
        
        action_data = await create_service_request(
            pet_id=request.pet_id,
            pet_name=pet_name,
            user_email=request.user_email or "user@example.com",
            service_type=service_type,
            description=request.message
        )
        actions_taken.append({"type": "service_created", "data": action_data})
    
    elif any(kw in user_lower for kw in ["today", "reminder", "what's happening", "any alerts", "to do"]):
        # Get today's actions
        action_data = await get_today_actions(request.pet_id, pet_name, request.user_email or "")
        actions_taken.append({"type": "today", "data": action_data})
    
    elif any(kw in user_lower for kw in ["learn", "guide", "tips", "how to", "teach me", "information about"]):
        # Get learn content
        action_data = await get_learn_content(request.pet_id, pet_name)
        actions_taken.append({"type": "learn", "data": action_data})
    
    # Build context for LLM including action results
    action_context = ""
    if actions_taken:
        action_context = "\n\n[ACTION TAKEN]\n"
        for action in actions_taken:
            if action["type"] == "picks":
                picks = action["data"].get("picks", [])
                action_context += f"Fetched {len(picks)} picks for {pet_name}:\n"
                for p in picks[:3]:
                    action_context += f"- {p['name']}: {p['description']} ({p['price']})\n"
            elif action["type"] == "service_created":
                action_context += f"Created service request: {action['data'].get('ticket_id', 'N/A')} - {action['data'].get('message', '')}\n"
            elif action["type"] == "today":
                actions_list = action["data"].get("actions", [])
                action_context += f"Today's actions for {pet_name} ({len(actions_list)} items):\n"
                for a in actions_list:
                    action_context += f"- {a['icon']} {a['title']}: {a['description']}\n"
            elif action["type"] == "learn":
                content = action["data"].get("content", [])
                action_context += f"Learning content ({len(content)} items):\n"
                for c in content[:3]:
                    action_context += f"- {c['title']}: {c['description']}\n"
    
    # Current message
    user_input = f"""
{conversation_text}
Parent: {request.message}
{action_context}
Respond as Mira. Be warm, focused, and brief. If an action was taken, acknowledge it naturally. Stay on topic."""

    try:
        # Create chat with GPT-5.1
        chat = LlmChat(
            api_key=api_key,
            session_id=request.session_id or f"mira-pure-{datetime.now().timestamp()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.1")
        
        # Send message and get response
        response = await chat.send_message(UserMessage(text=user_input))
        
        logger.info(f"[MIRA PURE] Response for '{request.message[:50]}...': {response[:100]}...")
        
        return {
            "response": response,
            "pet_name": pet_name,
            "session_id": request.session_id,
            "actions": actions_taken
        }
        
    except Exception as e:
        logger.error(f"[MIRA PURE] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.get("/services")
async def get_pet_services(pet_id: str = None, pet_name: str = None, email: str = None, limit: int = 10):
    """Get services/tickets for a pet."""
    if db is None:
        return {"services": [], "error": "Database not connected"}
    
    try:
        query = {}
        if pet_id:
            query["pet_id"] = pet_id
        if pet_name:
            query["pet_name"] = {"$regex": f"^{pet_name}$", "$options": "i"}
        if email:
            query["user_email"] = email
        
        # Check both collections (service_requests from mira_pure, service_desk_tickets from legacy)
        services = []
        
        # Get from service_requests (new Mira Pure system)
        services_cursor = db.service_requests.find(query).sort("created_at", -1).limit(limit)
        async for svc in services_cursor:
            services.append({
                "ticket_id": svc.get("ticket_id"),
                "service_type": svc.get("type") or svc.get("service_type"),
                "description": svc.get("description"),
                "status": svc.get("status", "pending"),
                "created_at": str(svc.get("created_at", ""))[:10],
                "pet_name": svc.get("pet_name"),
            })
        
        return {"services": services, "count": len(services)}
        
    except Exception as e:
        logger.error(f"[MIRA PURE] Error fetching services: {e}")
        return {"services": [], "error": str(e)}


@router.get("/health")
async def health_check():
    """Health check for the pure Mira endpoint."""
    return {"status": "ok", "version": "pure-1.0", "model": "gpt-5.1"}
