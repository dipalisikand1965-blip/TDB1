"""
Care Products & Bundles Master Data
===================================
Comprehensive care products and bundles following Dipali's taxonomy:
- Products = nouns (building blocks)
- Bundles = use-case solutions (curated outcomes)

Filtering by:
- Size: xs, small, medium, large, xl
- Coat: short_coat, long_coat, double_coat, curly_coat, low_shed, high_shed
- Life Stage: puppy, adult, senior
- Temperament: calm, anxious, reactive, grooming_nervous, vet_nervous, first_time_boarding
- Intent: grooming, vet_clinic_booking, boarding_daycare, pet_sitting, behavior_anxiety_support, 
         senior_special_needs_support, nutrition_consult_booking, emergency_help, recovery_support_coordination
"""

from datetime import datetime, timezone
import uuid

# =============================================================================
# TAG CONSTANTS - Single Source of Truth
# =============================================================================

SIZE_TAGS = ["xs", "small", "medium", "large", "xl"]
COAT_TAGS = ["short_coat", "long_coat", "double_coat", "curly_coat", "low_shed", "high_shed"]
LIFE_STAGE_TAGS = ["puppy", "adult", "senior"]
TEMPERAMENT_TAGS = ["calm", "anxious", "reactive", "grooming_nervous", "vet_nervous", "first_time_boarding"]

# Care intent tags (maps to CARE_TYPES in CarePage.jsx)
INTENT_TAGS = [
    "grooming",
    "vet_clinic_booking",
    "boarding_daycare",
    "pet_sitting",
    "behavior_anxiety_support",
    "senior_special_needs_support",
    "nutrition_consult_booking",
    "emergency_help",
    "recovery_support_coordination"
]

# Product subcategories
PRODUCT_SUBCATEGORIES = [
    "grooming_essentials",
    "hygiene_cleaning",
    "paw_coat_care",
    "dental_care",
    "preventive_support",
    "recovery_support",
    "senior_comfort",
    "clinic_visit_prep",
    "calm_handling_support"
]

# Bundle types
BUNDLE_TYPES = [
    "starter_setup",
    "routine_care",
    "visit_prep",
    "recovery_setup",
    "senior_support",
    "anxiety_support",
    "seasonal_care"
]

# =============================================================================
# MIRA WHISPERS - Breed/Size/Coat specific personalization
# =============================================================================

def get_whisper(product_id: str, pet_data: dict = None) -> str:
    """Generate Mira whisper based on pet profile"""
    if not pet_data:
        return ""
    
    size = pet_data.get("size", "").lower()
    coat = pet_data.get("coat_type", "").lower()
    age = pet_data.get("life_stage", "").lower()
    
    whispers = {
        # Grooming products
        "gentle-grooming-brush-kit": {
            "small": "Perfect gentle bristles for {pet_name}'s delicate coat",
            "double_coat": "Ideal for maintaining {pet_name}'s undercoat health",
            "senior": "Extra-soft for {pet_name}'s sensitive senior skin"
        },
        "deshedding-comb-set": {
            "double_coat": "Essential for {pet_name}'s seasonal shedding",
            "large": "Heavy-duty for {pet_name}'s thick coat",
            "default": "Reduces loose fur by up to 90%"
        },
        "curly-coat-detangle-kit": {
            "curly_coat": "Prevents painful matting in {pet_name}'s curls",
            "long_coat": "Keeps {pet_name}'s coat knot-free",
            "default": "Gentle detangling for curly breeds"
        },
        # Clinic visit products
        "clinic-visit-calm-kit": {
            "anxious": "Helps soothe {pet_name}'s clinic anxiety",
            "vet_nervous": "Calming support for {pet_name}'s vet visits",
            "puppy": "Makes early vet visits positive for {pet_name}"
        },
        # Senior products
        "senior-comfort-setup": {
            "senior": "Specially designed for {pet_name}'s golden years comfort",
            "large": "Extra support for {pet_name}'s joints",
            "default": "Gentle care for aging pets"
        }
    }
    
    product_whispers = whispers.get(product_id, {})
    
    # Priority: temperament > coat > size > age > default
    for key in [pet_data.get("temperament", ""), coat, size, age, "default"]:
        if key in product_whispers:
            return product_whispers[key]
    
    return ""


# =============================================================================
# CARE PRODUCTS - Individual Items (Building Blocks)
# =============================================================================

CARE_PRODUCTS = [
    # =========================================================================
    # A. GROOMING & HYGIENE SUPPORT
    # =========================================================================
    {
        "id": "gentle-grooming-brush-kit",
        "name": "Gentle Grooming Brush Kit",
        "description": "Soft bristle brush set for sensitive coats. Includes slicker brush and finishing comb.",
        "price": 799,
        "compare_price": 999,
        "image": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600",
        "pillar": "care",
        "subcategory": "grooming_essentials",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "short_coat", "long_coat", "anxious", "grooming_nervous"],
        "intent_tags": ["grooming", "pet_sitting"],
        "concierge_note": "Supports comfortable at-home grooming prep",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 8
    },
    {
        "id": "deshedding-comb-set",
        "name": "De-Shedding Comb Set (Double Coat)",
        "description": "Professional undercoat rake and deshedding tool. Perfect for Labrador, Golden, Husky-type coats.",
        "price": 1299,
        "compare_price": 1599,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "pillar": "care",
        "subcategory": "grooming_essentials",
        "product_type": "individual",
        "good_for_tags": ["medium", "large", "xl", "double_coat", "high_shed"],
        "intent_tags": ["grooming"],
        "concierge_note": "Essential for seasonal shedding support",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 13
    },
    {
        "id": "curly-coat-detangle-kit",
        "name": "Curly Coat Detangle Kit",
        "description": "Anti-matting comb, slicker brush, and detangle spray. For Poodle, Doodle, curly/wool coats.",
        "price": 899,
        "compare_price": 1199,
        "image": "https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?w=600",
        "pillar": "care",
        "subcategory": "grooming_essentials",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "curly_coat", "long_coat"],
        "intent_tags": ["grooming", "pet_sitting"],
        "concierge_note": "Prevents painful matting between groom visits",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 9
    },
    {
        "id": "paw-care-protection-kit",
        "name": "Paw Care & Pad Protection Kit",
        "description": "Paw balm, pad protector, and gentle paw cleaner. For all seasons.",
        "price": 599,
        "compare_price": 799,
        "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600",
        "pillar": "care",
        "subcategory": "paw_coat_care",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "xl", "senior"],
        "intent_tags": ["grooming", "pet_sitting", "senior_special_needs_support"],
        "concierge_note": "Supports daily paw health and comfort",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 6
    },
    {
        "id": "ear-face-cleaning-kit",
        "name": "Ear & Face Cleaning Care Kit",
        "description": "Gentle ear cleaner, tear stain wipes, and face fold cleaner. For floppy-ear and flat-face breeds.",
        "price": 549,
        "compare_price": 699,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "pillar": "care",
        "subcategory": "hygiene_cleaning",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "long_coat", "anxious"],
        "intent_tags": ["grooming", "pet_sitting"],
        "concierge_note": "Supports hygiene for sensitive facial areas",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 5
    },
    {
        "id": "dental-care-starter-kit",
        "name": "Dental Care Starter Kit",
        "description": "Finger brush, enzymatic toothpaste, and dental wipes. Fresh breath support.",
        "price": 649,
        "compare_price": 849,
        "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600",
        "pillar": "care",
        "subcategory": "dental_care",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "puppy", "adult", "senior"],
        "intent_tags": ["grooming", "vet_clinic_booking"],
        "concierge_note": "Supports dental hygiene between vet cleanings",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 6
    },
    
    # =========================================================================
    # B. CLINIC VISIT & HANDLING SUPPORT
    # =========================================================================
    {
        "id": "clinic-visit-calm-kit",
        "name": "Clinic Visit Calm Kit",
        "description": "Calming spray, comfort wrap, and distraction treats. For anxious pets during vet visits.",
        "price": 899,
        "compare_price": 1199,
        "image": "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600",
        "pillar": "care",
        "subcategory": "clinic_visit_prep",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "anxious", "vet_nervous"],
        "intent_tags": ["vet_clinic_booking", "behavior_anxiety_support"],
        "concierge_note": "Supports calm clinic experiences (not medical)",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 9
    },
    {
        "id": "travel-wait-comfort-kit",
        "name": "Travel & Wait-Time Comfort Kit",
        "description": "Portable water bowl, comfort blanket, and calming treats. For longer clinic waits.",
        "price": 749,
        "compare_price": 999,
        "image": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600",
        "pillar": "care",
        "subcategory": "clinic_visit_prep",
        "product_type": "individual",
        "good_for_tags": ["medium", "large", "xl", "anxious"],
        "intent_tags": ["vet_clinic_booking", "emergency_help"],
        "concierge_note": "Comfort support for travel and waiting",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 7
    },
    {
        "id": "post-visit-comfort-setup",
        "name": "Post-Visit Home Comfort Setup",
        "description": "Recovery bed pad, gentle cleanup wipes, and calming diffuser. For post-clinic rest.",
        "price": 999,
        "compare_price": 1299,
        "image": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600",
        "pillar": "care",
        "subcategory": "recovery_support",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "senior", "anxious"],
        "intent_tags": ["vet_clinic_booking", "recovery_support_coordination"],
        "concierge_note": "Supports comfortable recovery at home",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 10
    },
    
    # =========================================================================
    # C. SENIOR & SPECIAL NEEDS SUPPORT
    # =========================================================================
    {
        "id": "senior-comfort-setup-kit",
        "name": "Senior Comfort Home Setup Kit",
        "description": "Orthopedic support pad, non-slip mat, and gentle grooming tools. For aging pets.",
        "price": 1499,
        "compare_price": 1899,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "pillar": "care",
        "subcategory": "senior_comfort",
        "product_type": "individual",
        "good_for_tags": ["medium", "large", "xl", "senior"],
        "intent_tags": ["senior_special_needs_support", "grooming"],
        "concierge_note": "Supports comfort and mobility for senior pets",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 15
    },
    {
        "id": "easy-access-feeding-setup",
        "name": "Easy-Access Feeding & Hydration Setup",
        "description": "Elevated bowl stand, slow-feeder insert, and spill-proof water bowl. For seniors and recovery.",
        "price": 1199,
        "compare_price": 1499,
        "image": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600",
        "pillar": "care",
        "subcategory": "senior_comfort",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "senior"],
        "intent_tags": ["senior_special_needs_support", "recovery_support_coordination"],
        "concierge_note": "Supports comfortable feeding for mobility-sensitive pets",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 12
    },
    
    # =========================================================================
    # D. HOME CARE / SITTING / BOARDING READINESS
    # =========================================================================
    {
        "id": "pet-sitting-handover-kit",
        "name": "Pet Sitting Handover Essentials Kit",
        "description": "Feeding schedule cards, medication labels, and routine checklist. For sitter handover.",
        "price": 399,
        "compare_price": 549,
        "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600",
        "pillar": "care",
        "subcategory": "preventive_support",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "xl"],
        "intent_tags": ["pet_sitting", "boarding_daycare"],
        "concierge_note": "Ensures smooth sitter handover",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 4
    },
    {
        "id": "boarding-readiness-pack",
        "name": "Boarding Readiness Pack",
        "description": "Comfort item labels, familiar scent blanket, and feeding instructions template. For first-time boarding.",
        "price": 599,
        "compare_price": 799,
        "image": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600",
        "pillar": "care",
        "subcategory": "preventive_support",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "anxious", "first_time_boarding"],
        "intent_tags": ["boarding_daycare", "behavior_anxiety_support"],
        "concierge_note": "Reduces boarding anxiety with familiar comforts",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 6
    },
    {
        "id": "routine-hygiene-refill-pack",
        "name": "Routine Hygiene Refill Pack",
        "description": "Poop bags, cleaning wipes, and grooming wipes. Monthly refill essentials.",
        "price": 449,
        "compare_price": 599,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "pillar": "care",
        "subcategory": "hygiene_cleaning",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "xl"],
        "intent_tags": ["grooming", "pet_sitting"],
        "concierge_note": "Monthly care routine essentials",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 4
    },
    
    # =========================================================================
    # E. NUTRITION CONSULT BOOKING SUPPORT
    # =========================================================================
    {
        "id": "meal-logging-kit",
        "name": "Meal Logging & Feeding Routine Pack",
        "description": "Food tracking cards, portion guide, and meal timing chart. For nutrition consult prep.",
        "price": 349,
        "compare_price": 499,
        "image": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600",
        "pillar": "care",
        "subcategory": "preventive_support",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "puppy", "senior"],
        "intent_tags": ["nutrition_consult_booking"],
        "concierge_note": "Supports accurate nutrition consult preparation",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 3
    },
    {
        "id": "food-transition-kit",
        "name": "Food Transition Tracking Kit",
        "description": "Transition schedule template, portion measuring cups, and digestive support notes.",
        "price": 399,
        "compare_price": 549,
        "image": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600",
        "pillar": "care",
        "subcategory": "preventive_support",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "puppy", "senior"],
        "intent_tags": ["nutrition_consult_booking"],
        "concierge_note": "Supports safe food transitions with consult guidance",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 4
    },
    
    # =========================================================================
    # F. ANXIETY & CALMING SUPPORT
    # =========================================================================
    {
        "id": "calming-wrap-set",
        "name": "Calming Compression Wrap Set",
        "description": "Anxiety wrap with adjustable fit. Provides gentle pressure for nervous pets.",
        "price": 899,
        "compare_price": 1199,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "pillar": "care",
        "subcategory": "calm_handling_support",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "anxious", "grooming_nervous", "vet_nervous"],
        "intent_tags": ["behavior_anxiety_support", "grooming", "vet_clinic_booking"],
        "concierge_note": "Provides comforting pressure for anxious moments",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 9
    },
    {
        "id": "calming-pheromone-kit",
        "name": "Calming Pheromone Diffuser Kit",
        "description": "Room diffuser with calming pheromone refills. Creates relaxing environment.",
        "price": 1099,
        "compare_price": 1399,
        "image": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600",
        "pillar": "care",
        "subcategory": "calm_handling_support",
        "product_type": "individual",
        "good_for_tags": ["small", "medium", "large", "xl", "anxious", "reactive"],
        "intent_tags": ["behavior_anxiety_support", "boarding_daycare"],
        "concierge_note": "Creates calming atmosphere at home",
        "cta_label": "Ask Mira to Include",
        "status": "active",
        "in_stock": True,
        "paw_reward_points": 11
    }
]


# =============================================================================
# CARE BUNDLES - Curated Outcomes (Use-Case Solutions)
# =============================================================================

CARE_BUNDLES = [
    # =========================================================================
    # SMALL BREED BUNDLES
    # =========================================================================
    {
        "id": "small-breed-grooming-comfort-bundle",
        "name": "Small Breed Grooming Comfort Bundle",
        "description": "Everything for comfortable grooming of small, sensitive coats. Includes gentle brush, face care, paw balm, and grooming checklist.",
        "what_it_helps_with": "Regular grooming prep for small breeds, salon prep, at-home maintenance",
        "price": 1599,
        "original_price": 2199,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "pillar": "care",
        "bundle_type": "routine_care",
        "included_items": ["gentle-grooming-brush-kit", "ear-face-cleaning-kit", "paw-care-protection-kit"],
        "optional_addons": ["calming-wrap-set", "clinic-visit-calm-kit"],
        "good_for_tags": ["small", "xs", "long_coat", "short_coat", "grooming_nervous", "anxious"],
        "intent_tags": ["grooming", "behavior_anxiety_support", "pet_sitting"],
        "concierge_flow_mapping": "grooming_request",
        "status": "active",
        "display_priority": 1,
        "paw_reward_points": 16
    },
    {
        "id": "small-breed-vet-visit-calm-bundle",
        "name": "Small Breed Vet Visit Calm Bundle",
        "description": "Complete clinic visit comfort for nervous small pets. Calming kit, travel comfort, and cleanup essentials.",
        "what_it_helps_with": "Reduces clinic anxiety, supports calm vet visits",
        "price": 1899,
        "original_price": 2499,
        "image": "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600",
        "pillar": "care",
        "bundle_type": "visit_prep",
        "included_items": ["clinic-visit-calm-kit", "travel-wait-comfort-kit", "routine-hygiene-refill-pack"],
        "optional_addons": ["calming-wrap-set", "post-visit-comfort-setup"],
        "good_for_tags": ["small", "xs", "anxious", "vet_nervous", "first_time_boarding"],
        "intent_tags": ["vet_clinic_booking", "behavior_anxiety_support"],
        "concierge_flow_mapping": "vet_clinic_booking_request",
        "status": "active",
        "display_priority": 2,
        "paw_reward_points": 19
    },
    
    # =========================================================================
    # MEDIUM BREED BUNDLES
    # =========================================================================
    {
        "id": "medium-breed-hygiene-routine-bundle",
        "name": "Medium Breed Hygiene Routine Bundle",
        "description": "Complete coat and hygiene care for medium dogs. Brush kit, ear care, paw care, and dental starter.",
        "what_it_helps_with": "Daily hygiene routine, grooming prep, regular maintenance",
        "price": 1799,
        "original_price": 2399,
        "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600",
        "pillar": "care",
        "bundle_type": "routine_care",
        "included_items": ["gentle-grooming-brush-kit", "ear-face-cleaning-kit", "paw-care-protection-kit", "dental-care-starter-kit"],
        "optional_addons": ["routine-hygiene-refill-pack"],
        "good_for_tags": ["medium", "short_coat", "long_coat", "adult"],
        "intent_tags": ["grooming", "pet_sitting"],
        "concierge_flow_mapping": "grooming_request",
        "status": "active",
        "display_priority": 3,
        "paw_reward_points": 18
    },
    {
        "id": "daycare-boarding-readiness-bundle",
        "name": "Daycare & Boarding Readiness Bundle",
        "description": "First-time boarding essentials. Handover kit, comfort items, and anxiety transition support.",
        "what_it_helps_with": "Smooth first-time boarding, sitter handover, daycare prep",
        "price": 999,
        "original_price": 1399,
        "image": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600",
        "pillar": "care",
        "bundle_type": "starter_setup",
        "included_items": ["pet-sitting-handover-kit", "boarding-readiness-pack"],
        "optional_addons": ["calming-pheromone-kit", "calming-wrap-set"],
        "good_for_tags": ["small", "medium", "large", "first_time_boarding", "anxious"],
        "intent_tags": ["boarding_daycare", "pet_sitting", "behavior_anxiety_support"],
        "concierge_flow_mapping": "boarding_request",
        "status": "active",
        "display_priority": 4,
        "paw_reward_points": 10
    },
    
    # =========================================================================
    # LARGE BREED BUNDLES
    # =========================================================================
    {
        "id": "large-breed-shedding-control-bundle",
        "name": "Large Breed Shedding Control Bundle",
        "description": "Heavy-duty deshedding tools for thick double coats. Includes undercoat rake, paw care, and bath prep essentials.",
        "what_it_helps_with": "Seasonal shedding control, double coat maintenance, home grooming",
        "price": 2199,
        "original_price": 2799,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "pillar": "care",
        "bundle_type": "routine_care",
        "included_items": ["deshedding-comb-set", "paw-care-protection-kit", "routine-hygiene-refill-pack"],
        "optional_addons": ["gentle-grooming-brush-kit"],
        "good_for_tags": ["large", "xl", "double_coat", "high_shed"],
        "intent_tags": ["grooming"],
        "concierge_flow_mapping": "grooming_request",
        "status": "active",
        "display_priority": 5,
        "paw_reward_points": 22
    },
    {
        "id": "large-breed-clinic-coordination-bundle",
        "name": "Large Breed Clinic Coordination Bundle",
        "description": "Complete vet visit support for large dogs. Travel comfort, calming support, and home recovery setup.",
        "what_it_helps_with": "Clinic visits for large breeds, follow-up coordination, recovery support",
        "price": 2499,
        "original_price": 3199,
        "image": "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600",
        "pillar": "care",
        "bundle_type": "visit_prep",
        "included_items": ["clinic-visit-calm-kit", "travel-wait-comfort-kit", "post-visit-comfort-setup"],
        "optional_addons": ["senior-comfort-setup-kit", "calming-wrap-set"],
        "good_for_tags": ["large", "xl", "senior", "vet_nervous"],
        "intent_tags": ["vet_clinic_booking", "recovery_support_coordination", "senior_special_needs_support"],
        "concierge_flow_mapping": "vet_clinic_booking_request",
        "status": "active",
        "display_priority": 6,
        "paw_reward_points": 25
    },
    
    # =========================================================================
    # COAT-SPECIFIC BUNDLES
    # =========================================================================
    {
        "id": "curly-coat-matting-prevention-bundle",
        "name": "Curly Coat Matting Prevention Bundle",
        "description": "Everything for curly and doodle coats. Detangle kit, maintenance schedule, and salon prep checklist.",
        "what_it_helps_with": "Prevents matting, maintains curly coats, salon prep",
        "price": 1399,
        "original_price": 1799,
        "image": "https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?w=600",
        "pillar": "care",
        "bundle_type": "routine_care",
        "included_items": ["curly-coat-detangle-kit", "paw-care-protection-kit"],
        "optional_addons": ["ear-face-cleaning-kit", "pet-sitting-handover-kit"],
        "good_for_tags": ["small", "medium", "large", "curly_coat", "long_coat"],
        "intent_tags": ["grooming", "pet_sitting"],
        "concierge_flow_mapping": "grooming_request",
        "status": "active",
        "display_priority": 7,
        "paw_reward_points": 14
    },
    {
        "id": "double-coat-seasonal-shed-bundle",
        "name": "Double Coat Seasonal Shed Support Bundle",
        "description": "Seasonal shedding solution for double-coat breeds. Undercoat tools, cleanup support, and bath prep.",
        "what_it_helps_with": "Seasonal coat blowing, heavy shedding management",
        "price": 1899,
        "original_price": 2399,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "pillar": "care",
        "bundle_type": "seasonal_care",
        "included_items": ["deshedding-comb-set", "gentle-grooming-brush-kit", "routine-hygiene-refill-pack"],
        "optional_addons": ["paw-care-protection-kit"],
        "good_for_tags": ["medium", "large", "xl", "double_coat", "high_shed"],
        "intent_tags": ["grooming"],
        "concierge_flow_mapping": "grooming_request",
        "status": "active",
        "display_priority": 8,
        "paw_reward_points": 19
    },
    {
        "id": "short-coat-easy-care-bundle",
        "name": "Short Coat Easy-Care Bundle",
        "description": "Simple care essentials for short-coat breeds. Soft brush, paw care, dental support, and routine guide.",
        "what_it_helps_with": "Quick grooming routine, new pet parent support",
        "price": 999,
        "original_price": 1399,
        "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600",
        "pillar": "care",
        "bundle_type": "starter_setup",
        "included_items": ["gentle-grooming-brush-kit", "paw-care-protection-kit", "dental-care-starter-kit"],
        "optional_addons": ["routine-hygiene-refill-pack"],
        "good_for_tags": ["small", "medium", "large", "short_coat", "low_shed", "puppy"],
        "intent_tags": ["grooming", "pet_sitting"],
        "concierge_flow_mapping": "grooming_request",
        "status": "active",
        "display_priority": 9,
        "paw_reward_points": 10
    },
    
    # =========================================================================
    # LIFE STAGE BUNDLES
    # =========================================================================
    {
        "id": "new-puppy-care-starter-bundle",
        "name": "New Puppy Care Starter Bundle",
        "description": "First care essentials for puppies. Gentle grooming intro, cleanup basics, vet visit prep checklist.",
        "what_it_helps_with": "New puppy care routine setup, grooming introduction",
        "price": 1299,
        "original_price": 1699,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "pillar": "care",
        "bundle_type": "starter_setup",
        "included_items": ["gentle-grooming-brush-kit", "routine-hygiene-refill-pack", "pet-sitting-handover-kit"],
        "optional_addons": ["dental-care-starter-kit", "clinic-visit-calm-kit"],
        "good_for_tags": ["small", "medium", "puppy"],
        "intent_tags": ["grooming", "vet_clinic_booking"],
        "concierge_flow_mapping": "general_care_request",
        "status": "active",
        "display_priority": 10,
        "paw_reward_points": 13
    },
    {
        "id": "senior-comfort-special-handling-bundle",
        "name": "Senior Comfort & Special Handling Bundle",
        "description": "Comprehensive senior care support. Comfort setup, easy-access feeding, gentle grooming, and clinic coordination.",
        "what_it_helps_with": "Senior pet daily comfort, mobility support, gentle care",
        "price": 2799,
        "original_price": 3499,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
        "pillar": "care",
        "bundle_type": "senior_support",
        "included_items": ["senior-comfort-setup-kit", "easy-access-feeding-setup", "gentle-grooming-brush-kit"],
        "optional_addons": ["clinic-visit-calm-kit", "post-visit-comfort-setup"],
        "good_for_tags": ["medium", "large", "xl", "senior"],
        "intent_tags": ["senior_special_needs_support", "grooming", "vet_clinic_booking"],
        "concierge_flow_mapping": "senior_support_request",
        "status": "active",
        "display_priority": 11,
        "paw_reward_points": 28
    },
    {
        "id": "recovery-home-support-bundle",
        "name": "Recovery Home Support Bundle",
        "description": "Post-procedure recovery essentials. Rest-zone setup, feeding support, cleanup, and follow-up coordination checklist.",
        "what_it_helps_with": "Post-surgery recovery, home rest support, follow-up coordination",
        "price": 1999,
        "original_price": 2599,
        "image": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600",
        "pillar": "care",
        "bundle_type": "recovery_setup",
        "included_items": ["post-visit-comfort-setup", "easy-access-feeding-setup", "routine-hygiene-refill-pack"],
        "optional_addons": ["calming-pheromone-kit"],
        "good_for_tags": ["small", "medium", "large", "xl", "senior"],
        "intent_tags": ["recovery_support_coordination", "vet_clinic_booking", "senior_special_needs_support"],
        "concierge_flow_mapping": "recovery_support_request",
        "guardrail_note": "Supports comfort and routine setup only. Clinical guidance remains with your veterinarian.",
        "status": "active",
        "display_priority": 12,
        "paw_reward_points": 20
    }
]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_products_for_pet(pet_data: dict) -> list:
    """
    Filter products based on pet profile.
    Returns products that match the pet's size, coat, life stage, or temperament.
    """
    size = pet_data.get("size", "").lower()
    coat = pet_data.get("coat_type", "").lower()
    life_stage = pet_data.get("life_stage", "adult").lower()
    temperament = pet_data.get("temperament", "calm").lower()
    
    matching_products = []
    
    for product in CARE_PRODUCTS:
        good_for = product.get("good_for_tags", [])
        
        # Score based on matches
        score = 0
        if size in good_for:
            score += 3
        if coat in good_for:
            score += 2
        if life_stage in good_for:
            score += 2
        if temperament in good_for:
            score += 1
        
        # Include if any match or "all" applicable
        if score > 0:
            product_copy = product.copy()
            product_copy["match_score"] = score
            product_copy["mira_whisper"] = get_whisper(product["id"], pet_data)
            matching_products.append(product_copy)
    
    # Sort by match score
    matching_products.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    
    return matching_products


def get_bundles_for_pet(pet_data: dict) -> list:
    """
    Filter bundles based on pet profile.
    Returns bundles that match the pet's size, coat, life stage, or temperament.
    """
    size = pet_data.get("size", "").lower()
    coat = pet_data.get("coat_type", "").lower()
    life_stage = pet_data.get("life_stage", "adult").lower()
    temperament = pet_data.get("temperament", "calm").lower()
    
    matching_bundles = []
    
    for bundle in CARE_BUNDLES:
        good_for = bundle.get("good_for_tags", [])
        
        # Score based on matches
        score = 0
        if size in good_for:
            score += 3
        if coat in good_for:
            score += 2
        if life_stage in good_for:
            score += 2
        if temperament in good_for:
            score += 1
        
        if score > 0:
            bundle_copy = bundle.copy()
            bundle_copy["match_score"] = score
            matching_bundles.append(bundle_copy)
    
    # Sort by match score and display priority
    matching_bundles.sort(key=lambda x: (x.get("match_score", 0), -x.get("display_priority", 99)), reverse=True)
    
    return matching_bundles


def get_bundles_for_intent(intent: str, pet_data: dict = None) -> list:
    """
    Get bundles matching a specific care intent.
    """
    matching = []
    
    for bundle in CARE_BUNDLES:
        if intent in bundle.get("intent_tags", []):
            bundle_copy = bundle.copy()
            if pet_data:
                # Add relevance score based on pet match
                size = pet_data.get("size", "").lower()
                if size in bundle.get("good_for_tags", []):
                    bundle_copy["pet_match"] = True
            matching.append(bundle_copy)
    
    return matching


def get_all_products() -> list:
    """Return all care products with generated IDs"""
    return CARE_PRODUCTS


def get_all_bundles() -> list:
    """Return all care bundles with generated IDs"""
    return CARE_BUNDLES
