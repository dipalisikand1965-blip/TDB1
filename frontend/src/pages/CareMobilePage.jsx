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
import ServiceBookingModal, { guessServiceType } from '../components/ServiceBookingModal';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
import { applyMiraFilter, filterBreedProducts} from '../hooks/useMiraFilter';
import MiraEmptyRequest from '../components/common/MiraEmptyRequest';
import '../styles/mobile-design-system.css';

const G = {
  sage:'#40916C', deepMid:'#1B4332', mid:'#2D6A4F', light:'#74C69D',
  pale:'#D8F3DC', cream:'#F0FDF4', greenBg:'#F0FDF4', greenBorder:'rgba(64,145,108,0.2)',
  dark:'#0A1F13', darkText:'#1B4332', mutedText:'#40916C',
  border:'rgba(64,145,108,0.18)',
};

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
function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='medium'?[12]:[6]); }


// Mira Imagines cards for personalised tab
const CARE_IMAGINES = [
  { id:'ci-1', emoji:'🛁', name:'Grooming Kit for your breed', description:'Professional brush, enzymatic shampoo, nail clipper and ear cleaner — matched to your pet\'s coat type.' },
  { id:'ci-2', emoji:'💊', name:'Supplement Bundle', description:'Omega-3s for coat, probiotics for gut health, joint support — curated for your breed\'s known health needs.' },
  { id:'ci-3', emoji:'🦷', name:'Dental Wellness Set', description:'Enzymatic toothpaste, finger brush, dental chews — complete oral care routine for your pet.' },
  { id:'ci-4', emoji:'🏥', name:'First Aid Essentials', description:'Pet first aid kit with bandages, antiseptic, tick remover, thermometer — ready for emergencies.' },
];

function getCarePlanCards(pet) {
  const name = pet?.name || 'your dog';
  const coat = getCoatType(pet);
  const condition = getHealthCondition(pet);
  const breed = pet?.breed || 'Indie';
  const allergies = getAllergies(pet);
  return [
    {
      id:'cp-1', emoji:'✂️', name:`${name}'s Grooming Schedule`,
      description:`${coat === 'long' ? 'Long coat needs professional groom every 6–8 weeks.' : coat === 'curly' ? 'Curly coat needs trim every 4–6 weeks.' : 'Short coat — brush twice weekly, bath monthly.'} Nail trim every 3–4 weeks. Ear clean monthly.`,
    },
    {
      id:'cp-2', emoji:'🦷', name:'Dental Wellness Plan',
      description:`Brush ${name}'s teeth 3× weekly with enzymatic paste. Add dental chews daily. Annual dental scaling recommended for ${breed}.`,
    },
    {
      id:'cp-3', emoji:'💊', name:'Supplement Protocol',
      description:`Omega-3s for ${coat} coat health. ${condition ? `Joint support for ${condition}. ` : ''}Probiotic for gut health. Monthly deworming.${allergies.length > 0 ? ` Safe for ${name}'s ${allergies.join(' & ')} sensitivities.` : ''}`,
    },
    {
      id:'cp-4', emoji:'🏥', name:'Preventive Care Calendar',
      description:`Annual vaccinations, 6-monthly vet check-ups, monthly heartworm prevention. Tick & flea treatment monthly. Diet review every 6 months.`,
    },
  ];
}

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
  const [svcBooking, setSvcBooking] = useState({ isOpen: false, serviceType: 'grooming' });
  const [showCarePlan, setShowCarePlan] = useState(false);
  const [vaultData, setVaultData] = useState(null);

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

  // Fetch vault data when vault tab opens
  useEffect(() => {
    if (activeTab !== 'health-vault' || !currentPet?.id || vaultData) return;
    fetch(`${API_URL}/api/pet-vault/${currentPet.id}/summary`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setVaultData(d); })
      .catch(() => {});
  }, [activeTab, currentPet?.id, token, vaultData]);

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
  const coatType = getCoatType(currentPet);
  const carePlanCards = getCarePlanCards(currentPet);
  const intelligent = applyMiraFilter(allRaw, currentPet);
  const subCats = ['All', ...new Set(intelligent.map(p => p.sub_category).filter(Boolean))];
  const products = subCat === 'All' ? intelligent : intelligent.filter(p => p.sub_category === subCat);
  const miraPick = products.find(p => p.miraPick) || products[0] || null;

  return (
    <PillarPageLayout pillar="care" hideHero hideNavigation>
      <div className="mobile-page-container" style={{ backgroundColor: G.cream, color: G.dark }} data-testid="care-mobile">

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="care" pillarColor={G.sage} pillarLabel="Care" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct?.raw || selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.sage} />}

        {/* Hero */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.deepMid} 55%,${G.mid} 100%)`, padding:'40px 20px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.6)', letterSpacing:'0.15em', marginBottom:4 }}>THE DOGGY COMPANY</div>
              <div className="ios-h1" style={{ color:'#fff' }}>🌿 Care</div>
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
          <div className="ios-h2" style={{ color:'#fff', marginBottom:6 }}>Care & Wellness for {petName}</div>
          <div className="ios-body" style={{ color:'rgba(255,255,255,0.8)' }}>Grooming, health, dental, coat — all personalised</div>
        </div>

        {currentPet && <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="care" token={token} /></div>}

        {/* Grooming Profile Card (Fix 2) */}
        {currentPet && (
          <div style={{ margin:'0 16px 10px', display:'flex', gap:8 }}>
            <div style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(116,198,157,0.2)', borderRadius:14, padding:'12px 14px' }}>
              <div style={{ fontSize:9, letterSpacing:'0.14em', fontWeight:700, color:G.light, marginBottom:4 }}>GROOMING PROFILE</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{petName} · {coatType} coat</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginTop:2 }}>Brush · Bath · Nail trim</div>
            </div>
            <div style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(116,198,157,0.2)', borderRadius:14, padding:'12px 14px' }}>
              <div style={{ fontSize:9, letterSpacing:'0.14em', fontWeight:700, color:G.light, marginBottom:4 }}>HEALTH VAULT</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>
                {vaultData ? `${vaultData.vaccines_count || 0} vaccines` : 'Tap to view'}
              </div>
              <button onClick={() => setActiveTab('health-vault')} style={{ fontSize:12, color:G.light, background:'none', border:'none', cursor:'pointer', padding:0, marginTop:2 }}>
                Open vault →
              </button>
            </div>
          </div>
        )}

        {/* Soul Pillar CTA */}
        {currentPet && (
          <div style={{ margin:'0 16px 20px', background:'linear-gradient(135deg,rgba(116,198,157,0.14),rgba(116,198,157,0.20))', border:'1px solid rgba(116,198,157,0.35)', borderRadius:18, padding:'18px 16px' }}>
            <div style={{ fontSize:20, fontWeight:700, color:'#1A0A2E', lineHeight:1.25, marginBottom:5 }}>
              How would <span style={{ color:'#059669' }}>{petName}</span> love to be cared for?
            </div>
            <div style={{ fontSize:13, color:'#4B5563', lineHeight:1.5 }}>
              Every recommendation is personalised to {petName}'s health, breed and allergies.
            </div>
          </div>
        )}

        {/* Tab Bar */}
        {currentPet && <PawrentFirstStepsTab pet={currentPet} token={token} currentPillar="care" />}
        <div className="ios-tab-bar" style={{ borderColor: G.border }}>
          {[
            { id:'care',         label:'🌿 Care & Products' },
            { id:'services',     label:'✂️ Grooming & Services' },
            { id:'health-vault', label:'🏥 Health Vault' },
            { id:'find-care',    label:'📍 Find Care' },
          ].map(tab => (
            <button key={tab.id} className={`ios-tab${activeTab===tab.id?' active':''}`}
              style={activeTab === tab.id ? { backgroundColor: G.dark, color: '#fff' } : {}}
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
              <div style={{ fontSize:14, fontWeight:700, color:`rgba(116,198,157,0.9)`, letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {petName.toUpperCase()}'S WELLNESS</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>
                {allergies.length > 0
                  ? `"${petName} has ${allergies.join(' and ')} sensitivities. I've filtered all products to be safe."`
                  : `"Let me show you what ${petName} actually needs for optimal health — not just what sells."`}
              </div>
              <button className="ios-btn-primary" style={{ background: `linear-gradient(135deg,${G.mid},${G.sage})` }} onClick={() => { vibe('medium'); setShowCarePlan(true); }}>
                Get {petName}'s Care Plan →
              </button>
            </div>

            {/* dimTab: Products / Personalised */}
            <div style={{ display:'flex', margin:'16px 16px 0', background:G.pale, borderRadius:12, padding:4 }}>
              {[{ id:'products', label:'🎯 All Products' }, { id:'personalised', label:'✦ Personalised' }].map(t => (
                <button key={t.id} onClick={() => { setDimTab(t.id); setSubCat('All'); }}
                  style={{ flex:1, padding:'9px', borderRadius:10, border:'none', fontSize:14, fontWeight:600, cursor:'pointer',
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
                        style={{ flexShrink:0, padding:'6px 14px', borderRadius:20, fontSize:14, fontWeight:600,
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
                  <div style={{ display:'flex', gap:12, marginBottom:12, fontSize:14, color:'#888' }}>
                    <span style={{ color:'#27AE60', fontWeight:700 }}>✓ {intelligent.length} safe for {petName}</span>
                    {allRaw.length - intelligent.length > 0 && (
                      <span style={{ color:'#E87722' }}>✗ {allRaw.length - intelligent.length} filtered (allergens)</span>
                    )}
                  </div>
                )}

                {/* Mira's pick callout */}
                {miraPick && (
                  <div style={{ background:'linear-gradient(135deg,rgba(255,140,66,0.1),rgba(196,77,255,0.06))', border:'1px solid rgba(255,140,66,0.3)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#FF8C42,#C44DFF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#fff', flexShrink:0 }}>✦</div>
                    <div style={{ fontSize:14, color:'#3D1A00', lineHeight:1.4 }}>
                      <strong>Mira's pick:</strong> {miraPick.name}
                      {miraPick.mira_hint && <span style={{ color:'#888', marginLeft:5 }}>— {miraPick.mira_hint}</span>}
                    </div>
                  </div>
                )}

                {products.length === 0 ? (
                  <MiraEmptyRequest
                    pet={currentPet}
                    pillar="care"
                    categoryName={`Care${subCat !== 'All' ? ` — ${subCat}` : ''} Products`}
                    accentColor={G.sage}
                    onRequest={async (msg) => {
                      await request(msg, { channel:'care_empty_products', metadata:{ subCat, petName } });
                    }}
                  />
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
                    <div style={{ borderTop:`1px solid ${G.border}`, paddingTop:10, marginTop:4, display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:14, color:'#888' }}>
                      <span>Filtered for {petName}{allergies.length > 0 ? ` · ${allergies.slice(0,2).join(' & ')}-free` : ''}</span>
                    </div>
                  </>
                )}

                {/* Mira Imagines */}
                {currentPet && <div style={{ marginTop:16 }}><MiraImaginesBreed pet={currentPet} pillar="care" token={token} /></div>}

                {/* Guided Paths */}
                <div style={{ marginTop:16 }}><GuidedCarePaths pet={currentPet} /></div>

                {/* SoulMade CTA */}
                <div style={{ marginTop:16, background:G.dark, borderRadius:24, padding:24, cursor:'pointer', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }} onClick={() => setSoulMadeOpen(true)}>
                  <div style={{ fontSize:14, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:10 }}>✦ SOUL MADE™ · MADE ONLY FOR {petName.toUpperCase()}</div>
                  <div className="ios-h2" style={{ color:'#fff', marginBottom:16 }}>{petName}'s breed-specific care, curated by Mira.</div>
                  <button className="ios-btn-primary" style={{ background: `linear-gradient(135deg,${G.mid},${G.sage})` }}>Explore Soul Made →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Grooming & Care Services */}
        {activeTab === 'services' && (
          <div style={{ padding:'16px' }}>
            {/* Grooming Profile Summary */}
            <div style={{ background:G.dark, borderRadius:18, padding:'16px', marginBottom:16 }}>
              <div style={{ fontSize:10, letterSpacing:'0.14em', fontWeight:700, color:G.light, marginBottom:6 }}>✦ {petName.toUpperCase()}'S GROOMING PROFILE</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>
                {currentPet?.breed || 'Indie'} · {coatType} coat
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginBottom:12 }}>
                {coatType === 'long' ? 'Brush daily, professional groom every 6–8 weeks' :
                 coatType === 'curly' ? 'Brush 3× weekly, trim every 4–6 weeks' :
                 coatType === 'short' ? 'Brush twice weekly, bath when needed' :
                 'Brush 2–3× weekly, bath monthly'}
              </div>
              <PersonalisedBreedSection pet={currentPet} pillar="care" token={token} entityType="service" heading={`Grooming services for ${petName}`} />
            </div>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:G.darkText }}>Care Services for {petName}</div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:16 }}>Vet, dental, boarding — all arranged by Concierge®.</div>
            <CareConciergeSection pet={currentPet} />
          </div>
        )}

        {/* TAB 3: Health Vault (Fix 1) */}
        {activeTab === 'health-vault' && (
          <div style={{ padding:'16px' }}>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:G.darkText }}>{petName}'s Health Vault</div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:16 }}>Medical records, vaccinations, vet visits.</div>

            {!vaultData ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:G.mutedText }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🏥</div>
                <div style={{ fontSize:15, fontWeight:600 }}>Loading vault…</div>
              </div>
            ) : (
              <>
                {/* Vaccines */}
                <div style={{ background:'#fff', borderRadius:16, padding:16, marginBottom:12, border:`1px solid ${G.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:G.darkText, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                    💉 Vaccinations
                    <span style={{ marginLeft:'auto', fontSize:12, color:G.mutedText }}>{(vaultData.vaccines || []).length} logged</span>
                  </div>
                  {(vaultData.vaccines || []).length === 0 ? (
                    <div style={{ fontSize:13, color:'#888' }}>No vaccines logged yet. Add via full vault.</div>
                  ) : (
                    (vaultData.vaccines || []).slice(0,4).map((v,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop: i > 0 ? `1px solid ${G.border}` : 'none' }}>
                        <span style={{ fontSize:14, fontWeight:600, color:G.darkText }}>{v.name || v.vaccine_name || 'Vaccine'}</span>
                        <span style={{ fontSize:13, color:G.mutedText }}>
                          {v.next_due ? `Due ${new Date(v.next_due).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}` : (v.date_given ? `Given ${new Date(v.date_given).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}` : '—')}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Medications */}
                <div style={{ background:'#fff', borderRadius:16, padding:16, marginBottom:12, border:`1px solid ${G.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:G.darkText, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                    💊 Medications
                    <span style={{ marginLeft:'auto', fontSize:12, color:G.mutedText }}>{(vaultData.medications || []).length} logged</span>
                  </div>
                  {(vaultData.medications || []).length === 0 ? (
                    <div style={{ fontSize:13, color:'#888' }}>No medications logged.</div>
                  ) : (
                    (vaultData.medications || []).slice(0,4).map((m,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop: i > 0 ? `1px solid ${G.border}` : 'none' }}>
                        <span style={{ fontSize:14, fontWeight:600, color:G.darkText }}>{m.name || m.medication_name || 'Medication'}</span>
                        <span style={{ fontSize:13, color:G.mutedText }}>{m.dosage || m.dose || '—'}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Allergies */}
                {allergies.length > 0 && (
                  <div style={{ background:'#FFF5F5', borderRadius:16, padding:16, marginBottom:12, border:'1px solid rgba(255,80,80,0.15)' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#C0392B', marginBottom:10 }}>⚠️ Known Allergies</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {allergies.map((a,i) => (
                        <span key={i} style={{ fontSize:13, background:'rgba(255,80,80,0.1)', color:'#C0392B', padding:'4px 10px', borderRadius:999, fontWeight:600 }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vet Visits */}
                <div style={{ background:'#fff', borderRadius:16, padding:16, marginBottom:12, border:`1px solid ${G.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:G.darkText, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                    🏥 Vet Visits
                    <span style={{ marginLeft:'auto', fontSize:12, color:G.mutedText }}>{(vaultData.vet_visits || []).length} logged</span>
                  </div>
                  {(vaultData.vet_visits || []).length === 0 ? (
                    <div style={{ fontSize:13, color:'#888' }}>No vet visits logged.</div>
                  ) : (
                    (vaultData.vet_visits || []).slice(0,3).map((v,i) => (
                      <div key={i} style={{ padding:'8px 0', borderTop: i > 0 ? `1px solid ${G.border}` : 'none' }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontSize:14, fontWeight:600, color:G.darkText }}>{v.reason || v.type || 'Check-up'}</span>
                          <span style={{ fontSize:13, color:G.mutedText }}>{v.date ? new Date(v.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'}) : '—'}</span>
                        </div>
                        {v.vet_name && <div style={{ fontSize:12, color:'#888' }}>Dr. {v.vet_name}</div>}
                      </div>
                    ))
                  )}
                </div>

                {/* Open full vault CTA */}
                <button
                  onClick={() => navigate(`/pet-vault/${currentPet?.id}`)}
                  className="ios-btn-primary" style={{ background:`linear-gradient(135deg,${G.mid},${G.sage})`, width:'100%', marginTop:8 }}>
                  Open Full Vault →
                </button>
              </>
            )}
          </div>
        )}

        {/* TAB 4: Find Care */}
        {activeTab === 'find-care' && (
          <div style={{ padding:'16px' }}>
            <CareNearMe pet={currentPet} token={token} onBook={svc => {
              tdc.book({ service:svc, pillar:'care', pet:currentPet, channel:'care_nearme' });
              setSvcBooking({ isOpen: true, serviceType: guessServiceType(svc) });
            }} />
          </div>
        )}
      </div>

      {/* Service Booking Modal — full 4-step flow */}
      <ServiceBookingModal
        isOpen={svcBooking.isOpen}
        onClose={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
        serviceType={svcBooking.serviceType}
        onBookingComplete={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
      />

      {/* Mira Care Plan Modal (Fix 3) */}
      {showCarePlan && (
        <div style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', justifyContent:'flex-end' }} onClick={e => { if(e.target===e.currentTarget) setShowCarePlan(false); }}>
          <div style={{ background:G.dark, borderRadius:'24px 24px 0 0', padding:'24px 16px 48px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:10, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:4 }}>✦ MIRA'S PERSONALISED CARE PLAN</div>
                <div style={{ fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.2 }}>Curated for {petName}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:4 }}>{currentPet?.breed || 'Indie'} · {coatType} coat{allergies.length > 0 ? ` · no ${allergies.slice(0,2).join(', ')}` : ''}</div>
              </div>
              <button onClick={() => setShowCarePlan(false)} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:32, height:32, color:'#fff', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>×</button>
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:20, lineHeight:1.5 }}>
              Mira has analysed {petName}'s breed, health history, allergies, and soul profile to create this care plan.
            </div>
            {carePlanCards.map(item => (
              <MiraImaginesCard key={item.id} item={item} pet={currentPet} token={token} pillar="care" />
            ))}
            <button
              className="ios-btn-primary"
              style={{ background:`linear-gradient(135deg,${G.mid},${G.sage})`, width:'100%', marginTop:8 }}
              onClick={() => { setShowCarePlan(false); request(`Care plan for ${petName}`, { channel:'care_plan_book' }); }}>
              Book via Concierge® →
            </button>
          </div>
        </div>
      )}
    </PillarPageLayout>
  );
}
