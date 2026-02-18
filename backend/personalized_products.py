"""
Personalized Products Engine
==============================
Generates personalized product mockups using pet's photo.

HYBRID APPROACH:
- PROACTIVE (Always in PICKS): Template-based mockups - fast, always available
- ON INTENT (After user interest): AI-generated mockups - higher quality

Pet First Doctrine: "Personalized for {Pet}" - unique items featuring YOUR pet.
All items go to Concierge for fulfillment (no fixed price).
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════════
# PERSONALIZED PRODUCT TEMPLATES
# These are always available in PICKS under "Personalized for {Pet}"
# ═══════════════════════════════════════════════════════════════════════════════

PERSONALIZED_PRODUCTS = [
    {
        "id": "personalized-photo-mug",
        "name": "Custom Photo Mug",
        "description": "Start your day with your best friend's face",
        "icon": "☕",
        "category": "home",
        "template_type": "photo_overlay",
        "mockup_base": "mug",
        "popular": True,
        "tags": ["gift", "home", "photo"]
    },
    {
        "id": "personalized-photo-coaster",
        "name": "Photo Coaster Set",
        "description": "Protect your surfaces with pet love",
        "icon": "🥤",
        "category": "home",
        "template_type": "photo_overlay",
        "mockup_base": "coaster",
        "popular": True,
        "tags": ["gift", "home", "photo"]
    },
    {
        "id": "personalized-name-bandana",
        "name": "Custom Name Bandana",
        "description": "Stylish bandana with embroidered name",
        "icon": "🎀",
        "category": "accessories",
        "template_type": "text_overlay",
        "mockup_base": "bandana",
        "popular": True,
        "tags": ["accessories", "fashion", "name"]
    },
    {
        "id": "personalized-pet-portrait",
        "name": "AI Pet Portrait",
        "description": "Artistic portrait generated from your pet's photo",
        "icon": "🖼️",
        "category": "art",
        "template_type": "ai_generated",
        "mockup_base": "canvas",
        "popular": True,
        "tags": ["art", "portrait", "gift", "ai"]
    },
    {
        "id": "personalized-collar-tag",
        "name": "Custom Collar Tag",
        "description": "Engraved with name and your phone number",
        "icon": "🏷️",
        "category": "accessories",
        "template_type": "text_overlay",
        "mockup_base": "tag",
        "popular": True,
        "tags": ["accessories", "safety", "name"]
    },
    {
        "id": "personalized-photo-calendar",
        "name": "Pet Photo Calendar",
        "description": "12 months of your furry friend",
        "icon": "📅",
        "category": "home",
        "template_type": "photo_overlay",
        "mockup_base": "calendar",
        "popular": False,
        "tags": ["gift", "home", "photo"]
    },
    {
        "id": "personalized-photo-blanket",
        "name": "Photo Blanket",
        "description": "Cozy blanket with your pet's face",
        "icon": "🛏️",
        "category": "home",
        "template_type": "photo_overlay",
        "mockup_base": "blanket",
        "popular": False,
        "tags": ["home", "comfort", "photo"]
    },
    {
        "id": "personalized-custom-bow",
        "name": "Custom Bow Tie",
        "description": "Dapper bow tie with initials",
        "icon": "🎩",
        "category": "accessories",
        "template_type": "text_overlay",
        "mockup_base": "bowtie",
        "popular": False,
        "tags": ["accessories", "fashion", "name"]
    },
    {
        "id": "personalized-lookalike-plush",
        "name": "Custom Lookalike Plush",
        "description": "A plush toy that looks just like your pet",
        "icon": "🧸",
        "category": "toys",
        "template_type": "custom_order",
        "mockup_base": "plush",
        "popular": True,
        "tags": ["toy", "gift", "custom"]
    },
    {
        "id": "personalized-birthday-cake",
        "name": "Custom Birthday Cake",
        "description": "Dog-safe cake with photo decoration",
        "icon": "🎂",
        "category": "treats",
        "template_type": "custom_order",
        "mockup_base": "cake",
        "popular": True,
        "tags": ["birthday", "treats", "celebration"],
        "links_to": "/celebrate"  # Links to cake designer tool
    },
    {
        "id": "personalized-phone-case",
        "name": "Phone Case",
        "description": "Carry your pet everywhere",
        "icon": "📱",
        "category": "accessories",
        "template_type": "photo_overlay",
        "mockup_base": "phonecase",
        "popular": False,
        "tags": ["accessories", "photo", "gift"]
    },
    {
        "id": "personalized-tote-bag",
        "name": "Pet Photo Tote",
        "description": "Canvas tote with your pet's face",
        "icon": "👜",
        "category": "accessories",
        "template_type": "photo_overlay",
        "mockup_base": "totebag",
        "popular": False,
        "tags": ["accessories", "photo", "gift"]
    }
]

# ═══════════════════════════════════════════════════════════════════════════════
# CELEBRATE INTENT PRODUCTS
# Special products shown when birthday/party intent is detected
# ═══════════════════════════════════════════════════════════════════════════════

CELEBRATE_PRODUCTS = [
    {
        "id": "celebrate-custom-cake",
        "name": "Design Your Cake",
        "description": "Create a custom dog-safe birthday cake",
        "icon": "🎂",
        "category": "celebrate",
        "template_type": "tool_link",
        "links_to": "/celebrate",
        "cta": "Design Now",
        "popular": True
    },
    {
        "id": "celebrate-party-kit",
        "name": "Birthday Party Kit",
        "description": "Decorations, hats, and treats for the perfect pawty",
        "icon": "🎉",
        "category": "celebrate",
        "template_type": "concierge_arrange",
        "popular": True
    },
    {
        "id": "celebrate-photo-banner",
        "name": "Custom Photo Banner",
        "description": "Birthday banner featuring your pet's best photos",
        "icon": "🎊",
        "category": "celebrate",
        "template_type": "photo_overlay",
        "popular": True
    },
    {
        "id": "celebrate-party-outfit",
        "name": "Birthday Outfit",
        "description": "Festive costume for the birthday star",
        "icon": "👑",
        "category": "celebrate",
        "template_type": "concierge_arrange",
        "popular": True
    }
]


def generate_personalized_picks(
    pet_name: str,
    pet_photo_url: str = None,
    pet_context: Dict = None,
    limit: int = 6,
    include_celebrate: bool = False
) -> List[Dict]:
    """
    Generate personalized product cards for a pet.
    
    These appear in PICKS under "Personalized for {Pet}".
    All are Concierge-fulfilled (no fixed price).
    
    Args:
        pet_name: Pet's name
        pet_photo_url: URL to pet's profile photo (for mockups)
        pet_context: Additional pet context (breed, etc.)
        limit: Max number of products to return
        include_celebrate: Include celebration products
    
    Returns:
        List of personalized product cards
    """
    # Get popular products first
    products = [p for p in PERSONALIZED_PRODUCTS if p.get("popular", False)]
    
    # Add non-popular to fill limit
    non_popular = [p for p in PERSONALIZED_PRODUCTS if not p.get("popular", False)]
    products.extend(non_popular)
    
    # Add celebrate products if requested
    if include_celebrate:
        products = CELEBRATE_PRODUCTS + products
    
    # Limit results
    products = products[:limit]
    
    # Build personalized cards
    cards = []
    for product in products:
        card = {
            "id": f"{product['id']}-{pet_name.lower().replace(' ', '-')}",
            "product_id": product["id"],
            "name": product["name"],
            "display_name": f"{product['name']} for {pet_name}",
            "description": product["description"],
            "reason": f"Personalized just for {pet_name}",
            "icon": product.get("icon", "🎁"),
            "category": product.get("category", "personalized"),
            "type": "personalized_product",
            "is_personalized": True,
            "pet_name": pet_name,
            # No price - Concierge sources
            "price": None,
            "price_display": "Concierge creates",
            "cta": product.get("cta", f"Create for {pet_name}"),
            "badge": f"For {pet_name}",
            "source": "personalized_engine",
            # Template info for mockup generation
            "template_type": product.get("template_type", "custom_order"),
            "mockup_base": product.get("mockup_base"),
            "links_to": product.get("links_to"),
            # Photo URL for mockup generation
            "pet_photo_url": pet_photo_url,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Add breed-specific reason if available
        if pet_context:
            breed = pet_context.get("breed", "")
            if breed:
                card["reason"] = f"Made specially for {breed}s like {pet_name}"
        
        cards.append(card)
    
    logger.info(f"[PERSONALIZED] Generated {len(cards)} personalized products for {pet_name}")
    return cards


def generate_celebrate_picks(
    pet_name: str,
    pet_photo_url: str = None,
    pet_context: Dict = None,
    occasion: str = "birthday"
) -> List[Dict]:
    """
    Generate celebration-specific product cards.
    
    Triggered by birthday/party intent.
    Includes link to /celebrate cake designer tool.
    """
    cards = []
    
    for product in CELEBRATE_PRODUCTS:
        card = {
            "id": f"{product['id']}-{pet_name.lower().replace(' ', '-')}",
            "product_id": product["id"],
            "name": product["name"],
            "display_name": f"{product['name']} for {pet_name}'s {occasion.title()}",
            "description": product["description"],
            "reason": f"Make {pet_name}'s {occasion} special!",
            "icon": product.get("icon", "🎉"),
            "category": "celebrate",
            "type": "celebrate_product",
            "is_personalized": True,
            "pet_name": pet_name,
            "occasion": occasion,
            "price": None,
            "price_display": "Concierge arranges",
            "cta": product.get("cta", f"Get for {pet_name}"),
            "badge": f"{pet_name}'s {occasion.title()}",
            "source": "celebrate_engine",
            "links_to": product.get("links_to"),
            "pet_photo_url": pet_photo_url,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        cards.append(card)
    
    logger.info(f"[CELEBRATE] Generated {len(cards)} celebration products for {pet_name}'s {occasion}")
    return cards


async def get_personalized_shelf(
    db,
    pet_id: str,
    pet_name: str,
    limit: int = 6
) -> Dict:
    """
    Get the "Personalized for {Pet}" shelf for PICKS panel.
    
    This shelf is ALWAYS shown proactively in PICKS.
    
    Returns:
        {
            "shelf_title": "Personalized for Lola",
            "shelf_subtitle": "Unique items featuring your pet",
            "products": [...]
        }
    """
    # Get pet info for photo URL
    pet_photo_url = None
    pet_context = None
    
    if db is not None:
        try:
            pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
            if pet:
                pet_photo_url = pet.get("photo_url") or pet.get("profile_image")
                pet_context = {
                    "breed": pet.get("breed"),
                    "name": pet.get("name"),
                    "age": pet.get("age")
                }
        except Exception as e:
            logger.warning(f"[PERSONALIZED] Error getting pet: {e}")
    
    products = generate_personalized_picks(
        pet_name=pet_name,
        pet_photo_url=pet_photo_url,
        pet_context=pet_context,
        limit=limit,
        include_celebrate=False
    )
    
    return {
        "shelf_title": f"Personalized for {pet_name}",
        "shelf_subtitle": "Unique items featuring your pet - Concierge creates these",
        "shelf_type": "personalized",
        "products": products,
        "has_products": len(products) > 0,
        "pet_name": pet_name,
        "pet_photo_url": pet_photo_url
    }


async def get_celebrate_shelf(
    db,
    pet_id: str,
    pet_name: str,
    occasion: str = "birthday"
) -> Dict:
    """
    Get celebration-specific shelf for PICKS panel.
    
    Triggered by birthday/party/celebrate intent.
    Includes link to /celebrate cake designer.
    
    Returns:
        {
            "shelf_title": "Celebrate Lola's Birthday",
            "products": [...]
        }
    """
    pet_photo_url = None
    pet_context = None
    
    if db is not None:
        try:
            pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
            if pet:
                pet_photo_url = pet.get("photo_url") or pet.get("profile_image")
                pet_context = {"breed": pet.get("breed")}
        except Exception as e:
            logger.warning(f"[CELEBRATE] Error getting pet: {e}")
    
    products = generate_celebrate_picks(
        pet_name=pet_name,
        pet_photo_url=pet_photo_url,
        pet_context=pet_context,
        occasion=occasion
    )
    
    return {
        "shelf_title": f"Celebrate {pet_name}'s {occasion.title()}",
        "shelf_subtitle": "Make it special!",
        "shelf_type": "celebrate",
        "products": products,
        "has_products": len(products) > 0,
        "pet_name": pet_name,
        "occasion": occasion,
        "tool_link": "/celebrate",  # Link to cake designer
        "tool_cta": f"Design {pet_name}'s Cake"
    }
