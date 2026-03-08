# 🚨 AGENT START HERE - READ THIS FIRST 🚨

> **Last Updated:** March 9, 2026 01:30 IST
> **By:** Session 5 Agent

---

## 🔴 CRITICAL - READ BEFORE DOING ANYTHING 🔴

### THE $1000 BUG THAT MUST NEVER HAPPEN AGAIN

A bug in `seed_all_breed_products` was using `$set` which **WIPED ALL MOCKUP IMAGES** on every deployment. This cost the user **$1000+** in regeneration fees.

**THE FIX:** Now uses `$setOnInsert` for `mockup_url` field.

**FILE:** `/app/backend/scripts/generate_all_mockups.py` (lines 257-310)

**NEVER CHANGE THIS PATTERN:**
```python
await db.breed_products.update_one(
    {"id": product_id},
    {
        "$set": updatable_fields,           # Updates name, price, etc.
        "$setOnInsert": insert_only_fields  # ONLY sets mockup_url if NEW
    },
    upsert=True
)
```

---

## SESSION 5 UPDATES (March 9, 2026)

### Fixes Applied:
1. **Product Card Images** - Shopify products now show REAL images, not AI mockups
2. **Breed Filtering** - Other breed products are EXCLUDED from recommendations
3. **Product Modal Title** - No longer cut off by close button
4. **Soul Made Add to Cart** - Default size (M) and color (White) pre-selected
5. **Dine Featured Restaurants** - Now shows properly with 2-column layout
6. **MASTER SYNC Enhanced** - Now syncs ALL data in Step 10

### New Endpoint:
```
POST /api/admin/force-full-sync?password=lola4304
```
This is called automatically by MASTER SYNC button.

---

## CURRENT STATUS ✅

### Soul Made Products - WORKING ON PRODUCTION!
- ✅ Indie (Mojo) - 11/11 mockups - LIVE on thedoggycompany.com
- ✅ Shih Tzu (Mystique) - 11/11 mockups - LIVE
- ✅ Labrador (Bruno) - 11/11 mockups - LIVE  
- ✅ Maltese (Lola) - 11/11 mockups - LIVE
- ✅ Golden Retriever (Luna/Buddy) - 11/11 mockups - LIVE

### Features Working:
- ✅ "Made for [Pet]" section on Celebrate page
- ✅ Beautiful watercolor breed illustrations
- ✅ "Personalize & Add" button on each product
- ✅ Mug color selection (White/Black, default White)
- ✅ Product modal with customization
- ✅ Personalized picks by breed
- ✅ Pet switching updates products correctly

---

## DO NOT BREAK - CRITICAL CODE

| # | What | File | Why |
|---|------|------|-----|
| 1 | **$setOnInsert for mockup_url** | `/app/backend/scripts/generate_all_mockups.py` | Prevents mockups from being wiped ($1000+ loss) |
| 2 | **BREED_EXCLUSION_PATTERN** | `/app/backend/server.py` (~line 7085) | Keeps Soul Made separate from Shopify |
| 3 | **BREED_EXCLUSION_PATTERN** | `/app/backend/app/api/top_picks_routes.py` | Filters Mira picks by pet's breed |
| 4 | **Key prop on SoulMadeCollection** | `/app/frontend/src/pages/CelebratePage.jsx` | Forces remount on pet switch |
| 5 | **Pet avatar check** | `/app/frontend/src/utils/petAvatar.js` | Checks `image` field for uploaded photos |
| 6 | **Pet Wrapped scoring** | `/app/backend/routes/wrapped/generate.py` | Uses calculate_pet_soul_score for consistency |

---

## TEST ACCOUNTS

| User | Password | Pets |
|------|----------|------|
| dipali@clubconcierge.in | test123 | Mojo (Indie), Mystique (Shih Tzu), Bruno (Labrador), Lola (Maltese), Luna (Golden Retriever), Buddy (Golden Retriever) |
| aditya (admin) | lola4304 | Admin access to AI Mockups, Products, etc. |

---

## KEY FILES MODIFIED (Session 4)

| What | File | Change |
|------|------|--------|
| **MOCKUP BUG FIX** | `/app/backend/scripts/generate_all_mockups.py` | $setOnInsert prevents mockup wipe |
| Add to Cart Button | `/app/frontend/src/components/SoulMadeCollection.jsx` | "Personalize & Add" button |
| Mug Color Default | `/app/frontend/src/components/SoulMadeProductModal.jsx` | White as default |
| Pet Switch Fix | `/app/frontend/src/components/PersonalizedPicks.jsx` | Key prop for remount |
| Pet Wrapped Score | `/app/backend/routes/wrapped/generate.py` | Uses weighted scoring |
| Conversation Count | `/app/backend/routes/wrapped/generate.py` | Counts from live_conversation_threads |

---

## QUICK COMMANDS

```bash
# Check mockup status
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -s "$API_URL/api/mockups/status"

# Check overall stats
curl -s "$API_URL/api/mockups/stats"

# Generate mockups for a breed
curl -X POST "$API_URL/api/mockups/generate-batch" -H "Content-Type: application/json" -d '{"breed_filter": "maltese", "limit": 11}'

# Test login
curl -s -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"dipali@clubconcierge.in","password":"test123"}'

# Restart services
sudo supervisorctl restart backend frontend
```

---

## KNOWN GAPS (Future Work)

### CELEBRATE Pillar
- ❌ Birthday reminder notifications (email/WhatsApp 7 days before)
- ❌ Birthday countdown widget on dashboard
- ❌ Plan My Party wizard with venue booking

### DINE Pillar  
- ❌ "Safe for Pet" badge on products (cross-reference allergies)
- ❌ Tummy Profile Dashboard (visual dietary needs)
- ❌ Allergy-based product filtering

### Disabled Features
- ❌ Cake Reveal Experience - Backend ready at `/api/cake-reveal/*`, frontend disabled (CSS issues)

---

## NEXT PRIORITIES

1. Generate remaining breed mockups (admin → AI Mockups → Generate)
2. DINE pillar - Safe for Pet badges
3. CELEBRATE pillar - Birthday reminders

---

## IMPORTANT NOTES

1. **Mockups are stored as base64** in MongoDB `breed_products.mockup_url` field
2. **They persist across deployments** (same database)
3. **The seed function preserves existing mockups** thanks to $setOnInsert fix
4. **Never use $set on mockup_url** - always $setOnInsert to preserve existing data

---

*When you complete work, UPDATE THIS FILE and /app/complete-documentation.html!*
*The user spent $1000+ on mockups. DO NOT BREAK THEM.*
