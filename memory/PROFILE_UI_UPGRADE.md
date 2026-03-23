# PillarSoulProfile UI Upgrade — Handover Guide
_Created: 2026-03-23_

## The Problem
`PillarSoulProfile` renders a basic bar on every pillar page: pet avatar + "{Name}'s {Pillar} Profile" + progress bar + "100% tap". It looks outdated compared to the beautiful `WellnessProfile` card on Care.

**Basic (current — all pillars except Care):**
- Simple row: avatar | title | progress bar | "tap"
- Warm/dark background matching pillar theme
- No breed info, no tags, no "Mira's picks →"

**Beautiful (target — already done on Care):**
- White card with subtle border + shadow
- Pet avatar | Title | Breed tags (e.g. "Indie · short, straight coat · weekly brush") | "Mira's picks →"
- Clean, modern look

## What Was Done on Care (Reference)
On `CareSoulPage.jsx`, the old `PillarSoulProfile` was removed from the top and replaced with:
1. The existing beautiful `WellnessProfile` component (renamed to "Grooming Profile")
2. A `PillarSoulProfile` rendered lower on the page (still has the drawer functionality)
3. A beautiful Health Vault card below it

## What Needs to Be Done on ALL Other Pillars

### Option A: Upgrade PillarSoulProfile Component Globally
**File**: `/app/frontend/src/components/PillarSoulProfile.jsx`

Change the render trigger bar (the clickable bar that opens the drawer) from the basic style to the beautiful white card style. This would fix ALL pillar pages at once.

**Current trigger bar** (around line 290-315):
```jsx
<div onClick={() => setOpen(!open)} style={{
  display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
  background: pBg, borderRadius:12, cursor:'pointer', ...
}}>
  // avatar + title + progress bar + "tap"
</div>
```

**Target style** (match WellnessProfile):
```jsx
<div onClick={() => setOpen(!open)} style={{
  background:'#fff', border:'2px solid PILLAR_PALE', borderRadius:16,
  padding:'14px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:14,
  boxShadow:'0 2px 12px rgba(PILLAR_RGB,0.08)', transition:'all 0.15s',
}}>
  // avatar (rounded square) + title + breed tags + "Mira's picks →"
</div>
```

### Option B: Per-Page Custom Cards (Like Care)
Each pillar page gets its own beautiful profile card that wraps `PillarSoulProfile`. This is more work but allows pillar-specific customization.

## Pages That Need the Upgrade

| Page | File | Current Profile Component |
|------|------|--------------------------|
| Dine | DineSoulPage.jsx | `PillarSoulProfile` (basic) |
| Go | GoSoulPage.jsx | `PillarSoulProfile` (basic) |
| Play | PlaySoulPage.jsx | `PillarSoulProfile` (basic) |
| Learn | LearnSoulPage.jsx | `PillarSoulProfile` (basic) |
| Celebrate | CelebratePageNew.jsx | `PillarSoulProfile` (basic) |
| Shop | ShopSoulPage.jsx | `PillarSoulProfile` (basic) |
| Paperwork | PaperworkSoulPage.jsx | `PillarSoulProfile` (basic) |
| Adopt | AdoptSoulPage.jsx | `PillarSoulProfile` (basic) |
| Farewell | FarewellSoulPage.jsx | `PillarSoulProfile` (basic) |
| Services | ServicesSoulPage.jsx | `PillarSoulProfile` (basic) |
| Emergency | EmergencySoulPage.jsx | `PillarSoulProfile` (basic) |
| Care | CareSoulPage.jsx | ✅ Already beautiful |

## WellnessProfile Component (Reference for Beautiful Style)
**File**: `/app/frontend/src/pages/CareSoulPage.jsx` — `function WellnessProfile` (around line 775)

Key elements of the beautiful style:
1. White background with pillar-pale border
2. Leaf/icon on left (pillar-specific)
3. "{Name}'s {Pillar} Profile" as title
4. Breed tags: "🐾 Indie · short, straight coat · weekly brush"
5. "Mira's picks →" link on the right
6. Subtle box-shadow on hover
7. Opens the same drawer as PillarSoulProfile when clicked

## Recommended Approach
**Option A is cleanest** — upgrade the trigger bar inside `PillarSoulProfile.jsx` globally. The component already knows the pillar, pet, color. Just need to:
1. Change the outer div styling to white card
2. Add breed tags from `pet.breed` and `pet.doggy_soul_answers`
3. Replace "tap" with "Mira's picks →"
4. Keep the drawer logic exactly as-is

This one change fixes all 11 remaining pillar pages simultaneously.
