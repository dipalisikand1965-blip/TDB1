# Modal/Drawer Centering Fix — Handover Guide
_Created: 2026-03-23_

## The Bug
All full-screen modals and drawers were stuck to the bottom of the viewport on both mobile and desktop. On mobile, this caused content to clip behind the browser bottom bar and app footer. The modal appeared as a "bottom sheet" instead of a centered overlay.

## Root Cause
The outer overlay container used `alignItems: 'flex-end'` which pushes the modal to the bottom. Combined with `borderRadius: '24px 24px 0 0'` (only top corners rounded), this created a bottom-sheet pattern that doesn't work well when content is tall.

## The Fix — Applied to 2 Components

### 1. SoulMadeModal.jsx
**File**: `/app/frontend/src/components/SoulMadeModal.jsx`

**BEFORE** (broken):
```jsx
style={{
  position:'fixed', inset:0,
  background:'rgba(0,0,0,0.72)',
  zIndex:2000,
  display:'flex', alignItems:'flex-end',    // ← PROBLEM: pushes to bottom
  justifyContent:'center',
  animation:'sm-fade 0.2s ease',
}}
// Inner div:
style={{
  width:'100%', maxWidth:520,
  maxHeight:'92vh', overflowY:'auto',
  background:'#0F0A1E',
  borderRadius:'24px 24px 0 0',              // ← PROBLEM: only top corners
  border:`1px solid ${pillarColor}30`,
}}
```

**AFTER** (fixed):
```jsx
style={{
  position:'fixed', inset:0,
  background:'rgba(0,0,0,0.72)',
  zIndex:2000,
  display:'flex', alignItems:'center',       // ← FIX: centered vertically
  justifyContent:'center',
  animation:'sm-fade 0.2s ease',
  padding:'16px',                            // ← FIX: safe padding from edges
}}
// Inner div:
style={{
  width:'100%', maxWidth:520,
  maxHeight:'85vh', overflowY:'auto',        // ← FIX: reduced from 92vh to 85vh
  background:'#0F0A1E',
  borderRadius:24,                           // ← FIX: all corners rounded
  border:`1px solid ${pillarColor}30`,
}}
```

### 2. PillarSoulProfile.jsx (Soul Drawer)
**File**: `/app/frontend/src/components/PillarSoulProfile.jsx`

**BEFORE** (broken):
```jsx
<div onClick={() => setOpen(false)} style={{
  position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
  zIndex:50001,
  display:'flex', alignItems:'flex-end',     // ← PROBLEM
  justifyContent:'center'
}}>
  <div onClick={e => e.stopPropagation()} style={{
    width:'100%', maxWidth:560, maxHeight:'85vh',
    background:'#0F0A1E',
    borderRadius:'20px 20px 0 0',            // ← PROBLEM
    border:`1px solid ${pColor}30`,
    overflowY:'auto'
  }}>
```

**AFTER** (fixed):
```jsx
<div onClick={() => setOpen(false)} style={{
  position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
  zIndex:50001,
  display:'flex', alignItems:'center',       // ← FIX
  justifyContent:'center',
  padding:16                                 // ← FIX
}}>
  <div onClick={e => e.stopPropagation()} style={{
    width:'100%', maxWidth:560, maxHeight:'85vh',
    background:'#0F0A1E',
    borderRadius:20,                         // ← FIX: all corners
    border:`1px solid ${pColor}30`,
    overflowY:'auto'
  }}>
```

---

## How to Apply This Fix to ANY Other Modal/Drawer

Search for these patterns across the codebase:

```bash
grep -rn "alignItems.*flex-end" /app/frontend/src/components/ --include="*.jsx"
grep -rn "borderRadius.*0 0" /app/frontend/src/components/ --include="*.jsx"
```

For each match that is a full-screen overlay/drawer:

### Change 3 things:

| Property | FROM | TO |
|----------|------|-----|
| `alignItems` | `'flex-end'` | `'center'` |
| `borderRadius` (inner div) | `'Xpx Xpx 0 0'` | `X` (number, all corners) |
| Add `padding` (outer div) | — | `padding: 16` or `padding: '16px'` |

### Optionally:
- Reduce `maxHeight` from `92vh` to `85vh` for breathing room
- Ensure inner div has `overflowY: 'auto'` so content scrolls inside

---

## Files That May Still Need This Fix

Run the grep commands above. Known modals/drawers in the app:
- `SoulMadeModal.jsx` ✅ Fixed
- `PillarSoulProfile.jsx` ✅ Fixed
- `CareContentModal.jsx` — Uses framer-motion, check if bottom-aligned
- `DineContentModal.jsx` — Check
- `GoContentModal.jsx` — Check
- `PlayContentModal.jsx` — Check
- `CelebrateContentModal.jsx` — Check
- `NearMeConciergeModal.jsx` — Check
- `ProductDetailModal` in ProductCard.jsx — Check
- Any `DimExpanded` panels — Usually inline, not fixed overlay

---

## Quick Verification

After fixing, test on mobile (375px viewport) and desktop:
1. Modal should be **vertically centered**, not touching the bottom
2. All 4 corners should be rounded
3. Content should scroll inside the modal
4. Tapping the dark overlay should close the modal
5. Modal should not extend behind the browser's bottom bar on mobile
