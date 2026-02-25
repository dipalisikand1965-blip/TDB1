"""
Mira Life Stage Awareness
Detects pet life stage (Puppy, Adult, Senior) and adjusts recommendations accordingly
"""

import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Life stage definitions by species
LIFE_STAGES = {
    "dog": {
        "puppy": {"min_months": 0, "max_months": 12, "label": "Puppy"},
        "young_adult": {"min_months": 12, "max_months": 36, "label": "Young Adult"},
        "adult": {"min_months": 36, "max_months": 84, "label": "Adult"},
        "senior": {"min_months": 84, "max_months": 999, "label": "Senior"}
    },
    "cat": {
        "kitten": {"min_months": 0, "max_months": 12, "label": "Kitten"},
        "young_adult": {"min_months": 12, "max_months": 36, "label": "Young Adult"},
        "adult": {"min_months": 36, "max_months": 120, "label": "Adult"},
        "senior": {"min_months": 120, "max_months": 999, "label": "Senior"}
    }
}

# Size adjustments for dogs (larger dogs age faster)
DOG_SIZE_ADJUSTMENTS = {
    "small": 1.0,      # < 20 lbs - normal aging
    "medium": 0.9,     # 20-50 lbs - slightly faster
    "large": 0.8,      # 50-90 lbs - faster aging
    "giant": 0.7       # > 90 lbs - much faster aging
}

# Life stage specific recommendations
LIFE_STAGE_RECOMMENDATIONS = {
    "puppy": {
        "nutrition": [
            "High-protein puppy formula for growth",
            "DHA for brain development",
            "Calcium-controlled for proper bone growth",
            "Smaller, more frequent meals (3-4x daily)"
        ],
        "health": [
            "Complete vaccination series",
            "Deworming schedule",
            "Spay/neuter discussion at 6 months",
            "Socialization is critical now"
        ],
        "training": [
            "Basic commands (sit, stay, come)",
            "Crate training",
            "Potty training",
            "Bite inhibition"
        ],
        "exercise": [
            "Short play sessions (5 min per month of age)",
            "Avoid high-impact exercise until growth plates close",
            "Mental stimulation through puzzle toys"
        ],
        "products": ["puppy food", "training treats", "teething toys", "crate", "puppy pads"]
    },
    "young_adult": {
        "nutrition": [
            "Transition to adult food around 12 months",
            "Maintain healthy weight",
            "2 meals per day recommended"
        ],
        "health": [
            "Annual vet checkups",
            "Dental care routine established",
            "Watch for breed-specific issues"
        ],
        "training": [
            "Advanced obedience",
            "Impulse control",
            "Leash manners"
        ],
        "exercise": [
            "Peak energy period",
            "1-2 hours daily activity",
            "Mix of mental and physical exercise"
        ],
        "products": ["adult food", "durable toys", "training equipment", "dental chews"]
    },
    "adult": {
        "nutrition": [
            "Maintain consistent diet",
            "Watch calorie intake",
            "Consider joint supplements after 5 years"
        ],
        "health": [
            "Bi-annual vet visits",
            "Weight management critical",
            "Dental cleanings as needed"
        ],
        "training": [
            "Maintain existing training",
            "New tricks keep mind sharp"
        ],
        "exercise": [
            "Consistent daily exercise",
            "Adapt to energy level",
            "Watch for early mobility issues"
        ],
        "products": ["adult maintenance food", "joint supplements", "comfortable bed", "interactive toys"]
    },
    "senior": {
        "nutrition": [
            "Senior formula with reduced calories",
            "Easy-to-digest proteins",
            "Glucosamine and chondroitin for joints",
            "Omega fatty acids for coat and cognition"
        ],
        "health": [
            "Quarterly vet visits recommended",
            "Blood panels annually",
            "Watch for cognitive decline",
            "Arthritis management"
        ],
        "training": [
            "Keep routine consistent",
            "Gentle reinforcement",
            "Accommodate sensory decline"
        ],
        "exercise": [
            "Shorter, gentler walks",
            "Swimming is excellent low-impact option",
            "Maintain mobility without strain"
        ],
        "products": ["senior food", "orthopedic bed", "ramps/stairs", "joint supplements", "gentle toys"]
    }
}

class LifeStageInfo(BaseModel):
    stage: str
    label: str
    age_months: int
    age_years: float
    recommendations: Dict[str, Any]
    product_focus: list

def parse_age(age_string: str) -> Optional[int]:
    """
    Parse age string to months
    Handles: "2 years", "6 months", "1.5 years", "18 months old", etc.
    """
    if not age_string:
        return None
    
    age_lower = age_string.lower().strip()
    
    try:
        # Extract numbers
        import re
        numbers = re.findall(r'[\d.]+', age_lower)
        if not numbers:
            return None
        
        value = float(numbers[0])
        
        # Determine unit
        if 'year' in age_lower:
            return int(value * 12)
        elif 'month' in age_lower:
            return int(value)
        elif 'week' in age_lower:
            return max(1, int(value / 4))
        else:
            # Assume years if just a number
            if value < 20:
                return int(value * 12)
            else:
                return int(value)  # Probably months
    except:
        return None

def get_dog_size_category(breed: str) -> str:
    """
    Determine size category from breed
    """
    breed_lower = breed.lower() if breed else ""
    
    giant_breeds = ["great dane", "mastiff", "saint bernard", "newfoundland", "irish wolfhound", "leonberger"]
    large_breeds = ["labrador", "golden retriever", "german shepherd", "rottweiler", "boxer", "doberman", "husky", "malamute", "akita"]
    small_breeds = ["chihuahua", "yorkie", "yorkshire", "pomeranian", "maltese", "shih tzu", "pekingese", "papillon", "toy"]
    
    for breed_name in giant_breeds:
        if breed_name in breed_lower:
            return "giant"
    for breed_name in large_breeds:
        if breed_name in breed_lower:
            return "large"
    for breed_name in small_breeds:
        if breed_name in breed_lower:
            return "small"
    
    return "medium"

def determine_life_stage(
    age_string: str,
    breed: str = None,
    species: str = "dog"
) -> LifeStageInfo:
    """
    Determine life stage based on age, breed, and species
    """
    age_months = parse_age(age_string)
    
    if age_months is None:
        # Default to adult if can't parse
        age_months = 36
    
    # Adjust for dog size
    if species == "dog" and breed:
        size = get_dog_size_category(breed)
        adjustment = DOG_SIZE_ADJUSTMENTS.get(size, 1.0)
        adjusted_age = int(age_months / adjustment)
    else:
        adjusted_age = age_months
    
    # Get life stages for species
    stages = LIFE_STAGES.get(species, LIFE_STAGES["dog"])
    
    # Find matching stage
    current_stage = "adult"  # default
    for stage_key, stage_def in stages.items():
        if stage_def["min_months"] <= adjusted_age < stage_def["max_months"]:
            current_stage = stage_key
            break
    
    # Get recommendations
    recommendations = LIFE_STAGE_RECOMMENDATIONS.get(current_stage, LIFE_STAGE_RECOMMENDATIONS["adult"])
    
    return LifeStageInfo(
        stage=current_stage,
        label=stages.get(current_stage, {}).get("label", current_stage.title()),
        age_months=age_months,
        age_years=round(age_months / 12, 1),
        recommendations=recommendations,
        product_focus=recommendations.get("products", [])
    )

def get_life_stage_context(pet_context: dict) -> str:
    """
    Generate life stage context string for LLM prompt
    """
    age = pet_context.get("age", "")
    breed = pet_context.get("breed", "")
    name = pet_context.get("name", "the pet")
    
    life_stage = determine_life_stage(age, breed)
    
    context_parts = [
        f"{name} is a {life_stage.label} ({life_stage.age_years} years old).",
    ]
    
    # Add key recommendations
    if life_stage.stage == "puppy":
        context_parts.append("As a puppy, focus on growth nutrition, socialization, and gentle training.")
    elif life_stage.stage == "senior":
        context_parts.append("As a senior, prioritize joint health, easy digestion, and comfort.")
    elif life_stage.stage == "young_adult":
        context_parts.append("At this peak energy age, focus on exercise, mental stimulation, and maintaining good habits.")
    
    return " ".join(context_parts)

def filter_products_by_life_stage(products: list, life_stage: str) -> list:
    """
    Filter/prioritize products based on life stage
    """
    stage_keywords = {
        "puppy": ["puppy", "junior", "growth", "starter"],
        "senior": ["senior", "mature", "joint", "easy chew", "soft"],
        "adult": ["adult", "maintenance"],
        "young_adult": ["adult", "active", "energy"]
    }
    
    keywords = stage_keywords.get(life_stage, [])
    
    if not keywords:
        return products
    
    # Score products based on life stage relevance
    scored = []
    for product in products:
        name = (product.get("name", "") + " " + product.get("description", "")).lower()
        score = sum(1 for kw in keywords if kw in name)
        
        # Penalize wrong life stage
        wrong_stage_keywords = {
            "puppy": ["senior", "mature"],
            "senior": ["puppy", "junior", "growth"],
        }
        penalties = wrong_stage_keywords.get(life_stage, [])
        score -= sum(2 for kw in penalties if kw in name)
        
        scored.append((score, product))
    
    # Sort by score (higher first), then return products
    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored]
