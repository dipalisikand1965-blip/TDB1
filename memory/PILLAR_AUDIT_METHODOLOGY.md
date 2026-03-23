# TDC Pillar Audit Methodology
# The Doggy Company — Pet Life OS
# Created: 27 March 2026 | Author: Celebrate + Dine Audit Agent
# 
# This is the EXACT process used to audit Celebrate (11/11 backend, 100% frontend)
# and Dine (7/7 concierge flows, mobile clean). Follow this STEP BY STEP for every
# remaining pillar. Do NOT skip steps. Do NOT improvise.

---

## PILLARS REMAINING (in order)
1. Care
2. Go  
3. Play
4. Learn
5. Adopt
6. Farewell
7. Emergency
8. Paperwork

## PILLARS COMPLETE (DO NOT TOUCH)
- Celebrate — signed off 27 March 2026
- Dine — signed off 27 March 2026

---

## PHASE 1: COMPONENT MAP (30 min)
**Goal**: Know every component on the page before touching anything.

### Step 1.1 — Find all files
```bash
# Replace PILLAR with: care, go, play, learn, adopt, farewell, emergency, paperwork
echo "=== ALL FILES ==="
find /app/frontend/src -name "*[Pp]illar*" -name "*.jsx" | grep -v node_modules | sort
find /app/frontend/src/components/PILLAR -name "*.jsx" | sort
find /app/frontend/src/pages -name "*PILLAR*" -name "*.jsx" | sort
```

### Step 1.2 — Map the page spine
Open the main page file (e.g. `CareSoulPage.jsx`) and list every component rendered in order:
```bash
grep -n "import.*from\|<[A-Z]" /app/frontend/src/pages/PILLARSoulPage.jsx | head -40
```

### Step 1.3 — Find all modals/drawers
```bash
grep -rn "Modal\|Drawer\|import.*from.*PILLAR" /app/frontend/src/pages/PILLARSoulPage.jsx | head -20
```

### Step 1.4 — Document the map
Create a table like this for the user:

| # | Section | Component | File | Personalized | Concierge | Mobile |
|---|---------|-----------|------|-------------|-----------|--------|

---

## PHASE 2: BUG HUNT (20 min)
**Goal**: Find visual bugs BEFORE the user does.

### Step 2.1 — Screenshot the page (desktop 1920px)
Login as `dipali@clubconcierge.in` / `test123`, navigate to the pillar page.
Take full-page screenshot. Scroll through every section.

### Step 2.2 — Check for common TDC bugs
These bugs appeared on Celebrate and Dine — check for them on EVERY pillar:

```bash
# "Mojo's none" bug — health_condition rendering as "none"
grep -rn "health_condition\|healthCondition\|\.condition" /app/frontend/src/components/PILLAR/*.jsx /app/frontend/src/pages/PILLARSoulPage.jsx | head -15

# Duplicate tabs (like Find Dine / Dine Out)
grep -n "tab\|Tab\|activeTab" /app/frontend/src/pages/PILLARSoulPage.jsx | head -15

# Missing null guards on pet data
grep -n "pet\.\|petName\|pet_name" /app/frontend/src/components/PILLAR/*.jsx | grep -v "||" | head -20
```

### Step 2.3 — Check soul chip data
The hero should show correct allergy (chicken), loves (salmon), personality. If it shows "test_fish_185" or "none" — fix the data or the rendering.

---

## PHASE 3: CONCIERGE WIRING AUDIT (30 min)
**Goal**: Every user action creates a service desk ticket.

### Step 3.1 — Check current wiring
```bash
echo "=== CONCIERGE WIRING CHECK ==="
for f in $(find /app/frontend/src/components/PILLAR -name "*.jsx" | grep -v node_modules); do
  hits=$(grep -c "attach_or_create\|useConcierge\|tdc\.\|sendToAdminInbox\|bookViaConcierge" "$f" 2>/dev/null)
  echo "$hits matches: $f"
done
```

### Step 3.2 — Wire gaps using useConcierge hook
For EVERY component with 0 matches that has user interactions (onClick, button, CTA):

```javascript
// Import at top:
import { useConcierge } from '../../hooks/useConcierge';

// Inside component:
const { book, request, view } = useConcierge({ pet, pillar: 'PILLAR_NAME' });

// On CTA/button click — BEFORE any modal opens:
book({
  service: `${pet?.name}'s [Action Description]`,
  channel: 'PILLAR_component_name',
  urgency: 'normal'  // or 'high' for concierge CTAs
});
```

### Step 3.3 — Available useConcierge methods
| Method | Use When |
|--------|----------|
| `book` | CTA buttons, service bookings, concierge requests |
| `request` | General interest, dimension cards, path starts |
| `view` | Product views, detail opens |
| `nearme` | NearMe venue selections |
| `urgent` | Emergency actions |
| `farewell` | Farewell pillar only |
| `order` | Order confirmations |
| `fire` | Generic tracking |

### Step 3.4 — Verify ALL flows create tickets
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"dipali@clubconcierge.in","password":"test123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")
MOJO_ID="pet-mojo-7327ad56"

# Test each flow:
curl -s -X POST "$API_URL/api/service_desk/attach_or_create_ticket" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"parent_id\":\"dipali@clubconcierge.in\",\"pet_id\":\"$MOJO_ID\",\"pillar\":\"PILLAR\",\"intent_primary\":\"FLOW_NAME\",\"channel\":\"PILLAR_CHANNEL\",\"force_new\":true,\"initial_message\":{\"sender\":\"parent\",\"source\":\"COMPONENT\",\"text\":\"DESCRIPTION\"}}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{d.get(\"ticket_id\",\"FAIL\")} | new={d.get(\"is_new\")}')"
```

### Step 3.5 — Verify pet_breed appears in ticket
```bash
curl -s "$API_URL/api/service_desk/ticket/TDB-2026-XXXX" -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'pet_breed={d.get(\"pet_breed\",\"MISSING\")}')"
```

---

## PHASE 4: SOUL MADE STRIP CHECK (5 min)
**Goal**: Premium dark purple strip shows in ALL categories.

The strip was already applied to all 10 pillars (Celebrate×2, Dine, Go, Play, Care content modals + Adopt, Farewell, Emergency, Learn, Paperwork soul pages). Verify it renders:

```bash
# Check strip exists
grep -n "soul-made-cross-sell\|soul-made-trigger\|SOUL MADE" /app/frontend/src/components/PILLAR/PILLARContentModal.jsx | head -5
```

If the strip only shows in `soul_made` category (not cross-sell in ALL categories), add the cross-sell block BEFORE the footer — same pattern as CelebrateContentModal line ~1888.

---

## PHASE 5: MOBILE AUDIT AT 375px (20 min)
**Goal**: No overflow, fonts ≥13px, tap targets ≥44px.

### Step 5.1 — Screenshot every section at 375×812
```python
await page.set_viewport_size({"width": 375, "height": 812})
```

### Step 5.2 — Check for issues
For each section report:

| Section | Fonts OK (≥13px) | Tap OK (≥44px) | No overflow | Notes |
|---------|-----------------|----------------|-------------|-------|

### Step 5.3 — Common mobile fixes
```bash
# Find small fonts
grep -rn "fontSize.*1[0-2]px\|text-xs\|fontSize.*[0-9]px" /app/frontend/src/components/PILLAR/*.jsx | head -10

# Find small touch targets  
grep -rn "height.*[0-3][0-9]px\|padding.*[0-6]px" /app/frontend/src/components/PILLAR/*.jsx | head -10
```

### Step 5.4 — Standard fixes
- `text-xs` → `text-[13px]` or `text-sm`
- `fontSize: 11` → `fontSize: 13`
- `height: 32px` → `minHeight: 44px`
- `padding: 6px` → `padding: 10px 16px`

---

## PHASE 6: MIRA CHAT CHECK (5 min)
**Goal**: Mira knows the pet on this pillar page.

Already fixed globally:
- `mira_routes.py` line ~18710: `pet_id = body.get("pet_id") or body.get("selected_pet_id")`
- `MiraChatWidget.jsx`: sends `selected_pet_id: selectedPet?.id || null`
- `MiraAI.jsx`: sends `selected_pet_id: userPets?.[0]?.id || userPets?.[0]?.name || null`

Just verify with:
```bash
curl -s -X POST "$API_URL/api/mira/os/stream" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"What do you know about Mojo?","selected_pet_id":"pet-mojo-7327ad56","session_id":"test","source":"chat_widget","current_pillar":"PILLAR","history":[]}' | head -200
```

Expected: Mira says "Mojo", "Indie", "chicken allergy", "peanut butter", "100% soul score"

---

## PHASE 7: DOCUMENT & LOCK DOWN (15 min)
**Goal**: Future agents cannot break what we fixed.

### Step 7.1 — Update PRD.md
Add to the DO NOT TOUCH section:
```markdown
> **DO NOT TOUCH THE [PILLAR] PILLAR.** It has been fully audited, tested (X/X concierge flows, mobile 375px clean), and signed off. See "Final Audit: [Pillar]" section in `/app/complete-documentation.html`. Any changes to [pillar] components require explicit user approval.
```

### Step 7.2 — Add to complete-documentation.html
Add a full `FINAL AUDIT: [PILLAR] PILLAR` section with:
1. Green "STATUS: COMPLETE — DO NOT TOUCH" banner
2. Page sections table (all sections, fonts, tap, overflow, concierge)
3. Concierge flows table (all flows with ticket IDs)
4. Bugs fixed table
5. Concierge wiring table (all components, methods, channels)
6. Files modified list
7. Red "FUTURE AGENTS: DO NOT MODIFY" warning at bottom

### Step 7.3 — Add to PRD.md completed section
List every fix with `[x]` checkmark under the pillar heading.

---

## PHASE 8: REPORT TO USER (5 min)
**Goal**: User gets a clear pass/fail report.

Format:
```
## [PILLAR] Pillar — COMPLETE & LOCKED DOWN

### Bugs Fixed: X
### Concierge Gaps Wired: X  
### Concierge Flows Verified: X/X (all create tickets with pet_breed=Indie)
### Mobile 375px: All sections clean
### Soul Made Strip: Premium purple in all categories
### Mira: Knows Mojo

### Files Modified:
- list each file + what changed
```

---

## CRITICAL RULES

1. **Login credentials**: `dipali@clubconcierge.in` / `test123` (user), `aditya` / `lola4304` (admin Basic Auth)
2. **Mojo's pet ID**: `pet-mojo-7327ad56`
3. **Mojo's breed**: Indie
4. **Mojo's allergies**: Chicken (severe), Beef (moderate) — from vault
5. **Mojo's food_allergies**: chicken (from doggy_soul_answers)
6. **Mojo's favourite_treat**: peanut_butter
7. **Mojo's soul score**: 100%
8. **NEVER show "none"** — always guard with: `if (value && value.toLowerCase() !== 'none' && value.trim() !== '')`
9. **ALWAYS lint** after every file change: `mcp_lint_javascript`
10. **ALWAYS verify** concierge flows create real tickets via API
11. **NEVER modify** Celebrate or Dine components without explicit user approval
12. **Soul Made strip** uses `useConcierge` from the `SoulMadeModal` component — no extra wiring needed
13. **pet_breed is now auto-included** in all new tickets (fixed in `mira_service_desk.py`)
14. **Mira knows pets globally** (fixed in `mira_routes.py` + `MiraAI.jsx` + `MiraChatWidget.jsx`)
15. **Announcement bar** is live: "India's first Pet Life OS · Built in memory of Mystique · Now in early access"

---

## TIME ESTIMATE PER PILLAR
- Phase 1 (Component Map): 30 min
- Phase 2 (Bug Hunt): 20 min
- Phase 3 (Concierge Wiring): 30 min
- Phase 4 (Soul Made Check): 5 min
- Phase 5 (Mobile Audit): 20 min
- Phase 6 (Mira Check): 5 min
- Phase 7 (Document & Lock): 15 min
- Phase 8 (Report): 5 min
- **Total: ~2 hours per pillar**
- **8 pillars remaining: ~16 hours (2 days)**

---

## DEFINITION OF DONE (per pillar)
- [ ] Component map documented
- [ ] All visual bugs found and fixed
- [ ] All concierge gaps wired with useConcierge
- [ ] All concierge flows verified with real ticket creation (ticket IDs recorded)
- [ ] Soul Made premium strip visible in all categories
- [ ] Mobile 375px: no overflow, fonts ≥13px, tap targets ≥44px
- [ ] Mira knows Mojo on this pillar
- [ ] PRD.md updated with DO NOT TOUCH warning
- [ ] complete-documentation.html updated with full audit section
- [ ] User confirmed "DONE" for this pillar
