# Mobile Wiring Specification — Complete Gap Analysis
## Last Updated: 2026-03-25

## Pattern (Reference: DineSoulPage.jsx v11)
Every mobile page follows this pattern:
```
1. Dark gradient hero (32px top padding for navbar clearance)
2. Pet photo + name + breed badge
3. Allergy chips
4. PillarSoulProfile (green-bordered soul questions)
5. Category strip (pills that open ContentModal)
6. TOP-LEVEL TABS (Eat & Nourish / Dine Out style)
7. Product grid (behind Mira bar as modal, or inline)
8. MiraImaginesBreed
9. PersonalisedBreedSection
10. GuidedPaths
11. ConciergeSection / NearMe
12. Soul Made card
13. ProductDetailModal on product tap
14. ContentModal on category pill tap
```

## DESKTOP → MOBILE WIRING INSTRUCTIONS PER PILLAR

---

### 1. DINE (DineSoulPage.jsx) — REFERENCE ✅
- **Status**: Complete (v11)
- **Tabs**: Eat & Nourish / Dine Out ✅
- **Pills**: DineCategoryStrip → opens DineContentModal ⚠️ NEEDS FIX — currently filters inline, should open modal
- **Products**: Full apiProducts grouped by category, SharedProductCard grid
- **Modals**: DineContentModal, ProductDetailModal, TummyProfile sheet
- **Intelligence**: applyMiraIntelligence ✅
- **soulScoreUpdated**: ✅

**FIX NEEDED**: DineCategoryStrip pill tap should open DineContentModal (like Celebrate pills open CelebrateContentModal). Currently line ~1000+ filters products inline instead.

---

### 2. CELEBRATE (CelebrateMobilePage.jsx) — MOSTLY COMPLETE ✅
- **Status**: 471 lines, well-wired
- **Tabs**: None (category pills serve as navigation) ✅
- **Pills**: CelebrateCategoryStrip → CelebrateContentModal ✅
- **Breed Cakes**: → DoggyBakeryCakeModal ✅
- **Birthday Box**: MiraBirthdayBox → BirthdayBoxBuilder (multi-step) ✅
- **Products**: Mira Picks in bottom sheet modal ✅
- **Browse**: BirthdayBoxBrowseDrawer ✅

**REMAINING**: None — this is the gold standard after Dine.

---

### 3. CARE (CareMobilePage.jsx) — NEEDS TABS + SERVICE FLOWS
- **Status**: 246 lines, products in Mira modal
- **Desktop tabs**: `dimTab` = products | personalised, `activeTab` = All | sub-categories
- **Desktop service flows**: 8 multi-step booking flows:
  1. Grooming (5 steps: breed→coat→comfort→services→confirm)
  2. Vet Visit (3 steps: type→symptoms→confirm)
  3. Boarding & Daycare (4 steps: dates→facility→meals→confirm)
  4. Pet Sitting (3 steps: dates→instructions→confirm)
  5. Dental Care (2 steps: issue→confirm)
  6. Rehabilitation (3 steps: condition→goals→confirm)
  7. Senior Care (3 steps: conditions→needs→confirm)
  8. Emergency Vet (2 steps: emergency→dispatch)

**MUST ADD TO MOBILE**:
```jsx
// Top tabs (Products / Personalised)
const [dimTab, setDimTab] = useState("products");
// Sub-category tabs within Products
const [activeTab, setActiveTab] = useState("All");
// Tab bar JSX (copy from desktop CareSoulPage lines 1126-1136)
// dimTab === "personalised" → <PersonalisedBreedSection>
// dimTab === "products" → product grid with sub-category filter
```
- **Category strip**: CareCategoryStrip → CareContentModal (wire onDimSelect)
- **Service flows**: Import and wire CareServiceModal or build inline multi-step forms

---

### 4. GO (GoMobilePage.jsx) — NEEDS TABS + SERVICE FLOWS
- **Status**: 191 lines, basic product grid
- **Desktop tabs**: `dimTab` = products | personalised, `activeTab` = All | sub-categories
- **Desktop service flows**: 8 booking flows (Pet Taxi, Travel Kit, Pet-Friendly Hotel, Pet Sitter, Travel Vet, Travel Insurance, Pet Passport, Pet Airlines)
- **Category strip**: GoCategoryStrip → GoContentModal ✅ wired

**MUST ADD**: Same tab structure as Care. Wire GoContentModal on pill tap.

---

### 5. PLAY (PlayMobilePage.jsx) — NEEDS TABS
- **Status**: 124 lines, basic product grid
- **Desktop tabs**: `dimTab` = products | personalised, `activeTab` = All | sub-categories
- **Category strip**: PlayCategoryStrip → PlayContentModal ✅ wired
- **Special**: BuddyMeetup component (social meetup feature)

**MUST ADD**: dimTab/activeTab tabs, BuddyMeetup section.

---

### 6. LEARN (LearnMobilePage.jsx) — NEEDS DIMENSION TABS + VIDEO TAB
- **Status**: 107 lines, basic product grid
- **Desktop structure**: 7 dimensions (Foundations, Behaviour, Training, Tricks, Health, Safety, Breed Guide). Each dimension has 3 sub-tabs: Products / Videos / Services
- **No category strip** on desktop — uses dimension pills instead

**MUST ADD**: 
- 7 dimension pills
- dimTab (Products / Videos / Services) within each dimension
- Video fetching + rendering
- Service cards per dimension

---

### 7. SHOP (ShopMobilePage.jsx) — MINIMAL GAPS
- **Status**: 103 lines, product grid with PersonalisedBreedSection
- **Desktop**: No top tabs, just product grid with breed filtering
- **No category strip**

**REMAINING**: Mostly complete. May want to add SoulMadeCollection.

---

### 8. SERVICES (ServicesMobilePage.jsx) — NEEDS SERVICE GROUPS
- **Status**: 74 lines (smallest mobile page)
- **Desktop structure**: 5 service groups, each with sub-services:
  1. Pamper & Groom (grooming, spa, coat care)
  2. Health & Vet (vet visits, dental, rehab)
  3. Train & Learn (training, behaviour, enrichment)
  4. Celebrate & Special (parties, photography, gifts)
  5. Travel & Paperwork (travel docs, pet taxi, insurance)

**MUST ADD**: 5 service group cards with expand/collapse, sub-service listings, booking CTAs.

---

### 9. ADOPT (AdoptMobilePage.jsx) — NEEDS 3 TABS
- **Status**: 87 lines
- **Desktop tabs**: 
  1. "Find Your Dog" — adoption listings
  2. "Book Guidance" — adoption services
  3. "Find Rescue" — nearby rescues/shelters

**MUST ADD**:
```jsx
const [activeTab, setActiveTab] = useState("adopt");
// Tab bar with 3 tabs
// activeTab==="adopt" → adoption content
// activeTab==="services" → service booking cards
// activeTab==="find" → NearMe rescue centers
```

---

### 10. FAREWELL (FarewellMobilePage.jsx) — NEEDS 3 TABS
- **Status**: 85 lines
- **Desktop tabs**:
  1. "Legacy & Memorial" — memorial products
  2. "Get Support" — grief services
  3. "Find Care" — nearby services

**MUST ADD**: Same 3-tab pattern as Adopt but with farewell-specific content.

---

### 11. EMERGENCY (EmergencyMobilePage.jsx) — NEEDS 3 TABS + SERVICE DISPATCH
- **Status**: 95 lines
- **Desktop tabs**:
  1. "Emergency Kit" — emergency products + dimTab (Products/Services)
  2. "Book Help" — emergency service booking
  3. "Find Vet" — nearby emergency vets

**MUST ADD**: 3 tabs + emergency service dispatch cards (within Products/Services sub-tabs).

---

### 12. PAPERWORK (PaperworkMobilePage.jsx) — NEEDS DIMENSION TABS
- **Status**: 91 lines
- **Desktop structure**: 7 dimensions (Identity & Safety, Health Records, Travel Documents, Insurance, Breeding, Legal, End of Life). Each dimension has 3 sub-tabs: Products / Services / Advisory
- **Special**: DocumentVault component

**MUST ADD**: Dimension pills + dimTab (Products/Services/Advisory) per dimension + DocumentVault.

---

## FONT SIZE REFERENCE (from Dine v11)
```
Hero pet name: fontSize:20, fontWeight:800
Hero subtitle: fontSize:13, color:rgba(255,255,255,0.7)
Hero breed badge: fontSize:11
Allergy chip: fontSize:11
Section heading: fontSize:18, fontWeight:700
Product card title: fontSize:13, fontWeight:600
Product card price: fontSize:12
Button CTA: fontSize:13, fontWeight:700
Mira bar text: fontSize:13
Tab button: fontSize:12-13
Sub-tab button: fontSize:11
Small accent: fontSize:10-11
```

## CUSTOMER-FACING PAGES NEEDING MOBILE AUDIT
1. /join — MiraMeetsYourPet.jsx (onboarding flow)
2. /login — Login.jsx
3. /register — Register.jsx
4. /forgot-password — ForgotPassword.jsx
5. /dashboard — MemberDashboard.jsx (tabs: Overview, Orders, Pets, Settings)
6. /checkout — Checkout.jsx
7. /my-pets — MyPets.jsx
8. /pet-home/:id — PetHomePage.jsx
9. /my-requests — MyRequestsPage.jsx
10. /cart — (part of Navbar/Checkout flow)
11. /search — SearchResults.jsx
12. /about — AboutPage.jsx
13. /faqs — FAQs.jsx
14. / — LandingPage.jsx (hero, pillars, CTA)
15. /pet-wrapped — PetWrappedViewer.jsx
16. /soul-builder — SoulBuilder.jsx
17. /notifications — NotificationsInbox.jsx

## IMPLEMENTATION ORDER (Recommended)
1. Adopt, Farewell, Emergency — simple 3-tab pattern (copy from desktop)
2. Care, Go, Play — dimTab + activeTab + sub-category filtering
3. Dine pills fix — open DineContentModal instead of filtering inline
4. Paperwork, Learn — dimension pills + 3 sub-tabs per dimension
5. Services — 5 service group cards
6. Customer-facing pages audit
7. Font size consistency pass across all pages
