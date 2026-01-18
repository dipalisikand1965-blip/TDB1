"""
Role & Permission Management for Service Desk
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter(prefix="/api/roles", tags=["Roles"])

# Database reference (set from server.py)
db = None

def set_database(database):
    global db
    db = database

# Default roles with permissions
DEFAULT_ROLES = [
    {
        "id": "super_admin",
        "name": "Super Admin",
        "description": "Full system access - can manage everything",
        "level": 100,
        "permissions": {
            "tickets": ["view", "create", "edit", "delete", "assign", "escalate", "bulk_actions"],
            "users": ["view", "create", "edit", "delete", "assign_roles"],
            "roles": ["view", "create", "edit", "delete"],
            "settings": ["view", "edit"],
            "reports": ["view", "export"],
            "integrations": ["view", "manage"],
            "all_pillars": True
        },
        "is_system": True
    },
    {
        "id": "manager",
        "name": "Manager",
        "description": "Team manager - can manage agents and escalations",
        "level": 75,
        "permissions": {
            "tickets": ["view", "create", "edit", "assign", "escalate", "bulk_actions"],
            "users": ["view", "assign_roles"],
            "roles": ["view"],
            "settings": ["view"],
            "reports": ["view", "export"],
            "integrations": ["view"],
            "all_pillars": True
        },
        "is_system": True
    },
    {
        "id": "senior_agent",
        "name": "Senior Agent",
        "description": "Experienced agent - can handle escalations",
        "level": 50,
        "permissions": {
            "tickets": ["view", "create", "edit", "assign", "escalate"],
            "users": ["view"],
            "roles": [],
            "settings": ["view"],
            "reports": ["view"],
            "integrations": [],
            "all_pillars": True
        },
        "is_system": True
    },
    {
        "id": "agent",
        "name": "Agent",
        "description": "Standard agent - handles tickets",
        "level": 25,
        "permissions": {
            "tickets": ["view", "create", "edit"],
            "users": [],
            "roles": [],
            "settings": [],
            "reports": [],
            "integrations": [],
            "all_pillars": False,
            "allowed_pillars": ["celebrate", "dine", "stay"]
        },
        "is_system": True
    },
    {
        "id": "viewer",
        "name": "Viewer",
        "description": "Read-only access",
        "level": 10,
        "permissions": {
            "tickets": ["view"],
            "users": [],
            "roles": [],
            "settings": [],
            "reports": ["view"],
            "integrations": [],
            "all_pillars": True
        },
        "is_system": True
    }
]

# Pydantic models
class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    level: int = 25
    permissions: Dict = {}

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    level: Optional[int] = None
    permissions: Optional[Dict] = None

class UserRoleAssign(BaseModel):
    user_id: str
    role_id: str

# Seed default roles
@router.post("/seed-defaults")
async def seed_default_roles():
    """Seed the default system roles"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    seeded = 0
    for role in DEFAULT_ROLES:
        existing = await db.roles.find_one({"id": role["id"]})
        if not existing:
            role["created_at"] = datetime.now(timezone.utc).isoformat()
            role["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.roles.insert_one(role)
            seeded += 1
    
    return {"message": f"Seeded {seeded} default roles", "total": len(DEFAULT_ROLES)}

# Get all roles
@router.get("")
async def get_roles():
    """Get all roles"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    roles = await db.roles.find({}, {"_id": 0}).sort("level", -1).to_list(100)
    
    # If no roles, seed defaults
    if not roles:
        await seed_default_roles()
        roles = await db.roles.find({}, {"_id": 0}).sort("level", -1).to_list(100)
    
    return {"roles": roles}

# Get single role
@router.get("/{role_id}")
async def get_role(role_id: str):
    """Get a specific role"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    role = await db.roles.find_one({"id": role_id}, {"_id": 0})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return role

# Create custom role
@router.post("")
async def create_role(role: RoleCreate):
    """Create a new custom role"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Generate ID from name
    role_id = role.name.lower().replace(" ", "_")
    
    # Check if exists
    existing = await db.roles.find_one({"id": role_id})
    if existing:
        raise HTTPException(status_code=400, detail="Role with this name already exists")
    
    role_doc = {
        "id": role_id,
        "name": role.name,
        "description": role.description,
        "level": role.level,
        "permissions": role.permissions,
        "is_system": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.roles.insert_one(role_doc)
    
    return {"message": "Role created", "role_id": role_id}

# Update role
@router.patch("/{role_id}")
async def update_role(role_id: str, role: RoleUpdate):
    """Update an existing role"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    existing = await db.roles.find_one({"id": role_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Can't modify system roles (except permissions)
    if existing.get("is_system") and (role.name or role.level):
        raise HTTPException(status_code=400, detail="Cannot modify system role name or level")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if role.name:
        update_data["name"] = role.name
    if role.description is not None:
        update_data["description"] = role.description
    if role.level is not None:
        update_data["level"] = role.level
    if role.permissions is not None:
        update_data["permissions"] = role.permissions
    
    await db.roles.update_one({"id": role_id}, {"$set": update_data})
    
    return {"message": "Role updated"}

# Delete role
@router.delete("/{role_id}")
async def delete_role(role_id: str):
    """Delete a custom role"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    existing = await db.roles.find_one({"id": role_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if existing.get("is_system"):
        raise HTTPException(status_code=400, detail="Cannot delete system roles")
    
    # Check if any users have this role
    users_with_role = await db.admin_users.count_documents({"role": role_id})
    if users_with_role > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete role - {users_with_role} users have this role")
    
    await db.roles.delete_one({"id": role_id})
    
    return {"message": "Role deleted"}

# Get all agents/users
@router.get("/users/all")
async def get_all_users():
    """Get all admin users with their roles"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    users = await db.admin_users.find(
        {}, 
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    # Get role details for each user
    roles = await db.roles.find({}, {"_id": 0}).to_list(100)
    role_map = {r["id"]: r for r in roles}
    
    for user in users:
        user_role = user.get("role", "agent")
        user["role_details"] = role_map.get(user_role, {"name": user_role, "level": 0})
    
    return {"users": users}

# Assign role to user
@router.post("/users/assign")
async def assign_role_to_user(assignment: UserRoleAssign):
    """Assign a role to a user"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Check role exists
    role = await db.roles.find_one({"id": assignment.role_id})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Update user
    result = await db.admin_users.update_one(
        {"$or": [{"id": assignment.user_id}, {"username": assignment.user_id}, {"email": assignment.user_id}]},
        {"$set": {"role": assignment.role_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"Role '{role['name']}' assigned to user"}

# Create new agent/user
class AgentCreate(BaseModel):
    username: str
    email: str
    name: str
    password: str
    role: str = "agent"

@router.post("/users/create")
async def create_agent(agent: AgentCreate):
    """Create a new agent/user"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    import hashlib
    import secrets
    
    # Check if exists
    existing = await db.admin_users.find_one({
        "$or": [{"username": agent.username}, {"email": agent.email}]
    })
    if existing:
        raise HTTPException(status_code=400, detail="User with this username or email already exists")
    
    # Check role exists
    role = await db.roles.find_one({"id": agent.role})
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Hash password
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((agent.password + salt).encode()).hexdigest()
    
    user_doc = {
        "id": f"agent_{secrets.token_hex(4)}",
        "username": agent.username,
        "email": agent.email,
        "name": agent.name,
        "password_hash": f"{salt}:{password_hash}",
        "role": agent.role,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None
    }
    
    await db.admin_users.insert_one(user_doc)
    
    return {"message": "Agent created", "user_id": user_doc["id"]}

# Check permission helper
async def check_permission(user_role: str, resource: str, action: str) -> bool:
    """Check if a role has permission for an action"""
    if db is None:
        return False
    
    role = await db.roles.find_one({"id": user_role})
    if not role:
        return False
    
    permissions = role.get("permissions", {})
    resource_perms = permissions.get(resource, [])
    
    if isinstance(resource_perms, bool):
        return resource_perms
    
    return action in resource_perms
