"""
LEARN Pillar Routes - Pet Training, Education & Behavioural Programs
Complete CRUD with Service Desk, Notifications, and Unified Inbox integration
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/learn", tags=["learn"])

def get_db():
    from server import db
    return db


# ==================== TRAINING REQUESTS ====================

@router.post("/request")
async def create_training_request(request_data: dict):
    """Create a new training request with Service Desk integration"""
    db = get_db()
    
    request_id = f"LEARN-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    training_request = {
        "id": request_id,
        "request_id": request_id,
        "learn_type": request_data.get("learn_type", "basic_obedience"),
        "status": "pending",
        "priority": request_data.get("priority", "normal"),
        
        # Pet Details
        "pet_id": request_data.get("pet_id"),
        "pet_name": request_data.get("pet_name"),
        "pet_breed": request_data.get("pet_breed"),
        "pet_age": request_data.get("pet_age"),
        "pet_temperament": request_data.get("pet_temperament"),
        
        # User Details
        "user_id": request_data.get("user_id"),
        "user_name": request_data.get("user_name"),
        "user_email": request_data.get("user_email"),
        "user_phone": request_data.get("user_phone"),
        
        # Training Details
        "training_goals": request_data.get("training_goals", []),
        "behavior_issues": request_data.get("behavior_issues", []),
        "previous_training": request_data.get("previous_training", False),
        "training_method_preference": request_data.get("training_method_preference"),
        "schedule_preference": request_data.get("schedule_preference"),
        "location_preference": request_data.get("location_preference", "home"),
        "notes": request_data.get("notes", ""),
        
        # Tracking
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "assigned_to": None,
        "trainer_id": None
    }
    
    await db.learn_requests.insert_one({k: v for k, v in training_request.items() if k != "_id"})
    
    # Create Service Desk Ticket
    ticket = {
        "id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
        "ticket_id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
        "source": "learn_pillar",
        "source_type": "learn",
        "source_id": request_id,
        "category": "training",
        "subcategory": training_request["learn_type"],
        "pillar": "learn",
        "subject": f"Training Request: {training_request['learn_type'].replace('_', ' ').title()} for {training_request['pet_name']}",
        "original_request": f"New training request from {training_request['user_name']} for {training_request['pet_name']}.\nTraining Type: {training_request['learn_type'].replace('_', ' ').title()}\nGoals: {', '.join(training_request['training_goals'])}",
        "status": "open",
        "priority": training_request["priority"],
        "priority_bucket": "medium",
        "member_email": training_request["user_email"],
        "member_name": training_request["user_name"],
        "pet_name": training_request["pet_name"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.service_desk_tickets.insert_one({k: v for k, v in ticket.items() if k != "_id"})
    
    return {
        "success": True,
        "request_id": request_id,
        "ticket_id": ticket["ticket_id"],
        "message": "Training request submitted! Our concierge will match you with the perfect trainer."
    }


@router.get("/requests")
async def get_training_requests(
    user_email: Optional[str] = None,
    status: Optional[str] = None,
    learn_type: Optional[str] = None,
    limit: int = 50
):
    """Get training requests with optional filters"""
    db = get_db()
    
    query = {}
    if user_email:
        query["user_email"] = user_email
    if status:
        query["status"] = status
    if learn_type:
        query["learn_type"] = learn_type
    
    requests = await db.learn_requests.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"requests": requests, "count": len(requests)}


@router.get("/request/{request_id}")
async def get_training_request(request_id: str):
    """Get a specific training request"""
    db = get_db()
    
    request = await db.learn_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Training request not found")
    
    return request


# ==================== TRAINING PROGRAMS ====================

@router.get("/programs")
async def get_training_programs(
    program_type: Optional[str] = None,
    skill_level: Optional[str] = None,
    is_featured: Optional[bool] = None,
    limit: int = 20
):
    """Get available training programs"""
    db = get_db()
    
    query = {"is_active": True}
    if program_type:
        query["program_type"] = program_type
    if skill_level:
        query["skill_level"] = skill_level
    if is_featured is not None:
        query["is_featured"] = is_featured
    
    programs = await db.learn_programs.find(query, {"_id": 0}).sort("sort_order", 1).limit(limit).to_list(limit)
    
    # If no programs exist, return sample programs
    if not programs:
        programs = [
            {
                "id": "prog_basic_obedience",
                "name": "Basic Obedience Training",
                "program_type": "basic_obedience",
                "description": "Essential commands and manners for your dog - sit, stay, come, heel, and leash walking.",
                "duration": "6 weeks",
                "sessions": 12,
                "price": 15000,
                "skill_level": "beginner",
                "is_featured": True,
                "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
                "includes": ["12 one-on-one sessions", "Training manual", "Progress tracking", "WhatsApp support"],
                "suitable_for": ["Puppies", "Adult dogs", "First-time owners"]
            },
            {
                "id": "prog_puppy_foundation",
                "name": "Puppy Foundation Program",
                "program_type": "puppy_training",
                "description": "Perfect start for puppies 8-16 weeks. Socialization, bite inhibition, and house training.",
                "duration": "8 weeks",
                "sessions": 16,
                "price": 20000,
                "skill_level": "beginner",
                "is_featured": True,
                "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
                "includes": ["16 sessions", "Socialization outings", "Puppy pack", "Lifetime phone support"],
                "suitable_for": ["Puppies 8-16 weeks"]
            },
            {
                "id": "prog_behavior_mod",
                "name": "Behavior Modification",
                "program_type": "behavior_modification",
                "description": "Address specific behavioral issues like aggression, anxiety, or excessive barking.",
                "duration": "8-12 weeks",
                "sessions": 16,
                "price": 25000,
                "skill_level": "all_levels",
                "is_featured": True,
                "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800",
                "includes": ["Behavior assessment", "Custom modification plan", "16 sessions", "Follow-up support"],
                "suitable_for": ["Dogs with behavioral issues"]
            },
            {
                "id": "prog_advanced_training",
                "name": "Advanced Obedience",
                "program_type": "advanced_training",
                "description": "Off-leash control, complex commands, and distraction training for well-trained dogs.",
                "duration": "8 weeks",
                "sessions": 16,
                "price": 22000,
                "skill_level": "advanced",
                "is_featured": False,
                "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
                "includes": ["16 advanced sessions", "Off-leash training", "Certification"],
                "suitable_for": ["Dogs with basic training"]
            },
            {
                "id": "prog_agility",
                "name": "Agility Training",
                "program_type": "agility",
                "description": "Fun obstacle course training that builds confidence and strengthens your bond.",
                "duration": "10 weeks",
                "sessions": 20,
                "price": 18000,
                "skill_level": "intermediate",
                "is_featured": False,
                "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
                "includes": ["20 agility sessions", "Equipment access", "Competition prep"],
                "suitable_for": ["Active dogs", "High-energy breeds"]
            },
            {
                "id": "prog_therapy_dog",
                "name": "Therapy Dog Certification",
                "program_type": "therapy_training",
                "description": "Prepare your dog for therapy work in hospitals, schools, and care facilities.",
                "duration": "12 weeks",
                "sessions": 24,
                "price": 30000,
                "skill_level": "advanced",
                "is_featured": False,
                "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800",
                "includes": ["24 specialized sessions", "Temperament testing", "Certification exam"],
                "suitable_for": ["Calm, friendly dogs"]
            }
        ]
    
    return {"programs": programs, "count": len(programs)}


@router.get("/programs/{program_id}")
async def get_training_program(program_id: str):
    """Get a specific training program"""
    db = get_db()
    
    program = await db.learn_programs.find_one({"id": program_id}, {"_id": 0})
    if not program:
        # Return from sample if not found
        programs = (await get_training_programs())["programs"]
        program = next((p for p in programs if p["id"] == program_id), None)
        if not program:
            raise HTTPException(status_code=404, detail="Training program not found")
    
    return program


# ==================== TRAINERS ====================

@router.get("/trainers")
async def get_trainers(
    city: Optional[str] = None,
    specialization: Optional[str] = None,
    is_featured: Optional[bool] = None,
    limit: int = 20
):
    """Get available trainers"""
    db = get_db()
    
    query = {"is_active": True}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if specialization:
        query["specializations"] = specialization
    if is_featured is not None:
        query["is_featured"] = is_featured
    
    trainers = await db.learn_trainers.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    # If no trainers exist, return sample trainers
    if not trainers:
        trainers = [
            {
                "id": "trainer_001",
                "name": "Rahul Sharma",
                "title": "Certified Canine Behaviorist",
                "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
                "rating": 4.9,
                "reviews_count": 127,
                "experience_years": 12,
                "city": "Mumbai",
                "specializations": ["behavior_modification", "puppy_training", "aggression"],
                "certifications": ["CPDT-KA", "IAABC-ADT", "Fear Free Certified"],
                "bio": "Specializing in positive reinforcement training with 12+ years experience.",
                "is_featured": True
            },
            {
                "id": "trainer_002",
                "name": "Priya Patel",
                "title": "Puppy Training Specialist",
                "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
                "rating": 4.8,
                "reviews_count": 89,
                "experience_years": 8,
                "city": "Mumbai",
                "specializations": ["puppy_training", "basic_obedience", "socialization"],
                "certifications": ["CPDT-KA", "Puppy Start Right Instructor"],
                "bio": "Helping puppies become confident, well-mannered dogs.",
                "is_featured": True
            },
            {
                "id": "trainer_003",
                "name": "Vikram Singh",
                "title": "Agility & Sport Dog Trainer",
                "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
                "rating": 4.9,
                "reviews_count": 56,
                "experience_years": 10,
                "city": "Bangalore",
                "specializations": ["agility", "advanced_training", "sport_dogs"],
                "certifications": ["NADAC Judge", "AKC CGC Evaluator"],
                "bio": "Competition-level agility trainer with multiple championship wins.",
                "is_featured": True
            }
        ]
    
    return {"trainers": trainers, "count": len(trainers)}


# ==================== PRODUCTS ====================

@router.get("/products")
async def get_learn_products(limit: int = 20):
    """Get training-related products"""
    db = get_db()
    
    products = await db.products.find(
        {"pillar": "learn", "is_active": {"$ne": False}},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    # If no products, return sample products
    if not products:
        products = [
            {
                "id": "prod_clicker",
                "name": "Professional Training Clicker Set",
                "price": 349,
                "compare_price": 499,
                "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
                "description": "Set of 3 clickers with wrist straps for effective positive reinforcement training.",
                "pillar": "learn",
                "paw_reward_points": 35
            },
            {
                "id": "prod_treat_pouch",
                "name": "Training Treat Pouch",
                "price": 799,
                "compare_price": 999,
                "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
                "description": "Convenient magnetic closure treat pouch with belt clip and poop bag dispenser.",
                "pillar": "learn",
                "paw_reward_points": 80
            },
            {
                "id": "prod_training_treats",
                "name": "High-Value Training Treats",
                "price": 449,
                "compare_price": 549,
                "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
                "description": "Small, soft, and irresistible treats perfect for training sessions.",
                "pillar": "learn",
                "paw_reward_points": 45
            },
            {
                "id": "prod_long_leash",
                "name": "10m Training Long Line",
                "price": 1299,
                "compare_price": 1599,
                "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
                "description": "Durable biothane long line for recall training and off-leash work.",
                "pillar": "learn",
                "paw_reward_points": 130
            },
            {
                "id": "prod_puzzle_toy",
                "name": "Interactive Puzzle Toy Set",
                "price": 1499,
                "compare_price": 1999,
                "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
                "description": "Set of 3 puzzle toys for mental stimulation and food enrichment.",
                "pillar": "learn",
                "paw_reward_points": 150
            },
            {
                "id": "prod_training_book",
                "name": "The Complete Dog Training Guide",
                "price": 899,
                "compare_price": 1199,
                "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
                "description": "Comprehensive guide covering puppy to advanced training techniques.",
                "pillar": "learn",
                "paw_reward_points": 90
            }
        ]
    
    return {"products": products, "count": len(products)}


# ==================== BUNDLES ====================

@router.get("/bundles")
async def get_learn_bundles():
    """Get training bundles"""
    db = get_db()
    
    bundles = await db.learn_bundles.find({"is_active": True}, {"_id": 0}).to_list(20)
    
    if not bundles:
        bundles = [
            {
                "id": "bundle_puppy_starter",
                "name": "Puppy Starter Kit",
                "description": "Everything you need to start training your new puppy right.",
                "price": 2499,
                "original_price": 3500,
                "savings": 1001,
                "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
                "items": ["Training Clicker Set", "Treat Pouch", "Puppy Training Treats", "Kong Puppy Toy"],
                "pillar": "learn"
            },
            {
                "id": "bundle_training_essentials",
                "name": "Training Essentials Bundle",
                "description": "Professional-grade training tools for serious dog owners.",
                "price": 3999,
                "original_price": 5500,
                "savings": 1501,
                "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
                "items": ["10m Long Line", "Training Clicker Set", "Treat Pouch", "High-Value Treats", "Training Guide"],
                "pillar": "learn"
            }
        ]
    
    return {"bundles": bundles, "count": len(bundles)}


# ==================== ENROLLMENTS ====================

@router.post("/enroll")
async def enroll_in_program(enrollment_data: dict):
    """Enroll in a training program"""
    db = get_db()
    
    enrollment_id = f"ENR-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    enrollment = {
        "id": enrollment_id,
        "program_id": enrollment_data.get("program_id"),
        "program_name": enrollment_data.get("program_name"),
        "trainer_id": enrollment_data.get("trainer_id"),
        "status": "pending_confirmation",
        
        # Pet & User Details
        "pet_id": enrollment_data.get("pet_id"),
        "pet_name": enrollment_data.get("pet_name"),
        "user_id": enrollment_data.get("user_id"),
        "user_name": enrollment_data.get("user_name"),
        "user_email": enrollment_data.get("user_email"),
        "user_phone": enrollment_data.get("user_phone"),
        
        # Schedule
        "preferred_start_date": enrollment_data.get("preferred_start_date"),
        "preferred_time_slot": enrollment_data.get("preferred_time_slot"),
        "location_preference": enrollment_data.get("location_preference", "home"),
        
        # Payment
        "amount": enrollment_data.get("amount", 0),
        "payment_status": "pending",
        
        # Tracking
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.learn_enrollments.insert_one({k: v for k, v in enrollment.items() if k != "_id"})
    
    # Create Service Desk Ticket
    ticket = {
        "id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
        "ticket_id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
        "source": "learn_pillar",
        "source_type": "learn",
        "source_id": enrollment_id,
        "category": "enrollment",
        "pillar": "learn",
        "subject": f"Program Enrollment: {enrollment['program_name']} for {enrollment['pet_name']}",
        "original_request": f"New enrollment from {enrollment['user_name']} for {enrollment['pet_name']}.\nProgram: {enrollment['program_name']}\nPreferred Start: {enrollment['preferred_start_date']}",
        "status": "open",
        "priority_bucket": "high",
        "member_email": enrollment["user_email"],
        "member_name": enrollment["user_name"],
        "pet_name": enrollment["pet_name"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.service_desk_tickets.insert_one({k: v for k, v in ticket.items() if k != "_id"})
    
    return {
        "success": True,
        "enrollment_id": enrollment_id,
        "message": "Enrollment submitted! Our team will confirm your schedule shortly."
    }


@router.get("/enrollments")
async def get_enrollments(user_email: Optional[str] = None, status: Optional[str] = None):
    """Get user's enrollments"""
    db = get_db()
    
    query = {}
    if user_email:
        query["user_email"] = user_email
    if status:
        query["status"] = status
    
    enrollments = await db.learn_enrollments.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"enrollments": enrollments, "count": len(enrollments)}


# ==================== PROGRESS TRACKING ====================

@router.get("/progress/{pet_id}")
async def get_training_progress(pet_id: str):
    """Get training progress for a pet"""
    db = get_db()
    
    progress = await db.learn_progress.find_one({"pet_id": pet_id}, {"_id": 0})
    
    if not progress:
        progress = {
            "pet_id": pet_id,
            "skills_learned": [],
            "current_level": "beginner",
            "total_sessions": 0,
            "achievements": [],
            "next_goals": []
        }
    
    return progress


@router.post("/progress/{pet_id}/skill")
async def record_skill_learned(pet_id: str, skill_data: dict):
    """Record a new skill learned by pet"""
    db = get_db()
    
    skill = {
        "skill_name": skill_data.get("skill_name"),
        "learned_date": datetime.now(timezone.utc).isoformat(),
        "proficiency": skill_data.get("proficiency", "learning"),  # learning, competent, mastered
        "notes": skill_data.get("notes", "")
    }
    
    await db.learn_progress.update_one(
        {"pet_id": pet_id},
        {
            "$push": {"skills_learned": skill},
            "$inc": {"total_sessions": 1},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"success": True, "message": f"Skill '{skill['skill_name']}' recorded!"}
