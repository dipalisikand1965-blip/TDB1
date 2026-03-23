# Concierge Flow Gap Analysis
_Created: 2026-03-23_

## The Rule
**ALL service bookings and custom order requests MUST route through `service_desk_tickets` via `POST /api/service_desk/attach_or_create_ticket`.**

There are 3 approved ways to do this:

| Method | File | How it works |
|--------|------|-------------|
| `attach_or_create_ticket` directly | Various | Direct `fetch()` to the endpoint |
| `bookViaConcierge()` | `/app/frontend/src/utils/MiraCardActions.js` | Wrapper: fires `tdc.book()` + creates ticket |
| `useConcierge()` hook | `/app/frontend/src/hooks/useConcierge.js` | React hook: `request(text, options)` → ticket |

**All three ultimately POST to `/api/service_desk/attach_or_create_ticket`.**

---

## Files Using Canonical Flow (✅ ALL GOOD)

### Direct `attach_or_create_ticket` (31 files):
```
components/ProductCard.jsx
components/care/CareContentModal.jsx
components/celebrate/CelebrateContentModal.jsx
components/celebrate/ProductDetailModal.jsx
components/common/MiraImaginesBreed.jsx
components/common/MiraImaginesCard.jsx
components/common/ProductModal.jsx
components/dine/DineContentModal.jsx
components/go/GoContentModal.jsx
components/learn/GuidedLearnPaths.jsx
components/learn/LearnNearMe.jsx
hooks/mira/useChat.js
hooks/useBookConcierge.js
hooks/useConcierge.js
hooks/usePlatformTracking.js
pages/AdoptSoulPage.jsx
pages/CareSoulPage.jsx
pages/DineSoulPage.jsx
pages/EmergencySoulPage.jsx
pages/FarewellSoulPage.jsx
pages/GoSoulPage.jsx
pages/LearnSoulPage.jsx
pages/PaperworkSoulPage.jsx
pages/PlaySoulPage.jsx
pages/ServicesSoulPage.jsx
pages/ShopSoulPage.jsx
utils/MiraCardActions.js
utils/sendToAdminInbox.js
utils/tdc_intent.js
```

### Via `bookViaConcierge()` wrapper (31 files):
```
components/CallbackRequestModal.jsx
components/CareFlowModal.jsx
components/CareServiceFlowModal.jsx
components/FlowModal.jsx
components/GroomingFlowModal.jsx
components/Mira/QuickConciergeModal.jsx
components/Mira/ServiceQuickViewModal.jsx
components/OccasionBoxBuilder.jsx
components/ServiceBookingModal.jsx
components/VetVisitFlowModal.jsx
components/adopt/AdoptNearMe.jsx
components/care/CareConciergeModal.jsx
components/celebrate/CelebrateNearMe.jsx
components/celebrate/ConciergeIntakeModal.jsx
components/celebrate/ProductDetailModal.jsx
components/dine/ConciergeIntakeModal.jsx
components/dine/DineConciergeModal.jsx
components/dine/MealBoxCard.jsx
components/emergency/EmergencyNearMe.jsx
components/farewell/FarewellNearMe.jsx
components/go/GoConciergeModal.jsx
components/learn/LearnTopicModal.jsx
components/play/PlayConciergeModal.jsx
components/play/PlayContentModal.jsx
components/play/PlayNearMe.jsx
pages/GoSoulPage.jsx
pages/LearnSoulPage.jsx
pages/PaperworkSoulPage.jsx
pages/PlaySoulPage.jsx
pages/ServicesSoulPage.jsx
utils/MiraCardActions.js
```

### Via `useConcierge()` hook (4 files):
```
components/PillarSoulProfile.jsx
components/SoulMadeModal.jsx
components/common/NearMeConciergeModal.jsx
pages/PetVault.jsx
```

---

## Known Fix Applied This Session

### NearMeConciergeModal.jsx
**Was broken:** Used `bookViaConcierge` (old import that was removed), plus `isOpen`/`venue` props mismatch caused modal to never render.
**Fix:** Switched to `useConcierge` hook with `request()`, fixed prop checking to accept `place` prop.

---

## Display-Only Files (NOT Gaps — Just Mention "Concierge" in UI Text)

These 130+ files mention "Concierge" in labels, headings, or admin views but do NOT have booking actions. They are NOT gaps:
- Admin dashboards (DoggyServiceDesk, ConciergeRequestsDashboard, etc.)
- UI display components (ConciergeToast, ConciergeConfirmation, etc.)
- Navigation (PillarNav, NavigationDock, etc.)
- Chat display (ChatMessage, InboxRow, etc.)

---

## How to Verify Any Component Uses Canonical Flow

```bash
# Check if a file uses ANY of the 3 approved methods:
grep -l "attach_or_create_ticket\|bookViaConcierge\|useConcierge" /path/to/file.jsx

# Find ALL files with booking buttons that might NOT use canonical flow:
grep -rln "Book.*Concierge\|Send.*Concierge\|Tap.*Concierge\|Ask.*Concierge" /app/frontend/src/components/ --include="*.jsx" | while read f; do
  has=$(grep -l "attach_or_create_ticket\|bookViaConcierge\|useConcierge" "$f" 2>/dev/null)
  if [ -z "$has" ]; then
    echo "❌ NEEDS FIX: $f"
  fi
done
```

---

## If Adding a New Concierge Button

**Option A — Simple (recommended for modals):**
```jsx
import { bookViaConcierge } from "../../utils/MiraCardActions";

await bookViaConcierge({
  service: "Service name",
  pillar: "care",
  pet,
  token,
  channel: "care_some_modal",
  notes: "Extra details",
  date: selectedDate,
  onSuccess: () => setSent(true),
});
```

**Option B — React hook (recommended for components with pet context):**
```jsx
import { useConcierge } from "../../hooks/useConcierge";

const { request } = useConcierge({ pet, pillar: "care" });

await request("Booking text here", {
  channel: "care_nearme",
  urgency: "normal",
  metadata: { /* extra data */ },
});
```

**Option C — Direct (for one-off cases):**
```jsx
await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    parent_id: user.id,
    pet_id: pet.id,
    pillar: "care",
    intent_primary: "booking_intent",
    channel: "care_custom",
    initial_message: { sender: "parent", text: "Booking details..." },
  }),
});
```
