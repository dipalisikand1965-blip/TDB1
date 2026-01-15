"""
Authentication Routes for The Doggy Company
Handles user registration, login, Google OAuth, and JWT tokens
"""

import os
import logging
import uuid
import hashlib
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials, OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorDatabase
from passlib.context import CryptContext
import httpx
import secrets

logger = logging.getLogger(__name__)

# Create router
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== SECURITY CONFIG ====================

# JWT Settings
SECRET_KEY = os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password Context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()

# Membership tiers
MEMBERSHIP_TIERS = {
    "free": {"name": "Free", "daily_chats": 3, "priority": False},
    "soul": {"name": "Soul", "daily_chats": 999, "priority": True},
    "heart": {"name": "Heart", "daily_chats": 999, "priority": True},
    "family": {"name": "Family", "daily_chats": 999, "priority": True}
}


# ==================== MODELS ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ==================== HELPER FUNCTIONS ====================

def verify_password_secure(plain_password: str, hashed_password: str) -> bool:
    """Verify password - handles both legacy SHA256 and new Bcrypt"""
    if not hashed_password.startswith("$2b$"):
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash_secure(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Get current user from JWT token"""
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
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return user


async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """Get current user if authenticated, return None otherwise"""
    if not authorization:
        return None
    
    try:
        # Extract token from "Bearer <token>"
        if authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
        else:
            token = authorization
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            return None
    except jwt.PyJWTError:
        return None
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    return user


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)) -> str:
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


# ==================== AUTH ROUTES ====================

@auth_router.post("/register")
async def register_user(user: UserRegister):
    """Register a new user"""
    # Check if email exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "password_hash": get_password_hash_secure(user.password),
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


@auth_router.post("/login")
async def login_user(user: UserLogin):
    """Login user and return JWT"""
    db_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Use the secure verification (handles both legacy SHA256 and new Bcrypt)
    if not verify_password_secure(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update hash to bcrypt if it was legacy
    if not db_user["password_hash"].startswith("$2b$"):
        new_hash = get_password_hash_secure(user.password)
        await db.users.update_one({"email": user.email}, {"$set": {"password_hash": new_hash}})
    
    # Get membership access info
    access = await check_mira_access(user.email)
    
    # Create JWT
    access_token = create_access_token(data={"sub": user.email, "role": "user"})
    
    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "email": db_user["email"],
            "name": db_user.get("name"),
            "membership_tier": db_user.get("membership_tier", "free"),
            "membership_expires": db_user.get("membership_expires")
        },
        "mira_access": access
    }


@auth_router.get("/me")
async def get_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    # Hide password hash
    user_data = {k: v for k, v in current_user.items() if k != "password_hash"}
    access = await check_mira_access(current_user["email"])
    return {"user": user_data, "mira_access": access}


@auth_router.post("/google/session")
async def process_google_session(request: dict):
    """
    Process Google OAuth session_id from Emergent Auth
    Exchange session_id for user data and create/update user in DB
    """
    session_id = request.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    try:
        # Call Emergent Auth API to get user data
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            auth_data = response.json()
    except httpx.RequestError as e:
        logger.error(f"Emergent Auth API error: {e}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    if not email or not session_token:
        raise HTTPException(status_code=400, detail="Invalid auth response")
    
    # Check if user exists, create or update
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        # Update existing user's Google data
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "name": name or existing_user.get("name"),
                "picture": picture,
                "auth_provider": "google",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        user_id = existing_user.get("id")
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "auth_provider": "google",
            "membership_tier": "free",
            "membership_expires": None,
            "chat_count_today": 0,
            "last_chat_date": None,
            "loyalty_points": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Store session token with expiry (7 days)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    
    # Get updated user data
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    # Also create a JWT for compatibility with existing auth system
    access_token = create_access_token(data={"sub": email, "role": "user"})
    
    return {
        "message": "Google login successful",
        "access_token": access_token,
        "session_token": session_token,
        "token_type": "bearer",
        "user": {
            "id": user.get("id"),
            "email": user.get("email"),
            "name": user.get("name"),
            "picture": user.get("picture"),
            "membership_tier": user.get("membership_tier", "free"),
            "membership_expires": user.get("membership_expires"),
            "loyalty_points": user.get("loyalty_points", 0)
        }
    }


@auth_router.post("/logout")
async def logout_user(request: dict):
    """Logout user by invalidating session"""
    session_token = request.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    return {"message": "Logged out successfully"}
