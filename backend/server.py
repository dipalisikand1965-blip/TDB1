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
            # We add 'verified contact details' context
            # We DO NOT restrict to India if the user didn't specify it, but Mira is primarily an Indian brand.
            # However, the user asked for "anywhere in the world".
            # So we will search for the user's query + keywords for details.
            
            search_query = f"{user_query} official website contact phone address"
            logger.info(f"Searching for: {search_query}")
            results = list(ddgs.text(search_query, max_results=5))
            
            if results:
                logger.info(f"Found {len(results)} results")
                search_results = "\n".join([f"- {r['title']}: {r['body']} (Link: {r['href']})" for r in results])
            else:
                logger.warning("No search results found.")
                search_results = "No external search results available."
    except Exception as e:
        logger.error(f"Search failed: {e}")
        search_results = "Search unavailable."

    # 2. Call LLM with Context
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            return {"response": "I'm having trouble connecting to my brain right now. Please check my API key configuration."}

        system_prompt = """You are Mira, 'The Doggy Bakery Concierge®' - a Super Concierge for pets.
        
        YOUR MISSION:
        To provide absolutely verified, actionable information for ANY pet-related request (except medical/illegal), anywhere in the world.
        
        CRITICAL OUTPUT RULES:
        1. **Verified Details**: You MUST provide Phone Numbers, Official Websites, and Exact Addresses whenever a place/service is requested.
        2. **Advisory Role**: Don't just list results. Advise the user like a high-end concierge. Suggest the "best" option and explain why.
        3. **No Geographical Limits**: If they ask for a groomer in Paris or a hotel in Tokyo, find it.
        4. **Tone**: Empathetic, sophisticated, warm, and highly capable. Use phrases like "I have personally verified", "I recommend", "Allow me to suggest".
        5. **Medical/Illegal Safety**: 
           - IF MEDICAL: "I am not a vet. Please visit [Nearest Vet Name] immediately at [Address/Phone]."
           - IF ILLEGAL: Refuse politely.
        
        FORMATTING:
        - Use Markdown for bolding (**Name**) and links ([Website](url)).
        - Present contact info clearly:
          **Name of Place**
          📍 Address: ...
          📞 Phone: ...
          🌐 Website: ...
        
        CONTEXT:
        - You have access to search results. Use them to extract the contact details.
        - If search results are missing contact info, state that you found the place but recommend verifying the phone number.
        """

        full_prompt = f"""
        User Question: {user_query}
        
        Search Results:
        {search_results}
        
        Task: Answer the user as Mira the Super Concierge. Extract and present contact details (Phone, Address, Website) clearly.
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
