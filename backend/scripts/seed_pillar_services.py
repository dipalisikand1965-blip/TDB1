"""
Service Seeder for All 14 Pillars
=================================
Seeds comprehensive services across all pillars with Concierge® integration.
British English spellings throughout.

Run with: python scripts/seed_pillar_services.py --live
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone
import uuid
import random

load_dotenv('/app/backend/.env')

# Stock images for services
SERVICE_IMAGES = {
    "celebrate": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400",
    "dine": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400",
    "stay": "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=400",
    "travel": "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400",
    "care": "https://images.unsplash.com/photo-1581888227599-779811939961?w=400",
    "enjoy": "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400",
    "fit": "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400",
    "learn": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
    "paperwork": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400",
    "advisory": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",
    "emergency": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
    "farewell": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
    "adopt": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
    "shop": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
}

# ============== SERVICE DEFINITIONS BY PILLAR ==============

PILLAR_SERVICES = {
    "celebrate": {
        "parent_category": "celebrations",
        "services": [
            {
                "name": "Birthday Pawty Planning - Home",
                "base_price": 4999,
                "category": "party-planning",
                "description": "Complete birthday celebration planning at your home. Includes décor, cake coordination, photography, and party games for your furry friend and their pals.",
                "duration": "3-4 hours",
                "includes": ["Themed décor setup", "Cake & treats coordination", "Party games", "Photography session", "Guest management"],
                "concierge_service": True
            },
            {
                "name": "Birthday Pawty Planning - Café/Venue",
                "base_price": 7999,
                "category": "party-planning",
                "description": "Premium birthday celebration at a pet-friendly café or venue. Full Concierge® service with venue booking, décor, catering, and entertainment.",
                "duration": "4-5 hours",
                "includes": ["Venue booking", "Full décor", "Catering coordination", "Entertainment", "Professional photography", "Return gifts"],
                "concierge_service": True
            },
            {
                "name": "Birthday Pawty Planning - Resort Experience",
                "base_price": 14999,
                "category": "party-planning",
                "description": "Luxury resort birthday experience. Exclusive venue, gourmet menu, spa treatments, and overnight stay option for the birthday pup.",
                "duration": "Full day",
                "includes": ["Exclusive venue", "Gourmet pet menu", "Spa treatment", "Pool access", "Professional shoot", "Keepsake album"],
                "concierge_service": True
            },
            {
                "name": "Gotcha Day Celebration",
                "base_price": 3999,
                "category": "celebration",
                "description": "Celebrate your rescue pet's adoption anniversary with a special Gotcha Day experience. Personalised to honour their journey to your family.",
                "duration": "2-3 hours",
                "includes": ["Customised celebration", "Special treats", "Memory book", "Photo session", "Donation to rescue"],
                "concierge_service": True
            },
            {
                "name": "Milestone Celebration - Puppy to Adult",
                "base_price": 2999,
                "category": "milestone",
                "description": "Mark your puppy's transition to adulthood with a special ceremony. Includes growth photo compilation and celebration.",
                "duration": "2 hours",
                "includes": ["Growth photo montage", "Celebration ceremony", "Adult-phase welcome kit", "Certificate"],
                "concierge_service": True
            },
            {
                "name": "Milestone Celebration - Senior Honours",
                "base_price": 3499,
                "category": "milestone",
                "description": "Honour your pet's golden years with a dignified senior celebration. Gentle activities suited to their pace.",
                "duration": "2-3 hours",
                "includes": ["Gentle celebration", "Memory lane photo book", "Senior comfort kit", "Family portrait"],
                "concierge_service": True
            },
            {
                "name": "Surprise Delivery & Moment",
                "base_price": 1999,
                "category": "surprise",
                "description": "Surprise your pet parent with an unexpected celebration delivery. Perfect for birthdays, anniversaries, or just because.",
                "duration": "Delivery + 30 min setup",
                "includes": ["Surprise delivery", "Themed setup", "Treats & cake", "Card & message"],
                "concierge_service": True
            },
            {
                "name": "Party Coordination Service",
                "base_price": 2499,
                "category": "coordination",
                "description": "Full party coordination without venue booking. We handle décor, cake, invites, and guest management.",
                "duration": "Planning + event day",
                "includes": ["Décor sourcing", "Cake coordination", "Digital invites", "Guest RSVP management", "Day-of coordination"],
                "concierge_service": True
            },
            {
                "name": "Memory-Making Photo Experience",
                "base_price": 3999,
                "category": "photography",
                "description": "Professional photography session capturing your pet's personality. Studio or outdoor locations available.",
                "duration": "2 hours",
                "includes": ["Professional photographer", "Multiple setups", "20 edited photos", "Photo album", "Digital gallery"],
                "concierge_service": True
            },
            {
                "name": "Keepsake Creation Service",
                "base_price": 1499,
                "category": "keepsakes",
                "description": "Create lasting memories with custom keepsakes - paw prints, fur clippings, custom portraits, and more.",
                "duration": "1-2 weeks delivery",
                "includes": ["Paw print casting", "Custom portrait", "Memory box", "Certificate"],
                "concierge_service": True
            },
            {
                "name": "Annual Celebration Reminder & Planning",
                "base_price": 999,
                "category": "subscription",
                "description": "Never miss a celebration! Annual subscription for reminders and pre-planned celebrations for all your pet's special days.",
                "duration": "12 months",
                "includes": ["Birthday reminder", "Gotcha Day reminder", "Breed Day notification", "Early booking discounts", "Personalised suggestions"],
                "concierge_service": True,
                "is_subscription": True
            },
            {
                "name": "Breed Day Celebration",
                "base_price": 2499,
                "category": "breed-day",
                "description": "Celebrate your pet's breed heritage on their official Breed Day. Connect with other breed enthusiasts and honour their lineage.",
                "duration": "3 hours",
                "includes": ["Breed-themed décor", "Breed meetup coordination", "Heritage certificate", "Breed-specific treats"],
                "concierge_service": True
            },
            {
                "name": "Adoption Anniversary Ritual",
                "base_price": 1999,
                "category": "anniversary",
                "description": "Annual ritual to celebrate the bond between you and your adopted pet. Includes donation to rescue organisations.",
                "duration": "2 hours",
                "includes": ["Anniversary ceremony", "Memory update", "Rescue donation", "Certificate renewal"],
                "concierge_service": True
            },
        ]
    },
    "dine": {
        "parent_category": "fresh-food",
        "services": [
            {
                "name": "Nutrition Assessment & Meal Plan",
                "base_price": 1999,
                "category": "consultation",
                "description": "Comprehensive nutrition assessment by a certified pet nutritionist. Personalised meal plan based on breed, age, and health conditions.",
                "duration": "1 hour consultation + plan",
                "includes": ["Full assessment", "Customised meal plan", "Portion guide", "Supplement recommendations", "Follow-up call"],
                "concierge_service": True
            },
            {
                "name": "Diet Transition Support",
                "base_price": 1499,
                "category": "support",
                "description": "Guided transition to new food with monitoring and adjustments. Ideal for switching to fresh food or managing sensitivities.",
                "duration": "4 weeks",
                "includes": ["Transition schedule", "Weekly check-ins", "Adjustment support", "Emergency guidance"],
                "concierge_service": True
            },
            {
                "name": "Chef's Table Experience",
                "base_price": 4999,
                "category": "experience",
                "description": "Exclusive dining experience with a pet chef preparing a gourmet meal for your furry friend. Watch the magic happen!",
                "duration": "2 hours",
                "includes": ["Live cooking session", "5-course pet menu", "Recipe booklet", "Take-home treats"],
                "concierge_service": True
            },
            {
                "name": "Allergy Testing & Diet Planning",
                "base_price": 3999,
                "category": "health",
                "description": "Comprehensive food allergy testing with elimination diet planning. Identify triggers and create a safe meal plan.",
                "duration": "Testing + 6-week plan",
                "includes": ["Allergy panel", "Elimination diet", "Safe food list", "Recipe suggestions", "Vet coordination"],
                "concierge_service": True
            },
            {
                "name": "Home Cooking Workshop",
                "base_price": 2499,
                "category": "workshop",
                "description": "Learn to prepare nutritious homemade meals for your pet. Hands-on workshop with recipes and tips.",
                "duration": "3 hours",
                "includes": ["Recipe booklet", "Hands-on cooking", "Ingredient sourcing guide", "Nutrition basics"],
                "concierge_service": True
            },
            {
                "name": "Meal Prep Service - Weekly",
                "base_price": 1999,
                "category": "meal-prep",
                "description": "Weekly meal preparation and portioning service. Fresh meals prepared and delivered to your doorstep.",
                "duration": "Weekly",
                "includes": ["7 days of meals", "Portioned packaging", "Storage instructions", "Delivery"],
                "concierge_service": True,
                "is_subscription": True
            },
        ]
    },
    "stay": {
        "parent_category": "stay",
        "services": [
            {
                "name": "Boarding Concierge® - Standard",
                "base_price": 1499,
                "category": "boarding",
                "description": "Full-service boarding coordination with our Concierge® team. We find the perfect stay based on your pet's personality.",
                "duration": "Per night",
                "includes": ["Facility matching", "Pre-visit tour", "Daily updates", "Photo/video reports", "Pickup coordination"],
                "concierge_service": True
            },
            {
                "name": "Boarding Concierge® - Premium",
                "base_price": 2499,
                "category": "boarding",
                "description": "Premium boarding with luxury amenities. Private suite, spa treatment, and personalised attention.",
                "duration": "Per night",
                "includes": ["Private suite", "Spa treatment", "Gourmet meals", "Enrichment activities", "Live webcam access"],
                "concierge_service": True
            },
            {
                "name": "Daycare Planning & Coordination",
                "base_price": 799,
                "category": "daycare",
                "description": "Regular daycare scheduling and coordination. We manage bookings, transportation, and daily reports.",
                "duration": "Per day",
                "includes": ["Booking management", "Transportation option", "Activity planning", "Daily report"],
                "concierge_service": True
            },
            {
                "name": "Home Pet Sitter Matching",
                "base_price": 999,
                "category": "pet-sitting",
                "description": "We match you with a vetted, compatible home pet sitter. Your pet stays in a loving home environment.",
                "duration": "Per night",
                "includes": ["Sitter matching", "Home inspection", "Meet & greet", "Daily updates", "Emergency backup"],
                "concierge_service": True
            },
            {
                "name": "Extended Stay Package (7+ nights)",
                "base_price": 8999,
                "category": "boarding",
                "description": "Special package for extended stays. Includes grooming, enrichment programme, and weekly video calls.",
                "duration": "7 nights",
                "includes": ["7 nights boarding", "Grooming session", "Enrichment programme", "Weekly video call", "Departure bath"],
                "concierge_service": True
            },
            {
                "name": "Trial Stay Experience",
                "base_price": 499,
                "category": "trial",
                "description": "Short trial stay to help your pet adjust to boarding. Perfect for anxious pets or first-timers.",
                "duration": "4 hours",
                "includes": ["Facility tour", "Play session", "Meal trial", "Comfort assessment", "Recommendations"],
                "concierge_service": True
            },
        ]
    },
    "travel": {
        "parent_category": "travel",
        "services": [
            {
                "name": "Pet Travel Planning - Domestic",
                "base_price": 2999,
                "category": "planning",
                "description": "Complete domestic travel planning for you and your pet. Flight/train bookings, pet-friendly stays, and itinerary.",
                "duration": "Full trip planning",
                "includes": ["Travel research", "Booking assistance", "Pet-friendly accommodation", "Itinerary", "Emergency contacts"],
                "concierge_service": True
            },
            {
                "name": "Pet Travel Planning - International",
                "base_price": 9999,
                "category": "planning",
                "description": "Comprehensive international travel planning including documentation, quarantine requirements, and airline coordination.",
                "duration": "Full trip planning",
                "includes": ["Country requirements research", "Documentation checklist", "Airline coordination", "Quarantine planning", "Arrival assistance"],
                "concierge_service": True
            },
            {
                "name": "Pet Relocation Service - Domestic",
                "base_price": 14999,
                "category": "relocation",
                "description": "End-to-end pet relocation within India. Door-to-door service with climate-controlled transport.",
                "duration": "Varies by distance",
                "includes": ["Health check", "Travel crate", "Climate transport", "Real-time tracking", "Delivery confirmation"],
                "concierge_service": True
            },
            {
                "name": "Pet Relocation Service - International",
                "base_price": 49999,
                "category": "relocation",
                "description": "Complete international pet relocation with all documentation, customs clearance, and destination delivery.",
                "duration": "2-4 weeks",
                "includes": ["All documentation", "IATA crate", "Customs clearance", "Flight booking", "Destination pickup", "Quarantine coordination"],
                "concierge_service": True
            },
            {
                "name": "Travel Documentation Service",
                "base_price": 3999,
                "category": "documentation",
                "description": "We handle all pet travel documentation - health certificates, import permits, and airline forms.",
                "duration": "1-2 weeks",
                "includes": ["Health certificate", "Import permit assistance", "Microchip verification", "Vaccination records", "Airline forms"],
                "concierge_service": True
            },
            {
                "name": "Airport Assistance Service",
                "base_price": 1999,
                "category": "assistance",
                "description": "Personal assistance at the airport for pet check-in, security, and boarding. Reduces travel stress.",
                "duration": "Airport visit",
                "includes": ["Check-in assistance", "Security guidance", "Boarding support", "Carrier handling", "Emergency support"],
                "concierge_service": True
            },
            {
                "name": "Pet-Friendly Destination Research",
                "base_price": 999,
                "category": "research",
                "description": "Detailed research on pet-friendly destinations, activities, and accommodations for your trip.",
                "duration": "Research report",
                "includes": ["Destination guide", "Pet-friendly venues", "Vet locations", "Emergency contacts", "Local regulations"],
                "concierge_service": True
            },
        ]
    },
    "care": {
        "parent_category": "care",
        "services": [
            {
                "name": "Grooming Concierge® - Full Service",
                "base_price": 1499,
                "category": "grooming",
                "description": "Premium grooming with Concierge® coordination. We book, transport, and ensure your pet's comfort throughout.",
                "duration": "2-3 hours",
                "includes": ["Salon booking", "Transport option", "Full groom", "Spa add-ons", "Photo before/after"],
                "concierge_service": True
            },
            {
                "name": "Home Grooming Service",
                "base_price": 1999,
                "category": "grooming",
                "description": "Professional grooming in the comfort of your home. Less stress for anxious pets.",
                "duration": "2 hours",
                "includes": ["Home visit", "Full grooming", "Equipment provided", "Cleanup included"],
                "concierge_service": True
            },
            {
                "name": "Vet Appointment Coordination",
                "base_price": 499,
                "category": "health",
                "description": "We schedule and coordinate all vet appointments. Reminders, transport, and report collection included.",
                "duration": "Per appointment",
                "includes": ["Appointment booking", "Reminders", "Transport option", "Report collection", "Follow-up scheduling"],
                "concierge_service": True
            },
            {
                "name": "Wellness Programme - Annual",
                "base_price": 9999,
                "category": "wellness",
                "description": "Comprehensive annual wellness programme with scheduled check-ups, vaccinations, and preventive care.",
                "duration": "12 months",
                "includes": ["Quarterly check-ups", "Vaccination schedule", "Parasite prevention", "Dental care", "Emergency priority"],
                "concierge_service": True,
                "is_subscription": True
            },
            {
                "name": "Senior Pet Care Programme",
                "base_price": 12999,
                "category": "senior-care",
                "description": "Specialised care programme for senior pets. Enhanced monitoring, mobility support, and comfort care.",
                "duration": "12 months",
                "includes": ["Monthly check-ups", "Mobility assessment", "Pain management", "Nutrition adjustment", "Home modifications advice"],
                "concierge_service": True,
                "is_subscription": True
            },
            {
                "name": "Post-Surgery Care Coordination",
                "base_price": 2999,
                "category": "recovery",
                "description": "Complete post-surgery care coordination including medication management, wound care, and recovery monitoring.",
                "duration": "Recovery period",
                "includes": ["Medication schedule", "Wound care guidance", "Mobility support", "Vet coordination", "Emergency support"],
                "concierge_service": True
            },
        ]
    },
    "enjoy": {
        "parent_category": "accessories",
        "services": [
            {
                "name": "Playdate Coordination Service",
                "base_price": 799,
                "category": "social",
                "description": "We find compatible playmates and coordinate regular playdates for your social pup.",
                "duration": "2 hours per playdate",
                "includes": ["Compatibility matching", "Venue booking", "Supervision", "Play report"],
                "concierge_service": True
            },
            {
                "name": "Social Calendar Management",
                "base_price": 1999,
                "category": "social",
                "description": "Monthly social calendar with curated events, meetups, and activities for your pet.",
                "duration": "Monthly",
                "includes": ["Event curation", "RSVP management", "Reminders", "Transport coordination"],
                "concierge_service": True,
                "is_subscription": True
            },
            {
                "name": "Adventure Day Out",
                "base_price": 2999,
                "category": "experience",
                "description": "Curated adventure day with hiking, beach visit, or nature exploration. Supervised fun for active dogs.",
                "duration": "Full day",
                "includes": ["Activity planning", "Transport", "Meals & water", "Photography", "Safety gear"],
                "concierge_service": True
            },
            {
                "name": "Swimming Session - Pool",
                "base_price": 999,
                "category": "activity",
                "description": "Supervised swimming session at a pet pool. Great exercise and fun, especially in summer.",
                "duration": "1 hour",
                "includes": ["Pool access", "Life jacket", "Supervision", "Drying service", "Treats"],
                "concierge_service": True
            },
            {
                "name": "Enrichment Box Subscription",
                "base_price": 1499,
                "category": "enrichment",
                "description": "Monthly box of enrichment toys, puzzles, and activities tailored to your pet's preferences.",
                "duration": "Monthly",
                "includes": ["3-5 toys/puzzles", "Activity guide", "Treat samples", "Personalisation"],
                "concierge_service": True,
                "is_subscription": True
            },
            {
                "name": "Pet Café Experience",
                "base_price": 1499,
                "category": "experience",
                "description": "Special outing to a pet café with treats, playtime, and socialisation. Perfect for a pawrent-pet date.",
                "duration": "2-3 hours",
                "includes": ["Café booking", "Pet menu", "Play area access", "Photo opportunity"],
                "concierge_service": True
            },
        ]
    },
    "fit": {
        "parent_category": "fit",
        "services": [
            {
                "name": "Fitness Assessment & Programme Design",
                "base_price": 2499,
                "category": "assessment",
                "description": "Comprehensive fitness assessment with customised exercise programme based on breed, age, and goals.",
                "duration": "1 hour assessment + programme",
                "includes": ["Physical assessment", "Goal setting", "Custom programme", "Progress tracking setup", "Follow-up consultation"],
                "concierge_service": True
            },
            {
                "name": "Personal Training Programme - 8 Weeks",
                "base_price": 7999,
                "category": "training",
                "description": "Intensive 8-week personal training programme with twice-weekly sessions and progress monitoring.",
                "duration": "8 weeks",
                "includes": ["16 training sessions", "Progress tracking", "Nutrition guidance", "Home exercise plan", "Final assessment"],
                "concierge_service": True
            },
            {
                "name": "Weight Management Programme",
                "base_price": 5999,
                "category": "weight",
                "description": "Structured weight loss programme combining exercise, nutrition, and monitoring for overweight pets.",
                "duration": "12 weeks",
                "includes": ["Initial assessment", "Diet plan", "Weekly weigh-ins", "Exercise sessions", "Progress photos"],
                "concierge_service": True
            },
            {
                "name": "Hydrotherapy Sessions",
                "base_price": 1499,
                "category": "therapy",
                "description": "Therapeutic swimming sessions for rehabilitation, weight management, or low-impact exercise.",
                "duration": "45 minutes",
                "includes": ["Therapist supervision", "Warm water pool", "Gentle exercises", "Drying service"],
                "concierge_service": True
            },
            {
                "name": "Senior Mobility Programme",
                "base_price": 4999,
                "category": "senior",
                "description": "Gentle exercise programme designed for senior pets to maintain mobility and quality of life.",
                "duration": "8 weeks",
                "includes": ["Mobility assessment", "Gentle exercises", "Pain monitoring", "Home modifications advice", "Progress tracking"],
                "concierge_service": True
            },
            {
                "name": "Puppy Development Programme",
                "base_price": 3999,
                "category": "puppy",
                "description": "Age-appropriate exercise and development programme for growing puppies.",
                "duration": "12 weeks",
                "includes": ["Growth monitoring", "Safe exercises", "Socialisation", "Coordination games", "Development milestones"],
                "concierge_service": True
            },
        ]
    },
    "learn": {
        "parent_category": "learn",
        "services": [
            {
                "name": "Behaviour Assessment & Plan",
                "base_price": 2499,
                "category": "assessment",
                "description": "In-depth behaviour assessment with customised modification plan for specific issues.",
                "duration": "2 hours + plan",
                "includes": ["Home assessment", "Behaviour analysis", "Modification plan", "Training resources", "Follow-up support"],
                "concierge_service": True
            },
            {
                "name": "Private Training - Home Visit",
                "base_price": 1999,
                "category": "training",
                "description": "One-on-one training session at your home. Address specific behaviours in familiar environment.",
                "duration": "1.5 hours",
                "includes": ["Home visit", "Customised training", "Homework plan", "Video resources", "Email support"],
                "concierge_service": True
            },
            {
                "name": "Puppy Socialisation Programme",
                "base_price": 4999,
                "category": "socialisation",
                "description": "Structured socialisation programme for puppies during critical development period.",
                "duration": "6 weeks",
                "includes": ["Weekly sessions", "Exposure exercises", "Puppy playgroups", "Home guidance", "Progress report"],
                "concierge_service": True
            },
            {
                "name": "Reactivity Rehabilitation",
                "base_price": 8999,
                "category": "behaviour",
                "description": "Intensive programme for reactive dogs. Build confidence and change responses to triggers.",
                "duration": "8 weeks",
                "includes": ["Assessment", "Weekly sessions", "Controlled exposures", "Management strategies", "Emergency support"],
                "concierge_service": True
            },
            {
                "name": "Separation Anxiety Programme",
                "base_price": 5999,
                "category": "behaviour",
                "description": "Structured programme to address separation anxiety with gradual desensitisation.",
                "duration": "6 weeks",
                "includes": ["Assessment", "Desensitisation plan", "Video monitoring setup", "Weekly check-ins", "Adjustment support"],
                "concierge_service": True
            },
            {
                "name": "Canine Good Citizen Preparation",
                "base_price": 6999,
                "category": "certification",
                "description": "Preparation course for Canine Good Citizen certification. Build skills for public access.",
                "duration": "8 weeks",
                "includes": ["Skill training", "Mock tests", "Certification fee", "Certificate", "Badge"],
                "concierge_service": True
            },
        ]
    },
    "paperwork": {
        "parent_category": "paperwork",
        "services": [
            {
                "name": "Complete Registration Package",
                "base_price": 2999,
                "category": "registration",
                "description": "All-in-one registration service including municipal licence, microchip, and breed registry.",
                "duration": "2-4 weeks",
                "includes": ["Municipal registration", "Microchip implantation", "National database", "ID tag", "Certificate"],
                "concierge_service": True
            },
            {
                "name": "Breed Registration - KCI",
                "base_price": 4999,
                "category": "breed-registry",
                "description": "Complete Kennel Club of India registration with pedigree documentation.",
                "duration": "4-8 weeks",
                "includes": ["Application processing", "Document verification", "Pedigree certificate", "Registration certificate"],
                "concierge_service": True
            },
            {
                "name": "Pet Insurance Advisory",
                "base_price": 999,
                "category": "insurance",
                "description": "Compare and select the best pet insurance based on your pet's breed, age, and health history.",
                "duration": "Consultation + comparison",
                "includes": ["Needs assessment", "Policy comparison", "Application assistance", "Claim guidance"],
                "concierge_service": True
            },
            {
                "name": "Document Organisation Service",
                "base_price": 1499,
                "category": "organisation",
                "description": "We organise and digitise all your pet's documents in a secure, accessible format.",
                "duration": "One-time setup",
                "includes": ["Document collection", "Digitisation", "Secure storage", "Easy access portal", "Backup"],
                "concierge_service": True
            },
            {
                "name": "Import/Export Permit Service",
                "base_price": 7999,
                "category": "permits",
                "description": "Handle all permits and documentation for international pet movement.",
                "duration": "4-6 weeks",
                "includes": ["NOC application", "Import permit", "Health endorsement", "Customs documentation"],
                "concierge_service": True
            },
        ]
    },
    "advisory": {
        "parent_category": "advisory",
        "services": [
            {
                "name": "New Pet Parent Consultation",
                "base_price": 1499,
                "category": "consultation",
                "description": "Comprehensive consultation for new pet parents. Everything you need to know about caring for your new family member.",
                "duration": "1.5 hours",
                "includes": ["Care basics", "Nutrition guidance", "Training tips", "Health essentials", "Q&A session"],
                "concierge_service": True
            },
            {
                "name": "Breed Selection Advisory",
                "base_price": 1999,
                "category": "advisory",
                "description": "Expert guidance to choose the perfect breed based on your lifestyle, home, and preferences.",
                "duration": "Consultation + report",
                "includes": ["Lifestyle assessment", "Breed matching", "Breeder recommendations", "Preparation guide"],
                "concierge_service": True
            },
            {
                "name": "Second Opinion Service",
                "base_price": 999,
                "category": "health",
                "description": "Connect with specialist vets for second opinions on diagnoses or treatment plans.",
                "duration": "Consultation",
                "includes": ["Record review", "Specialist consultation", "Written opinion", "Follow-up guidance"],
                "concierge_service": True
            },
            {
                "name": "Multi-Pet Household Advisory",
                "base_price": 2499,
                "category": "advisory",
                "description": "Expert guidance on introducing new pets and managing multi-pet household dynamics.",
                "duration": "Assessment + plan",
                "includes": ["Home assessment", "Introduction plan", "Resource management", "Conflict prevention", "Follow-up support"],
                "concierge_service": True
            },
            {
                "name": "End-of-Life Consultation",
                "base_price": 1499,
                "category": "consultation",
                "description": "Compassionate guidance during your pet's final chapter. Quality of life assessment and care planning.",
                "duration": "1 hour",
                "includes": ["Quality assessment", "Care options", "Comfort measures", "Emotional support", "Planning guidance"],
                "concierge_service": True
            },
        ]
    },
    "emergency": {
        "parent_category": "emergency",
        "services": [
            {
                "name": "24/7 Emergency Hotline Access",
                "base_price": 2999,
                "category": "subscription",
                "description": "Annual subscription for round-the-clock emergency vet access and guidance.",
                "duration": "12 months",
                "includes": ["24/7 phone access", "Triage guidance", "Vet coordination", "Transport assistance"],
                "concierge_service": True,
                "is_subscription": True
            },
            {
                "name": "Emergency Transport Service",
                "base_price": 1999,
                "category": "transport",
                "description": "Immediate pet transport to nearest emergency vet. Available 24/7.",
                "duration": "On-demand",
                "includes": ["Immediate dispatch", "Climate-controlled vehicle", "First aid kit", "Vet coordination"],
                "concierge_service": True
            },
            {
                "name": "Lost Pet Search & Recovery",
                "base_price": 4999,
                "category": "search",
                "description": "Professional search team activated within hours. Flyers, social media, and ground search.",
                "duration": "Until found (up to 7 days)",
                "includes": ["Search team", "Flyer distribution", "Social media campaign", "Microchip alerts", "Shelter coordination"],
                "concierge_service": True
            },
            {
                "name": "Pet First Aid Training",
                "base_price": 2499,
                "category": "training",
                "description": "Learn essential pet first aid skills. Certification included.",
                "duration": "4 hours",
                "includes": ["CPR training", "Wound care", "Choking response", "Emergency kit", "Certificate"],
                "concierge_service": True
            },
        ]
    },
    "farewell": {
        "parent_category": "farewell",
        "services": [
            {
                "name": "Rainbow Bridge Ceremony - Complete",
                "base_price": 9999,
                "category": "ceremony",
                "description": "Dignified farewell ceremony with cremation, memorial service, and keepsakes.",
                "duration": "Full service",
                "includes": ["Home pickup", "Private cremation", "Memorial ceremony", "Urn", "Paw print", "Memorial photo"],
                "concierge_service": True
            },
            {
                "name": "At-Home Euthanasia Coordination",
                "base_price": 4999,
                "category": "end-of-life",
                "description": "Arrange peaceful at-home euthanasia with a compassionate vet. Dignified goodbye in familiar surroundings.",
                "duration": "Home visit",
                "includes": ["Vet coordination", "Home visit", "Comfort setup", "Family time", "Aftercare options"],
                "concierge_service": True
            },
            {
                "name": "Memorial Planning Service",
                "base_price": 2999,
                "category": "memorial",
                "description": "Complete memorial planning including keepsakes, tribute video, and remembrance options.",
                "duration": "Planning + creation",
                "includes": ["Memorial options", "Keepsake creation", "Tribute video", "Memorial garden advice"],
                "concierge_service": True
            },
            {
                "name": "Grief Support Sessions",
                "base_price": 1499,
                "category": "support",
                "description": "Professional grief counselling for pet loss. Individual or family sessions available.",
                "duration": "Per session",
                "includes": ["Professional counsellor", "Grief resources", "Coping strategies", "Ongoing support"],
                "concierge_service": True
            },
            {
                "name": "Legacy Box Creation",
                "base_price": 3999,
                "category": "keepsake",
                "description": "Beautiful legacy box with photos, fur clipping, paw print, and cherished memories preserved.",
                "duration": "2 weeks creation",
                "includes": ["Memory collection", "Photo curation", "Paw print", "Fur keepsake", "Custom box"],
                "concierge_service": True
            },
        ]
    },
    "adopt": {
        "parent_category": "adopt",
        "services": [
            {
                "name": "Adoption Counselling Session",
                "base_price": 0,
                "category": "consultation",
                "description": "Free consultation to understand your lifestyle and match you with the perfect rescue pet.",
                "duration": "1 hour",
                "includes": ["Lifestyle assessment", "Pet matching", "Shelter connections", "Preparation guide"],
                "concierge_service": True
            },
            {
                "name": "Foster-to-Adopt Programme",
                "base_price": 999,
                "category": "programme",
                "description": "Trial foster period before committing to adoption. Support throughout the transition.",
                "duration": "2 weeks",
                "includes": ["Foster setup", "Supplies provided", "Behaviour support", "Adoption guidance"],
                "concierge_service": True
            },
            {
                "name": "Rescue Dog Rehabilitation",
                "base_price": 7999,
                "category": "rehabilitation",
                "description": "Intensive rehabilitation programme for rescue dogs with trauma or behaviour challenges.",
                "duration": "8 weeks",
                "includes": ["Assessment", "Behaviour modification", "Confidence building", "Family integration", "Ongoing support"],
                "concierge_service": True
            },
            {
                "name": "Adoption Day Package",
                "base_price": 2999,
                "category": "package",
                "description": "Everything you need for adoption day - supplies, first vet visit, and settling-in support.",
                "duration": "Package + 1 month support",
                "includes": ["Starter supplies", "First vet visit", "Training session", "24/7 helpline", "Follow-up visits"],
                "concierge_service": True
            },
            {
                "name": "Senior Pet Adoption Support",
                "base_price": 1999,
                "category": "support",
                "description": "Specialised support for adopting senior pets. Health assessment and care planning included.",
                "duration": "Ongoing support",
                "includes": ["Health assessment", "Care plan", "Medication management", "Comfort advice", "Vet coordination"],
                "concierge_service": True
            },
        ]
    },
}


def generate_service_tags(pillar, service_name, category):
    """Generate appropriate tags for service"""
    tags = [pillar, "service", "concierge"]
    
    if "subscription" in category or "annual" in service_name.lower():
        tags.append("subscription")
    if "puppy" in service_name.lower():
        tags.extend(["puppy", "young-dog"])
    if "senior" in service_name.lower():
        tags.extend(["senior", "elderly"])
    if "home" in service_name.lower():
        tags.append("home-service")
    if "premium" in service_name.lower() or "luxury" in service_name.lower():
        tags.append("premium")
    
    tags.append("all-sizes")
    tags.append("all-breeds")
    
    return list(set(tags))


def generate_service_variants(base_price, service_data):
    """Generate variants for services"""
    variants = []
    
    # Check if subscription
    if service_data.get("is_subscription"):
        variants = [
            {"id": str(uuid.uuid4()), "title": "Monthly", "price": base_price, "duration": "1 month"},
            {"id": str(uuid.uuid4()), "title": "Quarterly", "price": int(base_price * 2.7), "duration": "3 months"},
            {"id": str(uuid.uuid4()), "title": "Annual", "price": int(base_price * 10), "duration": "12 months"},
        ]
    else:
        # Single service variants
        variants = [
            {"id": str(uuid.uuid4()), "title": "Standard", "price": base_price, "option1": "Standard"},
        ]
        # Add premium variant for applicable services
        if base_price >= 2000:
            variants.append({
                "id": str(uuid.uuid4()), 
                "title": "Premium", 
                "price": int(base_price * 1.5), 
                "option1": "Premium",
                "extras": ["Priority scheduling", "Extended support"]
            })
    
    return variants


async def seed_services(dry_run=True):
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("=" * 70)
    print(f"PILLAR SERVICE SEEDING {'(DRY RUN)' if dry_run else '(LIVE)'}")
    print("=" * 70)
    
    total_created = 0
    pillar_counts = {}
    
    for pillar, pillar_data in PILLAR_SERVICES.items():
        parent_category = pillar_data["parent_category"]
        services = pillar_data["services"]
        
        print(f"\n🛎️  Seeding {pillar.upper()} services ({len(services)} services)...")
        pillar_counts[pillar] = 0
        
        for service_template in services:
            # Check if service already exists
            existing = await db.products.find_one({"name": service_template["name"]})
            if existing:
                print(f"  ⏭️  Skipping '{service_template['name']}' (already exists)")
                continue
            
            # Generate service document
            service_id = f"svc-{pillar}-{str(uuid.uuid4())[:8]}"
            variants = generate_service_variants(service_template["base_price"], service_template)
            tags = generate_service_tags(pillar, service_template["name"], service_template["category"])
            
            service_doc = {
                "id": service_id,
                "name": service_template["name"],
                "description": service_template["description"],
                "price": service_template["base_price"],
                "category": service_template["category"],
                "parent_category": parent_category,
                "pillar": pillar,
                "product_type": "service",
                "tags": tags,
                "variants": variants,
                "sizes": [{"name": v["title"], "price": v["price"]} for v in variants],
                "images": [SERVICE_IMAGES.get(pillar, SERVICE_IMAGES["shop"])],
                "thumbnail": SERVICE_IMAGES.get(pillar, SERVICE_IMAGES["shop"]),
                "in_stock": True,
                "is_active": True,
                "is_service": True,
                "is_concierge_service": service_template.get("concierge_service", False),
                "is_subscription": service_template.get("is_subscription", False),
                "duration": service_template.get("duration", ""),
                "includes": service_template.get("includes", []),
                "source": "seeded",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            
            if not dry_run:
                await db.products.insert_one(service_doc)
                # Also add to unified_products
                await db.unified_products.insert_one(service_doc.copy())
            
            print(f"  ✅ Created '{service_template['name']}' (Concierge®: {service_template.get('concierge_service', False)})")
            total_created += 1
            pillar_counts[pillar] += 1
    
    print("\n" + "=" * 70)
    print("SERVICE SEEDING SUMMARY")
    print("=" * 70)
    print(f"Total services created: {total_created}")
    print("\nBy Pillar:")
    for pillar, count in pillar_counts.items():
        print(f"  {pillar}: {count}")
    
    if dry_run:
        print("\n⚠️  DRY RUN - No changes made. Run with --live to create services.")
    else:
        print("\n✅ Service seeding complete!")
    
    client.close()
    return total_created


if __name__ == "__main__":
    import sys
    dry_run = "--live" not in sys.argv
    asyncio.run(seed_services(dry_run=dry_run))
