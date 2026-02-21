# MIRA OS - Component Inventory Table
## Created: February 13, 2026 - Header Shell Implementation

---

## COMPONENT INVENTORY (from MiraDemoPage.jsx)

| Component | What it shows | Pet-specific | Time-bound | Suggestions/Picks | Tickets/Execution | Analytics/History | API Dependency | **DIMENSION** |
|-----------|---------------|--------------|------------|-------------------|-------------------|-------------------|----------------|---------------|
| **PetSelector** | Pet photo, name, breed, soul score | ✅ YES | ❌ NO | ❌ NO | ❌ NO | ❌ NO | `/api/pets/my-pets` | **context** |
| **SoulKnowledgeTicker** | Soul score %, knowledge items (diet, health, breed traits) | ✅ YES | ❌ NO | ❌ NO | ❌ NO | ❌ NO | `/api/pet-soul/profile/{pet_id}` | **context** |
| **NotificationBell** | Unread notification count | ❌ User-wide | ✅ YES | ❌ NO | ❌ NO | ❌ NO | `/api/notifications` | **time** |
| **ProactiveAlertsBanner** | Smart reminders (vaccinations, grooming, birthdays) | ✅ YES | ✅ YES | ❌ NO | ❌ NO | ❌ NO | `/api/mira/proactive/{pet_id}` | **time** |
| **WelcomeHero** | Greeting, weather, quick actions, proactive alerts | ✅ YES | ✅ YES | ✅ YES | ❌ NO | ❌ NO | Multiple | **time** |
| **QuickReplies** | Contextual suggestions after Mira response | ✅ YES | ❌ NO | ✅ YES | ❌ NO | ❌ NO | From chat response | **intelligence** |
| **UnifiedPicksVault** | Conversation picks, tips, personalized picks | ✅ YES | ❌ NO | ✅ YES | ❌ NO | ❌ NO | `/api/mira/top-picks` | **intelligence** |
| **PersonalizedPicksPanel** | Full top picks list | ✅ YES | ❌ NO | ✅ YES | ❌ NO | ❌ NO | `/api/mira/top-picks` | **intelligence** |
| **ChatMessage** | Conversation messages | ✅ YES | ❌ NO | ❌ NO | ❌ NO | ❌ NO | `/api/mira/chat` | **execution** |
| **ChatInputBar** | Message input, voice, send | ✅ YES | ❌ NO | ❌ NO | ✅ YES | ❌ NO | `/api/mira/chat` | **execution** |
| **ConciergePanel** | Concierge handoff, contact options | ✅ YES | ❌ NO | ❌ NO | ✅ YES | ❌ NO | `/api/mira/concierge` | **human** |
| **ConciergeConfirmation** | Service request confirmation banner | ✅ YES | ❌ NO | ❌ NO | ✅ YES | ❌ NO | From chat response | **execution** |
| **HandoffSummary** | Service request summary before handoff | ✅ YES | ❌ NO | ❌ NO | ✅ YES | ❌ NO | From chat response | **human** |
| **ServiceRequestModal** | Service request form | ✅ YES | ❌ NO | ❌ NO | ✅ YES | ❌ NO | `/api/mira/service-request` | **execution** |
| **InsightsPanel** | Conversation insights, tip cards | ✅ YES | ❌ NO | ❌ NO | ❌ NO | ✅ YES | From conversation | **pattern** |
| **PastChatsPanel** | Previous chat sessions | ❌ User-wide | ❌ NO | ❌ NO | ❌ NO | ✅ YES | `/api/mira/sessions` | **pattern** |
| **LearnModal** | Training videos, guides library | ✅ YES | ❌ NO | ❌ NO | ❌ NO | ❌ NO | `/api/mira/youtube/videos` | **knowledge** |
| **HelpModal** | Help topics, FAQ | ❌ User-wide | ❌ NO | ❌ NO | ❌ NO | ❌ NO | Static | **knowledge** |
| **SoulFormModal** | Soul questions form | ✅ YES | ❌ NO | ❌ NO | ❌ NO | ❌ NO | `/api/pet-soul/questions` | **context** |
| **HealthVaultWizard** | Health records wizard | ✅ YES | ❌ NO | ❌ NO | ❌ NO | ❌ NO | `/api/health-vault` | **context** |
| **NavigationDock** | Bottom nav (help, learn, soul) | ❌ User-wide | ❌ NO | ❌ NO | ❌ NO | ❌ NO | None | **navigation** |
| **FloatingActionBar** | History, insights, concierge, new chat buttons | ❌ User-wide | ❌ NO | ❌ NO | ❌ NO | ❌ NO | None | **navigation** |
| **MiraTray** | Mira quick actions tray | ✅ YES | ❌ NO | ✅ YES | ❌ NO | ❌ NO | None | **intelligence** |
| **MiraLoader** | Processing indicator | ❌ N/A | ❌ NO | ❌ NO | ❌ NO | ❌ NO | None | **execution** |
| **ScrollToBottomButton** | Scroll control | ❌ N/A | ❌ NO | ❌ NO | ❌ NO | ❌ NO | None | **navigation** |
| **MemoryWhisper** | Memory context display | ✅ YES | ❌ NO | ❌ NO | ❌ NO | ❌ NO | From chat | **context** |
| **VaultManager** | Vault data management | ✅ YES | ❌ NO | ✅ YES | ❌ NO | ❌ NO | Multiple | **intelligence** |
| **TestScenariosPanel** | Dev testing panel | ❌ N/A | ❌ NO | ❌ NO | ❌ NO | ❌ NO | None | **dev** |

---

## HEADER SHELL MAPPING

### 1. MOJO (Pet Context) - `dimension: context`
> "Who are we talking about?"

| Component | Notes |
|-----------|-------|
| PetSelector | Pet photo, name, breed selector |
| SoulKnowledgeTicker | Soul score, knowledge items, traits |
| MemoryWhisper | Memory context display |
| SoulFormModal | Soul questions (triggered from Mojo) |
| HealthVaultWizard | Health records (triggered from Mojo) |

### 2. TODAY (Temporal) - `dimension: time`
> "What matters now?"

| Component | Notes |
|-----------|-------|
| NotificationBell | Unread count |
| ProactiveAlertsBanner | Smart reminders |
| WelcomeHero (partial) | Time-bound sections only |

### 3. PICKS (Intelligence) - `dimension: intelligence`
> "What should we do next?"

| Component | Notes |
|-----------|-------|
| QuickReplies | Contextual suggestions |
| UnifiedPicksVault | Picks, tips |
| PersonalizedPicksPanel | Full top picks |
| MiraTray | Quick actions |
| VaultManager | Vault data |

### 4. SERVICES (Execution) - `dimension: execution`
> "What are we arranging/completing?"

| Component | Notes |
|-----------|-------|
| ChatMessage | Conversation messages |
| ChatInputBar | Input bar |
| ServiceRequestModal | Service request form |
| ConciergeConfirmation | Confirmation banner |
| MiraLoader | Processing indicator |

### 5. INSIGHTS (Patterns) - `dimension: pattern`
> "What patterns exist?"

| Component | Notes |
|-----------|-------|
| InsightsPanel | Conversation insights |
| PastChatsPanel | Chat history |

### 6. LEARN (Knowledge) - `dimension: knowledge`
> "What do we understand?"

| Component | Notes |
|-----------|-------|
| LearnModal | Training videos, guides |
| HelpModal | FAQ, help topics |

### 7. CONCIERGE (Human Layer) - `dimension: human`
> "When humans step in?"

| Component | Notes |
|-----------|-------|
| ConciergePanel | Concierge handoff |
| HandoffSummary | Request summary |

---

## IMPLEMENTATION NOTES

1. **Dual Placement Rule**: Components appear in both their original location AND the relevant header tab initially
2. **Dimension Config**: Each component declares `component_dimension` and `component_surface`
3. **Mobile-First**: Headers render as horizontal chips/tabs on mobile
4. **No Redesign**: Visual appearance stays exactly the same
