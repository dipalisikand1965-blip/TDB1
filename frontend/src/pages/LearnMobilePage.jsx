/**
 * LearnMobilePage.jsx — /learn (mobile)
 * Colour: Blue #1A3A6B → #2E6BC4
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import { tdc } from '../utils/tdc_intent';
import PillarPageLayout from '../components/PillarPageLayout';
import SoulMadeModal from '../components/SoulMadeModal';
import PillarSoulProfile from '../components/PillarSoulProfile';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import { ProductDetailModal } from '../components/ProductCard';
import GuidedLearnPaths from '../components/learn/GuidedLearnPaths';
import LearnNearMe from '../components/learn/LearnNearMe';

const L={blue:'#1A3A6B',blueL:'#2E6BC4',blueXL:'#5B9BD5',cream:'#F0F4FF',border:'#C5D5F0',dark:'#0A1A35',taupe:'#4A5A7A'};
const CSS=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');.learn{font-family:'DM Sans',-apple-system,sans-serif;background:${L.cream};color:${L.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}.learn-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${L.blue},${L.blueL});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}.learn-cta:active{transform:scale(0.97)}.no-sb{overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}.no-sb::-webkit-scrollbar{display:none}`;
function vibe(t='light'){if(navigator?.vibrate)navigator.vibrate(t==='success'?[8,40,10]:t==='medium'?[12]:[6]);}

export default function LearnMobilePage() {
  const{token}=useAuth();const navigate=useNavigate();
  const{currentPet,setCurrentPet,pets:contextPets}=usePillarContext();
  usePlatformTracking({pillar:'learn',pet:currentPet});
  const{request}=useConcierge({pet:currentPet,pillar:'learn'});
  const[loading,setLoading]=useState(true);
  const[soulMadeOpen,setSoulMadeOpen]=useState(false);
  const[selectedProduct,setSelectedProduct]=useState(null);

  useEffect(()=>{if(contextPets!==undefined)setLoading(false);if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]);},[contextPets,currentPet,setCurrentPet]);

  if(loading)return<PillarPageLayout pillar="learn" hideHero hideNavigation><div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:36,marginBottom:12}}>🎓</div><div>Loading learning paths…</div></div></div></PillarPageLayout>;
  if(!currentPet)return<PillarPageLayout pillar="learn" hideHero hideNavigation><style>{CSS}</style><div className="learn"><div style={{padding:'24px 16px',textAlign:'center'}}><div style={{background:'#fff',border:`1px solid ${L.border}`,borderRadius:22,padding:'32px 20px'}}><div style={{fontSize:44,marginBottom:14}}>🎓</div><div style={{fontSize:22,fontWeight:700,marginBottom:8}}>Add your pet to unlock Learn</div><button className="learn-cta" style={{marginTop:16}} onClick={()=>navigate('/join')}>Add your pet →</button></div></div></div></PillarPageLayout>;

  const petName=currentPet.name;
  return(
    <PillarPageLayout pillar="learn" hideHero hideNavigation>
      <div className="learn" data-testid="learn-mobile">
        <style>{CSS}</style>
        {soulMadeOpen&&<SoulMadeModal pet={currentPet} pillar="learn" pillarColor={L.blueL} pillarLabel="Learn" onClose={()=>setSoulMadeOpen(false)}/>}
        {selectedProduct&&<ProductDetailModal product={selectedProduct?.raw||selectedProduct} isOpen={!!selectedProduct} onClose={()=>setSelectedProduct(null)} petName={petName} pillarColor={L.blueL}/>}

        <div style={{background:`linear-gradient(160deg,${L.dark} 0%,${L.blue} 50%,${L.blueL} 100%)`,padding:'20px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div><div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',marginBottom:2}}>THE DOGGY COMPANY</div><div style={{fontSize:22,fontWeight:700,color:'#fff'}}>🎓 Learn</div></div>
            {contextPets?.length>1&&(<select value={currentPet?.id} onChange={e=>{vibe();setCurrentPet(contextPets.find(p=>p.id===e.target.value));}} style={{background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:999,padding:'7px 14px',color:'#fff',fontSize:13}}>{contextPets.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>)}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:52,height:52,borderRadius:'50%',flexShrink:0,background:'rgba(255,255,255,0.15)',border:'2px solid rgba(255,255,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>{currentPet?.photo_url?<img src={currentPet.photo_url} alt={petName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:22}}>🐾</span>}</div>
            <div><div style={{fontSize:20,fontWeight:700,color:'#fff'}}>Training & Education</div><div style={{fontSize:15,color:'rgba(255,255,255,0.7)'}}>for {petName}</div></div>
          </div>
        </div>

        <div style={{padding:'0 16px 8px'}}><PillarSoulProfile pet={currentPet} pillar="learn" token={token}/></div>
        <div style={{padding:'0 16px 16px'}}><div style={{fontSize:26,fontWeight:700,marginBottom:6}}>What would {petName} love to learn?</div><div style={{fontSize:15,color:L.taupe}}>Training paths, tricks, and skills — matched to their personality.</div></div>
        <div style={{margin:'0 16px 20px',background:L.dark,borderRadius:20,padding:16}}>
          <div style={{fontSize:11,fontWeight:700,color:`rgba(91,155,213,0.9)`,letterSpacing:'0.1em',marginBottom:8}}>✦ MIRA ON {petName.toUpperCase()}'S LEARNING</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.75)',lineHeight:1.6,marginBottom:14,fontStyle:'italic'}}>"I know {petName}'s personality and training history. Every path here is chosen for how they learn best."</div>
          <button className="learn-cta">See Mira's Learning Picks →</button>
        </div>
        <div style={{padding:'0 16px 24px'}}><MiraImaginesBreed pet={currentPet} pillar="learn" token={token}/></div>
        <div style={{padding:'0 16px 24px'}}><GuidedLearnPaths pet={currentPet}/></div>
        <div style={{padding:'0 16px 24px'}}><LearnNearMe pet={currentPet} onBook={venue=>{tdc.request(`Book training for ${petName}: ${venue}`,{pillar:'learn',channel:'learn_nearme',pet:currentPet});}}/></div>
        <div style={{margin:'0 16px 24px',background:L.dark,borderRadius:20,padding:18,cursor:'pointer'}} onClick={()=>setSoulMadeOpen(true)}>
          <div style={{fontSize:10,letterSpacing:'0.14em',color:L.blueXL,fontWeight:700,marginBottom:8}}>✦ SOUL MADE™ · MADE ONLY FOR {petName.toUpperCase()}</div>
          <div style={{fontSize:20,fontWeight:700,color:'#fff',marginBottom:8}}>{petName}'s breed on training gear & accessories.</div>
          <button className="learn-cta">Make something only {petName} has →</button>
        </div>
        <div style={{margin:'0 16px 24px',background:L.dark,borderRadius:24,padding:20}}>
          <div style={{display:'inline-flex',background:'rgba(91,155,213,0.2)',border:'1px solid rgba(91,155,213,0.4)',borderRadius:999,padding:'5px 14px',color:L.blueXL,fontSize:12,fontWeight:600,marginBottom:12}}>🎓 Training Concierge®</div>
          <div style={{fontSize:22,fontWeight:700,color:'#fff',lineHeight:1.2,marginBottom:10,fontFamily:'Georgia,serif'}}>Want us to find the perfect trainer for {petName}?</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:16}}>We match {petName} with the right trainer based on breed, personality and goals.</div>
          <button onClick={()=>{vibe('medium');request(`Training concierge for ${petName}`,{channel:'learn_cta'});}} style={{width:'100%',minHeight:48,borderRadius:14,border:'none',background:`linear-gradient(135deg,${L.blueL},${L.blueXL})`,color:L.dark,fontSize:15,fontWeight:700,cursor:'pointer'}}>🎓 Find a Trainer →</button>
        </div>
      </div>
    </PillarPageLayout>
  );
}
