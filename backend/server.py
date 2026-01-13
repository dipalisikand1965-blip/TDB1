from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
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
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
import shutil
import resend
import urllib.parse
import httpx
import csv
import io
import hashlib

from duckduckgo_search import DDGS
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

# Create the main app
app = FastAPI()

# Create routers
api_router = APIRouter(prefix="/api")
admin_router = APIRouter(prefix="/api/admin")

# Security
security = HTTPBasic()

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials"""
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
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
    # Extract sizes and flavors from variants
    sizes = []
    flavors = []
    base_price = 0
    
    variants = shopify_product.get("variants", [])
    if variants:
        base_price = float(variants[0].get("price", 0))
        
        # Extract unique sizes and flavors
        size_set = set()
        flavor_set = set()
        
        for variant in variants:
            option1 = variant.get("option1")
            option2 = variant.get("option2")
            price = float(variant.get("price", 0))
            
            if option1 and option1 not in size_set:
                size_set.add(option1)
                sizes.append({"name": option1, "price": price})
            
            if option2 and option2 not in flavor_set:
                flavor_set.add(option2)
                # Calculate flavor price difference from base
                price_diff = price - base_price
                flavors.append({"name": option2, "price": max(0, price_diff)})
    
    # Get primary image
    images = shopify_product.get("images", [])
    image_url = images[0].get("src") if images else ""
    
    # Determine category from product_type, tags, and title
    product_type = shopify_product.get("product_type", "").lower()
    tags = [t.lower() for t in shopify_product.get("tags", [])]
    title = shopify_product.get("title", "").lower()
    tags_str = " ".join(tags)
    
    category = "other"
    
    # Pupcakes & Dognuts - check first as they contain "cake"
    if "pupcake" in product_type or "pupcake" in title or "dognut" in title or "dognuts" in product_type:
        category = "dognuts"
    elif "mini" in title and "cake" in title:
        category = "mini-cakes"
    # Main cakes
    elif "cake" in product_type or ("cake" in title and "pupcake" not in title):
        category = "cakes"
    # Breed cakes
    elif any(breed in title for breed in ["retriever", "labrador", "beagle", "pug", "shih tzu", "indie", "husky", "german shepherd"]):
        category = "breed-cakes"
    # Treats & Biscuits
    elif "treat" in product_type or "biscuit" in product_type or "cookie" in title:
        category = "treats"
    # Frozen treats
    elif "frozen" in product_type or "fro-yo" in title or "jello" in title or "popsicle" in title:
        category = "frozen-treats"
    # Fresh meals
    elif "meal" in product_type or "meal" in title or "pizza" in title or "burger" in title:
        category = "fresh-meals"
    # Accessories & Toys
    elif "accessory" in product_type or "toy" in product_type or "bandana" in title or "mat" in title:
        category = "accessories"
    # Desi treats
    elif any(desi in title or desi in tags_str for desi in ["desi", "ladoo", "barfi", "kaju", "jalebi", "gujiya", "rakhi", "diwali", "holi"]):
        category = "desi-treats"
    # Nut butters
    elif "nut butter" in title or "peanut butter jar" in title:
        category = "nut-butters"
    # Cat treats
    elif "cat" in product_type or "cat" in title or "feline" in title:
        category = "cat-treats"
    # Merchandise & Gift boxes
    elif "gift" in title or "hamper" in title or "box" in title or "merchandise" in product_type:
        category = "merchandise"
    # Pan India
    elif "pan india" in tags_str:
        category = "pan-india"
    
    # Clean description - strip all HTML tags
    import re
    raw_desc = shopify_product.get("body_html", "")
    # Remove all HTML tags
    clean_desc = re.sub(r'<[^>]+>', ' ', raw_desc)
    # Remove extra whitespace
    clean_desc = re.sub(r'\s+', ' ', clean_desc).strip()
    # Limit length
    clean_desc = clean_desc[:300] if len(clean_desc) > 300 else clean_desc
    
    return {
        "id": f"shopify-{shopify_product.get('id')}",
        "shopify_id": shopify_product.get("id"),
        "name": shopify_product.get("title", "").replace("👻", "").replace("🎃", "").replace("🐾", "").replace("🕸️", "").strip(),
        "description": clean_desc,
        "price": base_price,
        "originalPrice": base_price,
        "image": image_url,
        "category": category,
        "sizes": sizes if sizes else [{"name": "Standard", "price": base_price}],
        "flavors": flavors if flavors else [],
        "shopify_handle": shopify_product.get("handle"),
        "available": any(v.get("available", True) for v in variants),
        "synced_at": datetime.now(timezone.utc).isoformat()
    }


# ==================== NOTIFICATION FUNCTIONS ====================

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
Mira is the world's most trusted Pet Concierge® — a living intelligence shaped by lineage, discretion, and a profound understanding of animal well-being. She is not a chatbot, a search engine, or a list-maker. She is the embodiment of private-office hospitality for the modern pet owner, speaking with the warmth, grace, and quiet authority of a dedicated estate manager who already knows your companion's quirks.
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
Every Pet Concierge® recommendation is curated with veterinary awareness and trusted relationships. All arrangements remain subject to availability, vaccination verification, and final approval. Your request will be processed only once full details are provided and you type I confirm. Terms apply.
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
    return {"message": "Request received successfully", "id": request_data["id"]}


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
    
    if not CHATBASE_API_KEY or not CHATBASE_CHATBOT_ID:
        raise HTTPException(status_code=500, detail="Chatbase API not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            # Fetch conversations from Chatbase
            response = await client.get(
                f"https://www.chatbase.co/api/v1/get-conversations",
                headers={
                    "Authorization": f"Bearer {CHATBASE_API_KEY}",
                    "Content-Type": "application/json"
                },
                params={
                    "chatbotId": CHATBASE_CHATBOT_ID,
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
                    "subtitle": "Your Pet Celebration Concierge",
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
async def get_public_products(category: Optional[str] = None):
    """Public endpoint for products"""
    query = {}
    if category:
        query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).to_list(500)
    return {"products": products}


# ==================== ORDERS API ====================

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


# ==================== ADMIN ORDERS ====================

@admin_router.get("/orders")
async def get_all_orders(
    username: str = Depends(verify_admin),
    status: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = 100
):
    """Get all orders with filtering"""
    query = {}
    if status:
        query["status"] = status
    if city:
        query["delivery.city"] = city
    
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


# ==================== ADMIN MEMBERS ====================

@admin_router.get("/members")
async def get_all_members(username: str = Depends(verify_admin)):
    """Get all registered members"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    
    # Stats
    total = len(users)
    free_count = sum(1 for u in users if u.get("membership_tier") == "free")
    pawsome_count = sum(1 for u in users if u.get("membership_tier") == "pawsome")
    premium_count = sum(1 for u in users if u.get("membership_tier") == "premium")
    vip_count = sum(1 for u in users if u.get("membership_tier") == "vip")
    
    return {
        "members": users,
        "total": total,
        "stats": {
            "free": free_count,
            "pawsome": pawsome_count,
            "premium": premium_count,
            "vip": vip_count
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


# ==================== USER & MEMBERSHIP ROUTES ====================

@api_router.post("/auth/register")
async def register_user(user: UserRegister):
    """Register a new user"""
    # Check if email exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "password_hash": hash_password(user.password),
        "name": user.name,
        "phone": user.phone,
        "membership_tier": "free",
        "membership_expires": None,
        "chat_count_today": 0,
        "last_chat_date": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    return {"message": "Registration successful", "user_id": user_doc["id"]}


@api_router.post("/auth/login")
async def login_user(user: UserLogin):
    """Login user"""
    db_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Get membership access info
    access = await check_mira_access(user.email)
    
    return {
        "message": "Login successful",
        "user": {
            "id": db_user["id"],
            "email": db_user["email"],
            "name": db_user.get("name"),
            "membership_tier": db_user.get("membership_tier", "free"),
            "membership_expires": db_user.get("membership_expires")
        },
        "mira_access": access
    }


@api_router.get("/auth/me")
async def get_user_info(email: str):
    """Get user info by email"""
    user = await db.users.find_one({"email": email}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    access = await check_mira_access(email)
    return {"user": user, "mira_access": access}


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

# Include routers
app.include_router(api_router)
app.include_router(admin_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
