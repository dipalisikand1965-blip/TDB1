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
    
    now = datetime.now(timezone.utc).isoformat()
    ticket_id = None  # Initialize to ensure it's defined
    
    # Generate ticket ID based on event type
    if event_type == "cake_order" and event_data.get("order_id"):
        # For cake orders: Ticket ID = Order ID (critical requirement)
        ticket_id = event_data.get("order_id")
        print(f"[TICKET DEBUG] Cake order - setting ticket_id to: {ticket_id}")
        # Check if ticket already exists with this ID
        existing = await db.tickets.find_one({"ticket_id": ticket_id})
        if existing:
            print(f"[TICKET DEBUG] Existing ticket found, returning: {ticket_id}")
            # Update existing ticket instead of creating new
            return ticket_id
        print(f"[TICKET DEBUG] No existing ticket, will create new with ID: {ticket_id}")
    elif event_type == "dine_bundle_order" and event_data.get("order_id"):
        # For dine bundle orders: Ticket ID = Order ID
        ticket_id = event_data.get("order_id")
        existing = await db.tickets.find_one({"ticket_id": ticket_id})
        if existing:
            return ticket_id
    else:
        # Generate standard ticket ID for other events
        today = datetime.now(timezone.utc).strftime("%Y%m%d")
        count = await db.tickets.count_documents({"ticket_id": {"$regex": f"^TKT-{today}"}})
        ticket_id = f"TKT-{today}-{str(count + 1).zfill(3)}"
    
    print(f"[TICKET DEBUG] Creating ticket with ID: {ticket_id} for event_type: {event_type}")
    
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
        "linked_event_id": None,
        "reference_images": [],  # For storing cake reference images
        "order_id": event_data.get("order_id")  # Link to order
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
        
        # Extract reference images from order items
        reference_images = []
        for item in event_data.get('items', []):
            if item.get('customDetails', {}).get('referenceImage'):
                reference_images.append({
                    "url": item['customDetails']['referenceImage'],
                    "item_name": item.get('name', 'Cake'),
                    "uploaded_at": now
                })
            if item.get('reference_image'):
                reference_images.append({
                    "url": item['reference_image'],
                    "item_name": item.get('name', 'Cake'),
                    "uploaded_at": now
                })
        
        # Build items list with reference image indicators
        items_list = []
        for item in event_data.get('items', []):
            item_line = f"  - {item.get('name', 'Item')} x{item.get('quantity', 1)} - ₹{item.get('price', 0)}"
            if item.get('customDetails', {}).get('petName'):
                item_line += f" (Pet: {item['customDetails']['petName']})"
            if item.get('customDetails', {}).get('referenceImage') or item.get('reference_image'):
                item_line += " 📷"
            items_list.append(item_line)
        
        # Reference images section
        ref_images_text = ""
        if reference_images:
            ref_images_text = f"\n\n**Reference Images:** {len(reference_images)} image(s) attached ⬇️"
            for idx, img in enumerate(reference_images, 1):
                ref_images_text += f"\n  [{idx}] {img['item_name']}: {img['url']}"
        
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

**Order ID / Ticket ID:** {event_data.get('order_id', 'Unknown')}
**Customer:** {event_data.get('customer_name')}
**Phone:** {event_data.get('customer_phone', 'Not provided')}
**City:** {event_data.get('city', 'Not specified')}

**Items:**
{chr(10).join(items_list)}

**Total:** ₹{event_data.get('total', 0)}

**Delivery Method:** {delivery_method.upper()}
**Delivery Date:** {event_data.get('delivery_date', 'Not specified')}
{delivery_info}

**Special Instructions:** {event_data.get('special_instructions') or 'None'}
{ref_images_text}

---
*Order ID = Ticket ID for easy tracking*""",
            "source": "cake_order",
            "source_reference": event_data.get("order_id"),
            "linked_event_id": event_data.get("order_id"),
            "reference_images": reference_images,
            "tags": ["auto-created", "celebrate", "cake", "order", event_data.get("city", "").lower().replace(" ", "-")] if event_data.get("city") else ["auto-created", "celebrate", "cake", "order"]
        })
        
        ticket_doc["messages"].append({
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"Cake order #{event_data.get('order_id')} placed by {event_data.get('customer_name')}" + (f" with {len(reference_images)} reference image(s)" if reference_images else ""),
            "sender": "system",
            "sender_name": "System",
            "channel": "auto",
            "timestamp": now,
            "is_internal": False
        })
    
    elif event_type == "custom_cake":
        # Handle reference images for custom cake
        reference_images = []
        ref_image = event_data.get('reference_image')
        if ref_image:
            reference_images.append({
                "url": ref_image,
                "item_name": "Custom Cake Design",
                "uploaded_at": now
            })
        
        ref_image_text = ""
        if ref_image:
            ref_image_text = f"\n\n**📷 REFERENCE IMAGE (IMPORTANT):**\n{ref_image}\n\n⚠️ KITCHEN MUST REFER TO THIS IMAGE FOR DESIGN"
        
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

**Request ID:** {event_data.get('request_id', 'Unknown')}
**Customer:** {event_data.get('name')}
**Phone:** {event_data.get('phone', 'Not provided')}
**Pet's Name:** {event_data.get('pet_name', 'Not specified')}

**Cake Details:**
- Size: {event_data.get('size', 'Not specified')}
- Flavour: {event_data.get('flavour', 'Not specified')}
- Theme: {event_data.get('theme', 'Not specified')}

**Occasion:** {event_data.get('occasion', 'Birthday')}
**Delivery Date:** {event_data.get('delivery_date', 'Not specified')}
**Budget:** ₹{event_data.get('budget', 'Not specified')}

**Special Requests:** {event_data.get('special_requests') or 'None'}
{ref_image_text}

---
*Custom cake - Quote required*""",
            "source": "custom_cake",
            "source_reference": event_data.get("request_id"),
            "linked_event_id": event_data.get("request_id"),
            "reference_images": reference_images,
            "tags": ["auto-created", "celebrate", "custom-cake", "requires-quote"]
        })
        
        # Add attachment if image provided
        if ref_image:
            ticket_doc["attachments"].append({
                "id": str(uuid.uuid4()),
                "type": "image",
                "url": ref_image,
                "filename": "reference_image.jpg",
                "uploaded_at": now,
                "uploaded_by": "customer"
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
    
    elif event_type == "stay_booking":
        ticket_doc.update({
            "category": "stay",
            "sub_category": "booking_request",
            "urgency": "high",
            "member": {
                "name": event_data.get("name"),
                "email": event_data.get("email"),
                "phone": event_data.get("phone"),
                "city": event_data.get("property_city"),
                "country": "India"
            },
            "pet": {
                "name": event_data.get("pet_name"),
                "breed": event_data.get("pet_breed"),
                "age": event_data.get("pet_age"),
                "weight_kg": event_data.get("pet_weight_kg")
            },
            "description": f"""🏨 NEW STAY BOOKING REQUEST

**Property:** {event_data.get('property_name')}
**Location:** {event_data.get('property_city')}

**Check-in:** {event_data.get('check_in_date')}
**Check-out:** {event_data.get('check_out_date')}
**Adults:** {event_data.get('adults', 1)}
**Pets:** {event_data.get('pets', 1)}

**Pet Details:**
- Name: {event_data.get('pet_name')}
- Breed: {event_data.get('pet_breed')}
- Age: {event_data.get('pet_age')}
- Weight: {event_data.get('pet_weight_kg')} kg

**Bundle:** {event_data.get('bundle_name') or 'Not selected'}

**Special Requests:** {event_data.get('special_requests') or 'None'}

---
*Auto-created from Stay booking request*""",
            "source": "stay_booking",
            "source_reference": event_data.get("booking_id"),
            "linked_event_id": event_data.get("booking_id"),
            "tags": ["auto-created", "stay", "booking", "concierge"]
        })
        
        ticket_doc["messages"].append({
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"Stay booking request from {event_data.get('name')} at {event_data.get('property_name')} ({event_data.get('check_in_date')} - {event_data.get('check_out_date')})",
            "sender": "system",
            "sender_name": "System",
            "channel": "auto",
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
    
    elif event_type == "travel_booking":
        ticket_doc.update({
            "category": "travel",
            "sub_category": "travel_request",
            "urgency": "high",
            "member": {
                "name": event_data.get("name"),
                "email": event_data.get("email"),
                "phone": event_data.get("phone"),
                "city": event_data.get("origin_city"),
                "country": "India"
            },
            "pet": {
                "name": event_data.get("pet_name"),
                "breed": event_data.get("pet_breed"),
                "weight_kg": event_data.get("pet_weight_kg")
            },
            "description": f"""✈️ NEW TRAVEL REQUEST

**Travel Type:** {event_data.get('travel_type', 'Domestic').upper()}
**From:** {event_data.get('origin_city', 'Not specified')}
**To:** {event_data.get('destination_city', 'Not specified')}

**Travel Date:** {event_data.get('travel_date', 'Not specified')}
**Return Date:** {event_data.get('return_date', 'N/A')}

**Pet Details:**
- Name: {event_data.get('pet_name')}
- Breed: {event_data.get('pet_breed')}
- Weight: {event_data.get('pet_weight_kg')} kg

**Service Requested:** {event_data.get('service_type', 'Full assistance')}
**Special Requirements:** {event_data.get('special_requirements') or 'None'}

---
*Auto-created from Travel booking request*""",
            "source": "travel_booking",
            "source_reference": event_data.get("booking_id"),
            "linked_event_id": event_data.get("booking_id"),
            "tags": ["auto-created", "travel", "booking", "concierge"]
        })
        
        ticket_doc["messages"].append({
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"Travel request from {event_data.get('name')} - {event_data.get('origin_city')} to {event_data.get('destination_city')} on {event_data.get('travel_date')}",
            "sender": "system",
            "sender_name": "System",
            "channel": "auto",
            "timestamp": now,
            "is_internal": False
        })
    
    elif event_type == "care_appointment":
        service_type = event_data.get('service_type', 'General Care')
        urgency = "critical" if event_data.get('is_emergency') else ("high" if service_type.lower() in ['vet', 'emergency', 'medical'] else "medium")
        
        ticket_doc.update({
            "category": "care",
            "sub_category": event_data.get('service_type', 'general').lower().replace(' ', '_'),
            "urgency": urgency,
            "member": {
                "name": event_data.get("name"),
                "email": event_data.get("email"),
                "phone": event_data.get("phone"),
                "city": event_data.get("city"),
                "country": "India"
            },
            "pet": {
                "name": event_data.get("pet_name"),
                "breed": event_data.get("pet_breed"),
                "age": event_data.get("pet_age"),
                "weight_kg": event_data.get("pet_weight_kg")
            },
            "description": f"""💊 NEW CARE REQUEST

**Service Type:** {service_type.upper()}
{'🚨 **EMERGENCY CASE**' if event_data.get('is_emergency') else ''}

**Pet Details:**
- Name: {event_data.get('pet_name')}
- Breed: {event_data.get('pet_breed')}
- Age: {event_data.get('pet_age')}
- Weight: {event_data.get('pet_weight_kg')} kg

**Preferred Date:** {event_data.get('preferred_date', 'ASAP')}
**Preferred Time:** {event_data.get('preferred_time', 'Flexible')}
**Location:** {event_data.get('location_preference', 'Clinic visit')}

**Symptoms/Concerns:** {event_data.get('symptoms') or event_data.get('concerns') or 'Not specified'}
**Additional Notes:** {event_data.get('notes') or 'None'}

---
*Auto-created from Care appointment request*""",
            "source": "care_appointment",
            "source_reference": event_data.get("appointment_id"),
            "linked_event_id": event_data.get("appointment_id"),
            "tags": ["auto-created", "care", service_type.lower().replace(' ', '-')] + (["emergency"] if event_data.get('is_emergency') else [])
        })
        
        ticket_doc["messages"].append({
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"{'🚨 EMERGENCY ' if event_data.get('is_emergency') else ''}{service_type} request for {event_data.get('pet_name')} - {event_data.get('symptoms') or event_data.get('concerns') or 'General care'}",
            "sender": "system",
            "sender_name": "System",
            "channel": "auto",
            "timestamp": now,
            "is_internal": False
        })
    
    elif event_type == "grooming_appointment":
        ticket_doc.update({
            "category": "care",
            "sub_category": "grooming",
            "urgency": "medium",
            "member": {
                "name": event_data.get("name"),
                "email": event_data.get("email"),
                "phone": event_data.get("phone"),
                "city": event_data.get("city"),
                "country": "India"
            },
            "pet": {
                "name": event_data.get("pet_name"),
                "breed": event_data.get("pet_breed"),
                "weight_kg": event_data.get("pet_weight_kg")
            },
            "description": f"""✂️ NEW GROOMING APPOINTMENT

**Service:** {event_data.get('service_type', 'Full Grooming')}

**Pet Details:**
- Name: {event_data.get('pet_name')}
- Breed: {event_data.get('pet_breed')}
- Coat Type: {event_data.get('coat_type', 'Not specified')}

**Preferred Date:** {event_data.get('preferred_date')}
**Preferred Time:** {event_data.get('preferred_time', 'Flexible')}
**Location:** {event_data.get('location', 'Salon visit')}

**Special Instructions:** {event_data.get('special_instructions') or 'None'}

---
*Auto-created from Grooming appointment*""",
            "source": "grooming",
            "source_reference": event_data.get("appointment_id"),
            "linked_event_id": event_data.get("appointment_id"),
            "tags": ["auto-created", "care", "grooming"]
        })
        
        ticket_doc["messages"].append({
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"Grooming appointment for {event_data.get('pet_name')} on {event_data.get('preferred_date')}",
            "sender": "system",
            "sender_name": "System",
            "channel": "auto",
            "timestamp": now,
            "is_internal": False
        })
    
    # Insert the ticket
    print(f"[TICKET DEBUG] About to insert ticket: {ticket_doc.get('ticket_id')}")
    try:
        result = await db.tickets.insert_one(ticket_doc)
        print(f"[TICKET DEBUG] Insert result: {result.inserted_id}")
    except Exception as e:
        print(f"[TICKET DEBUG] Insert ERROR: {e}")
        raise
    
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
