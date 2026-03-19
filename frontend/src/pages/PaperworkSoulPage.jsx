/**
 * PaperworkSoulPage.jsx — /paperwork pillar
 * The Doggy Company
 *
 * MERGED: Paperwork + Advisory into one pillar
 * Architecture: Full Care/Learn parity (Session 83n, Mar 2026)
 * Colour world: Deep Slate #1E293B + Teal #0D9488
 *
 * WIRING:
 *   Route:    <Route path="/paperwork" element={<PaperworkSoulPage/>}/>
 *   Products: GET /api/admin/pillar-products?pillar=paperwork&category=...
 *   Docs:     GET /api/documents/completeness/{petId}
 *   Upload:   POST /api/documents/upload
 *   Booking:  POST /api/service_desk/attach_or_create_ticket
 *
 * 7 Dims: Identity & Safety · Health Records · Travel Documents
 *         Insurance & Finance · Breed & Care Guides · Expert Advisory · Soul Documents
 * 3 tabs per dim: Products | Services | Advisory
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Loader2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import SharedProductCard, { ProductDetailModal } from "../components/ProductCard";
import SoulMadeCollection from "../components/SoulMadeCollection";
import PersonalisedBreedSection from "../components/common/PersonalisedBreedSection";
import ConciergeToast from "../components/common/ConciergeToast";
import MiraImaginesCard from "../components/common/MiraImaginesCard";
import { useMiraIntelligence, getMiraIntelligenceSubtitle } from "../hooks/useMiraIntelligence";
import PaperworkNearMe from "../components/paperwork/PaperworkNearMe";
import { API_URL } from "../utils/api";

// ─── PAPERWORK CONTENT MODAL (opens when category pill clicked, like Learn) ──
function PaperworkContentModal({ isOpen, onClose, category, pet }) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [selProd,  setSelProd]  = useState(null);
  const { token } = useAuth();
  const petName = pet?.name||"your dog";
  const breed   = pet?.breed ? pet.breed.split("(")[0].trim() : "";

  const CAT_CONFIG = {
    identity:  { label:"Identity & Safety",  bg:"#EDE9FE", icon:"🪪",  accent:"#1E293B", mira:`I picked these specifically for ${petName}'s identity protection — the essentials that matter most.` },
    health:    { label:"Health Records",     bg:"#E0F2FE", icon:"🏥",  accent:"#0D9488", mira:`${petName}'s health records need to be organised, accessible, and up to date. These tools make that easy.` },
    travel:    { label:"Travel Documents",   bg:"#E8F5E9", icon:"✈️",  accent:"#1E293B", mira:breed?`Travelling with a ${breed}? I've selected every document organiser you'll need.`:`Everything ${petName} needs for safe, documented travel — domestic and international.` },
    insurance: { label:"Insurance",         bg:"#FFF3E0", icon:"🛡️",  accent:"#0D9488", mira:`${petName}'s insurance and financial documents — organised, tracked, and claim-ready.` },
    breeds:    { label:"Breed Guides",       bg:"#FFF8E1", icon:"📚",  accent:"#334155", mira:breed?`I've curated the complete ${breed} care guide set for ${petName}.`:`Breed-specific guides tailored to ${petName}'s heritage and health.` },
    advisory:  { label:"Expert Advisory",   bg:"#F3E5F5", icon:"💡",  accent:"#0D9488", mira:`Expert guidance products and resources — life planning, housing rules, breed education for ${petName}.` },
    soul:      { label:"Soul Documents",     bg:"#F0FDFA", icon:"🌟",  accent:"#0D9488", mira:breed?`${petName}'s ${breed} passport holder — personalised soul documents made with care.`:`${petName}'s soul documents — the identity, story, and soul of this dog, beautifully held.` },
    mira:      { label:"Mira's Picks",       bg:"#E8EAF6", icon:"✦",   accent:"#1E293B", mira:`My top picks across all document categories for ${petName} — scored and ranked just for them.` },
  };

  const cfg = CAT_CONFIG[category] || CAT_CONFIG.identity;

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    if (category === "mira") {
      if (!pet?.id) { setLoading(false); return; }
      const breedParam = breed ? `&breed=${encodeURIComponent(breed)}` : "";
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=paperwork&limit=16&min_score=40${breedParam}`, {
        headers: token ? { Authorization:`Bearer ${token}` } : {}
      })
        .then(r=>r.json())
        .then(d=>{
          const scored = filterBreedProducts(d.picks||[], pet?.breed);
          if (scored.length > 0) { setProducts(scored); setLoading(false); return; }
          return fetch(`${API_URL}/api/admin/pillar-products?pillar=paperwork&limit=200`, {
            headers: token ? { Authorization:`Bearer ${token}` } : {}
          }).then(r=>r.json()).then(pd=>setProducts(filterBreedProducts(pd.products||[], pet?.breed).slice(0,16)));
        })
        .catch(()=>setProducts([]))
        .finally(()=>setLoading(false));
      return;
    }
    const catLabel = {identity:"Identity & Safety",health:"Health Records",travel:"Travel Documents",insurance:"Insurance & Finance",breeds:"Breed & Advisory",advisory:"Expert Advisory",soul:"Soul Documents"}[category]||category;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=paperwork&category=${encodeURIComponent(catLabel)}&limit=16`, {
      headers: token ? { Authorization:`Bearer ${token}` } : {}
    })
      .then(r=>r.json())
      .then(d=>setProducts(filterBreedProducts(d.products||[], pet?.breed)))
      .catch(()=>setProducts([]))
      .finally(()=>setLoading(false));
  }, [isOpen, category, pet?.id, pet?.breed]);

  if (!isOpen) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:11000,background:"rgba(0,0,0,0.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} data-testid={`paperwork-cat-modal-${category}`}
        style={{width:"min(700px,100%)",maxHeight:"88vh",overflowY:"auto",borderRadius:20,background:"#fff",boxShadow:"0 24px 80px rgba(0,0,0,0.45)",display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{borderRadius:"20px 20px 0 0",padding:"20px 22px 16px",background:`linear-gradient(135deg,${G.deep} 0%,${G.mid} 70%,#0F766E 100%)`,flexShrink:0,position:"sticky",top:0,zIndex:2}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{cfg.icon}</div>
              <div>
                <p style={{fontWeight:800,color:"#fff",fontSize:15,margin:0}}>{cfg.label}</p>
                <p style={{color:"rgba(255,255,255,0.55)",fontSize:11,margin:0}}>For {petName}{breed?` · ${breed}`:""}</p>
              </div>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,0.70)",fontSize:16}}>✕</button>
          </div>
          <div style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"flex-start",gap:8}}>
            <span style={{fontSize:13,color:G.light,flexShrink:0}}>✦</span>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.80)",fontStyle:"italic",margin:0,lineHeight:1.5}}>{cfg.mira}</p>
          </div>
        </div>
        {/* Body */}
        <div style={{padding:"18px 20px"}}>
          {loading && <div style={{textAlign:"center",padding:"32px 0"}}><Loader2 size={24} style={{color:G.teal,animation:"spin 1s linear infinite"}}/></div>}
          {!loading && products.length===0 && (
            <div style={{textAlign:"center",padding:"32px 0",color:"#888"}}>
              <div style={{fontSize:32,marginBottom:10}}>📦</div>
              <p style={{fontWeight:600,marginBottom:4}}>Products being curated</p>
              <p style={{fontSize:13}}>Mira is sourcing {petName}'s {cfg.label} kit — check back soon.</p>
            </div>
          )}
          {!loading && products.length>0 && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(200px,100%),1fr))",gap:12}}>
              {products.map(p=>(
                <SharedProductCard key={p.id||p._id} product={p} pet={pet} onViewDetails={()=>setSelProd(p)} accentColor={cfg.accent||G.teal}/>
              ))}
            </div>
          )}
        </div>
      </div>
      {selProd && <ProductDetailModal product={selProd} pet={pet} onClose={()=>setSelProd(null)}/>}
    </div>
  );
}

// ─── COLOUR SYSTEM ──────────────────────────────────────────
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
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ─── HELPERS ────────────────────────────────────────────────
function t(str, name) { return str ? str.replace(/{name}/g, name||"your dog") : ""; }
function getAge(pet)    { const raw=pet?.doggy_soul_answers?.age_years??pet?.age??null; if(!raw)return null; return parseInt(raw)||null; }
function isSenior(pet)  { const a=getAge(pet); return a!==null&&a>=7; }
function isPuppy(pet)   { const a=getAge(pet); return a!==null&&a<=1; }
function isMultiPet(p)  { return !!(p?.doggy_soul_answers?.other_pets||p?.siblings?.length); }
function isRescue(p)    { return !!(p?.doggy_soul_answers?.is_rescue||(""+p?.origin).toLowerCase().includes("rescue")); }

// Breed filter — PET FIRST, BREED NEXT
const KNOWN_BREEDS = ['american bully','beagle','border collie','boxer','cavalier','chihuahua','chow chow','cocker spaniel','dachshund','dalmatian','doberman','english bulldog','french bulldog','german shepherd','golden retriever','great dane','husky','indie','jack russell','labrador','lhasa apso','maltese','pomeranian','poodle','pug','rottweiler','shih tzu','yorkshire','akita','australian shepherd','corgi','samoyed','shiba inu','schnauzer'];
function filterBreedProducts(products, petBreed) {
  const petLower = (petBreed||"").trim().toLowerCase();
  const petWords = petLower.split(/\s+/).filter(w=>w.length>2);
  return products.filter(p=>{
    const nm=(p.name||"").toLowerCase();
    for(const breed of KNOWN_BREEDS){
      if(nm.includes(breed)){
        if(!petLower) return false;
        if(nm.includes(petLower)) return true;
        if(petWords.some(w=>breed.includes(w)||breed.startsWith(w))) return true;
        return false;
      }
    }
    return true;
  });
}

// ─── SOUL CHIP (hero chips) ─────────────────────────────────
function SoulChip({ icon, label, value, children }) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,borderRadius:9999,padding:"4px 12px",fontSize:11,fontWeight:600,color:"#fff",background:"rgba(153,246,228,0.18)",border:"1px solid rgba(153,246,228,0.30)"}}>
      {icon&&<span>{icon}</span>}
      {label&&<span style={{opacity:0.75}}>{label}:</span>}
      {value||children}
    </span>
  );
}

// ─── DOCUMENT COMPLETENESS ──────────────────────────────────
function getDocScore(pet) {
  let score=0;
  if(pet?.vaccinated)                          score+=15;
  if(pet?.doggy_soul_answers?.microchipped)    score+=20;
  if(pet?.doggy_soul_answers?.insurance)       score+=15;
  if(pet?.doggy_soul_answers?.registered)      score+=15;
  if(pet?.doggy_soul_answers?.travel_docs)     score+=10;
  if(pet?.emergency_contact)                   score+=10;
  if(pet?.health?.medical_conditions)          score+=15;
  return score;
}
function getMissingDocs(pet) {
  const m=[];
  if(!pet?.vaccinated)                       m.push("Vaccination records");
  if(!pet?.doggy_soul_answers?.microchipped) m.push("Microchip registration");
  if(!pet?.doggy_soul_answers?.insurance)    m.push("Pet insurance");
  if(!pet?.doggy_soul_answers?.registered)   m.push("Society/municipal registration");
  return m;
}

// ─── DIM CONFIG ─────────────────────────────────────────────
function getPaperworkDims(pet) {
  const puppy   = isPuppy(pet);
  const multi   = isMultiPet(pet);
  const missing = getMissingDocs(pet);
  const breed   = pet?.breed||"";

  return [
    { id:"identity",  icon:"🪪",  label:"Identity & Safety",     sub:missing.includes("Microchip registration")?"Microchip not registered yet":"Registration, ID & emergency info",   badge:missing.includes("Microchip registration")?"Action needed":"Protected", badgeBg:missing.includes("Microchip registration")?"#C62828":G.teal,   glow:missing.includes("Microchip registration"), glowColor:"rgba(13,148,136,0.35)", mira:missing.includes("Microchip registration")?"{name}'s microchip isn't registered yet — this is the most important step.":"I've curated everything for {name}'s complete identity protection." },
    { id:"health",    icon:"🏥",  label:"Health Records",         sub:pet?.vaccinated?"Vaccination records on file":"Vaccination records needed",                                       badge:pet?.vaccinated?"Up to date":"Needs attention",                          badgeBg:pet?.vaccinated?G.teal:"#E65100",         glow:!pet?.vaccinated,                               glowColor:"rgba(13,148,136,0.25)", mira:pet?.vaccinated?"I'll remind you when {name}'s boosters are due.":"{name}'s vaccination records need uploading — critical for boarding and travel." },
    { id:"travel",    icon:"✈️",   label:"Travel Documents",       sub:breed?`${breed} travel — passport & health cert`:"Pet passport & international health cert",                      badge:"Travel ready",                                                          badgeBg:G.mid,                                    glow:false,                                          glowColor:"rgba(13,148,136,0.20)", mira:"Planning to travel with {name}? I've organised everything — passport, health cert, airline checklist." },
    { id:"insurance", icon:"🛡️",  label:"Insurance & Financial",  sub:missing.includes("Pet insurance")?"No pet insurance on file":"Policy + claims + budget tracker",                badge:missing.includes("Pet insurance")?"Not covered":"Covered",               badgeBg:missing.includes("Pet insurance")?"#C62828":G.teal, glow:missing.includes("Pet insurance"),             glowColor:"rgba(13,148,136,0.25)", mira:missing.includes("Pet insurance")?"I'll help {name}'s family compare, choose, and set up the right insurance policy.":"{name}'s insurance is active. I track renewals and help with claims." },
    { id:"breeds",    icon:"📚",  label:"Breed & Care Guides",    sub:breed?`${breed} — guide + care tips`:"Breed-specific care, training & health",                                  badge:"Know your breed",                                                       badgeBg:G.mid,                                    glow:true,                                           glowColor:"rgba(13,148,136,0.22)", mira:breed?`I've curated everything specific to ${breed}s — care guide, training approach, common health risks.`:"Understanding {name}'s breed unlocks better care at every stage." },
    { id:"advisory",  icon:"💡",  label:"Expert Advisory",        sub:multi?"Multi-pet household guidance":puppy?"New puppy planning":"Life planning & expert guidance",                badge:multi?"Multi-pet":puppy?"New puppy":"Life advice",                       badgeBg:multi?"#7C3AED":puppy?G.teal:G.mid,      glow:true,                                           glowColor:"rgba(13,148,136,0.22)", mira:multi?"Managing multiple pets takes planning. I've built guidance specific to {name}'s household.":puppy?"{name} is a puppy — I've put together everything a new parent needs.":"Expert guidance on life planning, housing rules, and every stage of {name}'s life." },
    { id:"soul",      icon:"🌟",  label:"Soul Documents",         sub:breed?`${breed} passport holder — made for {name}`:"Breed passport holder",                                      badge:"Made for you",                                                          badgeBg:G.teal,                                   glow:true,                                           glowColor:"rgba(13,148,136,0.20)", mira:"{name}'s breed-specific passport holder — carries the identity, soul profile, and story of this dog." },
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

// ─── PAPER SERVICES ─────────────────────────────────────────
const PAPER_SERVICES = [
  { id:"registration",  icon:"🪪", name:"Pet Registration Guidance",  tagline:"Society + municipal registration", price:"₹500",   steps:2, dim:"identity",  accentColor:"#0D9488", desc:"Complete registration guidance — society forms, municipal licensing, all paperwork handled.", miraKnows:"Registration protects {petName} legally and is required by most housing societies." },
  { id:"microchipping", icon:"🔬", name:"Microchipping Assistance",    tagline:"Permanent ID for life",            price:"₹300",   steps:2, dim:"identity",  accentColor:"#1E293B", desc:"Concierge arranges microchipping and registry — permanent ID that can never be lost.", miraKnows:"Microchipping is the single most important thing for {petName}'s safety." },
  { id:"passport",      icon:"✈️", name:"Pet Passport Service",         tagline:"International travel ready",       price:"₹2,999", steps:3, dim:"travel",    accentColor:"#0D9488", desc:"Full pet passport service — vet coordination, health certificates, rabies titres, all documentation.", miraKnows:"International travel requires specific documents — requirements vary by country. Mira handles everything." },
  { id:"travel_docs",   icon:"📋", name:"Travel Documentation",         tagline:"Airline + country requirements",   price:"₹1,500", steps:2, dim:"travel",    accentColor:"#334155", desc:"All travel documents — health certificate, airline approval, import permits where needed.", miraKnows:"Airlines have strict pet document requirements. Missing one can mean {petName} can't board." },
  { id:"insurance_rev", icon:"🛡️", name:"Pet Insurance Review",         tagline:"Free — find the right cover",      price:"Free",   steps:2, dim:"insurance", accentColor:"#0D9488", desc:"Mira compares pet insurance policies and finds the right cover for breed, age and health.", miraKnows:"Pet insurance is most affordable when started young." },
  { id:"claim_filing",  icon:"📝", name:"Claim Filing Assistance",      tagline:"Free — we file it for you",        price:"Free",   steps:2, dim:"insurance", accentColor:"#334155", desc:"Concierge handles the entire claim process — paperwork, follow-up, and settlement tracking.", miraKnows:"Claim rejections often happen due to incorrect paperwork. I handle this." },
  { id:"life_planning", icon:"💡", name:"Pet Life Planning",            tagline:"Free — plan {name}'s life well",   price:"Free",   steps:2, dim:"advisory",  accentColor:"#1E293B", desc:"A comprehensive life plan — every stage from puppy to senior, all guidance in one session.", miraKnows:"Planning ahead reduces stress and ensures nothing is missed for {petName}." },
  { id:"puppy_prep",    icon:"🐶", name:"New Puppy Preparation",        tagline:"Everything for the first year",    price:"₹1,499", steps:3, dim:"advisory",  accentColor:"#0D9488", desc:"Complete first-year guide — vet, food, training, grooming, socialisation, documents.", miraKnows:"The first year is the most important. I've built the complete roadmap." },
];

// ─── PAPERWORK QUESTIONS (soul profile) ─────────────────────
const PAPERWORK_QUESTIONS = [
  { id:"vaccinated",      chapter:"🏥 Health",   pts:15, type:"single", question:"Is {name} fully vaccinated?",                     options:["Yes — all up to date","Yes but due for boosters","No — not vaccinated","Not sure"] },
  { id:"microchipped",    chapter:"🪪 Identity",  pts:20, type:"single", question:"Is {name} microchipped and registered?",          options:["Yes — chip + registry","Chipped but not registered","Not chipped","Not sure"] },
  { id:"insurance",       chapter:"🛡️ Insurance", pts:15, type:"single", question:"Does {name} have pet insurance?",                 options:["Yes — active policy","No insurance","Looking into it","Doesn't need it"] },
  { id:"registered",      chapter:"🪪 Identity",  pts:15, type:"single", question:"Is {name} registered with your society or municipality?", options:["Yes, fully registered","Registered with society only","Not registered","In progress"] },
  { id:"travel_docs",     chapter:"✈️ Travel",    pts:10, type:"single", question:"Does {name} have travel documents?",              options:["Yes — passport + health cert","Yes — India domestic only","No travel docs","Not needed yet"] },
  { id:"emergency_plan",  chapter:"🚨 Safety",    pts:10, type:"single", question:"Do you have an emergency plan for {name}?",       options:["Yes — vet contact + backup carer","Partial — vet only","No plan","Working on it"] },
  { id:"vet_history",     chapter:"🏥 Health",    pts:15, type:"single", question:"Are {name}'s medical records accessible?",        options:["Yes — digital + physical copies","Physical files only","No organised records","Partially"] },
];

// ─── PAPERWORK PROFILE (collapsed bar → modal, Care-parity) ─
function PaperworkProfile({ pet, token }) {
  const petName   = pet?.name||"your dog";
  const breedLabel= (pet?.breed||"").split("(")[0].trim();
  const missing   = getMissingDocs(pet);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [answers,    setAnswers]    = useState({});
  const [saved,      setSaved]      = useState({});
  const [submitting, setSubmitting] = useState({});
  const [liveScore,  setLiveScore]  = useState(getDocScore(pet));

  const remaining = PAPERWORK_QUESTIONS.filter(q => !saved[q.id]);

  const toggle = (qId, val) => setAnswers(p => ({...p, [qId]: [val]}));

  const save = async (q) => {
    const ans = answers[q.id];
    if (!ans?.length) return;
    setSubmitting(p => ({...p, [q.id]:true}));
    try {
      const res = await fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/answer`, {
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({question_id:q.id, answer:ans}),
      });
      if(res.ok){const d=await res.json();if(d.scores?.overall)setLiveScore(d.scores.overall);}
      setSaved(p => ({...p, [q.id]:true}));
    } catch { setSaved(p => ({...p, [q.id]:true})); }
    finally { setSubmitting(p => ({...p, [q.id]:false})); }
  };

  return (
    <>
      {/* Collapsed bar */}
      <div onClick={() => setDrawerOpen(true)} data-testid="paperwork-profile-bar"
        style={{background:"#fff",border:`2px solid ${G.pale}`,borderRadius:16,padding:"14px 18px",
          marginBottom:20,cursor:"pointer",display:"flex",alignItems:"center",gap:14,
          boxShadow:"0 2px 12px rgba(13,148,136,0.08)"}}>
        <div style={{width:40,height:40,borderRadius:10,flexShrink:0,fontSize:20,
          background:`linear-gradient(135deg,${G.pale},${G.light})`,
          display:"flex",alignItems:"center",justifyContent:"center"}}>📋</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:700,color:G.darkText}}>{petName}'s Safety Profile</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:5}}>
            {missing.length===0
              ? <span style={{fontSize:11,fontWeight:600,color:G.teal,background:G.pale,border:`1px solid ${G.light}`,borderRadius:20,padding:"3px 10px"}}>✦ {petName} is fully protected</span>
              : missing.slice(0,2).map(m=>(
                  <span key={m} style={{fontSize:10,fontWeight:600,color:"#C62828",background:"#FFEBEE",border:"1px solid #EF9A9A",borderRadius:20,padding:"2px 8px"}}>⚠ {m}</span>
                ))}
          </div>
        </div>
        <span style={{fontSize:11,color:G.teal,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>Mira's picks →</span>
      </div>

      {/* Modal */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)}
          style={{position:"fixed",inset:0,zIndex:10002,background:"rgba(0,0,0,0.72)",
            display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div onClick={e => e.stopPropagation()} data-testid="paperwork-profile-drawer"
            style={{width:"min(780px,100%)",maxHeight:"90vh",overflowY:"auto",borderRadius:24,
              background:"#fff",boxShadow:"0 24px 80px rgba(0,0,0,0.55)",display:"flex",flexDirection:"column"}}>
            {/* Dark header */}
            <div style={{borderRadius:"24px 24px 0 0",padding:"24px 28px 20px",
              background:`linear-gradient(135deg,#0A1628 0%,${G.deep} 60%,#0D4D47 100%)`,
              flexShrink:0,position:"sticky",top:0,zIndex:2}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <p style={{fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:`${G.light}E6`,fontSize:10,marginBottom:5}}>
                    ✦ PROTECT {petName.toUpperCase()}'S SAFETY PROFILE
                  </p>
                  <p style={{color:"rgba(255,255,255,0.50)",fontSize:12}}>
                    {liveScore>=80?`${petName} is well protected`
                      :liveScore>=50?`${petName}'s profile needs a few more steps`
                      :`${petName}'s safety profile is incomplete — let's fix this`}
                  </p>
                </div>
                <div style={{display:"flex",alignItems:"flex-end",gap:2}}>
                  <span style={{fontSize:72,fontWeight:900,lineHeight:1,color:liveScore>=80?G.light:G.pale,textShadow:`0 0 20px ${G.light}80`}}>{liveScore}</span>
                  <span style={{color:"rgba(255,255,255,0.40)",fontSize:18,marginBottom:8}}>%</span>
                </div>
              </div>
              <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,0.10)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${liveScore||0}%`,borderRadius:5,background:`linear-gradient(90deg,${G.teal},${G.light})`,transition:"width 0.9s ease-out"}}/>
              </div>
              <button onClick={() => setDrawerOpen(false)} data-testid="paperwork-profile-close"
                style={{position:"absolute",top:16,right:20,background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",color:"rgba(255,255,255,0.70)"}}>✕</button>
            </div>

            {/* Body */}
            <div style={{padding:"24px 28px",background:"#fff"}}>
              {/* Missing docs alert */}
              {missing.length>0 && (
                <div style={{background:"#FFF3E0",border:"1px solid #FFCC80",borderRadius:12,padding:"12px 16px",marginBottom:18}}>
                  <p style={{fontSize:12,fontWeight:700,color:"#E65100",marginBottom:6}}>⚠ Missing for {petName}:</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {missing.map(m=><span key={m} style={{fontSize:11,fontWeight:600,color:"#BF360C",background:"#FFEBEE",border:"1px solid #EF9A9A",borderRadius:20,padding:"3px 10px"}}>{m}</span>)}
                  </div>
                </div>
              )}
              {/* Questions */}
              {remaining.length===0 ? (
                <div style={{textAlign:"center",padding:"24px 0"}}>
                  <div style={{fontSize:28,marginBottom:10}}>✦</div>
                  <p style={{fontSize:14,fontWeight:700,color:G.darkText}}>{petName}'s safety profile is complete!</p>
                  <p style={{fontSize:12,color:"#888"}}>Mira has everything needed to keep {petName} protected.</p>
                </div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(320px,100%),1fr))",gap:14}}>
                  {remaining.slice(0,6).map(q => {
                    const qAns=answers[q.id]||[], isSaved=saved[q.id], isSend=submitting[q.id], hasAns=qAns.length>0;
                    const label=q.question.replace(/{name}/g,petName);
                    if(isSaved) return (
                      <div key={q.id} style={{borderRadius:14,padding:16,background:G.pale,border:`2px solid ${G.light}60`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,minHeight:100}}>
                        <Check size={18} style={{color:G.teal}}/>
                        <p style={{fontWeight:700,color:G.teal,fontSize:13,textAlign:"center"}}>Safety profile updated!</p>
                        <div style={{borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,background:G.pale,color:G.mid}}>+{q.pts} pts</div>
                      </div>
                    );
                    return (
                      <div key={q.id} style={{borderRadius:14,padding:"14px 16px 12px",background:"#fff",border:`1.5px solid ${G.borderLight}`}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                          <span style={{fontSize:10,fontWeight:600,color:G.mutedText}}>{q.chapter}</span>
                          <span style={{borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,background:G.pale,color:G.teal}}>+{q.pts} pts</span>
                        </div>
                        <p style={{fontWeight:700,fontSize:13,color:G.darkText,marginBottom:10,lineHeight:1.4}}>{label}</p>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                          {q.options.map(opt=>{
                            const sel=qAns[0]===opt;
                            return(
                              <button key={opt} onClick={e=>{e.stopPropagation();e.preventDefault();toggle(q.id,opt);}}
                                style={{borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:sel?700:400,cursor:"pointer",background:sel?G.pale:"#F5F5F5",border:sel?`1.5px solid ${G.teal}`:"1px solid #E0E0E0",color:sel?G.teal:"#555",transition:"all 0.12s"}}>
                                {opt.replace(/{name}/g,petName)}
                              </button>
                            );
                          })}
                        </div>
                        <button onClick={e=>{e.stopPropagation();e.preventDefault();save(q);}} disabled={isSend||!hasAns}
                          style={{width:"100%",borderRadius:10,padding:"9px",fontSize:12,fontWeight:700,color:"#fff",border:"none",cursor:isSend?"wait":!hasAns?"not-allowed":"pointer",background:!hasAns?`${G.teal}44`:`linear-gradient(135deg,${G.teal},${G.mid})`,opacity:isSend?0.7:1}}>
                          {isSend?"Saving…":`Save +${q.pts} pts`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── MIRA PICKS SECTION ─────────────────────────────────────
function MiraPicksSection({ pet }) {
  const [picks,       setPicks]       = useState([]);
  const [picksLoading,setPicksLoading]= useState(true);
  const [selectedPick,setSelectedPick]= useState(null);
  const { token } = useAuth();
  const petName = pet?.name||"your dog";
  const { note, orderCount, topInterest } = useMiraIntelligence(pet?.id, token);
  const intelligenceLine = getMiraIntelligenceSubtitle(petName, note, orderCount, topInterest);

  // Mira Imagines — PET FIRST, BREED NEXT
  const breedLabel = pet?.breed ? pet.breed.split("(")[0].trim() : "";
  const stage = isPuppy(pet)?"Puppy":isSenior(pet)?"Senior":"Adult";
  const miraImagines = [
    { id:"paper-imagine-1", emoji:"🪪", name:`${petName}'s ${stage} Safety Kit`, description:`${breedLabel||petName}'s complete document holder — ID tag, microchip card, vaccination folder, emergency contact card.` },
    breedLabel
      ? { id:"paper-imagine-2", emoji:"📚", name:`${breedLabel} Care Guide Book`, description:`Everything specific to ${breedLabel}s — breed health risks, care tips, training approach, printed and bound.` }
      : { id:"paper-imagine-2", emoji:"📋", name:`${petName}'s Document Organiser`, description:`A5 waterproof wallet for all ${petName}'s documents — vaccination, microchip, insurance, emergency.` },
    { id:"paper-imagine-3", emoji:"🛡️", name:`${petName}'s Insurance Review`, description:`Mira compares pet insurance policies for ${petName}'s breed, age and health — free concierge-arranged.` },
  ];

  useEffect(()=>{
    if(!pet?.id){setPicksLoading(false);return;}
    setPicks([]); setPicksLoading(true);
    const breed = encodeURIComponent((pet?.breed||"").toLowerCase().trim());
    fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=paperwork&limit=12&min_score=60&breed=${breed}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        const filtered=filterBreedProducts(d?.picks||[], pet?.breed);
        if(filtered.length) setPicks(filtered.slice(0,12));
        setPicksLoading(false);
      })
      .catch(()=>setPicksLoading(false));
  },[pet?.id, pet?.breed]);

  return (
    <section style={{marginBottom:28}} data-testid="paperwork-mira-picks">
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}>
        <h3 style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:G.darkText,margin:0,fontFamily:"Georgia,serif"}}>
          Mira's Picks for <span style={{color:G.teal}}>{petName}</span>
        </h3>
        <span style={{fontSize:11,background:`linear-gradient(135deg,${G.teal},${G.mid})`,color:"#fff",borderRadius:20,padding:"2px 10px",fontWeight:700}}>
          {picks.length>0?"AI Scored":"Pet Specific"}
        </span>
      </div>
      <p style={{fontSize:13,color:"#888",marginBottom:16,lineHeight:1.5}}>{intelligenceLine}</p>

      {/* 3 imagines as teaser when no picks */}
      {!picksLoading && picks.length===0 && (
        <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none",marginBottom:8}}>
          {miraImagines.map(item=>(
            <MiraImaginesCard key={item.id} item={item} pet={pet} token={token} pillar="paperwork"/>
          ))}
        </div>
      )}
      {picksLoading && (
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",color:G.mutedText}}>
          <Loader2 size={14} style={{animation:"spin 1s linear infinite",color:G.teal}}/>
          <span style={{fontSize:12}}>Mira is reviewing {petName}'s safety picks…</span>
        </div>
      )}
      {!picksLoading && picks.length>0 && (
        <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:10,scrollbarWidth:"thin"}}>
          {picks.map((pick,i)=>{
            const img=[pick.image_url,pick.image,...(pick.images||[])].find(u=>u&&u.startsWith("http"))||null;
            const score=pick.mira_score||0;
            const scoreColor=score>=80?"#16A34A":score>=70?G.teal:"#6B7280";
            return(
              <div key={pick.id||i} style={{flexShrink:0,width:168,background:"#fff",borderRadius:14,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",cursor:"pointer",transition:"transform 0.15s"}}
                onClick={()=>setSelectedPick(pick)}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px rgba(13,148,136,0.12)`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
                <div style={{width:"100%",height:130,background:G.cream,overflow:"hidden",position:"relative"}}>
                  {img?<img src={img} alt={pick.name||""} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
                      :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${G.deep},${G.teal})`,color:"#fff",fontSize:12,fontWeight:700,padding:8,textAlign:"center"}}>{(pick.name||"").slice(0,18)}</div>}
                  <span style={{position:"absolute",top:7,left:7,fontSize:9,fontWeight:700,background:G.teal,color:"#fff",borderRadius:20,padding:"2px 7px"}}>PRODUCT</span>
                </div>
                <div style={{padding:"10px 11px 12px"}}>
                  <div style={{fontSize:12,fontWeight:700,color:G.darkText,lineHeight:1.3,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{pick.name||"—"}</div>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
                    <div style={{flex:1,height:4,background:G.pale,borderRadius:4,overflow:"hidden"}}><div style={{width:`${score}%`,height:"100%",background:scoreColor,borderRadius:4}}/></div>
                    <span style={{fontSize:10,fontWeight:800,color:scoreColor,minWidth:26}}>{score}</span>
                  </div>
                  {pick.mira_reason&&<p style={{fontSize:10,color:"#888",lineHeight:1.4,margin:0,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",fontStyle:"italic"}}>{pick.mira_reason}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedPick && <ProductDetailModal product={selectedPick} pillar="paperwork" selectedPet={pet} onClose={()=>setSelectedPick(null)}/>}
    </section>
  );
}

// ─── DIM EXPANDED ───────────────────────────────────────────
function DimExpanded({ dim, pet, onClose, apiProducts={}, services=[], onBook }) {
  const petName  = pet?.name||"your dog";
  const [dimTab, setDimTab]    = useState("products");
  const [activeTab, setActiveTab] = useState("All");

  const catName  = DIM_ID_TO_CATEGORY[dim.id]||"Identity & Safety";
  const catData  = apiProducts[catName]||{};
  const allRaw   = filterBreedProducts(
    Object.values(catData).flat().filter(p=>{
      const sub=(p.sub_category||"").toLowerCase();
      if(dim.id==="soul")    return sub==="soul"||p.category?.includes("passport_holder");
      if(dim.id==="breeds")  return sub==="breed_guides"||p.category?.includes("care_guide");
      return sub===dim.id||p.category===dim.id;
    }), pet?.breed);

  const subCats  = [...new Set(allRaw.map(p=>p.sub_category).filter(Boolean))];
  const products = activeTab==="All"?allRaw:allRaw.filter(p=>p.sub_category===activeTab);
  const dimSvcs  = services.filter(s=>s.dim===dim.id||s.category===dim.id).slice(0,6);
  const tabs     = [{id:"products",label:"📦 Products"},{id:"services",label:"📋 Services"},{id:"advisory",label:"💡 Advisory"}];

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
          {subCats.length>0&&(
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
                <SharedProductCard key={p.id||p._id} product={p} pillar="paperwork" selectedPet={pet}/>
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
              <div style={{fontSize:28,marginBottom:8}}>📋</div>
              <p style={{marginBottom:16}}>Book {dim.label} assistance for {petName}</p>
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

// ─── SERVICE BOOKING MODAL ──────────────────────────────────
function ServiceBookingModal({ service, pet, token, onClose }) {
  const [step,     setStep]     = useState(1);
  const [choice,   setChoice]   = useState("");
  const [schedule, setSchedule] = useState("");
  const [notes,    setNotes]    = useState("");
  const [sent,     setSent]     = useState(false);
  const [sending,  setSending]  = useState(false);
  const petName = pet?.name||"your dog";
  const miraText = (service.miraKnows||"").replace(/{petName}/g,petName).replace(/{petname}/gi,petName);

  if(sent) return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(480px,100%)",background:"#fff",borderRadius:20,padding:"40px 32px",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${G.teal},${G.mid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 20px"}}>✦</div>
        <div style={{fontSize:20,fontWeight:700,color:G.darkText,fontFamily:"Georgia,serif",marginBottom:8}}>Request Sent to Concierge®</div>
        <div style={{fontSize:14,color:G.mutedText,lineHeight:1.7,marginBottom:20}}>Your {service.name.toLowerCase()} request for {petName} has been received. Our team will contact you within 2 hours.</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:G.pale,border:`1px solid ${G.border}`,borderRadius:20,padding:"6px 16px",fontSize:13,color:G.teal,fontWeight:600,marginBottom:20}}>📥 Added to your Inbox</div>
        <div><button onClick={onClose} style={{background:G.teal,color:"#fff",border:"none",borderRadius:12,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button></div>
      </div>
    </div>
  );

  const send = async () => {
    setSending(true);
    try {
      const user=JSON.parse(localStorage.getItem("user")||"{}");
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`,{
        method:"POST", headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({parent_id:user?.id||user?.email||"guest",pet_id:pet?.id||"unknown",pillar:"paperwork",intent_primary:"service_booking",channel:"paperwork_book_session",initial_message:{sender:"parent",text:`I'd like to book ${service.name} for ${petName}. Choice: ${choice}. Schedule: ${schedule}. ${notes?'Notes: '+notes:''}`}}),
      });
    } catch{}
    setSending(false); setSent(true);
  };

  const totalSteps = service.steps||2;
  const canNext = [!!choice, !!schedule, true][step-1];

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(500px,100%)",maxHeight:"90vh",background:"#fff",borderRadius:16,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:`linear-gradient(135deg,${service.accentColor},${service.accentColor}CC)`,padding:"18px 22px 14px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.20)",borderRadius:20,padding:"3px 10px",fontSize:11,color:"#fff",fontWeight:500}}>{service.icon} {service.name}</div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.20)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#fff",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          <div style={{fontSize:18,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif",marginBottom:3}}>{service.name} for {petName}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.70)"}}>Personalised by Mira · arranged by Concierge®</div>
          <div style={{height:4,background:"rgba(255,255,255,0.25)",borderRadius:4,overflow:"hidden",marginTop:8,marginBottom:4}}>
            <div style={{height:"100%",width:`${(step/totalSteps)*100}%`,background:"#fff",borderRadius:4,transition:"width 0.3s"}}/>
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.70)"}}>Step {step} of {totalSteps}</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>
          {/* Pet badge */}
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",marginBottom:14,borderBottom:`1px solid ${G.pale}`}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${G.pale},${G.light})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,overflow:"hidden",flexShrink:0}}>
              {(pet?.photo_url||pet?.avatar_url)?<img src={pet.photo_url||pet.avatar_url} alt={petName} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span>{pet?.avatar||"🐕"}</span>}
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:G.darkText}}>For {petName}</div>
              {pet?.breed&&<div style={{fontSize:12,color:G.teal}}>{pet.breed}</div>}
            </div>
          </div>
          {miraText && (
            <div style={{background:G.pale,border:`1px solid ${G.border}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"flex-start",gap:8,marginBottom:18}}>
              <span style={{fontSize:14,flexShrink:0}}>✦</span>
              <div style={{fontSize:13,color:G.mid}}><strong style={{color:G.darkText}}>Mira knows: </strong>{miraText}</div>
            </div>
          )}
          {step===1 && (
            <>
              <div style={{fontSize:14,fontWeight:700,color:G.darkText,marginBottom:12}}>What does {petName} need from this?</div>
              {["Getting started — first time","Need to renew / update","Have an issue to resolve","Just want guidance","Want the full package"].map(o=>(
                <div key={o} onClick={()=>setChoice(o)}
                  style={{background:choice===o?G.pale:"#fff",border:`1.5px solid ${choice===o?G.teal:"rgba(13,148,136,0.20)"}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,transition:"all 0.12s"}}>
                  <span style={{fontSize:14,fontWeight:500,color:G.darkText}}>{o}</span>
                  {choice===o&&<span style={{color:G.teal,fontWeight:700}}>✓</span>}
                </div>
              ))}
            </>
          )}
          {step===2 && (
            <>
              <div style={{fontSize:14,fontWeight:700,color:G.darkText,marginBottom:12}}>When works best?</div>
              {["Weekday mornings","Weekday evenings","Weekend mornings","Weekend afternoons","Flexible — Concierge recommends"].map(o=>(
                <div key={o} onClick={()=>setSchedule(o)}
                  style={{background:schedule===o?G.pale:"#fff",border:`1.5px solid ${schedule===o?G.teal:"rgba(13,148,136,0.20)"}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,transition:"all 0.12s"}}>
                  <span style={{fontSize:14,fontWeight:500,color:G.darkText}}>{o}</span>
                  {schedule===o&&<span style={{color:G.teal,fontWeight:700}}>✓</span>}
                </div>
              ))}
            </>
          )}
          {step===3 && (
            <>
              <div style={{fontSize:14,fontWeight:700,color:G.darkText,marginBottom:8}}>Mira's on it ✦</div>
              <div style={{background:G.pale,borderRadius:12,padding:"14px",marginBottom:16,fontSize:13,color:G.darkText,lineHeight:1.6}}>
                Our concierge will contact you within 2 hours to arrange {petName}'s {service.name.toLowerCase()}.
                <div style={{fontSize:12,color:G.teal,marginTop:8}}>{choice} · {schedule} · {service.price}</div>
              </div>
              <textarea placeholder={`Any notes for Mira? (optional)`} value={notes} onChange={e=>setNotes(e.target.value)}
                style={{width:"100%",border:`1.5px solid ${G.border}`,borderRadius:10,padding:"11px 14px",fontSize:13,color:G.darkText,outline:"none",resize:"none",minHeight:80,boxSizing:"border-box"}}/>
            </>
          )}
        </div>
        <div style={{padding:"0 22px 18px",flexShrink:0}}>
          <div style={{display:"flex",gap:10,paddingTop:12,borderTop:`1px solid ${G.pale}`}}>
            {step>1&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,background:"#fff",border:`1.5px solid ${G.border}`,borderRadius:12,padding:"12px",fontSize:13,fontWeight:600,color:G.teal,cursor:"pointer"}}>← Back</button>}
            <button onClick={step===totalSteps?send:()=>setStep(s=>s+1)} disabled={!canNext||sending}
              style={{flex:2,background:!canNext?`${G.teal}44`:`linear-gradient(135deg,${G.teal},${G.mid})`,color:!canNext?"#999":"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:800,cursor:!canNext?"not-allowed":"pointer"}}>
              {sending?"Sending…":step===totalSteps?"✦ Send to Concierge®":"Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAPERWORK CONCIERGE MODAL (main booking, Care-style) ────
function PaperworkConciergeModal({ isOpen, onClose, petName, petId, token }) {
  const [selected, setSelected] = useState("");
  const [date,     setDate]     = useState("");
  const [notSure,  setNotSure]  = useState(false);
  const [notes,    setNotes]    = useState("");
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);

  useEffect(() => { if(isOpen){setSelected("");setSent(false);setDate("");setNotSure(false);setNotes("");} }, [isOpen]);
  if(!isOpen) return null;

  const handleSend = async () => {
    if(!selected||sending) return;
    setSending(true);
    try {
      const user=JSON.parse(localStorage.getItem("user")||"{}");
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`,{
        method:"POST", headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({parent_id:user?.id||user?.email||"guest",pet_id:petId||"unknown",pillar:"paperwork",intent_primary:"concierge_booking",channel:"paperwork_concierge_modal",initial_message:{sender:"parent",text:`I'd like help with: ${selected}. ${notSure?"Date: flexible.":"Date: "+(date||"TBC")+"."}${notes?" Notes: "+notes:""}`}}),
      });
    } catch{}
    setSending(false); setSent(true);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.50)",zIndex:10006,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:32,maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto",position:"relative"}}>
        {sent ? (
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${G.teal},${G.mid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}>✦</div>
            <h3 style={{fontSize:18,fontWeight:800,color:G.darkText,marginBottom:10}}>Request sent to Concierge®</h3>
            <p style={{fontSize:14,color:G.mutedText,marginBottom:24}}>Our team will contact you within 48 hours. ✦</p>
            <button onClick={onClose} style={{background:G.teal,color:"#fff",border:"none",borderRadius:12,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button>
          </div>
        ) : (
          <>
            <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:18}}>✕</button>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:G.pale,border:`1px solid ${G.border}`,borderRadius:9999,padding:"4px 14px",marginBottom:20}}>
              <span style={{fontSize:11,fontWeight:600,color:G.teal,letterSpacing:"0.06em",textTransform:"uppercase"}}>★ {petName}'s Paperwork Concierge</span>
            </div>
            <h2 style={{fontSize:22,fontWeight:800,color:G.darkText,fontFamily:"Georgia,serif",lineHeight:1.2,marginBottom:8}}>
              What should <span style={{color:G.teal}}>{petName}</span>'s documents look like?
            </h2>
            <p style={{fontSize:14,color:"#888",marginBottom:24}}>Three questions. Then your Concierge takes over.</p>
            <p style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:12}}>What are we handling?</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
              {["Pet registration","Microchipping","Pet passport","Insurance review","Claim filing","Vaccination records","Life planning","New puppy prep","Society housing rules","International travel"].map(opt=>(
                <button key={opt} onClick={()=>setSelected(opt)}
                  style={{borderRadius:9999,padding:"8px 16px",fontSize:13,cursor:"pointer",transition:"all 0.15s",background:selected===opt?G.pale:"#fff",border:`1.5px solid ${selected===opt?G.teal:"rgba(13,148,136,0.25)"}`,color:selected===opt?G.teal:"#555"}}>
                  {opt}
                </button>
              ))}
            </div>
            <p style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:12}}>When?</p>
            <div style={{display:"flex",gap:10,marginBottom:24}}>
              <input type="date" value={date} onChange={e=>{setDate(e.target.value);setNotSure(false);}} disabled={notSure}
                style={{flex:1,border:`1.5px solid ${G.border}`,borderRadius:12,padding:"12px 14px",fontSize:14,color:G.darkText,outline:"none",background:notSure?"#F5F5F5":"#fff"}}/>
              <button onClick={()=>{setNotSure(n=>!n);setDate("");}}
                style={{borderRadius:12,padding:"12px 16px",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap",background:notSure?G.pale:"#fff",border:`1.5px solid ${notSure?G.teal:G.border}`,color:notSure?G.teal:"#555"}}>
                Not sure yet
              </button>
            </div>
            <p style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:10}}>Anything about {petName} we should know?</p>
            <textarea placeholder="Optional — breed, age, specific requirements…" value={notes} onChange={e=>setNotes(e.target.value)}
              style={{width:"100%",border:`1.5px solid ${G.border}`,borderRadius:12,padding:"12px 14px",fontSize:13,color:G.darkText,outline:"none",resize:"none",minHeight:80,marginBottom:24,boxSizing:"border-box"}}/>
            <button onClick={handleSend} disabled={!selected||sending}
              style={{width:"100%",background:!selected?`${G.teal}44`:`linear-gradient(135deg,${G.teal},${G.mid})`,color:!selected?"#999":"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:800,cursor:!selected?"not-allowed":"pointer"}}>
              {sending?"Sending…":`✦ Send to ${petName}'s Concierge`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── LOADING / NO PET ───────────────────────────────────────
function LoadingState() {
  return (
    <div style={{textAlign:"center",padding:"80px 20px"}}>
      <div style={{width:48,height:48,borderRadius:"50%",background:MIRA_ORB,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff"}}>✦</div>
      <div style={{fontSize:16,color:G.darkText,fontWeight:600}}>Preparing <span style={{color:G.teal}}>{"{petName}'s safety documents…"}</span></div>
    </div>
  );
}
function NoPetState({ onAddPet }) {
  return (
    <div style={{textAlign:"center",padding:"80px 20px"}}>
      <div style={{fontSize:48,marginBottom:16}}>📋</div>
      <div style={{fontSize:18,fontWeight:800,color:G.darkText,marginBottom:8}}>Add a pet to manage documents</div>
      <p style={{fontSize:14,color:G.mutedText,marginBottom:24}}>Mira keeps every document, record and certificate organised.</p>
      <button onClick={onAddPet} style={{background:`linear-gradient(135deg,${G.teal},${G.mid})`,color:"#fff",border:"none",borderRadius:9999,padding:"12px 28px",fontSize:16,fontWeight:600,cursor:"pointer"}}>Add your dog →</button>
    </div>
  );
}

// ─── DOCUMENT COMPLETENESS BAR ──────────────────────────────
function DocCompletenessBar({ pet, docScore }) {
  const petName = pet?.name||"your dog";
  const missing = getMissingDocs(pet);
  const msg = docScore>=80 ? `${petName} is fully protected ✦`
    : docScore>=50 ? `${petName} needs ${missing.length} more step${missing.length>1?"s":""}`
    : `${petName}'s safety profile needs attention`;
  const barColor = docScore>=80 ? G.teal : docScore>=50 ? "#FF8F00" : "#C62828";
  return (
    <div style={{background:"#fff",border:`1.5px solid ${G.borderLight}`,borderRadius:14,padding:"16px 20px",marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:13,fontWeight:700,color:G.darkText}}>Document Completeness</span>
        <span style={{fontSize:20,fontWeight:900,color:barColor}}>{docScore}%</span>
      </div>
      <div style={{height:6,background:`${barColor}22`,borderRadius:6,overflow:"hidden",marginBottom:8}}>
        <div style={{height:"100%",width:`${docScore}%`,background:barColor,borderRadius:6,transition:"width 1s"}}/>
      </div>
      <div style={{fontSize:12,color:docScore>=80?G.teal:docScore>=50?"#E65100":"#C62828",fontWeight:600}}>{msg}</div>
      {missing.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:10}}>
          {missing.map(m=>(
            <span key={m} style={{fontSize:10,fontWeight:600,color:"#C62828",background:"#FFEBEE",border:"1px solid #EF9A9A",borderRadius:20,padding:"2px 8px"}}>⚠ {m}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────
const PaperworkSoulPage = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated }                    = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();

  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("documents");
  const [openDim,       setOpenDim]       = useState(null);
  const [catModal,      setCatModal]      = useState(null);
  const [petData,       setPetData]       = useState(null);
  const [docScore,      setDocScore]      = useState(0);
  const [apiProducts,   setApiProducts]   = useState({});
  const [services,      setServices]      = useState([]);
  const [activeService, setActiveService] = useState(null);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [toastVisible,  setToastVisible]  = useState(false);
  const [toastSvc,      setToastSvc]      = useState("");
  const miraRef = useRef(null);

  const handleBook = useCallback((svc) => {
    if(!svc) return;
    const known = PAPER_SERVICES.find(s=>s.name===svc?.name||s.id===svc?.id);
    if(known) { setActiveService(known); return; }
    setConciergeOpen(true);
  }, []);

  // Load products + services
  useEffect(()=>{
    const CATS = ["Identity & Safety","Health Records","Travel Documents","Insurance & Finance","Breed & Advisory","Expert Advisory","Soul Documents"];
    Promise.all([
      ...CATS.map(cat => fetch(`${API_URL}/api/admin/pillar-products?pillar=paperwork&limit=100&category=${encodeURIComponent(cat)}`).then(r=>r.ok?r.json():null).catch(()=>null)),
      fetch(`${API_URL}/api/service-box/services?pillar=paperwork`).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(results=>{
      const svcData = results[results.length-1];
      if(svcData?.services) setServices(svcData.services);
      const grouped = {};
      results.slice(0,-1).forEach(data=>{
        (data?.products||[]).forEach(p=>{
          const c=p.category||"", s=p.sub_category||"";
          if(!grouped[c]) grouped[c]={};
          if(!grouped[c][s]) grouped[c][s]=[];
          grouped[c][s].push(p);
        });
      });
      setApiProducts(grouped);
    });
  },[]);

  useEffect(()=>{ if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]); if(contextPets!==undefined)setLoading(false); },[contextPets,currentPet,setCurrentPet]);
  useEffect(()=>{ if(currentPet){ const n={...currentPet,photo_url:currentPet.photo_url||currentPet.avatar_url||null,avatar:currentPet.avatar||"🐕",breed:currentPet.breed||currentPet.doggy_soul_answers?.breed||""}; setPetData(n); setDocScore(getDocScore(n)); } },[currentPet]);

  const handleAddPet = useCallback(()=>navigate(isAuthenticated?"/dashboard/pets?action=add":"/login?redirect=/paperwork"),[isAuthenticated,navigate]);

  if(loading)   return <PillarPageLayout pillar="paperwork" hideHero hideNavigation><LoadingState/></PillarPageLayout>;
  if(!petData)  return <PillarPageLayout pillar="paperwork" hideHero hideNavigation><NoPetState onAddPet={handleAddPet}/></PillarPageLayout>;

  const dims    = getPaperworkDims(petData);
  const petName = petData.name;
  const breed   = petData.breed||"";
  const missing = getMissingDocs(petData);

  // Category strip config
  const PAPER_CATS = [
    {id:"identity",  icon:"🪪", label:"Identity",       bg:"#EDE9FE", accent:"#1E293B"},
    {id:"health",    icon:"🏥", label:"Health Records", bg:"#E0F2FE", accent:"#0D9488"},
    {id:"travel",    icon:"✈️",  label:"Travel",         bg:"#E8F5E9", accent:"#1E293B"},
    {id:"insurance", icon:"🛡️", label:"Insurance",      bg:"#FFF3E0", accent:"#0D9488"},
    {id:"breeds",    icon:"📚", label:"Breed Guides",   bg:"#FFF8E1", accent:"#334155"},
    {id:"advisory",  icon:"💡", label:"Advisory",       bg:"#F3E5F5", accent:"#0D9488"},
    {id:"soul",      icon:"🌟", label:"Soul Docs",      bg:"#F0FDFA", accent:"#0D9488"},
    {id:"mira",      icon:"✦",  label:"Mira's Picks",   bg:"#E8EAF6", accent:"#1E293B"},
  ];

  return (
    <>
    <PillarPageLayout pillar="paperwork" hideHero hideNavigation>
      <Helmet>
        <title>Paperwork · {petName} · The Doggy Company</title>
        <meta name="description" content={`All of ${petName}'s documents, records and expert guidance — organised by Mira.`}/>
      </Helmet>

      {/* ── HERO (centered, Care-parity) ── */}
      <div style={{background:`linear-gradient(160deg,${G.deep} 0%,${G.mid} 55%,#0F766E 100%)`,padding:"28px 20px 0",position:"relative",overflow:"hidden",textAlign:"center"}}>
        {/* Mira ORB top-right */}
        <div style={{position:"absolute",top:20,right:20,width:44,height:44,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 0 24px rgba(155,89,182,0.50)"}}>✦</div>

        {/* Pet avatar + doc score badge */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:10}}>
          <div style={{width:80,height:80,borderRadius:"50%",overflow:"hidden",border:"3px solid rgba(255,255,255,0.30)",boxShadow:`0 0 0 3px rgba(13,148,136,0.40)`,background:`linear-gradient(135deg,${G.light},${G.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,color:"#fff"}}>
            {(petData?.photo_url||petData?.avatar_url)?<img src={petData.photo_url||petData.avatar_url} alt={petName} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>:<span>{petData?.avatar||"🐕"}</span>}
          </div>
          <div style={{marginTop:-8,background:`linear-gradient(135deg,${G.deep},${G.teal})`,borderRadius:20,padding:"3px 10px",fontSize:9,fontWeight:700,color:"#fff",border:"1.5px solid rgba(255,255,255,0.25)",whiteSpace:"nowrap"}}>
            Protected {docScore}%
          </div>
        </div>

        {/* Eyebrow chip */}
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(153,246,228,0.18)",borderRadius:20,padding:"4px 14px",marginBottom:14}}>
          <span style={{fontSize:11,color:G.light,fontWeight:700}}>
            {docScore>=80?`✦ ${petName} is fully protected — Mira has everything.`:`📋 Paperwork & Advisory · ${petName}`}
          </span>
        </div>

        {/* H1 */}
        <h1 style={{fontSize:"clamp(1.875rem,4vw,2.5rem)",fontWeight:900,color:"#fff",marginBottom:8,lineHeight:1.15,fontFamily:"Georgia,'Times New Roman',serif",textAlign:"center"}}>
          Keep <span style={{color:G.light}}>{petName}</span> safe,<br/>documented & protected
        </h1>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.72)",textAlign:"center",marginBottom:14,maxWidth:480,margin:"0 auto 14px",lineHeight:1.6}}>
          Identity, health, travel, insurance & expert advisory — all in one place, arranged by Mira.
        </p>

        {/* Profile chips */}
        <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,marginBottom:16}}>
          {breed&&<SoulChip icon="🐾" label="Breed" value={breed}/>}
          {petData?.vaccinated&&<SoulChip value="💉 Vaccinated"/>}
          {petData?.doggy_soul_answers?.microchipped&&<SoulChip value="🔬 Microchipped"/>}
          {petData?.doggy_soul_answers?.insurance&&<SoulChip value="🛡️ Insured"/>}
          {missing.length>0&&<SoulChip value={`⚠ ${missing.length} action${missing.length>1?"s":""} needed`}/>}
        </div>

        {/* Mira quote */}
        <div style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 18px",maxWidth:480,margin:"0 auto 16px",textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",flexShrink:0}}>✦</div>
            <div>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.85)",fontStyle:"italic",lineHeight:1.6,margin:0}}>
                "I keep {petName}'s documents organised, flag what's missing, and handle the paperwork so you don't have to."
              </p>
              <span style={{fontSize:11,color:G.light,fontWeight:600}}>♥ Mira knows {petName}</span>
            </div>
          </div>
        </div>

        {/* Scroll chevron */}
        <div style={{textAlign:"center",paddingBottom:6}}>
          <ChevronDown size={22} style={{color:"rgba(255,255,255,0.35)"}}/>
        </div>
      </div>

      {/* ── PAGE BODY ── */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8" style={{background:G.pageBg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

        {/* Category strip — Care-style icon+label pills */}
        <div style={{background:"#fff",borderBottom:`1px solid ${G.borderLight}`,position:"relative"}}>
          <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",padding:"8px 12px",gap:4}}>
            {PAPER_CATS.map(cat=>{
              const isActive = openDim===cat.id;
              return (
                <button key={cat.id} data-testid={`paperwork-cat-${cat.id}`}
                  onClick={()=>{
                    setCatModal(cat.id);
                  }}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,minWidth:82,height:72,padding:"10px 12px",cursor:"pointer",background:"transparent",border:"none",borderBottom:`3px solid ${isActive?G.teal:"transparent"}`,transition:"border-color 150ms ease"}}>
                  <div style={{width:34,height:34,borderRadius:10,background:cat.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:4,flexShrink:0}}>
                    {cat.icon}
                  </div>
                  <span style={{fontSize:10,fontWeight:isActive?700:500,color:isActive?G.teal:"#555",whiteSpace:"nowrap",maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",textAlign:"center",lineHeight:1.2}}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab bar — 3 tabs below strip */}
        <div style={{display:"flex",background:"#fff",borderBottom:`1.5px solid ${G.borderLight}`,marginBottom:24}}>
          {[
            {id:"documents", label:"📄 Documents & Products"},
            {id:"advisory",  label:"🧠 Book a Session"},
            {id:"find",      label:"📍 Find Help"},
          ].map(tab=>{
            const a=activeTab===tab.id;
            return (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                style={{flex:1,padding:"14px 4px",background:"none",border:"none",borderBottom:a?`3px solid ${G.teal}`:"3px solid transparent",color:a?G.teal:"#888",fontSize:13,fontWeight:a?700:500,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── DOCUMENTS TAB ── */}
        {activeTab==="documents" && (
          <>
            {/* Paperwork Profile (collapsed bar → modal) */}
            <div style={{marginBottom:20}}>
              <PaperworkProfile pet={petData} token={token}/>
            </div>

            {/* Doc completeness bar */}
            <DocCompletenessBar pet={petData} docScore={docScore}/>

            {/* Mira Picks */}
            <div ref={miraRef}><MiraPicksSection pet={petData}/></div>

            {/* Section heading */}
            <section style={{paddingBottom:16}}>
              <h2 style={{fontSize:"clamp(1.25rem,3vw,1.5rem)",fontWeight:800,color:G.darkText,marginBottom:6,fontFamily:"Georgia,'Times New Roman',serif"}}>
                What does <span style={{color:G.teal}}>{petName}</span> need protected?
              </h2>
              <p style={{fontSize:14,color:"#888",lineHeight:1.5}}>
                Choose a category — everything inside is organised for {petName}. <span style={{color:G.mid,fontWeight:600}}>Glowing ones need your attention.</span>
              </p>
            </section>

            {/* Dim cards — GuidedCarePaths-style 3-col */}
            <div style={{display:"grid",gap:16,marginBottom:32}} className="paperwork-dims-grid">
              <style>{`
                .paperwork-dims-grid{grid-template-columns:1fr}
                @media(min-width:560px){.paperwork-dims-grid{grid-template-columns:repeat(2,1fr)}}
                @media(min-width:900px){.paperwork-dims-grid{grid-template-columns:repeat(3,1fr)}}
              `}</style>
              {dims.map(dim=>{
                const isOpen = openDim===dim.id;
                return (
                  <div key={dim.id} style={{gridColumn:isOpen?"1 / -1":"auto"}}>
                    <div onClick={()=>setOpenDim(isOpen?null:dim.id)}
                      data-testid={`paperwork-dim-${dim.id}`}
                      style={{background:"#fff",borderRadius:isOpen?"16px 16px 0 0":16,cursor:"pointer",position:"relative",overflow:"hidden",border:isOpen?`2px solid ${G.teal}`:`2px solid ${G.borderLight}`,boxShadow:dim.glow&&!isOpen?`0 4px 24px ${dim.glowColor}`:"0 2px 8px rgba(0,0,0,0.06)",transition:"all 0.2s"}}>
                      <div style={{height:6,background:isOpen?G.teal:(dim.glowColor||G.mid),borderRadius:"16px 16px 0 0"}}/>
                      <div style={{padding:"20px 20px 18px"}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                          <div style={{width:52,height:52,borderRadius:14,background:dim.glow?`${G.teal}22`:G.pale,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{dim.icon}</div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                            <span style={{fontSize:10,fontWeight:700,borderRadius:20,padding:"3px 10px",background:`${dim.badgeBg}20`,color:dim.badgeBg,border:`1px solid ${dim.badgeBg}40`}}>{dim.badge}</span>
                            {dim.glow&&<div style={{width:8,height:8,borderRadius:"50%",background:G.light}}/>}
                          </div>
                        </div>
                        <h3 style={{fontSize:16,fontWeight:800,color:G.darkText,marginBottom:6,lineHeight:1.25,fontFamily:"Georgia,serif"}}>{dim.label}</h3>
                        <p style={{fontSize:13,color:G.mutedText,lineHeight:1.55,marginBottom:16,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{t(dim.sub,petName)}</p>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span style={{fontSize:12,color:G.teal,fontWeight:700}}>{isOpen?"Close ↑":"Explore →"}</span>
                          <span style={{fontSize:11,color:"#aaa"}}>Products · Services · Advisory</span>
                        </div>
                      </div>
                    </div>
                    {isOpen && <DimExpanded dim={dim} pet={petData} onClose={()=>setOpenDim(null)} apiProducts={apiProducts} services={services} onBook={handleBook}/>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── BOOK A SESSION TAB ── */}
        {activeTab==="advisory" && (
          <div style={{marginTop:24}}>
            <h2 style={{fontSize:"clamp(1.25rem,3vw,1.5rem)",fontWeight:800,color:G.darkText,marginBottom:4,fontFamily:"Georgia,serif"}}>
              Expert guidance for <span style={{color:G.teal}}>{petName}</span>
            </h2>
            <p style={{fontSize:13,color:"#888",marginBottom:20}}>Arranged by Concierge® — all sessions personalised for {petName}</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(240px,100%),1fr))",gap:14}}>
              {PAPER_SERVICES.map(svc=>{
                const accent = svc.accentColor||G.teal;
                const miraText = (svc.miraKnows||"").replace(/{petName}/g,petName);
                return (
                  <div key={svc.id} style={{background:"#fff",borderRadius:16,border:`2px solid rgba(13,148,136,0.12)`,overflow:"hidden",cursor:"pointer",transition:"all 0.15s",boxShadow:"0 2px 8px rgba(13,148,136,0.06)"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px ${accent}20`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 8px rgba(13,148,136,0.06)";}}>
                    <div style={{height:110,background:`linear-gradient(135deg,${G.pale},${G.cream})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>
                      {svc.icon}
                    </div>
                    <div style={{padding:"14px 16px 16px"}}>
                      <div style={{fontSize:10,color:G.mutedText,marginBottom:3}}>{t(svc.tagline,petName)}</div>
                      <div style={{fontSize:14,fontWeight:800,color:G.darkText,marginBottom:3}}>{svc.name}</div>
                      <div style={{fontSize:11,color:"#888",lineHeight:1.45,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{t(svc.desc,petName)}</div>
                      {miraText&&(
                        <div style={{background:G.pale,border:`1px solid ${G.border}`,borderRadius:8,padding:"6px 10px",marginBottom:8,display:"flex",alignItems:"flex-start",gap:5}}>
                          <span style={{fontSize:11,color:G.teal,flexShrink:0}}>✦</span>
                          <span style={{fontSize:10,color:G.mid,lineHeight:1.4}}>{miraText}</span>
                        </div>
                      )}
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:14,fontWeight:800,color:G.deep}}>{svc.price}</span>
                        <button onClick={()=>handleBook(svc)}
                          style={{background:`linear-gradient(135deg,${accent},${G.mid})`,color:"#fff",border:"none",borderRadius:20,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                          Book →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FIND HELP TAB ── */}
        {activeTab==="find" && (
          <div style={{marginTop:8}}>
            <PaperworkNearMe pet={petData} onBook={handleBook}/>
          </div>
        )}

        {/* Service booking modal */}
        {activeService && <ServiceBookingModal service={activeService} pet={petData} token={token} onClose={()=>setActiveService(null)}/>}

        {/* Paperwork Concierge Modal */}
        <PaperworkConciergeModal
          isOpen={conciergeOpen}
          onClose={()=>setConciergeOpen(false)}
          petName={petName}
          petId={petData?.id}
          token={token}
        />
      </div>

      <ConciergeToast
        toast={toastVisible?{name:toastSvc,pillar:"paperwork"}:null}
        onClose={()=>setToastVisible(false)}
      />

      {/* Category pill content modal */}
      <PaperworkContentModal
        isOpen={!!catModal}
        onClose={()=>setCatModal(null)}
        category={catModal}
        pet={petData}
      />
    </PillarPageLayout>
    </>
  );
};

export default PaperworkSoulPage;
