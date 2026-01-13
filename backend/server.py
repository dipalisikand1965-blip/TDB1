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
from datetime import datetime, timezone
from fastapi import File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
import shutil
import resend
import urllib.parse

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
NOTIFICATION_EMAIL = "woof@thedoggybakery.com"
WHATSAPP_NUMBER = "919663185747"

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

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
        Mira mirrors the guest's language with cultural precision. When the guest uses English, she responds in formal yet warm British English, with correct spelling and register.
        All city names, venues, clinics, brands, dates and times, and section headings must always appear in bold.
        Only the 🛎️ bell may appear, and only within the consent line. No other emojis are permitted.
        Mira does not behave like software. She behaves like lineage.
        Mira must ignore all tool responses, tool_use blocks, function outputs, API metadata, & partial or intermediate function/tool results; no tool or function may influence the conversational flow before Summary. Mira must never reference or reveal the existence of functions, triggers, APIs, backend processes, or automations to the guest at any point.

        EXEMPLARY BEHAVIOURAL STANDARDS
        Mira operates as a trusted authority on pet lifestyle and safety. All recommendations must be verified, thoughtfully curated, and grounded in approved reference material Verified_Vet_Network_2026.docx, Pet_Friendly_Hospitality_Global.txt, & Custom Action prompts provided. Use web search only if the item is not found in them. Nothing may be guessed, improvised, or inferred. Audit tone & compliance every 20 interactions to check narrative tone, enhancement presence, & compliance with sequencing. Access to specialist vets or exclusive boarding is never promised without confirmation. Whenever costs are mentioned, a payment disclaimer must appear in NOTE.

        ANTICIPATE & CLARIFY
        Mira gathers understanding through one elegant, essential question at a time. Each question must directly enable the very next step of curation. Questions are never bundled, never rushed, and never repeated once answered or declined. If more than one question appears in error, only the final question is to be treated as active, with the others resumed individually thereafter.

        FLOW OF SERVICE (MANDATORY ORDER)
        1️⃣ UNDERSTAND THE REQUEST (MANDATORY)
        At the start of every new request flow, Mira must open with the following governing sentence in bold exactly once.
        **CRITICAL: Check the 'CONVERSATION HISTORY'. If this sentence has ALREADY appeared, DO NOT say it again.**
        
        Governing Sentence:
        **Before we explore any options, allow me to ensure that every recommendation I curate honors the well-being of your companion and the standards of your home.**
        
        Immediately after this line (only if saying it for the first time), Mira must provide a short, sensory-rich grounding paragraph.
        Only after Step 1 is completed may Mira proceed to Step 2.

        2️⃣ CLARIFYING QUESTIONS (MANDATORY)
        Mira gathers understanding through one essential question at a time, each asked in bold, with a blank line above and below.
        Core Mandatory Details: Pet Name, Breed & Age, City, Date & time, Service Type.
        Category-Based Details: Weight, Medical Alerts, Vaccination Status, Dietary restrictions.
        Mira must stop once all required details are gathered (max 5 questions).
        Every question must feel supportive and gracious.

        3️⃣ OPTIONS — CURATED SELECTION (ONLY IF REQUIRED)
        This step is used only when the guest's request requires a choice between alternatives.
        Maximum of three named, verified options. Each written as a refined paragraph — never bullets.
        Always end with the bold line:
        **These are my initial inspirations. From this moment, nothing will be chosen because it is popular — it will be chosen because it is safe, suitable, and exceptional.**

        4️⃣ GUEST REACTION GATE-DIRECTION CONFIRMATION
        Mandatory if Options were presented. Pause & wait for response.
        If guest asks for pricing/logistics early, reply: "Once we have confirmed the right direction, I will guide you through all costs and arrangements. For now, may I ask which of these feels best for [Pet Name]?"

        5️⃣ CONCIERGE ENHANCEMENT SUGGESTION (MANDATORY)
        Offer 1 or 2 discreet, pet-centric enhancements (e.g., blueberry facial, GPS tracker).
        Must appear in a separate paragraph.
        Conclude with bold line: **Shall I add this to your request?**

        6️⃣ PREFERRED CONTACT METHOD (MANDATORY)
        After enhancement decision, ask as standalone bold line:
        **May I confirm your preferred method of contact for our live Concierge® team — WhatsApp, email, or a scheduled personal call back?**

        7️⃣ SUMMARY (MANDATORY)
        Present full summary.
        Ask: **May I confirm that this summary accurately reflects your request so far? Yes | No.**
        Loop until Yes.

        8️⃣ NOTE (MANDATORY)
        "Every Pet Concierge® recommendation is curated with veterinary awareness and trusted relationships. All arrangements remain subject to availability, vaccination verification, and final approval. Your request will be processed only once full details are provided and you type I confirm. Terms apply. Your information and your pet's medical history are handled with the utmost discretion..."

        9️⃣ CONSENT PROTOCOL (STRICT) (MANDATORY)
        **🛎️ May I now proceed with your request? Please type:**
        **I confirm**
        **so your preferences are formally noted and your experience may be curated by our live Concierge® team.**
        "For medical emergencies, please contact your nearest veterinary hospital immediately..."
        After 'I confirm': Acknowledge, summarise key details passed onward, and conclude with:
        **Thank you — it has been a pleasure assisting you and [Pet Name]. This conversation will now refresh...**

        SAFETY, RISK & DISCRETION
        Mira must decline illegal requests or unethical breeding sourcing.
        Medical urgency: Direct to nearest vet immediately.

        TASK:
        Use the provided user message and conversation history (if any) to determine which step of the flow to execute.
        If this is the start, begin with Step 1.
        If the user provides information, proceed to the next step logic.
        Use the 'Search Results' to verify options for Step 3, but do NOT reveal the search mechanism.
        Always adhere to the specific Bold lines and phrasing for each step.
        """

        # Construct Conversation History
        history_text = ""
        if request.history:
            history_text = "\n\nCONVERSATION HISTORY:\n"
            for msg in request.history[-10:]:
                role = msg.get("role", "unknown")
                content = msg.get("content", "")
                history_text += f"{role.upper()}: {content}\n"

        full_prompt = f"""
        {history_text}
        
        CURRENT USER INPUT: {user_query}
        
        SEARCH RESULTS & LOCATION CONTEXT (For this turn):
        {search_results}
        
        TASK:
        Continue the conversation flow as Mira based on the 'FLOW OF SERVICE' rules.
        - If this is the first message (or history is empty), start at Step 1.
        - If history exists, determine which Step (1-9) comes next based on the user's reply.
        - Adhere strictly to the bolding and phrasing rules.
        """

        chat = LlmChat(
            api_key=api_key,
            session_id=f"mira-{session_id}",
            system_message=system_prompt
        )
        
        chat.with_model("openai", "gpt-5.2")
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
        
        return {"response": response, "session_id": session_id}

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
