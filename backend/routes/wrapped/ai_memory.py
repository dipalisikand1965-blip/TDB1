"""
Pet Wrapped - AI Memory Generation
Mira writes one specific, beautiful memory for each pet.
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from bson import ObjectId
import os
import asyncio

router = APIRouter(prefix="/api/wrapped", tags=["Pet Wrapped"])

# MongoDB connection
from pymongo import MongoClient
client = MongoClient(os.environ.get("MONGO_URL"))
db = client[os.environ.get("DB_NAME", "doggy_company")]

# OpenAI for Mira's memory
EMERGENT_LLM_KEY = "sk-emergent-cEb0eF956Fa6741A31"
HAS_LLM = False
LlmChat = None
try:
    from emergentintegrations.llm.chat import LlmChat
    HAS_LLM = True
except ImportError:
    HAS_LLM = False


MIRA_MEMORY_PROMPT = """You are Mira, the soul companion of The Doggy Company. 
Write ONE memory — 2 to 3 sentences — for {pet_name}'s Pet Wrapped.

You have access to:
- Their Soul Profile answers: {soul_data}
- Their top pillars this year: {top_pillars}  
- Number of Mira conversations: {convo_count}
- Their relationships (babies, partners, siblings): {relationships}
- Their parent's name: {parent_name}

Write as if you were there. Write something that could only be true 
of this dog — not any dog. Reference one specific detail from their 
Soul Profile. Make it the kind of sentence the parent will screenshot.

Do not be generic. Do not say "had a wonderful year." 
Say the true thing.

{rainbow_bridge_context}

Write the memory now. Just the memory, nothing else."""


@router.post("/generate-memory/{pet_id}")
async def generate_mira_memory(pet_id: str):
    """
    Generate Mira's favorite memory for a pet's Wrapped.
    This is the AI-written, personalized memory that makes parents cry.
    """
    if not HAS_LLM:
        return {
            "success": False,
            "error": "LLM not available",
            "fallback_memory": "Every moment with them was a memory worth keeping."
        }
    
    # Get pet data
    try:
        pet = db.pets.find_one({"_id": ObjectId(pet_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid pet ID")
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "Your Pet")
    
    # Get parent name
    owner_id = pet.get("owner_id") or pet.get("user_id")
    parent_name = "their parent"
    if owner_id:
        # Try to find user - handle both ObjectId and UUID formats
        user = None
        try:
            user = db.users.find_one({"_id": ObjectId(owner_id)})
        except:
            user = db.users.find_one({"_id": owner_id})
        if not user:
            owner_email = pet.get("owner_email")
            if owner_email:
                user = db.users.find_one({"email": owner_email})
        if user:
            parent_name = user.get("name", user.get("first_name", "their parent"))
    
    # Get soul data
    soul_data = pet.get("soul_data", {})
    soul_summary = summarize_soul_data(soul_data)
    
    # Get top pillars
    pillar_counts = {}
    tickets = db.service_desk_tickets.find({"pet_id": pet_id})
    for ticket in tickets:
        pillar = ticket.get("pillar")
        if pillar:
            pillar_counts[pillar] = pillar_counts.get(pillar, 0) + 1
    top_pillars = sorted(pillar_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    top_pillars_str = ", ".join([p[0] for p in top_pillars]) if top_pillars else "Celebrate, Care, Dine"
    
    # Get conversation count
    convo_count = db.mira_conversations.count_documents({"pet_id": pet_id})
    
    # Get relationships
    relationships = pet.get("relationships", {})
    rel_summary = summarize_relationships(relationships, db)
    
    # Rainbow bridge context
    rainbow_bridge = pet.get("rainbow_bridge", False)
    rainbow_context = ""
    if rainbow_bridge:
        rainbow_context = f"\n\n{pet_name} has crossed the rainbow bridge. Write with tenderness. This memory is sacred. Honor their life, not their absence."
    
    # Build the prompt
    prompt = MIRA_MEMORY_PROMPT.format(
        pet_name=pet_name,
        soul_data=soul_summary,
        top_pillars=top_pillars_str,
        convo_count=convo_count,
        relationships=rel_summary,
        parent_name=parent_name,
        rainbow_bridge_context=rainbow_context
    )
    
    try:
        # Generate with OpenAI via Emergent
        import uuid
        from emergentintegrations.llm.chat import UserMessage
        
        session_id = f"wrapped_{pet_id}_{uuid.uuid4().hex[:8]}"
        system_message = "You are Mira, a soul-aware AI companion who knows each pet deeply. You write with warmth, specificity, and emotional truth."
        
        llm = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message
        )
        llm = llm.with_model("openai", "gpt-4o-mini")
        
        user_msg = UserMessage(text=prompt)
        response = await llm.send_message(user_msg)
        
        memory = response.strip().strip('"').strip("'")
        
        # Store the memory
        db.pet_wrapped_memories.update_one(
            {"pet_id": pet_id},
            {
                "$set": {
                    "memory": memory,
                    "generated_at": datetime.now(timezone.utc),
                    "pet_name": pet_name
                }
            },
            upsert=True
        )
        
        return {
            "success": True,
            "pet_id": pet_id,
            "pet_name": pet_name,
            "memory": memory
        }
        
    except Exception as e:
        # Fallback memory
        fallback = generate_fallback_memory(pet_name, soul_data, rainbow_bridge)
        return {
            "success": False,
            "error": str(e),
            "fallback_memory": fallback
        }


def summarize_soul_data(soul_data: dict) -> str:
    """Create a summary of soul profile answers for the prompt."""
    if not soul_data:
        return "No Soul Profile answers yet."
    
    summary_parts = []
    
    # Key questions to include
    key_fields = [
        ("joy", "What brings them joy"),
        ("delight", "What makes their eyes light up"),
        ("forgiveness", "What they've forgiven their parent for"),
        ("bond", "What they've seen their parent through"),
        ("personality", "Their personality"),
        ("fears", "What they're afraid of"),
        ("favorite_food", "Their favorite food"),
        ("favorite_human", "Their favorite human"),
        ("quirks", "Their quirks"),
        ("morning_routine", "Their morning routine")
    ]
    
    for field, label in key_fields:
        value = soul_data.get(field)
        if value and str(value).strip():
            summary_parts.append(f"- {label}: {value}")
    
    return "\n".join(summary_parts) if summary_parts else "Soul Profile started but details still being discovered."


def summarize_relationships(relationships: dict, db) -> str:
    """Summarize pet relationships."""
    if not relationships:
        return "No relationships recorded yet."
    
    parts = []
    
    babies = relationships.get("babies", [])
    if babies:
        baby_names = []
        for baby_id in babies[:5]:
            try:
                baby = db.pets.find_one({"_id": ObjectId(baby_id)})
                if baby:
                    baby_names.append(baby.get("name", "Unknown"))
            except:
                pass
        if baby_names:
            parts.append(f"Babies: {', '.join(baby_names)}")
    
    partners = relationships.get("partners", [])
    if partners:
        partner_names = []
        for partner_id in partners[:2]:
            try:
                partner = db.pets.find_one({"_id": ObjectId(partner_id)})
                if partner:
                    partner_names.append(partner.get("name", "Unknown"))
            except:
                pass
        if partner_names:
            parts.append(f"Partners: {', '.join(partner_names)}")
    
    family = relationships.get("family", [])
    if family:
        parts.append(f"Family humans: {', '.join(family[:3])}")
    
    return "; ".join(parts) if parts else "A beloved only child."


def generate_fallback_memory(pet_name: str, soul_data: dict, rainbow_bridge: bool) -> str:
    """Generate a fallback memory if AI fails."""
    if rainbow_bridge:
        return f"The quiet moments were the loudest. When {pet_name} simply sat beside their parent, asking for nothing but presence — that was everything."
    
    if soul_data.get("joy"):
        return f"Mira remembers the day {pet_name}'s parent first described what brings them joy. That answer changed how Mira saw them forever."
    
    return f"Every conversation about {pet_name} carried the same truth: they are deeply, completely loved."


@router.get("/memory/{pet_id}")
async def get_mira_memory(pet_id: str):
    """Get the stored Mira memory for a pet."""
    memory = db.pet_wrapped_memories.find_one({"pet_id": pet_id})
    
    if memory:
        return {
            "success": True,
            "pet_id": pet_id,
            "pet_name": memory.get("pet_name"),
            "memory": memory.get("memory"),
            "generated_at": memory.get("generated_at")
        }
    
    return {
        "success": False,
        "message": "No memory generated yet. Call POST /api/wrapped/generate-memory/{pet_id} first."
    }
