"""
Mira Structured Engine - Core Orchestration
============================================
The brain of Mira OS.

Every turn:
1. Load pet memory
2. LLM decides action (respond | ask | recommend | execute)
3. Handle ticket state
4. Build structured response

NO keyword matching. Trust the LLM with full context.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
import logging
import os
import json

from .schemas import (
    MiraTurnRequest, MiraTurnResponse, 
    Pillar, Intent, Action, TicketStatus, ActiveTab,
    QuickReply, ClarifyingQuestion, TicketState,
    PickItem, ServiceItem, UIContext
)
from .question_registry import (
    get_questions_for_service, get_next_question,
    get_missing_required_fields, is_ticket_complete,
    Question, QuestionOption
)
from .memory_assembler import (
    assemble_pet_memory, build_llm_context_block
)
from .ticket_manager import (
    get_or_create_ticket_for_intent, update_ticket_field, get_ticket_state
)

logger = logging.getLogger(__name__)

# Database reference
_db = None

# LLM client (set by server.py)
_llm_client = None


def set_engine_db(db):
    """Set database reference"""
    global _db
    _db = db
    
    # Also set for sub-modules
    from . import memory_assembler, ticket_manager
    memory_assembler.set_memory_db(db)
    ticket_manager.set_ticket_db(db)


def set_llm_client(client):
    """Set LLM client"""
    global _llm_client
    _llm_client = client


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATION
# ═══════════════════════════════════════════════════════════════════════════════

async def run_mira_turn(request: MiraTurnRequest) -> MiraTurnResponse:
    """
    Main entry point for every Mira conversation turn.
    
    This is the structured engine that replaces keyword matching.
    """
    
    try:
        # Step 1: Assemble pet memory
        pet_memory = await assemble_pet_memory(
            pet_context=request.pet_context.model_dump(),
            user_id=request.user_id,
            include_tickets=True,
            include_signals=True,
        )
        
        # Step 2: Check for existing draft ticket (if continuing flow)
        existing_ticket = None
        if request.ui_context.draft_ticket_id:
            existing_ticket = await get_ticket_state(request.ui_context.draft_ticket_id)
        
        # Step 3: Build LLM context
        llm_context = build_llm_context_block(
            pet_memory,
            request.ui_context.model_dump()
        )
        
        # Step 4: Call LLM to understand intent and decide action
        llm_decision = await get_llm_decision(
            user_message=request.message,
            pet_context=llm_context,
            pet_name=request.pet_context.name,
            conversation_history=request.conversation_history,
            active_tab=request.ui_context.active_tab.value,
            existing_ticket=existing_ticket,
        )
        
        # Step 5: Execute based on LLM decision
        response = await execute_decision(
            decision=llm_decision,
            request=request,
            pet_memory=pet_memory,
            existing_ticket=existing_ticket,
        )
        
        return response
        
    except Exception as e:
        logger.error(f"[MIRA ENGINE] Error: {e}", exc_info=True)
        return MiraTurnResponse(
            success=False,
            response="I'm sorry, I had trouble processing that. Could you try again?",
            session_id=request.session_id,
            intent=Intent.GENERAL_CHAT,
            action=Action.RESPOND,
        )


# ═══════════════════════════════════════════════════════════════════════════════
# LLM DECISION
# ═══════════════════════════════════════════════════════════════════════════════

async def get_llm_decision(
    user_message: str,
    pet_context: str,
    pet_name: str,
    conversation_history: List[Dict[str, str]],
    active_tab: str,
    existing_ticket: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Call LLM to understand intent and decide action.
    
    Returns structured decision, not free text.
    """
    
    # Build system prompt for decision
    system_prompt = f"""You are Mira, an intelligent pet care assistant for The Doggy Company.

{pet_context}

CURRENT CONTEXT:
- Active tab: {active_tab}
- Existing ticket: {json.dumps(existing_ticket) if existing_ticket else 'None'}

YOUR TASK:
Analyze the user's message and return a JSON decision with:
1. "pillar": Which service category (care/dine/stay/celebrate/travel/enjoy/learn/shop/advisory)
2. "intent": What user wants (book_service/recommend/advise/clarify/status_check/general_chat)
3. "action": What to do (respond/ask/recommend/execute)
4. "service_type": If booking, which service (grooming/vet_visit/boarding/etc)
5. "response": Your conversational response to the user
6. "extracted_fields": Any booking details you can extract from the message

RULES:
- If user clearly wants to book something → action = "execute" (create/update ticket)
- If you need more info to proceed → action = "ask"
- If user wants suggestions → action = "recommend"
- Otherwise → action = "respond"
- Always be warm and personal - you KNOW {pet_name}
- Never ask about allergies if you already have them in context
- Speak from memory: "I know {pet_name} prefers..." not "From what I know about [breed]..."

Return ONLY valid JSON, no other text."""

    # Build messages
    messages = []
    
    # Add conversation history (last 5 turns)
    for turn in conversation_history[-5:]:
        messages.append({
            "role": turn.get("role", "user"),
            "content": turn.get("content", "")
        })
    
    # Add current message
    messages.append({
        "role": "user",
        "content": user_message
    })
    
    # Call LLM
    try:
        if _llm_client:
            response = await _call_llm(system_prompt, messages)
            decision = _parse_llm_response(response, pet_name)
            return decision
        else:
            # Fallback if no LLM client
            logger.warning("[MIRA ENGINE] No LLM client, using fallback")
            return _fallback_decision(user_message, pet_name, existing_ticket)
            
    except Exception as e:
        logger.error(f"[MIRA ENGINE] LLM error: {e}")
        return _fallback_decision(user_message, pet_name, existing_ticket)


async def _call_llm(system_prompt: str, messages: List[Dict[str, str]]) -> str:
    """Call the LLM (Claude via Emergent)"""
    
    try:
        # Use emergentintegrations if available
        from emergentintegrations.llm.chat import chat, UserMessage, SystemMessage
        
        # Convert messages
        llm_messages = [SystemMessage(content=system_prompt)]
        for m in messages:
            if m["role"] == "user":
                llm_messages.append(UserMessage(content=m["content"]))
        
        result = await chat(
            api_key=os.environ.get("EMERGENT_API_KEY", ""),
            model="claude-sonnet-4-20250514",
            messages=llm_messages,
        )
        
        return result.message
        
    except ImportError:
        logger.warning("[MIRA ENGINE] emergentintegrations not available")
        raise
    except Exception as e:
        logger.error(f"[MIRA ENGINE] LLM call failed: {e}")
        raise


def _parse_llm_response(response: str, pet_name: str) -> Dict[str, Any]:
    """Parse LLM response into structured decision"""
    
    try:
        # Try to extract JSON from response
        response = response.strip()
        
        # Handle markdown code blocks
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]
        
        decision = json.loads(response)
        
        # Validate required fields
        if "action" not in decision:
            decision["action"] = "respond"
        if "intent" not in decision:
            decision["intent"] = "general_chat"
        if "response" not in decision:
            decision["response"] = f"I'm here to help with {pet_name}!"
        
        return decision
        
    except json.JSONDecodeError:
        logger.warning(f"[MIRA ENGINE] Could not parse LLM response as JSON")
        return {
            "action": "respond",
            "intent": "general_chat",
            "response": response,  # Use raw response
            "pillar": "advisory",
        }


def _fallback_decision(user_message: str, pet_name: str, existing_ticket: Optional[Dict]) -> Dict[str, Any]:
    """Fallback decision when LLM is unavailable"""
    
    msg_lower = user_message.lower()
    
    # Simple intent detection as fallback
    if any(word in msg_lower for word in ["groom", "bath", "haircut", "nail"]):
        return {
            "action": "execute",
            "intent": "book_service",
            "service_type": "grooming",
            "pillar": "care",
            "response": f"I'd love to help arrange grooming for {pet_name}! Let me set that up.",
            "extracted_fields": {},
        }
    elif any(word in msg_lower for word in ["vet", "doctor", "vaccine", "checkup"]):
        return {
            "action": "execute",
            "intent": "book_service",
            "service_type": "vet_visit",
            "pillar": "care",
            "response": f"I can help arrange a vet visit for {pet_name}.",
            "extracted_fields": {},
        }
    elif any(word in msg_lower for word in ["board", "daycare", "stay", "sitting"]):
        return {
            "action": "execute",
            "intent": "book_service",
            "service_type": "boarding",
            "pillar": "stay",
            "response": f"Let me help you find the right stay option for {pet_name}.",
            "extracted_fields": {},
        }
    else:
        return {
            "action": "respond",
            "intent": "general_chat",
            "pillar": "advisory",
            "response": f"I'm here to help with anything for {pet_name}. What do you need?",
        }


# ═══════════════════════════════════════════════════════════════════════════════
# DECISION EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

async def execute_decision(
    decision: Dict[str, Any],
    request: MiraTurnRequest,
    pet_memory: Dict[str, Any],
    existing_ticket: Optional[Dict[str, Any]] = None,
) -> MiraTurnResponse:
    """Execute the LLM's decision and build response"""
    
    action = decision.get("action", "respond")
    intent = decision.get("intent", "general_chat")
    pillar = decision.get("pillar", "advisory")
    service_type = decision.get("service_type")
    response_text = decision.get("response", "")
    extracted_fields = decision.get("extracted_fields", {})
    
    # Map to enums
    try:
        pillar_enum = Pillar(pillar) if pillar else None
    except ValueError:
        pillar_enum = Pillar.ADVISORY
    
    try:
        intent_enum = Intent(intent)
    except ValueError:
        intent_enum = Intent.GENERAL_CHAT
    
    try:
        action_enum = Action(action)
    except ValueError:
        action_enum = Action.RESPOND
    
    # Build base response
    response = MiraTurnResponse(
        success=True,
        response=response_text,
        session_id=request.session_id,
        pillar=pillar_enum,
        intent=intent_enum,
        action=action_enum,
    )
    
    # Handle EXECUTE action (create/update ticket)
    if action_enum == Action.EXECUTE and service_type:
        ticket_result = await handle_execute_action(
            service_type=service_type,
            request=request,
            extracted_fields=extracted_fields,
            existing_ticket=existing_ticket,
        )
        
        response.ticket = TicketState(
            id=ticket_result.get("ticket_id"),
            status=TicketStatus(ticket_result.get("status", "draft")),
            service_type=service_type,
            filled_fields=ticket_result.get("filled_fields", {}),
            missing_fields=ticket_result.get("missing_fields", []),
            summary=f"{service_type.replace('_', ' ').title()} for {request.pet_context.name}",
        )
        
        # If there are missing fields, we need to ASK
        if ticket_result.get("missing_fields"):
            response.action = Action.ASK
            
            # Get next question
            next_q = get_next_question(service_type, ticket_result.get("filled_fields", {}))
            if next_q:
                response.clarifying_question = build_clarifying_question(
                    next_q, 
                    request.pet_context.name,
                    request.pet_context.model_dump()
                )
                response.quick_replies = response.clarifying_question.options
                
                # Update response text to include question
                if not response_text.endswith("?"):
                    response.response = f"{response_text}\n\n{response.clarifying_question.question_text}"
    
    # Handle ASK action (clarification needed)
    elif action_enum == Action.ASK and existing_ticket:
        # User is answering a question
        if request.ui_context.active_question_id:
            # Extract answer from message
            answer = extract_answer_from_message(
                request.message,
                request.ui_context.active_question_id,
                existing_ticket.get("service_type")
            )
            
            if answer:
                # Update ticket
                ticket_result = await update_ticket_field(
                    ticket_id=existing_ticket.get("id"),
                    field_name=answer["field_name"],
                    field_value=answer["value"],
                )
                
                response.ticket = TicketState(
                    id=ticket_result.get("ticket_id"),
                    status=TicketStatus(ticket_result.get("status", "pending_info")),
                    service_type=existing_ticket.get("service_type"),
                    filled_fields=ticket_result.get("filled_fields", {}),
                    missing_fields=ticket_result.get("missing_fields", []),
                )
                
                # Check if more questions needed
                if ticket_result.get("missing_fields"):
                    next_q = get_next_question(
                        existing_ticket.get("service_type"),
                        ticket_result.get("filled_fields", {})
                    )
                    if next_q:
                        response.clarifying_question = build_clarifying_question(
                            next_q,
                            request.pet_context.name,
                            request.pet_context.model_dump()
                        )
                        response.quick_replies = response.clarifying_question.options
    
    # Handle RECOMMEND action
    elif action_enum == Action.RECOMMEND:
        response.picks = build_picks_for_context(
            pillar=pillar,
            pet_context=request.pet_context.model_dump(),
            active_tab=request.ui_context.active_tab,
        )
    
    # Tab-aware hints
    if pillar_enum == Pillar.CARE and response.ticket.id:
        response.active_tab_hint = ActiveTab.CONCIERGE
    
    return response


async def handle_execute_action(
    service_type: str,
    request: MiraTurnRequest,
    extracted_fields: Dict[str, Any],
    existing_ticket: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Handle ticket creation/update for execute action"""
    
    # Map pillar from service type
    pillar_map = {
        "grooming": "care",
        "vet_visit": "care",
        "boarding": "stay",
        "daycare": "stay",
        "pet_sitting": "stay",
    }
    pillar = pillar_map.get(service_type, "care")
    
    # Get or create ticket
    ticket_result = await get_or_create_ticket_for_intent(
        service_type=service_type,
        pet_id=request.pet_context.id,
        pet_name=request.pet_context.name,
        user_id=request.user_id,
        user_email=request.user_id,  # Often same
        existing_ticket_id=existing_ticket.get("id") if existing_ticket else None,
        initial_fields=extracted_fields,
        pillar=pillar,
    )
    
    return ticket_result


def build_clarifying_question(
    question: Question,
    pet_name: str,
    pet_context: Dict[str, Any]
) -> ClarifyingQuestion:
    """Build a clarifying question with pet-safe options"""
    
    # Replace {pet_name} in question text
    question_text = question.question_text.replace("{pet_name}", pet_name)
    
    # Build options with pet-safe filtering
    options = []
    for opt in question.options:
        quick_reply = QuickReply(
            label=opt.label,
            value=opt.value,
            action="send_message",
            disabled=False,
        )
        
        # Pet-safe filtering
        if opt.excludes:
            for key, val in opt.excludes.items():
                if pet_context.get(key) == val:
                    quick_reply.disabled = True
                    quick_reply.disabled_reason = f"Not recommended for {pet_name}"
        
        options.append(quick_reply)
    
    # LLM reordering based on pet context (simple version)
    options = reorder_options_for_pet(options, question.question_id, pet_context)
    
    return ClarifyingQuestion(
        question_id=question.question_id,
        question_text=question_text,
        options=options,
        required=question.required,
        field_name=question.field_name,
    )


def reorder_options_for_pet(
    options: List[QuickReply],
    question_id: str,
    pet_context: Dict[str, Any]
) -> List[QuickReply]:
    """Reorder options based on pet preferences"""
    
    # Simple reordering rules
    if question_id == "grooming.location_mode":
        # If pet is noise-sensitive or anxious, put "At home" first
        loud_sounds = (pet_context.get("loud_sounds_reaction") or "").lower()
        anxiety = (pet_context.get("separation_anxiety") or "").lower()
        grooming_pref = (pet_context.get("grooming_preference") or "").lower()
        
        if any(word in loud_sounds for word in ["scared", "anxious", "nervous"]):
            # Move "at_home" to front
            options = sorted(options, key=lambda x: 0 if x.value == "at_home" else 1)
        elif grooming_pref == "salon":
            options = sorted(options, key=lambda x: 0 if x.value == "salon" else 1)
    
    return options


def extract_answer_from_message(
    message: str,
    question_id: str,
    service_type: str
) -> Optional[Dict[str, Any]]:
    """Extract answer value from user message"""
    
    questions = get_questions_for_service(service_type)
    question = questions.get(question_id)
    
    if not question:
        return None
    
    msg_lower = message.lower().strip()
    
    # Check against options
    for opt in question.options:
        if opt.value.lower() in msg_lower or opt.label.lower() in msg_lower:
            return {
                "field_name": question.field_name,
                "value": opt.value,
            }
    
    # If no match, use message as free text value
    return {
        "field_name": question.field_name,
        "value": message,
    }


def build_picks_for_context(
    pillar: str,
    pet_context: Dict[str, Any],
    active_tab: ActiveTab,
) -> List[PickItem]:
    """Build recommended picks based on context"""
    
    # This would integrate with your product/service catalog
    # For now, return empty - to be implemented with catalog integration
    return []
