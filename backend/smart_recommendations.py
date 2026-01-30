"""
Smart Recommendations Engine
AI-powered product and service recommendations based on pet profile
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import logging
import os
import json

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

# Database reference (will be set by server.py)
db = None

def set_database(database):
    global db
    db = database

def get_db():
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return db

logger = logging.getLogger(__name__)

# Breed-specific needs mapping
BREED_NEEDS = {
    # High-energy breeds
    "labrador retriever": {"exercise": "high", "grooming": "medium", "training": "high", "nutrition": ["joint_support", "weight_management"]},
    "golden retriever": {"exercise": "high", "grooming": "high", "training": "high", "nutrition": ["joint_support", "coat_health"]},
    "german shepherd": {"exercise": "very_high", "grooming": "high", "training": "very_high", "nutrition": ["joint_support", "digestive_health"]},
    "border collie": {"exercise": "very_high", "grooming": "medium", "training": "very_high", "nutrition": ["energy_support"]},
    "husky": {"exercise": "very_high", "grooming": "very_high", "training": "high", "nutrition": ["coat_health", "energy_support"]},
    "australian shepherd": {"exercise": "very_high", "grooming": "high", "training": "very_high", "nutrition": ["energy_support"]},
    "beagle": {"exercise": "high", "grooming": "low", "training": "medium", "nutrition": ["weight_management"]},
    
    # Medium-energy breeds
    "cocker spaniel": {"exercise": "medium", "grooming": "very_high", "training": "medium", "nutrition": ["ear_health", "coat_health"]},
    "poodle": {"exercise": "medium", "grooming": "very_high", "training": "high", "nutrition": ["skin_health", "coat_health"]},
    "shih tzu": {"exercise": "low", "grooming": "very_high", "training": "low", "nutrition": ["dental_health", "eye_health"]},
    "maltese": {"exercise": "low", "grooming": "very_high", "training": "low", "nutrition": ["dental_health", "coat_health"]},
    
    # Large breeds
    "great dane": {"exercise": "medium", "grooming": "low", "training": "medium", "nutrition": ["joint_support", "heart_health"]},
    "rottweiler": {"exercise": "high", "grooming": "medium", "training": "very_high", "nutrition": ["joint_support", "weight_management"]},
    "mastiff": {"exercise": "low", "grooming": "low", "training": "medium", "nutrition": ["joint_support", "weight_management"]},
    
    # Small breeds
    "chihuahua": {"exercise": "low", "grooming": "low", "training": "medium", "nutrition": ["dental_health", "weight_management"]},
    "pomeranian": {"exercise": "low", "grooming": "very_high", "training": "medium", "nutrition": ["dental_health", "coat_health"]},
    "yorkshire terrier": {"exercise": "low", "grooming": "very_high", "training": "medium", "nutrition": ["dental_health", "digestive_health"]},
    
    # Brachycephalic breeds (flat-faced)
    "bulldog": {"exercise": "low", "grooming": "medium", "training": "low", "nutrition": ["weight_management", "digestive_health", "skin_health"]},
    "french bulldog": {"exercise": "low", "grooming": "medium", "training": "low", "nutrition": ["weight_management", "skin_health"]},
    "pug": {"exercise": "low", "grooming": "medium", "training": "low", "nutrition": ["weight_management", "eye_health", "skin_health"]},
    
    # Indian breeds
    "indian spitz": {"exercise": "medium", "grooming": "high", "training": "medium", "nutrition": ["coat_health"]},
    "rajapalayam": {"exercise": "high", "grooming": "low", "training": "high", "nutrition": ["joint_support"]},
    "mudhol hound": {"exercise": "very_high", "grooming": "low", "training": "high", "nutrition": ["energy_support"]},
    "indian pariah": {"exercise": "medium", "grooming": "low", "training": "medium", "nutrition": ["digestive_health"]},
}

# Age-based needs
AGE_NEEDS = {
    "puppy": {  # < 1 year
        "priority_services": ["training", "vaccination", "socialization"],
        "nutrition_focus": ["growth_support", "puppy_nutrition", "immune_support"],
        "products": ["puppy_food", "training_treats", "toys", "crate"]
    },
    "young_adult": {  # 1-3 years
        "priority_services": ["training", "exercise", "grooming"],
        "nutrition_focus": ["energy_support", "muscle_development"],
        "products": ["adult_food", "active_toys", "dental_chews"]
    },
    "adult": {  # 3-7 years
        "priority_services": ["wellness", "grooming", "dental"],
        "nutrition_focus": ["maintenance", "weight_management"],
        "products": ["adult_food", "dental_products", "supplements"]
    },
    "senior": {  # 7+ years
        "priority_services": ["wellness", "mobility", "senior_care"],
        "nutrition_focus": ["joint_support", "senior_nutrition", "cognitive_health"],
        "products": ["senior_food", "joint_supplements", "orthopedic_bed"]
    }
}

def get_age_category(age_years: float) -> str:
    """Determine age category from years"""
    if age_years < 1:
        return "puppy"
    elif age_years < 3:
        return "young_adult"
    elif age_years < 7:
        return "adult"
    else:
        return "senior"

def calculate_pet_age(dob_str: str) -> float:
    """Calculate pet age in years from DOB string"""
    try:
        if not dob_str:
            return 3.0  # Default to adult
        dob = datetime.fromisoformat(dob_str.replace('Z', '+00:00'))
        age_days = (datetime.now(timezone.utc) - dob).days
        return age_days / 365.25
    except:
        return 3.0


@router.get("/pet/{pet_id}")
async def get_pet_recommendations(pet_id: str, limit: int = 10):
    """
    Get personalized recommendations for a specific pet based on:
    - Breed characteristics
    - Age and life stage
    - Health conditions
    - Activity level
    - Recent activity
    """
    db = get_db()
    
    # Get pet profile
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    recommendations = []
    
    # Extract pet details
    breed = (pet.get("identity", {}).get("breed") or pet.get("breed") or "").lower()
    dob = pet.get("identity", {}).get("dob") or pet.get("dob")
    age_years = calculate_pet_age(dob) if dob else 3.0
    age_category = get_age_category(age_years)
    health_conditions = pet.get("health", {}).get("conditions") or pet.get("health_conditions") or []
    weight = pet.get("identity", {}).get("weight") or pet.get("weight")
    
    # Get breed-specific needs
    breed_needs = BREED_NEEDS.get(breed, {
        "exercise": "medium", 
        "grooming": "medium", 
        "training": "medium",
        "nutrition": []
    })
    
    # Get age-specific needs
    age_needs = AGE_NEEDS.get(age_category, AGE_NEEDS["adult"])
    
    # Build recommendation context
    context = {
        "pet_name": pet.get("name"),
        "breed": breed.title() if breed else "Mixed Breed",
        "age_years": round(age_years, 1),
        "age_category": age_category,
        "breed_needs": breed_needs,
        "age_needs": age_needs,
        "health_conditions": health_conditions
    }
    
    # 1. Service Recommendations
    service_recs = []
    
    # Grooming based on breed needs
    if breed_needs.get("grooming") in ["high", "very_high"]:
        service_recs.append({
            "type": "service",
            "category": "grooming",
            "title": f"Regular Grooming for {context['breed']}",
            "description": f"{context['breed']}s need frequent grooming to maintain their coat. We recommend professional grooming every 4-6 weeks.",
            "priority": "high",
            "reason": f"Based on {context['breed']} coat requirements",
            "cta": "Book Grooming",
            "link": "/care?type=grooming"
        })
    
    # Training for high-energy or training-intensive breeds
    if breed_needs.get("training") in ["high", "very_high"] or age_category == "puppy":
        service_recs.append({
            "type": "service",
            "category": "training",
            "title": f"Training Programme for {pet.get('name')}",
            "description": f"{'Puppies' if age_category == 'puppy' else context['breed'] + 's'} benefit greatly from structured training. Start or continue building good habits.",
            "priority": "high" if age_category == "puppy" else "medium",
            "reason": f"{'Puppy foundation training window' if age_category == 'puppy' else 'Breed intelligence requires mental stimulation'}",
            "cta": "Explore Training",
            "link": "/care?type=training"
        })
    
    # Exercise recommendations
    if breed_needs.get("exercise") in ["high", "very_high"]:
        service_recs.append({
            "type": "service",
            "category": "walks",
            "title": f"Daily Exercise Plan for {pet.get('name')}",
            "description": f"{context['breed']}s are high-energy dogs that need {90 if breed_needs.get('exercise') == 'very_high' else 60}+ minutes of exercise daily.",
            "priority": "high",
            "reason": f"High-energy breed requires regular exercise",
            "cta": "Book Dog Walker",
            "link": "/care?type=walks"
        })
    
    # Wellness check for seniors
    if age_category == "senior":
        service_recs.append({
            "type": "service",
            "category": "wellness",
            "title": f"Senior Wellness Check for {pet.get('name')}",
            "description": f"At {round(age_years)} years old, regular health screenings help catch issues early. Recommended every 6 months for senior pets.",
            "priority": "high",
            "reason": "Senior pets need more frequent health monitoring",
            "cta": "Schedule Checkup",
            "link": "/care?type=vet_coordination"
        })
    
    recommendations.extend(service_recs[:3])  # Top 3 service recommendations
    
    # 2. Nutrition Recommendations
    nutrition_recs = []
    combined_nutrition_needs = list(set(breed_needs.get("nutrition", []) + age_needs.get("nutrition_focus", [])))
    
    for need in combined_nutrition_needs[:2]:
        need_descriptions = {
            "joint_support": ("Joint Health Support", "Glucosamine and chondroitin supplements to support joint health and mobility."),
            "weight_management": ("Weight Management", "Portion-controlled feeding and low-calorie treats to maintain healthy weight."),
            "coat_health": ("Coat & Skin Nutrition", "Omega-3 and omega-6 fatty acids for a shiny, healthy coat."),
            "dental_health": ("Dental Care Nutrition", "Dental chews and food formulated to reduce plaque and tartar buildup."),
            "digestive_health": ("Digestive Support", "Probiotics and easily digestible proteins for sensitive stomachs."),
            "energy_support": ("Active Dog Nutrition", "High-protein diet to fuel an active lifestyle."),
            "growth_support": ("Puppy Growth Formula", "Balanced nutrition with DHA for healthy brain and body development."),
            "puppy_nutrition": ("Puppy Starter Pack", "Complete puppy nutrition with appropriate protein and calcium levels."),
            "senior_nutrition": ("Senior Diet Plan", "Lower calorie, joint-supporting nutrition for golden years."),
            "cognitive_health": ("Brain Health Support", "DHA and antioxidants to support cognitive function in senior dogs."),
            "immune_support": ("Immune System Boost", "Vitamins and antioxidants to build a strong immune system."),
            "skin_health": ("Skin Health Formula", "Zinc and vitamin E for healthy skin and reduced allergies."),
            "eye_health": ("Eye Care Nutrition", "Antioxidants and vitamins for eye health."),
            "ear_health": ("Ear Health Support", "Anti-inflammatory ingredients for breeds prone to ear issues."),
            "heart_health": ("Heart Health Support", "Taurine and L-carnitine for cardiovascular health."),
        }
        
        title, desc = need_descriptions.get(need, (need.replace("_", " ").title(), "Specialized nutrition support."))
        
        nutrition_recs.append({
            "type": "product",
            "category": "nutrition",
            "title": title,
            "description": desc,
            "priority": "medium",
            "reason": f"Recommended for {context['breed'] if breed else 'your pet'}'s {age_category} stage",
            "cta": "View Options",
            "link": "/care?type=feed"
        })
    
    recommendations.extend(nutrition_recs)
    
    # 3. Product Recommendations based on age
    product_recs = []
    for product_type in age_needs.get("products", [])[:2]:
        product_info = {
            "puppy_food": ("Premium Puppy Food", "Age-appropriate nutrition for growing puppies", "/dine?category=puppy"),
            "adult_food": ("Adult Dog Food", "Complete nutrition for adult dogs", "/dine?category=adult"),
            "senior_food": ("Senior Dog Food", "Gentle nutrition for senior dogs", "/dine?category=senior"),
            "training_treats": ("Training Treats", "Low-calorie treats perfect for training sessions", "/dine?category=treats"),
            "toys": ("Interactive Toys", "Mental stimulation and entertainment", "/enjoy?category=toys"),
            "dental_chews": ("Dental Chews", "Keep teeth clean while your dog enjoys a tasty treat", "/dine?category=dental"),
            "joint_supplements": ("Joint Supplements", "Support mobility and joint health", "/care?type=feed"),
            "orthopedic_bed": ("Orthopedic Pet Bed", "Comfortable support for older joints", "/enjoy?category=beds"),
        }
        
        if product_type in product_info:
            title, desc, link = product_info[product_type]
            product_recs.append({
                "type": "product",
                "category": product_type,
                "title": title,
                "description": desc,
                "priority": "low",
                "reason": f"Popular choice for {age_category} dogs",
                "cta": "Shop Now",
                "link": link
            })
    
    recommendations.extend(product_recs)
    
    # 4. Upcoming Events/Celebrations
    # Check for upcoming birthday
    if dob:
        try:
            dob_date = datetime.fromisoformat(dob.replace('Z', '+00:00'))
            next_birthday = dob_date.replace(year=datetime.now().year)
            if next_birthday < datetime.now(timezone.utc):
                next_birthday = next_birthday.replace(year=datetime.now().year + 1)
            
            days_until = (next_birthday - datetime.now(timezone.utc)).days
            
            if 0 <= days_until <= 30:
                recommendations.append({
                    "type": "celebration",
                    "category": "birthday",
                    "title": f"🎂 {pet.get('name')}'s Birthday Coming Up!",
                    "description": f"Only {days_until} days until {pet.get('name')}'s birthday! Plan a special celebration.",
                    "priority": "high" if days_until <= 7 else "medium",
                    "reason": f"Birthday on {next_birthday.strftime('%B %d')}",
                    "cta": "Plan Celebration",
                    "link": f"/celebrate?pet={pet_id}"
                })
        except:
            pass
    
    # Sort by priority and limit
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: priority_order.get(x.get("priority", "low"), 2))
    
    return {
        "pet_id": pet_id,
        "pet_name": pet.get("name"),
        "context": context,
        "recommendations": recommendations[:limit],
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/dashboard")
async def get_dashboard_recommendations(user_id: Optional[str] = None, limit: int = 6):
    """Get recommendations for dashboard - aggregated across all user's pets"""
    db = get_db()
    
    if not user_id:
        # Return generic recommendations
        return {
            "recommendations": [
                {
                    "type": "service",
                    "category": "general",
                    "title": "Complete Your Pet Profile",
                    "description": "Add your pet's details to get personalized recommendations",
                    "priority": "high",
                    "cta": "Add Pet",
                    "link": "/add-pet"
                }
            ],
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Get user's pets
    pets = await db.pets.find({"user_id": user_id}, {"_id": 0}).to_list(10)
    
    if not pets:
        return {
            "recommendations": [
                {
                    "type": "service",
                    "category": "general",
                    "title": "Add Your First Pet",
                    "description": "Get started by adding your pet's profile",
                    "priority": "high",
                    "cta": "Add Pet",
                    "link": "/add-pet"
                }
            ],
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Aggregate recommendations from all pets
    all_recommendations = []
    
    for pet in pets[:3]:  # Limit to first 3 pets for performance
        try:
            pet_recs = await get_pet_recommendations(pet["id"], limit=4)
            for rec in pet_recs.get("recommendations", []):
                rec["pet_name"] = pet.get("name")
                rec["pet_id"] = pet.get("id")
                all_recommendations.append(rec)
        except:
            continue
    
    # Deduplicate by category and sort
    seen_categories = set()
    unique_recs = []
    for rec in all_recommendations:
        key = f"{rec.get('category')}_{rec.get('type')}"
        if key not in seen_categories:
            seen_categories.add(key)
            unique_recs.append(rec)
    
    priority_order = {"high": 0, "medium": 1, "low": 2}
    unique_recs.sort(key=lambda x: priority_order.get(x.get("priority", "low"), 2))
    
    return {
        "pets_analyzed": len(pets),
        "recommendations": unique_recs[:limit],
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/quick-actions")
async def get_quick_action_suggestions():
    """Get voice quick action suggestions for UI"""
    return {
        "suggestions": [
            {"phrase": "Book grooming for tomorrow", "icon": "✂️", "action": "book_grooming"},
            {"phrase": "Schedule a vet visit", "icon": "🏥", "action": "book_vet"},
            {"phrase": "Order more dog food", "icon": "🍖", "action": "order_food"},
            {"phrase": "Find a dog walker", "icon": "🐕", "action": "find_walker"},
            {"phrase": "Plan a birthday party", "icon": "🎂", "action": "plan_birthday"},
            {"phrase": "Check vaccination schedule", "icon": "💉", "action": "check_vaccinations"},
            {"phrase": "Book training session", "icon": "🎓", "action": "book_training"},
            {"phrase": "Get nutrition advice", "icon": "🥗", "action": "nutrition_advice"},
        ]
    }
