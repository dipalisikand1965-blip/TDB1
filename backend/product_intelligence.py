"""
Product Intelligence Engine for The Doggy Company
Auto-generates intelligent tags for products to enable smart search and recommendations
"""

import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Set
from motor.motor_asyncio import AsyncIOMotorDatabase

# ==================== TAG CATEGORIES ====================

# Breed recognition patterns
BREED_PATTERNS = {
    # Popular Indian breeds
    "indie": ["indie", "indian pariah", "desi", "pariah", "street dog"],
    "labrador": ["labrador", "lab ", " lab", "labradors"],
    "golden_retriever": ["golden retriever", "golden"],
    "german_shepherd": ["german shepherd", "gsd", "alsatian"],
    "beagle": ["beagle"],
    "pug": ["pug"],
    "shih_tzu": ["shih tzu", "shihtzu", "shitzu"],
    "pomeranian": ["pomeranian", "pom "],
    "rottweiler": ["rottweiler", "rott"],
    "doberman": ["doberman", "dobermann"],
    "boxer": ["boxer"],
    "husky": ["husky", "siberian"],
    "bulldog": ["bulldog", "french bulldog", "frenchie", "english bulldog"],
    "poodle": ["poodle", "toy poodle", "standard poodle"],
    "chihuahua": ["chihuahua"],
    "dachshund": ["dachshund", "sausage dog", "wiener"],
    "cocker_spaniel": ["cocker spaniel", "spaniel"],
    "dalmatian": ["dalmatian"],
    "great_dane": ["great dane", "dane"],
    "corgi": ["corgi", "pembroke", "cardigan corgi"],
    "maltese": ["maltese"],
    "yorkshire_terrier": ["yorkshire", "yorkie"],
    "border_collie": ["border collie", "collie"],
    "samoyed": ["samoyed"],
    "akita": ["akita"],
    "pitbull": ["pitbull", "pit bull", "american bully"],
    "saint_bernard": ["saint bernard", "st bernard"],
    "persian_cat": ["persian"],
    "maine_coon": ["maine coon"],
    "siamese": ["siamese"],
    "british_shorthair": ["british shorthair"],
    "ragdoll": ["ragdoll"],
}

# Size-based breed categorization
SMALL_BREEDS = ["chihuahua", "pomeranian", "yorkshire_terrier", "maltese", "shih_tzu", "pug", "dachshund"]
MEDIUM_BREEDS = ["beagle", "cocker_spaniel", "indie", "corgi", "bulldog"]
LARGE_BREEDS = ["labrador", "golden_retriever", "german_shepherd", "rottweiler", "doberman", "boxer", "husky", "dalmatian"]
GIANT_BREEDS = ["great_dane", "saint_bernard", "akita"]

# Health/Purpose keywords
HEALTH_KEYWORDS = {
    "digestive": ["digestive", "probiotic", "gut", "stomach", "digestion", "prebiotic", "fiber"],
    "dental": ["dental", "teeth", "oral", "breath", "tartar", "plaque"],
    "skin_coat": ["skin", "coat", "fur", "shine", "omega", "glossy", "shedding", "deshedding"],
    "joint": ["joint", "hip", "arthritis", "mobility", "glucosamine", "chondroitin", "senior"],
    "weight_management": ["weight", "diet", "low calorie", "lean", "light", "slim"],
    "immunity": ["immune", "immunity", "antioxidant", "vitamin", "healthy"],
    "heart_health": ["heart", "cardiac", "cardiovascular", "taurine"],
    "anxiety_calming": ["calm", "anxiety", "stress", "relax", "soothing", "pheromone"],
    "energy": ["energy", "active", "performance", "athletic", "high protein"],
    "sensitive_stomach": ["sensitive", "gentle", "easy digest", "hypoallergenic"],
    "allergy": ["allergy", "hypoallergenic", "limited ingredient", "grain free"],
    "training": ["training", "treat pouch", "clicker", "reward"],
    "dental_care": ["toothbrush", "toothpaste", "dental kit", "dental care"],
    "grooming": ["groom", "brush", "comb", "shampoo", "conditioner", "nail", "clipper"],
    "safety": ["safety", "reflective", "harness", "leash", "first aid"],
}

# Age/Life stage keywords
LIFESTAGE_KEYWORDS = {
    "puppy": ["puppy", "pup", "puppies", "junior", "young", "starter", "weaning", "baby"],
    "adult": ["adult", "maintenance"],
    "senior": ["senior", "mature", "old", "aging", "elderly", "7+", "8+"],
    "all_ages": ["all age", "all life", "complete", "universal"],
}

# Occasion keywords
OCCASION_KEYWORDS = {
    "birthday": ["birthday", "barkday", "birth day", "b-day", "bday"],
    "celebration": ["celebration", "celebrate", "party", "festive", "special occasion"],
    "christmas": ["christmas", "xmas", "holiday", "winter", "santa"],
    "valentines": ["valentine", "love", "heart"],
    "easter": ["easter", "egg hunt"],
    "diwali": ["diwali", "deepavali", "festive"],
    "gift": ["gift", "present", "hamper", "box set", "combo"],
    "gotcha_day": ["gotcha", "adoption", "anniversary"],
    "new_year": ["new year"],
}

# Diet/Ingredient keywords
DIET_KEYWORDS = {
    "grain_free": ["grain free", "grain-free", "no grain"],
    "vegetarian": ["vegetarian", "veg ", "veggie", "plant based"],
    "chicken": ["chicken", "poultry"],
    "beef": ["beef", "cattle"],
    "lamb": ["lamb", "mutton"],
    "fish": ["fish", "salmon", "tuna", "ocean", "sea"],
    "pork": ["pork", "bacon"],
    "duck": ["duck"],
    "turkey": ["turkey"],
    "liver": ["liver"],
    "egg": ["egg"],
    "peanut_butter": ["peanut butter", "pb", "nut butter"],
    "pumpkin": ["pumpkin"],
    "banana": ["banana"],
    "apple": ["apple"],
    "coconut": ["coconut"],
    "sweet_potato": ["sweet potato"],
    "oats": ["oat", "oats"],
    "rice": ["rice"],
    "cheese": ["cheese", "cheesy"],
    "yogurt": ["yogurt", "yoghurt", "curd"],
    "honey": ["honey"],
    "berries": ["berry", "berries", "blueberry", "strawberry", "cranberry"],
}

# Product type keywords
PRODUCT_TYPE_KEYWORDS = {
    "cake": ["cake", "pupcake", "barkday"],
    "treat": ["treat", "snack", "biscuit", "cookie", "chew"],
    "meal": ["meal", "food", "kibble", "dinner", "lunch"],
    "toy": ["toy", "squeaky", "plush", "ball", "rope"],
    "accessory": ["collar", "leash", "harness", "bowl", "bed", "crate", "carrier"],
    "grooming": ["shampoo", "brush", "clipper", "comb"],
    "supplement": ["supplement", "vitamin", "mineral", "powder"],
    "frozen": ["frozen", "ice cream", "popsicle", "froyo"],
    "donut": ["donut", "dognut", "doughnut"],
    "hamper": ["hamper", "box", "gift set", "combo"],
}

# Species keywords
SPECIES_KEYWORDS = {
    "dog": ["dog", "puppy", "pup", "canine", "pooch", "doggy", "pupper"],
    "cat": ["cat", "kitten", "feline", "kitty", "meow"],
}


class ProductIntelligenceEngine:
    """Engine to auto-generate intelligent product tags"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        
    def _normalize_text(self, text: str) -> str:
        """Normalize text for pattern matching"""
        if not text:
            return ""
        return text.lower().strip()
    
    def _detect_breeds(self, name: str, description: str) -> Set[str]:
        """Detect breed mentions in product name/description"""
        breeds = set()
        combined = self._normalize_text(f"{name} {description}")
        
        for breed, patterns in BREED_PATTERNS.items():
            for pattern in patterns:
                if pattern in combined:
                    breeds.add(breed)
                    break
        
        return breeds
    
    def _detect_size_category(self, breeds: Set[str], name: str, description: str) -> Set[str]:
        """Detect size category from breeds or explicit mentions"""
        sizes = set()
        combined = self._normalize_text(f"{name} {description}")
        
        # Check detected breeds
        for breed in breeds:
            if breed in SMALL_BREEDS:
                sizes.add("small_breed")
            elif breed in MEDIUM_BREEDS:
                sizes.add("medium_breed")
            elif breed in LARGE_BREEDS:
                sizes.add("large_breed")
            elif breed in GIANT_BREEDS:
                sizes.add("giant_breed")
        
        # Check explicit size mentions
        if any(word in combined for word in ["small breed", "small dog", "toy breed", "mini"]):
            sizes.add("small_breed")
        if any(word in combined for word in ["medium breed", "medium dog", "medium size"]):
            sizes.add("medium_breed")
        if any(word in combined for word in ["large breed", "large dog", "big dog"]):
            sizes.add("large_breed")
        if any(word in combined for word in ["giant breed", "giant dog", "extra large"]):
            sizes.add("giant_breed")
        
        # Default: if product seems universal
        if not sizes and not breeds:
            sizes.add("all_sizes")
        
        return sizes
    
    def _detect_from_keywords(self, name: str, description: str, keyword_dict: Dict[str, List[str]]) -> Set[str]:
        """Generic keyword detection"""
        tags = set()
        combined = self._normalize_text(f"{name} {description}")
        
        for tag, keywords in keyword_dict.items():
            for keyword in keywords:
                if keyword in combined:
                    tags.add(tag)
                    break
        
        return tags
    
    def _detect_species(self, name: str, description: str, category: str) -> Set[str]:
        """Detect target species (dog/cat)"""
        species = set()
        combined = self._normalize_text(f"{name} {description} {category}")
        
        # Check for cat-specific indicators
        if any(word in combined for word in ["cat", "kitten", "feline", "kitty", "meow", "cat-"]):
            species.add("cat")
        
        # Most products are for dogs by default
        if any(word in combined for word in ["dog", "puppy", "pup", "canine", "pupper", "paw"]):
            species.add("dog")
        
        # Default to dog if unclear
        if not species:
            species.add("dog")
        
        return species
    
    def _clean_product_name(self, name: str) -> str:
        """Clean and improve product name"""
        if not name:
            return "Unnamed Product"
        
        # Remove "Untitled" prefix
        if name.lower().startswith("untitled"):
            name = name.replace("Untitled", "").replace("untitled", "").strip()
            if not name:
                return "Premium Pet Product"
        
        # Remove HTML entities
        name = re.sub(r'&amp;', '&', name)
        name = re.sub(r'&nbsp;', ' ', name)
        name = re.sub(r'&[a-z]+;', '', name)
        
        # Clean up extra whitespace
        name = re.sub(r'\s+', ' ', name).strip()
        
        # Capitalize properly
        words = name.split()
        cleaned_words = []
        for i, word in enumerate(words):
            if word.lower() in ['for', 'and', 'the', 'of', 'with', 'to', 'a', 'an', 'in', 'on'] and i > 0:
                cleaned_words.append(word.lower())
            else:
                cleaned_words.append(word.capitalize() if word.islower() else word)
        
        return ' '.join(cleaned_words)
    
    def _generate_search_keywords(self, product: Dict[str, Any], all_tags: Set[str]) -> List[str]:
        """Generate additional search keywords for Mira AI"""
        keywords = set()
        
        # Add all tags as keywords
        keywords.update(all_tags)
        
        # Add price range keywords
        price = product.get('price', 0)
        if price:
            if price < 300:
                keywords.add("budget_friendly")
                keywords.add("affordable")
            elif price < 700:
                keywords.add("mid_range")
            elif price < 1500:
                keywords.add("premium")
            else:
                keywords.add("luxury")
                keywords.add("special")
        
        # Add availability keywords
        if product.get('available', True):
            keywords.add("in_stock")
        
        # Add shipping keywords
        if product.get('is_pan_india_shippable', False):
            keywords.add("pan_india")
            keywords.add("ships_anywhere")
        
        return list(keywords)
    
    def analyze_product(self, product: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a single product and generate intelligent tags"""
        name = product.get('name', product.get('title', ''))
        description = product.get('description', '')
        category = product.get('category', '')
        existing_tags = product.get('tags', [])
        
        # Collect all intelligent tags
        all_tags = set()
        
        # 1. Detect breeds
        breeds = self._detect_breeds(name, description)
        all_tags.update(breeds)
        
        # 2. Detect size categories
        sizes = self._detect_size_category(breeds, name, description)
        all_tags.update(sizes)
        
        # 3. Detect health/purpose
        health_tags = self._detect_from_keywords(name, description, HEALTH_KEYWORDS)
        all_tags.update(health_tags)
        
        # 4. Detect life stage
        lifestage_tags = self._detect_from_keywords(name, description, LIFESTAGE_KEYWORDS)
        if not lifestage_tags:
            lifestage_tags.add("all_ages")  # Default
        all_tags.update(lifestage_tags)
        
        # 5. Detect occasions
        occasion_tags = self._detect_from_keywords(name, description, OCCASION_KEYWORDS)
        all_tags.update(occasion_tags)
        
        # 6. Detect diet/ingredients
        diet_tags = self._detect_from_keywords(name, description, DIET_KEYWORDS)
        all_tags.update(diet_tags)
        
        # 7. Detect product types
        product_type_tags = self._detect_from_keywords(name, description, PRODUCT_TYPE_KEYWORDS)
        all_tags.update(product_type_tags)
        
        # 8. Detect species
        species_tags = self._detect_species(name, description, category)
        all_tags.update(species_tags)
        
        # 9. Add category as tag
        if category:
            all_tags.add(category.lower().replace('-', '_'))
        
        # 10. Add existing Shopify tags
        for tag in existing_tags:
            if isinstance(tag, str):
                all_tags.add(tag.lower().replace(' ', '_'))
        
        # Generate search keywords
        search_keywords = self._generate_search_keywords(product, all_tags)
        
        # Clean product name
        cleaned_name = self._clean_product_name(name)
        
        return {
            "intelligent_tags": list(all_tags),
            "search_keywords": search_keywords,
            "detected_breeds": list(breeds),
            "detected_sizes": list(sizes),
            "detected_health": list(health_tags),
            "detected_lifestage": list(lifestage_tags),
            "detected_occasions": list(occasion_tags),
            "detected_diet": list(diet_tags),
            "detected_species": list(species_tags),
            "cleaned_name": cleaned_name,
            "needs_name_update": cleaned_name != name,
        }
    
    async def process_all_products(self, update_db: bool = False) -> Dict[str, Any]:
        """Process all products and optionally update database"""
        results = {
            "total_processed": 0,
            "products_updated": 0,
            "names_cleaned": 0,
            "tags_added": 0,
            "errors": [],
            "summary": {
                "breeds_detected": {},
                "health_tags": {},
                "occasions": {},
                "species": {}
            }
        }
        
        # Get all products from BOTH collections
        unified_products = await self.db.unified_products.find({}, {"_id": 0}).to_list(None)
        legacy_products = await self.db.products_master.find({}, {"_id": 0}).to_list(None)
        
        # Process unified_products (primary)
        for product in unified_products:
            try:
                product_id = product.get('id')
                if not product_id:
                    continue
                
                results["total_processed"] += 1
                
                # Analyze product
                analysis = self.analyze_product(product)
                
                # Update summary stats
                for breed in analysis["detected_breeds"]:
                    results["summary"]["breeds_detected"][breed] = results["summary"]["breeds_detected"].get(breed, 0) + 1
                for health in analysis["detected_health"]:
                    results["summary"]["health_tags"][health] = results["summary"]["health_tags"].get(health, 0) + 1
                for occasion in analysis["detected_occasions"]:
                    results["summary"]["occasions"][occasion] = results["summary"]["occasions"].get(occasion, 0) + 1
                for species in analysis["detected_species"]:
                    results["summary"]["species"][species] = results["summary"]["species"].get(species, 0) + 1
                
                if update_db:
                    update_doc = {
                        "intelligent_tags": {
                            "breed_tags": analysis["detected_breeds"],
                            "health_tags": analysis["detected_health"],
                            "lifestage_tags": analysis["detected_lifestage"],
                            "occasion_tags": analysis["detected_occasions"],
                            "diet_tags": analysis["detected_diet"],
                            "size_tags": analysis["detected_sizes"],
                            "species_tags": analysis["detected_species"],
                        },
                        "search_keywords": analysis["search_keywords"],
                        "breed_tags": analysis["detected_breeds"],
                        "health_tags": analysis["detected_health"],
                        "lifestage_tags": analysis["detected_lifestage"],
                        "occasion_tags": analysis["detected_occasions"],
                        "diet_tags": analysis["detected_diet"],
                        "size_tags": analysis["detected_sizes"],
                        "species_tags": analysis["detected_species"],
                        "ai_processed_at": datetime.now(timezone.utc).isoformat()
                    }
                    
                    # Update name if needed
                    if analysis["needs_name_update"]:
                        update_doc["name"] = analysis["cleaned_name"]
                        results["names_cleaned"] += 1
                    
                    # Update unified_products
                    await self.db.unified_products.update_one(
                        {"id": product_id},
                        {"$set": update_doc}
                    )
                    results["products_updated"] += 1
                    results["tags_added"] += len(analysis["intelligent_tags"])
                
            except Exception as e:
                results["errors"].append(f"Error processing {product.get('name', 'unknown')}: {str(e)}")
        
        # Also process legacy products collection
        for product in legacy_products:
            try:
                product_id = product.get('id')
                if not product_id:
                    continue
                
                # Analyze product
                analysis = self.analyze_product(product)
                
                if update_db:
                    update_doc = {
                        "intelligent_tags": analysis["intelligent_tags"],
                        "search_keywords": analysis["search_keywords"],
                        "breed_tags": analysis["detected_breeds"],
                        "health_tags": analysis["detected_health"],
                        "lifestage_tags": analysis["detected_lifestage"],
                        "occasion_tags": analysis["detected_occasions"],
                        "diet_tags": analysis["detected_diet"],
                        "size_tags": analysis["detected_sizes"],
                        "species_tags": analysis["detected_species"],
                        "ai_processed_at": datetime.now(timezone.utc).isoformat()
                    }
                    
                    # Update name if needed
                    if analysis["needs_name_update"]:
                        update_doc["name"] = analysis["cleaned_name"]
                    
                    await self.db.products_master.update_one(
                        {"id": product_id},
                        {"$set": update_doc}
                    )
                
            except Exception as e:
                pass  # Don't add legacy errors to report
        
        return results


# Stock images for products without images (by category)
STOCK_IMAGES = {
    "treats": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400",
    "care": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
    "grooming": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",
    "accessories": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
    "food": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400",
    "toys": "https://images.unsplash.com/photo-1535008652995-e95986556e32?w=400",
    "cakes": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400",
    "default": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"
}


async def add_stock_images_to_products(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
    """Add stock images to products without images"""
    results = {
        "total_updated": 0,
        "by_category": {}
    }
    
    # Find products without images
    products = await db.products_master.find(
        {"$or": [{"image": None}, {"image": ""}, {"image": {"$exists": False}}]},
        {"_id": 0, "id": 1, "category": 1, "name": 1}
    ).to_list(None)
    
    for product in products:
        category = product.get("category", "default")
        image_url = STOCK_IMAGES.get(category, STOCK_IMAGES["default"])
        
        await db.products_master.update_one(
            {"id": product["id"]},
            {"$set": {"image": image_url, "is_stock_image": True}}
        )
        
        results["total_updated"] += 1
        results["by_category"][category] = results["by_category"].get(category, 0) + 1
    
    return results
