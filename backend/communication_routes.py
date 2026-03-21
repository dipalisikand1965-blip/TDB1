"""
Communication System API Routes
================================
Admin panel endpoints for managing the Unified Reminder & Mailing System.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter(prefix="/api/admin/communications", tags=["Communications"])

# ============================================
# PYDANTIC MODELS
# ============================================

class TemplateCreate(BaseModel):
    name: str
    trigger_description: str
    channel: str = "whatsapp"
    priority: str = "normal"
    subject: str
    body: str
    variables: List[str] = []
    is_active: bool = True

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    trigger_description: Optional[str] = None
    channel: Optional[str] = None
    priority: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None

class SendCommunication(BaseModel):
    pet_id: str
    template_id: str
    variables: Dict[str, Any] = {}
    channel: Optional[str] = None
    scheduled_for: Optional[datetime] = None

class CommunicationPreferences(BaseModel):
    preferred_channel: str = "whatsapp"
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "08:00"
    frequency: str = "normal"  # normal, reduced, minimal

class SoulQuestionResponse(BaseModel):
    pet_id: str
    question_id: str
    response_index: int


# ============================================
# TEMPLATE MANAGEMENT
# ============================================

def setup_communication_routes(app, db):
    """Setup all communication routes with database access"""
    
    from communication_engine import CommunicationEngine, CommunicationDecisionEngine, VaccineReminderScheduler, DEFAULT_TEMPLATES, SOUL_QUESTIONS
    
    comm_engine = CommunicationEngine(db)
    decision_engine = CommunicationDecisionEngine(comm_engine)
    vaccine_scheduler = VaccineReminderScheduler(db, comm_engine, decision_engine)
    
    @app.get("/api/admin/communications/templates")
    async def get_templates():
        """Get all communication templates"""
        templates = await comm_engine.get_templates()
        return {"templates": templates, "count": len(templates)}
    
    @app.get("/api/admin/communications/templates/defaults")
    async def get_default_templates():
        """Get default system templates"""
        templates = []
        for key, template in DEFAULT_TEMPLATES.items():
            templates.append({**template, "id": key, "is_default": True})
        return {"templates": templates}
    
    @app.post("/api/admin/communications/templates")
    async def create_template(template: TemplateCreate):
        """Create a custom template"""
        template_data = template.dict()
        template_data["id"] = f"custom_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        template_id = await comm_engine.create_template(template_data)
        return {"id": template_id, "message": "Template created"}
    
    @app.put("/api/admin/communications/templates/{template_id}")
    async def update_template(template_id: str, template: TemplateUpdate):
        """Update a custom template"""
        update_data = {k: v for k, v in template.dict().items() if v is not None}
        success = await comm_engine.update_template(template_id, update_data)
        if not success:
            raise HTTPException(404, "Template not found or is a default template")
        return {"message": "Template updated"}
    
    @app.delete("/api/admin/communications/templates/{template_id}")
    async def delete_template(template_id: str):
        """Delete a custom template"""
        result = await db.communication_templates.delete_one({"id": template_id})
        if result.deleted_count == 0:
            raise HTTPException(404, "Template not found")
        return {"message": "Template deleted"}
    
    # ============================================
    # COMMUNICATION HISTORY & LOGS
    # ============================================
    
    @app.get("/api/admin/communications/history")
    async def get_communication_history(
        pet_id: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 50
    ):
        """Get communication history"""
        history = await comm_engine.get_communication_history(pet_id, user_id, limit)
        return {"history": history, "count": len(history)}
    
    @app.get("/api/admin/communications/pet/{pet_id}/timeline")
    async def get_pet_communication_timeline(pet_id: str):
        """Get full communication timeline for a specific pet"""
        history = await comm_engine.get_communication_history(pet_id=pet_id, limit=100)
        
        # Get pet info
        member = await db.members.find_one(
            {"pets.id": pet_id},
            {"pets.$": 1, "name": 1, "email": 1}
        )
        
        pet_info = None
        parent_info = None
        if member:
            parent_info = {"name": member.get("name"), "email": member.get("email")}
            if member.get("pets"):
                pet_info = member["pets"][0]
        
        return {
            "pet": pet_info,
            "parent": parent_info,
            "timeline": history,
            "total_sent": len([h for h in history if h.get("status") == "sent"]),
            "total_scheduled": len([h for h in history if h.get("status") == "scheduled"])
        }
    
    # ============================================
    # PENDING REMINDERS
    # ============================================
    
    @app.get("/api/admin/communications/pending")
    async def get_pending_reminders(days_ahead: int = 7):
        """Get all pending reminders for the next N days"""
        reminders = await comm_engine.get_pending_reminders(days_ahead)
        
        # Group by type
        by_type = {}
        for r in reminders:
            t = r["type"]
            if t not in by_type:
                by_type[t] = []
            by_type[t].append(r)
        
        return {
            "reminders": reminders,
            "by_type": by_type,
            "total": len(reminders)
        }
    
    # ============================================
    # RUN SCHEDULER NOW
    # ============================================

    @app.post("/api/admin/communications/run-scheduler")
    async def run_scheduler_now():
        """Trigger the reminder scheduler immediately — check all pending reminders and send them."""
        try:
            # Get all pending reminders for next 30 days
            reminders = await comm_engine.get_pending_reminders(30)
            sent_count = 0
            errors = []

            for reminder in reminders[:50]:  # Cap at 50 per run
                try:
                    pet_id = reminder.get("pet_id")
                    reminder_type = reminder.get("type","vaccination")
                    if pet_id and reminder_type:
                        await comm_engine.send_reminder(pet_id, reminder_type)
                        sent_count += 1
                except Exception as e:
                    errors.append(str(e))

            return {
                "success": True,
                "pending_found": len(reminders),
                "sent": sent_count,
                "errors": errors[:5],
                "message": f"Scheduler ran: {sent_count} reminders sent, {len(reminders)} total pending"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============================================
    # SEND / SCHEDULE COMMUNICATION
    # ============================================
    
    @app.post("/api/admin/communications/send")
    async def send_communication(data: SendCommunication):
        """Send or schedule a communication"""
        # Check if can send
        can_send_result = await comm_engine.can_send_message(data.pet_id, "normal")
        
        # Decision check
        decision = await decision_engine.should_communicate(
            data.pet_id,
            data.template_id,
            {"priority": "normal"}
        )
        
        if not decision["should_send"]:
            return {
                "sent": False,
                "reason": decision["reason"],
                "decision": decision["decision"]
            }
        
        # Render template
        rendered = await comm_engine.render_template(data.template_id, data.variables)
        if not rendered:
            raise HTTPException(404, "Template not found")
        
        # Choose channel
        channel = data.channel or rendered["channel"]
        
        # Get pet and parent info
        member = await db.members.find_one({"pets.id": data.pet_id})
        if not member:
            raise HTTPException(404, "Pet not found")
        
        pet_info = next((p for p in member.get("pets", []) if p.get("id") == data.pet_id), None)
        pet_name = pet_info.get("name") if pet_info else "Unknown"
        parent_name = member.get("name", member.get("first_name", ""))
        parent_email = member.get("email")
        
        # Actually send the communication
        send_result = {"success": False, "provider": "none"}
        whatsapp_link = None
        
        if not data.scheduled_for:  # Only send if not scheduled for later
            if channel == "email" and parent_email:
                # Send email via Resend
                send_result = await comm_engine.send_email(
                    to_email=parent_email,
                    subject=rendered["subject"],
                    body=rendered["body"],
                    pet_name=pet_name,
                    parent_name=parent_name
                )
            elif channel == "whatsapp":
                # Generate WhatsApp link (provisional until API integration)
                whatsapp_link = comm_engine.generate_whatsapp_link(
                    message=f"{rendered['subject']}\n\n{rendered['body']}"
                )
                send_result = {"success": True, "provider": "whatsapp_link", "link": whatsapp_link}
        
        # Log the communication
        log_data = {
            "pet_id": data.pet_id,
            "pet_name": pet_name,
            "user_id": str(member.get("_id", "")),
            "parent_email": parent_email,
            "parent_name": parent_name,
            "type": data.template_id,
            "channel": channel,
            "subject": rendered["subject"],
            "body": rendered["body"],
            "priority": rendered["priority"],
            "variables": data.variables,
            "status": "scheduled" if data.scheduled_for else ("sent" if send_result.get("success") else "failed"),
            "sent_at": data.scheduled_for or datetime.now(timezone.utc),
            "send_result": send_result,
            "whatsapp_link": whatsapp_link
        }
        
        log_id = await comm_engine.log_communication(log_data)
        
        return {
            "sent": send_result.get("success", False),
            "log_id": log_id,
            "channel": channel,
            "send_result": send_result,
            "whatsapp_link": whatsapp_link,
            "message": f"Communication {'scheduled' if data.scheduled_for else ('sent' if send_result.get('success') else 'logged (send failed)')}"
        }
    
    @app.post("/api/admin/communications/trigger-reminder")
    async def trigger_reminder(pet_id: str, reminder_type: str):
        """Manually trigger a specific reminder for a pet"""
        # Get pet info
        member = await db.members.find_one(
            {"pets.id": pet_id},
            {"pets.$": 1, "name": 1, "email": 1, "_id": 1}
        )
        
        if not member or not member.get("pets"):
            raise HTTPException(404, "Pet not found")
        
        pet = member["pets"][0]
        
        # Build variables
        variables = {
            "pet_name": pet.get("name", "your pet"),
            "pet_parent_name": member.get("name", ""),
        }
        
        # Add type-specific variables
        if "birthday" in reminder_type:
            variables["birthday_date"] = pet.get("birth_date", "soon")
        elif "adoption" in reminder_type:
            variables["gotcha_date"] = pet.get("gotcha_date", "soon")
        
        # Send
        data = SendCommunication(
            pet_id=pet_id,
            template_id=reminder_type,
            variables=variables
        )
        
        return await send_communication(data)
    
    # ============================================
    # SOUL QUESTIONS
    # ============================================
    
    @app.get("/api/admin/communications/soul-questions")
    async def get_soul_questions():
        """Get all available soul questions"""
        return {"questions": SOUL_QUESTIONS}
    
    @app.get("/api/admin/communications/soul-questions/next/{pet_id}")
    async def get_next_soul_question(pet_id: str):
        """Get the next unanswered soul question for a pet"""
        question = await comm_engine.get_next_soul_question(pet_id)
        if not question:
            return {"question": None, "message": "All questions answered!"}
        return {"question": question}
    
    @app.post("/api/admin/communications/soul-questions/respond")
    async def respond_to_soul_question(response: SoulQuestionResponse):
        """Process a response to a soul question"""
        success = await comm_engine.process_soul_question_response(
            response.pet_id,
            response.question_id,
            response.response_index
        )
        
        if not success:
            raise HTTPException(400, "Could not process response")
        
        return {"success": True, "message": "Pet Soul updated!"}
    
    # ============================================
    # MEMBER PREFERENCES
    # ============================================
    
    @app.get("/api/communications/preferences/{user_id}")
    async def get_preferences(user_id: str):
        """Get member's communication preferences"""
        prefs = await comm_engine.get_member_preferences(user_id)
        return {"preferences": prefs}
    
    @app.put("/api/communications/preferences/{user_id}")
    async def update_preferences(user_id: str, prefs: CommunicationPreferences):
        """Update member's communication preferences"""
        success = await comm_engine.update_member_preferences(user_id, prefs.dict())
        if not success:
            raise HTTPException(404, "Member not found")
        return {"message": "Preferences updated"}
    
    # ============================================
    # ANALYTICS
    # ============================================
    
    @app.get("/api/admin/communications/analytics")
    async def get_communication_analytics():
        """Get communication analytics"""
        # Total sent
        total_sent = await db.communication_log.count_documents({"status": "sent"})
        
        # By channel
        by_channel = await db.communication_log.aggregate([
            {"$match": {"status": "sent"}},
            {"$group": {"_id": "$channel", "count": {"$sum": 1}}}
        ]).to_list(10)
        
        # By type
        by_type = await db.communication_log.aggregate([
            {"$match": {"status": "sent"}},
            {"$group": {"_id": "$type", "count": {"$sum": 1}}}
        ]).to_list(20)
        
        # Last 7 days
        from datetime import timedelta
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent = await db.communication_log.count_documents({
            "status": "sent",
            "sent_at": {"$gte": week_ago}
        })
        
        return {
            "total_sent": total_sent,
            "sent_last_7_days": recent,
            "by_channel": {item["_id"]: item["count"] for item in by_channel},
            "by_type": {item["_id"]: item["count"] for item in by_type}
        }
    
    # ============================================
    # TEST EMAIL ENDPOINT
    # ============================================
    
    class TestEmailRequest(BaseModel):
        to_email: str
        subject: str = "Test Email from The Doggy Company"
        body: str = "This is a test email from the Unified Reminder System."
        pet_name: Optional[str] = None
    
    @app.post("/api/admin/communications/test-email")
    async def send_test_email(data: TestEmailRequest):
        """Send a test email to verify email configuration"""
        result = await comm_engine.send_email(
            to_email=data.to_email,
            subject=data.subject,
            body=data.body,
            pet_name=data.pet_name
        )
        
        # Log the test
        await db.communication_log.insert_one({
            "type": "test_email",
            "channel": "email",
            "to_email": data.to_email,
            "subject": data.subject,
            "status": "sent" if result.get("success") else "failed",
            "send_result": result,
            "sent_at": datetime.now(timezone.utc)
        })
        
        return result
    
    @app.get("/api/admin/communications/config-status")
    async def get_communication_config_status():
        """Check the status of communication integrations"""
        from communication_engine import RESEND_AVAILABLE, SENDER_EMAIL, WHATSAPP_NUMBER
        
        return {
            "email": {
                "provider": "resend",
                "configured": RESEND_AVAILABLE,
                "sender_email": SENDER_EMAIL
            },
            "whatsapp": {
                "provider": "provisional (link-based)",
                "configured": True,
                "phone": WHATSAPP_NUMBER,
                "note": "WhatsApp uses click-to-chat links until Business API is integrated"
            },
            "in_app": {
                "provider": "internal",
                "configured": True
            }
        }
    
    # ============================================
    # VACCINE REMINDER SCHEDULER
    # ============================================
    
    @app.post("/api/admin/communications/run-vaccine-scheduler")
    async def run_vaccine_scheduler():
        """Manually trigger the vaccine reminder scheduler"""
        result = await vaccine_scheduler.check_and_send_vaccine_reminders()
        return {
            "success": True,
            "message": f"Checked {result.get('checked', 0)} pets, sent {result.get('reminders_sent', 0)} reminders",
            **result
        }
    
    @app.get("/api/admin/communications/vaccine-alerts")
    async def get_vaccine_alerts(days_ahead: int = 14):
        """Get upcoming vaccine alerts for admin dashboard"""
        alerts = await vaccine_scheduler.get_upcoming_vaccine_alerts(days_ahead)
        return {
            "alerts": alerts,
            "count": len(alerts),
            "overdue_count": len([a for a in alerts if a["status"] == "overdue"]),
            "due_soon_count": len([a for a in alerts if a["status"] == "due_soon"])
        }
    
    return router
