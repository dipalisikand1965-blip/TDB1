"""
LEARN OS Layer - Content Seeder
===============================
Seeds the initial 30 tiny guides + 20 curated videos.
All content is India-relevant and action-oriented.

Trust Gating: All items start with is_active=True after review.
"""

from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)

# ============================================
# TINY GUIDES (30 total)
# Categories: Health & Safety, Grooming, Food, Behaviour, Travel/Boarding, Seasonal
# ============================================

STARTER_GUIDES = [
    # ===== HEALTH & SAFETY (8 guides) =====
    {
        "id": "guide_emergency_signs",
        "title": "Emergency Signs: When to Rush to the Vet",
        "topic": "health",
        "summary": "Know the warning signs that need immediate veterinary attention.",
        "reading_time_sec": 90,
        "steps": [
            "Check breathing - rapid, labored, or absent breathing needs emergency care",
            "Look for pale or blue gums - indicates poor oxygen or shock",
            "Watch for collapse, seizures, or inability to stand",
            "Note any bleeding that won't stop after 5 minutes of pressure",
            "Check for bloated, hard abdomen (especially in large breeds)"
        ],
        "watch_for": [
            "Lethargy lasting more than 24 hours",
            "Repeated vomiting or diarrhea (more than 3 times)",
            "Refusal to eat for more than 2 days"
        ],
        "when_to_escalate": [
            "Call your vet immediately if you see ANY of these signs",
            "Don't wait for 'it to pass' - time matters in emergencies"
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Find 24/7 vet clinic", "service_type": "vet_visit", "prefill": {"urgency": "emergency"}}
        ],
        "risk_level": "high",
        "escalation_required": True,
        "is_featured": True,
        "is_active": True,
        "sort_rank": 1,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_tick_protocol",
        "title": "Tick Prevention & Removal Protocol",
        "topic": "health",
        "summary": "Protect your dog from tick-borne diseases with this simple routine.",
        "reading_time_sec": 120,
        "steps": [
            "Check your dog daily - run fingers through coat, especially around ears, neck, and paws",
            "Use tick prevention (spot-on, collar, or oral) as prescribed by your vet",
            "Keep grass trimmed in your yard - ticks love tall grass",
            "Remove ticks with fine-tipped tweezers - grasp close to skin, pull straight up",
            "Clean the bite area with antiseptic after removal",
            "Save the tick in a sealed container for 2 weeks (helps if symptoms develop)"
        ],
        "watch_for": [
            "Fever or lethargy 3-21 days after a tick bite",
            "Loss of appetite or joint stiffness",
            "Tick paralysis (rare but serious) - weakness starting from back legs"
        ],
        "when_to_escalate": [
            "Vet visit needed if fever develops after tick exposure",
            "Bring the saved tick to help with diagnosis"
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Order tick prevention", "service_type": "product_order", "prefill": {"category": "tick_prevention"}},
            {"label": "Book vet checkup", "service_type": "vet_visit", "prefill": {"reason": "tick_check"}}
        ],
        "risk_level": "medium",
        "escalation_required": True,
        "is_featured": True,
        "is_active": True,
        "sort_rank": 2,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_vaccination_basics",
        "title": "Vaccination Schedule: What Your Dog Needs",
        "topic": "health",
        "summary": "Keep your dog protected with timely vaccinations.",
        "reading_time_sec": 90,
        "steps": [
            "Core vaccines (required): Rabies, Distemper, Parvovirus, Hepatitis",
            "Puppy schedule: 6-8 weeks, 10-12 weeks, 14-16 weeks, then annual boosters",
            "Adult schedule: Annual boosters or as recommended by your vet",
            "Keep vaccination records handy - needed for boarding, grooming, travel",
            "Schedule appointments 2-3 weeks before boarding or travel"
        ],
        "watch_for": [
            "Mild side effects (24-48 hours): slight fever, reduced appetite, lethargy",
            "Swelling at injection site usually resolves in a few days"
        ],
        "when_to_escalate": [
            "Call vet if swelling increases or doesn't improve in 3 days",
            "Seek immediate care for facial swelling, difficulty breathing, or collapse"
        ],
        "pet_tags": ["puppy", "adult"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Book vaccination", "service_type": "vet_visit", "prefill": {"reason": "vaccination"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": True,
        "is_active": True,
        "sort_rank": 3,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_first_aid_kit",
        "title": "Pet First Aid Kit Essentials",
        "topic": "health",
        "summary": "Be prepared for minor injuries with these must-haves.",
        "reading_time_sec": 75,
        "steps": [
            "Gauze pads and bandages for wound coverage",
            "Antiseptic wipes or betadine solution",
            "Tweezers (for ticks and splinters)",
            "Digital thermometer (normal: 38-39°C)",
            "Saline solution for eye washing",
            "Your vet's emergency number saved in your phone"
        ],
        "watch_for": [
            "Know your nearest 24/7 emergency vet clinic",
            "First aid is for stabilization - always follow up with vet care"
        ],
        "when_to_escalate": [
            "Any wound deeper than surface-level needs vet attention",
            "Burns, broken bones, and poisoning require immediate professional care"
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Order first aid kit", "service_type": "product_order", "prefill": {"category": "first_aid"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 10,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_deworming",
        "title": "Deworming Schedule for Dogs",
        "topic": "health",
        "summary": "Keep intestinal parasites at bay with regular deworming.",
        "reading_time_sec": 60,
        "steps": [
            "Puppies: Deworm every 2 weeks until 12 weeks old, then monthly until 6 months",
            "Adults: Deworm every 3 months (quarterly)",
            "Give dewormer with food to reduce stomach upset",
            "Weigh your dog accurately - dosage depends on weight"
        ],
        "watch_for": [
            "Visible worms in stool or around rear end",
            "Scooting, bloated belly, weight loss despite good appetite",
            "Dull coat and low energy"
        ],
        "when_to_escalate": [
            "See vet if worms persist after 2 treatments",
            "Heavy infestations in puppies can be life-threatening"
        ],
        "pet_tags": ["puppy", "adult"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Order dewormer", "service_type": "product_order", "prefill": {"category": "dewormer"}},
            {"label": "Book vet consult", "service_type": "vet_visit", "prefill": {"reason": "deworming"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 11,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_dental_care",
        "title": "Dog Dental Care at Home",
        "topic": "health",
        "summary": "Prevent dental disease with these simple daily habits.",
        "reading_time_sec": 90,
        "steps": [
            "Brush teeth 2-3 times per week (daily is ideal)",
            "Use dog-specific toothpaste (human toothpaste is toxic)",
            "Start slow - let them taste the paste, then work up to brushing",
            "Provide dental chews approved by vets",
            "Annual dental checkup with your vet"
        ],
        "watch_for": [
            "Bad breath that persists",
            "Red, swollen, or bleeding gums",
            "Difficulty eating or dropping food",
            "Brown/yellow tartar buildup"
        ],
        "when_to_escalate": [
            "Schedule dental cleaning if tartar is visible",
            "Loose teeth or oral pain needs vet attention"
        ],
        "pet_tags": ["adult", "senior"],
        "breed_tags": ["toy", "brachy"],
        "service_cta": [
            {"label": "Book dental checkup", "service_type": "vet_visit", "prefill": {"reason": "dental"}},
            {"label": "Order dental care kit", "service_type": "product_order", "prefill": {"category": "dental"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 12,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_ear_cleaning",
        "title": "Safe Ear Cleaning for Dogs",
        "topic": "health",
        "summary": "Prevent ear infections with proper cleaning technique.",
        "reading_time_sec": 75,
        "steps": [
            "Check ears weekly for redness, odor, or discharge",
            "Use vet-approved ear cleaner - never water or DIY solutions",
            "Fill ear canal, massage base for 30 seconds, let dog shake",
            "Wipe outer ear with cotton ball - never insert anything into canal",
            "Clean after swimming or baths"
        ],
        "watch_for": [
            "Head shaking or scratching at ears",
            "Brown or yellow discharge",
            "Foul smell from ears",
            "Redness or swelling"
        ],
        "when_to_escalate": [
            "Persistent scratching or head tilt needs vet check",
            "Dark brown/black debris may indicate ear mites"
        ],
        "pet_tags": ["all"],
        "breed_tags": ["floppy_ears", "spaniel", "retriever"],
        "service_cta": [
            {"label": "Order ear cleaner", "service_type": "product_order", "prefill": {"category": "ear_care"}},
            {"label": "Book vet checkup", "service_type": "vet_visit", "prefill": {"reason": "ear_infection"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 13,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_eye_care",
        "title": "Eye Care & Tear Stain Prevention",
        "topic": "health",
        "summary": "Keep your dog's eyes healthy and clean.",
        "reading_time_sec": 60,
        "steps": [
            "Wipe eye area daily with damp cotton ball (one per eye)",
            "Trim hair around eyes carefully to prevent irritation",
            "Use saline solution for gentle cleaning if needed",
            "Check for tear staining and keep area dry"
        ],
        "watch_for": [
            "Excessive tearing or discharge",
            "Redness or cloudiness in eyes",
            "Squinting or pawing at eyes",
            "Green or yellow discharge (infection sign)"
        ],
        "when_to_escalate": [
            "Any eye injury needs immediate vet care",
            "Sudden cloudiness or vision changes require urgent attention"
        ],
        "pet_tags": ["all"],
        "breed_tags": ["brachy", "shih_tzu", "pug", "bulldog"],
        "service_cta": [
            {"label": "Order eye care products", "service_type": "product_order", "prefill": {"category": "eye_care"}}
        ],
        "risk_level": "medium",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 14,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    
    # ===== GROOMING (6 guides) =====
    {
        "id": "guide_first_grooming",
        "title": "First-Time Grooming Prep",
        "topic": "grooming",
        "summary": "Make your puppy's first grooming experience positive.",
        "reading_time_sec": 90,
        "steps": [
            "Start at home - handle paws, ears, tail daily so they're comfortable",
            "Schedule short 'intro visit' before full grooming",
            "Ensure vaccinations are complete (usually after 16 weeks)",
            "Bring treats and a familiar toy for comfort",
            "Stay calm - dogs pick up on your anxiety",
            "Don't overschedule - first session should be simple (bath, brush, nail trim)"
        ],
        "watch_for": [
            "Signs of stress: panting, drooling, trying to escape",
            "Some nervousness is normal - excessive fear is not"
        ],
        "when_to_escalate": [
            "If your dog is extremely fearful, ask about fear-free grooming options",
            "Consider mobile grooming for anxious dogs"
        ],
        "pet_tags": ["puppy"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Book puppy grooming intro", "service_type": "grooming", "prefill": {"type": "puppy_intro"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": True,
        "is_active": True,
        "sort_rank": 1,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_bathing_basics",
        "title": "Bathing Your Dog at Home",
        "topic": "grooming",
        "summary": "Bath time doesn't have to be a battle. Here's how to do it right.",
        "reading_time_sec": 90,
        "steps": [
            "Brush thoroughly before bath to remove mats and loose hair",
            "Use lukewarm water (test on your wrist - comfortable, not hot)",
            "Use dog-specific shampoo - human products can irritate skin",
            "Avoid getting water in ears (use cotton balls as plugs)",
            "Rinse completely - leftover soap causes itching",
            "Dry thoroughly, especially in skin folds and between toes"
        ],
        "watch_for": [
            "Hot spots or skin irritation after bathing",
            "Excessive scratching (may indicate product sensitivity)",
            "Ear infections from water in ears"
        ],
        "when_to_escalate": [
            "See vet if skin irritation persists or worsens",
            "Professional grooming recommended for dogs with severe matting"
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Order dog shampoo", "service_type": "product_order", "prefill": {"category": "shampoo"}},
            {"label": "Book professional bath", "service_type": "grooming", "prefill": {"type": "bath"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 5,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_nail_trim",
        "title": "Nail Trimming Without Fear",
        "topic": "grooming",
        "summary": "Keep nails healthy with stress-free trimming.",
        "reading_time_sec": 75,
        "steps": [
            "Use sharp, dog-specific nail clippers or grinder",
            "Identify the quick (pink part with blood supply) - avoid cutting it",
            "For dark nails, trim small bits at a time until you see gray center",
            "Trim every 2-4 weeks - if nails click on floor, they're too long",
            "Have styptic powder ready in case of bleeding"
        ],
        "watch_for": [
            "Signs of overgrown nails: clicking sound, splaying paws, difficulty walking",
            "Nails curling into paw pads (needs immediate attention)"
        ],
        "when_to_escalate": [
            "Ingrown nails need professional removal",
            "If bleeding doesn't stop with styptic powder, see vet"
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Book nail trim", "service_type": "grooming", "prefill": {"type": "nail_trim"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 6,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_brushing_coats",
        "title": "Brushing Guide by Coat Type",
        "topic": "grooming",
        "summary": "Match your brushing routine to your dog's coat.",
        "reading_time_sec": 90,
        "steps": [
            "Short coats: Rubber brush or bristle brush, once weekly",
            "Double coats: Undercoat rake + slicker brush, 2-3x weekly (daily during shedding)",
            "Long coats: Slicker brush + metal comb, daily to prevent mats",
            "Curly coats: Slicker brush + detangling spray, every 2-3 days",
            "Always brush before baths - water tightens mats"
        ],
        "watch_for": [
            "Mats behind ears, under legs, around collar area",
            "Excessive shedding (could indicate skin or health issues)",
            "Skin irritation or bald patches"
        ],
        "when_to_escalate": [
            "Severe matting needs professional de-matting or shaving",
            "Sudden coat changes warrant vet checkup"
        ],
        "pet_tags": ["all"],
        "breed_tags": ["double_coat", "long_coat", "curly_coat"],
        "service_cta": [
            {"label": "Order grooming brushes", "service_type": "product_order", "prefill": {"category": "brushes"}},
            {"label": "Book deshedding treatment", "service_type": "grooming", "prefill": {"type": "deshedding"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 7,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_summer_cut",
        "title": "Summer Grooming: Do Dogs Need Shaving?",
        "topic": "grooming",
        "summary": "The truth about summer cuts and keeping dogs cool.",
        "reading_time_sec": 75,
        "steps": [
            "DON'T shave double-coated breeds (Husky, GSD, Golden) - their coat insulates against heat too",
            "DO regular brushing to remove undercoat and improve airflow",
            "Trim paw pads to prevent overheating from hot surfaces",
            "Keep belly hair trimmed for cooling on cool floors",
            "Consider a 'summer trim' not a full shave for long coats"
        ],
        "watch_for": [
            "Sunburn on shaved areas (pink skin, peeling)",
            "Coat not growing back properly after shaving double coats"
        ],
        "when_to_escalate": [
            "Consult groomer before shaving any double-coated breed",
            "Sunburn needs vet attention if blistered"
        ],
        "pet_tags": ["all"],
        "breed_tags": ["double_coat", "husky", "golden", "gsd"],
        "service_cta": [
            {"label": "Book summer grooming consult", "service_type": "grooming", "prefill": {"type": "summer_trim"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 8,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_paw_care",
        "title": "Paw Pad Care & Protection",
        "topic": "grooming",
        "summary": "Keep paws healthy through all seasons.",
        "reading_time_sec": 60,
        "steps": [
            "Check paws daily for cuts, cracks, or foreign objects",
            "Keep hair between paw pads trimmed (prevents matting and slipping)",
            "Apply paw balm in hot/cold weather to prevent cracking",
            "Rinse paws after walks to remove dirt and irritants",
            "Test pavement temperature - if too hot for your palm, it's too hot for paws"
        ],
        "watch_for": [
            "Limping or favoring a paw",
            "Excessive licking of paws (could indicate allergy or injury)",
            "Cracks, redness, or swelling"
        ],
        "when_to_escalate": [
            "Deep cuts or embedded objects need vet care",
            "Burns from hot pavement require treatment"
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Order paw balm", "service_type": "product_order", "prefill": {"category": "paw_care"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 9,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    
    # ===== FOOD (5 guides) =====
    {
        "id": "guide_feeding_schedule",
        "title": "Feeding Schedule by Age",
        "topic": "food",
        "summary": "How often and how much to feed at every life stage.",
        "reading_time_sec": 75,
        "steps": [
            "Puppies (8-12 weeks): 4 meals per day",
            "Puppies (3-6 months): 3 meals per day",
            "Puppies (6-12 months): 2 meals per day",
            "Adults: 2 meals per day (morning and evening)",
            "Seniors: 2 smaller meals, may need special diet",
            "Follow food package guidelines, adjust based on body condition"
        ],
        "watch_for": [
            "Weight gain (can't feel ribs easily)",
            "Weight loss (ribs too prominent)",
            "Decreased appetite lasting more than 2 days"
        ],
        "when_to_escalate": [
            "Consult vet for personalized feeding plan",
            "Sudden weight changes need investigation"
        ],
        "pet_tags": ["puppy", "adult", "senior"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Get nutrition consult", "service_type": "vet_visit", "prefill": {"reason": "nutrition"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": True,
        "is_active": True,
        "sort_rank": 1,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_toxic_foods",
        "title": "Foods Toxic to Dogs",
        "topic": "food",
        "summary": "These common foods can be dangerous or deadly for dogs.",
        "reading_time_sec": 60,
        "steps": [
            "NEVER give: Chocolate, grapes/raisins, onions, garlic, xylitol",
            "Avoid: Macadamia nuts, alcohol, caffeine, avocado (pit and skin)",
            "Be careful: Cooked bones (can splinter), fatty foods, raw dough",
            "Safe treats: Plain cooked chicken, carrots, apples (no seeds), pumpkin",
            "Keep emergency vet number handy"
        ],
        "watch_for": [
            "Vomiting, diarrhea, lethargy after eating something new",
            "Drooling, panting, or restlessness",
            "Tremors or seizures (especially with chocolate/xylitol)"
        ],
        "when_to_escalate": [
            "Call vet or poison helpline IMMEDIATELY if toxic food is ingested",
            "Bring packaging to vet to calculate dosage exposure"
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Find emergency vet", "service_type": "vet_visit", "prefill": {"urgency": "emergency"}}
        ],
        "risk_level": "high",
        "escalation_required": True,
        "is_featured": True,
        "is_active": True,
        "sort_rank": 2,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_picky_eater",
        "title": "Dealing with a Picky Eater",
        "topic": "food",
        "summary": "Tips to encourage healthy eating without creating bad habits.",
        "reading_time_sec": 75,
        "steps": [
            "Rule out medical issues first with a vet visit",
            "Set meal times - food down for 15-20 minutes, then remove",
            "Avoid free-feeding (leaving food out all day)",
            "Don't give in to begging - resist the sad eyes!",
            "Try warming food slightly or adding warm water to kibble",
            "Gradually transition if changing foods (over 7-10 days)"
        ],
        "watch_for": [
            "Sudden appetite loss (could be illness)",
            "Eating but losing weight",
            "Only eating treats but refusing meals"
        ],
        "when_to_escalate": [
            "No eating for 48+ hours needs vet attention",
            "Weight loss despite normal eating habits"
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Book nutrition consult", "service_type": "vet_visit", "prefill": {"reason": "picky_eating"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 10,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_treats_training",
        "title": "Treats 101: Choosing & Using Wisely",
        "topic": "food",
        "summary": "Treats should be part of training, not the whole diet.",
        "reading_time_sec": 60,
        "steps": [
            "Treats should be <10% of daily calories",
            "Break large treats into small pieces for training",
            "Use high-value treats (chicken, cheese) for difficult training",
            "Low-calorie options: carrots, green beans, apple pieces",
            "Avoid table scraps as treats (encourages begging)"
        ],
        "watch_for": [
            "Weight gain from too many treats",
            "Upset stomach from rich treats",
            "Dog refusing meals but wanting treats"
        ],
        "when_to_escalate": [
            "Consult vet if treats are causing digestive issues",
            "Discuss treat options for dogs with health conditions"
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Order training treats", "service_type": "product_order", "prefill": {"category": "training_treats"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 11,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_water_hydration",
        "title": "Water & Hydration Guide",
        "topic": "food",
        "summary": "Keep your dog properly hydrated year-round.",
        "reading_time_sec": 60,
        "steps": [
            "Dogs need ~30ml water per kg body weight daily (more in hot weather)",
            "Always have fresh, clean water available",
            "Wash water bowl daily to prevent bacteria growth",
            "Carry water on walks, especially in summer",
            "Monitor water intake - sudden changes can indicate health issues"
        ],
        "watch_for": [
            "Signs of dehydration: dry gums, lethargy, sunken eyes",
            "Excessive thirst (could indicate diabetes or kidney issues)",
            "Refusing to drink (pain, nausea, or illness)"
        ],
        "when_to_escalate": [
            "See vet if drinking dramatically increases or decreases",
            "Dehydration symptoms need prompt treatment"
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "service_cta": [],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 12,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    
    # ===== BEHAVIOUR (5 guides) =====
    {
        "id": "guide_fireworks_anxiety",
        "title": "Fireworks & Loud Noise Anxiety",
        "topic": "behaviour",
        "summary": "Help your dog stay calm during Diwali, thunderstorms, and celebrations.",
        "reading_time_sec": 90,
        "steps": [
            "Create a safe space - interior room, covered crate, or under a bed",
            "Close windows and curtains to reduce noise and flashes",
            "Play calming music or white noise to mask sounds",
            "Don't force comfort - let your dog come to you",
            "Use calming aids (Thundershirt, calming treats) - start before the event",
            "Exercise earlier in the day to tire them out"
        ],
        "watch_for": [
            "Panting, pacing, hiding, trembling",
            "Escape attempts (secure doors, windows, gates)",
            "Destructive behavior when left alone during events"
        ],
        "when_to_escalate": [
            "Talk to vet about anxiety medication for severe cases",
            "Consider a trainer for desensitization program"
        ],
        "pet_tags": ["anxious"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Order calming products", "service_type": "product_order", "prefill": {"category": "calming"}},
            {"label": "Book anxiety consult", "service_type": "vet_visit", "prefill": {"reason": "anxiety"}}
        ],
        "risk_level": "medium",
        "escalation_required": False,
        "is_featured": True,
        "is_active": True,
        "sort_rank": 1,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_separation_anxiety",
        "title": "Managing Separation Anxiety",
        "topic": "behaviour",
        "summary": "Help your dog feel secure when you're away.",
        "reading_time_sec": 90,
        "steps": [
            "Start with short absences - step out for 5 minutes, gradually increase",
            "Don't make departures emotional - keep hellos and goodbyes calm",
            "Leave comfort items - worn t-shirt, safe chew toy, treat puzzle",
            "Exercise before leaving to reduce energy and anxiety",
            "Consider crate training - dogs often feel safer in a den-like space",
            "Play calming music or leave TV on for background noise"
        ],
        "watch_for": [
            "Destructive behavior only when alone",
            "Excessive barking or howling when left",
            "Accidents in house from anxiety (housebroken dog)",
            "Escape attempts"
        ],
        "when_to_escalate": [
            "Severe cases may need medication + behavior modification",
            "Work with certified trainer for systematic desensitization"
        ],
        "pet_tags": ["anxious"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Book trainer consult", "service_type": "training", "prefill": {"type": "separation_anxiety"}},
            {"label": "Order calming products", "service_type": "product_order", "prefill": {"category": "calming"}}
        ],
        "risk_level": "medium",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 5,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_leash_training",
        "title": "Leash Training Basics",
        "topic": "behaviour",
        "summary": "Transform walks from battles to enjoyable outings.",
        "reading_time_sec": 75,
        "steps": [
            "Use a proper-fitting harness (not collar) for training",
            "Start indoors with leash on - let them get used to the feel",
            "Reward walking beside you with treats",
            "Stop and wait when they pull - resume when leash is slack",
            "Be patient and consistent - good leash manners take time",
            "Keep training sessions short (10-15 minutes)"
        ],
        "watch_for": [
            "Excessive pulling can injure throat (use harness)",
            "Reactivity toward other dogs or people",
            "Fear of the leash itself"
        ],
        "when_to_escalate": [
            "Professional trainer for reactive dogs",
            "If lunging or aggression on leash develops"
        ],
        "pet_tags": ["puppy", "adult"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Book training session", "service_type": "training", "prefill": {"type": "leash_training"}},
            {"label": "Order training harness", "service_type": "product_order", "prefill": {"category": "harness"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 6,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_puppy_biting",
        "title": "Puppy Biting & Mouthing",
        "topic": "behaviour",
        "summary": "Teach bite inhibition without breaking your puppy's spirit.",
        "reading_time_sec": 75,
        "steps": [
            "Say 'ouch!' in a high-pitched voice when they bite - then ignore for 10 seconds",
            "Redirect biting to appropriate toys immediately",
            "Provide frozen teething toys for sore gums",
            "End playtime if biting continues - consistency is key",
            "Never use physical punishment - it increases aggression"
        ],
        "watch_for": [
            "Biting that draws blood (even accidentally needs training)",
            "Biting with growling or stiff body language",
            "Biting that doesn't decrease by 6 months"
        ],
        "when_to_escalate": [
            "Consult trainer if biting doesn't improve by 6 months",
            "See vet if you suspect pain-related biting"
        ],
        "pet_tags": ["puppy"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Book puppy training", "service_type": "training", "prefill": {"type": "puppy_basics"}},
            {"label": "Order teething toys", "service_type": "product_order", "prefill": {"category": "teething"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 7,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_barking",
        "title": "Excessive Barking Solutions",
        "topic": "behaviour",
        "summary": "Understand why your dog barks and how to manage it.",
        "reading_time_sec": 90,
        "steps": [
            "Identify the trigger: boredom, alert, fear, attention-seeking, or separation",
            "Don't yell - it sounds like you're barking too",
            "For alert barking: acknowledge, say 'thank you,' then redirect",
            "For attention barking: completely ignore until quiet, then reward silence",
            "Increase exercise and mental stimulation to reduce boredom barking",
            "Teach 'quiet' command - reward the moment of silence"
        ],
        "watch_for": [
            "Sudden increase in barking (could indicate pain or hearing loss)",
            "Barking only when alone (separation anxiety)",
            "Barking at specific triggers (may need desensitization)"
        ],
        "when_to_escalate": [
            "Consult trainer for persistent barking issues",
            "Rule out medical causes with vet visit"
        ],
        "pet_tags": ["all"],
        "breed_tags": ["terrier", "herding"],
        "service_cta": [
            {"label": "Book behavior consult", "service_type": "training", "prefill": {"type": "barking"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 8,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    
    # ===== TRAVEL & BOARDING (3 guides) =====
    {
        "id": "guide_boarding_checklist",
        "title": "Boarding Prep Checklist",
        "topic": "boarding",
        "summary": "Everything you need for a stress-free boarding experience.",
        "reading_time_sec": 90,
        "steps": [
            "Update vaccinations (at least 2 weeks before boarding)",
            "Schedule pre-boarding vet visit for health certificate if needed",
            "Pack: food (enough + extra), medications, comfort item (unwashed blanket/toy)",
            "Provide written instructions: feeding schedule, commands, emergency contacts",
            "Do a trial overnight stay before longer trips",
            "Leave emergency contact and vet details"
        ],
        "watch_for": [
            "Signs of kennel cough after boarding (coughing, sneezing)",
            "Stress symptoms: not eating, lethargy, stomach upset",
            "Changes in behavior after returning home"
        ],
        "when_to_escalate": [
            "See vet if kennel cough symptoms appear",
            "Contact boarding facility if you have concerns"
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Book boarding", "service_type": "boarding", "prefill": {}},
            {"label": "Schedule pre-boarding vet visit", "service_type": "vet_visit", "prefill": {"reason": "boarding_checkup"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": True,
        "is_active": True,
        "sort_rank": 1,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_car_travel",
        "title": "Safe Car Travel with Your Dog",
        "topic": "travel",
        "summary": "Road trip essentials for safe and comfortable travel.",
        "reading_time_sec": 75,
        "steps": [
            "Secure your dog: use car harness, carrier, or barrier",
            "Never let dogs ride with head out window (debris, bugs can injure eyes)",
            "Take breaks every 2-3 hours for water and bathroom",
            "Never leave dog in parked car - temperature rises dangerously fast",
            "Bring water bowl, water, poop bags, and favorite toy",
            "Start with short trips to build positive association"
        ],
        "watch_for": [
            "Motion sickness: drooling, vomiting, restlessness",
            "Anxiety: panting, pacing, whining",
            "Overheating: excessive panting, drooling"
        ],
        "when_to_escalate": [
            "Consult vet for anti-nausea medication for motion sickness",
            "Anxiety medication for very stressed travelers"
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "service_cta": [
            {"label": "Order car safety harness", "service_type": "product_order", "prefill": {"category": "travel"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 5,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_flight_travel",
        "title": "Flying with Your Dog",
        "topic": "travel",
        "summary": "Essential prep for air travel with your pet.",
        "reading_time_sec": 90,
        "steps": [
            "Check airline pet policy - rules vary widely",
            "Book early - most airlines limit pets per flight",
            "Get airline-approved carrier that fits under seat (for cabin travel)",
            "Visit vet for health certificate (usually required within 10 days of travel)",
            "Exercise before airport to tire them out",
            "Avoid sedation unless vet-recommended (can affect breathing at altitude)"
        ],
        "watch_for": [
            "Brachycephalic breeds (pugs, bulldogs) face higher flight risks",
            "Extreme weather may cause flight restrictions",
            "Stress symptoms after flying"
        ],
        "when_to_escalate": [
            "Consult vet about flight safety for short-nosed breeds",
            "Ask vet about anti-anxiety options for nervous flyers"
        ],
        "pet_tags": ["all"],
        "breed_tags": ["brachy"],
        "service_cta": [
            {"label": "Book pre-travel vet visit", "service_type": "vet_visit", "prefill": {"reason": "travel_certificate"}},
            {"label": "Order flight carrier", "service_type": "product_order", "prefill": {"category": "carrier"}}
        ],
        "risk_level": "medium",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 6,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    
    # ===== SEASONAL (3 guides) =====
    {
        "id": "guide_summer_safety",
        "title": "Summer Safety for Dogs",
        "topic": "seasonal",
        "summary": "Keep your dog cool and safe in Indian summers.",
        "reading_time_sec": 90,
        "steps": [
            "Walk early morning (before 8am) or after sunset - avoid peak heat",
            "Test pavement with your palm - if too hot for you, too hot for paws",
            "Provide constant access to fresh, cool water",
            "Never leave dog in parked car - not even for 5 minutes",
            "Provide shade and cooling mats for outdoor dogs",
            "Watch for heatstroke: excessive panting, drooling, weakness"
        ],
        "watch_for": [
            "Heatstroke signs: heavy panting, bright red tongue, stumbling, collapse",
            "Burned paw pads: limping, refusing to walk",
            "Dehydration: dry gums, lethargy, sunken eyes"
        ],
        "when_to_escalate": [
            "Heatstroke is an EMERGENCY - wet dog with cool (not cold) water and rush to vet",
            "Don't use ice-cold water - causes blood vessels to constrict"
        ],
        "pet_tags": ["all"],
        "breed_tags": ["brachy", "double_coat", "senior"],
        "service_cta": [
            {"label": "Order cooling mat", "service_type": "product_order", "prefill": {"category": "cooling"}},
            {"label": "Find emergency vet", "service_type": "vet_visit", "prefill": {"urgency": "emergency"}}
        ],
        "risk_level": "high",
        "escalation_required": True,
        "is_featured": True,
        "is_active": True,
        "sort_rank": 1,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_monsoon_care",
        "title": "Monsoon Care for Dogs",
        "topic": "seasonal",
        "summary": "Keep your dog healthy during rainy season.",
        "reading_time_sec": 75,
        "steps": [
            "Dry your dog thoroughly after rain exposure - especially paws and ears",
            "Check for ticks and leeches after outdoor time",
            "Keep paws clean - monsoon puddles carry bacteria",
            "Increase tick/flea prevention - parasites thrive in humidity",
            "Watch for fungal infections in skin folds and paw pads",
            "Keep food and water bowls clean - bacteria grows faster in humidity"
        ],
        "watch_for": [
            "Skin infections: redness, itching, hot spots",
            "Ear infections from moisture",
            "Upset stomach from drinking contaminated water"
        ],
        "when_to_escalate": [
            "See vet for skin infections that don't clear in 3 days",
            "Persistent ear scratching needs treatment"
        ],
        "pet_tags": ["all"],
        "breed_tags": ["floppy_ears", "double_coat"],
        "service_cta": [
            {"label": "Order rain gear", "service_type": "product_order", "prefill": {"category": "rainwear"}},
            {"label": "Book skin checkup", "service_type": "vet_visit", "prefill": {"reason": "skin_check"}}
        ],
        "risk_level": "medium",
        "escalation_required": False,
        "is_featured": True,
        "is_active": True,
        "sort_rank": 2,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "guide_winter_care",
        "title": "Winter Care Tips",
        "topic": "seasonal",
        "summary": "Keep your dog comfortable in cold weather.",
        "reading_time_sec": 60,
        "steps": [
            "Short-coated and small dogs may need sweaters/jackets",
            "Keep indoor temperature comfortable - dogs feel cold too",
            "Protect paws from cold surfaces with booties or paw balm",
            "Older dogs may show more arthritis pain in cold - watch for stiffness",
            "Keep up exercise - winter weight gain is common"
        ],
        "watch_for": [
            "Shivering, seeking warm spots",
            "Stiffness or reluctance to move (arthritis flare)",
            "Dry, flaky skin from indoor heating"
        ],
        "when_to_escalate": [
            "See vet if cold seems to worsen arthritis significantly",
            "Discuss joint supplements for older dogs"
        ],
        "pet_tags": ["all"],
        "breed_tags": ["short_coat", "toy", "senior"],
        "service_cta": [
            {"label": "Order dog sweater", "service_type": "product_order", "prefill": {"category": "clothing"}}
        ],
        "risk_level": "low",
        "escalation_required": False,
        "is_featured": False,
        "is_active": True,
        "sort_rank": 10,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
]


# ============================================
# CURATED VIDEOS (20 total)
# High-trust channels: Veterinarians, certified trainers, reputable orgs
# ============================================

STARTER_VIDEOS = [
    # ===== HEALTH (4 videos) =====
    {
        "id": "video_tick_removal",
        "title": "How to Remove a Tick Safely",
        "youtube_id": "zcynF0K5dA4",
        "topic": "health",
        "duration_sec": 180,
        "bullets_before": [
            "Proper technique to remove ticks without leaving mouthparts",
            "What tools you need (fine-tipped tweezers)",
            "How to dispose of the tick safely"
        ],
        "safety_note": "Never squeeze or burn a tick - this can cause it to release more pathogens",
        "after_checklist": [
            "Clean the bite area with antiseptic",
            "Save the tick in a sealed container for 2 weeks",
            "Monitor for fever or lethargy for 3 weeks"
        ],
        "escalation": [
            "See vet if red ring appears around bite",
            "Fever within 3 weeks needs immediate vet attention"
        ],
        "cta": [
            {"label": "Order tick prevention", "service_type": "product_order", "prefill": {"category": "tick_prevention"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "medium",
        "escalation_required": True,
        "channel_name": "Dr. Pawsome Vet",
        "channel_trust_level": "vet",
        "is_featured": True,
        "is_active": True,
        "sort_rank": 1,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_cpr",
        "title": "Pet CPR & First Aid Basics",
        "youtube_id": "LK5TXs7Gm8c",
        "topic": "health",
        "duration_sec": 420,
        "bullets_before": [
            "How to check if your dog needs CPR",
            "Proper chest compression technique for dogs",
            "When to perform rescue breathing"
        ],
        "safety_note": "CPR is for emergencies only - always seek vet care immediately after",
        "after_checklist": [
            "Save your vet's emergency number in your phone now",
            "Know location of nearest 24/7 emergency vet",
            "Consider taking a pet first aid course"
        ],
        "escalation": [
            "Any pet needing CPR needs emergency vet care immediately",
            "Call ahead so vet is prepared for your arrival"
        ],
        "cta": [
            {"label": "Find emergency vet", "service_type": "vet_visit", "prefill": {"urgency": "emergency"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "high",
        "escalation_required": True,
        "channel_name": "PetMD",
        "channel_trust_level": "org",
        "is_featured": False,
        "is_active": True,
        "sort_rank": 5,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_give_medication",
        "title": "How to Give Your Dog a Pill",
        "youtube_id": "kQ9BZWoq4IY",
        "topic": "health",
        "duration_sec": 240,
        "bullets_before": [
            "Techniques to make pill-taking easier",
            "Safe ways to hide pills in food",
            "What to do if your dog spits out pills"
        ],
        "safety_note": "Some medications shouldn't be crushed - check with your vet first",
        "after_checklist": [
            "Try pill pockets or wrapping in cheese/meat",
            "Don't put medication in regular food bowl (may refuse food later)",
            "Reward after successful pill-taking"
        ],
        "escalation": [
            "Ask vet about liquid alternatives if pill-giving is very difficult",
            "Some pharmacies can compound medications into flavored treats"
        ],
        "cta": [
            {"label": "Order pill pockets", "service_type": "product_order", "prefill": {"category": "medication_aids"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "Veterinary Secrets",
        "channel_trust_level": "vet",
        "is_featured": False,
        "is_active": True,
        "sort_rank": 10,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_check_vitals",
        "title": "Check Your Dog's Vital Signs at Home",
        "youtube_id": "j5RqMHOGS6I",
        "topic": "health",
        "duration_sec": 300,
        "bullets_before": [
            "How to check heart rate and breathing rate",
            "What normal temperature looks like",
            "How to assess hydration and gum color"
        ],
        "safety_note": "Home checks don't replace vet care - they help you communicate symptoms better",
        "after_checklist": [
            "Record your dog's normal resting heart rate for reference",
            "Practice checking gums so you know normal color",
            "Keep a pet thermometer in your first aid kit"
        ],
        "escalation": [
            "Abnormal vitals = call your vet",
            "Blue or white gums need emergency care immediately"
        ],
        "cta": [
            {"label": "Order pet thermometer", "service_type": "product_order", "prefill": {"category": "first_aid"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "medium",
        "escalation_required": False,
        "channel_name": "Dr. Pawsome Vet",
        "channel_trust_level": "vet",
        "is_featured": False,
        "is_active": True,
        "sort_rank": 11,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    
    # ===== GROOMING (4 videos) =====
    {
        "id": "video_nail_trim",
        "title": "Nail Trimming Made Easy",
        "youtube_id": "MM0j5iWPIEg",
        "topic": "grooming",
        "duration_sec": 360,
        "bullets_before": [
            "How to identify the quick in light and dark nails",
            "Proper cutting angle and technique",
            "How to handle a nervous dog"
        ],
        "safety_note": "Have styptic powder ready in case you cut the quick",
        "after_checklist": [
            "Trim small amounts frequently rather than lots at once",
            "Reward calmly after each paw",
            "If nails click on floor, they need a trim"
        ],
        "escalation": [
            "Ingrown nails need professional grooming",
            "If bleeding doesn't stop with styptic powder, see vet"
        ],
        "cta": [
            {"label": "Book nail trim", "service_type": "grooming", "prefill": {"type": "nail_trim"}},
            {"label": "Order nail clippers", "service_type": "product_order", "prefill": {"category": "grooming_tools"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "Rover's Makeover",
        "channel_trust_level": "trainer",
        "is_featured": True,
        "is_active": True,
        "sort_rank": 1,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_bath_technique",
        "title": "How to Bathe Your Dog at Home",
        "youtube_id": "VQw4aJr7lKk",
        "topic": "grooming",
        "duration_sec": 420,
        "bullets_before": [
            "Proper water temperature and pre-bath brushing",
            "Technique to avoid getting water in ears",
            "How to rinse thoroughly to prevent skin irritation"
        ],
        "safety_note": "Use dog-specific shampoo - human products can irritate dog skin",
        "after_checklist": [
            "Brush before bathing to remove mats",
            "Dry thoroughly, especially in skin folds",
            "Clean ears after bath if water got in"
        ],
        "escalation": [
            "Professional grooming for severely matted dogs",
            "See vet if skin irritation develops after bathing"
        ],
        "cta": [
            {"label": "Order dog shampoo", "service_type": "product_order", "prefill": {"category": "shampoo"}},
            {"label": "Book bath service", "service_type": "grooming", "prefill": {"type": "bath"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "Grooming School",
        "channel_trust_level": "trainer",
        "is_featured": False,
        "is_active": True,
        "sort_rank": 5,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_ear_cleaning",
        "title": "Safe Ear Cleaning for Dogs",
        "youtube_id": "w1kbLzIHOZw",
        "topic": "grooming",
        "duration_sec": 240,
        "bullets_before": [
            "Signs that ears need cleaning",
            "Proper technique that won't damage ear canal",
            "Products to use and avoid"
        ],
        "safety_note": "Never insert anything into the ear canal - clean only what you can see",
        "after_checklist": [
            "Use vet-approved ear cleaner only",
            "Clean weekly for floppy-eared breeds",
            "Clean after swimming or bathing"
        ],
        "escalation": [
            "Persistent scratching or head tilting needs vet check",
            "Dark brown/black debris may indicate mites"
        ],
        "cta": [
            {"label": "Order ear cleaner", "service_type": "product_order", "prefill": {"category": "ear_care"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": ["floppy_ears"],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "Veterinary Secrets",
        "channel_trust_level": "vet",
        "is_featured": False,
        "is_active": True,
        "sort_rank": 6,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_brushing_double_coat",
        "title": "Brushing Double-Coated Dogs",
        "youtube_id": "zAIGfNv4YKk",
        "topic": "grooming",
        "duration_sec": 480,
        "bullets_before": [
            "Why you should NEVER shave a double coat",
            "How to use undercoat rake and slicker brush",
            "Managing seasonal shedding"
        ],
        "safety_note": "Double coats insulate against heat AND cold - shaving can cause coat damage",
        "after_checklist": [
            "Brush 2-3 times weekly, daily during shedding season",
            "Work in sections to get all the undercoat",
            "Consider professional deshedding treatment"
        ],
        "escalation": [
            "Matted undercoat needs professional attention",
            "Excessive shedding may indicate health issues"
        ],
        "cta": [
            {"label": "Book deshedding treatment", "service_type": "grooming", "prefill": {"type": "deshedding"}},
            {"label": "Order undercoat rake", "service_type": "product_order", "prefill": {"category": "brushes"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": ["double_coat", "husky", "gsd", "golden"],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "Professional Pet Grooming",
        "channel_trust_level": "trainer",
        "is_featured": True,
        "is_active": True,
        "sort_rank": 2,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    
    # ===== BEHAVIOUR (6 videos) =====
    {
        "id": "video_calm_fireworks",
        "title": "Helping Dogs Through Fireworks",
        "youtube_id": "fH7TvN2EB-4",
        "topic": "behaviour",
        "duration_sec": 360,
        "bullets_before": [
            "Create a safe space for your dog during fireworks",
            "Calming techniques that actually work",
            "Products that can help (and those that don't)"
        ],
        "safety_note": "Start preparations days before Diwali, not on the day itself",
        "after_checklist": [
            "Set up safe room with familiar items now",
            "Practice calming routine before event",
            "Consider Thundershirt or calming treats"
        ],
        "escalation": [
            "Severe anxiety may need prescription medication",
            "Discuss anti-anxiety options with vet before festival season"
        ],
        "cta": [
            {"label": "Order calming products", "service_type": "product_order", "prefill": {"category": "calming"}},
            {"label": "Book anxiety consult", "service_type": "vet_visit", "prefill": {"reason": "anxiety"}}
        ],
        "pet_tags": ["anxious"],
        "breed_tags": [],
        "risk_level": "medium",
        "escalation_required": False,
        "channel_name": "Doggy Dan",
        "channel_trust_level": "trainer",
        "is_featured": True,
        "is_active": True,
        "sort_rank": 1,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_loose_leash",
        "title": "Loose Leash Walking Training",
        "youtube_id": "sFgtqgiAKoQ",
        "topic": "behaviour",
        "duration_sec": 480,
        "bullets_before": [
            "Why dogs pull and how to change the behavior",
            "Equipment that helps (and doesn't)",
            "Step-by-step training technique"
        ],
        "safety_note": "Use a harness during training to prevent neck injury from pulling",
        "after_checklist": [
            "Start training in low-distraction environment",
            "Practice for 10 minutes daily",
            "Reward walking beside you, not just stopping pulling"
        ],
        "escalation": [
            "Professional trainer for reactive dogs",
            "Consider head halter for very strong pullers"
        ],
        "cta": [
            {"label": "Book training session", "service_type": "training", "prefill": {"type": "leash_training"}},
            {"label": "Order no-pull harness", "service_type": "product_order", "prefill": {"category": "harness"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "Zak George's Dog Training",
        "channel_trust_level": "trainer",
        "is_featured": True,
        "is_active": True,
        "sort_rank": 2,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_recall_training",
        "title": "Teaching a Reliable Recall",
        "youtube_id": "lDdUCfvNLNI",
        "topic": "behaviour",
        "duration_sec": 420,
        "bullets_before": [
            "Why recall is the most important command",
            "Building a strong foundation",
            "Common mistakes that weaken recall"
        ],
        "safety_note": "Never call your dog for something negative - it weakens the recall",
        "after_checklist": [
            "Start in enclosed area with zero distractions",
            "Use high-value treats (chicken, cheese)",
            "Never chase your dog - make yourself interesting instead"
        ],
        "escalation": [
            "Professional trainer for dogs with prey drive",
            "Long line training for unreliable recall"
        ],
        "cta": [
            {"label": "Book training session", "service_type": "training", "prefill": {"type": "recall"}},
            {"label": "Order training treats", "service_type": "product_order", "prefill": {"category": "training_treats"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "Kikopup",
        "channel_trust_level": "trainer",
        "is_featured": False,
        "is_active": True,
        "sort_rank": 5,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_crate_training",
        "title": "Crate Training Done Right",
        "youtube_id": "hesi2Dj7SdQ",
        "topic": "behaviour",
        "duration_sec": 540,
        "bullets_before": [
            "Why crates are safe spaces, not punishments",
            "Choosing the right size crate",
            "Step-by-step introduction process"
        ],
        "safety_note": "Never use the crate as punishment - it should be a happy place",
        "after_checklist": [
            "Make crate comfortable with bedding and toys",
            "Start with door open, gradually close",
            "Feed meals in crate to build positive association"
        ],
        "escalation": [
            "Puppies shouldn't be crated more than 3-4 hours at a time",
            "Panic in crate may indicate separation anxiety"
        ],
        "cta": [
            {"label": "Order dog crate", "service_type": "product_order", "prefill": {"category": "crate"}}
        ],
        "pet_tags": ["puppy", "anxious"],
        "breed_tags": [],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "Zak George's Dog Training",
        "channel_trust_level": "trainer",
        "is_featured": False,
        "is_active": True,
        "sort_rank": 6,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_puppy_biting",
        "title": "Stop Puppy Biting - Gentle Methods",
        "youtube_id": "068K5Zlph9U",
        "topic": "behaviour",
        "duration_sec": 360,
        "bullets_before": [
            "Why puppies bite (it's normal!)",
            "How to teach bite inhibition",
            "Redirecting biting to appropriate toys"
        ],
        "safety_note": "Physical punishment increases aggression - positive methods work better",
        "after_checklist": [
            "Say 'ouch' and ignore for 10 seconds when bitten",
            "Always have a toy ready to redirect",
            "Be patient - this takes weeks, not days"
        ],
        "escalation": [
            "Biting with growling needs professional evaluation",
            "See trainer if biting doesn't improve by 6 months"
        ],
        "cta": [
            {"label": "Order teething toys", "service_type": "product_order", "prefill": {"category": "teething"}},
            {"label": "Book puppy training", "service_type": "training", "prefill": {"type": "puppy_basics"}}
        ],
        "pet_tags": ["puppy"],
        "breed_tags": [],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "Kikopup",
        "channel_trust_level": "trainer",
        "is_featured": False,
        "is_active": True,
        "sort_rank": 7,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_body_language",
        "title": "Understanding Dog Body Language",
        "youtube_id": "vnJU0pGLXXk",
        "topic": "behaviour",
        "duration_sec": 480,
        "bullets_before": [
            "Signs of stress and anxiety",
            "Signs of happiness and relaxation",
            "Calming signals dogs use"
        ],
        "safety_note": "A wagging tail doesn't always mean happy - context matters",
        "after_checklist": [
            "Learn to recognize whale eye, lip licking, yawning",
            "Observe your dog in different situations",
            "Respect when your dog shows 'I need space' signals"
        ],
        "escalation": [
            "Understanding body language prevents bites",
            "Consult trainer if you're unsure about your dog's signals"
        ],
        "cta": [],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "Dr. Sophia Yin",
        "channel_trust_level": "vet",
        "is_featured": True,
        "is_active": True,
        "sort_rank": 3,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    
    # ===== FOOD (2 videos) =====
    {
        "id": "video_toxic_foods",
        "title": "Foods That Are Toxic to Dogs",
        "youtube_id": "LKMcPdRMUAk",
        "topic": "food",
        "duration_sec": 300,
        "bullets_before": [
            "Common household foods that are dangerous",
            "How much is too much (toxic doses)",
            "What to do if your dog eats something toxic"
        ],
        "safety_note": "When in doubt, don't give it - many human foods are unsafe for dogs",
        "after_checklist": [
            "Secure garbage and food storage",
            "Educate family members about toxic foods",
            "Save poison helpline number in your phone"
        ],
        "escalation": [
            "Call vet immediately if toxic food is eaten",
            "Bring packaging to help calculate dosage"
        ],
        "cta": [
            {"label": "Find emergency vet", "service_type": "vet_visit", "prefill": {"urgency": "emergency"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "high",
        "escalation_required": True,
        "channel_name": "PetMD",
        "channel_trust_level": "org",
        "is_featured": True,
        "is_active": True,
        "sort_rank": 1,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_food_puzzles",
        "title": "Mental Stimulation with Food Puzzles",
        "youtube_id": "bfLNqvyLXYM",
        "topic": "food",
        "duration_sec": 300,
        "bullets_before": [
            "Why mental stimulation is as important as physical exercise",
            "DIY food puzzles you can make at home",
            "Best puzzle toys for different dog personalities"
        ],
        "safety_note": "Supervise first use of any puzzle toy to ensure it's safe for your dog",
        "after_checklist": [
            "Start with easy puzzles and increase difficulty",
            "Use part of daily food ration in puzzles",
            "Rotate puzzles to keep them interesting"
        ],
        "escalation": [],
        "cta": [
            {"label": "Order puzzle toys", "service_type": "product_order", "prefill": {"category": "puzzle_toys"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "Kikopup",
        "channel_trust_level": "trainer",
        "is_featured": False,
        "is_active": True,
        "sort_rank": 10,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    
    # ===== TRAVEL & BOARDING (2 videos) =====
    {
        "id": "video_car_travel",
        "title": "Safe Car Travel with Dogs",
        "youtube_id": "Mh3J51m6JUc",
        "topic": "travel",
        "duration_sec": 300,
        "bullets_before": [
            "Proper restraints for safe car travel",
            "Helping dogs overcome car anxiety",
            "Essentials to pack for road trips"
        ],
        "safety_note": "Unrestrained dogs can become projectiles in accidents - always secure them",
        "after_checklist": [
            "Get car harness or crate for your dog",
            "Practice short trips to build positive association",
            "Take breaks every 2-3 hours on long trips"
        ],
        "escalation": [
            "Motion sickness that persists needs vet consultation",
            "Severe car anxiety may need trainer help"
        ],
        "cta": [
            {"label": "Order car harness", "service_type": "product_order", "prefill": {"category": "travel"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "AKC",
        "channel_trust_level": "org",
        "is_featured": False,
        "is_active": True,
        "sort_rank": 5,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_boarding_prep",
        "title": "Preparing Your Dog for Boarding",
        "youtube_id": "2jjZSzQG_WM",
        "topic": "boarding",
        "duration_sec": 300,
        "bullets_before": [
            "What to look for when choosing a boarding facility",
            "Documents and items to bring",
            "How to reduce stress for your dog"
        ],
        "safety_note": "Ensure vaccinations are up to date at least 2 weeks before boarding",
        "after_checklist": [
            "Schedule a trial overnight before long trips",
            "Pack comfort item with your scent",
            "Provide written care instructions"
        ],
        "escalation": [
            "Dogs with severe separation anxiety may need alternatives",
            "Consider in-home pet sitting for anxious dogs"
        ],
        "cta": [
            {"label": "Book boarding", "service_type": "boarding", "prefill": {}},
            {"label": "Book vet checkup", "service_type": "vet_visit", "prefill": {"reason": "boarding_checkup"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": [],
        "risk_level": "low",
        "escalation_required": False,
        "channel_name": "Professional Pet Care",
        "channel_trust_level": "trainer",
        "is_featured": True,
        "is_active": True,
        "sort_rank": 1,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    
    # ===== SEASONAL (2 videos) =====
    {
        "id": "video_summer_safety",
        "title": "Summer Safety for Dogs in India",
        "youtube_id": "vxcCPxZG9Gc",
        "topic": "seasonal",
        "duration_sec": 360,
        "bullets_before": [
            "Signs of heatstroke and what to do",
            "Safe exercise timing during summer",
            "How to keep your dog cool"
        ],
        "safety_note": "Heatstroke can be fatal within minutes - know the signs",
        "after_checklist": [
            "Walk before 8am and after sunset only",
            "Test pavement with your palm before walks",
            "Always have fresh water available"
        ],
        "escalation": [
            "Heatstroke is an emergency - wet dog and rush to vet",
            "Don't use ice-cold water - cool (not cold) is better"
        ],
        "cta": [
            {"label": "Order cooling mat", "service_type": "product_order", "prefill": {"category": "cooling"}},
            {"label": "Find emergency vet", "service_type": "vet_visit", "prefill": {"urgency": "emergency"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": ["brachy", "double_coat", "senior"],
        "risk_level": "high",
        "escalation_required": True,
        "channel_name": "Indian Vet Association",
        "channel_trust_level": "org",
        "is_featured": True,
        "is_active": True,
        "sort_rank": 1,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
    {
        "id": "video_monsoon_care",
        "title": "Monsoon Care for Dogs",
        "youtube_id": "YcWFVdPPDEI",
        "topic": "seasonal",
        "duration_sec": 300,
        "bullets_before": [
            "Keeping your dog healthy during rainy season",
            "Preventing tick, flea, and fungal infections",
            "Drying techniques that matter"
        ],
        "safety_note": "Humid conditions increase risk of skin and ear infections",
        "after_checklist": [
            "Dry thoroughly after rain exposure, especially paws and ears",
            "Check for ticks after every outdoor session",
            "Keep food and water bowls extra clean"
        ],
        "escalation": [
            "See vet for skin infections that don't improve in 3 days",
            "Persistent ear scratching needs treatment"
        ],
        "cta": [
            {"label": "Order rain gear", "service_type": "product_order", "prefill": {"category": "rainwear"}},
            {"label": "Book skin checkup", "service_type": "vet_visit", "prefill": {"reason": "skin_check"}}
        ],
        "pet_tags": ["all"],
        "breed_tags": ["floppy_ears", "double_coat"],
        "risk_level": "medium",
        "escalation_required": False,
        "channel_name": "Indian Vet Association",
        "channel_trust_level": "org",
        "is_featured": True,
        "is_active": True,
        "sort_rank": 2,
        "reviewed_by": "admin",
        "last_reviewed_at": datetime.now(timezone.utc)
    },
]


async def seed_learn_content(db):
    """
    Seed the Learn OS layer with starter content.
    30 tiny guides + 20 curated videos.
    """
    logger.info("[LEARN SEEDER] Starting content seeding...")
    
    guides_seeded = 0
    guides_updated = 0
    videos_seeded = 0
    videos_updated = 0
    
    now = datetime.now(timezone.utc)
    
    # Seed guides
    for guide in STARTER_GUIDES:
        guide_doc = {
            **guide,
            "created_at": guide.get("created_at", now),
            "updated_at": now,
            "view_count": guide.get("view_count", 0),
            "save_count": guide.get("save_count", 0),
            "completion_count": guide.get("completion_count", 0),
        }
        
        # Remove datetime objects for JSON serialization in MongoDB
        if isinstance(guide_doc.get("last_reviewed_at"), datetime):
            guide_doc["last_reviewed_at"] = guide_doc["last_reviewed_at"].isoformat()
        if isinstance(guide_doc.get("created_at"), datetime):
            guide_doc["created_at"] = guide_doc["created_at"].isoformat()
        if isinstance(guide_doc.get("updated_at"), datetime):
            guide_doc["updated_at"] = guide_doc["updated_at"].isoformat()
        
        result = await db.learn_guides.update_one(
            {"id": guide["id"]},
            {"$set": guide_doc},
            upsert=True
        )
        
        if result.upserted_id:
            guides_seeded += 1
        elif result.modified_count > 0:
            guides_updated += 1
    
    # Seed videos
    for video in STARTER_VIDEOS:
        video_doc = {
            **video,
            "created_at": video.get("created_at", now),
            "updated_at": now,
            "view_count": video.get("view_count", 0),
            "save_count": video.get("save_count", 0),
            "completion_count": video.get("completion_count", 0),
        }
        
        # Remove datetime objects for JSON serialization
        if isinstance(video_doc.get("last_reviewed_at"), datetime):
            video_doc["last_reviewed_at"] = video_doc["last_reviewed_at"].isoformat()
        if isinstance(video_doc.get("created_at"), datetime):
            video_doc["created_at"] = video_doc["created_at"].isoformat()
        if isinstance(video_doc.get("updated_at"), datetime):
            video_doc["updated_at"] = video_doc["updated_at"].isoformat()
        
        result = await db.learn_videos.update_one(
            {"id": video["id"]},
            {"$set": video_doc},
            upsert=True
        )
        
        if result.upserted_id:
            videos_seeded += 1
        elif result.modified_count > 0:
            videos_updated += 1
    
    logger.info(f"[LEARN SEEDER] Complete: {guides_seeded} guides seeded, {guides_updated} updated")
    logger.info(f"[LEARN SEEDER] Complete: {videos_seeded} videos seeded, {videos_updated} updated")
    
    return {
        "guides_seeded": guides_seeded,
        "guides_updated": guides_updated,
        "videos_seeded": videos_seeded,
        "videos_updated": videos_updated,
        "total_guides": len(STARTER_GUIDES),
        "total_videos": len(STARTER_VIDEOS)
    }
