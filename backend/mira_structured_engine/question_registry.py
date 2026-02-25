"""
Mira Structured Engine - Question Registry
==========================================
Canonical questions and options for each service type.
LLM can reorder/phrase, but options are fixed.

This ensures:
- Consistent quick replies
- Pet-safe filtering
- No random/mismatched options
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field


@dataclass
class QuestionOption:
    """A single option for a question"""
    value: str
    label: str
    requires: Optional[Dict[str, Any]] = None  # Conditions to show this option
    excludes: Optional[Dict[str, Any]] = None  # Conditions to disable this option
    

@dataclass  
class Question:
    """A canonical question in a service flow"""
    question_id: str
    question_text: str
    field_name: str  # Which ticket field this fills
    options: List[QuestionOption] = field(default_factory=list)
    required: bool = True
    order: int = 0  # Display order in flow
    
    # For LLM context
    purpose: str = ""  # Why we ask this
    pet_context_hint: str = ""  # How pet context affects this


# ═══════════════════════════════════════════════════════════════════════════════
# GROOMING QUESTIONS (Care Pillar - First Vertical)
# ═══════════════════════════════════════════════════════════════════════════════

GROOMING_QUESTIONS: Dict[str, Question] = {
    
    "grooming.location_mode": Question(
        question_id="grooming.location_mode",
        question_text="At-home or salon this time?",
        field_name="location_mode",
        required=True,
        order=1,
        purpose="Determines service delivery mode",
        pet_context_hint="If pet is noise-sensitive or anxious, prefer at-home. If pet loves car rides and socializing, salon may be fine.",
        options=[
            QuestionOption(value="at_home", label="At home"),
            QuestionOption(value="salon", label="Salon"),
            QuestionOption(value="either", label="Either works"),
            QuestionOption(value="not_sure", label="Help me decide"),
        ]
    ),
    
    "grooming.service_scope": Question(
        question_id="grooming.service_scope",
        question_text="What does {pet_name} need?",
        field_name="service_scope",
        required=True,
        order=2,
        purpose="Determines which grooming services",
        pet_context_hint="Consider coat type, recent grooming history, any skin conditions.",
        options=[
            QuestionOption(value="full_groom", label="Full grooming (bath + haircut + nails)"),
            QuestionOption(value="bath_only", label="Bath only"),
            QuestionOption(value="haircut_only", label="Haircut/trim only"),
            QuestionOption(value="nails_only", label="Nails only"),
            QuestionOption(value="ear_cleaning", label="Ear cleaning"),
            QuestionOption(value="custom", label="Let me specify"),
        ]
    ),
    
    "grooming.time_window": Question(
        question_id="grooming.time_window",
        question_text="When works best?",
        field_name="time_window",
        required=True,
        order=3,
        purpose="Schedule preference",
        pet_context_hint="Consider pet's routine, feeding times, energy patterns.",
        options=[
            QuestionOption(value="asap", label="As soon as possible"),
            QuestionOption(value="this_week", label="This week"),
            QuestionOption(value="next_week", label="Next week"),
            QuestionOption(value="specific_date", label="I have a specific date"),
            QuestionOption(value="flexible", label="I'm flexible"),
        ]
    ),
    
    "grooming.address": Question(
        question_id="grooming.address",
        question_text="Where should the groomer come?",
        field_name="address",
        required=False,  # Only if at_home
        order=4,
        purpose="Service location for at-home",
        pet_context_hint="Use saved address if available.",
        options=[
            QuestionOption(value="saved_home", label="My saved home address"),
            QuestionOption(value="different", label="A different address"),
        ]
    ),
    
    "grooming.special_notes": Question(
        question_id="grooming.special_notes",
        question_text="Anything the groomer should know about {pet_name}?",
        field_name="special_notes",
        required=False,
        order=5,
        purpose="Special handling instructions",
        pet_context_hint="Auto-fill from soul: anxiety triggers, handling preferences, sensitivities.",
        options=[]  # Free text
    ),
}


# ═══════════════════════════════════════════════════════════════════════════════
# VET VISIT QUESTIONS (Care Pillar)
# ═══════════════════════════════════════════════════════════════════════════════

VET_VISIT_QUESTIONS: Dict[str, Question] = {
    
    "vet.visit_type": Question(
        question_id="vet.visit_type",
        question_text="What kind of visit does {pet_name} need?",
        field_name="visit_type",
        required=True,
        order=1,
        purpose="Determines urgency and clinic type",
        pet_context_hint="Check health history, due vaccinations, recent symptoms mentioned.",
        options=[
            QuestionOption(value="checkup", label="Regular checkup"),
            QuestionOption(value="vaccination", label="Vaccination"),
            QuestionOption(value="concern", label="I have a health concern"),
            QuestionOption(value="follow_up", label="Follow-up visit"),
            QuestionOption(value="emergency", label="It's urgent/emergency"),
        ]
    ),
    
    "vet.location_mode": Question(
        question_id="vet.location_mode",
        question_text="Home visit or clinic?",
        field_name="location_mode",
        required=True,
        order=2,
        purpose="Determines service delivery",
        pet_context_hint="If pet is anxious at clinics, recommend home visit.",
        options=[
            QuestionOption(value="home_visit", label="Home visit"),
            QuestionOption(value="clinic", label="I'll take them to a clinic"),
            QuestionOption(value="help_choose", label="Help me decide"),
        ]
    ),
    
    "vet.time_window": Question(
        question_id="vet.time_window",
        question_text="When works best?",
        field_name="time_window",
        required=True,
        order=3,
        purpose="Schedule preference",
        pet_context_hint="If concern flagged, suggest sooner.",
        options=[
            QuestionOption(value="asap", label="As soon as possible"),
            QuestionOption(value="this_week", label="This week"),
            QuestionOption(value="next_week", label="Next week"),
            QuestionOption(value="specific_date", label="I have a specific date"),
        ]
    ),
    
    "vet.concern_details": Question(
        question_id="vet.concern_details",
        question_text="Can you tell me more about what's going on with {pet_name}?",
        field_name="concern_details",
        required=False,  # Only if visit_type = concern
        order=4,
        purpose="Helps route to right specialist",
        pet_context_hint="Never diagnose. Gather info for concierge/vet.",
        options=[]  # Free text
    ),
}


# ═══════════════════════════════════════════════════════════════════════════════
# BOARDING QUESTIONS (Stay Pillar)
# ═══════════════════════════════════════════════════════════════════════════════

BOARDING_QUESTIONS: Dict[str, Question] = {
    
    "boarding.stay_type": Question(
        question_id="boarding.stay_type",
        question_text="What kind of stay does {pet_name} need?",
        field_name="stay_type",
        required=True,
        order=1,
        purpose="Determines facility type",
        pet_context_hint="Consider separation anxiety, social comfort with other dogs.",
        options=[
            QuestionOption(value="boarding", label="Boarding (overnight)"),
            QuestionOption(value="daycare", label="Daycare (daytime only)"),
            QuestionOption(value="pet_sitting", label="Pet sitter at my home"),
            QuestionOption(value="not_sure", label="Help me decide"),
        ]
    ),
    
    "boarding.dates": Question(
        question_id="boarding.dates",
        question_text="What dates?",
        field_name="dates",
        required=True,
        order=2,
        purpose="Duration and scheduling",
        pet_context_hint="Check for conflicts with known events.",
        options=[
            QuestionOption(value="specific", label="I have specific dates"),
            QuestionOption(value="flexible", label="I'm flexible on dates"),
        ]
    ),
    
    "boarding.environment": Question(
        question_id="boarding.environment",
        question_text="What kind of environment would {pet_name} do best in?",
        field_name="environment_preference",
        required=False,
        order=3,
        purpose="Match to right facility",
        pet_context_hint="Use soul data: social comfort, anxiety level, energy.",
        options=[
            QuestionOption(value="quiet", label="Quiet, low-stimulation"),
            QuestionOption(value="social", label="Social, with other dogs"),
            QuestionOption(value="home_like", label="Home-like environment"),
            QuestionOption(value="no_preference", label="No strong preference"),
        ]
    ),
}


# ═══════════════════════════════════════════════════════════════════════════════
# SERVICE TYPE REGISTRY
# ═══════════════════════════════════════════════════════════════════════════════

SERVICE_QUESTIONS = {
    "grooming": GROOMING_QUESTIONS,
    "vet_visit": VET_VISIT_QUESTIONS,
    "boarding": BOARDING_QUESTIONS,
}


# Required fields per service type (minimum to create OPEN ticket)
SERVICE_REQUIRED_FIELDS = {
    "grooming": ["location_mode", "service_scope", "time_window"],
    "vet_visit": ["visit_type", "location_mode", "time_window"],
    "boarding": ["stay_type", "dates"],
}


def get_questions_for_service(service_type: str) -> Dict[str, Question]:
    """Get all questions for a service type"""
    return SERVICE_QUESTIONS.get(service_type, {})


def get_required_fields(service_type: str) -> List[str]:
    """Get required fields for a service type"""
    return SERVICE_REQUIRED_FIELDS.get(service_type, [])


def get_next_question(service_type: str, filled_fields: Dict[str, Any]) -> Optional[Question]:
    """Get the next unanswered question in order"""
    questions = get_questions_for_service(service_type)
    
    # Sort by order
    sorted_questions = sorted(questions.values(), key=lambda q: q.order)
    
    for question in sorted_questions:
        if question.field_name not in filled_fields:
            if question.required:
                return question
            # Check if optional question is relevant
            # e.g., address only needed if location_mode = at_home
            if should_ask_optional_question(question, filled_fields):
                return question
    
    return None


def should_ask_optional_question(question: Question, filled_fields: Dict[str, Any]) -> bool:
    """Determine if an optional question should be asked based on context"""
    
    # Address only needed for at-home grooming
    if question.question_id == "grooming.address":
        return filled_fields.get("location_mode") == "at_home"
    
    # Concern details only needed if concern type visit
    if question.question_id == "vet.concern_details":
        return filled_fields.get("visit_type") == "concern"
    
    # By default, ask optional questions
    return True


def get_missing_required_fields(service_type: str, filled_fields: Dict[str, Any]) -> List[str]:
    """Get list of required fields that haven't been filled"""
    required = get_required_fields(service_type)
    return [f for f in required if f not in filled_fields]


def is_ticket_complete(service_type: str, filled_fields: Dict[str, Any]) -> bool:
    """Check if all required fields are filled"""
    return len(get_missing_required_fields(service_type, filled_fields)) == 0
