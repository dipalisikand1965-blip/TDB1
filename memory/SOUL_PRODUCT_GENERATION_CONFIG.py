"""
SOUL_PRODUCT_GENERATION_CONFIG.md → stored as Python for persistence

This file records the soul product generation state so it survives agent restarts.
The background generation job can be re-triggered using:

    POST /api/admin/soul-products/generate
    Body: { "breeds": [...], "product_categories": [...] }

Or run directly:
    cd /app/backend && python3 -c "
    import asyncio
    from breed_catalogue import run_new_category_generation
    asyncio.run(run_new_category_generation())
    "

STATUS: Added Mar 20, 2026
NEW CATEGORIES:
  - breed-custom_portraits  (₹2,499 — highest value, AI watercolour portrait)
  - breed-phone_cases       (₹799 — impulse buy)
  - breed-wall_art          (₹1,899 — home décor, gifting)
  - breed-memory_boxes      (₹3,499 — Farewell pillar, most meaningful)
  - breed-birthday_cake_toppers (₹499 — Celebrate add-on)

BREEDS TO GENERATE FOR (47 breeds, priority order):
  Tier 1 (registered users' breeds — generate first):
    Indie, Maltese, Labrador Retriever, Golden Retriever, Shih Tzu, Pomeranian,
    Beagle, German Shepherd, Dachshund, Cocker Spaniel

  Tier 2 (most popular in India):
    Rottweiler, Dobermann, Boxer, Husky, Pug, Bulldog, Great Dane,
    Chihuahua, Yorkshire Terrier, Border Collie

  Tier 3 (remaining 27 breeds):
    All other breeds in BREED_PRODUCT_CATALOGUE

TRIGGER COMMAND:
    TOKEN=$(curl -s http://localhost:8001/api/auth/login
      -H "Content-Type: application/json"
      -d '{"email":"dipali@clubconcierge.in","password":"test123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

    curl -X POST http://localhost:8001/api/ai-images/generate-soul-products \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "categories": [
          "breed-custom_portraits",
          "breed-phone_cases",
          "breed-wall_art",
          "breed-memory_boxes",
          "breed-birthday_cake_toppers"
        ],
        "priority_breeds": ["Indie", "Maltese", "Labrador Retriever", "Golden Retriever", "Shih Tzu"]
      }'

MISSING BREEDS (should add to BREED_PRODUCT_CATALOGUE):
  - Maltipoo (registered user has one)
  - Miniature Schnauzer
  - Indian Spitz
  - Labradoodle / Goldendoodle
  - Australian Shepherd
  - Havanese
  - Boston Terrier
"""

NEW_SOUL_PRODUCT_CATEGORIES = [
    "breed-custom_portraits",
    "breed-phone_cases",
    "breed-wall_art",
    "breed-memory_boxes",
    "breed-birthday_cake_toppers",
]

PRIORITY_BREEDS = [
    "Indie",
    "Maltese",
    "Labrador Retriever",
    "Golden Retriever",
    "Shih Tzu",
    "Pomeranian",
    "Beagle",
    "German Shepherd",
    "Dachshund",
    "Cocker Spaniel",
]

GENERATION_STATUS = {
    "added_date": "2026-03-20",
    "categories_added": 5,
    "breeds_to_generate": 47,
    "estimated_new_products": 235,  # 5 categories × 47 breeds
    "status": "RUNNING — Custom Portrait (47 breeds) triggered Mar 20 2026. Run remaining 4 categories after",
}
