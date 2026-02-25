"""
Breed Mention Detector & Mismatch Alert System
===============================================
Instrumentation for tracking "Intermittent personalisation mismatch (breed mention)"

This module:
1. Detects breed mentions in Mira's responses
2. Compares mentioned breed against active pet's actual breed
3. Logs mismatches with full context for debugging
4. Provides hard evidence for intermittent breed substitution issues

Created: Feb 19, 2026
Status: Instrumented - monitoring for intermittent issues
"""

import re
import logging
from typing import Dict, Optional, List, Tuple
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Curated list of common dog breeds for detection
# Organized by category for efficient matching
BREED_PATTERNS = {
    # Small breeds
    "chihuahua": r'\bchihuahua\b',
    "pomeranian": r'\bpomeranian\b',
    "shih tzu": r'\bshih\s*tzu\b',
    "maltese": r'\bmaltese\b',
    "yorkshire terrier": r'\byorkshire\s*terrier\b|\byorkie\b',
    "pug": r'\bpug\b',
    "french bulldog": r'\bfrench\s*bulldog\b|\bfrenchie\b',
    "boston terrier": r'\bboston\s*terrier\b',
    "cavalier king charles": r'\bcavalier\b',
    "papillon": r'\bpapillon\b',
    "maltipoo": r'\bmaltipoo\b',
    "havanese": r'\bhavanese\b',
    "bichon frise": r'\bbichon\b',
    "miniature schnauzer": r'\bminiature\s*schnauzer\b|\bmini\s*schnauzer\b',
    "pekingese": r'\bpekingese\b',
    "lhasa apso": r'\blhasa\s*apso\b',
    "toy poodle": r'\btoy\s*poodle\b',
    "miniature poodle": r'\bminiature\s*poodle\b|\bmini\s*poodle\b',
    "dachshund": r'\bdachshund\b|\bwiener\s*dog\b',
    "jack russell": r'\bjack\s*russell\b',
    "cocker spaniel": r'\bcocker\s*spaniel\b',
    "beagle": r'\bbeagle\b',
    
    # Medium breeds
    "labrador": r'\blabrador\b|\blab\b',
    "golden retriever": r'\bgolden\s*retriever\b',
    "german shepherd": r'\bgerman\s*shepherd\b|\bgsd\b',
    "bulldog": r'\bbulldog\b',
    "poodle": r'\bpoodle\b',
    "rottweiler": r'\brottweiler\b|\brottie\b',
    "boxer": r'\bboxer\b',
    "husky": r'\bhusky\b|\bsiberian\s*husky\b',
    "doberman": r'\bdoberman\b',
    "australian shepherd": r'\baustralian\s*shepherd\b|\baussie\b',
    "border collie": r'\bborder\s*collie\b',
    "great dane": r'\bgreat\s*dane\b',
    "bernese mountain dog": r'\bbernese\b',
    "saint bernard": r'\bsaint\s*bernard\b|\bst\.\s*bernard\b',
    "newfoundland": r'\bnewfoundland\b',
    "samoyed": r'\bsamoyed\b',
    "akita": r'\bakita\b',
    "shiba inu": r'\bshiba\s*inu\b|\bshiba\b',
    "chow chow": r'\bchow\s*chow\b|\bchow\b',
    "shar pei": r'\bshar\s*pei\b',
    "dalmatian": r'\bdalmatian\b',
    "weimaraner": r'\bweimaraner\b',
    "vizsla": r'\bvizsla\b',
    "pointer": r'\bpointer\b',
    "setter": r'\bsetter\b',
    "collie": r'\bcollie\b',
    "corgi": r'\bcorgi\b|\bpembroke\b|\bcardigan\b',
    
    # Indian breeds
    "indie": r'\bindie\b|\bindian\s*pariah\b',
    "rajapalayam": r'\brajapalayam\b',
    "mudhol hound": r'\bmudhol\b',
    "kombai": r'\bkombai\b',
    "chippiparai": r'\bchippiparai\b',
}

# Patterns that indicate breed is being mentioned in context
BREED_CONTEXT_PATTERNS = [
    r'as\s+a\s+(\w+(?:\s+\w+)?)',           # "as a Maltese"
    r'since\s+(?:she|he|they)\'?s?\s+a\s+(\w+(?:\s+\w+)?)',  # "since she's a Shih Tzu"
    r'being\s+a\s+(\w+(?:\s+\w+)?)',         # "being a Labrador"
    r'(\w+(?:\s+\w+)?)\s+(?:dogs?|breeds?)\s+(?:are|tend|typically|often|usually)',  # "Maltese dogs are..."
    r'(?:like|as)\s+most\s+(\w+(?:\s+\w+)?)', # "like most Poodles"
    r'(\w+(?:\s+\w+)?)\s+(?:is|are)\s+(?:known|prone|famous)',  # "Shih Tzus are known..."
]


def normalize_breed(breed: str) -> str:
    """Normalize breed name for comparison"""
    if not breed:
        return ""
    return breed.lower().strip().replace("-", " ").replace("_", " ")


def detect_breeds_in_text(text: str) -> List[Tuple[str, str]]:
    """
    Detect all breed mentions in text.
    
    Returns:
        List of tuples: (normalized_breed_name, matched_text)
    """
    if not text:
        return []
    
    text_lower = text.lower()
    found_breeds = []
    
    for breed_name, pattern in BREED_PATTERNS.items():
        matches = re.finditer(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            found_breeds.append((breed_name, match.group()))
    
    return found_breeds


def check_breed_mismatch(
    response_text: str,
    active_pet_id: str,
    active_pet_name: str,
    active_pet_breed: str,
    request_context: Dict
) -> Optional[Dict]:
    """
    Check if response contains a breed mention that doesn't match the active pet.
    
    Returns:
        None if no mismatch, or Dict with mismatch details for logging
    """
    if not response_text or not active_pet_breed:
        return None
    
    # Detect all breeds mentioned in response
    mentioned_breeds = detect_breeds_in_text(response_text)
    
    if not mentioned_breeds:
        return None  # No breeds mentioned, no mismatch possible
    
    # Normalize the active pet's breed for comparison
    active_breed_normalized = normalize_breed(active_pet_breed)
    
    # Check for mismatches
    mismatches = []
    for breed_name, matched_text in mentioned_breeds:
        breed_normalized = normalize_breed(breed_name)
        
        # Check if this is a mismatch (not the active pet's breed)
        # Allow for partial matches (e.g., "poodle" matches "toy poodle")
        is_match = (
            breed_normalized in active_breed_normalized or
            active_breed_normalized in breed_normalized or
            breed_normalized == active_breed_normalized
        )
        
        if not is_match:
            mismatches.append({
                "mentioned_breed": breed_name,
                "matched_text": matched_text,
            })
    
    if not mismatches:
        return None  # All breed mentions match the active pet
    
    # Build the mismatch alert
    alert = {
        "alert_type": "BREED_MENTION_MISMATCH",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "severity": "WARNING",
        
        # Pet context
        "active_pet_id": active_pet_id,
        "active_pet_name": active_pet_name,
        "active_pet_breed": active_pet_breed,
        "active_pet_breed_normalized": active_breed_normalized,
        
        # Mismatch details
        "mismatches": mismatches,
        "mentioned_breeds": [m["mentioned_breed"] for m in mismatches],
        
        # Request context
        "session_id": request_context.get("session_id"),
        "ticket_id": request_context.get("ticket_id"),
        "conversation_id": request_context.get("conversation_id"),
        "mode": request_context.get("mode"),
        "pillar": request_context.get("pillar"),
        "user_message": request_context.get("user_message", "")[:200],  # Truncate for logging
        
        # Response snippet (for context)
        "response_snippet": response_text[:500] if len(response_text) > 500 else response_text,
    }
    
    return alert


def log_breed_mention_check(
    response_text: str,
    active_pet_id: str,
    active_pet_name: str,
    active_pet_breed: str,
    request_context: Dict
) -> bool:
    """
    Main entry point: Check response for breed mismatches and log if found.
    
    Returns:
        True if mismatch was detected and logged, False otherwise
    """
    mismatch = check_breed_mismatch(
        response_text=response_text,
        active_pet_id=active_pet_id,
        active_pet_name=active_pet_name,
        active_pet_breed=active_pet_breed,
        request_context=request_context
    )
    
    if mismatch:
        # Log the mismatch with high visibility
        logger.warning(
            f"[BREED-MISMATCH-ALERT] Intermittent personalisation mismatch detected!\n"
            f"  Active Pet: {active_pet_name} ({active_pet_id})\n"
            f"  Expected Breed: {active_pet_breed}\n"
            f"  Mentioned Breeds: {mismatch['mentioned_breeds']}\n"
            f"  Session: {mismatch.get('session_id')}\n"
            f"  Ticket: {mismatch.get('ticket_id')}\n"
            f"  Mode: {mismatch.get('mode')}\n"
            f"  Pillar: {mismatch.get('pillar')}\n"
            f"  Response Snippet: {mismatch.get('response_snippet', '')[:200]}..."
        )
        
        # Also log structured data for aggregation
        logger.info(f"[BREED-MISMATCH-DATA] {mismatch}")
        
        return True
    
    # Log that check passed (only at debug level to avoid noise)
    breeds_found = detect_breeds_in_text(response_text)
    if breeds_found:
        logger.debug(
            f"[BREED-CHECK-PASS] Breeds mentioned match active pet. "
            f"Pet: {active_pet_name} ({active_pet_breed}), "
            f"Mentioned: {[b[0] for b in breeds_found]}"
        )
    
    return False


# Convenience function for quick checks
def quick_breed_check(response: str, expected_breed: str) -> Tuple[bool, List[str]]:
    """
    Quick check if response contains any breed that doesn't match expected.
    
    Returns:
        (has_mismatch, list_of_mismatched_breeds)
    """
    if not response or not expected_breed:
        return False, []
    
    expected_normalized = normalize_breed(expected_breed)
    mentioned = detect_breeds_in_text(response)
    
    mismatched = []
    for breed_name, _ in mentioned:
        breed_normalized = normalize_breed(breed_name)
        if breed_normalized not in expected_normalized and expected_normalized not in breed_normalized:
            mismatched.append(breed_name)
    
    return len(mismatched) > 0, mismatched
