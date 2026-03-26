/**
 * AdoptMobilePage.jsx — /adopt (mobile)
 * 3-tab layout: Find Your Dog | Book Guidance | Find Rescue
 * Colour: Deep Mauve #4A0E2E + Rose #D4537E
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
import { applyMiraFilter, filterBreedProducts, excludeCakeProducts} from '../hooks/useMiraFilter';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import GuidedAdoptPaths from '../components/adopt/GuidedAdoptPaths';
import AdoptNearMe from '../components/adopt/AdoptNearMe';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import '../styles/mobile-design-system.css';

const G = {
  deep:'#4A0E2E', mid:'#7B1D4E', rose:'#D4537E', light:'#F9A8C9',
  pale:'#FDF2F8', cream:'#FFF5FC', dark:'#1A0010',
  darkText:'#4A0E2E', mutedText:'#7B1D4E',
  border:'rgba(212,83,126,0.18)',
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.adopt-m{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.adopt-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.mid},${G.rose});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.adopt-cta:active{transform:scale(0.97)}
.adopt-tab{flex:1;padding:12px 4px;background:none;border:none;border-bottom:2.5px solid transparent;font-size:14px;font-weight:500;color:#999;cursor:pointer;transition:all 0.15s;white-space:nowrap;font-family:inherit}
.adopt-tab.active{color:${G.rose};border-bottom-color:${G.rose};font-weight:700}`;

function vibe(t='light'){if(navigator?.vibrate)navigator.vibrate(t==='medium'?[12]:[6]);}

const ADOPT_STAGES = [
  { id:"thinking",  label:"Thinking",  emoji:"💭" },
  { id:"ready",     label:"Ready",     emoji:"✅" },
  { id:"looking",   label:"Looking",   emoji:"🔍" },
  { id:"matched",   label:"Matched",   emoji:"❤️" },
  { id:"home",      label:"Home",      emoji:"🏠" },
];

const ADOPT_SERVICES = [
  { id:"breed_advisory",  icon:"📚", name:"Breed Suitability Advisory",   tagline:"Find your perfect match",     price:"Free",  desc:"Mira matches breed energy, size, temperament to your lifestyle — before you meet one dog." },
  { id:"home_assessment", icon:"🏠", name:"Home Readiness Assessment",    tagline:"Before they arrive",          price:"Free",  desc:"Mira's team checks your home for safety, space and setup — gives you a readiness plan." },
  { id:"rescue_network",  icon:"🐾", name:"Rescue Partner Network",       tagline:"Matched, not random",         price:"Free",  desc:"Mira connects you with verified rescue partners and specific dogs matching your lifestyle." },
  { id:"post_adopt",      icon:"❤️", name:"Post-Adoption Support",        tagline:"First 30 days matter most",   price:"Free",  desc:"Behaviour guidance, settling-in support, and vet coordination through the first month." },
  { id:"adopt_paperwork", icon:"📋", name:"Adoption Paperwork Guidance",  tagline:"No confusion, no gaps",       price:"Free",  desc:"All adoption forms, microchipping, registration and vet records — Concierge® handles it." },
  { id:"multi_pet",       icon:"🐕", name:"Multi-Pet Integration",        tagline:"First introductions matter",  price:"₹999", desc:"Expert guidance on introducing a new dog to existing pets — step-by-step, safe, stress-free." },
];


export default function AdoptMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'adopt', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'adopt' });
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("adopt");
  const [adoptStage, setAdoptStage] = useState("thinking");
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
    fetch(`${API_URL}/api/admin/pillar-products?pillar=adopt&limit=200&breed=${encodeURIComponent(currentPet?.breed||'')}`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.products) setProducts(applyMiraFilter(filterBreedProducts(excludeCakeProducts(d.products), currentPet?.breed), currentPet)); })
      .catch(() => {});
  }, [currentPet?.id, token]);

  const handleAddToCart = useCallback(p => {
    addToCart({ id:p.id||p._id, name:p.name, price:p.price||0, image:p.image_url||p.images?.[0], pillar:'adopt', quantity:1 });
  }, [addToCart]);

  const handleBookService = (svc) => {
    vibe('medium');
    tdc.book({ service:svc.name, pillar:'adopt', pet:currentPet, channel:'adopt_service_card' });
    setSelectedSvc(svc);
    setConciergeOpen(true);
  };

  if (loading) return (
    <PillarPageLayout pillar="adopt" hideHero hideNavigation>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>🐾</div><div>Loading adoption paths…</div></div>
      </div>
    </PillarPageLayout>
  );

  const petName = currentPet?.name || 'your dog';

  return (
    <PillarPageLayout pillar="adopt" hideHero hideNavigation>
      <div className="adopt-m mobile-page-container" data-testid="adopt-mobile">
        <style>{CSS}</style>

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="adopt" pillarColor={G.rose} pillarLabel="Adopt" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct?.raw || selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.rose} />}

        {/* Hero */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.deep} 55%,${G.mid} 100%)`, padding:'32px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>🐾 Adopt</div>
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
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>Find & Welcome a Dog</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>Ethical adoption, rescue, and rehoming support</div>
        </div>

        {/* Soul Profile */}
        {currentPet && <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="adopt" token={token} /></div>}

        {/* Soul Pillar CTA */}
        {currentPet && (
          <div style={{ margin:'0 16px 20px', background:'linear-gradient(135deg,rgba(251,113,133,0.14),rgba(251,113,133,0.20))', border:'1px solid rgba(251,113,133,0.35)', borderRadius:18, padding:'18px 16px' }}>
            <div style={{ fontSize:20, fontWeight:700, color:'#1A0A2E', lineHeight:1.25, marginBottom:5 }}>
              How would <span style={{ color:'#E11D48' }}>{petName}</span> welcome a new friend?
            </div>
            <div style={{ fontSize:13, color:'#4B5563', lineHeight:1.5 }}>
              Resources and support for making {petName}'s new sibling feel at home.
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div style={{ display:'flex', background:'#fff', borderBottom:`1px solid ${G.border}`, position:'sticky', top:0, zIndex:100, overflowX:'auto' }}>
          {[
            { id:'adopt',    label:'🐾 Find Your Dog' },
            { id:'services', label:'💌 Book Guidance' },
            { id:'find',     label:'📍 Find Rescue' },
          ].map(tab => (
            <button key={tab.id} className={`adopt-tab${activeTab===tab.id?' active':''}`}
              data-testid={`adopt-tab-${tab.id}`}
              onClick={() => { vibe(); setActiveTab(tab.id); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Find Your Dog */}
        {activeTab === 'adopt' && (
          <div>
            {/* Stage Tracker */}
            <div style={{ padding:'16px 16px 8px' }}>
              <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:10 }}>Where are you on the journey?</div>
              <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
                {ADOPT_STAGES.map(s => (
                  <button key={s.id} onClick={() => { vibe(); setAdoptStage(s.id); }}
                    style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'8px 12px', borderRadius:14, border:`2px solid ${adoptStage===s.id?G.rose:G.border}`, background:adoptStage===s.id?G.pale:'#fff', cursor:'pointer', minWidth:68 }}>
                    <span style={{ fontSize:18 }}>{s.emoji}</span>
                    <span style={{ fontSize:14, fontWeight:700, color:adoptStage===s.id?G.rose:G.darkText }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mira Bar */}
            <div style={{ margin:'0 16px 16px', background:G.dark, borderRadius:20, padding:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(249,168,201,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON ADOPTION</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>"Every dog deserves a forever home. I'll help you find the right match and guide you through every step."</div>
              <button className="adopt-cta" onClick={() => { vibe('medium'); request('Start adoption journey', { channel:'adopt_mira_cta' }); }}>Start Adoption Journey →</button>
            </div>

            {/* Guided Paths */}
            {currentPet && <div style={{ padding:'0 16px 24px' }}><GuidedAdoptPaths pet={currentPet} /></div>}

            {/* Products */}
            {products.length > 0 && (
              <div style={{ padding:'0 16px 24px' }}>
                <div style={{ fontSize:18, fontWeight:700, marginBottom:12 }}>Adoption Essentials for {petName}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {products.slice(0, 20).map(p => (
                    <SharedProductCard key={p.id||p._id||p.name} product={p} pillar="adopt" selectedPet={currentPet}
                      onAddToCart={() => handleAddToCart(p)}
                      onClick={() => { vibe(); setSelectedProduct(p); }} />
                  ))}
                </div>
              </div>
            )}

            {/* Mira Imagines */}
            {currentPet && <div style={{ padding:'0 16px 24px' }}><MiraImaginesBreed pet={currentPet} pillar="adopt" token={token} /></div>}
          </div>
        )}

        {/* TAB 2: Book Guidance */}
        {activeTab === 'services' && (
          <div style={{ padding:'16px 16px 24px' }}>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:G.darkText }}>Adoption Guidance Services</div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:20 }}>Concierge®-led support for every stage of your journey.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {ADOPT_SERVICES.map(svc => (
                <div key={svc.id} style={{ background:'#fff', borderRadius:18, border:`1.5px solid ${G.border}`, padding:'16px', overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:10 }}>
                    <div style={{ width:44, height:44, borderRadius:14, background:G.pale, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{svc.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:2 }}>{svc.name}</div>
                      <div style={{ fontSize:14, color:G.mutedText }}>{svc.tagline}</div>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:G.rose, flexShrink:0 }}></div>
                  </div>
                  <div style={{ fontSize:14, color:'#555', lineHeight:1.6, marginBottom:12 }}>{svc.desc}</div>
                  <button onClick={() => handleBookService(svc)} data-testid={`adopt-svc-book-${svc.id}`}
                    style={{ width:'100%', minHeight:44, borderRadius:12, border:'none', background:`linear-gradient(135deg,${G.mid},${G.rose})`, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                    Book via Concierge® →
                  </button>
                </div>
              ))}
            </div>

            {/* MiraImaginesCard */}
            {currentPet && (
              <div style={{ marginTop:24 }}>
                {[
                  { id:'a-1', emoji:'🏠', name:'Home Readiness Kit', description:'Baby gates, socket covers, cord protectors — complete dog-proofing kit for your home.' },
                  { id:'a-2', emoji:'📚', name:'Breed Compatibility Guide', description:'50-breed guide — energy, size, temperament and lifestyle fit — find your perfect match.' },
                  { id:'a-3', emoji:'❤️', name:'First Week Starter Pack', description:'Everything for the first week — bed, bowl, lead, toy, settling-in guide.' },
                ].map(item => <MiraImaginesCard key={item.id} item={item} pet={currentPet} token={token} pillar="adopt" />)}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Find Rescue */}
        {activeTab === 'find' && (
          <div style={{ padding:'16px' }}>
            <AdoptNearMe pet={currentPet} onBook={shelter => {
              tdc.request(`Adoption enquiry: ${shelter}`, { pillar:'adopt', channel:'adopt_nearme', pet:currentPet });
            }} />
          </div>
        )}

        {/* Concierge® Confirmation Toast */}
        {conciergeOpen && selectedSvc && (
          <div onClick={() => setConciergeOpen(false)} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', padding:'24px 20px 40px' }}>
              <div style={{ fontSize:28, textAlign:'center', marginBottom:12 }}>{selectedSvc.icon}</div>
              <div style={{ fontSize:18, fontWeight:700, color:G.darkText, textAlign:'center', marginBottom:8 }}>{selectedSvc.name}</div>
              <div style={{ fontSize:14, color:'#555', textAlign:'center', lineHeight:1.6, marginBottom:20 }}>Concierge® will contact you within 48 hours to guide you through this service.</div>
              <button onClick={() => setConciergeOpen(false)} style={{ width:'100%', minHeight:48, borderRadius:14, border:'none', background:`linear-gradient(135deg,${G.mid},${G.rose})`, color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer' }}>
                Got it ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </PillarPageLayout>
  );
}
