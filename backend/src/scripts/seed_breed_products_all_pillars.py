#!/usr/bin/env python3
"""
seed_breed_products_all_pillars.py
Runs the breed product seed locally - 33 breeds × 19 templates = 627 products
Adds products for dine, care, go, play in addition to celebrate
"""
import asyncio, os, uuid, sys
sys.path.insert(0, "/app/backend")

from dotenv import load_dotenv
load_dotenv("/app/backend/.env")

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME   = os.environ.get("DB_NAME", "doggy_company")

TOP_BREEDS = [
    "Golden Retriever", "Labrador", "German Shepherd", "Beagle", "Shih Tzu",
    "Pug", "Rottweiler", "Doberman", "Husky", "Cocker Spaniel",
    "Boxer", "Poodle", "Dachshund", "French Bulldog", "Indie",
    "Great Dane", "Dalmatian", "Chihuahua", "Pomeranian", "Border Collie",
    "Bulldog", "Maltese", "Yorkshire Terrier", "Akita", "Saint Bernard",
    "Lhasa Apso", "Bichon Frise", "Corgi", "Samoyed", "Vizsla",
    "Weimaraner", "Basenji", "Alaskan Malamute"
]

PILLAR_TEMPLATES = [
    # ── DINE ────────────────────────────────────────────────────────────────
    {
        "what_is": "Breed Food Mat",
        "why_fits": "Mealtime Essential",
        "category": "dine_accessories",
        "pillars": ["dine"],
        "pillar": "dine",
        "price": 599,
        "soul_tier": "soul_made",
        "description_template": "A beautiful feeding mat designed for {breed}s — non-slip, easy-clean, and decorated with your dog's breed silhouette. Makes every mealtime special.",
        "mira_hint_template": "🍽 Mealtime joy! {breed}-illustrated feeding mat — non-slip & easy-clean",
        "image": "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400",
    },
    {
        "what_is": "Breed Ceramic Bowl",
        "why_fits": "Personalised Feed",
        "category": "dine_accessories",
        "pillars": ["dine"],
        "pillar": "dine",
        "price": 899,
        "soul_tier": "soul_made",
        "description_template": "Hand-painted {breed} ceramic bowl — the perfect feeding vessel. Dishwasher-safe with non-slip base.",
        "mira_hint_template": "🥣 Eat in style! Personalised {breed} ceramic bowl",
        "image": "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400",
    },
    {
        "what_is": "Breed Recipe Card",
        "why_fits": "Nutrition Guide",
        "category": "dine_accessories",
        "pillars": ["dine"],
        "pillar": "dine",
        "price": 299,
        "soul_tier": "soul_selected",
        "description_template": "A personalised {breed} recipe card with Mira-curated meal ideas, feeding guidelines, and breed-specific nutritional notes.",
        "mira_hint_template": "📋 Nutrition sorted! {breed}-specific recipe guide curated by Mira",
        "image": "https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=400",
    },
    # ── CARE ────────────────────────────────────────────────────────────────
    {
        "what_is": "Breed Grooming Guide",
        "why_fits": "Care Essential",
        "category": "care_accessories",
        "pillars": ["care"],
        "pillar": "care",
        "price": 399,
        "soul_tier": "soul_selected",
        "description_template": "A complete {breed} grooming guide — coat type, tools, frequency, and Mira's breed-specific care tips. Printed and illustrated.",
        "mira_hint_template": "✂️ Grooming sorted! {breed}-specific care guide with Mira's tips",
        "image": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",
    },
    {
        "what_is": "Breed Portrait Frame",
        "why_fits": "Vet Visit Companion",
        "category": "care_accessories",
        "pillars": ["care"],
        "pillar": "care",
        "price": 799,
        "soul_tier": "soul_made",
        "description_template": "A beautiful portrait frame designed for {breed}s — perfect for displaying at the vet or at home. Includes breed fact card.",
        "mira_hint_template": "🖼 Cherish your {breed}! Beautifully framed breed portrait",
        "image": "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400",
    },
    {
        "what_is": "Breed Wellness Kit",
        "why_fits": "Health Essentials",
        "category": "care_accessories",
        "pillars": ["care"],
        "pillar": "care",
        "price": 1299,
        "soul_tier": "soul_selected",
        "description_template": "A curated wellness kit for {breed}s — includes breed-specific supplements, grooming tool, dental chew, and care schedule from Mira.",
        "mira_hint_template": "💊 Health first! {breed} wellness kit curated by Mira",
        "image": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",
    },
    # ── GO (TRAVEL) ──────────────────────────────────────────────────────────
    {
        "what_is": "Breed Adventure Bandana",
        "why_fits": "Travel Identity",
        "category": "go_accessories",
        "pillars": ["go"],
        "pillar": "go",
        "price": 399,
        "soul_tier": "soul_made",
        "description_template": "Hit the trails in style — this adventure bandana is designed for {breed}s who love to explore. Soft, durable, and totally unique.",
        "mira_hint_template": "🌍 Adventure ready! {breed} explorer bandana for every journey",
        "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
    },
    {
        "what_is": "Breed Travel Tag",
        "why_fits": "Safety Essential",
        "category": "go_accessories",
        "pillars": ["go"],
        "pillar": "go",
        "price": 299,
        "soul_tier": "soul_made",
        "description_template": "A custom {breed} travel ID tag with your dog's name, breed, and emergency contact. Durable stainless steel with breed silhouette.",
        "mira_hint_template": "🏷 Travel safe! Custom {breed} ID tag for every adventure",
        "image": "https://images.unsplash.com/photo-1534361960057-19f4434d58c5?w=400",
    },
    {
        "what_is": "Breed Trail Guide",
        "why_fits": "Adventure Companion",
        "category": "go_accessories",
        "pillars": ["go"],
        "pillar": "go",
        "price": 499,
        "soul_tier": "soul_selected",
        "description_template": "A personalised trail and travel guide for {breed}s — best parks, pet-friendly destinations, and Mira's adventure tips for your breed.",
        "mira_hint_template": "🗺 Explore more! {breed} adventure trail guide by Mira",
        "image": "https://images.unsplash.com/photo-1534361960057-19f4434d58c5?w=400",
    },
    # ── PLAY ────────────────────────────────────────────────────────────────
    {
        "what_is": "Breed Play Bandana",
        "why_fits": "Play Identity",
        "category": "play_accessories",
        "pillars": ["play"],
        "pillar": "play",
        "price": 399,
        "soul_tier": "soul_made",
        "description_template": "Express your dog's play personality with this custom {breed} play bandana. Made for the dog park, the playdate, and every adventure in between.",
        "mira_hint_template": "🌳 Play in style! Custom {breed} play bandana",
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
    },
    {
        "what_is": "Breed Playdate Card",
        "why_fits": "Social Identity",
        "category": "play_accessories",
        "pillars": ["play"],
        "pillar": "play",
        "price": 299,
        "soul_tier": "soul_made",
        "description_template": "Make friends at the dog park — custom {breed} calling cards with your dog's name, photo slot, and playdate details. Set of 20.",
        "mira_hint_template": "🐾 Make friends! {breed} playdate cards — the coolest dog park accessory",
        "image": "https://images.unsplash.com/photo-1485290334039-a3c69043e517?w=400",
    },
    {
        "what_is": "Breed Activity Print",
        "why_fits": "Soul Expression",
        "category": "play_accessories",
        "pillars": ["play"],
        "pillar": "play",
        "price": 899,
        "soul_tier": "soul_made",
        "description_template": "A stunning illustrated {breed} activity print — showing your dog's top play activities, energy level, and soul personality. Ready to frame.",
        "mira_hint_template": "🎨 Soul art! {breed} personality print — frame-worthy and 100% personalised",
        "image": "https://images.unsplash.com/photo-1485290334039-a3c69043e517?w=400",
    },
]

async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    created = 0
    skipped = 0

    for breed in TOP_BREEDS:
        for tmpl in PILLAR_TEMPLATES:
            product_name = f"{breed} {tmpl['what_is']}"
            existing = await db.breed_products.find_one(
                {"breed": breed, "what_is": tmpl["what_is"], "pillar": tmpl["pillar"]}
            )
            if existing:
                skipped += 1
                continue

            prod = {
                "id": f"bp-{breed.lower().replace(' ','-')}-{tmpl['what_is'].lower().replace(' ','-')}-{tmpl['pillar']}-{uuid.uuid4().hex[:6]}",
                "name": product_name,
                "title": product_name,
                "who_for": breed,
                "breed": breed,
                "breed_name": breed,
                "what_is": tmpl["what_is"],
                "why_fits": tmpl["why_fits"],
                "short_description": tmpl["description_template"].format(breed=breed),
                "description": tmpl["description_template"].format(breed=breed),
                "category": tmpl["category"],
                "sub_category": f"{breed.lower().replace(' ','-')}-{tmpl['pillar']}",
                "pillars": tmpl["pillars"],
                "pillar": tmpl["pillar"],
                "breed_tags": [breed],
                "price": tmpl["price"],
                "compare_price": int(tmpl["price"] * 1.25),
                "pricing_model": "fixed",
                "sku": f"BP-{breed[:3].upper()}-{tmpl['what_is'][:3].upper()}-{tmpl['pillar'][:2].upper()}-{uuid.uuid4().hex[:4].upper()}",
                "vendor": "The Doggy Company",
                "in_stock": True,
                "stock_quantity": 100,
                "image": tmpl.get("image"),
                "images": [tmpl.get("image")],
                "primary_image": tmpl.get("image"),
                "mira_hint": tmpl["mira_hint_template"].format(breed=breed),
                "ai_tags": [breed.lower(), tmpl["what_is"].lower(), "personalised", "breed-specific", "soul"],
                "soul_tier": tmpl.get("soul_tier", "soul_selected"),
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            await db.breed_products.insert_one(prod)
            created += 1

        if created % 30 == 0 and created > 0:
            print(f"  Progress: {created} products created ({breed} done)...")

    total_bp = await db.breed_products.count_documents({})
    print(f"\n=== DONE ===")
    print(f"  New products: {created}")
    print(f"  Skipped (exists): {skipped}")
    print(f"  Total breed_products: {total_bp}")

    # Show pillar breakdown
    for pillar in ["dine", "care", "go", "play", "celebrate"]:
        count = await db.breed_products.count_documents({"pillar": pillar})
        print(f"  {pillar}: {count}")

    client.close()

asyncio.run(seed())
