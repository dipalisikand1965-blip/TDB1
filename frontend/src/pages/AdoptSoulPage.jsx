/**
 * AdoptSoulPage.jsx — /adopt pillar
 * The Doggy Company
 *
 * Colour world: Deep Mauve #4A0E2E + Rose #D4537E
 * Unique: Adoption Readiness Score + Stage Tracker (Thinking→Ready→Looking→Matched→Home)
 * Architecture: Full Care/Learn parity (Session 83n)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useScrollLock } from '../hooks/useScrollLock';
import { applyMiraFilter, filterBreedProducts } from '../hooks/useMiraFilter';
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Loader2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import SharedProductCard, { ProductDetailModal } from "../components/ProductCard";
import ConciergeToast from "../components/common/ConciergeToast";
import MiraImaginesCard from "../components/common/MiraImaginesCard";
import GuidedAdoptPaths from "../components/adopt/GuidedAdoptPaths";
import AdoptNearMe from "../components/adopt/AdoptNearMe";
import { API_URL } from "../utils/api";
import { tdc } from "../utils/tdc_intent";
import { usePlatformTracking } from "../hooks/usePlatformTracking";
import PillarSoulProfile from "../components/PillarSoulProfile";
import PillarServiceSection from "../components/PillarServiceSection";
import SoulMadeModal from "../components/SoulMadeModal";
import AdoptMobilePage from './AdoptMobilePage';
import FirstTimePawrent from '../components/common/FirstTimePawrent';

const G = {
  deep:"#4A0E2E", mid:"#7B1D4E", rose:"#D4537E", light:"#F9A8C9",
  pale:"#FDF2F8", cream:"#FFF5FC", pageBg:"#FFF5FC",
  darkText:"#4A0E2E", mutedText:"#7B1D4E",
  border:"rgba(212,83,126,0.18)", borderLight:"rgba(212,83,126,0.10)",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

function t(str, name) { return str ? str.replace(/{name}/g, name||"your dog") : ""; }

const ADOPT_STAGES = [
  { id:"thinking",  label:"Ready?",      emoji:"💭", desc:"Exploring the idea of adopting" },
  { id:"ready",     label:"Adopting",    emoji:"✅", desc:"Decided — ready to find the right dog" },
  { id:"looking",   label:"Find Match",  emoji:"🔍", desc:"Actively searching and meeting dogs" },
  { id:"matched",   label:"Matched!",    emoji:"❤️", desc:"Found the one — finalising adoption" },
  { id:"home",      label:"Coming Home", emoji:"🏠", desc:"They're home — settling in" },
  { id:"breed",     label:"Breeds",      emoji:"📚", desc:"Breed-specific products for your dog" },
  { id:"guidance",  label:"Book",        emoji:"💌", desc:"Talk to Mira's concierge team" },
];

const ADOPT_QUESTIONS = [
  { id:"adopt_stage",    chapter:"🏡 Stage",    pts:15, type:"single", question:"Where are you in {name}'s adoption journey?", options:["Just thinking","Decided — ready to find the right dog","Actively looking and meeting dogs","Found the one — finalising","They're home already"] },
  { id:"lifestyle_match",chapter:"❤️ Lifestyle", pts:20, type:"single", question:"What energy level suits your lifestyle?",      options:["Low energy — calm, easy-going","Medium — moderate walks, playtime","High energy — active, loves exercise","Flexible — happy to adapt"] },
  { id:"living_situation",chapter:"🏠 Home",    pts:15, type:"single", question:"What is your living situation?",               options:["Apartment — no garden","House — small garden","House — large garden","Farm / open land"] },
  { id:"experience_level",chapter:"🎓 Experience",pts:20,type:"single", question:"What is your dog ownership experience?",      options:["First-time owner","Some experience","Experienced dog owner","Professional / breeder"] },
  { id:"rehome_reason",  chapter:"🐾 Rescue",   pts:15, type:"single", question:"Are you open to a rescue / rehome dog?",       options:["Yes — strongly prefer rescue","Open to rescue or breeder","Breeder preferred","Not sure yet"] },
  { id:"other_pets",     chapter:"🐕 Household",pts:15, type:"single", question:"Any other pets at home?",                     options:["No other pets","Other dogs — same size","Other dogs — different size","Cats","Multiple animals"] },
];

const ADOPT_SERVICES = [
  { id:"breed_advisory",  icon:"📚", name:"Breed Suitability Advisory",   tagline:"Find your perfect match",          price:"Free",   steps:2, accentColor:"#D4537E", desc:"Mira matches breed energy, size, temperament and health to your lifestyle — before you meet one dog.", miraKnows:"The right breed match prevents 80% of rehoming cases. This is the most important step." },
  { id:"home_assessment", icon:"🏠", name:"Home Readiness Assessment",     tagline:"Before they arrive",               price:"Free",   steps:2, accentColor:"#7B1D4E", desc:"Mira's team checks your home for safety, space and setup — gives you a step-by-step readiness plan.", miraKnows:"Most new owners underestimate how much prep is needed. I walk you through everything." },
  { id:"rescue_network",  icon:"🐾", name:"Rescue Partner Network",        tagline:"Matched, not random",              price:"Free",   steps:2, accentColor:"#D4537E", desc:"Mira connects you with verified rescue partners and specific dogs matching your lifestyle.", miraKnows:"I've built relationships with rescue centres across India — so you find the right dog, not just any dog." },
  { id:"post_adopt",      icon:"❤️", name:"Post-Adoption Support",         tagline:"First 30 days matter most",        price:"Free",   steps:2, accentColor:"#7B1D4E", desc:"Behaviour guidance, settling-in support, and vet coordination — Mira walks you through the first month.", miraKnows:"The first 30 days at home shape the rest of the dog's life. I'll be with you every step." },
  { id:"adopt_paperwork", icon:"📋", name:"Adoption Paperwork Guidance",   tagline:"No confusion, no gaps",            price:"Free",   steps:2, accentColor:"#D4537E", desc:"All adoption forms, microchipping, registration and vet records — Concierge® handles the paperwork.", miraKnows:"Adoption paperwork is often skipped. Doing it right protects you and the dog." },
  { id:"multi_pet",       icon:"🐕", name:"Multi-Pet Integration",         tagline:"First introductions matter",       price:"₹999",   steps:2, accentColor:"#7B1D4E", desc:"Expert guidance on introducing a new dog to existing pets — step-by-step, safe, stress-free.", miraKnows:"The first meeting between pets sets the tone for life. I'll make sure it goes right." },
];

function SoulChip({ icon, label, value }) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(249,168,201,0.20)",border:"1px solid rgba(249,168,201,0.35)",borderRadius:9999,padding:"4px 12px",fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.90)"}}>{icon&&<span>{icon}</span>}{label&&<span style={{opacity:0.75}}>{label}:</span>}{value}</span>;
}

function AdoptProfile({ pet, token }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [answers, setAnswers]       = useState({});
  const [saved,   setSaved]         = useState({});
  const [submitting, setSubmitting] = useState({});
  const [liveScore, setLiveScore]   = useState(70);
  const remaining = ADOPT_QUESTIONS.filter(q=>!saved[q.id]);
  const toggle = (qId,val) => setAnswers(p=>({...p,[qId]:[val]}));
  const save = async (q) => {
    const ans=answers[q.id]; if(!ans?.length)return;
    setSubmitting(p=>({...p,[q.id]:true}));
    try {
      const res=await fetch(`${API_URL}/api/pet-soul/profile/${pet?.id}/answer`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({question_id:q.id,answer:ans})});
      if(res.ok){const d=await res.json();if(d.scores?.overall)setLiveScore(d.scores.overall);}
      setSaved(p=>({...p,[q.id]:true}));
    } catch { setSaved(p=>({...p,[q.id]:true})); }
    finally { setSubmitting(p=>({...p,[q.id]:false})); }
  };
  return (
    <>
      <div onClick={()=>setDrawerOpen(true)} data-testid="adopt-profile-bar"
        style={{background:"#fff",border:`2px solid ${G.pale}`,borderRadius:16,padding:"14px 18px",marginBottom:20,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 12px rgba(212,83,126,0.08)"}}>
        <div style={{width:40,height:40,borderRadius:10,flexShrink:0,fontSize:20,background:`linear-gradient(135deg,${G.pale},${G.light})`,display:"flex",alignItems:"center",justifyContent:"center"}}>🐾</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:700,color:G.darkText}}>Adoption Readiness Profile</div>
          <div style={{fontSize:12,color:G.mutedText,marginTop:3}}>Tell Mira about your lifestyle — she'll find your perfect match</div>
        </div>
        <span style={{fontSize:11,color:G.rose,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>Mira's picks →</span>
      </div>
      {drawerOpen && (
        <div onClick={()=>setDrawerOpen(false)} style={{position:"fixed",inset:0,zIndex:10002,background:"rgba(0,0,0,0.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"min(780px,100%)",maxHeight:"90vh",overflowY:"auto",borderRadius:24,background:"#fff",boxShadow:"0 24px 80px rgba(0,0,0,0.55)",display:"flex",flexDirection:"column"}}>
            <div style={{borderRadius:"24px 24px 0 0",padding:"24px 28px 20px",background:`linear-gradient(135deg,#2D0520 0%,${G.deep} 60%,${G.mid} 100%)`,flexShrink:0,position:"sticky",top:0,zIndex:2}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <p style={{fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:`${G.light}E6`,fontSize:10,marginBottom:5}}>✦ BUILD YOUR ADOPTION PROFILE</p>
                  <p style={{color:"rgba(255,255,255,0.50)",fontSize:12}}>Tell Mira about your lifestyle — she'll match you with the right dog</p>
                </div>
                <div style={{display:"flex",alignItems:"flex-end",gap:2}}>
                  <span style={{fontSize:72,fontWeight:900,lineHeight:1,color:G.light}}>{liveScore}</span>
                  <span style={{color:"rgba(255,255,255,0.40)",fontSize:18,marginBottom:8}}>%</span>
                </div>
              </div>
              <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,0.10)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${liveScore}%`,borderRadius:5,background:`linear-gradient(90deg,${G.rose},${G.light})`,transition:"width 0.9s ease-out"}}/>
              </div>
              <button onClick={()=>setDrawerOpen(false)} style={{position:"absolute",top:16,right:20,background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",color:"rgba(255,255,255,0.70)"}}>✕</button>
            </div>
            <div style={{padding:"24px 28px",background:"#fff"}}>
              {remaining.length===0
                ? <div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:28,marginBottom:10}}>❤️</div><p style={{fontSize:14,fontWeight:700,color:G.darkText}}>Your adoption profile is ready — Mira knows exactly what you need!</p></div>
                : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(320px,100%),1fr))",gap:14}}>
                    {remaining.slice(0,6).map(q=>{
                      const qAns=answers[q.id]||[],isSaved=saved[q.id],isSend=submitting[q.id],hasAns=qAns.length>0;
                      if(isSaved)return<div key={q.id} style={{borderRadius:14,padding:16,background:G.pale,border:`2px solid ${G.light}60`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,minHeight:100}}><Check size={18} style={{color:G.rose}}/><p style={{fontWeight:700,color:G.rose,fontSize:13,textAlign:"center"}}>Profile updated!</p></div>;
                      return<div key={q.id} style={{borderRadius:14,padding:"14px 16px 12px",background:"#fff",border:`1.5px solid ${G.borderLight}`}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:10,fontWeight:600,color:G.mutedText}}>{q.chapter}</span><span style={{borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,background:G.pale,color:G.rose}}>+{q.pts} pts</span></div>
                        <p style={{fontWeight:700,fontSize:13,color:G.darkText,marginBottom:10,lineHeight:1.4}}>{q.question}</p>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{q.options.map(opt=>{const sel=qAns[0]===opt;return<button key={opt} onClick={e=>{e.stopPropagation();e.preventDefault();toggle(q.id,opt);}} style={{borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:sel?700:400,cursor:"pointer",background:sel?G.pale:"#F5F5F5",border:sel?`1.5px solid ${G.rose}`:"1px solid #E0E0E0",color:sel?G.rose:"#555",transition:"all 0.12s"}}>{opt}</button>;})}</div>
                        <button onClick={e=>{e.stopPropagation();e.preventDefault();save(q);}} disabled={isSend||!hasAns} style={{width:"100%",borderRadius:10,padding:"9px",fontSize:12,fontWeight:700,color:"#fff",border:"none",cursor:!hasAns?"not-allowed":"pointer",background:!hasAns?`${G.rose}44`:`linear-gradient(135deg,${G.rose},${G.mid})`,opacity:isSend?0.7:1}}>{isSend?"Saving…":`Save +${q.pts} pts`}</button>
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

function MiraPicksSection({ pet, onOpenService }) {
  const [picks, setPicks]               = useState([]);
  const [picksLoading, setPicksLoading] = useState(true);
  const [selPick, setSelPick]           = useState(null);
  const { token } = useAuth();
  const petName = pet?.name || "your dog";
  const gentleSubtitle = "Gentle, concierge-led support for discovery, readiness, and the first days home.";
  const imagines = [
    {id:"a-1",emoji:"🏠",name:"Home Readiness Kit",description:"Baby gates, socket covers, cord protectors — complete dog-proofing kit for your home."},
    {id:"a-2",emoji:"📚",name:"Breed Compatibility Guide",description:"50-breed guide — energy, size, temperament and lifestyle fit — find your perfect match."},
    {id:"a-3",emoji:"❤️",name:"First Week Starter Pack",description:"Everything for the first week — bed, bowl, lead, toy, settling-in guide."},
  ];
  useEffect(()=>{
    if(!pet?.id){setPicksLoading(false);return;}
    Promise.all([
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=adopt&limit=12&min_score=60&entity_type=product`).then(r=>r.ok?r.json():null),
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=adopt&limit=6&min_score=60&entity_type=service`).then(r=>r.ok?r.json():null),
    ])
      .then(([pData, sData]) => {
        const prods = pData?.picks || [];
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
      .catch(() => setPicksLoading(false));
  },[pet?.id]);
  const productPicks = picks.filter(p => p.entity_type === 'product' || p.type === 'product' || (!p.entity_type && !p.type));
  const servicePicks = picks.filter(p => p.entity_type === 'service' || p.type === 'service');
  const badgeLabel = productPicks.length > 0 ? 'AI Scored' : servicePicks.length > 0 ? 'Concierge® Curated' : 'Curated';
  return (
    <section style={{marginBottom:28}}>
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}>
        <h3 style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:G.darkText,margin:0,fontFamily:"Georgia,serif"}}>Mira's Adoption Picks</h3>
        <span style={{fontSize:11,background:`linear-gradient(135deg,${G.rose},${G.mid})`,color:"#fff",borderRadius:20,padding:"2px 10px",fontWeight:700}}>{badgeLabel}</span>
      </div>
      <p style={{fontSize:13,color:"#888",marginBottom:16}}>{gentleSubtitle}</p>
      {!picksLoading&&picks.length===0&&<div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none"}}>{imagines.map(item=><MiraImaginesCard key={item.id} item={item} pet={pet} token={token} pillar="adopt"/>)}</div>}
      <div style={{padding:"0 0 16px"}}><FirstTimePawrent pet={pet} token={token} accentColor="#D4537E" /></div>
      {picksLoading&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",color:G.mutedText}}><Loader2 size={14} style={{animation:"spin 1s linear infinite",color:G.rose}}/><span style={{fontSize:12}}>Mira is preparing adoption picks…</span></div>}
      {!picksLoading&&picks.length>0&&(<div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:10,scrollbarWidth:"thin"}}>{picks.map((pick,i)=>{const isService=pick.entity_type==='service'||pick.type==='service';const score=pick.mira_score||0;const col=score>=80?"#16A34A":score>=70?G.rose:"#6B7280";const img=[pick.image_url,pick.image].find(u=>u&&u.startsWith("http"))||null;return<div key={i} style={{flexShrink:0,width:168,background:"#fff",borderRadius:14,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",cursor:"pointer"}} onClick={()=>isService?onOpenService?.(pick.name):setSelPick(pick)} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}><div style={{width:"100%",height:130,background:G.pale,overflow:"hidden"}}>{img?<img src={img} alt={pick.name||""} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${G.deep},${G.rose})`,color:"#fff",fontSize:12,fontWeight:700,padding:8,textAlign:"center"}}>{(pick.name||"").slice(0,24)}</div>}</div><div style={{padding:"10px 11px 12px"}}><div style={{fontSize:12,fontWeight:700,color:G.darkText,lineHeight:1.3,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{pick.name||"—"}</div>{isService?(<p style={{fontSize:11,color:G.mid,lineHeight:1.45,margin:'0 0 8px'}}>Compassionate concierge support for your adoption journey.</p>):(<div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}><div style={{flex:1,height:4,background:G.pale,borderRadius:4,overflow:"hidden"}}><div style={{width:`${score}%`,height:"100%",background:col,borderRadius:4}}/></div><span style={{fontSize:10,fontWeight:800,color:col,minWidth:26}}>{score}</span></div>)}<button onClick={(e)=>{e.stopPropagation();if(isService){tdc.book({service:pick.name,pillar:'adopt',pet,channel:'adopt_mira_picks_service'});onOpenService?.(pick.name);}else{setSelPick(pick);}}} style={{width:'100%',background:`linear-gradient(135deg,${G.rose},${G.mid})`,color:'#fff',border:'none',borderRadius:10,padding:'8px 10px',fontSize:12,fontWeight:700,cursor:'pointer'}}>{isService?'Talk to Mira →':'View details →'}</button></div></div>;})})</div>)}
      {selPick&&<ProductDetailModal product={selPick} pillar="adopt" selectedPet={pet} onClose={()=>setSelPick(null)}/>}
    </section>
  );
}

function AdoptConciergeModal({ isOpen, onClose, token, preSelected }) {
  const [sel,setSel]=useState(""); const [notes,setNotes]=useState(""); const [sending,setSending]=useState(false); const [sent,setSent]=useState(false);
  useEffect(()=>{
    if(isOpen){
      setSent(false);setNotes("");
      const map={"Breed Suitability Advisory":"Finding the right breed","Home Readiness Assessment":"Home preparation","Rescue Partner Network":"Connecting with rescues","Post-Adoption Support":"Post-adoption support","Adoption Paperwork Guidance":"Adoption paperwork","Multi-Pet Integration":"Multi-pet household"};
      setSel(preSelected?map[preSelected]||"":"");
    }
  }, [isOpen, preSelected]);
  if(!isOpen)return null;
  const send=async()=>{if(!sel||sending)return;setSending(true);tdc.book({service:sel,pillar:"adopt",pet:petData,channel:"adopt_concierge_modal"});try{const u=JSON.parse(localStorage.getItem("user")||"{}");await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({parent_id:u?.id||u?.email||"guest",pet_id:"adopt-enquiry",pillar:"adopt",intent_primary:"adoption_enquiry",life_state:"EXPLORE",channel:"adopt_concierge_modal",initial_message:{sender:"parent",text:`Adoption enquiry: ${sel}. ${notes?"Notes: "+notes:""}`}})});}catch{}setSending(false);setSent(true);};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.50)",zIndex:10006,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:32,maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto",position:"relative"}}>
        {sent?(<div style={{textAlign:"center",padding:"16px 0"}}><div style={{fontSize:40,marginBottom:16}}>❤️</div><h3 style={{fontSize:18,fontWeight:800,color:G.darkText,marginBottom:10}}>Mira's on it</h3><p style={{fontSize:14,color:G.mutedText,marginBottom:24}}>Our team will contact you within 48 hours.</p><button onClick={onClose} style={{background:G.rose,color:"#fff",border:"none",borderRadius:12,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button></div>):(
          <>
            <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:18}}>✕</button>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:G.pale,border:`1px solid ${G.border}`,borderRadius:9999,padding:"4px 14px",marginBottom:20}}><span style={{fontSize:11,fontWeight:600,color:G.rose,letterSpacing:"0.06em",textTransform:"uppercase"}}>★ Adoption Concierge®</span></div>
            <h2 style={{fontSize:22,fontWeight:800,color:G.darkText,fontFamily:"Georgia,serif",lineHeight:1.2,marginBottom:8}}>Where are you on your <span style={{color:G.rose}}>adoption journey?</span></h2>
            <p style={{fontSize:14,color:"#888",marginBottom:24}}>Three questions. Then Mira takes over.</p>
            <p style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:12}}>What do you need help with?</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
              {["Finding the right breed","Connecting with rescues","Home preparation","Post-adoption support","Multi-pet household","Adoption paperwork","Puppy vs adult decision","Just exploring"].map(opt=><button key={opt} onClick={()=>setSel(opt)} style={{borderRadius:9999,padding:"8px 16px",fontSize:13,cursor:"pointer",background:sel===opt?G.pale:"#fff",border:`1.5px solid ${sel===opt?G.rose:"rgba(212,83,126,0.25)"}`,color:sel===opt?G.rose:"#555"}}>{opt}</button>)}
            </div>
            <textarea placeholder="Tell Mira more about your lifestyle, home, and what you're looking for…" value={notes} onChange={e=>setNotes(e.target.value)} style={{width:"100%",border:`1.5px solid ${G.border}`,borderRadius:12,padding:"12px 14px",fontSize:13,outline:"none",resize:"none",minHeight:80,marginBottom:24,boxSizing:"border-box"}}/>
            <button onClick={send} disabled={!sel||sending} style={{width:"100%",background:!sel?`${G.rose}44`:`linear-gradient(135deg,${G.rose},${G.mid})`,color:!sel?"#999":"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:800,cursor:!sel?"not-allowed":"pointer"}}>{sending?"Sending…":"✦ Start Adoption Journey"}</button>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingState(){return<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{fontSize:48,marginBottom:16}}>🐾</div><div style={{fontSize:16,color:G.darkText,fontWeight:600}}>Preparing your adoption journey…</div></div>;}

const AdoptSoulPage = () => {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  useEffect(() => { const fn = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  const pet = currentPet; // alias for sub-components


  // ── Universal visit tracking ──────────────────────────────────
  usePlatformTracking({ pillar: "adopt", pet: currentPet });

  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState("adopt");
  const [petData,  setPetData]  = useState(null);
  const [apiProducts, setApiProducts] = useState({});
  const [rawProducts, setRawProducts] = useState([]);
  const [services,    setServices]    = useState([]);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [conciergeSvc,  setConciergeSvc]  = useState("");
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [openDim, setOpenDim] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastSvc, setToastSvc] = useState("");
  useScrollLock(drawerOpen || conciergeOpen || soulMadeOpen || !!openDim);

  useEffect(()=>{ if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]); if(contextPets!==undefined)setLoading(false); },[contextPets,currentPet,setCurrentPet]);
  useEffect(()=>{ if(currentPet){ const n={...currentPet,photo_url:currentPet.photo_url||currentPet.avatar_url||null,avatar:currentPet.avatar||"🐕",breed:currentPet.breed||""}; setPetData(n); } },[currentPet]);
  useEffect(()=>{
    const breedParam = petData?.breed ? `&breed=${encodeURIComponent(petData.breed)}` : '';
    fetch(`${API_URL}/api/admin/pillar-products?pillar=adopt&limit=200${breedParam}`).then(r=>r.ok?r.json():null).then(d=>{
      const grouped={};(d?.products||[]).forEach(p=>{const c=p.category||"";if(!grouped[c])grouped[c]={};const s=p.sub_category||"";if(!grouped[c][s])grouped[c][s]=[];grouped[c][s].push(p);});
      setApiProducts(grouped);
      const miraFiltered = petData ? applyMiraFilter(filterBreedProducts(d?.products||[], petData?.breed||''), petData) : (d?.products||[]);
      setRawProducts(miraFiltered);
    }).catch(()=>{});
    fetch(`${API_URL}/api/service-box/services?pillar=adopt`).then(r=>r.ok?r.json():null).then(d=>{if(d?.services)setServices(d.services);}).catch(()=>{});
  },[petData?.breed]);

  const petName = petData?.name || "you";
  const breed   = petData?.breed||"";
  const openAdoptConcierge = useCallback((serviceName = 'Adoption support') => {
    tdc.book({ service: serviceName, pillar: 'adopt', pet: petData, channel: 'adopt_pillar_service' });
    setConciergeSvc(serviceName);
    setConciergeOpen(true);
  }, [petData]);

  // ── Adopt Product Sections (mirrors AdoptMobilePage) ──────────────────────
  const adoptSections = useMemo(() => {
    if (!rawProducts?.length) return [];
    const breedSlug = (petData?.breed || '').toLowerCase().replace(/\s+/g, '-').split('(')[0].trim();
    const breedSpecific = rawProducts.filter(p =>
      (p.sub_category || '').toLowerCase().includes('-adopt') &&
      (p.sub_category || '').toLowerCase().includes(breedSlug)
    );
    const essentials = rawProducts.filter(p => (p.sub_category || '') === 'essentials');
    const readiness  = rawProducts.filter(p => ['readiness', 'discover'].includes(p.sub_category || ''));
    const enrichment = rawProducts.filter(p => ['adopt-enrichment', 'behaviour', 'soul'].includes(p.sub_category || ''));
    return [
      breedSpecific.length ? { id:'breed',      icon:'🐾', label:`${petData?.breed?.split('(')[0].trim() || 'Breed'} Essentials`, products: breedSpecific } : null,
      essentials.length    ? { id:'essentials', icon:'🏠', label:'Arrival Essentials',   products: essentials  } : null,
      readiness.length     ? { id:'readiness',  icon:'📋', label:'Home Readiness',        products: readiness   } : null,
      enrichment.length    ? { id:'enrichment', icon:'🎾', label:'Enrichment & Bonding',  products: enrichment  } : null,
    ].filter(Boolean);
  }, [rawProducts, petData]);

  // Mobile detection
  if (!isDesktop) return <AdoptMobilePage />;

  if(loading) return <PillarPageLayout pillar="adopt" hideHero hideNavigation><LoadingState/></PillarPageLayout>;

  return (
    <>
    <PillarPageLayout pillar="adopt" hideHero hideNavigation>
      <Helmet><title>Adopt · The Doggy Company</title></Helmet>

      {/* HERO */}
      <div style={{background:`linear-gradient(160deg,${G.deep} 0%,${G.mid} 55%,#BE185D 100%)`,padding:"28px 20px 0",position:"relative",overflow:"hidden",textAlign:"center",boxSizing:"border-box",width:"100%"}}>
        <div style={{position:"absolute",top:20,right:20,width:44,height:44,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 0 24px rgba(212,83,126,0.50)"}}>✦</div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:12}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${G.light},${G.rose})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,border:"3px solid rgba(255,255,255,0.30)",overflow:"hidden"}}>
            {petData?.photo_url
              ? <img src={petData.photo_url} alt={petData?.name||"pet"} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} onError={e=>{e.target.style.display="none";e.target.parentNode.innerHTML="🐾";}}/>
              : "🐾"}
          </div>
          <div style={{marginTop:-8,background:`linear-gradient(135deg,${G.deep},${G.rose})`,borderRadius:20,padding:"3px 10px",fontSize:9,fontWeight:700,color:"#fff",border:"1.5px solid rgba(255,255,255,0.25)"}}>Adoption Ready</div>
        </div>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(249,168,201,0.18)",borderRadius:20,padding:"4px 14px",marginBottom:14}}>
          <span style={{fontSize:11,color:G.light,fontWeight:700}}>✦ Find your perfect dog — Mira guides every step</span>
        </div>
        <h1 style={{fontSize:"clamp(1.875rem,4vw,2.5rem)",fontWeight:900,color:"#fff",marginBottom:8,lineHeight:1.15,fontFamily:"Georgia,'Times New Roman',serif"}}>
          Bring home<br/><span style={{color:G.light}}>your new best friend</span>
        </h1>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.72)",marginBottom:16,maxWidth:480,margin:"0 auto 16px",lineHeight:1.6}}>Whether from a rescue, a breeder, or the street — every dog deserves a forever home prepared with love.</p>
        <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,marginBottom:16}}>
          <SoulChip value="🐾 Find your match"/>
          <SoulChip value="❤️ Rescue network"/>
          <SoulChip value="🏠 Home readiness"/>
        </div>
        <div style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 18px",maxWidth:480,margin:"0 auto 16px",textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",flexShrink:0}}>✦</div>
            <div>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.85)",fontStyle:"italic",lineHeight:1.6,margin:0}}>"The right match between a dog and their family changes two lives forever. I make sure it's the right one."</p>
              <span style={{fontSize:11,color:G.light,fontWeight:600}}>♥ Mira — Adoption Guide</span>
            </div>
          </div>
        </div>
        <div style={{textAlign:"center",paddingBottom:6}}><ChevronDown size={22} style={{color:"rgba(255,255,255,0.35)"}}/></div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8" style={{background:G.pageBg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",overflowX:"hidden",boxSizing:"border-box"}}>
        {/* Soul Profile bar */}
        <div style={{ paddingTop: 16 }}>
          <PillarSoulProfile pet={currentPet} token={token} pillar="adopt" />
        </div>
        {/* Tab bar */}
        <div style={{display:"flex",background:"#fff",borderBottom:`1.5px solid ${G.borderLight}`,marginBottom:24}}>
          {[{id:"adopt",label:"🐾 Every Dog"},{id:"services",label:"🐕 Services"},{id:"find",label:"📍 Find a Dog"}].map(tab=>{const a=activeTab===tab.id;return<button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{flex:1,padding:"14px 4px",background:"none",border:"none",borderBottom:a?`3px solid ${G.rose}`:"3px solid transparent",color:a?G.rose:"#888",fontSize:13,fontWeight:a?700:500,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>{tab.label}</button>;})}
        </div>

        {/* Stage tracker */}
        {activeTab==="adopt" && (
          <>
            <div style={{background:"#fff",border:`1.5px solid ${G.borderLight}`,borderRadius:14,padding:"16px 20px",marginBottom:20}}>
              <p style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:12}}>Where are you on the journey?</p>
              <div style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",paddingBottom:4}}>
                {ADOPT_STAGES.map(s=>(
                  <button key={s.id}
                    onClick={()=>{ if(s.id==='guidance'){setConciergeOpen(true);}else{setOpenDim(prev=>prev===s.id?null:s.id);} }}
                    style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"10px 14px",borderRadius:16,border:`2px solid ${openDim===s.id?G.rose:G.border}`,background:openDim===s.id?G.pale:"#fff",cursor:"pointer",minWidth:76,minHeight:78,transition:"all 0.15s"}}>
                    <span style={{fontSize:22}}>{s.emoji}</span>
                    <span style={{fontSize:11,fontWeight:700,color:openDim===s.id?G.rose:G.darkText,textAlign:"center",lineHeight:1.25,whiteSpace:"normal",maxWidth:64}}>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* ── Dim Expanded Panel ── */}
              {openDim && (
                <div style={{marginTop:16,background:"#fff",border:`2px solid ${G.rose}`,borderRadius:20,padding:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <span style={{fontSize:26}}>{ADOPT_STAGES.find(s=>s.id===openDim)?.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:800,color:G.darkText}}>{ADOPT_STAGES.find(s=>s.id===openDim)?.label}</div>
                      <div style={{fontSize:11,color:"#888"}}>Personalised for {petName}</div>
                    </div>
                    <button onClick={()=>setOpenDim(null)} style={{background:G.pale,border:"none",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,color:G.rose,cursor:"pointer"}}>Close ✕</button>
                  </div>
                  <div style={{height:1,background:"rgba(212,83,126,0.15)",margin:"0 0 16px"}}/>

                  {openDim==="thinking" && (
                    <>
                      <FirstTimePawrent pet={petData} token={token} accentColor="#D4537E" />
                      <div style={{marginTop:16}}>
                        <div style={{fontSize:14,fontWeight:700,color:G.darkText,marginBottom:12}}>📚 Breed Advisory</div>
                        <PillarServiceSection pillar="adopt" pet={petData} title="" accentColor={G.rose} darkColor={G.darkText} />
                      </div>
                    </>
                  )}

                  {openDim==="ready" && (
                    <PillarServiceSection pillar="adopt" pet={petData} title="" accentColor={G.rose} darkColor={G.darkText} />
                  )}

                  {openDim==="looking" && (
                    <>
                      <div style={{background:`linear-gradient(135deg,rgba(212,83,126,0.08),rgba(212,83,126,0.14))`,borderRadius:14,padding:"14px 16px",marginBottom:16}}>
                        <div style={{fontSize:15,fontWeight:700,color:G.darkText,marginBottom:4}}>
                          Finding the right {(petData?.breed||"dog").split("(")[0].trim()}
                        </div>
                        <div style={{fontSize:13,color:G.mutedText,lineHeight:1.6}}>
                          Mira matches breed energy, size and temperament to your lifestyle — before you meet one dog. Rescues, breeders and street dogs all verified.
                        </div>
                      </div>
                      <AdoptNearMe pet={petData} onBook={shelter=>{tdc.request(`Adoption enquiry: ${shelter}`,{pillar:"adopt",channel:"adopt_nearme",pet:petData});}} />
                    </>
                  )}

                  {openDim==="matched" && adoptSections.length>0 && (
                    <div style={{display:"flex",flexDirection:"column",gap:20}}>
                      {adoptSections.map(section=>(
                        <div key={section.id}>
                          <div style={{fontSize:15,fontWeight:800,color:G.darkText,marginBottom:10}}>{section.icon} {section.label}</div>
                          <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none"}}>
                            {section.products.slice(0,8).map(p=>(
                              <div key={p.id||p._id} style={{flexShrink:0,width:168}}>
                                <SharedProductCard product={p} pillar="adopt" selectedPet={petData} compact />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {openDim==="home" && (
                    <>
                      <FirstTimePawrent pet={petData} token={token} accentColor="#D4537E" />
                      <div style={{marginTop:16,display:"flex",gap:14,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none"}}>
                        {rawProducts.slice(0,12).map(p=>(
                          <div key={p.id||p._id} style={{flexShrink:0,width:168}}>
                            <SharedProductCard product={p} pillar="adopt" selectedPet={petData} compact />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {openDim==="breed" && (
                    <div>
                      <div style={{fontSize:13,color:G.mutedText,marginBottom:12,lineHeight:1.5}}>
                        Products made specifically for {(petData?.breed||"").split("(")[0].trim()} dogs — from breed guides to welcome kits.
                      </div>
                      <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none"}}>
                        {rawProducts.filter(p=>{
                          const breed=(petData?.breed||"").toLowerCase().split("(")[0].trim();
                          return (p.breed_tags||[]).some(t=>(t||"").toLowerCase().includes(breed))||(p.name||"").toLowerCase().includes(breed);
                        }).slice(0,12).map(p=>(
                          <div key={p.id||p._id} style={{flexShrink:0,width:168}}>
                            <SharedProductCard product={p} pillar="adopt" selectedPet={petData} compact />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{marginBottom:20}}><AdoptProfile pet={petData} token={token}/></div>
            <MiraPicksSection pet={petData} onOpenService={(serviceName)=>openAdoptConcierge(serviceName||'Adoption support')}/>

            {/* ── Sectioned Products (Breed Essentials, Arrival Essentials, etc.) ── */}
            {adoptSections.length > 0 && (
              <div style={{marginBottom:28}}>
                <h3 style={{fontSize:"clamp(1rem,2.5vw,1.25rem)",fontWeight:800,color:G.darkText,marginBottom:20,fontFamily:"Georgia,serif"}}>Mira's Adoption Picks for {petName}</h3>
                {adoptSections.map(section => (
                  <div key={section.id} style={{marginBottom:28}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                      <span style={{fontSize:18}}>{section.icon}</span>
                      <h4 style={{fontSize:15,fontWeight:700,color:G.darkText,margin:0}}>{section.label}</h4>
                    </div>
                    <div style={{display:'flex',gap:14,overflowX:'auto',paddingBottom:8,scrollbarWidth:'none'}}>
                      {section.products.slice(0,8).map(p => (
                        <div key={p.id||p._id} style={{flexShrink:0,width:168}}>
                          <SharedProductCard product={p} pillar="adopt" selectedPet={petData} compact />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* ✦ Soul Made™ trigger */}
            <div data-testid="adopt-soul-made-trigger" onClick={()=>setSoulMadeOpen(true)}
              style={{margin:"0 auto 24px",maxWidth:540,padding:"20px 20px 18px",background:"linear-gradient(135deg, #1a0a2e 0%, #2d0a4e 50%, #1a0a2e 100%)",border:"1.5px solid rgba(196,77,255,0.4)",borderRadius:18,cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:"0 4px 24px rgba(196,77,255,0.18)",transition:"transform 0.15s, box-shadow 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 32px rgba(196,77,255,0.32)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 24px rgba(196,77,255,0.18)";}}>
              <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:"radial-gradient(circle,rgba(196,77,255,0.15) 0%,transparent 70%)",pointerEvents:"none"}}/>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.15em",color:"#C44DFF",marginBottom:8}}>{`\u2726 SOUL MADE\u2122 \u00B7 MADE ONLY FOR ${(petName||"YOUR DOG").toUpperCase()}`}</div>
              <div style={{fontSize:20,fontWeight:800,color:"#F5F0E8",fontFamily:"Georgia,serif",marginBottom:6,lineHeight:1.2}}>{petName}'s face. On everything.</div>
              <div style={{fontSize:13,color:"rgba(245,240,232,0.55)",marginBottom:16}}>Bandana · Portrait Frame · Party Hat · Cake Topper · Tote · and more</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#C44DFF,#9333EA)",borderRadius:30,padding:"10px 22px",fontSize:13,fontWeight:700,color:"#fff",boxShadow:"0 4px 16px rgba(196,77,255,0.4)"}}>{`\u2726 Make something only ${petName} has`}</div>
                <div style={{fontSize:12,color:"rgba(245,240,232,0.35)",fontStyle:"italic",maxWidth:160,textAlign:"right",lineHeight:1.4}}>Upload a photo · Concierge® creates it · Price on WhatsApp</div>
              </div>
            </div>
            <GuidedAdoptPaths pet={petData}/>
            <div style={{background:`linear-gradient(135deg,${G.deep},${G.mid})`,borderRadius:16,padding:"24px 28px",marginBottom:24,textAlign:"center"}}>
              <p style={{fontSize:18,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif",marginBottom:8}}>Ready to start? Mira finds your perfect dog.</p>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.70)",marginBottom:16}}>From rescue to breeder to street dog — I'll prepare everything for your new arrival.</p>
              <button onClick={()=>openAdoptConcierge('Adoption support')} style={{background:`linear-gradient(135deg,${G.rose},${G.mid})`,color:"#fff",border:"none",borderRadius:9999,padding:"12px 28px",fontSize:15,fontWeight:700,cursor:"pointer"}}>✦ Start with Mira →</button>
            </div>
          </>
        )}

        {/* Book Guidance tab */}
        {activeTab==="services" && (
          <div style={{marginTop:24}}>
            <PillarServiceSection
              pillar="adopt"
              pet={petData}
              title="Adoption Guidance, Personally"
              accentColor={G.rose}
              darkColor={G.darkText}
              preloadedServices={services}
            />
          </div>
        )}

        {/* Find Rescue tab */}
        {activeTab==="find" && (
          <div style={{marginTop:8}}>
            <AdoptNearMe pet={petData} onBook={(svc)=>{setConciergeSvc(svc?.name||"");setConciergeOpen(true);}}/>
          </div>
        )}
      </div>

      {/* Soul Adopt — handled via breed tab section above */}

      <ConciergeToast toast={toastVisible?{name:toastSvc,pillar:"adopt"}:null} onClose={()=>setToastVisible(false)}/>
      <AdoptConciergeModal isOpen={conciergeOpen} onClose={()=>setConciergeOpen(false)} token={token} preSelected={conciergeSvc}/>
      {soulMadeOpen&&<SoulMadeModal pet={petData} pillar="adopt" pillarColor={G.rose} pillarLabel="Adoption" onClose={()=>setSoulMadeOpen(false)}/>}
    </PillarPageLayout>
    </>
  );
};

export default AdoptSoulPage;
