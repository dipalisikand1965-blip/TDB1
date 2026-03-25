# Roadmap — The Doggy Company Platform
## Last Updated: 2026-03-25 (Post Session 2)

---

## CURRENT STATUS

All 12 mobile pillar pages are functionally complete. All 17 customer-facing pages are mobile-responsive. The platform is go-live ready pending the items below.

---

## P0 — DONE ✅ (this sprint)

| Item | Status |
|---|---|
| Responsive split — all 12 pillars | ✅ Done Session 1 |
| Celebrate mobile — full parity | ✅ Done Session 1 |
| Dine mobile — full v11 | ✅ Done Session 1 |
| Landing page — 5 className bugs | ✅ Done Session 2 |
| Register — dark theme | ✅ Done Session 2 |
| Checkout — mobile order summary | ✅ Done Session 2 |
| Membership — responsive padding | ✅ Done Session 2 |
| Shop mobile — DoggyBakerySection | ✅ Done Session 2 |
| Celebrate mobile — CelebrateServiceGrid | ✅ Done Session 2 |
| Adopt mobile — 3-tab full rewrite | ✅ Done Session 2 |
| Farewell mobile — 3-tab full rewrite | ✅ Done Session 2 |
| Emergency mobile — 3-tab + WhatsApp | ✅ Done Session 2 |
| Services mobile — 7 service groups | ✅ Done Session 2 |
| Care mobile — 3-tab + dimTab + intelligence | ✅ Done Session 2 |
| Go mobile — 3-tab + dimTab + Stays | ✅ Done Session 2 |
| Play mobile — 3-tab + dimTab + BuddyMeetup | ✅ Done Session 2 |
| Learn mobile — 7 dim pills + YouTube | ✅ Done Session 2 |
| Paperwork mobile — 7 dim pills + DocumentVault | ✅ Done Session 2 |
| Emergency WhatsApp safety feature | ✅ Done Session 2 |
| Build fix (GENERATE_SOURCEMAP=false) | ✅ Done Session 2 |

---

## P1 — High Priority (next sprint)

### Mobile Parity — Remaining Gaps

1. **MiraPicksSection** on all 12 pillars
   - Inline AI-curated horizontal product scroll
   - Calls: `GET /api/mira/picks?pillar=X&pet_id=Y`
   - Appears in the Mira Bar section of every pillar
   - Effort: ~30 min per pillar (define once, copy pattern)

2. **LearnNearMe** — add to LearnMobilePage
   - Component file EXISTS at `/app/frontend/src/components/learn/LearnNearMe.jsx`
   - Just needs to be added to the Find Trainers section

3. **PaperworkNearMe** — add to PaperworkMobilePage
   - Component file EXISTS at `/app/frontend/src/components/paperwork/PaperworkNearMe.jsx`
   - Needs a new "Find Near Me" section or tab in Paperwork mobile

4. **SoulCelebrationPillars** — add to CelebrateMobilePage
   - Component file EXISTS at `/app/frontend/src/components/celebrate/SoulCelebrationPillars.jsx`
   - 6 celebration type cards (Birthday / Anniversary / Graduation / Gotcha Day / Festival / Soul)

5. **Profile Widgets** (inline in desktop, need to port to mobile)
   - `WellnessProfile` → Care mobile (grooming schedule, vet date, dental score)
   - `TripProfile` → Go mobile (trip planning dashboard)
   - `ActivityProfile` → Play mobile (exercise tracking)
   - `AdoptProfile` → Adopt mobile (adoption readiness)
   - `FarewellProfile` → Farewell mobile (farewell planning stage)
   - `EmergencyProfile` → Emergency mobile (readiness score)

6. **BreedCollectionSection** — Shop mobile
   - Browse by breed — horizontal breed chips → filtered product grid
   - Defined inline in ShopSoulPage.jsx

7. **ShopBrowseSection** — Shop mobile
   - Category browse tabs (Grooming / Dental / Nutrition / Accessories / Treats)
   - Defined inline in ShopSoulPage.jsx

### Data Quality

8. **38 Wrong-Image Products**
   - `needs_ai_image: true` in products_master
   - Use admin panel "AI IMAGES" tab to regenerate
   - OR deactivate: `db.products_master.updateMany({ needs_ai_image: true }, { $set: { is_active: false } })`

---

## P2 — Medium Priority

### Database & Infrastructure

9. **Production DB Migration**
   - Current status: BLOCKED (Atlas cluster network access issue)
   - Path A: Use platform "Use new database" deployment option
   - Path B: Resolve Atlas cluster IP whitelist
   - Path C: Run full DB sync tool (`POST /api/admin/full-db-sync-to-production`)

10. **Admin Performance**
    - Inbox, Finance, Dashboard tabs: >3s load time
    - Likely cause: unindexed queries on service_desk_tickets
    - Fix: add MongoDB indexes on `status`, `created_at`, `pillar`

11. **Celebrate Service Inventory**
    - Shadow records exist in products_master for Celebrate services
    - Build admin tool to clean/dedupe

### Product Features

12. **ServiceBookingModal** — full multi-step booking on mobile
    - Currently: ConciergeSection (functional equivalent, simpler)
    - For full parity: port 5-step modal from CareSoulPage.jsx:1655
    - Pillars: Care, Go, Play, Paperwork

13. **CelebrationMemoryWall** — Celebrate mobile
    - Past celebration photos & memories (read-only display)

14. **MiraSoulNudge** — Celebrate mobile
    - Contextual Mira insight card

---

## P3 — Future / Backlog

15. **Love Pillar** — brand new pillar build
16. **WhatsApp Daily Digest** — cron job for daily pet updates
17. **Medication reminders** — push notification + WhatsApp scheduler
18. **Admin.jsx refactor** — 7000+ lines → break into route-specific components
19. **K9 Sports section** — agility, nose work, dock diving (Play pillar)
20. **Multi-pet household** — pet-switching performance optimization
21. **Member dashboard mobile-first** — full redesign at 375px
22. **AI Soul Score** — live Mira scoring displayed on Pet Home
23. **Breed comparison tool** — for Adopt pillar
24. **Video production** — Mira explainer videos for each pillar

---

## SPRINT VELOCITY (reference)

| Session | Work Done | Test Result |
|---|---|---|
| Session 1 (Mar 24) | Foundation: responsive split + 11 stubs + Celebrate/Dine full parity | N/A |
| Session 2 (Mar 25) | Full rewrites: 10 pillars + 17 non-pillar fixes + Emergency WA | 18/18 ✅ |

---

## DEPLOYMENT NOTES

```bash
# Production build (always use this)
cd /app/frontend
GENERATE_SOURCEMAP=false NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Supervisor restart (only needed after .env changes or new deps)
sudo supervisorctl restart frontend
sudo supervisorctl restart backend

# Check logs
tail -n 100 /var/log/supervisor/backend.err.log
tail -n 100 /var/log/supervisor/frontend.err.log
```
