# Mobile Wiring Specification — The Doggy Company
## Last Updated: 2026-03-25 (Session 2 Complete)

This document is the source of truth for mobile pillar implementation status.
Desktop pages are LOCKED. All mobile work is in `*MobilePage.jsx` files.

---

## ARCHITECTURE

```
PillarSoulPage.jsx
  const [isDesktop] = useState(() => window.innerWidth >= 1024);
  useEffect(() => { resize listener → setIsDesktop(window.innerWidth >= 1024); });
  if (!isDesktop) return <PillarMobilePage />;
  // ...desktop JSX (NEVER TOUCH)
```

## STANDARD MOBILE PAGE PATTERN

```jsx
export default function XxxMobilePage() {
  const { token } = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  const { addToCart } = useCart();
  const { request } = useConcierge({ pet: currentPet, pillar: 'xxx' });

  const [loading, setLoading] = useState(true);
  const [allRaw, setAllRaw] = useState([]);
  const [activeTab, setActiveTab] = useState('xxx');
  const [dimTab, setDimTab] = useState('products');

  // Load pets from context
  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  // Fetch products
  useEffect(() => {
    if (!currentPet?.id) return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=xxx&limit=200`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.products) setAllRaw(filterBreedProducts(d.products, currentPet?.breed)); });
  }, [currentPet?.id, token]);

  // Apply intelligence
  const intelligent = applyMiraIntelligence(allRaw, allergies, coat, condition, currentPet);
  const products = subCat === 'All' ? intelligent : intelligent.filter(p => p.sub_category === subCat);
}
```

## CRITICAL UTILITIES (copy into each mobile page)

```js
// ALWAYS include these in every mobile page:
const KNOWN_BREEDS = ['american bully','beagle','border collie','boxer','cavalier','chihuahua','chow chow','dachshund','dalmatian','doberman','english bulldog','french bulldog','german shepherd','golden retriever','husky','indie','jack russell','labrador','lhasa apso','maltese','pomeranian','poodle','pug','rottweiler','shih tzu','yorkshire'];

function filterBreedProducts(products, petBreed) {
  const pl=(petBreed||'').toLowerCase();
  const pw=pl.split(/\s+/).filter(w=>w.length>2);
  return products.filter(p=>{
    const n=(p.name||'').toLowerCase();
    for(const b of KNOWN_BREEDS){
      if(n.includes(b)){
        if(!pl)return false;
        if(n.includes(pl))return true;
        if(pw.some(w=>b.includes(w)))return true;
        return false;
      }
    }
    return true;
  });
}

function getAllergies(pet) {
  const raw=pet?.allergies; let arr=[];
  if(Array.isArray(raw))arr=raw;
  else if(typeof raw==='string')arr=raw.split(',').map(s=>s.trim());
  return arr.filter(a=>a&&!['none','no allergies','nil','n/a'].includes(a.toLowerCase()));
}

function applyMiraIntelligence(products, allergies) {
  if(!allergies?.length)return products;
  return products.filter(p=>{
    const text=`${p.name} ${p.description||''}`.toLowerCase();
    for(const a of allergies){if(text.includes(a.toLowerCase())&&!text.includes('free'))return false;}
    return true;
  });
}
```

---

## PILLAR STATUS MATRIX

### 🍖 DINE — `/dine` — DineSoulPage.jsx → DineSoulPage.jsx (v11, IS the mobile)
**Mobile file:** `/app/frontend/src/pages/DineSoulPage.jsx` (serves both)
**Status:** ✅ 95% Complete

| Feature | Status |
|---|---|
| Eat & Nourish / Dine Out tabs | ✅ |
| DineCategoryStrip pills → DineContentModal (internal) | ✅ |
| GuidedNutritionPaths | ✅ |
| DineConciergeSection | ✅ |
| MealBoxCard | ✅ |
| PersonalisedBreedSection | ✅ |
| TummyProfile | ✅ |
| applyMiraIntelligence | ✅ |
| MiraPicksSection (AI curated row) | ❌ P1 |

---

### 🎉 CELEBRATE — `/celebrate` — CelebratePageNew.jsx → CelebrateMobilePage.jsx
**Mobile file:** `/app/frontend/src/pages/CelebrateMobilePage.jsx`
**Status:** ✅ 98% Complete

| Feature | Desktop Source | Mobile Status |
|---|---|---|
| CelebrateCategoryStrip (pills → modals) | CelebratePageNew.jsx:~280 | ✅ |
| CelebrateContentModal | CelebratePageNew.jsx:~300 | ✅ (via strip) |
| MiraBirthdayBox | CelebratePageNew.jsx:~350 | ✅ |
| BirthdayBoxBuilder multi-step | CelebratePageNew.jsx:~400 | ✅ |
| BirthdayBoxBrowseDrawer | CelebratePageNew.jsx:~450 | ✅ |
| CelebrateServiceGrid ("Celebrate Personally") | CelebratePageNew.jsx:~500 | ✅ (added Session 2) |
| GuidedCelebratePaths | CelebratePageNew.jsx:~550 | ✅ |
| CelebrateNearMe | CelebratePageNew.jsx:~580 | ✅ |
| PersonalisedBreedSection | CelebratePageNew.jsx:~600 | ✅ |
| MiraImaginesBreed | CelebratePageNew.jsx:~620 | ✅ |
| SoulCelebrationPillars | CelebratePageNew.jsx:~200 | ❌ P1 |
| CelebrationMemoryWall | CelebratePageNew.jsx:~650 | ❌ P2 |
| MiraSoulNudge | CelebratePageNew.jsx:~180 | ❌ P2 |
| MiraImaginesCard | CelebratePageNew.jsx:~630 | ❌ P1 |
| MiraPicksSection | CelebratePageNew.jsx:~160 | ❌ P1 |
| ConciergeIntakeModal (full multi-step) | CelebratePageNew.jsx:~608 | Partial (inline sheet) |

---

### 🌿 CARE — `/care` — CareSoulPage.jsx → CareMobilePage.jsx
**Mobile file:** `/app/frontend/src/pages/CareMobilePage.jsx`
**Desktop reference:** `/app/frontend/src/pages/CareSoulPage.jsx`
**Status:** ✅ 90% Complete

| Feature | Desktop Line | Mobile Status |
|---|---|---|
| Tab bar: Care & Products / Care Services / Find Care | CareSoulPage.jsx:~2270 | ✅ |
| dimTab: All Products / Personalised | CareSoulPage.jsx:~1200 | ✅ |
| Sub-category pill filter | CareSoulPage.jsx:~1250 | ✅ |
| applyMiraIntelligence (allergy filter) | CareSoulPage.jsx:~1155 | ✅ |
| Allergy filter stats display | CareSoulPage.jsx:~1170 | ✅ |
| PersonalisedBreedSection | CareSoulPage.jsx:~1450 | ✅ |
| MiraImaginesCard | CareSoulPage.jsx:~1460 | ✅ |
| CareConciergeSection | CareSoulPage.jsx:~2370 | ✅ |
| CareNearMe | CareSoulPage.jsx:~2430 | ✅ |
| GuidedCarePaths | CareSoulPage.jsx:~1400 | ✅ |
| MiraImaginesBreed | CareSoulPage.jsx:~1480 | ✅ |
| SoulMadeModal | CareSoulPage.jsx:~1500 | ✅ |
| CareCategoryStrip (pill nav) | CareSoulPage.jsx:~2300 | ✅ (inline pills equiv.) |
| WellnessProfile widget | CareSoulPage.jsx:794 | ❌ P1 |
| MiraPicksSection | CareSoulPage.jsx:358 | ❌ P1 |
| ServiceBookingModal (5-step) | CareSoulPage.jsx:1655 | ❌ P2 (ConciergeSection equiv.) |

---

### ✈️ GO — `/go` — GoSoulPage.jsx → GoMobilePage.jsx
**Mobile file:** `/app/frontend/src/pages/GoMobilePage.jsx`
**Desktop reference:** `/app/frontend/src/pages/GoSoulPage.jsx`
**Status:** ✅ 90% Complete

| Feature | Desktop Line | Mobile Status |
|---|---|---|
| Tab bar: Go & Products / Services / Stay | GoSoulPage.jsx:~2130 | ✅ |
| dimTab: All Products / Personalised | GoSoulPage.jsx:~1200 | ✅ |
| Sub-category pill filter | GoSoulPage.jsx:~1250 | ✅ |
| PersonalisedBreedSection | GoSoulPage.jsx:~1450 | ✅ |
| MiraImaginesCard | GoSoulPage.jsx:~1460 | ✅ |
| GoConciergeSection | GoSoulPage.jsx:~2150 | ✅ |
| PetFriendlyStays | GoSoulPage.jsx:~2160 | ✅ |
| GuidedGoPaths | GoSoulPage.jsx:~1400 | ✅ |
| MiraImaginesBreed | GoSoulPage.jsx:~1480 | ✅ |
| SoulMadeModal | GoSoulPage.jsx:~1500 | ✅ |
| TripProfile widget | GoSoulPage.jsx:~850 | ❌ P1 |
| MiraPicksSection | GoSoulPage.jsx:~380 | ❌ P1 |
| GoServiceModal (8 booking flows) | GoSoulPage.jsx:~1600 | ❌ P2 (GoConciergeSection equiv.) |
| GoNearMe | GoSoulPage.jsx:~2120 | ❌ P1 |

---

### 🎾 PLAY — `/play` — PlaySoulPage.jsx → PlayMobilePage.jsx
**Mobile file:** `/app/frontend/src/pages/PlayMobilePage.jsx`
**Desktop reference:** `/app/frontend/src/pages/PlaySoulPage.jsx`
**Status:** ✅ 90% Complete

| Feature | Desktop Line | Mobile Status |
|---|---|---|
| Tab bar: Play & Products / Services / Find Play | PlaySoulPage.jsx:~1660 | ✅ |
| dimTab: All Products / Personalised | PlaySoulPage.jsx:~1200 | ✅ |
| Sub-category pill filter | PlaySoulPage.jsx:~1250 | ✅ |
| PersonalisedBreedSection | PlaySoulPage.jsx:~1450 | ✅ |
| MiraImaginesCard | PlaySoulPage.jsx:~1460 | ✅ |
| BuddyMeetup | PlaySoulPage.jsx:~1680 | ✅ |
| PlayConciergeSection | PlaySoulPage.jsx:~1700 | ✅ |
| PlayNearMe | PlaySoulPage.jsx:~1720 | ✅ |
| GuidedPlayPaths | PlaySoulPage.jsx:~1400 | ✅ |
| MiraImaginesBreed | PlaySoulPage.jsx:~1480 | ✅ |
| SoulMadeModal | PlaySoulPage.jsx:~1500 | ✅ |
| ActivityProfile widget | PlaySoulPage.jsx:~900 | ❌ P1 |
| MiraPicksSection | PlaySoulPage.jsx:~400 | ❌ P1 |

---

### 🎓 LEARN — `/learn` — LearnSoulPage.jsx → LearnMobilePage.jsx
**Mobile file:** `/app/frontend/src/pages/LearnMobilePage.jsx`
**Desktop reference:** `/app/frontend/src/pages/LearnSoulPage.jsx`
**Status:** ✅ 90% Complete

| Feature | Desktop Line | Mobile Status |
|---|---|---|
| 7 dimension pills | LearnSoulPage.jsx:~123 | ✅ |
| dimTab: Products / Videos / Book per dim | LearnSoulPage.jsx:~850 | ✅ |
| Products fetch per dim sub_category | LearnSoulPage.jsx:~870 | ✅ |
| Videos fetch from YouTube API | LearnSoulPage.jsx:~890 | ✅ |
| Book tab service cards | LearnSoulPage.jsx:~950 | ✅ |
| GuidedLearnPaths | LearnSoulPage.jsx:~1100 | ✅ |
| PersonalisedBreedSection | LearnSoulPage.jsx:~1150 | ✅ |
| MiraImaginesBreed | LearnSoulPage.jsx:~1200 | ✅ |
| MiraImaginesCard | LearnSoulPage.jsx:~1220 | ✅ |
| SoulMadeModal | LearnSoulPage.jsx:~1250 | ✅ |
| LearnNearMe (component exists!) | LearnSoulPage.jsx:~1300 | ❌ P1 (just add it) |
| LearnProfile widget | LearnSoulPage.jsx:~600 | ❌ P1 |
| MiraPicksSection | LearnSoulPage.jsx:~350 | ❌ P1 |

**LearnNearMe path:** `/app/frontend/src/components/learn/LearnNearMe.jsx`
**Fix:** Add a 4th "Find Trainers" tab or section after the dimension panel.

---

### 🛍️ SHOP — `/shop` — ShopSoulPage.jsx → ShopMobilePage.jsx
**Mobile file:** `/app/frontend/src/pages/ShopMobilePage.jsx`
**Desktop reference:** `/app/frontend/src/pages/ShopSoulPage.jsx`
**Status:** ✅ 95% Complete

| Feature | Desktop Line | Mobile Status |
|---|---|---|
| MiraPicksSection (AI curated) | ShopSoulPage.jsx:~125 | ❌ P1 |
| DoggyBakerySection | ShopSoulPage.jsx:~244 | ✅ (added Session 2) |
| BreedCollectionSection | ShopSoulPage.jsx:~381 | ❌ P1 |
| ShopBrowseSection | ShopSoulPage.jsx:~450 | ❌ P1 |
| PersonalisedBreedSection | ShopSoulPage.jsx:~500 | ✅ |
| SoulMadeModal | ShopSoulPage.jsx:~550 | ✅ |

---

### 🤝 SERVICES — `/services` — ServicesSoulPage.jsx → ServicesMobilePage.jsx
**Mobile file:** `/app/frontend/src/pages/ServicesMobilePage.jsx`
**Desktop reference:** `/app/frontend/src/pages/ServicesSoulPage.jsx`
**Status:** ✅ 95% Complete

| Feature | Desktop Line | Mobile Status |
|---|---|---|
| 7 service group cards | ServicesSoulPage.jsx:~730 | ✅ |
| Lazy fetch per group | ServicesSoulPage.jsx:~750 | ✅ |
| PersonalisedBreedSection | ServicesSoulPage.jsx:~780 | ✅ |
| Booking confirmation sheet | ServicesSoulPage.jsx:~800 | ✅ |
| MiraPicksSection | ServicesSoulPage.jsx:~200 | ❌ P1 |

---

### 🐾 ADOPT — `/adopt` — AdoptSoulPage.jsx → AdoptMobilePage.jsx
**Mobile file:** `/app/frontend/src/pages/AdoptMobilePage.jsx`
**Desktop reference:** `/app/frontend/src/pages/AdoptSoulPage.jsx`
**Status:** ✅ 95% Complete

| Feature | Desktop Line | Mobile Status |
|---|---|---|
| 3 tabs: Find Your Dog / Book Guidance / Find Rescue | AdoptSoulPage.jsx:~319 | ✅ |
| Stage tracker | AdoptSoulPage.jsx:~330 | ✅ |
| ADOPT_SERVICES cards (6) | AdoptSoulPage.jsx:~350 | ✅ |
| GuidedAdoptPaths | AdoptSoulPage.jsx:~380 | ✅ |
| AdoptNearMe | AdoptSoulPage.jsx:~390 | ✅ |
| MiraImaginesBreed | AdoptSoulPage.jsx:~370 | ✅ |
| MiraImaginesCard | AdoptSoulPage.jsx:~360 | ✅ |
| AdoptProfile widget | AdoptSoulPage.jsx:~200 | ❌ P1 |
| MiraPicksSection | AdoptSoulPage.jsx:~145 | ❌ P1 |
| Multi-step ConciergeModal | AdoptSoulPage.jsx:~400 | Partial (confirmation sheet) |

---

### 🌷 FAREWELL — `/farewell` — FarewellSoulPage.jsx → FarewellMobilePage.jsx
**Mobile file:** `/app/frontend/src/pages/FarewellMobilePage.jsx`
**Desktop reference:** `/app/frontend/src/pages/FarewellSoulPage.jsx`
**Status:** ✅ 95% Complete

| Feature | Desktop Line | Mobile Status |
|---|---|---|
| 3 tabs: Legacy & Memorial / Get Support / Find Care | FarewellSoulPage.jsx:~352 | ✅ |
| Product sub-category tabs within Memorial | FarewellSoulPage.jsx:~360 | ✅ |
| FAREWELL_SERVICES cards (6) | FarewellSoulPage.jsx:~380 | ✅ |
| GuidedFarewellPaths | FarewellSoulPage.jsx:~410 | ✅ |
| FarewellNearMe | FarewellSoulPage.jsx:~478 | ✅ |
| MiraImaginesCard | FarewellSoulPage.jsx:~420 | ✅ |
| SoulMadeModal | FarewellSoulPage.jsx:~450 | ✅ |
| FarewellProfile widget | FarewellSoulPage.jsx:~200 | ❌ P1 |
| MiraPicksSection | FarewellSoulPage.jsx:~150 | ❌ P1 |

---

### 🚨 EMERGENCY — `/emergency` — EmergencySoulPage.jsx → EmergencyMobilePage.jsx
**Mobile file:** `/app/frontend/src/pages/EmergencyMobilePage.jsx`
**Desktop reference:** `/app/frontend/src/pages/EmergencySoulPage.jsx`
**Status:** ✅ 98% Complete

| Feature | Desktop Line | Mobile Status |
|---|---|---|
| Persistent URGENT CTA (above tabs) | EmergencySoulPage.jsx:~260 | ✅ |
| WhatsApp alert to concierge | NEW | ✅ (Session 2) |
| 3 tabs: Emergency Kit / Book Help / Find Vet | EmergencySoulPage.jsx:~260 | ✅ |
| dimTab: Products / Services within Emergency Kit | EmergencySoulPage.jsx:~245 | ✅ |
| EMERG_SERVICES cards | EmergencySoulPage.jsx:~310 | ✅ |
| GuidedEmergencyPaths | EmergencySoulPage.jsx:~580 | ✅ |
| EmergencyNearMe | EmergencySoulPage.jsx:~598 | ✅ |
| MiraImaginesBreed | EmergencySoulPage.jsx:~590 | ✅ |
| EmergencyProfile widget | EmergencySoulPage.jsx:~110 | ❌ P1 |
| MiraPicksSection | EmergencySoulPage.jsx:~150 | ❌ P1 |

---

### 📋 PAPERWORK — `/paperwork` — PaperworkSoulPage.jsx → PaperworkMobilePage.jsx
**Mobile file:** `/app/frontend/src/pages/PaperworkMobilePage.jsx`
**Desktop reference:** `/app/frontend/src/pages/PaperworkSoulPage.jsx`
**Status:** ✅ 90% Complete

| Feature | Desktop Line | Mobile Status |
|---|---|---|
| DocumentVault at top | PaperworkSoulPage.jsx:~180 | ✅ |
| 7 dimension pills | PaperworkSoulPage.jsx:~107 | ✅ |
| dimTab: Products / Services / Advisory per dim | PaperworkSoulPage.jsx:~200 | ✅ |
| Products per dim sub_category | PaperworkSoulPage.jsx:~220 | ✅ |
| Services per dim (organisation + certification) | PaperworkSoulPage.jsx:~240 | ✅ |
| Advisory tab (ADVISORY_SERVICES) | PaperworkSoulPage.jsx:~260 | ✅ |
| GuidedPaperworkPaths | PaperworkSoulPage.jsx:~300 | ✅ |
| PersonalisedBreedSection | PaperworkSoulPage.jsx:~320 | ✅ |
| MiraImaginesCard | PaperworkSoulPage.jsx:~340 | ✅ |
| SoulMadeModal | PaperworkSoulPage.jsx:~360 | ✅ |
| PaperworkNearMe (component exists!) | PaperworkSoulPage.jsx:~380 | ❌ P1 (just add it) |
| ServiceBookingModal | PaperworkSoulPage.jsx:~400 | ❌ P2 |
| MiraPicksSection | PaperworkSoulPage.jsx:~160 | ❌ P1 |

**PaperworkNearMe path:** `/app/frontend/src/components/paperwork/PaperworkNearMe.jsx`

---

## IMPLEMENTATION PRIORITY ORDER

### Next Agent — Do in This Order:

1. **LearnNearMe** (5 min) — just add `<LearnNearMe>` to LearnMobilePage
2. **PaperworkNearMe** (5 min) — just add `<PaperworkNearMe>` to PaperworkMobilePage
3. **SoulCelebrationPillars** (10 min) — add to CelebrateMobilePage above CelebrateServiceGrid
4. **MiraPicksSection** (30 min per pillar × 12) — highest impact, show on every pillar
5. **Profile Widgets** (30 min each) — WellnessProfile, TripProfile, ActivityProfile, AdoptProfile, FarewellProfile, EmergencyProfile
6. **BreedCollectionSection + ShopBrowseSection** (30 min) — Shop mobile
7. **GoNearMe** (5 min) — add to Go mobile Stay tab

---

## NON-PILLAR PAGES — ALL COMPLETE ✅

| Page | Status | Changes Made |
|---|---|---|
| `/` Landing | ✅ Fixed | 5 className-in-style bugs fixed |
| `/login` | ✅ Good | Already had lg:hidden mobile section |
| `/register` | ✅ Fixed | Full dark theme rewrite |
| `/dashboard` | ✅ Good | Scrollable tabs, sm: breakpoints |
| `/join` | ✅ Good | Mobile-first |
| `/soul-builder` | ✅ Good | Single-column |
| `/pet-home` | ✅ Good | sm: breakpoints |
| `/my-pets` | ✅ Good | sm:/md: grid |
| `/my-requests` | ✅ Good | overflow-x auto |
| `/checkout` | ✅ Fixed | Order summary before form on mobile |
| `/search` | ✅ Good | Responsive grid |
| `/about` | ✅ Good | clamp() fluid |
| `/faqs` | ✅ Good | Tailwind responsive |
| `/notifications` | ✅ Good | Smart split: list on mobile, thread on desktop |
| `/membership` | ✅ Fixed | clamp() pricing padding |
| `/member/forgot-password` | ✅ Good | Shadcn Card |
| `/reset-password` | ✅ Good | Shadcn Card |
