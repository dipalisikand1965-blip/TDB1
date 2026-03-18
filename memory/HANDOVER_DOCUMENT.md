# MIRA OS - EXHAUSTIVE HANDOVER DOCUMENT
## Complete System Documentation for New Agents
### Last Updated: February 14, 2026

---

# QUICK REFERENCE

## Critical URLs
| Resource | URL |
|----------|-----|
| **Mira OS** | `/mira-demo` (THE MAIN OS - NOT `/mira`) |
| **Admin Panel** | `/admin` |
| **Member Dashboard** | `/member-dashboard` or `/my-pets` |
| **Preview** | `https://play-layout-fix.preview.emergentagent.com` |

## Test Credentials
| Role | Email/Username | Password |
|------|----------------|----------|
| **User** | `dipali@clubconcierge.in` | `test123` |
| **Admin** | `aditya` | `lola4304` |

## Test Pets (Owner: dipali@clubconcierge.in)
| Pet | Breed | Soul Score | Notes |
|-----|-------|------------|-------|
| Lola | Maltese | 52% | Primary test pet |
| Mystique | Shihtzu | 72% | Good for testing |
| Bruno | Labrador | 29% | Low score pet |
| Luna | Golden Retriever | 88% | Highest soul score |
| Buddy | Golden Retriever | 41% | Mid-range |
| Meister | Shih Tzu | 23% | Low score |
| TestScoring | Labrador Retriever | 100% | Full score test |

---

# PART 1: SYSTEM PHILOSOPHY

## Core Concepts
- **MOJO** = Pet's Passport/DNA - Single source of truth about the pet
- **Mira** = Pet's Soul - AI intelligence that knows the pet
- **Concierge®** = Pet's Hands - Human execution layer

## The OS Equation
> MOJO feeds ALL other layers
> If MOJO is strong → Mira becomes an OS
> If MOJO is weak → Mira becomes just a chatbot

---

# PART 2: ARCHITECTURE OVERVIEW

## Frontend Structure
```
/app/frontend/src/
├── pages/
│   ├── MiraDemoPage.jsx      # MAIN OS ENTRY (/mira-demo)
│   ├── MemberDashboard.jsx   # Member profile page
│   ├── MyPets.jsx            # Pet management
│   ├── CelebratePage.jsx     # Celebrate pillar
│   ├── StayPage.jsx          # Stay pillar
│   ├── TravelPage.jsx        # Travel pillar
│   ├── CarePage.jsx          # Care pillar
│   ├── DinePage.jsx          # Dine pillar
│   └── ... (14 pillar pages total)
├── components/Mira/
│   ├── MojoProfileModal.jsx      # Pet identity modal (1800+ lines)
│   ├── MojoSectionEditors.jsx    # 10 inline editor components
│   ├── PetOSNavigation.jsx       # 7-layer OS nav bar
│   ├── SoulKnowledgeTicker.jsx   # Scrolling knowledge ticker
│   ├── SoulFormModal.jsx         # Soul questionnaire
│   ├── MiraChatWidget.jsx        # AI chat interface
│   └── WelcomeHero.jsx           # Welcome section with weather
└── components/ui/                # Shadcn UI components
```

## Backend Structure
```
/app/backend/
├── server.py                 # FastAPI main entry
├── pet_soul_routes.py        # MOJO data CRUD (Line 551: bulk answers)
├── mira_routes.py            # Main Mira chat API (20,000+ lines)
├── soul_first_logic.py       # Soul score calculations
├── unified_flow.py           # Service ticket flow
├── celebrate_routes.py       # Celebrate pillar
├── travel_routes.py          # Travel pillar
├── care_routes.py            # Care pillar
└── ... (14 pillar routes)
```

## Database Collections
| Collection | Purpose |
|------------|---------|
| `pets` | Pet profiles with MOJO data (doggy_soul_answers) |
| `users` | Member profiles |
| `admin_notifications` | Bell notifications |
| `service_desk_tickets` | Command center tickets |
| `channel_intakes` | Unified inbox |

---

# PART 3: MOJO IMPLEMENTATION STATUS (98%) ✅

## CRITICAL: Two-Way Memory-Soul Sync
**READ THIS FIRST: Every conversation updates MOJO automatically!**

```
User says "Lola is allergic to chicken"
     ↓
extract_soul_data_from_response() → finds allergy
     ↓
write_soul_data_to_pet() → saves to doggy_soul_answers.food_allergies
     ↓
Next chat: load_pet_soul() → loads updated profile
     ↓
Mira knows: "Never recommend chicken for Lola"
```

**Code Location:** `/app/backend/mira_routes.py` lines 11414-11455

## Component Scores
| Component | Score | Editor Component |
|-----------|-------|------------------|
| Pet Snapshot | 100% | BasicDetailsEditor |
| Soul Profile | 79% | SoulProfileEditor |
| Health Vault | 98% | HealthProfileEditor |
| Diet Profile | 90% | DietProfileEditor |
| Behaviour Profile | 78% | BehaviourProfileEditor |
| Grooming Profile | 88% | GroomingProfileEditor |
| Routine Profile | 100% | RoutineProfileEditor |
| Environment | 81% | EnvironmentProfileEditor |
| Preferences | 100% | PreferencesProfileEditor |
| **Life Timeline** | **100%** | **API + TimelineProfileContent** ✅ |
| Documents Vault | 100% | /paperwork integration |
| Membership | 100% | Built-in |

## Life Timeline API (NEW - Feb 14, 2026)
- `GET /api/pet-soul/profile/{pet_id}/life-timeline` - Aggregates all events
- `POST /api/pet-soul/profile/{pet_id}/timeline-event` - Add manual event
- `DELETE /api/pet-soul/profile/{pet_id}/timeline-event/{event_id}` - Remove

## TODAY Panel (95%) ✅
- Urgent Stack, Due Soon Cards, Environment Alerts, Active Tasks, Documents, Other Pets
- Mobile bottom sheet with 48px touch targets
- File: `/app/frontend/src/components/Mira/TodayPanel.jsx`

## Remaining Gaps to 100%
1. **Trait Graph (60%)**: Service outcomes → MOJO feedback loop not built

---

# PART 4: KEY API ENDPOINTS

## Pet & MOJO APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Returns `access_token` |
| `/api/pets/my-pets` | GET | List all user's pets |
| `/api/pets/{pet_id}` | GET | Full pet profile with doggy_soul_answers |
| `/api/pet-soul/profile/{pet_id}/answers/bulk` | POST | Save MOJO data |
| `/api/mira/personalization-stats/{pet_id}` | GET | Soul scores |
| `/api/member/profile?user_email=X` | GET | Membership, paw points |
| `/api/pet-photo/{pet_id}` | GET | Pet photo |

## Mira Chat APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mira/chat` | POST | Main AI chat |
| `/api/mira/pet/{pet_id}/what-mira-knows` | GET | Soul knowledge items |
| `/api/pet-soul/quick-questions/{pet_id}` | GET | Proactive soul questions |

## Pillar APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/celebrate/requests` | POST | Create celebration request |
| `/api/travel/requests` | POST | Create travel request |
| `/api/care/requests` | POST | Create care request |
| `/api/paperwork/documents/{pet_id}` | GET | Get pet documents |

---

# PART 5: KEY FEATURES

## 1. Auto-Save System
- All 9 MOJO editors use `useAutoSave` hook
- Debounce: 1.5 seconds
- Status indicator: pending → saving → saved → idle
- No manual save button needed

## 2. Two-Way Memory-Soul Sync
- Chat conversations automatically update pet soul
- Data extraction from natural language
- Enrichment history tracked with confidence scores
- Function: `extract_soul_data_from_response()` in `soul_first_logic.py`

## 3. Dynamic MOJO System
- Soul score updates in real-time
- Paw points awarded for new answers (+10 per question)
- Achievement badges awarded automatically

## 4. Confidence Scores
- `doggy_soul_meta` tracks source and confidence
- "MIRA LEARNED" badge for AI-inferred data
- Direct input = 100% confidence
- Chat-inferred = 75-90% confidence

## 5. Pet Context Loading
- `soul_first_logic.py` builds context pack
- Memory loaded before every Mira response
- Pet switching updates entire OS context

---

# PART 6: THE 14 PILLARS

## Service Pillars
| Pillar | Route File | URL | Unified Flow |
|--------|------------|-----|--------------|
| Celebrate | celebrate_routes.py | /celebrate | ✅ |
| Dine | dine_routes.py | /dine | ✅ |
| Stay | stay_routes.py | /stay | ⚠️ Partial |
| Travel | travel_routes.py | /travel | ✅ |
| Care | care_routes.py | /care | ✅ |
| Enjoy | enjoy_routes.py | /enjoy | ❌ Missing |
| Fit | fit_routes.py | /fit | ✅ |
| Learn | learn_routes.py | /learn | ✅ |
| Paperwork | paperwork_routes.py | /paperwork | ❌ Missing |
| Advisory | advisory_routes.py | /advisory | ❌ Missing |
| Emergency | emergency_routes.py | /emergency | ❌ Missing |
| Farewell | farewell_routes.py | /farewell | ❌ Missing |
| Adopt | adopt_routes.py | /adopt | ❌ Missing |
| Shop | shop_routes.py | /shop | ⚠️ Partial |

## Unified Flow Definition
Every service request should create:
1. **NOTIFICATION** → `admin_notifications` (Bell alert)
2. **TICKET** → `service_desk_tickets` (Command center)
3. **INBOX** → `channel_intakes` (Unified inbox)

---

# PART 7: KNOWN ISSUES & BUGS

## P0 - Critical
| Issue | Status | Notes |
|-------|--------|-------|
| MOJO Modal Header static "MOJO" | ✅ FIXED | Now shows pet name dynamically |

## P2 - Medium Priority
| Issue | Status | Notes |
|-------|--------|-------|
| `/api/orders` 405 error | ❌ Open | Orders endpoint returns Method Not Allowed |
| Markdown rendering in chat | ❌ Open | Shows as plain text |
| Missing unified flow (6 pillars) | ❌ Open | Enjoy, Emergency, Farewell, Adopt, Advisory, Paperwork |

---

# PART 8: OS LAYERS STATUS

## Current OS Score: 63%

| Layer | Score | Status |
|-------|-------|--------|
| MOJO (14 components) | 94% | ✅ Nearly complete |
| TODAY | 85% | ✅ Panel complete with weather, reminders, birthday |
| PICKS | 45% | ⚠️ No auto-refresh on chat |
| SERVICES | 40% | ⚠️ Basic implementation |
| INSIGHTS | 0% | ❌ Not built |
| LEARN | 10% | ❌ Minimal |
| CONCIERGE | 30% | ⚠️ WhatsApp only |

---

# PART 9: DOCUMENTATION REFERENCES

## Essential Documents
| Document | Purpose |
|----------|---------|
| `/app/memory/MOJO_BIBLE.md` | Complete MOJO definition (28 parts) |
| `/app/memory/MOJO_BIBLE_SCORECARD.md` | Implementation scores |
| `/app/memory/SYSTEM_AUDIT_REPORT.md` | Full system audit |
| `/app/memory/PRD.md` | Product requirements |

## Session Documents
| Document | Purpose |
|----------|---------|
| `/app/memory/HANDOVER_FEB14_2026.md` | Previous session handover |
| `/app/test_reports/iteration_*.json` | Test reports |

---

# PART 10: NEXT PRIORITIES

## To Complete MOJO 100%
1. **Life Timeline (67% → 100%)**: Integrate past services/purchases
2. **Trait Graph service**: Service outcomes → MOJO feedback loop
   - ✅ Weight history: COMPLETED (Feb 14, 2026)

## TODAY Tab Status - COMPLETED ✅
- ✅ Weather alerts with safety badges (SAFE/CAUTION/DANGER)
- ✅ Birthday countdown (shows within 30 days)
- ✅ Vaccination reminders from Health Vault
- ✅ Grooming cadence reminders
- ✅ Other pets summary
- ⚠️ Active tasks from service tickets (framework ready, needs API refinement)

## To Complete OS Loop
1. PICKS auto-refresh after every chat turn
2. Task creation from Pick tap
3. Service outcomes update MOJO

---

# PART 11: CODE PATTERNS

## Adding New MOJO Field
1. Add field to editor in `MojoSectionEditors.jsx`
2. Backend accepts it automatically (flexible schema)
3. Update scorecard in `MOJO_BIBLE_SCORECARD.md`

## Auto-Save Hook Usage
```javascript
import { useAutoSave, AutoSaveIndicator } from './MojoSectionEditors';

const { status, trigger } = useAutoSave(formData, async (data) => {
  await onSave(data);
}, hasChanges);

return (
  <div>
    <AutoSaveIndicator status={status} />
    {/* form fields */}
  </div>
);
```

## API Call Pattern
```javascript
const headers = { 'Content-Type': 'application/json' };
if (token) headers['Authorization'] = `Bearer ${token}`;

const response = await fetch(`${apiUrl}/api/pet-soul/profile/${petId}/answers/bulk`, {
  method: 'POST',
  headers,
  body: JSON.stringify(data)
});
```

---

# PART 12: TESTING CHECKLIST

## After Any MOJO Changes
- [ ] Open MOJO modal on /mira-demo
- [ ] Edit a section
- [ ] Verify auto-save indicator
- [ ] Check data persists after refresh
- [ ] Verify soul score recalculates

## After Pillar Changes
- [ ] Submit a service request
- [ ] Check admin notification bell
- [ ] Verify ticket in service desk
- [ ] Check unified inbox entry

## After Chat Changes
- [ ] Test two-way memory sync
- [ ] Mention an allergy in chat
- [ ] Verify it appears in MOJO Health Vault
- [ ] Check confidence score on new data

---

*Generated: February 14, 2026*
*Status: EXHAUSTIVE HANDOVER COMPLETE*
