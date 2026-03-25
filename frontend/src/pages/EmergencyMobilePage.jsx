/**
 * EmergencyMobilePage.jsx — /emergency (mobile)
 * Colour: Crimson #4A0000 → #C0392B — urgent but calm
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
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';

const E={crimson:'#4A0000',crimsonL:'#C0392B',crimsonXL:'#E74C3C',cream:'#FFF5F5',border:'#FFD5D5',dark:'#1A0000',taupe:'#7A4A4A'};
const CSS_E=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');.emerg{font-family:'DM Sans',-apple-system,sans-serif;background:${E.cream};color:${E.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}.emerg-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${E.crimson},${E.crimsonL});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}.emerg-cta:active{transform:scale(0.97)}.emerg-urgent{display:flex;align-items:center;justify-content:center;width:100%;min-height:56px;padding:15px 20px;border-radius:14px;border:none;background:${E.crimsonL};color:#fff;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit}`;
function vibe(t='light'){if(navigator?.vibrate)navigator.vibrate(t==='medium'?[12]:[6]);}
function getAllergies(pet){const s=new Set();[pet?.preferences?.allergies,pet?.doggy_soul_answers?.food_allergies,pet?.allergies].forEach(v=>{if(Array.isArray(v))v.forEach(x=>{if(x&&!/^(none|no|unknown)$/i.test(String(x).trim()))s.add(String(x).trim());});else if(v&&!/^(none|no|unknown)$/i.test(String(v).trim()))s.add(String(v).trim());});return[...s];}

export default function EmergencyMobilePage() {
  const{token}=useAuth();const navigate=useNavigate();
  const{currentPet,setCurrentPet,pets:contextPets}=usePillarContext();
  usePlatformTracking({pillar:'emergency',pet:currentPet});
  const{request}=useConcierge({pet:currentPet,pillar:'emergency'});
  const{addToCart}=useCart();
  const[loading,setLoading]=useState(true);
  const[selectedProduct,setSelectedProduct]=useState(null);
  const[products,setProducts]=useState([]);
  useEffect(()=>{if(contextPets!==undefined)setLoading(false);if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]);},[contextPets,currentPet,setCurrentPet]);
  useEffect(()=>{
    if(!currentPet?.id)return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=emergency&limit=200`,{headers:token?{Authorization:`Bearer ${token}`}:{}})
      .then(r=>r.ok?r.json():null).then(d=>{if(d?.products)setProducts(d.products);}).catch(()=>{});
  },[currentPet?.id,token]);
  const handleAddToCart=useCallback(p=>{addToCart({id:p.id||p._id,name:p.name,price:p.price||0,image:p.image_url||p.images?.[0],pillar:'emergency',quantity:1});},[addToCart]);
  if(loading)return<PillarPageLayout pillar="emergency" hideHero hideNavigation><div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:36,marginBottom:12}}>🚨</div><div>Loading emergency info…</div></div></div></PillarPageLayout>;
  const petName=currentPet?.name||'your dog';
  const allergies=currentPet?getAllergies(currentPet):[];
  return(
    <PillarPageLayout pillar="emergency" hideHero hideNavigation>
      <div className="emerg" data-testid="emergency-mobile"><style>{CSS_E}</style>
        {selectedProduct&&<ProductDetailModal product={selectedProduct?.raw||selectedProduct} isOpen={!!selectedProduct} onClose={()=>setSelectedProduct(null)} petName={petName} pillarColor={E.crimsonL}/>}
        <div style={{background:`linear-gradient(160deg,${E.dark} 0%,${E.crimson} 50%,${E.crimsonL} 100%)`,padding:'32px 16px 24px'}}>
          <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',marginBottom:2}}>THE DOGGY COMPANY</div>
          <div style={{fontSize:22,fontWeight:700,color:'#fff',marginBottom:12}}>🚨 Emergency</div>
          {currentPet&&<div>
            <div style={{fontSize:20,fontWeight:700,color:'#fff',marginBottom:4}}>Emergency Help for {petName}</div>
            {allergies.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
              {allergies.map(a=><div key={a} style={{background:'rgba(255,107,100,0.2)',border:'1px solid rgba(255,107,100,0.4)',borderRadius:999,padding:'4px 10px',fontSize:11,color:'#FFB3B0',fontWeight:700}}>⚠️ ALLERGIC TO {a.toUpperCase()}</div>)}
            </div>}
          </div>}
        </div>

        {/* URGENT CTA - always first */}
        <div style={{padding:'16px 16px 8px'}}>
          <button className="emerg-urgent" onClick={()=>{vibe('medium');request(`EMERGENCY for ${petName}`,{channel:'emergency_urgent',urgency:'critical'});}}>
            🚨 URGENT — Contact Emergency Vet Now
          </button>
        </div>

        {currentPet&&<div style={{padding:'0 16px 8px'}}><PillarSoulProfile pet={currentPet} pillar="emergency" token={token}/></div>}

        {/* Mira triage bar */}
        <div style={{margin:'8px 16px 16px',background:E.dark,borderRadius:20,padding:16}}>
          <div style={{fontSize:11,fontWeight:700,color:'rgba(231,76,60,0.9)',letterSpacing:'0.1em',marginBottom:8}}>✦ MIRA EMERGENCY GUIDE</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.85)',lineHeight:1.6,marginBottom:14}}>
            {allergies.length>0?`⚠️ CRITICAL: ${petName} is allergic to ${allergies.join(', ')}. Tell the vet immediately.`:`I know ${petName}'s health profile. Tell me what's happening and I'll guide you through.`}
          </div>
          <button className="emerg-cta">Ask Mira for Emergency Guidance →</button>
        </div>

        {currentPet&&<div style={{padding:'0 16px 24px'}}><GuidedEmergencyPaths pet={currentPet}/></div>}

        {products.length>0&&(<div style={{padding:'0 16px 24px'}}><div style={{fontSize:18,fontWeight:700,marginBottom:12}}>Emergency Kit for {petName}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{products.slice(0,20).map(p=><SharedProductCard key={p.id||p._id||p.name} product={p} pillar="emergency" selectedPet={currentPet} onAddToCart={()=>handleAddToCart(p)} onClick={()=>{vibe();setSelectedProduct(p);}} />)}</div></div>)}

        <div style={{padding:'0 16px 24px'}}><EmergencyNearMe pet={currentPet} onBook={vet=>{tdc.request(`Emergency vet: ${vet}`,{pillar:'emergency',channel:'emergency_nearme',pet:currentPet,urgency:'critical'});}}/></div>
        {currentPet&&<div style={{padding:'0 16px 24px'}}><MiraImaginesBreed pet={currentPet} pillar="emergency" token={token}/></div>}

        <div style={{margin:'0 16px 24px',background:E.dark,borderRadius:24,padding:20}}>
          <div style={{display:'inline-flex',background:'rgba(231,76,60,0.2)',border:'1px solid rgba(231,76,60,0.4)',borderRadius:999,padding:'5px 14px',color:E.crimsonXL,fontSize:12,fontWeight:600,marginBottom:12}}>🚨 Emergency Concierge®</div>
          <div style={{fontSize:22,fontWeight:700,color:'#fff',lineHeight:1.2,marginBottom:10,fontFamily:'Georgia,serif'}}>We coordinate emergency care for {petName}.</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:16}}>Emergency vet referrals, ambulance coordination, medication guidance — we handle it.</div>
          <button onClick={()=>{vibe('medium');request(`Emergency concierge for ${petName}`,{channel:'emergency_cta',urgency:'urgent'});}} style={{width:'100%',minHeight:48,borderRadius:14,border:'none',background:`linear-gradient(135deg,${E.crimsonL},${E.crimsonXL})`,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>🚨 Emergency Concierge® Now →</button>
        </div>
      </div>
    </PillarPageLayout>
  );
}

