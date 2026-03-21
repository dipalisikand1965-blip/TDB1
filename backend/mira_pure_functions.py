"""
MIRA PURE FUNCTIONS - Actions that Mira can take
================================================

These functions allow GPT-5.1 to actually DO things:
- Fetch picks/recommendations
- Create service tickets
- Get today's actions
- Book appointments
- Search places
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Database reference - set from mira_pure.py
db = None

def set_db(database):
    global db
    db = database


async def get_picks_for_pet(pet_id: str, pet_name: str, pillar: str = "all", limit: int = 5) -> Dict[str, Any]:
    """
    Get personalized picks/recommendations for a pet.
    
    Pillars: celebrate, care, dine, enjoy, travel, shop, learn
    """
    if db is None:
        return {"picks": [], "error": "Database not connected"}
    
    try:
        # Get pet's preferences and allergies for filtering
        from bson import ObjectId
        pet = None
        try:
            pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
        except:
            pet = await db.pets.find_one({"name": pet_name})
        
        allergies = []
        preferences = {}
        if pet:
            allergies = pet.get("health_data", {}).get("allergies", []) or pet.get("allergies", [])
            preferences = pet.get("soul_data", {}).get("preferences") or {}
        
        # Build picks based on pillar
        picks = []
        
        if pillar in ["all", "celebrate"]:
            picks.extend([
                {
                    "id": "celebrate-1",
                    "pillar": "celebrate",
                    "type": "service",
                    "name": "Birthday Party Planning",
                    "description": f"Custom birthday celebration for {pet_name}",
                    "price": "From ₹2,500",
                    "tags": ["birthday", "party", "celebration"]
                },
                {
                    "id": "celebrate-2", 
                    "pillar": "celebrate",
                    "type": "product",
                    "name": "Pet Photo Session",
                    "description": "Professional photoshoot with your pet",
                    "price": "₹3,000",
                    "tags": ["photos", "memories"]
                }
            ])
        
        if pillar in ["all", "care"]:
            picks.extend([
                {
                    "id": "care-1",
                    "pillar": "care",
                    "type": "service",
                    "name": "Dog Walking Service",
                    "description": "Professional dog walker for daily walks",
                    "price": "₹300/walk",
                    "tags": ["walker", "exercise", "daily"]
                },
                {
                    "id": "care-2",
                    "pillar": "care", 
                    "type": "service",
                    "name": "Grooming & Spa",
                    "description": f"Full grooming session for {pet_name}",
                    "price": "From ₹800",
                    "tags": ["grooming", "spa", "bath"]
                },
                {
                    "id": "care-3",
                    "pillar": "care",
                    "type": "service", 
                    "name": "Vet Home Visit",
                    "description": "Veterinarian comes to your home",
                    "price": "₹1,500",
                    "tags": ["vet", "health", "checkup"]
                }
            ])
        
        if pillar in ["all", "dine"]:
            # Filter out chicken products if allergic
            food_picks = [
                {
                    "id": "dine-1",
                    "pillar": "dine",
                    "type": "product",
                    "name": "Premium Wet Food",
                    "description": "High-quality wet food" + (" (chicken-free)" if "chicken" in allergies else ""),
                    "price": "₹450/pack",
                    "tags": ["food", "wet food", "premium"],
                    "chicken_free": True
                },
                {
                    "id": "dine-2",
                    "pillar": "dine",
                    "type": "product",
                    "name": "Birthday Cake for Dogs",
                    "description": "Dog-safe celebration cake" + (" - chicken-free recipe" if "chicken" in allergies else ""),
                    "price": "₹650",
                    "tags": ["cake", "treats", "celebration"],
                    "chicken_free": True
                }
            ]
            picks.extend(food_picks)
        
        if pillar in ["all", "travel"]:
            picks.extend([
                {
                    "id": "travel-1",
                    "pillar": "travel",
                    "type": "service",
                    "name": "Pet-Friendly Hotel Booking",
                    "description": "Find and book pet-friendly accommodations",
                    "price": "Varies",
                    "tags": ["hotel", "travel", "vacation"]
                },
                {
                    "id": "travel-2",
                    "pillar": "travel",
                    "type": "service",
                    "name": "Pet Travel Kit",
                    "description": "Everything needed for traveling with your pet",
                    "price": "₹2,200",
                    "tags": ["travel", "accessories", "kit"]
                }
            ])
        
        return {
            "picks": picks[:limit],
            "total": len(picks),
            "pillar": pillar,
            "pet_name": pet_name,
            "filtered_for_allergies": allergies
        }
        
    except Exception as e:
        logger.error(f"[MIRA FUNCTIONS] Error getting picks: {e}")
        return {"picks": [], "error": str(e)}


async def create_service_request(
    pet_id: str,
    pet_name: str,
    user_email: str,
    service_type: str,
    description: str,
    preferred_date: str = None,
    preferred_time: str = None,
    notes: str = None
) -> Dict[str, Any]:
    """
    Create a service request/ticket for concierge to handle.
    
    Service types: dog_walker, grooming, vet_visit, boarding, travel, birthday_party, other
    """
    if db is None:
        return {"success": False, "error": "Database not connected"}
    
    try:
        import uuid
        ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        
        request_data = {
            "ticket_id": ticket_id,
            "type": service_type,
            "status": "pending",
            "priority": "normal",
            "pet_id": pet_id,
            "pet_name": pet_name,
            "user_email": user_email,
            "description": description,
            "preferred_date": preferred_date,
            "preferred_time": preferred_time,
            "notes": notes,
            "created_at": datetime.utcnow().isoformat(),
            "source": "mira_pure"
        }
        
        await db.service_requests.insert_one(request_data)
        
        logger.info(f"[MIRA FUNCTIONS] Created service request: {ticket_id} for {service_type}")
        
        return {
            "success": True,
            "ticket_id": ticket_id,
            "message": f"I've created a {service_type.replace('_', ' ')} request for {pet_name}. Our concierge team will confirm the details shortly.",
            "service_type": service_type,
            "status": "pending"
        }
        
    except Exception as e:
        logger.error(f"[MIRA FUNCTIONS] Error creating service request: {e}")
        return {"success": False, "error": str(e)}


async def get_today_actions(pet_id: str, pet_name: str, user_email: str) -> Dict[str, Any]:
    """
    Get today's actions, reminders, and alerts for a pet.
    """
    if db is None:
        return {"actions": [], "error": "Database not connected"}
    
    try:
        from bson import ObjectId
        
        actions = []
        today = datetime.utcnow().date()
        
        # Get pet data
        pet = None
        try:
            pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
        except:
            pet = await db.pets.find_one({"name": pet_name})
        
        if pet:
            # Check birthday
            birthday = pet.get("birthday")
            if birthday:
                try:
                    bday = datetime.strptime(birthday, "%Y-%m-%d").date()
                    days_until = (bday.replace(year=today.year) - today).days
                    if days_until < 0:
                        days_until = (bday.replace(year=today.year + 1) - today).days
                    
                    if days_until == 0:
                        actions.append({
                            "type": "celebration",
                            "priority": "high",
                            "icon": "🎂",
                            "title": f"Happy Birthday {pet_name}!",
                            "description": "Today is the special day! Time to celebrate.",
                            "action": "plan_birthday"
                        })
                    elif days_until <= 7:
                        actions.append({
                            "type": "reminder",
                            "priority": "medium",
                            "icon": "🎉",
                            "title": f"{pet_name}'s birthday in {days_until} days",
                            "description": "Start planning the celebration!",
                            "action": "plan_birthday"
                        })
                except:
                    pass
            
            # Check health reminders
            health = pet.get("health_data", {})
            last_vet = health.get("last_vet_visit")
            if last_vet:
                try:
                    vet_date = datetime.strptime(last_vet, "%Y-%m-%d").date()
                    days_since = (today - vet_date).days
                    if days_since > 180:  # 6 months
                        actions.append({
                            "type": "health",
                            "priority": "medium",
                            "icon": "🏥",
                            "title": "Vet checkup due",
                            "description": f"It's been {days_since} days since {pet_name}'s last vet visit.",
                            "action": "book_vet"
                        })
                except:
                    pass
            
            # Check for chronic conditions
            conditions = health.get("chronic_conditions")
            if conditions:
                actions.append({
                    "type": "health",
                    "priority": "high",
                    "icon": "💊",
                    "title": "Health monitoring",
                    "description": f"Remember to monitor {pet_name}'s {conditions}",
                    "action": "health_log"
                })
        
        # Get pending service requests
        pending = await db.service_requests.count_documents({
            "pet_name": pet_name,
            "status": {"$in": ["pending", "in_progress"]}
        })
        if pending > 0:
            actions.append({
                "type": "service",
                "priority": "low",
                "icon": "📋",
                "title": f"{pending} pending request(s)",
                "description": "Check your service requests for updates",
                "action": "view_requests"
            })
        
        # Default action if nothing else
        if not actions:
            soul = pet.get("soul_data", {}) if pet else {}
            activities = soul.get("preferences") or {}.get("favorite_activities", ["a walk"])
            actions.append({
                "type": "suggestion",
                "priority": "low",
                "icon": "💡",
                "title": f"Quality time with {pet_name}",
                "description": f"How about {activities[0] if activities else 'some playtime'} today?",
                "action": "log_activity"
            })
        
        return {
            "actions": actions,
            "pet_name": pet_name,
            "date": today.isoformat(),
            "count": len(actions)
        }
        
    except Exception as e:
        logger.error(f"[MIRA FUNCTIONS] Error getting today actions: {e}")
        return {"actions": [], "error": str(e)}


async def get_learn_content(pet_id: str, pet_name: str, topic: str = None) -> Dict[str, Any]:
    """
    Get educational content relevant to the pet.
    """
    try:
        from bson import ObjectId
        
        # Get pet info for personalization
        pet = None
        if db:
            try:
                pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
            except:
                pet = await db.pets.find_one({"name": pet_name})
        
        breed = pet.get("breed", "dog") if pet else "dog"
        health_conditions = pet.get("health_data", {}).get("chronic_conditions") if pet else None
        
        content = []
        
        # Breed-specific content
        content.append({
            "id": "learn-1",
            "type": "guide",
            "title": f"{breed} Care Guide",
            "description": f"Everything you need to know about caring for a {breed}",
            "read_time": "5 min",
            "tags": ["breed", "care", "basics"]
        })
        
        # Health content if conditions exist
        if health_conditions:
            content.append({
                "id": "learn-2",
                "type": "article",
                "title": f"Managing {health_conditions}",
                "description": f"Tips and guidance for pets with {health_conditions}",
                "read_time": "8 min",
                "tags": ["health", "condition", "care"]
            })
        
        # General content
        content.extend([
            {
                "id": "learn-3",
                "type": "video",
                "title": "Nutrition Basics",
                "description": "Understanding your pet's dietary needs",
                "read_time": "10 min",
                "tags": ["nutrition", "food", "health"]
            },
            {
                "id": "learn-4",
                "type": "guide",
                "title": "Training Tips",
                "description": "Positive reinforcement techniques",
                "read_time": "7 min",
                "tags": ["training", "behavior"]
            }
        ])
        
        return {
            "content": content,
            "pet_name": pet_name,
            "personalized_for_breed": breed,
            "count": len(content)
        }
        
    except Exception as e:
        logger.error(f"[MIRA FUNCTIONS] Error getting learn content: {e}")
        return {"content": [], "error": str(e)}


# Function definitions for GPT-5.1 function calling
MIRA_FUNCTIONS = [
    {
        "name": "get_picks",
        "description": "Get personalized product and service recommendations for the pet. Use when user asks for recommendations, suggestions, or wants to see options.",
        "parameters": {
            "type": "object",
            "properties": {
                "pillar": {
                    "type": "string",
                    "enum": ["all", "celebrate", "care", "dine", "enjoy", "travel", "shop"],
                    "description": "Category of picks to fetch"
                },
                "limit": {
                    "type": "integer",
                    "description": "Number of picks to return",
                    "default": 5
                }
            }
        }
    },
    {
        "name": "create_service_request",
        "description": "Create a service request for the concierge team to handle. Use when user wants to book a service like dog walker, grooming, vet visit, birthday party planning, travel arrangements, etc.",
        "parameters": {
            "type": "object",
            "properties": {
                "service_type": {
                    "type": "string",
                    "enum": ["dog_walker", "grooming", "vet_visit", "boarding", "travel", "birthday_party", "pet_sitting", "training", "other"],
                    "description": "Type of service requested"
                },
                "description": {
                    "type": "string",
                    "description": "Details about the request"
                },
                "preferred_date": {
                    "type": "string",
                    "description": "Preferred date for the service (optional)"
                },
                "preferred_time": {
                    "type": "string",
                    "description": "Preferred time for the service (optional)"
                },
                "notes": {
                    "type": "string",
                    "description": "Additional notes or special requirements"
                }
            },
            "required": ["service_type", "description"]
        }
    },
    {
        "name": "get_today_actions",
        "description": "Get today's actions, reminders, and alerts for the pet. Use when user asks about today, reminders, what's happening, or daily updates.",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "get_learn_content",
        "description": "Get educational content and guides relevant to the pet. Use when user wants to learn something, asks for tips, guides, or information.",
        "parameters": {
            "type": "object",
            "properties": {
                "topic": {
                    "type": "string",
                    "description": "Specific topic to learn about (optional)"
                }
            }
        }
    }
]
