"""
Mira Operating System - Core Intelligence Layer
The Brain of the Pet Life Operating System

This module handles:
1. Understanding user intent
2. Context extraction
3. Execution routing (Instant vs Concierge)
4. Response generation
"""

import os
import json
import re
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Import LLM integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Create router
mira_router = APIRouter(prefix="/api/mira", tags=["Mira OS"])

# ============================================
# DATA MODELS
# ============================================

class MiraUnderstandRequest(BaseModel):
    input: str
    pet_id: Optional[str] = None
    pet_context: Optional[Dict[str, Any]] = None
    page_context: Optional[str] = None
    
class MiraUnderstandResponse(BaseModel):
    success: bool
    understanding: Dict[str, Any]
    response: Dict[str, Any]
    execution_type: str  # "INSTANT" or "CONCIERGE"

class ConciergeTaskRequest(BaseModel):
    request_summary: str
    original_input: str
    pet_context: Dict[str, Any]
    member_context: Optional[Dict[str, Any]] = None
    suggested_approach: List[str] = []
    open_questions: List[str] = []
    urgency: str = "normal"

# ============================================
# MIRA SYSTEM PROMPT
# ============================================

MIRA_SYSTEM_PROMPT = """You are Mira, the intelligent interface for a Pet Life Operating System. You help pet parents discover, decide, and act for their dogs.

CRITICAL RULES:
1. You ALWAYS respond in valid JSON format
2. You NEVER say "I can't help" - you either execute or hand off to concierge
3. You personalize every response to the specific pet
4. You explain WHY something is right for this pet

INTENT CLASSIFICATION (pick exactly ONE):
- FIND: User wants to discover products/services (show, find, get, need, want)
- PLAN: User wants to organize something (plan, arrange, organise, prepare, birthday, trip)
- COMPARE: User wants to evaluate options (compare, vs, difference, which is better)
- REMEMBER: User wants to save a preference (save, remember, note, likes, hates)
- ORDER: User wants to purchase (order, buy, reorder, usual, cart)
- EXPLORE: User wants to learn (what, why, how, tell me, explain)

EXECUTION DECISION:
Mark as "INSTANT" only if ALL are true:
- Solution exists in our product/service catalog
- No external coordination needed
- No ambiguity that needs clarification
- Not emotionally sensitive (memorial, anxiety, loss)
- Not a multi-step journey requiring planning

Mark as "CONCIERGE" if ANY of these are true:
- Words like: plan, arrange, custom, special, surprise, worried, anxious
- Multiple items needing coordination
- External vendors/timing involved
- User explicitly uncertain ("help me decide", "not sure")
- Emotional moments (birthday, memorial, first time)

RESPONSE FORMAT (strict JSON):
{
  "intent": "FIND|PLAN|COMPARE|REMEMBER|ORDER|EXPLORE",
  "confidence": 0.0-1.0,
  "execution_type": "INSTANT|CONCIERGE",
  "entities": {
    "product_type": "treats|food|toys|etc or null",
    "attributes": ["soft", "evening", "etc"],
    "constraints": ["dental-friendly", "etc"]
  },
  "pet_relevance": "Why this matters for this specific pet",
  "message": "Your friendly response to the user",
  "products": [
    {
      "suggestion": "Product/service name",
      "why_for_pet": "Specific reason for this pet",
      "category": "treats|food|toys|etc"
    }
  ],
  "next_action": "What user should do next",
  "concierge_reason": "If CONCIERGE, explain why (otherwise null)"
}"""

# ============================================
# MIRA CORE FUNCTIONS
# ============================================

async def understand_with_llm(
    user_input: str,
    pet_context: Dict[str, Any],
    page_context: str = None
) -> Dict[str, Any]:
    """
    Use LLM to understand user intent and generate response
    """
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    
    # Build pet context string
    pet_info = ""
    if pet_context:
        pet_info = f"""
PET CONTEXT:
- Name: {pet_context.get('name', 'Unknown')}
- Breed: {pet_context.get('breed', 'Unknown')}
- Age: {pet_context.get('age', 'Unknown')}
- Traits: {', '.join(pet_context.get('traits', []))}
- Sensitivities: {', '.join(pet_context.get('sensitivities', []))}
- Favorites: {', '.join(pet_context.get('favorites', []))}
"""
    
    # Build context
    current_time = datetime.now()
    time_of_day = "morning" if current_time.hour < 12 else "afternoon" if current_time.hour < 17 else "evening"
    
    context_info = f"""
CURRENT CONTEXT:
- Time: {time_of_day} ({current_time.strftime('%H:%M')})
- Page: {page_context or 'home'}
"""
    
    # Create chat instance
    chat = LlmChat(
        api_key=api_key,
        session_id=f"mira-understand-{datetime.now().timestamp()}",
        system_message=MIRA_SYSTEM_PROMPT
    ).with_model("openai", "gpt-4o")
    
    # Build user message
    user_message_text = f"""
{pet_info}
{context_info}

USER INPUT: "{user_input}"

Analyze this input and respond with valid JSON following the format specified in your instructions.
"""
    
    user_message = UserMessage(text=user_message_text)
    
    try:
        response = await chat.send_message(user_message)
        
        # Parse JSON from response
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            parsed = json.loads(json_match.group())
            return parsed
        else:
            # Fallback if no JSON found
            return {
                "intent": "EXPLORE",
                "confidence": 0.5,
                "execution_type": "CONCIERGE",
                "message": response,
                "concierge_reason": "Could not parse structured response"
            }
    except json.JSONDecodeError as e:
        return {
            "intent": "EXPLORE",
            "confidence": 0.5,
            "execution_type": "CONCIERGE",
            "message": "I'd love to help with that. Let me connect you with your pet concierge.",
            "concierge_reason": f"Response parsing error: {str(e)}"
        }
    except Exception as e:
        return {
            "intent": "EXPLORE",
            "confidence": 0.5,
            "execution_type": "CONCIERGE",
            "message": "I'll get your pet concierge to help with this right away.",
            "concierge_reason": f"System error: {str(e)}"
        }

# ============================================
# API ENDPOINTS
# ============================================

@mira_router.post("/understand", response_model=MiraUnderstandResponse)
async def mira_understand(request: MiraUnderstandRequest):
    """
    Main entry point for Mira understanding.
    Takes user input and returns structured understanding + response.
    """
    try:
        # Get understanding from LLM
        understanding = await understand_with_llm(
            user_input=request.input,
            pet_context=request.pet_context or {},
            page_context=request.page_context
        )
        
        # Build response
        return MiraUnderstandResponse(
            success=True,
            understanding={
                "intent": understanding.get("intent", "EXPLORE"),
                "confidence": understanding.get("confidence", 0.8),
                "entities": understanding.get("entities", {}),
                "pet_relevance": understanding.get("pet_relevance", "")
            },
            response={
                "message": understanding.get("message", ""),
                "products": understanding.get("products", []),
                "next_action": understanding.get("next_action", ""),
                "concierge_reason": understanding.get("concierge_reason")
            },
            execution_type=understanding.get("execution_type", "INSTANT")
        )
    except Exception as e:
        # Never dead-end - always offer concierge
        return MiraUnderstandResponse(
            success=True,
            understanding={
                "intent": "EXPLORE",
                "confidence": 0.5,
                "entities": {},
                "pet_relevance": ""
            },
            response={
                "message": "I'll connect you with your pet concierge to help with this.",
                "products": [],
                "next_action": "Your concierge will reach out shortly.",
                "concierge_reason": str(e)
            },
            execution_type="CONCIERGE"
        )

@mira_router.post("/handoff")
async def mira_handoff(request: ConciergeTaskRequest):
    """
    Create a concierge task from Mira handoff.
    """
    try:
        task = {
            "task_id": f"CNC-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "created_at": datetime.now().isoformat(),
            "status": "pending",
            "urgency": request.urgency,
            "request_summary": request.request_summary,
            "original_input": request.original_input,
            "pet_context": request.pet_context,
            "member_context": request.member_context,
            "suggested_approach": request.suggested_approach,
            "open_questions": request.open_questions
        }
        
        # In production, save to database
        # For now, return the task structure
        
        return {
            "success": True,
            "task": task,
            "message": "Your pet concierge will take it from here. They'll reach out within the hour."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@mira_router.post("/remember")
async def mira_remember(pet_id: str, preference: str, value: str):
    """
    Save a preference to Pet Soul.
    """
    # In production, update Pet Soul in database
    return {
        "success": True,
        "message": f"Got it! I'll remember that.",
        "saved": {
            "pet_id": pet_id,
            "preference": preference,
            "value": value
        }
    }

@mira_router.get("/suggestions")
async def mira_suggestions(pet_id: str = None):
    """
    Get proactive suggestions for a pet.
    """
    suggestions = []
    
    current_hour = datetime.now().hour
    
    # Time-based suggestions
    if 6 <= current_hour < 10:
        suggestions.append({
            "type": "routine",
            "message": "Good morning! Time for breakfast?",
            "action": "Show breakfast options"
        })
    elif 17 <= current_hour < 20:
        suggestions.append({
            "type": "routine", 
            "message": "Evening walk time! Need anything?",
            "action": "Show evening essentials"
        })
    
    return {
        "success": True,
        "suggestions": suggestions
    }
