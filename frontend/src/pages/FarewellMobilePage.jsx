/**
 * FarewellMobilePage.jsx — /farewell (mobile)
 * 3-tab layout: Memorial & Grief | Get Support | Find Care
 * Colour: Deep Midnight #1A1A2E + Soft Indigo #6366F1
 * The most sacred pillar. For Mystique, and every beloved dog.
 */
import PillarConciergeCards from '../components/common/PillarConciergeCards';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import { tdc } from '../utils/tdc_intent';
import { API_URL } from '../utils/api';
import { applyMiraFilter, filterBreedProducts, excludeCakeProducts} from '../hooks/useMiraFilter';
import MiraPlanModal from '../components/mira/MiraPlanModal';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import GuidedFarewellPaths from '../components/farewell/GuidedFarewellPaths';
import FarewellNearMe from '../components/farewell/FarewellNearMe';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
import PillarCategoryStrip from '../components/common/PillarCategoryStrip';
import PillarServiceSection from '../components/PillarServiceSection';
import PillarHero from '../components/PillarHero';
import '../styles/mobile-design-system.css';
import ConciergeRequestBuilder from '../components/services/ConciergeRequestBuilder';

const FAREWELL_STRIP_CATS = [
  { id:"eol",      icon:"🕊️", label:"End of Life",      iconBg:"linear-gradient(135deg,#EEF2FF,#E0E7FF)" },
  { id:"support",  icon:"💙", label:"Support",           iconBg:"linear-gradient(135deg,#EFF6FF,#DBEAFE)" },
  { id:"cremation",icon:"🌿", label:"Cremation",         iconBg:"linear-gradient(135deg,#F0FDF4,#DCFCE7)" },
  { id:"memorial", icon:"🌷", label:"Memorial",          iconBg:"linear-gradient(135deg,#FDF2F8,#FCE7F3)" },
  { id:"ceremony", icon:"🕯️", label:"Ceremony",          iconBg:"linear-gradient(135deg,#FFFBEB,#FEF3C7)" },
  { id:"grief",    icon:"💜", label:"Grief Support",     iconBg:"linear-gradient(135deg,#FAF5FF,#EDE9FE)" },
  { id:"tribute",  icon:"✦",  label:"Soul Made™",        iconBg:"linear-gradient(135deg,#F8FAFC,#F1F5F9)" },
];

const G = {
  deep:'#1A1A2E', mid:'#4B4B6E', indigo:'#6366F1', light:'#C7D2FE',
  pale:'#EEF2FF', cream:'#F8F9FF', dark:'#0A0A1E',
  darkText:'#1A1A2E', mutedText:'#4B4B6E',
  border:'rgba(99,102,241,0.18)',
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.farewell-m{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.farewell-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.mid},${G.indigo});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.farewell-cta:active{transform:scale(0.97)}
.farewell-tab{flex:1;padding:12px 4px;background:none;border:none;border-bottom:2.5px solid transparent;font-size:14px;font-weight:500;color:#999;cursor:pointer;transition:all 0.15s;white-space:nowrap;font-family:inherit}
.farewell-tab.active{color:${G.indigo};border-bottom-color:${G.indigo};font-weight:700}`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='medium'?[12]:[6]); }

const FAREWELL_SERVICES = [
  { id:"eol_planning",  icon:"🕊️", name:"End-of-Life Care Planning",     tagline:"Quality of life, with dignity",     desc:"Mira guides quality-of-life conversations with your vet — pain management, dignity, and timing." },
  { id:"euthanasia",    icon:"💙", name:"Euthanasia Support & Guidance", tagline:"When the time comes",               desc:"Gentle guidance through the decision and process — what to expect, how to say goodbye, how to be present." },
  { id:"cremation",     icon:"🌿", name:"Cremation Arrangement",         tagline:"Handled with care",                 desc:"Concierge® arranges the full cremation — collection, service, and return of remains — with complete dignity." },
  { id:"memorial",      icon:"🌷", name:"Memorial Product Creation",      tagline:"A tribute as unique as they were", desc:"Paw print casting, memory box, custom portrait, engraved stone — we create a lasting tribute." },
  { id:"ceremony",      icon:"🕯️", name:"Rainbow Bridge Ceremony",        tagline:"A send-off with love",             desc:"A gentle farewell ceremony at home or at a partner location — readings, flowers, paw print, and space to grieve." },
  { id:"grief_counsel", icon:"💜", name:"Grief Counselling Referral",     tagline:"Your grief is real and valid",     desc:"Mira connects you with a pet grief counsellor — because the loss of a dog is the loss of unconditional love." },
];


const PROD_TABS = ["Memorial & Grief", "Keepsakes", "Final Care"];

// ─── FarewellContentModal ──────────────────────────────────────────────────
// Opens when category strip pill is tapped
// Each category shows: products + services + Concierge® CTA
function FarewellContentModal({ isOpen, onClose, category, pet, token, services, onBook }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('products');
  const [selProd, setSelProd] = useState(null);
  const petName = pet?.name || 'your dog';

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => { setTab('products'); setProducts([]); }, [category]);

  const CAT_MAP = {
    memorial:  'memorial',
    tribute:   'memorial',
    grief:     'Grief & Healing',
    cremation: 'Cremation & Burial',
    eol:       'memorial',
    support:   'memorial',
    ceremony:  'memorial',
  };

  const MIRA_QUOTES = {
    memorial:  `Every detail of ${petName}'s memorial is handled with the love they deserve.`,
    tribute:   `A tribute as unique as ${petName} — made by hand, kept forever.`,
    grief:     `Your grief is real. Losing ${petName} is losing unconditional love. You don't have to do this alone.`,
    cremation: `Concierge® handles everything with complete dignity — collection, service, and the return of ${petName}.`,
    eol:       `I'll help you navigate this time with ${petName} — gently, honestly, and without pressure.`,
    support:   `Whatever ${petName} needs right now — comfort, care, or just someone to talk to — I'm here.`,
    ceremony:  `A gentle send-off for ${petName}, held with love — at home or at a partner location.`,
  };

  const SVC_MAP = {
    cremation: ['cremation'],
    ceremony:  ['ceremony', 'rainbow'],
    grief:     ['grief'],
    eol:       ['eol', 'euthanasia'],
    support:   ['eol', 'euthanasia', 'grief'],
    memorial:  ['memorial'],
    tribute:   ['memorial'],
  };

  const catCfg = FAREWELL_STRIP_CATS.find(c => c.id === category) || {};
  const dbCat = CAT_MAP[category] || 'memorial';
  const miraQuote = MIRA_QUOTES[category] || `For ${petName}, with love.`;
  const svcKeys = SVC_MAP[category] || [];
  const dimServices = services.filter(s =>
    svcKeys.some(k => (s.id||'').includes(k) || (s.name||'').toLowerCase().includes(k))
  );

  useEffect(() => {
    if (!isOpen || !category) return;
    setLoading(true);
    fetch(`${API_URL}/api/admin/pillar-products?pillar=farewell&category=${encodeURIComponent(dbCat)}&limit=60`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setProducts(filterBreedProducts(d?.products || [], pet?.breed)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [isOpen, category, pet?.breed]);

  if (!isOpen) return null;

  const tabs = [
    { id:'products', label:'🎁 Products' },
    { id:'services', label:'🐕 Services' },
    { id:'find',     label:'📍 Find Care' },
  ];

  return (
    <div onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:9999,
        background:'rgba(0,0,0,0.72)', display:'flex',
        flexDirection:'column', justifyContent:'flex-end' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:'#fff', borderRadius:'24px 24px 0 0',
          maxHeight:'88vh', display:'flex', flexDirection:'column',
          overflowY:'hidden' }}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${G.dark},${G.mid})`,
          borderRadius:'24px 24px 0 0', padding:'20px 20px 16px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:12,
                background:'rgba(255,255,255,0.12)', display:'flex',
                alignItems:'center', justifyContent:'center', fontSize:22 }}>
                {catCfg.icon}
              </div>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:'#fff', lineHeight:1.1 }}>{catCfg.label}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:2 }}>For {petName}</div>
              </div>
            </div>
            <button onClick={onClose}
              style={{ background:'rgba(255,255,255,0.12)', border:'none',
                borderRadius:'50%', width:32, height:32, display:'flex',
                alignItems:'center', justifyContent:'center',
                color:'rgba(255,255,255,0.8)', fontSize:16, cursor:'pointer' }}>✕</button>
          </div>
          <div style={{ display:'flex', gap:8, background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 12px' }}>
            <div style={{ width:20, height:20, borderRadius:'50%',
              background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:9, color:'#fff', flexShrink:0, marginTop:1 }}>✦</div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.8)', fontStyle:'italic', margin:0, lineHeight:1.5 }}>
              "{miraQuote}"
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', borderBottom:`1px solid ${G.border}`, background:'#fff', flexShrink:0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, padding:'11px 4px', background:'none', border:'none',
                borderBottom:tab===t.id?`2.5px solid ${G.indigo}`:'2.5px solid transparent',
                color:tab===t.id?G.indigo:'#888', fontSize:12,
                fontWeight:tab===t.id?700:400, cursor:'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 32px',
          overscrollBehavior:'contain', WebkitOverflowScrolling:'touch' }}>

          {tab === 'products' && (
            <>
              {loading && <div style={{ textAlign:'center', padding:'32px 0', color:G.mutedText }}>Loading…</div>}
              {!loading && products.length === 0 && (
                <div style={{ textAlign:'center', padding:'32px 0' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>🌷</div>
                  <div style={{ fontSize:14, color:G.mutedText }}>Products for {catCfg.label} are being added — check back soon.</div>
                  <button onClick={() => { onClose(); onBook({ name:`${catCfg.label} arrangement`, id:category }); }}
                    style={{ marginTop:16, padding:'12px 24px', borderRadius:14, border:'none',
                      background:`linear-gradient(135deg,${G.mid},${G.indigo})`,
                      color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                    Ask Concierge® to arrange →
                  </button>
                </div>
              )}
              {!loading && products.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(160px,100%),1fr))', gap:12 }}>
                  {products.map(p => (
                    <SharedProductCard key={p.id||p._id} product={p} pillar="farewell"
                      selectedPet={pet} onViewDetails={() => setSelProd(p)} />
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'services' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {(dimServices.length === 0 ? FAREWELL_SERVICES : dimServices).map(svc => (
                <div key={svc.id}
                  style={{ background:G.pale, borderRadius:16, padding:'16px 18px', border:`1px solid ${G.border}` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{ fontSize:24, flexShrink:0 }}>{svc.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:3 }}>{svc.name}</div>
                      <div style={{ fontSize:12, color:G.mutedText, lineHeight:1.5, marginBottom:10 }}>
                        {svc.desc || svc.description || svc.tagline}
                      </div>
                      <button onClick={() => onBook(svc)}
                        style={{ padding:'9px 18px', borderRadius:12, border:'none',
                          background:`linear-gradient(135deg,${G.mid},${G.indigo})`,
                          color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                        Arrange for {petName} →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'find' && <FarewellNearMe currentPet={pet} />}
        </div>
      </div>

      {selProd && (
        <ProductDetailModal product={selProd} pillar="farewell"
          selectedPet={pet} onClose={() => setSelProd(null)} />
      )}
    </div>
  );
}

export default function FarewellMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'farewell', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'farewell' });
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [showFarewellPlan, setShowFarewellPlan] = useState(false);
  const [activeTab, setActiveTab] = useState("farewell");
  const contentRef = useRef(null);   // scroll to content when category strip chip clicked
  useEffect(() => {
    if (contentRef.current) setTimeout(() => contentRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
  }, [activeTab]);
  const [farewellMode, setFarewellMode] = useState('here'); // 'here' | 'time'
  const [conciergeBuilderOpen, setConciergeBuilderOpen] = useState(false);
  const [prodTab, setProdTab] = useState(PROD_TABS[0]);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [catModal, setCatModal] = useState(null);
  const [selectedSvc, setSelectedSvc] = useState(null);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  // Safety: stop loading after 3 seconds even if context never resolves
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Always fetch farewell products — breed filter applied client-side after
    const breedParam = currentPet?.breed ? `&breed=${encodeURIComponent(currentPet.breed)}` : '';
    fetch(`${API_URL}/api/admin/pillar-products?pillar=farewell&limit=200${breedParam}`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.products) return;
        const base = excludeCakeProducts(d.products);
        // Apply breed+Mira filtering only when a pet is selected
        setProducts(currentPet ? applyMiraFilter(filterBreedProducts(base, currentPet.breed), currentPet) : base);
      })
      .catch(() => {});
    // Fetch farewell services from Service Box API
    fetch(`${API_URL}/api/service-box/services?pillar=farewell&limit=20`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.services?.length) setServices(d.services); })
      .catch(() => {});
  }, [currentPet?.id, token]);

  const handleAddToCart = useCallback(p => {
    addToCart({ id:p.id||p._id, name:p.name, price:p.price||0, image:p.image_url||p.images?.[0], pillar:'farewell', quantity:1 });
  }, [addToCart]);

  const handleBookService = (svc) => {
    vibe('medium');
    tdc.book({ service:svc.name, pillar:'farewell', pet:currentPet, channel:'farewell_service_card' });
    setSelectedSvc(svc);
    setConciergeOpen(true);
  };

  if (loading) return (
    <PillarPageLayout pillar="farewell" hideHero hideNavigation>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>🌷</div><div>Preparing farewell space…</div></div>
      </div>

      <ConciergeRequestBuilder
        pet={currentPet}
        token={token}
        isOpen={conciergeBuilderOpen}
        onClose={() => setConciergeBuilderOpen(false)}
      />
    </PillarPageLayout>
  );

  const petName = currentPet?.name || 'your dog';
  const breed = (currentPet?.breed || "").split("(")[0].trim();

  // Filter products by sub-tab + farewellMode
  const filteredProducts = farewellMode === 'here'
    ? products.filter(p => {
        const n = (p.name || '').toLowerCase();
        return n.includes('paw') || n.includes('print') || n.includes('portrait') || n.includes('photo') || n.includes('memory') || n.includes('book') || n.includes('frame') || n.includes('bandana') || products.indexOf(p) < 8;
      })
    : products.filter(p => {
        const n = (p.name || "").toLowerCase();
        if (prodTab === "Memorial & Grief") return n.includes("urn") || n.includes("memorial") || n.includes("paw") || n.includes("print") || n.includes("portrait") || n.includes("memory") || n.includes("tribute") || products.indexOf(p) < 8;
        if (prodTab === "Keepsakes") return n.includes("grief") || n.includes("book") || n.includes("journal") || n.includes("comfort") || n.includes("frame") || n.includes("ornament") || products.indexOf(p) < 8;
        return true;
      });

  return (
    <PillarPageLayout pillar="farewell" hideHero hideNavigation>
      <div className="farewell-m mobile-page-container" data-testid="farewell-mobile">
        <style>{CSS}</style>

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="farewell" pillarColor={G.indigo} pillarLabel="Farewell" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct?.raw || selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.indigo} />}

        {/* Hero */}
        <PillarHero
          pillar="farewell"
          pet={currentPet}
          allPets={contextPets || []}
          onSwitchPet={p => { vibe(); setCurrentPet(p); }}
          gradient={`linear-gradient(160deg,${G.dark} 0%,${G.deep} 55%,${G.mid} 100%)`}
          title="🌷 Farewell"
          subtitle={`Every moment with ${petName} is a gift`}
          tagline="Capture memories now. And when the time comes — we hold your hand through every step."
        />

        {/* Farewell Category Strip — always visible above tabs */}
        <PillarCategoryStrip
          categories={FAREWELL_STRIP_CATS}
          activeId={null}
          onSelect={id => {
            vibe();
            setCatModal(id);
          }}
          accentColor={G.indigo}
        />

        {/* Tab Bar — sticky */}
        <div className="ios-tab-bar">
          {[
            { id:'farewell',  label:'🌷 Farewell' },
            { id:'services',  label:'🐕 Services' },
            { id:'find',      label:'📍 Find Care' },
          ].map(tab => (
            <button key={tab.id}
              className={`ios-tab${activeTab===tab.id?' active':''}`}
              style={activeTab===tab.id ? { backgroundColor:G.dark, color:'#fff' } : {}}
              data-testid={`farewell-tab-${tab.id}`}
              onClick={() => { vibe(); setActiveTab(tab.id); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content — scrolls into view when category strip chip is tapped */}
        <div ref={contentRef} style={{ scrollMarginTop: 72 }}>

        {/* TAB 1: Memorial & Grief */}
        {activeTab === 'farewell' && (
          <div>
            {/* Mode Toggle — While here vs When the time comes */}
            <div style={{ display:'flex', margin:'12px 16px 0', background:'rgba(99,102,241,0.08)', borderRadius:14, padding:4 }}>
              {[
                { id:'here', label:"🌸 While they're still here" },
                { id:'time', label:'🕊️ When the time comes' },
              ].map(m => (
                <button key={m.id} onClick={() => { vibe(); setFarewellMode(m.id); }}
                  data-testid={`farewell-mode-${m.id}`}
                  style={{ flex:1, padding:'10px 8px', borderRadius:11, border:'none', fontSize:12, fontWeight:700,
                    cursor:'pointer', textAlign:'center', transition:'all 0.2s',
                    background: farewellMode===m.id ? G.indigo : 'transparent',
                    color: farewellMode===m.id ? '#fff' : G.mutedText }}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Soul Profile + CTA + Pawrent — inside Tab 1 */}
            {currentPet && <div style={{ padding:'16px 16px 0' }}><PillarSoulProfile pet={currentPet} pillar="farewell" token={token} /></div>}
            {currentPet && (
              <div style={{ margin:'12px 16px 0', background:'linear-gradient(135deg,rgba(129,140,248,0.14),rgba(129,140,248,0.20))', border:'1px solid rgba(129,140,248,0.35)', borderRadius:18, padding:'16px' }}>
                <div style={{ fontSize:18, fontWeight:700, color:'#1A0A2E', lineHeight:1.25, marginBottom:4 }}>
                  Honouring <span style={{ color:'#4F46E5' }}>{petName}</span> — every memory held gently.
                </div>
                <div style={{ fontSize:13, color:'#4B5563', lineHeight:1.5 }}>
                  Urns, paw prints, memorial portraits and keepsakes — crafted with love, whenever you're ready.
                </div>
              </div>
            )}
            {currentPet && <div style={{ padding:'0 16px 8px' }}><PawrentFirstStepsTab pet={currentPet} token={token} currentPillar="farewell" /></div>}
            <div style={{ margin:'16px 16px 0', background:G.dark, borderRadius:20, padding:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(199,210,254,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>
                {farewellMode === 'here' ? `✦ WHILE ${petName.toUpperCase()} IS STILL HERE` : '✦ A MESSAGE FROM MIRA'}
              </div>
              {farewellMode === 'here' ? (
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.80)', lineHeight:1.7, fontStyle:'italic', marginBottom:14 }}>
                  "Every day with {petName} is a gift. When you're ready, we'll help you capture their memory — in paw prints, portraits, and pieces that last forever."
                </div>
              ) : (
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.80)', lineHeight:1.7, fontStyle:'italic', marginBottom:14 }}>
                  "You don't have to figure this out alone. Whatever you need for {petName}, I'll help hold every detail gently. 🌷"
                </div>
              )}
              <button className="farewell-cta" onClick={() => { vibe('medium'); setShowFarewellPlan(true); }}>
                {farewellMode === 'here' ? `Capture ${petName}'s Story →` : `Build ${petName}'s Farewell Plan →`}
              </button>
            </div>

            {/* Product Sub-tabs */}
            <div style={{ display:'flex', gap:6, padding:'16px 16px 8px', overflowX:'auto' }}>
              {PROD_TABS.map(t => (
                <button key={t} onClick={() => setProdTab(t)}
                  style={{ flexShrink:0, padding:'7px 14px', borderRadius:20, fontSize:14, fontWeight:600,
                    border:`1.5px solid ${prodTab===t?G.indigo:G.border}`,
                    background:prodTab===t?G.indigo:'#fff',
                    color:prodTab===t?'#fff':G.mutedText, cursor:'pointer' }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Products */}
            {(filteredProducts.length > 0 ? filteredProducts : products).length > 0 && (
              <div style={{ padding:'0 16px 24px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {(filteredProducts.length > 0 ? filteredProducts : products).slice(0, 16).map(p => (
                    <SharedProductCard key={p.id||p._id||p.name} product={p} pillar="farewell" selectedPet={currentPet}
                      onAddToCart={() => handleAddToCart(p)}
                      onClick={() => { vibe(); setSelectedProduct(p); }} />
                  ))}
                </div>
              </div>
            )}

            {/* Guided Farewell Paths */}
            {currentPet && <div style={{ padding:'0 16px 24px' }}><GuidedFarewellPaths pet={currentPet} /></div>}

            {/* Mira Imagines */}
            {currentPet && (
              <div style={{ padding:'0 16px 24px' }}>
                {[
                  { id:'f-1', emoji:'🐾', name:`${petName}'s Paw Print Kit`, description:`Air-dry clay + ink pad — a permanent impression of ${breed||petName}'s paw to keep always.` },
                  { id:'f-2', emoji:'📖', name:`${petName}'s Memory Journal`, description:`A guided grief journal — ${petName}'s story in your words, kept forever.` },
                  { id:'f-3', emoji:'🌿', name:`${petName}'s Living Memorial`, description:`Biodegradable urn that grows into a tree or flowers — ${breed||petName} lives on.` },
                ].map(item => <MiraImaginesCard key={item.id} item={item} pet={currentPet} token={token} pillar="farewell" />)}
              </div>
            )}

            {/* SoulMade */}
            <div style={{ margin:'0 16px 24px', background:G.dark, borderRadius:20, padding:18, cursor:'pointer' }} onClick={() => setSoulMadeOpen(true)}>
              <div style={{ fontSize:14, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:8 }}>✦ SOUL MADE™ · A TRIBUTE ONLY {petName.toUpperCase()} COULD INSPIRE</div>
              <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>{petName}'s face, immortalised in art.</div>
              <button className="farewell-cta">Create a tribute for {petName} →</button>
            </div>
          </div>
        )}

        {/* TAB 2: Get Support */}
        {activeTab === 'services' && (
          <>
          <PillarConciergeCards pillar="farewell" pet={currentPet} token={token} />
          {/* Mode-aware services intro */}
          <div style={{ padding:'16px 16px 8px' }}>
            <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:4 }}>
              {farewellMode === 'here' ? `Honouring ${petName}'s life, gently` : `Gentle support, whenever you're ready`}
            </div>
            <div style={{ fontSize:13, color:G.mutedText }}>
              {farewellMode === 'here'
                ? 'Paw prints, memory boxes and keepsakes — held with care, for whenever you need them.'
                : 'Everything arranged with compassion — euthanasia guidance, cremation, ceremony, grief support.'}
            </div>
          </div>

      {/* Concierge® Request Builder */}
      <div style={{ padding:'0 16px 16px' }}>
        <button
          onClick={() => setConciergeBuilderOpen(true)}
          style={{ width:'100%', minHeight:52, borderRadius:16, border:'none',
            background:'linear-gradient(135deg,#0A0A14,#1A1A2E)',
            color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>✦</span>
          <span>What does {petName} need? Ask Concierge®</span>
        </button>
      </div>
          <div style={{ padding:'16px 16px 24px' }}>
            {/* ── Bespoke Concierge Builder CTA ── */}
            <div style={{ background:'#0A0A1E', borderRadius:20, padding:16, marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'rgba(201,151,58,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ BESPOKE REQUESTS</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14 }}>
                Memorial services, grief support, paw prints, tributes — gently arranged for your family.
              </div>
              <button onClick={() => setConciergeBuilderOpen(true)} data-testid="farewell-concierge-builder-btn"
                style={{ width:'100%', padding:'13px 20px', borderRadius:14, border:'1px solid rgba(99,102,241,0.35)', background:'linear-gradient(135deg,#0A0A1E,#1E1B4B)', color:'#A5B4FC', fontSize:15, fontWeight:700, cursor:'pointer' }}>
                ✦ Bespoke Requests →
              </button>
            </div>
            <PillarServiceSection
              pillar="farewell"
              pet={currentPet}
              title="Farewell Support, Personally"
              accentColor={G.indigo}
              darkColor={G.dark}
              isMobile
            />
          </div>
          </>
        )}

        {/* TAB 3: Find Care */}
        {activeTab === 'find' && (
          <div style={{ padding:'16px' }}>
            <FarewellNearMe pet={currentPet} onBook={place => {
              tdc.request(`Farewell care: ${place}`, { pillar:'farewell', channel:'farewell_nearme', pet:currentPet });
            }} />
          </div>
        )}

        {/* Concierge® Confirmation Sheet */}
        {conciergeOpen && selectedSvc && (
          <div onClick={() => setConciergeOpen(false)} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', padding:'24px 20px 40px' }}>
              <div style={{ fontSize:28, textAlign:'center', marginBottom:12 }}>{selectedSvc.icon}</div>
              <div style={{ fontSize:18, fontWeight:700, color:G.darkText, textAlign:'center', marginBottom:8 }}>{selectedSvc.name}</div>
              <div style={{ fontSize:14, color:'#555', textAlign:'center', lineHeight:1.7, fontStyle:'italic', marginBottom:20 }}>Concierge® will reach you gently within 48 hours. No rush — whenever you're ready.</div>
              <button onClick={() => setConciergeOpen(false)} style={{ width:'100%', minHeight:48, borderRadius:14, border:'none', background:`linear-gradient(135deg,${G.mid},${G.indigo})`, color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer' }}>
                Thank you ♥
              </button>
            </div>
          </div>
        )}
      </div>
      <MiraPlanModal
        isOpen={showFarewellPlan}
        onClose={() => setShowFarewellPlan(false)}
        pet={currentPet}
        pillar="farewell"
        token={token}
      />
    </div>{/* end contentRef wrapper */}

    <FarewellContentModal
      isOpen={!!catModal}
      onClose={() => setCatModal(null)}
      category={catModal}
      pet={currentPet}
      token={token}
      services={services}
      onBook={handleBookService}
    />
    </PillarPageLayout>
  );
}
