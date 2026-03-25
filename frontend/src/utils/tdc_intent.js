/**
 * tdc_intent.js
 * The Doggy Company — Canonical Intent Tracking Utility
 *
 * THE GOLDEN RULE: If a user taps it → tdc.track() fires. No exceptions.
 *
 * Every action flows through ONE pipeline:
 *   User action → tdc.*(…) → service_desk ticket (enriched with Mira briefing)
 *   → Admin bell notification → Member inbox (/my-requests)
 *
 * USAGE (anywhere, no React hook needed):
 *   import { tdc } from "../utils/tdc_intent";
 *
 *   tdc.book({ service: "Full Grooming", pillar: "care", pet: currentPet, channel: "care_pillar" })
 *   tdc.view({ product: item, pillar: "shop", pet: currentPet })
 *   tdc.chat({ message: "…", reply: "…", pet: currentPet })
 *   tdc.urgent({ text: "Emergency help needed", pet: currentPet })
 *   tdc.search({ query: "groomers", pillar: "care", pet: currentPet })
 *   tdc.nearme({ query: "vet clinic", pillar: "go", pet: currentPet })
 *   tdc.imagine({ name: "Personalized Bandana", pillar: "shop", pet: currentPet })
 *   tdc.cart({ product: item, pet: currentPet })
 *   tdc.order({ items: cartItems, total: 1200, pet: currentPet })
 *   tdc.request({ text: "Started birthday path", pillar: "celebrate", pet: currentPet })
 *   tdc.visit({ pillar: "care", pet: currentPet })
 */

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ── Auth helper — mobile-safe ─────────────────────────────────────────────────
function getAuth() {
  try {
    const token = localStorage.getItem('tdb_auth_token')
               || sessionStorage.getItem('tdb_auth_token')
               || null;
    const userStr = localStorage.getItem('user')
                 || sessionStorage.getItem('user')
                 || 'null';
    const user = JSON.parse(userStr);
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

// ── Core fire function ───────────────────────────────────────────────────────
// ── life_state derivation ─────────────────────────────────────────────────────
const INTENT_LIFE_STATE = {
  emergency_alert: 'CONCERN',
  booking_intent:  'PLAN',
  cart_intent:     'PLAN',
  order_placed:    'PLAN',
  service_request: 'PLAN',
  imagine_interest: 'EXPLORE',
  product_interest: 'EXPLORE',
  browse_intent:   'EXPLORE',
  search_intent:   'EXPLORE',
  nearme_search:   'EXPLORE',
  mira_chat_intent: 'EXPLORE',
};
const PILLAR_LIFE_STATE = {
  emergency: 'CONCERN',
  celebrate: 'CELEBRATE',
};
function deriveLifeState(intent_primary, pillar) {
  return INTENT_LIFE_STATE[intent_primary]
      || PILLAR_LIFE_STATE[pillar]
      || 'EXPLORE';
}

async function fireTicket({
  intent_primary,
  channel,
  message,
  pillar = 'platform',
  pet,
  product_id,
  amount,
  urgency = 'low',
  metadata = {},
}) {
  const { token, user } = getAuth();
  // Mobile: allow anonymous parent_id from email if stored separately
  const parent_id = user?.id || user?._id || user?.email 
                 || localStorage.getItem('user_email')
                 || sessionStorage.getItem('user_email')
                 || null;
  if (!parent_id) return null; // truly not logged in
  const pet_id    = pet?.id || pet?._id || '';   // backend requires string, not null

  try {
    const body = {
      parent_id,
      pet_id,
      pillar,
      intent_primary,
      channel,
      urgency,
      life_state: deriveLifeState(intent_primary, pillar),
      status: urgency === 'emergency' ? 'urgent' : 'open',
      initial_message: {
        sender: 'system',
        text:   message,
        metadata: {
          ...metadata,
          product_id,
          amount,
          auto_tracked: true,
          channel,
        },
      },
    };

    const bodyStr = JSON.stringify(body);

    // keepalive:true — survives page navigation on mobile (critical fix)
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
      method: 'POST',
      headers,
      body: bodyStr,
      keepalive: true,  // ← mobile: request completes even if user navigates away
    });

    if (res.ok) {
      const data = await res.json();
      return data.ticket_id || data.id || null;
    }
  } catch {
    // Last resort: sendBeacon for high-urgency events on mobile
    // sendBeacon uses POST and survives page unload — no response but guaranteed delivery
    if ((urgency === 'high' || urgency === 'emergency') && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(
          `${API_URL}/api/service_desk/attach_or_create_ticket`,
          new Blob([JSON.stringify(body)], { type: 'application/json' })
        );
      } catch {}
    }
  }
  return null;
}

// ── Exported tdc object ──────────────────────────────────────────────────────
export const tdc = {
  /**
   * tdc.book — User tapped "Book via Concierge →" or any booking CTA
   * Creates a booking_intent ticket — highest normal priority
   */
  book({ service, product_id, pillar = 'platform', pet, channel = 'pillar_page', amount, notes, metadata, service_type, urgency }) {
    const petName  = pet?.name  || pet?.pet_name  || 'their pet';
    const petBreed = pet?.breed || pet?.pet_breed || '';
    const petId    = pet?.id    || pet?.pet_id    || pet?._id || '';

    const messageParts = [
      `Service: ${service}`,
      petName  ? `Pet: ${petName}`  : null,
      petBreed ? `Breed: ${petBreed}` : null,
      amount   ? `Amount: ₹${amount}` : null,
      notes    ? `Notes: ${notes}`  : null,
      service_type ? `Type: ${service_type}` : null,
    ].filter(Boolean);

    const message = messageParts.join(' · ');

    return fireTicket({
      intent_primary: 'booking_intent',
      channel,
      pillar,
      pet,
      product_id,
      amount,
      urgency: urgency || 'high',
      message,
      metadata: {
        service,
        service_type: service_type || service,
        product_id,
        amount,
        pet_id:    petId,
        pet_name:  petName,
        pet_breed: petBreed,
        notes,
        ...(metadata || {}),
      },
    });
  },

  /**
   * tdc.view — User tapped a product/service card to view it
   * Creates a product_interest ticket
   */
  view({ product, name, product_id, pillar = 'platform', pet, channel = 'product_card' }) {
    const petName = pet?.name || 'their pet';
    const itemName = name || product?.name || 'an item';
    const id = product_id || product?._id || product?.id;
    return fireTicket({
      intent_primary: 'product_interest',
      channel,
      pillar,
      pet,
      product_id: id,
      urgency: 'low',
      message: `${petName}'s parent viewed: ${itemName} on /${pillar}`,
      metadata: { item_name: itemName, product_id: id },
    });
  },

  /**
   * tdc.chat — User sent a Mira chat message (widget or Mira OS page)
   * Creates a mira_chat_intent ticket
   */
  chat({ message, reply, pillar = 'mira_os', pet, channel = 'mira_chat_widget' }) {
    const petName = pet?.name || 'their pet';
    return fireTicket({
      intent_primary: 'mira_chat_intent',
      channel,
      pillar,
      pet,
      urgency: 'medium',
      message: `${petName}'s parent chatted with Mira: "${(message || '').slice(0, 120)}"`,
      metadata: { user_message: message, mira_reply: reply?.slice?.(0, 200) },
    });
  },

  /**
   * tdc.urgent — Emergency action — highest priority, status = "urgent"
   */
  urgent({ text, pet, channel = 'emergency_pillar' }) {
    const petName = pet?.name || 'their pet';
    return fireTicket({
      intent_primary: 'emergency_alert',
      channel,
      pillar: 'emergency',
      pet,
      urgency: 'emergency',
      message: `URGENT — ${petName}: ${text || 'Emergency help needed'}`,
      metadata: { emergency_type: text },
    });
  },

  /**
   * tdc.search — User searched on a pillar
   */
  search({ query, pillar = 'platform', pet, channel = 'search_bar' }) {
    const petName = pet?.name || 'their pet';
    return fireTicket({
      intent_primary: 'search_intent',
      channel,
      pillar,
      pet,
      urgency: 'low',
      message: `${petName}'s parent searched: "${query}" on /${pillar}`,
      metadata: { query },
    });
  },

  /**
   * tdc.nearme — User searched NearMe / Google Places
   */
  nearme({ query, pillar = 'platform', pet, channel = 'nearme_tab' }) {
    const petName = pet?.name || 'their pet';
    return fireTicket({
      intent_primary: 'nearme_search',
      channel,
      pillar,
      pet,
      urgency: 'low',
      message: `${petName}'s parent searched nearby: "${query}" on /${pillar}`,
      metadata: { query },
    });
  },

  /**
   * tdc.imagine — User tapped a Mira Imagines card (breed-specific imagine)
   */
  imagine({ name, service, pillar = 'platform', pet, channel = 'mira_imagines_breed' }) {
    const petName = pet?.name || 'their pet';
    return fireTicket({
      intent_primary: 'imagine_interest',
      channel,
      pillar,
      pet,
      urgency: 'medium',
      message: `${petName}'s parent wants Mira to source: "${name || service}" (imagine card) on /${pillar}`,
      metadata: { imagine_item: name || service },
    });
  },

  /**
   * tdc.cart — User added item to cart
   */
  cart({ product, name, product_id, pillar = 'shop', pet, channel = 'cart_add', amount }) {
    const petName = pet?.name || 'their pet';
    const itemName = name || product?.name || 'an item';
    const id = product_id || product?._id || product?.id;
    return fireTicket({
      intent_primary: 'cart_intent',
      channel,
      pillar,
      pet,
      product_id: id,
      amount,
      urgency: 'medium',
      message: `${petName}'s parent added to cart: ${itemName} (₹${amount || ''})`,
      metadata: { item_name: itemName, product_id: id, amount },
    });
  },

  /**
   * tdc.order — User completed checkout / placed order
   */
  order({ items = [], total, pillar = 'shop', pet, channel = 'checkout' }) {
    const petName = pet?.name || 'their pet';
    const itemCount = items.length;
    return fireTicket({
      intent_primary: 'order_placed',
      channel,
      pillar,
      pet,
      amount: total,
      urgency: 'high',
      message: `${petName}'s parent placed an order — ${itemCount} item(s) — ₹${total || ''}`,
      metadata: { item_count: itemCount, total, items: items.map(i => i.name || i).slice(0, 5) },
    });
  },

  /**
   * tdc.request — Any general user request (guided path start, misc actions)
   */
  request({ text, name, pillar = 'platform', pet, channel = 'platform', amount }) {
    const petName = pet?.name || 'their pet';
    return fireTicket({
      intent_primary: 'service_request',
      channel,
      pillar,
      pet,
      amount,
      urgency: 'medium',
      message: `${petName}'s parent: ${text || name || 'made a request'} (${channel})`,
      metadata: { request_text: text || name, amount },
    });
  },

  /**
   * tdc.visit — User visited a page/pillar (page-level tracking)
   * Usually called once per session via usePlatformTracking hook — but can be called manually too
   */
  visit({ pillar = 'platform', pet, channel }) {
    const petName = pet?.name || 'their pet';
    const ch = channel || `${pillar}_pillar_page`;
    return fireTicket({
      intent_primary: 'browse_intent',
      channel: ch,
      pillar,
      pet,
      urgency: 'low',
      message: `${petName}'s parent visited /${pillar}`,
      metadata: { pillar },
    });
  },

  /**
   * tdc.track — Generic catch-all for any custom event type
   */
  track(eventType, { text, name, pillar = 'platform', pet, channel = 'platform', product_id, amount } = {}) {
    const petName = pet?.name || 'their pet';
    return fireTicket({
      intent_primary: eventType,
      channel,
      pillar,
      pet,
      product_id,
      amount,
      urgency: 'low',
      message: `${petName}'s parent: ${text || name || eventType} on /${pillar}`,
      metadata: { event_type: eventType, text, name },
    });
  },
};

export default tdc;
