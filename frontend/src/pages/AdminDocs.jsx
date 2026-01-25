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
  const [expandedSections, setExpandedSections] = useState(['core-tools']);
  const [selectedDoc, setSelectedDoc] = useState('command-center');
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
      ]
    },
    'pillar-tools': {
      title: 'Pillar Tools (14 Pillars)',
      icon: Sparkles,
      color: 'bg-pink-500',
      items: [
        { id: 'seed-all', title: 'Seed All', icon: Database },
        { id: 'seed-production', title: 'Seed Production 🆕', icon: Database },
        { id: 'celebrate', title: '🎉 Celebrate', icon: Gift },
        { id: 'dine', title: '🍽️ Dine', icon: UtensilsCrossed },
        { id: 'stay', title: '🏨 Stay', icon: Building },
        { id: 'travel', title: '✈️ Travel', icon: Plane },
        { id: 'care', title: '🩺 Care', icon: Stethoscope },
        { id: 'enjoy', title: '🎈 Enjoy', icon: PartyPopper },
        { id: 'fit', title: '🏃 Fit', icon: Dumbbell },
        { id: 'learn', title: '📚 Learn', icon: Book },
        { id: 'paperwork', title: '📋 Paperwork', icon: FileText },
        { id: 'advisory', title: '⚖️ Advisory', icon: FileText },
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
    'command-center': {
      title: 'Command Center',
      subtitle: 'The "All-Seeing Eye" - Central Hub for Concierge Operations',
      badge: '⭐ Most Important',
      files: {
        frontend: '/app/frontend/src/components/admin/ConciergeCommandCenter.jsx',
        backend: '/app/backend/concierge_routes.py, /app/backend/ticket_intelligence.py'
      },
      sections: [
        {
          title: 'What It Contains',
          content: `• **Unified Queue**: ALL tickets from all sources in one place
• **Real-time Event Stream**: Live business activity feed (slide-out panel)
• **360° Member Profile**: Complete customer view (clickable)
• **Mira's Intelligence**: AI-powered insights per ticket
• **Omni-Channel Reply**: Respond via Mira, Email, WhatsApp
• **SLA Timers**: Real-time countdown with breach alerts
• **Bulk Actions**: Select multiple tickets for mass operations
• **Sentiment Analysis** 🆕: AI analyzes incoming requests (😊😐😠🆘😡)
• **Ticket Merge** 🆕: Merge duplicate tickets from same member
• **NPS Surveys** 🆕: Automatic satisfaction surveys on resolution`
        },
        {
          title: 'Ticket Sources',
          content: `| Source | Collection | Description |
|--------|------------|-------------|
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
          content: `• Concierge & Mira AI
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
      subtitle: 'AI Concierge Configuration & Behavior Guidelines',
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
• **Expertise**: All 14 pillars of pet life
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
      badge: '🆕 Updated Jan 2026',
      files: {
        frontend: '/app/frontend/src/pages/MembershipPage.jsx, /app/frontend/src/components/PetPassCard.jsx',
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
          title: 'Member Tiers',
          content: `| Tier | Emoji | How to Achieve |
|------|-------|----------------|
| Curious Pup | 🐕 | New members |
| Loyal Companion | 🦮 | 2+ pillars used OR 3+ months |
| Trusted Guardian | 🛡️ | 5+ pillars used OR 6+ months |
| Pack Leader | 👑 | 8+ pillars used OR 12+ months |`
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
• Customer recognized automatically
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
