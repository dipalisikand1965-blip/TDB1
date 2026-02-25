# MIRA OS - MOBILE-FIRST UI/UX GOLDEN RULES
## Mandatory Compliance for iOS & Android

> **EVERY UI CHANGE MUST FOLLOW THESE RULES**
> Non-compliance = broken experience on real devices

---

## DEVICE TARGETS

| Device | Viewport | Priority |
|--------|----------|----------|
| iPhone SE | 375 x 667 | P0 |
| iPhone 14 | 390 x 844 | P0 |
| iPhone 14 Pro | 393 x 852 | P0 |
| iPhone 14 Pro Max | 430 x 932 | P1 |
| Android Small | 360 x 640 | P0 |
| Android Medium | 412 x 915 | P0 |
| Android Large | 428 x 926 | P1 |

**Test Range:** 320px - 430px width

---

## TOUCH TARGETS

### Minimum Sizes (NON-NEGOTIABLE)

| Platform | Minimum | Recommended |
|----------|---------|-------------|
| iOS | 44 x 44 px | 48 x 48 px |
| Android | 48 x 48 dp | 56 x 56 dp |
| Web (touch) | 44 x 44 px | 48 x 48 px |

### Implementation

```css
/* Minimum touch target */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

/* Comfortable touch target */
.touch-target-lg {
  min-width: 48px;
  min-height: 48px;
  padding: 14px;
}
```

### Spacing Between Targets

- Minimum gap: 8px
- Recommended gap: 12px
- Never overlap touch areas

---

## SAFE AREAS

### iOS Notch & Home Indicator

```css
/* Apply to page containers */
.safe-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* Bottom navigation */
.bottom-nav {
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
```

### Android Gesture Navigation

```css
/* Bottom safe area for gesture nav */
.android-safe {
  padding-bottom: 24px; /* Default gesture area */
}
```

---

## TYPOGRAPHY

### Scale for Mobile

| Element | Size | Line Height | Weight |
|---------|------|-------------|--------|
| H1 | 24px (text-2xl) | 1.2 | 700 |
| H2 | 20px (text-xl) | 1.3 | 600 |
| H3 | 18px (text-lg) | 1.4 | 600 |
| Body | 16px (text-base) | 1.5 | 400 |
| Small | 14px (text-sm) | 1.5 | 400 |
| Caption | 12px (text-xs) | 1.4 | 400 |

### Font Scaling Support

```css
/* Allow system font scaling */
html {
  font-size: 100%; /* Don't fix to 16px */
  -webkit-text-size-adjust: 100%;
}

/* Use rem for all text */
.body-text {
  font-size: 1rem; /* Scales with system */
}
```

---

## SPACING SYSTEM

| Token | Value | Use Case |
|-------|-------|----------|
| xs | 4px | Tight element grouping |
| sm | 8px | Related elements |
| md | 16px | Standard spacing |
| lg | 24px | Section separation |
| xl | 32px | Major divisions |
| 2xl | 48px | Page margins |

### Tailwind Classes

```
space-y-1 = 4px
space-y-2 = 8px
space-y-4 = 16px
space-y-6 = 24px
space-y-8 = 32px
space-y-12 = 48px
```

---

## GESTURES

### Required Support

| Gesture | Action | Priority |
|---------|--------|----------|
| Tap | Select/Action | P0 |
| Swipe Right | Go Back | P0 |
| Swipe Down | Refresh | P0 |
| Long Press | Context Menu | P1 |
| Pinch | Zoom (images) | P2 |

### Implementation Notes

- Use `touch-action: manipulation` to remove 300ms delay
- Implement pull-to-refresh with visual feedback
- Swipe-to-delete for list items

---

## LOADING STATES

### DO Use

- Skeleton screens (preferred)
- Progress indicators for known duration
- Subtle pulsing animations

### DON'T Use

- Blocking spinners (full screen)
- No feedback at all
- Text saying "Loading..."

### Example Skeleton

```jsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
</div>
```

---

## PERFORMANCE TARGETS

| Metric | Target | Measure |
|--------|--------|---------|
| First Paint | < 1.5s | Lighthouse |
| Interactive | < 3s | Lighthouse |
| Scroll | 60fps | Chrome DevTools |
| Touch Response | < 100ms | Perceptual |

### Optimization Rules

1. Lazy load images below fold
2. Code split routes
3. Minimize bundle size
4. Use CSS animations (not JS)
5. Debounce scroll handlers

---

## CONTRAST & ACCESSIBILITY

### WCAG AA Requirements

| Element | Minimum Ratio |
|---------|---------------|
| Normal text | 4.5:1 |
| Large text (18px+) | 3:1 |
| UI components | 3:1 |
| Focus indicators | 3:1 |

### Color Combinations (MIRA OS)

| Foreground | Background | Ratio |
|------------|------------|-------|
| White (#FFF) | Purple (#9333EA) | 4.8:1 |
| White (#FFF) | Pink (#EC4899) | 3.9:1 |
| Black (#000) | White (#FFF) | 21:1 |
| Gray (#6B7280) | White (#FFF) | 4.6:1 |

---

## FORM INPUTS

### Mobile-Optimized

```jsx
// Email input
<input
  type="email"
  inputMode="email"
  autoComplete="email"
  autoCapitalize="none"
/>

// Phone input
<input
  type="tel"
  inputMode="tel"
  autoComplete="tel"
/>

// Number input
<input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
/>
```

### Input Heights

- Minimum: 44px
- Recommended: 48px
- With label: 56px total

---

## BOTTOM SHEETS & MODALS

### Bottom Sheet Rules

- Max height: 90vh
- Has drag handle (visible)
- Swipe down to dismiss
- Background overlay tappable to close

### Modal Rules

- Never full-screen block
- Always has close button
- Tapping outside closes
- Escape key closes (keyboard)

---

## TESTING CHECKLIST

Before any PR:

- [ ] Tested on iPhone SE viewport (375px)
- [ ] Tested on Android small (360px)
- [ ] All buttons >= 44px
- [ ] Safe areas respected
- [ ] No horizontal scroll
- [ ] Font scaling works
- [ ] Landscape doesn't break
- [ ] Keyboard doesn't cover inputs
- [ ] Loading states present
- [ ] Error states present

---

*Last Updated: February 12, 2026*
*Compliance Target: 100%*
