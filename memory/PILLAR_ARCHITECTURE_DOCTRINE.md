# MIRA OS - Pillar Architecture Doctrine
## LOCKED DECISIONS - DO NOT CHANGE

---

## The Fundamental Rule

> **A pillar must represent a fundamental LIFE DOMAIN of the pet — not a service type, tool type, or content format.**

| Layer | Describes | Examples |
|-------|-----------|----------|
| **Pillars** | How a pet LIVES | celebrate, dine, stay, travel, care, enjoy, fit, learn |
| **Services** | How humans HELP | grooming, photography, boarding, training sessions |
| **Products** | What SUPPORTS that help | food, toys, carriers, brushes |

**Never mix these layers.**

---

## Locked Structural Decisions

### 1. GROOMING → Inside CARE (NOT a pillar)

**Why:** Grooming is a care modality, not a life domain.

CARE represents:
- Hygiene
- Prevention  
- Maintenance
- Physical wellbeing routines

Grooming fits perfectly inside that.

**Structure:**
```
CARE (pillar)
├── Grooming (service)
├── Dental hygiene (service)
├── Parasite prevention (service)
├── Skin & coat health (service)
├── Routine wellness (service)
└── Hygiene maintenance (service)
```

---

### 2. SHOP → NOT a pillar (Execution Layer)

**Why:** Mira OS is life-led, not commerce-led.

Shopping is a supply mechanism, not a life domain.

Products belong to the pillar they SERVE:
- Food → DINE
- Toys → ENJOY
- Grooming tools → CARE
- Travel carrier → TRAVEL
- Training gear → LEARN

**If SHOP becomes a pillar, the system becomes marketplace-shaped. That destroys OS purity.**

**Where shopping lives:** SERVICES execution layer.

Users never "go shopping". They:
- Arrange
- Replenish
- Prepare
- Support life needs

**This is a concierge OS, not Amazon.**

---

### 3. PET PHOTOGRAPHY → Inside CELEBRATE (NOT a pillar)

**Why:** Photography is contextual, not foundational.

It appears during:
- Birthday
- Milestone
- Adoption day
- Memorial
- Seasonal shoot
- Personality portrait

That is emotional celebration.

**Structure:**
```
CELEBRATE (pillar)
├── Party planning (service)
├── Memory creation (service)
├── Photography (service)
├── Keepsakes (service)
├── Rituals (service)
└── Milestones (service)
```

---

### 4. YOUTUBE → Inside LEARN (Curated only, NOT content feed)

**Why:** LEARN is structured knowledge, not content browsing.

**DO NOT build:**
- ❌ Video feed
- ❌ Content library
- ❌ Endless scrolling

**DO build:**
- ✅ Curated learning modules
- ✅ Guided topics
- ✅ Structured education
- ✅ Contextual learning triggers

**Videos are supporting media, not primary object.**

**Correct implementation:**
```
LEARN module contains:
├── Training guide → may include 1 curated video
├── First aid guide → may include 1 curated video
├── Coat care guide → may include 1 curated video
```

Video supports understanding. Video is never the destination.

---

## Pillar Integrity Test

Before adding anything as a pillar, ask:

1. **Does this describe how a pet LIVES?** (Yes = potential pillar)
2. **Does this describe how humans HELP?** (Yes = service, not pillar)
3. **Does this describe what SUPPORTS that help?** (Yes = product, not pillar)
4. **Is this a tool, format, or mechanism?** (Yes = NOT a pillar)

---

## Current Valid Pillars

| Pillar | Life Domain |
|--------|-------------|
| **CELEBRATE** | Joy, milestones, occasions |
| **DINE** | Nutrition, eating, food life |
| **STAY** | Home, rest, sleeping, alone time |
| **TRAVEL** | Movement, journeys, transport |
| **CARE** | Health, hygiene, wellness, maintenance |
| **ENJOY** | Play, activities, social life |
| **FIT** | Exercise, weight, physical conditioning |
| **LEARN** | Training, education, behavior |
| **PAPERWORK** | Documentation, records, compliance |
| **ADVISORY** | General guidance, advice |
| **EMERGENCY** | Urgent situations, crises |
| **FAREWELL** | Grief, memorial, loss |
| **ADOPT** | New pet, rescue, fostering |

---

## What is NOT a Pillar

| NOT a Pillar | Why | Where it Lives |
|--------------|-----|----------------|
| Grooming | Service modality | CARE services |
| Shop | Fulfillment mechanism | SERVICES execution |
| Photography | Contextual service | CELEBRATE services |
| Boarding | Stay service | STAY services |
| Daycare | Stay service | STAY services |
| Dog Walking | Care service | CARE services |
| Training sessions | Learn service | LEARN services |

---

*Doctrine locked: February 12, 2026*
*Author: Product Architecture Decision*
*Status: PERMANENT - DO NOT MODIFY WITHOUT PRODUCT REVIEW*
