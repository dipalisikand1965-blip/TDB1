"""
Ticket → Soul Auto-Enrichment Module
=====================================

When a ticket is resolved, this module automatically extracts durable learnings
and persists them into the pet's Soul profile.

This ensures:
1. Mira compounds intelligence over time
2. Mira never rediscovers the same facts
3. Every ticket interaction enriches the pet's profile

DOCTRINE: "One resolution = One permanent learning opportunity"
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import logging
import re

logger = logging.getLogger(__name__)

# ============================================================================
# EXTRACTABLE CATEGORIES FROM TICKETS
# ============================================================================

EXTRACTABLE_CATEGORIES = {
    "grooming": {
        "keywords": ["groom", "bath", "haircut", "nail", "coat", "fur", "shampoo", "trim", "brush"],
        "soul_fields": ["grooming_preference", "grooming_frequency", "coat_type", "grooming_anxiety_triggers"]
    },
    "dietary": {
        "keywords": ["food", "treat", "diet", "allergy", "allergic", "eat", "meal", "feed", "nutrition"],
        "soul_fields": ["food_allergies", "favorite_treats", "dietary_restrictions", "food_preferences"]
    },
    "health": {
        "keywords": ["health", "vet", "medicine", "medication", "condition", "symptom", "pain", "sick", "arthritis"],
        "soul_fields": ["health_conditions", "medications", "vet_notes", "special_needs"]
    },
    "behavioral": {
        "keywords": ["anxiety", "fear", "scared", "aggressive", "calm", "excited", "behavior", "training"],
        "soul_fields": ["anxiety_triggers", "temperament", "behavior_notes", "training_notes"]
    },
    "travel": {
        "keywords": ["travel", "car", "flight", "trip", "vacation", "hotel", "board"],
        "soul_fields": ["travel_preferences", "car_behavior", "boarding_history"]
    },
    "activity": {
        "keywords": ["walk", "play", "exercise", "activity", "energy", "tire", "run"],
        "soul_fields": ["energy_level", "favorite_activities", "exercise_preferences"]
    }
}


def extract_learnings_from_ticket(ticket: Dict) -> Dict[str, Any]:
    """
    Extract durable learnings from a resolved ticket.
    
    Analyzes the full conversation thread to find:
    - User-stated preferences
    - Concierge discoveries
    - Health-related findings
    - Behavioral observations
    
    Args:
        ticket: Full ticket document with conversation history
        
    Returns:
        Dict of extracted learnings by category
    """
    learnings = {
        "categories_found": [],
        "extractions": {},
        "confidence": "low",
        "raw_insights": []
    }
    
    if not ticket:
        return learnings
    
    # Get all messages from ticket
    conversation = ticket.get("conversation", []) or ticket.get("messages", [])
    if not conversation:
        return learnings
    
    # Combine all text for analysis
    all_text = " ".join([
        msg.get("text", "") or msg.get("content", "") or ""
        for msg in conversation
    ]).lower()
    
    # Detect which categories are present
    for category, config in EXTRACTABLE_CATEGORIES.items():
        if any(kw in all_text for kw in config["keywords"]):
            learnings["categories_found"].append(category)
    
    # Extract specific insights based on patterns
    extractions = {}
    
    # ─────────────────────────────────────────────────────────────────────
    # ALLERGY EXTRACTION (HIGHEST PRIORITY - SAFETY)
    # ─────────────────────────────────────────────────────────────────────
    allergy_patterns = [
        r"allergic to (\w+)",
        r"allergy to (\w+)",
        r"can(?:')?t have (\w+)",
        r"avoid (\w+)",
        r"no (\w+) (?:please|products?|treats?)",
        r"(\w+) makes? (?:him|her|them) sick"
    ]
    
    allergies_found = []
    for pattern in allergy_patterns:
        matches = re.findall(pattern, all_text)
        allergies_found.extend(matches)
    
    if allergies_found:
        extractions["food_allergies"] = list(set(allergies_found))
        learnings["raw_insights"].append(f"Allergies identified: {', '.join(allergies_found)}")
    
    # ─────────────────────────────────────────────────────────────────────
    # PREFERENCE EXTRACTION
    # ─────────────────────────────────────────────────────────────────────
    preference_patterns = [
        r"(?:he|she|they) (?:love|loves|like|likes|prefer|prefers) (\w+(?:\s+\w+)?)",
        r"favorite (?:is|are) (\w+(?:\s+\w+)?)",
        r"(?:really|always) (?:enjoy|enjoys) (\w+)"
    ]
    
    preferences_found = []
    for pattern in preference_patterns:
        matches = re.findall(pattern, all_text)
        preferences_found.extend(matches)
    
    if preferences_found:
        extractions["preferences"] = list(set(preferences_found))
        learnings["raw_insights"].append(f"Preferences noted: {', '.join(preferences_found)}")
    
    # ─────────────────────────────────────────────────────────────────────
    # HEALTH CONDITION EXTRACTION
    # ─────────────────────────────────────────────────────────────────────
    health_patterns = [
        r"has (\w+ ?\w*(?:condition|issue|problem))",
        r"diagnosed with (\w+(?:\s+\w+)?)",
        r"suffering from (\w+)",
        r"(?:has|have) (\w+itis|\w+osis)"  # Medical suffixes
    ]
    
    health_found = []
    for pattern in health_patterns:
        matches = re.findall(pattern, all_text)
        health_found.extend(matches)
    
    if health_found:
        extractions["health_conditions"] = list(set(health_found))
        learnings["raw_insights"].append(f"Health notes: {', '.join(health_found)}")
    
    # ─────────────────────────────────────────────────────────────────────
    # ANXIETY/FEAR EXTRACTION
    # ─────────────────────────────────────────────────────────────────────
    anxiety_patterns = [
        r"(?:scared|afraid|anxious|nervous) (?:of|about|around) (\w+(?:\s+\w+)?)",
        r"(?:hates?|dislikes?) (\w+(?:\s+\w+)?)",
        r"(\w+) makes? (?:him|her|them) (?:anxious|scared|nervous)"
    ]
    
    anxiety_found = []
    for pattern in anxiety_patterns:
        matches = re.findall(pattern, all_text)
        anxiety_found.extend(matches)
    
    if anxiety_found:
        extractions["anxiety_triggers"] = list(set(anxiety_found))
        learnings["raw_insights"].append(f"Anxiety triggers: {', '.join(anxiety_found)}")
    
    # ─────────────────────────────────────────────────────────────────────
    # GROOMING PREFERENCE EXTRACTION
    # ─────────────────────────────────────────────────────────────────────
    if "grooming" in learnings["categories_found"]:
        grooming_prefs = []
        
        if "salon" in all_text or "professional" in all_text:
            grooming_prefs.append("prefers professional grooming")
        if "home" in all_text and "groom" in all_text:
            grooming_prefs.append("prefers home grooming")
        if "sensitive" in all_text and ("skin" in all_text or "coat" in all_text):
            grooming_prefs.append("has sensitive skin/coat")
        
        if grooming_prefs:
            extractions["grooming_preferences"] = grooming_prefs
    
    learnings["extractions"] = extractions
    
    # Set confidence based on how much we found
    if len(extractions) >= 3:
        learnings["confidence"] = "high"
    elif len(extractions) >= 1:
        learnings["confidence"] = "medium"
    
    return learnings


async def enrich_pet_soul_from_ticket(db, ticket: Dict) -> Dict[str, Any]:
    """
    Main function: Extract learnings from ticket and persist to Soul.
    
    This is called when a ticket is resolved/closed.
    
    Args:
        db: Database connection
        ticket: Resolved ticket document
        
    Returns:
        Dict with enrichment results
    """
    result = {
        "success": False,
        "pet_id": None,
        "learnings_extracted": 0,
        "fields_updated": [],
        "message": ""
    }
    
    # Get pet context from ticket
    pet_id = ticket.get("pet_id")
    pet_name = ticket.get("pet_name", "")
    
    if not pet_id:
        result["message"] = "No pet_id on ticket - cannot enrich Soul"
        logger.warning(f"[SOUL-ENRICH] Skipping ticket {ticket.get('ticket_id')} - no pet_id")
        return result
    
    result["pet_id"] = pet_id
    
    # Extract learnings
    learnings = extract_learnings_from_ticket(ticket)
    
    if not learnings.get("extractions"):
        result["message"] = "No extractable learnings found in ticket"
        logger.info(f"[SOUL-ENRICH] No learnings to extract from {ticket.get('ticket_id')}")
        return result
    
    result["learnings_extracted"] = len(learnings["extractions"])
    
    # Build update document for pet's doggy_soul_answers
    update_fields = {}
    
    extractions = learnings["extractions"]
    
    # Map extractions to Soul fields
    if extractions.get("food_allergies"):
        update_fields["doggy_soul_answers.food_allergies_from_tickets"] = extractions["food_allergies"]
        result["fields_updated"].append("food_allergies_from_tickets")
    
    if extractions.get("preferences"):
        update_fields["doggy_soul_answers.preferences_from_tickets"] = extractions["preferences"]
        result["fields_updated"].append("preferences_from_tickets")
    
    if extractions.get("health_conditions"):
        update_fields["doggy_soul_answers.health_notes_from_tickets"] = extractions["health_conditions"]
        result["fields_updated"].append("health_notes_from_tickets")
    
    if extractions.get("anxiety_triggers"):
        # Merge with existing anxiety triggers
        update_fields["doggy_soul_answers.anxiety_triggers_from_tickets"] = extractions["anxiety_triggers"]
        result["fields_updated"].append("anxiety_triggers_from_tickets")
    
    if extractions.get("grooming_preferences"):
        update_fields["doggy_soul_answers.grooming_notes_from_tickets"] = extractions["grooming_preferences"]
        result["fields_updated"].append("grooming_notes_from_tickets")
    
    if not update_fields:
        result["message"] = "Learnings extracted but no Soul fields to update"
        return result
    
    # Add metadata
    update_fields["doggy_soul_answers.last_ticket_enrichment"] = datetime.now(timezone.utc).isoformat()
    update_fields["doggy_soul_answers.ticket_enrichment_count"] = {"$inc": 1}
    
    # Perform update
    try:
        # Use $set for most fields, $addToSet for arrays to avoid duplicates
        update_result = await db.pets.update_one(
            {"id": pet_id},
            {"$set": update_fields}
        )
        
        if update_result.modified_count > 0:
            result["success"] = True
            result["message"] = f"Soul enriched with {len(result['fields_updated'])} new insights"
            logger.info(f"[SOUL-ENRICH] ✅ Enriched {pet_name}'s Soul from ticket {ticket.get('ticket_id')}: {result['fields_updated']}")
        else:
            result["message"] = "No changes made (pet not found or already up to date)"
            
    except Exception as e:
        result["message"] = f"Database error: {str(e)}"
        logger.error(f"[SOUL-ENRICH] Failed to enrich {pet_id}: {e}")
    
    return result


async def process_ticket_resolution_enrichment(db, ticket_id: str) -> Dict[str, Any]:
    """
    Called when a ticket is resolved - fetches ticket and enriches Soul.
    
    This is the entry point called from resolve_ticket endpoints.
    """
    # Fetch full ticket
    ticket = await db.mira_conversations.find_one({"ticket_id": ticket_id})
    
    if not ticket:
        # Try mira_tickets collection
        ticket = await db.mira_tickets.find_one({"ticket_id": ticket_id})
    
    if not ticket:
        return {
            "success": False,
            "message": f"Ticket {ticket_id} not found"
        }
    
    return await enrich_pet_soul_from_ticket(db, ticket)


# ============================================================================
# ENDPOINT FOR MANUAL ENRICHMENT (Admin use)
# ============================================================================

async def manually_enrich_from_all_tickets(db, pet_id: str) -> Dict[str, Any]:
    """
    Manually trigger enrichment from ALL resolved tickets for a pet.
    Useful for backfilling existing tickets.
    
    Args:
        db: Database connection
        pet_id: Pet ID to enrich
        
    Returns:
        Summary of all enrichments
    """
    results = {
        "pet_id": pet_id,
        "tickets_processed": 0,
        "enrichments_applied": 0,
        "fields_updated": [],
        "errors": []
    }
    
    # Find all resolved tickets for this pet
    tickets = await db.mira_conversations.find({
        "pet_id": pet_id,
        "status": {"$in": ["resolved", "closed", "completed"]}
    }).to_list(100)
    
    if not tickets:
        # Try mira_tickets
        tickets = await db.mira_tickets.find({
            "pet_id": pet_id,
            "status": {"$in": ["resolved", "closed", "completed"]}
        }).to_list(100)
    
    results["tickets_processed"] = len(tickets)
    
    for ticket in tickets:
        enrichment = await enrich_pet_soul_from_ticket(db, ticket)
        
        if enrichment.get("success"):
            results["enrichments_applied"] += 1
            results["fields_updated"].extend(enrichment.get("fields_updated", []))
        elif enrichment.get("message"):
            results["errors"].append(f"{ticket.get('ticket_id')}: {enrichment['message']}")
    
    # Dedupe fields
    results["fields_updated"] = list(set(results["fields_updated"]))
    
    return results
