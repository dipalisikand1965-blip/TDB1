# The Doggy Company — /celebrate UI Specification
## For Aditya — Exact values, Tailwind + CSS
## Version 1.0 | March 13, 2026

---

## Design Tokens — Shared Across All Pages

### Color Palette

#### BACKGROUND COLOURS
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

#### BRAND COLOURS
| Token | Value | Usage |
|-------|-------|-------|
| `--brand-purple` | `#4B0082` | headings, primary actions, active states |
| `--brand-purpleMid` | `#7C3AED` | hover states, secondary purple |
| `--brand-gold` | `#C9973A` | concierge, premium accents, dividers |
| `--brand-rose` | `#C4607A` | celebrate, love, secondary accent |
| `--brand-amber` | `#FF8C42` | dine, food, warm CTA buttons |

#### TEXT COLOURS
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#0E0620` | headings on light backgrounds |
| `--text-darkBrown` | `#1A0A00` | body copy on cream/white |
| `--text-mid` | `#5A2800` | secondary body on warm backgrounds |
| `--text-muted` | `#888888` | labels, subtitles, helper text |
| `--text-onDark` | `#FFFFFF` | all text on dark/purple backgrounds |
| `--text-onDarkSub` | `rgba(255,255,255,0.65)` | subtitles on dark backgrounds |

#### SEMANTIC COLOURS
| Token | Value | Usage |
|-------|-------|-------|
| `--semantic-danger` | `#C0392B` | allergy warnings, health conditions |
| `--semantic-success` | `#27AE60` | safe for pet, no allergies confirmed |
| `--semantic-warning` | `#F59E0B` | star ratings, treatment notes |
| `--semantic-info` | `#2563EB` | Mira chip badges, info states |

---

### Typography

| Name | Font Family |
|------|-------------|
| `--font-display` | `Georgia, 'Times New Roman', serif` |
| `--font-body` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif` |
| `--font-mono` | `'Courier New', Courier, monospace` |

#### TYPE SCALE
| Element | Size | Weight | Line-height |
|---------|------|--------|-------------|
| Hero title | 2.5rem (40px) | 800 | 1.1 |
| Hero title mobile | 1.875rem (30px) | 800 | 1.1 |
| H1 section | 1.5rem (24px) | 700 | - |
| H2 subsection | 1.25rem (20px) | 700 | - |
| Card title | 1rem (16px) | 700 | - |
| Body copy | 0.875rem (14px) | 400 | 1.6 |
| Label/caption | 0.75rem (12px) | 500 | - |
| Micro/badge | 0.625rem (10px) | 700 | - |

---

### Spacing Scale
| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |

---

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | chips, badges, small buttons |
| `--radius-md` | 12px | cards, input fields, category icons |
| `--radius-lg` | 16px | expanded sections, main cards |
| `--radius-xl` | 20px | hero elements, large cards, dark CTAs |
| `--radius-full` | 9999px | pill buttons, soul chips, tags |

---

### Shadows
| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-none` | none | flat cards, default state |
| `--shadow-sm` | 0 1px 3px rgba(0,0,0,0.08) | hovered cards |
| `--shadow-md` | 0 4px 12px rgba(0,0,0,0.10) | expanded sections, modals |
| `--shadow-glow` | 0 0 20px rgba(196,77,255,0.25) | glowing pillar cards |
| `--shadow-goldGlow` | 0 0 16px rgba(201,151,58,0.30) | concierge CTA hover |

---

### Animation / Transition
| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | 150ms ease | button hover, chip active |
| `--transition-base` | 200ms ease | card hover, tab switch |
| `--transition-expand` | 300ms ease-in-out | pillar expand/collapse |
| `--transition-glow` | 400ms ease | soul glow pulse animation |

---

## Component Specifications

### 1. CelebrateHero
**File:** `components/celebrate/CelebrateHero.jsx`

| Property | Desktop | Mobile |
|----------|---------|--------|
| Width | 100% viewport | 100% |
| Min-height | 360px | 280px |
| Background | `linear-gradient(135deg, #1a0020 0%, #3d0060 40%, #6b0099 75%, #9b0cbf 100%)` |
| Padding | 40px 32px 0 32px | 24px 16px 0 16px |
| Overflow | hidden |

**Glow Orbs:**
- Orb 1: 400x400px, top: -100px, right: -80px, `radial-gradient(circle, rgba(196,77,255,0.30) 0%, transparent 70%)`
- Orb 2: 250x250px, bottom: 0, left: 80px, `radial-gradient(circle, rgba(255,107,157,0.20) 0%, transparent 70%)`

**Avatar Ring:**
- Size: 96x96px
- Border: 3px solid transparent
- Background: `linear-gradient(#1a0020, #1a0020) padding-box, linear-gradient(135deg, #00E676, #C44DFF) border-box`

**Soul % Chip:**
- Position: absolute, bottom: -8px, centered
- Background: `linear-gradient(135deg, #C44DFF, #FF6B9D)`
- Font: 10px bold white

**Hero Title:**
- Line 1: 2.5rem, 800 weight, color `#FFD080`, Georgia serif
- Line 2: 'for' white, {petName} `#FFAAD4`

**Soul Chips:**
- Allergy: `rgba(255,107,157,0.12)`, border `rgba(255,107,157,0.50)`
- Loves: `rgba(255,208,128,0.10)`, border `rgba(255,208,128,0.50)`
- Personality: `rgba(196,77,255,0.10)`, border `rgba(196,77,255,0.50)`

---

### 2. CategoryStrip
**File:** `components/celebrate/CategoryStrip.jsx`

| Property | Value |
|----------|-------|
| Background | #FFFFFF |
| Border-bottom | 1px solid #F0E8E0 |
| Height | 72px |
| Padding | 0 24px |

**Category Item:**
- Min-width: 72px
- Icon box: 38x38px, radius 12px
- Active: border-bottom `#FF8C42`, text `#C44400`

---

### 3. SoulCelebrationPillars
**File:** `components/celebrate/SoulCelebrationPillars.jsx`

**Grid:** 4-col desktop, 2-col mobile, gap 10px

**Pillar Colour Map:**
| Pillar | Background | Dot |
|--------|------------|-----|
| Food & Flavour 🍰 | `linear-gradient(135deg, #FFF3E0, #FFE0B2)` | #FF8C42 |
| Play & Joy 🎾 | `linear-gradient(135deg, #FCE4EC, #F8BBD0)` | #E91E63 |
| Social & Friends 🦋 | `linear-gradient(135deg, #F3E5F5, #E1BEE7)` | #9C27B0 |
| Adventure & Move 🌅 | `linear-gradient(135deg, #E3F2FD, #BBDEFB)` | #2196F3 |
| Grooming & Beauty ✨ | `linear-gradient(135deg, #FFF9C4, #FFF176)` | #F9A825 |
| Learning & Mind 🧠 | `linear-gradient(135deg, #E8F5E9, #C8E6C9)` | #4CAF50 |
| Health & Wellness 💚 | `linear-gradient(135deg, #E0F7FA, #B2EBF2)` | #00BCD4 |
| Love & Memory 📸 | `linear-gradient(135deg, #FFF3E0, #FFCCBC)` | #FF5722 |

**States:**
- GLOW: opacity 1.0, shadow-glow, colored dot
- DIM: opacity 0.60, no dot, "Explore" badge
- INCOMPLETE: opacity 0.50, 🔒 icon, "Tell Mira more"

---

### 4. MiraBirthdayBox
**Background:** `linear-gradient(135deg, #1a0020, #3d0060)`
**Border-radius:** 20px
**CTA:** `linear-gradient(135deg, #C44DFF, #FF6B9D)`

---

### 5. CelebrateConcierge
**Background:** `#0E0620` (FLAT, NOT GRADIENT - distinct from MiraBirthdayBox)
**CTA:** `linear-gradient(135deg, #C9973A, #F0C060)`, text `#0E0620`

---

### 6. Page Layout
**Max-width:** 1100px
**Page bg:** #FAFAFA

**Breakpoints:**
- Mobile: max-width 640px (1-col grids)
- Tablet: 641-1024px (2-col grids)
- Desktop: 1025px+ (full layout)

---

*Built with love. Every pixel chosen for Mojo.*
