"""
Mira Structured Engine
======================
The intelligent core of Mira OS.

Modules:
- schemas: Request/response contracts
- question_registry: Canonical questions per service
- memory_assembler: Pet context builder
- ticket_manager: Unified request spine
- engine: Main orchestration
"""

from .schemas import (
    MiraTurnRequest,
    MiraTurnResponse,
    Pillar,
    Intent,
    Action,
    TicketStatus,
    ActiveTab,
    UIContext,
    PetContext,
    QuickReply,
    ClarifyingQuestion,
    TicketState,
)

from .engine import (
    run_mira_turn,
    set_engine_db,
    set_llm_client,
)

__all__ = [
    # Schemas
    "MiraTurnRequest",
    "MiraTurnResponse",
    "Pillar",
    "Intent", 
    "Action",
    "TicketStatus",
    "ActiveTab",
    "UIContext",
    "PetContext",
    "QuickReply",
    "ClarifyingQuestion",
    "TicketState",
    
    # Engine
    "run_mira_turn",
    "set_engine_db",
    "set_llm_client",
]
