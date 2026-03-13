# The Doggy Company — /celebrate UI Specification
*For Aditya — Exact values, Tailwind + CSS*
*Last updated: Feb 2026 — from user-provided specification document*

---

## Design Tokens — Shared Across All Pages

### Colour Palette

**Background Colours**
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deepPurple` | `#0E0620` | nav, hero overlays, dark cards |
| `--bg-warmDark` | `#1A0A00` | dine hero, dark CTA cards |
| `--bg-surface` | `#FFFFFF` | product cards, modals, expanded sections |
| `--bg-cream` | `#FDF6EE` | page background for dine |
| `--bg-lightPurple` | `#F3E8FF` | Mira quote backgrounds, tummy profile |
| `--bg-lightGold` | `#FFF8E8` | spec table headers, warm accents |
| `--bg-lightAmber` | `#FFF3E0` | dine dimensions, meal pick teaser |
| `--bg-lightRose` | `#FFF0F4` | celebrate pillar accents |
| `--bg-lightGreen` | `#E8F5E9` | supplement cards, success states |
| `--bg-lightBlue` | `#E3F2FD` | frozen cards, info states |

**Brand Colours**
| Token | Value | Usage |
|-------|-------|-------|
| `--brand-purple` | `#4B0082` | headings, primary actions, active states |
| `--brand-purpleMid` | `#7C3AED` | hover states, secondary purple |
| `--brand-gold` | `#C9973A` | concierge, premium accents, dividers |
| `--brand-rose` | `#C4607A` | celebrate, love, secondary accent |
| `--brand-amber` | `#FF8C42` | dine, food, warm CTA buttons |

**Text Colours**
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#0E0620` | headings on light backgrounds |
| `--text-darkBrown` | `#1A0A00` | body copy on cream/white |
| `--text-mid` | `#5A2800` | secondary body on warm backgrounds |
| `--text-muted` | `#888888` | labels, subtitles, helper text |
| `--text-onDark` | `#FFFFFF` | all text on dark/purple backgrounds |
| `--text-onDarkSub` | `rgba(255,255,255,0.65)` | subtitles on dark backgrounds |

**Semantic Colours**
| Token | Value | Usage |
|-------|-------|-------|
| `--semantic-danger` | `#C0392B` | allergy warnings, health conditions |
| `--semantic-success` | `#27AE60` | safe for pet, no allergies confirmed |
| `--semantic-warning` | `#F59E0B` | star ratings, treatment notes |
| `--semantic-info` | `#2563EB` | Mira chip badges, info states |

---

### Typography

| Token | Value |
|-------|-------|
| `--font-display` | `Georgia, 'Times New Roman', serif` |
| `--font-body` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif` |
| `--font-mono` | `'Courier New', Courier, monospace` |

**Type Scale**
| Usage | Size | Weight | Family |
|-------|------|--------|--------|
| Hero title (desktop) | 2.5rem (40px) | 800 | display |
| Hero title (mobile) | 1.875rem (30px) | 800 | display |
| H1 section | 1.5rem (24px) | 700 | display |
| H2 subsection | 1.25rem (20px) | 700 | body |
| Card title | 1rem (16px) | 700 | body |
| Body copy | 0.875rem (14px) | 400 | line-height: 1.6 |
| Label/caption | 0.75rem (12px) | 500 | letter-spacing: 0.02em |
| Micro/badge | 0.625rem (10px) | 700 | letter-spacing: 0.04em |

---

### Spacing Scale
`4px / 8px / 12px / 16px / 20px / 24px / 32px / 40px / 48px`

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | chips, badges, small buttons |
| `--radius-md` | 12px | cards, input fields, category icons |
| `--radius-lg` | 16px | expanded sections, main cards |
| `--radius-xl` | 20px | hero elements, large cards, dark CTAs |
| `--radius-full` | 9999px | pill buttons, soul chips, tags |

### Elevation / Shadow
| Token | Value |
|-------|-------|
| `--shadow-none` | none |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.10)` |
| `--shadow-glow` | `0 0 20px rgba(196,77,255,0.25)` |
| `--shadow-goldGlow` | `0 0 16px rgba(201,151,58,0.30)` |

### Animation / Transition
| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | 150ms ease | button hover, chip active |
| `--transition-base` | 200ms ease | card hover, tab switch |
| `--transition-expand` | 300ms ease-in-out | pillar/dimension expand/collapse |
| `--transition-glow` | 400ms ease | soul glow pulse animation |

---

## Component 1 — CelebrateHero

**File:** `components/celebrate/CelebrateHero.jsx`

| Property | Value |
|----------|-------|
| Width | 100% viewport width |
| Min-height | 360px desktop / 280px mobile |
| Background | `linear-gradient(135deg, #1a0020 0%, #3d0060 40%, #6b0099 75%, #9b0cbf 100%)` |
| Padding | `40px 32px 0 32px` desktop / `24px 16px 0 16px` mobile |
| Overflow | hidden (for glow orbs) |

**Glow Orbs (decorative, pointer-events: none)**
- Orb 1: 400x400, top: -100px, right: -80px, `radial-gradient(circle, rgba(196,77,255,0.30) 0%, transparent 70%)`, z-index: 1
- Orb 2: 250x250, bottom: 0, left: 80px, `radial-gradient(circle, rgba(255,107,157,0.20) 0%, transparent 70%)`

**Hero Inner Layout**
- Desktop: `display: flex; align-items: flex-start; gap: 28px`
- Mobile: `flex-direction: column; align-items: center; text-align: center`

**Mojo Avatar Ring**
- Size: 96x96px, `border-radius: 50%`
- Border: `3px solid transparent; background: linear-gradient(#1a0020, #1a0020) padding-box, linear-gradient(135deg, #00E676, #C44DFF) border-box`
- **Pet photo (actual):** Use `pet?.photo_url || pet?.image_url` — same field as /celebrate page

**Soul % Chip (on avatar)**
- Position: `absolute; bottom: -8px; left: 50%; transform: translateX(-50%)`
- Background: `linear-gradient(135deg, #C44DFF, #FF6B9D)`, fontSize: 10px, padding: `2px 8px`

**Hero Title**
- Line 1: "Celebrations" — `color: #FFD080`, display
- Line 2: "for " (white) + {petName} (`color: #FFAAD4`)

**Soul Chips**
| Type | Border | Background |
|------|--------|------------|
| Allergy | `rgba(255,107,157,0.50)` | `rgba(255,107,157,0.12)` |
| Loves | `rgba(255,208,128,0.50)` | `rgba(255,208,128,0.10)` |
| Personality | `rgba(196,77,255,0.50)` | `rgba(196,77,255,0.10)` |

**Mira Quote Box**
- Background: `rgba(255,255,255,0.10)`, border: `1px solid rgba(255,255,255,0.15)`, radius: 12px, max-width: 440px
- Mira icon: 28x28, `linear-gradient(135deg, #C44DFF, #FF6B9D)`, text: "✦"

---

## Component 2 — CategoryStrip

**File:** `components/celebrate/CelebrateCategoryStrip.jsx`

| Property | Value |
|----------|-------|
| Background | #FFFFFF |
| Border-bottom | `1px solid #F0E8E0` |
| Padding | `0 24px` |
| Display | `flex; overflow-x: auto; scrollbar-width: none` |
| Height | 72px |

**Category Item**
- min-width: 72px, flex-shrink: 0, flex-direction: column
- Active state: `border-bottom: 3px solid #FF8C42; color: #C44400`
- Icon box: 38x38, radius: 12px

---

## Component 3 — SoulCelebrationPillars

**File:** `components/celebrate/SoulCelebrationPillars.jsx`

**Pillar Colour Map (exact values from spec)**

| Pillar | Background | Dot Color |
|--------|------------|-----------|
| Food & Flavour 🍰 | `linear-gradient(135deg, #FFF3E0, #FFE0B2)` | `#FF8C42` |
| Play & Joy 🎾 | `linear-gradient(135deg, #FCE4EC, #F8BBD0)` | `#E91E63` |
| Social & Friends 🦋 | `linear-gradient(135deg, #F3E5F5, #E1BEE7)` | `#9C27B0` |
| Adventure & Move 🌅 | `linear-gradient(135deg, #E3F2FD, #BBDEFB)` | `#2196F3` |
| Grooming & Beauty ✨ | `linear-gradient(135deg, #FFF9C4, #FFF176)` | `#F9A825` |
| Learning & Mind 🧠 | `linear-gradient(135deg, #E8F5E9, #C8E6C9)` | `#4CAF50` |
| Health & Wellness 💚 | `linear-gradient(135deg, #E0F7FA, #B2EBF2)` | `#00BCD4` |
| Love & Memory 📸 | `linear-gradient(135deg, #FFF3E0, #FFCCBC)` | `#FF5722` |

**Pillar States**
| State | Opacity | Shadow | Badge |
|-------|---------|--------|-------|
| GLOW | 1.0 | `0 0 20px rgba(196,77,255,0.25)` | coloured badge, personalised |
| DIM | 0.60 | none | 'Explore' |
| INCOMPLETE | 0.50 | none | '🔒 Tell Mira more', lock icon |
| EXPANDED | border: `2px solid #C44DFF` | expanded section below |

---

## Component 4 — SoulPillarExpanded

**File:** `components/celebrate/SoulPillarExpanded.jsx`

| Property | Value |
|----------|-------|
| Background | #FFFFFF |
| Border-radius | 16px |
| Border | `2px solid #C44DFF` |
| Padding | 22px |

**Tabs (4 tabs)**
- Base: `background: #FFF8F0; border: 1px solid #FFCC99; color: #C44400; radius: full`
- Active: `background: #C44DFF; color: #FFFFFF; border-color: #C44DFF`

**Product Card**
- Image area: height 100px
- "For {petName}" tag: `linear-gradient(135deg, rgba(255,140,66,0.15), rgba(196,77,255,0.10))`
- Add button: `linear-gradient(135deg, #FF8C42, #C44DFF)`

**Pillar → Category Mapping (for real API calls)**
| Pillar | API Category |
|--------|-------------|
| food | `/api/products?category=cakes` then `treats` |
| play | `/api/products?category=toys` |
| social | `/api/celebrate/bundles` (hampers) |
| grooming | `/api/products?category=grooming` |
| learning | `/api/products?category=puzzles` |
| health | `/api/products?category=supplements` |
| memory | `/api/products?category=accessories` |

---

## Component 5 — MiraBirthdayBox (MiraCuratedBox)

**File:** `components/celebrate/MiraCuratedBox.jsx`

| Property | Value |
|----------|-------|
| Background | `linear-gradient(135deg, #1a0020, #3d0060)` |
| Border-radius | 20px |
| Padding | 28px |

**Badge:** `rgba(196,77,255,0.20)` background, `rgba(196,77,255,0.40)` border, `#E0AAFF` text

**CTA buttons:**
- Primary: `linear-gradient(135deg, #C44DFF, #FF6B9D)` → navigates to `/occasion-box?occasion=birthday`
- Secondary "Birthday Box": `rgba(255,255,255,0.10)` → same navigation

---

## Component 6 — CelebrateConcierge

**File:** `components/celebrate/CelebrateConcierge.jsx`

> ⚠️ **CRITICAL:** Background MUST be flat `#0E0620` — NOT a gradient. BirthdayBox uses gradient; Concierge uses flat deep purple.

| Property | Value |
|----------|-------|
| Background | `#0E0620` (FLAT — no gradient) |
| Border-radius | 20px |
| Padding | 28px |

**Gold badge:** `rgba(201,151,58,0.20)` bg, `rgba(201,151,58,0.40)` border, `#F0C060` text

**CTA:** `linear-gradient(135deg, #C9973A, #F0C060)` background, `#0E0620` text color (dark on gold)

**"Browse Celebrate Catalogue" CTA — Opens a bottom drawer with two tabs:**
1. **Celebrate tab:** Products from `/api/products?category=cakes` (The Doggy Bakery with beautiful illustrations)
2. **Personalised tab:** Bundles from `/api/celebrate/bundles` (soul-filtered, Cloudinary illustrations)

---

## Component 7 — GuidedCelebrationPaths

**File:** `components/celebrate/GuidedCelebrationPaths.jsx`

- Grid: 3 cols desktop, 1 col mobile
- Card: white, `border: 1px solid #F5E8D4`, radius: 12px, padding: 18px

**Icon backgrounds**
| Path | Background |
|------|------------|
| Birthday | `#FCE4EC` |
| Gotcha Day | `#E8F5E9` |
| Photoshoot | `#E3F2FD` |

---

## Component 8 — CelebrationWall

**File:** `components/celebrate/CelebrationWall.jsx`

| Property | Value |
|----------|-------|
| Background | `#F9F4FF` |
| Padding | 32px |
| Grid | 4 cols desktop, 2 cols mobile |

---

## Component 9 — Mira Ask Bar

**File:** Inline in `CelebratePageNew.jsx`

- Appears BELOW the Soul Pillars section
- **No text/label** — just the input bar
- On click/submit: opens Mira AI widget via `window.dispatchEvent(new CustomEvent('openMiraAI', { detail: { message, context: 'celebrate' } }))`
- Style: purple-tinted input with gradient send button
- Placeholder: `Ask Mira about {petName}'s celebrations...`

---

## Page Layout

**File:** `pages/CelebratePageNew.jsx` (route: `/celebrate-soul`)

| Property | Value |
|----------|-------|
| Max-width | 1100px (5xl in Tailwind) |
| Page bg | #FAFAFA |
| Section spacing | `margin-bottom: 32px` |

**Section Order:**
1. CelebrateHero (full-width, no max-width constraint)
2. CelebrateCategoryStrip
3. SoulCelebrationPillars
4. **Mira Ask Bar** (below pillars, NO text label)
5. MiraCuratedBox
6. CelebrateConcierge (+ bottom drawer on CTA click)
7. GuidedCelebrationPaths
8. CelebrationWall

---

## Data Sources

| Component | Data Source |
|-----------|-------------|
| Cakes & treats | `/api/products?category=cakes` (Shopify/The Doggy Bakery) |
| Celebrate bundles | `/api/celebrate/bundles` (Cloudinary illustrations) |
| Pillar products | `/api/products?category={X}` per pillar mapping |
| Pet photo | `pet?.photo_url || pet?.image_url` |
| Soul score | `pet?.soul_score || pet?.overall_score` |

---

## Mobile Responsiveness

| Breakpoint | Behaviour |
|------------|-----------|
| Mobile (< 640px) | Stacked hero, 2-col pillar grid, single-col paths, bottom nav unchanged |
| Tablet (641–1024px) | 2-col pillar grid, abbreviated nav |
| Desktop (1025px+) | Full 4-col pillar grid, side-by-side hero layout |

**⚠️ Android/iOS footer:** The mobile bottom navigation bar stays UNCHANGED from the existing implementation.
