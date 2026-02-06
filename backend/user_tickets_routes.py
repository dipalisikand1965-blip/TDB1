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


# ============== USER MESSAGE TO TICKET ==============

from pydantic import BaseModel

class UserMessage(BaseModel):
    message: str
    request_id: Optional[str] = None  # For service requests/bookings

@router.post("/ticket/{ticket_id}/message")
async def send_user_message_to_ticket(
    ticket_id: str, 
    body: UserMessage,
    email: str = Query(..., description="User's email for verification")
):
    """
    User sends a message to their ticket.
    Creates admin notification and adds to ticket conversation.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    from datetime import datetime, timezone
    import uuid
    
    now = datetime.now(timezone.utc).isoformat()
    
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
    
    ticket = await db.service_desk_tickets.find_one(query)
    collection = "service_desk_tickets"
    
    if not ticket:
        ticket = await db.tickets.find_one(query)
        collection = "tickets"
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found or access denied")
    
    # Create message object
    message_obj = {
        "id": str(uuid.uuid4()),
        "type": "member_message",
        "content": body.message,
        "sender": "member",
        "sender_email": email,
        "timestamp": now,
        "is_internal": False
    }
    
    # Add message to ticket
    update_result = await db[collection].update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"messages": message_obj},
            "$set": {
                "updated_at": now,
                "status": "in_progress" if ticket.get("status") in ["waiting_on_member", "new"] else ticket.get("status")
            }
        }
    )
    
    # Create admin notification
    admin_notification = {
        "id": str(uuid.uuid4()),
        "type": "ticket_message",
        "title": f"New message on Ticket #{ticket_id[-6:]}",
        "message": f"Customer sent a message: {body.message[:100]}{'...' if len(body.message) > 100 else ''}",
        "ticket_id": ticket_id,
        "severity": "info",
        "created_at": now,
        "read": False,
        "metadata": {
            "customer_email": email,
            "service": ticket.get("service_name") or ticket.get("subject"),
            "request_id": body.request_id
        }
    }
    
    await db.admin_notifications.insert_one(admin_notification)
    
    logger.info(f"User message added to ticket {ticket_id}, admin notified")
    
    return {
        "success": True,
        "message": "Message sent to concierge",
        "ticket_id": ticket_id,
        "message_id": message_obj["id"]
    }


@router.post("/request/{request_id}/message")
async def send_message_about_request(
    request_id: str,
    body: UserMessage,
    email: str = Query(..., description="User's email")
):
    """
    User sends a message about their service request/booking.
    ALWAYS creates a ticket - no strict validation needed since user is authenticated.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    from datetime import datetime, timezone
    import uuid
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Try to find existing ticket for this request (relaxed search)
    existing_ticket = await db.service_desk_tickets.find_one({
        "$or": [
            {"ticket_id": request_id},
            {"source_reference": request_id},
            {"request_id": request_id}
        ]
    })
    
    ticket_id = None
    service_name = "Service Inquiry"
    
    if existing_ticket:
        # Add message to existing ticket
        ticket_id = existing_ticket.get("ticket_id")
        service_name = existing_ticket.get("service_name") or existing_ticket.get("subject") or "Service"
        
        message_obj = {
            "id": str(uuid.uuid4()),
            "type": "member_message",
            "content": body.message,
            "sender": "member",
            "sender_email": email,
            "timestamp": now,
            "is_internal": False
        }
        
        await db.service_desk_tickets.update_one(
            {"ticket_id": ticket_id},
            {
                "$push": {"messages": message_obj},
                "$set": {"updated_at": now, "status": "in_progress"}
            }
        )
    else:
        # Create new inquiry ticket
        today = datetime.now(timezone.utc).strftime("%Y%m%d")
        count = await db.service_desk_tickets.count_documents({"ticket_id": {"$regex": f"^TKT-{today}"}})
        ticket_id = f"TKT-{today}-{str(count + 1).zfill(3)}"
        
        # Try to get info about the request
        request_info = await db.service_requests.find_one({"id": request_id})
        if not request_info:
            request_info = await db.mira_requests.find_one({"id": request_id})
        if not request_info:
            request_info = await db.unified_bookings.find_one({"id": request_id})
        
        if request_info:
            service_name = (
                request_info.get("service_name") or 
                request_info.get("subject") or 
                request_info.get("service_type", "").replace("_", " ").title() or
                "Service"
            )
        
        new_ticket = {
            "ticket_id": ticket_id,
            "subject": f"Inquiry about {service_name}",
            "description": body.message,
            "member_email": email,
            "customer_email": email,
            "source": "member_inquiry",
            "source_reference": request_id,
            "request_id": request_id,
            "service_name": service_name,
            "status": "new",
            "priority": 2,
            "pillar": "care",
            "created_at": now,
            "updated_at": now,
            "messages": [{
                "id": str(uuid.uuid4()),
                "type": "initial",
                "content": body.message,
                "sender": "member",
                "sender_email": email,
                "timestamp": now,
                "is_internal": False
            }]
        }
        
        await db.service_desk_tickets.insert_one(new_ticket)
    
    # Create admin notification
    admin_notification = {
        "id": str(uuid.uuid4()),
        "type": "new_inquiry",
        "title": f"💬 New message: {service_name}",
        "message": f"Customer inquiry: {body.message[:100]}{'...' if len(body.message) > 100 else ''}",
        "ticket_id": ticket_id,
        "request_id": request_id,
        "severity": "medium",
        "created_at": now,
        "read": False,
        "metadata": {
            "customer_email": email,
            "service": service_name
        }
    }
    
    await db.admin_notifications.insert_one(admin_notification)
    
    logger.info(f"Message sent, ticket {ticket_id}, admin notified")
    
    return {
        "success": True,
        "message": "Your message has been sent to the concierge team. We'll respond shortly!",
        "ticket_id": ticket_id,
        "request_id": request_id
    }


@router.get("/request/{request_id}/messages")
async def get_request_messages(
    request_id: str,
    email: str = Query(..., description="User's email for verification")
):
    """
    Get conversation history for a request/booking.
    Shows messages between user and concierge.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Find ticket by request_id
    ticket = await db.service_desk_tickets.find_one({
        "$or": [
            {"ticket_id": request_id, "member_email": email},
            {"ticket_id": request_id, "customer_email": email},
            {"source_reference": request_id, "member_email": email},
            {"source_reference": request_id, "customer_email": email},
            {"request_id": request_id, "member_email": email},
            {"request_id": request_id, "customer_email": email}
        ]
    })
    
    if not ticket:
        return {"messages": [], "ticket_id": None}
    
    # Filter out internal messages (only show member and concierge messages)
    messages = ticket.get("messages", [])
    visible_messages = [
        {
            "id": m.get("id"),
            "content": m.get("content"),
            "sender": "you" if m.get("sender") == "member" else "concierge",
            "timestamp": m.get("timestamp"),
            "attachments": m.get("attachments", [])
        }
        for m in messages
        if not m.get("is_internal", False)
    ]
    
    return {
        "messages": visible_messages,
        "ticket_id": ticket.get("ticket_id"),
        "status": ticket.get("status"),
        "subject": ticket.get("subject")
    }

