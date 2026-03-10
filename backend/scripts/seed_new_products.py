"""
Seed all 47 missing personalized products into the breed_products collection.
Each product will have:
- All 33 breeds
- Correct pillar assignments
- AI generation prompts
- Ready for Cloudinary upload
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# All 33 breeds
BREEDS = [
    "labrador", "golden_retriever", "german_shepherd", "beagle", "poodle",
    "bulldog", "rottweiler", "yorkshire", "boxer", "dachshund",
    "siberian_husky", "great_dane", "doberman", "shih_tzu", "pomeranian",
    "chihuahua", "pug", "cocker_spaniel", "border_collie", "australian_shepherd",
    "cavalier", "maltese", "boston_terrier", "havanese", "shetland_sheepdog",
    "bernese_mountain", "st_bernard", "akita", "samoyed", "weimaraner",
    "vizsla", "scottish_terrier", "indie"
]

# Display names for breeds
BREED_DISPLAY = {
    "labrador": "Labrador Retriever",
    "golden_retriever": "Golden Retriever", 
    "german_shepherd": "German Shepherd",
    "beagle": "Beagle",
    "poodle": "Poodle",
    "bulldog": "English Bulldog",
    "rottweiler": "Rottweiler",
    "yorkshire": "Yorkshire Terrier",
    "boxer": "Boxer",
    "dachshund": "Dachshund",
    "siberian_husky": "Siberian Husky",
    "great_dane": "Great Dane",
    "doberman": "Doberman",
    "shih_tzu": "Shih Tzu",
    "pomeranian": "Pomeranian",
    "chihuahua": "Chihuahua",
    "pug": "Pug",
    "cocker_spaniel": "Cocker Spaniel",
    "border_collie": "Border Collie",
    "australian_shepherd": "Australian Shepherd",
    "cavalier": "Cavalier King Charles",
    "maltese": "Maltese",
    "boston_terrier": "Boston Terrier",
    "havanese": "Havanese",
    "shetland_sheepdog": "Shetland Sheepdog",
    "bernese_mountain": "Bernese Mountain Dog",
    "st_bernard": "St. Bernard",
    "akita": "Akita",
    "samoyed": "Samoyed",
    "weimaraner": "Weimaraner",
    "vizsla": "Vizsla",
    "scottish_terrier": "Scottish Terrier",
    "indie": "Indian Pariah Dog"
}

# 47 NEW PRODUCTS TO ADD
NEW_PRODUCTS = [
    # CELEBRATE (5 new)
    {
        "product_type": "cake_topper",
        "name_template": "{breed} Birthday Cake Topper",
        "description": "Premium acrylic cake topper featuring elegant {breed} silhouette. Perfect for birthday celebrations.",
        "pillars": ["celebrate"],
        "price": 599,
        "prompt_template": "Professional product photography of an elegant acrylic birthday cake topper featuring a beautiful {breed} dog silhouette cutout, placed on top of a stylish dog birthday cake, premium quality, celebration theme, warm lighting, white background, high-end pet product"
    },
    {
        "product_type": "pupcake_set",
        "name_template": "{breed} Pupcake Decoration Set",
        "description": "Adorable pupcake toppers featuring {breed} face designs. Set of 12 food-safe decorations.",
        "pillars": ["celebrate"],
        "price": 449,
        "prompt_template": "Professional product photography of a set of cute cupcake toppers featuring adorable {breed} dog face designs, displayed on colorful pupcakes, party celebration theme, cheerful colors, white background, food-safe pet party supplies"
    },
    {
        "product_type": "birthday_card",
        "name_template": "{breed} Birthday Card",
        "description": "Beautiful illustrated birthday card featuring {breed} artwork. Includes envelope.",
        "pillars": ["celebrate"],
        "price": 199,
        "prompt_template": "Professional product photography of a premium birthday greeting card featuring beautiful watercolor illustration of a {breed} dog wearing a party hat, elegant design, celebration theme, displayed standing with envelope, white background"
    },
    {
        "product_type": "party_banner",
        "name_template": "{breed} Party Banner",
        "description": "Festive 'Happy Birthday' banner with {breed} illustrations. 2 meters long.",
        "pillars": ["celebrate"],
        "price": 399,
        "prompt_template": "Professional product photography of a colorful Happy Birthday party banner featuring cute {breed} dog illustrations, festive bunting style, celebration decorations, cheerful colors, displayed stretched out, white background"
    },
    {
        "product_type": "return_gift_pack",
        "name_template": "{breed} Party Favor Pack",
        "description": "Set of 10 party favor bags with {breed} themed design. Perfect for puppy party guests.",
        "pillars": ["celebrate"],
        "price": 499,
        "prompt_template": "Professional product photography of cute party favor gift bags featuring {breed} dog themed design, set of colorful treat bags with ribbon ties, party celebration supplies, cheerful design, white background"
    },
    
    # DINE (4 new)
    {
        "product_type": "feeding_mat",
        "name_template": "{breed} Feeding Mat",
        "description": "Premium silicone feeding mat with {breed} silhouette design. Waterproof and easy to clean.",
        "pillars": ["dine"],
        "price": 699,
        "prompt_template": "Professional product photography of a premium silicone pet feeding mat featuring elegant {breed} dog silhouette design, waterproof surface, modern minimal design, with food and water bowls placed on it, clean white background"
    },
    {
        "product_type": "food_container",
        "name_template": "{breed} Food Storage Container",
        "description": "Airtight food storage container with {breed} artwork. Keeps food fresh. 5kg capacity.",
        "pillars": ["dine"],
        "price": 899,
        "prompt_template": "Professional product photography of a modern airtight pet food storage container featuring {breed} dog illustration, clear window showing kibble inside, premium quality, functional design, white background"
    },
    {
        "product_type": "placemat",
        "name_template": "{breed} Dining Placemat",
        "description": "Decorative dining placemat featuring beautiful {breed} artwork. Wipe-clean surface.",
        "pillars": ["dine"],
        "price": 449,
        "prompt_template": "Professional product photography of a decorative pet dining placemat featuring beautiful {breed} dog artwork, elegant design, food-safe material, displayed with pet bowl, white background"
    },
    {
        "product_type": "lick_mat",
        "name_template": "{breed} Enrichment Lick Mat",
        "description": "Silicone lick mat for slow feeding and enrichment. {breed} paw pattern design.",
        "pillars": ["dine", "enjoy"],
        "price": 549,
        "prompt_template": "Professional product photography of a colorful silicone lick mat for dogs featuring paw pattern design suited for {breed}, enrichment feeding toy, spread with peanut butter, suction cups visible, white background"
    },
    
    # STAY (3 new)
    {
        "product_type": "cushion_cover",
        "name_template": "{breed} Cushion Cover",
        "description": "Premium cushion cover featuring beautiful {breed} portrait. 18x18 inches.",
        "pillars": ["stay"],
        "price": 799,
        "prompt_template": "Professional product photography of a premium decorative cushion cover featuring beautiful artistic portrait of a {breed} dog, elegant home decor, soft fabric texture, displayed on neutral couch, white background"
    },
    {
        "product_type": "crate_mat",
        "name_template": "{breed} Crate Mat",
        "description": "Comfortable washable crate mat with {breed} embroidery. Multiple sizes available.",
        "pillars": ["stay", "travel"],
        "price": 999,
        "prompt_template": "Professional product photography of a comfortable pet crate mat featuring embroidered {breed} dog design, soft padded material, fits inside crate, cozy bedding, white background"
    },
    {
        "product_type": "room_sign",
        "name_template": "{breed} Room Sign",
        "description": "Adorable door sign for your pet's space. Features {breed} illustration.",
        "pillars": ["stay"],
        "price": 399,
        "prompt_template": "Professional product photography of a cute wooden door sign reading Pet's Room featuring adorable {breed} dog illustration, decorative home accent, hanging rope, charming design, white background"
    },
    
    # TRAVEL (2 new)
    {
        "product_type": "travel_pouch",
        "name_template": "{breed} Travel Organizer Pouch",
        "description": "Multi-pocket travel pouch for pet essentials. {breed} embroidered design.",
        "pillars": ["travel"],
        "price": 799,
        "prompt_template": "Professional product photography of a premium pet travel organizer pouch featuring embroidered {breed} dog design, multiple pockets and compartments, holding treats and supplies, practical travel accessory, white background"
    },
    {
        "product_type": "car_seat_protector",
        "name_template": "{breed} Car Seat Cover",
        "description": "Waterproof back seat protector with {breed} paw print design. Universal fit.",
        "pillars": ["travel"],
        "price": 1499,
        "prompt_template": "Professional product photography of a waterproof car back seat protector cover featuring {breed} dog paw print design, installed in car interior, durable material, pet travel safety, product showcase angle"
    },
    
    # CARE (2 new)
    {
        "product_type": "grooming_pouch",
        "name_template": "{breed} Grooming Kit Pouch",
        "description": "Toiletry bag for pet grooming supplies. {breed} illustration on front.",
        "pillars": ["care"],
        "price": 599,
        "prompt_template": "Professional product photography of a pet grooming toiletry pouch featuring cute {breed} dog illustration, containing grooming supplies visible, organized compartments, practical pet care accessory, white background"
    },
    {
        "product_type": "id_tag",
        "name_template": "{breed} ID Tag",
        "description": "Premium metal ID tag shaped like {breed} silhouette. Engravable.",
        "pillars": ["care", "emergency"],
        "price": 349,
        "prompt_template": "Professional product photography of a premium metal pet ID tag shaped like a {breed} dog silhouette, polished finish, with engraved name and phone visible, attached to collar, white background"
    },
    
    # ENJOY (6 new - all missing!)
    {
        "product_type": "personalized_toy",
        "name_template": "{breed} Personalized Plush Toy",
        "description": "Soft plush toy with embroidered name tag. Perfect for {breed} companions.",
        "pillars": ["enjoy"],
        "price": 699,
        "prompt_template": "Professional product photography of a cute soft plush dog toy with embroidered personalized name tag, designed for {breed} dogs, squeaky toy, colorful and playful, white background"
    },
    {
        "product_type": "breed_plush",
        "name_template": "{breed} Mini-Me Plush",
        "description": "Adorable plush toy that looks like a {breed}. Your pet's new best friend!",
        "pillars": ["enjoy"],
        "price": 899,
        "prompt_template": "Professional product photography of an adorable plush stuffed toy designed to look like a {breed} dog, cute mini-me lookalike, soft and cuddly, realistic breed features, white background"
    },
    {
        "product_type": "rope_toy",
        "name_template": "{breed} Rope Tug Toy",
        "description": "Durable rope toy with {breed} name tag charm. Great for tug games.",
        "pillars": ["enjoy", "fit"],
        "price": 449,
        "prompt_template": "Professional product photography of a colorful durable rope tug toy for dogs with personalized name tag charm, sized appropriately for {breed}, braided design, interactive play toy, white background"
    },
    {
        "product_type": "enrichment_mat",
        "name_template": "{breed} Snuffle Mat",
        "description": "Interactive snuffle mat for mental stimulation. Sized for {breed} dogs.",
        "pillars": ["enjoy", "learn"],
        "price": 799,
        "prompt_template": "Professional product photography of a colorful snuffle mat enrichment toy for dogs, fleece fabric hiding treats, mental stimulation toy sized for {breed}, interactive feeding game, white background"
    },
    {
        "product_type": "fetch_toy_set",
        "name_template": "{breed} Fetch Toy Set",
        "description": "Set of 3 fetch toys with personalized name. Balls and frisbee included.",
        "pillars": ["enjoy", "fit"],
        "price": 599,
        "prompt_template": "Professional product photography of a set of dog fetch toys including balls and frisbee with personalized name printed, sized for {breed} dogs, bright colors, outdoor play toys, white background"
    },
    {
        "product_type": "photo_props",
        "name_template": "{breed} Celebration Props Set",
        "description": "Fun photo props for special occasions. Includes hats, glasses, signs for {breed}.",
        "pillars": ["enjoy", "celebrate"],
        "price": 499,
        "prompt_template": "Professional product photography of a set of fun pet photo props including party hats, novelty glasses, and celebration signs, designed for {breed} dog photoshoots, colorful party accessories, white background"
    },
    
    # FIT (4 new)
    {
        "product_type": "walking_set",
        "name_template": "{breed} Walking Harness Set",
        "description": "Premium harness and leash combo sized for {breed}. Matching design.",
        "pillars": ["fit"],
        "price": 1299,
        "prompt_template": "Professional product photography of a premium dog walking harness and leash set with matching design, properly sized for {breed} dogs, comfortable padded harness, stylish pattern, white background"
    },
    {
        "product_type": "personalized_lead",
        "name_template": "{breed} Personalized Leash",
        "description": "Quality leash with embroidered pet name. {breed} sized length.",
        "pillars": ["fit"],
        "price": 699,
        "prompt_template": "Professional product photography of a premium dog leash with embroidered personalized name, appropriate length for {breed} dogs, quality hardware, stylish design, white background"
    },
    {
        "product_type": "poop_bag_holder",
        "name_template": "{breed} Poop Bag Dispenser",
        "description": "Stylish bag dispenser with {breed} charm. Clips to any leash.",
        "pillars": ["fit"],
        "price": 399,
        "prompt_template": "Professional product photography of a stylish dog poop bag dispenser holder with cute {breed} dog charm attached, clips to leash, practical walking accessory, includes bags, white background"
    },
    {
        "product_type": "activity_toy",
        "name_template": "{breed} Outdoor Activity Toy",
        "description": "Interactive outdoor toy perfect for active {breed} dogs.",
        "pillars": ["fit", "enjoy"],
        "price": 549,
        "prompt_template": "Professional product photography of an interactive outdoor dog activity toy, designed for active {breed} dogs, durable material, bright colors, exercise and play equipment, white background"
    },
    
    # LEARN (4 new - all missing!)
    {
        "product_type": "training_kit",
        "name_template": "{breed} Training Starter Kit",
        "description": "Complete training kit with clicker, treats pouch, and {breed} training guide.",
        "pillars": ["learn"],
        "price": 999,
        "prompt_template": "Professional product photography of a complete dog training starter kit including clicker, treat pouch, and training guide booklet with {breed} specific tips, organized set, educational pet supplies, white background"
    },
    {
        "product_type": "learning_cards",
        "name_template": "{breed} Training Flashcards",
        "description": "Illustrated training cards with {breed} specific tips. 50 card set.",
        "pillars": ["learn"],
        "price": 449,
        "prompt_template": "Professional product photography of a set of illustrated dog training flashcards featuring {breed} dog illustrations, colorful educational cards, command training tips, displayed fanned out, white background"
    },
    {
        "product_type": "pet_journal",
        "name_template": "{breed} Pet Journal",
        "description": "Daily log journal with {breed} cover illustration. Track health, meals, activities.",
        "pillars": ["learn", "care"],
        "price": 599,
        "prompt_template": "Professional product photography of a premium pet journal notebook with beautiful {breed} dog illustration on cover, daily log pages visible, health and activity tracker, quality binding, white background"
    },
    {
        "product_type": "milestone_book",
        "name_template": "{breed} First Year Memory Book",
        "description": "Document your {breed} puppy's first year with this milestone memory book.",
        "pillars": ["learn", "celebrate"],
        "price": 799,
        "prompt_template": "Professional product photography of a puppy first year milestone memory book featuring {breed} dog themed pages, scrapbook style, photo spaces and milestone markers, sentimental keepsake, white background"
    },
    
    # PAPERWORK (4 new - all missing!)
    {
        "product_type": "vaccine_folder",
        "name_template": "{breed} Vaccine Record Folder",
        "description": "Organized folder for vaccination records. {breed} design cover.",
        "pillars": ["paperwork", "care"],
        "price": 399,
        "prompt_template": "Professional product photography of a pet vaccine record folder organizer with {breed} dog design cover, document pockets visible, medical record keeper, organized pet paperwork, white background"
    },
    {
        "product_type": "document_holder",
        "name_template": "{breed} Document Holder",
        "description": "Keep all pet documents organized. Features {breed} artwork.",
        "pillars": ["paperwork"],
        "price": 499,
        "prompt_template": "Professional product photography of a pet document holder portfolio featuring {breed} dog artwork on cover, multiple document sections, registration papers visible, organized filing system, white background"
    },
    {
        "product_type": "medical_file",
        "name_template": "{breed} Medical Record Binder",
        "description": "Comprehensive health history binder for your {breed}.",
        "pillars": ["paperwork", "emergency"],
        "price": 699,
        "prompt_template": "Professional product photography of a pet medical record binder with {breed} dog themed cover, health history sections, vet visit logs, tabbed dividers visible, comprehensive pet health file, white background"
    },
    {
        "product_type": "pet_profile_book",
        "name_template": "{breed} Pet Profile Book",
        "description": "Complete pet information book. All your {breed}'s details in one place.",
        "pillars": ["paperwork", "emergency"],
        "price": 599,
        "prompt_template": "Professional product photography of a comprehensive pet profile book featuring {breed} dog cover design, personal info pages, emergency contacts, dietary info sections, complete pet reference guide, white background"
    },
    
    # ADVISORY (3 new - all missing!)
    {
        "product_type": "care_guide",
        "name_template": "{breed} Care Guide Book",
        "description": "Comprehensive care guide specifically for {breed} owners.",
        "pillars": ["advisory", "learn"],
        "price": 699,
        "prompt_template": "Professional product photography of a comprehensive pet care guide book specifically for {breed} dogs, illustrated pages visible, breed-specific tips, educational pet book, quality printing, white background"
    },
    {
        "product_type": "starter_kit",
        "name_template": "{breed} New Pet Starter Kit",
        "description": "Essential items bundle for new {breed} parents. Everything you need to start.",
        "pillars": ["advisory", "adopt"],
        "price": 2499,
        "prompt_template": "Professional product photography of a new pet starter kit bundle for {breed} dogs, includes essentials like bowl, collar, toy, guide book, welcome items arranged attractively, gift-ready presentation, white background"
    },
    {
        "product_type": "breed_checklist",
        "name_template": "{breed} Care Checklist Poster",
        "description": "Illustrated checklist poster with {breed} specific care tips.",
        "pillars": ["advisory"],
        "price": 349,
        "prompt_template": "Professional product photography of an illustrated pet care checklist poster featuring {breed} dog graphics, daily and weekly care tasks, colorful infographic design, educational wall art, white background"
    },
    
    # EMERGENCY (3 new)
    {
        "product_type": "first_aid_kit",
        "name_template": "{breed} First Aid Kit",
        "description": "Pet emergency first aid kit with {breed} sized supplies.",
        "pillars": ["emergency"],
        "price": 1299,
        "prompt_template": "Professional product photography of a pet first aid kit with {breed} dog design case, medical supplies visible inside, bandages and emergency items, pet safety equipment, white background"
    },
    {
        "product_type": "car_sticker",
        "name_template": "{breed} Pet Inside Car Sticker",
        "description": "'Pet Inside' emergency car sticker featuring {breed} design.",
        "pillars": ["emergency", "travel"],
        "price": 199,
        "prompt_template": "Professional product photography of a Pet Inside emergency car window sticker decal featuring {breed} dog design, safety alert sticker, rescue information, displayed on glass surface, white background"
    },
    {
        "product_type": "emergency_pouch",
        "name_template": "{breed} Emergency Grab Pouch",
        "description": "Ready-to-go emergency pouch with {breed} essentials checklist.",
        "pillars": ["emergency", "travel"],
        "price": 899,
        "prompt_template": "Professional product photography of a pet emergency grab-and-go pouch with {breed} dog design, packed with essentials, survival kit contents visible, preparedness supplies, white background"
    },
    
    # FAREWELL (4 new)
    {
        "product_type": "paw_print_kit",
        "name_template": "{breed} Paw Print Keepsake Kit",
        "description": "Create lasting paw print memories of your beloved {breed}.",
        "pillars": ["farewell"],
        "price": 699,
        "prompt_template": "Professional product photography of a pet paw print impression kit for {breed} dogs, clay and frame included, memorial keepsake, sample paw print visible, sentimental memorial product, white background"
    },
    {
        "product_type": "keepsake_box",
        "name_template": "{breed} Memorial Keepsake Box",
        "description": "Beautiful wooden keepsake box with {breed} engraving. Store precious memories.",
        "pillars": ["farewell"],
        "price": 1299,
        "prompt_template": "Professional product photography of a beautiful wooden pet memorial keepsake box with engraved {breed} dog design, velvet interior visible, collar and photo inside, remembrance storage, white background"
    },
    {
        "product_type": "memorial_candle",
        "name_template": "{breed} Memorial Candle",
        "description": "Soothing memorial candle with {breed} silhouette design.",
        "pillars": ["farewell"],
        "price": 499,
        "prompt_template": "Professional product photography of a pet memorial candle in glass jar with {breed} dog silhouette design, soft glowing light, remembrance tribute, peaceful and calming aesthetic, white background"
    },
    {
        "product_type": "remembrance_card",
        "name_template": "{breed} Remembrance Card Set",
        "description": "Set of 10 memorial cards featuring {breed} artwork. Share memories.",
        "pillars": ["farewell"],
        "price": 349,
        "prompt_template": "Professional product photography of a set of pet remembrance memorial cards featuring beautiful {breed} dog artwork, sympathy cards with envelopes, tasteful design, tribute stationery, white background"
    },
    
    # ADOPT (3 new)
    {
        "product_type": "welcome_kit",
        "name_template": "{breed} Welcome Home Kit",
        "description": "Complete welcome kit for your new {breed}. Celebration essentials included.",
        "pillars": ["adopt", "celebrate"],
        "price": 1999,
        "prompt_template": "Professional product photography of a new pet welcome home kit for {breed} dogs, includes welcome banner, first toy, treat jar, collar, and certificate, gift presentation, white background"
    },
    {
        "product_type": "first_bed",
        "name_template": "{breed} First Bed Set",
        "description": "Cozy starter bed sized perfectly for {breed}. Includes blanket.",
        "pillars": ["adopt", "stay"],
        "price": 1499,
        "prompt_template": "Professional product photography of a cozy pet starter bed set sized for {breed} dogs, includes matching blanket, welcoming new pet essentials, comfortable bedding, white background"
    },
    {
        "product_type": "adoption_folder",
        "name_template": "{breed} Adoption Document Folder",
        "description": "Organize adoption papers for your new {breed}. Keepsake folder.",
        "pillars": ["adopt", "paperwork"],
        "price": 449,
        "prompt_template": "Professional product photography of a pet adoption document folder with {breed} dog design, holds adoption certificate and papers, keepsake organizer, new pet paperwork, white background"
    }
]


async def seed_new_products():
    """Seed all 47 new products for all 33 breeds."""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'pet-os-live-test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("=" * 70)
    print("SEEDING 47 NEW PRODUCT TYPES × 33 BREEDS")
    print("=" * 70)
    
    total_created = 0
    total_skipped = 0
    
    for product_def in NEW_PRODUCTS:
        product_type = product_def["product_type"]
        print(f"\n📦 {product_type.upper()}")
        
        for breed in BREEDS:
            breed_display = BREED_DISPLAY.get(breed, breed.replace("_", " ").title())
            
            # Create product ID
            product_id = f"breed-{breed}-{product_type}"
            
            # Check if already exists
            existing = await db.breed_products.find_one({"id": product_id})
            if existing:
                total_skipped += 1
                continue
            
            # Create product document
            product = {
                "id": product_id,
                "breed": breed,
                "breed_display": breed_display,
                "product_type": product_type,
                "name": product_def["name_template"].format(breed=breed_display),
                "description": product_def["description"].format(breed=breed_display),
                "pillars": product_def["pillars"],
                "price": product_def["price"],
                "currency": "INR",
                "mockup_prompt": product_def["prompt_template"].format(breed=breed_display),
                "mockup_url": None,  # Will be generated
                "in_stock": True,
                "is_soul_made": True,
                "source": "soul_made",
                "created_at": datetime.utcnow().isoformat(),
                "generation_status": "pending"
            }
            
            await db.breed_products.insert_one(product)
            total_created += 1
        
        print(f"   ✅ Created {len(BREEDS)} products for {product_type}")
    
    print(f"\n{'=' * 70}")
    print(f"SEEDING COMPLETE")
    print(f"{'=' * 70}")
    print(f"Total products created: {total_created}")
    print(f"Total products skipped (already exist): {total_skipped}")
    print(f"Total expected: {len(NEW_PRODUCTS)} × {len(BREEDS)} = {len(NEW_PRODUCTS) * len(BREEDS)}")
    
    # Get updated stats
    total = await db.breed_products.count_documents({})
    with_mockups = await db.breed_products.count_documents({
        "mockup_url": {"$regex": "^https://res.cloudinary"}
    })
    with_prompts = await db.breed_products.count_documents({
        "mockup_prompt": {"$exists": True, "$ne": None, "$ne": ""}
    })
    
    print(f"\n📊 UPDATED STATS:")
    print(f"   Total products in DB: {total}")
    print(f"   With mockup prompts: {with_prompts}")
    print(f"   With generated mockups: {with_mockups}")
    print(f"   Pending generation: {with_prompts - with_mockups}")


if __name__ == "__main__":
    asyncio.run(seed_new_products())
