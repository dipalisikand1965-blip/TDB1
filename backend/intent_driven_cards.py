"""
Intent-Driven Dynamic Cards Engine
===================================
MIRA (Brain) → Understands intent + Pet Soul → Generates Dynamic Recommendations
CONCIERGE (Hands) → Fulfills these recommendations

This is the "Soul-Aware" recommendation engine that creates Concierge Cards
based on what MIRA understands the pet ACTUALLY needs.

Pet First Doctrine: Everything is for THAT pet. "Lola needs this."
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════════
# INTENT → DYNAMIC RECOMMENDATIONS MAPPING
# These are Concierge-sourced items (no fixed price, arranged by concierge)
# ═══════════════════════════════════════════════════════════════════════════════

INTENT_RECOMMENDATIONS = {
    # ─────────────────────────────────────────────────────────────────────────
    # TRAINING INTENTS
    # ─────────────────────────────────────────────────────────────────────────
    "house_training": {
        "display_name": "House Training",
        "picks": [
            {"name": "Pee Pads", "reason": "Essential for indoor training", "icon": "🐾", "category": "training"},
            {"name": "Training Treats", "reason": "Positive reinforcement rewards", "icon": "🦴", "category": "training"},
            {"name": "Enzymatic Cleaner", "reason": "Eliminates accident odors completely", "icon": "✨", "category": "cleaning"},
            {"name": "Crate or Playpen", "reason": "Safe space for supervised training", "icon": "🏠", "category": "training"},
            {"name": "Bell for Door", "reason": "Teaches to signal when needs to go out", "icon": "🔔", "category": "training"},
        ],
        "services": [
            {"name": "Dog Trainer", "reason": "Professional house training guidance", "icon": "🎓", "duration": "Per session"},
            {"name": "Puppy School", "reason": "Group classes with socialization", "icon": "📚", "duration": "6-8 weeks"},
            {"name": "Home Visit Training", "reason": "Trainer comes to your home", "icon": "🏡", "duration": "Per visit"},
        ]
    },
    
    "obedience_training": {
        "display_name": "Obedience Training",
        "picks": [
            {"name": "Training Treats", "reason": "High-value rewards for learning", "icon": "🦴", "category": "training"},
            {"name": "Clicker", "reason": "Precise timing for positive reinforcement", "icon": "🔊", "category": "training"},
            {"name": "Training Leash", "reason": "Better control during sessions", "icon": "🎗️", "category": "training"},
            {"name": "Treat Pouch", "reason": "Easy access during training", "icon": "👜", "category": "training"},
        ],
        "services": [
            {"name": "Obedience Classes", "reason": "Structured learning environment", "icon": "🎓", "duration": "8 weeks"},
            {"name": "Private Trainer", "reason": "One-on-one focused sessions", "icon": "👤", "duration": "Per session"},
            {"name": "Board & Train", "reason": "Intensive training program", "icon": "🏫", "duration": "2-4 weeks"},
        ]
    },
    
    "behavior_training": {
        "display_name": "Behavior Training",
        "picks": [
            {"name": "Calming Treats", "reason": "Natural anxiety relief", "icon": "🌿", "category": "health"},
            {"name": "Puzzle Toys", "reason": "Mental stimulation reduces anxiety", "icon": "🧩", "category": "toys"},
            {"name": "Thunder Shirt", "reason": "Gentle pressure for calming", "icon": "👕", "category": "comfort"},
        ],
        "services": [
            {"name": "Behaviorist Consultation", "reason": "Expert assessment of behavior issues", "icon": "🧠", "duration": "1-2 hours"},
            {"name": "Behavior Modification Program", "reason": "Structured plan for lasting change", "icon": "📋", "duration": "Ongoing"},
        ]
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # GROOMING INTENTS
    # ─────────────────────────────────────────────────────────────────────────
    "grooming": {
        "display_name": "Grooming",
        "picks": [
            {"name": "Breed-Specific Shampoo", "reason": "Formulated for coat type", "icon": "🧴", "category": "grooming"},
            {"name": "Slicker Brush", "reason": "Removes tangles and loose fur", "icon": "🪮", "category": "grooming"},
            {"name": "Nail Clippers", "reason": "Safe at-home nail care", "icon": "✂️", "category": "grooming"},
            {"name": "Ear Cleaner", "reason": "Prevents infections", "icon": "👂", "category": "health"},
        ],
        "services": [
            {"name": "Full Grooming Session", "reason": "Bath, haircut, nails, ears", "icon": "✨", "duration": "2-3 hours"},
            {"name": "Bath & Brush", "reason": "Quick refresh", "icon": "🛁", "duration": "1 hour"},
            {"name": "Mobile Groomer", "reason": "Grooming at your doorstep", "icon": "🚐", "duration": "Varies"},
        ]
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # HEALTH INTENTS
    # ─────────────────────────────────────────────────────────────────────────
    "health_check": {
        "display_name": "Health Check",
        "picks": [
            {"name": "Pet First Aid Kit", "reason": "Emergency essentials at home", "icon": "🩹", "category": "health"},
            {"name": "Flea & Tick Prevention", "reason": "Monthly protection", "icon": "🛡️", "category": "health"},
            {"name": "Dental Chews", "reason": "Daily oral health", "icon": "🦷", "category": "health"},
        ],
        "services": [
            {"name": "Vet Checkup", "reason": "Comprehensive health assessment", "icon": "🏥", "duration": "30-60 min"},
            {"name": "Vaccination", "reason": "Keep immunizations current", "icon": "💉", "duration": "15-30 min"},
            {"name": "Blood Work Panel", "reason": "Detailed health insights", "icon": "🔬", "duration": "Results in 24-48h"},
        ]
    },
    
    "dental": {
        "display_name": "Dental Care",
        "picks": [
            {"name": "Dog Toothbrush & Paste", "reason": "Daily dental hygiene", "icon": "🪥", "category": "health"},
            {"name": "Dental Chews", "reason": "Reduces plaque buildup", "icon": "🦷", "category": "health"},
            {"name": "Water Additive", "reason": "Freshens breath daily", "icon": "💧", "category": "health"},
        ],
        "services": [
            {"name": "Dental Cleaning", "reason": "Professional teeth cleaning", "icon": "✨", "duration": "Half day"},
            {"name": "Dental X-Ray", "reason": "Check for hidden issues", "icon": "📷", "duration": "30 min"},
        ]
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # TRAVEL INTENTS
    # ─────────────────────────────────────────────────────────────────────────
    "travel": {
        "display_name": "Travel",
        "picks": [
            {"name": "Travel Carrier", "reason": "Safe and comfortable transport", "icon": "🧳", "category": "travel"},
            {"name": "Portable Water Bottle", "reason": "Hydration on the go", "icon": "💧", "category": "travel"},
            {"name": "Travel First Aid Kit", "reason": "Emergency supplies away from home", "icon": "🩹", "category": "travel"},
            {"name": "Calming Treats", "reason": "Reduces travel anxiety", "icon": "🌿", "category": "health"},
            {"name": "Car Seat Cover", "reason": "Protects your vehicle", "icon": "🚗", "category": "travel"},
        ],
        "services": [
            {"name": "Pet Taxi", "reason": "Safe door-to-door transport", "icon": "🚕", "duration": "Per trip"},
            {"name": "Airport Pickup/Drop", "reason": "Stress-free airport transfers", "icon": "✈️", "duration": "Per trip"},
            {"name": "Pet Passport Service", "reason": "Documentation for international travel", "icon": "📄", "duration": "1-2 weeks"},
            {"name": "Pet Relocation", "reason": "Full-service moving assistance", "icon": "🌍", "duration": "Varies"},
        ]
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # FOOD & NUTRITION INTENTS
    # ─────────────────────────────────────────────────────────────────────────
    "food": {
        "display_name": "Food & Nutrition",
        "picks": [
            {"name": "Premium Dog Food", "reason": "Tailored to breed and age", "icon": "🍖", "category": "food"},
            {"name": "Healthy Treats", "reason": "Nutritious rewards", "icon": "🦴", "category": "food"},
            {"name": "Food Supplements", "reason": "Fill nutritional gaps", "icon": "💊", "category": "health"},
            {"name": "Slow Feeder Bowl", "reason": "Prevents fast eating", "icon": "🥣", "category": "feeding"},
        ],
        "services": [
            {"name": "Nutrition Consultation", "reason": "Customized diet plan", "icon": "📋", "duration": "1 hour"},
            {"name": "Fresh Food Subscription", "reason": "Weekly meal delivery", "icon": "📦", "duration": "Weekly"},
            {"name": "Allergy Testing", "reason": "Identify food sensitivities", "icon": "🔬", "duration": "Results in 1-2 weeks"},
        ]
    },
    
    "diet": {
        "display_name": "Diet & Weight",
        "picks": [
            {"name": "Weight Management Food", "reason": "Controlled calories", "icon": "⚖️", "category": "food"},
            {"name": "Low-Cal Treats", "reason": "Guilt-free rewards", "icon": "🥬", "category": "food"},
            {"name": "Food Scale", "reason": "Precise portion control", "icon": "⚖️", "category": "feeding"},
        ],
        "services": [
            {"name": "Weight Management Program", "reason": "Structured weight loss plan", "icon": "📉", "duration": "3-6 months"},
            {"name": "Nutritionist Consultation", "reason": "Expert diet guidance", "icon": "🥗", "duration": "1 hour"},
        ]
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # BOARDING & SITTING INTENTS
    # ─────────────────────────────────────────────────────────────────────────
    "boarding": {
        "display_name": "Boarding & Sitting",
        "picks": [
            {"name": "Comfort Blanket", "reason": "Familiar scent for comfort", "icon": "🛏️", "category": "comfort"},
            {"name": "Favorite Toy", "reason": "Reduces separation anxiety", "icon": "🧸", "category": "toys"},
            {"name": "Calming Spray", "reason": "Helps with new environments", "icon": "🌿", "category": "health"},
        ],
        "services": [
            {"name": "Pet Hotel", "reason": "Luxury boarding facility", "icon": "🏨", "duration": "Per night"},
            {"name": "Home Pet Sitter", "reason": "Care in your own home", "icon": "🏠", "duration": "Per day"},
            {"name": "Daycare", "reason": "Daytime care and play", "icon": "☀️", "duration": "Per day"},
            {"name": "Overnight Sitter", "reason": "Sitter stays at your home", "icon": "🌙", "duration": "Per night"},
        ]
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # WALKING & EXERCISE INTENTS
    # ─────────────────────────────────────────────────────────────────────────
    "walking": {
        "display_name": "Walking & Exercise",
        "picks": [
            {"name": "No-Pull Harness", "reason": "Comfortable walks", "icon": "🦺", "category": "walking"},
            {"name": "Reflective Leash", "reason": "Safe evening walks", "icon": "🔦", "category": "walking"},
            {"name": "Poop Bags", "reason": "Responsible pet parent essential", "icon": "🗑️", "category": "walking"},
            {"name": "Portable Water Bowl", "reason": "Hydration on walks", "icon": "💧", "category": "walking"},
        ],
        "services": [
            {"name": "Dog Walker", "reason": "Regular exercise routine", "icon": "🚶", "duration": "30-60 min"},
            {"name": "Group Walks", "reason": "Socialization + exercise", "icon": "👥", "duration": "1 hour"},
            {"name": "Adventure Hikes", "reason": "Outdoor exploration", "icon": "🥾", "duration": "Half day"},
        ]
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # CELEBRATION INTENTS
    # ─────────────────────────────────────────────────────────────────────────
    "birthday": {
        "display_name": "Birthday Celebration",
        "picks": [
            {"name": "Dog-Safe Birthday Cake", "reason": "Celebrate safely", "icon": "🎂", "category": "treats"},
            {"name": "Birthday Bandana", "reason": "Festive photo op", "icon": "🎀", "category": "accessories"},
            {"name": "Party Treats Box", "reason": "Shareable goodies", "icon": "🎁", "category": "treats"},
            {"name": "Birthday Toy", "reason": "Special day gift", "icon": "🧸", "category": "toys"},
        ],
        "services": [
            {"name": "Birthday Photoshoot", "reason": "Capture the memories", "icon": "📸", "duration": "1 hour"},
            {"name": "Pawty Planning", "reason": "Full birthday party setup", "icon": "🎉", "duration": "Event"},
            {"name": "Custom Cake Order", "reason": "Made just for your pet", "icon": "🎂", "duration": "2-3 days"},
        ]
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # ANXIETY & COMFORT INTENTS
    # ─────────────────────────────────────────────────────────────────────────
    "anxiety": {
        "display_name": "Anxiety & Comfort",
        "picks": [
            {"name": "Calming Treats", "reason": "Natural stress relief", "icon": "🌿", "category": "health"},
            {"name": "Thunder Shirt", "reason": "Gentle calming pressure", "icon": "👕", "category": "comfort"},
            {"name": "Calming Diffuser", "reason": "Pheromone therapy", "icon": "🕯️", "category": "comfort"},
            {"name": "Anxiety Bed", "reason": "Cozy secure space", "icon": "🛏️", "category": "comfort"},
            {"name": "White Noise Machine", "reason": "Masks scary sounds", "icon": "🔊", "category": "comfort"},
        ],
        "services": [
            {"name": "Behaviorist Consultation", "reason": "Expert anxiety assessment", "icon": "🧠", "duration": "1-2 hours"},
            {"name": "Desensitization Training", "reason": "Gradual exposure therapy", "icon": "📈", "duration": "Ongoing"},
        ]
    },
}

# ═══════════════════════════════════════════════════════════════════════════════
# INTENT DETECTION KEYWORDS
# Maps user message keywords to intent categories
# ═══════════════════════════════════════════════════════════════════════════════

INTENT_KEYWORDS = {
    "house_training": ["house train", "potty train", "toilet train", "pee", "poop", "accident", "indoor training", "housebreak"],
    "obedience_training": ["obedience", "sit", "stay", "come", "heel", "commands", "basic training", "listen"],
    "behavior_training": ["behavior", "aggression", "biting", "barking", "jumping", "pulling", "reactive", "fear"],
    "grooming": ["groom", "bath", "haircut", "nail", "brush", "mat", "shed", "fur", "coat"],
    "health_check": ["health", "checkup", "vet", "sick", "unwell", "symptoms", "check up"],
    "dental": ["dental", "teeth", "breath", "plaque", "gum", "mouth"],
    "travel": ["travel", "trip", "vacation", "flight", "car ride", "journey", "relocate", "moving"],
    "food": ["food", "eat", "feed", "diet", "nutrition", "meal", "hungry"],
    "diet": ["weight", "fat", "overweight", "slim", "diet", "calories", "portion"],
    "boarding": ["boarding", "pet hotel", "sitter", "daycare", "leave", "going away", "vacation care"],
    "walking": ["walk", "exercise", "run", "hike", "outdoor", "leash"],
    "birthday": ["birthday", "celebrate", "party", "anniversary", "gotcha day", "adoption day"],
    "anxiety": ["anxiety", "scared", "nervous", "stress", "thunder", "fireworks", "separation", "afraid", "panic"],
}


def detect_intent_from_message(message: str) -> Optional[str]:
    """
    Detect the primary intent from user message.
    Returns the intent key or None if no strong match.
    """
    if not message:
        return None
    
    message_lower = message.lower()
    
    # Score each intent based on keyword matches
    intent_scores = {}
    for intent, keywords in INTENT_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in message_lower)
        if score > 0:
            intent_scores[intent] = score
    
    if not intent_scores:
        return None
    
    # Return highest scoring intent
    best_intent = max(intent_scores, key=intent_scores.get)
    logger.info(f"[INTENT ENGINE] Detected intent: {best_intent} (score: {intent_scores[best_intent]})")
    return best_intent


def generate_dynamic_picks(
    intent: str,
    pet_name: str,
    pet_context: Dict = None,
    limit: int = 5
) -> List[Dict]:
    """
    Generate dynamic Concierge Pick cards based on intent.
    
    These are NOT from the product catalogue - they are Concierge-sourced.
    No price displayed. Concierge will find and arrange.
    
    Returns: List of Concierge Pick cards
    """
    if intent not in INTENT_RECOMMENDATIONS:
        logger.warning(f"[INTENT ENGINE] Unknown intent: {intent}")
        return []
    
    recommendations = INTENT_RECOMMENDATIONS[intent]
    display_name = recommendations["display_name"]
    picks = recommendations.get("picks", [])[:limit]
    
    dynamic_cards = []
    for pick in picks:
        card = {
            "id": f"intent-pick-{intent}-{pick['name'].lower().replace(' ', '-')}",
            "name": pick["name"],
            "display_name": f"{pick['name']} for {pet_name}",
            "description": pick["reason"],
            "reason": f"For {pet_name}'s {display_name.lower()}",
            "icon": pick.get("icon", "🐾"),
            "category": pick.get("category", "general"),
            "type": "concierge_pick",
            "is_dynamic": True,
            "intent": intent,
            "intent_display": display_name,
            "pet_name": pet_name,
            # No price - Concierge sources this
            "price": None,
            "price_display": "Concierge will source",
            "cta": "Arrange for me",
            "badge": "For " + pet_name,
            "source": "mira_intent_engine",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Add pet-specific customization if context available
        if pet_context:
            breed = pet_context.get("breed", "")
            if breed:
                card["reason"] = f"Perfect for {breed}s like {pet_name}"
        
        dynamic_cards.append(card)
    
    logger.info(f"[INTENT ENGINE] Generated {len(dynamic_cards)} dynamic picks for '{intent}' intent")
    return dynamic_cards


def generate_dynamic_services(
    intent: str,
    pet_name: str,
    pet_context: Dict = None,
    limit: int = 4
) -> List[Dict]:
    """
    Generate dynamic Concierge Service cards based on intent.
    
    These are services that Concierge will arrange and coordinate.
    
    Returns: List of Concierge Service cards
    """
    if intent not in INTENT_RECOMMENDATIONS:
        logger.warning(f"[INTENT ENGINE] Unknown intent for services: {intent}")
        return []
    
    recommendations = INTENT_RECOMMENDATIONS[intent]
    display_name = recommendations["display_name"]
    services = recommendations.get("services", [])[:limit]
    
    dynamic_cards = []
    for service in services:
        card = {
            "id": f"intent-service-{intent}-{service['name'].lower().replace(' ', '-')}",
            "name": service["name"],
            "display_name": f"{service['name']} for {pet_name}",
            "description": service["reason"],
            "reason": f"For {pet_name}'s {display_name.lower()}",
            "icon": service.get("icon", "🎯"),
            "duration": service.get("duration", "Varies"),
            "type": "concierge_service",
            "is_dynamic": True,
            "intent": intent,
            "intent_display": display_name,
            "pet_name": pet_name,
            # No price - Concierge arranges
            "price": None,
            "price_display": "Concierge arranges",
            "cta": "Book for " + pet_name,
            "badge": pet_name + " needs this",
            "source": "mira_intent_engine",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        dynamic_cards.append(card)
    
    logger.info(f"[INTENT ENGINE] Generated {len(dynamic_cards)} dynamic services for '{intent}' intent")
    return dynamic_cards


async def get_intent_driven_recommendations(
    db,
    user_message: str,
    pet_name: str,
    pet_id: str = None,
    pet_context: Dict = None,
    picks_limit: int = 5,
    services_limit: int = 4
) -> Dict[str, Any]:
    """
    Main entry point: Get intent-driven dynamic recommendations.
    
    This is what MIRA (the brain) generates for CONCIERGE (the hands) to fulfill.
    
    Returns:
    {
        "intent": "house_training",
        "intent_display": "House Training",
        "shelf_title": "Lola needs this for House Training",
        "picks": [...],      # Dynamic Concierge Pick cards
        "services": [...],   # Dynamic Concierge Service cards
    }
    """
    result = {
        "intent": None,
        "intent_display": None,
        "shelf_title": None,
        "picks": [],
        "services": [],
        "has_recommendations": False
    }
    
    # Step 1: Detect intent from message
    intent = detect_intent_from_message(user_message)
    
    if not intent:
        logger.info(f"[INTENT ENGINE] No strong intent detected in: {user_message[:50]}...")
        return result
    
    # Step 2: Get recommendation config
    if intent not in INTENT_RECOMMENDATIONS:
        return result
    
    display_name = INTENT_RECOMMENDATIONS[intent]["display_name"]
    
    result["intent"] = intent
    result["intent_display"] = display_name
    result["shelf_title"] = f"{pet_name} needs this for {display_name}"
    
    # Step 3: Generate dynamic picks (Concierge-sourced products)
    result["picks"] = generate_dynamic_picks(
        intent=intent,
        pet_name=pet_name,
        pet_context=pet_context,
        limit=picks_limit
    )
    
    # Step 4: Generate dynamic services (Concierge-arranged services)
    result["services"] = generate_dynamic_services(
        intent=intent,
        pet_name=pet_name,
        pet_context=pet_context,
        limit=services_limit
    )
    
    result["has_recommendations"] = len(result["picks"]) > 0 or len(result["services"]) > 0
    
    # Step 5: Store the intent for cross-panel awareness
    if db and pet_id and result["has_recommendations"]:
        try:
            await db.user_learn_intents.update_one(
                {"pet_id": pet_id},
                {
                    "$set": {
                        "pet_id": pet_id,
                        "pet_name": pet_name,
                        "current_intent": intent,
                        "intent_display": display_name,
                        "updated_at": datetime.now(timezone.utc)
                    },
                    "$addToSet": {
                        "intents": intent
                    },
                    "$setOnInsert": {
                        "createdAt": datetime.now(timezone.utc)
                    }
                },
                upsert=True
            )
            logger.info(f"[INTENT ENGINE] Stored intent '{intent}' for pet {pet_id}")
        except Exception as e:
            logger.error(f"[INTENT ENGINE] Failed to store intent: {e}")
    
    logger.info(f"[INTENT ENGINE] Generated recommendations: {len(result['picks'])} picks, {len(result['services'])} services for '{intent}'")
    return result


async def get_current_pet_intent(db, pet_id: str) -> Optional[Dict]:
    """
    Get the current active intent for a pet.
    Used by PICKS and SERVICES panels to show intent-driven content.
    """
    if not db or not pet_id:
        return None
    
    try:
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
        
        intent_doc = await db.user_learn_intents.find_one(
            {
                "pet_id": pet_id,
                "updated_at": {"$gte": cutoff}
            },
            {"_id": 0}
        )
        
        if intent_doc and intent_doc.get("current_intent"):
            return {
                "intent": intent_doc["current_intent"],
                "intent_display": intent_doc.get("intent_display"),
                "pet_name": intent_doc.get("pet_name"),
                "all_intents": intent_doc.get("intents", [])
            }
        
        return None
        
    except Exception as e:
        logger.error(f"[INTENT ENGINE] Error getting pet intent: {e}")
        return None
