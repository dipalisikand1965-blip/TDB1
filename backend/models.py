"""
Pydantic Models for The Doggy Company API
Extracted from server.py for better organization
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
import uuid


# ==================== ADMIN MODELS ====================

class AdminCredentialReset(BaseModel):
    """Model for resetting admin credentials"""
    reset_token: str
    new_username: str
    new_password: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str


# ==================== STATUS & HEALTH MODELS ====================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


# ==================== CHAT & MIRA AI MODELS ====================

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    session_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    user_email: Optional[str] = None
    auth_token: Optional[str] = None
    current_page: Optional[str] = None
    source: Optional[str] = None


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
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notification_sent: bool = False


# ==================== PRODUCT MODELS ====================

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    sizes: Optional[List[dict]] = None
    flavors: Optional[List[dict]] = None
    category: Optional[str] = None
    available: Optional[bool] = None
    tags: Optional[List[str]] = None
    collection_ids: Optional[List[str]] = None
    autoship_enabled: Optional[bool] = None


class ProductFulfilmentUpdate(BaseModel):
    """Update product fulfillment settings"""
    fulfilment_type: str
    regions: Optional[List[str]] = None


# ==================== REVIEW MODELS ====================

class Review(BaseModel):
    id: str = Field(default_factory=lambda: f"rev-{uuid.uuid4().hex[:8]}")
    product_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    author_name: str
    rating: int
    title: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str
    reviewer_name: Optional[str] = None
    reviewer_email: Optional[str] = None
    title: Optional[str] = None
    image_url: Optional[str] = None


# ==================== AUTOSHIP MODELS ====================

class AutoshipSubscription(BaseModel):
    id: str = Field(default_factory=lambda: f"auto-{uuid.uuid4().hex[:8]}")
    user_email: str
    user_id: Optional[str] = None
    product_id: str
    product_name: str
    product_image: Optional[str] = None
    variant: Optional[str] = None
    price: float
    frequency: int
    status: str = "active"
    order_count: int = 0
    next_shipment_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None
    delivery_address: Optional[dict] = None


class AutoshipCreate(BaseModel):
    product_id: str
    variant: Optional[str] = None
    frequency: int = 4
    delivery_address: Optional[dict] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ==================== COLLECTION MODELS ====================

class Collection(BaseModel):
    id: str = Field(default_factory=lambda: f"col-{uuid.uuid4().hex[:8]}")
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    handle: str
    product_ids: List[str] = []
    show_in_menu: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    product_ids: Optional[List[str]] = []
    show_in_menu: Optional[bool] = False


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    product_ids: Optional[List[str]] = None
    show_in_menu: Optional[bool] = None


# ==================== SETTINGS MODELS ====================

class ShippingThreshold(BaseModel):
    """Shipping threshold configuration"""
    min_cart_value: float = 0
    max_cart_value: float = 3000
    shipping_fee: float = 150


class AppSettings(BaseModel):
    """Application-wide settings stored in app_settings collection"""
    id: str = "global_settings"
    pickup_cities: List[str] = ["Mumbai", "Gurugram", "Bangalore"]
    pan_india_shipping: bool = True
    default_fulfilment_type: str = "shipping"
    bakery_pickup_only_categories: List[str] = ["cakes", "fresh_treats", "celebration"]
    shipping_thresholds: List[dict] = [
        {"min_cart_value": 0, "max_cart_value": 3000, "shipping_fee": 150},
        {"min_cart_value": 3000, "max_cart_value": 999999, "shipping_fee": 0}
    ]
    free_shipping_threshold: float = 3000
    default_shipping_fee: float = 150
    abandoned_cart_enabled: bool = True
    abandoned_cart_reminders: List[dict] = [
        {"reminder_num": 1, "delay_hours": 1, "subject": "🛒 You left something behind!", "include_discount": False},
        {"reminder_num": 2, "delay_hours": 24, "subject": "🐾 Your pup is still waiting!", "include_discount": False},
        {"reminder_num": 3, "delay_hours": 72, "subject": "🎁 Final reminder + 10% OFF!", "include_discount": True, "discount_code": "COMEBACK10", "discount_percent": 10}
    ]
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class UpdateAppSettings(BaseModel):
    pickup_cities: Optional[List[str]] = None
    pan_india_shipping: Optional[bool] = None
    default_fulfilment_type: Optional[str] = None
    bakery_pickup_only_categories: Optional[List[str]] = None
    shipping_thresholds: Optional[List[dict]] = None
    free_shipping_threshold: Optional[float] = None
    default_shipping_fee: Optional[float] = None
    abandoned_cart_enabled: Optional[bool] = None
    abandoned_cart_reminders: Optional[List[dict]] = None


# ==================== MEMBERSHIP MODELS ====================

class MembershipUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    name: Optional[str] = None
    phone: Optional[str] = None
    membership_tier: str = "free"
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
    tier: str


# ==================== PET PROFILE MODELS ====================

class PetSoul(BaseModel):
    """The soul/personality of the pet"""
    persona: str = Field(description="Dog persona type: royal, shadow, adventurer, etc.")
    special_move: Optional[str] = Field(default=None, description="Their unique quirky behavior")
    human_job: Optional[str] = Field(default=None, description="If they had a human job")
    security_blanket: Optional[str] = Field(default=None, description="Their must-have item")
    love_language: Optional[str] = Field(default=None, description="How they show love")
    personality_tag: Optional[str] = Field(default=None, description="e.g., 'The Grumpy Professor'")


class PetCelebration(BaseModel):
    """A celebration date for the pet"""
    occasion: str = Field(description="Occasion key from CELEBRATION_OCCASIONS")
    date: str = Field(description="Date in YYYY-MM-DD format or MM-DD for recurring")
    is_recurring: bool = Field(default=True, description="Repeats yearly")
    custom_name: Optional[str] = Field(default=None, description="Custom name for occasion")
    notes: Optional[str] = Field(default=None, description="Special notes for this celebration")


class PetPreferences(BaseModel):
    """Food and treat preferences"""
    favorite_flavors: List[str] = Field(default_factory=list)
    allergies: Any = Field(default_factory=list)
    texture_preference: Optional[str] = Field(default=None, description="crunchy, chewy, soft")
    treat_size: Optional[str] = Field(default=None, description="small, medium, large")
    activity_level: Optional[str] = Field(default=None, description="couch_potato, moderate, active, athlete")
    flavor_profile: Optional[str] = Field(default=None, description="farmhouse, ocean, garden, adventurous")
    treat_texture: Optional[str] = Field(default=None, description="crunchy, chewy, frozen, any")
    goals: Optional[str] = Field(default=None, description="Health/lifestyle goals")

class PetHealthInfo(BaseModel):
    """Pet health information"""
    vet_name: Optional[str] = Field(default=None, description="Primary veterinarian name")
    vet_clinic: Optional[str] = Field(default=None, description="Clinic name")
    vet_phone: Optional[str] = Field(default=None, description="Vet contact number")
    medical_conditions: Optional[str] = Field(default=None, description="Chronic conditions, surgeries, etc.")
    current_medications: Optional[str] = Field(default=None, description="Current medications with dosage")
    dietary_restrictions: Optional[str] = Field(default=None, description="Special diet requirements")
    spayed_neutered: Optional[str] = Field(default=None, description="yes, no, not_sure")
    microchipped: bool = Field(default=False, description="Whether pet is microchipped")
    microchip_number: Optional[str] = Field(default=None, description="Microchip number")
    insurance_provider: Optional[str] = Field(default=None, description="Pet insurance provider")
    emergency_contact_name: Optional[str] = Field(default=None, description="Emergency contact name")
    emergency_contact_phone: Optional[str] = Field(default=None, description="Emergency contact phone")


class PetProfileCreate(BaseModel):
    """Create a new pet profile"""
    name: str = Field(description="Pet's name")
    nicknames: Optional[str] = Field(default=None, description="Pet's nicknames")
    breed: Optional[str] = Field(default=None)
    species: str = Field(default="dog", description="dog, cat, etc.")
    gender: Optional[str] = Field(default=None, description="male, female, unknown")
    weight: Optional[float] = Field(default=None, description="Weight in kg")
    photo_url: Optional[str] = Field(default=None, description="URL to pet's photo")
    birth_date: Optional[str] = Field(default=None, description="YYYY-MM-DD")
    gotcha_date: Optional[str] = Field(default=None, description="Adoption date YYYY-MM-DD")
    age_years: Optional[int] = Field(default=None)
    age_months: Optional[int] = Field(default=None)
    soul: Optional[PetSoul] = Field(default=None)
    celebrations: List[PetCelebration] = Field(default_factory=list)
    preferences: Optional[PetPreferences] = Field(default=None)
    health: Optional[PetHealthInfo] = Field(default=None, description="Pet health information")
    owner_email: Optional[str] = Field(default=None)
    owner_phone: Optional[str] = Field(default=None)
    owner_name: Optional[str] = Field(default=None)
    whatsapp_reminders: bool = Field(default=True)
    email_reminders: bool = Field(default=True)
    source: Optional[str] = Field(default="direct", description="Where the pet was created")
    # Soul answers from onboarding - canonical fields
    doggy_soul_answers: Optional[Dict[str, Any]] = Field(default=None, description="Soul answers in canonical format")
    # Dine pillar — nutrition goal (maintenance / weight_loss / weight_gain / muscle / senior / puppy)
    nutrition_goal: Optional[str] = Field(default=None, description="Pet's primary nutrition goal")


class PetProfileUpdate(BaseModel):
    """Update pet profile - all fields optional"""
    name: Optional[str] = None
    breed: Optional[str] = None
    species: Optional[str] = None
    gender: Optional[str] = None
    photo_url: Optional[str] = None
    birth_date: Optional[str] = None
    gotcha_date: Optional[str] = None
    age_years: Optional[int] = None
    age_months: Optional[int] = None
    city: Optional[str] = None  # Pet's city (inherits from owner)
    pincode: Optional[str] = None  # Pet's pincode
    soul: Optional[PetSoul] = None
    celebrations: Optional[List[PetCelebration]] = None
    preferences: Optional[PetPreferences] = None
    health: Optional[PetHealthInfo] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_name: Optional[str] = None
    whatsapp_reminders: Optional[bool] = None
    email_reminders: Optional[bool] = None
    # Dine pillar — nutrition goal
    nutrition_goal: Optional[str] = None


class CelebrationReminder(BaseModel):
    """A scheduled celebration reminder"""
    pet_id: str
    pet_name: str
    owner_name: str
    owner_phone: Optional[str]
    owner_email: Optional[str]
    occasion: str
    occasion_name: str
    celebration_date: str
    reminder_date: str
    days_until: int
    persona: str
    message_style: str
    favorite_flavors: List[str]
    recommended_collection: str
    status: str = "pending"


# ==================== CART MODELS ====================

class CartItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    variant: Optional[str] = None
    image: Optional[str] = None


class CartSnapshot(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    items: List[CartItem]
    subtotal: float


# ==================== PAYMENT MODELS ====================

class CreateOrderRequest(BaseModel):
    plan_id: str
    user_email: str
    user_name: Optional[str] = None
    user_phone: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    user_email: Optional[str] = None   # Required for membership activation (sent by MembershipPayment.jsx)


# ==================== ADMIN MEMBER MANAGEMENT MODELS ====================

class AddMemberRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    membership_tier: str = "pawsome"
    membership_months: int = 12
    paw_points: int = 100
    notes: Optional[str] = None
    send_welcome_email: bool = True


class BulkActionRequest(BaseModel):
    member_ids: List[str]
    action: str  # upgrade_tier, extend_1_month, add_100_points, send_renewal_reminder


class CSVImportRequest(BaseModel):
    data: List[dict]
    send_welcome_emails: bool = False


class ProductCSVImportRequest(BaseModel):
    products: List[dict]


# ==================== AGENT MODELS ====================

class AgentCreate(BaseModel):
    username: str
    password: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    permissions: List[str] = ["service_desk", "unified_inbox"]


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None


class AgentPasswordChange(BaseModel):
    new_password: str


class AgentLoginRequest(BaseModel):
    username: str
    password: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: Optional[str] = None
