# Breed Cake Illustration System — Complete Guide

## Overview
The Doggy Bakery Breed Cake feature lets customers order a personalised birthday cake with a flat Yappy-style portrait of their dog's exact breed and colour. All illustrations are AI-generated and stored in Cloudinary.

---

## Architecture

### User Flow
1. User visits `/celebrate`
2. Sees **"🎂 Breed Cake"** banner (dark purple card) → clicks → opens `DoggyBakeryCakeModal`
3. OR clicks **"Breed Cakes"** in the category strip → same modal
4. Modal shows:
   - Pet's breed first in the breed selector (e.g. "Mojo (Indie)")
   - Yappy-style flat face illustrations for that breed (auto-fetched from DB)
   - Flavours sorted by pet's soul profile favourites (with "[Name]'s fave" badge)
   - Allergic flavours automatically hidden
5. User picks illustration → base (Oats/Ragi) → flavour → message
6. Submits → direct `POST /api/service_desk/attach_or_create_ticket`

### Ticket Format (what baker sees)
```
Subject: 🎂 Breed Cake Order — Indie · Oats · Fish (Salmon) — for Mojo

FOR: Mojo (Indie)

ILLUSTRATION SELECTED:
  Name: Indie — Ginger
  Image URL: https://res.cloudinary.com/tdc/...

CAKE DETAILS:
  Base: Oats (Light & wholesome)
  Flavour: 🐟 Fish (Salmon)
  Price: ₹999
  Message on cake: "Happy Birthday Mojo! 🐾"

No known allergies

ACTION NEEDED:
  1. Download illustration from URL above
  2. Confirm price + delivery date via WhatsApp
  3. Collect payment before baking
```

---

## Pricing (scraped from thedoggybakery.com, March 2026)
| Flavour | Price |
|---|---|
| Banana, Carrot, Apple & Cinnamon | ₹950 |
| Peanut Butter, Cheese, Chicken, Fish (Salmon) | ₹999 |
| Lamb | ₹1,200 |

Base (Oats / Ragi) does not affect price.

---

## Illustration Generation

### Prompt Style
- **Yappy.com style** — head and face ONLY (cropped at neck, no body)
- Pure flat solid colours, NO outlines, NO gradients, NO shadows
- Pure white background
- Small black oval eyes with white highlight dot
- Black inverted-teardrop nose, pink tongue
- Breed-accurate ear shape
- Suitable for edible cake printing

### Breed Colour Variants (161 total across 50 breeds)
- **Indie**: 5 variants (Ginger, Black, Fawn, Brindle, Patchy)
- **Labrador**: 4 variants (Yellow, Black, Chocolate, Fox Red)
- **Husky**: 4 variants (Blue Eyes, Hetero Eyes, White, Agouti)
- Most breeds: 3–4 variants

### API Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/mockups/generate-breed-cakes` | Start full generation (all 50 breeds, 161 variants) |
| POST | `/api/mockups/stop-mockup-gen` | Stop after current item |
| GET | `/api/mockups/mockup-gen-status` | Poll generation progress |
| GET | `/api/mockups/breed-products?product_type=birthday_cake&breed=indie&limit=8` | Fetch illustrations for modal |
| POST | `/api/mockups/generate` | Regenerate a single variant |

### Cloudinary Auto-Upload
All generated images are automatically uploaded to Cloudinary via `mockup_cloud_storage.py`.
The modal fetches: `cloudinary_url → mockup_url → image_url` (in order).
Images appear in the user modal as soon as generation completes — no manual action needed.

---

## Admin Panel
**Admin → COMMERCE → 🎂 Breed Cakes**

Same capabilities as Soul Products Manager:
- **Gallery tab**: All generated illustrations grouped by breed, 6-col grid
  - Click card → edit panel opens inline (CloudinaryUploader + regenerate button)
  - Per-card: regenerate (AI), download, delete
- **Generation tab**: Start/stop full generation, per-breed progress bars, Cloudinary status

---

## Personalisation Logic (DoggyBakeryCakeModal)
- Pet's breed is ALWAYS first in breed selector, labelled with pet's name
- Favourite flavours detected from soul profile fields:
  - `favorite_protein`, `petFavouriteFood1`, `petFavouriteFood2`, `favorite_treats`, `taste_banana`
  - Mapped to flavour IDs via `FLAVOUR_KEYWORDS` dict
  - Shown FIRST with "{petName}'s fave" gold badge
- Allergic flavours removed from list:
  - `food_allergies` parsed; `test_` prefixed values ignored (test data)
  - Chicken hidden if pet is allergic to chicken/poultry
  - Fish hidden if pet is allergic to fish
- Default flavour = first safe favourite (not hardcoded 'banana')

---

## Files
| File | Purpose |
|---|---|
| `/app/frontend/src/components/celebrate/DoggyBakeryCakeModal.jsx` | User-facing order modal |
| `/app/frontend/src/components/admin/BreedCakeManager.jsx` | Admin gallery + generation |
| `/app/frontend/src/pages/CelebratePageNew.jsx` | Triggers (banner + strip intercept) |
| `/app/backend/app/api/mockup_routes.py` | Generation endpoints + prompts + BREED_COLOUR_VARIANTS |
| `/app/backend/mockup_cloud_storage.py` | Cloudinary upload logic |

---

## Status (as of March 2026)
- Generation running: 161 variants across 50 breeds
- Expected completion: ~90 minutes from start
- Cloudinary: ✅ Auto-upload enabled
- Admin tab: ✅ Live at Admin → 🎂 Breed Cakes
- User modal: ✅ Live at /celebrate (banner + Breed Cakes strip)
- Ticket routing: ✅ channel=doggy_bakery_order → Service Desk
