from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query, Header, Body, Request, BackgroundTasks
from fastapi.security import HTTPBasic, HTTPBasicCredentials, HTTPBearer, HTTPAuthorizationCredentials
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
import razorpay

# Import models from models.py
from models import (
    AdminCredentialReset, AdminLoginRequest,
    StatusCheck, StatusCheckCreate,
    ChatRequest, MiraChat,
    ProductUpdate, ProductFulfilmentUpdate,
    Review, ReviewCreate,
    AutoshipSubscription, AutoshipCreate,
    Collection, CollectionCreate, CollectionUpdate,
    ShippingThreshold, AppSettings, UpdateAppSettings,
    MembershipUser, UserRegister, UserLogin, MembershipUpgrade,
    PetSoul, PetCelebration, PetPreferences, PetHealthInfo, PetProfileCreate, PetProfileUpdate, CelebrationReminder,
    CartItem, CartSnapshot,
    CreateOrderRequest, VerifyPaymentRequest,
    AddMemberRequest, BulkActionRequest, CSVImportRequest, ProductCSVImportRequest,
    AgentCreate, AgentUpdate, AgentPasswordChange, AgentLoginRequest, PasswordChangeRequest
)

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
from partner_routes import (
    router as partner_router,
    admin_router as partner_admin_router,
    set_partner_db,
    set_partner_admin_verify,
    set_partner_email_func
)
from pricing_routes import (
    router as pricing_router,
    set_pricing_db,
    set_pricing_admin_verify
)
from pillar_reports import (
    router as pillar_reports_router,
    set_pillar_reports_db,
    set_pillar_reports_admin_verify
)
from restaurant_discovery import (
    router as restaurant_discovery_router,
    set_restaurant_scraper_db,
    set_restaurant_scraper_admin
)
from data_migration import (
    router as migration_router,
    set_migration_db,
    set_migration_admin_verify
)
from health_vault_routes import (
    health_vault_router,
    set_database as set_health_vault_db
)
from pet_soul_routes import (
    pet_soul_router,
    pet_soul_admin_router,
    set_pet_soul_db
)
from pet_score_logic import (
    pet_score_router,
    set_pet_score_db
)
from unified_product_box import (
    product_box_router,
    set_product_box_db
)
from concierge_order_queue import (
    order_queue_router,
    set_order_queue_db
)
from pet_vault_routes import (
    pet_vault_router,
    pet_vault_admin_router,
    set_pet_vault_db
)
from soul_intelligence import set_soul_db
from pet_gate_routes import (
    pet_gate_router,
    soul_drip_router,
    set_pet_gate_db
)
from admin_auth import (
    router as admin_auth_router,
    set_admin_db,
    set_admin_email_func,
    set_admin_env_credentials
)
from product_intelligence import ProductIntelligenceEngine, add_stock_images_to_products
from ai_description_enhancer import AIDescriptionEnhancer

# Stay pillar routes
from stay_routes import (
    stay_router,
    stay_admin_router,
    set_database as set_stay_db,
    set_admin_verify as set_stay_admin_verify
)
from stay_seeder import seed_stay_properties
from stay_social_routes import (
    stay_products_router,
    stay_social_router,
    stay_social_admin_router,
    set_database as set_stay_social_db,
    set_admin_verify as set_stay_social_admin_verify,
    seed_stay_bundles,
    seed_sample_socials
)

# Communication System (Unified Reminder & Mailing)
from communication_routes import setup_communication_routes

# Real-time WebSocket Notifications
from realtime_notifications import sio, notification_manager

# WhatsApp Integration
from whatsapp_routes import router as whatsapp_router

# APScheduler for background jobs
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=False)  # Don't override K8s env vars

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL') or 'mongodb://localhost:27017'
db_name = os.environ.get('DB_NAME') or 'test_database'
logger.info(f"MongoDB URL: {mongo_url[:30]}... DB: {db_name}")
try:
    # Connection settings optimized for both local and cloud deployments
    # More lenient timeouts to handle cold starts and network latency
    client = AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=30000,  # Increased from 10s to 30s
        connectTimeoutMS=30000,          # Increased from 10s to 30s
        socketTimeoutMS=60000,           # Increased from 30s to 60s
        maxPoolSize=10,
        minPoolSize=1,
    )
    db = client[db_name]
    logger.info("MongoDB connection configured")
except Exception as e:
    logger.error(f"MongoDB connection error: {e}")
    raise

# Resend configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.in")
NOTIFICATION_EMAIL = os.environ.get("NOTIFICATION_EMAIL", "woof@thedoggycompany.in")
WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "919663185747")

# Razorpay configuration
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")
razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    logger.info("Razorpay client initialized")
else:
    logger.warning("Razorpay keys not configured - payments disabled")

# Admin credentials from environment
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "aditya")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "lola4304")

# Secret token for credential reset (set in production env for security)
ADMIN_RESET_TOKEN = os.environ.get("ADMIN_RESET_TOKEN", "doggy-reset-2026-secure")

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
        # Validate email is a proper string
        if not to_email or not isinstance(to_email, str) or "@" not in to_email:
            logger.warning(f"Celebration email skipped: invalid email '{to_email}'")
            return
        
        to_email = to_email.strip()
        
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
                    <p>📞 +91 96631 85747 | 📧 woof@thedoggycompany.in</p>
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
            "to": to_email,  # Resend expects a string, not a list
            "subject": subject,
            "html": html_content
        }
        
        email_response = resend.Emails.send(params)
        logger.info(f"Celebration email sent to {to_email} for {pet_name}: {email_response}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send celebration email: {e}")
        return False


async def generate_pet_pass_number_server() -> str:
    """
    Generate a unique Pet Pass Number for a pet.
    Format: TDC-XXXXXX (6 alphanumeric characters)
    """
    import random
    import string
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        pet_pass = f"TDC-{code}"
        existing = await db.pets.find_one({"pet_pass_number": pet_pass})
        if not existing:
            return pet_pass


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


# Product fulfilment types
FULFILMENT_TYPES = ["shipping", "store_pickup", "both"]


async def force_initialize_database():
    """Force initialize database on every startup - ensures data survives deployments"""
    from passlib.context import CryptContext
    import uuid
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    try:
        # 1. Force create admin credentials
        admin_exists = await db.admin_config.find_one({"type": "credentials"})
        if not admin_exists:
            await db.admin_config.insert_one({
                "type": "credentials",
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            logger.info(f"✓ AUTO-CREATED admin: {ADMIN_USERNAME}")
        else:
            logger.info(f"✓ Admin exists: {admin_exists.get('username')}")
        
        # 2. Force create default user
        default_email = "dipali@clubconcierge.in"
        user_exists = await db.users.find_one({"email": default_email})
        if not user_exists:
            password_hash = pwd_context.hash("lola4304")
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "email": default_email,
                "password_hash": password_hash,
                "name": "Dipali",
                "phone": None,
                "membership_tier": "free",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            logger.info(f"✓ AUTO-CREATED user: {default_email}")
        else:
            # Ensure password_hash exists
            if not user_exists.get("password_hash"):
                password_hash = pwd_context.hash("lola4304")
                await db.users.update_one(
                    {"email": default_email},
                    {"$set": {"password_hash": password_hash}}
                )
                logger.info(f"✓ Fixed password for: {default_email}")
            else:
                logger.info(f"✓ User exists: {default_email}")
        
        # 3. Check products count
        product_count = await db.products.count_documents({})
        logger.info(f"✓ Products in database: {product_count}")
        
        # 4. AUTO-SEED CRITICAL DATA ON STARTUP
        # This ensures FAQs, Collections, and base data survive deployments
        await auto_seed_critical_data()
        
        logger.info("=== DATABASE INITIALIZATION COMPLETE ===")
        
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        # Continue anyway - don't block startup


async def auto_seed_critical_data():
    """Auto-seed critical data that should persist across deployments"""
    try:
        # Seed FAQs if none exist
        faq_count = await db.faqs.count_documents({})
        if faq_count == 0:
            logger.info("Seeding FAQs...")
            sample_faqs = [
                {"id": "faq-delivery-1", "question": "What are the delivery areas and timelines?", "answer": "We deliver freshly baked treats across Bangalore within 24-48 hours. Pan-India shipping is available for select products with 3-5 day delivery.", "category": "Delivery", "order": 1},
                {"id": "faq-delivery-2", "question": "Are your products safe for dogs?", "answer": "Absolutely! All our products are made with 100% dog-safe, human-grade ingredients. We never use artificial sweeteners, chocolate, xylitol, or any ingredients harmful to pets.", "category": "Products", "order": 2},
                {"id": "faq-order-1", "question": "How do I place a custom cake order?", "answer": "You can use our Custom Cake Designer or chat with Mira, our AI concierge, who will help you create the perfect cake for your furry friend. Custom cakes require 48-72 hours advance notice.", "category": "Orders", "order": 3},
                {"id": "faq-membership-1", "question": "What are the membership tiers?", "answer": "We offer three tiers: Free (basic access), Gold (10% off, priority support), and Platinum (15% off, exclusive perks, concierge service). Visit our Membership page for details.", "category": "Membership", "order": 4},
                {"id": "faq-allergy-1", "question": "Can you accommodate food allergies?", "answer": "Yes! We can customize products to avoid specific allergens. Please mention any allergies when ordering, or add them to your pet's profile for automatic recommendations.", "category": "Products", "order": 5},
                {"id": "faq-payment-1", "question": "What payment methods do you accept?", "answer": "We accept all major credit/debit cards, UPI, net banking, and wallets through our secure Razorpay gateway.", "category": "Payment", "order": 6},
                {"id": "faq-pet-soul-1", "question": "What is Pet Soul™?", "answer": "Pet Soul™ is your pet's unique digital profile that captures their personality, preferences, health data, and celebrations. It helps us personalize every experience for your furry family member.", "category": "Pet Soul", "order": 7},
                {"id": "faq-mira-1", "question": "Who is Mira® and how can she help?", "answer": "Mira® is our AI-powered concierge who knows your pet personally. She can help with product recommendations, booking services, answering questions, and coordinating your pet's life across all our pillars.", "category": "Mira AI", "order": 8},
            ]
            for faq in sample_faqs:
                await db.faqs.update_one({"id": faq["id"]}, {"$set": faq}, upsert=True)
            logger.info(f"✓ AUTO-SEEDED {len(sample_faqs)} FAQs")
        else:
            logger.info(f"✓ FAQs exist: {faq_count}")
        
        # Seed Collections if none exist
        collection_count = await db.enhanced_collections.count_documents({})
        if collection_count == 0:
            logger.info("Seeding Collections...")
            sample_collections = [
                {"id": "col-valentine", "name": "Valentine's Day Special", "slug": "valentines-day", "description": "Celebrate love with your furry friend!", "image": "https://images.unsplash.com/photo-1518882605630-8eb723e8e0b4?w=800", "status": "active", "is_featured": True, "products": [], "created_at": datetime.now(timezone.utc).isoformat()},
                {"id": "col-birthday", "name": "Birthday Celebration", "slug": "birthday-celebration", "description": "Make every birthday special with treats and cakes!", "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800", "status": "active", "is_featured": True, "products": [], "created_at": datetime.now(timezone.utc).isoformat()},
                {"id": "col-healthy", "name": "Healthy Bites", "slug": "healthy-bites", "description": "Nutritious treats for health-conscious pet parents", "image": "https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=800", "status": "active", "is_featured": False, "products": [], "created_at": datetime.now(timezone.utc).isoformat()},
            ]
            for col in sample_collections:
                await db.enhanced_collections.update_one({"id": col["id"]}, {"$set": col}, upsert=True)
            logger.info(f"✓ AUTO-SEEDED {len(sample_collections)} Collections")
        else:
            logger.info(f"✓ Collections exist: {collection_count}")
        
        # Seed Services for all pillars if none exist
        try:
            service_count = await db.services.count_documents({})
            if service_count == 0:
                logger.info("Seeding Concierge® Services...")
                await auto_seed_all_services()
            else:
                logger.info(f"✓ Services exist: {service_count}")
        except Exception as svc_error:
            logger.error(f"Services seed error (non-blocking): {svc_error}")
        
    except Exception as e:
        logger.error(f"Auto-seed critical data error: {e}")


async def auto_seed_all_services():
    """Auto-seed Concierge® services for all pillars"""
    # Fit Services
    fit_services = [
        {
            "id": "svc-fit-assessment",
            "name": "Fitness Assessment & Programme Design",
            "description": "Comprehensive fitness evaluation with personalised exercise programme.",
            "pillar": "fit",
            "category": "assessment",
            "price": 2499,
            "duration": "90 min",
            "features": ["Body Condition Score", "Mobility Assessment", "Custom Exercise Plan", "Nutrition Tips"],
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
            "is_active": True
        },
        {
            "id": "svc-fit-training",
            "name": "Personal Training Programme - 8 Weeks",
            "description": "One-on-one training sessions with a certified canine fitness trainer.",
            "pillar": "fit",
            "category": "training",
            "price": 7999,
            "duration": "8 weeks",
            "features": ["16 Sessions", "Progress Tracking", "Home Exercises", "Trainer Support"],
            "image": "https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=800",
            "is_active": True
        },
        {
            "id": "svc-fit-weight",
            "name": "Weight Management Programme",
            "description": "Structured weight loss/gain programme with nutritionist support.",
            "pillar": "fit",
            "category": "weight",
            "price": 5999,
            "duration": "12 weeks",
            "features": ["Diet Plan", "Weekly Weigh-ins", "Exercise Routine", "Progress Reports"],
            "image": "https://images.unsplash.com/photo-1546815693-7533bae19894?w=800",
            "is_active": True
        },
        {
            "id": "svc-fit-hydro",
            "name": "Hydrotherapy Sessions",
            "description": "Low-impact aquatic therapy for rehabilitation and fitness.",
            "pillar": "fit",
            "category": "therapy",
            "price": 1499,
            "duration": "45 min",
            "features": ["Heated Pool", "Professional Therapist", "Joint-Friendly", "All Ages Welcome"],
            "image": "https://images.unsplash.com/photo-1560743641-3914f2c45636?w=800",
            "is_active": True
        },
        {
            "id": "svc-fit-senior",
            "name": "Senior Mobility Programme",
            "description": "Gentle exercises designed for older dogs to maintain mobility.",
            "pillar": "fit",
            "category": "senior",
            "price": 4999,
            "duration": "Monthly",
            "features": ["Low Impact", "Pain Management", "Flexibility Focus", "Home Visits Available"],
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
            "is_active": True
        },
        {
            "id": "svc-fit-puppy",
            "name": "Puppy Development Programme",
            "description": "Age-appropriate exercises and socialisation for growing pups.",
            "pillar": "fit",
            "category": "puppy",
            "price": 3999,
            "duration": "8 weeks",
            "features": ["Growth-Safe Exercises", "Socialisation", "Basic Commands", "Play Groups"],
            "image": "https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=800",
            "is_active": True
        },
        {
            "id": "svc-fit-agility",
            "name": "Agility Foundation Course",
            "description": "Introduction to agility training for dogs of all skill levels.",
            "pillar": "fit",
            "category": "training",
            "price": 4499,
            "duration": "6 weeks",
            "features": ["Equipment Training", "Confidence Building", "Fun Obstacles", "Competition Prep"],
            "image": "https://images.unsplash.com/photo-1546815693-7533bae19894?w=800",
            "is_active": True
        },
        {
            "id": "svc-fit-yoga",
            "name": "Canine Yoga (Doga) Session",
            "description": "Relaxing yoga session for you and your dog to bond and de-stress.",
            "pillar": "fit",
            "category": "wellness",
            "price": 799,
            "duration": "60 min",
            "features": ["Breathing Exercises", "Gentle Stretches", "Bonding Time", "Stress Relief"],
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
            "is_active": True
        }
    ]
    
    # Care Services
    care_services = [
        {
            "id": "svc-care-grooming",
            "name": "Premium Grooming Session",
            "description": "Full grooming service including bath, haircut, nail trim, and ear cleaning.",
            "pillar": "care",
            "category": "grooming",
            "price": 1499,
            "duration": "2-3 hours",
            "features": ["Bath & Dry", "Breed-Specific Cut", "Nail Trim", "Ear Cleaning"],
            "image": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800",
            "is_active": True
        },
        {
            "id": "svc-care-vet",
            "name": "Vet Consultation at Home",
            "description": "Licensed veterinarian visits your home for check-ups and consultations.",
            "pillar": "care",
            "category": "vet",
            "price": 1999,
            "duration": "45-60 min",
            "features": ["Home Visit", "Basic Check-up", "Prescription if Needed", "Follow-up Call"],
            "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
            "is_active": True
        },
        {
            "id": "svc-care-sitting",
            "name": "Pet Sitting (Daily)",
            "description": "Professional pet sitter cares for your pet at your home.",
            "pillar": "care",
            "category": "sitting",
            "price": 799,
            "duration": "8 hours",
            "features": ["Feeding", "Walks", "Playtime", "Photo Updates"],
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
            "is_active": True
        }
    ]
    
    # Celebrate Services  
    celebrate_services = [
        {
            "id": "svc-celebrate-party",
            "name": "Birthday Party Planning",
            "description": "Complete party planning service for your pet's special day.",
            "pillar": "celebrate",
            "category": "party",
            "price": 4999,
            "duration": "Full Day",
            "features": ["Venue Coordination", "Custom Cake", "Decorations", "Invitations"],
            "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800",
            "is_active": True
        },
        {
            "id": "svc-celebrate-photoshoot",
            "name": "Professional Pet Photoshoot",
            "description": "Studio or outdoor photoshoot with professional pet photographer.",
            "pillar": "celebrate",
            "category": "photography",
            "price": 3499,
            "duration": "2 hours",
            "features": ["Professional Photographer", "20 Edited Photos", "Props Included", "Location Choice"],
            "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
            "is_active": True
        }
    ]
    
    all_services = fit_services + care_services + celebrate_services
    
    for service in all_services:
        await db.services.update_one({"id": service["id"]}, {"$set": service}, upsert=True)
    
    logger.info(f"✓ AUTO-SEEDED {len(all_services)} Concierge® Services")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global sync_task
    
    # FORCE INITIALIZE DATABASE ON EVERY STARTUP
    # This ensures data exists after every deployment
    logger.info("=== AUTOMATIC DATABASE INITIALIZATION ===")
    await force_initialize_database()
    
    # Load admin credentials from database
    logger.info("Loading admin credentials from database...")
    await load_admin_credentials_from_db()
    
    # Ensure default user exists for login
    logger.info("Ensuring default user exists...")
    await ensure_default_user_exists()
    
    # Seed initial products if database is empty
    logger.info("Checking products...")
    await seed_initial_products()
    
    # Initialize role database connection
    set_role_db(db)
    logger.info("Role management initialized")
    
    # Initialize FAQ database connection
    set_faq_db(db)
    
    # Initialize content database connection
    set_content_db(db)
    
    # Initialize loyalty database connection
    set_loyalty_db(db)
    
    # Initialize discount database connection
    set_discount_db(db)
    
    # Initialize cart database connection
    set_cart_db(db)
    
    # Initialize escalation database connection
    set_escalation_db(db)
    logger.info("Escalation engine initialized")
    
    # Initialize Shopify sync database connection
    set_shopify_db(db)
    logger.info("Shopify sync module initialized")
    
    # Initialize orders routes database connection
    set_orders_db(db)
    set_orders_deps(get_current_user, create_admin_notification, notify_order_status_change, on_order_placed)
    logger.info("Orders routes initialized")
    
    # Initialize Concierge® Order Queue
    set_order_queue_db(db)
    logger.info("Concierge® Order Queue initialized")
    
    # Initialize autoship routes database connection
    set_autoship_db(db)
    set_autoship_deps(get_current_user)
    logger.info("Autoship routes initialized")
    
    # Initialize admin member routes database connection
    set_admin_member_db(db)
    set_admin_member_deps(verify_admin)
    logger.info("Admin member routes initialized")
    
    # Initialize household routes database connection
    set_household_db(db)
    set_household_deps(generate_pet_pass_number_server)
    logger.info("Household routes initialized")
    
    # Initialize review routes database connection
    set_review_db(db)
    set_review_deps(get_current_user, get_current_user_optional, verify_admin, create_admin_notification)
    logger.info("Review routes initialized")
    
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
    
    # Add escalation check (runs every 15 minutes)
    scheduler.add_job(
        run_escalation_check,
        IntervalTrigger(minutes=15),
        id="escalation_check",
        replace_existing=True
    )
    
    # Add health reminder check (runs daily at 9 AM IST = 3:30 AM UTC)
    from pet_vault_routes import check_health_reminders
    scheduler.add_job(
        check_health_reminders,
        CronTrigger(hour=3, minute=30),
        id="health_reminders",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Schedulers started: celebration reminders, abandoned cart, feedback, daily reports, escalation checks (15 min), health reminders (daily 9 AM)")
    
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

# Mount Socket.IO at /socket.io path for WebSocket support
import socketio
socket_asgi_app = socketio.ASGIApp(sio, socketio_path='socket.io')
app.mount('/socket.io', socket_asgi_app)

# Create routers
@app.get("/api/health")
def api_health_check():
    """Health check alias for /api prefix"""
    return health_check()

api_router = APIRouter(prefix="/api")
admin_router = APIRouter(prefix="/api/admin")

# Import admin routes
from admin_routes import fulfilment_router, set_database as set_admin_routes_db

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
    DOG_PERSONAS as DOG_PERSONAS_LIST,
    CELEBRATION_OCCASIONS as CELEBRATION_OCCASIONS_LIST,
    PetCelebration,
    PetSoulProfile,
    PetPreferences
)

# Convert lists to dictionaries for easier lookup
DOG_PERSONAS = {p["id"]: p for p in DOG_PERSONAS_LIST}
CELEBRATION_OCCASIONS = {c["id"]: c for c in CELEBRATION_OCCASIONS_LIST}

# Import dine routes (refactored)
from dine_routes import (
    dine_router,
    set_database as set_dine_db,
    set_admin_notification_handler
)

# Import FAQ routes (refactored)
from faq_routes import (
    faq_router,
    faq_admin_router,
    set_database as set_faq_db
)

# Import content routes (refactored - Testimonials & Blog)
from content_routes import (
    content_router,
    content_admin_router,
    set_database as set_content_db
)

# Import loyalty routes (refactored)
from loyalty_routes import (
    loyalty_router,
    loyalty_admin_router,
    set_database as set_loyalty_db
)

# Import discount routes (refactored)
from discount_routes import (
    discount_router,
    discount_admin_router,
    set_database as set_discount_db
)

# Import cart routes (refactored)
from cart_routes import (
    cart_router,
    cart_admin_router,
    set_database as set_cart_db,
    check_abandoned_carts
)

# Import Shopify sync routes (refactored)
from shopify_sync_routes import (
    shopify_router,
    shopify_admin_router,
    set_database as set_shopify_db,
    fetch_shopify_products,
    transform_shopify_product,
    check_product_matches
)

# Import orders routes (refactored)
from orders_routes import (
    orders_router,
    set_database as set_orders_db,
    set_dependencies as set_orders_deps
)

# Import autoship routes (refactored)
from autoship_routes import (
    autoship_router,
    autoship_admin_router,
    set_database as set_autoship_db,
    set_dependencies as set_autoship_deps,
    calculate_autoship_discount
)

# Import admin member routes (refactored)
from admin_member_routes import (
    admin_member_router,
    set_database as set_admin_member_db,
    set_dependencies as set_admin_member_deps
)

# Import household routes (refactored)
from household_routes import (
    household_router,
    set_database as set_household_db,
    set_dependencies as set_household_deps
)

# Import review routes (refactored)
from review_routes import (
    review_router,
    admin_review_router,
    set_database as set_review_db,
    set_dependencies as set_review_deps
)

# Import ticket routes (Service Desk)
from ticket_routes import router as ticket_router
from ticket_messaging import router as ticket_messaging_router
from ticket_sla import router as ticket_sla_router
from ticket_auto_create import create_ticket_from_event, update_ticket_from_event

# Import role management
from role_routes import router as role_router, set_database as set_role_db

# Import escalation engine
from escalation_routes import router as escalation_router, set_database as set_escalation_db, run_escalation_check

# Import notification engine
from notification_engine import (
    notification_router,
    set_database as set_notification_db,
    send_notification,
    notify_order_status_change,
    notify_booking_status_change,
    notify_ticket_update,
    NotificationEvent,
    NotificationRecipient
)

# Import Multi-Channel Intake engine
from channel_intake import (
    channel_router,
    set_database as set_channel_db
)

# Import Pet Pass Renewal Reminders
from renewal_reminders import (
    set_database as set_renewal_db,
    check_and_send_renewal_reminders,
    get_expiring_memberships
)

# Import MIS & Reporting engine
from mis_reporting import (
    mis_router,
    set_database as set_mis_db
)

# Import Universal Paw Rewards
from paw_rewards import (
    rewards_router,
    set_database as set_rewards_db
)

# Import Paw Points Redemption System
from paw_points_routes import (
    paw_points_router,
    set_db as set_paw_points_db
)

# Import Travel Pillar
from travel_routes import router as travel_router

# Import Care Pillar
from care_routes import router as care_router

# Import Enjoy Pillar
from enjoy_routes import router as enjoy_router
from fit_routes import router as fit_router
from learn_routes import router as learn_router
from advisory_routes import router as advisory_router
from paperwork_routes import router as paperwork_router
from emergency_routes import router as emergency_router
from celebrate_routes import router as celebrate_router
from adopt_routes import router as adopt_router

# Import Farewell and Shop Pillar routes
from farewell_routes import router as farewell_router
from shop_routes import router as shop_router

# Import Smart Recommendations Engine
from smart_routes import router as smart_router

# Import Mira AI Concierge System
from mira_routes import router as mira_router, set_mira_db
from mira_intelligence import router as mira_intelligence_router, set_intelligence_db

# Import Mira Relationship Memory System
from mira_memory_routes import router as mira_memory_router, set_memory_routes_db

# Import Concierge Command Center routes
from concierge_routes import router as concierge_command_router, set_concierge_db as set_command_center_db

# Import Analytics routes
from analytics_routes import router as analytics_router, set_database as set_analytics_db

# Import Auto Ticket Creation System
from ticket_auto_creation import set_auto_ticket_db, create_event_ticket, on_order_placed

# Health check endpoint (required for Kubernetes deployment)
@app.get("/health")
def health_check():
    """Simple health check for Kubernetes liveness/readiness probes"""
    return {"status": "healthy", "service": "doggy-bakery-api"}

@app.get("/api/health")
def api_health_check():
    """Simple health check under /api prefix"""
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

@app.get("/api/health/db")
async def api_db_health_check():
    """Database connectivity health check under /api prefix"""
    try:
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

# Security - support both Basic Auth and Bearer Token
security = HTTPBasic(auto_error=False)
security_bearer = HTTPBearer(auto_error=False)

# Cache for admin credentials from database
_admin_credentials_cache = {"username": None, "password": None, "loaded": False}

async def load_admin_credentials_from_db():
    """Load admin credentials from database into cache, create if not exists"""
    global _admin_credentials_cache
    try:
        admin_config = await db.admin_config.find_one({"type": "credentials"})
        logger.info(f"Loading admin credentials from DB: {admin_config is not None}")
        
        if admin_config:
            _admin_credentials_cache["username"] = admin_config.get("username")
            _admin_credentials_cache["password"] = admin_config.get("password")
            _admin_credentials_cache["loaded"] = True
            logger.info(f"Admin credentials loaded: {_admin_credentials_cache['username']}")
        else:
            # Create default admin credentials if none exist
            default_username = ADMIN_USERNAME
            default_password = ADMIN_PASSWORD
            await db.admin_config.insert_one({
                "type": "credentials",
                "username": default_username,
                "password": default_password,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            _admin_credentials_cache["username"] = default_username
            _admin_credentials_cache["password"] = default_password
            _admin_credentials_cache["loaded"] = True
            logger.info(f"AUTO-CREATED default admin credentials: {default_username}")
    except Exception as e:
        logger.error(f"Error loading admin credentials: {e}")
        # Fallback to env variables
        _admin_credentials_cache["username"] = ADMIN_USERNAME
        _admin_credentials_cache["password"] = ADMIN_PASSWORD
        _admin_credentials_cache["loaded"] = True
        logger.info(f"Using fallback admin credentials from env: {ADMIN_USERNAME}")


async def ensure_default_user_exists():
    """Ensure a default test user exists for login testing - ALWAYS runs on startup"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    try:
        # Check if default user exists
        default_email = "dipali@clubconcierge.in"
        existing = await db.users.find_one({"email": default_email})
        
        if not existing:
            # Create default user with bcrypt password
            import uuid
            password_hash = pwd_context.hash("lola4304")
            user_doc = {
                "id": str(uuid.uuid4()),
                "email": default_email,
                "password_hash": password_hash,
                "name": "Dipali",
                "phone": None,
                "membership_tier": "free",
                "membership_expires": None,
                "chat_count_today": 0,
                "last_chat_date": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_doc)
            logger.info(f"AUTO-CREATED default user: {default_email}")
        else:
            # Ensure password_hash field exists and is correct
            if "password_hash" not in existing or not existing.get("password_hash"):
                password_hash = pwd_context.hash("lola4304")
                await db.users.update_one(
                    {"email": default_email},
                    {"$set": {"password_hash": password_hash}}
                )
                logger.info(f"Updated password_hash for: {default_email}")
            else:
                logger.info(f"Default user already exists: {default_email}")
    except Exception as e:
        logger.error(f"Error ensuring default user: {e}")


async def seed_initial_products():
    """Seed initial products if database is empty"""
    try:
        product_count = await db.products.count_documents({})
        if product_count > 0:
            logger.info(f"Products already exist: {product_count} products")
            return
        
        logger.info("No products found, seeding initial products...")
        
        # Sample products for each category
        sample_products = [
            # Cakes
            {"id": "cake-001", "name": "Classic Peanut Butter Cake", "description": "Delicious peanut butter cake for dogs", "price": 899, "originalPrice": 899, "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600", "category": "cakes", "sizes": [{"name": "Small (500g)", "price": 899}, {"name": "Medium (1kg)", "price": 1499}], "flavors": ["Peanut Butter"], "tags": ["birthday", "celebration"], "available": True},
            {"id": "cake-002", "name": "Banana Bliss Cake", "description": "Healthy banana cake with natural ingredients", "price": 799, "originalPrice": 799, "image": "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600", "category": "cakes", "sizes": [{"name": "Small (500g)", "price": 799}, {"name": "Medium (1kg)", "price": 1299}], "flavors": ["Banana"], "tags": ["healthy", "natural"], "available": True},
            {"id": "cake-003", "name": "Carrot Delight Cake", "description": "Nutritious carrot cake packed with vitamins", "price": 949, "originalPrice": 949, "image": "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600", "category": "cakes", "sizes": [{"name": "Small (500g)", "price": 949}, {"name": "Medium (1kg)", "price": 1599}], "flavors": ["Carrot"], "tags": ["healthy", "vitamins"], "available": True},
            {"id": "cake-004", "name": "Chicken Supreme Cake", "description": "Savory chicken cake for meat lovers", "price": 1099, "originalPrice": 1099, "image": "https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600", "category": "cakes", "sizes": [{"name": "Small (500g)", "price": 1099}, {"name": "Medium (1kg)", "price": 1799}], "flavors": ["Chicken"], "tags": ["protein", "savory"], "available": True},
            {"id": "cake-005", "name": "Apple Cinnamon Cake", "description": "Sweet apple cake with a hint of cinnamon", "price": 849, "originalPrice": 849, "image": "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=600", "category": "cakes", "sizes": [{"name": "Small (500g)", "price": 849}, {"name": "Medium (1kg)", "price": 1399}], "flavors": ["Apple", "Cinnamon"], "tags": ["sweet", "festive"], "available": True},
            
            # Treats
            {"id": "treat-001", "name": "Chicken Jerky Strips", "description": "Crunchy chicken jerky treats", "price": 349, "originalPrice": 349, "image": "https://images.unsplash.com/photo-1582798244350-8b8e9e4f0b91?w=600", "category": "treats", "sizes": [{"name": "100g Pack", "price": 349}, {"name": "250g Pack", "price": 749}], "flavors": ["Chicken"], "tags": ["protein", "crunchy"], "available": True},
            {"id": "treat-002", "name": "Peanut Butter Biscuits", "description": "Crunchy peanut butter flavored biscuits", "price": 299, "originalPrice": 299, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600", "category": "treats", "sizes": [{"name": "150g Pack", "price": 299}, {"name": "300g Pack", "price": 549}], "flavors": ["Peanut Butter"], "tags": ["crunchy", "training"], "available": True},
            {"id": "treat-003", "name": "Sweet Potato Chews", "description": "Natural sweet potato chew treats", "price": 399, "originalPrice": 399, "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600", "category": "treats", "sizes": [{"name": "100g Pack", "price": 399}], "flavors": ["Sweet Potato"], "tags": ["natural", "chewy"], "available": True},
            
            # Pupcakes
            {"id": "pupcake-001", "name": "Pupcake Box (6 pcs)", "description": "Assorted mini cupcakes for dogs", "price": 599, "originalPrice": 599, "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600", "category": "cakes", "sizes": [{"name": "Box of 6", "price": 599}, {"name": "Box of 12", "price": 999}], "flavors": ["Assorted"], "tags": ["party", "mini"], "available": True},
            
            # Dognuts
            {"id": "dognut-001", "name": "Glazed Dognuts (4 pcs)", "description": "Doggy-safe glazed donuts", "price": 449, "originalPrice": 449, "image": "https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=600", "category": "dognuts", "sizes": [{"name": "Box of 4", "price": 449}], "flavors": ["Glazed"], "tags": ["fun", "party"], "available": True},
            
            # Frozen Treats
            {"id": "frozen-001", "name": "Pup Ice Cream - Peanut Butter", "description": "Frozen peanut butter treat", "price": 199, "originalPrice": 199, "image": "https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=600", "category": "frozen-treats", "sizes": [{"name": "100ml Cup", "price": 199}], "flavors": ["Peanut Butter"], "tags": ["summer", "cooling"], "available": True},
            {"id": "frozen-002", "name": "Pup Ice Cream - Banana", "description": "Frozen banana treat", "price": 199, "originalPrice": 199, "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600", "category": "frozen-treats", "sizes": [{"name": "100ml Cup", "price": 199}], "flavors": ["Banana"], "tags": ["summer", "cooling"], "available": True},
            
            # Hampers
            {"id": "hamper-001", "name": "Birthday Bash Box", "description": "Complete birthday celebration kit", "price": 1999, "originalPrice": 2499, "image": "https://images.unsplash.com/photo-1530041539828-114de669390e?w=600", "category": "hampers", "sizes": [{"name": "Standard", "price": 1999}], "flavors": [], "tags": ["birthday", "gift", "celebration"], "available": True},
            {"id": "hamper-002", "name": "Welcome Home Box", "description": "Perfect welcome gift for new pet parents", "price": 1499, "originalPrice": 1799, "image": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600", "category": "hampers", "sizes": [{"name": "Standard", "price": 1499}], "flavors": [], "tags": ["gift", "new pet"], "available": True},
            
            # Custom Cakes
            {"id": "custom-001", "name": "Custom Photo Cake", "description": "Personalized cake with your pet's photo", "price": 1499, "originalPrice": 1499, "image": "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600", "category": "custom", "sizes": [{"name": "Small (500g)", "price": 1499}, {"name": "Medium (1kg)", "price": 2499}], "flavors": ["Peanut Butter", "Banana", "Chicken"], "tags": ["custom", "personalized", "photo"], "available": True},
            {"id": "custom-002", "name": "Custom Theme Cake", "description": "Themed cake designed to your specifications", "price": 1799, "originalPrice": 1799, "image": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600", "category": "custom", "sizes": [{"name": "Small (500g)", "price": 1799}, {"name": "Medium (1kg)", "price": 2999}], "flavors": ["Peanut Butter", "Banana", "Carrot", "Chicken"], "tags": ["custom", "themed", "special"], "available": True},
        ]
        
        # Add timestamps
        for product in sample_products:
            product["created_at"] = datetime.now(timezone.utc).isoformat()
            product["synced_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.products.insert_many(sample_products)
        logger.info(f"Seeded {len(sample_products)} initial products")
        
    except Exception as e:
        logger.error(f"Error seeding products: {e}")

async def verify_admin_auth(
    credentials: HTTPBasicCredentials = Depends(security),
    bearer_creds: HTTPAuthorizationCredentials = Depends(security_bearer)
):
    """Verify admin credentials - supports both Basic Auth and Bearer Token. Use as a dependency."""
    # Try Bearer Token first (from JWT login)
    if bearer_creds and bearer_creds.credentials:
        try:
            payload = jwt.decode(bearer_creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            role = payload.get("role")
            if username and role == "admin":
                return username
        except jwt.PyJWTError:
            pass  # Fall through to try Basic Auth
    
    # Try Basic Auth
    if credentials and credentials.username and credentials.password:
        expected_username = _admin_credentials_cache.get("username") or ADMIN_USERNAME
        expected_password = _admin_credentials_cache.get("password") or ADMIN_PASSWORD
        
        correct_username = secrets.compare_digest(credentials.username, expected_username)
        correct_password = secrets.compare_digest(credentials.password, expected_password)
        
        if correct_username and correct_password:
            return credentials.username
    
    # Neither auth method worked
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials"
    )


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials - Basic Auth only. For legacy endpoint calls."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Basic Auth credentials required",
            headers={"WWW-Authenticate": "Basic"}
        )
    
    expected_username = _admin_credentials_cache.get("username") or ADMIN_USERNAME
    expected_password = _admin_credentials_cache.get("password") or ADMIN_PASSWORD
    
    correct_username = secrets.compare_digest(credentials.username, expected_username)
    correct_password = secrets.compare_digest(credentials.password, expected_password)
    
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    return credentials.username


# ==================== ADMIN CREDENTIAL MANAGEMENT ====================

@app.post("/api/admin/reset-credentials")
async def reset_admin_credentials(data: AdminCredentialReset):
    """
    Reset admin credentials using a secret token.
    This allows recovery when locked out of admin panel.
    
    Usage: POST /api/admin/reset-credentials
    Body: {"reset_token": "your-secret-token", "new_username": "admin", "new_password": "newpass"}
    """
    # Verify reset token
    if not secrets.compare_digest(data.reset_token, ADMIN_RESET_TOKEN):
        raise HTTPException(status_code=403, detail="Invalid reset token")
    
    # Validate new credentials
    if len(data.new_username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Update credentials in database
    await db.admin_config.update_one(
        {"type": "credentials"},
        {
            "$set": {
                "username": data.new_username,
                "password": data.new_password,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    # Update cache immediately
    global _admin_credentials_cache
    _admin_credentials_cache["username"] = data.new_username
    _admin_credentials_cache["password"] = data.new_password
    _admin_credentials_cache["loaded"] = True
    
    logger.info(f"Admin credentials reset for user: {data.new_username}")
    
    return {
        "success": True,
        "message": f"Admin credentials updated. You can now log in as '{data.new_username}'",
        "username": data.new_username
    }

@app.get("/api/admin/credential-status")
async def check_credential_status():
    """Check if admin credentials are configured (no auth required)"""
    has_db_creds = await db.admin_config.find_one({"type": "credentials"}) is not None
    return {
        "has_database_credentials": has_db_creds,
        "using_env_fallback": not has_db_creds,
        "cache_loaded": _admin_credentials_cache.get("loaded", False)
    }


# ==================== MODELS (imported from models.py) ====================
# All Pydantic models are now in /app/backend/models.py



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
            "to": NOTIFICATION_EMAIL,  # Resend expects a string
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


# Note: /api/mira/chat is now handled by mira_routes.py (new Mira AI system)
# This legacy endpoint is kept as fallback - renamed to /mira/chat-legacy
@api_router.post("/mira/chat-legacy")
async def chat_with_mira_legacy(request: ChatRequest):
    user_query = request.message
    session_id = request.session_id or str(uuid.uuid4())
    
    # ==================== PET SOUL INTEGRATION ====================
    user_pets = []
    user_info = None
    pet_soul_context = ""
    
    if request.auth_token:
        try:
            token = request.auth_token.replace("Bearer ", "")
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            user_email = payload.get("sub") or payload.get("email")
            user_id = payload.get("user_id")
            logger.info(f"Mira chat: user_email={user_email}, user_id={user_id}")
            
            if user_email or user_id:
                # First, try to get pets from member record
                member_queries = []
                if user_email:
                    member_queries.append({"email": user_email})
                if user_id:
                    member_queries.append({"_id": user_id})
                    member_queries.append({"id": user_id})
                
                member = None
                for query in member_queries:
                    member = await db.members.find_one(query)
                    if member:
                        break
                
                pets = []
                if member:
                    user_info = {"name": member.get("name"), "email": member.get("email")}
                    member_pets = member.get("pets", [])
                    
                    # Member.pets might be list of IDs or list of objects
                    if member_pets:
                        if isinstance(member_pets[0], str):
                            # It's a list of pet IDs - look them up
                            for pet_id in member_pets:
                                pet_doc = await db.pets.find_one({"id": pet_id}, {"_id": 0})
                                if pet_doc:
                                    pets.append(pet_doc)
                            logger.info(f"Mira loaded {len(pets)} pets by ID lookup for {user_email}")
                        elif isinstance(member_pets[0], dict):
                            # It's already full pet objects
                            pets = member_pets
                            logger.info(f"Mira loaded {len(pets)} pets from member record for {user_email}")
                
                # Fallback: try pets collection directly
                if not pets:
                    pet_queries = []
                    if user_email:
                        pet_queries.append({"user_email": user_email})
                        pet_queries.append({"user_id": user_email})
                    if user_id:
                        pet_queries.append({"user_id": user_id})
                    
                    for query in pet_queries:
                        found_pets = await db.pets.find(query, {"_id": 0}).to_list(10)
                        if found_pets:
                            pets = found_pets
                            logger.info(f"Mira found {len(pets)} pets from pets collection for {user_email}")
                            break
                
                if pets:
                    user_pets = pets
                    pet_soul_context = "\n\n🐾 **USER'S PET PROFILES (Use this information naturally in conversation)**:\n"
                    for pet in pets:
                        identity = pet.get("identity", {})
                        soul = pet.get("soul", {})
                        preferences = pet.get("preferences", {})
                        
                        pet_name = pet.get('name', 'Pet')
                        breed = identity.get('breed', pet.get('breed', 'Unknown'))
                        species = pet.get('species', 'dog')
                        
                        pet_soul_context += f"""
**{pet_name}** - {breed} ({species})
- Age: {identity.get('age', pet.get('age', pet.get('age_years', 'Unknown')))} 
- Weight: {identity.get('weight', pet.get('weight', 'Not specified'))}
"""
                        # Add allergies (CRITICAL for recommendations)
                        allergies = preferences.get('allergies', pet.get('allergies', []))
                        if allergies:
                            if isinstance(allergies, list) and allergies:
                                pet_soul_context += f"- ⚠️ ALLERGIES: {', '.join(allergies)} - NEVER recommend products with these ingredients!\n"
                            elif isinstance(allergies, str) and allergies and allergies.lower() != 'none':
                                pet_soul_context += f"- ⚠️ ALLERGIES: {allergies} - NEVER recommend products with these ingredients!\n"
                        
                        # Add preferences (for personalized recommendations)
                        if preferences:
                            fav_flavors = preferences.get('favorite_flavors', [])
                            if fav_flavors:
                                pet_soul_context += f"- Favorite flavors: {', '.join(fav_flavors) if isinstance(fav_flavors, list) else fav_flavors}\n"
                            treat_texture = preferences.get('treat_texture') or preferences.get('texture_preference')
                            if treat_texture:
                                pet_soul_context += f"- Prefers {treat_texture} treats\n"
                            treat_size = preferences.get('treat_size')
                            if treat_size:
                                pet_soul_context += f"- Treat size: {treat_size}\n"
                            activity = preferences.get('activity_level')
                            if activity:
                                pet_soul_context += f"- Activity level: {activity}\n"
                        
                        # Add personality (for engagement style)
                        if soul:
                            persona = soul.get('persona', '')
                            if persona:
                                pet_soul_context += f"- Personality: {persona.replace('_', ' ').title()}\n"
                            love_lang = soul.get('love_language')
                            if love_lang:
                                pet_soul_context += f"- Love language: {love_lang}\n"
                            personality_tag = soul.get('personality_tag')
                            if personality_tag:
                                pet_soul_context += f"- Known as: \"{personality_tag}\"\n"
                        
                        pet_soul_context += "\n"
                    logger.info(f"Mira loaded {len(user_pets)} pets for user with full soul context")
                    
        except Exception as e:
            logger.warning(f"Mira Pet Soul fetch: {e}")
    
    # Pillar context from current page
    pillar_context = ""
    if request.current_page:
        page = request.current_page.lower()
        pillar_map = {
            '/celebrate': "CELEBRATE pillar (cakes, treats)",
            '/dine': "DINE pillar (pet-friendly restaurants)",
            '/stay': "STAY pillar (pet-friendly hotels, boarding)",
            '/travel': "TRAVEL pillar (pet travel, relocation)",
            '/care': "CARE pillar (grooming, vet services)",
            '/enjoy': "ENJOY pillar (events, experiences)",
            '/fit': "FIT pillar (fitness, weight management)",
            '/advisory': "ADVISORY pillar (expert consultations)",
            '/paperwork': "PAPERWORK pillar (documents, records)",
            '/emergency': "EMERGENCY pillar (urgent help, lost pet)",
        }
        for path, context in pillar_map.items():
            if path in page:
                pillar_context = f"User is browsing {context}"
                break
    
    # ==================== WEB SEARCH ====================
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
You are Mira® — the intelligent heart of The Doggy Company's Pet Life Operating System. You are a Pet-First Concierge who KNOWS each pet personally through their Pet Soul™ profile.

🎯 YOUR SUPERPOWER: You remember EVERYTHING about each pet - their allergies, preferences, personality, favorite treats. Use this knowledge naturally in EVERY response.

CRITICAL RULES FOR EVERY INTERACTION:
1. When a user mentions buying/shopping, IMMEDIATELY reference their pet's specific preferences and allergies
2. NEVER ask questions you already know the answer to from Pet Soul data
3. Speak as if you've known the pet for years - use their name, mention their personality
4. When recommending products, ALWAYS check allergies first and explain why you're recommending something specific

EXAMPLE CONVERSATION (This is how you MUST respond):
User: "I want to buy some treats"
Mira: "Hi Sahasra! Treats for Bruno? 🐾 I remember he's allergic to **chicken**, so I'll make sure to avoid those. Since he loves **peanut butter** and is a **Golden Retriever** (medium size), I'd recommend our Peanut Butter Training Bites - they're perfect for his size and completely chicken-free! Want me to add them to your cart?"

PERSONALIZATION REQUIREMENTS:
- If user has ONE pet: Address by pet name immediately ("Perfect choice for [Pet Name]!")
- If user has MULTIPLE pets: Ask "Which furry friend is this for - [Pet1], [Pet2], or [Pet3]?"
- Once pet is identified: Use their data in EVERY recommendation
- Reference allergies BEFORE suggesting any food product
- Mention breed when it's relevant (size, energy level, breed-specific needs)
- Use personality traits to make conversation warm ("I know [Pet] is a mischief maker, so...")

⚠️ MANDATORY ALLERGY CHECK:
Before recommending ANY food product:
1. Check if pet has allergies in their profile
2. If allergies exist, EXPLICITLY state: "Since [Pet] is allergic to [allergen], I'm recommending [product] which is [allergen]-free"
3. NEVER recommend products containing allergens

COMMUNICATION STYLE
- Warm, knowledgeable, like a friend who knows your pet
- Use pet's name multiple times
- Reference specific details from their profile naturally
- Bold all product names, key details using **text**
- NO generic responses - every response should feel personalized
- Keep responses focused and actionable

THE 14 PILLARS (All Pet-Focused)
**CELEBRATE** — Pet birthday cakes, gotcha day celebrations, custom treats
**DINE** — Pet-friendly restaurants where pets can join their humans
**STAY** — Pet-friendly hotels, boarding, pet daycare during human travel
**TRAVEL** — Pet relocation, pet travel documentation, pet transport
**CARE** — Veterinary, grooming, pet wellness
**ENJOY** — Pet events, dog parks, pet activities
**FIT** — Pet fitness, weight management, exercise programmes
**LEARN** — Pet training, behaviour courses, agility classes
**PAPERWORK** — Pet documents, health records, certifications
**ADVISORY** — Expert consultations, guidance, recommendations
**EMERGENCY** — 24/7 urgent pet help, lost pet assistance
**FAREWELL** — End-of-life services for pets
**ADOPT** — Pet adoption services
**SHOP** — Premium pet products, nutrition, supplies (CHECK ALLERGIES!)

TRAVEL-SPECIFIC RULE:
When someone mentions travel/hotels/trips, ask: "Will [Pet Name] be joining you on this trip?"

RESPONSE FORMAT
- Acknowledge user by name if known
- Reference pet by name immediately
- Include relevant pet data (allergies, preferences, personality)
- Bold **important details**
- End with clear next step or question
- Professional warmth throughout"""

        # Build full context
        full_context = f"""{pet_soul_context}

{pillar_context}

SEARCH CONTEXT:
{search_results}

CURRENT CONVERSATION:
Guest: {user_query}"""

        # Construct Conversation History with explicit state tracking
        history_text = ""
        collected_info = {
            "pet_name": user_pets[0].get('name') if user_pets else None,
            "breed": user_pets[0].get('identity', {}).get('breed', user_pets[0].get('breed')) if user_pets else None,
            "age": user_pets[0].get('identity', {}).get('age', user_pets[0].get('age')) if user_pets else None,
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
        
        # Create admin notification
        await db.admin_notifications.insert_one({
            "type": "custom_cake",
            "title": f"🎨 New Custom Cake Design Request - {name}",
            "message": f"Reference image uploaded. Notes: {notes[:100] if notes else 'No notes provided'}",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "link": f"/admin?tab=servicedesk&ticket={ticket_id}"
        })
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


@api_router.post("/upload/about-image")
async def upload_about_image(file: UploadFile = File(...)):
    """Upload an image for About page (dogs, team)"""
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload JPG, PNG, or WebP images.")
    
    os.makedirs("uploads/about", exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1] or '.jpg'
    unique_filename = f"about-{uuid.uuid4().hex[:12]}{file_extension}"
    file_path = f"uploads/about/{unique_filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "message": "Image uploaded successfully",
            "url": f"/uploads/about/{unique_filename}",
            "filename": unique_filename
        }
    except Exception as e:
        logger.error(f"Failed to save about image: {e}")
        raise HTTPException(status_code=500, detail="Failed to save image")


# ==================== ADMIN ROUTES ====================

# Admin email for password reset
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "dipali@clubconcierge.in")

@admin_router.post("/login")
async def admin_login(request: AdminLoginRequest):
    """Verify admin login and return JWT token"""
    # Check database credentials first, then fall back to env
    expected_username = _admin_credentials_cache.get("username") or ADMIN_USERNAME
    expected_password = _admin_credentials_cache.get("password") or ADMIN_PASSWORD
    
    if request.username == expected_username and request.password == expected_password:
        # Generate JWT token for admin
        token_data = {
            "sub": request.username,
            "role": "admin",
            "exp": datetime.now(timezone.utc) + timedelta(days=7)
        }
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        return {"success": True, "message": "Login successful", "token": token}
    raise HTTPException(status_code=401, detail="Invalid credentials")


@admin_router.post("/forgot-password")
async def forgot_password(email: str = Body(..., embed=True)):
    """Send password reset email to admin"""
    if email.lower() != ADMIN_EMAIL.lower():
        # Don't reveal if email exists or not for security
        return {"success": True, "message": "If this email is registered, you will receive a reset link"}
    
    # Generate reset token (valid for 1 hour)
    import secrets
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token in database
    await db.admin_password_resets.delete_many({"email": email.lower()})  # Remove old tokens
    await db.admin_password_resets.insert_one({
        "email": email.lower(),
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send reset email
    try:
        frontend_url = os.environ.get("FRONTEND_URL", "https://thedoggycompany.in")
        reset_link = f"{frontend_url}/admin/reset-password?token={reset_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', sans-serif; background: #f8f4f0; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%); padding: 30px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; font-size: 24px; }}
                .content {{ padding: 30px; text-align: center; }}
                .btn {{ display: inline-block; background: #e91e63; color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; margin: 20px 0; }}
                .warning {{ background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 14px; color: #e65100; }}
                .footer {{ text-align: center; padding: 20px; background: #f8f4f0; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🐾 Password Reset</h1>
                </div>
                <div class="content">
                    <p>Hi Admin,</p>
                    <p>We received a request to reset your password for The Doggy Company Admin Panel.</p>
                    <a href="{reset_link}" class="btn">Reset My Password</a>
                    <div class="warning">
                        ⏰ This link expires in <strong>1 hour</strong>.<br>
                        If you didn't request this, please ignore this email.
                    </div>
                </div>
                <div class="footer">
                    <p>The Doggy Company - Your Pet's Life Operating System</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": ADMIN_EMAIL,  # Resend expects a string
            "subject": "🔐 Password Reset - The Doggy Company Admin",
            "html": html_content
        })
        logger.info(f"Password reset email sent to {ADMIN_EMAIL}")
        
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        # Still return success to not reveal email existence
    
    return {"success": True, "message": "If this email is registered, you will receive a reset link"}


@admin_router.post("/reset-password")
async def reset_password(token: str = Body(...), new_password: str = Body(...)):
    """Reset password using token"""
    global _admin_credentials_cache
    
    # Find valid token
    reset_record = await db.admin_password_resets.find_one({
        "token": token,
        "used": False
    })
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    
    # Check if expired
    expires_at = datetime.fromisoformat(reset_record["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")
    
    # Validate password
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Update password in admin_config
    await db.admin_config.update_one(
        {},
        {"$set": {
            "username": _admin_credentials_cache.get("username") or ADMIN_USERNAME,
            "password": new_password,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Mark token as used
    await db.admin_password_resets.update_one(
        {"token": token},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Update cache
    _admin_credentials_cache["password"] = new_password
    _admin_credentials_cache["loaded"] = True
    
    # Send confirmation email
    try:
        resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": ADMIN_EMAIL,  # Resend expects a string
            "subject": "✅ Password Changed - The Doggy Company Admin",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #e91e63;">🔐 Password Changed Successfully</h2>
                <p>Your admin password for The Doggy Company has been updated.</p>
                <p>If you did not make this change, please contact support immediately.</p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">Time: {datetime.now(timezone.utc).strftime('%d %b %Y, %I:%M %p UTC')}</p>
            </div>
            """
        })
    except Exception as e:
        logger.error(f"Failed to send password change confirmation: {e}")
    
    logger.info("Admin password reset successfully")
    return {"success": True, "message": "Password reset successfully. You can now login with your new password."}


@admin_router.post("/force-seed-credentials")
async def force_seed_admin_credentials():
    """
    Emergency endpoint to force reset admin credentials from environment variables.
    This can be called if admin is locked out.
    Protected by checking a special header for the MONGO_URL first 8 chars as verification.
    """
    global _admin_credentials_cache
    
    try:
        # Delete existing admin config
        await db.admin_config.delete_many({"type": "credentials"})
        
        # Re-create with env credentials
        await db.admin_config.insert_one({
            "type": "credentials",
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "force_seeded": True
        })
        
        # Update cache
        _admin_credentials_cache["username"] = ADMIN_USERNAME
        _admin_credentials_cache["password"] = ADMIN_PASSWORD
        _admin_credentials_cache["loaded"] = True
        
        logger.info(f"Force-seeded admin credentials: {ADMIN_USERNAME}")
        
        return {
            "success": True, 
            "message": f"Admin credentials reset to defaults. Username: {ADMIN_USERNAME}",
            "username": ADMIN_USERNAME
        }
    except Exception as e:
        logger.error(f"Failed to force seed credentials: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/force-seed-all-products")
async def force_seed_all_products():
    """
    Emergency endpoint to seed all pillar products.
    Call this on production to populate shop pages.
    No auth required for emergency seeding.
    """
    from datetime import datetime, timezone
    import uuid
    
    try:
        results = {"seeded": {}, "total": 0}
        
        # ========== STAY PRODUCTS ==========
        stay_products = [
            {"id": "stay-hotel-1", "name": "Pet-Friendly Hotel Stay", "description": "Luxurious pet-friendly hotel with dedicated pet amenities", "price": 5000, "category": "hotel", "pillar": "stay", "tags": ["Stay", "Pet-Friendly", "Hotel", "Luxury"], "in_stock": True},
            {"id": "stay-resort-1", "name": "Resort Getaway with Pets", "description": "Premium resort experience for you and your furry friend", "price": 8000, "category": "resort", "pillar": "stay", "tags": ["Stay", "Resort", "Premium", "Vacation"], "in_stock": True},
            {"id": "stay-villa-1", "name": "Private Villa Rental", "description": "Entire private villa with yard for pets to run free", "price": 12000, "category": "villa", "pillar": "stay", "tags": ["Stay", "Villa", "Private", "Spacious"], "in_stock": True},
            {"id": "stay-farmstay-1", "name": "Countryside Farmstay", "description": "Rustic farmstay experience with open spaces for pets", "price": 3500, "category": "farmstay", "pillar": "stay", "tags": ["Stay", "Farm", "Nature", "Rustic"], "in_stock": True},
            {"id": "stay-boarding-1", "name": "Premium Pet Boarding", "description": "24/7 care boarding facility with webcam access", "price": 1500, "category": "boarding", "pillar": "stay", "tags": ["Stay", "Boarding", "Care", "Premium"], "in_stock": True},
            {"id": "stay-boarding-2", "name": "Standard Pet Boarding", "description": "Comfortable boarding with daily walks and playtime", "price": 800, "category": "boarding", "pillar": "stay", "tags": ["Stay", "Boarding", "Standard"], "in_stock": True},
            {"id": "stay-homestay-1", "name": "Home-style Pet Boarding", "description": "Your pet stays in a loving home environment", "price": 1000, "category": "homestay", "pillar": "stay", "tags": ["Stay", "Homestay", "Family"], "in_stock": True},
            {"id": "stay-daycare-1", "name": "Pet Daycare - Full Day", "description": "Full day daycare with playtime and socialization", "price": 600, "category": "daycare", "pillar": "stay", "tags": ["Stay", "Daycare", "Play"], "in_stock": True},
        ]
        
        for p in stay_products:
            p["created_at"] = datetime.now(timezone.utc).isoformat()
            p["image"] = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800"
            await db.products.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
        results["seeded"]["stay"] = len(stay_products)
        
        # ========== TRAVEL PRODUCTS ==========
        travel_products = [
            {"id": "travel-cab-1", "name": "Pet-Friendly Cab Service", "description": "AC cab rides for you and your pet", "price": 1500, "category": "cab", "pillar": "travel", "tags": ["Travel", "Cab", "Pet Transport"], "in_stock": True},
            {"id": "travel-train-1", "name": "Train Travel Assistance", "description": "Complete train travel documentation and support", "price": 3000, "category": "train", "pillar": "travel", "tags": ["Travel", "Train", "Intercity"], "in_stock": True},
            {"id": "travel-flight-1", "name": "Domestic Flight Coordination", "description": "Full support for flying with your pet", "price": 15000, "category": "flight", "pillar": "travel", "tags": ["Travel", "Flight", "Domestic"], "in_stock": True},
            {"id": "travel-relocation-1", "name": "Pet Relocation Service", "description": "Premium door-to-door pet relocation", "price": 50000, "category": "relocation", "pillar": "travel", "tags": ["Travel", "Relocation", "International"], "in_stock": True},
            {"id": "travel-taxi-1", "name": "Pet Taxi - City Rides", "description": "On-demand pet taxi for local trips", "price": 500, "category": "taxi", "pillar": "travel", "tags": ["Travel", "Taxi", "City"], "in_stock": True},
        ]
        
        for p in travel_products:
            p["created_at"] = datetime.now(timezone.utc).isoformat()
            p["image"] = "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800"
            await db.products.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
        results["seeded"]["travel"] = len(travel_products)
        
        # ========== CARE PRODUCTS ==========
        care_products = [
            {"id": "care-grooming-1", "name": "Full Grooming Package", "description": "Complete grooming: bath, haircut, nail trim, ear cleaning", "price": 1500, "category": "grooming", "pillar": "care", "tags": ["Care", "Grooming", "Full Service"], "in_stock": True},
            {"id": "care-bath-1", "name": "Bath & Brush", "description": "Refreshing bath with shampoo and brushing", "price": 600, "category": "grooming", "pillar": "care", "tags": ["Care", "Bath", "Basic"], "in_stock": True},
            {"id": "care-walk-1", "name": "Daily Dog Walking", "description": "30-minute daily walks with GPS tracking", "price": 500, "category": "walks", "pillar": "care", "tags": ["Care", "Walks", "Daily"], "in_stock": True},
            {"id": "care-sitting-1", "name": "Pet Sitting (8 hours)", "description": "Professional pet sitting at your home", "price": 1200, "category": "sitting", "pillar": "care", "tags": ["Care", "Sitting", "Home Visit"], "in_stock": True},
            {"id": "care-training-1", "name": "Basic Obedience Training", "description": "5-session package for basic commands", "price": 5000, "category": "training", "pillar": "care", "tags": ["Care", "Training", "Obedience"], "in_stock": True},
            {"id": "care-vet-1", "name": "Vet Consultation Booking", "description": "Book appointments with trusted vets", "price": 300, "category": "vet", "pillar": "care", "tags": ["Care", "Vet", "Health"], "in_stock": True},
        ]
        
        for p in care_products:
            p["created_at"] = datetime.now(timezone.utc).isoformat()
            p["image"] = "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800"
            await db.products.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
        results["seeded"]["care"] = len(care_products)
        
        # ========== FIT PRODUCTS ==========
        fit_products = [
            {"id": "fit-assessment-1", "name": "Fitness Assessment", "description": "Comprehensive fitness evaluation with personalized plan", "price": 1500, "category": "assessment", "pillar": "fit", "tags": ["Fit", "Assessment", "Health"], "in_stock": True},
            {"id": "fit-weight-1", "name": "Weight Management Program", "description": "8-week weight management with diet plan", "price": 5000, "category": "weight", "pillar": "fit", "tags": ["Fit", "Weight", "Program"], "in_stock": True},
            {"id": "fit-swim-1", "name": "Hydrotherapy Session", "description": "Low-impact swimming therapy", "price": 800, "category": "therapy", "pillar": "fit", "tags": ["Fit", "Swimming", "Therapy"], "in_stock": True},
            {"id": "fit-agility-1", "name": "Agility Training Class", "description": "Fun obstacle course training", "price": 1000, "category": "agility", "pillar": "fit", "tags": ["Fit", "Agility", "Training"], "in_stock": True},
        ]
        
        for p in fit_products:
            p["created_at"] = datetime.now(timezone.utc).isoformat()
            p["image"] = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800"
            await db.products.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
        results["seeded"]["fit"] = len(fit_products)
        
        # ========== ENJOY PRODUCTS ==========
        enjoy_products = [
            {"id": "enjoy-park-1", "name": "Dog Park Day Pass", "description": "Full day access to premium dog park", "price": 500, "category": "park", "pillar": "enjoy", "tags": ["Enjoy", "Park", "Play"], "in_stock": True},
            {"id": "enjoy-cafe-1", "name": "Pet Cafe Voucher", "description": "Treat for pet-friendly cafe visit", "price": 800, "category": "cafe", "pillar": "enjoy", "tags": ["Enjoy", "Cafe", "Outing"], "in_stock": True},
            {"id": "enjoy-beach-1", "name": "Beach Day Experience", "description": "Guided beach outing for pets", "price": 1500, "category": "beach", "pillar": "enjoy", "tags": ["Enjoy", "Beach", "Adventure"], "in_stock": True},
        ]
        
        for p in enjoy_products:
            p["created_at"] = datetime.now(timezone.utc).isoformat()
            p["image"] = "https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=800"
            await db.products.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
        results["seeded"]["enjoy"] = len(enjoy_products)
        
        # ========== LEARN PRODUCTS ==========
        learn_products = [
            {"id": "learn-puppy-1", "name": "Puppy Training Course", "description": "8-week puppy foundation training", "price": 8000, "category": "puppy", "pillar": "learn", "tags": ["Learn", "Puppy", "Training"], "in_stock": True},
            {"id": "learn-behavior-1", "name": "Behavior Modification", "description": "Address specific behavioral issues", "price": 6000, "category": "behavior", "pillar": "learn", "tags": ["Learn", "Behavior", "Training"], "in_stock": True},
            {"id": "learn-tricks-1", "name": "Fun Tricks Workshop", "description": "Learn cool tricks and commands", "price": 2000, "category": "tricks", "pillar": "learn", "tags": ["Learn", "Tricks", "Fun"], "in_stock": True},
        ]
        
        for p in learn_products:
            p["created_at"] = datetime.now(timezone.utc).isoformat()
            p["image"] = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800"
            await db.products.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
        results["seeded"]["learn"] = len(learn_products)
        
        # Calculate total
        results["total"] = sum(results["seeded"].values())
        
        logger.info(f"Force-seeded {results['total']} products across all pillars")
        
        return {
            "success": True,
            "message": f"Seeded {results['total']} products across all pillars",
            "details": results["seeded"]
        }
        
    except Exception as e:
        logger.error(f"Failed to force seed products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/change-password")
async def change_password(
    current_password: str = Body(...),
    new_password: str = Body(...),
    username: str = Depends(verify_admin)
):
    """Change password (for logged-in admin) and send email notification"""
    global _admin_credentials_cache
    
    expected_password = _admin_credentials_cache.get("password") or ADMIN_PASSWORD
    
    if current_password != expected_password:
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Update password
    await db.admin_config.update_one(
        {},
        {"$set": {
            "username": _admin_credentials_cache.get("username") or ADMIN_USERNAME,
            "password": new_password,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Update cache
    _admin_credentials_cache["password"] = new_password
    
    # Send notification email to admin
    try:
        change_time = datetime.now(timezone.utc).strftime("%d %B %Y at %H:%M UTC")
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', sans-serif; background: #f8f4f0; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); padding: 30px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; font-size: 24px; }}
                .content {{ padding: 30px; text-align: center; }}
                .info-box {{ background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; }}
                .warning {{ background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 14px; color: #e65100; }}
                .footer {{ text-align: center; padding: 20px; background: #f8f4f0; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Password Changed</h1>
                </div>
                <div class="content">
                    <p>Hi Admin,</p>
                    <p>Your admin panel password was successfully changed.</p>
                    <div class="info-box">
                        <strong>Changed by:</strong> {username}<br>
                        <strong>Date:</strong> {change_time}
                    </div>
                    <div class="warning">
                        ⚠️ If you did not make this change, please contact support immediately and reset your password.
                    </div>
                </div>
                <div class="footer">
                    <p>The Doggy Company - Your Pet's Life Operating System</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": ADMIN_EMAIL,
            "subject": "🔐 Admin Password Changed - The Doggy Company",
            "html": html_content
        })
        logger.info(f"Password change notification sent to {ADMIN_EMAIL}")
    except Exception as e:
        logger.error(f"Failed to send password change notification: {e}")
    
    logger.info("Admin password changed successfully")
    return {"success": True, "message": "Password changed successfully"}


# ==================== DATA MIGRATION ENDPOINTS ====================

@admin_router.post("/data/link-pets-to-users")
async def link_pets_to_users(username: str = Depends(verify_admin)):
    """
    Data migration: Link pets to their owners by adding user_id field.
    This fixes the Smart Recommendations feature that relies on user_id.
    
    The script:
    1. Iterates through all pets in the database
    2. For each pet with an owner_email, finds the corresponding user
    3. Updates the pet with the user's user_id
    """
    logger.info("Starting pet-to-user linking migration...")
    
    stats = {
        "total_pets": 0,
        "linked": 0,
        "already_linked": 0,
        "no_owner_email": 0,
        "owner_not_found": 0,
        "errors": []
    }
    
    try:
        # Get all pets
        pets = await db.pets.find({}).to_list(None)
        stats["total_pets"] = len(pets)
        
        for pet in pets:
            pet_id = pet.get("id", str(pet.get("_id", "unknown")))
            
            # Skip if already has user_id
            if pet.get("user_id"):
                stats["already_linked"] += 1
                continue
            
            # Get owner email
            owner_email = pet.get("owner_email")
            if not owner_email:
                stats["no_owner_email"] += 1
                continue
            
            # Find the user by email - check multiple collections
            user = await db.users.find_one({"email": owner_email})
            if not user:
                user = await db.members.find_one({"email": owner_email})
            
            if not user:
                stats["owner_not_found"] += 1
                stats["errors"].append(f"Pet {pet_id}: No user found for email {owner_email}")
                continue
            
            # Get user_id - try multiple field names
            user_id = user.get("id") or user.get("user_id") or str(user.get("_id"))
            
            if user_id:
                # Update the pet with user_id
                await db.pets.update_one(
                    {"id": pet_id} if "id" in pet else {"_id": pet["_id"]},
                    {"$set": {"user_id": user_id}}
                )
                stats["linked"] += 1
                logger.info(f"Linked pet {pet_id} to user {user_id}")
            else:
                stats["errors"].append(f"Pet {pet_id}: User found but no valid ID")
        
        logger.info(f"Migration complete: {stats}")
        return {
            "success": True,
            "message": f"Linked {stats['linked']} pets to their owners",
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "stats": stats
        }


@admin_router.post("/data/create-test-user")
async def create_test_user(
    email: str = "dipali@mindescapes.in",
    password: str = "mynx123",
    name: str = "Dipali Test",
    username: str = Depends(verify_admin)
):
    """Create a test user for testing the member journey."""
    logger.info(f"Creating test user: {email}")
    
    # Check if user exists
    existing = await db.users.find_one({"email": email})
    if existing:
        # Update the password if user exists (useful for resetting test accounts)
        hashed_password = pwd_context.hash(password)
        await db.users.update_one(
            {"email": email},
            {"$set": {"password_hash": hashed_password, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {
            "success": True,
            "message": f"User {email} password updated",
            "user_id": existing.get("id") or str(existing.get("_id"))
        }
    
    # Create new user
    user_id = f"user-{uuid.uuid4().hex[:12]}"
    hashed_password = pwd_context.hash(password)
    
    new_user = {
        "id": user_id,
        "email": email,
        "password_hash": hashed_password,  # Use password_hash field name
        "name": name,
        "role": "member",
        "membership_tier": "standard",
        "paw_points": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(new_user)
    
    # Also add to members collection for consistency
    member_doc = {
        "id": user_id,
        "user_id": user_id,
        "email": email,
        "name": name,
        "role": "member",
        "membership_tier": "standard",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.members.insert_one(member_doc)
    
    logger.info(f"Test user created: {email} with ID {user_id}")
    return {
        "success": True,
        "message": f"Test user created: {email}",
        "user_id": user_id,
        "credentials": {
            "email": email,
            "password": password
        }
    }


@admin_router.get("/data/pets-status")
async def get_pets_status(username: str = Depends(verify_admin)):
    """Check the status of pets in the database - how many have user_id, owner_email, etc."""
    
    total_pets = await db.pets.count_documents({})


@admin_router.post("/data/seed-stays")
async def seed_pet_friendly_stays(username: str = Depends(verify_admin)):
    """Seed pet-friendly stays from curated data."""
    
    stays_data = [
        {"name": "Wildernest Nature Resort", "city": "Chorao", "state": "Goa", "type": "Resort", "description": "Pet-friendly nature resort with cottage stays", "image_url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", "website": "https://wildernest.in", "phone": None, "address": "Chorao Island, Goa", "pet_policy": "Dogs welcome, size restrictions may apply", "price_range": "₹5,000-15,000", "amenities": "Nature trails, Bird watching, Cottages"},
        {"name": "Shaam-e-Sarhad Village Resort", "city": "Hodka", "state": "Gujarat", "type": "Homestay", "description": "Traditional Kutchi bhunga stays with pet-friendly policies", "image_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800", "website": "https://hodkavillage.com", "phone": None, "address": "Hodka Village, Kutch", "pet_policy": "Pets welcome with prior notice", "price_range": "₹3,000-8,000", "amenities": "Traditional stays, Cultural experience, Open spaces"},
        {"name": "The Paul Bangalore", "city": "Bangalore", "state": "Karnataka", "type": "Hotel", "description": "Luxury urban hotel welcoming pets", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "website": "https://thepaul.in", "phone": None, "address": "Domlur, Bangalore", "pet_policy": "Pet-friendly rooms available", "price_range": "₹8,000-20,000", "amenities": "City hotel, Room service, Garden"},
        {"name": "Reni Pani Jungle Lodge", "city": "Satpura", "state": "Madhya Pradesh", "type": "Resort", "description": "Safari lodge with pet-friendly cottages", "image_url": "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800", "website": "https://renipanijunglelodge.com", "phone": None, "address": "Satpura Tiger Reserve", "pet_policy": "Dogs welcome in designated cottages", "price_range": "₹15,000-30,000", "amenities": "Safari, Nature walks, Pool"},
        {"name": "The Postcard Gir", "city": "Gir", "state": "Gujarat", "type": "Resort", "description": "Luxury wildlife resort near Gir National Park", "image_url": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", "website": "https://postcard.in", "phone": None, "address": "Near Gir National Park", "pet_policy": "Pet-friendly with restrictions", "price_range": "₹20,000-50,000", "amenities": "Wildlife safari, Spa, Fine dining"},
        {"name": "Zostel Mukteshwar", "city": "Mukteshwar", "state": "Uttarakhand", "type": "Hostel", "description": "Budget-friendly hostel with mountain views", "image_url": "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800", "website": "https://zostel.com", "phone": None, "address": "Mukteshwar, Uttarakhand", "pet_policy": "Pets welcome in private rooms", "price_range": "₹1,500-4,000", "amenities": "Mountain views, Common areas, Budget stays"},
        {"name": "SaffronStays Himalaica", "city": "Jibhi", "state": "Himachal Pradesh", "type": "Villa", "description": "Cozy mountain villa with pet-friendly policies", "image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", "website": "https://saffronstays.com", "phone": None, "address": "Jibhi, Tirthan Valley", "pet_policy": "Dogs welcome", "price_range": "₹6,000-12,000", "amenities": "Mountain views, Bonfire, Trekking"},
        {"name": "Ahilya Fort", "city": "Maheshwar", "state": "Madhya Pradesh", "type": "Heritage", "description": "Historic fort hotel on the Narmada river", "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", "website": "https://ahilyafort.com", "phone": None, "address": "Maheshwar, MP", "pet_policy": "Pet-friendly with advance notice", "price_range": "₹25,000-50,000", "amenities": "River views, Heritage architecture, Spa"},
        {"name": "Barefoot at Havelock", "city": "Havelock", "state": "Andaman", "type": "Resort", "description": "Beach resort with pet-friendly cottages", "image_url": "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800", "website": "https://barefoot-andaman.com", "phone": None, "address": "Radhanagar Beach, Havelock", "pet_policy": "Pets welcome in select cottages", "price_range": "₹15,000-35,000", "amenities": "Beach access, Diving, Restaurant"},
        {"name": "Evolve Back Coorg", "city": "Coorg", "state": "Karnataka", "type": "Resort", "description": "Luxury plantation resort", "image_url": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800", "website": "https://evolveback.com", "phone": None, "address": "Karadigodu, Coorg", "pet_policy": "Pet-friendly villas available", "price_range": "₹30,000-60,000", "amenities": "Plantation tours, Spa, Pool"},
        {"name": "TUTC Kohima Camp", "city": "Kohima", "state": "Nagaland", "type": "Camp", "description": "Luxury camping during Hornbill Festival", "image_url": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800", "website": "https://tutc.in", "phone": None, "address": "Kisama, Kohima", "pet_policy": "Pets allowed with prior approval", "price_range": "₹20,000-40,000", "amenities": "Luxury tents, Cultural events, Dining"},
        {"name": "Dune Eco Village", "city": "Pondicherry", "state": "Tamil Nadu", "type": "Resort", "description": "Eco-friendly beach resort", "image_url": "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800", "website": "https://duneecogroup.com", "phone": None, "address": "Pudhukuppam, Pondicherry", "pet_policy": "Pet-friendly cottages", "price_range": "₹8,000-18,000", "amenities": "Beach, Yoga, Organic food"},
    ]
    
    inserted = 0
    updated = 0
    
    for stay in stays_data:
        stay_id = f"stay-{stay['name'].lower().replace(' ', '-')[:30]}-{uuid.uuid4().hex[:6]}"
        
        # Check if exists by name and city
        existing = await db.pet_friendly_stays.find_one({
            "name": stay["name"],
            "city": stay["city"]
        })
        
        property_doc = {
            "id": existing.get("id", stay_id) if existing else stay_id,
            "name": stay["name"],
            "city": stay["city"],
            "state": stay["state"],
            "property_type": stay["type"],
            "description": stay["description"],
            "photos": [stay["image_url"]] if stay["image_url"] else ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"],
            "website": stay["website"],
            "phone": stay["phone"],
            "address": stay["address"],
            "pet_policy": {
                "description": stay["pet_policy"],
                "max_pets_per_room": 2,
                "pet_fee_per_night": 500
            },
            "price_range": stay["price_range"],
            "amenities": stay["amenities"].split(", ") if stay["amenities"] else [],
            "paw_rating": {"overall": 4.0, "comfort": 4.0, "safety": 4.0, "freedom": 4.0, "care": 4.0, "joy": 4.0},
            "status": "active",
            "featured": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if existing:
            await db.pet_friendly_stays.update_one({"_id": existing["_id"]}, {"$set": property_doc})
            updated += 1
        else:
            await db.pet_friendly_stays.insert_one(property_doc)
            inserted += 1
    
    logger.info(f"Seeded stays: {inserted} inserted, {updated} updated")
    return {"success": True, "inserted": inserted, "updated": updated, "total": len(stays_data)}


@admin_router.post("/data/seed-cafes")
async def seed_pet_friendly_cafes(username: str = Depends(verify_admin)):
    """Seed pet-friendly cafes/restaurants from curated data."""
    
    cafes_data = [
        {"name": "Third Wave Coffee", "city": "Bangalore", "state": "Karnataka", "type": "Cafe", "description": "Popular coffee chain with pet-friendly outdoor seating", "image_url": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800", "website": "https://thirdwavecoffee.in", "phone": None, "address": "Multiple locations, Bangalore", "pet_policy": "Dogs welcome in outdoor area", "cuisine": "Coffee, Light bites", "price_range": "₹300-600"},
        {"name": "Cafe Duco", "city": "Delhi", "state": "Delhi", "type": "Cafe", "description": "Pet-friendly cafe in Hauz Khas", "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800", "website": None, "phone": None, "address": "Hauz Khas Village, Delhi", "pet_policy": "All pets welcome", "cuisine": "Continental, Italian", "price_range": "₹500-1,000"},
        {"name": "Dyu Art Cafe", "city": "Bangalore", "state": "Karnataka", "type": "Cafe", "description": "Art cafe with pet-friendly garden", "image_url": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800", "website": None, "phone": None, "address": "Koramangala, Bangalore", "pet_policy": "Dogs welcome in garden area", "cuisine": "Cafe, Light meals", "price_range": "₹400-800"},
        {"name": "Smoke House Deli", "city": "Mumbai", "state": "Maharashtra", "type": "Restaurant", "description": "Popular deli with outdoor pet seating", "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800", "website": "https://smokehousedeli.in", "phone": None, "address": "Multiple locations, Mumbai", "pet_policy": "Pets welcome outdoors", "cuisine": "Continental, Deli", "price_range": "₹800-1,500"},
        {"name": "Diggin", "city": "Delhi", "state": "Delhi", "type": "Cafe", "description": "Charming cafe with pet-friendly seating", "image_url": "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800", "website": None, "phone": None, "address": "Chanakyapuri, Delhi", "pet_policy": "Dogs welcome", "cuisine": "Italian, Continental", "price_range": "₹600-1,200"},
        {"name": "Cafe Zoe", "city": "Mumbai", "state": "Maharashtra", "type": "Cafe", "description": "Industrial-style cafe welcoming pets", "image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800", "website": None, "phone": None, "address": "Parel, Mumbai", "pet_policy": "Pet-friendly outdoor seating", "cuisine": "European, Fusion", "price_range": "₹700-1,400"},
        {"name": "Blue Tokai Coffee", "city": "Multiple", "state": "Pan India", "type": "Cafe", "description": "Specialty coffee chain with select pet-friendly locations", "image_url": "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800", "website": "https://bluetokaicoffee.com", "phone": None, "address": "Multiple cities", "pet_policy": "Pets welcome in outdoor seating", "cuisine": "Coffee, Bakery", "price_range": "₹300-600"},
        {"name": "The Fatty Bao", "city": "Bangalore", "state": "Karnataka", "type": "Restaurant", "description": "Asian restaurant with pet-friendly patio", "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800", "website": None, "phone": None, "address": "Indiranagar, Bangalore", "pet_policy": "Dogs welcome on patio", "cuisine": "Asian, Pan-Asian", "price_range": "₹800-1,500"},
        {"name": "Artsy Cafe", "city": "Pune", "state": "Maharashtra", "type": "Cafe", "description": "Creative cafe space welcoming pets", "image_url": "https://images.unsplash.com/photo-1513267048331-5611cad62e41?w=800", "website": None, "phone": None, "address": "Koregaon Park, Pune", "pet_policy": "All pets welcome", "cuisine": "Cafe, Snacks", "price_range": "₹400-800"},
        {"name": "Mocha", "city": "Delhi", "state": "Delhi", "type": "Cafe", "description": "Hookah cafe with pet-friendly outdoor area", "image_url": "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800", "website": None, "phone": None, "address": "GK-2, Delhi", "pet_policy": "Pets allowed in outdoor section", "cuisine": "Cafe, Middle Eastern", "price_range": "₹500-1,000"},
        {"name": "Effingut", "city": "Pune", "state": "Maharashtra", "type": "Restaurant", "description": "Brewpub with pet-friendly seating", "image_url": "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800", "website": "https://effingut.com", "phone": None, "address": "Koregaon Park, Pune", "pet_policy": "Dogs welcome in designated areas", "cuisine": "Brewery, Continental", "price_range": "₹800-1,600"},
        {"name": "The Brew Room", "city": "Goa", "state": "Goa", "type": "Cafe", "description": "Beachside cafe welcoming pets", "image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800", "website": None, "phone": None, "address": "Anjuna, Goa", "pet_policy": "Pet-friendly beach cafe", "cuisine": "Cafe, Cocktails", "price_range": "₹400-900"},
    ]
    
    inserted = 0
    updated = 0
    
    for cafe in cafes_data:
        cafe_id = f"cafe-{cafe['name'].lower().replace(' ', '-')[:30]}-{uuid.uuid4().hex[:6]}"
        
        # Check if exists by name and city
        existing = await db.restaurants.find_one({
            "name": cafe["name"],
            "city": cafe["city"]
        })
        
        restaurant_doc = {
            "id": existing.get("id", cafe_id) if existing else cafe_id,
            "name": cafe["name"],
            "city": cafe["city"],
            "state": cafe.get("state"),
            "type": cafe["type"],
            "description": cafe["description"],
            "image": cafe["image_url"] or "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
            "photos": [cafe["image_url"]] if cafe["image_url"] else [],
            "website": cafe["website"],
            "phone": cafe["phone"],
            "address": cafe["address"],
            "pet_policy": cafe["pet_policy"],
            "cuisine": cafe["cuisine"],
            "price_range": cafe["price_range"],
            "rating": 4.2,
            "pet_friendly": True,
            "outdoor_seating": True,
            "water_bowls": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if existing:
            await db.restaurants.update_one({"_id": existing["_id"]}, {"$set": restaurant_doc})
            updated += 1
        else:
            await db.restaurants.insert_one(restaurant_doc)
            inserted += 1
    
    logger.info(f"Seeded cafes: {inserted} inserted, {updated} updated")
    return {"success": True, "inserted": inserted, "updated": updated, "total": len(cafes_data)}


@admin_router.post("/data/seed-boarding")
async def seed_pet_boarding(username: str = Depends(verify_admin)):
    """Seed pet boarding facilities from curated data."""
    
    boarding_data = [
        # Bangalore
        {"name": "Snouters – Pet Boarding Bangalore", "city": "Bangalore", "state": "Karnataka", "type": "Premium", "address": "Muneshwara Nagar, Ramamurthy Nagar, Bengaluru 560016", "phone": None, "description": "Professional pet boarding with dedicated care staff"},
        {"name": "Snouters – Palace Guttahalli", "city": "Bangalore", "state": "Karnataka", "type": "Premium", "address": "Dattatreya Temple St, DNR Layout, Bengaluru 560003", "phone": None, "description": "Spacious boarding facility in central Bangalore"},
        {"name": "Spar Pet Home", "city": "Bangalore", "state": "Karnataka", "type": "Home-style", "address": "T.C. Palya Road, Bengaluru 560036", "phone": "+91 8073650365", "description": "Cozy home environment for your pets"},
        {"name": "Dog & Cat Boarding RT Nagar", "city": "Bangalore", "state": "Karnataka", "type": "Premium", "address": "Thimaiah Garden, RT Nagar, Bengaluru 560006", "phone": "+91 9964814408", "description": "Boarding for dogs and cats with individual attention"},
        {"name": "R Barking Club", "city": "Bangalore", "state": "Karnataka", "type": "Premium", "address": "AK Colony, Domlur, Bengaluru 560071", "phone": None, "description": "Active play-based boarding experience"},
        {"name": "Dilip Pet Boarding", "city": "Bangalore", "state": "Karnataka", "type": "Home-style", "address": "4th Main Rd, Ganganagar, Bengaluru 560032", "phone": "+91 9742199118", "description": "Family-run pet boarding with personal care"},
        {"name": "Second Home Dog Boarding", "city": "Bangalore", "state": "Karnataka", "type": "Home-style", "address": "Sector 4, HSR Layout, Bengaluru 560102", "phone": "+91 7760601012", "description": "A second home for your furry friend"},
        # Mumbai
        {"name": "PetFelix Dog Boarding", "city": "Mumbai", "state": "Maharashtra", "type": "Premium", "address": "Chandivali Farm Rd, Powai, Mumbai 400072", "phone": "+91 9004279362", "description": "Premium boarding with grooming services"},
        {"name": "Rohit's Pet Daycare & Boarding", "city": "Mumbai", "state": "Maharashtra", "type": "Premium", "address": "Shahaji Raje Rd, Vile Parle East, Mumbai 400057", "phone": "+91 7977987707", "description": "Daycare and overnight boarding options"},
        {"name": "Sagar Kennels", "city": "Mumbai", "state": "Maharashtra", "type": "Private", "address": "Government Colony, Bandra East, Mumbai 400051", "phone": "+91 9869154086", "description": "Individual kennels for peaceful stays"},
        {"name": "PETZANIA", "city": "Mumbai", "state": "Maharashtra", "type": "Premium", "address": "Punjabwadi, Chembur, Mumbai 400088", "phone": "+91 8097585008", "description": "Modern pet hotel with AC rooms"},
        {"name": "Pupstop", "city": "Mumbai", "state": "Maharashtra", "type": "Premium", "address": "Wadala West, Mumbai 400037", "phone": "+91 9987511279", "description": "Central Mumbai boarding facility"},
        {"name": "Bonehemian Tails", "city": "Mumbai", "state": "Maharashtra", "type": "Home-style", "address": "Mahim West, Mumbai 400016", "phone": "+91 7506070995", "description": "Bohemian-style home boarding"},
        # Delhi
        {"name": "High Paws", "city": "Delhi", "state": "Delhi", "type": "Premium", "address": "Mittal Garden, Chhatarpur, New Delhi 110074", "phone": "+91 6294880733", "description": "Luxury pet boarding in South Delhi"},
        {"name": "FurBnb", "city": "Delhi", "state": "Delhi", "type": "Home-style", "address": "East Patel Nagar, New Delhi 110008", "phone": "+91 8377872735", "description": "Airbnb-style pet boarding"},
        {"name": "Snouters – Delhi", "city": "Delhi", "state": "Delhi", "type": "Premium", "address": "Sector C, Vasant Kunj, New Delhi 110070", "phone": None, "description": "Professional boarding in Vasant Kunj"},
        {"name": "Paws Day Outing", "city": "Delhi", "state": "Delhi", "type": "Premium", "address": "Panchsheel Vihar, New Delhi 110017", "phone": "+91 9958578535", "description": "Day boarding with outdoor activities"},
        {"name": "Woofs-n-Wags", "city": "Delhi", "state": "Delhi", "type": "Premium", "address": "Sainik Farm, New Delhi 110080", "phone": "+91 9811560097", "description": "Farm-style boarding with open spaces"},
        # Hyderabad
        {"name": "Yes Paws", "city": "Hyderabad", "state": "Telangana", "type": "Luxury", "address": "Botanical Garden Rd, Kondapur, Hyderabad 500084", "phone": "+91 8125419514", "description": "Luxury pet hotel with spa services"},
        {"name": "JSSS Farms & Kennels", "city": "Hyderabad", "state": "Telangana", "type": "Private", "address": "Marri Pally, Hyderabad 500068", "phone": "+91 9502553652", "description": "Farm kennels with rural setting"},
        {"name": "Ocean's Pet Home", "city": "Hyderabad", "state": "Telangana", "type": "Home-style", "address": "Gachibowli, Hyderabad 500046", "phone": "+91 9381999472", "description": "Home boarding in IT hub"},
        {"name": "Bark & Play", "city": "Hyderabad", "state": "Telangana", "type": "Premium", "address": "Shilpa Valley, Kondapur, Hyderabad 500084", "phone": "+91 9032105217", "description": "Play-focused boarding experience"},
        {"name": "Woof Buddies", "city": "Hyderabad", "state": "Telangana", "type": "Home-style", "address": "Nallagandla, Hyderabad 500019", "phone": "+91 9500162040", "description": "Friendly home environment"},
    ]
    
    inserted = 0
    updated = 0
    
    # Stock images for boarding types
    type_images = {
        "Home-style": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800",
        "Premium": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
        "Private": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
        "Luxury": "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800"
    }
    
    for boarding in boarding_data:
        boarding_id = f"boarding-{boarding['name'].lower().replace(' ', '-')[:30]}-{uuid.uuid4().hex[:6]}"
        
        # Check if exists
        existing = await db.pet_boarding.find_one({
            "name": boarding["name"],
            "city": boarding["city"]
        })
        
        # Generate paw score
        import random
        paw_score = round(random.uniform(3.8, 4.9), 1)
        
        boarding_doc = {
            "id": existing.get("id", boarding_id) if existing else boarding_id,
            "name": boarding["name"],
            "city": boarding["city"],
            "state": boarding["state"],
            "boarding_type": boarding["type"],
            "description": boarding["description"],
            "address": boarding["address"],
            "phone": boarding["phone"],
            "image": type_images.get(boarding["type"], type_images["Premium"]),
            "photos": [type_images.get(boarding["type"], type_images["Premium"])],
            "paw_score": paw_score,
            "price_range": "₹500-1,500/night" if boarding["type"] == "Home-style" else "₹800-2,500/night",
            "amenities": ["24/7 Care", "Play Area", "Feeding Schedule", "Daily Updates"],
            "services": ["Overnight Boarding", "Day Care", "Grooming (extra)"],
            "capacity": "5-15 pets",
            "pet_types_accepted": ["Dogs", "Cats"],
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if existing:
            await db.pet_boarding.update_one({"_id": existing["_id"]}, {"$set": boarding_doc})
            updated += 1
        else:
            await db.pet_boarding.insert_one(boarding_doc)
            inserted += 1
    
    logger.info(f"Seeded boarding: {inserted} inserted, {updated} updated")
    return {"success": True, "inserted": inserted, "updated": updated, "total": len(boarding_data)}


@admin_router.get("/data/pets-status")
async def get_pets_status(username: str = Depends(verify_admin)):
    """Check the status of pets in the database - how many have user_id, owner_email, etc."""
    
    total_pets = await db.pets.count_documents({})
    with_user_id = await db.pets.count_documents({"user_id": {"$exists": True, "$ne": None}})
    with_owner_email = await db.pets.count_documents({"owner_email": {"$exists": True, "$ne": None}})
    without_user_id = await db.pets.count_documents({
        "$or": [
            {"user_id": {"$exists": False}},
            {"user_id": None}
        ]
    })
    
    # Sample pets
    sample_pets = await db.pets.find({}, {"_id": 0, "id": 1, "name": 1, "user_id": 1, "owner_email": 1}).limit(10).to_list(10)
    
    return {
        "total_pets": total_pets,
        "with_user_id": with_user_id,
        "with_owner_email": with_owner_email,
        "without_user_id": without_user_id,
        "sample_pets": sample_pets
    }


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
                "https://www.chatbase.co/api/v1/get-conversations",
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
                    
                    # Create Service Desk ticket for new Mira chat
                    await create_ticket_from_event(db, "mira_chat", {
                        "chat_id": conv_id,
                        "name": extracted.get('name', 'Website Visitor'),
                        "email": extracted.get('email'),
                        "phone": extracted.get('phone'),
                        "preview": extracted.get('preview', ''),
                        "messages": extracted.get('message_count', 0)
                    })
            
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
    pillar: Optional[str] = None,
    source: Optional[str] = Query(None, description="Source collection: 'unified' (default), 'legacy', or 'all'"),
    limit: int = 500
):
    """Get all products with optional category/pillar filter.
    
    By default queries unified_products (pillar products with 650 items).
    Use source='legacy' for old products collection, 'all' for both merged.
    """
    query = {}
    if category:
        query["category"] = category
    if pillar:
        query["pillar"] = pillar
    
    # Determine which collection to query
    use_unified = source != "legacy"
    use_legacy = source in ["legacy", "all"]
    
    all_products = []
    
    # Query unified_products (primary - pillar products)
    if use_unified:
        unified_products = await db.unified_products.find(query, {"_id": 0}).limit(limit).to_list(limit)
        all_products.extend(unified_products)
    
    # Query legacy products collection
    if use_legacy:
        legacy_products = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
        # Avoid duplicates by ID
        existing_ids = {p.get("id") for p in all_products}
        for p in legacy_products:
            if p.get("id") not in existing_ids:
                all_products.append(p)
    
    # Count totals
    total_unified = await db.unified_products.count_documents(query) if use_unified else 0
    total_legacy = await db.products.count_documents(query) if use_legacy else 0
    total = total_unified + total_legacy if source == "all" else (total_unified if use_unified else total_legacy)
    
    # Ensure title field exists (use name if title is missing)
    for p in all_products:
        if not p.get("title") and p.get("name"):
            p["title"] = p["name"]
    
    # Get distinct categories from both collections
    unified_categories = await db.unified_products.distinct("category") if use_unified else []
    legacy_categories = await db.products.distinct("category") if use_legacy else []
    categories = list(set(unified_categories + legacy_categories))
    
    # Get distinct pillars for filtering
    pillars = await db.unified_products.distinct("pillar") if use_unified else []
    
    return {
        "products": all_products[:limit],
        "total": total,
        "categories": categories,
        "pillars": [p for p in pillars if p],  # Filter out None/empty
        "source": source or "unified"
    }


@admin_router.get("/products/{product_id}")
async def get_product(product_id: str, username: str = Depends(verify_admin)):
    """Get single product by ID - searches both unified_products and legacy products"""
    # Try unified_products first
    product = await db.unified_products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        # Fall back to legacy products
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@admin_router.post("/products")
async def create_product(product: dict, username: str = Depends(verify_admin)):
    """Create a new product in unified_products collection"""
    product["id"] = str(uuid.uuid4())
    product["created_at"] = datetime.now(timezone.utc).isoformat()
    product["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Store in unified_products (primary collection)
    await db.unified_products.insert_one(product)
    return {"message": "Product created", "id": product["id"]}


@admin_router.put("/products/{product_id}")
async def update_product(product_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update an existing product - searches both collections"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Remove id from updates if present
    updates.pop("id", None)
    updates.pop("_id", None)
    
    # Try unified_products first
    result = await db.unified_products.update_one(
        {"id": product_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        # Fall back to legacy products
        result = await db.products.update_one(
            {"id": product_id},
            {"$set": updates}
        )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated successfully"}


@admin_router.delete("/products/{product_id}")
async def delete_product(product_id: str, username: str = Depends(verify_admin)):
    """Delete a product - searches both collections"""
    # Try unified_products first
    result = await db.unified_products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        # Fall back to legacy products
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


# ==================== APP SETTINGS & FULFILMENT ROUTES ====================

@admin_router.get("/settings")
async def get_app_settings(username: str = Depends(verify_admin)):
    """Get global application settings including pickup cities and shipping thresholds"""
    settings = await db.app_settings.find_one({"id": "global_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        default_settings = {
            "id": "global_settings",
            "pickup_cities": ["Mumbai", "Gurugram", "Bangalore"],
            "pan_india_shipping": True,
            "default_fulfilment_type": "shipping",
            "bakery_pickup_only_categories": ["cakes", "fresh_treats", "celebration"],
            "store_locations": [
                {"id": "mumbai", "city": "Mumbai", "address": "Shop 9, off Yari Road, Jeet Nagar, Versova, Andheri West, Mumbai 400061"},
                {"id": "gurugram", "city": "Gurugram", "address": "Ground Floor, Wazirabad Rd, Wazirabad, Sector 52, Gurugram 122003"},
                {"id": "bangalore", "city": "Bangalore", "address": "147, 8th Main Rd, 3rd Block, Koramangala, Bengaluru 560034"}
            ],
            "shipping_thresholds": [
                {"min_cart_value": 0, "max_cart_value": 3000, "shipping_fee": 150},
                {"min_cart_value": 3000, "max_cart_value": 999999, "shipping_fee": 0}
            ],
            "free_shipping_threshold": 3000,
            "default_shipping_fee": 150,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.app_settings.insert_one(default_settings)
        return default_settings
    return settings


@admin_router.put("/settings")
async def update_app_settings(updates: UpdateAppSettings, username: str = Depends(verify_admin)):
    """Update global application settings"""
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.app_settings.update_one(
        {"id": "global_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Settings updated successfully"}


@api_router.get("/settings/public")
async def get_public_settings():
    """Get public settings (pickup cities, store locations, shipping thresholds) for checkout"""
    settings = await db.app_settings.find_one({"id": "global_settings"}, {"_id": 0})
    default_settings = {
        "pickup_cities": ["Mumbai", "Gurugram", "Bangalore"],
        "pan_india_shipping": True,
        "bakery_pickup_only_categories": ["cakes", "fresh_treats", "celebration"],
        "store_locations": [
            {"id": "mumbai", "city": "Mumbai", "address": "Shop 9, off Yari Road, Jeet Nagar, Versova, Andheri West, Mumbai 400061"},
            {"id": "gurugram", "city": "Gurugram", "address": "Ground Floor, Wazirabad Rd, Wazirabad, Sector 52, Gurugram 122003"},
            {"id": "bangalore", "city": "Bangalore", "address": "147, 8th Main Rd, 3rd Block, Koramangala, Bengaluru 560034"}
        ],
        "shipping_thresholds": [
            {"min_cart_value": 0, "max_cart_value": 3000, "shipping_fee": 150},
            {"min_cart_value": 3000, "max_cart_value": 999999, "shipping_fee": 0}
        ],
        "free_shipping_threshold": 3000,
        "default_shipping_fee": 150
    }
    if not settings:
        return default_settings
    return {
        "pickup_cities": settings.get("pickup_cities", default_settings["pickup_cities"]),
        "pan_india_shipping": settings.get("pan_india_shipping", True),
        "bakery_pickup_only_categories": settings.get("bakery_pickup_only_categories", default_settings["bakery_pickup_only_categories"]),
        "store_locations": settings.get("store_locations", default_settings["store_locations"]),
        "shipping_thresholds": settings.get("shipping_thresholds", default_settings["shipping_thresholds"]),
        "free_shipping_threshold": settings.get("free_shipping_threshold", 3000),
        "default_shipping_fee": settings.get("default_shipping_fee", 150)
    }


@admin_router.put("/products/{product_id}/fulfilment")
async def update_product_fulfilment(
    product_id: str, 
    fulfilment: ProductFulfilmentUpdate,
    username: str = Depends(verify_admin)
):
    """Update a product's fulfilment type and regional availability"""
    if fulfilment.fulfilment_type not in FULFILMENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid fulfilment type. Must be one of: {FULFILMENT_TYPES}")
    
    update_data = {
        "fulfilment_type": fulfilment.fulfilment_type,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if fulfilment.regions is not None:
        update_data["regions"] = fulfilment.regions
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product fulfilment settings updated"}


@admin_router.post("/products/bulk-fulfilment")
async def bulk_update_product_fulfilment(
    product_ids: List[str],
    fulfilment_type: str = Query(..., description="shipping, store_pickup, or both"),
    regions: Optional[List[str]] = Query(None, description="List of regions/cities"),
    username: str = Depends(verify_admin)
):
    """Bulk update fulfilment settings for multiple products"""
    if fulfilment_type not in FULFILMENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid fulfilment type. Must be one of: {FULFILMENT_TYPES}")
    
    update_data = {
        "fulfilment_type": fulfilment_type,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if regions is not None:
        update_data["regions"] = regions
    
    result = await db.products.update_many(
        {"id": {"$in": product_ids}},
        {"$set": update_data}
    )
    
    return {"message": f"Updated {result.modified_count} products"}


@admin_router.post("/products/migrate-fulfilment-defaults")
async def migrate_products_with_fulfilment_defaults(username: str = Depends(verify_admin)):
    """
    Data migration: Add default fulfilment settings to all products that don't have them.
    - Cakes/Fresh items: store_pickup (limited to pickup cities)
    - Other products: shipping (pan-india)
    """
    settings = await db.app_settings.find_one({"id": "global_settings"}, {"_id": 0})
    bakery_categories = settings.get("bakery_pickup_only_categories", ["cakes", "fresh_treats"]) if settings else ["cakes", "fresh_treats"]
    pickup_cities = settings.get("pickup_cities", ["Mumbai", "Gurugram", "Bangalore"]) if settings else ["Mumbai", "Gurugram", "Bangalore"]
    
    # Update bakery items (cakes, fresh treats) - store_pickup only
    bakery_result = await db.products.update_many(
        {
            "fulfilment_type": {"$exists": False},
            "$or": [
                {"category": {"$in": bakery_categories}},
                {"name": {"$regex": "cake", "$options": "i"}}
            ]
        },
        {
            "$set": {
                "fulfilment_type": "store_pickup",
                "regions": pickup_cities,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Update all other products - shipping (pan-india)
    other_result = await db.products.update_many(
        {"fulfilment_type": {"$exists": False}},
        {
            "$set": {
                "fulfilment_type": "shipping",
                "regions": ["Pan India"],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {
        "message": "Migration complete",
        "bakery_products_updated": bakery_result.modified_count,
        "other_products_updated": other_result.modified_count
    }


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
            "contactEmail": "woof@thedoggycompany.in"
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

# FAQs routes moved to faq_routes.py

# ==================== PAGE CONTENT CMS ====================

@api_router.get("/pages/{page_slug}")
async def get_page_content(page_slug: str):
    """Get content for a specific page (public)"""
    page = await db.page_content.find_one({"slug": page_slug}, {"_id": 0})
    if not page:
        # Return default structure if page doesn't exist
        return {"slug": page_slug, "content": {}, "is_published": False}
    return page

@admin_router.get("/pages")
async def get_all_pages(username: str = Depends(verify_admin)):
    """Get all editable pages"""
    pages = await db.page_content.find({}, {"_id": 0}).to_list(50)
    return {"pages": pages, "total": len(pages)}

@admin_router.get("/pages/{page_slug}")
async def get_page_for_admin(page_slug: str, username: str = Depends(verify_admin)):
    """Get specific page content for editing"""
    page = await db.page_content.find_one({"slug": page_slug}, {"_id": 0})
    if not page:
        return {"slug": page_slug, "content": {}, "is_published": False}
    return page

@admin_router.put("/pages/{page_slug}")
async def update_page_content(page_slug: str, content: dict, username: str = Depends(verify_admin)):
    """Update page content"""
    now = datetime.now(timezone.utc).isoformat()
    
    existing = await db.page_content.find_one({"slug": page_slug})
    
    update_data = {
        "slug": page_slug,
        "title": content.get("title", page_slug.replace("-", " ").title()),
        "content": content.get("content", {}),
        "meta": content.get("meta", {}),
        "is_published": content.get("is_published", True),
        "updated_at": now,
        "updated_by": username
    }
    
    if existing:
        await db.page_content.update_one(
            {"slug": page_slug},
            {"$set": update_data}
        )
    else:
        update_data["created_at"] = now
        update_data["created_by"] = username
        await db.page_content.insert_one(update_data)
    
    return {"success": True, "message": f"Page '{page_slug}' updated successfully"}

@admin_router.post("/pages/seed")
async def seed_page_content(username: str = Depends(verify_admin)):
    """Seed default content for all editable pages"""
    now = datetime.now(timezone.utc).isoformat()
    
    default_pages = [
        {
            "slug": "about",
            "title": "About Us",
            "content": {
                "hero": {
                    "title": "Pet Life Operating System",
                    "subtitle": "We're building the world's most intelligent pet care ecosystem",
                    "description": "The Doggy Company is more than a pet service — it's a complete life system designed around your pet."
                },
                "pillars": [
                    {"name": "Celebrate", "description": "Birthday cakes, treats & parties", "icon": "cake"},
                    {"name": "Dine", "description": "Pet-friendly restaurants & cafes", "icon": "utensils"},
                    {"name": "Stay", "description": "Pet-friendly hotels & stays", "icon": "hotel"},
                    {"name": "Travel", "description": "Pet travel assistance", "icon": "plane"},
                    {"name": "Care", "description": "Grooming, walking, sitting", "icon": "heart"},
                    {"name": "Fit", "description": "Exercise & wellness", "icon": "dumbbell"},
                    {"name": "Advisory", "description": "Expert consultations", "icon": "user-md"},
                    {"name": "Emergency", "description": "24/7 pet emergency help", "icon": "ambulance"},
                    {"name": "Paperwork", "description": "Health records & docs", "icon": "file"},
                    {"name": "Shop", "description": "Curated products", "icon": "shopping-bag"},
                    {"name": "Club", "description": "Community & rewards", "icon": "users"},
                    {"name": "Enjoy", "description": "Events & experiences", "icon": "calendar"}
                ],
                "mission": {
                    "title": "Our Mission",
                    "text": "To make pet parenting effortless by building an intelligent system that learns, remembers, and anticipates your pet's needs."
                },
                "values": [
                    {"title": "Pet-First", "description": "Every decision starts with what's best for pets"},
                    {"title": "Intelligence", "description": "Learning systems that get smarter over time"},
                    {"title": "Trust", "description": "We remember so you don't have to explain"}
                ]
            },
            "is_published": True
        },
        {
            "slug": "membership",
            "title": "Membership",
            "content": {
                "hero": {
                    "badge": "Pet Life Operating System",
                    "title": "The Longer You're With Us",
                    "highlight": "The Less You Explain",
                    "subtitle": "Not just a membership — a system that quietly learns, remembers, and adapts around your pet."
                },
                "pillars_heading": "A Complete Life System for Your Pet",
                "pillars_subheading": "One membership unlocks everything. No more juggling multiple apps and services.",
                "benefits": [
                    {"title": "Pet Soul™ Profile", "description": "Deep, evolving profile for your pet", "primary": True},
                    {"title": "Mira AI Concierge®", "description": "24/7 intelligent pet assistant", "primary": True},
                    {"title": "Smart Reminders", "description": "Birthday, vaccine & event alerts", "primary": True},
                    {"title": "Health Vault", "description": "Secure medical records storage", "primary": True},
                    {"title": "Priority Support", "description": "Fast-track help when you need it", "primary": True},
                    {"title": "Paw Rewards", "description": "Earn points on every interaction", "primary": False}
                ],
                "tenure_levels": [
                    {"name": "Early Journey", "description": "Just getting to know each other", "months": 0},
                    {"name": "Growing Together", "description": "Building understanding over time", "months": 3},
                    {"name": "Well Known", "description": "We understand your pet deeply", "months": 6},
                    {"name": "Deeply Understood", "description": "Your pet's needs are anticipated", "months": 12}
                ],
                "pricing": {
                    "heading": "One Membership. One Pet Life System.",
                    "subheading": "Unlimited access to all pillars, growing intelligence over time.",
                    "annual": {"price": 999, "period": "year", "savings": "Save ₹189"},
                    "monthly": {"price": 99, "period": "month"}
                },
                "cta": {
                    "heading": "Ready to begin your pet's journey with us?",
                    "subheading": "Start building a life that grows with your pet.",
                    "button_text": "Begin Your Journey"
                }
            },
            "is_published": True
        },
        {
            "slug": "terms",
            "title": "Terms & Conditions",
            "content": {
                "sections": [
                    {"title": "Acceptance of Terms", "text": "By accessing and using The Doggy Company services, you accept and agree to be bound by these terms."},
                    {"title": "Membership", "text": "Membership fees are non-refundable. Annual memberships auto-renew unless cancelled 7 days before renewal."},
                    {"title": "Services", "text": "We strive to provide accurate information about our services. Availability may vary by location."},
                    {"title": "Privacy", "text": "Your data is protected under our Privacy Policy. We never share personal information with third parties without consent."},
                    {"title": "Liability", "text": "We are not liable for any indirect damages. Our total liability is limited to the amount paid for services."}
                ],
                "last_updated": "January 2026"
            },
            "is_published": True
        },
        {
            "slug": "privacy",
            "title": "Privacy Policy",
            "content": {
                "sections": [
                    {"title": "Information We Collect", "text": "We collect information you provide directly: name, email, phone, address, and pet details."},
                    {"title": "How We Use Information", "text": "To provide services, personalize your experience, send updates, and improve our platform."},
                    {"title": "Data Security", "text": "We implement industry-standard security measures to protect your data."},
                    {"title": "Your Rights", "text": "You can access, update, or delete your data at any time through your account settings."},
                    {"title": "Contact", "text": "For privacy concerns, contact privacy@thedoggycompany.in"}
                ],
                "last_updated": "January 2026"
            },
            "is_published": True
        }
    ]
    
    seeded = 0
    for page in default_pages:
        existing = await db.page_content.find_one({"slug": page["slug"]})
        if not existing:
            page["created_at"] = now
            page["updated_at"] = now
            page["created_by"] = username
            await db.page_content.insert_one(page)
            seeded += 1
    
    return {"success": True, "seeded": seeded, "total_pages": len(default_pages)}


@admin_router.post("/pages/seed-all")
async def seed_all_page_content(username: str = Depends(verify_admin)):
    """Seed default content for ALL pages including pillars"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Pillar pages
    pillar_pages = [
        {"slug": "celebrate", "name": "Celebrate", "desc": "Birthday cakes, treats & parties for your pet", "icon": "🎂"},
        {"slug": "dine", "name": "Dine", "desc": "Pet-friendly restaurants & cafes", "icon": "🍽️"},
        {"slug": "travel", "name": "Travel", "desc": "Pet relocation & travel assistance", "icon": "✈️"},
        {"slug": "stay", "name": "Stay", "desc": "Pet-friendly hotels & accommodations", "icon": "🏨"},
        {"slug": "care", "name": "Care", "desc": "Grooming, walking, sitting services", "icon": "💊"},
        {"slug": "enjoy", "name": "Enjoy", "desc": "Events & experiences for pets", "icon": "🎾"},
        {"slug": "fit", "name": "Fit", "desc": "Exercise & wellness programs", "icon": "🏃"},
        {"slug": "advisory", "name": "Advisory", "desc": "Expert consultations & guidance", "icon": "🧠"},
        {"slug": "emergency", "name": "Emergency", "desc": "24/7 pet emergency support", "icon": "🚨"},
        {"slug": "paperwork", "name": "Paperwork", "desc": "Health records & documentation", "icon": "📋"},
        {"slug": "shop", "name": "Shop Assist", "desc": "Curated products via Mira", "icon": "🛍️"},
        {"slug": "club", "name": "Club", "desc": "Community & rewards program", "icon": "👥"},
    ]
    
    all_pages = []
    
    # Generate pillar pages
    for pillar in pillar_pages:
        all_pages.append({
            "slug": pillar["slug"],
            "title": pillar["name"],
            "content": {
                "hero": {
                    "badge": f"{pillar['name']} Pillar",
                    "title": pillar["name"],
                    "highlight": "For Your Pet",
                    "subtitle": pillar["desc"],
                    "cta_primary": "Get Started",
                    "cta_secondary": "Talk to Mira"
                },
                "sections": [
                    {
                        "id": f"{pillar['slug']}-intro",
                        "title": f"About {pillar['name']}",
                        "content": f"{pillar['desc']}. Our {pillar['name']} services are designed to make your pet's life easier and more enjoyable.",
                        "type": "text"
                    },
                    {
                        "id": f"{pillar['slug']}-features",
                        "title": "What's Included",
                        "content": "Edit this section to list all features and services available under this pillar.",
                        "type": "text"
                    }
                ],
                "seo": {
                    "meta_title": f"{pillar['name']} | The Doggy Company®",
                    "meta_description": pillar["desc"],
                    "keywords": ["pet", "dog", pillar["slug"], pillar["name"].lower()]
                }
            },
            "is_published": True
        })
    
    # Add core pages
    all_pages.extend([
        {
            "slug": "home",
            "title": "Homepage",
            "content": {
                "hero": {
                    "badge": "Pet Life Operating System",
                    "title": "A System That",
                    "highlight": "Learns, Remembers & Cares",
                    "subtitle": "From birthdays to vet visits, travel to daily routines — your pet's entire life, held in one intelligent system.",
                    "cta_primary": "Start Your Pet's Soul",
                    "cta_secondary": "Talk to Mira"
                },
                "proof_blocks": [
                    {"value": "45,000+", "label": "Pets Served"},
                    {"value": "Since 2020", "label": "The Doggy Bakery®"},
                    {"value": "Since 1998", "label": "Concierge Legacy"},
                    {"value": "30+ Years", "label": "Service Excellence"}
                ],
                "outcome_statements": [
                    {"icon": "✂️", "statement": "We remember how your dog reacts at the groomer.", "subtext": "Anxiety triggers, favorite handlers, special needs — all captured in their Soul."},
                    {"icon": "✈️", "statement": "We plan travel without making you repeat paperwork.", "subtext": "Vaccination records, carrier preferences, anxiety levels — already known."},
                    {"icon": "🎂", "statement": "We celebrate milestones without reminders.", "subtext": "Birthdays, gotcha days, vaccination due dates — we remember so you don't have to."}
                ],
                "sections": [],
                "seo": {
                    "meta_title": "The Doggy Company® | Pet Life Operating System",
                    "meta_description": "A Pet Life Operating System that learns, remembers, and cares. From birthdays to vet visits, your pet's entire life in one intelligent system.",
                    "keywords": ["pet", "dog", "pet care", "pet life", "pet operating system"]
                }
            },
            "is_published": True
        },
        {
            "slug": "faqs",
            "title": "FAQs",
            "content": {
                "hero": {
                    "title": "Frequently Asked Questions",
                    "subtitle": "Find answers to common questions about The Doggy Company"
                },
                "sections": [
                    {"title": "What is Pet Soul?", "content": "Pet Soul is your pet's living digital profile that captures their personality, preferences, health history, and more. It grows smarter with every interaction."},
                    {"title": "Who is Mira?", "content": "Mira is our AI concierge that knows your pet personally. She remembers their allergies, preferences, and history to provide personalized recommendations."},
                    {"title": "How does the Pet Life Pass work?", "content": "The Pet Life Pass gives you access to all 14 pillars of pet care — from grooming to travel, celebrations to emergency support — all connected to your pet's Soul profile."},
                    {"title": "Is my data safe?", "content": "Absolutely. We use bank-grade encryption and never sell or share your pet's data. You can export or delete your data anytime."}
                ],
                "seo": {
                    "meta_title": "FAQs | The Doggy Company®",
                    "meta_description": "Frequently asked questions about The Doggy Company's Pet Life Operating System.",
                    "keywords": ["faq", "help", "questions", "pet care"]
                }
            },
            "is_published": True
        },
        {
            "slug": "contact",
            "title": "Contact",
            "content": {
                "hero": {
                    "title": "Get in Touch",
                    "subtitle": "We'd love to hear from you"
                },
                "contact_info": {
                    "email": "hello@thedoggycompany.in",
                    "phone": "+91 9876543210",
                    "whatsapp": "+91 9876543210",
                    "address": "Mumbai, India"
                },
                "sections": [],
                "seo": {
                    "meta_title": "Contact Us | The Doggy Company®",
                    "meta_description": "Get in touch with The Doggy Company team.",
                    "keywords": ["contact", "support", "help"]
                }
            },
            "is_published": True
        },
        {
            "slug": "refund",
            "title": "Refund Policy",
            "content": {
                "hero": {
                    "title": "Refund Policy",
                    "subtitle": "Our commitment to your satisfaction"
                },
                "sections": [
                    {"title": "Product Returns", "content": "Perishable items like cakes and treats cannot be returned due to health and safety reasons. Non-perishable items can be returned within 7 days if unused and in original packaging."},
                    {"title": "Membership Refunds", "content": "Membership fees are non-refundable once the subscription period begins. You may cancel anytime to prevent future renewals."},
                    {"title": "Service Cancellations", "content": "Bookings cancelled 24+ hours in advance receive a full refund. Cancellations within 24 hours may incur a 50% fee."},
                    {"title": "How to Request", "content": "Contact us at support@thedoggycompany.in with your order details to initiate a refund request."}
                ],
                "seo": {
                    "meta_title": "Refund Policy | The Doggy Company®",
                    "meta_description": "Our refund and return policy for products and services.",
                    "keywords": ["refund", "return", "policy", "cancellation"]
                }
            },
            "is_published": True
        }
    ])
    
    seeded = 0
    for page in all_pages:
        existing = await db.page_content.find_one({"slug": page["slug"]})
        if not existing:
            page["created_at"] = now
            page["updated_at"] = now
            page["created_by"] = username
            await db.page_content.insert_one(page)
            seeded += 1
        else:
            # Update existing pages that are empty
            if not existing.get("content") or not existing.get("content", {}).get("hero"):
                await db.page_content.update_one(
                    {"slug": page["slug"]},
                    {"$set": {
                        "content": page["content"],
                        "updated_at": now,
                        "updated_by": username
                    }}
                )
                seeded += 1
    
    return {"success": True, "seeded": seeded, "total_pages": len(all_pages)}


@admin_router.get("/pages/export")
async def export_all_pages(username: str = Depends(verify_admin)):
    """Export all page content as JSON"""
    pages = await db.page_content.find({}, {"_id": 0}).to_list(100)
    return {
        "pages": pages,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "exported_by": username
    }


@admin_router.post("/pages/import")
async def import_pages(data: dict, username: str = Depends(verify_admin)):
    """Import page content from JSON"""
    pages = data.get("pages", [])
    if not pages:
        raise HTTPException(status_code=400, detail="No pages to import")
    
    now = datetime.now(timezone.utc).isoformat()
    imported = 0
    
    for page in pages:
        if not page.get("slug"):
            continue
        
        page["updated_at"] = now
        page["imported_by"] = username
        
        await db.page_content.update_one(
            {"slug": page["slug"]},
            {"$set": page},
            upsert=True
        )
        imported += 1
    
    return {"success": True, "imported": imported}


# ==================== TESTIMONIALS & BLOG ====================
# These routes have been moved to content_routes.py

# ==================== VIDEO & HERO CONTENT ====================

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


@api_router.get("/categories/hierarchy")
async def get_category_hierarchy():
    """Get the full category hierarchy with product counts for shop navigation"""
    # Get hierarchy config from DB
    config = await db.config.find_one({"key": "category_hierarchy"}, {"_id": 0})
    hierarchy = config.get("hierarchy", {}) if config else {}
    
    # Add product counts for each parent category
    result = []
    for parent_id, parent_data in hierarchy.items():
        parent_count = await db.products.count_documents({"parent_category": parent_id})
        
        # Get subcategory counts
        subcategories = []
        for sub_id, sub_data in parent_data.get("subcategories", {}).items():
            db_cats = sub_data.get("db_categories", [])
            sub_count = 0
            for db_cat in db_cats:
                sub_count += await db.products.count_documents({"category": db_cat})
            
            subcategories.append({
                "id": sub_id,
                "name": sub_data.get("name"),
                "db_categories": db_cats,
                "count": sub_count
            })
        
        result.append({
            "id": parent_id,
            "name": parent_data.get("name"),
            "emoji": parent_data.get("emoji"),
            "pillar": parent_data.get("pillar"),
            "count": parent_count,
            "subcategories": subcategories
        })
    
    # Sort by count descending
    result.sort(key=lambda x: x["count"], reverse=True)
    
    return {"categories": result}


@api_router.get("/products")
async def get_public_products(
    category: Optional[str] = None, 
    parent_category: Optional[str] = None,
    collection: Optional[str] = None,
    pan_india: Optional[bool] = None,
    fresh_city: Optional[str] = None,
    availability: Optional[str] = None,  # 'fresh' or 'pan-india'
    search: Optional[str] = None,
    pillar: Optional[str] = None,
    limit: int = 100
):
    """Public endpoint for products - queries both products and unified_products collections"""
    query = {}
    
    # Handle parent_category filtering (new hierarchy system)
    if parent_category:
        query["parent_category"] = parent_category
    
    # Handle pillar-based filtering (for unified_products)
    if pillar:
        query["pillar"] = pillar
    
    # Handle category filtering (subcategory level)
    if category and category not in ["all", "pan-india"]:
        query["category"] = category
    
    # Handle fresh delivery city filter (for cakes)
    if fresh_city:
        city_lower = fresh_city.lower()
        query["$or"] = [
            {"fresh_delivery_cities": {"$regex": city_lower, "$options": "i"}},
            {"is_pan_india_shippable": True}  # Pan-India cakes available everywhere
        ]
    
    # Handle availability filter
    if availability == 'fresh':
        query["is_fresh_only"] = True
    elif availability == 'pan-india':
        query["is_pan_india_shippable"] = True
    
    # Handle collection-based filtering (e.g., valentine)
    if collection:
        coll = await db.collections.find_one(
            {"$or": [{"id": collection}, {"slug": collection}]},
            {"_id": 0, "product_ids": 1}
        )
        if coll and coll.get("product_ids"):
            query["id"] = {"$in": coll["product_ids"]}
    
    # Search logic
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        search_query = {
            "$or": [
                {"name": search_regex},
                {"tags": search_regex},
                {"category": search_regex},
                {"description": search_regex},
                {"sizes.name": search_regex},
                {"flavors.name": search_regex}
            ]
        }
        if query:
            query = {"$and": [query, search_query]}
        else:
            query = search_query
    
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
    elif category and not collection:
        # Search in both category field AND tags array (case-insensitive)
        category_regex = {"$regex": f"^{category}$", "$options": "i"}
        category_query = {
            "$or": [
                {"category": category_regex},
                {"tags": category_regex}
            ]
        }
        if query:
            query = {"$and": [query, category_query]}
        else:
            query = category_query
    
    # Query from BOTH collections and merge results
    products = []
    seen_ids = set()
    
    # First, query old products collection
    old_products = await db.products.find(query, {"_id": 0}).to_list(500)
    for p in old_products:
        pid = p.get("id") or p.get("shopify_id")
        if pid and pid not in seen_ids:
            seen_ids.add(pid)
            # Ensure title field exists
            if not p.get("title") and p.get("name"):
                p["title"] = p["name"]
            products.append(p)
    
    # Second, query unified_products collection with adapted query
    unified_query = {}
    
    # Apply parent_category filter if specified
    if parent_category:
        unified_query["parent_category"] = parent_category
    
    # Apply pillar filter if specified
    if pillar:
        unified_query["$or"] = [
            {"pillar": pillar},
            {"pillars": pillar}
        ]
    
    # Apply category filter if specified
    if category and category not in ["all", "pan-india"] and not collection:
        unified_query["category"] = category
    
    # Apply search filter
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        search_filter = {
            "$or": [
                {"name": search_regex},
                {"tags": search_regex},
                {"category": search_regex},
                {"short_description": search_regex}
            ]
        }
        if unified_query:
            unified_query = {"$and": [unified_query, search_filter]}
        else:
            unified_query = search_filter
    
    # Only add visibility filter if we have other filters
    if unified_query:
        unified_query = {"$and": [unified_query, {"visibility.status": {"$in": ["active", None]}}]}
    else:
        unified_query = {"visibility.status": {"$in": ["active", None]}}
    
    try:
        unified_products = await db.unified_products.find(unified_query, {"_id": 0}).to_list(500)
        for p in unified_products:
            pid = p.get("id") or p.get("shopify_id")
            if pid and pid not in seen_ids:
                seen_ids.add(pid)
                # Adapt unified product format to legacy format
                adapted = {
                    "id": p.get("id"),
                    "name": p.get("name"),
                    "title": p.get("name"),
                    "description": p.get("short_description") or p.get("long_description"),
                    "price": p.get("pricing", {}).get("base_price", 0),
                    "images": p.get("images", []),
                    "image": p.get("thumbnail") or (p.get("images", [None])[0] if p.get("images") else None),
                    "category": p.get("category"),
                    "tags": p.get("tags", []),
                    "in_stock": p.get("in_stock", True),
                    "pillars": p.get("pillars", []),
                    # Preserve other useful fields
                    "shopify_id": p.get("shopify_id"),
                    "sku": p.get("sku"),
                    "is_customizable": p.get("is_customizable", False),
                }
                products.append(adapted)
    except Exception as e:
        logger.warning(f"Error querying unified_products: {e}")
    
    return {"products": products, "total": len(products)}


# ==================== SERVICES API (Concierge® Services) ====================

@api_router.get("/services")
async def get_services(
    pillar: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50
):
    """Get Concierge® services - can filter by pillar"""
    query = {"is_active": {"$ne": False}}
    
    if pillar:
        query["pillar"] = pillar.lower()
    
    if category:
        query["category"] = category
    
    services = await db.services.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    return {"services": services, "total": len(services)}


@api_router.get("/services/{service_id}")
async def get_service_detail(service_id: str):
    """Get single service details"""
    service = await db.services.find_one(
        {"$or": [{"id": service_id}, {"name": service_id}]},
        {"_id": 0}
    )
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return service


@api_router.post("/services/book")
async def book_service(
    service_id: str = Body(...),
    pet_id: Optional[str] = Body(None),
    preferred_date: Optional[str] = Body(None),
    notes: Optional[str] = Body(None),
    contact_name: str = Body(...),
    contact_phone: str = Body(...),
    contact_email: Optional[str] = Body(None),
    authorization: Optional[str] = Header(None)
):
    """Book a Concierge® service - creates a ticket in the service desk"""
    # Fetch service details
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Create booking/ticket
    booking_id = f"BK-{uuid.uuid4().hex[:8].upper()}"
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    
    # Get pet info if provided
    pet_info = None
    if pet_id:
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "name": 1, "breed": 1, "weight": 1})
        if pet:
            pet_info = pet
    
    # Create ticket for service desk
    ticket = {
        "id": ticket_id,
        "booking_id": booking_id,
        "type": "service_booking",
        "service_id": service_id,
        "service_name": service.get("name"),
        "pillar": service.get("pillar"),
        "price": service.get("price"),
        "status": "new",
        "priority": "normal",
        "contact": {
            "name": contact_name,
            "phone": contact_phone,
            "email": contact_email
        },
        "pet_id": pet_id,
        "pet_info": pet_info,
        "preferred_date": preferred_date,
        "notes": notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tickets.insert_one(ticket)
    
    return {
        "success": True,
        "booking_id": booking_id,
        "ticket_id": ticket_id,
        "message": f"Your booking for {service.get('name')} has been received. Our team will contact you shortly."
    }


@api_router.get("/products/recommendations/for-pet/{pet_id}")
async def get_pet_recommendations(pet_id: str, limit: int = 20):
    """Get personalized product recommendations based on pet profile"""
    # Fetch pet profile
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Extract pet attributes for filtering
    weight = pet.get("weight")
    birth_date = pet.get("birth_date")
    preferences = pet.get("preferences", {})
    allergies = preferences.get("allergies", [])
    if isinstance(allergies, str):
        allergies = [a.strip().lower() for a in allergies.split(",") if a.strip()]
    treat_size = preferences.get("treat_size", "")
    
    # Determine size category from weight
    size_category = "all-sizes"
    if weight:
        if weight < 10:
            size_category = "small-dog"
        elif weight < 25:
            size_category = "medium-dog"
        elif weight < 45:
            size_category = "large-dog"
        else:
            size_category = "giant-breed"
    
    # Determine age category from birth date
    age_category = "adult"
    if birth_date:
        try:
            from dateutil import parser
            from datetime import datetime, timezone
            birth = parser.parse(birth_date)
            age_months = (datetime.now(timezone.utc) - birth.replace(tzinfo=timezone.utc)).days / 30
            if age_months < 12:
                age_category = "puppy"
            elif age_months > 84:  # 7 years
                age_category = "senior"
        except:
            pass
    
    # Build recommendation query
    # Find products matching size and age, excluding allergies
    query = {
        "in_stock": {"$ne": False},
        "tags": {"$in": [size_category, age_category, "all-sizes", "all-ages"]}
    }
    
    # Exclude products with allergy-related tags
    if allergies:
        allergy_exclusions = []
        for allergy in allergies:
            allergy_exclusions.extend([allergy, f"{allergy}-free"])
        # Products should NOT have the allergen in tags but SHOULD have allergen-free
        query["$or"] = [
            {"tags": {"$nin": allergies}},  # Doesn't contain allergen
            {"tags": {"$in": [f"{a}-free" for a in allergies]}}  # OR is allergen-free
        ]
    
    # Fetch matching products
    products = await db.products.find(query, {"_id": 0}).limit(limit * 2).to_list(limit * 2)
    
    # Score products based on relevance
    scored_products = []
    for p in products:
        score = 0
        tags = [t.lower() for t in (p.get("tags") or [])]
        
        # Size match bonus
        if size_category in tags or "all-sizes" in tags:
            score += 10
        
        # Age match bonus  
        if age_category in tags or "all-ages" in tags:
            score += 10
        
        # Allergy-safe bonus
        is_safe = True
        for allergy in allergies:
            if allergy.lower() in tags:
                is_safe = False
                break
            if f"{allergy.lower()}-free" in tags:
                score += 5  # Bonus for explicitly allergen-free
        
        if not is_safe:
            continue  # Skip products containing allergens
        
        # Treat size preference
        if treat_size:
            if treat_size.lower() in p.get("name", "").lower():
                score += 5
        
        scored_products.append((score, p))
    
    # Sort by score and return top matches
    scored_products.sort(key=lambda x: -x[0])
    recommendations = [p for _, p in scored_products[:limit]]
    
    return {
        "pet": {
            "name": pet.get("name"),
            "size_category": size_category,
            "age_category": age_category,
            "allergies": allergies
        },
        "recommendations": recommendations,
        "total": len(recommendations),
        "filters_applied": {
            "size": size_category,
            "age": age_category,
            "excluded_allergens": allergies
        }
    }


@api_router.get("/products/{product_id}")
async def get_product_detail(product_id: str):
    """Get single product by ID or handle for detail page"""
    # Try products collection first - search by id, shopify_id, or shopify_handle
    product = await db.products.find_one(
        {"$or": [
            {"id": product_id}, 
            {"shopify_id": product_id},
            {"shopify_handle": product_id}
        ]},
        {"_id": 0}
    )
    
    if not product:
        # Try unified_products
        product = await db.unified_products.find_one(
            {"$or": [{"id": product_id}, {"sku": product_id}, {"handle": product_id}]},
            {"_id": 0}
        )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"product": product}


@api_router.get("/products/{product_id}/related")
async def get_related_products(product_id: str, limit: int = 4, pillar: str = None):
    """Get products that go well with the specified product - pillar-aware smart recommendations"""
    
    # Find the current product
    product = await db.products.find_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"_id": 0}
    )
    
    if not product:
        return {"related": [], "bundles": []}
    
    current_category = product.get("category", "")
    current_subcategory = product.get("subcategory", "")
    current_price = product.get("price", 0)
    product_pillar = pillar or product.get("pillar", current_category) or "celebrate"
    
    # ==================== PILLAR-SPECIFIC UPSELL MAPS ====================
    # These map categories/subcategories to complementary items
    pillar_upsell_map = {
        "celebrate": {
            "cakes": ["treats", "accessories", "bandanas"],
            "pupcakes": ["treats", "accessories", "bandanas"],
            "dognuts": ["treats", "cakes", "accessories"],
            "treats": ["cakes", "accessories"],
            "default": ["treats", "cakes", "accessories"]
        },
        "travel": {
            "crate": ["calming", "accessory", "carrier"],
            "carrier": ["calming", "accessory", "safety"],
            "harness": ["calming", "accessory", "safety"],
            "calming": ["carrier", "accessory", "safety"],
            "accessory": ["calming", "carrier", "safety"],
            "safety": ["calming", "accessory", "carrier"],
            "comfort": ["calming", "accessory"],
            "default": ["calming", "accessory", "carrier"]
        },
        "stay": {
            "comfort": ["calming", "accessory"],
            "default": ["comfort", "calming"]
        },
        "dine": {
            "fresh": ["treats", "supplements"],
            "meals": ["treats", "supplements"],
            "default": ["treats", "supplements"]
        },
        "care": {
            "grooming": ["supplements", "hygiene"],
            "supplements": ["grooming", "hygiene"],
            "hygiene": ["grooming", "supplements"],
            "default": ["supplements", "grooming"]
        },
        "shop": {
            "toys": ["treats", "accessories"],
            "accessories": ["toys", "treats"],
            "default": ["treats", "accessories"]
        }
    }
    
    # Get the upsell map for this pillar
    upsell_map = pillar_upsell_map.get(product_pillar, pillar_upsell_map.get("celebrate", {}))
    
    # Get complementary subcategories based on current subcategory or category
    complementary = upsell_map.get(current_subcategory) or upsell_map.get(current_category) or upsell_map.get("default", ["treats", "accessories"])
    
    related_products = []
    
    # For pan-india category, prioritize pan-india shippable products
    if current_category == "pan-india":
        pan_india_products = await db.products.find(
            {"category": "pan-india", "id": {"$ne": product_id}},
            {"_id": 0}
        ).limit(limit).to_list(limit)
        related_products.extend(pan_india_products)
    else:
        # Strategy 1: Find products in same pillar with complementary subcategories
        for comp_subcat in complementary:
            subcat_products = await db.products.find(
                {
                    "$or": [
                        {"category": product_pillar, "subcategory": comp_subcat},
                        {"subcategory": comp_subcat},
                        {"category": comp_subcat}
                    ],
                    "id": {"$ne": product_id}
                },
                {"_id": 0}
            ).limit(3).to_list(3)
            related_products.extend(subcat_products)
        
        # Strategy 2: If not enough, get more from same pillar
        if len(related_products) < limit:
            remaining = limit - len(related_products)
            existing_ids = {product_id} | {p.get("id") for p in related_products}
            pillar_products = await db.products.find(
                {
                    "$or": [
                        {"pillar": product_pillar},
                        {"category": product_pillar}
                    ],
                    "id": {"$nin": list(existing_ids)}
                },
                {"_id": 0}
            ).limit(remaining).to_list(remaining)
            related_products.extend(pillar_products)
        
        # Strategy 3: If still not enough, get popular products
        if len(related_products) < limit:
            remaining = limit - len(related_products)
            existing_ids = {product_id} | {p.get("id") for p in related_products}
            popular = await db.products.find(
                {
                    "id": {"$nin": list(existing_ids)},
                    "category": {"$in": ["treats", "accessories"]}
                },
                {"_id": 0}
            ).limit(remaining).to_list(remaining)
            related_products.extend(popular)
    
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
    
    # ==================== PILLAR-SPECIFIC BUNDLES ====================
    bundles = []
    
    if product_pillar == "celebrate" and current_category in ["cakes", "pupcakes"]:
        treat = await db.products.find_one({"category": "treats"}, {"_id": 0})
        bandana = await db.products.find_one({"category": {"$in": ["accessories", "bandanas"]}}, {"_id": 0})
        if treat and bandana:
            bundle_price = current_price + treat.get("price", 0) + bandana.get("price", 0)
            bundles.append({
                "name": "🎉 Celebration Bundle",
                "description": "Complete the pawty!",
                "items": [product, treat, bandana],
                "originalPrice": bundle_price,
                "bundlePrice": int(bundle_price * 0.9),
                "savings": int(bundle_price * 0.1)
            })
    
    elif product_pillar == "travel":
        calming = await db.products.find_one({"subcategory": "calming"}, {"_id": 0})
        accessory = await db.products.find_one({"subcategory": "accessory"}, {"_id": 0})
        if calming and accessory:
            bundle_price = current_price + calming.get("price", 0) + accessory.get("price", 0)
            bundles.append({
                "name": "✈️ Travel Ready Bundle",
                "description": "Everything for a stress-free trip!",
                "items": [product, calming, accessory],
                "originalPrice": bundle_price,
                "bundlePrice": int(bundle_price * 0.85),
                "savings": int(bundle_price * 0.15)
            })
    
    return {
        "related": unique_related,
        "bundles": bundles,
        "category": current_category,
        "subcategory": current_subcategory,
        "pillar": product_pillar
    }


# ==================== PET SOUL BACKFILL ====================

@api_router.post("/admin/backfill-pet-soul-answers")
async def backfill_pet_soul_answers(background_tasks: BackgroundTasks, admin: dict = Depends(verify_admin)):
    """
    Backfill doggy_soul_answers for existing pets that have basic data but empty soul answers.
    This ensures onboarding data is reflected in the Pet Soul score.
    """
    async def do_backfill():
        updated_count = 0
        pets_cursor = db.pets.find({})
        
        async for pet in pets_cursor:
            current_answers = pet.get("doggy_soul_answers", {})
            new_answers = dict(current_answers)  # Start with existing answers
            updated = False
            
            # Map basic pet fields to soul answer keys (only if not already set)
            field_mappings = [
                ("name", "name"),
                ("breed", "breed"),
                ("gender", "gender"),
                ("date_of_birth", "dob"),
                ("dob", "dob"),
                ("gotcha_day", "gotcha_date"),
                ("is_neutered", "spayed_neutered"),
            ]
            
            for pet_field, soul_key in field_mappings:
                pet_value = pet.get(pet_field)
                if pet_value and soul_key not in new_answers:
                    if soul_key == "spayed_neutered":
                        new_answers[soul_key] = "Yes" if pet_value else "No"
                    else:
                        new_answers[soul_key] = pet_value
                    updated = True
            
            # Handle weight specially (combine with unit)
            if pet.get("weight") and "weight" not in new_answers:
                weight_unit = pet.get("weight_unit", "kg")
                new_answers["weight"] = f"{pet['weight']} {weight_unit}"
                updated = True
            
            # Update pet if we added new answers
            if updated and len(new_answers) > len(current_answers):
                await db.pets.update_one(
                    {"id": pet["id"]},
                    {"$set": {"doggy_soul_answers": new_answers}}
                )
                updated_count += 1
                logger.info(f"Backfilled soul answers for pet {pet.get('name')} ({pet['id']}): {len(new_answers)} total answers")
        
        logger.info(f"Pet Soul backfill complete: Updated {updated_count} pets")
    
    background_tasks.add_task(do_backfill)
    
    return {
        "success": True,
        "message": "Pet Soul backfill started in background. Check logs for progress."
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

# ============ Product Tags Management ============

@api_router.get("/admin/product-tags")
async def get_all_product_tags():
    """Get all product tags (default + custom)"""
    # Get custom tags from database
    custom_tags = await db.product_tags.find({}).to_list(100)
    
    # Combine with defaults
    all_tags = DISPLAY_TAG_OPTIONS.copy()
    for tag in custom_tags:
        if not any(t['id'] == tag['id'] for t in all_tags):
            all_tags.append({
                "id": tag['id'],
                "label": tag['label'],
                "color": tag.get('color', 'gray'),
                "is_custom": True,
                "created_at": tag.get('created_at')
            })
    
    return {"tags": all_tags, "total": len(all_tags)}

@api_router.post("/admin/product-tags")
async def create_product_tag(tag_data: dict):
    """Create a new custom product tag"""
    tag_id = tag_data.get('id') or tag_data.get('label', '').lower().replace(' ', '-')
    
    # Check if exists
    existing = await db.product_tags.find_one({"id": tag_id})
    if existing or any(t['id'] == tag_id for t in DISPLAY_TAG_OPTIONS):
        raise HTTPException(status_code=400, detail="Tag already exists")
    
    tag_doc = {
        "id": tag_id,
        "label": tag_data.get('label', tag_id),
        "color": tag_data.get('color', 'gray'),
        "emoji": tag_data.get('emoji', '🏷️'),
        "is_custom": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.product_tags.insert_one(tag_doc)
    del tag_doc['_id']
    
    return {"success": True, "tag": tag_doc}

@api_router.put("/admin/product-tags/{tag_id}")
async def update_product_tag(tag_id: str, tag_data: dict):
    """Update a custom product tag"""
    # Don't allow updating default tags
    if any(t['id'] == tag_id for t in DISPLAY_TAG_OPTIONS):
        raise HTTPException(status_code=400, detail="Cannot modify default tags")
    
    result = await db.product_tags.update_one(
        {"id": tag_id},
        {"$set": {
            "label": tag_data.get('label'),
            "color": tag_data.get('color'),
            "emoji": tag_data.get('emoji'),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    return {"success": True}

@api_router.delete("/admin/product-tags/{tag_id}")
async def delete_product_tag(tag_id: str):
    """Delete a custom product tag"""
    # Don't allow deleting default tags
    if any(t['id'] == tag_id for t in DISPLAY_TAG_OPTIONS):
        raise HTTPException(status_code=400, detail="Cannot delete default tags")
    
    # Remove tag from all products that have it
    await db.products.update_many(
        {"display_tags": tag_id},
        {"$pull": {"display_tags": tag_id}}
    )
    
    # Delete the tag
    result = await db.product_tags.delete_one({"id": tag_id})
    
    return {"success": True, "deleted": result.deleted_count > 0}

@api_router.get("/admin/products-by-tag/{tag_id}")
async def get_products_by_tag(tag_id: str, limit: int = 50):
    """Get all products with a specific tag"""
    products = await db.products.find(
        {"display_tags": tag_id},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    return {"products": products, "total": len(products), "tag_id": tag_id}

@api_router.post("/admin/products/bulk-tag")
async def bulk_tag_products(data: dict):
    """Add tags to multiple products at once"""
    product_ids = data.get('product_ids', [])
    tags_to_add = data.get('tags', [])
    
    if not product_ids or not tags_to_add:
        raise HTTPException(status_code=400, detail="product_ids and tags are required")
    
    result = await db.products.update_many(
        {"$or": [{"id": {"$in": product_ids}}, {"shopify_id": {"$in": product_ids}}]},
        {"$addToSet": {"display_tags": {"$each": tags_to_add}}}
    )
    
    return {"success": True, "modified_count": result.modified_count}

@api_router.post("/admin/products/bulk-untag")
async def bulk_untag_products(data: dict):
    """Remove tags from multiple products at once"""
    product_ids = data.get('product_ids', [])
    tags_to_remove = data.get('tags', [])
    
    if not product_ids or not tags_to_remove:
        raise HTTPException(status_code=400, detail="product_ids and tags are required")
    
    result = await db.products.update_many(
        {"$or": [{"id": {"$in": product_ids}}, {"shopify_id": {"$in": product_ids}}]},
        {"$pull": {"display_tags": {"$in": tags_to_remove}}}
    )
    
    return {"success": True, "modified_count": result.modified_count}

@api_router.get("/admin/products/all-pillars")
async def get_all_pillar_products(limit: int = 100, pillar: str = None):
    """Get products from all pillars for tag management"""
    query = {}
    if pillar:
        query["pillar"] = pillar
    
    products = await db.products.find(
        query,
        {"_id": 0, "id": 1, "title": 1, "name": 1, "pillar": 1, "category": 1, "display_tags": 1, "images": 1, "image": 1, "price": 1}
    ).limit(limit).to_list(limit)
    
    # Ensure name/title consistency
    for p in products:
        if not p.get("title") and p.get("name"):
            p["title"] = p["name"]
        if not p.get("name") and p.get("title"):
            p["name"] = p["title"]
    
    # Also get bundles
    bundles = await db.dine_bundles.find(
        {},
        {"_id": 0, "id": 1, "name": 1, "display_tags": 1, "images": 1, "image": 1, "price": 1}
    ).to_list(50)
    
    # Format bundles to match product structure
    for bundle in bundles:
        bundle["title"] = bundle.get("name")
        bundle["pillar"] = "dine"
        bundle["category"] = "bundle"
    
    # Get celebrate bundles too
    celebrate_bundles = await db.celebrate_bundles.find(
        {},
        {"_id": 0, "id": 1, "name": 1, "display_tags": 1, "images": 1, "image": 1, "price": 1, "bundle_price": 1}
    ).to_list(50)
    
    for bundle in celebrate_bundles:
        bundle["title"] = bundle.get("name")
        bundle["pillar"] = "celebrate"
        bundle["category"] = "bundle"
        if not bundle.get("price"):
            bundle["price"] = bundle.get("bundle_price")
    
    all_items = products + bundles + celebrate_bundles
    
    return {"products": all_items, "total": len(all_items)}


# NOTE: These static routes MUST come before any {product_id} routes to avoid route conflicts
@api_router.get("/admin/products/intelligence-stats")
async def get_intelligence_stats(
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Get statistics about product intelligence tagging"""
    verify_admin(credentials)
    
    # Count products with intelligent tags
    total = await db.products.count_documents({})
    with_intelligent_tags = await db.products.count_documents({"intelligent_tags": {"$exists": True, "$ne": []}})
    with_breed_tags = await db.products.count_documents({"breed_tags": {"$exists": True, "$ne": []}})
    with_health_tags = await db.products.count_documents({"health_tags": {"$exists": True, "$ne": []}})
    without_images = await db.products.count_documents(
        {"$or": [{"image": None}, {"image": ""}, {"image": {"$exists": False}}]}
    )
    with_stock_images = await db.products.count_documents({"is_stock_image": True})
    
    # Get tag distribution
    pipeline = [
        {"$unwind": {"path": "$intelligent_tags", "preserveNullAndEmptyArrays": False}},
        {"$group": {"_id": "$intelligent_tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 30}
    ]
    top_tags = await db.products.aggregate(pipeline).to_list(30)
    
    return {
        "total_products": total,
        "with_intelligent_tags": with_intelligent_tags,
        "with_breed_tags": with_breed_tags,
        "with_health_tags": with_health_tags,
        "without_images": without_images,
        "with_stock_images": with_stock_images,
        "coverage_percent": round((with_intelligent_tags / total * 100) if total > 0 else 0, 1),
        "top_tags": [{"tag": t["_id"], "count": t["count"]} for t in top_tags]
    }


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


# ==================== BREED TAGS FOR PRODUCTS ====================

# Common dog breeds for tagging
BREED_TAG_OPTIONS = [
    "Labrador", "Golden Retriever", "German Shepherd", "Beagle", "Poodle",
    "Bulldog", "French Bulldog", "Rottweiler", "Yorkshire Terrier", "Boxer",
    "Dachshund", "Siberian Husky", "Doberman", "Great Dane", "Shih Tzu",
    "Miniature Schnauzer", "Shiba Inu", "Pomeranian", "Boston Terrier", "Corgi",
    "Australian Shepherd", "Cocker Spaniel", "Pug", "Maltese", "Chihuahua",
    "Border Collie", "Bernese Mountain Dog", "Samoyed", "Akita", "Lhasa Apso",
    "Bichon Frise", "Cavalier King Charles Spaniel", "Jack Russell Terrier",
    "Indie", "Mixed Breed", "Small Breed", "Medium Breed", "Large Breed", "Giant Breed"
]

@api_router.get("/admin/breed-tags/options")
async def get_breed_tag_options():
    """Get available breed tag options (combines default + custom from DB)"""
    # Get custom breeds from DB
    custom_breeds_doc = await db.app_settings.find_one({"key": "custom_breeds"})
    custom_breeds = custom_breeds_doc.get("breeds", []) if custom_breeds_doc else []
    
    # Combine default + custom breeds and sort
    all_breeds = sorted(set(BREED_TAG_OPTIONS + custom_breeds))
    return {"breeds": all_breeds}

@api_router.post("/admin/breed-tags/add")
async def add_custom_breed(data: dict):
    """Add a new custom breed to the available options"""
    breed = data.get("breed", "").strip()
    
    if not breed:
        raise HTTPException(status_code=400, detail="Breed name is required")
    
    # Format breed name properly (Title Case)
    breed = " ".join(word.capitalize() for word in breed.split())
    
    # Check if it already exists in default options
    if breed in BREED_TAG_OPTIONS:
        raise HTTPException(status_code=400, detail="Breed already exists in default options")
    
    # Get existing custom breeds
    custom_breeds_doc = await db.app_settings.find_one({"key": "custom_breeds"})
    custom_breeds = custom_breeds_doc.get("breeds", []) if custom_breeds_doc else []
    
    # Check if already in custom breeds
    if breed in custom_breeds:
        raise HTTPException(status_code=400, detail="Breed already exists")
    
    # Add new breed
    custom_breeds.append(breed)
    custom_breeds.sort()
    
    # Upsert to DB
    await db.app_settings.update_one(
        {"key": "custom_breeds"},
        {"$set": {"breeds": custom_breeds, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"success": True, "breed": breed, "total_breeds": len(BREED_TAG_OPTIONS) + len(custom_breeds)}


@api_router.put("/admin/products/{product_id}/breed-tags")
async def update_product_breed_tags(product_id: str, breed_tags: List[str]):
    """Update breed tags for a product"""
    result = await db.products.update_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"$set": {"breed_tags": breed_tags, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "breed_tags": breed_tags}


@api_router.post("/admin/products/bulk-breed-tags")
async def bulk_update_breed_tags(data: dict):
    """Bulk update breed tags for multiple products"""
    product_ids = data.get("product_ids", [])
    breed_tags = data.get("breed_tags", [])
    action = data.get("action", "add")  # "add", "remove", or "set"
    
    if not product_ids:
        raise HTTPException(status_code=400, detail="No product IDs provided")
    
    updated_count = 0
    for product_id in product_ids:
        if action == "set":
            update = {"$set": {"breed_tags": breed_tags}}
        elif action == "add":
            update = {"$addToSet": {"breed_tags": {"$each": breed_tags}}}
        elif action == "remove":
            update = {"$pull": {"breed_tags": {"$in": breed_tags}}}
        else:
            continue
            
        result = await db.products.update_one(
            {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
            {**update, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        if result.modified_count > 0:
            updated_count += 1
    
    return {"success": True, "updated_count": updated_count}


@api_router.get("/admin/products/by-breed/{breed}")
async def get_products_by_breed(breed: str, limit: int = 50):
    """Get all products tagged with a specific breed"""
    products = await db.products.find(
        {"breed_tags": {"$regex": breed, "$options": "i"}},
        {"_id": 0, "id": 1, "name": 1, "price": 1, "image": 1, "breed_tags": 1, "category": 1}
    ).limit(limit).to_list(limit)
    
    return {"breed": breed, "products": products, "count": len(products)}

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


@api_router.post("/admin/products/import-csv")
async def import_products_csv(
    request: ProductCSVImportRequest,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Import products from CSV data"""
    verify_admin(credentials)
    
    imported = 0
    updated = 0
    errors = []
    
    for product_data in request.products:
        try:
            # Check if product exists by name
            existing = await db.products.find_one({"name": product_data.get("name")})
            
            product_doc = {
                "name": product_data.get("name", ""),
                "description": product_data.get("description", ""),
                "category": product_data.get("category", "other"),
                "price": float(product_data.get("price", 0)),
                "image": product_data.get("image", ""),
                "status": product_data.get("status", "active"),
                "available": product_data.get("available", True),
                "tags": product_data.get("tags", []),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            if product_data.get("original_price"):
                product_doc["original_price"] = float(product_data["original_price"])
            
            if existing:
                # Update existing product
                await db.products.update_one(
                    {"_id": existing["_id"]},
                    {"$set": product_doc}
                )
                updated += 1
            else:
                # Create new product
                product_doc["id"] = f"csv-{uuid.uuid4().hex[:12]}"
                product_doc["created_at"] = datetime.now(timezone.utc).isoformat()
                await db.products.insert_one(product_doc)
                imported += 1
                
        except Exception as e:
            errors.append(f"Error with '{product_data.get('name', 'Unknown')}': {str(e)}")
    
    return {
        "imported": imported,
        "updated": updated,
        "errors": errors[:10] if errors else []
    }


@api_router.get("/admin/products/export-csv")
async def export_products_csv(
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Export all products as CSV-compatible JSON"""
    verify_admin(credentials)
    
    products = await db.products.find({}, {"_id": 0}).to_list(10000)
    
    return {
        "products": products,
        "total": len(products)
    }


# ==================== PRODUCT INTELLIGENCE ENGINE ====================

@api_router.post("/admin/products/run-intelligence")
async def run_product_intelligence(
    update_db: bool = True,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """
    Run AI-powered product intelligence to auto-generate tags.
    This analyzes all products and adds intelligent tags for:
    - Breeds (labrador, golden retriever, indie, etc.)
    - Size categories (small_breed, medium_breed, large_breed)
    - Health/Purpose (digestive, dental, skin_coat, joint, etc.)
    - Life stages (puppy, adult, senior)
    - Occasions (birthday, christmas, gift)
    - Diet/Ingredients (grain_free, chicken, peanut_butter, etc.)
    - Product types (cake, treat, toy, etc.)
    - Species (dog, cat)
    """
    verify_admin(credentials)
    
    engine = ProductIntelligenceEngine(db)
    results = await engine.process_all_products(update_db=update_db)
    
    return {
        "success": True,
        "message": f"Processed {results['total_processed']} products",
        "results": results
    }


@api_router.post("/admin/products/enhance-descriptions")
async def enhance_product_descriptions(
    update_db: bool = True,
    batch_size: int = 20,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """
    Use AI to enhance all product descriptions.
    This creates professional, engaging descriptions for Mira AI to reference.
    """
    verify_admin(credentials)
    
    enhancer = AIDescriptionEnhancer(db)
    results = await enhancer.enhance_all_products(batch_size=batch_size, update_db=update_db)
    
    return {
        "success": True,
        "message": f"Enhanced {results['enhanced']} product descriptions",
        "results": results
    }


@api_router.post("/admin/products/enhance-single/{product_id}")
async def enhance_single_product_description(
    product_id: str,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Enhance description for a single product using AI"""
    verify_admin(credentials)
    
    enhancer = AIDescriptionEnhancer(db)
    result = await enhancer.enhance_single_product(product_id)
    
    return result


@api_router.post("/admin/products/analyze-single/{product_id}")
async def analyze_single_product(
    product_id: str,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Analyze a single product and return suggested tags (without saving)"""
    verify_admin(credentials)
    
    product = await db.products.find_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"_id": 0}
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    engine = ProductIntelligenceEngine(db)
    analysis = engine.analyze_product(product)
    
    return {
        "product_id": product_id,
        "current_name": product.get("name"),
        "analysis": analysis
    }


@api_router.post("/admin/products/add-stock-images")
async def add_stock_images(
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Add stock images to products that don't have images"""
    verify_admin(credentials)
    
    results = await add_stock_images_to_products(db)
    
    return {
        "success": True,
        "message": f"Added stock images to {results['total_updated']} products",
        "results": results
    }


@api_router.put("/admin/products/{product_id}/full-update")
async def full_product_update(
    product_id: str,
    updates: dict,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """
    Full product update including all editable fields:
    - name, description, price, category
    - image (URL or uploaded)
    - display_tags, intelligent_tags
    - gst_rate, shipping_weight, packaging_type
    - available, is_pan_india_shippable
    """
    verify_admin(credentials)
    
    # Extended allowed fields for full update
    allowed_fields = [
        "name", "description", "price", "original_price", "category",
        "image", "images", "display_tags", "intelligent_tags",
        "breed_tags", "health_tags", "lifestage_tags", "occasion_tags", "diet_tags", "size_tags",
        "gst_rate", "shipping_weight", "packaging_type", "packaging_cost",
        "available", "is_pan_india_shippable", "status",
        "bundle_type", "bundle_includes", "options", "variants",
        "search_keywords", "seo_title", "seo_description"
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
            {"intelligent_tags": search_regex},
            {"breed_tags": search_regex},
            {"health_tags": search_regex},
            {"search_keywords": search_regex},
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
        "products": products,
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


# ==================== ADMIN MEMBERS ====================
# Routes moved to admin_member_routes.py


# ==================== LOYALTY POINTS SYSTEM ====================
# Routes moved to loyalty_routes.py

# ==================== DISCOUNT CODES SYSTEM ====================
# Routes moved to discount_routes.py

# ==================== USER & MEMBERSHIP ROUTES ====================
# NOTE: Auth routes (register, login, google/session, logout, me) have been moved to auth_routes.py

# Pydantic models for membership onboarding
class PetOnboardModel(BaseModel):
    name: str
    breed: str
    gender: Optional[str] = None
    birth_date: Optional[str] = None
    gotcha_date: Optional[str] = None
    weight: Optional[float] = None
    weight_unit: Optional[str] = "kg"
    is_neutered: Optional[bool] = None
    species: str = "dog"

class ParentOnboardModel(BaseModel):
    name: str
    email: str
    phone: str
    whatsapp: Optional[str] = None
    address: Optional[str] = None
    city: str
    pincode: str
    password: str
    preferred_contact: Optional[str] = "whatsapp"
    notifications: Optional[dict] = None
    accepted_terms: bool = False
    accepted_privacy: bool = False

class MembershipOnboardModel(BaseModel):
    parent: ParentOnboardModel
    pets: List[PetOnboardModel]
    plan_type: str = "annual"
    pet_count: int = 1

@api_router.post("/membership/onboard")
async def membership_onboard(data: MembershipOnboardModel):
    """
    Onboard a new member with pet parent details and pet profiles.
    Creates user account, pet profiles, and prepares for payment.
    """
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Check if email exists
    existing = await db.users.find_one({"email": data.parent.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered. Please login.")
    
    user_id = str(uuid.uuid4())
    pet_ids = []
    
    try:
        # Create pet profiles first
        for pet_data in data.pets:
            pet_id = str(uuid.uuid4())
            pet_pass_number = await generate_pet_pass_number_server()
            
            # Pre-populate doggy_soul_answers from onboarding data
            initial_soul_answers = {}
            if pet_data.name:
                initial_soul_answers["name"] = pet_data.name
            if pet_data.breed:
                initial_soul_answers["breed"] = pet_data.breed
            if pet_data.gender:
                initial_soul_answers["gender"] = pet_data.gender
            if pet_data.birth_date:
                initial_soul_answers["dob"] = pet_data.birth_date
            if pet_data.gotcha_date:
                initial_soul_answers["gotcha_date"] = pet_data.gotcha_date
            if pet_data.weight:
                initial_soul_answers["weight"] = str(pet_data.weight) + " " + (pet_data.weight_unit or "kg")
            if pet_data.is_neutered is not None:
                initial_soul_answers["spayed_neutered"] = "Yes" if pet_data.is_neutered else "No"
            
            pet_doc = {
                "id": pet_id,
                "pet_pass_number": pet_pass_number,
                "name": pet_data.name,
                "breed": pet_data.breed,
                "species": pet_data.species,
                "gender": pet_data.gender,
                "date_of_birth": pet_data.birth_date,
                "dob": pet_data.birth_date,
                "gotcha_day": pet_data.gotcha_date,
                "weight": pet_data.weight,
                "weight_unit": pet_data.weight_unit,
                "is_neutered": pet_data.is_neutered,
                "owner_email": data.parent.email,
                "owner_name": data.parent.name,
                "owner_id": user_id,
                "identity": {
                    "name": pet_data.name,
                    "breed": pet_data.breed,
                    "gender": pet_data.gender,
                    "weight": pet_data.weight,
                    "weight_unit": pet_data.weight_unit
                },
                "doggy_soul_answers": initial_soul_answers,
                "soul_enrichments": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.pets.insert_one(pet_doc)
            pet_ids.append(pet_id)
            logger.info(f"Created pet profile: {pet_data.name} ({pet_id}) - Pet Pass: {pet_pass_number} with {len(initial_soul_answers)} pre-filled answers")
        
        # Create user account (pending membership until payment)
        user_doc = {
            "id": user_id,
            "email": data.parent.email,
            "password_hash": pwd_context.hash(data.parent.password),
            "name": data.parent.name,
            "phone": data.parent.phone,
            "whatsapp": data.parent.whatsapp or data.parent.phone,
            "address": data.parent.address,
            "city": data.parent.city,
            "pincode": data.parent.pincode,
            "pet_ids": pet_ids,
            "preferred_contact": data.parent.preferred_contact,
            "notification_settings": data.parent.notifications or {
                "orderUpdates": True,
                "promotions": True,
                "petReminders": True,
                "newsletter": False
            },
            "accepted_terms": data.parent.accepted_terms,
            "accepted_privacy": data.parent.accepted_privacy,
            "terms_accepted_at": datetime.now(timezone.utc).isoformat() if data.parent.accepted_terms else None,
            "membership_tier": "pending",  # Will be upgraded after payment
            "membership_type": data.plan_type,
            "membership_expires": None,
            "chat_count_today": 0,
            "last_chat_date": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(user_doc)
        logger.info(f"Created user account: {data.parent.email} ({user_id})")
        
        # Calculate pricing - Updated for Pet Pass (Trial = 1 month, Annual = 12 months)
        is_trial = data.plan_type in ["trial", "monthly"]
        base_price = 499 if is_trial else 4999
        additional_pet_price = 249 if is_trial else 2499
        additional_pets = max(0, len(data.pets) - 1)
        subtotal = base_price + (additional_pets * additional_pet_price)
        gst = int(subtotal * 0.18)
        total = subtotal + gst
        
        # Create pending order for payment
        order_id = f"TDC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        order_doc = {
            "order_id": order_id,
            "user_id": user_id,
            "user_email": data.parent.email,
            "type": "membership",
            "plan_type": data.plan_type,
            "pet_count": len(data.pets),
            "pet_ids": pet_ids,
            "amount": {
                "base": base_price,
                "additional_pets": additional_pets * additional_pet_price,
                "subtotal": subtotal,
                "gst": gst,
                "total": total
            },
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.membership_orders.insert_one(order_doc)
        logger.info(f"Created membership order: {order_id}")
        
        # Admin notification
        await create_admin_notification(
            notification_type="member",
            title="🐾 New Membership Signup",
            message=f"{data.parent.name} ({data.parent.email}) started membership with {len(data.pets)} pet(s). Awaiting payment.",
            category="general",
            related_id=user_id,
            link_to="/admin?tab=members",
            priority="high",
            metadata={
                "name": data.parent.name,
                "email": data.parent.email,
                "city": data.parent.city,
                "pets": [p.name for p in data.pets],
                "plan": data.plan_type,
                "amount": total
            }
        )
        
        return {
            "success": True,
            "user_id": user_id,
            "order_id": order_id,
            "pet_ids": pet_ids,
            "amount": total,
            "message": "Account created. Please complete payment."
        }
        
    except Exception as e:
        # Cleanup on error
        logger.error(f"Membership onboard error: {e}")
        # Try to cleanup created records
        if pet_ids:
            await db.pets.delete_many({"id": {"$in": pet_ids}})
        await db.users.delete_one({"id": user_id})
        raise HTTPException(status_code=500, detail=f"Failed to create membership: {str(e)}")


# ==================== MULTI-PET HOUSEHOLD FEATURES ====================
# Routes moved to household_routes.py

# Keep calculate_pet_soul_score here as it may be used by other parts of the app
def calculate_pet_soul_score(pet: dict) -> int:
    """Calculate Pet Soul completeness score"""
    soul_answers = pet.get("doggy_soul_answers", {})
    if not soul_answers:
        return 0
    
    # Count filled fields
    filled = sum(1 for v in soul_answers.values() if v and v not in ['', [], None, 'Unknown'])
    total_possible = 24  # Expected total fields across 8 pillars
    
    return min(100, int((filled / total_possible) * 100))


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
async def create_pet_profile(pet: PetProfileCreate, current_user: dict = Depends(get_current_user)):
    """Create a new pet profile linked to the authenticated user"""
    pet_id = f"pet-{uuid.uuid4().hex[:12]}"
    pet_pass_number = await generate_pet_pass_number_server()
    now = datetime.now(timezone.utc).isoformat()
    
    pet_data = {
        "id": pet_id,
        "pet_pass_number": pet_pass_number,
        **pet.model_dump(),
        "owner_email": current_user["email"],  # Link to authenticated user
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
    
    # Auto-create ticket for Command Center
    try:
        from ticket_auto_creation import on_pet_added
        await on_pet_added(pet_data, current_user)
    except Exception as e:
        logger.error(f"Auto-ticket for pet addition failed: {e}")
    
    logger.info(f"Created pet profile: {pet_id} - {pet.name}")
    return {"message": "Pet profile created", "pet": pet_data}


@api_router.get("/pets")
@api_router.get("/pets/my-pets")
async def get_my_pets(current_user: dict = Depends(get_current_user)):
    """Get pets for the logged-in user"""
    pets = await db.pets.find({"owner_email": current_user["email"]}, {"_id": 0}).to_list(50)
    
    # Ensure overall_score is set for consistency (use soul_score as fallback)
    for pet in pets:
        if "overall_score" not in pet and "soul_score" in pet:
            pet["overall_score"] = pet["soul_score"]
        elif "overall_score" not in pet:
            # Calculate from doggy_soul_answers if available
            answers = pet.get("doggy_soul_answers", {}) or pet.get("soul_answers", {})
            if answers:
                total_questions = 59
                answered = len(answers)
                pet["overall_score"] = round((answered / total_questions) * 100)
            else:
                pet["overall_score"] = 0
    
    return {"pets": pets}


@api_router.get("/pets/public")
async def get_public_pets(limit: int = 100, skip: int = 0):
    """Get all pets (public view for Pet Soul page without login)"""
    pets = await db.pets.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return {"pets": pets}


@api_router.post("/pets/public")
async def create_pet_profile_public(pet: PetProfileCreate):
    """Create a new pet profile without authentication (public form)"""
    pet_id = f"pet-{uuid.uuid4().hex[:12]}"
    pet_pass_number = await generate_pet_pass_number_server()
    now = datetime.now(timezone.utc).isoformat()
    
    pet_data = {
        "id": pet_id,
        "pet_pass_number": pet_pass_number,
        **pet.model_dump(),
        "owner_email": pet.owner_email,  # Use provided email
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
    
    # Auto-create ticket for Command Center
    try:
        from ticket_auto_creation import on_pet_added
        user = await db.users.find_one({"email": pet.owner_email}, {"_id": 0, "password": 0})
        await on_pet_added(pet_data, user or {"email": pet.owner_email, "name": pet.owner_name})
    except Exception as e:
        logger.error(f"Auto-ticket for pet addition failed: {e}")
    
    logger.info(f"Created public pet profile: {pet_id} - {pet.name}")
    return {"message": "Pet profile created", "pet": pet_data}


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


@api_router.post("/pets/{pet_id}/soul-answer")
async def save_pet_soul_answer(pet_id: str, answer_data: dict, current_user: dict = Depends(get_current_user)):
    """Save a single Pet Soul answer and recalculate score"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    question_id = answer_data.get("question_id")
    answer = answer_data.get("answer")
    
    if not question_id or not answer:
        raise HTTPException(status_code=400, detail="question_id and answer are required")
    
    # Get current soul answers or initialize
    soul_answers = pet.get("doggy_soul_answers", {})
    soul_answers[question_id] = answer
    
    # Recalculate score
    filled = sum(1 for v in soul_answers.values() if v and v not in ['', [], None, 'Unknown'])
    total_possible = 26  # Total expected questions
    new_score = min(100, int((filled / total_possible) * 100))
    
    # Update pet
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": {
            "doggy_soul_answers": soul_answers,
            "overall_score": new_score,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": "Answer saved",
        "question_id": question_id,
        "answer": answer,
        "new_score": new_score,
        "pet_name": pet.get("name"),
        "answers_count": filled
    }


@api_router.patch("/pets/{pet_id}/soul-answers")
async def patch_pet_soul_answers(pet_id: str, answers: dict):
    """PATCH endpoint to update multiple soul answers at once (used by UnifiedPetPage inline editing)"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Get current soul answers or initialize
    soul_answers = pet.get("doggy_soul_answers", {})
    
    # Merge the new answers into existing
    for key, value in answers.items():
        if value is not None and value != '':
            soul_answers[key] = value
    
    # Recalculate score
    filled = sum(1 for v in soul_answers.values() if v and v not in ['', [], None, 'Unknown'])
    total_possible = 26  # Total expected questions
    new_score = min(100, int((filled / total_possible) * 100))
    
    # Update pet
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": {
            "doggy_soul_answers": soul_answers,
            "overall_score": new_score,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": "Answers updated",
        "new_score": new_score,
        "answers_count": filled
    }


@api_router.post("/pets/{pet_id}/photo")
async def upload_pet_photo(pet_id: str, photo: UploadFile = File(...)):
    """Upload or update a pet's photo - stores as base64 in database for persistence"""
    import base64
    import os
    
    # Validate pet exists
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Validate file type
    if not photo.content_type or not photo.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read file content
    content = await photo.read()
    
    # Validate file size (max 2MB for base64 storage)
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be less than 2MB")
    
    # Get file extension and content type
    file_ext = photo.filename.split('.')[-1].lower() if '.' in photo.filename else 'jpg'
    content_type = photo.content_type or 'image/jpeg'
    
    # Convert to base64 for database storage (persists across deployments)
    photo_base64 = base64.b64encode(content).decode('utf-8')
    
    # Generate URL using API route that will serve from database
    photo_url = f"/api/pet-photo/{pet_id}"
    
    # Update pet record with both URL and base64 data
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": {
            "photo_url": photo_url, 
            "photo_base64": photo_base64,
            "photo_content_type": content_type,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Also update in member's pets array
    await db.members.update_one(
        {"pets.id": pet_id},
        {"$set": {"pets.$.photo_url": photo_url}}
    )
    
    logger.info(f"Pet photo uploaded for {pet_id}, size: {len(content)} bytes")
    return {"photo_url": photo_url, "message": "Photo uploaded successfully"}


@api_router.get("/pet-photo/{pet_id}/{filename:path}")
async def serve_pet_photo_legacy(pet_id: str, filename: str = ""):
    """Legacy route - redirects to new route"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"/api/pet-photo/{pet_id}")


@api_router.get("/pet-photo/{pet_id}")
async def serve_pet_photo(pet_id: str):
    """Serve pet photos from database (base64) for persistence across deployments"""
    from fastapi.responses import Response
    import base64
    
    # Get pet from database
    pet = await db.pets.find_one({"id": pet_id}, {"photo_base64": 1, "photo_content_type": 1, "photo_url": 1})
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Check if we have base64 photo in database
    if pet.get("photo_base64"):
        content = base64.b64decode(pet["photo_base64"])
        content_type = pet.get("photo_content_type", "image/jpeg")
        return Response(content=content, media_type=content_type)
    
    # Fallback: try to serve from old file path (for backward compatibility)
    old_photo_url = pet.get("photo_url", "")
    if old_photo_url and "/" in old_photo_url:
        filename = old_photo_url.split("/")[-1]
        file_path = f"/app/backend/static/uploads/pets/{filename}"
        if os.path.exists(file_path):
            from fastapi.responses import FileResponse
            ext = filename.split('.')[-1].lower() if '.' in filename else 'jpg'
            content_types = {
                'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp'
            }
            return FileResponse(file_path, media_type=content_types.get(ext, 'image/jpeg'))
    
    raise HTTPException(status_code=404, detail="Photo not found")


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
        persona = soul.get("persona", "adventurer")
        persona_info = DOG_PERSONAS.get(persona, {"id": "adventurer", "name": "The Adventurer", "description": "Loves outdoor activities"})
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
        persona = soul.get("persona", "adventurer")
        persona_info = DOG_PERSONAS.get(persona, {"id": "adventurer", "name": "The Adventurer", "description": "Loves outdoor activities"})
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


@api_router.post("/pets/{pet_id}/soul/celebrate")
async def add_celebrate_to_pet_soul(pet_id: str, data: dict):
    """Record a celebrate pillar order to Pet Soul"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Create celebrate history entry
    celebrate_entry = {
        "id": f"cel-{uuid.uuid4().hex[:8]}",
        "type": data.get("type", "order"),
        "product_id": data.get("product_id"),
        "product_name": data.get("product_name"),
        "category": data.get("category"),
        "price": data.get("price"),
        "variant": data.get("variant"),
        "delivery_date": data.get("delivery_date"),
        "occasion": data.get("occasion", "treat"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update Pet Soul with celebrate history
    soul = pet.get("soul", {}) or {}
    celebrate_history = soul.get("celebrate_history", [])
    celebrate_history.append(celebrate_entry)
    
    # Track favorite categories/products for recommendations
    preferences = soul.get("preferences", {}) or {}
    favorite_cake_categories = preferences.get("favorite_cake_categories", [])
    if data.get("category") and data.get("category") not in favorite_cake_categories:
        favorite_cake_categories.append(data.get("category"))
        if len(favorite_cake_categories) > 5:
            favorite_cake_categories = favorite_cake_categories[-5:]  # Keep last 5
    
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": {
            "soul.celebrate_history": celebrate_history,
            "soul.preferences.favorite_cake_categories": favorite_cake_categories,
            "soul.last_celebrate_order": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    logger.info(f"Pet Soul updated with celebrate order for pet {pet_id}")
    
    return {"message": "Celebrate order recorded in Pet Soul", "entry_id": celebrate_entry["id"]}


@api_router.post("/pets/{pet_id}/soul/stay")
async def add_stay_to_pet_soul(pet_id: str, data: dict):
    """Record a stay pillar booking to Pet Soul"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Create stay history entry
    stay_entry = {
        "id": f"stay-{uuid.uuid4().hex[:8]}",
        "type": data.get("type", "booking"),
        "property_id": data.get("property_id"),
        "property_name": data.get("property_name"),
        "city": data.get("city"),
        "property_type": data.get("property_type"),
        "check_in_date": data.get("check_in_date"),
        "check_out_date": data.get("check_out_date"),
        "pet_fee": data.get("pet_fee"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update Pet Soul with stay history
    soul = pet.get("soul", {}) or {}
    stay_history = soul.get("stay_history", [])
    stay_history.append(stay_entry)
    
    # Track favorite cities and property types for recommendations
    preferences = soul.get("preferences", {}) or {}
    
    # Track favorite travel cities
    favorite_cities = preferences.get("favorite_travel_cities", [])
    if data.get("city") and data.get("city") not in favorite_cities:
        favorite_cities.append(data.get("city"))
        if len(favorite_cities) > 5:
            favorite_cities = favorite_cities[-5:]
    
    # Track preferred property types
    preferred_property_types = preferences.get("preferred_property_types", [])
    if data.get("property_type") and data.get("property_type") not in preferred_property_types:
        preferred_property_types.append(data.get("property_type"))
        if len(preferred_property_types) > 3:
            preferred_property_types = preferred_property_types[-3:]
    
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": {
            "soul.stay_history": stay_history,
            "soul.preferences.favorite_travel_cities": favorite_cities,
            "soul.preferences.preferred_property_types": preferred_property_types,
            "soul.last_stay_booking": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    logger.info(f"Pet Soul updated with stay booking for pet {pet_id}")
    
    return {"message": "Stay booking recorded in Pet Soul", "entry_id": stay_entry["id"]}


def generate_celebration_message(pet: dict, celebration: dict, days_until: int) -> dict:
    """Generate personalized celebration message based on pet's soul"""
    soul = pet.get("soul", {}) or {}
    persona = soul.get("persona", "adventurer")
    persona_info = DOG_PERSONAS.get(persona, {"id": "adventurer", "name": "The Adventurer", "description": "Loves outdoor activities"})
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
            subject = "A special milestone for your best friend... 🐾"
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
        problematic_products = []  # Track products with issues
        
        for sp in shopify_products:
            # DEBUG: Log raw Shopify product data for title issues
            raw_title = sp.get("title")
            raw_handle = sp.get("handle")
            shopify_id = sp.get("id")
            
            # Check for problematic products BEFORE transform
            if not raw_title or raw_title.strip() == "" or "untitled" in (raw_title or "").lower():
                logger.warning("[SHOPIFY SYNC DEBUG] Problematic product detected:")
                logger.warning(f"  - Shopify ID: {shopify_id}")
                logger.warning(f"  - Raw Title: '{raw_title}'")
                logger.warning(f"  - Handle: '{raw_handle}'")
                logger.warning(f"  - Product Type: '{sp.get('product_type')}'")
                logger.warning(f"  - Variants: {len(sp.get('variants', []))}")
                logger.warning(f"  - Full product data: {sp}")
                problematic_products.append({
                    "shopify_id": shopify_id,
                    "raw_title": raw_title,
                    "handle": raw_handle,
                    "product_type": sp.get("product_type")
                })
            
            transformed = transform_shopify_product(sp)
            
            # Verify transformation result
            if not transformed.get("name") or "untitled" in transformed.get("name", "").lower():
                logger.error("[SHOPIFY SYNC ERROR] Product still untitled after transform:")
                logger.error(f"  - Transformed name: '{transformed.get('name')}'")
                logger.error(f"  - From Shopify ID: {shopify_id}")
            
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
            
            # ALSO sync to unified_products for Product Box
            unified_id = f"shopify-{sp['id']}"
            existing_unified = await db.unified_products.find_one({"id": unified_id})
            
            # Build unified product document with full options
            # Get images from transformed data - transform uses "image" not "image_url"
            product_image = transformed.get("image") or transformed.get("image_url") or ""
            product_images = transformed.get("images", [])
            if product_image and product_image not in product_images:
                product_images = [product_image] + product_images
            
            unified_doc = {
                "id": unified_id,
                "shopify_id": sp.get("id"),
                "shopify_handle": sp.get("handle"),
                "name": transformed.get("name"),
                "title": transformed.get("title"),
                "description": transformed.get("description"),
                "short_description": transformed.get("description", "")[:200] if transformed.get("description") else "",
                "category": transformed.get("category"),
                "tags": transformed.get("tags", []),
                "image_url": product_image,
                "image": product_image,
                "images": product_images,
                "options": transformed.get("options", []),
                "variants": transformed.get("variants", []),
                "has_variants": len(transformed.get("variants", [])) > 1,
                "pricing": {
                    "base_price": transformed.get("price", 0),
                    "compare_price": transformed.get("originalPrice", 0),
                    "gst_rate": 18
                },
                "in_stock": transformed.get("available", True),
                "visibility": {"status": "active"},
                "primary_pillar": "celebrate",
                "pillars": ["celebrate", "shop"],
                "source": "shopify",
                "synced_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            if existing_unified:
                # Update existing - preserve intelligent_tags if present
                await db.unified_products.update_one(
                    {"id": unified_id},
                    {"$set": {
                        "name": unified_doc["name"],
                        "title": unified_doc["title"],
                        "description": unified_doc["description"],
                        "short_description": unified_doc["short_description"],
                        "category": unified_doc["category"],
                        "tags": unified_doc["tags"],
                        "image_url": unified_doc["image_url"],
                        "image": unified_doc["image"],
                        "images": unified_doc["images"],
                        "options": unified_doc["options"],
                        "variants": unified_doc["variants"],
                        "has_variants": unified_doc["has_variants"],
                        "pricing": unified_doc["pricing"],
                        "in_stock": unified_doc["in_stock"],
                        "synced_at": unified_doc["synced_at"],
                        "updated_at": unified_doc["updated_at"]
                    }}
                )
            else:
                # Insert new
                unified_doc["created_at"] = datetime.now(timezone.utc).isoformat()
                await db.unified_products.insert_one(unified_doc)
            
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

        # Save sync log with problematic products info
        sync_log = {
            "type": "shopify",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_fetched": len(shopify_products),
            "added": added,
            "updated": updated,
            "problematic_products": problematic_products,
            "problematic_count": len(problematic_products),
            "status": "success" if not problematic_products else "success_with_warnings"
        }
        await db.sync_logs.insert_one(sync_log)
        
        # Log summary of issues
        if problematic_products:
            logger.warning(f"[SHOPIFY SYNC] Completed with {len(problematic_products)} problematic products:")
            for pp in problematic_products:
                logger.warning(f"  - ID: {pp['shopify_id']}, Title: '{pp['raw_title']}', Handle: '{pp['handle']}'")
        
        return {
            "message": "Shopify sync completed",
            "total_fetched": len(shopify_products),
            "added": added,
            "updated": updated,
            "unified_products_synced": synced,
            "problematic_products": problematic_products,
            "problematic_count": len(problematic_products)
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


@admin_router.get("/sync/logs")
async def get_sync_logs(limit: int = 10, username: str = Depends(verify_admin)):
    """Get sync logs history with problematic products details"""
    logs = await db.sync_logs.find(
        {"type": "shopify"},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Summary stats
    total_syncs = await db.sync_logs.count_documents({"type": "shopify"})
    syncs_with_issues = await db.sync_logs.count_documents({
        "type": "shopify", 
        "problematic_count": {"$gt": 0}
    })
    
    return {
        "logs": logs,
        "total_syncs": total_syncs,
        "syncs_with_issues": syncs_with_issues
    }


@admin_router.get("/sync/problematic-products")
async def get_problematic_products(username: str = Depends(verify_admin)):
    """Get products that may have issues (untitled, missing data, etc.)"""
    problematic = await db.products.find({
        "$or": [
            {"name": {"$regex": "^Product ", "$options": "i"}},
            {"name": ""},
            {"name": None},
            {"name": {"$regex": "untitled", "$options": "i"}},
            {"image": ""},
            {"image": None},
            {"price": 0},
            {"price": None}
        ]
    }, {"_id": 0, "id": 1, "name": 1, "shopify_id": 1, "shopify_handle": 1, "category": 1, "image": 1, "price": 1}).to_list(100)
    
    return {
        "count": len(problematic),
        "products": problematic
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
                    errors.append("Row skipped: empty name")
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
            "to": os.environ.get("NOTIFICATION_EMAIL", "woof@thedoggycompany.in"),  # Resend expects a string
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
# Routes moved to review_routes.py


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


# ==================== SEED ALL PILLARS ====================

@api_router.post("/admin/seed-all")
async def seed_all_pillars():
    """Seed data for all pillars - uses UPSERT so existing data is NOT deleted"""
    results = {}
    
    # Import seed functions
    from advisory_routes import seed_advisory_data
    from emergency_routes import seed_emergency_data
    from paperwork_routes import seed_paperwork_data
    from fit_routes import seed_fit_data
    from enjoy_routes import seed_enjoy_data
    from care_routes import seed_care_products
    from travel_routes import seed_travel_products
    from celebrate_routes import seed_celebrate_data
    
    # Seed each pillar (uses upsert - won't delete existing data)
    try:
        results["celebrate"] = await seed_celebrate_data()
    except Exception as e:
        results["celebrate"] = {"error": str(e)}
    
    try:
        results["advisory"] = await seed_advisory_data()
    except Exception as e:
        results["advisory"] = {"error": str(e)}
    
    try:
        results["emergency"] = await seed_emergency_data()
    except Exception as e:
        results["emergency"] = {"error": str(e)}
    
    try:
        results["paperwork"] = await seed_paperwork_data()
    except Exception as e:
        results["paperwork"] = {"error": str(e)}
    
    try:
        results["fit"] = await seed_fit_data()
    except Exception as e:
        results["fit"] = {"error": str(e)}
    
    try:
        results["enjoy"] = await seed_enjoy_data()
    except Exception as e:
        results["enjoy"] = {"error": str(e)}
    
    try:
        results["care"] = await seed_care_products()
    except Exception as e:
        results["care"] = {"error": str(e)}
    
    try:
        results["travel"] = await seed_travel_products()
    except Exception as e:
        results["travel"] = {"error": str(e)}
    
    # Dine pillar (bundles and products)
    try:
        from dine_routes import seed_dine_bundles_data, seed_dine_products_data
        results["dine_bundles"] = await seed_dine_bundles_data()
    except Exception as e:
        results["dine_bundles"] = {"error": str(e)}
    
    try:
        results["dine_products"] = await seed_dine_products_data()
    except Exception as e:
        results["dine_products"] = {"error": str(e)}
    
    # Calculate totals
    total_products = sum(r.get("products_seeded", 0) for r in results.values() if isinstance(r, dict))
    total_bundles = sum(r.get("bundles_seeded", 0) for r in results.values() if isinstance(r, dict))
    total_partners = sum(r.get("partners_seeded", r.get("advisors_seeded", 0)) for r in results.values() if isinstance(r, dict))
    
    logger.info(f"Seed All: {total_products} products, {total_bundles} bundles, {total_partners} partners")
    
    return {
        "message": "All pillars seeded (existing data preserved)",
        "totals": {"products": total_products, "bundles": total_bundles, "partners": total_partners},
        "details": results
    }


@api_router.post("/admin/seed-sample-tickets")
async def seed_sample_tickets():
    """Seed sample tickets for Command Center testing"""
    import uuid
    
    sample_tickets = [
        {
            "ticket_id": f"TKT-SAMPLE-{uuid.uuid4().hex[:6].upper()}",
            "title": "Birthday cake inquiry",
            "original_request": "I want to order a custom birthday cake for my dog Luna's 3rd birthday next week",
            "category": "celebrate",
            "pillar": "celebrate",
            "status": "open",
            "priority": "high",
            "customer_name": "Test Customer",
            "customer_email": "test@example.com",
            "customer_phone": "9876543210",
            "source": "mira",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "ticket_id": f"TKT-SAMPLE-{uuid.uuid4().hex[:6].upper()}",
            "title": "Pet-friendly restaurant booking",
            "original_request": "Need to book a table for 4 people with 2 dogs at a nice restaurant in Bangalore for dinner",
            "category": "dine",
            "pillar": "dine",
            "status": "open",
            "priority": "medium",
            "customer_name": "Dine Tester",
            "customer_email": "dine@example.com",
            "customer_phone": "9876543211",
            "source": "mira",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "ticket_id": f"TKT-SAMPLE-{uuid.uuid4().hex[:6].upper()}",
            "title": "Pet boarding inquiry",
            "original_request": "Looking for a reliable pet boarding place for my Labrador for 5 days while I travel",
            "category": "stay",
            "pillar": "stay",
            "status": "open",
            "priority": "high",
            "customer_name": "Stay Tester",
            "customer_email": "stay@example.com",
            "customer_phone": "9876543212",
            "source": "mira",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "ticket_id": f"TKT-SAMPLE-{uuid.uuid4().hex[:6].upper()}",
            "title": "Pet travel assistance",
            "original_request": "Need help arranging pet travel from Delhi to Mumbai by flight for my German Shepherd",
            "category": "travel",
            "pillar": "travel",
            "status": "open",
            "priority": "urgent",
            "customer_name": "Travel Tester",
            "customer_email": "travel@example.com",
            "customer_phone": "9876543213",
            "source": "mira",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "ticket_id": f"TKT-SAMPLE-{uuid.uuid4().hex[:6].upper()}",
            "title": "Vet appointment coordination",
            "original_request": "Can you help schedule a vet checkup for my cat? She's been sneezing a lot lately",
            "category": "care",
            "pillar": "care",
            "status": "open",
            "priority": "high",
            "customer_name": "Care Tester",
            "customer_email": "care@example.com",
            "customer_phone": "9876543214",
            "source": "mira",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Insert tickets
    result = await db.service_desk_tickets.insert_many(sample_tickets)
    
    return {
        "success": True,
        "message": f"Created {len(result.inserted_ids)} sample tickets",
        "ticket_ids": [t["ticket_id"] for t in sample_tickets]
    }


@api_router.post("/admin/seed-production-data")
async def seed_production_data():
    """
    Comprehensive seeder for production environment.
    Seeds: FAQs, Collections, Sample Tickets
    Uses UPSERT - safe to run multiple times without duplicates.
    """
    import uuid
    results = {"faqs": 0, "collections": 0, "tickets": 0}
    
    # ==================== SEED FAQs ====================
    sample_faqs = [
        {
            "id": "faq-delivery-1",
            "question": "What are the delivery areas and timelines?",
            "answer": "We deliver freshly baked treats across Bangalore within 24-48 hours. Pan-India shipping is available for select products with 3-5 day delivery.",
            "category": "Delivery",
            "order": 1
        },
        {
            "id": "faq-delivery-2",
            "question": "Are your products safe for dogs?",
            "answer": "Absolutely! All our products are made with 100% dog-safe, human-grade ingredients. We never use artificial sweeteners, chocolate, xylitol, or any ingredients harmful to pets.",
            "category": "Products",
            "order": 2
        },
        {
            "id": "faq-order-1",
            "question": "How do I place a custom cake order?",
            "answer": "You can use our Custom Cake Designer or chat with Mira, our AI concierge, who will help you create the perfect cake for your furry friend. Custom cakes require 48-72 hours advance notice.",
            "category": "Orders",
            "order": 3
        },
        {
            "id": "faq-membership-1",
            "question": "What are the membership tiers?",
            "answer": "We offer three tiers: Free (basic access), Gold (10% off, priority support), and Platinum (15% off, exclusive perks, concierge service). Visit our Membership page for details.",
            "category": "Membership",
            "order": 4
        },
        {
            "id": "faq-allergy-1",
            "question": "Can you accommodate food allergies?",
            "answer": "Yes! We can customize products to avoid specific allergens. Please mention any allergies when ordering, or add them to your pet's profile for automatic recommendations.",
            "category": "Products",
            "order": 5
        },
        {
            "id": "faq-payment-1",
            "question": "What payment methods do you accept?",
            "answer": "We accept all major credit/debit cards, UPI, net banking, and wallets through our secure Razorpay gateway.",
            "category": "Payment",
            "order": 6
        },
        {
            "id": "faq-pet-soul-1",
            "question": "What is Pet Soul™?",
            "answer": "Pet Soul™ is your pet's unique digital profile that captures their personality, preferences, health data, and celebrations. It helps us personalize every experience for your furry family member.",
            "category": "Pet Soul",
            "order": 7
        },
        {
            "id": "faq-mira-1",
            "question": "Who is Mira® and how can she help?",
            "answer": "Mira® is our AI-powered concierge who knows your pet personally. She can help with product recommendations, booking services, answering questions, and coordinating your pet's life across all our pillars.",
            "category": "Mira AI",
            "order": 8
        },
        # Pillar-specific FAQs
        {
            "id": "faq-celebrate-1",
            "question": "How do I order a custom birthday cake for my pet?",
            "answer": "Visit our Celebrate section or chat with Mira! We offer custom cakes in various sizes and flavors. Place orders at least 48 hours in advance. You can personalize with your pet's name, age, and favorite colors.",
            "category": "Celebrate",
            "pillar": "celebrate",
            "order": 9
        },
        {
            "id": "faq-dine-1",
            "question": "Which restaurants are pet-friendly?",
            "answer": "All restaurants listed in our Dine section welcome pets! We verify each venue for pet-friendly policies, outdoor seating, and water bowls. Filter by location, cuisine, and amenities.",
            "category": "Dine",
            "pillar": "dine",
            "order": 10
        },
        {
            "id": "faq-dine-2",
            "question": "Can I bring my large dog to pet-friendly restaurants?",
            "answer": "Most restaurants accept dogs of all sizes, but some may have space constraints. Check the venue details or ask Mira for specific recommendations based on your pet's size.",
            "category": "Dine",
            "pillar": "dine",
            "order": 11
        },
        {
            "id": "faq-stay-1",
            "question": "How do I book pet boarding?",
            "answer": "Browse verified boarding facilities in the Stay section. View amenities, read reviews, and book directly. Mira can also recommend based on your pet's needs and preferences.",
            "category": "Stay",
            "pillar": "stay",
            "order": 12
        },
        {
            "id": "faq-travel-1",
            "question": "Can you help relocate my pet to another city?",
            "answer": "Yes! Our Travel pillar offers pet relocation services including flights, ground transport, documentation, and compliance. Start planning with Mira for a customized travel solution.",
            "category": "Travel",
            "pillar": "travel",
            "order": 13
        },
        {
            "id": "faq-care-1",
            "question": "Do you offer vet consultations?",
            "answer": "Our Care pillar connects you with verified veterinary partners. Book appointments, access telemedicine, and store health records in your pet's Health Vault.",
            "category": "Care",
            "pillar": "care",
            "order": 14
        },
        {
            "id": "faq-mira-2",
            "question": "Is Mira available 24/7?",
            "answer": "Yes! Mira is always available to assist you. For complex requests, she'll escalate to our human concierge team who respond within 24 hours.",
            "category": "Mira AI",
            "order": 15
        },
        {
            "id": "faq-mira-3",
            "question": "How does Mira remember my pet's preferences?",
            "answer": "Mira uses your Pet Soul™ profile to remember everything - favorite treats, allergies, past orders, and even your pet's personality traits. The more you interact, the smarter she gets!",
            "category": "Mira AI",
            "order": 16
        }
    ]
    
    for faq in sample_faqs:
        await db.faqs.update_one(
            {"id": faq["id"]},
            {"$set": faq},
            upsert=True
        )
        results["faqs"] += 1
    
    # ==================== SEED COLLECTIONS ====================
    sample_collections = [
        {
            "id": "valentines-day",
            "slug": "valentines-day",
            "name": "Valentine's Day Collection",
            "title": "Valentine's Day Treats",
            "description": "Show your furry valentine some love with our special Valentine's Day collection! Heart-shaped treats, pink frosted cakes, and love-themed goodies.",
            "banner_image": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200",
            "is_active": True,
            "display_order": 1,
            "products": [],
            "tags": ["valentine", "love", "hearts", "seasonal"],
            "start_date": "2025-02-01",
            "end_date": "2025-02-28",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "birthday-celebration",
            "slug": "birthday-celebration",
            "name": "Birthday Celebration",
            "title": "Pawsome Birthday Treats",
            "description": "Make your pet's birthday unforgettable with our celebration collection. Custom cakes, party treats, and special hampers!",
            "banner_image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200",
            "is_active": True,
            "display_order": 2,
            "products": [],
            "tags": ["birthday", "celebration", "party", "cakes"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "healthy-bites",
            "slug": "healthy-bites",
            "name": "Healthy Bites",
            "title": "Nutritious & Delicious",
            "description": "Health-conscious treats for fitness-focused pets. Low-calorie, grain-free, and packed with nutrition.",
            "banner_image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200",
            "is_active": True,
            "display_order": 3,
            "products": [],
            "tags": ["healthy", "grain-free", "low-calorie", "nutritious"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "diwali-special",
            "slug": "diwali-special",
            "name": "Diwali Special",
            "title": "Festival of Lights Treats",
            "description": "Celebrate Diwali with pet-safe sweets and festive hampers. Traditional flavors made safe for your furry friends!",
            "banner_image": "https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=1200",
            "is_active": True,
            "display_order": 4,
            "products": [],
            "tags": ["diwali", "festive", "indian", "celebration"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for collection in sample_collections:
        await db.collections.update_one(
            {"slug": collection["slug"]},
            {"$set": collection},
            upsert=True
        )
        results["collections"] += 1
    
    # ==================== SEED EDITABLE SAMPLE TICKETS ====================
    sample_tickets = [
        {
            "ticket_id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
            "title": "Custom birthday cake inquiry - Luna",
            "original_request": "Hi! I want to order a custom birthday cake for my Golden Retriever Luna. She's turning 3 next Saturday. She loves peanut butter but is allergic to chicken. Can you help?",
            "category": "celebrate",
            "pillar": "celebrate",
            "status": "open",
            "priority": "high",
            "customer_name": "Priya Sharma",
            "customer_email": "priya.sharma@email.com",
            "customer_phone": "9876543210",
            "source": "mira",
            "member": {
                "name": "Priya Sharma",
                "email": "priya.sharma@email.com",
                "phone": "9876543210",
                "membership_tier": "gold"
            },
            "pets_mentioned": ["Luna - Golden Retriever"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_sample": True
        },
        {
            "ticket_id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
            "title": "Pet-friendly restaurant recommendation",
            "original_request": "Looking for a nice pet-friendly restaurant in Indiranagar for a dinner date. We have a well-behaved Beagle. Any recommendations with outdoor seating?",
            "category": "dine",
            "pillar": "dine",
            "status": "open",
            "priority": "medium",
            "customer_name": "Rahul Menon",
            "customer_email": "rahul.menon@email.com",
            "customer_phone": "9876543211",
            "source": "website",
            "member": {
                "name": "Rahul Menon",
                "email": "rahul.menon@email.com",
                "phone": "9876543211",
                "membership_tier": "free"
            },
            "pets_mentioned": ["Beagle"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_sample": True
        },
        {
            "ticket_id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
            "title": "Urgent: Pet boarding for emergency travel",
            "original_request": "I have an urgent family emergency and need to fly out tomorrow. Need reliable boarding for my 2 cats (siblings, 4 years old) for about a week. They've never been boarded before so somewhere calm would be ideal.",
            "category": "stay",
            "pillar": "stay",
            "status": "open",
            "priority": "urgent",
            "customer_name": "Ananya Krishnan",
            "customer_email": "ananya.k@email.com",
            "customer_phone": "9876543212",
            "source": "phone",
            "member": {
                "name": "Ananya Krishnan",
                "email": "ananya.k@email.com",
                "phone": "9876543212",
                "membership_tier": "platinum"
            },
            "pets_mentioned": ["2 cats - siblings, 4 years old"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_sample": True
        },
        {
            "ticket_id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
            "title": "Dog relocation Delhi to Bangalore",
            "original_request": "We're relocating from Delhi to Bangalore next month. Need help arranging safe transport for our German Shepherd (5 years, 35kg). He's never flown before. What are the requirements and options?",
            "category": "travel",
            "pillar": "travel",
            "status": "open",
            "priority": "high",
            "customer_name": "Vikram Singh",
            "customer_email": "vikram.s@email.com",
            "customer_phone": "9876543213",
            "source": "mira",
            "member": {
                "name": "Vikram Singh",
                "email": "vikram.s@email.com",
                "phone": "9876543213",
                "membership_tier": "gold"
            },
            "pets_mentioned": ["German Shepherd - 5 years, 35kg"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_sample": True
        },
        {
            "ticket_id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
            "title": "Vaccination schedule help",
            "original_request": "Just adopted a 3-month-old indie puppy! Can you help me understand what vaccinations she needs and recommend a good vet in Koramangala? Also want to get her microchipped.",
            "category": "care",
            "pillar": "care",
            "status": "open",
            "priority": "medium",
            "customer_name": "Meera Nair",
            "customer_email": "meera.nair@email.com",
            "customer_phone": "9876543214",
            "source": "website",
            "member": {
                "name": "Meera Nair",
                "email": "meera.nair@email.com",
                "phone": "9876543214",
                "membership_tier": "free"
            },
            "pets_mentioned": ["3-month-old indie puppy"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_sample": True
        }
    ]
    
    # Only insert if collection is empty (to avoid duplicates)
    existing_sample_count = await db.service_desk_tickets.count_documents({"is_sample": True})
    if existing_sample_count == 0:
        result = await db.service_desk_tickets.insert_many(sample_tickets)
        results["tickets"] = len(result.inserted_ids)
    else:
        results["tickets"] = f"Skipped (already have {existing_sample_count} sample tickets)"
    
    return {
        "success": True,
        "message": "Production data seeded successfully!",
        "results": results,
        "note": "This data is editable - feel free to modify it as needed"
    }


# ==================== PET PASS NUMBER MIGRATION ====================

@admin_router.post("/migrate/pet-pass-numbers")
async def migrate_pet_pass_numbers(credentials: HTTPBasicCredentials = Depends(security)):
    """Backfill Pet Pass Numbers for existing pets that don't have one"""
    verify_admin(credentials)
    
    # Find all pets without pet_pass_number
    pets_without_pass = await db.pets.find(
        {"pet_pass_number": {"$exists": False}},
        {"_id": 1, "id": 1, "name": 1}
    ).to_list(1000)
    
    updated_count = 0
    for pet in pets_without_pass:
        pet_pass_number = await generate_pet_pass_number_server()
        await db.pets.update_one(
            {"_id": pet["_id"]},
            {"$set": {"pet_pass_number": pet_pass_number}}
        )
        updated_count += 1
        logger.info(f"Assigned Pet Pass {pet_pass_number} to {pet.get('name', 'Unknown')} ({pet.get('id', 'N/A')})")
    
    return {
        "success": True,
        "message": f"Assigned Pet Pass Numbers to {updated_count} pets",
        "updated_count": updated_count
    }


@api_router.get("/pets/lookup/{pet_pass_number}")
async def lookup_pet_by_pass_number(pet_pass_number: str):
    """Look up a pet by their Pet Pass Number"""
    pet = await db.pets.find_one({"pet_pass_number": pet_pass_number.upper()}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found with this Pet Pass Number")
    return {"pet": pet}


# ==================== FAREWELL SERVICES ====================

@api_router.post("/farewell/service-request")
async def create_farewell_service_request(request_data: dict, current_user: Optional[dict] = Depends(get_current_user_optional)):
    """Create a farewell/memorial service request - works for both logged in and guest users"""
    request_id = f"farewell-{uuid.uuid4().hex[:8]}"
    
    # Get user info from logged in user or from request data (guest)
    user_id = current_user.get("id") if current_user else None
    user_email = current_user.get("email") if current_user else request_data.get("email")
    user_name = current_user.get("name") if current_user else request_data.get("user_name", "")
    
    farewell_request = {
        "id": request_id,
        "user_id": user_id,
        "user_email": user_email,
        "pet_id": request_data.get("pet_id"),
        "pet_name": request_data.get("pet_name"),
        "pet_breed": request_data.get("pet_breed"),
        "pet_age": request_data.get("pet_age"),
        "package_id": request_data.get("package_id"),
        "package": request_data.get("package"),
        "service_type": request_data.get("service_type", "memorial"),
        "urgency": request_data.get("urgency", "planned"),
        "preferred_date": request_data.get("preferred_date"),
        "preferred_time": request_data.get("preferred_time"),
        "address": request_data.get("address"),
        "city": request_data.get("city"),
        "phone": request_data.get("phone"),
        "email": request_data.get("email") or user_email,
        "special_requests": request_data.get("special_requests"),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.farewell_requests.insert_one(farewell_request)
    
    # Auto-create a support ticket for the team
    ticket_id = f"TKT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    package_data = request_data.get('package') or {}
    ticket = {
        "id": ticket_id,
        "category": "farewell",
        "subcategory": request_data.get("urgency", "planned"),
        "priority": "urgent" if request_data.get("urgency") == "emergency" else "high",
        "subject": f"Farewell Service Request - {request_data.get('pet_name', 'Pet')}",
        "description": f"Service: {package_data.get('name', 'Memorial Service')}\nUrgency: {request_data.get('urgency', 'planned')}\nSpecial Requests: {request_data.get('special_requests', 'None')}",
        "customer_email": user_email,
        "customer_name": user_name,
        "pet_id": request_data.get("pet_id"),
        "pet_name": request_data.get("pet_name"),
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tickets.insert_one(ticket)
    
    logger.info(f"Farewell service request {request_id} created for pet {request_data.get('pet_name')}")
    
    return {
        "success": True,
        "request_id": request_id,
        "ticket_id": ticket_id,
        "message": "Your request has been submitted. Our compassionate team will contact you within 2 hours."
    }


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

# Mount static uploads for pet photos
os.makedirs("static/uploads/pets", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set database for admin routes
set_admin_routes_db(db)

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

# Set database for pillar routes
set_pillar_db(db)
set_pillar_admin_verify(verify_admin)

# Set database for enhanced collection routes
set_collection_db(db)
set_collection_admin_verify(verify_admin)

# Set database for partner routes
set_partner_db(db)
set_partner_admin_verify(verify_admin)

# Set database for pricing routes
set_pricing_db(db)
set_pricing_admin_verify(verify_admin)

# Set database for pillar reports
set_pillar_reports_db(db)
set_pillar_reports_admin_verify(verify_admin)

# Set database for restaurant discovery
set_restaurant_scraper_db(db)
set_restaurant_scraper_admin(verify_admin)

# Set database for data migration
set_migration_db(db)
set_migration_admin_verify(verify_admin)

# Set database for admin auth
set_admin_db(db)
set_admin_env_credentials(ADMIN_USERNAME, ADMIN_PASSWORD)

# Create email helper for admin auth
async def send_admin_email(to_email: str, subject: str, html_content: str):
    """Send email using Resend"""
    try:
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({
            "from": "The Doggy Company <woof@thedoggycompany.in>",
            "to": to_email,
            "subject": subject,
            "html": html_content
        })
    except Exception as e:
        print(f"Error sending email: {e}")

set_admin_email_func(send_admin_email)
set_partner_email_func(send_admin_email)

# Set database for Stay routes
set_stay_db(db)
set_stay_admin_verify(verify_admin)
set_stay_social_db(db)
set_stay_social_admin_verify(verify_admin)

# Set notification engine database
set_notification_db(db)

# Set multi-channel intake database
set_channel_db(db)

# Set MIS reporting database
set_mis_db(db)

# Set Pet Pass Renewal Reminders database
set_renewal_db(db)

# Set Paw Rewards database
set_rewards_db(db)
set_paw_points_db(db)  # Paw Points Redemption System
set_pet_soul_db(db)
set_pet_score_db(db)  # Pet Score Logic
set_product_box_db(db)  # Unified Product Box
set_pet_vault_db(db)
set_soul_db(db)
set_pet_gate_db(db)

# Setup Communication System (Unified Reminder & Mailing)
setup_communication_routes(app, db)
logger.info("Communication system routes initialized")


# ==================== ABOUT PAGE CONTENT MANAGEMENT ====================

@api_router.get("/about/team")
async def get_team_members():
    """Get all team members for About page"""
    members = await db.team_members.find({}, {"_id": 0}).sort("order", 1).to_list(None)
    return {"team": members}


@api_router.get("/about/dogs")
async def get_featured_dogs():
    """Get featured dogs for About page"""
    dogs = await db.featured_dogs.find({}, {"_id": 0}).sort("order", 1).to_list(None)
    return {"dogs": dogs}


@api_router.get("/about/content")
async def get_about_content():
    """Get all About page content"""
    team = await db.team_members.find({}, {"_id": 0}).sort("order", 1).to_list(None)
    dogs = await db.featured_dogs.find({}, {"_id": 0}).sort("order", 1).to_list(None)
    return {"team": team, "dogs": dogs}


@admin_router.post("/about/team")
async def create_team_member(member: dict, username: str = Depends(verify_admin)):
    """Create a new team member"""
    member_id = f"team-{uuid.uuid4().hex[:8]}"
    member_data = {
        "id": member_id,
        "name": member.get("name", ""),
        "role": member.get("role", ""),
        "description": member.get("description", ""),
        "emoji": member.get("emoji", "👤"),
        "order": member.get("order", 99),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.team_members.insert_one(member_data)
    return {"message": "Team member created", "member": {k: v for k, v in member_data.items() if k != "_id"}}


@admin_router.put("/about/team/{member_id}")
async def update_team_member(member_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a team member"""
    allowed = ["name", "role", "description", "emoji", "order", "is_active"]
    filtered = {k: v for k, v in updates.items() if k in allowed}
    result = await db.team_members.update_one({"id": member_id}, {"$set": filtered})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    return {"message": "Team member updated"}


@admin_router.delete("/about/team/{member_id}")
async def delete_team_member(member_id: str, username: str = Depends(verify_admin)):
    """Delete a team member"""
    result = await db.team_members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    return {"message": "Team member deleted"}


@admin_router.post("/about/dogs")
async def create_featured_dog(dog: dict, username: str = Depends(verify_admin)):
    """Create a featured dog"""
    dog_id = f"dog-{uuid.uuid4().hex[:8]}"
    dog_data = {
        "id": dog_id,
        "name": dog.get("name", ""),
        "breed": dog.get("breed", ""),
        "role": dog.get("role", "Chief Taste Tester"),
        "story": dog.get("story", ""),
        "image": dog.get("image", ""),
        "emoji": dog.get("emoji", "🐕"),
        "order": dog.get("order", 99),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.featured_dogs.insert_one(dog_data)
    return {"message": "Featured dog created", "dog": {k: v for k, v in dog_data.items() if k != "_id"}}


@admin_router.put("/about/dogs/{dog_id}")
async def update_featured_dog(dog_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a featured dog"""
    allowed = ["name", "breed", "role", "story", "image", "emoji", "order", "is_active"]
    filtered = {k: v for k, v in updates.items() if k in allowed}
    result = await db.featured_dogs.update_one({"id": dog_id}, {"$set": filtered})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Featured dog not found")
    return {"message": "Featured dog updated"}


@admin_router.delete("/about/dogs/{dog_id}")
async def delete_featured_dog(dog_id: str, username: str = Depends(verify_admin)):
    """Delete a featured dog"""
    result = await db.featured_dogs.delete_one({"id": dog_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Featured dog not found")
    return {"message": "Featured dog deleted"}


@admin_router.post("/about/seed")
async def seed_about_content(username: str = Depends(verify_admin)):
    """Seed initial About page content"""
    
    team_members = [
        {"id": "team-bakers", "name": "Baking Maestros", "role": "The Heart of Every Treat", "description": "Our bakers are artisans who combine traditional recipes with modern nutrition. Every cake is baked with love, using Mira Sikand's time-honored recipes passed down through 75 years.", "emoji": "👨‍🍳", "order": 1, "is_active": True},
        {"id": "team-nutrition", "name": "Nutrition Experts", "role": "Guardians of Health", "description": "Our in-house nutritionists ensure every treat is not just delicious but also healthy. They meticulously balance flavors and nutrients for your pet's wellbeing.", "emoji": "🥗", "order": 2, "is_active": True},
        {"id": "team-concierge", "name": "Concierge® Team", "role": "Your 24/7 Pet Partners", "description": "The human hearts behind Mira. Our concierge team handles restaurant bookings, travel arrangements, emergency support, and everything in between.", "emoji": "💜", "order": 3, "is_active": True},
        {"id": "team-care", "name": "Pet Care Specialists", "role": "Wellness Warriors", "description": "From grooming to fitness, our care specialists ensure your pet lives their healthiest, happiest life. They're the backbone of our Care and Fit pillars.", "emoji": "🩺", "order": 4, "is_active": True}
    ]
    
    featured_dogs = [
        {"id": "dog-lola", "name": "Lola", "breed": "Golden Retriever", "role": "Chief Taste Tester & Office Supervisor", "story": "Lola has been with us since Day 1. She's tasted every recipe, rejected a few (we listened!), and approved the ones you love. When she's not working, she's supervising belly rub sessions.", "image": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop", "emoji": "👑", "order": 1, "is_active": True},
        {"id": "dog-bruno", "name": "Bruno", "breed": "Labrador", "role": "Quality Assurance Manager", "story": "Bruno joined as a rescue and became our most dedicated employee. He personally tests every batch for 'enthusiastic consumption potential' - his tail wags are our 5-star rating.", "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop", "emoji": "🏆", "order": 2, "is_active": True},
        {"id": "dog-cookie", "name": "Cookie", "breed": "Beagle", "role": "Sniff Inspector & Treat Detective", "story": "With the most powerful nose in the office, Cookie ensures every ingredient meets her exacting standards. She's caught more 'suspicious' treats than we can count (mostly in her own bowl).", "image": "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=400&h=400&fit=crop", "emoji": "🔍", "order": 3, "is_active": True},
        {"id": "dog-max", "name": "Max", "breed": "German Shepherd", "role": "Head of Security & Delivery Greeter", "story": "Max takes his job very seriously - no delivery person enters without a thorough inspection and mandatory pets. He's also our unofficial morale officer, always ready with a comforting presence.", "image": "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&h=400&fit=crop", "emoji": "🛡️", "order": 4, "is_active": True},
        {"id": "dog-street-heroes", "name": "Street Heroes", "breed": "Mixed Breeds", "role": "The Reason We Do This", "story": "Through our Streats program, 10% of every sale feeds and cares for street dogs. These unsung heroes remind us daily why we started - because every dog deserves love, not just those with homes.", "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop", "emoji": "💛", "order": 5, "is_active": True}
    ]
    
    await db.team_members.delete_many({})
    await db.featured_dogs.delete_many({})
    
    if team_members:
        await db.team_members.insert_many(team_members)
    if featured_dogs:
        await db.featured_dogs.insert_many(featured_dogs)
    
    return {"message": "About content seeded successfully", "team_count": len(team_members), "dogs_count": len(featured_dogs)}


# ==================== RAZORPAY PAYMENT ROUTES ====================

# Membership Plans
# GST Rate (18%)
GST_RATE = 0.18

# Base prices (before GST) in paise
MEMBERSHIP_PLANS = {
    "monthly": {
        "id": "plan_monthly",
        "name": "Monthly Membership",
        "base_amount": 8390,  # ₹83.90 base -> ₹99 with GST
        "currency": "INR",
        "duration_days": 30,
        "tier": "pawsome"
    },
    "annual": {
        "id": "plan_annual", 
        "name": "Annual Membership",
        "base_amount": 84661,  # ₹846.61 base -> ₹999 with GST
        "currency": "INR",
        "duration_days": 365,
        "tier": "pawsome"
    },
    "premium_annual": {
        "id": "plan_premium",
        "name": "Premium Annual",
        "base_amount": 169407,  # ₹1694.07 base -> ₹1999 with GST
        "currency": "INR",
        "duration_days": 365,
        "tier": "premium"
    },
    "vip_annual": {
        "id": "plan_vip",
        "name": "VIP Pack Leader",
        "base_amount": 423729,  # ₹4237.29 base -> ₹4999 with GST
        "currency": "INR",
        "duration_days": 365,
        "tier": "vip"
    }
}

def calculate_gst_amounts(base_amount_paise: int) -> dict:
    """Calculate GST and total amount from base price in paise"""
    gst_amount = int(base_amount_paise * GST_RATE)
    total_amount = base_amount_paise + gst_amount
    return {
        "base_amount": base_amount_paise,
        "gst_amount": gst_amount,
        "gst_rate": GST_RATE * 100,  # 18%
        "total_amount": total_amount
    }


@api_router.get("/payments/plans")
async def get_membership_plans():
    """Get available membership plans with GST breakdown"""
    plans = []
    for key, plan in MEMBERSHIP_PLANS.items():
        gst_info = calculate_gst_amounts(plan["base_amount"])
        plans.append({
            "id": key,
            "name": plan["name"],
            "base_amount": gst_info["base_amount"] / 100,  # In rupees
            "gst_amount": gst_info["gst_amount"] / 100,  # In rupees
            "gst_rate": gst_info["gst_rate"],  # 18%
            "amount": gst_info["total_amount"] / 100,  # Total in rupees (for display)
            "total_amount_paise": gst_info["total_amount"],  # For payment
            "currency": plan["currency"],
            "duration_days": plan["duration_days"],
            "tier": plan["tier"]
        })
    return {"plans": plans, "gst_note": "All prices are inclusive of 18% GST"}


@api_router.post("/payments/create-order")
async def create_payment_order(request: CreateOrderRequest):
    """Create a Razorpay order for membership payment with GST"""
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    plan = MEMBERSHIP_PLANS.get(request.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
    
    try:
        # Calculate GST-inclusive amount
        gst_info = calculate_gst_amounts(plan["base_amount"])
        total_amount = gst_info["total_amount"]  # In paise
        
        order_data = {
            "amount": total_amount,
            "currency": plan["currency"],
            "receipt": f"mem_{uuid.uuid4().hex[:12]}",
            "notes": {
                "plan_id": request.plan_id,
                "user_email": request.user_email,
                "tier": plan["tier"],
                "base_amount": gst_info["base_amount"],
                "gst_amount": gst_info["gst_amount"],
                "gst_rate": "18%"
            }
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        order_record = {
            "id": f"order-{uuid.uuid4().hex[:12]}",
            "razorpay_order_id": razorpay_order["id"],
            "plan_id": request.plan_id,
            "plan_name": plan["name"],
            "base_amount": gst_info["base_amount"],
            "gst_amount": gst_info["gst_amount"],
            "gst_rate": 18,
            "total_amount": total_amount,
            "currency": plan["currency"],
            "tier": plan["tier"],
            "duration_days": plan["duration_days"],
            "user_email": request.user_email,
            "user_name": request.user_name,
            "user_phone": request.user_phone,
            "status": "created",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_orders.insert_one(order_record)
        
        return {
            "order_id": razorpay_order["id"],
            "base_amount": gst_info["base_amount"],
            "gst_amount": gst_info["gst_amount"],
            "gst_rate": 18,
            "amount": total_amount,  # Total including GST
            "currency": plan["currency"],
            "key_id": RAZORPAY_KEY_ID,
            "plan_name": plan["name"],
            "prefill": {
                "name": request.user_name or "",
                "email": request.user_email,
                "contact": request.user_phone or ""
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to create Razorpay order: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")


@api_router.post("/payments/verify")
async def verify_payment(request: VerifyPaymentRequest):
    """Verify Razorpay payment and activate membership"""
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    try:
        params_dict = {
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        order = await db.payment_orders.find_one(
            {"razorpay_order_id": request.razorpay_order_id},
            {"_id": 0}
        )
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        await db.payment_orders.update_one(
            {"razorpay_order_id": request.razorpay_order_id},
            {"$set": {
                "status": "paid",
                "razorpay_payment_id": request.razorpay_payment_id,
                "paid_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        duration_days = order.get("duration_days", 30)
        expires_at = datetime.now(timezone.utc) + timedelta(days=duration_days)
        
        # Determine Pet Pass plan type based on duration
        pet_pass_plan = "trial" if duration_days <= 31 else "foundation"
        
        user = await db.users.find_one({"email": request.user_email})
        
        if user:
            current_expires = user.get("membership_expires")
            if current_expires:
                try:
                    current_exp_date = datetime.fromisoformat(current_expires.replace('Z', '+00:00'))
                    if current_exp_date > datetime.now(timezone.utc):
                        expires_at = current_exp_date + timedelta(days=duration_days)
                except:
                    pass
            
            await db.users.update_one(
                {"email": request.user_email},
                {"$set": {
                    "membership_tier": order.get("tier", "loyal_companion"),
                    "membership_expires": expires_at.isoformat(),
                    "membership_plan": order.get("plan_id"),
                    "last_payment_id": request.razorpay_payment_id
                }}
            )
            
            # Update Pet Pass status for all user's pets
            pet_ids = user.get("pet_ids", [])
            if pet_ids:
                await db.pets.update_many(
                    {"id": {"$in": pet_ids}},
                    {"$set": {
                        "pet_pass_status": "active",
                        "pet_pass_plan": pet_pass_plan,
                        "pet_pass_activated_at": datetime.now(timezone.utc).isoformat(),
                        "pet_pass_expires": expires_at.isoformat()
                    }}
                )
                logger.info(f"Activated Pet Pass for {len(pet_ids)} pets")
        else:
            new_user = {
                "id": f"user-{uuid.uuid4().hex[:12]}",
                "email": request.user_email,
                "name": order.get("user_name", ""),
                "phone": order.get("user_phone", ""),
                "membership_tier": order.get("tier", "pawsome"),
                "membership_expires": expires_at.isoformat(),
                "membership_plan": order.get("plan_id"),
                "last_payment_id": request.razorpay_payment_id,
                "loyalty_points": 100,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(new_user)
        
        await db.payment_history.insert_one({
            "id": f"pay-{uuid.uuid4().hex[:12]}",
            "user_email": request.user_email,
            "razorpay_order_id": request.razorpay_order_id,
            "razorpay_payment_id": request.razorpay_payment_id,
            "plan_id": order.get("plan_id"),
            "amount": order.get("amount"),
            "currency": order.get("currency", "INR"),
            "tier": order.get("tier"),
            "status": "success",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "message": "Payment verified and Pet Pass activated!",
            "membership": {
                "tier": order.get("tier"),
                "expires": expires_at.isoformat(),
                "plan": order.get("plan_name")
            }
        }
        
    except razorpay.errors.SignatureVerificationError:
        logger.error("Razorpay signature verification failed")
        raise HTTPException(status_code=400, detail="Payment verification failed")
    except Exception as e:
        logger.error(f"Payment verification error: {e}")
        raise HTTPException(status_code=500, detail="Payment verification failed")


# ==================== MEMBER MANAGEMENT ENDPOINTS ====================

@admin_router.post("/members")
async def add_member(request: AddMemberRequest):
    """Add a new member manually (for offline registrations)"""
    try:
        # Check if email already exists
        existing = await db.users.find_one({"email": request.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Calculate expiry date
        expires_at = datetime.now(timezone.utc) + timedelta(days=request.membership_months * 30)
        
        # Generate temporary password
        temp_password = secrets.token_urlsafe(8)
        hashed_password = pwd_context.hash(temp_password)
        
        new_member = {
            "id": f"user-{uuid.uuid4().hex[:12]}",
            "email": request.email,
            "name": request.name,
            "phone": request.phone,
            "password": hashed_password,
            "membership_tier": request.membership_tier,
            "membership_expires": expires_at.isoformat(),
            "loyalty_points": request.paw_points,
            "admin_notes": request.notes,
            "registration_source": "offline_admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(new_member)
        
        # TODO: Send welcome email with login details if send_welcome_email is True
        
        return {
            "success": True,
            "message": f"Member {request.email} added successfully",
            "temp_password": temp_password if request.send_welcome_email else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add member: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/members/import")
async def import_members_csv(file: UploadFile = File(...)):
    """Import members from CSV file for bulk offline registrations"""
    try:
        import io
        import csv
        
        content = await file.read()
        decoded = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
        
        imported = 0
        skipped = 0
        errors = []
        
        for row in reader:
            try:
                email = row.get('email', '').strip()
                if not email:
                    skipped += 1
                    continue
                
                # Check if exists
                existing = await db.users.find_one({"email": email})
                if existing:
                    skipped += 1
                    errors.append(f"{email}: already exists")
                    continue
                
                # Calculate expiry
                months = int(row.get('membership_months', '12') or '12')
                expires_at = datetime.now(timezone.utc) + timedelta(days=months * 30)
                
                # Generate temp password
                temp_password = secrets.token_urlsafe(8)
                hashed = pwd_context.hash(temp_password)
                
                new_member = {
                    "id": f"user-{uuid.uuid4().hex[:12]}",
                    "email": email,
                    "name": row.get('name', '').strip(),
                    "phone": row.get('phone', '').strip(),
                    "password": hashed,
                    "membership_tier": row.get('membership_tier', 'loyal_companion').strip() or 'loyal_companion',
                    "membership_expires": expires_at.isoformat(),
                    "loyalty_points": int(row.get('paw_points', '100') or '100'),
                    "admin_notes": row.get('notes', '').strip(),
                    "registration_source": "csv_import",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                await db.users.insert_one(new_member)
                imported += 1
                
            except Exception as row_error:
                skipped += 1
                errors.append(f"{row.get('email', 'unknown')}: {str(row_error)}")
        
        return {
            "success": True,
            "imported": imported,
            "skipped": skipped,
            "errors": errors[:10]  # Only return first 10 errors
        }
        
    except Exception as e:
        logger.error(f"CSV import failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/members/bulk-action")
async def bulk_member_action(request: BulkActionRequest):
    """Execute bulk actions on selected members"""
    try:
        affected = 0
        
        for member_id in request.member_ids:
            member = await db.users.find_one({"id": member_id})
            if not member:
                continue
            
            updates = {}
            
            if request.action == "upgrade_tier":
                tier_order = ["free", "pawsome", "premium", "vip"]
                current_tier = member.get("membership_tier", "free")
                current_idx = tier_order.index(current_tier) if current_tier in tier_order else 0
                if current_idx < len(tier_order) - 1:
                    updates["membership_tier"] = tier_order[current_idx + 1]
            
            elif request.action == "extend_1_month":
                current_exp = member.get("membership_expires")
                if current_exp:
                    exp_date = datetime.fromisoformat(current_exp.replace('Z', '+00:00'))
                else:
                    exp_date = datetime.now(timezone.utc)
                
                new_exp = exp_date + timedelta(days=30)
                updates["membership_expires"] = new_exp.isoformat()
            
            elif request.action == "add_100_points":
                current_points = member.get("loyalty_points", 0)
                updates["loyalty_points"] = current_points + 100
            
            elif request.action == "send_renewal_reminder":
                # TODO: Implement email sending
                pass
            
            if updates:
                await db.users.update_one({"id": member_id}, {"$set": updates})
                affected += 1
        
        return {
            "success": True,
            "affected": affected,
            "action": request.action
        }
        
    except Exception as e:
        logger.error(f"Bulk action failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MEMBER DIRECTORY ENDPOINTS ====================

@admin_router.get("/members/directory")
async def get_members_directory():
    """Get all members with their pets and activity for directory view"""
    try:
        # Get all users
        users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
        
        # Enrich with pets data
        members = []
        for user in users:
            user_email = user.get("email")
            
            # Get user's pets
            pets = await db.pets.find({"owner_email": user_email}, {"_id": 0}).to_list(20)
            
            # Get last activity (most recent order or request)
            last_order = await db.orders.find_one(
                {"email": user_email}, 
                {"_id": 0, "created_at": 1},
                sort=[("created_at", -1)]
            )
            
            user["pets"] = pets
            user["last_activity"] = last_order.get("created_at") if last_order else None
            
            # Calculate lifetime value
            orders = await db.orders.find({"email": user_email}, {"total": 1}).to_list(100)
            user["lifetime_value"] = sum(o.get("total", 0) for o in orders)
            
            members.append(user)
        
        return {"members": members, "total": len(members)}
        
    except Exception as e:
        logger.error(f"Failed to fetch members directory: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.get("/members/search")
async def search_members(
    email: Optional[str] = None,
    phone: Optional[str] = None,
    name: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Search members by email, phone, or name"""
    try:
        query = {}
        if email:
            query["email"] = {"$regex": email, "$options": "i"}
        if phone:
            query["phone"] = {"$regex": phone, "$options": "i"}
        if name:
            query["name"] = {"$regex": name, "$options": "i"}
        
        if not query:
            return {"members": []}
        
        members = await db.users.find(query, {"_id": 0, "password_hash": 0}).limit(20).to_list(20)
        return {"members": members}
    except Exception as e:
        logger.error(f"Member search error: {e}")
        return {"members": []}


@admin_router.get("/members/{member_id}/full-profile")
async def get_member_full_profile(member_id: str):
    """Get complete member profile including pets, activity, notes"""
    try:
        # Get member
        member = await db.users.find_one({"id": member_id}, {"_id": 0, "password": 0})
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        user_email = member.get("email")
        
        # Get pets with full soul data
        pets = await db.pets.find({"owner_email": user_email}, {"_id": 0}).to_list(20)
        
        # Get activity (orders, requests, bookings)
        activity = []
        
        # Orders
        orders = await db.orders.find({"email": user_email}, {"_id": 0}).sort("created_at", -1).to_list(20)
        for order in orders:
            activity.append({
                "type": "order",
                "title": f"Order #{order.get('id', '')[:8]}",
                "description": f"₹{order.get('total', 0)} - {len(order.get('items', []))} items",
                "created_at": order.get("created_at")
            })
        
        # Service requests
        requests = await db.service_requests.find({"user_email": user_email}, {"_id": 0}).sort("created_at", -1).to_list(20)
        for req in requests:
            activity.append({
                "type": "request",
                "title": f"{req.get('pillar', 'Service')} Request",
                "description": req.get("description", "")[:100],
                "created_at": req.get("created_at")
            })
        
        # Sort activity by date
        activity.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Get notes
        notes = member.get("admin_notes_list", [])
        
        # Get counts
        member["total_orders"] = len(orders)
        member["total_requests"] = len(requests)
        member["total_bookings"] = 0  # TODO: Add bookings count
        
        # Calculate lifetime value
        member["lifetime_value"] = sum(o.get("total", 0) for o in orders)
        
        return {
            "member": member,
            "pets": pets,
            "activity": activity[:50],
            "notes": notes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch member profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/members/{member_id}/notes")
async def add_member_note(member_id: str, note_data: dict):
    """Add an internal note to a member's profile"""
    try:
        note = {
            "text": note_data.get("note"),
            "author": "Admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.update_one(
            {"id": member_id},
            {"$push": {"admin_notes_list": note}}
        )
        
        return {"success": True, "note": note}
        
    except Exception as e:
        logger.error(f"Failed to add note: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.get("/members/pet-soul-summary")
async def get_pet_soul_summary():
    """Get Pet Soul completion summary across all members"""
    try:
        pets = await db.pets.find({}, {"_id": 0}).to_list(1000)
        
        # Define soul fields
        soul_fields = [
            "name", "breed", "gender", "weight", "birth_date",
            "allergies", "medical_conditions", "favorite_treats",
            "energy_level", "sociability", "feeding_schedule"
        ]
        
        total_pets = len(pets)
        completion_buckets = {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
        
        for pet in pets:
            filled = sum(1 for f in soul_fields if pet.get(f) or (pet.get("soul") and pet.get("soul", {}).get(f)))
            score = int((filled / len(soul_fields)) * 100)
            
            if score <= 25:
                completion_buckets["0-25"] += 1
            elif score <= 50:
                completion_buckets["26-50"] += 1
            elif score <= 75:
                completion_buckets["51-75"] += 1
            else:
                completion_buckets["76-100"] += 1
        
        return {
            "total_pets": total_pets,
            "completion_distribution": completion_buckets,
            "average_completion": sum(
                int((sum(1 for f in soul_fields if p.get(f) or (p.get("soul") and p.get("soul", {}).get(f))) / len(soul_fields)) * 100)
                for p in pets
            ) // max(total_pets, 1)
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch pet soul summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ADMIN ORDERS ====================
@admin_router.get("/orders")
async def admin_get_orders(
    limit: int = 50,
    skip: int = 0,
    status: Optional[str] = None,
    username: str = Depends(verify_admin)
):
    """Get orders for admin dashboard"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        total = await db.orders.count_documents(query)
        
        return {"orders": orders, "total": total}
    except Exception as e:
        logger.error(f"Failed to fetch admin orders: {e}")
        return {"orders": [], "total": 0}


# ==================== PUBLIC INITIALIZATION ENDPOINT ====================
@api_router.get("/init-database")
async def initialize_database():
    """
    Public endpoint to initialize database with required data.
    Call this after deployment to ensure admin, user, and products exist.
    """
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    results = {
        "admin": "unchanged",
        "user": "unchanged", 
        "products": "unchanged"
    }
    
    try:
        # 1. Ensure admin credentials exist
        admin_config = await db.admin_config.find_one({"type": "credentials"})
        if not admin_config:
            await db.admin_config.insert_one({
                "type": "credentials",
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            results["admin"] = "created"
            logger.info("Admin credentials created via init endpoint")
        else:
            # Ensure password is correct
            if admin_config.get("password") != ADMIN_PASSWORD:
                await db.admin_config.update_one(
                    {"type": "credentials"},
                    {"$set": {"password": ADMIN_PASSWORD}}
                )
                results["admin"] = "password_updated"
        
        # Reload admin cache
        global _admin_credentials_cache
        _admin_credentials_cache["username"] = ADMIN_USERNAME
        _admin_credentials_cache["password"] = ADMIN_PASSWORD
        _admin_credentials_cache["loaded"] = True
        
        # 2. Ensure default user exists
        default_email = "dipali@clubconcierge.in"
        existing_user = await db.users.find_one({"email": default_email})
        if not existing_user:
            password_hash = pwd_context.hash("lola4304")
            user_doc = {
                "id": str(uuid.uuid4()),
                "email": default_email,
                "password_hash": password_hash,
                "name": "Dipali",
                "phone": None,
                "membership_tier": "free",
                "membership_expires": None,
                "chat_count_today": 0,
                "last_chat_date": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_doc)
            results["user"] = "created"
            logger.info(f"Default user created: {default_email}")
        else:
            # Ensure password_hash exists
            if "password_hash" not in existing_user:
                password_hash = pwd_context.hash("lola4304")
                await db.users.update_one(
                    {"email": default_email},
                    {"$set": {"password_hash": password_hash}}
                )
                results["user"] = "password_hash_added"
        
        # 3. Seed products if empty
        product_count = await db.products.count_documents({})
        if product_count == 0:
            sample_products = [
                # CAKES (15 products)
                {"id": "cake-001", "name": "Classic Peanut Butter Cake", "description": "Delicious peanut butter cake for dogs", "price": 899, "originalPrice": 899, "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600", "category": "cakes", "available": True},
                {"id": "cake-002", "name": "Banana Bliss Cake", "description": "Healthy banana cake with natural ingredients", "price": 799, "originalPrice": 799, "image": "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600", "category": "cakes", "available": True},
                {"id": "cake-003", "name": "Carrot Delight Cake", "description": "Nutritious carrot cake packed with vitamins", "price": 949, "originalPrice": 949, "image": "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600", "category": "cakes", "available": True},
                {"id": "cake-004", "name": "Chicken Supreme Cake", "description": "Savory chicken cake for meat lovers", "price": 1099, "originalPrice": 1099, "image": "https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600", "category": "cakes", "available": True},
                {"id": "cake-005", "name": "Apple Cinnamon Cake", "description": "Sweet apple cake with cinnamon", "price": 849, "originalPrice": 849, "image": "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=600", "category": "cakes", "available": True},
                {"id": "cake-006", "name": "Beef & Sweet Potato Cake", "description": "Hearty beef cake with sweet potato", "price": 1199, "originalPrice": 1199, "image": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600", "category": "cakes", "available": True},
                {"id": "cake-007", "name": "Blueberry Yogurt Cake", "description": "Refreshing blueberry cake with yogurt frosting", "price": 999, "originalPrice": 999, "image": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600", "category": "cakes", "available": True},
                {"id": "cake-008", "name": "Pumpkin Spice Cake", "description": "Seasonal pumpkin cake with spices", "price": 899, "originalPrice": 899, "image": "https://images.unsplash.com/photo-1509461399763-ae67a981b254?w=600", "category": "cakes", "available": True},
                {"id": "cake-009", "name": "Lamb & Rice Cake", "description": "Premium lamb cake for sensitive tummies", "price": 1299, "originalPrice": 1299, "image": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600", "category": "cakes", "available": True},
                {"id": "cake-010", "name": "Oatmeal Honey Cake", "description": "Wholesome oatmeal cake with honey drizzle", "price": 849, "originalPrice": 849, "image": "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600", "category": "cakes", "available": True},
                {"id": "cake-011", "name": "Golden Retriever Birthday Cake", "description": "Special cake shaped like a Golden Retriever", "price": 1499, "originalPrice": 1499, "image": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600", "category": "breed", "available": True},
                {"id": "cake-012", "name": "Labrador Love Cake", "description": "Chocolate-free cake for Lab lovers", "price": 1499, "originalPrice": 1499, "image": "https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?w=600", "category": "breed", "available": True},
                {"id": "cake-013", "name": "Pug Party Cake", "description": "Adorable pug-themed birthday cake", "price": 1299, "originalPrice": 1299, "image": "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600", "category": "breed", "available": True},
                {"id": "cake-014", "name": "Beagle Birthday Bash Cake", "description": "Fun beagle-shaped celebration cake", "price": 1399, "originalPrice": 1399, "image": "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=600", "category": "breed", "available": True},
                {"id": "cake-015", "name": "German Shepherd Glory Cake", "description": "Majestic GSD-themed cake", "price": 1599, "originalPrice": 1599, "image": "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600", "category": "breed", "available": True},
                
                # TREATS (10 products)
                {"id": "treat-001", "name": "Chicken Jerky Strips", "description": "Crunchy chicken jerky treats", "price": 349, "originalPrice": 349, "image": "https://images.unsplash.com/photo-1582798244350-8b8e9e4f0b91?w=600", "category": "treats", "available": True},
                {"id": "treat-002", "name": "Peanut Butter Biscuits", "description": "Crunchy peanut butter flavored biscuits", "price": 299, "originalPrice": 299, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600", "category": "treats", "available": True},
                {"id": "treat-003", "name": "Sweet Potato Chews", "description": "Natural sweet potato chew treats", "price": 399, "originalPrice": 399, "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600", "category": "treats", "available": True},
                {"id": "treat-004", "name": "Salmon Skin Rolls", "description": "Omega-rich salmon skin treats", "price": 449, "originalPrice": 449, "image": "https://images.unsplash.com/photo-1568702846914-96b305d2uj8b?w=600", "category": "treats", "available": True},
                {"id": "treat-005", "name": "Dental Chew Sticks", "description": "Teeth-cleaning dental sticks", "price": 299, "originalPrice": 299, "image": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600", "category": "treats", "available": True},
                {"id": "treat-006", "name": "Liver Training Treats", "description": "Small liver treats for training", "price": 249, "originalPrice": 249, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600", "category": "treats", "available": True},
                {"id": "treat-007", "name": "Duck Breast Strips", "description": "Premium duck breast jerky", "price": 499, "originalPrice": 499, "image": "https://images.unsplash.com/photo-1582798244350-8b8e9e4f0b91?w=600", "category": "treats", "available": True},
                {"id": "treat-008", "name": "Cheese Puffs", "description": "Light and crispy cheese treats", "price": 199, "originalPrice": 199, "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600", "category": "treats", "available": True},
                {"id": "treat-009", "name": "Veggie Crunch Mix", "description": "Mixed vegetable crunchy treats", "price": 279, "originalPrice": 279, "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600", "category": "treats", "available": True},
                {"id": "treat-010", "name": "Rabbit Ear Chews", "description": "Natural rabbit ear chews", "price": 549, "originalPrice": 549, "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600", "category": "treats", "available": True},
                
                # PUPCAKES & DOGNUTS (5 products)
                {"id": "pupcake-001", "name": "Pupcake Box (6 pcs)", "description": "Assorted mini cupcakes for dogs", "price": 599, "originalPrice": 599, "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600", "category": "pupcakes", "available": True},
                {"id": "pupcake-002", "name": "Pupcake Box (12 pcs)", "description": "Party pack of assorted pupcakes", "price": 999, "originalPrice": 1099, "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600", "category": "pupcakes", "available": True},
                {"id": "dognut-001", "name": "Glazed Dognuts (4 pcs)", "description": "Doggy-safe glazed donuts", "price": 449, "originalPrice": 449, "image": "https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=600", "category": "dognuts", "available": True},
                {"id": "dognut-002", "name": "Sprinkle Dognuts (4 pcs)", "description": "Fun sprinkle-topped dognuts", "price": 499, "originalPrice": 499, "image": "https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=600", "category": "dognuts", "available": True},
                {"id": "dognut-003", "name": "Carob Dognuts (4 pcs)", "description": "Carob-dipped dognuts", "price": 549, "originalPrice": 549, "image": "https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=600", "category": "dognuts", "available": True},
                
                # FROZEN TREATS (5 products)
                {"id": "frozen-001", "name": "Pup Ice Cream - Peanut Butter", "description": "Frozen peanut butter treat", "price": 199, "originalPrice": 199, "image": "https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=600", "category": "frozen-treats", "available": True},
                {"id": "frozen-002", "name": "Pup Ice Cream - Banana", "description": "Frozen banana treat", "price": 199, "originalPrice": 199, "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600", "category": "frozen-treats", "available": True},
                {"id": "frozen-003", "name": "Pup Ice Cream - Strawberry", "description": "Frozen strawberry delight", "price": 199, "originalPrice": 199, "image": "https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=600", "category": "frozen-treats", "available": True},
                {"id": "frozen-004", "name": "Frozen Yogurt Bites", "description": "Bite-sized frozen yogurt treats", "price": 249, "originalPrice": 249, "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600", "category": "frozen-treats", "available": True},
                {"id": "frozen-005", "name": "Pupsicle Variety Pack", "description": "4 assorted frozen pupsicles", "price": 399, "originalPrice": 449, "image": "https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=600", "category": "frozen-treats", "available": True},
                
                # HAMPERS & GIFT BOXES (5 products)
                {"id": "hamper-001", "name": "Birthday Bash Box", "description": "Complete birthday celebration kit with cake, treats & party hat", "price": 1999, "originalPrice": 2499, "image": "https://images.unsplash.com/photo-1530041539828-114de669390e?w=600", "category": "hampers", "available": True},
                {"id": "hamper-002", "name": "Welcome Home Box", "description": "Perfect welcome gift for new pet parents", "price": 1499, "originalPrice": 1799, "image": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600", "category": "hampers", "available": True},
                {"id": "hamper-003", "name": "Pamper Your Pup Box", "description": "Spa day essentials + treats", "price": 1799, "originalPrice": 2099, "image": "https://images.unsplash.com/photo-1530041539828-114de669390e?w=600", "category": "hampers", "available": True},
                {"id": "hamper-004", "name": "Training Starter Kit", "description": "Training treats + clicker + guide", "price": 999, "originalPrice": 1199, "image": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600", "category": "hampers", "available": True},
                {"id": "hamper-005", "name": "Premium Celebration Box", "description": "Luxury celebration box with premium cake & accessories", "price": 2999, "originalPrice": 3499, "image": "https://images.unsplash.com/photo-1530041539828-114de669390e?w=600", "category": "hampers", "available": True},
                
                # CUSTOM CAKES (3 products)
                {"id": "custom-001", "name": "Custom Photo Cake", "description": "Personalized cake with your pet's photo printed on edible topper", "price": 1499, "originalPrice": 1499, "image": "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600", "category": "custom", "available": True},
                {"id": "custom-002", "name": "Custom Theme Cake", "description": "Themed cake designed to your specifications", "price": 1799, "originalPrice": 1799, "image": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600", "category": "custom", "available": True},
                {"id": "custom-003", "name": "Custom Multi-Tier Cake", "description": "Impressive multi-tier celebration cake", "price": 2499, "originalPrice": 2499, "image": "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600", "category": "custom", "available": True},
                
                # MEALS (5 products)
                {"id": "meal-001", "name": "Chicken & Rice Bowl", "description": "Fresh chicken with steamed rice", "price": 299, "originalPrice": 299, "image": "https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600", "category": "meals", "available": True},
                {"id": "meal-002", "name": "Lamb & Veggie Bowl", "description": "Tender lamb with mixed vegetables", "price": 349, "originalPrice": 349, "image": "https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600", "category": "meals", "available": True},
                {"id": "meal-003", "name": "Fish & Sweet Potato Bowl", "description": "Omega-rich fish meal", "price": 329, "originalPrice": 329, "image": "https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600", "category": "meals", "available": True},
                {"id": "meal-004", "name": "Beef Stew", "description": "Hearty beef stew with vegetables", "price": 379, "originalPrice": 379, "image": "https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600", "category": "meals", "available": True},
                {"id": "meal-005", "name": "Vegetarian Delight", "description": "Plant-based nutritious meal", "price": 279, "originalPrice": 279, "image": "https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600", "category": "meals", "available": True},
            ]
            
            # Add timestamps to all products
            for product in sample_products:
                product["created_at"] = datetime.now(timezone.utc).isoformat()
                product["synced_at"] = datetime.now(timezone.utc).isoformat()
                product["sizes"] = [{"name": "Regular", "price": product["price"]}]
                product["tags"] = [product["category"]]
            
            await db.products.insert_many(sample_products)
            results["products"] = f"created_{len(sample_products)}"
            logger.info(f"Seeded {len(sample_products)} products")
        else:
            results["products"] = f"exists_{product_count}"
        
        return {
            "success": True,
            "message": "Database initialized successfully",
            "results": results,
            "credentials": {
                "admin": {"username": "aditya", "password": "lola4304"},
                "user": {"email": "dipali@clubconcierge.in", "password": "lola4304"}
            }
        }
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }


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
app.include_router(role_router)  # Role management
app.include_router(escalation_router)  # Escalation rules
app.include_router(pillar_router)
app.include_router(pillar_public_router)
app.include_router(enhanced_collection_router)
app.include_router(collection_public_router)
app.include_router(partner_router)
app.include_router(partner_admin_router)
app.include_router(restaurant_discovery_router)
app.include_router(pricing_router)
app.include_router(pillar_reports_router)
app.include_router(migration_router)
app.include_router(admin_auth_router)
app.include_router(stay_router)
app.include_router(stay_admin_router)
app.include_router(stay_products_router)
app.include_router(stay_social_router)
app.include_router(stay_social_admin_router)
app.include_router(notification_router)
app.include_router(channel_router)
app.include_router(mis_router)
app.include_router(rewards_router)
app.include_router(paw_points_router)  # Paw Points Redemption
app.include_router(travel_router)  # Travel Pillar
app.include_router(care_router)  # Care Pillar
app.include_router(enjoy_router)  # Enjoy Pillar
app.include_router(fit_router)  # Fit Pillar
app.include_router(learn_router)  # Learn Pillar
app.include_router(advisory_router)  # Advisory Pillar
app.include_router(paperwork_router)  # Paperwork Pillar
app.include_router(emergency_router)  # Emergency Pillar
app.include_router(celebrate_router)  # Celebrate Pillar
app.include_router(adopt_router)  # Adopt Pillar
app.include_router(farewell_router)  # Farewell Pillar
app.include_router(shop_router)  # Shop Pillar
app.include_router(pet_soul_router, prefix="/api")
app.include_router(pet_soul_admin_router, prefix="/api/admin")
app.include_router(pet_score_router, prefix="/api")  # Pet Score Logic API
app.include_router(product_box_router)  # Unified Product Box API
app.include_router(order_queue_router)  # Concierge® Order Queue API
app.include_router(pet_vault_router, prefix="/api")
app.include_router(pet_vault_admin_router, prefix="/api/admin/pet-vault")

# Pet-First Gating & Soul Drip
app.include_router(pet_gate_router)  # Pet gating at /api/pet-gate/*
app.include_router(soul_drip_router)  # Soul drip at /api/soul-drip/*

# Mira AI Concierge System (New)
app.include_router(mira_router)  # Mira AI routes at /api/mira/*
app.include_router(mira_intelligence_router)  # Mira Intelligence at /api/mira/intelligence/*
app.include_router(mira_memory_router)  # Mira Relationship Memory at /api/mira/memory/*
set_mira_db(db)  # Initialize Mira with database
set_intelligence_db(db)  # Initialize Intelligence with database
set_memory_routes_db(db)  # Initialize Memory with database

# Concierge Command Center
app.include_router(concierge_command_router)  # Command Center at /api/concierge/*
app.include_router(health_vault_router)  # Health Vault at /api/health-vault/*
set_command_center_db(db)  # Initialize Command Center with database
set_health_vault_db(db)  # Initialize Health Vault with database

# Analytics Dashboard
app.include_router(analytics_router, prefix="/api")  # Analytics at /api/analytics/*
set_analytics_db(db)  # Initialize Analytics with database

# FAQ Routes (Refactored)
app.include_router(faq_router)  # Public FAQs at /api/faqs
app.include_router(faq_admin_router)  # Admin FAQs at /api/admin/faqs

# Content Routes (Refactored - Testimonials & Blog)
app.include_router(content_router)  # Public content at /api/testimonials, /api/blog-posts
app.include_router(content_admin_router)  # Admin content at /api/admin/testimonials, /api/admin/blog-posts

# Loyalty Routes (Refactored)
app.include_router(loyalty_router)  # Public at /api/loyalty/*
app.include_router(loyalty_admin_router)  # Admin at /api/admin/loyalty/*

# Discount Routes (Refactored)
app.include_router(discount_router)  # Public at /api/discount-codes/*
app.include_router(discount_admin_router)  # Admin at /api/admin/discount-codes/*

# Cart Routes (Refactored)
app.include_router(cart_router)  # Public at /api/cart/*
app.include_router(cart_admin_router)  # Admin at /api/admin/abandoned-carts/*

# Shopify Sync Routes (Refactored)
app.include_router(shopify_router)  # Public cron endpoint
app.include_router(shopify_admin_router)  # Admin sync management

# Orders Routes (Refactored)
app.include_router(orders_router)  # Public orders API

# Autoship Routes (Refactored)
app.include_router(autoship_router)  # User autoship endpoints
app.include_router(autoship_admin_router)  # Admin autoship management

# Admin Member Routes (Refactored)
app.include_router(admin_member_router)  # Admin member management

# Household Routes (Refactored)
app.include_router(household_router)  # Multi-pet household features

# Review Routes (Refactored)
app.include_router(review_router)  # User review endpoints
app.include_router(admin_review_router)  # Admin review management

# Smart Recommendations Engine
app.include_router(smart_router)  # AI-powered personalized recommendations

# WhatsApp Integration
app.include_router(whatsapp_router)  # WhatsApp Business API at /api/whatsapp/*

# Auto Ticket Creation System
set_auto_ticket_db(db)  # Initialize auto-ticket creation with database

@app.on_event("startup")
async def startup_load_admin_credentials():
    """Load admin credentials from database on startup"""
    logger.info("Starting admin credentials load...")
    await load_admin_credentials_from_db()
    logger.info("Admin credentials load complete")
    
    # Auto-seed blog posts if none exist
    await auto_seed_blog_posts()

# ==================== BLOG AUTO-SEED ====================

async def auto_seed_blog_posts():
    """Auto-seed sample blog posts if database is empty"""
    try:
        existing_count = await db.blog_posts.count_documents({})
        if existing_count > 0:
            logger.info(f"Blog posts already exist ({existing_count}), skipping auto-seed")
            return
        
        sample_posts = [
            {
                "id": f"post-{secrets.token_hex(4)}",
                "slug": "top-10-pet-friendly-hotels-in-india",
                "title": "Top 10 Pet-Friendly Hotels in India",
                "excerpt": "Discover the best accommodations where your furry friend is as welcome as you are.",
                "content": "Planning a vacation with your pet? Here are our top picks for pet-friendly hotels across India, from beachside resorts in Goa to mountain retreats in Himachal Pradesh...",
                "image_url": None,
                "category": "Travel",
                "author": "The Doggy Company Team",
                "status": "published",
                "is_featured": True,
                "views": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "published_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": f"post-{secrets.token_hex(4)}",
                "slug": "healthy-homemade-treats-for-your-dog",
                "title": "Healthy Homemade Treats for Your Dog",
                "excerpt": "Simple recipes to make nutritious and delicious treats at home.",
                "content": "While our bakery offers premium treats, sometimes you might want to whip up something special at home. Here are 5 vet-approved recipes that your dog will love...",
                "image_url": None,
                "category": "Health",
                "author": "Dr. Sneha Patel",
                "status": "published",
                "is_featured": False,
                "views": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "published_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": f"post-{secrets.token_hex(4)}",
                "slug": "pet-friendly-cafes-in-bangalore-a-complete-guide",
                "title": "Pet-Friendly Cafes in Bangalore: A Complete Guide",
                "excerpt": "Brunch spots where your pooch can join the fun too!",
                "content": "Bangalore has embraced the pet-friendly cafe culture like no other city in India. Here is our curated list of the best spots for a pawsome meal out...",
                "image_url": None,
                "category": "Dine",
                "author": "Foodie Paws",
                "status": "published",
                "is_featured": False,
                "views": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "published_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": f"post-{secrets.token_hex(4)}",
                "slug": "understanding-your-dogs-body-language",
                "title": "Understanding Your Dog's Body Language",
                "excerpt": "Learn to decode what your furry friend is really trying to tell you.",
                "content": "Dogs communicate through a rich vocabulary of body language. From tail wags to ear positions, understanding these signals can strengthen your bond...",
                "image_url": None,
                "category": "Care",
                "author": "Dr. Amit Kumar",
                "status": "published",
                "is_featured": False,
                "views": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "published_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": f"post-{secrets.token_hex(4)}",
                "slug": "how-to-plan-the-perfect-gotcha-day-celebration",
                "title": "How to Plan the Perfect Gotcha Day Celebration",
                "excerpt": "Make your adopted pet's anniversary unforgettable!",
                "content": "Gotcha Day - the anniversary of when your rescue pet joined your family - deserves to be celebrated! Here are creative ideas to make it special...",
                "image_url": None,
                "category": "Celebrate",
                "author": "The Doggy Company Team",
                "status": "published",
                "is_featured": False,
                "views": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "published_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": f"post-{secrets.token_hex(4)}",
                "slug": "5-tips-for-dog-birthday-parties",
                "title": "5 Tips for Throwing the Perfect Dog Birthday Party",
                "excerpt": "Make your pup's birthday celebration unforgettable!",
                "content": "Your furry friend's birthday deserves a pawsome celebration! Here are our top tips for throwing the perfect dog birthday party that both pups and humans will enjoy...",
                "image_url": None,
                "category": "Celebrate",
                "author": "TDB Team",
                "status": "published",
                "is_featured": True,
                "views": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "published_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        await db.blog_posts.insert_many(sample_posts)
        logger.info(f"Auto-seeded {len(sample_posts)} blog posts")
    except Exception as e:
        logger.error(f"Failed to auto-seed blog posts: {e}")

# ==================== STAY SEEDING ====================

@app.post("/api/admin/stay/seed")
async def seed_stay_data(
    force_reseed: bool = False,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Seed the Stay properties database with curated pet-friendly hotels"""
    verify_admin(credentials)
    result = await seed_stay_properties(db, force_reseed=force_reseed)
    return result


@app.post("/api/admin/stay/seed-bundles")
async def seed_stay_bundle_data(
    credentials: HTTPBasicCredentials = Depends(security)
):
    """Seed Stay product bundles"""
    verify_admin(credentials)
    bundles_result = await seed_stay_bundles(db)
    socials_result = await seed_sample_socials(db)
    return {
        "bundles": bundles_result,
        "socials": socials_result
    }


@app.post("/api/admin/stay/sync-to-products")
async def sync_stay_to_products_endpoint():
    """
    Sync stay_properties to main products collection.
    No auth required for emergency seeding on production.
    """
    try:
        # Default pricing
        DEFAULT_PRICES = {
            "budget": 2500, "mid": 5000, "premium": 12000, "luxury": 25000
        }
        
        # Sync stay_properties to products
        properties = await db.stay_properties.find({}).to_list(length=500)
        synced = 0
        
        for prop in properties:
            prop_type = (prop.get('property_type', '') or '').lower()
            if 'luxury' in prop_type or 'palace' in prop.get('name', '').lower():
                price = DEFAULT_PRICES['luxury']
            elif 'premium' in prop_type or 'resort' in prop_type:
                price = DEFAULT_PRICES['premium']
            elif 'budget' in prop_type or 'hostel' in prop_type:
                price = DEFAULT_PRICES['budget']
            else:
                price = DEFAULT_PRICES['mid']
            
            product_id = f"stay-{str(prop.get('_id'))}"
            product = {
                "id": product_id,
                "name": prop.get('name', 'Pet-Friendly Stay'),
                "title": prop.get('name', 'Pet-Friendly Stay'),
                "description": prop.get('description', f"Pet-friendly accommodation in {prop.get('city', 'India')}"),
                "price": prop.get('price_per_night') or price,
                "category": "stay",
                "pillar": "stay",
                "image": prop.get('images', [None])[0] if prop.get('images') else prop.get('image') or "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                "tags": ["Stay", "Pet-Friendly", prop.get('city', ''), prop.get('property_type', '')],
                "city": prop.get('city'),
                "property_type": prop.get('property_type'),
                "amenities": prop.get('amenities', []),
                "in_stock": True,
                "source": "stay_properties",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.products.update_one({"id": product_id}, {"$set": product}, upsert=True)
            synced += 1
        
        # Also sync boarding facilities
        boarding = await db.stay_boarding_facilities.find({}).to_list(length=100)
        for facility in boarding:
            product_id = f"boarding-{str(facility.get('_id', facility.get('name', '').replace(' ', '-').lower()))}"
            product = {
                "id": product_id,
                "name": facility.get('name'),
                "title": facility.get('name'),
                "description": facility.get('description'),
                "price": facility.get('price_per_night', 1000),
                "category": "boarding",
                "pillar": "stay",
                "tags": ["Boarding", "Pet Care", facility.get('city', '')],
                "city": facility.get('city'),
                "in_stock": True,
                "source": "stay_boarding_facilities",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.products.update_one({"id": product_id}, {"$set": product}, upsert=True)
            synced += 1
        
        logger.info(f"Synced {synced} stay properties to products collection")
        return {
            "success": True,
            "synced": synced,
            "properties": len(properties),
            "boarding": len(boarding)
        }
    except Exception as e:
        logger.error(f"Failed to sync stay to products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ADMIN PASSWORD MANAGEMENT ====================

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


# ==================== AGENT MANAGEMENT SYSTEM ====================

# Password hashing for agents
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Available permissions for agents
AGENT_PERMISSIONS = [
    "notifications",
    "orders", 
    "service_desk",
    "unified_inbox",
    "fulfilment",
    # Pillar-specific permissions
    "pillar_celebrate",  # Bakery
    "pillar_dine",       # Restaurants
    "pillar_stay",       # Pawcation
    "pillar_care",       # Vet/Grooming
    "pillar_travel",     # Pet Travel
    "pillar_shop",       # E-commerce
    "pillar_enjoy",      # Activities
    "pillar_club",       # Community
    "pillar_learn",      # Training
    "pillar_adopt",      # Adoption
    "pillar_insure",     # Insurance
    "pillar_farewell"    # End of life
]


@app.put("/api/admin/agents/{agent_id}/password")
async def reset_agent_password(agent_id: str, password_data: AgentPasswordChange, admin_user: str = Depends(verify_admin_auth)):
    """Reset agent password (admin only)"""
    # Hash the new password
    password_hash = pwd_context.hash(password_data.new_password)
    
    # Update password
    result = await db.agents.update_one(
        {"$or": [{"id": agent_id}, {"username": agent_id.lower()}]},
        {"$set": {"password_hash": password_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return {"success": True, "message": "Password updated successfully"}


@app.get("/api/admin/agents")
async def list_agents(admin_user: str = Depends(verify_admin_auth)):
    """List all agents"""
    agents = await db.agents.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return {"agents": agents, "count": len(agents)}


@app.post("/api/admin/agents")
async def create_agent(agent: AgentCreate, admin_user: str = Depends(verify_admin_auth)):
    """Create a new agent"""
    # Check if username already exists
    existing = await db.agents.find_one({"username": agent.username.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Validate permissions
    invalid_perms = [p for p in agent.permissions if p not in AGENT_PERMISSIONS]
    if invalid_perms:
        raise HTTPException(status_code=400, detail=f"Invalid permissions: {invalid_perms}")
    
    # Create agent document
    agent_doc = {
        "id": str(uuid.uuid4()),
        "username": agent.username.lower(),
        "password_hash": pwd_context.hash(agent.password),
        "name": agent.name,
        "email": agent.email,
        "phone": agent.phone,
        "permissions": agent.permissions,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None,
        "login_count": 0
    }
    
    await db.agents.insert_one(agent_doc)
    
    # Remove sensitive data before returning
    del agent_doc["password_hash"]
    if "_id" in agent_doc:
        del agent_doc["_id"]
    
    return {"success": True, "agent": agent_doc}


@app.get("/api/admin/agents/{agent_id}")
async def get_agent(agent_id: str, admin_user: str = Depends(verify_admin_auth)):
    """Get agent details"""
    agent = await db.agents.find_one(
        {"$or": [{"id": agent_id}, {"username": agent_id.lower()}]},
        {"_id": 0, "password_hash": 0}
    )
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return {"agent": agent}


@app.put("/api/admin/agents/{agent_id}")
async def update_agent(agent_id: str, updates: AgentUpdate, admin_user: str = Depends(verify_admin_auth)):
    """Update agent details"""
    # Build update document
    update_doc = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if updates.name is not None:
        update_doc["name"] = updates.name
    if updates.email is not None:
        update_doc["email"] = updates.email
    if updates.phone is not None:
        update_doc["phone"] = updates.phone
    if updates.is_active is not None:
        update_doc["is_active"] = updates.is_active
    if updates.permissions is not None:
        # Validate permissions
        invalid_perms = [p for p in updates.permissions if p not in AGENT_PERMISSIONS]
        if invalid_perms:
            raise HTTPException(status_code=400, detail=f"Invalid permissions: {invalid_perms}")
        update_doc["permissions"] = updates.permissions
    
    result = await db.agents.update_one(
        {"$or": [{"id": agent_id}, {"username": agent_id.lower()}]},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Get updated agent
    agent = await db.agents.find_one(
        {"$or": [{"id": agent_id}, {"username": agent_id.lower()}]},
        {"_id": 0, "password_hash": 0}
    )
    
    return {"success": True, "agent": agent}


@app.put("/api/admin/agents/{agent_id}/password")
async def change_agent_password(agent_id: str, data: AgentPasswordChange, admin_user: str = Depends(verify_admin_auth)):
    """Change agent password (admin only)"""
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    result = await db.agents.update_one(
        {"$or": [{"id": agent_id}, {"username": agent_id.lower()}]},
        {"$set": {
            "password_hash": pwd_context.hash(data.new_password),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return {"success": True, "message": "Password changed successfully"}


@app.delete("/api/admin/agents/{agent_id}")
async def delete_agent(agent_id: str, admin_user: str = Depends(verify_admin_auth)):
    """Delete an agent"""
    result = await db.agents.delete_one(
        {"$or": [{"id": agent_id}, {"username": agent_id.lower()}]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return {"success": True, "message": "Agent deleted"}


@app.get("/api/admin/agents/permissions/options")
async def get_permission_options():
    """Get available permission options for agents"""
    return {
        "permissions": [
            {"id": "notifications", "name": "Notifications", "icon": "🔔", "description": "View and manage notifications"},
            {"id": "orders", "name": "Orders", "icon": "📦", "description": "View and manage orders"},
            {"id": "service_desk", "name": "Service Desk", "icon": "🎫", "description": "Handle customer tickets"},
            {"id": "unified_inbox", "name": "Unified Inbox", "icon": "📥", "description": "View all customer requests"},
            {"id": "fulfilment", "name": "Fulfilment", "icon": "🚚", "description": "Manage order fulfilment"},
            # Pillar permissions
            {"id": "pillar_celebrate", "name": "Celebrate (Bakery)", "icon": "🎂", "description": "Access to bakery orders and celebrations", "category": "pillar"},
            {"id": "pillar_dine", "name": "Dine", "icon": "🍽️", "description": "Access to restaurant reservations", "category": "pillar"},
            {"id": "pillar_stay", "name": "Stay (Pawcation)", "icon": "🏨", "description": "Access to stay bookings", "category": "pillar"},
            {"id": "pillar_care", "name": "Care", "icon": "💊", "description": "Access to vet and grooming appointments", "category": "pillar"},
            {"id": "pillar_travel", "name": "Travel", "icon": "✈️", "description": "Access to pet travel requests", "category": "pillar"},
            {"id": "pillar_shop", "name": "Shop", "icon": "🛍️", "description": "Access to e-commerce orders", "category": "pillar"},
            {"id": "pillar_enjoy", "name": "Enjoy", "icon": "🎉", "description": "Access to activities and events", "category": "pillar"},
            {"id": "pillar_club", "name": "Club", "icon": "🤝", "description": "Access to community features", "category": "pillar"},
            {"id": "pillar_learn", "name": "Learn", "icon": "📚", "description": "Access to training and courses", "category": "pillar"},
            {"id": "pillar_adopt", "name": "Adopt", "icon": "🐕", "description": "Access to adoption services", "category": "pillar"},
            {"id": "pillar_insure", "name": "Insure", "icon": "🛡️", "description": "Access to insurance services", "category": "pillar"},
            {"id": "pillar_farewell", "name": "Farewell", "icon": "🌈", "description": "Access to end-of-life services", "category": "pillar"}
        ]
    }


# ==================== AGENT LOGIN (Separate from Admin) ====================

@app.post("/api/agent/login")
async def agent_login(request: AgentLoginRequest):
    """
    Agent login endpoint - separate from admin login.
    Returns agent info and permissions if successful.
    """
    # Find agent by username
    agent = await db.agents.find_one({"username": request.username.lower()})
    
    if not agent:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not pwd_context.verify(request.password, agent.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if agent is active
    if not agent.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is disabled. Contact your administrator.")
    
    # Update login stats
    await db.agents.update_one(
        {"id": agent["id"]},
        {
            "$set": {"last_login": datetime.now(timezone.utc).isoformat()},
            "$inc": {"login_count": 1}
        }
    )
    
    # Return agent info (without password)
    return {
        "success": True,
        "agent": {
            "id": agent["id"],
            "username": agent["username"],
            "name": agent["name"],
            "email": agent.get("email"),
            "phone": agent.get("phone"),
            "permissions": agent.get("permissions", []),
            "is_active": agent.get("is_active", True)
        }
    }


@app.post("/api/agent/verify")
async def verify_agent_session(data: dict):
    """Verify if an agent session is still valid"""
    agent_id = data.get("agent_id")
    
    if not agent_id:
        raise HTTPException(status_code=400, detail="Agent ID required")
    
    agent = await db.agents.find_one(
        {"id": agent_id},
        {"_id": 0, "password_hash": 0}
    )
    
    if not agent or not agent.get("is_active", True):
        raise HTTPException(status_code=401, detail="Session invalid")
    
    return {"valid": True, "agent": agent}


# ============== BREED VALIDATION API ==============

from breed_utils import normalize_breed_name, get_breed_suggestions, validate_breed

@app.get("/api/breed/validate")
async def validate_breed_name(breed: str):
    """Validate and correct a breed name"""
    return validate_breed(breed)

@app.get("/api/breed/suggestions")
async def get_breed_name_suggestions(partial: str, limit: int = 5):
    """Get breed name suggestions based on partial input"""
    return {"suggestions": get_breed_suggestions(partial, limit)}

@app.post("/api/breed/normalize")
async def normalize_breed(data: dict):
    """Normalize a breed name to its correct spelling"""
    breed = data.get("breed", "")
    corrected, was_corrected, original = normalize_breed_name(breed)
    return {
        "original": breed,
        "corrected": corrected,
        "was_corrected": was_corrected
    }


# ============== MEMBER RECOGNITION API ==============

from member_recognition import MemberRecognition, member_lookup_api

@app.get("/api/member/lookup")
async def lookup_member(identifier: str):
    """Auto-recognize a member by phone, email, or name"""
    return await member_lookup_api(db, identifier)

@app.get("/api/member/search")
async def search_members(q: str, limit: int = 10):
    """Search members by name, email, or phone"""
    if not q or len(q) < 2:
        return {"members": [], "count": 0}
    
    # Search across multiple fields
    query = {
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q}}
        ]
    }
    
    members = await db.users.find(query, {"_id": 0, "password_hash": 0}).limit(limit).to_list(limit)
    
    # Enrich with basic stats
    recognition = MemberRecognition(db)
    enriched_members = []
    for m in members:
        enriched_members.append(await recognition._enrich_member_data(m))
    
    return {"members": enriched_members, "count": len(enriched_members)}


# ==================== ADVANCED ANALYTICS ENDPOINTS ====================

@api_router.get("/analytics/revenue")
async def get_revenue_analytics(days: int = 30):
    """Get revenue analytics for the specified period"""
    from_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Get orders in period
    orders = await db.orders.find({
        "created_at": {"$gte": from_date}
    }).to_list(10000)
    
    total_revenue = sum(o.get("total", 0) for o in orders)
    order_count = len(orders)
    avg_order = int(total_revenue / order_count) if order_count > 0 else 0
    
    # Get unique customers
    customer_emails = set(o.get("customer", {}).get("email") or o.get("customer_email") for o in orders)
    customer_emails.discard(None)
    
    # Calculate revenue by pillar
    pillar_revenue = {}
    for order in orders:
        pillar = order.get("pillar", "shop")
        pillar_revenue[pillar] = pillar_revenue.get(pillar, 0) + order.get("total", 0)
    
    # Get previous period for trend comparison
    prev_from = (datetime.now(timezone.utc) - timedelta(days=days*2)).isoformat()
    prev_to = from_date
    prev_orders = await db.orders.find({
        "created_at": {"$gte": prev_from, "$lt": prev_to}
    }).to_list(10000)
    prev_revenue = sum(o.get("total", 0) for o in prev_orders)
    
    trend = 0
    if prev_revenue > 0:
        trend = int(((total_revenue - prev_revenue) / prev_revenue) * 100)
    
    return {
        "total": total_revenue,
        "orders": order_count,
        "customers": len(customer_emails),
        "average": avg_order,
        "trend": trend,
        "by_pillar": pillar_revenue,
        "period_days": days
    }


@api_router.get("/analytics/tickets")
async def get_ticket_analytics(days: int = 30):
    """Get ticket/service analytics for the specified period"""
    from_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Get service desk tickets
    tickets = await db.service_desk_tickets.find({
        "created_at": {"$gte": from_date}
    }).to_list(10000)
    
    total = len(tickets)
    resolved = sum(1 for t in tickets if t.get("status") == "resolved")
    open_tickets = sum(1 for t in tickets if t.get("status") in ["open", "in_progress", "pending"])
    
    # Calculate average resolution time (for resolved tickets)
    resolution_times = []
    for t in tickets:
        if t.get("status") == "resolved" and t.get("resolved_at") and t.get("created_at"):
            try:
                created = datetime.fromisoformat(t["created_at"].replace('Z', '+00:00'))
                resolved_at = datetime.fromisoformat(t["resolved_at"].replace('Z', '+00:00'))
                hours = (resolved_at - created).total_seconds() / 3600
                resolution_times.append(hours)
            except:
                pass
    
    avg_resolution = round(sum(resolution_times) / len(resolution_times), 1) if resolution_times else 0
    
    # SLA metrics
    sla_hours = {"urgent": 2, "high": 4, "medium": 24, "low": 48}
    sla_met = 0
    sla_breached = 0
    
    for t in tickets:
        if t.get("status") == "resolved" and t.get("resolved_at"):
            try:
                created = datetime.fromisoformat(t["created_at"].replace('Z', '+00:00'))
                resolved_at = datetime.fromisoformat(t["resolved_at"].replace('Z', '+00:00'))
                hours = (resolved_at - created).total_seconds() / 3600
                priority = t.get("priority_bucket", t.get("urgency", "medium"))
                sla_limit = sla_hours.get(priority, 24)
                if hours <= sla_limit:
                    sla_met += 1
                else:
                    sla_breached += 1
            except:
                pass
    
    compliance_rate = int((sla_met / (sla_met + sla_breached)) * 100) if (sla_met + sla_breached) > 0 else 100
    
    # By pillar breakdown
    pillar_stats = {}
    for t in tickets:
        pillar = t.get("pillar", t.get("category", "general"))
        if pillar not in pillar_stats:
            pillar_stats[pillar] = {"id": pillar, "tickets": 0, "resolved": 0, "revenue": 0}
        pillar_stats[pillar]["tickets"] += 1
        if t.get("status") == "resolved":
            pillar_stats[pillar]["resolved"] += 1
    
    return {
        "total": total,
        "resolved": resolved,
        "open": open_tickets,
        "avg_resolution": avg_resolution,
        "sla": {
            "met": sla_met,
            "breaches": sla_breached,
            "compliance_rate": compliance_rate,
            "at_risk": sum(1 for t in tickets if t.get("status") == "open")
        },
        "by_pillar": list(pillar_stats.values()),
        "period_days": days
    }


@api_router.get("/analytics/agents")
async def get_agent_analytics(days: int = 30):
    """Get agent performance analytics"""
    from_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Get resolved tickets with agent info
    tickets = await db.service_desk_tickets.find({
        "created_at": {"$gte": from_date},
        "resolved_by": {"$ne": None}
    }).to_list(10000)
    
    # Aggregate by agent
    agent_stats = {}
    sla_hours = {"urgent": 2, "high": 4, "medium": 24, "low": 48}
    
    for t in tickets:
        agent = t.get("resolved_by") or t.get("assigned_to") or "Unknown"
        if agent not in agent_stats:
            agent_stats[agent] = {
                "id": agent,
                "name": agent,
                "tickets_resolved": 0,
                "resolution_times": [],
                "sla_met": 0,
                "sla_breached": 0
            }
        
        agent_stats[agent]["tickets_resolved"] += 1
        
        # Calculate resolution time
        if t.get("resolved_at") and t.get("created_at"):
            try:
                created = datetime.fromisoformat(t["created_at"].replace('Z', '+00:00'))
                resolved_at = datetime.fromisoformat(t["resolved_at"].replace('Z', '+00:00'))
                hours = (resolved_at - created).total_seconds() / 3600
                agent_stats[agent]["resolution_times"].append(hours)
                
                priority = t.get("priority_bucket", t.get("urgency", "medium"))
                sla_limit = sla_hours.get(priority, 24)
                if hours <= sla_limit:
                    agent_stats[agent]["sla_met"] += 1
                else:
                    agent_stats[agent]["sla_breached"] += 1
            except:
                pass
    
    # Calculate averages and format
    agents = []
    for agent_id, stats in agent_stats.items():
        avg_time = round(sum(stats["resolution_times"]) / len(stats["resolution_times"]), 1) if stats["resolution_times"] else 0
        total_sla = stats["sla_met"] + stats["sla_breached"]
        compliance = int((stats["sla_met"] / total_sla) * 100) if total_sla > 0 else 100
        
        agents.append({
            "id": agent_id,
            "name": stats["name"],
            "tickets_resolved": stats["tickets_resolved"],
            "avg_resolution_time": avg_time,
            "sla_compliance": compliance,
            "nps_score": None  # Would need to link to NPS data
        })
    
    # Sort by tickets resolved
    agents.sort(key=lambda x: x["tickets_resolved"], reverse=True)
    
    return {
        "agents": agents,
        "period_days": days
    }



# ==================== PET PASS RENEWAL REMINDERS ====================

@api_router.get("/admin/renewals/expiring")
async def get_expiring_passes(days: int = 30, username: str = Depends(verify_admin)):
    """Get list of Pet Pass memberships expiring within specified days"""
    expiring = await get_expiring_memberships(days)
    return {
        "expiring_within_days": days,
        "count": len(expiring),
        "members": expiring
    }


@api_router.post("/admin/renewals/check")
async def trigger_renewal_check(username: str = Depends(verify_admin)):
    """Manually trigger renewal reminder check (sends emails to those due for reminder)"""
    results = await check_and_send_renewal_reminders()
    return {
        "message": "Renewal check completed",
        "results": results
    }


@api_router.post("/admin/renewals/send-reminder/{user_email}")
async def send_manual_reminder(user_email: str, username: str = Depends(verify_admin)):
    """Manually send a renewal reminder to a specific user"""
    from renewal_reminders import send_renewal_reminder_email
    
    user = await db.users.find_one({"email": user_email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get expiry days
    expires_str = user.get("membership_expires")
    if not expires_str:
        raise HTTPException(status_code=400, detail="User has no membership expiration date")
    
    expires = datetime.fromisoformat(expires_str.replace('Z', '+00:00'))
    days_until = (expires - datetime.now(timezone.utc)).days
    
    # Get user's pets
    pet_ids = user.get("pet_ids", [])
    pets = await db.pets.find({"id": {"$in": pet_ids}}, {"_id": 0, "name": 1}).to_list(100) if pet_ids else []
    pet_names = [p.get("name", "Unknown") for p in pets]
    
    success = await send_renewal_reminder_email(user, max(days_until, 1), pet_names)
    
    if success:
        return {"message": f"Renewal reminder sent to {user_email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send reminder email")



@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ============== BULK ADD IMAGES TO PRODUCTS ==============

PILLAR_STOCK_IMAGES = {
    "fit": [
        "https://images.unsplash.com/photo-1676729274491-579573327bd0?w=800",
        "https://images.unsplash.com/photo-1546815693-7533bae19894?w=800",
        "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800",
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
        "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800"
    ],
    "care": [
        "https://images.unsplash.com/photo-1601758123927-4f7b83de9a89?w=800",
        "https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=800",
        "https://images.unsplash.com/photo-1629740067905-bd3f515aa739?w=800",
        "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800"
    ],
    "travel": [
        "https://images.unsplash.com/photo-1560743641-3914f2c45636?w=800",
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800",
        "https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=800"
    ],
    "stay": [
        "https://images.unsplash.com/photo-1587559070757-f72a388edbba?w=800",
        "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=800",
        "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=800"
    ],
    "dine": [
        "https://images.unsplash.com/photo-1599443015574-be5fe8a05783?w=800",
        "https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?w=800",
        "https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=800"
    ],
    "celebrate": [
        "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=800",
        "https://images.unsplash.com/photo-1575223970966-76ae61ee7838?w=800",
        "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800"
    ],
    "default": [
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
        "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800",
        "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800"
    ]
}

@api_router.post("/admin/products/add-images")
async def bulk_add_product_images(username: str = Depends(verify_admin)):
    """Add stock images to products that don't have images"""
    import random
    
    # Get products without images
    products_without_images = await db.products.find({
        "$or": [
            {"image": {"$exists": False}},
            {"image": None},
            {"image": ""},
            {"images": {"$exists": False}},
            {"images": {"$size": 0}}
        ]
    }).to_list(500)
    
    unified_without_images = await db.unified_products.find({
        "$or": [
            {"image": {"$exists": False}},
            {"image": None},
            {"image": ""},
            {"images": {"$exists": False}},
            {"images": {"$size": 0}}
        ]
    }).to_list(500)
    
    updated = 0
    
    # Update products collection
    for product in products_without_images:
        pillar = product.get("pillar", product.get("category", "default"))
        images = PILLAR_STOCK_IMAGES.get(pillar, PILLAR_STOCK_IMAGES["default"])
        selected_image = random.choice(images)
        
        await db.products.update_one(
            {"_id": product["_id"]},
            {"$set": {"image": selected_image, "images": [selected_image]}}
        )
        updated += 1
    
    # Update unified_products collection
    for product in unified_without_images:
        pillar = product.get("pillar", product.get("category", "default"))
        images = PILLAR_STOCK_IMAGES.get(pillar, PILLAR_STOCK_IMAGES["default"])
        selected_image = random.choice(images)
        
        await db.unified_products.update_one(
            {"_id": product["_id"]},
            {"$set": {"image": selected_image, "images": [selected_image]}}
        )
        updated += 1
    
    return {
        "success": True,
        "products_updated": updated,
        "products_collection": len(products_without_images),
        "unified_products_collection": len(unified_without_images)
    }
