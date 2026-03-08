"""
Milestone & Kit Illustrations API
Soulful watercolor illustrations for milestone kits, surprise delivery, and special occasions
"""

from fastapi import APIRouter
from typing import Optional

router = APIRouter(prefix="/api/milestone-illustrations", tags=["milestone-illustrations"])

# Soulful milestone and kit illustrations
MILESTONE_ILLUSTRATIONS = {
    # Celebration Milestones
    "milestone_celebration": {
        "name": "Milestone Celebration",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/43a9b38c21d17d383637d8564d89263ddadd7ee6ed74054dbfad9816966eadba.png",
        "category": "milestone",
        "description": "General milestone celebration - birthdays, anniversaries, achievements"
    },
    "first_birthday_kit": {
        "name": "First Birthday Kit",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/28a7da9259ba4a95f24ec82947b77745f95ad2748c28e4b80ffc563f96c5b900.png",
        "category": "milestone",
        "description": "Puppy's first birthday celebration kit"
    },
    "gotcha_day_kit": {
        "name": "Gotcha Day Kit",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/3abfb128dffb8b2aec5a2a49fa3937755a135907a28b61618ed6060ef94f5579.png",
        "category": "milestone",
        "description": "Adoption anniversary celebration for rescue dogs"
    },
    "senior_milestone": {
        "name": "Senior Milestone",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/8b3db081e13dbdfa4613d2db44845b1263996a055072faa4035d5686375cd219.png",
        "category": "milestone",
        "description": "Celebrating senior dogs and their golden years"
    },
    "recovery_celebration": {
        "name": "Recovery Celebration",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/62ba95abe9eb4b864241513e26deb68bc4d57d114bb19168a4a671358902b7d2.png",
        "category": "milestone",
        "description": "Celebrating recovery from illness or surgery"
    },
    
    # Delivery & Surprise
    "surprise_delivery": {
        "name": "Surprise Delivery",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/c1dba0bf7fb405afc6f57bbdadda265cb90090afa428b1be7ab288285bd84a5a.png",
        "category": "delivery",
        "description": "Surprise gift delivery moment"
    },
    "welcome_home_kit": {
        "name": "Welcome Home Kit",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/dc17c20f5d307dba1b23900f40f891da4375377de5736c42513a8231fdc78136.png",
        "category": "kit",
        "description": "New puppy welcome home essentials"
    },
    "travel_adventure_kit": {
        "name": "Travel Adventure Kit",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/e3643f1940d747389ca3eecdc1d521de33de5837adb9707447f6b4e951b8dab4.png",
        "category": "kit",
        "description": "Travel and adventure kit for dogs on the go"
    }
}

# Product types that can be created for each breed
BREED_PRODUCT_TYPES = [
    {"type": "cake", "name": "{breed} Birthday Cake", "pillar": "celebrate", "price_range": (499, 1299)},
    {"type": "keychain", "name": "{breed} Breed Keychain", "pillar": "celebrate", "price_range": (199, 399)},
    {"type": "photo_frame", "name": "{breed} Photo Frame", "pillar": "celebrate", "price_range": (599, 999)},
    {"type": "party_hat", "name": "{breed} Party Hat", "pillar": "celebrate", "price_range": (149, 299)},
    {"type": "bandana", "name": "{breed} Breed Bandana", "pillar": "celebrate", "price_range": (249, 499)},
    {"type": "mug", "name": "{breed} Lover Mug", "pillar": "celebrate", "price_range": (349, 599)},
    {"type": "mat", "name": "{breed} Welcome Mat", "pillar": "stay", "price_range": (799, 1499)},
    {"type": "bowl", "name": "{breed} Food Bowl", "pillar": "dine", "price_range": (399, 799)},
    {"type": "collar", "name": "{breed} Breed Collar", "pillar": "care", "price_range": (449, 899)},
    {"type": "toy", "name": "{breed} Plush Toy", "pillar": "celebrate", "price_range": (299, 599)},
    {"type": "treat_jar", "name": "{breed} Treat Jar", "pillar": "dine", "price_range": (449, 799)},
    {"type": "blanket", "name": "{breed} Cozy Blanket", "pillar": "stay", "price_range": (699, 1299)},
]


@router.get("/all")
async def get_all_milestone_illustrations():
    """Get all milestone and kit illustrations"""
    return {
        "illustrations": [
            {
                "key": key,
                "name": data["name"],
                "image_url": data["image_url"],
                "category": data["category"],
                "description": data["description"]
            }
            for key, data in MILESTONE_ILLUSTRATIONS.items()
        ],
        "total": len(MILESTONE_ILLUSTRATIONS)
    }


@router.get("/by-category/{category}")
async def get_illustrations_by_category(category: str):
    """Get illustrations by category (milestone, delivery, kit)"""
    filtered = {
        k: v for k, v in MILESTONE_ILLUSTRATIONS.items()
        if v["category"] == category
    }
    return {
        "category": category,
        "illustrations": [
            {"key": k, **v} for k, v in filtered.items()
        ],
        "total": len(filtered)
    }


@router.get("/product-types")
async def get_breed_product_types():
    """Get list of product types that can be created for each breed"""
    return {
        "product_types": BREED_PRODUCT_TYPES,
        "total": len(BREED_PRODUCT_TYPES),
        "note": "Use these templates when creating breed-specific products. Replace {breed} with actual breed name."
    }


@router.get("/{illustration_key}")
async def get_milestone_illustration(illustration_key: str):
    """Get specific milestone illustration"""
    key = illustration_key.lower().replace("-", "_")
    
    if key in MILESTONE_ILLUSTRATIONS:
        data = MILESTONE_ILLUSTRATIONS[key]
        return {
            "found": True,
            "key": key,
            **data
        }
    
    return {"found": False, "message": f"Illustration '{illustration_key}' not found"}
