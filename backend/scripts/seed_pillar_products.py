"""
Product Seeder for All 14 Pillars
=================================
Seeds sample products across all pillars with proper attributes:
- Tags for size, age, allergies
- Parent categories
- Variants and sizes
- Stock images from Unsplash

Run with: python scripts/seed_pillar_products.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone
import uuid
import random

load_dotenv('/app/backend/.env')

# Stock images from Unsplash (dog-friendly, high quality)
STOCK_IMAGES = {
    "celebrate": [
        "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400",  # Dog birthday
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",  # Happy dog
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",  # Dogs playing
        "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400",  # Dog with party hat
    ],
    "dine": [
        "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400",  # Dog food bowl
        "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400",  # Dog eating
        "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",  # Dog with food
        "https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?w=400",  # Pet bowl
    ],
    "stay": [
        "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=400",  # Dog hotel
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",  # Dog boarding
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",  # Comfortable dog
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",  # Dog resting
    ],
    "travel": [
        "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400",  # Dog in car
        "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400",  # Dog adventure
        "https://images.unsplash.com/photo-1544568100-847a948585b9?w=400",  # Dog outdoors
        "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400",  # Dog carrier
    ],
    "care": [
        "https://images.unsplash.com/photo-1581888227599-779811939961?w=400",  # Dog grooming
        "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",  # Dog vet
        "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400",  # Dog spa
        "https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=400",  # Dog bath
    ],
    "enjoy": [
        "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400",  # Dog playing
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",  # Happy dog
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",  # Dogs running
        "https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=400",  # Dog park
    ],
    "fit": [
        "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400",  # Dog exercise
        "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400",  # Active dog
        "https://images.unsplash.com/photo-1544568100-847a948585b9?w=400",  # Dog running
        "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400",  # Dog fitness
    ],
    "learn": [
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",  # Dog training
        "https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=400",  # Dog learning
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",  # Dog class
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",  # Smart dog
    ],
    "paperwork": [
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",  # Dog official
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",  # Dog documents
    ],
    "advisory": [
        "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",  # Dog consultation
        "https://images.unsplash.com/photo-1581888227599-779811939961?w=400",  # Expert advice
    ],
    "emergency": [
        "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",  # Emergency vet
        "https://images.unsplash.com/photo-1581888227599-779811939961?w=400",  # Pet care
    ],
    "farewell": [
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",  # Memorial
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",  # Rainbow bridge
    ],
    "adopt": [
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",  # Adoption
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",  # New family
        "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400",  # Rescue dog
    ],
    "shop": [
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",  # Pet products
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",  # Dog toys
    ],
}

# Size tags for filtering
SIZE_TAGS = ["small-dog", "medium-dog", "large-dog", "giant-breed", "all-sizes"]

# Age tags for filtering
AGE_TAGS = ["puppy", "adult", "senior", "all-ages"]

# Allergy/dietary tags
ALLERGY_TAGS = ["grain-free", "chicken-free", "beef-free", "dairy-free", "hypoallergenic", "limited-ingredient"]

# Shipping tags
SHIPPING_TAGS = ["pan-india", "local-only", "same-day", "express-shipping"]

# ============== PRODUCT TEMPLATES BY PILLAR ==============

PILLAR_PRODUCTS = {
    "celebrate": {
        "parent_category": "celebrations",
        "products": [
            {"name": "Custom Birthday Cake", "base_price": 899, "category": "cakes", "description": "Personalized birthday cake for your furry friend"},
            {"name": "Paw-ty Pack Deluxe", "base_price": 1499, "category": "hampers", "description": "Complete birthday party kit with cake, treats & decorations"},
            {"name": "Gotcha Day Celebration Box", "base_price": 1299, "category": "hampers", "description": "Celebrate your rescue pet's adoption anniversary"},
            {"name": "Puppy First Birthday Bundle", "base_price": 1699, "category": "hampers", "description": "Special first birthday celebration kit"},
            {"name": "Senior Dog Birthday Treats", "base_price": 599, "category": "treats", "description": "Soft, senior-friendly birthday treats"},
            {"name": "Breed-Specific Cake - Labrador", "base_price": 1099, "category": "breed-cakes", "description": "Labrador-shaped celebration cake"},
            {"name": "Breed-Specific Cake - Golden Retriever", "base_price": 1099, "category": "breed-cakes", "description": "Golden Retriever-shaped celebration cake"},
            {"name": "Breed-Specific Cake - German Shepherd", "base_price": 1099, "category": "breed-cakes", "description": "German Shepherd-shaped celebration cake"},
            {"name": "Mini Pupcake Box (6 pcs)", "base_price": 449, "category": "mini-cakes", "description": "Box of 6 mini celebration cupcakes"},
            {"name": "Celebration Bandana Set", "base_price": 349, "category": "accessories", "description": "Birthday-themed bandana collection"},
        ]
    },
    "dine": {
        "parent_category": "fresh-food",
        "products": [
            {"name": "Fresh Chicken & Rice Bowl", "base_price": 199, "category": "fresh-meals", "description": "Freshly prepared chicken with brown rice"},
            {"name": "Lamb & Sweet Potato Meal", "base_price": 249, "category": "fresh-meals", "description": "Premium lamb with sweet potato"},
            {"name": "Fish & Veggie Delight", "base_price": 229, "category": "fresh-meals", "description": "Ocean fish with seasonal vegetables"},
            {"name": "Puppy Growth Formula", "base_price": 279, "category": "fresh-meals", "description": "Nutrient-rich meal for growing puppies"},
            {"name": "Senior Wellness Meal", "base_price": 259, "category": "fresh-meals", "description": "Easy-to-digest meal for senior dogs"},
            {"name": "Weight Management Bowl", "base_price": 219, "category": "fresh-meals", "description": "Low-calorie, high-protein meal"},
            {"name": "Grain-Free Turkey Feast", "base_price": 269, "category": "fresh-meals", "description": "100% grain-free turkey meal"},
            {"name": "Weekly Meal Subscription (7 meals)", "base_price": 1399, "category": "fresh-meals", "description": "Weekly fresh meal delivery"},
            {"name": "Monthly Meal Plan (30 meals)", "base_price": 4999, "category": "fresh-meals", "description": "Complete monthly meal subscription"},
            {"name": "Slow Feeder Bowl", "base_price": 599, "category": "accessories", "description": "Anti-gulp bowl for healthier eating"},
        ]
    },
    "stay": {
        "parent_category": "stay",
        "products": [
            {"name": "Standard Boarding - 1 Night", "base_price": 999, "category": "boarding", "description": "Comfortable overnight stay with meals"},
            {"name": "Premium Suite - 1 Night", "base_price": 1499, "category": "boarding", "description": "Luxury suite with AC and webcam access"},
            {"name": "Daycare Pass - Single Day", "base_price": 599, "category": "daycare", "description": "Full day of play and supervision"},
            {"name": "Daycare Pack - 10 Days", "base_price": 4999, "category": "daycare", "description": "10-day daycare pass with 2 bonus days"},
            {"name": "Home Boarding Service", "base_price": 1299, "category": "boarding", "description": "Stay with a certified pet host"},
            {"name": "Puppy Daycare (under 1 year)", "base_price": 699, "category": "daycare", "description": "Specialized care for young puppies"},
            {"name": "Senior Dog Stay", "base_price": 1199, "category": "boarding", "description": "Gentle care for senior pets"},
            {"name": "Medical Boarding", "base_price": 1799, "category": "boarding", "description": "Boarding with medication administration"},
            {"name": "Holiday Pet Sitting", "base_price": 1599, "category": "boarding", "description": "In-home pet sitting during holidays"},
            {"name": "Airport Pickup & Drop", "base_price": 799, "category": "services", "description": "Pet transport to/from airport"},
        ]
    },
    "travel": {
        "parent_category": "travel",
        "products": [
            {"name": "Pet Carrier - Cabin Approved", "base_price": 2499, "category": "travel-gear", "description": "Airline-approved cabin carrier"},
            {"name": "Travel Water Bottle", "base_price": 449, "category": "travel-gear", "description": "Portable water bottle with bowl"},
            {"name": "Car Safety Harness", "base_price": 899, "category": "travel-gear", "description": "Crash-tested car safety harness"},
            {"name": "Collapsible Travel Bowl Set", "base_price": 349, "category": "travel-gear", "description": "Space-saving food & water bowls"},
            {"name": "Pet Passport Service", "base_price": 2999, "category": "services", "description": "Complete pet travel documentation"},
            {"name": "International Flight Assistance", "base_price": 9999, "category": "services", "description": "End-to-end international travel support"},
            {"name": "Pet-Friendly Hotel Booking", "base_price": 499, "category": "services", "description": "We find the perfect pet-friendly stay"},
            {"name": "Travel First Aid Kit", "base_price": 799, "category": "travel-gear", "description": "Emergency kit for traveling pets"},
            {"name": "Anxiety Relief Travel Kit", "base_price": 699, "category": "travel-gear", "description": "Calming aids for travel stress"},
            {"name": "GPS Pet Tracker", "base_price": 3999, "category": "travel-gear", "description": "Real-time location tracking device"},
        ]
    },
    "care": {
        "parent_category": "care",
        "products": [
            {"name": "Full Grooming Session", "base_price": 999, "category": "grooming", "description": "Bath, haircut, nail trim, ear cleaning"},
            {"name": "Spa Day Package", "base_price": 1499, "category": "grooming", "description": "Grooming + massage + aromatherapy"},
            {"name": "Puppy First Groom", "base_price": 699, "category": "grooming", "description": "Gentle introduction to grooming"},
            {"name": "De-shedding Treatment", "base_price": 899, "category": "grooming", "description": "Professional de-shedding service"},
            {"name": "Dental Cleaning Kit", "base_price": 599, "category": "health", "description": "Complete dental care set"},
            {"name": "Flea & Tick Prevention Pack", "base_price": 799, "category": "health", "description": "3-month protection pack"},
            {"name": "Joint Support Supplements", "base_price": 899, "category": "health", "description": "Glucosamine & chondroitin formula"},
            {"name": "Skin & Coat Supplements", "base_price": 699, "category": "health", "description": "Omega-rich formula for shiny coat"},
            {"name": "Vet Video Consultation", "base_price": 499, "category": "health", "description": "Online vet consultation"},
            {"name": "Annual Health Checkup Package", "base_price": 2499, "category": "health", "description": "Comprehensive annual health screening"},
        ]
    },
    "enjoy": {
        "parent_category": "accessories",
        "products": [
            {"name": "Interactive Puzzle Toy", "base_price": 699, "category": "toys", "description": "Mental stimulation puzzle game"},
            {"name": "Squeaky Plush Collection (3 pcs)", "base_price": 599, "category": "toys", "description": "Soft squeaky toys bundle"},
            {"name": "Durable Chew Toy Set", "base_price": 799, "category": "toys", "description": "Long-lasting chew toys for aggressive chewers"},
            {"name": "Fetch Ball Launcher", "base_price": 1299, "category": "toys", "description": "Automatic ball launcher for endless fetch"},
            {"name": "Tug Rope Toy - Large", "base_price": 449, "category": "toys", "description": "Heavy-duty rope for tug-of-war"},
            {"name": "Snuffle Mat", "base_price": 899, "category": "toys", "description": "Enrichment mat for mental stimulation"},
            {"name": "Kong Classic - Large", "base_price": 699, "category": "toys", "description": "Durable treat-dispensing toy"},
            {"name": "Dog Park Playdate Booking", "base_price": 399, "category": "services", "description": "Organized playdate at local park"},
            {"name": "Swimming Pool Session", "base_price": 799, "category": "services", "description": "Supervised pool time for dogs"},
            {"name": "Agility Course Access", "base_price": 599, "category": "services", "description": "Access to agility training course"},
        ]
    },
    "fit": {
        "parent_category": "fit",
        "products": [
            {"name": "Personal Training Session", "base_price": 999, "category": "training", "description": "One-on-one fitness training"},
            {"name": "Weight Loss Program (4 weeks)", "base_price": 3999, "category": "programs", "description": "Structured weight management program"},
            {"name": "Puppy Fitness Starter", "base_price": 2499, "category": "programs", "description": "Age-appropriate exercise program"},
            {"name": "Senior Mobility Program", "base_price": 2999, "category": "programs", "description": "Gentle exercises for older dogs"},
            {"name": "Canine Treadmill Session", "base_price": 599, "category": "training", "description": "Supervised treadmill workout"},
            {"name": "Swimming Fitness Class", "base_price": 799, "category": "training", "description": "Low-impact aqua fitness"},
            {"name": "Agility Training Course", "base_price": 4999, "category": "programs", "description": "8-week agility training program"},
            {"name": "Fitness Assessment", "base_price": 699, "category": "services", "description": "Complete fitness evaluation"},
            {"name": "Monthly Fitness Subscription", "base_price": 2999, "category": "programs", "description": "Unlimited fitness sessions"},
            {"name": "Dog Yoga (Doga) Session", "base_price": 599, "category": "training", "description": "Relaxing yoga with your dog"},
        ]
    },
    "learn": {
        "parent_category": "learn",
        "products": [
            {"name": "Basic Obedience Course", "base_price": 4999, "category": "training", "description": "Essential commands & manners"},
            {"name": "Puppy Kindergarten (8 weeks)", "base_price": 5999, "category": "training", "description": "Foundation training for puppies"},
            {"name": "Advanced Training Program", "base_price": 7999, "category": "training", "description": "Complex commands & tricks"},
            {"name": "Behavior Modification", "base_price": 6999, "category": "training", "description": "Address specific behavior issues"},
            {"name": "Leash Training Workshop", "base_price": 1999, "category": "workshops", "description": "Walk nicely on leash"},
            {"name": "Socialization Classes", "base_price": 2499, "category": "training", "description": "Safe exposure to new experiences"},
            {"name": "Trick Training Course", "base_price": 3499, "category": "training", "description": "Fun tricks to impress everyone"},
            {"name": "Therapy Dog Certification", "base_price": 9999, "category": "certification", "description": "Complete therapy dog training"},
            {"name": "Private Training Session", "base_price": 1499, "category": "training", "description": "One-on-one training at your home"},
            {"name": "Online Training Course", "base_price": 1999, "category": "training", "description": "Self-paced video training"},
        ]
    },
    "paperwork": {
        "parent_category": "paperwork",
        "products": [
            {"name": "Pet Registration Service", "base_price": 999, "category": "documentation", "description": "Complete municipal registration"},
            {"name": "Microchip Registration", "base_price": 799, "category": "documentation", "description": "Microchip + national registry"},
            {"name": "KCI Registration Assistance", "base_price": 2999, "category": "documentation", "description": "Kennel Club of India registration"},
            {"name": "Pet Insurance Consultation", "base_price": 499, "category": "consultation", "description": "Find the right pet insurance"},
            {"name": "Vaccination Record Book", "base_price": 299, "category": "documentation", "description": "Official vaccination record"},
            {"name": "Pet Will & Trust Service", "base_price": 4999, "category": "legal", "description": "Legal protection for your pet's future"},
            {"name": "Import/Export Documentation", "base_price": 5999, "category": "documentation", "description": "International pet movement papers"},
            {"name": "Breeding License Assistance", "base_price": 3999, "category": "documentation", "description": "Help with breeding permits"},
        ]
    },
    "advisory": {
        "parent_category": "advisory",
        "products": [
            {"name": "Nutrition Consultation", "base_price": 999, "category": "consultation", "description": "Personalized diet planning"},
            {"name": "Behavior Consultation", "base_price": 1499, "category": "consultation", "description": "Expert behavior assessment"},
            {"name": "Pre-Adoption Counseling", "base_price": 799, "category": "consultation", "description": "Choose the right pet for your family"},
            {"name": "New Pet Parent Guidance", "base_price": 999, "category": "consultation", "description": "Everything you need to know"},
            {"name": "Senior Pet Care Consultation", "base_price": 1299, "category": "consultation", "description": "Caring for aging pets"},
            {"name": "Multi-Pet Household Advisory", "base_price": 1499, "category": "consultation", "description": "Introducing new pets safely"},
            {"name": "Breed Selection Service", "base_price": 1999, "category": "consultation", "description": "Find your perfect breed match"},
            {"name": "Pet-Proofing Home Audit", "base_price": 1499, "category": "services", "description": "Make your home pet-safe"},
        ]
    },
    "emergency": {
        "parent_category": "emergency",
        "products": [
            {"name": "24/7 Emergency Vet Hotline", "base_price": 299, "category": "emergency", "description": "Round-the-clock vet access"},
            {"name": "Emergency Transport Service", "base_price": 999, "category": "emergency", "description": "Rush transport to nearest vet"},
            {"name": "First Aid Training Workshop", "base_price": 1999, "category": "training", "description": "Learn pet first aid"},
            {"name": "Emergency Kit - Complete", "base_price": 1499, "category": "supplies", "description": "Everything for pet emergencies"},
            {"name": "Poison Control Consultation", "base_price": 499, "category": "emergency", "description": "Immediate toxicity guidance"},
            {"name": "Lost Pet Search Service", "base_price": 1999, "category": "services", "description": "Professional pet search team"},
        ]
    },
    "farewell": {
        "parent_category": "farewell",
        "products": [
            {"name": "Cremation Service - Standard", "base_price": 3999, "category": "cremation", "description": "Dignified cremation service"},
            {"name": "Cremation Service - Premium", "base_price": 6999, "category": "cremation", "description": "Private cremation with ceremony"},
            {"name": "Memorial Urn - Classic", "base_price": 2999, "category": "memorial", "description": "Beautiful memorial urn"},
            {"name": "Paw Print Keepsake", "base_price": 999, "category": "memorial", "description": "Clay paw print impression"},
            {"name": "Photo Memorial Frame", "base_price": 1499, "category": "memorial", "description": "Custom photo memorial"},
            {"name": "Rainbow Bridge Ceremony", "base_price": 4999, "category": "ceremony", "description": "Complete farewell ceremony"},
            {"name": "Memorial Garden Stone", "base_price": 2499, "category": "memorial", "description": "Engraved garden memorial"},
            {"name": "Pet Loss Counseling Session", "base_price": 999, "category": "services", "description": "Grief support counseling"},
        ]
    },
    "adopt": {
        "parent_category": "adopt",
        "products": [
            {"name": "Adoption Counseling", "base_price": 0, "category": "services", "description": "Free adoption guidance"},
            {"name": "New Pet Starter Kit", "base_price": 2499, "category": "kits", "description": "Everything for your new family member"},
            {"name": "Rescue Dog Rehabilitation", "base_price": 4999, "category": "services", "description": "Behavior support for rescues"},
            {"name": "Foster-to-Adopt Program", "base_price": 0, "category": "programs", "description": "Try before you commit"},
            {"name": "Adoption Day Package", "base_price": 1999, "category": "kits", "description": "Supplies + training session"},
            {"name": "Senior Pet Adoption Support", "base_price": 999, "category": "services", "description": "Support for adopting older pets"},
            {"name": "Special Needs Pet Guide", "base_price": 499, "category": "services", "description": "Caring for special needs pets"},
            {"name": "Second Chance Sponsorship", "base_price": 500, "category": "donation", "description": "Sponsor a shelter pet"},
        ]
    },
    "shop": {
        "parent_category": "accessories",
        "products": [
            {"name": "Premium Leather Collar", "base_price": 1299, "category": "accessories", "description": "Handcrafted leather collar"},
            {"name": "Reflective Safety Leash", "base_price": 899, "category": "accessories", "description": "High-visibility leash for night walks"},
            {"name": "Orthopedic Dog Bed - Medium", "base_price": 3999, "category": "beds", "description": "Memory foam comfort bed"},
            {"name": "Cooling Mat - Large", "base_price": 1499, "category": "accessories", "description": "Self-cooling comfort mat"},
            {"name": "Winter Jacket - Waterproof", "base_price": 1799, "category": "clothing", "description": "Warm, waterproof winter coat"},
            {"name": "Raincoat with Hood", "base_price": 999, "category": "clothing", "description": "Keep dry on rainy walks"},
            {"name": "Bandana Collection (5 pcs)", "base_price": 599, "category": "accessories", "description": "Stylish bandana set"},
            {"name": "ID Tag - Personalized", "base_price": 349, "category": "accessories", "description": "Custom engraved ID tag"},
            {"name": "Poop Bag Dispenser + Bags", "base_price": 449, "category": "accessories", "description": "Eco-friendly waste bags"},
            {"name": "Grooming Brush Set", "base_price": 799, "category": "grooming", "description": "Complete brush collection"},
        ]
    }
}


def get_random_image(pillar):
    """Get a random stock image for the pillar"""
    images = STOCK_IMAGES.get(pillar, STOCK_IMAGES["shop"])
    return random.choice(images)


def generate_tags(pillar, product_name, product_category):
    """Generate appropriate tags based on product characteristics"""
    tags = []
    
    # Add pillar tag
    tags.append(pillar)
    
    # Add size tags (randomize for variety)
    if "puppy" in product_name.lower():
        tags.extend(["puppy", "small-dog", "medium-dog"])
    elif "senior" in product_name.lower():
        tags.extend(["senior", "all-sizes"])
    elif "large" in product_name.lower():
        tags.extend(["large-dog", "giant-breed"])
    else:
        tags.append(random.choice(SIZE_TAGS))
    
    # Add age tags
    if "puppy" in product_name.lower():
        tags.append("puppy")
    elif "senior" in product_name.lower():
        tags.append("senior")
    else:
        tags.append(random.choice(["adult", "all-ages"]))
    
    # Add dietary tags for food products
    if pillar in ["dine", "celebrate"] or product_category in ["treats", "fresh-meals", "cakes"]:
        if "grain-free" in product_name.lower():
            tags.append("grain-free")
        elif random.random() > 0.7:  # 30% chance for special dietary
            tags.append(random.choice(ALLERGY_TAGS))
    
    # Add shipping tags
    if pillar in ["dine", "celebrate", "care"]:
        tags.append("local-only")
    else:
        tags.append("pan-india")
    
    return list(set(tags))  # Remove duplicates


def generate_variants(base_price, product_category):
    """Generate size/variant options"""
    variants = []
    
    if product_category in ["cakes", "breed-cakes", "mini-cakes"]:
        sizes = [
            ("Small (500g)", 0),
            ("Medium (1kg)", 300),
            ("Large (1.5kg)", 600),
        ]
    elif product_category in ["fresh-meals"]:
        sizes = [
            ("Single Meal", 0),
            ("Pack of 5", base_price * 4),
            ("Pack of 10", base_price * 8),
        ]
    elif product_category in ["training", "programs"]:
        sizes = [
            ("Single Session", 0),
            ("4-Session Pack", base_price * 3),
            ("8-Session Pack", base_price * 6),
        ]
    elif product_category in ["accessories", "toys"]:
        sizes = [
            ("Small", 0),
            ("Medium", 200),
            ("Large", 400),
        ]
    else:
        sizes = [("Standard", 0)]
    
    for size_name, price_add in sizes:
        variants.append({
            "id": str(uuid.uuid4()),
            "title": size_name,
            "price": base_price + price_add,
            "option1": size_name,
            "available": True
        })
    
    return variants


async def seed_products(dry_run=True):
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("=" * 70)
    print(f"PILLAR PRODUCT SEEDING {'(DRY RUN)' if dry_run else '(LIVE)'}")
    print("=" * 70)
    
    total_created = 0
    pillar_counts = {}
    
    for pillar, pillar_data in PILLAR_PRODUCTS.items():
        parent_category = pillar_data["parent_category"]
        products = pillar_data["products"]
        
        print(f"\n📦 Seeding {pillar.upper()} ({len(products)} products)...")
        pillar_counts[pillar] = 0
        
        for product_template in products:
            # Check if product already exists
            existing = await db.products.find_one({"name": product_template["name"]})
            if existing:
                print(f"  ⏭️  Skipping '{product_template['name']}' (already exists)")
                continue
            
            # Generate product document
            product_id = f"seed-{pillar}-{str(uuid.uuid4())[:8]}"
            variants = generate_variants(product_template["base_price"], product_template["category"])
            tags = generate_tags(pillar, product_template["name"], product_template["category"])
            
            product_doc = {
                "id": product_id,
                "name": product_template["name"],
                "description": product_template["description"],
                "price": product_template["base_price"],
                "category": product_template["category"],
                "parent_category": parent_category,
                "pillar": pillar,
                "tags": tags,
                "variants": variants,
                "sizes": [{"name": v["title"], "price": v["price"]} for v in variants],
                "images": [get_random_image(pillar)],
                "thumbnail": get_random_image(pillar),
                "in_stock": True,
                "is_active": True,
                "is_pan_india_shippable": "pan-india" in tags,
                "source": "seeded",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            
            if not dry_run:
                await db.products.insert_one(product_doc)
                # Also add to unified_products for consistency
                await db.unified_products.insert_one(product_doc.copy())
            
            print(f"  ✅ Created '{product_template['name']}' ({product_template['category']})")
            total_created += 1
            pillar_counts[pillar] += 1
    
    print("\n" + "=" * 70)
    print("SEEDING SUMMARY")
    print("=" * 70)
    print(f"Total products created: {total_created}")
    print("\nBy Pillar:")
    for pillar, count in pillar_counts.items():
        print(f"  {pillar}: {count}")
    
    if dry_run:
        print("\n⚠️  DRY RUN - No changes made. Run with --live to create products.")
    else:
        print("\n✅ Seeding complete!")
    
    client.close()
    return total_created


if __name__ == "__main__":
    import sys
    dry_run = "--live" not in sys.argv
    asyncio.run(seed_products(dry_run=dry_run))
