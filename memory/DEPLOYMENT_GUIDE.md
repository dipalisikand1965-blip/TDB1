# Deployment & Data Persistence Guide

> **CRITICAL FOR ALL AGENTS:** Read this before making any deployment-related changes.

---

## Quick Answer: What Persists After Deployment?

| Data Type | Persists? | Where Stored | Notes |
|-----------|-----------|--------------|-------|
| **Mockup Images** | ✅ YES | MongoDB `breed_products.mockup_url` | Base64 encoded, ~2.8MB each |
| **User Data** | ✅ YES | MongoDB `users`, `pets` | All user accounts, pet profiles |
| **Orders** | ✅ YES | MongoDB `orders` | Purchase history |
| **Products** | ✅ YES | MongoDB `products_master` | Synced from Shopify |
| **Soul Made Products** | ✅ YES | MongoDB `breed_products` | 33 breeds × 11 products = 363 items |
| **Code Changes** | ✅ YES | Git repository | Committed and pushed |
| **Running Processes** | ❌ NO | Server memory | Stops on restart |

---

## What Happens When...

### 1. Agent Loses Context / New Agent Starts
**Impact:** NONE on data or running processes

- ✅ Mockup generation **continues running** on the server
- ✅ All database data remains intact
- ✅ Code changes already made persist
- ⚠️ New agent should check `/api/mockups/status` for progress

**For New Agents:**
```bash
# Check mockup generation status
curl -s "$API_URL/api/mockups/status"

# Check overall stats
curl -s "$API_URL/api/mockups/stats"
```

### 2. Redeploy to Production (Same Database)
**Impact:** MINIMAL - Only running processes stop

- ✅ All MongoDB data persists (mockups, users, pets, orders)
- ✅ Code changes deploy automatically
- ❌ **Mockup generation STOPS** (server restarts)
- ⚠️ Need to resume generation after deployment

**After Redeployment:**
```bash
# Resume mockup generation if incomplete
curl -X POST "$API_URL/api/mockups/generate-batch" \
  -H "Content-Type: application/json" \
  -d '{"limit": 500}'
```

### 3. Fresh Deployment (New Database)
**Impact:** HIGH - Need to re-seed and regenerate

- ❌ All mockups lost (need to regenerate)
- ❌ All users lost (need to re-register)
- ❌ All orders lost
- ✅ Code deploys fresh
- ✅ MasterSync will auto-seed `breed_products` collection (products without mockups)

**After Fresh Deployment:**
1. MasterSync auto-runs on startup (seeds 363 Soul Made products)
2. Trigger mockup generation: Admin Panel → AI Mockups → Generate
3. Wait ~6-7 hours for all 363 mockups (or prioritize key breeds)

---

## Database Architecture

```
MongoDB (External - Persists Across Deployments)
├── users                 # User accounts
├── pets                  # Pet profiles with soul_data
├── orders                # Purchase history
├── products_master       # Shopify-synced products (TheDoggyBakery)
├── breed_products        # Soul Made products (363 items)
│   └── mockup_url        # Base64 encoded AI-generated images
├── unified_products      # Merged view for recommendations
├── mira_conversations    # Chat history with Mira
└── ...
```

---

## Mockup Generation Details

### How It Works
1. **Trigger:** Admin clicks "Generate" or API call to `/api/mockups/generate-batch`
2. **Process:** Server loops through `breed_products` where `mockup_url` is null
3. **Generation:** Calls GPT Image 1 via Emergent LLM Key (~15 seconds per image)
4. **Storage:** Base64 data URL saved directly to `mockup_url` field in MongoDB
5. **Persistence:** Once saved, mockup stays in database forever

### Time Estimates
| Breeds | Products | Time | Cost (approx) |
|--------|----------|------|---------------|
| 1 breed | 11 products | ~3 minutes | ~$0.50 |
| 5 breeds | 55 products | ~15 minutes | ~$2.50 |
| All 33 breeds | 363 products | ~2 hours | ~$16 |

### Current Breeds (33 total)
```
american_bully, beagle, border_collie, boxer, bulldog, cavalier,
chihuahua, chow_chow, cocker_spaniel, dachshund, dalmatian,
doberman, french_bulldog, german_shepherd, golden_retriever,
great_dane, husky, indie, irish_setter, italian_greyhound,
jack_russell, labrador, lhasa_apso, maltese, pomeranian,
poodle, pug, rottweiler, schnoodle, scottish_terrier,
shih_tzu, st_bernard, yorkshire
```

---

## MasterSync: Automatic Seeding on Startup

When the backend starts, `MasterSync` runs automatically:

```python
# server.py - runs on startup
async def master_sync():
    # 1. Sync Shopify products → products_master
    # 2. Seed breed_products (363 Soul Made items)
    # 3. Run AI semantic tagging
    # 4. Update unified_products view
```

**Important:** MasterSync seeds products WITHOUT mockups. Mockup generation is a separate, manual process.

---

## Checklist for Deployment

### Before Deployment
- [ ] Commit all code changes to Git
- [ ] Note current mockup generation progress
- [ ] If generation running, either wait for completion or plan to resume

### After Deployment (Same Database)
- [ ] Verify backend is running: `GET /api/health`
- [ ] Check mockup status: `GET /api/mockups/stats`
- [ ] Resume generation if needed: `POST /api/mockups/generate-batch`
- [ ] Verify frontend loads correctly

### After Fresh Deployment (New Database)
- [ ] Wait for MasterSync to complete (check logs)
- [ ] Create admin account
- [ ] Trigger full mockup generation (allow 6-7 hours)
- [ ] Or prioritize key breeds first (indie, shih_tzu, labrador)

---

## For Agents: Standard Operating Procedure

### At Session Start
1. Read `/app/memory/PILLAR_AUDIT.md` for feature status
2. Read `/app/memory/DEPLOYMENT_GUIDE.md` (this file) for data state
3. Check mockup status: `GET /api/mockups/status`
4. Check PRD for current priorities

### At Session End
1. Update PILLAR_AUDIT.md with completed work
2. Regenerate documentation:
   ```bash
   cd /app/backend && python3 -c "from documentation_generator import generate_complete_documentation; generate_complete_documentation()"
   ```
3. Note any running processes in handoff

### Handoff Notes Template
```
## Mockup Generation
- Status: [Running/Complete/Paused]
- Progress: X/363
- Priority breeds complete: [indie, shih_tzu, labrador]

## Database State
- Products seeded: ✅
- Mockups: X% complete
- Any migrations pending: [Yes/No]
```

---

*Last Updated: March 8, 2026*
