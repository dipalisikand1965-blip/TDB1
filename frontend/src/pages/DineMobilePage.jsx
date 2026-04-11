/**
 * DineMobilePage.jsx — /dine (mobile)
 * Extracted from DineSoulPage.jsx — Session 96, March 29 2026
 * Desktop source of truth: DineSoulPage.jsx (DineSoulPageDesktopLegacy)
 * Colour: Orange #FF8C42 · Dark #3d1200
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import { applyMiraFilter, filterBreedProducts, getAllergiesFromPet } from '../hooks/useMiraFilter';
import { tdc } from '../utils/tdc_intent';
import { API_URL } from '../utils/api';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import ConciergeRequestBuilder from '../components/services/ConciergeRequestBuilder';
import SoulMadeModal from '../components/SoulMadeModal';
import DineCategoryStrip from '../components/dine/DineCategoryStrip';
import DineConciergeSection from '../components/dine/DineConciergeSection';
import GuidedNutritionPaths from '../components/dine/GuidedNutritionPaths';
import MealBoxCard from '../components/dine/MealBoxCard';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraEmptyRequest from '../components/common/MiraEmptyRequest';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import MiraPlanModal from '../components/mira/MiraPlanModal';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
import { DINE_DIMS, DineDimensionsRail,
  DineLoadingState, DineEmptyState, DinePetProfileCard,
  DineProfileSheet, DineSegmentedSwitch, DineSectionHeading,
  DineProductCard, DineMiraBar, DineMiraPicksSheet,
  DineSoulMadeInlineCard, DineConciergeCard, DineIntakeSheet,
  vibe, getAllergies, getLoves, getFavourite, getHealthCondition,
  getNutritionGoal, applyMiraIntelligence, normCard, CSS,
} from './DineSoulPage';
import PillarHero from '../components/PillarHero';
import PetFriendlySpots from '../components/dine/PetFriendlySpots';
import '../styles/mobile-design-system.css';

// ── Design tokens (copied from DineSoulPage) ──────────────────────────────
const C = {
  orange:'#FF8C42', dark:'#3d1200', mid:'#7a2800', deep:'#c44400',
  cream:'#FFF8F0', pale:'#FFF3E8', taupe:'#8B6B4A',
  chipBg:'rgba(255,140,66,0.10)', chipBorder:'rgba(255,140,66,0.25)',
  red:'#FF6B64', green:'#27AE60', amber:'#F9A825',
};
const CTAGrad  = `linear-gradient(135deg,${C.mid},${C.deep})`;
const DarkGrad = `linear-gradient(160deg,#3d1200 0%,#7a2800 50%,#c44400 100%)`;

export default function DineMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'dine', pet:currentPet });
  const { request, book } = useConcierge({ pet:currentPet, pillar:'dine' });

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('eat');
  const [mainDineTab, setMainDineTab] = useState('dine');
  const [conciergeBuilderOpen, setConciergeBuilderOpen] = useState(false);
  const [openDim, setOpenDim] = useState(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [miraOpen, setMiraOpen] = useState(false);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [prefillVenue, setPrefillVenue] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const [showDinePlan, setShowDinePlan] = useState(false);

  // Product state
  const [apiProducts, setApiProducts] = useState({});
  const [flatProducts, setFlatProducts] = useState([]);
  const [miraProducts, setMiraProducts] = useState([]);
  const [miraServices, setMiraServices] = useState([]);

  // Load pets
  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  // Listen for soul score updates
  useEffect(() => {
    const handler = () => {
      if (currentPet?.id) fetchProducts(currentPet);
    };
    window.addEventListener('soulScoreUpdated', handler);
    return () => window.removeEventListener('soulScoreUpdated', handler);
  }, [currentPet]);

  // Fetch products — breed param ensures backend pre-filters so Mojo sees only Indie products
  const fetchProducts = useCallback(async (pet) => {
    if (!pet?.id) return;
    const FOOD_CATS = ['Daily Meals', 'Treats & Rewards', 'Supplements', 'Frozen & Fresh', 'Homemade & Recipes'];
    // Always pass breed so the backend pre-filters: Indie dog sees Indie + universal products only
    const breedParam = pet.breed ? `&breed=${encodeURIComponent(pet.breed)}` : '';
    // Pass allergens to backend for server-side pre-filtering (double safety layer)
    const petAllergies = getAllergiesFromPet(pet);
    const allergenParam = petAllergies.length > 0 ? `&allergens=${encodeURIComponent(petAllergies.join(','))}` : '';
    try {
      const results = await Promise.all(
        FOOD_CATS.map(cat =>
          fetch(`${API_URL}/api/admin/pillar-products?pillar=dine&limit=200&category=${encodeURIComponent(cat)}${breedParam}${allergenParam}`, {
            headers: token ? { Authorization:`Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        )
      );
      // Categories that belong to Celebrate — must NEVER appear on Dine Mira Picks
      const CELEBRATE_CATS = new Set([
        'cakes','breed-cakes','mini-cakes','pupcakes','dognuts',
        'hampers','cat-cakes','cat-party','cat-hampers','cat-gotcha','birthday-cakes',
      ]);
      const grouped = {};
      results.forEach(data => {
        if (!data?.products?.length) return;
        data.products.forEach(p => {
          const cat = (p.category || '').toLowerCase().replace(/_/g, '-').trim();
          const sub = (p.sub_category || '').toLowerCase().replace(/_/g, '-').trim();
          const pillarField = (p.pillar || '').toLowerCase();
          // Hard block: celebrate-pillar products and celebrate categories must never appear on Dine
          if (pillarField === 'celebrate') return;
          if (CELEBRATE_CATS.has(cat) || CELEBRATE_CATS.has(sub)) return;
          const catRaw = p.category || '';
          const subRaw = p.sub_category || '';
          if (!grouped[catRaw]) grouped[catRaw] = {};
          if (!grouped[catRaw][subRaw]) grouped[catRaw][subRaw] = [];
          grouped[catRaw][subRaw].push(p);
        });
      });
      setApiProducts(grouped);
      const rawFlat = Object.values(grouped).flatMap(subMap => Object.values(subMap).flat());
      // Apply breed filter + Mira ranking before normCard
      const breedFiltered = filterBreedProducts(rawFlat, pet.breed);
      const miraRanked = applyMiraFilter(breedFiltered, pet).map(p => normCard(p, pet.name));
      setFlatProducts(miraRanked);
      // Mira Picks section reuses the already-ranked list — no extra claude-picks call needed
      setMiraProducts(miraRanked.slice(0, 6));
      setVisibleCount(4);
    } catch {
      setApiProducts({});
      setFlatProducts([]);
    }
  }, [token]);

  useEffect(() => { fetchProducts(currentPet); }, [currentPet, fetchProducts]);

  // Fetch dine services directly (no stale claude-picks needed)
  useEffect(() => {
    if (!token || !currentPet?.id) return;
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API_URL}/api/services?pillar=dine&limit=3`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setMiraServices((d?.services || []).map(s => ({
          id: s.id, name: s.name,
          desc: s.description || 'Concierge® dining help',
          raw: s,
        })));
      }).catch(() => {});
  }, [token, currentPet?.id]);

  const handleAddToCart = useCallback(product => {
    if (!product?.raw) return;
    addToCart({
      id: product.raw.id || product.id,
      name: product.raw.name || product.name,
      price: Number(product.raw.price || product.raw.pricing?.selling_price || 0),
      image: product.raw.watercolor_image || product.raw.media?.primary_image || product.raw.cloudinary_url || product.raw.image_url || product.imageUrl,
      category: product.raw.category || 'dine',
      pillar: 'dine',
    }, null, null, 1);
  }, [addToCart]);

  const handleConcierge = useCallback(async item => {
    if (!item) return;
    await book(item.raw || { name:item.name, price:0 }, { channel:'dine_mira_sheet' });
  }, [book]);

  const handleConciergeRequest = useCallback(async (occasion, notes) => {
    await request(
      `Dining concierge request for ${currentPet?.name || 'your dog'}: ${occasion}${notes ? `. Notes: ${notes}` : ''}`,
      { channel:'dine_intake', metadata:{ occasion, notes } }
    );
  }, [request, currentPet]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  if (loading) {
    return (
      <PillarPageLayout pillar="dine" hideHero hideNavigation>
        <DineLoadingState />
      </PillarPageLayout>
    );
  }

  if (!currentPet) {
    return (
      <PillarPageLayout pillar="dine" hideHero hideNavigation>
        <style>{CSS}</style>
        <div className="dp">
          <DineEmptyState onAddPet={() => navigate('/join')} />
        </div>
      </PillarPageLayout>
    );
  }

  const petName = currentPet.name;

  return (
    <PillarPageLayout pillar="dine" hideHero hideNavigation>
      <div className="dp mobile-page-container" data-testid="dine-mobile-v11">
        <style>{CSS}</style>

        {/* Modals & Sheets */}
        {profileOpen && (
          <DineProfileSheet
            pet={currentPet}
            onClose={() => setProfileOpen(false)}
            onConcierge={async card => {
              await request(`Dine imagine request for ${petName}: ${card?.name}`, { channel:'dine_imagines' });
              showToast(`Sent to Concierge® for ${petName}`);
            }}
          />
        )}
        {miraOpen && (
          <DineMiraPicksSheet
            pet={currentPet}
            products={miraProducts}
            services={miraServices}
            onClose={() => setMiraOpen(false)}
            onConcierge={handleConcierge}
            onAdd={handleAddToCart}
            onTap={setSelectedProduct}
          />
        )}
        {intakeOpen && (
          <DineIntakeSheet
            pet={currentPet}
            prefillVenue={prefillVenue}
            onClose={() => { setIntakeOpen(false); setPrefillVenue(null); }}
            onSend={handleConciergeRequest}
          />
        )}
        {soulMadeOpen && (
          <SoulMadeModal
            pet={currentPet}
            pillar="dine"
            pillarColor="#D97706"
            pillarLabel="Dining"
            onClose={() => setSoulMadeOpen(false)}
          />
        )}
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct.raw || selectedProduct}
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            petName={petName}
            pillarColor={C.amber}
          />
        )}

        {/* Toast */}
        {toastMsg && (
          <div style={{ position:'fixed', left:'50%', bottom:'calc(92px + env(safe-area-inset-bottom))', transform:'translateX(-50%)', zIndex:9000, background:C.dark, color:'#fff', padding:'10px 16px', borderRadius:999, fontSize:14, fontWeight:600, boxShadow:'0 12px 28px rgba(0,0,0,0.24)', whiteSpace:'nowrap' }}>
            {toastMsg}
          </div>
        )}

        {/* ── 1. Hero ── */}
        <PillarHero
          pillar="dine"
          pet={currentPet}
          allPets={contextPets || []}
          onSwitchPet={p => { vibe('light'); setCurrentPet(p); }}
          gradient="linear-gradient(160deg,#3d1200 0%,#7a2800 50%,#c44400 100%)"
          title="🍽️ Dine"
          subtitle="Food & Nourishment"
          tagline={`for ${petName}`}
          allergies={getAllergies(currentPet)}
        >
          {getFavourite(currentPet) && (
            <div style={{ display:'inline-flex', alignItems:'center', background:'rgba(255,208,128,0.12)', border:'1px solid rgba(255,208,128,0.3)', borderRadius:999, padding:'5px 12px', fontSize:14, color:'#FFD080', fontWeight:500, marginTop:6 }}>
              💚 Loves {getFavourite(currentPet)}
            </div>
          )}
        </PillarHero>

        {/* ── 2. Soul Card — Mojo's heart, always visible ── */}
        {(() => {
          const allergyList = getAllergiesFromPet(currentPet).filter(a =>
            !['none','no','nil','n/a','unknown','no allergies','none known'].includes(a.toLowerCase())
          );
          const loveList = (() => {
            const raw = [
              ...(currentPet?.preferences?.favorite_treats || []),
              ...(currentPet?.soul_enrichments?.favorite_treats || []),
              ...(currentPet?.doggy_soul_answers?.favorite_treats || []),
              currentPet?.doggy_soul_answers?.favorite_protein,
            ].filter(Boolean).map(v => (typeof v === 'string' ? v : v?.name || '')).filter(Boolean);
            // De-dup, strip allergens from loves
            return [...new Set(raw)].filter(l =>
              !allergyList.some(a => l.toLowerCase().includes(a.toLowerCase()))
            ).slice(0, 3);
          })();
          const lifeVision = currentPet?.doggy_soul_answers?.life_vision
            || currentPet?.dsa?.life_vision
            || currentPet?.soul_enrichments?.life_vision
            || null;
          if (!allergyList.length && !loveList.length && !lifeVision) return null;
          return (
            <div data-testid="dine-soul-card" style={{
              margin:'12px 16px 0',
              background:'linear-gradient(135deg,#FFF8F0 0%,#FFF3E8 100%)',
              border:'1.5px solid rgba(255,140,66,0.2)',
              borderRadius:16,
              padding:'14px 16px',
              boxShadow:'0 2px 12px rgba(61,18,0,0.06)',
            }}>
              {/* Name + icon */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:lifeVision ? 6 : 10 }}>
                <span style={{ fontSize:18 }}>🐾</span>
                <span style={{ fontSize:15, fontWeight:700, color:C.dark, letterSpacing:'-0.3px' }}>
                  {petName}'s Dine
                </span>
              </div>

              {/* Life vision quote */}
              {lifeVision && (
                <p style={{ margin:'0 0 10px', fontSize:13, color:C.taupe, fontStyle:'italic', lineHeight:1.45, paddingLeft:26 }}>
                  "{lifeVision}"
                </p>
              )}

              {/* Chips row */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, paddingLeft:0 }}>
                {/* Allergen chips */}
                {allergyList.map(a => (
                  <span key={a} style={{
                    display:'inline-flex', alignItems:'center', gap:4,
                    background:'rgba(255,107,100,0.10)', border:'1px solid rgba(255,107,100,0.28)',
                    borderRadius:999, padding:'4px 10px', fontSize:12, fontWeight:600, color:'#B03A2E',
                  }}>
                    ⚠️ No {a.charAt(0).toUpperCase() + a.slice(1)}
                  </span>
                ))}
                {/* Love chips */}
                {loveList.map(l => (
                  <span key={l} style={{
                    display:'inline-flex', alignItems:'center', gap:4,
                    background:'rgba(39,174,96,0.09)', border:'1px solid rgba(39,174,96,0.25)',
                    borderRadius:999, padding:'4px 10px', fontSize:12, fontWeight:600, color:'#1E7A46',
                  }}>
                    ❤️ {l.charAt(0).toUpperCase() + l.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── 3. Main 3-Tab Bar ── */}
        <div className="ios-tab-bar">
          {[
            { id:'dine',     label:'🍲 Dine' },
            { id:'services', label:'🐕 Services' },
            { id:'nearme',   label:'📍 Find Restaurants' },
          ].map(t => (
            <button key={t.id}
              className={`ios-tab${mainDineTab===t.id?' active':''}`}
              style={mainDineTab===t.id ? { backgroundColor:C.dark, color:'#fff' } : {}}
              data-testid={`dine-tab-${t.id}`}
              onClick={() => { vibe('light'); setMainDineTab(t.id); }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ════ TAB 1: 🍲 Dine ════ */}
        {mainDineTab === 'dine' && (<>

        {/* Category Strip — inside Dine tab only */}
        <DineCategoryStrip pet={currentPet} />

        {/* Sub-toggle REMOVED — Eat & Nourish content always shown in Dine tab */}

        {/* ── 4. Food Profile + Pawrent Journey ── */}
        <>
            <div style={{ padding:'12px 16px 0' }}>
              <PillarSoulProfile pet={currentPet} pillar="dine" token={token} />
            </div>
            <div style={{ padding:'8px 16px 0' }}>
              <PawrentFirstStepsTab pet={currentPet} token={token} currentPillar="dine" defaultCollapsed={true} />
            </div>
          </>

        {/* ════════════════════════════════════
            EAT & NOURISH
        ════════════════════════════════════ */}
        <>
            {/* ── Dimensions Rail (real tabs, no cap) ── */}
            <DineDimensionsRail
              dims={DINE_DIMS}
              openDim={openDim}
              onSelect={setOpenDim}
              pet={currentPet}
              apiProducts={apiProducts}
              onAdd={handleAddToCart}
              onTap={setSelectedProduct}
            />

            {/* ── Mira Bar ── */}
            <DineMiraBar pet={currentPet} onOpen={() => setMiraOpen(true)} />

            {/* ── Build Food Plan CTA ── */}
            <div style={{ padding:'0 16px 8px 16px' }}>
              <button
                onClick={() => setShowDinePlan(true)}
                style={{
                  width:'100%', padding:'14px 20px', borderRadius:16,
                  background:'linear-gradient(135deg,#C8873A,#E8A85A)',
                  border:'none', color:'#fff', fontSize:15, fontWeight:700,
                  cursor:'pointer', letterSpacing:'0.01em',
                  boxShadow:'0 4px 20px rgba(200,135,58,0.4)',
                }}
                data-testid="dine-build-plan-btn"
              >
                Build {petName}'s Food Plan →
              </button>
            </div>

            {/* ── MealBoxCard ── */}
            <div style={{ padding:'0 16px 24px' }}>
              <MealBoxCard />
            </div>

            {/* ── All products (intelligence sorted, 4 at a time) ── */}
            {flatProducts.length > 0 ? (
              <div style={{ padding:'0 16px 24px' }}>
                <div style={{ fontSize:18, fontWeight:700, marginBottom:14 }}>
                  {getAllergies(currentPet).length > 0
                    ? `Safe for ${petName} — Mira filtered`
                    : `Products for ${petName}`}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {applyMiraIntelligence(
                    flatProducts.map(p => p.raw || p),
                    getAllergies(currentPet),
                    getLoves(currentPet),
                    getHealthCondition(currentPet),
                    getNutritionGoal(currentPet),
                    currentPet
                  ).slice(0, visibleCount).map(p => {
                    const card = normCard(p, petName);
                    return <DineProductCard key={card.id} product={card} onAdd={handleAddToCart} onTap={() => setSelectedProduct(p)} />;
                  })}
                </div>

                {/* Quiet load more — no numbers */}
                {visibleCount < flatProducts.length && (
                  <div style={{ textAlign:'center', marginTop:18 }}>
                    <button
                      onClick={() => setVisibleCount(c => c + 4)}
                      data-testid="dine-load-more"
                      style={{
                        background:'none', border:'1.5px solid #D9770640',
                        borderRadius:999, padding:'8px 28px',
                        fontSize:13, fontWeight:600, color:'#D97706',
                        cursor:'pointer', letterSpacing:'0.03em',
                      }}
                    >
                      see more
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding:'0 16px 24px' }}>
                <MiraEmptyRequest
                  pet={currentPet}
                  pillar="dine"
                  categoryName="Food & Nutrition"
                  accentColor="#D97706"
                  onRequest={async (msg) => {
                    await request(msg, { channel:'dine_empty_products', metadata:{ petName } });
                    showToast(`Sent to Mira for ${petName}`);
                  }}
                />
              </div>
            )}

            {/* ── MiraImaginesBreed ── */}
            <div style={{ padding:'0 16px 24px' }}>
              <MiraImaginesBreed pet={currentPet} pillar="dine" token={token} />
            </div>

            {/* ── Soul Made ── */}
            <DineSoulMadeInlineCard pet={currentPet} onOpen={() => setSoulMadeOpen(true)} />

            {/* ── Guided Nutrition Paths ── */}
            <div style={{ padding:'0 16px 24px' }}>
              <GuidedNutritionPaths pet={currentPet} />
            </div>
            {/* ── Dine, Personally (services section) ── */}
            <div style={{ padding:'0 16px 24px' }}>
              <DineConciergeSection pet={currentPet} />
            </div>
          </>

        </>)} {/* end TAB 1 */}

        {/* ════ TAB 2: 🐕 Services ════ */}
        {mainDineTab === 'services' && (
          <div style={{ padding:'16px 16px 24px' }}>
            <div style={{ background:'#0A0A14', borderRadius:20, padding:16, marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'rgba(201,151,58,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ DINE CONCIERGE®</div>
              <div style={{ fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14 }}>
                Restaurant reservations, food sourcing, nutrition plans — all arranged for {petName}.
              </div>
              <button onClick={() => setConciergeBuilderOpen(true)}
                style={{ width:'100%', padding:'13px 20px', borderRadius:14, border:'none',
                  background:'linear-gradient(135deg,#C9973A,#E8B84B)', color:'#0A0A14',
                  fontSize:15, fontWeight:700, cursor:'pointer' }}>
                Book Dine Concierge® →
              </button>
            </div>
            <DineConciergeSection pet={currentPet} />
          </div>
        )}

        {/* ════ TAB 3: 📍 Find Restaurants ════ */}
        {mainDineTab === 'nearme' && (
          <div style={{ padding:'16px 16px 24px' }}>
            <PetFriendlySpots
              pet={currentPet}
              onReserve={venueName => {
                tdc.request(`Reserve dining venue for ${petName}: ${venueName}`, {
                  pillar:'dine', channel:'dine_nearme', pet:currentPet,
                  metadata:{ venue:venueName }
                });
                setPrefillVenue(venueName);
                setIntakeOpen(true);
              }}
            />
          </div>
        )}

        {/* ── Concierge® CTA — bottom (always visible) ── */}
        <DineConciergeCard pet={currentPet} onOpen={() => setIntakeOpen(true)} />

      </div>

      {/* MiraPlanModal — Food Plan */}
      <MiraPlanModal
        isOpen={showDinePlan}
        onClose={() => setShowDinePlan(false)}
        pet={currentPet}
        pillar="dine"
        token={token}
      />
      <ConciergeRequestBuilder
        pet={currentPet}
        token={token}
        isOpen={conciergeBuilderOpen}
        onClose={() => setConciergeBuilderOpen(false)}
      />

    </PillarPageLayout>
  );
}
