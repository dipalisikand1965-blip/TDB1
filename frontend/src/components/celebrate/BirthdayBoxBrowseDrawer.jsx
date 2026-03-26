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
import { X, ChevronRight, RotateCcw, ShieldCheck, Sparkles, Edit2, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useResizeMobile } from '../../hooks/useResizeMobile';
import { filterBreedProducts } from '../../hooks/useMiraFilter';
import ProductBoxEditor from '../admin/ProductBoxEditor';
import MiraEmptyRequest from '../common/MiraEmptyRequest';

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
   SOUL PRODUCT CARD — admin-style grid card with AI mockup image
   ───────────────────────────────────────────────────────────────── */
const SoulCard = ({ product, isMiraPick, isCurrentSwap, onSelect, onEdit }) => {
  const validImg = (url) => url && url.startsWith('http') && !url.includes('emergentagent.com');
  const image = validImg(product.watercolor_image) ? product.watercolor_image
    : validImg(product.cloudinary_url) ? product.cloudinary_url
    : validImg(product.mockup_url) ? product.mockup_url
    : validImg(product.primary_image) ? product.primary_image
    : validImg(product.image_url) ? product.image_url
    : null;
  const productType = product.product_type || product.sub_category || product.type || 'Soul Made';
  const price = product.price || 0;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        background: isCurrentSwap ? 'rgba(196,77,255,0.14)' : 'rgba(255,255,255,0.06)',
        border: isCurrentSwap ? '1.5px solid rgba(196,77,255,0.55)' : '1px solid rgba(255,255,255,0.10)',
        transition: 'border 0.15s, background 0.15s',
      }}
      data-testid={`soul-card-${product.id || product._id}`}
    >
      {/* Square image — click to open ProductBoxEditor */}
      <div
        style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.04)', position: 'relative', cursor: 'pointer' }}
        onClick={() => onEdit && onEdit(product)}
      >
        {image ? (
          <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.20)' }} />
          </div>
        )}
        {/* Badges */}
        {isMiraPick && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(255,161,56,0.92)', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
            ✦ Mira
          </div>
        )}
        {isCurrentSwap && (
          <div style={{ position: 'absolute', top: 6, right: 6, background: 'linear-gradient(135deg, #FF2D87, #C44DFF)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>
          </div>
        )}
        {/* Swap icon overlay — tap to change this item */}
        <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Edit2 style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.70)' }} />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>Swap</span>
        </div>
      </div>

      {/* Card info */}
      <div style={{ padding: '8px 10px' }}>
        <div style={{ background: isCurrentSwap ? 'rgba(196,77,255,0.30)' : 'rgba(196,77,255,0.16)', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600, color: '#E0AAFF', display: 'inline-block', marginBottom: 4 }}>
          {productType}
        </div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </p>
        {product.breed && (
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '1px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.breed}
          </p>
        )}
        {price > 0 && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0 0' }}>₹{price.toLocaleString('en-IN')}</p>
        )}
        {/* Swap button */}
        <button
          onClick={() => onSelect(product)}
          style={{
            marginTop: 6, width: '100%', padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: isCurrentSwap ? 'rgba(196,77,255,0.25)' : 'rgba(255,255,255,0.08)',
            border: isCurrentSwap ? '1px solid rgba(196,77,255,0.40)' : '1px solid rgba(255,255,255,0.15)',
            color: isCurrentSwap ? '#E0AAFF' : 'rgba(255,255,255,0.70)',
            cursor: 'pointer', textAlign: 'center',
          }}
          data-testid={`swap-btn-${product.id || product._id}`}
        >
          {isCurrentSwap ? '✓ Swapped — tap to undo' : '⇄ Swap into box'}
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   TAB CONTENT — 2-col grid with admin-style soul product cards
   ───────────────────────────────────────────────────────────────── */
const TabContent = ({ tab, boxPreview, swaps, onSwap, allergies, petBreed, pet, onEditProduct, onConciergeRequest }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let allProducts = [];

        // Primary: fetch breed-matched products (ALWAYS include breed param — never show random breeds)
        if (petBreed) {
          const res = await fetch(`${API_BASE}/api/mockups/breed-products?breed=${encodeURIComponent(petBreed)}&limit=40`);
          if (res.ok) {
            const data = await res.json();
            allProducts = data.products || data || [];
          }
        }
        // No-breed fallback removed: never show random breed products.
        // If petBreed has no match, allProducts stays empty — universal products from masterProducts below are shown instead.

        // Also fetch from products_master filtered by tab categories
        // This ensures we show the right category products
        const masterProducts = [];
        for (const cat of tab.categories) {
          try {
            // Use 'category' param (not sub_category — the API doesn't read sub_category)
            const r = await fetch(`${API_BASE}/api/admin/pillar-products?pillar=celebrate&category=${encodeURIComponent(cat)}&limit=20`);
            if (r.ok) {
              const d = await r.json();
              masterProducts.push(...(d.products || []));
            }
          } catch { /* skip */ }
        }

        // ALWAYS apply breed filter — even when petBreed is '' (empty breed still
        // excludes products whose NAME contains a different breed, e.g. "Akita Wall Art")
        const breedFilteredMaster = filterBreedProducts(masterProducts, petBreed);
        // Also filter the breed-API results (safety net — data can have edge cases)
        const breedFilteredAll = filterBreedProducts(allProducts, petBreed);
        const merged = [...breedFilteredMaster, ...breedFilteredAll];
        // Deduplicate by id
        const seen = new Set();
        const deduped = merged.filter(p => {
          const pid = p.id || p._id;
          if (seen.has(pid)) return false;
          seen.add(pid);
          return true;
        });

        if (!cancelled) setProducts(deduped);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, [tab.id, petBreed]);

  // Get Mira's pick from box preview for this tab's slot
  const miraPickSlot = [
    ...(boxPreview?.visibleSlots || []),
    ...(boxPreview?.hiddenSlots || []),
  ].find(s => s.slotNumber === tab.slotNumber);

  // Current swap for this tab
  const currentSwap = swaps[tab.id];
  const selectedProductId = currentSwap?.newProduct?.id || currentSwap?.newProduct?._id;

  // Filter products by allergy (safety-first, skip single-char noise)
  const cleanAllergies = (allergies || []).filter(a => typeof a === 'string' && a.trim().length > 2);
  const filteredProducts = cleanAllergies.length > 0
    ? products.filter(p => {
        const text = `${p.name || ''} ${p.description || ''} ${p.tags?.join(' ') || ''}`.toLowerCase();
        return !cleanAllergies.some(a => text.includes(a.toLowerCase()));
      })
    : products;

  return (
    <div>
      {/* ── Featured Breed Cake row (cakes tab only) ── */}
      {tab.id === 'cakes' && petBreed && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mb-3"
          style={{
            background: 'linear-gradient(135deg, rgba(155,89,182,0.18), rgba(196,77,255,0.12))',
            border: '1px solid rgba(196,77,255,0.35)',
          }}
          data-testid="featured-breed-cake-row"
        >
          <span style={{ fontSize: 24 }}>🎂</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: '#E0AAFF' }}>
              The Doggy Bakery™ — Made for {pet?.name || 'your dog'}
            </p>
            <p className="text-sm font-semibold text-white truncate">
              {petBreed} Birthday Cake
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>
              Custom breed cake · Ingredients cleared for dogs
            </p>
          </div>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openDoggyBakeryCakeModal', {
                detail: { petBreed, petName: pet?.name || 'your dog', pet }
              }));
            }}
            style={{
              flexShrink: 0, background: 'linear-gradient(135deg, #9B59B6, #C44DFF)',
              border: 'none', borderRadius: 20, padding: '6px 14px',
              fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Choose Cake →
          </button>
        </div>
      )}
      {/* Mira's pick slot banner */}
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
            <p className="text-xs font-semibold" style={{ color: '#fbbf24' }}>Mira's pick for this slot</p>
            <p className="text-sm font-bold text-white truncate">{miraPickSlot.itemName || miraPickSlot.chipLabel}</p>
          </div>
          {currentSwap && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(196,77,255,0.20)', color: '#E0AAFF' }}>
              Swapped
            </span>
          )}
        </div>
      )}

      {/* Allergy banner */}
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

      {/* 2-column grid (admin-style soul cards) */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl animate-pulse" style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <MiraEmptyRequest
          pet={pet}
          pillar="celebrate"
          categoryName={tab.label}
          accentColor="#9B59B6"
          darkMode={true}
          onRequest={onConciergeRequest}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product, i) => {
            const productId = product.id || product._id;
            const swappedId = currentSwap?.newProduct?.id || currentSwap?.newProduct?._id;
            const isMiraPick = i === 0 && !currentSwap;
            const isCurrentSwap = !!swappedId && (productId === swappedId);

            return (
              <SoulCard
                key={productId || i}
                product={product}
                isMiraPick={isMiraPick}
                isCurrentSwap={isCurrentSwap}
                onEdit={onEditProduct}
                onSelect={() => {
                  if (isCurrentSwap) {
                    onSwap(tab.id, null);
                    return;
                  }
                  onSwap(tab.id, {
                    slotNumber: tab.slotNumber,
                    originalItem: miraPickSlot,
                    newProduct: product,
                  });
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── All Breed Cakes — shown at bottom of Cakes tab only ── */}
      {tab.id === 'cakes' && (
        <AllBreedCakesSection
          petBreed={petBreed}
          petName={pet?.name}
          apiBase={API_BASE}
          onSelect={(product) => {
            onSwap(tab.id, {
              slotNumber: tab.slotNumber,
              originalItem: miraPickSlot,
              newProduct: product,
            });
          }}
          onEdit={onEditProduct}
        />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   ALL BREED CAKES SECTION — shows AFTER main cakes grid
   ───────────────────────────────────────────────────────────────── */
const AllBreedCakesSection = ({ apiBase, onSelect, onEdit }) => {
  const [breedCakes, setBreedCakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchCakes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/mockups/breed-products?category=breed-cakes&limit=60`);
        if (res.ok) {
          const d = await res.json();
          if (!cancelled) setBreedCakes(d.products || d || []);
        }
      } catch { /* skip */ } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCakes();
    return () => { cancelled = true; };
  }, [apiBase]);

  if (!loading && !breedCakes.length) return null;
  const cakesToShow = expanded ? breedCakes : breedCakes.slice(0, 4);

  return (
    <div className="mt-5" data-testid="all-breed-cakes-section">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
          All Breed Cakes{breedCakes.length > 0 ? ` · ${breedCakes.length}` : ''}
        </p>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl animate-pulse" style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {cakesToShow.map((product) => (
              <SoulCard
                key={product.id || product._id}
                product={product}
                isMiraPick={false}
                isCurrentSwap={false}
                onEdit={onEdit}
                onSelect={() => onSelect(product)}
              />
            ))}
          </div>
          {breedCakes.length > 4 && (
            <button
              onClick={() => setExpanded(x => !x)}
              className="w-full mt-3 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.60)' }}
            >
              {expanded ? 'Show less' : `Show all ${breedCakes.length} breed cakes`}
            </button>
          )}
        </>
      )}
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
const BirthdayBoxBrowseDrawer = ({ onOpenBuilder, onConciergeRequest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [boxPreview, setBoxPreview] = useState(null);
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [pet, setPet] = useState(null);
  const [activeTab, setActiveTab] = useState('cakes');
  const [swaps, setSwaps] = useState({}); // { tabId: { slotNumber, originalItem, newProduct } }
  const [editingProduct, setEditingProduct] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Platform-standard mobile detection — ResizeObserver on document.body
  const isMobile = useResizeMobile();

  // Listen for open event
  useEffect(() => {
    const handleOpen = (e) => {
      const { boxPreview: preview, petName: name, petBreed: breed, pet: petObj } = e.detail || {};
      setBoxPreview(preview);
      setPetName(name || 'your pet');
      setPetBreed(breed || '');
      setPet(petObj || null);
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
    // Merge swaps into visibleSlots so BirthdayBoxBuilder sees the actual swapped items
    const mergeSwapsIntoSlots = (slots) =>
      (slots || []).map(slot => {
        const tab = TABS.find(t => t.slotNumber === slot.slotNumber);
        const swap = tab ? swaps[tab.id] : null;
        if (!swap) return slot;
        return {
          ...slot,
          itemName: swap.newProduct.name,
          chipLabel: swap.newProduct.name,
          emoji: swap.newProduct.emoji || '🔄',
          description: swap.newProduct.description || '',
          isSwapped: true,
          swappedProductId: swap.newProduct.id || swap.newProduct._id,
        };
      });

    const updatedPreview = boxPreview
      ? {
          ...boxPreview,
          visibleSlots: mergeSwapsIntoSlots(boxPreview.visibleSlots),
          hiddenSlots: mergeSwapsIntoSlots(boxPreview.hiddenSlots),
        }
      : null;

    handleClose();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openOccasionBoxBuilder', {
        detail: {
          preset: updatedPreview,
          petName,
          petBreed,
          swaps,
        },
      }));
    }, 320);
  }, [boxPreview, petName, petBreed, swaps, handleClose]);

  const swapCount = Object.keys(swaps).length;
  const allergies = boxPreview?.allergies || [];

  const handleEditProduct = useCallback((product) => {
    setEditingProduct({ ...product, id: product.id || product._id, collection: 'breed_products' });
    setEditModalOpen(true);
  }, []);

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
                        petBreed={petBreed}
                        pet={pet}
                        onEditProduct={handleEditProduct}
                        onConciergeRequest={onConciergeRequest}
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

  return (
    <>
      {typeof document !== 'undefined' && createPortal(drawerContent, document.body)}
      {/* ProductBoxEditor — full-tabbed product editor with Media + AI generation */}
      {editModalOpen && editingProduct && (
        <ProductBoxEditor
          product={editingProduct}
          open={editModalOpen}
          onClose={() => { setEditModalOpen(false); setEditingProduct(null); }}
          onSave={() => { setEditModalOpen(false); setEditingProduct(null); toast.success('Product saved!'); }}
        />
      )}
    </>
  );
};

export default BirthdayBoxBrowseDrawer;
