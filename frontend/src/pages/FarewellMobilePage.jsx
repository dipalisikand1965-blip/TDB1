/**
 * FarewellMobilePage.jsx — /farewell (mobile)
 * Colour: Soft indigo #1A1040 → #4A3B8C — gentle and compassionate
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import { tdc } from '../utils/tdc_intent';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import SoulMadeModal from '../components/SoulMadeModal';
import GuidedFarewellPaths from '../components/farewell/GuidedFarewellPaths';
import FarewellNearMe from '../components/farewell/FarewellNearMe';

const F={indigo:'#1A1040',indigoL:'#4A3B8C',indigoXL:'#7B6FBE',cream:'#F8F5FF',border:'#DDD5F5',dark:'#0A0820',taupe:'#6A6090'};
const CSS_F=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');.farewell{font-family:'DM Sans',-apple-system,sans-serif;background:${F.cream};color:${F.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}.farewell-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${F.indigo},${F.indigoL});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}.farewell-cta:active{transform:scale(0.97)}`;
function vibe(t='light'){if(navigator?.vibrate)navigator.vibrate(t==='medium'?[12]:[6]);}

export default function FarewellMobilePage() {
  const{token}=useAuth();const navigate=useNavigate();
  const{currentPet,setCurrentPet,pets:contextPets}=usePillarContext();
  usePlatformTracking({pillar:'farewell',pet:currentPet});
  const{request}=useConcierge({pet:currentPet,pillar:'farewell'});
  const[loading,setLoading]=useState(true);
  const[soulMadeOpen,setSoulMadeOpen]=useState(false);
  useEffect(()=>{if(contextPets!==undefined)setLoading(false);if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]);},[contextPets,currentPet,setCurrentPet]);
  if(loading)return<PillarPageLayout pillar="farewell" hideHero hideNavigation><div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:36,marginBottom:12}}>🌷</div><div>Loading…</div></div></div></PillarPageLayout>;
  const petName=currentPet?.name||'your dog';
  return(
    <PillarPageLayout pillar="farewell" hideHero hideNavigation>
      <div className="farewell" data-testid="farewell-mobile"><style>{CSS_F}</style>
        {soulMadeOpen&&<SoulMadeModal pet={currentPet} pillar="farewell" pillarColor={F.indigoL} pillarLabel="Farewell" onClose={()=>setSoulMadeOpen(false)}/>}
        <div style={{background:`linear-gradient(160deg,${F.dark} 0%,${F.indigo} 50%,${F.indigoL} 100%)`,padding:'20px 16px 24px'}}>
          <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',marginBottom:2}}>THE DOGGY COMPANY</div>
          <div style={{fontSize:22,fontWeight:700,color:'#fff',marginBottom:12}}>🌷 Farewell</div>
          <div style={{fontSize:20,fontWeight:700,color:'#fff',marginBottom:4}}>End-of-Life & Grief Support</div>
          <div style={{fontSize:15,color:'rgba(255,255,255,0.7)'}}>Compassionate support for every step</div>
        </div>
        {currentPet&&<div style={{padding:'0 16px 8px'}}><PillarSoulProfile pet={currentPet} pillar="farewell" token={token}/></div>}
        <div style={{padding:'16px 16px 20px'}}>
          <div style={{background:F.dark,borderRadius:20,padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:'rgba(123,111,190,0.9)',letterSpacing:'0.1em',marginBottom:8}}>✦ MIRA IS HERE WITH YOU</div>
            <div style={{fontSize:16,color:'rgba(255,255,255,0.85)',lineHeight:1.7,fontStyle:'italic',marginBottom:16}}>"Every goodbye deserves to be filled with love and dignity. I&apos;m here to help you honour your dog exactly the way they deserve."</div>
            <button className="farewell-cta">Talk to Mira →</button>
          </div>
        </div>
        {currentPet&&<div style={{padding:'0 16px 24px'}}><GuidedFarewellPaths pet={currentPet}/></div>}
        <div style={{padding:'0 16px 24px'}}><FarewellNearMe pet={currentPet} onBook={venue=>{tdc.request(`Farewell service: ${venue}`,{pillar:'farewell',channel:'farewell_nearme',pet:currentPet});}}/></div>
        {currentPet&&<div style={{margin:'0 16px 24px',background:F.dark,borderRadius:20,padding:18,cursor:'pointer'}} onClick={()=>setSoulMadeOpen(true)}>
          <div style={{fontSize:10,letterSpacing:'0.14em',color:F.indigoXL,fontWeight:700,marginBottom:8}}>✦ SOUL MADE™ · IN MEMORY OF {petName.toUpperCase()}</div>
          <div style={{fontSize:20,fontWeight:700,color:'#fff',marginBottom:8}}>A portrait. A memorial. Something to keep forever.</div>
          <button className="farewell-cta">Create a memorial for {petName} →</button>
        </div>}
        <div style={{margin:'0 16px 24px',background:F.dark,borderRadius:24,padding:20}}>
          <div style={{display:'inline-flex',background:'rgba(123,111,190,0.2)',border:'1px solid rgba(123,111,190,0.4)',borderRadius:999,padding:'5px 14px',color:F.indigoXL,fontSize:12,fontWeight:600,marginBottom:12}}>🌷 Farewell Concierge®</div>
          <div style={{fontSize:22,fontWeight:700,color:'#fff',lineHeight:1.2,marginBottom:10,fontFamily:'Georgia,serif'}}>We&apos;re here. Tell us how we can help.</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:16}}>Cremation, memorials, grief counselling, Rainbow Bridge tributes — all arranged with care.</div>
          <button onClick={()=>{vibe('medium');request(`Farewell concierge for ${petName}`,{channel:'farewell_cta'});}} style={{width:'100%',minHeight:48,borderRadius:14,border:'none',background:`linear-gradient(135deg,${F.indigoL},${F.indigoXL})`,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>🌷 Talk to Concierge® →</button>
        </div>
      </div>
    </PillarPageLayout>
  );
}

