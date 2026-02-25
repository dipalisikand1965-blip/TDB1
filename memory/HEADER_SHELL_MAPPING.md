# MIRA Demo → Header Shell Mapping
## What Goes Where in the New Navigation

---

## CURRENT /mira-demo LAYOUT (Before)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo | NotificationBell | PetSelector              │
├─────────────────────────────────────────────────────────────┤
│  SoulKnowledgeTicker (soul score, traits)                   │
├─────────────────────────────────────────────────────────────┤
│  NavigationDock (Help | Learn | Soul buttons)               │
├─────────────────────────────────────────────────────────────┤
│  FloatingActionBar (History | Insights | Concierge | New)   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MAIN CONTENT AREA:                                         │
│  ├─ WelcomeHero (when no messages)                          │
│  ├─ ProactiveAlertsBanner (reminders)                       │
│  ├─ ChatMessage (conversation)                              │
│  ├─ QuickReplies (suggestions)                              │
│  └─ MiraLoader (typing indicator)                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ChatInputBar (message input)                               │
├─────────────────────────────────────────────────────────────┤
│  ScrollToBottomButton                                       │
└─────────────────────────────────────────────────────────────┘

MODALS/PANELS (overlay):
- InsightsPanel
- ConciergePanel  
- PastChatsPanel
- LearnModal
- HelpModal
- SoulFormModal
- PersonalizedPicksPanel
- ServiceRequestModal
- HealthVaultWizard
- UnifiedPicksVault
- HandoffSummary
- TestScenariosPanel
```

---

## NEW HEADER SHELL MAPPING

### 🐾 MOJO (Pet Context) - "Who are we talking about?"
| Current Element | Action | Notes |
|-----------------|--------|-------|
| **PetSelector** | MOVE HERE | Main pet switching UI |
| **SoulKnowledgeTicker** | MOVE HERE | Soul score + knowledge items |
| **SoulFormModal** | TRIGGER FROM HERE | Button to open soul questions |
| **HealthVaultWizard** | TRIGGER FROM HERE | Button to open health records |
| **MemoryWhisper** | MOVE HERE | Memory context display |

**Mojo Tab Content:**
- Pet photo + name + breed
- Soul Score with progress ring
- Key traits snapshot (allergies, temperament, energy)
- "Complete Soul Profile" CTA
- "Health Vault" CTA

---

### 📅 TODAY (Temporal) - "What matters now?"
| Current Element | Action | Notes |
|-----------------|--------|-------|
| **ProactiveAlertsBanner** | MOVE HERE | Smart reminders |
| **NotificationBell** | MOVE HERE | Notification count |
| **WelcomeHero** (time parts) | PARTIAL MOVE | Birthday/celebration alerts only |

**Today Tab Content:**
- Upcoming reminders (vaccinations, grooming)
- Today's alerts (birthday, events)
- Time-sensitive notifications
- "Nothing today" placeholder if empty

---

### ✨ PICKS (Intelligence) - "What should we do next?"
| Current Element | Action | Notes |
|-----------------|--------|-------|
| **PersonalizedPicksPanel** | MOVE HERE | Full picks list |
| **UnifiedPicksVault** | MOVE HERE | Conversation picks |
| **VaultManager** | MOVE HERE | Vault data display |
| **MiraTray** | MOVE HERE | Quick action tray |
| **QuickReplies** | DUAL PLACE | Also show in Services tab |
| **Picks Curated Banner** (Gift icon) | MOVE HERE | "Mira's Picks" inline banner |

**Picks Tab Content:**
- Top personalized picks for pet
- Recent conversation picks
- "Recommended for {pet}" section
- Tip cards from Mira
- Vault manager for saved picks

---

### 💬 SERVICES (Execution) - "What are we arranging?" [DEFAULT TAB]
| Current Element | Action | Notes |
|-----------------|--------|-------|
| **WelcomeHero** | KEEP HERE | Welcome state |
| **ChatMessage** | KEEP HERE | Main chat |
| **ChatInputBar** | KEEP HERE | Input bar |
| **QuickReplies** | KEEP HERE | After responses |
| **MiraLoader** | KEEP HERE | Typing indicator |
| **ServiceRequestModal** | TRIGGER FROM HERE | Service forms |
| **ConciergeConfirmation** | KEEP HERE | Booking confirmations |
| **ScrollToBottomButton** | KEEP HERE | Scroll control |
| **Toggle History Button** | KEEP HERE | Show/hide older messages |
| **Picks Curated Banner** | KEEP HERE (inline) | Shows during chat when picks available |

**Services Tab Content:**
- Full chat interface (unchanged)
- This is the DEFAULT tab users land on

---

### 📊 INSIGHTS (Patterns) - "What patterns exist?"
| Current Element | Action | Notes |
|-----------------|--------|-------|
| **InsightsPanel** | MOVE HERE | Conversation insights |
| **PastChatsPanel** | MOVE HERE | Chat history |
| **FloatingActionBar** (History btn) | MOVE HERE | Trigger for past chats |

**Insights Tab Content:**
- Conversation summary
- Learned preferences
- Chat session history
- "What Mira learned" section

---

### 📚 LEARN (Knowledge) - "What do we understand?"
| Current Element | Action | Notes |
|-----------------|--------|-------|
| **LearnModal** | MOVE HERE | Training videos |
| **HelpModal** | MOVE HERE | FAQ/Help |
| **NavigationDock** (Learn btn) | MOVE HERE | Learn trigger |

**Learn Tab Content:**
- Training guides grid
- Video library
- Breed-specific content
- FAQ section

---

### 👥 CONCIERGE (Human Layer) - "When humans step in?"
| Current Element | Action | Notes |
|-----------------|--------|-------|
| **ConciergePanel** | MOVE HERE | Full concierge UI |
| **HandoffSummary** | TRIGGER FROM HERE | Handoff modal |
| **FloatingActionBar** (Concierge btn) | MOVE HERE | Concierge trigger |

**Concierge Tab Content:**
- "Connect with Concierge" CTA
- Active requests status
- Contact options (WhatsApp, Chat, Email)
- Escalation form

---

## ELEMENTS THAT STAY GLOBAL (Not in tabs)

| Element | Reason |
|---------|--------|
| **Header** (Logo) | Always visible |
| **PetSelector** (compact) | Quick switch in header |
| **NotificationBell** | Quick access in header |

---

## DUAL PLACEMENT STRATEGY (Phase 1)

For initial implementation, these elements appear in BOTH locations:

1. **PetSelector** → Header (compact) + Mojo tab (detailed)
2. **QuickReplies** → Services tab + Picks tab
3. **NotificationBell** → Header + Today tab

This prevents "where did it go?" confusion during transition.

---

## VISUAL REFERENCE

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo | [PetSelector mini] | [NotificationBell]     │
├─────────────────────────────────────────────────────────────┤
│  TABS: [Mojo] [Today] [Picks] [Services*] [Insights] [Learn] [Concierge] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TAB CONTENT (varies by selected tab)                       │
│                                                             │
│  Services (default):                                        │
│  ├─ WelcomeHero / Chat Messages                             │
│  ├─ QuickReplies                                            │
│  └─ ChatInputBar                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTATION ORDER

1. ✅ Create MiraHeaderShell component (DONE)
2. ✅ Create /mira-os test page (DONE)
3. 🔲 Add header tabs to /mira-demo (NEXT)
4. 🔲 Move Mojo content (PetSelector detailed, SoulKnowledgeTicker)
5. 🔲 Move Today content (ProactiveAlertsBanner)
6. 🔲 Move Picks content (PersonalizedPicksPanel)
7. 🔲 Services stays as-is (default tab)
8. 🔲 Move Insights content (InsightsPanel, PastChatsPanel)
9. 🔲 Move Learn content (LearnModal)
10. 🔲 Move Concierge content (ConciergePanel)
11. 🔲 Remove NavigationDock (replaced by tabs)
12. 🔲 Remove FloatingActionBar (replaced by tabs)
