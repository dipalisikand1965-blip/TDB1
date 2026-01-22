# The Doggy Company® - Master Task List
## Pet Life Operating System

**Last Updated:** January 22, 2026

---

## 🔴 CRITICAL / BROKEN (Fix Immediately)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | **Voice Order Feature** | ✅ FIXED | Fixed file read issue - content now passed directly to transcribe |
| 2 | **Checkout Form Validation** | ✅ FIXED | Fixed async state bug - validation errors now returned synchronously |
| 3 | **Mira AI Timeout** | ⚠️ INTERMITTENT | Occasionally shows "brief pause" - may need retry logic or timeout increase |

---

## 🟠 HIGH PRIORITY (P1) - This Week

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4 | **Commerce Filtering by Pet Soul** | ✅ DONE | Added allergy filtering in ProductListing.jsx with visual banner |
| 5 | **Link Pet Parent Directory → Full Profile** | ✅ DONE | Created PetSoulJourneyPage.jsx, added route, wired buttons |
| 6 | **Connect About/Membership to CMS** | ⏭️ SKIPPED | Keeping hardcoded authentic content (Mira's story) - CMS for other pages |
| 7 | **Consolidate Duplicate Pages** | ✅ DONE | Deleted About.jsx & Membership.jsx, keeping *Page.jsx versions |
| 8 | **Re-enable ProtectedRoute.jsx** | 🔲 TODO | Do when about to go live |

---

## 🟡 MEDIUM PRIORITY (P2) - Next 2 Weeks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9 | **WhatsApp Soul Drip System** | 🔲 TODO | "Soul Whispers" - weekly questions via WhatsApp. Backend endpoint exists (`/api/soul-drip/drip-question`), needs cron job + WhatsApp integration |
| 10 | **Multi-Pet Household Special States** | 🔲 TODO | Logic for families with multiple pets (shared orders, family discounts, etc.) |
| 11 | **Behavioral Inference from Returns** | 🔲 TODO | Learn preferences from return patterns (e.g., returned chicken = allergy inference) |
| 12 | **Fix Backend Linting Errors** | 🔲 TODO | Run `ruff --fix` on `backend/server.py` |
| 13 | **Product Title Sync Fix** | ⚠️ PARTIAL | API-level fix done, but Shopify sync script may still create "Untitled" products |

---

## 🔵 BACKLOG (P3) - Future

| # | Task | Status | Notes |
|---|------|--------|-------|
| 14 | **Full WhatsApp Business API Integration** | 🔲 TODO | Beyond Soul Drip - full messaging capability |
| 15 | **Member Management Dashboard** | 🔲 TODO | Comprehensive member analytics, cohort analysis |
| 16 | **Standardize All 12 Pillar Admin Managers** | 🔲 TODO | Uniform CRUD interface for each pillar |
| 17 | **Order History → Soul Enrichment** | ✅ DONE | Completed orders now enrich Pet Soul |
| 18 | **Mira → Soul Write-Back** | ✅ DONE | Conversations enrich Pet Soul via `save_soul_enrichment()` |

---

## ✅ RECENTLY COMPLETED (This Session)

| # | Task | Completed |
|---|------|-----------|
| ✅ | About Page - Mira's true story (Dipali's mother) | Jan 22, 2026 |
| ✅ | All registered trademarks (®) added | Jan 22, 2026 |
| ✅ | Membership → "Pet Life Pass" rebrand | Jan 22, 2026 |
| ✅ | Pricing update: ₹4,999/year, ₹499/month | Jan 22, 2026 |
| ✅ | Annual plan displayed FIRST | Jan 22, 2026 |
| ✅ | Data flow to Pet Soul verified | Jan 22, 2026 |
| ✅ | Admin Pet Parent Directory with Pet Soul view | Jan 22, 2026 |
| ✅ | Deployment URL fix (removed hardcoded preview URL) | Jan 22, 2026 |

---

## 🧹 CODE CLEANUP / TECH DEBT

| # | Task | Priority |
|---|------|----------|
| A | Remove duplicate page files | P2 |
| B | Extract Pet Soul % calculation to shared utility | P3 |
| C | Normalize database (some soul fields have pillar prefixes, some don't) | P3 |
| D | Clean up console.log statements | P3 |
| E | Add comprehensive error handling to all API endpoints | P3 |

---

## 📊 TESTING STATUS

| Area | Status | Notes |
|------|--------|-------|
| Products API | ✅ PASS | 500 products loading |
| Mira AI | ✅ PASS | Responding correctly |
| Auth/Login | ✅ PASS | Working |
| Pet Soul Data | ✅ PASS | Visible in admin |
| About Page | ✅ PASS | Team story with ® marks |
| Membership Page | ✅ PASS | Pet Life Pass branding |
| Voice Order | ❌ FAIL | Connection error |
| Checkout | ❌ FAIL | Validation error |

---

## 🔑 TEST CREDENTIALS

```
Admin: aditya / lola4304
Test User: dipali@clubconcierge.in / lola4304
Test Pets: Mojo (36% soul), Mystique (0%), Luna (61%)
```

---

## 📝 NOTES

- **Razorpay**: Using test keys (not production)
- **Shopify Sync**: May still have "Untitled" product issue at source
- **Meilisearch**: Not available (non-blocking warning)

---

*Which task would you like to tackle first?*
