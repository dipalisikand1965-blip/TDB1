#!/usr/bin/env python3
"""
Seeds birthday_cake_topper for all 52 breeds missing it.
Updates the prompt for bichon_frise + saint_bernard (have entry but no image yet).
Leaves corgi + basenji untouched (already have generated images).

Run once. Safe to re-run — uses upsert with insert_only logic.
"""
from pymongo import MongoClient
from datetime import datetime, timezone

DB_URL = "mongodb://localhost:27017"
DB_NAME = "pet-os-live-test_database"

# ==============================================================
# THE GOLDEN PROMPT — matches the wooden laser-cut silhouette
# ==============================================================
TOPPER_PROMPT = (
    "Professional product photography of a laser-cut natural MDF wooden birthday cake topper "
    "shaped exactly like the breed silhouette of a {BREED_NAME} dog viewed from the side, "
    "with 'Happy Birthday' text engraved in elegant cursive script directly on the wood surface, "
    "mounted on a thin wooden spike/stick at the bottom. "
    "Warm natural wood grain texture, light sandy beige colour, no paint or colour added. "
    "Clean white background, soft studio lighting. "
    "The silhouette is precise and recognisable as a {BREED_NAME}."
)

# Breed slug → display name mapping
BREED_DISPLAY = {
    "akita":                "Akita",
    "alaskan_malamute":     "Alaskan Malamute",
    "american_bully":       "American Bully",
    "australian_shepherd":  "Australian Shepherd",
    "basenji":              "Basenji",
    "beagle":               "Beagle",
    "bernese_mountain":     "Bernese Mountain Dog",
    "bichon_frise":         "Bichon Frise",
    "border_collie":        "Border Collie",
    "boston_terrier":       "Boston Terrier",
    "boxer":                "Boxer",
    "bulldog":              "Bulldog",
    "cavalier":             "Cavalier King Charles Spaniel",
    "cavalier_king_charles":"Cavalier King Charles Spaniel",
    "chihuahua":            "Chihuahua",
    "chow_chow":            "Chow Chow",
    "cocker_spaniel":       "Cocker Spaniel",
    "corgi":                "Corgi",
    "dachshund":            "Dachshund",
    "dalmatian":            "Dalmatian",
    "doberman":             "Doberman",
    "english_bulldog":      "English Bulldog",
    "french_bulldog":       "French Bulldog",
    "german_shepherd":      "German Shepherd",
    "golden_retriever":     "Golden Retriever",
    "great_dane":           "Great Dane",
    "greyhound":            "Greyhound",
    "havanese":             "Havanese",
    "husky":                "Husky",
    "indian_pariah":        "Indian Pariah Dog",
    "indian_spitz":         "Indian Spitz",
    "indie":                "Indie Dog",
    "irish_setter":         "Irish Setter",
    "jack_russell":         "Jack Russell Terrier",
    "labradoodle":          "Labradoodle",
    "labrador":             "Labrador Retriever",
    "lhasa_apso":           "Lhasa Apso",
    "maltese":              "Maltese",
    "maltipoo":             "Maltipoo",
    "newfoundland":         "Newfoundland",
    "pomeranian":           "Pomeranian",
    "poodle":               "Poodle",
    "pug":                  "Pug",
    "rottweiler":           "Rottweiler",
    "saint_bernard":        "Saint Bernard",
    "samoyed":              "Samoyed",
    "schnoodle":            "Schnoodle",
    "scottish_terrier":     "Scottish Terrier",
    "shetland_sheepdog":    "Shetland Sheepdog",
    "shih_tzu":             "Shih Tzu",
    "siberian_husky":       "Siberian Husky",
    "st_bernard":           "Saint Bernard",
    "vizsla":               "Vizsla",
    "weimaraner":           "Weimaraner",
    "yorkshire":            "Yorkshire Terrier",
    "yorkshire_terrier":    "Yorkshire Terrier",
}

# Breeds to SKIP (already have generated images — do not overwrite)
SKIP_BREEDS = {"corgi", "basenji"}

# Breeds that have an entry but NO image yet — update prompt only
UPDATE_PROMPT_ONLY = {"bichon_frise", "saint_bernard"}


def make_prompt(breed_slug):
    display = BREED_DISPLAY.get(breed_slug, breed_slug.replace("_", " ").title())
    return TOPPER_PROMPT.replace("{BREED_NAME}", display)


def main():
    client = MongoClient(DB_URL)
    db = client[DB_NAME]
    bp = db.breed_products

    all_breeds = sorted(BREED_DISPLAY.keys())
    now = datetime.now(timezone.utc).isoformat()

    inserted = 0
    updated  = 0
    skipped  = 0

    for breed in all_breeds:
        if breed in SKIP_BREEDS:
            print(f"  SKIP   {breed} (has image, leaving untouched)")
            skipped += 1
            continue

        prompt = make_prompt(breed)
        display = BREED_DISPLAY.get(breed, breed.replace("_", " ").title())
        doc_id = f"breed-{breed}-birthday_cake_topper"

        existing = bp.find_one({"id": doc_id}, {"_id": 0, "mockup_url": 1})

        if existing is not None:
            if breed in UPDATE_PROMPT_ONLY:
                # Update prompt only — no image yet so safe
                bp.update_one(
                    {"id": doc_id},
                    {"$set": {"mockup_prompt": prompt, "updated_at": now}}
                )
                print(f"  UPDATE {breed} (prompt updated, no image yet)")
                updated += 1
            else:
                print(f"  EXISTS {breed} (skipping — already seeded)")
                skipped += 1
        else:
            # Insert new entry
            doc = {
                "id":            doc_id,
                "breed":         breed,
                "name":          f"{display} Birthday Cake Topper",
                "pillar":        "celebrate",
                "tag_pillar":    "celebrate",
                "product_type":  "birthday_cake_topper",
                "sub_category":  "party_supplies",
                "soul_made":     True,
                "is_active":     True,
                "is_mockup":     False,
                "mockup_prompt": prompt,
                "mockup_url":    None,
                "cloudinary_url":None,
                "tags":          [breed, "celebrate", "birthday", "cake_topper", "soul_made"],
                "created_at":    now,
                "updated_at":    now,
            }
            bp.insert_one(doc)
            print(f"  INSERT {breed} ({display})")
            inserted += 1

    print(f"\n{'='*50}")
    print(f"Done. Inserted: {inserted} | Updated: {updated} | Skipped: {skipped}")
    print(f"Total breeds seeded: {inserted + updated}")
    print(f"\nNext step: trigger generation batch")
    print(f"  POST /api/mockups/generate-batch")
    print(f'  {{"product_type": "birthday_cake_topper", "limit": 100}}')


if __name__ == "__main__":
    main()
