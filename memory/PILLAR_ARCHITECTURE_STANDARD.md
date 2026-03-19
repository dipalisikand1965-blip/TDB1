# 🐾 TDC Pillar Architecture Standard
## The Doggy Company — Pet Life OS
## Last Updated: Mar 19, 2026

> Every pillar is for Mystique, Mojo, Lola, Bruno — and every dog like them.
> This standard exists so every pillar feels like the same loving, intelligent, personalised system.

---

## MANDATORY CHECKLIST — Every New Pillar MUST Have

### 1. Hero (centered, Care-parity)
- [ ] Pet avatar (circular, 80px) with Soul %  / Document Completeness % badge below
- [ ] Eyebrow chip: "✦ {petName}'s {Pillar} profile is complete. Mira knows everything."
- [ ] H1: `clamp(1.875rem, 4vw, 2.5rem)` — Georgia serif — "{Pillar} for {petName}"
- [ ] Subtitle: 14px, rgba(255,255,255,0.72) — one line description
- [ ] Breed chips: SoulChip components (breed, age stage, energy/specialty)
- [ ] Mira quote card (max-width 480px, centered, dark glass bg)
- [ ] Scroll chevron (ChevronDown, 22px, rgba(255,255,255,0.35))
- [ ] Background: pillar-specific dark gradient (never purple/violet — already used by Learn)

### 2. Category Strip (Care-parity icon+label pills)
- [ ] White bar below hero, `border-bottom: 1px solid borderLight`
- [ ] Pills: `min-width: 82px`, `height: 72px`, flex-column, icon (34px in coloured bg) + label below
- [ ] Each pill opens a ContentModal (shows products + Mira quote for that category)
- [ ] `overflow-x: auto`, `scrollbar-width: none`
- [ ] Last pill = "Mira's Picks" (opens MiraPicksModal)

### 3. Tab Bar (3 tabs, below strip)
- [ ] Three tabs: `{Pillar} & Products | Book a Session | Find {Pillar}`
- [ ] `fontSize: 13px`, `padding: 14px`, underline active tab with pillar accent colour
- [ ] "Find" tab renders `{Pillar}NearMe` component (Google Places)

### 4. Soul/Document Profile Bar (collapsed → modal)
- [ ] Collapsed bar: 40px icon + "{petName}'s {Pillar} Profile" + breed chips + "Mira's picks →"
- [ ] Click → full modal, dark pillar-colour header (sticky), big % score, progress bar, ✕ close
- [ ] Header text: "GROW {PETNAME}'S {PILLAR} PROFILE"
- [ ] Modal body: breed tips (from BREED_{PILLAR}_TIPS or BREED_LEARN_TIPS fallback) + questions
- [ ] Questions: e.stopPropagation() + e.preventDefault() on chips AND save buttons
- [ ] Save: `POST /api/pet-soul/profile/{pet_id}/answer`

### 5. Dimension Cards (GuidedCarePaths-style)
- [ ] 3-column grid (1-col mobile, 2-col tablet, 3-col desktop)
- [ ] Each card: coloured top bar (6px), 52px icon in coloured bg, 16px serif bold title
- [ ] Description (2-line clamp), step bars, "Explore →" CTA
- [ ] When expanded: `gridColumn: 1 / -1` — full width
- [ ] DimExpanded: Mira bar + tabs (Products | Videos? | Personalised | Find | Book)

### 6. Mira Picks Section
- [ ] Shows 3 `MiraImaginesCard` when no AI scored picks (teaser, beautiful, never empty)
- [ ] When real AI scored picks exist → horizontal scroll of scored cards (score bar + image)
- [ ] `filterBreedProducts()` applied to ALL API picks responses
- [ ] `useEffect([pet?.id, pet?.breed])` — refetch on pet OR breed change
- [ ] `useMiraIntelligence(pet?.id, token)` — intelligence subtitle

### 7. MiraImaginesCard (shared component)
- [ ] Use `/app/frontend/src/components/common/MiraImaginesCard.jsx`
- [ ] Pass: `item={item}` `pet={pet}` `token={token}` `pillar="{pillarId}"`
- [ ] Fetches Cloudinary watercolour, silently triggers generation for new breed+pillar
- [ ] Consistent shape across ALL pillars

### 8. Breed Filter
- [ ] Import or inline `filterBreedProducts(products, petBreed)` function
- [ ] Apply to EVERY API response that could contain breed-specific products
- [ ] Rule: "American Bully {anything}" never shown to Indie. ALWAYS.

### 9. Mira Intelligence Subtitle
- [ ] Import `{ useMiraIntelligence, getMiraIntelligenceSubtitle }` from `../../hooks/useMiraIntelligence`
- [ ] Use in MiraPicksSection for dynamic subtitle

### 10. Concierge Booking Modal (Care/Learn pattern)
- [ ] Single-form modal (NOT 3-step wizard)
- [ ] "★ {petName}'s {Pillar} Concierge" eyebrow
- [ ] "What should {petName}'s {pillar} experience feel like?" H2
- [ ] Chip selector for service types + date picker + notes
- [ ] "✦ Send to {petName}'s Concierge" full-width CTA

### 11. ConciergeToast
- [ ] Register pillar colour in `/app/frontend/src/components/common/ConciergeToast.jsx`
  `PILLAR_COLOR = { ...existing, {pillarId}: '{hexColour}' }`

### 12. App.js Route
- [ ] `const {PillarName}SoulPage = lazy(() => import("./pages/{PillarName}SoulPage"));`
- [ ] `<Route path="/{route}" element={<ProtectedRoute><{PillarName}SoulPage /></ProtectedRoute>} />`

### 13. Technical
- [ ] `overall_score || soul_score || 0` — NEVER `soul_score` alone
- [ ] All DB products fetched via `GET /api/admin/pillar-products?pillar={id}&category={c}`
- [ ] Services via `GET /api/service-box/services?pillar={id}`
- [ ] Score triggering: `POST /api/mira/score-for-pet` on page load for new pets

---

## PILLAR COLOUR MAP

| Pillar | Deep | Accent | Pale | Notes |
|--------|------|--------|------|-------|
| Care | #1B4332 | #40916C | #D8F3DC | Sage green |
| Dine | #7C2D12 | #FF8C42 | #FFF8F0 | Amber |
| Go | #0D2B22 | #1ABC9C | #E8FBF7 | Teal |
| Play | #1F2937 | #E76F51 | #FFF0EB | Red-orange |
| Learn | #1A1363 | #7C3AED | #EDE9FE | Violet/Indigo |
| Celebrate | #3B0764 | #A855F7 | #FAF5FF | Purple |
| Paperwork | #1E293B | #0D9488 | #F0FDFA | Slate + Teal |
| Emergency | #7F1D1D | #EF4444 | #FEF2F2 | Red |
| Farewell | #1F2937 | #8B5CF6 | #F5F3FF | Gentle violet |
| Adopt | #1A2E05 | #65A30D | #F7FEE7 | Lime green |

---

## FILE STRUCTURE FOR EVERY PILLAR

```
/app/frontend/src/
  pages/
    {Pillar}SoulPage.jsx        ← Main page (all inline, single file)
  components/{pillar}/
    {Pillar}NearMe.jsx          ← Google Places near-me component
    {Pillar}ContentModal.jsx    ← Category pill → products modal (if complex)
  hooks/
    useMiraIntelligence.js      ← SHARED — do not duplicate
  components/common/
    MiraImaginesCard.jsx        ← SHARED — do not duplicate
    ConciergeToast.jsx          ← SHARED — add pillar colour entry
```

---

## DB CHECKLIST FOR EVERY PILLAR

```bash
# 1. Tag soul/breed products
db.products_master.updateMany({category:'breed-{type}'},
  {$set:{pillar:'{pillar}', dimension:'{dim}', sub_category:'{sub}'}})

# 2. Insert new products (20+ per pillar)
# See pillar Excel sheet "NEW Products to Add"

# 3. Tag canonical services (8 per pillar)  
db.services_master.updateMany({name:{$in:[...8 canonical names...]}},
  {$set:{pillar:'{pillar}'}})

# 4. Trigger AI scoring for all active pets
POST /api/mira/score-for-pet {pet_id, pillar}

# 5. Trigger Cloudinary Mira Imagines for this pillar × common breeds
POST /api/ai-images/pipeline/mira-imagines?pillar={pillar}&limit=10
```

---

## REMAINING GAPS TO FIX (as of Mar 19, 2026)

### Dine ❌ Missing: Concierge booking modal, Find Dine tab fully wired
### Go ❌ Missing: Breed filter on Mira Picks, Category strip (icon+label), Concierge modal
### Play ❌ Missing: Category strip (icon+label), Concierge modal wired to service cards
### Celebrate ❌ Not built yet (old page exists)
### Paperwork ✅ Building now
### Emergency 🔴 Stub only
### Adopt 🔴 Stub only
### Farewell 🔴 Stub only
