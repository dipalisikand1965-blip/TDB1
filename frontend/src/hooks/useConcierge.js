/**
 * useConcierge.js — THE single canonical hook for ALL concierge actions
 * The Doggy Company
 *
 * ONE hook. ONE function. Covers EVERYTHING:
 * - Product bookings
 * - Service bookings
 * - Bundle purchases
 * - Guided path requests
 * - NearMe venue bookings
 * - Mira chat intents
 * - Emergency alerts
 * - Farewell requests
 * - Cart additions
 * - Soul profile answers
 *
 * Every call:
 *   → Creates service_desk_ticket with Mira briefing
 *   → Fires admin bell notification
 *   → Adds to member /my-requests inbox
 *   → Sends WhatsApp confirmation
 *   → Shows ConciergeToast on screen
 *
 * USAGE:
 *   const { book, request, urgent, toast } = useConcierge({ pet: currentPet, pillar: 'learn' });
 *   <button onClick={() => book(product)}>Book via Concierge →</button>
 *
 * Drop in: /app/frontend/src/hooks/useConcierge.js
 */

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

// ── Intent type mapping ────────────────────────────────────────────────────
const INTENT_MAP = {
  book:     'service_booking',
  bundle:   'bundle_purchase',
  path:     'guided_path_request',
  nearme:   'nearme_booking',
  chat:     'mira_chat_intent',
  urgent:   'emergency_alert',
  farewell: 'farewell_request',
  cart:     'browse_intent',
  service:  'service_booking',
  product:  'product_interest',
  request:  'concierge_request',
  order:    'order_placed',        // ← Razorpay order confirmed
  message:  'mira_chat_intent',    // ← Mira chat message
};

// ── Urgency mapping ────────────────────────────────────────────────────────
const URGENCY_MAP = {
  urgent:   'emergency',
  farewell: 'high',
  book:     'normal',
  bundle:   'normal',
  path:     'normal',
  nearme:   'normal',
  service:  'normal',
  product:  'low',
  request:  'normal',
  order:    'normal',
  message:  'low',
};

export function useConcierge({ pet, pillar } = {}) {
  const { token, user } = useAuth();
  const [toastState, setToastState] = useState({ visible: false });
  const [loading,    setLoading]    = useState({});

  // ── Show toast ─────────────────────────────────────────────────────────
  const showToast = useCallback((message, petName, serviceName) => {
    setToastState({ visible: true, message, petName, serviceName });
    setTimeout(() => setToastState(prev => ({ ...prev, visible: false })), 5000);
  }, []);

  // ── Core fire function ─────────────────────────────────────────────────
  const fire = useCallback(async ({
    type       = 'book',
    item       = null,
    name       = null,
    note       = null,
    date       = null,
    urgency    = null,
    channel    = null,
    metadata   = {},
    silent     = false,   // skip toast if true
    toastMsg   = null,
  } = {}) => {

    const petName     = pet?.name    || 'your dog';
    const itemName    = name || item?.name || 'this service';
    const intentType  = INTENT_MAP[type]   || 'concierge_request';
    const intentUrge  = urgency || URGENCY_MAP[type] || 'normal';
    const pillarName  = pillar || 'general';
    const loadKey     = `${type}_${item?.id || item?._id || name || 'req'}`;

    setLoading(prev => ({ ...prev, [loadKey]: true }));

    try {
      // ── Build ticket payload ───────────────────────────────────────────
      const payload = {
        // Pet + user context
        pet_id:       pet?.id,
        pet_name:     petName,
        pet_breed:    pet?.breed,
        parent_id:    user?.id   || user?.email,
        parent_email: user?.email,
        parent_name:  user?.name,

        // Intent
        intent_primary: intentType,
        pillar:         pillarName,
        urgency:        intentUrge,
        channel:        channel || `${pillarName}_${type}`,

        // What was requested
        subject: buildSubject(type, itemName, petName),
        initial_message: {
          text: buildMessage(type, itemName, petName, note, date),
          sender: 'member',
        },

        // Item details
        product_id:   item?.id   || item?._id,
        product_name: item?.name || name,
        price:        item?.price,

        // Extra metadata
        ...metadata,

        // Force create even if similar ticket exists
        force_new: true, // always notify admin
      };

      // ── POST to service desk ───────────────────────────────────────────
      const res = await fetch(
        `${API_URL}/api/service_desk/attach_or_create_ticket`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        console.error('[useConcierge] Ticket creation failed:', res.status);
      }

      // ── Show toast ─────────────────────────────────────────────────────
      if (!silent) {
        const msg = toastMsg || buildToastMessage(type, itemName, petName);
        showToast(msg, petName, itemName);
      }

      const data = await res.json().catch(() => ({}));
      return data;

    } catch (err) {
      console.error('[useConcierge] Error:', err);
      if (!silent) {
        showToast(`Concierge® will be in touch on WhatsApp.`, petName, itemName);
      }
    } finally {
      setLoading(prev => ({ ...prev, [loadKey]: false }));
    }
  }, [pet, pillar, token, user, showToast]);

  // ── Convenience methods ────────────────────────────────────────────────

  /** Book a product or service */
  const book = useCallback((item, opts = {}) =>
    fire({ type: 'book', item, channel: `${pillar}_book`, ...opts }),
  [fire, pillar]);

  /** Add a bundle */
  const bundle = useCallback((item, opts = {}) =>
    fire({ type: 'bundle', item, channel: `${pillar}_bundle`, ...opts }),
  [fire, pillar]);

  /** Guided path action */
  const path = useCallback((pathObj, source = 'send_to_concierge', opts = {}) =>
    fire({
      type:    source === 'request_help' ? 'request' : 'path',
      name:    pathObj?.title || pathObj?.name,
      urgency: source === 'request_help' ? 'high' : 'normal',
      channel: `${pillar}_guided_path_${source}`,
      metadata: { path_id: pathObj?.id, path_steps: pathObj?.steps },
      ...opts,
    }),
  [fire, pillar]);

  /** NearMe venue booking */
  const nearme = useCallback((place, opts = {}) =>
    fire({
      type:    'nearme',
      name:    place?.name,
      channel: `${pillar}_nearme`,
      metadata: {
        place_name:    place?.name,
        place_address: place?.formatted_address || place?.vicinity,
        place_id:      place?.place_id,
      },
      ...opts,
    }),
  [fire, pillar]);

  /** Emergency / urgent */
  const urgent = useCallback((text, opts = {}) =>
    fire({
      type:    'urgent',
      name:    text || 'Emergency assistance needed',
      urgency: 'emergency',
      channel: `${pillar}_emergency`,
      ...opts,
    }),
  [fire, pillar]);

  /** Farewell request — always HIGH urgency */
  const farewell = useCallback((item, opts = {}) =>
    fire({
      type:    'farewell',
      item,
      urgency: 'high',
      channel: 'farewell_request',
      ...opts,
    }),
  [fire]);

  /** General concierge request */
  const request = useCallback((text, opts = {}) =>
    fire({
      type:    'request',
      name:    text,
      channel: `${pillar}_request`,
      ...opts,
    }),
  [fire, pillar]);

  /** Product interest (passive — no toast by default) */
  const view = useCallback((item, opts = {}) =>
    fire({
      type:   'product',
      item,
      silent: true,
      channel: `${pillar}_view`,
      ...opts,
    }),
  [fire, pillar]);

  // ── Toast component data ───────────────────────────────────────────────
  const toast = {
    visible:     toastState.visible,
    message:     toastState.message,
    petName:     toastState.petName,
    serviceName: toastState.serviceName,
    hide:        () => setToastState(prev => ({ ...prev, visible: false })),
  };

  /** Mira chat message — creates ticket silently, no toast by default */
  const chat = useCallback((message, sessionId, opts = {}) =>
    fire({
      type:    'message',
      name:    message?.slice(0, 80) || 'Mira conversation',
      silent:  true,   // no toast for every chat message
      channel: `${pillar || 'mira'}_chat`,
      metadata: {
        session_id:    sessionId,
        message_text:  message,
        pillar:        pillar,
      },
      ...opts,
    }),
  [fire, pillar]);

  /** Order confirmed — fires after successful Razorpay payment */
  const order = useCallback((orderData, opts = {}) =>
    fire({
      type:    'order',
      name:    orderData?.product_name || orderData?.name || 'Order',
      silent:  false,
      channel: 'razorpay_order_confirmed',
      metadata: {
        order_id:      orderData?.order_id || orderData?.razorpay_order_id,
        payment_id:    orderData?.razorpay_payment_id,
        amount:        orderData?.amount,
        product_name:  orderData?.product_name,
        product_id:    orderData?.product_id,
      },
      ...opts,
    }),
  [fire]);

  return {
    book, bundle, path, nearme, urgent, farewell, request, view,
    chat, order,
    fire, toast, loading,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function buildSubject(type, itemName, petName) {
  const subjects = {
    book:     `Booking Request: ${itemName} for ${petName}`,
    bundle:   `Bundle Purchase: ${itemName} for ${petName}`,
    path:     `Guided Plan: ${itemName} for ${petName}`,
    nearme:   `NearMe Booking: ${itemName} for ${petName}`,
    urgent:   `🚨 URGENT: ${itemName} — ${petName}`,
    farewell: `Farewell Arrangements for ${petName}`,
    service:  `Service Request: ${itemName} for ${petName}`,
    product:  `Product Interest: ${itemName} for ${petName}`,
    request:  `Concierge Request for ${petName}`,
    order:    `Order Confirmed: ${itemName} for ${petName}`,
    message:  `Mira Chat: ${petName}'s conversation`,
  };
  return subjects[type] || `Request for ${petName}`;
}

function buildMessage(type, itemName, petName, note, date) {
  let msg = '';
  if (type === 'urgent')   msg = `URGENT — ${petName} needs immediate help: ${itemName}`;
  else if (type === 'farewell') msg = `Please help arrange farewell services for ${petName}.`;
  else if (type === 'path') msg = `Please arrange the "${itemName}" programme for ${petName}.`;
  else if (type === 'nearme') msg = `Please contact ${itemName} and arrange a visit for ${petName}.`;
  else msg = `Please arrange "${itemName}" for ${petName}.`;
  if (date) msg += ` Preferred date: ${date}.`;
  if (note) msg += ` Note: ${note}`;
  return msg;
}

function buildToastMessage(type, itemName, petName) {
  if (type === 'urgent')   return `🚨 Concierge® is responding immediately for ${petName}.`;
  if (type === 'farewell') return `Concierge® will reach out to help honour ${petName}. We are with you. 🌷`;
  if (type === 'bundle')   return `${itemName} added — Concierge® will arrange delivery for ${petName}.`;
  if (type === 'path')     return `Concierge® is setting up "${itemName}" for ${petName}.`;
  if (type === 'nearme')   return `Concierge® will contact ${itemName} for ${petName}.`;
  if (type === 'order')   return `Order confirmed — Concierge® will follow up for ${petName}.`;
  if (type === 'message') return `Mira has noted this for ${petName}'s profile.`;
  return `Concierge® is arranging ${itemName} for ${petName}.`;
}
