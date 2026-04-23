# 🐾 TDC Agent Context — Paste-able Primer

> **TL;DR for any agent starting fresh on TheDoggyCompany.** Read this first. Then `PRD.md`, then `DOGGYCOMPANY_COMPLETE_ARCHITECTURE.md` for depth.

## Stack & URLs
- **Frontend**: React 18 at `https://pet-soul-ranking.preview.emergentagent.com` (preview) · `https://thedoggycompany.com` (prod)
- **Backend**: FastAPI monolith (`/app/backend/server.py` — 26K lines, being modularised)
- **Database**: MongoDB 7, `pet-os-live-test_database`, mounted on persistent NVMe
- **CDN**: Cloudinary (documents + Mira Imagines watercolours)
- **Prod cloud backup**: MongoDB Atlas via `PRODUCTION_MONGO_URL`, synced every 6h

## Credentials
- **Admin**: `aditya` / `lola4304` (set in `/app/memory/test_credentials.md`)
- **Test Member**: `dipali@clubconcierge.in` / `test123`
- **Preview Mongo**: localhost:27017 (no auth)

## Scale
- 221 collections · 115K docs · 1,179 API routes · 164 frontend routes · 13 crons · 14 integrations

## Golden collections
| Collection | Count | Use |
|---|---|---|
| `products_master` | 9,497 | Canonical products (Shopify-synced) |
| `services_master` | 1,026 | Canonical services |
| `breed_products` | 4,941 | Breed-specific merch |
| `unified_products` | 7,079 | Cross-pillar view |
| `pets` | ~47 | Member pets (key model) |
| `mira_product_scores` | 17,178 | Per-pet recommendation scores |
| `orders` | 33 · `payments` 6 | Financial (HANDLE WITH CARE) |
| `sitevault_runs` | 5 | Backup audit trail (BUG: 4/5 missing status) |

## Integrations & keys
All routed through Emergent where possible:
- **LLMs**: gpt-image-1, Claude Sonnet 4.5, Gemini Nano Banana → `EMERGENT_LLM_KEY`
- **Cloudinary, Gupshup (WhatsApp), Resend (email), Razorpay, Zoho Desk, Google Drive (SiteVault), Google Places/Vision/Calendar, Amadeus, Viator, Eventbrite, Foursquare, OpenWeather, YouTube**

## Critical rules (Soul Bible §1 + session rules)
- **Soul Score**: Backend-only. NEVER trust client-sent scores. `pet_score_logic.calculate_pet_soul_score()` is sole truth.
- **Save-answers endpoint** at `/api/pet-soul/save-answers` merges (never overwrites) `doggy_soul_answers`. Pass sparse soul_answers safely.
- **Custom breeds**: A pet with `custom_breed: true` (or breed not in `BREED_PROFILES`) triggers soul-based fallback for products via `/api/breed-catalogue/products?pet_id=X&custom_breed=true`.
- **Favourite treats**: Stored at `pet.doggy_soul_answers.favorite_treats` (canonical). Surfaced everywhere via `<FavouritePicksRow>` + `/api/breed-catalogue/favourites`.
- **Cloudinary docs**: PDF = `resource_type="raw"`, image = `image`. `POST /api/upload/document`.

## Top 5 known bugs / gaps (priority order)
1. 🔴 `sitevault_runs` missing `status` on crash (4/5 orphans)
2. 🔴 `auto_re_export_and_atlas_sync` wipes Atlas with `delete_many({})` before insert — risky if local DB momentarily empty
3. 🟡 `team_members` + `featured_dogs` unconditional `delete_many({})` in seeder — should be upsert
4. 🟡 Bug #7/#8/#11/#14 from QA report — not started
5. 🟡 No `architecture_auditor.py` auto-refresher (this doc is manual today)

## What's SAFE
- Pet data persists across deploys (NVMe verified)
- SiteVault uploads to Google Drive (TDC folder + IAmBecause folder both healthy)
- No DELETE endpoint exists on financial collections (orders, payments, refunds)

## Current session's shipped work (Apr 23, 2026)
1. Soul Fallback bundle (Fix 1+2+3) — `custom_breed` flag + soul-based product matching + breed-mirror to soul answers
2. MiraImaginesBreed soul hydration (Path B) — traits synthesised from soul for custom breeds
3. Watercolour useEffect + on-demand generation for custom breeds
4. Bug #12 — dead dashboard links fixed
5. Favourite-treat preference surfacing — backend endpoint + `FavouritePicksRow` on Dine/Celebrate/Shop/Mira Search
6. Preference-editor chip (inline "✎ Add favourite")

## Do FIRST before any destructive change
1. Read `/app/memory/PRD.md` for full session history
2. Read `/app/memory/DOGGYCOMPANY_COMPLETE_ARCHITECTURE.md` for system depth
3. Check `/app/memory/test_credentials.md` for login details
4. Curl `/api/health` to confirm preview is up

## DON'T
- Deploy to production without explicit Aditya approval
- Add DELETE endpoints without soft-delete + audit pattern
- Touch production data directly (preview only)
- Assume unfamiliar APIs — verify via curl or ask
