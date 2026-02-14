#!/usr/bin/env python3
"""
MIRA OS Scoring Logic - Phase B4
Ranks picks from picks_catalogue based on classification output and pet profile.

Key Features:
1. Base score from pick definition
2. Profile-based boosts (personalization)
3. Profile-based penalties (constraint violations)
4. Cross-pillar boost rules (e.g., Travel -> Paperwork)
5. Safety gate integration (emergency/caution override)
6. Degrade-safe reason template selection
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)

# ============== CONSTANTS ==============

# Pillars that trigger cross-pillar boosts
TRAVEL_TAGS = {"air_travel", "international_travel", "car_travel", "train_travel", "airport_transfer", "pet_taxi"}
PAPERWORK_PILLAR = "paperwork"

# Cross-pillar boost weights
TRAVEL_TO_PAPERWORK_BOOST = 15  # Boost paperwork picks when travel intent detected

# Profile match boosts
BREED_MATCH_BOOST = 10
CITY_MATCH_BOOST = 8
AGE_STAGE_MATCH_BOOST = 5
ALLERGY_AWARE_BOOST = 12
HEALTH_FLAG_AWARE_BOOST = 10

# Constraint violation penalties
SPECIES_MISMATCH_PENALTY = -100  # Hard filter
AGE_STAGE_MISMATCH_PENALTY = -50
HEALTH_FLAG_VIOLATION_PENALTY = -100  # Hard filter
MISSING_REQUIRED_FIELD_PENALTY = -20

# Brachycephalic breeds for air travel warnings
BRACHYCEPHALIC_BREEDS = {
    "pug", "french bulldog", "english bulldog", "boston terrier", "boxer",
    "shih tzu", "cavalier king charles spaniel", "pekingese", "bullmastiff",
    "dogue de bordeaux", "affenpinscher", "brussels griffon", "japanese chin",
    "persian", "himalayan", "british shorthair", "exotic shorthair", "scottish fold"
}


@dataclass
class ClassificationResult:
    """Output from classification pipeline."""
    primary_pillar: str
    secondary_pillars: List[str] = field(default_factory=list)
    canonical_tags: List[str] = field(default_factory=list)
    intent: Optional[str] = None  # "buy", "book", "learn", "ask"
    confidence: float = 0.0
    safety_level: str = "normal"  # "normal", "caution", "emergency"
    temporal_triggers: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PetProfile:
    """Pet profile data for personalization."""
    pet_name: str = ""
    species: str = "dog"
    breed: str = ""
    age_stage: str = "adult"  # "puppy", "adult", "senior"
    city: str = ""
    allergies: List[str] = field(default_factory=list)
    health_flags: List[str] = field(default_factory=list)
    weight: Optional[float] = None
    coat_type: Optional[str] = None
    energy_level: Optional[str] = None
    dob: Optional[str] = None
    travel_date: Optional[str] = None


@dataclass
class ScoredPick:
    """A pick with its computed score and metadata."""
    pick_id: str
    pillar: str
    pick_type: str
    title: str
    cta: str
    reason: str  # Final rendered reason (template or enhanced)
    final_score: float
    base_score: float
    boosts: Dict[str, float] = field(default_factory=dict)
    penalties: Dict[str, float] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    concierge_complexity: str = "low"
    safety_level: str = "normal"
    service_vertical: Optional[str] = None
    service_modes: List[str] = field(default_factory=list)
    doc_requirements: List[str] = field(default_factory=list)
    booking_fields: Dict[str, List[str]] = field(default_factory=dict)
    # New fields for enhanced pick cards
    what_we_arrange: Optional[str] = None
    what_we_need: List[str] = field(default_factory=list)
    includes: List[str] = field(default_factory=list)


def is_brachycephalic(breed: str) -> bool:
    """Check if breed is brachycephalic (flat-faced)."""
    return breed.lower() in BRACHYCEPHALIC_BREEDS


def get_travel_warning(warning_type: str, pet_profile: PetProfile) -> Optional[str]:
    """Get warning message based on warning_type and profile."""
    pet_name = pet_profile.pet_name or "your pet"
    breed = pet_profile.breed or "this breed"
    
    warnings_catalogue = {
        "air_travel_brachy": (
            f"Important: {pet_name} is a {breed}, which is brachycephalic (flat-faced). "
            "Many airlines restrict or ban these breeds due to health risks during air travel. "
            "Consult your vet before booking."
        ),
    }
    return warnings_catalogue.get(warning_type)


def render_reason_template(
    pick: Dict[str, Any],
    pet_profile: PetProfile,
    use_enhanced: bool = False
) -> str:
    """
    Render reason template with pet profile data.
    Uses degrade-safe pattern: try enhanced first, fall back to basic.
    """
    template_key = "reason_template_enhanced" if use_enhanced else "reason_template"
    template = pick.get(template_key, pick.get("reason_template", ""))
    
    # Build substitution dict
    subs = {
        "pet_name": pet_profile.pet_name or "your pet",
        "breed": pet_profile.breed or "your pet",
        "species": pet_profile.species or "pet",
        "age_stage": pet_profile.age_stage or "adult",
        "city": pet_profile.city or "your city",
        "coat_type": pet_profile.coat_type or "their",
        "weight": str(pet_profile.weight) if pet_profile.weight else "unknown",
        "energy_level": pet_profile.energy_level or "moderate",
        "dob": pet_profile.dob or "their birthday",
        "age": pet_profile.age_stage or "their age",
        "allergies": ", ".join(pet_profile.allergies) if pet_profile.allergies else "none known",
    }
    
    # Safe substitution
    result = template
    for key, value in subs.items():
        result = result.replace("{" + key + "}", str(value))
    
    return result


def can_use_enhanced_reason(pick: Dict[str, Any], pet_profile: PetProfile) -> bool:
    """
    Check if we have enough profile data to use enhanced reason template.
    Follows the 'enhanced_reason_requires' pattern.
    """
    constraints = pick.get("constraints", {})
    required_fields = constraints.get("enhanced_reason_requires", [])
    
    if not required_fields:
        return False
    
    profile_dict = {
        "breed": pet_profile.breed,
        "city": pet_profile.city,
        "weight": pet_profile.weight,
        "coat_type": pet_profile.coat_type,
        "allergies": pet_profile.allergies,
        "dob": pet_profile.dob,
    }
    
    for field in required_fields:
        value = profile_dict.get(field)
        if not value or (isinstance(value, list) and len(value) == 0):
            return False
    
    return True


def check_species_constraint(pick: Dict[str, Any], pet_profile: PetProfile) -> float:
    """Check species constraint. Returns penalty if violated."""
    constraints = pick.get("constraints", {})
    allowed_species = constraints.get("species", ["dog", "cat"])
    
    if pet_profile.species.lower() not in [s.lower() for s in allowed_species]:
        return SPECIES_MISMATCH_PENALTY
    return 0


def check_age_stage_constraint(pick: Dict[str, Any], pet_profile: PetProfile) -> float:
    """Check age stage constraint. Returns penalty if violated."""
    constraints = pick.get("constraints", {})
    allowed_stages = constraints.get("age_stage") or constraints.get("age_stages")
    
    if allowed_stages is None:
        return 0  # No constraint
    
    if pet_profile.age_stage.lower() not in [s.lower() for s in allowed_stages]:
        return AGE_STAGE_MISMATCH_PENALTY
    return 0


def check_health_flag_constraint(pick: Dict[str, Any], pet_profile: PetProfile) -> float:
    """Check if any health flags should exclude this pick."""
    constraints = pick.get("constraints", {})
    exclude_flags = constraints.get("exclude_health_flags", [])
    
    if not exclude_flags:
        return 0
    
    for flag in pet_profile.health_flags:
        if flag.lower() in [f.lower() for f in exclude_flags]:
            return HEALTH_FLAG_VIOLATION_PENALTY
    
    # Special handling for allergies exclusion
    if "allergies" in exclude_flags and pet_profile.allergies:
        return HEALTH_FLAG_VIOLATION_PENALTY
    
    return 0


def calculate_profile_boosts(pick: Dict[str, Any], pet_profile: PetProfile) -> Dict[str, float]:
    """Calculate boosts based on profile match."""
    boosts = {}
    
    # Breed match boost - if pick has breed-specific content
    if pet_profile.breed and "breed" in pick.get("reason_template", ""):
        boosts["breed_match"] = BREED_MATCH_BOOST
    
    # City match boost - if pick is location-aware
    if pet_profile.city and "city" in pick.get("reason_template", ""):
        boosts["city_match"] = CITY_MATCH_BOOST
    
    # Age stage match boost
    constraints = pick.get("constraints", {})
    allowed_stages = constraints.get("age_stage") or constraints.get("age_stages")
    if allowed_stages and pet_profile.age_stage.lower() in [s.lower() for s in allowed_stages]:
        boosts["age_stage_match"] = AGE_STAGE_MATCH_BOOST
    
    # Allergy awareness boost
    if pet_profile.allergies and "allergy" in pick.get("pick_id", "").lower():
        boosts["allergy_aware"] = ALLERGY_AWARE_BOOST
    
    return boosts


def apply_cross_pillar_boosts(
    pick: Dict[str, Any],
    classification: ClassificationResult
) -> Dict[str, float]:
    """
    Apply cross-pillar boost rules.
    Key rule: Travel intent -> boost Paperwork picks
    """
    boosts = {}
    
    # Travel -> Paperwork boost rule
    # If classification detected travel-related tags, boost paperwork picks
    is_travel_intent = (
        classification.primary_pillar == "travel" or
        bool(set(classification.canonical_tags) & TRAVEL_TAGS)
    )
    
    if is_travel_intent and pick.get("pillar") == PAPERWORK_PILLAR:
        boosts["travel_paperwork_link"] = TRAVEL_TO_PAPERWORK_BOOST
        logger.debug(f"Applied Travel->Paperwork boost to {pick.get('pick_id')}")
    
    # Doc requirements linkage
    # If the classified pick has doc_requirements, boost matching paperwork picks
    doc_reqs = pick.get("doc_requirements", [])
    if doc_reqs:
        # These picks should naturally surface related paperwork
        # The boost is implicit through the doc_requirements field
        pass
    
    return boosts


def generate_warnings(pick: Dict[str, Any], pet_profile: PetProfile) -> List[str]:
    """Generate contextual warnings based on pick and profile."""
    warnings = []
    constraints = pick.get("constraints", {})
    
    # Brachycephalic warning for air travel
    if constraints.get("if_brachycephalic") == "show_warning":
        if pet_profile.breed and is_brachycephalic(pet_profile.breed):
            warning_type = pick.get("warning_type", "air_travel_brachy")
            warning_msg = get_travel_warning(warning_type, pet_profile)
            if warning_msg:
                warnings.append(warning_msg)
    
    return warnings


def score_pick(
    pick: Dict[str, Any],
    classification: ClassificationResult,
    pet_profile: PetProfile
) -> ScoredPick:
    """
    Score a single pick based on classification and profile.
    Returns a ScoredPick with all scoring details.
    """
    pick_id = pick.get("pick_id", "unknown")
    base_score = pick.get("base_score", 50)
    
    # Initialize score components
    boosts = {}
    penalties = {}
    
    # Check hard constraints (species, health flags)
    species_penalty = check_species_constraint(pick, pet_profile)
    if species_penalty < 0:
        penalties["species_mismatch"] = species_penalty
    
    age_penalty = check_age_stage_constraint(pick, pet_profile)
    if age_penalty < 0:
        penalties["age_stage_mismatch"] = age_penalty
    
    health_penalty = check_health_flag_constraint(pick, pet_profile)
    if health_penalty < 0:
        penalties["health_flag_violation"] = health_penalty
    
    # Calculate profile boosts
    profile_boosts = calculate_profile_boosts(pick, pet_profile)
    boosts.update(profile_boosts)
    
    # Apply cross-pillar boosts
    cross_pillar_boosts = apply_cross_pillar_boosts(pick, classification)
    boosts.update(cross_pillar_boosts)
    
    # Pillar match boost
    if pick.get("pillar") == classification.primary_pillar:
        boosts["primary_pillar_match"] = 20
    elif pick.get("pillar") in classification.secondary_pillars:
        boosts["secondary_pillar_match"] = 10
    
    # Tag match boost
    pick_tags = set(pick.get("canonical_tags", []))
    classification_tags = set(classification.canonical_tags)
    tag_overlap = pick_tags & classification_tags
    if tag_overlap:
        boosts["tag_match"] = len(tag_overlap) * 5
    
    # Calculate final score
    total_boosts = sum(boosts.values())
    total_penalties = sum(penalties.values())
    final_score = base_score + total_boosts + total_penalties
    
    # Determine which reason template to use
    use_enhanced = can_use_enhanced_reason(pick, pet_profile)
    reason = render_reason_template(pick, pet_profile, use_enhanced)
    
    # Generate warnings
    warnings = generate_warnings(pick, pet_profile)
    
    # Extract booking fields if present
    constraints = pick.get("constraints", {})
    booking_fields = {}
    if constraints.get("required_booking_fields"):
        booking_fields["required"] = constraints["required_booking_fields"]
    if constraints.get("optional_booking_fields"):
        booking_fields["optional"] = constraints["optional_booking_fields"]
    
    return ScoredPick(
        pick_id=pick_id,
        pillar=pick.get("pillar", ""),
        pick_type=pick.get("pick_type", ""),
        title=pick.get("title", ""),
        cta=pick.get("cta", ""),
        reason=reason,
        final_score=final_score,
        base_score=base_score,
        boosts=boosts,
        penalties=penalties,
        warnings=warnings,
        concierge_complexity=pick.get("concierge_complexity", "low"),
        safety_level=pick.get("safety_level", "normal"),
        service_vertical=pick.get("service_vertical"),
        service_modes=pick.get("service_modes", []),
        doc_requirements=pick.get("doc_requirements", []),
        booking_fields=booking_fields,
        # New enhanced fields
        what_we_arrange=pick.get("what_we_arrange"),
        what_we_need=pick.get("what_we_need", []),
        includes=pick.get("includes", []),
    )


def rank_picks(
    picks: List[Dict[str, Any]],
    classification: ClassificationResult,
    pet_profile: PetProfile,
    max_results: int = 8,
    min_results: int = 6,
    include_filtered: bool = False,
    interaction_history: List[Dict] = None,
    enable_secondary_pillar: bool = True
) -> List[ScoredPick]:
    """
    Score and rank all picks based on classification and profile.
    
    COMPOSITION RULES (Phase 4):
    - Enforce 6-10 cards strictly
    - Secondary pillar mix (max 2 cards from related pillar)
    - History boost (picks that worked last time get +10)
    - Essentials logic (show profile completion picks only if profile is thin)
    
    Args:
        picks: List of pick documents from picks_catalogue
        classification: Output from classification pipeline
        pet_profile: Pet profile data
        max_results: Maximum number of picks to return (default 8)
        min_results: Minimum number of picks (default 6, fill with secondary pillar)
        include_filtered: If True, include picks with hard constraint violations
        interaction_history: List of past interactions for history boost
        enable_secondary_pillar: If True, include up to 2 picks from secondary pillar
    
    Returns:
        List of ScoredPick objects sorted by final_score descending
    """
    scored_picks = []
    primary_pillar = classification.pillar
    
    # Define secondary pillar mapping
    SECONDARY_PILLARS = {
        'care': 'dine',
        'dine': 'care',
        'celebrate': 'dine',
        'travel': 'stay',
        'stay': 'travel',
        'learn': 'care',
        'fit': 'care',
        'enjoy': 'celebrate',
        'advisory': 'care',
        'services': 'care'
    }
    secondary_pillar = SECONDARY_PILLARS.get(primary_pillar, 'care')
    
    # Build history lookup for boost
    history_pick_ids = set()
    if interaction_history:
        for interaction in interaction_history:
            if interaction.get('outcome') in ['completed', 'positive', 'purchased']:
                pick_id = interaction.get('pick_id')
                if pick_id:
                    history_pick_ids.add(pick_id)
    
    for pick in picks:
        scored = score_pick(pick, classification, pet_profile)
        
        # HISTORY BOOST: +10 for picks that worked in the past
        pick_id = pick.get('pick_id', '')
        if pick_id in history_pick_ids:
            scored.boosts['history_worked'] = 10.0
            scored.final_score += 10.0
        
        # Filter out hard constraint violations unless explicitly requested
        if not include_filtered:
            if scored.final_score < 0:
                continue
        
        scored_picks.append(scored)
    
    # Sort by final score descending
    scored_picks.sort(key=lambda p: p.final_score, reverse=True)
    
    # Apply safety level override
    # Emergency picks always come first
    emergency_picks = [p for p in scored_picks if p.safety_level == "emergency"]
    caution_picks = [p for p in scored_picks if p.safety_level == "caution"]
    normal_picks = [p for p in scored_picks if p.safety_level == "normal"]
    
    if classification.safety_level == "emergency":
        # Emergency: only return emergency picks
        result = emergency_picks[:max_results]
    elif classification.safety_level == "caution":
        # Caution: prioritize caution picks but include normal
        result = (caution_picks + normal_picks)[:max_results]
    else:
        # Normal: standard ranking with composition rules
        result = []
        
        # 1. Primary pillar picks (up to max_results - 2)
        primary_picks = [p for p in scored_picks if p.pillar == primary_pillar]
        result.extend(primary_picks[:max_results - 2])
        
        # 2. Secondary pillar mix (max 2 if enabled)
        if enable_secondary_pillar and len(result) < max_results:
            secondary_picks = [p for p in scored_picks if p.pillar == secondary_pillar and p not in result]
            slots_remaining = min(2, max_results - len(result))
            result.extend(secondary_picks[:slots_remaining])
        
        # 3. Fill remaining slots if below minimum
        if len(result) < min_results:
            # Add any picks not already included
            other_picks = [p for p in scored_picks if p not in result]
            slots_needed = min_results - len(result)
            result.extend(other_picks[:slots_needed])
    
    # ESSENTIALS LOGIC: If profile is thin (<50% complete), add profile completion picks
    profile_completeness = getattr(pet_profile, 'soul_completion', 100)
    if profile_completeness < 50:
        essentials_picks = [p for p in scored_picks if p.pick_type == 'profile_completion' and p not in result]
        if essentials_picks and len(result) < max_results:
            result.insert(0, essentials_picks[0])  # Add at the beginning
    
    # Ensure we have at least min_results
    while len(result) < min_results and scored_picks:
        for p in scored_picks:
            if p not in result:
                result.append(p)
                break
        else:
            break  # No more picks to add
    
    return result[:max_results]


def get_related_paperwork_picks(
    all_picks: List[Dict[str, Any]],
    primary_pick: Dict[str, Any],
    pet_profile: PetProfile
) -> List[ScoredPick]:
    """
    Get related paperwork picks based on doc_requirements of the primary pick.
    This enables the Travel -> Paperwork proactive suggestion.
    """
    doc_reqs = primary_pick.get("doc_requirements", [])
    if not doc_reqs:
        return []
    
    related_picks = []
    for pick in all_picks:
        if pick.get("pillar") != PAPERWORK_PILLAR:
            continue
        
        # Check if this paperwork pick matches any doc requirement
        pick_tags = pick.get("canonical_tags", [])
        for tag in pick_tags:
            # Match on tag similarity to doc requirements
            for doc_req in doc_reqs:
                if doc_req in tag or tag in doc_req:
                    # Create a synthetic classification for scoring
                    synth_classification = ClassificationResult(
                        primary_pillar=PAPERWORK_PILLAR,
                        canonical_tags=[tag],
                        intent="learn"
                    )
                    scored = score_pick(pick, synth_classification, pet_profile)
                    scored.boosts["doc_requirement_link"] = 10
                    scored.final_score += 10
                    related_picks.append(scored)
                    break
    
    return related_picks


# ============== TEST HELPERS ==============

def create_test_classification(
    primary_pillar: str,
    tags: List[str] = None,
    intent: str = "learn",
    safety_level: str = "normal"
) -> ClassificationResult:
    """Helper to create test classification results."""
    return ClassificationResult(
        primary_pillar=primary_pillar,
        canonical_tags=tags or [],
        intent=intent,
        safety_level=safety_level
    )


def create_test_profile(
    pet_name: str = "Buddy",
    species: str = "dog",
    breed: str = "",
    age_stage: str = "adult",
    city: str = "",
    allergies: List[str] = None,
    health_flags: List[str] = None
) -> PetProfile:
    """Helper to create test pet profiles."""
    return PetProfile(
        pet_name=pet_name,
        species=species,
        breed=breed,
        age_stage=age_stage,
        city=city,
        allergies=allergies or [],
        health_flags=health_flags or []
    )


if __name__ == "__main__":
    # Basic test
    print("MIRA OS Scoring Logic - Phase B4")
    print("=" * 50)
    
    # Test Travel -> Paperwork boost
    test_pick_paperwork = {
        "pick_id": "paperwork_fit_to_fly",
        "pillar": "paperwork",
        "pick_type": "guide",
        "canonical_tags": ["fit_to_fly_letters"],
        "base_score": 80,
        "title": "Fit-to-Fly Letter",
        "cta": "Get Letter",
        "reason_template": "Planning to fly with {pet_name}? Here's how to get the required fit-to-fly certificate.",
        "constraints": {"species": ["dog", "cat"]},
        "concierge_complexity": "medium",
        "safety_level": "normal"
    }
    
    travel_classification = create_test_classification(
        primary_pillar="travel",
        tags=["air_travel", "fit_to_fly"]
    )
    
    profile = create_test_profile(pet_name="Max", breed="Labrador", city="Mumbai")
    
    scored = score_pick(test_pick_paperwork, travel_classification, profile)
    
    print("\nTest: Travel -> Paperwork Boost")
    print(f"Pick: {scored.pick_id}")
    print(f"Base Score: {scored.base_score}")
    print(f"Boosts: {scored.boosts}")
    print(f"Final Score: {scored.final_score}")
    print(f"Travel->Paperwork boost applied: {'travel_paperwork_link' in scored.boosts}")
    
    # Test brachycephalic warning
    test_pick_air = {
        "pick_id": "travel_air_guide",
        "pillar": "travel",
        "pick_type": "guide",
        "canonical_tags": ["air_travel"],
        "base_score": 85,
        "title": "Flying with Your Pet",
        "cta": "Read Guide",
        "reason_template": "A clear guide to flying with {pet_name}.",
        "reason_template_enhanced": "Flying with a {breed} like {pet_name} needs extra prep.",
        "constraints": {
            "species": ["dog", "cat"],
            "enhanced_reason_requires": ["breed"],
            "if_brachycephalic": "show_warning"
        },
        "warning_type": "air_travel_brachy",
        "doc_requirements": ["fit_to_fly", "vaccination_records"],
        "concierge_complexity": "low",
        "safety_level": "normal"
    }
    
    pug_profile = create_test_profile(pet_name="Pugsley", breed="Pug", city="Delhi")
    scored_pug = score_pick(test_pick_air, travel_classification, pug_profile)
    
    print("\nTest: Brachycephalic Warning")
    print(f"Pick: {scored_pug.pick_id}")
    print("Breed: Pug (brachycephalic)")
    print(f"Warnings: {scored_pug.warnings}")
    print(f"Doc Requirements: {scored_pug.doc_requirements}")
    
    print("\n" + "=" * 50)
    print("Scoring Logic Tests Complete")
