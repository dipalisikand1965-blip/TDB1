# Pet Operating System - PRD

## Original Problem Statement
Build a world-class premium Mira AI chat interface for The Doggy Company that provides a "10/10" experience.

## Current Status (February 7, 2026)

### ⚠️ CRITICAL PLATFORM BLOCKER
The Emergent preview proxy is NOT working correctly:
- All routes (`/mira-demo`, `/shop`, `/mira-os`) show the home page
- API routes (`/api/*`) return 404
- "Frontend Preview Only. Please wake servers to enable backend functionality." banner persists
- Backend runs locally but is not accessible through the preview proxy

This is a **platform-level issue** that needs Emergent support.

### ✅ CODE CHANGES COMPLETED (Waiting for Platform Fix)

1. **Premium "For Mystique" Welcome UI** (matching UnifiedHero from pillar pages):
   - Pet avatar with **multiple animated concentric rings** (ring-1, ring-2, ring-3)
   - **Glow effect** with pulsing animation
   - "Start {pet.name}'s soul journey" button
   - "For {pet.name}" title with pink-to-yellow gradient
   - "Curated with love for {pet.name}" subtitle
   - **Soul traits** chips (Glamorous soul, Elegant paws, Devoted friend style)
   - **"Mira knows {pet.name}"** personalized picks card
   - Quick suggestion chips (Treats, Grooming, Birthday, Travel)

2. **100% Mobile Optimization**:
   - iOS Safari webkit fixes
   - Android compatibility
   - Safe area inset support for iPhone X+
   - Touch-friendly interactions
   - Responsive layouts (column on mobile, row on desktop)

3. **CSS Added** (~350 lines in mira-prod.css):
   - `.mira-hero-welcome` - Main container
   - `.soul-journey-btn` - Top button
   - `.hero-layout` - Flexbox layout
   - `.hero-avatar-container` with rings and glow
   - `.trait-chip` - Soul trait styling
   - `.mira-love-card` - "Personalized picks" card
   - `.quick-chip` - Quick suggestion buttons
   - Media queries for mobile breakpoints

### 📁 Files Modified
- `/app/frontend/src/pages/MiraDemoPage.jsx` (lines 1803-1897)
- `/app/frontend/src/styles/mira-prod.css` (added premium welcome CSS)
- `/app/frontend/.env` (fixed REACT_APP_BACKEND_URL)

### 🔧 Required Platform Action
Need Emergent support to:
1. Fix the preview proxy API routing (currently returns 404)
2. Enable proper React router navigation
3. Connect backend to frontend through the proxy

### 📋 Once Platform is Fixed, Test:
1. Navigate to `/mira-demo` - should show premium "For Buddy" welcome
2. Verify soul traits, avatar rings, personalized picks card
3. Test quick chips (Treats for Buddy, etc.)
4. Test on mobile viewport (iOS Safari, Android Chrome)
5. Test chat flow with Concierge buttons

## Architecture Reference
```
/app
├── backend/
│   └── mira_routes.py  # Main Mira API
└── frontend/
    ├── src/pages/MiraDemoPage.jsx  # Main chat component
    └── src/styles/mira-prod.css    # Production styling
```

## Credentials
- Email: dipali@clubconcierge.in
- Password: test123
- Database: test_database

## Key Documentation
- `/app/memory/MIRA_DOCTRINE.md` - Complete voice & tone guidelines
- `/app/memory/PRD.md` - This file
