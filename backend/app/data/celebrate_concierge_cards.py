"""
Celebrate Concierge Card Library
================================

10 cards total for the Celebrate pillar:
- 5 Concierge Products (bespoke deliverables Mira creates/coordinates)
- 5 Concierge Services (arrangements Mira executes)

ALL cards create tickets. No add-to-cart. No SKU dependency.

Selection Rules:
- Show 3-5 cards total per pet
- 2-3 Concierge Products
- 1-2 Concierge Services
- 0-1 Micro-question (if profile thin)

Persona-based scoring (weights, not hard switches):
- Playful/social → Outdoor Pack, End-to-End, Photographer (action), Venue
- Elegant/photo-ready → Cake Design, Photo Kit, Photographer (posed), At-Home
- Anxious/noise-sensitive → Quiet Plan, At-Home Safe Zones
- Senior/comfort-first → Comfort-first planning, Senior-friendly options
"""

from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# CONCIERGE PRODUCTS (Bespoke Deliverables)
# CTA: "Create for {Pet}" → Creates Ticket
# ═══════════════════════════════════════════════════════════════════════════════

CELEBRATE_CONCIERGE_PRODUCTS: List[Dict[str, Any]] = [
    {
        "id": "celebrate_custom_cake_design",
        "type": "concierge_product",
        "name": "Custom Celebration Cake Design",
        "description": "A cake designed around {pet_name} - theme, portion, food rules, timed delivery.",
        "icon": "🎂",
        "why_concierge": "Custom constraints + coordination",
        "cta_text": "Create cake design",
        "cta_action": "create_ticket",
        "ticket_category": "celebrate_cake",
        "why_phrases": {
            "elegant": "Instagram-worthy design for elegant pups",
            "pampered": "Luxe cake for pampered royalty",
            "foodie": "Irresistible flavors for food lovers",
            "sensitive_tummy": "Gentle recipe for sensitive tummies",
            "playful": "Fun design for playful celebrations",
            "default": "Custom cake tailored to your pet"
        },
        "ticket_questions": [
            {"id": "occasion", "question": "What's the occasion + date/time?", "type": "text"},
            {"id": "food_rules", "question": "Any food rules (allergies/sensitive tummy) and preferred protein?", "type": "text"},
            {"id": "portion_size", "question": "Portion size (small/medium/large) based on pet size + guests?", "type": "choice", "options": ["Small", "Medium", "Large"]},
            {"id": "theme_vibe", "question": "Theme vibe: playful or elegant?", "type": "choice", "options": ["Playful", "Elegant"]}
        ],
        "persona_affinity": {
            "elegant": 0.9,
            "photo_ready": 0.8,
            "pampered": 0.85,
            "foodie": 0.7,
            "playful": 0.5,
            "anxious": 0.4,  # Still works, just calmer design
        },
        "size_affinity": {"small": 0.9, "medium": 0.8, "large": 0.7},
        "default_score": 70  # High default - cakes are universal
    },
    {
        "id": "celebrate_bespoke_box",
        "type": "concierge_product",
        "name": "Bespoke Celebration Box for {pet_name}",
        "description": "A personalised box built around {pet_name}'s persona - treats, props, accessories.",
        "icon": "🎁",
        "why_concierge": "Curated to pet personality",
        "cta_text": "Create celebration box",
        "cta_action": "create_ticket",
        "ticket_category": "celebrate_box",
        "why_phrases": {
            "elegant": "Curated elegance in a box",
            "pampered": "Premium picks for pampered pets",
            "playful": "Fun-packed box for playful pups",
            "anxious": "Calming treats + comfort items",
            "default": "Personalized celebration essentials"
        },
        "ticket_questions": [
            {"id": "vibe", "question": "Playful or elegant vibe?", "type": "choice", "options": ["Playful", "Elegant"]},
            {"id": "food_rules", "question": "Any food rules/allergies?", "type": "text"},
            {"id": "delivery", "question": "Delivery date/time + city/area?", "type": "text"},
            {"id": "addons", "question": "Any add-on: keepsake / outfit / photo props?", "type": "multi_choice", "options": ["Keepsake", "Outfit", "Photo props", "None"]}
        ],
        "persona_affinity": {
            "elegant": 0.85,
            "pampered": 0.9,
            "photo_ready": 0.75,
            "playful": 0.6,
            "social": 0.5,
        },
        "size_affinity": {"small": 0.85, "medium": 0.8, "large": 0.75},
        "default_score": 65
    },
    {
        "id": "celebrate_outdoor_pack",
        "type": "concierge_product",
        "name": "Outdoor Party Pack Built for Chaos",
        "description": "Durable, safe, outdoor-ready celebration kit + cleanup essentials for active celebrations.",
        "icon": "🏕️",
        "why_concierge": "Curated for outdoor durability + safety",
        "cta_text": "Create outdoor pack",
        "cta_action": "create_ticket",
        "ticket_category": "celebrate_outdoor",
        "why_phrases": {
            "playful": "Adventure-ready for energetic pups",
            "social": "Party essentials for social butterflies",
            "energetic": "Built for high-energy celebrations",
            "default": "Outdoor-ready celebration essentials"
        },
        "ticket_questions": [
            {"id": "location", "question": "Outdoor location (home terrace/park/café) and date/time?", "type": "text"},
            {"id": "guests", "question": "How many humans + dogs?", "type": "text"},
            {"id": "triggers", "question": "Any triggers to avoid (noise, balloons, crowd)?", "type": "text"},
            {"id": "food_rules", "question": "Any food rules/allergies?", "type": "text"}
        ],
        "persona_affinity": {
            "playful": 0.95,
            "energetic": 0.95,
            "social": 0.9,
            "adventurous": 0.85,
            "elegant": 0.2,  # Not a fit
            "anxious": 0.15,  # Not recommended
        },
        "size_affinity": {"small": 0.5, "medium": 0.85, "large": 0.95},
        "breed_affinity": ["labrador", "golden retriever", "beagle", "border collie", "australian shepherd"],
        "default_score": 50  # Only for active dogs
    },
    {
        "id": "celebrate_photo_kit",
        "type": "concierge_product",
        "name": "Styled Photo Moment Kit",
        "description": "Theme-matched backdrop + props + simple setup guide, all pet-safe.",
        "icon": "📸",
        "why_concierge": "Curated for aesthetic + pet comfort",
        "cta_text": "Create photo kit",
        "cta_action": "create_ticket",
        "ticket_category": "celebrate_photo_kit",
        "why_phrases": {
            "photo_ready": "Perfect props for camera-ready pups",
            "elegant": "Sophisticated setup for elegant portraits",
            "calm": "Minimal props for relaxed posing",
            "anxious": "Low-stress setup for nervous pets",
            "default": "Instagram-worthy photo essentials"
        },
        "ticket_questions": [
            {"id": "setting", "question": "Indoor or outdoor photos?", "type": "choice", "options": ["Indoor", "Outdoor", "Both"]},
            {"id": "style", "question": "Style: glam/elegant vs fun/playful?", "type": "choice", "options": ["Glam/Elegant", "Fun/Playful"]},
            {"id": "comfort", "question": "Pet comfort: ok with props or prefers minimal?", "type": "choice", "options": ["Ok with props", "Prefers minimal"]},
            {"id": "delivery", "question": "Delivery date/time?", "type": "text"}
        ],
        "persona_affinity": {
            "photo_ready": 0.95,
            "elegant": 0.9,
            "pampered": 0.85,
            "calm": 0.7,
            "playful": 0.6,
            "anxious": 0.3,  # Minimal props version
        },
        "size_affinity": {"small": 0.9, "medium": 0.8, "large": 0.7},
        "default_score": 60
    },
    {
        "id": "celebrate_keepsake_set",
        "type": "concierge_product",
        "name": "Keepsake Memory Set",
        "description": "Pawprint + name charm + memory note/box concept, curated for {pet_name}.",
        "icon": "💝",
        "why_concierge": "Personalized keepsake creation",
        "cta_text": "Create keepsake",
        "cta_action": "create_ticket",
        "ticket_category": "celebrate_keepsake",
        "why_phrases": {
            "senior": "Treasured memories for senior companions",
            "pampered": "Luxe keepsake for pampered pets",
            "elegant": "Elegant memory piece",
            "default": "Personalized memory keepsake"
        },
        "ticket_questions": [
            {"id": "type", "question": "Keepsake type: pawprint / charm / memory box?", "type": "choice", "options": ["Pawprint", "Charm", "Memory Box", "All"]},
            {"id": "engraving", "question": "Name/engraving text (if any)?", "type": "text"},
            {"id": "occasion", "question": "Occasion/date (for inscription)?", "type": "text"},
            {"id": "delivery", "question": "Delivery address + timeline?", "type": "text"}
        ],
        "persona_affinity": {
            "pampered": 0.85,
            "elegant": 0.8,
            "senior": 0.9,  # Memory keepsakes especially meaningful
            "calm": 0.6,
            "playful": 0.5,
        },
        "size_affinity": {"small": 0.85, "medium": 0.8, "large": 0.8},
        "default_score": 55
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# CONCIERGE SERVICES (Arrangements Mira Executes)
# CTA: "Request" → Creates Ticket
# ═══════════════════════════════════════════════════════════════════════════════

CELEBRATE_CONCIERGE_SERVICES: List[Dict[str, Any]] = [
    {
        "id": "celebrate_end_to_end",
        "type": "concierge_service",
        "name": "Plan the Celebration End-to-End",
        "description": "Full plan: theme, cake, moments, schedule, add-ons, all coordination handled.",
        "icon": "🎊",
        "why_concierge": "Complete celebration orchestration",
        "cta_text": "Request planning",
        "cta_action": "create_ticket",
        "ticket_category": "celebrate_planning",
        "why_phrases": {
            "social": "Full bash for social butterflies",
            "playful": "Action-packed party planning",
            "elegant": "Sophisticated celebration design",
            "anxious": "Calm celebration with safe zones",
            "pampered": "Luxe party for pampered pets",
            "default": "End-to-end celebration planning"
        },
        "ticket_questions": [
            {"id": "style", "question": "Playful party or elegant party?", "type": "choice", "options": ["Playful", "Elegant", "Mix of both"]},
            {"id": "datetime", "question": "Date/time + city/area?", "type": "text"},
            {"id": "venue", "question": "At home or venue?", "type": "choice", "options": ["At home", "Venue", "Not sure yet"]},
            {"id": "guests", "question": "How many humans + dogs (if any)?", "type": "text"}
        ],
        "persona_affinity": {
            "social": 0.9,
            "playful": 0.85,
            "energetic": 0.8,
            "pampered": 0.85,
            "elegant": 0.8,
            "anxious": 0.4,  # Can adapt to quiet version
            "senior": 0.6,  # Shorter, comfort-first version
        },
        "size_affinity": {"small": 0.8, "medium": 0.85, "large": 0.9},
        "default_score": 75  # High value service
    },
    {
        "id": "celebrate_home_setup",
        "type": "concierge_service",
        "name": "At-Home Setup + Safe Zones",
        "description": "Calm, safe setup with a simple schedule and pet comfort plan.",
        "icon": "🏠",
        "why_concierge": "Pet-safe environment planning",
        "cta_text": "Request setup",
        "cta_action": "create_ticket",
        "ticket_category": "celebrate_home_setup",
        "why_phrases": {
            "anxious": "Safe zones + calm environment",
            "senior": "Comfortable setup for senior pets",
            "calm": "Peaceful celebration at home",
            "warms_up_slowly": "Gentle intro for cautious pets",
            "default": "Pet-safe home celebration setup"
        },
        "ticket_questions": [
            {"id": "space", "question": "Indoor/outdoor + approximate space size?", "type": "text"},
            {"id": "comfort", "question": "Pet comfort: anxious/ok with guests?", "type": "choice", "options": ["Anxious - needs calm setup", "Ok with guests", "Warms up slowly"]},
            {"id": "duration", "question": "Time window (30 mins / 1 hr / 2 hrs)?", "type": "choice", "options": ["30 mins", "1 hour", "2 hours"]},
            {"id": "must_haves", "question": "Any must-haves: photo corner / cake moment / surprise?", "type": "text"}
        ],
        "persona_affinity": {
            "anxious": 0.9,  # Perfect for anxious pets
            "calm": 0.85,
            "elegant": 0.8,
            "warms_up_slowly": 0.9,
            "senior": 0.85,
            "playful": 0.5,
            "social": 0.4,
        },
        "size_affinity": {"small": 0.9, "medium": 0.8, "large": 0.7},
        "default_score": 60
    },
    {
        "id": "celebrate_photographer",
        "type": "concierge_service",
        "name": "Photographer Booking + Shoot Plan",
        "description": "Book photographer + plan the session around {pet_name}'s temperament.",
        "icon": "📷",
        "why_concierge": "Pet-aware photography coordination",
        "cta_text": "Book photographer",
        "cta_action": "create_ticket",
        "ticket_category": "celebrate_photography",
        "why_phrases": {
            "photo_ready": "Pro shoot for camera-ready pets",
            "elegant": "Glamorous portrait session",
            "anxious": "Patience-first, low-stress shoot",
            "playful": "Action shots + candid moments",
            "default": "Professional pet photography"
        },
        "ticket_questions": [
            {"id": "location", "question": "Home or outdoor location + city/area?", "type": "text"},
            {"id": "style", "question": "Pet style: action shots vs posed portraits?", "type": "choice", "options": ["Action shots", "Posed portraits", "Mix of both"]},
            {"id": "sensitivities", "question": "Any sensitivities (shy around strangers/flash/noise)?", "type": "text"},
            {"id": "timing", "question": "Preferred time window (morning/golden hour/evening)?", "type": "choice", "options": ["Morning", "Golden hour", "Evening", "Flexible"]}
        ],
        "persona_affinity": {
            "photo_ready": 0.95,
            "elegant": 0.85,
            "playful": 0.8,  # Action shots
            "energetic": 0.75,  # Action shots
            "calm": 0.7,
            "anxious": 0.4,  # Short session, familiar location
            "senior": 0.6,  # Seated portraits
        },
        "size_affinity": {"small": 0.85, "medium": 0.85, "large": 0.85},
        "default_score": 65
    },
    {
        "id": "celebrate_venue",
        "type": "concierge_service",
        "name": "Pet-Friendly Venue Reservation",
        "description": "Reserve the right table and prep staff for {pet_name}'s celebration.",
        "icon": "🍽️",
        "why_concierge": "Venue vetting + pet-specific prep",
        "cta_text": "Book venue",
        "cta_action": "create_ticket",
        "ticket_category": "celebrate_venue",
        "why_phrases": {
            "social": "Lively venue for social celebrations",
            "adventurous": "Unique venue for adventurous pets",
            "playful": "Fun venue for playful gatherings",
            "calm": "Quiet corner reserved + staff briefed",
            "default": "Pet-friendly venue + staff briefed"
        },
        "ticket_questions": [
            {"id": "location", "question": "City/area + preferred time/date?", "type": "text"},
            {"id": "guests", "question": "Number of humans + pets?", "type": "text"},
            {"id": "vibe", "question": "Quiet corner vs lively vibe?", "type": "choice", "options": ["Quiet corner", "Lively vibe", "No preference"]},
            {"id": "special", "question": "Any special asks: water bowl, pet menu, cake permission?", "type": "text"}
        ],
        "persona_affinity": {
            "social": 0.9,
            "adventurous": 0.85,
            "playful": 0.8,
            "calm": 0.6,
            "anxious": 0.2,  # Not recommended
            "senior": 0.4,  # Prefer home
        },
        "size_affinity": {"small": 0.9, "medium": 0.8, "large": 0.6},  # Large dogs harder to accommodate
        "default_score": 55
    },
    {
        "id": "celebrate_quiet_plan",
        "type": "concierge_service",
        "name": "Quiet Celebration Plan",
        "description": "Low-stimulation plan: calm treats, gentle enrichment, controlled guest flow for {pet_name}.",
        "icon": "🤫",
        "why_concierge": "Anxiety-aware celebration design",
        "cta_text": "Request quiet plan",
        "cta_action": "create_ticket",
        "ticket_category": "celebrate_quiet",
        "why_phrases": {
            "anxious": "Low-stimulation for nervous pets",
            "warms_up_slowly": "Controlled guest flow for cautious pets",
            "noise_sensitive": "Noise-free celebration design",
            "senior": "Gentle celebration for senior pets",
            "calm": "Peaceful, relaxed celebration",
            "default": "Quiet, low-stress celebration"
        },
        "ticket_questions": [
            {"id": "triggers", "question": "Known triggers (doorbell, strangers, balloons, loud music)?", "type": "text"},
            {"id": "style", "question": "Preferred celebration style: solo moment vs 1-2 guests?", "type": "choice", "options": ["Solo moment", "1-2 close guests", "Small gathering (3-5)"]},
            {"id": "timing", "question": "Best time of day for your pet (post-walk/after nap)?", "type": "text"},
            {"id": "food", "question": "Any food rules/sensitive tummy?", "type": "text"}
        ],
        "persona_affinity": {
            "anxious": 0.98,  # Primary fit
            "warms_up_slowly": 0.95,
            "noise_sensitive": 0.95,
            "calm": 0.8,
            "senior": 0.85,
            "playful": 0.2,  # Not a fit
            "social": 0.15,  # Not a fit
        },
        "size_affinity": {"small": 0.9, "medium": 0.85, "large": 0.8},
        "default_score": 40  # Only shown when traits match
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# MICRO-QUESTIONS (For Thin Profiles)
# ═══════════════════════════════════════════════════════════════════════════════

CELEBRATE_MICRO_QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": "party_style",
        "question": "What style celebration would {pet_name} love?",
        "options": ["Playful & colorful", "Elegant & minimal", "Outdoor adventure", "Quiet & cozy"],
        "icon": "🎉",
        "maps_to_traits": {
            "Playful & colorful": ["playful", "social", "energetic"],
            "Elegant & minimal": ["elegant", "calm", "photo_ready"],
            "Outdoor adventure": ["adventurous", "playful", "energetic"],
            "Quiet & cozy": ["calm", "anxious", "warms_up_slowly"]
        }
    },
    {
        "id": "guest_comfort",
        "question": "How does {pet_name} feel about new people?",
        "options": ["Loves everyone!", "Takes time to warm up", "Prefers familiar faces only"],
        "icon": "👋",
        "maps_to_traits": {
            "Loves everyone!": ["social", "friendly"],
            "Takes time to warm up": ["warms_up_slowly", "cautious"],
            "Prefers familiar faces only": ["anxious", "selective"]
        }
    },
    {
        "id": "activity_level",
        "question": "What's {pet_name}'s energy like during special moments?",
        "options": ["Bouncing off walls!", "Calm and composed", "Depends on the day"],
        "icon": "⚡",
        "maps_to_traits": {
            "Bouncing off walls!": ["energetic", "playful"],
            "Calm and composed": ["calm", "elegant"],
            "Depends on the day": []  # No strong trait signal
        }
    }
]


# ═══════════════════════════════════════════════════════════════════════════════
# SCORING & SELECTION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def score_card_for_pet(
    card: Dict[str, Any],
    soul_traits: List[str],
    breed: str,
    size: str,
    age_band: str = "",
    event_context: Optional[Dict] = None
) -> float:
    """
    Score a concierge card based on pet profile.
    Returns score 0-100. Higher = better fit.
    
    Uses weights, not hard switches - traits boost but don't exclude.
    
    Senior Comfort Modifier:
    - Boosts: At-Home Setup, Quiet Plan, Keepsake, Photographer (posed)
    - Penalizes: Outdoor Pack, Venue (unless clearly social)
    """
    score = card.get("default_score", 50)
    card_id = card.get("id", "")
    
    # 1. Soul trait affinity (biggest weight: +/- 30)
    persona_affinity = card.get("persona_affinity", {})
    trait_boost = 0
    matched_traits = []
    
    for trait in soul_traits:
        trait_lower = trait.lower().replace(" ", "_").replace("-", "_")
        
        # Check for exact match or partial match
        for affinity_trait, weight in persona_affinity.items():
            if trait_lower == affinity_trait or trait_lower in affinity_trait or affinity_trait in trait_lower:
                trait_boost += (weight - 0.5) * 40  # Convert 0-1 to -20 to +20
                matched_traits.append(affinity_trait)
                break
    
    score += min(trait_boost, 30)  # Cap trait boost at +30
    
    # 2. Size affinity (+/- 10)
    size_affinity = card.get("size_affinity", {})
    if size and size.lower() in size_affinity:
        size_weight = size_affinity[size.lower()]
        score += (size_weight - 0.5) * 20  # Convert to -10 to +10
    
    # 3. Breed affinity (+10 if match)
    breed_affinity = card.get("breed_affinity", [])
    if breed and breed_affinity:
        breed_lower = breed.lower()
        if any(b.lower() in breed_lower for b in breed_affinity):
            score += 10
    
    # 4. SENIOR COMFORT MODIFIER (scoring-based, not rule-based)
    if age_band == "senior":
        # Check if dog is also social/energetic (override penalty)
        is_still_active = any(t.lower() in ["social", "energetic", "playful"] for t in soul_traits)
        
        # Boost comfort-first cards
        comfort_cards = [
            "celebrate_home_setup",      # At-Home Setup + Safe Zones
            "celebrate_quiet_plan",      # Quiet Celebration Plan  
            "celebrate_keepsake_set",    # Keepsake Memory Set (meaningful for seniors)
            "celebrate_custom_cake_design",  # Can be adapted to soft/easy texture
        ]
        if card_id in comfort_cards:
            score += 15  # Strong boost for comfort options
        
        # Boost photographer but prefer "posed" style
        if card_id == "celebrate_photographer":
            score += 10  # Still good, just shorter sessions
        
        # Penalize high-stimulation cards (unless dog is still active)
        high_stimulation_cards = [
            "celebrate_outdoor_pack",    # Built for chaos - not ideal
            "celebrate_venue",           # Venue can be tiring
        ]
        if card_id in high_stimulation_cards:
            if is_still_active:
                score -= 5   # Small penalty - dog can still handle it
            else:
                score -= 20  # Larger penalty - prefer home/quiet options
        
        # Use persona affinity senior weight if defined
        if "senior" in persona_affinity:
            score += persona_affinity["senior"] * 10
    
    # 5. Event context boost
    if event_context:
        event_type = event_context.get("event_type", "")
        if event_type == "birthday" and "cake" in card_id:
            score += 10
        days_away = event_context.get("event_days_away", 999)
        if days_away <= 7:  # Within a week
            score += 5  # Urgency boost
    
    return max(0, min(100, score))



def derive_traits_from_profile(pet_data: Dict[str, Any]) -> List[str]:
    """
    Derive personality traits from multiple sources in pet profile.
    
    Sources checked:
    - doggy_soul_answers (travel_anxiety, temperament, etc.)
    - personality (anxiety_triggers, behavior)
    - temperament
    - soul (love_language, etc.)
    
    Returns: List of derived trait strings
    """
    derived = []
    
    # Check doggy_soul_answers for anxiety indicators
    doggy_soul = pet_data.get("doggy_soul_answers") or {} or {}
    
    travel_anxiety = doggy_soul.get("travel_anxiety", "").lower()
    if travel_anxiety in ["high", "severe", "moderate", "mild"]:
        derived.append("anxious")
        derived.append("warms_up_slowly")
    
    motion_sickness = doggy_soul.get("motion_sickness", "").lower()
    if motion_sickness in ["often", "always", "sometimes"]:
        derived.append("anxious")
    
    # Check temperament
    temperament = pet_data.get("temperament", "").lower() if pet_data.get("temperament") else ""
    if temperament:
        if any(t in temperament for t in ["anxious", "nervous", "shy", "fearful"]):
            derived.append("anxious")
            derived.append("warms_up_slowly")
        elif any(t in temperament for t in ["playful", "energetic", "active"]):
            derived.append("playful")
            derived.append("energetic")
        elif any(t in temperament for t in ["calm", "gentle", "relaxed"]):
            derived.append("calm")
    
    # Check personality for anxiety triggers
    personality = pet_data.get("personality", {}) or {}
    anxiety_triggers = personality.get("anxiety_triggers", []) or []
    if anxiety_triggers and len(anxiety_triggers) > 0:
        derived.append("anxious")
    
    # Check behavior with others
    behavior_dogs = personality.get("behavior_with_dogs", "").lower()
    behavior_humans = personality.get("behavior_with_humans", "").lower()
    if any(b in behavior_dogs for b in ["friendly", "social", "playful"]):
        derived.append("social")
    if any(b in behavior_humans for b in ["friendly", "social"]):
        derived.append("social")
    
    # Check soul data
    soul = pet_data.get("soul") or {} or {}
    love_language = soul.get("love_language", "").lower()
    if love_language in ["velcro", "clingy"]:
        derived.append("pampered")
    
    # Dedupe and return
    return list(set(derived))



def select_concierge_cards(
    pet_data: Dict[str, Any],
    event_context: Optional[Dict] = None,
    products_count: int = 3,
    services_count: int = 2
) -> Dict[str, List[Dict]]:
    """
    Select and rank concierge cards for a pet.
    
    Returns:
    {
        "concierge_products": [...],  # 2-3 cards
        "concierge_services": [...],  # 1-2 cards
    }
    
    Never returns empty - uses breed/size defaults for thin profiles.
    Now includes location-aware personalization.
    """
    soul_traits = pet_data.get("soul_traits", []) or []
    breed = pet_data.get("breed", "") or ""
    size = pet_data.get("size", "medium") or "medium"
    age_band = pet_data.get("age_band", "") or ""
    pet_name = pet_data.get("name", "your pet")
    user_location = pet_data.get("user_location")  # 🌍 Location for personalization
    
    # ENHANCED: Derive traits from multiple sources (doggy_soul_answers, temperament, etc.)
    derived_traits = derive_traits_from_profile(pet_data)
    
    # Merge soul_traits with derived traits
    all_traits = list(set(soul_traits + derived_traits))
    
    city = user_location.get("city") if user_location else None
    logger.info(f"[CELEBRATE CURATE] Pet: {pet_name}, City: {city}, Traits: {all_traits}")
    
    # If profile is still thin, add breed-based default traits
    if len(all_traits) < 2:
        all_traits = list(all_traits) + get_breed_default_traits(breed, size)
    
    # Use merged traits for scoring
    soul_traits = all_traits
    
    # Score all products
    scored_products = []
    for card in CELEBRATE_CONCIERGE_PRODUCTS:
        score = score_card_for_pet(card, soul_traits, breed, size, age_band, event_context)
        card_copy = {**card}
        card_copy["_score"] = score
        card_copy["_matched_traits"] = [t for t in soul_traits if t.lower() in str(card.get("persona_affinity", {})).lower()]
        
        # Personalize text
        card_copy["name"] = card["name"].replace("{pet_name}", pet_name)
        card_copy["description"] = card["description"].replace("{pet_name}", pet_name)
        card_copy["cta_text"] = card["cta_text"].replace("{pet_name}", pet_name)
        
        scored_products.append(card_copy)
    
    # Score all services
    scored_services = []
    for card in CELEBRATE_CONCIERGE_SERVICES:
        score = score_card_for_pet(card, soul_traits, breed, size, age_band, event_context)
        card_copy = {**card}
        card_copy["_score"] = score
        card_copy["_matched_traits"] = [t for t in soul_traits if t.lower() in str(card.get("persona_affinity", {})).lower()]
        
        # Personalize text
        card_copy["name"] = card["name"].replace("{pet_name}", pet_name)
        card_copy["description"] = card["description"].replace("{pet_name}", pet_name)
        card_copy["cta_text"] = card["cta_text"].replace("{pet_name}", pet_name)
        
        scored_services.append(card_copy)
    
    # Sort by score
    scored_products.sort(key=lambda x: x["_score"], reverse=True)
    scored_services.sort(key=lambda x: x["_score"], reverse=True)
    
    # Select top cards with MINIMUM guarantees (user requirement: 2-3 products + 1-2 services = 3-5 total)
    # Ensure we always have at least 2 products and 1 service
    min_products = 2
    min_services = 1
    
    selected_products = scored_products[:max(products_count, min_products)]
    selected_services = scored_services[:max(services_count, min_services)]
    
    # Ensure minimums are met even if scores are low
    if len(selected_products) < min_products and len(scored_products) >= min_products:
        selected_products = scored_products[:min_products]
    if len(selected_services) < min_services and len(scored_services) >= min_services:
        selected_services = scored_services[:min_services]
    
    # Generate "why for pet" explanations with location awareness
    for card in selected_products + selected_services:
        card["why_for_pet"] = generate_why_explanation(card, pet_name, soul_traits, user_location)
    
    logger.info(f"[CONCIERGE_SELECT] Selected {len(selected_products)} products, {len(selected_services)} services for {pet_name}")
    
    return {
        "concierge_products": selected_products,
        "concierge_services": selected_services
    }


def get_breed_default_traits(breed: str, size: str) -> List[str]:
    """
    Get default personality traits based on breed/size for thin profiles.
    """
    breed_lower = (breed or "").lower()
    
    # Active breeds
    active_breeds = ["labrador", "golden retriever", "beagle", "border collie", "australian shepherd", "husky", "boxer"]
    if any(b in breed_lower for b in active_breeds):
        return ["playful", "energetic", "social"]
    
    # Small elegant breeds
    elegant_breeds = ["shih tzu", "maltese", "pomeranian", "yorkie", "cavalier", "bichon"]
    if any(b in breed_lower for b in elegant_breeds):
        return ["elegant", "pampered", "photo_ready"]
    
    # Anxious-prone breeds
    anxious_breeds = ["chihuahua", "greyhound", "whippet", "italian greyhound"]
    if any(b in breed_lower for b in anxious_breeds):
        return ["anxious", "warms_up_slowly", "calm"]
    
    # Large calm breeds
    calm_large = ["mastiff", "great dane", "newfoundland", "bernese", "saint bernard"]
    if any(b in breed_lower for b in calm_large):
        return ["calm", "gentle", "social"]
    
    # Size-based defaults
    if size == "small":
        return ["pampered", "calm"]
    elif size == "large":
        return ["social", "playful"]
    
    return ["friendly"]  # Universal default


def generate_why_explanation(card: Dict, pet_name: str, soul_traits: List[str] = None, user_location: Dict = None) -> str:
    """
    Generate a personalized "why this card" explanation.
    Uses card-specific why_phrases if available, otherwise falls back to generic.
    Now includes location awareness for local services.
    """
    matched = card.get("_matched_traits", [])
    actual_traits = soul_traits or []
    all_traits = list(set(matched + (actual_traits or [])))
    
    # Get city for location-aware messaging
    city = user_location.get("city") if user_location else None
    
    # First check for card-specific why_phrases
    why_phrases = card.get("why_phrases", {})
    
    if why_phrases:
        # Try to find a matching trait
        for trait in all_traits:
            trait_lower = trait.lower().replace(" ", "_")
            if trait_lower in why_phrases:
                explanation = why_phrases[trait_lower]
                # Add location context for services
                if city and card.get("type") == "concierge_service":
                    if "near" not in explanation.lower() and "local" not in explanation.lower():
                        explanation = f"{explanation} — available in {city}"
                return explanation
        
        # Return default phrase for this card
        default_phrase = why_phrases.get("default", f"Handpicked for {pet_name}")
        if city and card.get("type") == "concierge_service":
            default_phrase = f"{default_phrase} — serving {city}"
        return default_phrase
    
    # Legacy fallback - generic trait explanations
    card_type = card.get("type", "")
    
    trait_explanations = {
        "anxious": "calm and gentle approach",
        "warms_up_slowly": "quiet-and-cozy style",
        "calm": "peaceful celebration style",
        "senior": "comfort-first needs",
        "playful": "playful energy",
        "energetic": "high-energy spirit",
        "social": "love for socializing",
        "elegant": "elegant taste",
        "pampered": "pampered lifestyle",
        "photo_ready": "photo-ready personality",
        "foodie": "love of treats",
    }
    
    for trait in all_traits:
        trait_lower = trait.lower().replace(" ", "_")
        if trait_lower in trait_explanations:
            readable = trait_explanations[trait_lower]
            if card_type == "concierge_product":
                explanation = f"Designed for {pet_name}'s {readable}"
            else:
                explanation = f"Tailored for {pet_name}'s {readable}"
                if city:
                    explanation = f"{explanation} — in {city}"
            return explanation
    
    if city:
        return f"Curated for {pet_name} in {city}"
    return f"Curated for {pet_name}"


def get_micro_question(pet_data: Dict, answered_questions: List[str] = None) -> Optional[Dict]:
    """
    Get a micro-question if pet profile is thin.
    Returns None if profile is complete or all questions answered.
    """
    answered = answered_questions or pet_data.get("answered_questions", []) or []
    soul_traits = pet_data.get("soul_traits", []) or []
    
    # Don't show if profile has 3+ traits
    if len(soul_traits) >= 3:
        return None
    
    pet_name = pet_data.get("name", "your pet")
    
    # Find first unanswered question
    for question in CELEBRATE_MICRO_QUESTIONS:
        if question["id"] not in answered:
            return {
                "type": "question_card",
                "id": question["id"],
                "question": question["question"].replace("{pet_name}", pet_name),
                "options": question["options"],
                "icon": question["icon"],
                "maps_to_traits": question["maps_to_traits"],
                "cta_text": "Help Mira know better"
            }
    
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXPORT FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

def get_celebrate_curated_set(
    pet_data: Dict[str, Any],
    event_context: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Get the complete curated set for Celebrate pillar.
    
    Returns:
    {
        "concierge_products": [...],  # 2-3 bespoke deliverables
        "concierge_services": [...],  # 1-2 arrangements
        "question_card": {...} or None
    }
    """
    # Select cards
    cards = select_concierge_cards(
        pet_data=pet_data,
        event_context=event_context,
        products_count=3,
        services_count=2
    )
    
    # Get micro-question if needed
    question_card = get_micro_question(pet_data)
    
    return {
        "concierge_products": cards["concierge_products"],
        "concierge_services": cards["concierge_services"],
        "question_card": question_card
    }
