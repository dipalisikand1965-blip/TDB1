"""
Two-Way Messaging Engine for Service Desk
Handles inbound email replies, WhatsApp messages, and webhook processing
"""

from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid
import os
import re
import hashlib
import hmac
import json

router = APIRouter(prefix="/api/tickets/messaging", tags=["ticket-messaging"])

# Get MongoDB connection
def get_db():
    from server import db
    return db

# Get Resend
def get_resend():
    try:
        import resend
        api_key = os.environ.get("RESEND_API_KEY")
        if api_key:
            resend.api_key = api_key
            return resend
    except:
        pass
    return None

SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
BUSINESS_EMAIL = os.environ.get("NOTIFICATION_EMAIL", "woof@thedoggybakery.in")
WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "919663185747")
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "tdb-webhook-secret-2025")

# ============== MODELS ==============

class OutboundMessage(BaseModel):
    ticket_id: str
    message: str
    channel: str = "email"  # email, whatsapp, sms
    attachments: Optional[List[str]] = []
    is_internal: bool = False

class InboundWebhook(BaseModel):
    source: str  # resend, whatsapp, twilio
    payload: Dict[str, Any]

class WhatsAppMessage(BaseModel):
    to: str
    message: str
    ticket_id: Optional[str] = None

# ============== HELPER FUNCTIONS ==============

def extract_ticket_id_from_email(subject: str, body: str = "") -> Optional[str]:
    """Extract ticket ID from email subject or body"""
    # Pattern: TKT-YYYYMMDD-XXX
    patterns = [
        r'TKT-\d{8}-\d{3}',
        r'Ticket\s+#?(\d+)',
        r'\[Ticket:\s*(TKT-\d{8}-\d{3})\]'
    ]
    
    for pattern in patterns:
        # Check subject first
        match = re.search(pattern, subject, re.IGNORECASE)
        if match:
            return match.group(0) if 'TKT-' in match.group(0) else f"TKT-{match.group(1)}"
        
        # Then body
        match = re.search(pattern, body, re.IGNORECASE)
        if match:
            return match.group(0) if 'TKT-' in match.group(0) else f"TKT-{match.group(1)}"
    
    return None

def extract_ticket_id_from_phone(phone: str) -> Optional[str]:
    """Look up most recent open ticket for a phone number"""
    # This will be called async in the route
    return None

def clean_email_reply(body: str) -> str:
    """Clean email reply by removing quoted text"""
    # Remove common email reply patterns
    patterns = [
        r'On .+ wrote:.*$',
        r'From: .+@.+\n.*$',
        r'----+ ?Original Message ?----+.*$',
        r'>+ .*$',
        r'Sent from my (iPhone|iPad|Android).*$',
        r'Get Outlook for.*$',
    ]
    
    cleaned = body
    for pattern in patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.MULTILINE | re.DOTALL | re.IGNORECASE)
    
    # Remove excessive whitespace
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned.strip())
    
    return cleaned

def generate_reply_email_id(ticket_id: str) -> str:
    """Generate a trackable reply-to email ID"""
    # Format: ticket+TKT-XXXXXXXX-XXX@replies.thedoggycompany.in
    return f"ticket+{ticket_id}@replies.thedoggycompany.in"

async def add_message_to_ticket(ticket_id: str, message_data: dict):
    """Add a message to a ticket's conversation thread"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    message = {
        "id": str(uuid.uuid4()),
        "type": message_data.get("type", "reply"),
        "content": message_data.get("content", ""),
        "sender": message_data.get("sender", "member"),
        "sender_name": message_data.get("sender_name", "Customer"),
        "channel": message_data.get("channel", "email"),
        "timestamp": now,
        "is_internal": message_data.get("is_internal", False),
        "attachments": message_data.get("attachments", []),
        "metadata": message_data.get("metadata", {})
    }
    
    # Find ticket
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        return None
    
    # Update ticket
    update_doc = {
        "updated_at": now,
    }
    
    # If ticket was waiting on member and member replied, change status
    if ticket.get("status") == "waiting_on_member" and message_data.get("sender") == "member":
        update_doc["status"] = "in_progress"
    
    await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"messages": message},
            "$set": update_doc
        }
    )
    
    return message

# ============== OUTBOUND MESSAGING ==============

@router.post("/send")
async def send_outbound_message(message: OutboundMessage, background_tasks: BackgroundTasks):
    """Send a message to the member via specified channel"""
    db = get_db()
    
    # Get ticket
    ticket = await db.tickets.find_one({"ticket_id": message.ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    member = ticket.get("member", {})
    # Fallback to root-level customer fields if member fields are empty
    member_email = member.get("email") or ticket.get("customer_email")
    member_phone = member.get("phone") or member.get("whatsapp") or ticket.get("customer_phone")
    member_name = member.get("name") or ticket.get("customer_name") or "Valued Customer"
    
    now = datetime.now(timezone.utc).isoformat()
    
    result = {"success": False, "channel": message.channel}
    
    if message.channel == "email":
        # Send via Resend with Reply-To tracking
        resend_client = get_resend()
        if resend_client and member_email:
            try:
                # Create trackable Reply-To address
                reply_to = generate_reply_email_id(message.ticket_id)
                
                email_result = resend_client.Emails.send({
                    "from": SENDER_EMAIL,
                    "to": member_email,
                    "reply_to": reply_to,
                    "subject": f"Re: Ticket {message.ticket_id} - The Doggy Company",
                    "html": f"""
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                                <h2 style="color: white; margin: 0;">The Doggy Company</h2>
                                <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Service Desk Update</p>
                            </div>
                            <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
                                <p style="color: #374151; margin: 0 0 15px 0;"><strong>Ticket ID:</strong> {message.ticket_id}</p>
                                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                    {message.message.replace(chr(10), '<br>')}
                                </div>
                                <p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0;">
                                    Simply reply to this email to continue the conversation.
                                </p>
                            </div>
                            <div style="background: #1f2937; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                    The Doggy Company Concierge® Team
                                </p>
                            </div>
                        </div>
                    """,
                    "headers": {
                        "X-Ticket-ID": message.ticket_id,
                        "References": f"<{message.ticket_id}@thedoggycompany.in>",
                        "In-Reply-To": f"<{message.ticket_id}@thedoggycompany.in>"
                    }
                })
                result["success"] = True
                result["email_id"] = email_result.get("id") if isinstance(email_result, dict) else str(email_result)
            except Exception as e:
                result["error"] = str(e)
    
    elif message.channel == "whatsapp":
        # Generate WhatsApp click-to-chat link
        phone = member.get("whatsapp") or member.get("phone")
        if phone:
            # Clean phone number
            phone = re.sub(r'[^\d]', '', phone)
            if not phone.startswith('91') and len(phone) == 10:
                phone = '91' + phone
            
            wa_message = f"*Ticket {message.ticket_id}*\n\n{message.message}\n\n_The Doggy Company Concierge_"
            encoded_message = wa_message.replace(' ', '%20').replace('\n', '%0A')
            
            result["success"] = True
            result["whatsapp_url"] = f"https://wa.me/{phone}?text={encoded_message}"
    
    # Add message to ticket thread
    if result["success"] and not message.is_internal:
        await add_message_to_ticket(message.ticket_id, {
            "type": "outbound",
            "content": message.message,
            "sender": "concierge",
            "channel": message.channel,
            "is_internal": False,
            "metadata": result
        })
        
        # Update ticket status to waiting_on_member if currently in_progress
        ticket = await db.tickets.find_one({"ticket_id": message.ticket_id})
        if ticket and ticket.get("status") == "in_progress":
            await db.tickets.update_one(
                {"ticket_id": message.ticket_id},
                {"$set": {"status": "waiting_on_member", "updated_at": now}}
            )
    
    return result

# ============== WEBHOOK ENDPOINTS ==============

@router.post("/webhook/resend")
async def resend_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Webhook endpoint for Resend email events
    Configure in Resend Dashboard: POST https://yourdomain.com/api/tickets/messaging/webhook/resend
    
    Events handled:
    - email.delivered
    - email.bounced
    - email.complained
    - email.opened
    - email.clicked
    
    For inbound emails, use Resend's Inbound Emails feature
    """
    try:
        body = await request.json()
        
        # Verify webhook signature (optional but recommended)
        signature = request.headers.get("svix-signature")
        
        event_type = body.get("type", "")
        data = body.get("data", {})
        
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        # Log webhook event
        await db.webhook_logs.insert_one({
            "source": "resend",
            "event_type": event_type,
            "data": data,
            "received_at": now
        })
        
        if event_type == "email.delivered":
            # Update message delivery status
            email_id = data.get("email_id")
            if email_id:
                await db.tickets.update_many(
                    {"messages.metadata.email_id": email_id},
                    {"$set": {"messages.$.metadata.delivered_at": now}}
                )
        
        elif event_type == "email.bounced":
            # Mark email as bounced, may need to use different channel
            email_id = data.get("email_id")
            ticket_id = extract_ticket_id_from_email(data.get("subject", ""))
            
            if ticket_id:
                await add_message_to_ticket(ticket_id, {
                    "type": "system",
                    "content": f"Email delivery failed: {data.get('bounce_type', 'unknown')}",
                    "sender": "system",
                    "channel": "email",
                    "is_internal": True,
                    "metadata": {"bounce_data": data}
                })
        
        return {"received": True}
        
    except Exception as e:
        print(f"Resend webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook/resend/inbound")
async def resend_inbound_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Webhook for Resend Inbound Emails
    This receives customer email replies
    
    Setup in Resend:
    1. Enable Inbound Emails for your domain
    2. Configure webhook URL: POST https://yourdomain.com/api/tickets/messaging/webhook/resend/inbound
    """
    try:
        body = await request.json()
        
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        # Log inbound email
        await db.webhook_logs.insert_one({
            "source": "resend_inbound",
            "event_type": "inbound_email",
            "data": body,
            "received_at": now
        })
        
        # Extract email details
        from_email = body.get("from", "")
        to_email = body.get("to", "")
        subject = body.get("subject", "")
        text_body = body.get("text", "")
        html_body = body.get("html", "")
        attachments = body.get("attachments", [])
        
        # Try to extract ticket ID
        ticket_id = None
        
        # Check To address for ticket+TKT-XXXXXX pattern
        to_match = re.search(r'ticket\+(TKT-\d{8}-\d{3})@', to_email, re.IGNORECASE)
        if to_match:
            ticket_id = to_match.group(1)
        
        # Fallback: check subject line
        if not ticket_id:
            ticket_id = extract_ticket_id_from_email(subject, text_body)
        
        # Fallback: find most recent ticket by email
        if not ticket_id:
            sender_email = re.search(r'<(.+?)>', from_email)
            sender_email = sender_email.group(1) if sender_email else from_email
            
            ticket = await db.tickets.find_one(
                {"member.email": sender_email, "status": {"$nin": ["closed"]}},
                sort=[("created_at", -1)]
            )
            if ticket:
                ticket_id = ticket.get("ticket_id")
        
        if ticket_id:
            # Clean the reply content
            clean_content = clean_email_reply(text_body or html_body)
            
            # Add to ticket thread
            await add_message_to_ticket(ticket_id, {
                "type": "inbound",
                "content": clean_content,
                "sender": "member",
                "sender_name": from_email.split('<')[0].strip() if '<' in from_email else from_email,
                "channel": "email",
                "is_internal": False,
                "attachments": [att.get("filename") for att in attachments],
                "metadata": {
                    "from": from_email,
                    "subject": subject,
                    "original_body_length": len(text_body or html_body)
                }
            })
            
            # Notify concierge team
            resend_client = get_resend()
            if resend_client:
                ticket = await db.tickets.find_one({"ticket_id": ticket_id})
                assigned = ticket.get("assigned_to", "Unassigned")
                
                resend_client.Emails.send({
                    "from": SENDER_EMAIL,
                    "to": BUSINESS_EMAIL,
                    "subject": f"📩 Reply on {ticket_id} from {from_email.split('<')[0].strip()}",
                    "html": f"""
                        <h3>New Reply on Ticket {ticket_id}</h3>
                        <p><strong>From:</strong> {from_email}</p>
                        <p><strong>Assigned To:</strong> {assigned}</p>
                        <p><strong>Message:</strong></p>
                        <div style="background:#f5f5f5;padding:15px;border-radius:8px;white-space:pre-wrap;">{clean_content}</div>
                        <p><a href="https://thedoggycompany.in/admin">View in Service Desk →</a></p>
                    """
                })
            
            return {"received": True, "ticket_id": ticket_id, "action": "added_to_thread"}
        else:
            # Create new ticket from email
            new_ticket_id = await create_ticket_from_email(body)
            return {"received": True, "ticket_id": new_ticket_id, "action": "created_new_ticket"}
        
    except Exception as e:
        print(f"Resend inbound webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

async def create_ticket_from_email(email_data: dict) -> str:
    """Create a new ticket from an inbound email"""
    db = get_db()
    
    from_email = email_data.get("from", "")
    sender_email = re.search(r'<(.+?)>', from_email)
    sender_email = sender_email.group(1) if sender_email else from_email
    sender_name = from_email.split('<')[0].strip() if '<' in from_email else "Unknown"
    
    subject = email_data.get("subject", "")
    text_body = email_data.get("text", "") or email_data.get("html", "")
    
    # Generate ticket ID
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    count = await db.tickets.count_documents({"ticket_id": {"$regex": f"^TKT-{today}"}})
    ticket_id = f"TKT-{today}-{str(count + 1).zfill(3)}"
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Detect category from subject/content
    category = "shop"  # default
    category_keywords = {
        "celebrate": ["cake", "birthday", "celebration", "party"],
        "dine": ["restaurant", "reservation", "dining", "table"],
        "travel": ["travel", "flight", "trip", "vacation"],
        "stay": ["hotel", "stay", "accommodation", "booking"],
        "care": ["vet", "health", "medicine", "sick", "doctor"],
        "emergency": ["emergency", "urgent", "help", "asap"]
    }
    
    combined_text = (subject + " " + text_body).lower()
    for cat, keywords in category_keywords.items():
        if any(kw in combined_text for kw in keywords):
            category = cat
            break
    
    ticket_doc = {
        "ticket_id": ticket_id,
        "member": {
            "name": sender_name,
            "email": sender_email,
            "phone": None,
            "city": None,
            "country": "India"
        },
        "category": category,
        "sub_category": None,
        "urgency": "high" if "urgent" in combined_text or "emergency" in combined_text else "medium",
        "deadline": None,
        "description": clean_email_reply(text_body),
        "source": "email",
        "source_reference": email_data.get("message_id"),
        "attachments": [att.get("filename") for att in email_data.get("attachments", [])],
        "assigned_to": None,
        "status": "new",
        "priority": 3,
        "messages": [{
            "id": str(uuid.uuid4()),
            "type": "ticket_created",
            "content": f"Subject: {subject}\n\n{clean_email_reply(text_body)}",
            "sender": "member",
            "sender_name": sender_name,
            "channel": "email",
            "timestamp": now,
            "is_internal": False
        }],
        "internal_notes": "",
        "tags": ["email-created"],
        "created_at": now,
        "updated_at": now,
        "sla_due_at": None,
        "first_response_at": None,
        "resolved_at": None,
        "closed_at": None
    }
    
    await db.tickets.insert_one(ticket_doc)
    
    # Send acknowledgment email
    resend_client = get_resend()
    if resend_client:
        resend_client.Emails.send({
            "from": SENDER_EMAIL,
            "to": sender_email,
            "reply_to": generate_reply_email_id(ticket_id),
            "subject": f"Ticket {ticket_id} - We've received your request",
            "html": f"""
                <h2>Thank you for contacting The Doggy Company!</h2>
                <p>We've created a ticket for your request:</p>
                <p><strong>Ticket ID:</strong> {ticket_id}</p>
                <p><strong>Your Message:</strong></p>
                <p style="background:#f5f5f5;padding:15px;border-radius:8px;">{clean_email_reply(text_body)[:500]}...</p>
                <p>Our Concierge® team will get back to you shortly.</p>
                <p>Simply reply to this email to add more information.</p>
                <p>Best regards,<br>The Doggy Company Concierge® Team</p>
            """
        })
        
        # Notify team
        resend_client.Emails.send({
            "from": SENDER_EMAIL,
            "to": BUSINESS_EMAIL,
            "subject": f"🎫 New Email Ticket: {ticket_id}",
            "html": f"""
                <h3>New Ticket Created from Email</h3>
                <p><strong>Ticket ID:</strong> {ticket_id}</p>
                <p><strong>From:</strong> {sender_name} ({sender_email})</p>
                <p><strong>Subject:</strong> {subject}</p>
                <p><strong>Category:</strong> {category}</p>
                <p><strong>Message:</strong></p>
                <div style="background:#fff3cd;padding:15px;border-radius:8px;">{clean_email_reply(text_body)[:500]}...</div>
                <p><a href="https://thedoggycompany.in/admin">View in Service Desk →</a></p>
            """
        })
    
    return ticket_id

@router.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Webhook endpoint for WhatsApp Business API messages
    This is a placeholder for when WhatsApp Business API is integrated
    
    For now, WhatsApp interactions are handled via click-to-chat links
    """
    try:
        body = await request.json()
        
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        # Log webhook
        await db.webhook_logs.insert_one({
            "source": "whatsapp",
            "event_type": body.get("type", "message"),
            "data": body,
            "received_at": now
        })
        
        # Extract message details
        message = body.get("message", {})
        from_phone = message.get("from", "")
        text = message.get("text", {}).get("body", "")
        
        if not from_phone or not text:
            return {"received": True, "action": "no_message"}
        
        # Clean phone number
        phone = re.sub(r'[^\d]', '', from_phone)
        
        # Find ticket by phone
        ticket = await db.tickets.find_one(
            {
                "$or": [
                    {"member.phone": {"$regex": phone[-10:]}},
                    {"member.whatsapp": {"$regex": phone[-10:]}}
                ],
                "status": {"$nin": ["closed"]}
            },
            sort=[("updated_at", -1)]
        )
        
        if ticket:
            # Add to existing ticket
            await add_message_to_ticket(ticket["ticket_id"], {
                "type": "inbound",
                "content": text,
                "sender": "member",
                "sender_name": ticket.get("member", {}).get("name", "Customer"),
                "channel": "whatsapp",
                "is_internal": False,
                "metadata": {"from_phone": from_phone}
            })
            
            return {"received": True, "ticket_id": ticket["ticket_id"], "action": "added_to_thread"}
        else:
            # For now, just log - could create ticket in future
            return {"received": True, "action": "no_matching_ticket"}
        
    except Exception as e:
        print(f"WhatsApp webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============== CONVERSATION THREAD ROUTES ==============

@router.get("/{ticket_id}/thread")
async def get_conversation_thread(ticket_id: str):
    """Get the full conversation thread for a ticket"""
    db = get_db()
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    messages = ticket.get("messages", [])
    
    # Sort by timestamp
    messages.sort(key=lambda x: x.get("timestamp", ""))
    
    return {
        "ticket_id": ticket_id,
        "messages": messages,
        "total": len(messages)
    }

@router.get("/webhook-logs")
async def get_webhook_logs(
    source: Optional[str] = None,
    limit: int = 50
):
    """Get recent webhook logs for debugging"""
    db = get_db()
    
    query = {}
    if source:
        query["source"] = source
    
    cursor = db.webhook_logs.find(query).sort("received_at", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    for log in logs:
        log["id"] = str(log.pop("_id"))
    
    return {"logs": logs}
