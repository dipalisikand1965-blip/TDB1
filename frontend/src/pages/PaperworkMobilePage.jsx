/**
 * PaperworkMobilePage.jsx — /paperwork (mobile)
 * Colour: Slate blue #1A2640 → #2E5090
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
import GuidedPaperworkPaths from '../components/paperwork/GuidedPaperworkPaths';
import DocumentVault from '../components/paperwork/DocumentVault';
import PaperworkNearMe from '../components/paperwork/PaperworkNearMe';
import SoulMadeModal from '../components/SoulMadeModal';

const PW={slate:'#1A2640',slateL:'#2E5090',slateXL:'#5B80C4',cream:'#F5F7FF',border:'#C5CFEC',dark:'#0A1020',taupe:'#4A5570'};
const CSS_PW=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');.paper{font-family:'DM Sans',-apple-system,sans-serif;background:${PW.cream};color:${PW.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}.paper-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${PW.slate},${PW.slateL});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}.paper-cta:active{transform:scale(0.97)}`;
function vibe(t='light'){if(navigator?.vibrate)navigator.vibrate(t==='medium'?[12]:[6]);}

export default function PaperworkMobilePage() {
  const{token}=useAuth();const navigate=useNavigate();
  const{currentPet,setCurrentPet,pets:contextPets}=usePillarContext();
  usePlatformTracking({pillar:'paperwork',pet:currentPet});
  const{request}=useConcierge({pet:currentPet,pillar:'paperwork'});
  const[loading,setLoading]=useState(true);
  const[soulMadeOpen,setSoulMadeOpen]=useState(false);
  useEffect(()=>{if(contextPets!==undefined)setLoading(false);if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]);},[contextPets,currentPet,setCurrentPet]);
  if(loading)return<PillarPageLayout pillar="paperwork" hideHero hideNavigation><div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:36,marginBottom:12}}>📄</div><div>Loading documents…</div></div></div></PillarPageLayout>;
  const petName=currentPet?.name||'your dog';
  return(
    <PillarPageLayout pillar="paperwork" hideHero hideNavigation>
      <div className="paper" data-testid="paperwork-mobile"><style>{CSS_PW}</style>
        {soulMadeOpen&&<SoulMadeModal pet={currentPet} pillar="paperwork" pillarColor={PW.slateL} pillarLabel="Paperwork" onClose={()=>setSoulMadeOpen(false)}/>}
        <div style={{background:`linear-gradient(160deg,${PW.dark} 0%,${PW.slate} 50%,${PW.slateL} 100%)`,padding:'20px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div><div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',marginBottom:2}}>THE DOGGY COMPANY</div><div style={{fontSize:22,fontWeight:700,color:'#fff'}}>📄 Paperwork</div></div>
            {contextPets?.length>1&&(<select value={currentPet?.id} onChange={e=>{vibe();setCurrentPet(contextPets.find(p=>p.id===e.target.value));}} style={{background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:999,padding:'7px 14px',color:'#fff',fontSize:13}}>{contextPets.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>)}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:52,height:52,borderRadius:'50%',flexShrink:0,background:'rgba(255,255,255,0.15)',border:'2px solid rgba(255,255,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>{currentPet?.photo_url?<img src={currentPet.photo_url} alt={petName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:22}}>🐾</span>}</div>
            <div><div style={{fontSize:20,fontWeight:700,color:'#fff'}}>Documents & Compliance</div><div style={{fontSize:15,color:'rgba(255,255,255,0.7)'}}>for {petName}</div></div>
          </div>
        </div>

        {currentPet&&<div style={{padding:'0 16px 8px'}}><PillarSoulProfile pet={currentPet} pillar="paperwork" token={token}/></div>}
        <div style={{padding:'0 16px 16px'}}><div style={{fontSize:26,fontWeight:700,marginBottom:6}}>{petName}&apos;s Document Vault</div><div style={{fontSize:15,color:PW.taupe}}>All documents safe in one place. Concierge® handles the filings.</div></div>

        {/* Document Vault */}
        {currentPet&&<div style={{padding:'0 16px 24px'}}><DocumentVault pet={currentPet} token={token}/></div>}

        <div style={{margin:'0 16px 20px',background:PW.dark,borderRadius:20,padding:16}}>
          <div style={{fontSize:11,fontWeight:700,color:'rgba(91,128,196,0.9)',letterSpacing:'0.1em',marginBottom:8}}>✦ MIRA ON {petName.toUpperCase()}'S DOCUMENTS</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.75)',lineHeight:1.6,marginBottom:14,fontStyle:'italic'}}>"I keep track of {petName}'s vaccination records, microchip info, and travel documents. Everything is here when you need it."</div>
          <button className="paper-cta">Ask Mira about Documents →</button>
        </div>

        {currentPet&&<div style={{padding:'0 16px 24px'}}><GuidedPaperworkPaths pet={currentPet}/></div>}
        <div style={{padding:'0 16px 24px'}}><PaperworkNearMe pet={currentPet} onBook={service=>{tdc.request(`Paperwork service: ${service}`,{pillar:'paperwork',channel:'paperwork_nearme',pet:currentPet});}}/></div>

        <div style={{margin:'0 16px 24px',background:PW.dark,borderRadius:24,padding:20}}>
          <div style={{display:'inline-flex',background:'rgba(91,128,196,0.2)',border:'1px solid rgba(91,128,196,0.4)',borderRadius:999,padding:'5px 14px',color:PW.slateXL,fontSize:12,fontWeight:600,marginBottom:12}}>📄 Paperwork Concierge®</div>
          <div style={{fontSize:22,fontWeight:700,color:'#fff',lineHeight:1.2,marginBottom:10,fontFamily:'Georgia,serif'}}>Hate paperwork? We handle it all for {petName}.</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:16}}>Microchip registration, municipal licenses, travel health certificates, insurance — Concierge® files everything.</div>
          <button onClick={()=>{vibe('medium');request(`Paperwork concierge for ${petName}`,{channel:'paperwork_cta'});}} style={{width:'100%',minHeight:48,borderRadius:14,border:'none',background:`linear-gradient(135deg,${PW.slateL},${PW.slateXL})`,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>📄 Let Concierge® Handle It →</button>
        </div>
      </div>
    </PillarPageLayout>
  );
}

