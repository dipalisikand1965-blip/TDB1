"""
OpenWeather API Service
Provides weather-based pet activity recommendations
"""

import httpx
import logging
from typing import Optional, Dict, Any
import os
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# OpenWeather API Configuration
OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")
OPENWEATHER_API_URL = "https://api.openweathermap.org/data/2.5"


# Pet safety thresholds
PET_WEATHER_THRESHOLDS = {
    "too_hot": 35,           # °C - Dangerous for walks
    "hot_caution": 28,       # °C - Short walks only
    "ideal_min": 15,         # °C - Perfect weather
    "ideal_max": 25,         # °C - Perfect weather
    "cold_caution": 10,      # °C - Consider coat for short-haired dogs
    "too_cold": 5,           # °C - Limit outdoor time
    "humidity_high": 80,     # % - Can affect breathing
    "wind_strong": 40,       # km/h - May stress anxious dogs
}


async def get_weather_by_city(city: str, country_code: str = "IN") -> Optional[Dict[str, Any]]:
    """
    Get current weather for a city.
    
    Args:
        city: City name
        country_code: ISO country code (default: IN for India)
        
    Returns:
        Weather data dictionary or None
    """
    if not OPENWEATHER_API_KEY:
        logger.warning("OpenWeather API key not configured")
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{OPENWEATHER_API_URL}/weather",
                params={
                    "q": f"{city},{country_code}",
                    "appid": OPENWEATHER_API_KEY,
                    "units": "metric"  # Celsius
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"OpenWeather API error: {response.status_code}")
                return None
            
            data = response.json()
            return _process_weather_response(data)
            
    except Exception as e:
        logger.error(f"OpenWeather API error: {e}")
        return None


async def get_weather_forecast(city: str, country_code: str = "IN") -> Optional[Dict[str, Any]]:
    """
    Get 5-day weather forecast for a city.
    
    Args:
        city: City name
        country_code: ISO country code
        
    Returns:
        Forecast data dictionary or None
    """
    if not OPENWEATHER_API_KEY:
        logger.warning("OpenWeather API key not configured")
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{OPENWEATHER_API_URL}/forecast",
                params={
                    "q": f"{city},{country_code}",
                    "appid": OPENWEATHER_API_KEY,
                    "units": "metric",
                    "cnt": 8  # Next 24 hours (3-hour intervals)
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"OpenWeather forecast error: {response.status_code}")
                return None
            
            data = response.json()
            return _process_forecast_response(data)
            
    except Exception as e:
        logger.error(f"OpenWeather forecast error: {e}")
        return None


def _process_weather_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """Process OpenWeather current weather response."""
    main = data.get("main", {})
    weather = data.get("weather", [{}])[0]
    wind = data.get("wind", {})
    
    temp = main.get("temp", 0)
    feels_like = main.get("feels_like", 0)
    humidity = main.get("humidity", 0)
    wind_speed = wind.get("speed", 0) * 3.6  # Convert m/s to km/h
    
    # Determine pet safety level
    pet_advisory = _get_pet_weather_advisory(temp, feels_like, humidity, wind_speed, weather.get("main", ""))
    
    return {
        "city": data.get("name"),
        "country": data.get("sys", {}).get("country"),
        "temperature": round(temp, 1),
        "feels_like": round(feels_like, 1),
        "humidity": humidity,
        "wind_speed": round(wind_speed, 1),
        "condition": weather.get("main", "Unknown"),
        "description": weather.get("description", ""),
        "icon": weather.get("icon"),
        "pet_advisory": pet_advisory,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def _process_forecast_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """Process OpenWeather forecast response."""
    city_data = data.get("city", {})
    forecasts = []
    
    for item in data.get("list", []):
        main = item.get("main", {})
        weather = item.get("weather", [{}])[0]
        
        temp = main.get("temp", 0)
        
        forecasts.append({
            "datetime": item.get("dt_txt"),
            "temperature": round(temp, 1),
            "condition": weather.get("main"),
            "description": weather.get("description"),
            "is_good_for_walk": 15 <= temp <= 28 and weather.get("main") not in ["Rain", "Thunderstorm", "Snow"]
        })
    
    # Find best time for walk in next 24 hours
    best_time = None
    for f in forecasts:
        if f.get("is_good_for_walk"):
            best_time = f.get("datetime")
            break
    
    return {
        "city": city_data.get("name"),
        "forecasts": forecasts,
        "best_walk_time": best_time
    }


def _get_pet_weather_advisory(
    temp: float, 
    feels_like: float, 
    humidity: float, 
    wind_speed: float,
    condition: str
) -> Dict[str, Any]:
    """
    Generate pet-specific weather advisory.
    
    Returns advisory with safety level and recommendations.
    """
    warnings = []
    recommendations = []
    safety_level = "good"  # good, caution, warning, danger
    
    # Temperature checks
    if feels_like >= PET_WEATHER_THRESHOLDS["too_hot"]:
        safety_level = "danger"
        warnings.append(f"🔥 DANGEROUS HEAT ({feels_like}°C feels like)")
        recommendations.append("Keep pets indoors with AC/fans")
        recommendations.append("Provide plenty of fresh water")
        recommendations.append("NO walks - pavement can burn paws")
    elif feels_like >= PET_WEATHER_THRESHOLDS["hot_caution"]:
        safety_level = "caution"
        warnings.append(f"☀️ Hot weather ({feels_like}°C feels like)")
        recommendations.append("Walk only in early morning or late evening")
        recommendations.append("Test pavement with back of hand - if too hot for you, too hot for paws")
        recommendations.append("Carry water for your pet")
    elif feels_like <= PET_WEATHER_THRESHOLDS["too_cold"]:
        safety_level = "caution"
        warnings.append(f"❄️ Very cold ({feels_like}°C feels like)")
        recommendations.append("Short walks only")
        recommendations.append("Consider a dog coat for short-haired breeds")
        recommendations.append("Wipe paws after walks to remove salt/ice")
    elif feels_like <= PET_WEATHER_THRESHOLDS["cold_caution"]:
        warnings.append(f"🌡️ Cool weather ({feels_like}°C)")
        recommendations.append("Short-haired dogs may need a coat")
    elif PET_WEATHER_THRESHOLDS["ideal_min"] <= feels_like <= PET_WEATHER_THRESHOLDS["ideal_max"]:
        recommendations.append("✨ Perfect weather for walks and outdoor play!")
        recommendations.append("Great day for a dog park visit")
    
    # Weather condition checks
    if condition in ["Rain", "Drizzle"]:
        if safety_level == "good":
            safety_level = "caution"
        warnings.append("🌧️ Rainy conditions")
        recommendations.append("Consider a raincoat for your dog")
        recommendations.append("Dry your pet thoroughly after walks")
        recommendations.append("Watch for puddles and slippery surfaces")
    elif condition == "Thunderstorm":
        safety_level = "warning"
        warnings.append("⛈️ Thunderstorm - Many pets are scared of thunder")
        recommendations.append("Keep anxious pets indoors")
        recommendations.append("Create a safe, quiet space")
        recommendations.append("Consider calming treats or anxiety wrap")
    elif condition == "Snow":
        warnings.append("🌨️ Snow conditions")
        recommendations.append("Check for ice balls between paw pads")
        recommendations.append("Use pet-safe ice melt on your property")
    
    # Humidity check
    if humidity >= PET_WEATHER_THRESHOLDS["humidity_high"]:
        warnings.append(f"💧 High humidity ({humidity}%)")
        recommendations.append("Brachycephalic breeds (Pugs, Bulldogs) should stay cool")
        recommendations.append("Watch for signs of overheating")
    
    # Wind check
    if wind_speed >= PET_WEATHER_THRESHOLDS["wind_strong"]:
        warnings.append(f"💨 Strong winds ({wind_speed} km/h)")
        recommendations.append("Anxious dogs may be stressed by wind")
        recommendations.append("Secure loose items in yard")
    
    # Walk recommendation
    if safety_level == "danger":
        walk_ok = False
        walk_message = "🚫 Not safe for walks right now"
    elif safety_level == "warning":
        walk_ok = False
        walk_message = "⚠️ Avoid outdoor activities if possible"
    elif safety_level == "caution":
        walk_ok = True
        walk_message = "⚡ Short walks OK with precautions"
    else:
        walk_ok = True
        walk_message = "✅ Great conditions for walks!"
    
    return {
        "safety_level": safety_level,
        "walk_ok": walk_ok,
        "walk_message": walk_message,
        "warnings": warnings,
        "recommendations": recommendations
    }


async def get_pet_activity_recommendation(city: str) -> Dict[str, Any]:
    """
    Get comprehensive pet activity recommendation based on current weather.
    
    Args:
        city: City name
        
    Returns:
        Activity recommendation with weather context
    """
    weather = await get_weather_by_city(city)
    
    if not weather:
        # Use fallback weather estimates when no API key
        from services.openweather_service import get_fallback_weather
        fallback = get_fallback_weather(city)
        if fallback:
            weather = _process_fallback_to_advisory(fallback)
        else:
            return {
                "success": False,
                "error": "Could not fetch weather data"
            }
    
    advisory = weather.get("pet_advisory", {})
    
    # Generate activity suggestions
    activities = []
    
    if advisory.get("walk_ok"):
        if advisory.get("safety_level") == "good":
            activities.extend([
                "🐕 Long walk or jog",
                "🎾 Fetch at the park",
                "🏃 Dog park playtime",
                "🚶 Explore a new neighborhood"
            ])
        else:
            activities.extend([
                "🐕 Short walk (15-20 mins)",
                "🏠 Backyard play",
                "🎯 Quick potty break"
            ])
    else:
        activities.extend([
            "🏠 Indoor play with toys",
            "🧩 Puzzle feeders for mental stimulation",
            "🎾 Indoor fetch (if space allows)",
            "🐾 Training session with treats",
            "😴 Rest and cuddle time"
        ])
    
    return {
        "success": True,
        "city": weather.get("city"),
        "current_weather": {
            "temperature": weather.get("temperature"),
            "feels_like": weather.get("feels_like"),
            "condition": weather.get("condition"),
            "description": weather.get("description"),
            "humidity": weather.get("humidity")
        },
        "pet_advisory": advisory,
        "suggested_activities": activities,
        "timestamp": weather.get("timestamp")
    }


# Test function
async def test_openweather_connection():
    """Test if OpenWeather API is working."""
    if not OPENWEATHER_API_KEY:
        return {"success": False, "error": "API key not configured"}
    
    try:
        result = await get_weather_by_city("Mumbai")
        return {
            "success": result is not None,
            "sample": result
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════════════
# FALLBACK: When no API key is configured, return city-appropriate 
# weather estimates based on month and known Indian city patterns
# ═══════════════════════════════════════════════════════════════

INDIA_CITY_WEATHER = {
    "mumbai": {"jan": (20, 32), "feb": (21, 33), "mar": (23, 34), "apr": (26, 35), "may": (28, 35), "jun": (27, 32), "jul": (26, 30), "aug": (25, 30), "sep": (25, 31), "oct": (25, 33), "nov": (23, 33), "dec": (21, 32)},
    "bangalore": {"jan": (16, 28), "feb": (17, 30), "mar": (19, 33), "apr": (21, 34), "may": (21, 33), "jun": (20, 30), "jul": (19, 28), "aug": (19, 28), "sep": (19, 29), "oct": (19, 28), "nov": (18, 27), "dec": (16, 27)},
    "bengaluru": {"jan": (16, 28), "feb": (17, 30), "mar": (19, 33), "apr": (21, 34), "may": (21, 33), "jun": (20, 30), "jul": (19, 28), "aug": (19, 28), "sep": (19, 29), "oct": (19, 28), "nov": (18, 27), "dec": (16, 27)},
    "delhi": {"jan": (7, 20), "feb": (10, 23), "mar": (15, 30), "apr": (21, 36), "may": (26, 40), "jun": (28, 40), "jul": (27, 35), "aug": (26, 34), "sep": (24, 34), "oct": (19, 33), "nov": (13, 28), "dec": (8, 22)},
    "gurgaon": {"jan": (7, 20), "feb": (10, 23), "mar": (15, 30), "apr": (21, 36), "may": (26, 40), "jun": (28, 40), "jul": (27, 35), "aug": (26, 34), "sep": (24, 34), "oct": (19, 33), "nov": (13, 28), "dec": (8, 22)},
    "pune": {"jan": (12, 31), "feb": (14, 33), "mar": (17, 36), "apr": (21, 38), "may": (22, 37), "jun": (22, 31), "jul": (21, 28), "aug": (21, 28), "sep": (21, 30), "oct": (19, 32), "nov": (15, 31), "dec": (12, 30)},
    "chennai": {"jan": (21, 30), "feb": (22, 31), "mar": (24, 33), "apr": (27, 35), "may": (28, 38), "jun": (28, 37), "jul": (27, 35), "aug": (26, 35), "sep": (26, 34), "oct": (25, 32), "nov": (23, 30), "dec": (22, 29)},
    "hyderabad": {"jan": (15, 30), "feb": (17, 33), "mar": (20, 36), "apr": (24, 38), "may": (26, 39), "jun": (24, 34), "jul": (23, 31), "aug": (22, 30), "sep": (22, 31), "oct": (20, 31), "nov": (17, 30), "dec": (14, 29)},
    "kolkata": {"jan": (13, 26), "feb": (16, 29), "mar": (21, 34), "apr": (25, 36), "may": (26, 36), "jun": (26, 34), "jul": (26, 33), "aug": (26, 33), "sep": (26, 33), "oct": (24, 32), "nov": (19, 30), "dec": (14, 27)},
    "goa": {"jan": (20, 33), "feb": (21, 33), "mar": (23, 34), "apr": (25, 34), "may": (26, 33), "jun": (25, 31), "jul": (24, 29), "aug": (24, 29), "sep": (24, 30), "oct": (24, 32), "nov": (22, 33), "dec": (21, 33)},
}

MONTH_KEYS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]

def get_fallback_weather(city: str) -> Optional[Dict[str, Any]]:
    """Generate reasonable weather estimate when no API key is available"""
    from datetime import datetime
    
    city_lower = city.lower().strip()
    month_key = MONTH_KEYS[datetime.now().month - 1]
    
    # Find matching city
    temps = None
    matched_city = city
    for c, data in INDIA_CITY_WEATHER.items():
        if c in city_lower or city_lower in c:
            temps = data.get(month_key, (25, 32))
            matched_city = c.title()
            break
    
    if not temps:
        # Default to moderate Indian weather
        temps = (22, 30)
    
    min_t, max_t = temps
    # Estimate current temp (midpoint with slight variation)
    import random
    current = round((min_t + max_t) / 2 + random.uniform(-2, 2), 1)
    
    return {
        "temperature": current,
        "feels_like": current + 1.5,
        "condition": "Clear" if current < 35 else "Hot",
        "description": "clear sky" if current < 30 else ("hot" if current > 35 else "warm"),
        "humidity": 55 if current < 30 else 70,
        "wind_speed": 3.5,
        "city": matched_city,
        "is_estimate": True
    }


def _process_fallback_to_advisory(fallback: Dict) -> Dict[str, Any]:
    """Convert fallback weather data to the same format as real weather with advisory"""
    temp = fallback.get("temperature", 28)
    
    # Generate pet advisory based on temperature
    if temp < 10:
        safety = "caution"
        walk_ok = True
        walk_msg = "Cold weather - use a coat for small/short-haired dogs"
        warnings = ["Cold weather - keep walks shorter"]
    elif temp <= 25:
        safety = "good"
        walk_ok = True
        walk_msg = "Great weather for walks!"
        warnings = []
    elif temp <= 32:
        safety = "caution"
        walk_ok = True
        walk_msg = "Short walks OK with precautions"
        warnings = ["Warm weather - carry water"]
    elif temp <= 38:
        safety = "danger"
        walk_ok = True
        walk_msg = "Walk only in early morning or late evening"
        warnings = ["Hot weather - test pavement with back of hand", "Carry water and take breaks"]
    else:
        safety = "danger"
        walk_ok = False
        walk_msg = "Too hot for walks - stay indoors"
        warnings = ["Extreme heat - avoid pavement entirely", "Risk of heatstroke"]
    
    return {
        "temperature": temp,
        "feels_like": fallback.get("feels_like", temp + 1),
        "condition": fallback.get("condition", "Clear"),
        "description": fallback.get("description", ""),
        "humidity": fallback.get("humidity", 55),
        "city": fallback.get("city", ""),
        "pet_advisory": {
            "safety_level": safety,
            "walk_ok": walk_ok,
            "walk_message": walk_msg,
            "warnings": warnings,
            "recommendations": [
                "Walk in early morning or late evening" if temp > 30 else "Great time for a walk!",
                "Carry water on walks" if temp > 25 else "Enjoy the outdoors!",
            ]
        },
        "is_estimate": True
    }
