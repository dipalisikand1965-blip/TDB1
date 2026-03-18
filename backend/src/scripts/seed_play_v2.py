#!/usr/bin/env python3
"""
seed_play_v2.py — Seeds the /play pillar database from TDC_Play_v2.xlsx
Products: 25 new items from "NEW Products to Add" sheet
Services: Best 8 from "Enjoy Services (28→8)" and "Fit Services (78→8)"
Guided Paths: 6 from "Guided Play Paths (6)"
"""
import os, sys, re
sys.path.insert(0, "/app/backend/src")

import openpyxl
from pymongo import MongoClient
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME   = os.environ.get("DB_NAME", "doggy_company")

client = MongoClient(MONGO_URL)
db     = client[DB_NAME]

# ─── helpers ────────────────────────────────────────────────────────────────
def now_utc():
    return datetime.now(timezone.utc)

def money(val):
    if val is None: return 999
    try: return int(float(str(val).replace(",","").replace("₹","")))
    except: return 999

def wb_rows(ws, expect_col):
    """Find header row and return (headers, data_rows)."""
    rows = list(ws.rows)
    for i, row in enumerate(rows[:5]):
        vals = [c.value for c in row]
        if expect_col in vals:
            headers = vals
            return headers, rows[i+1:]
    return None, []

# ─── 1. NEW PRODUCTS ─────────────────────────────────────────────────────────
wb = openpyxl.load_workbook("/app/TDC_Play_v2.xlsx", read_only=True)
ws = wb["NEW Products to Add"]
headers, data_rows = wb_rows(ws, "Product ID")
inserted = 0
updated  = 0

if headers:
    for row in data_rows:
        vals = dict(zip(headers, [c.value for c in row]))
        name = vals.get("Name")
        if not name or not str(name).strip():
            continue
        name        = str(name).strip()
        prod_id     = str(vals.get("Product ID") or "").strip()
        dimension   = str(vals.get("Dimension") or "Play Essentials").strip()
        sub_cat     = str(vals.get("Sub-Category (sub_category)") or "outings").strip().lower()
        desc        = str(vals.get("Description") or "").strip()
        price       = money(vals.get("Price (₹)"))
        mira_pick   = str(vals.get("Mira Pick?") or "").strip().lower() == "yes"
        size_tags   = str(vals.get("Size Tags") or "All").strip()
        img_prompt  = str(vals.get("AI Image Prompt") or "").strip()

        doc = {
            "name":          name,
            "pillar":        "play",
            "category":      sub_cat,   # category = sub_category (dim bucket)
            "sub_category":  sub_cat,
            "dimension":     dimension,
            "description":   desc,
            "price":         price,
            "currency":      "INR",
            "size_tags":     [s.strip() for s in size_tags.split("/")],
            "mira_pick":     mira_pick,
            "image_prompt":  img_prompt,
            "product_id":    prod_id,
            "image_url":     None,
            "active":        True,
            "created_at":    now_utc().isoformat(),
            "updated_at":    now_utc().isoformat(),
        }

        existing = db.products_master.find_one({"name": name, "pillar": "play"})
        if existing:
            db.products_master.update_one({"_id": existing["_id"]}, {"$set": doc})
            updated += 1
        else:
            db.products_master.insert_one(doc)
            inserted += 1

print(f"[Products] Inserted: {inserted}, Updated: {updated}")

# ─── 2. FIX EXISTING SUB_CATEGORY = NULL (toys→outings, etc.) ────────────────
dim_map = {
    "outings":   "outings",  "playdates": "playdates", "walking":   "walking",
    "fitness":   "fitness",  "swimming":  "swimming",  "soul":      "soul",
    "enjoy":     "outings",  "fit":       "fitness",
    "toys":      "outings",  "accessories": "outings", "gear":      "outings",
    "dognuts":   "outings",  "cakes":     "outings",   "plush":     "outings",
}

# Ensure every play product has a proper sub_category that maps to a dim
play_products = list(db.products_master.find({"pillar": "play"}))
fixed = 0
for p in play_products:
    cat = (p.get("category") or "").lower().strip()
    sub = (p.get("sub_category") or "").lower().strip()
    # Determine correct sub_category
    new_sub = None
    if sub in dim_map:
        new_sub = dim_map[sub]
    elif cat in dim_map:
        new_sub = dim_map[cat]
    elif cat.startswith("breed-play_bandana") or cat.startswith("breed-playdate"):
        new_sub = "soul"
    else:
        new_sub = "outings"

    if new_sub and new_sub != sub:
        db.products_master.update_one(
            {"_id": p["_id"]},
            {"$set": {"sub_category": new_sub, "category": new_sub}}
        )
        fixed += 1

print(f"[Fix sub_category] Fixed: {fixed} products")

# ─── 3. SERVICES ─────────────────────────────────────────────────────────────
ENJOY_SERVICES = [
    {"name":"Dog Park Outing (Private)",     "category":"outings",   "sub_category":"outings",
     "description":"Private dog park session with a Mira-matched play companion for socialisation and exercise.",
     "price":599,  "duration_minutes":60, "dimension":"Enjoy"},
    {"name":"Playdate Facilitation",          "category":"playdates", "sub_category":"playdates",
     "description":"Mira finds a matched play partner dog and arranges the date — location, intro, and supervision.",
     "price":799,  "duration_minutes":90, "dimension":"Enjoy"},
    {"name":"Outdoor Adventure Walk",         "category":"walking",   "sub_category":"walking",
     "description":"Guided adventure walk through parks, trails, or open green spaces — off-lead where safe.",
     "price":499,  "duration_minutes":60, "dimension":"Enjoy"},
    {"name":"Pool Party Swim Session",        "category":"swimming",  "sub_category":"swimming",
     "description":"Private pool session with a trained swim guide. Builds confidence, cools down, and burns energy.",
     "price":999,  "duration_minutes":60, "dimension":"Fit"},
    {"name":"Agility Starter Session",        "category":"fitness",   "sub_category":"fitness",
     "description":"Intro agility session — tunnels, jumps, weave poles. Fun and tiring for high-energy dogs.",
     "price":899,  "duration_minutes":60, "dimension":"Fit"},
    {"name":"Canine Fitness Assessment",      "category":"fitness",   "sub_category":"fitness",
     "description":"A certified canine fitness trainer assesses your dog's strength, flexibility, and energy profile.",
     "price":1299, "duration_minutes":60, "dimension":"Fit"},
    {"name":"Trail Hike & Nature Walk",       "category":"outings",   "sub_category":"outings",
     "description":"Guided nature trail hike — ideal for dogs that love to sniff, explore, and cover distance.",
     "price":699,  "duration_minutes":120,"dimension":"Enjoy"},
    {"name":"Soul Play Photo Session",        "category":"soul",      "sub_category":"soul",
     "description":"A professional pet photographer captures your dog at their most playful. Curated Mira prints included.",
     "price":2499, "duration_minutes":90, "dimension":"Soul"},
]

svc_inserted = 0
svc_updated  = 0
for svc in ENJOY_SERVICES:
    base = {
        "pillar":             "play",
        "active":             True,
        "currency":           "INR",
        "created_at":         now_utc().isoformat(),
        "updated_at":         now_utc().isoformat(),
        "image_url":          None,
        "service_type":       "play",
        "booking_type":       "concierge",
        "available":          True,
    }
    doc = {**base, **svc}
    existing = db.services.find_one({"name": svc["name"], "pillar": "play"})
    if existing:
        db.services.update_one({"_id": existing["_id"]}, {"$set": doc})
        svc_updated += 1
    else:
        db.services.insert_one(doc)
        svc_inserted += 1

print(f"[Services] Inserted: {svc_inserted}, Updated: {svc_updated}")

# ─── 4. GUIDED PLAY PATHS ────────────────────────────────────────────────────
GUIDED_PATHS = [
    {"path_id":"PP-01","title":"The Park Routine","subtitle":"Daily outdoor play habit for any dog",
     "icon":"🌳","pillar":"play","energy_level":"any",
     "steps":[
       {"step":1,"title":"Choose your park","description":"Find a safe, enclosed dog-friendly park near you with Mira's help."},
       {"step":2,"title":"Pack the essentials","description":"Water bottle, collapsible bowl, treat pouch, poop bags — all in one bag."},
       {"step":3,"title":"Set the routine","description":"Same time, same park, same signal. Consistency builds confidence in your dog."},
       {"step":4,"title":"Track progress with Mira","description":"Mira monitors activity level and adjusts product and session recommendations."},
     ]},
    {"path_id":"PP-02","title":"Playdate Starter","subtitle":"First playdate: from nervous to social",
     "icon":"🐾","pillar":"play","energy_level":"any",
     "steps":[
       {"step":1,"title":"Build a play profile","description":"Mira matches your dog's size, energy, and temperament to a compatible play partner."},
       {"step":2,"title":"Neutral ground first","description":"First meeting at a neutral park, both dogs on leads initially."},
       {"step":3,"title":"Off-lead intro","description":"Short off-lead session with our facilitator present. Mira tracks all interactions."},
       {"step":4,"title":"Book the next one","description":"Regulars build stronger social bonds. Mira auto-suggests the next date."},
     ]},
    {"path_id":"PP-03","title":"Swim Confidence","subtitle":"From splash-shy to water dog in 4 sessions",
     "icon":"🏊","pillar":"play","energy_level":"any",
     "steps":[
       {"step":1,"title":"Water introduction","description":"Shallow paddling area, no pressure. Let your dog lead."},
       {"step":2,"title":"First guided swim","description":"Swim guide enters the pool with your dog. Gentle encouragement and floatation if needed."},
       {"step":3,"title":"Building distance","description":"Gradual increase in lap distance. Strength and confidence develop together."},
       {"step":4,"title":"Pool independence","description":"Your dog swims freely with minimal support. Cool-down and post-swim care routine."},
     ]},
    {"path_id":"PP-04","title":"Agility Fast-Track","subtitle":"From zero to first course in 30 days",
     "icon":"⚡","pillar":"play","energy_level":"high",
     "steps":[
       {"step":1,"title":"Agility assessment","description":"Trainer evaluates your dog's readiness — coordination, focus, and energy output."},
       {"step":2,"title":"Tunnel + jump intro","description":"First equipment introduced slowly. Reward-based learning only."},
       {"step":3,"title":"Course practice","description":"String equipment together. 5 obstacles → 10. Full course in week 3."},
       {"step":4,"title":"First demo run","description":"Timed fun run. Mira sends you a performance snapshot and next-level recommendations."},
     ]},
    {"path_id":"PP-05","title":"Fitness Reboot","subtitle":"Post-illness or low-activity recovery plan",
     "icon":"💪","pillar":"play","energy_level":"low",
     "steps":[
       {"step":1,"title":"Fitness baseline","description":"Certified trainer assesses strength, flexibility, and any movement limitations."},
       {"step":2,"title":"Gentle movement plan","description":"Low-impact walks, balance disc, gentle tug — all tailored to your dog's current ability."},
       {"step":3,"title":"Progressive loading","description":"Add distance and intensity week by week. Mira tracks progress and flags overexertion."},
       {"step":4,"title":"Full active life","description":"Your dog is back. Mira recommends the next pillar: parks, trails, swim sessions."},
     ]},
    {"path_id":"PP-06","title":"Soul Play Journey","subtitle":"Play as bonding, expression, and identity",
     "icon":"🌟","pillar":"play","energy_level":"any",
     "steps":[
       {"step":1,"title":"Discover play style","description":"Mira analyses how your dog plays — fetch-obsessed, social butterfly, or lone explorer."},
       {"step":2,"title":"Personalise the kit","description":"Bandana, playdate cards, and identity products that reflect who your dog is."},
       {"step":3,"title":"Capture the moment","description":"Book a Soul Play Photo Session and get professional prints of your dog's personality."},
       {"step":4,"title":"Build the community","description":"Connect with other Mira dogs who share the same play personality. Monthly group outings arranged."},
     ]},
]

gp_inserted = 0
gp_updated  = 0
for path in GUIDED_PATHS:
    existing = db.guided_paths.find_one({"path_id": path["path_id"]})
    if existing:
        db.guided_paths.update_one({"_id": existing["_id"]}, {"$set": path})
        gp_updated += 1
    else:
        db.guided_paths.insert_one(path)
        gp_inserted += 1

print(f"[Guided Paths] Inserted: {gp_inserted}, Updated: {gp_updated}")

# ─── 5. Summary ───────────────────────────────────────────────────────────────
total_play = db.products_master.count_documents({"pillar": "play"})
total_svcs = db.services.count_documents({"pillar": "play"})
total_paths= db.guided_paths.count_documents({"pillar": "play"})

print("\n=== PLAY PILLAR DB SUMMARY ===")
print(f"  Total play products: {total_play}")
print(f"  Total play services: {total_svcs}")
print(f"  Total guided paths:  {total_paths}")

# Sub-category breakdown
from collections import Counter
prods = list(db.products_master.find({"pillar": "play"}, {"sub_category":1}))
cats = Counter(p.get("sub_category","?") for p in prods)
print("\n  Sub-category breakdown:")
for k, v in sorted(cats.items(), key=lambda x:-x[1]):
    print(f"    {k}: {v}")

print("\n=== DONE ===")
client.close()
