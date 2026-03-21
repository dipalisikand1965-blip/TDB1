"""
Soul Archetype Engine
=====================
Derives personality archetypes from existing Soul Profile data.

The archetype is computed from:
- describe_3_words (free text personality description)
- general_nature / temperament
- energy_level
- separation_anxiety / alone_time_comfort
- stranger_reaction / social_with_people
- behavior_with_dogs / social_with_dogs
- food_motivation
- loud_sounds / noise_sensitivity

NO NEW QUESTIONS NEEDED - this derives from existing 51 Soul Builder questions.

Archetypes shape:
- Copy and messaging tone
- Product recommendations
- Color palette suggestions
- Gift and celebration suggestions
"""

from typing import Dict, Optional, List, Tuple
import re
import logging

logger = logging.getLogger(__name__)

# =============================================================================
# ARCHETYPE DEFINITIONS
# =============================================================================

ARCHETYPES = {
    "gentle_aristocrat": {
        "name": "The Gentle Aristocrat",
        "emoji": "👑",
        "description": "Calm, dignified, and graceful. Prefers quiet elegance.",
        "traits": ["calm", "gentle", "dignified", "graceful", "refined", "elegant", "poised", "regal"],
        "copy_tone": "refined, elegant, understated",
        "product_affinity": ["robes", "premium beds", "grooming kits", "elegant bowls"],
        "color_palette": ["#8B7355", "#D4C4B0", "#F5F5DC", "#E8E4E1"],  # Warm neutrals
        "celebration_style": "intimate, sophisticated"
    },
    "wild_explorer": {
        "name": "The Wild Explorer",
        "emoji": "🏔️",
        "description": "Adventurous, energetic, and always ready for the next journey.",
        "traits": ["adventurous", "energetic", "active", "bold", "curious", "explorer", "brave", "wild"],
        "copy_tone": "adventurous, exciting, bold",
        "product_affinity": ["travel gear", "outdoor toys", "hiking accessories", "durable items"],
        "color_palette": ["#2D5016", "#87CEEB", "#D2691E", "#228B22"],  # Nature greens and earth
        "celebration_style": "outdoor adventure, park party"
    },
    "velcro_baby": {
        "name": "The Velcro Baby",
        "emoji": "🤗",
        "description": "Deeply attached, loves closeness, and thrives on companionship.",
        "traits": ["clingy", "attached", "loving", "cuddly", "dependent", "sweet", "devoted", "loyal"],
        "copy_tone": "warm, reassuring, comforting",
        "product_affinity": ["comfort blankets", "anxiety wraps", "cozy beds", "bonding toys"],
        "color_palette": ["#FFB6C1", "#E6E6FA", "#FFDAB9", "#F0E68C"],  # Soft pastels
        "celebration_style": "cozy at home, intimate"
    },
    "snack_negotiator": {
        "name": "The Snack-Led Negotiator",
        "emoji": "🍖",
        "description": "Food is life. Will do absolutely anything for the right treat.",
        "traits": ["greedy", "foodie", "hungry", "treat-motivated", "negotiator", "persistent", "clever"],
        "copy_tone": "playful, foodie, tempting",
        "product_affinity": ["treat dispensers", "puzzle feeders", "gourmet treats", "food storage"],
        "color_palette": ["#FF6B35", "#F7931E", "#FFD700", "#8B4513"],  # Warm appetizing colors
        "celebration_style": "food-focused, treat party"
    },
    "quiet_watcher": {
        "name": "The Quiet Watcher",
        "emoji": "👁️",
        "description": "Observant, thoughtful, and takes time to warm up.",
        "traits": ["quiet", "observant", "shy", "cautious", "thoughtful", "reserved", "watchful", "careful"],
        "copy_tone": "gentle, patient, understanding",
        "product_affinity": ["quiet toys", "private spaces", "calming products", "gentle enrichment"],
        "color_palette": ["#708090", "#B0C4DE", "#E0E0E0", "#DCDCDC"],  # Soft grays and blues
        "celebration_style": "small gathering, familiar faces only"
    },
    "social_butterfly": {
        "name": "The Social Butterfly",
        "emoji": "🦋",
        "description": "Life of the party. Loves everyone and wants everyone to love them.",
        "traits": ["friendly", "social", "outgoing", "playful", "happy", "extrovert", "popular", "charming"],
        "copy_tone": "cheerful, social, celebratory",
        "product_affinity": ["party supplies", "playdate toys", "social gear", "matching accessories"],
        "color_palette": ["#FF69B4", "#00CED1", "#FFD700", "#32CD32"],  # Bright, fun colors
        "celebration_style": "big party, lots of friends"
    },
    "brave_worrier": {
        "name": "The Brave Little Worrier",
        "emoji": "💪",
        "description": "Sensitive soul who faces fears with courage. Needs extra support.",
        "traits": ["anxious", "sensitive", "nervous", "fearful", "brave", "worried", "timid", "vulnerable"],
        "copy_tone": "supportive, reassuring, gentle",
        "product_affinity": ["calming aids", "anxiety products", "thunder shirts", "comfort items"],
        "color_palette": ["#9370DB", "#DDA0DD", "#E6E6FA", "#D8BFD8"],  # Calming purples
        "celebration_style": "quiet, controlled environment"
    }
}

# Keyword mappings for trait detection
TRAIT_KEYWORDS = {
    # Gentle Aristocrat
    "gentle_aristocrat": [
        "calm", "gentle", "dignified", "graceful", "refined", "elegant", "poised", 
        "regal", "serene", "composed", "sophisticated", "noble", "majestic", "quiet",
        "relaxed", "laid-back", "chill", "peaceful", "zen", "tranquil"
    ],
    # Wild Explorer
    "wild_explorer": [
        "adventurous", "energetic", "active", "bold", "curious", "explorer", "brave",
        "wild", "hyper", "athletic", "sporty", "outdoor", "fearless", "daring",
        "spirited", "lively", "bouncy", "excited", "enthusiastic", "dynamic"
    ],
    # Velcro Baby
    "velcro_baby": [
        "clingy", "attached", "loving", "cuddly", "dependent", "sweet", "devoted",
        "loyal", "affectionate", "needy", "lap-dog", "shadow", "velcro", "snuggly",
        "close", "bonded", "inseparable", "mama's", "papa's", "follows"
    ],
    # Snack Negotiator
    "snack_negotiator": [
        "greedy", "foodie", "hungry", "treat", "motivated", "negotiator", "persistent",
        "clever", "food-obsessed", "snack", "glutton", "eats", "appetite", "gourmet",
        "always hungry", "food-driven", "bribable", "will work for food"
    ],
    # Quiet Watcher
    "quiet_watcher": [
        "quiet", "observant", "shy", "cautious", "thoughtful", "reserved", "watchful",
        "careful", "timid", "hesitant", "introverted", "observer", "wary", "skeptical",
        "takes time", "slow to warm", "selective", "discerning"
    ],
    # Social Butterfly
    "social_butterfly": [
        "friendly", "social", "outgoing", "playful", "happy", "extrovert", "popular",
        "charming", "loves everyone", "party", "gregarious", "personable", "welcoming",
        "loves dogs", "loves people", "center of attention", "life of the party"
    ],
    # Brave Worrier
    "brave_worrier": [
        "anxious", "sensitive", "nervous", "fearful", "brave", "worried", "timid",
        "vulnerable", "scared", "reactive", "startles", "thunder", "fireworks",
        "separation", "stressed", "fearful", "needs comfort", "overcomes"
    ]
}


# =============================================================================
# ARCHETYPE DERIVATION LOGIC
# =============================================================================

def extract_traits_from_text(text: str) -> List[str]:
    """Extract personality traits from free text (like describe_3_words)."""
    if not text:
        return []
    
    # Normalize text
    text_lower = text.lower()
    
    # Common separators
    words = re.split(r'[,\s;/&]+', text_lower)
    words = [w.strip() for w in words if w.strip() and len(w.strip()) > 2]
    
    return words


def score_archetype(soul_data: Dict, archetype_key: str) -> float:
    """
    Score how well a pet matches an archetype (0-100).
    Uses multiple signals from soul data.
    """
    score = 0.0
    max_score = 100.0
    keywords = TRAIT_KEYWORDS.get(archetype_key, [])
    
    # 1. describe_3_words matching (40 points max)
    three_words = soul_data.get("describe_3_words", "") or ""
    traits = extract_traits_from_text(three_words)
    word_matches = sum(1 for t in traits if any(k in t or t in k for k in keywords))
    score += min(word_matches * 15, 40)
    
    # 2. general_nature / temperament matching (20 points)
    nature = (soul_data.get("general_nature") or soul_data.get("temperament") or "").lower()
    if nature:
        if archetype_key == "gentle_aristocrat" and nature in ["calm", "shy"]:
            score += 20
        elif archetype_key == "wild_explorer" and nature in ["playful", "highly energetic", "curious"]:
            score += 20
        elif archetype_key == "velcro_baby" and nature in ["shy", "calm"]:
            score += 15
        elif archetype_key == "quiet_watcher" and nature in ["shy", "guarded", "fearful"]:
            score += 20
        elif archetype_key == "social_butterfly" and nature in ["playful", "curious"]:
            score += 20
        elif archetype_key == "brave_worrier" and nature in ["fearful", "guarded", "shy"]:
            score += 20
    
    # 3. energy_level matching (15 points)
    energy = (soul_data.get("energy_level") or "").lower()
    if energy:
        if archetype_key == "wild_explorer" and "high" in energy:
            score += 15
        elif archetype_key == "gentle_aristocrat" and ("low" in energy or "moderate" in energy):
            score += 15
        elif archetype_key == "velcro_baby" and ("low" in energy or "moderate" in energy):
            score += 10
        elif archetype_key == "social_butterfly" and ("high" in energy or "moderate" in energy):
            score += 10
    
    # 4. separation_anxiety / alone_time_comfort (10 points)
    anxiety = (soul_data.get("separation_anxiety") or soul_data.get("alone_time_comfort") or "").lower()
    if anxiety:
        if archetype_key == "velcro_baby" and anxiety in ["severe", "moderate"]:
            score += 10
        elif archetype_key == "brave_worrier" and anxiety in ["severe", "moderate"]:
            score += 10
        elif archetype_key == "wild_explorer" and anxiety in ["no", "mild"]:
            score += 5
    
    # 5. stranger_reaction / social_with_people (10 points)
    stranger = (soul_data.get("stranger_reaction") or soul_data.get("social_with_people") or "").lower()
    if stranger:
        if archetype_key == "social_butterfly" and stranger == "friendly":
            score += 10
        elif archetype_key == "quiet_watcher" and stranger in ["cautious", "nervous", "indifferent"]:
            score += 10
        elif archetype_key == "brave_worrier" and stranger in ["nervous", "protective"]:
            score += 10
        elif archetype_key == "gentle_aristocrat" and stranger in ["indifferent", "cautious"]:
            score += 5
    
    # 6. food_motivation (5 points)
    food_motivation = (soul_data.get("food_motivation") or "").lower()
    if food_motivation:
        if archetype_key == "snack_negotiator" and "very" in food_motivation:
            score += 5
    
    # 7. loud_sounds / noise_sensitivity (bonus for brave_worrier)
    noise = (soul_data.get("loud_sounds") or soul_data.get("noise_sensitivity") or "").lower()
    if noise:
        if archetype_key == "brave_worrier" and noise in ["very anxious", "needs comfort"]:
            score += 10
        elif archetype_key == "wild_explorer" and noise == "completely fine":
            score += 5
    
    return min(score, max_score)


def derive_archetype(soul_data: Dict) -> Tuple[str, Dict]:
    """
    Derive the primary archetype from soul data.
    Returns (archetype_key, archetype_details).
    """
    if not soul_data:
        return ("social_butterfly", ARCHETYPES["social_butterfly"])  # Default
    
    # Score all archetypes
    scores = {}
    for archetype_key in ARCHETYPES.keys():
        scores[archetype_key] = score_archetype(soul_data, archetype_key)
    
    # Find highest scoring archetype
    best_archetype = max(scores, key=scores.get)
    best_score = scores[best_archetype]
    
    # If no strong match (score < 20), default to social_butterfly
    if best_score < 20:
        best_archetype = "social_butterfly"
    
    logger.info(f"Archetype derived: {best_archetype} (score: {best_score})")
    logger.debug(f"All archetype scores: {scores}")
    
    return (best_archetype, ARCHETYPES[best_archetype])


def derive_all_archetypes_ranked(soul_data: Dict) -> List[Tuple[str, float, Dict]]:
    """
    Get all archetypes ranked by score.
    Returns list of (archetype_key, score, archetype_details).
    """
    if not soul_data:
        return [(k, 0, v) for k, v in ARCHETYPES.items()]
    
    results = []
    for archetype_key, archetype_data in ARCHETYPES.items():
        score = score_archetype(soul_data, archetype_key)
        results.append((archetype_key, score, archetype_data))
    
    # Sort by score descending
    results.sort(key=lambda x: x[1], reverse=True)
    return results


def get_archetype_details(archetype_key: str) -> Optional[Dict]:
    """Get details for a specific archetype."""
    return ARCHETYPES.get(archetype_key)


def get_all_archetypes() -> Dict:
    """Get all archetype definitions."""
    return ARCHETYPES


# =============================================================================
# HELPER FUNCTIONS FOR PRODUCT RECOMMENDATIONS
# =============================================================================

def get_product_affinity(archetype_key: str) -> List[str]:
    """Get product categories that appeal to this archetype."""
    archetype = ARCHETYPES.get(archetype_key)
    if archetype:
        return archetype.get("product_affinity", [])
    return []


def get_copy_tone(archetype_key: str) -> str:
    """Get the copy tone for this archetype."""
    archetype = ARCHETYPES.get(archetype_key)
    if archetype:
        return archetype.get("copy_tone", "friendly, warm")
    return "friendly, warm"


def get_color_palette(archetype_key: str) -> List[str]:
    """Get the color palette for this archetype."""
    archetype = ARCHETYPES.get(archetype_key)
    if archetype:
        return archetype.get("color_palette", ["#9333ea", "#ec4899"])
    return ["#9333ea", "#ec4899"]  # Default purple/pink


def get_celebration_style(archetype_key: str) -> str:
    """Get the celebration style for this archetype."""
    archetype = ARCHETYPES.get(archetype_key)
    if archetype:
        return archetype.get("celebration_style", "fun party")
    return "fun party"


# =============================================================================
# API-READY FUNCTIONS
# =============================================================================

async def compute_and_save_archetype(pet_id: str, db) -> Dict:
    """
    Compute archetype for a pet and save it to their profile.
    Call this after Soul Profile updates.
    """
    # Get pet data
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        return {"error": "Pet not found"}
    
    # Get soul data
    soul_data = pet.get("doggy_soul_answers") or {}
    
    # Derive archetype
    archetype_key, archetype_details = derive_archetype(soul_data)
    
    # Get all rankings for context
    rankings = derive_all_archetypes_ranked(soul_data)
    
    # Prepare archetype data to save
    archetype_data = {
        "primary_archetype": archetype_key,
        "archetype_name": archetype_details["name"],
        "archetype_emoji": archetype_details["emoji"],
        "archetype_description": archetype_details["description"],
        "copy_tone": archetype_details["copy_tone"],
        "color_palette": archetype_details["color_palette"],
        "celebration_style": archetype_details["celebration_style"],
        "product_affinity": archetype_details["product_affinity"],
        "archetype_scores": {r[0]: r[1] for r in rankings}
    }
    
    # Save to pet profile
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": {"soul_archetype": archetype_data}}
    )
    
    logger.info(f"Archetype saved for pet {pet_id}: {archetype_key}")
    
    return {
        "pet_id": pet_id,
        "archetype": archetype_data,
        "all_scores": {r[0]: r[1] for r in rankings}
    }


def get_archetype_for_display(pet: Dict) -> Dict:
    """
    Get archetype info formatted for frontend display.
    If not computed yet, derive it from soul data.
    """
    # Check if already computed
    if pet.get("soul_archetype"):
        return pet["soul_archetype"]
    
    # Derive from soul data
    soul_data = pet.get("doggy_soul_answers") or {}
    archetype_key, archetype_details = derive_archetype(soul_data)
    
    return {
        "primary_archetype": archetype_key,
        "archetype_name": archetype_details["name"],
        "archetype_emoji": archetype_details["emoji"],
        "archetype_description": archetype_details["description"],
        "copy_tone": archetype_details["copy_tone"],
        "color_palette": archetype_details["color_palette"]
    }
