"""
Master Service Seeder
Seeds all services from the master list, merging with existing services
Connects to unified service flow and Pet Soul enrichment
"""

import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# ==================== MASTER SERVICE LIST ====================
# Based on "Your Pet's Life, Thoughtfully Orchestrated"

MASTER_SERVICES = {
    "celebrate": {
        "pillar_name": "Celebrate",
        "icon": "🎂",
        "services": [
            {
                "id": "SVC-CELEB-BDAY-HOME",
                "name": "Birthday Party - Home",
                "description": "Complete birthday planning and execution at your home",
                "is_bookable": True,
                "base_price": 5000,
                "duration_minutes": 180,
                "includes": ["Theme decoration", "Pet-safe cake", "Party games", "Photographer coordination"],
                "add_ons": [
                    {"id": "ADDON-CAKE-CUSTOM", "name": "Custom Cake Design", "price": 1500},
                    {"id": "ADDON-PHOTO", "name": "Professional Photoshoot", "price": 2500},
                    {"id": "ADDON-GUESTS", "name": "Extra Pet Guests (per pet)", "price": 500}
                ]
            },
            {
                "id": "SVC-CELEB-BDAY-VENUE",
                "name": "Birthday Party - Venue",
                "description": "Birthday celebration at a pet-friendly venue",
                "is_bookable": True,
                "base_price": 8000,
                "duration_minutes": 240,
                "includes": ["Venue booking", "Full decoration", "Catering", "Entertainment"]
            },
            {
                "id": "SVC-CELEB-GOTCHA",
                "name": "Gotcha Day Celebration",
                "description": "Celebrate your pet's adoption anniversary",
                "is_bookable": True,
                "base_price": 3000,
                "duration_minutes": 120
            },
            {
                "id": "SVC-CELEB-MILESTONE",
                "name": "Milestone Celebration",
                "description": "First travel, senior years, recovery milestones",
                "is_bookable": False,
                "base_price": None,
                "requires_consultation": True
            },
            {
                "id": "SVC-CELEB-FESTIVE",
                "name": "Festive Celebration Planning",
                "description": "Diwali, Christmas, Holi celebrations with your pet",
                "is_bookable": True,
                "base_price": 4000,
                "duration_minutes": 180
            },
            {
                "id": "SVC-CELEB-SURPRISE",
                "name": "Surprise Coordination",
                "description": "Surprise party or gift coordination for pet parents",
                "is_bookable": False,
                "base_price": None,
                "requires_consultation": True
            },
            {
                "id": "SVC-CELEB-REMINDERS",
                "name": "Life Moment Tracking",
                "description": "Automated reminders for birthdays, gotcha days, milestones",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True,
                "subscription_type": "included"
            }
        ]
    },
    
    "dine": {
        "pillar_name": "Dine",
        "icon": "🍽️",
        "services": [
            {
                "id": "SVC-DINE-DISCOVER",
                "name": "Pet-Friendly Restaurant Discovery",
                "description": "Find the perfect restaurant that welcomes your pet",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True
            },
            {
                "id": "SVC-DINE-RESERVE",
                "name": "Reservation Assistance",
                "description": "We confirm pet acceptance and make the reservation",
                "is_bookable": True,
                "base_price": 200,
                "duration_minutes": 30
            },
            {
                "id": "SVC-DINE-ETIQUETTE",
                "name": "Dining Etiquette Guidance",
                "description": "Tips and training for dining out with your pet",
                "is_bookable": True,
                "base_price": 500,
                "duration_minutes": 60
            },
            {
                "id": "SVC-DINE-ADVISORY",
                "name": "Venue Suitability Advisory",
                "description": "Breed and size suitability check for venues",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True
            },
            {
                "id": "SVC-DINE-BACKUP",
                "name": "Backup Dining Alternatives",
                "description": "Alternative options if plans change last minute",
                "is_bookable": False,
                "requires_consultation": True
            }
        ]
    },
    
    "stay": {
        "pillar_name": "Stay",
        "icon": "🏨",
        "services": [
            {
                "id": "SVC-STAY-DISCOVER",
                "name": "Pet-Friendly Hotel Discovery",
                "description": "Find hotels and resorts that welcome your pet",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True
            },
            {
                "id": "SVC-STAY-VERIFY",
                "name": "Property Rule Verification",
                "description": "Verify breed, size, and number restrictions",
                "is_bookable": True,
                "base_price": 300,
                "duration_minutes": 30
            },
            {
                "id": "SVC-STAY-ADVISORY",
                "name": "Room Suitability Advisory",
                "description": "Recommend the right room type for your pet",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True
            },
            {
                "id": "SVC-STAY-LONGTERM",
                "name": "Long-Stay Assistance",
                "description": "Serviced apartments and extended stay planning",
                "is_bookable": False,
                "requires_consultation": True
            },
            {
                "id": "SVC-STAY-BOARDING",
                "name": "Boarding Alternatives",
                "description": "When hotel stays aren't possible, we find boarding",
                "is_bookable": True,
                "base_price": 800,
                "duration_minutes": None,
                "per_night": True,
                "city_pricing": {"mumbai": 1.2, "delhi": 1.1, "bangalore": 1.0}
            }
        ]
    },
    
    "travel": {
        "pillar_name": "Travel",
        "icon": "✈️",
        "services": [
            {
                "id": "SVC-TRAVEL-AIRLINE",
                "name": "Airline Policy Interpretation",
                "description": "Route-specific pet policy guidance",
                "is_bookable": True,
                "base_price": 500,
                "duration_minutes": 45
            },
            {
                "id": "SVC-TRAVEL-CABIN-CARGO",
                "name": "Cabin vs Cargo Advisory",
                "description": "Feasibility check based on pet size and route",
                "is_bookable": True,
                "base_price": 300,
                "duration_minutes": 30
            },
            {
                "id": "SVC-TRAVEL-ROAD-RAIL",
                "name": "Train & Road Travel Planning",
                "description": "Complete road trip or train journey planning",
                "is_bookable": True,
                "base_price": 800,
                "duration_minutes": 60
            },
            {
                "id": "SVC-TRAVEL-DESTINATION",
                "name": "Destination Pet Rules",
                "description": "Pet rules and requirements at your destination",
                "is_bookable": True,
                "base_price": 400,
                "duration_minutes": 30
            },
            {
                "id": "SVC-TRAVEL-RELOCATE-DOM",
                "name": "Domestic Relocation Planning",
                "description": "Complete domestic move with your pet",
                "is_bookable": False,
                "base_price": 5000,
                "requires_consultation": True
            },
            {
                "id": "SVC-TRAVEL-RELOCATE-INTL",
                "name": "International Relocation",
                "description": "International move with quarantine and documentation",
                "is_bookable": False,
                "base_price": 15000,
                "requires_consultation": True
            },
            {
                "id": "SVC-TRAVEL-TRANSIT",
                "name": "Transit & Handling Guidance",
                "description": "Airport handling and transit coordination",
                "is_bookable": True,
                "base_price": 1000,
                "duration_minutes": 60
            }
        ]
    },
    
    "care": {
        "pillar_name": "Care",
        "icon": "💊",
        "services": [
            {
                "id": "SVC-CARE-VET-GENERAL",
                "name": "Vet Consultation - General",
                "description": "General health checkup and consultation",
                "is_bookable": True,
                "base_price": 600,
                "duration_minutes": 30,
                "city_pricing": {"mumbai": 1.2, "delhi": 1.15, "bangalore": 1.0, "chennai": 0.95},
                "add_ons": [
                    {"id": "ADDON-BLOOD", "name": "Blood Work", "price": 1200},
                    {"id": "ADDON-XRAY", "name": "X-Ray", "price": 800},
                    {"id": "ADDON-VAX", "name": "Vaccination", "price": 500}
                ]
            },
            {
                "id": "SVC-CARE-VET-SPECIALTY",
                "name": "Vet Consultation - Specialty",
                "description": "Specialist consultation (dermatology, cardiology, etc.)",
                "is_bookable": True,
                "base_price": 1500,
                "duration_minutes": 45,
                "city_pricing": {"mumbai": 1.25, "delhi": 1.2, "bangalore": 1.0}
            },
            {
                "id": "SVC-CARE-VET-HOME",
                "name": "Vet Visit - Home",
                "description": "Vet comes to your home",
                "is_bookable": True,
                "base_price": 1200,
                "duration_minutes": 45,
                "city_pricing": {"mumbai": 1.3, "delhi": 1.2, "bangalore": 1.0}
            },
            {
                "id": "SVC-CARE-GROOM-BASIC",
                "name": "Basic Grooming",
                "description": "Bath, brush, nail trim, ear cleaning",
                "is_bookable": True,
                "base_price": 800,
                "duration_minutes": 60,
                "city_pricing": {"mumbai": 1.15, "delhi": 1.10, "bangalore": 1.0, "chennai": 0.95, "hyderabad": 0.95, "pune": 1.05},
                "pet_size_pricing": {"toy": 0.7, "small": 0.85, "medium": 1.0, "large": 1.3, "giant": 1.6},
                "includes": ["Bath with premium shampoo", "Blow dry", "Brushing", "Nail trim", "Ear cleaning"],
                "add_ons": [
                    {"id": "ADDON-HAIRCUT", "name": "Haircut/Trim", "price": 300},
                    {"id": "ADDON-TEETH", "name": "Teeth Brushing", "price": 150},
                    {"id": "ADDON-DMAT", "name": "De-matting", "price": 400}
                ]
            },
            {
                "id": "SVC-CARE-GROOM-SPA",
                "name": "Full Spa Grooming",
                "description": "Complete spa experience with massage",
                "is_bookable": True,
                "base_price": 1500,
                "duration_minutes": 120,
                "pet_size_pricing": {"small": 0.85, "medium": 1.0, "large": 1.4, "giant": 1.8},
                "includes": ["Everything in Basic", "Full haircut", "Spa massage", "Pawdicure", "Aromatherapy"]
            },
            {
                "id": "SVC-CARE-GROOM-HOME",
                "name": "Home Grooming",
                "description": "Groomer comes to your home",
                "is_bookable": True,
                "base_price": 1200,
                "duration_minutes": 90,
                "city_pricing": {"mumbai": 1.2, "delhi": 1.15, "bangalore": 1.0}
            },
            {
                "id": "SVC-CARE-PREVENT",
                "name": "Preventive Care Reminders",
                "description": "Vaccination, deworming, health check reminders",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True,
                "subscription_type": "included"
            },
            {
                "id": "SVC-CARE-NUTRITION",
                "name": "Nutrition Guidance",
                "description": "Non-medical diet and nutrition planning",
                "is_bookable": True,
                "base_price": 800,
                "duration_minutes": 45
            },
            {
                "id": "SVC-CARE-RECOVERY",
                "name": "Recovery Care Coordination",
                "description": "Post-surgery or treatment care coordination",
                "is_bookable": False,
                "requires_consultation": True
            },
            {
                "id": "SVC-CARE-SENIOR",
                "name": "Senior Pet Care Planning",
                "description": "Comprehensive care plan for senior pets",
                "is_bookable": True,
                "base_price": 1500,
                "duration_minutes": 60
            }
        ]
    },
    
    "enjoy": {
        "pillar_name": "Enjoy",
        "icon": "🎾",
        "services": [
            {
                "id": "SVC-ENJOY-PARKS",
                "name": "Pet Parks Discovery",
                "description": "Find dog parks and open spaces near you",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True
            },
            {
                "id": "SVC-ENJOY-PLAYDATE",
                "name": "Playdate Coordination",
                "description": "Arrange playdates with compatible dogs",
                "is_bookable": True,
                "base_price": 300,
                "duration_minutes": 120
            },
            {
                "id": "SVC-ENJOY-EVENTS",
                "name": "Pet Events & Experiences",
                "description": "Pet-friendly events, meetups, experiences",
                "is_bookable": True,
                "base_price": 500,
                "duration_minutes": 180
            },
            {
                "id": "SVC-ENJOY-SOCIAL",
                "name": "Socialisation Planning",
                "description": "Structured socialisation for puppies and shy dogs",
                "is_bookable": True,
                "base_price": 800,
                "duration_minutes": 90
            },
            {
                "id": "SVC-ENJOY-WEEKEND",
                "name": "Weekend Outing Planning",
                "description": "Complete weekend activity plan with your pet",
                "is_bookable": True,
                "base_price": 400,
                "duration_minutes": 60
            }
        ]
    },
    
    "fit": {
        "pillar_name": "Fit",
        "icon": "🏃",
        "services": [
            {
                "id": "SVC-FIT-WALK-DAILY",
                "name": "Dog Walking - Daily",
                "description": "Daily dog walking service",
                "is_bookable": True,
                "base_price": 300,
                "duration_minutes": 30,
                "per_session": True,
                "city_pricing": {"mumbai": 1.15, "delhi": 1.1, "bangalore": 1.0}
            },
            {
                "id": "SVC-FIT-WALK-MONTHLY",
                "name": "Dog Walking - Monthly Package",
                "description": "30 walks per month",
                "is_bookable": True,
                "base_price": 6000,
                "duration_minutes": 30,
                "package_sessions": 30,
                "city_pricing": {"mumbai": 1.15, "delhi": 1.1, "bangalore": 1.0}
            },
            {
                "id": "SVC-FIT-ACTIVITY",
                "name": "Breed-Appropriate Activity Plan",
                "description": "Customized exercise routine for your breed",
                "is_bookable": True,
                "base_price": 1000,
                "duration_minutes": 60
            },
            {
                "id": "SVC-FIT-INDOOR",
                "name": "Indoor Exercise Routines",
                "description": "Exercise plans for apartment living",
                "is_bookable": True,
                "base_price": 800,
                "duration_minutes": 45
            },
            {
                "id": "SVC-FIT-OUTDOOR",
                "name": "Outdoor Exercise Sessions",
                "description": "Guided outdoor exercise and play",
                "is_bookable": True,
                "base_price": 500,
                "duration_minutes": 60
            },
            {
                "id": "SVC-FIT-WEIGHT",
                "name": "Weight Management Program",
                "description": "Non-medical weight loss/gain support",
                "is_bookable": True,
                "base_price": 2500,
                "duration_minutes": None,
                "program_weeks": 8
            },
            {
                "id": "SVC-FIT-SENIOR",
                "name": "Senior Mobility Planning",
                "description": "Gentle exercise for senior dogs",
                "is_bookable": True,
                "base_price": 1200,
                "duration_minutes": 45
            },
            {
                "id": "SVC-FIT-SWIM",
                "name": "Swimming Sessions",
                "description": "Hydrotherapy and recreational swimming",
                "is_bookable": True,
                "base_price": 1000,
                "duration_minutes": 45,
                "city_pricing": {"mumbai": 1.2, "bangalore": 1.0}
            }
        ]
    },
    
    "learn": {
        "pillar_name": "Learn",
        "icon": "🎓",
        "services": [
            {
                "id": "SVC-LEARN-NEWPARENT",
                "name": "New Pet Parent Onboarding",
                "description": "Everything you need to know as a first-time pet parent",
                "is_bookable": True,
                "base_price": 1500,
                "duration_minutes": 90
            },
            {
                "id": "SVC-LEARN-BREED",
                "name": "Breed Education Session",
                "description": "Understand your breed's needs and temperament",
                "is_bookable": True,
                "base_price": 800,
                "duration_minutes": 60
            },
            {
                "id": "SVC-LEARN-PUPPY",
                "name": "Puppy Transition Guidance",
                "description": "First 30 days with your new puppy",
                "is_bookable": True,
                "base_price": 2000,
                "duration_minutes": 120
            },
            {
                "id": "SVC-LEARN-SENIOR",
                "name": "Senior Pet Care Education",
                "description": "Understanding and caring for aging pets",
                "is_bookable": True,
                "base_price": 1000,
                "duration_minutes": 60
            },
            {
                "id": "SVC-LEARN-BEHAVIOR",
                "name": "Behavior Understanding",
                "description": "Learn to read and understand your pet's behavior",
                "is_bookable": True,
                "base_price": 1200,
                "duration_minutes": 75
            },
            {
                "id": "SVC-LEARN-TRAINING-BASIC",
                "name": "Basic Obedience Training",
                "description": "Sit, stay, come, heel basics",
                "is_bookable": True,
                "base_price": 3000,
                "duration_minutes": None,
                "package_sessions": 8
            },
            {
                "id": "SVC-LEARN-TRAINING-ADV",
                "name": "Advanced Training",
                "description": "Advanced commands and tricks",
                "is_bookable": True,
                "base_price": 5000,
                "duration_minutes": None,
                "package_sessions": 12
            }
        ]
    },
    
    "paperwork": {
        "pillar_name": "Paperwork",
        "icon": "📄",
        "services": [
            {
                "id": "SVC-PAPER-REGISTER",
                "name": "Pet Registration Guidance",
                "description": "Help with local pet registration",
                "is_bookable": True,
                "base_price": 500,
                "duration_minutes": 30
            },
            {
                "id": "SVC-PAPER-MICROCHIP",
                "name": "Microchipping Assistance",
                "description": "Microchip registration and documentation",
                "is_bookable": True,
                "base_price": 300,
                "duration_minutes": 30
            },
            {
                "id": "SVC-PAPER-LICENSE",
                "name": "Licensing & Compliance",
                "description": "Local compliance and licensing guidance",
                "is_bookable": True,
                "base_price": 400,
                "duration_minutes": 45
            },
            {
                "id": "SVC-PAPER-TRAVEL",
                "name": "Travel Documentation",
                "description": "Pet passport, health certificates, NOCs",
                "is_bookable": True,
                "base_price": 1500,
                "duration_minutes": 60
            },
            {
                "id": "SVC-PAPER-INSURANCE",
                "name": "Insurance Paperwork Advisory",
                "description": "Help with pet insurance documentation",
                "is_bookable": True,
                "base_price": 300,
                "duration_minutes": 30
            },
            {
                "id": "SVC-PAPER-ADOPTION",
                "name": "Adoption Documentation",
                "description": "Adoption papers and transfer documentation",
                "is_bookable": True,
                "base_price": 500,
                "duration_minutes": 45
            }
        ]
    },
    
    "advisory": {
        "pillar_name": "Advisory",
        "icon": "📋",
        "services": [
            {
                "id": "SVC-ADVISE-LIFE",
                "name": "Pet Life Planning",
                "description": "Long-term planning for your pet's life",
                "is_bookable": False,
                "requires_consultation": True
            },
            {
                "id": "SVC-ADVISE-HOUSING",
                "name": "Housing & Society Advisory",
                "description": "Navigate pet rules in housing societies",
                "is_bookable": True,
                "base_price": 500,
                "duration_minutes": 45
            },
            {
                "id": "SVC-ADVISE-MULTI",
                "name": "Multi-Pet Household Planning",
                "description": "Adding another pet to your family",
                "is_bookable": True,
                "base_price": 1000,
                "duration_minutes": 60
            },
            {
                "id": "SVC-ADVISE-BEHAVIOR",
                "name": "Behavior Escalation Pathways",
                "description": "Non-clinical behavior concern guidance",
                "is_bookable": False,
                "requires_consultation": True
            },
            {
                "id": "SVC-ADVISE-EOL",
                "name": "End-of-Life Preparation",
                "description": "Planning for your pet's final chapter",
                "is_bookable": False,
                "requires_consultation": True
            }
        ]
    },
    
    "emergency": {
        "pillar_name": "Emergency",
        "icon": "🚨",
        "services": [
            {
                "id": "SVC-EMERG-VET",
                "name": "Emergency Vet Discovery",
                "description": "Find nearest emergency vet immediately",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True,
                "is_24x7": True
            },
            {
                "id": "SVC-EMERG-AFTER",
                "name": "After-Hours Care Guidance",
                "description": "Guidance when regular vets are closed",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True,
                "is_24x7": True
            },
            {
                "id": "SVC-EMERG-RESPONSE",
                "name": "Accident & Poisoning Response",
                "description": "Immediate guidance for emergencies",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True,
                "is_24x7": True
            },
            {
                "id": "SVC-EMERG-LOST",
                "name": "Lost Pet Response",
                "description": "Coordination for lost pet recovery",
                "is_bookable": False,
                "is_free": True,
                "is_24x7": True,
                "requires_consultation": True
            },
            {
                "id": "SVC-EMERG-TRANSPORT",
                "name": "Emergency Transport",
                "description": "Emergency pet ambulance coordination",
                "is_bookable": True,
                "base_price": 1500,
                "is_24x7": True,
                "city_pricing": {"mumbai": 1.3, "delhi": 1.2, "bangalore": 1.0}
            }
        ]
    },
    
    "farewell": {
        "pillar_name": "Farewell",
        "icon": "🌈",
        "services": [
            {
                "id": "SVC-FARE-PLANNING",
                "name": "End-of-Life Planning",
                "description": "Compassionate planning support",
                "is_bookable": False,
                "requires_consultation": True
            },
            {
                "id": "SVC-FARE-EUTHANASIA",
                "name": "Euthanasia Coordination",
                "description": "Vet-guided peaceful passing",
                "is_bookable": False,
                "requires_consultation": True
            },
            {
                "id": "SVC-FARE-CREMATION",
                "name": "Cremation & Burial",
                "description": "Dignified final arrangements",
                "is_bookable": True,
                "base_price": 3000,
                "city_pricing": {"mumbai": 1.2, "delhi": 1.1, "bangalore": 1.0}
            },
            {
                "id": "SVC-FARE-MEMORIAL",
                "name": "Memorial & Remembrance",
                "description": "Memorial planning and keepsakes",
                "is_bookable": True,
                "base_price": 2000
            },
            {
                "id": "SVC-FARE-GRIEF",
                "name": "Grief Support Resources",
                "description": "Support during difficult times",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True
            }
        ]
    },
    
    "adopt": {
        "pillar_name": "Adopt",
        "icon": "🐾",
        "services": [
            {
                "id": "SVC-ADOPT-DISCOVER",
                "name": "Ethical Adoption Discovery",
                "description": "Find verified shelters and rescues",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True
            },
            {
                "id": "SVC-ADOPT-SUITABILITY",
                "name": "Breed Suitability Advisory",
                "description": "Find the right breed for your lifestyle",
                "is_bookable": True,
                "base_price": 500,
                "duration_minutes": 45
            },
            {
                "id": "SVC-ADOPT-READINESS",
                "name": "Adoption Readiness Planning",
                "description": "Are you ready for a pet?",
                "is_bookable": True,
                "base_price": 300,
                "duration_minutes": 30
            },
            {
                "id": "SVC-ADOPT-HOME",
                "name": "Home Preparation Guidance",
                "description": "Prepare your home for a new pet",
                "is_bookable": True,
                "base_price": 500,
                "duration_minutes": 45
            },
            {
                "id": "SVC-ADOPT-TRANSITION",
                "name": "First 30 Days Support",
                "description": "Transition support for new adoptions",
                "is_bookable": True,
                "base_price": 2000,
                "duration_minutes": None,
                "program_days": 30
            }
        ]
    },
    
    "shop": {
        "pillar_name": "Shop",
        "icon": "🛒",
        "services": [
            {
                "id": "SVC-SHOP-PERSONAL",
                "name": "Personal Shopping Assistance",
                "description": "Help finding the right products",
                "is_bookable": True,
                "base_price": 0,
                "is_free": True
            },
            {
                "id": "SVC-SHOP-EMERGENCY",
                "name": "Emergency Sourcing",
                "description": "Urgent product sourcing",
                "is_bookable": False,
                "requires_consultation": True
            },
            {
                "id": "SVC-SHOP-VET-REC",
                "name": "Vet-Recommended Sourcing",
                "description": "Find specific vet-recommended products",
                "is_bookable": True,
                "base_price": 200,
                "duration_minutes": 30
            },
            {
                "id": "SVC-SHOP-RELOCATE",
                "name": "Travel & Relocation Sourcing",
                "description": "All products needed for travel/move",
                "is_bookable": True,
                "base_price": 500,
                "duration_minutes": 60
            }
        ]
    }
}


async def seed_all_services():
    """Seed all services from master list, merging with existing"""
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client[os.environ.get('DB_NAME', 'thedoggycompany')]
    
    now = datetime.now(timezone.utc)
    total_created = 0
    total_updated = 0
    
    print("=" * 60)
    print("SEEDING MASTER SERVICE LIST")
    print("=" * 60)
    
    for pillar, pillar_data in MASTER_SERVICES.items():
        print(f"\n{pillar_data['icon']} {pillar_data['pillar_name'].upper()}")
        print("-" * 40)
        
        for service in pillar_data["services"]:
            service_doc = {
                **service,
                "pillar": pillar,
                "pillar_name": pillar_data["pillar_name"],
                "pillar_icon": pillar_data["icon"],
                "is_active": True,
                "created_at": now,
                "updated_at": now,
                # Ensure required fields
                "is_bookable": service.get("is_bookable", False),
                "base_price": service.get("base_price"),
                "duration_minutes": service.get("duration_minutes"),
                "requires_consultation": service.get("requires_consultation", False),
                "is_free": service.get("is_free", False),
                "is_24x7": service.get("is_24x7", False),
                "city_pricing": service.get("city_pricing", {}),
                "pet_size_pricing": service.get("pet_size_pricing", {}),
                "pet_count_pricing": service.get("pet_count_pricing", {}),
                "includes": service.get("includes", []),
                "add_ons": service.get("add_ons", []),
                # Default payment config
                "payment_timing": "configurable",
                "deposit_percentage": 20
            }
            
            # Check if service exists
            existing = await db.service_catalog.find_one({"id": service["id"]})
            
            if existing:
                # Update existing
                await db.service_catalog.update_one(
                    {"id": service["id"]},
                    {"$set": {**service_doc, "created_at": existing.get("created_at", now)}}
                )
                print(f"  ✓ Updated: {service['name']}")
                total_updated += 1
            else:
                # Create new
                await db.service_catalog.insert_one(service_doc)
                print(f"  + Created: {service['name']}")
                total_created += 1
    
    # Also ensure indexes
    await db.service_catalog.create_index("id", unique=True)
    await db.service_catalog.create_index("pillar")
    await db.service_catalog.create_index("is_bookable")
    await db.service_catalog.create_index("is_active")
    
    print("\n" + "=" * 60)
    print(f"COMPLETE: {total_created} created, {total_updated} updated")
    print("=" * 60)
    
    # Summary by pillar
    print("\nSERVICES BY PILLAR:")
    pipeline = [
        {"$group": {"_id": "$pillar", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    async for doc in db.service_catalog.aggregate(pipeline):
        pillar_info = MASTER_SERVICES.get(doc["_id"], {})
        icon = pillar_info.get("icon", "📦")
        print(f"  {icon} {doc['_id']}: {doc['count']} services")


if __name__ == "__main__":
    asyncio.run(seed_all_services())
