/**
 * FarewellSoulPage.jsx — /farewell pillar
 * The Doggy Company
 *
 * Colour world: Deep Midnight #1A1A2E + Soft Indigo #6366F1
 * The most sacred pillar. For Mystique, and every beloved dog.
 * Tone: Gentle, never clinical. Love lives here.
 * Architecture: Full Care/Learn parity (Session 83n)
 */

import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Loader2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import SharedProductCard, { ProductDetailModal } from "../components/ProductCard";
import ConciergeToast from "../components/common/ConciergeToast";
import MiraImaginesCard from "../components/common/MiraImaginesCard";
import { useMiraIntelligence, getMiraIntelligenceSubtitle } from "../hooks/useMiraIntelligence";
import FarewellNearMe from "../components/farewell/FarewellNearMe";
import GuidedFarewellPaths from "../components/farewell/GuidedFarewellPaths";
import { API_URL } from "../utils/api";
import { tdc } from "../utils/tdc_intent";
import { usePlatformTracking } from "../hooks/usePlatformTracking";
import PillarSoulProfile from "../components/PillarSoulProfile";
import SoulMadeCollection from "../components/SoulMadeCollection";
import PersonalisedBreedSection from "../components/common/PersonalisedBreedSection";

const G = {
  deep:"#1A1A2E", mid:"#4B4B6E", indigo:"#6366F1", light:"#C7D2FE",
  pale:"#EEF2FF", cream:"#F8F9FF", pageBg:"#F8F9FF",
  darkText:"#1A1A2E", mutedText:"#4B4B6E",
  border:"rgba(99,102,241,0.18)", borderLight:"rgba(99,102,241,0.10)",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

function t(str, name) { return str ? str.replace(/{name}/g, name||"your dog") : ""; }

const FAREWELL_QUESTIONS = [
  { id:"farewell_stage", chapter:"🕊️ Stage",  pts:15, type:"single", question:"Where are you on {name}'s farewell journey?", options:["Planning ahead — not yet needed","Palliative care — quality of life focus","Recent loss — days to weeks ago","Loss was some time ago — processing","Supporting a friend through loss"] },
  { id:"memorial_wishes",chapter:"🌷 Legacy", pts:20, type:"single", question:"What matters most to you for {name}'s legacy?", options:["A physical memorial — urn, garden, stone","A memory collection — photos, prints, journal","A meaningful ceremony or farewell","Carrying them forward — tree, art, tribute","All of these — their memory everywhere"] },
  { id:"grief_support",  chapter:"💙 Support", pts:15, type:"single", question:"What kind of support helps you most right now?",options:["Practical guidance — what to do next","Emotional — someone to understand","Products that honour their memory","Space — I need time","Guidance for children or family"] },
  { id:"cremation_pref", chapter:"🌿 Wishes",  pts:10, type:"single", question:"Do you have preferences for {name}'s remains?",  options:["Cremation — keep urn at home","Cremation — scatter in special place","Natural burial — biodegradable options","Living memorial — tree or garden","Haven't decided yet"] },
  { id:"memory_keeper",  chapter:"📖 Memories",pts:15, type:"single", question:"How are you preserving {name}'s memories?",     options:["Photo album or book created","Memory box with keepsakes","Journal or written tributes","Digital — online memorial or video","Haven't started yet"] },
];

const FAREWELL_SERVICES = [
  { id:"eol_planning",  icon:"🕊️", name:"End-of-Life Care Planning",      tagline:"Quality of life, with dignity",      price:"Free",   steps:2, accentColor:"#6366F1", desc:"Mira guides quality-of-life conversations with your vet — pain management, dignity, and timing.", miraKnows:"The most loving gift is knowing when to let go. I'll walk you through every conversation." },
  { id:"euthanasia",    icon:"💙", name:"Euthanasia Support & Guidance",  tagline:"When the time comes",               price:"Free",   steps:2, accentColor:"#4B4B6E", desc:"Gentle guidance through the decision and process — what to expect, how to say goodbye, how to be present.", miraKnows:"No one should face this alone. I'll be with you through every moment for {name}." },
  { id:"cremation",     icon:"🌿", name:"Cremation Arrangement",          tagline:"Handled with care",                 price:"₹2,999", steps:2, accentColor:"#6366F1", desc:"Concierge arranges the full cremation — collection, service, and return of remains — with complete dignity.", miraKnows:"Every detail will be handled with the love {name} deserves." },
  { id:"memorial",      icon:"🌷", name:"Memorial Product Creation",       tagline:"A tribute as unique as they were",  price:"₹1,499", steps:2, accentColor:"#4B4B6E", desc:"Paw print casting, memory box, custom portrait, engraved stone — we create a lasting tribute.", miraKnows:"The right memorial is one that feels like them. I'll help you find it." },
  { id:"ceremony",      icon:"🕯️", name:"Rainbow Bridge Ceremony",         tagline:"A send-off with love",              price:"₹3,999", steps:2, accentColor:"#6366F1", desc:"A gentle farewell ceremony at home or at a partner location — readings, flowers, paw print, and space to grieve.", miraKnows:"Saying goodbye with intention heals in ways you don't expect." },
  { id:"grief_counsel", icon:"💜", name:"Grief Counselling Referral",      tagline:"Your grief is real and valid",      price:"Free",   steps:2, accentColor:"#4B4B6E", desc:"Mira connects you with a pet grief counsellor — because the loss of a dog is the loss of unconditional love.", miraKnows:"Pet grief is real grief. You deserve support that understands that." },
];

const KNOWN_BREEDS = ['american bully','beagle','border collie','boxer','cavalier','chihuahua','chow chow','dachshund','dalmatian','doberman','english bulldog','french bulldog','german shepherd','golden retriever','husky','indie','jack russell','labrador','lhasa apso','maltese','pomeranian','poodle','pug','rottweiler','shih tzu','yorkshire'];
function filterBreedProducts(products, petBreed) {
  const petLower=(petBreed||"").toLowerCase(); const petWords=petLower.split(/\s+/).filter(w=>w.length>2);
  return products.filter(p=>{const nm=(p.name||"").toLowerCase();for(const b of KNOWN_BREEDS){if(nm.includes(b)){if(!petLower)return false;if(nm.includes(petLower))return true;if(petWords.some(w=>b.includes(w)))return true;return false;}}return true;});
}

function SoulChip({ icon, label, value }) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(199,210,254,0.20)",border:"1px solid rgba(199,210,254,0.35)",borderRadius:9999,padding:"4px 12px",fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.90)"}}>{icon&&<span>{icon}</span>}{label&&<span style={{opacity:0.75}}>{label}:</span>}{value}</span>;
}

function FarewellProfile({ pet, token }) {
  const petName  = pet?.name||"your dog";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [answers,    setAnswers]    = useState({});
  const [saved,      setSaved]      = useState({});
  const [submitting, setSubmitting] = useState({});
  const [liveScore,  setLiveScore]  = useState(70);
  const remaining = FAREWELL_QUESTIONS.filter(q=>!saved[q.id]);
  const toggle = (qId,val) => setAnswers(p=>({...p,[qId]:[val]}));
  const save = async (q) => {
    const ans=answers[q.id]; if(!ans?.length)return;
    setSubmitting(p=>({...p,[q.id]:true}));
    try {
      const res=await fetch(`${API_URL}/api/pet-soul/profile/${pet?.id}/answer`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({question_id:q.id,answer:ans.map(a=>a.replace(/{name}/g,petName))})});
      if(res.ok){const d=await res.json();if(d.scores?.overall)setLiveScore(d.scores.overall);}
      setSaved(p=>({...p,[q.id]:true}));
    } catch { setSaved(p=>({...p,[q.id]:true})); }
    finally { setSubmitting(p=>({...p,[q.id]:false})); }
  };
  return (
    <>
      <div onClick={()=>setDrawerOpen(true)} data-testid="farewell-profile-bar"
        style={{background:"#fff",border:`2px solid ${G.pale}`,borderRadius:16,padding:"14px 18px",marginBottom:20,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 12px rgba(99,102,241,0.08)"}}>
        <div style={{width:40,height:40,borderRadius:10,flexShrink:0,fontSize:20,background:`linear-gradient(135deg,${G.pale},${G.light})`,display:"flex",alignItems:"center",justifyContent:"center"}}>🌷</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:700,color:G.darkText}}>{petName}'s Memory Profile</div>
          <div style={{fontSize:12,color:G.mutedText,marginTop:3}}>Tell Mira what matters most — she'll guide every step with care</div>
        </div>
        <span style={{fontSize:11,color:G.indigo,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>Mira's guidance →</span>
      </div>
      {drawerOpen && (
        <div onClick={()=>setDrawerOpen(false)} style={{position:"fixed",inset:0,zIndex:10002,background:"rgba(0,0,0,0.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"min(780px,100%)",maxHeight:"90vh",overflowY:"auto",borderRadius:24,background:"#fff",boxShadow:"0 24px 80px rgba(0,0,0,0.55)",display:"flex",flexDirection:"column"}}>
            <div style={{borderRadius:"24px 24px 0 0",padding:"24px 28px 20px",background:`linear-gradient(135deg,#0A0A1E 0%,${G.deep} 60%,${G.mid} 100%)`,flexShrink:0,position:"sticky",top:0,zIndex:2}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <p style={{fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:`${G.light}E6`,fontSize:10,marginBottom:5}}>🕊️ HONOUR {petName.toUpperCase()}'S MEMORY</p>
                  <p style={{color:"rgba(255,255,255,0.50)",fontSize:12}}>Tell Mira what matters most — she'll guide you with love and care</p>
                </div>
                <div style={{display:"flex",alignItems:"flex-end",gap:2}}>
                  <span style={{fontSize:72,fontWeight:900,lineHeight:1,color:G.light}}>{liveScore}</span>
                  <span style={{color:"rgba(255,255,255,0.40)",fontSize:18,marginBottom:8}}>%</span>
                </div>
              </div>
              <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,0.10)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${liveScore}%`,borderRadius:5,background:`linear-gradient(90deg,${G.indigo},${G.light})`,transition:"width 0.9s ease-out"}}/>
              </div>
              <button onClick={()=>setDrawerOpen(false)} style={{position:"absolute",top:16,right:20,background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",color:"rgba(255,255,255,0.70)"}}>✕</button>
            </div>
            <div style={{padding:"24px 28px",background:"#fff"}}>
              <p style={{fontSize:14,color:G.mutedText,fontStyle:"italic",marginBottom:20,lineHeight:1.7,textAlign:"center"}}>
                "There are no right answers here — only your answers. Whatever feels true for you and for {petName} is exactly right."
              </p>
              {remaining.length===0
                ? <div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:28,marginBottom:10}}>🌷</div><p style={{fontSize:14,fontWeight:700,color:G.darkText}}>Mira has everything she needs to guide you.</p></div>
                : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(320px,100%),1fr))",gap:14}}>
                    {remaining.slice(0,6).map(q=>{
                      const qAns=answers[q.id]||[],isSaved=saved[q.id],isSend=submitting[q.id],hasAns=qAns.length>0,label=q.question.replace(/{name}/g,petName);
                      if(isSaved)return<div key={q.id} style={{borderRadius:14,padding:16,background:G.pale,border:`2px solid ${G.light}60`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,minHeight:100}}><Check size={18} style={{color:G.indigo}}/><p style={{fontWeight:700,color:G.indigo,fontSize:13,textAlign:"center"}}>Mira will remember this ♥</p></div>;
                      return<div key={q.id} style={{borderRadius:14,padding:"14px 16px 12px",background:"#fff",border:`1.5px solid ${G.borderLight}`}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:10,fontWeight:600,color:G.mutedText}}>{q.chapter}</span><span style={{borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,background:G.pale,color:G.indigo}}>+{q.pts} pts</span></div>
                        <p style={{fontWeight:700,fontSize:13,color:G.darkText,marginBottom:10,lineHeight:1.4}}>{label}</p>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{q.options.map(opt=>{const sel=qAns[0]===opt;return<button key={opt} onClick={e=>{e.stopPropagation();e.preventDefault();toggle(q.id,opt);}} style={{borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:sel?700:400,cursor:"pointer",background:sel?G.pale:"#F5F5F5",border:sel?`1.5px solid ${G.indigo}`:"1px solid #E0E0E0",color:sel?G.indigo:"#555",transition:"all 0.12s"}}>{opt.replace(/{name}/g,petName)}</button>;})}</div>
                        <button onClick={e=>{e.stopPropagation();e.preventDefault();save(q);}} disabled={isSend||!hasAns} style={{width:"100%",borderRadius:10,padding:"9px",fontSize:12,fontWeight:700,color:"#fff",border:"none",cursor:!hasAns?"not-allowed":"pointer",background:!hasAns?`${G.indigo}44`:`linear-gradient(135deg,${G.indigo},${G.mid})`,opacity:isSend?0.7:1}}>{isSend?"Saving…":`Save +${q.pts} pts`}</button>
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

function MiraPicksSection({ pet }) {
  const [picks, setPicks]               = useState([]);
  const [picksLoading, setPicksLoading] = useState(true);
  const [selPick, setSelPick]           = useState(null);
  const { token } = useAuth();
  const petName = pet?.name||"your dog"; const breed = (pet?.breed||"").split("(")[0].trim();
  const { note, orderCount, topInterest } = useMiraIntelligence(pet?.id, token);
  const subtitle = getMiraIntelligenceSubtitle(petName, note, orderCount, topInterest);
  const imagines = [
    {id:"f-1",emoji:"🐾",name:`${petName}'s Paw Print Kit`,description:`Air-dry clay + ink pad — a permanent impression of ${breed||petName}'s paw to keep always.`},
    {id:"f-2",emoji:"📖",name:breed?`${breed} Rainbow Bridge Journal`:`${petName}'s Memory Journal`,description:`A guided grief journal — ${petName}'s story in your words, kept forever.`},
    {id:"f-3",emoji:"🌿",name:`${petName}'s Living Memorial`,description:`Biodegradable urn that grows into a tree or flowers — ${breed||petName} lives on.`},
  ];
  useEffect(()=>{
    if(!pet?.id){setPicksLoading(false);return;}
    fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=farewell&limit=12&min_score=60`)
      .then(r=>r.ok?r.json():null).then(d=>{
        const filtered=filterBreedProducts(d?.picks||[],pet?.breed);
        if(filtered.length)setPicks(filtered.slice(0,12));setPicksLoading(false);
      }).catch(()=>setPicksLoading(false));
  },[pet?.id,pet?.breed]);
  return (
    <section style={{marginBottom:28}}>
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}>
        <h3 style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:G.darkText,margin:0,fontFamily:"Georgia,serif"}}>Mira's Picks for <span style={{color:G.indigo}}>{petName}</span></h3>
        <span style={{fontSize:11,background:`linear-gradient(135deg,${G.indigo},${G.mid})`,color:"#fff",borderRadius:20,padding:"2px 10px",fontWeight:700}}>{picks.length>0?"AI Scored":"With Love"}</span>
      </div>
      <p style={{fontSize:13,color:"#888",marginBottom:16,lineHeight:1.5}}>{subtitle}</p>
      {!picksLoading&&picks.length===0&&<div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none"}}>{imagines.map(item=><MiraImaginesCard key={item.id} item={item} pet={pet} token={token} pillar="farewell"/>)}</div>}
      {picksLoading&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",color:G.mutedText}}><Loader2 size={14} style={{animation:"spin 1s linear infinite",color:G.indigo}}/><span style={{fontSize:12}}>Mira is preparing memorial picks for {petName}…</span></div>}
      {!picksLoading&&picks.length>0&&(<div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:10,scrollbarWidth:"thin"}}>{picks.map((pick,i)=>{const score=pick.mira_score||0;const col=score>=80?"#16A34A":score>=70?G.indigo:"#6B7280";const img=[pick.image_url,pick.image].find(u=>u&&u.startsWith("http"))||null;return<div key={i} style={{flexShrink:0,width:168,background:"#fff",borderRadius:14,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",cursor:"pointer"}} onClick={()=>setSelPick(pick)} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}><div style={{width:"100%",height:130,background:G.cream,overflow:"hidden",position:"relative"}}>{img?<img src={img} alt={pick.name||""} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${G.deep},${G.indigo})`,color:"#fff",fontSize:12,fontWeight:700,padding:8,textAlign:"center"}}>{(pick.name||"").slice(0,18)}</div>}</div><div style={{padding:"10px 11px 12px"}}><div style={{fontSize:12,fontWeight:700,color:G.darkText,lineHeight:1.3,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{pick.name||"—"}</div><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{flex:1,height:4,background:G.pale,borderRadius:4,overflow:"hidden"}}><div style={{width:`${score}%`,height:"100%",background:col,borderRadius:4}}/></div><span style={{fontSize:10,fontWeight:800,color:col,minWidth:26}}>{score}</span></div></div></div>;})})</div>)}
      {selPick&&<ProductDetailModal product={selPick} pillar="farewell" selectedPet={pet} onClose={()=>setSelPick(null)}/>}
    </section>
  );
}

function FarewellConciergeModal({ isOpen, onClose, petName, petId, token, preSelected }) {
  const [sel,setSel]=useState(""); const [notes,setNotes]=useState(""); const [sending,setSending]=useState(false); const [sent,setSent]=useState(false);
  useEffect(()=>{
    if(isOpen){
      setSent(false);setNotes("");
      // Pre-select from service name if provided
      if(preSelected) {
        const map = {
          "End-of-Life Care Planning":"End-of-life care guidance",
          "Euthanasia Support & Guidance":"Saying goodbye — when and how",
          "Cremation Arrangement":"Cremation arrangement",
          "Memorial Product Creation":"Memorial creation",
          "Rainbow Bridge Ceremony":"Ceremony planning",
          "Grief Counselling Referral":"Grief support referral",
        };
        setSel(map[preSelected]||"");
      } else { setSel(""); }
    }
  }, [isOpen, preSelected]);
  if(!isOpen)return null;
  const send=async()=>{if(!sel||sending)return;setSending(true);tdc.request({text:`Farewell guidance: ${sel}`,pillar:"farewell",pet:{id:petId,name:petName},channel:"farewell_concierge_modal"});try{const u=JSON.parse(localStorage.getItem("user")||"{}");await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({parent_id:u?.id||u?.email||"guest",pet_id:petId||"unknown",pillar:"farewell",intent_primary:"farewell_guidance",channel:"farewell_concierge_modal",initial_message:{sender:"parent",text:`Farewell guidance needed for ${petName}: ${sel}. ${notes?"Notes: "+notes:""}`}})});}catch{}setSending(false);setSent(true);};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.50)",zIndex:10006,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:32,maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto",position:"relative"}}>
        {sent?(<div style={{textAlign:"center",padding:"16px 0"}}><div style={{fontSize:40,marginBottom:16}}>🌷</div><h3 style={{fontSize:18,fontWeight:800,color:G.darkText,marginBottom:10}}>Mira will reach you gently</h3><p style={{fontSize:14,color:G.mutedText,marginBottom:24,lineHeight:1.7}}>Our team will contact you within 48 hours — with care and no rush.</p><button onClick={onClose} style={{background:G.indigo,color:"#fff",border:"none",borderRadius:12,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button></div>):(
          <>
            <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:18}}>✕</button>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:G.pale,border:`1px solid ${G.border}`,borderRadius:9999,padding:"4px 14px",marginBottom:20}}><span style={{fontSize:11,fontWeight:600,color:G.indigo,letterSpacing:"0.06em",textTransform:"uppercase"}}>🌷 {petName}'s Farewell Concierge</span></div>
            <h2 style={{fontSize:22,fontWeight:800,color:G.darkText,fontFamily:"Georgia,serif",lineHeight:1.2,marginBottom:8}}>How can Mira help you honour <span style={{color:G.indigo}}>{petName}</span>?</h2>
            <p style={{fontSize:14,color:"#888",marginBottom:8,lineHeight:1.7}}>Take your time. We're here whenever you're ready.</p>
            <p style={{fontSize:12,color:G.mutedText,fontStyle:"italic",marginBottom:20,lineHeight:1.6}}>"You don't have to figure this out alone. I'm here." — Mira</p>
            <p style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:12}}>What would help most right now?</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
              {["End-of-life care guidance","Saying goodbye — when and how","Cremation arrangement","Memorial creation","Ceremony planning","Grief support referral","Legacy photography","Just — someone who understands"].map(opt=><button key={opt} onClick={()=>setSel(opt)} style={{borderRadius:9999,padding:"8px 16px",fontSize:13,cursor:"pointer",background:sel===opt?G.pale:"#fff",border:`1.5px solid ${sel===opt?G.indigo:"rgba(99,102,241,0.25)"}`,color:sel===opt?G.indigo:"#555"}}>{opt}</button>)}
            </div>
            <textarea placeholder={`Anything you'd like Mira to know about ${petName}… (optional)`} value={notes} onChange={e=>setNotes(e.target.value)} style={{width:"100%",border:`1.5px solid ${G.border}`,borderRadius:12,padding:"12px 14px",fontSize:13,outline:"none",resize:"none",minHeight:80,marginBottom:24,boxSizing:"border-box"}}/>
            <button onClick={send} disabled={!sel||sending} style={{width:"100%",background:!sel?`${G.indigo}44`:`linear-gradient(135deg,${G.indigo},${G.mid})`,color:!sel?"#999":"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:800,cursor:!sel?"not-allowed":"pointer"}}>{sending?"Sending…":`🌷 Reach out to Mira`}</button>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingState(){return<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{width:48,height:48,borderRadius:"50%",background:MIRA_ORB,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff"}}>✦</div><div style={{fontSize:16,color:G.darkText,fontWeight:600}}>Preparing your farewell space…</div></div>;}

const FarewellSoulPage = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  const pet = currentPet; // alias for sub-components


  // ── Universal visit tracking ──────────────────────────────────
  usePlatformTracking({ pillar: "farewell", pet: currentPet });

  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState("farewell");
  const [prodTab,  setProdTab]  = useState("Memorial & Legacy");
  const [petData,  setPetData]  = useState(null);
  const [apiProducts, setApiProducts] = useState({});
  const [breedProds,  setBreedProds]  = useState([]);
  const [services, setServices]       = useState([]);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [conciergeSvc,  setConciergeSvc]  = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastSvc, setToastSvc] = useState("");
  useEffect(()=>{ if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]); if(contextPets!==undefined)setLoading(false); },[contextPets,currentPet,setCurrentPet]);
  useEffect(()=>{ if(currentPet){ const n={...currentPet,photo_url:currentPet.photo_url||currentPet.avatar_url||null,avatar:currentPet.avatar||"🐕",breed:currentPet.breed||""}; setPetData(n); } },[currentPet]);
  useEffect(()=>{
    fetch(`${API_URL}/api/admin/pillar-products?pillar=farewell&limit=100`).then(r=>r.ok?r.json():null).then(d=>{
      const grouped={};(d?.products||[]).forEach(p=>{const c=p.category||"";if(!grouped[c])grouped[c]={};const s=p.sub_category||"";if(!grouped[c][s])grouped[c][s]=[];grouped[c][s].push(p);});setApiProducts(grouped);
    }).catch(()=>{});
    fetch(`${API_URL}/api/service-box/services?pillar=farewell`).then(r=>r.ok?r.json():null).then(d=>{if(d?.services)setServices(d.services);}).catch(()=>{});
  },[]);

  // Fetch breed-specific farewell products from breed_products collection
  useEffect(()=>{
    if(!petData?.breed) return;
    const breedKey = encodeURIComponent(petData.breed.split("(")[0].trim().toLowerCase());
    fetch(`${API_URL}/api/admin/breed-products?breed=${breedKey}&is_active=true&limit=50`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        const prods = (d?.products||[]).filter(p=>{
          const b = (p.breed||"").toLowerCase();
          if (b === "all" || b === "") return false;
          // Only proper mockups (breed- prefix filename)
          const fname = (p.cloudinary_url||p.mockup_url||"").split("/").pop();
          return fname.startsWith("breed-");
        }).map(p=>({
          ...p,
          id: p.id||p._id,
          name: p.name||p.product_type||"Soul Made Item",
          image_url: p.cloudinary_url||p.mockup_url||p.image_url||"",
          price: p.price||0,
          pillar: "farewell",
          category: "Memorial & Legacy",
        }));
        setBreedProds(prods);
      }).catch(()=>{});
  },[petData?.breed]);

  const petName = petData?.name || "your dog";
  const breed   = petData?.breed||"";

  if(loading) return <PillarPageLayout pillar="farewell" hideHero hideNavigation><LoadingState/></PillarPageLayout>;

  return (
    <>
    <PillarPageLayout pillar="farewell" hideHero hideNavigation>
      <Helmet><title>Farewell · {petName} · The Doggy Company</title></Helmet>

      {/* HERO — gentle, sacred */}
      <div style={{background:`linear-gradient(160deg,${G.deep} 0%,${G.mid} 55%,#3730A3 100%)`,padding:"28px 20px 0",position:"relative",overflow:"hidden",textAlign:"center",boxSizing:"border-box",width:"100%"}}>
        <div style={{position:"absolute",top:20,right:20,width:44,height:44,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 0 24px rgba(99,102,241,0.50)"}}>✦</div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:12}}>
          <div style={{width:80,height:80,borderRadius:"50%",overflow:"hidden",border:"3px solid rgba(255,255,255,0.30)",boxShadow:"0 0 0 3px rgba(99,102,241,0.40)",background:`linear-gradient(135deg,${G.light},${G.indigo})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,color:"#fff"}}>
            {(petData?.photo_url)?<img src={petData.photo_url} alt={petName} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="eager" onError={e=>{e.target.style.display="none";}}/>:<span>{petData?.avatar||"🐕"}</span>}
          </div>
          <div style={{marginTop:-8,background:`linear-gradient(135deg,${G.deep},${G.indigo})`,borderRadius:20,padding:"3px 10px",fontSize:9,fontWeight:700,color:"#fff",border:"1.5px solid rgba(255,255,255,0.25)"}}>Always loved</div>
        </div>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(199,210,254,0.18)",borderRadius:20,padding:"4px 14px",marginBottom:14}}>
          <span style={{fontSize:11,color:G.light,fontWeight:700}}>🌷 Farewell & Legacy · {petName}</span>
        </div>
        <h1 style={{fontSize:"clamp(1.875rem,4vw,2.5rem)",fontWeight:900,color:"#fff",marginBottom:8,lineHeight:1.15,fontFamily:"Georgia,'Times New Roman',serif"}}>
          The love lives on,<br/><span style={{color:G.light}}>always</span>
        </h1>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.72)",marginBottom:14,maxWidth:480,margin:"0 auto 14px",lineHeight:1.8}}>End-of-life care, farewell ceremonies, memorials and grief support — for you and for {petName}.</p>
        <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,marginBottom:16}}>
          {breed&&<SoulChip icon="🐾" label="Breed" value={breed}/>}
          <SoulChip value="🌷 Forever loved"/>
          <SoulChip value="🕊️ Gentle guidance"/>
        </div>
        <div style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 18px",maxWidth:480,margin:"0 auto 16px",textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",flexShrink:0}}>✦</div>
            <div>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.85)",fontStyle:"italic",lineHeight:1.7,margin:0}}>"They are gone from your sight — but never from your heart. I'll help you honour {petName} in every way that feels right."</p>
              <span style={{fontSize:11,color:G.light,fontWeight:600}}>♥ Mira, always with you</span>
            </div>
          </div>
        </div>
        <div style={{textAlign:"center",paddingBottom:6}}><ChevronDown size={22} style={{color:"rgba(255,255,255,0.35)"}}/></div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8" style={{background:G.pageBg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",overflowX:"hidden",boxSizing:"border-box"}}>
        {/* Soul Profile bar */}
        <div style={{ paddingTop: 16 }}>
          <PillarSoulProfile pet={petData} token={token} pillar="farewell" />
        </div>
        {/* Tab bar */}
        <div style={{display:"flex",background:"#fff",borderBottom:`1.5px solid ${G.borderLight}`,marginBottom:24}}>
          {[{id:"farewell",label:"🌷 Legacy & Memorial"},{id:"services",label:"💙 Get Support"},{id:"find",label:"📍 Find Care"}].map(tab=>{const a=activeTab===tab.id;return<button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{flex:1,padding:"14px 4px",background:"none",border:"none",borderBottom:a?`3px solid ${G.indigo}`:"3px solid transparent",color:a?G.indigo:"#888",fontSize:13,fontWeight:a?700:500,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>{tab.label}</button>;})}
        </div>

        {/* Legacy & Memorial tab */}
        {activeTab==="farewell" && (
          <>
            <div style={{marginBottom:20}}><FarewellProfile pet={petData} token={token}/></div>
            <MiraPicksSection pet={petData}/>

            <GuidedFarewellPaths pet={petData}/>

            {/* Products — tab layout, breed-filtered */}
            <section style={{paddingBottom:16}}>
              <h2 style={{fontSize:"clamp(1.25rem,3vw,1.5rem)",fontWeight:800,color:G.darkText,marginBottom:6,fontFamily:"Georgia,serif"}}>Honour <span style={{color:G.indigo}}>{petName}</span>'s memory</h2>
              <p style={{fontSize:14,color:"#888",lineHeight:1.6,marginBottom:16}}>Every product here was chosen with love — {breed||petName}'s story deserves to be kept beautifully.</p>
            </section>

            {/* Product category tabs */}
            {(() => {
              const FAREWELL_TABS = [
                { id:"Memorial & Legacy",   label:"🌷 Memorial",   icon:"🌷" },
                { id:"Grief & Healing",     label:"💙 Grief",      icon:"💙" },
                { id:"Cremation & Burial",  label:"🌿 Cremation",  icon:"🌿" },
              ];

              // Flatten all farewell products with breed filter
              const allProds = filterBreedProducts(
                Object.values(apiProducts).flatMap(sub => Object.values(sub).flat()),
                petData?.breed
              );

              const tabProds = prodTab === "breed"
                ? breedProds.slice(0, 12)
                : allProds.filter(p => (p.category||"") === prodTab).slice(0, 12);

              return (
                <>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                    {FAREWELL_TABS.map(tab=>(
                      <button key={tab.id} onClick={()=>setProdTab(tab.id)}
                        style={{display:"flex",alignItems:"center",gap:5,padding:"8px 16px",borderRadius:9999,border:`1.5px solid ${prodTab===tab.id?G.indigo:G.border}`,background:prodTab===tab.id?G.indigo:"#fff",color:prodTab===tab.id?"#fff":G.mutedText,fontSize:12,fontWeight:prodTab===tab.id?700:400,cursor:"pointer",transition:"all 0.15s"}}>
                        <span>{tab.icon}</span>{tab.label.split(" ").slice(1).join(" ")||tab.label}
                      </button>
                    ))}
                  </div>

                  {tabProds.length === 0 ? (
                    <div style={{textAlign:"center",padding:"32px 0",color:"#888"}}>
                      <div style={{fontSize:32,marginBottom:10}}>🌷</div>
                      <p style={{fontWeight:600,marginBottom:8}}>
                        {prodTab==="breed"
                          ? `${breed||petName}-specific farewell pieces being created`
                          : "Memorial products being curated with love"}
                      </p>
                      <p style={{fontSize:13,marginBottom:16}}>
                        {prodTab==="breed"
                          ? `We're designing farewell keepsakes just for ${breed||petName}s.`
                          : `Mira is sourcing ${breed||petName}-specific items for this category.`}
                      </p>
                      <button onClick={()=>setConciergeOpen(true)} style={{background:`linear-gradient(135deg,${G.indigo},${G.mid})`,color:"#fff",border:"none",borderRadius:20,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Ask Mira for guidance →</button>
                    </div>
                  ) : (
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(180px,100%),1fr))",gap:12,marginBottom:28}}>
                      {tabProds.map(p=>(
                        <SharedProductCard key={p.id||p._id} product={p} pillar="farewell" selectedPet={petData}/>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* Get Support tab */}
        {activeTab==="services" && (
          <div style={{marginTop:24}}>
            <h2 style={{fontSize:"clamp(1.25rem,3vw,1.5rem)",fontWeight:800,color:G.darkText,marginBottom:4,fontFamily:"Georgia,serif"}}>Support for <span style={{color:G.indigo}}>{petName}</span>'s family</h2>
            <p style={{fontSize:13,color:"#888",marginBottom:20}}>All services arranged with gentleness — no rush, no pressure.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(240px,100%),1fr))",gap:14}}>
              {FAREWELL_SERVICES.map(svc=>{
                const dbSvc = services.find(s=>s.name===svc.name||s.id===svc.id)||{};
                const img = dbSvc.watercolor_image||dbSvc.image_url||null;
                return(<div key={svc.id}
                  onClick={()=>{
                    tdc.track("farewell", { service: svc.name, text: svc.name, pillar: "farewell", pet: petData, channel: "farewell_pillar", urgency: "high", amount: svc.price });
                    setConciergeSvc(svc.name); setConciergeOpen(true);
                  }}
                  style={{background:"#fff",borderRadius:16,border:`2px solid rgba(99,102,241,0.12)`,overflow:"hidden",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px ${svc.accentColor}20`;}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
                <div style={{height:120,background:`linear-gradient(135deg,${G.pale},${G.cream})`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
                  {img
                    ? <img src={img} alt={svc.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
                    : <span style={{fontSize:38}}>{svc.icon}</span>}
                </div>
                <div style={{padding:"14px 16px 16px"}}>
                  <div style={{fontSize:11,color:G.mutedText,marginBottom:3}}>{svc.tagline}</div>
                  <div style={{fontSize:14,fontWeight:800,color:G.darkText,marginBottom:3}}>{svc.name}</div>
                  <div style={{fontSize:11,color:"#888",lineHeight:1.45,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{t(svc.desc,petName)}</div>
                  <div style={{background:G.pale,border:`1px solid ${G.border}`,borderRadius:8,padding:"6px 10px",marginBottom:8}}><span style={{fontSize:10,color:G.indigo}}>✦ </span><span style={{fontSize:10,color:G.mid,lineHeight:1.4}}>{t(svc.miraKnows,petName)}</span></div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:14,fontWeight:800,color:G.deep}}>{svc.price}</span>
                    <button onClick={()=>{
                      tdc.track("farewell", { service: svc.name, text: svc.name, pillar: "farewell", pet: petData, channel: "farewell_pillar", amount: svc.price });
                      setConciergeSvc(svc.name);setConciergeOpen(true);
                    }}
                    style={{background:`linear-gradient(135deg,${svc.accentColor},${G.mid})`,color:"#fff",border:"none",borderRadius:20,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Reach out →</button>
                  </div>
                </div>
              </div>);})}
            </div>
          </div>
        )}

        {/* Find Care tab */}
        {activeTab==="find" && (
          <div style={{marginTop:8}}>
            <FarewellNearMe pet={petData} onBook={(svc)=>setConciergeOpen(true)}/>
          </div>
        )}
      </div>

      {/* Soul Farewell — Breed-specific memorial products (rendered via breed tab above) */}

      <ConciergeToast toast={toastVisible?{name:toastSvc,pillar:"farewell"}:null} onClose={()=>setToastVisible(false)}/>
      <FarewellConciergeModal isOpen={conciergeOpen} onClose={()=>setConciergeOpen(false)} petName={petName} petId={petData?.id} token={token} preSelected={conciergeSvc}/>
    </PillarPageLayout>
    </>
  );
};

export default FarewellSoulPage;
