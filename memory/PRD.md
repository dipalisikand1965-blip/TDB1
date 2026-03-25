# The Doggy Company — Product Requirements Document
## Last Updated: 2026-03-25 (Session 2 Complete)

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
**Preview URL:** `https://pillar-parity-sprint.preview.emergentagent.com`

---

## 4. CODE ARCHITECTURE

### Responsive Split Pattern (ALL 12 pillars)
```
PillarSoulPage.jsx (parent)
  ├── isDesktop check → window.innerWidth >= 1024
  ├── Desktop (>= 1024px) → renders original SoulPage JSX (LOCKED — never touch)
  └── Mobile (< 1024px) → renders *MobilePage.jsx
```

### Key Directories
```
/app/frontend/src/
  pages/
    *SoulPage.jsx        — Desktop pillar pages (LOCKED)
    *MobilePage.jsx      — Mobile pillar pages (active development)
  components/
    [pillar]/            — Pillar-specific components
    common/              — Shared components (MiraImaginesBreed, MiraImaginesCard, etc.)
    ui/                  — Shadcn UI components
  context/
    PillarContext.jsx    — currentPet, pets, setSoulData
    AuthContext.jsx      — token, user
    CartContext.jsx      — cart state
  utils/
    tdc_intent.js        — tdc.book(), tdc.request(), tdc.urgent()
    api.js               — API_URL
/app/backend/
  server.py              — Main FastAPI app (24k+ lines)
  whatsapp_notifications.py — Gupshup WA integration
  admin_routes.py        — Admin APIs
  mira_service_desk.py   — Service desk + ticket system
```

### Key Utility: tdc_intent.js
```js
tdc.book({ service, pillar, pet, notes, metadata, urgency, channel })
tdc.request(text, { pillar, channel, pet })
tdc.urgent({ text, pet, channel }) // → critical urgency
```

### Product Fetch Pattern (all mobile pages)
```js
fetch(`${API_URL}/api/admin/pillar-products?pillar=X&limit=200`)
→ filterBreedProducts(products, pet.breed)
→ applyMiraIntelligence(filtered, allergies, coat, condition)
→ render in SharedProductCard grid
```

### ProductCard Import (CONFIRMED CORRECT)
```js
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
// Default export is ProductCard, aliased as SharedProductCard — this IS correct
```

### Build Fix
```bash
GENERATE_SOURCEMAP=false NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## 5. DATABASE SCHEMA (MongoDB)

| Collection | Purpose |
|---|---|
| `users` | Member accounts |
| `pets` | Pet profiles (id, name, breed, allergies, soul_data, etc.) |
| `products_master` | All products + services (12 pillars) |
| `orders` | Order records |
| `service_desk_tickets` | All service/concierge requests |
| `services_master` | Service Box inventory |
| `sessions` | Auth sessions |

**Pet fields used for Mira Intelligence:**
- `breed`, `allergies`, `coat_type`, `health_condition`
- `soul_data`, `soul_score`, `personality`, `preferences`

---

## 6. KEY API ENDPOINTS

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login` | User login |
| `GET /api/pets` | Get user's pets |
| `GET /api/admin/pillar-products?pillar=X&limit=N` | Get products for a pillar |
| `GET /api/service-box/services?pillar=X&limit=N` | Get services for a pillar |
| `POST /api/service_desk/attach_or_create_ticket` | Create service ticket (tdc.book) |
| `POST /api/notifications/emergency-whatsapp` | Send emergency WA to concierge |
| `GET /api/test/youtube?query=X&max_results=N` | Fetch YouTube videos for Learn |
| `POST /api/admin/full-db-sync-export` | Export DB (BSON safe) |
| `POST /api/admin/full-db-sync-to-production` | Import to prod DB |

---

## 7. MOBILE PILLAR STATUS — CURRENT STATE (2026-03-25)

### COMPLETE ✅

| Pillar | Status | Key Features on Mobile |
|---|---|---|
| **Dine** | ✅ 95% | Eat & Nourish / Dine Out tabs, DineCategoryStrip (pills→modal internal), GuidedNutritionPaths, DineConciergeSection, MealBoxCard, applyMiraIntelligence |
| **Celebrate** | ✅ 98% | CelebrateCategoryStrip pills→modals, MiraBirthdayBox, BirthdayBoxBuilder (multi-step), CelebrateServiceGrid, GuidedCelebratePaths, CelebrateNearMe, PersonalisedBreedSection |
| **Shop** | ✅ 95% | DoggyBakerySection (filter chips), PersonalisedBreedSection, SoulMadeModal, MiraPicksSection |
| **Adopt** | ✅ 95% | 3 tabs (Find Your Dog/Book Guidance/Find Rescue), stage tracker, ADOPT_SERVICES cards, AdoptNearMe, MiraImaginesCard, MiraImaginesBreed, GuidedAdoptPaths |
| **Farewell** | ✅ 95% | 3 tabs (Legacy & Memorial/Get Support/Find Care), product sub-tabs, FAREWELL_SERVICES cards, FarewellNearMe, MiraImaginesCard, GuidedFarewellPaths, SoulMadeModal |
| **Emergency** | ✅ 98% | 3 tabs (Emergency Kit/Book Help/Find Vet), persistent URGENT CTA, WhatsApp alert to concierge, dimTab (Products/Services), EMERG_SERVICES, EmergencyNearMe |
| **Services** | ✅ 95% | 7 expandable service group cards (Pamper & Groom / Health & Vet / Train & Learn / Celebrate / Fitness & Walks / Travel & Paperwork / Life Events), lazy fetch per group, booking confirmation sheet |
| **Care** | ✅ 90% | 3 top tabs (Care & Products/Care Services/Find Care), dimTab (All Products/Personalised), sub-category pills, applyMiraIntelligence, CareConciergeSection, CareNearMe, MiraImaginesCard, SoulMadeModal |
| **Go** | ✅ 90% | 3 top tabs (Go & Products/Services/Stay), dimTab, sub-category pills, GoConciergeSection, PetFriendlyStays, MiraImaginesCard, SoulMadeModal |
| **Play** | ✅ 90% | 3 top tabs (Play & Products/Services/Find Play), dimTab, sub-category pills, BuddyMeetup, PlayConciergeSection, PlayNearMe, MiraImaginesCard, SoulMadeModal |
| **Learn** | ✅ 90% | 7 dimension pills (Foundations/Behaviour/Training/Tricks/Socialisation/Soul Learn/Mira's Picks), per-dim dimTab (Products/Videos/Book), YouTube video fetch, GuidedLearnPaths, MiraImaginesCard |
| **Paperwork** | ✅ 90% | DocumentVault at top, 7 dimension pills (Identity/Health/Travel/Insurance/Breeds/Advisory/Soul), per-dim dimTab (Products/Services/Advisory), GuidedPaperworkPaths, MiraImaginesCard, SoulMadeModal |

### NON-PILLAR PAGE STATUS (all 17 customer-facing pages)

| Page | Status | Notes |
|---|---|---|
| Landing `/` | ✅ Fixed | 5 className-in-style bugs fixed → responsive grids work |
| Login `/login` | ✅ Good | lg:hidden mobile section with portraits |
| Register `/register` | ✅ Fixed | Rewrote with dark theme matching Login |
| Dashboard `/dashboard` | ✅ Good | Scrollable tabs, sm: breakpoints |
| Join `/join` | ✅ Good | Mobile-first inline styles |
| Soul Builder `/soul-builder` | ✅ Good | Single-column layout |
| Pet Home `/pet-home` | ✅ Good | sm: breakpoints, scrollable pills |
| My Pets `/my-pets` | ✅ Good | sm:/md: Tailwind grid |
| My Requests `/my-requests` | ✅ Good | overflow-x auto for tabs |
| Checkout `/checkout` | ✅ Fixed | Order summary above form on mobile (CSS order-1/order-2) |
| Search `/search` | ✅ Good | Responsive grid 2→4 cols |
| About `/about` | ✅ Good | clamp() fluid typography |
| FAQs `/faqs` | ✅ Good | Tailwind responsive |
| Notifications `/notifications` | ✅ Good | Smart split view: list on mobile, thread on desktop |
| Membership `/membership` | ✅ Fixed | Pricing card padding → clamp(20px,5vw,48px) |
| Forgot/Reset Password | ✅ Good | Simple Shadcn cards |

---

## 8. REMAINING GAPS — MOBILE PILLAR PARITY

### Cross-Pillar Gaps (affect all/most pillars)

| Gap | Pillars Affected | Priority | Effort |
|---|---|---|---|
| **MiraPicksSection** (AI-curated horizontal scroll) | All 12 | P1 | Medium — inline function per page |
| **WellnessProfile / TripProfile / ActivityProfile** | Care, Go, Play | P1 | Medium — inline widgets in desktop |
| **AdoptProfile / FarewellProfile / EmergencyProfile** | Adopt, Farewell, Emergency | P1 | Low — compact tracker widgets |
| **LearnProfile / LearnNearMe** | Learn | P1 | Low — component file exists |
| **PaperworkNearMe** | Paperwork | P1 | Low — component file exists |

### Celebrate-Specific Gaps

| Gap | Priority |
|---|---|
| **SoulCelebrationPillars** (6 celebration-type cards) | P1 |
| **CelebrationMemoryWall** (past celebrations) | P2 |
| **MiraSoulNudge** (contextual AI tip card) | P2 |

### Shop-Specific Gaps

| Gap | Priority |
|---|---|
| **BreedCollectionSection** (browse by breed) | P1 |
| **ShopBrowseSection** (category browse tabs) | P1 |

### Multi-Step Booking Modals

| Gap | Pillars | Priority |
|---|---|---|
| **ServiceBookingModal** (full multi-step flow) | Care, Go, Play, Paperwork | P2 (ConciergeSection is functional equivalent) |

---

## 9. FEATURE BACKLOG

### P0 — Critical (none remaining after this session)
All P0 mobile parity work is complete.

### P1 — High Priority
- Add MiraPicksSection to all 12 pillar mobile pages
- Add LearnNearMe to Learn mobile
- Add PaperworkNearMe to Paperwork mobile
- Add SoulCelebrationPillars to Celebrate mobile
- Add Wellness/Trip/Activity profile widgets to Care/Go/Play
- Add BreedCollectionSection + ShopBrowseSection to Shop mobile

### P2 — Medium Priority
- 38 products with wrong AI images → deactivate or regenerate
- Production DB migration (blocked by Atlas network access)
- CelebrationMemoryWall, MiraSoulNudge
- ServiceBookingModal full multi-step flow on mobile
- Admin.jsx refactor (~7000 lines → modular)
- WhatsApp Daily Digest cron job
- Love pillar build

### P3 — Future / Nice-to-Have
- Admin tab performance (Inbox, Finance, Dashboard >3s)
- Font size audit across mobile pages
- Dark theme consistency pass
- Multi-pet switching performance
- K9 Sports / Agility section on Play

---

## 10. IMPORTANT KNOWN ISSUES

1. **38 wrong-image products**: `needs_ai_image: true` in DB. Use admin "AI IMAGES" tool to regenerate.
2. **Production DB**: Direct MongoDB Atlas connection blocked. Use platform "Use new database" deploy option or HTTPS sync tool (`/api/admin/full-db-sync-export`).
3. **Admin.jsx**: 7000+ line file. Significant tech debt. Tabs > 3s load time.
4. **Stale Celebrate service records**: Shadow records exist in products_master.
5. **Build memory**: Always use `GENERATE_SOURCEMAP=false NODE_OPTIONS="--max-old-space-size=4096"` for production builds.

---

## 11. EMERGENCY WHATSAPP INTEGRATION

**Endpoint:** `POST /api/notifications/emergency-whatsapp`
**Concierge number:** 919739908844
**Triggered by:** Emergency mobile page URGENT button
**Behavior:**
1. Sends WhatsApp via Gupshup with pet name, breed, allergies, urgency
2. Creates `service_desk_tickets` entry with `urgency: "critical"`
3. Shows green "✓ Concierge notified via WhatsApp" in confirmation sheet

---

## 12. HANDOVER NOTES FOR NEXT AGENT

1. **Desktop pages are LOCKED** — never modify `*SoulPage.jsx` files
2. **All new work goes in `*MobilePage.jsx` files only**
3. **Import pattern** — `import SharedProductCard, { ProductDetailModal } from '../components/ProductCard'` is correct (default export aliased as SharedProductCard)
4. **Build** — always use `GENERATE_SOURCEMAP=false NODE_OPTIONS="--max-old-space-size=4096" npm run build`
5. **tdc.book()** is the universal service booking function — use it everywhere
6. **Product filtering** — `filterBreedProducts` + `applyMiraIntelligence` — ALWAYS apply both
7. **MiraPicksSection** is defined INLINE in each desktop page — it's not a separate file to import
8. **MOBILE_WIRING_SPEC.md** is the source of truth for what's still needed
