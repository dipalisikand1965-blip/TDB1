/**
 * PaperworkSoulPage.jsx — /paperwork pillar
 * The Doggy Company
 *
 * MERGED: Paperwork + Advisory into one pillar
 * Colour world: Deep Slate #1E293B + Teal #0D9488
 * Replaces both /paperwork and /advisory pages.
 *
 * WIRING:
 *   1. Route:    <Route path="/paperwork" element={<PaperworkSoulPage/>}/>
 *   2. Products: GET /api/admin/pillar-products?pillar=paperwork&category=...
 *   3. Docs:     GET /api/documents/completeness/{petId}
 *   4. Upload:   POST /api/documents/upload
 *   5. Booking:  POST /api/service_desk/attach_or_create_ticket
 *
 * 7 Dims: Identity & Safety · Health Records · Travel Documents
 *         Insurance & Finance · Breed & Care Guides · Expert Advisory · Soul Documents
 * 3 tabs per dim: Products | Services | Advisory
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import SharedProductCard, { ProductDetailModal } from "../components/ProductCard";
import SoulMadeCollection from "../components/SoulMadeCollection";
import PersonalisedBreedSection from "../components/common/PersonalisedBreedSection";
import ConciergeToast from "../components/common/ConciergeToast";
import GuidedPaperworkPaths from "../components/paperwork/GuidedPaperworkPaths";
import { API_URL } from "../utils/api";

// ─── COLOUR SYSTEM ─────────────────────────────────────────
const G = {
  deep:        "#1E293B",
  mid:         "#334155",
  teal:        "#0D9488",
  light:       "#99F6E4",
  pale:        "#F0FDFA",
  cream:       "#F8FAFC",
  pageBg:      "#F8FAFC",
  darkText:    "#1E293B",
  mutedText:   "#475569",
  hintText:    "#0D9488",
  border:      "rgba(13,148,136,0.18)",
  borderLight: "rgba(13,148,136,0.10)",
  greenBorder: "rgba(13,148,136,0.28)",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ─── HELPERS ───────────────────────────────────────────────
function t(str, name) { return str ? str.replace(/{name}/g, name||"your dog") : ""; }
function getAge(pet)   { return parseInt(pet?.doggy_soul_answers?.age_years||"0")||0; }
function isSenior(pet) { return getAge(pet)>=7; }
function isPuppy(pet)  { return getAge(pet)<=1; }
function isMultiPet(p) { return !!(p?.doggy_soul_answers?.other_pets||p?.siblings?.length); }
function isRescue(p)   { return !!(p?.doggy_soul_answers?.is_rescue||(""+p?.origin).toLowerCase().includes("rescue")); }

// ─── DOCUMENT COMPLETENESS SCORE ───────────────────────────
function getDocScore(pet) {
  // Until API wired — estimate from soul profile data
  let score = 0;
  if (pet?.vaccinated)                         score += 15;
  if (pet?.doggy_soul_answers?.microchipped)   score += 20;
  if (pet?.doggy_soul_answers?.insurance)      score += 15;
  if (pet?.doggy_soul_answers?.registered)     score += 15;
  if (pet?.doggy_soul_answers?.travel_docs)    score += 10;
  if (pet?.emergency_contact)                  score += 10;
  if (pet?.health?.medical_conditions)         score += 15;
  return score;
}

function getMissingDocs(pet) {
  const missing = [];
  if (!pet?.vaccinated)                           missing.push("Vaccination records");
  if (!pet?.doggy_soul_answers?.microchipped)     missing.push("Microchip registration");
  if (!pet?.doggy_soul_answers?.insurance)        missing.push("Pet insurance");
  if (!pet?.doggy_soul_answers?.registered)       missing.push("Society/municipal registration");
  return missing;
}

// ─── DIM CONFIG ────────────────────────────────────────────
function getPaperworkDims(pet) {
  const senior  = isSenior(pet);
  const puppy   = isPuppy(pet);
  const multi   = isMultiPet(pet);
  const rescue  = isRescue(pet);
  const breed   = pet?.breed||pet?.doggy_soul_answers?.breed||null;
  const missing = getMissingDocs(pet);

  return [
    {
      id:"identity", icon:"🪪", label:"Identity & Safety",
      sub: missing.includes("Microchip registration") ? "Microchip not registered yet" : "Registration, ID & emergency info",
      badge: missing.includes("Microchip registration") ? "Action needed" : "Protected",
      badgeBg: missing.includes("Microchip registration") ? "#C62828" : G.teal,
      glow: missing.includes("Microchip registration"), glowColor:"rgba(13,148,136,0.30)",
      mira: missing.includes("Microchip registration")
        ? `{name}'s microchip isn't registered yet — this is the most important step. I've flagged what to do first.`
        : `{name}'s identity and safety documents look good. I've curated the essentials for complete protection.`,
    },
    {
      id:"health", icon:"🏥", label:"Health Records",
      sub: pet?.vaccinated ? "Vaccination records on file" : "Vaccination records needed",
      badge: pet?.vaccinated ? "Up to date" : "Needs attention",
      badgeBg: pet?.vaccinated ? G.teal : "#E65100",
      glow: !pet?.vaccinated, glowColor:"rgba(13,148,136,0.28)",
      mira: pet?.vaccinated
        ? `{name}'s vaccination records are in order. I'll remind you when boosters are due.`
        : `{name}'s vaccination records need to be uploaded. This is critical for boarding, travel and kennel entry.`,
    },
    {
      id:"travel", icon:"✈️", label:"Travel Documents",
      sub: breed ? `${breed} travel — passport & health cert` : "Pet passport & international health cert",
      badge: "Travel ready", badgeBg: G.mid,
      glow: false, glowColor:"rgba(13,148,136,0.20)",
      mira:`Planning to travel with {name}? I've organised everything — passport, health cert, airline checklist — for any destination.`,
    },
    {
      id:"insurance", icon:"🛡️", label:"Insurance & Financial",
      sub: missing.includes("Pet insurance") ? "No pet insurance on file" : "Policy + claims + budget",
      badge: missing.includes("Pet insurance") ? "Not covered" : "Covered",
      badgeBg: missing.includes("Pet insurance") ? "#C62828" : G.teal,
      glow: missing.includes("Pet insurance"), glowColor:"rgba(13,148,136,0.25)",
      mira: missing.includes("Pet insurance")
        ? `{name} doesn't have pet insurance yet. I'll help you compare, choose, and set up the right policy.`
        : `{name}'s insurance is active. I track renewals and help with claims when you need it.`,
    },
    {
      id:"breeds", icon:"📚", label:"Breed & Care Guides",
      sub: breed ? `${breed} — breed guide + care tips` : "Breed-specific care, training & health",
      badge:"Know your breed", badgeBg: G.mid,
      glow: true, glowColor:"rgba(13,148,136,0.22)",
      mira: breed
        ? `I've curated everything specific to ${breed}s — care guide, training approach, common health risks to watch for.`
        : `Every breed is different. Understanding {name}'s breed unlocks better care decisions at every stage.`,
    },
    {
      id:"advisory", icon:"💡", label:"Expert Advisory",
      sub: multi ? "Multi-pet household guidance" : puppy ? "New puppy planning" : "Life planning & expert guidance",
      badge: multi ? "Multi-pet" : puppy ? "New puppy" : "Life advice",
      badgeBg: multi ? "#7C3AED" : puppy ? G.teal : G.mid,
      glow: true, glowColor:"rgba(13,148,136,0.25)",
      mira: multi
        ? `Managing multiple pets takes planning. I've built guidance specific to {name}'s household.`
        : puppy
        ? `{name} is a puppy — I've put together everything a new parent needs in one place.`
        : `Expert guidance on pet life planning, housing rules, behaviour, and every stage of {name}'s life.`,
    },
    {
      id:"soul", icon:"🌟", label:"Soul Documents",
      sub: breed ? `${breed} passport holder — made for {name}` : "Breed passport holder",
      badge:"Made for you", badgeBg: G.teal,
      glow: true, glowColor:"rgba(13,148,136,0.22)",
      mira:`{name}'s breed-specific passport holder — carries the identity, soul profile, and story of this dog.`,
    },
  ];
}

const DIM_ID_TO_CATEGORY = {
  identity:  "Identity & Safety",
  health:    "Health Records",
  travel:    "Travel Documents",
  insurance: "Insurance & Finance",
  breeds:    "Breed & Advisory",
  advisory:  "Expert Advisory",
  soul:      "Soul Documents",
  bundles:   "bundles",
};

// ─── PAPERWORK SERVICES ────────────────────────────────────
const PAPER_SERVICES = [
  { id:"registration",  icon:"🪪", name:"Pet Registration Guidance",  tagline:"Society + municipal registration", price:"₹500",   steps:2, dim:"identity",  accentColor:"#0D9488", desc:"Complete registration guidance for {petName} — society forms, municipal licensing, all paperwork handled.", miraKnows:"Registration protects {petName} legally and is required by most housing societies." },
  { id:"microchipping", icon:"🔬", name:"Microchipping Assistance",    tagline:"Permanent ID for life",            price:"₹300",   steps:2, dim:"identity",  accentColor:"#1E293B", desc:"Concierge arranges microchipping and registry — permanent ID for {petName} that can never be lost.", miraKnows:"Microchipping is the single most important thing for {petName}'s safety." },
  { id:"passport",      icon:"✈️", name:"Pet Passport Service",         tagline:"International travel ready",       price:"₹2,999", steps:3, dim:"travel",    accentColor:"#0D9488", desc:"Full pet passport service — vet coordination, health certificates, rabies titres, all documentation.", miraKnows:"International travel requires specific documents — requirements vary by country. Mira handles everything." },
  { id:"travel_docs",   icon:"📋", name:"Travel Documentation",         tagline:"Airline + country requirements",   price:"₹1,500", steps:2, dim:"travel",    accentColor:"#334155", desc:"All travel documents for {petName} — health certificate, airline approval, import permits where needed.", miraKnows:"Airlines have strict pet document requirements. Missing one can mean {petName} can't board." },
  { id:"insurance_rev", icon:"🛡️", name:"Pet Insurance Review",         tagline:"Free — find the right cover",      price:"Free",   steps:2, dim:"insurance", accentColor:"#0D9488", desc:"Mira compares pet insurance policies and finds the right cover for {petName}'s breed, age and health.", miraKnows:"Pet insurance is most affordable when started young. I'll find the right policy for {petName}." },
  { id:"claim_filing",  icon:"📝", name:"Claim Filing Assistance",      tagline:"Free — we file it for you",        price:"Free",   steps:2, dim:"insurance", accentColor:"#334155", desc:"Concierge handles the entire claim process — paperwork, follow-up, and settlement tracking.", miraKnows:"Claim rejections often happen due to incorrect paperwork. I handle this for {petName}'s family." },
  { id:"life_planning", icon:"💡", name:"Pet Life Planning",            tagline:"Free — plan {petName}'s life well", price:"Free",  steps:2, dim:"advisory",  accentColor:"#1E293B", desc:"A comprehensive life plan for {petName} — every stage from puppy to senior, all guidance in one session.", miraKnows:"Planning ahead for {petName} reduces stress and ensures nothing is missed." },
  { id:"puppy_prep",    icon:"🐶", name:"New Puppy Preparation",        tagline:"Everything for the first year",    price:"₹1,499", steps:3, dim:"advisory",  accentColor:"#0D9488", desc:"Complete first-year guide for {petName} — vet, food, training, grooming, socialisation, documents.", miraKnows:"The first year is the most important. I've built the complete roadmap for {petName}." },
];

// ─── BOOKING MODAL ─────────────────────────────────────────
function ServiceBookingModal({ service, pet, onClose }) {
  const [step,     setStep]     = useState(1);
  const [choice,   setChoice]   = useState("");
  const [schedule, setSchedule] = useState("");
  const [notes,    setNotes]    = useState("");
  const [sent,     setSent]     = useState(false);
  const petName = pet?.name||"your dog";
  const miraText = (service.miraKnows||"").replace(/{petName}/g,petName).replace(/{petname}/gi,petName);

  if (sent) return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(480px,100%)",background:"#fff",borderRadius:16,padding:"40px 32px",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${G.teal},${G.mid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 20px"}}>✦</div>
        <div style={{fontSize:20,fontWeight:700,color:G.darkText,fontFamily:"Georgia,serif",marginBottom:8}}>Request Sent to Concierge®</div>
        <div style={{fontSize:14,color:G.mutedText,lineHeight:1.7,marginBottom:24}}>Your {service.name.toLowerCase()} request for {petName} has been received. Our team will contact you within 2 hours.</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:G.pale,border:`1px solid ${G.border}`,borderRadius:20,padding:"6px 16px",fontSize:13,color:G.teal,fontWeight:600,marginBottom:20}}>📥 Added to your Inbox</div>
        <div><button onClick={onClose} style={{background:G.teal,color:"#fff",border:"none",borderRadius:12,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button></div>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(500px,100%)",maxHeight:"90vh",background:"#fff",borderRadius:16,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${service.accentColor},${service.accentColor}CC)`,padding:"18px 22px 14px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.20)",borderRadius:20,padding:"3px 10px",fontSize:11,color:"#fff",fontWeight:500}}>
              {service.icon} {service.name}
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.20)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#fff",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          <div style={{fontSize:18,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif",marginBottom:3}}>{service.name} for {petName}</div>
          <div style={{height:4,background:"rgba(255,255,255,0.25)",borderRadius:4,overflow:"hidden",marginBottom:5}}>
            <div style={{height:"100%",width:`${(step/service.steps)*100}%`,background:"#fff",borderRadius:4,transition:"width 0.3s"}}/>
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.70)"}}>Step {step} of {service.steps}</div>
        </div>

        {/* Body */}
        <div style={{padding:"18px 22px",overflowY:"auto",flex:1}}>
          {/* Pet badge */}
          <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:14,marginBottom:14,borderBottom:`0.5px solid ${G.pale}`}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:G.pale,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,overflow:"hidden",flexShrink:0}}>
              {(pet?.photo_url||pet?.avatar_url)
                ? <img src={pet.photo_url||pet.avatar_url} alt={petName} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <span>{pet?.avatar||"🐕"}</span>}
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:G.darkText}}>For {petName}</div>
              <div style={{fontSize:12,color:G.mutedText}}>{pet?.breed||""}</div>
            </div>
          </div>

          {/* Mira knows */}
          {miraText && (
            <div style={{background:G.pale,border:`1px solid ${G.border}`,borderRadius:10,padding:"10px 13px",display:"flex",alignItems:"flex-start",gap:8,marginBottom:16}}>
              <span style={{fontSize:14,flexShrink:0}}>ⓘ</span>
              <div style={{fontSize:12,color:G.mid,lineHeight:1.5}}><strong style={{color:G.darkText}}>Mira knows:</strong> {miraText}</div>
            </div>
          )}

          {/* Step 1 */}
          {step===1 && (
            <>
              <div style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:10}}>What do you need most?</div>
              {["Starting from scratch — guide me step by step","I have some documents — need help completing","Urgent — need this sorted as soon as possible","Just exploring options for now"].map(o=>(
                <div key={o} onClick={()=>setChoice(o)}
                  style={{background:choice===o?G.pale:"#fff",border:`1.5px solid ${choice===o?G.teal:G.border}`,borderRadius:10,padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7,cursor:"pointer",transition:"all 0.12s"}}>
                  <span style={{fontSize:13,color:G.darkText}}>{o}</span>
                  {choice===o && <span style={{color:G.teal,fontWeight:700}}>✓</span>}
                </div>
              ))}
            </>
          )}

          {/* Step 2 */}
          {step===2 && (
            <>
              <div style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:10}}>When works best?</div>
              {["Within 24 hours","This week","Next week","Flexible — Mira decides"].map(o=>(
                <div key={o} onClick={()=>setSchedule(o)}
                  style={{background:schedule===o?G.pale:"#fff",border:`1.5px solid ${schedule===o?G.teal:G.border}`,borderRadius:10,padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7,cursor:"pointer",transition:"all 0.12s"}}>
                  <span style={{fontSize:13,color:G.darkText}}>{o}</span>
                  {schedule===o && <span style={{color:G.teal,fontWeight:700}}>✓</span>}
                </div>
              ))}
            </>
          )}

          {/* Step 3 (if 3-step service) */}
          {step===3 && (
            <>
              <div style={{background:G.pale,borderRadius:12,padding:"16px",marginBottom:14}}>
                <div style={{fontSize:13,color:G.darkText,lineHeight:1.6}}>Our concierge will contact you within 2 hours to arrange {petName}'s {service.name}.</div>
                <div style={{fontSize:12,color:G.mutedText,marginTop:8}}>Need: {choice} · Schedule: {schedule} · Price: {service.price}</div>
              </div>
              <textarea placeholder={`Any notes for Mira? (optional)`} value={notes} onChange={e=>setNotes(e.target.value)}
                style={{width:"100%",border:`1.5px solid ${G.border}`,borderRadius:10,padding:"11px 14px",fontSize:13,color:G.darkText,outline:"none",resize:"none",minHeight:72,boxSizing:"border-box"}}/>
            </>
          )}
        </div>

        {/* Nav */}
        <div style={{padding:"0 22px 18px",flexShrink:0,borderTop:`0.5px solid ${G.pale}`}}>
          <div style={{display:"flex",gap:8,paddingTop:14}}>
            {step>1 && <button onClick={()=>setStep(s=>s-1)} style={{flex:1,background:"#fff",border:`1.5px solid ${G.border}`,borderRadius:10,padding:"11px",fontSize:13,fontWeight:600,color:G.mutedText,cursor:"pointer"}}>← Back</button>}
            <button onClick={()=>{ if(step<service.steps)setStep(s=>s+1); else setSent(true); }}
              disabled={step===1&&!choice || step===2&&!schedule}
              style={{flex:2,background:step===service.steps?`linear-gradient(135deg,${G.teal},${G.mid})`:`linear-gradient(135deg,${G.teal},${G.mid})`,color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer",opacity:(step===1&&!choice||step===2&&!schedule)?0.5:1}}>
              {step===service.steps?"✦ Send to Concierge®":"Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DOCUMENT COMPLETENESS BAR ──────────────────────────────
function DocCompletnessBar({ pet, docScore, onOpen }) {
  const petName = pet?.name||"your dog";
  const missing = getMissingDocs(pet);
  const label = docScore>=100 ? `${petName} is fully protected` :
                docScore>=70  ? `${petName} is mostly covered` :
                docScore>=40  ? `${petName} needs attention` :
                                `${petName}'s documents need work`;

  return (
    <div onClick={onOpen} style={{background:"#fff",border:`2px solid ${G.pale}`,borderRadius:16,padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}
      onMouseEnter={e=>e.currentTarget.style.background=G.pale}
      onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
      <div style={{width:40,height:40,borderRadius:10,background:G.pale,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📋</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:5}}>Document Safety Profile</div>
        <div style={{height:6,background:G.pale,borderRadius:4,overflow:"hidden",marginBottom:5}}>
          <div style={{height:"100%",width:`${docScore}%`,background:`linear-gradient(90deg,${G.teal},${G.light})`,borderRadius:4,transition:"width 0.4s"}}/>
        </div>
        <div style={{fontSize:11,color:G.mutedText}}>{label} · {docScore}% complete</div>
        {missing.length>0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:6}}>
            {missing.slice(0,2).map(m=>(
              <span key={m} style={{background:"#FFEBEE",border:"1px solid #FFCDD2",borderRadius:20,padding:"2px 8px",fontSize:10,color:"#C62828",fontWeight:500}}>⚠ {m}</span>
            ))}
            {missing.length>2 && <span style={{background:G.pale,border:`1px solid ${G.border}`,borderRadius:20,padding:"2px 8px",fontSize:10,color:G.teal,fontWeight:500}}>+{missing.length-2} more</span>}
          </div>
        )}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        <span style={{fontSize:12,color:G.teal,fontWeight:600}}>View & upload →</span>
      </div>
    </div>
  );
}

// ─── MIRA PICKS ────────────────────────────────────────────
function MiraPicksSection({ pet }) {
  const [picks,setpicks]=useState([]); const [loading,setLoading]=useState(true);
  const petName=pet?.name||"your dog";
  const miraImagines=[
    {emoji:"🪪",name:"ID Tag Set",desc:"Engraved + QR code",reason:"Because identity protection is first"},
    {emoji:"🛡️",name:"Insurance Review",desc:"Free — find the right cover",reason:"Because every dog deserves cover"},
    {emoji:"📚",name:"Breed Guide Report",desc:"12-page breed-specific report",reason:"Because knowing is protecting"},
    {emoji:"✈️",name:"Travel Document Kit",desc:"Passport + health cert + checklist",reason:"Because adventure needs preparation"},
  ];
  useEffect(()=>{
    if(!pet?.id){setLoading(false);return;}
    const breed=encodeURIComponent(pet?.breed?.toLowerCase().trim()||"");
    fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=paperwork&limit=12&min_score=60&entity_type=product&breed=${breed}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d?.picks?.length)setpicks(d.picks.slice(0,8));setLoading(false);})
      .catch(()=>setLoading(false));
  },[pet?.id]);

  const showImagines=!loading&&picks.length===0;
  return (
    <section style={{marginBottom:32}}>
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}>
        <h3 style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:G.darkText,margin:0,fontFamily:"Georgia,serif"}}>
          Mira's Safety Picks for <span style={{color:G.teal}}>{petName}</span>
        </h3>
        <span style={{fontSize:11,background:`linear-gradient(135deg,${G.teal},${G.mid})`,color:"#fff",borderRadius:20,padding:"2px 10px",fontWeight:700}}>AI Scored</span>
      </div>
      <p style={{fontSize:12,color:"#888",marginBottom:16}}>Products and services prioritised for {petName}'s protection and documentation needs.</p>
      {showImagines ? (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(180px,100%),1fr))",gap:14}}>
          {miraImagines.map((c,i)=>(
            <div key={i} style={{background:`linear-gradient(135deg,${G.deep},${G.mid})`,borderRadius:16,padding:"20px 16px 16px",position:"relative"}}>
              <div style={{position:"absolute",top:12,left:12,background:"rgba(255,255,255,0.18)",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#fff"}}>Mira Imagines</div>
              <div style={{fontSize:40,textAlign:"center",marginTop:20,marginBottom:10}}>{c.emoji}</div>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",textAlign:"center",marginBottom:4}}>{c.name}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.60)",textAlign:"center",marginBottom:3}}>{c.desc}</div>
              <div style={{fontSize:11,color:G.light,fontStyle:"italic",textAlign:"center",marginBottom:12}}>{c.reason}</div>
              <button style={{width:"100%",background:`linear-gradient(135deg,${G.teal},${G.mid})`,color:"#fff",border:"none",borderRadius:10,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Get this →</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:8}}>
          {picks.map((pick,i)=>{
            const score=pick.mira_score||0;
            const scoreColor=score>=80?"#16A34A":score>=70?G.teal:"#6B7280";
            return (
              <div key={i} style={{flexShrink:0,width:160,background:"#fff",borderRadius:14,border:`1.5px solid ${G.borderLight}`,overflow:"hidden"}}>
                <div style={{height:100,background:G.pale,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>📋</div>
                <div style={{padding:"9px 10px 11px"}}>
                  <div style={{fontSize:12,fontWeight:700,color:G.darkText,lineHeight:1.3,marginBottom:5}}>{pick.name||"—"}</div>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                    <div style={{flex:1,height:3,background:G.pale,borderRadius:3}}><div style={{width:`${score}%`,height:"100%",background:scoreColor,borderRadius:3}}/></div>
                    <span style={{fontSize:10,fontWeight:800,color:scoreColor}}>{score}</span>
                  </div>
                  {pick.mira_reason&&<p style={{fontSize:10,color:"#888",lineHeight:1.4,margin:0,fontStyle:"italic"}}>{pick.mira_reason}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── DIM EXPANDED ──────────────────────────────────────────
function DimExpanded({ dim, pet, onClose, apiProducts={}, services=[], onBook }) {
  const petName = pet?.name||"your dog";
  const miraCtx = { includeText:"Add" };
  const [dimTab,    setDimTab]    = useState("products");
  const [activeTab, setActiveTab] = useState("All");

  const catName = DIM_ID_TO_CATEGORY[dim.id]||"Identity & Safety";
  const catData = apiProducts[catName]||{};
  const allRaw  = Object.values(catData).flat().filter(p=>{
    const sub=(p.sub_category||"").toLowerCase();
    if (dim.id==="soul") return sub==="soul"||p.category?.includes("passport_holder");
    if (dim.id==="breeds") return sub==="breed_guides"||p.category?.includes("care_guide");
    return sub===dim.id||p.category===dim.id;
  });

  const subCats  = [...new Set(allRaw.map(p=>p.sub_category).filter(Boolean))];
  const products = activeTab==="All"?allRaw:allRaw.filter(p=>p.sub_category===activeTab);
  const dimSvcs  = PAPER_SERVICES.filter(s=>s.dim===dim.id);

  const tabs = [
    { id:"products",  label:"📦 Products" },
    { id:"services",  label:"📋 Services" },
    ...( dim.id!=="soul" ? [{ id:"advisory", label:"💡 Advisory" }] : [] ),
  ];

  return (
    <div style={{background:"#fff",border:`2px solid ${G.teal}`,borderTop:"none",borderRadius:"0 0 14px 14px",marginBottom:8}}>
      {/* Mira bar */}
      <div style={{display:"flex",alignItems:"flex-start",gap:8,background:G.pale,padding:"10px 16px",borderBottom:`1px solid ${G.pale}`}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0,marginTop:1}}>✦</div>
        <p style={{fontSize:12,color:G.darkText,fontStyle:"italic",margin:0,lineHeight:1.5,flex:1}}>"{t(dim.mira,petName)}"</p>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,color:"#BBB",cursor:"pointer",flexShrink:0,padding:"0 4px"}}>✕</button>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",borderBottom:"1px solid #F0F0F0"}}>
        {tabs.map(tab=>(
          <button key={tab.id} onClick={()=>setDimTab(tab.id)}
            style={{flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:dimTab===tab.id?`2.5px solid ${G.teal}`:"2.5px solid transparent",color:dimTab===tab.id?G.mid:"#888",fontSize:12,fontWeight:dimTab===tab.id?700:400,cursor:"pointer"}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products */}
      {dimTab==="products" && (
        <div style={{padding:"12px 16px 20px"}}>
          {subCats.length>0 && (
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {["All",...subCats].map(tab=>(
                <button key={tab} onClick={()=>setActiveTab(tab)}
                  style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${activeTab===tab?G.teal:G.border}`,background:activeTab===tab?G.teal:G.cream,fontSize:11,fontWeight:600,color:activeTab===tab?"#fff":G.mid,cursor:"pointer"}}>
                  {tab.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                </button>
              ))}
            </div>
          )}
          {products.length===0 ? (
            <div style={{textAlign:"center",padding:"28px 0",color:"#888",fontSize:13}}>
              <div style={{fontSize:28,marginBottom:8}}>📦</div>
              Products for {petName} in this category are being added — check back soon.
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(170px,100%),1fr))",gap:12}}>
              {products.map(p=>(
                <div key={p.id||p._id}><SharedProductCard product={p} pillar="paperwork" selectedPet={pet} miraContext={miraCtx}/></div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Services */}
      {dimTab==="services" && (
        <div style={{padding:"12px 16px 20px"}}>
          {dimSvcs.length===0 ? (
            <div style={{textAlign:"center",padding:"24px 0",color:"#888",fontSize:13}}>
              <button onClick={()=>onBook?.(PAPER_SERVICES[0])} style={{background:`linear-gradient(135deg,${G.teal},${G.mid})`,color:"#fff",border:"none",borderRadius:20,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Ask Concierge →</button>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(220px,100%),1fr))",gap:14}}>
              {dimSvcs.map(svc=>(
                <div key={svc.id} onClick={()=>onBook?.(svc)}
                  style={{background:"#fff",borderRadius:14,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",cursor:"pointer",transition:"transform 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                  <div style={{height:90,background:`linear-gradient(135deg,${G.pale},${G.cream})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>{svc.icon}</div>
                  <div style={{padding:"11px 13px"}}>
                    {svc.tagline&&<div style={{fontSize:10,color:G.mutedText,marginBottom:2}}>{t(svc.tagline,petName)}</div>}
                    <div style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:4,lineHeight:1.3}}>{svc.name}</div>
                    <div style={{fontSize:11,color:"#888",lineHeight:1.4,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{t(svc.desc,petName)}</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:13,fontWeight:700,color:G.deep}}>{svc.price}</span>
                      <button style={{background:G.teal,color:"#fff",border:"none",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Book {svc.steps}-step →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Advisory */}
      {dimTab==="advisory" && (
        <div style={{padding:"12px 16px 20px"}}>
          <PersonalisedBreedSection pet={pet} pillar="paperwork"/>
          <div style={{borderTop:"1px solid #f0f0f0",marginTop:16,paddingTop:16}}>
            <SoulMadeCollection pillar="paperwork" maxItems={4} showTitle={true}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOADING / NO PET ──────────────────────────────────────
function LoadingState(){return(<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{width:48,height:48,borderRadius:"50%",background:MIRA_ORB,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff"}}>✦</div><div style={{fontSize:16,color:G.darkText,fontWeight:600}}>Preparing <span style={{color:G.teal}}>your safety documents…</span></div></div>);}
function NoPetState({onAddPet}){return(<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{fontSize:48,marginBottom:16}}>📋</div><div style={{fontSize:18,fontWeight:800,color:G.darkText,marginBottom:8}}>Add a pet to manage documents</div><p style={{fontSize:14,color:G.mutedText,marginBottom:24}}>Mira keeps every document, record and certificate organised.</p><button onClick={onAddPet} style={{background:`linear-gradient(135deg,${G.teal},${G.mid})`,color:"#fff",border:"none",borderRadius:9999,padding:"12px 28px",fontSize:16,fontWeight:600,cursor:"pointer"}}>Add your dog →</button></div>);}

function SoulChip({ children }){return(<span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(153,246,228,0.20)",border:"1px solid rgba(153,246,228,0.35)",borderRadius:20,padding:"3px 10px",fontSize:11,color:"rgba(255,255,255,0.85)",fontWeight:500}}>{children}</span>);}

// ─── MAIN PAGE ─────────────────────────────────────────────
const PaperworkSoulPage = () => {
  const navigate = useNavigate();
  const {token,isAuthenticated}                       = useAuth();
  const {currentPet,setCurrentPet,pets:contextPets}  = usePillarContext();

  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("documents");
  const [openDim,       setOpenDim]       = useState(null);
  const [petData,       setPetData]       = useState(null);
  const [docScore,      setDocScore]      = useState(0);
  const [apiProducts,   setApiProducts]   = useState({});
  const [services,      setServices]      = useState([]);
  const [activeService, setActiveService] = useState(null);
  const [toastVisible,  setToastVisible]  = useState(false);
  const [toastSvc,      setToastSvc]      = useState("");
  const miraRef = useRef(null);

  const handleBook = useCallback(async (svc) => {
    const petName = petData?.name||"your dog";
    const svcName = svc?.name||"this service";
    const knownSvc = PAPER_SERVICES.find(s=>s.name===svcName||s.id===svc?.id);
    if (knownSvc) { setActiveService(knownSvc); return; }
    // Fallback: fire ticket
    try {
      const user = JSON.parse(localStorage.getItem("user")||"{}");
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`,{
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({parent_id:user?.id||"guest",pet_id:petData?.id||"unknown",pillar:"paperwork",intent_primary:"service_request",intent_secondary:[svcName],initial_message:{sender:"parent",source:"paperwork_page",text:`Hi! ${petName}'s parent would like to book ${svcName}. Please arrange and confirm.`}}),
      });
    } catch(e){console.error("[PaperworkSoulPage] handleBook",e);}
    setToastSvc(svcName); setToastVisible(true);
  },[petData,token]);

  useEffect(()=>{
    const CATS=["Identity & Safety","Health Records","Travel Documents","Insurance & Finance","Breed & Advisory","Expert Advisory","Soul Documents","bundles"];
    Promise.all([
      ...CATS.map(cat=>fetch(`${API_URL}/api/admin/pillar-products?pillar=paperwork&limit=100&category=${encodeURIComponent(cat)}`).then(r=>r.ok?r.json():null).catch(()=>null)),
      fetch(`${API_URL}/api/service-box/services?pillar=paperwork`).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(results=>{
      const svcData=results[results.length-1];
      if(svcData?.services)setServices(svcData.services);
      const grouped={};
      results.slice(0,-1).forEach(data=>{
        (data?.products||[]).forEach(p=>{
          const c=p.category||"",s=p.sub_category||"";
          if(!grouped[c])grouped[c]={};
          if(!grouped[c][s])grouped[c][s]=[];
          grouped[c][s].push(p);
        });
      });
      setApiProducts(grouped);
    });
  },[]);

  useEffect(()=>{if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]);if(contextPets!==undefined)setLoading(false);},[contextPets,currentPet,setCurrentPet]);

  useEffect(()=>{
    if(currentPet){
      const normalized={...currentPet,photo_url:currentPet.photo_url||currentPet.avatar_url||null,avatar:currentPet.avatar||"🐕",breed:currentPet.breed||currentPet.doggy_soul_answers?.breed||""};
      setPetData(normalized);
      setDocScore(getDocScore(normalized));
    }
  },[currentPet]);

  const handleAddPet=useCallback(()=>navigate(isAuthenticated?"/dashboard/pets?action=add":"/login?redirect=/paperwork"),[isAuthenticated,navigate]);

  if(loading)  return<PillarPageLayout pillar="paperwork" hideHero hideNavigation><LoadingState/></PillarPageLayout>;
  if(!petData) return<PillarPageLayout pillar="paperwork" hideHero hideNavigation><NoPetState onAddPet={handleAddPet}/></PillarPageLayout>;

  const dims    = getPaperworkDims(petData);
  const petName = petData.name;
  const breed   = petData.breed||"";

  return (
    <PillarPageLayout pillar="paperwork" hideHero hideNavigation>
      <Helmet>
        <title>Paperwork · {petName} · The Doggy Company</title>
        <meta name="description" content={`All of ${petName}'s documents, records and expert guidance — organised by Mira.`}/>
      </Helmet>

      {/* ── HERO ── */}
      <div style={{background:`linear-gradient(160deg,${G.deep} 0%,${G.mid} 55%,#0F766E 100%)`,padding:"28px 24px 0",position:"relative",overflow:"hidden"}}>
        <div style={{maxWidth:1100,margin:"0 auto",position:"relative",zIndex:2}}>

          {/* Avatar + text row */}
          <div style={{display:"flex",alignItems:"flex-start",gap:24,marginBottom:20}}>

            {/* Avatar + doc score badge */}
            <div style={{position:"relative",flexShrink:0}}>
              <div style={{width:88,height:88,borderRadius:"50%",background:`linear-gradient(135deg,${G.light},${G.teal})`,border:"3px solid rgba(255,255,255,0.30)",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>
                {petData.photo_url
                  ? <img src={petData.photo_url} alt={petName} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span>{petData.avatar||"🐕"}</span>}
              </div>
              <div style={{position:"absolute",bottom:-4,right:-4,background:G.light,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,color:G.deep,border:"2px solid #fff"}}>
                {docScore}%
              </div>
            </div>

            {/* Hero text */}
            <div style={{flex:1}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(153,246,228,0.20)",border:"1px solid rgba(153,246,228,0.35)",borderRadius:20,padding:"4px 12px",color:G.light,fontSize:11,fontWeight:600,marginBottom:10}}>
                📋 {petName}'s Safety Profile
              </div>
              <h1 style={{fontSize:"clamp(1.5rem,4vw,2.2rem)",fontWeight:900,color:"#fff",marginBottom:8,lineHeight:1.1,fontFamily:"Georgia,'Times New Roman',serif"}}>
                Keep <span style={{color:G.light}}>{petName}</span> safe,<br/>documented & protected
              </h1>
              {/* Profile chips */}
              {(()=>{
                const chips=[], ans=petData?.doggy_soul_answers||{};
                if(breed)                chips.push("📚 "+breed.split("(")[0].trim());
                if(petData?.vaccinated)  chips.push("💉 Vaccinated");
                if(ans.microchipped)     chips.push("🔬 Microchipped");
                if(ans.insurance)        chips.push("🛡️ Insured");
                if(ans.is_rescue===true) chips.push("🐾 Rescue");
                if(!chips.length) return null;
                return(<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{chips.map(chip=><SoulChip key={chip}>{chip}</SoulChip>)}</div>);
              })()}
              <div style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start",maxWidth:500}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0}}>✦</div>
                <div>
                  <p style={{fontSize:12,color:"rgba(255,255,255,0.85)",fontStyle:"italic",lineHeight:1.55,margin:0}}>
                    "I keep {petName}'s documents organised, flag what's missing, and handle the paperwork so you don't have to."
                  </p>
                  <span style={{fontSize:10,color:G.light,fontWeight:600}}>♥ Mira knows {petName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{display:"flex",gap:0}}>
            {[["documents","📄 Documents"],["advisory","🧠 Expert Advisory"],["find","📍 Find Help"]].map(([id,label])=>{
              const a=activeTab===id;
              return(<button key={id} onClick={()=>setActiveTab(id)} style={{flex:1,padding:"12px 0",background:"none",border:"none",borderBottom:a?`3px solid ${G.light}`:"3px solid transparent",color:a?"#fff":"rgba(255,255,255,0.50)",fontSize:13,fontWeight:a?700:400,cursor:"pointer",transition:"all 0.15s"}}>{label}</button>);
            })}
          </div>
        </div>
      </div>

      {/* ── PAGE BODY ── */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8" style={{background:G.pageBg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

        {/* Booking modal */}
        {activeService && <ServiceBookingModal service={activeService} pet={petData} onClose={()=>setActiveService(null)}/>}

        {/* Category strip */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",padding:"16px 0 12px",marginBottom:4}}>
          {[
            {id:"identity", icon:"🪪",  label:"Identity"},
            {id:"health",   icon:"🏥",  label:"Health Records"},
            {id:"travel",   icon:"✈️",   label:"Travel"},
            {id:"insurance",icon:"🛡️",  label:"Insurance"},
            {id:"breeds",   icon:"📚",  label:"Breed Guides"},
            {id:"advisory", icon:"💡",  label:"Advisory"},
            {id:"soul",     icon:"🌟",  label:"Soul Docs"},
            {id:"mira",     icon:"✦",   label:"Mira's Review"},
          ].map(s=>{
            const sel=openDim===s.id;
            return(
              <button key={s.id}
                onClick={()=>{
                  if(s.id==="mira"){miraRef.current?.scrollIntoView({behavior:"smooth",block:"start"});return;}
                  setOpenDim(sel?null:s.id);
                }}
                style={{display:"inline-flex",alignItems:"center",gap:5,flexShrink:0,padding:"7px 14px",borderRadius:9999,border:`1.5px solid ${sel?G.teal:"rgba(13,148,136,0.28)"}`,background:sel?G.teal:"#fff",color:sel?"#fff":G.mutedText,fontSize:12,fontWeight:sel?700:400,cursor:"pointer",transition:"all 0.15s"}}>
                <span style={{fontSize:13}}>{s.icon}</span>{s.label}
              </button>
            );
          })}
        </div>

        {activeTab==="documents" && (
          <>
            {/* Doc completeness bar */}
            <DocCompletnessBar pet={petData} docScore={docScore} onOpen={()=>setOpenDim("health")}/>

            {/* Mira picks */}
            <div ref={miraRef}><MiraPicksSection pet={petData}/></div>

            <GuidedPaperworkPaths pet={petData}/>

            {/* Section heading */}
            <section style={{paddingBottom:16}}>
              <h2 style={{fontSize:"clamp(1.5rem,4vw,2rem)",fontWeight:800,color:G.darkText,marginBottom:6,fontFamily:"Georgia,'Times New Roman',serif"}}>
                What does <span style={{color:G.teal}}>{petName}</span> need protected?
              </h2>
              <p style={{fontSize:14,color:"#888",lineHeight:1.5}}>
                Choose a category — everything inside is organised for {petName}.{" "}
                <span style={{color:G.mid,fontWeight:600}}>Glowing ones need your attention.</span>
              </p>
            </section>

            {/* Dim grid */}
            <div style={{display:"grid",gap:10,marginBottom:28}} className="paperwork-dims-grid">
              <style>{`
                .paperwork-dims-grid{grid-template-columns:repeat(2,1fr)}
                @media(min-width:640px){.paperwork-dims-grid{grid-template-columns:repeat(4,1fr)}}
                @media(min-width:1024px){.paperwork-dims-grid{grid-template-columns:repeat(7,1fr)}}
              `}</style>
              {dims.map(dim=>{
                const isOpen=openDim===dim.id;
                return(
                  <div key={dim.id} style={{gridColumn:isOpen?"1 / -1":"auto"}}>
                    <div onClick={()=>setOpenDim(isOpen?null:dim.id)}
                      style={{background:"#fff",borderRadius:isOpen?"14px 14px 0 0":12,padding:"14px 10px",cursor:"pointer",position:"relative",textAlign:"center",opacity:dim.glow?1:0.70,boxShadow:dim.glow&&!isOpen?`0 0 18px ${dim.glowColor}`:"none",border:isOpen?`2px solid ${G.teal}`:"2px solid transparent",transition:"all 0.15s"}}>
                      {dim.glow&&<div style={{position:"absolute",top:8,right:8,width:7,height:7,borderRadius:"50%",background:G.light}}/>}
                      <div style={{fontSize:22,marginBottom:8}}>{dim.icon}</div>
                      <div style={{fontSize:12,fontWeight:700,color:G.darkText,marginBottom:3,lineHeight:1.2}}>{dim.label}</div>
                      <div style={{fontSize:10,color:G.mutedText,lineHeight:1.3,marginBottom:6}}>{t(dim.sub,petName)}</div>
                      <span style={{fontSize:9,fontWeight:700,borderRadius:20,padding:"2px 7px",display:"inline-block",background:`${dim.badgeBg}22`,color:dim.badgeBg}}>{t(dim.badge,petName)}</span>
                      <span style={{position:"absolute",bottom:8,right:8,fontSize:12,color:"rgba(0,0,0,0.20)",transform:isOpen?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>
                    </div>
                    {isOpen&&<DimExpanded dim={dim} pet={petData} onClose={()=>setOpenDim(null)} apiProducts={apiProducts} services={services} onBook={handleBook}/>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab==="advisory" && (
          <div style={{marginTop:24}}>
            {activeService&&<ServiceBookingModal service={activeService} pet={petData} onClose={()=>setActiveService(null)}/>}
            <h2 style={{fontSize:"clamp(1.25rem,3vw,1.5rem)",fontWeight:800,color:G.darkText,marginBottom:6,fontFamily:"Georgia,serif"}}>
              Expert guidance for <span style={{color:G.teal}}>{petName}</span>'s life
            </h2>
            <p style={{fontSize:13,color:"#888",marginBottom:20}}>Life planning, housing rules, multi-pet households, breed education — Mira advises.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(220px,100%),1fr))",gap:14}}>
              {PAPER_SERVICES.map(svc=>(
                <div key={svc.id} onClick={()=>setActiveService(svc)}
                  style={{background:"#fff",borderRadius:16,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",cursor:"pointer",transition:"transform 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                  <div style={{height:100,background:`linear-gradient(135deg,${G.pale},${G.cream})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>{svc.icon}</div>
                  <div style={{padding:"11px 13px 13px"}}>
                    <div style={{fontSize:10,color:G.mutedText,marginBottom:2}}>{t(svc.tagline,petName)}</div>
                    <div style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:4}}>{svc.name}</div>
                    <div style={{fontSize:11,color:"#888",lineHeight:1.4,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{t(svc.desc,petName)}</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:13,fontWeight:700,color:G.deep}}>{svc.price}</span>
                      <button style={{background:G.teal,color:"#fff",border:"none",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Book →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab==="find" && (
          <div style={{textAlign:"center",padding:"60px 20px",color:"#888"}}>
            <div style={{fontSize:40,marginBottom:16}}>📍</div>
            <div style={{fontSize:16,fontWeight:700,color:G.darkText,marginBottom:8}}>Find vets, microchipping clinics & advisors near you</div>
            <p style={{fontSize:13,marginBottom:24}}>Drop in PaperworkNearMe.jsx here — same pattern as CareNearMe.</p>
            <div style={{background:G.pale,border:`1px solid ${G.border}`,borderRadius:12,padding:"16px 20px",maxWidth:400,margin:"0 auto",fontSize:12,color:G.mid}}>
              <strong>Aditya:</strong> Import PaperworkNearMe from /components/paperwork/PaperworkNearMe.jsx and render it here with prop: &lt;PaperworkNearMe pet={'{petData}'} onBook={'{handleBook}'}/&gt;
            </div>
          </div>
        )}

      </div>

      <ConciergeToast
        toast={toastVisible?{name:toastSvc,pillar:"paperwork"}:null}
        onClose={()=>setToastVisible(false)}
      />
    </PillarPageLayout>
  );
};

export default PaperworkSoulPage;
