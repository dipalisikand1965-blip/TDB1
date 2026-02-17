"""
Canonical Ticket ID Generator
==============================
Single source of truth for generating Service Desk ticket IDs.

FORMAT: TCK-YYYY-NNNNNN
- TCK: Fixed prefix
- YYYY: Current year
- NNNNNN: 6-digit sequential number (padded with zeros)

Example: TCK-2026-000001, TCK-2026-000002, ...

USAGE:
    from utils.ticket_id_generator import generate_ticket_id, is_valid_ticket_id
    
    # Generate new ID
    ticket_id = await generate_ticket_id(db)
    
    # Validate existing ID
    if is_valid_ticket_id(some_id):
        ...

UNIFORM SERVICE FLOW:
All intake points must use this generator to ensure:
1. Unique, sequential IDs
2. Canonical format validation
3. No duplicate ticket_ids across collections
"""

import re
from datetime import datetime, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Canonical format: TCK-YYYY-NNNNNN
CANONICAL_TICKET_ID_PATTERN = re.compile(r'^TCK-\d{4}-\d{6}$')


def is_valid_ticket_id(ticket_id: Optional[str]) -> bool:
    """
    Validate ticket_id matches canonical format.
    
    Args:
        ticket_id: The ID to validate
        
    Returns:
        True if valid canonical format, False otherwise
    """
    if not ticket_id:
        return False
    return bool(CANONICAL_TICKET_ID_PATTERN.match(ticket_id))


async def generate_ticket_id(db) -> str:
    """
    Generate a new canonical ticket ID.
    
    Uses a counter collection to ensure sequential, unique IDs.
    Thread-safe via MongoDB findAndModify atomic operation.
    
    Args:
        db: MongoDB database instance
        
    Returns:
        New ticket_id in format TCK-YYYY-NNNNNN
    """
    year = datetime.now(timezone.utc).year
    
    # Atomically increment counter for this year
    counter_doc = await db.ticket_counters.find_one_and_update(
        {"_id": f"ticket_counter_{year}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True  # Return updated document
    )
    
    seq = counter_doc.get("seq", 1)
    ticket_id = f"TCK-{year}-{seq:06d}"
    
    logger.info(f"[TICKET-ID] Generated: {ticket_id}")
    return ticket_id


async def get_or_generate_ticket_id(db, existing_id: Optional[str] = None) -> str:
    """
    Get existing valid ticket_id or generate a new one.
    
    If existing_id is valid canonical format, return it.
    Otherwise, generate a new one.
    
    Args:
        db: MongoDB database instance
        existing_id: Optional existing ticket_id to validate
        
    Returns:
        Valid canonical ticket_id
    """
    if is_valid_ticket_id(existing_id):
        return existing_id
    
    return await generate_ticket_id(db)


def extract_year_from_ticket_id(ticket_id: str) -> Optional[int]:
    """
    Extract year from canonical ticket_id.
    
    Args:
        ticket_id: Canonical format ID (TCK-YYYY-NNNNNN)
        
    Returns:
        Year as integer, or None if invalid format
    """
    if not is_valid_ticket_id(ticket_id):
        return None
    
    try:
        return int(ticket_id.split("-")[1])
    except (IndexError, ValueError):
        return None


def extract_sequence_from_ticket_id(ticket_id: str) -> Optional[int]:
    """
    Extract sequence number from canonical ticket_id.
    
    Args:
        ticket_id: Canonical format ID (TCK-YYYY-NNNNNN)
        
    Returns:
        Sequence number as integer, or None if invalid format
    """
    if not is_valid_ticket_id(ticket_id):
        return None
    
    try:
        return int(ticket_id.split("-")[2])
    except (IndexError, ValueError):
        return None
