/**
 * FarewellMobilePage.jsx — /farewell (mobile)
 * 3-tab layout: Legacy & Memorial | Get Support | Find Care
 * Colour: Deep Midnight #1A1A2E + Soft Indigo #6366F1
 * The most sacred pillar. For Mystique, and every beloved dog.
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
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import GuidedFarewellPaths from '../components/farewell/GuidedFarewellPaths';
import FarewellNearMe from '../components/farewell/FarewellNearMe';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';

const G = {
  deep:'#1A1A2E', mid:'#4B4B6E', indigo:'#6366F1', light:'#C7D2FE',
  pale:'#EEF2FF', cream:'#F8F9FF', dark:'#0A0A1E',
  darkText:'#1A1A2E', mutedText:'#4B4B6E',
  border:'rgba(99,102,241,0.18)',
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.farewell-m{font-family:'DM Sans',-apple-system,sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.farewell-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.mid},${G.indigo});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.farewell-cta:active{transform:scale(0.97)}
.farewell-tab{flex:1;padding:12px 4px;background:none;border:none;border-bottom:2.5px solid transparent;font-size:13px;font-weight:500;color:#999;cursor:pointer;transition:all 0.15s;white-space:nowrap;font-family:inherit}
.farewell-tab.active{color:${G.indigo};border-bottom-color:${G.indigo};font-weight:700}`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='medium'?[12]:[6]); }

const FAREWELL_SERVICES = [
  { id:"eol_planning",  icon:"🕊️", name:"End-of-Life Care Planning",     tagline:"Quality of life, with dignity",     price:"Free",   desc:"Mira guides quality-of-life conversations with your vet — pain management, dignity, and timing." },
  { id:"euthanasia",    icon:"💙", name:"Euthanasia Support & Guidance", tagline:"When the time comes",               price:"Free",   desc:"Gentle guidance through the decision and process — what to expect, how to say goodbye, how to be present." },
  { id:"cremation",     icon:"🌿", name:"Cremation Arrangement",         tagline:"Handled with care",                 price:"₹2,999", desc:"Concierge arranges the full cremation — collection, service, and return of remains — with complete dignity." },
  { id:"memorial",      icon:"🌷", name:"Memorial Product Creation",      tagline:"A tribute as unique as they were", price:"₹1,499", desc:"Paw print casting, memory box, custom portrait, engraved stone — we create a lasting tribute." },
  { id:"ceremony",      icon:"🕯️", name:"Rainbow Bridge Ceremony",        tagline:"A send-off with love",             price:"₹3,999", desc:"A gentle farewell ceremony at home or at a partner location — readings, flowers, paw print, and space to grieve." },
  { id:"grief_counsel", icon:"💜", name:"Grief Counselling Referral",     tagline:"Your grief is real and valid",     price:"Free",   desc:"Mira connects you with a pet grief counsellor — because the loss of a dog is the loss of unconditional love." },
];

const KNOWN_BREEDS = ['american bully','beagle','border collie','boxer','cavalier','chihuahua','chow chow','dachshund','dalmatian','doberman','english bulldog','french bulldog','german shepherd','golden retriever','husky','indie','jack russell','labrador','lhasa apso','maltese','pomeranian','poodle','pug','rottweiler','shih tzu','yorkshire'];
function filterBreedProducts(products, petBreed) {
  const pl=(petBreed||"").toLowerCase(); const pw=pl.split(/\s+/).filter(w=>w.length>2);
  return products.filter(p=>{const n=(p.name||"").toLowerCase();for(const b of KNOWN_BREEDS){if(n.includes(b)){if(!pl)return false;if(n.includes(pl))return true;if(pw.some(w=>b.includes(w)))return true;return false;}}return true;});
}

const PROD_TABS = ["Memorial & Legacy", "Grief Support", "Final Care"];

export default function FarewellMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'farewell', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'farewell' });
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("farewell");
  const [prodTab, setProdTab] = useState(PROD_TABS[0]);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [selectedSvc, setSelectedSvc] = useState(null);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (!currentPet?.id) return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=farewell&limit=200`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.products) setProducts(filterBreedProducts(d.products, currentPet?.breed)); })
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
    </PillarPageLayout>
  );

  const petName = currentPet?.name || 'your dog';
  const breed = (currentPet?.breed || "").split("(")[0].trim();

  // Filter products by sub-tab
  const filteredProducts = products.filter(p => {
    const n = (p.name || "").toLowerCase();
    if (prodTab === "Memorial & Legacy") return n.includes("urn") || n.includes("memorial") || n.includes("paw") || n.includes("print") || n.includes("portrait") || n.includes("memory") || n.includes("tribute") || products.indexOf(p) < 8;
    if (prodTab === "Grief Support") return n.includes("grief") || n.includes("book") || n.includes("journal") || n.includes("comfort") || products.indexOf(p) < 8;
    return true;
  });

  return (
    <PillarPageLayout pillar="farewell" hideHero hideNavigation>
      <div className="farewell-m" data-testid="farewell-mobile">
        <style>{CSS}</style>

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="farewell" pillarColor={G.indigo} pillarLabel="Farewell" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct?.raw || selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.indigo} />}

        {/* Hero */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.deep} 55%,${G.mid} 100%)`, padding:'32px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>🌷 Farewell</div>
            </div>
            {contextPets?.length > 1 && (
              <select value={currentPet?.id} onChange={e => { vibe(); setCurrentPet(contextPets.find(p => p.id === e.target.value)); }}
                style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:999, padding:'7px 14px', color:'#fff', fontSize:13 }}>
                {contextPets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>Honour {petName}'s Legacy</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)', fontStyle:'italic' }}>"Their memory lives on in everything they taught you."</div>
        </div>

        {/* Soul Profile */}
        {currentPet && <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="farewell" token={token} /></div>}

        {/* Tab Bar */}
        <div style={{ display:'flex', background:'#fff', borderBottom:`1px solid ${G.border}`, position:'sticky', top:0, zIndex:100, overflowX:'auto' }}>
          {[
            { id:'farewell',  label:'🌷 Legacy & Memorial' },
            { id:'services',  label:'💙 Get Support' },
            { id:'find',      label:'📍 Find Care' },
          ].map(tab => (
            <button key={tab.id} className={`farewell-tab${activeTab===tab.id?' active':''}`}
              data-testid={`farewell-tab-${tab.id}`}
              onClick={() => { vibe(); setActiveTab(tab.id); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Legacy & Memorial */}
        {activeTab === 'farewell' && (
          <div>
            {/* Mira Reflection */}
            <div style={{ margin:'16px 16px 0', background:G.dark, borderRadius:20, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(199,210,254,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ A MESSAGE FROM MIRA</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.80)', lineHeight:1.7, fontStyle:'italic', marginBottom:14 }}>
                "You don't have to figure this out alone. Whatever you need for {petName}, I'll help hold every detail gently. 🌷"
              </div>
              <button className="farewell-cta" onClick={() => { vibe('medium'); request('Farewell guidance', { channel:'farewell_mira_cta' }); }}>
                Reach out to Mira →
              </button>
            </div>

            {/* Product Sub-tabs */}
            <div style={{ display:'flex', gap:6, padding:'16px 16px 8px', overflowX:'auto' }}>
              {PROD_TABS.map(t => (
                <button key={t} onClick={() => setProdTab(t)}
                  style={{ flexShrink:0, padding:'7px 14px', borderRadius:20, fontSize:12, fontWeight:600,
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
              <div style={{ fontSize:10, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:8 }}>✦ SOUL MADE™ · A TRIBUTE ONLY {petName.toUpperCase()} COULD INSPIRE</div>
              <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>{petName}'s face, immortalised in art.</div>
              <button className="farewell-cta">Create a tribute for {petName} →</button>
            </div>
          </div>
        )}

        {/* TAB 2: Get Support */}
        {activeTab === 'services' && (
          <div style={{ padding:'16px 16px 24px' }}>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:G.darkText }}>Farewell Support Services</div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:4 }}>Gentle, concierge-led support — whenever you are ready.</div>
            <div style={{ fontSize:12, color:G.mutedText, fontStyle:'italic', marginBottom:20 }}>"Take your time. We're here whenever you're ready." — Mira</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {FAREWELL_SERVICES.map(svc => (
                <div key={svc.id} style={{ background:'#fff', borderRadius:18, border:`1.5px solid ${G.border}`, padding:'16px', overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:10 }}>
                    <div style={{ width:44, height:44, borderRadius:14, background:G.pale, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{svc.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:2 }}>{svc.name}</div>
                      <div style={{ fontSize:12, color:G.mutedText }}>{svc.tagline}</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:G.indigo, flexShrink:0 }}>{svc.price}</div>
                  </div>
                  <div style={{ fontSize:13, color:'#555', lineHeight:1.6, marginBottom:12 }}>{svc.desc.replace(/{name}/g, petName)}</div>
                  <button onClick={() => handleBookService(svc)} data-testid={`farewell-svc-book-${svc.id}`}
                    style={{ width:'100%', minHeight:44, borderRadius:12, border:'none', background:`linear-gradient(135deg,${G.mid},${G.indigo})`, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                    Reach out gently →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Find Care */}
        {activeTab === 'find' && (
          <div style={{ padding:'16px' }}>
            <FarewellNearMe pet={currentPet} onBook={place => {
              tdc.request(`Farewell care: ${place}`, { pillar:'farewell', channel:'farewell_nearme', pet:currentPet });
            }} />
          </div>
        )}

        {/* Concierge Confirmation Sheet */}
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
    </PillarPageLayout>
  );
}
