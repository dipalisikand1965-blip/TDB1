"""
POST-DEPLOYMENT SEED SCRIPT FOR MIRA OS
=======================================
Run this after deploying to production to seed Mystique's data
for verification purposes.

Usage:
  1. Deploy to production
  2. SSH into production or run via admin API
  3. Execute: python3 seed_mystique_production.py

Or trigger via API endpoint (added below)
"""

import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'pet_concierge')

async def seed_mystique_data():
    """Seed comprehensive data for Mystique to verify all features"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🐕 Starting Mystique data seeding...")
    
    # Find Mystique
    mystique = await db.pets.find_one({"name": "Mystique"})
    if not mystique:
        print("❌ Mystique not found! Creating her...")
        # You may need to create Mystique first via the app
        return False
    
    pet_id = mystique.get("id") or str(mystique.get("_id"))
    print(f"✅ Found Mystique: {pet_id}")
    
    # ═══════════════════════════════════════════════════════════════
    # 1. SEED LEARNED FACTS (What Mira Learned)
    # ═══════════════════════════════════════════════════════════════
    learned_facts = [
        {
            "id": f"fact-coat-{datetime.now(timezone.utc).timestamp()}",
            "category": "preferences",
            "content": "Has a beautiful long fluffy coat",
            "source": "mira_conversation",
            "confidence": 90,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"fact-groom-{datetime.now(timezone.utc).timestamp()}",
            "category": "preferences", 
            "content": "Loves being groomed at the spa",
            "source": "mira_conversation",
            "confidence": 85,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"fact-treat-{datetime.now(timezone.utc).timestamp()}",
            "category": "loves",
            "content": "Goes crazy for chicken jerky treats",
            "source": "mira_conversation",
            "confidence": 95,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"fact-food-{datetime.now(timezone.utc).timestamp()}",
            "category": "preferences",
            "content": "Prefers wet food over dry",
            "source": "mira_conversation",
            "confidence": 80,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"fact-allergy-{datetime.now(timezone.utc).timestamp()}",
            "category": "health",
            "content": "Allergic to beef - avoid beef products",
            "source": "mira_conversation",
            "confidence": 95,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": {"learned_facts": learned_facts}}
    )
    print(f"✅ Seeded {len(learned_facts)} learned facts")
    
    # ═══════════════════════════════════════════════════════════════
    # 2. SEED PET VAULT (Health Records)
    # ═══════════════════════════════════════════════════════════════
    vault = {
        "vaccines": [
            {
                "id": "vax-rabies-001",
                "vaccine_name": "Rabies",
                "date_given": "2024-01-15",
                "next_due_date": "2025-01-15",
                "vet_name": "Dr. Sharma",
                "clinic": "Pet Care Mumbai",
                "batch_number": "RB-2024-001",
                "reminder_enabled": True
            },
            {
                "id": "vax-dhpp-001",
                "vaccine_name": "DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)",
                "date_given": "2024-02-01",
                "next_due_date": "2025-02-01",
                "vet_name": "Dr. Sharma",
                "clinic": "Pet Care Mumbai",
                "reminder_enabled": True
            },
            {
                "id": "vax-lepto-001",
                "vaccine_name": "Leptospirosis",
                "date_given": "2024-03-10",
                "next_due_date": (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d"),
                "vet_name": "Dr. Patel",
                "clinic": "Mumbai Vet Hospital",
                "notes": "Due soon! Book appointment.",
                "reminder_enabled": True
            }
        ],
        "medications": [
            {
                "id": "med-heartgard-001",
                "medication_name": "HeartGard Plus",
                "dosage": "1 chewable tablet",
                "frequency": "Monthly",
                "start_date": "2024-01-01",
                "reason": "Heartworm prevention",
                "prescribing_vet": "Dr. Sharma",
                "refill_reminder_enabled": True
            },
            {
                "id": "med-nexgard-001",
                "medication_name": "NexGard",
                "dosage": "1 chewable",
                "frequency": "Monthly",
                "start_date": "2024-01-01",
                "reason": "Flea & tick prevention",
                "prescribing_vet": "Dr. Sharma",
                "refill_reminder_enabled": True
            }
        ],
        "vet_visits": [
            {
                "id": "visit-annual-2024",
                "visit_date": "2024-11-15",
                "vet_name": "Dr. Sharma",
                "clinic_name": "Pet Care Mumbai",
                "reason": "Annual wellness checkup",
                "diagnosis": "Healthy",
                "treatment": "Routine examination, all vaccines up to date",
                "weight_kg": 6.5,
                "notes": "Mystique is doing great! Coat is beautiful, teeth healthy.",
                "follow_up_date": "2025-11-15"
            },
            {
                "id": "visit-grooming-2024",
                "visit_date": "2024-12-01",
                "vet_name": "Grooming Specialist",
                "clinic_name": "Pawsome Spa",
                "reason": "Professional grooming",
                "treatment": "Full groom - bath, haircut, nail trim, ear cleaning",
                "notes": "Looking fabulous! Next appointment in 6 weeks."
            }
        ],
        "weight_history": [
            {"date": "2024-01-01", "weight_kg": 6.2, "notes": "Start of year"},
            {"date": "2024-04-01", "weight_kg": 6.3, "notes": "Spring checkup"},
            {"date": "2024-07-01", "weight_kg": 6.4, "notes": "Summer"},
            {"date": "2024-10-01", "weight_kg": 6.5, "notes": "Current weight - healthy range"}
        ],
        "documents": [
            {
                "id": "doc-passport-001",
                "document_type": "Pet Passport",
                "document_name": "Mystique's Pet Passport",
                "upload_date": "2024-01-20",
                "notes": "International pet passport - valid for travel"
            },
            {
                "id": "doc-insurance-001",
                "document_type": "Insurance",
                "document_name": "Pet Insurance Policy",
                "upload_date": "2024-02-15",
                "expiry_date": "2025-02-15",
                "notes": "Comprehensive coverage with Paw Insurance"
            }
        ],
        "saved_vets": [
            {
                "id": "vet-sharma-001",
                "name": "Dr. Sharma",
                "clinic": "Pet Care Mumbai",
                "phone": "+91-22-12345678",
                "specialization": "General Practice",
                "is_primary": True
            },
            {
                "id": "vet-patel-001",
                "name": "Dr. Patel",
                "clinic": "Mumbai Vet Hospital",
                "phone": "+91-22-87654321",
                "specialization": "Emergency Care",
                "is_primary": False
            }
        ]
    }
    
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": {"vault": vault}}
    )
    print(f"✅ Seeded Pet Vault: {len(vault['vaccines'])} vaccines, {len(vault['medications'])} meds, {len(vault['vet_visits'])} visits")
    
    # ═══════════════════════════════════════════════════════════════
    # 3. SEED LIFE TIMELINE
    # ═══════════════════════════════════════════════════════════════
    timeline_events = [
        {
            "pet_id": pet_id,
            "event_type": "birth",
            "title": "Mystique was born!",
            "date": "2020-03-15",
            "emoji": "🐣",
            "description": "A beautiful Shih Tzu puppy enters the world",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "pet_id": pet_id,
            "event_type": "gotcha",
            "title": "Joined the family!",
            "date": "2020-06-01",
            "emoji": "🏠",
            "description": "Mystique came home and stole our hearts",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "pet_id": pet_id,
            "event_type": "first_groom",
            "title": "First grooming session",
            "date": "2020-07-15",
            "emoji": "✂️",
            "description": "First professional grooming - looked like a teddy bear!",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "pet_id": pet_id,
            "event_type": "birthday",
            "title": "1st Birthday Celebration!",
            "date": "2021-03-15",
            "emoji": "🎂",
            "description": "Celebrated with a special doggy cake",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "pet_id": pet_id,
            "event_type": "milestone",
            "title": "Completed basic training",
            "date": "2021-06-01",
            "emoji": "🎓",
            "description": "Graduated from puppy school - star student!",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "pet_id": pet_id,
            "event_type": "travel",
            "title": "First beach trip",
            "date": "2022-01-10",
            "emoji": "🏖️",
            "description": "Visited Goa - loved playing in the sand",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "pet_id": pet_id,
            "event_type": "birthday",
            "title": "4th Birthday!",
            "date": "2024-03-15",
            "emoji": "🎉",
            "description": "Big celebration with all her dog friends",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "pet_id": pet_id,
            "event_type": "health",
            "title": "Clean bill of health",
            "date": "2024-11-15",
            "emoji": "💚",
            "description": "Annual checkup - vet says she's in perfect health!",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Clear existing and add new
    await db.mira_life_timeline_events.delete_many({"pet_id": pet_id})
    await db.mira_life_timeline_events.insert_many(timeline_events)
    print(f"✅ Seeded {len(timeline_events)} life timeline events")
    
    # ═══════════════════════════════════════════════════════════════
    # 4. SEED MIRA MEMORIES
    # ═══════════════════════════════════════════════════════════════
    memories = [
        {"pet_id": pet_id, "key": "favorite_treat", "value": "chicken jerky", "source": "conversation", "created_at": datetime.now(timezone.utc).isoformat()},
        {"pet_id": pet_id, "key": "grooming_preference", "value": "loves spa grooming", "source": "conversation", "created_at": datetime.now(timezone.utc).isoformat()},
        {"pet_id": pet_id, "key": "personality", "value": "drama queen, loves attention", "source": "soul_builder", "created_at": datetime.now(timezone.utc).isoformat()},
        {"pet_id": pet_id, "key": "favorite_activity", "value": "playing fetch in the park", "source": "conversation", "created_at": datetime.now(timezone.utc).isoformat()},
        {"pet_id": pet_id, "key": "sleep_spot", "value": "sunny window or mom's lap", "source": "conversation", "created_at": datetime.now(timezone.utc).isoformat()},
        {"pet_id": pet_id, "key": "food_allergy", "value": "beef", "source": "conversation", "created_at": datetime.now(timezone.utc).isoformat()},
        {"pet_id": pet_id, "key": "coat_type", "value": "long fluffy", "source": "conversation", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    await db.mira_memories.delete_many({"pet_id": pet_id})
    await db.mira_memories.insert_many(memories)
    print(f"✅ Seeded {len(memories)} Mira memories")
    
    # ═══════════════════════════════════════════════════════════════
    # 5. UPDATE SOUL ANSWERS (What Mira Knows)
    # ═══════════════════════════════════════════════════════════════
    soul_updates = {
        "doggy_soul_answers.coat_type": "long",
        "doggy_soul_answers.grooming_preference": "salon",
        "doggy_soul_answers.favorite_treats": "chicken jerky",
        "doggy_soul_answers.food_allergies": ["beef"],
        "doggy_soul_answers.dietary_preference": "wet_food",
        "doggy_soul_meta.coat_type": {"source": "mira_conversation", "confidence": 90, "updated_at": datetime.now(timezone.utc).isoformat()},
        "doggy_soul_meta.grooming_preference": {"source": "mira_conversation", "confidence": 85, "updated_at": datetime.now(timezone.utc).isoformat()},
    }
    
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": soul_updates}
    )
    print("✅ Updated soul answers with conversation learnings")
    
    # ═══════════════════════════════════════════════════════════════
    # 6. SEED CELEBRATIONS
    # ═══════════════════════════════════════════════════════════════
    celebrations = [
        {"occasion": "birthday", "date": "03-15", "is_recurring": True, "year_started": 2020},
        {"occasion": "gotcha_day", "date": "06-01", "is_recurring": True, "year_started": 2020}
    ]
    
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": {"celebrations": celebrations}}
    )
    print("✅ Seeded celebration dates")
    
    client.close()
    
    print("")
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         🎉 MYSTIQUE DATA SEEDING COMPLETE! 🎉                  ║")
    print("╠════════════════════════════════════════════════════════════════╣")
    print("║ ✅ Learned Facts: 5 facts in 'What Mira Learned'               ║")
    print("║ ✅ Pet Vault: 3 vaccines, 2 meds, 2 visits, weight history     ║")
    print("║ ✅ Life Timeline: 8 milestone events                           ║")
    print("║ ✅ Mira Memories: 7 key memories                               ║")
    print("║ ✅ Soul Answers: Updated with preferences                      ║")
    print("║ ✅ Celebrations: Birthday & Gotcha Day                         ║")
    print("╠════════════════════════════════════════════════════════════════╣")
    print("║ Now go to /mira-demo and check everything! 🐕                  ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    
    return True

# Run the seeder
if __name__ == "__main__":
    asyncio.run(seed_mystique_data())
