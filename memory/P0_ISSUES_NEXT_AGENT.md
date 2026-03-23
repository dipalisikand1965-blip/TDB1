# P0 Issues for Next Agent — 2026-03-23
_Must fix before soft launch_

## Issue 1: Emergency Soul Made Missing
**Status**: User now wants Soul Made on Emergency page (was previously excluded)
**What to do**: Add `soul_made` pill to Emergency CategoryStrip + ContentModal, same pattern as Care
**File**: Check `/app/frontend/src/pages/EmergencySoulPage.jsx` for category strip
**Reference**: Follow exact pattern from `/app/memory/SOUL_MADE_GUIDE.md`

## Issue 2: "Send to Concierge for Mojo →" Modal Not Generating Ticket
**Screenshot**: Pic 2 — Green modal on Care page showing "Vet Consultation - Specialty" with "Send to Concierge for Mojo →" button
**What to check**: This is the ProductDetailModal or ProductCard modal. The button might not be wired to `attach_or_create_ticket`.
**Files to check**:
- `/app/frontend/src/components/ProductCard.jsx` — look for "Send to Concierge" button
- `/app/frontend/src/components/common/ProductModal.jsx`
**Fix**: Ensure the button calls `bookViaConcierge()` or `useConcierge().request()` or direct `attach_or_create_ticket`

## Issue 3: Adopt + Farewell — Ugly "Soul Products for Indies" Box
**Screenshot**: Pic 3 (Farewell) + Pic 4 (Adopt) — Shows ugly empty state box from PersonalisedBreedSection
**Root cause**: These pages have `<PersonalisedBreedSection>` rendered, but Adopt has 0 breed products and Farewell has 7. The empty state shows "We're curating breed-specific products for Mojo. Check back soon" which looks bad.
**Fix options**:
a) **Remove PersonalisedBreedSection** from Adopt and Farewell entirely — use the Mira Picks product cards instead (Pic 5 shows beautiful Farewell products already exist in Mira Picks)
b) **Integrate Soul Made trigger into MiraPicksSection** on Adopt/Farewell — add the trigger AFTER the Mira Picks horizontal scroll
c) **Style the PersonalisedBreedSection empty state** to be more compact and beautiful — match Pic 5 card style

**Recommended**: Option (b) — Remove PersonalisedBreedSection from Adopt/Farewell, add Soul Made trigger directly after MiraPicksSection with compact styling:
```jsx
// After MiraPicksSection in AdoptSoulPage.jsx / FarewellSoulPage.jsx:
<div onClick={() => setSoulMadeOpen(true)} style={{
  margin:'16px auto', maxWidth:400, padding:'16px 20px',
  background:'#fff', border:`2px solid ${G.rose}18`, borderRadius:16,
  display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer',
  boxShadow:`0 2px 12px ${G.rose}14`,
}}>
  <div>
    <div style={{ fontSize:14, fontWeight:700, color:G.rose }}>✦ Soul Made™ — Make it personal</div>
    <div style={{ fontSize:12, color:'#888', marginTop:2 }}>Upload photo · Concierge® creates it</div>
  </div>
  <span style={{ fontSize:20, color:`${G.rose}40` }}>›</span>
</div>
```

**Files**:
- `/app/frontend/src/pages/AdoptSoulPage.jsx` — Remove `<PersonalisedBreedSection>`, add inline trigger after MiraPicksSection
- `/app/frontend/src/pages/FarewellSoulPage.jsx` — Same, use "In memory of {petName}" text, remove PersonalisedBreedSection
- Import SoulMadeModal + add soulMadeOpen state

## Issue 4: PillarSoulProfile UI on Emergency
**Screenshot**: Pic 1 — Emergency page shows beautiful new white card profile (Indie tag, Mira's picks →). This confirms the global PillarSoulProfile upgrade is working! ✅

## Pillar Color Reference (for triggers)
- Adopt: G.rose / #65A30D
- Farewell: G.indigo / #8B5CF6
- Emergency: G.crimson / #EF4444
