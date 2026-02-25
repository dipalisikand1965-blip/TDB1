"""
Mira OS - Unified API Integration Hub
=====================================
Central service for all external API integrations.

Configured APIs:
- Google: Places, Maps, Geocoding, Vision, Calendar
- Weather: OpenWeather
- Discovery: Foursquare
- Travel: Amadeus, Viator
- Events: Eventbrite
- Media: YouTube
- Communication: Resend (Email), Gupshup (WhatsApp/SMS)
"""

import os
import httpx
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from enum import Enum

logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════════════════
# API CONFIGURATION
# ════════════════════════════════════════════════════════════════════════════════

class APIConfig:
    """Centralized API configuration"""
    
    # Google APIs
    GOOGLE_PLACES_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")
    GOOGLE_VISION_KEY = os.environ.get("GOOGLE_VISION_API_KEY", "")
    GOOGLE_CALENDAR_KEY = os.environ.get("GOOGLE_CALENDAR_API_KEY", "")
    
    # Weather
    OPENWEATHER_KEY = os.environ.get("OPENWEATHER_API_KEY", "")
    
    # Discovery
    FOURSQUARE_KEY = os.environ.get("FOURSQUARE_API_KEY", "")
    
    # Travel
    AMADEUS_KEY = os.environ.get("AMADEUS_API_KEY", "")
    AMADEUS_SECRET = os.environ.get("AMADEUS_API_SECRET", "")
    VIATOR_KEY = os.environ.get("VIATOR_API_KEY", "")
    
    # Events
    EVENTBRITE_KEY = os.environ.get("EVENTBRITE_API_KEY", "")
    EVENTBRITE_TOKEN = os.environ.get("EVENTBRITE_PRIVATE_TOKEN", "")
    
    # Media
    YOUTUBE_KEY = os.environ.get("YOUTUBE_API_KEY", "")
    
    # Communication
    RESEND_KEY = os.environ.get("RESEND_API_KEY", "")
    GUPSHUP_KEY = os.environ.get("GUPSHUP_API_KEY", "")
    GUPSHUP_APP = os.environ.get("GUPSHUP_APP_NAME", "THEDOGGYCOMPANY")
    GUPSHUP_SOURCE = os.environ.get("GUPSHUP_SOURCE_NUMBER", "919739908844")
    
    # Business Info
    SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "mira@thedoggycompany.com")
    BUSINESS_NAME = os.environ.get("BUSINESS_NAME", "The Doggy Company")
    SITE_URL = os.environ.get("SITE_URL", "https://thedoggycompany.com")
    WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "919739908844")


# ════════════════════════════════════════════════════════════════════════════════
# 1. GOOGLE SERVICES
# ════════════════════════════════════════════════════════════════════════════════

class GoogleServices:
    """Google API integrations"""
    
    @staticmethod
    async def search_nearby_places(
        lat: float, 
        lng: float, 
        query: str,
        radius_m: int = 5000,
        max_results: int = 5
    ) -> List[Dict]:
        """Search nearby places using Google Places API (New)"""
        if not APIConfig.GOOGLE_PLACES_KEY:
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://places.googleapis.com/v1/places:searchText",
                    json={
                        "textQuery": query,
                        "pageSize": max_results,
                        "locationBias": {
                            "circle": {
                                "center": {"latitude": lat, "longitude": lng},
                                "radius": float(radius_m)
                            }
                        }
                    },
                    headers={
                        "X-Goog-Api-Key": APIConfig.GOOGLE_PLACES_KEY,
                        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.location"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json().get("places", [])
        except Exception as e:
            logger.error(f"[GOOGLE] Places search error: {e}")
        return []
    
    @staticmethod
    async def analyze_image(image_url: str) -> Dict:
        """Analyze image using Google Vision API"""
        if not APIConfig.GOOGLE_VISION_KEY:
            return {"error": "Vision API not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://vision.googleapis.com/v1/images:annotate?key={APIConfig.GOOGLE_VISION_KEY}",
                    json={
                        "requests": [{
                            "image": {"source": {"imageUri": image_url}},
                            "features": [
                                {"type": "LABEL_DETECTION", "maxResults": 10},
                                {"type": "OBJECT_LOCALIZATION", "maxResults": 5}
                            ]
                        }]
                    },
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            logger.error(f"[GOOGLE] Vision API error: {e}")
        return {"error": str(e)}


# ════════════════════════════════════════════════════════════════════════════════
# 2. WEATHER SERVICE
# ════════════════════════════════════════════════════════════════════════════════

class WeatherService:
    """OpenWeather API integration"""
    
    @staticmethod
    async def get_current_weather(lat: float, lng: float) -> Dict:
        """Get current weather for location"""
        if not APIConfig.OPENWEATHER_KEY:
            return {"error": "Weather API not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={
                        "lat": lat,
                        "lon": lng,
                        "appid": APIConfig.OPENWEATHER_KEY,
                        "units": "metric"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "temp_c": round(data["main"]["temp"]),
                        "feels_like": round(data["main"]["feels_like"]),
                        "humidity": data["main"]["humidity"],
                        "description": data["weather"][0]["description"],
                        "icon": data["weather"][0]["icon"],
                        "is_good_walk_weather": _is_good_walk_weather(data)
                    }
        except Exception as e:
            logger.error(f"[WEATHER] API error: {e}")
        return {"error": "Could not fetch weather"}
    
    @staticmethod
    async def get_pet_weather_alert(lat: float, lng: float, pet_data: Dict) -> Optional[str]:
        """Generate pet-specific weather alerts"""
        weather = await WeatherService.get_current_weather(lat, lng)
        
        if "error" in weather:
            return None
        
        alerts = []
        temp = weather.get("temp_c", 20)
        humidity = weather.get("humidity", 50)
        
        # Hot weather alert
        if temp > 32:
            alerts.append(f"🌡️ It's {temp}°C - too hot for walks! Keep your pet indoors with water.")
        elif temp > 28:
            alerts.append(f"☀️ Warm day ({temp}°C) - walk early morning or evening, bring water.")
        
        # Cold weather alert
        if temp < 10:
            pet_size = pet_data.get("size", "medium")
            if pet_size == "small":
                alerts.append(f"🧥 Cold day ({temp}°C) - your small pet may need a jacket!")
        
        # Humidity alert (tick/flea season)
        if humidity > 80:
            alerts.append("💧 High humidity - check for ticks after outdoor time.")
        
        return alerts[0] if alerts else None


def _is_good_walk_weather(weather_data: Dict) -> bool:
    """Determine if weather is good for walking a dog"""
    temp = weather_data["main"]["temp"]
    condition = weather_data["weather"][0]["main"].lower()
    
    # Too hot or too cold
    if temp > 32 or temp < 5:
        return False
    
    # Bad conditions
    bad_conditions = ["thunderstorm", "heavy rain", "snow", "extreme"]
    if any(bad in condition for bad in bad_conditions):
        return False
    
    return True


# ════════════════════════════════════════════════════════════════════════════════
# 3. FOURSQUARE SERVICE
# ════════════════════════════════════════════════════════════════════════════════

class FoursquareService:
    """Foursquare API for venue discovery"""
    
    @staticmethod
    async def search_venues(
        lat: float,
        lng: float,
        query: str,
        radius_m: int = 5000,
        limit: int = 5
    ) -> List[Dict]:
        """Search for venues using Foursquare"""
        if not APIConfig.FOURSQUARE_KEY:
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.foursquare.com/v3/places/search",
                    params={
                        "query": query,
                        "ll": f"{lat},{lng}",
                        "radius": radius_m,
                        "limit": limit
                    },
                    headers={
                        "Authorization": APIConfig.FOURSQUARE_KEY,
                        "Accept": "application/json"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json().get("results", [])
        except Exception as e:
            logger.error(f"[FOURSQUARE] API error: {e}")
        return []


# ════════════════════════════════════════════════════════════════════════════════
# 4. TRAVEL SERVICES (Amadeus + Viator)
# ════════════════════════════════════════════════════════════════════════════════

class TravelService:
    """Travel API integrations"""
    
    _amadeus_token = None
    _token_expiry = None
    
    @classmethod
    async def _get_amadeus_token(cls) -> Optional[str]:
        """Get Amadeus OAuth token"""
        if not APIConfig.AMADEUS_KEY or not APIConfig.AMADEUS_SECRET:
            return None
        
        # Check if token is still valid
        if cls._amadeus_token and cls._token_expiry and datetime.now() < cls._token_expiry:
            return cls._amadeus_token
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://test.api.amadeus.com/v1/security/oauth2/token",
                    data={
                        "grant_type": "client_credentials",
                        "client_id": APIConfig.AMADEUS_KEY,
                        "client_secret": APIConfig.AMADEUS_SECRET
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    cls._amadeus_token = data["access_token"]
                    # Token expires in ~1800 seconds, refresh at 1500
                    from datetime import timedelta
                    cls._token_expiry = datetime.now() + timedelta(seconds=1500)
                    return cls._amadeus_token
        except Exception as e:
            logger.error(f"[AMADEUS] Token error: {e}")
        return None
    
    @classmethod
    async def search_pet_friendly_hotels(
        cls,
        city_code: str,
        check_in: str,
        check_out: str,
        adults: int = 2
    ) -> List[Dict]:
        """Search for pet-friendly hotels using Amadeus"""
        token = await cls._get_amadeus_token()
        if not token:
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://test.api.amadeus.com/v2/shopping/hotel-offers",
                    params={
                        "cityCode": city_code,
                        "checkInDate": check_in,
                        "checkOutDate": check_out,
                        "adults": adults,
                        "roomQuantity": 1
                    },
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    return response.json().get("data", [])
        except Exception as e:
            logger.error(f"[AMADEUS] Hotel search error: {e}")
        return []


# ════════════════════════════════════════════════════════════════════════════════
# 5. EVENTS SERVICE (Eventbrite)
# ════════════════════════════════════════════════════════════════════════════════

class EventsService:
    """Eventbrite API for pet events"""
    
    @staticmethod
    async def search_pet_events(
        city: str,
        start_date: str = None,
        max_results: int = 10
    ) -> List[Dict]:
        """Search for pet-related events"""
        if not APIConfig.EVENTBRITE_TOKEN:
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.eventbriteapi.com/v3/events/search/",
                    params={
                        "q": f"pet dog cat {city}",
                        "location.address": city,
                        "location.within": "50km",
                        "start_date.keyword": "this_month" if not start_date else None,
                        "page_size": max_results
                    },
                    headers={"Authorization": f"Bearer {APIConfig.EVENTBRITE_TOKEN}"},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    events = response.json().get("events", [])
                    return [{
                        "id": e["id"],
                        "name": e["name"]["text"],
                        "description": e.get("description", {}).get("text", "")[:200],
                        "start": e["start"]["local"],
                        "url": e["url"],
                        "venue": e.get("venue", {})
                    } for e in events]
        except Exception as e:
            logger.error(f"[EVENTBRITE] API error: {e}")
        return []


# ════════════════════════════════════════════════════════════════════════════════
# 6. YOUTUBE SERVICE
# ════════════════════════════════════════════════════════════════════════════════

class YouTubeService:
    """YouTube API for training videos"""
    
    @staticmethod
    async def search_pet_videos(
        query: str,
        max_results: int = 5
    ) -> List[Dict]:
        """Search for pet training/care videos"""
        if not APIConfig.YOUTUBE_KEY:
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/youtube/v3/search",
                    params={
                        "part": "snippet",
                        "q": f"dog {query} training tutorial",
                        "type": "video",
                        "maxResults": max_results,
                        "key": APIConfig.YOUTUBE_KEY,
                        "safeSearch": "strict",
                        "videoDuration": "medium"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    items = response.json().get("items", [])
                    return [{
                        "id": item["id"]["videoId"],
                        "title": item["snippet"]["title"],
                        "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                        "channel": item["snippet"]["channelTitle"],
                        "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}"
                    } for item in items]
        except Exception as e:
            logger.error(f"[YOUTUBE] API error: {e}")
        return []


# ════════════════════════════════════════════════════════════════════════════════
# 7. COMMUNICATION SERVICES (Resend + Gupshup)
# ════════════════════════════════════════════════════════════════════════════════

class NotificationService:
    """Unified notification service for Email + WhatsApp + SMS"""
    
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_body: str,
        from_name: str = "Mira from The Doggy Company"
    ) -> Dict:
        """Send email via Resend"""
        if not APIConfig.RESEND_KEY:
            return {"success": False, "error": "Email not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    json={
                        "from": f"{from_name} <{APIConfig.SENDER_EMAIL}>",
                        "to": [to_email],
                        "subject": subject,
                        "html": html_body
                    },
                    headers={
                        "Authorization": f"Bearer {APIConfig.RESEND_KEY}",
                        "Content-Type": "application/json"
                    },
                    timeout=10.0
                )
                
                if response.status_code in [200, 201]:
                    logger.info(f"[EMAIL] ✅ Sent to {to_email}: {subject}")
                    return {"success": True, "id": response.json().get("id")}
                else:
                    logger.error(f"[EMAIL] Failed: {response.text}")
                    return {"success": False, "error": response.text}
        except Exception as e:
            logger.error(f"[EMAIL] Error: {e}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def send_whatsapp(
        to_number: str,
        message: str,
        template_name: str = None
    ) -> Dict:
        """Send WhatsApp message via Gupshup"""
        if not APIConfig.GUPSHUP_KEY:
            return {"success": False, "error": "WhatsApp not configured"}
        
        # Ensure number has country code
        if not to_number.startswith("91"):
            to_number = f"91{to_number}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.gupshup.io/wa/api/v1/msg",
                    data={
                        "channel": "whatsapp",
                        "source": APIConfig.GUPSHUP_SOURCE,
                        "destination": to_number,
                        "message": message,
                        "src.name": APIConfig.GUPSHUP_APP
                    },
                    headers={
                        "apikey": APIConfig.GUPSHUP_KEY,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"[WHATSAPP] ✅ Sent to {to_number}")
                    return {"success": True, "response": response.json()}
                else:
                    logger.error(f"[WHATSAPP] Failed: {response.text}")
                    return {"success": False, "error": response.text}
        except Exception as e:
            logger.error(f"[WHATSAPP] Error: {e}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def send_sms(to_number: str, message: str) -> Dict:
        """Send SMS via Gupshup"""
        if not APIConfig.GUPSHUP_KEY:
            return {"success": False, "error": "SMS not configured"}
        
        # Ensure number has country code
        if not to_number.startswith("91"):
            to_number = f"91{to_number}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://enterprise.smsgupshup.com/GatewayAPI/rest",
                    params={
                        "method": "sendMessage",
                        "send_to": to_number,
                        "msg": message,
                        "msg_type": "TEXT",
                        "userid": APIConfig.GUPSHUP_APP,
                        "auth_scheme": "plain",
                        "password": APIConfig.GUPSHUP_KEY,
                        "v": "1.1",
                        "format": "json"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"[SMS] ✅ Sent to {to_number}")
                    return {"success": True}
                else:
                    return {"success": False, "error": response.text}
        except Exception as e:
            logger.error(f"[SMS] Error: {e}")
            return {"success": False, "error": str(e)}


# ════════════════════════════════════════════════════════════════════════════════
# 8. UNIFIED NOTIFICATION DISPATCHER
# ════════════════════════════════════════════════════════════════════════════════

class NotificationDispatcher:
    """
    Send notifications across multiple channels based on user preferences.
    
    Usage:
        await NotificationDispatcher.send(
            user_email="dipali@example.com",
            user_phone="9739908844",
            notification_type="ticket_update",
            data={
                "pet_name": "Mystique",
                "ticket_id": "TKT-123",
                "message": "Your grooming appointment is confirmed"
            },
            channels=["email", "whatsapp"]  # or ["all"]
        )
    """
    
    TEMPLATES = {
        "ticket_created": {
            "email_subject": "Request Received: {title}",
            "email_body": """
                <h2>Hi {customer_name}!</h2>
                <p>We've received your request for <strong>{pet_name}</strong>.</p>
                <p><strong>Request:</strong> {title}</p>
                <p>Our Concierge® team will be in touch shortly.</p>
                <p><a href="{site_url}/notifications">View in your Inbox →</a></p>
                <p>— Mira & The Doggy Company Team</p>
            """,
            "whatsapp": "🐾 Hi {customer_name}! Your request for {pet_name} has been received: {title}. We'll be in touch soon!"
        },
        "ticket_update": {
            "email_subject": "Update: {title}",
            "email_body": """
                <h2>Update for {pet_name}</h2>
                <p>{message}</p>
                <p><a href="{site_url}/notifications">View details →</a></p>
            """,
            "whatsapp": "📢 Update for {pet_name}: {message}"
        },
        "booking_confirmed": {
            "email_subject": "Booking Confirmed: {service_name}",
            "email_body": """
                <h2>🎉 Booking Confirmed!</h2>
                <p>Great news, {customer_name}! Your booking for <strong>{pet_name}</strong> is confirmed.</p>
                <p><strong>Service:</strong> {service_name}</p>
                <p><strong>Date:</strong> {date}</p>
                <p><strong>Time:</strong> {time}</p>
                <p>See you soon!</p>
            """,
            "whatsapp": "✅ Confirmed! {service_name} for {pet_name} on {date} at {time}. See you soon!"
        },
        "weather_alert": {
            "email_subject": "Weather Alert for {pet_name}",
            "email_body": """
                <h2>🌡️ Weather Alert</h2>
                <p>{alert_message}</p>
                <p>Stay safe with {pet_name}!</p>
            """,
            "whatsapp": "🌡️ Weather Alert for {pet_name}: {alert_message}"
        }
    }
    
    @classmethod
    async def send(
        cls,
        user_email: str = None,
        user_phone: str = None,
        notification_type: str = "ticket_update",
        data: Dict = None,
        channels: List[str] = None
    ) -> Dict:
        """Send notification across specified channels"""
        
        data = data or {}
        channels = channels or ["email"]
        data["site_url"] = APIConfig.SITE_URL
        
        template = cls.TEMPLATES.get(notification_type, cls.TEMPLATES["ticket_update"])
        results = {"email": None, "whatsapp": None, "sms": None}
        
        # Email
        if "email" in channels or "all" in channels:
            if user_email:
                subject = template["email_subject"].format(**data)
                body = template["email_body"].format(**data)
                results["email"] = await NotificationService.send_email(
                    user_email, subject, body
                )
        
        # WhatsApp
        if "whatsapp" in channels or "all" in channels:
            if user_phone:
                message = template["whatsapp"].format(**data)
                results["whatsapp"] = await NotificationService.send_whatsapp(
                    user_phone, message
                )
        
        # SMS (fallback if WhatsApp fails or separate channel)
        if "sms" in channels:
            if user_phone:
                message = template["whatsapp"].format(**data)[:160]  # SMS limit
                results["sms"] = await NotificationService.send_sms(
                    user_phone, message
                )
        
        return results


# ════════════════════════════════════════════════════════════════════════════════
# PILLAR-SPECIFIC API USAGE
# ════════════════════════════════════════════════════════════════════════════════

PILLAR_API_MAP = {
    "celebrate": {
        "apis": ["google_places", "eventbrite", "youtube"],
        "search_queries": ["pet bakery", "pet party venue", "pet photographer"],
        "video_topics": ["dog birthday party ideas", "pet party planning"]
    },
    "dine": {
        "apis": ["google_places", "foursquare", "openweather"],
        "search_queries": ["pet friendly restaurant", "pet friendly cafe", "dog park"],
        "weather_alerts": True
    },
    "stay": {
        "apis": ["amadeus", "google_places"],
        "search_queries": ["pet friendly hotel", "pet boarding", "kennel"],
        "hotel_search": True
    },
    "travel": {
        "apis": ["amadeus", "viator", "google_places"],
        "search_queries": ["pet travel carrier", "pet airline policy"],
        "activities": True
    },
    "care": {
        "apis": ["google_places", "youtube"],
        "search_queries": ["veterinary clinic", "pet hospital", "24 hour vet"],
        "video_topics": ["dog first aid", "pet health tips"]
    },
    "enjoy": {
        "apis": ["google_places", "foursquare"],
        "search_queries": ["pet grooming", "dog spa", "pet salon"]
    },
    "fit": {
        "apis": ["google_places", "openweather", "youtube"],
        "search_queries": ["dog park", "hiking trail pet friendly"],
        "video_topics": ["dog exercise routines", "dog agility training"],
        "weather_alerts": True
    },
    "learn": {
        "apis": ["youtube", "google_places"],
        "search_queries": ["dog training center", "puppy school"],
        "video_topics": ["dog training basics", "puppy obedience"]
    },
    "adopt": {
        "apis": ["google_places", "eventbrite"],
        "search_queries": ["pet shelter", "animal rescue", "pet adoption center"],
        "events": ["pet adoption drive", "rescue meetup"]
    }
}


async def get_pillar_data(
    pillar: str,
    latitude: float,
    longitude: float,
    city: str
) -> Dict:
    """
    Get API-powered data for a specific pillar.
    
    Returns combined data from all relevant APIs for that pillar.
    """
    config = PILLAR_API_MAP.get(pillar.lower(), {})
    result = {"pillar": pillar, "city": city, "data": {}}
    
    # Google Places searches
    if "google_places" in config.get("apis", []):
        for query in config.get("search_queries", [])[:2]:  # Limit to 2 searches
            places = await GoogleServices.search_nearby_places(
                latitude, longitude, f"{query} {city}", max_results=3
            )
            result["data"][query.replace(" ", "_")] = places
    
    # Weather (for outdoor pillars)
    if config.get("weather_alerts"):
        weather = await WeatherService.get_current_weather(latitude, longitude)
        result["data"]["weather"] = weather
    
    # YouTube videos
    if "youtube" in config.get("apis", []):
        for topic in config.get("video_topics", [])[:1]:  # 1 topic
            videos = await YouTubeService.search_pet_videos(topic, max_results=3)
            result["data"]["videos"] = videos
            break
    
    # Events
    if "eventbrite" in config.get("apis", []):
        events = await EventsService.search_pet_events(city, max_results=3)
        result["data"]["events"] = events
    
    return result
