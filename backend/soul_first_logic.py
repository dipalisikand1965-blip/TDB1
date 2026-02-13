"""
Soul-First Response Generation Logic
=====================================
Core Doctrine: Mira must speak from Pet Soul memory first, 
and use breed only as a fallback when Soul fields are missing.

This module implements:
1. soul_context_summary builder - extracts grooming-relevant Soul fields
2. Template priority logic - determines response strategy
3. Fallback question generator - when Soul is sparse
4. Data write-back logic - saves user answers to pet profile
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
import logging
import re

logger = logging.getLogger(__name__)

# ============================================================================
# SOUL CONTEXT SUMMARY - Fields relevant for grooming-first personalization
# ============================================================================

@dataclass
class SoulContextSummary:
    """Summary of Pet Soul fields relevant for grooming/care responses."""
    pet_name: str = ""
    pet_id: str = ""
    
    # Grooming-relevant fields (primary)
    coat_type: Optional[str] = None  # short, long, matted, double-coat
    coat_length: Optional[str] = None  # short, medium, long
    grooming_history: Optional[str] = None  # last groom date, frequency
    last_groom_date: Optional[str] = None
    grooming_frequency: Optional[str] = None
    grooming_preference: Optional[str] = None  # home vs salon
    grooming_style: Optional[str] = None  # from questionnaire
    
    # Anxiety/Sensitivity fields (critical for grooming)
    grooming_anxiety_triggers: List[str] = field(default_factory=list)  # dryers, clippers, handling
    noise_sensitivity: Optional[str] = None  # loud_sounds reaction
    handling_comfort: Optional[str] = None  # how they handle being touched
    stranger_reaction: Optional[str] = None  # reaction to new people (groomers)
    
    # Health/Skin fields (safety-gating)
    skin_flags: List[str] = field(default_factory=list)  # allergies, irritation
    allergy_flags: List[str] = field(default_factory=list)
    ear_issues: Optional[str] = None
    health_conditions: Optional[str] = None
    
    # Physical characteristics (for recommendations)
    size: Optional[str] = None
    weight: Optional[str] = None
    breed: Optional[str] = None  # fallback only
    age_stage: Optional[str] = None  # puppy, adult, senior
    
    # Heat sensitivity (for brachy breeds)
    heat_sensitivity: bool = False
    is_brachycephalic: bool = False
    
    # Count of populated fields for priority logic
    populated_count: int = 0
    grooming_relevant_count: int = 0


def build_soul_context_summary(pet: Dict) -> SoulContextSummary:
    """
    Build a soul_context_summary object from Pet Soul data.
    
    This extracts all grooming-relevant fields from the pet profile,
    prioritizing specific pet data over generic breed information.
    
    Args:
        pet: Pet dictionary with soul data
        
    Returns:
        SoulContextSummary with populated fields
    """
    if not pet:
        return SoulContextSummary()
    
    # Extract from various sources in the pet object
    doggy_soul = pet.get("doggy_soul_answers", {}) or {}
    soul_data = pet.get("soul", {}) or {}  # Used for personality data
    preferences = pet.get("preferences", {}) or {}
    health = pet.get("health", {}) or {}
    identity = pet.get("identity", {}) or {}
    
    summary = SoulContextSummary(
        pet_name=pet.get("name", ""),
        pet_id=pet.get("id", "")
    )
    
    # ═══════════════════════════════════════════════════════════════════
    # GROOMING-RELEVANT FIELDS (Primary for grooming context)
    # ═══════════════════════════════════════════════════════════════════
    
    # Coat type - check multiple sources
    summary.coat_type = (
        doggy_soul.get("coat_type") or 
        pet.get("coat_type") or
        preferences.get("coat_type")
    )
    
    summary.coat_length = (
        doggy_soul.get("coat_length") or
        pet.get("coat_length")
    )
    
    # Grooming history and preferences
    summary.grooming_style = doggy_soul.get("grooming_style")
    summary.grooming_preference = (
        doggy_soul.get("grooming_preference") or
        preferences.get("grooming_preference") or
        pet.get("grooming_preference")
    )
    
    summary.last_groom_date = (
        pet.get("last_groom_date") or
        doggy_soul.get("last_groom_date") or
        preferences.get("last_groom_date")
    )
    
    summary.grooming_frequency = (
        pet.get("grooming_frequency") or
        doggy_soul.get("grooming_frequency")
    )
    
    # Build grooming history string
    history_parts = []
    if summary.last_groom_date:
        history_parts.append(f"last groomed {summary.last_groom_date}")
    if summary.grooming_frequency:
        history_parts.append(f"groomed {summary.grooming_frequency}")
    if history_parts:
        summary.grooming_history = ", ".join(history_parts)
    
    # ═══════════════════════════════════════════════════════════════════
    # ANXIETY/SENSITIVITY FIELDS (Critical for grooming sessions)
    # ═══════════════════════════════════════════════════════════════════
    
    # Grooming anxiety triggers
    anxiety_triggers = doggy_soul.get("anxiety_triggers", []) or []
    if isinstance(anxiety_triggers, str):
        anxiety_triggers = [t.strip() for t in anxiety_triggers.split(",") if t.strip()]
    
    # Filter grooming-relevant triggers
    grooming_triggers = [
        "dryers", "clippers", "nail trimming", "handling", "loud sounds",
        "being restrained", "strangers", "new places", "water", "bath"
    ]
    summary.grooming_anxiety_triggers = [
        t for t in anxiety_triggers 
        if any(gt in t.lower() for gt in grooming_triggers)
    ]
    
    # Also check separation anxiety and general anxiety
    sep_anxiety = doggy_soul.get("separation_anxiety")
    if sep_anxiety and sep_anxiety.lower() not in ["none", "no", "minimal"]:
        summary.grooming_anxiety_triggers.append("separation/alone time")
    
    # Noise sensitivity (dryer reaction)
    summary.noise_sensitivity = doggy_soul.get("loud_sounds")
    if summary.noise_sensitivity and "scared" in summary.noise_sensitivity.lower():
        if "dryers" not in str(summary.grooming_anxiety_triggers).lower():
            summary.grooming_anxiety_triggers.append("loud sounds (likely includes dryers)")
    
    # Handling comfort (critical for grooming)
    summary.handling_comfort = (
        doggy_soul.get("handling_comfort") or
        pet.get("handling_sensitivity")
    )
    
    # Stranger reaction (new groomer reaction)
    summary.stranger_reaction = doggy_soul.get("stranger_reaction")
    
    # ═══════════════════════════════════════════════════════════════════
    # HEALTH/SKIN FLAGS (Safety-gating)
    # ═══════════════════════════════════════════════════════════════════
    
    # Skin flags
    skin_issues = []
    health_conditions = doggy_soul.get("health_conditions") or pet.get("health_conditions") or ""
    if isinstance(health_conditions, list):
        health_conditions = ", ".join(health_conditions)
    
    skin_keywords = ["skin", "dermatitis", "eczema", "rash", "itchy", "hot spot", "irritation"]
    if any(kw in health_conditions.lower() for kw in skin_keywords):
        skin_issues.append(health_conditions)
    
    summary.skin_flags = skin_issues
    summary.health_conditions = health_conditions if health_conditions.lower() != "none" else None
    
    # Allergy flags
    allergies = (
        preferences.get("allergies", []) or
        health.get("allergies", []) or
        pet.get("allergies", []) or
        []
    )
    food_allergies = doggy_soul.get("food_allergies", "")
    if food_allergies and food_allergies.lower() != "none":
        if isinstance(food_allergies, str):
            allergies.extend([a.strip() for a in food_allergies.split(",") if a.strip()])
    
    # Extract allergen names if they're objects
    if allergies and isinstance(allergies, list) and len(allergies) > 0:
        if isinstance(allergies[0], dict):
            allergies = [a.get("allergen", a.get("name", "")) for a in allergies if a]
    
    summary.allergy_flags = [a for a in allergies if a and a.strip()]
    
    # Ear issues (relevant for grooming)
    summary.ear_issues = pet.get("ear_issues") or doggy_soul.get("ear_issues")
    
    # ═══════════════════════════════════════════════════════════════════
    # PHYSICAL CHARACTERISTICS
    # ═══════════════════════════════════════════════════════════════════
    
    summary.size = pet.get("size") or doggy_soul.get("size") or identity.get("size")
    summary.weight = pet.get("weight") or pet.get("weight_kg") or doggy_soul.get("weight")
    summary.breed = identity.get("breed") or pet.get("breed")
    summary.age_stage = (
        doggy_soul.get("life_stage") or 
        pet.get("life_stage") or 
        pet.get("age_stage") or
        identity.get("life_stage")
    )
    
    # Heat sensitivity (for brachycephalic breeds)
    brachy_breeds = [
        "pug", "bulldog", "french bulldog", "boston terrier", "boxer",
        "shih tzu", "pekingese", "lhasa apso", "cavalier", "chihuahua"
    ]
    breed_lower = (summary.breed or "").lower()
    summary.is_brachycephalic = any(b in breed_lower for b in brachy_breeds)
    
    # Check explicit heat sensitivity from profile
    heat_sensitive = doggy_soul.get("heat_sensitivity") or pet.get("heat_sensitivity")
    if heat_sensitive:
        summary.heat_sensitivity = True
    elif summary.is_brachycephalic:
        # Only set if explicitly confirmed OR from Soul
        # Don't assume from breed alone per Profile-First doctrine
        summary.heat_sensitivity = False  # Will be set True only if confirmed
    
    # ═══════════════════════════════════════════════════════════════════
    # COUNT POPULATED FIELDS
    # ═══════════════════════════════════════════════════════════════════
    
    # Count all populated fields
    populated = 0
    grooming_relevant = 0
    
    grooming_fields = [
        "coat_type", "coat_length", "grooming_history", "last_groom_date",
        "grooming_frequency", "grooming_preference", "grooming_style",
        "grooming_anxiety_triggers", "noise_sensitivity", "handling_comfort",
        "skin_flags", "allergy_flags", "ear_issues"
    ]
    
    for field_name in ["pet_name", "pet_id", "coat_type", "coat_length", "grooming_history",
                       "last_groom_date", "grooming_frequency", "grooming_preference",
                       "grooming_style", "noise_sensitivity", "handling_comfort",
                       "stranger_reaction", "health_conditions", "size", "weight",
                       "breed", "age_stage"]:
        val = getattr(summary, field_name, None)
        if val and str(val).strip():
            populated += 1
            if field_name in grooming_fields:
                grooming_relevant += 1
    
    # Count list fields
    if summary.grooming_anxiety_triggers:
        populated += 1
        grooming_relevant += 1
    if summary.skin_flags:
        populated += 1
        grooming_relevant += 1
    if summary.allergy_flags:
        populated += 1
        grooming_relevant += 1
    
    summary.populated_count = populated
    summary.grooming_relevant_count = grooming_relevant
    
    logger.info(f"[SOUL-FIRST] Built context for {summary.pet_name}: {populated} fields, {grooming_relevant} grooming-relevant")
    
    return summary


# ============================================================================
# RESPONSE PRIORITY LOGIC
# ============================================================================

@dataclass
class ResponseStrategy:
    """Determines how Mira should respond based on Soul data availability."""
    strategy: str = "ask_questions"  # "soul_first", "breed_fallback", "ask_questions"
    soul_lines: List[str] = field(default_factory=list)  # Lines to include from Soul
    fallback_questions: List[str] = field(default_factory=list)  # Questions to ask
    breed_context: Optional[str] = None  # Breed info if needed as fallback
    confidence: float = 1.0


def determine_response_strategy(
    soul_summary: SoulContextSummary,
    intent: str = "grooming"
) -> ResponseStrategy:
    """
    Determine response strategy based on Soul context availability.
    
    Priority Order:
    1. If soul_context_summary has >= 2 grooming-relevant fields → "soul_first"
       Generate "because {pet_name}..." lines from those fields
    2. Else if breed known → "breed_fallback"
       Add generic breed-safe guidance
    3. Else → "ask_questions"
       Stay neutral and ask 2 key questions
    
    Args:
        soul_summary: Built soul context
        intent: Current intent (grooming, care, etc.)
        
    Returns:
        ResponseStrategy with approach and content
    """
    strategy = ResponseStrategy()
    pet_name = soul_summary.pet_name or "your pet"
    
    # ═══════════════════════════════════════════════════════════════════
    # CASE 1: SOUL-FIRST (>= 2 grooming-relevant fields)
    # ═══════════════════════════════════════════════════════════════════
    
    if soul_summary.grooming_relevant_count >= 2:
        strategy.strategy = "soul_first"
        strategy.confidence = 0.9
        
        # Build personalized lines from Soul fields
        soul_lines = []
        
        # Anxiety/sensitivity lines (highest priority - safety)
        if soul_summary.grooming_anxiety_triggers:
            triggers = ", ".join(soul_summary.grooming_anxiety_triggers[:3])
            soul_lines.append(f"{pet_name}'s profile shows they get stressed with {triggers}, so I'd recommend a quiet session with breaks")
        
        if soul_summary.noise_sensitivity and "scared" in soul_summary.noise_sensitivity.lower():
            soul_lines.append(f"Since {pet_name} is sensitive to loud sounds, a low-heat or towel dry would be gentler")
        
        if soul_summary.handling_comfort:
            if "nervous" in soul_summary.handling_comfort.lower() or "uncomfortable" in soul_summary.handling_comfort.lower():
                soul_lines.append(f"{pet_name} needs extra patience with handling - a gentle, experienced groomer would be ideal")
        
        # Coat-specific lines
        if soul_summary.coat_type:
            soul_lines.append(f"For {pet_name}'s {soul_summary.coat_type} coat, I'd suggest...")
        
        # Grooming history lines
        if soul_summary.last_groom_date:
            soul_lines.append(f"Since {pet_name} was last groomed {soul_summary.last_groom_date}")
        
        if soul_summary.grooming_preference:
            pref = soul_summary.grooming_preference
            if "home" in pref.lower():
                soul_lines.append(f"{pet_name} prefers home grooming based on past sessions")
            elif "salon" in pref.lower():
                soul_lines.append(f"{pet_name} is comfortable with salon visits")
        
        # Health/skin lines
        if soul_summary.skin_flags:
            flags = ", ".join(soul_summary.skin_flags[:2])
            soul_lines.append(f"Given {pet_name}'s skin sensitivities ({flags}), we'll use gentle products")
        
        if soul_summary.allergy_flags:
            soul_lines.append(f"I'll make sure any products avoid {pet_name}'s known allergies")
        
        strategy.soul_lines = soul_lines[:4]  # Max 4 lines
        
        logger.info(f"[SOUL-FIRST] Strategy: soul_first with {len(strategy.soul_lines)} personalized lines")
    
    # ═══════════════════════════════════════════════════════════════════
    # CASE 2: BREED FALLBACK (< 2 Soul fields, but breed known)
    # ═══════════════════════════════════════════════════════════════════
    
    elif soul_summary.breed:
        strategy.strategy = "breed_fallback"
        strategy.confidence = 0.6
        
        # Generic breed-safe guidance (NOT assumptions about medical conditions)
        breed = soul_summary.breed
        strategy.breed_context = f"For {breed}s in general, regular grooming helps maintain coat health"
        
        # Still ask questions to populate Soul
        strategy.fallback_questions = get_fallback_questions(pet_name, intent, lite=True)
        
        logger.info(f"[SOUL-FIRST] Strategy: breed_fallback for {breed}")
    
    # ═══════════════════════════════════════════════════════════════════
    # CASE 3: ASK QUESTIONS (No Soul data, no breed)
    # ═══════════════════════════════════════════════════════════════════
    
    else:
        strategy.strategy = "ask_questions"
        strategy.confidence = 0.3
        
        # Full fallback questions
        strategy.fallback_questions = get_fallback_questions(pet_name, intent, lite=False)
        
        logger.info("[SOUL-FIRST] Strategy: ask_questions (no Soul data)")
    
    return strategy


# ============================================================================
# FALLBACK QUESTIONS
# ============================================================================

def get_fallback_questions(pet_name: str, intent: str = "grooming", lite: bool = False) -> List[str]:
    """
    Get fallback questions when Soul data is missing.
    
    Order (per user spec):
    1. Coat + goal
    2. Past experience
    3. Health/sensitivity gate (non-medical)
    4. Logistics
    
    Args:
        pet_name: Pet's name
        intent: Current intent
        lite: If True, return only 2 questions
        
    Returns:
        List of questions to ask
    """
    questions = []
    
    if intent == "grooming" or intent == "care":
        # 1. Coat + goal
        questions.append(
            f"What's {pet_name}'s coat like right now — short, long, matted, shedding?"
        )
        questions.append(
            "Are you looking for a full groom or just bath + tidy?"
        )
        
        if not lite:
            # 2. Past experience
            questions.append(
                f"Has {pet_name} been groomed before? Any anxiety with dryers, clipping, or being handled?"
            )
            
            # 3. Health/sensitivity gate
            questions.append(
                "Any skin irritation, ear infections, allergies, or recent discomfort I should factor in?"
            )
            
            # 4. Logistics
            questions.append(
                "Home visit or salon? Which city/area?"
            )
    
    return questions[:4] if not lite else questions[:2]


def format_fallback_response(
    pet_name: str,
    questions: List[str],
    intent: str = "grooming"
) -> str:
    """
    Format the fallback response when Soul data is missing.
    
    Pattern (per user spec):
    Line 1: Confirm request
    Line 2: Say you'll tailor it once you know a couple details
    Line 3: Ask the 2-4 questions
    
    Example:
    "Got it — grooming for Mystique. I'll tailor this to how she handles grooming 
    and what her coat needs. Quick check: is her coat long or matted right now, 
    has she been groomed before (any dryer/clipping anxiety), and do you want 
    this at home or at a salon in your area?"
    """
    if not questions:
        return ""
    
    # Combine questions into natural flow
    if len(questions) >= 3:
        q_text = f"{questions[0]}, {questions[1].lower()}, and {questions[2].lower() if len(questions) > 2 else ''}"
    elif len(questions) == 2:
        q_text = f"{questions[0]} And {questions[1].lower()}"
    else:
        q_text = questions[0]
    
    response = f"""Got it — {intent} for {pet_name}. I'll tailor this to how they handle {intent} and what they need.

Quick check: {q_text}"""
    
    return response


# ============================================================================
# DATA WRITE-BACK LOGIC
# ============================================================================

@dataclass
class ExtractedSoulData:
    """Data extracted from user's answer to write back to Soul."""
    # Grooming-related
    coat_type: Optional[str] = None
    coat_length: Optional[str] = None
    grooming_preference: Optional[str] = None  # home/salon
    grooming_anxiety_triggers: List[str] = field(default_factory=list)
    skin_flags: List[str] = field(default_factory=list)
    last_groom_date: Optional[str] = None
    
    # Allergy & Diet (NEW - expanded coverage)
    allergy_flags: List[str] = field(default_factory=list)
    food_allergies: List[str] = field(default_factory=list)
    dietary_preferences: Optional[str] = None  # wet/dry/raw/home-cooked
    favorite_treats: List[str] = field(default_factory=list)
    food_sensitivities: List[str] = field(default_factory=list)
    
    # Health & Medical (NEW)
    health_conditions: List[str] = field(default_factory=list)
    vaccination_status: Optional[str] = None
    last_vet_visit: Optional[str] = None
    medications: List[str] = field(default_factory=list)
    
    # Behavior & Personality (NEW)
    energy_level: Optional[str] = None  # low/medium/high
    temperament: Optional[str] = None  # calm/playful/anxious
    behavior_with_dogs: Optional[str] = None  # friendly/reactive/fearful
    behavior_with_people: Optional[str] = None
    
    # Location & Logistics
    city: Optional[str] = None
    
    # Flag indicating what type of data was extracted
    data_categories: List[str] = field(default_factory=list)


def extract_soul_data_from_response(
    user_message: str,
    pet_name: str
) -> ExtractedSoulData:
    """
    Extract Soul data from user's response to ANY question Mira asks.
    
    This is the UNIVERSAL extraction function - it captures:
    - Allergies & food sensitivities
    - Dietary preferences
    - Health conditions & medications
    - Behavioral traits
    - Grooming preferences
    - And more...
    
    The "Ask, Store, Recommend" doctrine means EVERY answer should be captured.
    
    Args:
        user_message: User's response
        pet_name: Pet's name for context
        
    Returns:
        ExtractedSoulData with parsed fields
    """
    extracted = ExtractedSoulData()
    message_lower = user_message.lower()
    
    # ═══════════════════════════════════════════════════════════════════
    # ALLERGY & FOOD SENSITIVITY EXTRACTION (HIGHEST PRIORITY - SAFETY)
    # ═══════════════════════════════════════════════════════════════════
    
    # Common food allergens for pets
    common_allergens = [
        "chicken", "beef", "lamb", "pork", "fish", "salmon", "duck", "turkey",
        "wheat", "corn", "soy", "dairy", "eggs", "gluten", "grain",
        "rice", "potato", "sweet potato", "peanut", "peanut butter"
    ]
    
    # Patterns indicating allergies
    allergy_patterns = [
        r"allergic\s+to\s+(.+?)(?:\s*[,.]|\s+and\s+|$)",
        r"allergy\s+to\s+(.+?)(?:\s*[,.]|\s+and\s+|$)",
        r"can'?t\s+(?:eat|have|tolerate)\s+(.+?)(?:\s*[,.]|\s+and\s+|$)",
        r"sensitive\s+to\s+(.+?)(?:\s*[,.]|\s+and\s+|$)",
        r"(?:avoid|avoiding)\s+(.+?)(?:\s*[,.]|\s+and\s+|$)",
        r"no\s+(.+?)\s+(?:please|for\s+him|for\s+her)",
    ]
    
    for pattern in allergy_patterns:
        matches = re.findall(pattern, message_lower)
        for match in matches:
            # Clean up the allergen
            allergen = match.strip().rstrip('.,!?')
            if allergen and len(allergen) < 50:  # Sanity check
                extracted.food_allergies.append(allergen)
                extracted.allergy_flags.append(allergen)
                extracted.data_categories.append("allergy")
    
    # Direct mention of allergens
    for allergen in common_allergens:
        if allergen in message_lower:
            # Check if it's in a negative context
            negative_context = [
                f"no {allergen}", f"not {allergen}", f"allergic to {allergen}",
                f"can't have {allergen}", f"avoid {allergen}", f"sensitive to {allergen}",
                f"without {allergen}", f"{allergen} allergy", f"{allergen} free"
            ]
            if any(ctx in message_lower for ctx in negative_context):
                if allergen not in extracted.food_allergies:
                    extracted.food_allergies.append(allergen)
                    extracted.data_categories.append("allergy")
    
    # Check for "no allergies" - important to know they're allergy-free
    if any(p in message_lower for p in ["no allergies", "no known allergies", "not allergic", "no food allergies"]):
        extracted.food_allergies = ["none_confirmed"]
        extracted.data_categories.append("allergy_clear")
    
    # ═══════════════════════════════════════════════════════════════════
    # DIETARY PREFERENCE EXTRACTION
    # ═══════════════════════════════════════════════════════════════════
    
    diet_patterns = {
        "dry_food": ["kibble", "dry food", "dry kibble", "crunchy food"],
        "wet_food": ["wet food", "canned food", "canned", "pate", "gravy"],
        "raw": ["raw diet", "raw food", "barf diet", "raw meat", "raw feeding"],
        "home_cooked": ["home cooked", "homemade", "cook for", "fresh food", "fresh diet"],
        "mixed": ["mix of", "combination", "both wet and dry", "variety"]
    }
    
    for diet_type, patterns in diet_patterns.items():
        if any(p in message_lower for p in patterns):
            extracted.dietary_preferences = diet_type
            extracted.data_categories.append("diet")
            break
    
    # Favorite treats extraction
    treat_patterns = [
        r"loves?\s+(.+?)\s+treats",
        r"favorite\s+treat\s+is\s+(.+?)(?:\s*[,.]|$)",
        r"goes\s+crazy\s+for\s+(.+?)(?:\s*[,.]|$)",
        r"can'?t\s+resist\s+(.+?)(?:\s*[,.]|$)",
    ]
    
    for pattern in treat_patterns:
        matches = re.findall(pattern, message_lower)
        for match in matches:
            treat = match.strip().rstrip('.,!?')
            if treat and len(treat) < 30:
                extracted.favorite_treats.append(treat)
                extracted.data_categories.append("diet")
    
    # ═══════════════════════════════════════════════════════════════════
    # HEALTH CONDITIONS EXTRACTION
    # ═══════════════════════════════════════════════════════════════════
    
    health_conditions_list = [
        "arthritis", "diabetes", "heart condition", "hip dysplasia", "seizures",
        "epilepsy", "cancer", "kidney disease", "liver disease", "thyroid",
        "cushings", "addisons", "pancreatitis", "ibd", "colitis",
        "eye problems", "ear infections", "dental issues", "obesity", "overweight"
    ]
    
    for condition in health_conditions_list:
        if condition in message_lower:
            extracted.health_conditions.append(condition)
            extracted.data_categories.append("health")
    
    # General health mentions
    health_patterns = [
        r"has\s+(.+?)\s+(?:condition|disease|problem|issue)",
        r"diagnosed\s+with\s+(.+?)(?:\s*[,.]|$)",
        r"suffers\s+from\s+(.+?)(?:\s*[,.]|$)",
    ]
    
    for pattern in health_patterns:
        matches = re.findall(pattern, message_lower)
        for match in matches:
            condition = match.strip().rstrip('.,!?')
            if condition and len(condition) < 50:
                extracted.health_conditions.append(condition)
                extracted.data_categories.append("health")
    
    # Vaccination status
    if any(p in message_lower for p in ["fully vaccinated", "all vaccines", "up to date on shots", "vaccinations current"]):
        extracted.vaccination_status = "up_to_date"
        extracted.data_categories.append("health")
    elif any(p in message_lower for p in ["due for vaccines", "need vaccines", "overdue", "not vaccinated"]):
        extracted.vaccination_status = "needs_update"
        extracted.data_categories.append("health")
    
    # ═══════════════════════════════════════════════════════════════════
    # BEHAVIOR & PERSONALITY EXTRACTION
    # ═══════════════════════════════════════════════════════════════════
    
    # Energy level
    if any(p in message_lower for p in ["high energy", "very active", "hyperactive", "never stops", "always running"]):
        extracted.energy_level = "high"
        extracted.data_categories.append("behavior")
    elif any(p in message_lower for p in ["low energy", "lazy", "couch potato", "sleeps a lot", "calm"]):
        extracted.energy_level = "low"
        extracted.data_categories.append("behavior")
    elif any(p in message_lower for p in ["moderate energy", "balanced", "normal energy"]):
        extracted.energy_level = "medium"
        extracted.data_categories.append("behavior")
    
    # Temperament
    if any(p in message_lower for p in ["anxious", "nervous", "fearful", "scared easily", "timid"]):
        extracted.temperament = "anxious"
        extracted.data_categories.append("behavior")
    elif any(p in message_lower for p in ["calm", "relaxed", "chill", "laid back", "easygoing"]):
        extracted.temperament = "calm"
        extracted.data_categories.append("behavior")
    elif any(p in message_lower for p in ["playful", "energetic", "bouncy", "loves to play", "playful spirit"]):
        extracted.temperament = "playful"
        extracted.data_categories.append("behavior")
    
    # Behavior with other dogs
    if any(p in message_lower for p in ["friendly with dogs", "loves dogs", "good with dogs", "plays well with dogs"]):
        extracted.behavior_with_dogs = "friendly"
        extracted.data_categories.append("behavior")
    elif any(p in message_lower for p in ["reactive", "barks at dogs", "lunges at dogs", "not good with dogs"]):
        extracted.behavior_with_dogs = "reactive"
        extracted.data_categories.append("behavior")
    elif any(p in message_lower for p in ["scared of dogs", "fearful of dogs", "avoids dogs"]):
        extracted.behavior_with_dogs = "fearful"
        extracted.data_categories.append("behavior")
    
    # ═══════════════════════════════════════════════════════════════════
    # COAT TYPE EXTRACTION (Original grooming logic)
    # ═══════════════════════════════════════════════════════════════════
    
    coat_patterns = {
        "long": ["long coat", "long hair", "long fur", "fluffy", "long-haired"],
        "short": ["short coat", "short hair", "short fur", "smooth coat", "short-haired"],
        "medium": ["medium coat", "medium length", "medium fur"],
        "matted": ["matted", "tangled", "knotted", "needs detangling"],
        "double": ["double coat", "thick undercoat", "heavy shedding"],
        "curly": ["curly", "wavy", "poodle-like"],
        "wiry": ["wiry", "rough coat", "wire-haired"]
    }
    
    for coat_type, patterns in coat_patterns.items():
        if any(p in message_lower for p in patterns):
            extracted.coat_type = coat_type
            extracted.data_categories.append("grooming")
            break
    
    # Simple coat mention
    simple_coat = re.search(r'\b(short|long|medium|matted|curly|wiry)\b', message_lower)
    if simple_coat and not extracted.coat_type:
        extracted.coat_type = simple_coat.group(1)
        extracted.data_categories.append("grooming")
    
    # ═══════════════════════════════════════════════════════════════════
    # GROOMING PREFERENCE EXTRACTION (home vs salon)
    # ═══════════════════════════════════════════════════════════════════
    
    home_patterns = ["at home", "home visit", "home grooming", "prefer home", "at my place"]
    salon_patterns = ["salon", "groomer", "shop", "professional", "take him", "take her", "bring"]
    
    if any(p in message_lower for p in home_patterns):
        extracted.grooming_preference = "home"
        extracted.data_categories.append("grooming")
    elif any(p in message_lower for p in salon_patterns):
        extracted.grooming_preference = "salon"
        extracted.data_categories.append("grooming")
    
    # ═══════════════════════════════════════════════════════════════════
    # ANXIETY TRIGGERS EXTRACTION
    # ═══════════════════════════════════════════════════════════════════
    
    anxiety_patterns = {
        "dryers": ["scared of dryer", "hates dryer", "hates the dryer", "dryer anxiety", "doesn't like dryer", 
                   "afraid of dryer", "dryer scared", "no dryer", "skip the dryer", "avoid dryer", "dryer frightens"],
        "clippers": ["scared of clippers", "hates clipping", "hates clippers", "clipper anxiety", 
                     "nervous with clippers", "afraid of clippers", "no clippers"],
        "handling": ["doesn't like being held", "hates being touched", "handling issues", "nervous when handled",
                     "sensitive to touch", "doesn't like touch"],
        "strangers": ["nervous around strangers", "scared of new people", "doesn't like strangers", 
                      "wary of strangers", "cautious with new"],
        "loud sounds": ["scared of loud", "noise anxiety", "loud sounds", "noise sensitive", 
                        "sensitive to noise", "hates loud"],
        "water": ["hates water", "scared of water", "doesn't like baths", "bath anxiety", 
                  "afraid of water", "hates baths"],
        "vet": ["scared of vet", "vet anxiety", "hates the vet", "nervous at vet"],
        "car": ["car sick", "hates car rides", "motion sickness", "scared in car"]
    }
    
    for trigger, patterns in anxiety_patterns.items():
        if any(p in message_lower for p in patterns):
            extracted.grooming_anxiety_triggers.append(trigger)
            extracted.data_categories.append("anxiety")
    
    # Check for "no anxiety" - important to know they're comfortable
    clear_patterns = ["no anxiety", "no issues", "fine with everything", "comfortable with everything", "no problems"]
    should_clear = any(p in message_lower for p in clear_patterns)
    
    if should_clear and " but " not in message_lower:
        extracted.grooming_anxiety_triggers = []
    
    # ═══════════════════════════════════════════════════════════════════
    # SKIN FLAGS EXTRACTION
    # ═══════════════════════════════════════════════════════════════════
    
    skin_patterns = ["skin irritation", "skin issue", "rash", "itchy", "scratching", "hot spots", "dermatitis", "eczema", "dry skin", "flaky skin"]
    for pattern in skin_patterns:
        if pattern in message_lower:
            extracted.skin_flags.append(pattern)
            extracted.data_categories.append("skin")
    
    # ═══════════════════════════════════════════════════════════════════
    # GROOMING HISTORY EXTRACTION
    # ═══════════════════════════════════════════════════════════════════
    
    if any(p in message_lower for p in ["never groomed", "first time", "never been groomed", "first groom"]):
        extracted.last_groom_date = "never"
        extracted.data_categories.append("grooming")
    
    time_patterns = [
        (r'(\d+)\s*(?:weeks?|wks?)\s*ago', 'weeks'),
        (r'(\d+)\s*(?:months?|mos?)\s*ago', 'months'),
        (r'last\s+(?:week|month)', 'recent'),
        (r'a\s+(?:few|couple)\s+(?:weeks?|months?)\s+ago', 'recent')
    ]
    
    for pattern, unit in time_patterns:
        match = re.search(pattern, message_lower)
        if match:
            if unit == 'recent':
                extracted.last_groom_date = "recently"
            else:
                extracted.last_groom_date = f"{match.group(1)} {unit} ago"
            extracted.data_categories.append("grooming")
            break
    
    # ═══════════════════════════════════════════════════════════════════
    # CITY EXTRACTION
    # ═══════════════════════════════════════════════════════════════════
    
    indian_cities = [
        "mumbai", "delhi", "bangalore", "bengaluru", "pune", "hyderabad",
        "chennai", "kolkata", "gurgaon", "noida", "goa", "jaipur",
        "ahmedabad", "lucknow", "chandigarh", "kochi", "indore", "bhopal"
    ]
    
    for city in indian_cities:
        if city in message_lower:
            extracted.city = city.title()
            extracted.data_categories.append("location")
            break
    
    # Deduplicate categories
    extracted.data_categories = list(set(extracted.data_categories))
    
    logger.info(f"[SOUL-FIRST] Extracted data categories: {extracted.data_categories}")
    logger.info(f"[SOUL-FIRST] Allergies: {extracted.food_allergies}, Health: {extracted.health_conditions}, Behavior: {extracted.temperament}/{extracted.energy_level}")
    
    return extracted


async def write_soul_data_to_pet(
    db,
    pet_id: str,
    extracted: ExtractedSoulData
) -> bool:
    """
    Write extracted Soul data back to the pet's profile.
    
    This implements the "Ask, Store, Recommend" pattern:
    After user answers fallback questions, save to Soul.
    
    Args:
        db: Database connection
        pet_id: Pet ID to update
        extracted: Extracted data to write
        
    Returns:
        True if update successful
    """
    if not pet_id or not extracted:
        return False
    
    # Build update document
    update_fields = {}
    doggy_soul_updates = {}
    
    if extracted.coat_type:
        doggy_soul_updates["coat_type"] = extracted.coat_type
    
    if extracted.coat_length:
        doggy_soul_updates["coat_length"] = extracted.coat_length
    
    if extracted.grooming_preference:
        doggy_soul_updates["grooming_preference"] = extracted.grooming_preference
        update_fields["grooming_preference"] = extracted.grooming_preference
    
    if extracted.grooming_anxiety_triggers:
        # Merge with existing triggers
        doggy_soul_updates["grooming_anxiety_triggers"] = extracted.grooming_anxiety_triggers
    
    if extracted.skin_flags:
        doggy_soul_updates["skin_flags"] = extracted.skin_flags
    
    if extracted.allergy_flags:
        # Merge with existing allergies
        doggy_soul_updates["food_allergies"] = ", ".join(extracted.allergy_flags)
    
    if extracted.last_groom_date:
        doggy_soul_updates["last_groom_date"] = extracted.last_groom_date
        update_fields["last_groom_date"] = extracted.last_groom_date
    
    if extracted.city:
        update_fields["city"] = extracted.city
    
    if not update_fields and not doggy_soul_updates:
        return False
    
    try:
        # Update pet document
        update_doc = {"$set": {}}
        
        if update_fields:
            for k, v in update_fields.items():
                update_doc["$set"][k] = v
        
        if doggy_soul_updates:
            for k, v in doggy_soul_updates.items():
                update_doc["$set"][f"doggy_soul_answers.{k}"] = v
        
        update_doc["$set"]["updated_at"] = datetime.now(timezone.utc).isoformat()
        update_doc["$set"]["soul_updated_by"] = "mira_fallback_questions"
        
        result = await db.pets.update_one(
            {"id": pet_id},
            update_doc
        )
        
        if result.modified_count > 0:
            logger.info(f"[SOUL-FIRST] Updated Soul for pet {pet_id}: {list(update_doc['$set'].keys())}")
            return True
        else:
            logger.warning(f"[SOUL-FIRST] No update made for pet {pet_id}")
            return False
    
    except Exception as e:
        logger.error(f"[SOUL-FIRST] Error writing Soul data: {e}")
        return False


# ============================================================================
# MAIN SOUL-FIRST PROMPT BUILDER
# ============================================================================

def build_soul_first_prompt_section(
    soul_summary: SoulContextSummary,
    strategy: ResponseStrategy,
    intent: str = "grooming"
) -> str:
    """
    Build the Soul-First prompt section to inject into LLM context.
    
    This creates explicit instructions for the LLM to prioritize
    Soul data over breed assumptions.
    
    Args:
        soul_summary: Built soul context
        strategy: Determined response strategy
        intent: Current intent
        
    Returns:
        Prompt section string
    """
    pet_name = soul_summary.pet_name or "the pet"
    
    prompt = f"""
═══════════════════════════════════════════════════════════════════════════════
🧬 SOUL-FIRST RESPONSE GENERATION (NON-NEGOTIABLE)
═══════════════════════════════════════════════════════════════════════════════

Core Rule: Mira must speak from Pet Soul memory FIRST, and use breed only as 
a fallback when Soul fields are missing.

CURRENT SOUL CONTEXT FOR {pet_name.upper()}:
"""
    
    # Add Soul summary
    if soul_summary.grooming_relevant_count >= 2:
        prompt += f"""
✅ SOUL DATA AVAILABLE ({soul_summary.grooming_relevant_count} grooming-relevant fields)
Use these SPECIFIC facts about {pet_name}:
"""
        if soul_summary.coat_type:
            prompt += f"- Coat type: {soul_summary.coat_type}\n"
        if soul_summary.grooming_anxiety_triggers:
            prompt += f"- Grooming anxiety triggers: {', '.join(soul_summary.grooming_anxiety_triggers)}\n"
        if soul_summary.noise_sensitivity:
            prompt += f"- Noise sensitivity: {soul_summary.noise_sensitivity}\n"
        if soul_summary.handling_comfort:
            prompt += f"- Handling comfort: {soul_summary.handling_comfort}\n"
        if soul_summary.grooming_preference:
            prompt += f"- Grooming preference: {soul_summary.grooming_preference}\n"
        if soul_summary.last_groom_date:
            prompt += f"- Last groomed: {soul_summary.last_groom_date}\n"
        if soul_summary.skin_flags:
            prompt += f"- Skin issues: {', '.join(soul_summary.skin_flags)}\n"
        if soul_summary.allergy_flags:
            prompt += f"- Allergies: {', '.join(soul_summary.allergy_flags)}\n"
        
        prompt += f"""
RESPONSE STRATEGY: SOUL-FIRST
Generate "because {pet_name}..." lines from these Soul fields.
Example: "{pet_name}'s profile shows they get stressed with dryers and loud noise, 
so I'd recommend a quiet session with breaks and a low-heat dry."
"""
    
    elif soul_summary.breed:
        prompt += f"""
⚠️ LIMITED SOUL DATA (only {soul_summary.grooming_relevant_count} grooming-relevant fields)
Breed known: {soul_summary.breed}

RESPONSE STRATEGY: BREED-FALLBACK + ASK QUESTIONS
- Use generic breed-safe guidance (NOT medical assumptions)
- Ask 2-4 questions to populate Soul
- Do NOT claim breed-specific sensitivities unless confirmed in Soul
"""
    
    else:
        prompt += """
❌ NO SOUL DATA AVAILABLE

RESPONSE STRATEGY: ASK QUESTIONS FIRST
- Stay neutral and safe
- Do not make assumptions
- Ask minimum viable questions to populate Soul, then proceed
"""
    
    # Add fallback questions if needed
    if strategy.fallback_questions:
        prompt += """
FALLBACK QUESTIONS TO ASK (in this order):
"""
        for i, q in enumerate(strategy.fallback_questions, 1):
            prompt += f"{i}. {q}\n"
        
        prompt += f"""
FORMAT FOR MISSING DATA RESPONSE:
Line 1: Confirm request
Line 2: Say you'll tailor it once you know a couple details  
Line 3: Ask the 2-4 questions above

Example:
"Got it — grooming for {pet_name}. I'll tailor this to how they handle grooming 
and what their coat needs. Quick check: is their coat long or matted right now, 
have they been groomed before (any dryer/clipping anxiety), and do you want 
this at home or at a salon in your area?"
"""
    
    # Critical rules
    prompt += f"""
═══════════════════════════════════════════════════════════════════════════════
❌ FORBIDDEN (Never do these):
- Do NOT introduce breed-specific claims (like brachy sensitivity) unless:
  (a) the breed is known AND confirmed, OR
  (b) the Soul profile explicitly flags brachy/heat sensitivity
- Do NOT infer medical/breed sensitivities from breed or vibes
- Do NOT ask "professional groomer or at home?" generically
  Instead ask: "Does {pet_name} prefer home grooming or salon visits based on past sessions?"
  If unknown: "Has they ever been groomed at a salon before, or is this their first time?"

✅ REQUIRED:
- Reference {pet_name} by name in recommendations
- Use Soul data to personalize every suggestion
- Keep guidance neutral + safe until confirmed
═══════════════════════════════════════════════════════════════════════════════
"""
    
    return prompt


# ============================================================================
# CONVENIENCE FUNCTION FOR INTEGRATION
# ============================================================================

def process_soul_first_context(pet: Dict, intent: str = "grooming") -> Tuple[SoulContextSummary, ResponseStrategy, str]:
    """
    Main entry point for Soul-First logic.
    
    Call this before generating LLM response to get:
    1. Soul context summary
    2. Response strategy
    3. Prompt section to inject
    
    Args:
        pet: Pet dictionary with soul data
        intent: Current intent (grooming, care, etc.)
        
    Returns:
        Tuple of (SoulContextSummary, ResponseStrategy, prompt_section)
    """
    soul_summary = build_soul_context_summary(pet)
    strategy = determine_response_strategy(soul_summary, intent)
    prompt_section = build_soul_first_prompt_section(soul_summary, strategy, intent)
    
    return soul_summary, strategy, prompt_section
