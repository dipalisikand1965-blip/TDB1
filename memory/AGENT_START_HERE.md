# 🚨 AGENT START HERE - READ THIS FIRST 🚨

> **Last Updated:** March 12, 2026 16:15 IST
> **Purpose:** Fast, current recovery guide for the next agent

---

## 🔴 MANDATORY READ ORDER

Before changing anything, read these in order:
1. `/app/memory/AGENT_START_HERE.md`
2. `/app/memory/PRD.md`
3. `/app/memory/NEXT_AGENT_CRITICAL.md`
4. `/app/memory/COMPLETE_SESSION_HANDOFF.md`
5. `/app/memory/PILLAR_AUDIT.md`

Then review the live-served documentation target:
- `/app/frontend/public/complete-documentation.html`

---

## 🔴 CRITICAL PROTECTIONS

### 1. THE $1000 MOCKUP BUG MUST NEVER RETURN

Do **not** break Soul Made mockup persistence.

**Safe pattern:**
```python
await db.breed_products.update_one(
    {"id": product_id},
    {
        "$set": updatable_fields,
        "$setOnInsert": insert_only_fields
    },
    upsert=True
)
```

**File:** `/app/backend/scripts/generate_all_mockups.py`

### 2. IMAGE STYLE GOLDEN RULES

- **Products** = realistic / product photography
- **Services** = watercolor illustrations
- **Bundles** = watercolor illustrated compositions
- Keep already-good saved images; replace only bad/default/generic ones

### 3. PILLAR GOLD STANDARD ORDER

Every pillar should follow this order:
1. Ask Mira Bar
2. Topic Cards
3. Daily Tip
4. Help Buckets
5. Personalized Section
6. Guided Paths
7. Bundles
8. Products
9. Mira Curated Layer
10. Services

Use `LearnPage.jsx` as the structural source of truth.

---

## ✅ CURRENT STATE (MARCH 12, 2026)

### Documentation
- `complete-documentation.html` is now generated from the **full** `/app/memory` corpus
- Current served scale is roughly **296 docs / 88k+ lines**

### Soul / Pet OS rollout completed on visible pillars
- Adopt
- Emergency
- Advisory
- Farewell
- Learn
- Shop

### Recent structural fixes
- **Fit**: personalized section moved before guided paths
- **Dine**: personalized picks moved earlier; nearby pet-friendly spots now render live cards instead of empty skeletons

### Admin media/upload fixes completed
- Product uploads persist to `products_master`
- Product/Service new drafts can upload before save
- Bundle upload endpoint exists
- Service Box now correctly reads `image_url || watercolor_image || image`

### Service illustration cleanup completed this session
Selective watercolor regeneration finished for:
- **Celebrate** services
- **Care** services with generic stock images
- **Fit** services with generic stock images

After normalization, these pillars are now strong in Service Box:
- Celebrate
- Care
- Fit
- Advisory
- Dine
- Emergency
- Enjoy
- Learn

---

## 🟡 WHAT STILL NEEDS WORK

### Pillar structure sweep still needed
Remaining pillars that still need stricter Gold Standard review:
- Stay
- Travel
- Celebrate (full structure sweep, not just images)
- Care
- Paperwork
- Enjoy

### Service image review still needed
Do **not** blindly overwrite these. Review first, preserve good generated art:
- Stay
- Travel
- Farewell
- Adopt
- Paperwork

### Bundle image recovery still needed
- Adopt bundles: missing images
- Farewell bundles: missing images
- Advisory bundles: old/default visuals

### Core bugs still open
- Sync-to-Production `db_name` failure
- Razorpay checkout issue
- Mobile member dashboard issues

---

## TEST ACCOUNTS

| Role | Login | Password |
|------|-------|----------|
| Member | `dipali@clubconcierge.in` | `test123` |
| Admin | `aditya` | `lola4304` |

---

## QUICK COMMANDS

```bash
# Preview URL
python3 - <<'PY'
from pathlib import Path
for line in Path('/app/frontend/.env').read_text().splitlines():
    if line.startswith('REACT_APP_BACKEND_URL='):
        print(line.split('=',1)[1])
        break
PY

# Regenerate complete documentation
cd /app/backend && python3 -c "from documentation_generator import generate_complete_documentation; print(generate_complete_documentation())"

# Test login
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -s -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"dipali@clubconcierge.in","password":"test123"}'
```

---

## NEXT AGENT PRIORITY ORDER

1. Preserve current documentation + PRD truth
2. Finish the Gold Standard order sweep on remaining pillars
3. Replace only bad/default service and bundle visuals
4. Then fix Sync-to-Production / Razorpay

---

## FINAL RULE

When you complete meaningful work:
- Update `/app/memory/PRD.md`
- Update this file if priorities changed
- Regenerate `/app/frontend/public/complete-documentation.html`

Do **not** leave stale handover notes behind.
