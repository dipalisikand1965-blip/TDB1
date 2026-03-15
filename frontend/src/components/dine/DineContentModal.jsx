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
import { X, Loader2, Check, ShoppingCart } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

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

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  'daily-meals':      { emoji: '🐟', label: 'Daily Meals',          apiCategory: 'Daily Meals' },
  'treats-rewards':   { emoji: '🦴', label: 'Treats & Rewards',     apiCategory: 'Treats & Rewards' },
  'supplements':      { emoji: '💊', label: 'Supplements',           apiCategory: 'Supplements' },
  'frozen-fresh':     { emoji: '🧊', label: 'Frozen & Fresh',        apiCategory: 'Frozen & Fresh' },
  'homemade-recipes': { emoji: '🍳', label: 'Homemade & Recipes',    apiCategory: 'Homemade & Recipes' },
  'bundles':          { emoji: '🎁', label: 'Dining Bundles',        apiCategory: null },
  'soul-picks':       { emoji: '✨', label: 'Soul Picks',            apiCategory: null },
  'miras-picks':      { emoji: '💫', label: "Mira's Picks",          apiCategory: null },
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

// ── DineProductCard ───────────────────────────────────────────────────────────
const DineProductCard = ({ product, petName, allergies }) => {
  const [added, setAdded] = useState(false);
  const price = product.price || product.bundle_price;
  const freeFrom = product.allergy_free && product.allergy_free !== 'N/A — guide only'
    ? product.allergy_free : null;
  const badge = product.mira_tag || null;
  const isFree = !price || price === 0;

  // Check if this product matches pet's allergy requirements
  const isAllergyMatch = allergies.length > 0 && freeFrom
    ? allergies.every(al => freeFrom.toLowerCase().includes(al + '-free'))
    : false;

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        border: `1.5px solid ${isAllergyMatch ? '#FF8C42' : '#F0E8E0'}`,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isAllergyMatch
          ? '0 2px 16px rgba(255,140,66,0.15)'
          : '0 2px 8px rgba(0,0,0,0.06)',
      }}
      data-testid={`dine-product-${product.id}`}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 160, overflow: 'hidden', background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', flexShrink: 0 }}>
        {(product.image_url || product.image) ? (
          <img
            src={product.image_url || product.image}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🍽️</div>
        )}
        {badge && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'linear-gradient(135deg, #7B2FBE, #C44DFF)',
            color: '#fff', borderRadius: 20, padding: '4px 10px',
            fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            ✦ {badge}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '12px 12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontWeight: 800, fontSize: 13, color: '#1A0A00', lineHeight: 1.3, margin: 0 }}>
          {product.name}
        </p>

        {freeFrom && (
          <p style={{ fontSize: 10.5, color: '#888', margin: 0, lineHeight: 1.4 }}>
            {freeFrom}
          </p>
        )}

        {/* Price + Add */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
          {isFree ? (
            <span style={{ fontSize: 13, fontWeight: 800, color: '#27AE60' }}>Free</span>
          ) : (
            <span style={{ fontSize: 14, fontWeight: 800, color: '#C44400' }}>
              ₹{Number(price).toLocaleString('en-IN')}
            </span>
          )}
          {added ? (
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: '#27AE60', color: '#fff', border: '2px solid #9B59B6',
                borderRadius: 10, padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
              onClick={() => setAdded(false)}
            >
              <Check size={12} /> Added
            </button>
          ) : (
            <button
              style={{
                background: 'linear-gradient(135deg, #FF8C42, #C44400)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
              onClick={() => setAdded(true)}
              data-testid={`add-product-${product.id}`}
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
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

// ── Mira Imagines Card ────────────────────────────────────────────────────────
const MiraImaginesCard = ({ item, petName }) => {
  const [requested, setRequested] = useState(false);
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg, #1A0A00, #2D1A00)', border: '1.5px solid rgba(255,140,66,0.3)', minHeight: 200, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', top: 8, right: 8 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px 12px' }}>
        <span style={{ fontSize: 40 }}>{item.emoji}</span>
        <p style={{ fontWeight: 800, color: '#fff', textAlign: 'center', fontSize: 12, marginTop: 8 }}>{item.name}</p>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, textAlign: 'center', marginTop: 4 }}>{item.description}</p>
      </div>
      <div style={{ padding: '0 12px 14px' }}>
        {requested ? (
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#32C878' }}>
            <Check size={12} style={{ display: 'inline', marginRight: 4 }} /> Sent to Concierge!
          </div>
        ) : (
          <button onClick={() => setRequested(true)} style={{ width: '100%', background: 'linear-gradient(135deg, #FF8C42, #FF6B9D)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            Request a Quote →
          </button>
        )}
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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [tabs, setTabs] = useState([]);
  const [miraImagines, setMiraImagines] = useState([]);
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
    setTabs([]);
    setMiraImagines([]);
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

      // ── Soul Picks: breed merchandise ──────────────────────────────
      if (category === 'soul-picks') {
        const breedDisplay = getBreedDisplay(pet);
        const breedSearch = breedDisplay.toLowerCase();
        const breedCats = ['breed-bowls', 'breed-treat_jars', 'breed-mugs', 'breed-bandanas', 'breed-frames', 'breed-keychains', 'breed-tote_bags'];
        const responses = await Promise.all(breedCats.map(cat => fetch(`${apiUrl}/api/products?category=${cat}&limit=40`)));
        const datasets = await Promise.all(responses.map(r => r.ok ? r.json() : { products: [] }));
        const allMerch = datasets.flatMap(d => d.products || []);
        const breedMerch = breedSearch ? allMerch.filter(p => (p.name || '').toLowerCase().includes(breedSearch)) : allMerch;
        setProducts(breedMerch.length > 0 ? breedMerch : allMerch.slice(0, 12));
        return;
      }

      // ── Mira's Picks ───────────────────────────────────────────────
      if (category === 'miras-picks') {
        const r = await fetch(`${apiUrl}/api/admin/pillar-products?pillar=dine&limit=20`);
        if (r.ok) {
          const d = await r.json();
          setProducts((d.products || []).slice(0, 12));
        }
        const imaginary = [];
        const loves = getPetLoves(pet);
        if (loves.length === 0 && petName !== 'your dog') {
          imaginary.push({ emoji: '✨', name: `${petName}'s Personalised Meal Plan`, description: 'Mira imagines the perfect weekly plan for your dog' });
        }
        setMiraImagines(imaginary);
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
            {filteredProducts.length > 0 && (
              <p style={{ fontSize: 11, fontWeight: 700, color: '#FF8C42', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 14 }}>
                ✦ {filteredProducts.length} {activeTab === 'all' ? config.label : activeTab} — For {petName}
              </p>
            )}

            {/* Mira imagines */}
            {miraImagines.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))', gap: 16, marginBottom: 16 }}>
                {miraImagines.map((item, idx) => (
                  <MiraImaginesCard key={idx} item={item} petName={petName} />
                ))}
              </div>
            )}

            {/* Products / Bundles grid */}
            {filteredProducts.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
                {isBundles
                  ? filteredProducts.map((b, idx) => (
                      <DineBundleCard key={b.id || idx} bundle={b} petName={petName} />
                    ))
                  : filteredProducts.map((product, idx) => (
                      <DineProductCard key={product.id || idx} product={product} petName={petName} allergies={allergies} />
                    ))
                }
              </div>
            ) : (
              !loading && (
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
