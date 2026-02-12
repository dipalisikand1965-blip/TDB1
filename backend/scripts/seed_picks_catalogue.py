#!/usr/bin/env python3
"""
MIRA OS Picks Catalogue Seeder - Phase B1
seed_version: 1.0.0
source_doc_version: Mira_OS_Taxonomy_Routing_Picks_Spec_v1_2

IDEMPOTENT: Safe to run multiple times - uses upsert pattern.

Collection created:
- picks_catalogue (100 picks across 13 pillars)
"""

import os
from datetime import datetime, timezone
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

load_dotenv()

# Config
SEED_VERSION = "1.0.0"
SOURCE_DOC_VERSION = "Mira_OS_Taxonomy_Routing_Picks_Spec_v1_2"
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

def get_timestamp():
    return datetime.now(timezone.utc)

def create_pick(
    pick_id, pillar, canonical_tags, pick_type, title, cta, reason_template,
    constraints=None, service_vertical=None, service_types=None,
    base_score=50, concierge_complexity="low", safety_level="normal"
):
    """Create a pick document with all required fields."""
    if constraints is None:
        constraints = {
            "species": ["dog", "cat"],
            "age_stage": None,
            "exclude_health_flags": [],
            "required_profile_fields": []
        }
    
    return {
        "pick_id": pick_id,
        "pillar": pillar,
        "canonical_tags": canonical_tags if isinstance(canonical_tags, list) else [canonical_tags],
        "pick_type": pick_type,
        "title": title,
        "cta": cta,
        "reason_template": reason_template,
        "constraints": constraints,
        "service_vertical": service_vertical,
        "service_types": service_types or [],
        "base_score": base_score,
        "concierge_complexity": concierge_complexity,
        "safety_level": safety_level,
        "active": True,
        "seed_version": SEED_VERSION,
        "source_doc_version": SOURCE_DOC_VERSION,
        "created_at": get_timestamp(),
    }

# ============== PICKS CATALOGUE (100 picks) ==============

PICKS = []

# ==================== CARE (18 picks) ====================

PICKS.extend([
    create_pick(
        "care_grooming_book", "care", ["grooming"], "booking",
        "Book Grooming Session", "Book Now",
        "{pet_name} is a {breed} with a {coat_type} coat. Regular grooming every 4-6 weeks keeps their coat healthy and prevents matting.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["breed"]},
        service_vertical="grooming", service_types=["salon", "at_home"],
        base_score=80, concierge_complexity="low"
    ),
    create_pick(
        "care_grooming_home", "care", ["grooming"], "booking",
        "At-Home Grooming", "Book Home Visit",
        "Get {pet_name} groomed at home - perfect for pets who get anxious at salons or for your convenience.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": []},
        service_vertical="grooming", service_types=["at_home"],
        base_score=75, concierge_complexity="low"
    ),
    create_pick(
        "care_bath_book", "care", ["bath"], "booking",
        "Schedule Bath", "Book Bath",
        "A refreshing bath for {pet_name}! We'll use products safe for {coat_type} coats.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": []},
        service_vertical="grooming", service_types=["salon", "at_home"],
        base_score=70, concierge_complexity="low"
    ),
    create_pick(
        "care_nail_trim_book", "care", ["nail_trim"], "booking",
        "Nail Trim Appointment", "Book Nail Trim",
        "{pet_name}'s nails may be due for a trim. Regular trims prevent discomfort and walking issues.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": []},
        service_vertical="grooming", service_types=["salon", "at_home", "clinic"],
        base_score=65, concierge_complexity="low"
    ),
    create_pick(
        "care_dental_book", "care", ["dental_hygiene"], "booking",
        "Dental Cleaning", "Book Dental",
        "Dental health is crucial for {pet_name}. Professional cleaning helps prevent gum disease and bad breath.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": []},
        service_vertical="grooming", service_types=["salon", "clinic"],
        base_score=70, concierge_complexity="medium"
    ),
    create_pick(
        "care_vet_checkup", "care", ["vet_appointment"], "booking",
        "Vet Check-up", "Book Vet Visit",
        "Time for {pet_name}'s regular health check. Preventive care helps catch issues early.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": []},
        service_vertical="vet_care", service_types=["clinic", "at_home"],
        base_score=85, concierge_complexity="low"
    ),
    create_pick(
        "care_vaccination_book", "care", ["vaccination_schedule"], "booking",
        "Vaccination Appointment", "Schedule Vaccine",
        "{pet_name} may be due for vaccinations. Keeping up with the vaccine schedule protects against serious diseases.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["last_vaccination_date"]},
        service_vertical="vet_care", service_types=["clinic"],
        base_score=90, concierge_complexity="low"
    ),
    create_pick(
        "care_coat_guide", "care", ["grooming", "skin_coat_guidance"], "guide",
        "Coat Care Guide", "Learn More",
        "A {breed}'s {coat_type} coat needs specific care. Here's everything you need to know about keeping {pet_name}'s coat healthy.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["breed", "coat_type"]},
        base_score=60, concierge_complexity="low"
    ),
    create_pick(
        "care_dental_guide", "care", ["dental_hygiene"], "guide",
        "Dental Health Guide", "Read Guide",
        "Learn how to maintain {pet_name}'s dental health at home between professional cleanings.",
        base_score=55, concierge_complexity="low"
    ),
    create_pick(
        "care_puppy_care_checklist", "care", ["hygiene_routine"], "checklist",
        "Puppy Care Checklist", "View Checklist",
        "Everything you need to care for {pet_name} as a puppy - from grooming to health routines.",
        constraints={"species": ["dog"], "age_stage": ["puppy"], "exclude_health_flags": [], "required_profile_fields": []},
        base_score=75, concierge_complexity="low"
    ),
    create_pick(
        "care_senior_wellness", "care", ["joint_support_guidance"], "guide",
        "Senior Dog Wellness", "Learn More",
        "At {age_stage} stage, {pet_name} needs extra care for joints and overall wellness. Here's how to keep them comfortable.",
        constraints={"species": ["dog", "cat"], "age_stage": ["senior"], "exclude_health_flags": [], "required_profile_fields": []},
        base_score=70, concierge_complexity="low"
    ),
    create_pick(
        "care_flea_tick_guide", "care", ["flea_tick_prevention"], "guide",
        "Flea & Tick Prevention Guide", "Read Guide",
        "Protect {pet_name} from fleas and ticks with the right prevention schedule for {city}'s climate.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["city"]},
        base_score=65, concierge_complexity="low"
    ),
    create_pick(
        "care_grooming_products", "care", ["grooming"], "product",
        "Grooming Essentials", "Shop Now",
        "Quality grooming products for {pet_name}'s {coat_type} coat - brushes, shampoos, and more.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": []},
        base_score=50, concierge_complexity="low"
    ),
    create_pick(
        "care_supplements_shop", "care", ["supplements_guidance"], "product",
        "Recommended Supplements", "Shop Now",
        "Supplements tailored for {pet_name}'s age and needs. Support their health from the inside.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": []},
        base_score=50, concierge_complexity="low"
    ),
    # CAUTION picks
    create_pick(
        "care_vomiting_vet", "care", ["mild_vomiting"], "guide",
        "Vomiting - When to See Vet", "Read Now",
        "{pet_name} is vomiting - here's what to watch for and when to seek vet care. Monitor for 24 hours unless symptoms worsen.",
        base_score=85, concierge_complexity="medium", safety_level="caution"
    ),
    create_pick(
        "care_diarrhea_vet", "care", ["diarrhea"], "guide",
        "Diarrhea - Vet Guidance", "Read Now",
        "Diarrhea in {pet_name} - understand the causes and when it's time to consult a vet.",
        base_score=85, concierge_complexity="medium", safety_level="caution"
    ),
    create_pick(
        "care_lethargy_vet", "care", ["lethargy", "loss_appetite"], "guide",
        "Low Energy - What to Watch", "Read Now",
        "{pet_name} seems low on energy. Here's what to monitor and when to see a vet.",
        base_score=80, concierge_complexity="medium", safety_level="caution"
    ),
    create_pick(
        "care_concierge", "care", ["vet_appointment", "grooming"], "concierge",
        "Arrange Care Services", "Let Us Help",
        "Need help coordinating care for {pet_name}? Our concierge can arrange grooming, vet visits, and more.",
        base_score=70, concierge_complexity="high"
    ),
])

# ==================== DINE (12 picks) ====================

PICKS.extend([
    create_pick(
        "dine_meal_plan", "dine", ["meals"], "guide",
        "Custom Meal Plan", "Get Plan",
        "Create a balanced meal plan for {pet_name} based on their age ({age_stage}), weight, and activity level.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["weight", "age_stage"]},
        base_score=75, concierge_complexity="medium"
    ),
    create_pick(
        "dine_puppy_nutrition", "dine", ["puppy_nutrition"], "guide",
        "Puppy Nutrition Guide", "Learn More",
        "Puppies like {pet_name} need specific nutrition for healthy growth. Here's what to feed and when.",
        constraints={"species": ["dog"], "age_stage": ["puppy"], "exclude_health_flags": [], "required_profile_fields": []},
        base_score=80, concierge_complexity="low"
    ),
    create_pick(
        "dine_senior_nutrition", "dine", ["senior_nutrition"], "guide",
        "Senior Dog Diet Guide", "Learn More",
        "As a senior, {pet_name} has different nutritional needs. Adjust their diet for optimal health.",
        constraints={"species": ["dog", "cat"], "age_stage": ["senior"], "exclude_health_flags": [], "required_profile_fields": []},
        base_score=80, concierge_complexity="low"
    ),
    create_pick(
        "dine_allergy_safe", "dine", ["allergy_safe"], "guide",
        "Allergy-Safe Foods", "View Options",
        "Based on {pet_name}'s allergies ({allergies}), here are safe food options that avoid these ingredients.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["allergies"]},
        base_score=90, concierge_complexity="medium"
    ),
    create_pick(
        "dine_picky_eater", "dine", ["picky_eater"], "guide",
        "Picky Eater Solutions", "Get Tips",
        "{pet_name} being fussy with food? Here are proven strategies to encourage healthy eating.",
        base_score=70, concierge_complexity="low"
    ),
    create_pick(
        "dine_weight_loss", "dine", ["weight_loss_diet"], "guide",
        "Weight Loss Diet Plan", "Start Plan",
        "Help {pet_name} reach a healthy weight with a structured diet plan and portion guidance.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["weight"]},
        base_score=75, concierge_complexity="medium"
    ),
    create_pick(
        "dine_food_transition", "dine", ["food_transition"], "guide",
        "Food Transition Guide", "Read Guide",
        "Switching {pet_name}'s food? Here's how to transition gradually to avoid stomach upset.",
        base_score=65, concierge_complexity="low"
    ),
    create_pick(
        "dine_treats_shop", "dine", ["treats"], "product",
        "Healthy Treats", "Shop Treats",
        "Delicious, healthy treats for {pet_name} - perfect for training or just because!",
        base_score=55, concierge_complexity="low"
    ),
    create_pick(
        "dine_food_subscription", "dine", ["subscription_food"], "product",
        "Food Subscription", "Subscribe",
        "Never run out of {pet_name}'s food. Set up a subscription for automatic deliveries.",
        base_score=50, concierge_complexity="low"
    ),
    create_pick(
        "dine_toxic_foods", "dine", ["toxic_avoidance"], "checklist",
        "Toxic Foods Checklist", "View List",
        "Keep {pet_name} safe - here's a complete list of foods that are toxic to pets.",
        base_score=85, concierge_complexity="low"
    ),
    create_pick(
        "dine_raw_diet_guide", "dine", ["raw_diet"], "guide",
        "Raw Diet Starter Guide", "Learn More",
        "Considering raw feeding for {pet_name}? Here's how to start safely and balance nutrition.",
        base_score=60, concierge_complexity="medium"
    ),
    create_pick(
        "dine_concierge", "dine", ["meals", "allergy_safe"], "concierge",
        "Custom Diet Planning", "Get Help",
        "Need personalized diet advice for {pet_name}? Our nutrition experts can create a custom plan.",
        base_score=70, concierge_complexity="high"
    ),
])

# ==================== STAY (10 picks) ====================

PICKS.extend([
    create_pick(
        "stay_boarding_book", "stay", ["kennel"], "booking",
        "Book Boarding", "Find Boarding",
        "{pet_name} will be comfortable at a boarding facility that matches their {energy_level} energy level.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": []},
        service_vertical="boarding", service_types=["boarding_facility"],
        base_score=85, concierge_complexity="medium"
    ),
    create_pick(
        "stay_premium_boarding", "stay", ["premium_boarding"], "booking",
        "Premium Boarding", "Book Luxury",
        "Treat {pet_name} to luxury boarding with extra amenities, space, and personalized attention.",
        service_vertical="boarding", service_types=["boarding_facility"],
        base_score=75, concierge_complexity="medium"
    ),
    create_pick(
        "stay_daycare_book", "stay", ["daycare"], "booking",
        "Book Daycare", "Find Daycare",
        "Keep {pet_name} active and social during the day with trusted daycare services.",
        service_vertical="daycare", service_types=["daycare_center"],
        base_score=80, concierge_complexity="low"
    ),
    create_pick(
        "stay_pet_sitter", "stay", ["pet_sitting"], "booking",
        "Find Pet Sitter", "Book Sitter",
        "{pet_name} can stay comfortable at home with a trusted pet sitter who follows their routine.",
        service_vertical="boarding", service_types=["at_home"],
        base_score=80, concierge_complexity="medium"
    ),
    create_pick(
        "stay_overnight_sitter", "stay", ["overnight_sitter"], "booking",
        "Overnight Sitter", "Book Overnight",
        "An overnight sitter ensures {pet_name} is never alone and maintains their sleep routine.",
        service_vertical="boarding", service_types=["at_home"],
        base_score=75, concierge_complexity="medium"
    ),
    create_pick(
        "stay_boarding_checklist", "stay", ["kennel"], "checklist",
        "Boarding Checklist", "View Checklist",
        "Everything to pack and prepare before {pet_name}'s boarding stay.",
        base_score=65, concierge_complexity="low"
    ),
    create_pick(
        "stay_separation_anxiety", "stay", ["separation_anxiety_stay"], "guide",
        "Separation Anxiety Guide", "Read Guide",
        "If {pet_name} gets anxious when you're away, here's how to prepare them for boarding.",
        base_score=70, concierge_complexity="medium"
    ),
    create_pick(
        "stay_first_boarding", "stay", ["trial_night"], "guide",
        "First Boarding Tips", "Learn More",
        "First time boarding {pet_name}? Here's how to make the experience stress-free for both of you.",
        base_score=65, concierge_complexity="low"
    ),
    create_pick(
        "stay_senior_boarding", "stay", ["senior_boarding"], "guide",
        "Senior Pet Boarding Guide", "Read Guide",
        "Senior pets like {pet_name} need special considerations when boarding. Here's what to look for.",
        constraints={"species": ["dog", "cat"], "age_stage": ["senior"], "exclude_health_flags": [], "required_profile_fields": []},
        base_score=70, concierge_complexity="medium"
    ),
    create_pick(
        "stay_concierge", "stay", ["kennel", "daycare"], "concierge",
        "Arrange Boarding", "Let Us Help",
        "Let us find the perfect boarding or daycare for {pet_name} based on their personality and needs.",
        base_score=75, concierge_complexity="high"
    ),
])

# ==================== TRAVEL (10 picks) ====================

PICKS.extend([
    # travel_air_guide - Guide + Docs (ENHANCED per user spec)
    {
        "pick_id": "travel_air_guide",
        "pillar": "travel",
        "pick_type": "guide",
        "canonical_tags": ["air_travel"],
        "base_score": 85,
        "title": "Flying with Your Pet",
        "cta": "Read Guide",
        "reason_template": "A clear guide to flying with {pet_name} — airlines, crates, prep, and what to expect.",
        "reason_template_enhanced": "Flying with a {breed} like {pet_name} needs a little extra prep. Here's the complete guide.",
        "constraints": {
            "species": ["dog", "cat"],
            "age_stages": ["puppy", "adult", "senior"],
            "exclude_health_flags": [],
            "enhanced_reason_requires": ["breed"],
            "if_brachycephalic": "show_warning"
        },
        "warning_type": "air_travel_brachy",
        "doc_requirements": ["fit_to_fly", "vaccination_records", "microchip_certificate"],
        "temporal_triggers": {"travel_date": True},
        "concierge_complexity": "low",
        "safety_level": "normal",
        "active": True,
        "seed_version": SEED_VERSION,
        "source_doc_version": SOURCE_DOC_VERSION,
        "created_at": get_timestamp(),
    },
    create_pick(
        "travel_car_guide", "travel", ["car_travel"], "guide",
        "Road Trip Guide", "Get Tips",
        "Planning a road trip with {pet_name}? Here's how to make it safe and comfortable.",
        base_score=70, concierge_complexity="low"
    ),
    create_pick(
        "travel_pet_taxi", "travel", ["pet_taxi"], "booking",
        "Book Pet Taxi", "Book Now",
        "Safe and comfortable transport for {pet_name} - pet-friendly vehicles with trained drivers.",
        service_vertical="transport", service_types=["pickup_drop"],
        base_score=80, concierge_complexity="low"
    ),
    # travel_airport_transfer - Booking (ENHANCED per user spec)
    {
        "pick_id": "travel_airport_transfer",
        "pillar": "travel",
        "pick_type": "booking",
        "canonical_tags": ["airport_transfer"],
        "base_score": 85,
        "title": "Airport Transfer",
        "cta": "Book Transfer",
        "reason_template": "Pet-safe airport transport for {pet_name} — calm handling, comfort stops if needed.",
        "reason_template_enhanced": "I'll arrange airport transport for {pet_name} from {city}, with the right crate guidance and timing.",
        "constraints": {
            "species": ["dog", "cat"],
            "age_stages": ["puppy", "adult", "senior"],
            "exclude_health_flags": [],
            "required_booking_fields": ["city", "airport", "transfer_date", "pickup_or_drop"],
            "optional_booking_fields": ["flight_number", "pet_weight", "crate_size", "pickup_time"],
            "enhanced_reason_requires": ["city"]
        },
        "service_vertical": "transport",
        "service_modes": ["pickup_drop"],
        "temporal_triggers": {"travel_date": True},
        "concierge_complexity": "medium",
        "safety_level": "normal",
        "active": True,
        "seed_version": SEED_VERSION,
        "source_doc_version": SOURCE_DOC_VERSION,
        "created_at": get_timestamp(),
    },
    create_pick(
        "travel_fit_to_fly", "travel", ["fit_to_fly"], "guide",
        "Fit-to-Fly Requirements", "Learn More",
        "{pet_name} needs a fit-to-fly certificate for air travel. Here's what's required and how to get it.",
        base_score=80, concierge_complexity="medium"
    ),
    create_pick(
        "travel_international", "travel", ["international_travel"], "guide",
        "International Travel Guide", "Read Guide",
        "Moving abroad with {pet_name}? Complete guide to international pet relocation requirements.",
        base_score=85, concierge_complexity="high"
    ),
    create_pick(
        "travel_crate_guide", "travel", ["crate_selection"], "guide",
        "Crate Selection Guide", "Find Crate",
        "Choose the right travel crate for {pet_name} based on their size and the airline requirements.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["weight"]},
        base_score=65, concierge_complexity="low"
    ),
    create_pick(
        "travel_motion_sickness", "travel", ["motion_sickness"], "guide",
        "Motion Sickness Tips", "Get Tips",
        "Does {pet_name} get car sick? Here's how to prevent and manage motion sickness during travel.",
        base_score=60, concierge_complexity="low"
    ),
    create_pick(
        "travel_checklist", "travel", ["travel_kit"], "checklist",
        "Travel Packing Checklist", "View List",
        "Don't forget anything! Complete packing checklist for traveling with {pet_name}.",
        base_score=70, concierge_complexity="low"
    ),
    create_pick(
        "travel_concierge", "travel", ["air_travel", "pet_taxi"], "concierge",
        "Plan Pet Travel", "Get Help",
        "Complex travel plans? Our concierge can coordinate flights, transport, and documentation for {pet_name}.",
        base_score=80, concierge_complexity="high"
    ),
])

# ==================== ENJOY (8 picks) ====================

PICKS.extend([
    create_pick(
        "enjoy_dog_parks", "enjoy", ["dog_parks"], "guide",
        "Dog Parks Near You", "Find Parks",
        "Discover dog-friendly parks near {city} where {pet_name} can run, play, and socialize.",
        constraints={"species": ["dog"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["city"]},
        base_score=70, concierge_complexity="low"
    ),
    create_pick(
        "enjoy_pet_cafes", "enjoy", ["cafes"], "guide",
        "Pet-Friendly Cafes", "Explore",
        "Enjoy coffee with {pet_name}! Here are pet-friendly cafes in {city} that welcome furry friends.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["city"]},
        base_score=60, concierge_complexity="low"
    ),
    create_pick(
        "enjoy_playdates", "enjoy", ["playdates"], "guide",
        "Arrange Playdates", "Find Friends",
        "Social time for {pet_name}! Find compatible playmates based on temperament and energy level.",
        base_score=65, concierge_complexity="medium"
    ),
    create_pick(
        "enjoy_enrichment", "enjoy", ["enrichment_games"], "guide",
        "Enrichment Activities", "Get Ideas",
        "Keep {pet_name}'s mind sharp with enrichment activities tailored to their intelligence and energy.",
        base_score=65, concierge_complexity="low"
    ),
    create_pick(
        "enjoy_toys_shop", "enjoy", ["toys"], "product",
        "Interactive Toys", "Shop Toys",
        "Engaging toys to keep {pet_name} entertained and mentally stimulated.",
        base_score=55, concierge_complexity="low"
    ),
    create_pick(
        "enjoy_noise_phobia", "enjoy", ["noise_phobia_support"], "guide",
        "Noise Anxiety Guide", "Read Guide",
        "Help {pet_name} cope with loud noises like fireworks and thunder with these calming strategies.",
        base_score=75, concierge_complexity="medium"
    ),
    create_pick(
        "enjoy_weekend_getaway", "enjoy", ["weekend_getaway"], "guide",
        "Pet-Friendly Getaways", "Explore",
        "Plan a weekend trip with {pet_name}! Pet-friendly destinations and stays near {city}.",
        constraints={"species": ["dog"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["city"]},
        base_score=60, concierge_complexity="medium"
    ),
    create_pick(
        "enjoy_concierge", "enjoy", ["playdates", "weekend_getaway"], "concierge",
        "Plan Pet Activities", "Get Help",
        "Let us plan fun activities and outings for {pet_name} - from playdates to weekend trips.",
        base_score=65, concierge_complexity="high"
    ),
])

# ==================== FIT (8 picks) ====================

PICKS.extend([
    create_pick(
        "fit_walker_book", "fit", ["daily_walks"], "booking",
        "Book Dog Walker", "Find Walker",
        "Regular walks keep {pet_name} healthy and happy. Book a trusted walker for daily exercise.",
        constraints={"species": ["dog"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": []},
        service_vertical="dog_walking", service_types=["field"],
        base_score=85, concierge_complexity="low"
    ),
    create_pick(
        "fit_training_book", "fit", ["basic_obedience"], "booking",
        "Book Trainer", "Find Trainer",
        "Professional training for {pet_name} - from basic obedience to advanced skills.",
        service_vertical="training", service_types=["at_home", "field"],
        base_score=80, concierge_complexity="medium"
    ),
    create_pick(
        "fit_puppy_exercise", "fit", ["puppy_energy"], "guide",
        "Puppy Exercise Guide", "Read Guide",
        "Puppies like {pet_name} have lots of energy! Here's how much exercise they need at each stage.",
        constraints={"species": ["dog"], "age_stage": ["puppy"], "exclude_health_flags": [], "required_profile_fields": []},
        base_score=75, concierge_complexity="low"
    ),
    create_pick(
        "fit_senior_mobility", "fit", ["senior_mobility"], "guide",
        "Senior Mobility Tips", "Learn More",
        "Keep {pet_name} active in their senior years with gentle exercises that support joint health.",
        constraints={"species": ["dog", "cat"], "age_stage": ["senior"], "exclude_health_flags": [], "required_profile_fields": []},
        base_score=70, concierge_complexity="low"
    ),
    create_pick(
        "fit_leash_training", "fit", ["leash_training"], "guide",
        "Leash Training Guide", "Get Tips",
        "Stop the pulling! Train {pet_name} to walk calmly on a leash with these proven techniques.",
        constraints={"species": ["dog"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": []},
        base_score=70, concierge_complexity="low"
    ),
    create_pick(
        "fit_reactivity_guide", "fit", ["reactivity"], "guide",
        "Reactivity Training", "Read Guide",
        "Help {pet_name} stay calm around other dogs and people with reactivity management strategies.",
        constraints={"species": ["dog"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": []},
        base_score=75, concierge_complexity="medium"
    ),
    create_pick(
        "fit_harness_shop", "fit", ["harnesses"], "product",
        "Find the Right Harness", "Shop Now",
        "The right harness makes walks more comfortable for {pet_name}. Find one that fits perfectly.",
        constraints={"species": ["dog"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["weight"]},
        base_score=50, concierge_complexity="low"
    ),
    create_pick(
        "fit_concierge", "fit", ["basic_obedience", "socialisation"], "concierge",
        "Arrange Training", "Get Help",
        "Need help finding the right trainer for {pet_name}? We'll match you with experts in your area.",
        base_score=70, concierge_complexity="high"
    ),
])

# ==================== LEARN (8 picks) ====================

PICKS.extend([
    create_pick(
        "learn_new_pet", "learn", ["new_pet_parenting"], "guide",
        "New Pet Parent Guide", "Start Here",
        "Welcome to pet parenthood! Here's everything you need to know about caring for {pet_name}.",
        base_score=90, concierge_complexity="low"
    ),
    create_pick(
        "learn_breed_guide", "learn", ["breed_guide"], "guide",
        "Breed-Specific Guide", "Learn More",
        "{breed} dogs like {pet_name} have unique needs. Here's a complete guide to caring for this breed.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["breed"]},
        base_score=75, concierge_complexity="low"
    ),
    create_pick(
        "learn_potty_training", "learn", ["training_basics_education"], "guide",
        "Potty Training 101", "Read Guide",
        "House train {pet_name} successfully with this step-by-step potty training guide.",
        constraints={"species": ["dog"], "age_stage": ["puppy"], "exclude_health_flags": [], "required_profile_fields": []},
        base_score=85, concierge_complexity="low"
    ),
    create_pick(
        "learn_first_aid", "learn", ["first_aid_education"], "guide",
        "Pet First Aid Basics", "Learn Now",
        "Be prepared for emergencies. Learn essential first aid skills to help {pet_name} in a crisis.",
        base_score=80, concierge_complexity="low"
    ),
    create_pick(
        "learn_trainer_class", "learn", ["trainer_class"], "booking",
        "Book Trainer Class", "Find Class",
        "Structured learning for {pet_name}! Find group classes or private sessions with certified trainers.",
        service_vertical="training", service_types=["field", "at_home"],
        base_score=75, concierge_complexity="medium"
    ),
    create_pick(
        "learn_video_library", "learn", ["video_library"], "guide",
        "Training Videos", "Watch Now",
        "Learn at your own pace with curated training videos perfect for you and {pet_name}.",
        base_score=60, concierge_complexity="low"
    ),
    create_pick(
        "learn_socialisation", "learn", ["socialisation_education"], "guide",
        "Socialisation Guide", "Read Guide",
        "Proper socialisation is crucial for {pet_name}'s development. Here's how to do it right.",
        constraints={"species": ["dog"], "age_stage": ["puppy", "adult"], "exclude_health_flags": [], "required_profile_fields": []},
        base_score=80, concierge_complexity="low"
    ),
    create_pick(
        "learn_concierge", "learn", ["qa_with_expert"], "concierge",
        "Expert Consultation", "Get Help",
        "Have specific questions about {pet_name}? Connect with our experts for personalized guidance.",
        base_score=70, concierge_complexity="high"
    ),
])

# ==================== CELEBRATE (8 picks) ====================

PICKS.extend([
    create_pick(
        "celebrate_birthday", "celebrate", ["birthday"], "guide",
        "Plan Birthday Party", "Start Planning",
        "{pet_name} turns {age} on {dob}! Let's plan a special celebration with pet-safe treats and activities.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["dob"]},
        base_score=85, concierge_complexity="medium"
    ),
    create_pick(
        "celebrate_cake_order", "celebrate", ["cakes"], "product",
        "Order Pet-Safe Cake", "Order Now",
        "A delicious, pet-safe cake for {pet_name}'s special day - made with ingredients safe for dogs.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": ["allergies"], "required_profile_fields": []},
        base_score=80, concierge_complexity="low"
    ),
    create_pick(
        "celebrate_photo_shoot", "celebrate", ["photo_shoot"], "booking",
        "Book Photo Shoot", "Book Now",
        "Capture {pet_name}'s special moments with a professional pet photography session.",
        service_vertical="pet_photography", service_types=["field", "at_home"],
        base_score=75, concierge_complexity="medium"
    ),
    create_pick(
        "celebrate_gotcha_day", "celebrate", ["gotcha_day"], "guide",
        "Gotcha Day Ideas", "Get Ideas",
        "Celebrate the day {pet_name} joined your family! Here are meaningful ways to mark the occasion.",
        base_score=70, concierge_complexity="low"
    ),
    create_pick(
        "celebrate_hamper", "celebrate", ["personalised_hamper"], "product",
        "Gift Hamper", "Shop Now",
        "A curated gift hamper for {pet_name} - treats, toys, and goodies they'll love.",
        base_score=65, concierge_complexity="low"
    ),
    create_pick(
        "celebrate_paw_print", "celebrate", ["paw_print"], "product",
        "Paw Print Keepsake", "Order Now",
        "Preserve {pet_name}'s paw print as a lasting memory. Perfect for any milestone.",
        base_score=60, concierge_complexity="low"
    ),
    create_pick(
        "celebrate_pawty_guide", "celebrate", ["pawty"], "guide",
        "Pawty Planning Guide", "Read Guide",
        "Throw the ultimate pet party! Tips for hosting a fun and safe celebration for {pet_name}.",
        base_score=65, concierge_complexity="medium"
    ),
    create_pick(
        "celebrate_concierge", "celebrate", ["birthday", "pawty"], "concierge",
        "Plan Celebration", "Get Help",
        "Let us plan the perfect celebration for {pet_name} - from cakes to party setup.",
        base_score=75, concierge_complexity="high"
    ),
])

# ==================== ADOPT (6 picks) ====================

PICKS.extend([
    create_pick(
        "adopt_where", "adopt", ["where_to_adopt"], "guide",
        "Where to Adopt", "Find Shelters",
        "Ready to adopt? Find reputable shelters and rescue organizations near {city}.",
        constraints={"species": ["dog", "cat"], "age_stage": None, "exclude_health_flags": [], "required_profile_fields": ["city"]},
        base_score=85, concierge_complexity="low"
    ),
    create_pick(
        "adopt_breed_match", "adopt", ["breed_match_adoption"], "guide",
        "Find Your Match", "Take Quiz",
        "Not sure which pet is right for you? Our matching quiz helps find your perfect companion.",
        base_score=80, concierge_complexity="medium"
    ),
    create_pick(
        "adopt_first_week", "adopt", ["first_week_plan"], "checklist",
        "First Week Checklist", "View List",
        "Just adopted {pet_name}? Here's your day-by-day guide for a smooth first week together.",
        base_score=90, concierge_complexity="low"
    ),
    create_pick(
        "adopt_home_setup", "adopt", ["home_setup_adoption"], "guide",
        "Home Setup Guide", "Prepare Home",
        "Make your home safe and welcoming for {pet_name}. Essential setup tips for new pet parents.",
        base_score=85, concierge_complexity="low"
    ),
    create_pick(
        "adopt_intro_pets", "adopt", ["introduce_to_pets"], "guide",
        "Introduce to Other Pets", "Read Guide",
        "Introducing {pet_name} to your existing pets? Here's how to do it safely and gradually.",
        base_score=80, concierge_complexity="medium"
    ),
    create_pick(
        "adopt_concierge", "adopt", ["post_adoption_support"], "concierge",
        "Adoption Support", "Get Help",
        "Need help settling {pet_name} in? Our adoption support team is here to guide you.",
        base_score=75, concierge_complexity="high"
    ),
])

# ==================== ADVISORY (6 picks) ====================

PICKS.extend([
    create_pick(
        "advisory_choose", "advisory", ["what_to_choose"], "guide",
        "Help Me Choose", "Get Advice",
        "Not sure what's best for {pet_name}? We'll help you compare options and make the right choice.",
        base_score=70, concierge_complexity="medium"
    ),
    create_pick(
        "advisory_compare", "advisory", ["pros_cons"], "guide",
        "Compare Options", "See Comparison",
        "Side-by-side comparison to help you decide what's best for {pet_name}.",
        base_score=70, concierge_complexity="medium"
    ),
    create_pick(
        "advisory_nutrition", "advisory", ["nutrition_consult"], "booking",
        "Nutrition Consultation", "Book Consult",
        "Get expert nutrition advice tailored to {pet_name}'s specific needs and health conditions.",
        service_vertical="vet_care", service_types=["online", "clinic"],
        base_score=75, concierge_complexity="medium"
    ),
    create_pick(
        "advisory_behaviour", "advisory", ["behaviour_expert"], "booking",
        "Behaviour Consultation", "Book Consult",
        "Address {pet_name}'s behaviour concerns with a certified animal behaviourist.",
        service_vertical="training", service_types=["online", "at_home"],
        base_score=75, concierge_complexity="medium"
    ),
    create_pick(
        "advisory_vet_first", "advisory", ["vet_first"], "guide",
        "Should I See a Vet?", "Check Now",
        "Unsure if {pet_name} needs to see a vet? This guide helps you decide when professional care is needed.",
        base_score=85, concierge_complexity="low"
    ),
    create_pick(
        "advisory_concierge", "advisory", ["escalation_required"], "concierge",
        "Expert Guidance", "Get Help",
        "Complex situation with {pet_name}? Our team can coordinate with specialists on your behalf.",
        base_score=70, concierge_complexity="high"
    ),
])

# ==================== PAPERWORK (6 picks) ====================

PICKS.extend([
    create_pick(
        "paperwork_vaccine_records", "paperwork", ["vaccination_records_doc"], "guide",
        "Get Vaccine Records", "Learn How",
        "Keep {pet_name}'s vaccination records organized and accessible for travel or boarding.",
        base_score=70, concierge_complexity="low"
    ),
    create_pick(
        "paperwork_microchip", "paperwork", ["microchip_docs"], "guide",
        "Microchip Registration", "Register Now",
        "Ensure {pet_name}'s microchip is registered with your current contact details for their safety.",
        base_score=75, concierge_complexity="low"
    ),
    create_pick(
        "paperwork_fit_to_fly", "paperwork", ["fit_to_fly_letters"], "guide",
        "Fit-to-Fly Letter", "Get Letter",
        "Planning to fly with {pet_name}? Here's how to get the required fit-to-fly certificate.",
        base_score=80, concierge_complexity="medium"
    ),
    create_pick(
        "paperwork_insurance", "paperwork", ["insurance_claim"], "guide",
        "Pet Insurance Guide", "Learn More",
        "Protect {pet_name} with the right insurance. Compare plans and understand coverage options.",
        base_score=65, concierge_complexity="medium"
    ),
    create_pick(
        "paperwork_document_vault", "paperwork", ["document_vault"], "guide",
        "Store Pet Documents", "Save Docs",
        "Keep all of {pet_name}'s important documents in one secure, accessible place.",
        base_score=60, concierge_complexity="low"
    ),
    create_pick(
        "paperwork_concierge", "paperwork", ["travel_permits"], "concierge",
        "Paperwork Assistance", "Get Help",
        "Need help with permits, certificates, or documentation for {pet_name}? We can assist.",
        base_score=70, concierge_complexity="high"
    ),
])

# ==================== EMERGENCY (6 picks) ====================

PICKS.extend([
    create_pick(
        "emergency_vet_now", "emergency", ["emergency_vet", "nearest_emergency"], "emergency",
        "Find Emergency Vet", "Call Now",
        "URGENT: Find the nearest 24-hour emergency vet for {pet_name}. Time is critical.",
        base_score=100, concierge_complexity="low", safety_level="emergency"
    ),
    create_pick(
        "emergency_poison", "emergency", ["poison_ingestion"], "emergency",
        "Poison Emergency", "Get Help Now",
        "URGENT: If {pet_name} ate something toxic, contact your nearest emergency vet immediately. Do not induce vomiting without vet guidance.",
        base_score=100, concierge_complexity="low", safety_level="emergency"
    ),
    create_pick(
        "emergency_choking", "emergency", ["choking"], "emergency",
        "Choking First Aid", "View Steps",
        "URGENT: {pet_name} may be choking. Here are immediate first aid steps while you contact the vet.",
        base_score=100, concierge_complexity="low", safety_level="emergency"
    ),
    create_pick(
        "emergency_breathing", "emergency", ["breathing_distress"], "emergency",
        "Breathing Emergency", "Get Help Now",
        "URGENT: {pet_name} is having trouble breathing. Rush to the nearest emergency vet immediately.",
        base_score=100, concierge_complexity="low", safety_level="emergency"
    ),
    create_pick(
        "emergency_heatstroke", "emergency", ["heatstroke"], "emergency",
        "Heatstroke Response", "View Steps",
        "URGENT: Signs of heatstroke in {pet_name}. Cool them down immediately while heading to the vet.",
        base_score=100, concierge_complexity="low", safety_level="emergency"
    ),
    create_pick(
        "emergency_concierge", "emergency", ["nearest_emergency", "emergency_vet"], "emergency",
        "Emergency Routing", "Get Help Now",
        "We can help locate the nearest emergency vet and provide routing for {pet_name}.",
        base_score=95, concierge_complexity="medium", safety_level="emergency"
    ),
])

# ==================== FAREWELL (4 picks) ====================

PICKS.extend([
    create_pick(
        "farewell_quality_life", "farewell", ["quality_of_life"], "guide",
        "Quality of Life Guide", "Read Guide",
        "Assessing {pet_name}'s quality of life is difficult. This guide helps you understand what to look for.",
        base_score=80, concierge_complexity="medium"
    ),
    create_pick(
        "farewell_memorial", "farewell", ["cremation_burial", "memorial_keepsakes"], "guide",
        "Memorial Options", "Explore",
        "Honor {pet_name}'s memory with meaningful memorial options - from cremation to keepsakes.",
        base_score=75, concierge_complexity="medium"
    ),
    create_pick(
        "farewell_grief_support", "farewell", ["grief_support"], "guide",
        "Grief Support Resources", "Get Support",
        "Losing {pet_name} is heartbreaking. Here are resources to help you through this difficult time.",
        base_score=80, concierge_complexity="low"
    ),
    create_pick(
        "farewell_concierge", "farewell", ["palliative_care", "euthanasia_support"], "concierge",
        "Compassionate Support", "Get Help",
        "We're here to support you and {pet_name} through this difficult time with compassionate guidance.",
        base_score=85, concierge_complexity="high"
    ),
])

# ============== SEED FUNCTION ==============

def seed_picks(db):
    """Idempotent upsert for picks catalogue."""
    collection = db["picks_catalogue"]
    operations = []
    
    for pick in PICKS:
        operations.append(
            UpdateOne(
                {"pick_id": pick["pick_id"]},
                {"$set": pick},
                upsert=True
            )
        )
    
    if operations:
        result = collection.bulk_write(operations)
        inserted = result.upserted_count
        modified = result.modified_count
        print(f"  picks_catalogue: {inserted} inserted, {modified} updated (total: {len(PICKS)})")
        return len(PICKS)
    return 0

def main():
    print("=" * 60)
    print("MIRA OS PICKS CATALOGUE SEEDER - Phase B1")
    print(f"seed_version: {SEED_VERSION}")
    print(f"source_doc_version: {SOURCE_DOC_VERSION}")
    print("=" * 60)
    
    # Connect to MongoDB
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Seed picks
    print("\n[1/1] Seeding picks_catalogue...")
    total = seed_picks(db)
    
    # Create indexes
    print("\n[Creating indexes...]")
    db.picks_catalogue.create_index("pick_id", unique=True)
    db.picks_catalogue.create_index("pillar")
    db.picks_catalogue.create_index("pick_type")
    db.picks_catalogue.create_index("safety_level")
    db.picks_catalogue.create_index("canonical_tags")
    db.picks_catalogue.create_index("service_vertical")
    db.picks_catalogue.create_index([("pillar", 1), ("pick_type", 1)])
    db.picks_catalogue.create_index([("pillar", 1), ("base_score", -1)])
    
    print("\n" + "=" * 60)
    print("SEED COMPLETE")
    print("=" * 60)
    print(f"\nseed_version: {SEED_VERSION}")
    print(f"total picks: {total}")
    
    # Distribution check
    print("\n" + "=" * 60)
    print("PILLAR DISTRIBUTION")
    print("=" * 60)
    pipeline = [
        {"$group": {"_id": "$pillar", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    pillar_counts = list(db.picks_catalogue.aggregate(pipeline))
    for p in pillar_counts:
        print(f"  {p['_id']}: {p['count']} picks")
    
    # Pick type distribution
    print("\n" + "=" * 60)
    print("PICK TYPE DISTRIBUTION")
    print("=" * 60)
    pipeline = [
        {"$group": {"_id": "$pick_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    type_counts = list(db.picks_catalogue.aggregate(pipeline))
    for t in type_counts:
        print(f"  {t['_id']}: {t['count']} picks")
    
    # Safety level distribution
    print("\n" + "=" * 60)
    print("SAFETY LEVEL DISTRIBUTION")
    print("=" * 60)
    pipeline = [
        {"$group": {"_id": "$safety_level", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    safety_counts = list(db.picks_catalogue.aggregate(pipeline))
    for s in safety_counts:
        print(f"  {s['_id']}: {s['count']} picks")
    
    # Sample picks
    print("\n" + "=" * 60)
    print("SAMPLE PICKS (3 pillars)")
    print("=" * 60)
    
    for pillar in ["emergency", "care", "celebrate"]:
        print(f"\n--- {pillar.upper()} ---")
        picks = list(db.picks_catalogue.find({"pillar": pillar}).limit(2))
        for pick in picks:
            print(f"  {pick['pick_id']}: {pick['title']}")
            print(f"    type: {pick['pick_type']}, cta: {pick['cta']}")
            print(f"    tags: {pick['canonical_tags']}")
            print(f"    base_score: {pick['base_score']}, safety: {pick['safety_level']}")
    
    print("\n" + "=" * 60)
    print("B1 SEEDING COMPLETE")
    print("=" * 60)
    
    client.close()

if __name__ == "__main__":
    main()
