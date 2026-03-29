/**
 * EmergencySoulPage.jsx — /emergency pillar
 * The Doggy Company
 *
 * Colour world: Deep Red #7F1D1D + Crimson #DC2626
 * Unique: Emergency Readiness Score (not soul score)
 * Glowing dims = urgent action needed
 * Architecture: Full Care/Learn parity (Session 83n)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Loader2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import SharedProductCard, { ProductDetailModal } from "../components/ProductCard";
import SoulMadeModal from "../components/SoulMadeModal";
import ConciergeToast from "../components/common/ConciergeToast";
import MiraImaginesCard from "../components/common/MiraImaginesCard";
import { useMiraIntelligence, getMiraIntelligenceSubtitle } from "../hooks/useMiraIntelligence";
import GuidedEmergencyPaths from "../components/emergency/GuidedEmergencyPaths";
import EmergencyNearMe from "../components/emergency/EmergencyNearMe";
import { API_URL } from "../utils/api";
import { tdc } from "../utils/tdc_intent";
import { usePlatformTracking } from "../hooks/usePlatformTracking";
import PillarSoulProfile from "../components/PillarSoulProfile";
import PillarServiceSection from "../components/PillarServiceSection";
import MiraImaginesBreed from "../components/common/MiraImaginesBreed";
import EmergencyMobilePage from './EmergencyMobilePage';
import { filterBreedProducts } from '../hooks/useMiraFilter';

const G = {
  deep:"#7F1D1D", mid:"#991B1B", crimson:"#DC2626", light:"#FCA5A5",
  pale:"#FEF2F2", cream:"#FFF5F5", pageBg:"#FFF5F5",
  darkText:"#7F1D1D", mutedText:"#991B1B",
  border:"rgba(220,38,38,0.18)", borderLight:"rgba(220,38,38,0.10)",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

function t(str, name) { return str ? str.replace(/{name}/g, name||"your dog") : ""; }
function getAge(pet) { const r=pet?.doggy_soul_answers?.age_years??pet?.age??null; if(!r)return null; return parseInt(r)||null; }
function isPuppy(pet) { const a=getAge(pet); return a!==null&&a<=1; }
function isSenior(pet) { const a=getAge(pet); return a!==null&&a>=7; }

function getEmergencyScore(pet) {
  let s=0;
  if(pet?.doggy_soul_answers?.microchipped)        s+=20;
  if(pet?.doggy_soul_answers?.has_medical_tag)     s+=20;
  if(pet?.doggy_soul_answers?.emergency_vet_saved) s+=20;
  if(pet?.doggy_soul_answers?.first_aid_kit)       s+=15;
  if(pet?.doggy_soul_answers?.insurance)           s+=15;
  if(pet?.doggy_soul_answers?.emergency_card)      s+=10;
  return s;
}
function getMissingItems(pet) {
  const m=[];
  if(!pet?.doggy_soul_answers?.microchipped)        m.push("Microchip not registered");
  if(!pet?.doggy_soul_answers?.has_medical_tag)     m.push("No medical alert tag");
  if(!pet?.doggy_soul_answers?.emergency_vet_saved) m.push("No emergency vet saved");
  if(!pet?.doggy_soul_answers?.first_aid_kit)       m.push("No first aid kit");
  if(!pet?.doggy_soul_answers?.insurance)           m.push("No pet insurance");
  return m;
}


function SoulChip({ icon, label, value }) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(252,165,165,0.20)",border:"1px solid rgba(252,165,165,0.35)",borderRadius:9999,padding:"4px 12px",fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.90)"}}>{icon&&<span>{icon}</span>}{label&&<span style={{opacity:0.75}}>{label}:</span>}{value}</span>;
}

const EMERG_SERVICES = [
  { id:"emerg_vet",    icon:"🏥", name:"Emergency Vet Finder",         tagline:"Nearest 24hr vet — now",      price:"Free",   steps:2, dim:"emergvet",  accentColor:"#DC2626", desc:"Mira finds the nearest 24-hour emergency vet right now — no searching, no panic.", miraKnows:"Having the number saved before you need it saves lives. Let me find yours now for {petName}." },
  { id:"afterhours",   icon:"📞", name:"After-Hours Care Guidance",    tagline:"Out-of-hours guidance",       price:"Free",   steps:2, dim:"emergvet",  accentColor:"#991B1B", desc:"Out-of-hours guidance — what to do, whether to go to emergency or wait.", miraKnows:"Most emergencies happen outside office hours. I'll walk you through exactly what to do for {petName}." },
  { id:"accident",     icon:"🩺", name:"Accident & Poison Response",   tagline:"Act in the first 10 minutes", price:"Free",   steps:2, dim:"firstaid",  accentColor:"#DC2626", desc:"Step-by-step response for accidents, poisoning, or sudden illness.", miraKnows:"The first 10 minutes in any emergency matter most. I have the protocol ready for {petName}." },
  { id:"lostpet",      icon:"📍", name:"Lost Pet Response",            tagline:"Start immediately",           price:"Free",   steps:2, dim:"lostpet",   accentColor:"#991B1B", desc:"Immediate lost pet protocol — posts, alerts, microchip tracing, local network.", miraKnows:"The first 2 hours are critical when a pet is lost. I'll activate everything at once for {petName}." },
  { id:"transport",    icon:"🚐", name:"Emergency Transport",          tagline:"Safe, fast, arranged now",    price:"₹1,500", steps:2, dim:"transport", accentColor:"#DC2626", desc:"Emergency pet transport to the nearest 24-hour vet — immediate dispatch.", miraKnows:"I'll arrange transport for {petName} immediately. Stay calm — help is coming." },
  { id:"firstaidcourse",icon:"📚",name:"Pet First Aid Course",         tagline:"Be ready before it happens",  price:"₹1,999", steps:2, dim:"firstaid",  accentColor:"#7F1D1D", desc:"Certified course — CPR, wound care, choking, poisoning response.", miraKnows:"Pet owners who've done a first aid course save their pets' lives. This is the most important course." },
];

const EMERGENCY_QUESTIONS = [
  { id:"microchipped",        chapter:"🪪 Identity",  pts:20, type:"single", question:"Is {name} microchipped and registered?",          options:["Yes — chip + registry","Chipped but not registered","Not chipped","Not sure"] },
  { id:"has_medical_tag",     chapter:"🏷️ ID Tag",    pts:20, type:"single", question:"Does {name} have a medical alert tag?",            options:["Yes — full info on tag","Yes — basic name/number only","No tag","On order"] },
  { id:"emergency_vet_saved", chapter:"🏥 Vet",       pts:20, type:"single", question:"Do you have a 24-hr emergency vet number saved?",  options:["Yes — number + address saved","Yes — number only","No — need to find one","Have regular vet only"] },
  { id:"first_aid_kit",       chapter:"🩺 First Aid", pts:15, type:"single", question:"Do you have a pet first aid kit at home?",          options:["Yes — full kit","Yes — basic kit","No","Have human kit only"] },
  { id:"insurance",           chapter:"🛡️ Insurance", pts:15, type:"single", question:"Does {name} have pet insurance?",                   options:["Yes — active policy","No insurance","Looking into it","Doesn't need it"] },
  { id:"emergency_card",      chapter:"📋 Info Card", pts:10, type:"single", question:"Do you have an emergency info card for {name}?",    options:["Yes — in wallet + collar","Collar only","No card","In progress"] },
];

export function getEmergDims(pet) {
  const missing=getMissingItems(pet); const breed=pet?.breed||"";
  return [
    { id:"firstaid",  icon:"🩺", label:"First Aid",            sub:"Home kit + immediate response protocol",        badge:"Act fast",   badgeBg:G.crimson, glow:missing.includes("No first aid kit"),   glowColor:"rgba(220,38,38,0.40)", mira:`The first minutes in any emergency determine the outcome for {name}. I have the protocol ready.` },
    { id:"lostpet",   icon:"📍", label:"Lost Pet",              sub:missing.includes("Microchip not registered")?"Register microchip — urgent":"GPS, alerts + recovery protocol",  badge:missing.includes("Microchip not registered")?"Urgent":"Protected", badgeBg:missing.includes("Microchip not registered")?"#DC2626":G.mid, glow:missing.includes("Microchip not registered"), glowColor:"rgba(220,38,38,0.40)", mira:`If {name} is ever lost, I have the complete protocol ready — microchip trace, local alerts, poster network.` },
    { id:"emergvet",  icon:"🏥", label:"Emergency Vet",         sub:missing.includes("No emergency vet saved")?"Save a vet now — important":"Nearest 24hr vet — always ready",  badge:missing.includes("No emergency vet saved")?"Save now":"Saved", badgeBg:missing.includes("No emergency vet saved")?"#DC2626":G.mid, glow:missing.includes("No emergency vet saved"), glowColor:"rgba(220,38,38,0.40)", mira:`I have the nearest 24-hour emergency vet for {name} saved and ready. One tap when you need it.` },
    { id:"transport", icon:"🚐", label:"Emergency Transport",   sub:"Safe, fast, arranged immediately",              badge:"On standby", badgeBg:G.mid, glow:false, glowColor:"rgba(220,38,38,0.20)", mira:`Emergency transport for {name} — carrier-safe, vet-directed, immediate dispatch.` },
    { id:"insurance", icon:"🛡️", label:"Insurance",             sub:missing.includes("No pet insurance")?"Not covered — emergency care is expensive":"Policy + claims + emergency fund", badge:missing.includes("No pet insurance")?"Not covered":"Covered", badgeBg:missing.includes("No pet insurance")?"#DC2626":G.mid, glow:missing.includes("No pet insurance"), glowColor:"rgba(220,38,38,0.35)", mira:`Emergency care is expensive. {name}'s insurance means you never have to choose between cost and care.` },
    { id:"soul",      icon:"🌟", label:"Soul Emergency",        sub:breed?`${breed} medical alert tag + emergency card`:"Medical alert tag + emergency info card", badge:"Always ready", badgeBg:G.mid, glow:missing.includes("No medical alert tag"), glowColor:"rgba(220,38,38,0.35)", mira:`{name}'s medical alert tag and emergency info card — on the collar, in your wallet, always.` },
  ];
}

export const DIM_CAT = { firstaid:"First Aid", lostpet:"Lost Pet", emergvet:"Vet Emergency", transport:"Vet Emergency", insurance:"First Aid", soul:"Soul Emergency" };

// ── EMERGENCY PROFILE (collapsed → modal) ───────────────────
function EmergencyProfile({ pet, token }) {
  const petName  = pet?.name||"your dog";
  const missing  = getMissingItems(pet);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [answers, setAnswers]       = useState({});
  const [saved,   setSaved]         = useState({});
  const [submitting, setSubmitting] = useState({});
  const [liveScore, setLiveScore]   = useState(getEmergencyScore(pet));
  const remaining = EMERGENCY_QUESTIONS.filter(q=>!saved[q.id]);
  const toggle = (qId,val) => setAnswers(p=>({...p,[qId]:[val]}));
  const save = async (q) => {
    const ans=answers[q.id]; if(!ans?.length)return;
    setSubmitting(p=>({...p,[q.id]:true}));
    try {
      const res=await fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/answer`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({question_id:q.id,answer:ans})});
      if(res.ok){const d=await res.json();if(d.scores?.overall)setLiveScore(d.scores.overall);}
      setSaved(p=>({...p,[q.id]:true}));
    } catch { setSaved(p=>({...p,[q.id]:true})); }
    finally { setSubmitting(p=>({...p,[q.id]:false})); }
  };
  return (
    <>
      <div onClick={()=>setDrawerOpen(true)} data-testid="emergency-profile-bar"
        style={{background:"#fff",border:`2px solid ${G.pale}`,borderRadius:16,padding:"14px 18px",marginBottom:20,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 12px rgba(220,38,38,0.08)"}}>
        <div style={{width:40,height:40,borderRadius:10,flexShrink:0,fontSize:20,background:`linear-gradient(135deg,${G.pale},${G.light})`,display:"flex",alignItems:"center",justifyContent:"center"}}>🛡️</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:700,color:G.darkText}}>{petName}'s Emergency Profile</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:5}}>
            {missing.length===0
              ? <span style={{fontSize:11,fontWeight:600,color:G.crimson,background:G.pale,border:`1px solid ${G.light}`,borderRadius:20,padding:"3px 10px"}}>✦ {petName} is emergency-ready</span>
              : missing.slice(0,2).map(m=><span key={m} style={{fontSize:10,fontWeight:600,color:"#C62828",background:"#FFEBEE",border:"1px solid #EF9A9A",borderRadius:20,padding:"2px 8px"}}>⚠ {m}</span>)}
          </div>
        </div>
        <span style={{fontSize:11,color:G.crimson,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>Mira's picks →</span>
      </div>
      {drawerOpen && (
        <div onClick={()=>setDrawerOpen(false)} style={{position:"fixed",inset:0,zIndex:10002,background:"rgba(0,0,0,0.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div onClick={e=>e.stopPropagation()} data-testid="emergency-profile-drawer"
            style={{width:"min(780px,100%)",maxHeight:"90vh",overflowY:"auto",borderRadius:24,background:"#fff",boxShadow:"0 24px 80px rgba(0,0,0,0.55)",display:"flex",flexDirection:"column"}}>
            <div style={{borderRadius:"24px 24px 0 0",padding:"24px 28px 20px",background:`linear-gradient(135deg,#3D0000 0%,${G.deep} 60%,${G.mid} 100%)`,flexShrink:0,position:"sticky",top:0,zIndex:2}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <p style={{fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:`${G.light}E6`,fontSize:10,marginBottom:5}}>🚨 BUILD {petName.toUpperCase()}'S EMERGENCY READINESS</p>
                  <p style={{color:"rgba(255,255,255,0.50)",fontSize:12}}>{liveScore>=80?`${petName} is emergency-ready`:`${petName} has ${missing.length} critical gap${missing.length>1?"s":""} — let's fix them now`}</p>
                </div>
                <div style={{display:"flex",alignItems:"flex-end",gap:2}}>
                  <span style={{fontSize:72,fontWeight:900,lineHeight:1,color:liveScore>=80?G.light:G.pale}}>{liveScore}</span>
                  <span style={{color:"rgba(255,255,255,0.40)",fontSize:18,marginBottom:8}}>%</span>
                </div>
              </div>
              <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,0.10)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${liveScore||0}%`,borderRadius:5,background:`linear-gradient(90deg,${G.crimson},${G.light})`,transition:"width 0.9s ease-out"}}/>
              </div>
              <button onClick={()=>setDrawerOpen(false)} style={{position:"absolute",top:16,right:20,background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",color:"rgba(255,255,255,0.70)"}}>✕</button>
            </div>
            <div style={{padding:"24px 28px",background:"#fff"}}>
              {missing.length>0&&<div style={{background:"#FFF3E0",border:"1px solid #FFCC80",borderRadius:12,padding:"12px 16px",marginBottom:18}}><p style={{fontSize:12,fontWeight:700,color:"#E65100",marginBottom:6}}>🚨 Critical gaps for {petName}:</p><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{missing.map(m=><span key={m} style={{fontSize:11,fontWeight:600,color:"#C62828",background:"#FFEBEE",border:"1px solid #EF9A9A",borderRadius:20,padding:"3px 10px"}}>{m}</span>)}</div></div>}
              {remaining.length===0
                ? <div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:28,marginBottom:10}}>🛡️</div><p style={{fontSize:14,fontWeight:700,color:G.darkText}}>{petName} is emergency-ready!</p></div>
                : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(320px,100%),1fr))",gap:14}}>
                    {remaining.slice(0,6).map(q=>{
                      const qAns=answers[q.id]||[],isSaved=saved[q.id],isSend=submitting[q.id],hasAns=qAns.length>0,label=q.question.replace(/{name}/g,petName);
                      if(isSaved)return<div key={q.id} style={{borderRadius:14,padding:16,background:G.pale,border:`2px solid ${G.light}60`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,minHeight:100}}><Check size={18} style={{color:G.crimson}}/><p style={{fontWeight:700,color:G.crimson,fontSize:13,textAlign:"center"}}>Readiness updated!</p><div style={{borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,background:G.pale,color:G.mid}}>+{q.pts} pts</div></div>;
                      return<div key={q.id} style={{borderRadius:14,padding:"14px 16px 12px",background:"#fff",border:`1.5px solid ${G.borderLight}`}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:10,fontWeight:600,color:G.mutedText}}>{q.chapter}</span><span style={{borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,background:G.pale,color:G.crimson}}>+{q.pts} pts</span></div>
                        <p style={{fontWeight:700,fontSize:13,color:G.darkText,marginBottom:10,lineHeight:1.4}}>{label}</p>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{q.options.map(opt=>{const sel=qAns[0]===opt;return<button key={opt} onClick={e=>{e.stopPropagation();e.preventDefault();toggle(q.id,opt);}} style={{borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:sel?700:400,cursor:"pointer",background:sel?G.pale:"#F5F5F5",border:sel?`1.5px solid ${G.crimson}`:"1px solid #E0E0E0",color:sel?G.crimson:"#555",transition:"all 0.12s"}}>{opt}</button>;})}</div>
                        <button onClick={e=>{e.stopPropagation();e.preventDefault();save(q);}} disabled={isSend||!hasAns} style={{width:"100%",borderRadius:10,padding:"9px",fontSize:12,fontWeight:700,color:"#fff",border:"none",cursor:isSend?"wait":!hasAns?"not-allowed":"pointer",background:!hasAns?`${G.crimson}44`:`linear-gradient(135deg,${G.crimson},${G.mid})`,opacity:isSend?0.7:1}}>{isSend?"Saving…":`Save +${q.pts} pts`}</button>
                      </div>;
                    })}
                  </div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── MIRA PICKS SECTION ───────────────────────────────────────
function MiraPicksSection({ pet, onOpenService }) {
  const [picks, setPicks]         = useState([]);
  const [picksLoading, setPicksLoading] = useState(true);
  const [selPick, setSelPick]     = useState(null);
  const { token } = useAuth();
  const petName = pet?.name||"your dog"; const breed = (pet?.breed||"").split("(")[0].trim();
  const { note, orderCount, topInterest } = useMiraIntelligence(pet?.id, token);
  const subtitle = getMiraIntelligenceSubtitle(petName, note, orderCount, topInterest);
  const stage = isPuppy(pet)?"Puppy":isSenior(pet)?"Senior":"Adult";
  const imagines = [
    {id:"e-1",emoji:"🩺",name:`${petName}'s ${stage} First Aid Kit`,description:`Complete kit for ${breed||petName} — 32 pieces, breed emergency guide included.`},
    {id:"e-2",emoji:"🏷️",name:breed?`${breed} Medical Alert Tag`:`${petName}'s Medical Alert Tag`,description:`Engraved: name, microchip, vet, medical conditions — essential collar item.`},
    {id:"e-3",emoji:"📍",name:`${petName}'s Emergency Go-Bag`,description:`Waterproof 72-hour bag — food, water, first aid, documents, emergency blanket.`},
  ];
  useEffect(()=>{
    if(!pet?.id){setPicksLoading(false);return;}
    setPicks([]);setPicksLoading(true);
    const breedParam = encodeURIComponent((pet?.breed||"").toLowerCase());
    Promise.all([
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=emergency&limit=12&min_score=60&entity_type=product&breed=${breedParam}`).then(r=>r.ok?r.json():null),
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=emergency&limit=6&min_score=60&entity_type=service`).then(r=>r.ok?r.json():null),
    ])
      .then(([pData, sData]) => {
        const prods = filterBreedProducts(pData?.picks || [], pet?.breed);
        const svcs = sData?.picks || [];
        const merged = [];
        let pi = 0, si = 0;
        while (pi < prods.length || si < svcs.length) {
          if (pi < prods.length) merged.push(prods[pi++]);
          if (pi < prods.length) merged.push(prods[pi++]);
          if (si < svcs.length) merged.push(svcs[si++]);
        }
        if (merged.length) setPicks(merged.slice(0, 12));
        setPicksLoading(false);
      })
      .catch(()=>setPicksLoading(false));
  },[pet?.id,pet?.breed]);
  return (
    <section style={{marginBottom:28}}>
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}>
        <h3 style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:G.darkText,margin:0,fontFamily:"Georgia,serif"}}>Mira's Emergency Picks for <span style={{color:G.crimson}}>{petName}</span></h3>
        <span style={{fontSize:11,background:`linear-gradient(135deg,${G.crimson},${G.mid})`,color:"#fff",borderRadius:20,padding:"2px 10px",fontWeight:700}}>{picks.length>0?"AI Scored":"Pet Specific"}</span>
      </div>
      <p style={{fontSize:13,color:"#888",marginBottom:16,lineHeight:1.5}}>{subtitle}</p>
      {!picksLoading&&picks.length===0&&(<div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none"}}>{imagines.map(item=><MiraImaginesCard key={item.id} item={item} pet={pet} token={token} pillar="emergency"/>)}</div>)}
      {picksLoading&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",color:G.mutedText}}><Loader2 size={14} style={{animation:"spin 1s linear infinite",color:G.crimson}}/><span style={{fontSize:12}}>Checking {petName}'s emergency readiness…</span></div>}
      {!picksLoading&&picks.length>0&&(<div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:10,scrollbarWidth:"thin"}}>{picks.map((pick,i)=>{const isService=pick.entity_type==='service'||pick.type==='service';const score=pick.mira_score||0;const col=score>=80?"#16A34A":score>=70?G.crimson:"#6B7280";const img=[pick.image_url,pick.image].find(u=>u&&u.startsWith("http"))||null;return<div key={i} style={{flexShrink:0,width:168,background:"#fff",borderRadius:14,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",cursor:"pointer",transition:"transform 0.15s"}} onClick={()=>isService?onOpenService?.(pick.name):setSelPick(pick)} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}><div style={{width:"100%",height:130,background:G.cream,overflow:"hidden",position:"relative"}}>{img?<img src={img} alt={pick.name||""} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${G.deep},${G.crimson})`,color:"#fff",fontSize:12,fontWeight:700,padding:8,textAlign:"center"}}>{(pick.name||"").slice(0,18)}</div>}</div><div style={{padding:"10px 11px 12px"}}><div style={{fontSize:12,fontWeight:700,color:G.darkText,lineHeight:1.3,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{pick.name||"—"}</div>{!isService&&<div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}><div style={{flex:1,height:4,background:G.pale,borderRadius:4,overflow:"hidden"}}><div style={{width:`${score}%`,height:"100%",background:col,borderRadius:4}}/></div><span style={{fontSize:10,fontWeight:800,color:col,minWidth:26}}>{score}</span></div>}{isService&&<p style={{fontSize:11,color:G.crimson,lineHeight:1.45,margin:'0 0 8px'}}>Fast concierge support for urgent situations.</p>}<button onClick={(e)=>{e.stopPropagation();isService?onOpenService?.(pick.name):setSelPick(pick);}} style={{width:'100%',background:`linear-gradient(135deg,${G.crimson},${G.mid})`,color:'#fff',border:'none',borderRadius:10,padding:'8px 10px',fontSize:12,fontWeight:700,cursor:'pointer'}}>{isService?'Get help now →':'View details →'}</button></div></div>;})})</div>)}
      {selPick&&<ProductDetailModal product={selPick} pillar="emergency" selectedPet={pet} onClose={()=>setSelPick(null)}/>}
    </section>
  );
}

// ── DIM EXPANDED ─────────────────────────────────────────────
export function DimExpanded({ dim, pet, onClose, apiProducts={}, onBook, breedProducts=[] }) {
  const petName=pet?.name||"your dog";
  const [dimTab,setDimTab]=useState("products");
  const catName=DIM_CAT[dim.id]||"First Aid";
  const catData=apiProducts[catName]||{};
  const allRaw=filterBreedProducts(Object.values(catData).flat(),pet?.breed);
  const displayProducts = allRaw.length > 0 ? allRaw : breedProducts;
  const dimSvcs=EMERG_SERVICES.filter(s=>s.dim===dim.id);
  return (
    <div style={{background:"#fff",border:`2px solid ${G.crimson}`,borderTop:"none",borderRadius:"0 0 14px 14px",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:8,background:G.pale,padding:"10px 16px",borderBottom:`1px solid ${G.pale}`}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0,marginTop:1}}>✦</div>
        <p style={{fontSize:12,color:G.darkText,fontStyle:"italic",margin:0,lineHeight:1.5,flex:1}}>"{t(dim.mira,petName)}"</p>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,color:"#BBB",cursor:"pointer",flexShrink:0,padding:"0 4px"}}>✕</button>
      </div>
      {/* Products | Services tabs */}
      <div style={{display:"flex",borderBottom:"1px solid #F0F0F0"}}>
        {[{id:"products",label:"📦 Products"},{id:"services",label:"🚨 Services"}].map(tab=>(
          <button key={tab.id} onClick={()=>setDimTab(tab.id)}
            style={{flex:1,padding:"10px 0",background:"none",border:"none",
              borderBottom:dimTab===tab.id?`2.5px solid ${G.crimson}`:"2.5px solid transparent",
              color:dimTab===tab.id?G.mid:"#888",fontSize:12,fontWeight:dimTab===tab.id?700:400,cursor:"pointer"}}>
            {tab.label}
          </button>
        ))}
      </div>
      {dimTab==="products"&&(
        <div style={{padding:"12px 16px 20px"}}>
          {displayProducts.length===0
            ? <div style={{textAlign:"center",padding:"28px 0",color:"#888",fontSize:13}}><div style={{fontSize:28,marginBottom:8}}>📦</div>Products for {petName} being added.</div>
            : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(170px,100%),1fr))",gap:12}}>{displayProducts.map(p=><SharedProductCard key={p.id||p._id} product={p} pillar="emergency" selectedPet={pet}/>)}</div>
          }
        </div>
      )}
      {dimTab==="services"&&(
        <div style={{padding:"12px 16px 20px"}}>
          {dimSvcs.length===0
            ? <button onClick={()=>onBook?.(EMERG_SERVICES[0])} style={{width:"100%",background:`linear-gradient(135deg,${G.crimson},${G.mid})`,color:"#fff",border:"none",borderRadius:20,padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Get Emergency Help →</button>
            : <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {dimSvcs.map(svc=>(
                  <div key={svc.id} onClick={()=>onBook?.(svc)} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${G.borderLight}`,cursor:"pointer",padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:28,flexShrink:0}}>{svc.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:G.darkText}}>{svc.name}</div>
                      <div style={{fontSize:11,color:G.mutedText}}>{svc.tagline}</div>
                    </div>
                    <button style={{background:G.crimson,color:"#fff",border:"none",borderRadius:20,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>Get help →</button>
                  </div>
                ))}
              </div>
          }
        </div>
      )}
    </div>
  );
}

// ── EMERGENCY CONCIERGE MODAL ─────────────────────────────────
function EmergencyConciergeModal({ isOpen, onClose, petName, petId, token, preSelected }) {
  const [sel,setSel]=useState(""); const [notes,setNotes]=useState(""); const [sending,setSending]=useState(false); const [sent,setSent]=useState(false);
  useEffect(()=>{
    if(isOpen){
      setSent(false);setNotes("");
      const map={"Emergency Vet Finder":"Find emergency vet","After-Hours Care Guidance":"Accident response","Accident & Poison Response":"Poisoning advice","Lost Pet Response":"Lost pet","Emergency Transport":"Emergency transport","Pet First Aid Course":"First aid guidance"};
      setSel(preSelected?map[preSelected]||preSelected:"");
    }
  }, [isOpen, preSelected]);
  if(!isOpen)return null;
  const send=async()=>{if(!sel||sending)return;setSending(true);tdc.urgent({text:`Emergency: ${sel}`,pet:{id:petId,name:petName},channel:"emergency_modal"});try{const u=JSON.parse(localStorage.getItem("user")||"{}");await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({parent_id:u?.id||u?.email||"guest",pet_id:petId||"",pillar:"emergency",intent_primary:"emergency_concierge",life_state:"CONCERN",channel:"emergency_modal",initial_message:{sender:"parent",text:`I need help with: ${sel}. ${notes?"Notes: "+notes:""}`}})});}catch{}setSending(false);setSent(true);};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.50)",zIndex:10006,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:32,maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto",position:"relative"}}>
        {sent?(<div style={{textAlign:"center",padding:"16px 0"}}><div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${G.crimson},${G.mid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}>🚨</div><h3 style={{fontSize:18,fontWeight:800,color:G.darkText,marginBottom:10}}>Concierge® alerted</h3><p style={{fontSize:14,color:G.mutedText,marginBottom:24}}>Our team will respond within 2 hours.</p><button onClick={onClose} style={{background:G.crimson,color:"#fff",border:"none",borderRadius:12,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button></div>):(
          <>
            <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:18}}>✕</button>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#FEF2F2",border:"1px solid rgba(220,38,38,0.30)",borderRadius:9999,padding:"4px 14px",marginBottom:20}}><span style={{fontSize:11,fontWeight:600,color:G.crimson,letterSpacing:"0.06em",textTransform:"uppercase"}}>🚨 {petName}'s Emergency Concierge®</span></div>
            <h2 style={{fontSize:22,fontWeight:800,color:G.darkText,fontFamily:"Georgia,serif",lineHeight:1.2,marginBottom:8}}>What does <span style={{color:G.crimson}}>{petName}</span> need right now?</h2>
            <p style={{fontSize:14,color:"#888",marginBottom:24}}>We respond within 2 hours. For life-threatening emergencies, call your emergency vet directly.</p>
            <p style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:12}}>What are we handling?</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
              {["Find emergency vet","Lost pet","Poisoning advice","Accident response","Emergency transport","First aid guidance","Insurance claim","Crisis boarding"].map(opt=><button key={opt} onClick={()=>setSel(opt)} style={{borderRadius:9999,padding:"8px 16px",fontSize:13,cursor:"pointer",background:sel===opt?G.pale:"#fff",border:`1.5px solid ${sel===opt?G.crimson:"rgba(220,38,38,0.25)"}`,color:sel===opt?G.crimson:"#555"}}>{opt}</button>)}
            </div>
            <textarea placeholder="Any details that will help us respond faster…" value={notes} onChange={e=>setNotes(e.target.value)} style={{width:"100%",border:`1.5px solid ${G.border}`,borderRadius:12,padding:"12px 14px",fontSize:13,outline:"none",resize:"none",minHeight:80,marginBottom:24,boxSizing:"border-box"}}/>
            <button onClick={send} disabled={!sel||sending} style={{width:"100%",background:!sel?`${G.crimson}44`:`linear-gradient(135deg,${G.crimson},${G.mid})`,color:!sel?"#999":"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:800,cursor:!sel?"not-allowed":"pointer"}}>{sending?"Sending…":`🚨 Alert ${petName}'s Concierge®`}</button>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingState(){return<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{width:48,height:48,borderRadius:"50%",background:MIRA_ORB,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff"}}>✦</div><div style={{fontSize:16,color:G.darkText,fontWeight:600}}>Checking emergency readiness…</div></div>;}
function NoPetState({onAddPet}){return<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{fontSize:48,marginBottom:16}}>🚨</div><div style={{fontSize:18,fontWeight:800,color:G.darkText,marginBottom:8}}>Add a pet to check readiness</div><button onClick={onAddPet} style={{background:`linear-gradient(135deg,${G.crimson},${G.mid})`,color:"#fff",border:"none",borderRadius:9999,padding:"12px 28px",fontSize:16,fontWeight:600,cursor:"pointer"}}>Add your dog →</button></div>;}

// ── MAIN PAGE ─────────────────────────────────────────────────
const EmergencySoulPage = () => {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  useEffect(() => { const fn = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  const pet = currentPet; // alias for sub-components


  // ── Universal visit tracking ──────────────────────────────────
  usePlatformTracking({ pillar: "emergency", pet: currentPet });

  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("emergency");
  const [openDim, setOpenDim]       = useState(null);
  const [petData, setPetData]       = useState(null);
  const [readinessScore, setReadinessScore] = useState(0);
  const [apiProducts, setApiProducts] = useState({});
  const [services, setServices]     = useState([]);
  const [activeService, setActiveService] = useState(null);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [conciergeSvc,  setConciergeSvc]  = useState("");
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastSvc, setToastSvc]     = useState("");
  const [breedProducts, setBreedProducts] = useState([]);
  const [breedProductsLoading, setBreedProductsLoading] = useState(false);

  const openEmergencyService = useCallback((serviceName = 'Emergency help') => {
    tdc.urgent({ text: serviceName, pet: petData, channel: 'emergency_services_card' });
    setConciergeSvc(serviceName);
    setConciergeOpen(true);
  }, [petData]);


  const handleBook = useCallback((svc) => {
    if(!svc)return;
    // EMERGENCY — always fire urgent ticket immediately
    tdc.urgent({ text: svc?.name || "Emergency help needed", pet: petData, channel: "emergency_pillar" });
    const known = EMERG_SERVICES.find(s=>s.name===svc?.name||s.id===svc?.id);
    if(known){setActiveService(known);return;}
    setConciergeOpen(true);
  },[petData]);

  useEffect(()=>{
    const CATS=["First Aid","Lost Pet","Vet Emergency","Evacuation Readiness","Soul Emergency"];
    Promise.all(CATS.map(cat=>fetch(`${API_URL}/api/admin/pillar-products?pillar=emergency&limit=50&category=${encodeURIComponent(cat)}`).then(r=>r.ok?r.json():null).catch(()=>null))).then(results=>{
      const grouped={};
      results.forEach(data=>(data?.products||[]).forEach(p=>{const c=p.category||"";if(!grouped[c])grouped[c]={};const s=p.sub_category||"";if(!grouped[c][s])grouped[c][s]=[];grouped[c][s].push(p);}));
      setApiProducts(grouped);
    });
    fetch(`${API_URL}/api/service-box/services?pillar=emergency`).then(r=>r.ok?r.json():null).then(d=>{if(d?.services)setServices(d.services);}).catch(()=>{});
  },[]);

  useEffect(()=>{if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]);if(contextPets!==undefined)setLoading(false);},[contextPets,currentPet,setCurrentPet]);
  useEffect(()=>{if(currentPet){const n={...currentPet,photo_url:currentPet.photo_url||currentPet.avatar_url||null,avatar:currentPet.avatar||"🐕",breed:currentPet.breed||""};setPetData(n);setReadinessScore(getEmergencyScore(n));}}, [currentPet]);

  // Fetch breed-specific emergency products
  useEffect(()=>{
    if(!currentPet?.breed) return;
    const breedKey = (currentPet.breed||"").toLowerCase().replace(/\s+/g,'_').replace(/[()]/g,'');
    setBreedProductsLoading(true);
    fetch(`${API_URL}/api/mockups/breed-products?breed=${encodeURIComponent(breedKey)}&pillar=emergency&limit=20`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        const prods=(d?.products||[]).filter(p=>p.image_url||p.mockup_url||p.cloudinary_url);
        setBreedProducts(prods);
        setBreedProductsLoading(false);
      })
      .catch(()=>setBreedProductsLoading(false));
  },[currentPet?.breed]);

  const handleAddPet = useCallback(()=>navigate(isAuthenticated?"/dashboard/pets?action=add":"/login?redirect=/emergency"),[isAuthenticated,navigate]);

  // Mobile detection
  if (!isDesktop) return <EmergencyMobilePage />;

  if(loading)   return <PillarPageLayout pillar="emergency" hideHero hideNavigation><LoadingState/></PillarPageLayout>;
  if(!petData)  return <PillarPageLayout pillar="emergency" hideHero hideNavigation><NoPetState onAddPet={handleAddPet}/></PillarPageLayout>;

  const dims    = getEmergDims(petData);
  const petName = petData.name;
  const breed   = petData.breed||"";
  const missing = getMissingItems(petData);

  const EMERG_CATS = [
    {id:"firstaid",  icon:"🩺", label:"First Aid",       bg:"#FEF2F2", accent:"#DC2626"},
    {id:"lostpet",   icon:"📍", label:"Lost Pet",         bg:"#FFF3E0", accent:"#DC2626"},
    {id:"emergvet",  icon:"🏥", label:"Emergency Vet",    bg:"#FFE8E8", accent:"#991B1B"},
    {id:"transport", icon:"🚐", label:"Transport",        bg:"#FEF2F2", accent:"#DC2626"},
    {id:"insurance", icon:"🛡️", label:"Insurance",        bg:"#FFF8F0", accent:"#991B1B"},
    {id:"soul",      icon:"🌟", label:"Soul Emergency",  bg:"#FEF2F2", accent:"#7F1D1D"},
    {id:"mira",      icon:"✦",  label:"Mira's Picks",    bg:"#FFF5F5", accent:"#DC2626"},
  ];

  return (
    <>
    <PillarPageLayout pillar="emergency" hideHero hideNavigation>
      <Helmet><title>Emergency · {petName} · The Doggy Company</title></Helmet>

      {/* ── HERO ── */}
      <div style={{background:`linear-gradient(160deg,${G.deep} 0%,${G.mid} 55%,#B91C1C 100%)`,padding:"28px 20px 0",position:"relative",overflow:"hidden",textAlign:"center",boxSizing:"border-box",width:"100%"}}>
        <div style={{position:"absolute",top:20,right:20,width:44,height:44,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 0 24px rgba(220,38,38,0.50)"}}>✦</div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:10}}>
          <div style={{width:80,height:80,borderRadius:"50%",overflow:"hidden",border:"3px solid rgba(255,255,255,0.30)",boxShadow:"0 0 0 3px rgba(220,38,38,0.40)",background:`linear-gradient(135deg,${G.light},${G.crimson})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,color:"#fff"}}>
            {(petData?.photo_url)?<img src={petData.photo_url} alt={petName} loading="eager" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>:<span>{petData?.avatar||"🐕"}</span>}
          </div>
          <div style={{marginTop:-8,background:`linear-gradient(135deg,${G.deep},${G.crimson})`,borderRadius:20,padding:"3px 10px",fontSize:9,fontWeight:700,color:"#fff",border:"1.5px solid rgba(255,255,255,0.25)",whiteSpace:"nowrap"}}>
            Readiness {readinessScore}%
          </div>
        </div>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(252,165,165,0.18)",borderRadius:20,padding:"4px 14px",marginBottom:14}}>
          <span style={{fontSize:11,color:G.light,fontWeight:700}}>{readinessScore>=80?`✦ ${petName} is emergency-ready — Mira has everything.`:`🚨 Emergency Readiness · ${petName}`}</span>
        </div>
        <h1 style={{fontSize:"clamp(1.875rem,4vw,2.5rem)",fontWeight:900,color:"#fff",marginBottom:8,lineHeight:1.15,fontFamily:"Georgia,'Times New Roman',serif",textAlign:"center"}}>
          Keep <span style={{color:G.light}}>{petName}</span> safe<br/>every moment
        </h1>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.72)",textAlign:"center",marginBottom:14,maxWidth:480,margin:"0 auto 14px",lineHeight:1.6}}>First aid, emergency vets, lost pet protocols — all ready before you ever need them.</p>
        <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,marginBottom:16}}>
          {breed&&<SoulChip icon="🐾" label="Breed" value={breed}/>}
          {missing.length>0&&<SoulChip value={`🚨 ${missing.length} gap${missing.length>1?"s":""} to close`}/>}
          {readinessScore>=80&&<SoulChip value="✦ Emergency-ready"/>}
        </div>
        <div style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 18px",maxWidth:480,margin:"0 auto 16px",textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",flexShrink:0}}>✦</div>
            <div>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.85)",fontStyle:"italic",lineHeight:1.6,margin:0}}>"Being ready before an emergency is the greatest gift you give {petName}. I've built the complete protocol."</p>
              <span style={{fontSize:11,color:G.light,fontWeight:600}}>♥ Mira knows {petName}</span>
            </div>
          </div>
        </div>
        <div style={{textAlign:"center",paddingBottom:6}}><ChevronDown size={22} style={{color:"rgba(255,255,255,0.35)"}}/></div>
      </div>

      {/* ── PAGE BODY ── */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8" style={{background:G.pageBg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",overflowX:"hidden",boxSizing:"border-box"}}>
        {/* Soul Profile bar */}
        <div style={{ paddingTop: 16 }}>
          <PillarSoulProfile pet={petData} token={token} pillar="emergency" />
        </div>
        {/* Category strip */}
        <div style={{background:"#fff",borderBottom:`1px solid ${G.borderLight}`,position:"relative"}}>
          <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",padding:"8px 12px",gap:4}}>
            {EMERG_CATS.map(cat=>{
              const isA=openDim===cat.id;
              return<button key={cat.id} data-testid={`emergency-cat-${cat.id}`} onClick={()=>setOpenDim(cat.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,minWidth:82,height:72,padding:"10px 12px",cursor:"pointer",background:"transparent",border:"none",borderBottom:`3px solid ${isA?G.crimson:"transparent"}`,transition:"border-color 150ms ease"}}>
                <div style={{width:34,height:34,borderRadius:10,background:cat.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:4}}>{cat.icon}</div>
                <span style={{fontSize:10,fontWeight:isA?700:500,color:isA?G.crimson:"#555",whiteSpace:"nowrap",textAlign:"center"}}>{cat.label}</span>
              </button>;
            })}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{display:"flex",background:"#fff",borderBottom:`1.5px solid ${G.borderLight}`,marginBottom:24}}>
          {[{id:"emergency",label:"🚨 Emergency Kit"},{id:"services",label:"🐕 Services"},{id:"find",label:"📍 Find Vet"}].map(tab=>{const a=activeTab===tab.id;return<button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{flex:1,padding:"14px 4px",background:"none",border:"none",borderBottom:a?`3px solid ${G.crimson}`:"3px solid transparent",color:a?G.crimson:"#888",fontSize:13,fontWeight:a?700:500,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>{tab.label}</button>;})}
        </div>

        {/* Emergency Kit tab */}
        {activeTab==="emergency" && (
          <>
            <div style={{marginBottom:20}}><EmergencyProfile pet={petData} token={token}/></div>
            {missing.length>0&&(<div style={{background:"#FFF3E0",border:"1px solid #FFCC80",borderRadius:14,padding:"16px 20px",marginBottom:20}}>
              <p style={{fontSize:13,fontWeight:700,color:"#E65100",marginBottom:10}}>🚨 {petName}'s emergency gaps to close now:</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>{missing.map(m=><span key={m} style={{fontSize:11,fontWeight:600,color:"#C62828",background:"#FFEBEE",border:"1px solid #EF9A9A",borderRadius:20,padding:"3px 10px"}}>⚠ {m}</span>)}</div>
              <button onClick={()=>setConciergeOpen(true)} style={{background:`linear-gradient(135deg,${G.crimson},${G.mid})`,color:"#fff",border:"none",borderRadius:20,padding:"9px 20px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Fix these now with Concierge® →</button>
            </div>)}
            <MiraPicksSection pet={petData} onOpenService={(serviceName)=>{const map={'Emergency Vet Discovery':'Find emergency vet','After-Hours Care Guidance':'Accident response','24/7 Emergency Helpline Subscription':'Emergency transport','24/7 Emergency Vet Hotline':'Find emergency vet'};openEmergencyService(map[serviceName]||serviceName||'Find emergency vet');}}/>
            {/* ✦ Soul Made™ trigger — custom emergency ID tags, medical alert tags */}
            <div data-testid="emergency-soul-made-trigger" onClick={()=>setSoulMadeOpen(true)}
              style={{width:"100%",marginBottom:24,padding:"20px 20px 18px",background:`linear-gradient(135deg,${G.deep} 0%,${G.mid} 50%,${G.deep} 100%)`,border:`1.5px solid rgba(220,38,38,0.4)`,borderRadius:18,cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:`0 4px 24px rgba(220,38,38,0.18)`,transition:"transform 0.15s, box-shadow 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 32px rgba(220,38,38,0.32)`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=`0 4px 24px rgba(220,38,38,0.18)`;}}>
              <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:`radial-gradient(circle,rgba(220,38,38,0.15) 0%,transparent 70%)`,pointerEvents:"none"}}/>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.15em",color:G.light,marginBottom:8}}>{`\u2726 SOUL MADE\u2122 \u00B7 SAFETY GEAR FOR ${(petName||"YOUR DOG").toUpperCase()}`}</div>
              <div style={{fontSize:20,fontWeight:800,color:"#F5F0E8",fontFamily:"Georgia,serif",marginBottom:6,lineHeight:1.2}}>Custom safety gear for {petName}.</div>
              <div style={{fontSize:13,color:"rgba(245,240,232,0.65)",marginBottom:16}}>ID Tag · Medical Alert Collar · Emergency Go-Bag · GPS Tag · and more</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`linear-gradient(135deg,${G.crimson},${G.mid})`,borderRadius:30,padding:"10px 22px",fontSize:13,fontWeight:700,color:"#fff",boxShadow:`0 4px 16px rgba(220,38,38,0.4)`}}>{`\u2726 Make something only ${petName} has`}</div>
                <div style={{fontSize:12,color:"rgba(245,240,232,0.35)",fontStyle:"italic",maxWidth:160,textAlign:"right",lineHeight:1.4}}>Upload a photo · Concierge® creates it</div>
              </div>
            </div>

            {/* ── SOUL PICKS: Breed Emergency Products ── */}
            {(breedProductsLoading || breedProducts.length > 0) && (
              <section style={{marginBottom:28}}>
                <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}>
                  <h3 style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:G.darkText,margin:0,fontFamily:"Georgia,serif"}}>
                    Emergency Kit for <span style={{color:G.crimson}}>{petName}</span>
                  </h3>
                  {!breedProductsLoading && breedProducts.length > 0 && (
                    <span style={{fontSize:11,background:`linear-gradient(135deg,${G.crimson},${G.mid})`,color:"#fff",borderRadius:20,padding:"2px 10px",fontWeight:700}}>{breedProducts.length} items</span>
                  )}
                </div>
                <p style={{fontSize:13,color:"#888",marginBottom:16,lineHeight:1.5}}>
                  Personalised emergency essentials — chosen for {breed||petName}.
                </p>
                {breedProductsLoading ? (
                  <div style={{fontSize:12,color:"#aaa",padding:"8px 0"}}>Loading emergency kit for {petName}…</div>
                ) : (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(160px,100%),1fr))",gap:12}}>
                    {breedProducts.map((p,i)=>(
                      <SharedProductCard key={p.id||p._id||i} product={p} pillar="emergency" selectedPet={petData}/>
                    ))}
                  </div>
                )}
              </section>
            )}

            <GuidedEmergencyPaths pet={petData}/>


            {/* ── MIRA IMAGINES: Emergency kit ideas ── */}
            {petData?.breed && (
              <MiraImaginesBreed pet={petData} pillar="emergency" colour={G.crimson} onConcierge={()=>{}}/>
            )}
            <section style={{paddingBottom:16}}>
              <h2 style={{fontSize:"clamp(1.25rem,3vw,1.5rem)",fontWeight:800,color:G.darkText,marginBottom:6,fontFamily:"Georgia,serif"}}>Is <span style={{color:G.crimson}}>{petName}</span> really ready?</h2>
              <p style={{fontSize:14,color:"#888",lineHeight:1.5}}>Every dim below has the tools, kit, and service. <span style={{color:G.mid,fontWeight:600}}>Glowing dims need urgent attention.</span></p>
            </section>
            <div style={{display:"grid",gap:16,marginBottom:32}} className="emerg-dims-grid">
              <style>{`.emerg-dims-grid{grid-template-columns:1fr}@media(min-width:560px){.emerg-dims-grid{grid-template-columns:repeat(2,1fr)}}@media(min-width:900px){.emerg-dims-grid{grid-template-columns:repeat(3,1fr)}}`}</style>
              {dims.map(dim=>{const isOpen=openDim===dim.id;return<div key={dim.id} style={{gridColumn:isOpen?"1 / -1":"auto"}}>
                <div onClick={()=>setOpenDim(isOpen?null:dim.id)} data-testid={`emergency-dim-${dim.id}`} style={{background:"#fff",borderRadius:isOpen?"16px 16px 0 0":16,cursor:"pointer",overflow:"hidden",border:isOpen?`2px solid ${G.crimson}`:`2px solid ${G.borderLight}`,boxShadow:dim.glow&&!isOpen?`0 4px 24px ${dim.glowColor}`:"0 2px 8px rgba(0,0,0,0.06)",transition:"all 0.2s"}}>
                  <div style={{height:6,background:isOpen?G.crimson:(dim.glowColor||G.mid),borderRadius:"16px 16px 0 0"}}/>
                  <div style={{padding:"20px 20px 18px"}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                      <div style={{width:52,height:52,borderRadius:14,background:dim.glow?`${G.crimson}22`:G.pale,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{dim.icon}</div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                        <span style={{fontSize:10,fontWeight:700,borderRadius:20,padding:"3px 10px",background:`${dim.badgeBg}20`,color:dim.badgeBg,border:`1px solid ${dim.badgeBg}40`}}>{dim.badge}</span>
                        {dim.glow&&<div style={{width:8,height:8,borderRadius:"50%",background:G.light}}/>}
                      </div>
                    </div>
                    <h3 style={{fontSize:16,fontWeight:800,color:G.darkText,marginBottom:6,lineHeight:1.25,fontFamily:"Georgia,serif"}}>{dim.label}</h3>
                    <p style={{fontSize:13,color:G.mutedText,lineHeight:1.55,marginBottom:16,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{t(dim.sub,petName)}</p>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:12,color:G.crimson,fontWeight:700}}>{isOpen?"Close ↑":"Explore →"}</span>
                      <span style={{fontSize:11,color:"#aaa"}}>Products · Services</span>
                    </div>
                  </div>
                </div>
                {/* DimExpanded renders as a FULL-SCREEN MODAL — same as Dine/Care content modals */}
                {isOpen && ReactDOM.createPortal(
                  <>
                    <div onClick={()=>setOpenDim(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200}}/>
                    <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:201,width:"min(640px,96vw)",maxHeight:"88vh",overflowY:"auto",borderRadius:20,background:"#fff",boxShadow:"0 24px 80px rgba(0,0,0,0.25)"}}>
                      <div style={{position:"sticky",top:0,background:`linear-gradient(135deg,${G.crimson},${G.mid})`,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderRadius:"20px 20px 0 0"}}>
                        <div>
                          <div style={{fontSize:11,color:"rgba(255,255,255,0.75)",textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>{dim.label}</div>
                          <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{dim.sub}</div>
                        </div>
                        <button onClick={()=>setOpenDim(null)} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                      </div>
                      <DimExpanded dim={dim} pet={petData} onClose={()=>setOpenDim(null)} apiProducts={apiProducts} onBook={handleBook} breedProducts={breedProducts}/>
                    </div>
                  </>,
                  document.body
                )}
              </div>;})}
            </div>
          </>
        )}

        {/* Book Help tab */}
        {activeTab==="services" && (
          <div style={{marginTop:24}}>
            <PillarServiceSection
              pillar="emergency"
              pet={petData}
              title="Emergency Help, Personally"
              accentColor={G.crimson}
              darkColor={G.dark}
              preloadedServices={services}
            />
          </div>
        )}

        {/* Find Vet tab */}
        {activeTab==="find" && (
          <div style={{marginTop:8}}>
            <EmergencyNearMe pet={petData} onBook={(svc)=>{setConciergeSvc(svc?.name||"");setConciergeOpen(true);}}/>
          </div>
        )}
      </div>

      <ConciergeToast toast={toastVisible?{name:toastSvc,pillar:"emergency"}:null} onClose={()=>setToastVisible(false)}/>
      <EmergencyConciergeModal isOpen={conciergeOpen} onClose={()=>setConciergeOpen(false)} petName={petName} petId={petData?.id} token={token} preSelected={conciergeSvc}/>
      {soulMadeOpen&&<SoulMadeModal pet={petData} pillar="emergency" pillarColor={G.crimson} pillarLabel="Emergency" onClose={()=>setSoulMadeOpen(false)}/>}
    </PillarPageLayout>
    </>
  );
};

export default EmergencySoulPage;
