"""
Mira File Upload - Document/Image Analysis
Allows users to upload images, PDFs, documents for Mira to analyze
"""

import os
import base64
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import httpx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira/upload", tags=["mira-upload"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "doggyconcierge")

# Supported file types
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_DOC_TYPES = ["application/pdf", "application/msword", 
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

class UploadResponse(BaseModel):
    upload_id: str
    filename: str
    file_type: str
    file_size: int
    analysis: Optional[str] = None
    status: str

class FileAnalysis(BaseModel):
    upload_id: str
    analysis_type: str
    result: dict
    confidence: float

def get_db():
    """Get database connection"""
    from motor.motor_asyncio import AsyncIOMotorClient
    if not MONGO_URL:
        return None
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

@router.post("/file", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    pet_id: str = Form(...),
    context: str = Form(None),
    session_id: str = Form(None)
):
    """
    Upload a file (image, PDF, document) for Mira to analyze
    """
    db = get_db()
    
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES + ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {file.content_type}. Allowed: images (jpg, png, gif, webp) and documents (pdf, doc, docx)"
        )
    
    # Read file content
    content = await file.read()
    
    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    
    try:
        upload_id = f"upload-{int(datetime.now().timestamp() * 1000)}"
        now = datetime.now(timezone.utc).isoformat()
        
        # Determine file category
        if file.content_type in ALLOWED_IMAGE_TYPES:
            file_category = "image"
        else:
            file_category = "document"
        
        # Store file metadata
        upload_doc = {
            "upload_id": upload_id,
            "pet_id": pet_id,
            "session_id": session_id,
            "filename": file.filename,
            "content_type": file.content_type,
            "file_category": file_category,
            "file_size": len(content),
            "context": context,
            "created_at": now,
            "status": "uploaded",
            # Store base64 encoded content (for small files)
            "content_b64": base64.b64encode(content).decode('utf-8') if len(content) < 5 * 1024 * 1024 else None
        }
        
        if db:
            await db.mira_uploads.insert_one(upload_doc)
        
        logger.info(f"[UPLOAD] File uploaded: {file.filename} ({len(content)} bytes) for pet {pet_id}")
        
        # Quick analysis hint based on file type
        analysis_hint = None
        if file_category == "image":
            analysis_hint = "Image received. I can analyze this for health concerns, product identification, or general questions."
        else:
            analysis_hint = "Document received. I can help summarize or extract information from this."
        
        return UploadResponse(
            upload_id=upload_id,
            filename=file.filename,
            file_type=file_category,
            file_size=len(content),
            analysis=analysis_hint,
            status="uploaded"
        )
        
    except Exception as e:
        logger.error(f"[UPLOAD] Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/file/{upload_id}")
async def get_upload(upload_id: str):
    """
    Get upload details and analysis results
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        upload = await db.mira_uploads.find_one(
            {"upload_id": upload_id},
            {"_id": 0, "content_b64": 0}  # Exclude large content from response
        )
        
        if not upload:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        return upload
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPLOAD] Failed to get upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pet/{pet_id}")
async def get_pet_uploads(pet_id: str, limit: int = 20):
    """
    Get all uploads for a pet
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        cursor = db.mira_uploads.find(
            {"pet_id": pet_id},
            {"_id": 0, "content_b64": 0}
        ).sort("created_at", -1).limit(limit)
        
        uploads = await cursor.to_list(length=limit)
        
        return {
            "pet_id": pet_id,
            "uploads": uploads,
            "count": len(uploads)
        }
        
    except Exception as e:
        logger.error(f"[UPLOAD] Failed to get pet uploads: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/{upload_id}")
async def analyze_upload(upload_id: str, question: str = None):
    """
    Analyze an uploaded file with optional question context
    This would integrate with vision LLM for images
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        upload = await db.mira_uploads.find_one({"upload_id": upload_id})
        
        if not upload:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        # For now, return placeholder analysis
        # TODO: Integrate with vision model (GPT-4V, Gemini Vision, etc.)
        
        analysis_result = {
            "upload_id": upload_id,
            "file_type": upload.get("file_category"),
            "question": question,
            "analysis": "Analysis feature coming soon. For now, please describe what you'd like to know about this file.",
            "status": "pending_implementation"
        }
        
        # Update upload with analysis request
        await db.mira_uploads.update_one(
            {"upload_id": upload_id},
            {"$set": {
                "analysis_requested": datetime.now(timezone.utc).isoformat(),
                "analysis_question": question
            }}
        )
        
        return analysis_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPLOAD] Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
