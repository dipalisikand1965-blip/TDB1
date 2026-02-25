"""
Universal Pillar Concierge Card Library
=======================================

Provides concierge cards for all pillars not yet having dedicated files.
Each pillar has 3-5 products and 2-3 services.

ALL cards create tickets. No add-to-cart.
"""

from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# STAY PILLAR
# ═══════════════════════════════════════════════════════════════════════════════

STAY_CARDS = [
    {
        "id": "stay_boarding_match",
        "type": "concierge_product",
        "name": "Pet-Friendly Hotel Shortlist for {pet_name}",
        "description": "Curated list of hotels/boarding that match {pet_name}'s temperament and your travel dates.",
        "icon": "🏨",
        "cta_text": "Get shortlist",
        "default_score": 80,
    },
    {
        "id": "stay_anxiety_trial",
        "type": "concierge_product", 
        "name": "Anxiety-Friendly Trial Stay",
        "description": "Short trial boarding to help {pet_name} adjust before longer stays.",
        "icon": "🧸",
        "cta_text": "Book trial",
        "default_score": 75,
    },
    {
        "id": "stay_temperament_match",
        "type": "concierge_product",
        "name": "Temperament-Matched Boarding",
        "description": "Boarding facility matched to {pet_name}'s energy level and social preferences.",
        "icon": "🐕",
        "cta_text": "Find match",
        "default_score": 70,
    },
    {
        "id": "stay_home_sitter",
        "type": "concierge_service",
        "name": "In-Home Pet Sitter",
        "description": "Verified sitter stays at your home - familiar environment for {pet_name}.",
        "icon": "🏠",
        "cta_text": "Find sitter",
        "default_score": 75,
    },
    {
        "id": "stay_daycare_booking",
        "type": "concierge_service",
        "name": "Daycare Reservation",
        "description": "Book daycare sessions matched to {pet_name}'s play style.",
        "icon": "☀️",
        "cta_text": "Book daycare",
        "default_score": 65,
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# TRAVEL PILLAR
# ═══════════════════════════════════════════════════════════════════════════════

TRAVEL_CARDS = [
    {
        "id": "travel_kit",
        "type": "concierge_product",
        "name": "Custom Travel Kit for {pet_name}",
        "description": "Everything {pet_name} needs - carrier, bowls, documents, comfort items.",
        "icon": "🧳",
        "cta_text": "Create kit",
        "default_score": 80,
    },
    {
        "id": "travel_itinerary",
        "type": "concierge_product",
        "name": "Pet-Friendly Itinerary",
        "description": "Curated destinations and activities that welcome {pet_name}.",
        "icon": "🗺️",
        "cta_text": "Plan trip",
        "default_score": 75,
    },
    {
        "id": "travel_carrier_match",
        "type": "concierge_product",
        "name": "Airline-Approved Carrier",
        "description": "Carrier matched to {pet_name}'s size and your airline's requirements.",
        "icon": "✈️",
        "cta_text": "Find carrier",
        "default_score": 70,
    },
    {
        "id": "travel_vet_docs",
        "type": "concierge_service",
        "name": "Travel Documentation Service",
        "description": "Health certificates, vaccinations, paperwork sorted for {pet_name}'s trip.",
        "icon": "📋",
        "cta_text": "Get docs ready",
        "default_score": 75,
    },
    {
        "id": "travel_pet_taxi",
        "type": "concierge_service",
        "name": "Pet Taxi Booking",
        "description": "Safe transport service for {pet_name} to airport or destination.",
        "icon": "🚕",
        "cta_text": "Book taxi",
        "default_score": 65,
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# LEARN PILLAR
# ═══════════════════════════════════════════════════════════════════════════════

LEARN_CARDS = [
    {
        "id": "learn_training_plan",
        "type": "concierge_product",
        "name": "Custom Training Plan for {pet_name}",
        "description": "Personalized training program based on {pet_name}'s behavior and your goals.",
        "icon": "📚",
        "cta_text": "Create plan",
        "default_score": 80,
    },
    {
        "id": "learn_behavior_assessment",
        "type": "concierge_product",
        "name": "Behavior Assessment Report",
        "description": "Expert evaluation of {pet_name}'s behavior patterns and recommendations.",
        "icon": "🧠",
        "cta_text": "Get assessment",
        "default_score": 75,
    },
    {
        "id": "learn_trick_kit",
        "type": "concierge_product",
        "name": "Trick Training Kit",
        "description": "Props, treats, and guide to teach {pet_name} new tricks.",
        "icon": "🎯",
        "cta_text": "Get kit",
        "default_score": 65,
    },
    {
        "id": "learn_trainer_match",
        "type": "concierge_service",
        "name": "Trainer Matching Service",
        "description": "Connect with a trainer specialized in {pet_name}'s breed and needs.",
        "icon": "👨‍🏫",
        "cta_text": "Find trainer",
        "default_score": 75,
    },
    {
        "id": "learn_class_booking",
        "type": "concierge_service",
        "name": "Training Class Booking",
        "description": "Book group or private classes suited to {pet_name}'s level.",
        "icon": "🎓",
        "cta_text": "Book class",
        "default_score": 70,
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# ENJOY PILLAR
# ═══════════════════════════════════════════════════════════════════════════════

ENJOY_CARDS = [
    {
        "id": "enjoy_toy_box",
        "type": "concierge_product",
        "name": "Custom Toy Box for {pet_name}",
        "description": "Curated toys matched to {pet_name}'s play style and energy level.",
        "icon": "🎾",
        "cta_text": "Create box",
        "default_score": 80,
    },
    {
        "id": "enjoy_adventure_kit",
        "type": "concierge_product",
        "name": "Adventure Day Kit",
        "description": "Everything for {pet_name}'s outdoor adventures - leash, treats, water bottle.",
        "icon": "🌲",
        "cta_text": "Get kit",
        "default_score": 75,
    },
    {
        "id": "enjoy_puzzle_set",
        "type": "concierge_product",
        "name": "Enrichment Puzzle Set",
        "description": "Mental stimulation puzzles matched to {pet_name}'s intelligence level.",
        "icon": "🧩",
        "cta_text": "Get puzzles",
        "default_score": 70,
    },
    {
        "id": "enjoy_playdate",
        "type": "concierge_service",
        "name": "Playdate Arrangement",
        "description": "Match {pet_name} with compatible play buddies in your area.",
        "icon": "🐕‍🦺",
        "cta_text": "Arrange playdate",
        "default_score": 75,
    },
    {
        "id": "enjoy_park_guide",
        "type": "concierge_service",
        "name": "Dog Park Guide",
        "description": "Curated list of best dog parks near you for {pet_name}.",
        "icon": "🏞️",
        "cta_text": "Get guide",
        "default_score": 65,
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# FIT PILLAR
# ═══════════════════════════════════════════════════════════════════════════════

FIT_CARDS = [
    {
        "id": "fit_exercise_plan",
        "type": "concierge_product",
        "name": "Custom Fitness Plan for {pet_name}",
        "description": "Exercise routine tailored to {pet_name}'s age, breed, and health.",
        "icon": "🏃",
        "cta_text": "Create plan",
        "default_score": 80,
    },
    {
        "id": "fit_gear_bundle",
        "type": "concierge_product",
        "name": "Fitness Gear Bundle",
        "description": "Harness, leash, and accessories for {pet_name}'s activities.",
        "icon": "🎽",
        "cta_text": "Get gear",
        "default_score": 75,
    },
    {
        "id": "fit_swim_kit",
        "type": "concierge_product",
        "name": "Swim & Hydro Kit",
        "description": "Life vest, towels, and gear for {pet_name}'s water activities.",
        "icon": "🏊",
        "cta_text": "Get kit",
        "default_score": 70,
    },
    {
        "id": "fit_weight_program",
        "type": "concierge_service",
        "name": "Weight Management Program",
        "description": "Personalized weight plan with nutrition and exercise for {pet_name}.",
        "icon": "⚖️",
        "cta_text": "Start program",
        "default_score": 75,
    },
    {
        "id": "fit_activity_booking",
        "type": "concierge_service",
        "name": "Activity Session Booking",
        "description": "Book swimming, agility, or hiking sessions for {pet_name}.",
        "icon": "📅",
        "cta_text": "Book session",
        "default_score": 65,
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# PAPERWORK PILLAR
# ═══════════════════════════════════════════════════════════════════════════════

PAPERWORK_CARDS = [
    {
        "id": "paperwork_organization",
        "type": "concierge_product",
        "name": "Document Organization Service",
        "description": "Digitize and organize all of {pet_name}'s documents in one place.",
        "icon": "📁",
        "cta_text": "Organize docs",
        "default_score": 80,
    },
    {
        "id": "paperwork_health_record",
        "type": "concierge_product",
        "name": "Health Record Portfolio",
        "description": "Complete health record binder for {pet_name} - vaccinations, visits, prescriptions.",
        "icon": "📋",
        "cta_text": "Create portfolio",
        "default_score": 75,
    },
    {
        "id": "paperwork_license_assist",
        "type": "concierge_service",
        "name": "License & Registration Help",
        "description": "We'll handle {pet_name}'s pet license and registration paperwork.",
        "icon": "🏷️",
        "cta_text": "Get help",
        "default_score": 70,
    },
    {
        "id": "paperwork_insurance_compare",
        "type": "concierge_service",
        "name": "Pet Insurance Comparison",
        "description": "Compare insurance options tailored to {pet_name}'s needs and your budget.",
        "icon": "🛡️",
        "cta_text": "Compare plans",
        "default_score": 75,
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# ADVISORY PILLAR
# ═══════════════════════════════════════════════════════════════════════════════

ADVISORY_CARDS = [
    {
        "id": "advisory_nutrition_consult",
        "type": "concierge_product",
        "name": "Nutrition Consultation for {pet_name}",
        "description": "Expert dietary guidance based on {pet_name}'s age, breed, and health.",
        "icon": "🥗",
        "cta_text": "Get consultation",
        "default_score": 80,
    },
    {
        "id": "advisory_wellness_plan",
        "type": "concierge_product",
        "name": "Comprehensive Wellness Plan",
        "description": "Complete health roadmap for {pet_name} - preventive care, checkups, goals.",
        "icon": "📊",
        "cta_text": "Create plan",
        "default_score": 75,
    },
    {
        "id": "advisory_behavior_consult",
        "type": "concierge_service",
        "name": "Behavior Specialist Consultation",
        "description": "Connect with a behaviorist to address {pet_name}'s specific needs.",
        "icon": "🧠",
        "cta_text": "Book consult",
        "default_score": 75,
    },
    {
        "id": "advisory_senior_care",
        "type": "concierge_service",
        "name": "Senior Care Advisory",
        "description": "Specialized guidance for {pet_name}'s golden years.",
        "icon": "🧓",
        "cta_text": "Get advice",
        "default_score": 70,
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# SERVICES PILLAR
# ═══════════════════════════════════════════════════════════════════════════════

SERVICES_CARDS = [
    {
        "id": "services_membership",
        "type": "concierge_product",
        "name": "Concierge® Membership",
        "description": "Premium access to all services with priority support for {pet_name}.",
        "icon": "👑",
        "cta_text": "Join now",
        "default_score": 85,
    },
    {
        "id": "services_personal_shopper",
        "type": "concierge_product",
        "name": "Personal Shopper Service",
        "description": "Let Concierge® pick the perfect items for {pet_name}.",
        "icon": "🛍️",
        "cta_text": "Start shopping",
        "default_score": 75,
    },
    {
        "id": "services_party_planning",
        "type": "concierge_service",
        "name": "Event Planning Service",
        "description": "Full coordination for {pet_name}'s special events.",
        "icon": "🎈",
        "cta_text": "Plan event",
        "default_score": 70,
    },
    {
        "id": "services_emergency_support",
        "type": "concierge_service",
        "name": "24/7 Emergency Support",
        "description": "Round-the-clock assistance for {pet_name}'s emergencies.",
        "icon": "🆘",
        "cta_text": "Get support",
        "default_score": 80,
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# SHOP PILLAR
# ═══════════════════════════════════════════════════════════════════════════════

SHOP_CARDS = [
    {
        "id": "shop_custom_collar",
        "type": "concierge_product",
        "name": "Custom Collar for {pet_name}",
        "description": "Personalized collar with {pet_name}'s name and your contact info.",
        "icon": "🎀",
        "cta_text": "Design collar",
        "default_score": 80,
    },
    {
        "id": "shop_custom_bed",
        "type": "concierge_product",
        "name": "Custom Bed for {pet_name}",
        "description": "Bed sized and designed for {pet_name}'s sleeping style.",
        "icon": "🛏️",
        "cta_text": "Design bed",
        "default_score": 75,
    },
    {
        "id": "shop_photo_products",
        "type": "concierge_product",
        "name": "Photo Products with {pet_name}",
        "description": "Mugs, blankets, prints featuring {pet_name}'s photo.",
        "icon": "📸",
        "cta_text": "Create products",
        "default_score": 70,
    },
    {
        "id": "shop_gift_curation",
        "type": "concierge_service",
        "name": "Gift Curation Service",
        "description": "Curated gift selection for pet lovers in your life.",
        "icon": "🎁",
        "cta_text": "Curate gifts",
        "default_score": 65,
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# PILLAR CARD REGISTRY
# ═══════════════════════════════════════════════════════════════════════════════

PILLAR_CARDS = {
    "stay": STAY_CARDS,
    "travel": TRAVEL_CARDS,
    "learn": LEARN_CARDS,
    "enjoy": ENJOY_CARDS,
    "fit": FIT_CARDS,
    "paperwork": PAPERWORK_CARDS,
    "advisory": ADVISORY_CARDS,
    "services": SERVICES_CARDS,
    "shop": SHOP_CARDS,
}


def select_pillar_cards(pillar: str, pet_data: Dict, max_cards: int = 4) -> Dict:
    """
    Select concierge cards for any pillar.
    """
    cards = PILLAR_CARDS.get(pillar, [])
    if not cards:
        logger.warning(f"No cards defined for pillar: {pillar}")
        return {"cards": [], "meta": {"pillar": pillar, "total_cards": 0}}
    
    pet_name = pet_data.get("name", "Your Pet")
    
    # Personalize cards
    personalized = []
    for card in cards[:max_cards]:
        p_card = card.copy()
        p_card["name"] = card["name"].replace("{pet_name}", pet_name)
        p_card["description"] = card["description"].replace("{pet_name}", pet_name)
        p_card["why_it_fits"] = f"Curated for {pet_name}"
        p_card["cta_action"] = "create_ticket"
        p_card["ticket_category"] = f"{pillar}_{card['id']}"
        personalized.append(p_card)
    
    # Sort by score
    personalized.sort(key=lambda x: x.get("default_score", 50), reverse=True)
    
    return {
        "cards": personalized[:max_cards],
        "meta": {
            "pet_name": pet_name,
            "pillar": pillar,
            "total_cards": len(personalized[:max_cards])
        }
    }
