"""
Unified Intent Flow Handler
===========================
Ensures ALL intents on the site follow the same notification flow:

1. BELL NOTIFICATION → Admin is alerted immediately
2. SERVICE DESK TICKET → Request tracked in command center
3. PILLAR REQUEST → Shown in pillar-specific queue
4. MEMBER/PET PARENT PROFILE → Request linked to member
5. PET SOUL → If pet-related, linked to pet profile

This module handles:
- Product searches → Show products OR handoff
- Service bookings → Show services OR handoff  
- Hotel/Stay bookings → Show listings OR handoff
- Restaurant/Dine → Show options OR handoff
- Any other intent → Proper routing
"""

from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)

# Database reference - set from server.py
db = None

def set_db(database):
    global db
    db = database

# Intent categories and their data sources
INTENT_DATA_SOURCES = {
    "product_search": {
        "collection": "products",
        "search_fields": ["title", "tags", "description", "category"],
        "show_if_found": True,
        "max_results": 8
    },
    "service_booking": {
        "collection": "service_catalog",
        "search_fields": ["name", "description", "tags", "category"],
        "show_if_found": True,
        "max_results": 6
    },
    "hotel_booking": {
        "collection": "stay_listings",  # or partner_hotels
        "fallback_collection": "service_catalog",
        "fallback_filter": {"pillar": "stay"},
        "show_if_found": True,
        "max_results": 4,
        "handoff_message": "I've noted your stay preferences. Our concierge team will find the perfect pet-friendly accommodation and get back to you shortly with options."
    },
    "restaurant_booking": {
        "collection": "dine_listings",  # or partner_restaurants
        "fallback_collection": "service_catalog",
        "fallback_filter": {"pillar": "dine"},
        "show_if_found": True,
        "max_results": 4,
        "handoff_message": "I've noted your dining preferences. Our concierge team will find pet-friendly restaurants and get back to you with reservations."
    },
    "boarding_booking": {
        "collection": "boarding_listings",
        "fallback_collection": "service_catalog",
        "fallback_filter": {"pillar": "stay", "category": "boarding"},
        "show_if_found": True,
        "max_results": 4,
        "handoff_message": "I've noted your boarding needs. Our concierge team will find the best options and confirm availability for you."
    },
    "travel_planning": {
        "collection": "travel_packages",
        "fallback_collection": "service_catalog",
        "fallback_filter": {"pillar": "travel"},
        "show_if_found": True,
        "max_results": 4,
        "handoff_message": "I've captured your travel plans. Our concierge team will curate the perfect pet-friendly itinerary for you."
    }
}

async def create_unified_notification_flow(
    intent_type: str,
    intent_details: dict,
    user: dict = None,
    pet: dict = None,
    pillar: str = None,
    session_id: str = None
) -> dict:
    """
    Creates notifications across ALL systems for ANY intent.
    
    Returns:
        dict with ticket_id, notification results, and any found listings
    """
    if db is None:
        logger.error("Database not connected for unified flow")
        return {"success": False, "error": "Database not connected"}
    
    now = datetime.now(timezone.utc)
    
    # Generate IDs
    ticket_prefix = get_ticket_prefix(intent_type, pillar)
    ticket_id = f"{ticket_prefix}-{now.strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"
    notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    
    # Extract user/pet info
    user_email = user.get("email") if user else None
    user_name = user.get("name") if user else "Guest"
    user_id = str(user.get("_id")) if user and user.get("_id") else None
    pet_name = pet.get("name") if pet else None
    pet_id = str(pet.get("_id")) if pet and pet.get("_id") else None
    
    # Build intent summary
    summary = build_intent_summary(intent_type, intent_details)
    
    results = {
        "ticket_id": ticket_id,
        "notifications": {},
        "listings_found": [],
        "handoff_required": False
    }
    
    # 1. ADMIN BELL NOTIFICATION
    try:
        await db.admin_notifications.insert_one({
            "id": notification_id,
            "type": intent_type,
            "pillar": pillar or "general",
            "title": f"New {intent_type.replace('_', ' ').title()} Request",
            "message": summary,
            "customer_name": user_name,
            "customer_email": user_email,
            "pet_name": pet_name,
            "ticket_id": ticket_id,
            "link": f"/admin?tab=servicedesk&ticket={ticket_id}",
            "priority": "high" if intent_type in ["hotel_booking", "restaurant_booking", "emergency"] else "medium",
            "read": False,
            "created_at": now.isoformat(),
            "timestamp": now.isoformat()
        })
        results["notifications"]["admin_bell"] = True
        logger.info(f"Created admin bell notification: {notification_id}")
    except Exception as e:
        logger.error(f"Failed to create admin notification: {e}")
        results["notifications"]["admin_bell"] = False
    
    # 2. SERVICE DESK TICKET
    try:
        await db.service_desk_tickets.insert_one({
            "ticket_id": ticket_id,
            "type": intent_type,
            "pillar": pillar or "general",
            "status": "new",
            "priority": "high" if intent_type in ["hotel_booking", "restaurant_booking", "emergency"] else "medium",
            "subject": f"{intent_type.replace('_', ' ').title()} Request",
            "description": summary,
            "intent_details": intent_details,
            "member_email": user_email,
            "member_name": user_name,
            "member_id": user_id,
            "pet_name": pet_name,
            "pet_id": pet_id,
            "session_id": session_id,
            "source": "mira_unified_flow",
            "created_at": now,
            "updated_at": now,
            "audit_trail": [{
                "action": "created",
                "timestamp": now.isoformat(),
                "performed_by": "Mira AI",
                "details": f"Created via unified flow for {intent_type}"
            }]
        })
        results["notifications"]["service_desk"] = True
        logger.info(f"Created service desk ticket: {ticket_id}")
    except Exception as e:
        logger.error(f"Failed to create service desk ticket: {e}")
        results["notifications"]["service_desk"] = False
    
    # 3. PILLAR REQUEST (pillar-specific collection)
    if pillar:
        pillar_collection = f"{pillar}_requests"
        try:
            await db[pillar_collection].insert_one({
                "ticket_id": ticket_id,
                "type": intent_type,
                "status": "new",
                "request_details": intent_details,
                "member_email": user_email,
                "member_name": user_name,
                "pet_name": pet_name,
                "created_at": now,
                "summary": summary
            })
            results["notifications"]["pillar_request"] = True
            logger.info(f"Created pillar request in {pillar_collection}: {ticket_id}")
        except Exception as e:
            logger.error(f"Failed to create pillar request: {e}")
            results["notifications"]["pillar_request"] = False
    
    # 4. MEMBER/PET PARENT PROFILE - Link request
    if user_id:
        try:
            await db.users.update_one(
                {"_id": user.get("_id")} if user.get("_id") else {"email": user_email},
                {
                    "$push": {
                        "recent_requests": {
                            "ticket_id": ticket_id,
                            "type": intent_type,
                            "summary": summary[:100],
                            "created_at": now.isoformat()
                        }
                    }
                }
            )
            results["notifications"]["member_profile"] = True
        except Exception as e:
            logger.error(f"Failed to update member profile: {e}")
            results["notifications"]["member_profile"] = False
    
    # 5. PET SOUL - Link to pet profile if pet-related
    if pet_id:
        try:
            await db.pet_profiles.update_one(
                {"_id": pet.get("_id")},
                {
                    "$push": {
                        "activity_log": {
                            "type": intent_type,
                            "ticket_id": ticket_id,
                            "summary": summary[:100],
                            "timestamp": now.isoformat()
                        }
                    }
                }
            )
            results["notifications"]["pet_soul"] = True
        except Exception as e:
            logger.error(f"Failed to update pet soul: {e}")
            results["notifications"]["pet_soul"] = False
    
    # 6. CHECK FOR LISTINGS TO SHOW
    config = INTENT_DATA_SOURCES.get(intent_type, {})
    if config.get("show_if_found"):
        listings = await find_relevant_listings(intent_type, intent_details, config)
        results["listings_found"] = listings
        results["handoff_required"] = len(listings) == 0
        results["handoff_message"] = config.get("handoff_message", "Our concierge team will get back to you shortly.")
    
    return results


def get_ticket_prefix(intent_type: str, pillar: str = None) -> str:
    """Get ticket ID prefix based on intent type"""
    prefixes = {
        "product_search": "PRD",
        "service_booking": "SVC",
        "hotel_booking": "HTL",
        "restaurant_booking": "DIN",
        "boarding_booking": "BRD",
        "travel_planning": "TRV",
        "kit_assembly": "KIT",
        "emergency": "EMR",
        "advisory": "ADV"
    }
    
    if intent_type in prefixes:
        return prefixes[intent_type]
    
    # Pillar-based fallback
    pillar_prefixes = {
        "care": "CARE",
        "travel": "TRV",
        "dine": "DIN",
        "stay": "HTL",
        "fit": "FIT",
        "learn": "LRN",
        "celebrate": "CEL",
        "enjoy": "ENJ"
    }
    
    return pillar_prefixes.get(pillar, "REQ")


def build_intent_summary(intent_type: str, details: dict) -> str:
    """Build a human-readable summary of the intent"""
    if intent_type == "hotel_booking":
        location = details.get("location", "unspecified")
        check_in = details.get("check_in", "TBD")
        check_out = details.get("check_out", "TBD")
        return f"Pet-friendly hotel booking in {location} from {check_in} to {check_out}"
    
    if intent_type == "restaurant_booking":
        location = details.get("location", "")
        cuisine = details.get("cuisine", "")
        return f"Pet-friendly restaurant {'in ' + location if location else ''} {cuisine}"
    
    if intent_type == "boarding_booking":
        dates = details.get("dates", "TBD")
        return f"Pet boarding request for {dates}"
    
    if intent_type == "service_booking":
        service = details.get("service_type", details.get("service", ""))
        return f"Service booking: {service}"
    
    # Generic summary
    return f"{intent_type.replace('_', ' ').title()} request - {str(details)[:100]}"


async def find_relevant_listings(intent_type: str, details: dict, config: dict) -> list:
    """Find relevant listings from database based on intent"""
    if db is None:
        return []
    
    collection_name = config.get("collection")
    max_results = config.get("max_results", 6)
    
    # Try primary collection
    try:
        collection = db[collection_name]
        
        # Build search query based on intent details
        query = {}
        search_terms = []
        
        if details.get("location"):
            search_terms.append(details["location"].lower())
        if details.get("keywords"):
            search_terms.extend(details["keywords"])
        
        if search_terms:
            search_regex = "|".join(search_terms)
            search_fields = config.get("search_fields", ["name", "description"])
            query["$or"] = [
                {field: {"$regex": search_regex, "$options": "i"}}
                for field in search_fields
            ]
        
        listings = await collection.find(query, {"_id": 0}).limit(max_results).to_list(max_results)
        
        if listings:
            return listings
    except Exception as e:
        logger.warning(f"Error searching {collection_name}: {e}")
    
    # Try fallback collection (usually service_catalog)
    fallback = config.get("fallback_collection")
    fallback_filter = config.get("fallback_filter", {})
    
    if fallback:
        try:
            collection = db[fallback]
            listings = await collection.find(fallback_filter, {"_id": 0}).limit(max_results).to_list(max_results)
            return listings
        except Exception as e:
            logger.warning(f"Error searching fallback {fallback}: {e}")
    
    return []


async def get_user_past_purchases(user_email: str, limit: int = 20) -> list:
    """Get user's past purchases for personalization"""
    if db is None or not user_email:
        return []
    
    try:
        orders = await db.orders.find(
            {"customer.email": user_email, "status": {"$in": ["completed", "delivered"]}},
            {
                "_id": 0,
                "line_items": 1,
                "created_at": 1
            }
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Extract product info from orders
        products = []
        for order in orders:
            for item in order.get("line_items", []):
                products.append({
                    "title": item.get("title"),
                    "product_id": item.get("product_id"),
                    "variant_id": item.get("variant_id"),
                    "category": item.get("category"),
                    "purchased_at": order.get("created_at")
                })
        
        return products
    except Exception as e:
        logger.error(f"Error fetching past purchases: {e}")
        return []


async def suggest_based_on_history(user_email: str, current_pillar: str = None) -> dict:
    """Generate suggestions based on purchase history"""
    past_purchases = await get_user_past_purchases(user_email)
    
    if not past_purchases:
        return {"suggestions": [], "message": None}
    
    # Find frequently purchased categories
    category_counts = {}
    product_names = []
    
    for p in past_purchases:
        cat = p.get("category", "").lower()
        if cat:
            category_counts[cat] = category_counts.get(cat, 0) + 1
        if p.get("title"):
            product_names.append(p["title"])
    
    # Get top categories
    top_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    
    suggestions = {
        "top_categories": [c[0] for c in top_categories],
        "recent_products": product_names[:5],
        "personalization_message": None
    }
    
    # Build personalization message
    if product_names:
        suggestions["personalization_message"] = f"Based on your love for {product_names[0]}, you might also enjoy..."
    
    return suggestions
