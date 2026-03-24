# PillarSoulProfile — Next Agent Brief

## Two fixes needed:

### Fix 1: Trigger bar more beautiful and prominent
**File:** `/app/frontend/src/components/PillarSoulProfile.jsx` line 301-336
**Current:** Plain white card with basic hover shadow
**Desired:** Visually rich — gradient border, soul score ring, clear "tap to open" feel

Current trigger bar code (line 301-336):
```jsx
<div onClick={() => setOpen(true)} data-testid={`${pillar}-profile-bar`}
  style={{
    background:'#fff', border:`2px solid ${pColor}18`, borderRadius:16,
    padding:'14px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:14,
    marginBottom:16, transition:'all 0.15s',
    boxShadow:`0 2px 12px ${pColor}14`,
  }}>
  {/* pet photo, name, breed chip, score */}
</div>
```

### Fix 2: Drawer wider on desktop
**File:** `/app/frontend/src/components/PillarSoulProfile.jsx` line 343
**Current:** `maxWidth:560`
**Change to:** `maxWidth:'min(680px, 95vw)'`

Current drawer code (line 343):
```jsx
style={{ width:'100%', maxWidth:560, maxHeight:'85vh', background:'#0F0A1E', borderRadius:20, border:`1px solid ${pColor}30`, overflowY:'auto' }}
```

### Key variables available in component:
- `pColor` — pillar accent color
- `scoreColor` — green (#16A34A) for complete, pColor for incomplete
- `barColor` — same as scoreColor
- `isComplete` — boolean, true when score >= 100
- `score` — numeric 0-100
- `totalUnanswered` — number of remaining questions
- `name` — pet name
- `breed` — pet breed
- `pLabel` — pillar display name (e.g., "Care", "Food", "Travel")
