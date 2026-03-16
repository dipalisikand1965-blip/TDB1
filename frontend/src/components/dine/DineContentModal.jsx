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
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../ProductCard';

// ── Pet data helpers ──────────────────────────────────────────────────────────
const getPetAllergies = (pet) => {
  const sets = new Set();
  const push = (v) => {
    if (!v) return;
    const arr = Array.isArray(v) ? v : v.split(/,|;/).map(s => s.trim());
    arr.forEach(a => { if (a) sets.add(a.toLowerCase()); });
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
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      await fetch(`${apiUrl}/api/service_desk/attach_or_create_ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          parent_id: storedUser?.id || storedUser?.email || 'guest',
          pet_id: pet?.id || 'unknown',
          pillar: 'dine',
          intent_primary: 'mira_imagines_request',
          intent_secondary: [item.name],
          life_state: 'dine',
          channel: 'miras_picks_imagines',
          initial_message: {
            sender: 'parent',
            source: 'dine_miras_picks',
            text: `I'd love "${item.name}" for ${petName}. Mira imagined this — please help source it!`,
          },
        }),
      });
    } catch (err) { console.error('[MiraImaginesCard]', err); }
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
            <Check size={12} style={{ display: 'inline', marginRight: 4 }} /> Sent to Concierge!
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
      const isService = p.category === 'service' || p.product_type === 'service';
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

  const loveStr = loves.length > 0 ? loves[0] : null;

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
  const [imagines, setImagines] = useState([]);  // Mira Imagines (not-yet-in-catalog)
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [tabs, setTabs] = useState([]);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
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
    setImagines([]);
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

      // ── Soul Picks: breed merchandise for this specific breed ────────
      if (category === 'soul-picks') {
        const breedDisplay = getBreedDisplay(pet);
        const breedSearch = breedDisplay.toLowerCase();
        if (!breedSearch) {
          setProducts([]); // No breed info → show empty state
          return;
        }
        const breedCats = ['breed-bowls', 'breed-treat_jars', 'breed-mugs', 'breed-bandanas', 'breed-frames', 'breed-keychains', 'breed-tote_bags'];
        const responses = await Promise.all(breedCats.map(cat => fetch(`${apiUrl}/api/products?category=${cat}&limit=40`)));
        const datasets = await Promise.all(responses.map(r => r.ok ? r.json() : { products: [] }));
        const allMerch = datasets.flatMap(d => d.products || []);
        // Only show merchandise matching this pet's exact breed — never show wrong breed
        const breedMerch = allMerch.filter(p => (p.name || '').toLowerCase().includes(breedSearch));
        setProducts(breedMerch); // Empty if no breed match (correct — don't show wrong breed)
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
        const [catResults, serviceRes] = await Promise.all([
          Promise.all(FOOD_CATS.map(cat =>
            fetch(`${apiUrl}/api/admin/pillar-products?pillar=dine&category=${encodeURIComponent(cat)}&limit=60`)
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

        // 3. Merge pre-computed Claude scores into raw items
        const scoreById = {};
        preScored.forEach(p => { scoreById[p.id] = p; });
        const enriched = allRaw.map(p => ({
          ...p,
          ...(scoreById[p.id] ? { mira_score: scoreById[p.id].mira_score } : {}),
          mira_hint: scoreById[p.id]?.mira_reason || p.mira_hint || null,
        }));

        // 4. Apply client-side intelligence (filter allergens + sort)
        const intelligent = applyMirasPicksIntelligence(enriched, allergies, getPetLoves(pet), healthCondition, petName);

        // 5. Sort: Claude scores override client-side sort when available
        const hasMiraScores = preScored.length > 0;
        const sorted = hasMiraScores
          ? [...intelligent].sort((a, b) => (b.mira_score || 0) - (a.mira_score || 0))
          : intelligent;

        const services = sorted.filter(p => p.category === 'service' || p.product_type === 'service');
        const realProducts = sorted.filter(p => p.category !== 'service' && p.product_type !== 'service');
        setProducts([...services, ...realProducts].slice(0, 20));
        setImagines(generateMiraImagines(pet, realProducts));

        // 6. Fire-and-forget background scoring if no scores yet
        if (petId && !hasMiraScores) {
          fetch(`${apiUrl}/api/mira/score-for-pet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet_id: petId, pillar: 'dine' }),
          }).catch(() => {});
        }
        return;
      }

      // ── Standard categories ────────────────────────────────────────
      if (config.apiCategory) {
        const url = `${apiUrl}/api/admin/pillar-products?pillar=dine&category=${encodeURIComponent(config.apiCategory)}&limit=60`;
        const r = await fetch(url);
        if (r.ok) {
          const d = await r.json();
          const prods = d.products || [];
          // Sort: allergy-safe for this pet first
          const sorted = sortProductsForPet(prods, allergies);
          setProducts(sorted);
          const uniqueTabs = [...new Set(prods.map(p => p.sub_category).filter(Boolean))];
          setTabs(uniqueTabs);
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
    : products.filter(p => (p.sub_category === activeTab) || (p.category === activeTab));

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
        display: 'flex', flexDirection: 'column', zIndex: 56,
      }}
      data-testid={`dine-modal-${category}`}
    >
      {/* Drag handle (mobile) */}
      {!isDesktop && (
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="rounded-full bg-gray-200" style={{ width: 40, height: 4 }} />
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #F0E8E0' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
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
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#FFF3E0', color: '#C44400', border: 'none',
            borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', flexShrink: 0,
          }}
          data-testid="dine-modal-close"
        >
          Close <X size={13} />
        </button>
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
      {tabs.length > 1 && (
        <div className="flex-shrink-0 flex gap-2 overflow-x-auto px-4 py-3"
          style={{ scrollbarWidth: 'none' }}>
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
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* ── Product Grid ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#FF8C42' }} />
            <span className="ml-3 text-gray-500 text-sm">Filtering for {petName}...</span>
          </div>
        ) : (
          <div className="px-4 pb-6" style={{ paddingTop: tabs.length > 1 ? 4 : 16 }}>

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

            {/* Products / Bundles grid */}
            {filteredProducts.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 16 }}>
                {isBundles
                  ? filteredProducts.map((b, idx) => (
                      <DineBundleCard key={b.id || idx} bundle={b} petName={petName} />
                    ))
                  : filteredProducts.map((p, idx) => (
                      <ProductCard key={p.id || idx} product={p} pillar="dine" selectedPet={pet} />
                    ))
                }
              </div>
            ) : (
              !loading && imagines.length === 0 && (
                <div className="text-center py-12">
                  <p style={{ fontSize: 36 }}>{config.emoji}</p>
                  <p className="text-sm text-gray-500 mt-2">Personalised picks being curated for {petName}!</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ── Footer CTA ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 py-4" style={{ borderTop: '1px solid #F0E8E0', background: '#FFFAF6' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Personalised for {petName}</p>
          <button
            onClick={onClose}
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
            className="fixed inset-0 bg-black/50" style={{ zIndex: 55 }}
            onClick={onClose}
          />
          {isDesktop ? (
            <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 56 }}>
              {ModalContent}
            </div>
          ) : (
            <div style={{ zIndex: 56, position: 'fixed', inset: 0, pointerEvents: 'none' }}>
              <div style={{ pointerEvents: 'auto' }}>{ModalContent}</div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default DineContentModal;
