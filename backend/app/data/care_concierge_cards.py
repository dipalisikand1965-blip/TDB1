"""
Care Concierge Card Library
===========================

10 cards total for the Care pillar:
- 5 Concierge Products (bespoke deliverables Mira creates/coordinates)
- 5 Concierge Services (arrangements Mira executes)

ALL cards create tickets. No add-to-cart. No SKU dependency.

Selection Rules:
- Show 3-5 cards total per pet
- 2-3 Concierge Products
- 1-2 Concierge Services
- 0-1 Micro-question (if profile thin)

Persona-based scoring:
- Pampered/elegant → Spa day, grooming luxe
- Active/playful → Quick grooms, on-the-go care
- Anxious/sensitive → Calming grooming, gentle handlers
- Senior → Senior-adapted care, comfort-first
"""

from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# CONCIERGE PRODUCTS (Bespoke Deliverables)
# CTA: "Create for {Pet}" → Creates Ticket
# ═══════════════════════════════════════════════════════════════════════════════

CARE_CONCIERGE_PRODUCTS: List[Dict[str, Any]] = [
    {
        "id": "care_grooming_package",
        "type": "concierge_product",
        "name": "Custom Grooming Package for {pet_name}",
        "description": "A grooming session designed around {pet_name}'s coat type, temperament, and preferences.",
        "icon": "✂️",
        "why_concierge": "Coat-specific + temperament-aware",
        "cta_text": "Book grooming",
        "cta_action": "create_ticket",
        "ticket_category": "care_grooming",
        "why_phrases": {
            "elegant": "Premium grooming for show-ready coats",
            "pampered": "Spa-level pampering session",
            "anxious": "Gentle approach for anxious pets",
            "playful": "Quick & fun grooming session",
            "default": "Professional grooming tailored to your pet"
        },
        "persona_affinity": {
            "elegant": 0.9,
            "pampered": 0.85,
            "photo_ready": 0.8,
            "anxious": 0.7,
            "playful": 0.5,
        },
        "default_score": 75
    },
    {
        "id": "care_spa_day",
        "type": "concierge_product",
        "name": "Spa Day Experience for {pet_name}",
        "description": "Full spa treatment - bath, massage, pawdicure, aromatherapy designed for {pet_name}.",
        "icon": "💆",
        "why_concierge": "Multi-treatment coordination",
        "cta_text": "Book spa day",
        "cta_action": "create_ticket",
        "ticket_category": "care_spa",
        "why_phrases": {
            "pampered": "The ultimate pampering experience",
            "elegant": "Luxurious spa for elegant pets",
            "anxious": "Calming spa with soothing treatments",
            "senior": "Gentle, comfort-focused spa",
            "default": "Relaxing spa day for your pet"
        },
        "persona_affinity": {
            "pampered": 0.95,
            "elegant": 0.9,
            "photo_ready": 0.85,
            "anxious": 0.6,
            "senior": 0.7,
        },
        "default_score": 70
    },
    {
        "id": "care_dental_kit",
        "type": "concierge_product",
        "name": "Dental Care Kit for {pet_name}",
        "description": "Custom dental kit - toothbrush, enzymatic paste, dental chews matched to {pet_name}'s needs.",
        "icon": "🦷",
        "why_concierge": "Breed + age-specific dental needs",
        "cta_text": "Create dental kit",
        "cta_action": "create_ticket",
        "ticket_category": "care_dental",
        "why_phrases": {
            "senior": "Senior-friendly dental care",
            "health_conscious": "Proactive dental health",
            "sensitive_tummy": "Gentle formula for sensitive pets",
            "default": "Complete dental care kit"
        },
        "persona_affinity": {
            "senior": 0.85,
            "health_conscious": 0.9,
        },
        "default_score": 65
    },
    {
        "id": "care_coat_care_bundle",
        "type": "concierge_product",
        "name": "Coat Care Bundle for {pet_name}",
        "description": "Shampoo, conditioner, brushes selected for {pet_name}'s specific coat type.",
        "icon": "🧴",
        "why_concierge": "Coat type-specific products",
        "cta_text": "Create bundle",
        "cta_action": "create_ticket",
        "ticket_category": "care_coat",
        "why_phrases": {
            "elegant": "Premium products for beautiful coats",
            "fluffy": "Special care for fluffy coats",
            "short_hair": "Quick-care for short coats",
            "default": "Custom coat care essentials"
        },
        "persona_affinity": {
            "elegant": 0.85,
            "photo_ready": 0.8,
            "pampered": 0.75,
        },
        "default_score": 60
    },
    {
        "id": "care_wellness_box",
        "type": "concierge_product",
        "name": "Monthly Wellness Box for {pet_name}",
        "description": "Curated monthly box - supplements, treats, care items matched to {pet_name}'s health profile.",
        "icon": "📦",
        "why_concierge": "Health profile-based curation",
        "cta_text": "Create wellness box",
        "cta_action": "create_ticket",
        "ticket_category": "care_wellness",
        "why_phrases": {
            "health_conscious": "Proactive wellness essentials",
            "senior": "Senior wellness support",
            "active": "Active lifestyle support",
            "default": "Monthly wellness essentials"
        },
        "persona_affinity": {
            "health_conscious": 0.9,
            "senior": 0.8,
            "active": 0.75,
        },
        "default_score": 55
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# CONCIERGE SERVICES (Arrangements Mira Executes)
# CTA: "Book for {Pet}" → Creates Ticket
# ═══════════════════════════════════════════════════════════════════════════════

CARE_CONCIERGE_SERVICES: List[Dict[str, Any]] = [
    {
        "id": "care_vet_consultation",
        "type": "concierge_service",
        "name": "Vet Consultation Booking",
        "description": "We'll find the right vet and book a consultation based on {pet_name}'s needs.",
        "icon": "🏥",
        "why_concierge": "Vet matching + appointment coordination",
        "cta_text": "Book consultation",
        "cta_action": "create_ticket",
        "ticket_category": "care_vet",
        "why_phrases": {
            "anxious": "Fear-free certified vet matching",
            "senior": "Senior-specialist vet matching",
            "health_conscious": "Preventive care consultation",
            "default": "Expert vet consultation"
        },
        "persona_affinity": {
            "anxious": 0.9,
            "senior": 0.85,
            "health_conscious": 0.8,
        },
        "default_score": 70
    },
    {
        "id": "care_home_grooming",
        "type": "concierge_service",
        "name": "Home Grooming Session",
        "description": "Professional groomer comes to your home - no stress of travel for {pet_name}.",
        "icon": "🏠",
        "why_concierge": "Home-visit coordination",
        "cta_text": "Book home grooming",
        "cta_action": "create_ticket",
        "ticket_category": "care_home_grooming",
        "why_phrases": {
            "anxious": "Stress-free grooming at home",
            "pampered": "VIP grooming service at your door",
            "senior": "Comfortable home grooming for seniors",
            "default": "Professional grooming at home"
        },
        "persona_affinity": {
            "anxious": 0.95,
            "pampered": 0.85,
            "senior": 0.9,
        },
        "default_score": 65
    },
    {
        "id": "care_wellness_check",
        "type": "concierge_service",
        "name": "Wellness Check Scheduling",
        "description": "We'll schedule {pet_name}'s routine wellness check with reminders.",
        "icon": "📋",
        "why_concierge": "Scheduling + reminder system",
        "cta_text": "Schedule check",
        "cta_action": "create_ticket",
        "ticket_category": "care_wellness_check",
        "why_phrases": {
            "health_conscious": "Proactive health monitoring",
            "senior": "Senior wellness tracking",
            "default": "Routine wellness scheduling"
        },
        "persona_affinity": {
            "health_conscious": 0.9,
            "senior": 0.85,
        },
        "default_score": 60
    },
    {
        "id": "care_vaccination_tracking",
        "type": "concierge_service",
        "name": "Vaccination Schedule Management",
        "description": "We'll track and remind you of {pet_name}'s vaccination schedule.",
        "icon": "💉",
        "why_concierge": "Complete vaccination tracking",
        "cta_text": "Set up tracking",
        "cta_action": "create_ticket",
        "ticket_category": "care_vaccination",
        "why_phrases": {
            "health_conscious": "Stay on top of vaccinations",
            "default": "Never miss a vaccination"
        },
        "persona_affinity": {
            "health_conscious": 0.9,
        },
        "default_score": 55
    },
    {
        "id": "care_specialist_referral",
        "type": "concierge_service",
        "name": "Specialist Referral Service",
        "description": "Connect {pet_name} with specialists - dermatology, orthopedics, behavior.",
        "icon": "👨‍⚕️",
        "why_concierge": "Specialist network access",
        "cta_text": "Get referral",
        "cta_action": "create_ticket",
        "ticket_category": "care_specialist",
        "why_phrases": {
            "health_conscious": "Expert specialist matching",
            "senior": "Senior care specialists",
            "anxious": "Behavior specialists available",
            "default": "Connect with specialists"
        },
        "persona_affinity": {
            "health_conscious": 0.85,
            "senior": 0.8,
            "anxious": 0.75,
        },
        "default_score": 50
    },
]


def select_care_cards(pet_data: Dict, max_cards: int = 4) -> Dict:
    """
    Select the best care cards for a pet based on their profile.
    Returns a mix of products and services.
    """
    pet_name = pet_data.get("name", "Your Pet")
    breed = (pet_data.get("breed") or "").lower()
    age = pet_data.get("age", "")
    allergies = pet_data.get("allergies") or []
    traits = pet_data.get("personality_traits") or []
    
    # Determine persona hints
    persona_hints = set()
    traits_lower = [t.lower() for t in traits]
    
    if any(t in traits_lower for t in ["pampered", "luxurious", "spoiled"]):
        persona_hints.add("pampered")
    if any(t in traits_lower for t in ["elegant", "graceful", "refined"]):
        persona_hints.add("elegant")
    if any(t in traits_lower for t in ["anxious", "nervous", "shy", "timid"]):
        persona_hints.add("anxious")
    if any(t in traits_lower for t in ["playful", "energetic", "active"]):
        persona_hints.add("playful")
    if any(t in traits_lower for t in ["senior", "old", "elderly"]) or "senior" in age.lower():
        persona_hints.add("senior")
    
    # Score all cards
    all_cards = CARE_CONCIERGE_PRODUCTS + CARE_CONCIERGE_SERVICES
    scored_cards = []
    
    for card in all_cards:
        score = card.get("default_score", 50)
        affinity = card.get("persona_affinity", {})
        
        # Boost score for matching personas
        for persona in persona_hints:
            if persona in affinity:
                score += affinity[persona] * 20
        
        # Personalize description
        personalized_card = card.copy()
        personalized_card["name"] = card["name"].replace("{pet_name}", pet_name)
        personalized_card["description"] = card["description"].replace("{pet_name}", pet_name)
        
        # Select best why_phrase
        why_phrases = card.get("why_phrases", {})
        best_why = why_phrases.get("default", "")
        for persona in persona_hints:
            if persona in why_phrases:
                best_why = why_phrases[persona]
                break
        personalized_card["why_it_fits"] = best_why
        
        scored_cards.append((score, personalized_card))
    
    # Sort by score
    scored_cards.sort(key=lambda x: x[0], reverse=True)
    
    # Select top cards (mix of products and services)
    selected = []
    products_count = 0
    services_count = 0
    
    for score, card in scored_cards:
        if len(selected) >= max_cards:
            break
        
        if card["type"] == "concierge_product" and products_count < 3:
            selected.append(card)
            products_count += 1
        elif card["type"] == "concierge_service" and services_count < 2:
            selected.append(card)
            services_count += 1
    
    return {
        "cards": selected,
        "meta": {
            "pet_name": pet_name,
            "personas_detected": list(persona_hints),
            "total_cards": len(selected)
        }
    }
