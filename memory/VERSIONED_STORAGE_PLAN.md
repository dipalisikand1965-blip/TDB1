# MIRA OS - Versioned Storage & Intelligence Depth Implementation Plan

## P1: Versioned Storage Implementation

### Goal
Implement temporal versioning for soul_answers and traits so Mira can detect behavioral shifts and maintain confidence evolution over time.

### Schema Design

#### 1. Soul Answers (Versioned)
```javascript
// Collection: soul_answers_versioned
{
  "_id": ObjectId,
  "pet_id": "pet-xxx",
  "field": "temperament",
  "value": "calm",
  "version": 1,
  "confidence": 95,
  "source": "soul_form",  // soul_form | conversation | inferred
  "evidence": ["User explicitly stated in Soul form"],
  "created_at": ISODate,
  "superseded_at": null,  // When a new version is created
  "superseded_by": null   // Reference to new version
}
```

#### 2. Traits (Derived Intelligence)
```javascript
// Collection: pet_traits
{
  "_id": ObjectId,
  "pet_id": "pet-xxx",
  "trait_type": "anxiety_trigger",
  "trait_value": "thunderstorms",
  "confidence": 70,
  "mention_count": 3,
  "first_observed": ISODate,
  "last_observed": ISODate,
  "evidence": [
    {"source": "conversation", "text": "gets anxious during thunderstorms", "date": ISODate},
    {"source": "conversation", "text": "hates thunderstorms", "date": ISODate}
  ],
  "contradictions": []  // For detecting behavioral shifts
}
```

### Implementation Steps

1. **Create Migration Script**
   - Copy existing `doggy_soul_answers` to `soul_answers_versioned`
   - Add version=1, confidence=100 (from form), source="soul_form"

2. **Update Memory Service**
   - When extracting traits from conversation:
     - Check if trait exists with lower confidence
     - If exists: increment `mention_count`, boost `confidence`, add evidence
     - If contradicts: add to `contradictions`, flag for review

3. **Create Versioning Functions**
   ```python
   async def update_soul_answer_with_version(db, pet_id, field, new_value, source):
       # Mark old version as superseded
       # Create new version with incremented version number
       # Return version history
   ```

4. **Add Behavioral Shift Detection**
   ```python
   async def detect_behavioral_shifts(db, pet_id):
       # Compare recent traits vs older traits
       # Flag significant changes (e.g., "was social, now avoids dogs")
       # Return list of detected shifts
   ```

---

## P2: Intelligence Depth Score Implementation

### Goal
Move beyond simple completion % to true intelligence depth that reflects:
- Quality of knowledge (confidence levels)
- Recency of observations
- Variety of sources (form vs conversation vs inferred)
- Behavioral pattern detection

### Intelligence Depth Formula

```
Intelligence Score = (
    Base Soul Score (40%) +
    Conversation Learning Score (30%) +
    Confidence Depth Score (20%) +
    Recency Bonus (10%)
)
```

### Scoring Components

#### 1. Base Soul Score (40 points max)
```python
# Questions answered from Soul form
base_score = (answered_questions / total_questions) * 40
```

#### 2. Conversation Learning Score (30 points max)
```python
# Signals extracted from conversations
signal_score = min(30, conversation_signals * 2)
# Bonus for variety of categories
variety_bonus = len(unique_categories) * 2
learning_score = signal_score + variety_bonus
```

#### 3. Confidence Depth Score (20 points max)
```python
# Average confidence across all traits
avg_confidence = sum(trait.confidence for trait in traits) / len(traits)
# Bonus for high-confidence confirmed traits
confirmed_bonus = len([t for t in traits if t.confidence >= 85]) * 2
depth_score = (avg_confidence / 100) * 15 + min(5, confirmed_bonus)
```

#### 4. Recency Bonus (10 points max)
```python
# Recent learnings boost score
recent_signals = signals_in_last_7_days
recency_score = min(10, recent_signals * 1)
```

### Intelligence Tiers

| Score Range | Tier | Label | Description |
|-------------|------|-------|-------------|
| 0-20 | 1 | Curious Pup | Just getting to know each other |
| 21-40 | 2 | Growing Bond | Building understanding |
| 41-60 | 3 | Trusted Guardian | Solid knowledge base |
| 61-80 | 4 | Deep Connection | Rich behavioral model |
| 81-100 | 5 | Soulmate | Complete cognitive model |

### Implementation Steps

1. **Create Intelligence Calculator Service**
   ```python
   # /app/backend/services/intelligence_score.py
   async def calculate_intelligence_score(db, pet_id) -> dict:
       return {
           "total_score": 75,
           "tier": "Deep Connection",
           "breakdown": {
               "base_soul": 32,
               "conversation_learning": 25,
               "confidence_depth": 12,
               "recency_bonus": 6
           },
           "next_tier_at": 81,
           "suggestions": ["Answer 3 more Soul questions", "Chat about routines"]
       }
   ```

2. **Add API Endpoint**
   ```python
   @router.get("/intelligence-score/{pet_id}")
   async def get_intelligence_score(pet_id: str, db=Depends(get_db)):
       return await calculate_intelligence_score(db, pet_id)
   ```

3. **Update Frontend Components**
   - Replace simple % with Intelligence Score ring
   - Show tier badge in PetSelector
   - Display breakdown in MemoryIntelligenceCard

---

## Implementation Timeline

### Week 1: Versioned Storage
- Day 1-2: Create migration script, new collections
- Day 3-4: Update memory service for version tracking
- Day 5: Add behavioral shift detection

### Week 2: Intelligence Depth
- Day 1-2: Create intelligence calculator service
- Day 3-4: Update API and frontend
- Day 5: Testing and polish

---

## Files to Create/Modify

### New Files
- `/app/backend/services/intelligence_score.py`
- `/app/backend/services/versioned_storage.py`
- `/app/backend/scripts/migrate_soul_answers.py`

### Modified Files
- `/app/backend/services/memory_service.py`
- `/app/backend/mira_routes.py`
- `/app/frontend/src/components/Mira/PetSelector.jsx`
- `/app/frontend/src/components/Mira/MemoryIntelligenceCard.jsx`

---

*Created: February 12, 2026*
