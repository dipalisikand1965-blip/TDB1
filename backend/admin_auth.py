"""
Admin Management Module for The Doggy Company
Multi-admin system with email-based password reset
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import secrets
import hashlib
import uuid

router = APIRouter(prefix="/api/admin/auth", tags=["Admin Auth"])

# These will be set by server.py
db = None
send_email = None
ADMIN_USERNAME = None
ADMIN_PASSWORD = None

def set_admin_db(database):
    global db
    db = database

def set_admin_email_func(email_func):
    global send_email
    send_email = email_func

def set_admin_env_credentials(username, password):
    global ADMIN_USERNAME, ADMIN_PASSWORD
    ADMIN_USERNAME = username
    ADMIN_PASSWORD = password


# Models
class AdminUser(BaseModel):
    email: EmailStr
    name: str
    role: str = "admin"  # admin, super_admin
    is_active: bool = True

class AdminCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "admin"

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str


def hash_password(password: str) -> str:
    """Hash password with salt"""
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{hashed.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored hash"""
    try:
        salt, hashed = stored_hash.split(':')
        new_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return new_hash.hex() == hashed
    except:
        return False


@router.post("/login")
async def admin_login(credentials: AdminLogin):
    """Login with email and password"""
    # First check database for admin user
    admin = await db.admin_users.find_one({"email": credentials.email.lower(), "is_active": True})
    
    if admin:
        if verify_password(credentials.password, admin.get("password_hash", "")):
            # Update last login
            await db.admin_users.update_one(
                {"email": credentials.email.lower()},
                {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
            )
            return {
                "success": True,
                "message": "Login successful",
                "admin": {
                    "email": admin["email"],
                    "name": admin["name"],
                    "role": admin.get("role", "admin")
                },
                # Return base64 encoded credentials for Basic auth
                "auth_token": f"{credentials.email}:{credentials.password}"
            }
    
    # Fallback to environment credentials (legacy support)
    if credentials.email.lower() == ADMIN_USERNAME.lower() or credentials.email == ADMIN_USERNAME:
        if credentials.password == ADMIN_PASSWORD:
            return {
                "success": True,
                "message": "Login successful (legacy)",
                "admin": {
                    "email": credentials.email,
                    "name": "Admin",
                    "role": "super_admin"
                },
                "auth_token": f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}"
            }
    
    raise HTTPException(status_code=401, detail="Invalid email or password")


@router.post("/request-reset")
async def request_password_reset(request: PasswordResetRequest, background_tasks: BackgroundTasks):
    """Request password reset - sends email with reset link"""
    email = request.email.lower()
    
    # Check if admin exists
    admin = await db.admin_users.find_one({"email": email})
    if not admin:
        # Don't reveal if email exists
        return {"success": True, "message": "If an account exists, a reset email has been sent"}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token
    await db.password_resets.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "token": reset_token,
                "expires_at": expires_at.isoformat(),
                "used": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    # Send reset email
    if send_email:
        reset_url = f"https://thedoggycompany.in/admin/reset-password?token={reset_token}"
        
        email_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">🐕 The Doggy Company</h1>
            </div>
            <div style="padding: 30px; background: #fff;">
                <h2>Password Reset Request</h2>
                <p>Hi {admin.get('name', 'Admin')},</p>
                <p>We received a request to reset your password. Click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                The Doggy Company | woof@thedoggycompany.in
            </div>
        </div>
        """
        
        try:
            await send_email(
                to_email=email,
                subject="Password Reset - The Doggy Company Admin",
                html_content=email_html
            )
        except Exception as e:
            print(f"Error sending reset email: {e}")
    
    return {"success": True, "message": "If an account exists, a reset email has been sent"}


@router.post("/reset-password")
async def reset_password(request: PasswordResetConfirm):
    """Reset password using token"""
    # Find valid reset token
    reset_record = await db.password_resets.find_one({
        "token": request.token,
        "used": False
    })
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check expiry
    expires_at = datetime.fromisoformat(reset_record["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update password
    password_hash = hash_password(request.new_password)
    await db.admin_users.update_one(
        {"email": reset_record["email"]},
        {"$set": {"password_hash": password_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"token": request.token},
        {"$set": {"used": True}}
    )
    
    return {"success": True, "message": "Password has been reset successfully"}


@router.get("/admins")
async def list_admins():
    """List all admin users (requires super_admin)"""
    admins = await db.admin_users.find({}, {"password_hash": 0}).to_list(100)
    return [
        {
            "id": str(a.get("_id", "")),
            "email": a.get("email"),
            "name": a.get("name"),
            "role": a.get("role", "admin"),
            "is_active": a.get("is_active", True),
            "last_login": a.get("last_login"),
            "created_at": a.get("created_at")
        }
        for a in admins
    ]


@router.post("/admins")
async def create_admin(admin: AdminCreate, background_tasks: BackgroundTasks):
    """Create new admin user"""
    email = admin.email.lower()
    
    # Check if already exists
    existing = await db.admin_users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Admin with this email already exists")
    
    # Create admin
    password_hash = hash_password(admin.password)
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": admin.name,
        "role": admin.role,
        "password_hash": password_hash,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.admin_users.insert_one(admin_doc)
    
    # Send welcome email
    if send_email:
        email_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">🐕 The Doggy Company</h1>
            </div>
            <div style="padding: 30px; background: #fff;">
                <h2>Welcome to the Admin Team!</h2>
                <p>Hi {admin.name},</p>
                <p>You've been added as an admin for The Doggy Company platform.</p>
                <p><strong>Your login details:</strong></p>
                <ul>
                    <li>Email: {email}</li>
                    <li>Password: (as provided by your administrator)</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://thedoggycompany.in/admin" style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Go to Admin Panel
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">Please change your password after first login.</p>
            </div>
        </div>
        """
        
        try:
            await send_email(
                to_email=email,
                subject="Welcome to The Doggy Company Admin",
                html_content=email_html
            )
        except Exception as e:
            print(f"Error sending welcome email: {e}")
    
    return {
        "success": True,
        "message": "Admin created successfully",
        "admin": {
            "id": admin_doc["id"],
            "email": email,
            "name": admin.name,
            "role": admin.role
        }
    }


@router.delete("/admins/{email}")
async def delete_admin(email: str):
    """Deactivate admin user"""
    result = await db.admin_users.update_one(
        {"email": email.lower()},
        {"$set": {"is_active": False, "deactivated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return {"success": True, "message": "Admin deactivated"}


@router.post("/seed-admin")
async def seed_initial_admin():
    """Seed initial admin user - dipali@clubconcierge.in"""
    email = "dipali@clubconcierge.in"
    
    # Check if already exists
    existing = await db.admin_users.find_one({"email": email})
    if existing:
        return {"success": True, "message": "Admin already exists", "email": email}
    
    # Create with default password (should be changed)
    default_password = "DoggyAdmin2026!"
    password_hash = hash_password(default_password)
    
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": "Dipali",
        "role": "super_admin",
        "password_hash": password_hash,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.admin_users.insert_one(admin_doc)
    
    return {
        "success": True,
        "message": "Initial admin created",
        "email": email,
        "default_password": default_password,
        "note": "Please change this password immediately!"
    }
