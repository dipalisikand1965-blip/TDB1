/**
 * GoMobilePage.jsx — /go (mobile)
 * 3-tab layout: Go & Products | Services | Stay
 * Products tab: dimTab (Products/Personalised) + sub-category pills
 * Colour: Teal #1ABC9C
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import { tdc } from '../utils/tdc_intent';
import { API_URL } from '../utils/api';
import ServiceBookingModal, { guessServiceType } from '../components/ServiceBookingModal';
import { applyMiraFilter, filterBreedProducts, excludeCakeProducts} from '../hooks/useMiraFilter';
import MiraEmptyRequest from '../components/common/MiraEmptyRequest';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import GoConciergeSection from '../components/go/GoConciergeSection';
import GoCategoryStrip from '../components/go/GoCategoryStrip';
import { getGoDims, DimExpanded, MiraPicksSection, GO_SERVICES, ServiceBookingModal as GoServiceBookingModal } from './GoSoulPage';
import GoNearMe from '../components/go/GoNearMe';
import PetFriendlyStays from '../components/go/PetFriendlyStays';
import GuidedGoPaths from '../components/go/GuidedGoPaths';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import MiraPlanModal from '../components/mira/MiraPlanModal';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
import NearMeConciergeModal from '../components/common/NearMeConciergeModal';
import '../styles/mobile-design-system.css';

const G = {
  teal:'#1ABC9C', mid:'#0E8A70', deep:'#06503F', light:'#A7F3D0',
  pale:'#ECFDF5', cream:'#F0FDFA', dark:'#03211A',
  darkText:'#064E3B', mutedText:'#1ABC9C',
  border:'rgba(26,188,156,0.18)',
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.go-m{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.go-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.mid},${G.teal});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.go-cta:active{transform:scale(0.97)}
.go-tab{flex:1;padding:12px 4px;background:none;border:none;border-bottom:2.5px solid transparent;font-size:14px;font-weight:500;color:#999;cursor:pointer;transition:all 0.15s;white-space:nowrap;font-family:inherit}
.go-tab.active{color:${G.teal};border-bottom-color:${G.teal};font-weight:700}`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='medium'?[12]:[6]); }

function getAllergies(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => { if (x && !['none','no allergies','nil','n/a'].includes(String(x).toLowerCase().trim())) s.add(String(x).trim()); });
    else if (v && !['none','no allergies','nil','n/a'].includes(String(v).toLowerCase().trim())) { String(v).split(',').forEach(a => { const t = a.trim(); if (t) s.add(t); }); }
  };
  add(pet?.allergies);
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.doggy_soul_answers?.allergies);
  return [...s];
}
function getHealthCondition(pet) { return pet?.health_condition || pet?.medical_condition || null; }
function applyMiraIntelligence(products, allergies) {
  if (!allergies?.length) return products;
  return products.filter(p => {
    const text = `${p.name} ${p.description || ''}`.toLowerCase();
    for (const a of allergies) { if (text.includes(a.toLowerCase()) && !text.includes('free')) return false; }
    return true;
  });
}

const GO_IMAGINES = [
  { id:'g-1', emoji:'🎒', name:'Travel Essentials Kit', description:'Collapsible bowl, portable water bottle, poop bags, travel bed — everything for on the go.' },
  { id:'g-2', emoji:'🏨', name:'Pet-Friendly Hotel Guide', description:'Curated list of 50+ pet-friendly properties in India — with size and breed acceptance info.' },
  { id:'g-3', emoji:'🛂', name:'Travel Document Checklist', description:'Health certificate, microchip record, NOC, airline-approved carrier checklist — all in one place.' },
];

export default function GoMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'go', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'go' });
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('go');
  const [dimTab, setDimTab] = useState('products');
  const [subCat, setSubCat] = useState('All');
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [allRaw, setAllRaw] = useState([]);
  const [svcBooking, setSvcBooking] = useState({ isOpen: false, serviceType: 'boarding' });
  const [nearMeConc, setNearMeConc] = useState({ open: false, venue: null });
  const [goSvc, setGoSvc]           = useState(null); // for Go, Personally 8-flow modal
  const [showGoPlan, setShowGoPlan] = useState(false);
  const [openDim, setOpenDim] = useState(null);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (!currentPet?.id) return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=go&limit=200&breed=${encodeURIComponent(currentPet?.breed||'')}`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.products) setAllRaw(filterBreedProducts(excludeCakeProducts(d.products), currentPet?.breed)); })
      .catch(() => {});
  }, [currentPet?.id, token]);

  const handleAddToCart = useCallback(p => {
    addToCart({ id:p.id||p._id, name:p.name, price:p.price||0, image:p.image_url||p.images?.[0], pillar:'go', quantity:1 });
  }, [addToCart]);

  if (loading) return (
    <PillarPageLayout pillar="go" hideHero hideNavigation>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>✈️</div><div>Loading travel products…</div></div>
      </div>
    </PillarPageLayout>
  );

  const petName = currentPet?.name || 'your dog';
  const allergies = getAllergies(currentPet);
  const intelligent = applyMiraFilter(allRaw, currentPet);
  const subCats = ['All', ...new Set(intelligent.map(p => p.sub_category).filter(Boolean))];
  const products = subCat === 'All' ? intelligent : intelligent.filter(p => p.sub_category === subCat);
  const miraPick = products.find(p => p.miraPick) || products[0] || null;

  return (
    <PillarPageLayout pillar="go" hideHero hideNavigation>
      <div className="go-m mobile-page-container" data-testid="go-mobile">
        <style>{CSS}</style>

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="go" pillarColor={G.teal} pillarLabel="Go" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct?.raw || selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.teal} />}

        {/* ── Hero — simple, matches Care pattern ── */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.deep} 55%,${G.mid} 100%)`, padding:'40px 20px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.55)', letterSpacing:'0.14em', marginBottom:4 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-0.5px' }}>✈️ Go</div>
            </div>
            {contextPets?.length > 1 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
                {contextPets.map(p => (
                  <button key={p.id} onClick={() => { vibe(); setCurrentPet(p); }}
                    style={{ padding:'6px 16px', borderRadius:999, fontSize:13, fontWeight:700, cursor:'pointer',
                      border: currentPet?.id===p.id ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.3)',
                      background: currentPet?.id===p.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                      color:'#fff', fontFamily:'inherit', transition:'all 0.15s' }}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>Travel & Go with {petName}</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.65)' }}>Flights, road trips, boarding, pet-friendly stays.</div>
        </div>

        {/* ══ 2. GoCategoryStrip ══ */}
        <GoCategoryStrip pet={currentPet} />

        {/* ══ 3. Tab Bar ══ */}
        <div className="ios-tab-bar">
          {[
            { id:'go',       label:'✈️ Go' },
            { id:'nearme',   label:'📍 Find & Stay' },
            { id:'services', label:'🐕 Services' },
          ].map(tab => (
            <button key={tab.id}
              className={`ios-tab${activeTab===tab.id?' active':''}`}
              style={activeTab===tab.id ? { backgroundColor:G.dark, color:'#fff' } : {}}
              data-testid={`go-tab-${tab.id}`}
              onClick={() => { vibe(); setActiveTab(tab.id); setSubCat('All'); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Go & Products */}
        {activeTab === 'go' && (
          <div>
            {currentPet && <div style={{ padding:'16px 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="go" token={token} /></div>}
            {currentPet && <PawrentFirstStepsTab pet={currentPet} token={token} currentPillar="go" defaultCollapsed={true} />}

            {/* ══ Mira Picks Strip — AI Scored, same as Care ══ */}
            <div style={{ padding:'16px 16px 0' }}>
              <MiraPicksSection pet={currentPet} />
            </div>

            {/* ══ Mira intelligence bar ══ */}
            <div style={{ margin:'16px 16px 0', background:G.dark, borderRadius:20, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:`rgba(167,243,208,0.9)`, letterSpacing:'0.1em', marginBottom:6 }}>✦ MIRA ON {petName.toUpperCase()}'S TRAVEL</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, fontStyle:'italic' }}>
                {allergies.length > 0
                  ? `"I've already removed everything containing ${allergies.join(' and ')} from ${petName}'s travel picks."`
                  : `"Every journey with ${petName} needs the right gear and the right plan. I'll handle both."`}
              </div>
            </div>

            <div style={{ padding:'16px' }}>
              {/* ── 6 Go Dimensions ── */}
              {(() => {
                const goDims = getGoDims(currentPet);
                return (
                  <>
                    {/* Section heading */}
                    <div style={{ marginBottom:4 }}>
                      <span style={{ fontSize:22, fontWeight:900, color:G.darkText }}>Go </span>
                      <span style={{ fontSize:22, fontWeight:900, color:G.teal }}>for {petName}</span>
                    </div>
                    <div style={{ fontSize:13, color:G.mutedText, marginBottom:12 }}>
                      6 dimensions, matched to {petName}'s size and travel profile
                    </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                        {goDims.map(dim => (
                          <div key={dim.id} onClick={() => setOpenDim(openDim === dim.id ? null : dim.id)}
                            style={{ background: dim.glow ? G.pale : '#fff', border:`1.5px solid ${openDim===dim.id ? G.teal : G.border}`, borderRadius:14, padding:'14px 12px', cursor:'pointer', textAlign:'center', boxShadow: dim.glow ? `0 4px 16px rgba(26,188,156,0.15)` : 'none', position:'relative' }}>
                            {dim.glow && <div style={{ position:'absolute', top:8, right:8, width:7, height:7, borderRadius:'50%', background:G.teal, boxShadow:`0 0 6px ${G.teal}` }} />}
                            <div style={{ fontSize:26, marginBottom:6 }}>{dim.icon}</div>
                            <div style={{ fontSize:13, fontWeight:800, color:G.darkText, marginBottom:3 }}>{dim.label}</div>
                            <div style={{ fontSize:11, color:G.mutedText, lineHeight:1.3 }}>{typeof dim.sub==='string' ? dim.sub.replace(/{name}/g, petName) : ''}</div>
                            {dim.badge && <div style={{ display:'inline-flex', marginTop:6, background:dim.badgeBg, color:'#fff', borderRadius:20, padding:'2px 8px', fontSize:9, fontWeight:700 }}>{dim.badge}</div>}
                          </div>
                        ))}
                      </div>
                      {openDim && (() => {
                        const activeDim = goDims.find(d => d.id === openDim);
                        return activeDim ? (
                          <div onClick={() => setOpenDim(null)} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.65)', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'20px 20px 0 0', maxHeight:'88vh', overflowY:'auto' }}>
                              <DimExpanded dim={activeDim} pet={currentPet} onClose={() => setOpenDim(null)} apiProducts={Object.fromEntries(
                                ['safety','calming','carriers','feeding','health','stay'].map(dimId => {
                                  const keywords = {
                                    safety:   ['safety'],
                                    calming:  ['calm', 'anxiety', 'comfort', 'thunder', 'pheromone'],
                                    carriers: ['carrier'],
                                    feeding:  ['feed'],
                                    health:   ['health'],
                                    stay:     ['boarding','stay'],
                                  }[dimId] || [];
                                  const filtered = allRaw.filter(p => {
                                    const txt = `${p.name} ${p.category} ${p.sub_category} ${p.description || ''}`.toLowerCase();
                                    return keywords.some(k => txt.includes(k));
                                  });
                                  // Group by sub_category — DimExpanded expects { [sub_cat]: products[] }
                                  const grouped = {};
                                  filtered.forEach(p => {
                                    const sub = p.sub_category || 'General';
                                    if (!grouped[sub]) grouped[sub] = [];
                                    grouped[sub].push(p);
                                  });
                                  return [dimId, grouped];
                                })
                              )} />
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </>
                  );
                })()}



                {/* GuidedGoPaths — always visible below dims */}

                {/* GuidedGoPaths — always visible below dims */}
                <div style={{ marginTop:16 }}><GuidedGoPaths pet={currentPet} /></div>

                {/* Concierge Banner */}
                <div style={{ marginTop:16, background:G.dark, borderRadius:20, padding:18 }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(20,184,166,0.18)', border:'1px solid rgba(20,184,166,0.4)', borderRadius:999, padding:'5px 14px', fontSize:12, fontWeight:700, color:'#5EEAD4', letterSpacing:'0.08em', marginBottom:12 }}>
                    ✈ TRAVEL CONCIERGE®
                  </div>
                  <div style={{ fontSize:19, fontWeight:700, color:'#fff', lineHeight:1.25, marginBottom:8, fontFamily:"Georgia,'Times New Roman',serif" }}>
                    Want us to plan {petName}'s whole trip?
                  </div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.7, marginBottom:16 }}>
                    We check routes, book stays, arrange transport, and confirm everything is pet-safe before you leave.
                  </div>
                  <button onClick={() => { vibe('medium'); setShowGoPlan(true); }}
                    style={{ width:'100%', minHeight:48, borderRadius:14, border:'none', background:'linear-gradient(135deg,#0F766E,#14B8A6)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
                    ✈ Talk to your Concierge®
                  </button>
                </div>

                {/* Soul Made CTA */}
                <div style={{ marginTop:16, background:G.dark, borderRadius:20, padding:18, cursor:'pointer' }} onClick={() => setSoulMadeOpen(true)}>
                  <div style={{ fontSize:14, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:8 }}>✦ SOUL MADE™ · TRAVEL GEAR FOR {petName.toUpperCase()}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Custom travel tags, bags and accessories.</div>
                  <button className="go-cta">Explore Soul Made →</button>
                </div>
              </div>
          </div>
        )}

        {/* TAB 2: Near Me — unified Stay + GoNearMe */}
        {activeTab === 'nearme' && (
          <div style={{ padding:'16px' }}>
            <div style={{ fontSize:20, fontWeight:700, color:G.darkText, marginBottom:4 }}>
              Find &amp; Stay with {petName}
            </div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:16 }}>
              Pet-friendly stays, boarding, daycare and more — all bookable via Concierge®
            </div>

            {/* Pet-Friendly Stays — Goa, Coorg, Manali etc */}
            <PetFriendlyStays pet={currentPet} token={token} onBook={(stay, query) => {
              if (!stay) {
                setNearMeConc({ open: true, venue: { name: `Pet-Friendly Stay${query ? ` in ${query}` : ''}`, vicinity: query || 'as requested' } });
                return;
              }
              tdc.book({ service:`Stay: ${stay}`, pillar:'go', pet:currentPet, channel:'go_stays' });
              setSvcBooking({ isOpen: true, serviceType: guessServiceType(stay) || 'boarding' });
            }} />

            {/* Divider */}
            <div style={{ margin:'24px 0 16px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1, height:1, background:G.border }} />
              <div style={{ fontSize:12, fontWeight:700, color:G.mutedText, letterSpacing:'0.08em' }}>FIND NEAR YOU</div>
              <div style={{ flex:1, height:1, background:G.border }} />
            </div>

            {/* GoNearMe — Pet Hotels, Boarding, Taxi, Travel Vet, Day Care, Dog Parks */}
            <GoNearMe currentPet={currentPet} />
          </div>
        )}

        {/* TAB 3: Book a Service */}
        {activeTab === 'services' && (
          <div style={{ padding:'16px' }}>
            {/* ── Go, Personally — 8 service tiles ── */}
            <div style={{ marginBottom:28 }}>
              <div style={{ fontSize:20, fontWeight:800, color:G.darkText, fontFamily:'Georgia,serif', marginBottom:4 }}>Go, Personally</div>
              <div style={{ fontSize:13, color:G.mutedText, marginBottom:16 }}>
                Tell us what you want {petName}'s trip to feel like. We'll handle every detail.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {GO_SERVICES.map(svc => {
                  const petName_ = currentPet?.name || 'your dog';
                  return (
                    <div key={svc.id} onClick={() => setGoSvc(svc)}
                      style={{ background:'#fff', borderRadius:14, overflow:'hidden', border:`1px solid ${svc.urgent ? '#FFCDD2' : G.border}`, cursor:'pointer', boxShadow:'0 2px 8px rgba(13,51,73,0.06)' }}>
                      <div style={{ height:100, background:svc.illustrationBg, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                        <span style={{ fontSize:36 }}>{svc.icon}</span>
                        {svc.urgent && <div style={{ position:'absolute', top:6, right:6, background:'#C62828', color:'#fff', fontSize:9, fontWeight:700, borderRadius:20, padding:'2px 7px' }}>URGENT</div>}
                      </div>
                      <div style={{ padding:'10px 12px 14px' }}>
                        {svc.free && <div style={{ display:'inline-block', background:'#E8F5E9', color:'#2E7D32', fontSize:9, fontWeight:700, borderRadius:8, padding:'2px 7px', marginBottom:5 }}>Complimentary</div>}
                        <div style={{ fontSize:10, color:G.mutedText, marginBottom:3 }}>{svc.tagline.replace('{petName}', petName_)}</div>
                        <div style={{ fontSize:13, fontWeight:700, color: svc.urgent ? '#C62828' : G.darkText, lineHeight:1.2, marginBottom:5 }}>{svc.name}</div>
                        <button style={{ fontSize:11, fontWeight:700, color: svc.urgent ? '#C62828' : G.teal, background:'none', border:'none', padding:0, cursor:'pointer' }}>
                          {svc.urgent ? 'Get help now →' : `Book ${svc.steps}-step flow →`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Live API services (GoConciergeSection) below ── */}
            <GoConciergeSection pet={currentPet} />
          </div>
        )}
      </div>

      <ServiceBookingModal
        isOpen={svcBooking.isOpen}
        onClose={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
        serviceType={svcBooking.serviceType}
        onBookingComplete={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
      />

      {nearMeConc.open && nearMeConc.venue && (
        <NearMeConciergeModal
          isOpen={nearMeConc.open}
          venue={nearMeConc.venue}
          pet={currentPet}
          pillar="go"
          onClose={() => setNearMeConc({ open: false, venue: null })}
        />
      )}

      {/* Go, Personally — 8-step booking flow modal */}
      {goSvc && (
        <GoServiceBookingModal
          service={goSvc}
          pet={currentPet}
          onClose={() => setGoSvc(null)}
        />
      )}

      <MiraPlanModal
        isOpen={showGoPlan}
        onClose={() => setShowGoPlan(false)}
        pet={currentPet}
        pillar="go"
        token={token}
      />
    </PillarPageLayout>
  );
}
