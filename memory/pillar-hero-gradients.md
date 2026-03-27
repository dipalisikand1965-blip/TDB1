# TDC PILLAR HERO GRADIENTS — MASTER REFERENCE
> Saved: 2026-02-xx | Author: Aditya (owner instruction)
> File: `/app/frontend/src/constants/pillarHeroes.js`

## Rule
Every pillar hero div must use exactly these gradients.
**Dark at the top → lighter at the bottom. Never bright. Never flat. Never the same as another pillar.**

## Usage
```jsx
import { PILLAR_HEROES, pillarHeroStyle } from '../constants/pillarHeroes';

// Option A — spread helper
<div style={pillarHeroStyle('go')}>

// Option B — manual
<div style={{
  background: PILLAR_HEROES['go'].gradient,
  padding: '20px 16px 24px',
  position: 'relative',
  overflow: 'hidden'
}}>
```

## Gradient Table

| Pillar | Vibe | Gradient | Accent |
|---|---|---|---|
| `care` | Soft sage green — nurturing, gentle | `linear-gradient(160deg,#0A1F14 0%,#1A3D2B 55%,#2D6A4F 100%)` | `#52B788` |
| `dine` | Deep cocoa/amber — warm, appetising | `linear-gradient(160deg,#1A0A00 0%,#3D1200 55%,#7A2800 100%)` | `#D97706` |
| `celebrate` | Deep purple — festive, magical | `linear-gradient(160deg,#1A0A2E 0%,#2D1060 55%,#4A1B8C 100%)` | `#9B59B6` |
| `go` | Dark deep teal — adventure, travel | `linear-gradient(160deg,#03211A 0%,#06503F 55%,#0E8A70 100%)` | `#1ABC9C` |
| `play` | Deep orange/coral — energetic, fun | `linear-gradient(160deg,#1A0800 0%,#7A2600 55%,#C84B00 100%)` | `#FF6B35` |
| `learn` | Deep navy blue — intelligent, calm | `linear-gradient(160deg,#050A1A 0%,#0D1F4A 55%,#1A3A7A 100%)` | `#3B82F6` |
| `paperwork` | Deep slate — professional, serious | `linear-gradient(160deg,#0A0F1A 0%,#1A2340 55%,#2D3A5C 100%)` | `#64748B` |
| `emergency` | Deep crimson — urgent, critical | `linear-gradient(160deg,#1A0000 0%,#4A0000 55%,#8B0000 100%)` | `#EF4444` |
| `farewell` | Deep indigo/violet — gentle, memorial | `linear-gradient(160deg,#0A0A1A 0%,#1A1040 55%,#2D1F6A 100%)` | `#7C3AED` |
| `adopt` | Deep warm rose — hopeful, loving | `linear-gradient(160deg,#1A0A0F 0%,#4A1020 55%,#8B1A35 100%)` | `#EC4899` |
| `shop` | Deep charcoal gold — premium, editorial | `linear-gradient(160deg,#0F0F0F 0%,#1A1500 55%,#3D3000 100%)` | `#C9973A` |
