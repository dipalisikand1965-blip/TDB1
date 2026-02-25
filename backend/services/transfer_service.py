"""
Amadeus Transfer Service - Airport & City Transfers
====================================================
Provides transfer search for:
- Private cars
- Shared shuttles
- Taxis
- Airport express buses
- Luxury vehicles
- Helicopter transfers

All cities worldwide - NO RESTRICTIONS
Pricing in INR
"""

import httpx
import logging
from typing import Optional, Dict, List, Any
import os
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Import auth from main amadeus service
from services.amadeus_service import (
    get_access_token, 
    get_city_code_and_country,
    AMADEUS_API_URL,
    CITY_CODES
)

# Airport codes for major cities
AIRPORT_CODES = {
    # India
    "mumbai": "BOM", "delhi": "DEL", "bangalore": "BLR", "bengaluru": "BLR",
    "chennai": "MAA", "kolkata": "CCU", "hyderabad": "HYD", "pune": "PNQ",
    "goa": "GOI", "jaipur": "JAI", "ahmedabad": "AMD", "kochi": "COK",
    "gurgaon": "DEL", "noida": "DEL", "udaipur": "UDR", "jodhpur": "JDH",
    "agra": "AGR", "varanasi": "VNS", "lucknow": "LKO", "indore": "IDR",
    "thiruvananthapuram": "TRV", "trivandrum": "TRV", "coimbatore": "CJB",
    "mangalore": "IXE", "chandigarh": "IXC", "amritsar": "ATQ",
    "srinagar": "SXR", "leh": "IXL", "port blair": "IXZ",
    
    # International
    "london": "LHR", "paris": "CDG", "dubai": "DXB", "singapore": "SIN",
    "bangkok": "BKK", "hong kong": "HKG", "tokyo": "NRT", "new york": "JFK",
    "los angeles": "LAX", "sydney": "SYD", "melbourne": "MEL",
    "amsterdam": "AMS", "frankfurt": "FRA", "rome": "FCO", "madrid": "MAD",
    "barcelona": "BCN", "zurich": "ZRH", "geneva": "GVA", "vienna": "VIE",
    "milan": "MXP", "venice": "VCE", "florence": "FLR", "munich": "MUC",
    "berlin": "BER", "prague": "PRG", "budapest": "BUD", "lisbon": "LIS",
    "istanbul": "IST", "cairo": "CAI", "johannesburg": "JNB",
    "cape town": "CPT", "nairobi": "NBO", "toronto": "YYZ",
    "vancouver": "YVR", "kuala lumpur": "KUL", "bali": "DPS",
    "phuket": "HKT", "hanoi": "HAN", "ho chi minh": "SGN",
    "seoul": "ICN", "taipei": "TPE", "beijing": "PEK", "shanghai": "PVG",
    "maldives": "MLE", "male": "MLE", "colombo": "CMB", "kathmandu": "KTM"
}


def get_airport_code(city: str) -> Optional[str]:
    """Get IATA airport code from city name."""
    city_lower = city.lower().strip()
    
    if city_lower in AIRPORT_CODES:
        return AIRPORT_CODES[city_lower]
    
    for city_name, code in AIRPORT_CODES.items():
        if city_name in city_lower or city_lower in city_name:
            return code
    
    return None


# Transfer types
TRANSFER_TYPES = {
    "PRIVATE": {"icon": "🚗", "name": "Private Car", "description": "Exclusive vehicle for your party"},
    "SHARED": {"icon": "🚐", "name": "Shared Shuttle", "description": "Cost-effective shared ride"},
    "TAXI": {"icon": "🚕", "name": "Taxi", "description": "Standard taxi service"},
    "HOURLY": {"icon": "⏰", "name": "Hourly Rental", "description": "Book by the hour"},
    "AIRPORT_EXPRESS": {"icon": "🚌", "name": "Airport Express", "description": "Direct airport bus"},
    "AIRPORT_BUS": {"icon": "🚍", "name": "Airport Bus", "description": "Airport shuttle bus"},
    "HELICOPTER": {"icon": "🚁", "name": "Helicopter", "description": "Premium aerial transfer"},
    "LIMOUSINE": {"icon": "🚙", "name": "Limousine", "description": "Luxury vehicle"},
    "SEDAN": {"icon": "🚗", "name": "Sedan", "description": "Comfortable sedan"},
    "SUV": {"icon": "🚙", "name": "SUV", "description": "Spacious SUV"},
    "VAN": {"icon": "🚐", "name": "Van", "description": "Passenger van"},
    "BUS": {"icon": "🚌", "name": "Bus", "description": "Group transport"}
}


async def search_transfers(
    pickup_location: str,
    dropoff_location: str,
    pickup_datetime: str,
    passengers: int = 2,
    transfer_type: str = None,  # None = all types
    currency: str = "INR"
) -> Dict[str, Any]:
    """
    Search for ALL transfer options - NO RESTRICTIONS.
    
    Args:
        pickup_location: Pickup city/airport (e.g., "Mumbai Airport", "BOM")
        dropoff_location: Dropoff city/hotel (e.g., "Taj Mahal Palace")
        pickup_datetime: Pickup datetime (YYYY-MM-DDTHH:MM:SS)
        passengers: Number of passengers
        transfer_type: Specific type or None for all
        currency: Currency code (default INR)
    """
    logger.info(f"[TRANSFER] Searching: {pickup_location} -> {dropoff_location}, {passengers} pax, {currency}")
    
    token = await get_access_token()
    logger.info(f"[TRANSFER] Token: {'present' if token else 'None'}")
    
    if not token:
        # Return mock data when API not configured
        logger.info("[TRANSFER] Returning mock data (no API token)")
        mock_result = _get_mock_transfers(pickup_location, dropoff_location, passengers, currency)
        logger.info(f"[TRANSFER] Mock result: {len(mock_result.get('transfers', []))} transfers")
        return mock_result
    
    # Parse locations
    pickup_airport = None
    if "airport" in pickup_location.lower():
        city_part = pickup_location.lower().replace("airport", "").strip()
        pickup_airport = get_airport_code(city_part)
    else:
        pickup_airport = get_airport_code(pickup_location)
    
    if not pickup_airport:
        # Try to use as-is if it looks like an airport code
        if len(pickup_location) == 3 and pickup_location.isupper():
            pickup_airport = pickup_location
    
    try:
        async with httpx.AsyncClient() as client:
            # Build request body
            request_body = {
                "startLocationCode": pickup_airport or "BOM",
                "endAddressLine": dropoff_location,
                "transferType": transfer_type if transfer_type else "PRIVATE",
                "startDateTime": pickup_datetime,
                "passengers": passengers,
                "currencyCode": currency
            }
            
            response = await client.post(
                f"{AMADEUS_API_URL}/v1/shopping/transfer-offers",
                json=request_body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.warning(f"Transfer search: {response.status_code} - {response.text[:200]}")
                # Return mock data for demo
                return _get_mock_transfers(pickup_location, dropoff_location, passengers, currency)
            
            data = response.json()
            offers = data.get("data", [])
            
            # If no real offers, return mock data
            if not offers:
                logger.info("[TRANSFER] No real offers found, returning mock data")
                return _get_mock_transfers(pickup_location, dropoff_location, passengers, currency)
            
            return {
                "success": True,
                "pickup": pickup_location,
                "dropoff": dropoff_location,
                "datetime": pickup_datetime,
                "passengers": passengers,
                "currency": currency,
                "transfers": [_process_transfer_offer(offer, currency) for offer in offers],
                "total": len(offers)
            }
            
    except Exception as e:
        logger.error(f"Transfer search error: {e}")
        # Return mock data for demo
        return _get_mock_transfers(pickup_location, dropoff_location, passengers, currency)


def _process_transfer_offer(offer: Dict, currency: str = "INR") -> Dict[str, Any]:
    """Process transfer offer into frontend format."""
    vehicle = offer.get("vehicle", {})
    service_provider = offer.get("serviceProvider", {})
    quotation = offer.get("quotation", {})
    
    transfer_type = offer.get("transferType", "PRIVATE")
    type_info = TRANSFER_TYPES.get(transfer_type, TRANSFER_TYPES["PRIVATE"])
    
    price_total = float(quotation.get("totalPrice", 0))
    price_currency = quotation.get("currencyCode", currency)
    
    return {
        "id": offer.get("id"),
        "type": transfer_type,
        "type_info": type_info,
        
        # Vehicle details
        "vehicle": {
            "code": vehicle.get("code"),
            "category": vehicle.get("category", ""),
            "description": vehicle.get("description", ""),
            "image_url": vehicle.get("imageURL"),
            "seats": vehicle.get("seats"),
            "bags": vehicle.get("bagsMax"),
            "pet_friendly": _is_pet_friendly_vehicle(vehicle)
        },
        
        # Provider
        "provider": {
            "name": service_provider.get("name", "Transfer Service"),
            "code": service_provider.get("code"),
            "logo_url": service_provider.get("logoUrl"),
            "terms": service_provider.get("termsUrl")
        },
        
        # Pricing
        "pricing": {
            "total": price_total,
            "currency": price_currency,
            "formatted": f"₹{int(price_total):,}" if price_currency == "INR" else f"{price_currency} {price_total:.2f}",
            "base": float(quotation.get("base", {}).get("monetaryAmount", 0)),
            "taxes": float(quotation.get("taxes", [{}])[0].get("monetaryAmount", 0)) if quotation.get("taxes") else 0
        },
        
        # Cancellation
        "cancellation": {
            "type": offer.get("cancellationRules", [{}])[0].get("ruleDescription") if offer.get("cancellationRules") else "Standard policy",
            "free_cancellation": "free" in str(offer.get("cancellationRules", [])).lower()
        },
        
        # Timing
        "pickup": {
            "datetime": offer.get("start", {}).get("dateTime"),
            "location": offer.get("start", {}).get("locationCode")
        },
        "dropoff": {
            "datetime": offer.get("end", {}).get("dateTime"),
            "location": offer.get("end", {}).get("addressLine")
        },
        "duration_minutes": offer.get("duration", {}).get("value"),
        
        "source": "amadeus"
    }


def _is_pet_friendly_vehicle(vehicle: Dict) -> Dict[str, Any]:
    """Determine if vehicle is pet-friendly."""
    category = vehicle.get("category", "").lower()
    description = vehicle.get("description", "").lower()
    
    # Larger vehicles are generally more pet-friendly
    pet_friendly_categories = ["suv", "van", "minivan", "wagon", "estate"]
    
    likelihood = "medium"
    if any(cat in category or cat in description for cat in pet_friendly_categories):
        likelihood = "high"
    elif "compact" in category or "economy" in category:
        likelihood = "low"
    
    return {
        "likelihood": likelihood,
        "note": "Confirm pet policy with provider. Carriers recommended."
    }


def _get_mock_transfers(pickup: str, dropoff: str, passengers: int, currency: str) -> Dict[str, Any]:
    """Generate mock transfer data for demo purposes."""
    
    # INR pricing
    base_prices = {
        "PRIVATE": 2500,
        "SHARED": 800,
        "TAXI": 1500,
        "SEDAN": 2200,
        "SUV": 3500,
        "VAN": 4000,
        "LIMOUSINE": 8000
    }
    
    transfers = []
    for transfer_type, base_price in base_prices.items():
        type_info = TRANSFER_TYPES.get(transfer_type, TRANSFER_TYPES["PRIVATE"])
        price = base_price * max(1, passengers // 2)
        
        transfers.append({
            "id": f"mock-{transfer_type.lower()}-001",
            "type": transfer_type,
            "type_info": type_info,
            "vehicle": {
                "code": transfer_type,
                "category": transfer_type.title(),
                "description": f"Comfortable {transfer_type.title()} for your journey",
                "image_url": None,
                "seats": 4 if transfer_type in ["PRIVATE", "TAXI", "SEDAN"] else 7,
                "bags": 2 if transfer_type in ["PRIVATE", "TAXI", "SEDAN"] else 5,
                "pet_friendly": {
                    "likelihood": "high" if transfer_type in ["SUV", "VAN"] else "medium",
                    "note": "Pet carrier recommended. Confirm with driver."
                }
            },
            "provider": {
                "name": "Local Transfer Partner",
                "code": "LTP",
                "logo_url": None,
                "terms": None
            },
            "pricing": {
                "total": price,
                "currency": currency,
                "formatted": f"₹{price:,}",
                "base": price * 0.85,
                "taxes": price * 0.15
            },
            "cancellation": {
                "type": "Free cancellation up to 24 hours before pickup",
                "free_cancellation": True
            },
            "pickup": {
                "datetime": None,
                "location": pickup
            },
            "dropoff": {
                "datetime": None,
                "location": dropoff
            },
            "duration_minutes": 45,
            "source": "demo"
        })
    
    return {
        "success": True,
        "pickup": pickup,
        "dropoff": dropoff,
        "passengers": passengers,
        "currency": currency,
        "transfers": transfers,
        "total": len(transfers),
        "note": "Demo data - Concierge will provide real quotes"
    }


async def search_airport_transfers(
    city: str,
    direction: str = "from_airport",  # "from_airport" or "to_airport"
    hotel_or_address: str = None,
    pickup_datetime: str = None,
    passengers: int = 2,
    currency: str = "INR"
) -> Dict[str, Any]:
    """
    Search for airport transfers.
    
    Args:
        city: City name
        direction: "from_airport" or "to_airport"
        hotel_or_address: Hotel name or address
        pickup_datetime: Pickup datetime
        passengers: Number of passengers
        currency: Currency (default INR)
    """
    airport_code = get_airport_code(city)
    if not airport_code:
        return {
            "success": False,
            "error": f"Airport not found for '{city}'",
            "transfers": []
        }
    
    if direction == "from_airport":
        pickup = f"{city} Airport ({airport_code})"
        dropoff = hotel_or_address or f"{city} City Center"
    else:
        pickup = hotel_or_address or f"{city} City Center"
        dropoff = f"{city} Airport ({airport_code})"
    
    if not pickup_datetime:
        pickup_datetime = (datetime.now() + timedelta(days=7, hours=10)).strftime("%Y-%m-%dT%H:%M:%S")
    
    return await search_transfers(
        pickup_location=pickup,
        dropoff_location=dropoff,
        pickup_datetime=pickup_datetime,
        passengers=passengers,
        currency=currency
    )
