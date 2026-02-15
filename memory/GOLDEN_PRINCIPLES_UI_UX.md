# MIRA OS - GOLDEN PRINCIPLES
## The Universal Design Bible for Pet Operating System
## Version 2.0 | February 2026

---

## CORE DOCTRINE

### "MIRA KNOWS, MIRA DOESN'T ASK"

This is the foundational principle. Mira is not a search engine or chatbot - Mira is **silent intelligence** that anticipates needs before they're expressed.

**What this means in practice:**
- NO visible search bars on pillar pages
- NO "What does your pet need?" prompts
- Products are silently sorted by Mira based on pet profile
- The FAB is the ONLY entry point to explicit Mira conversation

---

## PLATFORM-SPECIFIC GUIDELINES

### iOS (Human Interface Guidelines)

| Aspect | Specification |
|--------|---------------|
| **Touch Targets** | Minimum 44x44pt (44px) |
| **Modal Pattern** | Full-screen slide-up from bottom |
| **Dismiss Gesture** | Swipe down to dismiss |
| **Safe Areas** | Respect notch (top) and home indicator (bottom) |
| **Haptics** | Soft impact on selection, Success on completion |
| **Navigation** | Bottom sheet + Full-page modals |
| **Edge Swipe** | Support system back gesture |

### Android (Material Design 3)

| Aspect | Specification |
|--------|---------------|
| **Touch Targets** | Minimum 48x48dp (48px) |
| **Modal Pattern** | Full-screen dialog |
| **Dismiss Gesture** | Predictive back gesture |
| **Ripple Effect** | Subtle surface ripples on interaction |
| **Elevation** | Tonal elevation (not heavy shadows) |
| **Navigation** | Navigation Bar + Full-screen dialogs |

### Desktop

| Aspect | Specification |
|--------|---------------|
| **Modal Pattern** | Side-drawer (slides from right) |
| **Width** | 400px fixed width |
| **Hover States** | Rich hover lifts and glows |
| **Keyboard** | Esc to close, Cmd+K for command palette |
| **Layout** | Bento Grid dashboard |

---

## THE MIRA FAB (FLOATING ACTION BUTTON)

### Position
- **Mobile (iOS/Android)**: Fixed bottom-center, above safe area
- **Desktop**: Fixed bottom-right corner

### Visual Design
```css
.mira-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%);
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
}
```

### Animation States
| State | Animation |
|-------|-----------|
| **Idle** | Subtle pulse (2s ease-in-out infinite) |
| **Listening** | Ring pulse (cyan glow) |
| **Thinking** | Loading spinner overlay |
| **Speaking** | Sound wave animation |

### On Click Behavior
- Mobile: Expand to full-screen modal (slide up)
- Desktop: Expand to side drawer (slide from right)

---

## THE MIRA OS MODAL

### Mobile (Full-Page Experience)

```
┌────────────────────────────┐
│ ← Mira          🔊  ✕     │  Header (fixed)
├────────────────────────────┤
│ [Pet Avatars: 🐕 🐈 🐕]    │  Pet Switcher
├────────────────────────────┤
│                            │
│   Chat Messages            │  Content Area
│   & Concierge Cards        │  (scrollable)
│                            │
├────────────────────────────┤
│ [Quick Actions]            │  Action Bar
├────────────────────────────┤
│ [🎤] [Input............] ➤│  Input Area
└────────────────────────────┘
```

### Desktop (Side Drawer)

```
                        ┌──────────────────┐
                        │ Mira    🔊  ✕   │
                        ├──────────────────┤
                        │ Pet: [Lola ▼]   │
                        ├──────────────────┤
                        │                  │
                        │  Chat Messages   │
                        │  & Concierge     │
                        │    Cards         │
                        │                  │
                        ├──────────────────┤
                        │ [Quick Actions]  │
                        ├──────────────────┤
                        │ [🎤] [Input] ➤  │
                        └──────────────────┘
```

---

## THE CONCIERGE ICON (HELPING HANDS)

### Always Visible
The Concierge icon (hands symbol 🤲 or HandHeart icon) should ALWAYS be visible in the header/navbar area.

### State System

| State | Visual | Trigger |
|-------|--------|---------|
| **Idle** | Opacity 60%, grayscale | Default |
| **Active** | Opacity 100%, Mira Purple (#9333EA), subtle glow | Product selected |
| **Pulsing** | Glow animation, badge counter | Pending concierge request |

### Implementation
```jsx
// ConciergeIndicator state management
const conciergeState = {
  idle: 'opacity-60 grayscale',
  active: 'opacity-100 text-purple-600 shadow-lg shadow-purple-500/30',
  pending: 'opacity-100 text-purple-600 animate-pulse'
};
```

### Trigger Flow (Unified Service Intent)
```
User Intent → Product Selection → Concierge Icon Lights Up
                                        ↓
                               Ticket Auto-Created
                                        ↓
                               Inbox Notification
                                        ↓
                               Concierge Fulfillment
```

---

## CURATED PICKS INDICATOR

### Purpose
Show users when Mira has specifically curated content for their pet.

### Visual Design
Small purple badge/dot that appears:
- On product cards that Mira has picked
- Next to the "Picks" section header
- Inside the pet avatar when personalization is active

### Badge Styles
```css
/* Small dot indicator */
.curated-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9333EA;
  position: absolute;
  top: 4px;
  right: 4px;
}

/* Label badge */
.curated-badge {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%);
  color: white;
  border-radius: 9999px;
}
```

---

## TYPOGRAPHY SYSTEM

### Font Stack
| Use | Font | Fallback |
|-----|------|----------|
| **Display/Headings** | Manrope | system-ui |
| **Body** | Inter | system-ui |
| **Special/Accent** | Syne | serif |

### Scale
| Element | Mobile | Desktop |
|---------|--------|---------|
| H1 | text-4xl (36px) | text-5xl (48px) |
| H2 | text-2xl (24px) | text-3xl (30px) |
| H3 | text-xl (20px) | text-2xl (24px) |
| Body | text-base (16px) | text-base (16px) |
| Caption | text-sm (14px) | text-sm (14px) |
| Micro | text-xs (12px) | text-xs (12px) |

### Rules
1. NEVER use Inter for headings - use Manrope or Syne
2. Line height: 1.6 for body text, 1.2 for headings
3. High contrast (WCAG AA minimum)
4. Use weight + size for hierarchy, not just color

---

## COLOR SYSTEM

### Primary Palette
| Name | Hex | Usage |
|------|-----|-------|
| Mira Purple | #9333EA | Primary actions, FAB |
| Mira Glow | #A855F7 | Hover states, glows |
| Teal Primary | #0F766E | Success, completion |
| Amber Warm | #D97706 | Warnings, attention |
| Pink Heart | #BE185D | Love, favorites |

### Gradients
```css
/* Mira Magic - Primary FAB/CTA gradient */
background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%);

/* Golden Hour - Celebration/Joy */
background: linear-gradient(135deg, #FDE68A 0%, #FDBA74 50%, #FDA4AF 100%);

/* Deep Forest - Trust/Premium */
background: linear-gradient(135deg, #0F766E 0%, #0D5C56 100%);
```

### State Colors
```css
.state-idle { color: #6B7280; background: transparent; }
.state-active { color: #9333EA; background: #F3E8FF; }
.state-highlighted { ring: 2px solid #9333EA; ring-offset: 2px; }
.state-error { color: #DC2626; background: #FEF2F2; border-color: #FECACA; }
```

---

## ANIMATION STANDARDS

### Timing
| Type | Duration | Easing |
|------|----------|--------|
| Micro-interaction | 150ms | ease-out |
| Standard | 300ms | ease-out |
| Complex/Modal | 400ms | spring (stiffness: 300, damping: 30) |

### Modal Animations
```jsx
// Mobile: Slide up from bottom
const mobileModalVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  }
};

// Desktop: Slide in from right
const desktopDrawerVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  }
};
```

### Stagger Pattern
Children elements should animate with 50ms stagger delay:
```jsx
const containerVariants = {
  visible: {
    transition: { staggerChildren: 0.05 }
  }
};
```

### Accessibility
Always respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## SPACING SYSTEM

### Base Unit
`1rem` (16px) is the base unit.

### Scale
| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Icon gaps, tight spacing |
| space-2 | 8px | Element padding |
| space-3 | 12px | Small gaps |
| space-4 | 16px | Standard padding |
| space-6 | 24px | Section gaps |
| space-8 | 32px | Large gaps |
| space-12 | 48px | Section separators |

### Safe Areas
- **Mobile bottom**: `pb-24` (96px) to clear FAB and home indicator
- **Mobile top**: Respect notch with `pt-safe` or `env(safe-area-inset-top)`

---

## ACCESSIBILITY REQUIREMENTS

### Touch Targets
- Minimum 44px × 44px on iOS
- Minimum 48px × 48px on Android
- All interactive elements must meet this

### Labels
- All icon-only buttons MUST have `aria-label`
- FAB: `aria-label="Open Mira AI Assistant"`
- Concierge: `aria-label="View Concierge Requests"`

### Focus
- Visible focus rings for keyboard navigation
- Focus should be trapped in modals when open
- First focusable element should receive focus when modal opens

### Color Contrast
- Text on solid backgrounds: 4.5:1 minimum
- Text on gradients: Test at lightest point
- Glass-morphism backgrounds: Increase text weight or add backdrop

---

## IMPLEMENTATION CHECKLIST

### Phase 1: FAB Refinement
- [ ] Ensure FAB z-index is highest (z-[9999])
- [ ] Implement pulse animation for idle state
- [ ] Add haptic feedback on tap (iOS/Android)
- [ ] Test across all pillar pages

### Phase 2: OS Modal
- [ ] Create responsive modal (full-page mobile, drawer desktop)
- [ ] Implement slide-up animation for mobile
- [ ] Implement slide-from-right for desktop
- [ ] Add swipe-to-dismiss on mobile

### Phase 3: Concierge Indicator
- [ ] Add always-visible Concierge icon to navbar
- [ ] Implement state system (idle → active → pending)
- [ ] Connect to Unified Service Intent flow
- [ ] Add glow animation when product selected

### Phase 4: Curated Picks
- [ ] Add subtle indicator on Mira-curated products
- [ ] Implement "Picks for [Pet]" badge
- [ ] Show curated count in pet avatar

---

## FILE REFERENCES

| Component | Path |
|-----------|------|
| Mira FAB (Orb) | `/app/frontend/src/components/MiraOrb.jsx` |
| Chat Widget | `/app/frontend/src/components/MiraChatWidget.jsx` |
| Concierge Cards | `/app/frontend/src/components/MiraConciergeCard.jsx` |
| Mobile Nav | `/app/frontend/src/components/MobileNavBar.jsx` |

---

## UNIFIED SERVICE FLOW (HARDCODED)

**THIS IS NON-NEGOTIABLE. Every user intent follows this exact flow.**

### The Flow (Desktop = Mobile = PWA = Any Device)

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTENT                              │
│  Sources: Search button, Product click, Mira chat,          │
│           Quick book, Service request, ANY interaction      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  1. SERVICE DESK TICKET                                      │
│     Collection: service_desk_tickets                         │
│     ID Format: TKT-XXXX-XXXXXXXX                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. ADMIN NOTIFICATION                                       │
│     Collection: admin_notifications                          │
│     ID Format: NOTIF-XXXXXXXX                               │
│     Shows: Admin Dashboard → Bell icon                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. MEMBER NOTIFICATION                                      │
│     Collection: member_notifications                         │
│     ID Format: MNOTIF-XXXXXXXX                              │
│     Shows: Member Dashboard → Notifications                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. PILLAR REQUEST                                           │
│     Collection: pillar_requests                              │
│     ID Format: PR-XXXXXXXX                                  │
│     Tracks: By pillar (care, dine, travel, etc.)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. TICKETS                                                  │
│     Collection: tickets                                      │
│     Universal ticket store for unified tracking              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. CHANNEL INTAKES                                          │
│     Collection: channel_intakes                              │
│     ID Format: INBOX-XXXXXXXX                               │
│     Tracks: Source (web, mira, whatsapp, mobile, pwa)       │
└─────────────────────────────────────────────────────────────┘
```

### Backend Implementation

The flow is enforced via `central_signal_flow.py`:

```python
from central_signal_flow import create_signal

# Every user action calls this:
result = await create_signal(
    pillar="celebrate",
    action_type="product_interest",
    title="User interested in Birthday Cake",
    description="...",
    customer_name="...",
    source="web"  # or "mobile", "mira", "whatsapp"
)

# Returns:
# {
#     "notification_id": "NOTIF-XXXXXXXX",
#     "ticket_id": "TKT-CELE-XXXXXXXX",
#     "inbox_id": "INBOX-XXXXXXXX"
# }
```

### Frontend Trigger Points

| Trigger | Flow Called |
|---------|-------------|
| Product "Add to Cart" | ✓ |
| Product "Request via Concierge" | ✓ |
| Mira Chat recommendation selected | ✓ |
| Quick Book form submitted | ✓ |
| Service inquiry clicked | ✓ |
| Search button (if results) | ✓ |
| ANY user intent | ✓ |

### Concierge Icon Reflects Flow

The **Helping Hands** icon state tracks the flow:

| Flow Step | Icon State |
|-----------|------------|
| No intent | Idle (gray, 60% opacity) |
| User selects product | Active (purple glow) |
| Ticket created | Pulsing (notification) |
| Concierge picks up | Badge with count |

---

*Last Updated: February 2026*
*Maintained by: Mira OS Team*
