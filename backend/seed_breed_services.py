"""
Breed-Specific Service Seeder
Seeds services_master with breed-specific Mira whispers across all 14 pillars
Each service has unique, relevant messaging
"""

from datetime import datetime, timezone

# Breed-specific Mira whispers mapped by breed and service category
BREED_WHISPERS = {
    "shih_tzu": {
        "grooming": "Shih Tzus need professional grooming every 4-6 weeks for their luxurious coat",
        "dental": "Small breeds like Shih Tzus are prone to dental issues - regular cleaning is essential",
        "training": "Shih Tzus respond best to gentle, reward-based training with patience",
        "boarding": "Shih Tzus prefer quiet, calm boarding environments with personalized attention",
        "daycare": "Small group settings work best for companion breeds like Shih Tzus",
        "walking": "Short, gentle walks are perfect for Shih Tzus - they don't need marathon runs",
        "spa": "Facial grooming and eye care are essential for flat-faced Shih Tzus",
        "vet": "Regular eye and dental checks are important for this breed",
        "travel": "Shih Tzus travel well in carriers - keep them cool and comfortable",
        "photography": "Shih Tzus are natural posers with their flowing coats",
        "default": "Perfect for Shih Tzu's gentle, companion nature"
    },
    "golden_retriever": {
        "grooming": "Golden Retrievers need regular brushing to manage shedding and keep their coat healthy",
        "swimming": "Golden Retrievers are natural swimmers - water activities are their happy place!",
        "training": "Goldens are eager to please and excel at obedience training",
        "boarding": "Social Goldens thrive with playmates - they love making friends",
        "daycare": "Group play is ideal for friendly, social Golden Retrievers",
        "walking": "Goldens need active walks - they have energy to burn!",
        "fitness": "Retrievers benefit from structured exercise to maintain healthy joints",
        "spa": "Deshedding treatments keep Golden coats manageable",
        "vet": "Hip and elbow screening is important for this breed",
        "travel": "Goldens are great travel companions - they adapt well to new places",
        "photography": "Golden Retrievers are photogenic and naturally happy-looking",
        "default": "Perfect for active, friendly Golden Retrievers"
    },
    "labrador": {
        "grooming": "Labs have a double coat that benefits from regular deshedding treatments",
        "swimming": "Labs are water lovers - swimming is excellent exercise for them",
        "training": "Labs are food-motivated and respond well to positive reinforcement",
        "fitness": "Labs are prone to weight gain - regular fitness activities are essential",
        "boarding": "Social Labs love group boarding with plenty of playtime",
        "daycare": "Labs thrive in active daycare environments with lots of interaction",
        "walking": "Labs need vigorous walks - they have boundless energy",
        "spa": "Regular deshedding keeps Lab coats healthy and your home cleaner",
        "vet": "Weight monitoring and joint care are important for Labradors",
        "travel": "Labs are adaptable travelers but get excited - secure harnesses help",
        "default": "Great for energetic, food-loving Labradors"
    },
    "pug": {
        "grooming": "Pugs need facial fold cleaning and regular bathing to stay healthy",
        "fitness": "Short, gentle walks work best - Pugs can overheat easily",
        "boarding": "Climate-controlled boarding is essential for flat-faced Pugs",
        "spa": "Facial care and wrinkle cleaning are must-haves for Pugs",
        "vet": "Breathing checks and weight management are important for Pugs",
        "travel": "Pugs need temperature-controlled travel - avoid heat exposure",
        "daycare": "Low-activity daycare suits Pugs better than high-energy play",
        "default": "Tailored for Pug's special brachycephalic needs"
    },
    "beagle": {
        "training": "Beagles are scent-driven - keep training sessions engaging and varied",
        "boarding": "Secure facilities are important - Beagles are escape artists!",
        "walking": "Beagles need walks with plenty of sniffing time to satisfy their nose",
        "daycare": "Beagles enjoy social play but may follow their nose",
        "default": "Perfect for curious, scent-loving Beagles"
    },
    "german_shepherd": {
        "training": "GSDs thrive with mental stimulation and challenging tasks",
        "fitness": "Active exercise prevents boredom and anxiety in German Shepherds",
        "grooming": "Regular deshedding keeps their double coat healthy",
        "vet": "Hip screening and joint monitoring are important for this breed",
        "boarding": "GSDs do well with consistent routines and experienced handlers",
        "default": "Ideal for intelligent, active German Shepherds"
    },
    "default": {
        "default": "Curated care for your unique companion"
    }
}

# Master service catalog with breed-specific whispers
MASTER_SERVICES_WITH_WHISPERS = {
    "care": {
        "pillar_name": "Care",
        "icon": "💊",
        "services": [
            {
                "id": "svc-care-grooming-full",
                "name": "Full Grooming Session",
                "description": "Complete grooming including bath, haircut, nail trim, ear cleaning",
                "base_price": 1499,
                "duration": "90 mins",
                "is_bookable": True,
                "includes": ["Bath & blow dry", "Haircut/styling", "Nail trim", "Ear cleaning", "Sanitary trim"],
                "breed_whispers": {
                    "shih_tzu": "Shih Tzus need grooming every 4-6 weeks for their flowing coat",
                    "golden_retriever": "Regular grooming keeps Golden coats shiny and healthy",
                    "labrador": "Deshedding treatment included to manage Lab's double coat",
                    "pug": "Includes facial fold cleaning essential for Pugs",
                    "default": "Professional grooming tailored to your dog's coat type"
                }
            },
            {
                "id": "svc-care-bath-basic",
                "name": "Bath & Brush",
                "description": "Refreshing bath with coat-appropriate shampoo and thorough brushing",
                "base_price": 699,
                "duration": "45 mins",
                "is_bookable": True,
                "includes": ["Bath with premium shampoo", "Blow dry", "Brushing", "Light detangling"],
                "breed_whispers": {
                    "shih_tzu": "Gentle bath keeps Shih Tzu's silky coat in top condition",
                    "golden_retriever": "Deep cleaning bath perfect for active Goldens",
                    "labrador": "Thorough rinse to remove outdoor dirt Labs love to collect",
                    "default": "Refreshing bath for a clean, happy pup"
                }
            },
            {
                "id": "svc-care-nail-trim",
                "name": "Nail Trim & Paw Care",
                "description": "Professional nail trimming with paw pad moisturizing",
                "base_price": 299,
                "duration": "20 mins",
                "is_bookable": True,
                "includes": ["Nail trimming", "Filing", "Paw pad check", "Moisturizing"],
                "breed_whispers": {
                    "shih_tzu": "Regular trims prevent paw issues in small breeds",
                    "default": "Keep paws healthy and comfortable"
                }
            },
            {
                "id": "svc-care-dental",
                "name": "Dental Cleaning",
                "description": "Professional teeth cleaning and oral health check",
                "base_price": 999,
                "duration": "45 mins",
                "is_bookable": True,
                "includes": ["Teeth brushing", "Plaque removal", "Breath freshening", "Oral exam"],
                "breed_whispers": {
                    "shih_tzu": "Small breeds like Shih Tzus are prone to dental issues",
                    "pug": "Dental care is crucial for brachycephalic breeds",
                    "default": "Maintain fresh breath and healthy teeth"
                }
            },
            {
                "id": "svc-care-spa-luxury",
                "name": "Luxury Spa Day",
                "description": "Premium spa experience with massage, aromatherapy, and special treatments",
                "base_price": 2499,
                "duration": "2 hours",
                "is_bookable": True,
                "includes": ["Relaxation massage", "Aromatherapy bath", "Deep conditioning", "Paw treatment", "Blueberry facial"],
                "breed_whispers": {
                    "shih_tzu": "Royal treatment for your regal Shih Tzu companion",
                    "golden_retriever": "Deep coat conditioning for that Golden shine",
                    "default": "Ultimate pampering for your precious companion"
                }
            },
            {
                "id": "svc-care-vet-checkup",
                "name": "Wellness Check-up",
                "description": "Comprehensive health examination by licensed veterinarian",
                "base_price": 799,
                "duration": "30 mins",
                "is_bookable": True,
                "requires_consultation": True,
                "includes": ["Physical exam", "Weight check", "Heart & lung check", "Vaccination review"],
                "breed_whispers": {
                    "golden_retriever": "Hip and joint screening included for Retrievers",
                    "labrador": "Weight monitoring important for Labs",
                    "pug": "Breathing assessment included for flat-faced breeds",
                    "german_shepherd": "Joint and hip focus for German Shepherds",
                    "default": "Preventive care for a healthy, happy life"
                }
            },
            {
                "id": "svc-care-vaccination",
                "name": "Vaccination Package",
                "description": "Core vaccinations with health certificate",
                "base_price": 1299,
                "duration": "30 mins",
                "is_bookable": True,
                "includes": ["Core vaccines", "Health certificate", "Next dose reminder"],
                "breed_whispers": {
                    "default": "Keep your companion protected and healthy"
                }
            },
            {
                "id": "svc-care-home-visit",
                "name": "Home Vet Visit",
                "description": "Veterinarian comes to your home for check-up or treatment",
                "base_price": 1499,
                "duration": "45 mins",
                "is_bookable": True,
                "breed_whispers": {
                    "shih_tzu": "Less stressful for anxiety-prone small breeds",
                    "pug": "Avoids travel stress for brachycephalic breeds",
                    "default": "Convenient care in familiar surroundings"
                }
            }
        ]
    },
    "stay": {
        "pillar_name": "Stay",
        "icon": "🏨",
        "services": [
            {
                "id": "svc-stay-daycare",
                "name": "Daycare",
                "description": "Supervised play and socialization during work hours",
                "base_price": 599,
                "duration": "8 hours",
                "is_bookable": True,
                "includes": ["Supervised play", "Meals (bring your own)", "Nap time", "Updates & photos"],
                "breed_whispers": {
                    "golden_retriever": "Goldens love socializing - daycare is their happy place!",
                    "labrador": "Perfect for energetic Labs who need daily exercise",
                    "shih_tzu": "Small group settings available for smaller breeds",
                    "beagle": "Structured activities keep curious Beagles engaged",
                    "default": "Safe, supervised fun while you're at work"
                }
            },
            {
                "id": "svc-stay-boarding-standard",
                "name": "Standard Boarding",
                "description": "Comfortable overnight stay with care and attention",
                "base_price": 999,
                "duration": "Per night",
                "is_bookable": True,
                "includes": ["Climate-controlled room", "3 meals/day", "Walks", "Playtime"],
                "breed_whispers": {
                    "golden_retriever": "Social boarding with group play for friendly Goldens",
                    "shih_tzu": "Quiet, comfortable environment for sensitive Shih Tzus",
                    "pug": "Climate-controlled essential for flat-faced breeds",
                    "beagle": "Secure facility - we know Beagles can be escape artists!",
                    "default": "A home away from home for your companion"
                }
            },
            {
                "id": "svc-stay-boarding-luxury",
                "name": "Luxury Suite Boarding",
                "description": "Premium private suite with extra amenities and attention",
                "base_price": 1999,
                "duration": "Per night",
                "is_bookable": True,
                "includes": ["Private suite", "Webcam access", "Premium meals", "Extra playtime", "Bedtime tuck-in"],
                "breed_whispers": {
                    "shih_tzu": "Royal treatment for your Shih Tzu companion",
                    "golden_retriever": "Extra play sessions for active Retrievers",
                    "default": "VIP treatment for your special companion"
                }
            },
            {
                "id": "svc-stay-home-sitting",
                "name": "In-Home Pet Sitting",
                "description": "Caretaker stays at your home with your pet",
                "base_price": 1499,
                "duration": "Per night",
                "is_bookable": True,
                "includes": ["Overnight care", "Maintain routine", "Home security", "Updates & photos"],
                "breed_whispers": {
                    "shih_tzu": "Less stressful for pets who prefer familiar surroundings",
                    "pug": "Your pug stays comfortable in their own climate-controlled home",
                    "default": "Your pet stays home while you travel"
                }
            }
        ]
    },
    "learn": {
        "pillar_name": "Learn",
        "icon": "🎓",
        "services": [
            {
                "id": "svc-learn-puppy-basics",
                "name": "Puppy Training Basics",
                "description": "Foundation training for puppies 8-16 weeks",
                "base_price": 2999,
                "duration": "4 sessions",
                "is_bookable": True,
                "includes": ["Basic commands", "Socialization", "Potty training guidance", "Bite inhibition"],
                "breed_whispers": {
                    "golden_retriever": "Goldens are eager learners - they'll excel!",
                    "labrador": "Food-motivated Labs respond great to treat-based training",
                    "shih_tzu": "Gentle approach for sensitive Shih Tzu puppies",
                    "beagle": "Scent-based rewards work well for Beagle pups",
                    "german_shepherd": "Early training sets up GSD puppies for success",
                    "default": "Build a strong foundation for lifelong good behavior"
                }
            },
            {
                "id": "svc-learn-obedience",
                "name": "Obedience Training",
                "description": "Advanced commands and behavior refinement",
                "base_price": 4999,
                "duration": "8 sessions",
                "is_bookable": True,
                "includes": ["Heel", "Stay", "Recall", "Leash manners", "Distraction training"],
                "breed_whispers": {
                    "german_shepherd": "GSDs thrive with structured, challenging training",
                    "golden_retriever": "Goldens love learning new commands",
                    "labrador": "Perfect for channeling Lab energy positively",
                    "beagle": "Focus training helps easily-distracted Beagles",
                    "default": "Transform your dog into a well-mannered companion"
                }
            },
            {
                "id": "svc-learn-behavior",
                "name": "Behavior Consultation",
                "description": "Expert assessment and plan for behavior issues",
                "base_price": 1499,
                "duration": "90 mins",
                "is_bookable": True,
                "requires_consultation": True,
                "includes": ["Behavior assessment", "Personalized plan", "Follow-up support"],
                "breed_whispers": {
                    "beagle": "Address scent-driven behaviors common in Beagles",
                    "german_shepherd": "Expert help for GSD-specific tendencies",
                    "default": "Understand and address your dog's unique behaviors"
                }
            },
            {
                "id": "svc-learn-agility",
                "name": "Agility Training",
                "description": "Fun obstacle course training for fitness and bonding",
                "base_price": 3499,
                "duration": "6 sessions",
                "is_bookable": True,
                "includes": ["Obstacle introduction", "Confidence building", "Speed training", "Competition prep"],
                "breed_whispers": {
                    "golden_retriever": "Retrievers are natural athletes in agility",
                    "labrador": "Great way to burn Lab energy!",
                    "german_shepherd": "GSDs excel at agility with their intelligence",
                    "default": "Fun exercise that strengthens your bond"
                }
            }
        ]
    },
    "fit": {
        "pillar_name": "Fit",
        "icon": "🏃",
        "services": [
            {
                "id": "svc-fit-swimming",
                "name": "Swimming Session",
                "description": "Supervised pool time for exercise and fun",
                "base_price": 999,
                "duration": "45 mins",
                "is_bookable": True,
                "includes": ["Pool access", "Life jacket", "Supervision", "Rinse & dry"],
                "breed_whispers": {
                    "golden_retriever": "Retrievers are natural swimmers - their happy place!",
                    "labrador": "Labs are water babies - swimming is perfect exercise",
                    "shih_tzu": "Gentle introduction available for hesitant swimmers",
                    "pug": "Supervised shallow water suitable for flat-faced breeds",
                    "default": "Low-impact exercise that's easy on joints"
                }
            },
            {
                "id": "svc-fit-hydrotherapy",
                "name": "Hydrotherapy",
                "description": "Therapeutic water exercise for recovery or arthritis",
                "base_price": 1499,
                "duration": "45 mins",
                "is_bookable": True,
                "requires_consultation": True,
                "includes": ["Assessment", "Underwater treadmill", "Therapist supervision"],
                "breed_whispers": {
                    "golden_retriever": "Excellent for Retriever joint health",
                    "labrador": "Helps Labs maintain mobility while managing weight",
                    "german_shepherd": "Supports hip health in German Shepherds",
                    "default": "Therapeutic exercise for recovery and mobility"
                }
            },
            {
                "id": "svc-fit-fitness-assessment",
                "name": "Fitness Assessment",
                "description": "Complete fitness evaluation with personalized plan",
                "base_price": 799,
                "duration": "60 mins",
                "is_bookable": True,
                "includes": ["Body condition score", "Mobility check", "Exercise plan", "Diet recommendations"],
                "breed_whispers": {
                    "labrador": "Weight management focus for Labs",
                    "pug": "Activity level tailored for brachycephalic needs",
                    "golden_retriever": "Joint-friendly exercise planning",
                    "default": "Customized fitness plan for your dog's needs"
                }
            },
            {
                "id": "svc-fit-dog-walking",
                "name": "Professional Dog Walking",
                "description": "Regular walks by trained professionals",
                "base_price": 399,
                "duration": "30 mins",
                "is_bookable": True,
                "includes": ["Neighborhood walk", "Basic commands practice", "Photo updates"],
                "breed_whispers": {
                    "beagle": "Extra sniff time included for scent-loving Beagles",
                    "golden_retriever": "Active walks for energetic Retrievers",
                    "labrador": "Vigorous walks to burn Lab energy",
                    "shih_tzu": "Gentle pace walks for smaller breeds",
                    "pug": "Short, shaded routes for flat-faced breeds",
                    "german_shepherd": "Structured walks with mental stimulation",
                    "default": "Daily exercise and fresh air for your companion"
                }
            }
        ]
    },
    "travel": {
        "pillar_name": "Travel",
        "icon": "✈️",
        "services": [
            {
                "id": "svc-travel-pet-taxi",
                "name": "Pet Taxi",
                "description": "Safe transport for vet visits, grooming, or playdates",
                "base_price": 499,
                "duration": "Per trip",
                "is_bookable": True,
                "includes": ["AC vehicle", "Pet-safe carrier", "Experienced driver", "Door pickup"],
                "breed_whispers": {
                    "pug": "Climate-controlled vehicle essential for flat-faced breeds",
                    "shih_tzu": "Comfortable carriers for smaller companions",
                    "default": "Safe, stress-free transportation"
                }
            },
            {
                "id": "svc-travel-airport",
                "name": "Airport Transfer",
                "description": "Pet pickup/drop for flights with documentation assistance",
                "base_price": 1999,
                "duration": "Per trip",
                "is_bookable": True,
                "includes": ["Airport coordination", "Document check", "Comfortable carrier", "Wait time"],
                "breed_whispers": {
                    "pug": "Special handling for brachycephalic breeds during travel",
                    "golden_retriever": "Calm handling for travel-excited Retrievers",
                    "default": "Seamless airport experience for your pet"
                }
            },
            {
                "id": "svc-travel-relocation",
                "name": "Pet Relocation",
                "description": "Complete relocation service for city or international moves",
                "base_price": 9999,
                "duration": "As needed",
                "is_bookable": True,
                "requires_consultation": True,
                "includes": ["Documentation", "Health certificates", "Travel arrangements", "Destination pickup"],
                "breed_whispers": {
                    "pug": "Climate considerations included for flat-faced breeds",
                    "default": "Stress-free relocation for your companion"
                }
            }
        ]
    },
    "celebrate": {
        "pillar_name": "Celebrate",
        "icon": "🎂",
        "services": [
            {
                "id": "svc-celebrate-birthday",
                "name": "Birthday Party",
                "description": "Complete birthday celebration for your pet",
                "base_price": 4999,
                "duration": "3 hours",
                "is_bookable": True,
                "includes": ["Pet-safe cake", "Decorations", "Pawty games", "Photo session", "Guest goodie bags"],
                "breed_whispers": {
                    "golden_retriever": "Goldens love parties - they'll be the perfect host!",
                    "labrador": "Food-focused Labs will love the cake!",
                    "shih_tzu": "Elegant celebration for your royal companion",
                    "default": "Make their special day unforgettable"
                }
            },
            {
                "id": "svc-celebrate-gotcha",
                "name": "Gotcha Day Celebration",
                "description": "Celebrate the day you found each other",
                "base_price": 2999,
                "duration": "2 hours",
                "is_bookable": True,
                "includes": ["Special treats", "Photo shoot", "Certificate", "Memory book"],
                "breed_whispers": {
                    "default": "Celebrate the day your family became complete"
                }
            },
            {
                "id": "svc-celebrate-photoshoot",
                "name": "Professional Pet Photography",
                "description": "Studio or outdoor photo session",
                "base_price": 3499,
                "duration": "2 hours",
                "is_bookable": True,
                "includes": ["Professional photographer", "Multiple backdrops", "10 edited photos", "Online gallery"],
                "breed_whispers": {
                    "shih_tzu": "Shih Tzus are natural models with their flowing coats",
                    "golden_retriever": "Capture that Golden smile perfectly",
                    "pug": "Adorable Pug expressions in every frame",
                    "default": "Professional portraits of your precious companion"
                }
            }
        ]
    },
    "advisory": {
        "pillar_name": "Advisory",
        "icon": "📋",
        "services": [
            {
                "id": "svc-advisory-nutrition",
                "name": "Nutrition Consultation",
                "description": "Expert advice on diet and feeding",
                "base_price": 999,
                "duration": "45 mins",
                "is_bookable": True,
                "requires_consultation": True,
                "includes": ["Diet assessment", "Meal planning", "Supplement recommendations", "Follow-up"],
                "breed_whispers": {
                    "labrador": "Weight management strategies for food-loving Labs",
                    "pug": "Diet plan to prevent weight issues in Pugs",
                    "golden_retriever": "Joint-supporting nutrition for Retrievers",
                    "default": "Personalized nutrition plan for optimal health"
                }
            },
            {
                "id": "svc-advisory-breed",
                "name": "Breed Selection Counseling",
                "description": "Expert guidance on choosing the right breed",
                "base_price": 799,
                "duration": "60 mins",
                "is_bookable": True,
                "is_free": False,
                "includes": ["Lifestyle assessment", "Breed recommendations", "Breeder guidance"],
                "breed_whispers": {
                    "default": "Find your perfect companion match"
                }
            },
            {
                "id": "svc-advisory-puppy-prep",
                "name": "New Puppy Preparation",
                "description": "Everything you need to know before bringing puppy home",
                "base_price": 1499,
                "duration": "90 mins",
                "is_bookable": True,
                "includes": ["Home setup guide", "Supply checklist", "First week plan", "Vet schedule"],
                "breed_whispers": {
                    "shih_tzu": "Grooming prep and coat care essentials for Shih Tzus",
                    "golden_retriever": "Puppy-proofing tips for energetic Retriever pups",
                    "labrador": "Managing Lab puppy energy from day one",
                    "pug": "Special care needs for brachycephalic puppies",
                    "german_shepherd": "Early training importance for GSD puppies",
                    "default": "Set up for success from day one"
                }
            }
        ]
    },
    "emergency": {
        "pillar_name": "Emergency",
        "icon": "🚨",
        "services": [
            {
                "id": "svc-emergency-helpline",
                "name": "24/7 Pet Emergency Helpline",
                "description": "Round-the-clock expert guidance for emergencies",
                "base_price": 0,
                "is_free": True,
                "is_24x7": True,
                "is_bookable": False,
                "includes": ["Instant connection", "Vet guidance", "Emergency triage"],
                "breed_whispers": {
                    "pug": "Breathing emergency protocol for flat-faced breeds",
                    "default": "Immediate expert help when you need it most"
                }
            },
            {
                "id": "svc-emergency-transport",
                "name": "Emergency Pet Transport",
                "description": "Rapid transport to nearest emergency vet",
                "base_price": 999,
                "is_24x7": True,
                "is_bookable": True,
                "includes": ["Priority response", "First aid kit", "Vet coordination"],
                "breed_whispers": {
                    "pug": "Climate-controlled transport for sensitive breeds",
                    "default": "Fast, safe transport when every minute counts"
                }
            },
            {
                "id": "svc-emergency-first-aid",
                "name": "Pet First Aid Course",
                "description": "Learn to handle pet emergencies at home",
                "base_price": 1999,
                "duration": "3 hours",
                "is_bookable": True,
                "includes": ["CPR training", "Wound care", "Choking response", "Certificate"],
                "breed_whispers": {
                    "pug": "Special focus on brachycephalic emergency care",
                    "default": "Be prepared to save your pet's life"
                }
            }
        ]
    },
    "farewell": {
        "pillar_name": "Farewell",
        "icon": "🌈",
        "services": [
            {
                "id": "svc-farewell-cremation",
                "name": "Dignified Cremation",
                "description": "Respectful cremation with ashes return",
                "base_price": 2999,
                "is_bookable": True,
                "requires_consultation": True,
                "includes": ["Home pickup", "Individual cremation", "Urn selection", "Ashes return"],
                "breed_whispers": {
                    "default": "A dignified farewell for your beloved companion"
                }
            },
            {
                "id": "svc-farewell-memorial",
                "name": "Memorial Service",
                "description": "Beautiful ceremony to celebrate their life",
                "base_price": 4999,
                "is_bookable": True,
                "includes": ["Memorial ceremony", "Photo display", "Memory sharing", "Keepsake"],
                "breed_whispers": {
                    "default": "Honor the love you shared together"
                }
            },
            {
                "id": "svc-farewell-grief",
                "name": "Pet Loss Support",
                "description": "Counseling support during difficult times",
                "base_price": 0,
                "is_free": True,
                "is_bookable": True,
                "includes": ["Grief counseling", "Support group access", "Resource materials"],
                "breed_whispers": {
                    "default": "We're here for you during this difficult time"
                }
            }
        ]
    },
    "adopt": {
        "pillar_name": "Adopt",
        "icon": "🐾",
        "services": [
            {
                "id": "svc-adopt-match",
                "name": "Pet Matching Service",
                "description": "Find your perfect pet match based on lifestyle",
                "base_price": 0,
                "is_free": True,
                "is_bookable": True,
                "includes": ["Lifestyle assessment", "Breed recommendations", "Shelter connections"],
                "breed_whispers": {
                    "default": "Find the perfect companion for your lifestyle"
                }
            },
            {
                "id": "svc-adopt-counseling",
                "name": "Adoption Counseling",
                "description": "Expert guidance through the adoption process",
                "base_price": 499,
                "duration": "60 mins",
                "is_bookable": True,
                "includes": ["Process walkthrough", "Question answering", "Post-adoption support"],
                "breed_whispers": {
                    "default": "Make an informed, confident adoption decision"
                }
            },
            {
                "id": "svc-adopt-home-check",
                "name": "Home Readiness Check",
                "description": "Ensure your home is ready for your new pet",
                "base_price": 799,
                "duration": "90 mins",
                "is_bookable": True,
                "includes": ["Home visit", "Safety check", "Setup recommendations"],
                "breed_whispers": {
                    "shih_tzu": "Small breed safety focus",
                    "golden_retriever": "Space requirements for active breeds",
                    "beagle": "Escape-proofing for adventurous breeds",
                    "default": "Prepare your home for your new family member"
                }
            },
            {
                "id": "svc-adopt-foster",
                "name": "Foster-to-Adopt Program",
                "description": "Trial period before permanent adoption",
                "base_price": 999,
                "duration": "2 weeks",
                "is_bookable": True,
                "includes": ["Trial period", "Supplies provided", "Support", "Final adoption"],
                "breed_whispers": {
                    "default": "Try before you commit to ensure the perfect match"
                }
            }
        ]
    },
    "paperwork": {
        "pillar_name": "Paperwork",
        "icon": "📄",
        "services": [
            {
                "id": "svc-paperwork-registration",
                "name": "Pet Registration Assistance",
                "description": "Help with municipal pet registration",
                "base_price": 499,
                "is_bookable": True,
                "includes": ["Form filling", "Document submission", "Follow-up"],
                "breed_whispers": {
                    "default": "Hassle-free compliance with local regulations"
                }
            },
            {
                "id": "svc-paperwork-microchip",
                "name": "Microchipping",
                "description": "Permanent ID chip for your pet's safety",
                "base_price": 799,
                "duration": "15 mins",
                "is_bookable": True,
                "includes": ["Microchip insertion", "Registration", "ID card"],
                "breed_whispers": {
                    "beagle": "Essential for escape-prone breeds like Beagles",
                    "default": "Peace of mind if your pet ever gets lost"
                }
            },
            {
                "id": "svc-paperwork-passport",
                "name": "Pet Passport Service",
                "description": "Complete documentation for international travel",
                "base_price": 2999,
                "is_bookable": True,
                "requires_consultation": True,
                "includes": ["Health certificates", "Vaccination records", "Travel documentation"],
                "breed_whispers": {
                    "pug": "Special documentation for restricted breed travel",
                    "default": "All papers in order for worry-free travel"
                }
            }
        ]
    }
}


async def seed_services_with_whispers(db):
    """Seed all services with breed-specific Mira whispers"""
    from datetime import datetime, timezone
    
    now = datetime.now(timezone.utc)
    total_created = 0
    total_updated = 0
    
    for pillar, pillar_data in MASTER_SERVICES_WITH_WHISPERS.items():
        for service in pillar_data["services"]:
            service_doc = {
                "id": service["id"],
                "name": service["name"],
                "pillar": pillar,
                "pillars": [pillar],  # Can be in multiple pillars
                "pillar_name": pillar_data["pillar_name"],
                "pillar_icon": pillar_data["icon"],
                "description": service.get("description", ""),
                
                # Pricing
                "base_price": service.get("base_price"),
                "duration": service.get("duration"),
                "duration_minutes": None,
                
                # Booking config
                "is_bookable": service.get("is_bookable", True),
                "requires_consultation": service.get("requires_consultation", False),
                "is_free": service.get("is_free", False),
                "is_24x7": service.get("is_24x7", False),
                
                # Content
                "includes": service.get("includes", []),
                "add_ons": service.get("add_ons", []),
                
                # BREED-SPECIFIC MIRA WHISPERS
                "breed_whispers": service.get("breed_whispers", {"default": "Curated for your companion"}),
                "mira_whisper": service.get("breed_whispers", {}).get("default", "Curated for your companion"),
                
                # Status
                "is_active": True,
                "updated_at": now
            }
            
            existing = await db.services_master.find_one({"id": service["id"]})
            
            if existing:
                await db.services_master.update_one(
                    {"id": service["id"]},
                    {"$set": {**service_doc, "created_at": existing.get("created_at", now)}}
                )
                total_updated += 1
            else:
                service_doc["created_at"] = now
                await db.services_master.insert_one(service_doc)
                total_created += 1
    
    return {"created": total_created, "updated": total_updated, "total": total_created + total_updated}


# For testing/running directly
if __name__ == "__main__":
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    
    async def main():
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(mongo_url)
        db = client["pawfect"]
        
        result = await seed_services_with_whispers(db)
        print(f"Seeding complete: {result}")
    
    asyncio.run(main())
