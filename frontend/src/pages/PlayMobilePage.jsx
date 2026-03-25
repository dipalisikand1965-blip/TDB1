/**
 * PlayMobilePage.jsx — /play (mobile)
 * Colour: Red/Fun #D94F00 → #FF6B35
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
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import PlayCategoryStrip from '../components/play/PlayCategoryStrip';
import GuidedPlayPaths from '../components/play/GuidedPlayPaths';
import PlayConciergeSection from '../components/play/PlayConciergeSection';
import PlayNearMe from '../components/play/PlayNearMe';
import BuddyMeetup from '../components/play/BuddyMeetup';

const P = { red:'#7B2D00', redL:'#D94F00', redXL:'#FF6B35', cream:'#FFF8F5', border:'#FFD4C2', dark:'#2D0A00', taupe:'#7A4A35' };
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');.play{font-family:'DM Sans',-apple-system,sans-serif;background:${P.cream};color:${P.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}.play-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${P.red},${P.redL});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}.play-cta:active{transform:scale(0.97)}.no-sb{overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}.no-sb::-webkit-scrollbar{display:none}`;

function vibe(t='light'){if(navigator?.vibrate)navigator.vibrate(t==='success'?[8,40,10]:t==='medium'?[12]:[6]);}
function getAllergies(pet){const s=new Set();[pet?.preferences?.allergies,pet?.doggy_soul_answers?.food_allergies,pet?.allergies].forEach(v=>{if(Array.isArray(v))v.forEach(x=>{if(x&&!/^(none|no|unknown)$/i.test(String(x).trim()))s.add(String(x).trim());});else if(v&&!/^(none|no|unknown)$/i.test(String(v).trim()))s.add(String(v).trim());});return[...s];}

export default function PlayMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'play', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'play' });
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => { if(contextPets!==undefined)setLoading(false); if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]); },[contextPets,currentPet,setCurrentPet]);
  useEffect(() => { const h=()=>{}; window.addEventListener('soulScoreUpdated',h); return()=>window.removeEventListener('soulScoreUpdated',h); },[]);

  useEffect(() => {
    if (!currentPet?.id) return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=play&limit=200`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null).then(d => { if (d?.products) setProducts(d.products); }).catch(() => {});
  }, [currentPet?.id, token]);

  const handleAddToCart = useCallback(p => {
    addToCart({ id:p.id||p._id, name:p.name, price:p.price||0, image:p.image_url||p.images?.[0], pillar:'play', quantity:1 });
  }, [addToCart]);

  useEffect(() => { if(contextPets!==undefined)setLoading(false); if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]); },[contextPets,currentPet,setCurrentPet]);
  useEffect(() => { const h=()=>{}; window.addEventListener('soulScoreUpdated',h); return()=>window.removeEventListener('soulScoreUpdated',h); },[]);

  if(loading)return<PillarPageLayout pillar="play" hideHero hideNavigation><div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:36,marginBottom:12}}>🎾</div><div>Loading play picks…</div></div></div></PillarPageLayout>;
  if(!currentPet)return<PillarPageLayout pillar="play" hideHero hideNavigation><style>{CSS}</style><div className="play"><div style={{padding:'24px 16px',textAlign:'center'}}><div style={{background:'#fff',border:`1px solid ${P.border}`,borderRadius:22,padding:'32px 20px'}}><div style={{fontSize:44,marginBottom:14}}>🎾</div><div style={{fontSize:22,fontWeight:700,marginBottom:8}}>Add your pet to unlock Play</div><button className="play-cta" style={{marginTop:16}} onClick={()=>navigate('/join')}>Add your pet →</button></div></div></div></PillarPageLayout>;

  const petName=currentPet.name;

  return(
    <PillarPageLayout pillar="play" hideHero hideNavigation>
      <div className="play" data-testid="play-mobile">
        <style>{CSS}</style>
        {soulMadeOpen&&<SoulMadeModal pet={currentPet} pillar="play" pillarColor={P.redL} pillarLabel="Play" onClose={()=>setSoulMadeOpen(false)}/>}
        {selectedProduct&&<ProductDetailModal product={selectedProduct?.raw||selectedProduct} isOpen={!!selectedProduct} onClose={()=>setSelectedProduct(null)} petName={petName} pillarColor={P.redL}/>}

        <div style={{background:`linear-gradient(160deg,${P.dark} 0%,${P.red} 50%,${P.redL} 100%)`,padding:'20px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div><div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',marginBottom:2}}>THE DOGGY COMPANY</div><div style={{fontSize:22,fontWeight:700,color:'#fff'}}>🎾 Play</div></div>
            {contextPets?.length>1&&(<select value={currentPet?.id} onChange={e=>{vibe();setCurrentPet(contextPets.find(p=>p.id===e.target.value));}} style={{background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:999,padding:'7px 14px',color:'#fff',fontSize:13}}>{contextPets.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>)}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
            <div style={{width:52,height:52,borderRadius:'50%',flexShrink:0,background:'rgba(255,255,255,0.15)',border:'2px solid rgba(255,255,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>{currentPet?.photo_url?<img src={currentPet.photo_url} alt={petName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:22}}>🐾</span>}</div>
            <div><div style={{fontSize:20,fontWeight:700,color:'#fff'}}>Activities & Fitness</div><div style={{fontSize:15,color:'rgba(255,255,255,0.7)'}}>for {petName}</div></div>
          </div>
        </div>

        <div style={{padding:'0 16px 8px'}}><PillarSoulProfile pet={currentPet} pillar="play" token={token}/></div>
        <PlayCategoryStrip pet={currentPet}/>
        <div style={{padding:'0 16px 16px'}}><div style={{fontSize:26,fontWeight:700,marginBottom:6}}>How does {petName} love to play?</div><div style={{fontSize:15,color:P.taupe}}>Activities, fitness and fun — matched to their energy.</div></div>
        <div style={{margin:'0 16px 20px',background:P.dark,borderRadius:20,padding:16}}>
          <div style={{fontSize:11,fontWeight:700,color:`rgba(255,107,53,0.9)`,letterSpacing:'0.1em',marginBottom:8}}>✦ MIRA ON {petName.toUpperCase()}'S FITNESS</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.75)',lineHeight:1.6,marginBottom:14,fontStyle:'italic'}}>"I know {petName}'s energy level and age. Every activity here is matched to keep them fit and happy."</div>
          <button className="play-cta">See Mira's Play Picks →</button>
        </div>
        <div style={{padding:'0 16px 24px'}}><MiraImaginesBreed pet={currentPet} pillar="play" token={token}/></div>

        {products.length > 0 && (
          <div style={{padding:'0 16px 24px'}}>
            <div style={{fontSize:18,fontWeight:700,marginBottom:12}}>Play Products for {petName}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {products.slice(0,20).map(p => <SharedProductCard key={p.id||p._id||p.name} product={p} pillar="play" selectedPet={currentPet} onAddToCart={()=>handleAddToCart(p)} onClick={()=>{vibe();setSelectedProduct(p);}} />)}
            </div>
          </div>
        )}

        <div style={{padding:'0 16px 24px'}}><PersonalisedBreedSection pet={currentPet} pillar="play" /></div>
        <div style={{padding:'0 16px 24px'}}><GuidedPlayPaths pet={currentPet}/></div>
        <div style={{padding:'0 16px 24px'}}><BuddyMeetup pet={currentPet}/></div>
        <div style={{padding:'0 16px 24px'}}><PlayNearMe pet={currentPet} onBook={venue=>{tdc.request(`Book play venue for ${petName}: ${venue}`,{pillar:'play',channel:'play_nearme',pet:currentPet});}}/></div>
        <div style={{padding:'0 16px 24px'}}><PlayConciergeSection pet={currentPet}/></div>
        <div style={{margin:'0 16px 24px',background:P.dark,borderRadius:20,padding:18,cursor:'pointer'}} onClick={()=>setSoulMadeOpen(true)}>
          <div style={{fontSize:10,letterSpacing:'0.14em',color:P.redXL,fontWeight:700,marginBottom:8}}>✦ SOUL MADE™ · MADE ONLY FOR {petName.toUpperCase()}</div>
          <div style={{fontSize:20,fontWeight:700,color:'#fff',marginBottom:8}}>{petName}'s breed on play gear, bandanas & more.</div>
          <button className="play-cta">Make something only {petName} has →</button>
        </div>
        <div style={{margin:'0 16px 24px',background:P.dark,borderRadius:24,padding:20}}>
          <div style={{display:'inline-flex',background:'rgba(255,107,53,0.2)',border:'1px solid rgba(255,107,53,0.4)',borderRadius:999,padding:'5px 14px',color:P.redXL,fontSize:12,fontWeight:600,marginBottom:12}}>🎾 Play Concierge®</div>
          <div style={{fontSize:22,fontWeight:700,color:'#fff',lineHeight:1.2,marginBottom:10,fontFamily:'Georgia,serif'}}>Want us to plan {petName}'s perfect activity day?</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:16}}>Training sessions, swim days, agility classes — all booked by your Concierge.</div>
          <button onClick={()=>{vibe('medium');request(`Play concierge for ${petName}`,{channel:'play_cta'});}} style={{width:'100%',minHeight:48,borderRadius:14,border:'none',background:`linear-gradient(135deg,${P.redL},${P.redXL})`,color:P.dark,fontSize:15,fontWeight:700,cursor:'pointer'}}>🎾 Plan with Concierge®</button>
        </div>
      </div>
    </PillarPageLayout>
  );
}
