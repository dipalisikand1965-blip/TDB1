# MIRA OS CORE DOCTRINE
## Mandatory System Behaviour - READ FIRST BEFORE ANY DEVELOPMENT

> **CRITICAL: This is system doctrine level. Not feature level.**
> **Every agent working on Mira MUST read this document first.**

---

## The One Truth

**Mira is NOT a chatbot.**
**Mira is a memory-driven pet operating system.**

Everything depends on memory.
If memory is not complete, persistent, and evolving — the OS is broken.

---

## 1. Mira is a Memory System First. Conversation Second.

Mira must operate on the principle:

**Every pet has a continuously evolving intelligence profile.**

This profile is built from:
- Soul questionnaire responses (55+ structured answers)
- Pet dashboard inputs
- Behaviour observations
- Service history
- Purchase history
- Health flags
- Environmental context
- Conversation signals
- Inferred traits
- Time-based changes

**Conversation is only an interface.**
**Memory is the system.**

If memory is not being captured, structured, and reused —
Mira is not functioning as an operating system.

---

## 2. Soul Questionnaire = Permanent Intelligence Layer

All answers from the Soul form must be:

- ✔ stored permanently
- ✔ structured (not raw text only)
- ✔ indexed by trait category
- ✔ versioned over time
- ✔ editable but never overwritten
- ✔ usable in reasoning immediately

Each answer must map to one or more intelligence domains:

| Domain | Description |
|--------|-------------|
| temperament | Overall disposition |
| emotional_profile | Emotional responses |
| sensitivities | Allergies, fears, triggers |
| social_patterns | Behavior with dogs/humans |
| behavioural_triggers | What causes reactions |
| food_preferences | Likes, dislikes, allergies |
| energy_rhythms | Activity patterns |
| stress_signals | Signs of anxiety |
| comfort_environments | Where they feel safe |
| routine_dependencies | Schedule needs |
| bonding_style | Attachment patterns |
| training_response | Learning style |
| health_risk_predispositions | Breed-specific concerns |

**This is not form data.**
**This is the pet's psychological + behavioural model.**

---

## 3. Every Interaction Updates Memory

Every conversation must be treated as new data about the pet.

Mira must extract and store:
- expressed preferences
- behavioural descriptions
- user concerns
- recurring needs
- scheduling patterns
- emotional language about the pet
- environment changes
- health mentions
- reactions to products/services
- decision patterns

### Example:

User says: *"Mojo gets anxious when guests visit"*

System must store:
```json
{
  "behaviour_trait": "guest_anxiety",
  "context": "home_visitors",
  "trigger_type": "social_unfamiliarity",
  "intensity": "inferred",
  "confidence_score": "medium",
  "source": "conversation",
  "timestamp": "2026-02-12T08:30:00Z"
}
```

This must update the pet intelligence profile **automatically**.
**No manual tagging.**

---

## 4. Structured Memory Model (Required)

Memory must exist in layers:

### A. Core Identity (static)
- Breed, age, size, health flags, etc.

### B. Soul Intelligence (deep profile)
- 55+ questionnaire + derived traits

### C. Behavioural Observations (dynamic)
- What the pet does in real life

### D. Lifestyle Patterns (temporal)
- Routines, frequency, environment

### E. Service & Care History
- Everything arranged, consumed, attempted

### F. Interaction Intelligence
- What the parent talks about repeatedly

### G. Predictive Signals
- Risks, needs, emerging patterns

---

## 5. Mira Must Always Reason From Memory First

Before generating any response, Mira must:

1. **Retrieve** pet intelligence profile
2. **Retrieve** relevant traits for current topic
3. **Apply filters:**
   - health
   - sensitivity
   - temperament
   - environment
   - behaviour patterns
4. **Then respond**

**If Mira asks for information that already exists → system failure.**

---

## 6. Memory Must Be Continuously Enriched

Each time the user:
- ✔ books a service
- ✔ buys something
- ✔ rejects something
- ✔ asks a question
- ✔ describes behaviour
- ✔ expresses concern

**Mira must learn something.**

No interaction is neutral.

---

## 7. Personalisation Hierarchy (Non-Negotiable)

All decisions must follow this order:

1️⃣ **This specific pet's intelligence**
2️⃣ This pet's environment
3️⃣ This pet's history
4️⃣ General breed knowledge
5️⃣ Veterinary best practice
6️⃣ Generic dog logic

**Never reverse this.**
**Mira must always be "this dog first".**

---

## 8. No Human Memory. Only System Memory.

The system must behave as if:

**Humans forget.**
**Mira never forgets.**

Users must never need to repeat:
- sensitivities
- preferences
- behaviour patterns
- history
- routines
- context already provided

**If repetition is required → memory architecture failure.**

---

## 9. Continuous Profile Growth

The pet intelligence profile must be treated as:

**A living entity.**

It must:
- ✔ grow in depth
- ✔ refine confidence levels
- ✔ detect contradictions
- ✔ detect change over time
- ✔ surface evolution insights

### Example:
*"Mojo used to be social but now avoids dogs"*

System detects **behavioural shift** and updates profile with temporal versioning.

---

## 10. Soul Score Must Be Real Intelligence Depth

The Soul score must reflect:
- completeness of knowledge
- behavioural understanding depth
- predictive accuracy
- observation richness

**Not form completion.**

---

## 11. Conversation Must Feed Intelligence Engine

Each chat turn must trigger:

1. Intent detection
2. Trait extraction
3. Behaviour inference
4. Memory update candidate
5. Confidence scoring
6. Intelligence graph update

**This must happen silently.**

---

## 12. If Memory Fails, OS Fails

If the system behaves like:
- ❌ a recommender
- ❌ a chatbot
- ❌ a marketplace
- ❌ a FAQ engine

Then **Mira OS is not functioning.**

Mira must behave like:
**A lifelong cognitive model of the pet.**

---

## Technical Implementation Requirements

### Minimum required components:

- ✔ persistent pet intelligence database
- ✔ structured trait schema
- ✔ memory ingestion pipeline
- ✔ conversation signal extraction
- ✔ trait inference engine
- ✔ confidence scoring model
- ✔ temporal versioning
- ✔ reasoning retrieval layer
- ✔ cross-pillar intelligence access

### Pet Context Pack (Retrieved Before Every Response)

```json
{
  "pet_id": "pet-xxx",
  "name": "Mystique",
  "core_identity": { ... },
  "soul_intelligence": { ... },
  "behavioural_observations": [ ... ],
  "lifestyle_patterns": { ... },
  "service_history": [ ... ],
  "interaction_intelligence": { ... },
  "predictive_signals": [ ... ],
  "unanswered_soul_questions": [ ... ]
}
```

### Dynamic Soul Questions

Suggested questions from the Mira Soul Board must:
1. Be derived from **unanswered questions** in the profile
2. Dynamically update on the dashboard
3. When answered, immediately store into the profile
4. Be used immediately in the next interaction

---

## Final Product Definition

### Mira is:

| NOT | IS |
|-----|-----|
| a conversation tool | A continuously learning digital cognitive model of each pet |
| a recommendation engine | A memory-first operating system |
| a service marketplace | A lifelong companion that knows the pet better than anyone |
| a FAQ engine | A true pet operating system |

---

## Summary for Agents

**Mira OS is a memory-first system.**

1. Every Soul answer must be stored as structured, versioned data
2. Every Soul answer must be converted into a trait graph with confidence
3. Every chat turn must generate events + trait updates
4. Before Mira replies, system must retrieve Pet Context Pack
5. Mira is PROHIBITED from asking for known data
6. Picks must re-rank every turn using catalogue-first, concierge-always
7. Picks must switch by active pillar automatically
8. If memory isn't persisted + reused, Mira becomes a chat tool — **which is a product failure**

---

*This doctrine supersedes all other documentation.*
*Created: February 12, 2026*
*Status: MANDATORY*
