/**
 * MiraCardActions.js
 * The Doggy Company — Canonical "Book via Concierge" utility
 *
 * GOLDEN RULE: Every modal "Send to Concierge →" button MUST call bookViaConcierge().
 * MASTER TICKET STANDARD — full briefing note every time.
 */

import { tdc } from "./tdc_intent";
import { getAllergiesFromPet, buildMasterBriefing, buildMasterMetadata } from "./masterBriefing";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

/**
 * bookViaConcierge — single canonical function for ALL pillar concierge modals.
 * Fires tdc.book() immediately (non-blocking) then creates the enriched ticket.
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
  photo_url,
  customisation,
  onSuccess,
  onError,
} = {}) {
  const serviceName = service || occasion || "a service";
  const ch = channel || `${pillar}_concierge_modal`;

  // 1. Fire tdc.book() immediately — non-blocking
  tdc.book({ service: serviceName, pillar, pet, channel: ch, amount });

  // 2. Create enriched service desk ticket with MASTER BRIEFING
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const petName = pet?.name || "your pet";

  const details = {
    service_name:  serviceName,
    pillar,
    channel:       ch,
    price:         amount,
    notes,
    delivery_date: date,
    photo_url,
    customisation,
    urgency:       'high',
  };

  const briefing = buildMasterBriefing(pet, user, 'service_booking', details);
  const metadata = buildMasterMetadata(pet, user, details, {
    parent_id: user?.id || user?.email || "guest",
  });

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
        pet_name:      petName,
        pet_breed:     pet?.breed,
        pet_allergies: getAllergiesFromPet(pet),
        parent_email:  user?.email || '',
        parent_name:   user?.name || user?.full_name || '',
        parent_phone:  user?.phone || user?.whatsapp || '',
        pillar,
        intent_primary:  "service_booking",
        channel:         ch,
        life_state:      "PLAN",
        urgency:         "high",
        status:          "open",
        force_new:       true,
        subject:         `Booking Request: ${serviceName} for ${petName}`,
        initial_message: {
          sender: "parent",
          text:   briefing,
          source: ch,
        },
        product_name: serviceName,
        price:        amount,
        metadata,
      }),
    });

    if (res.ok) {
      onSuccess && onSuccess(await res.json());
    } else {
      console.warn(`[bookViaConcierge] ticket creation returned ${res.status}`);
      onSuccess && onSuccess(null);
    }
  } catch (err) {
    console.error("[bookViaConcierge] error:", err);
    onError ? onError(err) : onSuccess && onSuccess(null);
  }
}

/**
 * guidedPathComplete — for guided path "Hand to Concierge →" submit buttons.
 * Creates a service_desk ticket with the full path selections + MASTER BRIEFING.
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

  // Fire tdc.request() immediately
  tdc.request({
    text:    `Completed guided path: ${pathTitle}`,
    name:    pathTitle,
    pillar,
    pet,
    channel: ch,
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const details = {
    service_name:  pathTitle,
    pillar,
    channel:       ch,
    notes:         selectionSummary ? `Path selections: ${selectionSummary}` : undefined,
    urgency:       'medium',
    customisation: selections,
  };

  const briefing = buildMasterBriefing(pet, user, 'guided_path_booking', details);
  const metadata = buildMasterMetadata(pet, user, details, {
    path_id: pathId,
    path_title: pathTitle,
    selections,
  });

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
        pet_name:      petName,
        pet_breed:     pet?.breed,
        pet_allergies: getAllergiesFromPet(pet),
        parent_email:  user?.email || '',
        parent_name:   user?.name || user?.full_name || '',
        parent_phone:  user?.phone || user?.whatsapp || '',
        pillar,
        intent_primary:  "guided_path_booking",
        channel:         ch,
        life_state:      "PLAN",
        urgency:         "medium",
        status:          "open",
        subject:         `Guided Plan: ${pathTitle} for ${petName}`,
        initial_message: {
          sender: "parent",
          text:   briefing,
          source: ch,
        },
        product_name: pathTitle,
        metadata,
      }),
    });
    if (res.ok) onSuccess && onSuccess(await res.json());
    else onSuccess && onSuccess(null);
  } catch (err) {
    console.error("[guidedPathComplete] error:", err);
    onSuccess && onSuccess(null);
  }
}
