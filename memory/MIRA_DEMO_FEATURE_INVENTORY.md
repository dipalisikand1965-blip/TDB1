# MiraDemoPage.jsx - Complete Feature Inventory
## Created: February 9, 2026
## Purpose: Safety net before refactoring - DO NOT LOSE ANY OF THESE

---

## 📊 FILE STATISTICS
- **Total Lines**: 5,791
- **Total useState hooks**: 67
- **Total useEffect hooks**: 16
- **Total Functions**: 50+
- **Backup Location**: `/app/backups/MiraDemoPage_BACKUP_20260209_092521.jsx`

---

## 🔄 ALL STATE VARIABLES (67 total)

### Core Conversation State
| Line | State Variable | Purpose |
|------|----------------|---------|
| 682 | `query` | Current input text |
| 683 | `conversationHistory` | All messages in current session |
| 684 | `isListening` | Voice input active |
| 685 | `isProcessing` | API call in progress |
| 706 | `isTyping` | Mira is typing animation |
| 705 | `typingText` | Text being typed |
| 1148 | `sessionId` | Current conversation session ID |
| 1161 | `sessionRecovered` | Session was recovered from storage |
| 1165 | `conversationStage` | Stage of conversation flow |

### Pet State
| Line | State Variable | Purpose |
|------|----------------|---------|
| 688 | `pet` | Currently selected pet |
| 689 | `allPets` | All user's pets |
| 866 | `showPetSelector` | Pet selector modal open |

### UI State
| Line | State Variable | Purpose |
|------|----------------|---------|
| 666 | `activeScenario` | Current test scenario |
| 667 | `showScenarios` | Show scenarios panel |
| 669 | `showTestScenarios` | Test scenarios modal |
| 673 | `collapsedSections` | Which sections are collapsed |
| 675 | `isAtBottom` | Scroll position at bottom |
| 676 | `hasNewMessages` | New messages indicator |
| 692 | `showHelpModal` | Help modal open |
| 693 | `showLearnModal` | Learn modal open |
| 697 | `activeDockItem` | Currently active dock item |
| 716 | `showOlderMessages` | Show older messages toggle |
| 866 | `showPetSelector` | Pet selector open |
| 871 | `showPastChats` | Past chats panel open |
| 983 | `showInsightsPanel` | Insights panel open |
| 984 | `showConciergePanel` | Concierge panel open |
| 1006 | `showMiraTray` | Mira picks tray open |
| 1009 | `showConciergeOptions` | Concierge contact options |
| 1175 | `showFeatureShowcase` | Feature showcase cards |

### Mira Mode & Voice
| Line | State Variable | Purpose |
|------|----------------|---------|
| 704 | `miraMode` | ready/instant/thinking/comfort/emergency |
| 709 | `voiceEnabled` | Voice input enabled |
| 710 | `isSpeaking` | Mira is speaking (TTS) |
| 679 | `isRecording` | Voice recording active |
| 3688 | `voiceError` | Voice error state |
| 3689 | `voiceSupported` | Browser supports voice |

### Pillar & Products
| Line | State Variable | Purpose |
|------|----------------|---------|
| 677 | `currentPillar` | Current pillar (celebrate/dine/care/etc) |
| 678 | `lastShownProducts` | Products shown in last response |
| 867 | `userHasOptedInForProducts` | User wants to see products |

### Picks & Vault System (NEW)
| Line | State Variable | Purpose |
|------|----------------|---------|
| 991 | `showVault` | Vault overlay visible |
| 992 | `activeVaultData` | Data for vault display |
| 993 | `vaultUserMessage` | User message that triggered vault |
| 1000-1005 | `miraPicks` | Products/services curated by Mira |

### Tickets & Service Requests
| Line | State Variable | Purpose |
|------|----------------|---------|
| 674 | `currentTicket` | Current ticket ID |
| 857-864 | `serviceRequestModal` | Service request form state |

### Past Chats & Sessions
| Line | State Variable | Purpose |
|------|----------------|---------|
| 870 | `pastSessions` | List of past chat sessions |
| 872 | `loadingPastChats` | Loading past chats indicator |

### Conversation Flow
| Line | State Variable | Purpose |
|------|----------------|---------|
| 884 | `conversationComplete` | Conversation has ended |
| 885 | `showConversationEndBanner` | Show completion banner |
| 720-723 | `conversationContext` | Context from URL/state |
| 1169 | `completedSteps` | Wizard steps completed |
| 1170 | `currentStep` | Current wizard step |
| 1171 | `stepHistory` | History of Q&A steps |

### Learn Module
| Line | State Variable | Purpose |
|------|----------------|---------|
| 694 | `learnVideos` | Videos for Learn section |
| 695 | `learnLoading` | Loading videos |
| 696 | `learnCategory` | Current learn category |

### Proactive Features
| Line | State Variable | Purpose |
|------|----------------|---------|
| 1012-1017 | `proactiveAlerts` | Alerts for pet care |
| 1019 | `proactiveGreeting` | Personalized greeting |
| 1077 | `tickerItems` | Ticker/marquee items |
| 1080 | `dailyDigest` | Daily digest data |

### Health Vault
| Line | State Variable | Purpose |
|------|----------------|---------|
| 1069-1075 | `healthVault` | Health vault wizard state |

### Location & Weather
| Line | State Variable | Purpose |
|------|----------------|---------|
| 725 | `userGeoLocation` | User's geolocation |
| 726 | `userCity` | User's city |
| 1174 | `currentWeather` | Current weather data |

### Miscellaneous
| Line | State Variable | Purpose |
|------|----------------|---------|
| 985 | `latestInsights` | Collected insights |
| 1086 | `displayedText` | For text animation |
| 1087 | `showSkeleton` | Show loading skeleton |
| 1139 | `milestones` | Pet milestones |
| 1142 | `memoryLane` | Pet memories |
| 1145 | `reorderSuggestions` | Product reorder suggestions |

---

## ⚡ ALL useEffect HOOKS (16 total)

| Line | Purpose |
|------|---------|
| 102 | Typing animation effect (TypedText component) |
| 729 | Initialize haptic audio |
| 746 | Initialize conversation messages |
| 775 | Load conversation from context |
| 940 | Inactivity timer for auto-archive |
| 971 | Clear inactivity timer on unmount |
| 1022 | Show proactive greeting |
| 1237 | Load user's pets from API |
| 1329 | Recover session from storage |
| 1387 | Fetch weather data |
| 1412 | Fetch all pets on auth change |
| 1466 | Fetch proactive alerts |
| 1736 | Fetch pet details |
| 1790 | Auto-scroll to bottom |
| 3417 | Handle conversation stages |
| 3692 | Check voice support |

---

## 🛠️ ALL FUNCTIONS (50+ total)

### Text & Formatting
| Line | Function | Purpose |
|------|----------|---------|
| 45 | `processText` | Process markdown-like text |
| 41 | `FormattedText` | Component for formatted text |
| 98 | `TypedText` | Typing animation component |
| 788 | `typeText` | Animate text typing |
| 1103 | `streamTextAnimation` | Stream text with animation |

### Celebration & Confetti
| Line | Function | Purpose |
|------|----------|---------|
| 139 | `triggerCelebrationConfetti` | Fire confetti animation |
| 152 | `fire` | Fire individual confetti burst |

### Concierge
| Line | Function | Purpose |
|------|----------|---------|
| 192 | `isConciergeLive` | Check if concierge is available |
| 204 | `generateConciergeRequest` | Generate concierge request text |
| 1877 | `engageConcierge` | Engage concierge for help |
| 3422 | `handleConciergeHandoff` | Handle handoff to concierge |

### Intent Detection
| Line | Function | Purpose |
|------|----------|---------|
| 380 | `detectServiceIntent` | Detect service-related intent |
| 420 | `isComfortMode` | Check if comfort mode needed |
| 454 | `getComfortModeServices` | Get comfort services |
| 560 | `detectExperienceIntent` | Detect experience intent |
| 813 | `detectVoicePersonality` | Detect voice personality |

### Product Helpers
| Line | Function | Purpose |
|------|----------|---------|
| 284 | `getPlaceholderImage` | Get placeholder product image |
| 575 | `generateWhyForPet` | Generate "why for pet" text |

### Session Management
| Line | Function | Purpose |
|------|----------|---------|
| 1330 | `recoverSession` | Recover session from storage |
| 1370 | `startNewSession` | Start new chat session |
| 1588 | `switchPet` | Switch to different pet |
| 1654 | `loadPastChats` | Load past chat sessions |
| 1677 | `loadSession` | Load a specific session |
| 1723 | `formatSessionDate` | Format session date |

### Conversation Flow
| Line | Function | Purpose |
|------|----------|---------|
| 879 | `resetInactivityTimer` | Reset inactivity timer |
| 889 | `detectConversationComplete` | Detect if conversation ended |
| 916 | `archiveCurrentConversation` | Archive conversation |
| 2188 | `splitMessageWithQuestion` | Split message with question |
| 2301 | `isAskingForMoreInfo` | Check if asking for more info |

### Ticket Management
| Line | Function | Purpose |
|------|----------|---------|
| 1800 | `createOrAttachTicket` | Create or attach to ticket |
| 2233 | `syncToServiceDesk` | Sync message to service desk |
| 2259 | `completeStep` | Complete wizard step |
| 2295 | `isStepCompleted` | Check if step completed |

### Voice
| Line | Function | Purpose |
|------|----------|---------|
| 2315 | `stopSpeaking` | Stop TTS |
| 2331 | `speakWithMira` | Speak text with Mira's voice |
| 3784 | `toggleVoice` | Toggle voice input |
| 3824 | `toggleVoiceOutput` | Toggle voice output |

### Main Submit
| Line | Function | Purpose |
|------|----------|---------|
| 2422 | `handleSubmit` | Main form submit handler |

### Quick Actions
| Line | Function | Purpose |
|------|----------|---------|
| 1941 | `extractQuickReplies` | Extract quick reply options |
| 3497 | `handleQuickReply` | Handle quick reply click |

### Service Requests
| Line | Function | Purpose |
|------|----------|---------|
| 3523 | `openServiceRequest` | Open service request modal |
| 3541 | `updateServiceFormData` | Update service form field |
| 3549 | `submitServiceRequest` | Submit service request |
| 3677 | `closeServiceRequest` | Close service request modal |

### UI Helpers
| Line | Function | Purpose |
|------|----------|---------|
| 1773 | `scrollToBottom` | Scroll chat to bottom |
| 1781 | `handleScroll` | Handle scroll event |
| 3835 | `handleDockClick` | Handle dock item click |
| 3927 | `getIntentColor` | Get color for intent |

### Learn Module
| Line | Function | Purpose |
|------|----------|---------|
| 3852 | `fetchLearnVideos` | Fetch learn videos |

### Feedback
| Line | Function | Purpose |
|------|----------|---------|
| 3902 | `handleFeedback` | Handle message feedback |

### Fetch Functions
| Line | Function | Purpose |
|------|----------|---------|
| 1238 | `loadUserPets` | Load user's pets |
| 1388 | `fetchWeather` | Fetch weather data |
| 1413 | `fetchAllPets` | Fetch all pets |
| 1467 | `fetchProactiveAlerts` | Fetch proactive alerts |
| 1737 | `fetchPet` | Fetch pet details |

---

## 🎨 JSX SECTIONS (approximate line numbers)

| Section | Lines | Description |
|---------|-------|-------------|
| Imports | 1-170 | All imports and constants |
| Helper Components | 41-660 | FormattedText, TypedText, etc. |
| Main Component Start | 661 | MiraDemoPage function |
| State Declarations | 666-1175 | All useState hooks |
| useEffect Hooks | 1237-3420 | All effects |
| Event Handlers | 1800-3930 | All callbacks |
| JSX Return Start | ~3940 | Main render |
| Header/Navigation | ~3950-4100 | Top nav, search |
| Main Chat Area | ~4100-5200 | Messages, input |
| Mira Tray | ~5380-5457 | Picks tray |
| Health Vault Modal | ~5458-5700 | Health wizard |
| Vault System | ~5742-5785 | New vault overlay |
| Export | 5790 | Export statement |

---

## 🔗 EXTERNAL DEPENDENCIES

### APIs Called
- `/api/mira/chat` - Main chat endpoint
- `/api/mira/session/*` - Session management
- `/api/mira/vault/send-to-concierge` - Vault submission
- `/api/mira/refresh-picks` - Get new picks
- `/api/pets/*` - Pet management
- `/api/service-desk/*` - Ticket management
- `/api/weather/*` - Weather data
- `/api/learn/*` - Learn videos

### Context Used
- `useAuth()` - Authentication context
- `useNavigate()` - React Router navigation

### External Libraries
- `react-markdown` - Markdown rendering
- `lucide-react` - Icons
- Confetti library (canvas-confetti)

---

## 📋 REFACTORING PLAN (Suggested Components)

### High Priority Components to Extract:
1. **ChatMessages.jsx** - Message list rendering
2. **ChatInput.jsx** - Input field, voice, send button
3. **PicksTray.jsx** - Current picks tray (lines ~5380-5457)
4. **VaultOverlay.jsx** - Vault system (already VaultManager)
5. **ServiceRequestModal.jsx** - Service request form
6. **HealthVaultModal.jsx** - Health wizard
7. **PetSelector.jsx** - Pet selection dropdown
8. **PastChatsPanel.jsx** - Past chats sidebar
9. **ConversationHeader.jsx** - Top header with pet info
10. **QuickReplies.jsx** - Quick reply buttons

### Shared Hooks to Extract:
1. **useConversation.js** - Conversation state & handlers
2. **useVoice.js** - Voice input/output
3. **usePet.js** - Pet selection & management
4. **useTicket.js** - Ticket management
5. **useSession.js** - Session persistence

---

## ⚠️ CRITICAL: DO NOT LOSE

1. **Voice functionality** - Must work on mobile/iOS
2. **Session persistence** - Conversations must persist
3. **Ticket creation** - Every conversation creates ticket
4. **Pillar detection** - Correct pillar for products
5. **Concierge handoff** - Smooth handoff flow
6. **Proactive alerts** - Health reminders
7. **Quick replies** - Interactive buttons
8. **Service requests** - Modal flow
9. **Past chats** - History loading
10. **Vault system** - New picks flow

---

## ✅ VERIFICATION CHECKLIST (After Refactoring)

- [ ] Can send message and get response
- [ ] Voice input works
- [ ] Voice output (TTS) works
- [ ] Products shown correctly for pillar
- [ ] Picks tray opens with products
- [ ] Vault overlay opens
- [ ] Can send picks to concierge
- [ ] Session persists on refresh
- [ ] Past chats load correctly
- [ ] Pet selector works
- [ ] Service request modal works
- [ ] Health vault wizard works
- [ ] Quick replies work
- [ ] Confetti fires on celebrations
- [ ] Scroll to bottom works
- [ ] Mobile responsive
- [ ] iOS compatible
