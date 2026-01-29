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
    """Create a new training request with FULL UNIFIED FLOW integration
    
    UNIFIED FLOW: Every request creates Notification → Ticket → Inbox
    """
    db = get_db()
    from timestamp_utils import get_utc_timestamp
    
    request_id = f"LEARN-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    inbox_id = f"INBOX-{uuid.uuid4().hex[:8].upper()}"
    now_iso = get_utc_timestamp()
    
    pet_name = request_data.get("pet_name") or "Pet"
    user_name = request_data.get("user_name") or "Customer"
    learn_type = request_data.get("learn_type", "basic_obedience")
    learn_type_title = learn_type.replace('_', ' ').title()
    
    training_request = {
        "id": request_id,
        "request_id": request_id,
        "notification_id": notification_id,
        "ticket_id": ticket_id,
        "inbox_id": inbox_id,
        "learn_type": learn_type,
        "status": "pending",
        "priority": request_data.get("priority", "normal"),
        
        # Pet Details
        "pet_id": request_data.get("pet_id"),
        "pet_name": pet_name,
        "pet_breed": request_data.get("pet_breed"),
        "pet_age": request_data.get("pet_age"),
        "pet_temperament": request_data.get("pet_temperament"),
        
        # User Details
        "user_id": request_data.get("user_id"),
        "user_name": user_name,
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
        "created_at": now_iso,
        "updated_at": now_iso,
        "assigned_to": None,
        "trainer_id": None,
        "unified_flow_processed": True
    }
    
    await db.learn_requests.insert_one({k: v for k, v in training_request.items() if k != "_id"})
    
    # ==================== STEP 1: NOTIFICATION (MANDATORY) ====================
    await db.admin_notifications.insert_one({
        "id": notification_id,
        "type": f"learn_{learn_type}",
        "pillar": "learn",
        "title": f"New Training Request: {learn_type_title} - {pet_name}",
        "message": f"{user_name} needs {learn_type_title} for {pet_name}. Goals: {', '.join(training_request['training_goals'][:2]) if training_request['training_goals'] else 'Not specified'}",
        "read": False,
        "status": "unread",
        "urgency": "medium",
        "ticket_id": ticket_id,
        "inbox_id": inbox_id,
        "customer": {
            "name": user_name,
            "email": training_request["user_email"],
            "phone": training_request["user_phone"]
        },
        "pet": {
            "name": pet_name,
            "breed": training_request["pet_breed"]
        },
        "link": f"/admin?tab=servicedesk&ticket={ticket_id}",
        "created_at": now_iso,
        "read_at": None
    })
    logger.info(f"[UNIFIED FLOW] Learn notification created: {notification_id}")
    
    # ==================== STEP 2: SERVICE DESK TICKET (MANDATORY) ====================
    ticket = {
        "id": ticket_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
        "source": "learn_pillar",
        "source_type": "learn",
        "source_id": request_id,
        "category": "training",
        "subcategory": learn_type,
        "pillar": "learn",
        "subject": f"Training Request: {learn_type_title} for {pet_name}",
        "description": f"New training request from {user_name} for {pet_name}.\nTraining Type: {learn_type_title}\nGoals: {', '.join(training_request['training_goals'])}",
        "original_request": f"New training request from {user_name} for {pet_name}.\nTraining Type: {learn_type_title}\nGoals: {', '.join(training_request['training_goals'])}",
        "status": "new",
        "priority": 3,
        "urgency": "medium",
        "member": {
            "name": user_name,
            "email": training_request["user_email"],
            "phone": training_request["user_phone"]
        },
        "pet": {
            "name": pet_name,
            "id": training_request["pet_id"],
            "breed": training_request["pet_breed"]
        },
        "created_at": now_iso,
        "updated_at": now_iso,
        "tags": ["learn", learn_type, "unified-flow"],
        "unified_flow_processed": True
    }
    
    await db.service_desk_tickets.insert_one({k: v for k, v in ticket.items() if k != "_id"})
    await db.tickets.insert_one({k: v for k, v in ticket.items() if k != "_id"})
    logger.info(f"[UNIFIED FLOW] Learn ticket created: {ticket_id}")
    
    # ==================== STEP 3: UNIFIED INBOX (MANDATORY) ====================
    inbox_item = {
        "id": inbox_id,
        "request_id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "channel": "web",
        "request_type": "learn",
        "pillar": "learn",
        "category": learn_type,
        "status": "new",
        "urgency": "medium",
        "customer_name": user_name,
        "customer_email": training_request["user_email"],
        "customer_phone": training_request["user_phone"],
        "member": {
            "name": user_name,
            "email": training_request["user_email"],
            "phone": training_request["user_phone"]
        },
        "pet": {
            "name": pet_name,
            "breed": training_request["pet_breed"]
        },
        "preview": f"{pet_name} - {', '.join(training_request['training_goals'][:2]) if training_request['training_goals'] else learn_type_title}",
        "message": f"Training Request: {learn_type_title} for {pet_name}",
        "tags": ["learn", learn_type],
        "created_at": now_iso,
        "updated_at": now_iso,
        "unified_flow_processed": True
    }
    
    await db.channel_intakes.insert_one({k: v for k, v in inbox_item.items() if k != "_id"})
    logger.info(f"[UNIFIED FLOW] Learn inbox created: {inbox_id}")
    
    logger.info(f"[UNIFIED FLOW] COMPLETE: Learn request {request_id} | Notification({notification_id}) → Ticket({ticket_id}) → Inbox({inbox_id})")
    
    return {
        "success": True,
        "request_id": request_id,
        "ticket_id": ticket_id,
        "notification_id": notification_id,
        "inbox_id": inbox_id,
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
    """Get training-related products from unified_products collection"""
    db = get_db()
    
    # Query unified_products with pillar="learn"
    products = await db.unified_products.find(
        {"pillar": "learn", "is_active": {"$ne": False}},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    # Also check legacy products collection
    if len(products) < limit:
        legacy = await db.products.find(
            {"pillar": "learn", "is_active": {"$ne": False}},
            {"_id": 0}
        ).limit(limit - len(products)).to_list(limit - len(products))
        
        seen_ids = {p.get("id") for p in products}
        for p in legacy:
            if p.get("id") not in seen_ids:
                products.append(p)
    
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


# ==================== ADMIN ENDPOINTS ====================

@router.put("/requests/{request_id}")
async def update_training_request(request_id: str, update_data: dict):
    """Update a training request status"""
    db = get_db()
    
    update_fields = {
        "status": update_data.get("status"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if update_data.get("assigned_to"):
        update_fields["assigned_to"] = update_data.get("assigned_to")
    if update_data.get("trainer_id"):
        update_fields["trainer_id"] = update_data.get("trainer_id")
    
    result = await db.learn_requests.update_one(
        {"id": request_id},
        {"$set": {k: v for k, v in update_fields.items() if v is not None}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"success": True, "message": "Request updated"}


@router.post("/admin/programs")
async def create_program(program_data: dict):
    """Create a new training program"""
    db = get_db()
    
    program_id = f"prog_{uuid.uuid4().hex[:8]}"
    
    program = {
        "id": program_id,
        **program_data,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.learn_programs.insert_one({k: v for k, v in program.items() if k != "_id"})
    return {"success": True, "id": program_id}


@router.put("/admin/programs/{program_id}")
async def update_program(program_id: str, program_data: dict):
    """Update a training program"""
    db = get_db()
    
    program_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.learn_programs.update_one(
        {"id": program_id},
        {"$set": {k: v for k, v in program_data.items() if k != "_id"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Program not found")
    
    return {"success": True, "message": "Program updated"}


@router.delete("/admin/programs/{program_id}")
async def delete_program(program_id: str):
    """Delete a training program"""
    db = get_db()
    
    result = await db.learn_programs.delete_one({"id": program_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Program not found")
    
    return {"success": True, "message": "Program deleted"}


@router.post("/admin/trainers")
async def create_trainer(trainer_data: dict):
    """Create a new trainer profile"""
    db = get_db()
    
    trainer_id = f"trainer_{uuid.uuid4().hex[:8]}"
    
    trainer = {
        "id": trainer_id,
        **trainer_data,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.learn_trainers.insert_one({k: v for k, v in trainer.items() if k != "_id"})
    return {"success": True, "id": trainer_id}


@router.put("/admin/trainers/{trainer_id}")
async def update_trainer(trainer_id: str, trainer_data: dict):
    """Update a trainer profile"""
    db = get_db()
    
    trainer_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.learn_trainers.update_one(
        {"id": trainer_id},
        {"$set": {k: v for k, v in trainer_data.items() if k != "_id"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    return {"success": True, "message": "Trainer updated"}


@router.delete("/admin/trainers/{trainer_id}")
async def delete_trainer(trainer_id: str):
    """Delete a trainer profile"""
    db = get_db()
    
    result = await db.learn_trainers.delete_one({"id": trainer_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    return {"success": True, "message": "Trainer deleted"}


@router.post("/admin/products")
async def create_learn_product(product_data: dict):
    """Create a new learning product"""
    db = get_db()
    
    product_id = f"learn_prod_{uuid.uuid4().hex[:8]}"
    
    product = {
        "id": product_id,
        "pillar": "learn",
        **product_data,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.learn_products.insert_one({k: v for k, v in product.items() if k != "_id"})
    return {"success": True, "id": product_id}


@router.put("/admin/products/{product_id}")
async def update_learn_product(product_id: str, product_data: dict):
    """Update a learning product"""
    db = get_db()
    
    product_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.learn_products.update_one(
        {"id": product_id},
        {"$set": {k: v for k, v in product_data.items() if k != "_id"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "message": "Product updated"}


@router.delete("/admin/products/{product_id}")
async def delete_learn_product(product_id: str):
    """Delete a learning product"""
    db = get_db()
    
    result = await db.learn_products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "message": "Product deleted"}


@router.post("/admin/bundles")
async def create_learn_bundle(bundle_data: dict):
    """Create a new learning bundle"""
    db = get_db()
    
    bundle_id = f"learn_bundle_{uuid.uuid4().hex[:8]}"
    
    bundle = {
        "id": bundle_id,
        "pillar": "learn",
        **bundle_data,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.learn_bundles.insert_one({k: v for k, v in bundle.items() if k != "_id"})
    return {"success": True, "id": bundle_id}


@router.put("/admin/bundles/{bundle_id}")
async def update_learn_bundle(bundle_id: str, bundle_data: dict):
    """Update a learning bundle"""
    db = get_db()
    
    bundle_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.learn_bundles.update_one(
        {"id": bundle_id},
        {"$set": {k: v for k, v in bundle_data.items() if k != "_id"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"success": True, "message": "Bundle updated"}


@router.delete("/admin/bundles/{bundle_id}")
async def delete_learn_bundle(bundle_id: str):
    """Delete a learning bundle"""
    db = get_db()
    
    result = await db.learn_bundles.delete_one({"id": bundle_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"success": True, "message": "Bundle deleted"}


@router.post("/admin/seed")
async def seed_learn_data():
    """Seed sample Learn pillar data"""
    db = get_db()
    
    programs_seeded = 0
    products_seeded = 0
    trainers_seeded = 0
    bundles_seeded = 0
    
    # Seed sample programs
    sample_programs = [
        {
            "id": "prog_basic_obedience",
            "name": "Basic Obedience Training",
            "learn_type": "basic_obedience",
            "description": "Essential commands and manners for your dog - sit, stay, come, heel, and leash walking.",
            "duration": "6 weeks",
            "sessions": 12,
            "price": 15000,
            "skill_level": "beginner",
            "is_featured": True,
            "is_active": True,
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
            "includes": ["12 one-on-one sessions", "Training manual", "Progress tracking", "WhatsApp support"],
            "suitable_for": ["Puppies", "Adult dogs", "First-time owners"]
        },
        {
            "id": "prog_puppy_foundation",
            "name": "Puppy Foundation Program",
            "learn_type": "puppy_training",
            "description": "Perfect start for puppies 8-16 weeks. Socialization, bite inhibition, and house training.",
            "duration": "8 weeks",
            "sessions": 16,
            "price": 20000,
            "skill_level": "beginner",
            "is_featured": True,
            "is_active": True,
            "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
            "includes": ["16 sessions", "Socialization outings", "Puppy pack", "Lifetime phone support"],
            "suitable_for": ["Puppies 8-16 weeks"]
        },
        {
            "id": "prog_behavior_mod",
            "name": "Behavior Modification",
            "learn_type": "behavior_modification",
            "description": "Address specific behavioral issues like aggression, anxiety, or excessive barking.",
            "duration": "8-12 weeks",
            "sessions": 16,
            "price": 25000,
            "skill_level": "all_levels",
            "is_featured": True,
            "is_active": True,
            "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800",
            "includes": ["Behavior assessment", "Custom modification plan", "16 sessions", "Follow-up support"],
            "suitable_for": ["Dogs with behavioral issues"]
        }
    ]
    
    for prog in sample_programs:
        result = await db.learn_programs.update_one(
            {"id": prog["id"]},
            {"$set": prog},
            upsert=True
        )
        if result.upserted_id:
            programs_seeded += 1
    
    # Seed sample trainers
    sample_trainers = [
        {
            "id": "trainer_001",
            "name": "Priya Sharma",
            "title": "Certified Professional Dog Trainer",
            "description": "Specializing in positive reinforcement training for over 10 years.",
            "specializations": ["basic_obedience", "puppy_training", "behavior_modification"],
            "experience_years": 10,
            "rating": 4.9,
            "reviews_count": 156,
            "city": "Bangalore",
            "contact_email": "priya@thedoggycompany.in",
            "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
            "is_featured": True,
            "is_active": True
        },
        {
            "id": "trainer_002",
            "name": "Raj Malhotra",
            "title": "Behavior Specialist",
            "description": "Expert in reactive dog training and behavior rehabilitation.",
            "specializations": ["behavior_modification", "aggression_management", "anxiety_training"],
            "experience_years": 8,
            "rating": 4.8,
            "reviews_count": 98,
            "city": "Mumbai",
            "contact_email": "raj@thedoggycompany.in",
            "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            "is_featured": True,
            "is_active": True
        }
    ]
    
    for trainer in sample_trainers:
        result = await db.learn_trainers.update_one(
            {"id": trainer["id"]},
            {"$set": trainer},
            upsert=True
        )
        if result.upserted_id:
            trainers_seeded += 1
    
    # Seed sample products
    sample_products = [
        {
            "id": "learn_prod_clicker",
            "name": "Professional Training Clicker",
            "description": "High-quality clicker for positive reinforcement training.",
            "price": 299,
            "compare_price": 499,
            "learn_type": "training_tool",
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
            "tags": ["training", "clicker", "positive reinforcement"],
            "in_stock": True,
            "paw_reward_points": 15,
            "pillar": "learn"
        },
        {
            "id": "learn_prod_treat_pouch",
            "name": "Training Treat Pouch",
            "description": "Convenient pouch with quick-access opening for training treats.",
            "price": 599,
            "compare_price": 899,
            "learn_type": "accessory",
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
            "tags": ["training", "treats", "accessory"],
            "in_stock": True,
            "paw_reward_points": 30,
            "pillar": "learn"
        }
    ]
    
    for prod in sample_products:
        result = await db.learn_products.update_one(
            {"id": prod["id"]},
            {"$set": prod},
            upsert=True
        )
        if result.upserted_id:
            products_seeded += 1
    
    # Seed sample bundles
    sample_bundles = [
        {
            "id": "learn_bundle_starter",
            "name": "Puppy Training Starter Kit",
            "description": "Everything you need to start training your new puppy at home.",
            "items": ["Training Clicker", "Treat Pouch", "Long Training Lead", "Puppy Training Guide"],
            "price": 1499,
            "original_price": 2299,
            "paw_reward_points": 75,
            "is_recommended": True,
            "pillar": "learn"
        }
    ]
    
    for bundle in sample_bundles:
        result = await db.learn_bundles.update_one(
            {"id": bundle["id"]},
            {"$set": bundle},
            upsert=True
        )
        if result.upserted_id:
            bundles_seeded += 1
    
    return {
        "success": True,
        "programs_seeded": programs_seeded,
        "trainers_seeded": trainers_seeded,
        "products_seeded": products_seeded,
        "bundles_seeded": bundles_seeded
    }

