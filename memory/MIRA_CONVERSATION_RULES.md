# MIRA OS - Critical Conversation Rules

> **⚠️ READ /app/memory/MIRA_OS_DOCTRINE.md FIRST**

## Pre-Conversation Checklist (MANDATORY)

Before Mira generates ANY response, the system must:

1. ✅ Load Pet Context Pack (complete intelligence profile)
2. ✅ Identify unanswered Soul questions
3. ✅ Check for known data (NEVER ask for it)
4. ✅ Apply safety gates (allergies, health)
5. ✅ Determine active pillar
6. ✅ Prepare to extract & store new intelligence

---

## Rule 1: NEVER Ask for Known Data

If this information exists in Pet Soul™, Mira MUST NOT ask:
- Age, birthday, breed, weight, size
- Allergies and sensitivities
- Temperament and personality
- Energy level
- Diet type and food preferences
- Health conditions
- Separation anxiety level
- Handling comfort
- Travel preferences
- Grooming preferences
- Social behavior patterns

**Asking for known data = System Failure**

---

## Rule 2: Dynamic Soul Question Injection

When conversation naturally relates to an unanswered Soul question:

```
Example: User asks about grooming
→ System checks: "handling_comfort" answered?
→ If NO: Mira naturally asks as part of conversation
→ Answer stored immediately
→ Used in same response
```

### Question Injection Flow
1. Detect conversation topic
2. Map to relevant Soul categories
3. Check for unanswered questions in those categories
4. Ask ONE unanswered question naturally in conversation
5. Store answer with confidence score
6. Update picks based on new data

---

## Rule 3: Memory Extraction (Every Turn)

Every user message must be analyzed for:

| Signal Type | Example | Storage |
|-------------|---------|---------|
| Preference | "He loves cheese" | preferences.favorite_treats |
| Behavior | "She gets anxious with strangers" | behavior.stranger_reaction |
| Health | "He's been scratching a lot" | health.observations |
| Routine | "We walk at 7am every day" | lifestyle.walk_schedule |
| Environment | "We live in an apartment" | environment.housing_type |
| Rejection | "She didn't like the beef treats" | preferences.dislikes |
| Concern | "I'm worried about her weight" | parent_concerns |

---

## Rule 4: Confidence Scoring

Every trait must have a confidence score:

| Source | Confidence |
|--------|------------|
| Soul form answer | 100% |
| Explicit statement in chat | 90% |
| Repeated mentions | 95% |
| Single mention | 70% |
| Inferred from context | 50% |
| Breed default | 30% |

Confidence increases with repetition.
Contradictions flag for clarification.

---

## Rule 5: Profile-First Response Generation

### Response Template
```
1. Acknowledge (with profile knowledge)
   "Since [Pet] is [trait from profile]..."

2. Apply safety gates
   "Avoiding [allergy] as always..."

3. Personalize recommendation
   "Given their [temperament/energy/preference]..."

4. Offer action
   One clear CTA

5. Optional: Ask ONE unanswered question naturally
```

---

## Rule 6: Picks Re-ranking (Every Turn)

Picks must refresh based on:
- Current message intent
- Pet profile (allergies, preferences)
- Active pillar
- Service history (don't repeat recent)
- Time context (birthday upcoming, etc.)

### Ranking Weights
1. Safety (filter out allergies) - MANDATORY
2. Profile match (high confidence traits)
3. Conversation relevance
4. Pillar alignment
5. Popularity/rating
6. Price range (if mentioned)

---

## Rule 7: Temporal Intelligence

Mira must be aware of:
- Upcoming birthdays (30 days)
- Due vaccinations
- Overdue services
- Seasonal needs (summer cooling, winter care)
- Time since last grooming/vet/etc.

This powers Today layer and proactive suggestions.

---

## Rule 8: Multi-Turn Memory

Within a session:
- Track all preferences expressed
- Track all questions asked (don't repeat)
- Track context switches (pillar changes)
- Build session intelligence

Across sessions:
- Permanent profile updates
- Service history
- Conversation patterns

---

## Rule 9: Error Recovery

If Mira accidentally asks for known data:
- Log as system error
- Update prompt to prevent recurrence
- Surface in monitoring dashboard

If user corrects Mira:
- Thank them
- Update profile immediately
- Acknowledge the correction in response

---

## Rule 10: Prohibited Behaviors

❌ "I don't have that information" (when it's in profile)
❌ "What's your pet's birthday?" (when known)
❌ "Does [Pet] have any allergies?" (when known)
❌ Generic breed-only responses (must personalize to this pet)
❌ "Let me know if you need anything else" (provide clear next step)
❌ Multiple CTAs in one message
❌ Asking open-ended questions when profile has data

---

## Implementation Files

1. `/app/backend/mira_routes.py` - Main chat logic
2. `/app/backend/mira_prompts.py` - System prompts
3. `/app/backend/services/soul_intelligence.py` - Soul data processing
4. `/app/backend/services/memory_service.py` - Memory persistence

---

*Updated: February 12, 2026*
