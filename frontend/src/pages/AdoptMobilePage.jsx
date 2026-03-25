/**
 * AdoptMobilePage.jsx — /adopt (mobile)
 * Colour: Warm brown #3D1A00 → #A0522D
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
import GuidedAdoptPaths from '../components/adopt/GuidedAdoptPaths';
import AdoptNearMe from '../components/adopt/AdoptNearMe';
import SoulMadeModal from '../components/SoulMadeModal';

const A={brown:'#3D1A00',brownL:'#A0522D',brownXL:'#CD853F',cream:'#FFF9F5',border:'#F5DEB3',dark:'#1A0A00',taupe:'#7A5A3A'};
const CSS_A=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');.adopt{font-family:'DM Sans',-apple-system,sans-serif;background:${A.cream};color:${A.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}.adopt-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${A.brown},${A.brownL});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}.adopt-cta:active{transform:scale(0.97)}`;
function vibe(t='light'){if(navigator?.vibrate)navigator.vibrate(t==='medium'?[12]:[6]);}

export default function AdoptMobilePage() {
  const{token}=useAuth();const navigate=useNavigate();
  const{currentPet,setCurrentPet,pets:contextPets}=usePillarContext();
  usePlatformTracking({pillar:'adopt',pet:currentPet});
  const{request}=useConcierge({pet:currentPet,pillar:'adopt'});
  const[loading,setLoading]=useState(true);
  const[soulMadeOpen,setSoulMadeOpen]=useState(false);
  useEffect(()=>{if(contextPets!==undefined)setLoading(false);if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]);},[contextPets,currentPet,setCurrentPet]);
  if(loading)return<PillarPageLayout pillar="adopt" hideHero hideNavigation><div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:36,marginBottom:12}}>🐾</div><div>Loading adoption paths…</div></div></div></PillarPageLayout>;
  const petName=currentPet?.name||'your dog';
  return(
    <PillarPageLayout pillar="adopt" hideHero hideNavigation>
      <div className="adopt" data-testid="adopt-mobile"><style>{CSS_A}</style>
        {soulMadeOpen&&<SoulMadeModal pet={currentPet} pillar="adopt" pillarColor={A.brownL} pillarLabel="Adopt" onClose={()=>setSoulMadeOpen(false)}/>}
        <div style={{background:`linear-gradient(160deg,${A.dark} 0%,${A.brown} 50%,${A.brownL} 100%)`,padding:'20px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div><div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',marginBottom:2}}>THE DOGGY COMPANY</div><div style={{fontSize:22,fontWeight:700,color:'#fff'}}>🐾 Adopt</div></div>
          </div>
          <div style={{fontSize:20,fontWeight:700,color:'#fff',marginBottom:4}}>Find & Welcome a Dog</div>
          <div style={{fontSize:15,color:'rgba(255,255,255,0.7)'}}>Ethical adoption, rescue, and rehoming support</div>
        </div>
        {currentPet&&<div style={{padding:'0 16px 8px'}}><PillarSoulProfile pet={currentPet} pillar="adopt" token={token}/></div>}
        <div style={{padding:'0 16px 16px'}}><div style={{fontSize:26,fontWeight:700,marginBottom:6}}>Ready to adopt?</div><div style={{fontSize:15,color:A.taupe}}>Mira guides you through finding the perfect match.</div></div>
        <div style={{margin:'0 16px 20px',background:A.dark,borderRadius:20,padding:16}}>
          <div style={{fontSize:11,fontWeight:700,color:'rgba(205,133,63,0.9)',letterSpacing:'0.1em',marginBottom:8}}>✦ MIRA ON ADOPTION</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.75)',lineHeight:1.6,marginBottom:14,fontStyle:'italic'}}>"Every dog deserves a forever home. I'll help you find the right match and guide you through every step."</div>
          <button className="adopt-cta">Start Adoption Journey →</button>
        </div>
        {currentPet&&<div style={{padding:'0 16px 24px'}}><GuidedAdoptPaths pet={currentPet}/></div>}
        <div style={{padding:'0 16px 24px'}}><AdoptNearMe pet={currentPet} onBook={shelter=>{tdc.request(`Adoption enquiry: ${shelter}`,{pillar:'adopt',channel:'adopt_nearme',pet:currentPet});}}/></div>
        <div style={{margin:'0 16px 24px',background:A.dark,borderRadius:24,padding:20}}>
          <div style={{display:'inline-flex',background:'rgba(205,133,63,0.2)',border:'1px solid rgba(205,133,63,0.4)',borderRadius:999,padding:'5px 14px',color:A.brownXL,fontSize:12,fontWeight:600,marginBottom:12}}>🐾 Adoption Concierge®</div>
          <div style={{fontSize:22,fontWeight:700,color:'#fff',lineHeight:1.2,marginBottom:10,fontFamily:'Georgia,serif'}}>Want help finding the perfect dog?</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:16}}>We work with ethical shelters and rescues across India to find your perfect match.</div>
          <button onClick={()=>{vibe('medium');request('Adoption concierge',{channel:'adopt_cta'});}} style={{width:'100%',minHeight:48,borderRadius:14,border:'none',background:`linear-gradient(135deg,${A.brownL},${A.brownXL})`,color:A.dark,fontSize:15,fontWeight:700,cursor:'pointer'}}>🐾 Start with Concierge® →</button>
        </div>
      </div>
    </PillarPageLayout>
  );
}

