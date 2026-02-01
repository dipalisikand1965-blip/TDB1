# Pet Life Operating System - Product Requirements Document

## Project Overview
A comprehensive Pet Life Operating System for The Doggy Company - India's #1 Pet Platform featuring premium dog cakes, pet-friendly dining, stays & services with same-day delivery.

## Original Problem Statement
Build a complete service booking experience and admin management interface for the Pet Life Operating System. The platform serves pet parents with:
- 14 Life Pillars (Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, Insure)
- Mira AI Concierge for personalized recommendations
- Member Dashboard with comprehensive pet management
- Admin Panel with Service Desk, Paperwork Manager, Kit Assembly, and more

## User Personas
1. **Pet Parents (Members)**: Users managing pets, ordering products, booking services
2. **Admin Staff**: Managing orders, service requests, documents, tickets, kits
3. **Mira AI**: AI-powered concierge for recommendations and assistance

## What's Been Implemented

### Session: February 1, 2026 - Comprehensive Mobile UI Overhaul

**Mobile UI/UX Fixes (CRITICAL - All P0 Bugs Resolved):**
1. ✅ **Restaurant Modal Layout Fixed** - Changed `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` in ReservationModal for single-column form on mobile
2. ✅ **Trainer Cards Redesigned** - New horizontal compact layout on mobile with profile photo, name, title, rating and chevron indicator
3. ✅ **Training Bundles Enhanced** - Added hover states, border highlight, and "Add to Cart" button always visible with clear pricing
4. ✅ **Global Mobile Typography** - Added CSS overrides in index.css for base 16px font, card content 0.875rem, form inputs 16px (prevents iOS zoom)
5. ✅ **Restaurant Cards Improved** - Responsive padding and text sizes (text-sm sm:text-base)
6. ✅ **Form Input Readability** - All modal form fields now have text-base class for 16px minimum

**Testing Agent Mobile Audit - 100% Pass Rate:**
- Pages tested: Homepage, /dine, /learn, /fit, /celebrate, /farewell, /travel, /shop, /paperwork
- All hamburger menus, modals, grids, touch targets, and form inputs verified
- Fit page correctly shows fitness products (NOT pupcakes)

**Previous Session - Mira Chat Bug Fixes:**
1. ✅ **Duplicate Messages Bug Fixed** - Consolidated two conflicting functions (`handlePresetMessage` and `sendMessage`) in `/app/frontend/src/pages/MiraPage.jsx` into a single unified `sendMessage` function that handles both manual input and preset messages
2. ✅ **Mobile Footer AI Disclaimer Added** - Added the AI disclaimer ("Mira is powered by AI and can make mistakes") to the mobile section of `/app/frontend/src/components/Footer.jsx`

**Member Dashboard Fixes (All 4 Bugs Fixed):**
1. ✅ **My Requests Clickable** - Cards navigate to requests tab via `onTabChange('requests')`
2. ✅ **Pet Selector Working** - Dropdown shows when user has multiple pets, changes header to show selected pet's name, breed, and soul completion
3. ✅ **Browse Recommendations Linked** - Both MiraPicksCard and SmartRecommendationsCard buttons navigate to `/shop`
4. ✅ **Documents Tab Added** - Added to both desktop and mobile navigation with proper DocumentsTab component

**Kit Assembly Admin Controls (NEW):**
- Created `/app/backend/kit_admin_routes.py` with full CRUD for kit templates and Mira picks
- Created `/app/frontend/src/components/admin/KitAssemblyManager.jsx` admin UI
- Features:
  - Create/Edit/Delete kit templates
  - Manage products in each kit
  - Custom voice narration per item
  - Voice preview with TTS testing
  - Mira Picks management with voice scripts
  - 14 Life Pillars + bonus categories (17 total)
  - CSV export for both kits and picks
  - Seed defaults button (19 pre-built kits)

**Mira AI Integration (WIRED):**
- Kit templates now feed directly into Mira chat
- When users ask for kits (birthday, travel, etc.), Mira uses admin-configured products and narrations
- Smart recommendations endpoint uses admin-curated Mira Picks
- Products display with `is_admin_curated`, `mira_tagline`, `mira_voice_script` flags
- Original gathering/personalization flow preserved - admin templates used at assembly stage

**Voice Cutoff Fix:**
- Fixed Chrome TTS bug in `CinematicKitAssembly.jsx` that caused voice to cut off after ~15 seconds
- Added pause/resume workaround every 10 seconds to keep speech synthesis active

**Mira Nutrition/Diet Bug Fix:**
- Fixed issue where "meal plan" queries were incorrectly routed to "dine" pillar (restaurants)
- Added nutrition-specific keywords to "fit" pillar
- Smart override: nutrition queries in "dine" context → switch to "fit" pillar

**AI Disclaimer Implementation:**
- Added nutrition disclaimer to Mira responses: "This is general guidance... consult your veterinarian"
- Added footer disclaimer: "Mira is powered by AI and can make mistakes"
- Created `/ai-disclaimer` page in Policies section with full AI terms
- Updated Terms of Service with AI limitations

**Mira System Prompt Enhancement:**
- Added Section 9.5 with nutrition guidance rules
- Breed-specific nutrition facts (Labrador, Golden, GSD, French Bulldog, etc.)
- Clear boundaries: what Mira CAN vs CANNOT provide
- Standard disclaimer template for nutrition responses

### Previous Session Accomplishments
- Member Dashboard Refactor: 3,500+ line file split into 15 lazy-loaded components
- File Upload Implementation: Proper upload endpoint and UI
- Admin Document Vault: New tab in Paperwork Manager
- Service Desk Enhancements: Lock/delete ticket functionality

## Architecture

```
/app
├── backend
│   ├── server.py                    # Main FastAPI server
│   ├── kit_admin_routes.py          # NEW: Kit Assembly & Mira Picks admin
│   ├── paperwork_routes.py          # File upload & admin docs
│   ├── ticket_routes.py             # Service desk tickets
│   └── mira_routes.py               # Mira AI endpoints
└── frontend
    └── src
        ├── App.js                   # Main routing
        ├── pages
        │   ├── MemberDashboard.jsx  # Lazy-loading container with pet selector
        │   ├── Admin.jsx            # Admin panel with Kit Assembly tab
        │   └── PaperworkPage.jsx    # Document upload UI
        ├── components
        │   ├── admin/
        │   │   ├── KitAssemblyManager.jsx  # NEW: Kit & Mira Picks admin
        │   │   ├── DoggyServiceDesk.jsx
        │   │   └── PaperworkManager.jsx
        │   ├── dashboard/tabs/      # 15+ tab components
        │   │   ├── OverviewTab.jsx  # Pet selector, uses currentPet
        │   │   └── DocumentsTab.jsx
        │   ├── CinematicKitAssembly.jsx   # Fixed TTS cutoff
        │   ├── MiraPicksCard.jsx
        │   └── SmartRecommendationsCard.jsx
        └── context/
            ├── AuthContext.js
            └── CartContext.js
```

## API Endpoints

### Kit Assembly Admin
- GET /api/admin/kits/categories - Get kit categories (9 categories)
- GET /api/admin/kits/templates - List all kit templates
- POST /api/admin/kits/templates - Create kit template
- PUT /api/admin/kits/templates/{id} - Update kit template
- DELETE /api/admin/kits/templates/{id} - Delete kit template
- GET /api/admin/kits/mira-picks - List Mira picks
- POST /api/admin/kits/mira-picks - Create Mira pick
- PUT /api/admin/kits/mira-picks/{id} - Update Mira pick
- DELETE /api/admin/kits/mira-picks/{id} - Delete Mira pick
- POST /api/admin/kits/preview-voice - Preview voice script
- GET /api/admin/kits/voice-scripts/{id} - Get all scripts for a kit
- **POST /api/admin/kits/seed-defaults** - Seed 5 default kits (Travel, Cinema, Birthday, Grooming, Puppy)
- **GET /api/admin/kits/mira/recommendations** - Kits for Mira AI to recommend
- **GET /api/admin/kits/mira/picks** - Active Mira picks for AI
- **GET /api/admin/kits/export/csv** - Export kit templates as CSV
- **GET /api/admin/kits/mira-picks/export/csv** - Export Mira picks as CSV

### Existing Endpoints
- POST /api/auth/login
- GET /api/pets/my-pets
- GET /api/paperwork/documents/{pet_id}
- GET /api/mira/my-requests
- POST /api/paperwork/documents/upload
- GET /api/paperwork/admin/documents

## Test Credentials
- **Member Login**: dipali@clubconcierge.in / test123
- **Admin Panel**: aditya / lola4304

## Prioritized Backlog

### P0 (High Priority)
- [x] Fix Member Dashboard bugs (COMPLETED)
- [x] Kit Assembly Admin Controls (COMPLETED)
- [x] Mira Picks Admin Dashboard (COMPLETED)
- [x] Fix Cinema Kit voice cutting off (COMPLETED)
- [x] Fix Mira Chat duplicate messages bug (COMPLETED Feb 1)
- [x] Fix Mobile Footer missing AI disclaimer (COMPLETED Feb 1)
- [x] **COMPREHENSIVE MOBILE UI OVERHAUL** (COMPLETED Feb 1)
  - Restaurant modal layout fixed
  - Trainer cards redesigned for mobile
  - Training bundles clickable with visual feedback
  - Global typography enhanced for readability
  - Full mobile audit passed (9 pages tested, 100% success)
- [ ] Implement Membership Business Model (Freemium vs Members-Only)
- [ ] Verify all recent features are mobile-friendly

### P1 (Medium Priority)
- [ ] "Pet Parent Magnet" features (First box free, Pet Parent Score)
- [ ] Rewards Program finalization

### P2 (Lower Priority)
- [ ] Razorpay Payment Integration (awaiting keys)
- [ ] WhatsApp Business Integration (awaiting approval)
- [ ] Partner Portal development
- [ ] Saved Kits UI in Member Dashboard

### Refactoring Tasks
- [ ] DoggyServiceDesk.jsx (5000+ lines) needs component extraction

## Known Issues
- Dashboard page is memory-intensive and may crash Playwright screenshot tools (known issue, not blocking for users)
- Meilisearch unavailable (non-blocking for core functionality)

## 3rd Party Integrations
- **OpenAI GPT-4o**: Mira AI chat backend
- **Resend**: Transactional emails (functional)
- **Razorpay**: Pending (awaiting keys)
- **WhatsApp**: Pending (awaiting Meta approval)
