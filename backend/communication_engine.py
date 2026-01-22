"""
Unified Reminder & Mailing System
==================================
A single intelligence-driven communication layer that decides:
- What to communicate
- When to communicate  
- Through which channel
- When to stay silent

Based on each pet's evolving Pet Soul™ profile.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
import asyncio
import logging

logger = logging.getLogger(__name__)

# ============================================
# ENUMS & CONSTANTS
# ============================================

class CommunicationType(str, Enum):
    VACCINATION_UPCOMING = "vaccination_upcoming"
    VACCINATION_OVERDUE = "vaccination_overdue"
    BIRTHDAY_NUDGE = "birthday_nudge"
    ADOPTION_DAY_NUDGE = "adoption_day_nudge"
    GROOMING_REMINDER = "grooming_reminder"
    WEEKLY_SOUL_QUESTION = "weekly_soul_question"
    RELATIONSHIP_CHECKIN = "relationship_checkin"
    TRAVEL_ADVISORY = "travel_advisory"
    CELEBRATION_FOLLOWUP = "celebration_followup"
    CUSTOM = "custom"

class Channel(str, Enum):
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    IN_APP = "in_app"
    CONCIERGE = "concierge"  # Manual handoff

class MessagePriority(str, Enum):
    CRITICAL = "critical"  # Health alerts - override limits
    HIGH = "high"          # Time-sensitive
    NORMAL = "normal"      # Regular reminders
    LOW = "low"            # Relationship touches

# Global rule: Max 1 proactive message per pet per week (except critical)
MAX_MESSAGES_PER_WEEK = 1
CRITICAL_OVERRIDE = True

# ============================================
# DEFAULT TEMPLATES
# ============================================

DEFAULT_TEMPLATES = {
    "vaccination_upcoming": {
        "name": "Vaccination Reminder (Upcoming)",
        "trigger_description": "7 days before due date",
        "channel": "whatsapp",
        "priority": "normal",
        "subject": "Vaccination Reminder for {{pet_name}}",
        "body": """Hi {{pet_parent_name}},

Just a gentle reminder — {{pet_name}}'s {{vaccine_name}} is due on {{due_date}}.

If you'd like help booking a vet visit or want us to remind you closer to the day, just let us know.

— The Doggy Company""",
        "variables": ["pet_parent_name", "pet_name", "vaccine_name", "due_date"]
    },
    
    "vaccination_overdue": {
        "name": "Vaccination Reminder (Overdue)",
        "trigger_description": "3 days after due date",
        "channel": "whatsapp",
        "priority": "high",
        "subject": "{{pet_name}}'s vaccination is overdue",
        "body": """Hi {{pet_parent_name}},

We noticed {{pet_name}}'s {{vaccine_name}} is overdue.

There's no rush — just tell us how you'd like to handle it, and we'll take care of the rest.

— The Doggy Company""",
        "variables": ["pet_parent_name", "pet_name", "vaccine_name"]
    },
    
    "birthday_nudge": {
        "name": "Birthday Nudge",
        "trigger_description": "5 days before birthday",
        "channel": "whatsapp",
        "priority": "normal",
        "subject": "{{pet_name}}'s Birthday is Coming!",
        "body": """{{pet_parent_name}},

{{pet_name}}'s birthday is coming up on {{birthday_date}} 🎂

Would you like to do something special, or should we keep it simple this year?

— The Doggy Company""",
        "variables": ["pet_parent_name", "pet_name", "birthday_date"]
    },
    
    "adoption_day_nudge": {
        "name": "Adoption Day Nudge",
        "trigger_description": "5 days before gotcha day",
        "channel": "whatsapp",
        "priority": "normal",
        "subject": "{{pet_name}}'s Gotcha Day is Coming!",
        "body": """{{pet_parent_name}},

{{pet_name}}'s adoption anniversary is coming up on {{gotcha_date}} 💛

Would you like to do something special to celebrate?

— The Doggy Company""",
        "variables": ["pet_parent_name", "pet_name", "gotcha_date"]
    },
    
    "grooming_reminder": {
        "name": "Grooming Cycle Reminder",
        "trigger_description": "Based on coat type + last grooming",
        "channel": "in_app",
        "fallback_channel": "whatsapp",
        "priority": "low",
        "subject": "Grooming time for {{pet_name}}?",
        "body": """Hi {{pet_parent_name}},

It's been a while since {{pet_name}}'s last grooming.
Dogs with {{coat_type}} coats are usually most comfortable around this time.

Want us to check availability near you?

— The Doggy Company""",
        "variables": ["pet_parent_name", "pet_name", "coat_type"]
    },
    
    "weekly_soul_question": {
        "name": "Weekly Pet Soul™ Question",
        "trigger_description": "Once per week max",
        "channel": "whatsapp",
        "priority": "low",
        "subject": "Quick question about {{pet_name}}",
        "body": """Quick question so we remember better —

{{question_text}}

{{options}}

— The Doggy Company""",
        "variables": ["pet_name", "question_text", "options"],
        "no_followup": True
    },
    
    "relationship_checkin": {
        "name": "Relationship Check-In",
        "trigger_description": "30-45 days of inactivity",
        "channel": "whatsapp",
        "priority": "low",
        "subject": "How's {{pet_name}} doing?",
        "body": """Hi {{pet_parent_name}},

Just checking in — how's {{pet_name}} doing lately?

Nothing needed unless you want to talk.

— The Doggy Company""",
        "variables": ["pet_parent_name", "pet_name"]
    },
    
    "travel_advisory": {
        "name": "Travel Advisory (Contextual)",
        "trigger_description": "Past travel behaviour + seasonality",
        "channel": "in_app",
        "priority": "low",
        "subject": "Planning a trip with {{pet_name}}?",
        "body": """You've travelled with {{pet_name}} before, so sharing this early —

If you're planning a trip in the coming months, we can help with pet-friendly stays and paperwork so it's stress-free.

— The Doggy Company""",
        "variables": ["pet_name"]
    },
    
    "celebration_followup": {
        "name": "Celebration Follow-Up",
        "trigger_description": "After birthday / adoption celebration",
        "channel": "whatsapp",
        "priority": "low",
        "subject": "Hope {{pet_name}} had a lovely day!",
        "body": """We hope {{pet_name}} had a lovely {{event_type}} 💛

If there's anything you'd like us to remember or do differently next time, just tell us.

— The Doggy Company""",
        "variables": ["pet_name", "event_type"]
    }
}

# ============================================
# WEEKLY SOUL QUESTIONS
# ============================================

SOUL_QUESTIONS = [
    {
        "id": "car_rides",
        "pillar": "travel_style",
        "field": "car_rides",
        "question": "How does {{pet_name}} usually react to car rides?",
        "options": ["1️⃣ Loves them", "2️⃣ Manages fine", "3️⃣ Gets anxious"],
        "option_values": ["Loves them", "Manages fine", "Gets anxious"]
    },
    {
        "id": "stranger_reaction",
        "pillar": "identity_temperament",
        "field": "stranger_reaction",
        "question": "How does {{pet_name}} react to new people?",
        "options": ["1️⃣ Very friendly", "2️⃣ Cautious at first", "3️⃣ Shy or nervous"],
        "option_values": ["Very friendly", "Cautious at first", "Shy or nervous"]
    },
    {
        "id": "alone_comfort",
        "pillar": "rhythm_routine",
        "field": "separation_anxiety",
        "question": "Is {{pet_name}} comfortable being left alone?",
        "options": ["1️⃣ Yes, very", "2️⃣ For short periods", "3️⃣ Gets anxious"],
        "option_values": ["Very comfortable", "Short periods only", "Has separation anxiety"]
    },
    {
        "id": "food_motivation",
        "pillar": "taste_treat",
        "field": "food_motivation",
        "question": "How food-motivated is {{pet_name}}?",
        "options": ["1️⃣ Very - will do anything for treats", "2️⃣ Moderately", "3️⃣ Not very interested"],
        "option_values": ["Very food motivated", "Moderately food motivated", "Not food motivated"]
    },
    {
        "id": "energy_level",
        "pillar": "rhythm_routine",
        "field": "energy_level",
        "question": "What's {{pet_name}}'s typical energy level?",
        "options": ["1️⃣ High energy", "2️⃣ Moderate", "3️⃣ Calm and relaxed"],
        "option_values": ["High energy", "Moderate energy", "Calm and relaxed"]
    },
    {
        "id": "grooming_tolerance",
        "pillar": "home_comforts",
        "field": "grooming_tolerance",
        "question": "How does {{pet_name}} handle grooming sessions?",
        "options": ["1️⃣ Loves being pampered", "2️⃣ Tolerates it", "3️⃣ Not a fan"],
        "option_values": ["Loves grooming", "Tolerates grooming", "Dislikes grooming"]
    },
    {
        "id": "sleep_preference",
        "pillar": "home_comforts",
        "field": "sleeping_spot",
        "question": "Where does {{pet_name}} prefer to sleep?",
        "options": ["1️⃣ Their own bed", "2️⃣ On the sofa", "3️⃣ With family members"],
        "option_values": ["Own bed", "Sofa", "With family"]
    },
    {
        "id": "play_style",
        "pillar": "identity_temperament",
        "field": "play_style",
        "question": "What's {{pet_name}}'s favorite way to play?",
        "options": ["1️⃣ Fetch & chase", "2️⃣ Tug of war", "3️⃣ Puzzle toys", "4️⃣ Cuddles only"],
        "option_values": ["Fetch and chase", "Tug of war", "Puzzle toys", "Prefers cuddles"]
    }
]

# ============================================
# COMMUNICATION ENGINE CLASS
# ============================================

class CommunicationEngine:
    """
    Central intelligence layer for all pet communications.
    Decides what, when, and how to communicate.
    """
    
    def __init__(self, db):
        self.db = db
        
    async def get_templates(self) -> List[Dict]:
        """Get all communication templates including custom ones"""
        # Get custom templates from DB
        custom_templates = await self.db.communication_templates.find().to_list(100)
        
        # Combine with defaults
        all_templates = []
        for key, template in DEFAULT_TEMPLATES.items():
            template_data = {**template, "id": key, "is_default": True}
            all_templates.append(template_data)
            
        for custom in custom_templates:
            custom["_id"] = str(custom["_id"])
            custom["is_default"] = False
            all_templates.append(custom)
            
        return all_templates
    
    async def create_template(self, template_data: Dict) -> str:
        """Create a custom template"""
        template_data["created_at"] = datetime.now(timezone.utc)
        template_data["is_active"] = True
        result = await self.db.communication_templates.insert_one(template_data)
        return str(result.inserted_id)
    
    async def update_template(self, template_id: str, template_data: Dict) -> bool:
        """Update a custom template"""
        template_data["updated_at"] = datetime.now(timezone.utc)
        result = await self.db.communication_templates.update_one(
            {"_id": template_id},
            {"$set": template_data}
        )
        return result.modified_count > 0
    
    async def can_send_message(self, pet_id: str, priority: str = "normal") -> Dict:
        """
        Check if we can send a message to this pet.
        Respects the 1-message-per-week rule (except critical).
        """
        if priority == "critical":
            return {"can_send": True, "reason": "Critical messages override limits"}
        
        # Check messages sent in last 7 days
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_count = await self.db.communication_log.count_documents({
            "pet_id": pet_id,
            "sent_at": {"$gte": week_ago},
            "status": "sent",
            "priority": {"$ne": "critical"}
        })
        
        if recent_count >= MAX_MESSAGES_PER_WEEK:
            return {
                "can_send": False,
                "reason": f"Already sent {recent_count} message(s) this week. Max is {MAX_MESSAGES_PER_WEEK}.",
                "next_available": week_ago + timedelta(days=7)
            }
        
        return {"can_send": True, "reason": "Within weekly limit"}
    
    async def get_communication_history(self, pet_id: str = None, user_id: str = None, 
                                        limit: int = 50) -> List[Dict]:
        """Get communication history for a pet or user"""
        query = {}
        if pet_id:
            query["pet_id"] = pet_id
        if user_id:
            query["user_id"] = user_id
            
        cursor = self.db.communication_log.find(query).sort("sent_at", -1).limit(limit)
        history = await cursor.to_list(limit)
        
        for item in history:
            item["_id"] = str(item["_id"])
            
        return history
    
    async def log_communication(self, data: Dict) -> str:
        """Log a sent or scheduled communication"""
        data["logged_at"] = datetime.now(timezone.utc)
        result = await self.db.communication_log.insert_one(data)
        return str(result.inserted_id)
    
    async def get_pending_reminders(self, days_ahead: int = 7) -> List[Dict]:
        """
        Scan Pet Soul data to find upcoming reminders.
        Returns pets that need communication.
        """
        reminders = []
        today = datetime.now(timezone.utc).date()
        check_date = today + timedelta(days=days_ahead)
        
        # Get all members with pets
        members = await self.db.members.find({"pets": {"$exists": True, "$ne": []}}).to_list(1000)
        
        for member in members:
            for pet in member.get("pets", []):
                pet_reminders = await self._check_pet_reminders(pet, member, today, check_date)
                reminders.extend(pet_reminders)
        
        return reminders
    
    async def _check_pet_reminders(self, pet: Dict, member: Dict, today, check_date) -> List[Dict]:
        """Check a single pet for needed reminders"""
        reminders = []
        pet_id = pet.get("id", str(pet.get("_id", "")))
        pet_name = pet.get("name", "Your pet")
        parent_name = member.get("name", member.get("first_name", ""))
        
        # Birthday check (5 days before)
        birthday = pet.get("birth_date") or pet.get("dob")
        if birthday:
            try:
                if isinstance(birthday, str):
                    birth_date = datetime.fromisoformat(birthday.replace("Z", "+00:00")).date()
                else:
                    birth_date = birthday.date() if hasattr(birthday, 'date') else birthday
                
                # Check if birthday is in next 5-7 days
                this_year_birthday = birth_date.replace(year=today.year)
                if this_year_birthday < today:
                    this_year_birthday = birth_date.replace(year=today.year + 1)
                    
                days_until = (this_year_birthday - today).days
                if 5 <= days_until <= 7:
                    reminders.append({
                        "type": "birthday_nudge",
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "user_id": str(member.get("_id", "")),
                        "parent_name": parent_name,
                        "parent_email": member.get("email"),
                        "event_date": this_year_birthday.isoformat(),
                        "days_until": days_until,
                        "priority": "normal"
                    })
            except Exception as e:
                logger.warning(f"Error parsing birthday for {pet_name}: {e}")
        
        # Gotcha day check (5 days before)
        gotcha = pet.get("gotcha_date") or pet.get("adoption_date")
        if gotcha:
            try:
                if isinstance(gotcha, str):
                    gotcha_date = datetime.fromisoformat(gotcha.replace("Z", "+00:00")).date()
                else:
                    gotcha_date = gotcha.date() if hasattr(gotcha, 'date') else gotcha
                
                this_year_gotcha = gotcha_date.replace(year=today.year)
                if this_year_gotcha < today:
                    this_year_gotcha = gotcha_date.replace(year=today.year + 1)
                    
                days_until = (this_year_gotcha - today).days
                if 5 <= days_until <= 7:
                    reminders.append({
                        "type": "adoption_day_nudge",
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "user_id": str(member.get("_id", "")),
                        "parent_name": parent_name,
                        "parent_email": member.get("email"),
                        "event_date": this_year_gotcha.isoformat(),
                        "days_until": days_until,
                        "priority": "normal"
                    })
            except Exception as e:
                logger.warning(f"Error parsing gotcha date for {pet_name}: {e}")
        
        # Vaccination check (from health records)
        vaccinations = pet.get("vaccinations", [])
        for vax in vaccinations:
            next_due = vax.get("next_due_date")
            if next_due:
                try:
                    if isinstance(next_due, str):
                        due_date = datetime.fromisoformat(next_due.replace("Z", "+00:00")).date()
                    else:
                        due_date = next_due.date() if hasattr(next_due, 'date') else next_due
                    
                    days_until = (due_date - today).days
                    
                    # Upcoming (7 days before)
                    if 5 <= days_until <= 7:
                        reminders.append({
                            "type": "vaccination_upcoming",
                            "pet_id": pet_id,
                            "pet_name": pet_name,
                            "user_id": str(member.get("_id", "")),
                            "parent_name": parent_name,
                            "parent_email": member.get("email"),
                            "vaccine_name": vax.get("name", "vaccination"),
                            "due_date": due_date.isoformat(),
                            "days_until": days_until,
                            "priority": "normal"
                        })
                    # Overdue (3+ days past)
                    elif days_until < -3:
                        reminders.append({
                            "type": "vaccination_overdue",
                            "pet_id": pet_id,
                            "pet_name": pet_name,
                            "user_id": str(member.get("_id", "")),
                            "parent_name": parent_name,
                            "parent_email": member.get("email"),
                            "vaccine_name": vax.get("name", "vaccination"),
                            "due_date": due_date.isoformat(),
                            "days_overdue": abs(days_until),
                            "priority": "high"
                        })
                except Exception as e:
                    logger.warning(f"Error parsing vaccination date: {e}")
        
        return reminders
    
    async def get_next_soul_question(self, pet_id: str) -> Optional[Dict]:
        """
        Get the next Pet Soul question for weekly enrichment.
        Picks questions not yet answered.
        """
        # Get pet's current soul data
        pet = await self.db.members.find_one(
            {"pets.id": pet_id},
            {"pets.$": 1}
        )
        
        if not pet or not pet.get("pets"):
            return None
            
        pet_data = pet["pets"][0]
        pet_name = pet_data.get("name", "your pet")
        soul_answers = pet_data.get("doggy_soul_answers", {})
        
        # Find unanswered questions
        for question in SOUL_QUESTIONS:
            field = question["field"]
            if field not in soul_answers or not soul_answers[field]:
                # Format question with pet name
                formatted = {
                    **question,
                    "question": question["question"].replace("{{pet_name}}", pet_name),
                    "pet_id": pet_id,
                    "pet_name": pet_name
                }
                return formatted
        
        return None  # All questions answered
    
    async def process_soul_question_response(self, pet_id: str, question_id: str, 
                                              response_index: int) -> bool:
        """Process a response to a soul question and update Pet Soul"""
        # Find the question
        question = next((q for q in SOUL_QUESTIONS if q["id"] == question_id), None)
        if not question:
            return False
        
        # Get the value for the response
        if response_index < 0 or response_index >= len(question["option_values"]):
            return False
            
        value = question["option_values"][response_index]
        field = question["field"]
        
        # Update Pet Soul
        result = await self.db.members.update_one(
            {"pets.id": pet_id},
            {"$set": {f"pets.$.doggy_soul_answers.{field}": value}}
        )
        
        return result.modified_count > 0
    
    async def render_template(self, template_id: str, variables: Dict) -> Dict:
        """Render a template with variables"""
        # Get template
        template = DEFAULT_TEMPLATES.get(template_id)
        if not template:
            template = await self.db.communication_templates.find_one({"id": template_id})
        
        if not template:
            return None
        
        # Render body
        body = template["body"]
        subject = template.get("subject", "")
        
        for key, value in variables.items():
            placeholder = "{{" + key + "}}"
            body = body.replace(placeholder, str(value))
            subject = subject.replace(placeholder, str(value))
        
        return {
            "subject": subject,
            "body": body,
            "channel": template.get("channel", "email"),
            "priority": template.get("priority", "normal")
        }
    
    async def schedule_communication(self, data: Dict) -> str:
        """Schedule a communication for future delivery"""
        data["status"] = "scheduled"
        data["scheduled_at"] = datetime.now(timezone.utc)
        result = await self.db.scheduled_communications.insert_one(data)
        return str(result.inserted_id)
    
    async def get_member_preferences(self, user_id: str) -> Dict:
        """Get member's communication preferences"""
        member = await self.db.members.find_one({"_id": user_id})
        if not member:
            return {
                "preferred_channel": "whatsapp",
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "08:00",
                "frequency": "normal"
            }
        
        return member.get("communication_preferences", {
            "preferred_channel": "whatsapp",
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "08:00",
            "frequency": "normal"
        })
    
    async def update_member_preferences(self, user_id: str, preferences: Dict) -> bool:
        """Update member's communication preferences"""
        result = await self.db.members.update_one(
            {"_id": user_id},
            {"$set": {"communication_preferences": preferences}}
        )
        return result.modified_count > 0


# ============================================
# DECISION ENGINE
# ============================================

class CommunicationDecisionEngine:
    """
    Decides whether to send, what to send, and when to stay silent.
    Implements the "thoughtful nudge" philosophy.
    """
    
    def __init__(self, comm_engine: CommunicationEngine):
        self.engine = comm_engine
    
    async def should_communicate(self, pet_id: str, comm_type: str, 
                                  context: Dict = None) -> Dict:
        """
        The core decision function.
        Returns: { should_send: bool, reason: str, alternative: str? }
        """
        # Check weekly limit
        can_send = await self.engine.can_send_message(pet_id, context.get("priority", "normal"))
        if not can_send["can_send"]:
            return {
                "should_send": False,
                "reason": can_send["reason"],
                "decision": "SILENCE - Weekly limit reached"
            }
        
        # Check if same type was sent recently (prevent repetition)
        recent = await self.engine.db.communication_log.find_one({
            "pet_id": pet_id,
            "type": comm_type,
            "sent_at": {"$gte": datetime.now(timezone.utc) - timedelta(days=30)}
        })
        
        if recent and comm_type not in ["vaccination_overdue"]:  # Critical ones can repeat
            return {
                "should_send": False,
                "reason": f"Similar message sent on {recent['sent_at'].strftime('%Y-%m-%d')}",
                "decision": "SILENCE - Avoid repetition"
            }
        
        # Check member preferences
        if context and context.get("user_id"):
            prefs = await self.engine.get_member_preferences(context["user_id"])
            
            # Check quiet hours
            now = datetime.now(timezone.utc)
            current_hour = now.hour
            quiet_start = int(prefs.get("quiet_hours_start", "22:00").split(":")[0])
            quiet_end = int(prefs.get("quiet_hours_end", "08:00").split(":")[0])
            
            if quiet_start <= current_hour or current_hour < quiet_end:
                if context.get("priority") != "critical":
                    return {
                        "should_send": False,
                        "reason": "Currently in quiet hours",
                        "decision": "DELAY - Schedule for later",
                        "suggested_time": f"{quiet_end}:00"
                    }
        
        # Pass the "thoughtful human" test
        return {
            "should_send": True,
            "reason": "Passes all checks",
            "decision": "SEND - Thoughtful and timely"
        }
    
    async def choose_channel(self, pet_id: str, user_id: str, comm_type: str) -> str:
        """Choose the best channel for this communication"""
        prefs = await self.engine.get_member_preferences(user_id)
        preferred = prefs.get("preferred_channel", "whatsapp")
        
        # Template default
        template = DEFAULT_TEMPLATES.get(comm_type, {})
        template_channel = template.get("channel", "whatsapp")
        
        # Priority: Member preference > Template default > WhatsApp
        if preferred in ["whatsapp", "email", "in_app"]:
            return preferred
        
        return template_channel
