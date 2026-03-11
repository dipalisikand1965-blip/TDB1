"""
Checklist Routes - Pillar-specific printable checklists
Provides personalized checklist data for PDF generation

Created: March 12, 2026
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime
import os

router = APIRouter(prefix="/api/checklists", tags=["checklists"])

# ═══════════════════════════════════════════════════════════════════════════════
# CHECKLIST DATA - Organized by pillar
# ═══════════════════════════════════════════════════════════════════════════════

CHECKLISTS = {
    # ─────────────────────────────────────────────────────────────────────────
    # ADOPT PILLAR CHECKLISTS
    # ─────────────────────────────────────────────────────────────────────────
    "adopt": {
        "welcome_home": {
            "id": "welcome_home",
            "title": "Welcome Home Kit",
            "subtitle": "Everything you need for your new family member",
            "icon": "🏠",
            "color": "#22c55e",
            "sections": [
                {
                    "title": "Day 1 Essentials",
                    "icon": "📦",
                    "items": [
                        {"text": "Food and water bowls (stainless steel recommended)", "personalized": False},
                        {"text": "Age-appropriate food (puppy/adult/senior)", "personalized": True, "field": "life_stage"},
                        {"text": "Comfortable bed or crate with soft bedding", "personalized": False},
                        {"text": "Collar with ID tag (include your phone number)", "personalized": False},
                        {"text": "Leash (4-6 feet recommended for training)", "personalized": False},
                        {"text": "Poop bags and holder", "personalized": False},
                    ]
                },
                {
                    "title": "Safety & Comfort",
                    "icon": "🛡️",
                    "items": [
                        {"text": "Puppy-proof electrical cords and toxic plants", "personalized": False},
                        {"text": "Baby gates for restricted areas", "personalized": False},
                        {"text": "Secure trash cans with lids", "personalized": False},
                        {"text": "Remove small objects that could be swallowed", "personalized": False},
                        {"text": "Set up a quiet, safe space for decompression", "personalized": False},
                    ]
                },
                {
                    "title": "Health & Grooming",
                    "icon": "💊",
                    "items": [
                        {"text": "Schedule vet appointment within first week", "personalized": False},
                        {"text": "Brush appropriate for coat type", "personalized": True, "field": "coat_type"},
                        {"text": "Pet-safe shampoo", "personalized": False},
                        {"text": "Nail clippers or grinder", "personalized": False},
                        {"text": "Toothbrush and pet toothpaste", "personalized": False},
                    ]
                },
                {
                    "title": "First Week Goals",
                    "icon": "🎯",
                    "items": [
                        {"text": "Establish feeding schedule (same times daily)", "personalized": False},
                        {"text": "Start potty training routine", "personalized": False},
                        {"text": "Introduce to family members one at a time", "personalized": False},
                        {"text": "Begin crate training if using", "personalized": False},
                        {"text": "Keep environment calm - limit visitors", "personalized": False},
                    ]
                }
            ]
        },
        "first_vet_visit": {
            "id": "first_vet_visit",
            "title": "First Vet Visit Prep",
            "subtitle": "Be prepared for your pet's first checkup",
            "icon": "🏥",
            "color": "#3b82f6",
            "sections": [
                {
                    "title": "Documents to Bring",
                    "icon": "📄",
                    "items": [
                        {"text": "Adoption papers or purchase receipt", "personalized": False},
                        {"text": "Previous vaccination records (if available)", "personalized": False},
                        {"text": "Medical history from shelter/breeder", "personalized": False},
                        {"text": "List of current medications", "personalized": True, "field": "medications"},
                        {"text": "Insurance information (if enrolled)", "personalized": False},
                    ]
                },
                {
                    "title": "Questions to Ask",
                    "icon": "❓",
                    "items": [
                        {"text": "What vaccinations does my pet need?", "personalized": False},
                        {"text": "When should we spay/neuter?", "personalized": False},
                        {"text": "What's the ideal weight for my pet?", "personalized": True, "field": "breed"},
                        {"text": "What food do you recommend?", "personalized": False},
                        {"text": "Are there breed-specific health concerns?", "personalized": True, "field": "breed"},
                        {"text": "What parasite prevention do you recommend?", "personalized": False},
                        {"text": "How often should we schedule checkups?", "personalized": False},
                    ]
                },
                {
                    "title": "What to Expect",
                    "icon": "🔍",
                    "items": [
                        {"text": "Physical examination (eyes, ears, teeth, heart)", "personalized": False},
                        {"text": "Weight and body condition assessment", "personalized": False},
                        {"text": "Fecal test for parasites", "personalized": False},
                        {"text": "Vaccination schedule discussion", "personalized": False},
                        {"text": "Microchip scan or implantation", "personalized": False},
                    ]
                }
            ]
        }
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # EMERGENCY PILLAR CHECKLISTS
    # ─────────────────────────────────────────────────────────────────────────
    "emergency": {
        "emergency_card": {
            "id": "emergency_card",
            "title": "Emergency Ready Card",
            "subtitle": "Critical information at your fingertips",
            "icon": "🚨",
            "color": "#ef4444",
            "card_format": True,  # Wallet-sized format
            "sections": [
                {
                    "title": "Emergency Contacts",
                    "icon": "📞",
                    "items": [
                        {"text": "Primary Veterinarian", "personalized": True, "field": "vet_name", "input": True},
                        {"text": "Vet Phone", "personalized": True, "field": "vet_phone", "input": True},
                        {"text": "24/7 Emergency Clinic", "personalized": True, "field": "emergency_clinic", "input": True},
                        {"text": "Pet Poison Helpline: 1800-123-4567", "personalized": False},
                        {"text": "Emergency Contact Person", "personalized": True, "field": "emergency_contact", "input": True},
                    ]
                },
                {
                    "title": "Critical Health Info",
                    "icon": "⚠️",
                    "items": [
                        {"text": "Known Allergies", "personalized": True, "field": "allergies"},
                        {"text": "Current Medications", "personalized": True, "field": "medications"},
                        {"text": "Chronic Conditions", "personalized": True, "field": "health_conditions"},
                        {"text": "Blood Type (if known)", "personalized": True, "field": "blood_type", "input": True},
                        {"text": "Microchip Number", "personalized": True, "field": "microchip", "input": True},
                    ]
                }
            ]
        },
        "first_aid_kit": {
            "id": "first_aid_kit",
            "title": "Pet First Aid Kit",
            "subtitle": "Essential supplies for emergencies",
            "icon": "🩹",
            "color": "#f97316",
            "sections": [
                {
                    "title": "Wound Care",
                    "icon": "🩹",
                    "items": [
                        {"text": "Gauze pads and rolls (various sizes)", "personalized": False},
                        {"text": "Self-adhesive bandage wrap", "personalized": False},
                        {"text": "Antiseptic wipes (pet-safe)", "personalized": False},
                        {"text": "Styptic powder (for nail bleeding)", "personalized": False},
                        {"text": "Saline solution for wound cleaning", "personalized": False},
                        {"text": "Medical tape", "personalized": False},
                    ]
                },
                {
                    "title": "Tools & Equipment",
                    "icon": "🔧",
                    "items": [
                        {"text": "Digital thermometer (rectal)", "personalized": False},
                        {"text": "Blunt-tip scissors", "personalized": False},
                        {"text": "Tweezers (for splinters/ticks)", "personalized": False},
                        {"text": "Tick remover tool", "personalized": False},
                        {"text": "Disposable gloves", "personalized": False},
                        {"text": "Flashlight or penlight", "personalized": False},
                        {"text": "Muzzle or soft cloth (injured pets may bite)", "personalized": True, "field": "size"},
                    ]
                },
                {
                    "title": "Medications & Supplies",
                    "icon": "💊",
                    "items": [
                        {"text": "Hydrogen peroxide 3% (to induce vomiting - vet guidance only)", "personalized": False},
                        {"text": "Activated charcoal (for poisoning - vet guidance only)", "personalized": False},
                        {"text": "Benadryl (diphenhydramine) - check dose with vet", "personalized": False},
                        {"text": "Eye wash solution", "personalized": False},
                        {"text": "Ear cleaning solution", "personalized": False},
                        {"text": "Petroleum jelly", "personalized": False},
                    ]
                },
                {
                    "title": "Emergency Essentials",
                    "icon": "🚨",
                    "items": [
                        {"text": "Copy of vaccination records", "personalized": False},
                        {"text": "Recent photo of pet", "personalized": False},
                        {"text": "Emergency contact list", "personalized": False},
                        {"text": "Blanket or towel", "personalized": False},
                        {"text": "Collapsible water bowl", "personalized": False},
                        {"text": "Leash and collar (spare)", "personalized": False},
                    ]
                }
            ]
        }
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # TRAVEL PILLAR CHECKLISTS
    # ─────────────────────────────────────────────────────────────────────────
    "travel": {
        "travel_ready": {
            "id": "travel_ready",
            "title": "Travel Ready Pack",
            "subtitle": "Everything for safe travels with your pet",
            "icon": "✈️",
            "color": "#0ea5e9",
            "sections": [
                {
                    "title": "Essential Documents",
                    "icon": "📋",
                    "items": [
                        {"text": "Up-to-date vaccination certificate", "personalized": False},
                        {"text": "Health certificate (within 10 days of travel)", "personalized": False},
                        {"text": "Pet passport (for international travel)", "personalized": False},
                        {"text": "Microchip registration proof", "personalized": True, "field": "microchip"},
                        {"text": "Recent photo for identification", "personalized": False},
                        {"text": "Insurance documents", "personalized": False},
                    ]
                },
                {
                    "title": "Travel Gear",
                    "icon": "🧳",
                    "items": [
                        {"text": "Airline-approved carrier (sized for your pet)", "personalized": True, "field": "size"},
                        {"text": "Harness and leash", "personalized": False},
                        {"text": "Collapsible food and water bowls", "personalized": False},
                        {"text": "Waste bags", "personalized": False},
                        {"text": "Familiar blanket or toy (comfort item)", "personalized": False},
                        {"text": "Portable water bottle", "personalized": False},
                    ]
                },
                {
                    "title": "Food & Medication",
                    "icon": "🍖",
                    "items": [
                        {"text": "Enough food for trip + 2 extra days", "personalized": False},
                        {"text": "Treats for rewards", "personalized": False},
                        {"text": "Regular medications", "personalized": True, "field": "medications"},
                        {"text": "Motion sickness medication (if needed)", "personalized": True, "field": "travel_anxiety"},
                        {"text": "Calming supplements (if anxious traveler)", "personalized": True, "field": "anxiety_triggers"},
                    ]
                },
                {
                    "title": "Pre-Travel Checklist",
                    "icon": "✅",
                    "items": [
                        {"text": "Confirm pet policy with airline/hotel", "personalized": False},
                        {"text": "Book pet-friendly accommodation", "personalized": False},
                        {"text": "Research vets at destination", "personalized": False},
                        {"text": "Update ID tags with travel contact info", "personalized": False},
                        {"text": "Exercise pet before travel day", "personalized": False},
                        {"text": "Limit food 4-6 hours before travel", "personalized": False},
                    ]
                }
            ]
        }
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # FAREWELL PILLAR CHECKLISTS
    # ─────────────────────────────────────────────────────────────────────────
    "farewell": {
        "rainbow_bridge": {
            "id": "rainbow_bridge",
            "title": "Rainbow Bridge Guide",
            "subtitle": "A gentle guide for difficult times",
            "icon": "🌈",
            "color": "#a855f7",
            "sections": [
                {
                    "title": "Before Saying Goodbye",
                    "icon": "💜",
                    "items": [
                        {"text": "Discuss quality of life with your veterinarian", "personalized": False},
                        {"text": "Consider at-home euthanasia options", "personalized": False},
                        {"text": "Decide on cremation or burial preferences", "personalized": False},
                        {"text": "Take final photos and paw prints", "personalized": False},
                        {"text": "Spend quality time - their favorite activities", "personalized": True, "field": "favorite_activities"},
                        {"text": "Say goodbye with family members", "personalized": False},
                    ]
                },
                {
                    "title": "Memorial Options",
                    "icon": "🕯️",
                    "items": [
                        {"text": "Individual cremation with ashes returned", "personalized": False},
                        {"text": "Communal cremation", "personalized": False},
                        {"text": "Home burial (check local regulations)", "personalized": False},
                        {"text": "Pet cemetery burial", "personalized": False},
                        {"text": "Memorial jewelry with ashes", "personalized": False},
                        {"text": "Custom portrait or artwork", "personalized": False},
                    ]
                },
                {
                    "title": "Honoring Their Memory",
                    "icon": "🌟",
                    "items": [
                        {"text": "Create a memory box with collar, toys, photos", "personalized": False},
                        {"text": "Plant a memorial tree or garden", "personalized": False},
                        {"text": "Donate to animal charity in their name", "personalized": True, "field": "name"},
                        {"text": "Write a tribute or letter", "personalized": False},
                        {"text": "Frame their favorite photo", "personalized": False},
                        {"text": "Keep their paw print casting", "personalized": False},
                    ]
                },
                {
                    "title": "Grief Support",
                    "icon": "🤍",
                    "items": [
                        {"text": "Allow yourself to grieve - it's okay to cry", "personalized": False},
                        {"text": "Talk to friends who understand pet loss", "personalized": False},
                        {"text": "Consider pet loss support groups", "personalized": False},
                        {"text": "Give yourself time before getting a new pet", "personalized": False},
                        {"text": "Remember: grief reflects the depth of love", "personalized": False},
                    ]
                }
            ]
        }
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # CARE PILLAR CHECKLISTS
    # ─────────────────────────────────────────────────────────────────────────
    "care": {
        "grooming_schedule": {
            "id": "grooming_schedule",
            "title": "Grooming Schedule",
            "subtitle": "Keep your pet looking and feeling great",
            "icon": "✨",
            "color": "#14b8a6",
            "sections": [
                {
                    "title": "Daily Care",
                    "icon": "📅",
                    "items": [
                        {"text": "Check eyes for discharge or redness", "personalized": False},
                        {"text": "Check ears for odor or debris", "personalized": False},
                        {"text": "Brush teeth (or use dental chews)", "personalized": False},
                        {"text": "Brush coat", "personalized": True, "field": "coat_type", "note": "Daily for long coats, 2-3x/week for short"},
                    ]
                },
                {
                    "title": "Weekly Care",
                    "icon": "📆",
                    "items": [
                        {"text": "Full body brush (check for lumps, ticks)", "personalized": False},
                        {"text": "Clean ears with pet-safe solution", "personalized": False},
                        {"text": "Check and clean teeth thoroughly", "personalized": False},
                        {"text": "Trim hair around eyes if needed", "personalized": True, "field": "breed"},
                        {"text": "Check paw pads for cracks or debris", "personalized": False},
                    ]
                },
                {
                    "title": "Monthly Care",
                    "icon": "🗓️",
                    "items": [
                        {"text": "Trim nails (or check if needed)", "personalized": False},
                        {"text": "Full bath with appropriate shampoo", "personalized": True, "field": "coat_type"},
                        {"text": "Clean facial folds (if applicable)", "personalized": True, "field": "breed"},
                        {"text": "Check anal glands (or schedule groomer)", "personalized": False},
                        {"text": "Apply flea/tick prevention", "personalized": False},
                    ]
                },
                {
                    "title": "Seasonal Care",
                    "icon": "🌸",
                    "items": [
                        {"text": "Spring: Increase brushing (shedding season)", "personalized": False},
                        {"text": "Summer: Check for hot spots, keep cool", "personalized": False},
                        {"text": "Fall: Prepare coat for winter", "personalized": False},
                        {"text": "Winter: Moisturize paws, limit bath frequency", "personalized": False},
                        {"text": "Professional grooming every 6-8 weeks", "personalized": True, "field": "coat_type"},
                    ]
                }
            ]
        }
    }
}

# Breed-specific grooming notes
BREED_GROOMING_NOTES = {
    "Shih Tzu": "Daily brushing essential. Professional grooming every 4-6 weeks. Keep face clean.",
    "Poodle": "No shedding but requires professional grooming every 4-6 weeks. Daily brushing to prevent matting.",
    "Labrador": "Weekly brushing, more during shedding season. Occasional baths.",
    "Golden Retriever": "Brush 2-3 times weekly. Regular ear cleaning important.",
    "German Shepherd": "Heavy shedder - brush daily during shedding season. Regular nail trims.",
    "Beagle": "Weekly brushing. Regular ear cleaning due to floppy ears.",
    "Bulldog": "Clean facial wrinkles daily. Weekly brushing. Monitor skin folds.",
    "Pug": "Clean facial wrinkles daily. Weekly brushing. Watch for overheating.",
    "Indie": "Low maintenance. Weekly brushing. Regular nail trims.",
    "Husky": "Heavy shedding twice yearly. Never shave. Brush 2-3 times weekly.",
}


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES - Ordered from most specific to least specific
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/all/available")
async def get_all_available_checklists():
    """Get all available checklists across all pillars"""
    all_checklists = []
    
    for pillar, checklists in CHECKLISTS.items():
        for checklist_id, checklist in checklists.items():
            all_checklists.append({
                "pillar": pillar,
                "id": checklist["id"],
                "title": checklist["title"],
                "subtitle": checklist["subtitle"],
                "icon": checklist["icon"],
                "color": checklist["color"]
            })
    
    return {
        "total": len(all_checklists),
        "checklists": all_checklists
    }


@router.get("/{pillar}")
async def get_pillar_checklists(pillar: str):
    """Get all available checklists for a pillar"""
    if pillar not in CHECKLISTS:
        raise HTTPException(status_code=404, detail=f"No checklists found for pillar: {pillar}")
    
    checklists = CHECKLISTS[pillar]
    return {
        "pillar": pillar,
        "checklists": [
            {
                "id": checklist["id"],
                "title": checklist["title"],
                "subtitle": checklist["subtitle"],
                "icon": checklist["icon"],
                "color": checklist["color"]
            }
            for checklist in checklists.values()
        ]
    }


@router.get("/{pillar}/{checklist_id}")
async def get_checklist(pillar: str, checklist_id: str):
    """Get a specific checklist with full data"""
    if pillar not in CHECKLISTS:
        raise HTTPException(status_code=404, detail=f"No checklists found for pillar: {pillar}")
    
    if checklist_id not in CHECKLISTS[pillar]:
        raise HTTPException(status_code=404, detail=f"Checklist not found: {checklist_id}")
    
    checklist = CHECKLISTS[pillar][checklist_id]
    return {
        "pillar": pillar,
        "checklist": checklist,
        "generated_at": datetime.now().isoformat()
    }


@router.get("/{pillar}/{checklist_id}/personalized")
async def get_personalized_checklist(
    pillar: str, 
    checklist_id: str,
    pet_name: Optional[str] = None,
    breed: Optional[str] = None,
    size: Optional[str] = None,
    coat_type: Optional[str] = None,
    allergies: Optional[str] = None,
    medications: Optional[str] = None,
    life_stage: Optional[str] = None
):
    """Get a personalized checklist with pet-specific information"""
    if pillar not in CHECKLISTS:
        raise HTTPException(status_code=404, detail=f"No checklists found for pillar: {pillar}")
    
    if checklist_id not in CHECKLISTS[pillar]:
        raise HTTPException(status_code=404, detail=f"Checklist not found: {checklist_id}")
    
    checklist = CHECKLISTS[pillar][checklist_id].copy()
    
    # Add personalization data
    personalization = {
        "pet_name": pet_name,
        "breed": breed,
        "size": size,
        "coat_type": coat_type,
        "allergies": allergies or "None known",
        "medications": medications or "None",
        "life_stage": life_stage or "Adult",
        "grooming_note": BREED_GROOMING_NOTES.get(breed, "Follow standard grooming schedule for your pet's coat type.")
    }
    
    return {
        "pillar": pillar,
        "checklist": checklist,
        "personalization": personalization,
        "generated_at": datetime.now().isoformat()
    }
