"""
Mira Streaming Service - Response Streaming via Server-Sent Events
===================================================================
Provides real-time streaming of Mira's responses for perceived speed.

MIRA IS THE SOUL. When she speaks, her words flow naturally, not all at once.
"""

import asyncio
import json
import logging
import os
from typing import AsyncGenerator, Dict, Any, Optional
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira", tags=["mira-streaming"])

# ═══════════════════════════════════════════════════════════════════════════════
# REQUEST MODEL
# ═══════════════════════════════════════════════════════════════════════════════

class MiraStreamRequest(BaseModel):
    input: str
    pet_id: Optional[str] = None
    pet_context: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[Dict[str, str]]] = []
    session_id: Optional[str] = None
    last_shown_items: Optional[List[Dict[str, Any]]] = []
    last_search_context: Optional[Dict[str, Any]] = None
    archetype: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# STREAMING ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

async def generate_stream(
    message: str,
    products: List[Dict] = None,
    tip_card: Dict = None,
    intelligence: Dict = None,
    execution_type: str = "INSTANT",
    metadata: Dict = None
) -> AsyncGenerator[str, None]:
    """
    Generate SSE stream for Mira's response.
    
    Event types:
    - token: Individual word/token of the message
    - products: Product recommendations
    - tip_card: Advisory tip card
    - intelligence: Context resolution info
    - metadata: Response metadata
    - done: Stream complete
    """
    
    # Send metadata first (silent, for frontend state)
    if metadata:
        yield f"event: metadata\ndata: {json.dumps(metadata)}\n\n"
    
    # Send intelligence info (if context was used)
    if intelligence and intelligence.get("context_used"):
        yield f"event: intelligence\ndata: {json.dumps(intelligence)}\n\n"
    
    # Stream the message word by word
    words = message.split(' ')
    accumulated = ""
    
    for i, word in enumerate(words):
        accumulated += word + " "
        
        # Send token event
        token_data = {
            "token": word + " ",
            "accumulated": accumulated.strip(),
            "progress": (i + 1) / len(words),
            "done": False
        }
        yield f"event: token\ndata: {json.dumps(token_data)}\n\n"
        
        # Natural typing speed - varies slightly for realism
        # Faster for common words, slower for longer words
        base_delay = 0.02  # 20ms base
        word_delay = min(len(word) * 0.008, 0.05)  # Max 50ms extra for long words
        await asyncio.sleep(base_delay + word_delay)
    
    # Send final message complete event
    yield f"event: message_complete\ndata: {json.dumps({'message': message})}\n\n"
    
    # Stream products if any (after message)
    if products and len(products) > 0:
        await asyncio.sleep(0.1)  # Brief pause before products
        yield f"event: products\ndata: {json.dumps({'products': products, 'count': len(products)})}\n\n"
    
    # Stream tip card if any
    if tip_card:
        await asyncio.sleep(0.1)
        yield f"event: tip_card\ndata: {json.dumps(tip_card)}\n\n"
    
    # Final done event
    done_data = {
        "done": True,
        "execution_type": execution_type,
        "products_count": len(products) if products else 0,
        "has_tip_card": tip_card is not None
    }
    yield f"event: done\ndata: {json.dumps(done_data)}\n\n"


@router.post("/os/stream")
async def mira_stream_response(request: MiraStreamRequest):
    """
    Stream Mira's response via Server-Sent Events.
    
    This endpoint:
    1. Processes the request through the intelligence layer
    2. Gets the full response from LLM
    3. Streams the response word by word
    4. Sends products/tip cards after message completes
    
    Frontend should use EventSource or fetch with streaming body.
    """
    try:
        # Import the main understand function
        from mira_routes import mira_os_understand_with_products
        from mira_routes import MiraOSUnderstandRequest
        
        # Build the full request for the main endpoint
        full_request = MiraOSUnderstandRequest(
            input=request.input,
            pet_id=request.pet_id,
            pet_context=request.pet_context,
            conversation_history=request.conversation_history,
            session_id=request.session_id,
            last_shown_items=request.last_shown_items,
            last_search_context=request.last_search_context,
            include_products=True,
            archetype=request.archetype
        )
        
        # Get the full response (non-streaming)
        response = await mira_os_understand_with_products(full_request)
        
        # Extract response data
        message = response.get("response", {}).get("message", "I'm here to help!")
        products = response.get("response", {}).get("products", [])
        tip_card = response.get("response", {}).get("tip_card")
        intelligence = response.get("intelligence", {})
        execution_type = response.get("execution_type", "INSTANT")
        
        # Build metadata
        metadata = {
            "execution_type": execution_type,
            "pillar": response.get("current_pillar"),
            "mode": response.get("mode"),
            "show_products": response.get("show_products", False),
            "show_concierge": response.get("show_concierge", False)
        }
        
        # Return streaming response
        return StreamingResponse(
            generate_stream(
                message=message,
                products=products,
                tip_card=tip_card,
                intelligence=intelligence,
                execution_type=execution_type,
                metadata=metadata
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )
        
    except Exception as ex:
        logger.error(f"[STREAM] Error: {ex}")
        error_msg = str(ex)
        
        # Return error as stream
        async def error_stream():
            yield f"event: error\ndata: {json.dumps({'error': error_msg})}\n\n"
            yield f"event: done\ndata: {json.dumps({'done': True, 'error': True})}\n\n"
        
        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# SIMPLE TYPING INDICATOR ENDPOINT (for real-time feedback)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/os/typing-status/{session_id}")
async def get_typing_status(session_id: str):
    """
    Get typing status for a session.
    Used by frontend to show "Mira is typing..." indicator.
    """
    # For now, return static response
    # In future, this could be connected to actual processing status
    return {
        "session_id": session_id,
        "is_typing": False,
        "status": "idle"
    }
