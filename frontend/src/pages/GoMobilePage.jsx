import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
import SharedProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import GoCategoryStrip from '../components/go/GoCategoryStrip';
import GuidedGoPaths from '../components/go/GuidedGoPaths';
import GoConciergeSection from '../components/go/GoConciergeSection';
import PetFriendlyStays from '../components/go/PetFriendlyStays';

const G = {
  teal: '#0D4F6B', tealL: '#1D7FA6', tealXL: '#48B4D8',
  cream: '#F0F8FF', border: '#B3E0F2', dark: '#052033', taupe: '#4A7A8A',
};

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='success'?[8,40,10]:t==='medium'?[12]:[6]); }
function getAllergies(pet) {
  const s=new Set();
  [pet?.preferences?.allergies,pet?.doggy_soul_answers?.food_allergies,pet?.allergies].forEach(v=>{
    if(Array.isArray(v))v.forEach(x=>{if(x&&!/^(none|no|unknown)$/i.test(String(x).trim()))s.add(String(x).trim());});
    else if(v&&!/^(none|no|unknown)$/i.test(String(v).trim()))s.add(String(v).trim());
  });
  return [...s];
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  .go { font-family:'DM Sans',-apple-system,sans-serif; background:${G.cream}; color:${G.dark}; min-height:100vh; padding-bottom:calc(96px + env(safe-area-inset-bottom)); }
  .go-card { background:#fff; border:1px solid ${G.border}; border-radius:22px; }
  .go-cta { display:flex; align-items:center; justify-content:center; width:100%; min-height:48px; padding:13px 20px; border-radius:14px; border:none; background:linear-gradient(135deg,${G.teal},${G.tealL}); color:#fff; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; transition:transform 0.15s; }
  .go-cta:active { transform:scale(0.97); }
  .no-sb { overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none; }
  .no-sb::-webkit-scrollbar { display:none; }
  @keyframes go-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
`;

function GoPetCard({ pet }) {
  const name=pet?.name||'your dog', breed=pet?.breed||'mixed', score=Math.round(pet?.overall_score||0);
  return (
    <div className="go-card" style={{ padding:16, margin:'0 16px 20px', boxShadow:'0 4px 20px rgba(13,79,107,0.08)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${G.tealXL},${G.tealL})`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            {pet?.photo_url?<img src={pet.photo_url} alt={name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<span style={{ fontSize:22 }}>🐾</span>}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>{name}'s Adventures</div>
            <div style={{ background:'#E1F5FE', borderRadius:999, padding:'3px 10px', display:'inline-block', marginBottom:4 }}>
              <span style={{ fontSize:13, color:G.teal, fontWeight:500 }}>{breed}</span>
            </div>
            <div style={{ fontSize:13, color:G.taupe }}>Outings, stays & travel</div>
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:24, fontWeight:700, color:G.tealL }}>{score}%</div>
          <div style={{ fontSize:10, color:G.taupe, letterSpacing:'0.08em' }}>SOUL</div>
        </div>
      </div>
    </div>
  );
}

export default function GoMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'go', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'go' });
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mode, setMode] = useState('go');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (!currentPet?.id) return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=go&limit=200`, {
      headers: token ? { Authorization:`Bearer ${token}` } : {}
    }).then(r => r.ok ? r.json() : null).then(d => { if (d?.products) setProducts(d.products); }).catch(() => {});
  }, [currentPet?.id, token]);

  const handleAddToCart = useCallback(p => {
    addToCart({ id:p.id||p._id, name:p.name, price:p.price||0, image:p.image_url||p.images?.[0], pillar:'go', quantity:1 });
  }, [addToCart]);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  if (loading) return <PillarPageLayout pillar="go" hideHero hideNavigation><div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>✈️</div><div>Loading adventures…</div></div></div></PillarPageLayout>;
  if (!currentPet) return <PillarPageLayout pillar="go" hideHero hideNavigation><style>{CSS}</style><div className="go"><div style={{ padding:'24px 16px', textAlign:'center' }}><div className="go-card" style={{ padding:'32px 20px' }}><div style={{ fontSize:44, marginBottom:14 }}>✈️</div><div style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Add your pet to unlock Go</div><button className="go-cta" style={{ marginTop:16 }} onClick={() => navigate('/join')}>Add your pet →</button></div></div></div></PillarPageLayout>;

  const petName = currentPet.name;

  return (
    <PillarPageLayout pillar="go" hideHero hideNavigation>
      <div className="go" data-testid="go-mobile">
        <style>{CSS}</style>
        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="go" pillarColor={G.tealL} pillarLabel="Go" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct?.raw||selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.tealL} />}

        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.teal} 50%,${G.tealL} 100%)`, padding:'20px 16px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>✈️ Go</div>
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
              <div style={{ fontSize:20, fontWeight:700, color:'#fff' }}>Outings & Adventures</div>
              <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>for {petName}</div>
            </div>
          </div>
        </div>

        <GoPetCard pet={currentPet} />
        <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="go" token={token} /></div>
        <GoCategoryStrip pet={currentPet} />

        <div style={{ margin:'0 16px 24px', background:G.dark, borderRadius:20, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(72,180,216,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {petName.toUpperCase()}'S ADVENTURES</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>"I know {petName}'s energy level and what makes them thrive. Every outing here is matched to who they are."</div>
          <button className="go-cta">See Mira's Go Picks →</button>
        </div>

        <div style={{ padding:'0 16px 24px' }}><MiraImaginesBreed pet={currentPet} pillar="go" token={token} /></div>

        {products.length > 0 && (
          <div style={{ padding:'0 16px 24px' }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:12 }}>Go Products for {petName}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {products.slice(0, 20).map(p => (
                <SharedProductCard key={p.id||p._id||p.name} product={p} pillar="go" selectedPet={currentPet} onAddToCart={() => handleAddToCart(p)} onClick={() => { vibe(); setSelectedProduct(p); }} />
              ))}
            </div>
          </div>
        )}

        <div style={{ padding:'0 16px 24px' }}><PersonalisedBreedSection pet={currentPet} pillar="go" /></div>
        <div style={{ padding:'0 16px 24px' }}><GuidedGoPaths pet={currentPet} /></div>
        <div style={{ padding:'0 16px 24px' }}>
          <PetFriendlyStays pet={currentPet} onBook={stay => { tdc.request(`Book stay for ${petName}: ${stay}`, { pillar:'go', channel:'go_stays', pet:currentPet }); }} />
        </div>
        <div style={{ padding:'0 16px 24px' }}><GoConciergeSection pet={currentPet} /></div>
        <div style={{ margin:'0 16px 24px', background:G.dark, borderRadius:20, padding:18, cursor:'pointer' }} onClick={() => setSoulMadeOpen(true)}>
          <div style={{ fontSize:10, letterSpacing:'0.14em', color:G.tealXL, fontWeight:700, marginBottom:8 }}>✦ SOUL MADE™ · MADE ONLY FOR {petName.toUpperCase()}</div>
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:8 }}>{petName}'s breed on travel tags, adventure gear & more.</div>
          <button className="go-cta">Make something only {petName} has →</button>
        </div>
        <div style={{ margin:'0 16px 24px', background:G.dark, borderRadius:24, padding:20 }}>
          <div style={{ display:'inline-flex', background:'rgba(72,180,216,0.2)', border:'1px solid rgba(72,180,216,0.4)', borderRadius:999, padding:'5px 14px', color:G.tealXL, fontSize:12, fontWeight:600, marginBottom:12 }}>✈️ Go Concierge®</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#fff', lineHeight:1.2, marginBottom:10, fontFamily:'Georgia,serif' }}>Want us to plan {petName}'s perfect outing?</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.7, marginBottom:16 }}>Stays, day trips, pet travel documents — all arranged by your Concierge.</div>
          <button onClick={() => { vibe('medium'); request(`Go concierge for ${petName}`, { channel:'go_cta' }); }} style={{ width:'100%', minHeight:48, borderRadius:14, border:'none', background:`linear-gradient(135deg,${G.tealL},${G.tealXL})`, color:G.dark, fontSize:15, fontWeight:700, cursor:'pointer' }}>
            ✈️ Plan with Concierge®
          </button>
        </div>
      </div>
    </PillarPageLayout>
  );
}
