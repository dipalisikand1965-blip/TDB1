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
from fastapi.security import HTTPBasic, HTTPBasicCredentials, OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorDatabase
from passlib.context import CryptContext
import httpx
import secrets

logger = logging.getLogger(__name__)

# Create router
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Security schemes
security_bearer = HTTPBearer(auto_error=False)


# ==================== PET PASS NUMBER GENERATION ====================

async def generate_pet_pass_number(db_instance=None) -> str:
    """
    Generate a unique Pet Pass Number for a pet.
    Format: TDC-XXXXXX (6 alphanumeric characters)
    This is the pet's membership number - pets are the real members!
    """
    database = db_instance or db
    
    while True:
        # Generate random 6-character alphanumeric code
        import random
        import string
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        pet_pass = f"TDC-{code}"
        
        # Ensure uniqueness
        existing = await database.pets.find_one({"pet_pass_number": pet_pass})
        if not existing:
            return pet_pass

# Database reference
db: AsyncIOMotorDatabase = None

# Admin notification handler
_create_admin_notification = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database

def set_admin_notification_handler(handler):
    """Set the admin notification handler from server.py"""
    global _create_admin_notification
    _create_admin_notification = handler

async def notify_admin(notification_type, title, message, category="general", related_id=None, link_to=None, priority="normal", metadata=None):
    """Create admin notification if handler is set"""
    if _create_admin_notification:
        try:
            await _create_admin_notification(
                notification_type=notification_type,
                title=title,
                message=message,
                category=category,
                related_id=related_id,
                link_to=link_to,
                priority=priority,
                metadata=metadata
            )
        except Exception as e:
            logger.error(f"Failed to create admin notification: {e}")


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
    
    # Create admin notification for new member
    await notify_admin(
        notification_type="member",
        title=f"👋 New Member Registered",
        message=f"{user.name or 'Someone'} ({user.email}) just signed up!",
        category="general",
        related_id=user_doc["id"],
        link_to="/admin?tab=members",
        priority="normal",
        metadata={
            "name": user.name,
            "email": user.email,
            "phone": user.phone
        }
    )
    
    # Send welcome WhatsApp + email in background
    try:
        import asyncio
        from services.whatsapp_service import send_welcome_member
        from services.email_service import send_welcome_email
        asyncio.get_event_loop().create_task(send_welcome_member(user_doc))
        asyncio.get_event_loop().create_task(send_welcome_email(user_doc))
    except Exception as _we:
        logger.warning(f"[AUTH] Welcome notification failed: {_we}")

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
    
    # Record login as a streak action
    try:
        from engagement_engine import record_streak_action
        await record_streak_action(db_user["id"], "login")
    except Exception as e:
        logger.warning(f"Failed to record streak action: {e}")
    
    # Get membership access info
    access = await check_mira_access(user.email)
    
    # Get user's actual role (default to "user" if not set)
    user_role = db_user.get("role", "user")
    
    # Create JWT with actual user role
    access_token = create_access_token(data={"sub": user.email, "role": user_role})
    
    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "email": db_user["email"],
            "name": db_user.get("name") or db_user.get("full_name") or db_user["email"].split('@')[0],
            "phone": db_user.get("phone") or db_user.get("mobile"),
            "role": user_role,
            "is_admin": db_user.get("is_admin", False),
            "membership_tier": db_user.get("membership_tier", "free"),
            "membership_status": db_user.get("membership_status"),
            "pet_pass_status": db_user.get("pet_pass_status"),
            "membership_expires": db_user.get("membership_expires"),
            "loyalty_points": db_user.get("loyalty_points", 0)
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


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None


@auth_router.patch("/profile")
async def update_user_profile(
    update_data: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update current user's profile - allows updating name, phone, address, etc."""
    update_fields = {}
    
    if update_data.name:
        update_fields["name"] = update_data.name
    if update_data.phone:
        update_fields["phone"] = update_data.phone
    if update_data.whatsapp:
        update_fields["whatsapp"] = update_data.whatsapp
    if update_data.address:
        update_fields["address"] = update_data.address
    if update_data.city:
        update_fields["city"] = update_data.city
    if update_data.pincode:
        update_fields["pincode"] = update_data.pincode
    
    if not update_fields:
        return {"message": "No fields to update"}
    
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update user record
    result = await db.users.update_one(
        {"email": current_user["email"]},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Fetch updated user
    updated_user = await db.users.find_one({"email": current_user["email"]}, {"_id": 0, "password_hash": 0})
    
    logger.info(f"Profile updated for {current_user['email']}: {list(update_fields.keys())}")
    return {"user": updated_user, "message": "Profile updated successfully"}


# ==================== PASSWORD RESET FOR MEMBERS ====================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@auth_router.post("/forgot-password")
async def member_forgot_password(request: ForgotPasswordRequest):
    """
    Request password reset for a member.
    Sends email with reset link.
    """
    email = request.email.lower().strip()
    
    # Check if user exists
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        # Don't reveal if email exists - return success anyway
        return {"message": "If this email is registered, you will receive a password reset link."}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    
    # Store reset token
    await db.member_password_resets.delete_many({"email": email})  # Remove old tokens
    await db.member_password_resets.insert_one({
        "email": email,
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "used": False
    })
    
    # Send email
    try:
        import resend
        resend_key = os.environ.get("RESEND_API_KEY")
        if resend_key:
            resend.api_key = resend_key
            
            frontend_url = os.environ.get("FRONTEND_URL", "https://thedoggycompany.com")
            reset_link = f"{frontend_url}/reset-password?token={reset_token}"
            
            user_name = user.get("name", "Pet Parent")
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f9fafb; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: white; }}
                    .header {{ background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); color: white; padding: 30px; text-align: center; }}
                    .content {{ padding: 30px; }}
                    .cta-button {{ display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                    .footer {{ background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">🔐 Password Reset</h1>
                    </div>
                    <div class="content">
                        <h2>Hi {user_name},</h2>
                        
                        <p>We received a request to reset your password for your Pet Pass account.</p>
                        
                        <p>Click the button below to set a new password:</p>
                        
                        <a href="{reset_link}" class="cta-button">Reset Password</a>
                        
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                            This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.
                        </p>
                        
                        <p style="color: #6b7280; font-size: 12px;">
                            Or copy this link: <br/>{reset_link}
                        </p>
                    </div>
                    <div class="footer">
                        <p>🐾 The Doggy Company</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            resend.Emails.send({
                "from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"),
                "to": email,
                "subject": f"Reset your Pet Pass password",
                "html": html_content
            })
            
            logger.info(f"Password reset email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        # Still return success to not reveal email existence
    
    return {"message": "If this email is registered, you will receive a password reset link."}


@auth_router.post("/reset-password")
async def member_reset_password(request: ResetPasswordRequest):
    """
    Reset member password using token from email.
    """
    # Find valid reset token
    reset_record = await db.member_password_resets.find_one({
        "token": request.token,
        "used": False
    }, {"_id": 0})
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    
    # Check expiry
    expires_at = datetime.fromisoformat(reset_record["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")
    
    email = reset_record["email"]
    
    # Validate password
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Hash new password
    password_hash = pwd_context.hash(request.new_password)
    
    # Update user password
    result = await db.users.update_one(
        {"email": email},
        {"$set": {
            "password_hash": password_hash,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mark token as used
    await db.member_password_resets.update_one(
        {"token": request.token},
        {"$set": {"used": True}}
    )
    
    logger.info(f"Password reset successful for {email}")
    
    return {"message": "Password reset successful! You can now log in with your new password."}



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


class LogoutRequest(BaseModel):
    session_token: Optional[str] = None

@auth_router.post("/logout")
async def logout_user(request: LogoutRequest = None):
    """Logout user by invalidating session"""
    if request and request.session_token:
        await db.user_sessions.delete_one({"session_token": request.session_token})
    return {"message": "Logged out successfully"}


# ============ USER PETS ENDPOINT ============

@auth_router.get("/pets")
async def get_user_pets(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)):
    """
    Get all pets belonging to the authenticated user.
    Returns pet data with soul scores and photos.
    """
    from jose import jwt, JWTError
    
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = credentials.credentials
    
    try:
        # Decode token to get user email
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Find user's pets by matching owner_email or user_id
        # Also check membership-linked pets
        user = await db.users.find_one({"email": email})
        user_id = user.get("id") if user else None
        
        pets_cursor = db.pets.find({
            "$or": [
                {"owner_email": email},
                {"parent_email": email},
                {"member_email": email},
                {"user_id": user_id} if user_id else {"_never_match": True}
            ]
        })
        
        pets = []
        async for pet in pets_cursor:
            # Convert ObjectId to string
            pet_id = str(pet.get("_id", ""))
            
            pets.append({
                "id": pet.get("id") or pet_id,
                "name": pet.get("name", ""),
                "breed": pet.get("breed", ""),
                "species": pet.get("species", "dog"),
                "age_years": pet.get("age_years"),
                "gender": pet.get("gender"),
                "photo_url": pet.get("photo_url"),
                "overall_score": pet.get("overall_score", 0),
                "soul": pet.get("soul") or {},
                "doggy_soul_answers": pet.get("doggy_soul_answers") or {},
                "preferences": pet.get("preferences") or {},
                "health_vault": pet.get("health_vault") or {},
                "traits": pet.get("traits", [])
            })
        
        return {"pets": pets, "count": len(pets)}
        
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Get user pets error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ MEMBERSHIP ONBOARDING ============

class SoulSnapshot(BaseModel):
    """Soul Snapshot data from quick onboarding"""
    allergies: Optional[list] = []
    health_conditions: Optional[list] = []
    food_preference: Optional[dict] = None
    car_rides: Optional[str] = None
    activity_level: Optional[str] = None

class PetOnboard(BaseModel):
    name: str
    breed: str
    gender: Optional[str] = None
    birth_date: Optional[str] = None
    gotcha_date: Optional[str] = None
    weight: Optional[float] = None
    weight_unit: Optional[str] = "kg"
    is_neutered: Optional[bool] = None
    species: str = "dog"
    photo: Optional[str] = None  # Base64 photo from onboarding
    avatar: Optional[dict] = None  # Avatar selection from onboarding
    birthday_type: Optional[str] = None  # 'exact', 'gotcha', or 'approximate'
    approximate_age: Optional[str] = None  # e.g., '~3 years'
    soul_snapshot: Optional[SoulSnapshot] = None  # NEW: Quick soul answers from onboarding

class ParentOnboard(BaseModel):
    name: str
    email: EmailStr
    phone: str
    whatsapp: Optional[str] = None
    address: Optional[str] = None
    city: str
    pincode: Optional[str] = None
    password: str

class MembershipOnboardRequest(BaseModel):
    parent: ParentOnboard
    pets: list[PetOnboard]
    plan_type: str = "annual"
    pet_count: int = 1

@auth_router.post("/membership/onboard")
async def membership_onboard(data: MembershipOnboardRequest):
    """
    Onboard a new member with pet parent details and pet profiles.
    Creates user account, pet profiles, and prepares for payment.
    """
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
            # Generate unique Pet Pass Number - the pet's membership ID
            pet_pass_number = await generate_pet_pass_number()
            
            # Pre-populate doggy_soul_answers from onboarding data
            # This ensures the Pet Soul starts with the answers collected during onboarding
            initial_soul_answers = {}
            
            # Map onboarding fields to soul answer keys
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
            
            # NEW: Map soul_snapshot from streamlined onboarding to doggy_soul_answers
            # These 5 quick questions contribute to the base Soul Score (~30%)
            if pet_data.soul_snapshot:
                snapshot = pet_data.soul_snapshot
                
                # Allergies (weight: 10 points in pet_score_logic.py)
                if snapshot.allergies:
                    initial_soul_answers["food_allergies"] = snapshot.allergies if snapshot.allergies else ["None known"]
                else:
                    initial_soul_answers["food_allergies"] = ["None known"]
                
                # Health conditions (weight: 8 points)
                if snapshot.health_conditions:
                    initial_soul_answers["health_conditions"] = snapshot.health_conditions if snapshot.health_conditions else ["None known"]
                else:
                    initial_soul_answers["health_conditions"] = ["None known"]
                
                # Food preference (contributes to personality understanding)
                if snapshot.food_preference:
                    if snapshot.food_preference.get("protein"):
                        initial_soul_answers["favorite_protein"] = snapshot.food_preference["protein"]
                    if snapshot.food_preference.get("eating_style"):
                        initial_soul_answers["eating_style"] = snapshot.food_preference["eating_style"]
                
                # Car rides (weight: travel preferences)
                if snapshot.car_rides:
                    car_ride_map = {
                        "anxious": "Anxious - needs extra comfort",
                        "okay": "Tolerates car rides", 
                        "loves": "Loves car rides!"
                    }
                    initial_soul_answers["car_comfort"] = car_ride_map.get(snapshot.car_rides, snapshot.car_rides)
                
                # Activity level (weight: 5 points for lifestyle)
                if snapshot.activity_level:
                    activity_map = {
                        "low": "Calm and relaxed",
                        "moderate": "Moderate energy",
                        "high": "High energy"
                    }
                    initial_soul_answers["energy_level"] = activity_map.get(snapshot.activity_level, snapshot.activity_level)
            
            # Handle approximate age from new onboarding
            if pet_data.approximate_age:
                initial_soul_answers["approximate_age"] = pet_data.approximate_age
            
            pet_doc = {
                "id": pet_id,
                "pet_pass_number": pet_pass_number,  # Pet's membership number
                "name": pet_data.name,
                "breed": pet_data.breed,
                "species": pet_data.species,
                "gender": pet_data.gender,
                "date_of_birth": pet_data.birth_date,
                "dob": pet_data.birth_date,  # Also store as dob for consistency
                "gotcha_day": pet_data.gotcha_date,
                "weight": pet_data.weight,
                "weight_unit": pet_data.weight_unit,
                "is_neutered": pet_data.is_neutered,
                "owner_email": data.parent.email,
                "owner_name": data.parent.name,
                "owner_id": user_id,
                "city": data.parent.city,  # Pet inherits owner's city
                "pincode": data.parent.pincode,  # Pet inherits owner's pincode
                "photo": pet_data.photo,  # Base64 photo from onboarding
                "avatar": pet_data.avatar,  # Avatar selection {breed, emoji, color}
                "birthday_type": pet_data.birthday_type,  # exact/gotcha/approximate
                "approximate_age": pet_data.approximate_age,
                "identity": {
                    "name": pet_data.name,
                    "breed": pet_data.breed,
                    "gender": pet_data.gender,
                    "weight": pet_data.weight,
                    "weight_unit": pet_data.weight_unit
                },
                "doggy_soul_answers": initial_soul_answers,  # Pre-populated from onboarding!
                "soul_enrichments": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.pets.insert_one(pet_doc)
            pet_ids.append(pet_id)
            logger.info(f"Created pet profile: {pet_data.name} ({pet_id}) with Pet Pass: {pet_pass_number} and {len(initial_soul_answers)} pre-filled soul answers")
        
        # Create user account (pending membership until payment)
        user_doc = {
            "id": user_id,
            "email": data.parent.email,
            "password_hash": get_password_hash_secure(data.parent.password),
            "name": data.parent.name,
            "phone": data.parent.phone,
            "whatsapp": data.parent.whatsapp or data.parent.phone,
            "address": data.parent.address,
            "city": data.parent.city,
            "pincode": data.parent.pincode,
            "pet_ids": pet_ids,
            "membership_tier": "pending",  # Will be upgraded after payment
            "membership_type": data.plan_type,
            "membership_expires": None,
            "chat_count_today": 0,
            "last_chat_date": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(user_doc)
        logger.info(f"Created user account: {data.parent.email} ({user_id})")
        
        # Calculate pricing
        base_price = 999 if data.plan_type == "annual" else 99
        additional_pet_price = 499 if data.plan_type == "annual" else 49
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
        
        # Generate access token for immediate login
        access_token = create_access_token(data={"sub": data.parent.email})
        
        # Admin notification
        await notify_admin(
            notification_type="member",
            title=f"🐾 New Membership Signup Started",
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
            "access_token": access_token,
            "user": {
                "id": user_id,
                "email": data.parent.email,
                "name": data.parent.name,
                "phone": data.parent.phone,
                "city": data.parent.city,
                "pet_ids": pet_ids,
                "membership_tier": "pending"
            },
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

