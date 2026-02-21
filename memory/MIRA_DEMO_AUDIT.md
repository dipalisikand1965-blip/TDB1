# MIRA DEMO PAGE (/mira-demo) - DEEP AUDIT
## Date: February 21, 2026

---

# EXECUTIVE SUMMARY

The Mira Demo page IS functional when the backend responds — the AI chat works, soul personality is displayed, memory whispers appear, voice speaks, and picks update contextually. **However, it is deeply broken due to intermittent 502s, CORS errors, UI duplication bugs, and missing features.**

---

# 1. LOGIN FLOW

## What Happens
- /mira-demo redirects to /login if not authenticated
- Login form: Email + Password → POST /api/auth/login
- On success: redirects back to /mira-demo with Mira interface

## Issues
| Issue | Severity | Details |
|-------|----------|---------|
| **Intermittent 502 on auth** | CRITICAL | Login fails ~40% of the time due to backend 502. Users get "Login Failed - Invalid email or password" which is MISLEADING (it's not wrong credentials, it's a server error) |
| **Login redirects to /login** | HIGH | When accessed at /mira-demo, redirects to /login URL. After login, goes back to /mira-demo. The URL change is confusing |
| **No session persistence** | HIGH | Each page visit requires fresh login. Token in localStorage not being properly validated on reload |
| **Login error message wrong** | MEDIUM | Shows "Login Failed - Invalid email or password" when the real error is a 502 server error |

---

# 2. PAGE STRUCTURE (After Login)

## Header
- **Left**: Mira avatar + "Mira - Your Pet Companion"
- **Right**: Pet profile photo + pet name "Mystique" with notification badge (9+)

## Navigation Tabs
`TODAY | PICKS | SERVICES | LEARN | CONCIERGE`

## TODAY Tab Content (Default)
1. **Test Scenarios Box**: Birthday Party, Grooming, Food Recs, Health Check, Travel, Training, Places, Emergency
2. **Pet Soul Card**: Pet photo with 87% soul score, personality traits, greeting
3. **"What can Mira help with?"** grid: Weather & Walks, Find a Vet, Dog Parks, Pet Cafes, Travel, Shop
4. **Chat Interface**: At bottom when activated

## Pet Soul Card
- Shows: "For *Mystique*" with "Curated for Mystique today"
- Greeting: "Good morning! How's Mystique today?"
- Personality chips: "Friendly soul", "loving", "gifts lover" (OR "Glamorous soul", "Elegant paws", "Devoted friend" — varies between sessions!)
- Soul score: 87% with badge
- Heart icon for favoriting
- "HEALTH" badge on image

---

# 3. TAB-BY-TAB AUDIT

## TODAY Tab ✅ WORKS (mostly)
- Pet soul card displays correctly
- Test scenarios work
- Chat opens inline
- **Issues**: Test scenarios don't hide after use, personality chips change between sessions

## PICKS Tab ❌ BROKEN
- Header: "Picks for Mystique" with "Mira knows Mystique"
- Pillar tabs: Celebrate, Dine, Care, Travel, Stay, Enjoy, Fit, Learn, Advisory, Services
- **Error**: "Could not load personalized picks" with "Try Again" button
- **Fallback**: "Your Concierge Can Arrange This" + custom arrangement CTA
- **Root Cause**: `/api/mira/picks` returns 404 or 502
- **After chat**: Picks populate to 7 items (6 products + 1 service) — but ONLY after a chat triggers the intelligence

## SERVICES Tab ⚠️ NAVIGATES AWAY
- **Bug**: Clicking SERVICES tab navigates to /shop (or /services) — LEAVES the Mira Demo page entirely
- Should show services IN the Mira Demo interface, not redirect
- On the shop page: Shows "No services found" for the "For You" filter

## LEARN Tab ✅ WORKS
- Opens full-screen overlay
- Search: "What do you want help with?"
- Category grid: Grooming, Health, Food, Behaviour, Travel, Boarding, Puppies, Senior, Seasonal
- Each category is a colored card with icon
- Bookmark button available
- **Issue**: Categories appear to be shells — no actual content/articles behind them

## CONCIERGE Tab ❌ BROKEN
- Opens modal: "C° Concierge" with "All pets" filter
- **Error**: "Failed to load concierge data" in red text
- "Try Again" button
- **Root Cause**: Backend API for concierge data is 502/unavailable

---

# 4. CHAT FUNCTIONALITY (Birthday Party Test)

## What Works ✅
- User message sent: "It's Mystique's birthday! Help me plan something special"
- **Memory whisper appears**: "I recall Mystique's travel preferences" (shows Mira remembers context)
- **AI response**: Personalized, contextual, knows pet name "Mystique"
- **Quick reply chips**: At home, Pet cafe, Garden/outdoor, Hotel staycation, Not sure yet
- **Intelligence logging**: Topic detected as "celebration", follow-up tracking works
- **Voice auto-plays**: Mira speaks the response
- **Picks update**: After chat, picks populate with 7 relevant items (6 products + 1 service)
- **Services badge**: Updates to show 7 new items
- **Auto-scroll**: Chat auto-scrolls to new messages

## What's Broken ❌
| Issue | Severity | Details |
|-------|----------|---------|
| **DUPLICATE quick reply chips** | HIGH | Same reply options appear TWICE — once inside Mira's message bubble, AND again as separate buttons below. User sees: `At home | Pet cafe | Garden/outdoor | Hotel staycation | Not sure yet` duplicated in two rows |
| **Voice auto-plays without consent** | MEDIUM | Mira automatically starts speaking. No opt-in. Shows "Mira speaking... tap to stop" in bottom right. Could startle users |
| **Test Scenarios don't hide** | MEDIUM | After clicking a scenario and starting a chat, the Test Scenarios box stays visible above the conversation. Should collapse or hide |
| **Memory whisper may be irrelevant** | LOW | Shows "travel preferences" when the topic is birthday. Should show celebration-related memories |
| **Personality traits change** | LOW | Between sessions, the personality chips show different traits (Glamorous soul/Elegant paws vs Friendly soul/loving). Should be consistent per pet |

---

# 5. CONSOLE ERRORS (Mira Demo)

## Critical Errors
```
CORS: Access to 'https://pet-engage-hub.emergent.host/api/os/icon-state' blocked
  → No 'Access-Control-Allow-Origin' header
  → This is a DIFFERENT backend service, not the main API

502: /api/pets/my-pets (intermittent)
502: /api/member/notifications/inbox/ (breaks notification bell)
502: /api/pets/{id}/soul (soul data missing - but frontend falls back)
```

## Notable Logs
```
[PETS] Loaded 8 pets (when it works)
[WEATHER] Loaded weather for Mumbai : danger (35°C!)
[MIRA Intelligence] {topic: celebration, contextUsed: Array(0)}
[MIRA CHAT] Response received: success
[MIRA VOICE] Triggering voice, text length: 272
[miraPicks] hasNew:true, products:6, services:1, total:7 (after chat)
[IconState] mojo:PULSE, today:ON, picks:OFF, services:ON, concierge:ON(1)
```

---

# 6. COMPARISON: MIRA DEMO vs WHAT IT SHOULD BE

## Based on Asset Directory (User's Vision)

### What EXISTS in Backend (Not Surfaced):
| Backend File | Lines | Purpose | Visible in Demo? |
|-------------|-------|---------|:-:|
| mira_routes.py | 1.1MB | Main chat API | ✅ Chat works |
| mira_intelligence.py | 38K | AI logic | ✅ Topic detection works |
| mira_memory.py | 30K | Memory system | ⚠️ Memory whisper shows but may be wrong context |
| mira_proactive.py | 40K | Proactive alerts | ❌ No proactive alerts visible |
| mira_service_desk.py | 45K | Service desk | ❌ Concierge tab broken |
| mira_session_persistence.py | 20K | Sessions | ⚠️ Sessions created but not persistent across visits |
| mira_nudges.py | 18K | Nudge logic | ❌ No nudges visible |
| mira_notifications.py | 14K | Notifications | ❌ Notification bell shows 9+ but inbox 502 |
| soul_intelligence.py | 36K | Pet personality | ⚠️ Traits show but change between sessions |
| mira_streaming.py | 8K | Streaming | ✅ Response streams |
| mira_voice.py | 4K | Voice | ✅ Voice works (but auto-plays) |

### Missing Frontend Components (From Asset Directory):
| Component | Purpose | Present in Demo? |
|-----------|---------|:-:|
| MemoryWhisper.jsx | Soul memory hints | ✅ Shows but wrong context |
| MojoProfileModal.jsx | Pet profile | ⚠️ Partial — shows in header |
| SoulKnowledgeTicker.jsx | Soul facts | ❌ Not visible |
| ProactiveAlertsBanner.jsx | Alerts | ❌ Not visible |
| WelcomeHero.jsx | Welcome screen | ❌ No welcome hero, jumps to test scenarios |
| NotificationBell.jsx | Bell + badge | ⚠️ Shows badge (9+) but inbox broken |
| InboxRow.jsx | Notification rows | ❌ Inbox 502 |

---

# 7. THE VERDICT

## What's IMPRESSIVE (Keep):
1. AI chat actually works — contextual, personalized, knows pet name
2. Memory whisper system exists
3. Voice response works
4. Quick reply chips are contextual
5. Picks dynamically update after conversation
6. Soul score (87%) and personality traits display
7. Pet switching works (8 pets loaded)

## What's BROKEN (Fix):
1. **Intermittent backend** — login fails randomly, APIs return 502
2. **CORS on icon-state** — pet-engage-hub.emergent.host blocks requests
3. **Duplicate quick reply chips** — same options rendered twice
4. **Services tab navigates away** — should be in-page, not redirect
5. **Concierge tab** — "Failed to load concierge data"
6. **Picks tab** — "Could not load personalized picks" (until chat activates them)
7. **Voice auto-plays** — no user consent
8. **Session not persistent** — requires login every visit
9. **Test scenarios don't collapse** after use
10. **Proactive alerts, nudges, soul ticker** — ALL built in backend but NOT surfaced

## What's MISSING (Build):
1. Welcome hero / onboarding experience for new users
2. Soul knowledge ticker showing pet facts
3. Proactive alert banner ("Time for Mystique's walk!")
4. Proper notification inbox
5. Consistent personality traits across sessions
6. Soul-first experience (the demo should FEEL like you're interacting with your pet's soul)

---

*Deep audit conducted with live login (dipali@clubconcierge.in), testing all 5 tabs, chat scenarios, voice, and console error analysis.*
