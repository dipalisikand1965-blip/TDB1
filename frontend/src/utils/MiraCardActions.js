/**
 * MiraCardActions.js
 * The Doggy Company — Canonical "Book via Concierge" utility
 *
 * GOLDEN RULE: Every modal "Send to Concierge →" button MUST call bookViaConcierge().
 * No pillar-specific /api/concierge/xxx-intake endpoints.
 * All roads lead to service_desk_tickets → admin bell → member /my-requests.
 *
 * Usage:
 *   import { bookViaConcierge } from "../../utils/MiraCardActions";
 *
 *   await bookViaConcierge({
 *     service:  occasion || service?.name,
 *     pillar:   "play",
 *     pet,
 *     token,
 *     channel:  "play_concierge_modal",
 *     amount:   service?.price,
 *     notes:    notesText,
 *     date:     selectedDate,
 *     onSuccess: () => setSent(true),
 *   });
 */

import { tdc } from "./tdc_intent";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

/**
 * bookViaConcierge — single canonical function for ALL pillar concierge modals.
 * Fires tdc.book() immediately (no network wait) then creates the enriched ticket.
 */
export async function bookViaConcierge({
  service,
  pillar = "platform",
  pet,
  token,
  channel,
  amount,
  notes,
  date,
  occasion,
  onSuccess,
  onError,
} = {}) {
  const serviceName = service || occasion || "a service";
  const ch = channel || `${pillar}_concierge_modal`;

  // 1. Fire tdc.book() immediately — non-blocking, no-throw
  tdc.book({ service: serviceName, pillar, pet, channel: ch, amount });

  // 2. Create enriched service desk ticket (canonical flow)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const petName = pet?.name || "your pet";
  const dateNote = date ? ` Date: ${date}.` : "";
  const notesNote = notes ? ` Notes: ${notes}` : "";

  try {
    const res = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        parent_id:     user?.id || user?.email || "guest",
        pet_id:        pet?.id || pet?._id || "unknown",
        pillar,
        intent_primary: "booking_intent",
        channel:        ch,
        life_state:     "PLAN",
        urgency:        "high",
        status:         "open",
        force_new:      true,  // ← always create new ticket → admin always sees it
        initial_message: {
          sender: "parent",
          text: `${petName}'s parent wants to book: ${serviceName} via ${ch}.${dateNote}${notesNote}`,
        },
      }),
    });

    if (res.ok) {
      onSuccess && onSuccess(await res.json());
    } else {
      // Non-2xx — log but don't show error (tdc already tracked)
      console.warn(`[bookViaConcierge] ticket creation returned ${res.status}`);
      onSuccess && onSuccess(null); // still close/confirm the modal
    }
  } catch (err) {
    console.error("[bookViaConcierge] error:", err);
    onError ? onError(err) : onSuccess && onSuccess(null); // graceful degradation
  }
}

/**
 * guidedPathComplete — for guided path "Hand to Concierge →" or submit buttons.
 * Fires tdc.request() + creates a service_desk ticket with the path selections.
 */
export async function guidedPathComplete({
  pathTitle,
  pathId,
  pillar,
  pet,
  token,
  channel,
  selections = {},
  onSuccess,
} = {}) {
  const ch = channel || `${pillar}_guided_paths_complete`;
  const petName = pet?.name || "your pet";
  const selectionSummary = Object.entries(selections)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join(" | ");

  // 1. Fire tdc.request() immediately
  tdc.request({
    text:    `Completed guided path: ${pathTitle}`,
    name:    pathTitle,
    pillar,
    pet,
    channel: ch,
  });

  // 2. Create enriched ticket
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  try {
    const res = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        parent_id:     user?.id || user?.email || "guest",
        pet_id:        pet?.id || pet?._id || "unknown",
        pillar,
        intent_primary: "guided_path_booking",
        channel:        ch,
        life_state:     "PLAN",
        urgency:        "medium",
        status:         "open",
        initial_message: {
          sender: "parent",
          text: `${petName}'s parent completed the "${pathTitle}" guided path on /${pillar}. ${selectionSummary ? `Selections: ${selectionSummary}` : ""}`,
        },
      }),
    });
    if (res.ok) onSuccess && onSuccess(await res.json());
    else onSuccess && onSuccess(null);
  } catch (err) {
    console.error("[guidedPathComplete] error:", err);
    onSuccess && onSuccess(null);
  }
}
