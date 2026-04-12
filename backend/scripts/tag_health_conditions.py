"""
tag_health_conditions.py
One-time script. Tags products with health_conditions
based on name/description keywords.
Run once. Takes ~2 minutes.
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient

HEALTH_CONDITION_RULES = {
    "diabetes": [
        "sugar-free", "sugar free", "no added sugar", "unsweetened",
        "low glycemic", "low-glycemic", "low carb", "low-carb",
        "diabetic", "grain-free", "grain free", "weight management",
        "light", "diet", "low calorie", "low-calorie"
    ],
    "pancreatitis": [
        "low fat", "low-fat", "fat free", "fat-free", "lean",
        "light", "digestive", "probiotic", "gentle", "easy digest",
        "baked", "dehydrated", "single protein", "single-protein"
    ],
    "thyroid": [
        "iodine", "selenium", "metabolic", "thyroid", "metabolism",
        "weight management", "grain-free", "high protein", "lean protein"
    ],
    "epilepsy": [
        "omega-3", "omega 3", "mct oil", "mct", "natural",
        "no artificial", "no preservative", "whole ingredient",
        "calming", "stress", "anxiety", "grain-free"
    ],
    "cancer": [
        "antioxidant", "immune", "turmeric", "omega-3",
        "low sugar", "low-sugar", "anti-inflammatory",
        "recovery", "treatment", "lymphoma"
    ],
    "kidney": [
        "low protein", "low-protein", "renal", "kidney",
        "low phosphorus", "low sodium", "low-sodium"
    ],
    "heart": [
        "heart", "cardiac", "taurine", "low sodium",
        "omega-3", "CoQ10", "cardiovascular"
    ],
    "liver": [
        "liver support", "milk thistle", "antioxidant",
        "low copper", "detox", "hepatic"
    ],
}

async def run():
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "pet-os-live-test_database")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    total = await db.products_master.count_documents(
        {"is_active": {"$ne": False}}
    )
    print(f"Scanning {total} active products...")

    tagged = 0
    scanned = 0
    async for product in db.products_master.find(
        {"is_active": {"$ne": False}},
        {"_id": 1, "name": 1, "description": 1,
         "mira_tag": 1, "tags": 1}
    ):
        scanned += 1
        searchtext = " ".join(filter(None, [
            product.get("name", ""),
            product.get("description", ""),
            product.get("mira_tag", ""),
            " ".join(product.get("tags") or []),
        ])).lower()

        matched_conditions = []
        for condition, keywords in HEALTH_CONDITION_RULES.items():
            if any(kw.lower() in searchtext for kw in keywords):
                matched_conditions.append(condition)

        if matched_conditions:
            await db.products_master.update_one(
                {"_id": product["_id"]},
                {"$set": {"health_conditions": matched_conditions}}
            )
            tagged += 1

    print(f"\nDone. Scanned {scanned}, tagged {tagged} products.\n")

    # Post-run coverage report
    print("=== Coverage after tagging ===")
    all_conditions = list(HEALTH_CONDITION_RULES.keys())
    for condition in all_conditions:
        count = await db.products_master.count_documents({
            "health_conditions": condition,
            "is_active": {"$ne": False}
        })
        flag = "OK " if count >= 5 else ("LOW" if count > 0 else "NIL")
        print(f"  [{flag}] {condition}: {count} products")

    client.close()

if __name__ == "__main__":
    asyncio.run(run())
