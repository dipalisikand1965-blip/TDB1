# MiraDemoPage.jsx Refactoring Audit

**File:** `/app/frontend/src/pages/MiraDemoPage.jsx`  
**Lines:** 4,300  
**Last Audit:** February 12, 2026

---

## Executive Summary

The file is **critically large** but has already been partially refactored. Many UI components have been extracted (marked ✅). The remaining bulk is **business logic and state management** that needs careful extraction.

---

## Current Architecture

### Already Extracted Components ✅
These components are already imported and used:
| Component | Purpose | Lines Saved |
|-----------|---------|-------------|
| `WelcomeHero` | Welcome screen with pet avatar, features | ~200 |
| `ChatMessage` | Message rendering with all card types | ~400 |
| `ChatInputBar` | Input composer with voice | ~150 |
| `MiraTray` | Picks tray overlay | ~200 |
| `PetSelector` | Pet dropdown selector | ~100 |
| `NavigationDock` | Top navigation icons | ~80 |
| `FloatingActionBar` | FAB with actions | ~60 |
| `MiraLoader` | Processing indicator | ~50 |
| `ScrollToBottomButton` | Scroll button | ~30 |
| `QuickReplies` | Quick reply chips | ~80 |
| `SoulKnowledgeTicker` | Soul score ticker | ~400 |
| `ConciergePanel` | Concierge options (lazy) | ~80 |
| `InsightsPanel` | Insights panel (lazy) | ~100 |
| `PastChatsPanel` | Past chats (lazy) | ~100 |
| `HandoffSummary` | Handoff modal (lazy) | ~150 |
| `ServiceRequestModal` | Service form (lazy) | ~200 |
| `PersonalizedPicksPanel` | Top picks (lazy) | ~300 |
| `SoulFormModal` | Soul form (lazy) | ~200 |

**Total Already Extracted:** ~2,880 lines (in separate files)

---

## What Remains in MiraDemoPage.jsx (4,300 lines)

### 1. State Declarations (Lines 199-800) - ~600 lines
**60+ useState hooks** for:
- UI toggles (modals, panels, processing)
- Conversation state (history, context, stage)
- Pet data (current pet, all pets)
- Feature flags (voice, proactive alerts)
- Business logic (tickets, sessions, picks)

**Recommendation:** Group into custom hooks

---

### 2. useEffect Blocks (Lines 274-1455) - ~1,200 lines
| Effect | Purpose | Lines |
|--------|---------|-------|
| Page initialization | Load pets, sessions | ~100 |
| Pet switching | Reset state on pet change | ~50 |
| Proactive alerts | Fetch birthdays, health | ~50 |
| Geo location | Get user location | ~80 |
| Pet data sync | Fetch from API | ~200 |
| Session management | Auto-save, archive | ~150 |
| Soul knowledge | Fetch ticker items | ~100 |
| Weather data | Fetch for location | ~50 |
| Voice setup | Initialize recognition | ~100 |
| Inactivity timer | Auto-archive | ~50 |
| Scroll management | Handle new messages | ~50 |

**Recommendation:** Extract into `useMiraEffects.js` or domain-specific hooks

---

### 3. Callback Functions (Lines 1493-3590) - ~2,100 lines
| Function | Purpose | Lines | Priority |
|----------|---------|-------|----------|
| `handleSubmit` | **MAIN CHAT LOGIC** | ~900 | 🔴 Extract first |
| `extractQuickReplies` | Generate quick replies | ~200 | 🟡 |
| `engageConcierge` | Concierge handoff | ~60 | 🟡 |
| `createOrAttachTicket` | Service desk tickets | ~80 | 🟡 |
| `showHandoffSummary` | Build summary | ~100 | 🟡 |
| `handleConciergeHandoff` | Complete handoff | ~100 | 🟡 |
| `handleQuickReply` | Process quick reply | ~30 | 🟢 |
| `openServiceRequest` | Open service modal | ~20 | 🟢 |
| `submitServiceRequest` | Submit to backend | ~120 | 🟡 |
| `syncToServiceDesk` | Sync messages | ~30 | 🟢 |
| `loadPastChats` | Fetch past sessions | ~30 | 🟢 |
| `loadSession` | Load specific session | ~50 | 🟢 |
| `switchPet` | Change active pet | ~80 | 🟡 |
| `fetchLearnVideos` | Get training videos | ~50 | 🟢 |
| `streamTextAnimation` | Text typing effect | ~40 | 🟢 |
| Various utility functions | | ~200 | 🟢 |

**Recommendation:** Extract `handleSubmit` into `useChatSubmit.js` hook

---

### 4. JSX Return (Lines 3595-4296) - ~700 lines
**Already well-organized with comments!**

The JSX is mostly component composition:
```jsx
<div className="mira-prod">
  <MemoryWhisper />
  <SoulKnowledgeTicker />
  <header />
  <NavigationDock />
  <FloatingActionBar />
  <InsightsPanel />
  <ConciergePanel />
  <ConciergeConfirmation />
  <HandoffSummary />
  <UnifiedPicksVault />
  <TestScenariosPanel />
  <PastChatsPanel />
  <main chat area>
    <WelcomeHero />
    <ChatMessages />
    <QuickReplies />
  </main>
  <ScrollToBottomButton />
  <ChatInputBar />
  <MiraTray />
  <HealthVaultWizard />
  <HelpModal />
  <LearnModal />
  <SoulFormModal />
  <ServiceRequestModal />
  <PersonalizedPicksPanel />
  <VaultManager />
</div>
```

---

## Refactoring Plan (One at a Time)

### Phase 1: Extract `handleSubmit` (🔴 Critical)
**Why:** 900 lines of chat logic is the biggest single block
**Risk:** Medium - core functionality
**Approach:**
1. Create `/app/frontend/src/hooks/mira/useChatSubmit.js`
2. Move `handleSubmit` function and its dependencies
3. Return `{ handleSubmit, isProcessing }` from hook
4. Test thoroughly

### Phase 2: Consolidate State into Custom Hooks
**Create domain-specific hooks:**
| Hook | States to Move |
|------|----------------|
| `useConversation.js` | history, stage, context, replies |
| `useMiraUI.js` | modal toggles, panels, processing |
| `usePetData.js` | (already exists) enhance it |
| `useProactiveAlerts.js` | alerts, greeting, weather |
| `useServiceDesk.js` | tickets, handoff, concierge |

### Phase 3: Extract Effect Groups
Move related useEffects into hooks from Phase 2

### Phase 4: Clean Up JSX
Move inline handlers to named functions

---

## Risk Assessment

| Change | Risk Level | Reason |
|--------|------------|--------|
| Extract `handleSubmit` | 🟡 Medium | Core chat flow, well-isolated |
| State consolidation | 🟡 Medium | Many interdependencies |
| Effect extraction | 🟢 Low | Mostly isolated |
| JSX cleanup | 🟢 Low | No logic changes |

---

## Testing Strategy

After each phase:
1. Verify login and pet selection
2. Send chat message, verify response
3. Test concierge handoff flow
4. Test voice input (if applicable)
5. Test all modal openings
6. Run testing_agent_v3_fork

---

## Recommendation

**Start with Phase 1 (Extract `handleSubmit`)** - it's:
- The largest single block (900 lines → hook)
- Well-isolated with clear inputs/outputs
- Will immediately make the file more readable
- Low risk of breaking other features

**Next Steps:**
1. Show you the `handleSubmit` function boundaries
2. Create the extraction plan
3. Execute ONE extraction
4. Test thoroughly
5. Repeat for next phase

---

## Files That Will Be Created

```
/app/frontend/src/hooks/mira/
├── index.js              (already exists)
├── useChat.js            (already exists - utilities)
├── useChatSubmit.js      (NEW - Phase 1)
├── useConversation.js    (NEW - Phase 2)
├── useMiraUI.js          (NEW - Phase 2)
├── useProactiveAlerts.js (NEW - Phase 2)
├── useServiceDesk.js     (NEW - Phase 2)
├── usePet.js             (already exists)
├── useSession.js         (already exists)
├── useVoice.js           (already exists)
└── useVault.js           (already exists)
```

---

*Audit by: Emergent Agent*  
*Date: February 12, 2026*
