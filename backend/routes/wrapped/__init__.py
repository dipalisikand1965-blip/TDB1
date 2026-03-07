"""
Pet Wrapped - Routes Package
Combines all Pet Wrapped functionality
"""
from fastapi import APIRouter

# Import sub-routers
from .soul_history import router as soul_history_router
from .generate import router as generate_router
from .ai_memory import router as ai_memory_router
from .share import router as share_router
from .welcome import router as welcome_router

# Create combined router
router = APIRouter()

# Include all sub-routers (they already have /api/wrapped prefix)
# We'll register them directly in server.py instead

__all__ = [
    "soul_history_router",
    "generate_router", 
    "ai_memory_router",
    "share_router",
    "welcome_router"
]
