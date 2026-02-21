"""
Unified Ticket Status System
============================
Canonical status taxonomy for MOJO OS - used across TODAY, SERVICES, Admin, and Notifications.

Per user vision:
- One taxonomy, everything maps to it
- "Awaiting You" becomes a clean query
- Orders are tickets with shipping sub-states
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

# ============================================
# CANONICAL STATUS TAXONOMY
# ============================================

class CanonicalStatus(str, Enum):
    """The ONLY status values that should exist in the system."""
    
    # Initial states
    DRAFT = "draft"                           # Not yet submitted
    PLACED = "placed"                         # Submitted, awaiting first action
    
    # "Awaiting You" states (user action required)
    CLARIFICATION_NEEDED = "clarification_needed"  # We need more info
    OPTIONS_READY = "options_ready"                # Choose between options
    APPROVAL_PENDING = "approval_pending"          # Approve quote/plan
    PAYMENT_PENDING = "payment_pending"            # Complete payment
    
    # Active states
    IN_PROGRESS = "in_progress"               # Being worked on
    SCHEDULED = "scheduled"                   # Date/time locked
    
    # Shipping states (orders only)
    SHIPPED = "shipped"                       # Order dispatched
    DELIVERED = "delivered"                   # Order received
    
    # Terminal states
    COMPLETED = "completed"                   # Successfully finished
    CANCELLED = "cancelled"                   # Cancelled by user/admin
    UNABLE = "unable"                         # Unable to fulfill


# ============================================
# STATUS GROUPS FOR QUERIES
# ============================================

AWAITING_USER_STATUSES = [
    CanonicalStatus.CLARIFICATION_NEEDED.value,
    CanonicalStatus.OPTIONS_READY.value,
    CanonicalStatus.APPROVAL_PENDING.value,
    CanonicalStatus.PAYMENT_PENDING.value,
]

ACTIVE_STATUSES = [
    CanonicalStatus.PLACED.value,
    CanonicalStatus.IN_PROGRESS.value,
    CanonicalStatus.SCHEDULED.value,
]

SHIPPING_STATUSES = [
    CanonicalStatus.SHIPPED.value,
    CanonicalStatus.DELIVERED.value,
]

TODAY_WATCHLIST_STATUSES = AWAITING_USER_STATUSES + [
    CanonicalStatus.IN_PROGRESS.value,
    CanonicalStatus.SCHEDULED.value,
    CanonicalStatus.SHIPPED.value,
]

TERMINAL_STATUSES = [
    CanonicalStatus.COMPLETED.value,
    CanonicalStatus.CANCELLED.value,
    CanonicalStatus.UNABLE.value,
    CanonicalStatus.DELIVERED.value,
]


# ============================================
# LEGACY STATUS MAPPING
# ============================================

LEGACY_TO_CANONICAL = {
    # Old mira_tickets statuses
    "open_mira_only": CanonicalStatus.DRAFT.value,
    "open_concierge_engaged": CanonicalStatus.PLACED.value,
    "requested": CanonicalStatus.PLACED.value,
    "awaiting_user": CanonicalStatus.CLARIFICATION_NEEDED.value,
    "confirmed": CanonicalStatus.SCHEDULED.value,
    
    # Old advisory statuses
    "exploring": CanonicalStatus.IN_PROGRESS.value,
    "informed": CanonicalStatus.COMPLETED.value,
    "converted": CanonicalStatus.COMPLETED.value,
    "closed": CanonicalStatus.COMPLETED.value,
    
    # Old concierge statuses
    "acknowledged": CanonicalStatus.PLACED.value,
    "in_review": CanonicalStatus.IN_PROGRESS.value,
    "in_progress": CanonicalStatus.IN_PROGRESS.value,
    
    # Old emergency statuses
    "immediate_action": CanonicalStatus.IN_PROGRESS.value,
    "responder_assigned": CanonicalStatus.IN_PROGRESS.value,
    "resolved": CanonicalStatus.COMPLETED.value,
    
    # Service desk statuses
    "pending": CanonicalStatus.PLACED.value,
    "assigned": CanonicalStatus.IN_PROGRESS.value,
    "contacted": CanonicalStatus.CLARIFICATION_NEEDED.value,
}


# ============================================
# STATUS DISPLAY CONFIGURATION
# ============================================

STATUS_DISPLAY = {
    CanonicalStatus.DRAFT.value: {
        "label": "Draft",
        "short": "Draft",
        "color": "slate",
        "bg_class": "bg-slate-500/20",
        "text_class": "text-slate-400",
        "icon": "edit",
        "description": "Not yet submitted"
    },
    CanonicalStatus.PLACED.value: {
        "label": "Request Placed",
        "short": "Placed",
        "color": "blue",
        "bg_class": "bg-blue-500/20",
        "text_class": "text-blue-400",
        "icon": "inbox",
        "description": "We've received your request"
    },
    CanonicalStatus.CLARIFICATION_NEEDED.value: {
        "label": "Need Your Input",
        "short": "Input Needed",
        "color": "amber",
        "bg_class": "bg-amber-500/20",
        "text_class": "text-amber-400",
        "icon": "help-circle",
        "description": "Please provide more details",
        "awaiting_user": True
    },
    CanonicalStatus.OPTIONS_READY.value: {
        "label": "Options Ready",
        "short": "Choose",
        "color": "purple",
        "bg_class": "bg-purple-500/20",
        "text_class": "text-purple-400",
        "icon": "list",
        "description": "Review and choose an option",
        "awaiting_user": True
    },
    CanonicalStatus.APPROVAL_PENDING.value: {
        "label": "Awaiting Approval",
        "short": "Approve",
        "color": "orange",
        "bg_class": "bg-orange-500/20",
        "text_class": "text-orange-400",
        "icon": "check-circle",
        "description": "Review and approve to proceed",
        "awaiting_user": True
    },
    CanonicalStatus.PAYMENT_PENDING.value: {
        "label": "Payment Pending",
        "short": "Pay",
        "color": "rose",
        "bg_class": "bg-rose-500/20",
        "text_class": "text-rose-400",
        "icon": "credit-card",
        "description": "Complete payment to confirm",
        "awaiting_user": True
    },
    CanonicalStatus.IN_PROGRESS.value: {
        "label": "In Progress",
        "short": "Working",
        "color": "cyan",
        "bg_class": "bg-cyan-500/20",
        "text_class": "text-cyan-400",
        "icon": "loader",
        "description": "We're working on this"
    },
    CanonicalStatus.SCHEDULED.value: {
        "label": "Scheduled",
        "short": "Scheduled",
        "color": "green",
        "bg_class": "bg-green-500/20",
        "text_class": "text-green-400",
        "icon": "calendar-check",
        "description": "Date and time confirmed"
    },
    CanonicalStatus.SHIPPED.value: {
        "label": "Shipped",
        "short": "Shipped",
        "color": "indigo",
        "bg_class": "bg-indigo-500/20",
        "text_class": "text-indigo-400",
        "icon": "truck",
        "description": "On its way to you"
    },
    CanonicalStatus.DELIVERED.value: {
        "label": "Delivered",
        "short": "Delivered",
        "color": "emerald",
        "bg_class": "bg-emerald-500/20",
        "text_class": "text-emerald-400",
        "icon": "package-check",
        "description": "Successfully delivered"
    },
    CanonicalStatus.COMPLETED.value: {
        "label": "Completed",
        "short": "Done",
        "color": "green",
        "bg_class": "bg-green-500/20",
        "text_class": "text-green-400",
        "icon": "check",
        "description": "Successfully completed"
    },
    CanonicalStatus.CANCELLED.value: {
        "label": "Cancelled",
        "short": "Cancelled",
        "color": "gray",
        "bg_class": "bg-gray-500/20",
        "text_class": "text-gray-400",
        "icon": "x",
        "description": "Request was cancelled"
    },
    CanonicalStatus.UNABLE.value: {
        "label": "Unable to Fulfill",
        "short": "Unable",
        "color": "red",
        "bg_class": "bg-red-500/20",
        "text_class": "text-red-400",
        "icon": "alert-circle",
        "description": "We couldn't complete this request"
    },
}


# ============================================
# HELPER FUNCTIONS
# ============================================

def map_legacy_status(legacy_status: str) -> str:
    """Map any legacy status to canonical status."""
    if not legacy_status:
        return CanonicalStatus.DRAFT.value
    
    # If it's already canonical, return as-is
    if legacy_status in [s.value for s in CanonicalStatus]:
        return legacy_status
    
    # Map from legacy
    return LEGACY_TO_CANONICAL.get(legacy_status, CanonicalStatus.PLACED.value)


def get_status_display_info(status: str) -> Dict:
    """Get display info for a status (handles legacy mapping)."""
    canonical = map_legacy_status(status)
    return STATUS_DISPLAY.get(canonical, STATUS_DISPLAY[CanonicalStatus.PLACED.value])


def is_awaiting_user(status: str) -> bool:
    """Check if a status requires user action."""
    canonical = map_legacy_status(status)
    return canonical in AWAITING_USER_STATUSES


def is_terminal(status: str) -> bool:
    """Check if a status is terminal (no further action needed)."""
    canonical = map_legacy_status(status)
    return canonical in TERMINAL_STATUSES


def get_next_statuses(current_status: str) -> List[str]:
    """Get valid next statuses from current status."""
    canonical = map_legacy_status(current_status)
    
    # Status transition rules
    transitions = {
        CanonicalStatus.DRAFT.value: [CanonicalStatus.PLACED.value, CanonicalStatus.CANCELLED.value],
        CanonicalStatus.PLACED.value: [
            CanonicalStatus.CLARIFICATION_NEEDED.value,
            CanonicalStatus.OPTIONS_READY.value,
            CanonicalStatus.IN_PROGRESS.value,
            CanonicalStatus.CANCELLED.value
        ],
        CanonicalStatus.CLARIFICATION_NEEDED.value: [
            CanonicalStatus.IN_PROGRESS.value,
            CanonicalStatus.OPTIONS_READY.value,
            CanonicalStatus.CANCELLED.value
        ],
        CanonicalStatus.OPTIONS_READY.value: [
            CanonicalStatus.APPROVAL_PENDING.value,
            CanonicalStatus.IN_PROGRESS.value,
            CanonicalStatus.CANCELLED.value
        ],
        CanonicalStatus.APPROVAL_PENDING.value: [
            CanonicalStatus.PAYMENT_PENDING.value,
            CanonicalStatus.IN_PROGRESS.value,
            CanonicalStatus.SCHEDULED.value,
            CanonicalStatus.CANCELLED.value
        ],
        CanonicalStatus.PAYMENT_PENDING.value: [
            CanonicalStatus.IN_PROGRESS.value,
            CanonicalStatus.SCHEDULED.value,
            CanonicalStatus.CANCELLED.value
        ],
        CanonicalStatus.IN_PROGRESS.value: [
            CanonicalStatus.SCHEDULED.value,
            CanonicalStatus.SHIPPED.value,
            CanonicalStatus.COMPLETED.value,
            CanonicalStatus.UNABLE.value
        ],
        CanonicalStatus.SCHEDULED.value: [
            CanonicalStatus.COMPLETED.value,
            CanonicalStatus.CANCELLED.value,
            CanonicalStatus.UNABLE.value
        ],
        CanonicalStatus.SHIPPED.value: [
            CanonicalStatus.DELIVERED.value,
            CanonicalStatus.UNABLE.value
        ],
    }
    
    return transitions.get(canonical, [])


# ============================================
# TICKET DATA MODELS
# ============================================

@dataclass
class ShippingInfo:
    """Shipping details for order-type tickets."""
    carrier: Optional[str] = None
    tracking_id: Optional[str] = None
    eta: Optional[str] = None
    last_scan: Optional[str] = None
    last_scan_at: Optional[str] = None


@dataclass
class ServiceTicket:
    """Unified ticket model for all service requests."""
    ticket_id: str
    ticket_type: str  # service, order, advisory, emergency
    service_type: str  # grooming, training, boarding, etc.
    status: str  # Canonical status
    
    # Who
    parent_id: str
    pet_ids: List[str]  # Multi-pet support
    pet_names: List[str]
    
    # What
    title: str
    description: str
    constraints: Dict  # Auto-filled from MOJO
    
    # When/Where
    preferred_time_window: Optional[str] = None
    scheduled_at: Optional[str] = None
    location: Optional[str] = None
    
    # Order-specific
    shipping: Optional[ShippingInfo] = None
    order_items: Optional[List[Dict]] = None
    
    # Metadata
    created_at: str = ""
    updated_at: str = ""
    pillar: Optional[str] = None
    
    # Admin
    assigned_to: Optional[str] = None
    sla_deadline: Optional[str] = None
    
    # Learning
    preferences_saved: Optional[Dict] = None  # Captured on completion


# ============================================
# FEATURED SERVICES CONFIG
# ============================================

FEATURED_SERVICES = [
    {
        "id": "grooming",
        "name": "Grooming",
        "icon": "scissors",
        "description": "Bath, haircut, nail trim",
        "pillar": "care",
        "sort_rank": 1
    },
    {
        "id": "training",
        "name": "Training",
        "icon": "graduation-cap",
        "description": "Behaviour & obedience",
        "pillar": "learn",
        "sort_rank": 2
    },
    {
        "id": "boarding",
        "name": "Boarding",
        "icon": "home",
        "description": "Overnight stays",
        "pillar": "stay",
        "sort_rank": 3
    },
    {
        "id": "vet",
        "name": "Vet Visit",
        "icon": "stethoscope",
        "description": "Checkups & consultations",
        "pillar": "care",
        "sort_rank": 4
    },
    {
        "id": "walking",
        "name": "Walking",
        "icon": "footprints",
        "description": "Daily walks & exercise",
        "pillar": "fit",
        "sort_rank": 5
    },
    {
        "id": "photography",
        "name": "Photography",
        "icon": "camera",
        "description": "Professional pet shoots",
        "pillar": "celebrate",
        "sort_rank": 6
    },
    {
        "id": "party",
        "name": "Party Setup",
        "icon": "party-popper",
        "description": "Birthday & celebrations",
        "pillar": "celebrate",
        "sort_rank": 7
    },
    {
        "id": "travel",
        "name": "Travel",
        "icon": "plane",
        "description": "Pet relocation & travel",
        "pillar": "travel",
        "sort_rank": 8
    },
]
