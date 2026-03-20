/**
 * usePlatformTracking.js
 * The Doggy Company
 *
 * Captures every meaningful user action and feeds it into the
 * existing service desk as a ticket. No new backend needed.
 * Uses POST /api/service_desk/attach_or_create_ticket exactly
 * as every "Book →" button already does.
 *
 * WHAT IT TRACKS:
 *   - Pillar page visits (care, dine, celebrate etc.)
 *   - Search queries (NearMe, product search, Mira search)
 *   - Product views
 *   - Tab changes within a pillar
 *   - Mira chat messages
 *   - Onboarding steps completed
 *
 * WHAT IT DOES NOT TRACK:
 *   - Already-tracked booking actions (those create their own tickets)
 *   - Soul profile answers (those go to pet-soul endpoint)
 *   - Page scrolling or hover
 *
 * USAGE — one line per pillar page, in useEffect:
 *
 *   import { usePlatformTracking, trackEvent } from "../hooks/usePlatformTracking";
 *
 *   // In any *SoulPage.jsx:
 *   usePlatformTracking({ pillar: "care", pet: petData });
 *
 *   // For specific events anywhere:
 *   trackEvent("search", { pillar:"care", query:"groomers bangalore", pet_id: pet.id });
 *   trackEvent("product_view", { pillar:"shop", entity_name:"Full Spa Grooming", pet_id: pet.id });
 *   trackEvent("nearme_search", { pillar:"celebrate", query:"pet photographer", pet_id: pet.id });
 *
 * ADMIN SEES:
 *   In service desk inbox — a ticket with:
 *   intent_primary: "browse_intent" | "search_intent" | "product_interest" | "nearme_search"
 *   channel: "care_pillar_page" | "search_bar" | "nearme" etc.
 *   status: "open" (auto-assigned, low urgency)
 *   initial_message: "Maya's parent visited /care and searched for groomers in bangalore"
 *
 * MIRA SEES:
 *   The ticket thread — she can proactively follow up on WhatsApp:
 *   "Hi! I noticed you were looking at groomers for Maya. Want me to arrange one?"
 *
 * DEDUPLICATION:
 *   Uses sessionStorage to prevent duplicate tickets per session.
 *   Same pillar visit in same session = one ticket, appended messages.
 *   New session = new ticket.
 */

import { useEffect, useRef, useCallback } from "react";
import { API_URL } from "../utils/api";

// ── Session-level deduplication ────────────────────────────────────────
// One ticket per pillar per session. Prevents spam from pillar revisits.
const SESSION_KEY = "tdc_tracking_tickets";

function getSessionTickets() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}");
  } catch { return {}; }
}

function setSessionTicket(pillar, ticketId) {
  try {
    const tickets = getSessionTickets();
    tickets[pillar] = ticketId;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(tickets));
  } catch {}
}

function getSessionTicket(pillar) {
  return getSessionTickets()[pillar] || null;
}

// ── Auth helper ────────────────────────────────────────────────────────
function getAuth() {
  try {
    const token = localStorage.getItem("tdb_auth_token");
    const user  = JSON.parse(localStorage.getItem("user") || "null");
    return { token, user };
  } catch { return { token: null, user: null }; }
}

// ── Core fire function ─────────────────────────────────────────────────
async function fireIntent({
  pillar,
  intent_primary,
  channel,
  message,
  pet_id,
  entity_name,
  query,
  urgency = "low",
}) {
  const { token, user } = getAuth();
  if (!token || !user) return null; // not logged in — don't track

  const parent_id = user.id || user.email;
  const existingTicketId = getSessionTicket(pillar);

  try {
    const body = {
      parent_id,
      pet_id: pet_id || "",
      pillar,
      intent_primary,
      intent_secondary: [query ? "search_query" : "browse_intent", entity_name ? "product_interest" : null].filter(Boolean),
      channel,
      urgency,
      life_state: pillar === "emergency" ? "CONCERN" : pillar === "celebrate" ? "CELEBRATE" : "EXPLORE",
      status: "open",
      initial_message: {
        sender: "system",
        text: message,
        metadata: { query, entity_name, auto_tracked: true },
      },
    };

    // If we have an existing ticket for this pillar this session,
    // append to it rather than creating a new one
    if (existingTicketId) {
      await fetch(`${API_URL}/api/service_desk/append_message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticket_id: existingTicketId,
          message: {
            sender: "system",
            text: message,
            metadata: { query, entity_name, auto_tracked: true },
          },
        }),
      });
      return existingTicketId;
    }

    // New ticket
    const res = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      const ticketId = data.ticket_id || data.id;
      if (ticketId) setSessionTicket(pillar, ticketId);
      return ticketId;
    }
  } catch {} // silent — tracking must never break the UX
  return null;
}

// ── Public trackEvent function (for use outside the hook) ──────────────
export async function trackEvent(eventType, params = {}) {
  const { pillar = "shop", pet_id, query, entity_name, tab } = params;

  const messages = {
    pillar_visit:   `Visited /${pillar}${pet_id ? " for pet " + pet_id : ""}`,
    search:         `Searched "${query}" on /${pillar}`,
    nearme_search:  `Used Find Nearby — searched "${query}" on /${pillar}`,
    product_view:   `Viewed product: ${entity_name} on /${pillar}`,
    tab_change:     `Switched to "${tab}" tab on /${pillar}`,
    mira_chat:      `Asked Mira: "${query?.slice(0, 80)}"`,
    onboarding_step:`Completed onboarding step: ${tab}`,
  };

  const intents = {
    pillar_visit:   "browse_intent",
    search:         "search_intent",
    nearme_search:  "nearme_search",
    product_view:   "product_interest",
    tab_change:     "browse_intent",
    mira_chat:      "mira_chat_intent",
    onboarding_step:"onboarding_progress",
  };

  const channels = {
    pillar_visit:   `${pillar}_pillar_page`,
    search:         "search_bar",
    nearme_search:  "nearme_tab",
    product_view:   `${pillar}_product_card`,
    tab_change:     `${pillar}_tab_bar`,
    mira_chat:      "mira_os",
    onboarding_step:"onboarding_flow",
  };

  await fireIntent({
    pillar,
    intent_primary: intents[eventType] || "browse_intent",
    channel:        channels[eventType] || pillar,
    message:        messages[eventType] || `User action: ${eventType} on /${pillar}`,
    pet_id,
    query,
    entity_name,
  });
}

// ── Main hook ──────────────────────────────────────────────────────────
export function usePlatformTracking({ pillar, pet, delay = 3000 }) {
  const tracked = useRef(false);

  // Track pillar visit after 3 seconds (user actually engaged, not a bounce)
  useEffect(() => {
    if (tracked.current || !pillar) return;
    const timer = setTimeout(() => {
      tracked.current = true;
      trackEvent("pillar_visit", {
        pillar,
        pet_id: pet?.id || pet?._id,
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [pillar, pet?.id, delay]);

  // Return trackEvent bound to this pillar for convenience
  const track = useCallback((eventType, params = {}) => {
    trackEvent(eventType, {
      pillar,
      pet_id: pet?.id || pet?._id,
      ...params,
    });
  }, [pillar, pet?.id]);

  return { track };
}

export default usePlatformTracking;
