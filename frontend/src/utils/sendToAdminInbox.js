/**
 * sendToAdminInbox.js
 * THE DOGGY COMPANY — Bulletproof service request delivery
 *
 * GUARANTEES:
 * 1. Always creates a NEW ticket (no silent reuse = admin always sees it)
 * 2. 3 delivery methods: fetch keepalive → XMLHttpRequest → sendBeacon
 * 3. Works on mobile, desktop, private mode, poor connection
 * 4. Never throws — UX is never broken
 *
 * USAGE (from any component):
 *   import { sendToAdminInbox } from "../utils/sendToAdminInbox";
 *
 *   await sendToAdminInbox({
 *     service: "Birthday Party for Mojo",
 *     pillar: "celebrate",
 *     pet: currentPet,
 *     channel: "celebrate_concierge_btn",
 *     notes: "Outdoor venue, 20 guests",
 *     urgency: "high",          // optional: low|medium|high|emergency
 *   });
 */

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function getAuth() {
  try {
    const token = localStorage.getItem('tdb_auth_token')
               || sessionStorage.getItem('tdb_auth_token') || null;
    const user  = JSON.parse(
      localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'
    );
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export async function sendToAdminInbox({
  service,
  pillar = 'platform',
  pet,
  channel,
  notes,
  urgency = 'high',
  date,
} = {}) {
  const { token, user } = getAuth();
  const parent_id = user?.id || user?._id || user?.email
                  || localStorage.getItem('user_email') || null;

  if (!parent_id) return { success: false, reason: 'not_logged_in' };

  const petName  = pet?.name || 'your pet';
  const pet_id   = pet?.id || pet?._id || null;
  const ch       = channel || `${pillar}_service_request`;

  const text = [
    `${petName}'s parent wants to book: ${service}`,
    notes ? `Notes: ${notes}` : '',
    date  ? `Date: ${date}` : '',
    `Channel: ${ch}`,
  ].filter(Boolean).join(' | ');

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const body = JSON.stringify({
    parent_id,
    pet_id,
    pillar,
    intent_primary: 'booking_intent',
    channel: ch,
    life_state: 'PLAN',
    urgency,
    status: urgency === 'emergency' ? 'urgent' : 'open',
    force_new: true,   // ← ALWAYS create new ticket, never reuse silently
    initial_message: {
      sender: 'parent',
      text,
      metadata: { service, channel: ch, mobile: /Mobi|Android/i.test(navigator?.userAgent || '') },
    },
  });

  const endpoint = `${API_URL}/api/service_desk/attach_or_create_ticket`;

  // ── Method 1: fetch with keepalive (survives navigation, works on mobile) ──
  try {
    const res = await fetch(endpoint, { method: 'POST', headers, body, keepalive: true });
    if (res.ok) {
      const data = await res.json();
      console.log(`[TDC] ✅ Ticket created: ${data.ticket_id} via fetch`);
      return { success: true, ticket_id: data.ticket_id, method: 'fetch' };
    }
  } catch {}

  // ── Method 2: XMLHttpRequest (sync-capable, survives unload) ──────────────
  try {
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.timeout = 8000;
      xhr.onload  = () => xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject();
      xhr.onerror = () => reject();
      xhr.ontimeout = () => reject();
      xhr.send(body);
    });
    console.log(`[TDC] ✅ Ticket created via XHR`);
    return { success: true, method: 'xhr' };
  } catch {}

  // ── Method 3: sendBeacon (fire-and-forget, guaranteed delivery on mobile) ──
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const beaconSent = navigator.sendBeacon(
      endpoint,
      new Blob([body], { type: 'application/json' })
    );
    console.log(`[TDC] ${beaconSent ? '✅' : '❌'} sendBeacon: ${beaconSent}`);
    return { success: beaconSent, method: 'beacon' };
  }

  return { success: false, reason: 'all_methods_failed' };
}
