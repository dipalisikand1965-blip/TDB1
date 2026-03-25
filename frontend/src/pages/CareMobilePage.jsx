/**
 * CareMobilePage.jsx — /care (mobile)
 * Colour: Sage green #2D6A4F → #40916C
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
import SoulMadeModal from '../components/SoulMadeModal';
import PillarSoulProfile from '../components/PillarSoulProfile';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import { ProductDetailModal } from '../components/ProductCard';
import CareCategoryStrip from '../components/care/CareCategoryStrip';
import GuidedCarePaths from '../components/care/GuidedCarePaths';
import CareConciergeSection from '../components/care/CareConciergeSection';
import CareNearMe from '../components/care/CareNearMe';

const G = {
  green:  '#2D6A4F',
  greenL: '#40916C',
  greenXL:'#74C69D',
  cream:  '#F0FFF4',
  border: '#C8E6C9',
  dark:   '#0D2B1A',
  taupe:  '#5C7A6A',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  .care { font-family:'DM Sans',-apple-system,sans-serif; background:${G.cream}; color:${G.dark}; min-height:100vh; padding-bottom:calc(96px + env(safe-area-inset-bottom)); }
  .care-card { background:#fff; border:1px solid ${G.border}; border-radius:22px; }
  .care-cta { display:flex; align-items:center; justify-content:center; width:100%; min-height:48px; padding:13px 20px; border-radius:14px; border:none; background:linear-gradient(135deg,${G.green},${G.greenL}); color:#fff; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; transition:transform 0.15s; }
  .care-cta:active { transform:scale(0.97); }
  .no-sb { overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none; }
  .no-sb::-webkit-scrollbar { display:none; }
  @keyframes care-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='success'?[8,40,10]:t==='medium'?[12]:[6]); }
function getAllergies(pet) {
  const s=new Set();
  const add=v=>{if(Array.isArray(v))v.forEach(x=>{if(x&&!/^(none|no|unknown)$/i.test(String(x).trim()))s.add(String(x).trim());});else if(v&&!/^(none|no|unknown)$/i.test(String(v).trim()))s.add(String(v).trim());};
  add(pet?.preferences?.allergies);add(pet?.doggy_soul_answers?.food_allergies);add(pet?.allergies);
  return [...s];
}

function CarePetCard({ pet, onOpen }) {
  const name = pet?.name||'your dog', breed=pet?.breed||'mixed', score=Math.round(pet?.overall_score||pet?.soul_score||0);
  const allergies = getAllergies(pet);
  return (
    <div onClick={() => { vibe(); onOpen(); }} className="care-card"
      style={{ padding:16, margin:'0 16px 20px', cursor:'pointer', boxShadow:'0 4px 20px rgba(45,106,79,0.08)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${G.greenXL},${G.greenL})`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            {pet?.photo_url?<img src={pet.photo_url} alt={name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<span style={{ fontSize:22 }}>🐾</span>}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>{name}&apos;s Care Profile</div>
            <div style={{ background:'#E8F5E9', borderRadius:999, padding:'3px 10px', display:'inline-block', marginBottom:4 }}>
              <span style={{ fontSize:13, color:G.green, fontWeight:500 }}>{breed}</span>
            </div>
            <div style={{ fontSize:13, color:G.taupe }}>{allergies.length?`No ${allergies.join(', ')}`:'Health, grooming & wellness'}</div>
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:24, fontWeight:700, color:G.greenL }}>{score}%</div>
          <div style={{ fontSize:10, color:G.taupe, letterSpacing:'0.08em' }}>SOUL</div>
          <div style={{ fontSize:11, color:G.green, marginTop:2 }}>Tap →</div>
        </div>
      </div>
    </div>
  );
}

function CareMiraBar({ pet, onOpen }) {
  const name=pet?.name||'your dog', allergies=getAllergies(pet);
  const text=allergies.length>0?`I know ${name}&apos;s health profile. Everything here is safe for them.`:`I&apos;ve curated ${name}&apos;s care picks based on their breed, age, and health history.`;
  return (
    <div style={{ margin:'0 16px 20px', background:G.dark, borderRadius:20, padding:16 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'rgba(116,198,157,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {name.toUpperCase()}&apos;S HEALTH</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>&quot;{text}&quot;</div>
      <button className="care-cta" onClick={() => { vibe('medium'); onOpen(); }}>See Mira&apos;s Care Picks →</button>
    </div>
  );
}

function CareConciergeCard({ pet, onOpen }) {
  const name=pet?.name||'your dog';
  return (
    <div style={{ margin:'0 16px 24px', background:G.dark, borderRadius:24, padding:20 }}>
      <div style={{ display:'inline-flex', background:'rgba(116,198,157,0.2)', border:'1px solid rgba(116,198,157,0.4)', borderRadius:999, padding:'5px 14px', color:G.greenXL, fontSize:12, fontWeight:600, marginBottom:12 }}>🌿 Care Concierge®</div>
      <div style={{ fontSize:22, fontWeight:700, color:'#fff', lineHeight:1.2, marginBottom:10, fontFamily:'Georgia,serif' }}>Want us to handle {name}&apos;s entire care schedule?</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.7, marginBottom:16 }}>Vet bookings, grooming appointments, medication reminders — all coordinated for you.</div>
      <button onClick={() => { vibe('medium'); onOpen?.(); }} style={{ width:'100%', minHeight:48, borderRadius:14, border:'none', background:`linear-gradient(135deg,${G.greenL},${G.greenXL})`, color:G.dark, fontSize:15, fontWeight:700, cursor:'pointer' }}>
        🌿 Talk to Care Concierge®
      </button>
    </div>
  );
}

export default function CareMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'care', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'care' });
  const [loading, setLoading] = useState(true);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    const h = () => {};
    window.addEventListener('soulScoreUpdated', h);
    return () => window.removeEventListener('soulScoreUpdated', h);
  }, []);

  if (loading) return <PillarPageLayout pillar="care" hideHero hideNavigation><div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>🌿</div><div>Loading care picks…</div></div></div></PillarPageLayout>;

  if (!currentPet) return <PillarPageLayout pillar="care" hideHero hideNavigation><style>{CSS}</style><div className="care"><div style={{ padding:'24px 16px', textAlign:'center' }}><div className="care-card" style={{ padding:'32px 20px' }}><div style={{ fontSize:44, marginBottom:14 }}>🌿</div><div style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Add your pet to unlock Care</div><button className="care-cta" style={{ marginTop:16 }} onClick={() => navigate('/join')}>Add your pet →</button></div></div></div></PillarPageLayout>;

  const petName = currentPet.name;

  return (
    <PillarPageLayout pillar="care" hideHero hideNavigation>
      <div className="care" data-testid="care-mobile">
        <style>{CSS}</style>
        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="care" pillarColor={G.greenL} pillarLabel="Care" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct?.raw||selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.greenL} />}

        {/* HERO */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.green} 50%,${G.greenL} 100%)`, padding:'20px 16px 24px', position:'relative', overflow:'hidden' }}>
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
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', flexShrink:0, background:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
              {currentPet?.photo_url?<img src={currentPet.photo_url} alt={petName} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<span style={{ fontSize:22 }}>🐾</span>}
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:700, color:'#fff', lineHeight:1.1 }}>Health & Wellness</div>
              <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)', marginTop:2 }}>for {petName}</div>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {getAllergies(currentPet).map(a => <div key={a} style={{ background:'rgba(255,107,100,0.15)', border:'1px solid rgba(255,107,100,0.3)', borderRadius:999, padding:'4px 10px', fontSize:11, color:'#FFB3B0' }}>⚠️ No {a}</div>)}
          </div>
        </div>

        <CarePetCard pet={currentPet} onOpen={() => {}} />
        <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="care" token={token} /></div>
        <CareCategoryStrip pet={currentPet} />

        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ fontSize:26, fontWeight:700, marginBottom:6 }}>How can we care for {petName}?</div>
          <div style={{ fontSize:15, color:G.taupe }}>Vets, grooming, health and wellness — all coordinated.</div>
        </div>

        <CareMiraBar pet={currentPet} onOpen={() => {}} />
        <div style={{ padding:'0 16px 24px' }}><MiraImaginesBreed pet={currentPet} pillar="care" token={token} /></div>
        <div style={{ padding:'0 16px 24px' }}><GuidedCarePaths pet={currentPet} /></div>
        <div style={{ padding:'0 16px 24px' }}>
          <CareNearMe pet={currentPet} onBook={venue => { tdc.request(`Book care venue for ${petName}: ${venue}`, { pillar:'care', channel:'care_nearme', pet:currentPet }); }} />
        </div>
        <div style={{ padding:'0 16px 24px' }}><CareConciergeSection pet={currentPet} /></div>
        <div style={{ margin:'0 16px 24px', background:G.dark, borderRadius:20, padding:18, cursor:'pointer' }} onClick={() => setSoulMadeOpen(true)}>
          <div style={{ fontSize:10, letterSpacing:'0.14em', color:G.greenXL, fontWeight:700, marginBottom:8 }}>✦ SOUL MADE™ · MADE ONLY FOR {petName.toUpperCase()}</div>
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:8 }}>{petName}&apos;s breed on care accessories, ID tags & more.</div>
          <button className="care-cta">Make something only {petName} has →</button>
        </div>
        <CareConciergeCard pet={currentPet} onOpen={() => setIntakeOpen(true)} />
      </div>
    </PillarPageLayout>
  );
}
