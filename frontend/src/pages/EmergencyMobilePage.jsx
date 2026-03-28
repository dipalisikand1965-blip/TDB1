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
import { applyMiraFilter, filterBreedProducts, excludeCakeProducts} from '../hooks/useMiraFilter';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import GuidedEmergencyPaths from '../components/emergency/GuidedEmergencyPaths';
import EmergencyNearMe from '../components/emergency/EmergencyNearMe';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraPlanModal from '../components/mira/MiraPlanModal';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
import PillarCategoryStrip from '../components/common/PillarCategoryStrip';
import PillarServiceSection from '../components/PillarServiceSection';
import '../styles/mobile-design-system.css';
import ConciergeRequestBuilder from '../components/services/ConciergeRequestBuilder';

const EMERG_STRIP_CATS = [
  { id:"kit",       icon:"📦", label:"First Aid Kit",   iconBg:"linear-gradient(135deg,#FEE2E2,#FECACA)" },
  { id:"vets",      icon:"🏥", label:"24hr Vets",       iconBg:"linear-gradient(135deg,#E0F2FE,#BAE6FD)" },
  { id:"poison",    icon:"☠️", label:"Poison Response", iconBg:"linear-gradient(135deg,#FEF3C7,#FDE68A)" },
  { id:"lost",      icon:"📍", label:"Lost Pet",        iconBg:"linear-gradient(135deg,#DCFCE7,#BBF7D0)" },
  { id:"transport", icon:"🚐", label:"Transport",       iconBg:"linear-gradient(135deg,#EDE9FE,#DDD6FE)" },
  { id:"course",    icon:"📚", label:"First Aid Course",iconBg:"linear-gradient(135deg,#FCE4EC,#F8BBD0)" },
  { id:"plan",      icon:"🛡️", label:"Safety Plan",     iconBg:"linear-gradient(135deg,#F1F5F9,#E2E8F0)" },
];

const G = {
  crimson:'#DC2626', mid:'#991B1B', dark:'#1A0000', pale:'#FEF2F2',
  cream:'#FFF8F8', darkText:'#1A0000', mutedText:'#991B1B',
  border:'rgba(220,38,38,0.18)', light:'#FCA5A5',
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.emerg-m{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.emerg-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.mid},${G.crimson});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.emerg-cta:active{transform:scale(0.97)}
.emerg-tab{flex:1;padding:12px 4px;background:none;border:none;border-bottom:2.5px solid transparent;font-size:14px;font-weight:500;color:#999;cursor:pointer;transition:all 0.15s;white-space:nowrap;font-family:inherit}
.emerg-tab.active{color:${G.crimson};border-bottom-color:${G.crimson};font-weight:700}`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='urgent'?[50,30,50,30,50]:t==='medium'?[12]:[6]); }

const EMERG_SERVICES = [
  { id:"emerg_vet",     icon:"🏥", name:"Emergency Vet Finder",        tagline:"Nearest 24hr vet — now",      desc:"Mira finds the nearest 24-hour emergency vet right now — no searching, no panic." },
  { id:"afterhours",    icon:"📞", name:"After-Hours Care Guidance",   tagline:"Out-of-hours guidance",       desc:"Out-of-hours guidance — what to do, whether to go to emergency or wait." },
  { id:"accident",      icon:"🩺", name:"Accident & Poison Response",  tagline:"Act in the first 10 minutes", desc:"Step-by-step response for accidents, poisoning, or sudden illness." },
  { id:"lostpet",       icon:"📍", name:"Lost Pet Response",           tagline:"Start immediately",           desc:"Immediate lost pet protocol — posts, alerts, microchip tracing, local network." },
  { id:"transport",     icon:"🚐", name:"Emergency Transport",         tagline:"Safe, fast, arranged now",    desc:"Emergency pet transport to the nearest 24-hour vet — immediate dispatch." },
  { id:"firstaidcourse",icon:"📚", name:"Pet First Aid Course",        tagline:"Be ready before it happens",  desc:"Certified course — CPR, wound care, choking, poisoning response." },
];


export default function EmergencyMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'emergency', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'emergency' });
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [showEmergencyPlan, setShowEmergencyPlan] = useState(false);
  const [activeTab, setActiveTab] = useState("emergency");
  const [conciergeBuilderOpen, setConciergeBuilderOpen] = useState(false);
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
    fetch(`${API_URL}/api/admin/pillar-products?pillar=emergency&limit=200&breed=${encodeURIComponent(currentPet?.breed||'')}`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.products) setProducts(applyMiraFilter(filterBreedProducts(excludeCakeProducts(d.products), currentPet?.breed), currentPet)); })
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

  const handleUrgentCTA = useCallback(async () => {
    vibe('urgent');
    tdc.book({ service:'Emergency Vet', pillar:'emergency', pet:currentPet, urgency:'critical', channel:'emergency_urgent_cta' });
    // Send WhatsApp immediately to concierge
    const petName = currentPet?.name || 'Unknown Pet';
    const breed = (currentPet?.breed || 'Unknown Breed').split('(')[0].trim();
    const allergies = (currentPet?.allergies || []).filter(a => a && a.toLowerCase() !== 'none').join(', ') || 'None';
    try {
      await fetch(`${API_URL}/api/notifications/emergency-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body: JSON.stringify({
          to: '919739908844',
          petName,
          breed,
          allergies,
          message: `🚨 EMERGENCY — ${petName} (${breed}).\nParent needs immediate vet help.\nAllergies: ${allergies}.\nContact NOW.`,
        })
      });
    } catch (e) { console.warn('WA send failed', e); }
    setSelectedSvc({ icon:'🚨', name:'Emergency Vet Finder', waNotified: true });
    setConciergeOpen(true);
    setActiveTab('services');
  }, [currentPet, token]);

  if (loading) return (
    <PillarPageLayout pillar="emergency" hideHero hideNavigation>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>🚨</div><div>Checking emergency readiness…</div></div>
      </div>
    
      <MiraPlanModal
        isOpen={showEmergencyPlan}
        onClose={() => setShowEmergencyPlan(false)}
        pet={currentPet}
        pillar="emergency"
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

  const petName = currentPet?.name || 'your dog';

  return (
    <PillarPageLayout pillar="emergency" hideHero hideNavigation>
      <div className="emerg-m mobile-page-container" data-testid="emergency-mobile">
        <style>{CSS}</style>

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="emergency" pillarColor={G.crimson} pillarLabel="Emergency" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct?.raw || selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.crimson} />}

        {/* Hero */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.mid} 55%,${G.crimson} 100%)`, padding:'32px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>🚨 Emergency</div>
            </div>
            {contextPets?.length > 1 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
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
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>{petName}'s Emergency Centre</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>First aid kit, emergency services, and 24hr vet finder.</div>
        </div>

        {/* URGENT CTA — always visible above tabs */}
        <div style={{ background:G.crimson, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>🚨</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>URGENT — Contact Emergency Vet Now</div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)' }}>For life-threatening emergencies, call your vet directly.</div>
          </div>
          <button onClick={() => handleUrgentCTA()}
            data-testid="emergency-sos-btn"
            style={{ flexShrink:0, background:'#fff', border:'none', borderRadius:20, padding:'6px 14px', fontSize:14, fontWeight:700, color:G.crimson, cursor:'pointer' }}>
            Get Help
          </button>
        </div>

        {/* Emergency Category Strip — always visible above tabs */}
        <PillarCategoryStrip
          categories={EMERG_STRIP_CATS}
          activeId={null}
          onSelect={id => {
            if (id === 'vets') { vibe(); setActiveTab('find'); }
            else if (id === 'plan') { vibe('medium'); setShowEmergencyPlan(true); }
            else { vibe(); setActiveTab('emergency'); setDimTab('services'); }
          }}
          accentColor={G.crimson}
        />

        {/* Soul Profile */}
        {currentPet && <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="emergency" token={token} /></div>}

        {/* Soul Pillar CTA */}
        {currentPet && (
          <div style={{ margin:'0 16px 20px', background:'linear-gradient(135deg,rgba(239,68,68,0.14),rgba(239,68,68,0.20))', border:'1px solid rgba(239,68,68,0.35)', borderRadius:18, padding:'18px 16px' }}>
            <div style={{ fontSize:20, fontWeight:700, color:'#1A0A2E', lineHeight:1.25, marginBottom:5 }}>
              How would <span style={{ color:'#DC2626' }}>{currentPet?.name || 'your dog'}</span> stay safe?
            </div>
            <div style={{ fontSize:13, color:'#4B5563', lineHeight:1.5 }}>
              Emergency resources, kits and vet contacts — always ready for {currentPet?.name || 'your dog'}.
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="ios-tab-bar">
          {[
            { id:'emergency', label:'🚨 Emergency' },
            { id:'services',  label:'🐕 Services' },
            { id:'find',      label:'📍 Find Vet' },
          ].map(tab => (
            <button key={tab.id}
              className={`ios-tab${activeTab===tab.id?' active':''}`}
              style={activeTab===tab.id ? { backgroundColor:G.dark, color:'#fff' } : {}}
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
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(252,165,165,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {petName.toUpperCase()}'S SAFETY</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>
                "The best emergency is one you're prepared for. Let me check {petName}'s readiness."
              </div>
              <button className="emerg-cta" onClick={() => { vibe('medium'); setShowEmergencyPlan(true); }}>
                Build {petName}'s Safety Plan →
              </button>
            </div>

            {/* Pawrent Journey First Steps */}
            {currentPet && <div style={{ padding:'8px 16px 0' }}><PawrentFirstStepsTab pet={currentPet} token={token} currentPillar="emergency" /></div>}

            {/* Products / Services dimTab */}
            <div style={{ display:'flex', margin:'16px 16px 0', background:G.pale, borderRadius:12, padding:4 }}>
              {[{ id:'products', label:'📦 Products' }, { id:'services', label:'🩺 Services' }].map(t => (
                <button key={t.id} onClick={() => setDimTab(t.id)}
                  style={{ flex:1, padding:'9px', borderRadius:10, border:'none', fontSize:14, fontWeight:600, cursor:'pointer',
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
                        <div style={{ fontSize:14, color:G.mutedText }}>{svc.tagline || svc.description || ''}</div>
                      </div>
                      <button style={{ flexShrink:0, background:G.crimson, border:'none', borderRadius:20, padding:'6px 12px', fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer' }}>
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
          <>

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
            <div style={{ background:'#1A0000', borderRadius:20, padding:16, marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'rgba(201,151,58,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ BESPOKE REQUESTS</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14 }}>
                Emergency care, poison control, vet transport — Concierge® responds fast for {petName}.
              </div>
              <button onClick={() => setConciergeBuilderOpen(true)} data-testid="emergency-concierge-builder-btn"
                style={{ width:'100%', padding:'13px 20px', borderRadius:14, border:'1px solid rgba(220,38,38,0.4)', background:'linear-gradient(135deg,#1A0000,#450A0A)', color:'#F87171', fontSize:15, fontWeight:700, cursor:'pointer' }}>
                ✦ Bespoke Emergency Request →
              </button>
            </div>
            <PillarServiceSection
              pillar="emergency"
              pet={currentPet}
              title="Emergency Help, Personally"
              accentColor={G.crimson}
              darkColor={G.dark}
              isMobile
            />
          </div>
          </>
        )}

        {/* TAB 3: Find Vet */}
        {activeTab === 'find' && (
          <div style={{ padding:'16px' }}>
            <EmergencyNearMe pet={currentPet} onBook={svc => {
              handleBookService({ name: typeof svc === 'string' ? svc : svc?.name || 'Emergency vet', icon:'🏥', price:'Free' });
            }} />
          </div>
        )}

        {/* Concierge® Confirmation Sheet */}
        {conciergeOpen && selectedSvc && (
          <div onClick={() => setConciergeOpen(false)} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', padding:'24px 20px 40px' }}>
              <div style={{ fontSize:28, textAlign:'center', marginBottom:12 }}>{selectedSvc.icon || '🚨'}</div>
              <div style={{ fontSize:18, fontWeight:700, color:G.darkText, textAlign:'center', marginBottom:8 }}>{selectedSvc.name}</div>
              <div style={{ fontSize:14, color:'#555', textAlign:'center', lineHeight:1.6, marginBottom:20 }}>
                {selectedSvc?.waNotified ? (
                  <>
                    <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:14 }}>
                      <span style={{ color:'#16A34A', fontWeight:700 }}>✓ Concierge® notified via WhatsApp</span><br/>
                      <span style={{ color:'#15803D' }}>Our team will respond within minutes.</span>
                    </div>
                  </>
                ) : null}
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
    
      <MiraPlanModal
        isOpen={showEmergencyPlan}
        onClose={() => setShowEmergencyPlan(false)}
        pet={currentPet}
        pillar="emergency"
        token={token}
      />
    </PillarPageLayout>
  );
}
