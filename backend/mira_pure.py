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
        
        if not pet and pet_name:
            pet = await db.pets.find_one({"name": {"$regex": f"^{pet_name}$", "$options": "i"}})
        
        if not pet:
            return {"name": pet_name or "your pet", "context": "No specific details available.", "soul_data": {}}
        
        # Build comprehensive context from soul data
        soul = pet.get("soul_data", {})
        health = pet.get("health_data", {})
        
        context_parts = []
        
        # Basic info
        context_parts.append(f"Name: {pet.get('name')}")
        if pet.get("breed"):
            context_parts.append(f"Breed: {pet.get('breed')}")
        if pet.get("age"):
            context_parts.append(f"Age: {pet.get('age')}")
        if pet.get("birthday"):
            context_parts.append(f"Birthday: {pet.get('birthday')}")
        
        # Personality (THE SOUL)
        personality = soul.get("personality", [])
        if personality:
            if isinstance(personality, list):
                context_parts.append(f"Personality: {', '.join(personality)}")
            else:
                context_parts.append(f"Personality: {personality}")
        
        if soul.get("temperament"):
            context_parts.append(f"Temperament: {soul.get('temperament')}")
        
        if soul.get("energy_level"):
            context_parts.append(f"Energy level: {soul.get('energy_level')}/10")
        
        # Preferences
        prefs = soul.get("preferences", {})
        if prefs.get("favorite_activities"):
            context_parts.append(f"Loves: {', '.join(prefs.get('favorite_activities', [])[:5])}")
        if prefs.get("favorite_foods"):
            context_parts.append(f"Favorite foods: {', '.join(prefs.get('favorite_foods', [])[:3])}")
        if prefs.get("favorite_toys"):
            context_parts.append(f"Favorite toys: {', '.join(prefs.get('favorite_toys', [])[:3])}")
        
        # Dislikes
        dislikes = soul.get("dislikes", [])
        if dislikes:
            context_parts.append(f"Dislikes: {', '.join(dislikes[:4])}")
        
        # Health - CRITICAL for safety
        allergies = health.get("allergies", []) or pet.get("allergies", [])
        if allergies:
            context_parts.append(f"⚠️ ALLERGIES: {', '.join(allergies)}")
        
        conditions = health.get("chronic_conditions")
        if conditions:
            context_parts.append(f"⚠️ Health: {conditions}")
        
        sensitivities = health.get("sensitivities", [])
        if sensitivities:
            context_parts.append(f"Sensitivities: {', '.join(sensitivities)}")
        
        # Love language & quirks
        if soul.get("love_language"):
            context_parts.append(f"Love language: {soul.get('love_language')}")
        
        quirks = soul.get("quirks", [])
        if quirks:
            context_parts.append(f"Quirks: {', '.join(quirks[:3])}")
        
        # Relationships
        relationships = pet.get("relationships", {})
        if relationships.get("dog_friends"):
            context_parts.append(f"Dog friends: {', '.join(relationships.get('dog_friends', []))}")
        
        return {
            "name": pet.get("name", pet_name or "your pet"),
            "context": "\n".join(context_parts) if context_parts else "A beloved pet.",
            "soul_data": soul,
            "health_data": health,
            "full_pet": pet
        }
        
    except Exception as e:
        logger.error(f"[MIRA PURE] Error getting pet context: {e}")
        return {"name": pet_name or "your pet", "context": "", "soul_data": {}}
        
        # Build a concise context summary
        context_parts = []
        
        if pet.get("breed"):
            context_parts.append(f"Breed: {pet.get('breed')}")
        if pet.get("age"):
            context_parts.append(f"Age: {pet.get('age')}")
        if pet.get("birthday"):
            context_parts.append(f"Birthday: {pet.get('birthday')}")
        
        # Soul data
        soul = pet.get("soul_data", {})
        if soul.get("personality"):
            context_parts.append(f"Personality: {soul.get('personality')}")
        if soul.get("favorite_activities"):
            context_parts.append(f"Loves: {', '.join(soul.get('favorite_activities', []))}")
        if soul.get("dietary_preferences"):
            context_parts.append(f"Food preferences: {', '.join(soul.get('dietary_preferences', []))}")
        
        # Allergies/sensitivities
        allergies = pet.get("allergies", []) or pet.get("sensitivities", [])
        if allergies:
            context_parts.append(f"Allergies/Avoid: {', '.join(allergies)}")
        
        # Health notes (brief)
        health = pet.get("health_notes") or pet.get("medical_history")
        if health and isinstance(health, str):
            context_parts.append(f"Health: {health[:100]}")
        
        return {
            "name": pet.get("name", pet_name or "your pet"),
            "context": "\n".join(context_parts) if context_parts else "A beloved pet."
        }
        
    except Exception as e:
        logger.error(f"[MIRA PURE] Error getting pet context: {e}")
        return {"name": pet_name or "your pet", "context": ""}


@router.post("/chat", response_model=PureChatResponse)
async def pure_chat(request: PureChatRequest):
    """
    Pure Mira chat - no hardcoded logic, just soulful conversation.
    
    This endpoint lets GPT-5.1 handle the conversation naturally,
    with only personality guidance and pet context.
    """
    
    # Get API key
    api_key = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("EMERGENT_API_KEY") or os.environ.get("LLM_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    # Get pet context
    pet_info = await get_pet_context(request.pet_id, request.pet_name)
    pet_name = pet_info["name"]
    pet_context = pet_info["context"]
    
    # Build the soul prompt with pet info
    system_prompt = MIRA_SOUL_PROMPT.format(
        pet_name=pet_name,
        pet_context=pet_context if pet_context else "A beloved pet (no specific details yet)."
    )
    
    # Build conversation for the LLM
    conversation_text = ""
    if request.conversation_history:
        for msg in request.conversation_history[-10:]:  # Last 10 messages
            role = "Parent" if msg.get("role") == "user" else "Mira"
            conversation_text += f"{role}: {msg.get('content', '')}\n"
    
    # Current message
    user_input = f"""
{conversation_text}
Parent: {request.message}

Respond as Mira. Be warm, focused, and brief. Stay on topic."""

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
        
        return PureChatResponse(
            response=response,
            pet_name=pet_name,
            session_id=request.session_id
        )
        
    except Exception as e:
        logger.error(f"[MIRA PURE] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check for the pure Mira endpoint."""
    return {"status": "ok", "version": "pure-1.0", "model": "gpt-5.1"}
