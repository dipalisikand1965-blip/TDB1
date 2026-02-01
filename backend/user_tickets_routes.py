"""
User-facing ticket and booking endpoints
Allows logged-in users to view their tickets, bookings, and service requests
"""

from fastapi import APIRouter, HTTPException, Query, Header
from typing import Optional, List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user", tags=["user-tickets"])

# Database reference
db = None

def set_db(database):
    global db
    db = database

@router.get("/tickets")
async def get_user_tickets(
    email: str = Query(..., description="User's email address"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, le=100)
):
    """
    Get all tickets for a user by their email address.
    Returns tickets from service_desk_tickets, tickets, and mira_tickets collections.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    all_tickets = []
    
    # Build query
    base_query = {
        "$or": [
            {"member_email": email},
            {"customer_email": email},
            {"member.email": email},
            {"customer.email": email},
            {"user_email": email}
        ]
    }
    
    if status:
        base_query["status"] = status
    
    # Fetch from service_desk_tickets
    try:
        tickets = await db.service_desk_tickets.find(
            base_query,
            {
                "_id": 0,
                "ticket_id": 1,
                "subject": 1,
                "description": 1,
                "status": 1,
                "service_type": 1,
                "pillar": 1,
                "created_at": 1,
                "updated_at": 1,
                "assigned_to": 1,
                "assigned_name": 1,
                "assigned_at": 1,
                "resolved_at": 1,
                "resolution_summary": 1,
                "pet_name": 1,
                "pet_info": 1,
                "request_date": 1,
                "request_time": 1,
                "notes": 1,
                "messages": 1
            }
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        all_tickets.extend(tickets)
    except Exception as e:
        logger.error(f"Error fetching service_desk_tickets: {e}")
    
    # Fetch from tickets collection
    try:
        tickets = await db.tickets.find(
            base_query,
            {
                "_id": 0,
                "ticket_id": 1,
                "subject": 1,
                "description": 1,
                "status": 1,
                "service_type": 1,
                "pillar": 1,
                "created_at": 1,
                "updated_at": 1,
                "assigned_to": 1,
                "assigned_name": 1,
                "assigned_at": 1,
                "resolved_at": 1,
                "resolution_summary": 1,
                "pet_name": 1,
                "pet_info": 1,
                "request_date": 1,
                "request_time": 1,
                "notes": 1,
                "messages": 1
            }
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        all_tickets.extend(tickets)
    except Exception as e:
        logger.error(f"Error fetching tickets: {e}")
    
    # Remove duplicates by ticket_id
    seen_ids = set()
    unique_tickets = []
    for ticket in all_tickets:
        tid = ticket.get("ticket_id")
        if tid and tid not in seen_ids:
            seen_ids.add(tid)
            # Flatten pet_info if present
            if ticket.get("pet_info") and not ticket.get("pet_name"):
                ticket["pet_name"] = ticket["pet_info"].get("name")
            # Normalize created_at to string for JSON serialization
            if ticket.get("created_at") and not isinstance(ticket["created_at"], str):
                ticket["created_at"] = ticket["created_at"].isoformat()
            if ticket.get("updated_at") and not isinstance(ticket["updated_at"], str):
                ticket["updated_at"] = ticket["updated_at"].isoformat()
            if ticket.get("assigned_at") and not isinstance(ticket["assigned_at"], str):
                ticket["assigned_at"] = ticket["assigned_at"].isoformat()
            if ticket.get("resolved_at") and not isinstance(ticket["resolved_at"], str):
                ticket["resolved_at"] = ticket["resolved_at"].isoformat()
            unique_tickets.append(ticket)
    
    # Sort by created_at descending (handle both datetime and string)
    def get_sort_key(x):
        val = x.get("created_at", "")
        if isinstance(val, datetime):
            return val.isoformat()
        return str(val)
    
    unique_tickets.sort(key=get_sort_key, reverse=True)
    
    return {
        "tickets": unique_tickets,
        "count": len(unique_tickets)
    }


@router.get("/bookings")
async def get_user_bookings(
    email: str = Query(..., description="User's email address"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, le=100)
):
    """
    Get all quick bookings for a user by their email address.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Build query
    query = {"user_email": email}
    
    if status:
        query["status"] = status
    
    try:
        bookings = await db.quick_bookings.find(
            query,
            {
                "_id": 0,
                "id": 1,
                "ticket_id": 1,
                "service_type": 1,
                "date": 1,
                "time": 1,
                "notes": 1,
                "status": 1,
                "pet_name": 1,
                "created_at": 1,
                "updated_at": 1,
                "assigned_name": 1
            }
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Use id as ticket_id if ticket_id not present
        for booking in bookings:
            if not booking.get("ticket_id"):
                booking["ticket_id"] = booking.get("id")
        
        return {
            "bookings": bookings,
            "count": len(bookings)
        }
    except Exception as e:
        logger.error(f"Error fetching bookings: {e}")
        return {"bookings": [], "count": 0}


@router.get("/ticket/{ticket_id}")
async def get_ticket_detail(ticket_id: str, email: str = Query(...)):
    """
    Get detailed information about a specific ticket.
    Verifies the user owns the ticket.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Find ticket with ownership verification
    query = {
        "ticket_id": ticket_id,
        "$or": [
            {"member_email": email},
            {"customer_email": email},
            {"member.email": email},
            {"customer.email": email},
            {"user_email": email}
        ]
    }
    
    ticket = await db.service_desk_tickets.find_one(query, {"_id": 0})
    
    if not ticket:
        ticket = await db.tickets.find_one(query, {"_id": 0})
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found or access denied")
    
    return ticket
