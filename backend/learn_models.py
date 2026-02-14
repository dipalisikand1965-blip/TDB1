"""
LEARN OS Layer - Data Models
============================
High-trust curated library of tiny guides + wrapped YouTube videos.

Trust Gating Fields (Non-negotiable):
- last_reviewed_at: When content was last reviewed
- reviewed_by: Who reviewed it
- risk_level: low/medium/high
- escalation_required: Whether item needs vet/professional escalation
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    """Risk level for content - affects escalation messaging."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ContentType(str, Enum):
    """Learn content types."""
    GUIDE = "guide"
    VIDEO = "video"
    TEMPLATE = "template"


class LearnTopic(str, Enum):
    """Standard Learn topics (6-10 max per spec)."""
    GROOMING = "grooming"
    HEALTH = "health"
    FOOD = "food"
    BEHAVIOUR = "behaviour"
    TRAVEL = "travel"
    BOARDING = "boarding"
    PUPPIES = "puppies"
    SENIOR = "senior"
    SEASONAL = "seasonal"


# ============================================
# SERVICE CTA MODEL
# ============================================

class ServiceCTA(BaseModel):
    """Service ticket creation CTA attached to Learn items."""
    label: str = Field(..., description="Button label e.g. 'Book grooming'")
    service_type: str = Field(..., description="Service type for ticket creation")
    prefill: Optional[Dict[str, Any]] = Field(default=None, description="Prefill data for ServiceRequestBuilder")


# ============================================
# TINY GUIDE MODEL
# ============================================

class TinyGuideCreate(BaseModel):
    """Create a new Tiny Guide (30-120 sec read time)."""
    title: str = Field(..., min_length=3, max_length=100)
    topic: LearnTopic
    summary: str = Field(..., min_length=10, max_length=200, description="1-2 line what this solves")
    reading_time_sec: int = Field(default=90, ge=30, le=180)
    
    # Content sections
    steps: List[str] = Field(..., min_length=3, max_length=7, description="Do this now checklist")
    watch_for: List[str] = Field(default=[], description="Signals that matter")
    when_to_escalate: List[str] = Field(default=[], description="Clear escalation thresholds")
    
    # Tagging (for personalization)
    pet_tags: List[str] = Field(default=[], description="puppy/senior/anxious/allergies/etc.")
    breed_tags: List[str] = Field(default=[], description="brachy/double_coat/toy/giant/etc.")
    
    # CTAs
    service_cta: List[ServiceCTA] = Field(default=[], description="Service ticket CTAs")
    video_id: Optional[str] = Field(default=None, description="Optional attached video reference")
    
    # Trust gating (non-negotiable)
    risk_level: RiskLevel = Field(default=RiskLevel.LOW)
    escalation_required: bool = Field(default=False, description="Must show escalation messaging")
    reviewed_by: Optional[str] = Field(default=None)
    last_reviewed_at: Optional[datetime] = Field(default=None)
    
    # Status
    is_active: bool = Field(default=False, description="Must be reviewed before activation")
    is_featured: bool = Field(default=False, description="Show in Start Here shelf")
    sort_rank: int = Field(default=100)


class TinyGuide(TinyGuideCreate):
    """Full Tiny Guide with DB fields."""
    id: str
    created_at: datetime
    updated_at: datetime
    view_count: int = 0
    save_count: int = 0
    completion_count: int = 0


# ============================================
# VIDEO MODEL (Curated YouTube)
# ============================================

class VideoCreate(BaseModel):
    """Create a curated YouTube video with Mira framing."""
    title: str = Field(..., min_length=3, max_length=100)
    youtube_id: str = Field(..., description="YouTube video ID (11 chars)")
    topic: LearnTopic
    duration_sec: int = Field(default=180, description="Video duration in seconds")
    
    # Mira Frame - Before video
    bullets_before: List[str] = Field(..., min_length=2, max_length=4, description="What you'll learn")
    safety_note: Optional[str] = Field(default=None, description="One safety note if relevant")
    
    # Mira Frame - After video
    after_checklist: List[str] = Field(default=[], description="Do this today checklist")
    escalation: List[str] = Field(default=[], description="If you see X, do Y")
    
    # CTAs
    cta: List[ServiceCTA] = Field(default=[], description="Let Mira handle this CTAs")
    
    # Tagging
    pet_tags: List[str] = Field(default=[])
    breed_tags: List[str] = Field(default=[])
    
    # Trust gating
    risk_level: RiskLevel = Field(default=RiskLevel.LOW)
    escalation_required: bool = Field(default=False)
    reviewed_by: Optional[str] = Field(default=None)
    last_reviewed_at: Optional[datetime] = Field(default=None)
    
    # Status
    is_active: bool = Field(default=False)
    is_featured: bool = Field(default=False)
    sort_rank: int = Field(default=100)
    
    # Source metadata
    channel_name: Optional[str] = Field(default=None)
    channel_trust_level: Optional[str] = Field(default=None, description="vet/trainer/org/influencer")


class Video(VideoCreate):
    """Full Video with DB fields."""
    id: str
    created_at: datetime
    updated_at: datetime
    view_count: int = 0
    save_count: int = 0
    completion_count: int = 0  # Watched >= 50%


# ============================================
# SAVED LEARN MODEL
# ============================================

class SavedLearnItem(BaseModel):
    """User's saved Learn item."""
    user_id: str
    item_id: str
    item_type: ContentType  # guide or video
    saved_at: datetime
    
    # Denormalized for quick display
    title: str
    topic: str
    reading_time_sec: Optional[int] = None
    duration_sec: Optional[int] = None


class SaveLearnRequest(BaseModel):
    """Request to save/unsave a Learn item."""
    item_id: str
    item_type: ContentType
    action: str = Field(default="save", description="save or unsave")


# ============================================
# LEARN COMPLETION MODEL
# ============================================

class LearnCompletion(BaseModel):
    """Track user completion of Learn items."""
    user_id: str
    item_id: str
    item_type: ContentType
    completed_at: datetime
    pet_id: Optional[str] = None  # Which pet this was for
    
    # For videos
    watch_percent: Optional[int] = None
    
    # Feedback
    was_helpful: Optional[bool] = None


# ============================================
# TOPIC CONFIG
# ============================================

TOPIC_CONFIG = {
    LearnTopic.GROOMING: {
        "label": "Grooming",
        "icon": "scissors",
        "color": "purple",
        "description": "Coat care, bathing, nail trims"
    },
    LearnTopic.HEALTH: {
        "label": "Health",
        "icon": "heart-pulse",
        "color": "rose",
        "description": "Vaccinations, checkups, first aid"
    },
    LearnTopic.FOOD: {
        "label": "Food",
        "icon": "utensils",
        "color": "amber",
        "description": "Nutrition, feeding, treats"
    },
    LearnTopic.BEHAVIOUR: {
        "label": "Behaviour",
        "icon": "brain",
        "color": "blue",
        "description": "Training, anxiety, socialization"
    },
    LearnTopic.TRAVEL: {
        "label": "Travel",
        "icon": "plane",
        "color": "cyan",
        "description": "Car rides, flights, pet-friendly stays"
    },
    LearnTopic.BOARDING: {
        "label": "Boarding",
        "icon": "home",
        "color": "emerald",
        "description": "Kennels, pet sitters, daycare"
    },
    LearnTopic.PUPPIES: {
        "label": "Puppies",
        "icon": "baby",
        "color": "pink",
        "description": "First year, teething, housetraining"
    },
    LearnTopic.SENIOR: {
        "label": "Senior",
        "icon": "clock",
        "color": "slate",
        "description": "Aging care, mobility, comfort"
    },
    LearnTopic.SEASONAL: {
        "label": "Seasonal",
        "icon": "sun",
        "color": "orange",
        "description": "Summer heat, monsoon, festivals"
    },
}
