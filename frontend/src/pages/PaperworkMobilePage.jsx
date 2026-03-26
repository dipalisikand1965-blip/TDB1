/**
 * PaperworkMobilePage.jsx — /paperwork (mobile)
 * 7 dimension pills + dimTab (Products / Services / Advisory) per dimension
 * + DocumentVault at top + SoulMadeCollection
 * Colour: Teal #0D9488
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
import DocumentVault from '../components/paperwork/DocumentVault';
import GuidedPaperworkPaths from '../components/paperwork/GuidedPaperworkPaths';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import PaperworkNearMe from '../components/paperwork/PaperworkNearMe';
import '../styles/mobile-design-system.css';

const G = {
  teal:'#0D9488', mid:'#0F766E', deep:'#134E4A', light:'#99F6E4',
  pale:'#CCFBF1', cream:'#F0FDFA', dark:'#022C22',
  darkText:'#134E4A', mutedText:'#0D9488', border:'rgba(13,148,136,0.18)',
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.pw-m{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.pw-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.mid},${G.teal});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.pw-cta:active{transform:scale(0.97)}`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='medium'?[12]:[6]); }


const PW_DIMS = [
  { id:"identity",  icon:"🪪", label:"Identity & Safety",      dbCategory:"identity",       accent:"#5B21B6", bg:"#EDE9FE" },
  { id:"health",    icon:"🏥", label:"Health Records",         dbCategory:"health",         accent:"#0369A1", bg:"#E0F2FE" },
  { id:"travel",    icon:"✈️",  label:"Travel Documents",       dbCategory:"travel",         accent:"#15803D", bg:"#DCFCE7" },
  { id:"insurance", icon:"🛡️", label:"Insurance & Finance",    dbCategory:"insurance",      accent:"#B45309", bg:"#FEF3C7" },
  { id:"breeds",    icon:"📚", label:"Breed & Care Guides",    dbCategory:"breed",          accent:"#B91C1C", bg:"#FEE2E2" },
  { id:"advisory",  icon:"💡", label:"Expert Advisory",        dbCategory:"advisory",       accent:"#0D9488", bg:"#CCFBF1" },
  { id:"soul",      icon:"🌟", label:"Soul Documents",         dbCategory:"soul_documents", accent:"#6D28D9", bg:"#F3E5F5" },
];

const ADVISORY_SERVICES = [
  { id:"life_planning", icon:"💡", name:"Pet Life Planning",       price:"Free",   desc:"A comprehensive life plan for your pet — every stage, all guidance in one session." },
  { id:"vet_liaison",   icon:"🏥", name:"Vet Liaison & Advisory",  price:"Free",   desc:"Mira coordinates with your vet — translates jargon, arranges second opinions." },
  { id:"insurance_adv", icon:"🛡️", name:"Insurance Advisory",     price:"Free",   desc:"Which policy? What's covered? What to claim? Mira simplifies pet insurance." },
  { id:"legal_guide",   icon:"⚖️", name:"Pet Legal Guidance",      price:"₹999",  desc:"Pet ownership laws, housing rights, breed-specific legislation — plain language guide." },
];

function PwDimPanel({ dim, pet, token, addToCart, onProductClick }) {
  const { request } = useConcierge({ pet, pillar:'paperwork' });
  const [dimTab, setDimTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [advisory, setAdvisory] = useState([]);

  useEffect(() => {
    if (!dim.dbCategory) return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=paperwork&sub_category=${encodeURIComponent(dim.dbCategory)}&limit=30`, {
      headers: token ? { Authorization:`Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const prods = d?.products || [];
        setProducts(applyMiraFilter(filterBreedProducts(excludeCakeProducts(prods), pet?.breed), pet));
      })
      .catch(() => {});

    if (dim.id === 'advisory') {
      fetch(`${API_URL}/api/service-box/services?pillar=paperwork&type=advisory&limit=10`, {
        headers: token ? { Authorization:`Bearer ${token}` } : {}
      })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.services?.length) setAdvisory(d.services); else setAdvisory(ADVISORY_SERVICES); })
        .catch(() => setAdvisory(ADVISORY_SERVICES));
    }
  }, [dim.id, dim.dbCategory, pet?.breed, token]);

  const petName = pet?.name || 'your dog';
  const tabs = [
    { id:'products', label:'📦 Products' },
    { id:'services', label:'🛎️ Services' },
    ...(dim.id !== 'soul' ? [{ id:'advisory', label:'💡 Advisory' }] : []),
  ];
  const advList = advisory.length ? advisory : ADVISORY_SERVICES;

  return (
    <div style={{ background:'#fff', borderRadius:18, border:`1.5px solid ${G.border}`, overflow:'hidden', marginTop:12 }}>
      <div style={{ background:`${dim.accent}15`, padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:dim.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{dim.icon}</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:dim.accent }}>{dim.label}</div>
          <div style={{ fontSize:14, color:'#666' }}>for {petName}</div>
        </div>
      </div>

      <div style={{ display:'flex', background:G.pale, padding:4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setDimTab(t.id)}
            style={{ flex:1, padding:'8px', borderRadius:10, border:'none', fontSize:14, fontWeight:600, cursor:'pointer',
              background:dimTab===t.id?G.teal:G.pale, color:dimTab===t.id?'#fff':G.mutedText }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'12px' }}>
        {dimTab === 'products' && (
          products.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px', color:'#888', fontSize:14 }}>Loading {dim.label} products for {petName}…</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {products.slice(0, 10).map(p => (
                <SharedProductCard key={p.id||p._id} product={p} pillar="paperwork" selectedPet={pet}
                  onAddToCart={() => addToCart({ id:p.id||p._id, name:p.name, price:p.price||0, image:p.image_url||p.images?.[0], pillar:'paperwork', quantity:1 })}
                  onClick={() => onProductClick(p)} />
              ))}
            </div>
          )
        )}

        {dimTab === 'services' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { id:`${dim.id}_org`, icon:'📋', name:`${dim.label} Organisation`, price:'Free', desc:`Mira organises all ${petName}'s ${dim.label.toLowerCase()} documents — stored, indexed, accessible.` },
              { id:`${dim.id}_cert`, icon:'📜', name:`${dim.label} Certificate`, price:'₹499', desc:`Official certificate and document creation for ${petName}'s ${dim.label.toLowerCase()} records.` },
            ].map(svc => (
              <div key={svc.id} style={{ background:G.pale, borderRadius:14, padding:'12px 14px' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:22 }}>{svc.icon}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{svc.name}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:G.teal }}>{svc.price}</div>
                  </div>
                </div>
                <div style={{ fontSize:14, color:'#555', lineHeight:1.5, marginBottom:10 }}>{svc.desc}</div>
                <button onClick={() => { vibe('medium'); tdc.book({ service:svc.name, pillar:'paperwork', pet, channel:'paperwork_dim_service' }); }}
                  style={{ width:'100%', minHeight:40, borderRadius:12, border:'none', background:`linear-gradient(135deg,${G.mid},${G.teal})`, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Book via Concierge® →
                </button>
              </div>
            ))}
          </div>
        )}

        {dimTab === 'advisory' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {advList.slice(0, 4).map((svc, i) => (
              <div key={svc.id||i} style={{ background:G.pale, borderRadius:14, padding:'12px 14px' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:22 }}>{svc.icon || '💡'}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{svc.name}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:G.teal }}>{svc.price || 'Free'}</div>
                  </div>
                </div>
                <div style={{ fontSize:14, color:'#555', lineHeight:1.5, marginBottom:10 }}>{(svc.desc || svc.description || '').replace(/\{petName\}/g, petName).replace(/\{name\}/g, petName)}</div>
                <button onClick={() => { vibe('medium'); tdc.book({ service:svc.name, pillar:'paperwork', pet, channel:'paperwork_advisory' }); }}
                  style={{ width:'100%', minHeight:40, borderRadius:12, border:'none', background:`linear-gradient(135deg,${G.mid},${G.teal})`, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Book Advisory →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaperworkMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'paperwork', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'paperwork' });
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [activeDim, setActiveDim] = useState(PW_DIMS[0].id);
  const [mainTab, setMainTab] = useState('paperwork');
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  if (loading) return (
    <PillarPageLayout pillar="paperwork" hideHero hideNavigation>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>📋</div><div>Loading paperwork…</div></div>
      </div>
    </PillarPageLayout>
  );

  const petName = currentPet?.name || 'your dog';
  const currentDim = PW_DIMS.find(d => d.id === activeDim) || PW_DIMS[0];

  return (
    <PillarPageLayout pillar="paperwork" hideHero hideNavigation>
      <div className="pw-m mobile-page-container" data-testid="paperwork-mobile">
        <style>{CSS}</style>

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="paperwork" pillarColor={G.teal} pillarLabel="Paperwork" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.teal} />}

        {/* Hero */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.deep} 55%,${G.mid} 100%)`, padding:'32px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>📋 Paperwork</div>
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
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>{petName}'s Documents & Advisory</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>Identity, health, travel, insurance — all organised</div>
        </div>

        {currentPet && <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="paperwork" token={token} /></div>}

        {/* Soul Pillar CTA */}
        {currentPet && (
          <div style={{ margin:'0 16px 20px', background:'linear-gradient(135deg,rgba(99,179,237,0.14),rgba(99,179,237,0.20))', border:'1px solid rgba(99,179,237,0.35)', borderRadius:18, padding:'18px 16px' }}>
            <div style={{ fontSize:20, fontWeight:700, color:'#1A0A2E', lineHeight:1.25, marginBottom:5 }}>
              How would <span style={{ color:'#0284C7' }}>{currentPet?.name || 'your dog'}</span> love to stay organised?
            </div>
            <div style={{ fontSize:13, color:'#4B5563', lineHeight:1.5 }}>
              Documents, insurance, vaccination — all handled by Concierge® for {currentPet?.name || 'your dog'}.
            </div>
          </div>
        )}

        {/* Main Tab Bar: Paperwork | Near Me */}
        <div style={{ display:'flex', margin:'8px 16px 0', background:'#F0FDFA', borderRadius:12, padding:4 }}>
          {[{id:'paperwork',label:'📋 Paperwork'},{id:'nearme',label:'📍 Near Me'}].map(t => (
            <button key={t.id} onClick={() => { vibe(); setMainTab(t.id); }}
              data-testid={`pw-tab-${t.id}`}
              style={{ flex:1, padding:'9px 0', borderRadius:9, fontSize:13, fontWeight:700, border:'none', cursor:'pointer',
                background: mainTab===t.id ? G.teal : 'transparent',
                color: mainTab===t.id ? '#fff' : G.darkText, transition:'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Near Me content */}
        {mainTab === 'nearme' && (
          <div style={{ padding:'16px 16px 8px' }}>
            <PaperworkNearMe pet={currentPet} />
          </div>
        )}

        {mainTab === 'paperwork' && <>
        {/* Document Vault */}
        {currentPet && (
          <div style={{ padding:'16px 16px 8px' }}>
            <DocumentVault pet={currentPet} token={token} />
          </div>
        )}

        {/* Mira Bar */}
        <div style={{ margin:'8px 16px 16px', background:G.dark, borderRadius:20, padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:`rgba(153,246,228,0.9)`, letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {petName.toUpperCase()}'S DOCUMENTS</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>
            "Every responsible pet parent needs {petName}'s documents organised. Choose a category to start."
          </div>
          <button className="pw-cta" onClick={() => { vibe('medium'); request('Paperwork review', { channel:'paperwork_mira_cta' }); }}>
            Organise {petName}'s Documents →
          </button>
        </div>

        {/* 7 Dimension Pills */}
        <div style={{ padding:'0 16px 8px' }}>
          <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:10 }}>Choose a Document Category</div>
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
            {PW_DIMS.map(dim => (
              <button key={dim.id} onClick={() => { vibe(); setActiveDim(dim.id); }}
                data-testid={`paperwork-dim-${dim.id}`}
                style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                  padding:'10px 12px', borderRadius:16, minWidth:72,
                  border:`2px solid ${activeDim===dim.id?dim.accent:G.border}`,
                  background:activeDim===dim.id?dim.bg:'#fff', cursor:'pointer' }}>
                <span style={{ fontSize:20 }}>{dim.icon}</span>
                <span style={{ fontSize:9, fontWeight:700, color:activeDim===dim.id?dim.accent:G.darkText, textAlign:'center', lineHeight:1.2 }}>{dim.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Dimension Panel */}
        <div style={{ padding:'0 16px 16px' }}>
          <PwDimPanel
            dim={currentDim}
            pet={currentPet}
            token={token}
            addToCart={addToCart}
            onProductClick={p => { vibe(); setSelectedProduct(p); }}
          />
        </div>

        {/* Guided Paths */}
        {currentPet && <div style={{ padding:'0 16px 16px' }}><GuidedPaperworkPaths pet={currentPet} /></div>}

        {/* PersonalisedBreedSection */}
        {currentPet && <div style={{ padding:'0 16px 16px' }}><PersonalisedBreedSection pet={currentPet} pillar="paperwork" token={token} /></div>}

        {/* MiraImaginesCard */}
        {currentPet && (
          <div style={{ padding:'0 16px 16px' }}>
            {[
              { id:'pw-1', emoji:'🪪', name:`${petName}'s Complete Document Folder`, description:`All documents in one place — microchip, vaccination, passport, insurance — beautifully organised.` },
              { id:'pw-2', emoji:'💡', name:'Expert Advisory Session', description:`1-on-1 with Mira's advisory team — complete life planning for ${petName}.` },
            ].map(item => <MiraImaginesCard key={item.id} item={item} pet={currentPet} token={token} pillar="paperwork" />)}
          </div>
        )}

        {/* SoulMade */}
        <div style={{ margin:'0 16px 24px', background:G.dark, borderRadius:20, padding:18, cursor:'pointer' }} onClick={() => setSoulMadeOpen(true)}>
          <div style={{ fontSize:14, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:8 }}>✦ SOUL MADE™ · DOCUMENTS FOR {petName.toUpperCase()}</div>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Custom identity cards and soul documents for {petName}.</div>
          <button className="pw-cta">Explore Soul Made →</button>
        </div>
        </>}
      </div>
    </PillarPageLayout>
  );
}
