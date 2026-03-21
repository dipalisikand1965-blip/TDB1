"""
Top Picks API - Personalized picks for each pet across all pillars
"Mira is the Brain, Concierge® is the Hands"

This endpoint powers the "Top Picks for [Pet]" panel that shows
intelligent, pet-aware recommendations across all pillars.

SOUL INTEGRATION (NEW):
- Reads from user_learn_intents to know what the pet parent is thinking about
- Shows "{petName} might need this" shelf with contextually relevant picks
- Mira knows the soul - no explicit "based on your chat" messaging
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/mira", tags=["top-picks"])

# Module-level database reference
db: AsyncIOMotorDatabase = None

def set_top_picks_db(database: AsyncIOMotorDatabase):
    """Set the database reference for top picks routes."""
    global db
    db = database
    logger.info("Top Picks routes initialized with database")

# ═══════════════════════════════════════════════════════════════════════════════
# BREED EXCLUSION PATTERN - Filter out breed-specific products for OTHER breeds
# Products like "Golden Retriever · Birthday Cake" should only show for Golden Retrievers
# ═══════════════════════════════════════════════════════════════════════════════
BREED_EXCLUSION_PATTERN = r"^(Labrador|Golden Retriever|German Shepherd|Beagle|Bulldog|Poodle|Rottweiler|Yorkshire|Boxer|Dachshund|Siberian Husky|Husky|Doberman|Great Dane|Shih Tzu|Pug|Chihuahua|Pomeranian|Maltese|Cocker Spaniel|Border Collie|Cavalier|French Bulldog|Indie|Indian Pariah|American Bully|Chow Chow|Dalmatian|Jack Russell|Lhasa Apso|Italian Greyhound|Scottish Terrier|St Bernard|Schnoodle|Irish Setter)\s*[·:]"

# ═══════════════════════════════════════════════════════════════════════════════
# INTENT TO PILLAR/CATEGORY MAPPING - Mira knows what the pet needs
# Maps LEARN intents to PICKS pillars and product categories
# ═══════════════════════════════════════════════════════════════════════════════
INTENT_TO_PICKS_MAPPING = {
    "grooming": {
        "pillar": "care",
        "categories": ["grooming", "shampoo", "brush", "nail", "coat", "spa"],
        "tags": ["grooming", "coat-care", "hygiene", "spa"],
        "boost": 25
    },
    "health": {
        "pillar": "care",
        "categories": ["health", "supplement", "vitamin", "wellness", "medical"],
        "tags": ["health", "wellness", "supplement", "vet"],
        "boost": 25
    },
    "food": {
        "pillar": "dine",
        "categories": ["food", "treats", "nutrition", "meal", "diet"],
        "tags": ["food", "nutrition", "treats", "meal"],
        "boost": 25
    },
    "travel": {
        "pillar": "travel",
        "categories": ["carrier", "travel", "transport", "car", "flight"],
        "tags": ["travel", "carrier", "transport", "adventure"],
        "boost": 25
    },
    "boarding": {
        "pillar": "stay",
        "categories": ["boarding", "hotel", "kennel", "daycare"],
        "tags": ["boarding", "stay", "kennel", "daycare"],
        "boost": 25
    },
    "behaviour": {
        "pillar": "fit",
        "categories": ["training", "behaviour", "anxiety", "calming"],
        "tags": ["training", "behaviour", "calming", "anxiety"],
        "boost": 25
    },
    "puppies": {
        "pillar": "care",
        "categories": ["puppy", "teething", "training", "essentials"],
        "tags": ["puppy", "young", "essentials", "training"],
        "boost": 20
    },
    "senior": {
        "pillar": "care",
        "categories": ["senior", "joint", "mobility", "comfort", "orthopedic"],
        "tags": ["senior", "joint", "mobility", "comfort"],
        "boost": 20
    },
    "seasonal": {
        "pillar": "care",
        "categories": ["seasonal", "monsoon", "summer", "winter"],
        "tags": ["seasonal", "weather", "protection"],
        "boost": 15
    },
    "emergency": {
        "pillar": "care",
        "categories": ["first-aid", "emergency", "safety"],
        "tags": ["emergency", "safety", "first-aid"],
        "boost": 30
    }
}

# Pillars to include in Top Picks (excluding Adopt & Farewell)
INCLUDED_PILLARS = [
    {"id": "celebrate", "name": "Celebrate", "emoji": "🎂", "color": "#EC4899"},
    {"id": "dine", "name": "Dine", "emoji": "🍽️", "color": "#F97316"},
    {"id": "care", "name": "Care", "emoji": "🛁", "color": "#8B5CF6"},
    {"id": "stay", "name": "Stay", "emoji": "🏨", "color": "#3B82F6"},
    {"id": "travel", "name": "Travel", "emoji": "✈️", "color": "#06B6D4"},
    {"id": "learn", "name": "Learn", "emoji": "📚", "color": "#10B981"},
    {"id": "fit", "name": "Fit", "emoji": "🏋️", "color": "#EF4444"},
    {"id": "enjoy", "name": "Enjoy", "emoji": "🎉", "color": "#F59E0B"},
    {"id": "advisory", "name": "Advisory", "emoji": "💬", "color": "#6366F1"},
    {"id": "paperwork", "name": "Paperwork", "emoji": "📋", "color": "#64748B"},
    {"id": "shop", "name": "Shop", "emoji": "🛒", "color": "#EC4899"},
]

# Safety blocked ingredients/items
BLOCKED_ITEMS = ["xylitol", "chocolate", "grapes", "raisins", "onion", "garlic", "macadamia"]

# Seasonal events configuration
SEASONAL_EVENTS = {
    "valentine": {"months": [2], "days": (1, 14), "categories": ["treats", "bandana", "gift", "hamper"], "boost": 30},
    "diwali": {"months": [10, 11], "days": (15, 15), "categories": ["calming", "safety", "festive", "treats"], "boost": 25},
    "christmas": {"months": [12], "days": (1, 31), "categories": ["gift", "hamper", "festive", "treats"], "boost": 30},
    "monsoon": {"months": [6, 7, 8, 9], "days": (1, 31), "categories": ["raincoat", "paw-care", "grooming"], "boost": 20},
    "summer": {"months": [4, 5, 6], "days": (1, 31), "categories": ["cooling", "hydration", "pool", "outdoor"], "boost": 15},
}

# ═══════════════════════════════════════════════════════════════════════════════
# CONCIERGE SUGGESTIONS BY PILLAR - COMPLETE DATA
# Each card has: title, why_it_fits, spec_chip, what_we_source, selection_rules, safety_note, questions
# ═══════════════════════════════════════════════════════════════════════════════
CONCIERGE_SUGGESTIONS = {
    "celebrate": [
        {
            "name": "Custom allergy-safe birthday cake",
            "icon": "cake",
            "gradient": ["#EC4899", "#F472B6"],
            "spec_chip": "Allergy-safe",
            "why_it_fits": "Made to {pet}'s diet rules, portioned for a safe celebration.",
            "what_we_source": "A dog-safe cake matched to {pet}'s allergies and size.",
            "selection_rules": [
                "Dog-only recipe (no chocolate, no xylitol, no raisins/grapes)",
                "Ingredient list aligned to allergies (protein + flour base)",
                "Portion size matched to weight (small servings)",
                "Soft texture if senior/teeth sensitive"
            ],
            "safety_note": "No human desserts; dog-only ingredients.",
            "questions": ["Any specific allergies?", "Preferred flavour?"]
        },
        {
            "name": "Pup-cuterie grazing board",
            "icon": "utensils",
            "gradient": ["#F97316", "#FBBF24"],
            "spec_chip": "Ingredient-controlled",
            "why_it_fits": "A fun, photo-worthy spread with dog-safe bites only.",
            "what_we_source": "A grazing board of dog-safe proteins + crunchy veg + treats.",
            "selection_rules": [
                "Single-ingredient treats where possible",
                "No onion/garlic seasoning, no dairy if sensitive",
                "Bite-size pieces to reduce choking risk",
                "Includes 1 enrichment element (lick mat or puzzle)"
            ],
            "safety_note": "Avoid cooked bones and fatty/seasoned meats.",
            "questions": ["How many dogs attending?", "Any dietary restrictions?"]
        },
        {
            "name": "At-home party set-up",
            "icon": "party-popper",
            "gradient": ["#8B5CF6", "#A78BFA"],
            "spec_chip": "Pet-safe decor",
            "why_it_fits": "Turns your home into a pet-safe celebration zone in 30 minutes.",
            "what_we_source": "Complete party decor setup with pet-safe materials.",
            "selection_rules": [
                "Non-toxic balloons and decorations",
                "No small parts that can be swallowed",
                "Photo corner with safe props",
                "Easy cleanup materials included"
            ],
            "safety_note": "All decorations pet-safe; no choking hazards.",
            "questions": ["Theme preference?", "Indoor or outdoor?"]
        },
        {
            "name": "Pet photographer + shoot",
            "icon": "camera",
            "gradient": ["#3B82F6", "#60A5FA"],
            "spec_chip": "30-45 min",
            "why_it_fits": "A calm, fast shoot designed around {pet}'s attention span.",
            "what_we_source": "Professional pet photographer for a 30-minute session.",
            "selection_rules": [
                "Photographer experienced with dogs",
                "Quick session to avoid pet fatigue",
                "Natural lighting preferred",
                "10-15 edited photos delivered"
            ],
            "safety_note": "No flash photography; positive reinforcement only.",
            "questions": ["Preferred location?", "Any must-have shots?"]
        },
        {
            "name": "Personalised bandana/charm",
            "icon": "heart",
            "gradient": ["#EC4899", "#F472B6"],
            "spec_chip": "Custom text",
            "why_it_fits": "A keepsake with {pet}'s name and your contact, sized perfectly.",
            "what_we_source": "Custom bandana or collar charm with engraving.",
            "selection_rules": [
                "Fabric safe for pet skin",
                "Size matched to neck measurement",
                "Durable engraving that won't fade",
                "Contact info for safety"
            ],
            "safety_note": "Breakaway safety clip for collar charms.",
            "questions": ["Text to include?", "Colour preference?"]
        },
    ],
    "dine": [
        {
            "name": "Diet transition plan",
            "icon": "clipboard-list",
            "gradient": ["#F97316", "#FB923C"],
            "spec_chip": "Vet-guided",
            "why_it_fits": "A gentle switch to new food without tummy troubles for {pet}.",
            "what_we_source": "Complete diet transition plan with exact food sourcing.",
            "selection_rules": [
                "7-10 day gradual transition schedule",
                "Exact brand and variant matched",
                "Portion sizes calculated for weight",
                "Monitoring checklist included"
            ],
            "safety_note": "Sudden diet changes can cause GI upset.",
            "questions": ["Current food brand?", "Target food or goal?"]
        },
        {
            "name": "Allergy-safe treat sourcing",
            "icon": "cookie",
            "gradient": ["#EAB308", "#FACC15"],
            "spec_chip": "Single-protein",
            "why_it_fits": "Treats {pet} can enjoy without allergic reactions.",
            "what_we_source": "Limited ingredient treats matched to {pet}'s allergies.",
            "selection_rules": [
                "Single protein source only",
                "No common allergens (wheat, soy, corn)",
                "Natural ingredients, no artificial additives",
                "Size appropriate for training or snacking"
            ],
            "safety_note": "Always introduce new treats gradually.",
            "questions": ["Known allergies?", "Preferred protein?"]
        },
        {
            "name": "Fresh topper sourcing",
            "icon": "salad",
            "gradient": ["#22C55E", "#4ADE80"],
            "spec_chip": "GI-friendly",
            "why_it_fits": "Tasty meal boosters that are gentle on {pet}'s tummy.",
            "what_we_source": "Freeze-dried or fresh toppers for picky eaters.",
            "selection_rules": [
                "Single ingredient or minimal processing",
                "No artificial preservatives",
                "Easy to digest proteins",
                "Appropriate portion guidance"
            ],
            "safety_note": "Start with small amounts to test tolerance.",
            "questions": ["Current food type?", "Protein preferences?"]
        },
        {
            "name": "Picky eater kit",
            "icon": "utensils-crossed",
            "gradient": ["#F97316", "#FBBF24"],
            "spec_chip": "Engagement tools",
            "why_it_fits": "Tools and techniques to make mealtimes exciting for {pet}.",
            "what_we_source": "Lick mats, puzzle feeders, and appetite-boosting tips.",
            "selection_rules": [
                "Food-grade silicone mats",
                "Difficulty matched to {pet}'s level",
                "Easy to clean materials",
                "Includes technique guide"
            ],
            "safety_note": "Supervise first use of puzzle feeders.",
            "questions": ["Current feeding setup?", "What's been tried?"]
        },
        {
            "name": "Nutrition consult booking",
            "icon": "stethoscope",
            "gradient": ["#6366F1", "#818CF8"],
            "spec_chip": "Expert-led",
            "why_it_fits": "Professional guidance for {pet}'s specific dietary needs.",
            "what_we_source": "Booking with a certified pet nutritionist.",
            "selection_rules": [
                "Certified veterinary nutritionist",
                "Review of current diet included",
                "Customised meal plan provided",
                "Follow-up support available"
            ],
            "safety_note": "This is guidance, not medical treatment.",
            "questions": ["Main concern?", "Current health conditions?"]
        },
    ],
    "stay": [
        {
            "name": "Pet-friendly hotel shortlist",
            "icon": "hotel",
            "gradient": ["#3B82F6", "#60A5FA"],
            "spec_chip": "Policies verified",
            "why_it_fits": "Hotels where {pet} is genuinely welcome, not just tolerated.",
            "what_we_source": "Curated list of hotels with verified pet policies.",
            "selection_rules": [
                "Direct confirmation of pet policy",
                "Weight/breed restrictions checked",
                "Pet amenities verified",
                "Nearby walking areas mapped"
            ],
            "safety_note": "Always confirm policy before booking.",
            "questions": ["Destination city?", "Travel dates?"]
        },
        {
            "name": "Anxiety-friendly trial stay",
            "icon": "moon",
            "gradient": ["#8B5CF6", "#A78BFA"],
            "spec_chip": "Gradual intro",
            "why_it_fits": "A gentle introduction to boarding for anxious {pet}.",
            "what_we_source": "Trial stay plan with anxiety-aware boarding facility.",
            "selection_rules": [
                "Short 2-4 hour initial visit",
                "Familiar items allowed",
                "Quiet space available",
                "Regular photo/video updates"
            ],
            "safety_note": "Don't force if signs of extreme stress.",
            "questions": ["Anxiety triggers?", "Comfort items?"]
        },
        {
            "name": "Temperament-matched boarding",
            "icon": "home",
            "gradient": ["#10B981", "#34D399"],
            "spec_chip": "Personality fit",
            "why_it_fits": "A boarding match based on {pet}'s personality, not just availability.",
            "what_we_source": "Home boarder matched to {pet}'s temperament.",
            "selection_rules": [
                "Temperament assessment completed",
                "Home environment matched",
                "Other pets compatibility checked",
                "Experience with breed/size"
            ],
            "safety_note": "Meet-and-greet before first stay recommended.",
            "questions": ["{pet}'s energy level?", "Good with other dogs?"]
        },
        {
            "name": "In-home sitter coordination",
            "icon": "user-check",
            "gradient": ["#06B6D4", "#22D3EE"],
            "spec_chip": "Live updates",
            "why_it_fits": "{pet} stays home with a vetted sitter and you get peace of mind.",
            "what_we_source": "Background-checked sitter with update schedule.",
            "selection_rules": [
                "Identity and background verified",
                "Pet care experience confirmed",
                "Daily photo/video updates",
                "Emergency contact protocol"
            ],
            "safety_note": "Share vet details and emergency contacts.",
            "questions": ["Duration needed?", "Daily routine details?"]
        },
        {
            "name": "Emergency sitter roster",
            "icon": "phone-call",
            "gradient": ["#EF4444", "#F87171"],
            "spec_chip": "24/7 backup",
            "why_it_fits": "Pre-vetted sitters on standby for last-minute needs.",
            "what_we_source": "List of 3 verified backup sitters in your area.",
            "selection_rules": [
                "Availability confirmed for emergencies",
                "Quick response time (under 2 hours)",
                "Familiar with your area",
                "Experience with {pet}'s breed/size"
            ],
            "safety_note": "Keep list updated with current contacts.",
            "questions": ["Location/area?", "Typical emergency scenarios?"]
        },
    ],
    "travel": [
        {
            "name": "Airline carrier sourcing",
            "icon": "plane",
            "gradient": ["#06B6D4", "#22D3EE"],
            "spec_chip": "Airline-approved",
            "why_it_fits": "The exact carrier that meets your airline's requirements for {pet}.",
            "what_we_source": "Carrier matched to airline specs and {pet}'s size.",
            "selection_rules": [
                "Airline-specific dimensions verified",
                "Ventilation requirements met",
                "Weight capacity confirmed",
                "Comfort padding included"
            ],
            "safety_note": "Practice with carrier before travel day.",
            "questions": ["Airline name?", "{pet}'s measurements?"]
        },
        {
            "name": "Airport movement plan",
            "icon": "map-pin",
            "gradient": ["#3B82F6", "#60A5FA"],
            "spec_chip": "Relief areas mapped",
            "why_it_fits": "Stress-free airport navigation with pet relief spots marked.",
            "what_we_source": "Custom airport guide with pet-friendly routes.",
            "selection_rules": [
                "Pet relief areas located",
                "Quiet routes identified",
                "Security process explained",
                "Timing recommendations"
            ],
            "safety_note": "Arrive early to allow for pet breaks.",
            "questions": ["Which airport?", "Departure time?"]
        },
        {
            "name": "Car travel safety setup",
            "icon": "car",
            "gradient": ["#10B981", "#34D399"],
            "spec_chip": "Crash-tested",
            "why_it_fits": "Proper restraints to keep {pet} safe on road trips.",
            "what_we_source": "Crash-tested harness or carrier for car travel.",
            "selection_rules": [
                "Crash test certification",
                "Size matched to {pet}",
                "Easy to install/remove",
                "Comfort for long journeys"
            ],
            "safety_note": "Never let pets ride unrestrained.",
            "questions": ["Vehicle type?", "Trip duration typical?"]
        },
        {
            "name": "Pet-friendly itinerary",
            "icon": "route",
            "gradient": ["#F97316", "#FB923C"],
            "spec_chip": "Rest stops mapped",
            "why_it_fits": "A trip plan with {pet}-friendly stops along the way.",
            "what_we_source": "Custom route with pet-friendly cafés and rest areas.",
            "selection_rules": [
                "Rest stops every 2-3 hours",
                "Pet-friendly cafés verified",
                "Off-leash areas identified",
                "Emergency vet locations noted"
            ],
            "safety_note": "Never leave {pet} alone in parked car.",
            "questions": ["Route/destination?", "Any must-visit spots?"]
        },
        {
            "name": "Travel calm kit",
            "icon": "heart-pulse",
            "gradient": ["#8B5CF6", "#A78BFA"],
            "spec_chip": "Non-medicated",
            "why_it_fits": "Natural calming aids to ease {pet}'s travel anxiety.",
            "what_we_source": "Calming treats, familiar scent items, and routine tips.",
            "selection_rules": [
                "Non-medicated calming treats",
                "Pheromone spray or diffuser",
                "Familiar blanket/toy included",
                "Routine maintenance guide"
            ],
            "safety_note": "Test calming aids before travel day.",
            "questions": ["Travel anxiety level?", "What's worked before?"]
        },
    ],
    "care": [
        {
            "name": "Coat-specialist groomer match",
            "icon": "scissors",
            "gradient": ["#8B5CF6", "#A78BFA"],
            "spec_chip": "Breed-specific",
            "why_it_fits": "A groomer who truly understands {pet}'s coat type.",
            "what_we_source": "Groomer specialised in {pet}'s coat (double/fine/curly).",
            "selection_rules": [
                "Experience with specific coat type",
                "Gentle handling approach",
                "Proper tools for breed",
                "Fear-free certified preferred"
            ],
            "safety_note": "Share any skin sensitivities beforehand.",
            "questions": ["Coat type?", "Previous grooming issues?"]
        },
        {
            "name": "Matting rescue plan",
            "icon": "sparkles",
            "gradient": ["#EC4899", "#F472B6"],
            "spec_chip": "Gentle detangle",
            "why_it_fits": "A pain-free solution to {pet}'s matted coat.",
            "what_we_source": "Detangling strategy, tools, and maintenance schedule.",
            "selection_rules": [
                "Assessment of mat severity",
                "Appropriate detangling tools",
                "Conditioning products included",
                "Prevention routine established"
            ],
            "safety_note": "Severe mats may need professional shaving.",
            "questions": ["Mat locations?", "How long since last groom?"]
        },
        {
            "name": "Dental home-care system",
            "icon": "smile",
            "gradient": ["#3B82F6", "#60A5FA"],
            "spec_chip": "Daily routine",
            "why_it_fits": "A simple dental routine that {pet} will actually tolerate.",
            "what_we_source": "Toothbrush, paste, and habit training guide.",
            "selection_rules": [
                "Pet-safe enzymatic toothpaste",
                "Size-appropriate brush",
                "Gradual introduction plan",
                "Alternative options (dental chews)"
            ],
            "safety_note": "Never use human toothpaste on pets.",
            "questions": ["Current dental health?", "Tolerance for handling?"]
        },
        {
            "name": "Allergy-safe skin routine",
            "icon": "droplets",
            "gradient": ["#06B6D4", "#22D3EE"],
            "spec_chip": "Fragrance-free",
            "why_it_fits": "Gentle products for {pet}'s sensitive skin.",
            "what_we_source": "Hypoallergenic shampoo, conditioner, and wipes.",
            "selection_rules": [
                "Fragrance-free formulas",
                "pH balanced for dogs",
                "No harsh chemicals",
                "Vet-recommended brands"
            ],
            "safety_note": "Patch test new products first.",
            "questions": ["Skin concerns?", "Current products used?"]
        },
        {
            "name": "Post-walk hygiene protocol",
            "icon": "footprints",
            "gradient": ["#10B981", "#34D399"],
            "spec_chip": "Humid climate",
            "why_it_fits": "Keep {pet} clean and healthy after every walk.",
            "what_we_source": "Paw wipes, balm, and quick-clean routine.",
            "selection_rules": [
                "Antibacterial paw wipes",
                "Moisturising paw balm",
                "Quick-dry coat spray",
                "Ear cleaning if needed"
            ],
            "safety_note": "Check paws for cuts or foreign objects.",
            "questions": ["Walking terrain?", "Any paw issues?"]
        },
    ],
    "enjoy": [
        {
            "name": "7-day enrichment rotation",
            "icon": "puzzle",
            "gradient": ["#F97316", "#FBBF24"],
            "spec_chip": "Boredom-buster",
            "why_it_fits": "A week of activities to keep {pet} mentally stimulated.",
            "what_we_source": "7-day toy and activity rotation plan.",
            "selection_rules": [
                "Variety of toy types",
                "Difficulty progression",
                "Safe for unsupervised play",
                "Easy to rotate and store"
            ],
            "safety_note": "Inspect toys regularly for damage.",
            "questions": ["{pet}'s play style?", "Current favourite toys?"]
        },
        {
            "name": "Rainy day indoors kit",
            "icon": "cloud-rain",
            "gradient": ["#3B82F6", "#60A5FA"],
            "spec_chip": "Indoor activities",
            "why_it_fits": "Fun activities for when {pet} can't go outside.",
            "what_we_source": "Snuffle mats, puzzle feeders, and indoor games guide.",
            "selection_rules": [
                "Quiet indoor activities",
                "Mental stimulation focus",
                "Easy cleanup options",
                "Training game ideas included"
            ],
            "safety_note": "Supervise new puzzle toys initially.",
            "questions": ["Space available?", "Energy level indoors?"]
        },
        {
            "name": "Temperament-matched playdate",
            "icon": "users",
            "gradient": ["#10B981", "#34D399"],
            "spec_chip": "Safe socialising",
            "why_it_fits": "A playmate matched to {pet}'s energy and temperament.",
            "what_we_source": "Coordinated playdate with compatible dog.",
            "selection_rules": [
                "Similar size and energy",
                "Compatible play styles",
                "Neutral meeting location",
                "Supervised introduction"
            ],
            "safety_note": "Watch body language for stress signs.",
            "questions": ["{pet}'s play style?", "Good with which sizes?"]
        },
        {
            "name": "Pet café booking",
            "icon": "coffee",
            "gradient": ["#8B5CF6", "#A78BFA"],
            "spec_chip": "Rules verified",
            "why_it_fits": "A café outing where {pet} is actually welcome.",
            "what_we_source": "Verified pet-friendly café with reservation.",
            "selection_rules": [
                "Pet policy confirmed",
                "Outdoor seating available",
                "Water bowls provided",
                "Quiet times identified"
            ],
            "safety_note": "Keep {pet} leashed and under control.",
            "questions": ["Location preference?", "Time of day?"]
        },
        {
            "name": "Anxious dog sensory toys",
            "icon": "heart",
            "gradient": ["#EC4899", "#F472B6"],
            "spec_chip": "Calming play",
            "why_it_fits": "Gentle toys that soothe rather than overstimulate {pet}.",
            "what_we_source": "Calming toys and comfort items for anxious dogs.",
            "selection_rules": [
                "Soft, non-squeaky options",
                "Snuggle-safe materials",
                "Calming scent options",
                "Heartbeat toys if helpful"
            ],
            "safety_note": "Remove if {pet} starts destructive chewing.",
            "questions": ["Anxiety triggers?", "Current comfort items?"]
        },
    ],
    "fit": [
        {
            "name": "Breed-safe walk plan",
            "icon": "map",
            "gradient": ["#EF4444", "#F87171"],
            "spec_chip": "Climate-aware",
            "why_it_fits": "A walking routine perfect for {pet}'s breed and your climate.",
            "what_we_source": "Custom walk schedule with distance and timing.",
            "selection_rules": [
                "Breed exercise needs considered",
                "Weather-appropriate timing",
                "Distance matched to fitness",
                "Rest and hydration breaks"
            ],
            "safety_note": "Avoid hot pavement—check with hand first.",
            "questions": ["Current walk routine?", "Any mobility issues?"]
        },
        {
            "name": "Senior mobility play set",
            "icon": "accessibility",
            "gradient": ["#8B5CF6", "#A78BFA"],
            "spec_chip": "Low-impact",
            "why_it_fits": "Gentle activities that keep senior {pet} active without strain.",
            "what_we_source": "Low-impact toys and gentle exercise guide.",
            "selection_rules": [
                "Joint-friendly activities",
                "Soft, easy-grip toys",
                "Short session durations",
                "Indoor options included"
            ],
            "safety_note": "Watch for signs of pain or fatigue.",
            "questions": ["Age and mobility level?", "Any joint issues?"]
        },
        {
            "name": "Weight management routine",
            "icon": "scale",
            "gradient": ["#10B981", "#34D399"],
            "spec_chip": "Vet-guided",
            "why_it_fits": "A healthy weight plan tailored to {pet}'s needs.",
            "what_we_source": "Portion guide, activity plan, and progress tracking.",
            "selection_rules": [
                "Calorie calculation provided",
                "Gradual weight loss approach",
                "Activity increase plan",
                "Regular weigh-in schedule"
            ],
            "safety_note": "Rapid weight loss can be harmful.",
            "questions": ["Current weight?", "Target weight from vet?"]
        },
        {
            "name": "Climate walk strategy",
            "icon": "thermometer",
            "gradient": ["#F97316", "#FB923C"],
            "spec_chip": "Weather-smart",
            "why_it_fits": "Safe walk times and gear for your local climate.",
            "what_we_source": "Seasonal walk schedule and protective gear.",
            "selection_rules": [
                "Temperature guidelines",
                "Appropriate gear sourced",
                "Alternative exercise options",
                "Hydration reminders"
            ],
            "safety_note": "Brachycephalic breeds need extra heat care.",
            "questions": ["Local climate?", "Breed type?"]
        },
        {
            "name": "Weekend trail plan",
            "icon": "mountain",
            "gradient": ["#06B6D4", "#22D3EE"],
            "spec_chip": "Adventure-ready",
            "why_it_fits": "Trail recommendations perfect for {pet}'s fitness level.",
            "what_we_source": "Pet-friendly trail list with safety notes.",
            "selection_rules": [
                "Difficulty matched to fitness",
                "Dog-friendly trails only",
                "Water sources identified",
                "Emergency exit routes noted"
            ],
            "safety_note": "Check for ticks after every hike.",
            "questions": ["Fitness level?", "Preferred terrain?"]
        },
    ],
    "learn": [
        {
            "name": "Positive trainer matching",
            "icon": "graduation-cap",
            "gradient": ["#10B981", "#34D399"],
            "spec_chip": "Force-free",
            "why_it_fits": "A trainer who uses only positive methods with {pet}.",
            "what_we_source": "Certified positive-reinforcement trainer.",
            "selection_rules": [
                "Force-free certification",
                "Experience with your goal",
                "Good reviews from pet parents",
                "Training style matched"
            ],
            "safety_note": "Avoid trainers using punishment or fear.",
            "questions": ["Training goal?", "Previous training?"]
        },
        {
            "name": "2-week leash manners plan",
            "icon": "dog",
            "gradient": ["#3B82F6", "#60A5FA"],
            "spec_chip": "Step-by-step",
            "why_it_fits": "Transform {pet}'s walks in just 14 days.",
            "what_we_source": "Daily training plan with equipment sourcing.",
            "selection_rules": [
                "Appropriate harness/collar selected",
                "Daily 10-15 min sessions",
                "Progress milestones set",
                "Troubleshooting guide included"
            ],
            "safety_note": "Consistency is key—practice daily.",
            "questions": ["Current leash issues?", "Walk frequency?"]
        },
        {
            "name": "Visitor behaviour protocol",
            "icon": "door-open",
            "gradient": ["#F97316", "#FB923C"],
            "spec_chip": "Door manners",
            "why_it_fits": "Calm greetings when guests arrive instead of chaos.",
            "what_we_source": "Door routine training plan and place cue guide.",
            "selection_rules": [
                "Management tools identified",
                "Step-by-step protocol",
                "Practice scenarios included",
                "Emergency backup plan"
            ],
            "safety_note": "Safety first—use baby gates if needed.",
            "questions": ["Current door behaviour?", "Guest frequency?"]
        },
        {
            "name": "Gentle crate training",
            "icon": "box",
            "gradient": ["#8B5CF6", "#A78BFA"],
            "spec_chip": "No flooding",
            "why_it_fits": "Help {pet} love the crate, not fear it.",
            "what_we_source": "Gradual crate introduction plan and setup.",
            "selection_rules": [
                "Crate size matched to {pet}",
                "Comfort items included",
                "Gradual duration increase",
                "Positive association focus"
            ],
            "safety_note": "Never use crate as punishment.",
            "questions": ["Previous crate experience?", "What's the goal?"]
        },
        {
            "name": "Separation anxiety support",
            "icon": "heart-handshake",
            "gradient": ["#EC4899", "#F472B6"],
            "spec_chip": "Expert-guided",
            "why_it_fits": "Help {pet} feel safe when you're not home.",
            "what_we_source": "Behaviour consult booking and management plan.",
            "selection_rules": [
                "Certified behaviour consultant",
                "Gradual departure training",
                "Environmental modifications",
                "Progress tracking system"
            ],
            "safety_note": "This takes time—avoid rushing progress.",
            "questions": ["Symptoms when alone?", "Duration triggers?"]
        },
    ],
    "advisory": [
        {
            "name": "Second opinion scheduling",
            "icon": "clipboard-check",
            "gradient": ["#6366F1", "#818CF8"],
            "spec_chip": "Record prep",
            "why_it_fits": "Get another perspective on {pet}'s health concern.",
            "what_we_source": "Specialist appointment with record compilation.",
            "selection_rules": [
                "Relevant specialist identified",
                "Medical records compiled",
                "Question list prepared",
                "Appointment scheduled"
            ],
            "safety_note": "Inform primary vet about second opinion.",
            "questions": ["Health concern?", "Current vet's opinion?"]
        },
        {
            "name": "Specialist referral",
            "icon": "stethoscope",
            "gradient": ["#3B82F6", "#60A5FA"],
            "spec_chip": "Expert network",
            "why_it_fits": "Connect with the right specialist for {pet}'s needs.",
            "what_we_source": "Referral to dermatologist, dentist, ortho, or oncologist.",
            "selection_rules": [
                "Specialisation matched to need",
                "Credentials verified",
                "Location convenient",
                "Availability checked"
            ],
            "safety_note": "Specialists complement, not replace, primary vet.",
            "questions": ["Specialist type needed?", "Urgency level?"]
        },
        {
            "name": "Behaviour consult booking",
            "icon": "brain",
            "gradient": ["#8B5CF6", "#A78BFA"],
            "spec_chip": "CAAB/DACVB",
            "why_it_fits": "Expert help for {pet}'s behavioural challenges.",
            "what_we_source": "Consultation with certified behaviourist.",
            "selection_rules": [
                "Board-certified preferred",
                "Experience with issue type",
                "Video consult option",
                "Follow-up support included"
            ],
            "safety_note": "Rule out medical causes first.",
            "questions": ["Behaviour concern?", "How long ongoing?"]
        },
        {
            "name": "Vet question prep list",
            "icon": "list-checks",
            "gradient": ["#10B981", "#34D399"],
            "spec_chip": "Comprehensive",
            "why_it_fits": "Never forget to ask important questions at the vet.",
            "what_we_source": "Custom question list based on {pet}'s symptoms.",
            "selection_rules": [
                "Symptom-specific questions",
                "Treatment options to ask about",
                "Follow-up care questions",
                "Cost/timeline questions"
            ],
            "safety_note": "Write down vet's answers during visit.",
            "questions": ["Upcoming vet visit reason?", "Main concerns?"]
        },
        {
            "name": "Health tracking setup",
            "icon": "activity",
            "gradient": ["#EF4444", "#F87171"],
            "spec_chip": "Pattern spotting",
            "why_it_fits": "Track {pet}'s symptoms to spot patterns over time.",
            "what_we_source": "Tracking templates for stool, itch, appetite, etc.",
            "selection_rules": [
                "Easy daily logging",
                "Photo documentation option",
                "Pattern analysis guidance",
                "Vet-shareable format"
            ],
            "safety_note": "Consistent tracking reveals trends.",
            "questions": ["What to track?", "Format preference?"]
        },
    ],
    "paperwork": [
        {
            "name": "Vaccination vault setup",
            "icon": "shield-check",
            "gradient": ["#64748B", "#94A3B8"],
            "spec_chip": "Digital storage",
            "why_it_fits": "All of {pet}'s vaccine records in one secure place.",
            "what_we_source": "Digital vault setup with reminder system.",
            "selection_rules": [
                "Secure cloud storage",
                "Easy vet sharing",
                "Automatic reminders",
                "Backup copies created"
            ],
            "safety_note": "Keep physical copies as backup.",
            "questions": ["Current record format?", "Due dates known?"]
        },
        {
            "name": "Microchip registration",
            "icon": "cpu",
            "gradient": ["#3B82F6", "#60A5FA"],
            "spec_chip": "Contact updated",
            "why_it_fits": "Ensure {pet} can be returned if ever lost.",
            "what_we_source": "Registration completion and contact update.",
            "selection_rules": [
                "Chip number verified",
                "All contact details updated",
                "Backup contact added",
                "Confirmation received"
            ],
            "safety_note": "Update after any move or phone change.",
            "questions": ["Chip number?", "Current registration status?"]
        },
        {
            "name": "Travel docs coordination",
            "icon": "file-text",
            "gradient": ["#06B6D4", "#22D3EE"],
            "spec_chip": "Deadline tracked",
            "why_it_fits": "All the paperwork sorted for stress-free travel with {pet}.",
            "what_we_source": "Health certificates and airline forms completed.",
            "selection_rules": [
                "Destination requirements checked",
                "Vet appointment scheduled",
                "Forms pre-filled where possible",
                "Timeline provided"
            ],
            "safety_note": "Health certificates have expiry dates.",
            "questions": ["Destination?", "Travel date?"]
        },
        {
            "name": "Insurance onboarding",
            "icon": "umbrella",
            "gradient": ["#10B981", "#34D399"],
            "spec_chip": "Plan comparison",
            "why_it_fits": "Find the right coverage for {pet}'s needs and your budget.",
            "what_we_source": "Plan comparison and application support.",
            "selection_rules": [
                "Coverage comparison chart",
                "Pre-existing conditions noted",
                "Claim process explained",
                "Best value identified"
            ],
            "safety_note": "Enrol early—pre-existing conditions excluded.",
            "questions": ["Budget range?", "Coverage priorities?"]
        },
        {
            "name": "Emergency contact card",
            "icon": "id-card",
            "gradient": ["#EF4444", "#F87171"],
            "spec_chip": "Printable",
            "why_it_fits": "Critical info on {pet}'s collar for emergencies.",
            "what_we_source": "Custom emergency card with key details.",
            "selection_rules": [
                "Key health info included",
                "Multiple contacts listed",
                "Vet details added",
                "Weatherproof material"
            ],
            "safety_note": "Review and update annually.",
            "questions": ["Info to include?", "Format preference?"]
        },
    ],
    "shop": [
        {
            "name": "Need-state bundles",
            "icon": "package",
            "gradient": ["#EC4899", "#F472B6"],
            "spec_chip": "Curated",
            "why_it_fits": "Everything {pet} needs for a specific purpose, bundled.",
            "what_we_source": "Themed product bundle (dental, anxiety, seasonal).",
            "selection_rules": [
                "All items work together",
                "Quality brands only",
                "Value vs individual purchase",
                "Size/age appropriate"
            ],
            "safety_note": "Check individual product suitability.",
            "questions": ["Bundle type needed?", "Budget range?"]
        },
        {
            "name": "Subscription planning",
            "icon": "repeat",
            "gradient": ["#8B5CF6", "#A78BFA"],
            "spec_chip": "Auto-delivery",
            "why_it_fits": "Never run out of {pet}'s essentials again.",
            "what_we_source": "Subscription setup for food, treats, or supplies.",
            "selection_rules": [
                "Delivery frequency optimised",
                "Pause/cancel flexibility",
                "Price comparison done",
                "Quality assured"
            ],
            "safety_note": "Monitor for formula changes from brands.",
            "questions": ["Items to subscribe?", "Delivery frequency?"]
        },
        {
            "name": "Hard-to-find sourcing",
            "icon": "search",
            "gradient": ["#F97316", "#FB923C"],
            "spec_chip": "Special order",
            "why_it_fits": "We'll find that specific item you can't get locally.",
            "what_we_source": "Specific product sourced from verified sellers.",
            "selection_rules": [
                "Authenticity verified",
                "Best price found",
                "Shipping time estimated",
                "Return policy checked"
            ],
            "safety_note": "Beware of counterfeit products.",
            "questions": ["Exact product name?", "Why hard to find?"]
        },
        {
            "name": "Custom sizing support",
            "icon": "ruler",
            "gradient": ["#3B82F6", "#60A5FA"],
            "spec_chip": "Perfect fit",
            "why_it_fits": "Get the exact size for harness, collar, or carrier.",
            "what_we_source": "Measurement guide and size recommendation.",
            "selection_rules": [
                "Measurement instructions provided",
                "Brand-specific sizing checked",
                "Growth room considered",
                "Exchange policy noted"
            ],
            "safety_note": "Re-measure periodically for growing pups.",
            "questions": ["Item type?", "{pet}'s measurements?"]
        },
        {
            "name": "Try-3 sampling plan",
            "icon": "gift",
            "gradient": ["#10B981", "#34D399"],
            "spec_chip": "Test before commit",
            "why_it_fits": "Sample treats or toys before buying full-size.",
            "what_we_source": "3 sample products with feedback collection.",
            "selection_rules": [
                "Variety in selection",
                "Size appropriate samples",
                "Feedback form provided",
                "Full-size ordering easy"
            ],
            "safety_note": "Introduce new items one at a time.",
            "questions": ["Category to sample?", "Any restrictions?"]
        },
    ],
}

# ═══════════════════════════════════════════════════════════════════════════════
# SOUL INTEGRATION HELPERS - Mira knows what the pet needs right now
# ═══════════════════════════════════════════════════════════════════════════════

async def get_user_recent_intents(db, user_id: str, pet_id: str, hours: int = 48) -> List[Dict]:
    """
    Get user's recent LEARN intents from the shared intent store.
    Same data that powers LEARN's "{petName} might need this" shelf.
    
    Note: user_id can be either UUID or email - we check both
    """
    if db is None or not user_id:
        return []
    
    try:
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(hours=hours)
        
        # Try to find user UUID if we got an email
        resolved_user_id = user_id
        if "@" in user_id:
            user_doc = await db.users.find_one({"email": user_id}, {"id": 1})
            if user_doc and user_doc.get("id"):
                resolved_user_id = user_doc["id"]
                logger.info(f"[PICKS SOUL] Resolved email {user_id} to UUID {resolved_user_id}")
        
        query = {
            "user_id": resolved_user_id,
            "created_at": {"$gte": cutoff}
        }
        
        # Also filter by pet_id if provided
        if pet_id:
            query["pet_id"] = pet_id
        
        intents = await db.user_learn_intents.find(
            query,
            {"_id": 0, "topic": 1, "confidence": 1, "keyword": 1, "created_at": 1}
        ).sort("created_at", -1).to_list(10)
        
        # Dedupe by topic, keeping most recent
        seen = set()
        unique_intents = []
        for intent in intents:
            if intent["topic"] not in seen:
                seen.add(intent["topic"])
                unique_intents.append(intent)
        
        return unique_intents
        
    except Exception as e:
        logger.error(f"[PICKS SOUL] Failed to get intents: {e}")
        return []


# ═══════════════════════════════════════════════════════════════════════════════
# MIRA IS THE SOUL - Smart Fallback Picks
# When there are no chat intents, Mira still knows what the pet needs based on:
# 1. Breed characteristics (grooming, exercise, health predispositions)
# 2. Seasonal/weather context (Mumbai summer = hydration, monsoon = tick prevention)
# 3. Pet age/life stage (puppy = training, senior = joint care)
# 4. Profile completeness (prompt to add vaccinations, etc.)
# ═══════════════════════════════════════════════════════════════════════════════

async def get_smart_fallback_picks(
    db,
    pet: Dict,
    pet_allergies: List[str],
    limit: int = 6
) -> List[Dict]:
    """
    MIRA'S SOUL INTELLIGENCE - Always have something smart to suggest.
    Even without explicit chat intents, Mira knows the pet.
    """
    from datetime import datetime, timezone
    from breed_knowledge import get_breed_knowledge
    
    pet_name = pet.get("name", "Your pet")
    breed = pet.get("breed", "")
    age_months = pet.get("age_months") or 24  # Default to adult
    
    # Get breed-specific knowledge
    breed_data = get_breed_knowledge(breed) if breed else {}
    
    # Determine pet's life stage
    if age_months < 12:
        life_stage = "puppy"
    elif age_months > 84:  # 7+ years
        life_stage = "senior"
    else:
        life_stage = "adult"
    
    # Get current month for seasonal context
    current_month = datetime.now(timezone.utc).month
    
    # Build smart categories based on context
    smart_categories = []
    smart_tags = []
    why_it_fits_reasons = []
    
    # 1. BREED-BASED INTELLIGENCE
    if breed_data:
        grooming_needs = breed_data.get("grooming_needs", "medium")
        exercise_needs = breed_data.get("exercise_needs", "medium")
        health_predispositions = breed_data.get("health_predispositions", [])
        
        if grooming_needs in ["high", "very_high"]:
            smart_tags.extend(["grooming", "coat care", "brush", "shampoo"])
            why_it_fits_reasons.append(f"{breed}s need regular grooming for their coat")
        
        if exercise_needs in ["high", "very_high"]:
            smart_tags.extend(["toys", "outdoor", "fetch", "exercise"])
            why_it_fits_reasons.append(f"{breed}s are active and need mental stimulation")
        
        if "joint_issues" in health_predispositions or "hip_dysplasia" in health_predispositions:
            smart_tags.extend(["joint", "supplement", "mobility"])
            why_it_fits_reasons.append(f"Supports {pet_name}'s joint health")
    
    # 2. LIFE STAGE INTELLIGENCE
    if life_stage == "puppy":
        smart_tags.extend(["puppy", "training", "teething", "socialization"])
        smart_categories.extend(["puppy essentials", "training"])
        why_it_fits_reasons.append(f"{pet_name} is still growing and learning")
    elif life_stage == "senior":
        smart_tags.extend(["senior", "joint", "digestive", "comfort"])
        smart_categories.extend(["senior care"])
        why_it_fits_reasons.append(f"Gentle care for {pet_name}'s golden years")
    
    # 3. SEASONAL INTELLIGENCE (India-focused)
    if current_month in [3, 4, 5]:  # March-May = Summer prep
        smart_tags.extend(["cooling", "hydration", "summer", "paw protection"])
        why_it_fits_reasons.append("Summer's coming - time to prepare!")
    elif current_month in [6, 7, 8, 9]:  # June-Sept = Monsoon
        smart_tags.extend(["tick", "flea", "raincoat", "paw wash", "antifungal"])
        why_it_fits_reasons.append("Monsoon essentials to keep ticks away")
    elif current_month in [10, 11]:  # Oct-Nov = Festival season
        smart_tags.extend(["anxiety", "calming", "treats", "celebration"])
        why_it_fits_reasons.append("Festival season - keep calm treats ready")
    elif current_month in [12, 1, 2]:  # Dec-Feb = Winter/Pleasant
        smart_tags.extend(["outdoor", "travel", "adventure", "jacket"])
        why_it_fits_reasons.append("Perfect weather for outdoor adventures!")
    
    # 4. ALWAYS INCLUDE ESSENTIALS
    smart_tags.extend(["treats", "dental", "wellness"])
    
    if not smart_tags:
        smart_tags = ["treats", "toys", "wellness", "grooming"]
        why_it_fits_reasons = [f"{breed}s like {pet_name} love this" if breed else f"Perfect for {pet_name}"]
    
    # Query products matching smart tags
    try:
        query = {
            "in_stock": {"$ne": False},
            "$or": [
                {"tags": {"$in": smart_tags[:15]}},
                {"name": {"$regex": "|".join(smart_tags[:10]), "$options": "i"}},
                {"category": {"$regex": "|".join(smart_categories[:5]), "$options": "i"}} if smart_categories else {"_id": {"$exists": True}}
            ]
        }
        
        products = await db.unified_products.find(query, {"_id": 0}).limit(30).to_list(30)
        
        # Filter allergies and score
        smart_picks = []
        for product in products:
            # Skip allergens
            product_allergens = [a.lower() for a in (product.get("allergens") or [])]
            if any(allergy.lower() in product_allergens for allergy in pet_allergies):
                continue
            
            # Calculate score based on tag matches
            product_tags = [t.lower() for t in (product.get("tags") or [])]
            product_name = (product.get("name") or "").lower()
            
            score = sum(1 for tag in smart_tags if tag.lower() in product_tags or tag.lower() in product_name)
            
            if score > 0:
                # Pick a relevant reason
                reason = why_it_fits_reasons[0] if why_it_fits_reasons else f"Mira picked this for {pet_name}"
                
                smart_picks.append({
                    "id": product.get("id") or product.get("product_id"),
                    "name": product.get("name"),
                    "image_url": product.get("image_url") or product.get("images", [None])[0],
                    "price": product.get("price"),
                    "why_it_fits": reason,
                    "pick_source": "mira_knows",
                    "score": score
                })
        
        # Sort by score and return top picks
        smart_picks.sort(key=lambda x: x["score"], reverse=True)
        return smart_picks[:limit]
        
    except Exception as e:
        logger.error(f"[PICKS SOUL] Smart fallback error: {e}")
        return []


async def get_timely_picks_for_intents(
    db, 
    intents: List[Dict], 
    pet: Dict, 
    pet_allergies: List[str],
    limit: int = 8
) -> List[Dict]:
    """
    Get products that match the user's recent conversation intents.
    These become the "{petName} might need this" shelf in PICKS.
    """
    if not intents:
        return []
    
    pet_name = pet.get("name", "Your pet")
    
    # Collect all relevant categories and tags from intents
    all_categories = []
    all_tags = []
    matched_topics = []
    
    for intent in intents:
        topic = intent.get("topic")
        mapping = INTENT_TO_PICKS_MAPPING.get(topic)
        if mapping:
            all_categories.extend(mapping.get("categories", []))
            all_tags.extend(mapping.get("tags", []))
            matched_topics.append(topic)
    
    if not all_categories and not all_tags:
        return []
    
    # Remove duplicates
    all_categories = list(set(all_categories))
    all_tags = list(set(all_tags))
    
    # Build query - match by category OR tags OR name
    category_regex = "|".join(all_categories[:10])
    tags_list = all_tags[:10]
    
    query = {
        "in_stock": {"$ne": False},
        "$or": [
            {"category": {"$regex": category_regex, "$options": "i"}},
            {"tags": {"$in": tags_list}},
            {"name": {"$regex": category_regex, "$options": "i"}},
        ]
    }
    
    try:
        products = await db.unified_products.find(query, {"_id": 0}).limit(30).to_list(30)
        
        # Score and filter products
        scored_products = []
        for product in products:
            # Skip if allergens match pet's allergies
            product_allergens = [a.lower() for a in (product.get("allergens") or [])]
            if any(allergy.lower() in product_allergens for allergy in pet_allergies):
                continue
            
            # Calculate relevance score
            score = 0
            product_name = (product.get("name") or "").lower()
            product_category = (product.get("category") or "").lower()
            product_tags = [t.lower() for t in (product.get("tags") or [])]
            
            for cat in all_categories:
                if cat.lower() in product_name:
                    score += 20
                if cat.lower() in product_category:
                    score += 15
            
            for tag in all_tags:
                if tag.lower() in product_tags:
                    score += 10
                if tag.lower() in product_name:
                    score += 8
            
            if score > 0:
                # Generate soul-aware "why it fits" reason
                why_it_fits = generate_timely_reason(product, matched_topics, pet_name)
                
                scored_products.append({
                    **product,
                    "relevance_score": score,
                    "is_timely": True,
                    "timely_badge": "Timely",
                    "why_it_fits": why_it_fits,
                    "matched_topics": matched_topics
                })
        
        # Sort by relevance and return top picks
        scored_products.sort(key=lambda p: p.get("relevance_score", 0), reverse=True)
        
        return scored_products[:limit]
        
    except Exception as e:
        logger.error(f"[PICKS SOUL] Failed to get timely picks: {e}")
        return []


def generate_timely_reason(product: Dict, topics: List[str], pet_name: str) -> str:
    """Generate a soul-aware reason for why this product is timely for the pet."""
    name = (product.get("name") or "").lower()
    category = (product.get("category") or "").lower()
    
    # Topic-specific reasons
    if "grooming" in topics:
        if "brush" in name or "comb" in name:
            return f"Keep {pet_name}'s coat tangle-free"
        if "shampoo" in name or "wash" in name:
            return f"Gentle cleaning for {pet_name}"
        if "nail" in name:
            return f"Keep {pet_name}'s nails healthy"
        return f"Perfect for {pet_name}'s grooming routine"
    
    if "travel" in topics:
        if "carrier" in name or "carrier" in category:
            return f"Safe travels with {pet_name}"
        if "bowl" in name:
            return f"Hydration on the go for {pet_name}"
        return f"Essential for {pet_name}'s adventures"
    
    if "health" in topics:
        if "supplement" in name or "vitamin" in name:
            return f"Support {pet_name}'s wellbeing"
        if "dental" in name or "teeth" in name:
            return f"Keep {pet_name}'s smile healthy"
        return f"Health essentials for {pet_name}"
    
    if "food" in topics:
        if "treat" in name:
            return f"Wholesome rewards for {pet_name}"
        return f"Nutrition {pet_name} will love"
    
    if "behaviour" in topics or "training" in topics:
        if "calm" in name or "anxiety" in name:
            return f"Help {pet_name} stay relaxed"
        if "training" in name:
            return f"Support {pet_name}'s learning"
        return f"Positive vibes for {pet_name}"
    
    if "senior" in topics:
        if "joint" in name or "mobility" in name:
            return f"Comfort for {pet_name}'s golden years"
        return f"Extra care for {pet_name}"
    
    if "puppies" in topics:
        if "teething" in name:
            return f"Soothe {pet_name}'s growing teeth"
        return f"Perfect for young {pet_name}"
    
    # Default
    return f"Recommended for {pet_name}"


def get_current_season() -> dict:
    """Get current seasonal event if any."""
    now = datetime.now()
    month = now.month
    day = now.day
    
    for event_name, config in SEASONAL_EVENTS.items():
        if month in config["months"]:
            day_start, day_end = config["days"]
            if day_start <= day <= day_end or day_end == 31:  # Full month
                return {"event": event_name, "categories": config["categories"], "boost": config["boost"]}
    
    return None

def is_pet_birthday_near(pet: dict) -> dict:
    """Check if pet's birthday is within 14 days."""
    dob = pet.get("date_of_birth") or pet.get("birthday")
    if not dob:
        return None
    
    try:
        bday = datetime.fromisoformat(str(dob).replace('Z', '+00:00'))
        now = datetime.now()
        this_year_bday = bday.replace(year=now.year)
        days_until = (this_year_bday - now).days
        
        if -7 <= days_until <= 14:
            return {"days_until": days_until, "boost": 40 if days_until <= 7 else 25}
    except (ValueError, TypeError):
        pass
    
    return None

def get_smart_badges(product: dict, pet: dict, pillar: str, purchase_history: list = None) -> list:
    """Generate smart badges for a product."""
    badges = []
    season = get_current_season()
    birthday_info = is_pet_birthday_near(pet)
    category = (product.get("category") or "").lower()
    name = (product.get("name") or "").lower()
    
    # Trending badge (based on score or popularity)
    if product.get("popularity_score", 0) > 70 or product.get("score", 0) > 80:
        badges.append("trending")
    
    # New badge (created in last 30 days)
    created_at = product.get("created_at")
    if created_at:
        try:
            created = datetime.fromisoformat(str(created_at).replace('Z', '+00:00'))
            if (datetime.now() - created).days < 30:
                badges.append("new")
        except (ValueError, TypeError):
            pass
    
    # Reorder badge (previously purchased)
    if purchase_history and product.get("id") in purchase_history:
        badges.append("reorder")
    
    # Birthday badge
    if birthday_info and pillar in ["celebrate", "shop"]:
        if any(kw in category or kw in name for kw in ["birthday", "cake", "party", "celebration", "gift"]):
            badges.append("birthday")
    
    # Seasonal badge
    if season:
        if any(cat in category or cat in name for cat in season["categories"]):
            badges.append("seasonal")
    
    return badges


def is_safe_for_pet(product: dict, pet_allergies: list, pet_health_flags: list) -> bool:
    """Check if a product is safe for this specific pet."""
    # Get product ingredients/tags
    product_name = (product.get("name") or "").lower()
    product_desc = (product.get("description") or product.get("short_description") or "").lower()
    diet_tags = product.get("diet_tags") or []
    
    # Check global blocked items
    for blocked in BLOCKED_ITEMS:
        if blocked in product_name or blocked in product_desc:
            return False
    
    # Check pet-specific allergies
    for allergy in pet_allergies:
        allergy_lower = allergy.lower()
        # Skip if allergy is in product name/description (strict filter)
        if allergy_lower in product_name:
            return False
        # Check diet tags
        if allergy_lower in [t.lower() for t in diet_tags]:
            return False
    
    return True


def build_why_reason(product: dict, pet: dict, pillar: str) -> str:
    """Generate a personalized 'why this pick' reason."""
    pet_name = pet.get("name", "your pet")
    pet_breed = pet.get("breed", "")
    
    breed_tags = product.get("breed_tags") or []
    occasion_tags = product.get("occasion_tags") or []
    
    # Breed-specific match
    if pet_breed and pet_breed.lower() in [t.lower() for t in breed_tags]:
        return f"Perfect for {pet_breed}s like {pet_name}"
    
    # Occasion match
    if pillar == "celebrate" and "birthday" in occasion_tags:
        return f"🎂 Great for {pet_name}'s special day!"
    
    # Generic pillar-based reasons
    reasons = {
        "celebrate": f"Curated celebration pick for {pet_name}",
        "dine": f"Tasty & safe for {pet_name}'s diet",
        "care": f"Helps keep {pet_name} healthy & happy",
        "stay": f"Comfort essentials for {pet_name}",
        "travel": f"Travel-ready for adventures with {pet_name}",
        "learn": f"Training support for {pet_name}",
        "fit": f"Keeps {pet_name} active & fit",
        "enjoy": f"Fun times for {pet_name}",
        "advisory": f"Expert guidance for {pet_name}'s wellbeing",
        "paperwork": f"Stay organized for {pet_name}",
        "shop": f"Top pick for {pet_name}",
    }
    
    return reasons.get(pillar, f"Recommended for {pet_name}")


async def get_pillar_picks(
    db: AsyncIOMotorDatabase,
    pillar: str,
    pet: dict,
    limit: int = 5  # Increased to include concierge card
) -> List[Dict[str, Any]]:
    """Get top picks for a specific pillar, filtered by pet parameters."""
    
    pet_allergies = pet.get("preferences") or {}.get("allergies") or []
    pet_size = pet.get("weight_kg", 15)  # Default medium
    pet_breed = pet.get("breed", "")
    pet_age = pet.get("age_years") or 3  # Default adult
    pet_health_flags = pet.get("health_vault") or {}.get("conditions") or []
    
    # Determine size category
    if pet_size < 10:
        size_cat = "small"
    elif pet_size < 25:
        size_cat = "medium"
    else:
        size_cat = "large"
    
    # Determine life stage
    if pet_age and pet_age < 1:
        life_stage = "puppy"
    elif pet_age and pet_age > 7:
        life_stage = "senior"
    else:
        life_stage = "adult"
    
    picks = []
    products = []
    
    # ═══════════════════════════════════════════════════════════════════════════════
    # CARE PILLAR: Prioritize comprehensive care products from products_master
    # These have size/coat/life_stage/temperament/intent tags
    # ═══════════════════════════════════════════════════════════════════════════════
    if pillar == "care":
        # Query comprehensive care products (with good_for_tags)
        care_query = {
            "pillar": "care",
            "good_for_tags": {"$exists": True, "$ne": []},
            "status": {"$in": ["active", None]}
        }
        
        # Get all comprehensive care products first
        care_products = await db.products_master.find(care_query, {"_id": 0}).limit(30).to_list(30)
        
        # Score and filter by pet profile
        for product in care_products:
            good_for_tags = product.get("good_for_tags", [])
            intent_tags = product.get("intent_tags", [])
            
            # Calculate match score
            score = 50  # Base score
            
            # Size match
            if size_cat in good_for_tags or "all" in good_for_tags:
                score += 25
            
            # Life stage match
            if life_stage in good_for_tags:
                score += 20
            
            # Check soul data for temperament match
            soul = pet.get("soul") or {}
            temperament = soul.get("temperament", "").lower()
            if temperament:
                if temperament in good_for_tags:
                    score += 15
                if "anxious" in good_for_tags and temperament in ["anxious", "nervous", "shy"]:
                    score += 10
            
            # Coat type match
            coat_type = soul.get("coat_type", "").lower().replace(" ", "_")
            if coat_type and coat_type in good_for_tags:
                score += 15
            
            # Skip if no matches at all
            if score == 50:
                continue
                
            # Build why reason
            why_parts = []
            if size_cat in good_for_tags:
                why_parts.append(f"perfect for {size_cat} breeds")
            if life_stage in good_for_tags:
                why_parts.append(f"great for {life_stage}s")
            if coat_type and coat_type in good_for_tags:
                why_parts.append(f"ideal for {coat_type.replace('_', ' ')}")
            why_reason = " • ".join(why_parts) if why_parts else product.get("concierge_note", "")
            
            picks.append({
                "id": product.get("id"),
                "name": product.get("name"),
                "price": product.get("price"),
                "image": product.get("image"),
                "type": "product",
                "pick_type": "catalogue",
                "why_reason": why_reason,
                "score": score,
                "category": product.get("subcategory", "care"),
                "badges": [],
                "good_for_tags": good_for_tags,
                "intent_tags": intent_tags,
            })
        
        # Sort by score and take top items
        picks.sort(key=lambda x: x.get("score", 0), reverse=True)
        
        # If we have enough comprehensive products, return them
        if len(picks) >= 5:
            catalogue_picks = picks[:5]
        else:
            # Fall through to also query unified_products if needed
            catalogue_picks = picks
    else:
        catalogue_picks = []
    
    # ═══════════════════════════════════════════════════════════════════════════════
    # For non-care pillars or if we need more products, query unified_products
    # ═══════════════════════════════════════════════════════════════════════════════
    if pillar != "care" or len(catalogue_picks) < 5:
        # Query products for this pillar
        # Priority: exact pillar match > primary_pillar > pillars array
        # Note: in_stock may be None for some products, so we check for != False
        
        # Normalize pet breed for matching
        pet_breed_normalized = (pet_breed or "").lower().strip()
        pet_breed_display = pet_breed.replace("_", " ").title() if pet_breed else ""
        
        # First, get products with exact pillar match (highest priority)
        # IMPORTANT: Exclude cat products - we are THE DOGGY COMPANY!
        # Also exclude breed-specific products that don't match this pet's breed
        exact_query = {
            "pillar": pillar,
            "in_stock": {"$ne": False},
            "visibility.status": {"$in": ["active", None]},
            # Filter out cat products
            "name": {"$not": {"$regex": "cat|kitten|feline|meow|purr|kitty", "$options": "i"}},
            "pet_type": {"$nin": ["cat", "cats", "feline"]},
        }
        
        # Add breed exclusion unless the product matches pet's breed
        if pet_breed_normalized:
            # Include products that either:
            # 1. Don't have breed-specific names (not matching BREED_EXCLUSION_PATTERN)
            # 2. OR match this pet's breed
            exact_query["$or"] = [
                {"name": {"$not": {"$regex": BREED_EXCLUSION_PATTERN, "$options": "i"}}},
                {"name": {"$regex": f"^{pet_breed_display}", "$options": "i"}}
            ]
        else:
            # No pet breed known, exclude all breed-specific products
            exact_query["name"]["$not"] = {"$regex": BREED_EXCLUSION_PATTERN, "$options": "i"}
        
        cursor = db.unified_products.find(exact_query, {"_id": 0}).limit(20)
        products = await cursor.to_list(length=20)
    
    # If not enough, add products with primary_pillar match
    if len(products) < 15:
        primary_query = {
            "primary_pillar": pillar,
            "pillar": {"$ne": pillar},  # Avoid duplicates
            "in_stock": {"$ne": False},
            "visibility.status": {"$in": ["active", None]},
            # Exclude breed-specific products for other breeds
            "name": {"$not": {"$regex": BREED_EXCLUSION_PATTERN, "$options": "i"}}
        }
        additional = await db.unified_products.find(primary_query, {"_id": 0}).limit(10).to_list(length=10)
        products.extend(additional)
    
    # If still not enough, add products from pillars array
    if len(products) < 10:
        array_query = {
            "pillars": pillar,
            "pillar": {"$ne": pillar},
            "primary_pillar": {"$ne": pillar},
            "in_stock": {"$ne": False},
            "visibility.status": {"$in": ["active", None]},
            # Exclude breed-specific products for other breeds
            "name": {"$not": {"$regex": BREED_EXCLUSION_PATTERN, "$options": "i"}}
        }
        more = await db.unified_products.find(array_query, {"_id": 0}).limit(5).to_list(length=5)
        products.extend(more)
    
    # ═══════════════════════════════════════════════════════════════════════════════
    # CELEBRATE PILLAR: Also fetch real products from products_master (Shopify)
    # This includes cakes, treats, hampers etc. from thedoggybakery.com
    # ALWAYS include these for variety, regardless of unified_products count
    # ═══════════════════════════════════════════════════════════════════════════════
    if pillar == "celebrate":
        celebrate_categories = ['cakes', 'treats', 'hampers', 'mini-cakes', 'desi-treats', 'frozen-treats', 'dognuts']
        shopify_products = await db.products_master.find({
            "category": {"$in": celebrate_categories},
            "shopify_id": {"$exists": True}
            # Note: Not filtering by in_stock as Shopify sync may not set this correctly
        }, {"_id": 0}).limit(20).to_list(20)
        
        # Add shopify products at the beginning for prominence
        existing_ids = set(p.get("id") or p.get("shopify_id") for p in products)
        shopify_to_add = []
        for sp in shopify_products:
            sp_id = sp.get("id") or sp.get("shopify_id")
            if sp_id and sp_id not in existing_ids:
                shopify_to_add.append(sp)
                existing_ids.add(sp_id)
        
        # Prepend Shopify products so they get higher priority in picks
        products = shopify_to_add[:10] + products
        logger.info(f"[TOP-PICKS] Added {len(shopify_to_add)} Shopify products for celebrate pillar")
    
    # Also get services for this pillar
    service_cursor = db.services.find({"pillar": pillar}, {"_id": 0}).limit(10)
    services = await service_cursor.to_list(length=10)
    
    # Filter and score products
    for product in products:
        if not is_safe_for_pet(product, pet_allergies, pet_health_flags):
            continue
        
        # Calculate relevance score
        score = 50  # Base score
        
        # Boost for breed match
        breed_tags = product.get("breed_tags") or []
        if pet_breed and pet_breed.lower() in [t.lower() for t in breed_tags]:
            score += 30
        if "all_breeds" in breed_tags:
            score += 10
        
        # Boost for size match
        size_tags = product.get("size_tags") or []
        if size_cat in [t.lower() for t in size_tags] or "all_sizes" in size_tags:
            score += 15
        
        # Boost for life stage match
        lifestage_tags = product.get("lifestage_tags") or []
        if life_stage in [t.lower() for t in lifestage_tags]:
            score += 15
        
        # Seasonal boost
        season = get_current_season()
        if season:
            category = (product.get("category") or "").lower()
            name = (product.get("name") or "").lower()
            if any(cat in category or cat in name for cat in season["categories"]):
                score += season["boost"]
        
        # Birthday boost
        birthday_info = is_pet_birthday_near(pet)
        if birthday_info and pillar == "celebrate":
            score += birthday_info["boost"]
        
        # Get smart badges
        badges = get_smart_badges(product, pet, pillar)
        
        picks.append({
            "id": product.get("id") or product.get("shopify_id"),
            "name": product.get("name"),
            "price": product.get("price") or product.get("base_price"),
            "image": product.get("image") or product.get("thumbnail"),
            "type": "product",
            "pick_type": "catalogue",
            "why_reason": build_why_reason(product, pet, pillar),
            "score": score,
            "category": product.get("category"),
            "badges": badges,
            "created_at": product.get("created_at"),
        })
    
    # Add services
    for service in services:
        badges = get_smart_badges(service, pet, pillar)
        picks.append({
            "id": service.get("id") or service.get("service_id"),
            "name": service.get("name"),
            "price": service.get("price") or service.get("base_price"),
            "image": service.get("image") or service.get("icon"),
            "type": "service",
            "pick_type": "catalogue",
            "why_reason": build_why_reason(service, pet, pillar),
            "score": 60,
            "category": service.get("category"),
            "badges": badges,
        })
    
    # Sort by score 
    picks.sort(key=lambda x: x.get("score", 0), reverse=True)
    
    # ═══════════════════════════════════════════════════════════════════════════════
    # CATALOGUE PICKS (up to 5) + CONCIERGE PICKS (up to 5)
    # This shows the breadth of what Concierge® can do for users
    # ═══════════════════════════════════════════════════════════════════════════════
    
    # For Care pillar, catalogue_picks is already set from comprehensive products
    if pillar != "care" or not catalogue_picks:
        catalogue_picks = picks[:5]  # Top 5 catalogue items
    
    # Generate Concierge picks from our detailed suggestions
    concierge_picks = []
    pillar_suggestions = CONCIERGE_SUGGESTIONS.get(pillar, [])
    pet_name = pet.get('name', 'your pet')
    
    for i, suggestion in enumerate(pillar_suggestions[:5]):  # Up to 5 concierge suggestions
        # Replace {pet} placeholder with actual pet name
        why_it_fits = suggestion.get("why_it_fits", "").replace("{pet}", pet_name)
        what_we_source = suggestion.get("what_we_source", "").replace("{pet}", pet_name)
        selection_rules = [rule.replace("{pet}", pet_name) for rule in suggestion.get("selection_rules", [])]
        questions = [q.replace("{pet}", pet_name) for q in suggestion.get("questions", [])]
        
        concierge_card = {
            "id": f"concierge-{pillar}-{i}-{pet_name}",
            "name": suggestion["name"],
            "price": None,
            "image": None,
            "type": "concierge_suggestion",
            "pick_type": "concierge",
            "icon": suggestion.get("icon", "sparkles"),
            "gradient": suggestion.get("gradient", ["#8B5CF6", "#EC4899"]),
            "spec_chip": suggestion.get("spec_chip", "Custom"),
            "why_it_fits": why_it_fits,
            "what_we_source": what_we_source,
            "selection_rules": selection_rules,
            "safety_note": suggestion.get("safety_note", ""),
            "questions": questions,
            "handpicked_for": pet_name,  # "Handpicked for Lola"
            "score": 50 - i,
            "badges": [],
        }
        concierge_picks.append(concierge_card)
    
    # Combine: catalogue first, then concierge
    all_picks = catalogue_picks + concierge_picks
    
    # If NO catalogue picks, make sure we have at least the concierge picks
    if len(catalogue_picks) == 0 and len(concierge_picks) == 0:
        all_picks.append({
            "id": f"concierge-{pillar}",
            "name": f"Custom {pillar.title()} Solution",
            "price": None,
            "image": None,
            "type": "concierge_suggestion",
            "pick_type": "concierge",
            "why_reason": f"Our Concierge® will source the perfect {pillar} solution for {pet.get('name', 'your pet')}",
            "score": 100,
            "badges": [],
            "specs": [
                f"Tailored for {pet_breed or 'your dog'}",
                f"Size: {size_cat}",
                f"Life stage: {life_stage}",
                "Safety-verified sourcing"
            ]
        })
    
    return all_picks  # Return all (up to 10 total)


@router.get("/top-picks/{pet_id}")
async def get_top_picks(
    pet_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Get personalized top picks for a specific pet across all pillars.
    
    Returns picks filtered by:
    - Pet's allergies
    - Pet's size
    - Pet's breed
    - Pet's age/life stage
    - Pet's health conditions
    
    SOUL INTEGRATION (NEW):
    - Reads recent chat intents from user_learn_intents
    - Shows "{petName} might need this" shelf with contextually relevant products
    - Mira knows - feels intuitive, not "based on your chat"
    """
    global db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Get pet data
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        # Try by name for backwards compatibility
        pet = await db.pets.find_one({"name": {"$regex": pet_id, "$options": "i"}}, {"_id": 0})
    
    if not pet:
        raise HTTPException(status_code=404, detail=f"Pet not found: {pet_id}")
    
    # Build pet intelligence summary
    pet_allergies = pet.get("preferences") or {}.get("allergies") or []
    pet_size = pet.get("weight_kg")
    pet_breed = pet.get("breed", "Unknown")
    pet_name = pet.get("name", "Your pet")
    
    size_label = "Unknown"
    if pet_size:
        if pet_size < 10:
            size_label = "Small"
        elif pet_size < 25:
            size_label = "Medium"
        else:
            size_label = "Large"
    
    # Get seasonal and birthday context
    season = get_current_season()
    birthday_info = is_pet_birthday_near(pet)
    
    pet_intelligence = {
        "name": pet_name,
        "breed": pet_breed,
        "size": size_label,
        "weight_kg": pet_size,
        "allergies": pet_allergies,
        "soul_score": pet.get("overall_score", 0),
        "photo_url": pet.get("photo_url"),
        "birthday_near": birthday_info is not None,
        "days_to_birthday": birthday_info.get("days_until") if birthday_info else None,
    }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SOUL INTEGRATION: Get timely picks based on recent chat intents
    # Mira knows what the pet parent is thinking about right now
    # ═══════════════════════════════════════════════════════════════════════════
    timely_picks = []
    timely_context = {"enabled": False, "topics": []}
    
    # Extract user_id from token if available
    user_id = None
    if authorization:
        try:
            import jwt
            token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get("sub") or payload.get("user_id")
        except Exception:
            pass
    
    # Also try to get user_id from pet's owner
    if not user_id:
        user_id = pet.get("owner_email") or pet.get("owner_id")
    
    # Get the actual pet_id from the database (not the input parameter which might be a name)
    actual_pet_id = pet.get("id") or pet.get("name")
    
    logger.info(f"[PICKS SOUL] Looking up intents for user_id={user_id}, pet_id={actual_pet_id}")
    
    if user_id:
        # Fetch recent intents (last 48 hours)
        recent_intents = await get_user_recent_intents(db, user_id, actual_pet_id)
        logger.info(f"[PICKS SOUL] get_user_recent_intents returned {len(recent_intents)} intents")
        
        if recent_intents:
            timely_context["enabled"] = True
            timely_context["topics"] = [i["topic"] for i in recent_intents]
            logger.info(f"[PICKS SOUL] Found {len(recent_intents)} recent intents for {pet_name}: {timely_context['topics']}")
            
            # Get timely products matching these intents
            timely_picks = await get_timely_picks_for_intents(
                db, recent_intents, pet, pet_allergies, limit=8
            )
            
            if timely_picks:
                logger.info(f"[PICKS SOUL] Generated {len(timely_picks)} timely picks for {pet_name}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # MIRA IS THE SOUL - Smart Fallback when no intents
    # Mira ALWAYS knows something intelligent to suggest based on:
    # 1. Breed knowledge (grooming needs, exercise, common health issues)
    # 2. Seasonal context (summer prep, monsoon safety, winter care)
    # 3. Pet age/life stage (puppy needs, senior care)
    # 4. Profile gaps (prompt to complete vaccination records, etc.)
    # ═══════════════════════════════════════════════════════════════════════════
    if not timely_picks:
        timely_picks = await get_smart_fallback_picks(db, pet, pet_allergies, limit=6)
        if timely_picks:
            timely_context["enabled"] = True
            timely_context["source"] = "mira_knows"
            logger.info(f"[PICKS SOUL] Generated {len(timely_picks)} smart fallback picks for {pet_name}")
    
    # Get picks for each pillar
    pillar_picks = {}
    for pillar_info in INCLUDED_PILLARS:
        pillar_id = pillar_info["id"]
        all_picks = await get_pillar_picks(db, pillar_id, pet, limit=10)  # Get up to 10 (5 catalogue + 5 concierge)
        
        # Separate catalogue and concierge picks
        catalogue_picks = [p for p in all_picks if p.get("pick_type") != "concierge"]
        concierge_picks = [p for p in all_picks if p.get("pick_type") == "concierge"]
        
        pillar_picks[pillar_id] = {
            "pillar": pillar_info,
            "picks": catalogue_picks[:5],  # Up to 5 catalogue
            "catalogue_picks": catalogue_picks[:5],  # Alias for frontend compatibility
            "concierge_picks": concierge_picks[:5],  # Up to 5 concierge
            "total_picks": len(catalogue_picks) + len(concierge_picks),
        }
    
    # Calculate total picks
    total_picks = sum(p["total_picks"] for p in pillar_picks.values())
    
    # ═══════════════════════════════════════════════════════════════════════════
    # INTENT-DRIVEN DYNAMIC CARDS - "{Pet} needs this for {Intent}"
    # MIRA (Brain) generates these for CONCIERGE (Hands) to fulfill
    # These are NOT from catalogue - Concierge sources them (no price)
    # ═══════════════════════════════════════════════════════════════════════════
    intent_driven = {
        "has_recommendations": False,
        "intent": None,
        "intent_display": None,
        "shelf_title": None,
        "picks": [],
        "services": []
    }
    
    try:
        from intent_driven_cards import get_current_pet_intent, generate_dynamic_picks, generate_dynamic_services, INTENT_RECOMMENDATIONS
        
        # Get current active intent for this pet
        pet_intent = await get_current_pet_intent(db, actual_pet_id)
        
        if pet_intent and pet_intent.get("intent"):
            intent_key = pet_intent["intent"]
            intent_display = pet_intent.get("intent_display") or intent_key.replace("_", " ").title()
            
            # Generate dynamic picks (Concierge-sourced, no price)
            dynamic_picks = generate_dynamic_picks(
                intent=intent_key,
                pet_name=pet_name,
                pet_context=pet,
                limit=5
            )
            
            # Generate dynamic services
            dynamic_services = generate_dynamic_services(
                intent=intent_key,
                pet_name=pet_name,
                pet_context=pet,
                limit=4
            )
            
            if dynamic_picks or dynamic_services:
                intent_driven = {
                    "has_recommendations": True,
                    "intent": intent_key,
                    "intent_display": intent_display,
                    "shelf_title": f"{pet_name} needs this for {intent_display}",
                    "picks": dynamic_picks,
                    "services": dynamic_services
                }
                logger.info(f"[PICKS] Intent-driven: {len(dynamic_picks)} picks, {len(dynamic_services)} services for '{intent_key}'")
    except Exception as intent_err:
        logger.warning(f"[PICKS] Intent-driven cards error: {intent_err}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PERSONALIZED PRODUCTS - "Personalized for {Pet}" shelf
    # ALWAYS shown proactively - unique items featuring the pet
    # All go to Concierge for fulfillment (no fixed price)
    # ═══════════════════════════════════════════════════════════════════════════
    personalized_shelf = {
        "shelf_title": f"Personalized for {pet_name}",
        "shelf_subtitle": "Unique items featuring your pet",
        "products": [],
        "has_products": False
    }
    
    try:
        from personalized_products import get_personalized_shelf
        personalized_shelf = await get_personalized_shelf(
            db=db,
            pet_id=actual_pet_id,
            pet_name=pet_name,
            limit=6
        )
        logger.info(f"[PICKS] Personalized shelf: {len(personalized_shelf.get('products', []))} products for {pet_name}")
    except Exception as personalized_err:
        logger.warning(f"[PICKS] Personalized products error: {personalized_err}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CELEBRATE SHELF - Shown when birthday intent detected
    # Links to /celebrate cake designer tool
    # ═══════════════════════════════════════════════════════════════════════════
    celebrate_shelf = None
    if intent_driven.get("intent") == "birthday":
        try:
            from personalized_products import get_celebrate_shelf
            celebrate_shelf = await get_celebrate_shelf(
                db=db,
                pet_id=actual_pet_id,
                pet_name=pet_name,
                occasion="birthday"
            )
            logger.info(f"[PICKS] Celebrate shelf generated for {pet_name}'s birthday")
        except Exception as celebrate_err:
            logger.warning(f"[PICKS] Celebrate shelf error: {celebrate_err}")
    
    return {
        "success": True,
        "pet": pet_intelligence,
        "timely_picks": timely_picks,  # "{petName} might need this" shelf (from catalogue)
        "timely_context": timely_context,  # Context info
        "intent_driven": intent_driven,  # Dynamic Concierge cards based on intent
        "personalized": personalized_shelf,  # NEW: "Personalized for {Pet}" shelf (always shown)
        "celebrate": celebrate_shelf,  # NEW: Celebrate shelf (when birthday intent)
        "pillars": pillar_picks,
        "total_picks": total_picks,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters_applied": {
            "allergies": pet_allergies,
            "size": size_label,
            "breed": pet_breed,
        },
        "context": {
            "season": season,
            "birthday_near": birthday_info,
        }
    }


@router.get("/top-picks/{pet_id}/pillar/{pillar}")
async def get_pillar_top_picks(
    pet_id: str,
    pillar: str,
    limit: int = 8
):
    """Get more picks for a specific pillar."""
    global db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        pet = await db.pets.find_one({"name": {"$regex": pet_id, "$options": "i"}}, {"_id": 0})
    
    if not pet:
        raise HTTPException(status_code=404, detail=f"Pet not found: {pet_id}")
    
    picks = await get_pillar_picks(db, pillar, pet, limit=limit)
    
    pillar_info = next((p for p in INCLUDED_PILLARS if p["id"] == pillar), None)
    
    return {
        "success": True,
        "pillar": pillar_info,
        "picks": picks,
        "pet_name": pet.get("name"),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CONTEXT-AWARE PICKS - Based on conversation topic
# "Going to Goa" → travel picks + beach accessories + travel carriers
# ═══════════════════════════════════════════════════════════════════════════════

# Context to pillar + tag mappings
CONTEXT_MAPPINGS = {
    # Travel destinations → travel pillar + location-specific tags
    "goa": {"pillar": "travel", "tags": ["beach", "resort", "coastal", "vacation", "carrier", "travel bag", "sun protection"], "location": "Goa"},
    "mumbai": {"pillar": "travel", "tags": ["city", "urban", "carrier"], "location": "Mumbai"},
    "bangalore": {"pillar": "travel", "tags": ["city", "parks", "urban"], "location": "Bangalore"},
    "delhi": {"pillar": "travel", "tags": ["city", "urban", "winter"], "location": "Delhi"},
    "himachal": {"pillar": "travel", "tags": ["mountains", "cold", "snow", "hiking", "winter gear"], "location": "Himachal"},
    "manali": {"pillar": "travel", "tags": ["mountains", "cold", "snow", "hiking"], "location": "Manali"},
    "kerala": {"pillar": "travel", "tags": ["beach", "backwaters", "tropical", "monsoon"], "location": "Kerala"},
    "rajasthan": {"pillar": "travel", "tags": ["desert", "heritage", "summer", "sun protection"], "location": "Rajasthan"},
    "pondicherry": {"pillar": "travel", "tags": ["beach", "coastal", "french", "vacation"], "location": "Pondicherry"},
    "lonavala": {"pillar": "travel", "tags": ["hills", "monsoon", "weekend"], "location": "Lonavala"},
    "ooty": {"pillar": "travel", "tags": ["hills", "cool", "tea gardens"], "location": "Ooty"},
    
    # Activity contexts
    "beach": {"pillar": "travel", "tags": ["beach", "sand", "water", "sun protection", "life jacket", "water toys"]},
    "mountain": {"pillar": "travel", "tags": ["hiking", "cold", "jacket", "boots", "carrier backpack"]},
    "trip": {"pillar": "travel", "tags": ["carrier", "travel bag", "portable bowl", "travel treats", "car seat"]},
    "vacation": {"pillar": "travel", "tags": ["carrier", "travel", "portable", "foldable", "vacation"]},
    "hotel": {"pillar": "stay", "tags": ["travel", "boarding", "pet-friendly", "comfort"]},
    "road trip": {"pillar": "travel", "tags": ["car seat", "seat belt", "travel bowl", "car hammock"]},
    "flight": {"pillar": "travel", "tags": ["airline approved carrier", "travel crate", "pet passport"]},
    
    # Grooming contexts
    "grooming": {"pillar": "care", "tags": ["grooming", "brush", "shampoo", "nail clipper", "deshedding"]},
    "bath": {"pillar": "care", "tags": ["shampoo", "conditioner", "towel", "dryer", "bath"]},
    "haircut": {"pillar": "care", "tags": ["grooming", "trimmer", "scissors", "clipper"]},
    
    # Food contexts
    "food": {"pillar": "dine", "tags": ["food", "treats", "meal", "nutrition"]},
    "treats": {"pillar": "dine", "tags": ["treats", "snacks", "biscuits", "chews"]},
    "birthday": {"pillar": "celebrate", "tags": ["cake", "party", "celebration", "birthday treats", "party hat"]},
    "party": {"pillar": "celebrate", "tags": ["party", "celebration", "decorations", "treats"]},
    
    # Health contexts
    "vet": {"pillar": "care", "tags": ["health", "checkup", "medicine", "supplements"]},
    "health": {"pillar": "care", "tags": ["health", "supplements", "vitamins", "wellness"]},
    
    # Training contexts
    "training": {"pillar": "learn", "tags": ["training", "leash", "collar", "treats", "clicker"]},
    "walking": {"pillar": "enjoy", "tags": ["leash", "harness", "collar", "poop bags", "walking"]},
}

from pydantic import BaseModel

class ContextAwarePicksRequest(BaseModel):
    pet_id: str
    context: str
    destination: Optional[str] = None
    limit: int = 8

@router.post("/top-picks/context-aware")
async def get_context_aware_picks(request: ContextAwarePicksRequest):
    """
    Get context-aware picks based on conversation topic.
    
    When user asks about "going to Goa", returns:
    - Travel carriers
    - Beach gear
    - Sun protection items
    - Pet-friendly hotel recommendations
    
    Args:
        pet_id: Pet ID or name
        context: Conversation context/topic (e.g., "goa", "beach trip", "grooming")
        destination: Optional specific destination
        limit: Max picks to return
    """
    global db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet_id = request.pet_id
    context = request.context
    destination = request.destination
    limit = request.limit
    
    # Get pet data
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        pet = await db.pets.find_one({"name": {"$regex": pet_id, "$options": "i"}}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail=f"Pet not found: {pet_id}")
    
    # Normalize context
    context_lower = context.lower().strip()
    destination_lower = (destination or "").lower().strip()
    
    # Find matching context mapping
    matched_pillar = "travel"  # Default for destination queries
    matched_tags = []
    matched_location = destination
    
    # Check destination first
    if destination_lower:
        for key, mapping in CONTEXT_MAPPINGS.items():
            if key in destination_lower:
                matched_pillar = mapping["pillar"]
                matched_tags.extend(mapping.get("tags", []))
                matched_location = mapping.get("location", destination)
                break
    
    # Then check context
    for key, mapping in CONTEXT_MAPPINGS.items():
        if key in context_lower:
            matched_pillar = mapping["pillar"]
            matched_tags.extend(mapping.get("tags", []))
            if not matched_location:
                matched_location = mapping.get("location")
            break
    
    # Remove duplicates from tags
    matched_tags = list(set(matched_tags))
    
    # Build query for products
    pet_allergies = pet.get("preferences") or {}.get("allergies") or []
    
    # Query: Match pillar OR any of the context tags
    query = {
        "in_stock": {"$ne": False},
        "visibility.status": {"$in": ["active", None]},
        "$or": [
            {"pillar": matched_pillar},
            {"primary_pillar": matched_pillar},
            {"tags": {"$in": matched_tags}} if matched_tags else {},
            {"category": {"$regex": "|".join(matched_tags[:5]), "$options": "i"}} if matched_tags else {},
            {"name": {"$regex": "|".join(matched_tags[:5]), "$options": "i"}} if matched_tags else {},
        ]
    }
    
    # Get products
    products = await db.unified_products.find(query, {"_id": 0}).limit(20).to_list(20)
    
    # Score products by tag relevance
    scored_products = []
    for product in products:
        # Skip if allergies
        product_allergens = product.get("allergens") or []
        if any(a.lower() in [al.lower() for al in product_allergens] for a in pet_allergies):
            continue
        
        # Calculate relevance score
        score = 0
        product_name = (product.get("name") or "").lower()
        product_category = (product.get("category") or "").lower()
        product_tags = [t.lower() for t in (product.get("tags") or [])]
        
        for tag in matched_tags:
            tag_lower = tag.lower()
            if tag_lower in product_name:
                score += 20
            if tag_lower in product_category:
                score += 15
            if tag_lower in product_tags:
                score += 10
        
        # Boost for pillar match
        if product.get("pillar") == matched_pillar:
            score += 25
        if product.get("primary_pillar") == matched_pillar:
            score += 20
            
        scored_products.append({
            **product,
            "relevance_score": score,
            "matched_context": context,
            "why_it_fits": generate_context_reason(product, matched_tags, pet.get("name", "your pet"), matched_location)
        })
    
    # Sort by relevance
    scored_products.sort(key=lambda p: p.get("relevance_score", 0), reverse=True)
    
    # Get concierge picks for this context
    concierge_picks = get_context_concierge_picks(matched_pillar, matched_tags, matched_location, pet.get("name", "Your pet"))
    
    return {
        "success": True,
        "context": {
            "original": context,
            "destination": destination,
            "matched_pillar": matched_pillar,
            "matched_tags": matched_tags,
            "location": matched_location,
        },
        "pet_name": pet.get("name"),
        "picks": scored_products[:limit],
        "concierge_picks": concierge_picks[:4],
        "total": len(scored_products) + len(concierge_picks)
    }


def generate_context_reason(product: dict, tags: List[str], pet_name: str, location: Optional[str]) -> str:
    """Generate a personalized reason for why this product fits the context."""
    name = product.get("name", "")
    category = (product.get("category") or "").lower()
    
    # Location-specific reasons
    if location:
        if "beach" in tags or location.lower() in ["goa", "kerala", "pondicherry"]:
            if "carrier" in category or "carrier" in name.lower():
                return f"Easy to carry {pet_name} on beach trips to {location}"
            if "water" in name.lower() or "splash" in name.lower():
                return f"Perfect for beach fun with {pet_name} in {location}"
            if "sun" in name.lower() or "protection" in name.lower():
                return f"Keeps {pet_name} safe from the {location} sun"
        
        if "mountain" in tags or location.lower() in ["himachal", "manali", "ooty"]:
            if "jacket" in name.lower() or "sweater" in name.lower():
                return f"Keeps {pet_name} warm in {location}'s cool weather"
            if "carrier" in category or "backpack" in name.lower():
                return f"Carry {pet_name} comfortably on {location} trails"
    
    # General context reasons
    if "travel" in tags or "carrier" in category:
        return f"Perfect travel companion for {pet_name}'s adventures"
    if "beach" in tags:
        return f"Beach-ready gear for {pet_name}"
    if "grooming" in tags:
        return f"Keeps {pet_name} looking their best"
    
    return f"Recommended for {pet_name}'s {location or 'trip'}"


def get_context_concierge_picks(pillar: str, tags: List[str], location: Optional[str], pet_name: str) -> List[dict]:
    """Get concierge service picks relevant to the context."""
    picks = []
    
    if pillar == "travel" or "travel" in tags:
        picks.append({
            "pick_type": "concierge",
            "name": "Pet-Friendly Hotel Booking",
            "description": f"We'll find and book the best pet-friendly hotel for {pet_name}" + (f" in {location}" if location else ""),
            "what_we_arrange": "Hotel booking with pet amenities, welcome treats, and ground floor room preference",
            "includes": ["Pet-friendly room", "Welcome treats", "Pet bed arrangement", "Nearby park map"],
            "cta": "Book Hotel",
            "why_it_fits": f"Stress-free travel planning for {pet_name}"
        })
        picks.append({
            "pick_type": "concierge",
            "name": "Travel Essentials Kit",
            "description": f"Custom travel kit curated for {pet_name}'s specific needs",
            "what_we_arrange": "Carrier, portable bowl, travel treats, and destination-specific items",
            "includes": ["Right-sized carrier", "Collapsible bowls", "Travel treats", "First aid mini kit"],
            "cta": "Curate Kit",
            "why_it_fits": f"Everything {pet_name} needs for the trip"
        })
    
    if pillar == "celebrate" or "birthday" in tags or "party" in tags:
        picks.append({
            "pick_type": "concierge",
            "name": "Pet Party Planning",
            "description": f"Complete birthday party arrangement for {pet_name}",
            "what_we_arrange": "Cake, decorations, pet-safe treats for guests, photo session",
            "includes": ["Custom cake", "Party decorations", "Guest treats", "Photo shoot"],
            "cta": "Plan Party",
            "why_it_fits": f"Make {pet_name}'s special day unforgettable"
        })
    
    if pillar == "care" or "grooming" in tags:
        picks.append({
            "pick_type": "concierge",
            "name": "Premium Grooming Session",
            "description": f"At-home or salon grooming for {pet_name}",
            "what_we_arrange": "Certified groomer, breed-specific styling, gentle handling",
            "includes": ["Bath & dry", "Nail trim", "Ear cleaning", "Breed-specific cut"],
            "cta": "Book Grooming",
            "why_it_fits": f"Professional care tailored to {pet_name}"
        })
    
    return picks

