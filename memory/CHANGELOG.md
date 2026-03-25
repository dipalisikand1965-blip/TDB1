# Changelog — The Doggy Company Platform

---

## SESSION 2 — 2026-03-25 (Mobile Parity Sprint + Emergency WhatsApp)

### BATCH 1 — Non-Pillar Page Fixes (All tested ✅)

**Landing Page (`/`)**
- Fixed 5 broken `className inside style={}` bugs:
  - `tdc-stats-grid` — stats grid now goes 2-col at mobile
  - `tdc-isnot-grid` — IS/ISN'T grid now stacks at mobile
  - `tdc-mojo-hdr` — Mojo header flex-wraps on mobile
  - `tdc-soul-grid` — Soul facts grid goes 2-col at mobile
  - `tdc-how-grid` — How It Works grid adapts at mobile
- All were `style={{ className: "..." }}` → fixed to `className="..." style={{}}`

**Checkout (`/checkout`)**
- Moved order summary ABOVE the form on mobile
- Used CSS `order-1 lg:order-2` on summary, `order-2 lg:order-1` on form
- Changed `sticky top-24` to `lg:sticky lg:top-24` (sticky only on desktop)

**Membership (`/membership`)**
- Fixed pricing card hardcoded `padding: "40px 48px"` → `padding: "clamp(20px,5vw,48px)"`

**Register (`/register`)**
- Full rewrite: dark theme matching Login page
- slate-950 background, gradient button (pink→purple)
- Added Kouros & Mystique portraits (mobile + desktop)
- Consistent with app aesthetic

---

### BATCH 2 — Pillar Quick Wins (All tested ✅)

**CelebrateMobilePage**
- Added `CelebrateServiceGrid` ("Celebrate Personally" services section)
- Positioned after GuidedCelebratePaths

**ShopMobilePage**
- Added `DoggyBakerySection` inline with:
  - Filter chips: All / Cakes / Treats / Hampers / Seasonal
  - Streaties sustainability badge
  - Product grid using SharedProductCard
  - "See all on thedoggybakery.com" link
  - `G` colour palette matching desktop

**Dine pills investigation**
- Confirmed: `DineCategoryStrip` already handles modal state internally — pills DO open DineContentModal (self-contained)

---

### BATCH 3 — 3-Tab Pillar Rewrites (All tested ✅)

**AdoptMobilePage — Full Rewrite**
- 3 tabs: 🐾 Find Your Dog | 💌 Book Guidance | 📍 Find Rescue
- Find Your Dog: stage tracker (Thinking/Ready/Looking/Matched/Home), products, GuidedAdoptPaths, MiraImaginesBreed, Mira Bar
- Book Guidance: ADOPT_SERVICES (6 service cards), MiraImaginesCard x3
- Find Rescue: AdoptNearMe
- Colour: Deep Mauve #4A0E2E + Rose #D4537E
- All service bookings fire tdc.book() + booking confirmation sheet

**FarewellMobilePage — Full Rewrite**
- 3 tabs: 🌷 Legacy & Memorial | 💙 Get Support | 📍 Find Care
- Legacy: product sub-tabs (Memorial & Legacy / Grief Support / Final Care), GuidedFarewellPaths, MiraImaginesCard x3, SoulMadeModal, Mira reflection message
- Get Support: FAREWELL_SERVICES (6 service cards — End-of-Life, Cremation, Memorial, Ceremony, Grief Counselling)
- Find Care: FarewellNearMe
- Colour: Deep Midnight #1A1A2E + Soft Indigo #6366F1

**EmergencyMobilePage — Full Rewrite**
- Persistent URGENT CTA always pinned above tabs
- 3 tabs: 🩺 Emergency Kit | 📋 Book Help | 📍 Find Vet
- Emergency Kit: dimTab (Products/Services), GuidedEmergencyPaths, MiraImaginesBreed
- Book Help: EMERG_SERVICES cards (6)
- Find Vet: EmergencyNearMe
- Colour: Crimson #DC2626
- WhatsApp integration (see below)

---

### EMERGENCY WHATSAPP (Real Safety Feature ✅)

**Backend: `POST /api/notifications/emergency-whatsapp`**
- Added at line ~17479 in server.py (before include_router — critical!)
- Calls `send_whatsapp_message()` from whatsapp_notifications.py
- Sends to concierge: 919739908844
- Message: `🚨 EMERGENCY — {petName} ({breed}). Parent: {userName}. Allergies: {allergies}. Needs immediate vet help. Contact NOW.`
- Also creates `service_desk_tickets` entry with `urgency: "critical"`
- Returns `{ success: bool, message: str }`

**Frontend: EmergencyMobilePage `handleUrgentCTA()`**
- Fires `tdc.book({ urgency: 'critical' })` + `POST /api/notifications/emergency-whatsapp` simultaneously
- Shows green "✓ Concierge notified via WhatsApp" banner in confirmation sheet
- Testing agent bug fix: moved endpoint before `include_router`; fixed missing `useNavigate` import

---

### BATCH 4 — Services Mobile Rewrite (Tested ✅)

**ServicesMobilePage — Full Rewrite**
- 7 expandable service group cards:
  1. ✨ Pamper & Groom → pillars: care
  2. 🏥 Health & Vet → pillars: care, emergency
  3. 🎓 Train & Learn → pillars: learn, play
  4. 🎉 Celebrate → pillars: celebrate
  5. 🏃 Fitness & Walks → pillars: fit, play
  6. ✈️ Travel & Paperwork → pillars: go, travel, paperwork
  7. 🌷 Life Events → pillars: adopt, farewell, dine
- Lazy fetch: services load from `/api/service-box/services?pillar=X` only on expand
- Each service has "Book →" button → `tdc.book()` → booking confirmation bottom sheet
- PersonalisedBreedSection below the groups
- Colour: Navy #0F1A3D

---

### BATCH 5 — Care / Go / Play Rewrites (Tested ✅)

**CareMobilePage — Full Rewrite**
- 3 top tabs: 🌿 Care & Products | ✂️ Care Services | 📍 Find Care
- Products tab:
  - dimTab toggle: All Products / Personalised
  - All Products: sub-category pill filter (from fetched products)
  - `applyMiraIntelligence` with allergy filtering + "✓ N safe / ✗ N filtered" stats
  - Personalised: PersonalisedBreedSection + MiraImaginesCard x3
  - SoulMadeModal CTA
  - GuidedCarePaths + MiraImaginesBreed
- Care Services tab: CareConciergeSection
- Find Care tab: CareNearMe
- Colour: Sage Green #40916C

**GoMobilePage — Full Rewrite**
- 3 top tabs: ✈️ Go & Products | 🛎️ Services | 🏨 Stay
- Products tab: dimTab + sub-category pills + GuidedGoPaths + MiraImaginesBreed + SoulMadeModal
- Services tab: GoConciergeSection
- Stay tab: PetFriendlyStays
- Colour: Teal #1ABC9C

**PlayMobilePage — Full Rewrite**
- 3 top tabs: 🎾 Play & Products | 🐕 Services | 📍 Find Play
- Products tab: dimTab + sub-category pills + GuidedPlayPaths + MiraImaginesBreed + SoulMadeModal
- Services tab: BuddyMeetup + PlayConciergeSection
- Find Play tab: PlayNearMe
- Colour: Orange #E76F51

---

### BATCH 6 — Learn / Paperwork Rewrites (Tested ✅)

**LearnMobilePage — Full Rewrite**
- 7 dimension pills (scrollable):
  🎓 Foundations | 🧠 Behaviour | 🏆 Training | ✨ Tricks & Fun | 🐕 Socialisation | 🌟 Soul Learn | ✦ Mira's Picks
- Each dimension has its own panel with dimTab: Products / Videos / Book
- Products: fetch from `/api/admin/pillar-products?pillar=learn&sub_category=X`
- Videos: fetch from `/api/test/youtube?query={breed} {dimYtQuery}&max_results=6`
  - VideoCard component renders thumbnail + title + channel + play button → opens YouTube
- Book: service booking cards (2 per dimension, relevant to that dimension)
- Below dimensions: GuidedLearnPaths + PersonalisedBreedSection + MiraImaginesBreed + MiraImaginesCard x2 + SoulMadeModal
- Colour: Purple #7C3AED

**PaperworkMobilePage — Full Rewrite**
- DocumentVault at top (existing component)
- 7 dimension pills:
  🪪 Identity & Safety | 🏥 Health Records | ✈️ Travel Documents | 🛡️ Insurance & Finance | 📚 Breed & Care Guides | 💡 Expert Advisory | 🌟 Soul Documents
- Each dimension has dimTab: Products / Services / Advisory
- Products: fetch per dimension sub_category
- Services: 2 services per dimension (organisation + certification)
- Advisory: ADVISORY_SERVICES (4 advisory cards) or from `/api/service-box/services?pillar=paperwork&type=advisory`
- Below: GuidedPaperworkPaths + PersonalisedBreedSection + MiraImaginesCard x2 + SoulMadeModal
- Colour: Teal #0D9488

---

### BUG FIXES (this session)

| Bug | Fix | File |
|---|---|---|
| Build OOM | `GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=4096` | package.json / build cmd |
| Emergency WA endpoint after include_router (dead zone) | Moved to line 17479 (before include_router at 21706) | server.py |
| EmergencyMobilePage missing `useNavigate` import | Added import | EmergencyMobilePage.jsx |
| ShopMobilePage missing `useCallback` import | Added import | ShopMobilePage.jsx |
| Landing page 5x className-in-style | Fixed to proper className= | LandingPage.jsx |

---

## SESSION 1 — 2026-03-24 (Mobile Foundation)

### Major Work
- Implemented site-wide responsive split for all 12 pillar pages
- Created 11 new `*MobilePage.jsx` files (foundational stubs)
- Replaced Dine page with full v11 implementation
- Wired Celebrate mobile with full feature parity (category pills, cake builder, birthday box, Mira Picks)
- Fixed `book is not defined` error on desktop Dine
- Enhanced `tdc.book()` with notes, metadata, service_type, urgency
- Fixed PersonalisedBreedSection to dark premium card
- Removed bottom nav from all 12 mobile pillar pages
- Fixed duplicate profile card bugs on Celebrate, Care, Go
- Added hero padding (32px top) on all mobile pages for navbar clearance
- Full DB Sync hardened with `bson.json_util` for ObjectId round-trip
- Created initial documentation set (PRD, CHANGELOG, ROADMAP, MOBILE_WIRING_SPEC)
