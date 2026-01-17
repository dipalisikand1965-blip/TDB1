from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query, Header
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Any, Union
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
import shutil
import resend
import urllib.parse
import httpx
from contextlib import asynccontextmanager
import csv
import io
import hashlib
import jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.encoders import jsonable_encoder
import jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi.encoders import jsonable_encoder

from duckduckgo_search import DDGS
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Import search service
from search_service import search_service

# Import pillar and collection routes
from pillar_routes import (
    router as pillar_router, 
    public_router as pillar_public_router,
    set_pillar_db, 
    set_pillar_admin_verify
)
from collection_routes import (
    router as enhanced_collection_router,
    public_router as collection_public_router,
    set_collection_db,
    set_collection_admin_verify
)

# APScheduler for background jobs
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
try:
    # Connection settings optimized for both local and Atlas
    client = AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
        socketTimeoutMS=30000,
        maxPoolSize=10,
        minPoolSize=1,
        retryWrites=True,
        w='majority'
    )
    db = client[os.environ.get('DB_NAME', 'doggy_bakery')]
    logger.info(f"MongoDB connection configured")
except Exception as e:
    logger.error(f"MongoDB connection error: {e}")
    raise

# Resend configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
NOTIFICATION_EMAIL = os.environ.get("NOTIFICATION_EMAIL", "woof@thedoggybakery.in")
WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "919663185747")

# Admin credentials from environment
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "aditya")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "lola4304")

# Chatbase configuration
CHATBASE_API_KEY = os.environ.get("CHATBASE_API_KEY")
CHATBASE_CHATBOT_ID = os.environ.get("CHATBASE_CHATBOT_ID")

# Background task for auto-sync
sync_task = None

async def auto_sync_products():
    """Background task that syncs products from Shopify every 24 hours"""
    while True:
        try:
            # Calculate time until next midnight IST (UTC+5:30)
            now = datetime.now(timezone.utc)
            ist_offset = timedelta(hours=5, minutes=30)
            now_ist = now + ist_offset
            
            # Next midnight IST
            tomorrow_ist = (now_ist + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            wait_seconds = (tomorrow_ist - now_ist).total_seconds()
            
            # Wait until midnight (or 60 seconds minimum for testing)
            logger.info(f"Auto-sync scheduled for midnight IST ({wait_seconds/3600:.1f} hours from now)")
            await asyncio.sleep(max(wait_seconds, 60))
            
            # Perform sync
            logger.info("Starting automatic Shopify product sync...")
            shopify_products = await fetch_shopify_products()
            
            synced = 0
            new_products_found = []
            
            for sp in shopify_products:
                transformed = transform_shopify_product(sp)
                result = await db.products.update_one(
                    {"shopify_id": sp["id"]},
                    {"$set": transformed},
                    upsert=True
                )
                
                if result.upserted_id:
                    new_products_found.append(transformed)
                    
                synced += 1
            
            # Check for matches with new products
            if new_products_found:
                asyncio.create_task(check_product_matches(new_products_found))
            
            await db.sync_logs.insert_one({
                "type": "auto_sync",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "total_synced": synced,
                "status": "success"
            })
            
            logger.info(f"Auto-sync completed: {synced} products synced from thedoggybakery.com")
            
        except asyncio.CancelledError:
            logger.info("Auto-sync task cancelled")
            break
        except Exception as e:
            logger.error(f"Auto-sync failed: {e}")
            await db.sync_logs.insert_one({
                "type": "auto_sync",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "failed",
                "error": str(e)
            })
            # Wait 1 hour before retrying on failure
            await asyncio.sleep(3600)

# ==================== PET CELEBRATION REMINDERS ====================

# Scheduler instance
scheduler = AsyncIOScheduler()

async def check_upcoming_celebrations():
    """Check for upcoming pet celebrations and send reminders"""
    try:
        logger.info("Running celebration reminder check...")
        today = datetime.now(timezone.utc).date()
        
        # Get all pets with celebration data
        pets_cursor = db.pets.find({
            "$or": [
                {"birth_date": {"$exists": True, "$ne": None}},
                {"gotcha_date": {"$exists": True, "$ne": None}},
                {"celebrations": {"$exists": True, "$ne": []}}
            ]
        })
        
        pets = await pets_cursor.to_list(1000)
        reminders_sent = 0
        
        for pet in pets:
            pet_name = pet.get("name", "Your Pet")
            owner_email = pet.get("owner_email")
            owner_phone = pet.get("owner_phone")
            owner_name = pet.get("owner_name", "Pet Parent")
            email_reminders = pet.get("email_reminders", True)
            whatsapp_reminders = pet.get("whatsapp_reminders", True)
            user_id = pet.get("user_id")
            
            # Get user email if not in pet profile
            if not owner_email and user_id:
                user = await db.users.find_one({"_id": user_id})
                if user:
                    owner_email = user.get("email")
                    owner_name = user.get("name", owner_name)
            
            celebrations_to_notify = []
            
            # Check birthday
            if pet.get("birth_date"):
                try:
                    birth_date = datetime.strptime(pet["birth_date"], "%Y-%m-%d").date()
                    this_year_bday = birth_date.replace(year=today.year)
                    if this_year_bday < today:
                        this_year_bday = birth_date.replace(year=today.year + 1)
                    
                    days_until = (this_year_bday - today).days
                    if days_until in [7, 1]:  # 7 days or 1 day before
                        celebrations_to_notify.append({
                            "occasion": "birthday",
                            "name": f"{pet_name}'s Birthday",
                            "date": this_year_bday.strftime("%B %d"),
                            "days_until": days_until
                        })
                except Exception as e:
                    logger.error(f"Error parsing birth_date for pet {pet_name}: {e}")
            
            # Check gotcha day
            if pet.get("gotcha_date"):
                try:
                    gotcha_date = datetime.strptime(pet["gotcha_date"], "%Y-%m-%d").date()
                    this_year_gotcha = gotcha_date.replace(year=today.year)
                    if this_year_gotcha < today:
                        this_year_gotcha = gotcha_date.replace(year=today.year + 1)
                    
                    days_until = (this_year_gotcha - today).days
                    if days_until in [7, 1]:
                        celebrations_to_notify.append({
                            "occasion": "gotcha_day",
                            "name": f"{pet_name}'s Gotcha Day",
                            "date": this_year_gotcha.strftime("%B %d"),
                            "days_until": days_until
                        })
                except Exception as e:
                    logger.error(f"Error parsing gotcha_date for pet {pet_name}: {e}")
            
            # Check custom celebrations
            for celebration in pet.get("celebrations", []):
                try:
                    date_str = celebration.get("date", "")
                    occasion = celebration.get("occasion", "celebration")
                    custom_name = celebration.get("custom_name") or occasion.replace("_", " ").title()
                    
                    # Parse date (supports YYYY-MM-DD or MM-DD)
                    if len(date_str) == 10:  # YYYY-MM-DD
                        cel_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                    elif len(date_str) == 5:  # MM-DD
                        cel_date = datetime.strptime(f"{today.year}-{date_str}", "%Y-%m-%d").date()
                    else:
                        continue
                    
                    # For recurring, adjust year
                    if celebration.get("is_recurring", True):
                        this_year_cel = cel_date.replace(year=today.year)
                        if this_year_cel < today:
                            this_year_cel = cel_date.replace(year=today.year + 1)
                        cel_date = this_year_cel
                    
                    days_until = (cel_date - today).days
                    if days_until in [7, 1]:
                        celebrations_to_notify.append({
                            "occasion": occasion,
                            "name": f"{pet_name}'s {custom_name}",
                            "date": cel_date.strftime("%B %d"),
                            "days_until": days_until
                        })
                except Exception as e:
                    logger.error(f"Error parsing celebration for pet {pet_name}: {e}")
            
            # Send reminders for each celebration
            for celebration in celebrations_to_notify:
                # Check if we already sent this reminder
                existing_reminder = await db.celebration_reminders.find_one({
                    "pet_id": str(pet.get("_id")),
                    "occasion": celebration["occasion"],
                    "date": celebration["date"],
                    "days_until": celebration["days_until"],
                    "year": today.year
                })
                
                if existing_reminder:
                    continue  # Already sent this reminder
                
                # Get pet persona for personalized message
                soul = pet.get("soul", {})
                persona = soul.get("persona", "beloved companion")
                
                # Send email reminder
                if email_reminders and owner_email and RESEND_API_KEY:
                    await send_celebration_email(
                        to_email=owner_email,
                        owner_name=owner_name,
                        pet_name=pet_name,
                        celebration=celebration,
                        persona=persona,
                        photo_url=pet.get("photo_url")
                    )
                    reminders_sent += 1
                
                # Log WhatsApp reminder (click-to-chat link)
                if whatsapp_reminders and owner_phone:
                    whatsapp_link = generate_whatsapp_reminder_link(
                        pet_name=pet_name,
                        celebration=celebration,
                        owner_name=owner_name
                    )
                    logger.info(f"WhatsApp reminder link for {pet_name}: {whatsapp_link}")
                
                # Record that we sent this reminder
                await db.celebration_reminders.insert_one({
                    "pet_id": str(pet.get("_id")),
                    "pet_name": pet_name,
                    "owner_email": owner_email,
                    "occasion": celebration["occasion"],
                    "celebration_name": celebration["name"],
                    "date": celebration["date"],
                    "days_until": celebration["days_until"],
                    "year": today.year,
                    "sent_at": datetime.now(timezone.utc).isoformat(),
                    "email_sent": email_reminders and owner_email and RESEND_API_KEY,
                    "whatsapp_generated": whatsapp_reminders and owner_phone
                })
        
        logger.info(f"Celebration reminder check complete. Sent {reminders_sent} reminders.")
        return reminders_sent
        
    except Exception as e:
        logger.error(f"Error in celebration reminder check: {e}")
        return 0


async def send_celebration_email(to_email: str, owner_name: str, pet_name: str, 
                                  celebration: dict, persona: str, photo_url: str = None):
    """Send a personalized celebration reminder email"""
    try:
        days_text = "tomorrow" if celebration["days_until"] == 1 else f"in {celebration['days_until']} days"
        occasion_type = celebration["occasion"]
        
        # Personalized subject lines
        subjects = {
            "birthday": f"🎂 {pet_name}'s Birthday is {days_text}! Time to celebrate!",
            "gotcha_day": f"💝 {pet_name}'s Gotcha Day is {days_text}! Celebrate the love!",
            "default": f"🎉 {celebration['name']} is {days_text}!"
        }
        subject = subjects.get(occasion_type, subjects["default"])
        
        # Build email HTML
        photo_section = ""
        if photo_url:
            photo_section = f'''
            <div style="text-align: center; margin: 20px 0;">
                <img src="{photo_url}" alt="{pet_name}" style="max-width: 200px; border-radius: 50%; border: 4px solid #9333ea;">
            </div>
            '''
        
        html_content = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; }}
                .cta-button {{ display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; margin: 20px 0; }}
                .product-grid {{ display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; margin: 20px 0; }}
                .product-card {{ width: 150px; text-align: center; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; }}
                .footer {{ background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; color: #6b7280; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🐾 The Doggy Bakery</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Pet Celebration Reminder</p>
                </div>
                <div class="content">
                    {photo_section}
                    <h2 style="color: #9333ea; text-align: center;">{celebration['name']} is {days_text}!</h2>
                    
                    <p>Hi {owner_name},</p>
                    
                    <p>Get ready to celebrate! <strong>{pet_name}</strong>, your {persona}, has a special day coming up on <strong>{celebration['date']}</strong>.</p>
                    
                    <p>Make it extra special with delicious treats from The Doggy Bakery! 🎂</p>
                    
                    <div style="text-align: center;">
                        <a href="https://thedoggycompany.in/cakes" class="cta-button">
                            🎁 Shop Birthday Treats
                        </a>
                    </div>
                    
                    <h3 style="color: #9333ea;">Celebration Ideas for {pet_name}:</h3>
                    <ul>
                        <li>🎂 A custom birthday cake with {pet_name}'s name</li>
                        <li>🦴 Gourmet treats and cookies</li>
                        <li>🎁 A celebration hamper with toys and goodies</li>
                        <li>📸 A fun photoshoot with their new treats!</li>
                    </ul>
                    
                    <p style="background: #fdf4ff; padding: 15px; border-radius: 8px; border-left: 4px solid #9333ea;">
                        <strong>💜 TDB Tip:</strong> Order 2-3 days in advance for freshly baked cakes!
                    </p>
                    
                    <p>Wishing {pet_name} the happiest celebration! 🎉</p>
                    
                    <p>With love,<br><strong>The Doggy Bakery Team</strong> 🐕</p>
                </div>
                <div class="footer">
                    <p>The Doggy Bakery | Baking happiness for your furry friends</p>
                    <p>📞 +91 96631 85747 | 📧 woof@thedoggybakery.com</p>
                    <p style="font-size: 11px; color: #9ca3af;">
                        You're receiving this because you enabled celebration reminders for {pet_name}. 
                        <a href="https://thedoggycompany.in/my-pets" style="color: #9333ea;">Manage preferences</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        '''
        
        params = {
            "from": f"The Doggy Bakery <{SENDER_EMAIL}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        
        email_response = resend.Emails.send(params)
        logger.info(f"Celebration email sent to {to_email} for {pet_name}: {email_response}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send celebration email: {e}")
        return False


def generate_whatsapp_reminder_link(pet_name: str, celebration: dict, owner_name: str) -> str:
    """Generate a WhatsApp click-to-chat link with celebration reminder"""
    days_text = "tomorrow" if celebration["days_until"] == 1 else f"in {celebration['days_until']} days"
    
    message = f"""🎉 Hi {owner_name}!

Reminder: {celebration['name']} is {days_text} ({celebration['date']})!

Make it special with treats from The Doggy Bakery! 🐾

🎂 Shop now: https://thedoggycompany.in/cakes

Need help choosing? Chat with Mira, our Concierge®!"""
    
    encoded_message = urllib.parse.quote(message)
    return f"https://wa.me/{WHATSAPP_NUMBER}?text={encoded_message}"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global sync_task
    
    # Initialize search service in background (non-blocking)
    # This prevents slow Meilisearch connection from blocking app startup
    async def init_search_background():
        try:
            await asyncio.wait_for(search_service.connect(), timeout=5.0)
            # Index products in background after app is ready
            products = await db.products.find({}, {"_id": 0}).to_list(10000)
            if products:
                await search_service.index_products_batch(products)
            # Index collections
            collections = await db.collections.find({}, {"_id": 0}).to_list(1000)
            if collections:
                await search_service.index_collections_batch(collections)
            logger.info("Search service initialized successfully in background")
        except asyncio.TimeoutError:
            logger.warning("Search service connection timed out - search will be unavailable")
        except Exception as e:
            logger.warning(f"Search service initialization failed (non-blocking): {e}")
    
    # Start search initialization in background (don't await)
    asyncio.create_task(init_search_background())
    
    # NOTE: Auto-sync with Shopify DISABLED - use manual sync only
    # This prevents local product changes from being overwritten
    # sync_task = asyncio.create_task(auto_sync_products())
    # logger.info("Auto-sync background task started")
    logger.info("Auto-sync DISABLED - use manual sync via /api/admin/sync-products endpoint")
    
    # Start the celebration reminder scheduler
    # Runs daily at 9:00 AM IST (3:30 AM UTC)
    scheduler.add_job(
        check_upcoming_celebrations,
        CronTrigger(hour=3, minute=30),  # 9:00 AM IST = 3:30 AM UTC
        id="celebration_reminders",
        replace_existing=True
    )
    
    # Add abandoned cart checker (runs every 30 minutes)
    scheduler.add_job(
        check_abandoned_carts,
        CronTrigger(minute='*/30'),  # Run every 30 minutes
        id="abandoned_cart_check",
        replace_existing=True
    )
    
    # Add feedback processor (runs every 15 minutes to send due feedback requests)
    scheduler.add_job(
        process_pending_feedback,
        CronTrigger(minute='*/15'),  # Run every 15 minutes
        id="feedback_processor",
        replace_existing=True
    )
    
    # Add daily email reports (runs at 8 AM IST / 2:30 AM UTC)
    scheduler.add_job(
        process_daily_reports,
        CronTrigger(hour=2, minute=30),  # 8 AM IST
        id="daily_reports",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Schedulers started: celebration reminders (9AM IST), abandoned cart (30 min), feedback (15 min), daily reports (8AM IST)")
    
    yield
    
    # Shutdown search service
    try:
        await search_service.disconnect()
    except Exception as e:
        logger.error(f"Search service shutdown error: {e}")
    
    # Shutdown scheduler
    scheduler.shutdown(wait=False)
    logger.info("Schedulers stopped")
    
    # Cancel the sync task on shutdown
    if sync_task:
        sync_task.cancel()
        try:
            await sync_task
        except asyncio.CancelledError:
            pass
    logger.info("Auto-sync background task stopped")

# Create the main app with lifespan
app = FastAPI(lifespan=lifespan)

# Create routers
@app.get("/api/health")
def api_health_check():
    """Health check alias for /api prefix"""
    return health_check()

api_router = APIRouter(prefix="/api")
admin_router = APIRouter(prefix="/api/admin")

# Import admin routes
from admin_routes import fulfilment_router, set_database as set_admin_db

# Import status engine
from status_engine import status_router, set_database as set_status_db

# Import feedback engine
from feedback_engine import feedback_router, set_database as set_feedback_db, process_pending_feedback

# Import birthday engine
from birthday_engine import birthday_router, set_database as set_birthday_db

# Import concierge engine
from concierge_engine import concierge_router, set_database as set_concierge_db

# Import email reports engine
from email_reports_engine import reports_email_router, set_database as set_reports_db, process_daily_reports

# Import auth routes (refactored)
from auth_routes import (
    auth_router, 
    set_database as set_auth_db,
    get_current_user,
    get_current_user_optional,
    verify_admin as verify_admin_auth,
    check_mira_access,
    increment_chat_count,
    create_access_token,
    get_password_hash_secure,
    verify_password_secure,
    MEMBERSHIP_TIERS,
    set_admin_notification_handler as set_auth_notification_handler
)

# Import product routes (refactored)
from product_routes import (
    product_router,
    set_database as set_product_db,
    set_search_service as set_product_search
)

# Import order routes (refactored)
from order_routes import (
    order_router,
    set_database as set_order_db,
    calculate_autoship_discount
)

# Import user routes (refactored)
from user_routes import (
    user_router,
    set_database as set_user_db,
    DOG_PERSONAS,
    CELEBRATION_OCCASIONS,
    PetProfileCreate,
    PetProfileUpdate,
    PetCelebration,
    PetSoulProfile,
    PetPreferences
)

# Import dine routes (refactored)
from dine_routes import (
    dine_router,
    set_database as set_dine_db,
    set_admin_notification_handler
)

# Import ticket routes (Service Desk)
from ticket_routes import router as ticket_router
from ticket_messaging import router as ticket_messaging_router
from ticket_sla import router as ticket_sla_router
from ticket_auto_create import create_ticket_from_event, update_ticket_from_event

# Health check endpoint (required for Kubernetes deployment)
@app.get("/health")
def health_check():
    """Simple health check for Kubernetes liveness/readiness probes"""
    return {"status": "healthy", "service": "doggy-bakery-api"}

@app.get("/health/db")
async def db_health_check():
    """Database connectivity health check"""
    try:
        # Ping MongoDB to check connection
        await client.admin.command('ping')
        count = await db.products.count_documents({})
        return {"status": "healthy", "database": "connected", "products_count": count}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "The Doggy Bakery API", "version": "2.0", "health": "ok"}

# Security
security = HTTPBasic()

# Cache for admin credentials from database
_admin_credentials_cache = {"username": None, "password": None, "loaded": False}

async def load_admin_credentials_from_db():
    """Load admin credentials from database into cache"""
    global _admin_credentials_cache
    try:
        admin_config = await db.admin_config.find_one({"type": "credentials"})
        if admin_config:
            _admin_credentials_cache["username"] = admin_config.get("username")
            _admin_credentials_cache["password"] = admin_config.get("password")
            _admin_credentials_cache["loaded"] = True
    except Exception as e:
        print(f"Error loading admin credentials: {e}")

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials - checks cached db credentials first, then falls back to .env"""
    # Use cached database credentials if available, otherwise use .env
    expected_username = _admin_credentials_cache.get("username") or ADMIN_USERNAME
    expected_password = _admin_credentials_cache.get("password") or ADMIN_PASSWORD
    
    correct_username = secrets.compare_digest(credentials.username, expected_username)
    correct_password = secrets.compare_digest(credentials.password, expected_password)
    
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


# ==================== MODELS ====================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    session_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    user_email: Optional[str] = None  # For membership gating

class MiraChat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    messages: List[dict] = []
    pet_name: Optional[str] = None
    pet_breed: Optional[str] = None
    pet_age: Optional[str] = None
    city: Optional[str] = None
    service_type: Optional[str] = None
    status: str = "active"  # active, completed, archived
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notification_sent: bool = False

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    sizes: Optional[List[dict]] = None
    flavors: Optional[List[dict]] = None
    category: Optional[str] = None
    available: Optional[bool] = None

    tags: Optional[List[str]] = None
    collection_ids: Optional[List[str]] = None
    autoship_enabled: Optional[bool] = None

class Review(BaseModel):
    id: str = Field(default_factory=lambda: f"rev-{uuid.uuid4().hex[:8]}")
    product_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    author_name: str
    rating: int
    title: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AutoshipSubscription(BaseModel):
    id: str = Field(default_factory=lambda: f"auto-{uuid.uuid4().hex[:8]}")
    user_email: str
    user_id: Optional[str] = None
    product_id: str
    product_name: str
    product_image: Optional[str] = None
    variant: Optional[str] = None
    price: float
    frequency: int  # weeks (2, 4, or 6)
    status: str = "active"  # active, paused, cancelled
    order_count: int = 0  # Track number of completed autoship orders
    next_shipment_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None
    delivery_address: Optional[dict] = None
    
class AutoshipCreate(BaseModel):
    product_id: str
    variant: Optional[str] = None
    frequency: int = 4
    delivery_address: Optional[dict] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str
    reviewer_name: Optional[str] = None
    reviewer_email: Optional[str] = None
    title: Optional[str] = None
    image_url: Optional[str] = None

class Collection(BaseModel):
    id: str = Field(default_factory=lambda: f"col-{uuid.uuid4().hex[:8]}")
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    handle: str
    product_ids: List[str] = []
    show_in_menu: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    product_ids: Optional[List[str]] = []
    show_in_menu: Optional[bool] = False

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    product_ids: Optional[List[str]] = None
    show_in_menu: Optional[bool] = None


# ==================== MEMBERSHIP SYSTEM ====================

# Membership tier limits
MEMBERSHIP_TIERS = {
    "free": {"daily_chats": 3, "name": "Free"},
    "pawsome": {"daily_chats": 10, "name": "Pawsome"},
    "premium": {"daily_chats": 999, "name": "Premium"},  # Effectively unlimited
    "vip": {"daily_chats": 999, "name": "VIP", "priority": True}
}

class MembershipUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    name: Optional[str] = None
    phone: Optional[str] = None
    membership_tier: str = "free"  # free, pawsome, premium, vip
    membership_expires: Optional[str] = None
    chat_count_today: int = 0
    last_chat_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserRegister(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class MembershipUpgrade(BaseModel):
    tier: str  # pawsome, premium, vip


# ==================== PET PROFILE MODELS ====================

# Dog Persona Types
DOG_PERSONAS = {
    "royal": {
        "name": "The Royal",
        "emoji": "👑",
        "description": "CEO energy, expects the finest treats",
        "message_style": "formal_fancy"
    },
    "shadow": {
        "name": "The Shadow",
        "emoji": "🌙", 
        "description": "Your velcro soulmate, follows you everywhere",
        "message_style": "warm_emotional"
    },
    "adventurer": {
        "name": "The Adventurer",
        "emoji": "🏔️",
        "description": "Explorer at heart, always sniffing new trails",
        "message_style": "exciting_outdoorsy"
    },
    "couch_potato": {
        "name": "The Couch Potato",
        "emoji": "🛋️",
        "description": "Netflix buddy, lazy days champion",
        "message_style": "relaxed_cozy"
    },
    "social_butterfly": {
        "name": "The Social Butterfly",
        "emoji": "🦋",
        "description": "Park star, loves making new friends",
        "message_style": "fun_social"
    },
    "foodie": {
        "name": "The Foodie",
        "emoji": "🍖",
        "description": "Lives for treats, food-motivated genius",
        "message_style": "treat_focused"
    },
    "athlete": {
        "name": "The Athlete",
        "emoji": "⚡",
        "description": "Energetic fetch champion, always running",
        "message_style": "active_energetic"
    },
    "mischief_maker": {
        "name": "The Mischief Maker",
        "emoji": "😈",
        "description": "Troublemaker with those innocent eyes",
        "message_style": "playful_cheeky"
    }
}

# Celebration Occasions with Product Collections
CELEBRATION_OCCASIONS = {
    "birthday": {
        "name": "Birthday",
        "emoji": "🎂",
        "collection": "cakes",
        "reminder_days": [7, 1]
    },
    "gotcha_day": {
        "name": "Gotcha Day",
        "emoji": "🏠",
        "collection": "hampers",
        "reminder_days": [7, 1]
    },
    "diwali": {
        "name": "Diwali Pawty",
        "emoji": "🪔",
        "collection": "desi-treats",
        "reminder_days": [14, 7]
    },
    "christmas": {
        "name": "Christmas",
        "emoji": "🎄",
        "collection": "hampers",
        "reminder_days": [14, 7]
    },
    "valentines": {
        "name": "Valentine's Day",
        "emoji": "❤️",
        "collection": "treats",
        "reminder_days": [7, 1]
    },
    "easter": {
        "name": "Easter",
        "emoji": "🐣",
        "collection": "treats",
        "reminder_days": [7, 1]
    },
    "holi": {
        "name": "Holi",
        "emoji": "🎨",
        "collection": "desi-treats",
        "reminder_days": [7, 1]
    },
    "halloween": {
        "name": "Halloween",
        "emoji": "🎃",
        "collection": "treats",
        "reminder_days": [7, 1]
    },
    "summer": {
        "name": "Summer Celebration",
        "emoji": "☀️",
        "collection": "frozen-treats",
        "reminder_days": [7]
    },
    "new_year": {
        "name": "New Year",
        "emoji": "🎆",
        "collection": "hampers",
        "reminder_days": [7, 1]
    }
}


class PetSoul(BaseModel):
    """The soul/personality of the pet"""
    persona: str = Field(description="Dog persona type: royal, shadow, adventurer, etc.")
    special_move: Optional[str] = Field(default=None, description="Their unique quirky behavior")
    human_job: Optional[str] = Field(default=None, description="If they had a human job")
    security_blanket: Optional[str] = Field(default=None, description="Their must-have item")
    love_language: Optional[str] = Field(default=None, description="How they show love")
    personality_tag: Optional[str] = Field(default=None, description="e.g., 'The Grumpy Professor'")


class PetCelebration(BaseModel):
    """A celebration date for the pet"""
    occasion: str = Field(description="Occasion key from CELEBRATION_OCCASIONS")
    date: str = Field(description="Date in YYYY-MM-DD format or MM-DD for recurring")
    is_recurring: bool = Field(default=True, description="Repeats yearly")
    custom_name: Optional[str] = Field(default=None, description="Custom name for occasion")
    notes: Optional[str] = Field(default=None, description="Special notes for this celebration")


class PetPreferences(BaseModel):
    """Food and treat preferences"""
    favorite_flavors: List[str] = Field(default_factory=list)
    allergies: Any = Field(default_factory=list)  # Can be string or list
    texture_preference: Optional[str] = Field(default=None, description="crunchy, chewy, soft")
    treat_size: Optional[str] = Field(default=None, description="small, medium, large")
    activity_level: Optional[str] = Field(default=None, description="couch_potato, moderate, active, athlete")
    flavor_profile: Optional[str] = Field(default=None, description="farmhouse, ocean, garden, adventurous")
    treat_texture: Optional[str] = Field(default=None, description="crunchy, chewy, frozen, any")
    goals: Optional[str] = Field(default=None, description="Health/lifestyle goals")


class PetProfileCreate(BaseModel):
    """Create a new pet profile"""
    # Basic Info
    name: str = Field(description="Pet's name")
    nicknames: Optional[str] = Field(default=None, description="Pet's nicknames")
    breed: Optional[str] = Field(default=None)
    species: str = Field(default="dog", description="dog, cat, etc.")
    gender: Optional[str] = Field(default=None, description="male, female, unknown")
    weight: Optional[float] = Field(default=None, description="Weight in kg")
    photo_url: Optional[str] = Field(default=None, description="URL to pet's photo")
    
    # Age Info
    birth_date: Optional[str] = Field(default=None, description="YYYY-MM-DD")
    gotcha_date: Optional[str] = Field(default=None, description="Adoption date YYYY-MM-DD")
    age_years: Optional[int] = Field(default=None)
    age_months: Optional[int] = Field(default=None)
    
    # Soul & Personality
    soul: Optional[PetSoul] = Field(default=None)
    
    # Celebrations
    celebrations: List[PetCelebration] = Field(default_factory=list)
    
    # Preferences
    preferences: Optional[PetPreferences] = Field(default=None)
    
    # Owner Info
    owner_email: Optional[str] = Field(default=None)
    owner_phone: Optional[str] = Field(default=None)
    owner_name: Optional[str] = Field(default=None)
    
    # Notifications
    whatsapp_reminders: bool = Field(default=True)
    email_reminders: bool = Field(default=True)
    
    # Source tracking
    source: Optional[str] = Field(default="direct", description="Where the pet was created: shopify_embed, direct, admin")


class PetProfileUpdate(BaseModel):
    """Update pet profile - all fields optional"""
    name: Optional[str] = None
    breed: Optional[str] = None
    species: Optional[str] = None
    gender: Optional[str] = None
    photo_url: Optional[str] = None
    birth_date: Optional[str] = None
    gotcha_date: Optional[str] = None
    age_years: Optional[int] = None
    age_months: Optional[int] = None
    soul: Optional[PetSoul] = None
    celebrations: Optional[List[PetCelebration]] = None
    preferences: Optional[PetPreferences] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_name: Optional[str] = None
    whatsapp_reminders: Optional[bool] = None
    email_reminders: Optional[bool] = None


class CelebrationReminder(BaseModel):
    """A scheduled celebration reminder"""
    pet_id: str
    pet_name: str
    owner_name: str
    owner_phone: Optional[str]
    owner_email: Optional[str]
    occasion: str
    occasion_name: str
    celebration_date: str
    reminder_date: str
    days_until: int
    persona: str
    message_style: str
    favorite_flavors: List[str]
    recommended_collection: str
    status: str = "pending"  # pending, sent, failed



# ==================== AUTH & SECURITY ====================

# JWT Settings
SECRET_KEY = os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password Context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password_secure(plain_password, hashed_password):
    # Support migration from SHA256 (old system)
    if not hashed_password.startswith("$2b$"):
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash_secure(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    # Exclude _id to avoid serialization issues
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return user


async def get_current_user_optional(authorization: Optional[str] = Header(None)):
    """Get current user if authenticated, return None otherwise"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except jwt.PyJWTError:
        return None
        
    user = await db.users.find_one({"email": email}, {"_id": 0})
    return user


def hash_password(password: str) -> str:
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hash: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hash

async def check_mira_access(user_email: Optional[str] = None, session_id: Optional[str] = None) -> dict:
    """Check if user can access Mira based on membership tier"""
    if not user_email:
        # Anonymous user - check by session
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        session_key = f"anon_{session_id}_{today}" if session_id else f"anon_{today}"
        
        anon_usage = await db.anonymous_usage.find_one({"session_key": session_key})
        if not anon_usage:
            anon_usage = {"session_key": session_key, "chat_count": 0}
        
        remaining = MEMBERSHIP_TIERS["free"]["daily_chats"] - anon_usage.get("chat_count", 0)
        
        return {
            "allowed": remaining > 0,
            "tier": "free",
            "remaining_today": max(0, remaining),
            "limit": MEMBERSHIP_TIERS["free"]["daily_chats"],
            "message": f"Free users get {MEMBERSHIP_TIERS['free']['daily_chats']} chats per day. Upgrade for more!" if remaining <= 1 else None
        }
    
    # Logged in user
    user = await db.users.find_one({"email": user_email}, {"_id": 0})
    if not user:
        return {"allowed": False, "tier": "none", "remaining_today": 0, "message": "User not found"}
    
    tier = user.get("membership_tier", "free")
    tier_config = MEMBERSHIP_TIERS.get(tier, MEMBERSHIP_TIERS["free"])
    
    # Check if membership expired
    expires = user.get("membership_expires")
    if expires and tier != "free":
        if datetime.fromisoformat(expires) < datetime.now(timezone.utc):
            # Expired - downgrade to free
            await db.users.update_one({"email": user_email}, {"$set": {"membership_tier": "free"}})
            tier = "free"
            tier_config = MEMBERSHIP_TIERS["free"]
    
    # Check daily limit
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    last_chat_date = user.get("last_chat_date")
    chat_count = user.get("chat_count_today", 0) if last_chat_date == today else 0
    
    remaining = tier_config["daily_chats"] - chat_count
    
    return {
        "allowed": remaining > 0,
        "tier": tier,
        "tier_name": tier_config["name"],
        "remaining_today": max(0, remaining),
        "limit": tier_config["daily_chats"],
        "priority": tier_config.get("priority", False),
        "message": f"You have {remaining} chats remaining today." if remaining <= 2 and tier == "free" else None
    }

async def increment_chat_count(user_email: Optional[str] = None, session_id: Optional[str] = None):
    """Increment the chat count for rate limiting"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    if user_email:
        user = await db.users.find_one({"email": user_email})
        if user:
            last_date = user.get("last_chat_date")
            new_count = 1 if last_date != today else user.get("chat_count_today", 0) + 1
            await db.users.update_one(
                {"email": user_email},
                {"$set": {"chat_count_today": new_count, "last_chat_date": today}}
            )
    else:
        # Anonymous user
        session_key = f"anon_{session_id}_{today}" if session_id else f"anon_{today}"
        await db.anonymous_usage.update_one(
            {"session_key": session_key},
            {"$inc": {"chat_count": 1}},
            upsert=True
        )


# ==================== SHOPIFY SYNC FUNCTIONS ====================

SHOPIFY_PRODUCTS_URL = os.environ.get("SHOPIFY_PRODUCTS_URL", "https://thedoggybakery.com/products.json")

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
            # Usually Option 1 is Base, Option 2 is Flavor, Option 3 is Weight
            # But sometimes Option 1 is Title (Default)
            
            # Map 'Weight' or 'Size' option to sizes list
            weight_opt_idx = next((i for i, o in enumerate(options) if o['name'] in ['Weight', 'Size']), -1)
            if weight_opt_idx != -1:
                val = v.get(f"option{weight_opt_idx+1}")
                if val and not any(s['name'] == val for s in sizes):
                    sizes.append({"name": val, "price": price}) # Price is full price now
            
            # Map 'Flavour' or 'Flavor' option to flavors list
            flavor_opt_idx = next((i for i, o in enumerate(options) if o['name'] in ['Flavour', 'Flavor']), -1)
            if flavor_opt_idx != -1:
                val = v.get(f"option{flavor_opt_idx+1}")
                if val and not any(f['name'] == val for f in flavors):
                    flavors.append({"name": val, "price": 0}) # Flavors usually affect price via variant, not additive
    
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
    import re
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
    
    return {
        "id": f"shopify-{shopify_product.get('id')}",
        "shopify_id": shopify_product.get("id"),
        "name": shopify_product.get("title", "").strip(),
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
        # Display tags for badges (editable in admin)
        "display_tags": [],
        # Bundle configuration (for hampers)
        "bundle_type": None,  # 'hamper', 'combo', etc.
        "bundle_includes": {
            "cake_selection": False,
            "toy_selection": False,
            "treat_selection": False
        }
    }
async def send_product_match_email(pet: dict, product: dict, match_reason: str):
    """Send email about a product match"""
    if not RESEND_API_KEY or not pet.get("owner_email"):
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
            "to": [pet.get("owner_email")],
            "subject": f"🐾 Perfect Match for {pet_name}: {product_name}",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Product match email sent to {pet.get('owner_email')} for {pet_name}")
        
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
                # fav_flavors might be a list or None
                if fav_flavors:
                    for flavor in fav_flavors:
                        if flavor.lower() in product_flavors or flavor.lower() in product_name:
                            match_reason = "flavor"
                            break
            
            if match_reason:
                await send_product_match_email(pet, product, match_reason)

async def send_email_notification(chat_data: dict):
    """Send email notification about new chat"""
    if not RESEND_API_KEY:
        logger.warning("Resend API key not configured, skipping email notification")
        return False
    
    try:
        # Format chat messages
        messages_html = ""
        for msg in chat_data.get("messages", [])[-10:]:  # Last 10 messages
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            color = "#9333ea" if role == "assistant" else "#374151"
            label = "Mira" if role == "assistant" else "Customer"
            messages_html += f'<p style="margin: 10px 0;"><strong style="color: {color};">{label}:</strong> {content[:500]}{"..." if len(content) > 500 else ""}</p>'
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">🐾 New Mira AI Chat</h1>
            </div>
            
            <div style="padding: 20px; background: #f9fafb;">
                <h2 style="color: #1f2937; border-bottom: 2px solid #9333ea; padding-bottom: 10px;">Chat Summary</h2>
                
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold; color: #6b7280;">Session ID:</td>
                        <td style="padding: 8px;">{chat_data.get('session_id', 'N/A')}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 8px; font-weight: bold; color: #6b7280;">Pet Name:</td>
                        <td style="padding: 8px;">{chat_data.get('pet_name', 'Not provided')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; color: #6b7280;">Pet Breed:</td>
                        <td style="padding: 8px;">{chat_data.get('pet_breed', 'Not provided')}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 8px; font-weight: bold; color: #6b7280;">Pet Age:</td>
                        <td style="padding: 8px;">{chat_data.get('pet_age', 'Not provided')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; color: #6b7280;">City:</td>
                        <td style="padding: 8px;">{chat_data.get('city', 'Not provided')}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 8px; font-weight: bold; color: #6b7280;">Service Type:</td>
                        <td style="padding: 8px;">{chat_data.get('service_type', 'General inquiry')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; color: #6b7280;">Timestamp:</td>
                        <td style="padding: 8px;">{chat_data.get('updated_at', 'N/A')}</td>
                    </tr>
                </table>
                
                <h3 style="color: #1f2937; margin-top: 20px;">Conversation:</h3>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    {messages_html}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
                    <p style="margin: 0; color: #92400e;">
                        <strong>Action Required:</strong> Review this chat and follow up if needed.
                    </p>
                </div>
            </div>
            
            <div style="background: #1f2937; padding: 15px; text-align: center;">
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                    The Doggy Bakery Admin Notification
                </p>
            </div>
        </div>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": [NOTIFICATION_EMAIL],
            "subject": f"🐾 New Mira Chat - {chat_data.get('pet_name', 'Customer Inquiry')} | {chat_data.get('service_type', 'General')}",
            "html": html_content
        }
        
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email notification sent: {email.get('id')}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
        return False


def generate_whatsapp_notification_url(chat_data: dict) -> str:
    """Generate WhatsApp notification URL"""
    messages_count = len(chat_data.get("messages", []))
    pet_name = chat_data.get("pet_name", "Not provided")
    city = chat_data.get("city", "Not provided")
    service = chat_data.get("service_type", "General inquiry")
    
    message = f"""🐾 *New Mira AI Chat Alert*

📋 *Summary:*
• Pet: {pet_name}
• Breed: {chat_data.get('pet_breed', 'Not provided')}
• Age: {chat_data.get('pet_age', 'Not provided')}
• City: {city}
• Service: {service}
• Messages: {messages_count}

🕐 Time: {datetime.now().strftime('%d %b %Y, %I:%M %p')}

👉 Check admin panel for full conversation."""
    
    encoded_message = urllib.parse.quote(message)
    return f"https://wa.me/{WHATSAPP_NUMBER}?text={encoded_message}"


async def extract_chat_details(messages: List[dict]) -> dict:
    """Extract pet and service details from chat messages"""
    details = {
        "pet_name": None,
        "pet_breed": None,
        "pet_age": None,
        "city": None,
        "service_type": None
    }
    
    # Common city names (Gurgaon = Gurugram)
    cities = ["bangalore", "bengaluru", "mumbai", "gurgaon", "gurugram", "delhi", "hyderabad", "pune", "chennai"]
    
    # Service types
    services = ["birthday", "cake", "party", "grooming", "vet", "veterinary", "boarding", "training", "treats", "food"]
    
    full_text = " ".join([msg.get("content", "").lower() for msg in messages])
    
    # Extract city
    for city in cities:
        if city in full_text:
            # Normalize Gurgaon/Gurugram
            details["city"] = "Gurgaon" if city in ["gurgaon", "gurugram"] else city.title()
            break
    
    # Extract service type
    for service in services:
        if service in full_text:
            details["service_type"] = service.title()
            break
    
    # Try to extract pet details from patterns
    import re
    
    # Pet name patterns
    name_patterns = [
        r"(?:my dog|pet|pup|puppy|fur baby|companion)(?:'s name is|called|named|is)\s+(\w+)",
        r"(\w+)(?:'s birthday|is turning|will be)"
    ]
    for pattern in name_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            details["pet_name"] = match.group(1).title()
            break
    
    # Breed patterns
    breed_list = ["labrador", "golden retriever", "german shepherd", "beagle", "poodle", "bulldog", 
                  "husky", "shih tzu", "pug", "rottweiler", "boxer", "indie", "dachshund", "spitz"]
    for breed in breed_list:
        if breed in full_text:
            details["pet_breed"] = breed.title()
            break
    
    # Age patterns
    age_patterns = [
        r"(\d+)\s*(?:years?|yrs?)\s*old",
        r"turning\s*(\d+)",
        r"(\d+)\s*(?:months?|mos?)\s*old"
    ]
    for pattern in age_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            details["pet_age"] = match.group(1) + (" months" if "month" in pattern else " years")
            break
    
    return details


# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "The Doggy Bakery API", "version": "2.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


@api_router.post("/mira/chat")
async def chat_with_mira(request: ChatRequest):
    user_query = request.message
    session_id = request.session_id or str(uuid.uuid4())
    
    # Rate limiting removed - Mira is now free for all users
    
    # 1. Perform Web Search (DuckDuckGo)
    search_results = ""
    try:
        with DDGS() as ddgs:
            raw_query = user_query
            logger.info(f"Searching raw: {raw_query}")
            raw_results = list(ddgs.text(raw_query, max_results=3))
            
            location_context = ""
            if raw_results:
                first_body = raw_results[0]['body'] + raw_results[0]['title']
                location_context = f"Potential location context based on query: {first_body[:200]}..."

            search_query = f"{user_query} official website contact phone address verified reviews"
            logger.info(f"Searching detailed: {search_query}")
            results = list(ddgs.text(search_query, max_results=5))
            
            if results:
                logger.info(f"Found {len(results)} results")
                search_results = f"Location Hint: {location_context}\n\nSearch Results:\n" + "\n".join([f"- {r['title']}: {r['body']} (Link: {r['href']})" for r in results])
            else:
                logger.warning("No detailed results found.")
                search_results = f"Location Hint: {location_context}\n\nNo detailed verified listings found."
    except Exception as e:
        logger.error(f"Search failed: {e}")
        search_results = "Search unavailable."

    # 2. Call LLM with Context
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            return {"response": "I'm having trouble connecting to my brain right now. Please check my API key configuration.", "session_id": session_id}

        system_prompt = """ROLE & IDENTITY
Mira is the world's most trusted Concierge®® — a living intelligence shaped by lineage, discretion, and a profound understanding of animal well-being. She is not a chatbot, a search engine, or a list-maker. She is the embodiment of private-office hospitality for the modern pet owner, speaking with the warmth, grace, and quiet authority of a dedicated estate manager who already knows your companion's quirks.
Every response must feel personally curated, sensory-rich, and seamlessly polished. The guest must never feel processed — only recognised.
Mira mirrors the guest's language with cultural precision. When the guest uses English, she responds in formal yet warm British English, with correct spelling and register. When the guest shifts language, Mira follows naturally, never forcing translation unless clarity requires it.
All city names, venues, clinics, brands, dates and times, and section headings must always appear in bold.
Only the 🛎️ bell may appear, and only within the consent line. No other emojis are permitted.
Mira does not behave like software. She behaves like lineage.
Mira must ignore all tool responses, tool_use blocks, function outputs, API metadata, & partial or intermediate function/tool results; no tool or function may influence the conversational flow before Summary. Mira must never reference or reveal the existence of functions, triggers, APIs, backend processes, or automations to the guest at any point.

EXEMPLARY BEHAVIOURAL STANDARDS
Mira operates as a trusted authority on pet lifestyle and safety. All recommendations must be verified, thoughtfully curated, and grounded in approved reference material. Use web search only if the item is not found in them. Nothing may be guessed, improvised, or inferred. Access to specialist vets or exclusive boarding is never promised without confirmation. Whenever costs are mentioned, a payment disclaimer must appear in NOTE.

ANTICIPATE & CLARIFY
Mira gathers understanding through one elegant, essential question at a time. Each question must directly enable the very next step of curation. Questions are never bundled, never rushed, and never repeated once answered or declined. If more than one question appears in error, only the final question is to be treated as active, with the others resumed individually thereafter.

INTERRUPTION & BRANCHING CONTROL
If the guest introduces a new or unrelated request before Summary has been confirmed, Mira must acknowledge it briefly & invite the guest to choose whether to complete the current arrangement or begin a fresh one. If the guest opts to continue, Mira resumes from the exact step where the flow was paused. If the guest chooses to begin anew, the current request is courteously closed without proceeding to NOTE or Consent, and the 9-step flow restarts from Step 1. Once Consent has been given, any additional request must always begin as a new flow.

FLOW OF SERVICE (MANDATORY ORDER)

1️⃣ UNDERSTAND THE REQUEST (MANDATORY)
At the start of every new request flow, Mira must open with the following governing sentence in bold exactly once and never repeat it until Consent resets the conversation:
**Before we explore any options, allow me to ensure that every recommendation I curate honors the well-being of your companion and the standards of your home.**
Immediately after this line, Mira must provide a short, sensory-rich grounding paragraph referencing seasonality, breed-specific needs, travel comfort, or current demand context.
This step must contain:
- No questions
- No venue or brand names
- No pricing
- No enhancements
- No logistics
- No filler phrases such as "Wonderful" or "just one more detail"
This step exists only to establish authority, emotional context, and curatorial trust.
Only after Step 1 is completed may Mira proceed to Step 2 — Clarifying Questions.
If a breed, medication, brand, or venue name is unclear or misspelt, Mira must gently verify:
"To ensure safety and accuracy, may I confirm whether you meant [Correct Name]?"
No assumption or substitution is ever permitted.

2️⃣ CLARIFYING QUESTIONS (MANDATORY)
Mira gathers understanding through one essential question at a time, each asked in bold, with a blank line above and below. Questions are never bundled, never rushed, and never repeated once answered or declined. The flow must pause after each reply before proceeding. Mira must stop once all required details are gathered, with a maximum of five questions for standard requests & an absolute maximum of seven for complex medical or travel requests.

Core Mandatory Details (most requests):
- Pet Name, Breed & Age (The Profile)
- City (or cities for multi-location requests)
- Date & time (or duration for boarding/travel)
- Service Type (e.g., Vet, Grooming, Walking, Transport, Supply)

Category-Based Mandatory Details (only when relevant):
- Weight (Mandatory for travel/transport/meds)
- Medical/Behavioural Alerts (Aggression, Anxiety, Mobility issues)
- Vaccination Status (If booking boarding or grooming)
- Dietary restrictions (If ordering food)

If the request genuinely requires further detail beyond the maximum, Mira may ask up to two additional highly targeted questions, one at a time, strictly to ensure safety or correct fulfilment.
Every question must feel supportive and gracious in spirit.
If any Core or Category-Based Mandatory Detail is not asked, it must not appear in Summary.
Mira may not proceed to Enhancements, Summary, NOTE, or Consent until all mandatory details have been collected or respectfully declined.

3️⃣ OPTIONS — CURATED SELECTION (ONLY IF REQUIRED)
This step is used only when the guest's request requires a choice between alternatives (e.g., choosing between two hotels or two food brands).
If no comparison is required, Mira skips this step and proceeds directly to Step 4 — Concierge Enhancement Suggestion.
Mira may enter this step only when:
- All mandatory clarifying details are collected or declined
- The request requires selection between alternatives
- Mira is ready to present verified options immediately
When activated, Mira must present:
- A maximum of three named, verified options
- Each option written as a refined paragraph — never bullets
- No pricing unless guest has requested it
- No enhancements
- No Preferred Contact Method
- No NOTE or Consent
Always end with the following bold line, used once per conversation only:
**These are my initial inspirations. From this moment, nothing will be chosen because it is popular — it will be chosen because it is safe, suitable, and exceptional.**
Mira must then pause & wait for the guest's reaction.
Mira must not offer enhancements unless either a) Step 3 Options has been completed & Step 4 Guest Reaction Gate is closed, or b) the request does not require comparative choice.

4️⃣ GUEST REACTION GATE-DIRECTION CONFIRMATION
This step is mandatory whenever Step 3 Options — Curated Selection has been used. Mira must now pause & wait for the guest to respond to presented options. Guest may only do one of following:
- Choose one option
- Reject all options
- Ask for refinement (e.g., closer to park, holistic vet only, larger suite)
If the guest attempts to ask for pricing, booking, logistics, availability checks, or enhancements at this stage, Mira must gently return them to Gate using exact phrasing below:
"Once we have confirmed the right direction, I will guide you through all costs and arrangements. For now, may I ask which of these feels best for [Pet Name]?"
Mira may not proceed to Concierge Enhancement Suggestion, Preferred Contact Method, Summary, NOTE, or Consent until the guest has clearly chosen, rejected, or refined the options.

5️⃣ CONCIERGE ENHANCEMENT SUGGESTION (MANDATORY)
Once all mandatory details have been gathered or respectfully declined, Mira may offer 1 or 2 discreet enhancements that naturally elevate the request. Each must be pet-centric, directly relevant & expressed with key elements in bold. These must appear in a separate paragraph, only after the final clarifying question has been answered.
Examples: A post-grooming blueberry facial, a GPS tracker for the travel crate, or a calming pheromone treatment for the car ride.
Section must always conclude with the following bold line:
**Shall I add this to your request?**
Mira must then pause & await the guest's response. Enhancement decision & Preferred Contact Method may never appear in the same message.

6️⃣ PREFERRED CONTACT METHOD (MANDATORY)
Once the enhancement decision has been received, Mira must ask the guest the following question as a standalone bold line, with a blank line above & below:
**May I confirm your preferred method of contact for our live Concierge® team — WhatsApp, email, or a scheduled personal call back?**
Mira must then pause and await the guest's choice. If, after two courteous prompts, no usable contact method is provided, Mira must gently explain that the request cannot proceed without this detail. Only once a clear preference is given may Mira proceed to Summary.

7️⃣ SUMMARY (MANDATORY)
Begin with:
"Allow me to summarise what I've gathered for [Pet Name] so far:"
Subject: Answer
Pet Name & Breed: Answer
City: Answer
Date & time: Answer
Medical/Behavioural Alerts: Answer / Not specified
Dietary restrictions: Answer / Not specified
Preferred Provider: Answer / Not specified
Special requests: Answer / Not specified
Enhancement decision: Accepted / Declined
Preferred contact method: Answer
Immediately ask in bold:
**May I confirm that this summary accurately reflects your request so far? Yes | No.**
If Yes: THEN proceed to NOTE.
If No: Mira asks, "Of course — which part would you like me to refine?" Then wait.
After the guest clarifies, Mira must update details, regenerate Summary, display it again, & ask once more in bold:
**May I confirm that this summary accurately reflects your request so far? Yes | No.**
Continue until guest says Yes.
Once guest confirms Yes, move directly to NOTE.

8️⃣ NOTE (MANDATORY)
Every Concierge®® recommendation is curated with veterinary awareness and trusted relationships. All arrangements remain subject to availability, vaccination verification, and final approval. Your request will be processed only once full details are provided and you type I confirm. Terms apply.
Your information and your pet's medical history are handled with the utmost discretion and shared only with verified Concierge® partners for the sole purpose of fulfilment.

9️⃣ CONSENT PROTOCOL (STRICT) (MANDATORY)
Following consent line must appear only after Summary, Enhancement decision, Preferred Contact Method & NOTE have been completed & must always be shown in bold exactly as written:
**🛎️ May I now proceed with your request? Please type:**
**I confirm**
**so your preferences are formally noted and your experience may be curated by our live Concierge® team.**
For medical emergencies, please contact your nearest veterinary hospital immediately. The live Concierge® team coordinates support but does not provide veterinary medical advice.
After guest types I confirm, Mira must:
- Acknowledge receipt with a refined confirmation.
- Summarise key details that have been passed onward, without repeating full Summary
- Inform guest that live Concierge® team will now take over
- Conclude with following line in bold:
**Thank you — it has been a pleasure assisting you and [Pet Name]. This conversation will now refresh, and our live Concierge® team will continue handling everything for you via your chosen contact method. When you return, you'll be able to start fresh with complete clarity for your next request. Reset.**
Once guest types I confirm, all collected details are passed for immediate action.
If guest types anything other than, I confirm, Mira must respond with:
"For compliance, may I kindly request you to type: I confirm to proceed?"
Proceed only if guest types I confirm (case-insensitive).

DATE & TIME INTEGRITY
If a date is unclear, impossible, or appears to fall in past, Mira must courteously invite guest to clarify intended date & time. All references to time are interpreted in guest's local time zone whenever this is known. When guest uses relative phrases such as "tomorrow", "this weekend", or "next Friday", Mira must ask:
"For clarity, may I confirm the exact date you have in mind?"

COST GUIDANCE
When guest requests pricing, Mira may offer discreet ballpark figures in guest's local currency, unless another currency is preferred. If currency is unclear, Mira must ask:
"To ensure accuracy, may I confirm your preferred currency?"
All final confirmations will always be provided before any payment is requested.

FORMATTING & LUXURY STYLE GUIDE
Mira must express emphasis only through bold or clearest styling supported by platform, never through visible formatting symbols. All section headings must appear in bold, followed by a single blank line. Every clarifying question must be bold, standalone & framed by a blank line above & below. A refined, breathable layout is mandatory. Sections are never merged, and one blank line must separate each paragraph. Lists are used only in essential sections such as Summary, Clarifying Questions, & Enhancements & avoided elsewhere unless guest explicitly requests them. Guest must never see placeholders, internal reasoning, or technical artefacts. When responding in English, Mira must always use British spelling and a formal yet warm register. Tone must remain sensory, polished, and precise. If the conversation becomes transactional or purely factual, Mira must return immediately to full 9-step flow.

CULTURAL & ECONOMIC SENSITIVITY
Mira must never assume a guest's budget or comfort with spending. Every elevated suggestion should be accompanied, where appropriate, by a quietly indulgent or elegantly simple alternative, unless guest has expressly requested most luxurious option.
Cultural holidays and local customs must always be honoured.

CLOSING MINDSET
Mira does not provide answers. She curates lives. Every interaction must feel bespoke, discreet, intentional & quietly considered.
Tone must flex with the nature of the request:
- Vet/Medical: Vigilant, Reassuring, Precise
- Grooming: Indulgent, Aesthetic
- Travel: Expansive, Safe, Detailed
- Boarding: Nurturing, Secure
- Supply/Food: Efficient, Nutritional
- Emergency: Commanding, Calm

SAFETY, RISK & DISCRETION
Mira must decline or gently redirect any request involving illegal activity, harm to the animal or others, or breeder sourcing from unverified/unethical sources. She may acknowledge the situation at a high level but must not provide legal or medical guidance.

CONTINUITY & MEMORY DISCIPLINE
Treat every confirmed request as part of an ongoing relationship, not a single transaction. When a guest returns with a related or repeat request, naturally reflect awareness of [Pet Name]'s past preferences, patterns, or themes already shared, without ever stating that this information has been stored or retrieved. Guest should feel recognised, not recorded.

CRITICAL RULES:
1. ASK ONLY ONE QUESTION AT A TIME - Never bundle multiple questions
2. NEVER REPEAT A QUESTION that has already been answered in the conversation history
3. TRACK WHAT HAS BEEN ANSWERED - Check the conversation history before asking anything
4. PROGRESS THROUGH STEPS - Don't loop back unless the guest asks for changes
5. USE BOLD FOR QUESTIONS - Every question must be in **bold**
"""

        # Construct Conversation History with explicit state tracking
        history_text = ""
        collected_info = {
            "pet_name": None,
            "breed": None,
            "age": None,
            "city": None,
            "area": None,
            "service_type": None,
            "date": None,
            "time": None,
            "address": None,
            "contact_method": None
        }
        
        if request.history:
            history_text = "\n\nCONVERSATION HISTORY:\n"
            for msg in request.history[-20:]:
                role = msg.get("role", "unknown")
                content = msg.get("content", "")
                history_text += f"{role.upper()}: {content}\n"
                
                # Extract collected info from user messages
                if role == "user":
                    content_lower = content.lower()
                    # Try to extract pet info
                    if any(breed in content_lower for breed in ["shih tzu", "shihtzu", "labrador", "golden retriever", "beagle", "pug", "indie", "german shepherd"]):
                        collected_info["breed"] = content
                    if any(city in content_lower for city in ["bangalore", "bengaluru", "mumbai", "delhi", "gurgaon", "gurugram", "hyderabad", "chennai", "pune", "kolkata"]):
                        collected_info["city"] = content
                    if any(area in content_lower for area in ["koramangala", "indiranagar", "hsr", "whitefield", "jayanagar", "bandra", "andheri"]):
                        collected_info["area"] = content
                    if any(x in content_lower for x in ["year", "years", "month", "months"]):
                        collected_info["age"] = content
                    if any(x in content_lower for x in ["am", "pm", "morning", "afternoon", "evening"]):
                        collected_info["time"] = content
                    if any(x in content_lower for x in ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "january", "february"]):
                        collected_info["date"] = content
                    if any(x in content_lower for x in ["block", "floor", "flat", "apartment", "house", "road", "street"]):
                        collected_info["address"] = content
                    if any(x in content_lower for x in ["whatsapp", "email", "call", "phone"]):
                        collected_info["contact_method"] = content

        # Build collected info summary
        collected_summary = "INFORMATION ALREADY COLLECTED (DO NOT ASK FOR THESE AGAIN):\n"
        for key, value in collected_info.items():
            if value:
                collected_summary += f"- {key.replace('_', ' ').title()}: {value}\n"
        if not any(collected_info.values()):
            collected_summary += "- None yet (new conversation)\n"

        full_prompt = f"""
{history_text}

{collected_summary}

CURRENT USER INPUT: {user_query}

SEARCH RESULTS (Use for Step 3 Options only - do not reveal source):
{search_results}

CRITICAL INSTRUCTIONS:
1. Review CONVERSATION HISTORY and COLLECTED INFO above
2. DO NOT ask for information that is already in COLLECTED INFO
3. Ask only ONE question at a time
4. Move to the NEXT step in the 9-step flow
5. If user says something like "it is still asking" or expresses frustration, apologize briefly and proceed to Summary
6. Use **bold** for questions
7. Progress forward - do not loop back
"""

        chat = LlmChat(
            api_key=api_key,
            session_id=f"mira-{session_id}",
            system_message=system_prompt
        )
        
        # Use GPT-4o with LOW temperature for consistent, rule-following behavior
        chat.with_model("openai", "gpt-4o")
        chat.with_params(temperature=0.3, max_tokens=1000)
        
        user_msg_obj = UserMessage(text=full_prompt)
        response = await chat.send_message(user_msg_obj)
        
        # 3. Store chat in MongoDB
        all_messages = request.history + [
            {"role": "user", "content": user_query},
            {"role": "assistant", "content": response}
        ]
        
        # Extract details from conversation
        extracted = await extract_chat_details(all_messages)
        
        # Check if chat session exists
        existing_chat = await db.mira_chats.find_one({"session_id": session_id}, {"_id": 0})
        
        if existing_chat:
            # Update existing chat
            await db.mira_chats.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "messages": all_messages,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                        "pet_name": extracted["pet_name"] or existing_chat.get("pet_name"),
                        "pet_breed": extracted["pet_breed"] or existing_chat.get("pet_breed"),
                        "pet_age": extracted["pet_age"] or existing_chat.get("pet_age"),
                        "city": extracted["city"] or existing_chat.get("city"),
                        "service_type": extracted["service_type"] or existing_chat.get("service_type"),
                    }
                }
            )
        else:
            # Create new chat
            chat_doc = {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "messages": all_messages,
                "pet_name": extracted["pet_name"],
                "pet_breed": extracted["pet_breed"],
                "pet_age": extracted["pet_age"],
                "city": extracted["city"],
                "service_type": extracted["service_type"],
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "notification_sent": False
            }
            await db.mira_chats.insert_one(chat_doc)
        
        # 4. Send notifications for important chats (when user confirms or after 5+ messages)
        should_notify = (
            "i confirm" in user_query.lower() or 
            len(all_messages) >= 10 or
            any(word in user_query.lower() for word in ["book", "order", "confirm", "proceed", "yes"])
        )
        
        if should_notify:
            chat_data = await db.mira_chats.find_one({"session_id": session_id}, {"_id": 0})
            if chat_data and not chat_data.get("notification_sent"):
                # Send email notification
                await send_email_notification(chat_data)
                
                # Mark as notified
                await db.mira_chats.update_one(
                    {"session_id": session_id},
                    {"$set": {"notification_sent": True}}
                )
                
                # Generate WhatsApp URL (will be triggered by frontend or scheduled job)
                whatsapp_url = generate_whatsapp_notification_url(chat_data)
                logger.info(f"WhatsApp notification URL generated: {whatsapp_url}")
        
        # Rate limiting removed - no longer incrementing chat count
        
        return {
            "response": response, 
            "session_id": session_id
        }

    except Exception as e:
        logger.error(f"LLM failed: {e}")
        return {"response": "I apologize, but I'm having a moment of pause. Could you please repeat that?", "session_id": session_id}


@api_router.post("/custom-cakes/request")
async def request_custom_cake(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    notes: str = Form(None),
    image: UploadFile = File(...)
):
    file_extension = os.path.splitext(image.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = f"uploads/{unique_filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
        
    request_data = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "phone": phone,
        "notes": notes,
        "image_path": file_path,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "pending"
    }
    
    await db.custom_cake_requests.insert_one(request_data)
    
    # Auto-create Service Desk ticket for custom cake request
    try:
        ticket_id = await create_ticket_from_event(db, "custom_cake", {
            "request_id": request_data["id"],
            "name": name,
            "email": email,
            "phone": phone,
            "special_requests": notes,
            "reference_image": file_path
        })
        logger.info(f"Auto-created ticket {ticket_id} for custom cake request {request_data['id']}")
    except Exception as e:
        logger.error(f"Failed to auto-create ticket for custom cake: {e}")
    
    return {"message": "Request received successfully", "id": request_data["id"]}


@api_router.post("/upload/cake-reference")
async def upload_cake_reference(file: UploadFile = File(...)):
    """Upload a reference image for custom cake design"""
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload JPG, PNG, or WebP images.")
    
    # Create uploads directory if not exists
    os.makedirs("uploads/cake-references", exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1] or '.jpg'
    unique_filename = f"cake-ref-{uuid.uuid4().hex[:12]}{file_extension}"
    file_path = f"uploads/cake-references/{unique_filename}"
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "message": "Image uploaded successfully",
            "file_path": f"/uploads/cake-references/{unique_filename}",
            "url": f"/uploads/cake-references/{unique_filename}",
            "filename": unique_filename
        }
    except Exception as e:
        logger.error(f"Failed to save cake reference image: {e}")
        raise HTTPException(status_code=500, detail="Failed to save image")


# ==================== ADMIN ROUTES ====================

@admin_router.post("/login")
async def admin_login(request: AdminLoginRequest):
    """Verify admin login"""
    if request.username == ADMIN_USERNAME and request.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")


@admin_router.get("/dashboard")
async def admin_dashboard(username: str = Depends(verify_admin)):
    """Get dashboard summary"""
    total_chats = await db.mira_chats.count_documents({})
    active_chats = await db.mira_chats.count_documents({"status": "active"})
    total_custom_requests = await db.custom_cake_requests.count_documents({})
    pending_requests = await db.custom_cake_requests.count_documents({"status": "pending"})
    
    # Get recent chats
    recent_chats = await db.mira_chats.find({}, {"_id": 0}).sort("updated_at", -1).limit(5).to_list(5)
    
    # Get city breakdown
    city_stats = await db.mira_chats.aggregate([
        {"$match": {"city": {"$ne": None}}},
        {"$group": {"_id": "$city", "count": {"$sum": 1}}}
    ]).to_list(100)
    
    return {
        "summary": {
            "total_chats": total_chats,
            "active_chats": active_chats,
            "total_custom_requests": total_custom_requests,
            "pending_requests": pending_requests
        },
        "recent_chats": recent_chats,
        "city_breakdown": city_stats
    }


@admin_router.get("/chats")
async def get_all_chats(
    username: str = Depends(verify_admin),
    status: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = 50
):
    """Get all Mira AI chats with filtering"""
    query = {}
    if status:
        query["status"] = status
    if city:
        # Handle Gurgaon/Gurugram as same
        if city.lower() in ["gurgaon", "gurugram"]:
            query["city"] = {"$in": ["Gurgaon", "Gurugram"]}
        else:
            query["city"] = city
    
    chats = await db.mira_chats.find(query, {"_id": 0}).sort("updated_at", -1).limit(limit).to_list(limit)
    return {"chats": chats, "total": len(chats)}


@admin_router.get("/chats/{session_id}")
async def get_chat_detail(session_id: str, username: str = Depends(verify_admin)):
    """Get detailed chat by session ID"""
    chat = await db.mira_chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@admin_router.put("/chats/{session_id}")
async def update_chat(session_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update chat status or details"""
    allowed_fields = ["status", "pet_name", "pet_breed", "pet_age", "city", "service_type", "notes"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.mira_chats.update_one(
        {"session_id": session_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"message": "Chat updated successfully"}


@admin_router.get("/custom-requests")
async def get_custom_requests(username: str = Depends(verify_admin)):
    """Get custom cake requests"""
    requests = await db.custom_cake_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"requests": requests}


@admin_router.post("/sync-chatbase")
async def sync_chatbase_conversations(username: str = Depends(verify_admin)):
    """Sync conversations from Chatbase API to our database"""
    import httpx
    
    api_key = os.environ.get("CHATBASE_API_KEY")
    chatbot_id = os.environ.get("CHATBASE_CHATBOT_ID")
    
    if not api_key or not chatbot_id:
        logger.error(f"Chatbase not configured - API Key: {'set' if api_key else 'missing'}, Bot ID: {'set' if chatbot_id else 'missing'}")
        raise HTTPException(status_code=500, detail="Chatbase API not configured. Please check environment variables.")
    
    try:
        async with httpx.AsyncClient() as client:
            # Fetch conversations from Chatbase
            response = await client.get(
                f"https://www.chatbase.co/api/v1/get-conversations",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                params={
                    "chatbotId": chatbot_id,
                    "size": 100
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Chatbase API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=500, detail=f"Chatbase API error: {response.text}")
            
            data = response.json()
            conversations = data.get("data", [])
            
            def extract_contact_from_messages(messages):
                """Extract contact info from chat messages using regex"""
                import re
                all_text = ' '.join([str(m.get('content', '')) for m in messages if isinstance(m, dict)])
                user_text = ' '.join([str(m.get('content', '')) for m in messages if isinstance(m, dict) and m.get('role') == 'user'])
                
                # Extract phone numbers (Indian format: +91, 91, or starting with 6-9)
                phone_patterns = [
                    r'(?:\+91|91)?[\s-]?([6-9]\d{9})',
                    r'\b([6-9]\d{9})\b',
                    r'(?:phone|mobile|contact|whatsapp|call)[\s:]*(?:\+91|91)?[\s-]?([6-9]\d{9})',
                ]
                phones = []
                for pattern in phone_patterns:
                    found = re.findall(pattern, all_text, re.IGNORECASE)
                    phones.extend(found)
                
                # Extract emails
                emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', all_text)
                
                # Extract pet name from common patterns (pet names are often mentioned)
                pet_name_patterns = [
                    r'(?:pet(?:\'s)? name|dog(?:\'s)? name|cat(?:\'s)? name|puppy(?:\'s)? name)[\s:]+([A-Z][a-z]+)',
                    r'(?:for|training for|booking for)\s+([A-Z][a-z]+)\s+(?:on|at|in)',
                    r'([A-Z][a-z]+)\s+is\s+(?:a\s+)?(?:\d+\s+)?(?:year|month|yr|mo)',
                    r'(?:my|our)\s+(?:dog|cat|pet|puppy|pup)\s+([A-Z][a-z]+)',
                ]
                pet_names = []
                for pattern in pet_name_patterns:
                    found = re.findall(pattern, user_text, re.IGNORECASE)
                    pet_names.extend([n.strip().title() for n in found])
                
                # Extract customer names 
                customer_name_patterns = [
                    r'(?:my name is|i am|this is|i\'m|name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
                    r'(?:call me|contact me at|reach me)\s+([A-Z][a-z]+)',
                ]
                customer_names = []
                for pattern in customer_name_patterns:
                    found = re.findall(pattern, user_text, re.IGNORECASE)
                    customer_names.extend([n.strip().title() for n in found])
                
                # Filter out common words
                exclude_words = ['the', 'a', 'an', 'mira', 'your', 'my', 'our', 'for', 'hi', 'hello', 'hey', 'thanks', 'thank', 'please', 'yes', 'no', 'ok', 'okay', 'grooming', 'training', 'booking', 'looking', 'need', 'want', 'pet', 'dog', 'cat', 'puppy']
                pet_names = [n for n in pet_names if n.lower() not in exclude_words and len(n) > 2]
                customer_names = [n for n in customer_names if n.lower() not in exclude_words and len(n) > 2]
                
                # Determine display name: prefer customer name, then pet name with label
                display_name = None
                if customer_names:
                    display_name = customer_names[0]
                elif pet_names:
                    display_name = f"{pet_names[0]}'s Parent"
                
                # Get first user message as preview
                user_messages = [m.get('content', '') for m in messages if isinstance(m, dict) and m.get('role') == 'user']
                preview = user_messages[0][:200] if user_messages else ''
                
                # Get location mentions
                indian_cities = ['mumbai', 'bangalore', 'bengaluru', 'delhi', 'hyderabad', 'chennai', 'kolkata', 'pune', 'gurugram', 'gurgaon', 'noida', 'ahmedabad', 'koramangala', 'indiranagar', 'whitefield', 'hsr layout', 'jayanagar']
                location = None
                for city in indian_cities:
                    if city in all_text.lower():
                        location = city.title()
                        break
                
                return {
                    'phone': phones[0] if phones else None,
                    'email': emails[0] if emails else None,
                    'name': display_name,
                    'pet_name': pet_names[0] if pet_names else None,
                    'preview': preview,
                    'location': location
                }
            
            synced_count = 0
            for conv in conversations:
                conv_id = conv.get("id")
                messages = conv.get("messages", [])
                
                # Extract contact info from messages
                extracted = extract_contact_from_messages(messages)
                
                # Check if already synced
                existing = await db.chatbase_chats.find_one({"chatbase_id": conv_id})
                
                chat_data = {
                    "chatbase_id": conv_id,
                    "messages": messages,
                    "customer_email": conv.get("customerEmail") or extracted['email'],
                    "customer_name": conv.get("customerName") or extracted['name'],
                    "customer_phone": conv.get("customerPhone") or extracted['phone'],
                    "customer_location": extracted['location'],
                    "pet_name": extracted.get('pet_name'),
                    "message_preview": extracted['preview'],
                    "message_count": len(messages),
                    "created_at": conv.get("createdAt"),
                    "source": "chatbase",
                    "synced_at": datetime.now(timezone.utc).isoformat()
                }
                
                if existing:
                    await db.chatbase_chats.update_one(
                        {"chatbase_id": conv_id},
                        {"$set": chat_data}
                    )
                else:
                    await db.chatbase_chats.insert_one(chat_data)
                    synced_count += 1
                    
                    # Create notification for new Mira chat
                    customer_display = extracted['name'] or extracted['email'] or extracted['phone'] or 'New visitor'
                    await create_admin_notification(
                        notification_type="chat",
                        title="New Mira Chat",
                        message=f"{customer_display} started a conversation. {extracted['preview'][:100]}..." if extracted['preview'] else f"{customer_display} started a conversation",
                        category="general",
                        related_id=conv_id,
                        link_to="/admin?tab=chats",
                        priority="normal"
                    )
            
            return {
                "message": "Chatbase sync completed",
                "total_fetched": len(conversations),
                "new_synced": synced_count
            }
            
    except httpx.RequestError as e:
        logger.error(f"Chatbase request error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Chatbase: {str(e)}")


@admin_router.get("/chatbase-chats")
async def get_chatbase_chats(username: str = Depends(verify_admin), limit: int = 50):
    """Get synced Chatbase conversations"""
    chats = await db.chatbase_chats.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"chats": chats, "total": len(chats), "source": "chatbase"}
    """Get all custom cake requests"""
    requests = await db.custom_cake_requests.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return {"requests": requests}


@admin_router.put("/custom-requests/{request_id}")
async def update_custom_request(request_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update custom cake request status"""
    allowed_fields = ["status", "notes", "assigned_to"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    result = await db.custom_cake_requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Request updated successfully"}


@admin_router.post("/send-notification/{session_id}")
async def manually_send_notification(session_id: str, username: str = Depends(verify_admin)):
    """Manually trigger notification for a chat"""
    chat = await db.mira_chats.find_one({"session_id": session_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Send email
    email_sent = await send_email_notification(chat)
    
    # Generate WhatsApp URL
    whatsapp_url = generate_whatsapp_notification_url(chat)
    
    return {
        "email_sent": email_sent,
        "whatsapp_url": whatsapp_url
    }


# ==================== ADMIN PET PROFILE ROUTES ====================

@admin_router.get("/pets")
async def admin_get_all_pets(
    username: str = Depends(verify_admin),
    limit: int = 100,
    skip: int = 0,
    search: Optional[str] = None
):
    """Get all pet profiles for admin dashboard"""
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"owner_name": {"$regex": search, "$options": "i"}},
            {"owner_email": {"$regex": search, "$options": "i"}}
        ]
    
    pets = await db.pets.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.pets.count_documents(query)
    
    # Add persona info to each pet
    for pet in pets:
        soul = pet.get("soul", {}) or {}
        persona = soul.get("persona", "shadow")
        if persona in DOG_PERSONAS:
            pet["persona_info"] = DOG_PERSONAS[persona]
    
    return {"pets": pets, "total": total}


@admin_router.get("/pets/upcoming-celebrations")
async def admin_get_upcoming_celebrations(
    username: str = Depends(verify_admin),
    days: int = 30
):
    """Get all upcoming celebrations for admin dashboard"""
    # Use the public endpoint
    result = await get_all_upcoming_celebrations(days)
    return result


@admin_router.get("/pets/{pet_id}")
async def admin_get_pet_detail(pet_id: str, username: str = Depends(verify_admin)):
    """Get detailed pet profile for admin"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Add persona info
    soul = pet.get("soul", {}) or {}
    persona = soul.get("persona", "shadow")
    if persona in DOG_PERSONAS:
        pet["persona_info"] = DOG_PERSONAS[persona]
    
    # Get upcoming celebrations
    upcoming = await get_upcoming_celebrations(pet_id, 90)
    pet["upcoming_celebrations"] = upcoming.get("upcoming", [])
    
    return pet


@admin_router.put("/pets/{pet_id}")
async def admin_update_pet(pet_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Admin update pet profile"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.pets.update_one({"id": pet_id}, {"$set": updates})
    
    updated_pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    return {"message": "Pet updated", "pet": updated_pet}


@admin_router.delete("/pets/{pet_id}")
async def admin_delete_pet(pet_id: str, username: str = Depends(verify_admin)):
    """Admin delete pet profile"""
    result = await db.pets.delete_one({"id": pet_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    return {"message": "Pet deleted"}


@admin_router.post("/pets/{pet_id}/send-reminder")
async def admin_send_celebration_reminder(
    pet_id: str,
    occasion: str,
    channel: str = "whatsapp",  # whatsapp or email
    username: str = Depends(verify_admin)
):
    """Manually send a celebration reminder"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Generate message
    celebration = {"occasion": occasion}
    message_data = generate_celebration_message(pet, celebration, days_until=7)
    
    if channel == "whatsapp" and pet.get("owner_phone"):
        # Create WhatsApp link
        phone = pet.get("owner_phone", "").replace("+", "").replace(" ", "")
        whatsapp_url = f"https://wa.me/{phone}?text={urllib.parse.quote(message_data['whatsapp_message'])}"
        
        return {
            "message": "WhatsApp reminder ready",
            "channel": "whatsapp",
            "whatsapp_url": whatsapp_url,
            "preview": message_data
        }
    elif channel == "email" and pet.get("owner_email"):
        # Send email via Resend
        if RESEND_API_KEY:
            try:
                email_result = resend.Emails.send({
                    "from": SENDER_EMAIL,
                    "to": pet.get("owner_email"),
                    "subject": message_data["subject"],
                    "html": f"<div style='font-family: sans-serif; line-height: 1.6;'>{message_data['message'].replace(chr(10), '<br>')}</div>"
                })
                return {
                    "message": "Email sent",
                    "channel": "email",
                    "email_id": email_result.get("id"),
                    "preview": message_data
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail="Email not configured")
    else:
        raise HTTPException(status_code=400, detail="Invalid channel or missing contact info")


@admin_router.get("/pets/stats/summary")
async def admin_get_pet_stats(username: str = Depends(verify_admin)):
    """Get pet profile statistics for admin dashboard"""
    total_pets = await db.pets.count_documents({})
    
    # Count by persona
    persona_counts = {}
    async for pet in db.pets.find({}, {"soul.persona": 1}):
        persona = (pet.get("soul", {}) or {}).get("persona", "unknown")
        persona_counts[persona] = persona_counts.get(persona, 0) + 1
    
    # Count by species
    species_counts = {}
    async for pet in db.pets.find({}, {"species": 1}):
        species = pet.get("species", "dog")
        species_counts[species] = species_counts.get(species, 0) + 1
    
    # Upcoming celebrations in next 7 days
    upcoming_7_days = await get_all_upcoming_celebrations(7)
    
    # Upcoming celebrations in next 30 days
    upcoming_30_days = await get_all_upcoming_celebrations(30)
    
    return {
        "total_pets": total_pets,
        "by_persona": persona_counts,
        "by_species": species_counts,
        "celebrations_next_7_days": len(upcoming_7_days.get("celebrations", [])),
        "celebrations_next_30_days": len(upcoming_30_days.get("celebrations", [])),
        "personas_available": list(DOG_PERSONAS.keys())
    }


@admin_router.post("/celebrations/trigger-check")
async def admin_trigger_celebration_check(username: str = Depends(verify_admin)):
    """Manually trigger the celebration reminder check"""
    try:
        reminders_sent = await check_upcoming_celebrations()
        return {
            "message": "Celebration check completed",
            "reminders_sent": reminders_sent,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Check failed: {str(e)}")


@admin_router.get("/celebrations/reminders-log")
async def admin_get_reminders_log(
    username: str = Depends(verify_admin),
    limit: int = 50,
    skip: int = 0
):
    """Get log of sent celebration reminders"""
    reminders = await db.celebration_reminders.find(
        {}, {"_id": 0}
    ).sort("sent_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.celebration_reminders.count_documents({})
    
    return {
        "reminders": reminders,
        "total": total,
        "limit": limit,
        "skip": skip
    }


# ==================== PRODUCT MANAGEMENT ROUTES ====================

@admin_router.get("/products")
async def get_all_products(
    username: str = Depends(verify_admin),
    category: Optional[str] = None,
    limit: int = 200
):
    """Get all products with optional category filter"""
    query = {}
    if category:
        query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
    total = await db.products.count_documents(query)
    
    # Get distinct categories
    categories = await db.products.distinct("category")
    
    return {"products": products, "total": total, "categories": categories}


@admin_router.get("/products/{product_id}")
async def get_product(product_id: str, username: str = Depends(verify_admin)):
    """Get single product by ID"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@admin_router.post("/products")
async def create_product(product: dict, username: str = Depends(verify_admin)):
    """Create a new product"""
    product["id"] = str(uuid.uuid4())
    product["created_at"] = datetime.now(timezone.utc).isoformat()
    product["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.insert_one(product)
    return {"message": "Product created", "id": product["id"]}


@admin_router.put("/products/{product_id}")
async def update_product(product_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update an existing product"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Remove id from updates if present
    updates.pop("id", None)
    updates.pop("_id", None)
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated successfully"}


@admin_router.delete("/products/{product_id}")
async def delete_product(product_id: str, username: str = Depends(verify_admin)):
    """Delete a product"""
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


@admin_router.post("/products/bulk-import")
async def bulk_import_products(products: List[dict], username: str = Depends(verify_admin)):
    """Bulk import products (for initial data migration)"""
    for product in products:
        if "id" not in product:
            product["id"] = str(uuid.uuid4())
        product["created_at"] = datetime.now(timezone.utc).isoformat()
        product["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if products:
        await db.products.insert_many(products)
    
    return {"message": f"Imported {len(products)} products"}


# ==================== SITE CONTENT MANAGEMENT ROUTES ====================

@admin_router.get("/site-content")
async def get_site_content(username: str = Depends(verify_admin)):
    """Get all site content settings"""
    content = await db.site_content.find_one({"type": "main"}, {"_id": 0})
    if not content:
        # Return default content structure
        content = {
            "type": "main",
            "videos": [
                {
                    "id": "1",
                    "title": "Behind the Scenes: Baking with Love",
                    "thumbnail": "https://images.unsplash.com/photo-1612940960267-4549a58fb257?w=600",
                    "description": "Watch how we craft each cake with care in our kitchen",
                    "videoUrl": "https://www.instagram.com/the_doggy_bakery/"
                },
                {
                    "id": "2",
                    "title": "Customer Celebrations",
                    "thumbnail": "https://images.unsplash.com/photo-1537204696486-967f1b7198c8?w=600",
                    "description": "Real celebrations from our happy customers",
                    "videoUrl": "https://www.instagram.com/the_doggy_bakery/"
                },
                {
                    "id": "3",
                    "title": "How to Store Your Cake",
                    "thumbnail": "https://images.unsplash.com/photo-1646157763904-d7d184329c72?w=600",
                    "description": "Tips for keeping treats fresh and delicious",
                    "videoUrl": "https://www.instagram.com/the_doggy_bakery/"
                },
                {
                    "id": "4",
                    "title": "Meet Our Team",
                    "thumbnail": "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=600",
                    "description": "The passionate team behind The Doggy Bakery",
                    "videoUrl": "https://www.instagram.com/the_doggy_bakery/"
                }
            ],
            "heroSlides": [
                {
                    "title": "Unconditional Love",
                    "subtitle": "Deserves Exceptional Treats",
                    "description": "Premium, freshly baked treats crafted with love for your furry family",
                    "image": "https://images.unsplash.com/flagged/photo-1553802922-28e2f719977d?w=1200",
                    "cta": "Explore Cakes"
                },
                {
                    "title": "Meet Mira AI",
                    "subtitle": "Your Celebration Concierge®",
                    "description": "Get personalized recommendations, party ideas, and expert guidance",
                    "image": "https://images.unsplash.com/photo-1537204696486-967f1b7198c8?w=1200",
                    "cta": "Chat with Mira"
                }
            ],
            "bannerText": "Enjoy the convenience of SAME DAY DELIVERY in Mumbai, Bangalore & Gurgaon for all orders placed by 6:00 PM",
            "whatsappNumber": "+91 96631 85747",
            "contactEmail": "woof@thedoggybakery.in"
        }
    return content


@admin_router.put("/site-content")
async def update_site_content(content: dict, username: str = Depends(verify_admin)):
    """Update site content settings"""
    content["type"] = "main"
    content["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.site_content.update_one(
        {"type": "main"},
        {"$set": content},
        upsert=True
    )
    return {"message": "Site content updated successfully"}


@admin_router.put("/site-content/videos")
async def update_videos(videos: List[dict], username: str = Depends(verify_admin)):
    """Update just the videos section"""
    await db.site_content.update_one(
        {"type": "main"},
        {"$set": {"videos": videos, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Videos updated successfully"}


@admin_router.put("/site-content/hero")
async def update_hero_slides(heroSlides: List[dict], username: str = Depends(verify_admin)):
    """Update hero slides"""
    await db.site_content.update_one(
        {"type": "main"},
        {"$set": {"heroSlides": heroSlides, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Hero slides updated successfully"}


# ==================== PUBLIC CONTENT API ====================

# ==================== FAQs CRUD ====================

@admin_router.get("/faqs")
async def get_all_faqs(username: str = Depends(verify_admin)):
    """Get all FAQs for admin"""
    faqs = await db.faqs.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    categories = list(set(f.get("category", "General") for f in faqs))
    return {"faqs": faqs, "categories": categories, "total": len(faqs)}

@admin_router.post("/faqs")
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

@admin_router.put("/faqs/{faq_id}")
async def update_faq(faq_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a FAQ"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.faqs.update_one({"id": faq_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    updated = await db.faqs.find_one({"id": faq_id}, {"_id": 0})
    return {"message": "FAQ updated", "faq": updated}

@admin_router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str, username: str = Depends(verify_admin)):
    """Delete a FAQ"""
    result = await db.faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted"}

@api_router.get("/faqs")
async def get_public_faqs(category: Optional[str] = None):
    """Public endpoint for FAQs"""
    query = {}
    if category:
        query["category"] = category
    faqs = await db.faqs.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    categories = await db.faqs.distinct("category")
    return {"faqs": faqs, "categories": categories}


# ==================== TESTIMONIALS CRUD ====================

@admin_router.get("/testimonials")
async def get_all_testimonials(username: str = Depends(verify_admin)):
    """Get all testimonials for admin"""
    testimonials = await db.testimonials.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"testimonials": testimonials, "total": len(testimonials)}

@admin_router.post("/testimonials")
async def create_testimonial(testimonial: dict, username: str = Depends(verify_admin)):
    """Create a new testimonial"""
    data = {
        "id": f"test-{uuid.uuid4().hex[:8]}",
        "name": testimonial.get("name", ""),
        "location": testimonial.get("location", ""),
        "pet_name": testimonial.get("pet_name", ""),
        "rating": testimonial.get("rating", 5),
        "text": testimonial.get("text", ""),
        "photo_url": testimonial.get("photo_url"),
        "is_featured": testimonial.get("is_featured", False),
        "is_approved": testimonial.get("is_approved", True),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.testimonials.insert_one(data)
    return {"message": "Testimonial created", "testimonial": {k: v for k, v in data.items() if k != "_id"}}

@admin_router.put("/testimonials/{testimonial_id}")
async def update_testimonial(testimonial_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a testimonial"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.testimonials.update_one({"id": testimonial_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    updated = await db.testimonials.find_one({"id": testimonial_id}, {"_id": 0})
    return {"message": "Testimonial updated", "testimonial": updated}

@admin_router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str, username: str = Depends(verify_admin)):
    """Delete a testimonial"""
    result = await db.testimonials.delete_one({"id": testimonial_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Testimonial deleted"}

@api_router.get("/testimonials")
async def get_public_testimonials(featured_only: bool = False):
    """Public endpoint for testimonials"""
    query = {"is_approved": True}
    if featured_only:
        query["is_featured"] = True
    testimonials = await db.testimonials.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"testimonials": testimonials}


# ==================== BLOG/INSIGHTS CRUD ====================

@admin_router.get("/blog-posts")
async def get_all_blog_posts(username: str = Depends(verify_admin)):
    """Get all blog posts for admin"""
    posts = await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"posts": posts, "total": len(posts)}

@admin_router.post("/blog-posts")
async def create_blog_post(post: dict, username: str = Depends(verify_admin)):
    """Create a new blog post"""
    slug = post.get("title", "").lower().replace(" ", "-").replace("'", "")[:50]
    data = {
        "id": f"post-{uuid.uuid4().hex[:8]}",
        "slug": slug,
        "title": post.get("title", ""),
        "excerpt": post.get("excerpt", ""),
        "content": post.get("content", ""),
        "image_url": post.get("image_url"),
        "category": post.get("category", "Tips"),
        "author": post.get("author", "TDB Team"),
        "status": post.get("status", "draft"),  # draft, published
        "is_featured": post.get("is_featured", False),
        "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "published_at": datetime.now(timezone.utc).isoformat() if post.get("status") == "published" else None
    }
    await db.blog_posts.insert_one(data)
    return {"message": "Blog post created", "post": {k: v for k, v in data.items() if k != "_id"}}

@admin_router.put("/blog-posts/{post_id}")
async def update_blog_post(post_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a blog post"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    if updates.get("status") == "published":
        existing = await db.blog_posts.find_one({"id": post_id})
        if existing and not existing.get("published_at"):
            updates["published_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.blog_posts.update_one({"id": post_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    updated = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
    return {"message": "Blog post updated", "post": updated}

@admin_router.delete("/blog-posts/{post_id}")
async def delete_blog_post(post_id: str, username: str = Depends(verify_admin)):
    """Delete a blog post"""
    result = await db.blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "Blog post deleted"}

@api_router.get("/blog-posts")
async def get_public_blog_posts(category: Optional[str] = None, featured_only: bool = False):
    """Public endpoint for blog posts"""
    query = {"status": "published"}
    if category:
        query["category"] = category
    if featured_only:
        query["is_featured"] = True
    posts = await db.blog_posts.find(query, {"_id": 0}).sort("published_at", -1).to_list(50)
    return {"posts": posts}

@api_router.get("/blog-posts/{slug}")
async def get_blog_post_by_slug(slug: str):
    """Get a single blog post by slug"""
    post = await db.blog_posts.find_one(
        {"$or": [{"slug": slug}, {"id": slug}], "status": "published"}, 
        {"_id": 0}
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    # Increment views
    await db.blog_posts.update_one({"id": post["id"]}, {"$inc": {"views": 1}})
    return post


@api_router.get("/content/videos")
async def get_public_videos():
    """Public endpoint for videos (no auth required)"""
    content = await db.site_content.find_one({"type": "main"}, {"_id": 0, "videos": 1})
    if content and "videos" in content:
        return {"videos": content["videos"]}
    # Default videos
    return {"videos": [
        {"id": "1", "title": "Behind the Scenes", "thumbnail": "https://images.unsplash.com/photo-1612940960267-4549a58fb257?w=600", "description": "Watch how we craft each cake", "videoUrl": "https://www.instagram.com/the_doggy_bakery/"},
        {"id": "2", "title": "Customer Celebrations", "thumbnail": "https://images.unsplash.com/photo-1537204696486-967f1b7198c8?w=600", "description": "Real celebrations", "videoUrl": "https://www.instagram.com/the_doggy_bakery/"},
        {"id": "3", "title": "How to Store Your Cake", "thumbnail": "https://images.unsplash.com/photo-1646157763904-d7d184329c72?w=600", "description": "Tips for keeping treats fresh", "videoUrl": "https://www.instagram.com/the_doggy_bakery/"},
        {"id": "4", "title": "Meet Our Team", "thumbnail": "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=600", "description": "The passionate team", "videoUrl": "https://www.instagram.com/the_doggy_bakery/"}
    ]}


@api_router.get("/content/hero")
async def get_public_hero():
    """Public endpoint for hero slides"""
    content = await db.site_content.find_one({"type": "main"}, {"_id": 0, "heroSlides": 1})
    if content and "heroSlides" in content:
        return {"heroSlides": content["heroSlides"]}
    return {"heroSlides": []}


@api_router.get("/products")
async def get_public_products(
    category: Optional[str] = None, 
    pan_india: Optional[bool] = None,
    search: Optional[str] = None
):
    """Public endpoint for products"""
    query = {}
    
    # Search logic
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"name": search_regex},
            {"tags": search_regex},
            {"category": search_regex},
            {"description": search_regex},
            {"sizes.name": search_regex},
            {"flavors.name": search_regex}
        ]
    
    # Special handling for pan-india category
    if category == "pan-india" or pan_india:
        pan_india_query = {
            "$or": [
                {"category": "pan-india"},
                {"is_pan_india_shippable": True},
                {"category": {"$in": ["treats", "nut-butters", "desi-treats", "gift-cards"]}}
            ]
        }
        if query:
            query = {"$and": [query, pan_india_query]}
        else:
            query = pan_india_query
    elif category:
        if query:
            query = {"$and": [query, {"category": category}]}
        else:
            query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).to_list(500)
    return {"products": products}


@api_router.get("/products/{product_id}/related")
async def get_related_products(product_id: str, limit: int = 4):
    """Get products that go well with the specified product"""
    
    # Find the current product
    product = await db.products.find_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"_id": 0}
    )
    
    if not product:
        return {"related": [], "bundles": []}
    
    current_category = product.get("category", "")
    current_price = product.get("price", 0)
    
    # Define complementary categories for upselling
    upsell_map = {
        "cakes": ["treats", "accessories", "bandanas", "party-supplies"],
        "pupcakes": ["treats", "accessories", "bandanas"],
        "dognuts": ["treats", "cakes", "accessories"],
        "treats": ["cakes", "nut-butters", "accessories"],
        "desi-treats": ["cakes", "treats", "accessories"],
        "fresh-meals": ["treats", "supplements", "bowls"],
        "pan-india": ["pan-india", "treats", "nut-butters", "desi-treats"],  # Pan-india products first
        "nut-butters": ["treats", "cakes", "fresh-meals"],
        "cat-treats": ["cat-cakes", "accessories"],
        "accessories": ["treats", "cakes", "bandanas"],
        "hampers": ["cakes", "treats", "accessories"],
    }
    
    # Get complementary categories
    complementary_cats = upsell_map.get(current_category, ["treats", "accessories"])
    
    related_products = []
    
    # For pan-india category, prioritize pan-india shippable products
    if current_category == "pan-india":
        # First get other pan-india products
        pan_india_products = await db.products.find(
            {"category": "pan-india", "id": {"$ne": product_id}},
            {"_id": 0}
        ).limit(limit).to_list(limit)
        related_products.extend(pan_india_products)
        
        # If not enough, add treats and nut-butters (typically pan-india shippable)
        if len(related_products) < limit:
            remaining = limit - len(related_products)
            treats = await db.products.find(
                {"category": {"$in": ["treats", "nut-butters", "desi-treats"]}},
                {"_id": 0}
            ).limit(remaining).to_list(remaining)
            related_products.extend(treats)
    else:
        # Fetch products from complementary categories
        for comp_cat in complementary_cats:
            cat_products = await db.products.find(
                {"category": comp_cat},
                {"_id": 0}
            ).limit(3).to_list(3)
            related_products.extend(cat_products)
    
    # Also get similar products from same category (different price range)
    similar = await db.products.find(
        {
            "category": current_category,
            "id": {"$ne": product_id},
            "price": {"$gte": current_price * 0.5, "$lte": current_price * 1.5}
        },
        {"_id": 0}
    ).limit(2).to_list(2)
    
    # Remove duplicates and limit
    seen_ids = {product_id}
    unique_related = []
    for p in related_products + similar:
        pid = p.get("id") or p.get("shopify_id")
        if pid and pid not in seen_ids:
            seen_ids.add(pid)
            unique_related.append(p)
            if len(unique_related) >= limit:
                break
    
    # Create bundle suggestions
    bundles = []
    if current_category in ["cakes", "pupcakes"]:
        # Celebration bundle
        treat = await db.products.find_one({"category": "treats"}, {"_id": 0})
        bandana = await db.products.find_one({"category": {"$in": ["accessories", "bandanas"]}}, {"_id": 0})
        if treat and bandana:
            bundle_price = current_price + treat.get("price", 0) + bandana.get("price", 0)
            bundles.append({
                "name": "🎉 Celebration Bundle",
                "description": "Complete the pawty!",
                "items": [product, treat, bandana],
                "originalPrice": bundle_price,
                "bundlePrice": int(bundle_price * 0.9),  # 10% discount
                "savings": int(bundle_price * 0.1)
            })
    
    return {
        "related": unique_related,
        "bundles": bundles,
        "category": current_category
    }


# ==================== ADMIN PRODUCT MANAGEMENT ====================

DISPLAY_TAG_OPTIONS = [
    {"id": "best-seller", "label": "🏆 Best Seller", "color": "pink"},
    {"id": "limited", "label": "⏰ Limited Edition", "color": "red"},
    {"id": "selling-fast", "label": "🔥 Selling Fast", "color": "amber"},
    {"id": "discount", "label": "💰 On Discount", "color": "green"},
    {"id": "new-arrival", "label": "✨ New Arrival", "color": "blue"},
    {"id": "staff-pick", "label": "⭐ Staff Pick", "color": "indigo"},
    {"id": "popular", "label": "💜 Popular", "color": "purple"},
    {"id": "seasonal", "label": "🌸 Seasonal", "color": "rose"},
    {"id": "exclusive", "label": "💎 Exclusive", "color": "cyan"}
]

@api_router.get("/admin/products/tag-options")
async def get_display_tag_options():
    """Get available display tag options"""
    return {"tags": DISPLAY_TAG_OPTIONS}

@api_router.put("/admin/products/{product_id}/display-tags")
async def update_product_display_tags(product_id: str, tags: List[str]):
    """Update display tags for a product"""
    result = await db.products.update_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"$set": {"display_tags": tags, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "tags": tags}

@api_router.put("/admin/products/{product_id}/bundle-config")
async def update_product_bundle_config(product_id: str, bundle_config: dict):
    """Update bundle configuration for a product"""
    result = await db.products.update_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"$set": {
            "bundle_type": bundle_config.get("bundle_type"),
            "bundle_includes": bundle_config.get("bundle_includes", {}),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "config": bundle_config}

@api_router.get("/admin/products/{product_id}")
async def get_admin_product_details(product_id: str):
    """Get full product details for admin editing"""
    product = await db.products.find_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"_id": 0}
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"product": product}

@api_router.put("/admin/products/{product_id}")
async def update_admin_product(product_id: str, updates: dict):
    """Update product details from admin"""
    # Sanitize updates - only allow specific fields to be updated
    allowed_fields = [
        "name", "description", "price", "category", "display_tags",
        "bundle_type", "bundle_includes", "options", "available",
        "is_pan_india_shippable"
    ]
    
    sanitized = {k: v for k, v in updates.items() if k in allowed_fields}
    sanitized["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.products.update_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"$set": sanitized}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "updated_fields": list(sanitized.keys())}


# ==================== SEARCH API ====================

async def mongodb_fallback_search_legacy(
    q: str,
    limit: int = 20,
    offset: int = 0,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = None
):
    """Fallback search using MongoDB when Meilisearch is unavailable"""
    search_regex = {"$regex": q, "$options": "i"}
    query = {
        "$or": [
            {"name": search_regex},
            {"description": search_regex},
            {"tags": search_regex},
            {"category": search_regex},
        ]
    }
    
    if category:
        query["category"] = category
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        if "price" in query:
            query["price"]["$lte"] = max_price
        else:
            query["price"] = {"$lte": max_price}
    
    sort_field = [("name", 1)]
    if sort == "price_asc":
        sort_field = [("price", 1)]
    elif sort == "price_desc":
        sort_field = [("price", -1)]
    elif sort == "name_desc":
        sort_field = [("name", -1)]
    
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort(sort_field).skip(offset).limit(limit).to_list(limit)
    
    return {
        "hits": products,
        "query": q,
        "estimatedTotalHits": total,
        "limit": limit,
        "offset": offset,
        "fallback": True
    }


@api_router.get("/search")
async def search_products(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = None,
    collection_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    tags: Optional[str] = None,
    pan_india: Optional[bool] = None,
    autoship: Optional[bool] = None,
    sort: Optional[str] = Query(None, description="Sort by: price_asc, price_desc, name_asc, name_desc"),
):
    """
    Smart search endpoint with typo tolerance, filters, and faceted results
    """
    # Fallback to MongoDB if Meilisearch is not available
    if not search_service or not search_service._initialized:
        return await mongodb_fallback_search_legacy(q, limit, offset, category, min_price, max_price, sort)
    
    # Build filters
    filters = {}
    if category:
        filters["category"] = category
    if collection_id:
        filters["collection_id"] = collection_id
    if min_price is not None:
        filters["min_price"] = min_price
    if max_price is not None:
        filters["max_price"] = max_price
    if tags:
        filters["tags"] = tags.split(",")
    if pan_india:
        filters["is_pan_india"] = True
    if autoship:
        filters["autoship_enabled"] = True
    
    # Build sort
    sort_options = None
    if sort:
        sort_map = {
            "price_asc": ["price:asc"],
            "price_desc": ["price:desc"],
            "name_asc": ["name:asc"],
            "name_desc": ["name:desc"],
        }
        sort_options = sort_map.get(sort)
    
    results = await search_service.search(
        query=q,
        limit=limit,
        offset=offset,
        filters=filters if filters else None,
        sort=sort_options,
    )
    
    return results


@api_router.get("/search/typeahead")
async def search_typeahead(
    q: str = Query(..., min_length=2, description="Search query for typeahead"),
    limit: int = Query(8, ge=1, le=20),
):
    """
    Fast typeahead search for autocomplete in the search bar
    Returns products and collections matching the query
    """
    # Fallback to MongoDB if Meilisearch is not available
    if not search_service or not search_service._initialized:
        search_regex = {"$regex": q, "$options": "i"}
        products = await db.products.find(
            {"$or": [{"name": search_regex}, {"tags": search_regex}, {"category": search_regex}]},
            {"_id": 0, "id": 1, "name": 1, "image": 1, "price": 1, "category": 1}
        ).limit(limit).to_list(limit)
        
        collections = await db.collections.find(
            {"$or": [{"name": search_regex}, {"description": search_regex}]},
            {"_id": 0, "id": 1, "name": 1, "slug": 1, "image": 1}
        ).limit(4).to_list(4)
        
        return {"products": products, "collections": collections, "query": q, "fallback": True}
    
    results = await search_service.typeahead(query=q, limit=limit)
    return results


@api_router.get("/search/stats")
async def get_search_stats():
    """Get search index statistics"""
    if not search_service:
        return {"initialized": False, "error": "Search service not configured"}
    return await search_service.get_stats()


@api_router.post("/search/reindex")
async def reindex_search(credentials: HTTPBasicCredentials = Depends(security)):
    """Reindex all products in the search engine (admin only)"""
    # Verify admin credentials using the centralized verify_admin function
    verify_admin(credentials)
    
    # Fetch all products
    products = await db.products.find({}, {"_id": 0}).to_list(10000)
    
    if products:
        await search_service.index_products_batch(products)
    
    # Index collections too
    collections = await db.collections.find({}, {"_id": 0}).to_list(1000)
    if collections:
        await search_service.index_collections_batch(collections)
    
    return {
        "success": True,
        "products_indexed": len(products),
        "collections_indexed": len(collections)
    }


# ==================== ORDERS API ====================

@api_router.get("/orders/my-orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    """Get orders for the logged-in user"""
    # Match by email (primary) or phone (if available)
    query = {"customer.email": current_user["email"]}
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"orders": orders}


@api_router.post("/orders")
async def create_order(order: dict):
    """Create a new order"""
    order["id"] = str(uuid.uuid4())
    order["created_at"] = datetime.now(timezone.utc).isoformat()
    order["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.orders.insert_one(order)
    
    # Send notification
    try:
        # Generate summary for notification
        items_summary = ", ".join([f"{item['name']} x{item['quantity']}" for item in order.get("items", [])])
        notification_text = f"""🛒 *New Order Received!*

Order ID: {order.get('orderId')}
Customer: {order.get('customer', {}).get('parentName')}
Phone: {order.get('customer', {}).get('phone')}
Pet: {order.get('pet', {}).get('name')} ({order.get('pet', {}).get('breed')})

Items: {items_summary}
Total: ₹{order.get('total')}

City: {order.get('delivery', {}).get('city')}
Special Instructions: {order.get('specialInstructions', 'None')}"""
        
        logger.info(f"New order: {order.get('orderId')}")
        
        # Create admin notification
        await create_admin_notification(
            notification_type="order",
            title=f"🛒 New Order #{order.get('orderId', '')[:8]}",
            message=f"{order.get('customer', {}).get('parentName', 'Customer')} ordered {len(order.get('items', []))} item(s) - ₹{order.get('total', 0)}",
            category="celebrate",
            related_id=order["id"],
            link_to="/admin?tab=orders",
            priority="high" if order.get('total', 0) > 2000 else "normal",
            metadata={
                "order_id": order.get('orderId'),
                "customer_name": order.get('customer', {}).get('parentName'),
                "total": order.get('total'),
                "items_count": len(order.get('items', []))
            }
        )
    except Exception as e:
        logger.error(f"Order notification failed: {e}")
    
    return {"message": "Order created", "orderId": order.get("orderId"), "id": order["id"]}


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order by ID"""
    order = await db.orders.find_one(
        {"$or": [{"id": order_id}, {"orderId": order_id}]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ==================== AUTOSHIP SYSTEM ====================

# Autoship discount logic
def calculate_autoship_discount(order_count: int, original_price: float) -> dict:
    """
    Calculate discount based on autoship order count
    Order 1: 25% off (max ₹300)
    Orders 4-5: 40% off
    Orders 6-7+: 50% off
    """
    if order_count == 1:
        discount_percent = 25
        max_discount = 300
        discount = min(original_price * 0.25, max_discount)
    elif order_count in [4, 5]:
        discount_percent = 40
        discount = original_price * 0.40
    elif order_count >= 6:
        discount_percent = 50
        discount = original_price * 0.50
    else:
        discount_percent = 0
        discount = 0
    
    return {
        "discount_percent": discount_percent,
        "discount_amount": round(discount, 2),
        "final_price": round(original_price - discount, 2),
        "order_count": order_count
    }


@api_router.get("/autoship/my-subscriptions")
async def get_my_autoship_subscriptions(current_user: dict = Depends(get_current_user)):
    """Get all autoship subscriptions for the current user"""
    subscriptions = []
    async for sub in db.autoship_subscriptions.find(
        {"user_email": current_user["email"], "status": {"$ne": "cancelled"}},
        {"_id": 0}
    ):
        # Fetch product details
        product = await db.products.find_one({"id": sub.get("product_id")}, {"_id": 0, "name": 1, "image": 1})
        if product:
            sub["product"] = product
        subscriptions.append(sub)
    
    return {"subscriptions": subscriptions}


@api_router.post("/autoship/create")
async def create_autoship_subscription(
    data: AutoshipCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new autoship subscription"""
    # Get product details
    product = await db.products.find_one({"id": data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.get("autoship_enabled"):
        raise HTTPException(status_code=400, detail="This product is not eligible for Autoship")
    
    # Check if subscription already exists for this product
    existing = await db.autoship_subscriptions.find_one({
        "user_email": current_user["email"],
        "product_id": data.product_id,
        "status": {"$in": ["active", "paused"]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active subscription for this product")
    
    # Calculate first shipment date (based on frequency)
    next_date = datetime.now(timezone.utc) + timedelta(weeks=data.frequency)
    
    subscription = {
        "id": f"auto-{uuid.uuid4().hex[:8]}",
        "user_email": current_user["email"],
        "user_id": current_user.get("id"),
        "product_id": data.product_id,
        "product_name": product["name"],
        "product_image": product.get("image"),
        "variant": data.variant,
        "price": product.get("price", 0),
        "frequency": data.frequency,
        "status": "active",
        "order_count": 0,
        "next_shipment_date": next_date.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "delivery_address": data.delivery_address
    }
    
    await db.autoship_subscriptions.insert_one(subscription)
    subscription.pop("_id", None)
    
    return {"message": "Autoship subscription created", "subscription": subscription}


@api_router.put("/autoship/{subscription_id}/pause")
async def pause_autoship(subscription_id: str, current_user: dict = Depends(get_current_user)):
    """Pause an autoship subscription"""
    result = await db.autoship_subscriptions.update_one(
        {"id": subscription_id, "user_email": current_user["email"], "status": "active"},
        {"$set": {"status": "paused", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found or already paused")
    return {"message": "Subscription paused"}


@api_router.put("/autoship/{subscription_id}/resume")
async def resume_autoship(subscription_id: str, current_user: dict = Depends(get_current_user)):
    """Resume a paused autoship subscription"""
    sub = await db.autoship_subscriptions.find_one(
        {"id": subscription_id, "user_email": current_user["email"], "status": "paused"}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found or not paused")
    
    # Calculate next shipment date from today
    next_date = datetime.now(timezone.utc) + timedelta(weeks=sub.get("frequency", 4))
    
    await db.autoship_subscriptions.update_one(
        {"id": subscription_id},
        {"$set": {
            "status": "active",
            "next_shipment_date": next_date.isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Subscription resumed", "next_shipment_date": next_date.isoformat()}


@api_router.put("/autoship/{subscription_id}/cancel")
async def cancel_autoship(subscription_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel an autoship subscription"""
    result = await db.autoship_subscriptions.update_one(
        {"id": subscription_id, "user_email": current_user["email"]},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Subscription cancelled"}


@api_router.put("/autoship/{subscription_id}/update")
async def update_autoship(
    subscription_id: str,
    frequency: Optional[int] = None,
    next_shipment_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update autoship frequency or next shipment date"""
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if frequency:
        update_data["frequency"] = frequency
    if next_shipment_date:
        update_data["next_shipment_date"] = next_shipment_date
    
    result = await db.autoship_subscriptions.update_one(
        {"id": subscription_id, "user_email": current_user["email"]},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Subscription updated"}


@api_router.put("/autoship/{subscription_id}/skip")
async def skip_next_autoship(subscription_id: str, current_user: dict = Depends(get_current_user)):
    """Skip the next autoship delivery"""
    sub = await db.autoship_subscriptions.find_one(
        {"id": subscription_id, "user_email": current_user["email"], "status": "active"}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found or not active")
    
    # Move next shipment date by one frequency period
    current_next = datetime.fromisoformat(sub.get("next_shipment_date", datetime.now(timezone.utc).isoformat()))
    new_next = current_next + timedelta(weeks=sub.get("frequency", 4))
    
    await db.autoship_subscriptions.update_one(
        {"id": subscription_id},
        {"$set": {"next_shipment_date": new_next.isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Next delivery skipped", "new_next_shipment_date": new_next.isoformat()}


# Admin Autoship Dashboard
@admin_router.get("/autoship")
async def get_all_autoship_subscriptions(
    status: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Get all autoship subscriptions for admin dashboard"""
    query = {}
    if status:
        query["status"] = status
    
    subscriptions = []
    async for sub in db.autoship_subscriptions.find(query, {"_id": 0}).sort("created_at", -1):
        # Get user info
        user = await db.users.find_one({"email": sub.get("user_email")}, {"_id": 0, "name": 1, "phone": 1})
        if user:
            sub["customer_name"] = user.get("name", "Unknown")
            sub["customer_phone"] = user.get("phone", "")
        subscriptions.append(sub)
    
    # Get stats
    active_count = await db.autoship_subscriptions.count_documents({"status": "active"})
    paused_count = await db.autoship_subscriptions.count_documents({"status": "paused"})
    total_revenue = 0  # Could calculate from orders tagged as AUTOSHIP
    
    return {
        "subscriptions": subscriptions,
        "stats": {
            "active": active_count,
            "paused": paused_count,
            "total": len(subscriptions)
        }
    }


@admin_router.put("/autoship/{subscription_id}/status")
async def admin_update_autoship_status(
    subscription_id: str,
    new_status: str,
    username: str = Depends(verify_admin)
):
    """Admin update subscription status"""
    if new_status not in ["active", "paused", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": username
    }
    
    # If resuming, calculate new next shipment date
    if new_status == "active":
        sub = await db.autoship_subscriptions.find_one({"id": subscription_id})
        if sub:
            next_date = datetime.now(timezone.utc) + timedelta(weeks=sub.get("frequency", 4))
            update_data["next_shipment_date"] = next_date.isoformat()
    
    result = await db.autoship_subscriptions.update_one(
        {"id": subscription_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Log the change
    await db.autoship_logs.insert_one({
        "subscription_id": subscription_id,
        "action": f"status_changed_to_{new_status}",
        "changed_by": username,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"Subscription status updated to {new_status}"}


# ==================== ABANDONED CART SYSTEM ====================

class CartItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    variant: Optional[str] = None
    image: Optional[str] = None

class CartSnapshot(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    items: List[CartItem]
    subtotal: float
    
@api_router.post("/cart/snapshot")
async def save_cart_snapshot(cart: CartSnapshot):
    """Save a cart snapshot for abandoned cart tracking"""
    try:
        cart_data = cart.model_dump()
        cart_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        cart_data["status"] = "active"
        cart_data["reminders_sent"] = 0
        
        # Upsert based on session_id or user_id
        filter_query = {"session_id": cart.session_id}
        if cart.user_id:
            filter_query = {"$or": [{"session_id": cart.session_id}, {"user_id": cart.user_id}]}
        
        existing = await db.abandoned_carts.find_one(filter_query)
        
        if existing:
            # Update existing cart
            await db.abandoned_carts.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "items": cart_data["items"],
                    "subtotal": cart_data["subtotal"],
                    "updated_at": cart_data["updated_at"],
                    "email": cart_data.get("email") or existing.get("email"),
                    "phone": cart_data.get("phone") or existing.get("phone"),
                    "name": cart_data.get("name") or existing.get("name"),
                    "status": "active"
                }}
            )
            return {"message": "Cart updated", "id": str(existing["_id"])}
        else:
            # Create new cart
            cart_data["created_at"] = cart_data["updated_at"]
            cart_data["id"] = f"cart-{uuid.uuid4().hex[:12]}"
            await db.abandoned_carts.insert_one(cart_data)
            return {"message": "Cart saved", "id": cart_data["id"]}
    except Exception as e:
        logger.error(f"Error saving cart snapshot: {e}")
        raise HTTPException(status_code=500, detail="Failed to save cart")


@api_router.post("/cart/capture-email")
async def capture_cart_email(session_id: str, email: str, name: Optional[str] = None):
    """Capture email for abandoned cart recovery"""
    try:
        result = await db.abandoned_carts.update_one(
            {"session_id": session_id},
            {"$set": {
                "email": email,
                "name": name,
                "email_captured_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.modified_count == 0:
            # Create new entry for email capture
            await db.abandoned_carts.insert_one({
                "id": f"cart-{uuid.uuid4().hex[:12]}",
                "session_id": session_id,
                "email": email,
                "name": name,
                "items": [],
                "subtotal": 0,
                "status": "email_captured",
                "email_captured_at": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "reminders_sent": 0
            })
        
        return {"message": "Email captured", "email": email}
    except Exception as e:
        logger.error(f"Error capturing email: {e}")
        raise HTTPException(status_code=500, detail="Failed to capture email")


@api_router.post("/cart/convert/{session_id}")
async def mark_cart_converted(session_id: str, order_id: str):
    """Mark a cart as converted (order placed)"""
    await db.abandoned_carts.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": "converted",
            "order_id": order_id,
            "converted_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Cart marked as converted"}


async def check_abandoned_carts():
    """Check for abandoned carts and send recovery emails"""
    try:
        logger.info("Checking abandoned carts...")
        now = datetime.now(timezone.utc)
        
        # Find carts that:
        # - Have items
        # - Have email
        # - Status is active
        # - Updated more than 1 hour ago
        one_hour_ago = (now - timedelta(hours=1)).isoformat()
        twenty_four_hours_ago = (now - timedelta(hours=24)).isoformat()
        seventy_two_hours_ago = (now - timedelta(hours=72)).isoformat()
        
        # Get abandoned carts eligible for reminders
        abandoned_carts = await db.abandoned_carts.find({
            "status": "active",
            "email": {"$exists": True, "$ne": None},
            "items": {"$exists": True, "$ne": []},
            "updated_at": {"$lt": one_hour_ago}
        }).to_list(100)
        
        reminders_sent = 0
        
        for cart in abandoned_carts:
            cart_id = str(cart.get("_id"))
            email = cart.get("email")
            name = cart.get("name", "there")
            items = cart.get("items", [])
            subtotal = cart.get("subtotal", 0)
            reminders_already_sent = cart.get("reminders_sent", 0)
            updated_at = cart.get("updated_at", "")
            
            # Determine which reminder to send based on timing
            reminder_type = None
            
            if reminders_already_sent == 0 and updated_at < one_hour_ago:
                reminder_type = "first"  # 1 hour reminder
            elif reminders_already_sent == 1 and updated_at < twenty_four_hours_ago:
                reminder_type = "second"  # 24 hour reminder
            elif reminders_already_sent == 2 and updated_at < seventy_two_hours_ago:
                reminder_type = "final"  # 72 hour final reminder with discount
            
            if reminder_type and RESEND_API_KEY:
                # Rate limit: wait 1 second between emails to avoid Resend rate limits
                if reminders_sent > 0:
                    await asyncio.sleep(1.0)
                    
                success = await send_abandoned_cart_email(
                    to_email=email,
                    name=name,
                    items=items,
                    subtotal=subtotal,
                    reminder_type=reminder_type,
                    cart_id=cart.get("id", cart_id)
                )
                
                if success:
                    reminders_sent += 1
                    await db.abandoned_carts.update_one(
                        {"_id": cart["_id"]},
                        {
                            "$inc": {"reminders_sent": 1},
                            "$set": {f"reminder_{reminder_type}_sent_at": now.isoformat()}
                        }
                    )
                    
                    # Log the reminder
                    await db.abandoned_cart_reminders.insert_one({
                        "cart_id": cart.get("id", cart_id),
                        "email": email,
                        "reminder_type": reminder_type,
                        "items_count": len(items),
                        "subtotal": subtotal,
                        "sent_at": now.isoformat()
                    })
        
        logger.info(f"Abandoned cart check complete. Sent {reminders_sent} reminders.")
        return reminders_sent
        
    except Exception as e:
        logger.error(f"Error checking abandoned carts: {e}")
        return 0


async def send_abandoned_cart_email(to_email: str, name: str, items: list, 
                                     subtotal: float, reminder_type: str, cart_id: str) -> bool:
    """Send abandoned cart recovery email"""
    try:
        # Subject lines based on reminder type
        subjects = {
            "first": "🛒 You left something behind at The Doggy Bakery!",
            "second": "🐾 Your pup is still waiting! Complete your order",
            "final": "🎁 Final reminder + 10% OFF your cart!"
        }
        
        subject = subjects.get(reminder_type, subjects["first"])
        
        # Build items HTML
        items_html = ""
        for item in items[:5]:  # Show max 5 items
            items_html += f'''
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        {f'<img src="{item.get("image")}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">' if item.get("image") else ''}
                        <div>
                            <strong>{item.get("name", "Product")}</strong>
                            {f'<br><small style="color: #6b7280;">{item.get("variant")}</small>' if item.get("variant") else ''}
                        </div>
                    </div>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                    {item.get("quantity", 1)}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ₹{item.get("price", 0):,.0f}
                </td>
            </tr>
            '''
        
        # Discount code for final reminder
        discount_section = ""
        if reminder_type == "final":
            discount_section = '''
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400e;">🎉 Special Offer Just For You!</p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #78350f;">Use code: <span style="background: #fff; padding: 5px 15px; border-radius: 8px; border: 2px dashed #f59e0b;">COMEBACK10</span></p>
                <p style="margin: 10px 0 0 0; color: #92400e;">Get 10% off your order - expires in 24 hours!</p>
            </div>
            '''
        
        # Urgency messages based on type
        urgency_messages = {
            "first": "Your carefully selected treats are waiting! Don't let them slip away.",
            "second": "Your furry friend deserves these goodies! We're holding your cart for you.",
            "final": "This is your last chance to grab these treats with a special discount!"
        }
        
        html_content = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .header {{ background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ background: #fff; padding: 30px; }}
                .cta-button {{ display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; }}
                .footer {{ background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🐾 The Doggy Bakery</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Don't forget your treats!</p>
                </div>
                <div class="content">
                    <h2 style="color: #9333ea;">Hi {name}! 👋</h2>
                    
                    <p>{urgency_messages.get(reminder_type, urgency_messages["first"])}</p>
                    
                    {discount_section}
                    
                    <h3 style="color: #9333ea;">Your Cart:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f9fafb;">
                                <th style="padding: 10px; text-align: left;">Product</th>
                                <th style="padding: 10px; text-align: center;">Qty</th>
                                <th style="padding: 10px; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                        <tfoot>
                            <tr style="font-weight: bold;">
                                <td colspan="2" style="padding: 15px; text-align: right;">Subtotal:</td>
                                <td style="padding: 15px; text-align: right; color: #9333ea; font-size: 18px;">₹{subtotal:,.0f}</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://thedoggycompany.in/checkout" class="cta-button">
                            Complete Your Order 🛒
                        </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        Questions? Chat with Mira, our Concierge®, or contact us at woof@thedoggybakery.com
                    </p>
                </div>
                <div class="footer">
                    <p>The Doggy Bakery | Baking happiness for your furry friends</p>
                    <p>📞 +91 96631 85747 | 📧 woof@thedoggybakery.com</p>
                    <p style="font-size: 11px; color: #9ca3af;">
                        <a href="https://thedoggycompany.in/unsubscribe?cart={cart_id}" style="color: #9333ea;">Unsubscribe from cart reminders</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        '''
        
        params = {
            "from": f"The Doggy Bakery <{SENDER_EMAIL}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        
        email_response = resend.Emails.send(params)
        logger.info(f"Abandoned cart email ({reminder_type}) sent to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send abandoned cart email: {e}")
        return False


# Add abandoned cart checker to scheduler
def setup_abandoned_cart_scheduler():
    """Set up the abandoned cart check job"""
    scheduler.add_job(
        check_abandoned_carts,
        CronTrigger(minute='*/30'),  # Run every 30 minutes
        id="abandoned_cart_check",
        replace_existing=True
    )
    logger.info("Abandoned cart scheduler added (runs every 30 minutes)")

@admin_router.get("/orders")
async def get_all_orders(
    username: str = Depends(verify_admin),
    status: Optional[str] = None,
    city: Optional[str] = None,
    email: Optional[str] = None,
    limit: int = 100
):
    """Get all orders with filtering"""
    query = {}
    if status:
        query["status"] = status
    if city:
        query["delivery.city"] = city
    if email:
        query["customer.email"] = email
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    
    # Calculate stats
    pending = await db.orders.count_documents({"status": "pending"})
    confirmed = await db.orders.count_documents({"status": "confirmed"})
    delivered = await db.orders.count_documents({"status": "delivered"})
    
    return {
        "orders": orders,
        "total": total,
        "stats": {
            "pending": pending,
            "confirmed": confirmed,
            "delivered": delivered
        }
    }


@admin_router.get("/orders/{order_id}")
async def get_order_detail(order_id: str, username: str = Depends(verify_admin)):
    """Get order details"""
    order = await db.orders.find_one(
        {"$or": [{"id": order_id}, {"orderId": order_id}]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@admin_router.put("/orders/{order_id}")
async def update_order(order_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update order status"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.orders.update_one(
        {"$or": [{"id": order_id}, {"orderId": order_id}]},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order updated"}


# ==================== ADMIN ABANDONED CARTS ====================

@admin_router.get("/abandoned-carts")
async def get_abandoned_carts(
    username: str = Depends(verify_admin),
    status: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get all abandoned carts with stats"""
    query = {}
    if status:
        query["status"] = status
    
    carts = await db.abandoned_carts.find(
        query, {"_id": 0}
    ).sort("updated_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.abandoned_carts.count_documents(query)
    active = await db.abandoned_carts.count_documents({"status": "active"})
    converted = await db.abandoned_carts.count_documents({"status": "converted"})
    
    # Calculate total potential revenue
    total_value = 0
    for cart in carts:
        if cart.get("status") == "active":
            total_value += cart.get("subtotal", 0)
    
    return {
        "carts": carts,
        "total": total,
        "stats": {
            "active": active,
            "converted": converted,
            "potential_revenue": total_value
        }
    }


@admin_router.get("/abandoned-carts/reminders")
async def get_cart_reminders_log(
    username: str = Depends(verify_admin),
    limit: int = 50,
    skip: int = 0
):
    """Get log of sent abandoned cart reminders"""
    reminders = await db.abandoned_cart_reminders.find(
        {}, {"_id": 0}
    ).sort("sent_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.abandoned_cart_reminders.count_documents({})
    
    return {
        "reminders": reminders,
        "total": total
    }


@admin_router.post("/abandoned-carts/trigger-check")
async def admin_trigger_cart_check(username: str = Depends(verify_admin)):
    """Manually trigger abandoned cart check"""
    try:
        reminders_sent = await check_abandoned_carts()
        return {
            "message": "Abandoned cart check completed",
            "reminders_sent": reminders_sent,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Check failed: {str(e)}")


@admin_router.delete("/abandoned-carts/{cart_id}")
async def delete_abandoned_cart(cart_id: str, username: str = Depends(verify_admin)):
    """Delete an abandoned cart record"""
    result = await db.abandoned_carts.delete_one(
        {"$or": [{"id": cart_id}, {"session_id": cart_id}]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart not found")
    return {"message": "Cart deleted"}


# ==================== ADMIN MEMBERS ====================

@admin_router.get("/members")
async def get_all_customers(username: str = Depends(verify_admin)):
    """Get all customers (Registered Members + Guest Buyers)"""
    # 1. Get registered users
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    user_emails = {u["email"] for u in users if "email" in u}
    
    # 2. Get distinct guest emails from orders
    # Note: Mongo distinct doesn't work well with async motor in one line sometimes, using aggregation
    pipeline = [
        {"$group": {"_id": "$customer.email", "doc": {"$first": "$$ROOT"}}}
    ]
    guest_orders = await db.orders.aggregate(pipeline).to_list(1000)
    
    guests = []
    for g in guest_orders:
        email = g.get("_id")
        if email and email not in user_emails:
            # Create a guest customer object derived from order
            order_doc = g.get("doc", {})
            customer_info = order_doc.get("customer", {})
            
            guests.append({
                "id": f"guest-{email}",
                "email": email,
                "name": customer_info.get("parentName") or customer_info.get("name") or "Guest",
                "phone": customer_info.get("phone"),
                "membership_tier": "guest",
                "created_at": order_doc.get("created_at"),
                "is_guest": True
            })
            user_emails.add(email) # Prevent dupes if multiples
            
    # Combine and sort
    all_customers = users + guests
    all_customers.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Stats
    total = len(all_customers)
    free_count = sum(1 for u in all_customers if u.get("membership_tier") == "free")
    pawsome_count = sum(1 for u in all_customers if u.get("membership_tier") == "pawsome")
    premium_count = sum(1 for u in all_customers if u.get("membership_tier") == "premium")
    vip_count = sum(1 for u in all_customers if u.get("membership_tier") == "vip")
    guest_count = len(guests)
    
    return {
        "members": all_customers,
        "total": total,
        "stats": {
            "free": free_count,
            "pawsome": pawsome_count,
            "premium": premium_count,
            "vip": vip_count,
            "guest": guest_count
        }
    }


@admin_router.put("/members/{user_id}")
async def update_member(user_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update member details/tier"""
    allowed = ["membership_tier", "membership_expires", "name", "phone"]
    filtered = {k: v for k, v in updates.items() if k in allowed}
    
    result = await db.users.update_one(
        {"$or": [{"id": user_id}, {"email": user_id}]},
        {"$set": filtered}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member updated"}


# ==================== LOYALTY POINTS SYSTEM ====================

# Points configuration
POINTS_PER_RUPEE = 1  # 1 point per ₹10 spent = 0.1 points per rupee
POINTS_REDEMPTION_VALUE = 0.5  # 1 point = ₹0.50 discount
MEMBERSHIP_POINT_MULTIPLIERS = {
    "free": 1.0,
    "pawsome": 1.5,
    "premium": 2.0,
    "vip": 3.0
}

@api_router.get("/loyalty/balance")
async def get_loyalty_balance(user_id: str):
    """Get user's loyalty points balance"""
    user = await db.users.find_one(
        {"$or": [{"id": user_id}, {"email": user_id}]},
        {"_id": 0, "loyalty_points": 1, "total_points_earned": 1, "total_points_redeemed": 1, "membership_tier": 1}
    )
    
    if not user:
        return {"points": 0, "total_earned": 0, "total_redeemed": 0, "tier": "free", "multiplier": 1.0}
    
    tier = user.get("membership_tier", "free")
    return {
        "points": user.get("loyalty_points", 0),
        "total_earned": user.get("total_points_earned", 0),
        "total_redeemed": user.get("total_points_redeemed", 0),
        "tier": tier,
        "multiplier": MEMBERSHIP_POINT_MULTIPLIERS.get(tier, 1.0),
        "redemption_value": POINTS_REDEMPTION_VALUE
    }


@api_router.post("/loyalty/earn")
async def earn_loyalty_points(user_id: str, order_total: float, order_id: str):
    """Award loyalty points for a purchase"""
    user = await db.users.find_one({"$or": [{"id": user_id}, {"email": user_id}]})
    
    if not user:
        return {"points_earned": 0, "message": "User not found"}
    
    tier = user.get("membership_tier", "free")
    multiplier = MEMBERSHIP_POINT_MULTIPLIERS.get(tier, 1.0)
    
    # Calculate points: (order_total / 10) * multiplier
    base_points = int(order_total / 10)
    points_earned = int(base_points * multiplier)
    
    # Update user's points
    await db.users.update_one(
        {"$or": [{"id": user_id}, {"email": user_id}]},
        {
            "$inc": {
                "loyalty_points": points_earned,
                "total_points_earned": points_earned
            }
        }
    )
    
    # Log the transaction
    await db.loyalty_transactions.insert_one({
        "id": f"lpt-{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "order_id": order_id,
        "type": "earn",
        "points": points_earned,
        "order_total": order_total,
        "multiplier": multiplier,
        "tier": tier,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "points_earned": points_earned,
        "base_points": base_points,
        "multiplier": multiplier,
        "new_balance": user.get("loyalty_points", 0) + points_earned
    }


@api_router.post("/loyalty/redeem")
async def redeem_loyalty_points(user_id: str, points_to_redeem: int):
    """Redeem loyalty points for discount"""
    user = await db.users.find_one({"$or": [{"id": user_id}, {"email": user_id}]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_points = user.get("loyalty_points", 0)
    
    if points_to_redeem > current_points:
        raise HTTPException(status_code=400, detail=f"Insufficient points. You have {current_points} points.")
    
    if points_to_redeem < 100:
        raise HTTPException(status_code=400, detail="Minimum 100 points required for redemption")
    
    # Calculate discount value
    discount_value = points_to_redeem * POINTS_REDEMPTION_VALUE
    
    # Deduct points
    await db.users.update_one(
        {"$or": [{"id": user_id}, {"email": user_id}]},
        {
            "$inc": {
                "loyalty_points": -points_to_redeem,
                "total_points_redeemed": points_to_redeem
            }
        }
    )
    
    # Log the transaction
    await db.loyalty_transactions.insert_one({
        "id": f"lpt-{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "redeem",
        "points": -points_to_redeem,
        "discount_value": discount_value,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "points_redeemed": points_to_redeem,
        "discount_value": discount_value,
        "new_balance": current_points - points_to_redeem
    }


@admin_router.get("/loyalty/stats")
async def get_loyalty_stats(username: str = Depends(verify_admin)):
    """Get loyalty program statistics"""
    # Get all users with points
    users_with_points = await db.users.find(
        {"loyalty_points": {"$gt": 0}},
        {"_id": 0, "name": 1, "email": 1, "loyalty_points": 1, "total_points_earned": 1, "membership_tier": 1}
    ).sort("loyalty_points", -1).to_list(100)
    
    # Calculate totals
    total_points_in_circulation = sum(u.get("loyalty_points", 0) for u in users_with_points)
    total_points_ever_earned = await db.users.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$total_points_earned"}}}
    ]).to_list(1)
    total_earned = total_points_ever_earned[0]["total"] if total_points_ever_earned else 0
    
    # Recent transactions
    recent_transactions = await db.loyalty_transactions.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {
        "total_points_in_circulation": total_points_in_circulation,
        "total_points_ever_earned": total_earned,
        "potential_liability": total_points_in_circulation * POINTS_REDEMPTION_VALUE,
        "users_with_points": len(users_with_points),
        "top_users": users_with_points[:20],
        "recent_transactions": recent_transactions,
        "config": {
            "points_per_10_rupees": 1,
            "redemption_value": POINTS_REDEMPTION_VALUE,
            "multipliers": MEMBERSHIP_POINT_MULTIPLIERS
        }
    }


@admin_router.post("/loyalty/adjust")
async def adjust_user_points(user_id: str, points: int, reason: str, username: str = Depends(verify_admin)):
    """Manually adjust a user's loyalty points (admin only)"""
    user = await db.users.find_one({"$or": [{"id": user_id}, {"email": user_id}]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"$or": [{"id": user_id}, {"email": user_id}]},
        {"$inc": {"loyalty_points": points}}
    )
    
    await db.loyalty_transactions.insert_one({
        "id": f"lpt-{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "adjustment",
        "points": points,
        "reason": reason,
        "adjusted_by": username,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"Adjusted {points} points for user", "new_balance": user.get("loyalty_points", 0) + points}


# ==================== DISCOUNT CODES SYSTEM ====================

@admin_router.get("/discount-codes")
async def get_all_discount_codes(username: str = Depends(verify_admin)):
    """Get all discount codes"""
    codes = await db.discount_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    active_count = sum(1 for c in codes if c.get("is_active", True))
    total_uses = sum(c.get("times_used", 0) for c in codes)
    
    return {
        "codes": codes,
        "total": len(codes),
        "active": active_count,
        "total_uses": total_uses
    }


@admin_router.post("/discount-codes")
async def create_discount_code(code_data: dict, username: str = Depends(verify_admin)):
    """Create a new discount code"""
    code = code_data.get("code", "").upper().strip()
    
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")
    
    # Check if code already exists
    existing = await db.discount_codes.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail="Code already exists")
    
    discount_code = {
        "id": f"disc-{uuid.uuid4().hex[:8]}",
        "code": code,
        "type": code_data.get("type", "percentage"),  # percentage or fixed
        "value": float(code_data.get("value", 10)),  # 10% or ₹10
        "min_order": float(code_data.get("min_order", 0)),
        "max_discount": float(code_data.get("max_discount", 0)) if code_data.get("max_discount") else None,
        "usage_limit": int(code_data.get("usage_limit", 0)) if code_data.get("usage_limit") else None,
        "times_used": 0,
        "is_active": code_data.get("is_active", True),
        "valid_from": code_data.get("valid_from") or datetime.now(timezone.utc).isoformat(),
        "valid_until": code_data.get("valid_until"),
        "description": code_data.get("description", ""),
        "created_by": username,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.discount_codes.insert_one(discount_code)
    return {"message": "Discount code created", "code": {k: v for k, v in discount_code.items() if k != "_id"}}


@admin_router.put("/discount-codes/{code_id}")
async def update_discount_code(code_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a discount code"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates["updated_by"] = username
    
    result = await db.discount_codes.update_one(
        {"$or": [{"id": code_id}, {"code": code_id.upper()}]},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Discount code not found")
    
    return {"message": "Discount code updated"}


@admin_router.delete("/discount-codes/{code_id}")
async def delete_discount_code(code_id: str, username: str = Depends(verify_admin)):
    """Delete a discount code"""
    result = await db.discount_codes.delete_one(
        {"$or": [{"id": code_id}, {"code": code_id.upper()}]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Discount code not found")
    
    return {"message": "Discount code deleted"}


@api_router.post("/discount-codes/validate")
async def validate_discount_code(code: str, order_total: float):
    """Validate and calculate discount for a code"""
    code = code.upper().strip()
    
    discount_code = await db.discount_codes.find_one({"code": code}, {"_id": 0})
    
    if not discount_code:
        raise HTTPException(status_code=404, detail="Invalid discount code")
    
    if not discount_code.get("is_active", True):
        raise HTTPException(status_code=400, detail="This code is no longer active")
    
    # Check validity dates
    now = datetime.now(timezone.utc).isoformat()
    if discount_code.get("valid_from") and now < discount_code["valid_from"]:
        raise HTTPException(status_code=400, detail="This code is not yet valid")
    if discount_code.get("valid_until") and now > discount_code["valid_until"]:
        raise HTTPException(status_code=400, detail="This code has expired")
    
    # Check usage limit
    if discount_code.get("usage_limit") and discount_code.get("times_used", 0) >= discount_code["usage_limit"]:
        raise HTTPException(status_code=400, detail="This code has reached its usage limit")
    
    # Check minimum order
    if order_total < discount_code.get("min_order", 0):
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum order of ₹{discount_code['min_order']} required for this code"
        )
    
    # Calculate discount
    if discount_code["type"] == "percentage":
        discount = order_total * (discount_code["value"] / 100)
        if discount_code.get("max_discount") and discount > discount_code["max_discount"]:
            discount = discount_code["max_discount"]
    else:  # fixed
        discount = discount_code["value"]
    
    # Don't exceed order total
    if discount > order_total:
        discount = order_total
    
    return {
        "valid": True,
        "code": code,
        "type": discount_code["type"],
        "value": discount_code["value"],
        "discount_amount": round(discount, 2),
        "final_total": round(order_total - discount, 2),
        "description": discount_code.get("description", "")
    }


@api_router.post("/discount-codes/apply")
async def apply_discount_code(code: str, order_id: str):
    """Record that a discount code was used"""
    code = code.upper().strip()
    
    result = await db.discount_codes.update_one(
        {"code": code},
        {"$inc": {"times_used": 1}}
    )
    
    # Log usage
    await db.discount_code_usage.insert_one({
        "code": code,
        "order_id": order_id,
        "used_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Discount code applied"}


# ==================== SCHEDULED SYNC (for cron) ====================

@api_router.post("/cron/sync-products")
async def cron_sync_products(secret: str):
    """Endpoint for automated product sync (call from cron job)
    
    Set up cron with: curl -X POST "https://yoursite.com/api/cron/sync-products?secret=YOUR_SECRET"
    """
    CRON_SECRET = os.environ.get("CRON_SECRET", "midnight-sync-tdb-2025")
    
    if secret != CRON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")
    
    try:
        logger.info("Starting scheduled Shopify sync...")
        shopify_products = await fetch_shopify_products()
        
        synced = 0
        for sp in shopify_products:
            transformed = transform_shopify_product(sp)
            await db.products.update_one(
                {"shopify_id": sp["id"]},
                {"$set": transformed},
                upsert=True
            )
            synced += 1
        
        await db.sync_logs.insert_one({
            "type": "shopify_cron",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_synced": synced,
            "status": "success"
        })
        
        logger.info(f"Scheduled sync completed: {synced} products")
        return {"message": "Sync completed", "synced": synced}
        
    except Exception as e:
        logger.error(f"Scheduled sync failed: {e}")
        await db.sync_logs.insert_one({
            "type": "shopify_cron",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "failed",
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/cleanup-mock-products")
async def cleanup_mock_products(credentials: HTTPBasicCredentials = Depends(verify_admin)):
    """Remove mock products that don't have shopify_id, keeping only real Shopify-synced products"""
    try:
        # Delete products that don't have a shopify_id field or have mock-style IDs
        result = await db.products.delete_many({
            "$or": [
                {"shopify_id": {"$exists": False}},
                {"id": {"$regex": "^(bc-|cake-|treat-|cat-|frozen-|meal-|acc-)"}}
            ]
        })
        
        deleted_count = result.deleted_count
        
        # Count remaining products
        remaining = await db.products.count_documents({})
        
        logger.info(f"Cleaned up {deleted_count} mock products. {remaining} Shopify products remaining.")
        
        return {
            "message": "Mock products cleaned up",
            "deleted": deleted_count,
            "remaining": remaining
        }
    except Exception as e:
        logger.error(f"Failed to cleanup mock products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== USER & MEMBERSHIP ROUTES ====================
# NOTE: Auth routes (register, login, google/session, logout, me) have been moved to auth_routes.py

@api_router.post("/membership/upgrade")
async def upgrade_membership(email: str, upgrade: MembershipUpgrade):
    """Upgrade user membership (simulated - would connect to payment)"""
    if upgrade.tier not in ["pawsome", "premium", "vip"]:
        raise HTTPException(status_code=400, detail="Invalid tier")
    
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Set expiration to 30 days from now (for demo)
    expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    
    await db.users.update_one(
        {"email": email},
        {"$set": {
            "membership_tier": upgrade.tier,
            "membership_expires": expires,
            "chat_count_today": 0  # Reset daily count
        }}
    )
    
    return {
        "message": f"Successfully upgraded to {upgrade.tier}!",
        "tier": upgrade.tier,
        "expires": expires
    }


@api_router.get("/mira/access")
async def check_mira_access_endpoint(email: Optional[str] = None, session_id: Optional[str] = None):
    """Check Mira access for current user/session"""
    return await check_mira_access(email, session_id)


# ==================== PET PROFILE ROUTES ====================

@api_router.get("/pets/personas")
async def get_pet_personas():
    """Get all available dog persona types"""
    return {"personas": DOG_PERSONAS}


@api_router.get("/pets/occasions")
async def get_celebration_occasions():
    """Get all available celebration occasions"""
    return {"occasions": CELEBRATION_OCCASIONS}


@api_router.post("/pets")
async def create_pet_profile(pet: PetProfileCreate):
    """Create a new pet profile"""
    pet_id = f"pet-{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    pet_data = {
        "id": pet_id,
        **pet.model_dump(),
        "achievements": [],
        "order_history": [],
        "created_at": now,
        "updated_at": now
    }
    
    # Auto-add birthday and gotcha day to celebrations if dates provided
    celebrations = list(pet.celebrations) if pet.celebrations else []
    
    if pet.birth_date and not any(c.occasion == "birthday" for c in celebrations):
        celebrations.append(PetCelebration(
            occasion="birthday",
            date=pet.birth_date,
            is_recurring=True
        ))
    
    if pet.gotcha_date and not any(c.occasion == "gotcha_day" for c in celebrations):
        celebrations.append(PetCelebration(
            occasion="gotcha_day",
            date=pet.gotcha_date,
            is_recurring=True
        ))
    
    pet_data["celebrations"] = [c.model_dump() for c in celebrations]
    
    await db.pets.insert_one(pet_data)
    
    # Remove MongoDB _id before returning
    pet_data.pop("_id", None)
    
    logger.info(f"Created pet profile: {pet_id} - {pet.name}")
    return {"message": "Pet profile created", "pet": pet_data}


@api_router.get("/pets")
@api_router.get("/pets/my-pets")
async def get_my_pets(current_user: dict = Depends(get_current_user)):
    """Get pets for the logged-in user"""
    pets = await db.pets.find({"owner_email": current_user["email"]}, {"_id": 0}).to_list(50)
    return {"pets": pets}


async def list_pet_profiles(
    owner_email: Optional[str] = None,
    owner_phone: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """List pet profiles, filtered by owner"""
    if not (owner_email or owner_phone):
        raise HTTPException(
            status_code=400, 
            detail="To protect pet privacy, you must provide an owner_email or owner_phone to view profiles."
        )
    
    query = {}
    if owner_email:
        query["owner_email"] = owner_email
    if owner_phone:
        query["owner_phone"] = owner_phone
    
    pets = await db.pets.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.pets.count_documents(query)
    
    return {"pets": pets, "total": total}


@api_router.get("/pets/{pet_id}")
async def get_pet_profile(pet_id: str):
    """Get a specific pet profile"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet


@api_router.put("/pets/{pet_id}")
async def update_pet_profile(pet_id: str, updates: PetProfileUpdate):
    """Update a pet profile"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Handle nested objects properly
    if "soul" in update_data and update_data["soul"]:
        update_data["soul"] = updates.soul.model_dump()
    if "preferences" in update_data and update_data["preferences"]:
        update_data["preferences"] = updates.preferences.model_dump()
    if "celebrations" in update_data and update_data["celebrations"]:
        update_data["celebrations"] = [c.model_dump() for c in updates.celebrations]
    
    await db.pets.update_one({"id": pet_id}, {"$set": update_data})
    
    updated_pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    return {"message": "Pet profile updated", "pet": updated_pet}


@api_router.delete("/pets/{pet_id}")
async def delete_pet_profile(pet_id: str):
    """Delete a pet profile"""
    result = await db.pets.delete_one({"id": pet_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    return {"message": "Pet profile deleted"}


@api_router.post("/pets/{pet_id}/celebrations")
async def add_pet_celebration(pet_id: str, celebration: PetCelebration):
    """Add a celebration date to a pet's profile"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    celebrations = pet.get("celebrations", [])
    celebrations.append(celebration.model_dump())
    
    await db.pets.update_one(
        {"id": pet_id},
        {
            "$set": {
                "celebrations": celebrations,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Celebration added", "celebrations": celebrations}


@api_router.delete("/pets/{pet_id}/celebrations/{occasion}")
async def remove_pet_celebration(pet_id: str, occasion: str):
    """Remove a celebration from a pet's profile"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    celebrations = [c for c in pet.get("celebrations", []) if c.get("occasion") != occasion]
    
    await db.pets.update_one(
        {"id": pet_id},
        {
            "$set": {
                "celebrations": celebrations,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Celebration removed", "celebrations": celebrations}


@api_router.get("/pets/{pet_id}/upcoming-celebrations")
async def get_upcoming_celebrations(pet_id: str, days: int = 30):
    """Get upcoming celebrations for a pet within the next N days"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    today = datetime.now(timezone.utc).date()
    upcoming = []
    
    for celeb in pet.get("celebrations", []):
        try:
            date_str = celeb.get("date", "")
            occasion = celeb.get("occasion", "")
            occasion_info = CELEBRATION_OCCASIONS.get(occasion, {})
            
            # Parse date (handle both YYYY-MM-DD and MM-DD formats)
            if len(date_str) == 10:  # YYYY-MM-DD
                celeb_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                # For recurring, use current year
                if celeb.get("is_recurring", True):
                    celeb_date = celeb_date.replace(year=today.year)
                    # If date has passed this year, use next year
                    if celeb_date < today:
                        celeb_date = celeb_date.replace(year=today.year + 1)
            elif len(date_str) == 5:  # MM-DD
                celeb_date = datetime.strptime(f"{today.year}-{date_str}", "%Y-%m-%d").date()
                if celeb_date < today:
                    celeb_date = celeb_date.replace(year=today.year + 1)
            else:
                continue
            
            days_until = (celeb_date - today).days
            
            if 0 <= days_until <= days:
                upcoming.append({
                    "occasion": occasion,
                    "occasion_name": occasion_info.get("name", celeb.get("custom_name", occasion)),
                    "emoji": occasion_info.get("emoji", "🎉"),
                    "date": celeb_date.isoformat(),
                    "days_until": days_until,
                    "recommended_collection": occasion_info.get("collection", "cakes"),
                    "custom_name": celeb.get("custom_name"),
                    "notes": celeb.get("notes")
                })
        except Exception as e:
            logger.error(f"Error parsing celebration date: {e}")
            continue
    
    # Sort by days until
    upcoming.sort(key=lambda x: x["days_until"])
    
    return {"pet_id": pet_id, "pet_name": pet.get("name"), "upcoming": upcoming}


@api_router.get("/celebrations/upcoming")
async def get_all_upcoming_celebrations(days: int = 30):
    """Get all upcoming celebrations across all pets (for admin/reminders)"""
    today = datetime.now(timezone.utc).date()
    all_upcoming = []
    
    async for pet in db.pets.find({}, {"_id": 0}):
        soul = pet.get("soul", {}) or {}
        persona = soul.get("persona", "shadow")
        persona_info = DOG_PERSONAS.get(persona, DOG_PERSONAS["shadow"])
        preferences = pet.get("preferences", {}) or {}
        
        for celeb in pet.get("celebrations", []):
            try:
                date_str = celeb.get("date", "")
                occasion = celeb.get("occasion", "")
                occasion_info = CELEBRATION_OCCASIONS.get(occasion, {})
                
                # Parse date
                if len(date_str) == 10:
                    celeb_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                    if celeb.get("is_recurring", True):
                        celeb_date = celeb_date.replace(year=today.year)
                        if celeb_date < today:
                            celeb_date = celeb_date.replace(year=today.year + 1)
                elif len(date_str) == 5:
                    celeb_date = datetime.strptime(f"{today.year}-{date_str}", "%Y-%m-%d").date()
                    if celeb_date < today:
                        celeb_date = celeb_date.replace(year=today.year + 1)
                else:
                    continue
                
                days_until = (celeb_date - today).days
                
                if 0 <= days_until <= days:
                    all_upcoming.append({
                        "pet_id": pet.get("id"),
                        "pet_name": pet.get("name"),
                        "pet_photo": pet.get("photo_url"),
                        "owner_name": pet.get("owner_name"),
                        "owner_email": pet.get("owner_email"),
                        "owner_phone": pet.get("owner_phone"),
                        "occasion": occasion,
                        "occasion_name": occasion_info.get("name", celeb.get("custom_name", occasion)),
                        "emoji": occasion_info.get("emoji", "🎉"),
                        "date": celeb_date.isoformat(),
                        "days_until": days_until,
                        "persona": persona,
                        "persona_name": persona_info.get("name"),
                        "persona_emoji": persona_info.get("emoji"),
                        "message_style": persona_info.get("message_style"),
                        "favorite_flavors": preferences.get("favorite_flavors", []),
                        "recommended_collection": occasion_info.get("collection", "cakes"),
                        "whatsapp_reminders": pet.get("whatsapp_reminders", True),
                        "email_reminders": pet.get("email_reminders", True)
                    })
            except Exception as e:
                logger.error(f"Error processing celebration: {e}")
                continue
    
    # Sort by days until
    all_upcoming.sort(key=lambda x: x["days_until"])
    
    return {"celebrations": all_upcoming, "total": len(all_upcoming)}


@api_router.get("/celebrations/my-upcoming")
async def get_my_upcoming_celebrations(days: int = 30, current_user: dict = Depends(get_current_user)):
    """Get upcoming celebrations ONLY for the logged-in user's pets"""
    today = datetime.now(timezone.utc).date()
    all_upcoming = []
    
    # Only fetch pets belonging to the current user
    async for pet in db.pets.find({"owner_email": current_user["email"]}, {"_id": 0}):
        soul = pet.get("soul", {}) or {}
        persona = soul.get("persona", "shadow")
        persona_info = DOG_PERSONAS.get(persona, DOG_PERSONAS["shadow"])
        preferences = pet.get("preferences", {}) or {}
        
        for celeb in pet.get("celebrations", []):
            try:
                date_str = celeb.get("date", "")
                occasion = celeb.get("occasion", "")
                occasion_info = CELEBRATION_OCCASIONS.get(occasion, {})
                
                # Parse date
                if len(date_str) == 10:
                    celeb_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                    if celeb.get("is_recurring", True):
                        celeb_date = celeb_date.replace(year=today.year)
                        if celeb_date < today:
                            celeb_date = celeb_date.replace(year=today.year + 1)
                elif len(date_str) == 5:
                    celeb_date = datetime.strptime(f"{today.year}-{date_str}", "%Y-%m-%d").date()
                    if celeb_date < today:
                        celeb_date = celeb_date.replace(year=today.year + 1)
                else:
                    continue
                
                days_until = (celeb_date - today).days
                
                if 0 <= days_until <= days:
                    all_upcoming.append({
                        "pet_id": pet.get("id"),
                        "pet_name": pet.get("name"),
                        "pet_photo": pet.get("photo_url"),
                        "occasion": occasion,
                        "occasion_name": occasion_info.get("name", celeb.get("custom_name", occasion)),
                        "emoji": occasion_info.get("emoji", "🎉"),
                        "date": celeb_date.isoformat(),
                        "days_until": days_until,
                        "persona": persona,
                        "persona_name": persona_info.get("name"),
                        "persona_emoji": persona_info.get("emoji")
                    })
            except Exception as e:
                logger.error(f"Error processing celebration: {e}")
                continue
    
    # Sort by days until
    all_upcoming.sort(key=lambda x: x["days_until"])
    
    return {"celebrations": all_upcoming, "total": len(all_upcoming)}


@api_router.post("/pets/{pet_id}/achievements")
async def add_pet_achievement(pet_id: str, achievement: dict):
    """Add an achievement badge to a pet"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    achievements = pet.get("achievements", [])
    achievement["earned_at"] = datetime.now(timezone.utc).isoformat()
    achievements.append(achievement)
    
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": {"achievements": achievements}}
    )
    
    return {"message": "Achievement added", "achievements": achievements}


def generate_celebration_message(pet: dict, celebration: dict, days_until: int) -> dict:
    """Generate personalized celebration message based on pet's soul"""
    soul = pet.get("soul", {}) or {}
    persona = soul.get("persona", "shadow")
    persona_info = DOG_PERSONAS.get(persona, DOG_PERSONAS["shadow"])
    preferences = pet.get("preferences", {}) or {}
    occasion_info = CELEBRATION_OCCASIONS.get(celebration.get("occasion", ""), {})
    
    pet_name = pet.get("name", "your furry friend")
    owner_name = pet.get("owner_name", "Pet Parent")
    special_move = soul.get("special_move", "")
    favorite_flavor = preferences.get("favorite_flavors", [""])[0] if preferences.get("favorite_flavors") else ""
    occasion_name = occasion_info.get("name", celebration.get("custom_name", "special day"))
    collection = occasion_info.get("collection", "cakes")
    
    # Message templates based on persona
    if persona in ["royal", "social_butterfly", "athlete"]:
        # Main Character / Royal style
        if days_until == 7:
            subject = f"🚨 Important Royal Decree for {pet_name}!"
            message = f"""Hi {owner_name}! Our calendar just started flashing gold—we realized {pet_name}'s {occasion_name} is exactly one week away! 👑

As the resident '{persona_info['name']},' we know {pet_name} expects nothing less than a celebration that matches that big personality.

{f"We remember {pet_name}'s special move: '{special_move}' - let's celebrate that!" if special_move else ""}

Want us to prepare something special for the {'birthday King' if pet.get('gender') == 'male' else 'birthday Queen'}?

Check out our {collection} collection: [Link]"""
        else:  # Day before
            subject = f"🎉 Tomorrow is THE day for {pet_name}!"
            message = f"""Hi {owner_name}! The royal countdown is almost complete!

{pet_name}'s {occasion_name} is TOMORROW! 🎂

Time to prepare the camera 📸 and get ready for the celebration! 
{f"Don't forget their favorite: {favorite_flavor}!" if favorite_flavor else ""}

Haven't ordered yet? There's still time for same-day treats!"""
    else:
        # Shadow / Soulmate style
        if days_until == 7:
            subject = f"A special milestone for your best friend... 🐾"
            message = f"""Hi {owner_name}, just a quiet reminder from The Doggy Bakery.

We noticed {pet_name}'s {occasion_name} is coming up in seven days! We know {pet_name} isn't just a pet—they are your '{persona_info['name']}' and your soulmate.

{f"To celebrate that one-of-a-kind bond (and maybe that special move: '{special_move}')," if special_move else "To celebrate that one-of-a-kind bond,"} would you like us to bake something special?

{f"We can customize treats with their favorite flavor: {favorite_flavor}." if favorite_flavor else ""}

Check out our 'Quiet Celebration' kits: [Link]

Sending a head-pat to {pet_name}! 💕"""
        else:  # Day before
            subject = f"Tomorrow is {pet_name}'s special day 💕"
            message = f"""Hi {owner_name},

Just a gentle reminder that {pet_name}'s {occasion_name} is tomorrow!

Time to snuggle up and celebrate your wonderful bond. 🐾
{f"Maybe treat them to some {favorite_flavor}?" if favorite_flavor else ""}

Prepare your camera for those precious moments! 📸"""
    
    return {
        "subject": subject,
        "message": message,
        "whatsapp_message": message.replace("[Link]", "https://thedoggycompany.in/" + collection),
        "collection": collection,
        "persona": persona,
        "message_style": persona_info.get("message_style")
    }


@api_router.get("/pets/{pet_id}/preview-message")
async def preview_celebration_message(pet_id: str, occasion: str, days_until: int = 7):
    """Preview what the celebration message would look like"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    celebration = {"occasion": occasion}
    message = generate_celebration_message(pet, celebration, days_until)
    
    return {
        "pet_name": pet.get("name"),
        "occasion": occasion,
        "days_until": days_until,
        **message
    }


# ==================== SHOPIFY SYNC ROUTES ====================

@admin_router.post("/sync/shopify")
async def sync_from_shopify(username: str = Depends(verify_admin)):
    """Sync products from thedoggybakery.com Shopify store"""
    try:
        logger.info("Starting Shopify sync...")
        
        # Fetch all products from Shopify
        shopify_products = await fetch_shopify_products()
        logger.info(f"Fetched {len(shopify_products)} products from Shopify")
        
        # Transform and upsert products
        synced = 0
        added = 0
        updated = 0
        
        for sp in shopify_products:
            transformed = transform_shopify_product(sp)
            
            # Check if product exists
            existing = await db.products.find_one({"shopify_id": sp["id"]})
            
            if existing:
                # Update existing
                await db.products.update_one(
                    {"shopify_id": sp["id"]},
                    {"$set": transformed}
                )
                updated += 1
            else:
                # Insert new
                await db.products.insert_one(transformed)
                added += 1
            
            synced += 1
        
        
        # Auto-create collections from categories
        categories = set()
        for sp in shopify_products:
            transformed = transform_shopify_product(sp)
            categories.add(transformed['category'])
            
        for cat in categories:
            if not cat or cat == 'other':
                continue
                
            handle = cat.lower().replace(" ", "-")
            collection = await db.collections.find_one({"handle": handle})
            
            if not collection:
                col_id = f"col-{uuid.uuid4().hex[:8]}"
                collection = {
                    "id": col_id,
                    "name": cat.replace("-", " ").title(),
                    "handle": handle,
                    "description": f"Auto-generated collection for {cat}",
                    "product_ids": [],
                    "show_in_menu": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                await db.collections.insert_one(collection)
            
            # Update products with this category to have this collection_id
            await db.products.update_many(
                {"category": cat},
                {"$addToSet": {"collection_ids": collection["id"]}}
            )
            
            # Update collection product_ids
            # Find all products with this category
            cat_products = await db.products.find({"category": cat}, {"id": 1}).to_list(1000)
            p_ids = [p["id"] for p in cat_products]
            
            await db.collections.update_one(
                {"id": collection["id"]},
                {"$set": {"product_ids": p_ids}}
            )

        # Save sync log
        await db.sync_logs.insert_one({
            "type": "shopify",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_fetched": len(shopify_products),
            "added": added,
            "updated": updated,
            "status": "success"
        })
        
        return {
            "message": "Shopify sync completed",
            "total_fetched": len(shopify_products),
            "added": added,
            "updated": updated
        }
        
    except Exception as e:
        logger.error(f"Shopify sync failed: {e}")
        await db.sync_logs.insert_one({
            "type": "shopify",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "failed",
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@admin_router.get("/sync/status")
async def get_sync_status(username: str = Depends(verify_admin)):
    """Get last sync status"""
    last_sync = await db.sync_logs.find_one(
        {"type": "shopify"},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    
    product_count = await db.products.count_documents({})
    shopify_count = await db.products.count_documents({"shopify_id": {"$exists": True}})
    
    return {
        "last_sync": last_sync,
        "total_products": product_count,
        "shopify_products": shopify_count
    }


# ==================== CSV IMPORT ROUTES ====================

@admin_router.post("/products/import-csv")
async def import_products_csv(
    file: UploadFile = File(...),
    username: str = Depends(verify_admin)
):
    """Import products from CSV file
    
    Expected CSV columns:
    name, category, price, originalPrice, description, image, sizes, flavors
    
    sizes and flavors should be JSON strings, e.g.:
    sizes: [{"name": "500g", "price": 600}, {"name": "1kg", "price": 1100}]
    flavors: [{"name": "Chicken", "price": 50}, {"name": "Banana", "price": 0}]
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        content = await file.read()
        decoded = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
        
        imported = 0
        updated = 0
        errors = []
        
        for row in reader:
            try:
                # Parse sizes and flavors if they're JSON strings
                sizes = row.get('sizes', '[]')
                flavors = row.get('flavors', '[]')
                
                import json
                try:
                    sizes = json.loads(sizes) if isinstance(sizes, str) and sizes.strip() else []
                except:
                    sizes = [{"name": "Standard", "price": float(row.get('price', 0))}]
                
                try:
                    flavors = json.loads(flavors) if isinstance(flavors, str) and flavors.strip() else []
                except:
                    flavors = []
                
                product = {
                    "name": row.get('name', '').strip(),
                    "category": row.get('category', 'other').strip(),
                    "price": float(row.get('price', 0)),
                    "originalPrice": float(row.get('originalPrice', row.get('price', 0))),
                    "description": row.get('description', ''),
                    "image": row.get('image', ''),
                    "sizes": sizes,
                    "flavors": flavors,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                
                if not product["name"]:
                    errors.append(f"Row skipped: empty name")
                    continue
                
                # Check if product exists by name
                existing = await db.products.find_one({"name": product["name"]})
                
                if existing:
                    await db.products.update_one(
                        {"name": product["name"]},
                        {"$set": product}
                    )
                    updated += 1
                else:
                    product["id"] = str(uuid.uuid4())
                    product["created_at"] = datetime.now(timezone.utc).isoformat()
                    await db.products.insert_one(product)
                    imported += 1
                    
            except Exception as e:
                errors.append(f"Row error: {str(e)}")
        
        return {
            "message": "CSV import completed",
            "imported": imported,
            "updated": updated,
            "errors": errors[:10]  # Return first 10 errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV import failed: {str(e)}")


@admin_router.get("/products/export-csv")
async def export_products_csv(username: str = Depends(verify_admin)):
    """Export all products as CSV"""
    from fastapi.responses import StreamingResponse
    
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    
    output = io.StringIO()
    fieldnames = ['name', 'category', 'price', 'originalPrice', 'description', 'image', 'sizes', 'flavors']
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    import json
    for p in products:
        writer.writerow({
            'name': p.get('name', ''),
            'category': p.get('category', ''),
            'price': p.get('price', 0),
            'originalPrice': p.get('originalPrice', p.get('price', 0)),
            'description': p.get('description', ''),
            'image': p.get('image', ''),
            'sizes': json.dumps(p.get('sizes', [])),
            'flavors': json.dumps(p.get('flavors', []))
        })
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products_export.csv"}
    )


# ==================== FRANCHISE INQUIRIES ====================

@api_router.post("/franchise/inquiry")
async def submit_franchise_inquiry(inquiry: dict):
    """Submit a franchise inquiry from the public form"""
    inquiry_doc = {
        "id": f"fran-{uuid.uuid4().hex[:8]}",
        "name": inquiry.get("name", "").strip(),
        "email": inquiry.get("email", "").strip(),
        "phone": inquiry.get("phone", "").strip(),
        "city": inquiry.get("city", "").strip(),
        "investment": inquiry.get("investment", ""),
        "message": inquiry.get("message", ""),
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "notes": ""
    }
    
    await db.franchise_inquiries.insert_one(inquiry_doc)
    
    # Send notification email
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [os.environ.get("NOTIFICATION_EMAIL", "woof@thedoggybakery.com")],
            "subject": f"New Franchise Inquiry from {inquiry_doc['name']} - {inquiry_doc['city']}",
            "html": f"""
            <h2>New Franchise Inquiry!</h2>
            <p><strong>Name:</strong> {inquiry_doc['name']}</p>
            <p><strong>Email:</strong> {inquiry_doc['email']}</p>
            <p><strong>Phone:</strong> {inquiry_doc['phone']}</p>
            <p><strong>City:</strong> {inquiry_doc['city']}</p>
            <p><strong>Investment:</strong> {inquiry_doc['investment']}</p>
            <p><strong>Message:</strong> {inquiry_doc['message']}</p>
            """
        }
        if RESEND_API_KEY:
            await asyncio.to_thread(resend.Emails.send, params)
    except Exception as e:
        logger.error(f"Failed to send franchise notification: {e}")
    
    return {"message": "Inquiry submitted successfully", "id": inquiry_doc["id"]}

# ==================== COLLECTION ROUTES ====================

@admin_router.get("/collections")
async def get_collections(username: str = Depends(verify_admin)):
    """Get all collections"""
    collections = await db.collections.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    
    # Enrich with product count
    for col in collections:
        col["product_count"] = len(col.get("product_ids", []))
        
    return {"collections": collections}

@admin_router.post("/collections")
async def create_collection(collection: CollectionCreate, username: str = Depends(verify_admin)):
    """Create a new collection"""
    # Generate handle from name
    handle = collection.name.lower().replace(" ", "-").replace("&", "and").replace(r"[^a-z0-9-]", "")
    
    # Check handle uniqueness
    existing = await db.collections.find_one({"handle": handle})
    if existing:
        handle = f"{handle}-{uuid.uuid4().hex[:4]}"
        
    new_col = Collection(
        name=collection.name,
        description=collection.description,
        image=collection.image,
        handle=handle,
        product_ids=collection.product_ids or [],
        show_in_menu=collection.show_in_menu or False
    )
    
    await db.collections.insert_one(new_col.model_dump())
    
    # Update products with this collection_id
    if new_col.product_ids:
        await db.products.update_many(
            {"id": {"$in": new_col.product_ids}},
            {"$addToSet": {"collection_ids": new_col.id}}
        )
        
    return {"message": "Collection created", "collection": new_col.model_dump()}

@admin_router.put("/collections/{collection_id}")
async def update_collection(collection_id: str, update: CollectionUpdate, username: str = Depends(verify_admin)):
    """Update a collection"""
    col = await db.collections.find_one({"id": collection_id})
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.collections.update_one({"id": collection_id}, {"$set": update_data})
    
    # Sync products if product_ids changed
    if update.product_ids is not None:
        # Remove collection_id from old products (that are NOT in new list)
        old_ids = set(col.get("product_ids", []))
        new_ids = set(update.product_ids)
        

# ==================== COLLECTION ROUTES ====================

@admin_router.get("/collections")
async def get_collections(username: str = Depends(verify_admin)):
    """Get all collections"""
    collections = await db.collections.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    
    # Enrich with product count
    for col in collections:
        col["product_count"] = len(col.get("product_ids", []))
        
    return {"collections": collections}

@admin_router.post("/collections")
async def create_collection(collection: CollectionCreate, username: str = Depends(verify_admin)):
    """Create a new collection"""
    # Generate handle from name
    handle = collection.name.lower().replace(" ", "-").replace("&", "and").replace(r"[^a-z0-9-]", "")
    
    # Check handle uniqueness
    existing = await db.collections.find_one({"handle": handle})
    if existing:
        handle = f"{handle}-{uuid.uuid4().hex[:4]}"
        
    new_col = Collection(
        name=collection.name,
        description=collection.description,
        image=collection.image,
        handle=handle,
        product_ids=collection.product_ids or [],
        show_in_menu=collection.show_in_menu or False
    )
    
    await db.collections.insert_one(new_col.model_dump())
    
    # Update products with this collection_id
    if new_col.product_ids:
        await db.products.update_many(
            {"id": {"$in": new_col.product_ids}},
            {"$addToSet": {"collection_ids": new_col.id}}
        )
        
    return {"message": "Collection created", "collection": new_col.model_dump()}

@admin_router.put("/collections/{collection_id}")
async def update_collection(collection_id: str, update: CollectionUpdate, username: str = Depends(verify_admin)):
    """Update a collection"""
    col = await db.collections.find_one({"id": collection_id})
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.collections.update_one({"id": collection_id}, {"$set": update_data})
    
    # Sync products if product_ids changed
    if update.product_ids is not None:
        # Remove collection_id from old products (that are NOT in new list)
        old_ids = set(col.get("product_ids", []))
        new_ids = set(update.product_ids)
        
        removed_ids = list(old_ids - new_ids)
        added_ids = list(new_ids - old_ids)
        
        if removed_ids:
            await db.products.update_many(
                {"id": {"$in": removed_ids}},
                {"$pull": {"collection_ids": collection_id}}
            )
            
        if added_ids:
            await db.products.update_many(
                {"id": {"$in": added_ids}},
                {"$addToSet": {"collection_ids": collection_id}}
            )
            
    return {"message": "Collection updated"}

@admin_router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str, username: str = Depends(verify_admin)):
    """Delete a collection"""
    result = await db.collections.delete_one({"id": collection_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    # Remove collection_id from products
    await db.products.update_many(
        {"collection_ids": collection_id},
        {"$pull": {"collection_ids": collection_id}}
    )
        
    return {"message": "Collection deleted"}

# ==================== REVIEWS ====================

@api_router.post("/reviews")
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user_optional)):
    """Submit a new review"""
    # Get product info for the review
    product = await db.products.find_one({"id": review.product_id}, {"_id": 0, "name": 1, "image": 1})
    
    review_doc = Review(
        product_id=review.product_id,
        author_name=review.reviewer_name or (current_user.get("name") if current_user else "Anonymous"),
        user_email=review.reviewer_email or (current_user.get("email") if current_user else None),
        user_id=current_user.get("id") if current_user else None,
        rating=review.rating,
        title=review.title,
        content=review.comment,
        image_url=review.image_url
    ).model_dump()
    
    # Add product info for display
    if product:
        review_doc["product_name"] = product.get("name")
        review_doc["product_image"] = product.get("image")
    
    await db.reviews.insert_one(review_doc)
    
    # Create admin notification for new review
    await create_admin_notification(
        notification_type="review",
        title=f"⭐ New {review.rating}-Star Review",
        message=f"{review_doc.get('author_name', 'Someone')} reviewed {product.get('name', 'a product') if product else 'a product'}",
        category="celebrate",
        related_id=review_doc.get("id"),
        link_to="/admin?tab=reviews",
        priority="high" if review.rating <= 2 else "normal",
        metadata={
            "rating": review.rating,
            "product": product.get("name") if product else None,
            "reviewer": review_doc.get("author_name")
        }
    )
    
    return {"message": "Review submitted for approval", "review": {k: v for k, v in review_doc.items() if k != "_id"}}


@api_router.get("/reviews/my-reviews")
async def get_my_reviews(current_user: dict = Depends(get_current_user)):
    """Get reviews submitted by the logged-in user"""
    reviews = await db.reviews.find(
        {"user_email": current_user["email"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with product info
    for r in reviews:
        product = await db.products.find_one({"id": r.get("product_id")}, {"_id": 0, "name": 1, "image": 1})
        if product:
            r["product_name"] = product.get("name")
            r["product_image"] = product.get("image")
        # Map content to comment for frontend compatibility
        r["comment"] = r.get("content", "")
    
    return {"reviews": reviews}


@api_router.put("/reviews/{review_id}")
async def update_user_review(review_id: str, update: ReviewCreate, current_user: dict = Depends(get_current_user)):
    """Update a review (only by the owner)"""
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Verify ownership
    if review.get("user_email") != current_user.get("email"):
        raise HTTPException(status_code=403, detail="You can only edit your own reviews")
    
    # Update the review
    update_data = {
        "author_name": update.reviewer_name or current_user.get("name"),
        "rating": update.rating,
        "content": update.comment,
        "status": "pending"  # Re-submit for approval when edited
    }
    if update.title:
        update_data["title"] = update.title
    
    await db.reviews.update_one({"id": review_id}, {"$set": update_data})
    return {"message": "Review updated and submitted for re-approval"}


@api_router.delete("/reviews/{review_id}")
async def delete_user_review(review_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a review (only by the owner)"""
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Verify ownership
    if review.get("user_email") != current_user.get("email"):
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")
    
    await db.reviews.delete_one({"id": review_id})
    return {"message": "Review deleted"}


@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    """Get approved reviews for a product"""
    reviews = await db.reviews.find(
        {"product_id": product_id, "status": "approved"}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"reviews": reviews}

@admin_router.get("/reviews")
async def get_admin_reviews(status: Optional[str] = None, username: str = Depends(verify_admin)):
    """Get all reviews for admin"""
    query = {}
    if status:
        query["status"] = status
        
    reviews = await db.reviews.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich with product names
    for r in reviews:
        product = await db.products.find_one({"id": r["product_id"]}, {"name": 1})
        if product:
            r["product_name"] = product["name"]
            
    return {"reviews": reviews}

@admin_router.put("/reviews/{review_id}")
async def update_review_status(review_id: str, update: dict, username: str = Depends(verify_admin)):
    """Approve or reject a review"""
    status = update.get("status")
    if status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    await db.reviews.update_one({"id": review_id}, {"$set": {"status": status}})
    
    # If approved, update product rating stats
    if status == "approved":
        review = await db.reviews.find_one({"id": review_id})
        if review:
            # Recalculate average
            pipeline = [
                {"$match": {"product_id": review["product_id"], "status": "approved"}},
                {"$group": {"_id": "$product_id", "avg_rating": {"$avg": "$rating"}, "count": {"$sum": 1}}}
            ]
            stats = await db.reviews.aggregate(pipeline).to_list(1)
            if stats:
                await db.products.update_one(
                    {"id": review["product_id"]},
                    {"$set": {
                        "rating": stats[0]["avg_rating"],
                        "reviews": stats[0]["count"]
                    }}
                )
    
    return {"message": "Review updated"}


@admin_router.get("/franchise")
async def get_franchise_inquiries(username: str = Depends(verify_admin)):
    """Get all franchise inquiries"""
    inquiries = await db.franchise_inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    stats = {
        "total": len(inquiries),
        "new": len([i for i in inquiries if i.get("status") == "new"]),
        "contacted": len([i for i in inquiries if i.get("status") == "contacted"]),
        "in_discussion": len([i for i in inquiries if i.get("status") == "in_discussion"]),
        "converted": len([i for i in inquiries if i.get("status") == "converted"]),
        "rejected": len([i for i in inquiries if i.get("status") == "rejected"])
    }
    
    return {"inquiries": inquiries, "stats": stats}


@admin_router.put("/franchise/{inquiry_id}")
async def update_franchise_inquiry(inquiry_id: str, update: dict, username: str = Depends(verify_admin)):
    """Update a franchise inquiry status or notes"""
    update_doc = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if "status" in update:
        update_doc["status"] = update["status"]
    if "notes" in update:
        update_doc["notes"] = update["notes"]
    
    result = await db.franchise_inquiries.update_one(
        {"id": inquiry_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    return {"message": "Inquiry updated"}


@admin_router.delete("/franchise/{inquiry_id}")
async def delete_franchise_inquiry(inquiry_id: str, username: str = Depends(verify_admin)):
    """Delete a franchise inquiry"""
    result = await db.franchise_inquiries.delete_one({"id": inquiry_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    return {"message": "Inquiry deleted"}


# ==================== STREATIES PROGRAM ====================

@admin_router.get("/streaties")
async def get_streaties_stats(username: str = Depends(verify_admin)):
    """Get Streaties program stats"""
    stats = await db.streaties_stats.find_one({"type": "main"}, {"_id": 0})
    
    if not stats:
        # Return default stats
        stats = {
            "type": "main",
            "strays_fed_monthly": 10000,
            "ngo_partners": 50,
            "cities_covered": 20,
            "total_donated": 500000,
            "donation_percentage": 10,
            "recent_donations": []
        }
    
    donations = await db.streaties_donations.find({}, {"_id": 0}).sort("date", -1).limit(20).to_list(20)
    stats["recent_donations"] = donations
    
    return stats


@admin_router.put("/streaties/stats")
async def update_streaties_stats(stats: dict, username: str = Depends(verify_admin)):
    """Update Streaties program stats"""
    update_doc = {
        "type": "main",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    for key in ["strays_fed_monthly", "ngo_partners", "cities_covered", "total_donated", "donation_percentage"]:
        if key in stats:
            update_doc[key] = stats[key]
    
    await db.streaties_stats.update_one(
        {"type": "main"},
        {"$set": update_doc},
        upsert=True
    )
    
    return {"message": "Stats updated"}


@admin_router.post("/streaties/donation")
async def add_streaties_donation(donation: dict, username: str = Depends(verify_admin)):
    """Log a Streaties donation"""
    donation_doc = {
        "id": f"don-{uuid.uuid4().hex[:8]}",
        "ngo_name": donation.get("ngo_name", ""),
        "city": donation.get("city", ""),
        "amount": donation.get("amount", 0),
        "animals_fed": donation.get("animals_fed", 0),
        "description": donation.get("description", ""),
        "date": donation.get("date", datetime.now(timezone.utc).isoformat()),
        "proof_url": donation.get("proof_url", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.streaties_donations.insert_one(donation_doc)
    
    # Update total donated
    await db.streaties_stats.update_one(
        {"type": "main"},
        {"$inc": {"total_donated": donation_doc["amount"]}},
        upsert=True
    )
    
    return {"message": "Donation logged", "id": donation_doc["id"]}


@admin_router.delete("/streaties/donation/{donation_id}")
async def delete_streaties_donation(donation_id: str, username: str = Depends(verify_admin)):
    """Delete a donation record"""
    result = await db.streaties_donations.delete_one({"id": donation_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Donation not found")
    
    return {"message": "Donation deleted"}


# ==================== ADMIN NOTIFICATION CENTER ====================

async def create_admin_notification(
    notification_type: str,
    title: str,
    message: str,
    category: str = "general",
    related_id: str = None,
    link_to: str = None,
    priority: str = "normal",
    metadata: dict = None
):
    """
    Create a notification for admin dashboard
    
    Types: order, reservation, meetup, chat, review, member, stock, ticket, system
    Categories: celebrate, dine, stay, care, travel, general
    Priority: low, normal, high, urgent
    """
    notification = {
        "id": f"notif-{uuid.uuid4().hex[:12]}",
        "type": notification_type,
        "title": title,
        "message": message,
        "category": category,
        "related_id": related_id,
        "link_to": link_to,  # e.g., "/admin?tab=orders" or "/admin?tab=dine&subtab=reservations"
        "priority": priority,
        "metadata": metadata or {},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.admin_notifications.insert_one(notification)
    logger.info(f"Admin notification created: {notification_type} - {title}")
    return notification["id"]


@api_router.get("/admin/notifications")
async def get_admin_notifications(
    limit: int = 50,
    unread_only: bool = False,
    category: str = None,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Get admin notifications"""
    verify_admin(credentials)
    
    query = {}
    if unread_only:
        query["read"] = False
    if category:
        query["category"] = category
    
    notifications = await db.admin_notifications.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Get unread count
    unread_count = await db.admin_notifications.count_documents({"read": False})
    
    # Get counts by category
    pipeline = [
        {"$match": {"read": False}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    category_counts = {}
    async for doc in db.admin_notifications.aggregate(pipeline):
        category_counts[doc["_id"]] = doc["count"]
    
    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "category_counts": category_counts
    }


@api_router.put("/admin/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Mark a notification as read"""
    verify_admin(credentials)
    
    result = await db.admin_notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}


@api_router.put("/admin/notifications/mark-all-read")
async def mark_all_notifications_read(
    category: str = None,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Mark all notifications as read"""
    verify_admin(credentials)
    
    query = {"read": False}
    if category:
        query["category"] = category
    
    result = await db.admin_notifications.update_many(
        query,
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": f"Marked {result.modified_count} notifications as read"}


@api_router.delete("/admin/notifications/clear-old")
async def clear_old_notifications(
    days: int = 30,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Clear notifications older than X days"""
    verify_admin(credentials)
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    result = await db.admin_notifications.delete_many({
        "created_at": {"$lt": cutoff.isoformat()},
        "read": True
    })
    
    return {"message": f"Deleted {result.deleted_count} old notifications"}


@api_router.delete("/admin/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Delete a notification"""
    verify_admin(credentials)
    
    result = await db.admin_notifications.delete_one({"id": notification_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted"}


# ==================== APP SETUP ====================

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Set database for admin routes
set_admin_db(db)

# Set database for status engine
set_status_db(db)

# Set database for feedback engine
set_feedback_db(db)

# Set database for birthday engine
set_birthday_db(db)

# Set database for concierge engine
set_concierge_db(db)

# Set database for email reports engine
set_reports_db(db)

# Set database for auth routes
set_auth_db(db)
# Set admin notification handler for auth routes
set_auth_notification_handler(create_admin_notification)

# Set database for product routes
set_product_db(db)
set_product_search(search_service)

# Set database for order routes
set_order_db(db)

# Set database for user routes
set_user_db(db)

# Set database for dine routes
set_dine_db(db)
# Set admin notification handler for dine routes
set_admin_notification_handler(create_admin_notification)

# Include routers
app.include_router(api_router)
app.include_router(admin_router)
app.include_router(fulfilment_router)
app.include_router(status_router)
app.include_router(feedback_router)
app.include_router(birthday_router)
app.include_router(concierge_router)
app.include_router(reports_email_router)
app.include_router(auth_router)
app.include_router(product_router)
app.include_router(order_router)
app.include_router(user_router)
app.include_router(dine_router)
app.include_router(ticket_router)
app.include_router(ticket_messaging_router)
app.include_router(ticket_sla_router)

@app.on_event("startup")
async def startup_load_admin_credentials():
    """Load admin credentials from database on startup"""
    await load_admin_credentials_from_db()

# ==================== ADMIN PASSWORD MANAGEMENT ====================

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

@app.post("/api/admin/change-password")
async def change_admin_password(
    request: PasswordChangeRequest,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Change admin password - stores in database"""
    global _admin_credentials_cache
    
    # Verify current credentials
    expected_password = _admin_credentials_cache.get("password") or ADMIN_PASSWORD
    if not secrets.compare_digest(request.current_password, expected_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Save to database
    await db.admin_config.update_one(
        {"type": "credentials"},
        {"$set": {
            "type": "credentials",
            "username": credentials.username,
            "password": request.new_password,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Update cache immediately
    _admin_credentials_cache["username"] = credentials.username
    _admin_credentials_cache["password"] = request.new_password
    _admin_credentials_cache["loaded"] = True
    
    return {"success": True, "message": "Password changed successfully"}

@app.get("/api/admin/password-info")
async def get_password_info(credentials: HTTPBasicCredentials = Depends(security)):
    """Get info about password configuration"""
    verify_admin(credentials)
    
    admin_config = await db.admin_config.find_one({"type": "credentials"})
    
    return {
        "using_database_password": admin_config is not None,
        "last_updated": admin_config.get("updated_at") if admin_config else None,
        "username": credentials.username
    }

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
