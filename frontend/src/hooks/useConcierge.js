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
 *   → Creates service_desk_ticket with MASTER BRIEFING NOTE (v2 — March 2026)
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
import { getAllergiesFromPet, buildMasterBriefing, buildMasterMetadata } from '../utils/masterBriefing';

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
  order:    'order_placed',
  message:  'mira_chat_intent',
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
    metadata   = {},   // caller extra metadata — merged over master
    silent     = false,
    toastMsg   = null,
    // ── NEW: structured details for master briefing ──────────────────
    details    = {},
  } = {}) => {

    const petName     = pet?.name    || 'your dog';
    const itemName    = name || item?.name || 'this service';
    const intentType  = INTENT_MAP[type]   || 'concierge_request';
    const intentUrge  = urgency || URGENCY_MAP[type] || 'normal';
    const pillarName  = pillar  || 'general';
    const loadKey     = `${type}_${item?.id || item?._id || name || 'req'}`;

    setLoading(prev => ({ ...prev, [loadKey]: true }));

    try {
      // ── Enrich details from item + known context ───────────────────
      const enrichedDetails = {
        product_name:  name  || item?.name,
        product_id:    item?.id   || item?._id,
        service_name:  name  || item?.name,
        price:         item?.price || item?.original_price || item?.discounted_price,
        pillar:        pillarName,
        channel:       channel || `${pillarName}_${type}`,
        urgency:       intentUrge,
        notes:         note,
        delivery_date: date,
        ...details,  // caller-provided details override auto-enrichment
      };

      // ── Build MASTER briefing text ─────────────────────────────────
      const briefingText = buildMasterBriefing(pet, user, intentType, enrichedDetails);

      // ── Build MASTER metadata object ───────────────────────────────
      const masterMetadata = buildMasterMetadata(pet, user, enrichedDetails, metadata);

      // ── Assemble full payload ──────────────────────────────────────
      const payload = {
        // Pet + user context
        pet_id:        pet?.id,
        pet_name:      petName,
        pet_breed:     pet?.breed,
        pet_allergies: getAllergiesFromPet(pet),
        parent_id:     user?.id    || user?.email,
        parent_email:  user?.email || '',
        parent_name:   user?.name  || user?.full_name || user?.email?.split('@')[0] || '',
        parent_phone:  user?.phone || user?.whatsapp  || '',

        // Intent
        intent_primary: intentType,
        pillar:         pillarName,
        urgency:        intentUrge,
        channel:        enrichedDetails.channel,

        // Subject line
        subject: buildSubject(type, itemName, petName),

        // MASTER BRIEFING — full structured text
        initial_message: {
          text:   briefingText,
          sender: 'member',
          source: enrichedDetails.channel,
        },

        // Item details (top-level for fast DB queries)
        product_id:   enrichedDetails.product_id,
        product_name: enrichedDetails.product_name,
        price:        enrichedDetails.price,

        // MASTER METADATA — every field, always
        metadata: masterMetadata,

        // Force create + notify admin
        force_new: true,
      };

      // ── POST to service desk ───────────────────────────────────────
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

      // ── Show toast ─────────────────────────────────────────────────
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

  /** Bundle purchase */
  const bundle = useCallback((item, opts = {}) =>
    fire({ type: 'bundle', item, channel: `${pillar}_bundle`, ...opts }),
  [fire, pillar]);

  /** Guided path request */
  const path = useCallback((item, opts = {}) =>
    fire({
      type: 'path',
      item,
      channel: `${pillar}_guided_path`,
      ...opts,
    }),
  [fire, pillar]);

  /** NearMe venue booking */
  const nearme = useCallback((item, opts = {}) =>
    fire({
      type: 'nearme',
      item,
      channel: `${pillar}_nearme`,
      ...opts,
    }),
  [fire, pillar]);

  /** Emergency / urgent */
  const urgent = useCallback((item, opts = {}) =>
    fire({
      type: 'urgent',
      item,
      urgency: 'emergency',
      channel: `${pillar}_emergency`,
      ...opts,
    }),
  [fire, pillar]);

  /** Fare well */
  const farewell = useCallback((item, opts = {}) =>
    fire({
      type: 'farewell',
      item,
      urgency: 'high',
      channel: `${pillar}_farewell`,
      ...opts,
    }),
  [fire]);

  /** General concierge request */
  const request = useCallback((item, opts = {}) =>
    fire({
      type: 'request',
      item,
      channel: `${pillar}_request`,
      ...opts,
    }),
  [fire, pillar]);

  /** Service booking (alias for book, service pillar) */
  const service = useCallback((item, opts = {}) =>
    fire({ type: 'service', item, channel: `${pillar}_service`, ...opts }),
  [fire, pillar]);

  /** Mira chat intent */
  const chat = useCallback((item, opts = {}) =>
    fire({
      type:    'chat',
      item,
      silent:  true,
      channel: `${pillar}_mira_chat`,
      ...opts,
    }),
  [fire, pillar]);

  /** Order confirmed (post-Razorpay) */
  const order = useCallback((item, opts = {}) =>
    fire({
      type:    'order',
      item,
      channel: `${pillar}_order_confirmed`,
      ...opts,
    }),
  [fire]);

  return {
    book, bundle, path, nearme, urgent, farewell,
    request, service, chat, order,
    fire, toast: toastState, loading,
  };
}

// ── Subject line builder ───────────────────────────────────────────────────
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

function buildToastMessage(type, itemName, petName) {
  if (type === 'urgent')   return `🚨 Concierge® is responding immediately for ${petName}.`;
  if (type === 'farewell') return `Concierge® will reach out to help honour ${petName}. We are with you. 🌷`;
  if (type === 'bundle')   return `${itemName} added — Concierge® will arrange delivery for ${petName}.`;
  if (type === 'path')     return `Concierge® is setting up "${itemName}" for ${petName}.`;
  if (type === 'nearme')   return `Concierge® will contact ${itemName} for ${petName}.`;
  if (type === 'order')    return `Order confirmed — Concierge® will follow up for ${petName}.`;
  if (type === 'message')  return `Mira has noted this for ${petName}'s profile.`;
  return `Concierge® is arranging ${itemName} for ${petName}.`;
}
