/**
 * DineContentModal.jsx
 *
 * Category modal for /dine — mirrors the Dine design mockup.
 * - Header with allergy chips (Chicken-free · Treatment-safe)
 * - Mira quote block (dynamic reasoning)
 * - Amber sub-category tabs
 * - DineProductCard: image + purple badge + allergy chips + Add/Added
 *
 * Mobile: full-screen bottom sheet | Desktop: centred large modal
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, Send, ShoppingCart, Star } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ProductCard from '../ProductCard';
import FlatArtPickerCard from '../common/FlatArtPickerCard';
import SoulMadeModal from '../SoulMadeModal';
import { bookViaConcierge } from '../../utils/MiraCardActions';
import { applyMiraFilter, getAllergiesFromPet } from '../../hooks/useMiraFilter';

const fmtTab = (t) => t === 'All' || t === 'all' ? t : t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ── Pet data helpers ──────────────────────────────────────────────────────────
const ALLERGY_CLEAN = /^(no|none|none_confirmed|no_allergies|no allergies|na|n\/a|unknown)$/i;

const getPetAllergies = (pet) => {
  const sets = new Set();
  const push = (v) => {
    if (!v) return;
    const arr = Array.isArray(v) ? v : v.split(/,|;/).map(s => s.trim());
    arr.forEach(a => { if (a && !ALLERGY_CLEAN.test(a.trim())) sets.add(a.toLowerCase()); });
  };
  push(pet?.allergies);
  push(pet?.allergy1); push(pet?.allergy2);
  push(pet?.health_data?.allergies);
  push(pet?.health?.allergies);
  push(pet?.doggy_soul_answers?.food_allergies);
  push(pet?.insights?.key_flags?.allergy_list);
  return [...sets];
};

const getPetLoves = (pet) => {
  const sets = new Set();
  const push = (v) => {
    if (!v) return;
    const arr = Array.isArray(v) ? v : [v];
    arr.forEach(a => { if (a) sets.add(a); });
  };
  push(pet?.doggy_soul_answers?.favorite_protein);
  push(pet?.doggy_soul_answers?.favorite_treats);
  (pet?.learned_facts || []).filter(f => f.type === 'loves' || f.type === 'likes').forEach(f => push(f.value));
  return [...sets];
};

const getHealthCondition = (pet) => {
  const cond = pet?.health_data?.chronic_conditions || pet?.health?.conditions || pet?.healthCondition;
  if (!cond) return null;
  return Array.isArray(cond) ? cond[0] : cond;
};

// ── Mira Imagines Card (for items not yet in catalog → concierge) ────────────
const MiraImaginesCard = ({ item, pet, apiUrl, token }) => {
  const [state, setState] = useState('idle'); // idle | sending | sent
  const petName = pet?.name || 'your dog';

  const sendToConcierge = async () => {
    setState('sending');
    try {
      await bookViaConcierge({
        service:  item.name,
        pillar:   'dine',
        pet,
        token,
        channel:  'dine_miras_picks_imagines',
        notes:    `Mira imagined: ${item.name}`,
      });
    } catch (err) { console.error('[DineMiraImaginesCard]', err); }
    setState('sent');
  };

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: 'linear-gradient(135deg, #1A0A00, #2D1A00)',
      border: '1.5px solid rgba(255,140,66,0.25)',
      display: 'flex', flexDirection: 'column', minHeight: 220,
    }} data-testid={`mira-imagines-${item.id}`}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 14px 8px' }}>
        <span style={{ fontSize: 36 }}>{item.emoji}</span>
        <div style={{ marginTop: 6, background: 'rgba(255,140,66,0.2)', border: '1px solid rgba(255,140,66,0.4)', borderRadius: 20, padding: '2px 10px', fontSize: 9, color: '#FFC080', fontWeight: 700, letterSpacing: '0.05em' }}>MIRA IMAGINES</div>
        <p style={{ fontWeight: 800, color: '#fff', textAlign: 'center', fontSize: 12, marginTop: 8, lineHeight: 1.3 }}>{item.name}</p>
        <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 10, textAlign: 'center', marginTop: 4, lineHeight: 1.5 }}>{item.description}</p>
      </div>
      <div style={{ padding: '0 12px 14px' }}>
        {state === 'sent' ? (
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#32C878' }}>
            <Check size={12} style={{ display: 'inline', marginRight: 4 }} /> Sent to Concierge®!
          </div>
        ) : (
          <button
            onClick={sendToConcierge}
            disabled={state === 'sending'}
            style={{ width: '100%', background: 'linear-gradient(135deg, #FF8C42, #C44400)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: state === 'sending' ? 0.7 : 1 }}
          >
            {state === 'sending' ? 'Sending…' : 'Request a Quote →'}
          </button>
        )}
      </div>
    </div>
  );
};

// Helper: returns first available image URL — no filtering, static.prod-images works in browser
function resolveEntityImage(entity) {
  const candidates = [entity.image_url, entity.image, entity.media?.primary_image, ...(entity.images || [])];
  return candidates.find(url => url && url.startsWith('http')) || null;
}

// ── ServiceCard — real service from services_master with Send to Concierge® ────
const ServiceCard = ({ service, pet, apiUrl, token }) => {
  const [state, setState] = useState('idle'); // idle | sending | sent
  const petName = pet?.name || 'your dog';
  const scoreColor = !service.mira_score ? '#6B7280' : service.mira_score >= 80 ? '#16A34A' : '#F59E0B';
  const img = resolveEntityImage(service);

  const sendToConcierge = async () => {
    setState('sending');
    try {
      await bookViaConcierge({
        service:  service.name || service.entity_name,
        pillar:   'dine',
        pet,
        token,
        channel:  'dine_miras_picks_services',
        amount:   service.price_range || service.avg_price,
        notes:    `Mira matched: ${service.mira_score || '?'}/100 — ${service.name || service.entity_name}`,
      });
      toast.success('Sent to Concierge®!', { description: `We'll reach out about "${service.name || service.entity_name}" within 48 hours.` });
      setState('sent');
    } catch (err) {
      console.error('[DineServiceCard] concierge error:', err);
      toast.error('Could not send request. Please try again.');
      setState('idle');
    }
  };

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: 'linear-gradient(135deg, #0F172A, #1E293B)',
      border: '1.5px solid rgba(99,102,241,0.35)',
      display: 'flex', flexDirection: 'column', minHeight: 220,
    }} data-testid={`service-card-${service.id}`}>
      {/* Image */}
      <div style={{ width: '100%', height: 110, overflow: 'hidden', position: 'relative', background: '#1E293B' }}>
        {img ? (
          <img src={img} alt={service.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>✨</div>
        )}
        <div style={{ position: 'absolute', top: 7, left: 7, background: '#6366F1', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>SERVICE</div>
        {service.mira_score && (
          <div style={{ position: 'absolute', top: 7, right: 7, background: scoreColor, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20 }}>
            <Star size={8} style={{ display: 'inline', marginRight: 2 }} />{service.mira_score}
          </div>
        )}
      </div>
      <div style={{ flex: 1, padding: '10px 12px 4px' }}>
        <p style={{ fontWeight: 800, color: '#fff', fontSize: 12, lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {service.name || service.entity_name || '—'}
        </p>
        {service.mira_hint && (
          <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 10, lineHeight: 1.4, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic' }}>
            {service.mira_hint}
          </p>
        )}
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        {state === 'sent' ? (
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#34D399' }}>
            <Check size={12} style={{ display: 'inline', marginRight: 4 }} /> Sent to Concierge®!
          </div>
        ) : (
          <button
            onClick={sendToConcierge}
            disabled={state === 'sending'}
            data-testid={`service-concierge-btn-${service.id}`}
            style={{ width: '100%', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: state === 'sending' ? 0.7 : 1 }}
          >
            <Send size={11} />
            {state === 'sending' ? 'Sending…' : 'Send to Concierge® →'}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Generate Mira Imagines (breed+soul relevant dream items) ─────────────────
const generateMiraImagines = (pet, existingProducts) => {
  const petName = pet?.name || 'your dog';
  const breed = (pet?.breed || '').trim();
  const allergies = getPetAllergies(pet);
  const loves = getPetLoves(pet);
  const healthCondition = getHealthCondition(pet);
  const imagines = [];

  // 1. Breed-specific meal plan
  const hasBreedProduct = breed && existingProducts.some(
    p => (p.name || '').toLowerCase().includes(breed.toLowerCase())
  );
  if (!hasBreedProduct) {
    imagines.push({
      id: `imagine-meal-${(breed || 'custom').replace(/\s/g, '-')}`,
      isImagined: true, emoji: '🍽️',
      name: breed ? `${breed} Meal Plan` : `${petName}'s Custom Meal Plan`,
      description: breed
        ? `A 7-day plan built around what ${breed}s need at this life stage — portioned right, nutrient-dense.`
        : `A personalised 7-day meal plan built around ${petName}'s taste, age, and health.`,
    });
  }

  // 2. Custom allergy-safe pack
  if (allergies.length > 0) {
    const hasSafePack = existingProducts.some(p =>
      allergies.every(a => isSafeFromAllergen(a, `${p.name} ${p.description || ''}`.toLowerCase(), (p.allergy_free || '').toLowerCase()))
    );
    if (!hasSafePack) {
      imagines.push({
        id: 'imagine-allergy-pack',
        isImagined: true, emoji: '🛡️',
        name: `${allergies.map(a => a.charAt(0).toUpperCase() + a.slice(1) + '-Free').join(' & ')} Monthly Pack`,
        description: `Every item verified ${allergies.join(' & ')}-free. Curated monthly for ${petName}'s safety.`,
      });
    }
  }

  // 3. Treatment support if health condition
  if (healthCondition && healthCondition.toLowerCase() !== 'none') {
    imagines.push({
      id: 'imagine-treatment',
      isImagined: true, emoji: '💜',
      name: `${petName}'s Treatment Support Kit`,
      description: `Nutrition tailored to ${petName}'s ${healthCondition} — anti-inflammatory, recovery-safe, vet-approved.`,
    });
  }

  // 4. Love-based custom box
  if (loves.length > 0) {
    const fav = loves[0];
    const hasLoveProduct = existingProducts.some(p => (p.name || '').toLowerCase().includes(fav.toLowerCase()));
    if (!hasLoveProduct) {
      imagines.push({
        id: `imagine-love-${fav.replace(/\s/g, '-')}`,
        isImagined: true, emoji: '♥',
        name: `${fav.charAt(0).toUpperCase() + fav.slice(1)}-Forward Custom Box`,
        description: `${petName} loves ${fav}. Mira would build a monthly treat box around this.`,
      });
    }
  }

  // 5. Always guarantee at least one card — personalised monthly box fallback
  if (imagines.length === 0) {
    imagines.push({
      id: 'imagine-monthly-box',
      isImagined: true, emoji: '📦',
      name: `${petName}'s Monthly Soul Box`,
      description: `Mira curates a monthly box of meals, treats, and supplements built around ${petName}'s soul profile.`,
    });
    imagines.push({
      id: 'imagine-nutrition-consult',
      isImagined: true, emoji: '🐾',
      name: `Nutritionist Consult for ${petName}`,
      description: `A 1:1 session with a canine nutritionist to build ${petName}'s perfect feeding plan.`,
    });
  }

  return imagines.slice(0, 4);
};

// ── Apply intelligence for Mira's Picks ──────────────────────────────────────
const isSafeFromAllergen = (allergen, text, freeFrom) => {
  // Explicitly safe: allergy_free field OR description/name says "{allergen}-free"
  const a = allergen.toLowerCase();
  if (freeFrom.includes(`${a}-free`) || freeFrom.includes(`${a} free`)) return true;
  if (text.includes(`${a}-free`) || text.includes(`${a} free`)) return true;
  return false;
};

const containsAllergen = (allergen, text) => {
  // Remove all "{allergen}-free" occurrences, then check if allergen remains
  const a = allergen.toLowerCase();
  const cleaned = text.replace(new RegExp(`${a}[- ]free`, 'gi'), '');
  return cleaned.includes(a);
};

const applyMirasPicksIntelligence = (products, allergies, loves, healthCondition, petName) => {
  const allergyTerms = allergies.map(a => a.toLowerCase().trim());
  const loveTerms = loves.map(l => l.toLowerCase().trim()).filter(Boolean);

  return products
    .filter(p => {
      const isService = p.category === 'service' || p.product_type === 'service' || p.entity_type === 'service';
      if (isService) return true;
      if (!allergyTerms.length) return true;
      const text = `${p.name} ${p.description || ''}`.toLowerCase();
      const freeFrom = (p.allergy_free || '').toLowerCase();
      return !allergyTerms.some(a => {
        if (isSafeFromAllergen(a, text, freeFrom)) return false;
        return containsAllergen(a, text);
      });
    })
    .map(p => {
      const text = `${p.name} ${p.description || ''}`.toLowerCase();
      const freeFrom = (p.allergy_free || '').toLowerCase();
      const tag = (p.mira_tag || '').toLowerCase();
      const matchedLove = loveTerms.find(l => text.includes(l));
      const isHealthSafe = healthCondition && (tag.includes('treatment') || freeFrom.includes('treatment-safe') || text.includes('treatment-safe'));
      const isAllergySafe = allergyTerms.length > 0 && allergyTerms.every(a => isSafeFromAllergen(a, text, freeFrom));
      let mira_hint = p.mira_hint || null;
      if (!mira_hint) {
        if (matchedLove) mira_hint = `Matches ${petName}'s love for ${matchedLove}`;
        else if (isHealthSafe) mira_hint = `Safe during ${petName}'s treatment`;
        else if (isAllergySafe) mira_hint = `Free from ${allergyTerms.join(' & ')} — safe for ${petName}`;
        else if (p.mira_tag) mira_hint = p.mira_tag;
      }
      return { ...p, mira_hint, _loved: !!matchedLove, _healthSafe: isHealthSafe };
    })
    .sort((a, b) => {
      if (a._loved && !b._loved) return -1;
      if (!a._loved && b._loved) return 1;
      if (a._healthSafe && !b._healthSafe) return -1;
      return 0;
    });
};


const CATEGORY_CONFIG = {
  'daily-meals':      { emoji: '🐟', label: 'Daily Meals',          apiCategory: 'Daily Meals' },
  'treats-rewards':   { emoji: '🦴', label: 'Treats & Rewards',     apiCategory: 'Treats & Rewards' },
  'supplements':      { emoji: '💊', label: 'Supplements',           apiCategory: 'Supplements' },
  'frozen-fresh':     { emoji: '🧊', label: 'Frozen & Fresh',        apiCategory: 'Frozen & Fresh' },
  'homemade-recipes': { emoji: '🍳', label: 'Homemade & Recipes',    apiCategory: 'Homemade & Recipes' },
  'bundles':          { emoji: '🎁', label: 'Dining Bundles',        apiCategory: null },
  'soul-picks':       { emoji: '✨', label: 'Soul Picks',            apiCategory: null },
  'miras-picks':      { emoji: '💫', label: "Mira's Picks",          apiCategory: null }, // includes services
  'soul_made':        { emoji: '✦',  label: 'Soul Made™',            apiCategory: null },
};

const CTA_LABELS = {
  'daily-meals':        (n) => `Build ${n}'s Meal Plan →`,
  'treats-rewards':     (n) => `Add to ${n}'s Treat Box →`,
  'supplements':        (n) => `Start ${n}'s Supplement Plan →`,
  'frozen-fresh':       (n) => `Plan ${n}'s Fresh Meals →`,
  'homemade-recipes':   (n) => `Try a Recipe for ${n} →`,
  'bundles':            (n) => `Get a Bundle for ${n} →`,
  'soul-picks':         (n) => `Build ${n}'s Soul Box →`,
  'miras-picks':        (n) => `Start ${n}'s Dine Plan →`,
  'soul_made':          (n) => `Make it personal for ${n} →`,
};

// ── Mira quote generator ──────────────────────────────────────────────────────
const buildMiraQuote = (pet, category, allergies, healthCondition) => {
  const name = pet?.name || 'your dog';
  const breed = pet?.breed || null;
  const age = pet?.age_years != null ? pet.age_years : null;
  const weight = pet?.weight_kg != null ? `${pet.weight_kg}kg` : null;
  const loves = getPetLoves(pet);

  const allergyStr = allergies.length > 0
    ? allergies.map(a => `${a}-free`).join(' and ')
    : null;

  const loveStr = loves.length > 0
    // Strip food/treat suffixes to avoid "The Salmon treats options are first."
    ? loves[0].replace(/\s*(treats?|biscuits?|food|meal|diet|snacks?|chews?)\s*$/i, '').trim()
    : null;

  // Build context phrase
  const context = [
    weight && age ? `${name}'s weight, age, and health profile` : `${name}'s profile`,
    breed ? `what works for ${breed}s` : null,
  ].filter(Boolean).join(' and ');

  let quote = `I built this around ${context}.`;

  if (loveStr) quote += ` The ${loveStr} options are first.`;

  if (allergyStr && healthCondition) {
    quote += ` Everything here is ${allergyStr} and treatment-safe.`;
  } else if (allergyStr) {
    quote += ` Everything here is ${allergyStr}.`;
  } else if (healthCondition) {
    quote += ` Everything here is treatment-safe.`;
  }

  return quote;
};

// ── Product sorting: allergy-safe & loved items first ───────────────────────
const sortProductsForPet = (products, allergies) => {
  if (!allergies.length) return products;
  return [...products].sort((a, b) => {
    const aFree = (a.allergy_free || '').toLowerCase();
    const bFree = (b.allergy_free || '').toLowerCase();
    // Products that are allergy-safe for this pet's allergies rank higher
    const aScore = allergies.every(al => aFree.includes(al.replace('-free', '').trim() + '-free') || aFree.includes(al + '-free')) ? 1 : 0;
    const bScore = allergies.every(al => bFree.includes(al.replace('-free', '').trim() + '-free') || bFree.includes(al + '-free')) ? 1 : 0;
    return bScore - aScore;
  });
};

// ── BundleCard (for bundles category) ────────────────────────────────────────
const DineBundleCard = ({ bundle, petName }) => {
  const [requested, setRequested] = useState(false);
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      border: '1.5px solid #FFE5CC', background: '#fff',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 2px 12px rgba(196,68,0,0.08)',
    }}>
      <div style={{ height: 160, overflow: 'hidden', background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', flexShrink: 0, position: 'relative' }}>
        {bundle.image_url ? (
          <img src={bundle.image_url} alt={bundle.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>🎁</div>
        )}
        {bundle.popular && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'linear-gradient(135deg, #FF8C42, #C44400)',
            color: '#fff', borderRadius: 20, padding: '4px 10px', fontSize: 10, fontWeight: 700,
          }}>⭐ Popular</div>
        )}
      </div>
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontWeight: 800, fontSize: 13, color: '#1A0A00', margin: 0 }}>{bundle.name}</p>
        {(bundle.items || []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {bundle.items.slice(0, 4).map((item, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: '#C44400', background: '#FFF3E0', border: '1px solid #FFCC99', borderRadius: 20, padding: '2px 7px' }}>{item}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
          {bundle.bundle_price && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#C44400' }}>₹{Number(bundle.bundle_price).toLocaleString('en-IN')}</span>
              {bundle.original_price && (
                <span style={{ fontSize: 11, color: '#bbb', textDecoration: 'line-through' }}>₹{Number(bundle.original_price).toLocaleString('en-IN')}</span>
              )}
            </div>
          )}
          {requested ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#27AE60' }}>
              <Check size={12} /> Sent!
            </div>
          ) : (
            <button
              onClick={() => setRequested(true)}
              style={{ background: 'linear-gradient(135deg, #FF8C42, #C44400)', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Get Bundle →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Breed slug helper ─────────────────────────────────────────────────────────
const getBreedDisplay = (pet) => {
  const breed = (pet?.breed || '').trim();
  if (!breed) return '';
  return breed.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

// ── Main Modal ────────────────────────────────────────────────────────────────
const DineContentModal = ({ isOpen, onClose, category, pet }) => {
  const [products, setProducts] = useState([]);
  const [flatArtProducts, setFlatArtProducts] = useState([]);
  const [yappyIllustrations, setYappyIllustrations] = useState([]);
  const [artStyle, setArtStyle] = useState('watercolour'); // 'watercolour' | 'flat_art'
  const [imagines, setImagines] = useState([]);  // Mira Imagines (not-yet-in-catalog)
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [tabs, setTabs] = useState([]);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const config = CATEGORY_CONFIG[category] || { emoji: '🍽️', label: category, apiCategory: null };
  const petName = pet?.name || 'your dog';
  // useMemo ensures allergies is a stable reference (no infinite loop in useCallback deps)
  const allergies = useMemo(() => getPetAllergies(pet), [pet]);
  const healthCondition = getHealthCondition(pet);

  // Header chips: e.g. ["Chicken-free", "Treatment-safe"]
  const headerChips = [
    ...allergies.map(a => `${a.charAt(0).toUpperCase() + a.slice(1)}-free`),
    healthCondition ? 'Treatment-safe' : null,
  ].filter(Boolean);

  const miraQuote = (pet && category !== 'soul-picks' && category !== 'miras-picks' && category !== 'bundles')
    ? buildMiraQuote(pet, category, allergies, healthCondition)
    : null;

  const fetchData = useCallback(async () => {
    if (!isOpen || !category) return;
    setLoading(true);
    setProducts([]);
    setFlatArtProducts([]);
    setYappyIllustrations([]);
    setArtStyle('watercolour'); // always reset on new fetch
    setTabs([]);
    setActiveTab('all');

    const apiUrl = getApiUrl();

    try {
      // ── Bundles ────────────────────────────────────────────────────
      if (category === 'bundles') {
        const r = await fetch(`${apiUrl}/api/bundles?pillar=dine&limit=20`);
        if (r.ok) {
          const d = await r.json();
          setProducts(d.bundles || []);
        }
        return;
      }

      // ── Soul Made™: breed-specific products from mockup API ──────
      if (category === 'soul_made') {
        const breedParam = encodeURIComponent((pet?.breed || '').trim().toLowerCase());
        const [r1, r2, r3] = await Promise.all([
          fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedParam}&pillar=dine&limit=60`),
          fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedParam}&flat_only=true&limit=60`),
          fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedParam}&product_type=birthday_cake&limit=10`),
        ]);
        const data1 = r1.ok ? await r1.json() : { products: [] };
        const breedProducts = (data1.products || []).filter(p =>
          p.product_type !== 'birthday_cake' && p.product_type !== 'Birthday Cake'
        );
        const subCats = [...new Set(breedProducts.map(p => p.sub_category || p.product_type).filter(Boolean))];
        setTabs(subCats.length >= 1 ? subCats : []);
        setProducts(breedProducts);
        const data2 = r2.ok ? await r2.json() : { products: [] };
        setFlatArtProducts(data2.products || []);
        const data3 = r3.ok ? await r3.json() : { products: [] };
        setYappyIllustrations(data3.products || []);
        setArtStyle('watercolour');
        setLoading(false);
        return;
      }

      // ── Soul Picks: breed merchandise for this specific breed ────────
      if (category === 'soul-picks') {
        const breedDisplay = getBreedDisplay(pet);
        const breedSearch = breedDisplay.toLowerCase();
        if (!breedSearch) {
          setProducts([]); // No breed info → show empty state
          return;
        }
        const breedParam = encodeURIComponent((pet?.breed || '').trim().toLowerCase());
        const res = await fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedParam}&pillar=dine&limit=60`);
        const data = res.ok ? await res.json() : { products: [] };
        const allMerch = (data.products || []);
        // Only show merchandise matching this pet's exact breed — never show wrong breed
        // Deduplicate by name (same product can appear across multiple categories with different IDs)
        // Backend already returns only breed-correct products via the breed param + reverse alias.
        // Deduplicate by name only (same product can have multiple IDs).
        const seen = new Map();
        allMerch.forEach(p => {
          const key = (p.name || '').toLowerCase().trim();
          if (!seen.has(key)) seen.set(key, p);
        });
        setProducts([...seen.values()]);
        return;
      }

      // ── Mira's Picks: Claude-powered intelligence — breed-relevant, pre-scored ──
      if (category === 'miras-picks') {
        const petId = pet?.id;
        let preScored = [];

        // 1. Check for pre-computed Mira scores (fast path)
        if (petId) {
          const statusRes = await fetch(`${apiUrl}/api/mira/score-status/${petId}`).catch(() => null);
          if (statusRes?.ok) {
            const status = await statusRes.json();
            if (status.has_scores && status.count > 10) {
              const topRes = await fetch(`${apiUrl}/api/mira/claude-picks/${petId}?pillar=dine&limit=24&min_score=40`).catch(() => null);
              if (topRes?.ok) {
                const topData = await topRes.json();
                preScored = topData.picks || [];
              }
            }
          }
        }

        // 2. Fetch real food products by category (NOT a blanket dine fetch which returns
        //    breed merchandise first due to alphabetical sort). Fetch each food category in parallel.
        const FOOD_CATS = ['Daily Meals', 'Treats & Rewards', 'Supplements', 'Frozen & Fresh', 'Homemade & Recipes'];
        const breedFilter = pet?.breed ? `&breed=${encodeURIComponent(pet.breed)}` : '';
        const [catResults, serviceRes] = await Promise.all([
          Promise.all(FOOD_CATS.map(cat =>
            fetch(`${apiUrl}/api/admin/pillar-products?pillar=dine&category=${encodeURIComponent(cat)}&limit=100${breedFilter}`)
              .then(r => r.ok ? r.json() : { products: [] })
              .catch(() => ({ products: [] }))
          )),
          fetch(`${apiUrl}/api/admin/pillar-products?pillar=dine&category=service&limit=20`).catch(() => null),
        ]);
        const serviceData = serviceRes?.ok ? await serviceRes.json().catch(() => ({ products: [] })) : { products: [] };
        // Deduplicate by name (some products are seeded twice with different IDs)
        const allByName = new Map();
        catResults.forEach(d => {
          (d.products || []).forEach(p => {
            const key = (p.name || p.id || '').toLowerCase().trim();
            if (!allByName.has(key)) allByName.set(key, p);
          });
        });
        (serviceData.products || []).forEach(p => {
          const key = (p.name || p.id || '').toLowerCase().trim();
          if (!allByName.has(key)) allByName.set(key, p);
        });
        const allRaw = [...allByName.values()];

        // 3. Merge pre-computed Claude scores into raw items + add services from preScored
        const scoreById = {};
        preScored.forEach(p => { scoreById[p.id] = p; });
        
        // Start with raw products enriched with scores + updated images (filter 403 URLs)
        const enriched = allRaw.map(p => ({
          ...p,
          ...(scoreById[p.id] ? {
            mira_score: scoreById[p.id].mira_score,
            // Use the updated image from the scored pick (reflects admin changes), skip broken 403 URLs
            image: resolveEntityImage(scoreById[p.id]) || resolveEntityImage(p) || p.image,
            image_url: scoreById[p.id].image_url || p.image_url,
            entity_type: scoreById[p.id].entity_type || p.entity_type || 'product',
          } : {
            image: resolveEntityImage(p) || p.image,
          }),
          mira_hint: scoreById[p.id]?.mira_reason || p.mira_hint || null,
        }));

        // Add services from preScored that don't exist in allRaw (services_master items)
        const rawIds = new Set(allRaw.map(p => p.id));
        const extraFromScores = preScored
          .filter(p => !rawIds.has(p.id) && p.entity_type === 'service')
          .map(p => ({
            ...p,
            image: p.image_url || p.image,
            mira_hint: p.mira_reason || null,
          }));
        const allEnriched = [...enriched, ...extraFromScores];

        // 4. Apply client-side intelligence (filter allergens + sort)
        const intelligent = applyMirasPicksIntelligence(allEnriched, allergies, getPetLoves(pet), healthCondition, petName);

        // 5. Sort: Claude scores override client-side sort when available
        const hasMiraScores = preScored.length > 0;
        const sorted = hasMiraScores
          ? [...intelligent].sort((a, b) => (b.mira_score || 0) - (a.mira_score || 0))
          : intelligent;

        const services = sorted.filter(p => p.entity_type === 'service' || p.category === 'service' || p.product_type === 'service');
        const realProducts = sorted.filter(p => p.entity_type !== 'service' && p.category !== 'service' && p.product_type !== 'service');
        // Show services first (interleaved), cap at 22
        setProducts([...services.slice(0, 5), ...realProducts].slice(0, 22));
        setImagines(generateMiraImagines(pet, realProducts));

        // 6. Fire-and-forget background scoring if no scores yet
        if (petId && !hasMiraScores) {
          if (!pet?.overall_score || pet.overall_score <= 0) { fetch(`${apiUrl}/api/mira/score-for-pet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet_id: petId, pillar: 'dine' }),
          }).catch(() => {}); }
        }
        return;
      }

      // ── Standard categories ────────────────────────────────────────
      if (config.apiCategory) {
        const breedFilter2 = pet?.breed ? `&breed=${encodeURIComponent(pet.breed)}` : '';
        // Pass allergens to backend as first safety layer
        const petAllergiesStr = getAllergiesFromPet(pet);
        const allergenParam = petAllergiesStr.length > 0 ? `&allergens=${encodeURIComponent(petAllergiesStr.join(','))}` : '';
        const url = `${apiUrl}/api/admin/pillar-products?pillar=dine&category=${encodeURIComponent(config.apiCategory)}&limit=100${breedFilter2}${allergenParam}`;

        // For Daily Meals: also fetch dining accessories (bowls, mats) which live under breed-bowls / dine_accessories
        const isDaily = category === 'daily-meals';
        const fetchAcc = isDaily
          ? Promise.all([
              fetch(`${apiUrl}/api/admin/pillar-products?pillar=dine&category=breed-bowls&limit=40${breedFilter2}${allergenParam}`)
                .then(r => r.ok ? r.json() : { products: [] }).catch(() => ({ products: [] })),
              fetch(`${apiUrl}/api/admin/pillar-products?pillar=dine&category=dine_accessories&limit=20${breedFilter2}${allergenParam}`)
                .then(r => r.ok ? r.json() : { products: [] }).catch(() => ({ products: [] })),
            ]).then(([d1, d2]) => ({ products: [...(d1.products||[]), ...(d2.products||[])] }))
          : Promise.resolve({ products: [] });

        const [r, accData] = await Promise.all([fetch(url), fetchAcc]);
        if (r.ok) {
          const d = await r.json();
          const prods = d.products || [];

          // Tag accessories with sub_category so they appear under the Accessories tab
          const accProds = (accData.products || []).map(p => ({
            ...p,
            sub_category: p.sub_category || 'accessories',
          }));

          // Merge, deduplicate by id
          const seen = new Map();
          [...prods, ...accProds].forEach(p => { if (!seen.has(p.id)) seen.set(p.id, p); });
          const merged = [...seen.values()];

          // Apply full Mira filter: REMOVES allergen products + ranks loved items first
          const filtered = applyMiraFilter(merged, pet);
          setProducts(filtered);
          const uniqueTabs = [...new Set(merged.map(p => p.sub_category).filter(Boolean))];
          const breedSlug = (pet?.breed||'').trim().toLowerCase().replace(/\s+/g, '_');
          const filteredTabs = uniqueTabs.filter(t => !/-play$|-shop$|-dine$|-food$/.test(t) || !breedSlug || t.toLowerCase().startsWith(breedSlug));
          setTabs(filteredTabs);
        }
      }
    } catch (err) {
      console.error('[DineContentModal] fetch error:', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, category, pet, config.apiCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredProducts = activeTab === 'all'
    ? products
    : products.filter(p =>
        (p.sub_category || '').toLowerCase() === activeTab.toLowerCase() ||
        (p.category || '').toLowerCase() === activeTab.toLowerCase() ||
        (p.product_type || '').toLowerCase() === activeTab.toLowerCase()
      );

  if (!isOpen) return null;

  const isBundles = category === 'bundles';

  const ModalContent = (
    <motion.div
      initial={{ opacity: 0, y: isDesktop ? 0 : 60, scale: isDesktop ? 0.97 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isDesktop ? 0 : 60, scale: isDesktop ? 0.97 : 1 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="bg-white overflow-hidden"
      style={isDesktop ? {
        width: '92vw', maxWidth: 1140, maxHeight: '90vh',
        borderRadius: 20, display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.20)',
      } : {
        position: 'fixed', left: 0, right: 0, bottom: 0,
        maxHeight: '93vh', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        overflowY: 'auto', zIndex: 65,
      }}
      data-testid={`dine-modal-${category}`}
    >
      {/* ── Drag handle (mobile) ── */}
      {!isDesktop && (
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', paddingTop: 12, paddingBottom: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: '#E0D8D0' }} />
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between px-5 py-4 flex-shrink-0"
        style={{
          borderBottom: '1px solid #F0E8E0',
          position: isDesktop ? 'static' : 'sticky',
          top: isDesktop ? 'auto' : 18,
          zIndex: 40,
          background: '#fff',
        }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
          {!isDesktop && (
            <button
              onClick={onClose}
              style={{
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FFF3E0',
                color: '#C44400',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                flexShrink: 0,
                marginTop: 2,
              }}
              aria-label="Back to dine"
              data-testid="dine-modal-back-inline"
            >
              ←
            </button>
          )}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {config.emoji}
          </div>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 18, color: '#1A0A00', margin: 0 }}>
              {config.label}
            </h2>
            {headerChips.length > 0 && (
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>
                {headerChips.join(' · ')}
              </p>
            )}
          </div>
        </div>
        {isDesktop && (
          <button
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FFF3E0',
              color: '#C44400',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Close modal"
            data-testid="dine-modal-close"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Mira Quote Block ─────────────────────────────────────────── */}
      {miraQuote && (
        <div style={{
          margin: '12px 16px 0',
          background: 'linear-gradient(90deg, #FFF8F0, #FFF3E8)',
          border: '1px solid #FFE0C0',
          borderRadius: 14, padding: '12px 14px',
          display: 'flex', gap: 12, alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #FF8C42, #C44400)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
          }}>✦</div>
          <div>
            <p style={{ fontSize: 13, color: '#4A2000', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
              "{miraQuote}"
            </p>
            <p style={{ fontSize: 11, color: '#C44400', fontWeight: 700, margin: '5px 0 0' }}>
              ♥ Mira knows {petName}
            </p>
          </div>
        </div>
      )}

      {/* ── Sub-category tabs ────────────────────────────────────────── */}
      {false && tabs.length > 1 && (
        <div className="flex-shrink-0 flex gap-2 overflow-x-auto px-4 py-3"
          style={{
            scrollbarWidth: 'none',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: '#fff',
            boxShadow: '0 1px 0 #F0E8E0',
          }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              flexShrink: 0, borderRadius: 20, padding: '6px 16px', fontSize: 12.5, fontWeight: 700,
              border: activeTab === 'all' ? 'none' : '1.5px solid #FFCC99',
              background: activeTab === 'all' ? 'linear-gradient(135deg, #FF8C42, #C44400)' : '#FFF3E0',
              color: activeTab === 'all' ? '#fff' : '#C44400', cursor: 'pointer',
            }}
            data-testid="dine-tab-all"
          >
            All
          </button>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flexShrink: 0, borderRadius: 20, padding: '6px 16px', fontSize: 12.5, fontWeight: 700,
                border: activeTab === tab ? 'none' : '1.5px solid #FFCC99',
                background: activeTab === tab ? 'linear-gradient(135deg, #FF8C42, #C44400)' : '#FFF3E0',
                color: activeTab === tab ? '#fff' : '#C44400', cursor: 'pointer',
              }}
              data-testid={`dine-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {fmtTab(tab)}
            </button>
          ))}
        </div>
      )}

      {/* ── Product Grid ─────────────────────────────────────────────── */}
      <div style={{ paddingBottom: 80 }}
        className={isDesktop ? 'flex-1 overflow-y-auto' : ''}>
        {tabs.length > 1 && !loading && (
          <div
            className="flex gap-2 overflow-x-auto px-4 py-3"
            style={{
              scrollbarWidth: 'none',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              background: '#fff',
              boxShadow: '0 1px 0 #F0E8E0',
            }}
          >
            <button
              onClick={() => setActiveTab('all')}
              style={{
                flexShrink: 0, borderRadius: 20, padding: '6px 16px', fontSize: 12.5, fontWeight: 700,
                border: activeTab === 'all' ? 'none' : '1.5px solid #FFCC99',
                background: activeTab === 'all' ? 'linear-gradient(135deg, #FF8C42, #C44400)' : '#FFF3E0',
                color: activeTab === 'all' ? '#fff' : '#C44400', cursor: 'pointer',
              }}
              data-testid="dine-tab-all"
            >
              All
            </button>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flexShrink: 0, borderRadius: 20, padding: '6px 16px', fontSize: 12.5, fontWeight: 700,
                  border: activeTab === tab ? 'none' : '1.5px solid #FFCC99',
                  background: activeTab === tab ? 'linear-gradient(135deg, #FF8C42, #C44400)' : '#FFF3E0',
                  color: activeTab === tab ? '#fff' : '#C44400', cursor: 'pointer',
                }}
                data-testid={`dine-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {fmtTab(tab)}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#FF8C42' }} />
            <span className="ml-3 text-gray-500 text-sm">Filtering for {petName}...</span>
          </div>
        ) : (
          <div className="px-4 pb-6" style={{ paddingTop: tabs.length > 1 ? 24 : 16 }}>

            {/* Art style toggle — soul_made only */}
            {category === 'soul_made' && (filteredProducts.length > 0) && yappyIllustrations.length > 0 && (
              <div style={{ display:'flex', background:'#FFF3E0', borderRadius:999, padding:3, marginBottom:16, gap:2, width:'fit-content' }}>
                {['watercolour','flat_art'].map(s => (
                  <button key={s} onClick={() => setArtStyle(s)} style={{
                    padding:'5px 14px', borderRadius:999, border:'none',
                    background: artStyle===s ? '#C9973A' : 'transparent',
                    color: artStyle===s ? '#fff' : 'rgba(0,0,0,0.45)',
                    fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.15s',
                  }}>
                    {s==='watercolour' ? '🎨 Watercolour' : '🐾 Flat Art'}
                  </button>
                ))}
              </div>
            )}

            {/* Product count */}
            {(filteredProducts.length > 0 || imagines.length > 0) && (
              <p style={{ fontSize: 11, fontWeight: 700, color: '#FF8C42', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 14 }}>
                ✦ {filteredProducts.length} {activeTab === 'all' ? config.label : activeTab}{imagines.length > 0 ? ` + ${imagines.length} Mira Imagines` : ''} — For {petName}
              </p>
            )}

            {/* Mira Imagines grid (for miras-picks — dream items → concierge) */}
            {imagines.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,140,66,0.85)', marginBottom: 10, letterSpacing: '0.04em' }}>
                  ✦ MIRA IMAGINES — NOT YET IN CATALOG
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 14 }}>
                  {imagines.map(item => (
                    <MiraImaginesCard key={item.id} item={item} pet={pet} apiUrl={getApiUrl()} token={token} />
                  ))}
                </div>
              </div>
            )}

            {/* Products / Bundles / Services grid */}
            {filteredProducts.length > 0 ? (
              category === 'soul_made' && artStyle === 'flat_art' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
                  {filteredProducts.map((p, idx) => (
                    <FlatArtPickerCard key={p.id || p.name || idx} product={p} illustrations={yappyIllustrations} pet={pet} pillar="dine" />
                  ))}
                </div>
              ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 16 }}>
                {isBundles
                  ? filteredProducts.map((b, idx) => (
                      <DineBundleCard key={b.id || idx} bundle={b} petName={petName} />
                    ))
                  : filteredProducts.map((p, idx) => {
                      const isService = p.entity_type === 'service' || p.category === 'service' || p.product_type === 'service';
                      return isService
                        ? <ServiceCard key={p.id || idx} service={p} pet={pet} apiUrl={getApiUrl()} token={token} />
                        : <ProductCard key={p.id || idx} product={p} pillar="dine" selectedPet={pet} />;
                    })
                }
              </div>
              )
            ) : (
              !loading && imagines.length === 0 && (
                // ── Universal rule: empty tab/category → Mira Imagine card ──
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,140,66,0.85)', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    ✦ MIRA IMAGINES — NOT YET IN CATALOG
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 14 }}>
                    <MiraImaginesCard
                      item={{
                        id: `imagine-tab-${activeTab}-${category}`,
                        isImagined: true,
                        emoji: config.emoji || '🍽️',
                        name: activeTab === 'all'
                          ? `${petName}'s ${config.label} Box`
                          : `${petName}'s ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Pack`,
                        description: activeTab === 'all'
                          ? `Mira is curating the best ${config.label.toLowerCase()} for ${petName}. Concierge® can source it today.`
                          : `Mira would handpick the best ${activeTab} options for ${petName}'s profile. Ask Concierge® to source them.`,
                      }}
                      pet={pet}
                      apiUrl={getApiUrl()}
                      token={token}
                    />
                    {allergies.length > 0 && (
                      <MiraImaginesCard
                        item={{
                          id: `imagine-safe-${activeTab}-${category}`,
                          isImagined: true,
                          emoji: '🛡️',
                          name: `${allergies.map(a => a.charAt(0).toUpperCase() + a.slice(1) + '-Free').join(' & ')} ${activeTab === 'all' ? config.label : activeTab}`,
                          description: `Every option guaranteed ${allergies.join(' & ')}-free. Curated specifically for ${petName}'s safety.`,
                        }}
                        pet={pet}
                        apiUrl={getApiUrl()}
                        token={token}
                      />
                    )}
                  </div>
                </div>
              )
            )}

            {/* Flat Art shown via toggle above — no separate section needed */}

            {/* ── Soul Made™ Cross-sell — shows in ALL categories (INSIDE scroll area) ─── */}
            {category !== 'soul_made' && (
              <div style={{ marginTop:20 }}>
                <div
                  data-testid="soul-made-cross-sell"
                  onClick={() => setSoulMadeOpen(true)}
                  style={{
                    padding:'20px 20px 18px',
                    background:'linear-gradient(135deg, #1a0a2e 0%, #2d0a4e 50%, #1a0a2e 100%)',
                    border:'1.5px solid rgba(196,77,255,0.4)',
                    borderRadius:18, cursor:'pointer', position:'relative', overflow:'hidden',
                    boxShadow:'0 4px 24px rgba(196,77,255,0.18)',
                    transition:'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(196,77,255,0.32)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 24px rgba(196,77,255,0.18)'; }}
                >
                  <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,background:'radial-gradient(circle,rgba(196,77,255,0.15) 0%,transparent 70%)',pointerEvents:'none'}}/>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.15em',color:'#C44DFF',marginBottom:8}}>
                    {`\u2726 SOUL MADE\u2122 \u00B7 MADE ONLY FOR ${(petName||'YOUR DOG').toUpperCase()}`}
                  </div>
                  <div style={{fontSize:20,fontWeight:800,color:'#F5F0E8',fontFamily:'Georgia,serif',marginBottom:6,lineHeight:1.2}}>
                    {petName}'s face. On everything.
                  </div>
                  <div style={{fontSize:13,color:'rgba(245,240,232,0.55)',marginBottom:16}}>
                    Bandana · Portrait Frame · Party Hat · Cake Topper · Tote · and more
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#C44DFF,#9333EA)',borderRadius:30,padding:'10px 22px',fontSize:13,fontWeight:700,color:'#fff',boxShadow:'0 4px 16px rgba(196,77,255,0.4)'}}>
                      {`\u2726 Make something only ${petName} has`}
                    </div>
                    <div style={{fontSize:12,color:'rgba(245,240,232,0.35)',fontStyle:'italic',maxWidth:160,textAlign:'right',lineHeight:1.4}}>
                      Upload a photo · Concierge® creates it · Price on WhatsApp
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {soulMadeOpen && <SoulMadeModal pet={pet} pillar="dine" pillarColor="#FF8C42" pillarLabel="Food" onClose={() => setSoulMadeOpen(false)} />}
      <div className="flex-shrink-0 px-5 py-4" style={{ borderTop: '1px solid #F0E8E0', background: '#FFFAF6' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Personalised for {petName}</p>
          <button
            onClick={() => { if (category === 'soul_made') { setSoulMadeOpen(true); } else { onClose(); } }}
            className="rounded-xl px-4 py-2 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #FF8C42, #FF6B9D)', border: 'none', cursor: 'pointer' }}
            data-testid="dine-modal-cta"
          >
            {(CTA_LABELS[category] || (() => 'Explore More →'))(petName)}
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50" style={{ zIndex: 63 }}
            onClick={onClose}
          />
          {isDesktop ? (
            <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 65 }}>
              {ModalContent}
            </div>
          ) : (
            <div style={{ zIndex: 65, position: 'fixed', inset: 0, pointerEvents: 'none' }}>
              <div style={{ pointerEvents: 'auto' }}>{ModalContent}</div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default DineContentModal;
