"""
Breed Illustrations API
Serves soulful watercolor breed portraits for breed-specific products

COMPLETE BREED LIBRARY - 34 breeds covering full product catalog
"""

from fastapi import APIRouter
from typing import Optional

router = APIRouter(prefix="/api/breed-illustrations", tags=["breed-illustrations"])

# Soulful watercolor breed illustrations - generated for TheDoggyCompany
BREED_ILLUSTRATIONS = {
    # RETRIEVERS & SPORTING DOGS
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
    "cocker_spaniel": {
        "name": "Cocker Spaniel",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/76b028ba1c61d82ca7aebce2d6d95052113abe2d8da0b58b4fdc0a805efaf71a.png",
        "aliases": ["cocker spaniel", "cocker", "spaniel"]
    },
    "irish_setter": {
        "name": "Irish Setter",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/4fb052f540f02c6767a49f4bdc1c395cd569d86f515bd4b9bee345acd2b2229f.png",
        "aliases": ["irish setter", "setter"]
    },
    
    # WORKING & GUARD DOGS
    "german_shepherd": {
        "name": "German Shepherd",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/fb76d88360331e40d1177c31e52281d1346846430de1734dc4f1c6bfad7625a2.png",
        "aliases": ["german shepherd", "gsd", "alsatian", "german shepard"]
    },
    "rottweiler": {
        "name": "Rottweiler",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/b1da9286f1a395b9347890675a9f34c5f8f04707d7fa437983b1ff3a1653bac2.png",
        "aliases": ["rottweiler", "rottie", "rott"]
    },
    "doberman": {
        "name": "Doberman Pinscher",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/48c7d527493c05786750bf9cff0493a06300713641b21c154c7d5f5045463526.png",
        "aliases": ["doberman", "dobermann", "doberman pinscher", "dobie"]
    },
    "boxer": {
        "name": "Boxer",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/ac39d70330032f5e401b9d459718227618c6c02929ec9709f1ffe51a9d2a6a99.png",
        "aliases": ["boxer"]
    },
    "st_bernard": {
        "name": "St Bernard",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/fc912e39e6ae9f132d539e8575ba6c0218e84e6b02441cb7e7ee7446413f1723.png",
        "aliases": ["st bernard", "saint bernard", "st. bernard"]
    },
    "great_dane": {
        "name": "Great Dane",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/327320ba146b47084302174e40a2e5ab4efd6fba307cb8f9abcf620cf034884f.png",
        "aliases": ["great dane", "dane"]
    },
    "american_bully": {
        "name": "American Bully",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/d59b0aa3f42ff552de9f96257083ced9d6d1ace54a32fe45191cfa265212a08a.png",
        "aliases": ["american bully", "bully", "american pit"]
    },
    
    # NORTHERN & SPITZ BREEDS
    "husky": {
        "name": "Siberian Husky",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/50de93729e8c7da73e41d0101d8364b5ecc3cb18c5217aa02de916722d8d2e71.png",
        "aliases": ["husky", "siberian husky", "siberian", "black husky", "grey husky", "gray husky"]
    },
    "pomeranian": {
        "name": "Pomeranian",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/b732cb4a515afbafefc77d04060c9d3cbc21df97612d41eae2744baefb2f8622.png",
        "aliases": ["pomeranian", "pom", "spitz"]
    },
    "chow_chow": {
        "name": "Chow Chow",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/06dc85493d89c45d3c16d0baec5436197e49a5ae3bff6ba9261ffb68d56d404f.png",
        "aliases": ["chow chow", "chow"]
    },
    
    # HERDING DOGS
    "border_collie": {
        "name": "Border Collie",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/ac2a0ff12d9eba6f52112bc128eac414e67c2192b1a85ff8de65a5aabef6b47e.png",
        "aliases": ["border collie", "collie", "border"]
    },
    
    # HOUNDS
    "beagle": {
        "name": "Beagle",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/7f73bb9db0b3695ae71d79ed275821d6213018d6704b9566a01d4b0333165506.png",
        "aliases": ["beagle"]
    },
    "dachshund": {
        "name": "Dachshund",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/1696279e20e7ec36effe13afe3504901f23732d5797d3e5df308b7fee362093f.png",
        "aliases": ["dachshund", "doxie", "wiener dog", "sausage dog"]
    },
    "italian_greyhound": {
        "name": "Italian Greyhound",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/91d579ce7c24f651d6803db0936a9d4ef200147922bfba827f000bcee129b69a.png",
        "aliases": ["italian greyhound", "iggy", "greyhound"]
    },
    "dalmatian": {
        "name": "Dalmatian",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/8dc63c756e890a81e171c2c79f015a4748a6f28df9ce448f17267cfaf193e22e.png",
        "aliases": ["dalmatian", "dalmation", "dalmatians"]
    },
    
    # TERRIERS
    "jack_russell": {
        "name": "Jack Russell Terrier",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/3ad67f49c442c5a6dc5e24ec2e79fc404f6a17be1cd153311986d45836f95574.png",
        "aliases": ["jack russell", "jack russell terrier", "jrt", "parson russell"]
    },
    "yorkshire": {
        "name": "Yorkshire Terrier",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/3888e6f2de400d7cdb257952bb6db439eb177f3093bdcf6cb2b8647e6e197761.png",
        "aliases": ["yorkshire", "yorkie", "yorkshire terrier"]
    },
    "scottish_terrier": {
        "name": "Scottish Terrier",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/346b6bd241ebb470e1aa87ff93618d52b933a7177d1b0a60edaf5f0f063b5551.png",
        "aliases": ["scottish terrier", "scottie", "scotty"]
    },
    
    # TOY & COMPANION BREEDS
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
    "maltese": {
        "name": "Maltese",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/954569cfdfb85edc1e3738628b74000158b580befc1652794ca894268cfa4fdf.png",
        "aliases": ["maltese", "malti"]
    },
    "lhasa_apso": {
        "name": "Lhasa Apso",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/966c8321dfb7e6a60ae4c6fc5c3e770be76dc45cef15a40157360667bba577ae.png",
        "aliases": ["lhasa apso", "lhasa"]
    },
    "cavalier": {
        "name": "Cavalier King Charles Spaniel",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/8ba09f460e2b7ecc7aed6d5111a72482994e2dfc205dca454484bb75fd56ac77.png",
        "aliases": ["cavalier", "cavalier king charles", "king charles spaniel", "ckcs"]
    },
    
    # BULLDOGS
    "french_bulldog": {
        "name": "French Bulldog",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/30dc6314fc9a14dc118b8571f3e22d092f1a696fe31fed9495441a7b13934f36.png",
        "aliases": ["french bulldog", "frenchie", "french bull"]
    },
    "bulldog": {
        "name": "English Bulldog",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/7d9eedd105043076b80954aa20d93de8b78599ff1d0ba368770bec7e7810426a.png",
        "aliases": ["bulldog", "english bulldog", "british bulldog"]
    },
    
    # POODLES & DOODLES
    "poodle": {
        "name": "Poodle",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/01524ac24d45015990f7fb44dec73b24ae678f17fcc82ab7385c8db943672665.png",
        "aliases": ["poodle", "toy poodle", "standard poodle", "miniature poodle"]
    },
    "schnoodle": {
        "name": "Schnoodle",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/a74d456de99c3925882a9a1af84ec6534c6875504901af75253d71583252c346.png",
        "aliases": ["schnoodle", "shnoodle", "schnauzer poodle"]
    },
    
    # INDIAN BREEDS
    "indie": {
        "name": "Indie / Desi Dog",
        "image_url": "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/2625d385af8758f7b7c5ac8e02e71cc9a29371d1f3a42be84bb6cb73499ceb90.png",
        "aliases": ["indie", "desi", "indian pariah", "pariah", "desi dog", "street dog", "native", "indian"]
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
