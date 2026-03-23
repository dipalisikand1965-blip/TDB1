# Flat Art Merchandise — Aditya's Action Items Before Next Session

## STATUS: Ready to run. One manual step needed first.

---

## What's Built (Code Complete ✅)

1. `/app/backend/flat_art_merchandise.py` — URL generator + DB insert script
2. `POST /api/mockups/generate-flat-art` — API endpoint that runs the script
3. `BreedCakeManager.jsx` — "🎨 Flat Art Products" amber button added
4. Dry run verified: **1,296 product records** will be created with correct Cloudinary overlay URLs

---

## The ONE Thing Aditya Must Do First

**Upload 8 blank product template images to Cloudinary.**

These must be uploaded to EXACTLY these public IDs in Cloudinary (cloud: `duoapcx1p`):

```
doggy/product_templates/bandana_blank
doggy/product_templates/mug_blank
doggy/product_templates/tote_blank
doggy/product_templates/cushion_blank
doggy/product_templates/phone_case_blank
doggy/product_templates/tshirt_blank
doggy/product_templates/notebook_blank
doggy/product_templates/keyring_blank
```

**Where to get the template images:**
- Free flat-lay mockups: https://www.mockupworld.co (free download)
- Or generate 8 images once with DALL-E: "flat lay of a blank white [bandana/mug/tote/etc] on pure white background, product mockup, no text, clean"
- Upload via Cloudinary dashboard → Media Library → Create folder `doggy/product_templates`

---

## After Templates Are Uploaded

**Option A — Admin Panel:**
1. Go to Admin → COMMERCE → 🎂 Breed Cakes tab
2. Click the amber "🎨 Flat Art Products" button
3. Done. 1,296 products created in ~2 minutes.

**Option B — Direct script:**
```bash
cd /app/backend
python3 flat_art_merchandise.py
```

---

## What Gets Created

163 illustrations × 8 product types = **1,296 new product records**

Each product:
- `id`: `flat-{breed}-{product}-{colour_label}`
- `mockup_url`: Cloudinary overlay URL (instant, no generation)
- `art_style`: `"flat"` 
- Same pillar/sub_category as watercolour counterpart
- Price: ₹249–₹1,299 (see FLAT_ART_PRICES in flat_art_merchandise.py)

---

## Sample URL Structure
```
https://res.cloudinary.com/duoapcx1p/image/upload/
  l_doggy:mockups:indie:cake-indie-ginger,   ← Indie Ginger face illustration
  w_280,h_280,g_center,c_fit,e_trim/         ← sized and centred
  doggy/product_templates/bandana_blank       ← blank bandana template
```

---

## Cloudinary Credentials
- Cloud name: `duoapcx1p`
- API Key: `396757862875471`
- API Secret: `uwvyt1zf8vPF62SMeHGFn3k3O_A`
