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
import GoNearMe from '../components/go/GoNearMe';
import PetFriendlyStays from '../components/go/PetFriendlyStays';
import GuidedGoPaths from '../components/go/GuidedGoPaths';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
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

        {/* Hero */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.deep} 55%,${G.mid} 100%)`, padding:'32px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>✈️ Go</div>
            </div>
            {contextPets?.length > 1 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {contextPets.map(p => (
                  <button key={p.id} onClick={() => { vibe(); setCurrentPet(p); }}
                    style={{ padding:'6px 16px', borderRadius:999, fontSize:13, fontWeight:700,
                      border: currentPet?.id===p.id ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.3)',
                      background: currentPet?.id===p.id ? 'rgba(255,255,255,0.22)' : 'transparent',
                      color:'#fff', cursor:'pointer', transition:'all 0.15s' }}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>Travel & Go with {petName}</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>Flights, road trips, boarding, pet-friendly stays</div>
        </div>

        {currentPet && <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="go" token={token} /></div>}

        {/* Soul Pillar CTA */}
        {currentPet && (
          <div style={{ margin:'0 16px 20px', background:'linear-gradient(135deg,rgba(45,212,191,0.14),rgba(45,212,191,0.20))', border:'1px solid rgba(45,212,191,0.35)', borderRadius:18, padding:'18px 16px' }}>
            <div style={{ fontSize:20, fontWeight:700, color:'#1A0A2E', lineHeight:1.25, marginBottom:5 }}>
              How would <span style={{ color:'#0F766E' }}>{currentPet?.name || 'your dog'}</span> love to travel?
            </div>
            <div style={{ fontSize:13, color:'#4B5563', lineHeight:1.5 }}>
              Adventures, transport, hotels and activities — filtered to {currentPet?.name || 'your dog'}'s soul profile.
            </div>
          </div>
        )}

        {/* Tab Bar - iOS style */}
        {currentPet && <PawrentFirstStepsTab pet={currentPet} token={token} currentPillar="go" />}
        <div className="ios-tab-bar" style={{ borderColor: G.border }}>
          {[
            { id:'go',       label:'✈️ Go & Products' },
            { id:'services', label:'🛎️ Services' },
            { id:'stay',     label:'🏨 Stay' },
            { id:'nearme',   label:'📍 Find Near Me' },
          ].map(tab => (
            <button key={tab.id} className={`ios-tab${activeTab===tab.id?' active':''}`}
              data-testid={`go-tab-${tab.id}`}
              onClick={() => { vibe(); setActiveTab(tab.id); setSubCat('All'); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Go & Products */}
        {activeTab === 'go' && (
          <div>
            {/* Mira Bar */}
            <div style={{ margin:'16px 16px 0', background:G.dark, borderRadius:20, padding:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:`rgba(167,243,208,0.9)`, letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {petName.toUpperCase()}'S TRAVEL</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>
                "Every journey with {petName} needs the right gear and the right plan. I'll handle both."
              </div>
              <button className="go-cta" onClick={() => { vibe('medium'); request('Travel planning', { channel:'go_mira_cta' }); }}>
                Plan {petName}'s Next Trip →
              </button>
            </div>

            {/* dimTab */}
            <div style={{ display:'flex', margin:'16px 16px 0', background:G.pale, borderRadius:12, padding:4 }}>
              {[{ id:'products', label:'🎯 All Products' }, { id:'personalised', label:'✦ Personalised' }].map(t => (
                <button key={t.id} onClick={() => { setDimTab(t.id); setSubCat('All'); }}
                  style={{ flex:1, padding:'9px', borderRadius:10, border:'none', fontSize:14, fontWeight:600, cursor:'pointer',
                    background:dimTab===t.id?G.teal:G.pale, color:dimTab===t.id?'#fff':G.mutedText }}>
                  {t.label}
                </button>
              ))}
            </div>

            {dimTab === 'personalised' ? (
              <div style={{ padding:'16px 16px 24px' }}>
                <PersonalisedBreedSection pet={currentPet} pillar="go" token={token} />
                {GO_IMAGINES.map(item => <MiraImaginesCard key={item.id} item={item} pet={currentPet} token={token} pillar="go" />)}
              </div>
            ) : (
              <div style={{ padding:'16px' }}>
                {/* Sub-category pills */}
                {subCats.length > 1 && (
                  <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:12, paddingBottom:4 }}>
                    {subCats.map(cat => (
                      <button key={cat} onClick={() => setSubCat(cat)}
                        style={{ flexShrink:0, padding:'6px 14px', borderRadius:20, fontSize:14, fontWeight:600,
                          border:`1.5px solid ${subCat===cat?G.teal:G.border}`,
                          background:subCat===cat?G.teal:'#fff',
                          color:subCat===cat?'#fff':G.darkText, cursor:'pointer' }}>
                        {cat.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                )}

                {/* Mira's pick callout */}
                {miraPick && (
                  <div style={{ background:'linear-gradient(135deg,rgba(255,140,66,0.1),rgba(196,77,255,0.06))', border:'1px solid rgba(255,140,66,0.3)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#FF8C42,#C44DFF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#fff', flexShrink:0 }}>✦</div>
                    <div style={{ fontSize:14, color:'#003D3D', lineHeight:1.4 }}>
                      <strong>Mira's pick:</strong> {miraPick.name}
                      {miraPick.mira_hint && <span style={{ color:'#888', marginLeft:5 }}>— {miraPick.mira_hint}</span>}
                    </div>
                  </div>
                )}

                {products.length === 0 ? (
                  <MiraEmptyRequest
                    pet={currentPet}
                    pillar="go"
                    categoryName={`Go${subCat !== 'All' ? ` — ${subCat}` : ''} Products`}
                    accentColor={G.teal}
                    onRequest={async (msg) => {
                      await request(msg, { channel:'go_empty_products', metadata:{ subCat, petName } });
                    }}
                  />
                ) : (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      {products.slice(0, 40).map(p => (
                        <div key={p.id||p._id||p.name} style={{ opacity: p._dimmed ? 0.55 : 1 }}>
                          <SharedProductCard product={p} pillar="go" selectedPet={currentPet}
                            onAddToCart={() => handleAddToCart(p)}
                            onClick={() => { vibe(); setSelectedProduct(p); }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop:`1px solid ${G.border}`, paddingTop:10, marginTop:4, fontSize:14, color:'#888' }}>
                      Filtered for {petName}{allergies.length > 0 ? ` · ${allergies.slice(0,2).join(' & ')}-free` : ''}
                    </div>
                <div style={{ marginTop:16 }}><GuidedGoPaths pet={currentPet} /></div>

                <div style={{ marginTop:16, background:G.dark, borderRadius:20, padding:18, cursor:'pointer' }} onClick={() => setSoulMadeOpen(true)}>
                  <div style={{ fontSize:14, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:8 }}>✦ SOUL MADE™ · TRAVEL GEAR FOR {petName.toUpperCase()}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Custom travel tags, bags and accessories.</div>
                  <button className="go-cta">Explore Soul Made →</button>
                </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Services */}
        {activeTab === 'services' && (
          <div style={{ padding:'16px' }}>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:G.darkText }}>Go Services for {petName}</div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:16 }}>Flights, road trips, boarding, vet certificates — all arranged.</div>
            <GoConciergeSection pet={currentPet} />
          </div>
        )}

        {/* TAB 3: Stay */}
        {activeTab === 'stay' && (
          <div style={{ padding:'16px' }}>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:G.darkText }}>Pet-Friendly Stays</div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:16 }}>Hotels, resorts, and homestays that welcome {petName}.</div>
            <PetFriendlyStays pet={currentPet} token={token} onBook={stay => {
              tdc.book({ service:`Stay: ${stay}`, pillar:'go', pet:currentPet, channel:'go_stays' });
              setSvcBooking({ isOpen: true, serviceType: guessServiceType(stay) || 'boarding' });
            }} />
          </div>
        )}

        {/* TAB 4: Near Me */}
        {activeTab === 'nearme' && (
          <GoNearMe currentPet={currentPet} />
        )}
      </div>

      <ServiceBookingModal
        isOpen={svcBooking.isOpen}
        onClose={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
        serviceType={svcBooking.serviceType}
        onBookingComplete={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
      />
    </PillarPageLayout>
  );
}
