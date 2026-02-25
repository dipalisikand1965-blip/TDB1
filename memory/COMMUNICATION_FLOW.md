# 🔄 UNIFIED SERVICE FLOW - Communication Architecture

**Date:** February 18, 2026

---

## 📱 PET OWNER COMMUNICATION CHANNELS

### Current Flow:

```
User Request → Mira Chat → Service Desk Ticket → Concierge Thread
     ↓                           ↓                      ↓
  SERVICES tab              Admin Dashboard        Two-Way Chat
     ↓                           ↓                      ↓
 Thread View  ←←←←←←←←←←←←← Concierge Reply ←←←←←←←←←←←←↓
     ↓
  Notification
     ↓
  User Clicks → Opens Thread → User Can Reply
```

### Where User Replies From:

1. **SERVICES Tab** → Click on request → Thread opens → Type reply at bottom
2. **Notification** → Click notification → Opens thread in Services → Reply
3. **CONCIERGE Tab** → Lists all threads → Click to open → Reply

---

## 🛎️ NOTIFICATION → THREAD FLOW

### Step 1: Notification Appears
```javascript
// NotificationBell.jsx line 158
"Updates from Concierge®. Tap to open the thread in Services."
```

### Step 2: User Clicks Notification
```javascript
// NotificationBell.jsx line 210-215
if (notification.data?.thread_url) {
  window.location.href = notification.data.thread_url;
}
```

### Step 3: Thread Opens
- ConciergeThreadPanelV2.jsx handles the thread view
- Shows all messages (user + concierge)
- Has input field at bottom for replies

### Step 4: User Types & Sends Reply
```javascript
// ConciergeThreadPanelV2.jsx line 571-597
const handleSend = () => {
  // Optimistic update
  setMessages(prev => [...prev, optimisticMessage]);
  // Send via WebSocket
  sendMessage(threadId, content, tempId);
}
```

---

## 📍 WHERE THINGS LIVE

| Component | Location | Purpose |
|-----------|----------|---------|
| **SERVICES Tab** | MiraDemoPage → ServicesPanel.jsx | Lists all user requests |
| **Thread View** | ConciergeThreadPanelV2.jsx | Two-way chat with concierge |
| **CONCIERGE Tab** | ConciergeHomePanel.jsx | Alt view of threads |
| **Notifications** | NotificationBell.jsx | Alerts + deep links |
| **Reply Input** | Inside ConciergeThreadPanelV2 | Text input + send button |

---

## ✅ WHAT'S WORKING

1. ✅ **User creates request** via Mira chat
2. ✅ **Ticket created** in service_desk_tickets
3. ✅ **Thread created** in concierge_threads
4. ✅ **Notifications sent** to user
5. ✅ **User can click notification** → opens thread
6. ✅ **Two-way chat** via WebSocket
7. ✅ **Concierge can reply** from admin dashboard
8. ✅ **User sees reply** in thread

---

## ❓ POTENTIAL GAPS TO VERIFY

1. **Does thread_url exist in notification data?**
2. **Is WebSocket connection maintained?**
3. **Do all ticket types create threads?**
4. **Can user reply from notification panel directly?** (Currently: No, must open thread)

---

## 🎯 ENHANCEMENT OPPORTUNITY

**Inline Reply from Notification Panel:**
Instead of navigating away, allow quick reply:
```
[Notification]
  "Concierge replied about grooming"
  [View Thread] [Quick Reply: _____ ] [Send]
```

This would reduce friction for quick responses.

---

## 📋 ACTION ITEMS

### Immediate (Deploy):
1. ✅ Smart fallback picks - ready
2. ❌ Intent capture fix - needs debugging
3. ❌ City to pet profile - needs UI update

### Post-Deploy:
4. Verify thread_url in all notifications
5. Test two-way chat flow end-to-end
6. Consider inline reply feature

---

*The pet owner's primary communication channel is the **SERVICES tab** where they can view and reply to all their requests.*
