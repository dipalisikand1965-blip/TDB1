/**
 * CelebrateContentModal.jsx
 *
 * Category strip modal — fully responsive:
 * - Mobile (iOS/Android): full-screen bottom sheet
 * - Desktop: centered large modal
 *
 * Layout:
 * 1. Header: emoji + category + "For {pet}" + close
 * 2. Mira's Picks row (breed-specific, only if data exists)
 * 3. Product grid using real ProductCard component (View Details → full modal)
 * 4. For Bundles: BundleCard with inline detail sheet
 * 5. "Continue Shopping" footer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Sparkles, ChevronRight, ShoppingBag } from 'lucide-react';
import ProductCard from '../ProductCard';
import { getApiUrl } from '../../utils/api';

// ── Breed slug helper ──────────────────────────────────────────────────────
const BREED_SLUG_MAP = {
  'indian pariah': 'indie', 'indie': 'indie', 'pariah': 'indie',
  'labrador retriever': 'labrador', 'labrador': 'labrador',
  'golden retriever': 'golden', 'golden': 'golden',
  'beagle': 'beagle',
  'pug': 'pug',
  'german shepherd': 'german-shepherd', 'gsd': 'german-shepherd',
  'shih tzu': 'shih-tzu',
  'dachshund': 'dachshund',
  'pomeranian': 'pomeranian',
  'husky': 'husky', 'siberian husky': 'husky',
  'doberman': 'doberman', 'dobermann': 'doberman',
  'rottweiler': 'rottweiler',
  'cocker spaniel': 'cocker-spaniel',
  'border collie': 'border-collie',
};

const getBreedSlug = (pet) => {
  if (!pet) return null;
  const breed = (pet.breed || '').toLowerCase().trim();
  return BREED_SLUG_MAP[breed] || breed.split(/\s+/)[0] || null;
};

// ── Category → API mapping ────────────────────────────────────────────────
// NOTE: DB uses 'celebration' for birthday cakes, 'dognuts' for pupcakes
const CATEGORY_API = {
  'birthday-cakes':  [
    { url: '/api/products?category=celebration&limit=60', key: 'products' },
    { url: '/api/products?category=cakes&limit=20', key: 'products' },
  ],
  'breed-cakes':     [{ url: '/api/products?category=breed-cakes&limit=60', key: 'products' }],
  'pupcakes':        [
    { url: '/api/products?category=dognuts&limit=40', key: 'products' },
    { url: '/api/products?category=pupcakes&limit=20', key: 'products' },
  ],
  'desi-treats':     [{ url: '/api/products?category=desi-treats&limit=30', key: 'products' }],
  'frozen-treats':   [{ url: '/api/products?category=frozen-treats&limit=40', key: 'products' }],
  'party':           [
    { url: '/api/products?category=party_accessories&limit=20', key: 'products' },
    { url: '/api/products?category=party_kits&limit=20', key: 'products' },
    { url: '/api/products?category=celebration_addons&limit=20', key: 'products' },
    { url: '/api/products?category=party_supplies&limit=10', key: 'products' },
  ],
  'nut-butters':     [{ url: '/api/products?category=nut-butters&limit=20', key: 'products' }],
  'hampers':         [{ url: '/api/products?category=hampers&limit=50', key: 'products' }],
  'bundles':         [{ url: '/api/celebrate/bundles', key: 'bundles' }],
  'soul-picks':      [],
  'miras-picks':     [
    { url: '/api/products?category=celebration&limit=20', key: 'products' },
    { url: '/api/products?category=hampers&limit=10', key: 'products' },
  ],
};

// Fallback if primary category yields nothing
const FALLBACK_API = '/api/products?category=celebration&limit=20';

// ── BundleCard + BundleDetailSheet ────────────────────────────────────────
const BundleDetailSheet = ({ bundle, pet, onClose }) => {
  const petName = pet?.name || 'your pet';
  const img = bundle.image_url || bundle.image || bundle.images?.[0];

  return (
    <>
      <div className="fixed inset-0 bg-black/50" style={{ zIndex: 70 }} onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-white"
        style={{ zIndex: 71, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80vh', overflowY: 'auto' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="rounded-full bg-gray-200" style={{ width: 40, height: 4 }} />
        </div>
        {img && (
          <img src={img} alt={bundle.name} className="w-full object-cover"
            style={{ height: 220, objectFit: 'cover' }} />
        )}
        <div className="p-6">
          <div className="inline-block rounded-full text-white text-xs font-bold mb-3"
            style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)', padding: '3px 12px' }}>
            Curated for {petName}
          </div>
          <h3 className="font-extrabold text-2xl mb-2" style={{ color: '#1A0A00' }}>{bundle.name}</h3>
          {bundle.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{bundle.description}</p>
          )}
          {bundle.items?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">What's inside</p>
              <div className="flex flex-wrap gap-2">
                {bundle.items.map((item, idx) => (
                  <span key={idx} className="rounded-full px-3 py-1 text-sm"
                    style={{ background: 'rgba(196,77,255,0.08)', border: '1px solid rgba(196,77,255,0.20)', color: '#4B0082' }}>
                    {typeof item === 'string' ? item : item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mt-4">
            <div>
              <span className="text-2xl font-extrabold" style={{ color: '#1A0A00' }}>
                ₹{(bundle.total_price || bundle.price || 0).toLocaleString('en-IN')}
              </span>
              {bundle.original_price && bundle.original_price > (bundle.total_price || bundle.price || 0) && (
                <span className="text-sm text-gray-400 line-through ml-2">
                  ₹{bundle.original_price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('addToCart', { detail: { ...bundle, quantity: 1 } }));
                onClose();
              }}
              className="rounded-xl text-white font-bold px-6 py-3"
              style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)', border: 'none', cursor: 'pointer' }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const BundleCard = ({ bundle, pet }) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const img = bundle.image_url || bundle.image || bundle.images?.[0];
  const price = bundle.total_price || bundle.price || 0;

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden cursor-pointer bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
        style={{ border: '1px solid #F0E8FF' }}
        onClick={() => setDetailOpen(true)}
        data-testid={`bundle-card-${bundle.id}`}
      >
        {img ? (
          <div className="relative" style={{ paddingBottom: '75%' }}>
            <img src={img} alt={bundle.name}
              className="absolute inset-0 w-full h-full object-cover" />
          </div>
        ) : (
          <div className="flex items-center justify-center bg-purple-50" style={{ height: 140 }}>
            <span className="text-5xl">🎁</span>
          </div>
        )}
        <div className="p-3">
          {bundle.badge && (
            <span className="inline-block rounded-full text-xs font-bold mb-1"
              style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)', color: 'white', padding: '2px 8px' }}>
              {bundle.badge}
            </span>
          )}
          <p className="font-bold text-sm mb-0.5 line-clamp-2" style={{ color: '#1A0A00' }}>{bundle.name}</p>
          {bundle.items?.length > 0 && (
            <p className="text-xs text-gray-500 line-clamp-1 mb-1">
              {bundle.items.slice(0, 3).map(i => typeof i === 'string' ? i : i.name).join(' · ')}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm" style={{ color: '#1A0A00' }}>
              ₹{price.toLocaleString('en-IN')}
            </span>
            <span className="text-xs rounded-full px-2 py-0.5"
              style={{ background: 'rgba(196,77,255,0.10)', color: '#7C3AED', fontWeight: 600 }}>
              View
            </span>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {detailOpen && (
          <BundleDetailSheet bundle={bundle} pet={pet} onClose={() => setDetailOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

// ── Breed Product card (Soul Picks / Made for Mojo) ───────────────────────
const BreedProductCard = ({ product, pet }) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const img = product.mockup_url || product.image_url || product.image;
  const petName = pet?.name || 'your pet';

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden cursor-pointer bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
        style={{ border: '1px solid #FEE0D2' }}
        onClick={() => setDetailOpen(true)}
        data-testid={`breed-product-${product.id}`}
      >
        <div className="relative" style={{ paddingBottom: '80%', background: '#FFF5F0' }}>
          {img ? (
            <img src={img} alt={product.name}
              className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain' }} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl">🐕</div>
          )}
          <span className="absolute top-2 right-2 text-white text-xs font-bold rounded-full px-2 py-0.5"
            style={{ background: 'linear-gradient(135deg, #FF8C42, #FF6B9D)' }}>
            For {petName}
          </span>
        </div>
        <div className="p-3">
          <p className="font-bold text-sm mb-1 line-clamp-2" style={{ color: '#1A0A00' }}>{product.name}</p>
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm">
              ₹{(product.price || 299).toLocaleString('en-IN')}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setDetailOpen(true); }}
              className="text-xs rounded-full px-2 py-0.5 font-semibold"
              style={{ background: 'rgba(255,107,61,0.12)', color: '#C44400', border: 'none', cursor: 'pointer' }}>
              View
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {detailOpen && (
          <BundleDetailSheet bundle={product} pet={pet} onClose={() => setDetailOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

// ── Category Config (labels, icons, Mira picks context) ───────────────────
export const CATEGORY_CONFIG = {
  'birthday-cakes': {
    emoji: '🎂', label: 'Birthday Cakes',
    miraLabel: "Mira's Pick for your breed",
    emptyText: 'Our bakers are preparing fresh cakes. Check back soon!'
  },
  'breed-cakes': {
    emoji: '🐕', label: 'Breed Cakes',
    miraLabel: 'Made for your breed',
    emptyText: 'Breed-specific cakes coming soon!'
  },
  'pupcakes': {
    emoji: '🧁', label: 'Pupcakes & Dognuts',
    miraLabel: "Small bites, big love",
    emptyText: 'Pupcakes baking now!'
  },
  'desi-treats': {
    emoji: '🪔', label: 'Desi Treats',
    miraLabel: 'Indian flavours your pup loves',
    emptyText: 'Desi treats coming soon!'
  },
  'frozen-treats': {
    emoji: '🧊', label: 'Frozen Treats',
    miraLabel: 'Cool & delicious',
    emptyText: 'Frozen treats coming soon!'
  },
  'party': {
    emoji: '🎉', label: 'Party & Decor',
    miraLabel: 'Dress up the pawty!',
    emptyText: 'Party supplies coming soon!'
  },
  'nut-butters': {
    emoji: '🥜', label: 'Nut Butters',
    miraLabel: 'Lick-worthy spreads',
    emptyText: 'Nut butters coming soon!'
  },
  'hampers': {
    emoji: '🎁', label: 'Gift Hampers',
    miraLabel: 'Curated hamper sets',
    emptyText: 'Hampers being curated!'
  },
  'bundles': {
    emoji: '🎀', label: 'Celebration Bundles',
    miraLabel: 'Complete celebration packages',
    emptyText: 'Bundles being assembled!'
  },
  'soul-picks': {
    emoji: '✨', label: 'Soul Picks',
    miraLabel: 'Made just for your dog',
    emptyText: "Personalised picks coming for your pup!"
  },
  'miras-picks': {
    emoji: '🌟', label: "Mira's Picks",
    miraLabel: 'Soul-curated by Mira',
    emptyText: 'Mira is curating your picks!'
  },
};

// ── Main Modal ──────────────────────────────────────────────────────────────
const CelebrateContentModal = ({ isOpen, onClose, category, pet }) => {
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [breedProducts, setBreedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const config = CATEGORY_CONFIG[category] || {
    emoji: '🛒', label: category || 'Products',
    miraLabel: 'Curated for you',
    emptyText: 'Products loading...'
  };
  const petName = pet?.name || 'your pet';
  const breedSlug = getBreedSlug(pet);

  const fetchData = useCallback(async () => {
    if (!isOpen || !category) return;
    setLoading(true);
    setProducts([]);
    setBundles([]);
    setBreedProducts([]);

    try {
      const apiUrl = getApiUrl();

      // ── Soul Picks: breed products only ──────────────────────────────
      if (category === 'soul-picks') {
        if (breedSlug) {
          const r = await fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedSlug}&pillar=celebrate&limit=20`);
          if (r.ok) {
            const d = await r.json();
            setBreedProducts(d.products || []);
          }
        }
        // Also get archetype/celebrate products as secondary
        const r2 = await fetch(`${apiUrl}/api/celebrate/products?limit=16`);
        if (r2.ok) {
          const d2 = await r2.json();
          setProducts(d2.products || []);
        }
        setLoading(false);
        return;
      }

      // ── Bundles ──────────────────────────────────────────────────────
      if (category === 'bundles') {
        const r = await fetch(`${apiUrl}/api/celebrate/bundles`);
        if (r.ok) {
          const d = await r.json();
          setBundles(d.bundles || []);
        }
        setLoading(false);
        return;
      }

      // ── Normal categories ─────────────────────────────────────────────
      const apis = CATEGORY_API[category] || [];
      let allProducts = [];
      // For multi-source categories, fetch all endpoints; for single source, break on first success
      const fetchAll = ['party', 'miras-picks'].includes(category);
      for (const api of apis) {
        const r = await fetch(`${apiUrl}${api.url}`);
        if (r.ok) {
          const d = await r.json();
          const items = d[api.key] || [];
          allProducts = [...allProducts, ...items];
        }
        if (!fetchAll && allProducts.length > 0) break;
      }

      // Fallback: if no products found, fetch general celebration
      if (allProducts.length === 0) {
        const r = await fetch(`${apiUrl}${FALLBACK_API}`);
        if (r.ok) {
          const d = await r.json();
          allProducts = d.products || [];
        }
      }
      // Deduplicate by id
      const seenIds = new Set();
      allProducts = allProducts.filter(p => {
        const pid = p.id || p.shopify_id;
        if (!pid || seenIds.has(pid)) return false;
        seenIds.add(pid);
        return true;
      });
      setProducts(allProducts);

      // ── Breed-specific top row ────────────────────────────────────────
      if (breedSlug && ['birthday-cakes', 'breed-cakes'].includes(category)) {
        // Filter existing products by breed
        const breedFiltered = allProducts.filter(p => {
          const text = ((p.name || '') + ' ' + (p.description || '')).toLowerCase();
          return text.includes(breedSlug) || text.includes(pet?.breed?.toLowerCase() || '___');
        });
        if (breedFiltered.length > 0) {
          setBreedProducts(breedFiltered);
        } else if (category === 'breed-cakes') {
          // For breed cakes, also try dedicated breed endpoint
          const r = await fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedSlug}&limit=6`);
          if (r.ok) {
            const d = await r.json();
            setBreedProducts(d.products || []);
          }
        }
      }

    } catch (err) {
      console.error('[CelebrateContentModal] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, category, breedSlug, pet]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter products
  const filteredProducts = activeFilter === 'all' ? products : products.filter(p =>
    (p.life_stage || '').includes(activeFilter) ||
    (p.dietary || '').includes(activeFilter)
  );

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
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: '93vh',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 56,
      }}
      data-testid={`celebrate-modal-${category}`}
    >
      {/* Drag handle (mobile only) */}
      {!isDesktop && (
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="rounded-full bg-gray-200" style={{ width: 40, height: 4 }} />
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #F0E8E0' }}
      >
        <div>
          <h2 className="font-extrabold text-xl flex items-center gap-2" style={{ color: '#1A0A00' }}>
            <span>{config.emoji}</span> {config.label}
          </h2>
          <p className="text-sm" style={{ color: '#888' }}>
            For <span style={{ color: '#C44DFF', fontWeight: 600 }}>{petName}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-gray-100 transition-colors"
          style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
          data-testid="celebrate-modal-close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
            <span className="ml-3 text-gray-500 text-sm">Fetching for {petName}...</span>
          </div>
        )}

        {!loading && (
          <div className="px-4 pt-4 pb-6">

            {/* ── BUNDLES layout ──────────────────────────────────────── */}
            {category === 'bundles' && (
              bundles.length > 0 ? (
                <>
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-3"
                      style={{ color: '#C44DFF', letterSpacing: '0.06em' }}>
                      ✦ Complete Celebration Packages
                    </p>
                  </div>
                  <div className="grid gap-4"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))' }}>
                    {bundles.map((bundle, idx) => (
                      <BundleCard key={bundle.id || idx} bundle={bundle} pet={pet} />
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState config={config} onAskMira={() => {
                  window.dispatchEvent(new CustomEvent('openMiraAI', {
                    detail: { message: `Show me celebration bundle ideas for ${petName}`, context: 'celebrate' }
                  }));
                  onClose();
                }} />
              )
            )}

            {/* ── SOUL PICKS layout ───────────────────────────────────── */}
            {category === 'soul-picks' && (
              <>
                {breedProducts.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider mb-3"
                      style={{ color: '#FF8C42', letterSpacing: '0.06em' }}>
                      ✦ Made for {petName} — {pet?.breed || 'your breed'}
                    </p>
                    <div className="grid gap-3"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))' }}>
                      {breedProducts.map((p, idx) => (
                        <BreedProductCard key={p.id || idx} product={p} pet={pet} />
                      ))}
                    </div>
                  </div>
                )}
                {products.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3"
                      style={{ color: '#C44DFF', letterSpacing: '0.06em' }}>
                      ✦ Mira's Soul Picks for {petName}
                    </p>
                    <div className="grid gap-3"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))' }}>
                      {products.slice(0, 8).map((p, idx) => (
                        <ProductCard key={p.id || idx} product={p} pillar="celebrate" selectedPet={pet} size="small" />
                      ))}
                    </div>
                  </div>
                )}
                {breedProducts.length === 0 && products.length === 0 && (
                  <EmptyState config={config} onAskMira={() => {
                    window.dispatchEvent(new CustomEvent('openMiraAI', {
                      detail: { message: `What soul picks would you recommend for ${petName}?`, context: 'celebrate' }
                    }));
                    onClose();
                  }} />
                )}
              </>
            )}

            {/* ── NORMAL CATEGORIES layout ────────────────────────────── */}
            {category !== 'bundles' && category !== 'soul-picks' && (
              <>
                {breedProducts.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: '#FF8C42', letterSpacing: '0.06em' }}>
                        ✦ {config.miraLabel}
                      </span>
                      <span className="rounded-full text-xs font-bold text-white px-2 py-0.5"
                        style={{ background: 'linear-gradient(135deg, #FF8C42, #FF6B9D)' }}>
                        For {petName}
                      </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                      {breedProducts.slice(0, 6).map((p, idx) => (
                        <div key={p.id || idx} className="flex-shrink-0" style={{ width: 160 }}>
                          <ProductCard product={p} pillar="celebrate" selectedPet={pet} size="small" />
                        </div>
                      ))}
                    </div>
                    <hr style={{ borderColor: '#F0E8E0', margin: '20px 0 16px' }} />
                  </div>
                )}

                {filteredProducts.length > 0 && (
                  <p className="text-xs font-bold uppercase tracking-wider mb-3"
                    style={{ color: '#888', letterSpacing: '0.06em' }}>
                    All {config.label} — {filteredProducts.length} items
                  </p>
                )}

                {filteredProducts.length > 0 ? (
                  <div className="grid gap-3"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))' }}>
                    {filteredProducts.map((product, idx) => (
                      <ProductCard
                        key={product.id || idx}
                        product={product}
                        pillar="celebrate"
                        selectedPet={pet}
                        size="small"
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState config={config} onAskMira={() => {
                    window.dispatchEvent(new CustomEvent('openMiraAI', {
                      detail: { message: `Show me ${config.label} for ${petName}`, context: 'celebrate' }
                    }));
                    onClose();
                  }} />
                )}
              </>
            )}

          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-5 py-4" style={{ borderTop: '1px solid #F0E8E0', background: 'white' }}>
        <button
          onClick={onClose}
          className="w-full rounded-xl font-bold text-white py-3"
          style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)', border: 'none', cursor: 'pointer', fontSize: 15 }}
        >
          Continue Shopping
        </button>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" style={{ zIndex: 55 }} onClick={onClose} />
      {/* Desktop: use flex centering wrapper so Framer Motion scale doesn't fight transform */}
      {isDesktop ? (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 56, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>{ModalContent}</div>
        </div>
      ) : (
        ModalContent
      )}
    </>
  );
};

// ── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ config, onAskMira }) => (
  <div className="flex flex-col items-center justify-center py-14 text-center px-4">
    <span className="text-5xl mb-4">{config.emoji}</span>
    <p className="text-gray-500 text-sm mb-5 max-w-xs">{config.emptyText}</p>
    <button
      onClick={onAskMira}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
      style={{ background: 'rgba(196,77,255,0.10)', border: '1px solid rgba(196,77,255,0.30)', color: '#7C3AED', cursor: 'pointer' }}
    >
      <Sparkles className="w-4 h-4" />
      Ask Mira
    </button>
  </div>
);

export default CelebrateContentModal;
