"""
Prep script: Update mockup_prompt and clear mockup_url for GROUP 2 products.
GROUP 2 = 295 hash-suffix breed_products with generic prompts and no visibility field.

Run ONCE before triggering /api/mockups/generate-batch.
"""

import asyncio
import re
import os
import sys

from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "pet-os-live-test_database")

# --------------------------------------------------------------------------
# Breed display names (for readable prompts)
# --------------------------------------------------------------------------
BREED_DISPLAY = {
    "labrador": "Labrador Retriever",
    "golden_retriever": "Golden Retriever",
    "beagle": "Beagle",
    "poodle": "Poodle",
    "german_shepherd": "German Shepherd",
    "bulldog": "English Bulldog",
    "rottweiler": "Rottweiler",
    "doberman": "Doberman",
    "boxer": "Boxer",
    "husky": "Siberian Husky",
    "siberian_husky": "Siberian Husky",
    "shih_tzu": "Shih Tzu",
    "dachshund": "Dachshund",
    "maltese": "Maltese",
    "pug": "Pug",
    "chihuahua": "Chihuahua",
    "cocker_spaniel": "Cocker Spaniel",
    "dalmatian": "Dalmatian",
    "great_dane": "Great Dane",
    "saint_bernard": "Saint Bernard",
    "border_collie": "Border Collie",
    "australian_shepherd": "Australian Shepherd",
    "yorkshire_terrier": "Yorkshire Terrier",
    "yorkshire": "Yorkshire Terrier",
    "bichon_frise": "Bichon Frisé",
    "cavalier_king_charles": "Cavalier King Charles Spaniel",
    "cavalier": "Cavalier King Charles Spaniel",
    "french_bulldog": "French Bulldog",
    "jack_russell": "Jack Russell Terrier",
    "golden_doodle": "Goldendoodle",
    "labradoodle": "Labradoodle",
    "indie": "Indian Pariah",
    "indian_pariah": "Indian Pariah",
    "spitz": "Indian Spitz",
    "pomeranian": "Pomeranian",
    "akita": "Akita",
    "samoyed": "Samoyed",
    "corgi": "Welsh Corgi",
    "welsh_corgi": "Welsh Corgi",
    "basset_hound": "Basset Hound",
    "greyhound": "Greyhound",
    "weimaraner": "Weimaraner",
    "vizsla": "Vizsla",
    "belgian_malinois": "Belgian Malinois",
    "bernese_mountain_dog": "Bernese Mountain Dog",
    "newfoundland": "Newfoundland",
    "portuguese_water_dog": "Portuguese Water Dog",
    "miniature_schnauzer": "Miniature Schnauzer",
    "standard_schnauzer": "Standard Schnauzer",
    "west_highland_terrier": "West Highland White Terrier",
    "scottish_terrier": "Scottish Terrier",
    "irish_setter": "Irish Setter",
    "english_setter": "English Setter",
    "whippet": "Whippet",
    "shar_pei": "Shar Pei",
    "bloodhound": "Bloodhound",
    "kelpie": "Australian Kelpie",
    "havanese": "Havanese",
    "lhasa_apso": "Lhasa Apso",
    "tibetan_mastiff": "Tibetan Mastiff",
    "rajapalayam": "Rajapalayam",
    "kombai": "Kombai",
    "mudhol": "Mudhol Hound",
    "rampur_greyhound": "Rampur Greyhound",
    "chippiparai": "Chippiparai",
    "kanni": "Kanni",
    "pandikona": "Pandikona",
    "bakharwal": "Bakharwal",
    "caravan_hound": "Caravan Hound",
    "gaddi_kutta": "Gaddi Kutta",
}

# --------------------------------------------------------------------------
# Product type keyword → prompt style mapping
# --------------------------------------------------------------------------
PRODUCT_KEYWORD_MAP = {
    # Celebrate / Shop products
    "birthday_cake": "birthday_cake",
    "birthday cake": "birthday_cake",
    "ceramic_mug": "mug",
    "ceramic mug": "mug",
    "mug": "mug",
    "designer_bandana": "bandana",
    "designer bandana": "bandana",
    "bandana": "bandana",
    "photo_frame": "frame",
    "photo frame": "frame",
    "frame": "frame",
    "canvas_print": "frame",
    "canvas print": "frame",
    "treat_box": "treat_jar",
    "treat box": "treat_jar",
    "breed_keychain": "keychain",
    "breed keychain": "keychain",
    "keychain": "keychain",
    "party_hat": "party_hat",
    "party hat": "party_hat",
    "tote_bag": "tote_bag",
    "tote bag": "tote_bag",
    "memorial_candle": "memorial_candle",
    "memorial candle": "memorial_candle",
    "collar_tag": "collar_tag",
    "collar tag": "collar_tag",
    "id_tag": "collar_tag",
    "id tag": "collar_tag",
    "bowl": "bowl",
    "blanket": "blanket",
    "cake_topper": "cake_topper",
    "cake topper": "cake_topper",
    # Care products
    "brush": "grooming_brush",
    "grooming": "grooming_brush",
    "shampoo": "shampoo_bottle",
    "conditioner": "shampoo_bottle",
    "collar": "collar",
    "leash": "leash",
    "harness": "harness",
    # Go products
    "carrier": "carrier_bag",
    "backpack": "carrier_bag",
    # Play products
    "toy": "dog_toy",
    "rope toy": "dog_toy",
    "puzzle": "puzzle_toy",
    "chew": "chew_toy",
    # Dine products
    "recipe_card": "recipe_card",
    "recipe card": "recipe_card",
    "meal_plan": "recipe_card",
    "meal plan": "recipe_card",
    "food_bowl": "bowl",
    "food bowl": "bowl",
    # Emergency
    "first_aid": "first_aid_kit",
    "first aid": "first_aid_kit",
    "emergency_kit": "first_aid_kit",
    # Paperwork / Learn
    "notebook": "notebook",
    "journal": "notebook",
    "guide_book": "notebook",
    "guide book": "notebook",
    "planner": "notebook",
}

BREED_COLOURS = {
    "labrador": "golden yellow",
    "golden_retriever": "rich golden",
    "beagle": "tricolor brown, white and black",
    "poodle": "cream white",
    "german_shepherd": "black and tan",
    "bulldog": "white and fawn",
    "rottweiler": "black and tan",
    "doberman": "sleek black and rust",
    "boxer": "fawn and white",
    "husky": "grey and white",
    "siberian_husky": "grey and white",
    "shih_tzu": "white and gold",
    "dachshund": "rich chocolate brown",
    "maltese": "pure white",
    "pug": "fawn with black mask",
    "chihuahua": "warm tan",
    "cocker_spaniel": "golden",
    "dalmatian": "white with black spots",
    "great_dane": "fawn with black mask",
    "saint_bernard": "white and reddish-brown",
    "border_collie": "black and white",
    "australian_shepherd": "blue merle",
    "yorkshire_terrier": "tan and blue-grey",
    "yorkshire": "tan and blue-grey",
    "bichon_frise": "fluffy white",
    "cavalier_king_charles": "chestnut and white",
    "cavalier": "chestnut and white",
    "french_bulldog": "cream brindle",
    "jack_russell": "white with tan patches",
    "golden_doodle": "apricot wavy",
    "labradoodle": "chocolate curly",
    "indie": "warm tawny brown",
    "indian_pariah": "warm tawny brown",
    "spitz": "fluffy white",
    "pomeranian": "fluffy orange",
    "akita": "red and white",
    "samoyed": "pure fluffy white",
    "corgi": "golden and white",
    "welsh_corgi": "golden and white",
    "basset_hound": "tricolor",
    "greyhound": "sleek grey",
    "weimaraner": "silvery grey",
    "vizsla": "rusty golden",
    "belgian_malinois": "fawn with black mask",
    "bernese_mountain_dog": "tricolor black, white and rust",
    "newfoundland": "deep black",
    "portuguese_water_dog": "black and white",
    "miniature_schnauzer": "salt and pepper",
    "standard_schnauzer": "salt and pepper",
    "west_highland_terrier": "pure white",
    "scottish_terrier": "dark brindle",
    "irish_setter": "rich mahogany red",
    "english_setter": "white and orange belton",
    "whippet": "sleek fawn",
    "shar_pei": "sandy fawn",
    "bloodhound": "black and tan",
    "kelpie": "red kelpie",
    "havanese": "silver and white",
    "lhasa_apso": "golden",
    "tibetan_mastiff": "black and tan",
    "rajapalayam": "pure white",
    "kombai": "reddish brown",
    "mudhol": "fawn",
    "rampur_greyhound": "grey",
    "chippiparai": "fawn",
    "kanni": "black and tan",
    "pandikona": "fawn",
    "bakharwal": "black and tan",
    "caravan_hound": "fawn",
    "gaddi_kutta": "white and grey",
}


def get_product_type_key(product_id: str, breed: str, name: str) -> str:
    """Extract product type from ID by stripping breed prefix and hex suffix."""
    breed_slug = breed.replace("_", "-")
    # Strip bp- prefix, breed prefix, and hex suffix
    core = product_id
    if core.startswith(f"bp-{breed_slug}-"):
        core = core[len(f"bp-{breed_slug}-"):]
    elif core.startswith("bp-"):
        core = core[3:]
    # Strip 7-char hex suffix (-[a-f0-9]{6})
    core = re.sub(r'-[a-f0-9]{6}$', '', core)
    return core  # e.g. "birthday-cake", "ceramic-mug"


def build_prompt(breed: str, product_type_key: str, name: str) -> str:
    """Build a breed-specific watercolor prompt."""
    breed_display = BREED_DISPLAY.get(breed, breed.replace("_", " ").title())
    colour = BREED_COLOURS.get(breed, "warm brown")

    # Normalize product_type_key (replace hyphens with underscores)
    pt_normalized = product_type_key.replace("-", "_").lower()
    pt_readable = product_type_key.replace("-", " ").lower()

    # Map to known prompt style
    prompt_style = None
    for kw, style in PRODUCT_KEYWORD_MAP.items():
        if kw in pt_normalized or kw in pt_readable:
            prompt_style = style
            break

    if prompt_style == "birthday_cake":
        return (
            f"Yappy.com style dog portrait illustration of a {breed_display} dog, "
            f"head and face ONLY cropped at neck, {colour} fur, "
            f"pure flat vector art with solid colour fills, NO outlines NO strokes NO gradients, "
            f"pure white background, small black oval eyes with single tiny white highlight dot, "
            f"prominent black inverted-teardrop nose, bright pink tongue peeking out, "
            f"friendly happy forward-facing expression, "
            f"breed-accurate ear shape for {breed_display}, "
            f"minimalist clean flat design suitable for edible cake printing, "
            f"centred composition square format"
        )
    elif prompt_style == "mug":
        return (
            f"Professional product mockup of a white ceramic coffee mug with a beautiful soulful "
            f"watercolour portrait of a {breed_display} dog printed on it, "
            f"{colour} fur tones, soft pastel watercolour style, "
            f"clean marble surface, soft studio lighting, photorealistic product photo, "
            f"pure white background, no text"
        )
    elif prompt_style == "bandana":
        return (
            f"Professional product mockup of a soft cotton dog bandana laid flat, "
            f"featuring a hand-painted soulful watercolour illustration of a {breed_display} dog, "
            f"{colour} fur tones, pastel colour palette, "
            f"pure white studio background, soft lighting, product photography"
        )
    elif prompt_style == "frame":
        return (
            f"Professional product mockup of a wooden picture frame containing a soulful "
            f"watercolour portrait of a {breed_display} dog, "
            f"{colour} fur, warm pastel tones, soft painterly style, "
            f"elegant shelf setting, clean studio lighting, product photography"
        )
    elif prompt_style == "keychain":
        return (
            f"Professional product mockup of a metal keychain featuring a laser-engraved "
            f"silhouette of a {breed_display} dog, "
            f"clean white surface, studio lighting, detailed engraving visible, "
            f"product photography, no text"
        )
    elif prompt_style == "treat_jar":
        return (
            f"Professional product mockup of a ceramic treat jar with a hand-painted "
            f"watercolour {breed_display} dog illustration on the side, "
            f"{colour} fur tones, kitchen counter setting, soft natural lighting, "
            f"product photography, no text"
        )
    elif prompt_style == "party_hat":
        return (
            f"Professional product mockup of a festive birthday party hat for dogs "
            f"with a watercolour illustration of a {breed_display} dog printed on it, "
            f"colourful pastel design, white studio background, product photography"
        )
    elif prompt_style == "tote_bag":
        return (
            f"Professional product mockup of a canvas tote bag with a watercolour "
            f"illustration of a {breed_display} dog, "
            f"{colour} fur, pastel palette, flat lay on white background, studio lighting"
        )
    elif prompt_style == "blanket":
        return (
            f"Professional product mockup of a cosy fleece pet blanket with a watercolour "
            f"{breed_display} dog pattern, {colour} tones, "
            f"folded neatly on a wooden surface, soft warm lighting, product photography"
        )
    elif prompt_style == "bowl":
        return (
            f"Professional product mockup of a ceramic dog food bowl with a watercolour "
            f"{breed_display} dog illustration on the outer rim, "
            f"clean surface, studio lighting, product photography"
        )
    elif prompt_style == "collar_tag":
        return (
            f"Professional product mockup of a stainless steel dog ID tag engraved with "
            f"a {breed_display} dog silhouette, photographed on white surface, "
            f"detailed close-up, product photography"
        )
    elif prompt_style == "memorial_candle":
        return (
            f"Professional product mockup of an elegant white memorial candle in a glass jar "
            f"with a watercolour {breed_display} dog illustration on the label, "
            f"soft warm ambient lighting, product photography"
        )
    elif prompt_style == "cake_topper":
        return (
            f"Professional product mockup of a wooden cake topper with a laser-cut "
            f"{breed_display} dog silhouette design, "
            f"photographed on a white cake with frosting, product photography"
        )
    elif prompt_style == "notebook":
        return (
            f"Professional product mockup of a soft-cover notebook with a watercolour "
            f"illustration of a {breed_display} dog on the cover, "
            f"{colour} tones, pastel palette, flat lay on marble surface, "
            f"clean studio lighting, product photography"
        )
    elif prompt_style == "recipe_card":
        return (
            f"Soulful watercolour illustration of a {breed_display} dog with food ingredients "
            f"and paw prints, {colour} fur tones, "
            f"soft pastel style, white background, suitable for a recipe card or meal guide"
        )
    elif prompt_style == "first_aid_kit":
        return (
            f"Professional product mockup of a compact pet first aid kit box "
            f"with a {breed_display} dog illustration and red cross icon, "
            f"white background, studio lighting, product photography"
        )
    elif prompt_style in ("collar", "leash", "harness"):
        return (
            f"Professional product mockup of a dog {pt_readable} with a {breed_display} dog "
            f"breed pattern, {colour} accent colours, clean white background, "
            f"flat lay product photography"
        )
    elif prompt_style in ("grooming_brush", "shampoo_bottle"):
        return (
            f"Professional product mockup of a pet grooming {pt_readable} "
            f"designed for {breed_display} dogs, "
            f"clean white background, studio lighting, product photography"
        )
    elif prompt_style in ("dog_toy", "puzzle_toy", "chew_toy"):
        return (
            f"Professional product mockup of a dog {pt_readable} "
            f"designed for a {breed_display}, colourful, "
            f"clean white background, studio lighting, product photography"
        )
    elif prompt_style == "carrier_bag":
        return (
            f"Professional product mockup of a pet carrier bag "
            f"designed for a {breed_display} dog, "
            f"clean white background, studio lighting, product photography"
        )
    else:
        # Generic fallback — still breed-specific
        return (
            f"Soulful watercolour illustration of a {breed_display} dog "
            f"with a {pt_readable.replace('_', ' ')}, "
            f"{colour} fur tones, soft pastel palette, white background, "
            f"artisan quality, suitable for a premium pet product"
        )


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    bp = db["breed_products"]
    pm = db["products_master"]

    hash_pattern = re.compile(r'^bp-[a-z_]+-.*-[a-f0-9]{6}$')

    # Fetch GROUP 2 (hash-suffix, not archived)
    cursor = bp.find(
        {},
        {"id": 1, "breed": 1, "pillar": 1, "name": 1, "product_type": 1,
         "visibility": 1, "_id": 1}
    )
    all_docs = await cursor.to_list(length=6000)

    group2 = [
        d for d in all_docs
        if hash_pattern.match(d.get("id", ""))
        and not (d.get("visibility", {}) or {}).get("status") == "archived"
    ]

    print(f"GROUP 2 products found: {len(group2)}")

    updated = 0
    failed = 0

    for prod in group2:
        prod_id = prod["id"]
        breed = prod.get("breed", "")
        name = prod.get("name", "")
        pillar = prod.get("pillar", "")

        # Extract product type from ID
        pt_key = get_product_type_key(prod_id, breed, name)

        # Build breed-specific prompt
        prompt = build_prompt(breed, pt_key, name)

        try:
            # Update breed_products: set new prompt + clear mockup_url so batch picks it up
            await bp.update_one(
                {"_id": prod["_id"]},
                {"$set": {
                    "mockup_prompt": prompt,
                    "mockup_url": None,
                    "cloudinary_url": None,
                    "image_url": None,
                    "image": None,
                    "regen_queued": True,
                }}
            )

            # Also update products_master if it exists there
            await pm.update_one(
                {"id": prod_id},
                {"$set": {
                    "mockup_prompt": prompt,
                    "mockup_url": None,
                    "cloudinary_url": None,
                    "image_url": None,
                    "image": None,
                }}
            )

            updated += 1
            if updated % 50 == 0:
                print(f"  Progress: {updated}/{len(group2)} updated...")

        except Exception as e:
            print(f"  ERROR on {prod_id}: {e}")
            failed += 1

    print(f"\nDONE: {updated} updated, {failed} failed")
    print(f"Next step: POST /api/mockups/generate-batch with limit=300")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
