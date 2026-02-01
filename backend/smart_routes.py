"""
Smart Recommendations Engine
AI-powered personalized product and service recommendations based on:
- Pet Soul profile (allergies, preferences, health conditions)
- Breed-specific health needs
- Upcoming celebrations (birthdays, gotcha days)
- Purchase history and preferences
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import random
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/smart", tags=["Smart Recommendations"])

# Breed-specific product recommendations
BREED_RECOMMENDATIONS = {
    'shih tzu': {
        'priority_products': ['eye_care', 'dental_care', 'grooming'],
        'health_focus': ['breathing_support', 'eye_drops', 'tear_stain_remover'],
        'avoid': ['intense_exercise_toys'],
        'tips': ['Daily eye cleaning recommended', 'Use harness instead of collar']
    },
    'golden retriever': {
        'priority_products': ['joint_support', 'weight_management', 'swimming_toys'],
        'health_focus': ['glucosamine', 'hip_supplements', 'cancer_screening'],
        'avoid': ['high_calorie_treats'],
        'tips': ['Watch weight carefully', 'Annual hip screening recommended']
    },
    'labrador retriever': {
        'priority_products': ['portion_control', 'puzzle_feeders', 'active_toys'],
        'health_focus': ['weight_management', 'ear_care', 'joint_support'],
        'avoid': ['free_feeding', 'unlimited_treats'],
        'tips': ['Strict portion control essential', 'Clean ears weekly']
    },
    'german shepherd': {
        'priority_products': ['joint_support', 'digestive_health', 'training_tools'],
        'health_focus': ['hip_supplements', 'probiotics', 'dm_screening'],
        'avoid': ['single_large_meals'],
        'tips': ['Multiple small meals to prevent bloat', 'Early joint support']
    },
    'indian pariah': {
        'priority_products': ['tick_prevention', 'active_toys', 'basic_nutrition'],
        'health_focus': ['tick_flea_treatment', 'deworming'],
        'avoid': [],
        'tips': ['Monthly tick prevention essential', 'Generally very healthy breed']
    },
    'french bulldog': {
        'priority_products': ['cooling_products', 'skin_care', 'slow_feeders'],
        'health_focus': ['breathing_support', 'skin_fold_care', 'temperature_management'],
        'avoid': ['strenuous_exercise', 'hot_weather_activities'],
        'tips': ['Keep in AC', 'Never fly in cargo', 'Clean face folds daily']
    },
    'pomeranian': {
        'priority_products': ['dental_care', 'harness', 'coat_care'],
        'health_focus': ['dental_treats', 'trachea_support', 'blood_sugar_management'],
        'avoid': ['collars', 'long_exercise_sessions'],
        'tips': ['Small frequent meals', 'Daily teeth brushing ideal']
    },
    'beagle': {
        'priority_products': ['puzzle_feeders', 'ear_care', 'scent_toys'],
        'health_focus': ['weight_management', 'ear_cleaning', 'thyroid_support'],
        'avoid': ['free_feeding', 'unsecured_areas'],
        'tips': ['Strict portion control', 'Secure fencing required']
    },
    'pug': {
        'priority_products': ['cooling_products', 'eye_care', 'weight_management'],
        'health_focus': ['breathing_support', 'eye_protection', 'skin_fold_care'],
        'avoid': ['hot_weather', 'intense_exercise'],
        'tips': ['Heat intolerant - AC essential', 'Check eyes daily']
    },
    'siberian husky': {
        'priority_products': ['cooling_products', 'grooming_tools', 'exercise_equipment'],
        'health_focus': ['eye_care', 'coat_care', 'zinc_supplements'],
        'avoid': ['hot_climate_activities'],
        'tips': ['Not suited for hot Indian climate without AC', '2+ hours exercise daily']
    }
}

# Product category mappings
PRODUCT_CATEGORIES = {
    'joint_support': {'keywords': ['joint', 'glucosamine', 'hip', 'mobility', 'arthritis'], 'pillar': 'fit'},
    'dental_care': {'keywords': ['dental', 'teeth', 'oral', 'breath'], 'pillar': 'care'},
    'eye_care': {'keywords': ['eye', 'tear', 'vision', 'optical'], 'pillar': 'care'},
    'ear_care': {'keywords': ['ear', 'hearing', 'cleaning'], 'pillar': 'care'},
    'grooming': {'keywords': ['groom', 'brush', 'shampoo', 'coat', 'fur'], 'pillar': 'care'},
    'tick_prevention': {'keywords': ['tick', 'flea', 'nexgard', 'frontline', 'parasite'], 'pillar': 'care'},
    'weight_management': {'keywords': ['weight', 'diet', 'calorie', 'lean', 'portion'], 'pillar': 'feed'},
    'cooling_products': {'keywords': ['cool', 'summer', 'temperature', 'heat'], 'pillar': 'care'},
    'puzzle_feeders': {'keywords': ['puzzle', 'slow', 'feeder', 'enrichment', 'mental'], 'pillar': 'feed'},
    'active_toys': {'keywords': ['toy', 'play', 'fetch', 'ball', 'active'], 'pillar': 'play'},
    'training_tools': {'keywords': ['train', 'clicker', 'treat', 'behavior'], 'pillar': 'learn'},
    'skin_care': {'keywords': ['skin', 'allergy', 'itch', 'derma'], 'pillar': 'care'},
    'digestive_health': {'keywords': ['digest', 'probiotic', 'stomach', 'gut'], 'pillar': 'feed'},
    'birthday': {'keywords': ['birthday', 'cake', 'party', 'celebration'], 'pillar': 'celebrate'},
    'gift': {'keywords': ['gift', 'present', 'special', 'surprise'], 'pillar': 'celebrate'}
}

def get_db():
    from server import db
    return db


def normalize_breed(breed: str) -> str:
    """Normalize breed name for matching"""
    if not breed:
        return 'unknown'
    
    breed = breed.lower().strip()
    variations = {
        'shihtzu': 'shih tzu',
        'shitzu': 'shih tzu',
        'golden': 'golden retriever',
        'lab': 'labrador retriever',
        'labrador': 'labrador retriever',
        'gsd': 'german shepherd',
        'alsatian': 'german shepherd',
        'indie': 'indian pariah',
        'desi': 'indian pariah',
        'frenchie': 'french bulldog',
        'pom': 'pomeranian',
        'husky': 'siberian husky'
    }
    
    # Remove spaces for matching
    no_spaces = breed.replace(' ', '')
    if no_spaces in variations:
        return variations[no_spaces]
    if breed in variations:
        return variations[breed]
    
    return breed


async def get_breed_products(db, breed: str, limit: int = 6) -> List[dict]:
    """Get products recommended for a specific breed"""
    normalized = normalize_breed(breed)
    breed_info = BREED_RECOMMENDATIONS.get(normalized, {})
    
    priority_categories = breed_info.get('priority_products', [])
    if not priority_categories:
        # Default categories for unknown breeds
        priority_categories = ['basic_nutrition', 'grooming', 'active_toys']
    
    # Build search keywords
    all_keywords = []
    for cat in priority_categories:
        if cat in PRODUCT_CATEGORIES:
            all_keywords.extend(PRODUCT_CATEGORIES[cat]['keywords'])
    
    if not all_keywords:
        all_keywords = ['health', 'care', 'nutrition']
    
    # Search unified_products
    products = []
    for keyword in all_keywords[:5]:  # Limit keyword searches
        query = {
            '$or': [
                {'name': {'$regex': keyword, '$options': 'i'}},
                {'description': {'$regex': keyword, '$options': 'i'}},
                {'tags': {'$in': [keyword]}}
            ],
            'is_active': {'$ne': False}
        }
        found = await db.unified_products.find(query, {'_id': 0}).limit(3).to_list(3)
        for p in found:
            if p not in products and len(products) < limit:
                products.append(p)
    
    return products[:limit]


async def get_allergy_safe_products(db, allergies: List[str], limit: int = 6) -> List[dict]:
    """Get products that are safe for pets with specific allergies"""
    if not allergies:
        return []
    
    # Build exclusion query
    exclude_keywords = []
    for allergy in allergies:
        # Handle case where allergy might be a list or non-string
        if isinstance(allergy, list):
            allergy = ' '.join(str(a) for a in allergy)
        if not isinstance(allergy, str):
            continue
        allergy_lower = allergy.lower()
        if 'chicken' in allergy_lower:
            exclude_keywords.extend(['chicken', 'poultry'])
        elif 'grain' in allergy_lower:
            exclude_keywords.extend(['grain', 'wheat', 'corn', 'rice'])
        elif 'beef' in allergy_lower:
            exclude_keywords.extend(['beef', 'cattle'])
        elif 'dairy' in allergy_lower:
            exclude_keywords.extend(['dairy', 'milk', 'cheese'])
    
    # Find products without allergens
    if exclude_keywords:
        query = {
            '$and': [
                {'is_active': {'$ne': False}},
                *[{'name': {'$not': {'$regex': kw, '$options': 'i'}}} for kw in exclude_keywords[:3]],
                *[{'description': {'$not': {'$regex': kw, '$options': 'i'}}} for kw in exclude_keywords[:3]]
            ]
        }
    else:
        query = {'is_active': {'$ne': False}}
    
    products = await db.unified_products.find(query, {'_id': 0}).limit(limit).to_list(limit)
    return products


async def get_birthday_gifts(db, pet_name: str, days_until: int, limit: int = 4) -> List[dict]:
    """Get birthday gift suggestions"""
    # Search for celebration/birthday products
    query = {
        '$or': [
            {'name': {'$regex': 'birthday|cake|party|celebration|gift', '$options': 'i'}},
            {'tags': {'$in': ['birthday', 'celebration', 'gift', 'party']}},
            {'pillar': 'celebrate'}
        ],
        'is_active': {'$ne': False}
    }
    
    products = await db.unified_products.find(query, {'_id': 0}).limit(limit).to_list(limit)
    
    # Add urgency based on days until birthday
    for p in products:
        if days_until <= 3:
            p['urgency'] = 'Order now for on-time delivery!'
            p['urgency_level'] = 'high'
        elif days_until <= 7:
            p['urgency'] = f'Order soon - {days_until} days left!'
            p['urgency_level'] = 'medium'
        else:
            p['urgency'] = f'Plan ahead - {days_until} days until {pet_name}\'s special day'
            p['urgency_level'] = 'low'
    
    return products


@router.get("/recommendations/{user_id}")
async def get_smart_recommendations(
    user_id: str,
    pet_id: Optional[str] = None,
    limit: int = 12
):
    """
    Get personalized recommendations for a user based on their pets' profiles.
    user_id can be the user's ID or email address.
    
    Returns:
    - breed_picks: Products recommended based on breed health needs
    - allergy_safe: Products safe for pets with allergies
    - birthday_gifts: Upcoming birthday gift suggestions
    - health_essentials: Based on health conditions
    - mira_picks: AI-curated top picks combining all factors
    """
    db = get_db()
    
    # Get user's pets - try by pet_id first, then by user_id/email
    if pet_id:
        pet = await db.pets.find_one({'id': pet_id}, {'_id': 0})
        pets = [pet] if pet else []
    else:
        # Try finding by user_id first, then by owner_email
        pets = await db.pets.find({'user_id': user_id}, {'_id': 0}).to_list(10)
        if not pets:
            # Try by owner_email (user_id might be an email)
            pets = await db.pets.find({'owner_email': user_id}, {'_id': 0}).to_list(10)
        if not pets:
            # Try getting user by id and then their email
            user = await db.users.find_one({'id': user_id}, {'_id': 0})
            if user and user.get('email'):
                pets = await db.pets.find({'owner_email': user['email']}, {'_id': 0}).to_list(10)
    
    if not pets:
        # Return generic recommendations for users without pets
        generic_products = await db.unified_products.find(
            {'is_active': {'$ne': False}, 'is_featured': True},
            {'_id': 0}
        ).limit(limit).to_list(limit)
        
        return {
            'mira_picks': generic_products[:6],
            'breed_picks': [],
            'allergy_safe': [],
            'birthday_gifts': [],
            'health_essentials': [],
            'insights': ['Add your pet to get personalized recommendations!']
        }
    
    recommendations = {
        'breed_picks': [],
        'allergy_safe': [],
        'birthday_gifts': [],
        'health_essentials': [],
        'mira_picks': [],
        'insights': [],
        'upcoming_events': []
    }
    
    # Process each pet
    all_allergies = []
    all_health_conditions = []
    primary_pet = pets[0]  # Use first pet as primary for display
    
    for pet in pets:
        pet_name = pet.get('name', 'Your pet')
        breed = pet.get('breed', '')
        
        # 1. Breed-specific recommendations
        if breed:
            breed_products = await get_breed_products(db, breed, limit=4)
            for p in breed_products:
                p['reason'] = f"Recommended for {breed}s"
                p['pet_name'] = pet_name
            recommendations['breed_picks'].extend(breed_products)
            
            # Add breed insights
            normalized = normalize_breed(breed)
            breed_info = BREED_RECOMMENDATIONS.get(normalized, {})
            if breed_info.get('tips'):
                recommendations['insights'].extend([
                    f"💡 {pet_name} ({breed}): {tip}" 
                    for tip in breed_info['tips'][:2]
                ])
        
        # 2. Allergy-safe products
        soul_answers = pet.get('doggy_soul_answers', {})
        allergies = soul_answers.get('food_allergies', '')
        if allergies and allergies != 'No allergies':
            # Handle list or string allergies
            if isinstance(allergies, list):
                all_allergies.extend([str(a) for a in allergies if a])
            elif isinstance(allergies, str):
                all_allergies.append(allergies)
        
        # 3. Birthday gifts
        birthday = pet.get('birthday')
        if birthday:
            try:
                bday = datetime.fromisoformat(birthday.replace('Z', '+00:00')) if isinstance(birthday, str) else birthday
                now = datetime.now(timezone.utc)
                
                # Calculate days until next birthday
                next_bday = bday.replace(year=now.year)
                if next_bday < now:
                    next_bday = next_bday.replace(year=now.year + 1)
                
                days_until = (next_bday - now).days
                
                if days_until <= 30:
                    gifts = await get_birthday_gifts(db, pet_name, days_until)
                    recommendations['birthday_gifts'].extend(gifts)
                    recommendations['upcoming_events'].append({
                        'type': 'birthday',
                        'pet_name': pet_name,
                        'date': next_bday.isoformat(),
                        'days_until': days_until,
                        'message': f"🎂 {pet_name}'s birthday in {days_until} days!"
                    })
            except Exception:
                pass
        
        # 4. Health conditions
        health = pet.get('health', {})
        conditions = health.get('medical_conditions', '')
        if conditions:
            all_health_conditions.append(conditions)
    
    # Get allergy-safe products
    if all_allergies:
        # Flatten and stringify allergies
        flat_allergies = []
        for a in all_allergies:
            if isinstance(a, str):
                flat_allergies.append(a)
            elif isinstance(a, list):
                flat_allergies.extend([str(x) for x in a if x])
        
        if flat_allergies:
            allergy_products = await get_allergy_safe_products(db, flat_allergies, limit=4)
            for p in allergy_products:
                p['reason'] = f"Safe for pets with {', '.join(flat_allergies[:3])}"
            recommendations['allergy_safe'] = allergy_products
    
    # 5. Create Mira's Picks - Use admin-curated picks first, then fall back to algorithm
    mira_picks = []
    
    # PRIORITY 0: Check for admin-curated Mira picks
    admin_picks = await db.mira_picks.find({"is_active": True}).sort("priority", -1).limit(6).to_list(6)
    if admin_picks:
        admin_product_ids = [p.get("product_id") for p in admin_picks]
        admin_products = await db.products.find({"id": {"$in": admin_product_ids}}).to_list(10)
        admin_product_map = {p["id"]: p for p in admin_products}
        
        for pick in admin_picks:
            product = admin_product_map.get(pick.get("product_id"))
            if product:
                product.pop("_id", None)
                product["reason"] = pick.get("reason", "Mira's top pick!")
                product["mira_tagline"] = pick.get("display_tagline")
                product["mira_voice_script"] = pick.get("voice_script")
                product["is_admin_curated"] = True
                mira_picks.append(product)
        
        logger.info(f"[MIRA PICKS] Using {len(mira_picks)} admin-curated picks")
    
    # FALLBACK: If no admin picks, use algorithmic selection
    if not mira_picks:
        # Priority 1: Birthday gifts if upcoming
        if recommendations['birthday_gifts']:
            mira_picks.extend(recommendations['birthday_gifts'][:2])
        
        # Priority 2: Allergy-safe if pet has allergies
        if recommendations['allergy_safe']:
            mira_picks.extend(recommendations['allergy_safe'][:2])
        
        # Priority 3: Breed-specific
        if recommendations['breed_picks']:
            mira_picks.extend(recommendations['breed_picks'][:3])
    
    # Fill remaining with featured products
    if len(mira_picks) < 6:
        featured = await db.unified_products.find(
            {'is_active': {'$ne': False}, 'is_featured': True},
            {'_id': 0}
        ).limit(6 - len(mira_picks)).to_list(6 - len(mira_picks))
        mira_picks.extend(featured)
    
    # Deduplicate
    seen_ids = set()
    unique_picks = []
    for p in mira_picks:
        pid = p.get('id')
        if pid and pid not in seen_ids:
            seen_ids.add(pid)
            unique_picks.append(p)
    
    recommendations['mira_picks'] = unique_picks[:6]
    
    # Add personalization context
    recommendations['primary_pet'] = {
        'name': primary_pet.get('name'),
        'breed': primary_pet.get('breed'),
        'photo_url': primary_pet.get('photo_url')
    }
    
    return recommendations


@router.get("/mira-context/{pet_id}")
async def get_mira_context(pet_id: str):
    """
    Get breed-specific context for Mira AI to use in conversations.
    This enriches Mira's responses with personalized health tips.
    """
    db = get_db()
    
    pet = await db.pets.find_one({'id': pet_id}, {'_id': 0})
    if not pet:
        return {'context': None}
    
    breed = pet.get('breed', '')
    normalized = normalize_breed(breed)
    breed_info = BREED_RECOMMENDATIONS.get(normalized, {})
    
    # Get soul answers for additional context
    soul_answers = pet.get('doggy_soul_answers', {})
    
    context = {
        'pet_name': pet.get('name'),
        'breed': breed,
        'breed_normalized': normalized,
        'species': pet.get('species', 'dog'),
        'age': None,  # Calculate from birthday if available
        'health_focus': breed_info.get('health_focus', []),
        'priority_products': breed_info.get('priority_products', []),
        'avoid': breed_info.get('avoid', []),
        'care_tips': breed_info.get('tips', []),
        'allergies': soul_answers.get('food_allergies'),
        'temperament': soul_answers.get('temperament'),
        'energy_level': soul_answers.get('energy_level'),
        'dietary_preferences': soul_answers.get('favorite_protein')
    }
    
    # Calculate age
    birthday = pet.get('birthday')
    if birthday:
        try:
            bday = datetime.fromisoformat(birthday.replace('Z', '+00:00')) if isinstance(birthday, str) else birthday
            age_days = (datetime.now(timezone.utc) - bday).days
            context['age_years'] = round(age_days / 365, 1)
            context['life_stage'] = 'puppy' if age_days < 365 else ('senior' if age_days > 2555 else 'adult')
        except Exception:
            pass
    
    return {'context': context}


@router.get("/birthday-reminders")
async def get_birthday_reminders(days_ahead: int = 30):
    """Get all pets with birthdays in the next N days for reminder notifications"""
    db = get_db()
    
    now = datetime.now(timezone.utc)
    reminders = []
    
    # Get all pets with birthdays
    pets = await db.pets.find({'birthday': {'$exists': True}}, {'_id': 0}).to_list(1000)
    
    for pet in pets:
        birthday = pet.get('birthday')
        if not birthday:
            continue
            
        try:
            bday = datetime.fromisoformat(birthday.replace('Z', '+00:00')) if isinstance(birthday, str) else birthday
            
            # Calculate next birthday
            next_bday = bday.replace(year=now.year)
            if next_bday < now:
                next_bday = next_bday.replace(year=now.year + 1)
            
            days_until = (next_bday - now).days
            
            if 0 <= days_until <= days_ahead:
                reminders.append({
                    'pet_id': pet.get('id'),
                    'pet_name': pet.get('name'),
                    'user_id': pet.get('user_id'),
                    'birthday': next_bday.isoformat(),
                    'days_until': days_until,
                    'turning_age': now.year - bday.year + (1 if next_bday.year > now.year else 0)
                })
        except Exception:
            continue
    
    # Sort by days until
    reminders.sort(key=lambda x: x['days_until'])
    
    return {'reminders': reminders, 'total': len(reminders)}
