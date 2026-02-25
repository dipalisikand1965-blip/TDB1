# ═══════════════════════════════════════════════════════════════════════════════
# CONCIERGE SERVICES CONFIGURATION
# Complete service catalog covering all 14 pillars of Mira OS
# ═══════════════════════════════════════════════════════════════════════════════

# Primary strip (always visible) - 10 categories
CONCIERGE_SERVICE_CATEGORIES = [
    {
        "id": "grooming",
        "name": "Grooming",
        "emoji": "✂️",
        "icon": "scissors",
        "gradient": ["#06B6D4", "#22D3EE"],
        "description": "Professional grooming services"
    },
    {
        "id": "training",
        "name": "Training",
        "emoji": "🎓",
        "icon": "graduation-cap",
        "gradient": ["#8B5CF6", "#A78BFA"],
        "description": "Behaviour training & education"
    },
    {
        "id": "vet_care",
        "name": "Vet Care",
        "emoji": "🏥",
        "icon": "stethoscope",
        "gradient": ["#EC4899", "#F472B6"],
        "description": "Health & medical coordination"
    },
    {
        "id": "boarding",
        "name": "Boarding",
        "emoji": "🏠",
        "icon": "home",
        "gradient": ["#22C55E", "#4ADE80"],
        "description": "Overnight stays & long-term care"
    },
    {
        "id": "daycare",
        "name": "Daycare",
        "emoji": "🌞",
        "icon": "sun",
        "gradient": ["#F59E0B", "#FBBF24"],
        "description": "Daytime care & socialization"
    },
    {
        "id": "dog_walking",
        "name": "Dog Walking",
        "emoji": "🐕",
        "icon": "paw-print",
        "gradient": ["#3B82F6", "#60A5FA"],
        "description": "Regular walks & exercise"
    },
    {
        "id": "travel",
        "name": "Travel",
        "emoji": "✈️",
        "icon": "plane",
        "gradient": ["#0EA5E9", "#38BDF8"],
        "description": "Travel planning & logistics"
    },
    {
        "id": "celebrate",
        "name": "Celebrate",
        "emoji": "🎉",
        "icon": "party-popper",
        "gradient": ["#EC4899", "#F472B6"],
        "description": "Events, birthdays & milestones"
    },
    {
        "id": "emergency",
        "name": "Emergency",
        "emoji": "🚨",
        "icon": "siren",
        "gradient": ["#EF4444", "#F87171"],
        "description": "24/7 emergency support"
    },
    {
        "id": "advisory",
        "name": "Advisory",
        "emoji": "🧠",
        "icon": "brain",
        "gradient": ["#6366F1", "#818CF8"],
        "description": "Expert consultations & second opinions"
    }
]

# Sub-services that expand when category is clicked
CONCIERGE_SUB_SERVICES = {
    # ═══════════════════════════════════════════════════════════════
    # GROOMING
    # ═══════════════════════════════════════════════════════════════
    "grooming": [
        {
            "id": "full_grooming",
            "name": "Full Grooming Session",
            "emoji": "✂️",
            "description": "Complete bath, haircut, nails, ears",
            "spec_chip": "2-3 hours",
            "why_it_fits": "Complete pampering session tailored to {pet}'s coat type.",
            "what_we_source": "Vetted groomer matched to {pet}'s breed and temperament."
        },
        {
            "id": "bath_brush",
            "name": "Bath & Brush",
            "emoji": "🛁",
            "description": "Quick refresh without full cut",
            "spec_chip": "45-60 min",
            "why_it_fits": "Quick cleanup when {pet} needs freshening up.",
            "what_we_source": "Express grooming slot with gentle handling."
        },
        {
            "id": "nail_trim",
            "name": "Nail Trimming",
            "emoji": "💅",
            "description": "Safe nail maintenance",
            "spec_chip": "15-20 min",
            "why_it_fits": "Keeping {pet}'s nails healthy and comfortable.",
            "what_we_source": "Experienced groomer for stress-free nail care."
        },
        {
            "id": "skin_coat",
            "name": "Skin & Coat Treatment",
            "emoji": "🧴",
            "description": "Specialized coat care",
            "spec_chip": "Medicated options",
            "why_it_fits": "Addressing {pet}'s specific skin needs.",
            "what_we_source": "Therapeutic grooming with vet-approved products."
        }
    ],
    
    # ═══════════════════════════════════════════════════════════════
    # TRAINING
    # ═══════════════════════════════════════════════════════════════
    "training": [
        {
            "id": "basic_obedience",
            "name": "Basic Obedience",
            "emoji": "🎓",
            "description": "Sit, stay, come, heel",
            "spec_chip": "4-6 sessions",
            "why_it_fits": "Building {pet}'s foundation commands.",
            "what_we_source": "Certified trainer using positive reinforcement."
        },
        {
            "id": "puppy_training",
            "name": "Puppy Training",
            "emoji": "🐕",
            "description": "Early socialization & manners",
            "spec_chip": "Age 8-16 weeks",
            "why_it_fits": "Setting {pet} up for lifelong good behaviour.",
            "what_we_source": "Puppy specialist with gentle methods."
        },
        {
            "id": "behaviour_consult",
            "name": "Behaviour Consultation",
            "emoji": "🧠",
            "description": "Address specific issues",
            "spec_chip": "1-on-1 assessment",
            "why_it_fits": "Understanding and resolving {pet}'s behaviour challenges.",
            "what_we_source": "Certified animal behaviourist for evaluation."
        },
        {
            "id": "leash_reactivity",
            "name": "Leash Reactivity Training",
            "emoji": "🦮",
            "description": "Calm walks without pulling",
            "spec_chip": "Specialized",
            "why_it_fits": "Making walks enjoyable for you and {pet}.",
            "what_we_source": "Reactivity specialist with proven methods."
        }
    ],
    
    # ═══════════════════════════════════════════════════════════════
    # VET CARE / HEALTH
    # ═══════════════════════════════════════════════════════════════
    "vet_care": [
        {
            "id": "wellness_checkup",
            "name": "Wellness Checkup",
            "emoji": "🩺",
            "description": "Routine health examination",
            "spec_chip": "Annual/bi-annual",
            "why_it_fits": "Keeping {pet} healthy with preventive care.",
            "what_we_source": "Appointment with trusted vet in your area."
        },
        {
            "id": "dental_care",
            "name": "Dental Coordination",
            "emoji": "🦷",
            "description": "Dental cleaning & checkup",
            "spec_chip": "Under anesthesia",
            "why_it_fits": "Professional dental care for {pet}'s oral health.",
            "what_we_source": "Vet with dental specialty for safe cleaning."
        },
        {
            "id": "second_opinion",
            "name": "Second Opinion",
            "emoji": "🔍",
            "description": "Expert consultation on diagnosis",
            "spec_chip": "Specialist referral",
            "why_it_fits": "Peace of mind with expert second look.",
            "what_we_source": "Specialist vet for thorough review."
        },
        {
            "id": "nutrition_consult",
            "name": "Nutrition Consultation",
            "emoji": "🥗",
            "description": "Diet planning & assessment",
            "spec_chip": "Vet nutritionist",
            "why_it_fits": "Optimizing {pet}'s diet for health and energy.",
            "what_we_source": "Veterinary nutritionist for personalized plan."
        },
        {
            "id": "health_tracking",
            "name": "Health Tracking Setup",
            "emoji": "📊",
            "description": "Monitor vitals & patterns",
            "spec_chip": "Smart device",
            "why_it_fits": "Keeping tabs on {pet}'s health trends.",
            "what_we_source": "Pet health tracker matched to your needs."
        }
    ],
    
    # ═══════════════════════════════════════════════════════════════
    # BOARDING
    # ═══════════════════════════════════════════════════════════════
    "boarding": [
        {
            "id": "overnight_boarding",
            "name": "Overnight Boarding",
            "emoji": "🏠",
            "description": "Safe overnight stays",
            "spec_chip": "24/7 supervision",
            "why_it_fits": "A home away from home for {pet}.",
            "what_we_source": "Vetted boarding facility matching {pet}'s needs."
        },
        {
            "id": "home_boarding",
            "name": "Home Boarding",
            "emoji": "🏡",
            "description": "Stay in a sitter's home",
            "spec_chip": "Family environment",
            "why_it_fits": "Cozy home setting for {pet} while you're away.",
            "what_we_source": "Verified home boarder with experience."
        },
        {
            "id": "long_term_care",
            "name": "Long-Term Care",
            "emoji": "📅",
            "description": "Extended stays (1+ weeks)",
            "spec_chip": "Customized care",
            "why_it_fits": "Reliable care for {pet} during extended travel.",
            "what_we_source": "Facility with long-term stay programs."
        }
    ],
    
    # ═══════════════════════════════════════════════════════════════
    # DAYCARE
    # ═══════════════════════════════════════════════════════════════
    "daycare": [
        {
            "id": "full_day",
            "name": "Full Day Care",
            "emoji": "🌞",
            "description": "8+ hours of supervised play",
            "spec_chip": "Socialization",
            "why_it_fits": "Fun and exercise while you work.",
            "what_we_source": "Daycare with play groups matched to {pet}'s size."
        },
        {
            "id": "half_day",
            "name": "Half Day Care",
            "emoji": "⏰",
            "description": "4-hour session",
            "spec_chip": "Flexible",
            "why_it_fits": "Perfect for shorter outings.",
            "what_we_source": "Flexible daycare slot for {pet}."
        },
        {
            "id": "enrichment_day",
            "name": "Enrichment Day",
            "emoji": "🧩",
            "description": "Mental stimulation focused",
            "spec_chip": "Brain games",
            "why_it_fits": "Keeping {pet}'s mind sharp and engaged.",
            "what_we_source": "Daycare with enrichment activities."
        }
    ],
    
    # ═══════════════════════════════════════════════════════════════
    # DOG WALKING
    # ═══════════════════════════════════════════════════════════════
    "dog_walking": [
        {
            "id": "daily_walk",
            "name": "Daily Walk",
            "emoji": "🐕",
            "description": "30-60 min regular walks",
            "spec_chip": "Recurring",
            "why_it_fits": "Keeping {pet} active and happy.",
            "what_we_source": "Reliable walker in your neighbourhood."
        },
        {
            "id": "group_walk",
            "name": "Group Walk",
            "emoji": "🐕‍🦺",
            "description": "Social walks with other dogs",
            "spec_chip": "Max 4 dogs",
            "why_it_fits": "Socialization and exercise combined.",
            "what_we_source": "Walker experienced with group dynamics."
        },
        {
            "id": "private_walk",
            "name": "Private Walk",
            "emoji": "🦮",
            "description": "One-on-one attention",
            "spec_chip": "Customized",
            "why_it_fits": "Personal attention for {pet}'s needs.",
            "what_we_source": "Dedicated walker for solo walks."
        },
        {
            "id": "adventure_walk",
            "name": "Adventure Walk",
            "emoji": "🏞️",
            "description": "Hikes & nature trails",
            "spec_chip": "90+ min",
            "why_it_fits": "Extra adventure for active {pet}.",
            "what_we_source": "Walker for trail hikes and exploration."
        }
    ],
    
    # ═══════════════════════════════════════════════════════════════
    # TRAVEL
    # ═══════════════════════════════════════════════════════════════
    "travel": [
        {
            "id": "travel_planning",
            "name": "Travel Planning",
            "emoji": "✈️",
            "description": "Complete trip coordination",
            "spec_chip": "End-to-end",
            "why_it_fits": "Stress-free travel planning for you and {pet}.",
            "what_we_source": "Full itinerary with pet-friendly options."
        },
        {
            "id": "pet_transport",
            "name": "Pet Transport",
            "emoji": "🚗",
            "description": "Safe ground transportation",
            "spec_chip": "Door-to-door",
            "why_it_fits": "Safe, comfortable transport for {pet}.",
            "what_we_source": "Licensed pet transport service."
        },
        {
            "id": "stay_curation",
            "name": "Pet-Friendly Stay",
            "emoji": "🏨",
            "description": "Curated accommodations",
            "spec_chip": "Verified pet-friendly",
            "why_it_fits": "Finding the perfect stay that welcomes {pet}.",
            "what_we_source": "Handpicked hotels/rentals that love pets."
        },
        {
            "id": "travel_docs",
            "name": "Travel Documentation",
            "emoji": "📋",
            "description": "Certificates & papers",
            "spec_chip": "Compliance",
            "why_it_fits": "All paperwork sorted for smooth travel.",
            "what_we_source": "Health certs, airline forms, import permits."
        },
        {
            "id": "international_papers",
            "name": "International Papers",
            "emoji": "🛂",
            "description": "Cross-border documentation",
            "spec_chip": "Country-specific",
            "why_it_fits": "Navigating international pet travel rules.",
            "what_we_source": "Country-specific import requirements."
        }
    ],
    
    # ═══════════════════════════════════════════════════════════════
    # CELEBRATE
    # ═══════════════════════════════════════════════════════════════
    "celebrate": [
        {
            "id": "birthday_planning",
            "name": "Birthday Planning",
            "emoji": "🎉",
            "description": "Complete party coordination",
            "spec_chip": "End-to-end",
            "why_it_fits": "Making {pet}'s birthday unforgettable.",
            "what_we_source": "Full party setup from cake to decor."
        },
        {
            "id": "custom_cake",
            "name": "Custom Birthday Cake",
            "emoji": "🎂",
            "description": "Allergy-safe celebration cake",
            "spec_chip": "Allergy-safe",
            "why_it_fits": "Safe, delicious cake made for {pet}.",
            "what_we_source": "Dog-safe bakery matched to diet."
        },
        {
            "id": "gift_sourcing",
            "name": "Custom Gift Sourcing",
            "emoji": "🎁",
            "description": "Personalized presents",
            "spec_chip": "Handpicked",
            "why_it_fits": "Thoughtful gifts {pet} will love.",
            "what_we_source": "Curated gifts based on {pet}'s preferences."
        },
        {
            "id": "event_setup",
            "name": "Event Setup",
            "emoji": "🎈",
            "description": "Party decorations & setup",
            "spec_chip": "Pet-safe decor",
            "why_it_fits": "Beautiful, safe celebration space.",
            "what_we_source": "Complete decor setup at your home."
        },
        {
            "id": "milestone_shoot",
            "name": "Milestone Memory Shoot",
            "emoji": "📸",
            "description": "Professional photography",
            "spec_chip": "30-45 min",
            "why_it_fits": "Capturing {pet}'s special moments.",
            "what_we_source": "Pet photographer for milestone photos."
        },
        {
            "id": "gotcha_day",
            "name": "Gotcha Day Planning",
            "emoji": "💜",
            "description": "Adoption anniversary celebration",
            "spec_chip": "Anniversary",
            "why_it_fits": "Celebrating the day {pet} joined your family.",
            "what_we_source": "Special celebration for your bond."
        }
    ],
    
    # ═══════════════════════════════════════════════════════════════
    # EMERGENCY
    # ═══════════════════════════════════════════════════════════════
    "emergency": [
        {
            "id": "emergency_vet",
            "name": "24/7 Emergency Vet Routing",
            "emoji": "🚨",
            "description": "Immediate vet connection",
            "spec_chip": "24/7 available",
            "why_it_fits": "Instant help when {pet} needs it most.",
            "what_we_source": "Nearest emergency vet with availability."
        },
        {
            "id": "emergency_transport",
            "name": "Emergency Transport",
            "emoji": "🚑",
            "description": "Urgent pet transport",
            "spec_chip": "Priority",
            "why_it_fits": "Fast, safe transport in emergencies.",
            "what_we_source": "Priority pet ambulance service."
        },
        {
            "id": "emergency_kit",
            "name": "Emergency Go-Bag Setup",
            "emoji": "🧳",
            "description": "Pre-packed emergency supplies",
            "spec_chip": "Ready to grab",
            "why_it_fits": "Be prepared for any situation.",
            "what_we_source": "Custom emergency kit for {pet}."
        },
        {
            "id": "emergency_care_plan",
            "name": "Emergency Care Plan",
            "emoji": "📋",
            "description": "Backup caregiver arrangements",
            "spec_chip": "Contingency",
            "why_it_fits": "Peace of mind knowing {pet} is covered.",
            "what_we_source": "Emergency caregiver network setup."
        }
    ],
    
    # ═══════════════════════════════════════════════════════════════
    # ADVISORY
    # ═══════════════════════════════════════════════════════════════
    "advisory": [
        {
            "id": "second_opinion",
            "name": "Second Opinion",
            "emoji": "🔍",
            "description": "Expert review of diagnosis",
            "spec_chip": "Specialist",
            "why_it_fits": "Peace of mind with expert consultation.",
            "what_we_source": "Specialist vet for thorough review."
        },
        {
            "id": "behaviour_consult",
            "name": "Behaviour Consult",
            "emoji": "🧠",
            "description": "Understand & address issues",
            "spec_chip": "Certified",
            "why_it_fits": "Expert insight into {pet}'s behaviour.",
            "what_we_source": "Certified animal behaviourist."
        },
        {
            "id": "nutrition_consult",
            "name": "Nutrition Consult",
            "emoji": "🥗",
            "description": "Diet & nutrition planning",
            "spec_chip": "Vet nutritionist",
            "why_it_fits": "Optimizing {pet}'s diet for health.",
            "what_we_source": "Veterinary nutritionist consultation."
        },
        {
            "id": "senior_care_plan",
            "name": "Senior Care Planning",
            "emoji": "🌅",
            "description": "Aging & comfort support",
            "spec_chip": "Quality of life",
            "why_it_fits": "Making {pet}'s golden years comfortable.",
            "what_we_source": "Senior care specialist guidance."
        },
        {
            "id": "adoption_guidance",
            "name": "Adoption Guidance",
            "emoji": "🐶",
            "description": "Finding the right match",
            "spec_chip": "Expert matching",
            "why_it_fits": "Finding your perfect companion.",
            "what_we_source": "Adoption counselor for best match."
        },
        {
            "id": "multi_pet_intro",
            "name": "Multi-Pet Introduction",
            "emoji": "🤝",
            "description": "Safe introduction planning",
            "spec_chip": "Gradual process",
            "why_it_fits": "Smooth introduction for household harmony.",
            "what_we_source": "Behaviourist for safe introductions."
        },
        {
            "id": "home_readiness",
            "name": "Home Readiness Setup",
            "emoji": "🏡",
            "description": "Pet-proofing & preparation",
            "spec_chip": "New pet prep",
            "why_it_fits": "Getting your home ready for {pet}.",
            "what_we_source": "Home assessment and setup guidance."
        },
        {
            "id": "hospice_planning",
            "name": "Hospice & End-of-Life",
            "emoji": "💜",
            "description": "Compassionate support",
            "spec_chip": "Quality of life",
            "why_it_fits": "Compassionate guidance for difficult times.",
            "what_we_source": "Hospice vet and support resources."
        }
    ]
}

# Additional specialized services (for specific pillars)
ADDITIONAL_SERVICES = {
    "preventive": [
        {"id": "parasite_prevention", "name": "Parasite Prevention Plan", "emoji": "🦟"},
        {"id": "care_plan", "name": "Care Plan Setup", "emoji": "📅"},
        {"id": "weight_management", "name": "Weight Management", "emoji": "⚖️"},
    ],
    "documentation": [
        {"id": "microchip", "name": "Microchip & Licensing", "emoji": "📎"},
        {"id": "vaccination_vault", "name": "Vaccination Record Vault", "emoji": "📑"},
    ],
    "senior": [
        {"id": "mobility_support", "name": "Mobility Support", "emoji": "🦴"},
        {"id": "senior_comfort", "name": "Senior Comfort Setup", "emoji": "🛏️"},
    ]
}
