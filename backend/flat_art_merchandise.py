"""
flat_art_merchandise.py
=======================
Cloudinary overlay-based flat art merchandise generator.

Zero AI calls. Zero generation time. Zero ongoing cost.
Zero manual template uploads needed.

HOW IT WORKS:
  1. For each breed × product type, find the EXISTING watercolour soul product
     (e.g. Indie bandana, Indie mug, Indie tote_bag — already in breed_products with Cloudinary URLs)
  2. Use that watercolour product image as the BASE
  3. Overlay the Yappy flat cake illustration on top (centred)
  4. Result = flat art version using same product mockup, same background,
     same product shape — but with the flat Yappy face instead of watercolour

This means:
- No blank templates needed (we use existing product images)
- Each breed's flat art uses THAT breed's own product photography
- Perfectly consistent across all product types
- Customer sees two side-by-side: watercolour version vs flat art version
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

CLOUD_NAME = "duoapcx1p"

# ── flat art type → existing watercolour product_type ──────────────────────
WATERCOLOUR_TYPE_MAP = {
    "flat_bandana":    ["bandana", "Designer Bandana", "Breed Adventure Bandana"],
    "flat_mug":        ["mug", "Ceramic Mug"],
    "flat_tote":       ["tote_bag"],
    "flat_cushion":    ["cushion_cover"],
    "flat_phone_case": ["Phone Case", "phone_cases"],
    "flat_tshirt":     ["pet_robe"],
    "flat_notebook":   ["pet_journal", "milestone_book"],
    "flat_keyring":    ["keychain", "Breed Keychain"],
}

# ── Prices ──────────────────────────────────────────────────────────────────
FLAT_ART_PRICES = {
    "flat_bandana":    349,
    "flat_mug":        599,
    "flat_tote":       799,
    "flat_cushion":    1299,
    "flat_phone_case": 499,
    "flat_tshirt":     899,
    "flat_notebook":   449,
    "flat_keyring":    249,
}

# ── Pillar + sub_category mapping ───────────────────────────────────────────
FLAT_ART_PILLAR_MAP = {
    "flat_bandana":    {"pillar": "shop",      "sub_category": "accessories"},
    "flat_mug":        {"pillar": "shop",      "sub_category": "home_lifestyle"},
    "flat_tote":       {"pillar": "shop",      "sub_category": "accessories"},
    "flat_cushion":    {"pillar": "care",      "sub_category": "home_comfort"},
    "flat_phone_case": {"pillar": "shop",      "sub_category": "accessories"},
    "flat_tshirt":     {"pillar": "shop",      "sub_category": "apparel"},
    "flat_notebook":   {"pillar": "learn",     "sub_category": "milestone_tracking"},
    "flat_keyring":    {"pillar": "celebrate", "sub_category": "birthday_accessories"},
}

PRODUCT_DISPLAY_NAMES = {
    "flat_bandana":    "Bandana — Flat Art",
    "flat_mug":        "Mug — Flat Art",
    "flat_tote":       "Tote Bag — Flat Art",
    "flat_cushion":    "Cushion — Flat Art",
    "flat_phone_case": "Phone Case — Flat Art",
    "flat_tshirt":     "T-Shirt — Flat Art",
    "flat_notebook":   "Notebook — Flat Art",
    "flat_keyring":    "Keyring — Flat Art",
}

# ── Overlay size per product (how big the face should be on the product) ────
OVERLAY_CONFIG = {
    "flat_bandana":    "w_220,h_220,g_center,c_fit",
    "flat_mug":        "w_200,h_200,g_center,c_fit",
    "flat_tote":       "w_240,h_240,g_north,c_fit,y_60",
    "flat_cushion":    "w_260,h_260,g_center,c_fit",
    "flat_phone_case": "w_180,h_180,g_center,c_fit",
    "flat_tshirt":     "w_200,h_200,g_north,c_fit,y_80",
    "flat_notebook":   "w_200,h_200,g_north,c_fit,y_40",
    "flat_keyring":    "w_140,h_140,g_center,c_fit",
}


def get_pub_id(url: str) -> str:
    """Extract clean public_id from a Cloudinary URL."""
    if "/upload/" not in url:
        return ""
    pub_id = url.split("/upload/")[-1]
    # Remove version prefix
    if pub_id.startswith("v") and "/" in pub_id:
        pub_id = pub_id.split("/", 1)[-1]
    # Remove extension
    for ext in [".webp", ".jpg", ".jpeg", ".png"]:
        if pub_id.endswith(ext):
            pub_id = pub_id[:-len(ext)]
    return pub_id


def build_overlay_url(face_pub_id: str, product_pub_id: str, flat_type: str) -> str:
    """
    Overlay the Yappy flat face onto the watercolour product image.
    Uses Cloudinary layer syntax with e_bgremoval to strip the white
    background from the illustration before compositing.

    Layer syntax:
      l_{face}/e_bgremoval/fl_layer_apply,w_X,h_X,g_center/{base_product}
    """
    face_overlay = face_pub_id.replace("/", ":")
    cfg          = OVERLAY_CONFIG.get(flat_type, "w_220,h_220,g_center,c_fit")

    return (
        f"https://res.cloudinary.com/{CLOUD_NAME}/image/upload/"
        f"l_{face_overlay}/"          # open layer
        f"e_bgremoval/"               # AI background removal (removes white square)
        f"fl_layer_apply,{cfg}/"      # close layer + position
        f"{product_pub_id}"           # base product image
    )


async def get_watercolour_pub_id(db, breed: str, flat_type: str) -> str | None:
    """Find the existing watercolour product for this breed + type, return its public_id."""
    candidate_types = WATERCOLOUR_TYPE_MAP.get(flat_type, [])
    for pt in candidate_types:
        doc = await db.breed_products.find_one(
            {
                "breed": breed,
                "product_type": pt,
                "mockup_url": {"$exists": True, "$ne": None},
            },
            {"_id": 0, "mockup_url": 1, "cloudinary_url": 1}
        )
        if doc:
            url = doc.get("cloudinary_url") or doc.get("mockup_url", "")
            if url:
                return get_pub_id(url)
    return None


async def generate_flat_art_merchandise(db, dry_run: bool = False) -> dict:
    """
    Main generation function.
    For each birthday_cake illustration × each product type:
      - Find the matching watercolour product for that breed
      - Build the Cloudinary overlay URL
      - Insert a new breed_product record
    """
    # Fetch all existing cake illustrations (the Yappy faces)
    illustrations = await db.breed_products.find(
        {"product_type": "birthday_cake", "mockup_url": {"$exists": True, "$ne": None}},
        {
            "_id": 0, "id": 1, "breed": 1, "colour_label": 1,
            "cloudinary_url": 1, "mockup_url": 1, "breed_display": 1,
        }
    ).to_list(500)

    if not illustrations:
        return {"error": "No birthday_cake illustrations found. Run breed cake generation first."}

    inserted = 0
    skipped  = 0
    no_template = 0
    errors   = []

    for illus in illustrations:
        breed         = illus.get("breed", "")
        breed_display = illus.get("breed_display") or breed.replace("_", " ").title()
        colour_label  = illus.get("colour_label", "Natural")
        illus_url     = illus.get("cloudinary_url") or illus.get("mockup_url", "")

        if not illus_url:
            continue

        face_pub_id = get_pub_id(illus_url)
        if not face_pub_id:
            continue

        for flat_type in WATERCOLOUR_TYPE_MAP.keys():
            safe_label   = colour_label.lower().replace(" & ","_").replace(" ","_").replace("/","_")
            product_id   = f"flat-{breed}-{flat_type.replace('flat_','')}-{safe_label}"
            display_name = f"{breed_display} {PRODUCT_DISPLAY_NAMES[flat_type]} — {colour_label}"

            # Skip if already exists
            existing = await db.breed_products.find_one({"id": product_id}, {"_id": 0, "id": 1})
            if existing:
                skipped += 1
                continue

            # Get the watercolour product template (same breed, matching type)
            product_pub_id = await get_watercolour_pub_id(db, breed, flat_type)
            if not product_pub_id:
                no_template += 1
                continue

            overlay_url = build_overlay_url(face_pub_id, product_pub_id, flat_type)
            pillar_info = FLAT_ART_PILLAR_MAP[flat_type]

            doc = {
                "id":                   product_id,
                "breed":                breed,
                "breed_display":        breed_display,
                "name":                 display_name,
                "product_type":         flat_type,
                "colour_label":         colour_label,
                "price":                FLAT_ART_PRICES[flat_type],
                "description":          f"Flat Yappy-style art on {PRODUCT_DISPLAY_NAMES[flat_type].replace(' — Flat Art','')} — {breed_display}, {colour_label} variant.",
                "mockup_url":           overlay_url,
                "cloudinary_url":       overlay_url,
                "image_url":            overlay_url,
                "source_face_id":       face_pub_id,
                "source_product_id":    product_pub_id,
                "pillar":               pillar_info["pillar"],
                "pillars":              [pillar_info["pillar"], "shop"],
                "sub_category":         pillar_info["sub_category"],
                "art_style":            "flat",
                "is_mockup":            True,
                "is_active":            True,
                "created_at":           datetime.utcnow().isoformat(),
            }

            if not dry_run:
                try:
                    await db.breed_products.insert_one(doc)
                    inserted += 1
                except Exception as e:
                    errors.append(f"{product_id}: {e}")
            else:
                if inserted < 3:
                    print(f"\n  DRY RUN: {display_name}")
                    print(f"    Face:    {face_pub_id[:65]}")
                    print(f"    Product: {product_pub_id[:65]}")
                    print(f"    URL:     {overlay_url[:100]}...")
                inserted += 1

    return {
        "inserted":           inserted,
        "skipped":            skipped,
        "no_template_found":  no_template,
        "errors":             errors[:10],
        "total_illustrations": len(illustrations),
        "total_product_types": len(WATERCOLOUR_TYPE_MAP),
    }


if __name__ == "__main__":
    import sys
    dry = "--dry-run" in sys.argv

    async def main():
        client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        db = client[os.environ.get("DB_NAME", "pet-os-live-test_database")]
        print(f"{'DRY RUN — ' if dry else ''}Generating flat art merchandise (Cloudinary overlay)...")
        result = await generate_flat_art_merchandise(db, dry_run=dry)
        print(f"\nResult:")
        for k, v in result.items():
            print(f"  {k}: {v}")

    asyncio.run(main())
