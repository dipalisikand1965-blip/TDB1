"""
Top Picks API - Personalized picks for each pet across all pillars
"Mira is the Brain, Concierge® is the Hands"

This endpoint powers the "Top Picks for [Pet]" panel that shows
intelligent, pet-aware recommendations across all pillars.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime
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
    except:
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
        except:
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
    
    pet_allergies = pet.get("preferences", {}).get("allergies") or []
    pet_size = pet.get("weight_kg", 15)  # Default medium
    pet_breed = pet.get("breed", "")
    pet_age = pet.get("age_years") or 3  # Default adult
    pet_health_flags = pet.get("health_vault", {}).get("conditions") or []
    
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
    
    # Query products for this pillar
    # Priority: exact pillar match > primary_pillar > pillars array
    # Note: in_stock may be None for some products, so we check for != False
    
    # First, get products with exact pillar match (highest priority)
    # IMPORTANT: Exclude cat products - we are THE DOGGY COMPANY!
    exact_query = {
        "pillar": pillar,
        "in_stock": {"$ne": False},
        "visibility.status": {"$in": ["active", None]},
        # Filter out cat products
        "name": {"$not": {"$regex": "cat|kitten|feline|meow|purr|kitty", "$options": "i"}},
        "pet_type": {"$nin": ["cat", "cats", "feline"]},
    }
    cursor = db.unified_products.find(exact_query, {"_id": 0}).limit(20)
    products = await cursor.to_list(length=20)
    
    # If not enough, add products with primary_pillar match
    if len(products) < 15:
        primary_query = {
            "primary_pillar": pillar,
            "pillar": {"$ne": pillar},  # Avoid duplicates
            "in_stock": {"$ne": False},
            "visibility.status": {"$in": ["active", None]}
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
            "visibility.status": {"$in": ["active", None]}
        }
        more = await db.unified_products.find(array_query, {"_id": 0}).limit(5).to_list(length=5)
        products.extend(more)
    
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
async def get_top_picks(pet_id: str):
    """
    Get personalized top picks for a specific pet across all pillars.
    
    Returns picks filtered by:
    - Pet's allergies
    - Pet's size
    - Pet's breed
    - Pet's age/life stage
    - Pet's health conditions
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
    pet_allergies = pet.get("preferences", {}).get("allergies") or []
    pet_size = pet.get("weight_kg")
    pet_breed = pet.get("breed", "Unknown")
    
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
        "name": pet.get("name"),
        "breed": pet_breed,
        "size": size_label,
        "weight_kg": pet_size,
        "allergies": pet_allergies,
        "soul_score": pet.get("overall_score", 0),
        "photo_url": pet.get("photo_url"),
        "birthday_near": birthday_info is not None,
        "days_to_birthday": birthday_info.get("days_until") if birthday_info else None,
    }
    
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
            "concierge_picks": concierge_picks[:5],  # Up to 5 concierge
            "total_picks": len(catalogue_picks) + len(concierge_picks),
        }
    
    # Calculate total picks
    total_picks = sum(p["total_picks"] for p in pillar_picks.values())
    
    return {
        "success": True,
        "pet": pet_intelligence,
        "pillars": pillar_picks,
        "total_picks": total_picks,
        "generated_at": datetime.utcnow().isoformat(),
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
