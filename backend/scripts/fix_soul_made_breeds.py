"""
Soul Made Breed Tag Fixer
Run: python3 /app/backend/scripts/fix_soul_made_breeds.py
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')
client = MongoClient(os.environ.get('MONGO_URL'))
db = client[os.environ.get('DB_NAME', 'pet_soul_db')]

BREED_NAMES = [
    "labrador", "golden retriever", "german shepherd", "indie", "indian pariah",
    "beagle", "poodle", "bulldog", "english bulldog", "french bulldog",
    "rottweiler", "boxer", "husky", "siberian husky", "doberman",
    "pomeranian", "shih tzu", "maltese", "chihuahua", "yorkshire terrier",
    "yorkshire", "pug", "cocker spaniel", "dachshund", "lhasa apso",
    "cavalier king charles", "cavalier", "border collie", "schnauzer",
    "great dane", "saint bernard", "st bernard", "samoyed", "akita",
    "australian shepherd", "bernese mountain", "boston terrier",
    "havanese", "scottish terrier", "vizsla", "weimaraner",
    "dalmatian", "shetland sheepdog", "sheltie", "bichon frise",
    "chow chow", "basenji", "whippet", "greyhound", "jack russell",
    "west highland terrier", "westie"
]

def extract_breed_from_name(product_name):
    name_lower = product_name.lower()
    sorted_breeds = sorted(BREED_NAMES, key=len, reverse=True)
    for breed in sorted_breeds:
        if breed in name_lower:
            return breed.replace(" ", "_")
    return None

print("\n" + "="*60)
print("SOUL MADE BREED AUDIT")
print("="*60)

total = db.breed_products.count_documents({})
print(f"\nTotal breed_products: {total}")

universal = db.breed_products.count_documents({
    "$or": [
        {"breed": {"$in": ["all", "all_breeds", "All", "All Breeds", "", None]}},
        {"breed": {"$exists": False}},
        {"breed_tags": {"$in": ["all_breeds", "all", ""]}},
        {"breed_tags": {"$exists": False}},
        {"breed_tags": []},
    ]
})
print(f"Universal/untagged products: {universal}")

print("\nSample universal/untagged products (first 20):")
samples = list(db.breed_products.find({
    "$or": [
        {"breed": {"$in": ["all", "all_breeds", "", None]}},
        {"breed": {"$exists": False}},
    ]
}, {"name": 1, "breed": 1, "breed_tags": 1, "_id": 0}).limit(20))
for s in samples:
    print(f"  {s.get('name','?')} | breed={s.get('breed','MISSING')} | tags={s.get('breed_tags','MISSING')}")

print("\n" + "="*60)
print("FIXING UNTAGGED SOUL MADE PRODUCTS")
print("="*60)

untagged = list(db.breed_products.find({
    "$or": [
        {"breed": {"$in": ["all", "all_breeds", "", None]}},
        {"breed": {"$exists": False}},
        {"breed_tags": {"$in": ["all_breeds", "all", ""]}},
        {"breed_tags": {"$exists": False}},
        {"breed_tags": []},
    ]
}))

fixed = 0
not_found = []

for product in untagged:
    name = product.get("name", "")
    detected_breed = extract_breed_from_name(name)
    if detected_breed:
        db.breed_products.update_one(
            {"_id": product["_id"]},
            {"$set": {"breed": detected_breed, "breed_tags": [detected_breed]}}
        )
        fixed += 1
        print(f"  Fixed: '{name}' -> breed={detected_breed}")
    else:
        not_found.append(name)

print(f"\n-> Fixed: {fixed} products")
print(f"-> Could not detect breed: {len(not_found)}")
if not_found:
    print("\nProducts without detectable breed:")
    for n in not_found[:20]:
        print(f"  {n}")

print("\n" + "="*60)
print("VERIFICATION")
print("="*60)
remaining = db.breed_products.count_documents({
    "$or": [
        {"breed": {"$in": ["all", "all_breeds", "", None]}},
        {"breed": {"$exists": False}},
    ]
})
print(f"Universal/untagged remaining: {remaining}")

print("\nBreed breakdown after fix:")
pipeline = [{"$group": {"_id": "$breed", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
for r in db.breed_products.aggregate(pipeline):
    print(f"  {r['_id']}: {r['count']}")

print("\nDone!")
