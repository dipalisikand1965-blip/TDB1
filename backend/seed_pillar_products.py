"""
Comprehensive Product Seeder for All Pillars
Seeds products and bundles for: Fit, Learn, Advisory, Paperwork, Emergency, Adopt, Farewell, Insure, Community, Groom
"""

import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


# ============= FIT PILLAR PRODUCTS =============
FIT_PRODUCTS = [
    {
        "id": f"fit-{uuid.uuid4().hex[:8]}",
        "name": "Personal Fitness Assessment",
        "description": "Comprehensive fitness evaluation for your pet including body condition score, mobility check, and personalised exercise plan",
        "price": 1499,
        "category": "fitness_assessment",
        "pillar": "fit",
        "image": "https://images.unsplash.com/photo-1676729274491-579573327bd0?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["fitness", "assessment", "health"]
    },
    {
        "id": f"fit-{uuid.uuid4().hex[:8]}",
        "name": "Weight Management Programme",
        "description": "12-week structured weight management plan with nutritionist support and progress tracking",
        "price": 3999,
        "category": "weight_management",
        "pillar": "fit",
        "image": "https://images.unsplash.com/photo-1546815693-7533bae19894?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["weight", "nutrition", "programme"]
    },
    {
        "id": f"fit-{uuid.uuid4().hex[:8]}",
        "name": "Agility Training Sessions (4 Pack)",
        "description": "Fun agility training sessions to improve coordination, confidence and fitness",
        "price": 2499,
        "category": "exercise_plan",
        "pillar": "fit",
        "image": "https://images.pexels.com/photos/6089707/pexels-photo-6089707.jpeg?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["agility", "training", "exercise"]
    },
    {
        "id": f"fit-{uuid.uuid4().hex[:8]}",
        "name": "Swimming Therapy Session",
        "description": "Low-impact aquatic exercise perfect for senior pets or those recovering from injury",
        "price": 1299,
        "category": "exercise_plan",
        "pillar": "fit",
        "image": "https://images.unsplash.com/photo-1676729274562-1dad4383f550?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["swimming", "therapy", "low-impact"]
    },
    {
        "id": f"fit-{uuid.uuid4().hex[:8]}",
        "name": "Daily Walk & Exercise Package",
        "description": "30-day package of daily structured walks with exercise intervals",
        "price": 5999,
        "category": "exercise_plan",
        "pillar": "fit",
        "image": "https://images.pexels.com/photos/31359169/pexels-photo-31359169.jpeg?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["walking", "daily", "routine"]
    },
]

# ============= LEARN PILLAR PRODUCTS =============
LEARN_PRODUCTS = [
    {
        "id": f"learn-{uuid.uuid4().hex[:8]}",
        "name": "Puppy Foundation Course",
        "description": "Essential training for puppies 8-16 weeks covering socialisation, basic commands, and house training",
        "price": 4999,
        "category": "puppy_training",
        "pillar": "learn",
        "image": "https://images.unsplash.com/photo-1759914915132-9878a4c702e6?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["puppy", "foundation", "socialisation"]
    },
    {
        "id": f"learn-{uuid.uuid4().hex[:8]}",
        "name": "Basic Obedience Training (8 Sessions)",
        "description": "Master sit, stay, come, heel, and leash walking with certified trainers",
        "price": 6999,
        "category": "basic_obedience",
        "pillar": "learn",
        "image": "https://images.unsplash.com/photo-1707595114464-f7e953d5f3bb?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["obedience", "commands", "training"]
    },
    {
        "id": f"learn-{uuid.uuid4().hex[:8]}",
        "name": "Behaviour Modification Programme",
        "description": "Address specific behavioural issues like aggression, anxiety, or excessive barking",
        "price": 8999,
        "category": "behavior_modification",
        "pillar": "learn",
        "image": "https://images.pexels.com/photos/6568478/pexels-photo-6568478.jpeg?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["behaviour", "modification", "anxiety"]
    },
    {
        "id": f"learn-{uuid.uuid4().hex[:8]}",
        "name": "Advanced Tricks & Commands",
        "description": "Fun advanced training including tricks, off-leash reliability, and complex commands",
        "price": 5499,
        "category": "advanced_training",
        "pillar": "learn",
        "image": "https://images.unsplash.com/photo-1764377720157-b10acb5c32a9?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["advanced", "tricks", "off-leash"]
    },
    {
        "id": f"learn-{uuid.uuid4().hex[:8]}",
        "name": "Private In-Home Training Session",
        "description": "One-on-one training session at your home for personalised attention",
        "price": 2499,
        "category": "basic_obedience",
        "pillar": "learn",
        "image": "https://images.pexels.com/photos/10013055/pexels-photo-10013055.jpeg?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["private", "in-home", "personalised"]
    },
]

# ============= GROOM PILLAR PRODUCTS =============
GROOM_PRODUCTS = [
    {
        "id": f"groom-{uuid.uuid4().hex[:8]}",
        "name": "Full Grooming Package",
        "description": "Complete grooming including bath, haircut, nail trim, ear cleaning, and teeth brushing",
        "price": 1999,
        "category": "full_grooming",
        "pillar": "groom",
        "image": "https://images.pexels.com/photos/6816850/pexels-photo-6816850.jpeg?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["grooming", "bath", "haircut"]
    },
    {
        "id": f"groom-{uuid.uuid4().hex[:8]}",
        "name": "Spa Bath & Pamper Session",
        "description": "Luxury spa experience with aromatherapy bath, massage, and premium conditioning",
        "price": 2499,
        "category": "spa_bath",
        "pillar": "groom",
        "image": "https://images.unsplash.com/photo-1611173622933-91942d394b04?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["spa", "pamper", "luxury"]
    },
    {
        "id": f"groom-{uuid.uuid4().hex[:8]}",
        "name": "Nail Trim & Paw Care",
        "description": "Professional nail trimming with paw pad moisturising treatment",
        "price": 499,
        "category": "nail_care",
        "pillar": "groom",
        "image": "https://images.unsplash.com/photo-1657552253868-1832eb7e5228?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["nails", "paws", "care"]
    },
    {
        "id": f"groom-{uuid.uuid4().hex[:8]}",
        "name": "De-shedding Treatment",
        "description": "Specialised treatment to reduce shedding by up to 80% using premium products",
        "price": 1499,
        "category": "de_shedding",
        "pillar": "groom",
        "image": "https://images.pexels.com/photos/6130997/pexels-photo-6130997.jpeg?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["deshedding", "coat", "treatment"]
    },
    {
        "id": f"groom-{uuid.uuid4().hex[:8]}",
        "name": "Breed-Specific Styling",
        "description": "Expert breed-standard styling by certified groomers familiar with your breed",
        "price": 2999,
        "category": "styling",
        "pillar": "groom",
        "image": "https://images.unsplash.com/photo-1736849807143-a7826aedf2f1?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["breed", "styling", "expert"]
    },
]

# ============= ADVISORY PILLAR PRODUCTS =============
ADVISORY_PRODUCTS = [
    {
        "id": f"advisory-{uuid.uuid4().hex[:8]}",
        "name": "Behaviour Consultation",
        "description": "60-minute consultation with certified animal behaviourist to address concerns",
        "price": 2999,
        "category": "behaviour",
        "pillar": "advisory",
        "image": "https://images.pexels.com/photos/6235650/pexels-photo-6235650.jpeg?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["behaviour", "consultation", "expert"]
    },
    {
        "id": f"advisory-{uuid.uuid4().hex[:8]}",
        "name": "Nutrition Planning Session",
        "description": "Personalised nutrition plan developed by veterinary nutritionist",
        "price": 1999,
        "category": "nutrition",
        "pillar": "advisory",
        "image": "https://images.unsplash.com/photo-1692906456160-385d805be646?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["nutrition", "diet", "planning"]
    },
    {
        "id": f"advisory-{uuid.uuid4().hex[:8]}",
        "name": "Senior Pet Care Consultation",
        "description": "Comprehensive guidance for caring for your ageing pet with comfort and dignity",
        "price": 1499,
        "category": "senior_care",
        "pillar": "advisory",
        "image": "https://images.pexels.com/photos/7470635/pexels-photo-7470635.jpeg?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["senior", "ageing", "care"]
    },
    {
        "id": f"advisory-{uuid.uuid4().hex[:8]}",
        "name": "New Pet Parent Coaching",
        "description": "One-on-one coaching for new pet parents covering everything from feeding to training",
        "price": 2499,
        "category": "coaching",
        "pillar": "advisory",
        "image": "https://images.unsplash.com/photo-1713764054247-3685535a0221?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["new-parent", "coaching", "guidance"]
    },
    {
        "id": f"advisory-{uuid.uuid4().hex[:8]}",
        "name": "Breed Selection Guidance",
        "description": "Expert advice to help you choose the perfect breed for your lifestyle",
        "price": 999,
        "category": "breed_selection",
        "pillar": "advisory",
        "image": "https://images.unsplash.com/photo-1563460716037-460a3ad24ba9?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["breed", "selection", "advice"]
    },
]

# ============= PAPERWORK PILLAR PRODUCTS =============
PAPERWORK_PRODUCTS = [
    {
        "id": f"paperwork-{uuid.uuid4().hex[:8]}",
        "name": "Pet Passport Application Service",
        "description": "Complete assistance with pet passport application including documentation and vet coordination",
        "price": 3999,
        "category": "travel",
        "pillar": "paperwork",
        "image": "https://images.unsplash.com/photo-1639034741369-1e0c771adaeb?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["passport", "travel", "documentation"]
    },
    {
        "id": f"paperwork-{uuid.uuid4().hex[:8]}",
        "name": "KCI Registration Assistance",
        "description": "Help with Kennel Club of India registration including pedigree verification",
        "price": 2499,
        "category": "identity",
        "pillar": "paperwork",
        "image": "https://images.unsplash.com/photo-1613244470181-e4ff087b4a24?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["KCI", "registration", "pedigree"]
    },
    {
        "id": f"paperwork-{uuid.uuid4().hex[:8]}",
        "name": "Medical Records Digitisation",
        "description": "Convert all physical medical records to secure digital format with cloud backup",
        "price": 999,
        "category": "medical",
        "pillar": "paperwork",
        "image": "https://images.pexels.com/photos/6815936/pexels-photo-6815936.jpeg?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["medical", "digital", "records"]
    },
    {
        "id": f"paperwork-{uuid.uuid4().hex[:8]}",
        "name": "Import/Export Documentation",
        "description": "Complete documentation assistance for international pet relocation",
        "price": 7999,
        "category": "travel",
        "pillar": "paperwork",
        "image": "https://images.unsplash.com/photo-1654163600175-efc47ce20b29?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["import", "export", "relocation"]
    },
    {
        "id": f"paperwork-{uuid.uuid4().hex[:8]}",
        "name": "Microchip Registration",
        "description": "Professional microchip implantation with national database registration",
        "price": 1499,
        "category": "identity",
        "pillar": "paperwork",
        "image": "https://images.pexels.com/photos/6815940/pexels-photo-6815940.jpeg?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["microchip", "registration", "identity"]
    },
]

# ============= EMERGENCY PILLAR PRODUCTS =============
EMERGENCY_PRODUCTS = [
    {
        "id": f"emergency-{uuid.uuid4().hex[:8]}",
        "name": "Pet First Aid Kit - Premium",
        "description": "Comprehensive first aid kit with bandages, antiseptic, thermometer, and emergency guide",
        "price": 1999,
        "category": "first_aid",
        "pillar": "emergency",
        "image": "https://images.unsplash.com/photo-1563260324-5ebeedc8af7c?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["first-aid", "kit", "emergency"]
    },
    {
        "id": f"emergency-{uuid.uuid4().hex[:8]}",
        "name": "24/7 Emergency Helpline Subscription",
        "description": "Annual subscription to 24/7 veterinary emergency helpline with instant advice",
        "price": 2999,
        "category": "helpline",
        "pillar": "emergency",
        "image": "https://images.unsplash.com/photo-1661552066736-935e0cad1782?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["helpline", "24/7", "veterinary"]
    },
    {
        "id": f"emergency-{uuid.uuid4().hex[:8]}",
        "name": "Emergency Transport Service",
        "description": "On-demand emergency pet ambulance service to nearest veterinary facility",
        "price": 1499,
        "category": "transport",
        "pillar": "emergency",
        "image": "https://images.unsplash.com/photo-1564144573017-8dc932e0039e?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["ambulance", "transport", "emergency"]
    },
    {
        "id": f"emergency-{uuid.uuid4().hex[:8]}",
        "name": "Lost Pet Alert Service",
        "description": "Instant alert broadcast to local community, shelters, and veterinary clinics",
        "price": 999,
        "category": "lost_pet",
        "pillar": "emergency",
        "image": "https://images.pexels.com/photos/5673523/pexels-photo-5673523.jpeg?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["lost", "alert", "community"]
    },
    {
        "id": f"emergency-{uuid.uuid4().hex[:8]}",
        "name": "First Aid Training Course",
        "description": "Learn essential pet first aid skills from certified professionals",
        "price": 3499,
        "category": "training",
        "pillar": "emergency",
        "image": "https://images.unsplash.com/photo-1643227991784-fabfe0cf4470?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["training", "first-aid", "course"]
    },
]

# ============= ADOPT PILLAR PRODUCTS =============
ADOPT_PRODUCTS = [
    {
        "id": f"adopt-{uuid.uuid4().hex[:8]}",
        "name": "Adoption Application Processing",
        "description": "Complete adoption application processing with background checks and home visit",
        "price": 499,
        "category": "adoption_process",
        "pillar": "adopt",
        "image": "https://images.unsplash.com/photo-1593991910463-03658d3de800?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["adoption", "application", "processing"]
    },
    {
        "id": f"adopt-{uuid.uuid4().hex[:8]}",
        "name": "Foster Parent Starter Kit",
        "description": "Everything you need to start fostering including supplies, guide, and support",
        "price": 2999,
        "category": "foster",
        "pillar": "adopt",
        "image": "https://images.unsplash.com/photo-1720705313994-12cd7930da3c?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["foster", "starter", "kit"]
    },
    {
        "id": f"adopt-{uuid.uuid4().hex[:8]}",
        "name": "New Pet Welcome Package",
        "description": "Essential supplies for your newly adopted pet including food, bed, and toys",
        "price": 3499,
        "category": "adoption_package",
        "pillar": "adopt",
        "image": "https://images.unsplash.com/photo-1721227319522-553452acea54?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["welcome", "essentials", "adopted"]
    },
    {
        "id": f"adopt-{uuid.uuid4().hex[:8]}",
        "name": "Adoption Counselling Session",
        "description": "Expert guidance to help you find the perfect pet match for your family",
        "price": 999,
        "category": "counselling",
        "pillar": "adopt",
        "image": "https://images.unsplash.com/photo-1593991910379-b414c1e3bd74?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["counselling", "matching", "guidance"]
    },
    {
        "id": f"adopt-{uuid.uuid4().hex[:8]}",
        "name": "Shelter Support Donation",
        "description": "Direct donation to partner shelters to support rescued animals",
        "price": 500,
        "category": "donation",
        "pillar": "adopt",
        "image": "https://images.pexels.com/photos/16465591/pexels-photo-16465591.jpeg?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["donation", "shelter", "support"]
    },
]

# ============= FAREWELL PILLAR PRODUCTS =============
FAREWELL_PRODUCTS = [
    {
        "id": f"farewell-{uuid.uuid4().hex[:8]}",
        "name": "Private Cremation Service",
        "description": "Dignified private cremation with ashes returned in an elegant urn",
        "price": 4999,
        "category": "cremation",
        "pillar": "farewell",
        "image": "https://images.unsplash.com/photo-1732870013417-9a76a854c646?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["cremation", "private", "dignified"]
    },
    {
        "id": f"farewell-{uuid.uuid4().hex[:8]}",
        "name": "Memorial Keepsake Box",
        "description": "Beautiful handcrafted box to store precious memories of your beloved pet",
        "price": 1999,
        "category": "memorial",
        "pillar": "farewell",
        "image": "https://images.pexels.com/photos/8556118/pexels-photo-8556118.jpeg?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["memorial", "keepsake", "memories"]
    },
    {
        "id": f"farewell-{uuid.uuid4().hex[:8]}",
        "name": "Rainbow Bridge Ceremony",
        "description": "Touching farewell ceremony with readings and memorial moment",
        "price": 2499,
        "category": "ceremony",
        "pillar": "farewell",
        "image": "https://images.unsplash.com/photo-1661166849809-28e10e74b75b?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["ceremony", "rainbow-bridge", "farewell"]
    },
    {
        "id": f"farewell-{uuid.uuid4().hex[:8]}",
        "name": "Grief Support Counselling",
        "description": "Professional pet loss counselling to help you through this difficult time",
        "price": 1499,
        "category": "grief_support",
        "pillar": "farewell",
        "image": "https://images.pexels.com/photos/5766435/pexels-photo-5766435.jpeg?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["grief", "counselling", "support"]
    },
    {
        "id": f"farewell-{uuid.uuid4().hex[:8]}",
        "name": "Paw Print Memorial",
        "description": "Professional clay paw print impression as a lasting tribute",
        "price": 999,
        "category": "memorial",
        "pillar": "farewell",
        "image": "https://images.unsplash.com/photo-1514569794956-45786fee478d?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["pawprint", "memorial", "tribute"]
    },
]

# ============= INSURE PILLAR PRODUCTS =============
INSURE_PRODUCTS = [
    {
        "id": f"insure-{uuid.uuid4().hex[:8]}",
        "name": "Basic Health Coverage",
        "description": "Essential health insurance covering accidents and basic illnesses",
        "price": 2999,
        "category": "health_coverage",
        "pillar": "insure",
        "image": "https://images.unsplash.com/photo-1563460716037-460a3ad24ba9?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["insurance", "health", "basic"]
    },
    {
        "id": f"insure-{uuid.uuid4().hex[:8]}",
        "name": "Comprehensive Pet Insurance",
        "description": "Full coverage including accidents, illness, surgeries, and preventive care",
        "price": 5999,
        "category": "comprehensive",
        "pillar": "insure",
        "image": "https://images.pexels.com/photos/7736039/pexels-photo-7736039.jpeg?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["insurance", "comprehensive", "full-coverage"]
    },
    {
        "id": f"insure-{uuid.uuid4().hex[:8]}",
        "name": "Senior Pet Insurance",
        "description": "Specialised coverage for pets over 7 years with pre-existing condition options",
        "price": 4499,
        "category": "senior_coverage",
        "pillar": "insure",
        "image": "https://images.unsplash.com/photo-1567615875328-a8c598685688?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["senior", "insurance", "pre-existing"]
    },
    {
        "id": f"insure-{uuid.uuid4().hex[:8]}",
        "name": "Wellness Add-On",
        "description": "Add preventive care coverage including vaccinations and annual check-ups",
        "price": 1499,
        "category": "wellness",
        "pillar": "insure",
        "image": "https://images.pexels.com/photos/7731333/pexels-photo-7731333.jpeg?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["wellness", "preventive", "vaccinations"]
    },
    {
        "id": f"insure-{uuid.uuid4().hex[:8]}",
        "name": "Travel Insurance for Pets",
        "description": "Coverage for pets during domestic and international travel",
        "price": 999,
        "category": "travel_insurance",
        "pillar": "insure",
        "image": "https://images.unsplash.com/photo-1768903430440-e97bc1069622?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["travel", "insurance", "international"]
    },
]

# ============= COMMUNITY PILLAR PRODUCTS =============
COMMUNITY_PRODUCTS = [
    {
        "id": f"community-{uuid.uuid4().hex[:8]}",
        "name": "Dog Park Meetup Pass (Monthly)",
        "description": "Monthly pass for organised dog park meetups with socialisation activities",
        "price": 999,
        "category": "meetups",
        "pillar": "community",
        "image": "https://images.unsplash.com/photo-1758426157062-3622db44ecd6?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["meetup", "park", "social"]
    },
    {
        "id": f"community-{uuid.uuid4().hex[:8]}",
        "name": "Pet Parent Social Club Membership",
        "description": "Annual membership to exclusive pet parent community with events and networking",
        "price": 2499,
        "category": "membership",
        "pillar": "community",
        "image": "https://images.pexels.com/photos/11733510/pexels-photo-11733510.jpeg?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["club", "membership", "networking"]
    },
    {
        "id": f"community-{uuid.uuid4().hex[:8]}",
        "name": "Breed-Specific Playdate",
        "description": "Organised playdate with dogs of the same breed for specialised socialisation",
        "price": 499,
        "category": "playdates",
        "pillar": "community",
        "image": "https://images.pexels.com/photos/33728364/pexels-photo-33728364.jpeg?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["breed", "playdate", "socialisation"]
    },
    {
        "id": f"community-{uuid.uuid4().hex[:8]}",
        "name": "Pet-Friendly Event Ticket",
        "description": "Entry to premium pet-friendly events including festivals and exhibitions",
        "price": 799,
        "category": "events",
        "pillar": "community",
        "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
        "in_stock": True,
        "featured": True,
        "tags": ["event", "festival", "exhibition"]
    },
    {
        "id": f"community-{uuid.uuid4().hex[:8]}",
        "name": "Pet Photography Meetup",
        "description": "Join other pet parents for a fun photo session with professional photographer",
        "price": 1499,
        "category": "photo_meetup",
        "pillar": "community",
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
        "in_stock": True,
        "featured": False,
        "tags": ["photography", "meetup", "memories"]
    },
]


# ============= BUNDLES =============
PILLAR_BUNDLES = [
    # FIT BUNDLES
    {
        "id": "bundle-fit-transformation",
        "name": "Complete Fitness Transformation",
        "description": "12-week programme combining assessment, weight management, and exercise sessions",
        "pillar": "fit",
        "bundle_price": 8999,
        "original_price": 12000,
        "category": "fitness_bundle",
        "items": ["Personal Fitness Assessment", "Weight Management Programme", "Agility Training Sessions (4 Pack)"],
        "discount_percent": 25,
        "featured": True,
        "active": True,
        "image": "https://images.unsplash.com/photo-1676729274491-579573327bd0?w=800",
        "tags": ["fitness", "transformation", "bundle"]
    },
    # LEARN BUNDLES
    {
        "id": "bundle-learn-puppy-starter",
        "name": "Puppy Learning Journey",
        "description": "Complete puppy training from foundation through basic obedience",
        "pillar": "learn",
        "bundle_price": 9999,
        "original_price": 12500,
        "category": "training_bundle",
        "items": ["Puppy Foundation Course", "Basic Obedience Training (8 Sessions)"],
        "discount_percent": 20,
        "featured": True,
        "active": True,
        "image": "https://images.unsplash.com/photo-1707595114464-f7e953d5f3bb?w=800",
        "tags": ["puppy", "training", "bundle"]
    },
    # GROOM BUNDLES
    {
        "id": "bundle-groom-pamper-day",
        "name": "Ultimate Pamper Day",
        "description": "Full day of pampering including spa bath, full grooming, and de-shedding",
        "pillar": "groom",
        "bundle_price": 4499,
        "original_price": 6000,
        "category": "grooming_bundle",
        "items": ["Full Grooming Package", "Spa Bath & Pamper Session", "De-shedding Treatment"],
        "discount_percent": 25,
        "featured": True,
        "active": True,
        "image": "https://images.unsplash.com/photo-1611173622933-91942d394b04?w=800",
        "tags": ["grooming", "pamper", "bundle"]
    },
    # ADVISORY BUNDLES
    {
        "id": "bundle-advisory-new-parent",
        "name": "New Pet Parent Essentials",
        "description": "Everything new pet parents need including coaching, nutrition, and behaviour guidance",
        "pillar": "advisory",
        "bundle_price": 4999,
        "original_price": 6500,
        "category": "advisory_bundle",
        "items": ["New Pet Parent Coaching", "Nutrition Planning Session", "Breed Selection Guidance"],
        "discount_percent": 23,
        "featured": True,
        "active": True,
        "image": "https://images.pexels.com/photos/6235650/pexels-photo-6235650.jpeg?w=800",
        "tags": ["advisory", "new-parent", "bundle"]
    },
    # PAPERWORK BUNDLES
    {
        "id": "bundle-paperwork-travel-ready",
        "name": "Travel Ready Package",
        "description": "Complete documentation for domestic and international pet travel",
        "pillar": "paperwork",
        "bundle_price": 9999,
        "original_price": 13000,
        "category": "paperwork_bundle",
        "items": ["Pet Passport Application Service", "Import/Export Documentation", "Medical Records Digitisation"],
        "discount_percent": 23,
        "featured": True,
        "active": True,
        "image": "https://images.unsplash.com/photo-1639034741369-1e0c771adaeb?w=800",
        "tags": ["travel", "paperwork", "bundle"]
    },
    # EMERGENCY BUNDLES
    {
        "id": "bundle-emergency-peace-of-mind",
        "name": "Peace of Mind Package",
        "description": "Complete emergency preparedness including first aid kit, helpline, and training",
        "pillar": "emergency",
        "bundle_price": 6999,
        "original_price": 8500,
        "category": "emergency_bundle",
        "items": ["Pet First Aid Kit - Premium", "24/7 Emergency Helpline Subscription", "First Aid Training Course"],
        "discount_percent": 18,
        "featured": True,
        "active": True,
        "image": "https://images.unsplash.com/photo-1563260324-5ebeedc8af7c?w=800",
        "tags": ["emergency", "safety", "bundle"]
    },
    # ADOPT BUNDLES
    {
        "id": "bundle-adopt-new-family",
        "name": "New Family Member Package",
        "description": "Everything you need when adopting including processing, welcome kit, and counselling",
        "pillar": "adopt",
        "bundle_price": 5999,
        "original_price": 7500,
        "category": "adoption_bundle",
        "items": ["Adoption Application Processing", "New Pet Welcome Package", "Adoption Counselling Session"],
        "discount_percent": 20,
        "featured": True,
        "active": True,
        "image": "https://images.unsplash.com/photo-1593991910463-03658d3de800?w=800",
        "tags": ["adoption", "welcome", "bundle"]
    },
    # FAREWELL BUNDLES
    {
        "id": "bundle-farewell-complete",
        "name": "Complete Memorial Package",
        "description": "Dignified farewell with cremation, ceremony, keepsake, and grief support",
        "pillar": "farewell",
        "bundle_price": 8999,
        "original_price": 11000,
        "category": "farewell_bundle",
        "items": ["Private Cremation Service", "Rainbow Bridge Ceremony", "Memorial Keepsake Box", "Grief Support Counselling"],
        "discount_percent": 18,
        "featured": True,
        "active": True,
        "image": "https://images.unsplash.com/photo-1732870013417-9a76a854c646?w=800",
        "tags": ["farewell", "memorial", "bundle"]
    },
    # INSURE BUNDLES
    {
        "id": "bundle-insure-complete-protection",
        "name": "Complete Protection Plan",
        "description": "Full insurance coverage with wellness add-on and travel protection",
        "pillar": "insure",
        "bundle_price": 7499,
        "original_price": 9500,
        "category": "insurance_bundle",
        "items": ["Comprehensive Pet Insurance", "Wellness Add-On", "Travel Insurance for Pets"],
        "discount_percent": 21,
        "featured": True,
        "active": True,
        "image": "https://images.pexels.com/photos/7736039/pexels-photo-7736039.jpeg?w=800",
        "tags": ["insurance", "protection", "bundle"]
    },
    # COMMUNITY BUNDLES
    {
        "id": "bundle-community-social-butterfly",
        "name": "Social Butterfly Package",
        "description": "Full year of socialisation with club membership, meetups, and events",
        "pillar": "community",
        "bundle_price": 4999,
        "original_price": 6300,
        "category": "community_bundle",
        "items": ["Pet Parent Social Club Membership", "Dog Park Meetup Pass (Monthly)", "Pet-Friendly Event Ticket"],
        "discount_percent": 21,
        "featured": True,
        "active": True,
        "image": "https://images.unsplash.com/photo-1758426157062-3622db44ecd6?w=800",
        "tags": ["community", "social", "bundle"]
    },
]


async def seed_pillar_products():
    """Seed products and bundles for all pillars"""
    print("=" * 60)
    print("SEEDING PRODUCTS FOR ALL REMAINING PILLARS")
    print("=" * 60)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    now = datetime.now(timezone.utc).isoformat()
    
    try:
        # Combine all products
        all_products = (
            FIT_PRODUCTS + LEARN_PRODUCTS + GROOM_PRODUCTS + 
            ADVISORY_PRODUCTS + PAPERWORK_PRODUCTS + EMERGENCY_PRODUCTS +
            ADOPT_PRODUCTS + FAREWELL_PRODUCTS + INSURE_PRODUCTS + COMMUNITY_PRODUCTS
        )
        
        # 1. Seed to pillar-specific collections
        pillar_collections = {
            "fit": FIT_PRODUCTS,
            "learn": LEARN_PRODUCTS,
            "groom": GROOM_PRODUCTS,
            "advisory": ADVISORY_PRODUCTS,
            "paperwork": PAPERWORK_PRODUCTS,
            "emergency": EMERGENCY_PRODUCTS,
            "adopt": ADOPT_PRODUCTS,
            "farewell": FAREWELL_PRODUCTS,
            "insure": INSURE_PRODUCTS,
            "community": COMMUNITY_PRODUCTS,
        }
        
        for pillar, products in pillar_collections.items():
            coll_name = f"{pillar}_products"
            print(f"\n🏷️ Seeding {pillar.upper()} products to {coll_name}...")
            
            # Check existing count before deleting
            existing = await db[coll_name].count_documents({})
            print(f"   Existing: {existing} products")
            
            # Add timestamps and insert
            for p in products:
                p["created_at"] = now
                p["updated_at"] = now
            
            # Only delete our new products (keep existing if any)
            ids_to_add = [p["id"] for p in products]
            await db[coll_name].delete_many({"id": {"$in": ids_to_add}})
            
            result = await db[coll_name].insert_many(products)
            print(f"   ✅ Seeded {len(result.inserted_ids)} new products")
        
        # 2. Sync all to unified_products
        print("\n📦 Syncing all products to unified_products...")
        
        for product in all_products:
            unified_doc = {
                **product,
                "product_type": "service",
                "source": f"{product['pillar']}_products",
                "synced_at": now,
                "pass_eligible": "both",
            }
            
            await db.unified_products.update_one(
                {"id": product["id"]},
                {"$set": unified_doc},
                upsert=True
            )
        
        print(f"   ✅ Synced {len(all_products)} products to unified_products")
        
        # 3. Seed bundles
        print("\n🎁 Seeding bundles...")
        
        for bundle in PILLAR_BUNDLES:
            bundle["created_at"] = now
            bundle["updated_at"] = now
            
            # Add to bundles collection
            await db.bundles.update_one(
                {"id": bundle["id"]},
                {"$set": bundle},
                upsert=True
            )
            
            # Also add to unified_products as bundle
            unified_bundle = {
                **bundle,
                "name": bundle["name"],
                "price": bundle["bundle_price"],
                "product_type": "bundle",
                "source": "bundles",
                "synced_at": now,
            }
            
            await db.unified_products.update_one(
                {"id": bundle["id"]},
                {"$set": unified_bundle},
                upsert=True
            )
        
        print(f"   ✅ Seeded {len(PILLAR_BUNDLES)} bundles")
        
        # 4. Print final counts
        print("\n" + "=" * 60)
        print("FINAL COLLECTION COUNTS:")
        print("=" * 60)
        
        for pillar in pillar_collections.keys():
            coll_name = f"{pillar}_products"
            count = await db[coll_name].count_documents({})
            print(f"   {coll_name}: {count}")
        
        bundles_count = await db.bundles.count_documents({})
        print(f"   bundles: {bundles_count}")
        
        unified_count = await db.unified_products.count_documents({})
        print(f"   unified_products: {unified_count}")
        
        print("\n✅ All pillar products and bundles seeded successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_pillar_products())
