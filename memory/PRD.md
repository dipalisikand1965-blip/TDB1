# The Doggy Company® — Pet Life Operating System
## Product Requirements Document — MASTER
## Last Updated: Mar 2026 (Session 18 — Celebration Wall Bug Fixes COMPLETE)

---

## ✅ SESSION 18 COMPLETE — Celebration Wall Bug Fixes (Mar 2026)

**All 8 tests passed (100% pass rate)**

### Bugs Fixed:
| Bug | Fix | Status |
|---|---|---|
| Lightbox close (X) button invisible/unusable | WallLightbox.jsx: position:fixed, zIndex:9999, white background at top:20 right:20 | ✅ FIXED |
| Uploaded photo not appearing instantly on wall | CelebrationMemoryWall.jsx: optimistic UI via submittedPhoto state | ✅ FIXED |
| Prop mismatch (petName vs pet) | CelebratePageNew.jsx: passes pet={selectedPet} not petName | ✅ FIXED |

### Components (LOCKED — do not change):
- **WallLightbox.jsx**: Close button — `position:fixed, top:20, right:20, zIndex:9999, background:#FFFFFF`
- **CelebrationMemoryWall.jsx**: `submittedPhoto` state shows user's photo at position 2 immediately
- **WallUploadModal.jsx**: Passes `{previewUrl, caption, celebType, city, miraComment}` via `onSubmitted`

---

---

## ✅ SESSION 12: Birthday Box Builder + Browse Drawer (Feb 2026)

---

## ✅ SESSION 15 COMPLETE (Mar 2026)
- Service Desk Birthday Box Orders tab — wired, 3-column layout, WhatsApp contact, slot assembly, allergy gate, notes, audit log
- Fixed "Confirm & Send to Concierge" button (stale closure + petId fallback)
- Removed redundant MiraAskBar from /celebrate-soul

---

## ✅ SESSION 16 COMPLETE — Celebrate Concierge® Redesign (Mar 2026)

**Source:** Celebrate_Concierge_MASTER.docx

### Implemented (ALL DONE):
| Task | File | Status |
|---|---|---|
| Update CTA card (title, description, stat, chips, button) | CelebrateConcierge.jsx | ✅ DONE |
| 8-card service grid | CelebrateServiceGrid.jsx (NEW) | ✅ DONE |
| Individual card component | CelebrateServiceCard.jsx (NEW) | ✅ DONE |
| 3-question Concierge Intake Modal | ConciergeIntakeModal.jsx (NEW) | ✅ DONE |
| Backend intake endpoint | POST /api/concierge/intake (unified flow) | ✅ DONE |

### Design (LOCKED — do not change):
- **CelebrateConcierge CTA**: dark `#0E0620` background, `45,000+` stat, 5 chips, gold gradient CTA button, 48h promise
- **CelebrateServiceGrid**: `"Celebrate, Personally"` section header, 4-col desktop / 2-col mobile grid
- **CelebrateServiceCard**: 180px illustration, `object-position: center top` (NEVER change), gold uppercase sub-label (BIRTHDAY, PHOTOSHOOT, CAKE, THE FULL DAY, GOTCHA DAY, SURPRISE, MILESTONE, VENUE), spec description, gold CTA link
- **ConciergeIntakeModal**: 3 questions (celebration type pre-selected from card, date picker + "Not sure yet", notes), gold gradient submit, confirmation screen
- **Backend intake unified flow**: `concierge_intakes` → `admin_notifications` → `service_desk_tickets` → `channel_intakes`

### Copy rules (FINAL — do not change):
- Title: `"Celebrate {petName} the way only you know how."`
- Description: `"45,000+ meals. Hundreds of birthdays..."` (see CelebrateConcierge.jsx)
- Chips: Birthday Celebrations · Pawty Planning · Memory & Portraits · Milestone Marking · Surprise Deliveries
- NEVER use: Browse, package, amazing, incredible, seamless

---

## ✅ SESSION 17 COMPLETE — Guided Celebration Paths (Mar 2026)

**Source:** GuidedCelebrationPaths_MASTER.docx | **Tested:** 17/17 passing

### Files built:
| File | Status |
|---|---|
| `GuidedCelebrationPaths.jsx` (rewrite) | ✅ DONE |
| `celebrationPaths.js` (NEW) | ✅ DONE |
| `GuidedPathCard.jsx` (NEW) | ✅ DONE |
| `GuidedPathExpansion.jsx` (NEW) | ✅ DONE |
| `GuidedPathStep.jsx` (NEW) | ✅ DONE |
| `PathDeliverableScreen.jsx` (NEW) | ✅ DONE |

### What works (LOCKED):
- 3 cards: Birthday (yellow) · Gotcha Day (green) · Photoshoot (pink) — exact pastel colours
- Section header NEW subtitle: "Mira walks you through every step. Each path ends with a plan you can keep."
- Expansion panel: spans all 3 columns, one-at-a-time, click-to-close, scrollIntoView
- Mira bar: path-specific italic voice + coloured bg gradient per path
- 5 sequential steps: step 1 active on open, steps 2-5 greyed until previous complete
- Each step CTA reveals an inline picker/input (themes, cakes, guests, timeline, etc.)
- Deliverable screen (dark bg) appears after all 4 interactive steps
- "Hand to Concierge 👑" → POST /api/concierge/intake (full unified flow)
- All card colours, chips, copy, step descriptions FINAL per master spec

---

### Core Principle:
Every path ends with a deliverable — not just steps. The Birthday Plan. The Gotcha Day Memory Card. The Shoot Day Brief. Something the pet parent can hold, save, share, or hand to the Concierge to execute entirely.

### Files to build:
| Task | File | Status |
|---|---|---|
| Update section header + card copy + chips | GuidedCelebrationPaths.jsx | TODO |
| Individual path card | GuidedPathCard.jsx (NEW) | TODO |
| Expansion panel | GuidedPathExpansion.jsx (NEW) | TODO |
| Individual step component | GuidedPathStep.jsx (NEW) | TODO |
| Deliverable screen | PathDeliverableScreen.jsx (NEW) | TODO |
| Path data | celebrationPaths.js (NEW) | TODO |

### Section header (FINAL):
- Title: `Guided celebration paths` (font-size: 2rem, font-weight: 800, color: #1A0030)
- Subtitle: `Mira walks you through every step. Each path ends with a plan you can keep.` (14px, #666)

### 3-card grid:
- Desktop: `repeat(3, 1fr)` · gap: 16px
- Tablet: `repeat(2, 1fr)`
- Mobile: `1fr`
- Card border-radius: 20px, padding: 24px

### Card colour system (LOCKED):
| Path | bg | accent | accentDark |
|---|---|---|---|
| Birthday | #FEFCE8 | #F59E0B | #92400E |
| Gotcha Day | #DCFCE7 | #16A34A | #14532D |
| Photoshoot | #FCE7F3 | #DB2777 | #831843 |

### 3 paths — card copy (FINAL):
| # | Title | Description | Visible chips | Hidden (+2) |
|---|---|---|---|---|
| 1 | Birthday party path | From theme to cake to guest list — plan {petName}'s full birthday in one guided flow. | Choose theme · Order cake · Guest list | Plan the day · Final birthday plan |
| 2 | Gotcha day path | Celebrate the day {petName} chose you. A quieter, more personal kind of celebration. | Find the date · Memory book · A quiet ritual | A gift for the day · Gotcha Day card |
| 3 | Pet photoshoot path | From outfit to location to photographer — capture {petName} at their most beautiful. | Choose location · Plan outfit · Find photographer | Prepare Mojo · Shoot Day Brief |

### 5 steps per path (FINAL — see celebrationPaths.js for full detail):
**Birthday**: Choose theme → Order cake → Guest list → Plan the day → Birthday Plan (deliverable)
**Gotcha Day**: Find the date → Memory book → A quiet ritual → A gift for the day → Gotcha Day Memory Card (deliverable)
**Photoshoot**: Choose location → Plan outfit → Find photographer → Prepare Mojo → Shoot Day Brief (deliverable)

### Expansion panel:
- Opens inline below card grid (grid-column: span 3)
- One at a time (opening one closes others)
- Click same card to close
- scrollIntoView after open

### Deliverables:
- **Birthday Plan**: Theme · Cake order · Guest list · Day timeline · Venue
- **Gotcha Day Memory Card**: 3 photos · gotcha date · caption · ritual note
- **Shoot Day Brief**: Location · Time · Outfit · Photographer · Prep notes
- All deliverables have: "Hand to Concierge 👑" → POST /api/concierge/intake

---

### WHAT IS IN PROGRESS:
**P0: Wire BirthdayBoxOrdersAdmin into AgentPortal.jsx — ✅ COMPLETE (Session 15)**
- Full 3-column layout: Order List | 6-Slot Manifest (checkboxes) | Action Panel (WhatsApp + Status + Notes + Log)
- Status transitions with server-side gates (allergy confirmation gate, slot assembly gate)
- WhatsApp pre-filled contact button + Email contact button
- Notes panel with instant append (no reload needed)
- Nav tab shows red badge with count of NEW orders
- 28 orders in DB, backend endpoints all verified
- Allergy confirmation gate server-side enforced
- Slot-by-slot assembly checkboxes with DB persistence
- Order log (audit trail) collapsible panel
- Personalisation panel (bandana name, cake message, delivery date, address)
- `BirthdayBoxOrdersAdmin.jsx` — FULLY BUILT (3-panel layout, status transitions, allergy banner, personalisation editing) ✅
- Backend endpoints — ALL BUILT (`GET/PATCH /api/admin/birthday-box-orders/*`) ✅
- Import already in `AgentPortal.jsx` ✅
- **28 birthday box orders exist in DB** ✅
- **MISSING:**
  - Render block `{activeTab === 'birthday_box_orders' && <BirthdayBoxOrdersAdmin />}` in AgentPortal content area
  - `birthday_box_orders` permission NOT in `AGENT_PERMISSIONS` list in server.py
  - No agent exists in `agents` collection (empty) — login fails
- **Action:** Add render block + permission + seed test agent → test full flow

### WHAT SPEC DOC SAYS (ServiceDesk_BirthdayBoxOrders_SPEC.docx — Full canonical spec):
See "Service Desk Full Spec" section above in this PRD. Key phases:
- Phase 1A/1B/1C: DONE (read-only manifest, allergy banner, status transitions)
- Phase 2A: PARTIALLY DONE (status PATCH exists, slot assembly PATCH missing)
- Phase 2B/2C: TODO (slot checkboxes UI, allergy gate enforcement)
- Phase 3: TODO (WhatsApp contact panel, notes, order log)
- Phase 4: TODO (delivery notifications)

---

### WHAT WAS BUILT:

#### 1. **BirthdayBoxBuilder.jsx** (NEW — COMPLETED ✅)
Multi-step modal opened via `openOccasionBoxBuilder` custom event.
- **Step 1:** All 6 slots displayed with Mira's picks, emoji, descriptions, allergy-safe/surprise badges
- **Step 2 (conditional):** Explicit allergy confirmation step — shown only if pet has allergies
  - Displays allergy profile, health slot detail, and confirmation checkbox
  - CTA disabled until checkbox is ticked
- **Step 3:** Success screen with Order ID and concierge handoff note
- Calls `POST /api/birthday-box/{petId}/build` (updated to use `get_all_allergies()`)
- "Browse all options" link → closes builder → opens Browse Drawer

#### 2. **BirthdayBoxBrowseDrawer.jsx** (NEW — COMPLETED ✅)
Right-side drawer per spec. Opened via `openBirthdayBoxBrowse` custom event.
- 480px desktop / 100vw mobile, slides from right (320ms)
- Mira bar with pulsating dot
- 5 tabs: Cakes | Toys & Joy | Style | Memory | Wellness
- Each tab: Mira's pick row + allergy banner + product grid (horizontal cards)
- Swap tracking: pills with Undo, swap count in bottom bar
- Bottom bar: whisper text + "Build {petName}'s Box →" (glows pink on swaps)
- "Build Box →" → closes drawer → opens BirthdayBoxBuilder with swaps

#### 3. **Backend Fix: build endpoint allergy check** (FIXED ✅)
`POST /api/birthday-box/{pet_id}/build` now uses `get_all_allergies()` for the allergy guard,
consistent with the preview endpoint.

#### 4. **CelebratePageNew.jsx Wiring** (UPDATED ✅)
- Both components mounted at bottom of page (event-driven)
- `handleBuildBox` passes `petId` in event detail
- `handleOpenBrowseDrawer` triggers browse with boxPreview context
- MiraBirthdayBox secondary button passes live `boxPreview` to browse handler

### Events Reference
| Event | Trigger | Detail |
|-------|---------|--------|
| `openOccasionBoxBuilder` | "Build {pet}'s Box" primary button | `{preset, petName, petId}` |
| `openBirthdayBoxBrowse` | "Birthday Box" secondary button | `{boxPreview, petName}` |

### TESTING RESULTS (Session 12 Final):
| Test | Status |
|------|--------|
| Builder Step 1 → Step 2 → Step 3 full flow | ✅ PASS |
| Step 3 Concierge Handoff screen — ticket ID, 6-slot summary, "What happens next" | ✅ PASS |
| "Not an e-commerce order" disclaimer | ✅ PASS |
| POST /api/birthday-box/{petId}/concierge-handoff — all 5 unified collections | ✅ PASS |
| Allergy guard (allergyConfirmed=False returns error) | ✅ PASS |
| Toast notification (Sonner Toaster fixed in App.js) | ✅ PASS (critical fix) |
| Mobile bottom sheet + drag handle | ✅ PASS |

**Backend tests:** 14/14 passed  
**Frontend tests:** 100% verified  

### Critical Bug Fixed by Testing Agent:
- **Sonner Toaster not mounted in App.js** — ALL toast notifications were silently failing across the entire app. Fixed by adding `<SonnerToaster />` to App.js.

---


### WHAT IS IT?
A **curated 6-slot celebration box** built specifically for one pet, based on their individual soul profile. **No two boxes are the same.** Mira selects every item based on her knowledge of the pet.

### WHERE IT APPEARS
Single dark card on `/celebrate`, positioned **below the category strip** and **above the soul pillars**.

### THE 6 SLOTS

| Slot | Name | Primary Signal | Item Selected | Fallback |
|------|------|----------------|---------------|----------|
| 1 | **Hero Item** | `petFavouriteFood1` | `[flavour]` birthday cake | Breed-matched cake |
| 2 | **Joy Item** | `topSoulPillar` | Activity-matched gift | Breed favourite toy |
| 3 | **Style Item** | `birthday` registered | Custom birthday bandana | Standard bandana |
| 4 | **Memory Item** | `Love & Memory` score > 60 | Memory card + photo envelope | Paw print card |
| 5 | **Health Item** | `healthCondition` | Treatment-safe supplement | Age-appropriate treat |
| 6 | **Surprise Item** | `petArchetype` | Archetype-matched surprise | Breed surprise gift |

**Note:** Slots 5 & 6 are hidden → revealed when user clicks "Build {petName}'s Box"

### UI COMPONENTS

#### Card Container
```css
background: linear-gradient(135deg, #1A0030 0%, #3D0060 50%, #6B0099 100%);
border-radius: 20px;
padding: 28px;
border: 1px solid rgba(196,77,255,0.30);
box-shadow: 0 8px 32px rgba(196,77,255,0.15);
```

#### Eyebrow Chip States
- **Default:** `✦ Mira's pick for {petName}'s birthday`
- **Gotcha Day (within 7 days):** `✦ Mira's pick for {petName}'s gotcha day`
- **No Birthday:** `✦ Curated by Mira for {petName}`

#### Title
- `The` + `{petName}` (pink #FF9FE5) + `Birthday Box` (white)

#### Description Template
```
Mira has built one celebration that covers who {petName} actually is — 
{slot1Name}, {slot2Description}, {slot3}, and {slot4}. 
Everything {petName} loves. Nothing they can't have.
```

**Last Line Variations:**
| Condition | Last Line |
|-----------|-----------|
| Healthy young pet | Everything {petName} loves. Nothing they can't have. |
| Allergy present | Everything {petName} loves. Nothing they can't have. |
| Health condition | Everything {petName} loves. Everything safe for their treatment. |
| Senior (age > 7) | Everything {petName} loves. Everything kind to their body. |
| Senior + condition | Everything {petName} loves. Everything gentle, everything safe. |
| Puppy (age < 1) | Everything {petName} loves. Everything right for where they're growing. |
| No profile data | Everything a dog loves on their birthday. Personalise it for yours. |

#### Buttons
| Button | Label | Style |
|--------|-------|-------|
| **Primary** | `🎉 Build {petName}'s Box` | Pink/purple gradient |
| **Secondary** | `Birthday Box` | Transparent with border |

### SLOT-BY-SLOT INTELLIGENCE

#### Slot 1 — Hero Item (Birthday Cake)
```
IF favourite food known → [petFavouriteFood1] birthday cake
   IF allergy → EXCLUDE allergen, label: "[flavour], allergy-safe"
ELSE IF breed known → Breed-matched flavour
   - Labradors → peanut butter
   - Indies → chicken  
   - Shih Tzu → salmon
ELSE → Custom birthday cake (personalize in builder)
```

#### Slot 2 — Joy Item (Based on Top Soul Pillar)
| Pillar | Item |
|--------|------|
| Play | Favourite toy (gift-wrapped) |
| Adventure | Outdoor birthday kit (bandana + trail treats + water bowl) |
| Social | Pawty kit (bandanas for multiple dogs) |
| Learning | Puzzle toy (level matched) |
| Food | Gourmet treat platter |
| Grooming | Birthday spa kit |
| Health | Wellness treat pack |
| Love/Memory | Photo prop kit |
| No data | Breed-matched toy |

#### Slot 3 — Style Item (Wearable)
```
IF birthday registered → Custom birthday bandana with {petName} embroidered
IF gotcha day → Custom gotcha day bandana
IF Shih Tzu / small dog → Birthday bow set
IF large breed → Wide bandana (large sizing)
IF Grooming score > 70 → Birthday outfit set (bandana + bow + spray)
ELSE → Standard birthday bandana
```

#### Slot 4 — Memory Item
```
IF Love & Memory score > 60 → Memory card + photo envelope
IF birthday photoshoot booked → Digital memory card
IF exact birthday date known → Personalised date card
IF multiple pets → Family birthday card
ELSE → Paw print birthday card
```

#### Slot 5 — Health Item (MUST BE ALLERGY-SAFE)
```
IF healthCondition present → Condition-specific supplement
IF petAge > 7 (senior) → Joint support supplement
IF petAge < 2 (puppy) → Puppy growth treat
IF petWeight = overweight → Low-calorie birthday treat
IF allergy present → ALL OPTIONS ALLERGY-FILTERED
IF no allergy data → Show notice: "Let us know about allergies before ordering"
ELSE → Age-appropriate wellness treat
```

#### Slot 6 — Surprise Item (Based on Archetype)
| Archetype | Item |
|-----------|------|
| Social Butterfly | Friend gift set (for {petFriend1}) |
| Adventurer | Trail map bandana (unique to {userCity}) |
| Thinker | Hidden treat puzzle |
| Nurturer | Comfort plush (sized for breed) |
| Performer | Party hat + matching bow |
| Protector | Calming treat |
| Free Spirit | Surprise mystery toy (sealed box) |
| No archetype | Breed surprise, chip: "A Mira surprise 🎁" |

**Note:** Slot 6 item name NOT shown until box is opened on delivery.

### SOUL DISCOVERY STATES

| Soul % | Behavior |
|--------|----------|
| < 30% | Fallback items + banner: "Tell Mira more about {petName}..." |
| 30-70% | Partial personalization, Mira notes confident slots |
| > 70% | Full personalization, no caveats |
| 89%+ | Mira speaks with full confidence, "exactly right" |

### EDGE CASES

1. **No Birthday:** Show box with eyebrow "Curated by Mira" + prompt to add birthday
2. **Birthday < 7 days:** Urgency banner + "Order by [date] for delivery in time"
3. **Gotcha Day:** Different copy — "the day {petName} chose you"
4. **Multiple Pets:** One card per pet, scrollable/tabbed
5. **Allergies:** ABSOLUTE rule — allergen cannot appear in ANY slot

### ALLERGY RULES (CRITICAL)
```
Rule 1: If allergen in profile → EXCLUDE from ALL slots
Rule 2: Slot 1 (cake) MUST confirm "allergy-safe" in chip
Rule 3: Slot 5 (health) MUST be allergen-checked
Rule 4: No allergy data → Show builder notice
```

### VARIABLES REFERENCE
```
{petName}, {petBreed}, {petAge}, {petFavouriteFood1}, {petFavouriteFood2}
{petAllergy1}, {petAllergy2}, {topSoulPillar}, {topActivity}, {petFavouriteToy}
{petArchetype}, {petFriend1}, {petBirthday}, {petGotchaDay}, {healthCondition}
{petSize}, {soulDiscoveredPercent}, {userCity}
{slot1Name}, {slot2Name}, {slot3Name}, {slot4Name}
```

---

---

## 📋 SERVICE DESK — Birthday Box Orders Spec (IN PROGRESS — Phase 1+2 built, wiring pending)

**Source:** ServiceDesk_BirthdayBoxOrders_SPEC.docx (FULL SPEC — all 10 sections)  
**Purpose:** Close the fulfilment loop. Every birthday box order tracked from confirmation to delivery.

### Closed Loop (8 Steps — per spec doc)
1. Pet parent confirms → ticket created + concierge handoff screen
2. System auto-notifies Concierge (WhatsApp + email)
3. Concierge opens Birthday Box Orders tab → sees 6-slot manifest + allergy flags
4. Concierge contacts pet parent within 24hrs → confirms delivery + personalisation
5. Concierge assembles box slot by slot → marks each slot checked
6. All 6 checked → "Mark as Assembled" → pet parent auto-notified
7. Concierge dispatches → DISPATCHED + tracking link
8. DELIVERED → Mira sends brand moment message to pet parent ♥

### New Tab: "🎂 Birthday Box Orders" in Service Desk
- Concierge team access only
- Tab badge shows count of NEW orders
- **3-column layout:** Left (order list 300px) | Center (order detail flex-1) | Right (action panel 280px)
- **Mobile:** Single column, tap-to-open detail

### Status System
| Status | Color | Gate |
|--------|-------|------|
| NEW | #DC2626 | None |
| IN PROGRESS | #D97706 | Allergy confirmation gate if allergies |
| ASSEMBLED | #2563EB | All 6 slot checkboxes ticked |
| DISPATCHED | #7C3AED | Tracking link required |
| DELIVERED | #27AE60 | None |

### Pet Parent Status (3 simplified states)
| Admin Status | Pet Parent Sees |
|---|---|
| NEW + IN PROGRESS | "Your Concierge is building {petName}'s box" |
| ASSEMBLED + DISPATCHED | "{petName}'s box is on its way 🎉" |
| DELIVERED | "{petName}'s Birthday Box has arrived ♥" |

### Critical: Allergy Alert Banner
Red banner (bg: #FEF2F2, border: 2px solid #DC2626) at top of manifest.

### 6-Slot Manifest Table Columns
✓ (assembly checkbox) | SLOT | ITEM NAME | DETAIL/PERSONALISATION | SAFETY FLAG

### New API Endpoints Required
| Endpoint | Purpose |
|---|---|
| GET /api/admin/birthday-box-orders | List with status/date/allergy filters |
| GET /api/admin/birthday-box-orders/{id} | Full order detail |
| PATCH /api/admin/birthday-box-orders/{id}/status | Status transition (server-side gated) |
| PATCH /api/admin/birthday-box-orders/{id}/personalisation | Bandana name, cake msg, delivery date |
| PATCH /api/admin/birthday-box-orders/{id}/slots/{slot}/checked | Mark slot assembled |
| POST /api/admin/birthday-box-orders/{id}/notify | WhatsApp/email to pet parent |

### Build Order (Phased)
1. **Phase 1 (MVP):** Read-only manifest view
2. **Phase 2:** Status transitions + allergy gate + slot checkboxes
3. **Phase 3:** Contact panel + personalisation edits + order log
4. **Phase 4:** Delivery notifications + tracking integration

---

## ✅ SESSION 13: UI Fixes + Browse Drawer Selection (Feb 2026)
| Fix | File |
|---|---|
| Birthday box card off-center → `px-4 sm:px-6 lg:px-8` to content wrapper | CelebratePageNew.jsx |
| Toast "Sent to Concierge" fires on Step 3 mount (above modal overlay) | BirthdayBoxBuilder.jsx |
| Browse Drawer: replaced confusing auto-selection with clear Swap/Current/✓ states | BirthdayBoxBrowseDrawer.jsx |

---



## 🛒 BIRTHDAY BOX BROWSE DRAWER — SPECIFICATION

### TRIGGER
Secondary "Birthday Box" button on MiraBirthdayBox card

### STRUCTURE
- **Width:** 480px (desktop) / 100vw (mobile)
- **Animation:** Slides from right
- **Header:** Dark gradient (#1A0030 → #3D0060)

### 5 TABS
| Tab | Icon | Products |
|-----|------|----------|
| Cakes | 🎂 | Birthday cakes, allergy-filtered |
| Toys & Joy | 🎁 | Activity/pillar-matched toys |
| Style | 🎀 | Bandanas, bows, outfits |
| Memory | 💌 | Cards, photo items, keepsakes |
| Wellness | ✨ | Supplements, health treats |

### KEY FEATURES

#### 1. Mira's Pick Row
Each tab shows Mira's pre-selected item at the top with "Swap →" link

#### 2. Swap Tracking
- Pills appear showing swaps: "🔄 Cake: Salmon → Peanut butter"
- Each swap has "Undo" option
- Multiple swaps tracked

#### 3. Allergy Banner
Shows filtered allergens: "Filtered for Mojo: no chicken, no soy"

#### 4. Product Sorting by Tab
| Tab | Sort Order |
|-----|------------|
| Cakes | Breed-matched → flavor-matched → alphabetical |
| Toys | topActivity → topSoulPillar → breed |
| Style | petSize → breed → popularity |
| Memory | Love & Memory score descending |
| Wellness | Condition-safe + allergy-filtered ONLY |

### BOTTOM BAR
- **Whisper text:** "Your box is ready" / "{n} swaps made"
- **Primary CTA:** "Build {petName}'s Box →"
- **State:** Neutral (no swaps) → Pink glow (1+ swaps)

---

## 🚨 CRITICAL: ALLERGY DATA FIX (Session 11)

### THE PROBLEM
Mojo has chicken allergy but system showed "Chicken birthday cake"

### ROOT CAUSE
Allergy data stored in MULTIPLE locations in pet document:
- `health_data.allergies: ['chicken']`
- `doggy_soul_answers.food_allergies: ['chicken']`
- `health.allergies: ['chicken']`
- `insights.key_flags.allergy_list: ['chicken']`

But code only checked:
- `pet.get("allergies")` → empty []
- `pet.get("allergy1")` → None

### THE FIX
Created `get_all_allergies(pet)` function that checks ALL locations:
```python
def get_all_allergies(pet: dict) -> list:
    all_allergies = set()
    
    # Direct fields
    if pet.get("allergies"): all_allergies.update(...)
    if pet.get("allergy1"): all_allergies.add(...)
    
    # health_data.allergies
    health_data = pet.get("health_data", {})
    if health_data.get("allergies"): all_allergies.update(...)
    
    # health.allergies
    health = pet.get("health", {})
    if health.get("allergies"): all_allergies.update(...)
    
    # doggy_soul_answers.food_allergies
    soul_answers = pet.get("doggy_soul_answers", {})
    if soul_answers.get("food_allergies"): all_allergies.update(...)
    
    # insights.key_flags.allergy_list
    insights = pet.get("insights", {})
    key_flags = insights.get("key_flags", {})
    if key_flags.get("allergy_list"): all_allergies.update(...)
    
    return list(all_allergies)
```

### RESULT
- **Before:** "Chicken birthday cake" ❌
- **After:** "Salmon birthday cake, allergy-safe" ✅

---

## 🔄 SESSION 11 SPEC — PillarSoulModal + Master Sync + Product Modal (March 14, 2026)

### WHAT WAS BUILT:

#### 1. **PillarSoulModal Implementation** (COMPLETED ✅)
When a pillar is clicked and the pet's profile is **missing information** for that specific pillar, a modal appears with **4-6 contextual questions** to help enrich the pet's soul data.

**Flow:**
1. User clicks a pillar → System checks if pet has enough data for that pillar
2. If data is incomplete → Show `PillarSoulModal` with pillar-specific questions
3. User answers questions → Backend updates `doggy_soul_answers` + recalculates soul score
4. Updates Mira's memory (`learned_facts` array) → She now "knows" more about the pet
5. **OUTCOME:** Immediately able to generate dynamic concierge suggestions with the new data

**New Backend Endpoint:**
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/pets/{pet_id}/pillar-soul-update` | PATCH | JWT | Update soul answers from pillar questions |

**Request Payload:**
```json
{
  "pillar": "food",
  "answers": {"favorite_treats": ["Salmon", "Chicken"]},
  "learned_facts": ["[Food & Flavour] What flavours does Mojo love? → Salmon, Chicken"],
  "summary": "Mojo food preferences updated via soul modal"
}
```

**Response:**
```json
{
  "pet": {...updated pet object...},
  "new_score": 100.0,
  "score_tier": "soul_master",
  "pillar": "food",
  "facts_added": 1
}
```

#### 2. **Master Sync for AI Products** (COMPLETED ✅)
On backend startup, automatically seeds celebrate products ensuring all 8 pillars have items in "Shop" tab.

**Implementation:** Added Step 12/12 to `master_sync_on_startup()`:
- Imports `seed_celebrate_products` from `celebrate_product_generator.py`
- Seeds 59 new products across pillar categories
- Syncs with Cloudinary for proper images
- **Result:** Products now available in all pillar Shop tabs

**Seeded Product Counts:**
| Category | Count | Pillar |
|---|---|---|
| puzzle_toys | 9 | Learning & Mind |
| party_kits | 8 | Social & Friends |
| memory_books | 6 | Love & Memory |
| portraits | 5 | Love & Memory |
| supplements | 11 | Health & Wellness |
| party_accessories | 12 | Social & Friends / Play & Joy |

#### 3. **ProductDetailModal** (NEW ✅)
Full product modal with:
- Product image, name, description
- Variant selector (if multiple variants)
- Quantity selector (for products, not services)
- **Add to Cart** button (for products with price)
- **Request via Concierge** button (for services / items without price)
- Pillar-colored theme

**Service Detection:** Items automatically route to concierge if:
- No price / price = 0
- Category is `grooming` or `portraits`
- Name contains "photoshoot", "booking", "session"

#### 4. **Concierge Flow for Services** (VERIFIED ✅)
All service-type items in Grooming & Memory pillars:
- Display "Concierge" instead of price
- Show "Book 👑" button
- Clicking triggers `POST /api/concierge/pillar-request`
- Toast notification with ticket ID on success

**Files Modified:**
- `/app/backend/server.py` — Added endpoint + Master Sync step
- `/app/frontend/src/components/celebrate/SoulCelebrationPillars.jsx` — Rendered PillarSoulModal
- `/app/frontend/src/components/celebrate/SoulPillarExpanded.jsx` — Added ProductDetailModal integration
- `/app/frontend/src/components/celebrate/ProductDetailModal.jsx` — NEW component

### PRODUCT AUDIT RESULTS:

**All 8 Pillar Categories Now Have Products:**
| Category | Products | Status |
|---|---|---|
| cakes | 50+ | ✅ Complete |
| treats | 48+ | ✅ Complete |
| toys | 50+ | ✅ Complete |
| puzzle_toys | 9 | ✅ Complete |
| party_kits | 10 | ✅ Complete |
| party_accessories | 12 | ✅ Complete |
| grooming | 54+ | ✅ Complete |
| supplements | 16 | ✅ Complete |
| portraits | 5 | ✅ Complete |
| memory_books | 6 | ✅ Complete |

**All products in pillar categories have images** — No missing images found.

### TESTING RESULTS (Session 11):
| Test | Status |
|---|---|
| 8-pillar grid display | ✅ PASS |
| Pillar expansion with tabs | ✅ PASS |
| All special panel cards | ✅ PASS |
| PATCH /api/pets/{pet_id}/pillar-soul-update | ✅ PASS |
| Products API for all pillar tabs | ✅ PASS |
| Master Sync product seeding | ✅ PASS |
| Concierge flow for services | ✅ PASS |

---

## THE VISION
> "We are not a commerce platform. We are a Pet Operating System. The Soul comes first."

The world's first soul-driven Pet Operating System. Every dog has a personality, lifestyle, health story — the Soul. The platform captures this and uses it to power every recommendation, every Mira response, and every concierge interaction.

**3,777 products in DB. 221+ API endpoints. 51 Soul Questions. 14 Pillars.**

---

## 🔄 SESSION 10 SPEC — Pet-Dependent Pillars + AI Product Generator (March 14, 2026)

### WHAT WAS BUILT:
1. **FeastMenuCard** — pet-dependent items derived from `pet.doggy_soul_answers.favorite_treats`
   - Mojo (salmon pref) → Salmon Birthday Cake, Salmon Biscuit Platter, Salmon Paw Cupcakes
   - Bruno (chicken pref) → Chicken Birthday Cake, Chicken Treat Platter, Chicken Paw Cupcakes
   - NO prices — each item has "Request via Concierge" button → creates service desk ticket
   - Toast shown with Ticket ID on success

2. **PawtyPlannerCard** — ALL 4 step buttons → Concierge (unified service flow)
   - Step 1: Find a venue → `POST /api/concierge/pillar-request` with request_type: venue_finder
   - Step 2: Order invites → request_type: order_invitations
   - Step 3: Order pawty kit → request_type: pawty_kit_order
   - Step 4: Full Concierge → request_type: full_concierge_pawty
   - Tick state (✓) shown after successful send
   - Works on BOTH mobile and desktop

3. **MemoryInvitationCard** — Complete 4-option dark cinematic card
   - Photoshoot, Custom Portrait, Memory Book, Soul Story Book
   - Each option has "Book via Concierge 👑" button → concierge ticket
   - Dark background: `linear-gradient(135deg, #1A0030, #3D0060)`

4. **PILLAR_TABS update** — `puzzles` (0 products) → `puzzle_toys` (now 9 products)

5. **AI Product Generator** (`celebrate_product_generator.py`)
   - 59 new authentic products across 8 celebrate pillars
   - New sub-categories: puzzle_toys(9), party_kits(10), memory_books(6), portraits(3)
   - Expanded: supplements(11+), party_accessories(12)
   - Background AI image generation via Cloudinary
   - Admin UI: "Generate" tab in Celebrate Manager with live progress

### AI PRODUCT GENERATOR ENDPOINTS:
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| /api/admin/celebrate/seed-and-generate | POST | JWT admin | Seed 59 products + start image gen |
| /api/admin/celebrate/generation-status | GET | JWT admin | Live status (poll every 3s) |
| /api/admin/products/{id}/regenerate-image | POST | JWT admin | Regen specific product image |

### CONCIERGE REQUEST PATTERN (used across all pillar special panels):
```js
const result = await sendToConcierge({
  requestType: 'feast_item',        // one of: feast_item, venue_finder, order_invitations, pawty_kit_order, full_concierge_pawty, birthday_photoshoot, custom_portrait, memory_book, soul_story_book
  label: 'Request item for petName',
  message: 'Full request details',
  petName: 'Mojo',
});
// result: { success: true, ticketId: 'TKT-XXXXXXXX' }
```

### PILLAR SYSTEM STATUS:
| Feature | Status |
|---|---|
| 8-pillar grid GLOW/DIM/INCOMPLETE | ✅ SoulCelebrationPillars.jsx |
| Row-based inline expansion (Row 1 below Row 1, Row 2 below Row 2) | ✅ IMPLEMENTED & TESTED |
| Special panels (4 pillars: food, social, health, memory) | ✅ IMPLEMENTED & TESTED |
| DrawerBottomBar (3 states, purple gradient, pillar-specific whispers) | ✅ IMPLEMENTED & TESTED |
| Correct 4 tabs per pillar per spec | ✅ IMPLEMENTED & TESTED |
| Mira bar gradient styling | ✅ IMPLEMENTED & TESTED |
| Pet Wrapped download on PetHomePage | ✅ EXISTS |
| Allergy filter banner in product grid | ✅ IMPLEMENTED & TESTED |

### SPECIAL PANELS (exact from doc):
- **FeastMenuCard** (Pillar 1): `bg: linear-gradient(135deg,#FFF8F0,#FEF3FF)`, 3 items display-only, NO add buttons
  - 🎂 Salmon Birthday Cake ₹899 · 🍪 Treat Platter ₹449 · 🧁 Paw Cupcakes ₹349
- **PawtyPlannerCard** (Pillar 3): `bg: linear-gradient(135deg,#F3E5F5,#FCE4EC)`, 4 step cards with purple circles
- **WellnessHeroCard** (Pillar 7): `bg: linear-gradient(135deg,#E0F7FA,#E8F5E9)`, NO CTA inside
- **MemoryInvitationCard** (Pillar 8): `bg: linear-gradient(135deg,#1A0030,#3D0060)`, HAS CTA for Concierge photoshoot

### DRAWER BOTTOM BAR (sticky bottom, 72px):
- `bg: linear-gradient(135deg,#2D0050,#6B0099,#C44DFF)`
- State 1 (0 items): whisper "✦ Everything personalised for {petName}" · btn "Explore More →"
- State 2 (1 item): context-specific whisper · btn "Build {petName}'s Birthday Plan →"
- State 3 (2+ items): count badge on pulse dot · btn "Keep Building →"
- NEVER use: Continue Shopping, Back, Close, Done, Checkout

---

## ✅ SESSION 8 COMPLETED (March 14, 2026) — TESTED ✅

### FEATURE 1 — Soul Score Constant Glow (COMPLETED ✅)
- Replaced `key={score}` spring-remount with `useAnimation()` imperative control + `useEffect` trigger
- Added `motion.span` with `textShadow` cycling `16px→48px→16px` glow, `repeat: Infinity` — NEVER stops
- Score changes: smooth tween pop via `scoreControls.start({ scale: [1,1.12,1] })` — no bounce

### FEATURE 2 — PetWrap Teaser in Mira's Picks (COMPLETED ✅)
- `PetWrapTeaser` component renders in `miras-picks` section of `CelebrateContentModal`
- Loads from `GET /api/wrapped/generate/{petId}` (API now exposes `archetype_name`, `archetype_emoji`, `soul_score` at top level)
- Shows: pet name, year, soul score %, archetype, "View Full Wrap" CTA + Share button

### FEATURE 3 — Celebrate-Context Soul Questions (COMPLETED ✅)
- Backend: `GET /api/pet-soul/profile/{petId}/quick-questions?context=celebrate` added
- Priority order: `celebration_preferences` (if unanswered) → `taste_treat` folder → motivation/activity → others
- Frontend: CelebrateContentModal passes `?context=celebrate&limit=5` to soul questions

### FEATURE 4 — Occasion Countdown Card (COMPLETED ✅)
- `OccasionCountdownCard` renders at TOP of Mira's Picks
- Checks `pet.birthday`, `pet.gotcha_date`, and soul-answered celebration_preferences (Diwali, Holi, Christmas etc.)
- Gold styling when within 7 days, purple when 8-45 days, shows "TODAY" badge
- Holi/festival dates mapped to approximate annual dates

### FEATURE 5 — Archetype-Based Imagined Products (COMPLETED ✅)
- 6 archetypes mapped: gentle_aristocrat, wild_explorer, velcro_baby, social_butterfly, foodie_gourmet, zen_philosopher
- Always includes at least 1 archetype card: `archetypeSlots = Math.max(1, Math.min(2, 5 - imaginaryProducts.length))`
- Total limit expanded to 5 imagined products

### FEATURE 6 — Mira Memory Loop (COMPLETED ✅)
- `celebrate_routes.py`: When concierge request created with `pet_id`, writes to `pets.learned_facts`
- Format: `{type, category, product_name, request_type, request_id, date}`
- Mira chat backend already reads `learned_facts` in system prompt via `get_pet_context_pack`

### BUG FIX — Text Duplication (COMPLETED ✅)
- "salmon treats treats" text duplication fixed: `cleanFood` properly strips "treats/cake/food" suffixes

---

## ✅ SESSION 7 FIXES (March 14, 2026) — TESTED ✅

### FEATURE 1 — Soul Score Constant Glow (P0)
**Problem:** The `key={score}` on the score number causes it to re-mount and re-animate with `scale: 1.4` on every update — creating a "bounce" effect. After answering, the score jumps forward and back.
**Fix:**
- Remove `key={score}` re-mount strategy
- Replace spring animation with `@keyframes pulse-glow` CSS that runs INFINITELY
- Score always glows (`text-shadow` pulse animation, never stops)
- Score changes counter-animate with a smooth `useSpring` value (no bounce)
- File: `CelebrateContentModal.jsx` — SoulQuestionsSection component

### FEATURE 2 — PetWrap Mini-Card in Mira's Picks (P1)
**What:** PetWrap (`/wrapped/:petId`) is a beautiful 5-card pet year-in-review (Cover, Soul Score, Mira Moments, Pillars, Closing). It already exists. User wants it visible NEXT TO the soul section inside the Mira's Picks modal.
**Design:**
- Compact PetWrap teaser card: shows cover card info (soul score, archetype, year)
- "View Full Wrap" → opens `/wrapped/:petId` in new tab
- Share button using `navigator.share` or clipboard fallback
- Dynamically loads from `/api/wrapped/generate/{petId}`
- File: `CelebrateContentModal.jsx` — inside `category === 'miras-picks'` section

### FEATURE 3 — Celebrate-Context Soul Questions (P1) ← KEY FEATURE
**What:** When in the celebrate modal, soul questions should be CELEBRATE-FIRST. Current behavior: random from all 9 folders. Target: celebrate-relevant folders first.

**Celebrate-Relevant Folders (PRIORITY ORDER):**
1. `taste_treat` → "What protein does {pet} love?" → Auto-generates cake/treat imagined cards
2. `celebration_preferences` question → "Which celebrations do you want to remember?" → Occasions setup
3. `toy_play` (if exists) / `identity_temperament` motivation → toy gift imaginations
4. Other folders after these

**Backend change:** `GET /api/pet-soul/profile/{petId}/quick-questions?context=celebrate&limit=5`
- When `context=celebrate`: move `taste_treat` + `celebration_preferences` questions to the TOP of the selection
- File: `pet_soul_routes.py` — `get_quick_questions` endpoint

**Frontend change after answering a celebrate question:**
- The `onAnswered` callback fires → `onRefreshMiraCards()` runs
- Re-generates Mira Imagines cards based on NEW soul data
- NEW IMAGINATION TYPES (not just cakes): toys, accessories, hampers, treats, activity kits
  - `favorite_protein = "Chicken"` → "Chicken Celebration Cake" + "Chicken Jerky Hamper"
  - `favorite_treats = ["Cakes", "Jerky"]` → imagined product cards for those types
  - `motivation_type = "Toys/play"` → "Custom Fetch Toy Gift Set" imagined card
  - Soul archetype `wild_explorer` → "Adventure Birthday Hamper" imagined card
- All imagined products → CONCIERGE FLOW (not add-to-cart)
- File: `CelebrateContentModal.jsx` — `generateMiraImagines` function (EXPAND beyond cakes)

### FEATURE 4 — Occasion-Based Cards in Mira's Picks (P1)
**What:** 
- Check if `doggy_soul_answers.celebration_preferences` is answered for the pet
- If answered with ["Birthday", "Diwali" etc.] + pet has `birthday` or `gotcha_date` → show special occasion countdown card in Mira's Picks: "Mojo's birthday is in 15 days — here's what Mira prepared 🎂"
- If NOT answered → `celebration_preferences` question appears FIRST in soul questions (already handled by FEATURE 3)
- Occasion types: Birthday, Gotcha Day, Diwali, Holi, Christmas, New Year, Valentine's Day, Raksha Bandhan, Rakhi, Independence Day, Easter, Eid

**Where in UI:** At TOP of `miras-picks` section, before imagined cards
**File:** `CelebrateContentModal.jsx` — new `OccasionCountdownCard` component

### FEATURE 5 — Mira Memory Loop: Product Selections → learned_facts (P2)
**What:** When a pet parent sends a concierge request (e.g., "Salmon Delight Cake"), store this as a `learned_fact` on the pet.
**Backend:** In the celebrate concierge request endpoint → add:
```python
await db.pets.update_one(
  {"id": pet_id},
  {"$push": {"learned_facts": {
    "type": "concierge_request", 
    "category": "celebrate",
    "product_name": product_name,
    "occasion": occasion,
    "date": datetime.now(timezone.utc).isoformat()
  }}}
)
```
**Mira already uses `learned_facts`** in system prompt (verified — `mira_routes.py` line 3088+)
**Result:** Next time user opens Mira widget, she says: "Last time you asked about {product_name} for {petName} — want to revisit that?"
**File:** `celebrate_routes.py` — concierge request endpoint

### FEATURE 6 — Soul Archetype → Imagined Products (P2)
**What:** The soul archetype engine (`/api/soul-archetype/pet/{petId}`) derives personality from soul answers. This should influence what Mira imagines:
- `gentle_aristocrat` → Premium/elegant items: "Luxury Birthday Hamper", "Velvet Bow Tie"
- `wild_explorer` → Adventure items: "Adventure Birthday Kit", "Rope Tug Gift Set"
- `velcro_baby` → Comfort items: "Comfort Snuggle Pack", "Mom's Scent Toy"
- `social_butterfly` → Party items: "Pawty Decoration Kit", "Group Treat Bag"
- `foodie_gourmet` → Food items: "Gourmet Tasting Kit", "Custom Recipe Cake"
**File:** `CelebrateContentModal.jsx` — `generateMiraImagines` function — add archetype-based imaginations

---

## ✅ SESSION 7 FIXES (March 14, 2026) — TESTED ✅
### P0 — Soul Question Cards UI (COMPLETED ✅)
- **Problem**: SoulQuestionCard had light blue/white theme (`rgba(68,136,255,0.06)`) — unreadable on white modal
- **Fix**: Restored **deep purple dark theme**: `background: linear-gradient(135deg, #12003A 0%, #2D0060 100%)`, purple borders (`rgba(196,77,255,0.35)`), white text, purple/pink CTAs
- **File**: `CelebrateContentModal.jsx` — SoulQuestionCard component + SoulQuestionsSection component

### P0 — Soul Score Display Enhancement (COMPLETED ✅)
- Score counter: 38px → **64px** font size with spring animation + glow effect (`text-shadow: 0 0 24px rgba(196,77,255,0.55)`)
- Added session delta badge: "+X% this session"
- Added animated progress bar (purple → gold when ≥80%)
- Section uses deep purple gradient header matching hero/MiraImaginesCard

### P1 — Admin Panel Auth + Robustness (COMPLETED ✅)
- **Root cause**: `GET /api/admin/products` used `verify_admin` (Basic Auth ONLY) → JWT Bearer tokens rejected → 0 products
- **Backend fix**: Changed to `verify_admin_auth` (accepts both Basic Auth AND JWT Bearer)
- **Frontend fix 1**: `Promise.all` → `Promise.allSettled` in `fetchAllData` — one failure no longer kills entire load
- **Frontend fix 2**: Added fallback fetch (public `/api/products` by category) when admin endpoint fails
- **Frontend fix 3**: `showInactive` default `false` → `true` — admin now shows ALL products including inactive party accessories
- **Verified**: Party accessories (Pawty Hat Set, Happy Birthday Tiara etc.) + celebration_addons showing in admin ✅

---

## ✅ CELEBRATE PAGE — SOUL-FIRST REDESIGN STATUS

### Route: `/celebrate-soul` (must replace `/celebrate` once Aditya approves)

### COMPLETED ✅ (Updated Mar 13, 2026 — Session 4 Round 2)
1. **CelebrateHero** — Pet photo, gradient avatar ring, Soul % chip, soul chips, Mira quote
2. **CelebrateCategoryStrip** — **11 categories**: Birthday Cakes, Breed Cakes, Pupcakes, Desi Treats, **Frozen Treats**, Gift Hampers, Bundles, **Party & Decor**, **Nut Butters**, Soul Picks, Mira's Picks
3. **SoulCelebrationPillars**, **MiraAskBar**, **GuidedCelebrationPaths**, **CelebrationMemoryWall** — spec-compliant
4. **CelebrateContentModal** — Fully rebuilt, responsive:
   - **Desktop**: Large centered dialog (max-w-5xl wrapper div, NOT transform — Framer Motion safe)
   - **Mobile**: Bottom sheet (93vh, drag handle)
   - `birthday-cakes` → `cakes` (111 actual TDB bakery cakes ✅ was wrongly pointing to `celebration`)
   - `miras-picks` → `cakes` fetched then **breed-filtered client-side** (Indie dog gets Indie cakes) ✅
   - `frozen-treats` → 24 products ✅ NEW
   - `party` → party_accessories + party_kits + celebration_addons ✅ NEW
   - `nut-butters` → 6 products ✅ NEW
   - **BundleDetailSheet**: X close button added, image uses `object-contain` (max 320px, no crop) ✅
   - **Soul Picks**: Now uses `SoulPickCard` (wraps ProductCard with "For {pet}" badge) — proper modal with X ✅
   - **Footer bar (2-state dynamic)**: 
     - Browsing (nothing added): `✦ Everything here is personalised for {pet}` | `Explore More for {pet}` (closes modal)
     - Active (items added): `{emoji} + N things — {pet}'s plan is growing` | `Keep Building →` (opens Mira AI with context)
     - `addedCount` increments on every `addToCart` custom event while modal is open; resets on category switch
   - All product images: `object-contain` — no cropping ✅
5. **Admin CelebrateManager** — loads 308+ products, category dropdown has celebration/frozen-treats/party_accessories

### PRODUCT COUNTS — CELEBRATE UNIVERSE
| Category | DB Name | Count |
|----------|---------|-------|
| Birthday / Celebration Cakes (actual TDB cakes) | **cakes** | 111 |
| Celebration packages/kits (NOT in birthday-cakes tab) | celebration | 106 |
| Breed Cakes | breed-cakes | 42 |
| Gift Hampers | hampers | 37 |
| Pupcakes & Dognuts | dognuts | 30 |
| Frozen Treats | frozen-treats | 24 |
| Desi Treats | desi-treats | 7 |
| Nut Butters | nut-butters | 6 |
| Party Accessories | party_accessories | 6 |
| Celebration Add-ons | celebration_addons | 6 |
| Party Kits | party_kits | 4 |
| **Total in strip tabs** | | **~279 products** |
| Celebrate Bundles (separate collection) | celebrate_bundles | 6 |

### KEY DATA INSIGHT ⚠️
`cakes` (111) = actual TDB bakery cake products (beautiful illustrated cakes)
`celebration` (106) = celebration packages/kits/bundles by breed — NOT birthday cakes
NEVER use `celebration` for the Birthday Cakes tab. Use `cakes`.

### PRODUCT COUNTS — CELEBRATE UNIVERSE
| Category | Count |
|----------|-------|
| celebration (Birthday Cakes) | 106 |
| breed-cakes | 42 |
| hampers | 37 |
| dognuts (Pupcakes) | 30 |
| frozen-treats | 24 |
| desi-treats | 7 |
| nut-butters | 6 |
| party_accessories | 6 |
| celebration_addons | 6 |
| party_kits | 4 |
| **Total celebrate products** | **~279** |
### PRODUCT COUNTS — CELEBRATE UNIVERSE (Confirmed Mar 13, 2026)
| Category | DB Name | Count | Status |
|----------|---------|-------|--------|
| Birthday / Celebration Cakes | celebration | 106 | ✅ Strip tab "Birthday Cakes" |
| Breed Cakes | breed-cakes | 42 | ✅ Strip tab "Breed Cakes" |
| Gift Hampers | hampers | 37 | ✅ Strip tab "Gift Hampers" |
| Pupcakes & Dognuts | dognuts | 30 | ✅ Strip tab "Pupcakes" |
| Frozen Treats | frozen-treats | 24 | ✅ NEW Strip tab |
| Desi Treats | desi-treats | 7 | ✅ Strip tab |
| Nut Butters | nut-butters | 6 | ✅ NEW Strip tab |
| Party Accessories | party_accessories | 6 | ✅ NEW "Party & Decor" tab |
| Celebration Add-ons | celebration_addons | 6 | ✅ Part of "Party & Decor" |
| Party Kits | party_kits | 4 | ✅ Part of "Party & Decor" |
| Celebrate Bundles | (separate collection) | 6 | ✅ "Bundles" tab |
| **Total Celebrate Products** | | **~279** | |
| Admin Panel Shows | (filtered) | 308 | includes some extras |

### ✅ COMPLETED — AI Image Generation for Party & Accessories (Mar 14, 2026)
1. **AI Image Generation** — 15 realistic product images generated using Cloudinary AI engine (GPT Image 1)
   - **Script:** `/app/backend/scripts/generate_party_accessory_images.py`
   - **Products:** Generic party items applicable across ALL breeds
   - **Storage:** `products_master` collection
   - **Visibility:** Party & Decor category tab shows 33 items with AI images first

### ✅ FIXED — Session 6 (Mar 15, 2026) — Critical Regression Restored
**Root Cause:** Previous session's cleanup script set `is_active: None` on all celebrate products, filtering them out.
**Fix Applied:**
- Re-activated 253 products: `breed-cakes`(42), `cakes`(111), `dognuts`(30), `frozen-treats`(24), `desi-treats`(7), `nut-butters`(6), `hampers`(37), `celebration`(106)
- Backend API `is_active` filter now also accepts `None`/`null` values (robustness)
- `getLovedFoods()` improved: handles both learned_facts formats (type:'loves' + category:'loves')
- `extractSoulTraits()` improved: cleaner, handles all fact formats, deduped

### ✅ Mira's Picks — Enhanced & Working (Mar 15, 2026)
- Food-based: Mojo loves "salmon treats" → "Salmon Delight Cake" imagined card
- Activity-based: "morning walks" → "Adventure Walk Party Pack"
- Soul onboarding: If no soul data → prompt card with "Help Mira Know Me"
- Works for ALL pets (Mojo, Mystique, any new pet)

### IN PROGRESS 🚧 — NEXT TASKS
1. **Replace `/celebrate` with `/celebrate-soul`** — once Aditya approves
2. **Standardize other pillar pages** — `/dine`, `/stay`, `/learn` using celebrate as template
3. **500 uncategorized products** — Admin needs to categorize or AI auto-categorize

---

## 🌟 MIRA IMAGINES CARD — FUTURE VISION (Product Research Engine)
> The MiraImaginesCard is a hidden gem — it's essentially a "dream item" that doesn't exist yet but Mira can will into existence.

### Current State
- Shows hypothetical products based on pet's loved foods (e.g., "Salmon Delight Cake")
- "Request a Quote" button → Concierge toast notification
- Max 3 imaginary cards per session

### Future Extension (P1)
**Extend MiraImaginesCard to ALL categories based on pet's soul profile:**
- If Mojo's soul mentions "loves swimming" → Mira imagines "Pool Day Party Kit"
- If pet loves car rides → Mira imagines "Road Trip Celebration Box"
- Every "Request a Quote" click creates a feedback loop → tells us exactly what products to build next
- **Mira becomes a product research engine** — user demand data for new product development

### Technical Implementation (Future)
```javascript
// In CelebrateContentModal.jsx - extend imaginedProducts generation
const generateSoulBasedImagines = (pet) => {
  const preferences = pet?.soul?.preferences || [];
  const activities = pet?.learned_facts?.filter(f => f.type === 'activity') || [];
  
  // Map soul data to imaginary products
  // "loves swimming" → "Pool Day Party Kit", "Pool Party Bandana Set"
  // "loves fetch" → "Ultimate Fetch Birthday Box"
  // This is the PRODUCT RESEARCH ENGINE
};
```

### Data Collection for Product Development
```javascript
// Track "Request a Quote" clicks
const trackImaginaryProductRequest = async (product, pet) => {
  await fetch('/api/mira/imaginary-requests', {
    method: 'POST',
    body: JSON.stringify({
      product_name: product.name,
      pet_breed: pet.breed,
      pet_soul_traits: pet.soul?.preferences,
      requested_at: new Date().toISOString()
    })
  });
  // This data tells us what to build next!
};

---

## CRITICAL ARCHITECTURE — Celebrate Page

### File Structure
```
/app/frontend/src/
├── App.js                                    # /celebrate-soul → CelebratePageNew
├── pages/
│   ├── CelebratePageNew.jsx                  # NEW soul-first page (USE THIS)
│   └── CelebratePage.jsx                     # OLD page (still at /celebrate)
└── components/
    └── celebrate/
        ├── index.js                          # Export index
        ├── CelebrateHero.jsx                 # ✅ DONE - pet photo + soul chips + Mira quote
        ├── CelebrateCategoryStrip.jsx        # 🚧 NEEDS MORE CATEGORIES + BIGGER ICONS
        ├── CelebrateContentModal.jsx         # 🚧 NEEDS BETTER IMAGE RENDERING + BIGGER MODAL
        ├── SoulCelebrationPillars.jsx        # ✅ DONE - 8 pillars
        ├── SoulPillarExpanded.jsx            # ✅ DONE - real products
        ├── MiraCuratedBox.jsx                # ✅ DONE - birthday box
        ├── CelebrateConcierge.jsx            # ✅ DONE - drawer with tabs
        ├── GuidedCelebrationPaths.jsx        # ✅ DONE
        └── CelebrationMemoryWall.jsx         # ✅ DONE
```

### Backend (Celebrate)
```
/app/backend/celebrate_routes.py              # /api/celebrate/* endpoints
/app/frontend/src/components/admin/CelebrateManager.jsx  # Admin panel (FIXED category dropdown)
```

---

## API ENDPOINTS (Celebrate-critical)

```
GET /api/products?category={X}&limit=40              # Shopify products by category
GET /api/products?limit=500                          # All products (paginates)
GET /api/celebrate/bundles                           # 6 illustrated bundles
GET /api/celebrate/products?category={X}            # Celebrate-specific products
GET /api/mockups/breed-products?breed={slug}&pillar=celebrate&limit=20  # Breed merch
GET /api/products/admin/{product_id}                 # Update product (backend has this)
PUT /api/celebrate/admin/products/{product_id}       # Update celebrate product
```

### Breed Slug Mapping (for `/api/mockups/breed-products`)
```js
const BREED_SLUG_MAP = {
  'indian pariah': 'indie', 'indie': 'indie',
  'labrador retriever': 'labrador', 'labrador': 'labrador',
  'golden retriever': 'golden', 'golden': 'golden',
  // ... see CelebrateContentModal.jsx getBreedSlug()
};
```

---

## DESIGN TOKENS — CELEBRATE PAGE (CRITICAL — DO NOT CHANGE)

| Token | Value | Usage |
|-------|-------|-------|
| Hero bg | `linear-gradient(135deg, #1a0020 0%, #3d0060 40%, #6b0099 75%, #9b0cbf 100%)` | Hero section |
| Birthday Box bg | `linear-gradient(135deg, #1a0020, #3d0060)` | MiraCuratedBox |
| Concierge bg | `#0E0620` (FLAT, NOT gradient) | CelebrateConcierge |
| Concierge CTA | `linear-gradient(135deg, #C9973A, #F0C060)` | Gold CTA |
| Birthday Box CTA | `linear-gradient(135deg, #C44DFF, #FF6B9D)` | Purple-pink CTA |
| Pillar glow shadow | `0 0 20px rgba(196,77,255,0.25)` | Glowing pillar cards |
| Pet photo field | `pet?.photo_url \|\| pet?.image_url` | NOT `pet?.image` |
| Mira open event | `window.dispatchEvent(new CustomEvent('openMiraAI', { detail: { message, context: 'celebrate' } }))` | Open Mira |
| Add to cart event | `window.dispatchEvent(new CustomEvent('addToCart', { detail: product }))` | Add product |

---

## SOUL PILLAR COLORS (Exact, from spec)
| Pillar | Background | Dot |
|--------|-----------|-----|
| Food & Flavour 🍰 | `linear-gradient(135deg, #FFF3E0, #FFE0B2)` | `#FF8C42` |
| Play & Joy 🎾 | `linear-gradient(135deg, #FCE4EC, #F8BBD0)` | `#E91E63` |
| Social & Friends 🦋 | `linear-gradient(135deg, #F3E5F5, #E1BEE7)` | `#9C27B0` |
| Adventure & Move 🌅 | `linear-gradient(135deg, #E3F2FD, #BBDEFB)` | `#2196F3` |
| Grooming & Beauty ✨ | `linear-gradient(135deg, #FFF9C4, #FFF176)` | `#F9A825` |
| Learning & Mind 🧠 | `linear-gradient(135deg, #E8F5E9, #C8E6C9)` | `#4CAF50` |
| Health & Wellness 💚 | `linear-gradient(135deg, #E0F7FA, #B2EBF2)` | `#00BCD4` |
| Love & Memory 📸 | `linear-gradient(135deg, #FFF3E0, #FFCCBC)` | `#FF5722` |

---

## TEST CREDENTIALS
- User: `dipali@clubconcierge.in` / `test123` (Mojo = 89% soul, chicken allergy, breed=indie)
- Admin: `aditya` / `lola4304`

---

## KNOWN ISSUES / BUGS (Not Fixed)
| Issue | Priority | Notes |
|-------|----------|-------|
| Birthday Cakes shows 80 of 111 (limit) | P3 | Intentional page limit. Consider infinite scroll or "Show More" |
| Category strip icons clipped/small | P2 | 34px icon box → need 52-62px |
| 500 uncategorized products | P2 | Need to query by tags/handle and auto-assign categories |
| Razorpay checkout failure | P3 | Legacy bug |
| Scrambled mobile pet dashboard | P3 | Layout bug |
| Admin Product Editor Image Upload Bug | P3 | File upload component |

---

## UPCOMING TASKS (Post Celebrate)
1. Make `/celebrate-soul` the live `/celebrate` (swap route in App.js) — awaiting Aditya approval
2. Apply soul-first template to `/dine` pillar
3. Standardize all 14 pillars
4. Add more Soul Products categories to Celebrate (blankets, plush toys, pet robes)
5. "Build a box" functionality — high value revenue feature
6. CMS audit for new celebrate sections

---

## ✅ SESSION 18 COMPLETE — Celebration Wall (Mar 2026)

**Source:** CelebrationWall_MASTER.docx | **Tested:** all major flows working

### Files built:
| File | Status |
|---|---|
| REWRITE `CelebrationMemoryWall.jsx` | ✅ DONE |
| CREATE `WallCard.jsx` | ✅ DONE |
| CREATE `WallUploadCard.jsx` | ✅ DONE |
| CREATE `WallUploadModal.jsx` | ✅ DONE |
| CREATE `WallLightbox.jsx` | ✅ DONE |
| MODIFY `celebration_wall_routes.py` | ✅ DONE |

### What works (LOCKED — do not change):
- Real photos Euro/Simba/Zippy NEVER replaced with stock
- Timestamps: NEVER "Recently" — Today / N days ago / Last week / DD Mon
- Upload card always first · 3-step modal (photo → caption+tag → confirmation)
- Frosted glass celebration type tags · Heart pop animation · Lightbox with prev/next
- Mira comment on own photos · 4-state subtitle (no pet/with pet/pending/approved)
- Backend: UGC upload → pending_review · Like toggle · Admin moderation (approve/reject)
- Default photos have stable IDs (default-1 through default-8)

---
