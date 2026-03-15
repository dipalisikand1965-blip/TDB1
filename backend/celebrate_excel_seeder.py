"""
celebrate_excel_seeder.py
Seeds 93 missing celebrate products from the Celebrate_ProductCatalogue_SEED.xlsx
into products_master with AI-generated Cloudinary images.

Usage:
  POST /api/admin/celebrate/seed-from-excel
  GET  /api/admin/celebrate/excel-seed-status
"""

import uuid
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict

logger = logging.getLogger(__name__)

excel_seed_status: Dict = {
    "running": False,
    "phase": "idle",
    "total": 0,
    "seeded": 0,
    "images_done": 0,
    "images_failed": 0,
    "current_item": None,
    "started_at": None,
    "finished_at": None,
    "recent_images": [],
    "errors": [],
}


def _id(sku: str) -> str:
    return f"cel-{sku.lower()}-{uuid.uuid4().hex[:6]}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ──────────────────────────────────────────────────────────────────────────────
# All 93 products from Celebrate_ProductCatalogue_SEED.xlsx
# ──────────────────────────────────────────────────────────────────────────────
EXCEL_CELEBRATE_PRODUCTS = [

    # ═══════════════════════════════════════════════════════
    # FOOD & FLAVOUR (FF)
    # ═══════════════════════════════════════════════════════
    {
        "sku": "FF-001", "name": "Salmon Birthday Cake",
        "subtitle": "The centrepiece — soy-free, hand-decorated",
        "description": "A full birthday cake for dogs. Salmon base, sweet potato frosting, bone-shaped biscuit decoration. Soy-free, chicken-free. Ships with personalised birthday card.",
        "price": 899, "category": "cakes", "tab": "Birthday Feast",
        "mira_tag": "Mojo's birthday cake", "pillar": "food",
        "tags": ["salmon", "birthday-cake", "celebrate", "soy-free", "hand-decorated"],
        "shopify_tags": "celebrate,celebrate-food,birthday-feast,birthday-cake,salmon,soy-free",
        "ai_image_prompt": "Elegant birthday cake for dogs, salmon and sweet potato layers, cream cheese frosting with paw print decoration, bone-shaped biscuit on top, white background, professional food photography, warm soft lighting",
    },
    {
        "sku": "FF-002", "name": "Birthday Feast Bundle",
        "subtitle": "Cake + biscuits + treat platter — save ₹198",
        "description": "The complete birthday feast: Salmon Birthday Cake + Salmon Biscuit Box (12 biscuits) + Birthday Treat Platter. Everything for the feast in one order.",
        "price": 1499, "category": "cakes", "tab": "Birthday Feast",
        "mira_tag": "Mira's pick", "pillar": "food",
        "tags": ["bundle", "birthday-feast", "celebrate", "salmon", "soy-free"],
        "shopify_tags": "celebrate,celebrate-food,birthday-feast,bundle,salmon",
        "ai_image_prompt": "Dog birthday feast bundle: birthday cake, biscuit box and treat platter arranged together on a wooden board, celebratory decorations, professional food photography, warm golden lighting",
    },
    {
        "sku": "FF-003", "name": "Paw Print Birthday Cupcakes",
        "subtitle": "6-pack, soy-free, party-sized",
        "description": "6 cupcake-sized treats with paw print decoration. Salmon or peanut butter base. Soy-free. Perfect for a pawty with guests.",
        "price": 549, "category": "cakes", "tab": "Birthday Feast",
        "mira_tag": "Pawty ready", "pillar": "food",
        "tags": ["cupcakes", "paw-print", "birthday", "celebrate", "party"],
        "shopify_tags": "celebrate,celebrate-food,birthday-feast,cupcakes,pawty,soy-free",
        "ai_image_prompt": "6 dog birthday cupcakes with paw print frosting decoration, salmon flavor, arranged on a white tiered stand, pastel pink background, professional food photography",
    },
    {
        "sku": "FF-004", "name": "Peanut Butter Birthday Cake",
        "subtitle": "Allergen-friendly, most loved flavour",
        "description": "Full birthday cake with peanut butter frosting, banana decoration, all-natural ingredients. No artificial flavours.",
        "price": 849, "category": "cakes", "tab": "Birthday Feast",
        "mira_tag": "Classic flavour", "pillar": "food",
        "tags": ["peanut-butter", "birthday-cake", "celebrate", "banana", "natural"],
        "shopify_tags": "celebrate,celebrate-food,birthday-feast,birthday-cake,peanut-butter",
        "ai_image_prompt": "Dog birthday cake with creamy peanut butter frosting, banana slice decoration, bone-shaped dog biscuits on top, clean white background, professional product photography",
    },
    {
        "sku": "FF-005", "name": "Salmon Biscuit Box",
        "subtitle": "12 hand-baked salmon biscuits",
        "description": "12 salmon-flavour dog biscuits, baked fresh, soy-free. Great as everyday treat or party favour.",
        "price": 449, "category": "treats", "tab": "Everyday Treats",
        "mira_tag": "Mojo's daily treat", "pillar": "food",
        "tags": ["salmon", "biscuits", "treats", "celebrate", "soy-free"],
        "shopify_tags": "celebrate,celebrate-food,everyday-treats,salmon,biscuits",
        "ai_image_prompt": "Box of homemade dog salmon biscuits, bone-shaped, arranged in kraft paper gift box with ribbon, natural wood background, product photography",
    },
    {
        "sku": "FF-006", "name": "Peanut Butter Drops",
        "subtitle": "30 training-sized drops",
        "description": "30 peanut butter training treat drops. Natural peanut butter, oat base. Allergen-safe. Ideal for birthday training sessions.",
        "price": 349, "category": "treats", "tab": "Everyday Treats",
        "mira_tag": "Training treat", "pillar": "food",
        "tags": ["peanut-butter", "training-treats", "celebrate", "small-batch"],
        "shopify_tags": "celebrate,celebrate-food,everyday-treats,peanut-butter,training",
        "ai_image_prompt": "Small round peanut butter dog treat drops, scattered on white surface, some in a small ceramic bowl, natural lighting, clean product photography",
    },
    {
        "sku": "FF-007", "name": "Mixed Veggie Chews",
        "subtitle": "Carrot, sweet potato, beetroot — naturally colourful",
        "description": "Dehydrated carrot, sweet potato and beetroot chews. Allergy-safe, grain-free. Rich in antioxidants.",
        "price": 299, "category": "treats", "tab": "Everyday Treats",
        "mira_tag": "Healthy & colourful", "pillar": "food",
        "tags": ["veggie", "chews", "celebrate", "grain-free", "natural"],
        "shopify_tags": "celebrate,celebrate-food,everyday-treats,veggie,grain-free",
        "ai_image_prompt": "Colorful dehydrated vegetable dog treats - carrot, sweet potato and beetroot slices arranged on a white ceramic plate, fresh vegetables in background, clean food photography",
    },
    {
        "sku": "FF-014", "name": "Salmon Biscuit Baking Kit",
        "subtitle": "Bake birthday treats at home with Mojo",
        "description": "DIY salmon biscuit kit: pre-measured dry mix, silicone paw print mould, recipe card. Bake 24 treats in 30 minutes.",
        "price": 399, "category": "treats", "tab": "Everyday Treats",
        "mira_tag": "Make it together", "pillar": "food",
        "tags": ["baking-kit", "diy", "salmon", "celebrate", "activity"],
        "shopify_tags": "celebrate,celebrate-food,everyday-treats,diy,baking-kit",
        "ai_image_prompt": "Dog treat baking kit with flour mix packet, silicone paw print mold, recipe card and fresh baked bone-shaped biscuits, styled on marble countertop, warm lifestyle photography",
    },
    {
        "sku": "FF-008", "name": "Birthday Treat Platter",
        "subtitle": "8-variety assortment for the birthday spread",
        "description": "8 different treat varieties on a birthday-themed platter: jerky, biscuits, chews, dried fruit treats. Each in individual portion. Great centrepiece.",
        "price": 649, "category": "desi-treats", "tab": "Special Occasion",
        "mira_tag": "The spread", "pillar": "food",
        "tags": ["platter", "assortment", "birthday", "celebrate", "party"],
        "shopify_tags": "celebrate,celebrate-food,special-occasion,platter,birthday",
        "ai_image_prompt": "Beautiful dog birthday treat platter with 8 different varieties of treats arranged decoratively on a slate board with birthday decorations, professional food styling",
    },
    {
        "sku": "FF-009", "name": "Gourmet Salmon Feast Bowl",
        "subtitle": "Fresh-cooked, single-serve birthday meal",
        "description": "A chef-prepared salmon feast bowl: poached salmon, steamed sweet potato, steamed broccoli, drizzle of salmon oil. Delivered fresh for Mojo's birthday.",
        "price": 799, "category": "desi-treats", "tab": "Special Occasion",
        "mira_tag": "Fresh birthday meal", "pillar": "food",
        "tags": ["fresh-food", "salmon-bowl", "celebrate", "gourmet", "birthday"],
        "shopify_tags": "celebrate,celebrate-food,special-occasion,fresh-food,salmon,gourmet",
        "ai_image_prompt": "Gourmet dog meal bowl with poached salmon, steamed sweet potato and broccoli, drizzle of salmon oil, served in a ceramic bowl on wooden table, restaurant-style food photography",
    },
    {
        "sku": "FF-010", "name": "Allergy-Safe Treat Variety Pack",
        "subtitle": "Chicken-free, soy-free, wheat-free",
        "description": "12-variety treat pack, all certified chicken-free, soy-free, wheat-free. Ideal for dogs with multiple allergies or on treatment.",
        "price": 499, "category": "nut-butters", "tab": "Allergy-Safe Products",
        "mira_tag": "Safe for Mojo", "pillar": "food",
        "tags": ["allergy-safe", "variety-pack", "celebrate", "chicken-free", "soy-free"],
        "shopify_tags": "celebrate,celebrate-food,allergy-safe,chicken-free,soy-free,wheat-free",
        "ai_image_prompt": "Dog treat variety pack with 12 different allergy-safe treats in compartmented box, labeled 'Allergy Safe', clean white background, informational product photography",
    },
    {
        "sku": "FF-011", "name": "Salmon-Only Biscuits",
        "subtitle": "One ingredient: salmon. Nothing else.",
        "description": "100% salmon biscuits — single-ingredient, pure salmon. No additives, no allergens. For the most sensitive dogs.",
        "price": 379, "category": "nut-butters", "tab": "Allergy-Safe Products",
        "mira_tag": "Purest treat", "pillar": "food",
        "tags": ["salmon", "single-ingredient", "celebrate", "allergy-safe"],
        "shopify_tags": "celebrate,celebrate-food,allergy-safe,salmon,single-ingredient",
        "ai_image_prompt": "Pure salmon dog biscuits, single-ingredient, golden brown, arranged on a white ceramic plate with fresh salmon piece beside it, minimal clean product photography",
    },
    {
        "sku": "FF-012", "name": "Lamb Jerky Strips",
        "subtitle": "Protein-rich, slow-dried, chicken-free",
        "description": "Slow-dried lamb jerky strips. High protein, no chicken, no soy. Excellent for dogs avoiding chicken.",
        "price": 399, "category": "nut-butters", "tab": "Allergy-Safe Products",
        "mira_tag": "Protein boost", "pillar": "food",
        "tags": ["lamb", "jerky", "celebrate", "allergy-safe", "chicken-free"],
        "shopify_tags": "celebrate,celebrate-food,allergy-safe,lamb,jerky,chicken-free",
        "ai_image_prompt": "Natural lamb jerky strips for dogs, slow-dried, arranged on brown craft paper with dried rosemary garnish, rustic natural product photography",
    },
    {
        "sku": "FF-013", "name": "Recovery Celebration Treats",
        "subtitle": "Treatment-safe, vet-reviewed ingredients",
        "description": "Birthday treats formulated for dogs on cancer treatment or recovery. Vet-reviewed, anti-inflammatory ingredients. Still delicious.",
        "price": 549, "category": "nut-butters", "tab": "Allergy-Safe Products",
        "mira_tag": "Safe for treatment", "pillar": "food",
        "tags": ["treatment-safe", "recovery", "celebrate", "vet-approved", "anti-inflammatory"],
        "shopify_tags": "celebrate,celebrate-food,allergy-safe,treatment-safe,recovery",
        "ai_image_prompt": "Premium dog treats for recovery, gentle natural ingredients, arranged in a clean white package with vet-approved seal, soft medical-wellness aesthetic photography",
    },

    # ═══════════════════════════════════════════════════════
    # PLAY & JOY (PJ)
    # ═══════════════════════════════════════════════════════
    {
        "sku": "PJ-001", "name": "Tennis Ball Birthday Set",
        "subtitle": "3 premium tennis balls, birthday-wrapped",
        "description": "3 high-bounce tennis balls in birthday gift wrap. Mojo's absolute favourite. Comes with personalised 'Happy Birthday' tag.",
        "price": 549, "category": "toys", "tab": "Favourite Toys",
        "mira_tag": "Mojo's number one", "pillar": "play",
        "tags": ["tennis-ball", "birthday", "celebrate", "fetch", "favourite"],
        "shopify_tags": "celebrate,celebrate-play,favourite-toys,tennis-ball,birthday",
        "ai_image_prompt": "3 premium tennis balls in birthday gift presentation, wrapped with colorful ribbon and Happy Birthday tag, white background, product photography",
    },
    {
        "sku": "PJ-002", "name": "Premium Rope Toy Set",
        "subtitle": "3-piece braided cotton rope set",
        "description": "3 cotton rope toys of varying sizes. Hand-braided, durable, great for tug-of-war. Birthday gift wrapped.",
        "price": 449, "category": "toys", "tab": "Favourite Toys",
        "mira_tag": "Tug champion", "pillar": "play",
        "tags": ["rope-toy", "tug", "celebrate", "cotton", "durable"],
        "shopify_tags": "celebrate,celebrate-play,favourite-toys,rope-toy,tug",
        "ai_image_prompt": "Set of 3 colorful braided cotton rope dog toys, arranged festively with birthday ribbon, white background, clean product photography",
    },
    {
        "sku": "PJ-003", "name": "Squeaky Plush Birthday Collection",
        "subtitle": "3 birthday-themed squeaky plushies",
        "description": "3 birthday-themed squeaky plushies: birthday cake, candle, and a wrapped present. All non-toxic, machine-washable.",
        "price": 699, "category": "toys", "tab": "Favourite Toys",
        "mira_tag": "Birthday squeaky", "pillar": "play",
        "tags": ["squeaky-plush", "birthday-themed", "celebrate", "non-toxic"],
        "shopify_tags": "celebrate,celebrate-play,favourite-toys,squeaky,plush,birthday",
        "ai_image_prompt": "3 birthday-themed squeaky plush dog toys: birthday cake, candle and wrapped present shapes, colorful and cute, white background, product photography",
    },
    {
        "sku": "PJ-013", "name": "Interactive Fetch Machine",
        "subtitle": "Automatic ball launcher — 3 distance settings",
        "description": "Automatic ball launcher for solo play. 3 distance settings (5m, 10m, 15m). Compatible with standard tennis balls. Works indoors and outdoors.",
        "price": 2999, "category": "toys", "tab": "Favourite Toys",
        "mira_tag": "Never-ending fetch", "pillar": "play",
        "tags": ["fetch-machine", "automatic", "celebrate", "tennis-ball", "interactive"],
        "shopify_tags": "celebrate,celebrate-play,favourite-toys,fetch-machine,automatic",
        "ai_image_prompt": "Automatic dog ball launcher machine with orange tennis ball loaded, placed on grass, modern product design, clean lifestyle photography",
    },
    {
        "sku": "PJ-004", "name": "Level 3 Puzzle Feeder",
        "subtitle": "Mojo-matched challenge level",
        "description": "Advanced food puzzle feeder. Level 3 difficulty. Multiple compartments, sliding tiles, rotating discs. For high-intelligence dogs.",
        "price": 699, "category": "puzzle_toys", "tab": "Enrichment Kits",
        "mira_tag": "Brain workout", "pillar": "play",
        "tags": ["puzzle-feeder", "level-3", "celebrate", "enrichment", "intelligence"],
        "shopify_tags": "celebrate,celebrate-play,enrichment-kits,puzzle-feeder,level-3",
        "ai_image_prompt": "Advanced dog puzzle feeder level 3, multiple sliding compartments with treats visible, plastic primary colors, white background, product photography",
    },
    {
        "sku": "PJ-005", "name": "Sniff & Seek Enrichment Kit",
        "subtitle": "Scent work intro kit — 5 activities",
        "description": "Scent enrichment kit: 5 sniff-work activities including scent tubes, treat puzzles, hide-and-seek mats. Great for mental stimulation.",
        "price": 849, "category": "puzzle_toys", "tab": "Enrichment Kits",
        "mira_tag": "Nose to the ground", "pillar": "play",
        "tags": ["sniff-work", "scent", "celebrate", "enrichment", "mental-stimulation"],
        "shopify_tags": "celebrate,celebrate-play,enrichment-kits,sniff-work,mental-stimulation",
        "ai_image_prompt": "Dog scent enrichment kit with sniff mat, scent tubes and treat puzzle, arranged on light background, lifestyle photography showing engaged nose work",
    },
    {
        "sku": "PJ-006", "name": "Birthday Activity Kit",
        "subtitle": "Full day of birthday enrichment activities",
        "description": "Birthday-themed enrichment kit: lick mat, sniff mat, treat ball, and activity cards with 5 birthday enrichment games.",
        "price": 899, "category": "puzzle_toys", "tab": "Enrichment Kits",
        "mira_tag": "Full birthday day", "pillar": "play",
        "tags": ["birthday-activity", "enrichment-kit", "celebrate", "lick-mat"],
        "shopify_tags": "celebrate,celebrate-play,enrichment-kits,birthday-activity,full-day",
        "ai_image_prompt": "Birthday dog activity kit with lick mat, sniff mat, treat ball and activity cards with birthday decorations, flat lay product photography",
    },
    {
        "sku": "PJ-012", "name": "Birthday Lick Mat Set",
        "subtitle": "3-mat set with birthday spreads recipe card",
        "description": "3 lick mats of varying textures with a birthday spreads recipe card. Includes peanut butter, pumpkin, and yogurt spread ideas.",
        "price": 599, "category": "puzzle_toys", "tab": "Enrichment Kits",
        "mira_tag": "Lick hour", "pillar": "play",
        "tags": ["lick-mat", "birthday", "celebrate", "recipe-card", "enrichment"],
        "shopify_tags": "celebrate,celebrate-play,enrichment-kits,lick-mat,birthday",
        "ai_image_prompt": "Set of 3 textured dog lick mats in pastel colors with peanut butter spread, recipe card beside them, clean white background, top-down product photography",
    },
    {
        "sku": "PJ-007", "name": "Birthday Games Bundle",
        "subtitle": "4 birthday party games for dogs",
        "description": "4 birthday party games: treat treasure hunt, obstacle course guide, party tricks flash cards, sniff-and-find birthday muffin tin game.",
        "price": 1199, "category": "enrichment", "tab": "Activity Bundles",
        "mira_tag": "The party games", "pillar": "play",
        "tags": ["party-games", "birthday", "celebrate", "activity-bundle", "group"],
        "shopify_tags": "celebrate,celebrate-play,activity-bundles,party-games,birthday",
        "ai_image_prompt": "Dog birthday party games bundle - treat treasure hunt map, obstacle course cards, trick flash cards arranged on colorful background, festive lifestyle photography",
    },
    {
        "sku": "PJ-008", "name": "Outdoor Adventure Play Pack",
        "subtitle": "For the birthday morning walk",
        "description": "Birthday morning adventure kit: 2 tennis balls, treat pouch, paw wipes, portable water bowl, birthday bandana.",
        "price": 999, "category": "enrichment", "tab": "Activity Bundles",
        "mira_tag": "Birthday morning kit", "pillar": "play",
        "tags": ["outdoor-play", "adventure", "celebrate", "birthday-walk", "activity"],
        "shopify_tags": "celebrate,celebrate-play,activity-bundles,outdoor-adventure,birthday",
        "ai_image_prompt": "Dog outdoor adventure birthday kit with tennis balls, treat pouch, water bowl and birthday bandana arranged on grass, lifestyle adventure photography",
    },
    {
        "sku": "PJ-009", "name": "Senior Gentle Play Kit",
        "subtitle": "Age-appropriate birthday toys for senior dogs",
        "description": "Birthday toy set designed for senior dogs (7+ years): soft plush, gentle tug, slow feeder, and joint-friendly treat toy.",
        "price": 749, "category": "enrichment", "tab": "Activity Bundles",
        "mira_tag": "Gentle birthday play", "pillar": "play",
        "tags": ["senior-dog", "gentle-play", "celebrate", "birthday", "age-appropriate"],
        "shopify_tags": "celebrate,celebrate-play,activity-bundles,senior-dog,gentle-play",
        "ai_image_prompt": "Gentle birthday toy set for senior dogs: soft plush toy, gentle rope, slow feeder with treats, arranged softly on light blue background, product photography",
    },
    {
        "sku": "PJ-014", "name": "Birthday Toy Mystery Box",
        "subtitle": "Mira-curated surprise — 5 toys, 2 treats",
        "description": "Surprise birthday toy box curated by Mira: 5 toys matched to your dog's play style + 2 treat samples. Sealed until it arrives.",
        "price": 1499, "category": "enrichment", "tab": "Activity Bundles",
        "mira_tag": "Mira's mystery box", "pillar": "play",
        "tags": ["mystery-box", "surprise", "celebrate", "curated", "birthday"],
        "shopify_tags": "celebrate,celebrate-play,activity-bundles,mystery-box,surprise",
        "ai_image_prompt": "Sealed mystery birthday gift box for dogs with ribbon, peek preview of colorful toys inside, celebratory packaging, white background product photography",
    },
    {
        "sku": "PJ-010", "name": "Pawty Game Set",
        "subtitle": "Group party games for 4–8 dogs",
        "description": "Pawty game set for birthday parties: musical chairs guide, treat toss game, birthday treasure hunt, group sniff game. For 4-8 dogs.",
        "price": 1299, "category": "party_accessories", "tab": "Party Games",
        "mira_tag": "The group game", "pillar": "play",
        "tags": ["pawty-games", "group", "celebrate", "party", "birthday"],
        "shopify_tags": "celebrate,celebrate-play,party-games,group-games,birthday",
        "ai_image_prompt": "Dog birthday party game set with cards, game board and colorful party accessories, multiple dogs playing together lifestyle photography, festive atmosphere",
    },
    {
        "sku": "PJ-011", "name": "Musical Chairs for Dogs",
        "subtitle": "The ultimate pawty game",
        "description": "Musical chairs adapt for dogs: cushion stations, treat rewards, participation bandanas. Instructions included. Works for groups of 4+.",
        "price": 899, "category": "party_accessories", "tab": "Party Games",
        "mira_tag": "Pawty showstopper", "pillar": "play",
        "tags": ["musical-chairs", "pawty", "celebrate", "group-game", "birthday"],
        "shopify_tags": "celebrate,celebrate-play,party-games,musical-chairs,pawty",
        "ai_image_prompt": "Dog birthday party game setup with colorful cushion stations, participation bandanas and treat rewards displayed, festive party lifestyle photography",
    },

    # ═══════════════════════════════════════════════════════
    # SOCIAL & FRIENDS (SF)
    # ═══════════════════════════════════════════════════════
    {
        "sku": "SF-001", "name": "Pawty Starter Kit",
        "subtitle": "Everything to host your first pawty",
        "description": "Birthday pawty starter kit: birthday banner, 6 paw-print plates, napkins, balloons (dog-safe), party favours for 4 guests.",
        "price": 799, "category": "party_kits", "tab": "Pawty Planning",
        "mira_tag": "First pawty", "pillar": "social",
        "tags": ["pawty-kit", "starter", "celebrate", "party-supplies", "birthday"],
        "shopify_tags": "celebrate,celebrate-social,pawty-planning,starter-kit,birthday",
        "ai_image_prompt": "Dog birthday party starter kit with birthday banner, paw-print plates, balloons and party decorations, festive flat lay photography on white background",
    },
    {
        "sku": "SF-002", "name": "Premium Pawty Decoration Pack",
        "subtitle": "Full birthday decoration set — high quality",
        "description": "Premium decoration pack: metallic birthday banner, 10 balloons, paw-print tablecloth, centrepiece display, photo backdrop panel.",
        "price": 999, "category": "party_kits", "tab": "Pawty Planning",
        "mira_tag": "Premium setup", "pillar": "social",
        "tags": ["pawty-decorations", "premium", "celebrate", "birthday", "backdrop"],
        "shopify_tags": "celebrate,celebrate-social,pawty-planning,premium-decorations,birthday",
        "ai_image_prompt": "Premium dog birthday party decoration pack with metallic banner, balloons, paw-print tablecloth and photo backdrop, luxury presentation photography",
    },
    {
        "sku": "SF-003", "name": "Treat Bag Party Favours",
        "subtitle": "8 guest bags, pre-filled with treats",
        "description": "8 pre-filled birthday party favour bags for guest dogs: 3 treats each, paw-print ribbon. Ready to hand out at the pawty.",
        "price": 599, "category": "party_kits", "tab": "Pawty Planning",
        "mira_tag": "Guest bags ready", "pillar": "social",
        "tags": ["party-favours", "treat-bags", "celebrate", "guests", "birthday"],
        "shopify_tags": "celebrate,celebrate-social,pawty-planning,party-favours,guest-bags",
        "ai_image_prompt": "8 cute dog treat party favour bags with paw-print ribbon, filled with treats, arranged in a row, white background, product photography",
    },
    {
        "sku": "SF-012", "name": "Pawty Photo Booth Kit",
        "subtitle": "Props + backdrop for the perfect birthday photos",
        "description": "Photo booth kit: birthday-themed backdrop, 12 prop signs (bone, paw, hearts, Happy Birthday), instruction guide. Set up in 5 minutes.",
        "price": 799, "category": "party_kits", "tab": "Pawty Planning",
        "mira_tag": "Picture time", "pillar": "social",
        "tags": ["photo-booth", "pawty", "celebrate", "props", "backdrop"],
        "shopify_tags": "celebrate,celebrate-social,pawty-planning,photo-booth,props",
        "ai_image_prompt": "Dog birthday photo booth kit with colorful backdrop, prop signs like bone, paw and hearts, fun birthday atmosphere, lifestyle product photography",
    },
    {
        "sku": "SF-004", "name": "Friend Gift Box — Bruno",
        "subtitle": "A birthday gift from Mojo to his best friend",
        "description": "Birthday gift box for a dog friend. Includes treat mix, bandana, and birthday card from your dog. Customise with friend's name.",
        "price": 499, "category": "hampers", "tab": "Friend Gifts",
        "mira_tag": "For Bruno", "pillar": "social",
        "tags": ["friend-gift", "hamper", "celebrate", "birthday", "personalised"],
        "shopify_tags": "celebrate,celebrate-social,friend-gifts,friend-gift-box,personalised",
        "ai_image_prompt": "Dog friendship birthday gift box with treats, bandana and birthday card from one dog to another, warm kraft packaging with ribbon, product photography",
    },
    {
        "sku": "SF-005", "name": "Friend Bandana Set",
        "subtitle": "Matching birthday bandanas for 2 dogs",
        "description": "Matching birthday bandana set for two dog friends. Both say 'Birthday Squad'. Comes in 3 sizes.",
        "price": 699, "category": "hampers", "tab": "Friend Gifts",
        "mira_tag": "Birthday squad", "pillar": "social",
        "tags": ["matching-bandanas", "friend", "celebrate", "birthday-squad"],
        "shopify_tags": "celebrate,celebrate-social,friend-gifts,matching-bandanas,birthday-squad",
        "ai_image_prompt": "Matching dog birthday bandanas for two dogs, both saying Birthday Squad, displayed together on white surface, clean product photography",
    },
    {
        "sku": "SF-006", "name": "Group Treat Box",
        "subtitle": "Treats for the whole birthday crew",
        "description": "Large treat box for birthday parties: 30 mixed treats suitable for most dogs. Great for parties of 6-10 dogs.",
        "price": 899, "category": "hampers", "tab": "Friend Gifts",
        "mira_tag": "For the whole crew", "pillar": "social",
        "tags": ["group-treats", "party", "celebrate", "birthday-crew", "mixed"],
        "shopify_tags": "celebrate,celebrate-social,friend-gifts,group-treats,party",
        "ai_image_prompt": "Large dog birthday treat gift box with 30 mixed treats displayed inside, festive presentation for a party group, product photography",
    },
    {
        "sku": "SF-008", "name": "Home Pawty Setup Service",
        "subtitle": "We set up the pawty at your home",
        "description": "Professional pawty setup service at your home. Includes decoration, table setup, activity stations. 2-hour setup window.",
        "price": 0, "category": "venue", "tab": "Venue Finder",
        "mira_tag": "We handle it all", "pillar": "social",
        "is_concierge": True,
        "tags": ["home-setup", "service", "celebrate", "concierge", "birthday-party"],
        "shopify_tags": "celebrate,celebrate-social,venue-finder,home-setup,concierge",
        "ai_image_prompt": "Beautifully decorated dog birthday party setup at home, with birthday banner, treats table and photo corner, professional event photography",
    },
    {
        "sku": "SF-009", "name": "Paw Print Invitations",
        "subtitle": "10 printed invitations with paw print design",
        "description": "10 printed birthday invitations with paw print design. Personalised with your dog's name and party details. Comes with envelopes.",
        "price": 299, "category": "party_accessories", "tab": "Invitations",
        "mira_tag": "Set the mood", "pillar": "social",
        "tags": ["invitations", "paw-print", "celebrate", "birthday", "personalised"],
        "shopify_tags": "celebrate,celebrate-social,invitations,paw-print,printed",
        "ai_image_prompt": "Dog birthday party invitations with adorable paw print design, personalised with pet name, cream paper with gold accents, product photography flat lay",
    },
    {
        "sku": "SF-010", "name": "Digital Pawty Invitation Set",
        "subtitle": "3 digital invite templates — send instantly",
        "description": "3 animated digital invitation templates for WhatsApp. Personalise with your dog's name and photo. Download and share immediately.",
        "price": 199, "category": "party_accessories", "tab": "Invitations",
        "mira_tag": "Send today", "pillar": "social",
        "tags": ["digital-invite", "whatsapp", "celebrate", "birthday", "instant"],
        "shopify_tags": "celebrate,celebrate-social,invitations,digital,whatsapp",
        "ai_image_prompt": "Digital dog birthday party invitation displayed on smartphone screen, animated paw print design with confetti, lifestyle tech photography",
    },
    {
        "sku": "SF-011", "name": "Mojo's Guest List Card",
        "subtitle": "Personalised birthday guest list keepsake",
        "description": "A beautiful printed guest list card personalised with your dog's name. Each guest signs their name and their dog's name. Becomes a birthday keepsake.",
        "price": 249, "category": "party_accessories", "tab": "Invitations",
        "mira_tag": "A memory to keep", "pillar": "social",
        "tags": ["guest-list", "keepsake", "celebrate", "personalised", "birthday-memory"],
        "shopify_tags": "celebrate,celebrate-social,invitations,guest-list,keepsake",
        "ai_image_prompt": "Elegant personalised dog birthday guest list card with paw print borders and space for guests to sign, kraft paper with gold foil accents, flat lay photography",
    },

    # ═══════════════════════════════════════════════════════
    # ADVENTURE & MOVE (AM)
    # ═══════════════════════════════════════════════════════
    {
        "sku": "AM-001", "name": "Sunrise Walk Birthday Experience",
        "subtitle": "A guided birthday sunrise walk",
        "description": "Guided sunrise birthday walk experience. Professional guide, trail snacks for the dog, paw wipes, birthday photo at sunrise. Bengaluru locations.",
        "price": 1299, "category": "walking", "tab": "Birthday Walk",
        "mira_tag": "The perfect birthday morning", "pillar": "adventure",
        "tags": ["birthday-walk", "experience", "celebrate", "sunrise", "guided"],
        "shopify_tags": "celebrate,celebrate-adventure,birthday-walk,sunrise,guided-experience",
        "ai_image_prompt": "Dog and owner walking at sunrise on scenic trail, golden hour photography, happy dog wearing birthday bandana, lifestyle adventure photography",
    },
    {
        "sku": "AM-002", "name": "Birthday Trail Pack",
        "subtitle": "Everything for the birthday morning walk",
        "description": "Birthday trail pack: trail treats, collapsible water bowl, paw balm, whistle, birthday bandana, memory photo card. Built for a birthday walk.",
        "price": 699, "category": "walking", "tab": "Birthday Walk",
        "mira_tag": "Walk ready", "pillar": "adventure",
        "tags": ["trail-pack", "birthday", "celebrate", "walk", "outdoor"],
        "shopify_tags": "celebrate,celebrate-adventure,birthday-walk,trail-pack,outdoor",
        "ai_image_prompt": "Dog birthday trail pack with treats, collapsible water bowl, paw balm and birthday bandana arranged on outdoor surface, adventure lifestyle flat lay",
    },
    {
        "sku": "AM-003", "name": "Outdoor Photoshoot Add-on",
        "subtitle": "Add a photographer to your birthday walk",
        "description": "Professional photographer for your dog's birthday outdoor shoot. 30-minute session, 10 edited photos delivered digitally.",
        "price": 0, "category": "walking", "tab": "Birthday Walk",
        "mira_tag": "Capture the moment", "pillar": "adventure",
        "is_concierge": True,
        "tags": ["photoshoot", "outdoor", "celebrate", "concierge", "birthday"],
        "shopify_tags": "celebrate,celebrate-adventure,birthday-walk,photoshoot,concierge",
        "ai_image_prompt": "Professional dog outdoor birthday photoshoot on scenic trail, photographer with dog and owner, golden hour light, lifestyle photography",
    },
    {
        "sku": "AM-004", "name": "Pet-Friendly Trail Map — Bengaluru",
        "subtitle": "5 dog-friendly birthday walk routes",
        "description": "Printed and digital map of 5 best dog-friendly walking trails in Bengaluru. Rated by difficulty, distance, and dog friendliness.",
        "price": 199, "category": "adventure", "tab": "Outdoor Spots",
        "mira_tag": "Know where to go", "pillar": "adventure",
        "tags": ["trail-map", "bengaluru", "celebrate", "dog-friendly", "walking"],
        "shopify_tags": "celebrate,celebrate-adventure,outdoor-spots,trail-map,bengaluru",
        "ai_image_prompt": "Beautiful illustrated pet-friendly trail map of Bengaluru parks with dog-friendly icons, folded map on green grass background, travel photography",
    },
    {
        "sku": "AM-005", "name": "Park Birthday Booking",
        "subtitle": "Reserve a private park slot for the birthday",
        "description": "Reserve a private garden or park space for 2 hours for your dog's birthday. Concierge handles booking and logistics.",
        "price": 0, "category": "adventure", "tab": "Outdoor Spots",
        "mira_tag": "A space just for them", "pillar": "adventure",
        "is_concierge": True,
        "tags": ["park-booking", "private", "celebrate", "concierge", "birthday"],
        "shopify_tags": "celebrate,celebrate-adventure,outdoor-spots,park-booking,concierge",
        "ai_image_prompt": "Private garden party setup for dog birthday with banner, treats table and open green space, lifestyle event photography",
    },
    {
        "sku": "AM-006", "name": "Adventure Dog Harness",
        "subtitle": "Premium Y-harness, padded — birthday gift",
        "description": "Premium padded Y-harness for adventure dogs. No-pull design, reflective strips, quick-release buckle. Birthday gift wrapping included.",
        "price": 1499, "category": "travel", "tab": "Adventure Gear",
        "mira_tag": "Ready for anything", "pillar": "adventure",
        "tags": ["harness", "adventure", "celebrate", "premium", "no-pull"],
        "shopify_tags": "celebrate,celebrate-adventure,adventure-gear,harness,premium",
        "ai_image_prompt": "Premium dog adventure Y-harness in earthy tones, padded, with reflective strips, displayed on a white background, professional product photography",
    },
    {
        "sku": "AM-007", "name": "Collapsible Adventure Kit",
        "subtitle": "4-piece outdoor kit for active dogs",
        "description": "4-piece collapsible outdoor kit: water bottle, food bowl, treat pouch, poop bag holder. All clip onto a belt or backpack.",
        "price": 899, "category": "travel", "tab": "Adventure Gear",
        "mira_tag": "The outdoor essentials", "pillar": "adventure",
        "tags": ["adventure-kit", "collapsible", "celebrate", "outdoor", "travel"],
        "shopify_tags": "celebrate,celebrate-adventure,adventure-gear,collapsible-kit,outdoor",
        "ai_image_prompt": "4-piece collapsible dog outdoor kit - water bottle, food bowl, treat pouch and bag holder, arranged on hiking background, product photography",
    },
    {
        "sku": "AM-010", "name": "Paw Balm Recovery Kit",
        "subtitle": "Post-walk paw care for birthday adventures",
        "description": "Post-walk paw recovery kit: paw balm, soothing wipes, protective socks. For dogs with sensitive paws or after long birthday walks.",
        "price": 449, "category": "travel", "tab": "Adventure Gear",
        "mira_tag": "After the walk", "pillar": "adventure",
        "tags": ["paw-balm", "recovery", "celebrate", "paw-care", "post-walk"],
        "shopify_tags": "celebrate,celebrate-adventure,adventure-gear,paw-balm,recovery",
        "ai_image_prompt": "Dog paw balm recovery kit with natural balm tin, soothing wipes and protective socks, arranged on natural wood surface, wellness product photography",
    },
    {
        "sku": "AM-008", "name": "Energy Trail Treat Pouch",
        "subtitle": "Trail treats for active dogs",
        "description": "High-energy trail treats for active dogs: chicken jerky, dried apple, peanut butter drops. Designed for walks of 5km+.",
        "price": 349, "category": "treats", "tab": "Trail Treats",
        "mira_tag": "Fuel for the trail", "pillar": "adventure",
        "tags": ["trail-treats", "energy", "celebrate", "active", "outdoor"],
        "shopify_tags": "celebrate,celebrate-adventure,trail-treats,energy,outdoor",
        "ai_image_prompt": "Dog trail treat pouch with high-energy treats - jerky strips and dried fruit visible, outdoor adventure styling, natural light photography",
    },
    {
        "sku": "AM-009", "name": "Natural Energy Balls",
        "subtitle": "Homemade-style energy balls for active dogs",
        "description": "Handmade energy balls: oat, peanut butter, banana, honey. 10-pack. Natural, high-energy. Perfect for trail snacking.",
        "price": 299, "category": "treats", "tab": "Trail Treats",
        "mira_tag": "Natural fuel", "pillar": "adventure",
        "tags": ["energy-balls", "natural", "celebrate", "oat", "trail-snack"],
        "shopify_tags": "celebrate,celebrate-adventure,trail-treats,energy-balls,natural",
        "ai_image_prompt": "Homemade dog energy balls with oats, peanut butter and banana, 10 pieces arranged on baking paper, rustic kitchen photography",
    },

    # ═══════════════════════════════════════════════════════
    # GROOMING & BEAUTY (GB)
    # ═══════════════════════════════════════════════════════
    {
        "sku": "GB-001", "name": "Birthday Groom Session",
        "subtitle": "Full birthday grooming + birthday bandana",
        "description": "Full birthday grooming session at a partner salon: bath, blow dry, nail trim, ear clean, birthday bandana tied on departure. Book via Concierge.",
        "price": 0, "category": "grooming", "tab": "Grooming Booking",
        "mira_tag": "Looking their best", "pillar": "grooming",
        "is_concierge": True,
        "tags": ["grooming-session", "birthday", "celebrate", "concierge", "full-groom"],
        "shopify_tags": "celebrate,celebrate-grooming,grooming-booking,birthday-groom,concierge",
        "ai_image_prompt": "Happy dog after birthday grooming session wearing a colorful birthday bandana, clean and fluffy, professional grooming salon setting",
    },
    {
        "sku": "GB-002", "name": "Birthday Pamper Package",
        "subtitle": "Groom + photo + birthday treat — the full day",
        "description": "Full birthday pamper day: grooming + mini photoshoot + birthday cake. A complete birthday treat for the dog.",
        "price": 0, "category": "grooming", "tab": "Grooming Booking",
        "mira_tag": "The full birthday", "pillar": "grooming",
        "is_concierge": True,
        "tags": ["pamper-package", "birthday", "celebrate", "concierge", "full-day"],
        "shopify_tags": "celebrate,celebrate-grooming,grooming-booking,pamper-package,concierge",
        "ai_image_prompt": "Dog birthday pamper day - groomed dog with birthday bandana and small birthday cake, luxury treatment setting, warm professional photography",
    },
    {
        "sku": "GB-003", "name": "Birthday Bandana Set",
        "subtitle": "3 birthday bandanas — different styles",
        "description": "3 birthday bandanas: Happy Birthday (gold), Birthday Boy/Girl (pink/blue), Birthday Squad (purple). All cotton, machine washable.",
        "price": 299, "category": "party_accessories", "tab": "Birthday Accessories",
        "mira_tag": "Dressed for the day", "pillar": "grooming",
        "tags": ["birthday-bandana", "set", "celebrate", "cotton", "washable"],
        "shopify_tags": "celebrate,celebrate-grooming,birthday-accessories,bandana-set,birthday",
        "ai_image_prompt": "3 colorful dog birthday bandanas - Happy Birthday gold, Birthday Boy blue and Birthday Squad purple, displayed flat on white surface, product photography",
    },
    {
        "sku": "GB-004", "name": "Personalised Name Bandana",
        "subtitle": "Your dog's name embroidered in gold",
        "description": "Cotton birthday bandana with your dog's name embroidered in gold thread. Choose from 5 birthday designs.",
        "price": 449, "category": "party_accessories", "tab": "Birthday Accessories",
        "mira_tag": "Made for them", "pillar": "grooming",
        "tags": ["personalised-bandana", "embroidered", "celebrate", "name", "gold"],
        "shopify_tags": "celebrate,celebrate-grooming,birthday-accessories,personalised,embroidered",
        "ai_image_prompt": "Personalised dog bandana with name embroidered in gold thread, Happy Birthday design, displayed on white background, premium product photography",
    },
    {
        "sku": "GB-005", "name": "Birthday Bow Set",
        "subtitle": "5 birthday bows for small dogs",
        "description": "5 birthday bows in different styles for small and toy breeds. No-slip clip, comfortable for all-day wear.",
        "price": 249, "category": "party_accessories", "tab": "Birthday Accessories",
        "mira_tag": "For the tiny ones", "pillar": "grooming",
        "tags": ["birthday-bow", "small-dog", "celebrate", "hair-bow", "accessory"],
        "shopify_tags": "celebrate,celebrate-grooming,birthday-accessories,birthday-bow,small-dog",
        "ai_image_prompt": "5 cute dog birthday hair bows in pink, gold and pastel colors, displayed on white surface with small dog accessory styling photography",
    },
    {
        "sku": "GB-006", "name": "Birthday Outfit Set",
        "subtitle": "Bandana + bow + matching birthday collar",
        "description": "Complete birthday outfit set: bandana, bow, matching collar with birthday charm. Available in sizes XS to XL.",
        "price": 649, "category": "party_accessories", "tab": "Birthday Accessories",
        "mira_tag": "The full birthday look", "pillar": "grooming",
        "tags": ["birthday-outfit", "set", "celebrate", "bandana", "collar"],
        "shopify_tags": "celebrate,celebrate-grooming,birthday-accessories,outfit-set,full-look",
        "ai_image_prompt": "Complete dog birthday outfit set - bandana, bow and collar with birthday charm displayed together, elegant flat lay product photography",
    },
    {
        "sku": "GB-007", "name": "Spa Birthday Kit",
        "subtitle": "At-home spa day for the birthday dog",
        "description": "Complete at-home spa kit: natural shampoo, conditioner, paw soak, coat spray, ear wipes, and birthday bandana. Everything for a spa day.",
        "price": 599, "category": "grooming", "tab": "Spa at Home",
        "mira_tag": "Spa day at home", "pillar": "grooming",
        "tags": ["spa-kit", "at-home", "celebrate", "shampoo", "conditioner"],
        "shopify_tags": "celebrate,celebrate-grooming,spa-at-home,spa-kit,natural",
        "ai_image_prompt": "Dog spa birthday kit with natural shampoo bottle, conditioner, paw soak tub and birthday bandana, arranged spa-style on marble surface, product photography",
    },
    {
        "sku": "GB-008", "name": "Deep Clean Birthday Bath Kit",
        "subtitle": "Professional-grade bath at home",
        "description": "Professional-grade bath kit: clarifying shampoo, deep-clean conditioner, deshedding brush, microfibre towel, paw balm.",
        "price": 499, "category": "grooming", "tab": "Spa at Home",
        "mira_tag": "Bath day done right", "pillar": "grooming",
        "tags": ["bath-kit", "deep-clean", "celebrate", "professional-grade", "deshedding"],
        "shopify_tags": "celebrate,celebrate-grooming,spa-at-home,bath-kit,deep-clean",
        "ai_image_prompt": "Professional dog bath kit with clarifying shampoo, conditioner, deshedding brush and microfibre towel, clean bathroom product photography",
    },
    {
        "sku": "GB-011", "name": "Professional Grooming Brush Set",
        "subtitle": "4-brush professional set for all coat types",
        "description": "Professional grooming brush set: slicker brush, pin brush, deshedding comb, mat breaker. For all coat types.",
        "price": 899, "category": "grooming", "tab": "Spa at Home",
        "mira_tag": "Coat perfection", "pillar": "grooming",
        "tags": ["brush-set", "professional", "celebrate", "grooming", "coat-care"],
        "shopify_tags": "celebrate,celebrate-grooming,spa-at-home,brush-set,professional",
        "ai_image_prompt": "4-piece professional dog grooming brush set - slicker, pin brush, deshedding comb and mat breaker, professional arrangement on white background",
    },
    {
        "sku": "GB-009", "name": "Coat Shine Finishing Spray",
        "subtitle": "Photo-ready coat in 30 seconds",
        "description": "Leave-in coat finishing spray that adds shine and controls flyaways. Fragrance-free, dog-safe. Perfect before birthday photos.",
        "price": 349, "category": "party_accessories", "tab": "Photo-Ready",
        "mira_tag": "Camera ready", "pillar": "grooming",
        "tags": ["coat-spray", "shine", "celebrate", "photo-ready", "grooming"],
        "shopify_tags": "celebrate,celebrate-grooming,photo-ready,coat-spray,shine",
        "ai_image_prompt": "Dog coat shine spray bottle with glossy finish, beside a beautifully groomed dog, clean modern product photography",
    },
    {
        "sku": "GB-010", "name": "Birthday Nail Art Kit",
        "subtitle": "Safe nail polish for dogs — 5 colours",
        "description": "Dog-safe nail polish set: 5 birthday colours (pink, gold, white, red, blue). Peel-off formula, water-soluble. No chemicals.",
        "price": 299, "category": "party_accessories", "tab": "Photo-Ready",
        "mira_tag": "The finishing touch", "pillar": "grooming",
        "tags": ["nail-art", "dog-safe", "celebrate", "nail-polish", "birthday-colours"],
        "shopify_tags": "celebrate,celebrate-grooming,photo-ready,nail-art,dog-safe",
        "ai_image_prompt": "5 dog-safe nail polish bottles in pink, gold, white, red and blue colors, birthday styling, colorful product photography",
    },
    {
        "sku": "GB-012", "name": "Birthday Perfume — Dog-Safe",
        "subtitle": "A birthday scent made for dogs",
        "description": "Dog-safe birthday cologne: light floral scent, alcohol-free, lasts 4-6 hours. Safe for dogs with sensitive skin.",
        "price": 349, "category": "party_accessories", "tab": "Photo-Ready",
        "mira_tag": "Smelling special", "pillar": "grooming",
        "tags": ["perfume", "dog-safe", "celebrate", "cologne", "alcohol-free"],
        "shopify_tags": "celebrate,celebrate-grooming,photo-ready,dog-cologne,birthday",
        "ai_image_prompt": "Elegant dog birthday perfume bottle with light floral design, placed beside flowers, luxury minimal product photography",
    },

    # ═══════════════════════════════════════════════════════
    # LEARNING & MIND (LM)
    # ═══════════════════════════════════════════════════════
    {
        "sku": "LM-001", "name": "Nina Ottosson Level 3 Puzzle",
        "subtitle": "Advanced challenge for the brilliant dog",
        "description": "Nina Ottosson Dog Smart Level 3 puzzle. Multiple hiding compartments, rotating pieces, sliding blocks. For advanced dogs.",
        "price": 1299, "category": "puzzle_toys", "tab": "Puzzle Toys",
        "mira_tag": "For the genius", "pillar": "learning",
        "tags": ["nina-ottosson", "level-3", "celebrate", "puzzle", "advanced"],
        "shopify_tags": "celebrate,celebrate-learning,puzzle-toys,nina-ottosson,level-3",
        "ai_image_prompt": "Nina Ottosson level 3 dog puzzle toy with multiple sliding compartments and treats visible inside, white background, educational toy photography",
    },
    {
        "sku": "LM-002", "name": "Nina Ottosson Level 2 Puzzle",
        "subtitle": "Mid-level challenge — most popular",
        "description": "Nina Ottosson Dog Tornado Level 2. Rotating compartments with removable discs. Engages working memory and problem-solving.",
        "price": 899, "category": "puzzle_toys", "tab": "Puzzle Toys",
        "mira_tag": "Great starting point", "pillar": "learning",
        "tags": ["nina-ottosson", "level-2", "celebrate", "puzzle", "popular"],
        "shopify_tags": "celebrate,celebrate-learning,puzzle-toys,nina-ottosson,level-2",
        "ai_image_prompt": "Nina Ottosson level 2 dog tornado puzzle toy with rotating compartments, white background, clean educational product photography",
    },
    {
        "sku": "LM-003", "name": "Sniff & Seek Enrichment Set",
        "subtitle": "Nose work starter kit — 3 activities",
        "description": "Nose work enrichment set: sniff mat, scent tubes, hide-and-seek treat tin. For dogs who love to use their nose.",
        "price": 849, "category": "puzzle_toys", "tab": "Puzzle Toys",
        "mira_tag": "Follow the nose", "pillar": "learning",
        "tags": ["nose-work", "sniff-seek", "celebrate", "scent", "enrichment"],
        "shopify_tags": "celebrate,celebrate-learning,puzzle-toys,nose-work,scent",
        "ai_image_prompt": "Dog nose work enrichment kit with sniff mat, scent tubes and treat container, natural lifestyle photography showing nose work activity",
    },
    {
        "sku": "LM-004", "name": "10 New Tricks Kit",
        "subtitle": "Teach 10 new tricks in one birthday week",
        "description": "Trick training kit: 10 trick flash cards, target stick, clicker, 50g training treats. A complete birthday challenge for dogs who love to learn.",
        "price": 699, "category": "training", "tab": "Trick Kits",
        "mira_tag": "10 tricks this birthday", "pillar": "learning",
        "tags": ["trick-kit", "training", "celebrate", "clicker", "flash-cards"],
        "shopify_tags": "celebrate,celebrate-learning,trick-kits,trick-kit,training",
        "ai_image_prompt": "Dog trick training birthday kit with flash cards, target stick, clicker and treat bag, colorful educational product flat lay photography",
    },
    {
        "sku": "LM-005", "name": "Advanced Trick Master Kit",
        "subtitle": "For dogs ready for championship tricks",
        "description": "Advanced trick kit: 20 trick cards (level 3-5 difficulty), agility ring, target discs, obstacle markers. For experienced trained dogs.",
        "price": 899, "category": "training", "tab": "Trick Kits",
        "mira_tag": "Championship level", "pillar": "learning",
        "tags": ["advanced-tricks", "training", "celebrate", "agility", "championship"],
        "shopify_tags": "celebrate,celebrate-learning,trick-kits,advanced-tricks,agility",
        "ai_image_prompt": "Advanced dog trick training kit with agility equipment, obstacle markers and trick cards, action lifestyle photography",
    },
    {
        "sku": "LM-006", "name": "Birthday Trick Show Kit",
        "subtitle": "Put on a birthday show for the family",
        "description": "Birthday trick show kit: 5 showstopper trick cards, a bow-tie for the performance, mini stage mat, trick medal.",
        "price": 599, "category": "training", "tab": "Trick Kits",
        "mira_tag": "Showtime", "pillar": "learning",
        "tags": ["trick-show", "performance", "celebrate", "birthday-show", "bow-tie"],
        "shopify_tags": "celebrate,celebrate-learning,trick-kits,trick-show,performance",
        "ai_image_prompt": "Dog birthday trick show kit with bow-tie, performance mat, trick medals and show cards, festive performance photography",
    },
    {
        "sku": "LM-007", "name": "1-on-1 Training Session",
        "subtitle": "Birthday gift: one full training session",
        "description": "Gift a 60-minute 1-on-1 training session with a certified dog trainer. Covers 3-5 new commands. Concierge-booked, at your home or a training centre.",
        "price": 1499, "category": "training", "tab": "Training Sessions",
        "mira_tag": "Learn together", "pillar": "learning",
        "is_concierge": True,
        "tags": ["training-session", "1on1", "celebrate", "concierge", "certified-trainer"],
        "shopify_tags": "celebrate,celebrate-learning,training-sessions,1on1,certified-trainer",
        "ai_image_prompt": "Dog training session with certified trainer, handler and dog working together on commands, warm outdoor training environment photography",
    },
    {
        "sku": "LM-008", "name": "Group Training Class — Birthday Gift",
        "subtitle": "Join a group class as a birthday treat",
        "description": "Gift a 90-minute group training class for your dog. Socialisation + skills. Concierge books your slot.",
        "price": 799, "category": "training", "tab": "Training Sessions",
        "mira_tag": "Learn with friends", "pillar": "learning",
        "is_concierge": True,
        "tags": ["group-training", "class", "celebrate", "concierge", "socialisation"],
        "shopify_tags": "celebrate,celebrate-learning,training-sessions,group-class,socialisation",
        "ai_image_prompt": "Group dog training class with 4-5 dogs and trainers, outdoor training facility, happy socialization atmosphere, lifestyle photography",
    },
    {
        "sku": "LM-009", "name": "Hide and Seek Treat Ball",
        "subtitle": "Slow feeder + hide-and-seek in one",
        "description": "Interactive treat ball with hide-and-seek compartments. Level 2 difficulty. Works with kibble or small treats.",
        "price": 549, "category": "puzzle_toys", "tab": "Brain Games",
        "mira_tag": "Find it!", "pillar": "learning",
        "tags": ["treat-ball", "hide-seek", "celebrate", "slow-feeder", "interactive"],
        "shopify_tags": "celebrate,celebrate-learning,brain-games,treat-ball,hide-seek",
        "ai_image_prompt": "Colorful dog hide and seek treat ball with compartments, treats visible, white background, interactive toy product photography",
    },
    {
        "sku": "LM-010", "name": "Interactive Dog Puzzle Game",
        "subtitle": "Award-winning brain challenge",
        "description": "Multi-level interactive puzzle with moving pieces, levers, and compartments. Award-winning design. Great for Border Collies, Poodles, working breeds.",
        "price": 1999, "category": "puzzle_toys", "tab": "Brain Games",
        "mira_tag": "Award-winning brain game", "pillar": "learning",
        "tags": ["interactive-puzzle", "award-winning", "celebrate", "brain-game", "advanced"],
        "shopify_tags": "celebrate,celebrate-learning,brain-games,interactive-puzzle,advanced",
        "ai_image_prompt": "Award-winning dog interactive puzzle toy with moving levers and compartments, dog engaging with puzzle, lifestyle product photography",
    },
    {
        "sku": "LM-011", "name": "Enrichment Advent Calendar",
        "subtitle": "24 days of brain games and treats",
        "description": "Dog enrichment advent calendar: 24 doors with mix of treat and activity reveals. 12 treat portions + 12 mini enrichment activity cards.",
        "price": 1799, "category": "puzzle_toys", "tab": "Brain Games",
        "mira_tag": "24-day brain challenge", "pillar": "learning",
        "tags": ["advent-calendar", "enrichment", "celebrate", "24-days", "activity"],
        "shopify_tags": "celebrate,celebrate-learning,brain-games,advent-calendar,enrichment",
        "ai_image_prompt": "Dog enrichment advent calendar with 24 numbered doors, decorated festively, some doors open showing treats inside, product photography",
    },

    # ═══════════════════════════════════════════════════════
    # HEALTH & WELLNESS (HW)
    # ═══════════════════════════════════════════════════════
    {
        "sku": "HW-001", "name": "Canine Immunity Booster",
        "subtitle": "3-mushroom blend for immune support",
        "description": "3-mushroom immunity blend: reishi, turkey tail, shiitake. Powder format, add to food. 30-day supply. Supports immune function.",
        "price": 899, "category": "supplements", "tab": "Wellness Gifts",
        "mira_tag": "Strengthen from inside", "pillar": "health",
        "tags": ["immunity", "mushroom", "celebrate", "supplement", "30-day"],
        "shopify_tags": "celebrate,celebrate-health,wellness-gifts,immunity,mushroom",
        "ai_image_prompt": "Premium dog immunity supplement with reishi mushroom, elegant packaging, white marble background, luxury wellness product photography",
    },
    {
        "sku": "HW-002", "name": "Salmon Oil — Omega 3 & 6",
        "subtitle": "Norwegian wild salmon oil — 250ml",
        "description": "Norwegian wild salmon oil rich in Omega 3 & 6. 250ml pump bottle. Supports coat health, joints, brain function.",
        "price": 699, "category": "supplements", "tab": "Wellness Gifts",
        "mira_tag": "For the coat and joints", "pillar": "health",
        "tags": ["salmon-oil", "omega-3", "celebrate", "coat-health", "joints"],
        "shopify_tags": "celebrate,celebrate-health,wellness-gifts,salmon-oil,omega-3",
        "ai_image_prompt": "Premium salmon oil supplement bottle for dogs, 250ml pump, gold labeling with salmon illustration, clean white background product photography",
    },
    {
        "sku": "HW-003", "name": "Probiotic Powder",
        "subtitle": "Gut health support — 30-day supply",
        "description": "Multi-strain probiotic powder for dogs. 30-day supply. 5 billion CFU. Supports digestive health, reduces bloating.",
        "price": 549, "category": "supplements", "tab": "Wellness Gifts",
        "mira_tag": "Happy gut", "pillar": "health",
        "tags": ["probiotic", "gut-health", "celebrate", "digestive", "30-day"],
        "shopify_tags": "celebrate,celebrate-health,wellness-gifts,probiotic,gut-health",
        "ai_image_prompt": "Dog probiotic powder supplement, clean label packaging, powder scoop beside it, white background, wellness product photography",
    },
    {
        "sku": "HW-004", "name": "Wellness Birthday Bundle",
        "subtitle": "3-product wellness starter set",
        "description": "Birthday wellness bundle: Salmon Oil + Probiotic Powder + Immunity Booster. 30-day supply of all three. A complete birthday wellness gift.",
        "price": 1899, "category": "supplements", "tab": "Wellness Gifts",
        "mira_tag": "The full wellness gift", "pillar": "health",
        "tags": ["wellness-bundle", "birthday", "celebrate", "supplement-set", "30-day"],
        "shopify_tags": "celebrate,celebrate-health,wellness-gifts,wellness-bundle,birthday",
        "ai_image_prompt": "Dog wellness birthday bundle with 3 supplements - salmon oil, probiotic and immunity booster, arranged as gift set, premium product photography",
    },
    {
        "sku": "HW-005", "name": "Medicinal Mushroom Complex",
        "subtitle": "6-mushroom adaptogen blend",
        "description": "6-mushroom adaptogen complex: chaga, lion's mane, reishi, turkey tail, cordyceps, shiitake. Supports immunity, cognition, and energy.",
        "price": 1299, "category": "supplements", "tab": "Supplements",
        "mira_tag": "Advanced immunity", "pillar": "health",
        "tags": ["mushroom-complex", "adaptogen", "celebrate", "supplement", "immunity"],
        "shopify_tags": "celebrate,celebrate-health,supplements,mushroom-complex,adaptogen",
        "ai_image_prompt": "Premium 6-mushroom complex supplement for dogs, earthy elegant packaging, mushroom illustration, natural wellness photography",
    },
    {
        "sku": "HW-006", "name": "Turmeric & Black Pepper Blend",
        "subtitle": "Anti-inflammatory support",
        "description": "Organic turmeric with black pepper (piperine) for bioavailability. 90 capsules or powder. Natural anti-inflammatory.",
        "price": 549, "category": "supplements", "tab": "Supplements",
        "mira_tag": "Natural anti-inflammatory", "pillar": "health",
        "tags": ["turmeric", "anti-inflammatory", "celebrate", "organic", "supplement"],
        "shopify_tags": "celebrate,celebrate-health,supplements,turmeric,anti-inflammatory",
        "ai_image_prompt": "Turmeric and black pepper dog supplement, golden packaging with turmeric root, clean natural background, wellness product photography",
    },
    {
        "sku": "HW-007", "name": "Vitamin B Complex",
        "subtitle": "Energy and neurological support",
        "description": "Complete Vitamin B complex for dogs: B1, B2, B3, B5, B6, B7, B9, B12. Liquid format for easy dosing. Energy and nerve support.",
        "price": 649, "category": "supplements", "tab": "Supplements",
        "mira_tag": "Energy support", "pillar": "health",
        "tags": ["vitamin-b", "energy", "celebrate", "supplement", "liquid"],
        "shopify_tags": "celebrate,celebrate-health,supplements,vitamin-b,energy",
        "ai_image_prompt": "Dog Vitamin B complex liquid supplement bottle, clean label design, white background, premium supplement product photography",
    },
    {
        "sku": "HW-008", "name": "Annual Wellness Check Gift",
        "subtitle": "Gift a full health check for their birthday",
        "description": "Gift voucher for a full annual wellness check at a partner vet: bloodwork, physical exam, dental check, weight assessment.",
        "price": 0, "category": "health", "tab": "Health Check",
        "mira_tag": "The most important gift", "pillar": "health",
        "is_concierge": True,
        "tags": ["wellness-check", "vet", "celebrate", "concierge", "gift-voucher"],
        "shopify_tags": "celebrate,celebrate-health,health-check,wellness-check,gift-voucher",
        "ai_image_prompt": "Veterinary wellness check gift voucher for dogs, elegant card design with paw print, clean professional photography",
    },
    {
        "sku": "HW-009", "name": "Cancer Marker Test — Gift",
        "subtitle": "Early detection blood test — birthday gift",
        "description": "Gift a cancer marker blood test (CANS) for early detection. Concierge arranges collection at your home or vet clinic.",
        "price": 0, "category": "health", "tab": "Health Check",
        "mira_tag": "For long life", "pillar": "health",
        "is_concierge": True,
        "tags": ["cancer-marker", "blood-test", "celebrate", "concierge", "early-detection"],
        "shopify_tags": "celebrate,celebrate-health,health-check,cancer-marker,blood-test",
        "ai_image_prompt": "Cancer early detection test kit gift presentation, clean medical-meets-wellness aesthetic, caring photography",
    },
    {
        "sku": "HW-010", "name": "Longevity Supplement Plan",
        "subtitle": "3-month plan for long, healthy life",
        "description": "3-month longevity supplement plan curated for your dog's age and breed: joint support, omega oils, probiotics, immunity. Concierge-managed subscription.",
        "price": 2999, "category": "supplements", "tab": "Longevity Plan",
        "mira_tag": "3 months of health", "pillar": "health",
        "tags": ["longevity", "3-month-plan", "celebrate", "joint-support", "subscription"],
        "shopify_tags": "celebrate,celebrate-health,longevity-plan,3-month,supplement-plan",
        "ai_image_prompt": "3-month longevity dog supplement plan displayed as bundle with multiple products, elegant subscription box, premium health product photography",
    },
    {
        "sku": "HW-011", "name": "Senior Vitality Pack",
        "subtitle": "Joint, energy, and immune support for senior dogs",
        "description": "Complete senior vitality pack: joint supplement, omega oil, B complex, probiotic. For dogs 7+ years.",
        "price": 1999, "category": "supplements", "tab": "Longevity Plan",
        "mira_tag": "For the wise ones", "pillar": "health",
        "tags": ["senior", "vitality", "celebrate", "joint-support", "7-plus"],
        "shopify_tags": "celebrate,celebrate-health,longevity-plan,senior,vitality-pack",
        "ai_image_prompt": "Senior dog vitality supplement pack with joint support, omega oil and probiotic, gentle elegant packaging, wellness product photography",
    },

    # ═══════════════════════════════════════════════════════
    # LOVE & MEMORY (LM-1xx)
    # ═══════════════════════════════════════════════════════
    {
        "sku": "LM-101", "name": "Birthday Photoshoot",
        "subtitle": "Professional in-studio birthday shoot",
        "description": "Professional in-studio birthday photoshoot for your dog. 45-minute session, 15 edited photos, online gallery. Birthday props included.",
        "price": 0, "category": "portraits", "tab": "Photoshoot",
        "mira_tag": "Capture this birthday", "pillar": "memory",
        "is_concierge": True,
        "tags": ["photoshoot", "studio", "celebrate", "concierge", "birthday-photos"],
        "shopify_tags": "celebrate,celebrate-memory,photoshoot,studio-session,birthday",
        "ai_image_prompt": "Professional dog birthday photoshoot in studio, dog wearing birthday outfit with props, soft golden lighting, professional portrait photography",
    },
    {
        "sku": "LM-102", "name": "Outdoor Birthday Shoot",
        "subtitle": "Location photoshoot at sunrise or golden hour",
        "description": "Outdoor birthday photoshoot at a curated Bengaluru location. 1-hour session, sunrise or golden hour. 20 edited photos.",
        "price": 0, "category": "portraits", "tab": "Photoshoot",
        "mira_tag": "The birthday portrait", "pillar": "memory",
        "is_concierge": True,
        "tags": ["outdoor-shoot", "location", "celebrate", "concierge", "golden-hour"],
        "shopify_tags": "celebrate,celebrate-memory,photoshoot,outdoor-shoot,golden-hour",
        "ai_image_prompt": "Beautiful outdoor dog birthday photoshoot at golden hour, dog in park with birthday bandana, professional nature portrait photography",
    },
    {
        "sku": "LM-103", "name": "At-Home Photoshoot Kit",
        "subtitle": "DIY birthday photoshoot in 30 minutes",
        "description": "DIY birthday photoshoot kit: backdrop panel, 5 prop signs, balloon arch guide, lighting tip card. Take 100 birthday photos at home.",
        "price": 799, "category": "portraits", "tab": "Photoshoot",
        "mira_tag": "Birthday photos at home", "pillar": "memory",
        "tags": ["photoshoot-kit", "diy", "celebrate", "backdrop", "props"],
        "shopify_tags": "celebrate,celebrate-memory,photoshoot,diy-kit,at-home",
        "ai_image_prompt": "DIY dog birthday photoshoot kit with backdrop, prop signs and balloon arch, flat lay product photography",
    },
    {
        "sku": "LM-104", "name": "Watercolour Portrait of Mojo",
        "subtitle": "Hand-painted watercolour from your photo",
        "description": "Hand-painted watercolour portrait of your dog from your photo. A4 or A3 size, 5-7 day delivery. Delivered in a gift frame.",
        "price": 2499, "category": "portraits", "tab": "Custom Portrait",
        "mira_tag": "Art that lasts forever", "pillar": "memory",
        "tags": ["watercolour-portrait", "hand-painted", "celebrate", "art", "framed"],
        "shopify_tags": "celebrate,celebrate-memory,custom-portrait,watercolour,hand-painted",
        "ai_image_prompt": "Beautiful hand-painted watercolor portrait of a dog in an elegant frame, artist-style dog painting with soft background colors, art photography",
    },
    {
        "sku": "LM-105", "name": "Digital Illustrated Portrait",
        "subtitle": "Modern digital illustration — delivered in 48 hrs",
        "description": "Digital illustrated portrait of your dog in modern art style. Delivered as high-resolution PNG in 48 hours. Print-ready for framing.",
        "price": 999, "category": "portraits", "tab": "Custom Portrait",
        "mira_tag": "Modern art portrait", "pillar": "memory",
        "tags": ["digital-portrait", "illustrated", "celebrate", "art", "48hrs"],
        "shopify_tags": "celebrate,celebrate-memory,custom-portrait,digital-illustration,modern",
        "ai_image_prompt": "Modern digital illustration portrait of a dog, colorful artistic style, displayed on screen and printed version, digital art photography",
    },
    {
        "sku": "LM-106", "name": "Paw Print Artwork",
        "subtitle": "Your dog's actual paw print — framed",
        "description": "Actual paw print artwork kit: non-toxic paint, paper, frame included. Do-it-yourself at home and frame as birthday keepsake.",
        "price": 649, "category": "portraits", "tab": "Custom Portrait",
        "mira_tag": "Their actual paw", "pillar": "memory",
        "tags": ["paw-print", "artwork", "celebrate", "keepsake", "framed"],
        "shopify_tags": "celebrate,celebrate-memory,custom-portrait,paw-print,keepsake",
        "ai_image_prompt": "Dog paw print artwork kit with paint, paper and frame, showing completed framed paw print artwork on wall, lifestyle home photography",
    },
    {
        "sku": "LM-107", "name": "Birthday Memory Book",
        "subtitle": "Document this birthday forever",
        "description": "Beautiful birthday memory book: 40 pages for photos, stories, paw prints, and milestones. Hardcover, personalised cover with dog's name and birth year.",
        "price": 1299, "category": "memory_books", "tab": "Memory Book",
        "mira_tag": "This birthday, forever", "pillar": "memory",
        "tags": ["memory-book", "birthday", "celebrate", "hardcover", "personalised"],
        "shopify_tags": "celebrate,celebrate-memory,memory-book,birthday-book,personalised",
        "ai_image_prompt": "Beautiful hardcover dog birthday memory book open showing photo pages, personalised with dog name on cover, elegant lifestyle photography",
    },
    {
        "sku": "LM-108", "name": "Annual Photo Book",
        "subtitle": "A year of memories in print",
        "description": "Annual photo book for your dog: 50 pages, premium print quality, lay-flat binding. Upload photos online, receive in 7 days.",
        "price": 1799, "category": "memory_books", "tab": "Memory Book",
        "mira_tag": "Year in pictures", "pillar": "memory",
        "tags": ["photo-book", "annual", "celebrate", "premium-print", "lay-flat"],
        "shopify_tags": "celebrate,celebrate-memory,memory-book,annual-photo-book,premium",
        "ai_image_prompt": "Premium dog annual photo book with lay-flat binding, showing beautiful dog photos inside, on coffee table, lifestyle photography",
    },
    {
        "sku": "LM-109", "name": "Soul Story Print",
        "subtitle": "Mira writes their soul story — printed",
        "description": "Mira AI writes your dog's unique soul story based on their profile. Printed on premium paper, A4. Delivered framed.",
        "price": 899, "category": "memory_books", "tab": "Soul Story",
        "mira_tag": "Written by Mira", "pillar": "memory",
        "tags": ["soul-story", "print", "celebrate", "ai-written", "framed"],
        "shopify_tags": "celebrate,celebrate-memory,soul-story,soul-print,ai-written",
        "ai_image_prompt": "Beautifully printed dog soul story document with elegant typography, paw print design, framed on wall, premium art print photography",
    },
    {
        "sku": "LM-110", "name": "Soul Story Digital Download",
        "subtitle": "Mira writes it — you download instantly",
        "description": "Mira AI writes a personalised soul story for your dog, delivered as a beautifully designed PDF. Print at home or share digitally.",
        "price": 399, "category": "memory_books", "tab": "Soul Story",
        "mira_tag": "Download and treasure", "pillar": "memory",
        "tags": ["soul-story", "digital", "celebrate", "ai-written", "pdf"],
        "shopify_tags": "celebrate,celebrate-memory,soul-story,digital-download,pdf",
        "ai_image_prompt": "Digital dog soul story PDF displayed on tablet and phone, beautiful design with dog illustration and story text, tech lifestyle photography",
    },
]


# ──────────────────────────────────────────────────────────────────────────────
# Seeder engine
# ──────────────────────────────────────────────────────────────────────────────

async def seed_excel_products(db) -> list:
    """Insert all 93 missing products into products_master. Returns list of new product IDs."""
    global excel_seed_status
    excel_seed_status["phase"] = "seeding"
    new_ids = []

    for product_def in EXCEL_CELEBRATE_PRODUCTS:
        # Check if product with same SKU or name already exists
        existing = await db.products_master.find_one(
            {"$or": [{"sku": product_def["sku"]}, {"name": product_def["name"]}]},
            {"_id": 0, "id": 1}
        )
        if existing:
            continue

        product_doc = {
            "id": _id(product_def["sku"]),
            "sku": product_def["sku"],
            "name": product_def["name"],
            "subtitle": product_def.get("subtitle", ""),
            "description": product_def.get("description", ""),
            "price": product_def.get("price", 0),
            "category": product_def["category"],
            "sub_category": product_def.get("tab", product_def["category"]),
            "tab": product_def.get("tab", ""),
            "pillar": product_def.get("pillar", "celebrate"),
            "pillar_tags": ["celebrate", product_def.get("pillar", "")],
            "tags": product_def.get("tags", []) + ["celebrate", "birthday"],
            "shopify_tags": product_def.get("shopify_tags", ""),
            "mira_tag": product_def.get("mira_tag", ""),
            "soul_signal": product_def.get("soul_signal", ""),
            "is_active": True,
            "in_stock": True,
            "featured": False,
            "is_concierge": product_def.get("is_concierge", False),
            "image_url": None,
            "image": None,
            "images": [],
            "ai_image_prompt": product_def.get("ai_image_prompt", ""),
            "ai_image_generated": False,
            "source": "excel_seed",
            "created_at": _now(),
            "updated_at": _now(),
        }
        await db.products_master.insert_one(product_doc)
        new_ids.append(product_doc["id"])
        excel_seed_status["seeded"] += 1

    excel_seed_status["total"] = len(new_ids)
    return new_ids


async def generate_images_for_excel_products(db, product_ids: list):
    """Generate AI images for seeded Excel products."""
    from ai_image_service import generate_ai_image, is_cloudinary_configured

    global excel_seed_status
    excel_seed_status["phase"] = "imaging"

    if not is_cloudinary_configured():
        excel_seed_status["phase"] = "done"
        excel_seed_status["running"] = False
        return

    for product_id in product_ids:
        if not excel_seed_status["running"]:
            break

        product = await db.products_master.find_one({"id": product_id}, {"_id": 0})
        if not product:
            continue

        excel_seed_status["current_item"] = product["name"]

        try:
            prompt = product.get("ai_image_prompt") or \
                f"Premium dog birthday product, {product['name']}, white background, professional product photography"

            url = await generate_ai_image(prompt)
            if url:
                await db.products_master.update_one(
                    {"id": product_id},
                    {"$set": {
                        "image_url": url,
                        "image": url,
                        "images": [url],
                        "ai_image_generated": True,
                        "image_updated_at": _now(),
                    }}
                )
                excel_seed_status["images_done"] += 1
                excel_seed_status["recent_images"].append({
                    "id": product_id,
                    "name": product["name"],
                    "url": url,
                    "sku": product.get("sku", ""),
                })
                if len(excel_seed_status["recent_images"]) > 20:
                    excel_seed_status["recent_images"] = excel_seed_status["recent_images"][-20:]
            else:
                excel_seed_status["images_failed"] += 1
        except Exception as e:
            logger.error(f"[EXCEL SEED] Image failed for {product_id}: {e}")
            excel_seed_status["images_failed"] += 1
            excel_seed_status["errors"].append(str(e))

        await asyncio.sleep(3)

    excel_seed_status["phase"] = "done"
    excel_seed_status["running"] = False
    excel_seed_status["finished_at"] = _now()


async def run_excel_seed(db):
    """Full pipeline: seed products from Excel → generate AI images."""
    global excel_seed_status
    excel_seed_status.update({
        "running": True,
        "phase": "seeding",
        "seeded": 0,
        "images_done": 0,
        "images_failed": 0,
        "current_item": None,
        "started_at": _now(),
        "finished_at": None,
        "recent_images": [],
        "errors": [],
    })
    try:
        new_ids = await seed_excel_products(db)
        if new_ids:
            await generate_images_for_excel_products(db, new_ids)
        else:
            excel_seed_status["phase"] = "done"
            excel_seed_status["running"] = False
    except Exception as e:
        logger.error(f"[EXCEL SEED] Fatal error: {e}")
        excel_seed_status["phase"] = "error"
        excel_seed_status["running"] = False
