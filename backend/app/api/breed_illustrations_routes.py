"""
Breed Illustrations API
Serves soulful watercolor breed portraits for breed-specific products
"""

from fastapi import APIRouter
from typing import Optional

router = APIRouter(prefix="/api/breed-illustrations", tags=["breed-illustrations"])

# Soulful watercolor breed illustrations - generated for TheDoggyCompany
BREED_ILLUSTRATIONS = {
    # Popular breeds
    "labrador": {
        "name": "Labrador Retriever",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/befcce7b86d5aa33c9d5da0f97d613f5468872e8a87fb2a4129a83f3466780d9.png",
        "aliases": ["labrador", "lab", "labrador retriever"]
    },
    "golden_retriever": {
        "name": "Golden Retriever",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/7942b3c9b87be19f0fbadc7f300411a59366423f72b58c3583011a9618296b17.png",
        "aliases": ["golden retriever", "golden", "goldie"]
    },
    "german_shepherd": {
        "name": "German Shepherd",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/fb76d88360331e40d1177c31e52281d1346846430de1734dc4f1c6bfad7625a2.png",
        "aliases": ["german shepherd", "gsd", "alsatian", "german shepard"]
    },
    "indie": {
        "name": "Indie / Desi Dog",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/2625d385af8758f7b7c5ac8e02e71cc9a29371d1f3a42be84bb6cb73499ceb90.png",
        "aliases": ["indie", "desi", "indian pariah", "pariah", "desi dog", "street dog", "native"]
    },
    "beagle": {
        "name": "Beagle",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/7f73bb9db0b3695ae71d79ed275821d6213018d6704b9566a01d4b0333165506.png",
        "aliases": ["beagle"]
    },
    "pug": {
        "name": "Pug",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/4b3623ff10f0a8026378da5d3341a1627fc9b4bff0731d0339a6681f29268246.png",
        "aliases": ["pug", "pugs"]
    },
    "shih_tzu": {
        "name": "Shih Tzu",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/7ff330dc977ff0dcc2ade119e2d038463778a968c7fc19f975080c71d7eafdc1.png",
        "aliases": ["shih tzu", "shihtzu", "shitzu", "shih-tzu"]
    },
    "chihuahua": {
        "name": "Chihuahua",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/98431d5927af586d1b8c5ebfaaed6cf14eaaa568899d7be9c26e171633130465.png",
        "aliases": ["chihuahua", "chi"]
    },
    "pomeranian": {
        "name": "Pomeranian",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/b732cb4a515afbafefc77d04060c9d3cbc21df97612d41eae2744baefb2f8622.png",
        "aliases": ["pomeranian", "pom", "spitz"]
    },
    "rottweiler": {
        "name": "Rottweiler",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/b1da9286f1a395b9347890675a9f34c5f8f04707d7fa437983b1ff3a1653bac2.png",
        "aliases": ["rottweiler", "rottie", "rott"]
    },
    "husky": {
        "name": "Siberian Husky",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/50de93729e8c7da73e41d0101d8364b5ecc3cb18c5217aa02de916722d8d2e71.png",
        "aliases": ["husky", "siberian husky", "siberian"]
    },
    "french_bulldog": {
        "name": "French Bulldog",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/30dc6314fc9a14dc118b8571f3e22d092f1a696fe31fed9495441a7b13934f36.png",
        "aliases": ["french bulldog", "frenchie", "french bull"]
    },
    "cocker_spaniel": {
        "name": "Cocker Spaniel",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/76b028ba1c61d82ca7aebce2d6d95052113abe2d8da0b58b4fdc0a805efaf71a.png",
        "aliases": ["cocker spaniel", "cocker", "spaniel"]
    },
    "doberman": {
        "name": "Doberman Pinscher",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/48c7d527493c05786750bf9cff0493a06300713641b21c154c7d5f5045463526.png",
        "aliases": ["doberman", "doberman pinscher", "dobie"]
    },
    "boxer": {
        "name": "Boxer",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/ac39d70330032f5e401b9d459718227618c6c02929ec9709f1ffe51a9d2a6a99.png",
        "aliases": ["boxer"]
    },
    "dachshund": {
        "name": "Dachshund",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/1696279e20e7ec36effe13afe3504901f23732d5797d3e5df308b7fee362093f.png",
        "aliases": ["dachshund", "doxie", "wiener dog", "sausage dog"]
    },
    "poodle": {
        "name": "Poodle",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/01524ac24d45015990f7fb44dec73b24ae678f17fcc82ab7385c8db943672665.png",
        "aliases": ["poodle", "toy poodle", "standard poodle", "miniature poodle"]
    },
    "yorkshire": {
        "name": "Yorkshire Terrier",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/3888e6f2de400d7cdb257952bb6db439eb177f3093bdcf6cb2b8647e6e197761.png",
        "aliases": ["yorkshire", "yorkie", "yorkshire terrier"]
    },
    "maltese": {
        "name": "Maltese",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/954569cfdfb85edc1e3738628b74000158b580befc1652794ca894268cfa4fdf.png",
        "aliases": ["maltese", "malti"]
    },
    "bulldog": {
        "name": "English Bulldog",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/7d9eedd105043076b80954aa20d93de8b78599ff1d0ba368770bec7e7810426a.png",
        "aliases": ["bulldog", "english bulldog", "british bulldog"]
    }
}


def find_breed_illustration(text: str) -> Optional[dict]:
    """
    Find matching breed illustration from product name or description.
    Returns breed data with image_url if found.
    """
    if not text:
        return None
    
    text_lower = text.lower()
    
    for breed_key, breed_data in BREED_ILLUSTRATIONS.items():
        for alias in breed_data["aliases"]:
            if alias in text_lower:
                return {
                    "breed_key": breed_key,
                    "breed_name": breed_data["name"],
                    "illustration_url": breed_data["image_url"]
                }
    
    return None


@router.get("/all")
async def get_all_breed_illustrations():
    """Get all available breed illustrations"""
    return {
        "breeds": [
            {
                "key": key,
                "name": data["name"],
                "image_url": data["image_url"],
                "aliases": data["aliases"]
            }
            for key, data in BREED_ILLUSTRATIONS.items()
        ],
        "total": len(BREED_ILLUSTRATIONS)
    }


@router.get("/find/{search_text}")
async def find_breed(search_text: str):
    """Find breed illustration matching search text"""
    result = find_breed_illustration(search_text)
    if result:
        return {"found": True, **result}
    return {"found": False, "message": "No matching breed found"}


@router.get("/{breed_key}")
async def get_breed_illustration(breed_key: str):
    """Get specific breed illustration by key"""
    breed_key_lower = breed_key.lower().replace("-", "_").replace(" ", "_")
    
    if breed_key_lower in BREED_ILLUSTRATIONS:
        data = BREED_ILLUSTRATIONS[breed_key_lower]
        return {
            "found": True,
            "breed_key": breed_key_lower,
            "breed_name": data["name"],
            "image_url": data["image_url"]
        }
    
    # Try to find by alias
    for key, data in BREED_ILLUSTRATIONS.items():
        if breed_key_lower in [a.replace(" ", "_") for a in data["aliases"]]:
            return {
                "found": True,
                "breed_key": key,
                "breed_name": data["name"],
                "image_url": data["image_url"]
            }
    
    return {"found": False, "message": f"Breed '{breed_key}' not found"}
