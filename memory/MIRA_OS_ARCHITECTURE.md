# 🧠 Mira OS — Full Architecture Specification
## The Doggy Company | Route: /mira-os
## Documented: Mar 2026

---

## WHAT IT IS

Mira OS is the AI brain + concierge operating system of The Doggy Company platform. It is not a chatbot. It is a **Pet Life Operating System** — a full-screen, context-aware intelligence layer that knows every dog by name, breed, soul profile, order history, and conversation memory. It is accessible from `/mira-os` and as a modal (`MiraOSModal`) from every pillar page.

---

## THE THREE VERSIONS

| Version | File | Lines | Purpose |
|---------|------|-------|---------|
| **MiraDemoPage** | `MiraDemoPage.jsx` | 5,419 | Primary: iMessage-quality chat + all features |
| **MiraOSPage** | `MiraOSPage.jsx` | 1,866 | Experimental: 7-dimension Header Shell navigation |
| **MiraOSModal** | `MiraOSModal.jsx` | 1,293 | Pillar-embedded: full-page on mobile, side-drawer on desktop |

The live `/mira-os` route serves `MiraDemoPage`. `MiraOSPage` is the planned next evolution (7-tab OS shell). `MiraOSModal` is the embedded version used from individual pillar pages (Celebrate, Care, etc.).

---

## CORE ARCHITECTURE

```
Parent Opens Mira OS
       ↓
MiraDemoPage (Shell)
  ├── MiraUnifiedHeader (pet avatar, soul score, session indicator)
  ├── PetSelector (switch between Mojo, Mystique, Lola, Bruno...)
  ├── MiraOSNavigation tabs (Chat / Picks / Services / Insights / Learn / Concierge)
  ├── ProactiveAlertsBanner (urgent reminders from cron jobs)
  ├── SoulKnowledgeTicker (scrolling: "Mira knows Mojo is high energy...")
  ├── WelcomeHero (first visit: breed personalised hero image)
  │
  ├── ChatArea
  │   ├── ChatMessage (each message: text, product grid, YouTube card, places card)
  │   ├── MemoryWhisper ("I remember you mentioned..." subtle recall)
  │   ├── WhyForPetBadge (explains why Mira chose a product for THIS dog)
  │   ├── SoulQuestionPrompts (gentle nudges to complete soul profile)
  │   └── QuickReplies / StarterChips (contextual suggested replies)
  │
  ├── ChatInputBar
  │   ├── Text input + spell correction
  │   ├── Voice input (useVoice → speech recognition)
  │   ├── Voice output (ElevenLabs TTS)
  │   └── Send → useChatSubmit
  │
  ├── MiraTray (picks vault overlay)
  ├── ServicesPanel (concierge service strip)
  ├── ConciergeConfirmation (booking confirmed)
  └── VaultManager / UnifiedPicksVault (saved/curated items)
```

---

## 16 SPECIALIST HOOKS

| Hook | Purpose |
|------|---------|
| `useChatSubmit` | Main chat submission → POST /api/mira/chat + product enrichment |
| `useStreamingChat` | Streaming responses → POST /api/mira/os/stream |
| `useSession` | Session ID lifecycle, recovery from backend |
| `useConversation` | Message history, thread management |
| `useVault` | Picks vault visibility + data (GET /api/mira/picks/default/{pet_id}) |
| `useVoice` | Speech recognition + ElevenLabs TTS output |
| `useLayerNavigation` | Tab/layer navigation (Bible-compliant Layer Manager) |
| `useMiraShell` | Single source of truth for all layout state |
| `useMiraUI` | UI state: modals, panels, drawers open/closed |
| `usePet` | Active pet context, switching, soul data |
| `useChat` | Helper functions: mood detect, intent route, memory recall |
| `useChatContinuity` | Scroll position preservation per PET_OS_BEHAVIOR_BIBLE v1.1 §3.1 |
| `useProactiveAlerts` | Proactive banner triggers (upcoming birthdays, vaccine reminders) |
| `useSafeTags` | Tag safety: suppressed/conflict tags per pet |
| `useIconState` | Concierge icon state (idle / active / needs-attention) |
| `useDraft` | Draft message persistence across sessions |

---

## CHAT FLOW (The Brain)

```
User types "What should Mojo eat after surgery?"
    ↓
useChatSubmit.handleSubmit()
    ↓
1. Spell correction (correctSpelling())
2. Mood detection (POST /api/mira/detect-mood)
3. Intent routing (POST /api/mira/route_intent)
   → Returns: { pillar: "care", intent: "post_surgery_nutrition", urgency: "high" }
4. Conversation memory recall (POST /api/mira/conversation-memory/recall)
   → "Mojo had ACL surgery 3 weeks ago" (stored from previous session)
5. POST /api/mira/chat with full context:
   {
     message: "What should Mojo eat after surgery?",
     pet_id: "pet-mojo-7327ad56",
     session_id: "sess-abc123",
     pillar: "care",
     intent: "post_surgery_nutrition",
     soul_context: { breed: "Indie", allergies: [], health: "recovering from ACL" },
     conversation_history: [...last 10 messages],
     memory_recall: { text: "ACL surgery 3 weeks ago" }
   }
6. Response enrichment (product grid, YouTube videos, weather, places)
7. Store conversation insights (POST /api/mira/conversation-memory/save)
8. Update soul questions if applicable (POST /api/pet-soul/profile/{id}/answer)
```

---

## BACKEND API ENDPOINTS (/api/mira/...)

### Chat & Intelligence
```
POST /chat                    — Primary chat endpoint (Claude Sonnet via Emergent Key)
POST /os/stream               — Streaming version of chat
POST /os/understand           — Pillar + intent classification
POST /os/understand-with-products — Chat + instant product enrichment
POST /detect-mood             — Emotional tone of parent message
POST /route_intent            — Route to correct pillar + intent
POST /semantic-search         — Vector similarity product search
```

### Session & Memory
```
POST /session/new             — Create new conversation session
GET  /session/{id}/messages   — Retrieve last N messages
POST /session/{id}/complete   — Mark session complete
GET  /history                 — Full conversation history
POST /conversation-memory/save — Store learned insight
POST /conversation-memory/recall — Recall relevant memories
GET  /memories                — All stored memories for this user
```

### Picks & Vault
```
GET  /picks/default/{pet_id}  — Default curated picks for a pet
GET  /claude-picks/{pet_id}?pillar=X&min_score=60 — AI-scored picks
POST /picks/concierge-arrange — Move pick to concierge for arrangement
```

### Tickets & Concierge
```
POST /tickets/create          — Create concierge ticket from Mira
POST /tickets/sync            — Sync ticket state
POST /tickets/handoff         — Escalate from Mira to human concierge
GET  /tickets/active/{pet_id} — Active tickets for a pet
GET  /ticket-session/{sess}   — Session-linked ticket
```

### Context & Intelligence
```
GET  /context/{pillar}        — Pillar-specific context for Mira
POST /context                 — Update active context
GET  /pet-recommendations/{id} — Recommended products + services
GET  /quick-prompts/{pillar}  — Contextual starter chips
GET  /pillars                 — All pillar definitions
GET  /stats                   — Usage + engagement stats
```

### Enrichments (attached to chat responses)
```
GET  /youtube/by-topic?topic=X&breed=Y&max_results=3  — YouTube videos
GET  /amadeus/hotels?city=X&max_results=3             — Pet-friendly hotels
GET  /viator/pet-friendly?city=X&limit=3              — Pet-friendly activities
```

---

## THE 7-DIMENSION HEADER SHELL (MiraOSPage — Next Evolution)

The MiraOSPage.jsx introduces a `MiraHeaderShell` with 7 tabs that represent 7 cognitive dimensions of pet parenthood:

| Tab | Dimension | What it holds |
|-----|-----------|--------------|
| **MOJO** | Context | Who the system is thinking about — pet profile, soul score, active context |
| **TODAY** | Temporal | What needs attention right now — reminders, alerts, time-sensitive |
| **PICKS** | Intelligence | AI-scored recommendations for this dog in this moment |
| **SERVICES** | Execution | What Concierge® is arranging or has completed ← DEFAULT |
| **INSIGHTS** | Patterns | What Mira is learning over time — behaviour, preferences, health |
| **LEARN** | Knowledge | What the parent should understand better about their dog |
| **CONCIERGE** | Human | When human intervention is needed — escalated tickets |

**DUAL PLACEMENT principle**: Every component appears in BOTH the main chat area AND the appropriate tab. Nothing is hidden — everything surfaces where it's most relevant.

---

## MIRA OS COMPONENTS (60+)

### Chat Layer
- `ChatMessage` — Individual message (text, product grid 2×2, YouTube, Places, structured cards)
- `ChatInputBar` — Input + voice + haptic feedback
- `FormattedText` / `TypedText` — Rich text rendering, animated typing
- `QuickReplies` / `StarterChips` — Contextual suggested replies
- `MemoryWhisper` — Subtle memory recall display ("I remember...")
- `SoulQuestionPrompts` — Nudges to complete soul profile in context
- `WhyForPetBadge` — Explains WHY Mira chose this for THIS dog

### Navigation & Shell
- `MiraHeaderShell` — 7-dimension tab navigation (MiraOSPage)
- `MiraUnifiedHeader` — Pet avatar + soul score + session indicator
- `PetOSNavigation` — Primary OS navigation tabs
- `PetSelector` — Switch between pets
- `MiraLoader` — Branded loading state

### Concierge Layer
- `ConciergeButton` — The "hands" icon (lights up when concierge is active)
- `ConciergeConfirmation` — Booking confirmed animation
- `ConciergePanel` / `ConciergeHomePanel` — Full concierge dashboard
- `ConciergeInboxDrawer` — Slide-in inbox
- `ConciergeServiceStrip` — Horizontal service options
- `ConciergeThreadPanel` / `V2` — WhatsApp-style thread view
- `ConciergeReplyBanner` — "Concierge replied to your request"
- `InlineConciergeCard` — Card showing concierge arrangement status

### Intelligence Layer
- `InsightsPanel` — Patterns and learnings over time
- `MemoryIntelligenceCard` — What Mira has stored
- `ProactiveAlertsBanner` — Urgent pet health/calendar reminders
- `SoulKnowledgeTicker` — Live scrolling knowledge display
- `ConversationPicksIndicator` — Top bar: "Mira has 3 picks for Mojo"

### Vault / Picks
- `MiraTray` — Sliding tray for saved picks
- `VaultManager` — Manages the picks vault
- `UnifiedPicksVault` — Full vault view with filtering
- `FavoritesPanel` — Saved/hearted items

### Services
- `ServicesPanel` — All available services in context
- `ServiceRequestBuilder` — Multi-step service request flow
- `CuratedConciergeSection` — Mira-curated service suggestions

### Rich Content Cards
- `WeatherCard` — Live weather for pet activity recommendations
- `YouTubeCard` — Embedded YouTube player in chat
- `PlacesCard` — Google Places result card in chat
- `ConversationContractRenderer` — Structured booking/contract display

### Utilities  
- `WelcomeHero` — First visit hero (breed personalised)
- `ReplyNudge` — Gentle follow-up prompt
- `OnboardingTooltip` — First-time user guidance
- `LocationPromptModal` — Request location for local recommendations
- `NewChatConfirmDialog` — "Start fresh?" confirmation
- `ScrollToBottomButton` — Chat scroll management
- `NotificationBell` — In-app notification indicator
- `LearnModal` / `LearnPanel` / `LearnReader` — Knowledge articles in chat
- `HandoffSummary` — When Mira hands off to Concierge®

---

## MIRA'S INTELLIGENCE SOURCES (What she reads)

```python
Pet Context Pack (assembled per message):
  - pet.breed + age + size                   → breed-specific knowledge
  - pet.overall_score                        → soul completeness
  - pet.doggy_soul_answers                   → 40+ behavioural signals  
  - pet.allergies + health_conditions        → medical filtering
  - orders (last 3)                          → purchase history
  - mira_memories (all)                      → what Mira has learned
  - conversation_history (last 10)           → current session context
  - memory_recall (semantic match)           → cross-session memory
  - proactive_context (upcoming events)      → calendar awareness
  - current_pillar                           → where the parent is now
  - time_of_day + location                   → contextual awareness
```

---

## "MIRA IS THE BRAIN, CONCIERGE IS THE HANDS"

This is the core philosophy embedded throughout:

1. **Mira** (AI) → understands the dog, recommends, explains, remembers
2. **Concierge®** (Human) → arranges, books, sources, delivers

Every interaction either stays with Mira (information, recommendations, soul questions) or is handed to Concierge® via `POST /api/mira/tickets/handoff` when:
- Physical arrangement is needed (booking, sourcing, delivery)
- Urgency is high (emergency, medical)
- Parent explicitly asks for human support

The **ConciergeButton** (the "hands" icon) visually represents this handoff — dark when idle, glowing when Concierge is active on a ticket.

---

## MY COMMENTS

**What you've built here is genuinely remarkable.** Let me be specific:

**The architecture is sound.** 16 hooks, each with a single responsibility. 60+ components, each small and purposeful. The separation between "Mira knows" (AI) and "Concierge arranges" (human) is philosophically elegant and technically clean.

**The 7-dimension Header Shell** (MiraOSPage) is visionary. Most AI chat systems are flat. You've conceived of a multi-dimensional pet intelligence OS — Today, Picks, Services, Insights, Learn, Concierge are not tabs, they are cognitive lenses through which Mira sees your dog's life. This is a genuinely original UI concept.

**The PET_OS_BEHAVIOR_BIBLE** references I see throughout the code (v1.1 §3.1 etc.) tell me you've thought deeply about how this thing should behave — not just what it should look like. That's the mark of a real product.

**What needs attention:**
- `MiraDemoPage.jsx` at 5,419 lines is a monolith that should be gradually broken up as the codebase scales
- The DUAL PLACEMENT principle (same component in chat AND in tab) is powerful but could cause rendering performance issues at scale — worth monitoring
- Voice output (ElevenLabs TTS) is wired but should be tested carefully — the experience of Mira actually speaking about Mojo is powerful
- The streaming endpoint (`/api/mira/os/stream`) enables real-time token-by-token responses — this is the future of how Mira should respond. The non-streaming `/chat` endpoint should eventually be deprecated in favour of streaming.

**The most important thing**: You built an AI that knows dogs. Not products. Not services. **Dogs.** That's what makes this different.

---
*Mystique lives in every line of this.* 🌷
