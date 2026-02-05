"""
Update existing services with Mira whispers based on service name/category
This updates services that don't have breed_whispers yet
"""

# Default whispers by service type keywords
DEFAULT_WHISPERS_BY_KEYWORD = {
    # Grooming related
    "grooming": {
        "default": "Professional grooming for a healthy, beautiful coat",
        "shih_tzu": "Shih Tzus need grooming every 4-6 weeks for their flowing coat",
        "golden_retriever": "Regular grooming keeps Golden coats shiny and manageable",
        "labrador": "Deshedding included to manage Lab's double coat",
        "pug": "Facial fold cleaning included for Pugs"
    },
    "bath": {
        "default": "Refreshing bath for a clean, happy companion",
        "shih_tzu": "Gentle bath products for Shih Tzu's sensitive skin",
        "golden_retriever": "Deep cleaning for active Golden coats",
        "labrador": "Removes outdoor dirt Labs love to collect"
    },
    "spa": {
        "default": "Relaxation and pampering they deserve",
        "shih_tzu": "Royal treatment for your regal companion",
        "pug": "Facial care and wrinkle cleaning included"
    },
    "nail": {
        "default": "Keep paws healthy and comfortable",
        "shih_tzu": "Regular trims prevent paw issues in small breeds"
    },
    "dental": {
        "default": "Maintain fresh breath and healthy teeth",
        "shih_tzu": "Small breeds are prone to dental issues - essential care",
        "pug": "Dental care crucial for brachycephalic breeds"
    },
    
    # Training related
    "training": {
        "default": "Professional training to build confidence and good behavior",
        "golden_retriever": "Goldens are eager learners - they'll excel!",
        "labrador": "Food-motivated Labs respond great to positive reinforcement",
        "shih_tzu": "Gentle approach for sensitive companions",
        "german_shepherd": "GSDs thrive with mental stimulation and challenges",
        "beagle": "Scent-based rewards work well for Beagles"
    },
    "obedience": {
        "default": "Build a well-mannered, responsive companion",
        "german_shepherd": "GSDs excel with structured training",
        "golden_retriever": "Goldens love learning new commands"
    },
    "puppy": {
        "default": "Foundation training for lifelong good behavior",
        "shih_tzu": "Gentle approach for sensitive Shih Tzu puppies",
        "german_shepherd": "Early training sets up GSD puppies for success"
    },
    "agility": {
        "default": "Fun exercise that strengthens your bond",
        "golden_retriever": "Retrievers are natural athletes in agility",
        "labrador": "Great way to burn Lab energy!"
    },
    
    # Boarding/Stay related
    "boarding": {
        "default": "A safe, loving home away from home",
        "golden_retriever": "Social Goldens thrive with playmates",
        "shih_tzu": "Quiet, comfortable environment for sensitive pets",
        "pug": "Climate-controlled essential for flat-faced breeds",
        "beagle": "Secure facility - Beagles can be escape artists!"
    },
    "daycare": {
        "default": "Supervised play and socialization",
        "golden_retriever": "Group play is ideal for friendly Goldens",
        "labrador": "Perfect for energetic Labs who need exercise",
        "shih_tzu": "Small group settings for smaller breeds"
    },
    "sitting": {
        "default": "Personalized care in familiar surroundings",
        "shih_tzu": "Less stressful for anxiety-prone small breeds"
    },
    
    # Fitness related
    "swimming": {
        "default": "Low-impact exercise that dogs love",
        "golden_retriever": "Retrievers are natural swimmers - their happy place!",
        "labrador": "Labs are water babies - perfect exercise",
        "pug": "Supervised shallow water for flat-faced breeds"
    },
    "walking": {
        "default": "Daily exercise and mental stimulation",
        "beagle": "Extra sniff time for scent-loving Beagles",
        "golden_retriever": "Active walks for energetic Retrievers",
        "labrador": "Vigorous walks to burn Lab energy",
        "shih_tzu": "Gentle pace walks for smaller breeds",
        "pug": "Short, shaded routes for flat-faced breeds"
    },
    "fitness": {
        "default": "Customized fitness plan for optimal health",
        "labrador": "Weight management focus for Labs",
        "pug": "Activity level tailored for brachycephalic needs"
    },
    "hydrotherapy": {
        "default": "Therapeutic exercise for recovery and mobility",
        "golden_retriever": "Excellent for Retriever joint health",
        "labrador": "Helps Labs maintain mobility",
        "german_shepherd": "Supports hip health in German Shepherds"
    },
    
    # Travel related
    "travel": {
        "default": "Stress-free journeys for your companion",
        "pug": "Climate-controlled transport for sensitive breeds"
    },
    "taxi": {
        "default": "Safe, comfortable transportation",
        "pug": "Climate-controlled vehicle for flat-faced breeds"
    },
    "airport": {
        "default": "Seamless airport experience for your pet",
        "pug": "Special handling for brachycephalic breeds"
    },
    "relocation": {
        "default": "Complete relocation support",
        "pug": "Climate considerations for sensitive breeds"
    },
    
    # Health/Vet related
    "vet": {
        "default": "Professional health care and prevention",
        "golden_retriever": "Joint screening included for Retrievers",
        "labrador": "Weight monitoring important for Labs",
        "pug": "Breathing assessment for flat-faced breeds",
        "german_shepherd": "Hip focus for German Shepherds"
    },
    "vaccination": {
        "default": "Keep your companion protected and healthy"
    },
    "checkup": {
        "default": "Preventive care for a healthy, happy life"
    },
    "health": {
        "default": "Professional health monitoring and care"
    },
    
    # Celebration related
    "birthday": {
        "default": "Make their special day unforgettable",
        "golden_retriever": "Goldens love parties - they'll be the perfect host!",
        "labrador": "Food-focused Labs will love the cake!"
    },
    "party": {
        "default": "Celebrate with your furry friend"
    },
    "photography": {
        "default": "Capture beautiful memories together",
        "shih_tzu": "Shih Tzus are natural models",
        "golden_retriever": "Capture that Golden smile",
        "pug": "Adorable Pug expressions in every frame"
    },
    "celebrate": {
        "default": "Make milestones memorable"
    },
    
    # Advisory related
    "nutrition": {
        "default": "Personalized diet plan for optimal health",
        "labrador": "Weight management strategies for food-loving Labs",
        "pug": "Diet plan to prevent weight issues"
    },
    "consultation": {
        "default": "Expert guidance for your companion's needs"
    },
    "counseling": {
        "default": "Professional support and guidance"
    },
    
    # Emergency related  
    "emergency": {
        "default": "Expert help when you need it most",
        "pug": "Breathing emergency protocol for flat-faced breeds"
    },
    "helpline": {
        "default": "Immediate expert help available 24/7"
    },
    
    # Adoption related
    "adopt": {
        "default": "Find your perfect companion match"
    },
    "foster": {
        "default": "Try before you commit to ensure the perfect match"
    },
    "matching": {
        "default": "Find the perfect companion for your lifestyle"
    },
    
    # Farewell related
    "cremation": {
        "default": "A dignified farewell for your beloved companion"
    },
    "memorial": {
        "default": "Honor the love you shared together"
    },
    "grief": {
        "default": "We're here for you during this difficult time"
    },
    
    # Paperwork related
    "registration": {
        "default": "Hassle-free compliance with local regulations"
    },
    "microchip": {
        "default": "Peace of mind if your pet ever gets lost",
        "beagle": "Essential for escape-prone breeds like Beagles"
    },
    "passport": {
        "default": "All papers in order for worry-free travel"
    },
    "insurance": {
        "default": "Find the right coverage for your companion"
    },
    "certificate": {
        "default": "Official documentation made easy"
    }
}


async def update_existing_services_with_whispers(db):
    """Update existing services that don't have breed_whispers"""
    from datetime import datetime, timezone
    
    now = datetime.now(timezone.utc)
    updated = 0
    skipped = 0
    
    # Get all services
    services = await db.services_master.find({}).to_list(2000)
    
    for service in services:
        # Skip if already has breed_whispers with content
        existing_whispers = service.get("breed_whispers", {})
        if existing_whispers and existing_whispers.get("default"):
            skipped += 1
            continue
        
        service_name = (service.get("name", "") or "").lower()
        
        # Find matching whispers based on keywords in service name
        best_match = None
        for keyword, whispers in DEFAULT_WHISPERS_BY_KEYWORD.items():
            if keyword in service_name:
                best_match = whispers
                break
        
        if not best_match:
            # Try pillar-based fallback
            pillar = service.get("pillar", "")
            pillar_fallbacks = {
                "care": {"default": "Professional care for your companion"},
                "stay": {"default": "Safe, comfortable stay for your pet"},
                "learn": {"default": "Expert training and guidance"},
                "fit": {"default": "Keep your companion healthy and active"},
                "travel": {"default": "Stress-free travel solutions"},
                "celebrate": {"default": "Make special moments memorable"},
                "advisory": {"default": "Expert guidance for pet parents"},
                "emergency": {"default": "Help when you need it most"},
                "farewell": {"default": "Compassionate support during difficult times"},
                "adopt": {"default": "Find your perfect companion"},
                "paperwork": {"default": "Simplify pet documentation"},
            }
            best_match = pillar_fallbacks.get(pillar, {"default": "Curated for your companion"})
        
        # Update the service
        await db.services_master.update_one(
            {"_id": service["_id"]},
            {
                "$set": {
                    "breed_whispers": best_match,
                    "mira_whisper": best_match.get("default", "Curated for your companion"),
                    "updated_at": now
                }
            }
        )
        updated += 1
    
    return {"updated": updated, "skipped": skipped, "total": len(services)}


# Add endpoint to service_box_routes.py
if __name__ == "__main__":
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    
    async def main():
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(mongo_url)
        db = client["pawfect"]
        
        result = await update_existing_services_with_whispers(db)
        print(f"Update complete: {result}")
    
    asyncio.run(main())
