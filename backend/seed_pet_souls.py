"""
Mira OS - Pet Soul Seeding Script
=================================
Seeds realistic pets and doggy soul answers for all pets in the system.
This ensures the Mira OS has real data to work with.

Run with: python3 seed_pet_souls.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import uuid

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "thedoggycompany")

# User to associate pets with
USER_EMAIL = "dipali@clubconcierge.in"

# Realistic seed data for each pet
PET_SOUL_SEEDS = {
    "Lola": {
        "id": "pet-e6348b13c975",
        "breed": "Maltese",
        "species": "dog",
        "age_years": 5,
        "gender": "female",
        "photo_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
        "answers": {
            # Identity & Temperament
            "describe_3_words": "Playful, Loving, Energetic",
            "general_nature": "Playful",
            "stranger_reaction": "Friendly",
            "loud_sounds": "Mildly anxious",
            "social_preference": "Being mostly with you",
            "handling_comfort": "Very comfortable",
            
            # Family & Pack
            "lives_with": ["Adults only", "Other dogs"],
            "behavior_with_dogs": "Loves all dogs",
            "most_attached_to": "Me",
            "attention_seeking": "Yes",
            
            # Rhythm & Routine
            "walks_per_day": "2",
            "energetic_time": "Morning",
            "sleep_location": "Your bed",
            "alone_comfort": "Sometimes anxious",
            "separation_anxiety": "Mild",
            
            # Home Comforts
            "favorite_item": "Toy",
            "space_preference": "Quiet spaces",
            "crate_trained": "Yes",
            "car_rides": "Loves them",
            
            # Travel Style
            "usual_travel": "Car",
            "hotel_experience": "Yes, loved it",
            "stay_preference": "Pet-friendly resort",
            "travel_social": "Social pet areas",
            
            # Taste & Treat World
            "diet_type": "Non-vegetarian",
            "food_allergies": ["No"],
            "favorite_treats": ["Biscuits", "Jerky"],
            "sensitive_stomach": "No",
            
            # Training & Behaviour
            "training_level": "Fully trained",
            "training_response": "Treats",
            "leash_behavior": "Rarely",
            "barking": "Occasionally",
            
            # Long Horizon
            "main_wish": ["Good health", "More travel experiences"],
            "help_needed": ["Travel planning", "Grooming routines"],
            "dream_life": "A happy, healthy life full of adventures with her family",
            "celebration_preferences": ["Birthday", "Diwali", "Christmas"]
        }
    },
    "Mystique": {
        "id": "pet-mystique-001",
        "breed": "Shihtzu",
        "species": "dog",
        "age_years": 3,
        "gender": "female",
        "photo_url": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop",
        "answers": {
            "describe_3_words": "Curious, Sweet, Gentle",
            "general_nature": "Curious",
            "stranger_reaction": "Cautious",
            "loud_sounds": "Very anxious",
            "social_preference": "Being mostly with you",
            "handling_comfort": "Sometimes uncomfortable",
            
            "lives_with": ["Adults only"],
            "behavior_with_dogs": "Selective friends",
            "most_attached_to": "Partner",
            "attention_seeking": "Sometimes",
            
            "walks_per_day": "2",
            "energetic_time": "Evening",
            "sleep_location": "Their own bed",
            "alone_comfort": "Sometimes anxious",
            "separation_anxiety": "Moderate",
            
            "favorite_item": "Blanket",
            "space_preference": "Quiet spaces",
            "crate_trained": "No",
            "car_rides": "Neutral",
            
            "usual_travel": "Car",
            "hotel_experience": "No",
            "stay_preference": "Quiet, nature hotel",
            "travel_social": "Private spaces",
            
            "diet_type": "Mixed",
            "food_allergies": ["Chicken"],
            "favorite_treats": ["Biscuits", "Homemade food"],
            "sensitive_stomach": "Yes",
            
            "training_level": "Partially trained",
            "training_response": "Praise",
            "leash_behavior": "Sometimes",
            "barking": "Yes",
            
            "main_wish": ["Good health", "More training"],
            "help_needed": ["Behaviour training", "Diet planning"],
            "dream_life": "A calm, peaceful life with lots of cuddles",
            "celebration_preferences": ["Birthday", "Gotcha Day (Adoption Anniversary)"]
        }
    },
    "Bruno": {
        "id": "pet-bruno-001",
        "breed": "Labrador",
        "species": "dog",
        "age_years": 2,
        "gender": "male",
        "photo_url": "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=400&fit=crop",
        "answers": {
            "describe_3_words": "Energetic, Friendly, Goofy",
            "general_nature": "Highly energetic",
            "stranger_reaction": "Friendly",
            "loud_sounds": "Completely fine",
            "social_preference": "Being around other dogs",
            "handling_comfort": "Very comfortable",
            
            "lives_with": ["Adults only", "Children", "Other dogs"],
            "behavior_with_dogs": "Loves all dogs",
            "most_attached_to": "Everyone equally",
            "attention_seeking": "Yes",
            
            "walks_per_day": "3+",
            "energetic_time": "Morning",
            "sleep_location": "Sofa / floor",
            "alone_comfort": "Yes, comfortably",
            "separation_anxiety": "No",
            
            "favorite_item": "Toy",
            "space_preference": "Outdoor time",
            "crate_trained": "Yes",
            "car_rides": "Loves them",
            
            "usual_travel": "Car",
            "hotel_experience": "Yes, loved it",
            "stay_preference": "Pet-friendly resort",
            "travel_social": "Social pet areas",
            
            "diet_type": "Non-vegetarian",
            "food_allergies": ["No"],
            "favorite_treats": ["Jerky", "Fresh fruits"],
            "sensitive_stomach": "No",
            
            "training_level": "Partially trained",
            "training_response": "Treats",
            "leash_behavior": "Always",
            "barking": "Occasionally",
            
            "main_wish": ["More training", "More social time with other dogs"],
            "help_needed": ["Behaviour training"],
            "dream_life": "Running free in parks every day and making new dog friends",
            "celebration_preferences": ["Birthday", "Holi", "Independence Day"]
        }
    },
    "Luna": {
        "id": "pet-luna-001",
        "breed": "Golden Retriever",
        "species": "dog",
        "age_years": 4,
        "gender": "female",
        "photo_url": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop",
        "answers": {
            "describe_3_words": "Gentle, Smart, Loyal",
            "general_nature": "Calm",
            "stranger_reaction": "Friendly",
            "loud_sounds": "Mildly anxious",
            "social_preference": "Being around people",
            "handling_comfort": "Very comfortable",
            
            "lives_with": ["Adults only", "Children"],
            "behavior_with_dogs": "Loves all dogs",
            "most_attached_to": "Children",
            "attention_seeking": "Sometimes",
            
            "walks_per_day": "2",
            "energetic_time": "Afternoon",
            "sleep_location": "Their own bed",
            "alone_comfort": "Yes, comfortably",
            "separation_anxiety": "No",
            
            "favorite_item": "Toy",
            "space_preference": "Indoor time",
            "crate_trained": "Yes",
            "car_rides": "Loves them",
            
            "usual_travel": "Car",
            "hotel_experience": "Yes, loved it",
            "stay_preference": "Homestay / villa",
            "travel_social": "Social pet areas",
            
            "diet_type": "Mixed",
            "food_allergies": ["No"],
            "favorite_treats": ["Cakes", "Fresh fruits"],
            "sensitive_stomach": "Sometimes",
            
            "training_level": "Fully trained",
            "training_response": "Praise",
            "leash_behavior": "Rarely",
            "barking": "Rarely",
            
            "main_wish": ["Good health", "More travel experiences"],
            "help_needed": ["Travel planning", "Diet planning"],
            "dream_life": "Being the best companion to my family, especially the kids",
            "celebration_preferences": ["Birthday", "Christmas", "New Year"]
        }
    },
    "Buddy": {
        "id": "pet-buddy-001",
        "breed": "Golden Retriever",
        "species": "dog",
        "age_years": 6,
        "gender": "male",
        "photo_url": "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&h=400&fit=crop",
        "answers": {
            "describe_3_words": "Wise, Calm, Affectionate",
            "general_nature": "Calm",
            "stranger_reaction": "Friendly",
            "loud_sounds": "Completely fine",
            "social_preference": "Being around people",
            "handling_comfort": "Very comfortable",
            
            "lives_with": ["Adults only"],
            "behavior_with_dogs": "Selective friends",
            "most_attached_to": "Me",
            "attention_seeking": "Sometimes",
            
            "walks_per_day": "2",
            "energetic_time": "Evening",
            "sleep_location": "Your bed",
            "alone_comfort": "Yes, comfortably",
            "separation_anxiety": "No",
            
            "favorite_item": "Bed",
            "space_preference": "Quiet spaces",
            "crate_trained": "Yes",
            "car_rides": "Neutral",
            
            "usual_travel": "Car",
            "hotel_experience": "Yes, loved it",
            "stay_preference": "Quiet, nature hotel",
            "travel_social": "Private spaces",
            
            "diet_type": "Non-vegetarian",
            "food_allergies": ["Grains"],
            "favorite_treats": ["Jerky", "Homemade food"],
            "sensitive_stomach": "Sometimes",
            
            "training_level": "Fully trained",
            "training_response": "Praise",
            "leash_behavior": "Rarely",
            "barking": "Rarely",
            
            "main_wish": ["Good health"],
            "help_needed": ["Diet planning", "Grooming routines"],
            "dream_life": "Peaceful days with good food and lots of belly rubs",
            "celebration_preferences": ["Birthday", "Diwali", "New Year"]
        }
    },
    "Meister": {
        "id": "pet-meister-001",
        "breed": "Shih Tzu",
        "species": "dog",
        "age_years": 1,
        "gender": "male",
        "photo_url": "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400&h=400&fit=crop",
        "answers": {
            "describe_3_words": "Playful, Mischievous, Adorable",
            "general_nature": "Playful",
            "stranger_reaction": "Cautious",
            "loud_sounds": "Needs comfort",
            "social_preference": "Being mostly with you",
            "handling_comfort": "Sometimes uncomfortable",
            
            "lives_with": ["Adults only"],
            "behavior_with_dogs": "Nervous",
            "most_attached_to": "Me",
            "attention_seeking": "Yes",
            
            "walks_per_day": "1",
            "energetic_time": "Evening",
            "sleep_location": "Your bed",
            "alone_comfort": "Not at all",
            "separation_anxiety": "Severe",
            
            "favorite_item": "Toy",
            "space_preference": "Indoor time",
            "crate_trained": "In training",
            "car_rides": "Anxious",
            
            "usual_travel": "Never travels",
            "hotel_experience": "No",
            "stay_preference": "Homestay / villa",
            "travel_social": "Private spaces",
            
            "diet_type": "Mixed",
            "food_allergies": ["No"],
            "favorite_treats": ["Biscuits", "Homemade food"],
            "sensitive_stomach": "Yes",
            
            "training_level": "Not trained",
            "training_response": "Treats",
            "leash_behavior": "Always",
            "barking": "Yes",
            
            "main_wish": ["More training", "Good health"],
            "help_needed": ["Behaviour training", "Grooming routines"],
            "dream_life": "Grow up to be a confident, happy dog",
            "celebration_preferences": ["Birthday"]
        }
    }
}


def calculate_folder_score(answers: dict, folder_questions: list) -> float:
    """Calculate completion score for a folder (0-100)"""
    if not folder_questions:
        return 0
    
    total_weight = sum(q["weight"] for q in folder_questions)
    answered_weight = 0
    
    for q in folder_questions:
        if q["id"] in answers and answers[q["id"]] is not None and answers[q["id"]] != "":
            answered_weight += q["weight"]
    
    return round((answered_weight / total_weight) * 100, 1) if total_weight > 0 else 0


def calculate_overall_score(answers: dict, question_bank: dict) -> float:
    """Calculate overall Doggy Soul score (0-100)"""
    folder_scores = []
    for folder_key, folder_data in question_bank.items():
        score = calculate_folder_score(answers, folder_data.get("questions", []))
        folder_scores.append(score)
    
    return round(sum(folder_scores) / len(folder_scores), 1) if folder_scores else 0


# Question bank structure (copied from pet_soul_routes.py)
DOGGY_SOUL_QUESTIONS = {
    "identity_temperament": {
        "name": "Identity & Temperament",
        "questions": [
            {"id": "describe_3_words", "weight": 3},
            {"id": "general_nature", "weight": 4},
            {"id": "stranger_reaction", "weight": 3},
            {"id": "loud_sounds", "weight": 4},
            {"id": "social_preference", "weight": 3},
            {"id": "handling_comfort", "weight": 3},
        ]
    },
    "family_pack": {
        "name": "Family & Pack",
        "questions": [
            {"id": "lives_with", "weight": 3},
            {"id": "behavior_with_dogs", "weight": 4},
            {"id": "most_attached_to", "weight": 2},
            {"id": "attention_seeking", "weight": 2},
        ]
    },
    "rhythm_routine": {
        "name": "Rhythm & Routine",
        "questions": [
            {"id": "walks_per_day", "weight": 3},
            {"id": "energetic_time", "weight": 2},
            {"id": "sleep_location", "weight": 2},
            {"id": "alone_comfort", "weight": 4},
            {"id": "separation_anxiety", "weight": 5},
        ]
    },
    "home_comforts": {
        "name": "Home Comforts",
        "questions": [
            {"id": "favorite_item", "weight": 2},
            {"id": "space_preference", "weight": 3},
            {"id": "crate_trained", "weight": 4},
            {"id": "car_rides", "weight": 4},
        ]
    },
    "travel_style": {
        "name": "Travel Style",
        "questions": [
            {"id": "usual_travel", "weight": 3},
            {"id": "hotel_experience", "weight": 3},
            {"id": "stay_preference", "weight": 3},
            {"id": "travel_social", "weight": 2},
        ]
    },
    "taste_treat": {
        "name": "Taste & Treat World",
        "questions": [
            {"id": "diet_type", "weight": 4},
            {"id": "food_allergies", "weight": 5},
            {"id": "favorite_treats", "weight": 3},
            {"id": "sensitive_stomach", "weight": 4},
        ]
    },
    "training_behaviour": {
        "name": "Training & Behaviour",
        "questions": [
            {"id": "training_level", "weight": 3},
            {"id": "training_response", "weight": 3},
            {"id": "leash_behavior", "weight": 2},
            {"id": "barking", "weight": 2},
        ]
    },
    "long_horizon": {
        "name": "Long Horizon",
        "questions": [
            {"id": "main_wish", "weight": 2},
            {"id": "help_needed", "weight": 2},
            {"id": "dream_life", "weight": 3},
            {"id": "celebration_preferences", "weight": 3},
        ]
    }
}


async def seed_pet_souls():
    """Seed all pet souls with realistic data"""
    print("=" * 60)
    print("MIRA OS - PET SOUL SEEDING")
    print("=" * 60)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get all pets
    pets_cursor = db.pets.find({}, {"_id": 0, "id": 1, "name": 1})
    pets = await pets_cursor.to_list(length=100)
    
    print(f"\nFound {len(pets)} pets in database")
    
    seeded_count = 0
    
    for pet in pets:
        pet_id = pet.get("id")
        pet_name = pet.get("name")
        
        if pet_name in PET_SOUL_SEEDS:
            seed_data = PET_SOUL_SEEDS[pet_name]
            answers = seed_data["answers"]
            
            # Calculate scores
            folder_scores = {}
            for folder_key, folder_data in DOGGY_SOUL_QUESTIONS.items():
                folder_scores[folder_key] = calculate_folder_score(answers, folder_data["questions"])
            
            overall_score = calculate_overall_score(answers, DOGGY_SOUL_QUESTIONS)
            
            # Update pet with soul data
            update_data = {
                "doggy_soul_answers": answers,
                "soul_score": overall_score,
                "folder_scores": folder_scores,
                "soul_seeded_at": datetime.now(timezone.utc).isoformat(),
                "soul_seeded": True
            }
            
            result = await db.pets.update_one(
                {"id": pet_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                print(f"  ✅ {pet_name}: Soul Score = {overall_score}%")
                seeded_count += 1
            else:
                print(f"  ⚠️ {pet_name}: No changes made")
        else:
            print(f"  ⏭️ {pet_name}: No seed data available")
    
    print(f"\n{'=' * 60}")
    print(f"SEEDING COMPLETE: {seeded_count}/{len(pets)} pets updated")
    print(f"{'=' * 60}")
    
    # Verify
    print("\n📊 VERIFICATION:")
    for pet in pets:
        updated_pet = await db.pets.find_one({"id": pet["id"]}, {"_id": 0, "name": 1, "soul_score": 1})
        if updated_pet:
            score = updated_pet.get("soul_score", 0)
            print(f"  • {updated_pet.get('name')}: {score}%")
    
    client.close()
    print("\n✅ Done!")


if __name__ == "__main__":
    asyncio.run(seed_pet_souls())
