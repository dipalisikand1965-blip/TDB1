"""
Shopify Sync Routes for The Doggy Company
Handles product synchronization from Shopify store
"""

import os
import re
import uuid
import logging
import secrets
import asyncio
import httpx
import resend
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Create routers
shopify_router = APIRouter(prefix="/api", tags=["Shopify Sync"])
shopify_admin_router = APIRouter(prefix="/api/admin", tags=["Shopify Admin"])

# Database reference
db: AsyncIOMotorDatabase = None

# Configuration
SHOPIFY_PRODUCTS_URL = os.environ.get("SHOPIFY_PRODUCTS_URL", "https://thedoggybakery.com/products.json")
CRON_SECRET = os.environ.get("CRON_SECRET", "midnight-sync-tdb-2025")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.in")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

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


# ==================== SHOPIFY FETCH & TRANSFORM ====================

async def fetch_shopify_products(limit: int = 250, page: int = 1) -> List[dict]:
    """Fetch products from Shopify store"""
    all_products = []
    current_page = page
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            url = f"{SHOPIFY_PRODUCTS_URL}?limit={limit}&page={current_page}"
            response = await client.get(url)
            
            if response.status_code != 200:
                break
                
            data = response.json()
            products = data.get("products", [])
            
            if not products:
                break
                
            all_products.extend(products)
            current_page += 1
            
            # Safety limit
            if current_page > 10:
                break
    
    return all_products


def transform_shopify_product(shopify_product: dict) -> dict:
    """Transform Shopify product to our format"""
    # Extract options (Base, Flavor, Weight, etc.)
    options = []
    for opt in shopify_product.get("options", []):
        options.append({
            "name": opt.get("name"),
            "position": opt.get("position"),
            "values": opt.get("values", [])
        })

    # Extract variants
    variants_data = []
    min_price = float('inf')
    
    # Backward compatibility lists (best guess)
    sizes = []
    flavors = []
    
    raw_variants = shopify_product.get("variants", [])
    if raw_variants:
        for v in raw_variants:
            price = float(v.get("price", 0))
            if price < min_price:
                min_price = price
                
            variants_data.append({
                "id": v.get("id"),
                "title": v.get("title"),
                "price": price,
                "option1": v.get("option1"),
                "option2": v.get("option2"),
                "option3": v.get("option3"),
                "sku": v.get("sku"),
                "available": v.get("available", True)
            })
            
            # Legacy mapping: Try to map Weight to Sizes and Flavor to Flavors
            weight_opt_idx = next((i for i, o in enumerate(options) if o['name'] in ['Weight', 'Size']), -1)
            if weight_opt_idx != -1:
                val = v.get(f"option{weight_opt_idx+1}")
                if val and not any(s['name'] == val for s in sizes):
                    sizes.append({"name": val, "price": price})
            
            # Map 'Flavour' or 'Flavor' option to flavors list
            flavor_opt_idx = next((i for i, o in enumerate(options) if o['name'] in ['Flavour', 'Flavor']), -1)
            if flavor_opt_idx != -1:
                val = v.get(f"option{flavor_opt_idx+1}")
                if val and not any(f['name'] == val for f in flavors):
                    flavors.append({"name": val, "price": 0})
    
    if min_price == float('inf'):
        min_price = 0
    
    # Get primary image
    images = shopify_product.get("images", [])
    image_url = images[0].get("src") if images else ""
    
    # Determine category from product_type, tags, and title
    product_type = shopify_product.get("product_type", "").lower()
    raw_tags = shopify_product.get("tags", [])
    if isinstance(raw_tags, str):
        tags = [t.strip().lower() for t in raw_tags.split(",")]
    else:
        tags = [str(t).lower() for t in raw_tags]
        
    title = shopify_product.get("title", "").lower()
    handle = shopify_product.get("handle", "").lower()
    tags_str = " ".join(tags)
    
    category = "other"
    
    # Gift Cards - highest priority
    if "gift card" in title:
        category = "gift-cards"
    # Gift Hampers & Party Boxes
    elif any(h in title or h in handle for h in ["hamper", "party box", "gift box", "celebration box", "woof box", "bash box", "festive box"]):
        category = "hampers"
    # Cat products
    elif "cat" in product_type or "cat " in title or "feline" in title or "meow" in title or "purrfect" in title or "cattitude" in title or "purradise" in title or "caviar cupcake" in title:
        category = "cat-treats"
    # Pupcakes & Dognuts
    elif "pupcake" in product_type or "pupcake" in title or "dognut" in title or "dognuts" in product_type:
        category = "dognuts"
    # Mini/Bowto cakes
    elif ("mini" in title and "cake" in title) or "bowto" in title:
        category = "mini-cakes"
    # Breed-specific cakes
    elif any(breed in title for breed in [
        "retriever", "labrador", "beagle", "husky", "shih tzu", "indie", "german shepherd",
        "rottweiler", "rotweiller", "cocker spaniel", "pug", "maltese", "pomeranian", 
        "dobermann", "lhasa apso", "dachshund", "poodle", "jack russel", "great dane",
        "bulldog", "french bulldog", "english bulldog", "st bernard", "boxer", 
        "yorkshire terrier", "american bully", "cavalier", "chow chow", "dalmation",
        "chihuahua", "greyhound", "shnoodle", "scottish terrier", "irish setter",
        "basset hound", "mutt munch", "mynx"
    ]):
        if any(exc in title for exc in ["mat", "bandana", "mug", "coaster", "feeding"]):
            if "mug" in title or "coaster" in title:
                category = "merchandise"
            else:
                category = "accessories"
        else:
            category = "breed-cakes"
    # Main cakes
    elif "cake" in product_type or ("cake" in title and "pupcake" not in title):
        category = "cakes"
    # Frozen treats
    elif "frozen" in product_type or "fro-yo" in title or "jello" in title or "popsicle" in title or "froyo" in title:
        category = "frozen-treats"
    # Fresh meals
    elif "meal" in product_type or "meal" in title or "pizza" in title or "burger" in title:
        category = "fresh-meals"
    # Desi treats
    elif any(desi in title or desi in tags_str for desi in ["desi", "ladoo", "ladoos", "barfi", "kaju", "jalebi", "gujiya", "rakhi", "diwali", "holi"]):
        category = "desi-treats"
    # Nut butters
    elif "nut butter" in title or "peanut butter jar" in title:
        category = "nut-butters"
    # ACCESSORIES & TOYS
    elif any(acc in title or acc in product_type for acc in ["toy", "squeaky", "bandana", "feeding mat", "coaster", "leash", "collar", "name tag"]):
        category = "accessories"
    # Treats & Biscuits
    elif any(t in product_type or t in title for t in ["treat", "biscuit", "cookie", "jerky", "chew", "snack", "crunch", "munch", "chip"]):
        category = "treats"
    # Health products
    elif any(h in title for h in ["oil", "toothpaste", "detangler", "flea"]):
        category = "accessories"
    # Merchandise
    elif "merchandise" in product_type or "mug" in title:
        category = "merchandise"
    # Pan India
    elif "pan india" in tags_str or "pan-india" in tags_str:
        category = "pan-india"
    
    is_pan_india_shippable = (
        "pan india" in tags_str or 
        "pan-india" in tags_str or
        category in ["treats", "nut-butters", "desi-treats", "gift-cards"] or
        "cookie" in title or "biscuit" in title or "treat" in title or 
        "butter" in title or "chew" in title
    )
    
    # Clean description
    raw_desc = shopify_product.get("body_html", "")
    clean_desc = re.sub(r'<style[^>]*>.*?</style>', '', raw_desc, flags=re.DOTALL | re.IGNORECASE)
    clean_desc = re.sub(r'<script[^>]*>.*?</script>', '', clean_desc, flags=re.DOTALL | re.IGNORECASE)
    clean_desc = re.sub(r'<!--.*?-->', '', clean_desc, flags=re.DOTALL)
    clean_desc = re.sub(r'<[^>]+>', ' ', clean_desc)
    clean_desc = re.sub(r'\{[^}]*\}', '', clean_desc)
    clean_desc = re.sub(r'\s+', ' ', clean_desc).strip()
    clean_desc = re.sub(r'^[\s\.\-\:]+', '', clean_desc)
    clean_desc = clean_desc[:300] if len(clean_desc) > 300 else clean_desc
    
    if len(clean_desc) < 10:
        clean_desc = f"Delicious {category.replace('-', ' ')} made with love for your furry friend."
    
    # Get product name with fallback for untitled products
    product_name = (shopify_product.get("title") or "").strip()
    if not product_name:
        # Use handle as fallback, or generate from ID
        product_name = shopify_product.get("handle", "").replace("-", " ").title()
        if not product_name:
            product_name = f"Product {shopify_product.get('id', 'Unknown')}"
        logger.warning(f"Shopify product missing title, using fallback: {product_name}")
    
    return {
        "id": f"shopify-{shopify_product.get('id')}",
        "shopify_id": shopify_product.get("id"),
        "name": product_name,
        "description": clean_desc,
        "price": min_price,
        "originalPrice": min_price,
        "image": image_url,
        "category": category,
        "is_pan_india_shippable": is_pan_india_shippable,
        "sizes": sizes if sizes else [{"name": "Standard", "price": min_price}],
        "flavors": flavors if flavors else [],
        "options": options,
        "variants": variants_data,
        "tags": shopify_product.get("tags") if isinstance(shopify_product.get("tags"), list) else shopify_product.get("tags", "").split(", "),
        "shopify_handle": shopify_product.get("handle"),
        "available": any(v.get("available", True) for v in variants_data),
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "display_tags": [],
        "bundle_type": None,
        "bundle_includes": {
            "cake_selection": False,
            "toy_selection": False,
            "treat_selection": False
        }
    }


# ==================== PRODUCT MATCH NOTIFICATIONS ====================

async def send_product_match_email(pet: dict, product: dict, match_reason: str):
    """Send email about a product match"""
    owner_email = pet.get("owner_email")
    if not RESEND_API_KEY or not owner_email or not isinstance(owner_email, str) or "@" not in owner_email:
        return

    try:
        pet_name = pet.get("name", "your pet")
        product_name = product.get("name")
        product_image = product.get("image", "")
        owner_name = pet.get("owner_name", "Pet Parent")
        
        reason_text = f"matches {pet_name}'s {match_reason}"
        if match_reason == "breed":
            reason_text = f"is perfect for {pet.get('breed')}s like {pet_name}"
        elif match_reason == "flavor":
            reason_text = f"has {pet_name}'s favorite flavors"
            
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #9333ea;">New Find for {pet_name}! 🐾</h1>
            </div>
            
            <p>Hi {owner_name},</p>
            <p>We spotted something new at The Doggy Bakery that {reason_text}!</p>
            
            <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 15px; text-align: center; margin: 20px 0;">
                <img src="{product_image}" alt="{product_name}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="margin: 10px 0;">{product_name}</h3>
                <p style="color: #6b7280; font-size: 14px;">{product.get("description", "")[:100]}...</p>
                <a href="https://thedoggybakery.com/products/{product.get('shopify_handle')}" 
                   style="display: inline-block; background: #9333ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 10px;">
                   Check it out
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
                You're receiving this because of your pet's profile preferences.
            </p>
        </div>
        """
        
        params = {
            "from": f"The Doggy Bakery <{SENDER_EMAIL}>",
            "to": owner_email,
            "subject": f"🐾 Perfect Match for {pet_name}: {product_name}",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Product match email sent to {owner_email} for {pet_name}")
        
    except Exception as e:
        logger.error(f"Failed to send product match email: {e}")


async def check_product_matches(new_products: List[dict]):
    """Check if new products match any pets and notify owners"""
    if not new_products:
        return
        
    logger.info(f"Checking matches for {len(new_products)} new products...")
    
    # Get all pets with email notifications enabled
    pets = await db.pets.find({"email_reminders": True, "owner_email": {"$exists": True}}).to_list(10000)
    
    for product in new_products:
        product_name = product.get("name", "").lower()
        product_flavors = {f["name"].lower() for f in product.get("flavors", [])}
        
        for pet in pets:
            match_reason = None
            
            # Breed Match
            pet_breed = pet.get("breed", "").lower()
            if pet_breed and pet_breed in product_name:
                match_reason = "breed"
            
            # Flavor Match (if no breed match)
            if not match_reason and pet.get("preferences"):
                fav_flavors = pet["preferences"].get("favorite_flavors", [])
                if fav_flavors:
                    for flavor in fav_flavors:
                        if flavor.lower() in product_flavors or flavor.lower() in product_name:
                            match_reason = "flavor"
                            break
            
            if match_reason:
                await send_product_match_email(pet, product, match_reason)


# ==================== SYNC ENDPOINTS ====================

@shopify_router.post("/cron/sync-products")
async def cron_sync_products(secret: str):
    """Endpoint for automated product sync (call from cron job)
    
    Set up cron with: curl -X POST "https://yoursite.com/api/cron/sync-products?secret=YOUR_SECRET"
    """
    if secret != CRON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")
    
    try:
        logger.info("Starting scheduled Shopify sync...")
        shopify_products = await fetch_shopify_products()
        
        synced = 0
        new_products = []
        
        for sp in shopify_products:
            # Check if product exists
            existing = await db.products_master.find_one({"shopify_id": sp["id"]})
            
            transformed = transform_shopify_product(sp)
            
            # IMPORTANT: Preserve hardcoded options - don't overwrite!
            if existing and existing.get("hardcoded_options") == True:
                # Remove options/variants from update to preserve hardcoded data
                transformed.pop("options", None)
                transformed.pop("variants", None)
                transformed.pop("has_variants", None)
                transformed.pop("sizes", None)
                transformed.pop("flavors", None)
            
            await db.products_master.update_one(
                {"shopify_id": sp["id"]},
                {"$set": transformed},
                upsert=True
            )
            synced += 1
            
            # Track new products for notifications
            if not existing:
                new_products.append(transformed)
        
        # Check product matches for new products (async)
        if new_products:
            asyncio.create_task(check_product_matches(new_products))
        
        await db.sync_logs.insert_one({
            "type": "shopify_cron",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_synced": synced,
            "new_products": len(new_products),
            "status": "success"
        })
        
        logger.info(f"Scheduled sync completed: {synced} products ({len(new_products)} new)")
        return {"message": "Sync completed", "synced": synced, "new_products": len(new_products)}
        
    except Exception as e:
        logger.error(f"Scheduled sync failed: {e}")
        await db.sync_logs.insert_one({
            "type": "shopify_cron",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "failed",
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail=str(e))


@shopify_admin_router.post("/sync-products")
async def admin_sync_products(username: str = Depends(verify_admin)):
    """Manual trigger for Shopify product sync"""
    try:
        logger.info(f"Admin {username} triggered Shopify sync...")
        shopify_products = await fetch_shopify_products()
        
        synced = 0
        new_products = []
        updated_products = []
        preserved_options = 0
        
        for sp in shopify_products:
            existing = await db.products_master.find_one({"shopify_id": sp["id"]})
            
            transformed = transform_shopify_product(sp)
            
            # IMPORTANT: Preserve hardcoded options - don't overwrite!
            if existing and existing.get("hardcoded_options") == True:
                # Remove options/variants from update to preserve hardcoded data
                transformed.pop("options", None)
                transformed.pop("variants", None)
                transformed.pop("has_variants", None)
                transformed.pop("sizes", None)
                transformed.pop("flavors", None)
                preserved_options += 1
                logger.debug(f"Preserved hardcoded options for: {transformed.get('name')}")
            
            await db.products_master.update_one(
                {"shopify_id": sp["id"]},
                {"$set": transformed},
                upsert=True
            )
            synced += 1
            
            if not existing:
                new_products.append(transformed["name"])
            else:
                updated_products.append(transformed["name"])
        
        # Log the sync
        await db.sync_logs.insert_one({
            "type": "shopify_admin",
            "triggered_by": username,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_synced": synced,
            "new_products": len(new_products),
            "status": "success"
        })
        
        logger.info(f"Admin sync completed: {synced} products")
        return {
            "message": "Sync completed",
            "synced": synced,
            "new_products": new_products[:10],  # Show first 10
            "new_count": len(new_products),
            "updated_count": len(updated_products)
        }
        
    except Exception as e:
        logger.error(f"Admin sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@shopify_admin_router.get("/sync-status")
async def get_sync_status(username: str = Depends(verify_admin)):
    """Get Shopify sync status and logs"""
    # Get last 10 sync logs
    logs = await db.sync_logs.find(
        {"type": {"$in": ["shopify_cron", "shopify_admin"]}},
        {"_id": 0}
    ).sort("timestamp", -1).limit(10).to_list(10)
    
    # Get product counts
    total_products = await db.products_master.count_documents({})
    shopify_products = await db.products_master.count_documents({"shopify_id": {"$exists": True}})
    
    # Get last successful sync
    last_success = await db.sync_logs.find_one(
        {"status": "success", "type": {"$in": ["shopify_cron", "shopify_admin"]}},
        {"_id": 0}
    )
    
    return {
        "total_products": total_products,
        "shopify_products": shopify_products,
        "local_products": total_products - shopify_products,
        "last_successful_sync": last_success.get("timestamp") if last_success else None,
        "recent_logs": logs
    }


@shopify_admin_router.post("/cleanup-mock-products")
async def cleanup_mock_products(username: str = Depends(verify_admin)):
    """Remove mock products that don't have shopify_id, keeping only real Shopify-synced products"""
    try:
        # Delete products that don't have a shopify_id field or have mock-style IDs
        result = await db.products_master.delete_many({
            "$or": [
                {"shopify_id": {"$exists": False}},
                {"id": {"$regex": "^(bc-|cake-|treat-|cat-|frozen-|meal-|acc-)"}}
            ]
        })
        
        deleted_count = result.deleted_count
        
        # Count remaining products
        remaining = await db.products_master.count_documents({})
        
        logger.info(f"Admin {username} cleaned up {deleted_count} mock products. {remaining} Shopify products remaining.")
        
        return {
            "message": "Mock products cleaned up",
            "deleted": deleted_count,
            "remaining": remaining
        }
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@shopify_admin_router.get("/untitled-products")
async def get_untitled_products(username: str = Depends(verify_admin)):
    """Get products that might have been synced without proper titles"""
    untitled = await db.products_master.find(
        {
            "$or": [
                {"name": {"$regex": "^Product "}},
                {"name": {"$regex": "^Untitled"}},
                {"name": ""},
                {"name": {"$exists": False}}
            ]
        },
        {"_id": 0, "id": 1, "shopify_id": 1, "name": 1, "shopify_handle": 1, "synced_at": 1}
    ).to_list(100)
    
    return {
        "count": len(untitled),
        "products": untitled
    }


@shopify_admin_router.post("/fix-untitled-products")
async def fix_untitled_products(username: str = Depends(verify_admin)):
    """Attempt to fix untitled products by re-fetching from Shopify"""
    try:
        # Get untitled products
        untitled = await db.products_master.find(
            {
                "$or": [
                    {"name": {"$regex": "^Product "}},
                    {"name": {"$regex": "^Untitled"}},
                    {"name": ""},
                    {"name": {"$exists": False}}
                ],
                "shopify_id": {"$exists": True}
            }
        ).to_list(100)
        
        if not untitled:
            return {"message": "No untitled products found", "fixed": 0}
        
        # Get fresh data from Shopify
        shopify_products = await fetch_shopify_products()
        shopify_map = {sp["id"]: sp for sp in shopify_products}
        
        fixed = 0
        still_untitled = []
        
        for product in untitled:
            shopify_id = product.get("shopify_id")
            if shopify_id and shopify_id in shopify_map:
                sp = shopify_map[shopify_id]
                new_name = (sp.get("title") or "").strip()
                
                if not new_name:
                    new_name = sp.get("handle", "").replace("-", " ").title()
                
                if new_name and new_name != product.get("name"):
                    await db.products_master.update_one(
                        {"shopify_id": shopify_id},
                        {"$set": {"name": new_name, "updated_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    fixed += 1
                else:
                    still_untitled.append({"id": product.get("id"), "shopify_id": shopify_id})
            else:
                still_untitled.append({"id": product.get("id"), "shopify_id": shopify_id})
        
        return {
            "message": f"Fixed {fixed} products",
            "fixed": fixed,
            "still_untitled": len(still_untitled),
            "still_untitled_products": still_untitled[:10]
        }
        
    except Exception as e:
        logger.error(f"Fix untitled failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
