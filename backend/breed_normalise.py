"""
Breed normalisation utility — shared across ALL backend modules.
Rule: Known breed → exact match. Unknown/mixed → 'indie' (most common in India).
Mira always uses the pet's ACTUAL breed name in conversation — this is only for product matching.
"""

KNOWN_BREEDS = [
    'akita','alaskan_malamute','american_bully','australian_shepherd','basenji',
    'beagle','bernese_mountain','bichon_frise','border_collie','boston_terrier',
    'boxer','bulldog','cavalier','chihuahua','chow_chow','cocker_spaniel',
    'corgi','dachshund','dalmatian','doberman','french_bulldog','german_shepherd',
    'golden_retriever','great_dane','havanese','husky','indian_spitz','indie',
    'irish_setter','italian_greyhound','jack_russell','labradoodle','labrador',
    'lhasa_apso','maltese','maltipoo','pomeranian','poodle','pug','rottweiler',
    'samoyed','schnoodle','scottish_terrier','shetland_sheepdog','shih_tzu',
    'st_bernard','vizsla','weimaraner','yorkshire'
]

BREED_ALIASES = {
    'indian pariah': 'indie',
    'indian street dog': 'indie',
    'desi': 'indie',
    'desi dog': 'indie',
    'street dog': 'indie',
    'stray': 'indie',
    'mixed': 'indie',
    'mixed breed': 'indie',
    'crossbreed': 'indie',
    'cross breed': 'indie',
    'mutt': 'indie',
    'unknown': 'indie',
    'other': 'indie',
    '': 'indie',
}


def normalise_breed(raw_breed: str) -> str:
    """Normalise a breed string for product matching. Returns underscore format."""
    if not raw_breed:
        return 'indie'

    clean = raw_breed.lower().strip().replace(' ', '_')

    # Check aliases (try both space and underscore versions)
    space_ver = clean.replace('_', ' ')
    if space_ver in BREED_ALIASES:
        return BREED_ALIASES[space_ver]
    if clean in BREED_ALIASES:
        return BREED_ALIASES[clean]

    # Exact known breed match
    if clean in KNOWN_BREEDS:
        return clean

    # Partial match
    for known in KNOWN_BREEDS:
        if known in clean or clean in known:
            return known

    # Default to indie
    return 'indie'
