/**
 * DineContentModal.jsx
 *
 * Category modal for /dine — mirrors CelebrateContentModal golden principle.
 * Fetches products from /api/admin/pillar-products?pillar=dine&category=...
 * Uses the same ProductCard, BundleCard, and Soul Picks logic.
 *
 * Mobile: full-screen bottom sheet
 * Desktop: centred large modal
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check } from 'lucide-react';
import ProductCard from '../ProductCard';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// ── Category display config ───────────────────────────────────────────────
const CATEGORY_CONFIG = {
  'daily-meals': {
    emoji: '🐟',
    label: 'Daily Meals',
    miraLabel: "Mira's nutrition pick for your dog",
    emptyText: "Personalised meals being curated for your dog!",
    apiCategory: 'Daily Meals',
  },
  'treats-rewards': {
    emoji: '🦴',
    label: 'Treats & Rewards',
    miraLabel: 'Hand-baked treats your dog will love',
    emptyText: 'Our bakery is preparing fresh treats!',
    apiCategory: 'Treats & Rewards',
  },
  'supplements': {
    emoji: '💊',
    label: 'Supplements',
    miraLabel: 'Vet-approved supplements for your dog',
    emptyText: 'Supplement plans being prepared!',
    apiCategory: 'Supplements',
  },
  'frozen-fresh': {
    emoji: '🧊',
    label: 'Frozen & Fresh',
    miraLabel: 'Cold-pressed & raw nutrition',
    emptyText: 'Fresh batches being prepared!',
    apiCategory: 'Frozen & Fresh',
  },
  'homemade-recipes': {
    emoji: '🍳',
    label: 'Homemade & Recipes',
    miraLabel: 'Free recipes + ingredient packs',
    emptyText: 'Recipes being curated!',
    apiCategory: 'Homemade & Recipes',
  },
  'bundles': {
    emoji: '🎁',
    label: 'Dining Bundles',
    miraLabel: 'Curated dine bundles for your dog',
    emptyText: 'Bundle packs being curated!',
    apiCategory: null, // handled separately via /api/bundles?pillar=dine
  },
  'soul-picks': {
    emoji: '✨',
    label: 'Soul Picks',
    miraLabel: 'Made just for your dog',
    emptyText: 'Personalised picks loading!',
    apiCategory: null, // handled separately (breed merchandise)
  },
  'miras-picks': {
    emoji: '💫',
    label: "Mira's Picks",
    miraLabel: 'Soul-curated by Mira',
    emptyText: 'Mira is curating your picks!',
    apiCategory: null, // handled separately
  },
};

// ── CTA labels per category ───────────────────────────────────────────────
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

// ── Breed slug helper ─────────────────────────────────────────────────────
const getBreedDisplay = (pet) => {
  const breed = (pet?.breed || '').trim();
  if (!breed) return '';
  return breed.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

// ── Mira imagines card (for soul-picks / miras-picks) ────────────────────
const MiraImaginesCard = ({ item, petName }) => {
  const [requested, setRequested] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden relative flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #1A0A00 0%, #2D1A00 100%)',
        border: '1.5px solid rgba(255,140,66,0.3)',
        minHeight: 220,
      }}
    >
      <div className="absolute top-2 right-2 text-white text-xs font-bold rounded-full px-2 py-0.5"
        style={{ background: 'rgba(255,140,66,0.6)', backdropFilter: 'blur(4px)', fontSize: 9 }}>
        Mira Imagines
      </div>
      <div className="flex flex-col items-center justify-center pt-8 pb-4 px-4 flex-1">
        <span style={{ fontSize: 44 }} className="mb-2">{item.emoji}</span>
        <p className="font-extrabold text-center text-white leading-tight" style={{ fontSize: 13 }}>{item.name}</p>
        <p className="text-center mt-1" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>{item.description}</p>
      </div>
      <div className="px-3 pb-4 mt-auto">
        {requested ? (
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl py-2"
            style={{ background: 'rgba(50,200,120,0.25)', color: '#32C878' }}>
            <Check className="w-3.5 h-3.5" /> Sent to Concierge!
          </div>
        ) : (
          <button
            onClick={() => setRequested(true)}
            className="w-full text-white font-bold rounded-xl py-2 text-xs"
            style={{ background: 'linear-gradient(135deg, #FF8C42, #FF6B9D)', border: 'none', cursor: 'pointer' }}
          >
            Request a Quote →
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Modal ──────────────────────────────────────────────────────────────
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

  const config = CATEGORY_CONFIG[category] || { emoji: '🍽️', label: category, miraLabel: 'Curated for you', emptyText: 'Loading...', apiCategory: null };
  const petName = pet?.name || 'your dog';

  const fetchData = useCallback(async () => {
    if (!isOpen || !category) return;
    setLoading(true);
    setProducts([]);
    setTabs([]);
    setMiraImagines([]);
    setActiveTab('all');

    const apiUrl = getApiUrl();

    try {
      // ── Bundles: fetch from unified bundles collection ─────────────
      if (category === 'bundles') {
        const r = await fetch(`${apiUrl}/api/bundles?pillar=dine&limit=20`);
        if (r.ok) {
          const d = await r.json();
          // Map bundles to product-card-compatible shape
          const mapped = (d.bundles || []).map(b => ({
            id: b.id,
            name: b.name,
            description: b.description,
            price: b.bundle_price || b.price,
            original_price: b.original_price,
            image_url: b.image_url || b.image || null,
            mira_tag: b.popular ? '⭐ Popular' : null,
            sub_category: 'Bundle',
            category: 'Bundles',
            items: b.items || [],
            discount: b.discount,
          }));
          setProducts(mapped);
        }
        return;
      }

      // ── Soul Picks: breed-specific merchandise ──────────────────────
      if (category === 'soul-picks') {
        const breedDisplay = getBreedDisplay(pet);
        const breedSearch = breedDisplay.toLowerCase();
        const breedCats = [
          'breed-bowls', 'breed-treat_jars', 'breed-mugs', 'breed-bandanas',
          'breed-frames', 'breed-keychains', 'breed-tote_bags',
        ];
        const responses = await Promise.all(
          breedCats.map(cat => fetch(`${apiUrl}/api/products?category=${cat}&limit=40`))
        );
        const datasets = await Promise.all(responses.map(r => r.ok ? r.json() : { products: [] }));
        const allMerch = datasets.flatMap(d => d.products || []);
        const breedMerch = breedSearch ? allMerch.filter(p => (p.name || '').toLowerCase().includes(breedSearch)) : allMerch;
        setProducts(breedMerch.length > 0 ? breedMerch : allMerch.slice(0, 12));
        return;
      }

      // ── Mira's Picks: personalised dine picks from soul data ────────
      if (category === 'miras-picks') {
        const r = await fetch(`${apiUrl}/api/admin/pillar-products?pillar=dine&limit=20`);
        if (r.ok) {
          const d = await r.json();
          setProducts((d.products || []).slice(0, 12));
        }
        // Generate imaginary picks from pet soul data
        const imaginary = [];
        const foods = (pet?.learned_facts || [])
          .filter(f => f.type === 'loves' || f.type === 'likes')
          .map(f => f.value).filter(Boolean).slice(0, 2);
        if (foods.length === 0 && petName !== 'your dog') {
          imaginary.push({ emoji: '✨', name: `${petName}'s Personalised Meal Plan`, description: 'Mira imagines the perfect weekly plan for your dog' });
        }
        setMiraImagines(imaginary);
        return;
      }

      // ── Standard categories: fetch from SSOT ───────────────────────
      if (config.apiCategory) {
        const url = `${apiUrl}/api/admin/pillar-products?pillar=dine&category=${encodeURIComponent(config.apiCategory)}&limit=60`;
        const r = await fetch(url);
        if (r.ok) {
          const d = await r.json();
          const prods = d.products || [];
          setProducts(prods);
          // Extract unique sub_categories as tabs
          const uniqueTabs = [...new Set(prods.map(p => p.sub_category).filter(Boolean))];
          setTabs(uniqueTabs);
        }
      }
    } catch (err) {
      console.error('[DineContentModal] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, category, pet, config.apiCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredProducts = activeTab === 'all'
    ? products
    : products.filter(p => p.sub_category === activeTab);

  if (!isOpen) return null;

  const ModalContent = (
    <motion.div
      initial={{ opacity: 0, y: isDesktop ? 0 : 60, scale: isDesktop ? 0.97 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isDesktop ? 0 : 60, scale: isDesktop ? 0.97 : 1 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="bg-white overflow-hidden"
      style={isDesktop ? {
        width: '92vw',
        maxWidth: 1140,
        maxHeight: '90vh',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.20)',
      } : {
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        maxHeight: '93vh',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 56,
      }}
      data-testid={`dine-modal-${category}`}
    >
      {/* Drag handle (mobile) */}
      {!isDesktop && (
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="rounded-full bg-gray-200" style={{ width: 40, height: 4 }} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #F0E8E0' }}>
        <div>
          <h2 className="font-extrabold text-xl flex items-center gap-2" style={{ color: '#1A0A00' }}>
            <span>{config.emoji}</span> {config.label}
          </h2>
          <p className="text-sm" style={{ color: '#888' }}>
            For <span style={{ color: '#FF8C42', fontWeight: 600 }}>{petName}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-gray-100 transition-colors"
          style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
          data-testid="dine-modal-close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Mira's pick banner */}
      {config.miraLabel && (
        <div className="px-5 py-2 flex-shrink-0"
          style={{ background: 'linear-gradient(90deg, #FFF3E0, #FFF8F0)', borderBottom: '1px solid #F5E8D0' }}>
          <p className="text-xs font-semibold" style={{ color: '#C44400' }}>
            ✦ {config.miraLabel}
          </p>
        </div>
      )}

      {/* Sub-category tab filter */}
      {tabs.length > 1 && (
        <div className="px-4 py-2 flex-shrink-0 flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none', borderBottom: '1px solid #F0E8E0' }}>
          <button
            onClick={() => setActiveTab('all')}
            className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            style={{
              background: activeTab === 'all' ? '#FF8C42' : '#F5F5F5',
              color: activeTab === 'all' ? '#fff' : '#555',
              border: 'none', cursor: 'pointer',
            }}
            data-testid="dine-tab-all"
          >
            All
          </button>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              style={{
                background: activeTab === tab ? '#FF8C42' : '#F5F5F5',
                color: activeTab === tab ? '#fff' : '#555',
                border: 'none', cursor: 'pointer',
              }}
              data-testid={`dine-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable product grid */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#FF8C42' }} />
            <span className="ml-3 text-gray-500 text-sm">Fetching for {petName}...</span>
          </div>
        )}

        {!loading && (
          <div className="px-4 pt-4 pb-6">

            {/* Product count */}
            {filteredProducts.length > 0 && (
              <p className="text-xs font-bold uppercase tracking-wider mb-4"
                style={{ color: '#FF8C42', letterSpacing: '0.06em' }}>
                ✦ {filteredProducts.length} {activeTab === 'all' ? config.label : activeTab} — For {petName}
              </p>
            )}

            {/* Mira imagines cards */}
            {miraImagines.length > 0 && (
              <div className="grid gap-4 mb-4"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))' }}>
                {miraImagines.map((item, idx) => (
                  <MiraImaginesCard key={idx} item={item} petName={petName} />
                ))}
              </div>
            )}

            {/* Product grid using shared ProductCard */}
            {filteredProducts.length > 0 ? (
              <div className="grid gap-4"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))' }}>
                {filteredProducts.map((product, idx) => (
                  <div key={product.id || idx} className="relative">
                    <ProductCard product={product} pillar="dine" selectedPet={pet} size="small" />
                    {product.mira_tag && (
                      <span
                        className="absolute top-2 left-2 text-white text-xs font-bold rounded-full px-2 py-0.5 pointer-events-none"
                        style={{ background: 'linear-gradient(135deg, #FF8C42, #FF6B9D)', fontSize: 9, zIndex: 1 }}>
                        {product.mira_tag}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              !loading && (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">{config.emoji}</p>
                  <p className="text-sm text-gray-500">{config.emptyText}</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="flex-shrink-0 px-5 py-4"
        style={{ borderTop: '1px solid #F0E8E0', background: '#FFFAF6' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Everything here is personalised for {petName}</p>
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
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50"
        style={{ zIndex: 55 }}
        onClick={onClose}
      />

      {/* Modal — centred on desktop, bottom sheet on mobile */}
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
  );
};

export default DineContentModal;
