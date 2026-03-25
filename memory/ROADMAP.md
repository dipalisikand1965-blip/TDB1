# Roadmap — The Doggy Company Platform
## Last Updated: 2026-03-25

## P0 — Must Do Before Launch

### Mobile Pillar Tab Wiring (10 pillars remaining)
1. **Adopt** — 3 tabs: Find Your Dog / Book Guidance / Find Rescue
2. **Farewell** — 3 tabs: Legacy & Memorial / Get Support / Find Care
3. **Emergency** — 3 tabs + Products/Services sub-tab: Emergency Kit / Book Help / Find Vet
4. **Care** — dimTab (Products/Personalised) + activeTab (sub-categories) + 8 service booking flows
5. **Go** — dimTab (Products/Personalised) + activeTab + 8 service booking flows + PetFriendlyStays
6. **Play** — dimTab (Products/Personalised) + activeTab + BuddyMeetup
7. **Learn** — 7 dimension pills + dimTab (Products/Videos/Services) per dimension
8. **Paperwork** — 7 dimension pills + dimTab (Products/Services/Advisory) + DocumentVault
9. **Services** — 5 service group cards with sub-service listings
10. **Dine** — Fix pills to open DineContentModal instead of filtering inline

### Customer-Facing Page Mobile Audit
- /join, /login, /register, /forgot-password — auth flow
- /dashboard — member dashboard tabs
- /checkout — payment flow
- /my-pets, /pet-home — pet management
- /my-requests — service desk
- / — landing page hero + CTAs

## P1 — Post-Launch Polish

### Visual Consistency
- Font size audit across all mobile pages (match Dine v11 reference)
- Dark theme consistency on PersonalisedBreedSection, Soul Made cards
- Hero gradient consistency check

### Data Quality
- Deactivate/fix 38 products with `needs_ai_image: true`
- Clean Celebrate service shadow records in products_master
- Admin tab performance (Inbox, Finance, Dashboard >3s load)

### Database Migration
- Production DB migration (use platform "Use new database" on deploy)
- OR use custom FULL DB SYNC tool (HTTPS pull mode, bson.json_util)

## P2 — Future Features
- WhatsApp Daily Digest cron job
- Add "3 vets near you" to WhatsApp reminders
- Medication refill reminder scheduler
- Build the Love pillar
- Refactor Admin.jsx (7000+ lines → smaller components)
- Add "My Custom Orders" tab
- Member dashboard mobile-first refactor
- Pet-switching performance optimization
