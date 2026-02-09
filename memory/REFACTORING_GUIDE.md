# Mira Demo Refactoring Guide
## Stage-by-Stage Approach

---

## 🎯 THE PLAN

| Route | File | Purpose |
|-------|------|---------|
| `/mira-demo` | `MiraDemoPage.jsx` | **ACTIVE** - We refactor THIS |
| `/mira-demobackup` | `MiraDemoBackupPage.jsx` | **FROZEN** - NEVER touch, compare against |
| `/mira-demo-original` | `MiraDemoOriginalPage.jsx` | Original Day 1 version |

---

## 📋 REFACTORING STAGES

### Stage 1: Extract Shared Hooks (LOW RISK)
Create hooks without changing UI behavior.

**Extract:**
1. `useConversation.js` - Session, messages, history
2. `useVoice.js` - Voice input/output
3. `usePet.js` - Pet selection, pet data
4. `useTicket.js` - Ticket creation/management

**Test After:** 
- Compare `/mira-demo` vs `/mira-demobackup`
- All features should work identically

---

### Stage 2: Extract Small Components (LOW RISK)
Move self-contained JSX blocks to separate files.

**Extract:**
1. `QuickReplies.jsx` - Quick reply buttons
2. `TypingIndicator.jsx` - Mira typing animation
3. `ConversationCompleteBanner.jsx` - Completion banner
4. `ProactiveGreeting.jsx` - Greeting card

**Test After:**
- Compare both pages
- UI should be identical

---

### Stage 3: Extract Medium Components (MEDIUM RISK)
More complex components with state.

**Extract:**
1. `ChatInput.jsx` - Input field, voice button, send
2. `PetSelector.jsx` - Pet dropdown
3. `ServiceRequestModal.jsx` - Service request form
4. `HealthVaultModal.jsx` - Health wizard

**Test After:**
- Test each extracted component
- Compare both pages

---

### Stage 4: Extract Large Components (HIGH RISK)
Core UI sections.

**Extract:**
1. `ChatMessages.jsx` - Message list rendering
2. `PicksTray.jsx` - Current picks tray
3. `PastChatsPanel.jsx` - Past chats sidebar
4. `ConversationHeader.jsx` - Top header

**Test After:**
- Thorough testing of chat flow
- Voice functionality
- Session persistence

---

### Stage 5: Final Cleanup (MEDIUM RISK)
1. Remove dead code
2. Consolidate duplicate logic
3. Optimize re-renders
4. Add PropTypes/TypeScript

---

## ✅ COMPARISON CHECKLIST

After EACH stage, test these on BOTH pages:

### Core Chat
- [ ] Send message → Get response
- [ ] Products shown for product queries
- [ ] Services shown for service queries
- [ ] Quick replies appear and work
- [ ] Typing indicator shows

### Voice
- [ ] Voice input button works
- [ ] Recording starts/stops
- [ ] Voice output (TTS) works
- [ ] Mute/unmute works

### Picks & Vault
- [ ] Products appear in picks tray
- [ ] Vault overlay opens
- [ ] Can select/deselect items
- [ ] Send to Concierge works

### Session
- [ ] Session persists on refresh
- [ ] Past chats load
- [ ] Can switch between chats
- [ ] New chat button works

### Pet
- [ ] Pet selector shows all pets
- [ ] Can switch pet
- [ ] Pet context in messages

### Service Requests
- [ ] Service modal opens
- [ ] Form submits correctly
- [ ] Ticket created

### Mobile
- [ ] Layout responsive
- [ ] Touch interactions work
- [ ] Voice works on mobile

---

## 🔄 HOW TO COMPARE

1. Open two browser tabs:
   - Tab 1: `/mira-demo` (being refactored)
   - Tab 2: `/mira-demobackup` (frozen reference)

2. Perform same action on both
3. Verify identical behavior
4. If different → ROLLBACK and investigate

---

## ⚠️ ROLLBACK PROCEDURE

If something breaks:

```bash
# Option 1: Restore from backup
cp /app/backups/MiraDemoPage_BACKUP_20260209_092521.jsx /app/frontend/src/pages/MiraDemoPage.jsx

# Option 2: Copy from backup page
cp /app/frontend/src/pages/MiraDemoBackupPage.jsx /app/frontend/src/pages/MiraDemoPage.jsx
# Then rename component back to MiraDemoPage
sed -i 's/MiraDemoBackupPage/MiraDemoPage/g' /app/frontend/src/pages/MiraDemoPage.jsx
```

---

## 📁 FILE STRUCTURE AFTER REFACTORING

```
/app/frontend/src/
├── pages/
│   ├── MiraDemoPage.jsx          # Refactored (smaller)
│   ├── MiraDemoBackupPage.jsx    # FROZEN backup
│   └── MiraDemoOriginalPage.jsx  # Day 1 version
│
├── components/
│   └── MiraDemo/                  # NEW folder
│       ├── ChatMessages.jsx
│       ├── ChatInput.jsx
│       ├── PicksTray.jsx
│       ├── PetSelector.jsx
│       ├── QuickReplies.jsx
│       ├── ConversationHeader.jsx
│       ├── ServiceRequestModal.jsx
│       ├── HealthVaultModal.jsx
│       └── index.js
│
├── hooks/
│   └── mira/                      # NEW folder
│       ├── useConversation.js
│       ├── useVoice.js
│       ├── usePet.js
│       ├── useTicket.js
│       └── index.js
```

---

## 🚀 READY TO START?

1. Verify `/mira-demobackup` works (login, chat, picks)
2. Start with Stage 1 (hooks)
3. Test after each extraction
4. Compare against backup
5. Proceed to next stage only when current stage passes all tests
