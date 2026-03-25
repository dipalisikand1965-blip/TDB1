/**
 * EmergencyMobilePage.jsx — /emergency (mobile)
 * 3-tab layout: Emergency Kit | Book Help | Find Vet
 * Colour: Crimson #DC2626
 * URGENT CTA always pinned above tabs
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
import GuidedEmergencyPaths from '../components/emergency/GuidedEmergencyPaths';
import EmergencyNearMe from '../components/emergency/EmergencyNearMe';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';

const G = {
  crimson:'#DC2626', mid:'#991B1B', dark:'#1A0000', pale:'#FEF2F2',
  cream:'#FFF8F8', darkText:'#1A0000', mutedText:'#991B1B',
  border:'rgba(220,38,38,0.18)', light:'#FCA5A5',
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.emerg-m{font-family:'DM Sans',-apple-system,sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.emerg-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.mid},${G.crimson});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.emerg-cta:active{transform:scale(0.97)}
.emerg-tab{flex:1;padding:12px 4px;background:none;border:none;border-bottom:2.5px solid transparent;font-size:13px;font-weight:500;color:#999;cursor:pointer;transition:all 0.15s;white-space:nowrap;font-family:inherit}
.emerg-tab.active{color:${G.crimson};border-bottom-color:${G.crimson};font-weight:700}`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='urgent'?[50,30,50,30,50]:t==='medium'?[12]:[6]); }

const EMERG_SERVICES = [
  { id:"emerg_vet",     icon:"🏥", name:"Emergency Vet Finder",        tagline:"Nearest 24hr vet — now",      price:"Free",   desc:"Mira finds the nearest 24-hour emergency vet right now — no searching, no panic." },
  { id:"afterhours",    icon:"📞", name:"After-Hours Care Guidance",   tagline:"Out-of-hours guidance",       price:"Free",   desc:"Out-of-hours guidance — what to do, whether to go to emergency or wait." },
  { id:"accident",      icon:"🩺", name:"Accident & Poison Response",  tagline:"Act in the first 10 minutes", price:"Free",   desc:"Step-by-step response for accidents, poisoning, or sudden illness." },
  { id:"lostpet",       icon:"📍", name:"Lost Pet Response",           tagline:"Start immediately",           price:"Free",   desc:"Immediate lost pet protocol — posts, alerts, microchip tracing, local network." },
  { id:"transport",     icon:"🚐", name:"Emergency Transport",         tagline:"Safe, fast, arranged now",    price:"₹1,500", desc:"Emergency pet transport to the nearest 24-hour vet — immediate dispatch." },
  { id:"firstaidcourse",icon:"📚", name:"Pet First Aid Course",        tagline:"Be ready before it happens",  price:"₹1,999", desc:"Certified course — CPR, wound care, choking, poisoning response." },
];

const KNOWN_BREEDS = ['american bully','beagle','border collie','boxer','cavalier','chihuahua','chow chow','dachshund','dalmatian','doberman','english bulldog','french bulldog','german shepherd','golden retriever','husky','indie','jack russell','labrador','lhasa apso','maltese','pomeranian','poodle','pug','rottweiler','shih tzu','yorkshire'];
function filterBreedProducts(products, petBreed) {
  const pl=(petBreed||"").toLowerCase(); const pw=pl.split(/\s+/).filter(w=>w.length>2);
  return products.filter(p=>{const n=(p.name||"").toLowerCase();for(const b of KNOWN_BREEDS){if(n.includes(b)){if(!pl)return false;if(n.includes(pl))return true;if(pw.some(w=>b.includes(w)))return true;return false;}}return true;});
}

export default function EmergencyMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'emergency', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'emergency' });
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("emergency");
  const [dimTab, setDimTab] = useState("products");
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [selectedSvc, setSelectedSvc] = useState(null);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (!currentPet?.id) return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=emergency&limit=200`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.products) setProducts(filterBreedProducts(d.products, currentPet?.breed)); })
      .catch(() => {});
    // Fetch emergency services from service-box
    fetch(`${API_URL}/api/service-box/services?pillar=emergency&limit=20`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.services?.length) setServices(d.services); })
      .catch(() => {});
  }, [currentPet?.id, token]);

  const handleAddToCart = useCallback(p => {
    addToCart({ id:p.id||p._id, name:p.name, price:p.price||0, image:p.image_url||p.images?.[0], pillar:'emergency', quantity:1 });
  }, [addToCart]);

  const handleBookService = (svc) => {
    vibe('urgent');
    tdc.urgent({ text: svc.name || 'Emergency help', pet:currentPet, channel:'emergency_service_card' });
    setSelectedSvc(svc);
    setConciergeOpen(true);
  };

  if (loading) return (
    <PillarPageLayout pillar="emergency" hideHero hideNavigation>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>🚨</div><div>Checking emergency readiness…</div></div>
      </div>
    </PillarPageLayout>
  );

  const petName = currentPet?.name || 'your dog';

  return (
    <PillarPageLayout pillar="emergency" hideHero hideNavigation>
      <div className="emerg-m" data-testid="emergency-mobile">
        <style>{CSS}</style>

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="emergency" pillarColor={G.crimson} pillarLabel="Emergency" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct?.raw || selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.crimson} />}

        {/* Hero */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.mid} 55%,${G.crimson} 100%)`, padding:'32px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>🚨 Emergency</div>
            </div>
            {contextPets?.length > 1 && (
              <select value={currentPet?.id} onChange={e => { vibe(); setCurrentPet(contextPets.find(p => p.id === e.target.value)); }}
                style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:999, padding:'7px 14px', color:'#fff', fontSize:13 }}>
                {contextPets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>{petName}'s Emergency Centre</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>First aid kit, emergency services, and 24hr vet finder.</div>
        </div>

        {/* URGENT CTA — always visible above tabs */}
        <div style={{ background:G.crimson, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>🚨</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>URGENT — Contact Emergency Vet Now</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)' }}>For life-threatening emergencies, call your vet directly.</div>
          </div>
          <button onClick={() => { vibe('urgent'); tdc.urgent({ text:'Emergency vet needed NOW', pet:currentPet, channel:'emergency_urgent_cta' }); setActiveTab('services'); setConciergeOpen(true); setSelectedSvc(EMERG_SERVICES[0]); }}
            style={{ flexShrink:0, background:'#fff', border:'none', borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:700, color:G.crimson, cursor:'pointer' }}>
            Get Help
          </button>
        </div>

        {/* Soul Profile */}
        {currentPet && <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="emergency" token={token} /></div>}

        {/* Tab Bar */}
        <div style={{ display:'flex', background:'#fff', borderBottom:`1px solid ${G.border}`, position:'sticky', top:0, zIndex:100, overflowX:'auto' }}>
          {[
            { id:'emergency', label:'🩺 Emergency Kit' },
            { id:'services',  label:'📋 Book Help' },
            { id:'find',      label:'📍 Find Vet' },
          ].map(tab => (
            <button key={tab.id} className={`emerg-tab${activeTab===tab.id?' active':''}`}
              data-testid={`emergency-tab-${tab.id}`}
              onClick={() => { vibe(); setActiveTab(tab.id); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Emergency Kit */}
        {activeTab === 'emergency' && (
          <div>
            {/* Mira Bar */}
            <div style={{ margin:'16px 16px 0', background:G.dark, borderRadius:20, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(252,165,165,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {petName.toUpperCase()}'S SAFETY</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>
                "The best emergency is one you're prepared for. Let me check {petName}'s readiness."
              </div>
              <button className="emerg-cta" onClick={() => { vibe('medium'); request('Emergency preparedness check', { channel:'emergency_mira_cta' }); }}>
                Check Readiness →
              </button>
            </div>

            {/* Products / Services dimTab */}
            <div style={{ display:'flex', margin:'16px 16px 0', background:G.pale, borderRadius:12, padding:4 }}>
              {[{ id:'products', label:'📦 Products' }, { id:'services', label:'🩺 Services' }].map(t => (
                <button key={t.id} onClick={() => setDimTab(t.id)}
                  style={{ flex:1, padding:'9px', borderRadius:10, border:'none', fontSize:13, fontWeight:600, cursor:'pointer',
                    background:dimTab===t.id?G.crimson:G.pale, color:dimTab===t.id?'#fff':G.mutedText }}>
                  {t.label}
                </button>
              ))}
            </div>

            {dimTab === 'products' && (
              <div style={{ padding:'16px 16px 24px' }}>
                {products.length > 0 ? (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {products.slice(0, 20).map(p => (
                      <SharedProductCard key={p.id||p._id||p.name} product={p} pillar="emergency" selectedPet={currentPet}
                        onAddToCart={() => handleAddToCart(p)}
                        onClick={() => { vibe(); setSelectedProduct(p); }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign:'center', padding:'32px 0', color:'#888' }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>📦</div>
                    <div style={{ fontSize:14 }}>Emergency kit products loading…</div>
                  </div>
                )}
              </div>
            )}

            {dimTab === 'services' && (
              <div style={{ padding:'16px 16px 24px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {(services.length ? services : EMERG_SERVICES).slice(0, 6).map((svc, i) => (
                    <div key={svc.id || i} onClick={() => handleBookService(svc)}
                      style={{ background:'#fff', borderRadius:16, border:`1.5px solid ${G.border}`, padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:44, height:44, borderRadius:14, background:G.pale, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{svc.icon || '🩺'}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{svc.name}</div>
                        <div style={{ fontSize:12, color:G.mutedText }}>{svc.tagline || svc.description || ''}</div>
                      </div>
                      <button style={{ flexShrink:0, background:G.crimson, border:'none', borderRadius:20, padding:'6px 12px', fontSize:11, fontWeight:700, color:'#fff', cursor:'pointer' }}>
                        Now →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guided Paths */}
            {currentPet && <div style={{ padding:'0 16px 24px' }}><GuidedEmergencyPaths pet={currentPet} /></div>}

            {/* Mira Imagines */}
            {currentPet && <div style={{ padding:'0 16px 24px' }}><MiraImaginesBreed pet={currentPet} pillar="emergency" token={token} /></div>}
          </div>
        )}

        {/* TAB 2: Book Help */}
        {activeTab === 'services' && (
          <div style={{ padding:'16px 16px 24px' }}>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:G.darkText }}>Emergency Services</div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:20 }}>Concierge® responds within 2 hours. For life-threatening — call vet directly.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {(services.length ? services : EMERG_SERVICES).map((svc, i) => (
                <div key={svc.id || i} style={{ background:'#fff', borderRadius:18, border:`1.5px solid ${G.border}`, padding:'16px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:10 }}>
                    <div style={{ width:44, height:44, borderRadius:14, background:G.pale, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{svc.icon || '🩺'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:2 }}>{svc.name}</div>
                      <div style={{ fontSize:12, color:G.mutedText }}>{svc.tagline || ''}</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:G.crimson, flexShrink:0 }}>{svc.price || 'Free'}</div>
                  </div>
                  <div style={{ fontSize:13, color:'#555', lineHeight:1.6, marginBottom:12 }}>{svc.desc || svc.description || ''}</div>
                  <button onClick={() => handleBookService(svc)} data-testid={`emergency-svc-book-${svc.id || i}`}
                    style={{ width:'100%', minHeight:44, borderRadius:12, border:'none', background:`linear-gradient(135deg,${G.mid},${G.crimson})`, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                    Get Emergency Help →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Find Vet */}
        {activeTab === 'find' && (
          <div style={{ padding:'16px' }}>
            <EmergencyNearMe pet={currentPet} onBook={svc => {
              handleBookService({ name: typeof svc === 'string' ? svc : svc?.name || 'Emergency vet', icon:'🏥', price:'Free' });
            }} />
          </div>
        )}

        {/* Concierge Confirmation Sheet */}
        {conciergeOpen && selectedSvc && (
          <div onClick={() => setConciergeOpen(false)} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', padding:'24px 20px 40px' }}>
              <div style={{ fontSize:28, textAlign:'center', marginBottom:12 }}>{selectedSvc.icon || '🚨'}</div>
              <div style={{ fontSize:18, fontWeight:700, color:G.darkText, textAlign:'center', marginBottom:8 }}>{selectedSvc.name}</div>
              <div style={{ fontSize:14, color:'#555', textAlign:'center', lineHeight:1.6, marginBottom:20 }}>
                🚨 Emergency alert sent to Concierge®. Our team will respond within 2 hours.<br/>
                <strong style={{ color:G.crimson }}>For life-threatening emergencies, call your vet directly.</strong>
              </div>
              <button onClick={() => setConciergeOpen(false)} style={{ width:'100%', minHeight:48, borderRadius:14, border:'none', background:`linear-gradient(135deg,${G.mid},${G.crimson})`, color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer' }}>
                Alert Sent ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </PillarPageLayout>
  );
}
