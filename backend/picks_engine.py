#!/usr/bin/env python3
"""
MIRA OS Picks Engine Orchestrator - Phase B6
Wires the full pipeline: classification → safety gate → pick scoring → concierge logic → response

Key Non-Negotiables:
1. Emergency: hard override, suppress commerce, show vet routing + first-aid + Concierge
2. Caution: suppress shopping, allow education + "contact vet" routing
3. No Health pillar: symptoms route to Care (education + vet routing), never "diagnose"
4. Response must return: picks[], concierge{}, safety_override{}, missing_profile_fields[]

Output Contract:
{
    "picks": [...],
    "concierge": {"mode": "always_on", "cta_prominence": "primary|secondary|quiet", ...},
    "safety_override": {"active": bool, "level": "emergency|caution|normal", ...},
    "missing_profile_fields": [...],
    "debug": {...}  # Only if debug=True
}
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
import logging
import os

# Import Picks Engine modules
import sys
import os

# Add backend directory to path for imports
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from classification_pipeline import (
    ClassificationPipeline,
    ClassificationResult as ClassificationOutput,
)
from scoring_logic import (
    score_pick,
    rank_picks,
    create_test_classification,
    create_test_profile,
    ClassificationResult,
    PetProfile,
    ScoredPick,
    TRAVEL_TAGS,
    PAPERWORK_PILLAR,
)
from concierge_logic import (
    determine_concierge_prominence,
    create_classification_context,
    create_top_pick_context,
    ClassificationContext,
    TopPickContext,
    ConciergeDecision,
    CTAProminence,
)

logger = logging.getLogger(__name__)

# ============== CONSTANTS ==============

# Fields needed for full personalization
PROFILE_FIELDS = {
    "pet_name": {"required": True, "label": "pet's name"},
    "species": {"required": True, "label": "type (dog/cat)"},
    "breed": {"required": False, "label": "breed"},
    "age_stage": {"required": False, "label": "age (puppy/adult/senior)"},
    "city": {"required": False, "label": "city"},
    "allergies": {"required": False, "label": "known allergies"},
    "weight": {"required": False, "label": "weight"},
    "dob": {"required": False, "label": "date of birth"},
    "travel_date": {"required": False, "label": "travel date"},
}

# Emergency first aid messages
EMERGENCY_FIRST_AID = {
    "chocolate_ingestion": {
        "title": "Chocolate Poisoning First Aid",
        "steps": [
            "Stay calm - help is on the way",
            "Note the type and amount of chocolate eaten",
            "Note the time of ingestion",
            "Do NOT induce vomiting unless a vet instructs",
            "Bring the chocolate wrapper to the vet"
        ],
        "severity_note": "Dark chocolate and baking chocolate are most dangerous"
    },
    "choking": {
        "title": "Choking First Aid",
        "steps": [
            "Stay calm",
            "Open mouth and check for visible obstruction",
            "If visible, carefully try to remove with fingers",
            "If not visible, perform Heimlich maneuver for dogs",
            "Rush to nearest vet immediately"
        ],
        "severity_note": "Time is critical - if pet is unconscious, begin CPR"
    },
    "seizure": {
        "title": "Seizure First Aid",
        "steps": [
            "Move away furniture/objects that could hurt them",
            "Do NOT put your hands near their mouth",
            "Time the seizure",
            "Keep them cool",
            "Speak calmly and reassuringly"
        ],
        "severity_note": "Seizures lasting over 5 minutes are medical emergencies"
    },
    "general": {
        "title": "Emergency First Aid",
        "steps": [
            "Stay calm - your pet can sense your stress",
            "Keep the pet as still and calm as possible",
            "Do not give food or water unless advised",
            "Note symptoms and timeline",
            "Contact emergency vet immediately"
        ],
        "severity_note": "When in doubt, seek veterinary care immediately"
    }
}

# Vet routing info (would be dynamic in production)
VET_ROUTING = {
    "emergency_hotline": "+91-XXXX-XXXX",
    "whatsapp_link": "https://wa.me/919663185747?text=EMERGENCY",
    "nearest_vet_prompt": "Share your location for nearest 24/7 vet"
}


@dataclass
class SafetyOverride:
    """Safety override state for emergency/caution handling."""
    active: bool = False
    level: str = "normal"  # "normal", "caution", "emergency"
    suppress_commerce: bool = False
    suppress_shopping: bool = False
    allow_education: bool = True
    first_aid: Optional[Dict] = None
    vet_routing: Optional[Dict] = None
    reason: str = ""


@dataclass
class PicksEngineOutput:
    """Complete output from Picks Engine orchestration."""
    picks: List[Dict] = field(default_factory=list)
    concierge: Dict = field(default_factory=dict)
    safety_override: Dict = field(default_factory=dict)
    missing_profile_fields: List[str] = field(default_factory=list)
    pillar: str = ""
    intent: str = ""
    debug: Optional[Dict] = None


def get_db():
    """Get MongoDB database connection."""
    from pymongo import MongoClient
    from dotenv import load_dotenv
    load_dotenv('backend/.env')
    client = MongoClient(os.environ.get('MONGO_URL'))
    return client[os.environ.get('DB_NAME', 'test_database')]


def convert_classification_to_scoring_input(
    classification: ClassificationOutput
) -> ClassificationResult:
    """Convert classification pipeline output to scoring logic input."""
    return ClassificationResult(
        primary_pillar=classification.primary_pillar,
        secondary_pillars=[],  # ClassificationResult doesn't have this field
        canonical_tags=classification.canonical_tags or [],
        intent=classification.intent,
        confidence=classification.confidence,
        safety_level=classification.safety_level,
        temporal_triggers={}  # Not in ClassificationResult
    )


def convert_classification_to_concierge_input(
    classification: ClassificationOutput,
    service_verticals: List[str],
    original_message: str
) -> ClassificationContext:
    """Convert classification pipeline output to concierge logic input."""
    return ClassificationContext(
        primary_pillar=classification.primary_pillar,
        safety_level=classification.safety_level,
        confidence=classification.confidence,
        service_verticals=service_verticals,
        canonical_tags=classification.canonical_tags or [],
        intent=classification.intent,
        original_message=original_message
    )


def convert_pet_dict_to_profile(pet: Dict) -> PetProfile:
    """Convert pet dictionary to PetProfile for scoring."""
    return PetProfile(
        pet_name=pet.get("name", ""),
        species=pet.get("species", "dog"),
        breed=pet.get("breed", ""),
        age_stage=pet.get("age_stage", pet.get("life_stage", "adult")),
        city=pet.get("city", ""),
        allergies=pet.get("allergies", []) or [],
        health_flags=pet.get("health_flags", []) or [],
        weight=pet.get("weight"),
        coat_type=pet.get("coat_type"),
        energy_level=pet.get("energy_level"),
        dob=pet.get("dob"),
        travel_date=pet.get("travel_date")
    )


def get_missing_profile_fields(pet_profile: PetProfile) -> List[str]:
    """Determine which profile fields are missing for full personalization."""
    missing = []
    
    if not pet_profile.pet_name or pet_profile.pet_name == "your pet":
        missing.append("pet_name")
    if not pet_profile.species:
        missing.append("species")
    if not pet_profile.breed:
        missing.append("breed")
    if not pet_profile.age_stage or pet_profile.age_stage == "adult":
        # adult is default, so it might be unset
        pass  # Don't flag as missing - adult is a valid default
    if not pet_profile.city:
        missing.append("city")
    
    return missing


def determine_safety_override(
    classification: ClassificationOutput
) -> SafetyOverride:
    """
    Determine safety override state based on classification.
    
    Non-negotiables:
    - Emergency: hard override, suppress commerce, show vet routing + first-aid + Concierge
    - Caution: suppress shopping, allow education + "contact vet" routing
    """
    override = SafetyOverride()
    
    if classification.safety_level == "emergency":
        override.active = True
        override.level = "emergency"
        override.suppress_commerce = True
        override.suppress_shopping = True
        override.allow_education = True
        override.vet_routing = VET_ROUTING
        override.reason = "Emergency detected - immediate action required"
        
        # Determine first aid based on tags
        if "chocolate_ingestion" in classification.canonical_tags:
            override.first_aid = EMERGENCY_FIRST_AID["chocolate_ingestion"]
        elif "choking_suspected" in classification.canonical_tags:
            override.first_aid = EMERGENCY_FIRST_AID["choking"]
        elif "seizure" in classification.canonical_tags:
            override.first_aid = EMERGENCY_FIRST_AID["seizure"]
        else:
            override.first_aid = EMERGENCY_FIRST_AID["general"]
    
    elif classification.safety_level == "caution":
        override.active = True
        override.level = "caution"
        override.suppress_commerce = False
        override.suppress_shopping = True  # Suppress shopping, but allow education
        override.allow_education = True
        override.vet_routing = VET_ROUTING
        override.reason = "Caution advisory - vet consultation recommended"
    
    return override


def convert_scored_pick_to_dict(scored: ScoredPick) -> Dict:
    """Convert ScoredPick dataclass to dictionary for API response."""
    return {
        "pick_id": scored.pick_id,
        "pillar": scored.pillar,
        "pick_type": scored.pick_type,
        "title": scored.title,
        "cta": scored.cta,
        "reason": scored.reason,
        "final_score": scored.final_score,
        "base_score": scored.base_score,
        "boosts": scored.boosts,
        "penalties": scored.penalties,
        "warnings": scored.warnings,
        "concierge_complexity": scored.concierge_complexity,
        "safety_level": scored.safety_level,
        "service_vertical": scored.service_vertical,
        "service_modes": scored.service_modes,
        "doc_requirements": scored.doc_requirements,
        "booking_fields": scored.booking_fields,
        # New fields for enhanced pick cards
        "what_we_arrange": getattr(scored, 'what_we_arrange', None),
        "what_we_need": getattr(scored, 'what_we_need', None),
        "includes": getattr(scored, 'includes', None),
    }


async def run_picks_engine(
    message: str,
    pet: Optional[Dict] = None,
    session_id: Optional[str] = None,
    debug: bool = False,
    max_picks: int = 5
) -> PicksEngineOutput:
    """
    Main orchestrator: runs the full Picks Engine pipeline.
    
    Pipeline:
    1. Classification (B2) - understand user intent
    2. Safety Gate (B3) - check for emergency/caution
    3. Pick Scoring (B4) - rank picks based on profile
    4. Concierge Logic (B5) - determine concierge prominence
    
    Args:
        message: User's message
        pet: Pet profile dictionary (optional)
        session_id: Session ID for context
        debug: If True, include debug info in response
        max_picks: Maximum number of picks to return
    
    Returns:
        PicksEngineOutput with picks, concierge, safety_override, missing_profile_fields
    """
    output = PicksEngineOutput()
    debug_info = {} if debug else None
    
    db = get_db()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 1: Classification Pipeline (B2)
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info(f"[PICKS ENGINE] Step 1: Classification for message: {message[:50]}...")
    
    # Create classifier and run classification
    classifier = ClassificationPipeline(db)
    classification = classifier.classify(message)
    
    if debug:
        debug_info["classification"] = {
            "pillar": classification.primary_pillar,
            "canonical_tags": classification.canonical_tags,
            "matched_synonyms": classification.matched_synonyms,
            "intent": classification.intent,
            "confidence": classification.confidence,
            "safety_level": classification.safety_level,
            "service_verticals": classification.service_verticals,
            "secondary_pillars": [],  # ClassificationResult doesn't have this field
        }
    
    output.pillar = classification.primary_pillar
    output.intent = classification.intent or ""
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 2: Safety Gate Override (B3)
    # Non-negotiables enforced here
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info(f"[PICKS ENGINE] Step 2: Safety Gate - level={classification.safety_level}")
    
    safety_override = determine_safety_override(classification)
    output.safety_override = asdict(safety_override)
    
    if safety_override.active:
        logger.warning(f"[PICKS ENGINE] Safety override ACTIVE: {safety_override.level}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 3: Load Picks Catalogue and Score (B4)
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("[PICKS ENGINE] Step 3: Loading picks catalogue...")
    
    # Load all active picks
    picks_cursor = db.picks_catalogue.find(
        {"active": True},
        {"_id": 0}
    )
    all_picks = list(picks_cursor)
    logger.info(f"[PICKS ENGINE] Loaded {len(all_picks)} active picks")
    
    # Convert pet to profile for scoring
    pet_profile = convert_pet_dict_to_profile(pet) if pet else PetProfile()
    
    # Get missing profile fields
    output.missing_profile_fields = get_missing_profile_fields(pet_profile)
    
    # Convert classification for scoring
    scoring_classification = convert_classification_to_scoring_input(classification)
    
    # Score and rank picks
    scored_picks = rank_picks(
        picks=all_picks,
        classification=scoring_classification,
        pet_profile=pet_profile,
        max_results=max_picks if not debug else 10  # Return more for debug
    )
    
    logger.info(f"[PICKS ENGINE] Scored {len(scored_picks)} picks")
    
    # Convert to response format
    output.picks = [convert_scored_pick_to_dict(sp) for sp in scored_picks[:max_picks]]
    
    if debug:
        debug_info["scoring"] = {
            "total_picks_evaluated": len(all_picks),
            "picks_after_scoring": len(scored_picks),
            "top_10_picks": [
                {
                    "pick_id": sp.pick_id,
                    "final_score": sp.final_score,
                    "base_score": sp.base_score,
                    "boosts": sp.boosts,
                    "penalties": sp.penalties,
                }
                for sp in scored_picks[:10]
            ],
            "pet_profile": {
                "pet_name": pet_profile.pet_name,
                "species": pet_profile.species,
                "breed": pet_profile.breed,
                "city": pet_profile.city,
                "allergies": pet_profile.allergies,
            }
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 4: Concierge Logic (B5)
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("[PICKS ENGINE] Step 4: Concierge Logic")
    
    # Build concierge context
    concierge_classification = convert_classification_to_concierge_input(
        classification=classification,
        service_verticals=classification.service_verticals or [],
        original_message=message
    )
    
    # Get top pick context for concierge decision
    top_pick_context = None
    if scored_picks:
        top = scored_picks[0]
        top_pick_context = TopPickContext(
            pick_id=top.pick_id,
            pick_type=top.pick_type,
            pillar=top.pillar,
            concierge_complexity=top.concierge_complexity,
            service_vertical=top.service_vertical,
            has_booking_fields=bool(top.booking_fields),
            has_doc_requirements=bool(top.doc_requirements)
        )
    
    # Determine concierge prominence
    concierge_decision = determine_concierge_prominence(
        classification=concierge_classification,
        top_pick=top_pick_context,
        pet_name=pet_profile.pet_name or "your pet"
    )
    
    output.concierge = asdict(concierge_decision)
    
    if debug:
        debug_info["concierge"] = {
            "prominence": concierge_decision.cta_prominence,
            "reason": concierge_decision.reason,
            "cta": concierge_decision.cta,
            "suppress_commerce": concierge_decision.suppress_commerce,
            "top_pick_context": asdict(top_pick_context) if top_pick_context else None,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 5: Apply Safety Overrides to Picks
    # ═══════════════════════════════════════════════════════════════════════════
    if safety_override.active:
        logger.info("[PICKS ENGINE] Applying safety overrides to picks")
        
        if safety_override.level == "emergency":
            # Emergency: filter to only emergency-relevant picks
            # And force concierge to primary
            output.picks = [p for p in output.picks if p.get("safety_level") in ["emergency", "normal"]]
            output.concierge["cta_prominence"] = "primary"
            output.concierge["reason"] = "safety_override"
            output.concierge["suppress_commerce"] = True
        
        elif safety_override.level == "caution":
            # Caution: filter out shopping picks, allow education
            output.picks = [
                p for p in output.picks 
                if p.get("pick_type") not in ["product"] or p.get("safety_level") == "caution"
            ]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 6: Finalize Output
    # ═══════════════════════════════════════════════════════════════════════════
    if debug:
        output.debug = debug_info
    
    logger.info(f"[PICKS ENGINE] Complete: {len(output.picks)} picks, concierge={output.concierge.get('cta_prominence')}")
    
    return output


# ============== SYNC WRAPPER FOR NON-ASYNC CONTEXTS ==============

def run_picks_engine_sync(
    message: str,
    pet: Optional[Dict] = None,
    session_id: Optional[str] = None,
    debug: bool = False,
    max_picks: int = 5
) -> PicksEngineOutput:
    """Synchronous wrapper for run_picks_engine."""
    import asyncio
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(
            run_picks_engine(message, pet, session_id, debug, max_picks)
        )
    finally:
        loop.close()


# ============== TEST ==============

if __name__ == "__main__":
    import asyncio
    
    async def test_pipeline():
        print("=" * 70)
        print("MIRA OS Picks Engine Orchestrator - Phase B6 Test")
        print("=" * 70)
        
        # Test 1: Normal grooming query
        print("\n--- Test 1: Normal Grooming Query ---")
        result = await run_picks_engine(
            message="I need grooming for my dog",
            pet={"name": "Buddy", "species": "dog", "breed": "Golden Retriever", "city": "Mumbai"},
            debug=True
        )
        print(f"Pillar: {result.pillar}")
        print(f"Picks: {len(result.picks)}")
        print(f"Top Pick: {result.picks[0]['pick_id'] if result.picks else 'None'}")
        print(f"Concierge: {result.concierge.get('cta_prominence')}")
        print(f"Safety: {result.safety_override.get('level')}")
        
        # Test 2: Emergency query
        print("\n--- Test 2: Emergency Query ---")
        result = await run_picks_engine(
            message="my dog ate chocolate help",
            pet={"name": "Max", "species": "dog"},
            debug=True
        )
        print(f"Pillar: {result.pillar}")
        print(f"Safety Override Active: {result.safety_override.get('active')}")
        print(f"Safety Level: {result.safety_override.get('level')}")
        print(f"Suppress Commerce: {result.safety_override.get('suppress_commerce')}")
        print(f"Concierge: {result.concierge.get('cta_prominence')}")
        print(f"First Aid: {result.safety_override.get('first_aid', {}).get('title')}")
        
        # Test 3: Travel query with debug
        print("\n--- Test 3: Travel Query (Debug) ---")
        result = await run_picks_engine(
            message="I'm flying to Mumbai with my pug next week",
            pet={"name": "Pugsley", "species": "dog", "breed": "Pug", "city": "Delhi"},
            debug=True
        )
        print(f"Pillar: {result.pillar}")
        print(f"Picks: {len(result.picks)}")
        if result.debug:
            print(f"Matched Synonyms: {result.debug.get('classification', {}).get('matched_synonyms')}")
            print(f"Tags: {result.debug.get('classification', {}).get('canonical_tags')}")
            print(f"Intent: {result.debug.get('classification', {}).get('intent')}")
            print("\nTop 5 Picks with Scores:")
            for pick in result.debug.get("scoring", {}).get("top_10_picks", [])[:5]:
                print(f"  - {pick['pick_id']}: {pick['final_score']} (base={pick['base_score']}, boosts={pick['boosts']})")
        
        # Test 4: Low confidence query
        print("\n--- Test 4: Low Confidence Query ---")
        result = await run_picks_engine(
            message="something for my dog",
            pet={"name": "Buddy"},
            debug=True
        )
        print(f"Confidence: {result.debug.get('classification', {}).get('confidence') if result.debug else 'N/A'}")
        print(f"Concierge: {result.concierge.get('cta_prominence')}")
        print(f"Concierge Reason: {result.concierge.get('reason')}")
        
        # Test 5: Time pressure query
        print("\n--- Test 5: Time Pressure Query ---")
        result = await run_picks_engine(
            message="I need grooming for my dog today urgently",
            pet={"name": "Max", "species": "dog"},
            debug=True
        )
        print(f"Concierge: {result.concierge.get('cta_prominence')}")
        print(f"Concierge Reason: {result.concierge.get('reason')}")
        
        print("\n" + "=" * 70)
        print("Picks Engine Orchestrator Tests Complete!")
        print("=" * 70)
    
    asyncio.run(test_pipeline())
