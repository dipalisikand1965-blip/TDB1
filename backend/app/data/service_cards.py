"""
Service Card Library - Celebrate Pillar
========================================

Services are NOT products. They create tickets.
Each service has:
- Display metadata (name, icon, description)
- Questions Mira asks to build the ticket
- Persona fit scores for matching to pet

Storage: Python file first, DB override later.
Rule: if DB has overrides, use them. Otherwise, use these.
"""

# ═══════════════════════════════════════════════════════════════════════════════
# CELEBRATE PILLAR SERVICES
# ═══════════════════════════════════════════════════════════════════════════════

CELEBRATE_SERVICES = [
    {
        "id": "plan-celebration-end-to-end",
        "name": "Plan the Celebration End-to-End",
        "icon": "🎉",
        "short_desc": "Theme, cake, décor, schedule - Mira handles it all",
        "full_desc": "Tell Mira what kind of celebration you want, and she'll coordinate everything: theme selection, cake ordering, décor setup, guest coordination, and timeline management.",
        "questions": [
            "Playful party or elegant celebration?",
            "How many humans will be there?",
            "Indoor, outdoor, or venue?"
        ],
        "creates_ticket_type": "celebration_planning",
        "response_time": "Within 4 hours",
        "persona_fit": {
            "elegant": 0.9,
            "playful": 0.9,
            "energetic": 0.8,
            "calm": 0.8
        },
        "breed_boost": {},  # Works for all breeds
        "size_boost": {},   # Works for all sizes
        "tags": ["signature", "popular"]
    },
    {
        "id": "custom-cake-design",
        "name": "Custom Cake Design",
        "icon": "🎂",
        "short_desc": "Shape, theme, dietary constraints - your vision, made safe",
        "full_desc": "Design a cake that matches your pet's personality and dietary needs. Mira coordinates with our bakers for breed silhouettes, themed designs, or minimalist elegance.",
        "questions": [
            "Any specific theme or shape in mind?",
            "Any food rules we should know about?",
            "What size gathering is this for?"
        ],
        "creates_ticket_type": "custom_cake",
        "response_time": "Within 2 hours",
        "persona_fit": {
            "elegant": 1.0,
            "photo_ready": 0.9,
            "foodie": 0.8
        },
        "breed_boost": {
            "Shih Tzu": 0.2,      # Love breed silhouette cakes
            "Pomeranian": 0.2,
            "French Bulldog": 0.2
        },
        "size_boost": {},
        "tags": ["popular"]
    },
    {
        "id": "at-home-party-setup",
        "name": "At-Home Party Setup",
        "icon": "🏠",
        "short_desc": "Décor install, safe zones, photo corner - we set it up",
        "full_desc": "Our team arrives to transform your space into a pet-safe celebration zone. We handle décor installation, create safe zones (no balloons near mouthy dogs), and set up the perfect photo corner.",
        "questions": [
            "Any areas that should stay pet-free?",
            "Do you want a photo corner setup?",
            "Cleanup service needed after?"
        ],
        "creates_ticket_type": "party_setup",
        "response_time": "Within 4 hours",
        "persona_fit": {
            "anxious": 0.7,       # Home is comfortable
            "shy": 0.8,
            "elegant": 0.9,
            "calm": 0.8
        },
        "breed_boost": {},
        "size_boost": {
            "small": 0.1,        # Small dogs often prefer home
            "medium": 0.0,
            "large": -0.1        # Large dogs might prefer outdoor
        },
        "tags": []
    },
    {
        "id": "pet-photographer-shoot",
        "name": "Pet Photographer + Shoot",
        "icon": "📸",
        "short_desc": "Professional photos styled to your pet's personality",
        "full_desc": "Book a professional pet photographer who adapts to your pet's temperament. Glam indoor shoots for elegant pets, action outdoor shots for energetic ones, short calm sessions for shy dogs.",
        "questions": [
            "Indoor styled shoot or outdoor action?",
            "Any specific moments you want captured?",
            "How long can your pet stay focused?"
        ],
        "creates_ticket_type": "photography",
        "response_time": "Within 24 hours",
        "persona_fit": {
            "photo_ready": 1.0,
            "elegant": 0.9,
            "playful": 0.8,
            "energetic": 0.7,
            "anxious": 0.3,      # Might struggle with cameras
            "shy": 0.4
        },
        "breed_boost": {
            "Shih Tzu": 0.2,
            "Pomeranian": 0.2,
            "Golden Retriever": 0.1,
            "Labrador": 0.1
        },
        "size_boost": {},
        "tags": ["popular"]
    },
    {
        "id": "pet-friendly-venue",
        "name": "Pet-Friendly Venue Coordination",
        "icon": "🍽️",
        "short_desc": "We book, brief staff, arrange pet menu & water station",
        "full_desc": "Mira finds and books a pet-friendly café or restaurant, reserves the right table, arranges a pet menu, sets up a water station, and briefs staff on your pet's needs.",
        "questions": [
            "Any cuisine preference for the humans?",
            "How many guests (humans + pets)?",
            "Any specific area of the city?"
        ],
        "creates_ticket_type": "venue_booking",
        "response_time": "Within 6 hours",
        "persona_fit": {
            "social": 0.9,
            "friendly": 0.9,
            "playful": 0.8,
            "anxious": 0.2,      # Venues can be overwhelming
            "shy": 0.3
        },
        "breed_boost": {
            "Golden Retriever": 0.2,
            "Labrador": 0.2,
            "Beagle": 0.1
        },
        "size_boost": {
            "large": 0.1,        # Big dogs do well in open venues
            "medium": 0.0,
            "small": -0.1        # Small dogs might get overwhelmed
        },
        "tags": []
    },
    {
        "id": "playdate-party",
        "name": "Playdate Party",
        "icon": "🐕",
        "short_desc": "Invite matching dogs, coordinate park/café, timed slots",
        "full_desc": "Mira matches your pet with compatible dogs based on size and temperament, coordinates a park or pet café booking, and manages timed play slots to avoid chaos.",
        "questions": [
            "How many dog friends should we invite?",
            "Park picnic or pet café?",
            "Any dogs your pet already knows?"
        ],
        "creates_ticket_type": "playdate_party",
        "response_time": "Within 6 hours",
        "persona_fit": {
            "playful": 1.0,
            "social": 1.0,
            "energetic": 0.9,
            "friendly": 0.9,
            "anxious": 0.1,      # Not suitable
            "shy": 0.2,
            "warms_up_slowly": 0.3
        },
        "breed_boost": {
            "Golden Retriever": 0.3,
            "Labrador": 0.3,
            "Beagle": 0.2,
            "Cocker Spaniel": 0.2
        },
        "size_boost": {
            "large": 0.2,
            "medium": 0.1,
            "small": -0.1
        },
        "tags": ["popular"]
    },
    {
        "id": "surprise-moment",
        "name": "Surprise Moment Orchestration",
        "icon": "🎁",
        "short_desc": "Timed delivery, setup, optional photographer - we surprise them",
        "full_desc": "Plan a surprise celebration moment. We coordinate timed delivery when the family is home, handle setup, include a handwritten note, and optionally arrange a photographer to capture reactions.",
        "questions": [
            "What time works best for the surprise?",
            "Should we include a photographer?",
            "Any special message for the card?"
        ],
        "creates_ticket_type": "surprise_delivery",
        "response_time": "Within 4 hours",
        "persona_fit": {
            "elegant": 0.8,
            "playful": 0.8,
            "calm": 0.7
        },
        "breed_boost": {},
        "size_boost": {},
        "tags": []
    },
    {
        "id": "quiet-celebration",
        "name": "Quiet Celebration Plan",
        "icon": "🤫",
        "short_desc": "Low stimulation, calm treats, gentle enrichment",
        "full_desc": "For pets who get overwhelmed easily. We plan a low-key celebration with calm enrichment activities, gentle treats, no loud noises or crowds, and delivery timed to avoid door chaos.",
        "questions": [
            "Any specific triggers we should avoid?",
            "Preferred enrichment activities?",
            "Best time for calm delivery?"
        ],
        "creates_ticket_type": "quiet_celebration",
        "response_time": "Within 4 hours",
        "persona_fit": {
            "anxious": 1.0,
            "shy": 1.0,
            "warms_up_slowly": 0.9,
            "calm": 0.8,
            "senior": 0.9,
            "playful": 0.2,      # Not the right fit
            "energetic": 0.1
        },
        "breed_boost": {
            "Shih Tzu": 0.1,     # Often prefer calm
            "Cavalier King Charles": 0.1
        },
        "size_boost": {
            "small": 0.1,
            "medium": 0.0,
            "large": -0.1
        },
        "tags": ["thoughtful"]
    }
]


# ═══════════════════════════════════════════════════════════════════════════════
# SERVICE SELECTION LOGIC
# ═══════════════════════════════════════════════════════════════════════════════

def get_celebrate_services_for_pet(pet_data: dict, intent_context: dict = None, limit: int = 3) -> list:
    """
    Select the best 2-3 services for this pet based on their soul/breed/size.
    
    Args:
        pet_data: {
            "name": "Mystique",
            "breed": "Shih Tzu",
            "size": "small",
            "soul_traits": ["elegant", "warms_up_slowly", "photo_ready"],
            "allergies": ["grain"]
        }
        intent_context: {
            "subcategory": "birthday_cakes",  # or None
            "event": "birthday",               # or "gotcha_day", "party"
            "last_action": "clicked_party_setup"
        }
        limit: Max services to return (default 3)
    
    Returns:
        List of service cards sorted by fit score
    """
    scored_services = []
    
    soul_traits = set(pet_data.get("soul_traits", []))
    breed = pet_data.get("breed", "")
    size = pet_data.get("size", "medium")
    
    for service in CELEBRATE_SERVICES:
        score = 50  # Base score
        
        # 1. Score by persona fit (soul traits)
        for trait, boost in service.get("persona_fit", {}).items():
            if trait in soul_traits:
                score += boost * 30  # Max +30 per matching trait
        
        # 2. Score by breed boost
        breed_boost = service.get("breed_boost", {}).get(breed, 0)
        score += breed_boost * 20
        
        # 3. Score by size boost
        size_boost = service.get("size_boost", {}).get(size, 0)
        score += size_boost * 15
        
        # 4. Intent context boost
        if intent_context:
            # If user clicked a related action, boost that service
            if intent_context.get("last_action") == "clicked_party_setup" and service["id"] == "at-home-party-setup":
                score += 25
            if intent_context.get("event") == "birthday" and "birthday" in service["name"].lower():
                score += 15
            if intent_context.get("subcategory") == "photography" and service["id"] == "pet-photographer-shoot":
                score += 25
        
        # 5. Popular tag boost
        if "popular" in service.get("tags", []):
            score += 5
        
        scored_services.append({
            **service,
            "_score": score,
            "_why": f"Matched: {', '.join(soul_traits & set(service.get('persona_fit', {}).keys())) or 'general fit'}"
        })
    
    # Sort by score descending
    scored_services.sort(key=lambda x: x["_score"], reverse=True)
    
    # Return top N
    return scored_services[:limit]


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER: Check if DB has overrides (for future use)
# ═══════════════════════════════════════════════════════════════════════════════

def get_services_with_db_override(pillar: str, db=None):
    """
    Future: Check if DB has service overrides, use them if present.
    For now, always returns the Python library.
    """
    # TODO: When ready, add:
    # if db and db.service_overrides.find_one({"pillar": pillar}):
    #     return list(db.service_overrides.find({"pillar": pillar}))
    
    if pillar == "celebrate":
        return CELEBRATE_SERVICES
    
    # Other pillars to be added
    return []
