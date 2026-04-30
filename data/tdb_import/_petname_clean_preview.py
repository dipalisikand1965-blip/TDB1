"""
Pet-name cleanup preview (READ-ONLY).
Applies Dipali's Flag 3 rules to tdb_pets_staging.csv + tdb_enriched_customers.csv,
counts before/removed/kept/extracted. NO writes anywhere.
"""
import pandas as pd
import re
from collections import Counter

# ── Cleanup rules ────────────────────────────────────────────────────
PREFIX_NOISE = re.compile(
    r'^(happy|hdb|h\s*bd|h\s*bday|b\'?day|birthday|bday|h\s*\d+|hd\s+|hbd|hb\s+)\b',
    re.IGNORECASE,
)

FALSE_POSITIVES = {
    'milk', 'chicken', 'mutton', 'fish', 'cake', 'treat',
    'you', 'make', 'have', 'wheat', 'gluten', 'peanut', 'butter',
}

# These words are "noise" — strip them when extracting from a fragment
EXTRACT_STRIP_WORDS = {
    # Birthday/celebration noise
    'happy', 'hdb', 'hd', 'hbd', 'h', 'bd', 'bday', 'birthda', 'birthday',
    "b'day", "b'days", 'birth', 'day', 'days', 'happiest', 'wishing', 'wish',
    'anniversary', 'turning', 'turned', 'turns', 'turn', 'yay', 'yayy', 'yayyy',
    'celebrating', 'celebrate', 'celebrates',
    # Single-letter junk
    'l', 'z', 'i', 'a', 'b', 'c',
    # Articles, prepositions, fillers
    'to', 'for', 'is', 'an', 'the', 'and', 'with', 'from', 'of', 'on',
    # Age/time fragments
    'kids', 'months', 'month', 'old', 'years', 'year', 'yr', 'yrs',
    'st', 'nd', 'rd', 'th',
    # Generic "this is my dog" fragments
    'name', 'names', 'dog', 'doggy', 'pet', 'pets', 'puppy', 'puppies',
    'baby', 'babies', 'breed',
    # Honorifics
    'mr', 'mrs', 'ms', 'sir', 'madam',
}

# Common breed names — strip when found alongside a pet name
BREED_STRIP_WORDS = {
    'beagle', 'labrador', 'lab', 'golden', 'retriever', 'shih', 'tzu',
    'husky', 'poodle', 'pug', 'rottweiler', 'german', 'shepherd',
    'maltese', 'pomeranian', 'spitz', 'dachshund', 'lhasa', 'apso',
    'cocker', 'spaniel', 'indie', 'mongrel', 'mixed', 'mix',
    'choclate', 'chocolate', 'border', 'collie',
}

NUMERIC = re.compile(r'^\d+$')
NUMBER_SUFFIX = re.compile(r'^\d+(st|nd|rd|th|\.\.+|\.)?$', re.IGNORECASE)

def clean_pet_name(raw):
    """
    Returns (status, name):
      status: 'kept' | 'removed' | 'extracted'
      name:   cleaned name string (None if removed)
    """
    if not raw or not isinstance(raw, str):
        return ('removed', None)
    n = raw.strip()
    if not n:
        return ('removed', None)

    # Numeric only
    if NUMERIC.match(n):
        return ('removed', None)

    # Less than 2 characters
    if len(n) < 2:
        return ('removed', None)

    # False positive (whole-string match, case-insensitive)
    if n.lower() in FALSE_POSITIVES:
        return ('removed', None)

    # If clean (no noise prefix, no obvious junk) → keep as-is
    if not PREFIX_NOISE.match(n) and ' ' not in n:
        return ('kept', n)

    # Multi-word strings: try to extract a real name by stripping noise words
    # First, strip leading/trailing punctuation from each word
    words = re.split(r'[\s\']+', n)  # split on space + apostrophe
    cleaned = []
    for w in words:
        # Strip leading/trailing punct
        w = w.strip('.,!?;:()[]{}"\'\\🤍❤️💕🌷')
        if not w: continue
        wl = w.lower()
        if wl in EXTRACT_STRIP_WORDS: continue
        if wl in BREED_STRIP_WORDS: continue
        if wl in FALSE_POSITIVES: continue
        if NUMERIC.match(w) or NUMBER_SUFFIX.match(w): continue
        if len(w) < 2: continue
        cleaned.append(w)

    if not cleaned:
        return ('removed', None)

    # If only one meaningful word remains → that's our name
    if len(cleaned) == 1:
        return ('extracted', cleaned[0].capitalize())

    # Multi-word real names (e.g. "Auro Bruno", "Mister Raf"): keep all words capitalized
    final = ' '.join(w.capitalize() for w in cleaned)
    if final.lower() in FALSE_POSITIVES:
        return ('removed', None)
    if len(final) < 2:
        return ('removed', None)
    return ('extracted', final)


# ── Run on tdb_pets_staging.csv (one row per pet) ────────────────
print("=" * 70)
print("CLEANUP PREVIEW — tdb_pets_staging.csv (one row per pet)")
print("=" * 70)
pets = pd.read_csv('/app/data/tdb_import/tdb_pets_staging.csv', low_memory=False)
total = len(pets)
counts = Counter()
removed_examples = []
kept_examples = []
extracted_examples = []

for _, row in pets.iterrows():
    name = row.get('name')
    status, cleaned = clean_pet_name(name)
    counts[status] += 1
    if status == 'removed' and len(removed_examples) < 30:
        removed_examples.append(str(name))
    elif status == 'extracted' and len(extracted_examples) < 30:
        extracted_examples.append((str(name), cleaned))
    elif status == 'kept' and len(kept_examples) < 10:
        kept_examples.append(str(name))

print(f"\n  Names before clean : {total:,}")
print(f"  Kept as-is         : {counts['kept']:,}  ({100*counts['kept']/total:.1f}%)")
print(f"  Extracted from frag: {counts['extracted']:,}  ({100*counts['extracted']/total:.1f}%)")
print(f"  Removed entirely   : {counts['removed']:,}  ({100*counts['removed']/total:.1f}%)")

print(f"\n  Sample REMOVED (junk):")
for x in removed_examples[:20]:
    print(f"    {x[:60]!r}")

print(f"\n  Sample EXTRACTED (cleaned from fragments):")
for raw, cleaned in extracted_examples[:20]:
    print(f"    {raw[:50]!r:<55s} → {cleaned!r}")

print(f"\n  Sample KEPT as-is (already clean):")
for x in kept_examples:
    print(f"    {x!r}")

# ── Run on tdb_enriched_customers.csv (one row per parent, pet_names is "; "-joined) ──
print("\n" + "=" * 70)
print("CLEANUP PREVIEW — tdb_enriched_customers.csv (pet_names column)")
print("=" * 70)
parents = pd.read_csv('/app/data/tdb_import/tdb_enriched_customers.csv', low_memory=False)

total_pet_names = 0
counts2 = Counter()
parents_with_pets_before = 0
parents_with_pets_after = 0
empty_after_clean = 0

for pn in parents['pet_names'].dropna():
    if not str(pn).strip():
        continue
    parents_with_pets_before += 1
    raws = [r.strip() for r in str(pn).split(';') if r.strip()]
    cleaned_list = []
    for r in raws:
        total_pet_names += 1
        status, cleaned = clean_pet_name(r)
        counts2[status] += 1
        if cleaned:
            cleaned_list.append(cleaned)
    # Dedupe within row
    cleaned_dedup = list(dict.fromkeys(cleaned_list))
    if cleaned_dedup:
        parents_with_pets_after += 1
    else:
        empty_after_clean += 1

print(f"\n  Total pet-name strings (across all parents): {total_pet_names:,}")
print(f"  Kept as-is        : {counts2['kept']:,}  ({100*counts2['kept']/total_pet_names:.1f}%)")
print(f"  Extracted         : {counts2['extracted']:,}  ({100*counts2['extracted']/total_pet_names:.1f}%)")
print(f"  Removed           : {counts2['removed']:,}  ({100*counts2['removed']/total_pet_names:.1f}%)")

print(f"\n  Parents with ≥1 pet name BEFORE clean: {parents_with_pets_before:,}")
print(f"  Parents with ≥1 pet name AFTER clean : {parents_with_pets_after:,}")
print(f"  Parents who lost all pet names       : {empty_after_clean:,}  ← these become pet_count=0 instead")

# Spot check: Renuka Halla, Roji Mathew (the noisy ones from sample_cards.md)
print(f"\n  Spot check (parents from sample_cards.md):")
for em in ['renuka.halla@gmail.com', 'rojimathew73@gmail.com']:
    row = parents[parents['email'] == em]
    if len(row) == 0: continue
    pn_raw = row.iloc[0]['pet_names']
    if pd.isna(pn_raw): continue
    raws = [r.strip() for r in str(pn_raw).split(';') if r.strip()]
    before = raws[:8]
    after = []
    for r in raws:
        st, cl = clean_pet_name(r)
        if cl: after.append(cl)
    after = list(dict.fromkeys(after))
    print(f"\n    {em}:")
    print(f"       BEFORE ({len(raws)}): {raws[:10]}")
    print(f"       AFTER  ({len(after)}): {after[:10]}")

print("\n" + "=" * 70)
print("✅ NO DATABASE WRITES. Source CSVs untouched.")
print("   This logic will be applied in STEP 4 transform — not before.")
print("=" * 70)
