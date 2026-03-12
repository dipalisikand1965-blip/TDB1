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

# Import canonical ticket spine helper (SINGLE ENTRY POINT for all tickets)
from utils.spine_helper import handoff_to_spine


def get_db():
    from server import db
    return db


# ==================== TRAINING REQUESTS ====================

@router.post("/request")
async def create_training_request(request_data: dict):
    """
    Create a new training request via UNIFORM SERVICE FLOW.
    MIGRATED to handoff_to_spine() per Bible Section 12.0.
    """
    db = get_db()
    from timestamp_utils import get_utc_timestamp
    
    request_id = f"LEARN-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    now_iso = get_utc_timestamp()
    
    pet_name = request_data.get("pet_name") or "Pet"
    user_name = request_data.get("user_name") or "Customer"
    learn_type = request_data.get("learn_type", "basic_obedience")
    learn_type_title = learn_type.replace('_', ' ').title()
    training_goals = request_data.get("training_goals", [])
    goals_str = ", ".join(training_goals[:2]) if training_goals else "Not specified"
    
    # Build intent
    intent = f"Training {learn_type_title} for {pet_name}. Goals: {goals_str}"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HANDOFF TO SPINE - Single canonical ticket creation
    # ═══════════════════════════════════════════════════════════════════════════
    spine_result = await handoff_to_spine(
        db=db,
        route_name="learn_routes.py",
        endpoint="/learn/request",
        pillar="learn",
        category=learn_type,
        intent=intent,
        user={
            "email": request_data.get("user_email"),
            "name": user_name,
            "phone": request_data.get("user_phone")
        },
        pet={
            "id": request_data.get("pet_id"),
            "name": pet_name,
            "breed": request_data.get("pet_breed")
        },
        payload={
            "request_id": request_id,
            "learn_type": learn_type,
            "training_goals": training_goals,
            "behavior_issues": request_data.get("behavior_issues", []),
            "previous_training": request_data.get("previous_training", False),
            "training_method_preference": request_data.get("training_method_preference"),
            "schedule_preference": request_data.get("schedule_preference"),
            "location_preference": request_data.get("location_preference", "home"),
            "notes": request_data.get("notes", "")
        },
        channel="web",
        urgency="normal",
        created_by="member",
        notify_admin=True,
        notify_member=True,
        tags=["learn", learn_type]
    )
    
    if not spine_result.get("success"):
        logger.error(f"[LEARN] Spine handoff failed: {spine_result.get('error')}")
        raise HTTPException(status_code=500, detail="Failed to create service ticket")
    
    canonical_ticket_id = spine_result["ticket_id"]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SAVE TO learn_requests collection (pillar-specific record)
    # ═══════════════════════════════════════════════════════════════════════════
    training_request = {
        "id": request_id,
        "request_id": request_id,
        "ticket_id": canonical_ticket_id,  # Link to canonical ticket
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
        "training_goals": training_goals,
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
    
    logger.info(f"[SPINE-MIGRATED] learn_routes.py:/learn/request → {canonical_ticket_id} | pillar=learn category={learn_type}")
    
    return {
        "success": True,
        "request_id": request_id,
        "ticket_id": canonical_ticket_id,
        "deep_link": spine_result.get("deep_link"),
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
async def get_learn_products(limit: int = 20, products_only: bool = True):
    """Get training-related products from unified_products collection"""
    db = get_db()
    
    # Query unified_products with pillar="learn"
    products = await db.unified_products.find(
        {"pillar": "learn", "is_active": {"$ne": False}},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    # Also check legacy products collection
    if len(products) < limit:
        legacy = await db.products_master.find(
            {"pillar": "learn", "is_active": {"$ne": False}},
            {"_id": 0}
        ).limit(limit - len(products)).to_list(limit - len(products))
        
        seen_ids = {p.get("id") for p in products}
        for p in legacy:
            if p.get("id") not in seen_ids:
                products.append(p)
    
    # ALWAYS return curated physical training products with AI watercolor images
    # These are like Advisory's "Care Products" - actual physical products
    curated_training_products = [
        {
            "id": "learn-clicker-set",
            "name": "Professional Training Clicker Set",
            "price": 349,
            "compare_price": 499,
            "image": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/87adf53c2371052869672e1f355b508067274c824ee82bf462690e4e570e488f.png",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/87adf53c2371052869672e1f355b508067274c824ee82bf462690e4e570e488f.png",
            "description": "Set of 3 professional clickers with wrist straps for effective positive reinforcement training.",
            "pillar": "learn",
            "category": "training_tools",
            "paw_reward_points": 35,
            "in_stock": True
        },
        {
            "id": "learn-treat-pouch",
            "name": "Training Treat Pouch",
            "price": 799,
            "compare_price": 999,
            "image": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/0a6a8b4dc0f349e8b9d88e388526a3cfa495a4670edd56ad13e6348eb7076138.png",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/0a6a8b4dc0f349e8b9d88e388526a3cfa495a4670edd56ad13e6348eb7076138.png",
            "description": "Convenient magnetic closure treat pouch with belt clip and poop bag dispenser.",
            "pillar": "learn",
            "category": "training_tools",
            "paw_reward_points": 80,
            "in_stock": True
        },
        {
            "id": "learn-training-treats",
            "name": "High-Value Training Treats Pack",
            "price": 449,
            "compare_price": 549,
            "image": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/dbabeb6f6b1621cedd22f3a4975ba44771a5aabf9878c87dd9f1ffc44753427b.png",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/dbabeb6f6b1621cedd22f3a4975ba44771a5aabf9878c87dd9f1ffc44753427b.png",
            "description": "Small, soft, and irresistible treats perfect for training sessions. Chicken & liver flavor.",
            "pillar": "learn",
            "category": "treats",
            "paw_reward_points": 45,
            "in_stock": True
        },
        {
            "id": "learn-long-line",
            "name": "10m Training Long Line",
            "price": 1299,
            "compare_price": 1599,
            "image": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/5034dc30785b0d73d6c261be5548a0e6056b7e03f8cab9cbf77ba6007dcf305d.png",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/5034dc30785b0d73d6c261be5548a0e6056b7e03f8cab9cbf77ba6007dcf305d.png",
            "description": "Durable biothane long line for recall training and off-leash work. Waterproof and easy to clean.",
            "pillar": "learn",
            "category": "training_tools",
            "paw_reward_points": 130,
            "in_stock": True
        },
        {
            "id": "learn-puzzle-set",
            "name": "Interactive Puzzle Toy Set",
            "price": 1499,
            "compare_price": 1999,
            "image": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/2f3ed1ef16b8ef08673babb4bf7d32bc5b20f295dd892f858979424604d2938a.png",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/2f3ed1ef16b8ef08673babb4bf7d32bc5b20f295dd892f858979424604d2938a.png",
            "description": "Set of 3 puzzle toys for mental stimulation and food enrichment. Multiple difficulty levels.",
            "pillar": "learn",
            "category": "puzzles",
            "paw_reward_points": 150,
            "in_stock": True
        },
        {
            "id": "learn-training-book",
            "name": "The Complete Dog Training Guide",
            "price": 899,
            "compare_price": 1199,
            "image": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/6c0f45fc08a941e7adaa1351c39123ef511131ed1c2f591c7e6755907adc67dc.png",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/6c0f45fc08a941e7adaa1351c39123ef511131ed1c2f591c7e6755907adc67dc.png",
            "description": "Comprehensive guide covering puppy to advanced training techniques with illustrations.",
            "pillar": "learn",
            "category": "books",
            "paw_reward_points": 90,
            "in_stock": True
        },
        {
            "id": "learn-target-stick",
            "name": "Professional Target Stick",
            "price": 599,
            "compare_price": 799,
            "image": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/657a5554e26229cfd44fc2d4bc2f210182579bd3ca53f3453d24606cd98f560d.png",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/657a5554e26229cfd44fc2d4bc2f210182579bd3ca53f3453d24606cd98f560d.png",
            "description": "Telescoping target stick for precision training and trick teaching.",
            "pillar": "learn",
            "category": "training_tools",
            "paw_reward_points": 60,
            "in_stock": True
        },
        {
            "id": "learn-snuffle-mat",
            "name": "Snuffle Mat for Mental Enrichment",
            "price": 1199,
            "compare_price": 1499,
            "image": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/1e4defe1457f6ed34780e549ba2526b0a07336c701928dbdeaeec6cc8f1a55e9.png",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/1e4defe1457f6ed34780e549ba2526b0a07336c701928dbdeaeec6cc8f1a55e9.png",
            "description": "Interactive feeding mat that engages your dog's natural foraging instincts.",
            "pillar": "learn",
            "category": "puzzles",
            "paw_reward_points": 120,
            "in_stock": True
        },
        {
            "id": "learn-anxiety-kit",
            "name": "Anxiety Relief Training Kit",
            "price": 2499,
            "compare_price": 2999,
            "image": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/89a20aeb647b6266f2da647bcc2b5d567a2b3253db208e0d454b6b9a61a19dd1.png",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/89a20aeb647b6266f2da647bcc2b5d567a2b3253db208e0d454b6b9a61a19dd1.png",
            "description": "Complete kit with calming treats, anxiety wrap, and training guide for anxious dogs.",
            "pillar": "learn",
            "category": "training_tools",
            "paw_reward_points": 250,
            "in_stock": True
        },
        {
            "id": "learn-puppy-starter",
            "name": "Puppy Training Starter Kit",
            "price": 1999,
            "compare_price": 2499,
            "image": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/39e3315c3c5ba7a1ca03ab2b94b0616d77f15db5ab2f3483ed0c15f27a62103d.png",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/4f427dc7-3fa4-4a6a-acfc-e220d9a9e633/images/39e3315c3c5ba7a1ca03ab2b94b0616d77f15db5ab2f3483ed0c15f27a62103d.png",
            "description": "Everything for new puppy parents: training pads, clicker, treats, toy, and guide book.",
            "pillar": "learn",
            "category": "training_tools",
            "paw_reward_points": 200,
            "in_stock": True
        }
    ]
    
    # Return curated products for the "Care Products" style section
    return {"products": curated_training_products, "count": len(curated_training_products)}


# ==================== GUIDES ====================

@router.get("/guides")
async def get_learn_guides(
    category: Optional[str] = None,
    topic: Optional[str] = None,
    limit: int = Query(default=20, le=100)
):
    """
    Get training guides and articles.
    The "Learn Bible" - comprehensive training content.
    """
    db = get_db()
    
    query = {}
    if category:
        query["category"] = category
    if topic:
        query["topic"] = {"$regex": topic, "$options": "i"}
    
    guides = await db.learn_guides.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    return {
        "guides": guides,
        "count": len(guides),
        "categories": await db.learn_guides.distinct("category")
    }


@router.get("/videos")
async def get_learn_videos(
    topic: Optional[str] = None,
    category: Optional[str] = None,
    breed: Optional[str] = None,
    max_results: int = Query(default=10, le=50)
):
    """
    Get training videos from database + YouTube.
    Combines curated videos with live YouTube search.
    """
    db = get_db()
    
    # Get curated videos from database
    query = {}
    if topic:
        query["topic"] = {"$regex": topic, "$options": "i"}
    if category:
        query["category"] = category
    
    db_videos = await db.learn_videos.find(query, {"_id": 0}).limit(max_results).to_list(max_results)
    
    # Also fetch from YouTube for fresh content
    youtube_videos = []
    try:
        from services.youtube_service import search_youtube_videos
        
        search_query = topic or "dog training"
        if breed:
            search_query = f"{breed} {search_query}"
        
        youtube_results = await search_youtube_videos(
            query=search_query,
            max_results=max_results
        )
        youtube_videos = youtube_results or []
    except Exception as e:
        logger.warning(f"YouTube fetch failed: {e}")
    
    return {
        "curated_videos": db_videos,
        "youtube_videos": youtube_videos,
        "total_curated": len(db_videos),
        "total_youtube": len(youtube_videos)
    }


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
    """
    Enroll in a training program via UNIFORM SERVICE FLOW.
    MIGRATED to handoff_to_spine() per Bible Section 12.0.
    """
    db = get_db()
    
    enrollment_id = f"ENR-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    pet_name = enrollment_data.get("pet_name", "Pet")
    user_name = enrollment_data.get("user_name", "Customer")
    program_name = enrollment_data.get("program_name", "Training Program")
    
    # Build intent
    intent = f"Training Enrollment: {program_name} for {pet_name}. Start: {enrollment_data.get('preferred_start_date', 'TBD')}"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HANDOFF TO SPINE - Single canonical ticket creation
    # ═══════════════════════════════════════════════════════════════════════════
    spine_result = await handoff_to_spine(
        db=db,
        route_name="learn_routes.py",
        endpoint="/learn/enroll",
        pillar="learn",
        category="enrollment",
        intent=intent,
        user={
            "email": enrollment_data.get("user_email"),
            "name": user_name,
            "phone": enrollment_data.get("user_phone")
        },
        pet={
            "id": enrollment_data.get("pet_id"),
            "name": pet_name,
            "breed": enrollment_data.get("pet_breed")
        },
        payload={
            "enrollment_id": enrollment_id,
            "program_id": enrollment_data.get("program_id"),
            "program_name": program_name,
            "trainer_id": enrollment_data.get("trainer_id"),
            "preferred_start_date": enrollment_data.get("preferred_start_date"),
            "preferred_time_slot": enrollment_data.get("preferred_time_slot"),
            "location_preference": enrollment_data.get("location_preference", "home"),
            "amount": enrollment_data.get("amount", 0)
        },
        channel="web",
        urgency="high",
        created_by="member",
        notify_admin=True,
        notify_member=True,
        tags=["learn", "enrollment"]
    )
    
    if not spine_result.get("success"):
        logger.error(f"[LEARN-ENROLL] Spine handoff failed: {spine_result.get('error')}")
        raise HTTPException(status_code=500, detail="Failed to create service ticket")
    
    canonical_ticket_id = spine_result["ticket_id"]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SAVE TO learn_enrollments collection (pillar-specific record)
    # ═══════════════════════════════════════════════════════════════════════════
    enrollment = {
        "id": enrollment_id,
        "ticket_id": canonical_ticket_id,  # Link to canonical ticket
        "program_id": enrollment_data.get("program_id"),
        "program_name": program_name,
        "trainer_id": enrollment_data.get("trainer_id"),
        "status": "pending_confirmation",
        
        # Pet & User Details
        "pet_id": enrollment_data.get("pet_id"),
        "pet_name": pet_name,
        "user_id": enrollment_data.get("user_id"),
        "user_name": user_name,
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
    
    logger.info(f"[SPINE-MIGRATED] learn_routes.py:/learn/enroll → {canonical_ticket_id} | pillar=learn category=enrollment")
    
    return {
        "success": True,
        "enrollment_id": enrollment_id,
        "ticket_id": canonical_ticket_id,
        "deep_link": spine_result.get("deep_link"),
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


@router.post("/admin/seed-products")
async def seed_learn_products():
    """Seed default learning products"""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    default_products = [
        {"id": "learn-prod-course", "name": "Basic Obedience Online Course", "description": "12-week video course for puppy training", "price": 2999, "original_price": 3999, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600", "category": "learn", "tags": ["course", "obedience", "online"], "pillar": "learn"},
        {"id": "learn-prod-clicker", "name": "Professional Clicker Training Kit", "description": "Training clicker with guide book", "price": 499, "original_price": 699, "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600", "category": "learn", "tags": ["clicker", "training", "kit"], "pillar": "learn"},
        {"id": "learn-prod-treats", "name": "Training Treat Pouch + Treats", "description": "Treat pouch with premium training treats", "price": 799, "original_price": 999, "image": "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=600", "category": "learn", "tags": ["treats", "pouch", "training"], "pillar": "learn"},
        {"id": "learn-prod-book", "name": "Dog Psychology Handbook", "description": "Understanding canine behavior guide", "price": 649, "original_price": 799, "image": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600", "category": "learn", "tags": ["book", "psychology", "behavior"], "pillar": "learn"},
        {"id": "learn-prod-whistle", "name": "Ultrasonic Training Whistle", "description": "Professional dog training whistle", "price": 399, "original_price": 499, "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600", "category": "learn", "tags": ["whistle", "training", "professional"], "pillar": "learn"},
        {"id": "learn-prod-video", "name": "Advanced Tricks Masterclass", "description": "Video course for advanced dog tricks", "price": 1999, "original_price": 2499, "image": "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=600", "category": "learn", "tags": ["video", "tricks", "advanced"], "pillar": "learn"},
    ]
    
    seeded = 0
    for product in default_products:
        product["created_at"] = now
        product["updated_at"] = now
        result = await db.learn_products.update_one({"id": product["id"]}, {"$set": product}, upsert=True)
        if result.upserted_id or result.modified_count:
            seeded += 1
    
    return {"message": f"Seeded {seeded} learn products", "products_seeded": seeded}


@router.get("/admin/products/export")
async def export_learn_products():
    """Export learn products as CSV-ready data"""
    db = get_db()
    products = await db.learn_products.find({}, {"_id": 0}).to_list(500)
    return {"products": products, "total": len(products)}


@router.post("/admin/products/import")
async def import_learn_products(products: List[dict]):
    """Import learn products from CSV/JSON"""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    imported = 0
    for product in products:
        product["id"] = product.get("id") or f"learn-{uuid.uuid4().hex[:8]}"
        product["category"] = "learn"
        product["pillar"] = "learn"
        product["created_at"] = now
        product["updated_at"] = now
        await db.learn_products.update_one({"id": product["id"]}, {"$set": product}, upsert=True)
        imported += 1
    
    return {"message": f"Imported {imported} products", "imported": imported}


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
            "contact_email": "priya@thedoggycompany.com",
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
            "contact_email": "raj@thedoggycompany.com",
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

