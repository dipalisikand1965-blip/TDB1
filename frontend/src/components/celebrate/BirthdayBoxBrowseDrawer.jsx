/**
 * BirthdayBoxBrowseDrawer.jsx
 * Birthday Box Browse Drawer — per BirthdayBox_BrowseDrawer_SPEC.docx
 *
 * Trigger: Secondary "Birthday Box" button on MiraBirthdayBox card.
 * Opens via custom event: openBirthdayBoxBrowse
 *
 * Features:
 * - 5 tabs: Cakes | Toys & Joy | Style | Memory | Wellness
 * - Mira's pick row at top of each tab
 * - Allergy-filtered product grid
 * - Swap tracking with undo
 * - Sticky bottom bar with build CTA
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useResizeMobile } from '../../hooks/useResizeMobile';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

/* ─────────────────────────────────────────────────────────────────
   TAB CONFIG
   ───────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'cakes',    label: 'Cakes',       emoji: '🎂', slotNumber: 1, categories: ['cakes'] },
  { id: 'toys',     label: 'Toys & Joy',  emoji: '🎁', slotNumber: 2, categories: ['toys', 'accessories'] },
  { id: 'style',    label: 'Style',       emoji: '🎀', slotNumber: 3, categories: ['accessories', 'party_accessories'] },
  { id: 'memory',   label: 'Memory',      emoji: '💌', slotNumber: 4, categories: ['memory_books', 'hampers'] },
  { id: 'wellness', label: 'Wellness',    emoji: '✨', slotNumber: 5, categories: ['supplements', 'treats'] },
];

const SLOT_LABELS = ['Hero', 'Joy', 'Style', 'Memory', 'Health', 'Surprise'];

/* ─────────────────────────────────────────────────────────────────
   PRODUCT CARD (horizontal, drawer variant)
   ───────────────────────────────────────────────────────────────── */
const ProductCard = ({ product, isMiraPick, isCurrentSwap, onSelect }) => {
  const image = product.image_url || product.image || product.images?.[0];
  const price = product.price || 0;

  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3 transition-all cursor-pointer active:scale-[0.98]"
      style={{
        background: isCurrentSwap
          ? 'rgba(196,77,255,0.18)'
          : isMiraPick
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.04)',
        border: isCurrentSwap
          ? '1.5px solid rgba(196,77,255,0.55)'
          : isMiraPick
          ? '1px solid rgba(255,161,56,0.25)'
          : '1px solid rgba(255,255,255,0.09)',
      }}
      onClick={onSelect}
      data-testid={`browse-product-${product.id || product._id}`}
    >
      {/* Image */}
      <div
        className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {isMiraPick ? '✦' : '🎁'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {isMiraPick && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(255,161,56,0.20)', color: '#fbbf24', fontSize: '10px' }}
            >
              ✦ Mira's pick
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-white leading-tight truncate">{product.name}</p>
        {price > 0 && (
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            ₹{price.toLocaleString('en-IN')}
          </p>
        )}
      </div>

      {/* Action state */}
      {isMiraPick ? (
        <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full"
          style={{ background: 'rgba(255,161,56,0.15)', color: '#fbbf24' }}>
          Current
        </span>
      ) : isCurrentSwap ? (
        <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FF2D87, #C44DFF)' }}>
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      ) : (
        <span className="flex-shrink-0 text-xs px-2 py-1 rounded-lg font-semibold transition-all hover:bg-purple-600/40"
          style={{ background: 'rgba(196,77,255,0.18)', color: '#E0AAFF', whiteSpace: 'nowrap' }}>
          Swap →
        </span>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   TAB CONTENT
   ───────────────────────────────────────────────────────────────── */
const TabContent = ({ tab, boxPreview, swaps, onSwap, allergies }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const productGridRef = useRef(null);

  // Fetch products for this tab's categories
  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const allProducts = [];
        for (const category of tab.categories) {
          const res = await fetch(`${API_BASE}/api/products?category=${category}&limit=20`);
          if (res.ok) {
            const data = await res.json();
            allProducts.push(...(data.products || data || []));
          }
        }
        if (!cancelled) setProducts(allProducts);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, [tab.id]);

  // Get Mira's pick from box preview for this tab's slot
  const miraPickSlot = [
    ...(boxPreview?.visibleSlots || []),
    ...(boxPreview?.hiddenSlots || []),
  ].find(s => s.slotNumber === tab.slotNumber);

  // Current swap for this tab
  const currentSwap = swaps[tab.id];

  // Filter products by allergy on ALL tabs (safety-first for allergic pets)
  const filteredProducts = allergies?.length > 0
    ? products.filter(p => {
        const productText = `${p.name || ''} ${p.description || ''} ${p.tags?.join(' ') || ''}`.toLowerCase();
        return !allergies.some(a => productText.includes(a.toLowerCase()));
      })
    : products;

  const selectedProductId = currentSwap?.newProduct?.id;

  return (
    <div>
      {/* Mira's pick row */}
      {miraPickSlot && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mb-3"
          style={{
            background: 'linear-gradient(135deg, rgba(255,161,56,0.12), rgba(196,77,255,0.12))',
            border: '1px solid rgba(255,161,56,0.25)',
          }}
        >
          <span className="text-xl">{miraPickSlot.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: '#fbbf24' }}>Mira's pick</p>
            <p className="text-sm font-bold text-white truncate">{miraPickSlot.itemName || miraPickSlot.chipLabel}</p>
          </div>
          {!currentSwap && (
            <button
              onClick={() => productGridRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="text-xs font-semibold flex-shrink-0"
              style={{ color: '#C44DFF' }}
            >
              Swap →
            </button>
          )}
          {currentSwap && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(196,77,255,0.20)', color: '#E0AAFF' }}
            >
              Swapped
            </span>
          )}
        </div>
      )}

      {/* Allergy banner (wellness + whenever allergies exist) */}
      {allergies?.length > 0 && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
          style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.22)' }}
        >
          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#86efac' }} />
          <p className="text-xs" style={{ color: '#86efac' }}>
            Filtered for {boxPreview?.petName || 'your pet'}: no <strong>{allergies.join(', ')}</strong>
          </p>
        </div>
      )}

      {/* Product grid */}
      <div ref={productGridRef} className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              No products found after allergy filtering.
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(196,77,255,0.70)' }}>
              Ask the Concierge to find something safe.
            </p>
          </div>
        ) : (
          filteredProducts.map((product, i) => {
            const productId = product.id || product._id;
            const swappedId = currentSwap?.newProduct?.id || currentSwap?.newProduct?._id;
            const isMiraPick = i === 0; // First product in list is Mira's pick
            const isCurrentSwap = !!swappedId && (productId === swappedId);

            return (
              <ProductCard
                key={productId || i}
                product={product}
                isMiraPick={isMiraPick && !currentSwap}
                isCurrentSwap={isCurrentSwap}
                onSelect={() => {
                  if (isMiraPick && !currentSwap) {
                    // Clicking Mira's pick when no swap — scroll to other options
                    productGridRef.current?.children?.[1]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    return;
                  }
                  // If clicking the already-swapped item, undo
                  if (isCurrentSwap) {
                    onSwap(tab.id, null); // null = undo
                    return;
                  }
                  // Swap with this product
                  onSwap(tab.id, {
                    slotNumber: tab.slotNumber,
                    originalItem: miraPickSlot,
                    newProduct: product,
                  });
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SWAP PILLS (below Mira bar)
   ───────────────────────────────────────────────────────────────── */
const SwapPills = ({ swaps, onUndo }) => {
  const swapEntries = Object.entries(swaps);
  if (swapEntries.length === 0) return null;

  return (
    <div className="px-4 py-2 flex flex-wrap gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      {swapEntries.map(([tabId, swap]) => {
        const tab = TABS.find(t => t.id === tabId);
        return (
          <div
            key={tabId}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ background: 'rgba(196,77,255,0.18)', border: '1px solid rgba(196,77,255,0.35)', fontSize: '12px', color: '#E0AAFF' }}
          >
            <span>🔄</span>
            <span>
              {tab?.emoji} {swap.originalItem?.chipLabel?.split(',')[0] || 'Item'} → {swap.newProduct?.name?.split(' ').slice(0, 3).join(' ')}
            </span>
            <button
              onClick={() => onUndo(tabId)}
              className="ml-1 text-xs hover:text-white transition-colors"
              style={{ color: 'rgba(196,77,255,0.70)' }}
              data-testid={`undo-swap-${tabId}`}
            >
              Undo
            </button>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   BOTTOM BAR
   ───────────────────────────────────────────────────────────────── */
const BottomBar = ({ swapCount, petName, onBuild }) => {
  const hasSwaps = swapCount > 0;

  return (
    <div
      className="sticky bottom-0 flex items-center justify-between px-4 py-3 gap-3"
      style={{
        background: 'linear-gradient(135deg, #2D0050, #6B0099, #C44DFF)',
        borderTop: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <div>
        <p className="text-xs font-semibold text-white">
          {hasSwaps ? `${swapCount} swap${swapCount > 1 ? 's' : ''} made` : "Mira's picks are loaded"}
        </p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {hasSwaps ? 'Your custom box is ready' : `✦ Everything personalised for ${petName}`}
        </p>
      </div>
      <button
        onClick={onBuild}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold text-sm transition-all whitespace-nowrap"
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1.5px solid rgba(255,255,255,0.35)',
          color: '#fff',
          boxShadow: hasSwaps ? '0 0 20px rgba(255,45,135,0.50)' : 'none',
        }}
        data-testid="browse-drawer-build-btn"
      >
        Build {petName}'s Box
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────── */
const BirthdayBoxBrowseDrawer = ({ onOpenBuilder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [boxPreview, setBoxPreview] = useState(null);
  const [petName, setPetName] = useState('');
  const [activeTab, setActiveTab] = useState('cakes');
  const [swaps, setSwaps] = useState({}); // { tabId: { slotNumber, originalItem, newProduct } }

  // Platform-standard mobile detection — ResizeObserver on document.body
  const isMobile = useResizeMobile();

  // Listen for open event
  useEffect(() => {
    const handleOpen = (e) => {
      const { boxPreview: preview, petName: name } = e.detail || {};
      setBoxPreview(preview);
      setPetName(name || 'your pet');
      setActiveTab('cakes');
      setSwaps({});
      setIsOpen(true);
    };

    window.addEventListener('openBirthdayBoxBrowse', handleOpen);
    return () => window.removeEventListener('openBirthdayBoxBrowse', handleOpen);
  }, []);

  const handleClose = useCallback(() => setIsOpen(false), []);

  const handleSwap = useCallback((tabId, swapData) => {
    if (!swapData) {
      // null = undo swap
      setSwaps(prev => {
        const next = { ...prev };
        delete next[tabId];
        return next;
      });
      const tab = TABS.find(t => t.id === tabId);
      toast.info(`Mira's pick restored for ${tab?.label || tabId}`, { duration: 2000 });
      return;
    }
    setSwaps(prev => ({ ...prev, [tabId]: swapData }));
    toast.success(`Swapped for ${swapData.newProduct?.name}`, { duration: 2000 });
  }, []);

  const handleUndo = useCallback((tabId) => {
    setSwaps(prev => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    const tab = TABS.find(t => t.id === tabId);
    toast.info(`Mira's pick restored for ${tab?.label || tabId}`, { duration: 2000 });
  }, []);

  const handleBuild = useCallback(() => {
    // Merge swaps into boxPreview before opening builder
    const updatedPreview = boxPreview ? { ...boxPreview } : null;
    handleClose();
    // Short delay so drawer closes before builder opens
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openOccasionBoxBuilder', {
        detail: {
          preset: updatedPreview,
          petName,
          swaps,
        },
      }));
    }, 320);
  }, [boxPreview, petName, swaps, handleClose]);

  const swapCount = Object.keys(swaps).length;
  const allergies = boxPreview?.allergies || [];

  const drawerContent = (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 9198,
              background: 'rgba(10,0,26,0.80)',
              backdropFilter: 'blur(4px)',
            }}
            data-testid="browse-drawer-backdrop"
          />
        )}
      </AnimatePresence>

      {/* Centered modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="drawer-panel"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            data-testid="birthday-box-browse-drawer"
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 9199,
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'center',
              padding: isMobile ? '110px 12px 80px' : '16px',
              pointerEvents: 'none',
              overflowY: isMobile ? 'auto' : 'visible',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '560px',
                maxHeight: isMobile ? 'none' : '88vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, #1A0030 0%, #0D001A 100%)',
                border: '1px solid rgba(196,77,255,0.30)',
                boxShadow: '0 8px 64px rgba(196,77,255,0.25)',
                pointerEvents: 'all',
              }}
            >
            {/* Header */}
            <div
              className="flex-shrink-0 px-5 pt-5 pb-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(135deg, #1A0030, #3D0060)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎂</span>
                  <h2 className="text-base font-bold text-white">Birthday Box</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                  data-testid="browse-drawer-close-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                For {petName} — browse and swap Mira's picks
              </p>

              {/* Mira bar */}
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 mt-3"
                style={{ background: 'rgba(196,77,255,0.12)', border: '1px solid rgba(196,77,255,0.22)' }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: '#C44DFF',
                    boxShadow: '0 0 8px rgba(196,77,255,0.80)',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                />
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {swapCount > 0
                    ? `${swapCount} swap${swapCount > 1 ? 's' : ''} from Mira's default — everything allergy-safe`
                    : `Mira's picks loaded — everything personalised for ${petName}`}
                </p>
              </div>
            </div>

            {/* Swap pills */}
            <SwapPills swaps={swaps} onUndo={handleUndo} />

            {/* Tabs */}
            <div
              className="flex-shrink-0 flex overflow-x-auto gap-1 px-4 py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-sm font-semibold transition-all flex-shrink-0"
                  style={{
                    background: activeTab === tab.id
                      ? 'linear-gradient(135deg, #FF2D87, #C44DFF)'
                      : 'rgba(255,255,255,0.07)',
                    color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.55)',
                    border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    position: 'relative',
                  }}
                  data-testid={`browse-tab-${tab.id}`}
                >
                  {tab.emoji} {tab.label}
                  {swaps[tab.id] && (
                    <span
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                      style={{ background: '#FF2D87' }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <AnimatePresence mode="wait">
                {TABS.map(tab =>
                  activeTab === tab.id ? (
                    <motion.div
                      key={tab.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.20 }}
                    >
                      <TabContent
                        tab={tab}
                        boxPreview={boxPreview}
                        swaps={swaps}
                        onSwap={handleSwap}
                        allergies={allergies}
                      />
                    </motion.div>
                  ) : null
                )}
              </AnimatePresence>
            </div>

            {/* Bottom bar */}
            <BottomBar
              swapCount={swapCount}
              petName={petName}
              onBuild={handleBuild}
            />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse animation keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(drawerContent, document.body)
    : null;
};

export default BirthdayBoxBrowseDrawer;
