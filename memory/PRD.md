# Pet Life OS — PRD (Source of Truth)

## Original Mandate
Build a Pet Life OS for The Doggy Company (TDC) — a 12-pillar concierge platform unifying TDC's existing TDB bakery customers and new founding members. Built in memory of Mystique. Launch May 15, 2026.

## What Currently Exists
A React + FastAPI + MongoDB platform serving thedoggycompany.com. Recent work (Apr 29-30, 2026):
- AI Partner Proposal Generator (Claude Sonnet 4.5) at `/proposal/:slug`
- Admin Pages Directory (42 pages indexed)
- WhatsApp Concierge Button (Gupshup integration) on every Pillar
- "Try Mira on Your Dog" landing demo with Mystique tribute
- **TDB → TDC Founding Member import to PRODUCTION Atlas** — 40,025 pet_parents + 26,650 tdb_pets_staging successfully imported
- Three-tier backup (Daily / Gold Master / Monthly Frozen) on Google Drive
- Full admin CRUD viewer at `/admin → 🌷 Founding Members`

## Production Atlas State (post-import)
- `pet_parents`: 40,025 (founding members)
- `tdb_pets_staging`: 26,650 (extracted pet intelligence)
- `pets`: 47 (live production pets — UNTOUCHED throughout import)
- 13 indexes on pet_parents, 7 on tdb_pets_staging
- 23,738 parents linked to ≥1 pet
- 12,431 eligible for May 15 wave (2,000/day cap)
- 10 soft-launch records flagged for May 14

## Last Working Item (Apr 30, 2026)
- Item: TDB → TDC Founding Member Import (Steps 0-11) + Admin Viewer
- Status: COMPLETE
- Testing Done: Self-tested via screenshot tool
- User Verification Pending: Yes — review the admin viewer and confirm

## All Pending/In Progress Issues

### Issue 1: ElevenLabs TTS quota exhausted (P3)
- Out of quota; user to top up $15
- Code is correct; no changes needed
- Recurring: Y

### Issue 2: Production deployment of new endpoints (P0)
- New endpoints `/api/admin/snapshot/pin`, `/api/admin/snapshot/freeze`, `/api/admin/pet-parents/*`, `/api/admin/tdb-pets/*` are live in preview
- Need "Save to GitHub" + redeploy to push to production thedoggycompany.com
- Status: Awaiting Dipali

### Issue 3: Documentation auto-gen on production (P2)
- Markdown files gitignored on prod, HTML generates empty
- Status: Not started

### Issue 4: Shreesha multi-pet record cleanup (P2 — superseded)
- Now handled organically through admin viewer Rainbow Bridge / pet-edit features
- She's phone-only customer; Dipali to WhatsApp her on May 14

## Upcoming Tasks (in priority)

### P0 — May 15 Launch Path
- May 14 soft launch (Dipali personally WhatsApps each of the 10 + Shreesha + Ronan)
- May 15 full wave begins (2,000/day, 7-day stagger to May 21)
- Email orchestrator (Resend) — to be built (`founding_member_email_jobs.py`)
- Activation landing page `/founding-member/:token` — to be built
- Email template (HTML + plain) — to be drafted

### P1 — Mira Birthday Nudges (Post-launch)
- `mira_tdb_nudges.py` cron — daily 9 AM IST
- Allergen-aware filtering (skip Rainbow Bridge pets automatically — already coded into admin)
- 7-day-before-birthday WhatsApp via Gupshup

### P2 — Other
- Atlas migration completion (atlas_sync rail)
- Celebrate mobile parity gaps
- "Bespoke by Concierge" panel on /shop
- "Mira explains why" UI on Product Cards

### Future / Backlog
- Watch & Learn YouTube sections
- Two-way Zoho Desk
- Build the Love pillar
- Refactor server.py (>26K lines)

## 3rd-Party Integrations
- Claude Sonnet 4.5 — Emergent LLM Key (working)
- ElevenLabs TTS — out of quota (waiting for top-up)
- Gupshup WhatsApp — working
- Resend Email — working
- Zoho Desk — working
- Google Drive (SiteVault) — working, 304 MB backups confirmed
- MongoDB Atlas Production — working, full read+write from pod

## Critical Architecture Notes
- **Production write strategy:** New `pet_parents_routes.py` connects directly to PRODUCTION_MONGO_URL (not local DB). All admin CRUD reads/writes production Atlas.
- **`pets` collection (live, 47 records) NEVER touched.** Strict separation from `tdb_pets_staging`.
- **Founding member data flow:** `pet_parents` invite → activation → real `pets` doc created → `tdb_pets_staging.migrated_to_pet_id` updated.

## Key API Endpoints (production-ready, deployed in preview pending Save-to-GitHub)
- `GET /api/admin/pet-parents/stats`
- `GET /api/admin/pet-parents` (11 filter params, paginated, sortable)
- `GET /api/admin/pet-parents/{id}` (with linked pets)
- `PATCH /api/admin/pet-parents/{id}` (audit-logged)
- `POST /api/admin/pet-parents` (manual create)
- `DELETE /api/admin/pet-parents/{id}` (soft, reason required)
- `GET /api/admin/tdb-pets` (with rainbow_bridge filter)
- `PATCH /api/admin/tdb-pets/{staging_id}` (Rainbow Bridge auto-handling)
- `POST /api/admin/tdb-pets/bulk` reschedule / mark_soft_launch
- `GET /api/admin/pet-parents/export.csv?kind={full|emails|whatsapp|birthdays|overdue}`
- `GET /api/admin/pet-parents/audit/{id}`
- `POST /api/admin/snapshot/pin` (Gold Master)
- `POST /api/admin/snapshot/freeze` (Monthly Frozen)

## Backup State (Apr 30, 2026)
- Daily backup pre-import: Drive `1tNoxod5wHgXS_EFMEyjBS_cV_F8Vbjci` (143.8 MB)
- Daily backup post-import: Drive `15cx_YDNqqL4MwxV9shGL_JKwNAlIm5Q8` (143.8 MB)
- Gold Master: Drive `15INljD6A8A1C9JqCBad_ggtJUID57LC5` (label: founding-members-import-may2026)
- Monthly Frozen: Drive `16Jk1NjTpZ8MUHw36qKHz9MCbtdAgMcMO` in folder `Monthly-Frozen-Snapshots/2026-05-founding-members/`

## Test Credentials
- Admin: aditya / lola4304
- Member: dipali@clubconcierge.in / test123
