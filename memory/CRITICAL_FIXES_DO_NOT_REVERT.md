# CRITICAL FIXES - DO NOT REVERT

This document lists fixes that solve subtle bugs. Future agents MUST preserve these.

---

## 1. Intelligence Score - Dual Memory Source (Feb 12, 2026)

**File:** `/app/backend/services/intelligence_score.py` (lines 85-102)

**Problem:** Intelligence score was too low because it only checked the `conversation_memories` MongoDB collection, but memories are ALSO stored inline in `pet.conversation_memories` array.

**Fix:** Check BOTH sources and merge them.

**Test:** `curl /api/mira/intelligence-score/pet-e6348b13c975` should show `conversation_learning > 0`

**DO NOT:** Remove the inline memory fallback check. Both sources must be aggregated.

---

## 2. Pillar Detection - Word Boundary Matching (Feb 12, 2026)

**File:** `/app/backend/mira_routes.py` (lines 6028-6038)

**Problem:** Short keywords caused false positives via substring matching:
- "L**ola** needs a haircut" → matched "ola" (cab service) → wrong pillar "travel"
- "sc**ar**e" → matched "car" → wrong pillar "travel"

**Fix:** Use regex word boundaries (`\b`) for short keywords in `WORD_BOUNDARY_KEYWORDS` set.

**Test:** 
```python
detect_pillar("Lola needs a haircut")  # Must return "care", NOT "travel"
detect_pillar("Book an Ola cab")       # Must return "travel" (correct match)
```

**DO NOT:** Remove the `WORD_BOUNDARY_KEYWORDS` set or the `keyword_matches()` function.

---

## Test File

All fixes are verified in: `/app/backend/tests/test_mira_p0_fixes.py`

Run: `cd /app/backend && pytest tests/test_mira_p0_fixes.py -v`

---

*Last Updated: February 12, 2026*
