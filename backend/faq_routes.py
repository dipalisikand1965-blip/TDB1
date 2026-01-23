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
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.faqs.insert_one(faq_data)
    return {"message": "FAQ created", "faq": {k: v for k, v in faq_data.items() if k != "_id"}}


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
