#!/usr/bin/env python3
"""
Seed Play products + services into DB
"""
import os, sys
sys.path.insert(0, '/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
from pymongo import MongoClient
from datetime import datetime, timezone

client = MongoClient(os.environ['MONGO_URL'])
db = client[os.environ.get('DB_NAME', 'pet_life_os')]

# ── 25 New Play Products ──────────────────────────────────────
PLAY_PRODUCTS = [
    {"id":"PL-OUT-001","pillar":"play","category":"outings","sub_category":"outings","dimension":"Play Essentials","name":"Dog Park Survival Kit","description":"Water bottle, collapsible bowl, poop bags, towel, and treat pouch — everything for a park day","price":1099,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a neat park kit — collapsible bowl, water bottle, treat pouch, towel in a canvas bag, green tones, white background"},
    {"id":"PL-OUT-002","pillar":"play","category":"outings","sub_category":"outings","dimension":"Play Essentials","name":"Retractable Longline Lead","description":"10m training lead for recall practice and free-roaming in open spaces — reflective, strong clip","price":799,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a retractable longline lead in orange and green, neatly coiled, white background"},
    {"id":"PL-OUT-003","pillar":"play","category":"outings","sub_category":"outings","dimension":"Play Essentials","name":"High-Visibility Safety Vest","description":"Bright reflective vest for evening park runs and dawn walks — keeps your dog visible and safe","price":699,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a bright orange reflective dog safety vest, minimal clean photo, white background"},
    {"id":"PL-OUT-004","pillar":"play","category":"outings","sub_category":"outings","dimension":"Play Essentials","name":"Portable Splash Pad","description":"Foldable water pad for garden or park — instant cool-down splash zone for hot days","price":999,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a round blue portable splash pad for dogs, folded and unfolded views, white background"},
    {"id":"PL-PD-001","pillar":"play","category":"playdates","sub_category":"playdates","dimension":"Play Essentials","name":"Playdate Starter Pack","description":"Rope toy, tug toy, and treat bag — everything needed for a playdate with another dog","price":849,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a playdate starter kit with rope toy, tug toy, and treat pouch in a green cotton bag, white background"},
    {"id":"PL-PD-002","pillar":"play","category":"playdates","sub_category":"playdates","dimension":"Play Essentials","name":"Interactive Fetch Launcher","description":"Ball launcher for hands-free fetch — extends play time and reduces wrist strain","price":1299,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a green and orange automatic ball launcher for dogs, clean minimal product photo, white background"},
    {"id":"PL-PD-003","pillar":"play","category":"playdates","sub_category":"playdates","dimension":"Play Essentials","name":"Squeaky Ball Set — 3 pack","description":"Bright durable squeaky balls for park and playdate play — high-bounce, non-toxic rubber","price":399,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a set of 3 colourful squeaky balls in orange, green, and yellow, white background"},
    {"id":"PL-WK-001","pillar":"play","category":"walking","sub_category":"walking","dimension":"Play Essentials","name":"Hands-Free Running Lead","description":"Waist-belt running lead — keeps your hands free for morning jogs with your dog","price":899,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a hands-free running lead with waist belt, orange and green, athletic minimal design, white background"},
    {"id":"PL-WK-002","pillar":"play","category":"walking","sub_category":"walking","dimension":"Play Essentials","name":"Paw Wax & Protective Balm","description":"Protects paws from hot pavements, rough terrain, and sand — travel-size and home-size","price":349,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a small tin of paw wax balm with paw print lid, natural tones, white background"},
    {"id":"PL-WK-003","pillar":"play","category":"walking","sub_category":"walking","dimension":"Play Essentials","name":"Walk & Hydration Bottle","description":"All-in-one filtered water bottle with detachable bowl — for walks, runs, and park days","price":549,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a sleek walk-and-hydrate water bottle with bowl attachment, green and white, white background"},
    {"id":"PL-WK-004","pillar":"play","category":"walking","sub_category":"walking","dimension":"Play Essentials","name":"Treat Training Pouch","description":"Magnetic-close treat pouch with waste bag holder and key clip — clips to any lead","price":449,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a neat orange treat training pouch with magnetic closure, clipped to lead, white background"},
    {"id":"PL-FT-001","pillar":"play","category":"fitness","sub_category":"fitness","dimension":"Fitness & Training","name":"Agility Starter Set","description":"6-piece agility set: hurdles, weave poles, and tunnel — for garden or park use","price":2499,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a colourful agility set with hurdles, weave poles, and tunnel arranged in a garden, white background"},
    {"id":"PL-FT-002","pillar":"play","category":"fitness","sub_category":"fitness","dimension":"Fitness & Training","name":"Balance Disc for Dogs","description":"Inflatable balance disc for core strength training and coordination — physiotherapy approved","price":1299,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: an inflatable balance disc for dogs with non-slip surface, green and orange, white background"},
    {"id":"PL-FT-003","pillar":"play","category":"fitness","sub_category":"fitness","dimension":"Fitness & Training","name":"Pet Weight Scale — Smart","description":"Digital scale that tracks weekly weight — syncs to pet health app, accurate to 50g","price":1799,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a clean digital pet weight scale with smart display, minimal design, white background"},
    {"id":"PL-FT-004","pillar":"play","category":"fitness","sub_category":"fitness","dimension":"Fitness & Training","name":"Nose Work Kit","description":"Set of 3 hide containers + instruction card for scent work and mental stimulation training","price":699,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a nose work scent training kit with small containers and illustrated guide card, white background"},
    {"id":"PL-FT-005","pillar":"play","category":"fitness","sub_category":"fitness","dimension":"Fitness & Training","name":"Weighted Exercise Vest — Canine","description":"Low-weight vest for building muscle tone during walks — vet-approved, removable weights","price":1999,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a canine weighted exercise vest in green, removable weight pockets visible, white background"},
    {"id":"PL-FT-006","pillar":"play","category":"fitness","sub_category":"fitness","dimension":"Fitness & Training","name":"Puzzle Feeder — Active Level","description":"High-difficulty puzzle feeder for mental stimulation — makes meals a workout","price":849,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a multi-level orange and green puzzle feeder for dogs, minimal white background"},
    {"id":"PL-SW-001","pillar":"play","category":"swimming","sub_category":"swimming","dimension":"Fitness & Training","name":"Dog Life Jacket — All Sizes","description":"Safety swim vest with rescue handle — IATA tested, available in XS to XL","price":1599,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a bright orange dog life jacket with rescue handle, size range shown, white background"},
    {"id":"PL-SW-002","pillar":"play","category":"swimming","sub_category":"swimming","dimension":"Fitness & Training","name":"Post-Swim Microfibre Towel","description":"Super-absorbent quick-dry towel with paw pocket — dries in seconds after swims","price":499,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a green microfibre dog towel folded with paw pocket detail, clean minimal, white background"},
    {"id":"PL-SW-003","pillar":"play","category":"swimming","sub_category":"swimming","dimension":"Fitness & Training","name":"Pool Ramp for Dogs","description":"Portable pool exit ramp — prevents exhaustion and injury for dogs who love to swim","price":2299,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a sturdy dog pool exit ramp in green, folded and extended views, white background"},
    {"id":"PL-SW-004","pillar":"play","category":"swimming","sub_category":"swimming","dimension":"Fitness & Training","name":"Waterproof Ear Protectors","description":"Soft silicone ear covers for swimming — protects against ear infections after water play","price":399,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: soft silicone ear covers for dogs, clean minimal white background, green tones"},
    {"id":"PL-SL-001","pillar":"play","category":"soul","sub_category":"soul","dimension":"Soul Play Products","name":"Playdate Invitation Card Set","description":"Custom illustrated cards with your dog's name and breed — send before a playdate","price":299,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a set of beautiful illustrated playdate invitation cards with dog breed art and name, cream and green, white background"},
    {"id":"PL-SL-002","pillar":"play","category":"soul","sub_category":"soul","dimension":"Soul Play Products","name":"Park Day Bandana — Personalised","description":"Breed bandana with 'Park Day with [Name]' embroidery — worn on every outing","price":399,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a folded personalised bandana with Park Day embroidery and dog name, green and orange, white background"},
    {"id":"PL-SL-003","pillar":"play","category":"soul","sub_category":"soul","dimension":"Soul Play Products","name":"Fitness Milestone Card","description":"Printed card celebrating a fitness milestone — '100 walks', 'First swim', 'Agility graduate'","price":199,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a beautiful illustrated milestone certificate card for dogs, gold and green, white background"},
    {"id":"PL-SL-004","pillar":"play","category":"soul","sub_category":"soul","dimension":"Soul Play Products","name":"Play Passport Journal","description":"Illustrated journal to track every park, beach, trail, and playdate — a map of adventures","price":699,"is_mira_pick":True,"status":"active","mockup_prompt":"Realistic product photo: a beautiful illustrated dog adventure journal with map and park sticker pages, cream and green, white background"},
]

# ── 8 Canonical Play Services ─────────────────────────────────
PLAY_SERVICES = [
    {"id":"PL-SVC-001","name":"Pet Parks Discovery","pillar":"play","category":"enjoy","sub_pillar":"enjoy","icon":"🌳","tagline":"Find the best dog parks near you","description":"We find and curate the best off-lead parks, trails, and pet-friendly spaces near you — matched to your dog's energy.","accent_colour":"#2D6A4F","is_bookable":True,"is_active":True,"base_price":0,"watercolour_prompt":"Watercolour: a joyful dog running free in a sunlit park, green grass, warm sunlight, 16:9"},
    {"id":"PL-SVC-002","name":"Playdate Coordination","pillar":"play","category":"enjoy","sub_pillar":"enjoy","icon":"🐾","tagline":"We find your dog's perfect playmate","description":"Breed-matched or energy-matched playdates — we handle introductions, venue selection, and scheduling.","accent_colour":"#52B788","is_bookable":True,"is_active":True,"base_price":300,"watercolour_prompt":"Watercolour: two dogs playing joyfully in a park, warm afternoon light, 16:9"},
    {"id":"PL-SVC-003","name":"Pet Events & Experiences","pillar":"play","category":"enjoy","sub_pillar":"enjoy","icon":"🎪","tagline":"Festivals, shows, and dog-friendly events","description":"We curate and book the best pet events — dog shows, pet festivals, breed meetups, and dog-friendly experiences.","accent_colour":"#E76F51","is_bookable":True,"is_active":True,"base_price":500,"watercolour_prompt":"Watercolour: a happy crowd of dogs and owners at a pet festival, colourful bunting, 16:9"},
    {"id":"PL-SVC-004","name":"Weekend Adventure Planning","pillar":"play","category":"enjoy","sub_pillar":"enjoy","icon":"🗺️","tagline":"Mira plans the perfect weekend outing","description":"From beach days to forest hikes — we plan the full adventure: route, stops, kit, and pet-friendly venues en route.","accent_colour":"#C9973A","is_bookable":True,"is_active":True,"base_price":400,"watercolour_prompt":"Watercolour: a family and dog on a weekend adventure, golden afternoon light, 16:9"},
    {"id":"PL-SVC-005","name":"Dog Walking — Daily","pillar":"play","category":"fit","sub_pillar":"fit","icon":"🦮","tagline":"Professional daily walks, every morning","description":"A trusted, vetted dog walker for your morning routine. We match walkers to your dog's breed and energy level.","accent_colour":"#1B4332","is_bookable":True,"is_active":True,"base_price":300,"watercolour_prompt":"Watercolour: a professional dog walker and happy dog on a sunny morning walk, green park, 16:9"},
    {"id":"PL-SVC-006","name":"Fitness Assessment & Programme","pillar":"play","category":"fit","sub_pillar":"fit","icon":"💪","tagline":"Mira builds a personalised fitness plan","description":"Complete fitness assessment followed by a personalised 4-week exercise programme — walking, agility, swimming, or gym routines.","accent_colour":"#2D6A4F","is_bookable":True,"is_active":True,"base_price":999,"watercolour_prompt":"Watercolour: a professional assessing a dog's fitness with gentle movement in a bright garden, 16:9"},
    {"id":"PL-SVC-007","name":"Swimming Sessions","pillar":"play","category":"fit","sub_pillar":"fit","icon":"🏊","tagline":"Hydrotherapy + fun swims, fully supervised","description":"From first-time paddlers to confident swimmers — we book and coordinate swimming sessions and hydrotherapy programmes.","accent_colour":"#1565C0","is_bookable":True,"is_active":True,"base_price":1000,"watercolour_prompt":"Watercolour: a happy dog swimming in a pool, splashing water, joyful energy, 16:9"},
    {"id":"PL-SVC-008","name":"Socialisation Planning","pillar":"play","category":"enjoy","sub_pillar":"enjoy","icon":"🌱","tagline":"Build confidence and make dog friends","description":"Structured socialisation plan for anxious, reactive, or undersocialised dogs — expert-guided introduction and confidence building.","accent_colour":"#9B59B6","is_bookable":True,"is_active":True,"base_price":800,"watercolour_prompt":"Watercolour: a puppy meeting other dogs in a structured socialisation class, warm green tones, 16:9"},
]

print("=== Seeding Play Products ===")
p_added = 0
for p in PLAY_PRODUCTS:
    if not db.products_master.find_one({"id": p["id"]}):
        db.products_master.insert_one(p)
        p_added += 1
        print(f"  ADD: {p['id']} — {p['name']}")
    else:
        print(f"  SKIP: {p['id']}")
print(f"\nProducts: {p_added} added")

print("\n=== Seeding Play Services ===")
s_added = 0
for s in PLAY_SERVICES:
    if not db.services_master.find_one({"id": s["id"]}):
        db.services_master.insert_one(s)
        s_added += 1
        print(f"  ADD: {s['id']} — {s['name']}")
    else:
        print(f"  SKIP: {s['id']}")
print(f"\nServices: {s_added} added")

print("\n=== Tagging Soul Play products ===")
r1 = db.products_master.update_many(
    {"category": "breed-play_bandanas"},
    {"$set": {"pillar": "play", "dimension": "Soul Play Products", "sub_category": "soul", "price": 399}}
)
r2 = db.products_master.update_many(
    {"category": "breed-playdate_cards"},
    {"$set": {"pillar": "play", "dimension": "Soul Play Products", "sub_category": "soul", "price": 299}}
)
print(f"  breed-play_bandanas: {r1.modified_count} updated")
print(f"  breed-playdate_cards: {r2.modified_count} updated")

print(f"\nTotal play products: {db.products_master.count_documents({'pillar':'play'})}")
print(f"Total play services: {db.services_master.count_documents({'pillar':'play'})}")
