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
