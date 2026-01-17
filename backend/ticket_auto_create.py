"""
Auto-Ticket Creation Module
Automatically creates Service Desk tickets from various customer interactions:
- Dining Reservations
- Pet Buddy Visits
- Meetup Requests
- Cake Orders
- Custom Cake Requests
"""

from datetime import datetime, timezone
import uuid

async def create_ticket_from_event(db, event_type: str, event_data: dict) -> str:
    """
    Create a Service Desk ticket from various customer events
    
    Args:
        db: MongoDB database instance
        event_type: Type of event (reservation, buddy_visit, meetup, order, custom_cake)
        event_data: Event-specific data
    
    Returns:
        ticket_id: The created ticket ID
    """
    
    # Generate ticket ID
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    count = await db.tickets.count_documents({"ticket_id": {"$regex": f"^TKT-{today}"}})
    ticket_id = f"TKT-{today}-{str(count + 1).zfill(3)}"
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Default ticket structure
    ticket_doc = {
        "ticket_id": ticket_id,
        "member": {},
        "category": "shop",
        "sub_category": None,
        "urgency": "medium",
        "deadline": None,
        "description": "",
        "source": "auto",
        "source_reference": None,
        "attachments": [],
        "assigned_to": None,
        "status": "new",
        "priority": 3,
        "messages": [],
        "internal_notes": "",
        "tags": ["auto-created"],
        "created_at": now,
        "updated_at": now,
        "sla_due_at": None,
        "first_response_at": None,
        "resolved_at": None,
        "closed_at": None,
        "auto_created_from": event_type,
        "linked_event_id": None
    }
    
    # Configure based on event type
    if event_type == "reservation":
        ticket_doc.update({
            "category": "dine",
            "sub_category": "reservation",
            "urgency": "high" if event_data.get("is_birthday") or event_data.get("is_celebration") else "medium",
            "member": {
                "name": event_data.get("name", "Guest"),
                "email": event_data.get("email"),
                "phone": event_data.get("phone"),
                "city": event_data.get("city"),
                "country": "India"
            },
            "description": f"""🍽️ NEW DINING RESERVATION

**Restaurant:** {event_data.get('restaurant_name', 'Unknown')}
**Date:** {event_data.get('date')} at {event_data.get('time')}
**Guests:** {event_data.get('guests', 1)} people
**Pets:** {event_data.get('pets', 0)} pets

**Special Requests:** {event_data.get('special_requests') or 'None'}
**Occasion:** {event_data.get('occasion') or 'Regular visit'}

---
*Auto-created from dining reservation*""",
            "source": "dine_reservation",
            "source_reference": event_data.get("reservation_id"),
            "linked_event_id": event_data.get("reservation_id"),
            "tags": ["auto-created", "dine", "reservation"]
        })
        
        ticket_doc["messages"].append({
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"Dining reservation created for {event_data.get('restaurant_name')} on {event_data.get('date')}",
            "sender": "system",
            "sender_name": "System",
            "channel": "auto",
            "timestamp": now,
            "is_internal": False
        })
    
    elif event_type == "buddy_visit":
        ticket_doc.update({
            "category": "dine",
            "sub_category": "buddy_visit",
            "urgency": "medium",
            "member": {
                "name": event_data.get("user_name", "Pet Parent"),
                "email": event_data.get("user_email"),
                "phone": None,
                "city": event_data.get("restaurant_city"),
                "country": "India"
            },
            "description": f"""🐕 PET BUDDY VISIT SCHEDULED

**Restaurant:** {event_data.get('restaurant_name', 'Unknown')}
**Area:** {event_data.get('restaurant_area', '')}
**Date:** {event_data.get('date')}
**Time Slot:** {event_data.get('time_slot', 'Not specified')}

**Pets Attending:** {len(event_data.get('pets', []))} pet(s)
{chr(10).join([f"  - {p.get('name', 'Pet')} ({p.get('breed', 'Unknown breed')})" for p in event_data.get('pets', [])])}

**Looking for Buddies:** {'Yes ❤️' if event_data.get('looking_for_buddies') else 'No'}
**Notes:** {event_data.get('notes') or 'None'}

---
*Auto-created from Pet Buddy feature*""",
            "source": "buddy_visit",
            "source_reference": event_data.get("visit_id"),
            "linked_event_id": event_data.get("visit_id"),
            "tags": ["auto-created", "dine", "buddy-visit", "pet-social"]
        })
        
        if event_data.get("looking_for_buddies"):
            ticket_doc["tags"].append("looking-for-buddies")
        
        ticket_doc["messages"].append({
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"Pet buddy visit scheduled at {event_data.get('restaurant_name')} for {event_data.get('date')}",
            "sender": "system",
            "sender_name": "System",
            "channel": "auto",
            "timestamp": now,
            "is_internal": False
        })
    
    elif event_type == "meetup_request":
        ticket_doc.update({
            "category": "dine",
            "sub_category": "meetup",
            "urgency": "medium",
            "member": {
                "name": event_data.get("requester_name", "Pet Parent"),
                "email": event_data.get("requester_email"),
                "phone": None,
                "city": None,
                "country": "India"
            },
            "description": f"""💕 MEETUP REQUEST

**Requester:** {event_data.get('requester_name', 'Unknown')}
**Target:** {event_data.get('target_user_name', 'Another pet parent')}
**Restaurant:** {event_data.get('restaurant_name', 'Unknown')}
**Visit Date:** {event_data.get('visit_date')}

**Message:** {event_data.get('message') or 'No message'}

**Status:** Pending response from target user

---
*Auto-created from Meetup Request*""",
            "source": "meetup_request",
            "source_reference": event_data.get("meetup_id"),
            "linked_event_id": event_data.get("meetup_id"),
            "tags": ["auto-created", "dine", "meetup", "pet-social"]
        })
        
        ticket_doc["messages"].append({
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"Meetup request from {event_data.get('requester_name')} for {event_data.get('restaurant_name')}",
            "sender": "system",
            "sender_name": "System",
            "channel": "auto",
            "timestamp": now,
            "is_internal": False
        })
    
    elif event_type == "cake_order":
        delivery_method = event_data.get("delivery_method", "delivery")
        delivery_info = ""
        if delivery_method == "pickup":
            delivery_info = f"**Pickup Location:** {event_data.get('pickup_location', 'Store')}"
        else:
            delivery_info = f"""**Delivery Address:** {event_data.get('delivery_address', 'Not provided')}
**City:** {event_data.get('city', 'Not specified')}"""
        
        ticket_doc.update({
            "category": "celebrate",
            "sub_category": "cake_order",
            "urgency": "high",  # Orders are high priority
            "member": {
                "name": event_data.get("customer_name", "Customer"),
                "email": event_data.get("customer_email"),
                "phone": event_data.get("customer_phone"),
                "city": event_data.get("city"),
                "country": "India"
            },
            "description": f"""🎂 CAKE ORDER

**Order ID:** {event_data.get('order_id', 'Unknown')}
**Customer:** {event_data.get('customer_name')}
**City:** {event_data.get('city', 'Not specified')}

**Items:**
{chr(10).join([f"  - {item.get('name', 'Item')} x{item.get('quantity', 1)} - ₹{item.get('price', 0)}" for item in event_data.get('items', [])])}

**Total:** ₹{event_data.get('total', 0)}

**Delivery Method:** {delivery_method.upper()}
**Delivery Date:** {event_data.get('delivery_date', 'Not specified')}
{delivery_info}

**Special Instructions:** {event_data.get('special_instructions') or 'None'}

---
*Auto-created from cake order*""",
            "source": "cake_order",
            "source_reference": event_data.get("order_id"),
            "linked_event_id": event_data.get("order_id"),
            "tags": ["auto-created", "celebrate", "cake", "order", event_data.get("city", "").lower().replace(" ", "-")] if event_data.get("city") else ["auto-created", "celebrate", "cake", "order"]
        })
        
        ticket_doc["messages"].append({
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"Cake order #{event_data.get('order_id')} placed by {event_data.get('customer_name')}",
            "sender": "system",
            "sender_name": "System",
            "channel": "auto",
            "timestamp": now,
            "is_internal": False
        })
    
    elif event_type == "custom_cake":
        ticket_doc.update({
            "category": "celebrate",
            "sub_category": "custom_cake",
            "urgency": "high",
            "member": {
                "name": event_data.get("name", "Customer"),
                "email": event_data.get("email"),
                "phone": event_data.get("phone"),
                "city": event_data.get("city"),
                "country": "India"
            },
            "description": f"""🎨 CUSTOM CAKE REQUEST

**Customer:** {event_data.get('name')}
**Pet's Name:** {event_data.get('pet_name', 'Not specified')}

**Cake Details:**
- Size: {event_data.get('size', 'Not specified')}
- Flavour: {event_data.get('flavour', 'Not specified')}
- Theme: {event_data.get('theme', 'Not specified')}

**Occasion:** {event_data.get('occasion', 'Birthday')}
**Delivery Date:** {event_data.get('delivery_date', 'Not specified')}
**Budget:** ₹{event_data.get('budget', 'Not specified')}

**Special Requests:** {event_data.get('special_requests') or 'None'}

**Reference Image:** {event_data.get('reference_image') or 'Not provided'}

---
*Auto-created from custom cake request*""",
            "source": "custom_cake",
            "source_reference": event_data.get("request_id"),
            "linked_event_id": event_data.get("request_id"),
            "tags": ["auto-created", "celebrate", "custom-cake", "requires-quote"]
        })
        
        ticket_doc["messages"].append({
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"Custom cake request from {event_data.get('name')} for {event_data.get('pet_name', 'their pet')}",
            "sender": "system",
            "sender_name": "System",
            "channel": "auto",
            "timestamp": now,
            "is_internal": False
        })
    
    elif event_type == "mira_chat":
        ticket_doc.update({
            "category": "general",
            "sub_category": "chat_inquiry",
            "urgency": "medium",
            "member": {
                "name": event_data.get("name", "Website Visitor"),
                "email": event_data.get("email"),
                "phone": event_data.get("phone"),
                "city": None,
                "country": "India"
            },
            "description": f"""💬 NEW MIRA AI CHAT

**Visitor:** {event_data.get('name', 'Website Visitor')}
**Email:** {event_data.get('email') or 'Not provided'}
**Phone:** {event_data.get('phone') or 'Not provided'}

**Chat Preview:**
{event_data.get('preview', 'No preview available')[:500]}

**Messages:** {event_data.get('messages', 0)} messages in conversation

---
*Auto-created from Mira AI chat*""",
            "source": "mira_chat",
            "source_reference": event_data.get("chat_id"),
            "linked_event_id": event_data.get("chat_id"),
            "tags": ["auto-created", "mira", "chat", "inquiry"]
        })
        
        ticket_doc["messages"].append({
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"Mira AI chat from {event_data.get('name', 'website visitor')}",
            "sender": "system",
            "sender_name": "Mira AI",
            "channel": "chat",
            "timestamp": now,
            "is_internal": False
        })
    
    elif event_type == "email":
        ticket_doc.update({
            "category": "general",
            "sub_category": "email_inquiry",
            "urgency": "medium",
            "member": {
                "name": event_data.get("sender_name", "Customer"),
                "email": event_data.get("sender_email"),
                "phone": None,
                "city": None,
                "country": "India"
            },
            "description": f"""📧 NEW EMAIL INQUIRY

**From:** {event_data.get('sender_name', 'Customer')} <{event_data.get('sender_email', 'unknown')}>
**Subject:** {event_data.get('subject', 'No subject')}

**Message:**
{event_data.get('body', 'No content')[:1000]}

---
*Auto-created from email*""",
            "source": "email",
            "source_reference": event_data.get("email_id"),
            "linked_event_id": event_data.get("email_id"),
            "tags": ["auto-created", "email", "inquiry"]
        })
        
        ticket_doc["messages"].append({
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"Email from {event_data.get('sender_name', 'customer')}: {event_data.get('subject', 'No subject')}",
            "sender": "customer",
            "sender_name": event_data.get("sender_name", "Customer"),
            "channel": "email",
            "timestamp": now,
            "is_internal": False
        })
    
    # Insert the ticket
    await db.tickets.insert_one(ticket_doc)
    
    # Return ticket ID (without _id field issues)
    return ticket_id


async def update_ticket_from_event(db, event_type: str, event_id: str, update_data: dict):
    """
    Update an existing ticket when its linked event is updated
    
    Args:
        db: MongoDB database instance
        event_type: Type of event
        event_id: The linked event ID
        update_data: Data to update
    """
    
    # Find ticket by linked event
    ticket = await db.tickets.find_one({
        "linked_event_id": event_id,
        "auto_created_from": event_type
    })
    
    if not ticket:
        return None
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Add status update message
    status_message = update_data.get("status_message", f"Status updated: {update_data.get('new_status', 'unknown')}")
    
    message = {
        "id": str(uuid.uuid4()),
        "type": "status_update",
        "content": status_message,
        "sender": "system",
        "sender_name": "System",
        "channel": "auto",
        "timestamp": now,
        "is_internal": False
    }
    
    # Update ticket
    update_doc = {
        "updated_at": now
    }
    
    # If event is completed/confirmed, we might want to update ticket status
    new_status = update_data.get("new_status")
    if new_status in ["confirmed", "completed"]:
        update_doc["status"] = "in_progress"
    elif new_status in ["cancelled", "declined"]:
        update_doc["status"] = "closed"
        update_doc["closed_at"] = now
    
    await db.tickets.update_one(
        {"ticket_id": ticket["ticket_id"]},
        {
            "$push": {"messages": message},
            "$set": update_doc
        }
    )
    
    return ticket["ticket_id"]
