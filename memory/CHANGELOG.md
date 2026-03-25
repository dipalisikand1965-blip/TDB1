# Changelog

## 2026-03-25 — Mobile Parity Session

### Fixes
- Fixed `book is not defined` error on DineSoulPageDesktopLegacy.jsx (line 1289: `book()` → `tdc.book()`)
- Fixed CelebratePage JSX comment syntax error (double-wrapped `{/* */}`)
- Fixed Full DB Sync ObjectId serialization (export uses `bson.json_util.dumps`, import uses `bson_loads`)
- Fixed CelebrateMobilePage missing `user` destructuring from `useAuth()`
- Fixed GoMobilePage (was template strings, extracted to real JSX)
- Fixed 5 mobile pages with duplicate `export default` statements
- Fixed `GuidedCelebratePaths` import (file named `GuidedCelebrationPaths`)
- Removed duplicate profile cards from Celebrate, Care, Go mobile pages

### Features Added
- **11 mobile page files**: Created and wired CelebrateMobilePage, CareMobilePage, GoMobilePage, PlayMobilePage, LearnMobilePage, ShopMobilePage, ServicesMobilePage, AdoptMobilePage, FarewellMobilePage, EmergencyMobilePage, PaperworkMobilePage
- **Responsive split**: All 12 parent Soul pages now detect `isDesktop` (window.innerWidth >= 1024) and serve mobile vs desktop component
- **DineSoulPage v11**: User-provided fully wired mobile page installed
- **Product grids**: All mobile pages fetch from pillar-products API, render SharedProductCard 2-col grid
- **ProductDetailModal**: Wired on all mobile pages via setSelectedProduct
- **Cart integration**: handleAddToCart wired on all mobile pages
- **Celebrate mobile**: Full wiring — CelebrateCategoryStrip → CelebrateContentModal, Breed Cakes → DoggyBakeryCakeModal, MiraBirthdayBox → BirthdayBoxBuilder multi-step, Mira Picks → bottom sheet modal, BirthdayBoxBrowseDrawer
- **Care mobile**: Products in Mira Picks modal (behind Mira bar tap), PersonalisedBreedSection, MiraImaginesBreed
- **Play/Go mobile**: CategoryStrip → PlayContentModal/GoContentModal wired
- **Bottom nav hidden**: ConditionalMobileNav updated to hide on ALL pillar paths
- **Footer hidden**: ConditionalFooter updated to hide on mobile pillar pages
- **Mira orb preserved**: MiraChatWidget in PillarPageLayout remains visible

### Enhancements
- **tdc.book**: Enhanced with `notes`, `metadata`, `service_type`, `urgency` params + rich message builder
- **applyMiraIntelligence**: Added to CelebratePageNew and AdvisoryPage
- **Removed .slice(0,4) caps**: Celebrate (concierge_picks), Play (bundles), Advisory (advice), Collection (items), Mira (products→12), Dine (MiraPicksSheet), Services (→6 with expand)
- **PersonalisedBreedSection**: Restyled empty state from plain light card to dark premium gradient card
- **Hero padding**: 32px top padding on all mobile pillar heroes for navbar clearance
- **Full DB Sync**: Shows ALL collections in diff/results, error handling per collection, logging

### Database
- Preview DB: 177 collections, 66,046 documents
- Full DB sync tool ready (HTTPS pull mode with bson.json_util round-trip)
- Test user password reset: dipali@clubconcierge.in → test123
