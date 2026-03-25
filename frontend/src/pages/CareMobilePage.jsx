/**
 * CareMobilePage.jsx — /care (mobile)
 * 3-tab layout: Care & Products | Care Services | Find Care
 * Products tab: dimTab (Products/Personalised) + sub-category pills
 * Colour: Sage Green #40916C
 */
import { useState, useEffect, useCallback, useRef } from 'react';
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
import CareConciergeSection from '../components/care/CareConciergeSection';
import CareNearMe from '../components/care/CareNearMe';
import GuidedCarePaths from '../components/care/GuidedCarePaths';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';

const G = {
  sage:'#40916C', deepMid:'#1B4332', mid:'#2D6A4F', light:'#74C69D',
  pale:'#D8F3DC', cream:'#F0FDF4', greenBg:'#F0FDF4', greenBorder:'rgba(64,145,108,0.2)',
  dark:'#0A1F13', darkText:'#1B4332', mutedText:'#40916C',
  border:'rgba(64,145,108,0.18)',
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.care-m{font-family:'DM Sans',-apple-system,sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.care-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.mid},${G.sage});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.care-cta:active{transform:scale(0.97)}
.care-tab{flex:1;padding:12px 4px;background:none;border:none;border-bottom:2.5px solid transparent;font-size:13px;font-weight:500;color:#999;cursor:pointer;transition:all 0.15s;white-space:nowrap;font-family:inherit}
.care-tab.active{color:${G.sage};border-bottom-color:${G.sage};font-weight:700}`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='medium'?[12]:[6]); }

import { applyMiraFilter } from '../hooks/useMiraFilter';

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
function getCoatType(pet) {
  const b = (pet?.breed || '').toLowerCase();
  if (/poodle|schnauzer|bichon|maltese|shih|yorkshire/.test(b)) return 'curly';
  if (/golden|husky|border|chow|samoyed/.test(b)) return 'long';
  if (/boxer|bulldog|lab|pointer|weimaraner|dalmatian/.test(b)) return 'short';
  return 'medium';
}
function getHealthCondition(pet) { return pet?.health_condition || pet?.medical_condition || null; }
const KNOWN_BREEDS = ['american bully','beagle','border collie','boxer','cavalier','chihuahua','chow chow','dachshund','dalmatian','doberman','english bulldog','french bulldog','german shepherd','golden retriever','husky','indie','jack russell','labrador','lhasa apso','maltese','pomeranian','poodle','pug','rottweiler','shih tzu','yorkshire'];
function filterBreedProducts(products, petBreed) {
  const pl=(petBreed||'').toLowerCase(); const pw=pl.split(/\s+/).filter(w=>w.length>2);
  return products.filter(p=>{const n=(p.name||'').toLowerCase();for(const b of KNOWN_BREEDS){if(n.includes(b)){if(!pl)return false;if(n.includes(pl))return true;if(pw.some(w=>b.includes(w)))return true;return false;}}return true;});
}

const CARE_IMAGINES = [
  { id:'c-1', emoji:'🧴', name:'Grooming Essentials Kit', description:'Breed-appropriate shampoo, conditioner, and grooming tools — curated for your dog.' },
  { id:'c-2', emoji:'🦷', name:'Dental Care Bundle', description:'Enzymatic toothpaste, finger brush, and dental chews — complete dental health at home.' },
  { id:'c-3', emoji:'💊', name:'Supplement Stack', description:'Vet-recommended supplements — joint support, coat health, and immunity — for your breed.' },
];

export default function CareMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'care', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'care' });
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('care');
  const [dimTab, setDimTab] = useState('products');
  const [subCat, setSubCat] = useState('All');
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [allRaw, setAllRaw] = useState([]);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (!currentPet?.id) return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=care&limit=200`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.products) setAllRaw(filterBreedProducts(d.products, currentPet?.breed)); })
      .catch(() => {});
  }, [currentPet?.id, token]);

  const handleAddToCart = useCallback(p => {
    addToCart({ id:p.id||p._id, name:p.name, price:p.price||0, image:p.image_url||p.images?.[0], pillar:'care', quantity:1 });
  }, [addToCart]);

  if (loading) return (
    <PillarPageLayout pillar="care" hideHero hideNavigation>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>🌿</div><div>Loading care products…</div></div>
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
    <PillarPageLayout pillar="care" hideHero hideNavigation>
      <div className="care-m" data-testid="care-mobile">
        <style>{CSS}</style>

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="care" pillarColor={G.sage} pillarLabel="Care" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct?.raw || selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.sage} />}

        {/* Hero */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.deepMid} 55%,${G.mid} 100%)`, padding:'32px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>🌿 Care</div>
            </div>
            {contextPets?.length > 1 && (
              <select value={currentPet?.id} onChange={e => { vibe(); setCurrentPet(contextPets.find(p => p.id === e.target.value)); }}
                style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:999, padding:'7px 14px', color:'#fff', fontSize:13 }}>
                {contextPets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>Care & Wellness for {petName}</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>Grooming, health, dental, coat — all personalised</div>
        </div>

        {currentPet && <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="care" token={token} /></div>}

        {/* Tab Bar */}
        <div style={{ display:'flex', background:'#fff', borderBottom:`1px solid ${G.border}`, position:'sticky', top:0, zIndex:100 }}>
          {[
            { id:'care',      label:'🌿 Care & Products' },
            { id:'services',  label:'✂️ Care Services' },
            { id:'find-care', label:'📍 Find Care' },
          ].map(tab => (
            <button key={tab.id} className={`care-tab${activeTab===tab.id?' active':''}`}
              data-testid={`care-tab-${tab.id}`}
              onClick={() => { vibe(); setActiveTab(tab.id); setSubCat('All'); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Care & Products */}
        {activeTab === 'care' && (
          <div>
            {/* Mira Bar */}
            <div style={{ margin:'16px 16px 0', background:G.dark, borderRadius:20, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:`rgba(116,198,157,0.9)`, letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {petName.toUpperCase()}'S WELLNESS</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>
                {allergies.length > 0
                  ? `"${petName} has ${allergies.join(' and ')} sensitivities. I've filtered all products to be safe."`
                  : `"Let me show you what ${petName} actually needs for optimal health — not just what sells."`}
              </div>
              <button className="care-cta" onClick={() => { vibe('medium'); request('Care recommendations', { channel:'care_mira_cta' }); }}>
                Get {petName}'s Care Plan →
              </button>
            </div>

            {/* dimTab: Products / Personalised */}
            <div style={{ display:'flex', margin:'16px 16px 0', background:G.pale, borderRadius:12, padding:4 }}>
              {[{ id:'products', label:'🎯 All Products' }, { id:'personalised', label:'✦ Personalised' }].map(t => (
                <button key={t.id} onClick={() => { setDimTab(t.id); setSubCat('All'); }}
                  style={{ flex:1, padding:'9px', borderRadius:10, border:'none', fontSize:13, fontWeight:600, cursor:'pointer',
                    background:dimTab===t.id?G.sage:G.pale, color:dimTab===t.id?'#fff':G.mutedText }}>
                  {t.label}
                </button>
              ))}
            </div>

            {dimTab === 'personalised' ? (
              <div style={{ padding:'16px 16px 24px' }}>
                <PersonalisedBreedSection pet={currentPet} pillar="care" token={token} />
                {CARE_IMAGINES.map(item => <MiraImaginesCard key={item.id} item={item} pet={currentPet} token={token} pillar="care" />)}
              </div>
            ) : (
              <div style={{ padding:'16px' }}>
                {/* Sub-category pills */}
                {subCats.length > 1 && (
                  <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:12, paddingBottom:4 }}>
                    {subCats.map(cat => (
                      <button key={cat} onClick={() => setSubCat(cat)}
                        style={{ flexShrink:0, padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600,
                          border:`1.5px solid ${subCat===cat?G.sage:G.border}`,
                          background:subCat===cat?G.sage:'#fff',
                          color:subCat===cat?'#fff':G.darkText, cursor:'pointer' }}>
                        {cat.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                )}

                {/* Mira Intelligence stats */}
                {allRaw.length > 0 && (
                  <div style={{ display:'flex', gap:12, marginBottom:12, fontSize:12, color:'#888' }}>
                    <span style={{ color:'#27AE60', fontWeight:700 }}>✓ {intelligent.length} safe for {petName}</span>
                    {allRaw.length - intelligent.length > 0 && (
                      <span style={{ color:'#E87722' }}>✗ {allRaw.length - intelligent.length} filtered (allergens)</span>
                    )}
                  </div>
                )}

                {/* Mira's pick callout */}
                {miraPick && (
                  <div style={{ background:'linear-gradient(135deg,rgba(255,140,66,0.1),rgba(196,77,255,0.06))', border:'1px solid rgba(255,140,66,0.3)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#FF8C42,#C44DFF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', flexShrink:0 }}>✦</div>
                    <div style={{ fontSize:13, color:'#3D1A00', lineHeight:1.4 }}>
                      <strong>Mira's pick:</strong> {miraPick.name}
                      {miraPick.mira_hint && <span style={{ color:'#888', marginLeft:5 }}>— {miraPick.mira_hint}</span>}
                    </div>
                  </div>
                )}

                {products.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'32px 0', color:'#888' }}>
                    {allergies.length > 0 ? (
                      <>
                        <div style={{ fontSize:32, marginBottom:8 }}>🛡️</div>
                        <div>Mira filtered everything here for {petName}&apos;s {allergies.join(' & ')} allergies.</div>
                        <div style={{ marginTop:8, fontSize:13, color:'#27AE60', fontWeight:600 }}>Ask Concierge to source safe alternatives →</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize:32, marginBottom:8 }}>🌿</div>
                        <div>Loading care products for {petName}…</div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      {products.slice(0, 40).map(p => (
                        <div key={p.id||p._id||p.name} style={{ opacity: p._dimmed ? 0.55 : 1, position:'relative' }}>
                          <SharedProductCard product={p} pillar="care" selectedPet={currentPet}
                            onAddToCart={() => handleAddToCart(p)}
                            onClick={() => { vibe(); setSelectedProduct(p); }} />
                        </div>
                      ))}
                    </div>
                    {/* Footer */}
                    <div style={{ borderTop:`1px solid ${G.border}`, paddingTop:10, marginTop:4, display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, color:'#888' }}>
                      <span>{products.length} items · filtered for {petName}{allergies.length > 0 ? ` · no ${allergies.join(', ')}` : ''}</span>
                    </div>
                  </>
                )}

                {/* Mira Imagines */}
                {currentPet && <div style={{ marginTop:16 }}><MiraImaginesBreed pet={currentPet} pillar="care" token={token} /></div>}

                {/* Guided Paths */}
                <div style={{ marginTop:16 }}><GuidedCarePaths pet={currentPet} /></div>

                {/* SoulMade CTA */}
                <div style={{ marginTop:16, background:G.dark, borderRadius:20, padding:18, cursor:'pointer' }} onClick={() => setSoulMadeOpen(true)}>
                  <div style={{ fontSize:10, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:8 }}>✦ SOUL MADE™ · MADE ONLY FOR {petName.toUpperCase()}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>{petName}'s breed-specific care, curated by Mira.</div>
                  <button className="care-cta">Explore Soul Made →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Care Services */}
        {activeTab === 'services' && (
          <div style={{ padding:'16px' }}>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:G.darkText }}>Care Services for {petName}</div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:16 }}>Grooming, vet, dental, boarding — all arranged by Concierge®.</div>
            <CareConciergeSection pet={currentPet} />
          </div>
        )}

        {/* TAB 3: Find Care */}
        {activeTab === 'find-care' && (
          <div style={{ padding:'16px' }}>
            <CareNearMe pet={currentPet} token={token} onBook={svc => {
              tdc.book({ service:svc, pillar:'care', pet:currentPet, channel:'care_nearme' });
            }} />
          </div>
        )}
      </div>
    </PillarPageLayout>
  );
}
