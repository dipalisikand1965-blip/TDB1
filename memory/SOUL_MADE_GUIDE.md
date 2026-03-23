# Soul Made™ — Exact Handover Steps for Remaining Pillars
_Created: 2026-03-23 — For next agent to execute without errors_

## STATUS: What's Done vs What Needs Checking

### DONE — Soul Made™ pill added to CategoryStrip + ContentModal:
- ✅ Care (CareCategoryStrip + CareContentModal)
- ✅ Celebrate (CelebrateCategoryStrip + CelebrateContentModal)
- ✅ Dine (DineCategoryStrip + DineContentModal)
- ✅ Go (GoCategoryStrip + GoContentModal)
- ✅ Play (PlayCategoryStrip + PlayContentModal)

### NEEDS VERIFICATION — These were wired but may need testing:
- Dine: Footer CTA button should open SoulMadeModal when `category === 'soul_made'` (was fixed)
- Go: Soul Made trigger rendered before closing `</motion.div>`
- Play: Footer CTA + trigger both added
- Celebrate: Rendering section added + exclusion list updated

### PAGES WITHOUT CATEGORY STRIPS (use PersonalisedBreedSection):
- Learn, Shop, Paperwork, Adopt, Farewell, Services — all have `<PersonalisedBreedSection>` rendered on the page which includes a Soul Made trigger at the bottom of breed products

### EXCLUDED:
- Emergency — NO Soul Made
- Advisory — NO Soul Made

---

## EXACT PATTERN TO ADD SOUL MADE TO A NEW PILLAR

### IF the pillar HAS a CategoryStrip + ContentModal:

#### Step 1: Add pill to CategoryStrip

**Find**: The `CATEGORIES` or equivalent array (usually at the top of the file)
**Add** as the LAST item:

```jsx
{
  id: 'soul_made',
  name: 'Soul Made™',    // some strips use 'name', some use 'label'
  icon: '✦',
  iconBg: 'linear-gradient(135deg, #E8F5E9, #81C784)',  // adjust gradient to match pillar theme
},
```

> **NOTE**: Some strips use `name` (Care, Dine, Celebrate), others use `label` (Go, Play). Match existing pattern in the file.

#### Step 2: Add to ContentModal — Imports

**Find**: `import ProductCard from '../ProductCard';` (or `SharedProductCard`)
**Add below**:
```jsx
import SoulMadeModal from '../SoulMadeModal';
```

#### Step 3: Add to ContentModal — State

**Find**: The component's useState declarations
**Add**:
```jsx
const [soulMadeOpen, setSoulMadeOpen] = useState(false);
```

#### Step 4: Add to ContentModal — Category Config

**Find**: The `CAT_CONFIG` or category configuration object
**Add entry**:
```jsx
soul_made: { emoji: '✦', label: 'Soul Made™', /* match existing config shape */ },
```

If there's a `MIRA_QUOTES` object, add:
```jsx
soul_made: (n) => `Want something truly one-of-a-kind for ${n}? Upload a photo — Concierge® creates it.`,
```

If there's a `CTA_LABELS` object, add:
```jsx
soul_made: (n) => `Make it personal for ${n} →`,
```

#### Step 5: Add to ContentModal — Fetch Logic

**Find**: The `fetchData` or `useEffect` that fetches products based on category
**Add BEFORE other category-specific fetches** (before `if (category === 'soul')` or similar):

```jsx
// ── Soul Made™: breed-specific products from mockup API ──────
if (category === 'soul_made') {
  const breedParam = encodeURIComponent((pet?.breed || '').trim().toLowerCase());
  const r = await fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedParam}&pillar=PILLAR_NAME`);
  const data = r.ok ? await r.json() : { products: [] };
  const breedProducts = data.products || [];
  const subCats = [...new Set(breedProducts.map(p => p.sub_category || p.product_type).filter(Boolean))];
  setTabs(subCats.length > 1 ? ['All', ...subCats] : ['All']);
  setProducts(breedProducts);
  setLoading(false);
  return;
}
```

> **CRITICAL**: Replace `PILLAR_NAME` with: care, dine, go, play, celebrate, learn, shop, paperwork, adopt, farewell, services

#### Step 6: Add to ContentModal — Rendering Section

**Find**: The section that renders products (usually before `</motion.div>` or before the footer CTA)
**Add the Soul Made trigger**:

```jsx
{category === 'soul_made' && !loading && (
  <div data-testid="soul-made-trigger" onClick={() => setSoulMadeOpen(true)} style={{
    margin:'16px 20px 8px', padding:'14px 16px',
    background: 'PILLAR_COLOR_08',           // e.g., '#FF8C4208' or `${G.sage}08`
    border: '1px solid PILLAR_COLOR_20',     // e.g., '#FF8C4220' or `${G.sage}20`
    borderRadius:14, display:'flex', alignItems:'center',
    justifyContent:'space-between', cursor:'pointer',
  }}>
    <div>
      <div style={{ fontSize:13, fontWeight:700, color:'PILLAR_COLOR', marginBottom:3 }}>
        ✦ Soul Made™ — Make it personal
      </div>
      <div style={{ fontSize:12, color:'#888', lineHeight:1.4 }}>
        Upload {petName}'s photo · Concierge® creates it · Price on WhatsApp
      </div>
    </div>
    <div style={{ fontSize:20, color:'PILLAR_COLOR_60', flexShrink:0, marginLeft:8 }}>›</div>
  </div>
)}
{soulMadeOpen && (
  <SoulMadeModal
    pet={pet}
    pillar="PILLAR_NAME"
    pillarColor="PILLAR_COLOR"
    pillarLabel="PILLAR_LABEL"
    onClose={() => setSoulMadeOpen(false)}
  />
)}
```

#### Step 7: Fix Footer CTA (if ContentModal has a footer button)

**Find**: The footer CTA `onClick` handler (usually `onClick={onClose}` or `onClick={() => { ... onClose(); }}`)
**Replace with**:
```jsx
onClick={() => {
  if (category === 'soul_made') { setSoulMadeOpen(true); }
  else { onClose(); }
}}
```

#### Step 8: Add to Exclusion List (if there's a generic product rendering section)

**Find**: A condition like `{category !== 'soul-picks' && category !== 'miras-picks' && (`
**Add**: `category !== 'soul_made' &&`

---

### IF the pillar does NOT have a CategoryStrip:

The pillar page should render `<PersonalisedBreedSection>` which already includes the Soul Made trigger. Just make sure:

1. **Import exists** in the page file:
```jsx
import PersonalisedBreedSection from "../components/common/PersonalisedBreedSection";
```

2. **Component is rendered** somewhere on the page:
```jsx
<PersonalisedBreedSection pet={petData} pillar="PILLAR_NAME" />
```

PersonalisedBreedSection handles everything internally — fetches breed products, shows grid, shows Soul Made trigger, opens SoulMadeModal. It works for ALL pillars and knows the color/label via internal `PILLAR_COLORS` and `PILLAR_LABELS` lookups.

---

## PILLAR COLOR REFERENCE

| Pillar | Color Variable | Hex | Label | Gradient for iconBg |
|--------|---------------|-----|-------|-------------------|
| care | G.sage | #40916C | Wellness | linear-gradient(135deg, #E8F5E9, #81C784) |
| celebrate | — | #A855F7 | Celebration | linear-gradient(135deg, #E8D5F5, #C44DFF) |
| dine | — | #FF8C42 | Food | linear-gradient(135deg, #FFF3E0, #FFE0B2) |
| go | G.teal | #3498DB | Travel | linear-gradient(135deg, #E0F7FA, #80DEEA) |
| play | G.orange | #E76F51 | Play | linear-gradient(135deg, #FFF3E0, #FFCCBC) |
| learn | G.violet | #7C3AED | Learning | linear-gradient(135deg, #F3E5F5, #CE93D8) |
| shop | G.gold | #F59E0B | Shopping | linear-gradient(135deg, #FFF8E1, #FFE082) |
| paperwork | G.teal | #0D9488 | Documents | linear-gradient(135deg, #E0F2F1, #80CBC4) |
| adopt | G.rose | #65A30D | Adoption | linear-gradient(135deg, #F1F8E9, #AED581) |
| farewell | G.indigo | #8B5CF6 | Farewell | linear-gradient(135deg, #EDE7F6, #B39DDB) |
| services | — | #0EA5E9 | Services | linear-gradient(135deg, #E0F7FA, #4DD0E1) |

---

## COMMON MISTAKES TO AVOID

1. **Don't put Soul Made on Emergency or Advisory pages** — explicitly excluded
2. **Farewell pillar** uses custom text: `"✦ In memory of {petName} — create something meaningful"` instead of `"✦ Soul Made™ — Make it personal"`
3. **SoulMadeModal positioning** — uses `alignItems:'center'` NOT `alignItems:'flex-end'` (was causing footer-stuck bug)
4. **PillarSoulProfile drawer** — same fix, uses `alignItems:'center'` with `borderRadius:20` (not `20px 20px 0 0`)
5. **CategoryStrip field names vary**: Care/Celebrate/Dine use `name`, Go/Play use `label` — match existing pattern
6. **Cloudinary upload preset** in SoulMadeModal must be `tdc_custom_orders`
7. **Don't add standalone triggers to page bodies** — triggers live INSIDE ContentModals or PersonalisedBreedSection only
8. **Breed products API** is `GET /api/mockups/breed-products?breed={breed}&pillar={pillar}` — breed must be lowercase, URL-encoded

---

## FILE LOCATIONS

```
/app/frontend/src/components/SoulMadeModal.jsx              — The 4-step modal
/app/frontend/src/components/common/PersonalisedBreedSection.jsx — Shared breed products + trigger
/app/frontend/src/components/care/CareCategoryStrip.jsx      — Example: pill added
/app/frontend/src/components/care/CareContentModal.jsx       — Example: full soul_made handling
/app/frontend/src/hooks/useConcierge.js                      — request() → service desk tickets
/app/memory/SOUL_MADE_GUIDE.md                               — This file
/app/memory/PRD.md                                           — Product requirements
```
