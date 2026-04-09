"""
CONDITION_BLOCK_MAP — Mira Health Condition Intelligence
=========================================================
Maps pet health conditions to ingredients/product tags that must be blocked
or prioritised. Used by:
  - whatsapp_routes.py  (system prompt)
  - server.py           (Mira widget system prompt)
  - mira_routes.py      (/semantic-search filter)

Sync any changes here to the JS mirror in:
  frontend/src/hooks/useMiraFilter.js → CONDITION_BLOCK_MAP
"""

CONDITION_BLOCK_MAP = {
    # ── Digestive ─────────────────────────────────────────────────────────────
    "pancreatitis": {
        "block_keywords": [
            "high fat", "fatty", "rich", "cream", "butter", "pork", "duck",
            "beef tallow", "lamb fat", "lard", "ghee", "cheese", "coconut oil",
            "indulgent", "gourmet fat", "full cream"
        ],
        "safe_keywords": ["low fat", "lean", "fat-free", "light", "baked", "dehydrated"],
        "safe_proteins": ["salmon", "white fish", "chicken breast", "turkey breast", "egg"],
        "mira_note": "low fat — safe for pancreatitis",
        "pillar_note": "pancreatitis",
        "severity": "high"   # high = always block, medium = warn, low = prefer safe
    },
    "pancreatitis chronic": {
        "block_keywords": [
            "high fat", "fatty", "rich", "cream", "butter", "pork", "duck"
        ],
        "safe_keywords": ["low fat", "lean"],
        "mira_note": "low fat — safe for chronic pancreatitis",
        "pillar_note": "chronic pancreatitis",
        "severity": "high"
    },

    # ── Metabolic ─────────────────────────────────────────────────────────────
    "diabetes": {
        "block_keywords": [
            "sugar", "honey", "glucose", "corn syrup", "molasses", "maple syrup",
            "sweet", "sugary", "candy", "chocolate", "caramel", "fructose",
            "dextrose", "treacle", "jaggery"
        ],
        "safe_keywords": ["sugar-free", "no added sugar", "unsweetened", "diabetic"],
        "mira_note": "no added sugar — safe for diabetes",
        "pillar_note": "diabetes",
        "severity": "high"
    },
    "obesity": {
        "block_keywords": [
            "high calorie", "calorie-dense", "indulgent", "rich", "hearty",
            "double", "extra", "full fat", "cream", "butter"
        ],
        "safe_keywords": [
            "low calorie", "diet", "weight management", "light", "lean",
            "reduced fat", "calorie control"
        ],
        "mira_note": "low calorie — weight management",
        "pillar_note": "obesity",
        "severity": "medium"
    },
    "hypothyroidism": {
        "block_keywords": ["soy", "soybean", "raw cruciferous"],
        "safe_keywords": ["iodine", "selenium"],
        "mira_note": "thyroid-safe formula",
        "pillar_note": "hypothyroidism",
        "severity": "medium"
    },

    # ── Renal & Cardiac ───────────────────────────────────────────────────────
    "kidney disease": {
        "block_keywords": [
            "high protein", "protein rich", "meat feast", "high phosphorus",
            "bone meal", "high sodium", "salt", "sodium", "processed meat"
        ],
        "safe_keywords": [
            "low protein", "kidney support", "renal diet", "low phosphorus",
            "low sodium", "phosphorus controlled"
        ],
        "mira_note": "low protein & phosphorus — kidney-safe",
        "pillar_note": "kidney disease",
        "severity": "high"
    },
    "kidney failure": {
        "block_keywords": ["high protein", "high phosphorus", "high sodium"],
        "safe_keywords": ["renal", "kidney", "low protein"],
        "mira_note": "renal-safe — low protein & phosphorus",
        "pillar_note": "kidney failure",
        "severity": "high"
    },
    "heart disease": {
        "block_keywords": [
            "high sodium", "salt", "sodium", "processed", "cured", "smoked",
            "bacon", "sausage", "jerky"
        ],
        "safe_keywords": ["low sodium", "heart support", "omega-3", "sodium-free"],
        "mira_note": "low sodium — heart-safe",
        "pillar_note": "heart disease",
        "severity": "high"
    },
    "congestive heart failure": {
        "block_keywords": ["high sodium", "salt", "sodium"],
        "safe_keywords": ["low sodium", "sodium-free"],
        "mira_note": "sodium-restricted — heart-safe",
        "pillar_note": "CHF",
        "severity": "high"
    },

    # ── Musculoskeletal ───────────────────────────────────────────────────────
    "hip dysplasia": {
        "block_keywords": [],   # no food blocks — focus on supplement support
        "safe_keywords": ["glucosamine", "chondroitin", "omega-3", "joint support", "fish oil"],
        "boost_keywords": ["joint", "mobility", "anti-inflammatory"],
        "mira_note": "joint-supportive — great for hip dysplasia",
        "pillar_note": "hip dysplasia",
        "severity": "low"
    },
    "arthritis": {
        "block_keywords": [],
        "safe_keywords": ["glucosamine", "joint support", "omega-3", "anti-inflammatory"],
        "boost_keywords": ["joint", "mobility", "senior support"],
        "mira_note": "joint & mobility support",
        "pillar_note": "arthritis",
        "severity": "low"
    },
    "elbow dysplasia": {
        "block_keywords": [],
        "safe_keywords": ["joint support", "glucosamine"],
        "mira_note": "joint-supportive",
        "pillar_note": "elbow dysplasia",
        "severity": "low"
    },

    # ── Skin & Coat ───────────────────────────────────────────────────────────
    "skin allergies": {
        "block_keywords": [],   # handled by allergen map
        "safe_keywords": ["omega-3", "fish oil", "skin support", "biotin", "zinc"],
        "boost_keywords": ["skin", "coat", "hypoallergenic"],
        "mira_note": "skin & coat support",
        "pillar_note": "skin allergies",
        "severity": "low"
    },
    "atopic dermatitis": {
        "block_keywords": [],
        "safe_keywords": ["omega-3", "hypoallergenic", "grain-free", "limited ingredient"],
        "mira_note": "hypoallergenic — gentle on sensitive skin",
        "pillar_note": "atopic dermatitis",
        "severity": "medium"
    },

    # ── Gastrointestinal ─────────────────────────────────────────────────────
    "ibd": {
        "block_keywords": ["high fat", "spicy", "artificial", "preservative"],
        "safe_keywords": ["easy digest", "sensitive", "bland", "hydrolysed", "limited ingredient"],
        "mira_note": "easily digestible — IBD-safe",
        "pillar_note": "IBD",
        "severity": "medium"
    },
    "inflammatory bowel disease": {
        "block_keywords": ["high fat", "spicy", "artificial"],
        "safe_keywords": ["easy digest", "sensitive", "hydrolysed"],
        "mira_note": "easily digestible — gentle on the gut",
        "pillar_note": "inflammatory bowel disease",
        "severity": "medium"
    },
    "colitis": {
        "block_keywords": ["high fat", "rich", "spicy"],
        "safe_keywords": ["bland", "sensitive", "easy digest", "low residue"],
        "mira_note": "low residue — gentle for colitis",
        "pillar_note": "colitis",
        "severity": "medium"
    },

    # ── Neurological ─────────────────────────────────────────────────────────
    "epilepsy": {
        "block_keywords": ["artificial colour", "artificial flavour", "msg", "preservative"],
        "safe_keywords": ["natural", "no artificial", "whole ingredient"],
        "mira_note": "natural ingredients — no artificial additives",
        "pillar_note": "epilepsy",
        "severity": "medium"
    },

    # ── Cancer ────────────────────────────────────────────────────────────────
    "cancer": {
        "block_keywords": ["sugar", "glucose", "corn syrup", "high carb"],
        "safe_keywords": ["high protein", "low carb", "omega-3", "antioxidant", "grain-free"],
        "mira_note": "low sugar, high protein — cancer diet support",
        "pillar_note": "cancer",
        "severity": "high"
    },
    "lymphoma": {
        "block_keywords": ["sugar", "high carb"],
        "safe_keywords": ["high protein", "low carb", "omega-3"],
        "mira_note": "low carb — lymphoma diet support",
        "pillar_note": "lymphoma",
        "severity": "high"
    },

    # ── Dental ───────────────────────────────────────────────────────────────
    "dental disease": {
        "block_keywords": ["sticky", "chewy", "gummy", "soft treat"],
        "safe_keywords": ["dental", "teeth", "tartar control", "enzymatic"],
        "boost_keywords": ["dental chew", "teeth cleaning"],
        "mira_note": "dental-safe — tartar control",
        "pillar_note": "dental disease",
        "severity": "low"
    },
}

# Normalise condition name for lookup
def normalise_condition(cond: str) -> str:
    """Lowercase, strip, remove punctuation for map lookup."""
    return cond.lower().strip().replace("-", " ").replace("_", " ")


def get_conditions_for_pet(pet: dict) -> list:
    """
    Extract all health conditions for a pet from multiple DB fields.
    Returns a list of normalised condition strings (empty strings and 'none' removed).
    """
    raw = []

    # Root-level field
    root = pet.get("health_conditions") or []
    if isinstance(root, str):
        root = [root]
    raw += root

    # Soul answers field
    soul = pet.get("doggy_soul_answers") or {}
    soul_cond = soul.get("health_conditions") or []
    if isinstance(soul_cond, str):
        soul_cond = [soul_cond]
    raw += soul_cond

    # Health data field
    health = pet.get("health_data") or {}
    health_cond = health.get("conditions") or []
    if isinstance(health_cond, str):
        health_cond = [health_cond]
    raw += health_cond

    # Normalise and filter
    none_words = {"none", "no", "n/a", "na", "nil", "none known", "nothing", "no known", ""}
    result = []
    for c in raw:
        norm = normalise_condition(str(c))
        if norm not in none_words and norm:
            result.append(norm)

    return list(set(result))


def build_condition_rule(pet_conditions: list) -> str:
    """
    Build a plain-text condition rule for injection into GPT system prompts.
    Returns empty string if no conditions.
    """
    if not pet_conditions:
        return ""

    rules = []
    for cond in pet_conditions:
        info = CONDITION_BLOCK_MAP.get(cond, {})
        if info.get("block_keywords"):
            rules.append(
                f"• {cond.title()}: NEVER recommend products with — {', '.join(info['block_keywords'][:6])}. "
                f"Prefer: {', '.join(info.get('safe_keywords', [])[:4])}. "
                f"Say in ✦ Why: \"{info.get('mira_note', 'health-condition-safe')}\""
            )
        elif info.get("boost_keywords"):
            rules.append(
                f"• {cond.title()}: Prioritise — {', '.join(info['boost_keywords'][:4])}. "
                f"Say in ✦ Why: \"{info.get('mira_note', 'health-supportive')}\""
            )

    if not rules:
        return ""

    return "\n\nHEALTH CONDITION RULES — follow strictly:\n" + "\n".join(rules)
