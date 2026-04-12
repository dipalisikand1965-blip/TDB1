"""
Member Rewards & Engagement Routes
Handles:
- Social sharing rewards (screenshot upload + admin approval)
- NPS/Pawmoter Score collection
- Loyalty points transactions
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
import uuid
import base64

logger = logging.getLogger(__name__)

# Create router
member_rewards_router = APIRouter(prefix="/api/rewards", tags=["Member Rewards"])

# Database reference
db = None

def set_member_rewards_db(database):
    global db
    db = database


# ==================== MODELS ====================

class SocialShareClaim(BaseModel):
    """Social media share claim for rewards"""
    id: str = None
    user_email: str
    user_name: Optional[str] = None
    social_platform: str = "instagram"
    social_handle: str
    post_url: Optional[str] = None
    screenshot_data: Optional[str] = None  # Base64 encoded
    screenshot_filename: Optional[str] = None
    reward_type: str = "social_share"
    points_amount: int = 20
    status: str = "pending"  # pending, approved, rejected
    admin_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: str = None


class NPSSubmission(BaseModel):
    """NPS/Pawmoter Score submission"""
    user_email: str
    user_name: Optional[str] = None
    score: int  # 0-10
    category: str  # promoter, passive, detractor
    feedback: Optional[str] = None
    reward_points: int = 10


# ==================== SOCIAL SHARE ENDPOINTS ====================

@member_rewards_router.post("/social-share-claim")
async def submit_social_share_claim(
    social_platform: str = Form(...),
    social_handle: str = Form(...),
    post_url: str = Form(None),
    user_email: str = Form(...),
    reward_type: str = Form("social_share"),
    points_amount: int = Form(20),
    file: UploadFile = File(...)
):
    """Submit a social share claim with screenshot for admin review"""
    try:
        # Read and encode the file
        file_content = await file.read()
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        
        claim_id = f"share-{uuid.uuid4().hex[:8]}"
        
        claim = {
            "id": claim_id,
            "user_email": user_email,
            "social_platform": social_platform,
            "social_handle": social_handle,
            "post_url": post_url,
            "screenshot_data": file_base64,
            "screenshot_filename": file.filename,
            "screenshot_content_type": file.content_type,
            "reward_type": reward_type,
            "points_amount": points_amount,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.social_share_claims.insert_one(claim)
        
        logger.info(f"Social share claim submitted: {claim_id} by {user_email}")
        
        return {
            "success": True,
            "claim_id": claim_id,
            "message": "Your claim has been submitted and is pending review",
            "status": "pending"
        }
        
    except Exception as e:
        logger.error(f"Failed to submit social share claim: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@member_rewards_router.get("/social-share-claims")
async def get_social_share_claims(status: str = None, limit: int = 50):
    """Get social share claims (admin endpoint)"""
    query = {}
    if status:
        query["status"] = status
    
    claims = await db.social_share_claims.find(
        query, 
        {"screenshot_data": 0}  # Exclude large data
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Convert ObjectId
    for claim in claims:
        claim["_id"] = str(claim.get("_id", ""))
    
    return {"claims": claims, "total": len(claims)}


@member_rewards_router.get("/social-share-claims/{claim_id}")
async def get_social_share_claim(claim_id: str):
    """Get a specific social share claim with screenshot"""
    claim = await db.social_share_claims.find_one({"id": claim_id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    claim["_id"] = str(claim.get("_id", ""))
    return claim


@member_rewards_router.put("/social-share-claims/{claim_id}/review")
async def review_social_share_claim(
    claim_id: str,
    action: str,  # approve or reject
    admin_notes: str = None,
    admin_username: str = None
):
    """Admin review of social share claim"""
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    claim = await db.social_share_claims.find_one({"id": claim_id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    new_status = "approved" if action == "approve" else "rejected"
    
    update_data = {
        "status": new_status,
        "reviewed_by": admin_username,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "admin_notes": admin_notes
    }
    
    await db.social_share_claims.update_one(
        {"id": claim_id},
        {"$set": update_data}
    )
    
    # If approved, add points to user
    if action == "approve":
        points = claim.get("points_amount", 20)
        await db.users.update_one(
            {"email": claim["user_email"]},
            {
                "$inc": {"loyalty_points": points},
                "$push": {
                    "loyalty_transactions": {
                        "type": "social_share_reward",
                        "points": points,
                        "description": f"Social share reward ({claim['social_platform']})",
                        "date": datetime.now(timezone.utc).isoformat()
                    }
                }
            }
        )
        logger.info(f"Awarded {points} points to {claim['user_email']} for social share")
    
    return {
        "success": True,
        "claim_id": claim_id,
        "new_status": new_status,
        "message": f"Claim {new_status}"
    }


# ==================== NPS/PAWMOTER ENDPOINTS ====================

@member_rewards_router.get("/nps/check")
async def check_nps_submission(user_email: str):
    """Check if user has submitted NPS recently (within 30 days)"""
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    
    recent = await db.nps_submissions.find_one({
        "user_email": user_email,
        "created_at": {"$gte": thirty_days_ago}
    })
    
    return {
        "has_recent_submission": recent is not None,
        "last_submission": recent.get("created_at") if recent else None
    }


@member_rewards_router.post("/nps/submit")
async def submit_nps_score(submission: NPSSubmission):
    """Submit NPS/Pawmoter score"""
    try:
        # Validate score
        if not 0 <= submission.score <= 10:
            raise HTTPException(status_code=400, detail="Score must be between 0 and 10")
        
        submission_id = f"nps-{uuid.uuid4().hex[:8]}"
        
        nps_data = {
            "id": submission_id,
            "user_email": submission.user_email,
            "user_name": submission.user_name,
            "score": submission.score,
            "category": submission.category,
            "feedback": submission.feedback,
            "reward_points": submission.reward_points,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.nps_submissions.insert_one(nps_data)
        
        # Award loyalty points
        if submission.reward_points > 0:
            await db.users.update_one(
                {"email": submission.user_email},
                {
                    "$inc": {"loyalty_points": submission.reward_points},
                    "$push": {
                        "loyalty_transactions": {
                            "type": "nps_reward",
                            "points": submission.reward_points,
                            "description": "Pawmoter Score survey completion",
                            "date": datetime.now(timezone.utc).isoformat()
                        }
                    }
                }
            )
        
        logger.info(f"NPS submission: {submission_id} - Score {submission.score} from {submission.user_email}")
        
        return {
            "success": True,
            "submission_id": submission_id,
            "points_awarded": submission.reward_points,
            "message": "Thank you for your feedback!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit NPS: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@member_rewards_router.get("/nps/stats")
async def get_nps_stats(days: int = 30):
    """Get NPS statistics (admin endpoint)"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    submissions = await db.nps_submissions.find(
        {"created_at": {"$gte": cutoff}}
    ).to_list(1000)
    
    total = len(submissions)
    if total == 0:
        return {
            "total_responses": 0,
            "nps_score": 0,
            "promoters": 0,
            "passives": 0,
            "detractors": 0
        }
    
    promoters = len([s for s in submissions if s.get("score", 0) >= 9])
    passives = len([s for s in submissions if 7 <= s.get("score", 0) < 9])
    detractors = len([s for s in submissions if s.get("score", 0) < 7])
    
    nps = round(((promoters - detractors) / total) * 100)
    
    return {
        "total_responses": total,
        "nps_score": nps,
        "promoters": promoters,
        "promoter_percent": round((promoters / total) * 100, 1),
        "passives": passives,
        "passive_percent": round((passives / total) * 100, 1),
        "detractors": detractors,
        "detractor_percent": round((detractors / total) * 100, 1),
        "period_days": days
    }


# ==================== LOYALTY POINTS ENDPOINTS ====================

@member_rewards_router.get("/loyalty/transactions")
async def get_loyalty_transactions(user_email: str, limit: int = 50):
    """Get loyalty point transactions for a user"""
    user = await db.users.find_one({"email": user_email}, {"loyalty_transactions": 1, "loyalty_points": 1})
    if not user:
        return {"transactions": [], "current_balance": 0}
    
    transactions = user.get("loyalty_transactions", [])
    # Sort by date descending
    transactions.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    return {
        "transactions": transactions[:limit],
        "current_balance": user.get("loyalty_points", 0)
    }


@member_rewards_router.get("/loyalty/expiring")
async def get_expiring_points(user_email: str):
    """Get points expiring in the next 30 days"""
    # Points expire 12 months from earning
    user = await db.users.find_one({"email": user_email}, {"loyalty_transactions": 1})
    if not user:
        return {"expiring_points": 0, "expiring_transactions": []}
    
    transactions = user.get("loyalty_transactions", [])
    
    # Find transactions from 11-12 months ago (expiring soon)
    now = datetime.now(timezone.utc)
    eleven_months_ago = (now - timedelta(days=330)).isoformat()
    twelve_months_ago = (now - timedelta(days=365)).isoformat()
    
    expiring = [
        t for t in transactions 
        if t.get("points", 0) > 0 and twelve_months_ago <= t.get("date", "") <= eleven_months_ago
    ]
    
    expiring_total = sum(t.get("points", 0) for t in expiring)
    
    return {
        "expiring_points": expiring_total,
        "expiring_transactions": expiring,
        "expires_within_days": 30
    }
