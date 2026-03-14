"""
celebrate_product_generator.py
AI-powered product seeder for all 8 Celebrate Pillars.
Generates authentic products with Cloudinary images → seeds into products_master.

New sub-categories created:
  puzzle_toys     — Learning & Mind: Puzzle Toys + Brain Games tabs
  memory_books    — Love & Memory: Memory Book tab
  portraits       — Love & Memory: Custom Portrait tab
  pawty_kits      — Social & Friends: Pawty Planning tab (expanded)
  wellness_birthday — Health & Wellness: Birthday wellness picks

Usage:
  POST /api/admin/celebrate/seed-and-generate
  GET  /api/admin/celebrate/generation-status

Seeder inserts products then triggers AI image generation.
Progress tracked via shared generation_status in ai_image_service.py
"""

import uuid
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict

logger = logging.getLogger(__name__)

# ─── Shared generation status (per-process, updated in real time) ───────────
celebrate_gen_status: Dict = {
    "running": False,
    "phase": "idle",           # "seeding" | "imaging" | "done" | "error"
    "total_products": 0,
    "seeded": 0,
    "images_done": 0,
    "images_failed": 0,
    "current_item": None,
    "started_at": None,
    "finished_at": None,
    "pillar_breakdown": {},
    "recent_images": [],       # last 20 cloudinary URLs for live preview
}


def _id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ──────────────────────────────────────────────────────────────────────────────
# PRODUCT DEFINITIONS — all 8 celebrate pillars
# Structure: { name, description, price, category, sub_category, pillar_tags,
#              tags, is_active, is_concierge, ai_image_prompt }
# ──────────────────────────────────────────────────────────────────────────────

CELEBRATE_PRODUCTS = [

    # ════════════════════════════════════════════════════════════════
    # PILLAR 1: Food & Flavour — tabs: cakes, treats, desi-treats, nut-butters
    # ════════════════════════════════════════════════════════════════
    {
        "name": "Salmon & Sweet Potato Birthday Cake",
        "description": "Grain-free, soy-free birthday centrepiece. Salmon + sweet potato layers, cream cheese frosting.",
        "price": 1099, "category": "cakes", "sub_category": "birthday_cakes",
        "tags": ["salmon", "grain-free", "birthday", "celebration"],
        "ai_image_prompt": "Elegant dog birthday cake, salmon and sweet potato layers, cream cheese frosting with paw print decoration, pastel background, professional food photography, soft warm lighting",
    },
    {
        "name": "Chicken Birthday Cake — Breed Edition",
        "description": "High-protein chicken birthday cake with carrot shreds and brown rice. Named after your breed.",
        "price": 999, "category": "cakes", "sub_category": "birthday_cakes",
        "tags": ["chicken", "birthday", "breed", "protein"],
        "ai_image_prompt": "Premium dog birthday cake with chicken and carrot, decorated with a dog breed silhouette in frosting, white background, professional product photography",
    },
    {
        "name": "Peanut Butter & Banana Celebration Cake",
        "description": "All-natural peanut butter and banana sponge. A crowd-pleaser for every guest.",
        "price": 899, "category": "cakes", "sub_category": "birthday_cakes",
        "tags": ["peanut-butter", "banana", "birthday", "classic"],
        "ai_image_prompt": "Dog birthday cake with peanut butter and banana flavour, layered sponge with natural frosting, festive candle, clean white background, professional food photography",
    },
    {
        "name": "Mixed Berry Paw Cupcakes — 6 Pack",
        "description": "Six mini blueberry and cranberry cupcakes, one for each guest. Naturally coloured frosting.",
        "price": 549, "category": "treats", "sub_category": "birthday_treats",
        "tags": ["cupcakes", "berry", "birthday", "guests"],
        "ai_image_prompt": "Six adorable dog cupcakes with blueberry and cranberry frosting, paw print toppers, arranged on a wooden board, soft purple background, professional food photography",
    },
    {
        "name": "Slow-Baked Salmon Biscuit Platter",
        "description": "12 premium salmon biscuits, slow-baked, grain-free. The treat platter for the birthday table.",
        "price": 499, "category": "treats", "sub_category": "birthday_treats",
        "tags": ["salmon", "biscuit", "birthday", "grain-free"],
        "ai_image_prompt": "Dog treat platter with salmon biscuits arranged beautifully on a white ceramic board, garnished with rosemary, professional food styling, clean background",
    },
    {
        "name": "Desi Celebration Ladoo — Peanut & Jaggery",
        "description": "Indian-inspired peanut and jaggery ladoos, completely safe for dogs. 8-piece festive box.",
        "price": 449, "category": "desi-treats", "sub_category": "desi_birthday",
        "tags": ["desi", "ladoo", "peanut", "jaggery", "festive"],
        "ai_image_prompt": "Dog-safe Indian ladoos made with peanut and jaggery, arranged in a traditional festive box with marigold decoration, warm golden lighting, food photography",
    },
    {
        "name": "Almond & Coconut Barfi Bites",
        "description": "South Indian inspired coconut and almond bites for dogs. Festive, safe, delicious.",
        "price": 399, "category": "desi-treats", "sub_category": "desi_birthday",
        "tags": ["desi", "coconut", "almond", "barfi"],
        "ai_image_prompt": "Dog-safe coconut barfi bites in a traditional Indian sweet box, golden and white colours, festive marigold decoration, professional food photography",
    },
    {
        "name": "Birthday Peanut Butter — Natural Unsweetened 250g",
        "description": "Cold-pressed peanut butter, zero xylitol, zero sugar. Birthday lick mat essential.",
        "price": 399, "category": "nut-butters", "sub_category": "birthday_nut_butter",
        "tags": ["peanut-butter", "allergy-safe", "birthday", "lick-mat"],
        "ai_image_prompt": "Natural dog peanut butter in a beautiful glass jar with handwritten label, surrounded by peanuts, clean white background, professional product photography",
    },

    # ════════════════════════════════════════════════════════════════
    # PILLAR 2: Play & Joy — tabs: toys, accessories, activity bundles, party games
    # ════════════════════════════════════════════════════════════════
    {
        "name": "Birthday Rope Tug — Braided Rainbow",
        "description": "Thick braided rope toy in birthday colours. For the dog who plays to celebrate.",
        "price": 499, "category": "toys", "sub_category": "birthday_toys",
        "tags": ["rope", "tug", "birthday", "interactive"],
        "ai_image_prompt": "Colourful dog rope toy in rainbow birthday colours, thick braided cotton, clean white background, professional product photography",
    },
    {
        "name": "Birthday Squeaky Ball Set — 3 Balls",
        "description": "Three neon squeaky balls in birthday-edition colours. Non-toxic, durable rubber.",
        "price": 599, "category": "toys", "sub_category": "birthday_toys",
        "tags": ["squeaky", "ball", "birthday", "neon"],
        "ai_image_prompt": "Three colourful squeaky balls for dogs in birthday pink, purple, yellow, arranged festively, white background, product photography",
    },
    {
        "name": "Hide & Seek Plush Birthday Set",
        "description": "Birthday cake plush with 3 hidden squeaky treats inside. The best unboxing moment.",
        "price": 999, "category": "toys", "sub_category": "birthday_toys",
        "tags": ["plush", "hide-seek", "birthday", "interactive"],
        "ai_image_prompt": "Birthday cake plush dog toy with small squeaky plush treats hidden inside, soft pastel colours, white background, product photography",
    },

    # ════════════════════════════════════════════════════════════════
    # PILLAR 3: Social & Friends — tabs: party_kits, friend gifts, venue, invitations
    # NEW: Expand party_kits from 2 → 15+ products
    # ════════════════════════════════════════════════════════════════
    {
        "name": "Birthday Bandana Bow Set — Pack of 3",
        "description": "Soft cotton bandanas in party print for the birthday pup and two friends. One size fits all.",
        "price": 449, "category": "party_kits", "sub_category": "pawty_kits",
        "tags": ["bandana", "birthday", "friends", "cotton"],
        "ai_image_prompt": "Three colourful dog birthday bandanas with festive paw print pattern, folded and arranged beautifully on a white surface, product photography",
    },
    {
        "name": "Dog Birthday Crown Headband",
        "description": "Adjustable royal birthday crown for dogs. Gold glitter, elastic strap, zero discomfort.",
        "price": 299, "category": "party_kits", "sub_category": "pawty_kits",
        "tags": ["crown", "birthday", "headband", "royal"],
        "ai_image_prompt": "Gold glitter dog birthday crown headband, elegant and festive, product photography on white background with confetti",
    },
    {
        "name": "Paw Print Birthday Balloons — Pack of 12",
        "description": "12 latex birthday balloons in paw print design. Non-toxic, pet-safe colours.",
        "price": 299, "category": "party_kits", "sub_category": "pawty_kits",
        "tags": ["balloons", "birthday", "pawty", "decoration"],
        "ai_image_prompt": "Dog birthday balloons with paw print pattern in pink and purple, bunch of 12 balloons against white background, professional product photography",
    },
    {
        "name": "Pawty Kit — Bandanas, Treat Bags & Streamers",
        "description": "All-in-one pawty kit: 3 bandanas, 6 treat bags, confetti, streamers. For 3 dogs + their humans.",
        "price": 899, "category": "party_kits", "sub_category": "pawty_kits",
        "tags": ["pawty-kit", "bandana", "treat-bags", "all-in-one"],
        "ai_image_prompt": "Dog birthday party kit flatlay: bandanas, treat bags, streamers, paw print confetti arranged beautifully on pastel purple background, product photography",
    },
    {
        "name": "Birthday Photo Booth Props Set — 12 Pieces",
        "description": "12 funny and festive dog birthday props for the photoshoot. Frames, signs, accessories.",
        "price": 599, "category": "party_kits", "sub_category": "pawty_kits",
        "tags": ["photo-booth", "props", "birthday", "fun"],
        "ai_image_prompt": "Dog birthday photo booth props set: funny signs, paw print frames, party hats, birthday banners, arranged as flatlay, pink and purple background",
    },
    {
        "name": "Dog Birthday Bone Banner — Happy Birthday",
        "description": "Bone-shaped Happy Birthday banner, string-hung. 8 bones spelling H-A-P-P-Y B-R-T-H-D-A-Y.",
        "price": 349, "category": "party_kits", "sub_category": "pawty_kits",
        "tags": ["banner", "birthday", "bone-shaped", "decoration"],
        "ai_image_prompt": "Dog birthday bone-shaped banner spelling Happy Birthday, pastel purple and gold colours, hung on a string, white background, product photography",
    },
    {
        "name": "Paw Print Party Invitation Cards — 10-Pack",
        "description": "10 personalised-style invitation cards for your dog's birthday. Thick card, paw print design.",
        "price": 349, "category": "party_accessories", "sub_category": "pawty_invitations",
        "tags": ["invitations", "birthday", "cards", "paw-print"],
        "ai_image_prompt": "Dog birthday invitation cards with paw print design, elegant typography, pastel purple background, 10 cards fanned out, professional product photography",
    },
    {
        "name": "Personalised Birthday Sash for Dogs",
        "description": "Satin birthday sash with 'Birthday Dog' in gold lettering. Adjustable velcro fit.",
        "price": 449, "category": "party_kits", "sub_category": "pawty_kits",
        "tags": ["sash", "birthday", "personalised", "satin"],
        "ai_image_prompt": "Elegant dog birthday sash in purple satin with gold 'Birthday Dog' lettering, photographed flat on white background, product photography",
    },
    {
        "name": "Biodegradable Party Confetti — Pet-Safe",
        "description": "Compostable paper confetti in paw print and heart shapes. Safe if pets eat it. 50g bag.",
        "price": 249, "category": "party_kits", "sub_category": "pawty_kits",
        "tags": ["confetti", "biodegradable", "pet-safe", "party"],
        "ai_image_prompt": "Biodegradable paw print confetti and heart shapes in pink and purple, scattered beautifully on white surface, close-up product photography",
    },

    # ════════════════════════════════════════════════════════════════
    # PILLAR 4: Adventure & Move — tabs: accessories, outdoor, gear, treats
    # ════════════════════════════════════════════════════════════════
    {
        "name": "Birthday Adventure Backpack — Pet-Carry",
        "description": "Compact lightweight hiking backpack for the birthday adventure. Fits dogs up to 8kg.",
        "price": 2499, "category": "accessories", "sub_category": "adventure_gear",
        "tags": ["backpack", "adventure", "birthday", "hiking"],
        "ai_image_prompt": "Dog hiking backpack carrier in birthday purple colour, lightweight design with mesh ventilation, white background, professional product photography",
    },
    {
        "name": "All-Terrain Paw Protector Boots — Set of 4",
        "description": "Durable rubber paw boots for birthday hikes and trails. Anti-slip sole, easy to put on.",
        "price": 999, "category": "accessories", "sub_category": "adventure_gear",
        "tags": ["boots", "paw-protection", "adventure", "all-terrain"],
        "ai_image_prompt": "Dog paw boots in vibrant purple and yellow, set of four, all-terrain rubber soles, white background, product photography",
    },
    {
        "name": "Birthday Trail Treats — Protein Pack",
        "description": "High-protein jerky strips for the birthday trail. Chicken or beef. 200g energy pack.",
        "price": 599, "category": "treats", "sub_category": "adventure_treats",
        "tags": ["trail-treats", "jerky", "adventure", "protein"],
        "ai_image_prompt": "Dog trail treat pack in premium packaging, jerky strips visible through window, adventure outdoor design, clean background, product photography",
    },

    # ════════════════════════════════════════════════════════════════
    # PILLAR 5: Grooming & Beauty — tabs: grooming booking, accessories, spa, photo-ready
    # ════════════════════════════════════════════════════════════════
    {
        "name": "Birthday Bow Collection — Set of 5",
        "description": "5 satin birthday bows in party colours. Clip-on for collar or hair. For photos.",
        "price": 349, "category": "accessories", "sub_category": "birthday_grooming",
        "tags": ["bows", "birthday", "grooming", "photo-ready"],
        "ai_image_prompt": "Set of 5 satin dog bows in birthday colours: pink, purple, gold, white, floral, arranged on white velvet background, product photography",
    },
    {
        "name": "Aromatherapy Birthday Shampoo — Lavender",
        "description": "Spa-grade lavender dog shampoo for birthday bath time. Calming, moisturising, long-lasting scent.",
        "price": 699, "category": "grooming", "sub_category": "birthday_spa",
        "tags": ["shampoo", "lavender", "spa", "birthday"],
        "ai_image_prompt": "Premium dog birthday shampoo in elegant purple glass bottle with lavender label, surrounded by lavender sprigs, white background, product photography",
    },
    {
        "name": "Birthday Bandana + Cologne Gift Set",
        "description": "Premium gift set: 1 bandana + 30ml pet cologne in birthday fragrance. Perfect photo-ready combo.",
        "price": 799, "category": "accessories", "sub_category": "birthday_grooming",
        "tags": ["gift-set", "bandana", "cologne", "photo-ready"],
        "ai_image_prompt": "Dog birthday gift set: embroidered bandana and small cologne bottle, wrapped in ribbon and tissue, white luxury box, product photography",
    },

    # ════════════════════════════════════════════════════════════════
    # PILLAR 6: Learning & Mind — NEW: puzzle_toys category (was 0 products)
    # tabs: puzzle_toys (Puzzle Toys), puzzle_toys (Brain Games), training, accessories
    # ════════════════════════════════════════════════════════════════
    {
        "name": "Nina Ottosson Dog Tornado — Level 2 Puzzle",
        "description": "Bestselling rotating puzzle feeder. Treats hidden under 9 compartments. Dogs solve it, reward follows.",
        "price": 1299, "category": "puzzle_toys", "sub_category": "puzzle_toys",
        "tags": ["puzzle", "interactive", "enrichment", "level-2"],
        "ai_image_prompt": "Dog puzzle toy Nina Ottosson Tornado style, circular rotating design with treat compartments, purple and white colour scheme, white background, product photography",
    },
    {
        "name": "Snuffle Mat — Nose Work Enrichment",
        "description": "Handmade snuffle mat with 200+ fleece strips. Hide treats, let your dog use their nose. 40x30cm.",
        "price": 799, "category": "puzzle_toys", "sub_category": "puzzle_toys",
        "tags": ["snuffle-mat", "nose-work", "enrichment", "anxiety"],
        "ai_image_prompt": "Dog snuffle mat in purple and pink fleece strips, treats hidden inside, textured close-up, white background, product photography",
    },
    {
        "name": "Dog Puzzle Board — 5-Action Level 3",
        "description": "Advanced puzzle board with 5 different actions: flip, slide, spin, lift, remove. For smart dogs.",
        "price": 1599, "category": "puzzle_toys", "sub_category": "puzzle_toys",
        "tags": ["puzzle-board", "level-3", "advanced", "smart-dogs"],
        "ai_image_prompt": "Advanced dog puzzle board with multiple compartments, slides and spinners, wooden construction, treat visible, white background, professional product photography",
    },
    {
        "name": "Wobble Kong — Treat Dispensing Ball",
        "description": "Classic Kong-style wobble ball. Stuff with peanut butter or treats. Hours of enrichment.",
        "price": 799, "category": "puzzle_toys", "sub_category": "puzzle_toys",
        "tags": ["kong", "wobble", "treat-dispensing", "enrichment"],
        "ai_image_prompt": "Red and black Kong-style wobble treat dispensing dog toy, peanut butter visible inside, white background, professional product photography",
    },
    {
        "name": "Outward Hound Hide-A-Birthday Plush",
        "description": "Birthday-edition hide and seek plush. Cake plush hides 3 squeaky treat characters.",
        "price": 1099, "category": "puzzle_toys", "sub_category": "puzzle_toys",
        "tags": ["hide-seek", "plush", "birthday", "squeaky"],
        "ai_image_prompt": "Birthday cake dog plush toy with three hidden squeaky characters inside, soft pastel birthday colours, white background, product photography",
    },
    {
        "name": "Interactive Lick Mat — Anxiety Calm",
        "description": "Textured lick mat with ridge patterns. Spread peanut butter or wet food for slow feeding.",
        "price": 599, "category": "puzzle_toys", "sub_category": "puzzle_toys",
        "tags": ["lick-mat", "anxiety", "slow-feeder", "calming"],
        "ai_image_prompt": "Dog lick mat with honeycomb pattern texture, peanut butter spread on it, suction cup base, purple tones, white background, product photography",
    },
    {
        "name": "Birthday Muffin Tin Puzzle Game — DIY",
        "description": "Stainless steel muffin tin + 12 tennis balls. Hide treats under balls. Best DIY puzzle ever.",
        "price": 499, "category": "puzzle_toys", "sub_category": "brain_games",
        "tags": ["muffin-tin", "DIY", "brain-game", "tennis-ball"],
        "ai_image_prompt": "Dog muffin tin puzzle game with mini tennis balls covering treat compartments, stainless steel tin, white background, product photography",
    },
    {
        "name": "Snuffle Ball — XL Nose Work",
        "description": "Extra-large snuffle ball with 200+ fleece strips. Toss, roll, sniff. 30cm diameter.",
        "price": 699, "category": "puzzle_toys", "sub_category": "brain_games",
        "tags": ["snuffle-ball", "nose-work", "XL", "enrichment"],
        "ai_image_prompt": "Large fluffy dog snuffle ball toy in pastel purple and pink fleece, round shape, treats hidden inside the fleece strips, white background",
    },
    {
        "name": "IQ Treat Ball — Roll & Reward",
        "description": "Adjustable difficulty treat ball. Dog rolls it, treats fall out. 3 difficulty settings.",
        "price": 549, "category": "puzzle_toys", "sub_category": "brain_games",
        "tags": ["treat-ball", "IQ", "roll", "adjustable"],
        "ai_image_prompt": "Dog IQ treat dispensing ball with adjustable holes, translucent purple plastic with treats visible inside, white background, product photography",
    },
    {
        "name": "Training Trick Kit — 50 Trick Cards",
        "description": "50 trick training cards from sit to complex sequences. Step-by-step photos. Perfect birthday brain gift.",
        "price": 899, "category": "training", "sub_category": "trick_training",
        "tags": ["training", "trick-cards", "beginner", "birthday"],
        "ai_image_prompt": "Dog training trick cards set, 50 illustrated cards with dog tricks, spread out fanned view, clean white background, product photography",
    },
    {
        "name": "Clicker Training Kit — Beginner Set",
        "description": "Clicker + 100 training treats + guide booklet. Everything needed to teach 10 new tricks.",
        "price": 599, "category": "training", "sub_category": "trick_training",
        "tags": ["clicker", "training", "beginner", "treats"],
        "ai_image_prompt": "Dog clicker training kit with colorful clicker, treat pouch and illustrated guide booklet, arranged on white background, product photography",
    },

    # ════════════════════════════════════════════════════════════════
    # PILLAR 7: Health & Wellness — tabs: supplements, health, longevity
    # NEW: Expand supplements from 5 → 17 products
    # ════════════════════════════════════════════════════════════════
    {
        "name": "Himalayan Yak Milk Hard Chew — Large",
        "description": "100% natural yak milk chew. Long-lasting, lactose-free, zero artificial additives. Dental + fun.",
        "price": 599, "category": "supplements", "sub_category": "wellness_birthday",
        "tags": ["yak-chew", "natural", "dental", "long-lasting"],
        "ai_image_prompt": "Himalayan yak milk dog chew, natural golden-brown colour, rustic wooden background, premium packaging label, product photography",
    },
    {
        "name": "Pure Salmon Oil — Cold-Pressed 250ml",
        "description": "Wild-caught salmon oil, cold-pressed. Omega 3 and 6 for coat, joints and brain. Pump bottle.",
        "price": 799, "category": "supplements", "sub_category": "wellness_birthday",
        "tags": ["salmon-oil", "omega-3", "coat", "brain"],
        "ai_image_prompt": "Premium dog salmon oil in elegant amber pump bottle with salmon illustration label, white background, professional product photography",
    },
    {
        "name": "Birthday Probiotic Powder — 30-Day Pack",
        "description": "Gut health probiotic powder. 10 billion CFU per serving. Mix into food. Birthday gut reset.",
        "price": 999, "category": "supplements", "sub_category": "wellness_birthday",
        "tags": ["probiotic", "gut-health", "powder", "30-day"],
        "ai_image_prompt": "Dog probiotic supplement powder in premium sachet pack, 30 individual servings, clean white background, health product photography",
    },
    {
        "name": "Turmeric + Coconut Golden Milk Chews",
        "description": "Anti-inflammatory turmeric with coconut oil in soft chew form. Joint and immunity support.",
        "price": 699, "category": "supplements", "sub_category": "wellness_birthday",
        "tags": ["turmeric", "coconut", "anti-inflammatory", "immunity"],
        "ai_image_prompt": "Golden turmeric dog supplement chews in beautiful golden packaging, surrounded by turmeric root and coconut, warm lighting, product photography",
    },
    {
        "name": "Hip & Joint Glucosamine Chews — 60 Count",
        "description": "Glucosamine + Chondroitin + MSM soft chews. For active or senior dogs. Chicken flavour.",
        "price": 1299, "category": "supplements", "sub_category": "wellness_birthday",
        "tags": ["glucosamine", "joint", "chondroitin", "senior"],
        "ai_image_prompt": "Dog joint supplement chews bottle, 60 count, glucosamine label, professional pharmaceutical photography, white background",
    },
    {
        "name": "Omega-3 DHA Capsules — Skin & Coat 90 Count",
        "description": "Marine omega-3 DHA + EPA capsules. Reduces shedding, improves coat shine, calms inflammation.",
        "price": 849, "category": "supplements", "sub_category": "wellness_birthday",
        "tags": ["omega-3", "DHA", "coat", "shedding"],
        "ai_image_prompt": "Dog omega-3 fish oil capsules bottle, 90 count, clean pharmaceutical design, white background, professional product photography",
    },
    {
        "name": "Daily Multivitamin Soft Chews — 30 Count",
        "description": "Complete multivitamin: A, B, C, D, E + zinc, biotin, folic acid. One birthday chew per day.",
        "price": 699, "category": "supplements", "sub_category": "wellness_birthday",
        "tags": ["multivitamin", "daily", "biotin", "complete"],
        "ai_image_prompt": "Dog daily multivitamin soft chews in a clean amber bottle, 30 count, colourful vitamins visible, white background, product photography",
    },
    {
        "name": "Dental Chew Sticks — 30-Day Birthday Pack",
        "description": "Enzymatic dental chews that reduce tartar. Birthday gift that keeps giving all month.",
        "price": 499, "category": "supplements", "sub_category": "wellness_birthday",
        "tags": ["dental", "chew", "tartar", "30-day"],
        "ai_image_prompt": "Dog dental chew sticks in a birthday-edition box, 30 count, green colour, fresh mint design, white background, product photography",
    },
    {
        "name": "Calming Lavender Chamomile Soft Chews",
        "description": "Natural anxiety relief chews. Lavender + chamomile + L-theanine. Birthday stress support.",
        "price": 799, "category": "supplements", "sub_category": "wellness_birthday",
        "tags": ["calming", "lavender", "anxiety", "L-theanine"],
        "ai_image_prompt": "Dog calming supplement chews in soft lavender packaging, surrounded by lavender flowers and chamomile, warm soft lighting, product photography",
    },
    {
        "name": "Immunity Booster Mushroom Powder — 60 Servings",
        "description": "Reishi, Chaga, Turkey Tail mushroom blend. Immune system + longevity support. Unflavoured powder.",
        "price": 1099, "category": "supplements", "sub_category": "wellness_birthday",
        "tags": ["mushroom", "immunity", "longevity", "reishi"],
        "ai_image_prompt": "Dog immunity mushroom supplement powder in premium dark glass jar, mushroom illustrations on label, earthy tones, white background",
    },
    {
        "name": "Birthday Wellness Bundle — 3-Product Set",
        "description": "Curated birthday wellness trio: salmon oil + probiotic + multivitamin. 3-month supply.",
        "price": 2499, "category": "supplements", "sub_category": "wellness_birthday",
        "tags": ["bundle", "wellness", "3-month", "birthday"],
        "ai_image_prompt": "Dog wellness supplement bundle set of three bottles in premium packaging, arranged elegantly on white marble background, product photography",
    },
    {
        "name": "Collagen Joint Support Powder",
        "description": "Marine collagen + hyaluronic acid powder. Mix into food. Joint lubrication + coat benefits.",
        "price": 1199, "category": "health", "sub_category": "longevity",
        "tags": ["collagen", "joint", "hyaluronic", "marine"],
        "ai_image_prompt": "Dog collagen supplement powder in elegant white and gold packaging, surrounded by marine elements, clean background, product photography",
    },

    # ════════════════════════════════════════════════════════════════
    # PILLAR 8: Love & Memory — NEW categories: memory_books, portraits
    # tabs: photoshoot(concierge), portraits, memory_books, accessories
    # ════════════════════════════════════════════════════════════════
    {
        "name": "Custom Pet Portrait — Watercolour A4",
        "description": "Hand-illustrated watercolour portrait of your dog. Artist works from your best birthday photo. Framed.",
        "price": 1999, "category": "portraits", "sub_category": "portraits",
        "tags": ["portrait", "watercolour", "custom", "framed", "art"],
        "ai_image_prompt": "Beautiful hand-painted watercolour dog portrait in elegant frame, soft pastel background, gold frame, professional art photography",
        "is_concierge": True,
    },
    {
        "name": "Pet Portrait on Canvas — 8x10 inch",
        "description": "Gallery-quality canvas portrait from your photo. Oil painting style. Arrives stretched and ready to hang.",
        "price": 2799, "category": "portraits", "sub_category": "portraits",
        "tags": ["portrait", "canvas", "oil-painting", "gallery"],
        "ai_image_prompt": "Dog portrait on canvas in oil painting style, warm rich colours, wrapped canvas on wall, professional interior photography",
        "is_concierge": True,
    },
    {
        "name": "Illustrated Soul Story Print — Framed A4",
        "description": "A printed illustration of your pet's life story written by Mira, with a custom illustrated border.",
        "price": 1699, "category": "portraits", "sub_category": "portraits",
        "tags": ["soul-story", "print", "illustrated", "mira"],
        "ai_image_prompt": "Elegant framed dog soul story print with watercolour border, paw prints, personalised text in beautiful typography, white frame, product photography",
        "is_concierge": True,
    },
    {
        "name": "Framed Birthday Photo Book — 20 Pages",
        "description": "A printed hardcover 20-page birthday photo book. Upload your photos, we print and frame.",
        "price": 2499, "category": "memory_books", "sub_category": "memory_books",
        "tags": ["photo-book", "hardcover", "birthday", "printed"],
        "ai_image_prompt": "Elegant dog birthday photo book, hardcover in soft pink, open to show beautiful dog photos, professional book photography, white background",
        "is_concierge": True,
    },
    {
        "name": "Soul Story Book — Personalised Hardcover",
        "description": "Mira writes your pet's life story: their soul, their moments, their year. Hardcover A5.",
        "price": 2999, "category": "memory_books", "sub_category": "memory_books",
        "tags": ["soul-story", "personalised", "hardcover", "mira"],
        "ai_image_prompt": "Personalised dog soul story hardcover book with dog silhouette and paw print on cover, premium purple and gold design, white background, book photography",
        "is_concierge": True,
    },
    {
        "name": "Birthday Memory Box — Keepsake Chest",
        "description": "Wooden keepsake chest for birthday mementos: collar, photos, cards, paw print. Engraved lid.",
        "price": 1799, "category": "memory_books", "sub_category": "memory_books",
        "tags": ["memory-box", "keepsake", "wooden", "engraved"],
        "ai_image_prompt": "Wooden dog keepsake memory box with engraved paw print and name on lid, filled with photos and collar, warm wood tones, product photography",
    },
    {
        "name": "Paw Print Impression Kit — DIY Keepsake",
        "description": "Safe non-toxic clay for paw impressions. Air-dry, paint, keep forever. Comes with frame.",
        "price": 699, "category": "memory_books", "sub_category": "memory_books",
        "tags": ["paw-print", "impression", "clay", "keepsake"],
        "ai_image_prompt": "Dog paw print impression kit with non-toxic clay, finished paw impression in small frame, clean white background, product photography",
    },
    {
        "name": "Custom Birthday Wall Calendar — 12 Months",
        "description": "Upload 12 photos, we print a full-year birthday calendar. Your pet, every month of next year.",
        "price": 1299, "category": "memory_books", "sub_category": "memory_books",
        "tags": ["calendar", "custom", "birthday", "12-months"],
        "ai_image_prompt": "Custom dog birthday calendar wall calendar, open showing dog photo for each month, premium print quality, white background, product photography",
    },
    {
        "name": "Birthday Memory Scrapbook Kit",
        "description": "DIY scrapbook kit with paw print stickers, birthday papers, photo holders. Build the memory.",
        "price": 999, "category": "memory_books", "sub_category": "memory_books",
        "tags": ["scrapbook", "DIY", "birthday", "stickers"],
        "ai_image_prompt": "Dog birthday scrapbook making kit with purple and pink patterned papers, paw stickers, photo mounts, arranged artfully, product photography",
    },
    {
        "name": "Custom Embroidered Pet Photo Cushion",
        "description": "Your pet's photo embroidered on a 30x30cm cushion. Heirloom quality. Never fades.",
        "price": 1499, "category": "accessories", "sub_category": "memory_gifts",
        "tags": ["embroidered", "cushion", "photo", "heirloom"],
        "ai_image_prompt": "Custom embroidered dog photo cushion, white fabric with detailed dog portrait embroidery, placed on a sofa, interior photography",
    },
]


# ──────────────────────────────────────────────────────────────────────────────
# Generator engine
# ──────────────────────────────────────────────────────────────────────────────

async def seed_celebrate_products(db) -> list:
    """Insert all missing celebrate products into products_master. Returns list of new product IDs."""
    global celebrate_gen_status
    celebrate_gen_status["phase"] = "seeding"
    new_ids = []

    for product_def in CELEBRATE_PRODUCTS:
        # Check if product with same name already exists
        existing = await db.products_master.find_one(
            {"name": product_def["name"]}, {"_id": 0, "id": 1}
        )
        if existing:
            continue

        product_doc = {
            "id": _id(f"cel-{product_def['category']}"),
            "name": product_def["name"],
            "description": product_def["description"],
            "price": product_def.get("price", 0),
            "category": product_def["category"],
            "sub_category": product_def.get("sub_category", product_def["category"]),
            "pillar": "celebrate",
            "pillar_tags": ["celebrate"],
            "tags": product_def.get("tags", []),
            "is_active": True,
            "in_stock": True,
            "featured": False,
            "is_concierge": product_def.get("is_concierge", False),
            "image_url": None,
            "image": None,
            "images": [],
            "ai_image_prompt": product_def.get("ai_image_prompt", ""),
            "ai_image_generated": False,
            "source": "ai_generated",
            "created_at": _now(),
            "updated_at": _now(),
        }
        await db.products_master.insert_one(product_doc)
        new_ids.append(product_doc["id"])
        celebrate_gen_status["seeded"] += 1

    celebrate_gen_status["total_products"] = len(new_ids)
    logger.info(f"[CELEBRATE GEN] Seeded {len(new_ids)} new products")
    return new_ids


async def generate_images_for_celebrate(db, product_ids: list):
    """Generate AI images for seeded celebrate products and upload to Cloudinary."""
    from ai_image_service import generate_ai_image, is_cloudinary_configured
    import cloudinary
    import cloudinary.uploader

    global celebrate_gen_status
    celebrate_gen_status["phase"] = "imaging"

    if not is_cloudinary_configured():
        logger.warning("[CELEBRATE GEN] Cloudinary not configured — skipping image generation")
        celebrate_gen_status["phase"] = "done"
        celebrate_gen_status["running"] = False
        return

    for product_id in product_ids:
        if not celebrate_gen_status["running"]:
            break

        product = await db.products_master.find_one({"id": product_id}, {"_id": 0})
        if not product:
            continue

        celebrate_gen_status["current_item"] = product["name"]

        try:
            prompt = product.get("ai_image_prompt") or \
                f"Premium dog birthday product, {product['name']}, clean white background, professional product photography"

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
                celebrate_gen_status["images_done"] += 1
                celebrate_gen_status["recent_images"].append({
                    "id": product_id,
                    "name": product["name"],
                    "url": url,
                    "category": product["category"],
                })
                if len(celebrate_gen_status["recent_images"]) > 20:
                    celebrate_gen_status["recent_images"] = celebrate_gen_status["recent_images"][-20:]
            else:
                celebrate_gen_status["images_failed"] += 1
        except Exception as e:
            logger.error(f"[CELEBRATE GEN] Image generation failed for {product_id}: {e}")
            celebrate_gen_status["images_failed"] += 1

        await asyncio.sleep(3)  # Rate limit

    celebrate_gen_status["phase"] = "done"
    celebrate_gen_status["running"] = False
    celebrate_gen_status["finished_at"] = _now()
    logger.info(f"[CELEBRATE GEN] Complete. {celebrate_gen_status['images_done']} images generated.")


async def run_full_celebrate_generation(db):
    """Full pipeline: seed products → generate images."""
    global celebrate_gen_status
    celebrate_gen_status.update({
        "running": True,
        "phase": "seeding",
        "seeded": 0,
        "images_done": 0,
        "images_failed": 0,
        "current_item": None,
        "started_at": _now(),
        "finished_at": None,
        "recent_images": [],
    })
    try:
        new_ids = await seed_celebrate_products(db)
        if new_ids:
            await generate_images_for_celebrate(db, new_ids)
        else:
            celebrate_gen_status["phase"] = "done"
            celebrate_gen_status["running"] = False
    except Exception as e:
        logger.error(f"[CELEBRATE GEN] Fatal error: {e}")
        celebrate_gen_status["phase"] = "error"
        celebrate_gen_status["running"] = False
