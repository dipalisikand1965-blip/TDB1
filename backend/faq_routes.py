"""
FAQ Routes for The Doggy Company
Handles FAQ CRUD operations for admin and public access
"""

import os
import uuid
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Create routers
faq_router = APIRouter(prefix="/api", tags=["FAQs"])
faq_admin_router = APIRouter(prefix="/api/admin", tags=["FAQs Admin"])

# Database reference
db: AsyncIOMotorDatabase = None

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials"""
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


# ==================== ADMIN FAQ ROUTES ====================

@faq_admin_router.get("/faqs")
async def get_all_faqs(username: str = Depends(verify_admin)):
    """Get all FAQs for admin"""
    faqs = await db.faqs.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    categories = list(set(f.get("category", "General") for f in faqs))
    return {"faqs": faqs, "categories": categories, "total": len(faqs)}


@faq_admin_router.post("/faqs")
async def create_faq(faq: dict, username: str = Depends(verify_admin)):
    """Create a new FAQ"""
    faq_data = {
        "id": f"faq-{uuid.uuid4().hex[:8]}",
        "question": faq.get("question", ""),
        "answer": faq.get("answer", ""),
        "category": faq.get("category", "General"),
        "order": faq.get("order", 0),
        "is_featured": faq.get("is_featured", False),
        "link_to": faq.get("link_to"),  # Link to relevant page e.g. "/pet/123?tab=personality"
        "link_text": faq.get("link_text"),  # Text for the link e.g. "Complete your Pet Soul"
        "tags": faq.get("tags", []),  # For search/filtering
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.faqs.insert_one(faq_data)
    return {"message": "FAQ created", "faq": {k: v for k, v in faq_data.items() if k != "_id"}}


@faq_admin_router.post("/faqs/seed-tdc-faqs")
async def seed_tdc_faqs(username: str = Depends(verify_admin)):
    """Seed comprehensive TDC FAQs about all programs"""
    
    tdc_faqs = [
        # Pet Soul FAQs
        {
            "question": "What is Pet Soul™ and why should I complete it?",
            "answer": "Pet Soul™ is your pet's comprehensive digital profile that captures everything from their personality and preferences to health data and daily routines. Completing it helps us:\n\n• Provide personalized product recommendations\n• Match your pet with the right services (boarding, daycare, grooming)\n• Ensure safety during any service (knowing allergies, fears, medical conditions)\n• Remember your pet's preferences so you don't have to repeat yourself\n\nThe more complete your Pet Soul, the better we can care for your furry family member!",
            "category": "Pet Soul",
            "link_to": "/my-pets",
            "link_text": "Complete your Pet Soul™",
            "tags": ["pet soul", "profile", "personalization"],
            "order": 1,
            "is_featured": True
        },
        {
            "question": "How is the Pet Soul™ score calculated?",
            "answer": "Your Pet Soul score (0-100%) reflects how well we know your pet. Here's how it works:\n\n• There are ~60 questions across 8 categories: Identity, Family, Routine, Home, Travel, Nutrition, Training, and Health\n• Each answered question adds points based on importance\n• Basic info (name, breed) = lower weight\n• Safety-critical info (allergies, medications) = higher weight\n\nMilestones:\n• 25% = Basics covered\n• 50% = Good foundation for services\n• 75% = Strong understanding\n• 100% = Complete profile, best for complex needs",
            "category": "Pet Soul",
            "link_to": "/my-pets",
            "link_text": "Check your score",
            "tags": ["pet soul", "score", "calculation"],
            "order": 2
        },
        {
            "question": "What rewards do I get for completing Pet Soul™?",
            "answer": "You earn Paw Points at each Pet Soul milestone:\n\n• 25% completion → 50 Paw Points\n• 50% completion → 100 Paw Points\n• 75% completion → 250 Paw Points\n• 100% completion → 500 Paw Points\n\nThat's up to 900 Paw Points (₹90 value) just for telling us about your pet! Plus, a complete profile means better recommendations and safer service experiences.",
            "category": "Pet Soul",
            "link_to": "/dashboard?tab=rewards",
            "link_text": "View your rewards",
            "tags": ["pet soul", "rewards", "paw points"],
            "order": 3
        },
        # Paw Points FAQs
        {
            "question": "What are Paw Points and how do I earn them?",
            "answer": "Paw Points are our loyalty rewards currency. Here's how you earn:\n\n• Pet Soul milestones: 50-500 points per milestone\n• First order: 100 points\n• Every ₹100 spent: 1 point\n• Referrals: 500 points per successful referral\n• Reviews: 25 points per review\n• Pet's birthday: 100 bonus points\n\nMembers earn at accelerated rates:\n• Annual members: 2x points\n• VIP members: 5x points",
            "category": "Rewards",
            "link_to": "/dashboard?tab=rewards",
            "link_text": "Check your Paw Points",
            "tags": ["paw points", "rewards", "loyalty", "earn"],
            "order": 1,
            "is_featured": True
        },
        {
            "question": "How do I redeem Paw Points?",
            "answer": "Redeeming is simple:\n\n• 100 Paw Points = ₹10 discount\n• Apply at checkout on any order\n• Points never expire for active members\n• Special rewards unlock at higher point levels\n\nYou can view and redeem your points in your Member Dashboard under 'Rewards'.",
            "category": "Rewards",
            "link_to": "/dashboard?tab=rewards",
            "link_text": "Redeem now",
            "tags": ["paw points", "redeem", "discount"],
            "order": 2
        },
        # Membership FAQs
        {
            "question": "What membership plans do you offer?",
            "answer": "We have three tiers:\n\n**Free** - Basic access, limited features\n\n**Annual (₹2,999/year)**:\n• 10% off all products\n• Priority booking\n• Free delivery above ₹499\n• Member-only events\n• 2x Paw Points\n\n**VIP (₹9,999/year)**:\n• 20% off all products\n• Dedicated concierge\n• Free delivery always\n• Complimentary birthday celebration\n• Early access to new products\n• 5x Paw Points",
            "category": "Membership",
            "link_to": "/membership",
            "link_text": "View membership plans",
            "tags": ["membership", "plans", "benefits", "pricing"],
            "order": 1,
            "is_featured": True
        },
        {
            "question": "Can I upgrade my membership anytime?",
            "answer": "Yes! You can upgrade anytime. When you upgrade:\n• Your new benefits start immediately\n• You only pay the difference (prorated)\n• Your Paw Points earning rate increases right away\n• Any existing orders will honor the better discount",
            "category": "Membership",
            "link_to": "/membership",
            "link_text": "Upgrade now",
            "tags": ["membership", "upgrade"],
            "order": 2
        },
        # Soul Whisper FAQs
        {
            "question": "What is Soul Whisper™?",
            "answer": "Soul Whisper™ is our gentle way of building your pet's profile over time. Instead of filling out a long form all at once, we send you 1-2 simple questions per week via WhatsApp.\n\nTopics are based on what's missing in your profile, and you can answer at your convenience. It's designed to not overwhelm you while gradually creating a complete picture of your pet.",
            "category": "Pet Soul",
            "link_to": "/dashboard?tab=settings",
            "link_text": "Manage notifications",
            "tags": ["soul whisper", "whatsapp", "notifications"],
            "order": 4
        },
        # Mira FAQs
        {
            "question": "Who is Mira and what can she help with?",
            "answer": "Mira is The Doggy Company's AI concierge. She can help you with:\n\n• Finding products for your pet\n• Booking services (grooming, boarding, travel)\n• Answering questions about our programs\n• Getting personalized recommendations\n• Tracking orders\n• Pet care advice\n\nMira knows your pet's profile, so her recommendations are tailored specifically to your furry friend!",
            "category": "Mira AI",
            "link_to": "/mira",
            "link_text": "Chat with Mira",
            "tags": ["mira", "ai", "concierge", "help"],
            "order": 1,
            "is_featured": True
        },
        # The 14 Pillars
        {
            "question": "What services does The Doggy Company offer?",
            "answer": "We offer 14 pillars of pet services:\n\n🎂 **Celebrate** - Birthday cakes & treats\n🍽️ **Dine** - Pet-friendly restaurants\n🏨 **Stay** - Boarding & daycare\n✈️ **Travel** - Pet transport & relocation\n💊 **Care** - Vet & grooming\n🎾 **Enjoy** - Activities & playdates\n🏃 **Fit** - Exercise & swimming\n🎓 **Learn** - Training classes\n📄 **Paperwork** - Insurance & licenses\n📋 **Advisory** - Nutrition & behavior\n🚨 **Emergency** - 24/7 vet network\n🌈 **Farewell** - End-of-life care\n🐾 **Adopt** - Adoption assistance\n🛒 **Shop** - Food & accessories",
            "category": "Services",
            "link_to": "/",
            "link_text": "Explore all services",
            "tags": ["services", "pillars", "what we do"],
            "order": 1,
            "is_featured": True
        },
        # PWA
        {
            "question": "Can I install The Doggy Company as an app?",
            "answer": "Yes! Our website works as a Progressive Web App (PWA). To install:\n\n**iPhone/iPad:**\n1. Open in Safari\n2. Tap the Share button\n3. Select 'Add to Home Screen'\n\n**Android:**\n1. Open in Chrome\n2. Tap the menu (3 dots)\n3. Select 'Install App' or 'Add to Home Screen'\n\nBenefits: Faster loading, works offline, push notifications!",
            "category": "App & Technology",
            "tags": ["pwa", "app", "install", "mobile"],
            "order": 1
        }
    ]
    
    created_count = 0
    updated_count = 0
    
    for faq in tdc_faqs:
        # Check if similar FAQ exists (by question)
        existing = await db.faqs.find_one({"question": faq["question"]})
        if existing:
            # Update existing
            faq["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.faqs.update_one({"question": faq["question"]}, {"$set": faq})
            updated_count += 1
        else:
            # Create new
            faq["id"] = f"faq-tdc-{uuid.uuid4().hex[:8]}"
            faq["created_at"] = datetime.now(timezone.utc).isoformat()
            faq["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.faqs.insert_one(faq)
            created_count += 1
    
    return {
        "message": "TDC FAQs seeded",
        "created": created_count,
        "updated": updated_count,
        "total": created_count + updated_count
    }


@faq_admin_router.put("/faqs/{faq_id}")
async def update_faq(faq_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a FAQ"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.faqs.update_one({"id": faq_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    updated = await db.faqs.find_one({"id": faq_id}, {"_id": 0})
    return {"message": "FAQ updated", "faq": updated}


@faq_admin_router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str, username: str = Depends(verify_admin)):
    """Delete a FAQ"""
    result = await db.faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted"}


# ==================== PUBLIC FAQ ROUTES ====================

@faq_router.get("/faqs")
async def get_public_faqs(category: Optional[str] = None):
    """Public endpoint for FAQs"""
    query = {}
    if category:
        query["category"] = category
    faqs = await db.faqs.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    categories = await db.faqs.distinct("category")
    return {"faqs": faqs, "categories": categories}
