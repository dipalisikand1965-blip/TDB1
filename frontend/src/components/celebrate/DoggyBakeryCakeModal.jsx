/**
 * DoggyBakeryCakeModal.jsx — Birthday Cakes Browse (The Doggy Bakery)
 * Row 1: Breed match — active pet's breed cake shown with "Made for [breed]" badge
 * Row 2: Shape chips (All · Circle · Bone · Heart · Square · Star · Paw) + "Other Breeds ▾"
 * Row 3: Filtered grid, 12 per page, Load More
 * Soul Made: wired to SoulMadeModal (createPortal — no z-index trap)
 * Order flow: View Details → ProductDetailModal → ticket (existing)
 *
 * Triggered via:
 *   - openBirthdayBoxBrowse custom event
 *   - <DoggyBakeryCakeModal pet={...} onClose={...} /> prop-based
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ProductDetailModal from './ProductDetailModal';
import SoulMadeModal from '../SoulMadeModal';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const PAGE_SIZE = 12;

// Shape chips config — matches DB tags
const SHAPE_CHIPS = [
  { id: 'all',    label: 'All' },
  { id: 'Circle', label: 'Circle' },
  { id: 'Bone',   label: 'Bone' },
  { id: 'Heart',  label: 'Heart' },
  { id: 'Square', label: 'Square' },
  { id: 'Star',   label: 'Star' },
  { id: 'Paw',    label: 'Paw' },
];

function validImg(url) {
  return url && typeof url === 'string' && url.startsWith('http');
}

function CakeCard({ product, onView }) {
  const img = product.cloudinary_url || product.image_url || product.image || product.images?.[0];
  const price = product.original_price || product.price || 0;
  return (
    <div
      data-testid={`cake-card-${product.id}`}
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #F0EAF8',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(155,89,182,0.15)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ aspectRatio: '1/1', background: '#FAF6FF', overflow: 'hidden', position: 'relative' }}>
        {validImg(img)
          ? <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎂</div>
        }
        {product._breedMatch && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: 'linear-gradient(135deg,#9B59B6,#6C3483)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
            Made for {product._breedLabel}
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1208', marginBottom: 4, lineHeight: 1.3 }}>{product.name}</div>
        {price > 0 && <div style={{ fontSize: 13, fontWeight: 700, color: '#6C3483', marginBottom: 8 }}>From ₹{price.toLocaleString('en-IN')}</div>}
        <button
          onClick={() => onView(product)}
          data-testid={`view-details-${product.id}`}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 999,
            background: 'linear-gradient(135deg,#E8D5F5,#F0E6FF)',
            color: '#6C3483', fontSize: 12, fontWeight: 700,
            border: '1px solid #D4B8F0', cursor: 'pointer',
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

export default function DoggyBakeryCakeModal({ pet: petProp, onClose: onCloseProp }) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(!!petProp);
  const [pet, setPet] = useState(petProp || null);

  // Data
  const [cakes, setCakes] = useState([]);       // all 185 birthday cakes
  const [breedCakes, setBreedCakes] = useState([]); // all 46 breed cakes
  const [loading, setLoading] = useState(false);

  // Filters
  const [shape, setShape] = useState('all');
  const [breedFilter, setBreedFilter] = useState(null); // null = off, string = selected breed
  const [breedDropdownOpen, setBreedDropdownOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);

  const petName = pet?.name || 'your dog';
  const petBreed = (pet?.breed || '').toLowerCase();

  // ── Listen for custom event (replaces BirthdayBoxBrowseDrawer trigger) ──────
  useEffect(() => {
    const handler = (e) => {
      const { pet: petObj, petName: name, petBreed: breed } = e.detail || {};
      setPet(petObj || (name ? { name, breed } : null));
      setShape('all');
      setBreedFilter(null);
      setPage(1);
      setIsOpen(true);
    };
    window.addEventListener('openBirthdayBoxBrowse', handler);
    return () => window.removeEventListener('openBirthdayBoxBrowse', handler);
  }, []);

  // ── Fetch cakes on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/products?category=cakes&limit=200`, { headers })
        .then(r => r.json()).then(d => Array.isArray(d) ? d : d.products || d.data || []),
      fetch(`${API_URL}/api/products?category=breed-cakes&limit=100`, { headers })
        .then(r => r.json()).then(d => Array.isArray(d) ? d : d.products || d.data || []),
    ])
      .then(([c, b]) => { setCakes(c); setBreedCakes(b); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, token]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onCloseProp?.();
  }, [onCloseProp]);

  // ── Breed match row ───────────────────────────────────────────────────────
  const matchedBreedCakes = breedCakes.filter(p => {
    if (!petBreed) return false;
    const tags = (p.tags || []).map(t => String(t).toLowerCase());
    const name = (p.name || '').toLowerCase();
    return tags.some(t => t.includes(petBreed) || petBreed.includes(t.replace(' cake','').trim())) ||
      name.includes(petBreed);
  }).map(p => ({ ...p, _breedMatch: true, _breedLabel: pet?.breed || petBreed }));

  // ── All available breed names from breed-cakes ───────────────────────────
  const allBreedNames = [...new Set(
    breedCakes.flatMap(p =>
      (p.tags || []).filter(t => {
        const tl = String(t).toLowerCase();
        return !['birthdays','cakes','breed','circle'].includes(tl) && tl.length > 3;
      })
    ).map(t => String(t).replace(/ cake$/i, '').replace(/ cakes$/i, '').trim())
  )].filter(Boolean).sort();

  // ── Filtered grid ─────────────────────────────────────────────────────────
  let gridCakes = breedFilter
    ? breedCakes.filter(p => {
        const tags = (p.tags || []).map(t => String(t).toLowerCase());
        const name = (p.name || '').toLowerCase();
        const bf = breedFilter.toLowerCase();
        return tags.some(t => t.includes(bf)) || name.includes(bf);
      })
    : cakes;

  if (shape !== 'all') {
    gridCakes = gridCakes.filter(p =>
      (p.tags || []).some(t => String(t).toLowerCase() === shape.toLowerCase())
    );
  }

  const totalVisible = page * PAGE_SIZE;
  const visibleCakes = gridCakes.slice(0, totalVisible);
  const hasMore = totalVisible < gridCakes.length;

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9200 }}
      />

      {/* Modal */}
      <div
        data-testid="doggy-bakery-cake-modal"
        style={{
          position: 'fixed', inset: 0, zIndex: 9201,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', pointerEvents: 'none',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 620,
            maxHeight: '90vh', overflowY: 'auto',
            background: '#FFFBFF', borderRadius: 20,
            boxShadow: '0 24px 80px rgba(155,89,182,0.25)',
            pointerEvents: 'all',
          }}
        >
          {/* Header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 2,
            background: '#FFFBFF', borderBottom: '1px solid #F5EEF8',
            padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>🎂</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#1A1208' }}>Birthday Cakes</span>
              </div>
              <div style={{ fontSize: 13, color: '#9B59B6', fontWeight: 600, marginTop: 2 }}>
                For <span style={{ color: '#6C3483' }}>{petName}</span>
              </div>
            </div>
            <button onClick={handleClose} data-testid="cake-modal-close"
              style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F5EEF8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="#6C3483" />
            </button>
          </div>

          <div style={{ padding: '16px 20px 32px' }}>

            {/* ── Soul Made™ card ───────────────────────────────────────── */}
            <div
              onClick={() => setSoulMadeOpen(true)}
              data-testid="soul-made-cta"
              style={{
                background: 'linear-gradient(135deg,#1A0A2E,#3D1260)',
                borderRadius: 14, padding: '18px 20px', marginBottom: 20,
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(233,30,140,0.2) 0%,transparent 70%)' }} />
              <div style={{ fontSize: 12, letterSpacing: '0.12em', color: 'rgba(233,30,140,0.9)', fontWeight: 700, marginBottom: 8 }}>
                ✦ SOUL MADE™ · MADE ONLY FOR {petName.toUpperCase()}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>
                {petName}'s face. On everything.
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>
                Bandana · Portrait Frame · Party Hat · Cake Topper · Tote · and more
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12, fontStyle: 'italic' }}>
                Upload a photo · Concierge® creates it
              </div>
              <button style={{
                background: 'linear-gradient(135deg,#C44DFF,#FF2D87)', color: '#fff',
                border: 'none', borderRadius: 999, padding: '10px 20px', fontSize: 13,
                fontWeight: 700, cursor: 'pointer',
              }}>
                ✦ Make something only {petName} has
              </button>
            </div>

            {/* ── Row 1: Breed match ────────────────────────────────────── */}
            {matchedBreedCakes.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9B59B6', marginBottom: 10 }}>
                  YOUR BREED · {(pet?.breed || petBreed).toUpperCase()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  {matchedBreedCakes.slice(0, 4).map(p => (
                    <CakeCard key={p.id} product={p} onView={setSelectedProduct} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Row 2: Shape chips + Other Breeds ────────────────────── */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {SHAPE_CHIPS.map(chip => (
                <button
                  key={chip.id}
                  onClick={() => { setShape(chip.id); setBreedFilter(null); setPage(1); }}
                  data-testid={`shape-chip-${chip.id}`}
                  style={{
                    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: shape === chip.id && !breedFilter ? '#9B59B6' : '#F5EEF8',
                    color: shape === chip.id && !breedFilter ? '#fff' : '#6C3483',
                    border: `1.5px solid ${shape === chip.id && !breedFilter ? '#9B59B6' : '#D4B8F0'}`,
                  }}
                >
                  {chip.label}
                </button>
              ))}

              {/* Other Breeds dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setBreedDropdownOpen(v => !v)}
                  data-testid="other-breeds-btn"
                  style={{
                    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    background: breedFilter ? '#9B59B6' : '#F5EEF8',
                    color: breedFilter ? '#fff' : '#6C3483',
                    border: `1.5px solid ${breedFilter ? '#9B59B6' : '#D4B8F0'}`,
                  }}
                >
                  {breedFilter ? breedFilter : 'Other Breeds'}
                  {breedDropdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {breedDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '110%', left: 0, zIndex: 10,
                    background: '#fff', border: '1px solid #D4B8F0', borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(155,89,182,0.2)',
                    minWidth: 180, maxHeight: 220, overflowY: 'auto', padding: '6px 0',
                  }}>
                    {breedFilter && (
                      <button onClick={() => { setBreedFilter(null); setShape('all'); setBreedDropdownOpen(false); setPage(1); }}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#C44DFF', background: 'none', border: 'none', cursor: 'pointer' }}>
                        ✕ Clear breed filter
                      </button>
                    )}
                    {allBreedNames.map(breed => (
                      <button key={breed}
                        onClick={() => { setBreedFilter(breed); setShape('all'); setBreedDropdownOpen(false); setPage(1); }}
                        data-testid={`breed-option-${breed}`}
                        style={{
                          width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13,
                          color: breedFilter === breed ? '#9B59B6' : '#1A1208', fontWeight: breedFilter === breed ? 700 : 400,
                          background: breedFilter === breed ? '#F5EEF8' : 'none', border: 'none', cursor: 'pointer',
                        }}
                      >
                        {breed}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Row 3: Grid + Load More ───────────────────────────────── */}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9B59B6', marginBottom: 12 }}>
              {breedFilter ? `${breedFilter.toUpperCase()} CAKES` : shape !== 'all' ? `${shape.toUpperCase()} CAKES` : 'ALL BIRTHDAY CAKES'}
              <span style={{ fontWeight: 400, color: '#B8A0CC', marginLeft: 6 }}>({gridCakes.length})</span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9B59B6', fontSize: 14 }}>Loading cakes…</div>
            ) : visibleCakes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#B8A0CC', fontSize: 14 }}>
                No cakes found for this filter.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  {visibleCakes.map(p => (
                    <CakeCard key={p.id} product={p} onView={setSelectedProduct} />
                  ))}
                </div>

                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button
                      onClick={() => setPage(v => v + 1)}
                      data-testid="load-more-cakes"
                      style={{
                        padding: '10px 28px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                        background: 'linear-gradient(135deg,#9B59B6,#6C3483)', color: '#fff',
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      Load more — {gridCakes.length - totalVisible} more cakes
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Footer ────────────────────────────────────────────────── */}
            <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#B8A0CC' }}>
              ✦ Everything here is personalised for <strong style={{ color: '#6C3483' }}>{petName}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ProductDetailModal — existing order flow */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          petName={petName}
          pillarColor="#9B59B6"
        />
      )}

      {/* SoulMadeModal — via createPortal to escape any stacking context */}
      {soulMadeOpen && createPortal(
        <SoulMadeModal
          pet={pet}
          pillar="celebrate"
          pillarColor="#A855F7"
          pillarLabel="Celebration"
          onClose={() => setSoulMadeOpen(false)}
        />,
        document.body
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}
