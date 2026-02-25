# INSTRUCTIONS - TODAY Panel Full Specification

## Created: February 2026
## Purpose: Single source of truth for TODAY panel implementation

---

## TODAY - Time Layer

**What it is:** Time Layer. Everything that matters "now / soon" across all pets and all pillars.

---

## Components Under TODAY

### 1. Today Summary Header
- "Today ●3" count (number of items needing attention)
- Last updated timestamp
- Optional "Offline / stale" indicator

### 2. Urgent Stack (ALWAYS at top)
- Overdue vaccinations / parasite doses
- Pending emergency follow-up
- Critical expiring documents
- Anything tagged "urgent"

### 3. Due Soon Cards
- Grooming due in X days
- Prevention reminder in X days
- Vet follow-up due
- Reorder window approaching (if consumption known)

### 4. Season + Environment Alerts
- Heat risk alert
- Tick risk elevated this week
- Fireworks week anxiety prep
- Rain gear reminder

### 5. Active Tasks Watchlist
- "Awaiting your confirmation"
- "Concierge is scheduling"
- "Payment pending"
- "Order shipped"

### 6. Documents + Compliance
- Vaccination certificate missing
- License renewal due
- Travel document expiry

### 7. Other Pets (compact, non-clutter)
- "⚠️ Other pets need attention"
- 1–3 condensed lines only

---

## Must NOT be in TODAY
- Browsing products
- Full recommendations sets (that's Picks)
- Booking flows (that's Services)
- Long education content (that's Learn)
- Analytics (that's Insights)

---

## One-Tap Actions
Each Today card MUST have a clear action:
- Arrange
- Book
- Schedule
- Upload
- Confirm
- Remind me

---

## Data Sources
- Memory (cadences + health flags + calendar)
- Tasks system (statuses)
- Weather/location signals

---

## UI Requirements
- Beautiful UI/UX for mobile, desktop, and iOS
- Time-based needs - System thinking lives here
- Proactive awareness, not shopping

---

*Last Updated: February 2026*
