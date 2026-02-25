# SINGLE SOURCE OF TRUTH: Fresh Meals Tab

**Last Updated:** December 2025  
**Status:** IN PROGRESS  
**URL:** `/dine/meals`

---

## WHAT EXISTS RIGHT NOW

### Frontend Files
| File | Purpose | Status |
|------|---------|--------|
| `/app/frontend/src/pages/MealsPage.jsx` | Main Fresh Meals page | UPDATED - has curated section on top |
| `/app/frontend/src/components/dine/FreshMealsTab.jsx` | Tab component (NOT USED - was prototype) | DEPRECATED |

### What's Live on `/dine/meals`
1. **Pet Control Center** (sticky bar)
   - Shows: "For: Mystique" + "No chicken" badge
   - CTA: "Build Fresh Plan"
   
2. **Fresh Meals Hero**
   - Allergy-aware image (shows salmon if pet avoids chicken)
   - "Fresh Meals for {petName}"
   - Truth badges in pill container

3. **CuratedConciergeSection** 
   - Currently showing WRONG cards (Dine Out cards, not Fresh Meals)
   - Needs to be replaced with stub or proper cards

4. **Plan Builder Row**
   - Goal chips (max 2)
   - Protein chips (PARTIALLY FIXED - chicken should be disabled if avoided)
   - Allergy-safe toggle
   - Cadence chips
   - Budget chips

5. **3 Canonical Cards**
   - Trial Pack for {Pet}
   - Allergy-Safe Fresh Plan
   - Weekly Fresh Plan Setup
   - Card IDs are FIXED FOREVER (see below)

6. **How It Works Strip**
   - 3-step trust cue

7. **Original Catalogue Content** (below curated section)
   - Product grid
   - Category filters

---

## CANONICAL CARD IDs (NEVER CHANGE)

```javascript
const CANONICAL_CARD_IDS = {
  TRIAL_PACK: 'fresh-trial-pack',
  WEEKLY_PLAN: 'fresh-weekly-plan',
  ALLERGY_SAFE: 'fresh-allergy-safe'
};
```

---

## GENERATED IMAGES

| Slug | URL | Purpose |
|------|-----|---------|
| Hero (default) | `84cb230bb28acc363cdf69d0a236b1efac3ec8bf0b82c9c8648399580ada71e2.png` | Standard meal prep |
| Hero (no chicken) | `04c6413f93f0795b99ecf949db068eff7fda67337520ee7eeb58f6568ef825be.png` | Salmon/fish based |
| Trial Pack thumb | `12367d24c74c1aba4244ccde37017f2cf701712d58736c46f124d3e30231abba.png` | Card thumbnail |
| Weekly Plan thumb | `415582023c2d4c46c52ccad4c47ce6638d336fa0f5be0a48c548f456d7428717.png` | Card thumbnail |
| Allergy-Safe thumb | `61266dddd1206782be033035c8f847025fd296df495029a9f402ade7229ddfce.png` | Card thumbnail |

Base URL: `https://static.prod-images.emergentagent.com/jobs/99ab70cf-a57b-46c1-987d-9e895d2af777/images/`

---

## WHAT'S BROKEN / INCOMPLETE

### Critical Issues
1. **Chicken chip not disabled** - If pet avoids chicken, the Chicken protein chip should be greyed out and unclickable. Code was being added when stopped.

2. **Wrong curated cards showing** - CuratedConciergeSection shows "Dining-Out Kit", "Reserve Table" etc. instead of Fresh Meals cards.

3. **Card CTAs don't work** - Currently just show toast. Need FlowModal implementation.

4. **Card thumbnails not allergy-aware** - Trial Pack image may show chicken. Needs same logic as hero.

### Missing Features
1. **FlowModal component** - Multi-step intake flow (5 questions max)
2. **Build Fresh Plan bottom sheet** - 3 options (Trial/Weekly/Allergy-Safe)
3. **Ticket creation on submit** - Connect to service desk
4. **Post-submit confirmation** - Toast + "Open request" button
5. **Resume flow** - draft_id system for continuing incomplete flows

---

## ARCHITECTURE DECISIONS MADE

### 1. Tab vs Dedicated Page
**Decision:** Use dedicated page `/dine/meals` (not tab inside DinePage)
**Reason:** Maintains existing URL structure, better for SEO

### 2. FlowModal Approach
**Decision:** Single reusable `<FlowModal>` component with schema
**Reason:** Prevents drift, consistent UX, easy to extend

### 3. Curated Section Position
**Decision:** ON TOP of catalogue, not replacing it
**Reason:** User explicitly requested "position on top, don't replace"

### 4. Notification System
**Decision:** Use existing WebSocket system
**Reason:** Already built, proven to work

---

## TICKET PAYLOAD STRUCTURE

```javascript
{
  "type": "FRESH_MEALS_TRIAL_PACK",
  "pillar": "dine",
  "sub_pillar": "fresh_meals",
  "card_id": "fresh-trial-pack",
  "draft_id": "draft-uuid-xxx",
  "pet_id": "pet-xxx",
  "pet_name": "Mystique",
  "context_source": "dine/fresh-meals",
  "plan_builder": {
    "goals": ["tummy"],
    "protein": "fish",
    "allergy_safe": true,
    "cadence": "weekly",
    "budget": 2
  },
  "flow_answers": {
    "size": "M",
    "allergies_confirmed": ["chicken"],
    "meals_per_day": 2
  }
}
```

---

## FLOW SCHEMAS (TO BE BUILT)

### Trial Pack Flow (5 questions)
1. Pet size/weight
2. Primary goal (prefill from planBuilder)
3. Confirm allergies
4. Meals per day
5. Budget + delivery window

### Weekly Plan Flow (5 questions)
1. Fresh only or mixed with kibble?
2. Portion method
3. Delivery cadence
4. Storage reality
5. Budget band

### Allergy-Safe Flow (5 questions)
1. Confirm allergen list + severity
2. Allowed proteins (blocked ones disabled)
3. Past reactions checklist
4. Treats/chews allowed?
5. Budget + cadence

---

## BUTTON BEHAVIORS (SPEC)

### "Build Fresh Plan" (Top CTA)
- Opens bottom sheet with 3 options
- If draft exists: shows "Resume" option first

### Card CTAs
- Open FlowModal with respective schema
- On submit: create ticket + show confirmation
- Route to inbox/ticket thread

### Plan Builder Chips
- Just capture intent (no API call)
- Prefill ticket metadata
- Blocked proteins are disabled

---

## NEXT STEPS (Priority Order)

1. **Fix chicken chip** - Disable when pet avoids chicken
2. **Fix card thumbnails** - Allergy-aware like hero
3. **Stub CuratedConciergeSection** - "Mira can set a plan" placeholder
4. **Build FlowModal** - Reusable component + 3 schemas
5. **Wire ticket creation** - Use existing service desk API
6. **Add notifications** - Use existing WebSocket
7. **Build backend cards** - `fresh_meals_concierge_cards.py`

---

## TEST CREDENTIALS

- **Member:** dipali@clubconcierge.in / test123
- **Admin:** aditya / lola4304

---

## RELATED DOCS

- `/app/memory/PRD.md` - Product requirements
- `/app/memory/AUDIT_CELEBRATE_DINE_PILLARS.md` - Pillar audit
- `/app/memory/MASTER_HANDOVER.md` - Full project context
