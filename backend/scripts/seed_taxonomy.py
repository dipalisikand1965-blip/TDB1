#!/usr/bin/env python3
"""
MIRA OS Taxonomy Seeder - Phase B0
seed_version: 1.0.0
source_doc_version: Mira_OS_Taxonomy_Routing_Picks_Spec_v1_2

IDEMPOTENT: Safe to run multiple times - uses upsert pattern.

Collections created:
- canonical_tags
- tag_synonyms
- service_verticals
- service_vertical_synonyms
- service_types
- service_type_synonyms
"""

import os
import sys
from datetime import datetime, timezone
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

load_dotenv()

# Config
SEED_VERSION = "1.0.0"
SOURCE_DOC_VERSION = "Mira_OS_Taxonomy_Routing_Picks_Spec_v1_2"
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

# 13 Locked Pillars
PILLARS = [
    {"pillar": "care", "pillar_display": "Care", "description": "Physical wellbeing, grooming, preventive health (non-medical guidance only)"},
    {"pillar": "dine", "pillar_display": "Dine", "description": "Nutrition, feeding, diet"},
    {"pillar": "stay", "pillar_display": "Stay", "description": "Boarding, sitting, habitat, sleep"},
    {"pillar": "travel", "pillar_display": "Travel", "description": "Movement, transport, documentation"},
    {"pillar": "enjoy", "pillar_display": "Enjoy", "description": "Play, enrichment, social, outings"},
    {"pillar": "fit", "pillar_display": "Fit", "description": "Exercise, mobility, physical activity"},
    {"pillar": "learn", "pillar_display": "Learn", "description": "Training, education, behaviour shaping"},
    {"pillar": "celebrate", "pillar_display": "Celebrate", "description": "Milestones, events, memories"},
    {"pillar": "adopt", "pillar_display": "Adopt", "description": "Adoption, fostering, integration"},
    {"pillar": "advisory", "pillar_display": "Advisory", "description": "Expert guidance, second opinions"},
    {"pillar": "paperwork", "pillar_display": "Paperwork", "description": "Documents, certificates, compliance"},
    {"pillar": "emergency", "pillar_display": "Emergency", "description": "Acute risk, immediate response (HARD OVERRIDE)"},
    {"pillar": "farewell", "pillar_display": "Farewell", "description": "End-of-life, memorial, grief"},
]

def get_timestamp():
    return datetime.now(timezone.utc)

def create_tag(pillar, cluster, tag, tag_display, definition, safety_level="normal", priority="medium", applies_to="dog|cat"):
    return {
        "pillar": pillar,
        "pillar_display": pillar.title(),
        "cluster": cluster,
        "tag": tag,
        "tag_display": tag_display,
        "definition": definition,
        "applies_to": applies_to,
        "safety_level": safety_level,
        "is_emergency": safety_level == "emergency",
        "is_caution": safety_level == "caution",
        "priority": priority,
        "parent_tag": None,
        "deprecated": False,
        "replaced_by": None,
        "seed_version": SEED_VERSION,
        "source_doc_version": SOURCE_DOC_VERSION,
        "created_at": get_timestamp(),
    }

def create_synonym(synonym, tag, pillar, confidence=0.85, protected=False, notes=None):
    return {
        "synonym": synonym.lower(),
        "tag": tag,
        "pillar": pillar,
        "confidence": confidence,
        "protected": protected,
        "notes": notes,
        "deprecated": False,
        "replaced_by": None,
        "seed_version": SEED_VERSION,
        "source_doc_version": SOURCE_DOC_VERSION,
        "created_at": get_timestamp(),
    }

# ============== CANONICAL TAGS ==============

CANONICAL_TAGS = []

# EMERGENCY TAGS (12 tags) - HARD OVERRIDE
emergency_tags = [
    ("triage", "poison_ingestion", "Poison Ingestion", "Toxic substance consumed", "emergency", "critical"),
    ("triage", "choking", "Choking", "Active choking/airway blocked", "emergency", "critical"),
    ("triage", "breathing_distress", "Breathing Distress", "Difficulty breathing", "emergency", "critical"),
    ("triage", "seizure", "Seizure", "Active/recent seizure", "emergency", "critical"),
    ("triage", "collapse_unconscious", "Collapse/Unconscious", "Collapsed or unresponsive", "emergency", "critical"),
    ("triage", "severe_bleeding", "Severe Bleeding", "Uncontrolled bleeding", "emergency", "critical"),
    ("triage", "heatstroke", "Heatstroke", "Heat exhaustion signs", "emergency", "critical"),
    ("triage", "bloat_gdv", "Bloat (GDV)", "Bloat/gastric torsion suspected", "emergency", "critical"),
    ("triage", "trauma_accident", "Trauma/Accident", "Hit by vehicle, fall, injury", "emergency", "critical"),
    ("triage", "urinary_blockage", "Urinary Blockage", "Not urinating (esp. male cat)", "emergency", "critical"),
    ("response", "emergency_vet", "Emergency Vet", "Find 24hr vet", "emergency", "critical"),
    ("response", "nearest_emergency", "Nearest Emergency", "Closest emergency care", "emergency", "critical"),
]
for cluster, tag, display, defn, safety, priority in emergency_tags:
    CANONICAL_TAGS.append(create_tag("emergency", cluster, tag, display, defn, safety, priority))

# CARE TAGS (28 tags) - NON-MEDICAL GUIDANCE ONLY
care_tags = [
    ("grooming", "grooming", "Grooming", "Full grooming service coordination", "normal", "medium"),
    ("grooming", "bath", "Bath", "Bathing service coordination", "normal", "medium"),
    ("grooming", "haircut", "Haircut", "Hair/fur cutting coordination", "normal", "medium"),
    ("grooming", "nail_trim", "Nail Trim", "Nail clipping coordination", "normal", "medium"),
    ("grooming", "ear_cleaning", "Ear Cleaning", "Ear cleaning service coordination", "normal", "medium"),
    ("grooming", "dental_hygiene", "Dental Hygiene", "Teeth cleaning coordination (non-medical)", "normal", "medium"),
    ("grooming", "deshedding", "De-shedding", "Coat de-shedding coordination", "normal", "low"),
    ("grooming", "paw_care", "Paw Care", "Paw pad care coordination", "normal", "low"),
    ("grooming", "tick_bath", "Tick Bath", "Anti-tick treatment bath coordination", "normal", "medium"),
    ("preventive", "vaccination_schedule", "Vaccination Schedule", "Vaccine scheduling coordination", "normal", "high"),
    ("preventive", "deworming_schedule", "Deworming Schedule", "Deworming schedule coordination", "normal", "high"),
    ("preventive", "flea_tick_prevention", "Flea & Tick Prevention", "Parasite prevention coordination", "normal", "high"),
    ("wellness", "supplements_guidance", "Supplements Guidance", "Supplement guidance (not prescription)", "normal", "medium"),
    ("wellness", "weight_program_guidance", "Weight Program", "Weight management plan coordination", "normal", "medium"),
    ("wellness", "skin_coat_guidance", "Skin & Coat Guidance", "Skin/coat wellness coordination", "normal", "medium"),
    ("wellness", "joint_support_guidance", "Joint Support", "Joint support guidance (not treatment)", "normal", "medium"),
    ("routine", "hygiene_routine", "Hygiene Routine", "General hygiene maintenance guidance", "normal", "medium"),
    ("routine", "potty_guidance", "Potty Guidance", "House training guidance", "normal", "medium"),
    ("routine", "sleep_routine", "Sleep Routine", "Sleep pattern guidance", "normal", "low"),
    ("vet_coordination", "vet_appointment", "Vet Appointment", "Vet appointment coordination", "normal", "high"),
    ("vet_coordination", "specialist_coordination", "Specialist Coordination", "Route to specialist coordination", "normal", "high"),
    ("vet_coordination", "diagnostic_coordination", "Diagnostic Coordination", "Route to diagnostic services", "normal", "high"),
    ("caution_symptoms", "mild_vomiting", "Mild Vomiting", "Occasional vomiting - vet triage", "caution", "high"),
    ("caution_symptoms", "diarrhea", "Diarrhea", "Loose stools - vet triage", "caution", "high"),
    ("caution_symptoms", "lethargy", "Lethargy", "Unusual tiredness - vet triage", "caution", "high"),
    ("caution_symptoms", "loss_appetite", "Loss of Appetite", "Not eating normally - vet triage", "caution", "high"),
    ("caution_symptoms", "limping", "Limping", "Mobility issue - vet triage", "caution", "high"),
    ("caution_symptoms", "excessive_scratching", "Excessive Scratching", "Skin irritation - vet triage", "caution", "medium"),
    ("caution_symptoms", "eye_discharge", "Eye Discharge", "Eye issues - vet triage", "caution", "medium"),
    ("caution_symptoms", "ear_pain", "Ear Pain", "Ear discomfort - vet triage", "caution", "medium"),
]
for cluster, tag, display, defn, safety, priority in care_tags:
    CANONICAL_TAGS.append(create_tag("care", cluster, tag, display, defn, safety, priority))

# DINE TAGS (22 tags)
dine_tags = [
    ("food_types", "meals", "Meals", "Regular meal planning", "normal", "high"),
    ("food_types", "treats", "Treats", "Treat selection/guidance", "normal", "medium"),
    ("food_types", "chews", "Chews", "Chew products guidance", "normal", "medium"),
    ("food_types", "toppers", "Toppers", "Food toppers", "normal", "low"),
    ("food_types", "hydration", "Hydration", "Water/fluid intake", "normal", "medium"),
    ("diet_styles", "home_cooked", "Home Cooked", "Home-prepared meals", "normal", "medium"),
    ("diet_styles", "raw_diet", "Raw Diet", "Raw feeding guidance", "normal", "medium"),
    ("diet_styles", "grain_free", "Grain Free", "Grain-free diet", "normal", "medium"),
    ("diet_styles", "limited_ingredient", "Limited Ingredient", "LID guidance", "normal", "medium"),
    ("nutrition_goals", "weight_loss_diet", "Weight Loss Diet", "Diet for weight loss", "normal", "medium"),
    ("nutrition_goals", "weight_gain_diet", "Weight Gain Diet", "Diet for weight gain", "normal", "medium"),
    ("nutrition_goals", "puppy_nutrition", "Puppy Nutrition", "Puppy feeding guidance", "normal", "high"),
    ("nutrition_goals", "senior_nutrition", "Senior Nutrition", "Senior dog nutrition", "normal", "high"),
    ("health_diet", "sensitive_stomach", "Sensitive Stomach", "Digestive sensitivity", "normal", "high"),
    ("health_diet", "allergy_safe", "Allergy Safe", "Allergy-friendly diet", "normal", "high"),
    ("health_diet", "skin_coat_diet", "Skin & Coat Diet", "Diet for skin/coat", "normal", "medium"),
    ("behaviour_diet", "picky_eater", "Picky Eater", "Picky eating guidance", "normal", "medium"),
    ("behaviour_diet", "food_transition", "Food Transition", "Diet transition plan", "normal", "medium"),
    ("behaviour_diet", "appetite_support", "Appetite Support", "Appetite improvement", "normal", "medium"),
    ("safety", "toxic_avoidance", "Toxic Avoidance", "Foods to avoid", "normal", "critical"),
    ("safety", "label_guidance", "Label Guidance", "Ingredient screening guidance", "normal", "medium"),
    ("ordering", "subscription_food", "Food Subscription", "Recurring food delivery", "normal", "low"),
]
for cluster, tag, display, defn, safety, priority in dine_tags:
    CANONICAL_TAGS.append(create_tag("dine", cluster, tag, display, defn, safety, priority))

# STAY TAGS (20 tags)
stay_tags = [
    ("boarding", "kennel", "Kennel", "Kennel boarding", "normal", "high"),
    ("boarding", "premium_boarding", "Premium Boarding", "Luxury boarding", "normal", "medium"),
    ("boarding", "cage_free", "Cage Free", "Cage-free boarding", "normal", "medium"),
    ("boarding", "vet_boarding", "Vet Boarding", "Medical boarding", "normal", "high"),
    ("boarding", "senior_boarding", "Senior Boarding", "Senior-friendly boarding", "normal", "high"),
    ("boarding", "puppy_boarding", "Puppy Boarding", "Puppy-safe boarding", "normal", "high"),
    ("daycare", "daycare", "Daycare", "Daytime daycare", "normal", "high"),
    ("at_home", "pet_sitting", "Pet Sitting", "In-home sitting", "normal", "high"),
    ("at_home", "overnight_sitter", "Overnight Sitter", "Overnight home sitting", "normal", "high"),
    ("at_home", "drop_in_visits", "Drop-in Visits", "Check-in visits", "normal", "medium"),
    ("at_home", "house_sitting", "House Sitting", "Full house sitting", "normal", "medium"),
    ("comfort", "separation_anxiety_stay", "Separation Anxiety", "Anxiety-aware boarding", "normal", "high"),
    ("comfort", "routine_matching", "Routine Matching", "Routine-matched care", "normal", "medium"),
    ("comfort", "senior_friendly_stay", "Senior Friendly", "Senior accommodations", "normal", "high"),
    ("comfort", "puppy_safe_stay", "Puppy Safe", "Puppy-safe environment", "normal", "high"),
    ("comfort", "multi_pet_stay", "Multi-Pet Stay", "Multiple pet boarding", "normal", "medium"),
    ("trust", "trial_night", "Trial Night", "Trial boarding", "normal", "medium"),
    ("trust", "daily_updates", "Daily Updates", "Photo/video updates", "normal", "medium"),
    ("trust", "webcam_access", "Webcam Access", "Live camera access", "normal", "low"),
    ("logistics", "pickup_drop", "Pickup & Drop", "Transport to/from", "normal", "medium"),
]
for cluster, tag, display, defn, safety, priority in stay_tags:
    CANONICAL_TAGS.append(create_tag("stay", cluster, tag, display, defn, safety, priority))

# TRAVEL TAGS (22 tags)
travel_tags = [
    ("mode", "car_travel", "Car Travel", "Road travel guidance", "normal", "medium"),
    ("mode", "train_travel", "Train Travel", "Train travel guidance", "normal", "medium"),
    ("mode", "air_travel", "Air Travel", "Flight travel guidance", "normal", "high"),
    ("mode", "international_travel", "International Travel", "Cross-border travel", "normal", "high"),
    ("docs", "vaccination_records", "Vaccination Records", "Vaccine documentation", "normal", "high"),
    ("docs", "health_certificate", "Health Certificate", "Health cert for travel", "normal", "high"),
    ("docs", "fit_to_fly", "Fit to Fly", "Flight fitness cert", "normal", "high"),
    ("docs", "import_export", "Import/Export", "Country regulations", "normal", "high"),
    ("docs", "pet_passport", "Pet Passport", "Passport documentation", "normal", "high"),
    ("carrier", "crate_selection", "Crate Selection", "Travel crate guidance", "normal", "medium"),
    ("carrier", "crate_training", "Crate Training", "Crate comfort training", "normal", "medium"),
    ("carrier", "airline_policy", "Airline Policy", "Airline rules lookup", "normal", "high"),
    ("carrier", "cargo_vs_cabin", "Cargo vs Cabin", "Flight placement", "normal", "high"),
    ("comfort", "motion_sickness", "Motion Sickness", "Travel sickness support", "normal", "medium"),
    ("comfort", "anxiety_travel", "Travel Anxiety", "Travel stress support", "normal", "medium"),
    ("comfort", "temperature_risk", "Temperature Risk", "Heat/cold travel risk", "caution", "high"),
    ("routing", "pet_friendly_routes", "Pet-Friendly Routes", "Route planning", "normal", "medium"),
    ("routing", "pit_stops", "Pit Stops", "Rest stop planning", "normal", "medium"),
    ("routing", "destination_stays", "Destination Stays", "Pet-friendly stays", "normal", "medium"),
    ("transport", "pet_taxi", "Pet Taxi", "Pet taxi booking", "normal", "high"),
    ("transport", "airport_transfer", "Airport Transfer", "Airport transport", "normal", "high"),
    ("operational", "travel_kit", "Travel Kit", "Packing checklist", "normal", "medium"),
]
for cluster, tag, display, defn, safety, priority in travel_tags:
    CANONICAL_TAGS.append(create_tag("travel", cluster, tag, display, defn, safety, priority))

# ENJOY TAGS (18 tags)
enjoy_tags = [
    ("outdoors", "parks", "Parks", "Park recommendations", "normal", "medium"),
    ("outdoors", "dog_parks", "Dog Parks", "Off-leash dog parks", "normal", "medium"),
    ("outdoors", "hikes", "Hikes", "Pet-friendly hikes", "normal", "medium"),
    ("outdoors", "beaches", "Beaches", "Pet-friendly beaches", "normal", "medium"),
    ("outdoors", "picnic", "Picnic", "Outdoor picnic spots", "normal", "low"),
    ("social", "playdates", "Playdates", "Arrange playdates", "normal", "medium"),
    ("social", "pet_meetups", "Pet Meetups", "Community meetups", "normal", "medium"),
    ("social", "temperament_matching", "Temperament Matching", "Play partner matching", "normal", "medium"),
    ("experiences", "cafes", "Pet Cafes", "Pet-friendly cafes", "normal", "medium"),
    ("experiences", "pet_friendly_restaurants", "Pet Restaurants", "Pet-friendly dining", "normal", "medium"),
    ("experiences", "weekend_getaway", "Weekend Getaway", "Short trip planning", "normal", "medium"),
    ("enrichment", "toys", "Toys", "Toy recommendations", "normal", "medium"),
    ("enrichment", "enrichment_games", "Enrichment Games", "Mental stimulation", "normal", "medium"),
    ("enrichment", "puzzle_feeders", "Puzzle Feeders", "Puzzle toy guidance", "normal", "medium"),
    ("enrichment", "sniff_work", "Sniff Work", "Nose work activities", "normal", "medium"),
    ("calm", "soothing_rituals", "Soothing Rituals", "Calming activities", "normal", "medium"),
    ("calm", "noise_phobia_support", "Noise Phobia", "Noise anxiety support", "normal", "high"),
    ("calm", "separation_anxiety_play", "Separation Anxiety", "Anxiety through play", "normal", "high"),
]
for cluster, tag, display, defn, safety, priority in enjoy_tags:
    CANONICAL_TAGS.append(create_tag("enjoy", cluster, tag, display, defn, safety, priority))

# FIT TAGS (16 tags)
fit_tags = [
    ("movement", "daily_walks", "Daily Walks", "Walk scheduling", "normal", "high"),
    ("movement", "stamina_build", "Stamina Building", "Endurance training", "normal", "medium"),
    ("movement", "weight_management_activity", "Weight Activity", "Exercise for weight", "normal", "medium"),
    ("movement", "senior_mobility", "Senior Mobility", "Senior exercise", "normal", "high"),
    ("movement", "puppy_energy", "Puppy Energy", "Puppy exercise plan", "normal", "high"),
    ("training", "basic_obedience", "Basic Obedience", "Obedience training", "normal", "high"),
    ("training", "leash_training", "Leash Training", "Leash manners", "normal", "high"),
    ("training", "recall", "Recall", "Come command", "normal", "high"),
    ("training", "socialisation", "Socialisation", "Social training", "normal", "high"),
    ("training", "reactivity", "Reactivity", "Reactive dog training", "normal", "high"),
    ("sports", "agility", "Agility", "Agility training", "normal", "medium"),
    ("sports", "swimming", "Swimming", "Swim exercise", "normal", "medium"),
    ("sports", "fetch_program", "Fetch Program", "Fetch training", "normal", "low"),
    ("tracking", "activity_tracking", "Activity Tracking", "Activity monitoring", "normal", "medium"),
    ("tracking", "progress_plan", "Progress Plan", "Fitness plan", "normal", "medium"),
    ("gear", "harnesses", "Harnesses", "Harness guidance", "normal", "medium"),
]
for cluster, tag, display, defn, safety, priority in fit_tags:
    CANONICAL_TAGS.append(create_tag("fit", cluster, tag, display, defn, safety, priority))

# LEARN TAGS (15 tags)
learn_tags = [
    ("guides", "new_pet_parenting", "New Pet Parenting", "First-time owner guide", "normal", "high"),
    ("guides", "breed_guide", "Breed Guide", "Breed-specific guidance", "normal", "medium"),
    ("guides", "nutrition_education", "Nutrition Education", "Food label education", "normal", "high"),
    ("guides", "training_basics_education", "Training Basics", "Training fundamentals", "normal", "high"),
    ("guides", "socialisation_education", "Socialisation Education", "Social training guide", "normal", "high"),
    ("guides", "health_preventive_education", "Preventive Health", "Vaccine/health guide", "normal", "high"),
    ("guides", "first_aid_education", "First Aid Basics", "First aid knowledge", "normal", "high"),
    ("classes", "trainer_class", "Trainer Class", "Book trainer session", "normal", "medium"),
    ("classes", "webinar_workshop", "Webinar/Workshop", "Online learning", "normal", "low"),
    ("content", "video_library", "Video Library", "Curated videos", "normal", "medium"),
    ("content", "checklists", "Checklists", "Printable checklists", "normal", "high"),
    ("content", "breed_content", "Breed Content", "Breed-specific content", "normal", "medium"),
    ("support", "qa_with_expert", "Q&A Expert", "Expert Q&A", "normal", "high"),
    ("support", "behaviour_guidance", "Behaviour Guidance", "Behaviour guidance (non-clinical)", "normal", "high"),
    ("support", "puppy_101", "Puppy 101", "Puppy basics course", "normal", "high"),
]
for cluster, tag, display, defn, safety, priority in learn_tags:
    CANONICAL_TAGS.append(create_tag("learn", cluster, tag, display, defn, safety, priority))

# CELEBRATE TAGS (18 tags)
celebrate_tags = [
    ("occasions", "birthday", "Birthday", "Birthday celebration", "normal", "high"),
    ("occasions", "gotcha_day", "Gotcha Day", "Adoption anniversary", "normal", "high"),
    ("occasions", "adoption_day", "Adoption Day", "Adoption celebration", "normal", "high"),
    ("occasions", "new_pet_welcome", "New Pet Welcome", "Welcome celebration", "normal", "high"),
    ("occasions", "puppy_milestone", "Puppy Milestone", "Puppy achievements", "normal", "medium"),
    ("occasions", "senior_milestone", "Senior Milestone", "Senior celebrations", "normal", "medium"),
    ("occasions", "recovery_milestone", "Recovery Milestone", "Health recovery", "normal", "medium"),
    ("experiences", "pawty", "Pawty", "Pet party planning", "normal", "medium"),
    ("experiences", "photo_shoot", "Photo Shoot", "Pet photography", "normal", "medium"),
    ("experiences", "themed_setup", "Themed Setup", "Party theming", "normal", "low"),
    ("experiences", "hosted_event", "Hosted Event", "Event coordination", "normal", "medium"),
    ("gifting", "cakes", "Cakes", "Pet-safe cakes", "normal", "medium"),
    ("gifting", "treats_box", "Treats Box", "Treat hampers", "normal", "medium"),
    ("gifting", "personalised_hamper", "Personalised Hamper", "Custom gift box", "normal", "medium"),
    ("gifting", "toys_gifts", "Toys & Gifts", "Gift recommendations", "normal", "medium"),
    ("memories", "paw_print", "Paw Print", "Paw print keepsake", "normal", "medium"),
    ("memories", "custom_portrait", "Custom Portrait", "Pet portrait art", "normal", "low"),
    ("memories", "tribute_video", "Tribute Video", "Memory video", "normal", "medium"),
]
for cluster, tag, display, defn, safety, priority in celebrate_tags:
    CANONICAL_TAGS.append(create_tag("celebrate", cluster, tag, display, defn, safety, priority))

# ADOPT TAGS (12 tags)
adopt_tags = [
    ("discovery", "where_to_adopt", "Where to Adopt", "Find shelters/rescues", "normal", "high"),
    ("discovery", "breed_match_adoption", "Breed Match", "Lifestyle matching", "normal", "high"),
    ("screening", "rescue_screening", "Rescue Screening", "Shelter evaluation", "normal", "high"),
    ("screening", "health_check_pre_adopt", "Pre-Adopt Health", "Health screening coordination", "normal", "high"),
    ("process", "adoption_paperwork", "Adoption Paperwork", "Documentation", "normal", "high"),
    ("onboarding", "home_setup_adoption", "Home Setup", "Prepare home", "normal", "high"),
    ("onboarding", "first_week_plan", "First Week Plan", "Day-by-day plan", "normal", "high"),
    ("integration", "introduce_to_family", "Introduce to Family", "Family introductions", "normal", "medium"),
    ("integration", "introduce_to_pets", "Introduce to Pets", "Pet introductions", "normal", "high"),
    ("support", "post_adoption_support", "Post-Adopt Support", "Settling-in support", "normal", "high"),
    ("support", "foster_to_adopt", "Foster to Adopt", "Trial adoption", "normal", "medium"),
    ("ethics", "ethical_adoption", "Ethical Adoption", "Avoid puppy mills", "normal", "high"),
]
for cluster, tag, display, defn, safety, priority in adopt_tags:
    CANONICAL_TAGS.append(create_tag("adopt", cluster, tag, display, defn, safety, priority))

# ADVISORY TAGS (10 tags)
advisory_tags = [
    ("decision", "what_to_choose", "What to Choose", "Decision support", "normal", "medium"),
    ("decision", "pros_cons", "Pros & Cons", "Option comparison", "normal", "medium"),
    ("decision", "safest_option", "Safest Option", "Safety-first advice", "normal", "high"),
    ("decision", "best_value", "Best Value", "Value optimization", "normal", "medium"),
    ("decision", "timeline_planning", "Timeline Planning", "Schedule planning", "normal", "medium"),
    ("ethical", "welfare_first", "Welfare First", "Pet welfare guidance", "normal", "high"),
    ("ethical", "vet_first", "Vet First", "Route to vet advice", "normal", "high"),
    ("ethical", "escalation_required", "Escalation Required", "Needs professional", "normal", "high"),
    ("expert", "nutrition_consult", "Nutrition Consult", "Expert nutrition guidance", "normal", "high"),
    ("expert", "behaviour_expert", "Behaviour Expert", "Expert behaviour guidance", "normal", "high"),
]
for cluster, tag, display, defn, safety, priority in advisory_tags:
    CANONICAL_TAGS.append(create_tag("advisory", cluster, tag, display, defn, safety, priority))

# PAPERWORK TAGS (12 tags)
paperwork_tags = [
    ("pet_docs", "vaccination_records_doc", "Vaccination Records", "Vaccine paperwork", "normal", "high"),
    ("pet_docs", "microchip_docs", "Microchip Docs", "Microchip registration", "normal", "high"),
    ("pet_docs", "licence_docs", "License Docs", "Pet licensing", "normal", "medium"),
    ("pet_docs", "health_certificate_doc", "Health Certificate", "Health documentation", "normal", "high"),
    ("pet_docs", "travel_permits", "Travel Permits", "Travel documentation", "normal", "high"),
    ("claims", "insurance_claim", "Insurance Claim", "Insurance paperwork", "normal", "medium"),
    ("claims", "vet_letters", "Vet Letters", "Vet documentation", "normal", "medium"),
    ("claims", "fit_to_fly_letters", "Fit to Fly Letter", "Flight certification", "normal", "high"),
    ("claims", "boarding_forms", "Boarding Forms", "Boarding paperwork", "normal", "medium"),
    ("storage", "document_vault", "Document Vault", "Document storage", "normal", "medium"),
    ("storage", "shareable_pack", "Shareable Pack", "Document sharing", "normal", "low"),
    ("storage", "expiry_tracking", "Expiry Tracking", "Document expiry alerts", "normal", "medium"),
]
for cluster, tag, display, defn, safety, priority in paperwork_tags:
    CANONICAL_TAGS.append(create_tag("paperwork", cluster, tag, display, defn, safety, priority))

# FAREWELL TAGS (10 tags)
farewell_tags = [
    ("quality_of_life", "quality_of_life", "Quality of Life", "Comfort assessment", "normal", "critical"),
    ("palliative", "palliative_care", "Palliative Care", "Comfort care planning", "normal", "critical"),
    ("palliative", "pain_management", "Pain Management", "Pain control coordination", "normal", "critical"),
    ("decisions", "euthanasia_support", "Euthanasia Support", "End-of-life guidance", "normal", "critical"),
    ("aftercare", "cremation_burial", "Cremation/Burial", "Aftercare options", "normal", "high"),
    ("aftercare", "memorial_keepsakes", "Memorial Keepsakes", "Memory items", "normal", "high"),
    ("aftercare", "tribute_media", "Tribute Media", "Tribute video/photos", "normal", "medium"),
    ("support", "grief_support", "Grief Support", "Pet parent support", "normal", "high"),
    ("support", "children_support", "Children Support", "Explain to children", "normal", "high"),
    ("planning", "farewell_ritual", "Farewell Ritual", "Goodbye ceremony", "normal", "medium"),
]
for cluster, tag, display, defn, safety, priority in farewell_tags:
    CANONICAL_TAGS.append(create_tag("farewell", cluster, tag, display, defn, safety, priority))

# ============== TAG SYNONYMS ==============

TAG_SYNONYMS = []

# EMERGENCY SYNONYMS (Protected = True)
emergency_synonyms = [
    # poison_ingestion (30)
    ("ate poison", "poison_ingestion", "emergency", 0.95, True),
    ("ate chocolate", "poison_ingestion", "emergency", 0.95, True),
    ("ate grapes", "poison_ingestion", "emergency", 0.95, True),
    ("ate raisins", "poison_ingestion", "emergency", 0.95, True),
    ("ate onion", "poison_ingestion", "emergency", 0.95, True),
    ("ate garlic", "poison_ingestion", "emergency", 0.95, True),
    ("ate xylitol", "poison_ingestion", "emergency", 0.95, True),
    ("ate avocado", "poison_ingestion", "emergency", 0.90, True),
    ("ate macadamia", "poison_ingestion", "emergency", 0.95, True),
    ("swallowed something", "poison_ingestion", "emergency", 0.85, True),
    ("swallowed pill", "poison_ingestion", "emergency", 0.90, True),
    ("swallowed medicine", "poison_ingestion", "emergency", 0.90, True),
    ("toxic", "poison_ingestion", "emergency", 0.90, True),
    ("poisoned", "poison_ingestion", "emergency", 0.95, True),
    ("poison", "poison_ingestion", "emergency", 0.95, True),
    ("ate rat poison", "poison_ingestion", "emergency", 0.95, True),
    ("ate antifreeze", "poison_ingestion", "emergency", 0.95, True),
    ("ate cleaning product", "poison_ingestion", "emergency", 0.95, True),
    ("ate fertilizer", "poison_ingestion", "emergency", 0.95, True),
    ("ate plant", "poison_ingestion", "emergency", 0.80, True),
    ("ate lily", "poison_ingestion", "emergency", 0.95, True),
    ("ate mushroom", "poison_ingestion", "emergency", 0.90, True),
    ("drank something bad", "poison_ingestion", "emergency", 0.85, True),
    ("licked chemical", "poison_ingestion", "emergency", 0.90, True),
    ("ingested", "poison_ingestion", "emergency", 0.80, True),
    ("consumed toxic", "poison_ingestion", "emergency", 0.95, True),
    ("ate medication", "poison_ingestion", "emergency", 0.90, True),
    ("got into trash", "poison_ingestion", "emergency", 0.70, False),
    ("ate human food", "poison_ingestion", "emergency", 0.70, False),
    ("found eating", "poison_ingestion", "emergency", 0.70, False),
    # choking (20)
    ("choking", "choking", "emergency", 0.95, True),
    ("can't swallow", "choking", "emergency", 0.90, True),
    ("something stuck throat", "choking", "emergency", 0.95, True),
    ("gagging", "choking", "emergency", 0.85, True),
    ("throat blocked", "choking", "emergency", 0.95, True),
    ("swallowed bone", "choking", "emergency", 0.90, True),
    ("bone stuck", "choking", "emergency", 0.95, True),
    ("toy stuck", "choking", "emergency", 0.95, True),
    ("can't breathe food", "choking", "emergency", 0.95, True),
    ("pawing at mouth", "choking", "emergency", 0.85, True),
    ("drooling excessively", "choking", "emergency", 0.75, True),
    ("retching", "choking", "emergency", 0.80, True),
    ("trying to vomit", "choking", "emergency", 0.75, True),
    ("blue gums choking", "choking", "emergency", 0.90, True),
    ("struggling to swallow", "choking", "emergency", 0.90, True),
    ("food stuck", "choking", "emergency", 0.85, True),
    ("inhaled something", "choking", "emergency", 0.85, True),
    ("airway blocked", "choking", "emergency", 0.95, True),
    ("can't get air", "choking", "emergency", 0.90, True),
    ("coughing up blood", "choking", "emergency", 0.90, True),
    # breathing_distress (25)
    ("can't breathe", "breathing_distress", "emergency", 0.95, True),
    ("difficulty breathing", "breathing_distress", "emergency", 0.95, True),
    ("struggling to breathe", "breathing_distress", "emergency", 0.95, True),
    ("gasping", "breathing_distress", "emergency", 0.90, True),
    ("gasping for air", "breathing_distress", "emergency", 0.95, True),
    ("labored breathing", "breathing_distress", "emergency", 0.90, True),
    ("heavy breathing", "breathing_distress", "emergency", 0.80, True),
    ("rapid breathing", "breathing_distress", "emergency", 0.80, True),
    ("wheezing", "breathing_distress", "emergency", 0.85, True),
    ("blue tongue", "breathing_distress", "emergency", 0.95, True),
    ("blue gums", "breathing_distress", "emergency", 0.90, True),
    ("cyanotic", "breathing_distress", "emergency", 0.95, True),
    ("not breathing properly", "breathing_distress", "emergency", 0.90, True),
    ("breathing weird", "breathing_distress", "emergency", 0.80, True),
    ("panting heavily", "breathing_distress", "emergency", 0.75, True),
    ("can't catch breath", "breathing_distress", "emergency", 0.90, True),
    ("suffocating", "breathing_distress", "emergency", 0.95, True),
    ("respiratory distress", "breathing_distress", "emergency", 0.95, True),
    ("chest heaving", "breathing_distress", "emergency", 0.85, True),
    ("open mouth breathing", "breathing_distress", "emergency", 0.80, True),
    ("neck extended breathing", "breathing_distress", "emergency", 0.75, True),
    ("nostril flaring", "breathing_distress", "emergency", 0.80, True),
    ("stopped breathing", "breathing_distress", "emergency", 0.95, True),
    ("breathing stopped", "breathing_distress", "emergency", 0.95, True),
    ("not breathing", "breathing_distress", "emergency", 0.95, True),
    # seizure (20)
    ("seizure", "seizure", "emergency", 0.95, True),
    ("seizures", "seizure", "emergency", 0.95, True),
    ("having a fit", "seizure", "emergency", 0.95, True),
    ("fitting", "seizure", "emergency", 0.90, True),
    ("convulsing", "seizure", "emergency", 0.95, True),
    ("convulsions", "seizure", "emergency", 0.95, True),
    ("shaking uncontrollably", "seizure", "emergency", 0.90, True),
    ("twitching", "seizure", "emergency", 0.80, True),
    ("jerking", "seizure", "emergency", 0.85, True),
    ("spasms", "seizure", "emergency", 0.85, True),
    ("epileptic fit", "seizure", "emergency", 0.95, True),
    ("foaming mouth", "seizure", "emergency", 0.85, True),
    ("paddling legs", "seizure", "emergency", 0.85, True),
    ("stiff body shaking", "seizure", "emergency", 0.90, True),
    ("eyes rolling", "seizure", "emergency", 0.80, True),
    ("lost control body", "seizure", "emergency", 0.85, True),
    ("involuntary movements", "seizure", "emergency", 0.85, True),
    ("grand mal", "seizure", "emergency", 0.95, True),
    ("petit mal", "seizure", "emergency", 0.90, True),
    ("epilepsy attack", "seizure", "emergency", 0.95, True),
    # collapse_unconscious (20)
    ("collapsed", "collapse_unconscious", "emergency", 0.95, True),
    ("collapse", "collapse_unconscious", "emergency", 0.95, True),
    ("fainted", "collapse_unconscious", "emergency", 0.95, True),
    ("unconscious", "collapse_unconscious", "emergency", 0.95, True),
    ("not responding", "collapse_unconscious", "emergency", 0.90, True),
    ("unresponsive", "collapse_unconscious", "emergency", 0.95, True),
    ("won't wake up", "collapse_unconscious", "emergency", 0.95, True),
    ("passed out", "collapse_unconscious", "emergency", 0.95, True),
    ("fell down not moving", "collapse_unconscious", "emergency", 0.90, True),
    ("limp", "collapse_unconscious", "emergency", 0.85, True),
    ("not moving", "collapse_unconscious", "emergency", 0.85, True),
    ("lying still", "collapse_unconscious", "emergency", 0.80, True),
    ("can't stand", "collapse_unconscious", "emergency", 0.80, True),
    ("legs gave out", "collapse_unconscious", "emergency", 0.85, True),
    ("sudden weakness", "collapse_unconscious", "emergency", 0.80, True),
    ("dropped suddenly", "collapse_unconscious", "emergency", 0.90, True),
    ("knocked out", "collapse_unconscious", "emergency", 0.90, True),
    ("eyes closed not responding", "collapse_unconscious", "emergency", 0.90, True),
    ("lifeless", "collapse_unconscious", "emergency", 0.90, True),
    ("comatose", "collapse_unconscious", "emergency", 0.95, True),
    # severe_bleeding (15)
    ("bleeding heavily", "severe_bleeding", "emergency", 0.95, True),
    ("won't stop bleeding", "severe_bleeding", "emergency", 0.95, True),
    ("blood everywhere", "severe_bleeding", "emergency", 0.95, True),
    ("severe bleeding", "severe_bleeding", "emergency", 0.95, True),
    ("profuse bleeding", "severe_bleeding", "emergency", 0.95, True),
    ("blood gushing", "severe_bleeding", "emergency", 0.95, True),
    ("hemorrhaging", "severe_bleeding", "emergency", 0.95, True),
    ("massive blood loss", "severe_bleeding", "emergency", 0.95, True),
    ("arterial bleeding", "severe_bleeding", "emergency", 0.95, True),
    ("bleeding out", "severe_bleeding", "emergency", 0.95, True),
    ("lost lot of blood", "severe_bleeding", "emergency", 0.90, True),
    ("wound bleeding badly", "severe_bleeding", "emergency", 0.90, True),
    ("deep cut bleeding", "severe_bleeding", "emergency", 0.85, True),
    ("blood spurting", "severe_bleeding", "emergency", 0.95, True),
    ("can't stop blood", "severe_bleeding", "emergency", 0.90, True),
    # heatstroke (20)
    ("heatstroke", "heatstroke", "emergency", 0.95, True),
    ("heat stroke", "heatstroke", "emergency", 0.95, True),
    ("overheating", "heatstroke", "emergency", 0.85, True),
    ("too hot", "heatstroke", "emergency", 0.75, True),
    ("heat exhaustion", "heatstroke", "emergency", 0.95, True),
    ("panting excessively heat", "heatstroke", "emergency", 0.80, True),
    ("drooling heavily hot", "heatstroke", "emergency", 0.85, True),
    ("left in car", "heatstroke", "emergency", 0.90, True),
    ("collapsed heat", "heatstroke", "emergency", 0.95, True),
    ("bright red tongue", "heatstroke", "emergency", 0.85, True),
    ("sticky gums", "heatstroke", "emergency", 0.80, True),
    ("wobbly from heat", "heatstroke", "emergency", 0.85, True),
    ("vomiting from heat", "heatstroke", "emergency", 0.85, True),
    ("diarrhea from heat", "heatstroke", "emergency", 0.85, True),
    ("disoriented heat", "heatstroke", "emergency", 0.85, True),
    ("very hot body", "heatstroke", "emergency", 0.80, True),
    ("burning up", "heatstroke", "emergency", 0.80, True),
    ("hyperthermia", "heatstroke", "emergency", 0.95, True),
    ("summer heat emergency", "heatstroke", "emergency", 0.85, True),
    ("hot weather collapse", "heatstroke", "emergency", 0.90, True),
    # bloat_gdv (15)
    ("bloat", "bloat_gdv", "emergency", 0.90, True),
    ("bloated stomach", "bloat_gdv", "emergency", 0.95, True),
    ("stomach twisted", "bloat_gdv", "emergency", 0.95, True),
    ("gdv", "bloat_gdv", "emergency", 0.95, True),
    ("gastric torsion", "bloat_gdv", "emergency", 0.95, True),
    ("swollen belly hard", "bloat_gdv", "emergency", 0.90, True),
    ("distended abdomen", "bloat_gdv", "emergency", 0.90, True),
    ("trying to vomit nothing", "bloat_gdv", "emergency", 0.90, True),
    ("retching no vomit", "bloat_gdv", "emergency", 0.90, True),
    ("restless pacing drooling", "bloat_gdv", "emergency", 0.85, True),
    ("stomach looks big", "bloat_gdv", "emergency", 0.80, True),
    ("abdomen tight", "bloat_gdv", "emergency", 0.85, True),
    ("belly swelling", "bloat_gdv", "emergency", 0.85, True),
    ("stomach distension", "bloat_gdv", "emergency", 0.90, True),
    ("ate and stomach huge", "bloat_gdv", "emergency", 0.85, True),
    # trauma_accident (20)
    ("hit by car", "trauma_accident", "emergency", 0.95, True),
    ("hit by vehicle", "trauma_accident", "emergency", 0.95, True),
    ("run over", "trauma_accident", "emergency", 0.95, True),
    ("accident", "trauma_accident", "emergency", 0.80, True),
    ("fell from height", "trauma_accident", "emergency", 0.95, True),
    ("fell off balcony", "trauma_accident", "emergency", 0.95, True),
    ("fell down stairs", "trauma_accident", "emergency", 0.85, True),
    ("got hit", "trauma_accident", "emergency", 0.85, True),
    ("injured badly", "trauma_accident", "emergency", 0.85, True),
    ("trauma", "trauma_accident", "emergency", 0.90, True),
    ("severe injury", "trauma_accident", "emergency", 0.90, True),
    ("crushed", "trauma_accident", "emergency", 0.95, True),
    ("kicked by horse", "trauma_accident", "emergency", 0.90, True),
    ("attacked by animal", "trauma_accident", "emergency", 0.90, True),
    ("dog fight injury", "trauma_accident", "emergency", 0.85, True),
    ("bite wound deep", "trauma_accident", "emergency", 0.85, True),
    ("broken bone", "trauma_accident", "emergency", 0.85, True),
    ("fractured", "trauma_accident", "emergency", 0.90, True),
    ("head injury", "trauma_accident", "emergency", 0.95, True),
    ("internal injury", "trauma_accident", "emergency", 0.90, True),
    # urinary_blockage (15)
    ("not urinating", "urinary_blockage", "emergency", 0.90, True),
    ("can't pee", "urinary_blockage", "emergency", 0.95, True),
    ("can't urinate", "urinary_blockage", "emergency", 0.95, True),
    ("straining to pee", "urinary_blockage", "emergency", 0.90, True),
    ("blocked cat", "urinary_blockage", "emergency", 0.95, True),
    ("urinary block", "urinary_blockage", "emergency", 0.95, True),
    ("hasn't peed", "urinary_blockage", "emergency", 0.85, True),
    ("no urine", "urinary_blockage", "emergency", 0.90, True),
    ("crying in litter box", "urinary_blockage", "emergency", 0.90, True),
    ("male cat straining", "urinary_blockage", "emergency", 0.95, True),
    ("licking genitals crying", "urinary_blockage", "emergency", 0.85, True),
    ("bladder blocked", "urinary_blockage", "emergency", 0.95, True),
    ("urethral blockage", "urinary_blockage", "emergency", 0.95, True),
    ("trying to pee nothing", "urinary_blockage", "emergency", 0.90, True),
    ("painful urination", "urinary_blockage", "emergency", 0.85, True),
    # emergency_vet (15)
    ("emergency", "emergency_vet", "emergency", 0.90, True),
    ("emergency vet", "emergency_vet", "emergency", 0.95, True),
    ("24 hour vet", "emergency_vet", "emergency", 0.95, True),
    ("vet er", "emergency_vet", "emergency", 0.95, True),
    ("animal er", "emergency_vet", "emergency", 0.95, True),
    ("urgent vet", "emergency_vet", "emergency", 0.90, True),
    ("vet now", "emergency_vet", "emergency", 0.85, True),
    ("need vet immediately", "emergency_vet", "emergency", 0.95, True),
    ("closest vet", "emergency_vet", "emergency", 0.80, True),
    ("nearest vet", "emergency_vet", "emergency", 0.80, True),
    ("vet asap", "emergency_vet", "emergency", 0.90, True),
    ("animal hospital", "emergency_vet", "emergency", 0.85, True),
    ("pet hospital", "emergency_vet", "emergency", 0.85, True),
    ("after hours vet", "emergency_vet", "emergency", 0.90, True),
    ("night vet", "emergency_vet", "emergency", 0.85, True),
]

for syn, tag, pillar, conf, prot in emergency_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf, prot))

# CARE SYNONYMS
care_synonyms = [
    ("haircut", "grooming", "care", 0.95),
    ("trim", "grooming", "care", 0.90),
    ("cut hair", "grooming", "care", 0.90),
    ("fur cut", "grooming", "care", 0.90),
    ("groom", "grooming", "care", 0.95),
    ("groomer", "grooming", "care", 0.95),
    ("salon", "grooming", "care", 0.85),
    ("parlour", "grooming", "care", 0.85),
    ("spa", "grooming", "care", 0.80),
    ("bath", "bath", "care", 0.95),
    ("bathing", "bath", "care", 0.95),
    ("shower", "bath", "care", 0.80),
    ("wash", "bath", "care", 0.85),
    ("clean my dog", "bath", "care", 0.80),
    ("nail cut", "nail_trim", "care", 0.95),
    ("clip nails", "nail_trim", "care", 0.95),
    ("nails too long", "nail_trim", "care", 0.90),
    ("pedicure", "nail_trim", "care", 0.80),
    ("ear clean", "ear_cleaning", "care", 0.95),
    ("clean ears", "ear_cleaning", "care", 0.95),
    ("teeth clean", "dental_hygiene", "care", 0.90),
    ("dental", "dental_hygiene", "care", 0.90),
    ("brush teeth", "dental_hygiene", "care", 0.85),
    ("bad breath", "dental_hygiene", "care", 0.80),
    ("vaccine", "vaccination_schedule", "care", 0.95),
    ("vaccination", "vaccination_schedule", "care", 0.95),
    ("shots", "vaccination_schedule", "care", 0.85),
    ("jab", "vaccination_schedule", "care", 0.80),
    ("booster", "vaccination_schedule", "care", 0.85),
    ("deworming", "deworming_schedule", "care", 0.95),
    ("worm medicine", "deworming_schedule", "care", 0.90),
    ("deworm", "deworming_schedule", "care", 0.95),
    ("tick medicine", "flea_tick_prevention", "care", 0.90),
    ("flea treatment", "flea_tick_prevention", "care", 0.95),
    ("tick prevention", "flea_tick_prevention", "care", 0.95),
    ("itching", "excessive_scratching", "care", 0.85),
    ("scratching a lot", "excessive_scratching", "care", 0.90),
    ("keeps scratching", "excessive_scratching", "care", 0.90),
    ("not eating", "loss_appetite", "care", 0.90),
    ("won't eat", "loss_appetite", "care", 0.90),
    ("off food", "loss_appetite", "care", 0.85),
    ("tired", "lethargy", "care", 0.75),
    ("no energy", "lethargy", "care", 0.85),
    ("sleeping too much", "lethargy", "care", 0.80),
    ("vomiting", "mild_vomiting", "care", 0.80),
    ("threw up", "mild_vomiting", "care", 0.85),
    ("puking", "mild_vomiting", "care", 0.85),
    ("loose motion", "diarrhea", "care", 0.90),
    ("loose stool", "diarrhea", "care", 0.90),
    ("runny poop", "diarrhea", "care", 0.85),
    ("limping", "limping", "care", 0.95),
    ("leg pain", "limping", "care", 0.85),
    ("can't walk properly", "limping", "care", 0.85),
    ("vet", "vet_appointment", "care", 0.90),
    ("doctor", "vet_appointment", "care", 0.80),
    ("checkup", "vet_appointment", "care", 0.90),
    ("check-up", "vet_appointment", "care", 0.90),
    ("appointment", "vet_appointment", "care", 0.75),
]
for syn, tag, pillar, conf in care_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf))

# DINE SYNONYMS
dine_synonyms = [
    ("food", "meals", "dine", 0.85),
    ("meal", "meals", "dine", 0.95),
    ("what to feed", "meals", "dine", 0.90),
    ("feeding", "meals", "dine", 0.90),
    ("kibble", "meals", "dine", 0.85),
    ("wet food", "meals", "dine", 0.85),
    ("dry food", "meals", "dine", 0.85),
    ("snack", "treats", "dine", 0.90),
    ("treat", "treats", "dine", 0.95),
    ("biscuit", "treats", "dine", 0.85),
    ("reward", "treats", "dine", 0.80),
    ("chewies", "chews", "dine", 0.90),
    ("chew stick", "chews", "dine", 0.90),
    ("bones", "chews", "dine", 0.85),
    ("water", "hydration", "dine", 0.85),
    ("drinking", "hydration", "dine", 0.80),
    ("not drinking", "hydration", "dine", 0.85),
    ("home food", "home_cooked", "dine", 0.90),
    ("homemade", "home_cooked", "dine", 0.90),
    ("cook for dog", "home_cooked", "dine", 0.85),
    ("raw food", "raw_diet", "dine", 0.95),
    ("barf", "raw_diet", "dine", 0.90),
    ("no grains", "grain_free", "dine", 0.90),
    ("without grain", "grain_free", "dine", 0.90),
    ("allergic", "allergy_safe", "dine", 0.85),
    ("food allergy", "allergy_safe", "dine", 0.95),
    ("sensitive tummy", "sensitive_stomach", "dine", 0.90),
    ("upset stomach", "sensitive_stomach", "dine", 0.85),
    ("digestion", "sensitive_stomach", "dine", 0.80),
    ("fussy eater", "picky_eater", "dine", 0.95),
    ("won't eat food", "picky_eater", "dine", 0.85),
    ("choosy", "picky_eater", "dine", 0.85),
    ("change food", "food_transition", "dine", 0.90),
    ("switch food", "food_transition", "dine", 0.90),
    ("new food", "food_transition", "dine", 0.85),
    ("puppy food", "puppy_nutrition", "dine", 0.95),
    ("what to feed puppy", "puppy_nutrition", "dine", 0.95),
    ("old dog food", "senior_nutrition", "dine", 0.90),
    ("senior diet", "senior_nutrition", "dine", 0.95),
    ("lose weight", "weight_loss_diet", "dine", 0.85),
    ("overweight diet", "weight_loss_diet", "dine", 0.85),
    ("fat dog diet", "weight_loss_diet", "dine", 0.80),
    ("gain weight", "weight_gain_diet", "dine", 0.90),
    ("too thin", "weight_gain_diet", "dine", 0.85),
    ("underweight", "weight_gain_diet", "dine", 0.90),
    ("chocolate toxic", "toxic_avoidance", "dine", 0.95),
    ("can dogs eat", "toxic_avoidance", "dine", 0.85),
    ("safe to eat", "toxic_avoidance", "dine", 0.85),
]
for syn, tag, pillar, conf in dine_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf))

# STAY SYNONYMS
stay_synonyms = [
    ("boarding", "kennel", "stay", 0.90),
    ("kennels", "kennel", "stay", 0.95),
    ("pet hotel", "kennel", "stay", 0.90),
    ("board my dog", "kennel", "stay", 0.95),
    ("leave my dog", "kennel", "stay", 0.80),
    ("going on vacation", "kennel", "stay", 0.75),
    ("luxury boarding", "premium_boarding", "stay", 0.95),
    ("best boarding", "premium_boarding", "stay", 0.85),
    ("no cages", "cage_free", "stay", 0.90),
    ("cage free", "cage_free", "stay", 0.95),
    ("daycare", "daycare", "stay", 0.95),
    ("day care", "daycare", "stay", 0.95),
    ("daytime care", "daycare", "stay", 0.90),
    ("creche", "daycare", "stay", 0.85),
    ("sitter", "pet_sitting", "stay", 0.95),
    ("pet sitter", "pet_sitting", "stay", 0.95),
    ("someone to watch", "pet_sitting", "stay", 0.80),
    ("babysitter", "pet_sitting", "stay", 0.75),
    ("overnight", "overnight_sitter", "stay", 0.85),
    ("stay overnight", "overnight_sitter", "stay", 0.90),
    ("night sitter", "overnight_sitter", "stay", 0.95),
    ("drop in", "drop_in_visits", "stay", 0.90),
    ("check on dog", "drop_in_visits", "stay", 0.85),
    ("visit my dog", "drop_in_visits", "stay", 0.85),
    ("separation anxiety", "separation_anxiety_stay", "stay", 0.90),
    ("anxious when alone", "separation_anxiety_stay", "stay", 0.85),
    ("hates being alone", "separation_anxiety_stay", "stay", 0.85),
    ("old dog boarding", "senior_boarding", "stay", 0.90),
    ("senior dog stay", "senior_boarding", "stay", 0.90),
    ("puppy boarding", "puppy_boarding", "stay", 0.95),
    ("young puppy stay", "puppy_boarding", "stay", 0.80),
    ("trial stay", "trial_night", "stay", 0.90),
    ("test night", "trial_night", "stay", 0.85),
    ("updates", "daily_updates", "stay", 0.80),
    ("photo updates", "daily_updates", "stay", 0.90),
    ("pick up drop", "pickup_drop", "stay", 0.90),
    ("transport to boarding", "pickup_drop", "stay", 0.85),
]
for syn, tag, pillar, conf in stay_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf))

# TRAVEL SYNONYMS
travel_synonyms = [
    ("flight", "air_travel", "travel", 0.95),
    ("flying", "air_travel", "travel", 0.95),
    ("airplane", "air_travel", "travel", 0.95),
    ("plane", "air_travel", "travel", 0.90),
    ("fly with dog", "air_travel", "travel", 0.95),
    ("air india", "air_travel", "travel", 0.85),
    ("indigo", "air_travel", "travel", 0.85),
    ("road trip", "car_travel", "travel", 0.95),
    ("car", "car_travel", "travel", 0.85),
    ("drive", "car_travel", "travel", 0.85),
    ("driving with dog", "car_travel", "travel", 0.95),
    ("train", "train_travel", "travel", 0.95),
    ("rajdhani", "train_travel", "travel", 0.85),
    ("shatabdi", "train_travel", "travel", 0.85),
    ("abroad", "international_travel", "travel", 0.85),
    ("overseas", "international_travel", "travel", 0.90),
    ("relocating", "international_travel", "travel", 0.85),
    ("moving countries", "international_travel", "travel", 0.90),
    ("vaccine papers", "vaccination_records", "travel", 0.90),
    ("vaccination certificate", "vaccination_records", "travel", 0.95),
    ("health cert", "health_certificate", "travel", 0.95),
    ("fit to fly", "fit_to_fly", "travel", 0.95),
    ("can dog fly", "fit_to_fly", "travel", 0.85),
    ("import permit", "import_export", "travel", 0.90),
    ("export", "import_export", "travel", 0.90),
    ("crate", "crate_selection", "travel", 0.85),
    ("carrier", "crate_selection", "travel", 0.85),
    ("travel box", "crate_selection", "travel", 0.85),
    ("airline rules", "airline_policy", "travel", 0.95),
    ("cargo", "cargo_vs_cabin", "travel", 0.90),
    ("cabin", "cargo_vs_cabin", "travel", 0.90),
    ("car sick", "motion_sickness", "travel", 0.95),
    ("vomits in car", "motion_sickness", "travel", 0.90),
    ("travel anxiety", "anxiety_travel", "travel", 0.95),
    ("nervous traveler", "anxiety_travel", "travel", 0.85),
    ("pet taxi", "pet_taxi", "travel", 0.95),
    ("cab for dog", "pet_taxi", "travel", 0.90),
    ("ola pet", "pet_taxi", "travel", 0.85),
    ("uber pet", "pet_taxi", "travel", 0.85),
    ("airport drop", "airport_transfer", "travel", 0.95),
    ("airport pickup", "airport_transfer", "travel", 0.95),
    ("packing list", "travel_kit", "travel", 0.90),
    ("what to pack", "travel_kit", "travel", 0.85),
]
for syn, tag, pillar, conf in travel_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf))

# ENJOY SYNONYMS
enjoy_synonyms = [
    ("park", "parks", "enjoy", 0.90),
    ("parks nearby", "parks", "enjoy", 0.95),
    ("where to go", "parks", "enjoy", 0.75),
    ("dog park", "dog_parks", "enjoy", 0.95),
    ("off leash", "dog_parks", "enjoy", 0.90),
    ("hike", "hikes", "enjoy", 0.95),
    ("hiking", "hikes", "enjoy", 0.95),
    ("trek", "hikes", "enjoy", 0.90),
    ("beach", "beaches", "enjoy", 0.95),
    ("seaside", "beaches", "enjoy", 0.85),
    ("playdate", "playdates", "enjoy", 0.95),
    ("play date", "playdates", "enjoy", 0.95),
    ("dog friends", "playdates", "enjoy", 0.85),
    ("meetup", "pet_meetups", "enjoy", 0.90),
    ("dog meetup", "pet_meetups", "enjoy", 0.95),
    ("cafe", "cafes", "enjoy", 0.90),
    ("coffee with dog", "cafes", "enjoy", 0.85),
    ("restaurant", "pet_friendly_restaurants", "enjoy", 0.85),
    ("eat out with dog", "pet_friendly_restaurants", "enjoy", 0.90),
    ("weekend trip", "weekend_getaway", "enjoy", 0.90),
    ("short trip", "weekend_getaway", "enjoy", 0.85),
    ("toy", "toys", "enjoy", 0.95),
    ("toys", "toys", "enjoy", 0.95),
    ("play thing", "toys", "enjoy", 0.85),
    ("games", "enrichment_games", "enjoy", 0.85),
    ("mental stimulation", "enrichment_games", "enjoy", 0.90),
    ("bored dog", "enrichment_games", "enjoy", 0.80),
    ("puzzle", "puzzle_feeders", "enjoy", 0.90),
    ("slow feeder", "puzzle_feeders", "enjoy", 0.90),
    ("sniff", "sniff_work", "enjoy", 0.85),
    ("nose games", "sniff_work", "enjoy", 0.90),
    ("scared of thunder", "noise_phobia_support", "enjoy", 0.90),
    ("fireworks fear", "noise_phobia_support", "enjoy", 0.95),
    ("diwali anxiety", "noise_phobia_support", "enjoy", 0.95),
    ("crackers fear", "noise_phobia_support", "enjoy", 0.90),
]
for syn, tag, pillar, conf in enjoy_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf))

# FIT SYNONYMS
fit_synonyms = [
    ("walk", "daily_walks", "fit", 0.90),
    ("walks", "daily_walks", "fit", 0.90),
    ("walking", "daily_walks", "fit", 0.90),
    ("walker", "daily_walks", "fit", 0.85),
    ("dog walker", "daily_walks", "fit", 0.95),
    ("exercise", "stamina_build", "fit", 0.85),
    ("fitness", "stamina_build", "fit", 0.85),
    ("overweight exercise", "weight_management_activity", "fit", 0.80),
    ("lose weight exercise", "weight_management_activity", "fit", 0.90),
    ("old dog exercise", "senior_mobility", "fit", 0.90),
    ("senior exercise", "senior_mobility", "fit", 0.95),
    ("puppy exercise", "puppy_energy", "fit", 0.95),
    ("how much exercise puppy", "puppy_energy", "fit", 0.90),
    ("obedience", "basic_obedience", "fit", 0.95),
    ("basic training", "basic_obedience", "fit", 0.90),
    ("sit stay", "basic_obedience", "fit", 0.85),
    ("leash pulling", "leash_training", "fit", 0.95),
    ("pulls on leash", "leash_training", "fit", 0.95),
    ("loose leash", "leash_training", "fit", 0.90),
    ("come when called", "recall", "fit", 0.95),
    ("doesn't come back", "recall", "fit", 0.90),
    ("recall training", "recall", "fit", 0.95),
    ("socializing", "socialisation", "fit", 0.95),
    ("socialization", "socialisation", "fit", 0.95),
    ("meet other dogs", "socialisation", "fit", 0.85),
    ("reactive", "reactivity", "fit", 0.95),
    ("barks at dogs", "reactivity", "fit", 0.85),
    ("lunges", "reactivity", "fit", 0.90),
    ("agility", "agility", "fit", 0.95),
    ("obstacle course", "agility", "fit", 0.85),
    ("swimming", "swimming", "fit", 0.95),
    ("swim", "swimming", "fit", 0.95),
    ("pool", "swimming", "fit", 0.80),
    ("harness", "harnesses", "fit", 0.95),
    ("which harness", "harnesses", "fit", 0.90),
]
for syn, tag, pillar, conf in fit_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf))

# LEARN SYNONYMS
learn_synonyms = [
    ("new puppy owner", "new_pet_parenting", "learn", 0.95),
    ("first time pet parent", "new_pet_parenting", "learn", 0.95),
    ("just got a puppy", "new_pet_parenting", "learn", 0.95),
    ("new dog owner", "new_pet_parenting", "learn", 0.90),
    ("breed info", "breed_guide", "learn", 0.90),
    ("about golden retriever", "breed_guide", "learn", 0.85),
    ("labrador guide", "breed_guide", "learn", 0.90),
    ("nutrition guide", "nutrition_education", "learn", 0.90),
    ("food labels", "nutrition_education", "learn", 0.85),
    ("training guide", "training_basics_education", "learn", 0.90),
    ("how to train", "training_basics_education", "learn", 0.90),
    ("potty training", "training_basics_education", "learn", 0.95),
    ("house training", "training_basics_education", "learn", 0.95),
    ("socialisation guide", "socialisation_education", "learn", 0.95),
    ("how to socialize", "socialisation_education", "learn", 0.90),
    ("vaccine schedule", "health_preventive_education", "learn", 0.90),
    ("when to vaccinate", "health_preventive_education", "learn", 0.90),
    ("first aid", "first_aid_education", "learn", 0.95),
    ("first aid kit", "first_aid_education", "learn", 0.95),
    ("trainer", "trainer_class", "learn", 0.90),
    ("training class", "trainer_class", "learn", 0.95),
    ("puppy class", "trainer_class", "learn", 0.95),
    ("obedience class", "trainer_class", "learn", 0.90),
    ("videos", "video_library", "learn", 0.85),
    ("youtube", "video_library", "learn", 0.80),
    ("watch how to", "video_library", "learn", 0.85),
    ("checklist", "checklists", "learn", 0.95),
    ("list", "checklists", "learn", 0.75),
    ("expert advice", "qa_with_expert", "learn", 0.90),
    ("talk to expert", "qa_with_expert", "learn", 0.95),
    ("behaviour issue", "behaviour_guidance", "learn", 0.90),
    ("behaviour problem", "behaviour_guidance", "learn", 0.90),
]
for syn, tag, pillar, conf in learn_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf))

# CELEBRATE SYNONYMS
celebrate_synonyms = [
    ("birthday", "birthday", "celebrate", 0.95),
    ("bday", "birthday", "celebrate", 0.95),
    ("turning one", "birthday", "celebrate", 0.90),
    ("birthday party", "birthday", "celebrate", 0.95),
    ("gotcha day", "gotcha_day", "celebrate", 0.95),
    ("adoption anniversary", "gotcha_day", "celebrate", 0.95),
    ("one year since adoption", "gotcha_day", "celebrate", 0.90),
    ("new pet", "new_pet_welcome", "celebrate", 0.85),
    ("welcome home", "new_pet_welcome", "celebrate", 0.90),
    ("just adopted", "new_pet_welcome", "celebrate", 0.85),
    ("party", "pawty", "celebrate", 0.85),
    ("dog party", "pawty", "celebrate", 0.95),
    ("pet party", "pawty", "celebrate", 0.95),
    ("pawty", "pawty", "celebrate", 0.95),
    ("photo", "photo_shoot", "celebrate", 0.80),
    ("photoshoot", "photo_shoot", "celebrate", 0.95),
    ("photographer", "photo_shoot", "celebrate", 0.90),
    ("professional photos", "photo_shoot", "celebrate", 0.90),
    ("cake", "cakes", "celebrate", 0.90),
    ("dog cake", "cakes", "celebrate", 0.95),
    ("birthday cake", "cakes", "celebrate", 0.95),
    ("gift", "toys_gifts", "celebrate", 0.85),
    ("present", "toys_gifts", "celebrate", 0.80),
    ("hamper", "personalised_hamper", "celebrate", 0.90),
    ("gift box", "personalised_hamper", "celebrate", 0.90),
    ("paw print", "paw_print", "celebrate", 0.95),
    ("paw impression", "paw_print", "celebrate", 0.90),
    ("portrait", "custom_portrait", "celebrate", 0.90),
    ("dog portrait", "custom_portrait", "celebrate", 0.95),
    ("painting", "custom_portrait", "celebrate", 0.80),
]
for syn, tag, pillar, conf in celebrate_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf))

# ADOPT SYNONYMS
adopt_synonyms = [
    ("adopt", "where_to_adopt", "adopt", 0.95),
    ("adoption", "where_to_adopt", "adopt", 0.95),
    ("shelter", "where_to_adopt", "adopt", 0.90),
    ("rescue", "where_to_adopt", "adopt", 0.90),
    ("ngo", "where_to_adopt", "adopt", 0.85),
    ("adopt a dog", "where_to_adopt", "adopt", 0.95),
    ("which breed", "breed_match_adoption", "adopt", 0.85),
    ("which dog", "breed_match_adoption", "adopt", 0.85),
    ("best breed for", "breed_match_adoption", "adopt", 0.90),
    ("apartment dog", "breed_match_adoption", "adopt", 0.85),
    ("first week", "first_week_plan", "adopt", 0.85),
    ("first week plan", "first_week_plan", "adopt", 0.95),
    ("what to do first week", "first_week_plan", "adopt", 0.90),
    ("prepare home", "home_setup_adoption", "adopt", 0.90),
    ("puppy proof", "home_setup_adoption", "adopt", 0.85),
    ("introduce to kids", "introduce_to_family", "adopt", 0.95),
    ("children and dog", "introduce_to_family", "adopt", 0.85),
    ("introduce to cat", "introduce_to_pets", "adopt", 0.95),
    ("second dog", "introduce_to_pets", "adopt", 0.85),
    ("foster", "foster_to_adopt", "adopt", 0.95),
    ("trial adoption", "foster_to_adopt", "adopt", 0.90),
    ("puppy mill", "ethical_adoption", "adopt", 0.90),
    ("backyard breeder", "ethical_adoption", "adopt", 0.90),
]
for syn, tag, pillar, conf in adopt_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf))

# ADVISORY SYNONYMS
advisory_synonyms = [
    ("which one", "what_to_choose", "advisory", 0.85),
    ("help me choose", "what_to_choose", "advisory", 0.90),
    ("recommendation", "what_to_choose", "advisory", 0.80),
    ("compare", "pros_cons", "advisory", 0.85),
    ("vs", "pros_cons", "advisory", 0.80),
    ("which is better", "pros_cons", "advisory", 0.90),
    ("safest", "safest_option", "advisory", 0.90),
    ("is it safe", "safest_option", "advisory", 0.85),
    ("best value", "best_value", "advisory", 0.90),
    ("affordable", "best_value", "advisory", 0.80),
    ("should I see vet", "vet_first", "advisory", 0.90),
    ("is this serious", "vet_first", "advisory", 0.85),
    ("need vet", "vet_first", "advisory", 0.90),
    ("nutritionist", "nutrition_consult", "advisory", 0.95),
    ("behaviourist", "behaviour_expert", "advisory", 0.95),
    ("behaviour specialist", "behaviour_expert", "advisory", 0.90),
]
for syn, tag, pillar, conf in advisory_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf))

# PAPERWORK SYNONYMS
paperwork_synonyms = [
    ("vaccine record", "vaccination_records_doc", "paperwork", 0.95),
    ("vaccine certificate", "vaccination_records_doc", "paperwork", 0.95),
    ("vaccination papers", "vaccination_records_doc", "paperwork", 0.95),
    ("microchip", "microchip_docs", "paperwork", 0.95),
    ("chip registration", "microchip_docs", "paperwork", 0.90),
    ("license", "licence_docs", "paperwork", 0.95),
    ("dog license", "licence_docs", "paperwork", 0.95),
    ("registration", "licence_docs", "paperwork", 0.85),
    ("health cert", "health_certificate_doc", "paperwork", 0.95),
    ("fit to fly letter", "fit_to_fly_letters", "paperwork", 0.95),
    ("airline letter", "fit_to_fly_letters", "paperwork", 0.85),
    ("insurance", "insurance_claim", "paperwork", 0.85),
    ("claim", "insurance_claim", "paperwork", 0.80),
    ("documents", "document_vault", "paperwork", 0.80),
    ("store papers", "document_vault", "paperwork", 0.85),
]
for syn, tag, pillar, conf in paperwork_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf))

# FAREWELL SYNONYMS
farewell_synonyms = [
    ("is it time", "quality_of_life", "farewell", 0.85),
    ("how do I know", "quality_of_life", "farewell", 0.80),
    ("quality of life", "quality_of_life", "farewell", 0.95),
    ("suffering", "quality_of_life", "farewell", 0.85),
    ("comfort care", "palliative_care", "farewell", 0.90),
    ("hospice", "palliative_care", "farewell", 0.90),
    ("end of life care", "palliative_care", "farewell", 0.95),
    ("pain", "pain_management", "farewell", 0.80),
    ("pain relief", "pain_management", "farewell", 0.90),
    ("euthanasia", "euthanasia_support", "farewell", 0.95),
    ("put to sleep", "euthanasia_support", "farewell", 0.90),
    ("saying goodbye", "euthanasia_support", "farewell", 0.80),
    ("home euthanasia", "euthanasia_support", "farewell", 0.95),
    ("cremation", "cremation_burial", "farewell", 0.95),
    ("burial", "cremation_burial", "farewell", 0.95),
    ("ashes", "cremation_burial", "farewell", 0.90),
    ("memorial", "memorial_keepsakes", "farewell", 0.90),
    ("keepsake", "memorial_keepsakes", "farewell", 0.95),
    ("memory box", "memorial_keepsakes", "farewell", 0.90),
    ("urn", "memorial_keepsakes", "farewell", 0.85),
    ("tribute", "tribute_media", "farewell", 0.90),
    ("tribute video", "tribute_media", "farewell", 0.95),
    ("grieving", "grief_support", "farewell", 0.90),
    ("lost my dog", "grief_support", "farewell", 0.90),
    ("pet loss", "grief_support", "farewell", 0.95),
    ("rainbow bridge", "grief_support", "farewell", 0.90),
    ("tell my child", "children_support", "farewell", 0.90),
    ("explain to kids", "children_support", "farewell", 0.95),
]
for syn, tag, pillar, conf in farewell_synonyms:
    TAG_SYNONYMS.append(create_synonym(syn, tag, pillar, conf))

# ============== SERVICE VERTICALS ==============

SERVICE_VERTICALS = [
    {"vertical": "grooming", "vertical_display": "Grooming", "definition": "Grooming services booking", "maps_to_pillars": ["care"]},
    {"vertical": "training", "vertical_display": "Training", "definition": "Training session booking", "maps_to_pillars": ["fit", "learn"]},
    {"vertical": "boarding", "vertical_display": "Boarding", "definition": "Overnight boarding booking", "maps_to_pillars": ["stay"]},
    {"vertical": "daycare", "vertical_display": "Daycare", "definition": "Daytime care booking", "maps_to_pillars": ["stay"]},
    {"vertical": "vet_care", "vertical_display": "Vet Care", "definition": "Veterinary booking", "maps_to_pillars": ["care", "emergency"]},
    {"vertical": "dog_walking", "vertical_display": "Dog Walking", "definition": "Walking service booking", "maps_to_pillars": ["fit"]},
    {"vertical": "pet_photography", "vertical_display": "Pet Photography", "definition": "Photography booking", "maps_to_pillars": ["celebrate"]},
    {"vertical": "transport", "vertical_display": "Transport", "definition": "Pet transport booking", "maps_to_pillars": ["travel"]},
]

SERVICE_VERTICAL_SYNONYMS = [
    ("groomer", "grooming", 0.95),
    ("salon", "grooming", 0.90),
    ("parlour", "grooming", 0.85),
    ("haircut booking", "grooming", 0.90),
    ("bath appointment", "grooming", 0.85),
    ("spa appointment", "grooming", 0.85),
    ("grooming appointment", "grooming", 0.95),
    ("book groomer", "grooming", 0.95),
    ("trainer", "training", 0.95),
    ("obedience class", "training", 0.90),
    ("behaviour session", "training", 0.85),
    ("training session", "training", 0.95),
    ("book trainer", "training", 0.95),
    ("puppy class booking", "training", 0.90),
    ("kennel", "boarding", 0.90),
    ("pet hotel", "boarding", 0.90),
    ("overnight stay", "boarding", 0.85),
    ("boarding booking", "boarding", 0.95),
    ("book boarding", "boarding", 0.95),
    ("reserve kennel", "boarding", 0.90),
    ("day boarding", "daycare", 0.90),
    ("creche", "daycare", 0.85),
    ("daycare booking", "daycare", 0.95),
    ("book daycare", "daycare", 0.95),
    ("vet appointment", "vet_care", 0.95),
    ("doctor appointment", "vet_care", 0.85),
    ("checkup booking", "vet_care", 0.85),
    ("book vet", "vet_care", 0.95),
    ("schedule vet", "vet_care", 0.90),
    ("consult booking", "vet_care", 0.85),
    ("walker", "dog_walking", 0.95),
    ("walk service", "dog_walking", 0.90),
    ("daily walks booking", "dog_walking", 0.85),
    ("book walker", "dog_walking", 0.95),
    ("walking subscription", "dog_walking", 0.90),
    ("hire walker", "dog_walking", 0.90),
    ("photoshoot booking", "pet_photography", 0.95),
    ("photographer", "pet_photography", 0.90),
    ("book photoshoot", "pet_photography", 0.95),
    ("photo session", "pet_photography", 0.90),
    ("pet taxi", "transport", 0.95),
    ("cab", "transport", 0.80),
    ("airport transfer", "transport", 0.90),
    ("book transport", "transport", 0.95),
    ("pickup drop", "transport", 0.85),
]

# ============== SERVICE TYPES ==============

SERVICE_TYPES = [
    {"type": "at_home", "type_display": "At Home", "definition": "Service delivered at customer's home"},
    {"type": "salon", "type_display": "Salon", "definition": "At grooming salon/facility"},
    {"type": "clinic", "type_display": "Clinic", "definition": "At veterinary clinic"},
    {"type": "online", "type_display": "Online", "definition": "Video call / telemedicine"},
    {"type": "pickup_drop", "type_display": "Pickup & Drop", "definition": "Transport included"},
    {"type": "boarding_facility", "type_display": "Boarding Facility", "definition": "At boarding location"},
    {"type": "daycare_center", "type_display": "Daycare Center", "definition": "At daycare location"},
    {"type": "field", "type_display": "Field", "definition": "Outdoor / mobile service"},
]

SERVICE_TYPE_SYNONYMS = [
    ("home visit", "at_home", 0.95),
    ("come to me", "at_home", 0.90),
    ("at my place", "at_home", 0.90),
    ("home grooming", "at_home", 0.90),
    ("groomer at home", "at_home", 0.95),
    ("vet at home", "at_home", 0.95),
    ("home service", "at_home", 0.90),
    ("doorstep", "at_home", 0.85),
    ("at my house", "at_home", 0.90),
    ("they come to us", "at_home", 0.85),
    ("come here", "at_home", 0.85),
    ("visit us", "at_home", 0.80),
    ("at home", "at_home", 0.95),
    ("in home", "at_home", 0.90),
    ("mobile service", "at_home", 0.85),
    ("parlour", "salon", 0.85),
    ("shop", "salon", 0.80),
    ("facility", "salon", 0.80),
    ("at the salon", "salon", 0.95),
    ("grooming salon", "salon", 0.95),
    ("go to salon", "salon", 0.90),
    ("take to salon", "salon", 0.90),
    ("at their place", "salon", 0.85),
    ("drop off at", "salon", 0.80),
    ("hospital", "clinic", 0.85),
    ("vet clinic", "clinic", 0.95),
    ("at the vet", "clinic", 0.95),
    ("veterinary hospital", "clinic", 0.95),
    ("animal hospital", "clinic", 0.90),
    ("take to vet", "clinic", 0.90),
    ("go to clinic", "clinic", 0.90),
    ("video call", "online", 0.95),
    ("teleconsult", "online", 0.90),
    ("virtual", "online", 0.85),
    ("online consultation", "online", 0.95),
    ("video consultation", "online", 0.95),
    ("telemedicine", "online", 0.95),
    ("remote", "online", 0.80),
    ("phone call", "online", 0.75),
    ("over video", "online", 0.90),
    ("pick up", "pickup_drop", 0.90),
    ("drop off", "pickup_drop", 0.90),
    ("they collect", "pickup_drop", 0.85),
    ("pickup and drop", "pickup_drop", 0.95),
    ("collect and return", "pickup_drop", 0.90),
    ("transport included", "pickup_drop", 0.90),
    ("they pick up", "pickup_drop", 0.90),
    ("will they pick", "pickup_drop", 0.85),
    ("at boarding", "boarding_facility", 0.95),
    ("at the kennel", "boarding_facility", 0.95),
    ("boarding center", "boarding_facility", 0.95),
    ("pet hotel facility", "boarding_facility", 0.90),
    ("at daycare", "daycare_center", 0.95),
    ("daycare facility", "daycare_center", 0.95),
    ("creche facility", "daycare_center", 0.85),
    ("outdoor", "field", 0.80),
    ("at the park", "field", 0.85),
    ("outside", "field", 0.75),
    ("in the field", "field", 0.90),
    ("mobile trainer", "field", 0.85),
    ("outdoor training", "field", 0.90),
]

def seed_collection(db, collection_name, data, key_field):
    """Idempotent upsert for a collection."""
    if not data:
        print(f"  {collection_name}: No data to seed")
        return 0
    
    collection = db[collection_name]
    operations = []
    
    for item in data:
        # Add metadata
        item["seed_version"] = SEED_VERSION
        item["source_doc_version"] = SOURCE_DOC_VERSION
        if "created_at" not in item:
            item["created_at"] = get_timestamp()
        
        operations.append(
            UpdateOne(
                {key_field: item[key_field]},
                {"$set": item},
                upsert=True
            )
        )
    
    if operations:
        result = collection.bulk_write(operations)
        inserted = result.upserted_count
        modified = result.modified_count
        print(f"  {collection_name}: {inserted} inserted, {modified} updated (total: {len(data)})")
        return len(data)
    return 0

def main():
    print("=" * 60)
    print("MIRA OS TAXONOMY SEEDER - Phase B0")
    print(f"seed_version: {SEED_VERSION}")
    print(f"source_doc_version: {SOURCE_DOC_VERSION}")
    print("=" * 60)
    
    # Connect to MongoDB
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    counts = {}
    
    # 1. Seed canonical_tags
    print("\n[1/6] Seeding canonical_tags...")
    counts["canonical_tags"] = seed_collection(db, "canonical_tags", CANONICAL_TAGS, "tag")
    
    # 2. Seed tag_synonyms
    print("\n[2/6] Seeding tag_synonyms...")
    counts["tag_synonyms"] = seed_collection(db, "tag_synonyms", TAG_SYNONYMS, "synonym")
    
    # 3. Seed service_verticals
    print("\n[3/6] Seeding service_verticals...")
    for v in SERVICE_VERTICALS:
        v["seed_version"] = SEED_VERSION
        v["source_doc_version"] = SOURCE_DOC_VERSION
        v["created_at"] = get_timestamp()
    counts["service_verticals"] = seed_collection(db, "service_verticals", SERVICE_VERTICALS, "vertical")
    
    # 4. Seed service_vertical_synonyms
    print("\n[4/6] Seeding service_vertical_synonyms...")
    sv_synonyms = []
    for syn, vertical, conf in SERVICE_VERTICAL_SYNONYMS:
        sv_synonyms.append({
            "synonym": syn.lower(),
            "vertical": vertical,
            "confidence": conf,
            "seed_version": SEED_VERSION,
            "source_doc_version": SOURCE_DOC_VERSION,
            "created_at": get_timestamp(),
        })
    counts["service_vertical_synonyms"] = seed_collection(db, "service_vertical_synonyms", sv_synonyms, "synonym")
    
    # 5. Seed service_types
    print("\n[5/6] Seeding service_types...")
    for t in SERVICE_TYPES:
        t["seed_version"] = SEED_VERSION
        t["source_doc_version"] = SOURCE_DOC_VERSION
        t["created_at"] = get_timestamp()
    counts["service_types"] = seed_collection(db, "service_types", SERVICE_TYPES, "type")
    
    # 6. Seed service_type_synonyms
    print("\n[6/6] Seeding service_type_synonyms...")
    st_synonyms = []
    for syn, stype, conf in SERVICE_TYPE_SYNONYMS:
        st_synonyms.append({
            "synonym": syn.lower(),
            "service_type": stype,
            "confidence": conf,
            "seed_version": SEED_VERSION,
            "source_doc_version": SOURCE_DOC_VERSION,
            "created_at": get_timestamp(),
        })
    counts["service_type_synonyms"] = seed_collection(db, "service_type_synonyms", st_synonyms, "synonym")
    
    # Create indexes
    print("\n[Creating indexes...]")
    db.canonical_tags.create_index("tag", unique=True)
    db.canonical_tags.create_index("pillar")
    db.canonical_tags.create_index("safety_level")
    db.canonical_tags.create_index([("pillar", 1), ("cluster", 1)])
    
    db.tag_synonyms.create_index("synonym", unique=True)
    db.tag_synonyms.create_index("tag")
    db.tag_synonyms.create_index("pillar")
    db.tag_synonyms.create_index("protected")
    
    db.service_verticals.create_index("vertical", unique=True)
    db.service_vertical_synonyms.create_index("synonym", unique=True)
    db.service_types.create_index("type", unique=True)
    db.service_type_synonyms.create_index("synonym", unique=True)
    
    print("\n" + "=" * 60)
    print("SEED COMPLETE")
    print("=" * 60)
    print(f"\nseed_version: {SEED_VERSION}")
    print(f"\nCOUNTS PER COLLECTION:")
    for collection, count in counts.items():
        print(f"  {collection}: {count}")
    print(f"\nTOTAL ENTRIES: {sum(counts.values())}")
    
    # Pillar coverage check
    print("\n" + "=" * 60)
    print("PILLAR COVERAGE CHECK")
    print("=" * 60)
    pipeline = [
        {"$group": {"_id": "$pillar", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    pillar_counts = list(db.canonical_tags.aggregate(pipeline))
    for p in pillar_counts:
        status = "OK" if p["count"] >= 10 else "LOW"
        print(f"  {p['_id']}: {p['count']} tags [{status}]")
    
    # Sample output
    print("\n" + "=" * 60)
    print("SAMPLE TAGS + SYNONYMS (3 PILLARS)")
    print("=" * 60)
    
    for pillar in ["emergency", "care", "dine"]:
        print(f"\n--- {pillar.upper()} ---")
        tags = list(db.canonical_tags.find({"pillar": pillar}).limit(3))
        for tag in tags:
            print(f"  TAG: {tag['tag']} ({tag['tag_display']})")
            print(f"       safety_level: {tag['safety_level']}, priority: {tag['priority']}")
            syns = list(db.tag_synonyms.find({"tag": tag['tag']}).limit(3))
            if syns:
                syn_list = ", ".join([s['synonym'] for s in syns])
                print(f"       synonyms: {syn_list}...")
    
    print("\n" + "=" * 60)
    print("B0 SEEDING COMPLETE")
    print("=" * 60)
    
    client.close()

if __name__ == "__main__":
    main()
