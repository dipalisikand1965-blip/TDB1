/**
 * ShopMobilePage.jsx — /shop (mobile)
 * Full desktop parity: Category Strip, Mira Picks, Breed Collection, Bakery, Browse
 * Colour: Gold #4A2800 → #C9973A
 */
import PillarConciergeCards from '../components/common/PillarConciergeCards';
import ConciergeRequestBuilder from '../components/services/ConciergeRequestBuilder';
import AmazonExplorerBox from '../components/shop/AmazonExplorerBox';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import { tdc } from '../utils/tdc_intent';
import { API_URL } from '../utils/api';
import { applyMiraFilter, filterBreedProducts, KNOWN_BREEDS, excludeCakeProducts, getAllergiesFromPet } from '../hooks/useMiraFilter';
import PillarPageLayout from '../components/PillarPageLayout';
import SoulMadeModal from '../components/SoulMadeModal';
import PillarSoulProfile from '../components/PillarSoulProfile';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import MiraPlanModal from '../components/mira/MiraPlanModal';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
import PillarHero from '../components/PillarHero';
import '../styles/mobile-design-system.css';

const S = { gold:'#4A2800', goldL:'#C9973A', goldXL:'#E8B84B', cream:'#FFFBF5', border:'#F5E6C8', dark:'#1A0E00', taupe:'#7A6A4A' };
const G = { deep:"#3D1F00", mid:"#7B3F00", gold:"#C9973A", amber:"#F59E0B", pale:"#FFF8E7", cream:"#FFFBF2", darkText:"#3D1F00", mutedText:"#92400E", border:"rgba(201,151,58,0.20)", borderLight:"rgba(201,151,58,0.12)" };

const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.shop{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif;background:${S.cream};color:${S.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.shop-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${S.gold},${S.goldL});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.shop-cta:active{transform:scale(0.97)}
.no-sb{overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}.no-sb::-webkit-scrollbar{display:none}`;

function vibe(t = 'light') { if (navigator?.vibrate) navigator.vibrate(t === 'success' ? [8, 40, 10] : t === 'medium' ? [12] : [6]); }

function getBreed(pet) { return (pet?.breed || pet?.doggy_soul_answers?.breed || '').toLowerCase().trim(); }

// ── Shop Category Strip — exact parity with desktop ShopSoulPage.jsx ──────────
const SHOP_CATS = [
  { id: 'mira',    icon: '✦',  label: "Mira's Picks" },
  { id: 'bakery',  icon: '🎂', label: 'The Doggy Bakery' },
  { id: 'breed',   icon: '🐾', label: 'Breed Collection' },
  { id: 'treats',  icon: '🍖', label: 'Treats' },
  { id: 'hampers', icon: '🎁', label: 'Hampers & Gifts' },
  { id: 'merch',   icon: '👕', label: 'Merch' },
  { id: 'toys',    icon: '🧸', label: 'Toys' },
];

// ── Mira Picks Section ────────────────────────────────────────
function MiraPicksSection({ pet, token, onConcierge }) {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShopPlan, setShowShopPlan] = useState(false);
  const [selected, setSelected] = useState(null);
  const petName = pet?.name || 'your dog';

  useEffect(() => {
    if (!pet?.id || !pet?.breed) { setLoading(false); return; }
    const allergyList   = getAllergiesFromPet(pet);
    const breedParam    = pet?.breed ? `&breed=${encodeURIComponent(pet.breed)}` : '';
    const allergenParam = allergyList.length ? `&allergens=${encodeURIComponent(allergyList.join(','))}` : '';
    const auth = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_URL}/api/admin/pillar-products?pillar=shop&limit=200${breedParam}${allergenParam}`, { headers: auth })
      .then(r => r.ok ? r.json() : null)
      .then(pData => {
        const ranked = applyMiraFilter(excludeCakeProducts(pData?.products || []), pet);
        // Shop boosts — breed items first, then bundles
        ranked.forEach(p => {
          const text = ((p.name||'') + ' ' + (p.description||'')).toLowerCase();
          if (pet?.breed && text.includes((pet.breed||'').toLowerCase())) p._miraRank = Math.max(1, (p._miraRank||10) - 3);
          if (text.includes('bundle') || text.includes('starter kit')) p._miraRank = Math.max(2, (p._miraRank||10) - 1);
        });
        ranked.sort((a, b) => (a._miraRank||10) - (b._miraRank||10));
        if (ranked.length) setPicks(ranked.slice(0, 12));
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [pet?.id, pet?.breed, token]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: '#888' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
      Loading Mira's picks for {petName}…
    </div>
  );

  if (picks.length === 0) return (
    <div style={{ margin: '0 0 8px' }}>
      <MiraImaginesBreed pet={pet} pillar="shop" colour={G.gold}
        onConcierge={card => {
          if (card?.name?.toLowerCase().includes('cake') || card?.name?.toLowerCase().includes('birthday') || card?.name?.toLowerCase().includes('hamper')) {
            onConcierge?.('celebrate', card);
          }
        }} />
    </div>
  );

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: G.darkText, fontFamily: 'Georgia,serif' }}>
          Mira's Picks for <span style={{ color: G.gold }}>{petName}</span>
        </div>
        <span style={{ fontSize: 11, background: `linear-gradient(135deg,${G.gold},${G.mid})`, color: '#fff', borderRadius: 20, padding: '2px 10px', fontWeight: 700 }}>AI Scored</span>
      </div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>Breed, allergies & soul profile — all considered.</div>
      <div className="no-sb" style={{ display: 'flex', gap: 12, paddingBottom: 8 }}>
        {picks.filter(p => p.entity_type !== 'service').map((pick, i) => {
          const img = [pick.image_url, pick.image, ...(pick.images || [])].find(u => u && u.startsWith('http')) || null;
          const score = pick.mira_score || 0;
          const displayScore = pick._miraRank !== undefined ? Math.max(0, Math.round((15 - pick._miraRank) / 15 * 100)) : score;
          const scoreColor = displayScore >= 80 ? '#16A34A' : displayScore >= 70 ? G.gold : '#6B7280';
          return (
            <div key={pick.id || i}
              onClick={() => { tdc.view({ product: pick, pillar: 'shop', pet, channel: 'shop_mira_picks' }); setSelected(pick); }}
              style={{ flexShrink: 0, width: 156, background: '#fff', borderRadius: 14, border: `1.5px solid ${G.borderLight}`, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(201,151,58,0.08)' }}>
              <div style={{ width: '100%', height: 120, background: G.pale, overflow: 'hidden', position: 'relative' }}>
                {img
                  ? <img src={img} alt={pick.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg,${G.mid},${G.gold})`, color: '#fff', fontSize: 11, fontWeight: 700, padding: 8, textAlign: 'center' }}>{(pick.name || '').slice(0, 18)}</div>}
                <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, fontWeight: 700, background: G.gold, color: '#fff', borderRadius: 20, padding: '2px 7px' }}>PICK</span>
              </div>
              <div style={{ padding: '9px 10px 11px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: G.darkText, lineHeight: 1.3, marginBottom: 5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {pick.name || pick.entity_name || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <div style={{ flex: 1, height: 3, background: G.pale, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${displayScore}%`, height: '100%', background: scoreColor, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: scoreColor }}>{displayScore}</span>
                </div>
                {pick._soulMatchReason && (
                  <p style={{ fontSize: 10, color: '#D97706', lineHeight: 1.4, margin: '0 0 2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    ✦ {pick._soulMatchReason}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selected && <ProductDetailModal product={selected} pillar="shop" selectedPet={pet} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── Breed Collection Section ──────────────────────────────────
const SOUL_LIMIT = 12;
function BreedCollectionSection({ pet, token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [selPick, setSelPick] = useState(null);
  const [activeType, setActiveType] = useState('All');
  const breedDisplay = (pet?.breed || '').split('(')[0].trim();
  const petName = pet?.name || 'your dog';
  const TYPES = ['All', 'Bandana', 'Mug', 'Keychain', 'Frame', 'Tote Bag', 'Collar Tag'];

  const fetchProducts = useCallback(async (currentSkip = 0, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    try {
      const breed = encodeURIComponent((pet?.breed || 'Indie').split('(')[0].trim().toLowerCase());
      const typeParam = activeType !== 'All' ? `&category=${encodeURIComponent(activeType.toLowerCase().replace(' ', '_'))}` : '';
      const res = await fetch(`${API_URL}/api/admin/breed-products?breed=${breed}&is_active=true&limit=${SOUL_LIMIT}&skip=${currentSkip}${typeParam}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      const newItems = (data?.products || []).map(p => ({
        ...p, id: p.id || p._id || p.slug, name: p.name || p.product_type || 'Soul Made Item',
        image_url: p.watercolor_image || p.media?.primary_image || p.cloudinary_url || p.mockup_url || p.image_url || '', price: p.price || 0, pillar: 'shop',
      })).filter(p => { const fname = (p.image_url || '').split('/').pop(); return fname.startsWith('breed-'); });
      setProducts(prev => {
        if (!append) return newItems;
        const seen = new Set(prev.map(x => x.id));
        return [...prev, ...newItems.filter(x => !seen.has(x.id))];
      });
      setHasMore(newItems.length === SOUL_LIMIT);
      setSkip(currentSkip + newItems.length);
    } catch { /* silent */ }
    finally { setLoading(false); setLoadingMore(false); }
  }, [pet?.id, pet?.breed, activeType, token]);

  useEffect(() => {
    setSkip(0); setHasMore(true);
    fetchProducts(0, false);
  }, [pet?.id, pet?.breed, activeType]);

  return (
    <div>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,#2D1B69,#4A2C8F)`, borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#DDD6FE', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
          ✦ Soul Made For {(breedDisplay || 'Your Dog').toUpperCase()}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
          {breedDisplay ? `Made for ${breedDisplay}s — made for ${petName}` : `Made for ${petName}'s breed`}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Personalised to your dog's breed. No two collections are the same.</div>
      </div>

      {/* Type filters */}
      <div className="no-sb" style={{ display: 'flex', gap: 6, marginBottom: 14, paddingBottom: 4 }}>
        {TYPES.map(type => (
          <button key={type} onClick={() => setActiveType(type)}
            data-testid={`breed-type-${type.toLowerCase().replace(' ', '-')}`}
            style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: `1px solid ${activeType === type ? '#7C3AED' : G.border}`,
              background: activeType === type ? '#7C3AED' : G.pale,
              color: activeType === type ? '#fff' : G.mid, cursor: 'pointer' }}>
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#888' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🐾</div>
          Loading {breedDisplay || 'breed'} collection…
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#888' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🐾</div>
          <div style={{ fontSize: 14 }}>Breed collection being added — check back soon.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {products.map(p => (
              <div key={p.id} onClick={() => setSelPick(p)}
                data-testid={`soul-product-${p.id}`}
                style={{ background: '#fff', borderRadius: 14, border: `1px solid ${G.borderLight}`, overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#F5F0E8' }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🐾</div>}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E', marginBottom: 4, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: G.gold }}>{p.price ? `₹${p.price}` : 'Price on request'}</div>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={() => fetchProducts(skip, true)} disabled={loadingMore}
                data-testid="breed-collection-load-more"
                style={{ padding: '10px 28px', borderRadius: 999, border: `1.5px solid ${G.gold}`, background: '#fff', color: G.gold, fontSize: 13, fontWeight: 600, cursor: loadingMore ? 'not-allowed' : 'pointer', opacity: loadingMore ? 0.7 : 1 }}>
                {loadingMore ? 'Loading…' : `Load more for ${petName} →`}
              </button>
            </div>
          )}
        </>
      )}
      {selPick && <ProductDetailModal product={selPick} pillar="shop" selectedPet={pet} onClose={() => setSelPick(null)} />}
    </div>
  );
}

// ── Doggy Bakery Section ──────────────────────────────────────
const BAKERY_FILTERS = [
  { id: 'all', label: 'All' }, { id: 'cakes', label: '🎂 Cakes' },
  { id: 'treats', label: '🍖 Treats' }, { id: 'hampers', label: '🎁 Hampers' },
  { id: 'seasonal', label: '🎃 Seasonal' },
];
function DoggyBakerySection({ pet, token, presetFilter }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(presetFilter || 'all');
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    setLoading(true);
    const fetchTab = async () => {
      let products = [];
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const breed = pet?.breed || '';
      const breedParam = breed ? `&breed=${encodeURIComponent(breed)}` : '';
      try {
        if (filter === 'all') {
          const r = await fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&page=1&limit=48&sort_by=mira_score${breedParam}`, { headers });
          const d = await r.json();
          products = d?.products || [];
        } else if (filter === 'cakes') {
          const [r1, r2] = await Promise.all([
            fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&category=cakes&limit=120${breedParam}`, { headers }),
            fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&category=breed-cakes&limit=120${breedParam}`, { headers }),
          ]);
          const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
          products = [...(d1.products || []), ...(d2.products || [])];
        } else if (filter === 'treats') {
          const r = await fetch(`${API_URL}/api/admin/pillar-products?pillar=dine&category=Treats%20%26%20Rewards&limit=80${breedParam}`, { headers });
          const d = await r.json();
          products = d?.products || [];
        } else if (filter === 'hampers') {
          const r = await fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&category=hampers&limit=50${breedParam}`, { headers });
          const d = await r.json();
          products = d?.products || [];
        } else if (filter === 'seasonal') {
          const r = await fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&limit=200${breedParam}`, { headers });
          const d = await r.json();
          const keys = ['diwali', 'halloween', 'christmas', 'rakhi', 'festive', 'holi', 'eid', 'spooky'];
          products = (d?.products || []).filter(p => keys.some(s => p.name?.toLowerCase().includes(s)));
        }
      } catch (e) { /* silent */ }
      setItems(products);
      setLoading(false);
    };
    fetchTab();
  }, [filter, token]);
  const filtered = items;
  return (
    <div>
      <div style={{ background: `linear-gradient(135deg,${G.deep},${G.mid})`, borderRadius: 16, padding: '20px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: 0.06 }}>🎂</div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎂</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', fontFamily: 'Georgia,serif' }}>The Doggy Bakery</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>thedoggybakery.com · Dog-safe · Handmade</div>
            </div>
          </div>
          <div style={{ background: G.pale, border: `1px solid ${G.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>🐕</span>
            <div style={{ fontSize: 12, color: G.darkText, lineHeight: 1.5 }}><strong>Streaties:</strong> 10% of every purchase feeds street animals. <a href="https://thedoggybakery.com/pages/streaties" target="_blank" rel="noopener noreferrer" style={{ color: G.gold, fontWeight: 600, textDecoration: 'none' }}>Learn more →</a></div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {['🐾 Dog-safe', '✦ Handmade', '🚚 Same-day BLR+MUM', '🌱 No xylitol'].map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 600, color: '#fff' }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="no-sb" style={{ display: 'flex', gap: 6, marginBottom: 12, paddingBottom: 4 }}>
        {BAKERY_FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${filter === f.id ? G.gold : G.border}`, background: filter === f.id ? G.gold : G.pale, color: filter === f.id ? '#fff' : G.mid, cursor: 'pointer' }}>
            {f.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#888' }}><div style={{ fontSize: 28, marginBottom: 8 }}>🎂</div>Loading The Doggy Bakery…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#888' }}>No items found. <a href="https://thedoggybakery.com" target="_blank" rel="noopener noreferrer" style={{ color: G.gold, textDecoration: 'none' }}>Visit thedoggybakery.com →</a></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(showAll ? filtered : filtered.slice(0, 20)).map(item => <SharedProductCard key={item.id || item._id} product={item} pillar="shop" selectedPet={pet} />)}
          </div>
          {!showAll && filtered.length > 20 && (
            <button
              onClick={() => setShowAll(true)}
              data-testid="bakery-see-all-btn"
              style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 12, padding: '12px', borderRadius: 10, background: G.pale, border: `1px solid ${G.border}`, color: G.mid, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Browse all {items.length} products from The Doggy Bakery →
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Full Browse Section ───────────────────────────────────────
const BROWSE_PILLARS = [
  { id: 'all', label: 'Everything', emoji: '🛍️' }, { id: 'shop', label: 'Shop', emoji: '🎁' },
  { id: 'celebrate', label: 'Celebrate', emoji: '🎂' }, { id: 'care', label: 'Care', emoji: '🌿' },
  { id: 'play', label: 'Play', emoji: '🎾' }, { id: 'learn', label: 'Learn', emoji: '📚' },
  { id: 'dine', label: 'Dine', emoji: '🍖' },
];
function ShopBrowseSection({ pet, token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 20;

  const fetchProducts = useCallback(async (pillar, pageNum, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    try {
      const pillarParam = pillar === 'all' ? '' : `&pillar=${pillar}`;
      const breedParam = pet?.breed ? `&breed=${encodeURIComponent(pet.breed)}` : '';
      const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
      const url = `${API_URL}/api/admin/pillar-products?limit=${LIMIT}&page=${pageNum + 1}${pillarParam}${breedParam}${searchParam}&sort_by=mira_score`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const newProducts = data?.products || [];
      setProducts(prev => append ? [...prev, ...newProducts] : newProducts);
      setHasMore(newProducts.length === LIMIT);
      setPage(pageNum);
    } catch { setProducts(prev => append ? prev : []); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [pet?.breed, search, token]);

  useEffect(() => { setPage(0); setHasMore(true); fetchProducts(pillarFilter, 0, false); }, [pillarFilter, pet?.id]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchProducts(pillarFilter, 0, false)}
          placeholder="Search products…"
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13, outline: 'none', border: `1.5px solid ${G.border}`, color: G.darkText, background: '#fff' }} />
        <button onClick={() => fetchProducts(pillarFilter, 0, false)}
          style={{ padding: '10px 16px', borderRadius: 10, background: G.gold, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Search
        </button>
      </div>
      <div className="no-sb" style={{ display: 'flex', gap: 6, marginBottom: 14, paddingBottom: 4 }}>
        {BROWSE_PILLARS.map(p => (
          <button key={p.id} onClick={() => { setPillarFilter(p.id); setSearch(''); }}
            style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: `1px solid ${pillarFilter === p.id ? G.gold : G.border}`,
              background: pillarFilter === p.id ? G.gold : G.pale,
              color: pillarFilter === p.id ? '#fff' : G.mid, cursor: 'pointer' }}>
            {p.emoji} {p.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#888' }}><div style={{ fontSize: 28, marginBottom: 8 }}>🛍️</div>Loading products…</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#888' }}>No products found.</div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
            Mira's picks for {petName}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {products.map(p => <SharedProductCard key={p.id || p._id || p.name} product={p} pillar={p.pillar || 'shop'} selectedPet={pet} />)}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button onClick={() => fetchProducts(pillarFilter, page + 1, true)} disabled={loadingMore}
                style={{ padding: '10px 28px', borderRadius: 999, border: `1.5px solid ${G.gold}`, background: '#fff', color: G.gold, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {loadingMore ? 'Loading…' : 'Load more →'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function ShopMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar: 'shop', pet: currentPet });
  const { request } = useConcierge({ pet: currentPet, pillar: 'shop' });
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [mainTab, setMainTab] = useState('mira');
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [showMiraPicks, setShowMiraPicks] = useState(false);
  const [showShopPlan, setShowShopPlan] = useState(false);
  const miraPicksRef = useRef(null);
  const contentRef = useRef(null);   // scrolls to content when category chip is tapped

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  // Scroll to content when a shop category changes
  useEffect(() => {
    if (mainTab && contentRef.current) {
      setTimeout(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [mainTab]);

  const handleSeePicks = useCallback(() => {
    vibe('medium');
    setMainTab('mira');
    setShowMiraPicks(true);
    setTimeout(() => miraPicksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, []);

  if (loading) return (
    <PillarPageLayout pillar="shop" hideHero hideNavigation>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 36, marginBottom: 12 }}>🛍️</div><div>Loading your shop…</div></div>
      </div>
    
      <MiraPlanModal
        isOpen={showShopPlan}
        onClose={() => setShowShopPlan(false)}
        pet={currentPet}
        pillar="shop"
        token={token}
      />
    </PillarPageLayout>
  );

  if (!currentPet) return (
    <PillarPageLayout pillar="shop" hideHero hideNavigation>
      <style>{CSS}</style>
      <div className="shop mobile-page-container">
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ background: '#fff', border: `1px solid ${S.border}`, borderRadius: 22, padding: '32px 20px' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🛍️</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Add your pet to unlock Shop</div>
            <button className="shop-cta" style={{ marginTop: 16 }} onClick={() => navigate('/join')}>Add your pet →</button>
          </div>
        </div>
      </div>
    
      <MiraPlanModal
        isOpen={showShopPlan}
        onClose={() => setShowShopPlan(false)}
        pet={currentPet}
        pillar="shop"
        token={token}
      />
    </PillarPageLayout>
  );

  const petName = currentPet.name;
  const breed = (currentPet.breed || '').split('(')[0].trim();

  return (
    <PillarPageLayout pillar="shop" hideHero hideNavigation>
      <div className="shop mobile-page-container" data-testid="shop-mobile">
        <style>{CSS}</style>
        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="shop" pillarColor={S.goldL} pillarLabel="Shop" onClose={() => setSoulMadeOpen(false)} />}

        {/* Hero */}
        <PillarHero
          pillar="shop"
          pet={currentPet}
          allPets={contextPets || []}
          onSwitchPet={p => { vibe(); setCurrentPet(p); }}
          gradient={`linear-gradient(160deg,${S.dark} 0%,${S.gold} 50%,${S.goldL} 100%)`}
          title="🛍️ Shop"
          subtitle={`Shop for ${petName}`}
          tagline={`${breed ? `${breed} · ` : ''}5,358 breed-matched products`}
        />

        <div style={{ padding: '0 16px 8px' }}>
          <PillarSoulProfile pet={currentPet} pillar="shop" token={token} />
        </div>

        {/* Soul Pillar CTA */}
        <div style={{ margin:'0 16px 12px', background:'linear-gradient(135deg,rgba(232,184,75,0.14),rgba(232,184,75,0.20))', border:'1px solid rgba(232,184,75,0.35)', borderRadius:18, padding:'16px' }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#1A0A2E', lineHeight:1.25, marginBottom:4 }}>
            What would <span style={{ color:'#B45309' }}>{petName}</span> love?
          </div>
          <div style={{ fontSize:13, color:'#4B5563', lineHeight:1.5 }}>
            Every product is filtered to {petName}'s breed, size and allergen profile.
          </div>
        </div>

        {/* Pawrent Journey First Steps */}
        {currentPet && (
          <div style={{ padding:'0 16px 8px' }}>
            <PawrentFirstStepsTab pet={currentPet} token={token} currentPillar="shop" />
          </div>
        )}

        {/* Category Strip */}
        <div className="no-sb" style={{ padding: '12px 16px 4px', display: 'flex', gap: 8, paddingBottom: 8 }}>
          {SHOP_CATS.map(cat => {
            const label = cat.label.replace('{name}', petName);
            const isActive = mainTab === cat.id;
            return (
              <button key={cat.id} onClick={() => { vibe(); setMainTab(cat.id); }}
                data-testid={`shop-cat-${cat.id}`}
                style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: isActive ? `linear-gradient(135deg,${G.mid},${G.gold})` : G.pale,
                  color: isActive ? '#fff' : G.darkText,
                  fontWeight: isActive ? 700 : 500, fontSize: 11, transition: 'all 0.15s',
                  boxShadow: isActive ? `0 4px 12px rgba(201,151,58,0.35)` : 'none' }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Mira bar */}
        <div style={{ margin: '12px 16px 0', background: S.dark, borderRadius: 20, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: `rgba(232,184,75,0.9)`, letterSpacing: '0.1em', marginBottom: 8 }}>✦ MIRA ON {petName.toUpperCase()}'S SHOP</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 14, fontStyle: 'italic' }}>
            "Everything here is filtered for {petName}'s breed and allergen profile. The best picks are first."
          </div>
          <button className="shop-cta" onClick={handleSeePicks} data-testid="see-mira-picks-btn">
            See Mira's Shop Picks →
          </button>
          <button className="shop-cta" onClick={() => { vibe('medium'); setShowShopPlan(true); }} style={{ marginTop:8 }}>
            Build {petName}'s Shop Plan →
          </button>
        </div>

        {/* Main Content — tab-switched */}
        {/* Scrolls here when a category chip is tapped */}
        <div ref={contentRef} style={{ padding: '20px 16px 24px' }}>
          {/* MIRA PICKS TAB (was for_pet) */}
          {(mainTab === 'mira') && (
            <div ref={miraPicksRef}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: G.darkText, fontFamily: 'Georgia,serif' }}>
                Made for {petName}
              </div>
              <MiraPicksSection pet={currentPet} token={token} />

              <div style={{ margin: '24px 0 16px', height: 1, background: G.border }} />
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4, color: G.darkText, fontFamily: 'Georgia,serif' }}>
                {breed ? `${breed} Soul Collection` : `${petName}'s Breed Collection`}
              </div>
              <div style={{ fontSize: 13, color: G.mutedText, marginBottom: 14 }}>
                Personalised soul products — bandanas, mugs, tote bags, and more.
              </div>
              <BreedCollectionSection pet={currentPet} token={token} />

              <div style={{ margin: '24px 0 16px', height: 1, background: G.border }} />
              <PersonalisedBreedSection pet={currentPet} pillar="shop" token={token} />

              <div style={{ margin: '24px 0 12px', background: S.dark, borderRadius: 20, padding: 18, cursor: 'pointer' }} onClick={() => setSoulMadeOpen(true)}>
                <div style={{ fontSize: 14, letterSpacing: '0.14em', color: S.goldXL, fontWeight: 700, marginBottom: 8 }}>✦ SOUL MADE™ · ONLY FOR {petName.toUpperCase()}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{petName}'s face on bandanas, tote bags, ID tags and more.</div>
                <button className="shop-cta">Make something only {petName} has →</button>
              </div>
            </div>
          )}

          {/* BAKERY TAB */}
          {mainTab === 'bakery' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: G.darkText, fontFamily: 'Georgia,serif' }}>The Doggy Bakery</div>
              <div style={{ fontSize: 13, color: G.mutedText, marginBottom: 14 }}>Dog-safe treats, cakes & hampers — handmade with love.</div>
              <DoggyBakerySection pet={currentPet} token={token} />
            </div>
          )}

          {/* BREED TAB */}
          {mainTab === 'breed' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: G.darkText, fontFamily: 'Georgia,serif' }}>
                {breed ? `${breed} Collection` : 'Breed Collection'}
              </div>
              <div style={{ fontSize: 13, color: G.mutedText, marginBottom: 14 }}>Soul-made products personalised for {petName}'s breed.</div>
              <BreedCollectionSection pet={currentPet} token={token} />
            </div>
          )}


          {/* HAMPERS TAB */}
          {mainTab === 'hampers' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: G.darkText, fontFamily: 'Georgia,serif' }}>Hampers & Gifts</div>
              <DoggyBakerySection pet={currentPet} token={token} presetFilter="hampers" />
            </div>
          )}

          {/* TREATS TAB */}
          {mainTab === 'treats' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: G.darkText, fontFamily: 'Georgia,serif' }}>Treats</div>
              <div style={{ fontSize: 13, color: G.mutedText, marginBottom: 14 }}>Dog-safe treats, cookies, and snacks from The Doggy Bakery.</div>
              <DoggyBakerySection pet={currentPet} token={token} presetFilter="treats" />
            </div>
          )}

          {/* TOYS TAB */}
          {mainTab === 'toys' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: G.darkText, fontFamily: 'Georgia,serif' }}>Toys</div>
              <div style={{ fontSize: 13, color: G.mutedText, marginBottom: 14 }}>Toys and enrichment for {petName}'s breed.</div>
              <BreedCollectionSection pet={currentPet} token={token} />
            </div>
          )}

          {/* MERCH TAB */}
          {mainTab === 'merch' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: G.darkText, fontFamily: 'Georgia,serif' }}>Breed Merch</div>
              <div style={{ fontSize: 13, color: G.mutedText, marginBottom: 14 }}>{breed ? `Made for ${breed}s` : 'Personalised breed merchandise'}.</div>
              <BreedCollectionSection pet={currentPet} token={token} />
            </div>
          )}
        </div>

        {/* Concierge® Cards */}
        <div style={{ margin: '0 16px 8px' }}>
          <PillarConciergeCards pillar="shop" pet={currentPet} token={token} />
        </div>

        {/* Concierge® CTA */}
        <div style={{ margin: '0 16px 24px', background: S.dark, borderRadius: 24, padding: 20 }}>
          <div style={{ display: 'inline-flex', background: 'rgba(232,184,75,0.2)', border: '1px solid rgba(232,184,75,0.4)', borderRadius: 999, padding: '5px 14px', color: S.goldXL, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🛍️ Shop Concierge®</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 10, fontFamily: 'Georgia,serif' }}>Can't find what you need for {petName}?</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 16 }}>Tell us what you're looking for. Concierge® will source it.</div>
          <button onClick={() => { vibe('medium'); setConciergeOpen(true); }}
            data-testid="shop-ask-concierge-btn"
            style={{ width: '100%', minHeight: 48, borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${S.goldL},${S.goldXL})`, color: S.dark, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            🛍️ Ask Concierge® →
          </button>
        </div>

        {/* Amazon Explorer — separate self-serve search box */}
        <div style={{ margin: '0 16px 32px' }}>
          <AmazonExplorerBox pet={currentPet} isDesktop={false} />
        </div>
      </div>
    
      <MiraPlanModal
        isOpen={showShopPlan}
        onClose={() => setShowShopPlan(false)}
        pet={currentPet}
        pillar="shop"
        token={token}
      />

      <ConciergeRequestBuilder
        pet={currentPet}
        token={token}
        isOpen={conciergeOpen}
        onClose={() => setConciergeOpen(false)}
        prefilledText="I'm looking for something specific for my dog"
      />
    </PillarPageLayout>
  );
}
