# Roadmap — The Doggy Company Platform
## Last Updated: 2026-03-25 (Post Session 3)

---

## CURRENT STATUS
Desktop is PRODUCTION-READY. Preview = Production.
All 12 mobile pillar pages are functionally complete with full Mira filtering.
ServiceBookingModal wired to Services, Care, Go, Play, Learn on mobile.
Admin backend product management fully functional.

---

## ✅ DONE (Sessions 1–3)

| Item | Session | Status |
|---|---|---|
| Responsive split — all 12 pillars | 1 | ✅ |
| All `*MobilePage.jsx` files created | 1 | ✅ |
| Dine mobile — full DineDimensionsRail | 1 | ✅ |
| Landing page — 5 className bugs | 2 | ✅ |
| Register / Checkout / Membership fixes | 2 | ✅ |
| All 12 pillar mobile pages wired | 2 | ✅ |
| Emergency WhatsApp alert | 2 | ✅ |
| Mira product filter (`useMiraFilter.js`) | 3 | ✅ |
| Mira's pick callout + footer on grids | 3 | ✅ |
| ServiceBookingModal — 8 service types | 3 | ✅ |
| ServiceBookingModal wired to 5 mobile pages | 3 | ✅ |
| Admin: archive/delete works | 3 | ✅ |
| Admin: toggle active/inactive fixed | 3 | ✅ |
| Admin: AI image custom prompt fixed (auth) | 3 | ✅ |
| Admin: service price badge (not ₹0) | 3 | ✅ |
| Admin: service tab auto-behaviour | 3 | ✅ |

---

## 🔴 P0 — CRITICAL (Next Agent Must Fix First)

None currently blocking production.

---

## 🟡 P1 — HIGH PRIORITY (Next Sprint)

### Mobile Feature Parity Gaps

1. **Celebrate mobile — 4 missing components** (HIGHEST IMPACT)
   - `BirthdayCountdown` — emotional countdown to pet's birthday
   - `SoulCelebrationPillars` — 8 glowing soul-aligned celebration type cards
   - `CelebrationMemoryWall` — past celebration photos
   - `MiraSoulNudge` — contextual Mira AI insight card
   - Files: All exist in `/app/frontend/src/components/celebrate/`
   - Effort: ~45 min total

2. **Near-Me components missing from mobile pages**
   - `LearnNearMe` → `LearnMobilePage` (component at `/components/learn/LearnNearMe.jsx`)
   - `PaperworkNearMe` → `PaperworkMobilePage` (component exists)
   - `GoNearMe` → `GoMobilePage` (check if component exists first)
   - Effort: ~5 min each

3. **MiraPicksSection on all 12 pillar mobile pages** (HIGHEST CONVERSION IMPACT)
   - Inline AI-curated horizontal product scroll
   - Calls: `GET /api/mira/picks?pillar=X&pet_id=Y`
   - Effort: ~30 min per pillar (define once, copy pattern)

4. **Profile Widgets for Care/Go/Play mobile**
   - `WellnessProfile` widget → Care mobile (component exists at `/components/care/`)
   - `TripProfile` widget → Go mobile
   - `ActivityProfile` widget → Play mobile
   - Effort: ~20 min each

### Admin Backend (Next Batch — User Sends One at a Time)

5. **Admin: SoulMadeBox features not working** (User confirmed — needs investigation)
6. **Admin: Bundles Box features not working** (User confirmed — needs investigation)
7. **Admin: Product box remaining features** (User will specify each one)

---

## 🟠 P2 — MEDIUM PRIORITY

1. **BreedCollectionSection + ShopBrowseSection** for Shop mobile
2. **38 products with wrong AI images** — deactivate or regenerate via admin AI IMAGES tool
3. **Production DB migration** (blocked by Atlas network access — user side)
4. **WhatsApp Daily Digest cron job** — morning digest of pet health reminders
5. **Medication refill reminders** via WhatsApp
6. **Dine "Mira explains why" expandable row** — one-tap soul profile reasoning on Dine/Care/Celebrate product cards (user approved this enhancement in Session 3)

---

## 🟢 P3 — FUTURE / BACKLOG

1. **Admin.jsx refactor** — 7000+ line monolith → componentise per section
2. **Love pillar build** — full pillar from scratch
3. **Admin tab performance** — Inbox, Finance, Dashboard >3s load time
4. **Dark theme consistency pass** across mobile pages
5. **Multi-pet switching performance** optimization
6. **K9 Sports / Agility section** on Play mobile

---

## DEPLOYMENT NOTES

- **Build command**: `GENERATE_SOURCEMAP=false NODE_OPTIONS="--max-old-space-size=4096" npm run build`
- **Preview = Production** (confirmed Session 3)
- **MongoDB Atlas**: Direct connection blocked — use platform native DB or HTTPS sync tool at `/api/admin/full-db-sync-export`
- **Admin auth**: HTTP Basic `aditya:lola4304` — stored in `localStorage.getItem('adminAuth')`
- **Member test account**: `dipali@clubconcierge.in` / `test123`

---

## TECHNICAL DEBT TRACKER

| Item | Severity | File |
|---|---|---|
| Admin.jsx 7000-line monolith | HIGH | `/app/frontend/src/pages/Admin.jsx` |
| ProductCard.jsx 1990-line file | MEDIUM | `/app/frontend/src/components/ProductCard.jsx` |
| applyMiraIntelligence duplicated in 3 files | LOW | DineSoulPage, DineSoulPageDesktopLegacy (now uses ALLERGEN_MAP but still local) |
| CareSoulPage inline ServiceBookingModal | LOW | `/app/frontend/src/pages/CareSoulPage.jsx` |
| tdc.book() + ServiceBookingModal coexist | LOW | All mobile pages |
