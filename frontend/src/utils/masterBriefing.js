/**
 * masterBriefing.js
 * The Doggy Company — MASTER TICKET BRIEFING STANDARD
 *
 * THE LAW: Every single ticket. Every time. Forever.
 * Concierge® must be able to act immediately with zero follow-up questions.
 *
 * Exported and shared across:
 *   - useConcierge.js (hook)
 *   - useBookConcierge.js (hook)
 *   - sendToAdminInbox.js (utility)
 *   - MiraCardActions.js (utility)
 */

// ── Allergy extractor ──────────────────────────────────────────────────────
export function getAllergiesFromPet(pet) {
  const raw = pet?.allergies || pet?.health_conditions || [];
  if (!Array.isArray(raw)) return [];
  return raw.filter(a => typeof a === 'string' && a.trim().length > 0);
}

// ── Get auth (safe for hooks and utilities) ────────────────────────────────
export function getStoredAuth() {
  try {
    const token = localStorage.getItem('tdb_auth_token')
               || sessionStorage.getItem('tdb_auth_token') || null;
    const user = JSON.parse(
      localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'
    );
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER TICKET BRIEFING — The Law. Every ticket. Every time.
// ═══════════════════════════════════════════════════════════════════════════
export function buildMasterBriefing(pet, parent, intent, details = {}) {
  const allergies  = getAllergiesFromPet(pet);
  const lifeVision = pet?.doggy_soul_answers?.life_vision || pet?.life_vision || null;
  const soulScore  = pet?.overall_score || pet?.soul_score || null;

  const lines = [];

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('🐾 PET');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`Name:      ${pet?.name || '—'}`);
  lines.push(`Breed:     ${pet?.breed || '—'}`);
  lines.push(`Age:       ${pet?.age || pet?.life_stage || '—'}`);
  lines.push(`Allergies: ${allergies.length ? '⚠️ NO ' + allergies.join(', NO ') : 'None known'}`);
  if (soulScore)   lines.push(`Soul Score: ${soulScore}%`);
  if (lifeVision)  lines.push(`North Star: "${lifeVision}"`);
  lines.push('');

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('👤 PET PARENT');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`Name:      ${parent?.name || parent?.full_name || '—'}`);
  lines.push(`Phone:     ${parent?.phone || parent?.whatsapp || '—'}`);
  lines.push(`Email:     ${parent?.email || '—'}`);
  lines.push('');

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('📋 REQUEST');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`Intent:    ${intent}`);
  lines.push(`Pillar:    ${details.pillar || '—'}`);
  if (details.product_name || details.service_name)
    lines.push(`Product:   ${details.product_name || details.service_name}`);
  if (details.price)
    lines.push(`Price:     ₹${details.price}`);
  if (details.delivery_date)
    lines.push(`Delivery:  ${details.delivery_date}${details.time_slot ? ' · ' + details.time_slot : ''}${details.delivery_type ? ' (' + details.delivery_type + ')' : ''}`);
  if (details.message)
    lines.push(`Message:   "${details.message}"`);
  if (details.customisation)
    lines.push(`Custom:    ${typeof details.customisation === 'object' ? JSON.stringify(details.customisation) : details.customisation}`);
  if (details.photo_url)
    lines.push(`Photo:     ${details.photo_url}`);
  if (details.notes)
    lines.push(`Notes:     ${details.notes}`);
  if (details.venue_name)
    lines.push(`Venue:     ${details.venue_name}`);
  if (details.location)
    lines.push(`Location:  ${details.location}`);
  lines.push('');

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('⚡ ACTION REQUIRED');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allergies.length)
    lines.push(`🔴 ALLERGY ALERT: No ${allergies.join(', ')} in ANY product`);
  if (lifeVision)
    lines.push(`🌟 NORTH STAR: ${lifeVision}`);
  if (details.photo_url)
    lines.push(`📸 PHOTO: ${details.photo_url}\n   (Click to view customer's uploaded image)`);
  lines.push('Please confirm via WhatsApp within 2 hours.');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}

// ── Master metadata builder ────────────────────────────────────────────────
export function buildMasterMetadata(pet, parent, details = {}, callerMetadata = {}) {
  const allergies = getAllergiesFromPet(pet);
  return {
    // Pet
    pet_name:      pet?.name,
    pet_breed:     pet?.breed,
    pet_age:       pet?.age || pet?.life_stage,
    pet_allergies: allergies,
    soul_score:    pet?.overall_score || pet?.soul_score,
    life_vision:   pet?.doggy_soul_answers?.life_vision || pet?.life_vision,

    // Parent
    parent_phone:  parent?.phone || parent?.whatsapp,
    parent_email:  parent?.email,
    parent_name:   parent?.name || parent?.full_name,

    // Order / service
    product_name:  details.product_name,
    product_id:    details.product_id,
    service_name:  details.service_name,
    price:         details.price,
    pillar:        details.pillar,
    channel:       details.channel,

    // Customisation
    photo_url:     details.photo_url,
    delivery_date: details.delivery_date,
    time_slot:     details.time_slot,
    delivery_type: details.delivery_type,
    message:       details.message,
    customisation: details.customisation,
    notes:         details.notes,

    // Mira context
    soul_made:     details.soul_made     || false,
    breed_cake:    details.breed_cake    || false,
    soul_score_pct: pet?.overall_score   || null,
    urgency:       details.urgency       || 'normal',

    // Caller overrides win
    ...callerMetadata,
  };
}

// ── Helper: extract photo URLs from a text string ──────────────────────────
export function extractPhotoUrlsFromText(text) {
  if (!text) return [];
  return [...new Set(
    (text.match(/https?:\/\/[^\s,)\n]+\.(jpg|jpeg|png|gif|webp)/gi) || [])
    .concat(text.match(/https?:\/\/res\.cloudinary\.com\/[^\s,)\n]+/gi) || [])
  )];
}

// ── Helper: strip photo URLs from text for clean display ──────────────────
export function stripPhotoUrlsFromText(text) {
  if (!text) return '';
  return text
    .replace(/📸 PHOTO:\s*https?:\/\/[^\n]+\n?\s*\([^\n]*\)/gi, '')
    .replace(/Photo:\s*https?:\/\/[^\s\n]+/gi, '')
    .replace(/https?:\/\/res\.cloudinary\.com\/[^\s,)\n]+/gi, '')
    .replace(/\bhttps?:\/\/[^\s,)\n]+\.(jpg|jpeg|png|gif|webp)\b/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
