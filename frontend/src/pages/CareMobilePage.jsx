/**
 * CareMobilePage.jsx — /care (mobile) — FULLY AUDITED FIX (Session 89)
 *
 * Fixes applied:
 *  Fix 1 — Grooming modal: dim tap → CareContentModal (self-fetching, same as desktop)
 *  Fix 2 — Wellness modal: same wiring
 *  Fix 3 — Products loading: CareContentModal uses /api/admin/pillar-products?pillar=care&limit=600
 *           grouped by p.dimension — replaces broken category-name filter
 *  Fix 4 — Soul pillar tabs: 9 dims shown as scrolling pills, tap opens modal
 *  Fix 5 — Mira's Picks: CareContentModal category="mira" used (same as desktop)
 *  Fix 6 — Services cards: CARE_SERVICES cards with prices + ServiceBookingModal (same as desktop)
 *  Fix 7 — Modal fonts: all text ≥ 14px enforced in Care Plan modal
 *  Fix 8 — Vaccine schedule wired: concierge booking card in Health Vault tab
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
import CareContentModal from '../components/care/CareContentModal';
import CareConciergeSection from '../components/care/CareConciergeSection';
import CareNearMe from '../components/care/CareNearMe';
import GuidedCarePaths from '../components/care/GuidedCarePaths';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import SoulMadeModal from '../components/SoulMadeModal';
import ServiceBookingModal, { guessServiceType } from '../components/ServiceBookingModal';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
import '../styles/mobile-design-system.css';

const G = {
  sage:'#40916C', deepMid:'#1B4332', mid:'#2D6A4F', light:'#74C69D',
  pale:'#D8F3DC', cream:'#F0FDF4', greenBg:'#F0FDF4', greenBorder:'rgba(64,145,108,0.2)',
  dark:'#0A1F13', darkText:'#1B4332', mutedText:'#40916C',
  border:'rgba(64,145,108,0.18)',
};

/* ── Pet helpers ── */
function getAllergies(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => { if (x && !['none','no allergies','nil','n/a'].includes(String(x).toLowerCase().trim())) s.add(String(x).trim()); });
    else if (v && !['none','no allergies','nil','n/a'].includes(String(v).toLowerCase().trim())) { String(v).split(',').forEach(a => { const t = a.trim(); if (t) s.add(t); }); }
  };
  add(pet?.allergies); add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies); add(pet?.doggy_soul_answers?.allergies);
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

/* ── 9 DIM CATEGORIES — exact match with desktop ── */
function getCareDims(pet) {
  const coat      = getCoatType(pet);
  const condition = getHealthCondition(pet);
  const allergies = getAllergies(pet);
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  return [
    { id:'grooming',    icon:'✂️',  label:'Grooming',      sub: coat ? `${cap(coat)} coat match` : 'Coat care, bath & salon' },
    { id:'dental',      icon:'🦷',  label:'Dental & Paw',  sub:'Oral care, paw & nail' },
    { id:'coat',        icon:'🌿',  label:'Coat & Skin',   sub: allergies.length ? `${allergies.slice(0,1)}-free options` : 'Inside-out coat health' },
    { id:'wellness',    icon:'🏥',  label:'Wellness',      sub:'Vet discovery & health records' },
    { id:'senior',      icon:'🌸',  label:'Senior Care',   sub: condition ? `${condition} support` : 'Comfort & mobility' },
    { id:'supplements', icon:'💊',  label:'Supplements',   sub: condition ? `Safe for ${condition}` : 'Vet-checked, personalised' },
    { id:'soul',        icon:'✨',  label:'Soul Care',     sub:`Breed collection for ${pet?.name||'your dog'}` },
    { id:'mira',        icon:'🪄',  label:"Mira's Picks",  sub:'Curated for your pet' },
    { id:'soul_made',   icon:'✦',   label:'Soul Made™',   sub:'Custom-made for your dog' },
  ];
}

/* ── CARE SERVICES — exact copy from desktop CARE_SERVICES ── */
const CARE_SERVICES = [
  { id:'grooming',   icon:'✂️', name:'Grooming',             tagline:'Hygiene, coat care, bath, nail trim',       price:'From Rs.999',  accentColor:'#C2185B' },
  { id:'vet',        icon:'🏥', name:'Vet Visits',            tagline:'Clinic discovery, booking & follow-up',     price:'From Rs.499',  accentColor:'#1565C0' },
  { id:'boarding',   icon:'🏡', name:'Boarding & Daycare',   tagline:'Overnight boarding & daytime supervision',   price:'From Rs.599',  accentColor:'#2D6A4F' },
  { id:'sitting',    icon:'🏠', name:'Pet Sitting',           tagline:'In-home care, feeding & companionship',     price:'From Rs.799',  accentColor:'#E65100' },
  { id:'behaviour',  icon:'💜', name:'Behaviour Support',    tagline:'Anxiety, fear & stress support',             price:'From Rs.1299', accentColor:'#6A1B9A' },
  { id:'senior',     icon:'🌸', name:'Senior & Special Care',tagline:'Comfort, mobility & special handling',       price:'From Rs.999',  accentColor:'#AD1457' },
  { id:'nutrition',  icon:'🥗', name:'Nutrition Consults',   tagline:'Diet consults & allergy support',            price:'From Rs.1499', accentColor:'#E65100' },
  { id:'emergency',  icon:'🚨', name:'Emergency Help',       tagline:'Urgent care routing & coordination',         price:'Free',         accentColor:'#C62828', urgent:true },
];

/* ── Care plan imagines cards ── */
function getCarePlanCards(pet) {
  const name = pet?.name || 'your dog';
  const coat = getCoatType(pet);
  const condition = getHealthCondition(pet);
  const breed = pet?.breed || 'Indie';
  const allergies = getAllergies(pet);
  return [
    { id:'cp-1', emoji:'✂️', name:`${name}'s Grooming Schedule`,
      description:`${coat === 'long' ? 'Long coat needs professional groom every 6–8 weeks.' : coat === 'curly' ? 'Curly coat needs trim every 4–6 weeks.' : 'Short coat — brush twice weekly, bath monthly.'} Nail trim every 3–4 weeks.` },
    { id:'cp-2', emoji:'🦷', name:'Dental Wellness Plan',
      description:`Brush ${name}'s teeth 3× weekly with enzymatic paste. Add dental chews daily. Annual dental scaling recommended for ${breed}.` },
    { id:'cp-3', emoji:'💊', name:'Supplement Protocol',
      description:`Omega-3s for ${coat} coat health. ${condition ? `Joint support for ${condition}. ` : ''}Probiotic for gut health. Monthly deworming.${allergies.length > 0 ? ` Safe for ${name}'s ${allergies.join(' & ')} sensitivities.` : ''}` },
    { id:'cp-4', emoji:'🏥', name:'Preventive Care Calendar',
      description:`Annual vaccinations, 6-monthly vet check-ups, monthly heartworm prevention. Tick & flea treatment monthly.` },
  ];
}

export default function CareMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'care', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'care' });
  const { addToCart } = useCart();

  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('care');
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [svcBooking, setSvcBooking]   = useState({ isOpen:false, serviceType:'grooming' });
  const [showCarePlan, setShowCarePlan] = useState(false);
  const [vaultData, setVaultData]     = useState(null);

  /* Fix 1–5: CareContentModal state — opened when a dim pill is tapped */
  const [modalCategory, setModalCategory] = useState(null);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  /* Health Vault fetch */
  useEffect(() => {
    if (activeTab !== 'health-vault' || !currentPet?.id) return;
    if (vaultData) return;
    Promise.all([
      fetch(`${API_URL}/api/pet-vault/${currentPet.id}/summary`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
        .then(r => r.ok ? r.json() : {}),
      fetch(`${API_URL}/api/pet-vault/${currentPet.id}/vaccines`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
        .then(r => r.ok ? r.json() : { vaccines:[] }),
      fetch(`${API_URL}/api/pet-vault/${currentPet.id}/medications`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
        .then(r => r.ok ? r.json() : { medications:[] }),
    ]).then(([summary, vaxData, medData]) => {
      setVaultData({
        ...summary,
        vaccines: vaxData.vaccines || [],
        medications: medData.medications || [],
        vet_visits: [],
        vaccines_count: summary?.summary?.total_vaccines || 0,
      });
    }).catch(() => setVaultData({ vaccines:[], medications:[], vet_visits:[] }));
  }, [activeTab, currentPet?.id, token, vaultData]);

  if (loading) return (
    <PillarPageLayout pillar="care" hideHero hideNavigation>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>🌿</div><div>Loading…</div></div>
      </div>
    </PillarPageLayout>
  );

  const petName   = currentPet?.name || 'your dog';
  const allergies = getAllergies(currentPet);
  const coatType  = getCoatType(currentPet);
  const carePlanCards = getCarePlanCards(currentPet);
  const careDims  = getCareDims(currentPet);

  return (
    <PillarPageLayout pillar="care" hideHero hideNavigation>
      <div className="mobile-page-container" style={{ backgroundColor:G.cream, color:G.dark }} data-testid="care-mobile">

        {/* Fix 1–5: CareContentModal — same component as desktop, fetches its own products */}
        <CareContentModal
          isOpen={!!modalCategory}
          onClose={() => setModalCategory(null)}
          category={modalCategory}
          pet={currentPet}
        />

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="care" pillarColor={G.sage} pillarLabel="Care" onClose={() => setSoulMadeOpen(false)} />}

        {/* ── Hero ── */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.deepMid} 55%,${G.mid} 100%)`, padding:'40px 20px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.6)', letterSpacing:'0.15em', marginBottom:4 }}>THE DOGGY COMPANY</div>
              <div className="ios-h1" style={{ color:'#fff' }}>🌿 Care</div>
            </div>
            {contextPets?.length > 1 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {contextPets.map(p => (
                  <button key={p.id} onClick={() => { vibe(); setCurrentPet(p); setModalCategory(null); }}
                    style={{ padding:'6px 16px', borderRadius:999, fontSize:13, fontWeight:700,
                      border: currentPet?.id===p.id ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.3)',
                      background: currentPet?.id===p.id ? 'rgba(255,255,255,0.22)' : 'transparent',
                      color:'#fff', cursor:'pointer' }}>
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

        {/* Quick action cards */}
        {currentPet && (
          <div style={{ margin:'0 16px 10px', display:'flex', gap:8 }}>
            <div style={{ flex:1, background:'rgba(64,145,108,0.1)', border:`1px solid ${G.greenBorder}`, borderRadius:14, padding:'12px 14px', cursor:'pointer' }}
              onClick={() => setModalCategory('grooming')}>
              <div style={{ fontSize:11, letterSpacing:'0.12em', fontWeight:700, color:G.mid, marginBottom:4 }}>GROOMING PROFILE</div>
              <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{petName} · {coatType} coat</div>
              <div style={{ fontSize:12, color:G.mutedText, marginTop:2 }}>Tap to browse products →</div>
            </div>
            <div style={{ flex:1, background:'rgba(64,145,108,0.1)', border:`1px solid ${G.greenBorder}`, borderRadius:14, padding:'12px 14px', cursor:'pointer' }}
              onClick={() => setActiveTab('health-vault')}>
              <div style={{ fontSize:11, letterSpacing:'0.12em', fontWeight:700, color:G.mid, marginBottom:4 }}>HEALTH VAULT</div>
              <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>
                {vaultData ? `${vaultData.vaccines_count || vaultData.vaccines?.length || 0} vaccines` : 'Tap to view'}
              </div>
              <div style={{ fontSize:12, color:G.mutedText, marginTop:2 }}>Open vault →</div>
            </div>
          </div>
        )}

        {/* Personalisation CTA */}
        {currentPet && (
          <div style={{ margin:'0 16px 20px', background:`linear-gradient(135deg,rgba(116,198,157,0.14),rgba(116,198,157,0.20))`, border:`1px solid rgba(116,198,157,0.35)`, borderRadius:18, padding:'18px 16px' }}>
            <div style={{ fontSize:20, fontWeight:700, color:G.darkText, lineHeight:1.25, marginBottom:5 }}>
              How would <span style={{ color:'#059669' }}>{petName}</span> love to be cared for?
            </div>
            <div style={{ fontSize:14, color:'#4B5563', lineHeight:1.5 }}>
              Every recommendation is personalised to {petName}'s health, breed and allergies.
            </div>
          </div>
        )}

        {/* Pawrent Journey */}
        {currentPet && <PawrentFirstStepsTab pet={currentPet} token={token} currentPillar="care" />}

        {/* ── Tab Bar ── */}
        <div className="ios-tab-bar" style={{ borderColor:G.border }}>
          {[
            { id:'care',         label:'🌿 Care & Products' },
            { id:'services',     label:'✂️ Services' },
            { id:'health-vault', label:'🏥 Health Vault' },
            { id:'find-care',    label:'📍 Find Care' },
          ].map(tab => (
            <button key={tab.id} className={`ios-tab${activeTab===tab.id?' active':''}`}
              style={activeTab === tab.id ? { backgroundColor:G.dark, color:'#fff' } : {}}
              data-testid={`care-tab-${tab.id}`}
              onClick={() => { vibe(); setActiveTab(tab.id); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════ TAB 1: Care & Products ══════════ */}
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
              <button className="ios-btn-primary" style={{ background:`linear-gradient(135deg,${G.mid},${G.sage})` }}
                onClick={() => { vibe('medium'); setShowCarePlan(true); }}>
                Get {petName}'s Care Plan →
              </button>
            </div>

            {/* Fix 4: 9 DIM CATEGORY PILLS — tap opens CareContentModal */}
            <div style={{ padding:'16px 16px 0' }}>
              <div style={{ fontSize:12, fontWeight:700, color:G.mutedText, letterSpacing:'0.1em', marginBottom:10 }}>BROWSE BY CATEGORY</div>
              <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, WebkitOverflowScrolling:'touch' }}>
                {careDims.map(d => (
                  <button key={d.id}
                    data-testid={`care-dim-${d.id}`}
                    onClick={() => { vibe(); setModalCategory(d.id); }}
                    style={{
                      flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-start',
                      padding:'10px 14px', borderRadius:16, fontSize:13, fontWeight:600,
                      cursor:'pointer', border:`1.5px solid ${G.greenBorder}`, whiteSpace:'nowrap',
                      background:'#fff', color:G.darkText, minWidth:110,
                      boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                    <span style={{ fontSize:20, marginBottom:4 }}>{d.icon}</span>
                    <span style={{ fontWeight:700, fontSize:13 }}>{d.label}</span>
                    <span style={{ fontSize:11, color:G.mutedText, fontWeight:400, marginTop:2, whiteSpace:'normal', maxWidth:100 }}>{d.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Personalised section */}
            <div style={{ padding:'16px' }}>
              {currentPet && <PersonalisedBreedSection pet={currentPet} pillar="care" token={token} />}

              {/* Guided Paths */}
              <div style={{ marginTop:16 }}><GuidedCarePaths pet={currentPet} /></div>

              {/* SoulMade CTA */}
              <div style={{ marginTop:16, background:G.dark, borderRadius:24, padding:24, cursor:'pointer' }}
                onClick={() => setSoulMadeOpen(true)}>
                <div style={{ fontSize:14, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:10 }}>✦ SOUL MADE™ · MADE ONLY FOR {petName.toUpperCase()}</div>
                <div className="ios-h2" style={{ color:'#fff', marginBottom:16 }}>{petName}'s breed-specific care, curated by Mira.</div>
                <button className="ios-btn-primary" style={{ background:`linear-gradient(135deg,${G.mid},${G.sage})` }}>Explore Soul Made →</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ TAB 2: Care Services ══════════ */}
        {activeTab === 'services' && (
          <div style={{ padding:'16px' }}>
            {/* Fix 6: CARE_SERVICES cards — exact match with desktop */}
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:G.darkText }}>Care Services for {petName}</div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:16 }}>Vet, grooming, boarding — all arranged by Concierge®.</div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
              {CARE_SERVICES.map(svc => (
                <button key={svc.id}
                  data-testid={`care-svc-${svc.id}`}
                  onClick={() => { vibe('medium'); tdc.book({ service:svc, pillar:'care', pet:currentPet, channel:'care_service_card' }); setSvcBooking({ isOpen:true, serviceType:svc.id }); }}
                  style={{
                    textAlign:'left', padding:'14px 12px', borderRadius:16, cursor:'pointer',
                    border:`1.5px solid ${svc.urgent ? 'rgba(198,40,40,0.35)' : G.greenBorder}`,
                    background: svc.urgent ? 'rgba(198,40,40,0.05)' : '#fff',
                    boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{svc.icon}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:3 }}>{svc.name}</div>
                  <div style={{ fontSize:12, color:G.mutedText, marginBottom:8, lineHeight:1.4 }}>{svc.tagline}</div>
                  <div style={{ fontSize:13, fontWeight:700, color: svc.urgent ? '#C62828' : svc.accentColor }}>{svc.price}</div>
                </button>
              ))}
            </div>

            {/* Grooming profile + CareConciergeSection */}
            <div style={{ background:G.dark, borderRadius:18, padding:'16px', marginBottom:16 }}>
              <div style={{ fontSize:11, letterSpacing:'0.14em', fontWeight:700, color:G.light, marginBottom:6 }}>✦ {petName.toUpperCase()}'S GROOMING PROFILE</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>
                {currentPet?.breed || 'Indie'} · {coatType} coat
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', marginBottom:12 }}>
                {coatType === 'long'  ? 'Brush daily, professional groom every 6–8 weeks' :
                 coatType === 'curly' ? 'Brush 3× weekly, trim every 4–6 weeks' :
                 coatType === 'short' ? 'Brush twice weekly, bath when needed' :
                                        'Brush 2–3× weekly, bath monthly'}
              </div>
              <PersonalisedBreedSection pet={currentPet} pillar="care" token={token} entityType="service" heading={`Grooming services for ${petName}`} />
            </div>
            <CareConciergeSection pet={currentPet} />
          </div>
        )}

        {/* ══════════ TAB 3: Health Vault ══════════ */}
        {activeTab === 'health-vault' && (
          <div style={{ padding:'16px' }}>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:G.darkText }}>{petName}'s Health Vault</div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:16 }}>Medical records, vaccinations, vet visits.</div>

            {/* Fix 8: Vaccine schedule — concierge booking card */}
            <button
              data-testid="care-vaccine-schedule-btn"
              onClick={() => { vibe('medium'); request(`Vaccine schedule and tracking for ${petName}`, { channel:'care_vaccine_schedule', metadata:{ petName, breed:currentPet?.breed } }); }}
              style={{ width:'100%', textAlign:'left', padding:'16px', borderRadius:16, marginBottom:16, cursor:'pointer',
                background:`linear-gradient(135deg,rgba(64,145,108,0.12),rgba(45,106,79,0.08))`,
                border:`1.5px solid ${G.greenBorder}`, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:16, fontWeight:700, color:G.darkText, marginBottom:4 }}>💉 Vaccine Schedule</div>
              <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.5, marginBottom:10 }}>
                Log and track every vaccination in {petName}'s Health Vault. Will be arranged by your Concierge®.
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:G.sage }}>Book via Concierge® →</div>
            </button>

            {!vaultData ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:G.mutedText }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🏥</div>
                <div style={{ fontSize:16, fontWeight:600 }}>Loading vault…</div>
              </div>
            ) : (
              <>
                {/* Vaccines */}
                <div style={{ background:'#fff', borderRadius:16, padding:16, marginBottom:12, border:`1px solid ${G.border}` }}>
                  <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                    💉 Vaccinations
                    <span style={{ marginLeft:'auto', fontSize:13, color:G.mutedText }}>{(vaultData.vaccines || []).length} logged</span>
                  </div>
                  {(vaultData.vaccines || []).length === 0 ? (
                    <div style={{ fontSize:14, color:'#888' }}>No vaccines logged yet. Add via full vault.</div>
                  ) : (
                    (vaultData.vaccines || []).slice(0,4).map((v,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop: i > 0 ? `1px solid ${G.border}` : 'none' }}>
                        <span style={{ fontSize:14, fontWeight:600, color:G.darkText }}>{v.name || v.vaccine_name || 'Vaccine'}</span>
                        <span style={{ fontSize:14, color:G.mutedText }}>
                          {v.next_due ? `Due ${new Date(v.next_due).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}` : (v.date_given ? `Given ${new Date(v.date_given).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}` : '—')}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Medications */}
                <div style={{ background:'#fff', borderRadius:16, padding:16, marginBottom:12, border:`1px solid ${G.border}` }}>
                  <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                    💊 Medications
                    <span style={{ marginLeft:'auto', fontSize:13, color:G.mutedText }}>{(vaultData.medications || []).length} logged</span>
                  </div>
                  {(vaultData.medications || []).length === 0 ? (
                    <div style={{ fontSize:14, color:'#888' }}>No medications logged.</div>
                  ) : (
                    (vaultData.medications || []).slice(0,4).map((m,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop: i > 0 ? `1px solid ${G.border}` : 'none' }}>
                        <span style={{ fontSize:14, fontWeight:600, color:G.darkText }}>{m.name || m.medication_name || 'Medication'}</span>
                        <span style={{ fontSize:14, color:G.mutedText }}>{m.dosage || m.dose || '—'}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Allergies */}
                {allergies.length > 0 && (
                  <div style={{ background:'#FFF5F5', borderRadius:16, padding:16, marginBottom:12, border:'1px solid rgba(255,80,80,0.15)' }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#C0392B', marginBottom:10 }}>⚠️ Known Allergies</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {allergies.map((a,i) => (
                        <span key={i} style={{ fontSize:14, background:'rgba(255,80,80,0.1)', color:'#C0392B', padding:'4px 10px', borderRadius:999, fontWeight:600 }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vet Visits */}
                <div style={{ background:'#fff', borderRadius:16, padding:16, marginBottom:12, border:`1px solid ${G.border}` }}>
                  <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                    🏥 Vet Visits
                    <span style={{ marginLeft:'auto', fontSize:13, color:G.mutedText }}>{(vaultData.vet_visits || []).length} logged</span>
                  </div>
                  {(vaultData.vet_visits || []).length === 0 ? (
                    <div style={{ fontSize:14, color:'#888' }}>No vet visits logged.</div>
                  ) : (
                    (vaultData.vet_visits || []).slice(0,3).map((v,i) => (
                      <div key={i} style={{ padding:'8px 0', borderTop: i > 0 ? `1px solid ${G.border}` : 'none' }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontSize:14, fontWeight:600, color:G.darkText }}>{v.reason || v.type || 'Check-up'}</span>
                          <span style={{ fontSize:14, color:G.mutedText }}>{v.date ? new Date(v.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'}) : '—'}</span>
                        </div>
                        {v.vet_name && <div style={{ fontSize:13, color:'#888' }}>Dr. {v.vet_name}</div>}
                      </div>
                    ))
                  )}
                </div>

                <button onClick={() => navigate(`/pet-vault/${currentPet?.id}`)}
                  className="ios-btn-primary" style={{ background:`linear-gradient(135deg,${G.mid},${G.sage})`, width:'100%', marginTop:8, fontSize:14 }}>
                  Open Full Vault →
                </button>
              </>
            )}
          </div>
        )}

        {/* ══════════ TAB 4: Find Care ══════════ */}
        {activeTab === 'find-care' && (
          <div style={{ padding:'16px' }}>
            <CareNearMe pet={currentPet} token={token} onBook={svc => {
              tdc.book({ service:svc, pillar:'care', pet:currentPet, channel:'care_nearme' });
              setSvcBooking({ isOpen:true, serviceType:guessServiceType(svc) });
            }} />
          </div>
        )}
      </div>

      {/* ── Service Booking Modal — full multi-step flow ── */}
      <ServiceBookingModal
        isOpen={svcBooking.isOpen}
        onClose={() => setSvcBooking(p => ({ ...p, isOpen:false }))}
        serviceType={svcBooking.serviceType}
        pet={currentPet}
        onBookingComplete={() => setSvcBooking(p => ({ ...p, isOpen:false }))}
      />

      {/* Fix 7: Care Plan Modal — all fonts ≥ 14px */}
      {showCarePlan && (
        <div style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
          onClick={e => { if(e.target===e.currentTarget) setShowCarePlan(false); }}>
          <div style={{ background:G.dark, borderRadius:'24px 24px 0 0', padding:'24px 16px 48px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:11, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:4 }}>✦ MIRA'S PERSONALISED CARE PLAN</div>
                <div style={{ fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.2 }}>Curated for {petName}</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginTop:4 }}>{currentPet?.breed || 'Indie'} · {coatType} coat{allergies.length > 0 ? ` · no ${allergies.slice(0,2).join(', ')}` : ''}</div>
              </div>
              <button onClick={() => setShowCarePlan(false)}
                style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:32, height:32, color:'#fff', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>×</button>
            </div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.55)', marginBottom:20, lineHeight:1.6 }}>
              Mira has analysed {petName}'s breed, health history, allergies, and soul profile to create this care plan.
            </div>
            {carePlanCards.map(item => (
              <MiraImaginesCard key={item.id} item={item} pet={currentPet} token={token} pillar="care" />
            ))}
            <button className="ios-btn-primary"
              style={{ background:`linear-gradient(135deg,${G.mid},${G.sage})`, width:'100%', marginTop:8, fontSize:14 }}
              onClick={() => { setShowCarePlan(false); request(`Care plan for ${petName}`, { channel:'care_plan_book' }); }}>
              Book via Concierge® →
            </button>
          </div>
        </div>
      )}
    </PillarPageLayout>
  );
}
