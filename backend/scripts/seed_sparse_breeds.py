"""
Seed ALL missing product types for the 4 sparse breeds:
  saint_bernard, bichon_frise, basenji, corgi

Each needs ~70 more products to reach 94.
All entries use correct watercolor prompts. No images yet (is_mockup=False).
When batch generation runs, these will get images and auto-sync to products_master.

Run: python3 /app/backend/scripts/seed_sparse_breeds.py
Generate: POST /api/mockups/generate-batch {"breed_filter": "corgi", "limit": 100}
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

SPARSE_BREEDS = {
    "saint_bernard": "Saint Bernard",
    "bichon_frise":  "Bichon Frise",
    "basenji":       "Basenji",
    "corgi":         "Corgi",
}

def make_prompt(pillar, product_type, breed_name):
    """Return the correct watercolor-style prompt for each product type."""

    prompts = {
        # ─── DINE ────────────────────────────────────────────────────────────
        "bowl": (
            f"A premium ceramic pet food bowl photographed from above on a clean white background. "
            f"The bowl interior bottom features a beautiful soulful watercolor illustration of a {breed_name} dog face. "
            "NO text on the bowl. Professional studio product photography."
        ),
        "lick_mat": (
            f"Professional product photography of a colorful silicone lick mat for dogs featuring "
            f"paw pattern design suited for {breed_name}, enrichment feeding toy, spread with peanut butter, "
            "suction cups visible underneath, white background, studio quality."
        ),
        "placemat": (
            f"Professional product photography of a decorative pet dining placemat featuring beautiful "
            f"{breed_name} dog artwork, elegant design, food-safe material, displayed with pet bowl, white background."
        ),
        "food_container": (
            f"Professional product photography of a modern airtight pet food storage container featuring "
            f"{breed_name} dog illustration, clear window showing kibble inside, premium quality, white background."
        ),
        "treat_jar": (
            f"Professional product photography of a premium glass treat jar with {breed_name} dog design "
            "on label, filled with dog treats visible, stylish kitchen storage, white background."
        ),

        # ─── CARE ────────────────────────────────────────────────────────────
        "collar_tag": (
            f"A premium silver metal pet ID tag in bone shape photographed on a clean white background. "
            f"The tag features a small soulful watercolor illustration of a {breed_name} dog silhouette engraved on it. "
            "Shiny finish, professional quality."
        ),
        "pet_towel": (
            f"A premium soft microfiber pet bath towel photographed on a clean white background. "
            f"The towel features a beautiful soulful watercolor illustration of a {breed_name} dog face "
            "PRINTED in the center. Fluffy texture visible, neatly folded presentation."
        ),
        "pet_robe": (
            f"A cozy pet drying robe/wrap photographed on a clean white background. "
            f"The robe features a beautiful soulful watercolor illustration of a {breed_name} dog face "
            "embroidered on the back. Soft terry cloth material."
        ),
        "grooming_apron": (
            f"A premium grooming apron for pet parents photographed on a clean white background. "
            f"The apron features a beautiful soulful watercolor illustration of a {breed_name} dog face "
            "PRINTED on the chest. Water-resistant material, adjustable straps."
        ),
        "grooming_pouch": (
            f"Professional product photography of a pet grooming toiletry pouch featuring cute {breed_name} "
            "dog illustration, containing grooming supplies visible, organized compartments, white background."
        ),
        "crate_mat": (
            f"Professional product photography of a comfortable pet crate mat featuring embroidered "
            f"{breed_name} dog design, soft padded material, fits inside crate, cozy bedding, white background."
        ),
        "room_sign": (
            f"Professional product photography of a cute wooden door sign reading Pet's Room featuring "
            f"adorable {breed_name} dog illustration, decorative home accent, hanging rope, white background."
        ),
        "cushion_cover": (
            f"Professional product photography of a premium decorative cushion cover featuring beautiful "
            f"artistic portrait of a {breed_name} dog, elegant home decor, soft fabric texture, white background."
        ),
        "pet_journal": (
            f"Professional product photography of a premium pet journal notebook with beautiful "
            f"{breed_name} dog illustration on cover, daily log pages visible, health tracker, white background."
        ),
        "care_guide": (
            f"Professional product photography of a comprehensive pet care guide book specifically for "
            f"{breed_name} dogs, illustrated pages visible, breed-specific tips, quality printing, white background."
        ),
        "breed_checklist": (
            f"Professional product photography of an illustrated pet care checklist poster featuring "
            f"{breed_name} dog graphics, daily and weekly care tasks, colorful infographic, white background."
        ),
        "first_bed": (
            f"Professional product photography of a cozy pet starter bed set sized for {breed_name} dogs, "
            "includes matching blanket, new pet essentials, comfortable bedding, white background."
        ),

        # ─── PLAY ────────────────────────────────────────────────────────────
        "play_bandana": (
            f"A premium white cotton pet bandana laid flat on a clean white background. "
            f"The bandana features a beautiful soulful watercolor illustration of a {breed_name} dog face "
            "PRINTED directly on the fabric center. NO TEXT. Playful design."
        ),
        "playdate_card": (
            f"Professional product photography of a premium illustrated playdate invitation card set "
            f"featuring {breed_name} dog artwork, colourful design, envelope included, white background."
        ),
        "fetch_toy": (
            f"Professional product photography of a premium interactive fetch toy set for "
            f"{breed_name} dogs, durable rubber ball and launcher, bright colours, white background."
        ),
        "rope_toy": (
            f"Professional product photography of a colorful braided rope tug toy for "
            f"{breed_name} dogs, durable cotton material, knot ends, white background."
        ),
        "sniff_mat": (
            f"Professional product photography of a colorful enrichment sniff mat for "
            f"{breed_name} dogs, fleece strips hiding treats, mental stimulation toy, white background."
        ),
        "activity_print": (
            f"Professional product photography of a framed activity print chart for {breed_name} dogs, "
            "illustrated play and exercise activities, colorful design, wall art, white background."
        ),

        # ─── GO ──────────────────────────────────────────────────────────────
        "blanket": (
            f"A premium soft travel blanket photographed on a clean white background. "
            f"The blanket features a beautiful soulful watercolor illustration of a {breed_name} dog face "
            "PRINTED across it. Plush texture, neatly folded."
        ),
        "luggage_tag": (
            f"A premium leather pet luggage tag with {breed_name} dog silhouette design, "
            "travel companion accessory, personalisation window, white background."
        ),
        "travel_bowl": (
            f"Professional product photography of a collapsible silicone travel water bowl for "
            f"{breed_name} dogs, folds flat, clip attachment for bag, white background."
        ),
        "car_sticker": (
            f"Professional product photography of a premium vinyl car sticker set featuring "
            f"adorable {breed_name} dog design, weather-resistant, variety of poses, white background."
        ),
        "passport_holder": (
            f"Professional product photography of a premium pet passport document holder featuring "
            f"{breed_name} dog illustration, holds vaccination records, travel essential, white background."
        ),
        "walking_set": (
            f"Professional product photography of a coordinated dog walking set for {breed_name} "
            "dogs, includes collar, lead, and poop bag holder, matching design, white background."
        ),
        "carrier_tag": (
            f"A premium pet carrier identification tag featuring soulful {breed_name} dog watercolor, "
            "attaches to travel carrier, emergency contact window, white background."
        ),
        "car_seat_protector": (
            f"Professional product photography of a premium car seat protector for {breed_name} dogs, "
            "waterproof material, hammock style, installed in back seat, white background."
        ),

        # ─── LEARN ───────────────────────────────────────────────────────────
        "training_log": (
            f"Professional product photography of a premium dog training log journal specifically for "
            f"{breed_name} dogs, progress tracking pages, illustrated cover, quality binding, white background."
        ),
        "treat_pouch": (
            f"Professional product photography of a training treat pouch for {breed_name} dogs, "
            "magnetic closure, clip attachment, multiple compartments, white background."
        ),
        "milestone_book": (
            f"Professional product photography of a beautiful pet milestone memory book for {breed_name} "
            "dogs, first year moments, photo pages, keepsake quality, white background."
        ),
        "breed_guide": (
            f"Professional product photography of an illustrated breed guide book for {breed_name} dogs, "
            "fun facts, training tips, illustrated throughout, educational, white background."
        ),
        "puzzle_feeder": (
            f"Professional product photography of a mental enrichment puzzle feeder for "
            f"{breed_name} dogs, sliding treat compartments, interactive design, white background."
        ),

        # ─── CELEBRATE ───────────────────────────────────────────────────────
        "bandana": (
            f"A premium white cotton pet bandana laid flat on a clean white background. "
            f"The bandana features a beautiful soulful watercolor illustration of a {breed_name} dog face "
            "PRINTED directly on the fabric center. NO TEXT — just the dog portrait. Birthday edition."
        ),
        "mug": (
            f"A premium ceramic coffee mug photographed on a clean white background. "
            f"The mug features a beautiful soulful watercolor illustration of a {breed_name} dog face "
            "PRINTED on the front. Pet parent gift. NO TEXT."
        ),
        "keychain": (
            f"A premium leather keychain photographed on a clean white background. "
            f"The keychain features a small beautiful soulful watercolor illustration of a {breed_name} dog "
            "face ON the charm. Gold hardware accent."
        ),
        "frame": (
            f"A premium photo frame photographed on a clean white background. "
            f"The frame border features beautiful soulful watercolor illustrations of {breed_name} dog motifs. "
            "Elegant, giftable, white mat board inside."
        ),
        "tote_bag": (
            f"A premium canvas tote bag photographed on a clean white background. "
            f"The bag features a large beautiful soulful watercolor illustration of a {breed_name} dog face "
            "PRINTED on the front. Stylish pet parent accessory."
        ),
        "party_hat": (
            f"A cute cone-shaped birthday party hat for dogs photographed on a clean white background. "
            f"The hat features a beautiful soulful watercolor illustration of a {breed_name} dog face. "
            "Elastic strap, festive design."
        ),
        "birthday_cake_topper": (
            f"Professional product photography of a birthday cake topper featuring {breed_name} dog design, "
            "gold glitter finish, birthday celebration, inserted in mini cake, white background."
        ),
        "pupcake_set": (
            f"Professional product photography of a dog-friendly pupcake baking mix set for "
            f"{breed_name} dog birthday, with decorations, cute packaging, white background."
        ),
        "birthday_card": (
            f"Professional product photography of a premium birthday card set featuring {breed_name} dog "
            "watercolor artwork, envelope included, pet birthday celebration, white background."
        ),
        "party_banner": (
            f"Professional product photography of a Happy Birthday party banner featuring {breed_name} dog "
            "design, bunting style, colourful, celebration decoration, white background."
        ),
        "party_favor_pack": (
            f"Professional product photography of a birthday party favor pack for {breed_name} dog "
            "owners, includes stickers, cards, mini treats, gift bags, white background."
        ),
        "treat_box": (
            f"Professional product photography of a premium gift treat box for {breed_name} dogs, "
            "birthday celebration packaging, curated dog treats inside, bow on top, white background."
        ),

        # ─── SHOP ────────────────────────────────────────────────────────────
        "phone_case": (
            f"Professional product photography of a premium phone case featuring {breed_name} dog "
            "watercolor artwork, clear protective case showing design, white background."
        ),
        "wall_art": (
            f"Professional product photography of a framed wall art print featuring beautiful "
            f"{breed_name} dog watercolor portrait, ready to hang, white mat, gallery quality, white background."
        ),
        "tshirt": (
            f"Professional product photography of a premium cotton t-shirt for pet parents featuring "
            f"beautiful {breed_name} dog watercolor illustration on front, folded flat lay, white background."
        ),
        "socks": (
            f"Professional product photography of premium cotton novelty socks featuring {breed_name} dog "
            "pattern, pair folded neatly, fun pet parent gift, white background."
        ),

        # ─── PAPERWORK ───────────────────────────────────────────────────────
        "vaccine_folder": (
            f"Professional product photography of a premium pet vaccination record folder for "
            f"{breed_name} dogs, organised compartments, health passport, white background."
        ),
        "document_holder": (
            f"Professional product photography of a pet document holder organizer featuring "
            f"{breed_name} dog design, holds vet records and certificates, white background."
        ),
        "id_tag": (
            f"A premium engraved metal ID tag for {breed_name} dogs, "
            "bone-shaped, name and contact fields, silver finish, white background."
        ),
        "health_passport": (
            f"Professional product photography of a premium pet health passport booklet for "
            f"{breed_name} dogs, holds vet visit records, vaccination history, white background."
        ),

        # ─── EMERGENCY ───────────────────────────────────────────────────────
        "emergency_kit": (
            f"Professional product photography of a complete pet first aid and emergency kit "
            f"for {breed_name} dogs, clearly labelled, red cross design, white background."
        ),
        "sos_card": (
            f"Professional product photography of a laminated pet SOS emergency information card "
            f"for {breed_name} owners, wallet-sized, vet contact details, white background."
        ),
    }

    return prompts.get(product_type)


def products_needed(breed_slug, breed_name):
    """Return list of (pillar, product_type, name) tuples for all missing products."""
    products = []

    # DINE — need: lick_mat, placemat, food_container, treat_jar (bowl may exist)
    for pt, name_suffix in [
        ("lick_mat",       "Enrichment Lick Mat"),
        ("placemat",       "Dining Placemat"),
        ("food_container", "Food Storage Container"),
        ("treat_jar",      "Treat Jar"),
    ]:
        products.append(("dine", pt, f"{breed_name} {name_suffix}"))

    # CARE
    for pt, name_suffix in [
        ("collar_tag",    "ID Tag"),
        ("pet_towel",     "Bath Towel"),
        ("pet_robe",      "Drying Robe"),
        ("grooming_apron","Grooming Apron"),
        ("grooming_pouch","Grooming Kit Pouch"),
        ("crate_mat",     "Crate Mat"),
        ("room_sign",     "Room Sign"),
        ("cushion_cover", "Cushion Cover"),
        ("pet_journal",   "Pet Journal"),
        ("care_guide",    "Care Guide Book"),
        ("breed_checklist","Care Checklist Poster"),
        ("first_bed",     "First Bed Set"),
    ]:
        products.append(("care", pt, f"{breed_name} {name_suffix}"))

    # PLAY
    for pt, name_suffix in [
        ("play_bandana",  "Play Bandana"),
        ("playdate_card", "Playdate Card"),
        ("fetch_toy",     "Fetch Toy Set"),
        ("rope_toy",      "Rope Tug Toy"),
        ("sniff_mat",     "Enrichment Sniff Mat"),
        ("activity_print","Activity Print"),
    ]:
        products.append(("play", pt, f"{breed_name} {name_suffix}"))

    # GO
    for pt, name_suffix in [
        ("blanket",         "Travel Blanket"),
        ("luggage_tag",     "Luggage Tag"),
        ("travel_bowl",     "Collapsible Travel Bowl"),
        ("car_sticker",     "Car Sticker Set"),
        ("passport_holder", "Pet Passport Holder"),
        ("walking_set",     "Walking Set"),
        ("carrier_tag",     "Carrier ID Tag"),
        ("car_seat_protector","Car Seat Protector"),
    ]:
        products.append(("go", pt, f"{breed_name} {name_suffix}"))

    # LEARN
    for pt, name_suffix in [
        ("training_log",  "Training Log"),
        ("treat_pouch",   "Training Treat Pouch"),
        ("milestone_book","Milestone Memory Book"),
        ("breed_guide",   "Breed Guide Book"),
        ("puzzle_feeder", "Puzzle Feeder"),
    ]:
        products.append(("learn", pt, f"{breed_name} {name_suffix}"))

    # CELEBRATE
    for pt, name_suffix in [
        ("bandana",           "Birthday Bandana"),
        ("mug",               "Ceramic Mug"),
        ("keychain",          "Keychain"),
        ("frame",             "Photo Frame"),
        ("tote_bag",          "Tote Bag"),
        ("party_hat",         "Birthday Party Hat"),
        ("birthday_cake_topper","Birthday Cake Topper"),
        ("pupcake_set",       "Pupcake Baking Set"),
        ("birthday_card",     "Birthday Card Set"),
        ("party_banner",      "Party Banner"),
        ("party_favor_pack",  "Party Favour Pack"),
        ("treat_box",         "Celebration Treat Box"),
    ]:
        products.append(("celebrate", pt, f"{breed_name} {name_suffix}"))

    # SHOP
    for pt, name_suffix in [
        ("phone_case", "Phone Case"),
        ("wall_art",   "Framed Wall Art"),
        ("tshirt",     "Pet Parent T-Shirt"),
        ("socks",      "Novelty Socks"),
    ]:
        products.append(("shop", pt, f"{breed_name} {name_suffix}"))

    # PAPERWORK
    for pt, name_suffix in [
        ("vaccine_folder",   "Vaccination Record Folder"),
        ("document_holder",  "Document Holder"),
        ("id_tag",           "ID Tag"),
        ("health_passport",  "Health Passport"),
    ]:
        products.append(("paperwork", pt, f"{breed_name} {name_suffix}"))

    # EMERGENCY
    for pt, name_suffix in [
        ("emergency_kit", "First Aid Emergency Kit"),
        ("sos_card",      "SOS Emergency Card"),
    ]:
        products.append(("emergency", pt, f"{breed_name} {name_suffix}"))

    return products


async def seed():
    db = AsyncIOMotorClient("mongodb://localhost:27017")["pet-os-live-test_database"]
    now = datetime.now(timezone.utc).isoformat()

    total_added = 0
    total_skipped = 0

    for breed_slug, breed_name in SPARSE_BREEDS.items():
        breed_added = 0
        breed_skipped = 0
        print(f"\n=== {breed_name.upper()} ===")

        for pillar, product_type, name in products_needed(breed_slug, breed_name):
            pid = f"breed-{breed_slug}-{product_type}"

            exists = await db.breed_products.find_one({"id": pid}, {"_id": 0, "id": 1})
            if exists:
                breed_skipped += 1
                continue

            prompt = make_prompt(pillar, product_type, breed_name)
            if not prompt:
                print(f"  WARNING: no prompt for {product_type} — skipping")
                continue

            doc = {
                "id": pid,
                "breed": breed_slug,
                "breed_name": breed_name,
                "pillar": pillar,
                "pillars": [pillar],
                "product_type": product_type,
                "name": name,
                "mockup_prompt": prompt,
                "is_active": True,
                "is_mockup": False,       # No image yet — ready for generation
                "cloudinary_url": "",
                "mockup_url": "",
                "soul_made": True,
                "soul_tier": "tier_1",
                "created_at": now,
            }
            await db.breed_products.insert_one(doc)
            breed_added += 1

        print(f"  Added: {breed_added} | Skipped (already existed): {breed_skipped}")
        total_added += breed_added
        total_skipped += breed_skipped

    print(f"\n=== TOTAL: {total_added} entries seeded, {total_skipped} already existed ===")
    print("\nTo generate images, run ONE breed at a time:")
    print('  POST /api/mockups/generate-batch {"breed_filter": "corgi", "limit": 100}')
    print('  POST /api/mockups/generate-batch {"breed_filter": "basenji", "limit": 100}')
    print('  POST /api/mockups/generate-batch {"breed_filter": "bichon_frise", "limit": 100}')
    print('  POST /api/mockups/generate-batch {"breed_filter": "saint_bernard", "limit": 100}')

asyncio.run(seed())
