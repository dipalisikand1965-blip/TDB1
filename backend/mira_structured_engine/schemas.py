"""
Mira Structured Engine - Request/Response Schemas
==================================================
The contract between frontend and backend for every Mira turn.

Locked decisions:
- Draft ticket immediately on execution intent
- Hybrid quick replies (canonical + LLM reorder)
- Frontend sends explicit ui_context
- Feature flag rollout
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from enum import Enum


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════════════════

class Pillar(str, Enum):
    CARE = "care"
    FIT = "fit"
    DINE = "dine"
    STAY = "stay"
    CELEBRATE = "celebrate"
    TRAVEL = "travel"
    ENJOY = "enjoy"
    LEARN = "learn"
    SHOP = "shop"
    EMERGENCY = "emergency"
    ADVISORY = "advisory"


class Intent(str, Enum):
    BOOK_SERVICE = "book_service"
    RECOMMEND = "recommend"
    ADVISE = "advise"
    CLARIFY = "clarify"
    STATUS_CHECK = "status_check"
    GENERAL_CHAT = "general_chat"


class Action(str, Enum):
    RESPOND = "respond"      # General conversation, no action needed
    ASK = "ask"              # Need more info before proceeding
    RECOMMEND = "recommend"  # Show picks/suggestions
    EXECUTE = "execute"      # Create or update ticket


class TicketStatus(str, Enum):
    NONE = "none"                    # No ticket needed
    DRAFT = "draft"                  # Intent captured, missing info
    PENDING_INFO = "pending_info"    # Waiting for user clarification
    OPEN = "open"                    # Ready for concierge execution
    IN_PROGRESS = "in_progress"      # Concierge working on it
    AWAITING_APPROVAL = "awaiting_approval"  # Options ready, user decides
    RESOLVED = "resolved"            # Done


class ActiveTab(str, Enum):
    TODAY = "today"
    PICKS = "picks"
    SERVICES = "services"
    CONCIERGE = "concierge"
    LEARN = "learn"
    CHAT = "chat"  # Default/overlay


# ═══════════════════════════════════════════════════════════════════════════════
# REQUEST SCHEMA
# ═══════════════════════════════════════════════════════════════════════════════

class UIContext(BaseModel):
    """Frontend sends this to tell backend what surface user is on"""
    active_tab: ActiveTab = ActiveTab.CHAT
    active_pillar: Optional[Pillar] = None
    surface: str = "chat_overlay"  # chat_overlay | tab_panel | service_page | flow_modal
    active_question_id: Optional[str] = None  # Current clarifying question being answered
    draft_ticket_id: Optional[str] = None     # If user is continuing a draft


class PetContext(BaseModel):
    """Pet data sent with request"""
    id: str
    name: str
    breed: Optional[str] = None
    species: str = "dog"
    weight_kg: Optional[float] = None
    age_years: Optional[float] = None
    birthday: Optional[str] = None
    
    # Soul data
    temperament: Optional[str] = None
    energy_level: Optional[str] = None
    food_motivation: Optional[str] = None
    separation_anxiety: Optional[str] = None
    loud_sounds_reaction: Optional[str] = None
    stranger_reaction: Optional[str] = None
    handling_comfort: Optional[str] = None
    behavior_with_dogs: Optional[str] = None
    
    # Health/Safety
    allergies: List[str] = []
    health_conditions: List[str] = []
    
    # Preferences
    grooming_preference: Optional[str] = None  # at_home | salon | either
    favorite_treats: List[str] = []
    
    # Full soul dict for anything else
    soul: Dict[str, Any] = {}


class MiraTurnRequest(BaseModel):
    """
    What frontend sends to Mira for every turn.
    This is the INPUT contract.
    """
    # Required
    message: str = Field(..., description="User's message")
    session_id: str = Field(..., description="Conversation session ID")
    
    # Pet context (required for personalization)
    pet_context: PetContext
    
    # UI context (required for tab-aware responses)
    ui_context: UIContext = UIContext()
    
    # Optional
    user_id: Optional[str] = None
    conversation_history: List[Dict[str, str]] = []  # [{role: user/assistant, content: ...}]
    
    # Source tracking
    source: str = "mira_demo"  # mira_demo | service_page | flow_modal | search


# ═══════════════════════════════════════════════════════════════════════════════
# RESPONSE SCHEMA
# ═══════════════════════════════════════════════════════════════════════════════

class QuickReply(BaseModel):
    """A single quick reply option"""
    label: str                          # Display text
    value: str                          # Value to send back
    action: str = "send_message"        # send_message | open_modal | navigate
    disabled: bool = False              # Pet-safe filtering
    disabled_reason: Optional[str] = None


class ClarifyingQuestion(BaseModel):
    """When Mira needs more info"""
    question_id: str                    # e.g. "grooming.location_mode"
    question_text: str                  # "At-home or salon this time?"
    options: List[QuickReply] = []      # Bound quick replies
    required: bool = True
    field_name: str                     # Which ticket field this fills


class TicketState(BaseModel):
    """Current state of the service request"""
    id: Optional[str] = None
    status: TicketStatus = TicketStatus.NONE
    service_type: Optional[str] = None  # grooming | vet_visit | boarding | etc
    filled_fields: Dict[str, Any] = {}
    missing_fields: List[str] = []
    
    # For display
    summary: Optional[str] = None       # "Grooming for Mystique - awaiting location"


class PickItem(BaseModel):
    """An item for PICKS tab"""
    id: str
    name: str
    type: str  # product | service | bundle | experience
    reason: Optional[str] = None  # "Because Mystique is noise-sensitive"
    price: Optional[str] = None
    image_url: Optional[str] = None
    cta_label: str = "Learn more"
    cta_action: str = "open_detail"


class ServiceItem(BaseModel):
    """An item for SERVICES tab"""
    id: str
    name: str
    category: str
    description: Optional[str] = None
    price_range: Optional[str] = None
    cta_label: str = "Book now"


class MiraTurnResponse(BaseModel):
    """
    What Mira returns for every turn.
    This is the OUTPUT contract - UI renders from this.
    """
    # Always present
    success: bool = True
    response: str = Field(..., description="Mira's message to display")
    session_id: str
    
    # Classification
    pillar: Optional[Pillar] = None
    intent: Intent = Intent.GENERAL_CHAT
    action: Action = Action.RESPOND
    
    # Clarification (when action = ASK)
    clarifying_question: Optional[ClarifyingQuestion] = None
    
    # Quick replies (ONLY bound to clarifying_question)
    quick_replies: List[QuickReply] = []
    
    # Tab-aware payloads
    picks: List[PickItem] = []          # For PICKS tab
    services: List[ServiceItem] = []    # For SERVICES tab
    
    # Ticket state (unified request spine)
    ticket: TicketState = TicketState()
    
    # UI hints
    active_tab_hint: Optional[ActiveTab] = None  # Suggest tab switch
    show_notification: bool = False
    notification_message: Optional[str] = None
    
    # Debug (only in dev)
    debug: Optional[Dict[str, Any]] = None


# ═══════════════════════════════════════════════════════════════════════════════
# TICKET STATE TRANSITIONS
# ═══════════════════════════════════════════════════════════════════════════════

VALID_TRANSITIONS = {
    TicketStatus.NONE: [TicketStatus.DRAFT, TicketStatus.OPEN],  # open only if all minimums present
    TicketStatus.DRAFT: [TicketStatus.PENDING_INFO, TicketStatus.OPEN],
    TicketStatus.PENDING_INFO: [TicketStatus.OPEN, TicketStatus.DRAFT],  # back to draft if user changes
    TicketStatus.OPEN: [TicketStatus.IN_PROGRESS, TicketStatus.AWAITING_APPROVAL],
    TicketStatus.IN_PROGRESS: [TicketStatus.AWAITING_APPROVAL, TicketStatus.RESOLVED],
    TicketStatus.AWAITING_APPROVAL: [TicketStatus.OPEN, TicketStatus.RESOLVED],
    TicketStatus.RESOLVED: [],  # Terminal state
}


def can_transition(from_status: TicketStatus, to_status: TicketStatus) -> bool:
    """Check if a ticket state transition is valid"""
    return to_status in VALID_TRANSITIONS.get(from_status, [])
