"""
Pet Soul Enrichment Script
===========================
Populates pets with comprehensive soul data across all pillars for testing.
This will help identify gaps in our data capture and recalibrate the onboarding soul score.
"""

import os
import sys
sys.path.insert(0, '/app/backend')

from pymongo import MongoClient
from datetime import datetime, timezone
import json

# Connect to database
client = MongoClient('mongodb://localhost:27017')
db = client['test_database']

# Comprehensive pet profiles with rich data across all pillars
PET_ENRICHMENT_DATA = {
    # =====================================================
    # MYSTIQUE - The Senior with Health Conditions
    # Owner: dipali@clubconcierge.in
    # =====================================================
    "Mystique": {
        "owner_email": "dipali@clubconcierge.in",
        "breed": "Shihtzu",
        "doggy_soul_answers": {
            # Identity
            "name": "Mystique",
            "breed": "Shihtzu",
            "gender": "female",
            "age": "8 years",
            "weight": "6.5 kg",
            "size": "small",
            
            # Health & Medical (Critical for Health-First Rule testing)
            "allergies": ["chicken", "wheat"],
            "medical_conditions": ["arthritis", "early-stage cataracts"],
            "medications": ["joint supplement daily", "eye drops twice weekly"],
            "sensitive_stomach": True,
            "dietary_restrictions": ["no chicken", "grain-free only"],
            "vaccination_status": "up to date",
            "spayed_neutered": True,
            "last_vet_visit": "2026-01-15",
            
            # Personality & Temperament
            "general_nature": "calm and gentle",
            "energy_level": "low to moderate",
            "stranger_reaction": "shy at first, warms up slowly",
            "behavior_with_dogs": "selective, prefers calm dogs",
            "behavior_with_humans": "loves gentle handling, dislikes loud voices",
            "separation_anxiety": "mild - okay for 4-5 hours",
            
            # Fears & Triggers (Critical for Emergency/Advisory)
            "anxiety_triggers": ["thunderstorms", "fireworks", "vacuum cleaner"],
            "loud_sounds": "very sensitive - needs comfort during storms",
            "fear_response": "hides under furniture, trembles",
            
            # Preferences
            "favorite_treats": ["peanut butter biscuits", "lamb jerky", "banana chips"],
            "favorite_toys": ["squeaky lamb", "rope tug", "puzzle feeders"],
            "favorite_activities": ["gentle walks", "sunbathing", "belly rubs"],
            "dislikes": ["baths", "nail trimming", "being picked up suddenly"],
            "diet_type": "non-vegetarian",
            "food_brand": "Royal Canin Senior",
            "feeding_schedule": "twice daily - 7am and 6pm",
            
            # Travel & Comfort
            "travel_style": "prefers car over flight",
            "car_comfort": "loves short rides, gets anxious on long trips",
            "motion_sickness": "occasional on winding roads",
            "crate_trained": True,
            "hotel_experience": "has stayed at pet-friendly hotels before",
            "flight_experience": "never flown, would need sedation consultation",
            
            # Training & Behavior
            "training_level": "well trained - knows basic commands",
            "commands_known": ["sit", "stay", "come", "down", "leave it"],
            "leash_behavior": "walks well, slight pulling when excited",
            "potty_trained": True,
            "crate_behavior": "comfortable for up to 3 hours",
            
            # Social & Lifestyle
            "daily_routine": "morning walk, nap, evening play, bedtime at 9pm",
            "sleeping_spot": "dog bed in bedroom",
            "exercise_needs": "20-30 min gentle walk twice daily",
            "grooming_frequency": "professional grooming every 6 weeks",
            "last_grooming": "2026-02-01",
            
            # Special Notes
            "special_needs": "needs ramp for couch due to arthritis",
            "emergency_contact": "Dr. Sharma - +91-9876543210",
            "vet_clinic": "PetCare Plus, Mumbai",
            "insurance": "covered under PetAssure Gold",
        },
        "soul_enrichments": {
            "learned_facts": [
                {"fact": "hates fireworks - needs calming treats", "source": "conversation", "date": "2026-01-20"},
                {"fact": "loves peanut butter more than anything", "source": "order_history", "date": "2026-01-15"},
                {"fact": "arthritis flares up in cold weather", "source": "conversation", "date": "2026-02-01"},
            ],
            "dislikes": ["chicken", "wheat", "loud noises", "being picked up"],
            "preferences_learned": {
                "treat_texture": "soft (easier on senior teeth)",
                "walk_time": "early morning when cooler",
                "play_style": "gentle, no rough play",
            }
        },
        "overall_score": 85.0,
        "score_tier": "soul_mate"
    },
    
    # =====================================================
    # LOLA - The Glamorous Social Butterfly
    # Owner: dipali@clubconcierge.in  
    # =====================================================
    "Lola": {
        "owner_email": "dipali@clubconcierge.in",
        "breed": "Maltese",
        "doggy_soul_answers": {
            # Identity
            "name": "Lola",
            "breed": "Maltese",
            "gender": "female",
            "age": "3 years",
            "weight": "3.2 kg",
            "size": "small",
            
            # Health & Medical
            "allergies": ["beef", "corn"],
            "medical_conditions": ["tear staining (cosmetic)"],
            "medications": ["tear stain supplement"],
            "sensitive_stomach": False,
            "dietary_restrictions": ["no beef"],
            "vaccination_status": "up to date",
            "spayed_neutered": True,
            "last_vet_visit": "2026-02-10",
            
            # Personality & Temperament
            "general_nature": "playful and outgoing",
            "energy_level": "high",
            "stranger_reaction": "friendly and excited",
            "behavior_with_dogs": "loves playing with all dogs",
            "behavior_with_humans": "social butterfly, loves attention",
            "separation_anxiety": "moderate - maximum 3 hours alone",
            
            # Fears & Triggers
            "anxiety_triggers": ["being alone too long", "car honks"],
            "loud_sounds": "startles but recovers quickly",
            "fear_response": "barks, seeks comfort",
            
            # Preferences  
            "favorite_treats": ["chicken jerky", "cheese cubes", "carrot sticks"],
            "favorite_toys": ["plush unicorn", "ball", "squeaky toys"],
            "favorite_activities": ["fetch", "meeting new dogs", "photo sessions"],
            "dislikes": ["rain", "getting wet", "being ignored"],
            "diet_type": "non-vegetarian",
            "food_brand": "Orijen Small Breed",
            "feeding_schedule": "three times daily - small portions",
            
            # Travel & Comfort
            "travel_style": "loves both car and carrier",
            "car_comfort": "excellent - enjoys car rides",
            "motion_sickness": "none",
            "crate_trained": True,
            "hotel_experience": "seasoned traveler, adapts well",
            "flight_experience": "has flown twice in cabin",
            
            # Training & Behavior
            "training_level": "intermediate - learning new tricks",
            "commands_known": ["sit", "paw", "spin", "come", "stay"],
            "leash_behavior": "good but pulls toward other dogs",
            "potty_trained": True,
            "crate_behavior": "comfortable, sees it as safe space",
            
            # Social & Lifestyle
            "daily_routine": "active mornings, afternoon nap, evening play dates",
            "sleeping_spot": "owner's bed",
            "exercise_needs": "45 min active play daily",
            "grooming_frequency": "weekly bath, daily brushing",
            "last_grooming": "2026-02-15",
            
            # Special Notes
            "special_needs": "coat requires daily maintenance",
            "emergency_contact": "Dr. Mehta - +91-9988776655",
            "vet_clinic": "Happy Tails Clinic, Mumbai",
            "instagram_handle": "@lola_the_maltese",
        },
        "soul_enrichments": {
            "learned_facts": [
                {"fact": "loves photo sessions and posing", "source": "conversation", "date": "2026-02-01"},
                {"fact": "gets anxious when left alone more than 3 hours", "source": "conversation", "date": "2026-01-25"},
                {"fact": "prefers chicken over all other proteins", "source": "order_history", "date": "2026-02-10"},
            ],
            "dislikes": ["beef", "corn", "rain", "being ignored"],
            "preferences_learned": {
                "treat_texture": "crunchy",
                "social_preference": "loves dog parks",
                "grooming_tolerance": "high - enjoys being pampered",
            }
        },
        "overall_score": 78.0,
        "score_tier": "best_friend"
    },
    
    # =====================================================
    # MEISTER - The Anxious Senior Needing Special Care
    # Owner: dipali@clubconcierge.in
    # =====================================================
    "Meister": {
        "owner_email": "dipali@clubconcierge.in",
        "breed": "Shih Tzu",
        "doggy_soul_answers": {
            # Identity
            "name": "Meister",
            "breed": "Shih Tzu",
            "gender": "male",
            "age": "10 years",
            "weight": "7 kg",
            "size": "small",
            
            # Health & Medical (Complex case for testing)
            "allergies": ["soy", "dairy", "artificial colors"],
            "medical_conditions": ["heart murmur grade 2", "dental disease", "luxating patella"],
            "medications": ["heart medication twice daily", "dental chews daily"],
            "sensitive_stomach": True,
            "dietary_restrictions": ["low sodium", "no dairy", "no soy"],
            "vaccination_status": "up to date with senior protocol",
            "spayed_neutered": True,
            "last_vet_visit": "2026-02-05",
            
            # Personality & Temperament
            "general_nature": "gentle and reserved",
            "energy_level": "low",
            "stranger_reaction": "cautious, prefers familiar people",
            "behavior_with_dogs": "tolerates calm dogs only",
            "behavior_with_humans": "bonds deeply with family",
            "separation_anxiety": "severe - cannot be left alone",
            
            # Fears & Triggers (Critical for testing)
            "anxiety_triggers": ["strangers", "loud noises", "vet visits", "car rides", "new environments"],
            "loud_sounds": "extremely sensitive - needs anxiety medication for fireworks",
            "fear_response": "hides, refuses to eat, trembles for hours",
            
            # Preferences
            "favorite_treats": ["freeze-dried liver", "sweet potato chews"],
            "favorite_toys": ["old blanket", "stuffed bear (comfort item)"],
            "favorite_activities": ["lap time", "gentle brushing", "watching birds"],
            "dislikes": ["baths", "strangers touching him", "being rushed"],
            "diet_type": "non-vegetarian",
            "food_brand": "Hill's Prescription Diet Heart Care",
            "feeding_schedule": "small meals 4 times daily",
            
            # Travel & Comfort
            "travel_style": "prefers staying home",
            "car_comfort": "anxious, needs calming aids",
            "motion_sickness": "yes - requires medication",
            "crate_trained": False,
            "hotel_experience": "stressful - only with familiar caretaker",
            "flight_experience": "not recommended due to heart condition",
            
            # Training & Behavior
            "training_level": "basic commands, selective compliance",
            "commands_known": ["sit", "come"],
            "leash_behavior": "slow walker, frequent stops",
            "potty_trained": True,
            "crate_behavior": "refuses crate, causes panic",
            
            # Social & Lifestyle
            "daily_routine": "very predictable schedule required",
            "sleeping_spot": "heated dog bed next to owner",
            "exercise_needs": "short 10-15 min walks only",
            "grooming_frequency": "gentle grooming at home only",
            "last_grooming": "2026-02-12",
            
            # Special Notes
            "special_needs": "requires constant companionship, anxiety management",
            "emergency_contact": "Cardiologist Dr. Kapoor - +91-9111222333",
            "vet_clinic": "Advanced Pet Care, Mumbai",
            "do_not_recommend": ["boarding", "daycare", "group activities", "air travel"],
        },
        "soul_enrichments": {
            "learned_facts": [
                {"fact": "heart condition - no strenuous activity", "source": "medical_record", "date": "2026-01-01"},
                {"fact": "severe separation anxiety - needs company always", "source": "conversation", "date": "2026-02-01"},
                {"fact": "old stuffed bear is essential comfort item", "source": "conversation", "date": "2026-01-15"},
            ],
            "dislikes": ["soy", "dairy", "strangers", "loud noises", "being alone", "new places"],
            "preferences_learned": {
                "handling": "very gentle only",
                "routine": "strict schedule essential",
                "companionship": "cannot be left alone ever",
            }
        },
        "overall_score": 92.0,
        "score_tier": "soul_mate"
    },
    
    # =====================================================
    # BRUNO - The Active Young Dog
    # Owner: dipali@clubconcierge.in
    # =====================================================
    "Bruno": {
        "owner_email": "dipali@clubconcierge.in", 
        "breed": "Labrador",
        "doggy_soul_answers": {
            # Identity
            "name": "Bruno",
            "breed": "Labrador",
            "gender": "male",
            "age": "2 years",
            "weight": "28 kg",
            "size": "large",
            
            # Health & Medical
            "allergies": [],
            "medical_conditions": [],
            "medications": [],
            "sensitive_stomach": False,
            "dietary_restrictions": [],
            "vaccination_status": "up to date",
            "spayed_neutered": True,
            "last_vet_visit": "2026-01-20",
            
            # Personality & Temperament
            "general_nature": "energetic and friendly",
            "energy_level": "very high",
            "stranger_reaction": "overly friendly, jumps up",
            "behavior_with_dogs": "loves all dogs, very playful",
            "behavior_with_humans": "enthusiastic greeter",
            "separation_anxiety": "none - independent",
            
            # Fears & Triggers
            "anxiety_triggers": ["none known"],
            "loud_sounds": "curious rather than scared",
            "fear_response": "investigates sounds",
            
            # Preferences
            "favorite_treats": ["anything edible", "chicken", "cheese", "carrots"],
            "favorite_toys": ["tennis balls", "frisbee", "tug rope"],
            "favorite_activities": ["swimming", "fetch", "running", "hiking"],
            "dislikes": ["being confined", "missing walks"],
            "diet_type": "non-vegetarian",
            "food_brand": "Pedigree Pro Large Breed",
            "feeding_schedule": "twice daily - large portions",
            
            # Travel & Comfort
            "travel_style": "adventure ready",
            "car_comfort": "loves car rides, window watcher",
            "motion_sickness": "none",
            "crate_trained": True,
            "hotel_experience": "adapts easily anywhere",
            "flight_experience": "not yet, suitable for cargo",
            
            # Training & Behavior
            "training_level": "intermediate - still learning impulse control",
            "commands_known": ["sit", "stay", "come", "fetch", "down", "shake"],
            "leash_behavior": "pulls when excited, needs work",
            "potty_trained": True,
            "crate_behavior": "comfortable but prefers freedom",
            
            # Social & Lifestyle
            "daily_routine": "morning run, daytime rest, evening play",
            "sleeping_spot": "anywhere comfortable",
            "exercise_needs": "minimum 2 hours daily",
            "grooming_frequency": "weekly bath, daily brush during shedding",
            "last_grooming": "2026-02-08",
            
            # Special Notes
            "special_needs": "needs lots of exercise to prevent destructive behavior",
            "emergency_contact": "Dr. Singh - +91-9444555666",
            "vet_clinic": "City Vet Hospital, Mumbai",
            "good_for": ["hiking", "swimming", "running partner", "active family"],
        },
        "soul_enrichments": {
            "learned_facts": [
                {"fact": "needs 2+ hours exercise or gets destructive", "source": "conversation", "date": "2026-01-25"},
                {"fact": "loves swimming more than any other activity", "source": "conversation", "date": "2026-02-05"},
                {"fact": "will eat literally anything - watch carefully", "source": "order_history", "date": "2026-02-01"},
            ],
            "dislikes": ["being cooped up", "missing exercise"],
            "preferences_learned": {
                "activity_level": "high intensity",
                "treat_motivation": "extremely food motivated",
                "social_style": "loves everyone",
            }
        },
        "overall_score": 65.0,
        "score_tier": "best_friend"
    },
    
    # =====================================================
    # LUNA - The Balanced Family Dog
    # Owner: dipali@clubconcierge.in
    # =====================================================
    "Luna": {
        "owner_email": "dipali@clubconcierge.in",
        "breed": "Golden Retriever",
        "doggy_soul_answers": {
            # Identity
            "name": "Luna",
            "breed": "Golden Retriever",
            "gender": "female",
            "age": "4 years",
            "weight": "25 kg",
            "size": "large",
            
            # Health & Medical
            "allergies": ["grain"],
            "medical_conditions": ["mild hip dysplasia"],
            "medications": ["glucosamine supplement"],
            "sensitive_stomach": True,
            "dietary_restrictions": ["grain-free"],
            "vaccination_status": "up to date",
            "spayed_neutered": True,
            "last_vet_visit": "2026-02-01",
            
            # Personality & Temperament
            "general_nature": "gentle and patient",
            "energy_level": "moderate",
            "stranger_reaction": "friendly but calm",
            "behavior_with_dogs": "excellent with all dogs",
            "behavior_with_humans": "especially good with children",
            "separation_anxiety": "mild - okay for 6 hours",
            
            # Fears & Triggers
            "anxiety_triggers": ["fireworks", "thunderstorms"],
            "loud_sounds": "seeks comfort but manageable",
            "fear_response": "stays close to family",
            
            # Preferences
            "favorite_treats": ["salmon treats", "apple slices", "pumpkin cookies"],
            "favorite_toys": ["plush duck", "rope toys", "puzzle feeders"],
            "favorite_activities": ["swimming", "hiking", "cuddling"],
            "dislikes": ["vacuum cleaner", "being alone during storms"],
            "diet_type": "non-vegetarian",
            "food_brand": "Acana Grain-Free",
            "feeding_schedule": "twice daily",
            
            # Travel & Comfort
            "travel_style": "great travel companion",
            "car_comfort": "excellent",
            "motion_sickness": "none",
            "crate_trained": True,
            "hotel_experience": "well-behaved in hotels",
            "flight_experience": "has flown cargo once",
            
            # Training & Behavior
            "training_level": "well trained",
            "commands_known": ["sit", "stay", "come", "down", "heel", "place", "leave it"],
            "leash_behavior": "excellent loose leash walking",
            "potty_trained": True,
            "crate_behavior": "views crate as safe space",
            
            # Social & Lifestyle
            "daily_routine": "balanced schedule, adapts well",
            "sleeping_spot": "dog bed in living room",
            "exercise_needs": "1 hour moderate exercise daily",
            "grooming_frequency": "weekly brush, monthly bath",
            "last_grooming": "2026-02-10",
            
            # Special Notes
            "special_needs": "joint-friendly exercise, no high jumps",
            "emergency_contact": "Dr. Patel - +91-9777888999",
            "vet_clinic": "Golden Care Vet, Mumbai",
            "good_for": ["family with kids", "therapy work", "moderate activity"],
        },
        "soul_enrichments": {
            "learned_facts": [
                {"fact": "hip dysplasia - avoid stairs and jumps", "source": "medical_record", "date": "2026-01-15"},
                {"fact": "amazing with children", "source": "conversation", "date": "2026-02-01"},
                {"fact": "grain allergy discovered after digestive issues", "source": "medical_record", "date": "2025-06-01"},
            ],
            "dislikes": ["grain", "high-impact exercise", "loud noises"],
            "preferences_learned": {
                "exercise_type": "swimming preferred (easy on joints)",
                "family_role": "gentle guardian",
                "diet": "strictly grain-free",
            }
        },
        "overall_score": 88.0,
        "score_tier": "soul_mate"
    },
}


def enrich_pets():
    """Update pets with comprehensive soul data."""
    
    print("=" * 60)
    print("PET SOUL ENRICHMENT SCRIPT")
    print("=" * 60)
    
    updated_count = 0
    errors = []
    
    for pet_name, enrichment_data in PET_ENRICHMENT_DATA.items():
        owner_email = enrichment_data.get("owner_email")
        breed = enrichment_data.get("breed")
        
        # Find the pet
        query = {"name": pet_name, "owner_email": owner_email}
        if breed:
            query["breed"] = {"$regex": breed, "$options": "i"}
        
        pet = db.pets.find_one(query)
        
        if not pet:
            # Try without breed filter
            pet = db.pets.find_one({"name": pet_name, "owner_email": owner_email})
        
        if not pet:
            print(f"[SKIP] Pet not found: {pet_name} ({owner_email})")
            errors.append(f"Pet not found: {pet_name}")
            continue
        
        # Build update
        update_data = {
            "doggy_soul_answers": enrichment_data["doggy_soul_answers"],
            "overall_score": enrichment_data.get("overall_score", 50.0),
            "score_tier": enrichment_data.get("score_tier", "newcomer"),
            "updated_at": datetime.now(timezone.utc),
        }
        
        # Add soul enrichments if present
        if "soul_enrichments" in enrichment_data:
            if pet.get("soul"):
                update_data["soul"] = {**(pet.get("soul") or {}), **enrichment_data["soul_enrichments"]}
            else:
                update_data["soul"] = enrichment_data["soul_enrichments"]
        
        # Update the pet
        result = db.pets.update_one(
            {"_id": pet["_id"]},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            print(f"[OK] Updated: {pet_name} ({owner_email})")
            print(f"     - Soul fields: {len(enrichment_data['doggy_soul_answers'])} fields")
            print(f"     - Score: {update_data['overall_score']} ({update_data['score_tier']})")
            updated_count += 1
        else:
            print(f"[WARN] No changes for: {pet_name}")
    
    print("\n" + "=" * 60)
    print(f"SUMMARY: Updated {updated_count} pets")
    if errors:
        print(f"ERRORS: {len(errors)} pets not found")
        for err in errors:
            print(f"  - {err}")
    print("=" * 60)
    
    return updated_count, errors


def print_field_coverage():
    """Analyze what fields we're capturing vs what we should capture."""
    
    print("\n" + "=" * 60)
    print("SOUL FIELD COVERAGE ANALYSIS")
    print("=" * 60)
    
    # All possible fields from SOUL_FIELD_MAPPING
    all_fields = {
        "identity": ["name", "breed", "age", "weight", "size", "gender"],
        "health": ["allergies", "medical_conditions", "sensitive_stomach", "dietary_restrictions", 
                   "medications", "vaccination_status", "spayed_neutered", "last_vet_visit"],
        "personality": ["general_nature", "energy_level", "stranger_reaction", "behavior_with_dogs",
                       "behavior_with_humans", "separation_anxiety"],
        "fears": ["anxiety_triggers", "loud_sounds", "fear_response"],
        "preferences": ["favorite_treats", "favorite_toys", "favorite_activities", "dislikes",
                       "diet_type", "food_brand", "feeding_schedule"],
        "travel": ["travel_style", "car_comfort", "motion_sickness", "crate_trained", 
                   "hotel_experience", "flight_experience"],
        "training": ["training_level", "commands_known", "leash_behavior", "potty_trained", "crate_behavior"],
        "lifestyle": ["daily_routine", "sleeping_spot", "exercise_needs", "grooming_frequency", "last_grooming"],
        "special": ["special_needs", "emergency_contact", "vet_clinic", "do_not_recommend", "good_for"]
    }
    
    total_fields = sum(len(fields) for fields in all_fields.values())
    
    print(f"\nTotal comprehensive fields: {total_fields}")
    print("\nField categories:")
    for category, fields in all_fields.items():
        print(f"  {category.upper()}: {len(fields)} fields")
        for field in fields:
            print(f"    - {field}")
    
    # Check actual coverage in database
    print("\n" + "-" * 40)
    print("CURRENT DATABASE COVERAGE")
    print("-" * 40)
    
    pets = list(db.pets.find({"owner_email": "dipali@clubconcierge.in"}))
    
    for pet in pets:
        name = pet.get("name", "Unknown")
        soul_answers = pet.get("doggy_soul_answers") or {}
        filled_fields = len([k for k, v in soul_answers.items() if v and k != "_canonical_migration_v1"])
        
        print(f"\n{name}: {filled_fields}/{total_fields} fields filled ({filled_fields/total_fields*100:.1f}%)")
        
        # Check which categories are missing
        for category, fields in all_fields.items():
            filled = [f for f in fields if soul_answers.get(f)]
            if len(filled) < len(fields):
                missing = [f for f in fields if f not in filled]
                print(f"  {category}: {len(filled)}/{len(fields)} - Missing: {', '.join(missing[:3])}{'...' if len(missing) > 3 else ''}")


if __name__ == "__main__":
    # Run enrichment
    updated, errors = enrich_pets()
    
    # Show coverage analysis
    print_field_coverage()
    
    print("\n[DONE] Pet enrichment complete!")
    print("Now you can test across all pillars with rich data.")
