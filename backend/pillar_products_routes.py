"""
Pillar Products Routes - Unified admin API for ALL pillar product management
All products are stored in products_master with a 'pillar' field
This is the single source of truth for all pillars

ARCHITECTURE RULES: See /app/memory/ARCHITECTURE.md
- NEVER create pillar-specific product collections
- ALWAYS set locally_edited=True when admin edits a product
- This endpoint is used by ALL 13 pillar admin pages via PillarProductsTab.jsx
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone
import uuid
import logging

# ── All known breed names for strict product filtering ──────────────────────
KNOWN_BREED_NAMES = sorted([
    "labrador", "golden retriever", "german shepherd", "indie", "indian pariah",
    "beagle", "poodle", "bulldog", "english bulldog", "french bulldog",
    "rottweiler", "boxer", "husky", "siberian husky", "doberman",
    "pomeranian", "shih tzu", "maltese", "chihuahua", "yorkshire terrier",
    "yorkshire", "pug", "cocker spaniel", "dachshund", "lhasa apso",
    "cavalier king charles", "cavalier", "border collie", "schnauzer",
    "great dane", "saint bernard", "st bernard", "samoyed", "akita",
    "australian shepherd", "bernese mountain", "boston terrier",
    "havanese", "scottish terrier", "vizsla", "weimaraner",
    "dalmatian", "shetland sheepdog", "sheltie", "bichon frise",
    "chow chow", "basenji", "whippet", "greyhound", "jack russell",
    "west highland terrier", "westie",
    # Additional breeds REQUIRED for product name detection
    "corgi", "pembroke corgi", "cardigan corgi",
    "spitz", "indian spitz", "german spitz",
    "irish setter", "english setter", "gordon setter",
    "irish terrier", "irish wolfhound",
    "basset hound", "bloodhound",
    "tibetan mastiff", "bull mastiff", "english mastiff",
    "staffordshire bull terrier", "bull terrier", "pit bull",
    "flat coated retriever", "nova scotia duck tolling retriever",
    "coton de tulear", "rhodesian ridgeback",
    "leonberger", "newfoundland",
], key=len, reverse=True)  # Longest first so "golden retriever" beats "retriever"


def _detect_product_breed(name: str) -> Optional[str]:
    """Return the known breed found in this product name, or None."""
    nl = (name or "").lower()
    for b in KNOWN_BREED_NAMES:
        if b in nl:
            return b
    return None


def _should_show_for_breed(product: dict, req_breed: str) -> bool:
    """
    STRICT BREED FILTER — single rule, applied everywhere.
    NAME TAKES PRIORITY OVER ALL TAGS (including all_breeds).
    If a product name contains a known breed → it is ONLY for that breed. Period.
    No amount of 'all_breeds' tagging overrides the name.
    """
    if not req_breed:
        return True

    req = req_breed.lower().strip().replace("_", " ")
    name_lower = (product.get("name") or "").lower()
    ptype = (product.get("product_type") or "").lower()
    soul  = (product.get("soul_tier")    or "").lower()

    # ── 1. NAME CHECK FIRST — overrides ALL breed_tags ────────────────────────
    # "Bernese Mountain Dog Bandana" tagged all_breeds? → still Bernese-only.
    detected_in_name = _detect_product_breed(name_lower)
    if detected_in_name:
        return req in detected_in_name or detected_in_name in req

    # ── 2. Explicit breed_pick / soul_made (edge case: breed not in name) ─────
    if ptype in ("breed_pick", "soul_made") or soul == "soul_made":
        return req in name_lower

    # ── 3. breed_tags present ────────────────────────────────────────────────
    tags = product.get("breed_tags") or []
    if tags:
        # Universal?
        if all((t or "").lower().replace("_", " ") in ("all breeds", "all", "all_breeds", "") for t in tags):
            return True  # genuinely universal (name check passed above)
        # Any tag is a known breed → strict match
        for t in tags:
            t_norm = (t or "").lower().replace("_", " ")
            if any(b == t_norm or b in t_norm or t_norm in b for b in KNOWN_BREED_NAMES):
                return req in t_norm or t_norm in req
        return True  # tags present but no known breed → universal

    # ── 4. No breed signal → universal ──────────────────────────────────────
    return True

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/pillar-products", tags=["Pillar Products Admin"])

_db = None

def set_db(database):
    global _db
    _db = database

def get_db():
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db


@router.get("")
async def get_pillar_products(
    pillar: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    category: Optional[str] = None,
    active_only: bool = False,
    sort_by: str = "name",  # "name" | "mira_score" | "price"
    breed: Optional[str] = None,
):
    """
    Get products for a specific pillar from products_master.
    pillar=None returns ALL products (for "Everything" tab).
    """
    db = get_db()
    try:
        # Pillar filter — if None/empty, return all
        if pillar:
            pillar_condition = {"$or": [{"pillar": pillar}, {"pillars": pillar}]}
        else:
            pillar_condition = {}  # All products

        # Build conditions
        conditions = [
            {"Bookable": {"$exists": False}},
            {"bookable": {"$exists": False}},
            {"id": {"$not": {"$regex": "^svc-", "$options": "i"}}},
        ]
        if pillar:
            conditions.append(pillar_condition)
        if active_only:
            conditions.append({"$or": [{"active": True}, {"is_active": True}]})
        if search:
            conditions.append({"$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
            ]})
        if category:
            conditions.append({"category": category})
        # NOTE: breed filter is applied post-fetch in Python (see _should_show_for_breed)
        # Do NOT add a MongoDB $or for breed here — it incorrectly includes wrong-breed products

        query = {"$and": conditions} if conditions else {}

        # Fetch more if breed filter is active (post-filter will reduce count)
        fetch_limit = min(limit * 4, 400) if breed else limit
        total_query = await db.products_master.count_documents(query)
        skip = (page - 1) * limit

        # Sort options
        sort_map = {
            "mira_score": [("mira_score", -1), ("name", 1)],
            "price":      [("price", 1), ("name", 1)],
            "name":       [("name", 1)],
        }
        sort_order = sort_map.get(sort_by, [("name", 1)])

        cursor = db.products_master.find(query, {"_id": 0}).sort(sort_order).skip(skip).limit(fetch_limit)
        raw_products = await cursor.to_list(length=fetch_limit)

        # ── STRICT BREED FILTER (Python level) ──────────────────────────────
        if breed:
            products = [p for p in raw_products if _should_show_for_breed(p, breed)]
        else:
            products = raw_products
        # Trim to requested limit after breed filter
        products = products[:limit]
        total = len(products)  # approximate after breed filter

        # Get unique categories for filter
        cat_pipeline = [
            {"$match": pillar_condition},
            {"$group": {"_id": "$category"}},
            {"$sort": {"_id": 1}}
        ]
        cat_cursor = db.products_master.aggregate(cat_pipeline)
        cat_docs = await cat_cursor.to_list(length=100)
        categories = [c["_id"] for c in cat_docs if c["_id"]]

        return {
            "products": products,
            "total": total_query,
            "page": page,
            "limit": limit,
            "pages": max(1, -(-total_query // limit)),
            "pillar": pillar,
            "categories": categories
        }
    except Exception as e:
        logger.error(f"Error fetching pillar products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_pillar_product(product: dict):
    """Create a new product in products_master for a specific pillar"""
    db = get_db()
    try:
        pillar = product.get("pillar")
        if not pillar:
            raise HTTPException(status_code=400, detail="pillar is required")

        product_id = product.get("id") or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        doc = {
            "id": product_id,
            "pillar": pillar,
            "name": product.get("name", ""),
            "description": product.get("description", ""),
            "category": product.get("category", ""),
            "sub_category": product.get("sub_category", ""),
            "price": float(product.get("price", 0)),
            "compare_price": float(product.get("compare_price", 0)),
            "image_url": product.get("image_url", ""),
            "active": product.get("active", True),
            "is_active": product.get("active", True),
            "source": "admin",
            "locally_edited": True,
            "locally_edited_at": now,
            "created_at": now,
            "updated_at": now,
        }
        # Include any extra fields
        for k, v in product.items():
            if k not in doc and k != "_id":
                doc[k] = v

        await db.products_master.insert_one(doc)
        doc.pop("_id", None)
        return {"message": "Product created", "product": doc}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{product_id}")
async def update_pillar_product(product_id: str, updates: dict):
    """Update a product in products_master"""
    db = get_db()
    try:
        updates.pop("_id", None)
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        # Mark as admin-edited so Shopify sync doesn't overwrite admin changes
        updates["locally_edited"] = True
        updates["locally_edited_at"] = datetime.now(timezone.utc).isoformat()

        result = await db.products_master.update_one(
            {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
            {"$set": updates}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")

        updated = await db.products_master.find_one(
            {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
            {"_id": 0}
        )
        return {"message": "Product updated", "product": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}")
async def delete_pillar_product(product_id: str):
    """Soft-delete a product (mark inactive)"""
    db = get_db()
    try:
        result = await db.products_master.update_one(
            {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
            {"$set": {"active": False, "is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product deactivated", "product_id": product_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sub-categories")
async def get_sub_categories(pillar: str):
    """Get all sub-categories for a pillar"""
    db = get_db()
    try:
        pipeline = [
            {"$match": {"pillar": pillar}},
            {"$group": {"_id": "$category"}},
            {"$sort": {"_id": 1}}
        ]
        cursor = db.products_master.aggregate(pipeline)
        docs = await cursor.to_list(length=100)
        return {"categories": [d["_id"] for d in docs if d["_id"]]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/seed-dine-catalog")
async def seed_dine_catalog():
    """
    Seed the full Dine product catalog from Dine_ProductCatalogue_SEED.xlsx
    Idempotent — skips products that already exist (matched by SKU/id).
    All products go into products_master with pillar='dine'.
    """
    db = get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        seeded = 0
        skipped = 0

        DINE_CATALOG = [
            # ── Daily Meals ──────────────────────────────────────────────────
            {"id":"DM-001","name":"Salmon & Sweet Potato Morning Bowl","description":"Cold-pressed salmon with sweet potato, spinach, and flaxseed. Designed as a light morning meal that supports joint health and immune function. Especially suitable for dogs on cancer treatment.","category":"Daily Meals","sub_category":"Morning Meal","price":349,"allergy_free":"Soy-free · Chicken-free · Grain-free","mira_tag":"Treatment-safe","shopify_tags":"dine,dine-daily-meals,morning-meal,salmon,soy-free,chicken-free,treatment-safe"},
            {"id":"DM-002","name":"Peanut Butter & Banana Morning Mash","description":"Mashed banana with peanut butter, oats, and coconut oil. Gentle on the stomach. Great for older dogs or dogs with reduced appetite during treatment.","category":"Daily Meals","sub_category":"Morning Meal","price":299,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Safe for Mojo","shopify_tags":"dine,dine-daily-meals,morning-meal,peanut-butter,soy-free,senior-friendly"},
            {"id":"DM-003","name":"Chicken & Rice Morning Bowl","description":"Free-range chicken with white rice, carrots, and peas. The most digestible morning meal for dogs with sensitive stomachs.","category":"Daily Meals","sub_category":"Morning Meal","price":279,"allergy_free":"Soy-free","mira_tag":"Classic morning","shopify_tags":"dine,dine-daily-meals,morning-meal,chicken,rice,soy-free"},
            {"id":"DM-004","name":"Lamb & Quinoa Morning Bowl","description":"Lamb with quinoa, zucchini, and turmeric. Ideal for dogs with multiple food allergies where chicken and soy are both restricted.","category":"Daily Meals","sub_category":"Morning Meal","price":399,"allergy_free":"Soy-free · Chicken-free · Wheat-free","mira_tag":"Hypoallergenic","shopify_tags":"dine,dine-daily-meals,morning-meal,lamb,quinoa,hypoallergenic"},
            {"id":"DM-005","name":"Salmon & Lentil Evening Dinner","description":"Rich salmon with lentils, kale, and chia seeds. High protein supports muscle maintenance during treatment.","category":"Daily Meals","sub_category":"Evening Meal","price":399,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Treatment-safe","shopify_tags":"dine,dine-daily-meals,evening-meal,salmon,lentil,soy-free,treatment-safe"},
            {"id":"DM-006","name":"Lamb & Vegetable Stew","description":"Slow-cooked lamb with sweet potato, green beans, and bone broth. Excellent for recovery days.","category":"Daily Meals","sub_category":"Evening Meal","price":449,"allergy_free":"Soy-free · Chicken-free · Grain-free","mira_tag":"Recovery meal","shopify_tags":"dine,dine-daily-meals,evening-meal,lamb,stew,soy-free,recovery"},
            {"id":"DM-007","name":"Fish & Brown Rice Dinner","description":"White fish with brown rice, pumpkin, and turmeric. Light but satisfying. Suitable for dogs with sensitive digestion.","category":"Daily Meals","sub_category":"Evening Meal","price":379,"allergy_free":"Soy-free · Chicken-free · Dairy-free","mira_tag":"Safe for Mojo","shopify_tags":"dine,dine-daily-meals,evening-meal,fish,rice,soy-free,chicken-free"},
            {"id":"DM-008","name":"Breed-Specific Portion Guide","description":"Printable + digital portion guide showing exactly how much to feed based on breed, weight, age, and activity level.","category":"Daily Meals","sub_category":"Portion Guide","price":0,"allergy_free":"N/A — guide only","mira_tag":"Free from Mira","shopify_tags":"dine,dine-daily-meals,portion-guide,free,digital"},
            {"id":"DM-009","name":"Treatment Nutrition Guide","description":"A comprehensive guide for pet parents whose dogs are on chemotherapy or immunotherapy.","category":"Daily Meals","sub_category":"Portion Guide","price":0,"allergy_free":"N/A — guide only","mira_tag":"For Mojo specifically","shopify_tags":"dine,dine-daily-meals,portion-guide,treatment,cancer,free,digital"},
            {"id":"DM-010","name":"Senior Wellness Meal Pack","description":"A 7-day rotating meal pack designed for dogs over 7. Lower calorie density, higher omega content, softer texture.","category":"Daily Meals","sub_category":"Special Diets","price":1999,"allergy_free":"Soy-free · Chicken-free","mira_tag":"For seniors","shopify_tags":"dine,dine-daily-meals,special-diets,senior,soy-free,7-day,subscription"},
            {"id":"DM-011","name":"Allergy-Safe Rotation Pack","description":"7-day rotation using only novel proteins (lamb, rabbit, fish) with hypoallergenic bases.","category":"Daily Meals","sub_category":"Special Diets","price":2299,"allergy_free":"Soy-free · Chicken-free · Wheat-free · Dairy-free","mira_tag":"Allergy-safe rotation","shopify_tags":"dine,dine-daily-meals,special-diets,allergy-safe,novel-protein"},
            {"id":"DM-012","name":"Post-Treatment Recovery Meals","description":"Soft, easily digestible meals designed for dogs in recovery post-chemo or post-illness.","category":"Daily Meals","sub_category":"Special Diets","price":1799,"allergy_free":"Soy-free · Chicken-free · Grain-free","mira_tag":"Treatment-safe","shopify_tags":"dine,dine-daily-meals,special-diets,recovery,treatment,soft-food,soy-free"},
            {"id":"DM-013","name":"Puppy Growth Meal Pack","description":"Specially formulated meals for puppies under 12 months. Higher protein and calcium for bone development.","category":"Daily Meals","sub_category":"Special Diets","price":1699,"allergy_free":"Soy-free","mira_tag":"Puppy pick","shopify_tags":"dine,dine-daily-meals,special-diets,puppy,growth,dha,soy-free"},
            # ── Treats & Rewards ─────────────────────────────────────────────
            {"id":"TR-001","name":"Salmon Biscuit Box","description":"12 hand-baked salmon biscuits. No soy, no chicken, no artificial preservatives. Made fresh at The Doggy Bakery.","category":"Treats & Rewards","sub_category":"Everyday Treats","price":449,"allergy_free":"Soy-free · Chicken-free · Preservative-free","mira_tag":"Mojo's #1","shopify_tags":"dine,dine-treats,everyday-treats,salmon,soy-free,chicken-free"},
            {"id":"TR-002","name":"Peanut Butter Drops","description":"Soft peanut butter drops, small enough for rapid reward training. No xylitol, no soy.","category":"Treats & Rewards","sub_category":"Everyday Treats","price":349,"allergy_free":"Soy-free · Chicken-free · Xylitol-free","mira_tag":"Safe for Mojo","shopify_tags":"dine,dine-treats,everyday-treats,peanut-butter,soy-free"},
            {"id":"TR-003","name":"Mixed Veggie Chews","description":"Dehydrated carrot, sweet potato, and apple chews. Naturally low calorie. Great for dogs on weight management.","category":"Treats & Rewards","sub_category":"Everyday Treats","price":299,"allergy_free":"Soy-free · Chicken-free · Grain-free","mira_tag":"Light reward","shopify_tags":"dine,dine-treats,everyday-treats,veggie,low-calorie,dental"},
            {"id":"TR-004","name":"Lamb Jerky Strips","description":"Slow-dried lamb jerky strips. Novel protein for dogs with chicken and soy allergies.","category":"Treats & Rewards","sub_category":"Everyday Treats","price":399,"allergy_free":"Soy-free · Chicken-free · Beef-free","mira_tag":"Hypoallergenic","shopify_tags":"dine,dine-treats,everyday-treats,lamb,jerky,hypoallergenic,soy-free"},
            {"id":"TR-005","name":"Salmon Training Bites","description":"Tiny salmon treat bites, 1cm each — small enough for rapid reward training.","category":"Treats & Rewards","sub_category":"Training Rewards","price":299,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Training pick","shopify_tags":"dine,dine-treats,training-rewards,salmon,soy-free,small-bite"},
            {"id":"TR-006","name":"Peanut Butter Training Bites","description":"Soft peanut butter training bites. Breaks in half easily. No soy, no xylitol.","category":"Treats & Rewards","sub_category":"Training Rewards","price":279,"allergy_free":"Soy-free · Chicken-free · Xylitol-free","mira_tag":"Training pick","shopify_tags":"dine,dine-treats,training-rewards,peanut-butter,soy-free,soft"},
            {"id":"TR-007","name":"Freeze-Dried Liver Bites","description":"Freeze-dried beef liver bites. The highest-value training treat — use for breakthrough moments.","category":"Treats & Rewards","sub_category":"Training Rewards","price":349,"allergy_free":"Soy-free · Chicken-free","mira_tag":"High-value reward","shopify_tags":"dine,dine-treats,training-rewards,liver,freeze-dried,high-value"},
            {"id":"TR-008","name":"Birthday Salmon Cake","description":"A full birthday cake for Mojo. Salmon base, sweet potato frosting, bone biscuit decoration.","category":"Treats & Rewards","sub_category":"Birthday Treats","price":899,"allergy_free":"Soy-free · Chicken-free · Preservative-free","mira_tag":"Mojo's birthday cake","shopify_tags":"dine,dine-treats,birthday-treats,birthday-cake,salmon,soy-free,personalised"},
            {"id":"TR-009","name":"Birthday Treat Platter","description":"12 assorted birthday treats: 4 salmon biscuits, 4 peanut butter drops, 4 veggie chews. Presented in a birthday box.","category":"Treats & Rewards","sub_category":"Birthday Treats","price":649,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Birthday platter","shopify_tags":"dine,dine-treats,birthday-treats,platter,mixed,soy-free"},
            {"id":"TR-010","name":"Paw Print Birthday Cupcakes","description":"6 cupcake-sized treats with paw print decoration. Salmon or peanut butter base. Soy-free.","category":"Treats & Rewards","sub_category":"Birthday Treats","price":549,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Pawty ready","shopify_tags":"dine,dine-treats,birthday-treats,cupcakes,pawty,soy-free"},
            {"id":"TR-011","name":"Allergy-Safe Treat Variety Pack","description":"12 mixed treats confirmed free of: soy, chicken, wheat, dairy, corn, beef, artificial colours.","category":"Treats & Rewards","sub_category":"Allergy-Safe","price":499,"allergy_free":"Soy-free · Chicken-free · Wheat-free · Dairy-free · Corn-free","mira_tag":"Multi-allergy safe","shopify_tags":"dine,dine-treats,allergy-safe,variety,lamb,fish,hypoallergenic"},
            {"id":"TR-012","name":"Salmon-Only Biscuits","description":"Single-ingredient salmon biscuits. Nothing added. Recommended for elimination diet phases.","category":"Treats & Rewards","sub_category":"Allergy-Safe","price":379,"allergy_free":"Soy-free · Chicken-free · Grain-free · Single ingredient","mira_tag":"Single ingredient","shopify_tags":"dine,dine-treats,allergy-safe,salmon,single-ingredient,elimination"},
            # ── Supplements ──────────────────────────────────────────────────
            {"id":"SP-001","name":"Canine Immunity Booster","description":"A blend of antioxidants including vitamin C, vitamin E, and selenium. Vet-checked and lymphoma-safe.","category":"Supplements","sub_category":"Immunity & Treatment","price":899,"allergy_free":"Soy-free · Chicken-free · Grain-free","mira_tag":"Treatment-safe","shopify_tags":"dine,dine-supplements,immunity,treatment-safe,lymphoma,antioxidant,soy-free"},
            {"id":"SP-002","name":"Turmeric & Black Pepper Blend","description":"Organic turmeric with black pepper for bioavailability. Natural anti-inflammatory properties.","category":"Supplements","sub_category":"Immunity & Treatment","price":549,"allergy_free":"Soy-free · Chicken-free · All-natural","mira_tag":"Treatment-safe","shopify_tags":"dine,dine-supplements,immunity,turmeric,anti-inflammatory,treatment-safe"},
            {"id":"SP-003","name":"Medicinal Mushroom Complex","description":"A blend of Reishi, Shiitake, Turkey Tail mushrooms. Turkey Tail has specific research in canine lymphoma support.","category":"Supplements","sub_category":"Immunity & Treatment","price":1299,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Lymphoma support","shopify_tags":"dine,dine-supplements,immunity,mushroom,turkey-tail,lymphoma,treatment-safe"},
            {"id":"SP-004","name":"Vitamin B Complex","description":"Comprehensive B vitamin complex to support energy levels and nervous system health during treatment.","category":"Supplements","sub_category":"Immunity & Treatment","price":649,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Treatment-safe","shopify_tags":"dine,dine-supplements,immunity,vitamin-b,treatment-safe,energy"},
            {"id":"SP-005","name":"Glucosamine & Chondroitin","description":"Premium glucosamine sulphate with chondroitin and MSM. Supports cartilage health and joint mobility.","category":"Supplements","sub_category":"Joint & Mobility","price":799,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Joint support","shopify_tags":"dine,dine-supplements,joint,glucosamine,chondroitin,senior,soy-free"},
            {"id":"SP-006","name":"Green-Lipped Mussel Powder","description":"New Zealand green-lipped mussel powder. Natural source of omega-3 fatty acids, glucosamine, and chondroitin.","category":"Supplements","sub_category":"Joint & Mobility","price":999,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Premium joint","shopify_tags":"dine,dine-supplements,joint,green-lipped-mussel,omega-3,senior,premium"},
            {"id":"SP-007","name":"Probiotic Powder — Daily Gut Support","description":"Broad-spectrum probiotic powder with 10 billion CFU per serving. Important for dogs on antibiotics or chemotherapy.","category":"Supplements","sub_category":"Digestion & Gut","price":549,"allergy_free":"Soy-free · Chicken-free · Dairy-free","mira_tag":"Treatment-safe","shopify_tags":"dine,dine-supplements,digestion,probiotic,gut-health,treatment-safe,subscription"},
            {"id":"SP-008","name":"Digestive Enzyme Blend","description":"Blend of digestive enzymes (protease, lipase, amylase) that support optimal nutrient absorption.","category":"Supplements","sub_category":"Digestion & Gut","price":699,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Absorption support","shopify_tags":"dine,dine-supplements,digestion,enzymes,absorption,senior"},
            {"id":"SP-009","name":"Slippery Elm Gut Soother","description":"Slippery elm bark powder. Natural demulcent that soothes and coats the gut lining.","category":"Supplements","sub_category":"Digestion & Gut","price":449,"allergy_free":"Soy-free · Chicken-free · All-natural","mira_tag":"Gut soother","shopify_tags":"dine,dine-supplements,digestion,slippery-elm,gut-soother,treatment,natural"},
            {"id":"SP-010","name":"Salmon Oil — Omega 3 & 6","description":"Cold-pressed wild salmon oil. Rich in omega-3 and omega-6. Supports skin health, coat shine, and anti-inflammatory properties.","category":"Supplements","sub_category":"Skin & Coat","price":699,"allergy_free":"Soy-free · Chicken-free · Pure salmon","mira_tag":"Treatment-safe","shopify_tags":"dine,dine-supplements,skin-coat,salmon-oil,omega,anti-inflammatory,treatment-safe"},
            {"id":"SP-011","name":"Coconut Oil — Skin & Coat","description":"Organic virgin coconut oil. Can be given orally or applied topically. Supports skin and coat health.","category":"Supplements","sub_category":"Skin & Coat","price":449,"allergy_free":"Soy-free · Chicken-free · Organic","mira_tag":"Coat nourishing","shopify_tags":"dine,dine-supplements,skin-coat,coconut-oil,organic,topical"},
            # ── Frozen & Fresh ───────────────────────────────────────────────
            {"id":"FF-001","name":"Cold Pressed Salmon & Vegetable Patty","description":"Cold pressed salmon patties. The cold pressing process retains 3x more nutrients than cooking.","category":"Frozen & Fresh","sub_category":"Cold Pressed","price":549,"allergy_free":"Soy-free · Chicken-free · Preservative-free","mira_tag":"Cold press pick","shopify_tags":"dine,dine-frozen,cold-pressed,salmon,soy-free"},
            {"id":"FF-002","name":"Cold Pressed Lamb & Quinoa Patty","description":"Cold pressed lamb and quinoa. Ideal for multi-allergy dogs. Novel protein reduces allergic response risk.","category":"Frozen & Fresh","sub_category":"Cold Pressed","price":599,"allergy_free":"Soy-free · Chicken-free · Wheat-free","mira_tag":"Hypoallergenic","shopify_tags":"dine,dine-frozen,cold-pressed,lamb,quinoa,hypoallergenic"},
            {"id":"FF-003","name":"Raw Salmon Mince","description":"Raw minced salmon. Suitable for BARF diets. Single protein source.","category":"Frozen & Fresh","sub_category":"Raw","price":499,"allergy_free":"Soy-free · Chicken-free · Single protein","mira_tag":"BARF compatible","shopify_tags":"dine,dine-frozen,raw,salmon,barf,single-protein,soy-free"},
            {"id":"FF-004","name":"Freeze Dried Salmon Nuggets","description":"Freeze dried raw salmon nuggets. All the nutrition of raw with the convenience of dry food.","category":"Frozen & Fresh","sub_category":"Freeze Dried","price":799,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Convenience pick","shopify_tags":"dine,dine-frozen,freeze-dried,salmon,convenient,soy-free"},
            {"id":"FF-005","name":"Fresh Cooked Salmon Weekly Box","description":"A week of freshly cooked salmon and vegetable meals. Prepared and delivered fresh to your door.","category":"Frozen & Fresh","sub_category":"Fresh Cooked","price":2499,"allergy_free":"Soy-free · Chicken-free · Preservative-free","mira_tag":"Fresh delivered","shopify_tags":"dine,dine-frozen,fresh-cooked,salmon,weekly,delivery,subscription"},
            # ── Homemade & Recipes ───────────────────────────────────────────
            {"id":"HR-001","name":"Salmon & Sweet Potato Biscuit Recipe","description":"Quick biscuit recipe using salmon, sweet potato, oat flour, and egg. No soy. No chicken. Free printable recipe card.","category":"Homemade & Recipes","sub_category":"Quick Recipes","price":0,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Free recipe","shopify_tags":"dine,dine-homemade,recipe,salmon,quick,free,digital"},
            {"id":"HR-002","name":"Peanut Butter Frozen Treats Recipe","description":"Simple recipe for frozen peanut butter treats. Blend peanut butter, banana, coconut oil, and oat flour.","category":"Homemade & Recipes","sub_category":"Quick Recipes","price":0,"allergy_free":"Soy-free · Chicken-free · Xylitol-free","mira_tag":"Free recipe","shopify_tags":"dine,dine-homemade,recipe,peanut-butter,frozen,quick,free"},
            {"id":"HR-005","name":"Salmon & Oat Ingredient Pack","description":"Pre-measured ingredient pack for the Salmon Biscuit Recipe. Includes 200g fresh salmon, 150g sweet potato, 200g oat flour, 2 eggs.","category":"Homemade & Recipes","sub_category":"Quick Recipes","price":349,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Ready to cook","shopify_tags":"dine,dine-homemade,ingredient-pack,salmon,oat,ready-to-cook"},
            {"id":"HR-003","name":"Slow-Cooked Lamb Stew Recipe","description":"A slow-cooked lamb and vegetable stew. Makes 7 servings. Freeze in portions. Excellent for dogs recovering from illness.","category":"Homemade & Recipes","sub_category":"Weekend Recipes","price":0,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Recovery recipe","shopify_tags":"dine,dine-homemade,recipe,lamb,stew,recovery,weekend,free"},
            {"id":"HR-004","name":"DIY Salmon Birthday Cake Recipe","description":"Step-by-step recipe for Mojo's salmon birthday cake. Includes sweet potato frosting and bone biscuit decoration.","category":"Homemade & Recipes","sub_category":"Special Occasion","price":0,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Birthday recipe","shopify_tags":"dine,dine-homemade,recipe,birthday-cake,salmon,special-occasion,free"},
            {"id":"HR-007","name":"Birthday Cake Ingredient Pack","description":"Everything for the DIY Salmon Birthday Cake. Salmon, sweet potato, oat flour, eggs, and the birthday bone biscuit mould.","category":"Homemade & Recipes","sub_category":"Special Occasion","price":499,"allergy_free":"Soy-free · Chicken-free","mira_tag":"Birthday pack","shopify_tags":"dine,dine-homemade,ingredient-pack,birthday-cake,salmon,special-occasion"},
            {"id":"HR-006","name":"Doggy Safe Ingredients Reference Guide","description":"Comprehensive guide to dog-safe and dog-unsafe ingredients. Covers allergens, toxic foods, and safe substitutions.","category":"Homemade & Recipes","sub_category":"Ingredient Guide","price":0,"allergy_free":"N/A — guide only","mira_tag":"Free from Mira","shopify_tags":"dine,dine-homemade,guide,ingredients,safety,free,digital"},
        ]

        existing_ids = set()
        async for doc in db.products_master.find({"pillar": "dine"}, {"_id": 0, "id": 1}):
            if doc.get("id"):
                existing_ids.add(doc["id"])

        for p in DINE_CATALOG:
            if p["id"] in existing_ids:
                skipped += 1
                continue
            doc = {
                "id": p["id"],
                "pillar": "dine",
                "name": p["name"],
                "description": p.get("description", ""),
                "category": p.get("category", ""),
                "sub_category": p.get("sub_category", ""),
                "price": float(p.get("price", 0)),
                "image_url": "",
                "active": True,
                "in_stock": True,
                "allergy_free": p.get("allergy_free", ""),
                "mira_tag": p.get("mira_tag", ""),
                "shopify_tags": p.get("shopify_tags", ""),
                "source": "dine_catalog_seed_v1",
                "locally_edited": True,
                "created_at": now,
                "updated_at": now,
            }
            await db.products_master.insert_one(doc)
            doc.pop("_id", None)
            existing_ids.add(p["id"])
            seeded += 1

        logger.info(f"Dine catalog seed: {seeded} seeded, {skipped} skipped")
        return {
            "message": f"Dine catalog seeded: {seeded} new products, {skipped} already exist",
            "seeded": seeded,
            "skipped": skipped,
            "total_catalog": len(DINE_CATALOG)
        }
    except Exception as e:
        logger.error(f"Error seeding dine catalog: {e}")
        raise HTTPException(status_code=500, detail=str(e))
