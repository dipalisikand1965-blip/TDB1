# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System." A world-class, event-driven platform with a single engine powering 12 business "Pillars" with Pet Soul integration, Unified Inbox, and Mira AI concierge.

**Brand Identity**: World's First Pet Concierge® — "Concierge®" is the registered trademark of Club Concierge® in India, held by Dipali Sikand since 2016.

**Company Address**: #83, 3rd Floor, 7th Cross, 4th B Block, Koramangala, Bangalore - 560034

---

## What's Been Implemented (Latest - Jan 20, 2026)

### Member Directory & 360° Profile Console - COMPLETE ✅
New comprehensive member management system with:
- **Member Directory**: Searchable table with filters (Status, Source, Tier, City)
- **Pet Soul Column**: Shows average Pet Soul score per member directly in the table
- **360° Profile Console** (click Eye icon):
  - **Account Tab**: Contact details, addresses, communication preferences
  - **Membership Tab**: Plan, Paw Points, payment history
  - **Pets & Soul Tab**: 
    - Pet Soul Score with progress bar
    - **8-Category Breakdown**: Identity, Health, Preferences, Temperament, Routine, Travel, Celebrations, Family
    - Quick info (birthday, weight, vaccinations, celebrations)
    - "View Full Soul" and "Send Nudge" buttons
  - **Activity Tab**: Orders, requests, bookings with counts
  - **Notes Tab**: Internal notes with tags/flags

### Pet Profile Bug Fix - COMPLETE ✅
- Fixed: `POST /api/pets` now links pet to authenticated user via `owner_email`
- Pets are now properly visible in My Pets page after creation

### P0 UI & Branding - COMPLETE ✅
- Landing page focused on Concierge®
- Footer with Bangalore address
- "The Doggy Company" branding
- Concierge® trademark applied

### Authentication Gating with Benefits Preview - COMPLETE ✅
- All 12 pillars protected
- Beautiful "Member Benefits" page shows when unauthenticated users try to access
- Pillar-specific benefits displayed

### FAQs - All 12 Pillars - COMPLETE ✅
- Covers all pillars with category filters

### Reports - All 12 Pillars - COMPLETE ✅
- Reports section shows all pillar tabs

---

## Priority Backlog (Updated)

### P0 - Critical
- [ ] Complete remaining Member Management features (Plan Manager, B2B Issuance, etc.)

### P1 - High Priority
- [ ] **Pet Soul Daily Question**: Send one question regularly that enriches Pet Soul
- [ ] Mira Proactive Suggestions from Pet Soul data
- [ ] Voice Order fix ("Connection failed")

### P2 - Medium Priority
- [ ] Shopify Sync "Untitled Products" fix
- [ ] Onboarding flow with Pet Soul creation
- [ ] Preboarding & Onboarding Monitor

### P3 - Future
- Rewards & Privileges Manager
- Renewal & Collections Console
- Templates & Communication Center
- Permissions & Audit Log
- Analytics Dashboard (membership health)

---

## Member Management Roadmap (Per User Request)

### Phase 1 - COMPLETE ✅
1. ✅ **Member Directory** - Searchable with filters
2. ✅ **360° Profile Console** - Account, Membership, Pets & Soul, Activity, Notes
3. ✅ **Pet Soul Visibility** - Score + category breakdown

### Phase 2 - Next
4. [ ] **Gift & B2B Issuance** - Issue without payment, partner tracking
5. [ ] **Membership Plan Manager** - Configure plans, pricing, add-ons
6. [ ] **Preboarding & Onboarding Monitor** - Funnel view

### Phase 3 - Engagement
7. [ ] **Rewards & Privileges Manager**
8. [ ] **Renewal & Collections Console**
9. [ ] **Pet Soul Engagement** - Daily question feature

### Phase 4 - Operations
10. [ ] **Support & Disputes Tools**
11. [ ] **Templates & Communication Center**
12. [ ] **Analytics Dashboard**

### Phase 5 - Governance
13. [ ] **Permissions & Audit Log**
14. [ ] **Data Export & Finance Tools**

---

## API Endpoints Added

### Member Management
- `GET /api/admin/members/directory` - Full member list with pets
- `GET /api/admin/members/{id}/full-profile` - 360° view
- `POST /api/admin/members/{id}/notes` - Add internal notes
- `GET /api/admin/members/pet-soul-summary` - Soul completion stats
- `POST /api/admin/members` - Add single member
- `POST /api/admin/members/import` - CSV bulk import
- `POST /api/admin/members/bulk-action` - Bulk operations

---

## Files Created/Modified

### New Files
- `/app/frontend/src/components/admin/MemberDirectory.jsx` - Complete member management UI

### Modified
- `/app/backend/server.py` - Added member directory endpoints, fixed pet creation
- `/app/frontend/src/pages/Admin.jsx` - Added Member Directory tab
- `/app/frontend/src/components/admin/index.js` - Export MemberDirectory

---

## Credentials

- **Admin**: `aditya` / `lola4304`
- **Test User**: `test@doggy.com` / `test123`
- **Razorpay**: Test keys in `backend/.env`
