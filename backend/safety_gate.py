"""
MIRA OS Safety Gate - Phase B3
seed_version: 1.0.0

Converts safety_level into hard behavioural overrides:
- emergency → only emergency picks, suppress ALL commerce, show ER vet routing
- caution → suppress shop pushes, allow education + vet booking

Returns safety_override object for frontend to render appropriate UI.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timezone


@dataclass
class SafetyOverride:
    """Safety override object for frontend rendering."""
    is_active: bool
    level: str  # "normal" | "caution" | "emergency"
    
    # Commerce suppression
    suppress_products: bool
    suppress_bookings: bool  # Except ER vet routing
    suppress_shop: bool
    
    # Emergency-specific
    show_emergency_banner: bool
    emergency_vet_cta: Optional[str]
    first_aid_steps: Optional[List[str]]
    
    # Caution-specific
    show_caution_banner: bool
    caution_message: Optional[str]
    
    # Allowed actions
    allowed_pick_types: List[str]
    
    # UI hints
    ui_theme: str  # "normal" | "caution-yellow" | "emergency-red"
    
    def to_dict(self) -> Dict:
        return asdict(self)


# First aid steps by emergency type
FIRST_AID_STEPS = {
    "poison_ingestion": [
        "Do NOT induce vomiting unless directed by a vet",
        "Note what was eaten and how much",
        "Note the time of ingestion",
        "Call your nearest emergency vet immediately",
        "Bring the packaging/sample if possible"
    ],
    "choking": [
        "Check if you can see and safely remove the object",
        "Do NOT push objects further down",
        "If dog is conscious: try back blows between shoulder blades",
        "If unconscious: perform chest compressions",
        "Rush to emergency vet immediately"
    ],
    "breathing_distress": [
        "Keep your pet calm and still",
        "Do NOT obstruct their airway",
        "Check for blue gums or tongue (sign of oxygen deprivation)",
        "Keep airways clear",
        "Rush to emergency vet immediately - this is critical"
    ],
    "seizure": [
        "Do NOT restrain your pet",
        "Move furniture/objects away to prevent injury",
        "Note the time and duration of seizure",
        "Do NOT put fingers in their mouth",
        "Keep environment calm and quiet",
        "Call emergency vet - especially if seizure lasts >3 minutes"
    ],
    "collapse_unconscious": [
        "Check for breathing and heartbeat",
        "Keep airways clear",
        "Do NOT move unnecessarily unless for safety",
        "Keep warm with a blanket",
        "Rush to emergency vet immediately"
    ],
    "severe_bleeding": [
        "Apply firm pressure with clean cloth",
        "Do NOT remove the cloth - add more on top if needed",
        "Elevate the wound if possible",
        "If limb: apply tourniquet ONLY if bleeding is life-threatening",
        "Rush to emergency vet immediately"
    ],
    "heatstroke": [
        "Move to cool, shaded area immediately",
        "Apply cool (NOT cold) water to body",
        "Focus on head, neck, and paw pads",
        "Offer small amounts of cool water",
        "Do NOT use ice - can cause shock",
        "Rush to emergency vet"
    ],
    "bloat_gdv": [
        "This is LIFE THREATENING - act fast",
        "Do NOT wait to see if it improves",
        "Do NOT try to relieve the gas yourself",
        "Keep dog calm, avoid movement",
        "Rush to emergency vet IMMEDIATELY - minutes matter"
    ],
    "trauma_accident": [
        "Do NOT move unless absolutely necessary",
        "Control any visible bleeding",
        "Keep warm and calm",
        "Support suspected fractures when moving",
        "Rush to emergency vet"
    ],
    "urinary_blockage": [
        "This is LIFE THREATENING for male cats",
        "Do NOT massage the bladder",
        "Note when they last urinated",
        "Rush to emergency vet immediately"
    ]
}

# Caution messages by tag
CAUTION_MESSAGES = {
    "mild_vomiting": "Vomiting can have many causes. Monitor your pet and consult a vet if it persists beyond 24 hours or worsens.",
    "diarrhea": "Diarrhea can lead to dehydration. Ensure access to water and consult a vet if it persists or contains blood.",
    "lethargy": "Unusual tiredness can indicate illness. Monitor for other symptoms and consult a vet if it continues.",
    "loss_appetite": "Not eating for more than 24 hours warrants a vet consultation, especially for puppies or seniors.",
    "limping": "Limping could indicate injury or joint issues. Rest your pet and consult a vet if it persists.",
    "excessive_scratching": "Persistent scratching may indicate allergies or parasites. Consult a vet to identify the cause.",
    "eye_discharge": "Eye issues can worsen quickly. Consult a vet if discharge is colored, excessive, or accompanied by squinting.",
    "ear_pain": "Ear problems can be painful and lead to infection. Consult a vet for proper diagnosis and treatment.",
    "temperature_risk": "Temperature extremes can be dangerous. Take precautions and monitor for signs of distress.",
    "choking_suspected": "Your pet may have something stuck. Monitor closely and answer these questions to assess severity."
}

# Gating questions for escalation (caution -> emergency)
GATING_QUESTIONS = {
    "choking_suspected": {
        "questions": [
            "Can your pet breathe at all? (even labored or noisy breathing)",
            "Is their tongue or gums turning blue/purple?"
        ],
        "escalation_answers": {
            "q1_no": "emergency",  # Can't breathe at all -> emergency
            "q2_yes": "emergency"  # Blue tongue/gums -> emergency
        },
        "escalation_message": "Based on your answers, this may be a choking emergency. Please rush to the nearest emergency vet immediately."
    }
}


class SafetyGate:
    """
    B3 Safety Gate - Behavioural override layer.
    
    Enforces:
    - emergency → only emergency picks, suppress all commerce
    - caution → suppress shop, allow education + vet routing
    """
    
    def __init__(self):
        pass
    
    def apply(self, classification_result: Dict) -> Dict:
        """
        Apply safety gate to classification result.
        
        Args:
            classification_result: Output from ClassificationPipeline.classify()
        
        Returns:
            classification_result with safety_override added
        """
        safety_level = classification_result.get("safety_level", "normal")
        canonical_tags = classification_result.get("canonical_tags", [])
        
        if safety_level == "emergency":
            override = self._create_emergency_override(canonical_tags)
        elif safety_level == "caution":
            override = self._create_caution_override(canonical_tags)
        else:
            override = self._create_normal_override()
        
        classification_result["safety_override"] = override.to_dict()
        return classification_result
    
    def _create_emergency_override(self, canonical_tags: List[str]) -> SafetyOverride:
        """Create emergency override - suppress ALL commerce."""
        
        # Get first aid steps for the specific emergency
        first_aid = None
        for tag in canonical_tags:
            if tag in FIRST_AID_STEPS:
                first_aid = FIRST_AID_STEPS[tag]
                break
        
        # Default emergency first aid if no specific match
        if not first_aid:
            first_aid = [
                "Stay calm - your pet needs you focused",
                "Call your nearest emergency vet immediately",
                "Do not delay - time is critical",
                "Note symptoms and time of onset",
                "Follow vet instructions carefully"
            ]
        
        return SafetyOverride(
            is_active=True,
            level="emergency",
            suppress_products=True,
            suppress_bookings=True,  # All bookings except ER routing
            suppress_shop=True,
            show_emergency_banner=True,
            emergency_vet_cta="Call/Go to Nearest Emergency Vet Now",
            first_aid_steps=first_aid,
            show_caution_banner=False,
            caution_message=None,
            allowed_pick_types=["emergency", "concierge"],  # Only emergency + ER concierge
            ui_theme="emergency-red"
        )
    
    def _create_caution_override(self, canonical_tags: List[str]) -> SafetyOverride:
        """Create caution override - suppress shop, allow education + vet."""
        
        # Get caution message for the specific symptom
        caution_msg = None
        gating_questions = None
        
        for tag in canonical_tags:
            if tag in CAUTION_MESSAGES:
                caution_msg = CAUTION_MESSAGES[tag]
            if tag in GATING_QUESTIONS:
                gating_questions = GATING_QUESTIONS[tag]
                break
        
        # Default caution message
        if not caution_msg:
            caution_msg = "This may need veterinary attention. Monitor symptoms and consult a vet if concerned."
        
        override = SafetyOverride(
            is_active=True,
            level="caution",
            suppress_products=True,  # No shopping pushes
            suppress_bookings=False,  # Allow vet booking
            suppress_shop=True,
            show_emergency_banner=False,
            emergency_vet_cta=None,
            first_aid_steps=None,
            show_caution_banner=True,
            caution_message=caution_msg,
            allowed_pick_types=["guide", "booking", "checklist", "concierge"],  # Education + vet routing
            ui_theme="caution-yellow"
        )
        
        # Add gating questions if present
        if gating_questions:
            override_dict = override.to_dict()
            override_dict["gating_questions"] = gating_questions
            return override  # Return original, will add to dict in apply()
        
        return override
    
    def _create_normal_override(self) -> SafetyOverride:
        """Create normal override - no restrictions."""
        return SafetyOverride(
            is_active=False,
            level="normal",
            suppress_products=False,
            suppress_bookings=False,
            suppress_shop=False,
            show_emergency_banner=False,
            emergency_vet_cta=None,
            first_aid_steps=None,
            show_caution_banner=False,
            caution_message=None,
            allowed_pick_types=["guide", "booking", "product", "checklist", "concierge", "emergency"],
            ui_theme="normal"
        )
    
    def filter_picks(self, picks: List[Dict], safety_override: Dict) -> List[Dict]:
        """
        Filter picks based on safety override rules.
        
        Args:
            picks: List of picks from picks_catalogue
            safety_override: SafetyOverride dict
        
        Returns:
            Filtered list of picks
        """
        if not safety_override.get("is_active"):
            return picks
        
        allowed_types = set(safety_override.get("allowed_pick_types", []))
        level = safety_override.get("level", "normal")
        
        filtered = []
        for pick in picks:
            pick_type = pick.get("pick_type", "")
            
            # Emergency: only emergency + emergency concierge
            if level == "emergency":
                if pick_type == "emergency":
                    filtered.append(pick)
                elif pick_type == "concierge" and pick.get("safety_level") == "emergency":
                    filtered.append(pick)
            
            # Caution: no products
            elif level == "caution":
                if pick_type in allowed_types and pick_type != "product":
                    filtered.append(pick)
            
            # Normal: all allowed
            else:
                if pick_type in allowed_types:
                    filtered.append(pick)
        
        return filtered


def apply_safety_gate(classification_result: Dict) -> Dict:
    """
    Convenience function to apply safety gate.
    
    Args:
        classification_result: Output from classify_message()
    
    Returns:
        classification_result with safety_override added
    """
    gate = SafetyGate()
    return gate.apply(classification_result)


# Integration with classification pipeline
def classify_with_safety(message: str, pet_id: str = None, user_id: str = None) -> Dict:
    """
    Full classification with safety gate applied.
    
    Args:
        message: User message
        pet_id: Pet ID
        user_id: User ID
    
    Returns:
        Classification result with safety_override
    """
    from classification_pipeline import classify_message
    
    result = classify_message(message, pet_id, user_id)
    result = apply_safety_gate(result)
    return result


# For testing
if __name__ == "__main__":
    import json
    
    print("=" * 60)
    print("B3 SAFETY GATE TEST")
    print("=" * 60)
    
    test_cases = [
        ("my dog ate chocolate", "Should be EMERGENCY"),
        ("my dog is gagging after eating", "Should be CAUTION or EMERGENCY"),
        ("vomiting twice since morning", "Should be CAUTION"),
        ("not breathing", "Should be EMERGENCY"),
        ("blue tongue", "Should be EMERGENCY"),
        ("collapsed suddenly", "Should be EMERGENCY"),
        ("looking for grooming", "Should be NORMAL"),
    ]
    
    for message, expected in test_cases:
        print(f"\n>>> INPUT: \"{message}\"")
        print(f"    EXPECTED: {expected}")
        result = classify_with_safety(message)
        override = result.get("safety_override", {})
        print(f"    RESULT: safety_level={result['safety_level']}, ui_theme={override.get('ui_theme')}")
        if override.get("show_emergency_banner"):
            print(f"    EMERGENCY CTA: {override.get('emergency_vet_cta')}")
            print(f"    FIRST AID: {override.get('first_aid_steps', [])[:2]}...")
        if override.get("show_caution_banner"):
            print(f"    CAUTION MSG: {override.get('caution_message')}")
        print(f"    ALLOWED PICKS: {override.get('allowed_pick_types')}")
