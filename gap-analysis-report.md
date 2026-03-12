# CMS PATTERN GAP ANALYSIS - ALL 14 PILLARS
## Comparing Against LEARN Page (Gold Standard)

---

## LEARN PAGE HIERARCHY (GOLD STANDARD)

```
1. HERO SECTION: Ask Mira Bar (CMS DRIVEN)
   - Title with {petName} placeholder
   - Search input with CMS placeholder
   - Button with CMS color

2. TOPIC BOXES (12 topic cards, CMS DRIVEN)
   - Grid layout
   - AI images
   - Opens LearnTopicModal (Overview | Videos | Products | Services)
   
3. DAILY LEARNING TIP (CMS DRIVEN)
   - Rotates based on day
   - Category icons

4. HOW CAN WE HELP? (3 Action Buckets, CMS DRIVEN)
   - Opens Mira chat with context
   
5. LEARN FOR MY DOG (Personalized)
   - Pet photo
   - Expandable tips based on age/breed
   - Mira's advice when expanded
   
6. BREED SPOTLIGHT + WEATHER ALERT
   - Dynamic breed facts
   - Weather-based tips
   
7. GUIDED LEARNING PATHS
   - 6 structured journeys
   - Step-by-step cards
   
8. CURATED BUNDLES
   - CuratedBundles component
   
9. TRAINING PRODUCTS SECTION
   - TrainingProductsSection component
   
10. RECOMMENDED FOR PET (Personalized Tags)

11. QUICK LINKS & RESOURCES

12. SERVICES THAT HELP

13. TRAINING REQUEST FORM
```

---

## GAP ANALYSIS BY PILLAR

### 1. LEARN ✅ COMPLETE (Reference Standard)
- All sections CMS-driven
- LearnTopicModal with tabs
- Full personalization
- **STATUS: GOLD STANDARD**

---

### 2. PAPERWORK ✅ MOSTLY COMPLETE
**Has:**
- CMS config fetching
- Topic cards with modal
- Categories
- Products & Bundles

**Missing:**
- [ ] Daily tip section
- [ ] How can we help buckets
- [ ] Guided paths
- [ ] Weather-based tips

---

### 3. DINE ❌ SIGNIFICANT GAPS
**Has:**
- PillarTopicsGrid added
- Tab navigation
- TummyProfileDashboard (custom)
- Multiple product sections

**Missing:**
- [ ] NO Ask Mira bar at top
- [ ] NO "How can we help" buckets
- [ ] NO Daily tip
- [ ] NO Guided paths
- [ ] NO Breed spotlight
- [ ] NO Weather tip
- [ ] Topic cards NOT opening consistent modal (uses generic PillarTopicModal, needs Dine-specific content)
- [ ] CMS sections not conditional (no `cmsConfig.sections?.xxx.enabled`)

**Issues:**
- Section order is chaotic
- Mixed conditional rendering patterns
- No CMS-driven section toggles

---

### 4. CARE ❌ SIGNIFICANT GAPS
**Has:**
- PillarTopicsGrid added
- MiraCarePlan component
- PersonalizedPicks
- BreedSmartRecommendations

**Missing:**
- [ ] NO Ask Mira bar at top
- [ ] NO "How can we help" buckets
- [ ] NO Daily tip
- [ ] NO Guided paths (like "Grooming Path", "Health Path")
- [ ] NO Breed spotlight
- [ ] CMS sections not conditional

---

### 5. FIT ❌ SIGNIFICANT GAPS
**Has:**
- PillarTopicsGrid added
- Exercise recommendations
- Some personalization

**Missing:**
- [ ] NO Ask Mira bar at top
- [ ] NO "How can we help" buckets
- [ ] NO Daily tip
- [ ] NO Guided paths ("Weight Loss Path", "Agility Path")
- [ ] NO Breed spotlight
- [ ] CMS sections not conditional

---

### 6. TRAVEL ❌ SIGNIFICANT GAPS
**Has:**
- PillarTopicsGrid added
- Travel checklist
- Some services

**Missing:**
- [ ] NO Ask Mira bar at top
- [ ] NO "How can we help" buckets
- [ ] NO Daily tip
- [ ] NO Guided paths ("Road Trip Path", "Flying Path")
- [ ] NO Weather tip (critical for travel!)
- [ ] CMS sections not conditional

---

### 7. STAY ✅ PARTIAL (Better than most)
**Has:**
- PillarTopicsGrid added
- CMS config with sections
- Ask Mira bar
- Services grid

**Missing:**
- [ ] "How can we help" buckets
- [ ] Daily tip
- [ ] Guided paths
- [ ] Breed spotlight

---

### 8. ENJOY ❌ SIGNIFICANT GAPS
**Has:**
- PillarTopicsGrid added
- Experience listings

**Missing:**
- [ ] NO Ask Mira bar
- [ ] NO "How can we help" buckets
- [ ] NO Daily tip
- [ ] NO Guided paths
- [ ] CMS sections not conditional

---

### 9. CELEBRATE ❌ SIGNIFICANT GAPS
**Has:**
- PillarTopicsGrid added
- Celebration products

**Missing:**
- [ ] NO Ask Mira bar
- [ ] NO "How can we help" buckets
- [ ] NO Daily tip
- [ ] NO Guided paths ("Birthday Planning Path")
- [ ] CMS sections not conditional

---

### 10. EMERGENCY ❌ SIGNIFICANT GAPS
**Has:**
- PillarTopicsGrid added
- Emergency contacts

**Missing:**
- [ ] NO Ask Mira bar
- [ ] NO "How can we help" buckets (CRITICAL for emergency!)
- [ ] NO Daily tip
- [ ] NO Guided paths ("First Aid Path", "Lost Pet Path")
- [ ] CMS sections not conditional

---

### 11. ADVISORY ❌ SIGNIFICANT GAPS
**Has:**
- PillarTopicsGrid added
- Advisory services

**Missing:**
- [ ] NO Ask Mira bar
- [ ] NO "How can we help" buckets
- [ ] NO Daily tip
- [ ] NO Guided paths
- [ ] CMS sections not conditional

---

### 12. FAREWELL ❌ SIGNIFICANT GAPS
**Has:**
- PillarTopicsGrid added
- Memorial services

**Missing:**
- [ ] NO Ask Mira bar
- [ ] NO "How can we help" buckets (CRITICAL for sensitive topic)
- [ ] NO Daily tip
- [ ] NO Guided paths ("End of Life Path")
- [ ] CMS sections not conditional

---

### 13. ADOPT ❌ SIGNIFICANT GAPS
**Has:**
- PillarTopicsGrid added
- Adoption listings

**Missing:**
- [ ] NO Ask Mira bar
- [ ] NO "How can we help" buckets
- [ ] NO Daily tip
- [ ] NO Guided paths ("New Adoption Path")
- [ ] CMS sections not conditional

---

### 14. SHOP ❌ SIGNIFICANT GAPS
**Has:**
- PillarTopicsGrid added
- Product grid
- Filters

**Missing:**
- [ ] NO Ask Mira bar
- [ ] NO "How can we help" buckets
- [ ] NO Daily tip
- [ ] CMS sections not conditional

---

## PRIORITY FIXES

### P0 - Critical (Structure)
1. Add Ask Mira bar to ALL pages
2. Add CMS conditional section rendering (`cmsConfig.sections?.xxx.enabled`)
3. Standardize section hierarchy order

### P1 - High (Experience)
1. Add "How can we help" buckets to all pages
2. Add Daily tip to all pages
3. Add Guided paths relevant to each pillar

### P2 - Medium (Personalization)
1. Add Breed spotlight where relevant
2. Add Weather tip where relevant (Travel, Fit, Emergency)
3. Enhance PillarTopicModal content for each pillar

### P3 - Enhancement
1. Add Recommended for Pet sections
2. Add Quick links
3. Add Training/Service request forms

---

## RECOMMENDED SECTION ORDER (STANDARD)

```jsx
<PillarPageLayout pillar={pillar}>
  {/* 1. ASK MIRA BAR - Always first */}
  {cmsConfig.sections?.askMira?.enabled !== false && <AskMiraBar />}
  
  {/* 2. TOPIC BOXES - Grid of category cards */}
  {cmsConfig.sections?.topics?.enabled !== false && <PillarTopicsGrid />}
  
  {/* 3. DAILY TIP - Rotating daily content */}
  {cmsConfig.sections?.dailyTip?.enabled !== false && <DailyTip />}
  
  {/* 4. HOW CAN WE HELP - Action buckets */}
  {cmsConfig.sections?.helpBuckets?.enabled !== false && <HelpBuckets />}
  
  {/* 5. PERSONALIZED SECTION - For logged-in users */}
  {activePet && <PersonalizedForPet />}
  
  {/* 6. BREED SPOTLIGHT + WEATHER */}
  {activePet && <BreedSpotlight />}
  
  {/* 7. GUIDED PATHS - Step-by-step journeys */}
  <GuidedPaths />
  
  {/* 8. CURATED BUNDLES */}
  <CuratedBundles />
  
  {/* 9. PRODUCTS SECTION */}
  <ProductsSection />
  
  {/* 10. SERVICES SECTION */}
  <ServicesSection />
</PillarPageLayout>
```

---

## NEXT STEPS

1. **Refactor ONE page fully** (recommend: Care or Dine) following Learn's pattern exactly
2. **Test the refactored page** thoroughly
3. **Create reusable components** for common sections (AskMiraBar, HelpBuckets, DailyTip, GuidedPaths)
4. **Roll out to remaining pages** using the new components

---

*Report generated: December 12, 2025*
*Reference: LearnPage.jsx (1830 lines)*
