"""
Mockup Cloud Storage Service
Converts base64 mockup images to Cloudinary CDN URLs for better performance.

Usage:
1. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
2. Call POST /api/mockups/convert-to-cloud to convert a single mockup
3. Call POST /api/mockups/batch-convert-to-cloud to convert all mockups

Benefits:
- Reduces API response size from ~2MB to ~100 bytes per product
- Faster page loads
- CDN delivery with transformations
- Persistent storage across deployments
"""

import os
import asyncio
import base64
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, HTTPException
from typing import Optional
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Initialize Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# Router
mockup_cloud_router = APIRouter(prefix="/api/mockups", tags=["Mockup Cloud Storage"])

# Database reference (set from server.py)
db = None

def set_db(database):
    global db
    db = database


def is_cloudinary_configured():
    """Check if Cloudinary credentials are set"""
    return all([
        os.getenv("CLOUDINARY_CLOUD_NAME"),
        os.getenv("CLOUDINARY_API_KEY"),
        os.getenv("CLOUDINARY_API_SECRET")
    ])


async def upload_base64_to_cloudinary(base64_data: str, product_id: str, breed: str = "unknown") -> Optional[str]:
    """
    Upload a base64 image to Cloudinary and return the URL.
    
    Args:
        base64_data: The base64 encoded image (with or without data:image prefix)
        product_id: Unique identifier for the product (used in public_id)
        breed: Breed name for folder organization
        
    Returns:
        Cloudinary URL or None if upload fails
    """
    if not is_cloudinary_configured():
        logger.warning("Cloudinary not configured, skipping upload")
        return None
    
    try:
        # Remove data:image/png;base64, prefix if present
        if base64_data.startswith("data:"):
            base64_data = base64_data.split(",", 1)[1]
        
        # Clean the breed name for folder use
        clean_breed = breed.lower().replace(" ", "_").replace("-", "_")[:30]
        
        # Create a unique public_id
        public_id = f"doggy/mockups/{clean_breed}/{product_id}"
        
        # Upload to Cloudinary — run_in_executor so sync call never blocks event loop
        payload = f"data:image/png;base64,{base64_data}"
        def _upload():
            return cloudinary.uploader.upload(
                payload,
                public_id=public_id,
                overwrite=True,
                resource_type="image",
                folder="",
                format="webp",
                quality="auto:good",
                transformation=[
                    {"width": 800, "height": 800, "crop": "limit"},
                    {"quality": "auto:good"},
                    {"fetch_format": "auto"}
                ]
            )
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _upload)
        
        logger.info(f"Uploaded mockup to Cloudinary: {result.get('secure_url')}")
        return result.get("secure_url")
        
    except Exception as e:
        logger.error(f"Failed to upload to Cloudinary: {e}")
        return None


@mockup_cloud_router.get("/cloud-status")
async def get_cloud_storage_status():
    """Check Cloudinary configuration and mockup stats"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Count mockups by storage type
    base64_count = await db.breed_products.count_documents({
        "mockup_url": {"$regex": "^data:image"}
    })
    
    cloud_count = await db.breed_products.count_documents({
        "mockup_url": {"$regex": "^https://res.cloudinary.com"}
    })
    
    total_with_mockups = await db.breed_products.count_documents({
        "mockup_url": {"$exists": True, "$ne": None, "$ne": ""}
    })
    
    return {
        "cloudinary_configured": is_cloudinary_configured(),
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME", "not_set"),
        "mockup_stats": {
            "total_with_mockups": total_with_mockups,
            "base64_stored": base64_count,
            "cloudinary_stored": cloud_count,
            "pending_conversion": base64_count
        },
        "recommendation": "Run batch conversion to improve performance" if base64_count > 0 else "All mockups are cloud-hosted!"
    }


@mockup_cloud_router.post("/convert-to-cloud/{product_id}")
async def convert_single_mockup_to_cloud(product_id: str):
    """Convert a single product's base64 mockup to Cloudinary URL"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    if not is_cloudinary_configured():
        raise HTTPException(status_code=400, detail="Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env")
    
    # Get the product
    product = await db.breed_products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    mockup_url = product.get("mockup_url", "")
    
    # Check if already on Cloudinary
    if mockup_url.startswith("https://res.cloudinary.com"):
        return {
            "message": "Already on Cloudinary",
            "url": mockup_url,
            "converted": False
        }
    
    # Check if it's base64
    if not mockup_url.startswith("data:image"):
        raise HTTPException(status_code=400, detail="No base64 mockup to convert")
    
    # Upload to Cloudinary
    cloud_url = await upload_base64_to_cloudinary(
        mockup_url, 
        product_id,
        product.get("breed", "unknown")
    )
    
    if not cloud_url:
        raise HTTPException(status_code=500, detail="Failed to upload to Cloudinary")
    
    # Update database
    await db.breed_products.update_one(
        {"id": product_id},
        {
            "$set": {
                "mockup_url": cloud_url,
                "mockup_cloud_url": cloud_url,  # Keep a reference
                "cloud_converted_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {
        "message": "Converted to Cloudinary",
        "url": cloud_url,
        "converted": True,
        "product_id": product_id
    }


@mockup_cloud_router.post("/batch-convert-to-cloud")
async def batch_convert_mockups_to_cloud(limit: int = 10):
    """
    Convert multiple base64 mockups to Cloudinary URLs.
    Run this in batches to avoid timeouts.
    
    Args:
        limit: Number of mockups to convert in this batch (default 10, max 50)
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    if not is_cloudinary_configured():
        raise HTTPException(status_code=400, detail="Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env")
    
    limit = min(limit, 50)  # Cap at 50 to avoid timeouts
    
    # Find products with base64 mockups
    products = await db.breed_products.find({
        "mockup_url": {"$regex": "^data:image"}
    }).limit(limit).to_list(limit)
    
    if not products:
        return {
            "message": "No base64 mockups to convert",
            "converted": 0,
            "remaining": 0
        }
    
    converted = []
    failed = []
    
    for product in products:
        try:
            cloud_url = await upload_base64_to_cloudinary(
                product.get("mockup_url", ""),
                product.get("id"),
                product.get("breed", "unknown")
            )
            
            if cloud_url:
                await db.breed_products.update_one(
                    {"id": product.get("id")},
                    {
                        "$set": {
                            "mockup_url": cloud_url,
                            "mockup_cloud_url": cloud_url,
                            "cloud_converted_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                converted.append({
                    "id": product.get("id"),
                    "name": product.get("name"),
                    "url": cloud_url
                })
            else:
                failed.append(product.get("id"))
                
        except Exception as e:
            logger.error(f"Failed to convert {product.get('id')}: {e}")
            failed.append(product.get("id"))
    
    # Count remaining
    remaining = await db.breed_products.count_documents({
        "mockup_url": {"$regex": "^data:image"}
    })
    
    return {
        "message": f"Converted {len(converted)} mockups to Cloudinary",
        "converted": len(converted),
        "failed": len(failed),
        "remaining": remaining,
        "converted_products": converted[:10],  # Show first 10
        "failed_ids": failed
    }


@mockup_cloud_router.get("/cloudinary-signature")
async def get_cloudinary_signature(folder: str = "doggy/mockups"):
    """
    Get a signed upload URL for frontend direct uploads to Cloudinary.
    Use this if you want the frontend to upload directly.
    """
    import time
    import cloudinary.utils
    
    if not is_cloudinary_configured():
        raise HTTPException(status_code=400, detail="Cloudinary not configured")
    
    timestamp = int(time.time())
    
    params = {
        "timestamp": timestamp,
        "folder": folder
    }
    
    signature = cloudinary.utils.api_sign_request(
        params,
        os.getenv("CLOUDINARY_API_SECRET")
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.getenv("CLOUDINARY_API_KEY"),
        "folder": folder
    }


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCTION SYNC ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@mockup_cloud_router.get("/export-mockup-urls")
async def export_mockup_urls():
    """
    Export all breed_products with Cloudinary mockup URLs for syncing to production.
    Returns a JSON payload that can be imported into production database.
    
    Use this endpoint on PREVIEW to get the data, then call /import-mockup-urls on PRODUCTION.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Get all products with Cloudinary URLs (not base64)
    products = await db.breed_products.find(
        {"mockup_url": {"$regex": "^https://res.cloudinary.com"}},
        {"_id": 0, "id": 1, "mockup_url": 1, "mockup_generated_at": 1, "name": 1, "breed": 1, "product_type": 1}
    ).to_list(1000)
    
    return {
        "total_exported": len(products),
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "products": products
    }


@mockup_cloud_router.post("/import-mockup-urls")
async def import_mockup_urls(data: dict):
    """
    Import mockup URLs from preview environment.
    Call this endpoint on PRODUCTION with the data from /export-mockup-urls.
    
    Body: { "products": [{"id": "...", "mockup_url": "https://..."}, ...] }
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    products = data.get("products", [])
    if not products:
        raise HTTPException(status_code=400, detail="No products provided")
    
    updated = 0
    errors = []
    
    for product in products:
        product_id = product.get("id")
        mockup_url = product.get("mockup_url")
        
        if not product_id or not mockup_url:
            continue
        
        try:
            result = await db.breed_products.update_one(
                {"id": product_id},
                {"$set": {
                    "mockup_url": mockup_url,
                    "mockup_generated_at": product.get("mockup_generated_at"),
                    "synced_from_preview": True,
                    "synced_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            if result.modified_count > 0:
                updated += 1
        except Exception as e:
            errors.append({"id": product_id, "error": str(e)})
    
    return {
        "imported": updated,
        "total_received": len(products),
        "errors": errors,
        "imported_at": datetime.now(timezone.utc).isoformat()
    }


@mockup_cloud_router.post("/sync-to-production")
async def sync_mockups_to_production(production_url: str):
    """
    Directly sync all Cloudinary mockup URLs to production environment.
    
    This fetches the export from this (preview) environment and pushes it to production.
    
    Args:
        production_url: The production API URL (e.g., "https://your-app.emergent.com")
    """
    import httpx
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Step 1: Export from this environment
    export_data = await export_mockup_urls()
    
    if export_data["total_exported"] == 0:
        return {"message": "No Cloudinary mockups to sync", "synced": 0}
    
    # Step 2: Push to production
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{production_url}/api/mockups/import-mockup-urls",
                json={"products": export_data["products"]}
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "exported_from_preview": export_data["total_exported"],
                    "imported_to_production": result.get("imported", 0),
                    "production_url": production_url
                }
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Production import failed: {response.text}"
                )
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to production: {str(e)}")


# ===== AI PRODUCT IMAGE MANAGEMENT =====

async def upload_url_to_cloudinary(image_url: str, product_id: str, category: str = "products") -> Optional[str]:
    """
    Upload an image from URL to Cloudinary and return the new URL.
    
    Args:
        image_url: The source image URL (e.g., from AI generation)
        product_id: Unique identifier for the product
        category: Category folder for organization
        
    Returns:
        Cloudinary URL or None if upload fails
    """
    if not is_cloudinary_configured():
        logger.warning("Cloudinary not configured, skipping upload")
        return None
    
    try:
        # Clean category for folder use
        clean_category = category.lower().replace(" ", "_").replace("-", "_")[:30] if category else "general"
        
        # Create a unique public_id
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        public_id = f"doggy/products/{clean_category}/{product_id}_{timestamp}"
        
        # Upload to Cloudinary from URL — run_in_executor so sync call never blocks event loop
        url_to_upload = image_url
        def _upload_url():
            return cloudinary.uploader.upload(
                url_to_upload,
                public_id=public_id,
                overwrite=True,
                resource_type="image",
                format="webp",
                quality="auto:good",
                transformation=[
                    {"width": 1000, "height": 1000, "crop": "limit"},
                    {"quality": "auto:good"},
                    {"fetch_format": "auto"}
                ]
            )
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _upload_url)
        
        logger.info(f"Uploaded AI image to Cloudinary: {result.get('secure_url')}")
        return result.get("secure_url")
        
    except Exception as e:
        logger.error(f"Failed to upload URL to Cloudinary: {str(e)}")
        return None


@mockup_cloud_router.post("/upload-ai-image")
async def upload_ai_image_to_cloudinary(
    image_url: str,
    product_id: str,
    category: str = "products"
):
    """
    Upload an AI-generated image to Cloudinary and optionally update the product.
    
    Args:
        image_url: Source URL of the AI-generated image
        product_id: Product ID to associate with
        category: Category for folder organization
    """
    if not is_cloudinary_configured():
        raise HTTPException(status_code=400, detail="Cloudinary not configured")
    
    # Upload to Cloudinary
    cloudinary_url = await upload_url_to_cloudinary(image_url, product_id, category)
    
    if not cloudinary_url:
        raise HTTPException(status_code=500, detail="Failed to upload to Cloudinary")
    
    # Update product in database
    if db is not None:
        result = await db.products.update_one(
            {"id": product_id},
            {
                "$set": {
                    "image_url": cloudinary_url,
                    "image": cloudinary_url,
                    "images": [cloudinary_url],
                    "ai_generated_image": True,
                    "image_updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            "success": True,
            "cloudinary_url": cloudinary_url,
            "product_updated": result.modified_count > 0
        }
    
    return {
        "success": True,
        "cloudinary_url": cloudinary_url,
        "product_updated": False
    }


@mockup_cloud_router.post("/bulk-upload-ai-images")
async def bulk_upload_ai_images(data: dict):
    """
    Bulk upload AI-generated images to Cloudinary and update products.
    
    Expected data format:
    {
        "images": [
            {"product_id": "xxx", "image_url": "https://...", "category": "grooming"},
            ...
        ]
    }
    """
    if not is_cloudinary_configured():
        raise HTTPException(status_code=400, detail="Cloudinary not configured")
    
    images = data.get("images", [])
    results = {"success": 0, "failed": 0, "details": []}
    
    for item in images:
        product_id = item.get("product_id")
        image_url = item.get("image_url")
        category = item.get("category", "products")
        
        if not product_id or not image_url:
            results["failed"] += 1
            results["details"].append({"product_id": product_id, "error": "Missing product_id or image_url"})
            continue
        
        try:
            cloudinary_url = await upload_url_to_cloudinary(image_url, product_id, category)
            
            if cloudinary_url and db is not None:
                await db.products.update_one(
                    {"id": product_id},
                    {
                        "$set": {
                            "image_url": cloudinary_url,
                            "image": cloudinary_url,
                            "images": [cloudinary_url],
                            "ai_generated_image": True,
                            "image_updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                results["success"] += 1
                results["details"].append({"product_id": product_id, "cloudinary_url": cloudinary_url})
            else:
                results["failed"] += 1
                results["details"].append({"product_id": product_id, "error": "Upload failed"})
                
        except Exception as e:
            results["failed"] += 1
            results["details"].append({"product_id": product_id, "error": str(e)})
    
    return results


@mockup_cloud_router.get("/ai-image-stats")
async def get_ai_image_stats():
    """Get statistics about AI-generated product images"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    total_products = await db.products.count_documents({})
    ai_generated = await db.products.count_documents({"ai_generated_image": True})
    
    # Products with any image
    with_images = await db.products.count_documents({
        "$or": [
            {"image_url": {"$exists": True, "$ne": None, "$ne": ""}},
            {"image": {"$exists": True, "$ne": None, "$ne": ""}},
            {"images.0": {"$exists": True}}
        ]
    })
    
    # Cloudinary images
    cloudinary_images = await db.products.count_documents({
        "image_url": {"$regex": "^https://res.cloudinary.com"}
    })
    
    return {
        "total_products": total_products,
        "with_images": with_images,
        "missing_images": total_products - with_images,
        "ai_generated": ai_generated,
        "cloudinary_hosted": cloudinary_images,
        "coverage_percentage": round((with_images / total_products * 100) if total_products > 0 else 0, 1)
    }


