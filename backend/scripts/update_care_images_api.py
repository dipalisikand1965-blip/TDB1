#!/usr/bin/env python3
"""
Update Care products with generated images via API
"""
import requests

API_URL = "https://dine-category-pills.preview.emergentagent.com"
AUTH = ("aditya", "lola4304")

# Generated Care images
IMAGES = {
    "first_aid": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/3da07f6b1601bdbb38d16d5b4dcdfa4d20a87e27c74b9b8d8ccb67b191e3a57f.png",
    "dental_kit": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/b9d1c5ec207f7f6cb8bfd02f40825e3303ad21f6e20b31a53eaf562e31b00249.png",
    "grooming_tools": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/38f25e8f6394cff725369aba2c94d9bef2a51bfcf7efcfb5cde566783579828f.png",
    "calming": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/8f7856620594ae0e6f2ca4040c89d50fd22c30f6ff6cd7a60712097993f8cfaa.png",
    "harness_leash": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/be415eaacc1871d33fb396296872ac0dfd681c1c67c342e5df9a5997b772b843.png",
    "supplements": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/85f71a8e4920cf93b30c15a0fb6131faae8e3e50ca23d4d78d4f01263199f830.png",
    "spa_kit": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/c6708bdaf472f60f058c530651ae68d8be925316e237865de8f307fa6e97b90b.png",
    "training_kit": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/1dc275124fe082dcb60c0c5e73760ec39f740b4e9dfdc6dcf232649ecde07840.png",
    "health_monitor": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/fac0c73565440e60be6c0220040699904f5951fdc622536d6939e0abc628012d.png",
    "vet_wellness": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/dd0cdc28d614a0034ad32c4d09e224d2413b93c628d9fd6a5b5061d2e24514ed.png",
    "grooming_service": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/ac3db8f7c61ede3febe302a7ebbd6d6937338233b38e3d7adcf7bd7ad945a72a.png",
    "eco_bags": "https://static.prod-images.emergentagent.com/jobs/f8fcb8e7-1e5e-4376-99c7-472b9035c75b/images/cbba57451ccc0a9cec816ce4ead9a99c7fa02a3205178d52f95834cf84f874ea.png",
}

# Product ID to image key mapping
PRODUCT_IMAGE_MAP = {
    # First Aid
    "emrg-wound-care-kit": "first_aid",
    "adv-first-aid-kit": "first_aid",
    "care-first-aid": "first_aid",
    
    # Dental
    "care-dental-kit": "dental_kit",
    
    # Grooming tools
    "care-grooming-brush": "grooming_tools",
    "care-nail-clipper": "grooming_tools",
    "care-ear-cleaner": "grooming_tools",
    
    # Shampoo/Spa
    "care-shampoo-sensitive": "spa_kit",
    
    # Calming
    "care-calming-spray": "calming",
    
    # Training
    "care-clicker": "training_kit",
    "care-training-treats": "training_kit",
    "adv-training-kit": "training_kit",
    
    # Harness/Leash
    "care-harness-nopu": "harness_leash",
    "care-leash-reflective": "harness_leash",
    
    # Poop bags
    "care-poop-bags": "eco_bags",
    
    # Health Monitor
    "adv-health-monitor": "health_monitor",
    "paper-health-wallet": "health_monitor",
    
    # Supplements
    "care-9562c9d0": "supplements",  # Joint Care Supplement
    
    # Services
    "svc-care-dc450729": "vet_wellness",  # Wellness Programme
    "groom-bbd30128": "grooming_service",  # Full Grooming Package
}

def get_image_for_name(name):
    """Get image key based on product name patterns"""
    name_lower = name.lower()
    
    if 'first aid' in name_lower or 'wound' in name_lower:
        return "first_aid"
    elif 'dental' in name_lower or 'tooth' in name_lower:
        return "dental_kit"
    elif 'brush' in name_lower or 'clipper' in name_lower or 'deshed' in name_lower:
        return "grooming_tools"
    elif 'shampoo' in name_lower or 'conditioner' in name_lower or 'bath' in name_lower:
        return "spa_kit"
    elif 'calm' in name_lower or 'anxiety' in name_lower or 'stress' in name_lower:
        return "calming"
    elif 'train' in name_lower or 'clicker' in name_lower:
        return "training_kit"
    elif 'harness' in name_lower or 'leash' in name_lower or 'collar' in name_lower:
        return "harness_leash"
    elif 'poop' in name_lower or 'waste' in name_lower or 'bag' in name_lower:
        return "eco_bags"
    elif 'health' in name_lower or 'monitor' in name_lower or 'digital' in name_lower:
        return "health_monitor"
    elif 'supplement' in name_lower or 'vitamin' in name_lower or 'joint' in name_lower or 'probiotic' in name_lower:
        return "supplements"
    elif 'wellness' in name_lower or 'vet' in name_lower or 'checkup' in name_lower:
        return "vet_wellness"
    elif 'groom' in name_lower or 'spa' in name_lower:
        return "grooming_service"
    elif 'ear' in name_lower:
        return "grooming_tools"
    
    return None

def update_product(product_id, image_url):
    """Update product with image via admin API"""
    # Try the care-specific endpoint first
    url = f"{API_URL}/api/care/admin/products/{product_id}"
    data = {"image": image_url, "images": [image_url]}
    try:
        resp = requests.put(url, json=data, auth=AUTH)
        if resp.status_code == 200:
            return True
        # Fall back to generic products endpoint
        url2 = f"{API_URL}/api/admin/products/{product_id}"
        resp2 = requests.put(url2, json=data, auth=AUTH)
        return resp2.status_code == 200
    except Exception as e:
        print(f"    Error: {e}")
        return False

def main():
    print("Fetching Care products...")
    resp = requests.get(f"{API_URL}/api/care/products")
    products = resp.json() if isinstance(resp.json(), list) else resp.json().get('products', [])
    
    print(f"Found {len(products)} Care products")
    
    # Filter products without images
    no_img = [p for p in products if not (p.get('images') or p.get('image'))]
    print(f"Products needing images: {len(no_img)}")
    
    updated = 0
    for p in no_img:
        product_id = p.get('id')
        name = p.get('name', '')
        
        # Try direct mapping first
        image_key = PRODUCT_IMAGE_MAP.get(product_id)
        
        # Fall back to name-based matching
        if not image_key:
            image_key = get_image_for_name(name)
        
        if image_key and image_key in IMAGES:
            if update_product(product_id, IMAGES[image_key]):
                updated += 1
                print(f"  ✅ {name[:45]}")
            else:
                print(f"  ❌ {name[:45]} - Update failed")
        else:
            print(f"  ⚠️  No mapping: {name[:45]}")
    
    print(f"\n✅ Updated {updated} Care products")

if __name__ == "__main__":
    main()
