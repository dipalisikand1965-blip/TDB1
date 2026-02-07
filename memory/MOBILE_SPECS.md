# MIRA OS - Mobile Responsiveness Specs

## Design System Specifications

### Breakpoints
| Name | Width | Devices |
|------|-------|---------|
| Mobile S | 320px | iPhone SE, small Android |
| Mobile M | 360-413px | Standard phones |
| Mobile L | 414-767px | iPhone Plus, large Android |
| Tablet | 768-1023px | iPad Mini, tablets |
| Desktop | 1024px+ | Laptops, desktops |

### Typography Scale
| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| H1 | 24px | 28px | 32px |
| H2 | 18px | 20px | 24px |
| Body | 14px | 15px | 16px |
| Small | 12px | 12px | 13px |
| Micro | 10px | 10px | 11px |
| Line Height | 1.5 | 1.6 | 1.7 |

### Spacing Scale
| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Compact elements |
| md | 12px | Standard gap |
| lg | 16px | Section padding |
| xl | 24px | Large sections |
| 2xl | 32px | Hero spacing |

### Touch Targets
- Minimum size: 44px x 44px (Apple HIG)
- Quick reply buttons: min-height 44px
- Service cards: min-height 60px
- Input fields: 44px height

### iOS-Specific
- Safe area insets: `env(safe-area-inset-bottom)`
- Smooth scrolling: `-webkit-overflow-scrolling: touch`
- Input zoom prevention: min 16px font-size
- Tap highlight disabled: `-webkit-tap-highlight-color: transparent`

### Grid Layouts
| Screen Size | Product Grid | Service Grid |
|-------------|--------------|--------------|
| Mobile S | 1 column | 1 column |
| Mobile M | 1 column | 1 column |
| Mobile L | 2 columns | 2 columns |
| Tablet | 2 columns | 2 columns |
| Desktop | 2 columns | 2 columns |

### Product Card Heights
| Screen | Image Height |
|--------|--------------|
| Mobile S | 100px |
| Mobile M/L | 100px |
| Tablet | 110px |
| Desktop | 120px |

---

## Accessibility Features

### Motion Preferences
- `prefers-reduced-motion: reduce` - Disables animations

### Contrast Preferences  
- `prefers-contrast: high` - Enhanced borders

### Color Scheme
- Dark theme by default
- Enhanced contrast for readability

---

## Testing Checklist

### Mobile (iPhone)
- [ ] iPhone SE (320px) - Smallest viewport
- [ ] iPhone 12/13 (390px) - Standard
- [ ] iPhone Plus (414px) - Large
- [ ] Safari input zoom - Should not zoom on focus
- [ ] Safe area - Notch/home indicator respected

### Mobile (Android)
- [ ] Samsung Galaxy S (360px)
- [ ] Pixel (412px)
- [ ] Chrome input zoom

### Tablet
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)

### Desktop
- [ ] 1280px - Standard laptop
- [ ] 1920px - Full HD

---

*Last Updated: February 7, 2026*
