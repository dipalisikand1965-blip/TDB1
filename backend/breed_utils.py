"""
Breed Name Auto-Correction Utility
Uses a breed dictionary and fuzzy matching to correct misspelled breed names
"""

from difflib import get_close_matches
from typing import Optional, Tuple

# Comprehensive breed dictionary with common misspellings mapped to correct names
BREED_DICTIONARY = {
    # Dogs - Popular breeds
    "labrador retriever": ["labrador", "lab", "labradore", "labredor", "labrodor", "laborador", "labardor"],
    "golden retriever": ["golden", "goldne retriever", "goldan retriever", "golden retriver", "golden retreiver"],
    "german shepherd": ["german shepard", "german sheperd", "gsd", "german shephard", "alsatian", "german sheppard"],
    "beagle": ["beagel", "beagal", "begle"],
    "bulldog": ["bull dog", "buldog", "english bulldog", "british bulldog"],
    "french bulldog": ["frenchie", "french bull dog", "frenchy", "french buldog"],
    "poodle": ["poodal", "poodel", "puddle"],
    "rottweiler": ["rottweiller", "rotweiler", "rotty", "rotti", "rottie"],
    "boxer": ["boxar", "boxor"],
    "dachshund": ["dachund", "daschhund", "weiner dog", "wiener dog", "sausage dog", "dacshund"],
    "pomeranian": ["pom", "pomerian", "pomeranian", "pomerenian", "pommie"],
    "shih tzu": ["shitzu", "shit tzu", "shih-tzu", "shihtzu", "shih zu"],
    "husky": ["siberian husky", "huskee", "huskie", "huskey"],
    "yorkshire terrier": ["yorkie", "yorkshire", "yorky", "yorkshier terrier"],
    "chihuahua": ["chihuawa", "chiuaua", "chiwawa", "chiuahua", "chiwuawua"],
    "pug": ["pugg", "pugs"],
    "cocker spaniel": ["cocker", "cocker spanial", "cockerspaniel", "american cocker spaniel"],
    "border collie": ["boarder collie", "border colley", "border colli"],
    "great dane": ["greatdane", "great dain", "dane"],
    "doberman": ["dobermann", "doberman pinscher", "dobie", "dobey"],
    "cavalier king charles spaniel": ["cavalier", "king charles", "ckcs", "cavalier spaniel"],
    "bernese mountain dog": ["bernese", "berner", "berneese mountain dog"],
    "maltese": ["malteese", "maltees", "maltis"],
    "saint bernard": ["st bernard", "st. bernard", "saint bernand"],
    "shetland sheepdog": ["sheltie", "shetland", "shelty"],
    "boston terrier": ["boston", "boston bull", "boston terrier"],
    "havanese": ["havanees", "havaneese"],
    "english springer spaniel": ["springer", "springer spaniel", "english springer"],
    "australian shepherd": ["aussie", "australian sheperd", "australian shephard"],
    "miniature schnauzer": ["schnauzer", "mini schnauzer", "schnauser"],
    "pembroke welsh corgi": ["corgi", "welsh corgi", "pembroke corgi"],
    "mastiff": ["mastif", "english mastiff", "bull mastiff", "bullmastiff"],
    "basset hound": ["basset", "basset hund", "bassett hound"],
    "weimaraner": ["weimeraner", "weimraner", "weimy"],
    "dalmatian": ["dalmation", "dalmatien", "dalmation"],
    "papillon": ["papion", "papillion"],
    "akita": ["akita inu", "akito", "japanese akita"],
    "bloodhound": ["blood hound", "bloodhund"],
    "greyhound": ["grey hound", "greyhnd"],
    "whippet": ["whipet", "whippett"],
    "samoyed": ["sammoyed", "sammie", "sammy", "samoyd"],
    "bichon frise": ["bichon", "bichon frisé", "bishon frise"],
    "lhasa apso": ["lhasa", "lhasso apso", "lahsa apso"],
    "jack russell terrier": ["jack russell", "jrt", "jack russel"],
    
    # Indian breeds
    "indian spitz": ["spitz", "indian spittz", "pomeranian indian"],
    "indian pariah": ["indie", "indian pariah dog", "desi dog", "indie dog", "pariah"],
    "rajapalayam": ["rajapalayam hound", "rajapalayum"],
    "mudhol hound": ["mudhol", "caravan hound", "maratha hound"],
    "kombai": ["combai", "kombai dog"],
    "rampur greyhound": ["rampur hound", "rampur"],
    "chippiparai": ["chippi", "chippiparai hound"],
    "kanni": ["kanni dog", "maiden's beastmaster"],
    
    # Cats (bonus)
    "persian cat": ["persian", "persain cat"],
    "siamese cat": ["siamese", "siamise"],
    "maine coon": ["main coon", "maine coon cat"],
    "british shorthair": ["british short hair", "bsh"],
    "ragdoll": ["rag doll", "ragdol"],
    "bengal cat": ["bengal", "bengal tiger cat"],
    "scottish fold": ["scottish fold cat", "scottsh fold"],
    "sphynx": ["sphinx", "sphynx cat", "hairless cat"],
    "russian blue": ["russian blue cat", "russain blue"],
    "abyssinian": ["abyssinian cat", "aby", "abysinian"],
}

# Build reverse lookup dictionary
BREED_LOOKUP = {}
for correct_name, variations in BREED_DICTIONARY.items():
    BREED_LOOKUP[correct_name.lower()] = correct_name.title()
    for variation in variations:
        BREED_LOOKUP[variation.lower()] = correct_name.title()

# All valid breed names for fuzzy matching
ALL_BREEDS = list(set([name.title() for name in BREED_DICTIONARY.keys()]))


def normalize_breed_name(input_breed: str) -> Tuple[str, bool, Optional[str]]:
    """
    Normalize a breed name to its correct spelling.
    
    Args:
        input_breed: The user-input breed name
        
    Returns:
        Tuple of (corrected_name, was_corrected, original_input)
    """
    if not input_breed:
        return ("", False, None)
    
    input_lower = input_breed.lower().strip()
    
    # Direct lookup first
    if input_lower in BREED_LOOKUP:
        corrected = BREED_LOOKUP[input_lower]
        was_corrected = corrected.lower() != input_lower
        return (corrected, was_corrected, input_breed if was_corrected else None)
    
    # Fuzzy matching
    matches = get_close_matches(input_lower, BREED_LOOKUP.keys(), n=1, cutoff=0.6)
    
    if matches:
        best_match = matches[0]
        corrected = BREED_LOOKUP[best_match]
        return (corrected, True, input_breed)
    
    # No match found - return title-cased original
    return (input_breed.title(), False, None)


def get_breed_suggestions(partial_input: str, limit: int = 5) -> list:
    """
    Get breed name suggestions based on partial input.
    
    Args:
        partial_input: Partial breed name typed by user
        limit: Maximum number of suggestions
        
    Returns:
        List of suggested breed names
    """
    if not partial_input or len(partial_input) < 2:
        return []
    
    input_lower = partial_input.lower().strip()
    suggestions = []
    
    # Exact prefix matches first
    for breed in ALL_BREEDS:
        if breed.lower().startswith(input_lower):
            suggestions.append(breed)
            if len(suggestions) >= limit:
                return suggestions
    
    # Then partial matches
    for breed in ALL_BREEDS:
        if input_lower in breed.lower() and breed not in suggestions:
            suggestions.append(breed)
            if len(suggestions) >= limit:
                return suggestions
    
    # Finally, fuzzy matches
    fuzzy_matches = get_close_matches(input_lower, [b.lower() for b in ALL_BREEDS], n=limit - len(suggestions), cutoff=0.5)
    for match in fuzzy_matches:
        breed = next((b for b in ALL_BREEDS if b.lower() == match), None)
        if breed and breed not in suggestions:
            suggestions.append(breed)
    
    return suggestions[:limit]


def validate_breed(breed_name: str) -> dict:
    """
    Validate and correct a breed name.
    
    Args:
        breed_name: The breed name to validate
        
    Returns:
        Dict with validation result
    """
    corrected, was_corrected, original = normalize_breed_name(breed_name)
    
    return {
        "input": breed_name,
        "corrected": corrected,
        "was_corrected": was_corrected,
        "original": original,
        "is_valid": corrected.lower() in BREED_LOOKUP or was_corrected,
        "suggestions": get_breed_suggestions(breed_name, 3) if not was_corrected and corrected.lower() not in BREED_LOOKUP else []
    }
