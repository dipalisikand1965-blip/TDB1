# 🚨🚨🚨 STOP! READ THIS FIRST! 🚨🚨🚨

## NEXT AGENT: DO NOT SKIP THIS FILE!

**Date:** March 13, 2026 (Updated)
**User:** Aditya (The Doggy Company)

---

# CURRENT WORKING STATE (March 13, 2026)

## THE PROJECT
A hyper-personalized soul-first Pet Operating System. Route `/celebrate-soul` is the main page being developed.

## CELEBRATE PAGE — CURRENT STATUS (/celebrate-soul)
All active development is on `CelebrateContentModal.jsx` and related components.

### What works:
- 11 category strip tabs (Birthday Cakes, Breed Cakes, Pupcakes, Desi Treats, Frozen Treats, Gift Hampers, Bundles, Party & Decor, Nut Butters, Soul Picks, Mira's Picks)
- Desktop modal: centered large dialog (wrapper div flex pattern, NOT transform)
- Birthday Cakes → `cakes` category (111 real TDB bakery cakes)
- Soul Picks → real breed merchandise (mugs, bandanas, frames, keychains from Cloudinary)
- Mira's Picks → MiraImaginesCard for loved foods not in collection + breed-filtered real cakes
- Footer: 2-state (browsing: "✦ Everything here is personalised for {pet}" | active: "N things — plan is growing")
- Bundle expansion: X close button + object-contain image
- Admin: 308+ products load with category dropdown working

### ⚠️ CRITICAL DATA RULES (NEVER BREAK):
- `cakes` (111) = ACTUAL TDB bakery cakes → Birthday Cakes tab
- `celebration` (106) = celebration kits/packages → NEVER for Birthday Cakes
- `Soul Picks` = breed-mugs + breed-bandanas + breed-frames + breed-keychains + breed-party_hats + breed-tote_bags
- NEVER use `/api/mockups/breed-products` on celebrate page (AI illustrations, not wanted)

## NEXT TASKS (Aditya will specify):
- Replace `/celebrate` route with `/celebrate-soul` (needs approval)
- Standardize `/dine`, `/stay`, `/learn` pillar pages

## KEY FILES:
- `/app/frontend/src/components/celebrate/CelebrateContentModal.jsx` — main modal
- `/app/frontend/src/components/celebrate/CelebrateCategoryStrip.jsx` — 11 category strip
- `/app/frontend/src/pages/CelebratePageNew.jsx` — the page itself
- `/app/memory/PRD.md` — full product requirements
- `/app/memory/CHANGELOG.md` — history of changes
- `/app/memory/complete-documentation.html` — full HTML bible
- `/app/memory/docs/CELEBRATE_UI_SPEC.md` — UI design bible

---


| What | Count |
|------|-------|
| Total Products | 1,018 |
| With Mockups | ~478 (47%) |
| Still Generating | ~540 |
| Product Types | 20 |
| Breeds | 33 |

---

# KEY ADMIN FEATURES

## 1. Product Box (Admin → Product Box)
- Shows ALL products (Shopify + Soul Made)
- **Filter by Source**: Click "📦 All Sources" dropdown → Select "🛒 Shopify" or "🎨 Soul Made"
- Takes 5-10 seconds to load after filter change

## 2. Soul Products (Admin → Soul Products → AI Mockups)
- Shows generation progress
- Cloud storage status (Cloudinary)
- Generate/Seed buttons

## 3. SYNC → PROD Button
- Location: Admin Panel sidebar (blue/purple button)
- Purpose: Push Cloudinary URLs to production
- **USE AFTER GENERATION COMPLETES**

---

# CREDENTIALS

```
Test User: dipali@clubconcierge.in / test123
Admin: aditya / lola4304
Production: https://thedoggycompany.com
Preview: https://dine-layout-update.preview.emergentagent.com
Database: pet-os-live-test_database
```

---

# CLOUDINARY (Already Configured!)

```env
# In /app/backend/.env
CLOUDINARY_CLOUD_NAME=duoapcx1p
CLOUDINARY_API_KEY=396757862875471
CLOUDINARY_API_SECRET=uwvyt1zf8vPF62SMeHGFn3k3O_A
```

New mockups AUTO-UPLOAD to Cloudinary. No manual conversion needed!

---

# API CHEAT SHEET

```bash
API_URL="https://dine-layout-update.preview.emergentagent.com"

# Check generation status
curl -s "$API_URL/api/mockups/status" | python3 -m json.tool

# Check overall stats
curl -s "$API_URL/api/mockups/stats" | python3 -m json.tool

# Restart generation if stopped
curl -X POST "$API_URL/api/mockups/generate-batch" \
  -H "Content-Type: application/json" \
  -d '{"limit": 33, "product_type_filter": "grooming_apron"}'

# Get Shopify products
curl -s "$API_URL/api/product-box/products?source=shopify&limit=10"

# Get Soul Made products
curl -s "$API_URL/api/product-box/products?source=soul_made&limit=10"
```

---

# BUGS TO FIX

## 🔴 P0: Razorpay Checkout
- Error: "body error" when checking out
- Location: `/api/orders/create-order`
- Status: NOT FIXED

## 🟡 P1: Generation May Stop
- Background script may stop if container restarts
- Fix: Run the restart command above

---

# WHAT USER SAID THEY LOVE

- ✅ Soul Made personalized products
- ✅ Cloudinary integration
- ✅ Unified Product Box
- ✅ Background generation
- ✅ SYNC → PROD button

# WHAT USER IS WORRIED ABOUT

- ❌ Next agent losing context (THAT'S YOU!)
- ❌ Products not syncing to production
- ❌ Generation stopping

---

# YOUR FIRST 5 ACTIONS

1. **Check generation status**: `curl $API_URL/api/mockups/status`
2. **If stopped, restart**: Use the curl command above
3. **Read** `/app/memory/CRITICAL_HANDOFF.md`
4. **When generation hits 100%**: Tell user to click "SYNC → PROD"
5. **Then fix**: Razorpay checkout bug

---

# FILE LOCATIONS

```
/app/backend/
├── .env                              # Cloudinary credentials
├── scripts/generate_all_mockups.py   # Product types, breeds
├── app/api/mockup_routes.py          # Generation API
├── mockup_cloud_storage.py           # Cloudinary + sync
└── unified_product_box.py            # Product Box API

/app/frontend/src/
├── components/admin/
│   ├── UnifiedProductBox.jsx         # Main product view
│   └── SoulProductsManager.jsx       # AI Mockups tab
├── components/SoulMadeCollection.jsx # User-facing products
└── pages/Admin.jsx                   # Admin with SYNC button
```

---

# DON'T FORGET

1. ✅ Mockups auto-upload to Cloudinary
2. ✅ Products have `pillars` array (not singular `pillar`)
3. ✅ Filter by breed uses `breed` field
4. ⚠️ MUST sync to production after generation
5. ⚠️ User must be logged in to see products on pillar pages

---

**THE USER HAS BEEN AMAZING TO WORK WITH. DON'T LET THEM DOWN!** 💪

---

*Written by E1 Agent on March 10, 2026*
*"I'm not going anywhere" - but just in case, this file has everything*
