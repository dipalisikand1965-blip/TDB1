"""
Amadeus Travel API Service - Enhanced
Provides comprehensive hotel search with:
- All property types (hotels, villas, boutique, resorts)
- All star ratings (1-5 stars)
- Room offers with pricing in INR
- Full property details (amenities, descriptions, photos)
- All cities worldwide

No restrictions - full data for user choice
"""

import httpx
import logging
from typing import Optional, Dict, List, Any
import os
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Amadeus API Configuration
AMADEUS_API_KEY = os.environ.get("AMADEUS_API_KEY", "")
AMADEUS_API_SECRET = os.environ.get("AMADEUS_API_SECRET", "")
AMADEUS_AUTH_URL = "https://test.api.amadeus.com/v1/security/oauth2/token"
AMADEUS_API_URL = "https://test.api.amadeus.com"

# Cache for access token
_access_token = None
_token_expiry = None


async def get_access_token() -> Optional[str]:
    """Get Amadeus API access token (with caching)."""
    global _access_token, _token_expiry
    
    if _access_token and _token_expiry and datetime.now() < _token_expiry:
        return _access_token
    
    if not AMADEUS_API_KEY or not AMADEUS_API_SECRET:
        logger.warning("Amadeus API credentials not configured")
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                AMADEUS_AUTH_URL,
                data={
                    "grant_type": "client_credentials",
                    "client_id": AMADEUS_API_KEY,
                    "client_secret": AMADEUS_API_SECRET
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Amadeus auth error: {response.status_code} - {response.text}")
                return None
            
            data = response.json()
            _access_token = data.get("access_token")
            expires_in = data.get("expires_in", 1800)
            _token_expiry = datetime.now() + timedelta(seconds=expires_in - 60)
            
            return _access_token
            
    except Exception as e:
        logger.error(f"Amadeus auth error: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# COMPREHENSIVE CITY CODE MAPPING - WORLDWIDE
# ═══════════════════════════════════════════════════════════════════════════════

CITY_CODES_WITH_COUNTRY = {
    # India - All major cities
    "mumbai": ("BOM", "IN"), "delhi": ("DEL", "IN"), "bangalore": ("BLR", "IN"), "bengaluru": ("BLR", "IN"),
    "chennai": ("MAA", "IN"), "kolkata": ("CCU", "IN"), "hyderabad": ("HYD", "IN"), "pune": ("PNQ", "IN"),
    "goa": ("GOI", "IN"), "jaipur": ("JAI", "IN"), "ahmedabad": ("AMD", "IN"), "kochi": ("COK", "IN"),
    "gurgaon": ("DEL", "IN"), "noida": ("DEL", "IN"), "udaipur": ("UDR", "IN"), "jodhpur": ("JDH", "IN"),
    "agra": ("AGR", "IN"), "varanasi": ("VNS", "IN"), "shimla": ("SLV", "IN"), "manali": ("KUU", "IN"),
    "rishikesh": ("DED", "IN"), "mussoorie": ("DED", "IN"), "ooty": ("CJB", "IN"), "coorg": ("IXE", "IN"),
    "munnar": ("COK", "IN"), "darjeeling": ("IXB", "IN"), "gangtok": ("IXB", "IN"), "leh": ("IXL", "IN"),
    "srinagar": ("SXR", "IN"), "amritsar": ("ATQ", "IN"), "chandigarh": ("IXC", "IN"), "lucknow": ("LKO", "IN"),
    "indore": ("IDR", "IN"), "bhopal": ("BHO", "IN"), "nagpur": ("NAG", "IN"), "thiruvananthapuram": ("TRV", "IN"),
    "trivandrum": ("TRV", "IN"), "mysore": ("MYQ", "IN"), "vizag": ("VTZ", "IN"), "visakhapatnam": ("VTZ", "IN"),
    "coimbatore": ("CJB", "IN"), "pondicherry": ("PNY", "IN"), "puducherry": ("PNY", "IN"),
    "alleppey": ("COK", "IN"), "kovalam": ("TRV", "IN"), "kodaikanal": ("IXM", "IN"),
    "mahabalipuram": ("MAA", "IN"), "hampi": ("BLR", "IN"), "khajuraho": ("HJR", "IN"),
    "ranthambore": ("JAI", "IN"), "jim corbett": ("DED", "IN"), "andaman": ("IXZ", "IN"),
    "port blair": ("IXZ", "IN"), "lakshadweep": ("AGX", "IN"),
    
    # Europe
    "london": ("LON", "GB"), "paris": ("PAR", "FR"), "rome": ("ROM", "IT"), "barcelona": ("BCN", "ES"),
    "madrid": ("MAD", "ES"), "amsterdam": ("AMS", "NL"), "berlin": ("BER", "DE"), "munich": ("MUC", "DE"),
    "vienna": ("VIE", "AT"), "prague": ("PRG", "CZ"), "budapest": ("BUD", "HU"), "lisbon": ("LIS", "PT"),
    "athens": ("ATH", "GR"), "dublin": ("DUB", "IE"), "zurich": ("ZRH", "CH"), "geneva": ("GVA", "CH"),
    "milan": ("MIL", "IT"), "venice": ("VCE", "IT"), "florence": ("FLR", "IT"), "nice": ("NCE", "FR"),
    "brussels": ("BRU", "BE"), "copenhagen": ("CPH", "DK"), "stockholm": ("STO", "SE"), "oslo": ("OSL", "NO"),
    "helsinki": ("HEL", "FI"), "warsaw": ("WAW", "PL"), "krakow": ("KRK", "PL"), "edinburgh": ("EDI", "GB"),
    "manchester": ("MAN", "GB"), "birmingham": ("BHX", "GB"), "frankfurt": ("FRA", "DE"),
    "santorini": ("JTR", "GR"), "mykonos": ("JMK", "GR"), "amalfi": ("NAP", "IT"), "cinque terre": ("GOA", "IT"),
    
    # Asia Pacific
    "singapore": ("SIN", "SG"), "bangkok": ("BKK", "TH"), "kuala lumpur": ("KUL", "MY"), "tokyo": ("TYO", "JP"),
    "osaka": ("OSA", "JP"), "kyoto": ("KIX", "JP"), "seoul": ("SEL", "KR"), "hong kong": ("HKG", "HK"),
    "taipei": ("TPE", "TW"), "manila": ("MNL", "PH"), "jakarta": ("JKT", "ID"), "bali": ("DPS", "ID"),
    "phuket": ("HKT", "TH"), "hanoi": ("HAN", "VN"), "ho chi minh": ("SGN", "VN"), "saigon": ("SGN", "VN"),
    "beijing": ("BJS", "CN"), "shanghai": ("SHA", "CN"), "guangzhou": ("CAN", "CN"), "shenzhen": ("SZX", "CN"),
    "sydney": ("SYD", "AU"), "melbourne": ("MEL", "AU"), "brisbane": ("BNE", "AU"), "perth": ("PER", "AU"),
    "auckland": ("AKL", "NZ"), "wellington": ("WLG", "NZ"), "fiji": ("SUV", "FJ"),
    "maldives": ("MLE", "MV"), "male": ("MLE", "MV"), "sri lanka": ("CMB", "LK"), "colombo": ("CMB", "LK"),
    "kathmandu": ("KTM", "NP"), "nepal": ("KTM", "NP"), "bhutan": ("PBH", "BT"),
    
    # Middle East
    "dubai": ("DXB", "AE"), "abu dhabi": ("AUH", "AE"), "doha": ("DOH", "QA"), "muscat": ("MCT", "OM"),
    "bahrain": ("BAH", "BH"), "kuwait": ("KWI", "KW"), "riyadh": ("RUH", "SA"), "jeddah": ("JED", "SA"),
    "amman": ("AMM", "JO"), "beirut": ("BEY", "LB"), "tel aviv": ("TLV", "IL"), "istanbul": ("IST", "TR"),
    
    # Africa
    "cairo": ("CAI", "EG"), "johannesburg": ("JNB", "ZA"), "cape town": ("CPT", "ZA"), "nairobi": ("NBO", "KE"),
    "casablanca": ("CMN", "MA"), "marrakech": ("RAK", "MA"), "mauritius": ("MRU", "MU"), "seychelles": ("SEZ", "SC"),
    "zanzibar": ("ZNZ", "TZ"), "lagos": ("LOS", "NG"), "accra": ("ACC", "GH"), "victoria falls": ("VFA", "ZW"),
    "kruger": ("MQP", "ZA"), "serengeti": ("JRO", "TZ"),
    
    # Americas
    "new york": ("NYC", "US"), "los angeles": ("LAX", "US"), "san francisco": ("SFO", "US"), "chicago": ("CHI", "US"),
    "miami": ("MIA", "US"), "las vegas": ("LAS", "US"), "boston": ("BOS", "US"), "seattle": ("SEA", "US"),
    "washington": ("WAS", "US"), "denver": ("DEN", "US"), "dallas": ("DFW", "US"), "houston": ("HOU", "US"),
    "toronto": ("YTO", "CA"), "vancouver": ("YVR", "CA"), "montreal": ("YMQ", "CA"), "cancun": ("CUN", "MX"),
    "mexico city": ("MEX", "MX"), "sao paulo": ("SAO", "BR"), "rio de janeiro": ("RIO", "BR"), "lima": ("LIM", "PE"),
    "bogota": ("BOG", "CO"), "buenos aires": ("BUE", "AR"), "santiago": ("SCL", "CL"),
    "hawaii": ("HNL", "US"), "honolulu": ("HNL", "US"), "maui": ("OGG", "US"),
}

CITY_CODES = {k: v[0] for k, v in CITY_CODES_WITH_COUNTRY.items()}
INDIA_CITY_CODES = {k: v[0] for k, v in CITY_CODES_WITH_COUNTRY.items() if v[1] == "IN"}


def get_city_code(city_name: str) -> Optional[str]:
    """Get IATA city code from city name. Supports worldwide cities."""
    city_lower = city_name.lower().strip()
    
    if city_lower in CITY_CODES:
        return CITY_CODES[city_lower]
    
    for city, code in CITY_CODES.items():
        if city in city_lower or city_lower in city:
            return code
    
    return None


def get_city_code_and_country(city_name: str) -> tuple:
    """Get IATA city code and country code from city name."""
    city_lower = city_name.lower().strip()
    
    if city_lower in CITY_CODES_WITH_COUNTRY:
        return CITY_CODES_WITH_COUNTRY[city_lower]
    
    for city, (code, country) in CITY_CODES_WITH_COUNTRY.items():
        if city in city_lower or city_lower in city:
            return (code, country)
    
    return (None, None)


# ═══════════════════════════════════════════════════════════════════════════════
# HOTEL SEARCH - NO RESTRICTIONS
# ═══════════════════════════════════════════════════════════════════════════════

async def search_hotels_by_city(
    city_code: str,
    check_in: str = None,
    check_out: str = None,
    adults: int = 2,
    radius: int = 100,  # Increased radius for more results
    max_results: int = 20,  # More results
    currency: str = "INR"  # Default INR
) -> List[Dict[str, Any]]:
    """
    Search for ALL hotels in a city - NO RESTRICTIONS.
    Includes all star ratings, all property types.
    """
    token = await get_access_token()
    if not token:
        return []
    
    if not check_in:
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    if not check_out:
        check_out = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
    
    try:
        async with httpx.AsyncClient() as client:
            # Get ALL hotels - no restrictions
            response = await client.get(
                f"{AMADEUS_API_URL}/v1/reference-data/locations/hotels/by-city",
                params={
                    "cityCode": city_code,
                    "radius": radius,
                    "radiusUnit": "KM",
                    "hotelSource": "ALL"  # ALL sources - hotels, villas, boutique
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=20.0
            )
            
            if response.status_code != 200:
                logger.error(f"Amadeus hotel search error: {response.status_code}")
                return []
            
            data = response.json()
            hotels = data.get("data", [])[:max_results * 2]  # Get more to filter
            
            return hotels
            
    except Exception as e:
        logger.error(f"Amadeus hotel search error: {e}")
        return []


async def get_hotel_offers(
    hotel_ids: List[str],
    check_in: str,
    check_out: str,
    adults: int = 2,
    rooms: int = 1,
    currency: str = "INR"
) -> List[Dict[str, Any]]:
    """
    Get room offers with pricing for specific hotels.
    Returns full details: rooms, rates, amenities, policies.
    Currency in INR.
    """
    token = await get_access_token()
    if not token or not hotel_ids:
        return []
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AMADEUS_API_URL}/v3/shopping/hotel-offers",
                params={
                    "hotelIds": ",".join(hotel_ids[:20]),  # Max 20 hotels per request
                    "checkInDate": check_in,
                    "checkOutDate": check_out,
                    "adults": adults,
                    "roomQuantity": rooms,
                    "currency": currency,
                    "bestRateOnly": False  # Get ALL rate options
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.warning(f"Hotel offers API: {response.status_code}")
                return []
            
            data = response.json()
            return data.get("data", [])
            
    except Exception as e:
        logger.error(f"Hotel offers error: {e}")
        return []


def _process_hotel_with_offers(hotel: Dict, offers: List[Dict] = None) -> Dict[str, Any]:
    """
    Process hotel data into comprehensive format.
    Includes all fields - no filtering.
    """
    hotel_id = hotel.get("hotelId", "")
    
    # Find matching offers
    hotel_offers = []
    if offers:
        for offer in offers:
            if offer.get("hotel", {}).get("hotelId") == hotel_id:
                hotel_offers = offer.get("offers", [])
                break
    
    # Process rooms/offers
    rooms = []
    min_price = None
    max_price = None
    
    for offer in hotel_offers:
        price_data = offer.get("price", {})
        price_total = float(price_data.get("total", 0))
        price_currency = price_data.get("currency", "INR")
        
        if price_total > 0:
            if min_price is None or price_total < min_price:
                min_price = price_total
            if max_price is None or price_total > max_price:
                max_price = price_total
        
        room = {
            "offer_id": offer.get("id"),
            "room_type": offer.get("room", {}).get("type", "Standard Room"),
            "room_description": offer.get("room", {}).get("description", {}).get("text", ""),
            "bed_type": offer.get("room", {}).get("typeEstimated", {}).get("bedType", ""),
            "beds": offer.get("room", {}).get("typeEstimated", {}).get("beds", 1),
            "price": {
                "total": price_total,
                "currency": price_currency,
                "base": float(price_data.get("base", 0)),
                "taxes": float(price_data.get("taxes", 0)) if price_data.get("taxes") else 0,
                "per_night": price_total / max(1, (datetime.strptime(offer.get("checkOutDate", "2025-01-02"), "%Y-%m-%d") - datetime.strptime(offer.get("checkInDate", "2025-01-01"), "%Y-%m-%d")).days) if price_total else 0
            },
            "check_in": offer.get("checkInDate"),
            "check_out": offer.get("checkOutDate"),
            "guests": {
                "adults": offer.get("guests", {}).get("adults", 2)
            },
            "policies": {
                "cancellation": offer.get("policies", {}).get("cancellations", []),
                "payment_type": offer.get("policies", {}).get("paymentType", ""),
                "guarantee": offer.get("policies", {}).get("guarantee", {})
            },
            "board_type": offer.get("boardType", "ROOM_ONLY"),  # Breakfast, etc.
            "rate_family": offer.get("rateFamilyEstimated", {}).get("type", ""),
            "self_service_available": offer.get("self", {}).get("href") is not None
        }
        rooms.append(room)
    
    # Build comprehensive hotel object
    result = {
        "id": hotel_id,
        "name": hotel.get("name", "Unknown Hotel"),
        "chain_code": hotel.get("chainCode"),
        "brand_code": hotel.get("brandCode"),
        "iata_code": hotel.get("iataCode"),
        "dupe_id": hotel.get("dupeId"),
        
        # Location
        "location": {
            "latitude": hotel.get("geoCode", {}).get("latitude"),
            "longitude": hotel.get("geoCode", {}).get("longitude"),
            "address": hotel.get("address", {}).get("lines", [""])[0] if hotel.get("address", {}).get("lines") else "",
            "city": hotel.get("address", {}).get("cityName", ""),
            "country": hotel.get("address", {}).get("countryCode", ""),
            "postal_code": hotel.get("address", {}).get("postalCode", "")
        },
        
        # Distance
        "distance": {
            "value": hotel.get("distance", {}).get("value"),
            "unit": hotel.get("distance", {}).get("unit", "KM")
        },
        
        # Pricing
        "pricing": {
            "min_price": min_price,
            "max_price": max_price,
            "currency": "INR",
            "price_range": f"₹{int(min_price):,} - ₹{int(max_price):,}" if min_price and max_price else None
        },
        
        # Rooms/Offers
        "rooms": rooms,
        "total_room_options": len(rooms),
        
        # Property details
        "property_type": _infer_property_type(hotel),
        "star_rating": hotel.get("rating"),  # If available
        
        # Pet policy
        "pet_friendly": {
            "likelihood": _get_pet_friendly_likelihood(hotel),
            "policy_note": "",
            "verified": False  # Concierge will verify
        },
        
        # Amenities (if available in response)
        "amenities": hotel.get("amenities", []),
        
        # Source
        "source": "amadeus",
        "last_updated": datetime.now().isoformat()
    }
    
    return result


def _infer_property_type(hotel: Dict) -> str:
    """Infer property type from hotel data."""
    name_lower = hotel.get("name", "").lower()
    
    if "villa" in name_lower:
        return "Villa"
    elif "boutique" in name_lower:
        return "Boutique Hotel"
    elif "resort" in name_lower:
        return "Resort"
    elif "hostel" in name_lower:
        return "Hostel"
    elif "homestay" in name_lower or "home stay" in name_lower:
        return "Homestay"
    elif "apartment" in name_lower or "serviced" in name_lower:
        return "Serviced Apartment"
    elif "palace" in name_lower or "haveli" in name_lower:
        return "Heritage Property"
    elif "lodge" in name_lower:
        return "Lodge"
    else:
        return "Hotel"


def _get_pet_friendly_likelihood(hotel: Dict) -> str:
    """Determine pet-friendly likelihood."""
    chain = hotel.get("chainCode", "")
    name_lower = hotel.get("name", "").lower()
    
    # Known pet-friendly chains
    PET_FRIENDLY_CHAINS = ["HI", "IH", "MC", "HY", "WI", "SI", "RT", "RA", "BW", "KI", "AC"]
    
    if chain in PET_FRIENDLY_CHAINS:
        return "high"
    elif "pet" in name_lower or "dog" in name_lower:
        return "high"
    elif any(word in name_lower for word in ["boutique", "villa", "homestay"]):
        return "medium"
    else:
        return "verify"


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN SEARCH FUNCTION - FULL DATA, NO RESTRICTIONS
# ═══════════════════════════════════════════════════════════════════════════════

async def search_pet_friendly_hotels(
    city: str,
    check_in: str = None,
    check_out: str = None,
    adults: int = 2,
    rooms: int = 1,
    max_results: int = 20,
    currency: str = "INR",
    include_offers: bool = True
) -> Dict[str, Any]:
    """
    Search for ALL accommodation types in a city.
    
    NO RESTRICTIONS:
    - All star ratings (1-5 stars)
    - All property types (hotels, villas, boutique, resorts, homestays)
    - All price ranges
    - Full room details with pricing in INR
    - All amenities and policies
    
    Args:
        city: City name (worldwide)
        check_in: Check-in date (YYYY-MM-DD)
        check_out: Check-out date (YYYY-MM-DD)
        adults: Number of adults
        rooms: Number of rooms
        max_results: Maximum results
        currency: Currency code (default INR)
        include_offers: Whether to fetch room offers (slower but more data)
    """
    city_code, country_code = get_city_code_and_country(city)
    
    if not city_code:
        logger.info(f"City code not found for '{city}'")
        return {
            "success": False,
            "error": f"City '{city}' not in our database. Contact Concierge for assistance.",
            "city": city,
            "hotels": []
        }
    
    # Default dates
    if not check_in:
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    if not check_out:
        check_out = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
    
    # Get hotel list
    hotels = await search_hotels_by_city(
        city_code=city_code,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        max_results=max_results * 3,  # Get more to filter by country
        currency=currency
    )
    
    # Filter by country
    if country_code:
        hotels = [h for h in hotels if h.get("address", {}).get("countryCode", "").upper() == country_code.upper()]
        logger.info(f"Filtered by country {country_code}: {len(hotels)} hotels")
    
    hotels = hotels[:max_results]
    
    # Get room offers if requested
    offers = []
    if include_offers and hotels:
        hotel_ids = [h.get("hotelId") for h in hotels if h.get("hotelId")]
        offers = await get_hotel_offers(
            hotel_ids=hotel_ids,
            check_in=check_in,
            check_out=check_out,
            adults=adults,
            rooms=rooms,
            currency=currency
        )
    
    # Process hotels with full data
    processed_hotels = []
    for hotel in hotels:
        processed = _process_hotel_with_offers(hotel, offers)
        processed_hotels.append(processed)
    
    # Sort by price if available
    processed_hotels.sort(key=lambda x: x.get("pricing", {}).get("min_price") or float('inf'))
    
    return {
        "success": True,
        "city": city,
        "city_code": city_code,
        "country_code": country_code,
        "check_in": check_in,
        "check_out": check_out,
        "adults": adults,
        "rooms": rooms,
        "currency": currency,
        "hotels": processed_hotels,
        "total": len(processed_hotels),
        "filters_applied": {
            "star_rating": "all",
            "property_type": "all",
            "price_range": "all"
        },
        "note": "Your Concierge® will verify pet policies and handle bookings."
    }


async def get_travel_recommendations_for_pet(
    pet_name: str,
    pet_breed: str,
    destination_city: str,
    travel_dates: Dict[str, str] = None
) -> Dict[str, Any]:
    """Get personalized travel recommendations."""
    check_in = travel_dates.get("check_in") if travel_dates else None
    check_out = travel_dates.get("check_out") if travel_dates else None
    
    hotel_result = await search_pet_friendly_hotels(
        city=destination_city,
        check_in=check_in,
        check_out=check_out,
        max_results=10,
        include_offers=True
    )
    
    # Pet-specific travel tips
    travel_tips = [
        f"🐕 Carry {pet_name}'s vaccination records and health certificate",
        "📋 Pack familiar items: favorite toy, blanket, food bowl",
        "💧 Bring bottled water for the journey",
        "🚗 Take breaks every 2-3 hours for bathroom and stretching",
        "🏥 Research emergency vet clinics at your destination"
    ]
    
    # Breed-specific tips
    breed_lower = pet_breed.lower()
    if any(b in breed_lower for b in ["bulldog", "pug", "shih tzu", "boxer"]):
        travel_tips.append("⚠️ Brachycephalic breeds: Avoid hot hours, ensure ventilation")
    elif any(b in breed_lower for b in ["husky", "malamute", "bernese"]):
        travel_tips.append("❄️ Heavy-coated breeds: Carry cooling mats, avoid peak heat")
    elif any(b in breed_lower for b in ["golden", "labrador", "retriever"]):
        travel_tips.append("🏊 Retrievers love water: Look for pools or nearby lakes")
    
    return {
        "success": True,
        "pet_name": pet_name,
        "pet_breed": pet_breed,
        "destination": destination_city,
        "hotels": hotel_result.get("hotels", []),
        "total_hotels": hotel_result.get("total", 0),
        "travel_tips": travel_tips,
        "currency": "INR"
    }


async def test_amadeus_connection():
    """Test if Amadeus API is working."""
    if not AMADEUS_API_KEY or not AMADEUS_API_SECRET:
        return {"success": False, "error": "API credentials not configured"}
    
    try:
        token = await get_access_token()
        if token:
            return {
                "success": True,
                "message": "Amadeus API connected successfully",
                "features": ["hotels", "offers", "INR_currency", "all_property_types"]
            }
        return {"success": False, "error": "Failed to get access token"}
    except Exception as e:
        return {"success": False, "error": str(e)}
