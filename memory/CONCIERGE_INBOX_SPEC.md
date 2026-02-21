# 📬 CONCIERGE INBOX - Full Specification

**Date:** February 18, 2026
**Priority:** P0 - Critical UX Enhancement
**Status:** SPEC READY - Not Implemented

---

## 🎯 THE VISION

Transform the notification dropdown into an **Outlook Mobile-style Inbox**:
- Notifications list → Click → **Full-screen drawer opens** with thread
- Two-way conversation visible immediately
- Reply input at bottom
- No navigation away from current page
- Mobile-first, touch-friendly

---

## 📱 CURRENT STATE (Problem)

```
User clicks notification
       ↓
navigates to /mira-demo with ?tab=services
       ↓
Services tab may not auto-open thread
       ↓
USER LANDS ON "DEAD TAB" - confusion
```

---

## ✅ PROPOSED STATE (Solution)

```
User clicks notification
       ↓
Full-screen drawer slides up (mobile) / slides in (desktop)
       ↓
Thread conversation visible immediately
       ↓
User can reply inline
       ↓
Close drawer → back to where they were
```

---

## 🖼️ UI MOCKUP DESCRIPTION

### Mobile View (Like Outlook)
```
┌─────────────────────────────────┐
│ ←  Travel Request • Mystique    │ (Header with back arrow)
│─────────────────────────────────│
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🎫 Your Request         │   │ (User's original message)
│  │ "Looking for pet-friendly│   │
│  │  hotels in Goa for Dec" │   │
│  │              2:30 PM ✓✓ │   │
│  └─────────────────────────┘   │
│                                 │
│       ┌─────────────────────┐  │
│       │ 🧑‍💼 Concierge         │  │ (Concierge reply)
│       │ "Hi! Found 3 great  │  │
│       │  options for you:   │  │
│       │  1. Taj Fort Aguada │  │
│       │  2. W Goa           │  │
│       │  3. Alila Diwa      │  │
│       │              3:15 PM│  │
│       └─────────────────────┘  │
│                                 │
│  ┌─────────────────────────┐   │
│  │ You                     │   │
│  │ "The W sounds perfect!" │   │
│  │              3:20 PM ✓✓ │   │
│  └─────────────────────────┘   │
│                                 │
│─────────────────────────────────│
│ [Type your reply...]      [📤] │ (Input bar)
└─────────────────────────────────┘
```

### Desktop View
```
┌──────────────────────────────────────────────────────────────┐
│                        Mira Demo Page                         │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │                                                          │ │
│ │  (Current page content dimmed)                          │ │
│ │                                                          │ │
│ │    ┌────────────────────────────────┐                   │ │
│ │    │ ← Travel Request • Mystique    │ DRAWER            │ │
│ │    │───────────────────────────────│ (400px wide)      │ │
│ │    │                                │                   │ │
│ │    │  [Thread messages here]       │                   │ │
│ │    │                                │                   │ │
│ │    │  [Reply input at bottom]      │                   │ │
│ │    └────────────────────────────────┘                   │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 FILES TO CREATE/MODIFY

### 1. NEW: `/app/frontend/src/components/Mira/ConciergeInboxDrawer.jsx`
Full-screen drawer component with:
- Thread header (request type, pet name, status)
- Message list (scrollable, auto-scroll to bottom)
- Reply input with send button
- Real-time WebSocket integration
- Swipe-to-close on mobile

### 2. MODIFY: `/app/frontend/src/components/Mira/NotificationBell.jsx`
```javascript
// BEFORE: Navigate away
onClick={() => window.location.href = notification.data.thread_url}

// AFTER: Open drawer
onClick={() => setActiveThread(notification.data.thread_id)}
```

### 3. NEW: `/app/frontend/src/hooks/useConciergeInbox.js`
Custom hook for:
- Fetching thread data
- WebSocket connection for real-time messages
- Optimistic updates
- Read status management

---

## 🔧 TECHNICAL IMPLEMENTATION

### Step 1: Create Drawer Component
```jsx
// ConciergeInboxDrawer.jsx
import { Sheet, SheetContent } from '../ui/sheet';
import { useConciergeThread } from '../../hooks/useConciergeThread';

export const ConciergeInboxDrawer = ({ threadId, onClose }) => {
  const { messages, sendMessage, isLoading } = useConciergeThread(threadId);
  
  return (
    <Sheet open={!!threadId} onOpenChange={() => onClose()}>
      <SheetContent side="bottom" className="h-[90vh] md:h-full md:w-[400px] md:side-right">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <button onClick={onClose}><ArrowLeft /></button>
          <div>
            <h3>{thread.request_type} Request</h3>
            <p className="text-sm text-gray-400">{thread.pet_name}</p>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
        
        {/* Reply Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input 
              placeholder="Type your reply..."
              className="flex-1 rounded-full px-4 py-2 bg-gray-800"
            />
            <button className="p-2 bg-pink-500 rounded-full">
              <Send />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
```

### Step 2: Integrate with NotificationBell
```jsx
// NotificationBell.jsx
const [activeThreadId, setActiveThreadId] = useState(null);

// In notification click handler:
onClick={() => {
  setActiveThreadId(notification.data.thread_id);
  markAsRead(notification.id);
}}

// Render drawer:
<ConciergeInboxDrawer 
  threadId={activeThreadId} 
  onClose={() => setActiveThreadId(null)} 
/>
```

### Step 3: WebSocket Integration
```javascript
// useConciergeInbox.js
export const useConciergeInbox = (threadId) => {
  const [messages, setMessages] = useState([]);
  const socket = useSocket();
  
  useEffect(() => {
    if (!threadId) return;
    
    // Join thread room
    socket.emit('join_thread', { thread_id: threadId });
    
    // Listen for new messages
    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    
    return () => socket.emit('leave_thread', { thread_id: threadId });
  }, [threadId]);
  
  const sendMessage = (content) => {
    socket.emit('send_message', { thread_id: threadId, content });
  };
  
  return { messages, sendMessage };
};
```

---

## 📐 DESIGN SPECS

### Mobile (< 768px)
- Drawer: 90vh height, slides up from bottom
- Full width
- Touch-to-close or swipe down
- Large touch targets (48px min)

### Desktop (>= 768px)
- Drawer: 400px wide, slides in from right
- Background dimmed (50% black overlay)
- Click outside to close

### Colors (Match existing dark theme)
- Background: #1a1a2e
- Message bubble (user): #ec4899 (pink)
- Message bubble (concierge): #374151 (gray)
- Input background: #1f2937
- Send button: #ec4899

### Typography
- Header: 18px semibold
- Messages: 14px regular
- Timestamp: 12px, gray-400
- Input: 14px

---

## ⏱️ ESTIMATED EFFORT

| Task | Time |
|------|------|
| Create ConciergeInboxDrawer.jsx | 3-4 hours |
| Create useConciergeInbox hook | 2 hours |
| Modify NotificationBell.jsx | 1 hour |
| WebSocket integration | 2 hours |
| Mobile responsiveness | 2 hours |
| Testing & polish | 2 hours |
| **Total** | **12-13 hours** |

---

## 🧪 TEST CASES

1. **Open drawer from notification** - Verify thread loads
2. **Send message** - Verify optimistic update + delivery
3. **Receive message** - Verify real-time update
4. **Close drawer** - Verify returns to previous state
5. **Mobile swipe** - Verify swipe-to-close works
6. **Multiple threads** - Verify switching threads works
7. **Offline handling** - Verify queued messages

---

## 🔗 DEPENDENCIES

- `@radix-ui/react-dialog` or Shadcn Sheet (already installed)
- WebSocket connection (already exists)
- Concierge API endpoints (already exist)

---

## 📝 ACCEPTANCE CRITERIA

- [ ] Clicking notification opens drawer, not new page
- [ ] Thread messages visible immediately
- [ ] Can send reply from drawer
- [ ] Real-time message updates work
- [ ] Drawer closes on back/swipe/outside click
- [ ] Works on mobile (full screen) and desktop (side panel)
- [ ] Matches existing dark theme

---

*This spec enables "Outlook-style" inbox experience for pet owner ↔ concierge communication.*
