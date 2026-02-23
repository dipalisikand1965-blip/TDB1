"""
Dynamic Picks Generator - Concierge-Curated Picks Engine
=========================================================

Per MIRA BIBLE: "Concierge creates and fills the picks as per the conversation"

This module generates personalized picks in real-time based on:
- Conversation intent (what user asked for)
- Pet context (soul data, allergies, preferences)
- Pillar context (dine, stay, travel, care, celebrate)

Picks are NOT looked up from a static catalogue - they are CREATED on-the-fly.
"""

import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional
import re

logger = logging.getLogger(__name__)


def generate_dynamic_picks(
    user_message: str,
    pillar: str,
    pet_context: Dict,
    location: Optional[str] = None,
    additional_context: Optional[Dict] = None
) -> List[Dict]:
    """
    Generate personalized picks based on conversation intent.
    
    Args:
        user_message: What the user asked for
        pillar: Current pillar (dine, stay, travel, care, celebrate)
        pet_context: Pet soul data (name, allergies, preferences, etc.)
        location: Optional location context
        additional_context: Any additional context from conversation
    
    Returns:
        List of personalized pick objects
    """
    pet_name = pet_context.get("name", "your pet")
    pet_allergies = pet_context.get("allergies") or pet_context.get("food_allergies") or []
    pet_breed = pet_context.get("breed", "")
    pet_size = pet_context.get("size", "medium")
    pet_energy = pet_context.get("energy_level", "")
    pet_temperament = pet_context.get("temperament", "")
    
    user_msg_lower = user_message.lower()
    picks = []
    
    # Route to appropriate pillar generator
    if pillar == "dine":
        picks = _generate_dine_picks(user_msg_lower, pet_name, pet_allergies, pet_context)
    elif pillar == "stay":
        picks = _generate_stay_picks(user_msg_lower, pet_name, pet_context, location)
    elif pillar == "travel":
        picks = _generate_travel_picks(user_msg_lower, pet_name, pet_context, location)
    elif pillar == "care":
        picks = _generate_care_picks(user_msg_lower, pet_name, pet_context)
    elif pillar == "celebrate":
        picks = _generate_celebrate_picks(user_msg_lower, pet_name, pet_context, additional_context)
    elif pillar == "enjoy":
        picks = _generate_enjoy_picks(user_msg_lower, pet_name, pet_context)
    elif pillar == "fit":
        picks = _generate_fit_picks(user_msg_lower, pet_name, pet_context)
    elif pillar == "learn":
        picks = _generate_learn_picks(user_msg_lower, pet_name, pet_context)
    elif pillar == "paperwork":
        picks = _generate_paperwork_picks(user_msg_lower, pet_name, pet_context)
    elif pillar == "advisory":
        picks = _generate_advisory_picks(user_msg_lower, pet_name, pet_context)
    elif pillar == "emergency":
        picks = _generate_emergency_picks(user_msg_lower, pet_name, pet_context)
    elif pillar == "farewell":
        picks = _generate_farewell_picks(user_msg_lower, pet_name, pet_context)
    elif pillar == "adopt":
        picks = _generate_adopt_picks(user_msg_lower, pet_name, pet_context)
    elif pillar == "shop":
        picks = _generate_shop_picks(user_msg_lower, pet_name, pet_context)
    elif pillar == "services":
        picks = _generate_services_picks(user_msg_lower, pet_name, pet_context)
    else:
        # Generic picks based on keywords
        picks = _generate_generic_picks(user_msg_lower, pet_name, pet_context)
    
    # Add metadata to all picks
    for idx, pick in enumerate(picks):
        pick.update({
            "id": f"{pillar}-{pick.get('category', 'general')}-{pet_name.lower().replace(' ', '-')}-{idx}",
            "is_personalized": True,
            "pet_name": pet_name,
            "source": "concierge_curated",
            "pillar": pillar,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "badge": f"For {pet_name}"
        })
    
    logger.info(f"[DYNAMIC PICKS] Generated {len(picks)} picks for {pillar} pillar, pet={pet_name}")
    return picks


def _generate_dine_picks(user_msg: str, pet_name: str, allergies: List, pet_context: Dict) -> List[Dict]:
    """Generate picks for DINE pillar - nutrition, food, meals"""
    picks = []
    
    # Allergy note for personalization
    allergy_note = f" (avoiding {', '.join(allergies[:2])})" if allergies else ""
    
    # Meal plan requests
    if any(kw in user_msg for kw in ["meal plan", "food plan", "diet", "nutrition", "feeding", "what to feed"]):
        picks.append({
            "type": "service",
            "category": "meal_plan",
            "title": f"Custom Meal Plan for {pet_name}",
            "subtitle": f"Personalized nutrition plan{allergy_note}",
            "icon": "📋",
            "reason": f"Tailored to {pet_name}'s dietary needs",
            "cta": "Create Plan",
            "service_type": "meal_planning"
        })
        picks.append({
            "type": "product",
            "category": "fresh_food",
            "title": f"Fresh Meals Subscription",
            "subtitle": f"Home-delivered fresh food for {pet_name}",
            "icon": "🥩",
            "reason": "Vet-formulated, human-grade ingredients",
            "cta": "Explore Options",
            "service_type": "fresh_food_subscription"
        })
    
    # Sensitive stomach / digestive issues
    if any(kw in user_msg for kw in ["sensitive", "stomach", "digest", "upset", "vomit", "diarrhea"]):
        picks.append({
            "type": "product",
            "category": "digestive",
            "title": f"Gentle Digestion Food for {pet_name}",
            "subtitle": "Easy-to-digest, stomach-friendly formula",
            "icon": "🫶",
            "reason": f"Perfect for {pet_name}'s sensitive tummy",
            "cta": "View Options",
            "service_type": "sensitive_food"
        })
        picks.append({
            "type": "product",
            "category": "supplements",
            "title": "Digestive Supplements",
            "subtitle": "Probiotics and digestive enzymes",
            "icon": "💊",
            "reason": "Supports gut health",
            "cta": "Add to Plan",
            "service_type": "digestive_supplements"
        })
    
    # Treats
    if any(kw in user_msg for kw in ["treat", "snack", "reward", "training treat"]):
        picks.append({
            "type": "product",
            "category": "treats",
            "title": f"Healthy Treats for {pet_name}",
            "subtitle": f"Delicious & nutritious{allergy_note}",
            "icon": "🦴",
            "reason": f"Matched to {pet_name}'s taste preferences",
            "cta": "Browse Treats",
            "service_type": "treats"
        })
    
    # Specific food types
    if any(kw in user_msg for kw in ["kibble", "dry food"]):
        picks.append({
            "type": "product",
            "category": "kibble",
            "title": f"Premium Kibble for {pet_name}",
            "subtitle": f"High-quality dry food{allergy_note}",
            "icon": "🍽️",
            "reason": "Balanced nutrition in every bite",
            "cta": "Compare Options",
            "service_type": "kibble"
        })
    
    if any(kw in user_msg for kw in ["wet food", "canned"]):
        picks.append({
            "type": "product",
            "category": "wet_food",
            "title": f"Wet Food Selection for {pet_name}",
            "subtitle": "Tasty, moisture-rich meals",
            "icon": "🥫",
            "reason": "Great for hydration and picky eaters",
            "cta": "View Selection",
            "service_type": "wet_food"
        })
    
    if any(kw in user_msg for kw in ["raw", "barf"]):
        picks.append({
            "type": "product",
            "category": "raw_food",
            "title": f"Raw Diet Options for {pet_name}",
            "subtitle": "Species-appropriate raw nutrition",
            "icon": "🥬",
            "reason": "Natural, ancestral diet",
            "cta": "Learn More",
            "service_type": "raw_food"
        })
    
    # Weight management
    if any(kw in user_msg for kw in ["weight", "overweight", "slim", "fat", "diet"]):
        picks.append({
            "type": "service",
            "category": "weight_management",
            "title": f"Weight Management Plan for {pet_name}",
            "subtitle": "Healthy weight loss program",
            "icon": "⚖️",
            "reason": f"Help {pet_name} reach ideal weight",
            "cta": "Start Plan",
            "service_type": "weight_management"
        })
    
    # Generic food inquiry
    if not picks:
        picks.append({
            "type": "service",
            "category": "food_consult",
            "title": f"Food Consultation for {pet_name}",
            "subtitle": "Get personalized food recommendations",
            "icon": "🍖",
            "reason": f"Find the perfect food for {pet_name}",
            "cta": "Get Recommendations",
            "service_type": "food_consultation"
        })
    
    return picks


def _generate_stay_picks(user_msg: str, pet_name: str, pet_context: Dict, location: str = None) -> List[Dict]:
    """Generate picks for STAY pillar - boarding, daycare, sitting"""
    picks = []
    loc_text = f" in {location}" if location else ""
    
    # Boarding
    if any(kw in user_msg for kw in ["board", "kennel", "overnight", "holiday", "vacation", "away"]):
        picks.append({
            "type": "service",
            "category": "boarding",
            "title": f"Premium Boarding for {pet_name}",
            "subtitle": f"Safe, comfortable overnight stays{loc_text}",
            "icon": "🏠",
            "reason": f"{pet_name} will be pampered while you're away",
            "cta": "Find Boarding",
            "service_type": "boarding"
        })
        picks.append({
            "type": "service",
            "category": "daily_updates",
            "title": "Daily Photo & Video Updates",
            "subtitle": f"Stay connected with {pet_name}",
            "icon": "📸",
            "reason": "Peace of mind while traveling",
            "cta": "Add to Booking",
            "service_type": "boarding_updates"
        })
    
    # Daycare
    if any(kw in user_msg for kw in ["daycare", "day care", "daytime", "work hours"]):
        picks.append({
            "type": "service",
            "category": "daycare",
            "title": f"Daycare for {pet_name}",
            "subtitle": f"Supervised play and socialization{loc_text}",
            "icon": "🌞",
            "reason": f"Perfect for {pet_name}'s social needs",
            "cta": "Book Daycare",
            "service_type": "daycare"
        })
    
    # Pet sitting
    if any(kw in user_msg for kw in ["sitter", "sitting", "home", "house"]):
        picks.append({
            "type": "service",
            "category": "pet_sitting",
            "title": f"In-Home Pet Sitting for {pet_name}",
            "subtitle": f"{pet_name} stays in familiar surroundings",
            "icon": "🛋️",
            "reason": "Less stress, more comfort",
            "cta": "Find Sitters",
            "service_type": "pet_sitting"
        })
    
    # Transport
    if any(kw in user_msg for kw in ["pickup", "drop", "transport", "taxi"]):
        picks.append({
            "type": "service",
            "category": "transport",
            "title": f"Pet Transport for {pet_name}",
            "subtitle": "Safe pickup and drop service",
            "icon": "🚗",
            "reason": "Door-to-door convenience",
            "cta": "Book Transport",
            "service_type": "pet_transport"
        })
    
    # Generic stay inquiry
    if not picks:
        picks.append({
            "type": "service",
            "category": "stay_consult",
            "title": f"Stay Options for {pet_name}",
            "subtitle": "Find the best care while you're away",
            "icon": "🏡",
            "reason": f"Personalized stay solutions for {pet_name}",
            "cta": "Explore Options",
            "service_type": "stay_consultation"
        })
    
    return picks


def _generate_travel_picks(user_msg: str, pet_name: str, pet_context: Dict, location: str = None) -> List[Dict]:
    """Generate picks for TRAVEL pillar - trips, transport, travel prep"""
    picks = []
    dest_text = f" to {location}" if location else ""
    
    # Flight travel
    if any(kw in user_msg for kw in ["flight", "fly", "airplane", "airport"]):
        picks.append({
            "type": "service",
            "category": "flight",
            "title": f"Flight Booking for {pet_name}",
            "subtitle": f"Pet-friendly airline options{dest_text}",
            "icon": "✈️",
            "reason": "Stress-free air travel arrangements",
            "cta": "Check Airlines",
            "service_type": "flight_booking"
        })
        picks.append({
            "type": "product",
            "category": "travel_crate",
            "title": "Airline-Approved Travel Crate",
            "subtitle": f"Sized perfectly for {pet_name}",
            "icon": "📦",
            "reason": "Required for cabin or cargo travel",
            "cta": "View Crates",
            "service_type": "travel_crate"
        })
    
    # Road trip
    if any(kw in user_msg for kw in ["road trip", "drive", "car", "road"]):
        picks.append({
            "type": "product",
            "category": "car_safety",
            "title": f"Car Safety Kit for {pet_name}",
            "subtitle": "Harness, seat cover, travel bowl",
            "icon": "🚙",
            "reason": "Safe and comfortable road trips",
            "cta": "Get Kit",
            "service_type": "car_travel_kit"
        })
    
    # Pet-friendly stays
    if any(kw in user_msg for kw in ["hotel", "stay", "accommodation", "where to stay"]):
        picks.append({
            "type": "service",
            "category": "pet_hotel",
            "title": f"Pet-Friendly Hotels{dest_text}",
            "subtitle": f"Verified stays that welcome {pet_name}",
            "icon": "🏨",
            "reason": "Pre-verified pet policies",
            "cta": "Search Hotels",
            "service_type": "pet_friendly_hotels"
        })
    
    # Travel documents
    if any(kw in user_msg for kw in ["document", "paperwork", "certificate", "permit"]):
        picks.append({
            "type": "service",
            "category": "documents",
            "title": f"Travel Documents for {pet_name}",
            "subtitle": "Health certificates, permits, vaccination records",
            "icon": "📋",
            "reason": "Complete documentation handled",
            "cta": "Check Requirements",
            "service_type": "travel_documents"
        })
    
    # General trip planning
    if any(kw in user_msg for kw in ["trip", "travel", "vacation", "holiday", "visit"]):
        picks.append({
            "type": "service",
            "category": "trip_planning",
            "title": f"Trip Planning for {pet_name}",
            "subtitle": f"Complete travel coordination{dest_text}",
            "icon": "🗺️",
            "reason": "End-to-end travel support",
            "cta": "Plan Trip",
            "service_type": "trip_planning"
        })
        picks.append({
            "type": "product",
            "category": "travel_essentials",
            "title": f"Travel Essentials Kit for {pet_name}",
            "subtitle": "Everything for a smooth journey",
            "icon": "🎒",
            "reason": "Don't forget the basics",
            "cta": "View Kit",
            "service_type": "travel_kit"
        })
    
    # Generic travel inquiry
    if not picks:
        picks.append({
            "type": "service",
            "category": "travel_consult",
            "title": f"Travel Consultation for {pet_name}",
            "subtitle": "Expert help planning pet-friendly trips",
            "icon": "🌍",
            "reason": f"Make traveling with {pet_name} easy",
            "cta": "Get Help",
            "service_type": "travel_consultation"
        })
    
    return picks


def _generate_care_picks(user_msg: str, pet_name: str, pet_context: Dict) -> List[Dict]:
    """Generate picks for CARE pillar - grooming, vet, health"""
    picks = []
    
    # Grooming
    if any(kw in user_msg for kw in ["groom", "haircut", "bath", "nail", "fur", "coat", "trim"]):
        picks.append({
            "type": "service",
            "category": "grooming",
            "title": f"Grooming Session for {pet_name}",
            "subtitle": "Full spa treatment - bath, haircut, nails",
            "icon": "✂️",
            "reason": f"Keep {pet_name} looking fabulous",
            "cta": "Book Grooming",
            "service_type": "grooming"
        })
        picks.append({
            "type": "service",
            "category": "home_grooming",
            "title": "At-Home Grooming",
            "subtitle": f"Groomer comes to {pet_name}",
            "icon": "🏠",
            "reason": "Comfort of home, professional service",
            "cta": "Book Home Visit",
            "service_type": "home_grooming"
        })
    
    # Vet / health check
    if any(kw in user_msg for kw in ["vet", "doctor", "checkup", "check-up", "health", "sick", "unwell"]):
        picks.append({
            "type": "service",
            "category": "vet_visit",
            "title": f"Vet Appointment for {pet_name}",
            "subtitle": "Wellness check or consultation",
            "icon": "🩺",
            "reason": f"Keep {pet_name} healthy",
            "cta": "Book Vet",
            "service_type": "vet_appointment"
        })
        picks.append({
            "type": "service",
            "category": "tele_vet",
            "title": "Video Vet Consultation",
            "subtitle": "Talk to a vet from home",
            "icon": "📱",
            "reason": "Quick advice without travel",
            "cta": "Connect Now",
            "service_type": "tele_vet"
        })
    
    # Vaccination
    if any(kw in user_msg for kw in ["vaccin", "shot", "injection", "immuniz"]):
        picks.append({
            "type": "service",
            "category": "vaccination",
            "title": f"Vaccination for {pet_name}",
            "subtitle": "Keep immunizations up to date",
            "icon": "💉",
            "reason": "Protection against diseases",
            "cta": "Schedule Vaccine",
            "service_type": "vaccination"
        })
    
    # Dental
    if any(kw in user_msg for kw in ["dental", "teeth", "tooth", "breath"]):
        picks.append({
            "type": "service",
            "category": "dental",
            "title": f"Dental Care for {pet_name}",
            "subtitle": "Professional teeth cleaning",
            "icon": "🦷",
            "reason": "Healthy teeth, happy pet",
            "cta": "Book Dental",
            "service_type": "dental_care"
        })
    
    # Skin/allergy issues
    if any(kw in user_msg for kw in ["skin", "itch", "scratch", "allergy", "rash", "hot spot"]):
        picks.append({
            "type": "service",
            "category": "dermatology",
            "title": f"Skin Consultation for {pet_name}",
            "subtitle": "Dermatology specialist visit",
            "icon": "🔬",
            "reason": "Get to the root of skin issues",
            "cta": "Book Consult",
            "service_type": "dermatology"
        })
    
    # Generic care inquiry
    if not picks:
        picks.append({
            "type": "service",
            "category": "care_consult",
            "title": f"Care Consultation for {pet_name}",
            "subtitle": "Personalized health and wellness advice",
            "icon": "❤️",
            "reason": f"Comprehensive care for {pet_name}",
            "cta": "Get Advice",
            "service_type": "care_consultation"
        })
    
    return picks


def _generate_celebrate_picks(user_msg: str, pet_name: str, pet_context: Dict, additional_context: Dict = None) -> List[Dict]:
    """Generate picks for CELEBRATE pillar - birthdays, parties, occasions"""
    picks = []
    additional_context = additional_context or {}
    location = additional_context.get("celebrate_location", "")
    
    # Cake
    if any(kw in user_msg for kw in ["cake", "pupcake", "dognut", "birthday cake"]):
        picks.append({
            "type": "product",
            "category": "cake",
            "title": f"Custom Birthday Cake for {pet_name}",
            "subtitle": "Dog-safe, beautifully decorated",
            "icon": "🎂",
            "reason": f"The perfect centerpiece for {pet_name}'s celebration",
            "cta": "Design Cake",
            "service_type": "birthday_cake"
        })
    
    # Photographer
    if any(kw in user_msg for kw in ["photo", "photographer", "shoot", "picture", "pics"]):
        loc_text = f"{location} " if location else ""
        picks.append({
            "type": "service",
            "category": "photography",
            "title": f"Pet Photography Session",
            "subtitle": f"{loc_text}photoshoot capturing {pet_name}'s special day",
            "icon": "📸",
            "reason": f"Beautiful memories of {pet_name}'s celebration",
            "cta": "Book Session",
            "service_type": "pet_photography"
        })
    
    # Party favors / gifts
    if any(kw in user_msg for kw in ["present", "gift", "favor", "goodie", "take away", "takeaway", "party bag"]):
        picks.append({
            "type": "product",
            "category": "party_favors",
            "title": f"Party Favors & Gift Bags",
            "subtitle": "Treats and goodies for furry guests",
            "icon": "🎁",
            "reason": f"Make {pet_name}'s guests feel special",
            "cta": "Curate Selection",
            "service_type": "party_favors"
        })
    
    # Decorations
    if any(kw in user_msg for kw in ["decor", "decoration", "banner", "balloon"]):
        picks.append({
            "type": "product",
            "category": "decorations",
            "title": f"Birthday Decorations for {pet_name}",
            "subtitle": "Banners, balloons, and party setup",
            "icon": "🎊",
            "reason": "Set the perfect party mood",
            "cta": "Browse Options",
            "service_type": "party_decorations"
        })
    
    # Party setup / coordination
    if any(kw in user_msg for kw in ["setup", "coordination", "organize", "plan", "arrange", "everything"]):
        picks.append({
            "type": "service",
            "category": "coordination",
            "title": "Full Party Coordination",
            "subtitle": "Let our Concierge® handle all the details",
            "icon": "✨",
            "reason": "Stress-free celebration planning",
            "cta": "Get Help",
            "service_type": "party_coordination"
        })
    
    # Venue
    if any(kw in user_msg for kw in ["venue", "place", "location", "where", "cafe", "restaurant"]):
        picks.append({
            "type": "service",
            "category": "venue",
            "title": f"Pet-Friendly Venues for {pet_name}'s Party",
            "subtitle": "Curated celebration spots",
            "icon": "📍",
            "reason": "Perfect party locations",
            "cta": "Find Venues",
            "service_type": "party_venue"
        })
    
    # Generic celebration
    if not picks:
        picks.append({
            "type": "service",
            "category": "celebrate_consult",
            "title": f"Celebration Planning for {pet_name}",
            "subtitle": "Make any occasion special",
            "icon": "🎉",
            "reason": f"Create unforgettable memories with {pet_name}",
            "cta": "Start Planning",
            "service_type": "celebration_planning"
        })
    
    return picks


def _generate_enjoy_picks(user_msg: str, pet_name: str, pet_context: Dict) -> List[Dict]:
    """Generate picks for ENJOY pillar - play, enrichment, activities"""
    picks = []
    
    # Toys
    if any(kw in user_msg for kw in ["toy", "play", "ball", "frisbee", "tug"]):
        picks.append({
            "type": "product",
            "category": "toys",
            "title": f"Toys for {pet_name}",
            "subtitle": "Fun, durable, and safe playthings",
            "icon": "🎾",
            "reason": f"Matched to {pet_name}'s play style",
            "cta": "Browse Toys",
            "service_type": "toys"
        })
    
    # Puzzle / enrichment
    if any(kw in user_msg for kw in ["puzzle", "enrichment", "mental", "brain", "stimulat"]):
        picks.append({
            "type": "product",
            "category": "enrichment",
            "title": f"Enrichment Toys for {pet_name}",
            "subtitle": "Mental stimulation and problem-solving",
            "icon": "🧩",
            "reason": "Keep that clever mind engaged",
            "cta": "View Puzzles",
            "service_type": "enrichment_toys"
        })
    
    # Dog park / playdate
    if any(kw in user_msg for kw in ["park", "playdate", "social", "friend", "other dog"]):
        picks.append({
            "type": "service",
            "category": "social",
            "title": f"Playdate for {pet_name}",
            "subtitle": "Organized social meetups",
            "icon": "🐕",
            "reason": f"Let {pet_name} make new friends",
            "cta": "Find Playdates",
            "service_type": "playdate"
        })
    
    return picks if picks else [{
        "type": "service",
        "category": "enjoy_consult",
        "title": f"Fun Activities for {pet_name}",
        "subtitle": "Discover new ways to play",
        "icon": "🎪",
        "reason": f"Endless entertainment for {pet_name}",
        "cta": "Explore",
        "service_type": "activity_consultation"
    }]


def _generate_fit_picks(user_msg: str, pet_name: str, pet_context: Dict) -> List[Dict]:
    """Generate picks for FIT pillar - exercise, training, fitness"""
    picks = []
    
    # Walking
    if any(kw in user_msg for kw in ["walk", "walking", "walker"]):
        picks.append({
            "type": "service",
            "category": "walking",
            "title": f"Dog Walking for {pet_name}",
            "subtitle": "Professional daily walks",
            "icon": "🚶",
            "reason": "Exercise and adventure",
            "cta": "Book Walker",
            "service_type": "dog_walking"
        })
    
    # Training
    if any(kw in user_msg for kw in ["train", "training", "behavior", "obedience", "command"]):
        picks.append({
            "type": "service",
            "category": "training",
            "title": f"Training Sessions for {pet_name}",
            "subtitle": "Professional behavior training",
            "icon": "🎓",
            "reason": f"Help {pet_name} be their best",
            "cta": "Find Trainer",
            "service_type": "training"
        })
    
    # Exercise / fitness
    if any(kw in user_msg for kw in ["exercise", "fitness", "active", "run", "swim"]):
        picks.append({
            "type": "service",
            "category": "exercise",
            "title": f"Exercise Plan for {pet_name}",
            "subtitle": "Customized fitness routine",
            "icon": "💪",
            "reason": f"Keep {pet_name} fit and healthy",
            "cta": "Get Plan",
            "service_type": "exercise_plan"
        })
    
    return picks if picks else [{
        "type": "service",
        "category": "fit_consult",
        "title": f"Fitness Consultation for {pet_name}",
        "subtitle": "Exercise and training advice",
        "icon": "🏃",
        "reason": f"Active and happy {pet_name}",
        "cta": "Get Started",
        "service_type": "fitness_consultation"
    }]


def _generate_learn_picks(user_msg: str, pet_name: str, pet_context: Dict) -> List[Dict]:
    """Generate picks for LEARN pillar - training, education, behavior"""
    picks = []
    
    # Puppy training
    if any(kw in user_msg for kw in ["puppy", "young", "new dog", "puppy school"]):
        picks.append({
            "type": "service",
            "category": "puppy_training",
            "title": f"Puppy School for {pet_name}",
            "subtitle": "Foundation training for young dogs",
            "icon": "🐕",
            "reason": "Set the right foundations early",
            "cta": "Enroll Now",
            "service_type": "puppy_school"
        })
    
    # Behavior training
    if any(kw in user_msg for kw in ["behavior", "behaviour", "aggressive", "bark", "anxiety", "fear"]):
        picks.append({
            "type": "service",
            "category": "behavior",
            "title": f"Behavior Training for {pet_name}",
            "subtitle": "Address behavioral challenges",
            "icon": "🧠",
            "reason": "Expert behavioral guidance",
            "cta": "Book Consultation",
            "service_type": "behavior_training"
        })
    
    # Obedience
    if any(kw in user_msg for kw in ["obedience", "command", "sit", "stay", "come", "heel"]):
        picks.append({
            "type": "service",
            "category": "obedience",
            "title": f"Obedience Classes for {pet_name}",
            "subtitle": "Basic to advanced commands",
            "icon": "🎓",
            "reason": "Well-mannered companion",
            "cta": "View Classes",
            "service_type": "obedience_training"
        })
    
    return picks if picks else [{
        "type": "service",
        "category": "learn_consult",
        "title": f"Training Consultation for {pet_name}",
        "subtitle": "Personalized learning plan",
        "icon": "📚",
        "reason": f"Help {pet_name} reach their potential",
        "cta": "Get Started",
        "service_type": "training_consultation"
    }]


def _generate_paperwork_picks(user_msg: str, pet_name: str, pet_context: Dict) -> List[Dict]:
    """Generate picks for PAPERWORK pillar - documents, registration, records"""
    picks = []
    
    # Passport
    if any(kw in user_msg for kw in ["passport", "travel document", "international"]):
        picks.append({
            "type": "service",
            "category": "passport",
            "title": f"Pet Passport for {pet_name}",
            "subtitle": "International travel documentation",
            "icon": "🛂",
            "reason": "Travel anywhere with your pet",
            "cta": "Start Application",
            "service_type": "pet_passport"
        })
    
    # Health records
    if any(kw in user_msg for kw in ["record", "health record", "medical", "history"]):
        picks.append({
            "type": "service",
            "category": "records",
            "title": f"Health Records for {pet_name}",
            "subtitle": "Organize medical history",
            "icon": "📋",
            "reason": "All records in one place",
            "cta": "Upload Records",
            "service_type": "health_records"
        })
    
    # Registration
    if any(kw in user_msg for kw in ["registr", "license", "microchip", "kci", "kennel club"]):
        picks.append({
            "type": "service",
            "category": "registration",
            "title": f"Registration for {pet_name}",
            "subtitle": "License and official registration",
            "icon": "📝",
            "reason": "Official pet documentation",
            "cta": "Start Registration",
            "service_type": "pet_registration"
        })
    
    return picks if picks else [{
        "type": "service",
        "category": "paperwork_consult",
        "title": f"Documentation Help for {pet_name}",
        "subtitle": "Manage all pet paperwork",
        "icon": "📄",
        "reason": "Stay organized and compliant",
        "cta": "Get Help",
        "service_type": "paperwork_consultation"
    }]


def _generate_advisory_picks(user_msg: str, pet_name: str, pet_context: Dict) -> List[Dict]:
    """Generate picks for ADVISORY pillar - expert consultation, nutrition, behavior"""
    picks = []
    
    # Nutrition advice
    if any(kw in user_msg for kw in ["nutrition", "diet", "food advice", "what to feed", "eating"]):
        picks.append({
            "type": "service",
            "category": "nutrition",
            "title": f"Nutrition Consultation for {pet_name}",
            "subtitle": "Expert dietary guidance",
            "icon": "🥗",
            "reason": "Optimal nutrition plan",
            "cta": "Book Consult",
            "service_type": "nutrition_advisory"
        })
    
    # Behavior advice
    if any(kw in user_msg for kw in ["behavior", "behaviour", "advice", "problem", "issue"]):
        picks.append({
            "type": "service",
            "category": "behavior_advisory",
            "title": f"Behavior Advisory for {pet_name}",
            "subtitle": "Expert behavioral guidance",
            "icon": "🧠",
            "reason": "Professional insights",
            "cta": "Get Advice",
            "service_type": "behavior_advisory"
        })
    
    # General expert consult
    if any(kw in user_msg for kw in ["expert", "consult", "advice", "help", "question"]):
        picks.append({
            "type": "service",
            "category": "expert",
            "title": f"Expert Consultation for {pet_name}",
            "subtitle": "Talk to a pet specialist",
            "icon": "👨‍⚕️",
            "reason": "Professional guidance",
            "cta": "Book Expert",
            "service_type": "expert_consultation"
        })
    
    return picks if picks else [{
        "type": "service",
        "category": "advisory_general",
        "title": f"Pet Advisory for {pet_name}",
        "subtitle": "Expert guidance on any topic",
        "icon": "📋",
        "reason": f"Get answers for {pet_name}",
        "cta": "Ask Expert",
        "service_type": "general_advisory"
    }]


def _generate_emergency_picks(user_msg: str, pet_name: str, pet_context: Dict) -> List[Dict]:
    """Generate picks for EMERGENCY pillar - urgent care, 24/7 help"""
    picks = []
    
    # 24/7 helpline
    picks.append({
        "type": "service",
        "category": "helpline",
        "title": "24/7 Emergency Helpline",
        "subtitle": "Immediate professional guidance",
        "icon": "📞",
        "reason": "Help is just a call away",
        "cta": "Call Now",
        "service_type": "emergency_helpline",
        "urgent": True
    })
    
    # Emergency vet
    if any(kw in user_msg for kw in ["vet", "doctor", "hospital", "clinic"]):
        picks.append({
            "type": "service",
            "category": "emergency_vet",
            "title": "Emergency Vet Nearby",
            "subtitle": "Find the nearest emergency clinic",
            "icon": "🏥",
            "reason": "Immediate veterinary care",
            "cta": "Find Vet",
            "service_type": "emergency_vet",
            "urgent": True
        })
    
    # First aid
    if any(kw in user_msg for kw in ["first aid", "hurt", "injured", "bleeding", "choking"]):
        picks.append({
            "type": "service",
            "category": "first_aid",
            "title": "First Aid Guide",
            "subtitle": "Step-by-step emergency care",
            "icon": "🩹",
            "reason": "Know what to do right now",
            "cta": "View Guide",
            "service_type": "first_aid_guide",
            "urgent": True
        })
    
    return picks


def _generate_farewell_picks(user_msg: str, pet_name: str, pet_context: Dict) -> List[Dict]:
    """Generate picks for FAREWELL pillar - memorial, grief support"""
    picks = []
    
    # Memorial
    if any(kw in user_msg for kw in ["memorial", "remember", "tribute", "honor"]):
        picks.append({
            "type": "service",
            "category": "memorial",
            "title": f"Memorial for {pet_name}",
            "subtitle": "Create a lasting tribute",
            "icon": "🌈",
            "reason": "Honor their memory beautifully",
            "cta": "Create Memorial",
            "service_type": "pet_memorial"
        })
    
    # Cremation
    if any(kw in user_msg for kw in ["cremation", "crematorium", "ashes", "urn"]):
        picks.append({
            "type": "service",
            "category": "cremation",
            "title": "Cremation Services",
            "subtitle": "Dignified and respectful",
            "icon": "🕯️",
            "reason": "Caring final arrangements",
            "cta": "Learn More",
            "service_type": "cremation_service"
        })
    
    # Grief support
    if any(kw in user_msg for kw in ["grief", "loss", "sad", "cope", "support", "miss"]):
        picks.append({
            "type": "service",
            "category": "grief_support",
            "title": "Grief Support",
            "subtitle": "You're not alone in this",
            "icon": "💜",
            "reason": "Compassionate support",
            "cta": "Get Support",
            "service_type": "grief_counseling"
        })
    
    return picks if picks else [{
        "type": "service",
        "category": "farewell_general",
        "title": "Farewell Support",
        "subtitle": "We're here for you",
        "icon": "🌈",
        "reason": "Compassionate care during difficult times",
        "cta": "Talk to Us",
        "service_type": "farewell_support"
    }]


def _generate_adopt_picks(user_msg: str, pet_name: str, pet_context: Dict) -> List[Dict]:
    """Generate picks for ADOPT pillar - adoption, fostering, shelters"""
    picks = []
    
    # Find a pet to adopt
    if any(kw in user_msg for kw in ["adopt", "adoption", "find pet", "rescue", "looking for"]):
        picks.append({
            "type": "service",
            "category": "adoption",
            "title": "Find a Pet to Adopt",
            "subtitle": "Rescue a furry friend",
            "icon": "🐾",
            "reason": "Give a pet a forever home",
            "cta": "Browse Pets",
            "service_type": "pet_adoption"
        })
    
    # Foster
    if any(kw in user_msg for kw in ["foster", "temporary", "fostering"]):
        picks.append({
            "type": "service",
            "category": "foster",
            "title": "Foster a Pet",
            "subtitle": "Temporary love, lasting impact",
            "icon": "🏠",
            "reason": "Save lives through fostering",
            "cta": "Become Foster",
            "service_type": "foster_program"
        })
    
    # Shelter
    if any(kw in user_msg for kw in ["shelter", "rescue center", "ngo"]):
        picks.append({
            "type": "service",
            "category": "shelter",
            "title": "Find Shelters Near You",
            "subtitle": "Connect with rescue organizations",
            "icon": "🏛️",
            "reason": "Support local shelters",
            "cta": "Find Shelters",
            "service_type": "shelter_finder"
        })
    
    return picks if picks else [{
        "type": "service",
        "category": "adopt_general",
        "title": "Adoption Services",
        "subtitle": "Find your perfect companion",
        "icon": "❤️",
        "reason": "Adopt, don't shop",
        "cta": "Explore",
        "service_type": "adoption_services"
    }]


def _generate_shop_picks(user_msg: str, pet_name: str, pet_context: Dict) -> List[Dict]:
    """Generate picks for SHOP pillar - products, accessories, food"""
    picks = []
    
    # Food
    if any(kw in user_msg for kw in ["food", "kibble", "treat", "snack"]):
        picks.append({
            "type": "product",
            "category": "food",
            "title": f"Food & Treats for {pet_name}",
            "subtitle": "Premium nutrition",
            "icon": "🍖",
            "reason": f"Curated for {pet_name}'s needs",
            "cta": "Shop Food",
            "service_type": "shop_food"
        })
    
    # Toys
    if any(kw in user_msg for kw in ["toy", "toys", "play", "ball", "chew"]):
        picks.append({
            "type": "product",
            "category": "toys",
            "title": f"Toys for {pet_name}",
            "subtitle": "Fun and durable playthings",
            "icon": "🎾",
            "reason": "Endless entertainment",
            "cta": "Shop Toys",
            "service_type": "shop_toys"
        })
    
    # Accessories
    if any(kw in user_msg for kw in ["accessor", "collar", "leash", "bed", "bowl"]):
        picks.append({
            "type": "product",
            "category": "accessories",
            "title": f"Accessories for {pet_name}",
            "subtitle": "Quality essentials",
            "icon": "🎀",
            "reason": "Style meets function",
            "cta": "Shop Now",
            "service_type": "shop_accessories"
        })
    
    return picks if picks else [{
        "type": "product",
        "category": "shop_general",
        "title": f"Shop for {pet_name}",
        "subtitle": "Everything your pet needs",
        "icon": "🛒",
        "reason": "Curated pet products",
        "cta": "Browse Shop",
        "service_type": "shop_general"
    }]


def _generate_services_picks(user_msg: str, pet_name: str, pet_context: Dict) -> List[Dict]:
    """Generate picks for SERVICES pillar - all services overview"""
    picks = []
    
    picks.append({
        "type": "service",
        "category": "concierge",
        "title": "Concierge® Services",
        "subtitle": f"Full-service care for {pet_name}",
        "icon": "✨",
        "reason": "White-glove pet care",
        "cta": "Explore Services",
        "service_type": "concierge_services"
    })
    
    picks.append({
        "type": "service",
        "category": "booking",
        "title": "Book Any Service",
        "subtitle": "Care, grooming, training & more",
        "icon": "📅",
        "reason": "All services in one place",
        "cta": "Book Now",
        "service_type": "service_booking"
    })
    
    return picks


def _generate_generic_picks(user_msg: str, pet_name: str, pet_context: Dict) -> List[Dict]:
    """Generate generic picks when pillar is not specific"""
    return [{
        "type": "service",
        "category": "concierge",
        "title": f"Concierge Help for {pet_name}",
        "subtitle": "Whatever you need, we'll arrange it",
        "icon": "✨",
        "reason": "Your personal pet concierge",
        "cta": "Get Help",
        "service_type": "concierge_general"
    }]
