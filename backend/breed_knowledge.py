"""
Breed Knowledge Base - The Brain Behind Mira's Intelligence
============================================================

This module contains comprehensive breed-specific knowledge that makes
Mira understand each dog's unique needs, health concerns, and lifestyle
requirements.

Part of Phase 2: Core Intelligence
"""

# Top 50 breeds popular in India with comprehensive data
BREED_KNOWLEDGE = {
    # ============================================
    # LARGE BREEDS
    # ============================================
    "golden retriever": {
        "size": "large",
        "weight_range": "25-34 kg",
        "life_expectancy": "10-12 years",
        "energy_level": "high",
        "exercise_needs": "60-90 minutes daily",
        "temperament": ["friendly", "intelligent", "devoted", "reliable", "trustworthy"],
        "good_with": ["children", "other dogs", "strangers", "first-time owners"],
        "health_concerns": [
            "hip dysplasia",
            "elbow dysplasia", 
            "heart disease",
            "cancer (especially hemangiosarcoma)",
            "eye conditions (cataracts, PRA)",
            "skin allergies",
            "ear infections"
        ],
        "dietary_needs": {
            "protein": "high (25-30%)",
            "fat": "moderate (12-15%)",
            "common_allergies": ["chicken", "wheat", "corn", "soy"],
            "special_considerations": "prone to obesity - monitor portions carefully",
            "recommended_foods": ["salmon-based", "lamb-based", "limited ingredient diets"]
        },
        "grooming": {
            "coat_type": "double coat, water-repellent",
            "shedding": "heavy, especially seasonal",
            "brushing": "2-3 times per week, daily during shedding season",
            "bathing": "every 4-6 weeks",
            "special_care": "regular ear cleaning to prevent infections"
        },
        "climate_suitability": {
            "hot_weather": "moderate tolerance - needs AC, avoid midday walks",
            "cold_weather": "excellent tolerance",
            "monsoon": "prone to skin issues - keep dry, check ears"
        },
        "training": {
            "intelligence_rank": 4,
            "trainability": "excellent",
            "best_approach": "positive reinforcement, food-motivated",
            "common_issues": ["jumping", "mouthing", "pulling on leash"]
        },
        "mira_tips": [
            "Goldens are prone to weight gain - use low-calorie treats for training",
            "Their love of water means ear infections are common - dry ears after swimming",
            "They need mental stimulation as much as physical - puzzle toys are great",
            "Prone to separation anxiety - gradual alone-time training is important",
            "Cancer risk is high - regular vet checkups after age 6 are crucial"
        ]
    },
    
    "labrador retriever": {
        "size": "large",
        "weight_range": "25-36 kg",
        "life_expectancy": "10-12 years",
        "energy_level": "high",
        "exercise_needs": "60-90 minutes daily",
        "temperament": ["friendly", "active", "outgoing", "gentle", "intelligent"],
        "good_with": ["children", "other dogs", "strangers", "first-time owners"],
        "health_concerns": [
            "hip dysplasia",
            "elbow dysplasia",
            "obesity",
            "ear infections",
            "bloat (GDV)",
            "exercise-induced collapse (EIC)",
            "eye conditions"
        ],
        "dietary_needs": {
            "protein": "high (25-30%)",
            "fat": "moderate - watch carefully",
            "common_allergies": ["chicken", "beef", "dairy", "wheat"],
            "special_considerations": "VERY prone to obesity - strict portion control essential",
            "recommended_foods": ["weight management formulas", "fish-based proteins"]
        },
        "grooming": {
            "coat_type": "double coat, water-resistant",
            "shedding": "heavy year-round",
            "brushing": "2-3 times per week",
            "bathing": "every 4-6 weeks",
            "special_care": "regular ear cleaning essential"
        },
        "climate_suitability": {
            "hot_weather": "moderate - needs shade and water",
            "cold_weather": "excellent tolerance",
            "monsoon": "loves water but dry thoroughly after"
        },
        "training": {
            "intelligence_rank": 7,
            "trainability": "excellent",
            "best_approach": "food rewards work best - they're highly food-motivated",
            "common_issues": ["counter surfing", "chewing", "jumping"]
        },
        "mira_tips": [
            "Labs will eat ANYTHING - keep food secured and monitor for scavenging",
            "Use portion of daily food allowance for training treats",
            "They need jobs to do - fetch, swimming, nose work keeps them happy",
            "Prone to joint issues - keep at healthy weight to reduce stress",
            "Consider slow-feeder bowls to prevent bloat"
        ]
    },
    
    "german shepherd": {
        "size": "large",
        "weight_range": "30-40 kg",
        "life_expectancy": "9-13 years",
        "energy_level": "very high",
        "exercise_needs": "90-120 minutes daily",
        "temperament": ["loyal", "confident", "courageous", "intelligent", "protective"],
        "good_with": ["family", "children (with socialization)", "experienced owners"],
        "not_ideal_for": ["first-time owners", "apartment living", "sedentary lifestyle"],
        "health_concerns": [
            "hip dysplasia",
            "elbow dysplasia",
            "degenerative myelopathy",
            "bloat (GDV)",
            "allergies",
            "pancreatic insufficiency (EPI)",
            "perianal fistulas"
        ],
        "dietary_needs": {
            "protein": "high (26-30%)",
            "fat": "moderate (12-18%)",
            "common_allergies": ["chicken", "beef", "grains", "dairy"],
            "special_considerations": "sensitive stomachs common - gradual food transitions",
            "recommended_foods": ["limited ingredient", "novel proteins like venison/duck"]
        },
        "grooming": {
            "coat_type": "double coat",
            "shedding": "heavy - 'German Shedder' nickname earned",
            "brushing": "daily during shedding, 3x week otherwise",
            "bathing": "every 6-8 weeks - over-bathing strips coat oils",
            "special_care": "check ears, trim nails regularly"
        },
        "climate_suitability": {
            "hot_weather": "low tolerance - avoid exercise in heat",
            "cold_weather": "excellent",
            "monsoon": "keep dry to prevent skin issues"
        },
        "training": {
            "intelligence_rank": 3,
            "trainability": "excellent with experienced handler",
            "best_approach": "firm, consistent, positive - they need a job",
            "common_issues": ["resource guarding", "reactivity to strangers", "excessive barking"]
        },
        "mira_tips": [
            "Early socialization is CRITICAL - prevents fear-based aggression",
            "They bond deeply to one person - include whole family in training",
            "Mental exercise is as important as physical - training sessions, puzzle toys",
            "Prone to anxiety - establish consistent routines",
            "Hip issues are common - avoid stairs and jumping as puppies"
        ]
    },
    
    "rottweiler": {
        "size": "large",
        "weight_range": "35-60 kg",
        "life_expectancy": "8-10 years",
        "energy_level": "moderate to high",
        "exercise_needs": "60-90 minutes daily",
        "temperament": ["loyal", "confident", "calm", "protective", "courageous"],
        "good_with": ["experienced owners", "families with older children"],
        "not_ideal_for": ["first-time owners", "apartments", "owners who can't establish leadership"],
        "health_concerns": [
            "hip dysplasia",
            "elbow dysplasia",
            "heart conditions (aortic stenosis)",
            "osteosarcoma (bone cancer)",
            "bloat (GDV)",
            "obesity"
        ],
        "dietary_needs": {
            "protein": "high (26-30%)",
            "fat": "moderate",
            "common_allergies": ["chicken", "soy", "wheat"],
            "special_considerations": "prone to weight gain - measure portions",
            "recommended_foods": ["large breed formulas", "joint support added"]
        },
        "grooming": {
            "coat_type": "short double coat",
            "shedding": "moderate, heavier seasonally",
            "brushing": "weekly",
            "bathing": "every 6-8 weeks",
            "special_care": "drool management, check skin folds"
        },
        "climate_suitability": {
            "hot_weather": "low tolerance - black coat absorbs heat",
            "cold_weather": "good tolerance",
            "monsoon": "manageable with proper drying"
        },
        "training": {
            "intelligence_rank": 9,
            "trainability": "excellent with firm, consistent training",
            "best_approach": "clear boundaries, positive reinforcement, early socialization",
            "common_issues": ["territorial behavior", "leash reactivity", "guarding"]
        },
        "mira_tips": [
            "Socialization from puppyhood is non-negotiable for this breed",
            "They need a confident owner who can be a calm leader",
            "Despite tough appearance, they're sensitive to harsh correction",
            "Excellent family dogs when properly trained and socialized",
            "Watch weight carefully - joint problems worsen with excess weight"
        ]
    },

    # ============================================
    # MEDIUM BREEDS
    # ============================================
    "beagle": {
        "size": "medium",
        "weight_range": "9-11 kg",
        "life_expectancy": "12-15 years",
        "energy_level": "high",
        "exercise_needs": "60-90 minutes daily",
        "temperament": ["friendly", "curious", "merry", "determined", "pack-oriented"],
        "good_with": ["children", "other dogs", "families", "first-time owners"],
        "health_concerns": [
            "obesity",
            "ear infections",
            "epilepsy",
            "hypothyroidism",
            "intervertebral disc disease",
            "cherry eye",
            "allergies"
        ],
        "dietary_needs": {
            "protein": "moderate to high (22-26%)",
            "fat": "moderate - watch carefully",
            "common_allergies": ["chicken", "beef", "corn", "wheat"],
            "special_considerations": "EXTREMELY food-motivated - will eat anything, prone to obesity",
            "recommended_foods": ["weight management", "high-fiber for satiety"]
        },
        "grooming": {
            "coat_type": "short, dense double coat",
            "shedding": "moderate year-round",
            "brushing": "weekly",
            "bathing": "every 4-6 weeks",
            "special_care": "ears need weekly cleaning - floppy ears trap moisture"
        },
        "climate_suitability": {
            "hot_weather": "moderate tolerance",
            "cold_weather": "good tolerance",
            "monsoon": "ear infections more common - keep dry"
        },
        "training": {
            "intelligence_rank": 131,
            "trainability": "moderate - easily distracted by scents",
            "best_approach": "food rewards, short sessions, patience",
            "common_issues": ["following nose", "howling/baying", "escape artists", "food stealing"]
        },
        "mira_tips": [
            "Their nose rules them - use scent games for mental stimulation",
            "Never let off-leash in unfenced areas - they WILL follow a scent",
            "Howling/baying is breed trait - hard to train out completely",
            "Food must be secured - they can open cabinets and bags",
            "Great family dogs but need patience with training"
        ]
    },
    
    "cocker spaniel": {
        "size": "medium",
        "weight_range": "12-15 kg",
        "life_expectancy": "12-15 years",
        "energy_level": "moderate to high",
        "exercise_needs": "45-60 minutes daily",
        "temperament": ["happy", "gentle", "smart", "affectionate", "playful"],
        "good_with": ["children", "other pets", "seniors", "first-time owners"],
        "health_concerns": [
            "ear infections (very common)",
            "eye problems (cataracts, glaucoma, cherry eye)",
            "hip dysplasia",
            "allergies",
            "autoimmune hemolytic anemia",
            "patellar luxation"
        ],
        "dietary_needs": {
            "protein": "moderate (22-26%)",
            "fat": "moderate",
            "common_allergies": ["chicken", "grains", "dairy"],
            "special_considerations": "prone to ear issues - omega fatty acids help skin/coat",
            "recommended_foods": ["skin and coat formulas", "omega-rich"]
        },
        "grooming": {
            "coat_type": "long, silky, wavy",
            "shedding": "moderate",
            "brushing": "daily to prevent mats",
            "bathing": "every 2-4 weeks",
            "special_care": "professional grooming every 6-8 weeks, ear cleaning 2x weekly"
        },
        "climate_suitability": {
            "hot_weather": "moderate - coat can be trimmed for summer",
            "cold_weather": "good",
            "monsoon": "high maintenance - ears and coat need extra care"
        },
        "training": {
            "intelligence_rank": 20,
            "trainability": "very good",
            "best_approach": "gentle, positive - sensitive to harsh correction",
            "common_issues": ["submissive urination when excited", "separation anxiety"]
        },
        "mira_tips": [
            "Ear care is #1 priority - those beautiful ears trap moisture and debris",
            "They're people-pleasers but sensitive - never use harsh methods",
            "Regular grooming prevents painful mats that can cause skin issues",
            "Prone to 'rage syndrome' in some lines - research breeder carefully",
            "Great apartment dogs if exercise needs are met"
        ]
    },
    
    "indian spitz": {
        "size": "small to medium",
        "weight_range": "5-7 kg",
        "life_expectancy": "12-15 years",
        "energy_level": "high",
        "exercise_needs": "45-60 minutes daily",
        "temperament": ["alert", "intelligent", "loyal", "playful", "vocal"],
        "good_with": ["families", "apartments", "Indian climate", "first-time owners"],
        "health_concerns": [
            "patellar luxation",
            "dental problems",
            "eye issues",
            "skin allergies",
            "obesity"
        ],
        "dietary_needs": {
            "protein": "moderate (22-25%)",
            "fat": "moderate",
            "common_allergies": ["chicken", "corn"],
            "special_considerations": "does well on Indian vegetarian diet additions",
            "recommended_foods": ["small breed formulas", "dental health varieties"]
        },
        "grooming": {
            "coat_type": "double coat, fluffy",
            "shedding": "heavy seasonally",
            "brushing": "2-3 times per week, daily when shedding",
            "bathing": "every 4-6 weeks",
            "special_care": "dental care important - small mouths prone to tartar"
        },
        "climate_suitability": {
            "hot_weather": "adapted to Indian climate - better than foreign breeds",
            "cold_weather": "excellent",
            "monsoon": "coat dries quickly, manageable"
        },
        "training": {
            "intelligence_rank": "not officially ranked - but highly intelligent",
            "trainability": "very good",
            "best_approach": "consistent, positive, early socialization",
            "common_issues": ["excessive barking", "can be nippy", "suspicious of strangers"]
        },
        "mira_tips": [
            "Perfect for Indian apartments and climate",
            "Barking can be managed with training but it's a natural alert behavior",
            "Dental care from puppyhood prevents expensive problems later",
            "Great watchdogs - will alert to any visitor",
            "Often confused with Pomeranian but healthier and hardier"
        ]
    },
    
    "indie / indian pariah": {
        "size": "medium",
        "weight_range": "15-25 kg",
        "life_expectancy": "13-16 years",
        "energy_level": "moderate to high",
        "exercise_needs": "45-60 minutes daily",
        "temperament": ["intelligent", "alert", "loyal", "independent", "adaptable"],
        "good_with": ["experienced owners", "families", "Indian climate", "other dogs"],
        "health_concerns": [
            "generally very healthy",
            "tick-borne diseases (if not prevented)",
            "skin issues in some",
            "dental problems if neglected"
        ],
        "dietary_needs": {
            "protein": "moderate (20-25%)",
            "fat": "moderate",
            "common_allergies": "fewer allergies than purebreds",
            "special_considerations": "adaptable digestive system, can handle variety",
            "recommended_foods": ["quality kibble", "home-cooked works well"]
        },
        "grooming": {
            "coat_type": "short, dense",
            "shedding": "low to moderate",
            "brushing": "weekly",
            "bathing": "every 6-8 weeks",
            "special_care": "low maintenance - evolved for Indian conditions"
        },
        "climate_suitability": {
            "hot_weather": "excellent - evolved for Indian heat",
            "cold_weather": "good",
            "monsoon": "excellent - coat designed for climate"
        },
        "training": {
            "intelligence_rank": "not ranked but extremely intelligent",
            "trainability": "good with patient, consistent approach",
            "best_approach": "relationship-based, respect their intelligence",
            "common_issues": ["independent thinking", "prey drive", "can be reserved with strangers"]
        },
        "mira_tips": [
            "Healthiest dogs in India - minimal genetic health issues",
            "They're thinkers, not blind followers - training requires mutual respect",
            "Perfect for Indian weather - no AC dependency",
            "Often the smartest dog in the room - need mental challenges",
            "Adoption is the best way to get an Indie - shelters full of amazing dogs"
        ]
    },

    # ============================================
    # SMALL BREEDS
    # ============================================
    "shih tzu": {
        "size": "small",
        "weight_range": "4-7 kg",
        "life_expectancy": "10-16 years",
        "energy_level": "low to moderate",
        "exercise_needs": "30-45 minutes daily",
        "temperament": ["affectionate", "playful", "outgoing", "loyal", "alert"],
        "good_with": ["apartments", "seniors", "families", "other pets", "first-time owners"],
        "health_concerns": [
            "brachycephalic syndrome (breathing issues)",
            "eye problems (proptosis, dry eye, cataracts)",
            "ear infections",
            "dental problems",
            "patellar luxation",
            "hip dysplasia",
            "allergies",
            "heat sensitivity"
        ],
        "dietary_needs": {
            "protein": "moderate (22-25%)",
            "fat": "moderate",
            "common_allergies": ["chicken", "beef", "wheat", "corn"],
            "special_considerations": "small kibble size, prone to obesity",
            "recommended_foods": ["small breed formulas", "limited ingredient for allergies"]
        },
        "grooming": {
            "coat_type": "long, flowing double coat",
            "shedding": "low (hair, not fur)",
            "brushing": "daily to prevent mats",
            "bathing": "every 2-3 weeks",
            "special_care": "face cleaning daily, topknot or short cut for eye health"
        },
        "climate_suitability": {
            "hot_weather": "POOR - brachycephalic, overheats easily, needs AC",
            "cold_weather": "moderate",
            "monsoon": "high maintenance - coat and breathing issues"
        },
        "training": {
            "intelligence_rank": 70,
            "trainability": "moderate - can be stubborn",
            "best_approach": "positive, patient, short sessions",
            "common_issues": ["housetraining challenges", "stubbornness", "barking"]
        },
        "mira_tips": [
            "CRITICAL: AC is mandatory in Indian summers - can die from overheating",
            "Eye injuries common - keep hair away from eyes or use topknot",
            "Face needs daily cleaning - folds trap moisture and bacteria",
            "Don't over-exercise in heat - short walks, early morning/late evening only",
            "Great companion dogs but high grooming commitment"
        ]
    },
    
    "pomeranian": {
        "size": "toy",
        "weight_range": "1.5-3 kg",
        "life_expectancy": "12-16 years",
        "energy_level": "moderate to high",
        "exercise_needs": "30-45 minutes daily",
        "temperament": ["bold", "curious", "lively", "alert", "intelligent"],
        "good_with": ["adults", "singles", "apartments", "seniors"],
        "not_ideal_for": ["families with small children", "rough play"],
        "health_concerns": [
            "patellar luxation",
            "tracheal collapse",
            "dental problems",
            "alopecia X (black skin disease)",
            "hypoglycemia (puppies)",
            "eye problems",
            "heart disease"
        ],
        "dietary_needs": {
            "protein": "high for small breeds (26-30%)",
            "fat": "moderate",
            "common_allergies": ["chicken", "grains"],
            "special_considerations": "tiny stomachs - small frequent meals, prone to hypoglycemia",
            "recommended_foods": ["toy breed formulas", "high-quality protein"]
        },
        "grooming": {
            "coat_type": "double coat, fluffy outer",
            "shedding": "heavy seasonally",
            "brushing": "3-4 times per week, daily when shedding",
            "bathing": "every 3-4 weeks",
            "special_care": "dental care essential, coat can mat under ears/legs"
        },
        "climate_suitability": {
            "hot_weather": "poor tolerance - needs AC, short outdoor time",
            "cold_weather": "good despite size",
            "monsoon": "keep coat dry, watch for skin issues"
        },
        "training": {
            "intelligence_rank": 23,
            "trainability": "good but independent",
            "best_approach": "consistent rules, positive reinforcement",
            "common_issues": ["excessive barking", "small dog syndrome", "housetraining"]
        },
        "mira_tips": [
            "Don't treat like a toy - they need training like any dog",
            "Dental care from day 1 - their tiny mouths crowd teeth",
            "Watch for hypoglycemia in puppies - always have honey/sugar water ready",
            "The 'big dog in small body' attitude needs gentle correction",
            "Prone to thinking they're guard dogs - socialize early"
        ]
    },
    
    "pug": {
        "size": "small",
        "weight_range": "6-8 kg",
        "life_expectancy": "12-15 years",
        "energy_level": "low to moderate",
        "exercise_needs": "30-40 minutes daily (careful in heat)",
        "temperament": ["charming", "mischievous", "loving", "stubborn", "playful"],
        "good_with": ["apartments", "families", "seniors", "other pets", "first-time owners"],
        "health_concerns": [
            "brachycephalic syndrome (SEVERE)",
            "eye problems (proptosis, dry eye, ulcers)",
            "skin fold infections",
            "obesity",
            "pug dog encephalitis",
            "hip dysplasia",
            "patellar luxation",
            "heat stroke"
        ],
        "dietary_needs": {
            "protein": "moderate (22-26%)",
            "fat": "low to moderate - obesity is major issue",
            "common_allergies": ["chicken", "beef", "wheat", "corn"],
            "special_considerations": "VERY prone to obesity - strict portion control",
            "recommended_foods": ["weight management", "limited ingredient", "low-fat"]
        },
        "grooming": {
            "coat_type": "short, smooth double coat",
            "shedding": "heavy year-round (surprising for short coat)",
            "brushing": "2-3 times per week",
            "bathing": "every 3-4 weeks",
            "special_care": "facial folds need daily cleaning, nail care important"
        },
        "climate_suitability": {
            "hot_weather": "EXTREMELY POOR - medical emergency risk, AC mandatory",
            "cold_weather": "moderate",
            "monsoon": "facial folds prone to infection in humidity"
        },
        "training": {
            "intelligence_rank": 57,
            "trainability": "moderate - food motivated but stubborn",
            "best_approach": "short sessions, high-value treats, patience",
            "common_issues": ["housetraining", "stubbornness", "begging"]
        },
        "mira_tips": [
            "LIFE-THREATENING: Never exercise in heat, always have AC",
            "Clean facial folds DAILY - infections happen fast",
            "Use harness NEVER collar - trachea and breathing already compromised",
            "They will convince you they're starving - don't fall for it",
            "Eye injuries are emergencies - know your nearest vet"
        ]
    },
    
    "french bulldog": {
        "size": "small",
        "weight_range": "8-14 kg",
        "life_expectancy": "10-12 years",
        "energy_level": "low to moderate",
        "exercise_needs": "30-45 minutes daily (heat sensitive)",
        "temperament": ["adaptable", "playful", "alert", "affectionate", "patient"],
        "good_with": ["apartments", "singles", "families", "other pets"],
        "health_concerns": [
            "brachycephalic syndrome (severe)",
            "spinal issues (IVDD, hemivertebrae)",
            "allergies (very common)",
            "ear infections",
            "eye problems",
            "skin fold infections",
            "heat stroke",
            "joint problems"
        ],
        "dietary_needs": {
            "protein": "moderate to high (24-28%)",
            "fat": "moderate",
            "common_allergies": ["chicken", "beef", "dairy", "wheat", "soy"],
            "special_considerations": "allergies very common - limited ingredient diets often needed",
            "recommended_foods": ["limited ingredient", "novel proteins", "hydrolyzed protein"]
        },
        "grooming": {
            "coat_type": "short, smooth",
            "shedding": "moderate",
            "brushing": "weekly",
            "bathing": "every 4-6 weeks",
            "special_care": "facial folds daily, ears weekly, skin allergies common"
        },
        "climate_suitability": {
            "hot_weather": "EXTREMELY POOR - one of worst breeds for Indian climate",
            "cold_weather": "moderate - no undercoat",
            "monsoon": "skin and ear issues increase"
        },
        "training": {
            "intelligence_rank": 109,
            "trainability": "moderate - stubborn but eager to please",
            "best_approach": "positive, patient, keep cool during training",
            "common_issues": ["stubbornness", "selective hearing", "can't swim (will sink)"]
        },
        "mira_tips": [
            "CRITICAL: Cannot tolerate Indian heat - AC is life-saving necessity",
            "NEVER near pools/water unsupervised - they sink, cannot swim",
            "Allergies are almost guaranteed - budget for special diet",
            "Flying is dangerous - many airlines ban them due to deaths",
            "Despite popularity, one of unhealthiest breeds - be prepared for vet bills"
        ]
    },
    
    "dachshund": {
        "size": "small",
        "weight_range": "4-5 kg (mini), 7-14 kg (standard)",
        "life_expectancy": "12-16 years",
        "energy_level": "moderate",
        "exercise_needs": "30-60 minutes daily",
        "temperament": ["clever", "stubborn", "devoted", "lively", "courageous"],
        "good_with": ["adults", "older children", "apartments"],
        "not_ideal_for": ["homes with lots of stairs", "rough play"],
        "health_concerns": [
            "intervertebral disc disease (IVDD) - MAJOR",
            "obesity",
            "dental problems",
            "patellar luxation",
            "eye problems",
            "epilepsy"
        ],
        "dietary_needs": {
            "protein": "moderate (22-26%)",
            "fat": "low to moderate - weight critical for back health",
            "common_allergies": ["chicken", "wheat"],
            "special_considerations": "weight management CRITICAL - extra weight destroys spine",
            "recommended_foods": ["weight management", "joint support"]
        },
        "grooming": {
            "coat_type": "smooth, longhaired, or wirehaired varieties",
            "shedding": "low to moderate depending on coat",
            "brushing": "weekly for smooth, daily for longhaired",
            "bathing": "every 4-6 weeks",
            "special_care": "ear cleaning for longhaired variety"
        },
        "climate_suitability": {
            "hot_weather": "moderate tolerance",
            "cold_weather": "smooth coat needs sweaters, others okay",
            "monsoon": "manageable"
        },
        "training": {
            "intelligence_rank": 49,
            "trainability": "moderate - independent thinkers",
            "best_approach": "patient, consistent, food rewards",
            "common_issues": ["stubbornness", "barking", "digging", "housetraining"]
        },
        "mira_tips": [
            "BACK HEALTH IS EVERYTHING - no jumping on/off furniture, use ramps",
            "Never let them get overweight - every gram stresses the spine",
            "They were bred to hunt badgers - that stubborn courage is breed trait",
            "Great apartment dogs but will alert-bark at everything",
            "Consider pet insurance - IVDD surgery costs lakhs"
        ]
    },
    
    "chihuahua": {
        "size": "toy",
        "weight_range": "1.5-3 kg",
        "life_expectancy": "12-20 years",
        "energy_level": "moderate",
        "exercise_needs": "20-30 minutes daily",
        "temperament": ["sassy", "charming", "loyal", "alert", "bold"],
        "good_with": ["adults", "singles", "seniors", "apartments"],
        "not_ideal_for": ["families with small children", "cold climates"],
        "health_concerns": [
            "patellar luxation",
            "heart problems",
            "hypoglycemia",
            "dental problems",
            "hydrocephalus",
            "tracheal collapse",
            "eye injuries"
        ],
        "dietary_needs": {
            "protein": "high (28-32%)",
            "fat": "moderate",
            "common_allergies": ["chicken", "grains"],
            "special_considerations": "tiny stomachs - multiple small meals, hypoglycemia risk",
            "recommended_foods": ["toy breed formulas", "high-calorie for size"]
        },
        "grooming": {
            "coat_type": "smooth or long coat",
            "shedding": "low to moderate",
            "brushing": "weekly for smooth, 2-3x for long coat",
            "bathing": "every 3-4 weeks",
            "special_care": "dental care essential, keep warm"
        },
        "climate_suitability": {
            "hot_weather": "okay but not extreme heat",
            "cold_weather": "poor - needs sweaters and warmth",
            "monsoon": "keep dry and warm"
        },
        "training": {
            "intelligence_rank": 67,
            "trainability": "moderate - big personality in tiny body",
            "best_approach": "consistent rules, positive but firm",
            "common_issues": ["small dog syndrome", "excessive barking", "snapping"]
        },
        "mira_tips": [
            "They need training like big dogs - don't let size fool you",
            "Hypoglycemia in puppies is emergency - keep sugar source handy",
            "'Teacup' Chihuahuas are marketing term for unhealthy undersized dogs",
            "They bond intensely to one person - socialize to prevent aggression",
            "Longest-living dog breed - prepare for 15+ year commitment"
        ]
    },
    
    "lhasa apso": {
        "size": "small",
        "weight_range": "5-8 kg",
        "life_expectancy": "12-15 years",
        "energy_level": "moderate",
        "exercise_needs": "30-45 minutes daily",
        "temperament": ["confident", "smart", "comical", "loyal", "independent"],
        "good_with": ["adults", "families with older children", "apartments"],
        "health_concerns": [
            "eye problems (dry eye, PRA, cherry eye)",
            "kidney problems",
            "hip dysplasia",
            "patellar luxation",
            "allergies",
            "dental problems"
        ],
        "dietary_needs": {
            "protein": "moderate (22-26%)",
            "fat": "moderate",
            "common_allergies": ["chicken", "beef", "grains"],
            "special_considerations": "prone to kidney issues - quality protein, hydration important",
            "recommended_foods": ["small breed formulas", "kidney-friendly options for seniors"]
        },
        "grooming": {
            "coat_type": "long, heavy, straight",
            "shedding": "low (hair not fur)",
            "brushing": "daily to prevent mats",
            "bathing": "every 2-3 weeks",
            "special_care": "professional grooming recommended, keep eyes clear"
        },
        "climate_suitability": {
            "hot_weather": "moderate - coat can be kept short",
            "cold_weather": "good",
            "monsoon": "coat needs extra maintenance"
        },
        "training": {
            "intelligence_rank": 68,
            "trainability": "moderate - independent, can be stubborn",
            "best_approach": "patient, consistent, respect their intelligence",
            "common_issues": ["stubbornness", "selective hearing", "guarding behavior"]
        },
        "mira_tips": [
            "They were temple watchdogs - alert barking is in their DNA",
            "Don't mistake small size for pushover - they have big personalities",
            "Grooming is non-negotiable - mats are painful and cause skin issues",
            "They warm up slowly to strangers - early socialization helps",
            "One of the healthier small breeds - good longevity"
        ]
    },

    # ============================================
    # GIANT BREEDS
    # ============================================
    "great dane": {
        "size": "giant",
        "weight_range": "50-80 kg",
        "life_expectancy": "7-10 years",
        "energy_level": "moderate",
        "exercise_needs": "45-60 minutes daily (not intense)",
        "temperament": ["friendly", "patient", "dependable", "gentle", "loving"],
        "good_with": ["families", "children", "other pets"],
        "not_ideal_for": ["small apartments", "hot climates", "limited budgets"],
        "health_concerns": [
            "bloat (GDV) - LIFE THREATENING",
            "heart disease (DCM)",
            "hip dysplasia",
            "bone cancer (osteosarcoma)",
            "wobbler syndrome",
            "hypothyroidism"
        ],
        "dietary_needs": {
            "protein": "moderate (23-26%) - not too high",
            "fat": "moderate",
            "common_allergies": ["chicken", "grains"],
            "special_considerations": "giant breed formula ESSENTIAL, slow growth critical, bloat prevention",
            "recommended_foods": ["giant breed specific", "large kibble to slow eating"]
        },
        "grooming": {
            "coat_type": "short, thick, smooth",
            "shedding": "moderate",
            "brushing": "weekly",
            "bathing": "every 6-8 weeks (it's a project!)",
            "special_care": "nail trimming important, drool management"
        },
        "climate_suitability": {
            "hot_weather": "poor tolerance - needs cooling",
            "cold_weather": "moderate - short coat doesn't insulate well",
            "monsoon": "manageable"
        },
        "training": {
            "intelligence_rank": 48,
            "trainability": "good - eager to please",
            "best_approach": "gentle, consistent - they're sensitive giants",
            "common_issues": ["doesn't know own size", "counter surfing", "leaning on people"]
        },
        "mira_tips": [
            "BLOAT KILLS - learn the signs, have emergency vet number ready",
            "Gastropexy surgery can prevent bloat - discuss with vet",
            "Everything costs more - food, meds, boarding, even car size",
            "They think they're lap dogs - embrace the gentle giant cuddles",
            "Short lifespan means cherishing every year"
        ]
    },
    
    "saint bernard": {
        "size": "giant",
        "weight_range": "55-90 kg",
        "life_expectancy": "8-10 years",
        "energy_level": "low to moderate",
        "exercise_needs": "30-45 minutes daily",
        "temperament": ["gentle", "friendly", "patient", "calm", "watchful"],
        "good_with": ["families", "children", "cold climates"],
        "not_ideal_for": ["hot climates", "small spaces", "neat freaks (drool!)"],
        "health_concerns": [
            "hip dysplasia",
            "elbow dysplasia",
            "heart conditions",
            "bloat (GDV)",
            "bone cancer",
            "eye problems (entropion, ectropion)",
            "epilepsy"
        ],
        "dietary_needs": {
            "protein": "moderate (23-26%)",
            "fat": "moderate",
            "common_allergies": ["chicken", "corn", "wheat"],
            "special_considerations": "giant breed formula, bloat prevention, controlled growth",
            "recommended_foods": ["giant breed formulas", "joint support"]
        },
        "grooming": {
            "coat_type": "short or long, dense",
            "shedding": "heavy, especially seasonally",
            "brushing": "2-3 times weekly, daily when shedding",
            "bathing": "every 6-8 weeks",
            "special_care": "drool management essential, eye cleaning"
        },
        "climate_suitability": {
            "hot_weather": "VERY POOR - bred for Swiss Alps, suffers in Indian heat",
            "cold_weather": "excellent",
            "monsoon": "coat stays wet, needs drying"
        },
        "training": {
            "intelligence_rank": 65,
            "trainability": "good - wants to please",
            "best_approach": "patient, consistent, early training while still manageable size",
            "common_issues": ["drooling everywhere", "doesn't know size", "heat exhaustion"]
        },
        "mira_tips": [
            "NOT SUITABLE FOR MOST OF INDIA - heat is dangerous for them",
            "Drool is not manageable - it's part of life with this breed",
            "Train early - a 70kg untrained dog is unmanageable",
            "Shortest lifespan of giant breeds - prepare emotionally",
            "Air conditioning is mandatory, not optional"
        ]
    },

    # ============================================
    # WORKING/HERDING BREEDS
    # ============================================
    "border collie": {
        "size": "medium",
        "weight_range": "14-20 kg",
        "life_expectancy": "12-15 years",
        "energy_level": "EXTREMELY HIGH",
        "exercise_needs": "90-120+ minutes daily of intense activity",
        "temperament": ["intelligent", "energetic", "alert", "responsive", "tenacious"],
        "good_with": ["active families", "dog sports", "experienced owners"],
        "not_ideal_for": ["apartments", "sedentary owners", "first-time owners"],
        "health_concerns": [
            "hip dysplasia",
            "collie eye anomaly",
            "epilepsy",
            "deafness",
            "neuronal ceroid lipofuscinosis",
            "trapped neutrophil syndrome"
        ],
        "dietary_needs": {
            "protein": "high (28-32%) - active breed",
            "fat": "higher than average for energy",
            "common_allergies": ["chicken", "grains"],
            "special_considerations": "high metabolism needs quality fuel, working dog formulas",
            "recommended_foods": ["high-performance", "sport dog formulas"]
        },
        "grooming": {
            "coat_type": "double coat, medium length",
            "shedding": "heavy seasonally",
            "brushing": "2-3 times weekly, daily when shedding",
            "bathing": "every 6-8 weeks",
            "special_care": "check for mats behind ears, feathering"
        },
        "climate_suitability": {
            "hot_weather": "moderate - exercise in cool parts of day",
            "cold_weather": "excellent",
            "monsoon": "manageable with proper drying"
        },
        "training": {
            "intelligence_rank": 1,
            "trainability": "EXCEPTIONAL - smartest breed",
            "best_approach": "challenging tasks, mental stimulation, variety",
            "common_issues": ["herding children/other pets", "neurotic if understimulated", "obsessive behaviors"]
        },
        "mira_tips": [
            "WILL DEVELOP BEHAVIORAL ISSUES if not mentally/physically challenged",
            "A tired Border Collie is a good Border Collie - they need WORK",
            "Herding instinct means they may nip heels and chase",
            "They watch you constantly and learn your patterns",
            "Consider dog sports: agility, flyball, herding trials"
        ]
    },
    
    "siberian husky": {
        "size": "medium to large",
        "weight_range": "16-27 kg",
        "life_expectancy": "12-14 years",
        "energy_level": "EXTREMELY HIGH",
        "exercise_needs": "90-120+ minutes daily",
        "temperament": ["mischievous", "friendly", "outgoing", "alert", "independent"],
        "good_with": ["active families", "other dogs", "experienced owners"],
        "not_ideal_for": ["hot climates", "apartments", "off-leash life", "first-time owners"],
        "health_concerns": [
            "eye problems (cataracts, PRA, corneal dystrophy)",
            "hip dysplasia",
            "zinc deficiency",
            "hypothyroidism",
            "autoimmune disorders"
        ],
        "dietary_needs": {
            "protein": "high (25-30%)",
            "fat": "higher than average",
            "common_allergies": ["chicken", "wheat"],
            "special_considerations": "bred to run on less food than expected, zinc supplementation often needed",
            "recommended_foods": ["working dog formulas", "fish-based for coat"]
        },
        "grooming": {
            "coat_type": "thick double coat",
            "shedding": "EXTREME twice yearly (blowing coat)",
            "brushing": "daily during shedding, 2-3x weekly otherwise",
            "bathing": "rarely - coat self-cleans",
            "special_care": "NEVER shave - coat regulates temperature"
        },
        "climate_suitability": {
            "hot_weather": "EXTREMELY POOR - bred for -40°C, suffers in Indian heat",
            "cold_weather": "excellent - what they're made for",
            "monsoon": "coat issues in humidity"
        },
        "training": {
            "intelligence_rank": 45,
            "trainability": "challenging - intelligent but independent",
            "best_approach": "patient, consistent, make it fun, never off-leash",
            "common_issues": ["escape artists", "prey drive", "selective hearing", "howling"]
        },
        "mira_tips": [
            "TERRIBLE CHOICE FOR INDIAN CLIMATE - please reconsider",
            "They WILL escape - secure fencing essential",
            "Cannot be off-leash - they will run and not come back",
            "Bred to run 100+ km daily - apartment life is cruel",
            "If you have one in India, 24/7 AC is mandatory"
        ]
    },
    
    "boxer": {
        "size": "medium to large",
        "weight_range": "25-32 kg",
        "life_expectancy": "10-12 years",
        "energy_level": "high",
        "exercise_needs": "60-90 minutes daily",
        "temperament": ["playful", "bright", "active", "loyal", "fun-loving"],
        "good_with": ["families", "children", "active homes"],
        "health_concerns": [
            "heart conditions (aortic stenosis, cardiomyopathy)",
            "cancer (high incidence)",
            "hip dysplasia",
            "bloat (GDV)",
            "allergies",
            "brachycephalic issues (moderate)",
            "degenerative myelopathy"
        ],
        "dietary_needs": {
            "protein": "high (26-30%)",
            "fat": "moderate",
            "common_allergies": ["chicken", "beef", "wheat", "corn", "soy"],
            "special_considerations": "sensitive stomachs common, prone to food allergies",
            "recommended_foods": ["limited ingredient", "sensitive stomach formulas"]
        },
        "grooming": {
            "coat_type": "short, tight-fitting",
            "shedding": "moderate",
            "brushing": "weekly",
            "bathing": "every 6-8 weeks",
            "special_care": "wrinkle cleaning, drool management"
        },
        "climate_suitability": {
            "hot_weather": "poor - brachycephalic, overheats easily",
            "cold_weather": "poor - short coat",
            "monsoon": "manageable"
        },
        "training": {
            "intelligence_rank": 48,
            "trainability": "good - eager to please, playful approach works",
            "best_approach": "positive, fun, patient - they mature slowly",
            "common_issues": ["jumping", "mouthiness", "high energy as puppies"]
        },
        "mira_tips": [
            "They stay puppyish until 3-4 years old - patience required",
            "Cancer risk is high - regular vet checks important",
            "Great family dogs but need to learn not to jump",
            "Heat sensitive - exercise in cool hours only",
            "Food allergies are common - elimination diet may be needed"
        ]
    },
    
    "doberman pinscher": {
        "size": "large",
        "weight_range": "32-45 kg",
        "life_expectancy": "10-13 years",
        "energy_level": "high",
        "exercise_needs": "60-90 minutes daily",
        "temperament": ["loyal", "fearless", "alert", "intelligent", "energetic"],
        "good_with": ["experienced owners", "active families", "as personal protection"],
        "not_ideal_for": ["first-time owners", "sedentary lifestyle", "cold outdoor living"],
        "health_concerns": [
            "dilated cardiomyopathy (DCM) - MAJOR CONCERN",
            "von Willebrand's disease",
            "hip dysplasia",
            "wobbler syndrome",
            "hypothyroidism",
            "bloat (GDV)"
        ],
        "dietary_needs": {
            "protein": "high (26-30%)",
            "fat": "moderate",
            "common_allergies": ["chicken", "grains"],
            "special_considerations": "taurine supplementation may help heart health",
            "recommended_foods": ["large breed formulas", "heart-healthy with taurine"]
        },
        "grooming": {
            "coat_type": "short, smooth",
            "shedding": "low to moderate",
            "brushing": "weekly",
            "bathing": "every 6-8 weeks",
            "special_care": "ear care if cropped, keep warm in cold"
        },
        "climate_suitability": {
            "hot_weather": "moderate tolerance",
            "cold_weather": "poor - no undercoat, needs warmth",
            "monsoon": "manageable"
        },
        "training": {
            "intelligence_rank": 5,
            "trainability": "excellent - highly intelligent and eager",
            "best_approach": "firm, consistent, positive, early socialization essential",
            "common_issues": ["overprotectiveness", "separation anxiety", "reactivity if not socialized"]
        },
        "mira_tips": [
            "Heart disease is the #1 killer - annual cardiac screening recommended",
            "They bond deeply and can develop separation anxiety",
            "Early socialization prevents the 'dangerous Doberman' stereotype",
            "Need mental challenges as much as physical exercise",
            "Great family protectors when properly trained and socialized"
        ]
    }
}

# Helper function to get breed info with fuzzy matching
def get_breed_knowledge(breed_name: str) -> dict:
    """
    Get breed knowledge with fuzzy matching for breed name variations.
    """
    if not breed_name:
        return None
    
    # Normalize the breed name
    breed_lower = breed_name.lower().strip()
    
    # Direct match
    if breed_lower in BREED_KNOWLEDGE:
        return BREED_KNOWLEDGE[breed_lower]
    
    # Common variations
    variations = {
        "golden": "golden retriever",
        "lab": "labrador retriever",
        "labrador": "labrador retriever",
        "gsd": "german shepherd",
        "german shephard": "german shepherd",
        "alsatian": "german shepherd",
        "rottie": "rottweiler",
        "cocker": "cocker spaniel",
        "spitz": "indian spitz",
        "indie": "indie / indian pariah",
        "indian pariah": "indie / indian pariah",
        "desi dog": "indie / indian pariah",
        "street dog": "indie / indian pariah",
        "pom": "pomeranian",
        "frenchie": "french bulldog",
        "frenchbulldog": "french bulldog",
        "doxie": "dachshund",
        "wiener dog": "dachshund",
        "sausage dog": "dachshund",
        "chi": "chihuahua",
        "lhasa": "lhasa apso",
        "dane": "great dane",
        "saint": "saint bernard",
        "st bernard": "saint bernard",
        "st. bernard": "saint bernard",
        "border": "border collie",
        "husky": "siberian husky",
        "dobie": "doberman pinscher",
        "doberman": "doberman pinscher",
        "shitzu": "shih tzu",
        "shihtzu": "shih tzu"
    }
    
    if breed_lower in variations:
        return BREED_KNOWLEDGE.get(variations[breed_lower])
    
    # Partial match
    for key in BREED_KNOWLEDGE:
        if breed_lower in key or key in breed_lower:
            return BREED_KNOWLEDGE[key]
    
    return None

def format_breed_context_for_llm(breed_name: str) -> str:
    """
    Format breed knowledge into a context string for the LLM prompt.
    """
    knowledge = get_breed_knowledge(breed_name)
    
    if not knowledge:
        return f"Breed: {breed_name} (no specific data available - provide general dog advice)"
    
    # Build a comprehensive but concise context string
    context_parts = [
        f"BREED INTELLIGENCE FOR {breed_name.upper()}:",
        f"",
        f"Size: {knowledge.get('size', 'unknown')} ({knowledge.get('weight_range', 'unknown')})",
        f"Energy: {knowledge.get('energy_level', 'unknown')} - needs {knowledge.get('exercise_needs', 'regular exercise')}",
        f"Lifespan: {knowledge.get('life_expectancy', 'unknown')}",
        f"",
        f"Temperament: {', '.join(knowledge.get('temperament', [])[:5])}",
        f"Good with: {', '.join(knowledge.get('good_with', [])[:4])}",
    ]
    
    # Health concerns
    health = knowledge.get('health_concerns', [])
    if health:
        context_parts.append(f"")
        context_parts.append(f"KEY HEALTH CONCERNS: {', '.join(health[:5])}")
    
    # Dietary needs
    diet = knowledge.get('dietary_needs', {})
    if diet:
        context_parts.append(f"")
        context_parts.append(f"DIETARY NEEDS:")
        if diet.get('common_allergies'):
            context_parts.append(f"- Common allergies: {', '.join(diet['common_allergies'][:4])}")
        if diet.get('special_considerations'):
            context_parts.append(f"- Special note: {diet['special_considerations']}")
    
    # Climate
    climate = knowledge.get('climate_suitability', {})
    if climate:
        context_parts.append(f"")
        context_parts.append(f"CLIMATE (India relevant):")
        context_parts.append(f"- Hot weather: {climate.get('hot_weather', 'unknown')}")
        context_parts.append(f"- Monsoon: {climate.get('monsoon', 'unknown')}")
    
    # Mira tips
    tips = knowledge.get('mira_tips', [])
    if tips:
        context_parts.append(f"")
        context_parts.append(f"CRITICAL TIPS FOR MIRA:")
        for tip in tips[:3]:
            context_parts.append(f"- {tip}")
    
    return "\n".join(context_parts)


# List of all breeds for autocomplete/suggestions
def get_all_breed_names() -> list:
    """Return list of all breed names in the knowledge base."""
    return list(BREED_KNOWLEDGE.keys())


# Get breeds by characteristic
def get_breeds_by_trait(trait: str) -> list:
    """Find breeds matching a specific trait."""
    matching = []
    trait_lower = trait.lower()
    
    for breed, data in BREED_KNOWLEDGE.items():
        # Check temperament
        if any(trait_lower in t.lower() for t in data.get('temperament', [])):
            matching.append(breed)
            continue
        
        # Check good_with
        if any(trait_lower in g.lower() for g in data.get('good_with', [])):
            matching.append(breed)
            continue
        
        # Check size
        if trait_lower == data.get('size', '').lower():
            matching.append(breed)
            continue
        
        # Check energy level
        if trait_lower in data.get('energy_level', '').lower():
            matching.append(breed)
            continue
    
    return matching
