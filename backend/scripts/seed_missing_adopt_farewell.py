"""
Seed missing adopt + farewell breed_products entries with correct prompts.

These entries have NO images yet (is_mockup=False).
When batch generation runs: POST /api/mockups/generate-batch {"pillar":"adopt","breed_filter":"corgi"}
it will pick these up, generate watercolor images, and auto-sync to products_master.

Breeds needing ADOPT (21): alaskan_malamute, american_bully, basenji, bichon_frise,
  bulldog, cavalier, chow_chow, corgi, dalmatian, french_bulldog, greyhound, husky,
  indie, indian_spitz, irish_setter, jack_russell, labradoodle, lhasa_apso,
  saint_bernard, schnoodle, yorkshire

Breeds needing FAREWELL (8): alaskan_malamute, basenji, bichon_frise, bulldog,
  corgi, indian_spitz, labradoodle, saint_bernard
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

BREED_FULL_NAMES = {
    "alaskan_malamute": "Alaskan Malamute",
    "american_bully":   "American Bully",
    "basenji":          "Basenji",
    "bichon_frise":     "Bichon Frise",
    "bulldog":          "Bulldog",
    "cavalier":         "Cavalier King Charles Spaniel",
    "chow_chow":        "Chow Chow",
    "corgi":            "Corgi",
    "dalmatian":        "Dalmatian",
    "french_bulldog":   "French Bulldog",
    "greyhound":        "Greyhound",
    "husky":            "Husky",
    "indie":            "Indie (Indian Street Dog)",
    "indian_spitz":     "Indian Spitz",
    "irish_setter":     "Irish Setter",
    "jack_russell":     "Jack Russell Terrier",
    "labradoodle":      "Labradoodle",
    "lhasa_apso":       "Lhasa Apso",
    "saint_bernard":    "Saint Bernard",
    "schnoodle":        "Schnoodle",
    "yorkshire":        "Yorkshire Terrier",
}

ADOPT_BREEDS = list(BREED_FULL_NAMES.keys())

FAREWELL_BREEDS = [
    "alaskan_malamute", "basenji", "bichon_frise", "bulldog",
    "corgi", "indian_spitz", "labradoodle", "saint_bernard"
]

# --- ADOPT PROMPT TEMPLATES ---
def adopt_prompts(breed_slug, breed_name):
    return [
        {
            "product_type": "welcome_kit",
            "name": f"{breed_name} Welcome Home Kit",
            "mockup_prompt": (
                f"Professional product photography of a new pet welcome home kit for {breed_name} dogs, "
                "includes welcome banner, first toy, treat jar, collar, and certificate, "
                "gift presentation, white background. "
                "Warm joyful colours, celebration of a new family member."
            ),
        },
        {
            "product_type": "adoption_folder",
            "name": f"{breed_name} Adoption Document Folder",
            "mockup_prompt": (
                f"Professional product photography of a pet adoption document folder with {breed_name} dog design, "
                "holds adoption certificate and papers, keepsake organizer, new pet paperwork, white background. "
                "Premium quality, tasteful design."
            ),
        },
    ]


# --- FAREWELL PROMPT TEMPLATES ---
def farewell_prompts(breed_slug, breed_name):
    return [
        {
            "product_type": "memorial_ornament",
            "name": f"{breed_name} Memorial Ornament",
            "mockup_prompt": (
                f"A beautiful memorial Christmas ornament photographed on a soft white background. "
                f"The ornament features a beautiful soulful watercolor illustration of a {breed_name} dog face "
                "ON the ceramic surface. Angel wings surrounding the portrait, soft golden halo effect. "
                "'Forever in Our Hearts' text delicately hand-lettered below the portrait. "
                "Warm, comforting, memorial aesthetic."
            ),
        },
        {
            "product_type": "memory_box",
            "name": f"{breed_name} Memory Box",
            "mockup_prompt": (
                f"Beautifully crafted wooden memory box with {breed_name} silhouette engraved on lid, "
                "velvet interior, keepsake quality, warm amber wood tones, studio photography, white background."
            ),
        },
        {
            "product_type": "paw_print_frame",
            "name": f"{breed_name} Paw Print Memorial Frame",
            "mockup_prompt": (
                f"A premium memorial frame with paw print impression area photographed on a clean white background. "
                f"The frame features a beautiful soulful watercolor illustration of a {breed_name} dog in the main photo area. "
                "Space for clay paw print impression on the side. "
                "'Always With Me' text elegantly engraved on the frame border."
            ),
        },
        {
            "product_type": "paw_print_kit",
            "name": f"{breed_name} Paw Print Keepsake Kit",
            "mockup_prompt": (
                f"Professional product photography of a pet paw print impression kit for {breed_name} dogs, "
                "clay and frame included, memorial keepsake, sample paw print visible, "
                "sentimental memorial product, white background."
            ),
        },
        {
            "product_type": "keepsake_box",
            "name": f"{breed_name} Memorial Keepsake Box",
            "mockup_prompt": (
                f"Professional product photography of a beautiful wooden pet memorial keepsake box "
                f"with engraved {breed_name} dog design, velvet interior visible, "
                "collar and photo inside, remembrance storage, white background."
            ),
        },
        {
            "product_type": "memorial_candle",
            "name": f"{breed_name} Memorial Candle",
            "mockup_prompt": (
                f"Professional product photography of a pet memorial candle in glass jar with "
                f"{breed_name} dog silhouette design, soft glowing light, remembrance tribute, "
                "peaceful and calming aesthetic, white background."
            ),
        },
        {
            "product_type": "remembrance_card",
            "name": f"{breed_name} Remembrance Card Set",
            "mockup_prompt": (
                f"Professional product photography of a set of pet remembrance memorial cards "
                f"featuring beautiful {breed_name} dog artwork, sympathy cards with envelopes, "
                "tasteful design, tribute stationery, white background."
            ),
        },
    ]


async def seed():
    db = AsyncIOMotorClient("mongodb://localhost:27017")["pet-os-live-test_database"]
    now = datetime.now(timezone.utc).isoformat()

    adopt_added = 0
    adopt_skipped = 0
    farewell_added = 0
    farewell_skipped = 0

    # --- SEED ADOPT ---
    print("=== Seeding ADOPT products ===")
    for breed in ADOPT_BREEDS:
        full_name = BREED_FULL_NAMES[breed]
        for product in adopt_prompts(breed, full_name):
            pid = f"breed-{breed}-{product['product_type']}"
            exists = await db.breed_products.find_one({"id": pid}, {"_id": 0, "id": 1})
            if exists:
                adopt_skipped += 1
                continue

            doc = {
                "id": pid,
                "breed": breed,
                "breed_name": full_name,
                "pillar": "adopt",
                "pillars": ["adopt"],
                "product_type": product["product_type"],
                "name": product["name"],
                "mockup_prompt": product["mockup_prompt"],
                "is_active": True,
                "is_mockup": False,           # No image yet — ready for generation
                "cloudinary_url": "",
                "mockup_url": "",
                "soul_made": True,
                "soul_tier": "tier_1",
                "created_at": now,
            }
            await db.breed_products.insert_one(doc)
            print(f"  ADOPT added: {pid}")
            adopt_added += 1

    print(f"\n  Adopt: {adopt_added} added, {adopt_skipped} already existed\n")

    # --- SEED FAREWELL ---
    print("=== Seeding FAREWELL products ===")
    for breed in FAREWELL_BREEDS:
        full_name = BREED_FULL_NAMES[breed]
        for product in farewell_prompts(breed, full_name):
            pid = f"breed-{breed}-{product['product_type']}"
            exists = await db.breed_products.find_one({"id": pid}, {"_id": 0, "id": 1})
            if exists:
                farewell_skipped += 1
                continue

            doc = {
                "id": pid,
                "breed": breed,
                "breed_name": full_name,
                "pillar": "farewell",
                "pillars": ["farewell"],
                "product_type": product["product_type"],
                "name": product["name"],
                "mockup_prompt": product["mockup_prompt"],
                "is_active": True,
                "is_mockup": False,           # No image yet — ready for generation
                "cloudinary_url": "",
                "mockup_url": "",
                "soul_made": True,
                "soul_tier": "tier_1",
                "created_at": now,
            }
            await db.breed_products.insert_one(doc)
            print(f"  FAREWELL added: {pid}")
            farewell_added += 1

    print(f"\n  Farewell: {farewell_added} added, {farewell_skipped} already existed")
    print(f"\n=== TOTAL: {adopt_added + farewell_added} entries seeded ===")
    print("\nThese entries have correct prompts but NO images yet.")
    print("To generate images, run the batch API:")
    print('  POST /api/mockups/generate-batch {"pillar": "adopt", "breed_filter": "corgi", "limit": 2}')
    print('  POST /api/mockups/generate-batch {"pillar": "farewell", "breed_filter": "corgi", "limit": 7}')

asyncio.run(seed())
