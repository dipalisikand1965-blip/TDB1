# The Doggy Company — Product Requirements Document
## Last Updated: 2026-03-26 (Session 8 — Automations & Dashboard Fixes Complete)
## DEPLOYMENT: Upcoming (Atlas IP whitelist still blocked)

---

## 1. PRODUCT VISION

**The Doggy Company** is a Pet Life OS — a full-stack, AI-driven platform that treats dogs as souls, not pets. It is structured around 12 pillar pages, each serving a different dimension of a dog's life: Dine, Care, Go, Play, Learn, Celebrate, Shop, Services, Adopt, Farewell, Emergency, Paperwork.

The platform's core promise: **Mira**, an AI concierge, knows your dog's soul — breed, allergies, temperament, life stage — and personalises every product, service, and recommendation accordingly.

---

## 2. USERS

- **Pet Parents** — primary users; authenticated members with pets
- **Admin (Aditya)** — platform admin, manages products, services, orders, members
- **Concierge** — receives and fulfils service booking tickets
- **Guests** — landing page, membership page, auth pages

**Test Credentials:**
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304` at `/admin`

---

## 3. TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Shadcn/UI, Framer Motion |
| Backend | FastAPI (Python), MongoDB, Motor (async) |
| AI | Mira — custom concierge logic + OpenAI/Gemini via Emergent Key |
| Notifications | Gupshup WhatsApp, email |
| Storage | Cloudinary (images), MongoDB GridFS |
| Auth | JWT (custom) + Emergent Google OAuth |
| Build | CRACO, `GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=4096` |

**Service Ports:** Backend: 8001, Frontend: 3000 (supervisor-managed)
**Preview URL:** `https://pet-soul-ranking.preview.emergentagent.com`

---

## 4. CODE ARCHITECTURE

### Responsive Split Pattern (ALL 12 pillars)
```
PillarSoulPage.jsx (parent)
  ├── isDesktop check → window.innerWidth >= 1024
  ├── Desktop (>= 1024px) → renders original SoulPage JSX (LOCKED — never touch)
  └── Mobile (< 1024px)  → renders *MobilePage.jsx component
```

### Key Files
| File | Purpose | Status |
|---|---|---|
| `frontend/src/pages/*SoulPage.jsx` | Desktop pillar pages | 🔒 LOCKED |
| `frontend/src/pages/*MobilePage.jsx` | Mobile pillar pages | ✅ All 12 done |
| `frontend/src/hooks/useMiraFilter.js` | AI product ranking | ✅ Breed/size/life-stage |
| `frontend/src/components/admin/PillarManager.jsx` | Go+Play admin base | ✅ 7 tabs + Quick Add |
| `frontend/src/components/admin/UnifiedProductBox.jsx` | Product CRUD | ✅ Save fix applied |
| `frontend/src/components/admin/PillarProductsTab.jsx` | Products tab | ✅ 20/page + createTrigger |
| `frontend/src/components/admin/PillarServicesTab.jsx` | Services tab | ✅ Add Service modal |
| `frontend/src/components/admin/PillarBundlesTab.jsx` | Bundles tab | ✅ createTrigger prop |
| `backend/server.py` | Main monolith | ⚠️ 24,000+ lines — NEVER modify directly |
| `backend/unified_product_box.py` | Product routes | ✅ |
| `backend/service_box_routes.py` | Service routes | ✅ |
| `backend/mira_service_desk.py` | Tickets + Mira | ✅ |

---

## 5. 12 PILLARS

| Pillar ID | Name | Mobile | Desktop | Admin Manager | Status |
|---|---|---|---|---|---|
| celebrate | Celebrate | ✅ | ✅ LOCKED | CelebrateManager | ✅ |
| dine | Dine | ✅ | ✅ LOCKED | DineManager | ✅ |
| go | Go | ✅ | ✅ LOCKED | GoManager (PillarManager) | ✅ |
| care | Care | ✅ | ✅ LOCKED | CareManager | ✅ |
| play | Play | ✅ | ✅ LOCKED | PlayManager (PillarManager) | ✅ |
| learn | Learn | ✅ | ✅ LOCKED | LearnManager | ✅ |
| paperwork | Paperwork | ✅ | ✅ LOCKED | PaperworkManager | ✅ |
| emergency | Emergency | ✅ | ✅ LOCKED | EmergencyManager | ✅ |
| farewell | Farewell | ✅ | ✅ LOCKED | FarewellManager | ✅ |
| adopt | Adopt | ✅ | ✅ LOCKED | AdoptManager | ✅ |
| shop | Shop | ✅ | ✅ LOCKED | ShopManager | ✅ |
| services | Services | ✅ | ✅ LOCKED | ServiceBox | ✅ |

---

## 6. DATABASE STATE (2026-03-25)

| Collection | Count | Notes |
|---|---|---|
| products_master | 6,042 | 457 soul_made, 5,585 regular |
| services_master | 1,021 | All 12 pillars mapped |
| breed_products | 3,448 | Soul catalog — needs "Add to catalog" for pillar pages |
| bundles_master | 20+ | Care and others |
| service_desk_tickets | many | Mira service requests per pillar |
| services (old) | 46 | Pre-migration, OLD names — import PENDING user confirmation |
| service_catalog (old) | 97 | Pre-migration, OLD names — import PENDING user confirmation |

---

## 7. ADMIN PANEL ARCHITECTURE (Session 4 Fixes)

### Standard 7-Tab Structure (All 12 Pillar Managers)
1. **Requests** — Live `service_desk_tickets` filtered by pillar
2. **Partners** — Placeholder (coming soon)
3. **Products** — `PillarProductsTab` → 20/page pagination, createTrigger prop
4. **Services** — `PillarServicesTab` → inline Add Service modal, createTrigger prop
5. **Bundles** — `PillarBundlesTab` → createTrigger prop
6. **Tips** — Placeholder (coming soon)
7. **Settings** — Pillar metadata

### Quick Add Dropdown (PillarManager — Go + Play)
- Purple button in manager header
- "Quick Add" → "+ Add Product" / "+ Add Service" / "+ Add Bundle"
- Switches tab AND triggers create modal simultaneously

### ProductBoxEditor Save Fix
Previously missing from `allowedFields` (now fixed):
- `pillar` — primary pillar
- `approval_status` — Status in Pillar
- `commerce_ops` — pricing, margin, approval  
- `basics` — nested product metadata
- `pillars_occasions` — secondary pillars + occasions
- `breed`, `life_stage`, `pet_size` — Mira AI filtering
- `sub_category`, `allergens`, `soul_tier`

---

## 8. MIRA AI

### useMiraFilter.js
- **Allergy blocking**: Products with allergens matching pet's allergies are deprioritized
- **Breed matching**: +2 miraRank for breed-tagged products
- **Size matching**: +1 for correct size category
- **Life-stage matching**: +1 for puppy/adult/senior
- **Favorite foods**: Matched against ALLERGEN_MAP synonyms

### Mira "Explains Why" (User-approved — NOT YET BUILT)
One-tap expandable row on Dine/Care/Celebrate product cards showing full soul profile reasoning.

---

## 9. PENDING TASKS (Priority for next session)

### P0 — Audit Actions (User-approved)
1. Count language removal — audit complete, user approved removal across all mobile pages
2. Services Mobile page copy — remove "1,025 services across 7 categories" + premium copy
3. Side menu: Clarify "Pet Soul™" route (currently duplicates Pet Home) + Ask Mira → widget or page?

### P0 — Next Session
1. Celebrate mobile parity: BirthdayCountdown, SoulCelebrationPillars, CelebrationMemoryWall, MiraSoulNudge
2. "Mira explains why" expandable row on product cards (user-approved)
3. Watch & Learn YouTube sections (Care + Go)

### P1 — Post-mobile parity
1. Services import: 143 old services → services_master (await user confirmation)
2. Admin "Add New" for Soul Products (Breed Products + Breed Cakes with AI)
3. Full mobile-desktop parity audit for Love, Fit, Groom pillars

### P2 — Future
1. Production DB (Atlas IP whitelist)
2. Refactor Admin.jsx (7k lines)
3. Refactor server.py (24k lines)
4. Build Love pillar

---

## 10. COMPLETED IN SESSION 8 (2026-03-26)
1. ✅ Audit 1 (Dashboard) + Audit 2 (Communications) delivered to user
2. ✅ Fix a: Mira Notifications datetime bug resolved — now returns success:True with 20 notifications
3. ✅ Fix b: Paw Points Leaderboard endpoint added (`/api/paw-points/leaderboard`)
4. ✅ Fix c: Badges endpoint added (`/api/paw-points/my-badges`) — returns 6 earned badges
5. ✅ Fix d: WhatsApp Daily Digest — sends to 14/15 members via Gupshup
6. ✅ Fix e: Birthday Reminders — 7-day + day-of triggers via WhatsApp + Resend
7. ✅ Fix f: Medication Reminders — daily WhatsApp if meds logged in vault
8. ✅ Dashboard Fix 1: Tier mismatch resolved — Gold Crown shows for 2583 pts (threshold 1500)
9. ✅ Dashboard Fix 2: Badges section added below Pet Life Pass card
10. ✅ Dashboard Fix 3: Notification bell fixed to use correct API endpoint
11. ✅ Dashboard Fix 4: Full card view improved with QR code + tier progress bar
12. ✅ Care Mobile Fix 1: Health Vault tab added (4th tab with vaccines, meds, allergies, vet visits)
13. ✅ Care Mobile Fix 2: Grooming Profile card added
14. ✅ Care Mobile Fix 3: "Get Care Plan" opens Mira Imagines modal with 4 personalised cards
15. ✅ Admin automation trigger endpoints added (`/api/admin/automations/*`)

---

## 11. CRITICAL RULES (NEXT AGENT MUST READ)

1. **Desktop `*SoulPage.jsx` files are STRICTLY LOCKED** — never modify them
2. **Never modify server.py directly** — only add new route files
3. **PyMongo**: NEVER `if collection:` → always `if collection is not None:`
4. **MongoDB ObjectId**: Always exclude `_id` from responses
5. **AI Image Auth**: Pass `adminAuth` header, use `credentials: 'omit'`
6. **Soul Products**: `breed_products` → must be "Added to catalog" to appear on pillar pages
7. **Pillar IDs**: Use canonical lowercase IDs (celebrate, dine, go, care, play, learn, paperwork, emergency, farewell, adopt, shop, services)
8. **Hot Reload**: Only restart supervisor for .env changes or new packages
9. **Install packages**: Use `yarn add` for frontend, `pip install && pip freeze > requirements.txt` for backend
