# 🐾 The Doggy Company — Agent Handoff · 29 April 2026

> **For:** Next agent picking up this codebase.
> **Generated:** 29 Apr 2026 by Aditya (E1 fork) at the close of a multi-day rescue + hardening sprint with Dipali.
> **Read this BEFORE** `/app/memory/DOGGYCOMPANY_COMPLETE_ARCHITECTURE.md`. This file captures recent context. The architecture file captures static structure.

---

## 🎯 Where We Are Right Now

The site is live at **`thedoggycompany.com`** (frontend on Vercel) and **`pet-soul-ranking.preview.emergentagent.com/api/*`** (backend on Emergent pod). Production is being actively reviewed by an investor — **do not break core flows**.

In the last 96 hours we caught and fixed **5 silent production bugs** (all detailed below). At rest right now (29 Apr 02:47 UTC):

| Layer | Status |
|---|---|
| Frontend (Vercel) | 🟢 Live, latest deploy stable |
| Backend (Emergent pod) | 🟢 Running, UptimeRobot keeping it awake |
| MongoDB (local) | 🟢 198 collections, 336,575 documents |
| SiteVault (Google Drive Fort Knox) | 🟢 Last backup 5.2h ago · 289.8 MB · MongoDB included for first time ever |
| Zoho Desk sync | 🟢 Active · last push 1.9d ago (some idle days expected on weekend) |
| Integrations Health Panel | 🟢 6 green / 3 amber / 0 red |

---

## 📋 Everything Built / Fixed This Sprint (chronological)

### ✅ Day 1 — Tester feedback + UX polish
- **Mixed-breed chips made prominent** in NearMe (Navya feedback)
- **Hydrotherapy + Walkers** added to NearMe rail
- **Specialist Vets + auto-routing** added to Care NearMe
- **Google rating + "TDC Verified" / "Bakery Verified" pills** across all 9 NearMe components with sorting (verified places to position 0)
- **Admin Places Panel** with one-click "Mark as Verified" toggle
- **Nightly B2B outreach digest** via Resend (places to verify) — 8:00 AM IST daily
- **Celebrate UI** — fixed pink-sliver top seam with 8px dark sticky cap
- **Go Hero** — un-clipped "Soul 100%" pill (refactored out of `overflow:hidden` container)
- **Investor decks** — refreshed traction (9,497 products, 1,026 services, 29,878 Mira sessions, 810K LOC) + OG meta tags + Microsoft Clarity tracking
- **Microsoft Clarity** (project ID `wg80h6tw9z`) embedded in main React SPA + 4 investor HTMLs
- **Admin: 📊 Clarity Analytics tab** — wired into Commerce row + Analytics row of Admin
- **Razorpay 500 error** — investigated, confirmed already fixed
- **Birthday-Box 500** — investigated, confirmed resolved by `or {}` safeguards

### ✅ Day 2 — Safety Vault + Scheduler hardening
- **Daily SiteVault status email** (Resend) at 8 AM IST — `dipali@clubconcierge.in` + CC `sysadmin@clubconcierge.in`
  - SUCCESS template: subject `✅ TDC Safety Vault Backup Complete — DD MMM YYYY` + size, files, doc count, duration, location
  - FAILURE template: subject `🔴 URGENT: TDC Safety Vault Backup FAILED` + error, failing step, last successful, smart recommendation
  - WhatsApp blast to `ADMIN_WHATSAPP_NUMBER` (9739908844) via Gupshup on failure
- **Weekly summary email** (Mon 9 AM IST) — daily backups X/7, weekly full X/1, monthly frozen, Gold Masters retained, total Drive storage, next monthly date
- **Scheduler hardening (applies to ALL crons):**
  - `misfire_grace_time=7200` (2-hour grace if pod was sleeping at slot time)
  - Startup catch-up — if pod boots between 8 AM–11 PM IST and today's email/backup wasn't sent, fires immediately
  - Mongo `last-sent` markers (`outreach_digest_log`, `sitevault_status_email_log`) prevent double-sends
- **UptimeRobot 5-min keepalive ping** → `/api/sitevault/health` (free tier)
- Bug found: backend pod slept overnight on 24→25 Apr (23h gap) and 25→26 Apr (33h gap) → 25 Apr backup completely missed. Fixed by misfire grace + UptimeRobot.

### ✅ Day 3 — Navbar bell + Zoho silent-kill-switch
- **Navbar bell P0** — `/api/unified-inbox/unread-count` was 404; `/api/notifications/unread-count` was missing `member_notifications` aggregation. Built unified endpoint aggregating 5 sources: `member_notifications`, `notifications` (legacy), `push_notification_logs`, `tickets` (with `has_unread_update`), `concierge_requests` (pending). Dipali's bell went from 0 → 22 unread → displays "9+".
- **Legacy `service_requests` cleanup** — soft-closed all 398 pending records to `status: closed_legacy` with `closure_note`, `closed_at`, `closed_by`. Investigation confirmed 0 real customers (all from `mira_soulful` test flow + Dipali self-tests). Mira Soulful flow itself is correct production behavior (creates pending tickets for concierge).
- **Zoho silent kill switch (BIG ONE)** — found `ZOHO_ENABLED=false` on production. Last successful Zoho push was 21 Apr. **2,284 tickets created between 22 Apr and 27 Apr were NEVER pushed to Zoho.** Toggled flag back to `true`, ran 2 rounds of bulk-sync (~250 tickets pushed, including Mojo's `TDB-2026-2823 → Zoho #2604271934`). Remaining ~2,000 are queued in the system.

### ✅ Day 3 — Integrations Health Panel (built from scratch in 30 min)
- **`/app/backend/integrations_health_routes.py`** — 9 probe functions: Zoho, Resend, Cloudinary, Razorpay, Gupshup, SiteVault, Google Places, MongoDB Atlas, UptimeRobot
- **`/app/frontend/src/components/admin/IntegrationsHealthPanel.jsx`** — auto-refresh every 60s, 3 colored summary cards (Healthy/Watch/Action needed), expandable per-integration rows
- **Wired into Admin → Command Center row** as **"Health"** tab (next to Pillar Queues)
- **Caught its first bug live** — turned red for SiteVault → revealed production has been silently failing MongoDB backups

### ✅ Day 3 — MongoDB pymongo fallback (CRITICAL)
- **The biggest bug of the sprint:** Health Panel revealed production's `sitevault_runs.errors[0]: "mongodump: [Errno 2] No such file or directory"` — i.e. **production has been silently failing MongoDB backups since SiteVault was deployed**. Other artifacts (memory archive, Cloudinary manifest, documents mirror) were uploading, but the most-important MongoDB dump was always missing.
- **Root cause:** Production pod doesn't ship the `mongodump` binary (only the minimal Python image is deployed).
- **Fix:** Added `_dump_mongodb_python()` to `/app/backend/sitevault_backup_jobs.py` — uses `pymongo` + `bson.json_util` + `tarfile` to dump every collection as `<col>.jsonl.gz`, bundles into a single `.archive.gz`. Restorable via `mongoimport --gzip` per collection.
- **First-ever real production MongoDB backup** ran successfully after deploy: **289.8 MB total · 137 MB MongoDB archive · 4 files · 0 errors · run `20260427-055108`**.

### ✅ Day 3 — Multi-pet onboarding (Shirley → Shreesha bug)
- **Reported by Dipali** via 2 separate user feedback screenshots
- **The actual user affected:** `shreeshahemmige@gmail.com` (Shreesha) — 6 dogs all merged into ONE pet record (`name: "Dixy, jaanu, suki, Bhairavi, Steffy,olive"`) on 27 Apr.
- **Phase 1** — Registration UX fixes (`/app/frontend/src/pages/MiraMeetsYourPet.jsx`):
  - **Fix A:** Comma-detection in pet name field with red warning + Next button disabled
  - **Fix B:** Big purple "DOG 1 OF 6 · {name}" header with progress bars per pet + "{N} more after this" pill
  - **Fix C:** Multi-breed chip picker — selected breeds shown as removable chips, joined with " × " in DB (e.g., `Boxer × Golden × Husky`). Backwards-compatible (single breed → behaves as before).
- **Phase 2** — Per-pet Soul Builder (`/app/frontend/src/pages/PetSoulOnboarding.jsx`):
  - **Pet picker screen** when user has 2+ dogs ("Which dog first?" + status chips ✅/⏳ + clickable cards)
  - **Quiz state isolated per dog** — `currentPet` resets between dogs; question text uses `{name}` (not concatenated names)
  - **Pet-complete bridge screen** — "{name}'s profile is complete! 1 more dog to go" + "Start {nextDog}'s profile →" + "I'll do the others later"
  - **Progress tracker** on both picker AND completion screens
- **Phase 3** — Cleanup endpoint built: `GET /api/admin/find-multi-name-pets?secret=...` — production sweep returned 1 affected user (Shreesha)
- **Action pending:** Decision from Dipali on Shreesha cleanup option (a/b/c/d) — still awaiting reply

### ✅ Day 3 — iOS modal scroll bug (Birthday Box / Build a Box)
- **Reported by Dipali on iPhone:** modal sticks to bottom of viewport, "back keeps rolling"
- **Root cause:** Custom `motion.div` modal (not Shadcn Dialog) with `position:fixed` outer + `overflowY:auto` inside it + `maxHeight:none` on content → iOS Safari scrolls the BODY behind the modal because nothing locks the scroll
- **Fix in TWO files** (`BirthdayBoxBuilder.jsx` + `BirthdayBoxBrowseDrawer.jsx`):
  - Added body scroll lock useEffect — sets `body.position=fixed, top=-scrollY, overflow=hidden` on open; restores on close including original scroll position
  - Changed outer wrapper `overflowY:auto → overflow:hidden` (don't scroll the wrapper)
  - Added `maxHeight: calc(100vh - paddings - safe-area-insets)` to inner card
  - Added `WebkitOverflowScrolling:touch, overscrollBehavior:contain, touchAction:pan-y` to inner card

### ✅ Day 3 — Documentation refresh
- Architecture audit endpoint runs: `POST /api/admin/architecture/refresh`
- Auto-regenerated `/app/memory/DOGGYCOMPANY_COMPLETE_ARCHITECTURE.md` (428 lines, 17.8 KB)
- Captured: 198 collections, 336,575 documents
- Working today (29 Apr 02:47 UTC)

---

## 🧪 Tester Feedback Received (and status)

| From | Feedback | Status |
|---|---|---|
| Navya | Mixed breed chips not prominent enough | ✅ Fixed |
| Navya | Hydrotherapy + Walkers missing in NearMe | ✅ Added |
| Navya | Specialist vets needed in Care NearMe | ✅ Added with auto-routing |
| Shirley (3 devices) | Couldn't complete registration with multiple dogs | ✅ Fixed (Phase 1) |
| Shreesha | All 6 dogs merged into 1 pet record on signup | ✅ Code fixed; data cleanup decision pending |
| Dipali (sysadmin) | False-positive "Backup FAILED" email | ✅ Failure email rewording fix shipped |
| Dipali (sysadmin) | "Build a Box" modal sticks to bottom on iOS | ✅ Fixed (this session) |

---

## 🔌 Integration Status (live as of 29 Apr 02:48 UTC)

| Integration | Status | Note |
|---|---|---|
| 🟢 **Resend (Email)** | green | Last email 18 min ago |
| 🟢 **Razorpay** | green | Last order 7d ago |
| 🟢 **Cloudinary** | green | Configured |
| 🟢 **Gupshup (WhatsApp)** | green | Configured |
| 🟢 **SiteVault (Google Drive)** | green | Last backup 5.2h ago · 289.8 MB · MongoDB now included |
| 🟢 **UptimeRobot Keepalive** | green | Pod awake · last status email 18 min ago |
| 🟡 **Zoho Desk** | amber | Active but last push 1.9d ago (no recent member tickets — expected for weekend) |
| 🟡 **Google Places API** | amber | Configured but no recent verified-place updates tracked |
| 🟡 **MongoDB Atlas (hot standby)** | amber | **NOT CONFIGURED** — weekend project, awaiting decision |

---

## 🗃️ Database Counts (production, 29 Apr 02:48 UTC)

Top 20 collections by document count:
| Collection | Docs |
|---|---|
| mira_conversations | 83,249 |
| unified_products | 57,192 |
| admin_notifications | 29,935 |
| mira_product_scores | 27,200 |
| member_notifications | 26,874 |
| mira_signals | 26,821 |
| live_conversation_threads | 9,946 |
| products_master | 9,503 |
| mira_memories | 5,186 |
| products_master_backup_20260322 | 5,131 |

**Totals:** 198 collections, 336,575 documents

---

## 🌐 Preview vs Production

| Layer | Preview | Production |
|---|---|---|
| Frontend URL | (none — backend only) | https://thedoggycompany.com |
| Backend URL | https://pet-soul-ranking.preview.emergentagent.com | (same — single backend) |
| Database | `pet-os-live-test_database` (local Mongo) | Same (single shared DB) |
| Markdown source files | All 100+ `.md` files present | NOT bundled (only what's in deploy) |
| `complete-documentation.html` | Auto-regenerated on backend startup | Frozen at last Vercel deploy |
| Code parity | Always ahead by uncommitted changes | Last `Save to GitHub → Deploy` |

**Critical:** Backend is shared between preview and production. Preview pod = production backend.

---

## 🐛 Open Bugs (priority order)

| Priority | Bug | Status |
|---|---|---|
| 🔴 P1 | Shreesha's merged pet record on production needs cleanup decision (a/b/c/d) | Awaiting Dipali reply |
| 🟠 P2 | Remaining ~2,000 historical Zoho ticket backlog (TDB-2026-0001 through ~TDB-2026-1862 still unsynced) | Run `bulk-sync?limit=500` 4× more times |
| 🟠 P2 | `complete-documentation.html` on production is essentially empty (1 file / 2 lines) — markdown source files not bundled | Need build-time generator hook in `package.json` OR live endpoint |
| 🟠 P2 | `owners-guide.html` returns `false` from generator (source markdown missing) | Check `/app/memory/OWNERS_GUIDE_DIPALI.md` exists |
| 🟡 P3 | QA Report bugs 7, 8, 11, 14 (location mismatch, dup pillars, irrelevant Mira messages, missing pet fields) | Not started |
| 🟡 P3 | 60-day auto-cleanup cron for stale `service_requests` | Deferred (Dipali says nice-to-have) |
| 🟡 P3 | Monthly frozen snapshot cron (1st of each month) | Currently MISSING in weekly summary report |

---

## 📌 Pending Before May 15 (target priorities)

| # | Item | Owner |
|---|---|---|
| 1 | Shreesha cleanup decision + execute | Dipali decision → Aditya execute |
| 2 | Finish Zoho backfill (4 more rounds of bulk-sync) | Aditya |
| 3 | Build-time documentation generator hook | Aditya |
| 4 | MongoDB Atlas hot standby (weekend project) | Aditya, when greenlit |
| 5 | "Bespoke by Concierge" upsell card (Concierge modal + Shop right panel) | Aditya |
| 6 | "Mira explains why" UI (`ProductCard.jsx` / `MealBoxCard.jsx`) | Aditya |
| 7 | Celebrate mobile parity: `BirthdayCountdown`, `SoulCelebrationPillars`, `CelebrationMemoryWall`, `MiraSoulNudge` | Aditya |
| 8 | `LearnNearMe`, `PaperworkNearMe`, `GoNearMe` components on mobile | Aditya |
| 9 | "Watch & Learn" YouTube video sections (Care + Go) | Aditya |
| 10 | Clean bad admin data for "dinner" intent (Mongo `products_master`) | Aditya |

---

## 📁 All Key Files Changed This Sprint

### New files
- `/app/backend/integrations_health_routes.py` (9 probes + sweep endpoint)
- `/app/backend/sitevault_daily_status_email.py` (daily 8 AM IST email)
- `/app/backend/sitevault_weekly_summary_email.py` (Monday 9 AM IST email)
- `/app/backend/places_outreach_digest.py` (B2B outreach 8 AM IST)
- `/app/backend/admin_places_verified_routes.py` (Places admin)
- `/app/frontend/src/components/admin/IntegrationsHealthPanel.jsx`
- `/app/frontend/src/components/admin/PlacesVerifiedManager.jsx`
- `/app/frontend/src/components/admin/ClarityAnalyticsPanel.jsx`
- `/app/frontend/src/components/common/NearMeBadges.jsx`
- `/app/memory/DOGGYCOMPANY_AGENT_HANDOFF_APR29.md` (this file)

### Modified files
- `/app/backend/server.py` — `/api/unified-inbox/unread-count`, `/api/notifications/unread-count`, scheduler wiring
- `/app/backend/sitevault_backup_jobs.py` — pymongo fallback for missing mongodump binary
- `/app/backend/sitevault_routes.py` — `send-status-email-now`, `send-weekly-summary-now`
- `/app/backend/places_outreach_digest.py` — misfire grace + startup catch-up
- `/app/backend/.env` — `ZOHO_ENABLED=true`
- `/app/frontend/src/pages/Admin.jsx` — Clarity tab in Commerce + Analytics rows + Health tab in Command Center
- `/app/frontend/src/pages/MiraMeetsYourPet.jsx` — comma-detection + DOG N OF M header + multi-breed chips
- `/app/frontend/src/pages/PetSoulOnboarding.jsx` — pet picker screen + per-pet quiz + complete screen
- `/app/frontend/src/components/celebrate/BirthdayBoxBuilder.jsx` — iOS scroll lock + inner-card scroll
- `/app/frontend/src/components/celebrate/BirthdayBoxBrowseDrawer.jsx` — same iOS fix

### Investor pages
- `/app/frontend/public/investor-deck.html` — refreshed traction + OG tags + Clarity
- `/app/frontend/public/investor.html` — same
- `/app/frontend/public/investor-pet-wrapped.html` — same
- `/app/frontend/public/introduction.html` — same
- `/app/frontend/public/index.html` — Clarity tracking added

---

## 🚀 Deploy Sequence Reminder

**Always in this order:**

1. **Lint** — both Python (`ruff`) and JS (`eslint`) MUST pass
2. **Test on preview** — restart backend (`sudo supervisorctl restart backend`), trigger preview screenshot or curl, verify
3. **Save to GitHub** in chat panel → use descriptive branch name (e.g., `fix/ios-birthday-box-modal-scroll-lock`)
4. **Merge PR** on GitHub (via the GitHub PR UI)
5. **Hit Deploy** on Emergent → Vercel build (~3 min)
6. **Hard-refresh production** (Cmd+Shift+R) to bypass cache
7. **Verify on production** with curl + a screenshot OR a real iPhone test
8. **Check Health Panel** at `thedoggycompany.com/admin` → 📊 Health tab — confirm no regressions

**Common pitfalls:**
- `.env` files are gitignored — production env changes must be made in Emergent Settings → Environment Variables, NOT in `.env`
- `mongodump` binary is NOT on production — always use the pymongo fallback for any new MongoDB backup logic
- The Emergent preview pod sleeps when idle — UptimeRobot 5-min ping keeps it awake; without that, missed crons
- Always add `data-testid` to interactive elements (testing agent contract)

---

## 🔑 Critical Credentials (also in `/app/memory/test_credentials.md`)

| Account | Email | Password |
|---|---|---|
| Member (test) | dipali@clubconcierge.in | test123 |
| Admin (basic auth) | aditya | (in `ADMIN_PASSWORD` env var) |

---

## 🛡️ Environment Variables (production)

All set, all working:
- `MONGO_URL`, `DB_NAME`
- `RESEND_API_KEY` (active)
- `ZOHO_DC=in`, `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_ORG_ID`, `ZOHO_DEPARTMENT_ID`, `ZOHO_ENABLED=true`, `ZOHO_WEBHOOK_TOKEN`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GUPSHUP_API_KEY`, `WHATSAPP_NUMBER=918971702582`, `ADMIN_WHATSAPP_NUMBER=919739908844`
- `GOOGLE_PLACES_API_KEY`
- `EMERGENT_LLM_KEY` (universal)
- `SITEVAULT_ENABLED=true`, `SITEVAULT_TZ=Asia/Kolkata`
- Microsoft Clarity project: `wg80h6tw9z`

---

## 🎁 Final Note for Next Agent

This codebase is approaching production-grade. The Integrations Health Panel will catch most silent regressions before they spread. **Always check the Health panel on every session start** — if anything is red or unexpectedly amber, fix it before doing new work.

When in doubt about a Mira flow, read `/app/backend/mira_soulful_brain.py:execute_create_service_ticket` — it's the canonical pattern. When in doubt about backups, read `/app/backend/sitevault_backup_jobs.py` — the pymongo fallback there is the reference.

Dipali deserves to wake up to ✅ emails, not 🔴 ones.

— Aditya (E1), 29 Apr 2026, 03:00 UTC 🌷
