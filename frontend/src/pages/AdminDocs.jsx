import React, { useState } from 'react';
import { 
  Book, Search, ChevronDown, ChevronRight, Home, Inbox, Bell, Brain,
  ShoppingBag, Package, Command, Users, Crown, PawPrint, Cake, Headphones,
  Users2, Heart, BarChart3, MessageSquare, Star, Sparkles, Gift, UtensilsCrossed,
  Building, Plane, Stethoscope, PartyPopper, Dumbbell, FileText, AlertTriangle,
  FileEdit, Quote, HelpCircle, Info, Tags, Dog, Percent, ShoppingCart, Repeat,
  HandHeart, Store, Settings, Megaphone, Handshake, DollarSign, Database,
  ArrowLeft, ExternalLink, Copy, Check
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';

const AdminDocs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState(['session-updates', 'core-tools']);
  const [selectedDoc, setSelectedDoc] = useState('occasion-box-builder');
  const [copied, setCopied] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = {
    'session-updates': {
      title: '🔥 Session Updates (Feb 1)',
      icon: AlertTriangle,
      color: 'bg-red-500',
      items: [
        { id: 'occasion-box-builder', title: '🎁 Occasion Box Builder ⭐', icon: Gift },
        { id: 'intelligent-search', title: '🔍 Intelligent Search for Occasions', icon: Search },
        { id: 'code-splitting', title: '⚡ Code Splitting (80% Faster)', icon: Sparkles },
        { id: 'mobile-improvements', title: '📱 Mobile Touch Targets', icon: PawPrint },
        { id: 'pillar-seeding', title: '🌱 Pillar Services & Products', icon: Database },
        { id: 'unified-flow-fix', title: '✅ Unified Flow Fix (SEV-1)', icon: Check },
        { id: 'mira-fixes', title: '✅ Mira AI Fixes', icon: Brain },
        { id: 'pending-bugs', title: '🐛 Pending Bugs', icon: AlertTriangle },
      ]
    },
    'core-tools': {
      title: 'Core Tools',
      icon: Command,
      color: 'bg-purple-500',
      items: [
        { id: 'dashboard', title: 'Dashboard', icon: Home },
        { id: 'unified-inbox', title: 'Unified Inbox', icon: Inbox },
        { id: 'communications', title: 'Communications', icon: Bell },
        { id: 'reminders', title: 'Reminders', icon: Bell },
        { id: 'mira-memory', title: 'Mira Memory', icon: Brain },
        { id: 'live-mis', title: 'Live MIS', icon: BarChart3 },
        { id: 'orders', title: 'Orders', icon: ShoppingBag },
        { id: 'fulfilment', title: 'Fulfilment', icon: Package },
        { id: 'command-center', title: 'Command Center ⭐', icon: Command },
        { id: 'product-box', title: 'Unified Product Box 🆕', icon: Package },
        { id: 'pet-soul-score', title: 'Pet Soul Score 🆕', icon: PawPrint },
        { id: 'unified-pet-page', title: 'Unified Pet Page ⭐', icon: PawPrint },
        { id: 'gamification', title: 'Gamification System 🆕', icon: Gift },
        { id: 'paw-points', title: 'Paw Points Rewards 🆕', icon: Heart },
        { id: 'soul-whisper', title: 'Soul Whisper™ 🆕', icon: MessageSquare },
        { id: 'soul-explainer', title: 'Soul Explainer Video 🆕', icon: Sparkles },
        { id: 'member-directory', title: 'Pet Parent Directory', icon: Users },
        { id: 'membership', title: 'Membership', icon: Crown },
        { id: 'customers', title: 'Customers', icon: Users2 },
        { id: 'pet-profiles', title: 'Pet Profiles', icon: PawPrint },
        { id: 'celebrations', title: 'Celebrations', icon: Cake },
        { id: 'service-desk', title: 'Service Desk', icon: Headphones },
        { id: 'agents', title: 'Agents', icon: Users2 },
        { id: 'loyalty', title: 'Loyalty (Paw Rewards)', icon: Heart },
        { id: 'reports', title: 'Reports', icon: BarChart3 },
        { id: 'mira-chats', title: 'Mira Chats', icon: MessageSquare },
        { id: 'reviews', title: 'Reviews', icon: Star },
        { id: 'nps', title: 'Net Pawmoter Score (NPS) 🆕', icon: Star },
        { id: 'mira-rules', title: 'Mira LLM Rules 🆕', icon: Brain },
        { id: 'smart-engine', title: 'Smart Recommendations 🆕', icon: Sparkles },
      ]
    },
    'pillar-tools': {
      title: 'Pillar Tools (14 Pillars)',
      icon: Sparkles,
      color: 'bg-pink-500',
      items: [
        { id: 'universal-seed', title: '🔥 Universal Seed ⭐', icon: Database },
        { id: 'pillar-protocol', title: '📋 Pillar Protocol', icon: FileText },
        { id: 'boarding-manager', title: '🏠 Boarding Manager 🆕', icon: Building },
        { id: 'seed-all', title: 'Seed All', icon: Database },
        { id: 'seed-production', title: 'Seed Production 🆕', icon: Database },
        { id: 'celebrate', title: '🎂 Celebrate', icon: Gift },
        { id: 'dine', title: '🍽️ Dine', icon: UtensilsCrossed },
        { id: 'stay', title: '🏨 Stay', icon: Building },
        { id: 'travel', title: '✈️ Travel', icon: Plane },
        { id: 'care', title: '💊 Care', icon: Stethoscope },
        { id: 'enjoy', title: '🎾 Enjoy', icon: PartyPopper },
        { id: 'fit', title: '🏃 Fit', icon: Dumbbell },
        { id: 'learn', title: '🎓 Learn', icon: Book },
        { id: 'paperwork', title: '📄 Paperwork', icon: FileText },
        { id: 'advisory', title: '📋 Advisory', icon: FileText },
        { id: 'emergency', title: '🚨 Emergency', icon: AlertTriangle },
        { id: 'farewell', title: '🌈 Farewell', icon: Heart },
        { id: 'adopt', title: '🐾 Adopt', icon: PawPrint },
        { id: 'shop', title: '🛒 Shop', icon: ShoppingBag },
        { id: 'collections', title: 'Collections', icon: Sparkles },
        { id: 'custom-cakes', title: 'Custom Cakes', icon: Cake },
        { id: 'blog', title: 'Blog', icon: FileEdit },
        { id: 'testimonials', title: 'Testimonials', icon: Quote },
        { id: 'faqs', title: 'FAQs', icon: HelpCircle },
        { id: 'about', title: 'About Page', icon: Info },
        { id: 'page-cms', title: 'Page CMS', icon: FileEdit },
      ]
    },
    'operations': {
      title: 'Operations',
      icon: Settings,
      color: 'bg-blue-500',
      items: [
        { id: 'product-tags', title: 'Product Tags', icon: Tags },
        { id: 'breed-tags', title: 'Breed Tags', icon: Dog },
        { id: 'discounts', title: 'Discounts', icon: Percent },
        { id: 'abandoned', title: 'Abandoned Carts', icon: ShoppingCart },
        { id: 'autoship', title: 'Autoship', icon: Repeat },
        { id: 'streaties', title: 'Streaties', icon: HandHeart },
        { id: 'franchise', title: 'Franchise', icon: Store },
      ]
    },
    'config': {
      title: 'Config',
      icon: Settings,
      color: 'bg-gray-500',
      items: [
        { id: 'pillars-config', title: 'Pillars Config', icon: Settings },
        { id: 'campaigns', title: 'Campaigns', icon: Megaphone },
        { id: 'partners', title: 'Partners', icon: Handshake },
        { id: 'pricing-hub', title: 'Pricing Hub', icon: DollarSign },
        { id: 'data-migration', title: 'Data Migration', icon: Database },
      ]
    }
  };

  // Documentation content for each section
  const docs = {
    'occasion-box-builder': {
      title: '🎁 Occasion Box Builder',
      subtitle: 'Create personalized celebration boxes for birthdays and gotcha days',
      badge: 'NEW - Feb 1, 2026',
      files: {
        backend: '/app/backend/occasion_box_routes.py',
        frontend: '/app/frontend/src/components/OccasionBoxBuilder.jsx, /app/frontend/src/components/MyCelebrations.jsx'
      },
      sections: [
        {
          title: 'Overview',
          content: `The Occasion Box Builder allows members to create personalized gift boxes for pet celebrations.

**Supported Occasions:**
• Birthday Box - Cake, treats, toys, accessories
• Gotcha Day Box - Special treats, toys, photo accessories
• Festival Box - Themed treats and accessories

**Access Points:**
1. Member Dashboard → My Celebrations → "Build Box" button
2. Celebrate Page → "Build Birthday Box" hero button
3. Search → Type "birthday" → Click "Build Birthday Box" CTA
4. Email/WhatsApp reminders → Direct link to builder`
        },
        {
          title: 'Backend API',
          content: `**Template Endpoints:**
GET /api/occasion-boxes/by-occasion/{occasion_type}
  → Returns template with categories and rules

GET /api/occasion-boxes/{slug}/products
  → Returns products for each category

**Template Structure:**
{
  "name": "Birthday Box",
  "occasion_type": "birthday",
  "categories": [
    {"id": "cake", "name": "Birthday Cake", "required": true},
    {"id": "treats", "name": "Special Treats", "required": false},
    {"id": "toys", "name": "Toys & Games", "required": false}
  ]
}`
        },
        {
          title: 'How to Add New Templates',
          content: `1. Go to Admin Panel → Marketing → Occasion Boxes
2. Click "Create Template"
3. Fill in:
   - Name (e.g., "Diwali Box")
   - Occasion Type (e.g., "festival")
   - Categories with product rules
4. Save and test via /celebrate?build_box=festival`
        }
      ]
    },
    'intelligent-search': {
      title: '🔍 Intelligent Search for Occasions',
      subtitle: 'Search triggers occasion box builder for celebration queries',
      badge: 'NEW - Feb 1, 2026',
      files: {
        frontend: '/app/frontend/src/pages/SearchResults.jsx'
      },
      sections: [
        {
          title: 'How It Works',
          content: `When users search for celebration-related terms, the search results page shows a special "Build Box" CTA.

**Detected Keywords:**
• Birthday: "birthday", "bday", "birth day", "birthday box", "birthday kit"
• Gotcha Day: "gotcha", "gotcha day", "adoption day", "adoption anniversary"
• Festival: "diwali", "christmas", "holi", "festival", "celebration"

**User Flow:**
1. User types "birthday cake" in search
2. Search detects "birthday" keyword
3. Shows special CTA: "Planning a Birthday Celebration?"
4. User clicks "Build Birthday Box"
5. Opens OccasionBoxBuilder modal`
        },
        {
          title: 'Configuration',
          content: `Keywords are defined in SearchResults.jsx:

const OCCASION_KEYWORDS = {
  birthday: ['birthday', 'bday', 'birth day', ...],
  gotcha_day: ['gotcha', 'gotcha day', 'adoption day', ...],
  festival: ['diwali', 'christmas', 'holi', ...]
};

To add new occasions, add to this object and create a matching template in the backend.`
        }
      ]
    },
    'code-splitting': {
      title: '⚡ Code Splitting (80% Bundle Reduction)',
      subtitle: 'React.lazy() implementation for faster page loads',
      badge: 'PERFORMANCE - Feb 1, 2026',
      files: {
        frontend: '/app/frontend/src/App.js'
      },
      sections: [
        {
          title: 'Results',
          content: `**Before:** Single 5.5MB bundle
**After:** 1.1MB initial + lazy-loaded chunks

**What's Lazy Loaded:**
• Admin pages (Admin.jsx, ServiceDeskPage.jsx, etc.)
• Member Dashboard
• All Pillar Pages (Dine, Stay, Travel, etc.)
• Special pages (CustomCakeDesigner, VoiceOrder, etc.)

**What's Always Loaded (Core):**
• Home, Login, Register
• Navbar, Footer, Cart
• ShopPage, ProductDetail
• SearchResults`
        },
        {
          title: 'How It Works',
          content: `Uses React.lazy() with Suspense:

// Lazy load admin pages
const Admin = lazy(() => import("./pages/Admin"));

// Wrap routes in Suspense
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/admin" element={<Admin />} />
  </Routes>
</Suspense>

The PageLoader shows a spinning animation while chunks download.`
        }
      ]
    },
    'mobile-improvements': {
      title: '📱 Mobile Touch Targets',
      subtitle: 'Improved touch targets for mobile accessibility',
      badge: 'UX FIX - Feb 1, 2026',
      files: {
        frontend: '/app/frontend/src/components/Navbar.jsx, /app/frontend/src/components/SoulExplainerVideo.jsx'
      },
      sections: [
        {
          title: 'What Was Fixed',
          content: `**Problem:** Small touch targets causing "jammed keys" on mobile

**Fixes Applied:**
• Mobile menu button: min-w-[44px] min-h-[44px] + touch-manipulation
• Cart button: min-w-[44px] min-h-[44px] + touch-manipulation  
• SoulExplainerVideo close: 48px + z-[60] for proper layering

**WCAG 2.1 Standard:** Minimum 44px × 44px touch targets`
        },
        {
          title: 'CSS Classes Used',
          content: `touch-manipulation - Optimizes touch response
min-w-[44px] min-h-[44px] - Ensures minimum touch target
z-[60] - Proper z-index for overlays

Example:
<button className="p-2.5 min-w-[44px] min-h-[44px] touch-manipulation">
  <Menu className="w-6 h-6" />
</button>`
        }
      ]
    },
    'pillar-seeding': {
      title: '🌱 Pillar Services & Products Seeding',
      subtitle: 'Universal seed system for all pillars',
      badge: 'DEPLOYMENT - Feb 1, 2026',
      files: {
        backend: '/app/backend/seed_master_services.py, /app/backend/adopt_routes.py, /app/backend/stay_routes.py'
      },
      sections: [
        {
          title: 'Services (86 Total)',
          content: `**By Pillar:**
• care: 12 services (Grooming, Vet Consult, etc.)
• fit: 8 services (Training, Agility, etc.)
• celebrate: 7 services (Party Planning, Photography)
• travel: 7 services (Pet Taxi, Relocation)
• learn: 7 services (Puppy School, Obedience)
• dine: 5 services (Meal Plans, Nutrition)
• stay: 5 services (Boarding, Daycare)
• enjoy: 5 services (Activities, Events)
• farewell: 5 services (Memorial, Cremation)
• emergency: 5 services (After-Hours Vet, Lost Pet)
• advisory: 5 services (Life Planning, Behavior)
• paperwork: 6 services (Registration, Travel Docs)
• adopt: 5 services (Adoption Support)
• shop: 4 services (Personal Shopper)`
        },
        {
          title: 'Products with base_tags',
          content: `**base_tags Structure:**
{
  "life_stage": "puppy|adult|senior|all",
  "interaction_type": "containment|consumable|wearable|play",
  "benefits": ["calming", "anxiety_relief", "comfort"],
  "purchase_pattern": "impulse|planned|recurring",
  "category_primary": "kit|wellness|beds|carrier",
  "price_tier": "budget|mid|premium"
}

**Seeded Products:**
• adopt: 34 products (kits, calming, comfort, training)
• stay: 92 products (carriers, bowls, safety, health)`
        },
        {
          title: 'Deployment Commands',
          content: `Run these on each deployment:

# 1. Seed all services (86)
cd /app/backend
python3 -c "from seed_master_services import seed_all_services; import asyncio; asyncio.run(seed_all_services())"

# 2. Seed adopt products (34)
curl -X POST /api/adopt/admin/seed-products -u admin:pass

# 3. Seed stay products (19+)
curl -X POST /api/admin/stay/seed-products -u admin:pass

# 4. Other pillar products (run from Admin → each pillar → Seed)`
        }
      ]
    },
    'unified-flow-fix': {
      title: '✅ SEV-1 Unified Flow Fix',
      subtitle: 'Critical fix for the Notification → Ticket → Inbox flow',
      badge: 'RESOLVED - Jan 29, 2026',
      files: {
        backend: '/app/backend/concierge_routes.py, /app/backend/celebrate_routes.py, /app/backend/learn_routes.py',
        frontend: '/app/frontend/src/utils/unifiedApi.js'
      },
      sections: [
        {
          title: 'What Was Wrong',
          content: `**ROOT CAUSE**: Multiple backend endpoints were showing "success" to users but NOT creating the full unified flow:

❌ /api/concierge/experience-request - Only created basic ticket, NO notification, NO inbox
❌ /api/celebrate/requests - Only created request, NO notification, NO inbox  
❌ /api/learn/request - Only created ticket, NO notification, NO inbox

This caused requests to appear successful but never show up in Admin Panel.`
        },
        {
          title: 'What Was Fixed',
          content: `All three endpoints now create the FULL unified flow:

✅ /api/concierge/experience-request
   → Creates: notification_id, ticket_id, inbox_id
   → Appears in: Notifications, Service Desk, Unified Inbox

✅ /api/celebrate/requests  
   → Creates: notification_id, ticket_id, inbox_id
   → Appears in: Notifications, Service Desk, Unified Inbox

✅ /api/learn/request
   → Creates: notification_id, ticket_id, inbox_id
   → Appears in: Notifications, Service Desk, Unified Inbox`
        },
        {
          title: 'How to Verify',
          content: `1. Go to any pillar page (Fit, Care, Travel, etc.)
2. Click "Ask Concierge®" on any experience card
3. Submit the form
4. Check Admin Panel → Notifications → Your request should appear at TOP
5. Check Service Desk → Your ticket should appear
6. Check Unified Inbox → Your entry should appear`
        }
      ]
    },
    'mira-fixes': {
      title: '✅ Mira AI Fixes',
      subtitle: 'Fixed pillar panel links and soul score display',
      badge: 'RESOLVED - Jan 29, 2026',
      files: {
        frontend: '/app/frontend/src/components/MiraContextPanel.jsx, /app/frontend/src/components/MiraAI.jsx',
        backend: '/app/backend/mira_routes.py (load_pet_soul function)'
      },
      sections: [
        {
          title: 'Mira Pillar Panel Links',
          content: `**Problem**: Clicking suggestion buttons (Health Certificate, Pet Passport, etc.) on pillar pages only opened the chat but didn't send the message.

**Fix**: Added sendDirectMessage() function that directly calls Mira API instead of relying on React state updates + timeouts.

**Affected Component**: MiraContextPanel.jsx`
        },
        {
          title: 'Mira Quick Actions',
          content: `**Problem**: Quick action buttons in the floating Mira widget weren't sending messages reliably.

**Fix**: Refactored handleQuickAction() to directly call the Mira API with the message content.

**Affected Component**: MiraAI.jsx`
        },
        {
          title: 'Pet Soul Score Display',
          content: `**Problem**: Soul Score showing 0% for pets even when they had actual scores (e.g., Mojo had 37.8%).

**Root Cause**: load_pet_soul() function in mira_routes.py wasn't returning soul_score field.

**Fix**: Added soul_score and overall_score fields to the load_pet_soul() return object.`
        }
      ]
    },
    'tomorrow-tasks': {
      title: '📋 Tomorrow Tasks',
      subtitle: 'Priority tasks for next session - January 30, 2026',
      badge: 'P0 - BEFORE PRODUCTION',
      sections: [
        {
          title: '🔴 P0 - Checkout GST/Shipping Order',
          content: `**Current**: Subtotal → Discount → Taxable Amount → GST → Shipping → Total

**Required**: Subtotal → Discount → Shipping → Taxable Amount → GST → Total

**Why**: GST should be calculated ON shipping too (18% applies to shipping cost)

**Files to Modify**:
• Frontend: /app/frontend/src/components/UnifiedCheckout.jsx (display order)
• Backend: /app/backend/checkout_routes.py (calculation logic - include shipping in taxable amount)`
        },
        {
          title: '🔴 P0 - Mira Female Voice',
          content: `**Requirement**: Mira AI should use a woman's voice for text-to-speech.

**Files to Check**:
• /app/frontend/src/components/MiraAI.jsx
• /app/frontend/src/components/MiraContextPanel.jsx

**Implementation**: Look for speechSynthesis voice selection and set to female voice.`
        },
        {
          title: '🟠 P1 - After Production Deploy',
          content: `• **Stay Page Layout Redo** - Pet properties should be on TOP
• Pet Profile crash for "Mynx"
• Paw Points display bug for specific user
• Mobile UI transformation for Member Dashboard
• Service Booking Flow mobile optimization`
        }
      ]
    },
    'pending-bugs': {
      title: '🐛 Pending Bugs',
      subtitle: 'Known issues to be addressed',
      badge: 'P1/P2 Backlog',
      sections: [
        {
          title: 'P1 - High Priority',
          content: `1. **Pet Profile Crash for "Mynx"**
   - User reported crash when viewing specific pet profile
   - Needs investigation

2. **Paw Points Display**
   - Incorrect display for specific user account
   - May be data issue or calculation bug`
        },
        {
          title: 'P2 - Medium Priority',
          content: `1. **Razorpay Payments**
   - Reported as failing
   - Needs debugging

2. **PDF Invoice Generation**
   - Not yet implemented
   - Required for order completion

3. **Partner Portal**
   - B2B clients portal
   - Future feature`
        },
        {
          title: 'Test Credentials',
          content: `**Member Login**: 
dipali@clubconcierge.in / test123

**Admin Panel**:
aditya / lola4304`
        }
      ]
    },
    'universal-seed': {
      title: '🔥 Universal Seed',
      subtitle: 'ONE BUTTON to seed ALL data across the entire system',
      badge: '⭐ Critical for Deployment',
      files: {
        frontend: '/app/frontend/src/pages/Admin.jsx (🔥 Universal Seed button)',
        backend: '/app/backend/server.py (/api/admin/universal-seed), /app/backend/scripts/universal_pillar_protocol.py'
      },
      sections: [
        {
          title: 'What It Does',
          content: `**ONE CLICK** seeds everything:
• **Products**: All 12 pillars with 3+ products each
• **Services**: All 12 pillars with 2+ concierge services each
• **Unified Products**: Migrates to Product Box collection
• **Pricing Tiers**: Basic, Member, Premium, VIP
• **Shipping Rules**: Standard, Express, Same Day, Service, Digital
• **Stay Properties**: Syncs stay_properties to products`
        },
        {
          title: 'How to Use',
          content: `**Method 1: Admin Dashboard (Recommended)**
1. Go to Admin → Dashboard
2. Find the **"🔥 Universal Seed"** button in Master Controls
3. Click it - wait for confirmation toast

**Method 2: API Endpoint**
\`\`\`bash
curl -X POST https://YOUR_DOMAIN/api/admin/universal-seed
\`\`\``
        },
        {
          title: 'When to Use',
          content: `• **After every deployment** to ensure data exists
• When products are missing from pillar pages
• When Product Box shows empty stats
• When services aren't showing in Concierge® Pickers
• After database reset/refresh`
        }
      ]
    },
    'pillar-protocol': {
      title: '📋 Pillar Protocol',
      subtitle: 'Standard protocol ensuring all 12 pillars have consistent data',
      badge: 'Documentation',
      files: {
        memory: '/app/memory/PILLAR_PROTOCOL.md',
        backend: '/app/backend/scripts/universal_pillar_protocol.py'
      },
      sections: [
        {
          title: 'The 14 Pillars',
          content: `| # | Pillar | Description |
|---|--------|-------------|
| 1 | **Celebrate** | Cakes, treats, party planning |
| 2 | **Stay** | Hotels, boarding, daycare |
| 3 | **Travel** | Pet transport, relocation |
| 4 | **Feed** | Fresh meals, nutrition |
| 5 | **Care** | Grooming, walking, sitting |
| 6 | **Fit** | Fitness, weight management |
| 7 | **Learn** | Training, behavior |
| 8 | **Enjoy** | Parks, cafes, adventures |
| 9 | **Groom** | Professional grooming |
| 10 | **Adopt** | Adoption services |
| 11 | **Farewell** | End of life services |
| 12 | **Dine** | Pet-friendly restaurants |
| 13 | **Insure** | Pet insurance |
| 14 | **Shop** | General pet products |`
        },
        {
          title: 'Checklist',
          content: `Every deployment must ensure:
✅ All 12 pillars have products in \`products\` collection
✅ All 12 pillars have services in \`services\` collection
✅ Products migrated to \`unified_products\`
✅ Pricing tiers in \`pricing_tiers\`
✅ Shipping rules in \`shipping_rules\`
✅ Stay properties synced to products`
        }
      ]
    },
    'boarding-manager': {
      title: '🏠 Boarding Manager',
      subtitle: 'Manage pet boarding facilities (Home-style, Premium, Private, Luxury)',
      badge: '🆕 New Feature',
      files: {
        frontend: '/app/frontend/src/components/StayManager.jsx (Boarding tab)',
        backend: '/app/backend/server.py (CRUD endpoints)'
      },
      sections: [
        {
          title: 'Features',
          content: `• **CRUD Operations**: Create, Read, Update, Delete facilities
• **Filters**: By city, boarding type
• **Stats**: Total facilities, by type, by city
• **Rich Editing**: Name, city, description, amenities, pricing, images`
        },
        {
          title: 'How to Access',
          content: `1. Admin → Stay Manager
2. Click **"Boarding"** tab
3. Use "+ Add Boarding Facility" to create new
4. Click "Edit" on any card to modify`
        },
        {
          title: 'API Endpoints',
          content: `| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/admin/boarding/facilities | GET | List all facilities |
| /api/admin/boarding/facilities | POST | Create facility |
| /api/admin/boarding/facilities/{id} | PUT | Update facility |
| /api/admin/boarding/facilities/{id} | DELETE | Delete facility |
| /api/admin/boarding/stats | GET | Get statistics |`
        }
      ]
    },
    'command-center': {
      title: 'Command Center (DEPRECATED)',
      subtitle: 'Features merged into Service Desk - Use Service Desk instead',
      badge: '⚠️ Deprecated',
      files: {
        frontend: '/app/frontend/src/components/admin/ServiceDesk.jsx',
        backend: '/app/backend/concierge_routes.py, /app/backend/ticket_intelligence.py'
      },
      sections: [
        {
          title: '🔄 Migrated to Service Desk',
          content: `All Command Center features have been merged into Service Desk:

• **Real-time SLA Countdown** ✅ - Now in Service Desk
• **SLA Attention Banner** ✅ - Now in Service Desk  
• **Audio Alerts** ✅ - Now in Service Desk
• **Unified Queue** ✅ - Already in Service Desk
• **360° Member Profile** ✅ - Already in Service Desk

**Use Service Desk** for all ticket management operations.`
        },
        {
          title: 'Migration Note',
          content: `The ConciergeCommandCenter.jsx file has been deprecated.
All functionality is now available in ServiceDesk.jsx with the same design you love.

Navigate to: **Admin → Service Desk**`
        }
      ]
    },
    'service-desk': {
      title: 'Service Desk',
      subtitle: 'Unified Ticket Management - The ONE Source of Truth',
      badge: '⭐ Primary',
      files: {
        frontend: '/app/frontend/src/components/admin/ServiceDesk.jsx',
        backend: '/app/backend/concierge_routes.py, /app/backend/ticket_intelligence.py'
      },
      sections: [
        {
          title: 'Key Features',
          content: `• **Unified Queue**: ALL tickets from all sources in one place
• **Real-time SLA Countdown**: Live timer that updates every second
• **SLA Attention Banner**: Shows breached/critical/warning counts
• **Audio Alerts**: Optional sound alerts for new SLA breaches
• **360° Member Profile**: Complete customer view (clickable)
• **Mira's Intelligence**: AI-powered insights per ticket
• **Omni-Channel Reply**: Respond via Mira, Email, WhatsApp
• **Bulk Actions**: Select multiple tickets for mass operations
• **Kanban View**: Drag-and-drop workflow management`
        },
        {
          title: 'Ticket Sources',
          content: `| Source | Collection | Description |
|--------|------------|-------------|
| Pulse Voice | \`tickets\` | Voice/text commands from Pulse |
| Mira Requests | \`service_desk_tickets\` | AI concierge escalations |
| Manual Tickets | \`tickets\` | Staff-created tickets |
| Orders | \`orders\` | Pending/processing orders |
| Stay Bookings | \`stay_requests\` | Boarding/hotel requests |
| Travel Requests | \`travel_requests\` | Pet travel requests |
| Care Requests | \`care_requests\` | Vet/grooming requests |
| Celebrations | \`celebrations\` | Upcoming birthdays |`
        },
        {
          title: 'SLA Configuration',
          content: `| Priority | Time Limit | Color |
|----------|-----------|-------|
| Urgent | 2 hours | 🔴 Red |
| High | 4 hours | 🟠 Orange |
| Medium | 24 hours | 🟡 Yellow |
| Low | 48 hours | 🟢 Green |`
        },
        {
          title: 'New Features (Jan 2026)',
          content: `**Sentiment Analysis 🆕**
• AI analyzes every incoming request
• Categories: 😊 Positive, 😐 Neutral, 😠 Frustrated, 🆘 Urgent, 😡 Angry
• Auto-elevates priority for urgent/angry sentiment
• Badge shown in queue and ticket detail

**Ticket Merge 🆕**
• Select 2+ tickets → Click "Merge" button
• First selected = Primary (stays open)
• Others = Secondary (marked as merged)
• All history preserved

**NPS (Net Pawmoter Score) 🆕**
• Survey sent after ticket resolution
• Member rates 0-10
• Score 9+ with feedback → Creates review for approval

**Auto-Acknowledgment Emails 🆕**
• Instant confirmation when ticket created
• Contains ticket ID, subject, pillar message`
        },
        {
          title: 'Key Features',
          content: `• **Member Snapshot**: Click member name → Opens 360° profile in new tab
• **Pet Pass Display**: Shows TDC-XXXXXX for each pet
• **Generate AI Draft**: Auto-generate response using GPT
• **Pillar Filtering**: Filter by Celebrate, Dine, Stay, Travel, Care, etc.
• **CSV Export**: Download current queue view
• **Manual Ticket Creation**: Create tickets from modal
• **Sentiment Badge** 🆕: Shows customer sentiment
• **Merge Button** 🆕: Merge 2+ selected tickets`
        },
        {
          title: 'API Endpoints',
          content: `\`\`\`
GET  /api/concierge/queue                    # Main ticket queue
GET  /api/concierge/item/{ticket_id}         # Ticket details with member snapshot
GET  /api/concierge/event-stream             # Live activity feed
GET  /api/concierge/member-profile/{email}   # Full 360° profile
POST /api/concierge/ticket/create            # Create manual ticket
POST /api/concierge/item/{id}/resolve        # Resolve ticket (sends NPS)
POST /api/concierge/bulk-action              # Bulk operations
POST /api/concierge/tickets/merge            # Merge tickets 🆕
POST /api/concierge/analyze-sentiment        # Analyze text sentiment 🆕
GET  /api/concierge/nps/stats                # NPS statistics 🆕
POST /api/concierge/nps/respond              # Submit NPS response 🆕
GET  /api/concierge/export-csv               # Export to CSV
\`\`\``
        },
        {
          title: 'How to Modify',
          content: `• **UI Changes**: Edit \`ConciergeCommandCenter.jsx\`
• **Queue Logic**: Edit \`concierge_routes.py\` → \`get_command_center_queue()\`
• **Add New Source**: Add to aggregation in \`get_command_center_queue()\`
• **Change SLA Times**: Edit \`SLA_HOURS\` constant
• **Priority Calculation**: Edit \`calculate_priority_score()\``
        }
      ]
    },
    'pet-soul-score': {
      title: 'Pet Soul Score™',
      subtitle: 'Server-Side Pet Profile Completeness & Personalization Engine',
      badge: '⭐ Core System',
      files: {
        frontend: '/app/frontend/src/pages/UnifiedPetPage.jsx, /app/frontend/src/components/PetScoreCard.jsx',
        backend: '/app/backend/pet_score_logic.py'
      },
      sections: [
        {
          title: 'What It Is',
          content: `The Pet Soul Score™ is our **single source of truth** for measuring how well we know a pet. It powers personalization across the entire platform.

**Key Points:**
• 100-point weighted scoring system (6 categories)
• Server-side calculation (NOT frontend)
• Drives Mira® AI personalization
• Unlocks features at different tiers
• Separate from Paw Points (transactional loyalty)`
        },
        {
          title: 'Score Categories & Weights (100 pts)',
          content: `| Category | Points | Icon | Purpose |
|----------|--------|------|---------|
| **Safety & Health** | 35 pts | 🛡️ | Critical for safe recommendations |
| **Personality** | 25 pts | 🎭 | Understanding character |
| **Lifestyle** | 20 pts | 🏠 | Daily routines & preferences |
| **Nutrition** | 10 pts | 🍖 | Food preferences & needs |
| **Training** | 5 pts | 🎓 | Learning style |
| **Relationships** | 5 pts | ❤️ | Family & social connections |

**Total: 100 points**`
        },
        {
          title: 'Top Questions by Weight',
          content: `| Question | Weight | Category |
|----------|--------|----------|
| Food Allergies | 10 pts | Safety |
| Temperament | 8 pts | Personality |
| Health Conditions | 8 pts | Safety |
| Energy Level | 6 pts | Personality |
| Vet Comfort | 5 pts | Safety |
| Life Stage | 5 pts | Safety |
| Alone Time | 5 pts | Lifestyle |
| Grooming Tolerance | 4 pts | Safety |
| Social with Dogs | 4 pts | Personality |
| Social with People | 4 pts | Personality |
| Car Comfort | 4 pts | Lifestyle |

**Pro Tip:** Top 7 questions = 47 points (almost Soul Explorer!)`
        },
        {
          title: 'Tier System',
          content: `| Tier | Score | Emoji | Benefits Unlocked |
|------|-------|-------|-------------------|
| **Newcomer** | 0-24% | 🌱 | Basic Mira AI, Product browsing |
| **Soul Seeker** | 25-49% | 🔍 | Personalized suggestions, Health reminders |
| **Soul Explorer** | 50-74% | 🗺️ | Smart safety alerts, Priority Mira |
| **Soul Master** | 75-100% | ✨ | VIP Concierge®, AI insights, Predictions |`
        },
        {
          title: 'Quick Paths to Each Tier',
          content: `**Soul Seeker (25+ pts):**
• Food Allergies (10) + Temperament (8) + Health Conditions (8) = 26 pts ✓

**Soul Explorer (50+ pts):**
• Add: Energy (6) + Vet Comfort (5) + Life Stage (5) + Alone Time (5) + Grooming (4) = 51 pts ✓

**Soul Master (75+ pts):**
• Add: Social Dogs (4) + Social People (4) + Car Comfort (4) + Noise (3) + Behavior (3) + Travel (3) + Protein (3) + Food Motivation (3) = 78 pts ✓`
        },
        {
          title: 'API Endpoints',
          content: `\`\`\`
GET /api/pet/{id}/score_state              # Complete score state
GET /api/pet/{id}/score_state/categories   # Category details
GET /api/pet-score/tiers                   # Tier definitions
GET /api/pet/{id}/score_state/quick-questions?limit=N  # Unanswered questions
\`\`\``
        },
        {
          title: 'Achievements & Gamification',
          content: `Users earn badges for completing Pet Soul milestones:

**Tier Achievements:**
• 🌱 First Steps (first answer)
• 🔍 Soul Seeker (25%)
• 🗺️ Soul Explorer (50%)
• ✨ Soul Master (75%)
• 🏆 Pet Soul Complete (100%)

**Category Achievements:**
• 🛡️ Safety First (all safety questions)
• 🎭 Personality Pro (all personality questions)
• 🏠 Lifestyle Guru (all lifestyle questions)
• 🍖 Nutrition Ninja (all nutrition questions)
• 🎓 Training Expert (all training questions)

**Special:**
• 📸 Picture Perfect (photo uploaded)
• ⚕️ Allergy Aware (allergy info added)`
        },
        {
          title: 'Frontend Integration',
          content: `**Hook Usage:**
\`\`\`jsx
import usePetScore from '../utils/petScore';

const { 
  scoreState, 
  loading, 
  score, 
  tier, 
  recommendations 
} = usePetScore(petId, token);
\`\`\`

**Display Component:**
\`\`\`jsx
import PetScoreCard from '../components/PetScoreCard';

<PetScoreCard
  scoreState={scoreState}
  loading={loading}
  petName={pet.name}
/>
\`\`\``
        },
        {
          title: 'How to Modify',
          content: `• **Add Questions**: Edit \`WEIGHTED_QUESTIONS\` in \`pet_score_logic.py\`
• **Change Weights**: Modify category weights in same file
• **Tier Thresholds**: Edit \`TIERS\` constant
• **UI Changes**: Edit \`PetScoreCard.jsx\` or \`UnifiedPetPage.jsx\`
• **Add Achievements**: Edit \`ACHIEVEMENTS\` in \`PetAchievements.jsx\``
        }
      ]
    },
    'unified-pet-page': {
      title: 'Unified Pet Page',
      subtitle: 'THE Definitive Pet Profile - One Page for Everything',
      badge: '⭐ Premium Feature',
      files: {
        frontend: '/app/frontend/src/pages/UnifiedPetPage.jsx',
        backend: '/app/backend/pet_score_logic.py, /app/backend/health_vault_routes.py'
      },
      sections: [
        {
          title: 'What It Is',
          content: `The Unified Pet Page is the **single source of truth** for all pet information. Instead of multiple scattered pages, everything is consolidated into one beautiful, intuitive interface.

**Route:** \`/pet/{petId}?tab=personality\`

**Key Sections:**
• Emergency Info Card (allergies, medications, vet contact)
• Soul Score Card with percentage & tier
• ALL 14 Soul Pillars with inline editing
• Photo Gallery
• Milestone Tracker & Timeline
• Breed Info Card
• 14 Life Pillars quick access
• Achievements gallery
• Health Vault integration
• Quick Actions Floating Button`
        },
        {
          title: '14 Service Pillars',
          content: `| Pillar | Icon | Description |
|--------|------|-------------|
| Celebrate | 🎂 | Birthdays, anniversaries & milestones |
| Dine | 🍖 | Pet-friendly restaurants & dining |
| Stay | 🏨 | Boarding, daycare & pet hotels |
| Travel | ✈️ | Pet travel & adventures |
| Care | 💊 | Grooming, vets & wellness |
| Enjoy | 🎾 | Activities, parks & playtime |
| Fit | 🏃 | Exercise & fitness tracking |
| Learn | 🎓 | Training & behaviour classes |
| Paperwork | 📋 | Documents, records & vault |
| Advisory | 💡 | Expert guidance & consultations |
| Emergency | 🚨 | 24/7 emergency support |
| Farewell | 🌈 | End-of-life care & memorials |
| Adopt | 🐾 | Adoption & fostering |
| Shop | 🛒 | Products, treats & merchandise |

**Features:**
• Click to expand/collapse
• Progress bar per pillar
• Inline editing with quick options
• British English spellings`
        },
        {
          title: 'Inline Editing System',
          content: `Users can answer/edit questions **directly on the page** without navigating away!

**How It Works:**
1. Click "Answer" or edit icon on any question
2. Quick option buttons appear for common answers
3. Click an option to save instantly
4. Score refreshes automatically

**Quick Options Available For:**
• Temperament (Calm, Energetic, Curious, etc.)
• Stranger Reaction (Friendly, Cautious, etc.)
• Behavior with Dogs/Humans
• Travel preferences
• Training level
• And 25+ more question types!

**Code Example:**
\`\`\`jsx
const QUICK_OPTIONS = {
  general_nature: ['Calm', 'Energetic', 'Curious', 'Playful', 'Shy', 'Friendly'],
  stranger_reaction: ['Friendly', 'Cautious', 'Excited', 'Shy', 'Protective'],
  // ... more options
};
\`\`\``
        },
        {
          title: 'Emergency Info Card',
          content: `Critical pet info displayed prominently at the top:

• **Allergies** - From food_allergies question
• **Medical Conditions** - From medical_conditions question
• **Active Medications** - From Health Vault
• **Vet Contact** - From vet_name question

**Styling:** Red/orange gradient for visibility
**Purpose:** Quick reference in emergencies`
        },
        {
          title: 'Premium Features',
          content: `**Photo Gallery:**
• Main pet photo + 6 additional slots
• Click to upload more photos
• Grid layout with 2x2 feature photo

**Milestone Tracker:**
• Timeline view with icons
• Birthday with countdown
• Gotcha Day with years calculation
• Pet Pass enrollment
• Soul Journey progress

**Breed Info Card:**
• Auto-populated breed traits
• Temperament, Exercise needs, Grooming
• Supports 20+ common breeds

**Quick Actions FAB:**
• Answer Questions → Pet Soul Journey
• Health Vault → Add health records
• Order Cake → Celebrate pillar
• Ask Mira → Open AI chat`
        },
        {
          title: 'API Endpoints Used',
          content: `\`\`\`
GET /api/pet/{id}                    # Pet details
GET /api/pet/{id}/score_state        # Soul Score
PATCH /api/pets/{id}/soul-answers    # Save inline answer
GET /api/pet-vault/{id}/vaccines     # Vaccination records
GET /api/pet-vault/{id}/medications  # Medication records
\`\`\``
        },
        {
          title: 'Tabs Available',
          content: `| Tab | Contents |
|-----|----------|
| Detailed View | Soul pillars, Emergency info, Milestones, Breed info |
| Health Vault | Vaccines, Medications, Vet visits, Weight tracking |
| Services | Pillar-specific services booked/available |
| Mira Chats | Conversation history with AI |
| Pet Pass | Digital membership card |`
        }
      ]
    },
    'gamification': {
      title: 'Gamification System',
      subtitle: 'World-Class Engagement through Achievements, Points & Celebrations',
      badge: '🆕 New Feature',
      files: {
        frontend: '/app/frontend/src/pages/MemberDashboard.jsx',
        backend: '/app/backend/paw_points_routes.py'
      },
      sections: [
        {
          title: 'Overview',
          content: `The Gamification System drives engagement through:

**1. Progress Banner** - Beautiful gradient card showing:
• Pet avatar with score ring
• Soul completion percentage
• Next milestone & points reward
• "Continue Soul Journey" CTA

**2. Achievement System** - 10 unlockable badges:
• Soul Starter (🌱) - Answer 1 question
• Soul Seeker (🔍) - Reach 25%
• Soul Explorer (🧭) - Reach 50%
• Soul Guardian (🛡️) - Reach 75%
• Soul Master (👑) - Complete 100%
• First Paw-chase (🛒) - Place first order
• Picture Paw-fect (📸) - Upload pet photo
• Pack Leader (🐾) - Add multiple pets
• Mira's Friend (💬) - Chat with Mira
• Party Planner (🎉) - Plan a celebration

**3. Confetti Celebrations** - Auto-triggers on milestones!`
        },
        {
          title: 'Achievement Points',
          content: `Each achievement awards Paw Points to the user's real balance:

| Achievement | Points | Trigger |
|-------------|--------|---------|
| Soul Starter | 50 | 1 question answered |
| Soul Seeker | 100 | 25% completion |
| Soul Explorer | 250 | 50% completion |
| Soul Guardian | 500 | 75% completion |
| Soul Master | 1000 | 100% completion |
| First Paw-chase | 100 | First order |
| Picture Paw-fect | 50 | Photo uploaded |
| Pack Leader | 200 | 2+ pets |
| Mira's Friend | 75 | Chat with Mira |
| Party Planner | 150 | Book celebration |

**Total Possible:** 2,475+ points from achievements alone!`
        },
        {
          title: 'API Endpoints',
          content: `POST /api/paw-points/sync-achievements
# Checks and credits newly unlocked achievements
# Called automatically when user visits dashboard
# Returns: points_earned, new_balance, new_achievements[]`
        }
      ]
    },
    'paw-points': {
      title: 'Paw Points Rewards',
      subtitle: 'Full Loyalty Redemption System',
      badge: '🆕 Updated Jan 2025',
      files: {
        frontend: '/app/frontend/src/components/PawPointsRewards.jsx, /app/frontend/src/pages/MemberDashboard.jsx',
        backend: '/app/backend/paw_points_routes.py'
      },
      sections: [
        {
          title: '🏅 Achievement Badges (10 Total)',
          content: `**Soul Journey Badges (5):**
| Badge | Name | Criteria | Points | Tier |
|-------|------|----------|--------|------|
| 🌱 | Soul Starter | Answer 1+ question | 50 | Bronze |
| 🔍 | Soul Seeker | 25% completion | 100 | Bronze |
| 🧭 | Soul Explorer | 50% completion | 250 | Silver |
| 🛡️ | Soul Guardian | 75% completion | 500 | Gold |
| 👑 | Soul Master | 100% completion | 1,000 | Platinum |

**Engagement Badges (5):**
| Badge | Name | Criteria | Points | Tier |
|-------|------|----------|--------|------|
| 🛒 | First Paw-chase | First order | 100 | Bronze |
| 📸 | Picture Paw-fect | Upload photo | 50 | Bronze |
| 🎉 | Party Planner | Plan celebration | 150 | Silver |
| 🐾 | Pack Leader | Add 2+ pets | 200 | Silver |
| 💬 | Mira's Friend | Chat with Mira | 75 | Bronze |

**Total Potential: 2,475 Paw Points**`
        },
        {
          title: '💰 Earning Paw Points',
          content: `| Activity | Points |
|----------|--------|
| Per ₹10 spent on orders | 1 point |
| Achievement badge unlocked | 50-1,000 pts |
| Referral bonus | 500 pts |
| Birthday bonus | 100 pts |
| Product review | 25 pts |

**Point Value: 1 Paw Point = ₹0.50**`
        },
        {
          title: '🎖️ Member Tiers',
          content: `| Tier | Lifetime Points | Badge Color | Perks |
|------|----------------|-------------|-------|
| Bronze | 0+ | Amber | Basic rewards |
| Silver | 500+ | Gray | Silver rewards + priority booking |
| Gold | 1,500+ | Yellow | Gold rewards + early access |
| Platinum | 5,000+ | Purple-Pink | All rewards + personal Concierge® |`
        },
        {
          title: '🎁 Reward Catalog',
          content: `**Discounts:**
• ₹50 Off (100 pts) - Bronze tier
• ₹100 Off (200 pts) - Silver tier
• ₹250 Off (500 pts) - Gold tier
• 10% Off max ₹500 (400 pts) - Gold tier

**Free Items:**
• Free Treat Box (150 pts) - Bronze - Value ₹299
• Free Birthday Cake (350 pts) - Silver - Value ₹599
• Free Basic Grooming (500 pts) - Gold - Value ₹799

**Experiences:**
• Priority Mira Support 30 days (200 pts) - Silver
• VIP Restaurant Booking (300 pts) - Silver
• Personal Concierge® Session (750 pts) - Platinum

**Exclusive:**
• Early Access Pass 60 days (400 pts) - Gold
• Double Points Week (600 pts) - Gold`
        },
        {
          title: '🎊 Celebration Triggers',
          content: `Confetti animations trigger when:
• New milestone reached (Soul Seeker/Explorer/Guardian/Master)
• Badge unlocked
• Reward redeemed
• Points milestone hit (1000, 2500, 5000)

**Badge Tier Colors:**
• Bronze: Amber 600 → Amber 400
• Silver: Gray 400 → Gray 300
• Gold: Yellow 500 → Yellow 300
• Platinum: Purple 600 → Pink 500`
        },
        {
          title: 'API Endpoints',
          content: `\`\`\`
GET  /api/paw-points/balance       # Current balance & tier
GET  /api/paw-points/catalog       # Available rewards
POST /api/paw-points/redeem        # Redeem a reward
GET  /api/paw-points/history       # Transaction ledger
GET  /api/paw-points/redemptions   # Active/used codes
GET  /api/paw-points/ways-to-earn  # Earning methods
POST /api/paw-points/sync-achievements  # Sync badge points
\`\`\``
        }
      ]
    },
    'soul-whisper': {
      title: 'Soul Whisper™',
      subtitle: 'Daily Pet Soul Questions via WhatsApp',
      badge: '🆕 Premium Feature',
      files: {
        frontend: '/app/frontend/src/pages/MemberDashboard.jsx (Settings tab)',
        backend: '/app/backend/communication_engine.py'
      },
      sections: [
        {
          title: 'What It Is',
          content: `Soul Whisper sends **one gentle question per day** via WhatsApp, making it effortless for members to build their pet's Soul profile over time.

**Settings Location:** My Account → Settings → Soul Whisper™

**Options:**
• Enable/Disable toggle
• Frequency: Daily, Twice Weekly, Weekly
• Preferred Time: 8am, 10am, 2pm, 6pm, 8pm

**Preview Message:**
"Soul Whisper for Mojo 💜
'What is Mojo favourite spot in the house?'
Tap to answer →"`
        },
        {
          title: 'User Flow',
          content: `1. Member enables Soul Whisper in Settings
2. System sends question at preferred time
3. Member taps WhatsApp message
4. Opens app to answer question
5. Answer saved, score updated
6. Next question queued

**Benefits:**
• Never overwhelming (just 1 question)
• Builds habit of engagement
• Grows Soul score naturally`
        }
      ]
    },
    'soul-explainer': {
      title: 'Soul Explainer Video',
      subtitle: 'Animated Storytelling Component for Pet Soul™',
      badge: '🆕 New Feature',
      files: {
        frontend: '/app/frontend/src/components/SoulExplainerVideo.jsx'
      },
      sections: [
        {
          title: 'What It Is',
          content: `An **animated, video-like slideshow** that explains what Pet Soul™ is and why it matters. 

**Location:** Dashboard → "What is Pet Soul?" button

**7 Slides:**
1. What is Pet Soul? - Introduction
2. Why Does It Matter? - Personalisation benefits
3. 14 Soul Pillars - Category overview
4. Your Soul Score - Tier progression
5. Earn Paw Points - Rewards connection
6. Soul Whisper™ - Daily questions feature
7. Start Your Journey - CTA

**Features:**
• Auto-advancing slides (8 seconds each)
• Play/Pause controls
• Progress dots for navigation
• Beautiful gradient backgrounds
• Smooth animations`
        },
        {
          title: 'Usage',
          content: `import SoulExplainerVideo from './components/SoulExplainerVideo';

// In your component
{showExplainer && (
  <SoulExplainerVideo
    petName="Mojo"
    onClose={() => setShowExplainer(false)}
    onStartJourney={() => navigate('/pet/' + petId)}
  />
)}`
        }
      ]
    },
    'member-directory': {
      title: 'Pet Parent Directory',
      subtitle: 'Complete 360° CRM View - Like Zoho/Salesforce but Pet-Centric',
      badge: '⭐ Key Feature',
      files: {
        frontend: '/app/frontend/src/components/admin/MemberDirectory.jsx',
        backend: '/app/backend/concierge_routes.py'
      },
      sections: [
        {
          title: 'What It Contains',
          content: `• **Complete Member List**: All registered pet parents
• **360° Profile View**: Full customer profile with tabs
• **Pet Soul Journey**: Pet personality insights with scores
• **Multi-Pet Support**: See all pets per household`
        },
        {
          title: 'Profile Tabs',
          content: `| Tab | Contents |
|-----|----------|
| Overview | Contact info, membership status, quick stats |
| Tickets | All support tickets for this member |
| Orders | Complete order history |
| Paw Rewards | Loyalty points earned/redeemed |
| Health Vault | Pet health records (coming soon) |
| Pet Soul Q&A | All Pet Soul questionnaire answers |`
        },
        {
          title: 'Pet Pass Number',
          content: `• **Format**: TDC-XXXXXX (6 alphanumeric characters)
• **Generated**: Automatically on pet creation
• **Unique**: Each pet has one, never changes
• **Searchable**: Works in Command Center search`
        },
        {
          title: 'API Endpoints',
          content: `\`\`\`
GET /api/admin/members/directory           # Member list
GET /api/concierge/member-profile/{email}  # Full 360° profile
\`\`\``
        }
      ]
    },
    'orders': {
      title: 'Orders',
      subtitle: 'Complete Order Lifecycle Management',
      files: {
        frontend: '/app/frontend/src/components/admin/OrdersTab.jsx',
        backend: '/app/backend/server.py'
      },
      sections: [
        {
          title: 'What It Contains',
          content: `• All orders (pending, processing, fulfilled, cancelled)
• Order details with line items
• Customer info
• Payment status (Razorpay)
• Delivery tracking`
        },
        {
          title: 'Order Status Flow',
          content: `\`\`\`
pending → processing → fulfilled → delivered
    ↓
cancelled
\`\`\`

• Auto-notification sent on each status change
• Creates Command Center ticket on new order`
        },
        {
          title: 'Actions Available',
          content: `• View order details
• Update order status
• Add tracking info
• Issue refunds
• Print invoice
• Contact customer`
        }
      ]
    },
    'pet-profiles': {
      title: 'Pet Profiles',
      subtitle: 'Manage All Registered Pets',
      files: {
        frontend: '/app/frontend/src/pages/Admin.jsx',
        backend: '/app/backend/server.py'
      },
      sections: [
        {
          title: 'What It Contains',
          content: `• All registered pets
• Pet details (name, breed, gender, DOB)
• **Pet Pass Number** (TDC-XXXXXX)
• Pet parent info
• Pet Soul completion status`
        },
        {
          title: 'Pet Pass Number System',
          content: `• **Format**: TDC-XXXXXX
• **Generation**: \`generate_pet_pass_number()\` in server.py
• **Storage**: \`pet_pass_number\` field in pets collection
• **Migration**: Run \`POST /api/admin/migrate/pet-pass-numbers\` for existing pets`
        },
        {
          title: 'Pet Soul Score',
          content: `Score = (Answered Questions / Total Questions) × 100%

Categories:
• Identity & Temperament
• Family & Pack
• Rhythm & Routine
• Food & Nutrition
• Health & Wellness
• Adventures & Experiences
• Quirks & Preferences`
        }
      ]
    },
    'collections': {
      title: 'Collections',
      subtitle: 'Campaign Pages & Curated Product Collections',
      files: {
        frontend: '/app/frontend/src/components/admin/CollectionManager.jsx',
        backend: '/app/backend/collection_routes.py'
      },
      sections: [
        {
          title: 'What It Contains',
          content: `• Curated product collections
• Campaign pages (Valentine's, Diwali, etc.)
• Custom sections with products
• Navbar display settings`
        },
        {
          title: 'Collection Structure',
          content: `\`\`\`json
{
  "name": "Valentine's Day 2026",
  "slug": "valentines-2025",
  "sections": [
    {
      "title": "Valentine's Specials",
      "layout": "featured|grid|carousel",
      "items": [product_ids]
    }
  ],
  "visibility": {
    "is_published": true,
    "end_date": "2026-02-15"
  },
  "display_locations": {
    "show_in_navbar": true
  }
}
\`\`\``
        },
        {
          title: 'API Endpoints',
          content: `\`\`\`
# Public
GET /api/campaign/collections              # List published collections
GET /api/campaign/collections/navbar       # Navbar collections
GET /api/campaign/collections/{slug}       # Single collection

# Admin
GET  /api/admin/enhanced-collections       # All collections
POST /api/admin/enhanced-collections       # Create
PUT  /api/admin/enhanced-collections/{id}  # Update
\`\`\``
        }
      ]
    },
    'seed-production': {
      title: 'Seed Production Data',
      subtitle: 'One-Click Seeding for Production Environments',
      badge: '🆕 New',
      files: {
        frontend: '/app/frontend/src/pages/Admin.jsx',
        backend: '/app/backend/server.py'
      },
      sections: [
        {
          title: 'What It Does',
          content: `• **Seeds 8 FAQs**: Delivery, Products, Orders, Membership, Payment, Pet Soul, Mira AI categories
• **Seeds 4 Collections**: Valentine's Day, Birthday Celebration, Healthy Bites, Diwali Special
• **Seeds 5 Sample Tickets**: Realistic, editable tickets for Command Center testing`
        },
        {
          title: 'When To Use',
          content: `| Scenario | Use This Button |
|----------|-----------------|
| After deploying to new environment | ✅ Yes |
| Database is empty | ✅ Yes |
| FAQs/Collections not showing | ✅ Yes |
| Testing Command Center | ✅ Yes |
| Already have data | Safe to run (UPSERT) |`
        },
        {
          title: 'API Endpoint',
          content: `\`\`\`
POST /api/admin/seed-production-data
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Production data seeded successfully!",
  "results": {
    "faqs": 8,
    "collections": 4,
    "tickets": 5
  },
  "note": "This data is editable"
}
\`\`\``
        },
        {
          title: 'Important Notes',
          content: `• Uses **UPSERT** - safe to run multiple times
• All seeded data is **fully editable** via admin panel
• Sample tickets marked with \`is_sample: true\`
• Does NOT overwrite existing data`
        },
        {
          title: 'Location in Admin',
          content: `Found under **PILLAR TOOLS** section:
• Purple/pink gradient button
• Labeled "Seed Production"
• Next to green "Seed All" button`
        }
      ]
    },
    'faqs': {
      title: 'FAQs',
      subtitle: 'Multi-Pillar Help Center Management',
      files: {
        frontend: '/app/frontend/src/pages/Admin.jsx',
        backend: '/app/backend/server.py'
      },
      sections: [
        {
          title: 'What It Contains',
          content: `• FAQ management interface
• Multi-pillar categories
• Featured FAQs
• Search functionality`
        },
        {
          title: 'Categories',
          content: `• Concierge® & Mira AI
• Membership & Club
• Celebrate
• Dine
• Stay
• Care
• Orders & Delivery
• Payments & Refunds
• Emergency Support`
        },
        {
          title: 'API Endpoints',
          content: `\`\`\`
GET    /api/faqs                # Public FAQ list
GET    /api/admin/faqs          # Admin FAQ list
POST   /api/admin/faqs          # Create FAQ
PUT    /api/admin/faqs/{id}     # Update FAQ
DELETE /api/admin/faqs/{id}     # Delete FAQ
\`\`\``
        }
      ]
    },
    'loyalty': {
      title: 'Loyalty (Paw Rewards)',
      subtitle: 'Customer Loyalty Program Management',
      files: {
        backend: '/app/backend/paw_rewards_routes.py'
      },
      sections: [
        {
          title: 'Earning Rules',
          content: `| Action | Points |
|--------|--------|
| Order ₹100 | 10 points |
| Birthday order | 2x points |
| Referral | 100 points |
| Pet Soul completion | 50 points |`
        },
        {
          title: 'Redemption',
          content: `• 100 points = ₹10 discount
• Minimum redemption: 50 points
• Points expire: 12 months`
        }
      ]
    },
    'nps': {
      title: 'Net Pawmoter Score (NPS)',
      subtitle: 'Customer Satisfaction Tracking & Product Feedback System',
      badge: '🆕 New Feature',
      files: {
        frontend: '/app/frontend/src/components/admin/NPSManager.jsx, /app/frontend/src/pages/NPSFeedbackPage.jsx',
        backend: '/app/backend/concierge_routes.py (nps/* endpoints)'
      },
      sections: [
        {
          title: 'What It Measures',
          content: `**Net Pawmoter Score™** is the pet-world equivalent of NPS:
• Score range: 0-10 (paw rating)
• **Promoters**: 9-10 (loyal advocates)
• **Passives**: 7-8 (satisfied but unenthusiastic)
• **Detractors**: 0-6 (unhappy customers)

**Formula**: NPS = % Promoters - % Detractors
• Range: -100 to +100
• Above 50 = Excellent`
        },
        {
          title: 'When Surveys Are Sent',
          content: `Surveys are automatically sent when:
1. **Ticket Resolution**: After a service desk ticket is marked resolved
2. **Order Delivery**: After order status changes to "delivered"

**Survey contains**:
• 10-paw rating scale
• Optional feedback comment
• Option to allow review publication`
        },
        {
          title: 'Admin Dashboard Features',
          content: `**Overview Tab**:
• Total responses count
• Overall NPS score
• Promoter/Passive/Detractor breakdown with visual bars

**Responses Tab**:
• All individual responses with customer details
• Score, feedback, product, and pet info
• Filter by date range

**By Product Tab** 🆕:
• NPS breakdown per product
• Shows promoters/passives/detractors per product
• Latest customer feedback excerpt
• Product image and average score`
        },
        {
          title: 'API Endpoints',
          content: `| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/concierge/nps/stats\` | GET | Overall NPS statistics |
| \`/api/concierge/nps/responses\` | GET | All individual responses |
| \`/api/concierge/nps/by-product\` | GET | Product-wise NPS breakdown |
| \`/api/concierge/nps/submit\` | POST | Submit customer survey response |
| \`/api/concierge/nps/testimonials\` | GET | Get publishable testimonials |`
        },
        {
          title: 'Data Collected',
          content: `Each NPS response captures:
• **Customer Info**: Name, email, pet name
• **Score**: 0-10 rating
• **Feedback**: Optional comment
• **Product**: Product ID and name (if applicable)
• **Pillar**: Which pillar the interaction was for
• **Ticket ID**: Related service ticket
• **Allow Publish**: Whether customer allows review publication`
        }
      ]
    },
    'mira-rules': {
      title: 'Mira LLM Rules',
      subtitle: 'AI Concierge® Configuration & Behavior Guidelines',
      badge: '🆕 Critical Config',
      files: {
        frontend: '/app/frontend/src/components/MiraAI.jsx',
        backend: '/app/backend/mira_routes.py, /app/backend/server.py (system prompts)'
      },
      sections: [
        {
          title: 'Mira\'s Core Identity',
          content: `**Mira® AI** is The Doggy Company's intelligent concierge:
• **Personality**: Warm, knowledgeable, pet-obsessed
• **Voice**: Friendly but professional, uses pet puns sparingly
• **Expertise**: All 12 pillars of pet life
• **Memory**: Remembers pet profiles, preferences, past interactions

**Brand Voice Guidelines**:
• Never say "I'm just an AI" - Mira IS the concierge
• Use pet names, not "your pet"
• Reference pet's health info when relevant (allergies, conditions)
• Always offer personalized recommendations`
        },
        {
          title: 'System Prompt Structure',
          content: `The Mira system prompt includes:

1. **Pet Context Block**
   - Pet name, breed, age, weight
   - Health conditions & allergies
   - Dietary restrictions
   - Past orders & preferences

2. **Member Context Block**
   - Parent name, membership tier
   - Address & delivery preferences
   - Order history summary

3. **Product Knowledge**
   - Current menu items
   - Seasonal specials
   - Allergen information

4. **Operational Rules**
   - Pricing guidelines
   - Delivery zones
   - Order cutoff times`
        },
        {
          title: 'Response Rules',
          content: `**MUST DO**:
• Personalize every response with pet name
• Check allergies before recommending food
• Offer alternatives for dietary restrictions
• Include pricing when discussing products
• Provide clear delivery/pickup options

**MUST NOT**:
• Make medical diagnoses (refer to vet)
• Promise specific delivery times (give ranges)
• Share other customer information
• Use competitor brand names
• Make claims about health benefits`
        },
        {
          title: 'Escalation Triggers',
          content: `Mira should **escalate to human** when:

| Trigger | Action |
|---------|--------|
| Customer expresses anger/frustration | Create urgent ticket |
| Refund or complaint requested | Tag for review |
| Complex health question | Redirect to Care pillar |
| Custom cake over ₹5000 | Flag for manager approval |
| Emergency situation | Provide emergency contacts immediately |
| Repeated question (3+ times) | Human takeover |`
        },
        {
          title: 'Admin Configuration',
          content: `**Mira Memory Settings** (Admin → Mira Memory):
• View all conversation history
• Edit/delete specific memories
• Set pet-specific preferences
• Override AI recommendations

**Chat Limits by Tier**:
| Tier | Daily Chats | Features |
|------|------------|----------|
| Free | 3 | Basic Q&A |
| Monthly | Unlimited | Full product recs |
| Annual | Unlimited | Priority response |
| VIP | Unlimited | Custom styling |`
        },
        {
          title: 'Technical Details',
          content: `**LLM Integration**:
• Model: GPT-4o via Emergent LLM Key
• Timeout: 60 seconds
• Max tokens: 2000
• Temperature: 0.7

**Context Window**:
• Pet profile: Always included
• Last 10 messages: Included
• Order history: Last 5 orders

**Error Handling**:
• Timeout → "Let me think about that..."
• API error → Graceful fallback message
• Invalid input → Request clarification`
        }
      ]
    },
    'membership': {
      title: 'Pet Pass Membership',
      subtitle: 'Pet Pass System - Membership Belongs to the Pet, Not the Parent',
      badge: '🆕 Updated Jan 2025',
      files: {
        frontend: '/app/frontend/src/pages/MembershipPage.jsx, /app/frontend/src/components/PetPassCard.jsx, /app/frontend/src/pages/MemberDashboard.jsx',
        backend: '/app/backend/membership_routes.py, /app/backend/auth_routes.py, /app/backend/renewal_reminders.py'
      },
      sections: [
        {
          title: 'Pet Pass Plans',
          content: `| Plan | Price | Duration | Key Benefits |
|------|-------|----------|--------------|
| Pet Pass — Trial | ₹499 + GST | 1 month | Full access trial |
| Pet Pass — Foundation | ₹4,999 + GST | 12 months | Full annual membership |
| Additional Pet | ₹2,499/year or ₹249/trial | Per pet | Multi-pet families |`
        },
        {
          title: 'Member Experience Tiers',
          content: `| Tier | Emoji | How to Achieve |
|------|-------|----------------|
| Curious Pup | 🐕 | New members |
| Loyal Companion | 🦮 | 2+ pillars used OR 3+ months |
| Trusted Guardian | 🛡️ | 5+ pillars used OR 6+ months |
| Pack Leader | 👑 | 8+ pillars used OR 12+ months |`
        },
        {
          title: 'Paw Points Tiers (Loyalty)',
          content: `| Tier | Lifetime Points | Gradient | Rewards Access |
|------|----------------|----------|----------------|
| Bronze | 0+ | Amber | Basic rewards |
| Silver | 500+ | Gray | + Priority booking |
| Gold | 1,500+ | Yellow | + Early access |
| Platinum | 5,000+ | Purple-Pink | + Personal Concierge® |`
        },
        {
          title: '🏅 Achievement Badges Summary',
          content: `**10 Total Badges to Earn:**

**Soul Journey (5):** 🌱 Soul Starter → 🔍 Soul Seeker → 🧭 Soul Explorer → 🛡️ Soul Guardian → 👑 Soul Master

**Engagement (5):** 🛒 First Paw-chase • 📸 Picture Paw-fect • 🎉 Party Planner • 🐾 Pack Leader • 💬 Mira's Friend

**Total Potential Points: 2,475**

See "Paw Points Rewards" section for full details.`
        },
        {
          title: 'Pet Pass Number',
          content: `• **Format**: TDC-XXXXXX (unique per pet)
• **Generated**: Automatically when pet created
• **Activation**: Status changes to "active" on payment
• **Display**: Shown on Pet Pass card, Navbar, My Pets page`
        },
        {
          title: 'Password Reset Flow',
          content: `1. User clicks "Forgot Password" on login page
2. Submits email on /member/forgot-password
3. Backend generates reset token (24hr expiry)
4. Email sent via Resend with reset link
5. User clicks link → /reset-password?token=xxx
6. User enters new password
7. Token invalidated after use

**Files**: 
- Frontend: MemberForgotPassword.jsx, MemberResetPassword.jsx
- Backend: auth_routes.py (forgot-password, reset-password endpoints)`
        },
        {
          title: 'Renewal Reminders',
          content: `Automatic emails sent at:
• 30 days before expiry
• 15 days before expiry
• 7 days before expiry  
• 3 days before expiry
• Day of expiry

**File**: /app/backend/renewal_reminders.py`
        },
        {
          title: 'API Endpoints',
          content: `\`\`\`
POST /api/auth/forgot-password     # Request password reset
POST /api/auth/reset-password      # Submit new password
GET  /api/admin/memberships        # List all memberships
GET  /api/admin/memberships/expiring # Expiring memberships
POST /api/admin/memberships/send-reminders # Trigger reminder emails
GET  /api/paw-points/balance       # User points & tier
POST /api/paw-points/sync-achievements # Sync badge points
\`\`\``
        }
      ]
    },
    'stay': {
      title: 'Stay',
      subtitle: 'Pet Accommodation Services',
      files: {
        frontend: '/app/frontend/src/components/admin/StayManager.jsx',
        backend: '/app/backend/stay_routes.py'
      },
      sections: [
        {
          title: 'Service Types',
          content: `• Pet Hotels
• Home Boarding Hosts
• Day Care Centers`
        },
        {
          title: 'Booking Flow',
          content: `1. Request submitted
2. Availability checked
3. Booking confirmed
4. Pre-stay checklist
5. Check-in
6. Stay updates
7. Check-out`
        }
      ]
    },
    'dine': {
      title: 'Dine',
      subtitle: 'Pet-Friendly Restaurant Management',
      files: {
        frontend: '/app/frontend/src/components/admin/DineManager.jsx',
        backend: '/app/backend/dine_routes.py'
      },
      sections: [
        {
          title: 'What It Contains',
          content: `• Pet-friendly restaurant database
• Reservation system
• Restaurant partnerships
• Dine request management`
        },
        {
          title: 'Rules',
          content: `• Restaurants must be verified pet-friendly
• Reservations include pet count
• Partner restaurants get priority listing`
        }
      ]
    },
    'travel': {
      title: 'Travel',
      subtitle: 'Pet Travel Services',
      files: {
        frontend: '/app/frontend/src/pages/TravelPage.jsx',
        backend: '/app/backend/travel_routes.py'
      },
      sections: [
        {
          title: 'Travel Types',
          content: `• Cab/Road Travel
• Train/Bus
• Domestic Flight
• International (Pet Relocation)`
        },
        {
          title: 'Rules',
          content: `• Page accessible without login
• Booking requires login
• Creates Command Center ticket on submission`
        }
      ]
    },
    'care': {
      title: 'Care',
      subtitle: 'Pet Healthcare Services',
      files: {
        frontend: '/app/frontend/src/pages/CarePage.jsx',
        backend: '/app/backend/care_routes.py'
      },
      sections: [
        {
          title: 'Service Types',
          content: `• Vet visit coordination
• Grooming appointment
• Vaccination reminder
• Health record management`
        },
        {
          title: 'Health Vault (Coming Soon)',
          content: `• Weight tracking graphs
• Vaccination records
• Vet visit history
• PDF export of health records`
        }
      ]
    },
    'learn': {
      title: 'Learn',
      subtitle: 'Pet Training & Education Programs',
      files: {
        frontend: '/app/frontend/src/pages/LearnPage.jsx',
        backend: '/app/backend/learn_routes.py',
        admin: '/app/frontend/src/components/admin/LearnManager.jsx'
      },
      sections: [
        {
          title: 'What It Contains',
          content: `• Training programs (puppy, basic, advanced)
• Certified trainers directory
• Training products & bundles
• Program bookings & management`
        },
        {
          title: 'Admin Features',
          content: `• Manage Programs: Create/edit/delete training programs
• Manage Trainers: CRUD operations on trainers
• Settings Tab: Paw Rewards, Birthday perks, Service Desk integration`
        },
        {
          title: 'API Endpoints',
          content: `GET  /api/learn/programs         # List programs
POST /api/learn/admin/programs   # Create program
GET  /api/learn/trainers         # List trainers
POST /api/learn/admin/trainers   # Create trainer
POST /api/learn/admin/seed       # Seed sample data`
        }
      ]
    },
    'farewell': {
      title: 'Farewell',
      subtitle: 'End-of-Life Care & Memorial Services',
      files: {
        frontend: '/app/frontend/src/pages/FarewellPage.jsx',
        backend: '/app/backend/farewell_routes.py (if exists)'
      },
      sections: [
        {
          title: 'Services',
          content: `• Grief support & counseling
• Memorial services
• Cremation arrangements
• Memory keepsakes (paw prints, etc.)
• Rainbow Bridge tributes`
        },
        {
          title: 'Sensitive Handling',
          content: `• All requests handled with utmost care
• Auto-assigned to trained concierge
• Extended SLA timelines
• Follow-up support scheduling`
        }
      ]
    },
    'adopt': {
      title: 'Adopt',
      subtitle: 'Pet Adoption & Foster Programs',
      files: {
        frontend: '/app/frontend/src/pages/AdoptPage.jsx',
        backend: '/app/backend/adopt_routes.py (if exists)'
      },
      sections: [
        {
          title: 'Services',
          content: `• Adoption matching
• Foster programs
• Shelter partnerships
• Rescue coordination
• Post-adoption support`
        },
        {
          title: 'Process',
          content: `• Browse available pets
• Submit adoption application
• Home check scheduling
• Match approval & handover
• Post-adoption check-ins`
        }
      ]
    },
    'shop': {
      title: 'Shop',
      subtitle: 'Pet Products & Supplies Store',
      files: {
        frontend: '/app/frontend/src/pages/ShopPage.jsx',
        backend: '/app/backend/server.py (products routes)'
      },
      sections: [
        {
          title: 'Features',
          content: `• Browse products by category
• Filter by breed, life stage, allergies
• Pet Soul™ personalized recommendations
• Cart & checkout
• Order tracking`
        },
        {
          title: 'Integration',
          content: `• Every order creates Command Center ticket
• Customer recognised automatically
• Paw Rewards integration
• Autoship for recurring orders`
        }
      ]
    },
    'dashboard': {
      title: 'Dashboard',
      subtitle: 'Business Overview & Quick Actions',
      files: {
        frontend: '/app/frontend/src/components/admin/DashboardTab.jsx'
      },
      sections: [
        {
          title: 'What It Contains',
          content: `• Overview statistics (total members, orders, revenue)
• Quick action cards
• Recent activity feed
• Key metrics at a glance`
        },
        {
          title: 'Data Refresh',
          content: `• Stats refresh every 60 seconds
• Shows today's orders, pending fulfillments
• Revenue calculated from completed orders only`
        }
      ]
    },
    'smart-engine': {
      title: 'Smart Recommendations Engine',
      subtitle: 'AI-Powered Personalized Product & Service Recommendations',
      badge: '🆕 Core AI Feature',
      files: {
        frontend: '/app/frontend/src/pages/MemberDashboard.jsx, /app/frontend/src/components/MiraPicksCard.jsx',
        backend: '/app/backend/smart_routes.py'
      },
      sections: [
        {
          title: 'What It Is',
          content: `The Smart Recommendations Engine powers **personalized product suggestions** based on:

**Data Sources:**
• Pet Soul profile (allergies, preferences, health conditions)
• Breed-specific health needs & care tips
• Upcoming celebrations (birthdays, gotcha days)
• Purchase history and preferences

**Output Locations:**
• **Member Dashboard**: "Mira's Picks" section
• **Mira AI**: Enriched product recommendations in conversations
• **Pillar Pages**: Contextual product suggestions`
        },
        {
          title: 'Recommendation Types',
          content: `| Type | Description | Trigger |
|------|-------------|---------|
| **Mira's Picks** | AI-curated top 6 products | Every dashboard visit |
| **Breed Picks** | Products for breed health needs | Based on pet breed |
| **Allergy Safe** | Products without allergens | If pet has allergies |
| **Birthday Gifts** | Celebration products | 30 days before birthday |
| **Health Essentials** | Medical/wellness products | Based on health conditions |`
        },
        {
          title: 'Breed Intelligence',
          content: `The engine has **breed-specific knowledge** for 10+ popular breeds:

**Supported Breeds:**
• Shih Tzu, Golden Retriever, Labrador, German Shepherd
• Indian Pariah (Indie), French Bulldog, Pomeranian
• Beagle, Pug, Siberian Husky

**Per-Breed Data:**
• Priority product categories (e.g., joint support for Goldens)
• Health focus areas (e.g., eye care for Shih Tzus)
• Products to avoid (e.g., high-calorie treats for Labs)
• Care tips (e.g., "Use harness instead of collar")`
        },
        {
          title: 'API Endpoints',
          content: `\`\`\`
# Main Recommendations
GET /api/smart/recommendations/{user_id}
# Query params: pet_id (optional), limit (default: 12)
# Returns: mira_picks, breed_picks, allergy_safe, birthday_gifts, health_essentials, insights

# Mira AI Context
GET /api/smart/mira-context/{pet_id}
# Returns: breed-specific context for Mira conversations

# Birthday Reminders
GET /api/smart/birthday-reminders?days_ahead=30
# Returns: pets with birthdays in next N days
\`\`\``
        },
        {
          title: 'Response Structure',
          content: `\`\`\`json
{
  "mira_picks": [
    {
      "id": "prod_123",
      "name": "Joint Support Chews",
      "price": 899,
      "reason": "Recommended for Golden Retrievers",
      "pet_name": "Max"
    }
  ],
  "breed_picks": [...],
  "allergy_safe": [...],
  "birthday_gifts": [
    {
      "urgency": "Order soon - 5 days left!",
      "urgency_level": "medium"
    }
  ],
  "insights": [
    "💡 Max (Golden Retriever): Watch weight carefully",
    "💡 Max (Golden Retriever): Annual hip screening recommended"
  ],
  "upcoming_events": [
    {
      "type": "birthday",
      "pet_name": "Max",
      "days_until": 5,
      "message": "🎂 Max's birthday in 5 days!"
    }
  ],
  "primary_pet": {
    "name": "Max",
    "breed": "Golden Retriever",
    "photo_url": "..."
  }
}
\`\`\``
        },
        {
          title: 'Product Matching Logic',
          content: `The engine matches products using these category keywords:

| Category | Keywords Searched |
|----------|-------------------|
| joint_support | joint, glucosamine, hip, mobility, arthritis |
| dental_care | dental, teeth, oral, breath |
| eye_care | eye, tear, vision, optical |
| grooming | groom, brush, shampoo, coat, fur |
| tick_prevention | tick, flea, nexgard, frontline, parasite |
| weight_management | weight, diet, calorie, lean, portion |
| cooling_products | cool, summer, temperature, heat |
| birthday | birthday, cake, party, celebration |

**Matching Priority:**
1. Product name (regex, case-insensitive)
2. Product description
3. Product tags array`
        },
        {
          title: 'Allergy Filtering',
          content: `When a pet has allergies, products containing these ingredients are excluded:

| Allergy | Excluded Keywords |
|---------|-------------------|
| Chicken | chicken, poultry |
| Grain | grain, wheat, corn, rice |
| Beef | beef, cattle |
| Dairy | dairy, milk, cheese |

**Note:** Allergies are read from \`doggy_soul_answers.food_allergies\``
        },
        {
          title: 'Integration with Mira AI',
          content: `The Smart Engine enriches Mira AI conversations:

1. **GET /api/smart/mira-context/{pet_id}** returns:
   - Breed-specific care tips
   - Health focus areas
   - Products to recommend/avoid
   - Pet's allergies and preferences

2. **Mira's system prompt** includes breed health knowledge
   - When discussing products, Mira uses breed recommendations
   - Allergy warnings are surfaced automatically
   - Birthday gift suggestions are proactive

**Example Mira Response:**
"Since Max is a Golden Retriever, I'd recommend our Joint Support Chews - they're great for hip health. And with his birthday coming up in 5 days, how about our Birthday Cake Box?"`
        },
        {
          title: 'How to Modify',
          content: `**Add a new breed:**
Edit \`BREED_RECOMMENDATIONS\` in \`smart_routes.py\`:
\`\`\`python
BREED_RECOMMENDATIONS = {
    'new_breed': {
        'priority_products': ['joint_support', 'dental_care'],
        'health_focus': ['hip_supplements'],
        'avoid': ['high_calorie_treats'],
        'tips': ['Care tip 1', 'Care tip 2']
    }
}
\`\`\`

**Add a product category:**
Edit \`PRODUCT_CATEGORIES\` in \`smart_routes.py\`:
\`\`\`python
PRODUCT_CATEGORIES = {
    'new_category': {
        'keywords': ['keyword1', 'keyword2'],
        'pillar': 'care'
    }
}
\`\`\`

**Modify Mira's Pick priority:**
Edit the \`get_smart_recommendations()\` function, specifically the "Create Mira's Picks" section.`
        },
        {
          title: 'Frontend Display (MiraPicksCard)',
          content: `The \`MiraPicksCard.jsx\` component displays recommendations:

**Features:**
• Gradient header with Mira's avatar
• Product cards with images, prices, and "reason" badge
• "View All" link to shop
• Shimmer loading state

**Usage:**
\`\`\`jsx
import MiraPicksCard from '../components/MiraPicksCard';

<MiraPicksCard 
  recommendations={smartData}
  petName="Max"
  loading={isLoading}
/>
\`\`\`

**Data Requirements:**
• \`recommendations.mira_picks\` - Array of products
• \`recommendations.insights\` - Array of tip strings
• \`recommendations.upcoming_events\` - Birthday alerts`
        }
      ]
    }
  };

  // Get current doc or default
  const currentDoc = docs[selectedDoc] || docs['command-center'];

  // Filter items based on search
  const filteredSections = Object.entries(sections).map(([key, section]) => ({
    ...section,
    key,
    items: section.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              onClick={() => window.location.href = '/admin'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div className="h-6 w-px bg-white/30" />
            <div className="flex items-center gap-2">
              <Book className="w-6 h-6" />
              <h1 className="text-xl font-bold">Admin Panel Documentation</h1>
            </div>
          </div>
          <Badge className="bg-white/20 text-white">
            The Doggy Company®
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r min-h-screen p-4 sticky top-0">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search docs..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {filteredSections.map(section => (
              <div key={section.key}>
                <button
                  onClick={() => toggleSection(section.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left font-medium transition-colors ${
                    expandedSections.includes(section.key) 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-6 h-6 rounded ${section.color} flex items-center justify-center`}>
                    <section.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="flex-1">{section.title}</span>
                  {expandedSections.includes(section.key) 
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                  }
                </button>
                
                {expandedSections.includes(section.key) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {section.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedDoc(item.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                          selectedDoc === item.id
                            ? 'bg-purple-100 text-purple-700 font-medium'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl">
            {/* Doc Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{currentDoc.title}</h1>
                {currentDoc.badge && (
                  <Badge className="bg-yellow-100 text-yellow-800">{currentDoc.badge}</Badge>
                )}
              </div>
              <p className="text-lg text-gray-600">{currentDoc.subtitle}</p>
            </div>

            {/* File References */}
            {currentDoc.files && (
              <Card className="p-4 mb-6 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  File References
                </h3>
                <div className="space-y-1">
                  {currentDoc.files.frontend && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">Frontend</Badge>
                      <code className="bg-white px-2 py-0.5 rounded text-purple-600 flex-1">
                        {currentDoc.files.frontend}
                      </code>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(currentDoc.files.frontend)}
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  )}
                  {currentDoc.files.backend && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">Backend</Badge>
                      <code className="bg-white px-2 py-0.5 rounded text-blue-600 flex-1">
                        {currentDoc.files.backend}
                      </code>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(currentDoc.files.backend)}
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Doc Sections */}
            <div className="space-y-6">
              {currentDoc.sections?.map((section, idx) => (
                <Card key={idx} className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">
                      {idx + 1}
                    </div>
                    {section.title}
                  </h2>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {section.content}
                    </pre>
                  </div>
                </Card>
              ))}
            </div>

            {/* Quick Reference */}
            <Card className="p-6 mt-8 bg-gradient-to-r from-purple-50 to-pink-50">
              <h2 className="text-xl font-semibold mb-4">📚 Quick Reference</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Key Constants</h3>
                  <code className="block bg-white p-3 rounded text-xs">
{`// SLA Hours
SLA_HOURS = {
  urgent: 2,
  high: 4,
  medium: 24,
  low: 48
}

// Pet Pass Format
PET_PASS = "TDC-XXXXXX"`}
                  </code>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Important Collections</h3>
                  <code className="block bg-white p-3 rounded text-xs">
{`users              # Members
pets               # Pet profiles
orders             # Orders
tickets            # Manual tickets
service_desk_tickets  # Mira tickets
mira_memories      # AI memories
enhanced_collections  # Campaigns`}
                  </code>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDocs;
