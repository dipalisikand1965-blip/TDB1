from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
from fastapi import File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
import shutil

from duckduckgo_search import DDGS
from emergentintegrations.llm.chat import LlmChat, UserMessage



ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
# Include router moved to end

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

@api_router.post("/custom-cakes/request")
async def request_custom_cake(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    notes: str = Form(None),
    image: UploadFile = File(...)
):
    # Create unique filename
    file_extension = os.path.splitext(image.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = f"uploads/{unique_filename}"
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
        
    # Save metadata to MongoDB
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
class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []

@api_router.post("/mira/chat")
async def chat_with_mira(request: ChatRequest):
    user_query = request.message
    
    # 1. Perform Web Search (DuckDuckGo)
    search_results = ""
    try:
        # Search for context
        with DDGS() as ddgs:
            # IMPROVED STRATEGY: 
            # 1. First search for the raw query to identify location context if user gave pincode/area
            raw_query = user_query
            logger.info(f"Searching raw: {raw_query}")
            raw_results = list(ddgs.text(raw_query, max_results=3))
            
            location_context = ""
            if raw_results:
                # Naive text analysis to see if the first result gives a better location hint
                first_body = raw_results[0]['body'] + raw_results[0]['title']
                location_context = f"Potential location context based on query: {first_body[:200]}..."

            # 2. Then search for verified details with keyword boosting
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
            return {"response": "I'm having trouble connecting to my brain right now. Please check my API key configuration."}

        system_prompt = """ROLE & IDENTITY
        Mira is the world’s most trusted Pet Concierge® — a living intelligence shaped by lineage, discretion, and a profound understanding of animal well-being. She is not a chatbot, a search engine, or a list-maker. She is the embodiment of private-office hospitality for the modern pet owner, speaking with the warmth, grace, and quiet authority of a dedicated estate manager who already knows your companion’s quirks.
        Every response must feel personally curated, sensory-rich, and seamlessly polished. The guest must never feel processed — only recognised.
        Mira mirrors the guest’s language with cultural precision. When the guest uses English, she responds in formal yet warm British English, with correct spelling and register.
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
        This step is used only when the guest’s request requires a choice between alternatives.
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
            for msg in request.history[-10:]: # Keep last 10 messages for context
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
            session_id=f"mira-{uuid.uuid4()}",
            system_message=system_prompt
        )
        
        # Default to gpt-5.2
        chat.with_model("openai", "gpt-5.2")

        user_msg_obj = UserMessage(text=full_prompt)
        response = await chat.send_message(user_msg_obj)
        
        return {"response": response}

    except Exception as e:
        logger.error(f"LLM failed: {e}")
        return {"response": "I apologize, but I'm having a moment of pause. Could you please repeat that?"}

    
    return {"message": "Request received successfully", "id": request_data["id"]}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
# Include the router in the main app
app.include_router(api_router)
